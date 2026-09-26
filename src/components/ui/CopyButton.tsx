import React, { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { CheckIcon, ClipboardIcon } from "./icons";
import { cx } from "./cx";

export type CopyButtonVariant = "button" | "neutral" | "icon" | "code";

export interface CopyButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  // What goes on the clipboard, or a function that builds it on click.
  text: string | (() => string);
  // "button": the accent action button with an icon and a label
  // (ApiKeyGeneratedDialog); "neutral": the same in the neutral action
  // look (docs Copy as Markdown). "icon": a bare link-coloured icon
  // (ApiKeysManager, development builds); "code": an icon over a code
  // block (CodeSample).
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
        await navigator.clipboard.writeText(
          typeof text === "function" ? text() : text,
        );
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), COPIED_MS);
      } catch (error) {
        console.error("Failed to copy to the clipboard:", error);
      }
    };

    const aria = copied ? (copiedAriaLabel ?? ariaLabel) : ariaLabel;

    if (variant === "icon" || variant === "code") {
      return (
        <IconButton
          ref={ref}
          variant={variant === "code" ? "code" : "link"}
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
        variant={variant === "neutral" ? "neutral" : "accent"}
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
