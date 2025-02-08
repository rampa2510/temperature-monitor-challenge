import type { TemperatureStatus } from "~/types";

export interface StatusBadgeProps {
  status: TemperatureStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyles = (): string => {
    switch (status.toLowerCase()) {
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'high':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs sm:text-sm font-medium rounded-full ${getStatusStyles()}`}>
      {status.toUpperCase()}
    </span>
  );
};

export default StatusBadge
