import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ChartDataPoint, TooltipProps } from "@/types";
import { formatDay } from "@/utils/requestsPerDay";
import { Card } from "./Card";
import { Text } from "./Text";
import { Dot } from "./Badge";

// Series colours are chart tokens, so callers carry no colour.
const chartColor = {
  "chart-1": "var(--color-chart-1)",
  "chart-2": "var(--color-chart-2)",
} as const;

export type ChartColor = keyof typeof chartColor;

export interface BarSeries {
  key: string;
  name: string;
  color: ChartColor;
}

export interface BarChartProps {
  // One point per day; `date` is YYYY-MM-DD (UTC)
  data: ChartDataPoint[];
  series: BarSeries[];
  stacked?: boolean;
}

const ChartTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <Card variant="tooltip" className="p-3">
      <Text size="sm" weight="medium" tone="fg-strong" className="mb-2">
        {formatDay(label || "", true)}
      </Text>
      {payload.map((entry, index) => (
        <Text key={index} size="sm" tone="fg-muted">
          <Dot color={entry.color} className="mr-2" />
          {entry.name}: {entry.value.toLocaleString("en-US")}
        </Text>
      ))}
    </Card>
  );
};

export const BarChart: React.FC<BarChartProps> = ({
  data,
  series,
  stacked = false,
}) => (
  <div className="h-72" data-testid="bar-chart">
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
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
        <Tooltip content={<ChartTooltip />} cursor={{ opacity: 0.2 }} />
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
            fill={chartColor[color]}
            isAnimationActive={false}
            stackId={stacked ? "stack" : undefined}
            radius={
              !stacked || index === series.length - 1 ? [4, 4, 0, 0] : undefined
            }
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  </div>
);
