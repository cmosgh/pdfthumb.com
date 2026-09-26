import React from "react";
import { cx } from "./cx";

const input =
  "px-3 py-2 border border-line-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-focus bg-neutral text-fg";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

// A text field (ApiKeysManager key name). Width comes from className.
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...rest }, ref) => (
    <input ref={ref} className={cx(input, className)} {...rest} />
  ),
);
Input.displayName = "Input";

const range = "accent-accent cursor-pointer";

// A native range input (the /pricing volume slider, #141): the browser draws
// it, in the accent colour. Width comes from className.
export const RangeInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, "type">
>(({ className, ...rest }, ref) => (
  <input ref={ref} type="range" className={cx(range, className)} {...rest} />
));
RangeInput.displayName = "RangeInput";
