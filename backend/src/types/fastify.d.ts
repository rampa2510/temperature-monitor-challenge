import fastify from 'fastify';

declare module 'fastify' {
	interface FastifyInstance {
		config: {
			API_KEY: string;
			NODE_ENV: string;
			MONGODB_URI: string;
			N8N_WEBHOOK_URL: string;
			PORT: string
		};
	}
}
