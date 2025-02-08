import type { ProcessedReading } from "~/types";
import { useCallback } from "react";

interface ReadingDetailsProps {
  reading: ProcessedReading;
  onClose: () => void;
}

const ReadingDetails: React.FC<ReadingDetailsProps> = ({ reading, onClose }) => {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only close if the click was directly on the backdrop
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 transition-all"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Reading Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-500">Temperature</div>
            <div className="text-lg font-medium">{reading.temperature.toFixed(1)}°C</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div className="text-lg font-medium">{reading.status}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Timestamp</div>
            <div className="text-lg font-medium">
              {new Date(reading.timestamp).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Processed At</div>
            <div className="text-lg font-medium">
              {new Date(reading.processedAt).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingDetails;
