import React, { useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-hero-start to-hero-end">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-overlay md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out`}
      >
        <DashboardSidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-0">
        {/* Mobile header */}
        <div className="md:hidden bg-surface shadow-sm shadow-elevation p-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-fg-muted hover:text-link hover:bg-muted"
            data-testid="sidebar-toggle"
            aria-label="Open sidebar"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-fg">Dashboard</h1>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
