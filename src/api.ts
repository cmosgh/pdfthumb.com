const API_BASE_URL = "/api";

export default API_BASE_URL;

// Helper function to get headers with API key in development mode
const getHeaders = (additionalHeaders?: Record<string, string>) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...additionalHeaders,
  };

  // In development mode, add the test API key
  if (import.meta.env.MODE === "development" && import.meta.env.TEST_API_KEY) {
    headers["x-api-key"] = import.meta.env.TEST_API_KEY;
  }

  return headers;
};

// API functions for API keys
export const apiKeysApi = {
  // Get all API keys
  async getApiKeys() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    try {
      const response = await fetch(`${API_BASE_URL}/api-key`, {
        headers: getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error("Failed to fetch API keys");
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("API request timed out");
      }
      throw error;
    }
  },

  // Create a new API key
  async createApiKey(keyData: { name: string }) {
    const response = await fetch(`${API_BASE_URL}/api-key/generate`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(keyData),
    });
    if (!response.ok) throw new Error("Failed to create API key");
    return response.json();
  },

  // Revoke an API key
  async revokeApiKey(keyId: string) {
    const response = await fetch(`${API_BASE_URL}/api-key/${keyId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to revoke API key");
    return response.json();
  },
};
