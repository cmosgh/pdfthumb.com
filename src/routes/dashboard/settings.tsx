import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ApiKeysManager } from "@components/dashboard/ApiKeysManager.tsx";
import { ProfileSettingsForm } from "@components/dashboard/ProfileSettingsForm.tsx";
import { collections } from "@/db.ts";
import type { ApiKey, UserProfile } from "@/types.ts";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsComponent,
});

function SettingsComponent() {
  const [userProfile, setUserProfile] = useState<UserProfile>(
    () => collections.userProfile.get("user123")!,
  );
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(() =>
    Array.from(collections.apiKeys.values()),
  );

  const handleUpdateProfile = async (updatedData: Partial<UserProfile>) => {
    if (!userProfile) return;

    try {
      const updatedProfile = {
        ...userProfile,
        ...updatedData,
        updatedAt: new Date().toISOString(),
      };
      await collections.userProfile.insert(updatedProfile);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleGenerateKey = async (keyName: string) => {
    try {
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: keyName,
        key: `ptk_live_${Math.random().toString(36).substring(2, 18)}`,
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      await collections.apiKeys.insert(newKey);
      setApiKeys((prev) => [newKey, ...prev]);
    } catch (error) {
      console.error("Error generating API key:", error);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      const keyToUpdate = apiKeys.find((key) => key.id === keyId);
      if (keyToUpdate) {
        const updatedKey = { ...keyToUpdate, isActive: false };
        await collections.apiKeys.insert(updatedKey);
        setApiKeys((prev) =>
          prev.map((key) => (key.id === keyId ? updatedKey : key)),
        );
      }
    } catch (error) {
      console.error("Error revoking API key:", error);
    }
  };

  return (
    <div className="space-y-6" data-testid="settings-page">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Settings
      </h1>

      {/* Profile Settings */}
      <ProfileSettingsForm
        userProfile={userProfile}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* API Keys Management */}
      <ApiKeysManager
        apiKeys={apiKeys}
        onGenerateKey={handleGenerateKey}
        onRevokeKey={handleRevokeKey}
      />

      {/* Additional Settings Sections */}
      <div
        className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg dark:shadow-slate-700/50 border border-slate-200 dark:border-slate-700"
        data-testid="notification-preferences-section"
      >
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Notification Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Email Notifications
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Receive email updates about your account activity
              </p>
            </div>
            <button
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 transition-colors"
              data-testid="email-notifications-toggle"
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                API Usage Alerts
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Get notified when you approach your usage limits
              </p>
            </div>
            <button
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors"
              data-testid="api-usage-alerts-toggle"
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      <div
        className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg dark:shadow-slate-700/50 border border-slate-200 dark:border-slate-700"
        data-testid="danger-zone-section"
      >
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Danger Zone
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div>
              <h4 className="text-sm font-medium text-red-900 dark:text-red-200">
                Delete Account
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                Permanently delete your account and all associated data
              </p>
            </div>
            <button
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700"
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
