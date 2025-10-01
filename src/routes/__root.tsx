import { createRootRoute, Outlet } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useTheme } from "../hooks/useTheme";
import { AuthProvider } from "../hooks/AuthContext";

function RootComponent() {
  const [theme, toggleTheme] = useTheme();

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
