import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MetricCard } from "@components/dashboard/MetricCard.tsx";
import { UsageChart } from "@components/dashboard/UsageChart.tsx";
import { collections } from "@/db.ts";
import type { DashboardSummary, UsageTrendData } from "@/types.ts";

// Helper function to calculate trend based on growth percentage
const calculateTrend = (
  growth: number,
): { trend: "up" | "down" | "neutral"; trendValue: string } => {
  if (growth > 0) {
    return { trend: "up", trendValue: `+${growth}% last month` };
  } else if (growth < 0) {
    return { trend: "down", trendValue: `${growth}% last month` };
  } else {
    return { trend: "neutral", trendValue: "No change" };
  }
};

// Helper function to calculate derived trends from base metrics
const calculateDerivedTrend = (
  baseGrowth: number,
): { trend: "up" | "down" | "neutral"; trendValue: string } => {
  // Simulate derived trends based on the main growth rate with some variation
  const variation = Math.random() * 0.4 - 0.2; // -0.2 to +0.2 variation
  const derivedGrowth = baseGrowth + variation;

  if (derivedGrowth > 0) {
    return {
      trend: "up",
      trendValue: `+${Math.abs(derivedGrowth).toFixed(1)}% last month`,
    };
  } else if (derivedGrowth < 0) {
    return {
      trend: "down",
      trendValue: `${derivedGrowth.toFixed(1)}% last month`,
    };
  } else {
    return { trend: "neutral", trendValue: "Stable" };
  }
};

export const Route = createFileRoute("/dashboard/overview")({
  component: OverviewComponent,
});

function OverviewComponent() {
  const [summary] = useState<DashboardSummary>(
    () => collections.dashboardSummary.get("main")!,
  );
  const [usageData] = useState<UsageTrendData[]>(() =>
    Array.from(collections.usageTrends.values()),
  );

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
          {...calculateTrend(summary.monthlyGrowth)}
        />
        <MetricCard
          title="Total Thumbnails Generated"
          value={summary.totalThumbnailsGenerated}
          unit="thumbnails"
          {...calculateDerivedTrend(summary.monthlyGrowth)}
        />
        <MetricCard
          title="Total API Calls"
          value={summary.totalApiCalls}
          unit="calls"
          {...calculateDerivedTrend(summary.monthlyGrowth)}
        />
        <MetricCard
          title="Monthly Growth"
          value={summary.monthlyGrowth}
          unit="%"
          {...calculateTrend(summary.monthlyGrowth)}
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
