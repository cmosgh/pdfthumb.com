import { createFileRoute, redirect } from "@tanstack/react-router";

// The old Analytics page showed invented data (#112); Usage replaced it
// (#120). Old links land there.
export const Route = createFileRoute("/dashboard/analytics")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/usage", replace: true });
  },
});
