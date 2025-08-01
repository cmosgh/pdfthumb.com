import { PricingTier, FeatureItem } from "./types.ts"; // Added .ts
import {
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  CloudArrowUpIcon,
  LockClosedIcon,
  RocketLaunchIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "./components/icons.tsx"; // Added .tsx
import React from "react";

export const NAV_LINKS = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Docs", href: "#features" }, // Reverted to on-page scroll, e.g. linking to features as a placeholder
];

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "developer",
    name: "Developer",
    price: "0",
    priceFrequency: "/month",
    description: "Perfect for hobby projects and getting started.",
    features: [
      "1,000 thumbnails/month",
      "Basic Thumbnail Quality",
      "Community Support",
    ],
    ctaText: "Get Started Free",
    ctaLink: "#signup-developer",
    highlightColor: "bg-sky-500",
    overageRateDisplay: "N/A",
    overageDescription: "Upgrade to a paid plan to exceed limits.",
  },
  {
    id: "basic",
    name: "Basic",
    price: "9",
    priceFrequency: "/month",
    priceYearly: "100",
    priceFrequencyYearly: "/year",
    annualDiscountText: "Save $8 annually",
    description: "Ideal for individuals and small projects needing more calls.",
    features: [
      "10,000 thumbnails/month",
      "Standard Thumbnail Quality",
      "Community Support",
      "No Watermarks",
    ],
    ctaText: "Choose Basic",
    ctaLink: "#signup-basic",
    highlightColor: "bg-teal-500",
    overageRateDisplay: "$0.002 / thumbnail",
    overageDescription: "Billed automatically for additional usage.",
  },
  {
    id: "pro",
    name: "Pro",
    price: "49",
    priceFrequency: "/month",
    priceYearly: "490",
    priceFrequencyYearly: "/year",
    annualDiscountText: "Save $98 annually (2 months free!)",
    description: "For growing businesses and professional use.",
    features: [
      "100,000 thumbnails/month",
      "High Quality Thumbnails",
      "Email Support",
      "No Watermarks",
      "Usage Analytics",
    ],
    ctaText: "Choose Pro",
    ctaLink: "#signup-pro",
    isFeatured: true,
    highlightColor: "bg-indigo-600",
    overageRateDisplay: "$0.001 / thumbnail",
    overageDescription:
      "Billed automatically for additional usage at a discounted rate.",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    priceFrequency: "",
    description: "Tailored solutions for large-scale applications.",
    features: [
      "Unlimited thumbnails",
      "Highest Quality & Custom Sizes",
      "Dedicated Support & SLA",
      "Advanced Security Options",
      "Custom Integrations",
    ],
    ctaText: "Contact Sales",
    ctaLink: "#contact-sales",
    isComingSoon: true,
    highlightColor: "bg-sky-500",
    overageRateDisplay: "Custom",
    overageDescription: "Custom overage rates as per your service agreement.",
  },
];

// Fix: Explicitly type FEATURE_ITEMS and use React.createElement for icons.
// Removed specific text color from icons here, will be applied in FeatureCard.
export const FEATURE_ITEMS: FeatureItem[] = [
  {
    icon: React.createElement(RocketLaunchIcon, { className: "h-8 w-8" }),
    title: "Lightning Fast Generation",
    description:
      "Our API processes PDFs and returns thumbnails in milliseconds, ensuring a smooth user experience.",
  },
  {
    icon: React.createElement(ScaleIcon, { className: "h-8 w-8" }),
    title: "Scalable Infrastructure",
    description:
      "Built to handle millions of requests, our infrastructure scales with your needs, from small projects to enterprise loads.",
  },
  {
    icon: React.createElement(CogIcon, { className: "h-8 w-8" }),
    title: "Easy Integration",
    description:
      "Simple REST API with clear documentation and client libraries for popular languages. Integrate in minutes!",
  },
  {
    icon: React.createElement(ShieldCheckIcon, { className: "h-8 w-8" }),
    title: "Privacy First: Zero File Retention",
    description:
      "Your PDF files are processed in memory and never stored on our servers, ensuring maximum privacy and security for your sensitive documents.",
  },
  {
    icon: React.createElement(SparklesIcon, { className: "h-8 w-8" }),
    title: "AI-Powered Integration (Coming Soon)",
    description:
      "Future-ready: We're enabling AI agents to intelligently interact with our API (e.g., via MCP), making automated PDF thumbnail workflows even smarter.",
  },
  {
    icon: React.createElement(CloudArrowUpIcon, { className: "h-8 w-8" }),
    title: "Reliable Platform", // Changed title slightly for better flow
    description:
      "We ensure high uptime and secure processing, with data privacy as a top priority for all thumbnail generations.",
  },
  {
    icon: React.createElement(LockClosedIcon, { className: "h-8 w-8" }),
    title: "Developer Friendly",
    description:
      "Clear documentation, fair pricing, and responsive support to help you succeed.",
  },
  {
    icon: React.createElement(CheckCircleIcon, { className: "h-8 w-8" }),
    title: "High Quality Thumbnails",
    description:
      "Generate crisp, clear thumbnails perfect for previews, galleries, and document management systems.",
  },
];
