import React, { useEffect } from "react";
import { cx } from "./cx";

const backdrop =
  "fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm";

const panelVariant = {
  // ConfirmationDialog.
  md: "bg-surface rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-line",
  // ApiKeyGeneratedDialog.
  lg: "bg-surface rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 border border-line",
  // The session-expired modal: dimmed backdrop, no close.
  session:
    "bg-surface rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center",
} as const;

export type DialogVariant = keyof typeof panelVariant;

export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  variant: DialogVariant;
  // Escape and a click on the backdrop call it. Leave it out for a dialog
  // that can't be dismissed (session).
  onClose?: () => void;
  // Focused 100 ms after the dialog opens.
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  // Merged onto the panel. role, aria-* and data-* go on the backdrop,
  // where they were.
  panelClassName?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  variant,
  onClose,
  initialFocusRef,
  panelClassName,
  className,
  children,
  ...rest
}) => {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleEscape);
    const timer = setTimeout(() => initialFocusRef?.current?.focus(), 100);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      clearTimeout(timer);
    };
  }, [open, onClose, initialFocusRef]);

  if (!open) return null;

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) onClose?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cx(backdrop, variant === "session" && "bg-overlay", className)}
      onClick={onClose ? handleBackdropClick : undefined}
      {...rest}
    >
      <div className={cx(panelVariant[variant], panelClassName)}>
        {children}
      </div>
    </div>
  );
};
