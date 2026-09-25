import {
  createRootRouteWithContext,
  Outlet,
  HeadContent,
  Link,
} from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { LockClosedIcon } from "../components/icons";
import { useTheme } from "../hooks/useTheme";
import { APP_NAME } from "../constants";
import { useAuth } from "../hooks/AuthContext";
import type { User } from "../types";

interface RouterContext {
  auth:
    | {
        isAuthenticated: boolean;
        isLoading: boolean;
        isRoleLoading: boolean;
        user: User | null;
      }
    | undefined;
}

function SessionExpiredModal() {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm"
    >
      <div className="bg-surface rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <LockClosedIcon
          className="mx-auto mb-4 h-10 w-10 text-fg-subtle"
          aria-hidden="true"
        />
        <h2
          id="session-expired-title"
          className="text-xl font-bold text-fg mb-2"
        >
          Your session expired
        </h2>
        <p className="text-fg-caption mb-6 text-sm">
          We couldn't renew your session automatically. Please log in again to
          continue.
        </p>
        <a
          href="/login"
          className="inline-block bg-accent hover:bg-accent-hover text-on-accent font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          Log in again
        </a>
      </div>
    </div>
  );
}

function RootComponent() {
  const [theme, toggleTheme] = useTheme();
  const { sessionExpired } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      {sessionExpired && <SessionExpiredModal />}
    </div>
  );
}

// An unknown path gets a page that says so, inside the usual frame (#144).
function NotFound() {
  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-3xl"
      data-testid="not-found"
    >
      <h1 className="text-3xl md:text-4xl font-bold text-fg">Page not found</h1>
      <p className="mt-6 text-fg-muted">
        This page doesn't exist. Go to the{" "}
        <Link to="/" className="font-medium text-link hover:text-link-hover">
          home page
        </Link>
        .
      </p>
    </div>
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
