import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "../constants";
import HoldingPage from "../components/trust/HoldingPage";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [{ title: `Security | ${APP_NAME}` }],
  }),
  component: SecurityPage,
});

// #144 part 2 fills this in, only from facts confirmed against the code
// and infrastructure.
function SecurityPage() {
  return (
    <HoldingPage
      title="Security"
      notice="Our security overview is being written."
    />
  );
}
