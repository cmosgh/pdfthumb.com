import { createFileRoute, redirect } from "@tanstack/react-router";

// Analytics showed invented data (file types, countries, file names the API
// never records). Hidden until the real usage page replaces it (#112).
export const Route = createFileRoute("/dashboard/analytics")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/overview", replace: true });
  },
});
