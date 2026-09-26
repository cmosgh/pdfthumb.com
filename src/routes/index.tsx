import { createFileRoute, redirect } from "@tanstack/react-router";
import App from "../App";
import { APP_NAME } from "../constants";

// Pricing moved to its own page (#141). Links to the old sections land on
// it, replacing the history entry so Back doesn't bounce.
const MOVED_TO_PRICING: Record<string, string | undefined> = {
  pricing: undefined,
  "overage-pricing": "overage-pricing",
};

export const Route = createFileRoute("/")({
  beforeLoad: ({ location }) => {
    if (Object.hasOwn(MOVED_TO_PRICING, location.hash)) {
      throw redirect({
        to: "/pricing",
        hash: MOVED_TO_PRICING[location.hash],
        replace: true,
      });
    }
  },
  head: () => ({
    meta: [{ title: `${APP_NAME} — Fast PDF Thumbnails` }],
  }),
  component: () => <App />,
});
