import React from "react";
import { cx } from "./cx";

const surfaceTone = {
  // Navbar header, dashboard mobile header.
  bar: "bg-surface shadow-sm shadow-elevation",
  // Dashboard sidebar.
  sidebar: "bg-surface shadow-lg shadow-elevation",
  // Navbar mobile menu.
  menu: "bg-surface shadow-lg",
  // Site footer.
  footer: "bg-band border-t border-line",
  // Hero section, DashboardLayout root.
  hero: "bg-gradient-to-br from-hero-start to-hero-end",
  // CTASection.
  cta: "bg-gradient-to-r from-cta-start to-cta-end",
  // FeaturesSection.
  band: "bg-band",
  // PricingSection.
  surface: "bg-surface",
  // OveragePricingSection, login, callback, dashboard loading.
  page: "bg-page",
  // Dashboard mobile sidebar backdrop.
  overlay: "bg-overlay",
} as const;

export type SurfaceTone = keyof typeof surfaceTone;

type SurfaceTag =
  "div" | "header" | "footer" | "aside" | "nav" | "section" | "main";

export interface SurfaceProps extends React.HTMLAttributes<HTMLElement> {
  tone: SurfaceTone;
  as?: SurfaceTag;
}

// A background. Layout (padding, flex, position, size) comes from
// className.
export const Surface: React.FC<SurfaceProps> = ({
  tone,
  as: Tag = "div",
  className,
  ...rest
}) => <Tag className={cx(surfaceTone[tone], className)} {...rest} />;

export type SectionProps = Omit<SurfaceProps, "as">;

// A page <section> on a Surface tone.
export const Section: React.FC<SectionProps> = (props) => (
  <Surface as="section" {...props} />
);

// The page-width wrapper: layout only.
export const Container: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => (
  <div
    className={cx("container mx-auto px-4 sm:px-6 lg:px-8", className)}
    {...rest}
  />
);
