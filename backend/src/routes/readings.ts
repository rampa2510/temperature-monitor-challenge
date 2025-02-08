import { FastifyPluginAsync, FastifyInstance } from 'fastify';
import { ProcessEntry } from '../models/ProcessEntry';
import { ProcessLog, IProcessLog } from '../models/ProcessLog';
import mongoose from 'mongoose';

// Shared type definitions
interface ReadingResponse {
	id: string;
	temperature: number;
	timestamp: string;
	status: 'active' | 'completed' | 'error';
	metadata?: Record<string, any>;
}

interface CreateReadingBody {
	temperature: number;
	metadata?: Record<string, any>;
}

interface ListReadingsQuerystring {
	limit?: number;
	offset?: number;
	status?: 'active' | 'completed' | 'error';
	startDate?: string;
	endDate?: string;
}

const readingRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
	// Get latest readings
	fastify.get<{
		Querystring: ListReadingsQuerystring;
		Reply: {
			readings: ReadingResponse[];
			total: number;
		};
	}>('/api/readings', {
		schema: {
			description: 'Get temperature readings with optional filtering',
			tags: ['Readings'],
			querystring: {
				type: 'object',
				properties: {
					limit: { type: 'number', default: 10 },
					offset: { type: 'number', default: 0 },
					status: {
						type: 'string',
						enum: ['active', 'completed', 'error']
					},
					startDate: { type: 'string', format: 'date-time' },
					endDate: { type: 'string', format: 'date-time' }
				}
			},
			response: {
				200: {
					type: 'object',
					properties: {
						readings: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									id: { type: 'string' },
									temperature: { type: 'number' },
									timestamp: { type: 'string', format: 'date-time' },
									status: {
										type: 'string',
										enum: ['active', 'completed', 'error']
									},
									metadata: {
										type: 'object',
										additionalProperties: true
									}
								}
							}
						},
						total: { type: 'number' }
					}
				}
			}
		}
	}, async (request) => {
		const { limit = 10, offset = 0, status, startDate, endDate } = request.query;

		const query: any = {};
		if (status) query.status = status;
		if (startDate || endDate) {
			query.timestamp = {};
			if (startDate) query.timestamp.$gte = new Date(startDate);
			if (endDate) query.timestamp.$lte = new Date(endDate);
		}

		const [readings, total] = await Promise.all([
			ProcessEntry.find(query)
				.sort({ timestamp: -1 })
				.skip(offset)
				.limit(limit)
				.lean(),
			ProcessEntry.countDocuments(query)
		]);

		return {
			readings: readings.map(reading => ({
				id: (reading as any)._id.toString(),
				temperature: reading.temperature,
				timestamp: reading.timestamp.toISOString(),
				status: reading.status,
				metadata: reading.metadata
			})),
			total
		};
	});

	// Create new reading
	fastify.post<{
		Body: CreateReadingBody;
		Reply: ReadingResponse;
	}>('/api/readings', {
		schema: {
			description: 'Create a new temperature reading',
			tags: ['Readings'],
			body: {
				type: 'object',
				required: ['temperature'],
				properties: {
					temperature: {
						type: 'number',
						minimum: -273.15,
						maximum: 1000
					},
					metadata: {
						type: 'object',
						additionalProperties: true
					}
				}
			},
			response: {
				201: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						temperature: { type: 'number' },
						timestamp: { type: 'string', format: 'date-time' },
						status: {
							type: 'string',
							enum: ['active', 'completed', 'error']
						},
						metadata: {
							type: 'object',
							additionalProperties: true
						}
					}
				}
			}
		}
	}, async (request) => {
		const { temperature, metadata } = request.body;

		const reading = await ProcessEntry.create({
			temperature,
			metadata,
			timestamp: new Date(),
			status: 'active'
		});

		return {
			id: (reading as any)._id.toString(),
			temperature: reading.temperature,
			timestamp: reading.timestamp.toISOString(),
			status: reading.status,
			metadata: reading.metadata
		};
	});

	// Get reading by ID with history
	fastify.get<{
		Params: { id: string };
		Reply: ReadingResponse & { history: IProcessLog[] };
	}>('/api/readings/:id', {
		schema: {
			description: 'Get a specific temperature reading with its change history',
			tags: ['Readings'],
			params: {
				type: 'object',
				required: ['id'],
				properties: {
					id: { type: 'string' }
				}
			},
			response: {
				200: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						temperature: { type: 'number' },
						timestamp: { type: 'string', format: 'date-time' },
						status: {
							type: 'string',
							enum: ['active', 'completed', 'error']
						},
						metadata: {
							type: 'object',
							additionalProperties: true
						},
						history: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									changeType: {
										type: 'string',
										enum: ['temperature', 'status', 'metadata']
									},
									oldValue: { type: 'object' },
									newValue: { type: 'object' },
									timestamp: { type: 'string', format: 'date-time' },
									userId: { type: 'string' }
								}
							}
						}
					}
				}
			}
		}
	}, async (request) => {
		const { id } = request.params;

		const [reading, history] = await Promise.all([
			ProcessEntry.findById(id).lean(),
			ProcessLog.find({ processEntryId: new mongoose.Types.ObjectId(id) })
				.sort({ timestamp: -1 })
				.lean()
		]);

		if (!reading) {
			throw new Error('Reading not found');
		}

		return {
			id: (reading as any)._id.toString(),
			temperature: reading.temperature,
			timestamp: reading.timestamp.toISOString(),
			status: reading.status,
			metadata: reading.metadata,
			history
		};
	});

	// Update reading status
	fastify.patch<{
		Params: { id: string };
		Body: {
			status: 'active' | 'completed' | 'error';
			metadata?: Record<string, any>;
		};
		Reply: ReadingResponse;
	}>('/api/readings/:id', {
		schema: {
			description: 'Update a temperature reading status',
			tags: ['Readings'],
			params: {
				type: 'object',
				required: ['id'],
				properties: {
					id: { type: 'string' }
				}
			},
			body: {
				type: 'object',
				required: ['status'],
				properties: {
					status: {
						type: 'string',
						enum: ['active', 'completed', 'error']
					},
					metadata: {
						type: 'object',
						additionalProperties: true
					}
				}
			}
		}
	}, async (request) => {
		const { id } = request.params;
		const { status, metadata } = request.body;

		const reading = await ProcessEntry.findById(id);
		if (!reading) {
			throw new Error('Reading not found');
		}

		// Create log entry for status change
		if (reading.status !== status) {
			await ProcessLog.create({
				processEntryId: (reading as any)._id,
				changeType: 'status',
				oldValue: reading.status,
				newValue: status,
				timestamp: new Date()
			});
		}

		// Create log entry for metadata change if provided
		if (metadata && JSON.stringify(reading.metadata) !== JSON.stringify(metadata)) {
			await ProcessLog.create({
				processEntryId: (reading as any)._id,
				changeType: 'metadata',
				oldValue: reading.metadata,
				newValue: metadata,
				timestamp: new Date()
			});
		}

		// Update reading
		reading.status = status;
		if (metadata) reading.metadata = metadata;
		await reading.save();

		return {
			id: (reading as any)._id.toString(),
			temperature: reading.temperature,
			timestamp: reading.timestamp.toISOString(),
			status: reading.status,
			metadata: reading.metadata
		};
	});
};

export default readingRoutes;
