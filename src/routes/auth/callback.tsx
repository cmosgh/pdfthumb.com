import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../../hooks/AuthContext";
import { authApi } from "../../api";
import { sessionExpiresAt } from "../../utils/duration";

export const Route = createFileRoute("/auth/callback")({
  component: CallbackComponent,
});

// A code is single-use, so every mount of the callback shares one exchange per
// code. That covers StrictMode's double effect and a remount of this route alike.
const exchanges = new Map<string, ReturnType<typeof authApi.exchangeCode>>();

function exchangeOnce(code: string) {
  let exchange = exchanges.get(code);
  if (!exchange) {
    exchange = authApi.exchangeCode(code);
    exchanges.set(code, exchange);
  }
  return exchange;
}

function CallbackComponent() {
  const navigate = useNavigate();
  const { login, fetchMe } = useAuth();

  useEffect(() => {
    const failToLogin = () =>
      navigate({ to: "/login", search: { error: "oauth" }, replace: true });

    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (!code || params.has("error")) {
          failToLogin();
          return;
        }

        const session = await exchangeOnce(code);
        const tokens = {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresAt: sessionExpiresAt(session.expiresIn),
        };
        const now = new Date().toISOString();
        const user = {
          id: session.user.id,
          email: session.user.email ?? "",
          name: session.user.displayName ?? session.user.email ?? "",
          roles: session.user.roles,
          createdAt: now,
          updatedAt: now,
        };

        login(tokens, user);
        // Fire fetchMe async: it refreshes the roles, the dashboard doesn't wait on it
        fetchMe(tokens.accessToken).catch(console.error);
        navigate({ to: "/dashboard", replace: true });
      } catch (error) {
        console.error("OAuth callback error:", error);
        failToLogin();
      }
    };

    handleCallback();
  }, [login, fetchMe, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900 dark:text-white">
            Signing you in...
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-slate-400">
            Please wait while we complete your authentication.
          </p>
        </div>
      </div>
    </div>
  );
}
