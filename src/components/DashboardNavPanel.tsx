"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDashboardProfile } from "@/hooks/useDashboardProfile";
import { isActiveMenuHref, menuHrefSetForProfileRole } from "@/lib/dashboard-nav-policy";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  School,
  UserCog,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  CheckSquare,
  ClipboardList,
  FileText,
  Calendar,
  UsersRound,
  Coins,
  X,
  UserPlus,
} from "lucide-react";

type NavMenuItem = {
  title: string;
  icon: LucideIcon;
  href: string;
  /** Si true : visible uniquement pour `profiles.role === "super_admin"`. */
  superAdminOnly?: boolean;
};

const menuItems: NavMenuItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Élèves", icon: Users, href: "/dashboard/students" },
  { title: "Classes", icon: School, href: "/dashboard/classes" },
  { title: "Personnel", icon: UserCog, href: "/dashboard/staff" },
  { title: "Parents", icon: UsersRound, href: "/dashboard/parents" },
  { title: "Emplois du temps", icon: Calendar, href: "/dashboard/emplois-du-temps" },
  { title: "Absences", icon: CheckSquare, href: "/dashboard/absences" },
  { title: "Notes", icon: ClipboardList, href: "/dashboard/notes" },
  { title: "Bulletins", icon: FileText, href: "/dashboard/bulletins" },
  { title: "Comptabilité", icon: Coins, href: "/dashboard/comptabilite" },
  { title: "Utilisateurs", icon: UserPlus, href: "/dashboard/utilisateurs", superAdminOnly: true },
  { title: "Paramètres", icon: Settings, href: "/dashboard/settings" },
];

function roleShortLabelFr(role: string | null): string {
  if (!role) return "Utilisateur";
  const m: Record<string, string> = {
    super_admin: "Super admin",
    admin: "Administrateur",
    enseignant: "Enseignant",
    secretaire: "Secrétaire",
    comptable: "Comptable",
    surveillant: "Surveillant",
    parent: "Parent",
    eleve: "Élève",
  };
  return m[role] ?? role;
}

function userInitials(firstName: string, lastName: string, email: string): string {
  const a = firstName.trim()[0];
  const b = lastName.trim()[0];
  if (a && b) return `${a}${b}`.toUpperCase();
  const e = email.trim()[0];
  return e ? e.toUpperCase() : "?";
}

function displayName(firstName: string, lastName: string, email: string): string {
  const n = `${firstName} ${lastName}`.trim();
  return n || email || "Compte";
}

export type DashboardNavPanelVariant = "desktop-rail" | "drawer";

type DashboardNavPanelProps = {
  variant: DashboardNavPanelVariant;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCloseDrawer?: () => void;
};

export default function DashboardNavPanel({
  variant,
  collapsed,
  onToggleCollapse,
  onCloseDrawer,
}: DashboardNavPanelProps) {
  const pathname = usePathname();
  const { profile, loading } = useDashboardProfile();

  const visibleMenu = useMemo(() => {
    if (loading) return [...menuItems];
    const allowed = menuHrefSetForProfileRole(profile?.role ?? null);
    return menuItems.filter((item) => {
      if (item.superAdminOnly && profile?.role !== "super_admin") return false;
      return allowed.has(item.href);
    });
  }, [loading, profile?.role]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    onCloseDrawer?.();
    window.location.replace("/login");
  };

  const showLabels = variant === "drawer" ? true : !collapsed;
  const railCollapsed = variant === "desktop-rail" && collapsed;

  const initials = userInitials(
    profile?.firstName ?? "",
    profile?.lastName ?? "",
    profile?.email ?? ""
  );
  const nameLine = displayName(
    profile?.firstName ?? "",
    profile?.lastName ?? "",
    profile?.email ?? ""
  );
  const roleLine = roleShortLabelFr(profile?.role ?? null);

  return (
    <>
      <div
        className={`p-4 border-b border-border flex items-center gap-2 ${
          railCollapsed ? "flex-col justify-center" : "justify-between"
        }`}
      >
        <div
          className={`flex items-center gap-3 min-w-0 ${railCollapsed ? "flex-col justify-center" : "flex-1"}`}
        >
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          {showLabels && (
            <div className="min-w-0">
              <h2 className="font-bold text-foreground">School Manager</h2>
              <p className="text-xs text-muted-foreground">Gestion scolaire</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {variant === "drawer" && onCloseDrawer ? (
            <button
              type="button"
              onClick={onCloseDrawer}
              className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-foreground"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
          {variant === "desktop-rail" ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 hover:bg-accent rounded-lg transition text-muted-foreground flex-shrink-0"
              title={collapsed ? "Développer le menu" : "Réduire le menu"}
              aria-expanded={!collapsed}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 min-h-0 p-3 space-y-1 overflow-y-auto">
        {visibleMenu.map((item) => {
          const isActive = isActiveMenuHref(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onCloseDrawer?.()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition group ${
                isActive
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              } ${railCollapsed ? "justify-center" : ""}`}
              title={railCollapsed ? item.title : ""}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {showLabels ? <span className="font-medium">{item.title}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border flex-shrink-0">
        {variant === "desktop-rail" && railCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0"
              title={nameLine}
            >
              <span className="text-primary font-semibold text-sm">{loading ? "…" : initials}</span>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="p-2 text-danger hover:bg-danger/10 rounded-lg transition"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-3 py-2 bg-accent rounded-lg">
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-semibold text-sm">{loading ? "…" : initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{loading ? "Chargement…" : nameLine}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {loading ? "…" : `${roleLine} · ${profile?.email ?? ""}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="w-full flex items-center gap-3 px-3 py-2 text-danger hover:bg-danger/10 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
