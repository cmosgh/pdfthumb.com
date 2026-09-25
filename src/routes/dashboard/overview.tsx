import { createFileRoute } from "@tanstack/react-router";
import { PlanQuota } from "../../components/dashboard/PlanQuota";
import { RequestsPerDay } from "../../components/dashboard/RequestsPerDay";
import { APP_NAME } from "../../constants";

export const Route = createFileRoute("/dashboard/overview")({
  head: () => ({
    meta: [{ title: `Overview | ${APP_NAME}` }],
  }),
  component: OverviewComponent,
});

// Only numbers the API reports (#112, #119).
function OverviewComponent() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Dashboard Overview
      </h1>
      <PlanQuota />
      <RequestsPerDay />
    </div>
  );
}
