import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth } from "../../hooks/AuthContext";

export const Route = createFileRoute("/auth/callback")({
  component: CallbackComponent,
});

function CallbackComponent() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        // Check if we have auth data in URL parameters or if the backend set cookies/tokens
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken =
          urlParams.get("accessToken") || urlParams.get("token");
        const refreshToken = urlParams.get("refreshToken");
        const expiresIn =
          urlParams.get("expiresIn") || urlParams.get("expires_in");
        const userData = urlParams.get("user");

        if (accessToken && expiresIn) {
          // Parse and validate expiresIn
          const expiresInSeconds = parseInt(expiresIn);
          if (isNaN(expiresInSeconds) || expiresInSeconds <= 0) {
            console.error("Invalid expiresIn value:", expiresIn);
            navigate({ to: "/login", replace: true });
            return;
          }

          // Ensure minimum 5 minutes expiration
          const minExpiration = 300; // 5 minutes
          const actualExpiration = Math.max(expiresInSeconds, minExpiration);

          // Create tokens - refresh token is optional
          const tokens = {
            accessToken,
            refreshToken: refreshToken || "",
            expiresAt: Date.now() + actualExpiration * 1000,
          };

          let user;
          if (userData) {
            // Parse user data if provided
            user = JSON.parse(decodeURIComponent(userData));
          } else {
            // Create a basic user object from token info (if available)
            // This is a fallback for OAuth providers that don't send user data
            user = {
              id: "oauth-user",
              email: "user@example.com",
              name: "OAuth User",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }

          // Login the user
          login(tokens, user);

          // Small delay to ensure state is updated before navigation
          setTimeout(() => {
            navigate({ to: "/dashboard", replace: true });
          }, 100);
        } else {
          // If no tokens in URL, redirect to login with error
          console.error("OAuth callback failed: missing tokens");
          navigate({ to: "/login", replace: true });
        }
      } catch (error) {
        console.error("OAuth callback error:", error);
        navigate({ to: "/login", replace: true });
      }
    };

    handleCallback();
  }, [login, navigate]);

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
