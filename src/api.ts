const API_BASE_URL = "http://localhost:3000/api";

export default API_BASE_URL;

// API functions for API keys
export const apiKeysApi = {
  // Get all API keys
  async getApiKeys() {
    const response = await fetch(`${API_BASE_URL}/api-keys`);
    if (!response.ok) throw new Error("Failed to fetch API keys");
    return response.json();
  },

  // Create a new API key
  async createApiKey(keyData: { name: string }) {
    const response = await fetch(`${API_BASE_URL}/api-keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(keyData),
    });
    if (!response.ok) throw new Error("Failed to create API key");
    return response.json();
  },

  // Revoke an API key
  async revokeApiKey(keyId: string) {
    const response = await fetch(`${API_BASE_URL}/api-keys/${keyId}/revoke`, {
      method: "PUT",
    });
    if (!response.ok) throw new Error("Failed to revoke API key");
    return response.json();
  },

  // Delete an API key
  async deleteApiKey(keyId: string) {
    const response = await fetch(`${API_BASE_URL}/api-keys/${keyId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete API key");
    return response.json();
  },
};
