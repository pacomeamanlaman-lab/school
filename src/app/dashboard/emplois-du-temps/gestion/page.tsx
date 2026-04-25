"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X, AlertTriangle, Copy, RotateCcw, WandSparkles } from "lucide-react";
import {
  DAY_NAMES,
  DEFAULT_TIMETABLE_TECH_CONFIG,
  generateTimeSlots,
  getDisabledSlotIdsByDay,
  loadTimetableTechConfigFromStorage,
  type TimetableTechConfig,
} from "@/lib/timetable-tech-config";

// Données de démonstration
const classesData = [
  { id: 1, name: "CP - Classe A", niveau: "CP" },
  { id: 2, name: "CE1 - Classe A", niveau: "CE1" },
  { id: 3, name: "CE2 - Classe A", niveau: "CE2" },
  { id: 4, name: "CM1 - Classe A", niveau: "CM1" },
  { id: 5, name: "CM2 - Classe A", niveau: "CM2" },
  { id: 6, name: "6ème - Classe A", niveau: "6ème" },
];

const matieres = [
  { id: 1, name: "Français" },
  { id: 2, name: "Mathématiques" },
  { id: 3, name: "Histoire-Géo" },
  { id: 4, name: "Sciences" },
  { id: 5, name: "Anglais" },
  { id: 6, name: "EPS" },
  { id: 7, name: "Arts plastiques" },
  { id: 8, name: "Musique" },
];

const enseignants = [
  { id: 1, name: "Mme Dupont", matieres: ["Français", "Mathématiques"] },
  { id: 2, name: "M. Martin", matieres: ["Histoire-Géo"] },
  { id: 3, name: "M. Bernard", matieres: ["Sciences"] },
  { id: 4, name: "Mme Sophie", matieres: ["Anglais"] },
  { id: 5, name: "M. Laurent", matieres: ["EPS"] },
  { id: 6, name: "Mme Claire", matieres: ["Arts plastiques"] },
  { id: 7, name: "M. Pierre", matieres: ["Musique"] },
];

const salles = [
  { id: 1, name: "Salle 101" },
  { id: 2, name: "Salle 102" },
  { id: 3, name: "Labo" },
  { id: 4, name: "Gymnase" },
  { id: 5, name: "Salle Arts" },
  { id: 6, name: "Salle Musique" },
];

interface Cours {
  matiere: string;
  prof: string;
  salle: string;
}

type EmploiDuTemps = Record<string, Record<number, Cours>>;

