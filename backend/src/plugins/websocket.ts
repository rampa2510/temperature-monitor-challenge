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
			maxPayload: 1048576,
			clientTracking: true,
			verifyClient: (info: VerifyClientInfo, next: VerifyClientNext) => {
				// Check header first
				const headerApiKey = info.req.headers['api-key'];

				// Then check URL parameters
				const url = new URL(info.req.url!, `http://${info.req.headers.host}`);
				const urlApiKey = url.searchParams.get('apiKey');

				// Accept either header or URL parameter
				const providedApiKey = headerApiKey || urlApiKey;

				console.log(providedApiKey, fastify.config.API_KEY)

				if (!providedApiKey || providedApiKey !== fastify.config.API_KEY) {
					fastify.log.warn('WebSocket connection rejected: Invalid API key');
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
