/**
 * Entrées du menu latéral dashboard (chemins exacts des liens principaux).
 * Parent / élève : hors périmètre pour l’instant — accès minimal ci-dessous.
 */

export const DASHBOARD_MENU_HREFS = [
  "/dashboard",
  "/dashboard/students",
  "/dashboard/classes",
  "/dashboard/staff",
  "/dashboard/parents",
  "/dashboard/emplois-du-temps",
  "/dashboard/absences",
  "/dashboard/notes",
  "/dashboard/bulletins",
  "/dashboard/comptabilite",
  "/dashboard/utilisateurs",
  "/dashboard/settings",
] as const;

export type DashboardMenuHref = (typeof DASHBOARD_MENU_HREFS)[number];

const ALL = new Set<string>(DASHBOARD_MENU_HREFS);

/**
 * Rôles `profiles.role` couverts par le menu staff.
 * `null` / inconnu : tout le menu (évite de bloquer un compte mal typé en dev).
 */
export function menuHrefSetForProfileRole(role: string | null | undefined): ReadonlySet<string> {
  if (role == null || role === "") return ALL;

  switch (role) {
    case "super_admin":
      return ALL;

    case "admin":
      return new Set(
        DASHBOARD_MENU_HREFS.filter((h) => h !== "/dashboard/utilisateurs")
      );

    case "enseignant":
      return new Set<string>([
        "/dashboard",
        "/dashboard/students",
        "/dashboard/classes",
        "/dashboard/emplois-du-temps",
        "/dashboard/absences",
        "/dashboard/notes",
        "/dashboard/bulletins",
      ]);

    case "secretaire":
      return new Set<string>([
        "/dashboard",
        "/dashboard/students",
        "/dashboard/classes",
        "/dashboard/staff",
        "/dashboard/parents",
        "/dashboard/emplois-du-temps",
        "/dashboard/absences",
        "/dashboard/notes",
        "/dashboard/bulletins",
      ]);

    case "comptable":
      return new Set<string>([
        "/dashboard",
        "/dashboard/students",
        "/dashboard/classes",
        "/dashboard/parents",
        "/dashboard/bulletins",
        "/dashboard/comptabilite",
      ]);

    case "surveillant":
      return new Set<string>([
        "/dashboard",
        "/dashboard/students",
        "/dashboard/classes",
        "/dashboard/parents",
        "/dashboard/emplois-du-temps",
        "/dashboard/absences",
      ]);

    case "parent":
    case "eleve":
      return new Set<string>(["/dashboard"]);

    default:
      return ALL;
  }
}

/** Activer le lien courant y compris sous-routes (ex. /dashboard/settings/…). */
export function isActiveMenuHref(pathname: string, menuHref: string): boolean {
  if (menuHref === "/dashboard") return pathname === "/dashboard";
  return pathname === menuHref || pathname.startsWith(`${menuHref}/`);
}
