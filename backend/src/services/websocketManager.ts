import { WebSocket } from 'ws';
import { FastifyBaseLogger } from 'fastify';

export interface WebSocketState {
	connectedClients: Set<WebSocket>;
	logger: FastifyBaseLogger;
}

export const createWebSocketManager = (logger: FastifyBaseLogger) => {
	const state: WebSocketState = {
		connectedClients: new Set(),
		logger
	};

	return {
		addClient: (client: WebSocket) => {
			state.connectedClients.add(client);
			state.logger.info('Client connected to WebSocket');
		},

		removeClient: (client: WebSocket) => {
			state.connectedClients.delete(client);
			state.logger.info('Client disconnected from WebSocket');
		},

		broadcast: (data: any) => {
			const message = JSON.stringify(data);
			state.connectedClients.forEach(client => {
				if (client.readyState === WebSocket.OPEN) {
					client.send(message);
				}
			});
		},

		getClientCount: () => state.connectedClients.size
	};
};
