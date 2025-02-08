import { FastifyPluginAsync } from 'fastify';
import { createWebSocketManager } from '../services/websocketManager';
import { handleTemperature } from '../handlers/temperatureHandler';
import { startGenerator, stopGenerator } from '@/services/temperatureGenerator';
import { config } from '@/config/env';
import { createDatabaseService } from '../services/database';

const websocketRoutes: FastifyPluginAsync = async (fastify) => {
	// Log n8n configuration on startup
	fastify.log.info('N8N Configuration:', {
		webhookUrl: config.N8N_WEBHOOK_URL,
		host: process.env.N8N_HOST,
		port: process.env.N8N_PORT
	});

	const wsManager = createWebSocketManager(fastify.log);
	const dbService = createDatabaseService(fastify.log);

	fastify.get('/ws', {
		websocket: true,
		schema: {
			description: 'Main WebSocket endpoint',
			tags: ['websocket']
		}
	}, (connection, _) => {
		wsManager.addClient(connection);

		if (wsManager.getClientCount() === 1) {
			fastify.log.info('Starting temperature generator');
			startGenerator((reading) => {
				handleTemperature(reading, wsManager, dbService, fastify.log).catch(error => {
					fastify.log.error('Failed to process temperature reading:', error);
				});
			});
		}

		connection.on('close', () => {
			wsManager.removeClient(connection);
			if (wsManager.getClientCount() === 0) {
				fastify.log.info('Stopping temperature generator - no clients connected');
				stopGenerator();
			}
		});
	});

	fastify.addHook('onClose', () => {
		stopGenerator();
	});
};

export default websocketRoutes;
