import { createCollection, localOnlyCollectionOptions } from "@tanstack/db";
import { apiKeysApi } from "./api";
import { queryClient } from "./queryClient";
import type { ApiKey } from "./types";

export const apiKeysCollection = createCollection(
  localOnlyCollectionOptions({
    id: "apiKeys",
    getKey: (item: ApiKey) => item.id,
  }),
);

// Export collections object for easier access
export const collections = {
  apiKeys: apiKeysCollection,
};

// Helper functions for common operations
export const dbHelpers = {
  // Sync API keys from the API
  async syncApiKeys(token?: string) {
    try {
      const apiKeys = await apiKeysApi.getApiKeys(token);

      // The API is the source of truth: update keys we already hold (e.g. a
      // revoke flips `enabled`), insert new ones. Update in place: a delete
      // followed by an insert of the same key lets the delete's transaction
      // commit last and drop the row.
      for (const key of apiKeys) {
        try {
          if (collections.apiKeys.has(key.id)) {
            collections.apiKeys.update(key.id, (draft) => {
              Object.assign(draft, key);
            });
          } else {
            collections.apiKeys.insert(key);
          }
        } catch (e) {
          // One bad key mustn't stop the rest from syncing.
          console.warn(`Failed to sync API key ${key.id}:`, e);
        }
      }

      return apiKeys;
    } catch (error) {
      console.error("Error syncing API keys:", error);
      throw error;
    }
  },

  // Clear all data - placeholder for now
  async clearAllData() {
    // For now, we'll just log - in a real app you'd implement proper clearing
    console.log("Clearing data not implemented yet");
  },
};
