import React, { useRef } from "react";
import { maskApiKey } from "@/utils/apiKey";
import {
  Button,
  Callout,
  Card,
  Code,
  CopyButton,
  Dialog,
  ExclamationTriangleIcon,
  Heading,
  Icon,
  Text,
} from "@/components/ui";

interface ApiKeyGeneratedDialogProps {
  isOpen: boolean;
  apiKey: string;
  keyName: string;
  onClose: () => void;
}

export const ApiKeyGeneratedDialog: React.FC<ApiKeyGeneratedDialogProps> = ({
  isOpen,
  apiKey,
  keyName,
  onClose,
}) => {
  // Focused when the dialog opens.
  const copyButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      open={isOpen}
      variant="lg"
      onClose={onClose}
      initialFocusRef={copyButtonRef}
      aria-labelledby="api-key-dialog-title"
      aria-describedby="api-key-dialog-description"
      data-testid="api-key-generated-dialog"
    >
      <div className="mb-6">
        <Heading
          as="h3"
          id="api-key-dialog-title"
          size="lg"
          weight="semibold"
          tone="fg-strong"
          className="mb-4"
        >
          API Key Generated Successfully
        </Heading>

        <div id="api-key-dialog-description" className="space-y-4">
          <Callout variant="warning" className="p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Icon
                  as={ExclamationTriangleIcon}
                  tone="warning"
                  className="h-5 w-5"
                />
              </div>
              <div className="ml-3">
                <Heading as="h4" size="sm" weight="medium" tone="warning-fg">
                  Important Security Notice
                </Heading>
                <Text size="sm" tone="warning-fg" className="mt-1">
                  This is the only time you'll see this API key. Copy it now and
                  store it securely. Once you close this dialog, you won't be
                  able to view or copy the full key again.
                </Text>
              </div>
            </div>
          </Callout>

          <div>
            <Text
              as="label"
              size="sm"
              weight="medium"
              tone="fg-2"
              className="block mb-2"
            >
              API Key for "{keyName}"
            </Text>
            <Card
              variant="wellOutlined"
              className="flex items-center space-x-3 p-4"
            >
              <Code variant="key" className="flex-1 break-all">
                {maskApiKey(apiKey)}
              </Code>
            </Card>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <CopyButton
          ref={copyButtonRef}
          text={apiKey}
          ariaLabel="Copy API key to clipboard"
          copiedAriaLabel="API key copied to clipboard"
        />
        <Button
          variant="neutral"
          onClick={onClose}
          aria-label="Close dialog and return to settings"
        >
          Close
        </Button>
      </div>
    </Dialog>
  );
};
