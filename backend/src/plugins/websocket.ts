import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';

interface VerifyClientInfo {
	origin: string;
	secure: boolean;
	req: IncomingMessage;
}

type VerifyClientNext = (verified: boolean) => void;

interface WebSocketError extends Error {
	code?: string;
}

const websocketPlugin: FastifyPluginAsync = async (fastify) => {
	await fastify.register(fastifyWebsocket, {
		options: {
			maxPayload: 1048576, // 1MB
			clientTracking: true, // Enable client tracking
			verifyClient: (info: VerifyClientInfo, next: VerifyClientNext) => {
				// Example authentication using headers
				const apiKey = info.req.headers['api-key'];
				if (!apiKey || apiKey !== fastify.config.API_KEY) {
					return next(false);
				}
				next(true);
			}
		},
		errorHandler: (
			error: WebSocketError,
			socket: WebSocket,
			request: FastifyRequest,
			reply: FastifyReply
		) => {
			fastify.log.error(error);
			// Send error message to client before terminating
			socket.send(JSON.stringify({
				error: 'Internal WebSocket error',
				code: error.code
			}));
			socket.terminate();
		},
		preClose: async (done) => {
			// Graceful shutdown
			const server = fastify.websocketServer;
			for (const client of server.clients) {
				client.close(1000, 'Server shutting down');
			}
			server.close(done);
		}
	});
};

export default fp(websocketPlugin);
