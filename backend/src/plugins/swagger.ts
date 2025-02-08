import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
	// First register the swagger schema generator
	await fastify.register(fastifySwagger, {
		openapi: {
			info: {
				title: 'WebSocket API',
				description: 'WebSocket server with REST endpoints',
				version: '1.0.0'
			},
			servers: [{
				url: `http://localhost:${fastify.config.PORT}`,
				description: 'Local development server'
			}]
		},
		stripBasePath: false
	});

	// Then register the swagger UI with proper typing
	const swaggerUiOptions: FastifySwaggerUiOptions = {
		routePrefix: '/documentation',
		uiConfig: {
			docExpansion: 'list',
			deepLinking: false
		},
		staticCSP: true,
		transformStaticCSP: (header) => header,
		indexPrefix: "/api"
	};

	await fastify.register(fastifySwaggerUi, swaggerUiOptions);
};

export default fp(swaggerPlugin);
