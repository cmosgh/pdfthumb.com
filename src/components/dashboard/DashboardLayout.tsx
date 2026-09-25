import React, { useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { cx, Heading, IconButton, MenuIcon, Surface } from "@/components/ui";

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
    <Surface tone="hero" className="flex h-screen">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <Surface
          tone="overlay"
          className="fixed inset-0 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={cx(
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out",
        )}
      >
        <DashboardSidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-0">
        {/* Mobile header */}
        <Surface
          tone="bar"
          className="md:hidden p-4 flex items-center justify-between"
        >
          <IconButton
            variant="square"
            onClick={toggleSidebar}
            data-testid="sidebar-toggle"
            aria-label="Open sidebar"
          >
            <MenuIcon className="h-6 w-6" />
          </IconButton>
          <Heading as="h1" size="xl" weight="semibold" tone="fg">
            Dashboard
          </Heading>
        </Surface>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </Surface>
  );
};
