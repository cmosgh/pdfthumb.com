import React, { useState } from "react";
import type { ApiKey } from "@/types.ts";
import { ConfirmationDialog } from "@/components/ConfirmationDialog.tsx";
import { ApiKeyGeneratedDialog } from "@/components/dashboard/ApiKeyGeneratedDialog.tsx";
import { maskApiKey } from "@/utils/apiKey";
import {
  Badge,
  Button,
  Card,
  Code,
  CopyButton,
  Heading,
  Icon,
  Input,
  KeyIcon,
  Table,
  TableFrame,
  TBody,
  Td,
  Text,
  TextButton,
  Th,
  THead,
} from "@/components/ui";

interface ApiKeysManagerProps {
  apiKeys: ApiKey[];
  onGenerateKey: (
    keyName: string,
    onKeyGenerated?: (fullKey: string) => void,
  ) => void;
  onRevokeKey: (keyId: string) => void;
}

export const ApiKeysManager: React.FC<ApiKeysManagerProps> = ({
  apiKeys,
  onGenerateKey,
  onRevokeKey,
}) => {
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [pendingRevokeKeyId, setPendingRevokeKeyId] = useState<string | null>(
    null,
  );
  const [isRevoking, setIsRevoking] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generatedKeyName, setGeneratedKeyName] = useState<string>("");
  const [showGeneratedKeyDialog, setShowGeneratedKeyDialog] = useState(false);

  const isDevelopment = import.meta.env.MODE === "development";

  const handleGenerateKey = () => {
    if (newKeyName.trim()) {
      onGenerateKey(newKeyName.trim(), (fullKey: string) => {
        setGeneratedKey(fullKey);
        setGeneratedKeyName(newKeyName.trim());
        setShowGeneratedKeyDialog(true);
        setNewKeyName("");
        setShowGenerateForm(false);
      });
    }
  };

  const handleRevokeKey = (keyId: string) => {
    setPendingRevokeKeyId(keyId);
    setShowRevokeDialog(true);
  };

  const handleConfirmRevoke = async () => {
    if (!pendingRevokeKeyId) return;

    setIsRevoking(true);
    try {
      await onRevokeKey(pendingRevokeKeyId);
    } finally {
      setIsRevoking(false);
      setShowRevokeDialog(false);
      setPendingRevokeKeyId(null);
    }
  };

  const handleCancelRevoke = () => {
    setShowRevokeDialog(false);
    setPendingRevokeKeyId(null);
  };

  const handleCloseGeneratedKeyDialog = () => {
    setShowGeneratedKeyDialog(false);
    setGeneratedKey(null);
    setGeneratedKeyName("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card variant="panel" className="p-6" data-testid="api-keys-section">
      <div className="flex items-center justify-between mb-6">
        <Heading as="h3" size="lg" weight="semibold" tone="fg-strong">
          API Keys
        </Heading>
        <Button
          variant="accent"
          onClick={() => setShowGenerateForm(true)}
          data-testid="generate-api-key-button"
        >
          Generate New Key
        </Button>
      </div>

      {showGenerateForm && (
        <Card variant="well" className="mb-6 p-4">
          <Heading
            as="h4"
            size="sm"
            weight="medium"
            tone="fg-strong"
            className="mb-3"
          >
            Generate New API Key
          </Heading>
          <div className="flex gap-3">
            <Input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Enter key name (e.g., Production API Key)"
              className="flex-1"
              data-testid="api-key-name-input"
            />
            <Button
              variant="success"
              onClick={handleGenerateKey}
              disabled={!newKeyName.trim()}
              data-testid="generate-api-key-submit"
            >
              Generate
            </Button>
            <Button
              variant="neutral"
              onClick={() => {
                setShowGenerateForm(false);
                setNewKeyName("");
              }}
              data-testid="generate-api-key-cancel"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <TableFrame variant="plain">
        <Table density="comfortable" data-testid="api-keys-table">
          <THead>
            <tr>
              <Th className="text-left">Name</Th>
              <Th className="text-left">Key</Th>
              <Th className="text-left">Status</Th>
              <Th className="text-left">Created</Th>
              <Th className="text-left">Last Used</Th>
              <Th className="text-left">Actions</Th>
            </tr>
          </THead>
          <TBody surface>
            {apiKeys.map((key) => (
              <tr key={key.id}>
                <Td
                  weight="medium"
                  tone="fg-strong"
                  className="whitespace-nowrap"
                >
                  {key.name}
                </Td>
                <Td tone="fg-label" className="whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Code variant="chip">
                      {isDevelopment
                        ? key.identifier
                        : maskApiKey(key.identifier)}
                    </Code>
                    {isDevelopment && (
                      <CopyButton
                        variant="icon"
                        text={key.identifier}
                        title="Copy to clipboard"
                        data-testid="copy-api-key-button"
                      />
                    )}
                  </div>
                </Td>
                <Td text={false} className="whitespace-nowrap">
                  <Badge variant={key.enabled ? "success" : "danger"}>
                    {key.enabled ? "Active" : "Revoked"}
                  </Badge>
                </Td>
                <Td tone="fg-label" className="whitespace-nowrap">
                  {formatDate(key.createdAt)}
                </Td>
                <Td tone="fg-label" className="whitespace-nowrap">
                  {key.lastUsedAt ? formatDate(key.lastUsedAt) : "Never"}
                </Td>
                <Td weight="medium" className="whitespace-nowrap">
                  {key.enabled ? (
                    <TextButton
                      tone="danger"
                      onClick={() => handleRevokeKey(key.id)}
                      data-testid="revoke-api-key-button"
                    >
                      Revoke
                    </TextButton>
                  ) : (
                    <Badge variant="danger">Revoked</Badge>
                  )}
                </Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </TableFrame>

      {apiKeys.length === 0 && (
        <div className="text-center py-8">
          <Icon as={KeyIcon} tone="fg-faint" className="mx-auto h-12 w-12" />
          <Heading
            as="h3"
            size="sm"
            weight="medium"
            tone="fg-strong"
            className="mt-2"
          >
            No API keys
          </Heading>
          <Text size="sm" tone="fg-subtle" className="mt-1">
            Get started by creating a new API key.
          </Text>
        </div>
      )}
      <ConfirmationDialog
        isOpen={showRevokeDialog}
        title="Revoke API Key"
        message="Are you sure you want to revoke this API key? This action cannot be undone and the key will immediately become unusable."
        confirmText="Revoke Key"
        cancelText="Cancel"
        onConfirm={handleConfirmRevoke}
        onCancel={handleCancelRevoke}
        isLoading={isRevoking}
      />

      <ApiKeyGeneratedDialog
        isOpen={showGeneratedKeyDialog}
        apiKey={generatedKey || ""}
        keyName={generatedKeyName}
        onClose={handleCloseGeneratedKeyDialog}
      />
    </Card>
  );
};
