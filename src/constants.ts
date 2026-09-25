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
    linkOptions: linkOptions({ to: "/", hash: "pricing" }),
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

// M10's business hours are unconfirmed, whatever the mailbox's state.
export const SLA_HOURS_CONFIRMED = false as boolean;
const HOURS_TBC = SLA_HOURS_CONFIRMED ? "" : " [hours TBC]";

const OVERAGE_NOT_YET =
  "Overage billing starts when paid plans launch. Until then, Free stops at 1,000 Thumbnails a month.";

// Prices are withheld for now (#71): the plans show "Upcoming" and their
// buttons start no checkout. The amounts are left out of the bundle too.
// The claims follow the Plans & pricing decisions M1–M15 (#118).
export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    price: "Upcoming",
    priceFrequency: "",
    description: "For builders and side projects.",
    quota: "1,000 Thumbnails a month",
    features: [
      "PDFs up to 10 MB",
      {
        text: "Email support, best effort (no response time)",
        contact: "support",
      },
    ],
    ctaText: "Upcoming",
    isComingSoon: true,
    ctaLink: "#signup-free",
    highlightColor: "bg-sky-500",
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
    highlightColor: "bg-teal-500",
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
    features: [
      "PDFs up to 10 MB",
      { text: "Email, next business day", contact: "support" },
    ],
    ctaText: "Upcoming",
    isComingSoon: true,
    ctaLink: "#signup-pro",
    isFeatured: true,
    highlightColor: "bg-indigo-600",
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
      `Contract SLA: business hours (09:00–17:00 Romanian time, EET/EEST, Mon–Fri${HOURS_TBC}), next-business-day first response · integration help`,
      { text: "Talk to sales", contact: "sales" },
    ],
    ctaText: "Contact Sales",
    ctaContact: "sales",
    ctaLink: "#contact-sales",
    highlightColor: "bg-sky-500",
    overageRateDisplay: "Custom",
    overageDescription: "Custom overage rates as per your service agreement.",
  },
];

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
      "Simple REST API with clear documentation and client libraries for popular languages. Integrate in minutes!",
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
