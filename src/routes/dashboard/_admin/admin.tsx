import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "../../../constants";
import { Heading, Text } from "@/components/ui";

export const Route = createFileRoute("/dashboard/_admin/admin")({
  head: () => ({
    meta: [{ title: `Admin | ${APP_NAME}` }],
  }),
  component: AdminIndexComponent,
});

function AdminIndexComponent() {
  return (
    <div className="p-6">
      <Heading as="h1" size="2xl" weight="bold" tone="fg" className="mb-4">
        Admin Panel
      </Heading>
      <Text tone="fg-caption">Admin features are coming in Phase 6.</Text>
    </div>
  );
}
