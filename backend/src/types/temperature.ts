export interface TemperatureReading {
	id: string;
	temperature: number;
	timestamp: string;
}

export interface ProcessedReading extends TemperatureReading {
	status: 'NORMAL' | 'HIGH';
	processedAt: string;
}

export interface WSMessage {
	type: string;
	payload: any;
}
