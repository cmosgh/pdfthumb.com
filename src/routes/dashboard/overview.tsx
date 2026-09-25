import { createFileRoute } from "@tanstack/react-router";
import { PlanQuota } from "../../components/dashboard/PlanQuota";
import { RequestsPerDay } from "../../components/dashboard/RequestsPerDay";
import { APP_NAME } from "../../constants";
import { Heading } from "@/components/ui";

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
      <Heading as="h1" size="3xl" weight="bold" tone="fg">
        Dashboard Overview
      </Heading>
      <PlanQuota />
      <RequestsPerDay />
    </div>
  );
}
