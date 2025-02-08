import React, { useState } from 'react';
import TemperatureReading from '../components/temperatureReading';
import type { ProcessedReading } from '../types';
import { formatDistanceToNow } from 'date-fns';
import ReadingDetails from '~/components/readingDetails';
import { useTemperatureWebSocket } from './useTemperatureWebSocket';

const TemperatureMonitor: React.FC = () => {
  const [selectedReading, setSelectedReading] = useState<ProcessedReading | null>(null);
  const { isConnected, currentReading, recentReadings, error } = useTemperatureWebSocket();

  const handleReadingClick = (reading: ProcessedReading) => {
    setSelectedReading(reading);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center mb-2">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Temperature Monitor</h1>
        <div className="flex items-center">
          <div className={`w-2 h-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-2`}></div>
          <span className="text-xs sm:text-sm text-gray-500">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Current Temperature */}
      {currentReading && (
        <div className="px-3 sm:px-4 py-6 sm:py-8 mb-6 text-center shadow border-gray-300 rounded-lg">
          <div className="text-sm sm:text-base text-gray-500 mb-2">Current Temperature</div>
          <div className="text-4xl sm:text-5xl font-bold mb-2">{currentReading.temperature.toFixed(1)}°C</div>
          <div className="flex items-center justify-center gap-1 sm:gap-2 text-sm">
            <span className={`font-medium ${currentReading.status === 'HIGH' ? 'text-yellow-500' : 'text-green-500'}`}>
              {currentReading.status}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">
              Last updated: {formatDistanceToNow(new Date(currentReading.lastUpdated), { addSuffix: true })}
            </span>
          </div>
        </div>
      )}

      {/* Recent Readings */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <h2 className="px-3 sm:px-4 py-3 sm:py-4 text-base sm:text-lg border-b border-gray-200 font-medium text-gray-900">
          Recent Readings
        </h2>
        <div className="divide-y divide-gray-200">
          {recentReadings.map((reading) => (
            <TemperatureReading
              key={reading.id}
              reading={reading}
              onClick={handleReadingClick}
            />
          ))}
        </div>
      </div>

      {/* Reading Details Modal */}
      {selectedReading && (
        <ReadingDetails
          reading={selectedReading}
          onClose={() => setSelectedReading(null)}
        />
      )}
    </div>
  );
};

export default TemperatureMonitor;
