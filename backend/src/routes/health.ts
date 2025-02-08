import { FastifyPluginAsync } from 'fastify';
import mongoose from 'mongoose';

interface HealthResponse {
	status: "ok" | "error";
	timestamp: string;
	mongodb: {
		status: "ok" | "error";
		latency: number;
	};
}

const healthRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get<{
		Reply: HealthResponse;
	}>('/health', {
		schema: {
			description: 'Health check endpoint',
			tags: ['Health'],
			response: {
				200: {
					type: 'object',
					properties: {
						status: {
							type: 'string',
							enum: ["ok", "error"],
							description: 'Overall health status'
						},
						timestamp: {
							type: 'string',
							format: 'date-time',
							description: 'Current server timestamp'
						},
						mongodb: {
							type: 'object',
							description: 'MongoDB connection status',
							properties: {
								status: {
									type: 'string',
									enum: ["ok", "error"],
									description: 'MongoDB connection status'
								},
								latency: {
									type: 'number',
									description: 'MongoDB ping latency in milliseconds'
								}
							}
						}
					}
				}
			}
		}
	}, async () => {
		// Check MongoDB connection
		let mongoStatus: "ok" | "error" = "error";
		let mongoLatency = 0;

		try {
			const startTime = Date.now();
			const res = await mongoose.connection.db?.admin().ping();
			console.log({ res })
			mongoLatency = Date.now() - startTime;
			mongoStatus = "ok";
		} catch (error) {
			fastify.log.error('MongoDB health check failed:', error);
		}

		return {
			status: mongoStatus === "ok" ? "ok" : "error",
			timestamp: new Date().toISOString(),
			mongodb: {
				status: mongoStatus,
				latency: mongoLatency
			}
		};
	});
};

export default healthRoutes;
