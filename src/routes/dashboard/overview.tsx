import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_NAME } from "../../constants";

export const Route = createFileRoute("/dashboard/overview")({
  head: () => ({
    meta: [{ title: `Overview | ${APP_NAME}` }],
  }),
  component: OverviewComponent,
});

// The totals and trends here were mock data (#112); real usage numbers come
// with the usage page follow-up. Until then, show none.
function OverviewComponent() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Dashboard Overview
      </h1>
      <p
        className="text-slate-600 dark:text-slate-400"
        data-testid="usage-coming-soon"
      >
        Usage statistics are coming soon. Meanwhile, manage your API keys in{" "}
        <Link
          to="/dashboard/settings"
          className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
        >
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
