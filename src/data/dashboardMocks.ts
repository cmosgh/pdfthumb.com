import type {
  DashboardSummary,
  UsageTrendData,
  FileTypeData,
  ErrorLogData,
  GeographicData,
  UserProfile,
  ApiKey,
  DetailedAnalytics,
} from "../types";

const generatePastDays = (days: number) => {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    result.push(date.toISOString().split("T")[0]);
  }
  return result;
};

const past7Days = generatePastDays(7);
const past15Days = generatePastDays(15);

// Mock data for detailed analytics
export const mockFileTypeData: FileTypeData[] = past7Days.map((date) => ({
  date,
  pdf: Math.floor(Math.random() * 500) + 700,
  png: Math.floor(Math.random() * 200) + 250,
  jpg: Math.floor(Math.random() * 150) + 200,
  other: Math.floor(Math.random() * 50) + 30,
}));

export const mockErrorLogs: ErrorLogData[] = past7Days
  .slice(0, 4)
  .map((date, index) => ({
    id: `${index + 1}`,
    timestamp: new Date(date).toISOString(),
    errorType: [
      "File Processing",
      "API Rate Limit",
      "Authentication",
      "Corrupted file",
    ][index],
    message: [
      "Invalid PDF format",
      "Rate limit exceeded",
      "Invalid API key",
      "Corrupted file",
    ][index],
    fileName: `document-${index}.pdf`,
    userId: `user${123 + index}`,
  }));

export const mockGeographicData: GeographicData[] = [
  { country: "United States", requests: 45000, percentage: 35.2 },
  { country: "United Kingdom", requests: 25000, percentage: 19.6 },
  { country: "Germany", requests: 18000, percentage: 14.1 },
  { country: "France", requests: 12000, percentage: 9.4 },
  { country: "Canada", requests: 10000, percentage: 7.8 },
  { country: "Australia", requests: 8000, percentage: 6.3 },
  { country: "Japan", requests: 6000, percentage: 4.7 },
  { country: "Other", requests: 4000, percentage: 3.1 },
];

// Mock user settings data
export const mockUserProfile: UserProfile = {
  id: "user123",
  name: "John Doe",
  email: "john.doe@example.com",
  company: "Acme Corp",
  createdAt: "2023-06-15T10:30:00Z",
  updatedAt: new Date().toISOString(),
};

export const mockApiKeys: ApiKey[] = [
  {
    id: "1",
    name: "Production API Key",
    identifier: "ptk_live_****abcd", // Masked identifier
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: null,
    lastUsedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    enabled: true,
  },
  {
    id: "2",
    name: "Development API Key",
    identifier: "ptk_test_****ef12", // Masked identifier
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: null,
    lastUsedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    enabled: true,
  },
  {
    id: "3",
    name: "Old API Key",
    identifier: "ptk_live_****6789", // Masked identifier
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Expired
    lastUsedAt: null,
    enabled: false,
  },
];

export const mockDetailedAnalytics: DetailedAnalytics = {
  usageByFileType: mockFileTypeData,
  errorLogs: mockErrorLogs,
  geographicDistribution: mockGeographicData,
  totalErrors: mockErrorLogs.length,
  errorRate: 0.8,
};

export const mockDashboardSummary: DashboardSummary = {
  totalPdfsProcessed: 125847,
  totalThumbnailsGenerated: 251694,
  totalApiCalls: 892341,
  monthlyGrowth: -5.2, // Test with negative growth to ensure proper display
};

export const mockUsageTrends: UsageTrendData[] = past15Days.map((date) => ({
  date,
  pdfsProcessed: Math.floor(Math.random() * 600) + 1000,
  thumbnailsGenerated: Math.floor(Math.random() * 1200) + 2000,
  apiCalls: Math.floor(Math.random() * 1800) + 3000,
}));
