import { createCollection, localOnlyCollectionOptions } from "@tanstack/db";
import { apiKeysApi } from "./api";
import { queryClient } from "./queryClient";
import { mockApiKeys } from "./data/dashboardMocks";
import type {
  ApiKey,
  DashboardSummary,
  DetailedAnalytics,
  ErrorLogData,
  FileTypeData,
  GeographicData,
  UsageTrendData,
} from "./types";

// Define collections for different data types
export const dashboardSummaryCollection = createCollection(
  localOnlyCollectionOptions({
    id: "dashboardSummary",
    getKey: (item: DashboardSummary & { id: string }) => item.id,
  }),
);

export const usageTrendsCollection = createCollection(
  localOnlyCollectionOptions({
    id: "usageTrends",
    getKey: (item: UsageTrendData & { id: string }) => item.id,
  }),
);

export const fileTypeDataCollection = createCollection(
  localOnlyCollectionOptions({
    id: "fileTypeData",
    getKey: (item: FileTypeData & { id: string }) => item.id,
  }),
);

export const errorLogsCollection = createCollection(
  localOnlyCollectionOptions({
    id: "errorLogs",
    getKey: (item: ErrorLogData) => item.id,
  }),
);

export const geographicDataCollection = createCollection(
  localOnlyCollectionOptions({
    id: "geographicData",
    getKey: (item: GeographicData & { id: string }) => item.id,
  }),
);

export const apiKeysCollection = createCollection(
  localOnlyCollectionOptions({
    id: "apiKeys",
    getKey: (item: ApiKey) => item.id,
  }),
);

export const detailedAnalyticsCollection = createCollection(
  localOnlyCollectionOptions({
    id: "detailedAnalytics",
    getKey: (item: DetailedAnalytics & { id: string }) => item.id,
  }),
);

// Export collections object for easier access
export const collections = {
  dashboardSummary: dashboardSummaryCollection,
  usageTrends: usageTrendsCollection,
  fileTypeData: fileTypeDataCollection,
  errorLogs: errorLogsCollection,
  geographicData: geographicDataCollection,
  apiKeys: apiKeysCollection,
  detailedAnalytics: detailedAnalyticsCollection,
};

// Helper functions for common operations
export const dbHelpers = {
  // Initialize with mock data
  async initializeWithMockData() {
    const {
      mockDashboardSummary,
      mockUsageTrends,
      mockFileTypeData,
      mockErrorLogs,
      mockGeographicData,
      mockApiKeys,
      mockDetailedAnalytics,
    } = await import("./data/dashboardMocks");

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
    for (const item of mockApiKeys) {
      // only adding in tests
      if (import.meta.env.MODE === "test") {
        await collections.apiKeys.insert(item);
      }
    }
    await collections.detailedAnalytics.insert(detailedAnalyticsWithId);
  },

  // Sync API keys from the API
  async syncApiKeys(token?: string) {
    try {
      const apiKeys = await apiKeysApi.getApiKeys(token);

      // The API is the source of truth: update keys we already hold (e.g. a
      // revoke flips `enabled`), insert new ones. Update in place: a delete
      // followed by an insert of the same key lets the delete's transaction
      // commit last and drop the row.
      for (const key of apiKeys) {
        try {
          if (collections.apiKeys.has(key.id)) {
            collections.apiKeys.update(key.id, (draft) => {
              Object.assign(draft, key);
            });
          } else {
            collections.apiKeys.insert(key);
          }
        } catch (e) {
          // One bad key mustn't stop the rest from syncing.
          console.warn(`Failed to sync API key ${key.id}:`, e);
        }
      }

      return apiKeys;
    } catch (error) {
      console.error("Error syncing API keys:", error);
      throw error;
    }
  },

  // Clear all data - placeholder for now
  async clearAllData() {
    // For now, we'll just log - in a real app you'd implement proper clearing
    console.log("Clearing data not implemented yet");
  },
};
