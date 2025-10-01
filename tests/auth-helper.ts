import { Page } from "@playwright/test";

export interface MockUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface MockTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Mock authentication data for testing
 */
export const mockUser: MockUser = {
  id: "test-user-123",
  email: "test@example.com",
  name: "Test User",
  picture: "https://example.com/avatar.jpg",
};

export const mockTokens: MockTokens = {
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  expiresAt: Date.now() + 3600000 + 300000, // 1 hour + 5 minutes buffer from now
};

/**
 * Sets up mock authentication state in localStorage for testing
 * This bypasses the need for actual OAuth login during tests
 */
export async function mockAuthentication(page: Page): Promise<void> {
  // Set authentication tokens and user data in localStorage
  await page.addInitScript(() => {
    localStorage.setItem(
      "auth_tokens",
      JSON.stringify({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        expiresAt: Date.now() + 3600000 + 300000, // 1 hour + 5 minutes buffer from now
      }),
    );

    localStorage.setItem(
      "auth_user",
      JSON.stringify({
        id: "test-user-123",
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
      }),
    );
  });
}

/**
 * Clears authentication state from localStorage
 */
export async function clearAuthentication(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.removeItem("auth_tokens");
    localStorage.removeItem("auth_user");
  });
}
