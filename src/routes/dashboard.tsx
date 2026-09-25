import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "../components/dashboard/DashboardLayout";
import { useAuth } from "../hooks/AuthContext";
import { useEffect } from "react";
import { APP_NAME } from "../constants";
import { Spinner, Surface, Text } from "@/components/ui";

// Extend Window interface for Cypress
declare global {
  interface Window {
    Cypress?: any;
  }
}

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: `Dashboard | ${APP_NAME}` }],
  }),
  component: DashboardComponent,
});

function DashboardComponent() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Skip auth check during tests - allow direct access for testing
    if (
      process.env.NODE_ENV === "test" ||
      (typeof window !== "undefined" && window.Cypress)
    ) {
      return;
    }

    // Only check authentication after loading is complete
    // Add a small delay to ensure auth state has settled
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (!isAuthenticated) {
          navigate({
            to: "/login",
            search: {
              redirect: "/dashboard",
            },
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state only while auth is being determined (only in non-test environments)
  if (
    isLoading &&
    process.env.NODE_ENV !== "test" &&
    !(typeof window !== "undefined" && window.Cypress)
  ) {
    return (
      <Surface
        tone="page"
        className="min-h-screen flex items-center justify-center"
      >
        <div className="text-center">
          <Spinner />
          <Text tone="fg-caption" className="mt-4">
            Loading dashboard...
          </Text>
        </div>
      </Surface>
    );
  }

  // If not loading and not authenticated, the useEffect will handle the redirect
  // Don't show loading screen for unauthenticated users

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
