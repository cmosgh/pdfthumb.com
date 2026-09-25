import React from "react";
import { cx } from "./cx";

// Badges carry their padding and display.
const badgeVariant = {
  // PricingCard "Most Popular".
  pill: "bg-accent text-on-accent text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider",
  // PricingCard "Soon", with an icon.
  chip: "bg-chip text-on-accent text-xs font-semibold px-3 py-1 rounded-full uppercase flex items-center",
  // API key status.
  success:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-muted text-success-muted-fg",
  danger:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-muted text-danger-muted-fg",
} as const;

export type BadgeVariant = keyof typeof badgeVariant;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  className,
  ...rest
}) => <span className={cx(badgeVariant[variant], className)} {...rest} />;

const dotBase = "inline-block h-3 w-3 rounded-full";

const dotTone = {
  success: "bg-success",
  warning: "bg-warning",
} as const;

export type DotTone = keyof typeof dotTone;

export interface DotProps extends React.HTMLAttributes<HTMLSpanElement> {
  // A status colour (/status) ...
  tone?: DotTone;
  // ... or a runtime colour, e.g. a chart series swatch.
  color?: string;
}

export const Dot: React.FC<DotProps> = ({
  tone,
  color,
  className,
  style,
  ...rest
}) => (
  <span
    className={cx(dotBase, tone && dotTone[tone], className)}
    style={color ? { backgroundColor: color, ...style } : style}
    {...rest}
  />
);
