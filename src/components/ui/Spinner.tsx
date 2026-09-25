import React from "react";
import { cx } from "./cx";

// The page-loading ring (dashboard loading, auth callback). Centred with
// mx-auto, as it always is; other margins come from className.
export const Spinner: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => (
  <div
    className={cx(
      "animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto",
      className,
    )}
    {...rest}
  />
);
