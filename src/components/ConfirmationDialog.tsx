import React, { useRef } from "react";
import {
  Button,
  Dialog,
  Heading,
  Icon,
  SpinnerIcon,
  Text,
} from "@/components/ui";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  // Focused when the dialog opens.
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      open={isOpen}
      variant="md"
      onClose={onCancel}
      initialFocusRef={confirmButtonRef}
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-message"
    >
      <div className="mb-4">
        <Heading
          as="h3"
          id="confirmation-title"
          size="lg"
          weight="semibold"
          tone="fg-strong"
          className="mb-2"
        >
          {title}
        </Heading>
        <Text id="confirmation-message" size="sm" tone="fg-muted">
          {message}
        </Text>
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="neutral" onClick={onCancel} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          ref={confirmButtonRef}
          variant="danger"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center">
              <Icon
                as={SpinnerIcon}
                tone="on-accent"
                className="animate-spin -ml-1 mr-2 h-4 w-4"
              />
              Processing...
            </div>
          ) : (
            confirmText
          )}
        </Button>
      </div>
    </Dialog>
  );
};
