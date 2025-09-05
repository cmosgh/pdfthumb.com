import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsComponent,
});

function AnalyticsComponent() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Analytics
      </h1>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg dark:shadow-slate-700/50 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Usage Trends
        </h3>
        <div className="h-64 bg-gradient-to-br from-slate-50 to-sky-100 dark:from-slate-700 dark:to-sky-900 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-600">
          <p className="text-slate-600 dark:text-slate-300">
            Analytics charts will be displayed here
          </p>
        </div>
      </div>
    </div>
  );
}
