import React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "../../hooks/AuthContext";
import { ChartBarIcon, Cog6ToothIcon } from "../icons";

export const DashboardSidebar: React.FC = () => {
  const location = useLocation();
  const { user, isRoleLoading } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN") ?? false;

  const navItems = [
    { path: "/dashboard/overview", label: "Overview", icon: ChartBarIcon },
    { path: "/dashboard/settings", label: "Settings", icon: Cog6ToothIcon },
  ];

  return (
    <aside className="w-64 bg-surface shadow-lg shadow-elevation h-full">
      <div className="p-6">
        <h2 className="text-xl font-bold text-fg mb-6">Dashboard</h2>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-selected text-accent-soft-fg"
                    : "text-fg-muted hover:bg-muted hover:text-fg-strong"
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          {/* Admin nav item — only visible to ADMIN role users */}
          {isRoleLoading ? (
            // Skeleton: same height as a nav item, animate-pulse per Tailwind convention
            <div className="h-9 bg-muted rounded-lg animate-pulse" />
          ) : isAdmin ? (
            <Link
              to="/dashboard/admin"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === "/dashboard/admin"
                  ? "bg-selected text-accent-soft-fg"
                  : "text-fg-muted hover:bg-muted hover:text-fg-strong"
              }`}
            >
              <Cog6ToothIcon className="mr-3 h-5 w-5" aria-hidden="true" />
              Admin
            </Link>
          ) : null}
        </nav>
      </div>
    </aside>
  );
};
