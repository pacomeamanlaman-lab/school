"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Download, Edit, Clock } from "lucide-react";
import { exportScheduleToPDF } from "@/utils/pdfExport";
import {
  DAY_NAMES,
  DEFAULT_TIMETABLE_TECH_CONFIG,
  generateTimeSlots,
  getDisabledSlotIdsByDay,
  type TimetableTechConfig,
} from "@/lib/timetable-tech-config";
import FlashNotice from "@/components/FlashNotice";
import { useFlashNotice } from "@/hooks/useFlashNotice";
import { createClient } from "@/lib/supabase/client";
import { fetchTimetableTechConfig } from "@/lib/supabase/etablissement-settings";
import { buildTimetableGridFromRows, type TimetableGrid } from "@/lib/timetable-db-map";

const matiereColors: Record<string, string> = {
  Français: "bg-blue-100 text-blue-700 border-blue-300",
  Mathématiques: "bg-purple-100 text-purple-700 border-purple-300",
  Sciences: "bg-green-100 text-green-700 border-green-300",
  "Histoire-Géographie": "bg-orange-100 text-orange-700 border-orange-300",
  "Histoire-Géo": "bg-orange-100 text-orange-700 border-orange-300",
  Anglais: "bg-pink-100 text-pink-700 border-pink-300",
  EPS: "bg-red-100 text-red-700 border-red-300",
  "Arts plastiques": "bg-yellow-100 text-yellow-700 border-yellow-300",
  Musique: "bg-indigo-100 text-indigo-700 border-indigo-300",
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

type ClasseOption = { id: string; name: string };

export default function EmploisDuTempsPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClasseOption[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState("");
  const [techConfig, setTechConfig] = useState<TimetableTechConfig>(DEFAULT_TIMETABLE_TECH_CONFIG);
  const [emploiDuTemps, setEmploiDuTemps] = useState<TimetableGrid>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notice, flash } = useFlashNotice();

  const selectedClassName = useMemo(
    () => classes.find((c) => c.id === selectedClasseId)?.name ?? "",
    [classes, selectedClasseId]
  );

  const jours = techConfig.activeDays.length > 0 ? techConfig.activeDays : [...DAY_NAMES];
  const creneaux = useMemo(() => generateTimeSlots(techConfig), [techConfig]);
  const disabledSlotsByDay = useMemo(() => getDisabledSlotIdsByDay(techConfig, creneaux), [techConfig, creneaux]);

  const loadClasses = useCallback(async () => {
    const supabase = createClient();
    const { data, error: e } = await supabase
      .from("classes")
      .select("id, name")
      .eq("status", "active")
      .order("niveau");
    if (e) throw e;
    const opts = (data ?? []).map((r) => ({ id: r.id as string, name: r.name as string }));
    setClasses(opts);
    setSelectedClasseId((prev) => prev || opts[0]?.id || "");
  }, []);

  const loadEdt = useCallback(
    async (classeId: string) => {
      if (!classeId) {
        setEmploiDuTemps({});
        return;
      }
      const supabase = createClient();
      const { data: rows, error: e1 } = await supabase
        .from("emplois_du_temps")
        .select(
          `
          jour, heure_debut, heure_fin, enseignant_id,
          matieres ( id, nom )
        `
        )
        .eq("classe_id", classeId);
      if (e1) throw e1;
      const uids = [...new Set((rows ?? []).map((r) => r.enseignant_id as string | null).filter(Boolean))] as string[];
      const profMap = new Map<string, string>();
      if (uids.length) {
        const { data: profs, error: e2 } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", uids);
        if (e2) throw e2;
        for (const p of profs ?? []) {
          profMap.set(p.id as string, `${p.first_name} ${p.last_name}`.trim());
        }
      }
      setEmploiDuTemps(buildTimetableGridFromRows(rows ?? [], creneaux, profMap));
    },
    [creneaux]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const cfg = await fetchTimetableTechConfig(supabase);
      if (!cancelled) setTechConfig(cfg);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadClasses();
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadClasses]);

  useEffect(() => {
    if (!selectedClasseId) return;
    let cancelled = false;
    (async () => {
      try {
        await loadEdt(selectedClasseId);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur EDT");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedClasseId, loadEdt]);

  const totalWeeklyHours = useMemo(() => {
    const totalMinutes = jours.reduce((acc, day) => {
      const dayMinutes = creneaux
        .filter((slot) => slot.type === "course" && !(disabledSlotsByDay[day] || []).includes(slot.id))
        .reduce((slotAcc, slot) => slotAcc + (toMinutes(slot.fin) - toMinutes(slot.debut)), 0);
      return acc + dayMinutes;
    }, 0);
    return `${(totalMinutes / 60).toFixed(1)}h`;
  }, [jours, creneaux, disabledSlotsByDay]);

  const recapMatieres = useMemo(() => {
    const minutesByMatiere = new Map<string, number>();
    for (const jour of jours) {
      const bySlot = emploiDuTemps[jour] ?? {};
      for (const slot of creneaux) {
        if (slot.type !== "course") continue;
        const c = bySlot[slot.id];
        if (!c?.matiere) continue;
        const mins = toMinutes(slot.fin) - toMinutes(slot.debut);
        minutesByMatiere.set(c.matiere, (minutesByMatiere.get(c.matiere) ?? 0) + mins);
      }
    }
    return [...minutesByMatiere.entries()]
      .map(([nom, min]) => ({ nom, heures: (min / 60).toFixed(1) }))
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [emploiDuTemps, jours, creneaux]);

  const distinctCounts = useMemo(() => {
    const matSet = new Set<string>();
    const profSet = new Set<string>();
    for (const jour of jours) {
      const bySlot = emploiDuTemps[jour] ?? {};
      for (const c of Object.values(bySlot)) {
        if (c.matiere) matSet.add(c.matiere);
        if (c.prof) profSet.add(c.prof);
      }
    }
    return { matieres: matSet.size, enseignants: profSet.size };
  }, [emploiDuTemps, jours]);

  const handleExport = async () => {
    try {
      await exportScheduleToPDF(selectedClassName || "Classe");
    } catch (e) {
      console.error(e);
      flash("Erreur export PDF.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <FlashNotice payload={notice} />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Emplois du temps</h1>
        <p className="text-muted-foreground">Lecture Supabase (emplois_du_temps) — horaires : Paramètres</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-foreground mb-2">
              Classe <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={selectedClasseId}
                onChange={(e) => setSelectedClasseId(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none"
              >
                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/emplois-du-temps/gestion")}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20"
          >
            <Edit className="w-4 h-4" />
            Gérer l&apos;emploi du temps
          </button>
          <button
            type="button"
            onClick={() => void handleExport()}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-sm"
          >
            <Download className="w-4 h-4" />
            Exporter en PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Heures/semaine (grille)</p>
          <p className="text-2xl font-bold text-foreground mt-1">{totalWeeklyHours}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Matières (cases)</p>
          <p className="text-2xl font-bold text-foreground mt-1">{distinctCounts.matieres}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Enseignants</p>
          <p className="text-2xl font-bold text-foreground mt-1">{distinctCounts.enseignants}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Salles</p>
          <p className="text-2xl font-bold text-muted-foreground mt-1">—</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Emploi du temps - {selectedClassName}</h3>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Créneaux techniques locaux</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table id="schedule-table" className="w-full min-w-max">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 text-sm font-semibold text-foreground min-w-[100px]">Horaires</th>
                {jours.map((jour) => (
                  <th key={jour} className="text-center px-4 py-3 text-sm font-semibold text-foreground min-w-[180px]">
                    {jour}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {creneaux.map((creneau) => (
                <tr key={creneau.id} className="border-b border-border">
                  <td className="px-4 py-2 bg-muted/30 font-mono text-sm text-foreground font-medium">
                    {creneau.debut} - {creneau.fin}
                  </td>
                  {jours.map((jour) => {
                    const cours = emploiDuTemps[jour]?.[creneau.id];
                    const isDisabled = disabledSlotsByDay[jour]?.includes(creneau.id);

                    return (
                      <td key={jour} className="px-2 py-2">
                        {isDisabled ? (
                          <div className="p-3 rounded-lg border-2 min-h-[72px] bg-muted/30 border-muted text-muted-foreground flex items-center justify-center text-xs font-medium">
                            Fermé (demi-journée)
                          </div>
                        ) : creneau.type !== "course" ? (
                          <div
                            className={`p-3 rounded-lg border-2 min-h-[72px] flex items-center justify-center text-xs font-semibold ${
                              creneau.type === "lunch"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-300"
                            }`}
                          >
                            {creneau.label}
                          </div>
                        ) : cours ? (
                          <div
                            className={`p-3 rounded-lg border-2 ${
                              matiereColors[cours.matiere] || "bg-gray-100 text-gray-700 border-gray-300"
                            } hover:shadow-md transition cursor-pointer`}
                          >
                            <p className="font-semibold text-sm">{cours.matiere}</p>
                            <p className="text-xs opacity-80 mt-1">{cours.prof}</p>
                            <p className="text-xs opacity-70 mt-0.5">{cours.salle}</p>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/30">
          <p className="text-sm font-medium text-foreground mb-3">Récapitulatif (heures saisies / semaine)</p>
          {recapMatieres.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun cours sur cette grille pour cette classe.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {recapMatieres.map((r) => (
                <div key={r.nom} className="p-3 bg-white border border-border rounded-lg">
                  <p className="text-sm font-medium text-foreground">{r.nom}</p>
                  <p className="text-lg font-bold text-primary mt-1">{r.heures} h</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
