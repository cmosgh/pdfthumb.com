import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { UsageChart } from "@components/dashboard/UsageChart.tsx";
import { BarChartComponent } from "@components/dashboard/BarChart.tsx";
import { PieChartComponent } from "@components/dashboard/PieChart.tsx";
import { DateRangePicker } from "@components/dashboard/DateRangePicker.tsx";
import { collections } from "@/db.ts";
import type {
  DateRange,
  FileTypeData,
  ErrorLogData,
  UsageTrendData,
  GeographicData,
} from "@/types.ts";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsComponent,
});

function AnalyticsComponent() {
  console.log("Rendering AnalyticsComponent");
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });

  const [usageData] = useState<UsageTrendData[]>(() =>
    Array.from(collections.usageTrends.values()),
  );
  const [fileTypeData] = useState<FileTypeData[]>(() =>
    Array.from(collections.fileTypeData.values()),
  );
  const [geographicData] = useState<GeographicData[]>(() =>
    Array.from(collections.geographicData.values()),
  );
  const [errorLogs] = useState<ErrorLogData[]>(() =>
    Array.from(collections.errorLogs.values()),
  );
  const [filteredUsageData, setFilteredUsageData] = useState<UsageTrendData[]>(
    () => Array.from(collections.usageTrends.values()),
  );
  const [filteredFileTypeData, setFilteredFileTypeData] = useState<
    FileTypeData[]
  >(() => Array.from(collections.fileTypeData.values()));

  useEffect(() => {
    // Filter data based on date range
    const filterDataByDateRange = (data: any[]) => {
      return data.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= dateRange.start && itemDate <= dateRange.end;
      });
    };

    setFilteredUsageData(filterDataByDateRange(usageData));
    setFilteredFileTypeData(filterDataByDateRange(fileTypeData));
  }, [dateRange, usageData, fileTypeData]);

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

  const geographicChartData = geographicData.map((item) => ({
    name: item.country,
    value: item.requests,
    percentage: item.percentage,
  }));

  const totalErrors = errorLogs.length;
  const errorRate =
    totalErrors > 0
      ? (totalErrors /
          filteredUsageData.reduce((sum, item) => sum + item.apiCalls, 0)) *
        100
      : 0;

  return (
    <div className="space-y-6" data-testid="analytics-page">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Detailed Analytics
      </h1>
      <div>
        <DateRangePicker onDateRangeChange={handleDateRangeChange} />
      </div>

      {/* Usage Trends Chart */}
      <div
        className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg dark:shadow-slate-700/50 border border-slate-200 dark:border-slate-700"
        data-testid="error-rate-chart"
      >
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Error Rate Analysis
        </h3>
        <UsageChart
          data={filteredUsageData}
          title=""
          dataKeys={["pdfsProcessed", "thumbnailsGenerated", "apiCalls"]}
          colors={["#3B82F6", "#10B981", "#F59E0B"]}
        />
      </div>

      {/* File Type Breakdown and Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg dark:shadow-slate-700/50 border border-slate-200 dark:border-slate-700"
          data-testid="usage-by-file-type-chart"
        >
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Usage by File Type
          </h3>
          <BarChartComponent
            data={filteredFileTypeData}
            title=""
            dataKeys={["pdf", "png", "jpg", "other"]}
            colors={["#3B82F6", "#10B981", "#F59E0B", "#EF4444"]}
            stacked={true}
          />
        </div>

        <div
          className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg dark:shadow-slate-700/50 border border-slate-200 dark:border-slate-700"
          data-testid="geographic-distribution-chart"
        >
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Geographical Distribution
          </h3>
          <PieChartComponent data={geographicChartData} title="" />
        </div>
      </div>

      {/* Error Logs */}
      <div
        className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg dark:shadow-slate-700/50 border border-slate-200 dark:border-slate-700"
        data-testid="error-logs-table"
      >
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Recent Error Logs
        </h3>
        <div className="flex items-center space-x-4 mb-4">
          <span
            className="text-sm text-slate-600 dark:text-slate-300"
            data-testid="total-errors"
          >
            Total Errors:{" "}
            <span className="font-semibold text-red-600">{totalErrors}</span>
          </span>
          <span
            className="text-sm text-slate-600 dark:text-slate-300"
            data-testid="error-rate"
          >
            Error Rate:{" "}
            <span className="font-semibold text-red-600">
              {errorRate.toFixed(2)}%
            </span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Error Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  User ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {errorLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {log.errorType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                    {log.message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                    {log.fileName || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                    {log.userId || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
