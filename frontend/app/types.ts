// types.ts
export type TemperatureStatus = 'NORMAL' | 'HIGH';

export interface RawReading {
  id: string;
  temperature: number;
  timestamp: string;
}

export interface ProcessedReading extends RawReading {
  status: TemperatureStatus;
  processedAt: string;
}

export interface ReadingHistory {
  id: string;
  temperature: number;
  timestamp: string;
  status: TemperatureStatus;
  processedAt: string;
}

export interface CurrentReading {
  temperature: number;
  status: TemperatureStatus;
  lastUpdated: string;
  id: string;
}
