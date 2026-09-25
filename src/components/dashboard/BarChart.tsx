import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ChartDataPoint, TooltipProps } from "../../types";
import { formatDay } from "../../utils/requestsPerDay";

export interface BarSeries {
  key: string;
  name: string;
  color: string;
}

interface BarChartProps {
  // One point per day; `date` is YYYY-MM-DD (UTC)
  data: ChartDataPoint[];
  series: BarSeries[];
  stacked?: boolean;
}

export const BarChartComponent: React.FC<BarChartProps> = ({
  data,
  series,
  stacked = false,
}) => {
  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface p-3 border border-line-strong rounded-lg shadow-lg">
          <p className="text-sm font-medium text-fg-strong mb-2">
            {formatDay(label || "", true)}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-fg-muted">
              <span
                className="inline-block w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}: {entry.value.toLocaleString("en-US")}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72" data-testid="bar-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-chart-grid)"
            opacity={0.3}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(date: string) => formatDay(date)}
            stroke="var(--color-chart-axis)"
            fontSize={12}
          />
          <YAxis
            stroke="var(--color-chart-axis)"
            fontSize={12}
            allowDecimals={false}
            tickFormatter={(value: number) => value.toLocaleString("en-US")}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ opacity: 0.2 }} />
          <Legend
            wrapperStyle={{ paddingTop: "12px" }}
            iconType="rect"
            // In series order, not alphabetical
            itemSorter={(item) =>
              series.findIndex(({ key }) => key === item.dataKey)
            }
          />
          {series.map(({ key, name, color }, index) => (
            <Bar
              key={key}
              dataKey={key}
              name={name}
              fill={color}
              isAnimationActive={false}
              stackId={stacked ? "stack" : undefined}
              radius={
                !stacked || index === series.length - 1
                  ? [4, 4, 0, 0]
                  : undefined
              }
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
