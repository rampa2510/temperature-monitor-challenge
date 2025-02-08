import mongoose, { Document, Schema } from 'mongoose';

export interface IProcessLog extends Document {
	processEntryId: mongoose.Types.ObjectId;
	changeType: 'temperature' | 'status' | 'metadata';
	oldValue: any;
	newValue: any;
	timestamp: Date;
	userId?: string;
}

const ProcessLogSchema = new Schema({
	processEntryId: {
		type: Schema.Types.ObjectId,
		ref: 'ProcessEntry',
		required: true
	},
	changeType: {
		type: String,
		enum: ['temperature', 'status', 'metadata'],
		required: true
	},
	oldValue: {
		type: Schema.Types.Mixed,
		required: true
	},
	newValue: {
		type: Schema.Types.Mixed,
		required: true
	},
	timestamp: {
		type: Date,
		default: Date.now,
		required: true
	},
	userId: {
		type: String
	}
}, {
	timestamps: true
});

// Add indexes
ProcessLogSchema.index({ processEntryId: 1 });
ProcessLogSchema.index({ timestamp: -1 });
ProcessLogSchema.index({ changeType: 1 });

export const ProcessLog = mongoose.model<IProcessLog>('ProcessLog', ProcessLogSchema);
