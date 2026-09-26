import React from "react";
import { createLink } from "@tanstack/react-router";
import { cx } from "./cx";

// Marketing family: the landing page's calls to action.
const marketingBase =
  "inline-flex items-center justify-center font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-page transition-all duration-150 ease-in-out";

const marketingVariant = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover focus:ring-focus",
  secondary:
    "bg-accent-soft text-accent-soft-fg hover:bg-accent-soft-hover focus:ring-focus",
  outline:
    "border border-accent text-link hover:bg-accent-tint focus:ring-focus",
  outlineWhite:
    "border border-on-accent text-on-accent hover:bg-on-accent hover:text-link focus:ring-on-accent",
  ghost: "text-link hover:bg-accent-tint focus:ring-focus",
} as const;

const marketingSize = {
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
} as const;

// A disabled marketing button loses the hover scale. PricingCard's
// disabled tiers used to add opacity-70 over the base opacity-50; in the
// built CSS .opacity-70 comes after .opacity-50, so 0.7 is what shows:
// disabledLook="soft" reproduces that.
const marketingDisabled = {
  default: "opacity-50 cursor-not-allowed",
  soft: "opacity-70 cursor-not-allowed",
} as const;
const marketingEnabled = "transform hover:scale-105";

// Dashboard action family: form and dialog buttons.
const actionBase =
  "px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

const actionVariant = {
  accent: "text-on-accent bg-accent hover:bg-accent-hover focus:ring-focus",
  neutral: "text-fg-2 bg-neutral hover:bg-neutral-hover focus:ring-focus",
  success:
    "text-on-accent bg-success hover:bg-success-hover focus:ring-success",
  danger: "text-on-accent bg-danger hover:bg-danger-hover focus:ring-danger",
} as const;

// One-offs, each exactly as it looks today (merge candidates).
const oneOffVariant = {
  // Navbar "Get API Key".
  navCta:
    "cursor-pointer bg-accent hover:bg-accent-hover text-on-accent font-semibold py-2 px-4 rounded-md shadow-md transition-transform transform hover:scale-105 text-sm",
  // Docs "Open the API reference (Swagger)": no text size, ring or scale.
  swagger:
    "inline-flex items-center font-semibold rounded-md shadow-sm px-6 py-3 bg-accent text-on-accent hover:bg-accent-hover",
  // Session-expired modal "Log in again".
  session:
    "inline-block bg-accent hover:bg-accent-hover text-on-accent font-semibold px-6 py-2.5 rounded-lg transition-colors",
  // Login "Continue with Google".
  google:
    "flex justify-center items-center py-3 px-4 border border-line-input rounded-md shadow-sm bg-surface-raised text-sm font-medium text-fg-2 hover:bg-neutral focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-focus transition-colors",
} as const;

export type MarketingVariant = keyof typeof marketingVariant;
export type ActionVariant = keyof typeof actionVariant;
export type OneOffVariant = keyof typeof oneOffVariant;
export type ButtonVariant = MarketingVariant | ActionVariant | OneOffVariant;
export type ButtonSize = keyof typeof marketingSize;
export type DisabledLook = keyof typeof marketingDisabled;

export interface ButtonStyleProps {
  variant?: ButtonVariant;
  // Marketing variants only; the others carry their own size.
  size?: ButtonSize;
  disabledLook?: DisabledLook;
}

const isMarketing = (v: ButtonVariant): v is MarketingVariant =>
  v in marketingVariant;
const isAction = (v: ButtonVariant): v is ActionVariant => v in actionVariant;

export function buttonClasses({
  variant = "primary",
  size = "md",
  disabled = false,
  disabledLook = "default",
}: ButtonStyleProps & { disabled?: boolean }): string {
  if (isMarketing(variant)) {
    return cx(
      marketingBase,
      marketingVariant[variant],
      marketingSize[size],
      disabled ? marketingDisabled[disabledLook] : marketingEnabled,
    );
  }
  if (isAction(variant)) return cx(actionBase, actionVariant[variant]);
  return oneOffVariant[variant];
}

export interface ButtonProps
  extends ButtonStyleProps, React.ButtonHTMLAttributes<HTMLButtonElement> {}

// A <button>. Action variants style their disabled state with disabled:;
// marketing variants switch classes on the disabled prop.
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, disabledLook, disabled, className, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cx(
        buttonClasses({ variant, size, disabled, disabledLook }),
        className,
      )}
      {...rest}
    />
  ),
);
Button.displayName = "Button";

export interface ButtonLinkProps
  extends ButtonStyleProps, React.AnchorHTMLAttributes<HTMLAnchorElement> {
  disabled?: boolean;
}

// An <a> that looks like a button. With href="#" and an onClick, the click
// doesn't navigate; a disabled link swallows the click and, unless its
// href is "#", drops the href.
export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (
    {
      variant,
      size,
      disabledLook,
      disabled = false,
      className,
      href,
      onClick,
      ...rest
    },
    ref,
  ) => {
    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      if (onClick) {
        if (href === "#") event.preventDefault();
        onClick(event);
      }
    };
    return (
      <a
        ref={ref}
        href={disabled && href !== "#" ? undefined : href}
        className={cx(
          buttonClasses({ variant, size, disabled, disabledLook }),
          className,
        )}
        aria-disabled={disabled}
        onClick={handleClick}
        {...rest}
      />
    );
  },
);
ButtonLink.displayName = "ButtonLink";

// ButtonLink with TanStack Router's `to`, params and preloading.
export const RouterButtonLink = createLink(ButtonLink);
