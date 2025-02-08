import { startGenerator, stopGenerator } from '@/services/temperatureGenerator';
import { FastifyPluginAsync } from 'fastify';
import { WebSocket } from 'ws';

interface WSMessage {
	type: string;
	payload: any;
}

const websocketRoutes: FastifyPluginAsync = async (fastify) => {
	const connectedClients = new Set<WebSocket>();

	function broadcast(data: any) {
		const message = JSON.stringify(data);
		fastify.websocketServer.clients.forEach(client => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(message);
			}
		});
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

		// Start generator when first client connects
		if (connectedClients.size === 1) {
			fastify.log.info('Starting temperature generator');
			startGenerator((reading) => {
				broadcast({
					type: 'temperature_reading',
					payload: reading
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

			// Stop generator when last client disconnects
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
