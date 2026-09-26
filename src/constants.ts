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
import { linkOptions } from "@tanstack/react-router";

// Type-safe navigation links using TanStack Router's linkOptions
export const NAV_LINKS = [
  {
    name: "Features",
    linkOptions: linkOptions({ to: "/", hash: "features" }),
  },
  {
    name: "Pricing",
    linkOptions: linkOptions({ to: "/pricing" }),
  },
  {
    name: "Docs",
    linkOptions: linkOptions({ to: "/docs" }),
  },
];

export const HOME_LINK = linkOptions({
  to: "/",
  resetScroll: true,
  hash: "instant-thumbnails",
});

export const APP_NAME = "PDFThumb";

// Q1 (#118): how contact details that wait for the mailbox render.
// "mailto" links the addresses and hides the [TBC] markers, "tbc" links them
// and shows the markers, "plain" prints the addresses as text.
export type ContactRender = "mailto" | "tbc" | "plain";
export const CONTACT_RENDER = "tbc" as ContactRender;

export const CONTACT_EMAILS = {
  support: "support@pdfthumb.com",
  sales: "sales@pdfthumb.com",
} as const;

export const OVERAGE_NOT_YET =
  "Overage billing starts when paid plans launch. Until then, Free stops at 1,000 Thumbnails a month.";

// Paid prices are withheld for now (#71): those plans show "Upcoming" and
// their buttons start no checkout. Free is live at €0 and starts sign-up
// (#129). The amounts are left out of the bundle too.
// The claims follow the Plans & pricing decisions M1–M15 (#118).
// The numbers the /pricing slider reads (#141): monthlyQuota follows
// monthlyThumbnailLimit in pdfthumbnailpro-be
// src/subscription/default-subscription-types.ts; a paid monthlyPriceEur
// is added only when #185 releases the prices.
export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    price: "€0",
    priceFrequency: "",
    monthlyPriceEur: 0,
    description: "For builders and side projects.",
    quota: "1,000 Thumbnails a month",
    monthlyQuota: 1000,
    features: [
      "PDFs up to 10 MB",
      {
        text: "Email support, best effort (no response time)",
        contact: "support",
      },
    ],
    ctaText: "Start free",
    ctaLink: "/login",
    overageRateDisplay: "N/A",
    overageDescription: "Upgrade to a paid plan to exceed limits.",
  },
  {
    id: "basic",
    name: "Basic",
    price: "Upcoming",
    priceFrequency: "",
    description: "Ideal for individuals and small projects needing more calls.",
    quota: "10,000 Thumbnails a month",
    monthlyQuota: 10000,
    features: [
      "PDFs up to 10 MB",
      {
        text: "Email support, best effort (no response time)",
        contact: "support",
      },
    ],
    ctaText: "Upcoming",
    isComingSoon: true,
    ctaLink: "#signup-basic",
    overageRateDisplay: "Upcoming",
    overageDescription: OVERAGE_NOT_YET,
  },
  {
    id: "pro",
    name: "Pro",
    price: "Upcoming",
    priceFrequency: "",
    description: "For growing businesses and professional use.",
    quota: "100,000 Thumbnails a month",
    monthlyQuota: 100000,
    features: [
      "PDFs up to 10 MB",
      { text: "Email, next business day", contact: "support" },
    ],
    ctaText: "Upcoming",
    isComingSoon: true,
    ctaLink: "#signup-pro",
    isFeatured: true,
    overageRateDisplay: "Upcoming",
    overageDescription: OVERAGE_NOT_YET,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    priceFrequency: "",
    description: "Tailored solutions for large-scale applications.",
    quota: "Volume by contract",
    features: [
      "PDFs up to 10 MB",
      "Contract SLA · integration help",
      { text: "Talk to sales", contact: "sales" },
    ],
    ctaText: "Contact Sales",
    ctaContact: "sales",
    ctaLink: "#contact-sales",
    overageRateDisplay: "Custom",
    overageDescription: "Custom overage rates as per your service agreement.",
  },
];

// Said next to every price (#141): the price list is in EUR (Q7,
// pdfthumbnailpro-be docs/research/on-prem-enterprise-pricing.md). No VAT
// claim yet: VAT handling is an open driver decision (pdfthumbnailpro-be#185),
// and the coordinator ruled "EUR" alone until then.
export const PRICE_NOTE = "EUR";

// The monthly/yearly toggle on /pricing (#141) is built but stays off. The
// driver decided annual billing is "2 months free" (2026-09-25), but the
// paid amounts are withheld until pdfthumbnailpro-be#185: turn it on
// together with those amounts (yearlyPriceEur). While it's off, nothing
// yearly renders.
export const SHOW_YEARLY_TOGGLE: boolean = false;

// Said once below the cards, not on each one (M3, M5, M9).
export const EVERY_PLAN_INCLUDES = [
  "Same rendering on every plan",
  "Any width from 16 to 1,600 px",
  "No watermarks on any plan",
  "EU-hosted in Germany · API keys stored hashed and revocable",
];

// M14 + Q4. "Trial on request" joins once the trial cap ships. The licence
// is €9,000/yr per company; until the SaaS prices go live with billing
// (pdfthumbnailpro-be#185), the page says "Pricing on request" (Q-P).
export const ON_PREM = {
  title: "On-prem edition",
  text: "Run PDFThumb in your own infrastructure (Kubernetes/Helm or AWS via Terraform), with unlimited instances and no per-Thumbnail charges under one annual licence, and counts-only usage reports.",
  price: "Pricing on request",
};

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
      "Simple REST API with an OpenAPI reference and examples in seven languages",
  },
  {
    icon: React.createElement(ShieldCheckIcon, { className: "h-8 w-8" }),
    title: "Privacy First",
    description:
      "PDFs are processed in memory and never stored. ZIP archives of your thumbnails sit on local disk only while they download, deleted within an hour at most.",
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

// Request limits the documentation page states (#126). They follow the
// backend: the upload cap (thumbnail.controller.ts) and the width bounds
// (render-size.ts). Change them here when the backend changes.
export const API_LIMITS = {
  maxUploadMB: 10,
  minWidthPx: 16,
  maxWidthPx: 1600,
};

export const SWAGGER_URL = "https://pdfthumb.com/api/swagger";
// The public API origin, for examples readers copy. The app itself calls
// the same-origin /api (src/api.ts).
export const PUBLIC_API_URL = "https://pdfthumb.com/api";
