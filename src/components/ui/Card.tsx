import React from "react";
import { cx } from "./cx";

// Colour, border, radius and shadow. Padding and layout come from the
// caller, except "field", which carries its text (see README).
const cardVariant = {
  // Dashboard cards: PlanQuota, RequestsPerDay, ProfileSettings,
  // ApiKeysManager, the settings loading box.
  panel: "bg-surface rounded-lg shadow-sm border border-line",
  // Settings: Notification Preferences; the hero proof.
  raised:
    "bg-surface rounded-lg shadow-lg shadow-elevation/50 border border-line",
  // FeaturesSection cards.
  feature:
    "bg-surface-raised rounded-lg shadow-lg hover:shadow-xl shadow-elevation-deep/50 hover:shadow-elevation-deep/60 transition-shadow duration-300",
  // PricingCard; `featured` picks the border and lift.
  pricing:
    "bg-surface-raised rounded-xl shadow-lg shadow-elevation-deep/50 transition-all duration-300",
  // Login form box.
  login: "bg-surface shadow sm:rounded-lg",
  // Generate-key form.
  well: "bg-muted rounded-lg",
  // Key box in ApiKeyGeneratedDialog.
  wellOutlined: "bg-muted rounded-lg border border-line-strong",
  // Pricing on-prem band.
  band: "rounded-xl border border-line-strong bg-muted",
  // ProfileSettings value (a dd): the text lives on the block itself.
  field: "bg-muted rounded-md text-sm text-fg-strong",
  // BarChart tooltip.
  tooltip: "bg-surface border border-line-strong rounded-lg shadow-lg",
} as const;

const pricingFeatured =
  "border-4 border-accent transform scale-105 z-10 relative";
const pricingPlain = "border border-line-strong";

export type CardVariant = keyof typeof cardVariant;

type CardTag = "div" | "section" | "article" | "aside" | "dd" | "li";

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  variant: CardVariant;
  as?: CardTag;
  // variant="pricing" only.
  featured?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant,
  as: Tag = "div",
  featured = false,
  className,
  ...rest
}) => (
  <Tag
    className={cx(
      cardVariant[variant],
      variant === "pricing" && (featured ? pricingFeatured : pricingPlain),
      className,
    )}
    {...rest}
  />
);
