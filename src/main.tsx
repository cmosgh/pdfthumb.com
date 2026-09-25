import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { queryClient } from "./queryClient";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AuthProvider, useAuth } from "./hooks/AuthContext";

function AuthedApp() {
  const auth = useAuth();

  useEffect(() => {
    router.invalidate();
  }, [auth.isAuthenticated, auth.user?.roles]);

  return (
    <>
      <RouterProvider router={router} context={{ auth }} />
      {process.env.NODE_ENV === "development" && (
        <TanStackRouterDevtools router={router} />
      )}
    </>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Mock dashboard data is for local development only: production users must
// never see invented numbers (#112).
(import.meta.env.DEV
  ? import("./data/loadMockData").then((m) => m.loadMockData())
  : Promise.resolve()
)
  .then(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthedApp />
        </AuthProvider>
      </QueryClientProvider>,
    );
  })
  .catch(console.error);
