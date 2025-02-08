import { processReading } from '@/services/n8nProcessor';
import { createWebSocketManager, } from '../services/websocketManager';
import { TemperatureReading } from '../types/temperature';
import { FastifyBaseLogger } from 'fastify';
import { createDatabaseService } from '@/services/database';


export const handleTemperature = async (
	reading: TemperatureReading,
	wsManager: ReturnType<typeof createWebSocketManager>,
	dbService: ReturnType<typeof createDatabaseService>,
	logger: FastifyBaseLogger
): Promise<void> => {
	let processEntry;
	try {
		// Create initial database entry
		processEntry = await dbService.createInitialEntry(reading);

		// Broadcast initial reading
		wsManager.broadcast({
			type: 'temperature_reading',
			payload: reading
		});

		// Process the reading
		const processedReading = await processReading(reading, logger);

		// Update database with processed data
		await dbService.updateProcessedReading(processEntry, processedReading);

		// Broadcast processed reading
		wsManager.broadcast({
			type: 'processed_reading',
			payload: processedReading
		});

		logger.info('Successfully processed reading:', processedReading);
	} catch (error) {
		logger.error('Failed to process temperature reading:', error);

		// Update database with error status if we have a process entry
		if (processEntry) {
			await dbService.handleProcessingError(
				processEntry,
				error instanceof Error ? error : new Error(String(error))
			);
		}

		// Broadcast error to clients
		wsManager.broadcast({
			type: 'error',
			payload: 'Failed to process temperature reading'
		});
	}
};

