import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "../constants";
import PricingPage from "../components/pricing/PricingPage";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [{ title: `Pricing | ${APP_NAME}` }],
  }),
  component: PricingPage,
});
