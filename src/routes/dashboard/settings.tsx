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
import { Button, Callout, Card, Heading, Text } from "@/components/ui";

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
      <Heading as="h1" size="3xl" weight="bold" tone="fg">
        Settings
      </Heading>

      {/* Profile Settings */}
      {/* Only the profile needs the user; the API keys don't wait on it. */}
      {user && <ProfileSettings user={user} />}

      {/* API Keys Management */}
      <div>
        {apiKeysError && (
          <Callout variant="danger" className="mb-4 p-4">
            <Text size="sm" tone="danger-fg">
              {apiKeysError}
            </Text>
          </Callout>
        )}
        {isLoadingApiKeys ? (
          <Card variant="panel" className="p-6">
            <div className="flex items-center justify-center h-32">
              <Text as="div" size="lg" tone="fg-caption">
                Loading API keys...
              </Text>
            </div>
          </Card>
        ) : (
          <ApiKeysManager
            apiKeys={apiKeys || []}
            onGenerateKey={handleGenerateKey}
            onRevokeKey={handleRevokeKey}
          />
        )}
      </div>
    </div>
  );
}
