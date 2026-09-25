import { createFileRoute } from "@tanstack/react-router";
import { RequestsPerDay } from "../../components/dashboard/RequestsPerDay";
import { APP_NAME } from "../../constants";

export const Route = createFileRoute("/dashboard/overview")({
  head: () => ({
    meta: [{ title: `Overview | ${APP_NAME}` }],
  }),
  component: OverviewComponent,
});

// Only numbers the API reports (#112, #119). The plan-and-quota widget
// follows once the subscription endpoint accepts the dashboard's token.
function OverviewComponent() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Dashboard Overview
      </h1>
      <RequestsPerDay />
    </div>
  );
}
