import React, { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { CheckIcon, ClipboardIcon } from "./icons";
import { cx } from "./cx";

export type CopyButtonVariant = "button" | "icon";

export interface CopyButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  // What goes on the clipboard.
  text: string;
  // "button": the accent action button with an icon and a label
  // (ApiKeyGeneratedDialog). "icon": a bare link-coloured icon
  // (ApiKeysManager, development builds).
  variant?: CopyButtonVariant;
  // variant="button": the visible label before and after a copy.
  label?: React.ReactNode;
  copiedLabel?: React.ReactNode;
  // The aria-label before and after a copy; none when left out.
  ariaLabel?: string;
  copiedAriaLabel?: string;
}

// How long the button shows "copied".
const COPIED_MS = 2000;

export const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      text,
      variant = "button",
      label = "Copy to Clipboard",
      copiedLabel = "Copied!",
      ariaLabel,
      copiedAriaLabel,
      onClick,
      className,
      ...rest
    },
    ref,
  ) => {
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);

    const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), COPIED_MS);
      } catch (error) {
        console.error("Failed to copy to the clipboard:", error);
      }
    };

    const aria = copied ? (copiedAriaLabel ?? ariaLabel) : ariaLabel;

    if (variant === "icon") {
      return (
        <IconButton
          ref={ref}
          variant="link"
          onClick={handleClick}
          aria-label={aria}
          className={className}
          {...rest}
        >
          {copied ? (
            <CheckIcon className="w-4 h-4" />
          ) : (
            <ClipboardIcon className="w-4 h-4" />
          )}
        </IconButton>
      );
    }

    return (
      <Button
        ref={ref}
        variant="accent"
        onClick={handleClick}
        aria-label={aria}
        className={cx("inline-flex items-center", className)}
        {...rest}
      >
        {copied ? (
          <>
            <CheckIcon className="w-4 h-4 mr-2" aria-hidden="true" />
            <span aria-live="polite">{copiedLabel}</span>
          </>
        ) : (
          <>
            <ClipboardIcon className="w-4 h-4 mr-2" aria-hidden="true" />
            {label}
          </>
        )}
      </Button>
    );
  },
);
CopyButton.displayName = "CopyButton";
