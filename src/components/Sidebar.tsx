"use client";

import DashboardNavPanel from "@/components/DashboardNavPanel";
import { useDashboardShell } from "@/contexts/DashboardShellContext";

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebarCollapsed } = useDashboardShell();

  return (
    <aside
      className={`${
        sidebarCollapsed ? "w-20" : "w-64"
      } bg-card border-r border-border h-screen hidden lg:flex flex-col transition-all duration-300 fixed left-0 top-0 z-30`}
    >
      <DashboardNavPanel
        variant="desktop-rail"
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />
    </aside>
  );
}
