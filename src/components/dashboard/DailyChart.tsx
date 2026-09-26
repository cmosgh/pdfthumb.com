import React from "react";
import { BarChart, type BarSeries } from "@/components/ui";
import type { ChartDataPoint } from "@/types";
import { formatDay } from "@/utils/requestsPerDay";
import { count } from "@/utils/format";

export interface DailyChartProps {
  data: ChartDataPoint[];
  series: BarSeries[];
  stacked?: boolean;
  // The screen-reader table's caption
  caption: string;
}

// A bar chart per day for sighted users and the same numbers as a table for
// screen readers.
export const DailyChart: React.FC<DailyChartProps> = ({
  data,
  series,
  stacked,
  caption,
}) => (
  <>
    <div aria-hidden="true">
      <BarChart data={data} series={series} stacked={stacked} />
    </div>
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Day</th>
          {series.map((s) => (
            <th key={s.key} scope="col">
              {s.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((d) => (
          <tr key={d.date}>
            <th scope="row">{formatDay(d.date)}</th>
            {series.map((s) => {
              const value = d[s.key];
              return (
                <td key={s.key}>
                  {typeof value === "number" ? count(value) : "none"}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </>
);
