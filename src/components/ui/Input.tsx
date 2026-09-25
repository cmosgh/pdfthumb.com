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
