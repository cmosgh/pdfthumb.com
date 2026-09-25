import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "../constants";
import googleMark from "../assets/google-g.svg";
import {
  Button,
  Callout,
  Card,
  Heading,
  Surface,
  Text,
} from "../components/ui";

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
    <Surface
      tone="page"
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Heading
          as="h2"
          size="3xl"
          weight="extrabold"
          tone="heading"
          className="mt-6 text-center"
        >
          Sign in to your account
        </Heading>
        <Text size="sm" tone="fg-caption" className="mt-2 text-center">
          Sign in with your Google account to access the dashboard
        </Text>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card variant="login" className="py-8 px-4 sm:px-10">
          <div className="space-y-6">
            {error && (
              <Callout
                as="p"
                variant="dangerCompact"
                role="alert"
                className="p-3"
              >
                Google sign-in didn't complete. Please try again.
              </Callout>
            )}
            <Button
              variant="google"
              onClick={handleGoogleLogin}
              className="w-full"
            >
              {/* Google's own colours: the mark isn't themed (#137). */}
              <img src={googleMark} alt="" className="w-5 h-5 mr-3" />
              Continue with Google
            </Button>
          </div>
        </Card>
      </div>
    </Surface>
  );
}
