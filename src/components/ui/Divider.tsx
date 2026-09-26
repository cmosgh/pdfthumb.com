import React from "react";
import { cx } from "./cx";

// A rule above what follows (the footer's bottom row: pt-8 and the rest
// come from className).
export const Divider: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => <div className={cx("border-t border-line", className)} {...rest} />;

// A list with rules between its items (/status).
export const DividedList: React.FC<React.HTMLAttributes<HTMLUListElement>> = ({
  className,
  ...rest
}) => <ul className={cx("divide-y divide-line", className)} {...rest} />;
