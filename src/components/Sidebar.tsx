"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  School,
  UserCog,
  Settings,
  LogOut,
  ChevronLeft,
  GraduationCap,
  CheckSquare,
  ClipboardList,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Élèves",
    icon: Users,
    href: "/dashboard/students",
  },
  {
    title: "Classes",
    icon: School,
    href: "/dashboard/classes",
  },
  {
    title: "Personnel",
    icon: UserCog,
    href: "/dashboard/staff",
  },
  {
    title: "Absences",
    icon: CheckSquare,
    href: "/dashboard/absences",
  },
  {
    title: "Notes",
    icon: ClipboardList,
    href: "/dashboard/notes",
  },
  {
    title: "Paramètres",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-card border-r border-border h-screen flex flex-col transition-all duration-300 fixed left-0 top-0 z-10`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-foreground">School Manager</h2>
              <p className="text-xs text-muted-foreground">Gestion scolaire</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 hover:bg-accent rounded-lg transition text-muted-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition group ${
                isActive
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.title : ""}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-border">
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full p-2.5 hover:bg-accent rounded-lg transition text-muted-foreground flex items-center justify-center"
            title="Développer le menu"
          >
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-3 py-2 bg-accent rounded-lg">
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-semibold text-sm">AD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">Administrateur</p>
                <p className="text-xs text-muted-foreground truncate">admin@ecole.com</p>
              </div>
            </div>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-danger hover:bg-danger/10 rounded-lg transition">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
