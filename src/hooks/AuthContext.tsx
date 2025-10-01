import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { AuthState, User, AuthTokens } from "../types";
import { authApi } from "../api";

interface AuthContextType extends AuthState {
  login: (tokens: AuthTokens, user: User) => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
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
  });

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const tokensJson = localStorage.getItem(TOKEN_STORAGE_KEY);
        const userJson = localStorage.getItem(USER_STORAGE_KEY);

        if (tokensJson && userJson) {
          const tokens: AuthTokens = JSON.parse(tokensJson);
          const user: User = JSON.parse(userJson);

          // Check if access token is still valid
          if (tokens.expiresAt > Date.now()) {
            setAuthState({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Token expired or about to expire, clear auth state
            // In a real app with a backend, you would refresh here
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            localStorage.removeItem(USER_STORAGE_KEY);
            setAuthState({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Error loading auth state:", error);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadAuthState();
  }, []);

  const login = useCallback((tokens: AuthTokens, user: User) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

    setAuthState({
      user,
      tokens,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call logout API to invalidate session on backend
      const currentToken = authState.tokens?.accessToken;
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
    });

    // Redirect to root
    window.location.href = "/";
  }, [authState.tokens]);

  const refreshToken = useCallback(async () => {
    // In this frontend-only demo, token refresh is not implemented
    // In a real app, you would call the backend refresh endpoint
    console.warn("Token refresh not implemented in demo mode");
    logout();
  }, [logout]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
