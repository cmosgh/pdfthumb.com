import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MetricCard } from "../../components/dashboard/MetricCard";
import { UsageChart } from "../../components/dashboard/UsageChart";
import {
  mockDashboardSummary,
  mockUsageTrends,
} from "../../data/dashboardMocks";

export const Route = createFileRoute("/dashboard/overview")({
  component: OverviewComponent,
});

function OverviewComponent() {
  const [summary, setSummary] = useState(mockDashboardSummary);
  const [usageData, setUsageData] = useState(mockUsageTrends);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call delay
    const timer = setTimeout(() => {
      setSummary(mockDashboardSummary);
      setUsageData(mockUsageTrends);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          Dashboard Overview
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Dashboard Overview
      </h1>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total PDFs Processed"
          value={summary.totalPdfsProcessed}
          unit="PDFs"
          trend={summary.monthlyGrowth >= 0 ? "up" : "down"}
          trendValue={`${summary.monthlyGrowth >= 0 ? "+" : ""}${summary.monthlyGrowth}% last month`}
        />
        <MetricCard
          title="Total Thumbnails Generated"
          value={summary.totalThumbnailsGenerated}
          unit="thumbnails"
          trend="up"
          trendValue="+12% last month"
        />
        <MetricCard
          title="Total API Calls"
          value={summary.totalApiCalls}
          unit="calls"
          trend="up"
          trendValue="+8% last month"
        />
        <MetricCard
          title="Monthly Growth"
          value={summary.monthlyGrowth}
          unit="%"
          trend="up"
          trendValue="Consistent growth"
        />
      </div>

      {/* Usage Trends Chart */}
      <div className="mt-8">
        <UsageChart
          data={usageData}
          title="Usage Trends - Last 15 Days"
          dataKeys={["pdfsProcessed", "thumbnailsGenerated", "apiCalls"]}
          colors={["#3B82F6", "#10B981", "#F59E0B"]}
        />
      </div>
    </div>
  );
}
