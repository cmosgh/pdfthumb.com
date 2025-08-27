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
