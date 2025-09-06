import React, { useState } from "react";
import type { ApiKey } from "../../types";

interface ApiKeysManagerProps {
  apiKeys: ApiKey[];
  onGenerateKey: (keyName: string) => void;
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

  const handleGenerateKey = () => {
    if (newKeyName.trim()) {
      onGenerateKey(newKeyName.trim());
      setNewKeyName("");
      setShowGenerateForm(false);
    }
  };

  const handleRevokeKey = (keyId: string) => {
    if (
      window.confirm(
        "Are you sure you want to revoke this API key? This action cannot be undone.",
      )
    ) {
      onRevokeKey(keyId);
    }
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 12) return key;
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
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
      className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6"
      data-testid="api-keys-section"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
          API Keys
        </h3>
        <button
          onClick={() => setShowGenerateForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          data-testid="generate-api-key-button"
        >
          Generate New Key
        </button>
      </div>

      {showGenerateForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-3">
            Generate New API Key
          </h4>
          <div className="flex gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Enter key name (e.g., Production API Key)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-100"
              data-testid="api-key-name-input"
            />
            <button
              onClick={handleGenerateKey}
              disabled={!newKeyName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="generate-api-key-submit"
            >
              Generate
            </button>
            <button
              onClick={() => {
                setShowGenerateForm(false);
                setNewKeyName("");
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500"
              data-testid="generate-api-key-cancel"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table
          className="min-w-full divide-y divide-gray-200 dark:divide-slate-700"
          data-testid="api-keys-table"
        >
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                Last Used
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            {apiKeys.map((key) => (
              <tr key={key.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100">
                  {key.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                      {maskApiKey(key.key)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(key.key)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      title="Copy to clipboard"
                      data-testid="copy-api-key-button"
                    >
                      {copiedKey === key.key ? (
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
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      key.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {key.isActive ? "Active" : "Revoked"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                  {formatDate(key.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                  {key.lastUsed ? formatDate(key.lastUsed) : "Never"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {key.isActive ? (
                    <button
                      onClick={() => handleRevokeKey(key.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Revoke
                    </button>
                  ) : (
                    <span className="text-gray-400 dark:text-slate-500">
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
            className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500"
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
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-100">
            No API keys
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Get started by creating a new API key.
          </p>
        </div>
      )}
    </div>
  );
};
