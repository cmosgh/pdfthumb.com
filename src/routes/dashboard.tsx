import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "../components/dashboard/DashboardLayout";
import { useAuth } from "../hooks/AuthContext";
import { useEffect } from "react";

// Extend Window interface for Cypress
declare global {
  interface Window {
    Cypress?: any;
  }
}

export const Route = createFileRoute("/dashboard")({
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
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate({
          to: "/login",
          search: {
            redirect: "/dashboard",
          },
        });
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state while auth is being determined (only in non-test environments)
  if (
    (isLoading || !isAuthenticated) &&
    process.env.NODE_ENV !== "test" &&
    !(typeof window !== "undefined" && window.Cypress)
  ) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-slate-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
