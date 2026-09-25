import React from "react";
import { cx } from "./cx";

// The padding is part of each variant: it sets the hover background's size.
const iconButtonVariant = {
  // Navbar theme toggle.
  round:
    "p-2 rounded-full text-fg-subtle hover:bg-muted focus-visible:outline-none",
  // Navbar mobile menu toggle.
  bare: "text-fg-subtle focus:outline-none focus:text-fg-muted",
  // Dashboard sidebar toggle.
  square: "p-2 rounded-md text-fg-muted hover:text-link hover:bg-muted",
  // ApiKeysManager's copy button (development builds).
  link: "text-link hover:text-link-hover",
} as const;

export type IconButtonVariant = keyof typeof iconButtonVariant;

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: IconButtonVariant;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant, className, ...rest }, ref) => (
    <button
      ref={ref}
      className={cx(iconButtonVariant[variant], className)}
      {...rest}
    />
  ),
);
IconButton.displayName = "IconButton";
