import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "../../constants";
import { ApiKeysManager } from "@components/dashboard/ApiKeysManager.tsx";
import { ProfileSettings } from "@components/dashboard/ProfileSettings.tsx";
import { useLiveQuery } from "@tanstack/react-db";
import { collections, dbHelpers } from "@/db.ts";
import { apiKeysApi } from "@/api.ts";
import { maskApiKey } from "@/utils/apiKey";
import type { ApiKey } from "@/types.ts";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/AuthContext";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [{ title: `Settings | ${APP_NAME}` }],
  }),
  component: SettingsComponent,
});

function SettingsComponent() {
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false);
  const [apiKeysError, setApiKeysError] = useState<string | null>(null);
  const { tokens, user } = useAuth();

  // Use TanStack DB's reactive queries
  const { data: apiKeysData } = useLiveQuery((q) =>
    q.from({ keys: collections.apiKeys }),
  );

  const apiKeys = apiKeysData as unknown as ApiKey[];

  // Sync API keys on component mount
  useEffect(() => {
    const syncApiKeys = async () => {
      setIsLoadingApiKeys(true);
      setApiKeysError(null);
      try {
        await dbHelpers.syncApiKeys(tokens?.accessToken);
      } catch (error) {
        console.error("Failed to sync API keys:", error);
        setApiKeysError("Failed to load API keys from server");
      } finally {
        setIsLoadingApiKeys(false);
      }
    };

    syncApiKeys();
  }, [tokens]);

  const handleGenerateKey = async (
    keyName: string,
    onKeyGenerated?: (fullKey: string) => void,
  ) => {
    try {
      setApiKeysError(null);
      // Call the API to create the key
      const newKey = await apiKeysApi.createApiKey(
        { name: keyName },
        tokens?.accessToken,
      );

      // Call the callback with the full key before inserting (so user can copy it)
      if (onKeyGenerated) {
        onKeyGenerated(newKey.apiKey);
      }

      // Create the key object with masked identifier for storage
      const keyForStorage: ApiKey = {
        id: newKey.id,
        name: newKey.name,
        identifier: maskApiKey(newKey.apiKey), // Masked version for display
        createdAt: newKey.createdAt,
        expiresAt: null,
        lastUsedAt: undefined,
        enabled: true,
      };

      // Insert into collection
      await collections.apiKeys.insert(keyForStorage);

      // Re-sync to ensure consistency
      await dbHelpers.syncApiKeys(tokens?.accessToken);
    } catch (error) {
      console.error("Error generating API key:", error);
      setApiKeysError("Failed to create API key");
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      setApiKeysError(null);
      // Call the API to revoke the key
      await apiKeysApi.revokeApiKey(keyId, tokens?.accessToken);

      // Re-sync to get the latest state from the server
      await dbHelpers.syncApiKeys(tokens?.accessToken);
    } catch (error) {
      console.error("Error revoking API key:", error);
      setApiKeysError("Failed to revoke API key");
    }
  };

  return (
    <div className="space-y-6" data-testid="settings-page">
      <h1 className="text-3xl font-bold text-fg">Settings</h1>

      {/* Profile Settings */}
      {/* Only the profile needs the user; the API keys don't wait on it. */}
      {user && <ProfileSettings user={user} />}

      {/* API Keys Management */}
      <div>
        {apiKeysError && (
          <div className="mb-4 p-4 bg-danger-soft border border-danger-line rounded-lg">
            <p className="text-sm text-danger-fg">{apiKeysError}</p>
          </div>
        )}
        {isLoadingApiKeys ? (
          <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-lg text-fg-caption">Loading API keys...</div>
            </div>
          </div>
        ) : (
          <ApiKeysManager
            apiKeys={apiKeys || []}
            onGenerateKey={handleGenerateKey}
            onRevokeKey={handleRevokeKey}
          />
        )}
      </div>

      {/* Additional Settings Sections */}
      <div
        className="bg-surface p-6 rounded-lg shadow-lg shadow-elevation/50 border border-line"
        data-testid="notification-preferences-section"
      >
        <h3 className="text-lg font-semibold text-fg mb-4">
          Notification Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-fg-strong">
                Email Notifications
              </h4>
              <p className="text-sm text-fg-muted">
                Receive email updates about your account activity
              </p>
            </div>
            <button
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-accent transition-colors"
              data-testid="email-notifications-toggle"
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-on-accent transition-transform translate-x-6" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-fg-strong">
                API Usage Alerts
              </h4>
              <p className="text-sm text-fg-muted">
                Get notified when you approach your usage limits
              </p>
            </div>
            <button
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted-hover transition-colors"
              data-testid="api-usage-alerts-toggle"
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-on-accent transition-transform translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      <div
        className="bg-surface p-6 rounded-lg shadow-lg shadow-elevation/50 border border-line"
        data-testid="danger-zone-section"
      >
        <h3 className="text-lg font-semibold text-fg mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-danger-soft rounded-lg border border-danger-line">
            <div>
              <h4 className="text-sm font-medium text-danger-fg">
                Delete Account
              </h4>
              <p className="text-sm text-danger-fg">
                Permanently delete your account and all associated data
              </p>
            </div>
            <button
              className="px-4 py-2 text-sm font-medium text-danger-fg bg-danger-muted rounded-md hover:bg-danger-muted-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger"
              data-testid="delete-account-button"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
