import React from "react";
import { createLink } from "@tanstack/react-router";
import { cx } from "./cx";

const textLinkTone = {
  // PlanQuota "See plans", NotFound, the Navbar/Footer brand link.
  link: "text-link hover:text-link-hover",
  // Docs links, ContactEmail's default.
  underline: "text-link hover:underline",
  // Navbar links and the mobile menu.
  nav: "font-medium text-fg-muted hover:text-link transition-colors",
  // Navbar Dashboard, Log In, Logout.
  navSm: "text-sm font-medium text-fg-muted hover:text-link",
  // Footer links, ContactEmail in the footer.
  footer: "text-fg-subtle hover:text-link text-sm",
  // /status "Check again".
  status:
    "text-sm font-medium text-link hover:text-link-hover disabled:opacity-60",
  // ApiKeysManager "Revoke" (its cell carries text-sm font-medium).
  danger: "text-danger-fg hover:text-danger-muted-fg",
} as const;

export type TextLinkTone = keyof typeof textLinkTone;

export interface TextLinkStyleProps {
  tone?: TextLinkTone;
  // "medium" adds font-medium (PlanQuota, NotFound).
  weight?: "medium";
}

export function textLinkClasses({
  tone = "link",
  weight,
}: TextLinkStyleProps): string {
  return cx(weight === "medium" && "font-medium", textLinkTone[tone]);
}

export interface TextLinkProps
  extends TextLinkStyleProps, React.AnchorHTMLAttributes<HTMLAnchorElement> {}

export const TextLink = React.forwardRef<HTMLAnchorElement, TextLinkProps>(
  ({ tone, weight, className, ...rest }, ref) => (
    <a
      ref={ref}
      className={cx(textLinkClasses({ tone, weight }), className)}
      {...rest}
    />
  ),
);
TextLink.displayName = "TextLink";

export const RouterTextLink = createLink(TextLink);

export interface TextButtonProps
  extends TextLinkStyleProps, React.ButtonHTMLAttributes<HTMLButtonElement> {}

// A <button> that reads as a link (Logout, Check again, Revoke).
export const TextButton = React.forwardRef<HTMLButtonElement, TextButtonProps>(
  ({ tone, weight, className, ...rest }, ref) => (
    <button
      ref={ref}
      className={cx(textLinkClasses({ tone, weight }), className)}
      {...rest}
    />
  ),
);
TextButton.displayName = "TextButton";
