import { config } from '@/config/env';
import mongoose from 'mongoose';

export async function connectDB() {
	try {
		await mongoose.connect(config.MONGODB_URI);
		console.log('MongoDB connected');

		// Handle disconnection
		mongoose.connection.on('disconnected', () => {
			console.log('MongoDB disconnected');
		});

		// Handle process termination
		process.on('SIGINT', async () => {
			await mongoose.connection.close();
			process.exit(0);
		});
	} catch (err) {
		console.error('MongoDB connection error:', err);
		process.exit(1);
	}
}
