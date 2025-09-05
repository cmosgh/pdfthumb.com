import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface UsageChartProps {
  data: any[];
  title: string;
  dataKeys?: string[];
  colors?: string[];
}

export const UsageChart: React.FC<UsageChartProps> = ({
  data,
  title,
  dataKeys = ["value"],
  colors = ["#3B82F6"],
}) => {
  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTooltipLabel = (label: string) => {
    const date = new Date(label);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {formatTooltipLabel(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-600">
              <span
                className="inline-block w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderLines = () => {
    return dataKeys.map((key, index) => (
      <Line
        key={key}
        type="monotone"
        dataKey={key}
        stroke={colors[index % colors.length]}
        strokeWidth={2}
        dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
        activeDot={{
          r: 6,
          stroke: colors[index % colors.length],
          strokeWidth: 2,
        }}
      />
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxisLabel}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
            {renderLines()}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
