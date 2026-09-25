import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "../constants";
import HoldingPage from "../components/trust/HoldingPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [{ title: `Terms of Service | ${APP_NAME}` }],
  }),
  component: TermsPage,
});

// Until the legal text is ready, this page says so; none is invented in its
// place (#144).
function TermsPage() {
  return (
    <HoldingPage
      title="Terms of Service"
      notice="Our Terms of Service are being finalised."
    />
  );
}
