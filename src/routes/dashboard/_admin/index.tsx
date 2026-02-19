import { createFileRoute } from '@tanstack/react-router';
import { APP_NAME } from '../../../constants';

export const Route = createFileRoute('/dashboard/_admin/')({
  head: () => ({
    meta: [{ title: `Admin | ${APP_NAME}` }],
  }),
  component: AdminIndexComponent,
});

function AdminIndexComponent() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
        Admin Panel
      </h1>
      <p className="text-slate-600 dark:text-slate-400">
        Admin features are coming in Phase 6.
      </p>
    </div>
  );
}
