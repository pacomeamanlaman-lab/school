"use client";

import { useEffect } from "react";
import DashboardNavPanel from "@/components/DashboardNavPanel";
import { useDashboardShell } from "@/contexts/DashboardShellContext";

export default function MobileNavDrawer() {
  const { mobileNavOpen, closeMobileNav } = useDashboardShell();

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileNav();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen, closeMobileNav]);

  if (!mobileNavOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu de navigation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Fermer le menu"
        onClick={closeMobileNav}
      />
      <div className="absolute left-0 top-0 bottom-0 w-[min(20rem,88vw)] max-w-full bg-card border-r border-border shadow-xl flex flex-col">
        <DashboardNavPanel
          variant="drawer"
          collapsed={false}
          onToggleCollapse={() => {}}
          onCloseDrawer={closeMobileNav}
        />
      </div>
    </div>
  );
}
