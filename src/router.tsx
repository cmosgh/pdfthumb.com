import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import type { User } from "./types";

// Define router context
interface RouterContext {
  auth:
    | {
        isAuthenticated: boolean;
        isRoleLoading: boolean;
        user: User | null;
      }
    | undefined;
}

export const router = createRouter({
  routeTree,
  scrollRestorationBehavior: "smooth",
  defaultHashScrollIntoView: true,
  context: {
    auth: {
      isAuthenticated: false,
      isRoleLoading: false,
      user: null,
    },
  } as RouterContext,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
