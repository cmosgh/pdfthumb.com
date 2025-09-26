import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { dbHelpers } from "./db";
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
      <React.StrictMode>
        <RouterProvider router={router} />
        {process.env.NODE_ENV === "development" && (
          <TanStackRouterDevtools router={router} />
        )}
      </React.StrictMode>,
    );
  })
  .catch(console.error);
