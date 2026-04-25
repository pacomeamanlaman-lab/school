"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Download, Edit, Clock } from "lucide-react";
import { exportScheduleToPDF } from "@/utils/pdfExport";
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

// Emploi du temps de démonstration pour CP - Classe A
const emploiDuTempsDemo: Record<string, Record<number, { matiere: string; prof: string; salle: string }>> = {
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

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export default function EmploisDuTempsPage() {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState("CP - Classe A");
  const [techConfig, setTechConfig] = useState<TimetableTechConfig>(DEFAULT_TIMETABLE_TECH_CONFIG);
  const isDemoClass = selectedClass === "CP - Classe A";
  const emploiDuTemps = isDemoClass ? emploiDuTempsDemo : {};
  const jours = techConfig.activeDays.length > 0 ? techConfig.activeDays : [...DAY_NAMES];
  const creneaux = useMemo(() => generateTimeSlots(techConfig), [techConfig]);
  const disabledSlotsByDay = useMemo(() => getDisabledSlotIdsByDay(techConfig, creneaux), [techConfig, creneaux]);

  useEffect(() => {
    setTechConfig(loadTimetableTechConfigFromStorage());
  }, []);

  const totalWeeklyHours = useMemo(() => {
    const totalMinutes = jours.reduce((acc, day) => {
      const dayMinutes = creneaux
        .filter((slot) => slot.type === "course" && !(disabledSlotsByDay[day] || []).includes(slot.id))
        .reduce((slotAcc, slot) => slotAcc + (toMinutes(slot.fin) - toMinutes(slot.debut)), 0);
      return acc + dayMinutes;
    }, 0);
    return `${(totalMinutes / 60).toFixed(1)}h`;
  }, [jours, creneaux, disabledSlotsByDay]);

  const handleExport = async () => {
    try {
      await exportScheduleToPDF(selectedClass);
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      alert("Erreur lors de l'export PDF");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Emplois du temps</h1>
        <p className="text-muted-foreground">Consultation et gestion des emplois du temps</p>
      </div>

      <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
        <p className="text-sm font-medium text-foreground">Brouillon (MVP)</p>
        <p className="text-xs text-muted-foreground mt-1">
          Version de démonstration. La classe CP - Classe A contient un exemple prérempli.
          Les horaires techniques sont configurables depuis Paramètres.
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-end gap-4">
          {/* Classe */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-2">
              Classe <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none"
              >
                {classesData.map((classe) => (
                  <option key={classe.id} value={classe.name}>
                    {classe.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={() => router.push("/dashboard/emplois-du-temps/gestion")}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20"
          >
            <Edit className="w-4 h-4" />
            Gérer l'emploi du temps
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-sm"
          >
            <Download className="w-4 h-4" />
            Exporter en PDF
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Heures/semaine</p>
          <p className="text-2xl font-bold text-foreground mt-1">{totalWeeklyHours}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Matières</p>
          <p className="text-2xl font-bold text-foreground mt-1">8</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Enseignants</p>
          <p className="text-2xl font-bold text-foreground mt-1">6</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Salles</p>
          <p className="text-2xl font-bold text-foreground mt-1">4</p>
        </div>
      </div>

      {/* Grille emploi du temps */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Emploi du temps - {selectedClass}
          </h3>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Année scolaire 2024-2025</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table id="schedule-table" className="w-full min-w-max">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 text-sm font-semibold text-foreground min-w-[100px]">
                  Horaires
                </th>
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
                          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                            -
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

        {/* Légende */}
        <div className="px-6 py-4 border-t border-border bg-muted/30">
          <p className="text-sm font-medium text-foreground mb-3">Légende des matières :</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(matiereColors).map(([matiere, colorClass]) => (
              <div key={matiere} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${colorClass} border-2`}></div>
                <span className="text-sm text-foreground">{matiere}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="px-6 py-4 border-t border-border">
          <div className="flex items-start gap-3 p-3 bg-info/10 border border-info/20 rounded-lg">
            <div className="w-5 h-5 bg-info/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-info text-xs">ℹ</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Information</p>
              <p className="text-xs text-muted-foreground mt-1">
                Les pauses et récréations sont verrouillées visuellement dans la grille.
                Les emplois du temps restent modifiables via le module de gestion.
                Toute modification sera visible instantanément pour tous les utilisateurs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Récapitulatif hebdomadaire */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Récapitulatif par matière</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 font-medium">Français</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">8h/semaine</p>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-700 font-medium">Mathématiques</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">7h/semaine</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">Sciences</p>
            <p className="text-2xl font-bold text-green-900 mt-1">3h/semaine</p>
          </div>
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-700 font-medium">Histoire-Géo</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">2h/semaine</p>
          </div>
          <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
            <p className="text-sm text-pink-700 font-medium">Anglais</p>
            <p className="text-2xl font-bold text-pink-900 mt-1">2h/semaine</p>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">EPS</p>
            <p className="text-2xl font-bold text-red-900 mt-1">3h/semaine</p>
          </div>
        </div>
      </div>
    </div>
  );
}
