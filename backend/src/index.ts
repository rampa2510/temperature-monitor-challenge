import Fastify from 'fastify';
import { config } from './config/env';
import websocketPlugin from './plugins/websocket';
import swaggerPlugin from './plugins/swagger';
import healthRoutes from './routes/health';
import websocketRoutes from './routes/websocket';

async function buildApp() {
	const fastify = Fastify({
		logger: {
			level: config.NODE_ENV === 'development' ? 'debug' : 'info',
			transport: config.NODE_ENV === 'development'
				? { target: 'pino-pretty' }
				: undefined
		}
	});

	// Expose config to fastify instance
	fastify.decorate('config', config);

	// Register WebSocket plugin 
	await fastify.register(websocketPlugin);

	// Register WebSocket routes (no prefix)
	await fastify.register(websocketRoutes);

	// Create a plugin for HTTP routes with /api prefix
	await fastify.register(async (app) => {
		// Register Swagger plugins
		await app.register(swaggerPlugin);
		// Register HTTP routes
		await app.register(healthRoutes);
	}, { prefix: '/api' });

	return fastify;
}

async function start() {
	try {
		const app = await buildApp();

		await app.listen({
			port: parseInt(config.PORT, 10),
			host: '0.0.0.0'
		});

		app.log.info(`Server is running on port ${config.PORT}`);
		app.log.info(`Environment: ${config.NODE_ENV}`);
		app.log.info(`Documentation available at http://localhost:${config.PORT}/api/documentation`);
		app.log.info(`Health check available at http://localhost:${config.PORT}/api/health`);
		app.log.info(`WebSocket available at ws://localhost:${config.PORT}/ws`);
	} catch (err) {
		console.error('Error starting server:', err);
		process.exit(1);
	}
}

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
	console.error('Unhandled rejection:', err);
	process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
	console.error('Uncaught exception:', err);
	process.exit(1);
});

start();
