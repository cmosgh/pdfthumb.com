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
  // A tick at this percent, 0 to 100 (the projected quota, #143). It's
  // drawn only: the caller gives its text equivalent, e.g. through
  // aria-describedby.
  marker?: number;
  markerTestId?: string;
}

// A bar with role="progressbar"; the caller gives aria-label and
// aria-value*. Margins come from className.
export const Progress: React.FC<ProgressProps> = ({
  percent,
  tone = "chart-1",
  marker,
  markerTestId,
  className,
  ...rest
}) => (
  <div
    role="progressbar"
    className={cx(
      "relative h-3 w-full overflow-hidden rounded-full bg-muted",
      className,
    )}
    {...rest}
  >
    <div
      className={cx("h-full rounded-full", fillTone[tone])}
      style={{ width: `${percent}%` }}
    />
    {marker !== undefined && (
      // Ends at the percent, so a marker at 100% stays inside the track
      <span
        aria-hidden="true"
        data-testid={markerTestId}
        className="absolute inset-y-0 -ml-1 w-1 bg-fg-strong"
        style={{ left: `${marker}%` }}
      />
    )}
  </div>
);
