import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsComponent,
});

function SettingsComponent() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Settings
      </h1>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg dark:shadow-slate-700/50 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Account Settings
        </h3>
        <p className="text-slate-600 dark:text-slate-300">
          Configure your account preferences and API settings here.
        </p>
      </div>
    </div>
  );
}
