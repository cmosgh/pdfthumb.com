import React, { useState } from "react";
import type { ApiKey } from "@/types.ts";
import { ConfirmationDialog } from "@/components/ConfirmationDialog.tsx";
import { ApiKeyGeneratedDialog } from "@/components/dashboard/ApiKeyGeneratedDialog.tsx";
import { maskApiKey } from "@/utils/apiKey";

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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
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

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
    <div
      className="bg-surface rounded-lg shadow-sm border border-line p-6"
      data-testid="api-keys-section"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-fg-strong">API Keys</h3>
        <button
          onClick={() => setShowGenerateForm(true)}
          className="px-4 py-2 text-sm font-medium text-on-accent bg-accent rounded-md hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-focus"
          data-testid="generate-api-key-button"
        >
          Generate New Key
        </button>
      </div>

      {showGenerateForm && (
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-medium text-fg-strong mb-3">
            Generate New API Key
          </h4>
          <div className="flex gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Enter key name (e.g., Production API Key)"
              className="flex-1 px-3 py-2 border border-line-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-focus bg-neutral text-fg"
              data-testid="api-key-name-input"
            />
            <button
              onClick={handleGenerateKey}
              disabled={!newKeyName.trim()}
              className="px-4 py-2 text-sm font-medium text-on-accent bg-success rounded-md hover:bg-success-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="generate-api-key-submit"
            >
              Generate
            </button>
            <button
              onClick={() => {
                setShowGenerateForm(false);
                setNewKeyName("");
              }}
              className="px-4 py-2 text-sm font-medium text-fg-2 bg-neutral rounded-md hover:bg-neutral-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-focus"
              data-testid="generate-api-key-cancel"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table
          className="min-w-full divide-y divide-line"
          data-testid="api-keys-table"
        >
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-fg-label uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-fg-label uppercase tracking-wider">
                Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-fg-label uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-fg-label uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-fg-label uppercase tracking-wider">
                Last Used
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-fg-label uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-line">
            {apiKeys.map((key) => (
              <tr key={key.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-fg-strong">
                  {key.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-fg-label">
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {isDevelopment
                        ? key.identifier
                        : maskApiKey(key.identifier)}
                    </code>
                    {isDevelopment && (
                      <button
                        onClick={() => copyToClipboard(key.identifier)}
                        className="text-link hover:text-link-hover"
                        title="Copy to clipboard"
                        data-testid="copy-api-key-button"
                      >
                        {copiedKey === key.identifier ? (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      key.enabled
                        ? "bg-success-muted text-success-muted-fg"
                        : "bg-danger-muted text-danger-muted-fg"
                    }`}
                  >
                    {key.enabled ? "Active" : "Revoked"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-fg-label">
                  {formatDate(key.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-fg-label">
                  {key.lastUsedAt ? formatDate(key.lastUsedAt) : "Never"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {key.enabled ? (
                    <button
                      onClick={() => handleRevokeKey(key.id)}
                      className="text-danger-fg hover:text-danger-muted-fg"
                      data-testid="revoke-api-key-button"
                    >
                      Revoke
                    </button>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-muted text-danger-muted-fg">
                      Revoked
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {apiKeys.length === 0 && (
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-fg-faint"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-fg-strong">
            No API keys
          </h3>
          <p className="mt-1 text-sm text-fg-subtle">
            Get started by creating a new API key.
          </p>
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
    </div>
  );
};
