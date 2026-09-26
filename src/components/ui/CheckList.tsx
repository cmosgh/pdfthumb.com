import React from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";
import { CheckCircleIcon, CircleIcon } from "./icons";

// A list of ticked lines (PricingCard, "Every plan includes"). The ul's
// spacing and grid come from className.
// `as="ol"` for ordered steps (the first-thumbnail checklist).
export const CheckList: React.FC<
  React.HTMLAttributes<HTMLUListElement> & { as?: "ul" | "ol" }
> = ({ as: Tag = "ul", ...props }) => <Tag {...props} />;

export interface CheckListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  // The tick's colour: "link", or "inherit" (non-featured pricing tiers).
  tone?: "link" | "inherit";
  // Merged onto the text span (PricingCard: min-w-0 break-words).
  textClassName?: string;
  // Not ticked yet: an empty circle in fg-faint instead of the tick (the
  // first-thumbnail checklist, #143).
  pending?: boolean;
}

export const CheckListItem: React.FC<CheckListItemProps> = ({
  tone = "link",
  textClassName,
  pending = false,
  className,
  children,
  ...rest
}) => (
  <li className={cx("flex items-start", className)} {...rest}>
    <Icon
      as={pending ? CircleIcon : CheckCircleIcon}
      tone={pending ? "fg-faint" : tone}
      aria-hidden="true"
      className="h-6 w-6 mr-2 flex-shrink-0"
    />
    <span className={cx("text-fg-muted", textClassName)}>{children}</span>
  </li>
);
