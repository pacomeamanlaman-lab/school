"use client";

import type { ReactNode } from "react";
import { DashboardShellProvider, useDashboardShell } from "@/contexts/DashboardShellContext";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileNavDrawer from "@/components/MobileNavDrawer";

function DashboardMain({ children }: { children: ReactNode }) {
  const { sidebarCollapsed } = useDashboardShell();
  const mainMargin = sidebarCollapsed ? "lg:ml-20" : "lg:ml-64";

  return (
    <div className={`flex-1 flex flex-col min-w-0 ml-0 ${mainMargin} transition-[margin] duration-300`}>
      <Topbar />
      <main className="flex-1 p-4 sm:p-6 bg-background">{children}</main>
    </div>
  );
}

export default function DashboardLayoutClient({ children }: { children: ReactNode }) {
  return (
    <DashboardShellProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <MobileNavDrawer />
        <DashboardMain>{children}</DashboardMain>
      </div>
    </DashboardShellProvider>
  );
}
