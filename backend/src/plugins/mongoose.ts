import fp from 'fastify-plugin';
import mongoose from 'mongoose';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { IProcessEntry } from '@/models/ProcessEntry';
import { IProcessLog } from '@/models/ProcessLog';

interface MongoosePluginOptions {
	uri: string;
}


export function createModels(fastify: FastifyInstance) {
	const ProcessEntry = fastify.mongoose.model<IProcessEntry>('ProcessEntry', ProcessEntrySchema);
	const ProcessLog = fastify.mongoose.model<IProcessLog>('ProcessLog', ProcessLogSchema);

	return {
		ProcessEntry,
		ProcessLog
	};
}

const mongoosePlugin: FastifyPluginAsync<MongoosePluginOptions> = async (fastify, options) => {
	try {
		await mongoose.connect(options.uri, {
			serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
		});

		// Add mongoose to fastify instance
		fastify.decorate('mongoose', mongoose);

		// Close mongoose connection when fastify closes
		fastify.addHook('onClose', async () => {
			await mongoose.connection.close();
		});

		fastify.log.info('MongoDB connected successfully');
	} catch (error) {
		fastify.log.error('Error connecting to MongoDB:', error);
		throw error;
	}
};

export default fp(mongoosePlugin, {
	name: 'mongoose'
});
