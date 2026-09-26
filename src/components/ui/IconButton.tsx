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
  // The copy button on a docs code block, over the code background (#142).
  // The background is opaque, so code scrolling under it stays hidden;
  // only the icon dims.
  code: "p-1.5 rounded-md bg-code text-code-fg [&>svg]:opacity-70 hover:[&>svg]:opacity-100 focus-visible:[&>svg]:opacity-100 focus-visible:outline-2 focus-visible:outline-focus",
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
