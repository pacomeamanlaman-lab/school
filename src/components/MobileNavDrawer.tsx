"use client";

import { useEffect, useRef, useState } from "react";
import DashboardNavPanel from "@/components/DashboardNavPanel";
import { useDashboardShell } from "@/contexts/DashboardShellContext";

const PANEL_MS = 280;

export default function MobileNavDrawer() {
  const { mobileNavOpen, closeMobileNav } = useDashboardShell();
  const mobileNavOpenRef = useRef(mobileNavOpen);
  mobileNavOpenRef.current = mobileNavOpen;
  const panelRef = useRef<HTMLDivElement>(null);

  /** Garde le drawer monté le temps de l’animation de sortie */
  const [shouldRender, setShouldRender] = useState(false);
  /** État visuel après paint (entrée / sortie) */
  const [paintOpen, setPaintOpen] = useState(false);

  useEffect(() => {
    if (mobileNavOpen) {
      setShouldRender(true);
      setPaintOpen(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setPaintOpen(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setPaintOpen(false);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (mobileNavOpen || !shouldRender || paintOpen) return;

    const panel = panelRef.current;

    const finishClose = () => {
      if (mobileNavOpenRef.current) return;
      setShouldRender(false);
    };

    const t = window.setTimeout(finishClose, PANEL_MS + 40);

    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target !== panel || e.propertyName !== "transform") return;
      window.clearTimeout(t);
      finishClose();
    };

    panel?.addEventListener("transitionend", onTransitionEnd);
    return () => {
      window.clearTimeout(t);
      panel?.removeEventListener("transitionend", onTransitionEnd);
    };
  }, [mobileNavOpen, shouldRender, paintOpen]);

  useEffect(() => {
    if (!shouldRender) return;
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
  }, [shouldRender, closeMobileNav]);

  if (!shouldRender) return null;

  return (
    <div
      className="fixed inset-0 z-40 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navigation"
      aria-hidden={!paintOpen}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          paintOpen ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Fermer le menu"
        onClick={closeMobileNav}
      />
      <div
        ref={panelRef}
        data-open={paintOpen ? "true" : "false"}
        className="mobile-nav-drawer-panel absolute left-0 top-0 bottom-0 z-10 w-[min(20rem,88vw)] max-w-full bg-card border-r border-border shadow-2xl flex flex-col"
      >
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
