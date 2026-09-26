import React from "react";
import { cx } from "./cx";

// A framed image (the hero picture). Centred with mx-auto, as it is today.
export const FramedImage: React.FC<
  React.ImgHTMLAttributes<HTMLImageElement>
> = ({ className, alt, ...rest }) => (
  <img
    alt={alt}
    className={cx(
      "mx-auto rounded-lg shadow-2xl shadow-elevation/50 border-4 border-frame",
      className,
    )}
    {...rest}
  />
);
