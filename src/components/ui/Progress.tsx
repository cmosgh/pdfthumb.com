import React from "react";
import { cx } from "./cx";

const fillTone = {
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
} as const;

export type ProgressTone = keyof typeof fillTone;

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  // Fill width, 0 to 100.
  percent: number;
  tone?: ProgressTone;
}

// A bar with role="progressbar"; the caller gives aria-label and
// aria-value*. Margins come from className.
export const Progress: React.FC<ProgressProps> = ({
  percent,
  tone = "chart-1",
  className,
  ...rest
}) => (
  <div
    role="progressbar"
    className={cx(
      "h-3 w-full overflow-hidden rounded-full bg-muted",
      className,
    )}
    {...rest}
  >
    <div
      className={cx("h-full rounded-full", fillTone[tone])}
      style={{ width: `${percent}%` }}
    />
  </div>
);
