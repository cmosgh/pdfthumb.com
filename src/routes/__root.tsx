import { createRootRoute, Outlet, HeadContent } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useTheme } from "../hooks/useTheme";
import { AuthProvider } from "../hooks/AuthContext";
import { APP_NAME } from "../constants";

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
  head: () => ({
    meta: [
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Fast, reliable PDF thumbnail generation API for developers.",
      },
      { property: "og:title", content: APP_NAME },
      {
        property: "og:description",
        content:
          "Fast, reliable PDF thumbnail generation API for developers.",
      },
      { property: "og:site_name", content: APP_NAME },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <AuthProvider>
      <HeadContent />
      <RootComponent />
    </AuthProvider>
  ),
});
