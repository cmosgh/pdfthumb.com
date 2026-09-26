import React from "react";
import { cx } from "./cx";

// The square behind a feature icon (FeaturesSection).
export const IconTile: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => (
  <div
    className={cx(
      "flex items-center justify-center h-12 w-12 rounded-md bg-accent-tint text-link",
      className,
    )}
    {...rest}
  />
);
