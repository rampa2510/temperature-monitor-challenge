import { processReading } from '@/services/n8nProcessor';
import { createWebSocketManager, } from '../services/websocketManager';
import { TemperatureReading } from '../types/temperature';
import { FastifyBaseLogger } from 'fastify';

export const handleTemperature = async (
	reading: TemperatureReading,
	wsManager: ReturnType<typeof createWebSocketManager>,
	logger: FastifyBaseLogger
): Promise<void> => {
	try {
		// Broadcast initial reading
		wsManager.broadcast({
			type: 'temperature_reading',
			payload: reading
		});

		// Process the reading
		const processedReading = await processReading(reading, logger);

		// Broadcast processed reading
		wsManager.broadcast({
			type: 'processed_reading',
			payload: processedReading
		});

		logger.info('Successfully processed reading:', processedReading);
	} catch (error) {
		logger.error('Failed to process temperature reading:', error);
		wsManager.broadcast({
			type: 'error',
			payload: 'Failed to process temperature reading'
		});
	}
};