const DEMO_TIMETABLE_TEMPLATE: EmploiDuTemps = {
  Lundi: {
    1: { matiere: "Français", prof: "Mme Dupont", salle: "Salle 101" },
    2: { matiere: "Mathématiques", prof: "Mme Dupont", salle: "Salle 101" },
    4: { matiere: "Sciences", prof: "M. Bernard", salle: "Labo" },
    5: { matiere: "Anglais", prof: "Mme Sophie", salle: "Salle 101" },
    7: { matiere: "EPS", prof: "M. Laurent", salle: "Gymnase" },
    9: { matiere: "Français", prof: "Mme Dupont", salle: "Salle 101" },
  },
  Mardi: {
    1: { matiere: "Mathématiques", prof: "Mme Dupont", salle: "Salle 101" },
    2: { matiere: "Français", prof: "Mme Dupont", salle: "Salle 101" },
    4: { matiere: "Histoire-Géo", prof: "M. Martin", salle: "Salle 101" },
    5: { matiere: "Sciences", prof: "M. Bernard", salle: "Labo" },
    7: { matiere: "Arts plastiques", prof: "Mme Claire", salle: "Salle Arts" },
    9: { matiere: "Anglais", prof: "Mme Sophie", salle: "Salle 101" },
  },
  Mercredi: {
    1: { matiere: "Français", prof: "Mme Dupont", salle: "Salle 101" },
    2: { matiere: "Mathématiques", prof: "Mme Dupont", salle: "Salle 101" },
    4: { matiere: "Musique", prof: "M. Pierre", salle: "Salle Musique" },
    5: { matiere: "EPS", prof: "M. Laurent", salle: "Gymnase" },
  },
  Jeudi: {
    1: { matiere: "Sciences", prof: "M. Bernard", salle: "Labo" },
    2: { matiere: "Mathématiques", prof: "Mme Dupont", salle: "Salle 101" },
    4: { matiere: "Français", prof: "Mme Dupont", salle: "Salle 101" },
    5: { matiere: "Histoire-Géo", prof: "M. Martin", salle: "Salle 101" },
    7: { matiere: "Anglais", prof: "Mme Sophie", salle: "Salle 101" },
    9: { matiere: "EPS", prof: "M. Laurent", salle: "Gymnase" },
  },
  Vendredi: {
    1: { matiere: "Français", prof: "Mme Dupont", salle: "Salle 101" },
    2: { matiere: "Mathématiques", prof: "Mme Dupont", salle: "Salle 101" },
    4: { matiere: "Sciences", prof: "M. Bernard", salle: "Labo" },
    5: { matiere: "Histoire-Géo", prof: "M. Martin", salle: "Salle 101" },
    7: { matiere: "EPS", prof: "M. Laurent", salle: "Gymnase" },
    9: { matiere: "Arts plastiques", prof: "Mme Claire", salle: "Salle Arts" },
  },
};

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
  const [selectedClass, setSelectedClass] = useState("CP - Classe A");
  const [techConfig, setTechConfig] = useState<TimetableTechConfig>(DEFAULT_TIMETABLE_TECH_CONFIG);
  const [emploiDuTemps, setEmploiDuTemps] = useState<EmploiDuTemps>(cloneTimetable(DEMO_TIMETABLE_TEMPLATE));
  const [selectedSlot, setSelectedSlot] = useState<{ jour: string; creneau: number } | null>(null);
  const [formData, setFormData] = useState({ matiere: "", prof: "", salle: "" });
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [copySourceDay, setCopySourceDay] = useState("Lundi");

  useEffect(() => {
    setTechConfig(loadTimetableTechConfigFromStorage());
  }, []);

  const jours = techConfig.activeDays.length > 0 ? techConfig.activeDays : [...DAY_NAMES];
  const creneaux = useMemo(() => generateTimeSlots(techConfig), [techConfig]);
  const disabledSlotsByDay = useMemo(() => getDisabledSlotIdsByDay(techConfig, creneaux), [techConfig, creneaux]);

  const isSlotDisabled = (day: string, slotId: number): boolean => disabledSlotsByDay[day]?.includes(slotId) ?? false;

  useEffect(() => {
    if (!jours.includes(copySourceDay)) {
      setCopySourceDay(jours[0] ?? "Lundi");
    }
  }, [copySourceDay, jours]);

  const handleSlotClick = (jour: string, creneauId: number) => {
    const currentSlot = creneaux.find((slot) => slot.id === creneauId);
    if (!currentSlot || currentSlot.type !== "course" || isSlotDisabled(jour, creneauId)) {
      return;
    }

    const existingCours = emploiDuTemps[jour]?.[creneauId];
    setSelectedSlot({ jour, creneau: creneauId });
    if (existingCours) {
      setFormData({
        matiere: existingCours.matiere,
        prof: existingCours.prof,
        salle: existingCours.salle,
      });
    } else {
      setFormData({ matiere: "", prof: "", salle: "" });
    }
    setConflicts([]);
  };

  const checkConflicts = (jour: string, creneauId: number, prof: string, salle: string): string[] => {
    // MVP mono-grille: on garde l'API de contrôle de conflits,
    // mais sans référentiel multi-classes il n'y a pas de conflit bloquant fiable ici.
    void jour;
    void creneauId;
    void prof;
    void salle;
    return [];
  };

  const handleSaveCours = () => {
    if (!selectedSlot || !formData.matiere || !formData.prof || !formData.salle) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    const detectedConflicts = checkConflicts(
      selectedSlot.jour,
      selectedSlot.creneau,
      formData.prof,
      formData.salle
    );

    if (detectedConflicts.length > 0) {
      setConflicts(detectedConflicts);
      return;
    }

    setEmploiDuTemps({
      ...emploiDuTemps,
      [selectedSlot.jour]: {
        ...emploiDuTemps[selectedSlot.jour],
        [selectedSlot.creneau]: {
          matiere: formData.matiere,
          prof: formData.prof,
          salle: formData.salle,
        },
      },
    });

    setSelectedSlot(null);
    setFormData({ matiere: "", prof: "", salle: "" });
  };

  const handleDeleteCours = () => {
    if (!selectedSlot) return;

    const newEmploiDuTemps = { ...emploiDuTemps };
    if (newEmploiDuTemps[selectedSlot.jour]) {
      delete newEmploiDuTemps[selectedSlot.jour][selectedSlot.creneau];
    }

    setEmploiDuTemps(newEmploiDuTemps);
    setSelectedSlot(null);
    setFormData({ matiere: "", prof: "", salle: "" });
  };

  const handleSaveEmploiDuTemps = () => {
    // TODO: Sauvegarder dans Supabase
    console.log("Sauvegarde emploi du temps:", { classe: selectedClass, emploiDuTemps });
    alert("Emploi du temps enregistré avec succès !");
  };

  const handleApplyTemplate = () => {
    setEmploiDuTemps(cloneTimetable(DEMO_TIMETABLE_TEMPLATE));
    setSelectedSlot(null);
    setConflicts([]);
  };

  const handleResetGrid = () => {
    setEmploiDuTemps({});
    setSelectedSlot(null);
    setConflicts([]);
  };

  const handleCopyDayToWeek = () => {
    setEmploiDuTemps((prev) => {
      const source = prev[copySourceDay] ?? {};
      const next = cloneTimetable(prev);

      jours.forEach((day) => {
        if (day === copySourceDay) return;
        const copiedDay: Record<number, Cours> = {};
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
    "Histoire-Géo": "bg-orange-100 text-orange-700 border-orange-300",
    Anglais: "bg-pink-100 text-pink-700 border-pink-300",
    EPS: "bg-red-100 text-red-700 border-red-300",
    "Arts plastiques": "bg-yellow-100 text-yellow-700 border-yellow-300",
    Musique: "bg-indigo-100 text-indigo-700 border-indigo-300",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-accent rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Gestion des emplois du temps</h1>
          <p className="text-muted-foreground">Créer et modifier l'emploi du temps</p>
        </div>
        <button
          onClick={handleSaveEmploiDuTemps}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20"
        >
          <Save className="w-4 h-4" />
          Enregistrer
        </button>
      </div>

      {/* Statut MVP */}
      <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
        <p className="text-sm font-medium text-foreground">Brouillon (MVP)</p>
        <p className="text-xs text-muted-foreground mt-1">
          Cette version est conçue pour préparer rapidement une grille avant la logique métier complète.
          Les horaires techniques se règlent dans Paramètres.
        </p>
      </div>

      {/* Sélection classe */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Classe <span className="text-danger">*</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none"
            >
              {classesData.map((classe) => (
                <option key={classe.id} value={classe.name}>
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
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none"
              >
                {jours.map((jour) => (
                  <option key={jour} value={jour}>
                    {jour}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleCopyDayToWeek}
                className="inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 bg-background border border-input hover:bg-accent rounded-lg transition font-medium"
                title="Copier ce jour vers les autres jours"
              >
                <Copy className="w-4 h-4" />
                Copier
              </button>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleApplyTemplate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-background border border-input hover:bg-accent rounded-lg transition font-medium"
            >
              <WandSparkles className="w-4 h-4" />
              Modèle
            </button>
            <button
              type="button"
              onClick={handleResetGrid}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-info/10 border border-info/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-info/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-info text-sm font-bold">i</span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Mode édition</p>
            <p className="text-xs text-muted-foreground mt-1">
              Cliquez sur une case pour ajouter ou modifier un cours. Les pauses et demi-journées sont protégées pour
              éviter les modifications accidentelles.
            </p>
          </div>
        </div>
      </div>

      {/* Grille emploi du temps */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Emploi du temps - {selectedClass}</h3>
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
                            onClick={() => handleSlotClick(jour, creneau.id)}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition min-h-[80px] ${
                              cours
                                ? `${matiereColors[cours.matiere] || "bg-gray-100 border-gray-300"} hover:shadow-md`
                                : "border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
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
                                + Ajouter cours
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

      {/* Modal d'édition */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedSlot(null)}></div>
          <div className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {emploiDuTemps[selectedSlot.jour]?.[selectedSlot.creneau] ? "Modifier" : "Ajouter"} un cours
              </h3>
              <button onClick={() => setSelectedSlot(null)} className="p-2 hover:bg-accent rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Info créneau */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-foreground">
                  {selectedSlot.jour} • {creneaux.find((c) => c.id === selectedSlot.creneau)?.debut} -{" "}
                  {creneaux.find((c) => c.id === selectedSlot.creneau)?.fin}
                </p>
              </div>

              {/* Matière */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Matière <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.matiere}
                  onChange={(e) => setFormData({ ...formData, matiere: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                >
                  <option value="">Sélectionner une matière</option>
                  {matieres.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Enseignant */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Enseignant <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.prof}
                  onChange={(e) => setFormData({ ...formData, prof: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                >
                  <option value="">Sélectionner un enseignant</option>
                  {enseignants
                    .filter((e) => !formData.matiere || e.matieres.includes(formData.matiere))
                    .map((e) => (
                      <option key={e.id} value={e.name}>
                        {e.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Salle */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Salle <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.salle}
                  onChange={(e) => setFormData({ ...formData, salle: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                >
                  <option value="">Sélectionner une salle</option>
                  {salles.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conflits */}
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

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 mt-6 pt-6 border-t border-border">
              {emploiDuTemps[selectedSlot.jour]?.[selectedSlot.creneau] && (
                <button
                  onClick={handleDeleteCours}
                  className="px-4 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition font-medium"
                >
                  Supprimer
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="px-4 py-2 bg-background border border-input hover:bg-accent rounded-lg transition font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveCours}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
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
