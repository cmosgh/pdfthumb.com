import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Define router context
interface RouterContext {
  auth: {
    isAuthenticated: boolean;
    user: any;
  };
}

export const router = createRouter({
  routeTree,
  scrollRestorationBehavior: "smooth",
  defaultHashScrollIntoView: true,
  context: {
    auth: {
      isAuthenticated: false,
      user: null,
    },
  } as RouterContext,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
