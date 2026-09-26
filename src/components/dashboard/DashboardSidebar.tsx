import React from "react";
import { useLocation } from "@tanstack/react-router";
import { useAuth } from "../../hooks/AuthContext";
import { ChartBarIcon, Cog6ToothIcon } from "../icons";
import { Heading, NavSkeleton, RouterNavItem, Surface } from "@/components/ui";

export const DashboardSidebar: React.FC = () => {
  const location = useLocation();
  const { user, isRoleLoading } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN") ?? false;

  const navItems = [
    { path: "/dashboard/overview", label: "Overview", icon: ChartBarIcon },
    { path: "/dashboard/settings", label: "Settings", icon: Cog6ToothIcon },
  ];

  return (
    <Surface as="aside" tone="sidebar" className="w-64 h-full">
      <div className="p-6">
        <Heading as="h2" size="xl" weight="bold" tone="fg" className="mb-6">
          Dashboard
        </Heading>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <RouterNavItem
              key={item.path}
              to={item.path}
              active={location.pathname === item.path}
            >
              <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
              {item.label}
            </RouterNavItem>
          ))}
          {/* Admin nav item — only visible to ADMIN role users */}
          {isRoleLoading ? (
            // Skeleton: same height as a nav item
            <NavSkeleton />
          ) : isAdmin ? (
            <RouterNavItem
              to="/dashboard/admin"
              active={location.pathname === "/dashboard/admin"}
            >
              <Cog6ToothIcon className="mr-3 h-5 w-5" aria-hidden="true" />
              Admin
            </RouterNavItem>
          ) : null}
        </nav>
      </div>
    </Surface>
  );
};
