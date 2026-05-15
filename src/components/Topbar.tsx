"use client";

import { Bell, Menu, Search } from "lucide-react";
import { useDashboardShell } from "@/contexts/DashboardShellContext";

export default function Topbar() {
  const { setMobileNavOpen } = useDashboardShell();

  return (
    <header className="h-14 sm:h-16 bg-card border-b border-border flex items-center gap-2 sm:gap-3 px-3 sm:px-6 sticky top-0 z-20 min-w-0">
      <button
        type="button"
        className="lg:hidden shrink-0 p-2 -ml-1 rounded-lg hover:bg-accent text-foreground border border-border"
        aria-label="Ouvrir le menu"
        onClick={() => setMobileNavOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0 max-w-xl">
        <div className="relative">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Rechercher…"
            className="w-full pl-9 sm:pl-10 pr-3 py-2 text-sm bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button type="button" className="relative p-2 hover:bg-accent rounded-lg transition" aria-label="Notifications">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        </button>

        <div className="hidden md:block text-sm text-muted-foreground border-l border-border pl-3 sm:pl-4 ml-0.5 whitespace-nowrap">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
    </header>
  );
}
