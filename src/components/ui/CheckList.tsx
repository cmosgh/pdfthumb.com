import React from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";
import { CheckCircleIcon } from "./icons";

// A list of ticked lines (PricingCard, "Every plan includes"). The ul's
// spacing and grid come from className.
export const CheckList: React.FC<React.HTMLAttributes<HTMLUListElement>> = (
  props,
) => <ul {...props} />;

export interface CheckListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  // The tick's colour: "link", or "inherit" (non-featured pricing tiers).
  tone?: "link" | "inherit";
  // Merged onto the text span (PricingCard: min-w-0 break-words).
  textClassName?: string;
}

export const CheckListItem: React.FC<CheckListItemProps> = ({
  tone = "link",
  textClassName,
  className,
  children,
  ...rest
}) => (
  <li className={cx("flex items-start", className)} {...rest}>
    <Icon
      as={CheckCircleIcon}
      tone={tone}
      className="h-6 w-6 mr-2 flex-shrink-0"
    />
    <span className={cx("text-fg-muted", textClassName)}>{children}</span>
  </li>
);
