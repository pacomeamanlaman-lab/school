"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X, AlertTriangle, Copy, RotateCcw } from "lucide-react";
import {
  DAY_NAMES,
  DEFAULT_TIMETABLE_TECH_CONFIG,
  generateTimeSlots,
  getDisabledSlotIdsByDay,
  type TimetableTechConfig,
} from "@/lib/timetable-tech-config";
import FlashNotice from "@/components/FlashNotice";
import { useFlashNotice } from "@/hooks/useFlashNotice";
import { useDashboardProfile } from "@/hooks/useDashboardProfile";
import { canDashboardAction } from "@/lib/dashboard-action-policy";
import { createClient } from "@/lib/supabase/client";
import { fetchTimetableTechConfig } from "@/lib/supabase/etablissement-settings";
import { dayDbFromLabel } from "@/lib/supabase/day-map";
import { buildTimetableGridFromRows, type TimetableGrid, type TimetableGridCell } from "@/lib/timetable-db-map";

type ClasseOption = { id: string; name: string };
type MatiereOption = { id: string; nom: string };
type EnseignantOption = { id: string; label: string };

type EmploiDuTemps = TimetableGrid;

function cloneTimetable(timetable: EmploiDuTemps): EmploiDuTemps {
  const cloned: EmploiDuTemps = {};
  Object.entries(timetable).forEach(([day, daySlots]) => {
    cloned[day] = {};
    Object.entries(daySlots).forEach(([slotId, course]) => {
      cloned[day][Number(slotId)] = { ...course };
    });
  });
  return cloned;
}

export default function GestionEmploisDuTempsPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClasseOption[]>([]);
  const [matieres, setMatieres] = useState<MatiereOption[]>([]);
  const [enseignants, setEnseignants] = useState<EnseignantOption[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState("");
  const [techConfig, setTechConfig] = useState<TimetableTechConfig>(DEFAULT_TIMETABLE_TECH_CONFIG);
  const [emploiDuTemps, setEmploiDuTemps] = useState<EmploiDuTemps>({});
  const [selectedSlot, setSelectedSlot] = useState<{ jour: string; creneau: number } | null>(null);
  const [formData, setFormData] = useState({ matiereId: "", enseignantId: "", salle: "" });
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [copySourceDay, setCopySourceDay] = useState("Lundi");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notice, flash } = useFlashNotice();
  const { profile } = useDashboardProfile();
  const userRole = profile?.role ?? null;
  const canEdtWrite = canDashboardAction(userRole, "edtWrite");

  const selectedClassName = useMemo(
    () => classes.find((c) => c.id === selectedClasseId)?.name ?? "",
    [classes, selectedClasseId]
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

  const jours = techConfig.activeDays.length > 0 ? techConfig.activeDays : [...DAY_NAMES];
  const creneaux = useMemo(() => generateTimeSlots(techConfig), [techConfig]);
  const disabledSlotsByDay = useMemo(() => getDisabledSlotIdsByDay(techConfig, creneaux), [techConfig, creneaux]);

  const isSlotDisabled = (day: string, slotId: number): boolean => disabledSlotsByDay[day]?.includes(slotId) ?? false;

  const loadMeta = useCallback(async () => {
    const supabase = createClient();
    const [{ data: cl, error: e1 }, { data: mat, error: e2 }, { data: profs, error: e3 }] = await Promise.all([
      supabase.from("classes").select("id, name").eq("status", "active").order("niveau"),
      supabase.from("matieres").select("id, nom").order("nom"),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .in("role", ["enseignant", "admin", "super_admin"])
        .eq("status", "active"),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;
    if (e3) throw e3;
    setClasses((cl ?? []).map((r) => ({ id: r.id as string, name: r.name as string })));
    setMatieres((mat ?? []).map((r) => ({ id: r.id as string, nom: r.nom as string })));
    setEnseignants(
      (profs ?? []).map((p) => ({
        id: p.id as string,
        label: `${p.first_name} ${p.last_name}`.trim(),
      }))
    );
    setSelectedClasseId((prev) => prev || (cl ?? [])[0]?.id || "");
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
        const { data: plist, error: e2 } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", uids);
        if (e2) throw e2;
        for (const p of plist ?? []) {
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
      setLoading(true);
      setError(null);
      try {
        await loadMeta();
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMeta]);

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

  useEffect(() => {
    if (!jours.some((j) => j === copySourceDay)) {
      setCopySourceDay(jours[0] ?? "Lundi");
    }
  }, [copySourceDay, jours]);

  useEffect(() => {
    if (!canEdtWrite) setSelectedSlot(null);
  }, [canEdtWrite]);

  const matiereNom = (id: string) => matieres.find((m) => m.id === id)?.nom ?? "";
  const enseignantLabel = (id: string) => enseignants.find((e) => e.id === id)?.label ?? "";

  const handleSlotClick = (jour: string, creneauId: number) => {
    if (!canEdtWrite) return;
    const currentSlot = creneaux.find((slot) => slot.id === creneauId);
    if (!currentSlot || currentSlot.type !== "course" || isSlotDisabled(jour, creneauId)) {
      return;
    }

    const existingCours = emploiDuTemps[jour]?.[creneauId];
    setSelectedSlot({ jour, creneau: creneauId });
    if (existingCours) {
      setFormData({
        matiereId: existingCours.matiereId,
        enseignantId: existingCours.enseignantId,
        salle: existingCours.salle === "—" ? "" : existingCours.salle,
      });
    } else {
      setFormData({ matiereId: "", enseignantId: "", salle: "" });
    }
    setConflicts([]);
  };

  const checkConflicts = (): string[] => [];

  const handleSaveCours = () => {
    if (!canEdtWrite) return;
    if (!selectedSlot || !formData.matiereId || !formData.enseignantId) {
      flash("Veuillez sélectionner une matière et un enseignant.", "error");
      return;
    }
    const detectedConflicts = checkConflicts();
    if (detectedConflicts.length > 0) {
      setConflicts(detectedConflicts);
      return;
    }
    const salle = formData.salle.trim() || "—";
    const cell: TimetableGridCell = {
      matiere: matiereNom(formData.matiereId),
      prof: enseignantLabel(formData.enseignantId),
      salle,
      matiereId: formData.matiereId,
      enseignantId: formData.enseignantId,
    };
    setEmploiDuTemps({
      ...emploiDuTemps,
      [selectedSlot.jour]: {
        ...emploiDuTemps[selectedSlot.jour],
        [selectedSlot.creneau]: cell,
      },
    });
    setSelectedSlot(null);
    setFormData({ matiereId: "", enseignantId: "", salle: "" });
  };

  const handleDeleteCours = () => {
    if (!canEdtWrite || !selectedSlot) return;
    const newEmploiDuTemps = { ...emploiDuTemps };
    if (newEmploiDuTemps[selectedSlot.jour]) {
      const copy = { ...newEmploiDuTemps[selectedSlot.jour] };
      delete copy[selectedSlot.creneau];
      newEmploiDuTemps[selectedSlot.jour] = copy;
    }
    setEmploiDuTemps(newEmploiDuTemps);
    setSelectedSlot(null);
    setFormData({ matiereId: "", enseignantId: "", salle: "" });
  };

  const handleSaveEmploiDuTemps = async () => {
    if (!canEdtWrite) {
      flash("Modification de l’emploi du temps non autorisée pour votre rôle.", "error");
      return;
    }
    if (!selectedClasseId) return;
    const supabase = createClient();
    setSaving(true);
    setError(null);
    try {
      const { error: delE } = await supabase.from("emplois_du_temps").delete().eq("classe_id", selectedClasseId);
      if (delE) throw delE;

      const rows: {
        classe_id: string;
        matiere_id: string;
        enseignant_id: string;
        jour: string;
        heure_debut: string;
        heure_fin: string;
      }[] = [];

      for (const jour of jours) {
        const jourDb = dayDbFromLabel(jour);
        const dayMap = emploiDuTemps[jour] ?? {};
        for (const [slotIdStr, cours] of Object.entries(dayMap)) {
          const slotId = Number(slotIdStr);
          const slot = creneaux.find((s) => s.id === slotId);
          if (!slot || slot.type !== "course" || !cours.matiereId || !cours.enseignantId) continue;
          rows.push({
            classe_id: selectedClasseId,
            matiere_id: cours.matiereId,
            enseignant_id: cours.enseignantId,
            jour: jourDb,
            heure_debut: slot.debut,
            heure_fin: slot.fin,
          });
        }
      }

      if (rows.length) {
        const { error: insE } = await supabase.from("emplois_du_temps").insert(rows);
        if (insE) throw insE;
      }
      await loadEdt(selectedClasseId);
      flash("Emploi du temps enregistré.", "success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleReloadFromServer = () => {
    if (selectedClasseId) void loadEdt(selectedClasseId);
  };

  const handleResetGrid = () => {
    if (!canEdtWrite) return;
    setEmploiDuTemps({});
    setSelectedSlot(null);
    setConflicts([]);
  };

  const handleCopyDayToWeek = () => {
    if (!canEdtWrite) return;
    setEmploiDuTemps((prev) => {
      const source = prev[copySourceDay] ?? {};
      const next = cloneTimetable(prev);
      jours.forEach((day) => {
        if (day === copySourceDay) return;
        const copiedDay: Record<number, TimetableGridCell> = {};
        Object.entries(source).forEach(([slotIdRaw, course]) => {
          const slotId = Number(slotIdRaw);
          const slot = creneaux.find((s) => s.id === slotId);
          if (!slot || slot.type !== "course" || isSlotDisabled(day, slotId)) return;
          copiedDay[slotId] = { ...course };
        });
        next[day] = copiedDay;
      });
      return next;
    });
  };

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

  return (
    <div className="space-y-6">
      <FlashNotice payload={notice} />
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => router.back()} className="p-2 hover:bg-accent rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Gestion des emplois du temps</h1>
          <p className="text-muted-foreground">Édition de la grille hebdomadaire</p>
        </div>
        <button
          type="button"
          disabled={!canEdtWrite || saving || !selectedClasseId}
          title={!canEdtWrite ? "Modification réservée aux rôles autorisés" : undefined}
          onClick={() => void handleSaveEmploiDuTemps()}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20"
        >
          <Save className="w-4 h-4" />
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Classe <span className="text-danger">*</span>
            </label>
            <select
              value={selectedClasseId}
              onChange={(e) => setSelectedClasseId(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none"
            >
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>
                  {classe.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Copier une journée</label>
            <div className="flex items-center gap-2">
              <select
                value={copySourceDay}
                onChange={(e) => setCopySourceDay(e.target.value)}
                disabled={!canEdtWrite}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {jours.map((jour) => (
                  <option key={jour} value={jour}>
                    {jour}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!canEdtWrite}
                onClick={handleCopyDayToWeek}
                className="inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 bg-background border border-input hover:bg-accent rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Copy className="w-4 h-4" />
                Copier
              </button>
            </div>
          </div>

          <div className="flex items-end gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleReloadFromServer}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-background border border-input hover:bg-accent rounded-lg transition font-medium"
            >
              Recharger
            </button>
            <button
              type="button"
              disabled={!canEdtWrite}
              onClick={handleResetGrid}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              Vider la grille
            </button>
          </div>
        </div>
      </div>

      <div className="bg-info/10 border border-info/20 rounded-xl p-4">
        <p className="text-sm font-medium text-foreground">Créneaux</p>
        <p className="text-xs text-muted-foreground mt-1">
          Les horaires des cases suivent la configuration dans Paramètres. La salle reste indicative sur cette vue.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Emploi du temps - {selectedClassName}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
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
                    const isDisabled = isSlotDisabled(jour, creneau.id);

                    return (
                      <td key={jour} className="px-2 py-2">
                        {isDisabled ? (
                          <div className="p-3 rounded-lg border-2 min-h-[80px] bg-muted/30 border-muted text-muted-foreground flex items-center justify-center text-xs font-medium">
                            Fermé (demi-journée)
                          </div>
                        ) : creneau.type !== "course" ? (
                          <div
                            className={`p-3 rounded-lg border-2 min-h-[80px] flex items-center justify-center text-xs font-semibold ${
                              creneau.type === "lunch"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-300"
                            }`}
                          >
                            {creneau.label}
                          </div>
                        ) : (
                          <div
                            role={canEdtWrite ? "button" : undefined}
                            tabIndex={canEdtWrite ? 0 : undefined}
                            onKeyDown={(e) => {
                              if (!canEdtWrite) return;
                              if (e.key === "Enter" || e.key === " ") handleSlotClick(jour, creneau.id);
                            }}
                            onClick={() => {
                              if (canEdtWrite) handleSlotClick(jour, creneau.id);
                            }}
                            className={`p-3 rounded-lg border-2 transition min-h-[80px] ${
                              canEdtWrite ? "cursor-pointer" : "cursor-default opacity-90"
                            } ${
                              cours
                                ? `${matiereColors[cours.matiere] || "bg-gray-100 border-gray-300"} ${canEdtWrite ? "hover:shadow-md" : ""}`
                                : `border-dashed border-muted-foreground/30 ${canEdtWrite ? "hover:border-primary hover:bg-primary/5" : ""}`
                            }`}
                          >
                            {cours ? (
                              <>
                                <p className="font-semibold text-sm">{cours.matiere}</p>
                                <p className="text-xs opacity-80 mt-1">{cours.prof}</p>
                                <p className="text-xs opacity-70 mt-0.5">{cours.salle}</p>
                              </>
                            ) : (
                              <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                                {canEdtWrite ? "+ Ajouter cours" : "—"}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedSlot(null)} aria-hidden />
          <div className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground min-w-0 pr-2">
                {emploiDuTemps[selectedSlot.jour]?.[selectedSlot.creneau] ? "Modifier" : "Ajouter"} un cours
              </h3>
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="self-end p-2 hover:bg-accent rounded-lg transition sm:self-auto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-foreground">
                  {selectedSlot.jour} • {creneaux.find((c) => c.id === selectedSlot.creneau)?.debut} -{" "}
                  {creneaux.find((c) => c.id === selectedSlot.creneau)?.fin}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Matière <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.matiereId}
                  onChange={(e) => setFormData({ ...formData, matiereId: e.target.value })}
                  disabled={!canEdtWrite}
                  className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Sélectionner une matière</option>
                  {matieres.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Enseignant <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.enseignantId}
                  onChange={(e) => setFormData({ ...formData, enseignantId: e.target.value })}
                  disabled={!canEdtWrite}
                  className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Sélectionner un enseignant</option>
                  {enseignants.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Salle (affichage)</label>
                <input
                  type="text"
                  value={formData.salle}
                  onChange={(e) => setFormData({ ...formData, salle: e.target.value })}
                  disabled={!canEdtWrite}
                  className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Salle 101"
                />
              </div>

              {conflicts.length > 0 && (
                <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-danger">Conflits détectés :</p>
                      <ul className="text-xs text-danger mt-1 space-y-1">
                        {conflicts.map((conflict, i) => (
                          <li key={i}>• {conflict}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 mt-6 pt-6 border-t border-border">
              {emploiDuTemps[selectedSlot.jour]?.[selectedSlot.creneau] && canEdtWrite && (
                <button
                  type="button"
                  onClick={handleDeleteCours}
                  className="px-4 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition font-medium"
                >
                  Supprimer
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="px-4 py-2 bg-background border border-input hover:bg-accent rounded-lg transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={!canEdtWrite}
                  onClick={handleSaveCours}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {emploiDuTemps[selectedSlot.jour]?.[selectedSlot.creneau] ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
