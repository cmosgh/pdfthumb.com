import { Outlet, createRootRoute } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useTheme } from "../hooks/useTheme";

export const Route = createRootRoute({
  component: () => {
    const [theme, toggleTheme] = useTheme();

    return (
      <div className="min-h-screen flex flex-col">
        <Navbar theme={theme} toggleTheme={toggleTheme} data-testid="navbar-wrapper"/>
        <main className="flex-grow">
          <Outlet />
        </main>
        <Footer />
      </div>
    );
  },
});
