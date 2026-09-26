import React from "react";
import { cx } from "./cx";

// A framed image: the hero's proof thumbnails (#140). Width and height
// come from the caller.
export const FramedImage: React.FC<
  React.ImgHTMLAttributes<HTMLImageElement>
> = ({ className, alt, ...rest }) => (
  <img
    alt={alt}
    className={cx("rounded border border-line shadow-sm", className)}
    {...rest}
  />
);
