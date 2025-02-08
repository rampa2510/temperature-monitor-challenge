import type { ProcessedReading } from "~/types";
import StatusBadge, { type StatusBadgeProps } from "./statusBadge";
import { formatDistanceToNow } from "date-fns";

interface TemperatureReadingProps {
  reading: ProcessedReading;
  onClick: (reading: ProcessedReading) => void;
}

const TemperatureReading: React.FC<TemperatureReadingProps> = ({ reading, onClick }) => {
  const formattedTime = formatDistanceToNow(new Date(reading.timestamp), { addSuffix: true });

  return (
    <div
      onClick={() => onClick(reading)}
      className="flex items-center justify-between py-3 sm:py-4 px-3 sm:px-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
    >
      <div>
        <div className="text-base sm:text-lg font-medium text-gray-900">
          {reading.temperature.toFixed(1)}°C
        </div>
        <div className="text-xs sm:text-sm text-gray-500">{formattedTime}</div>
      </div>
      <StatusBadge status={reading.status} />
    </div>
  );
};

export default TemperatureReading
