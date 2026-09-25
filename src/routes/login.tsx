import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "../constants";
import googleMark from "../assets/google-g.svg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: `Sign In | ${APP_NAME}` }],
  }),
  validateSearch: (
    search: Record<string, unknown>,
  ): { error?: string; redirect?: string } => ({
    ...(typeof search.error === "string" && { error: search.error }),
    ...(typeof search.redirect === "string" && { redirect: search.redirect }),
  }),
  component: LoginComponent,
});

function LoginComponent() {
  const { error } = Route.useSearch();
  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-page flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-heading">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-fg-caption">
          Sign in with your Google account to access the dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            {error && (
              <p
                role="alert"
                className="rounded-md bg-danger-soft p-3 text-sm text-danger-fg"
              >
                Google sign-in didn't complete. Please try again.
              </p>
            )}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex justify-center items-center py-3 px-4 border border-line-input rounded-md shadow-sm bg-surface-raised text-sm font-medium text-fg-2 hover:bg-neutral focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-focus transition-colors"
            >
              {/* Google's own colours: the mark isn't themed (#137). */}
              <img src={googleMark} alt="" className="w-5 h-5 mr-3" />
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
