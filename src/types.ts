import type React from "react";

export type ContactKind = "support" | "sales";

// A plan line, optionally followed by a contact address.
export type PlanFeature = string | { text: string; contact: ContactKind };

export interface PricingTier {
  id: string;
  name: string;
  // The word shown while there is no amount ("Upcoming", "Custom").
  price: string;
  priceFrequency: string;
  // The amounts, in whole EUR (#141). Leave one out while it
  // is withheld: the page then shows `price`, and shows the amount by
  // itself once it is set here. Withheld amounts must not enter the bundle.
  monthlyPriceEur?: number;
  // Shown only with the yearly toggle (SHOW_YEARLY_TOGGLE).
  yearlyPriceEur?: number;
  description: string;
  quota: string;
  // Thumbnails a month, as a number: the volume slider (#141) reads it.
  // A self-serve plan has one; Enterprise, sized by contract, has none.
  monthlyQuota?: number;
  features: PlanFeature[];
  ctaText: string;
  ctaLink: string;
  ctaContact?: ContactKind;
  isFeatured?: boolean;
  isComingSoon?: boolean;
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
  // null: no value that day (e.g. no response times without requests)
  [key: string]: string | number | null;
  date: string;
}

export interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | null;
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
  isRoleLoading: boolean;
}
