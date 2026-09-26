import {
  createRootRouteWithContext,
  Outlet,
  HeadContent,
  useMatches,
} from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { LockClosedIcon } from "../components/icons";
import { useTheme } from "../hooks/useTheme";
import { APP_NAME } from "../constants";
import { useAuth } from "../hooks/AuthContext";
import type { User } from "../types";
import {
  buttonClasses,
  Container,
  Dialog,
  Heading,
  Icon,
  RouterTextLink,
  Text,
} from "../components/ui";

interface RouterContext {
  auth:
    | {
        isAuthenticated: boolean;
        isRoleLoading: boolean;
        user: User | null;
      }
    | undefined;
}

function SessionExpiredModal() {
  return (
    <Dialog open variant="session" aria-labelledby="session-expired-title">
      <Icon
        as={LockClosedIcon}
        tone="fg-subtle"
        className="mx-auto mb-4 h-10 w-10"
        aria-hidden="true"
      />
      <Heading
        as="h2"
        id="session-expired-title"
        size="xl"
        weight="bold"
        tone="fg"
        className="mb-2"
      >
        Your session expired
      </Heading>
      <Text size="sm" tone="fg-caption" className="mb-6">
        We couldn't renew your session automatically. Please log in again to
        continue.
      </Text>
      <a href="/login" className={buttonClasses({ variant: "session" })}>
        Log in again
      </a>
    </Dialog>
  );
}

function RootComponent() {
  const [theme, toggleTheme] = useTheme();
  const { sessionExpired } = useAuth();
  // Dashboard routes render their own <main> next to the sidebar nav (#166):
  // the shell wraps them in a plain container instead of a second <main>.
  // Matched by route, so a stray /dashboardx 404 keeps the shell's <main>.
  const isDashboardRoute = useMatches({
    select: (matches) => matches.some((m) => m.routeId === "/dashboard"),
  });
  const OutletWrapper = isDashboardRoute ? "div" : "main";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <OutletWrapper className="flex-grow">
        <Outlet />
      </OutletWrapper>
      <Footer />
      {sessionExpired && <SessionExpiredModal />}
    </div>
  );
}

// An unknown path gets a page that says so, inside the usual frame (#144).
function NotFound() {
  return (
    <Container className="py-16 max-w-3xl" data-testid="not-found">
      <Heading as="h1" size="page" weight="bold" tone="fg">
        Page not found
      </Heading>
      <Text tone="fg-muted" className="mt-6">
        This page doesn't exist. Go to the{" "}
        <RouterTextLink to="/" weight="medium">
          home page
        </RouterTextLink>
        .
      </Text>
    </Container>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { title: APP_NAME },
      {
        name: "description",
        content: "Fast, reliable PDF thumbnail generation API for developers.",
      },
      { property: "og:title", content: APP_NAME },
      {
        property: "og:description",
        content: "Fast, reliable PDF thumbnail generation API for developers.",
      },
      { property: "og:site_name", content: APP_NAME },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <>
      <HeadContent />
      <RootComponent />
    </>
  ),
  notFoundComponent: NotFound,
});
