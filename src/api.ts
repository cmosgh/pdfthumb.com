import type { AuthSession } from "./types";

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
      // The refresh holds a lock every tab waits on: don't let a stalled
      // connection hold it. A timeout counts as a passing failure.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15_000);
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        // The status tells a spent refresh token (401) from a passing failure.
        throw Object.assign(new Error("Token refresh failed"), {
          status: response.status,
        });
      }

      // Only the token pair today: no expiresIn, no user (unlike the OAuth
      // exchange's AuthSession).
      return response.json() as Promise<
        Pick<AuthSession, "accessToken" | "refreshToken"> &
          Partial<Pick<AuthSession, "expiresIn">>
      >;
    } catch (error) {
      console.error("Token refresh API error:", error);
      throw error;
    }
  },

  // Redeem the single-use code from the OAuth callback redirect for a session
  async exchangeCode(code: string) {
    const response = await fetch("/api/auth/oauth/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!response.ok) throw new Error("OAuth code exchange failed");
    return response.json() as Promise<AuthSession>;
  },

  // Fetch user profile including roles from the backend
  async me(accessToken: string) {
    const response = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error("Failed to fetch user profile");
    return response.json() as Promise<{
      id: string;
      email: string;
      roles: string[];
      displayName: string | null;
    }>;
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

// One day of the caller's requests to the thumbnail routes: the date as
// YYYY-MM-DD (UTC) and the counts as numbers (BE #350). The percentiles come
// only with Pro Analytics.
export interface AnalyticsDailyBucket {
  date: string;
  call_count: number;
  error_count: number;
  // Thumbnails rendered, by page requests and by ZIPs
  thumbnails_page?: number;
  thumbnails_zip?: number;
  p50_duration_ms?: number | null;
  p95_duration_ms?: number | null;
}

export interface AnalyticsSummary {
  // Oldest first; days without requests are missing
  dailyBuckets: AnalyticsDailyBucket[];
  // Busiest first; a null key is a request sent without one
  byApiKey?: {
    apiKeyId: string | null;
    requests: number;
    failures: number;
    lastUsedAt: string;
  }[];
  // Most frequent first; a null code was never recorded
  failuresByCode?: { code: string | null; count: number }[];
}

// The plan capability behind percentiles, history past 30 days and the CSV
export const ANALYTICS_PRO = "analytics_pro";

// API functions for usage analytics
export const analyticsApi = {
  // Usage over the last `days` days (past 30 needs Pro Analytics)
  async getSummary(days: number, token?: string) {
    const response = await fetch(
      `${API_BASE_URL}/analytics/summary?days=${days}`,
      { headers: getHeaders(token) },
    );
    if (!response.ok) throw new Error("Failed to fetch analytics summary");
    return response.json() as Promise<AnalyticsSummary>;
  },

  // The same usage as CSV, Pro Analytics only. It needs the bearer header,
  // so it's fetched rather than linked.
  async exportCsv(days: number, token?: string) {
    const response = await fetch(
      `${API_BASE_URL}/analytics/export.csv?days=${days}`,
      { headers: getHeaders(token) },
    );
    if (!response.ok) throw new Error("Failed to export analytics");
    return response.blob();
  },
};

// The caller's subscription, as far as the dashboard shows it. The API also
// returns overusageCostPerThumbnail; prices aren't public, so it's left out.
export interface Subscription {
  currentMonthlyUsage: number;
  // ISO, 00:00 UTC: when the period started
  currentPeriodStart: string;
  // ISO, exclusive, 00:00 UTC: when the quota resets
  currentPeriodEnd: string;
  subscriptionType: {
    name: string;
    monthlyThumbnailLimit: number;
    isHardLimit: boolean;
    features?: string[];
  };
}

// API functions for the user's subscription
export const subscriptionApi = {
  // The user's own subscription, or null when they have none (the API
  // answers that with an empty 200)
  async getSubscription(
    userId: string,
    token?: string,
  ): Promise<Subscription | null> {
    const response = await fetch(
      `${API_BASE_URL}/users/${encodeURIComponent(userId)}/subscription`,
      { headers: getHeaders(token) },
    );
    if (!response.ok) throw new Error("Failed to fetch subscription");
    const body = await response.text();
    return body.trim() ? (JSON.parse(body) as Subscription) : null;
  },
};

// Public health checks behind /status (#144). No key needed.
export const healthApi = {
  // Whether GET /api/health/{live|ready} answers 200 with status "ok". A
  // network failure counts as not ok.
  async check(name: "live" | "ready") {
    try {
      const response = await fetch(`${API_BASE_URL}/health/${name}`);
      if (!response.ok) return false;
      const body = (await response.json()) as { status?: string };
      return body.status === "ok";
    } catch {
      return false;
    }
  },
};
