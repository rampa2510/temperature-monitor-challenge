import { FastifyBaseLogger } from 'fastify';
import { ProcessEntry, IProcessEntry } from '../models/ProcessEntry';
import { ProcessLog } from '../models/ProcessLog';
import { TemperatureReading, ProcessedReading } from '../types/temperature';

export const createDatabaseService = (logger: FastifyBaseLogger) => {
	const createInitialEntry = async (reading: TemperatureReading): Promise<IProcessEntry> => {
		try {
			// Create the process entry first
			const entry = await ProcessEntry.create({
				temperature: reading.temperature,
				timestamp: new Date(reading.timestamp),
				status: 'active',
				metadata: { readingId: reading.id }
			});

			// For initial entry, we'll use a special oldValue that indicates it's a new entry
			await ProcessLog.create({
				processEntryId: entry._id,
				changeType: 'temperature',
				oldValue: { type: 'initial_reading' },  // Use an object instead of null
				newValue: { temperature: reading.temperature },
				timestamp: new Date(reading.timestamp)
			});

			logger.info('Created initial process entry:', { entryId: entry._id });
			return entry;
		} catch (error) {
			logger.error('Error creating process entry:', error);
			throw error;
		}
	};

	const updateProcessedReading = async (
		originalEntry: IProcessEntry,
		processedReading: ProcessedReading
	): Promise<void> => {
		try {
			// Update the process entry
			const oldStatus = originalEntry.status;
			const oldMetadata = originalEntry.metadata || {};

			await ProcessEntry.findByIdAndUpdate(originalEntry._id, {
				status: 'completed',
				metadata: {
					...oldMetadata,
					processedAt: processedReading.processedAt,
					temperatureStatus: processedReading.status
				}
			});

			// Create logs for the changes
			await ProcessLog.create([
				{
					processEntryId: originalEntry._id,
					changeType: 'status',
					oldValue: { status: oldStatus },
					newValue: { status: 'completed' },
					timestamp: new Date()
				},
				{
					processEntryId: originalEntry._id,
					changeType: 'metadata',
					oldValue: { metadata: oldMetadata },
					newValue: {
						metadata: {
							...oldMetadata,
							processedAt: processedReading.processedAt,
							temperatureStatus: processedReading.status
						}
					},
					timestamp: new Date()
				}
			]);

			logger.info('Updated process entry with processed data:', {
				entryId: originalEntry._id,
				status: processedReading.status
			});
		} catch (error) {
			logger.error('Error updating process entry:', error);
			throw error;
		}
	};

	const handleProcessingError = async (
		entry: IProcessEntry,
		error: Error
	): Promise<void> => {
		try {
			const oldStatus = entry.status;
			const oldMetadata = entry.metadata || {};

			await ProcessEntry.findByIdAndUpdate(entry._id, {
				status: 'error',
				metadata: {
					...oldMetadata,
					error: error.message,
					errorTimestamp: new Date()
				}
			});

			await ProcessLog.create({
				processEntryId: entry._id,
				changeType: 'status',
				oldValue: { status: oldStatus },
				newValue: { status: 'error' },
				timestamp: new Date()
			});

			logger.info('Updated process entry with error status:', {
				entryId: entry._id,
				error: error.message
			});
		} catch (dbError) {
			logger.error('Error updating process entry with error status:', dbError);
			throw dbError;
		}
	};

	return {
		createInitialEntry,
		updateProcessedReading,
		handleProcessingError
	};
};
