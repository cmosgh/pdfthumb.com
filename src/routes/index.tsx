import { createFileRoute } from "@tanstack/react-router";
import App from "../App";
import { APP_NAME } from "../constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: `${APP_NAME} — Fast PDF Thumbnails` }],
  }),
  component: () => <App />,
});
