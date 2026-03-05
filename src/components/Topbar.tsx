"use client";

import { Bell, Search } from "lucide-react";

export default function Topbar() {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-5">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Rechercher un élève, une classe..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition text-sm"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 ml-4">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-accent rounded-lg transition">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
        </button>

        {/* Date */}
        <div className="hidden md:block text-sm text-muted-foreground border-l border-border pl-4 ml-1">
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
