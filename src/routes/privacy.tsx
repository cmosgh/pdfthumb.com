import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "../constants";
import HoldingPage from "../components/trust/HoldingPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [{ title: `Privacy Policy | ${APP_NAME}` }],
  }),
  component: PrivacyPage,
});

// Until the legal text is ready, this page says so; none is invented in its
// place (#144).
function PrivacyPage() {
  return (
    <HoldingPage
      title="Privacy Policy"
      notice="Our Privacy Policy is being finalised."
    />
  );
}
