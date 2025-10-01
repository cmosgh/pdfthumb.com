import { Outlet, createRootRoute } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useTheme } from "../hooks/useTheme";
import { AuthProvider, useAuth } from "../hooks/AuthContext";
import { useEffect } from "react";
import { router } from "../router";

function RootComponent() {
  const [theme, toggleTheme] = useTheme();
  const { isAuthenticated, user, isLoading } = useAuth();

  // Update router context when auth state changes
  useEffect(() => {
    if (!isLoading) {
      router.update({
        context: {
          auth: {
            isAuthenticated,
            user,
          },
        },
      });
    }
  }, [isAuthenticated, user, isLoading]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export const Route = createRootRoute({
  component: () => {
    return (
      <AuthProvider>
        <RootComponent />
      </AuthProvider>
    );
  },
});
