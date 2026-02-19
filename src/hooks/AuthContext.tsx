import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { AuthState, AuthTokens, User } from "../types";
import { authApi } from "../api";

interface AuthContextType extends AuthState {
  login: (tokens: AuthTokens, user: User) => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
  fetchMe: (accessToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = "auth_tokens";
const USER_STORAGE_KEY = "auth_user";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    isRoleLoading: false,
  });

  const login = useCallback((tokens: AuthTokens, user: User) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

    setAuthState({
      user,
      tokens,
      isAuthenticated: true,
      isLoading: false,
      isRoleLoading: true, // Role fetch is about to start via fetchMe
    });
  }, []);

  const logout = useCallback(async () => {
    // Get current token from localStorage to avoid stale state
    const tokensJson = localStorage.getItem(TOKEN_STORAGE_KEY);
    let currentToken: string | undefined;

    if (tokensJson) {
      try {
        const tokens: AuthTokens = JSON.parse(tokensJson);
        currentToken = tokens.accessToken;
      } catch (error) {
        console.error("Error parsing tokens for logout:", error);
      }
    }

    try {
      await authApi.logout(currentToken);
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Continue with local logout even if API call fails
    }

    // Clear local storage
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);

    setAuthState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      isRoleLoading: false,
    });

    // Redirect to root
    window.location.href = "/";
  }, []);

  const refreshToken = useCallback(async () => {
    const tokensJson = localStorage.getItem(TOKEN_STORAGE_KEY);
    const userJson = localStorage.getItem(USER_STORAGE_KEY);

    if (!tokensJson || !userJson) {
      throw new Error("No authentication data available");
    }

    const tokens: AuthTokens = JSON.parse(tokensJson);
    const user: User = JSON.parse(userJson);

    if (!tokens.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await authApi.refresh(tokens.refreshToken);

      const newTokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken || tokens.refreshToken,
        expiresAt: Date.now() + (response.expiresIn || 3600) * 1000, // Default to 1 hour if not provided
      };

      // Update storage
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(newTokens));

      // Update state
      setAuthState({
        user,
        tokens: newTokens,
        isAuthenticated: true,
        isLoading: false,
        isRoleLoading: false,
      });
    } catch (error) {
      console.error("Token refresh failed:", error);

      // Clear invalid auth data
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);

      setAuthState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        isRoleLoading: false,
      });

      throw error;
    }
  }, []);

  const fetchMe = useCallback(async (accessToken: string): Promise<void> => {
    setAuthState(prev => ({ ...prev, isRoleLoading: true }));
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const profile = await authApi.me(accessToken);
        setAuthState(prev => ({
          ...prev,
          isRoleLoading: false,
          user: prev.user
            ? { ...prev.user, roles: profile.roles }
            : null,
        }));
        return;
      } catch (err) {
        lastError = err as Error;
        if (attempt < 1) await new Promise(r => setTimeout(r, 1000));
      }
    }
    // All retries failed — log out per user decision
    console.error('fetchMe failed after retries:', lastError);
    setAuthState(prev => ({ ...prev, isRoleLoading: false }));
    await logout();
  }, [logout]);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const tokensJson = localStorage.getItem(TOKEN_STORAGE_KEY);
        const userJson = localStorage.getItem(USER_STORAGE_KEY);

        if (tokensJson && userJson) {
          const tokens: AuthTokens = JSON.parse(tokensJson);
          const user: User = JSON.parse(userJson);

          // Check if access token is still valid (with 1 minute buffer)
          if (tokens.expiresAt > Date.now() + 60000) {
            setAuthState({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
              isRoleLoading: false,
            });
            // Fire fetchMe async to restore roles — do not await in effect
            fetchMe(tokens.accessToken);
          } else {
            // Token expired or about to expire, clear it
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            localStorage.removeItem(USER_STORAGE_KEY);
            setAuthState({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
              isRoleLoading: false,
            });
          }
        } else {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Error loading auth state:", error);
        // Clear potentially corrupted data
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        setAuthState({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          isRoleLoading: false,
        });
      }
    };

    loadAuthState();
  }, [fetchMe]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshToken,
    fetchMe,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
