import React from "react";
import { cx } from "./cx";

const track =
  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors";
const knob =
  "inline-block h-4 w-4 transform rounded-full bg-on-accent transition-transform";

export interface SwitchProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  checked: boolean;
}

// The settings toggles. Today they're display-only, so no role or
// aria-checked is added here; the caller passes what it needs.
export const Switch: React.FC<SwitchProps> = ({
  checked,
  className,
  ...rest
}) => (
  <button
    className={cx(track, checked ? "bg-accent" : "bg-muted-hover", className)}
    {...rest}
  >
    <span className={cx(knob, checked ? "translate-x-6" : "translate-x-1")} />
  </button>
);
