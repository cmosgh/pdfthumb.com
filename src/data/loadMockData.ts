import { collections } from "../db";

// Fills the dashboard collections with invented data for local development.
// main.tsx imports this only in dev builds, so production never ships it (#112).
export async function loadMockData() {
  const {
    mockDashboardSummary,
    mockUsageTrends,
    mockFileTypeData,
    mockErrorLogs,
    mockGeographicData,
    mockDetailedAnalytics,
  } = await import("./dashboardMocks");

  // Add IDs to data that needs them
  const dashboardSummaryWithId = { ...mockDashboardSummary, id: "main" };
  const usageTrendsWithIds = mockUsageTrends.map((item, index) => ({
    ...item,
    id: `usage-${index}`,
  }));
  const fileTypeDataWithIds = mockFileTypeData.map((item, index) => ({
    ...item,
    id: `filetype-${index}`,
  }));
  const geographicDataWithIds = mockGeographicData.map((item, index) => ({
    ...item,
    id: `geo-${index}`,
  }));
  const detailedAnalyticsWithId = { ...mockDetailedAnalytics, id: "main" };

  // Insert mock data one by one
  await collections.dashboardSummary.insert(dashboardSummaryWithId);
  for (const item of usageTrendsWithIds) {
    await collections.usageTrends.insert(item);
  }
  for (const item of fileTypeDataWithIds) {
    await collections.fileTypeData.insert(item);
  }
  for (const item of mockErrorLogs) {
    await collections.errorLogs.insert(item);
  }
  for (const item of geographicDataWithIds) {
    await collections.geographicData.insert(item);
  }
  await collections.detailedAnalytics.insert(detailedAnalyticsWithId);
}
