import React from "react";
import { createLink } from "@tanstack/react-router";
import { cx } from "./cx";

const navItem =
  "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors";
const navItemActive = "bg-selected text-accent-soft-fg";
const navItemIdle = "text-fg-muted hover:bg-muted hover:text-fg-strong";

export interface NavItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
}

// A dashboard sidebar link.
export const NavItem = React.forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ active = false, className, ...rest }, ref) => (
    <a
      ref={ref}
      className={cx(navItem, active ? navItemActive : navItemIdle, className)}
      {...rest}
    />
  ),
);
NavItem.displayName = "NavItem";

export const RouterNavItem = createLink(NavItem);

// A placeholder as tall as a NavItem, while the role loads.
export const NavSkeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => (
  <div
    className={cx("h-9 bg-muted rounded-lg animate-pulse", className)}
    {...rest}
  />
);
