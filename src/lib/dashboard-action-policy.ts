/**
 * Droits d’action UI (complément du menu filtré par rôle).
 * `role` null / vide : tout autorisé (comportement dev, aligné sur le menu).
 * Rôle inconnu : tout refusé sauf lecture générale gérée page par page.
 */

export type DashboardAction =
  | "studentCreate"
  | "studentWrite"
  | "studentExportExcel"
  | "classeWrite"
  | "staffWrite"
  | "parentWrite"
  | "parentWhatsApp"
  | "paiementCreate"
  | "notesWrite"
  | "notesExport"
  | "absencesWrite"
  | "absencesExport"
  | "edtWrite"
  | "bulletinPdfExcel"
  | "bulletinParentNotify";

const A = {
  super: "super_admin",
  adm: "admin",
  ens: "enseignant",
  sec: "secretaire",
  com: "comptable",
  sur: "surveillant",
} as const;

const MATRIX: Record<DashboardAction, readonly string[]> = {
  studentCreate: [A.super, A.adm, A.sec],
  studentWrite: [A.super, A.adm, A.sec],
  studentExportExcel: [A.super, A.adm, A.sec, A.com, A.ens, A.sur],
  classeWrite: [A.super, A.adm, A.sec],
  staffWrite: [A.super, A.adm, A.sec],
  parentWrite: [A.super, A.adm, A.sec],
  parentWhatsApp: [A.super, A.adm, A.sec, A.ens, A.com, A.sur],
  paiementCreate: [A.super, A.adm, A.com, A.sec],
  notesWrite: [A.super, A.adm, A.ens],
  notesExport: [A.super, A.adm, A.ens],
  absencesWrite: [A.super, A.adm, A.ens, A.sur, A.sec],
  absencesExport: [A.super, A.adm, A.ens, A.sur, A.sec, A.com],
  edtWrite: [A.super, A.adm, A.ens, A.sec],
  bulletinPdfExcel: [A.super, A.adm, A.ens, A.sec, A.com],
  bulletinParentNotify: [A.super, A.adm, A.ens, A.sec],
};

export function canDashboardAction(role: string | null | undefined, action: DashboardAction): boolean {
  if (role == null || role === "") return true;
  const allowed = MATRIX[action];
  return allowed.includes(role);
}
