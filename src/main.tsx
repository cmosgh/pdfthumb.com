import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { dbHelpers } from "./db";
import { queryClient } from "./queryClient";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Initialize database with mock data before rendering
dbHelpers
  .initializeWithMockData()
  .then(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {process.env.NODE_ENV === "development" && (
          <TanStackRouterDevtools router={router} />
        )}
      </QueryClientProvider>,
    );
  })
  .catch(console.error);
