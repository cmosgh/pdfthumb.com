import type React from "react";

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  priceFrequency: string;
  priceYearly?: string;
  priceFrequencyYearly?: string;
  annualDiscountText?: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  isFeatured?: boolean;
  isComingSoon?: boolean;
  highlightColor?: string; // e.g., 'bg-blue-500', 'bg-indigo-500'
  overageRateDisplay?: string; // e.g., "$0.002/thumbnail" or "N/A"
  overageDescription?: string; // e.g., "Billed automatically" or "Upgrade required"
  currency?: string; // Optional: e.g., 'USD', '$', '€'
}

export interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface ChartDataPoint {
  [key: string]: string | number;
  date: string;
}

export interface DashboardSummary {
  totalPdfsProcessed: number;
  totalThumbnailsGenerated: number;
  totalApiCalls: number;
  monthlyGrowth: number;
}

export interface UsageTrendData extends ChartDataPoint {
  date: string;
  pdfsProcessed: number;
  thumbnailsGenerated: number;
  apiCalls: number;
}

export interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

// Detailed Analytics Types
export interface FileTypeData extends ChartDataPoint {
  date: string;
  pdf: number;
  png: number;
  jpg: number;
  other: number;
}

export interface ErrorLogData {
  id: string;
  timestamp: string;
  errorType: string;
  message: string;
  fileName?: string;
  userId?: string;
}

export interface GeographicData {
  country: string;
  requests: number;
  percentage: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// User Settings Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  company?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  identifier: string; // Masked key identifier
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt?: string;
  enabled: boolean;
}

export interface DetailedAnalytics {
  usageByFileType: FileTypeData[];
  errorLogs: ErrorLogData[];
  geographicDistribution: GeographicData[];
  totalErrors: number;
  errorRate: number;
}
