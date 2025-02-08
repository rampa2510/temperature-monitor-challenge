import { config } from '@/config/env';
import { startGenerator, stopGenerator } from '@/services/temperatureGenerator';
import { FastifyPluginAsync } from 'fastify';
import { WebSocket } from 'ws';

interface WSMessage {
	type: string;
	payload: any;
}

interface TemperatureReading {
	id: string;
	temperature: number;
	timestamp: string;
}

interface ProcessedReading extends TemperatureReading {
	status: 'NORMAL' | 'HIGH';
	processedAt: string;
}

const N8N_AUTH = 'Basic dGVzdDp0ZXN0'; // test:test in base64

const websocketRoutes: FastifyPluginAsync = async (fastify) => {
	// Log n8n configuration on startup
	fastify.log.info('N8N Configuration:', {
		webhookUrl: config.N8N_WEBHOOK_URL,
		host: process.env.N8N_HOST,
		port: process.env.N8N_PORT
	});

	const connectedClients = new Set<WebSocket>();

	function broadcast(data: any) {
		const message = JSON.stringify(data);
		fastify.websocketServer.clients.forEach(client => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(message);
			}
		});
	}

	async function processTemperatureReading(reading: TemperatureReading) {
		try {
			// First broadcast the initial reading
			broadcast({
				type: 'temperature_reading',
				payload: reading
			});

			fastify.log.info('Sending request to n8n:', {
				url: config.N8N_WEBHOOK_URL,
				reading
			});

			// Add timeout to fetch request
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 5000);

			const response = await fetch(config.N8N_WEBHOOK_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': N8N_AUTH
				},
				body: JSON.stringify(reading),
				signal: controller.signal
			}).finally(() => clearTimeout(timeout));

			const responseText = await response.text();
			fastify.log.info('n8n response:', {
				status: response.status,
				statusText: response.statusText,
				body: responseText
			});

			if (!response.ok) {
				throw new Error(`n8n processing failed: ${response.status} ${response.statusText} - ${responseText}`);
			}

			let processedReading: ProcessedReading;
			try {
				processedReading = JSON.parse(responseText);
			} catch (e) {
				throw new Error(`Invalid JSON response from n8n: ${responseText}`);
			}

			fastify.log.info('Successfully processed reading:', processedReading);

			// Broadcast the processed reading
			broadcast({
				type: 'processed_reading',
				payload: processedReading
			});

		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				fastify.log.error('n8n request timed out after 5 seconds');
			} else {
				fastify.log.error('Error processing temperature reading:', {
					error: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined
				});
			}

			// Broadcast error to clients
			broadcast({
				type: 'error',
				payload: 'Failed to process temperature reading'
			});
		}
	}

	// Test n8n connection on startup
	try {
		const testResponse = await fetch(config.N8N_WEBHOOK_URL, {
			method: 'OPTIONS'
		});
		fastify.log.info('n8n connection test:', {
			status: testResponse.status,
			ok: testResponse.ok
		});
	} catch (error) {
		fastify.log.error('Failed to connect to n8n:', error);
	}

	fastify.get('/ws', {
		websocket: true,
		schema: {
			description: 'Main WebSocket endpoint',
			tags: ['websocket']
		}
	}, (connection, _) => {
		fastify.log.info('Client connected to WebSocket');
		connectedClients.add(connection);

		if (connectedClients.size === 1) {
			fastify.log.info('Starting temperature generator');
			startGenerator((reading) => {
				processTemperatureReading(reading).catch(error => {
					fastify.log.error('Failed to process temperature reading:', error);
				});
			});
		}

		connection.on('message', async (rawMessage) => {
			try {
				const message: WSMessage = JSON.parse(rawMessage.toString());
				switch (message.type) {
					case 'ping':
						connection.send(JSON.stringify({ type: 'pong' }));
						break;
					case 'echo':
						connection.send(JSON.stringify({
							type: 'echo',
							payload: message.payload
						}));
						break;
					default:
						connection.send(JSON.stringify({
							type: 'error',
							payload: 'Unknown message type'
						}));
				}
			} catch (error) {
				fastify.log.error(error);
				connection.send(JSON.stringify({
					type: 'error',
					payload: 'Invalid message format'
				}));
			}
		});

		connection.on('close', () => {
			fastify.log.info('Client disconnected from WebSocket');
			connectedClients.delete(connection);
			if (connectedClients.size === 0) {
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
