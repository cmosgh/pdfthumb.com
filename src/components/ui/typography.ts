// The typography maps behind Heading, Text and the other text-bearing
// primitives. Every value is a complete literal, so Tailwind's scanner
// sees it; never build a class name by concatenation.

import { cx } from "./cx";

export const textSize = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
  "5xl": "text-5xl",
  // Responsive sizes, named by where they're used.
  hero: "text-4xl sm:text-5xl md:text-6xl",
  section: "text-3xl sm:text-4xl",
  page: "text-3xl md:text-4xl",
  lead: "text-lg md:text-xl",
  priceWord: "text-3xl lg:text-2xl xl:text-3xl",
} as const;

export const textWeight = {
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
} as const;

export const textTone = {
  heading: "text-heading",
  fg: "text-fg",
  "fg-strong": "text-fg-strong",
  "fg-2": "text-fg-2",
  "fg-muted": "text-fg-muted",
  "fg-caption": "text-fg-caption",
  "fg-subtle": "text-fg-subtle",
  "fg-label": "text-fg-label",
  "fg-faint": "text-fg-faint",
  link: "text-link",
  "on-accent": "text-on-accent",
  "on-accent-muted": "text-on-accent-muted",
  "danger-fg": "text-danger-fg",
  "success-fg": "text-success-fg",
  "warning-fg": "text-warning-fg",
  // Icon colour (the dialog's warning triangle).
  warning: "text-warning",
  // No colour class: the element inherits (PricingCard's non-featured name).
  inherit: "",
} as const;

export const textLeading = {
  tight: "leading-tight",
  // PricingCard: a word in the price slot keeps the slot as tall as a price.
  price: "leading-[3rem]",
} as const;

export const textTracking = {
  wider: "tracking-wider",
} as const;

export const listStyle = {
  disc: "list-disc",
} as const;

export type TextSize = keyof typeof textSize;
export type TextWeight = keyof typeof textWeight;
export type TextTone = keyof typeof textTone;
export type TextLeading = keyof typeof textLeading;
export type TextTracking = keyof typeof textTracking;
export type ListStyle = keyof typeof listStyle;

export interface TypographyProps {
  size?: TextSize;
  weight?: TextWeight;
  tone?: TextTone;
  leading?: TextLeading;
  tracking?: TextTracking;
  mono?: boolean;
  uppercase?: boolean;
}

// Only the props that are set produce a class, so every combination in use
// maps to exactly its current class set.
export function typographyClasses({
  size,
  weight,
  tone,
  leading,
  tracking,
  mono,
  uppercase,
}: TypographyProps): string {
  return cx(
    size && textSize[size],
    weight && textWeight[weight],
    tone && textTone[tone],
    leading && textLeading[leading],
    tracking && textTracking[tracking],
    mono && "font-mono",
    uppercase && "uppercase",
  );
}
