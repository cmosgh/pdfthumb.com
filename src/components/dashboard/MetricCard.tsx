import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  trendValue,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return (
          <svg
            className="w-4 h-4 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "down":
        return (
          <svg
            className="w-4 h-4 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "neutral":
        return (
          <svg
            className="w-4 h-4 text-gray-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      case "neutral":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      data-testid="metric-card"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p
            className="text-sm font-medium text-gray-600 mb-2"
            data-testid="metric-title"
          >
            {title}
          </p>
          <div className="flex items-baseline">
            <p
              className="text-2xl font-semibold text-gray-900"
              data-testid="metric-value"
            >
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {unit && (
              <span
                className="ml-2 text-sm text-gray-500"
                data-testid="metric-unit"
              >
                {unit}
              </span>
            )}
          </div>
        </div>
      </div>

      {trend && trendValue && (
        <div className="mt-4 flex items-center" data-testid="metric-trend">
          {getTrendIcon()}
          <span
            className={`ml-1 text-sm font-medium ${getTrendColor()}`}
            data-testid="metric-trend-value"
          >
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
};
