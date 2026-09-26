import React from "react";
import { cx } from "./cx";

// Padding comes from the caller (p-4, or p-3 for the compact one).
const calloutVariant = {
  // ApiKeyGeneratedDialog notice; the text inside is warning-fg.
  warning: "bg-warning-soft border border-warning-line rounded-lg",
  // Settings API-key error.
  danger: "bg-danger-soft border border-danger-line rounded-lg",
  // Login error (a p with role="alert"): carries its text.
  dangerCompact: "rounded-md bg-danger-soft text-sm text-danger-fg",
} as const;

export type CalloutVariant = keyof typeof calloutVariant;

export interface CalloutProps extends React.HTMLAttributes<HTMLElement> {
  variant: CalloutVariant;
  as?: "div" | "p";
}

export const Callout: React.FC<CalloutProps> = ({
  variant,
  as: Tag = "div",
  className,
  ...rest
}) => <Tag className={cx(calloutVariant[variant], className)} {...rest} />;
