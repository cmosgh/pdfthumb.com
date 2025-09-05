import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/overview")({
  component: OverviewComponent,
});

function OverviewComponent() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Dashboard Overview
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg dark:shadow-slate-700/50 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
            Total API Calls
          </h3>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            12,345
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg dark:shadow-slate-700/50 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
            Active Projects
          </h3>
          <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
            8
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg dark:shadow-slate-700/50 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
            Storage Used
          </h3>
          <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">
            2.4 GB
          </p>
        </div>
      </div>
    </div>
  );
}
