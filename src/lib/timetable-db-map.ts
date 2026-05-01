import type { GeneratedTimeSlot } from "@/lib/timetable-tech-config";
import { dayLabelFromDb } from "@/lib/supabase/day-map";
import { embedOne } from "@/lib/supabase/embed";

export type TimetableGridCell = {
  matiere: string;
  prof: string;
  salle: string;
  matiereId: string;
  enseignantId: string;
};
/** Jour libellé UI (Lundi, …) → id créneau → cours */
export type TimetableGrid = Record<string, Record<number, TimetableGridCell>>;

function cleanHhmm(t: string): string {
  return t.slice(0, 5);
}

/** Trouve le créneau « cours » dont les bornes correspondent aux heures en base. */
export function findCourseSlotIdForTimeRange(
  creneaux: GeneratedTimeSlot[],
  heureDebut: string,
  heureFin: string
): number | null {
  const hd = cleanHhmm(heureDebut);
  const hf = cleanHhmm(heureFin);
  for (const c of creneaux) {
    if (c.type !== "course") continue;
    if (cleanHhmm(c.debut) === hd && cleanHhmm(c.fin) === hf) return c.id;
  }
  for (const c of creneaux) {
    if (c.type === "course" && cleanHhmm(c.debut) === hd) return c.id;
  }
  return null;
}

type EdtRow = {
  jour: string;
  heure_debut: string;
  heure_fin: string;
  matieres?: unknown;
  enseignant_id?: string | null;
};

/** Construit la grille UI à partir des lignes `emplois_du_temps` + noms profs. */
export function buildTimetableGridFromRows(
  rows: EdtRow[],
  creneaux: GeneratedTimeSlot[],
  profNamesByUserId: Map<string, string>
): TimetableGrid {
  const grid: TimetableGrid = {};
  for (const r of rows) {
    const dayLabel = dayLabelFromDb(String(r.jour));
    const slotId = findCourseSlotIdForTimeRange(creneaux, String(r.heure_debut), String(r.heure_fin));
    if (slotId == null) continue;
    const m = embedOne<{ id: string; nom: string }>(r.matieres);
    const mid = m?.id ?? "";
    const uid = (r.enseignant_id as string) ?? "";
    const prof = uid ? profNamesByUserId.get(uid) ?? "—" : "—";
    if (!grid[dayLabel]) grid[dayLabel] = {};
    grid[dayLabel][slotId] = {
      matiere: m?.nom ?? "—",
      prof,
      salle: "—",
      matiereId: mid,
      enseignantId: uid,
    };
  }
  return grid;
}
