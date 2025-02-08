import mongoose, { Document, Schema } from 'mongoose';

export interface IProcessEntry extends Document {
	temperature: number;
	timestamp: Date;
	status: 'active' | 'completed' | 'error';
	metadata?: Record<string, any>;
}

const ProcessEntrySchema = new Schema({
	temperature: {
		type: Number,
		required: true,
		min: -273.15, // Absolute zero in Celsius
		max: 1000
	},
	timestamp: {
		type: Date,
		default: Date.now,
		required: true
	},
	status: {
		type: String,
		enum: ['active', 'completed', 'error'],
		required: true,
		default: 'active'
	},
	metadata: {
		type: Schema.Types.Mixed,
		default: {}
	}
}, {
	timestamps: true
});

ProcessEntrySchema.index({ timestamp: -1 });
ProcessEntrySchema.index({ status: 1 });
ProcessEntrySchema.index({ temperature: 1 });

export const ProcessEntry = mongoose.model<IProcessEntry>('ProcessEntry', ProcessEntrySchema);
