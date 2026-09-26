import React from "react";
import { cx } from "./cx";
import {
  listStyle,
  typographyClasses,
  type ListStyle,
  type TypographyProps,
} from "./typography";

type TextTag =
  "p" | "span" | "div" | "label" | "dt" | "dd" | "li" | "ul" | "ol";

export interface TextProps
  extends TypographyProps, React.HTMLAttributes<HTMLElement> {
  as?: TextTag;
  // Marker style, for as="ul" | "ol" (the docs' bullet lists).
  list?: ListStyle;
  htmlFor?: string;
}

// Body text on a block (or inline) element. Keep the typography on the
// block itself: moving a size onto an inner span leaves the block's strut,
// and the line box, at the inherited size.
export const Text: React.FC<TextProps> = ({
  as: Tag = "p",
  size,
  weight,
  tone,
  leading,
  tracking,
  mono,
  uppercase,
  list,
  className,
  ...rest
}) => (
  <Tag
    className={cx(
      typographyClasses({
        size,
        weight,
        tone,
        leading,
        tracking,
        mono,
        uppercase,
      }),
      list && listStyle[list],
      className,
    )}
    {...rest}
  />
);
