import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "../../../constants";

export const Route = createFileRoute("/dashboard/_admin/admin")({
  head: () => ({
    meta: [{ title: `Admin | ${APP_NAME}` }],
  }),
  component: AdminIndexComponent,
});

function AdminIndexComponent() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-fg mb-4">Admin Panel</h1>
      <p className="text-fg-caption">Admin features are coming in Phase 6.</p>
    </div>
  );
}
