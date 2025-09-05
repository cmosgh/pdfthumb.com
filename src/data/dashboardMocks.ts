import type { DashboardSummary, UsageTrendData } from "../types";

export const mockDashboardSummary: DashboardSummary = {
  totalPdfsProcessed: 125847,
  totalThumbnailsGenerated: 251694,
  totalApiCalls: 892341,
  monthlyGrowth: -5.2, // Test with negative growth to ensure proper display
};

export const mockUsageTrends: UsageTrendData[] = [
  {
    date: "2024-01-01",
    pdfsProcessed: 1200,
    thumbnailsGenerated: 2400,
    apiCalls: 3600,
  },
  {
    date: "2024-01-02",
    pdfsProcessed: 1350,
    thumbnailsGenerated: 2700,
    apiCalls: 4050,
  },
  {
    date: "2024-01-03",
    pdfsProcessed: 1100,
    thumbnailsGenerated: 2200,
    apiCalls: 3300,
  },
  {
    date: "2024-01-04",
    pdfsProcessed: 1450,
    thumbnailsGenerated: 2900,
    apiCalls: 4350,
  },
  {
    date: "2024-01-05",
    pdfsProcessed: 1600,
    thumbnailsGenerated: 3200,
    apiCalls: 4800,
  },
  {
    date: "2024-01-06",
    pdfsProcessed: 1300,
    thumbnailsGenerated: 2600,
    apiCalls: 3900,
  },
  {
    date: "2024-01-07",
    pdfsProcessed: 1750,
    thumbnailsGenerated: 3500,
    apiCalls: 5250,
  },
  {
    date: "2024-01-08",
    pdfsProcessed: 1400,
    thumbnailsGenerated: 2800,
    apiCalls: 4200,
  },
  {
    date: "2024-01-09",
    pdfsProcessed: 1550,
    thumbnailsGenerated: 3100,
    apiCalls: 4650,
  },
  {
    date: "2024-01-10",
    pdfsProcessed: 1650,
    thumbnailsGenerated: 3300,
    apiCalls: 4950,
  },
  {
    date: "2024-01-11",
    pdfsProcessed: 1250,
    thumbnailsGenerated: 2500,
    apiCalls: 3750,
  },
  {
    date: "2024-01-12",
    pdfsProcessed: 1800,
    thumbnailsGenerated: 3600,
    apiCalls: 5400,
  },
  {
    date: "2024-01-13",
    pdfsProcessed: 1500,
    thumbnailsGenerated: 3000,
    apiCalls: 4500,
  },
  {
    date: "2024-01-14",
    pdfsProcessed: 1700,
    thumbnailsGenerated: 3400,
    apiCalls: 5100,
  },
  {
    date: "2024-01-15",
    pdfsProcessed: 1350,
    thumbnailsGenerated: 2700,
    apiCalls: 4050,
  },
];
