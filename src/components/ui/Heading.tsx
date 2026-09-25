import React from "react";
import { cx } from "./cx";
import { typographyClasses, type TypographyProps } from "./typography";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export interface HeadingProps
  extends TypographyProps, React.HTMLAttributes<HTMLHeadingElement> {
  as: HeadingTag;
}

// A heading element with its typography. Only the props given produce
// classes; margins and alignment come from the caller's className.
export const Heading: React.FC<HeadingProps> = ({
  as: Tag,
  size,
  weight,
  tone,
  leading,
  tracking,
  mono,
  uppercase,
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
      className,
    )}
    {...rest}
  />
);
