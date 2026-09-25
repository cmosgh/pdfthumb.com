import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "../constants";
import HoldingPage from "../components/trust/HoldingPage";

export const Route = createFileRoute("/subprocessors")({
  head: () => ({
    meta: [{ title: `Subprocessors | ${APP_NAME}` }],
  }),
  component: SubprocessorsPage,
});

// #144 part 2 fills this in, only from facts confirmed against the code
// and infrastructure.
function SubprocessorsPage() {
  return (
    <HoldingPage
      title="Subprocessors"
      notice="Our list of subprocessors is being written."
    />
  );
}
