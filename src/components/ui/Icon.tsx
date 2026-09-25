import React from "react";
import { cx } from "./cx";

const iconTone = {
  link: "text-link",
  "fg-subtle": "text-fg-subtle",
  "fg-faint": "text-fg-faint",
  warning: "text-warning",
  "on-accent": "text-on-accent",
  // No colour class: the icon takes currentColor from its parent.
  inherit: "",
} as const;

export type IconTone = keyof typeof iconTone;

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  as: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tone?: IconTone;
}

// Colours an icon component; its size and spacing come from className.
export const Icon: React.FC<IconProps> = ({
  as: Component,
  tone = "inherit",
  className,
  ...rest
}) => <Component className={cx(iconTone[tone], className)} {...rest} />;
