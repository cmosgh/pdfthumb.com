import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { AuthState, AuthTokens, User } from "../types";
import { authApi } from "../api";
import { sessionExpiresAt } from "../utils/duration";

interface AuthContextType extends AuthState {
  login: (tokens: AuthTokens, user: User) => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
  fetchMe: (accessToken: string) => Promise<void>;
  sessionExpired: boolean;
  scheduleRefresh: (expiresAt: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = "auth_tokens";
const USER_STORAGE_KEY = "auth_user";

const clearStoredSession = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
};

const readStoredTokens = (): AuthTokens | null => {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY) ?? "null");
  } catch {
    return null;
  }
};

const readStoredUser = (): User | null => {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) ?? "null");
  } catch {
    return null;
  }
};

// Another tab refreshed since `presented` was read: a rotated token, or the
// same token with a later expiry.
const supersedes = (stored: AuthTokens, presented: AuthTokens) =>
  stored.refreshToken !== presented.refreshToken ||
  stored.expiresAt > presented.expiresAt;

// Firefox hands one tab's localStorage write to the others asynchronously,
// so a 401 can arrive while storage here still shows the spent pair. Give
// the winning tab's pair a moment to land before calling the session spent.
const ROTATION_GRACE_MS = 2000;
const waitForNewerTokens = (presented: AuthTokens) =>
  new Promise<AuthTokens | null>((resolve) => {
    const newer = () => {
      const stored = readStoredTokens();
      return stored && supersedes(stored, presented) ? stored : null;
    };
    const done = (tokens: AuthTokens | null) => {
      clearTimeout(timer);
      window.removeEventListener("storage", onStorage);
      resolve(tokens);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === TOKEN_STORAGE_KEY && newer()) done(newer());
    };
    const timer = setTimeout(() => done(newer()), ROTATION_GRACE_MS);
    window.addEventListener("storage", onStorage);
    if (newer()) done(newer());
  });

// Only a 401 means the refresh token is spent; a 5xx or a network error may
// pass, and a reload can still renew the session.
const isSpentRefreshToken = (err: unknown) =>
  (err as { status?: number } | null)?.status === 401;

// Tabs share one refresh token and the server accepts it once (#81), so
// refreshes (and logout's clear) run one at a time across tabs. Without Web
// Locks, the re-read of storage and the 401 grace are the only guards.
const REFRESH_LOCK = "pdfthumb-refresh";
const withRefreshLock = async <T,>(fn: () => Promise<T>): Promise<T> =>
  navigator.locks ? await navigator.locks.request(REFRESH_LOCK, fn) : fn();

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

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

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
    // Clear refresh timer before anything else
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

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

    // Under the refresh lock: a refresh in flight in another tab stores its
    // pair first, and this clears it, instead of it landing after the clear.
    await withRefreshLock(async () => clearStoredSession());

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

  // doRefresh defined first so scheduleRefresh can reference it.
  // `presented` is the pair the caller meant to refresh: if another tab
  // refreshed it while this one waited for the lock, adopt the stored pair
  // instead of spending the old token on a certain 401.
  const doRefresh = useCallback(async (presented?: AuthTokens): Promise<void> => {
    const session = await withRefreshLock(async (): Promise<AuthTokens> => {
      const tokens = readStoredTokens();
      if (!tokens) throw new Error('No tokens in storage');
      if (!tokens.refreshToken) throw new Error('No refresh token');

      if (presented && supersedes(tokens, presented)) return tokens;

      const response = await authApi.refresh(tokens.refreshToken);

      const rotated: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken || tokens.refreshToken,
        expiresAt: sessionExpiresAt(response.expiresIn),
      };

      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(rotated));
      return rotated;
    });

    setAuthState(prev => ({
      ...prev,
      tokens: session,
      user: readStoredUser() ?? prev.user,
      isAuthenticated: true,
      isLoading: false,
      isRoleLoading: false,
    }));

    // Reschedule after successful refresh — scheduleRefresh is called via ref
    // to avoid circular dependency with useCallback deps
    scheduleRefreshRef.current(session.expiresAt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleRefreshRef = useRef<(expiresAt: number) => void>(() => {});

  const scheduleRefresh = useCallback((expiresAt: number) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry
    const delay = Math.max(expiresAt - Date.now() - BUFFER_MS, 0);

    refreshTimerRef.current = setTimeout(async () => {
      refreshTimerRef.current = null;
      const presented = readStoredTokens() ?? undefined;
      try {
        await doRefresh(presented);
      } catch (err) {
        console.error('Proactive token refresh failed:', err);
        if (isSpentRefreshToken(err)) {
          const stored = presented ? await waitForNewerTokens(presented) : null;
          if (stored) {
            // Another tab refreshed first and stored a new session: use it
            // rather than wiping it, which would log that tab out silently.
            setAuthState(prev => ({
              ...prev,
              tokens: stored,
              user: readStoredUser() ?? prev.user,
            }));
            scheduleRefreshRef.current(stored.expiresAt);
            return;
          }
          // Spent for good: drop the stored session, or every reload treats
          // it as valid, retries the dead refresh and the modal loops (#79).
          clearStoredSession();
        }
        // Per user decision: show session expired UI, do NOT silently log out
        setSessionExpired(true);
      }
    }, delay);
  }, [doRefresh]);

  // Keep scheduleRefreshRef in sync so doRefresh can call scheduleRefresh
  // without a circular useCallback dependency
  useEffect(() => {
    scheduleRefreshRef.current = scheduleRefresh;
  }, [scheduleRefresh]);

  // Keep the existing refreshToken function as backward-compatible alias
  const refreshToken = useCallback(async () => {
    await doRefresh();
  }, [doRefresh]);

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
            // Schedule proactive refresh before token expires
            scheduleRefresh(tokens.expiresAt);
            // Fire fetchMe async to restore roles — do not await in effect
            fetchMe(tokens.accessToken);
          } else {
            // Token expired or about to expire, clear it
            clearStoredSession();
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
        clearStoredSession();
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
  }, [fetchMe, scheduleRefresh]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  // Cross-tab sync via storage events
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== TOKEN_STORAGE_KEY) return;

      if (!event.newValue) {
        // Another tab logged out — clear local state
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
        setAuthState({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          isRoleLoading: false,
        });
        return;
      }

      try {
        const newTokens: AuthTokens = JSON.parse(event.newValue);
        setAuthState(prev => ({ ...prev, tokens: newTokens }));
        scheduleRefresh(newTokens.expiresAt);
      } catch {
        // Corrupted storage entry — ignore
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [scheduleRefresh]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshToken,
    fetchMe,
    sessionExpired,
    scheduleRefresh,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
