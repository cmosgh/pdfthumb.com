const API_BASE_URL = "/api";

export default API_BASE_URL;

// Helper function to get headers with auth token or API key
const getHeaders = (
  token?: string,
  additionalHeaders?: Record<string, string>,
) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...additionalHeaders,
  };

  // If user is authenticated, use Bearer token
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  // Otherwise, in development mode, add the test API key
  else if (
    import.meta.env.MODE === "development" &&
    import.meta.env.TEST_API_KEY
  ) {
    headers["x-api-key"] = import.meta.env.TEST_API_KEY;
  }

  return headers;
};

// API functions for authentication
export const authApi = {
  // Refresh access token using refresh token
  async refresh(refreshToken: string) {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      return response.json();
    } catch (error) {
      console.error("Token refresh API error:", error);
      throw error;
    }
  },

  // Logout - this would typically call the backend to invalidate the session
  async logout(token?: string) {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: getHeaders(token),
      });
      // Even if the request fails, we should clear local state
      return response.ok || response.status === 401;
    } catch (error) {
      console.error("Logout API error:", error);
      // Return true to allow local logout even if API call fails
      return true;
    }
  },
};

// API functions for API keys
export const apiKeysApi = {
  // Get all API keys
  async getApiKeys(token?: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    try {
      const response = await fetch(`${API_BASE_URL}/api-key`, {
        headers: getHeaders(token),
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
  async createApiKey(keyData: { name: string }, token?: string) {
    const response = await fetch(`${API_BASE_URL}/api-key/generate`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(keyData),
    });
    if (!response.ok) throw new Error("Failed to create API key");
    return response.json();
  },

  // Revoke an API key
  async revokeApiKey(keyId: string, token?: string) {
    const response = await fetch(`${API_BASE_URL}/api-key/${keyId}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error("Failed to revoke API key");
    return response.json();
  },
};
