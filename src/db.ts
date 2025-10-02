import { createCollection, localOnlyCollectionOptions } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "./queryClient";
import { apiKeysApi } from "./api";
import type {
  ApiKey,
  DashboardSummary,
  DetailedAnalytics,
  ErrorLogData,
  FileTypeData,
  GeographicData,
  UsageTrendData,
  UserProfile,
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

export const userProfileCollection = createCollection(
  localOnlyCollectionOptions({
    id: "userProfile",
    getKey: (item: UserProfile) => item.id,
  }),
);

// Store current token for API calls
let currentToken: string | undefined;

export const setAuthToken = (token: string | undefined) => {
  currentToken = token;
};

export const apiKeysCollection = createCollection(
  import.meta.env.MODE === "test"
    ? // In test mode, use localOnlyCollectionOptions for easier testing
      localOnlyCollectionOptions({
        id: "apiKeys",
        getKey: (item: ApiKey) => item.id,
      })
    : // In production, use queryCollectionOptions with TanStack Query
      queryCollectionOptions({
        id: "apiKeys",
        queryKey: ["apiKeys"],
        queryFn: async () => {
          return apiKeysApi.getApiKeys(currentToken);
        },
        queryClient,
        getKey: (item: ApiKey) => item.id,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        startSync: false,
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
  userProfile: userProfileCollection,
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
      mockUserProfile,
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
    await collections.userProfile.insert(mockUserProfile);
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
    if (import.meta.env.MODE === "test") {
      // In test mode with localOnlyCollectionOptions, fetch and insert manually
      try {
        const apiKeys = await apiKeysApi.getApiKeys(token);
        // Clear existing keys
        const existingKeys = Array.from(apiKeysCollection.keys());
        for (const keyId of existingKeys) {
          await apiKeysCollection.delete(keyId);
        }
        // Insert new keys
        for (const apiKey of apiKeys) {
          await apiKeysCollection.insert(apiKey);
        }
      } catch (error) {
        console.error("Error syncing API keys in test mode:", error);
        throw error;
      }
    } else {
      // In production mode with queryCollectionOptions, use TanStack Query
      setAuthToken(token);
      apiKeysCollection.startSyncImmediate();
      await queryClient.refetchQueries({
        queryKey: ["apiKeys"],
      });
    }
  },

  // Clear all data - placeholder for now
  async clearAllData() {
    // For now, we'll just log - in a real app you'd implement proper clearing
    console.log("Clearing data not implemented yet");
  },
};
