import type React from "react";

export type ContactKind = "support" | "sales";

// A plan line, optionally followed by a contact address.
export type PlanFeature = string | { text: string; contact: ContactKind };

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  priceFrequency: string;
  priceYearly?: string;
  priceFrequencyYearly?: string;
  annualDiscountText?: string;
  description: string;
  quota: string;
  features: PlanFeature[];
  ctaText: string;
  ctaLink: string;
  ctaContact?: ContactKind;
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

export interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

// User Settings Types
export interface ApiKey {
  id: string;
  name: string;
  identifier: string; // Masked key identifier
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt?: string;
  enabled: boolean;
}

// Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp when access token expires
}

// The session the backend returns from POST /api/auth/oauth/exchange
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: string; // jsonwebtoken duration, e.g. "1h"
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
    roles: string[];
  };
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRoleLoading: boolean;
}
