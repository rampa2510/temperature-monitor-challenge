import { config } from '@/config/env';
import { FastifyBaseLogger } from 'fastify';
import mongoose from 'mongoose';

export async function connectDB(logger: FastifyBaseLogger) {
	try {
		await mongoose.connect(config.MONGODB_URI);
		logger.info('MongoDB connected');

		// Handle disconnection
		mongoose.connection.on('disconnected', () => {
			logger.info('MongoDB disconnected');
		});

		// Handle process termination
		process.on('SIGINT', async () => {
			await mongoose.connection.close();
			process.exit(0);
		});
	} catch (err) {
		logger.error('MongoDB connection error:', err);
		process.exit(1);
	}
}
