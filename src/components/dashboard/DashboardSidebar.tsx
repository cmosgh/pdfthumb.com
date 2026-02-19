import React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "../../hooks/AuthContext";

export const DashboardSidebar: React.FC = () => {
  const location = useLocation();
  const { user, isRoleLoading } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN') ?? false;

  const navItems = [
    { path: "/dashboard/overview", label: "Overview", icon: "📊" },
    { path: "/dashboard/analytics", label: "Analytics", icon: "📈" },
    { path: "/dashboard/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-700 h-full">
      <div className="p-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">
          Dashboard
        </h2>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
          {/* Admin nav item — only visible to ADMIN role users */}
          {isRoleLoading ? (
            // Skeleton: same height as a nav item, animate-pulse per Tailwind convention
            <div className="h-9 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
          ) : isAdmin ? (
            <Link
              to="/dashboard/admin"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === '/dashboard/admin'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <span className="mr-3">⚙</span>
              Admin
            </Link>
          ) : null}
        </nav>
      </div>
    </aside>
  );
};
