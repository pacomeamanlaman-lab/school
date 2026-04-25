"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { BookOpen, Hash, ListPlus, Trash2 } from "lucide-react";
import {
  NIVEAUX_PRIMAIRE_CI,
  NIVEAUX_SECONDAIRE_CI,
  niveauxPourFiltreCycle,
} from "@/lib/cycles-scolaires-ci";

type CycleMatiere = "Primaire" | "Secondaire" | "Les_deux";
type SerieBac = "A1" | "A2" | "B" | "C" | "D";
type CoeffParSerie = Record<SerieBac, number>;
type NiveauCoefficient = (typeof NIVEAUX_PRIMAIRE_CI)[number] | (typeof NIVEAUX_SECONDAIRE_CI)[number];
type CoeffParNiveau = Partial<Record<NiveauCoefficient, number>>;

type MatiereFormData = {
  nom: string;
  nomOption: string;
  coefficient: number; // utilisé en mode simple
  coefficientMode: "" | "unique" | "par_cycle" | "par_niveau";
  coefficientPrimaire: number;
  coefficientSecondaire: number;
  coefficientsParNiveau: CoeffParNiveau;
  coefficientsParSerie: CoeffParSerie;
  couleur: string;
  cycle: "" | CycleMatiere;
  niveaux: string[];
  seriesTerminale: SerieBac[];
  active: boolean;
};

type MatiereDraftLine = MatiereFormData & { draftId: string };

interface AddMatiereModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  onSubmitBatch?: (data: any[]) => void;
  matiere?: any;
  existingMatieres?: Array<{ nom: string; cycle: CycleMatiere }>;
}

const MATIERE_DRAFT_STORAGE_KEY = "school_matieres_draft_queue";

const couleursPredefinies = [
  { nom: "Bleu", valeur: "#00aef0" },
  { nom: "Vert turquoise", valeur: "#10a7aa" },
  { nom: "Vert", valeur: "#10b981" },
  { nom: "Jaune", valeur: "#f59e0b" },
  { nom: "Orange", valeur: "#f97316" },
  { nom: "Rouge", valeur: "#ef4444" },
  { nom: "Rose", valeur: "#ec4899" },
  { nom: "Violet", valeur: "#8b5cf6" },
  { nom: "Indigo", valeur: "#6366f1" },
  { nom: "Gris", valeur: "#6b7280" },
];

type MatierePredef = {
  nom: string;
  coefficient: number;
  coefficientPrimaire?: number;
  coefficientSecondaire?: number;
};

const MATIERES_PREDEFINIES: Record<CycleMatiere, MatierePredef[]> = {
  Primaire: [
    { nom: "Français", coefficient: 2 },
    { nom: "Mathématiques", coefficient: 2 },
    { nom: "Sciences & Technologie", coefficient: 1 },
    { nom: "EDHC", coefficient: 1 },
    { nom: "EPS", coefficient: 1 },
    { nom: "Arts plastiques", coefficient: 1 },
    { nom: "Musique", coefficient: 1 },
    { nom: "Anglais", coefficient: 1 },
  ],
  Secondaire: [
    { nom: "Français", coefficient: 3 },
    { nom: "Mathématiques", coefficient: 3 },
    { nom: "Histoire-Géo", coefficient: 2 },
    { nom: "SVT", coefficient: 2 },
    { nom: "Physique-Chimie", coefficient: 2 },
    { nom: "Anglais (LV1)", coefficient: 2 },
    { nom: "Allemand/Espagnol (LV2)", coefficient: 1 },
    { nom: "Philosophie", coefficient: 1 },
    { nom: "Économie", coefficient: 5 },
    { nom: "EDHC", coefficient: 1 },
    { nom: "EPS", coefficient: 1 },
    { nom: "Arts plastiques", coefficient: 1 },
    { nom: "Musique", coefficient: 1 },
  ],
  Les_deux: [
    { nom: "Français", coefficient: 3, coefficientPrimaire: 2, coefficientSecondaire: 3 },
    { nom: "Mathématiques", coefficient: 3, coefficientPrimaire: 2, coefficientSecondaire: 3 },
    { nom: "Histoire-Géo", coefficient: 2, coefficientPrimaire: 1, coefficientSecondaire: 2 },
    { nom: "Anglais", coefficient: 2, coefficientPrimaire: 1, coefficientSecondaire: 2 },
    { nom: "EDHC", coefficient: 1, coefficientPrimaire: 1, coefficientSecondaire: 1 },
    { nom: "EPS", coefficient: 1, coefficientPrimaire: 1, coefficientSecondaire: 1 },
    { nom: "Arts plastiques", coefficient: 1, coefficientPrimaire: 1, coefficientSecondaire: 1 },
    { nom: "Musique", coefficient: 1, coefficientPrimaire: 1, coefficientSecondaire: 1 },
  ],
};

const TERMINALE_COEFFS_PAR_MATIERE: Partial<Record<string, CoeffParSerie>> = {
  "Français": { A1: 5, A2: 4, B: 3, C: 2, D: 2 },
  "Français / Littérature": { A1: 5, A2: 4, B: 3, C: 2, D: 2 },
  "Philosophie": { A1: 4, A2: 3, B: 3, C: 2, D: 2 },
  "Mathématiques": { A1: 1, A2: 3, B: 3, C: 7, D: 4 },
  "Physique-Chimie": { A1: 1, A2: 2, B: 2, C: 5, D: 3 },
  "SVT": { A1: 1, A2: 2, B: 1, C: 2, D: 5 },
  "Histoire-Géographie": { A1: 3, A2: 3, B: 3, C: 2, D: 2 },
  "Anglais (LV1)": { A1: 3, A2: 3, B: 3, C: 2, D: 2 },
  "LV2": { A1: 2, A2: 2, B: 2, C: 1, D: 1 },
  "Économie": { A1: 1, A2: 1, B: 5, C: 1, D: 1 },
};

const DEFAULT_SERIE_COEFFS: CoeffParSerie = { A1: 1, A2: 1, B: 1, C: 1, D: 1 };

const getSeriesDefaultsForMatiere = (matiereNom: string, fallback: number): CoeffParSerie => {
  const fromRef = TERMINALE_COEFFS_PAR_MATIERE[matiereNom];
  if (fromRef) return fromRef;
  return { A1: fallback, A2: fallback, B: fallback, C: fallback, D: fallback };
};

const COEFFS_PAR_NIVEAU_PREDEFINIS: Partial<Record<string, CoeffParNiveau>> = {
  "Français": { "6ème": 3, "5ème": 3, "4ème": 3, "3ème": 4, "2nde": 4 },
  "Français / Littérature": { "6ème": 3, "5ème": 3, "4ème": 3, "3ème": 4, "2nde": 4 },
  "Mathématiques": { "6ème": 3, "5ème": 3, "4ème": 3, "3ème": 3, "2nde": 3 },
  "Histoire-Géographie": { "6ème": 2, "5ème": 2, "4ème": 2, "3ème": 2, "2nde": 2 },
  "SVT": { "6ème": 2, "5ème": 2, "4ème": 2, "3ème": 2, "2nde": 2 },
  "Physique-Chimie": { "6ème": 2, "5ème": 2, "4ème": 2, "3ème": 2, "2nde": 2 },
  "Anglais (LV1)": { "6ème": 2, "5ème": 2, "4ème": 2, "3ème": 2, "2nde": 2 },
  "Allemand/Espagnol (LV2)": { "4ème": 1, "3ème": 1, "2nde": 1 },
  "Philosophie": { "2nde": 1 },
  "EDHC": { "6ème": 1, "5ème": 1, "4ème": 1, "3ème": 1, "2nde": 1 },
  "EPS": { "6ème": 1, "5ème": 1, "4ème": 1, "3ème": 1, "2nde": 1 },
  "Arts plastiques / Musique": { "6ème": 1, "5ème": 1, "4ème": 1, "3ème": 1, "2nde": 1 },
  "Sciences & Technologie": { CP1: 1, CP2: 1, CE1: 1, CE2: 1, CM1: 1, CM2: 1 },
  "Français (primaire)": { CP1: 2, CP2: 2, CE1: 2, CE2: 2, CM1: 2, CM2: 2 },
  "Mathématiques (primaire)": { CP1: 2, CP2: 2, CE1: 2, CE2: 2, CM1: 2, CM2: 2 },
};

const getNiveauDefaultsForMatiere = (
  matiereNom: string,
  niveaux: string[],
  fallback: number
): CoeffParNiveau => {
  const ref = COEFFS_PAR_NIVEAU_PREDEFINIS[matiereNom] || {};
  return niveaux.reduce((acc, n) => {
    const key = n as NiveauCoefficient;
    acc[key] = ref[key] ?? fallback;
    return acc;
  }, {} as CoeffParNiveau);
};

const emptyForm = (): MatiereFormData => ({
  nom: "",
  nomOption: "",
  coefficient: 1,
  coefficientMode: "",
  coefficientPrimaire: 1,
  coefficientSecondaire: 1,
  coefficientsParNiveau: {},
  coefficientsParSerie: { ...DEFAULT_SERIE_COEFFS },
  couleur: "#00aef0",
  cycle: "",
  niveaux: [],
  seriesTerminale: ["A1", "A2", "B", "C", "D"],
  active: true,
});

function newDraftId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function saveDraftQueue(queue: MatiereDraftLine[]): void {
  if (typeof window !== "undefined") {
    if (queue.length === 0) {
      localStorage.removeItem(MATIERE_DRAFT_STORAGE_KEY);
    } else {
      localStorage.setItem(MATIERE_DRAFT_STORAGE_KEY, JSON.stringify(queue));
    }
  }
}

function loadDraftQueue(): MatiereDraftLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MATIERE_DRAFT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((r) => {
        const row = r as Record<string, unknown>;
        const nom = String(row.nom ?? "").trim();
        const coefficient = Number(row.coefficient) || 1;
        const coefficientMode =
          row.coefficientMode === "par_cycle"
            ? "par_cycle"
            : row.coefficientMode === "par_niveau"
              ? "par_niveau"
              : row.coefficientMode === "unique"
                ? "unique"
                : "";
        const coefficientPrimaire = Number(row.coefficientPrimaire) || coefficient;
        const coefficientSecondaire = Number(row.coefficientSecondaire) || coefficient;
        const coefficientsParSerieRaw = (row.coefficientsParSerie ?? {}) as Record<string, unknown>;
        const coefficientsParSerie: CoeffParSerie = {
          A1: Number(coefficientsParSerieRaw.A1) || coefficient,
          A2: Number(coefficientsParSerieRaw.A2) || coefficient,
          B: Number(coefficientsParSerieRaw.B) || coefficient,
          C: Number(coefficientsParSerieRaw.C) || coefficient,
          D: Number(coefficientsParSerieRaw.D) || coefficient,
        };
        const couleur = String(row.couleur ?? "#00aef0");
        const cycleRaw = String(row.cycle ?? "");
        const cycle: "" | CycleMatiere =
          cycleRaw === "Primaire" || cycleRaw === "Secondaire" || cycleRaw === "Les_deux"
            ? (cycleRaw as CycleMatiere)
            : "";
        const niveaux = Array.isArray(row.niveaux)
          ? row.niveaux.map(String).filter(Boolean)
          : [];
        const seriesTerminale: SerieBac[] = Array.isArray(row.seriesTerminale)
          ? row.seriesTerminale
              .map(String)
              .filter((s): s is SerieBac => ["A1", "A2", "B", "C", "D"].includes(s))
          : ["A1", "A2", "B", "C", "D"];
        const coeffParNiveauRaw = (row.coefficientsParNiveau ?? {}) as Record<string, unknown>;
        const coefficientsParNiveau = Object.entries(coeffParNiveauRaw).reduce((acc, [k, v]) => {
          const nk = k as NiveauCoefficient;
          const val = Number(v) || coefficient;
          acc[nk] = val;
          return acc;
        }, {} as CoeffParNiveau);
        const active = row.active !== false;
        if (!nom || !cycle || niveaux.length === 0) return [];
        const line: MatiereDraftLine = {
          draftId: typeof row.draftId === "string" ? row.draftId : newDraftId(),
          nom,
          nomOption: nom,
          coefficient,
          coefficientMode,
          coefficientPrimaire,
          coefficientSecondaire,
          coefficientsParNiveau,
          coefficientsParSerie,
          couleur,
          cycle,
          niveaux,
          seriesTerminale,
          active,
        };
        return [line];
    });
  } catch {
    return [];
  }
}

export default function AddMatiereModal({
  isOpen,
  onClose,
  onSubmit,
  onSubmitBatch,
  matiere,
  existingMatieres = [],
}: AddMatiereModalProps) {
  const isEditMode = !!matiere;
  const [formData, setFormData] = useState<MatiereFormData>(emptyForm);
  const [draftQueue, setDraftQueue] = useState<MatiereDraftLine[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode) {
      const cycle = (matiere.cycle || "Primaire") as CycleMatiere;
      const nom = matiere.nom || "";
      const isPredef = MATIERES_PREDEFINIES[cycle].some((m) => m.nom === nom);
      setFormData({
        nom,
        nomOption: isPredef ? nom : "__custom__",
        coefficient: matiere.coefficient || 1,
        coefficientMode: matiere.coefficientMode || "unique",
        coefficientPrimaire:
          matiere.coefficientsParCycle?.primaire ?? matiere.coefficient ?? 1,
        coefficientSecondaire:
          matiere.coefficientsParCycle?.secondaire ?? matiere.coefficient ?? 1,
        coefficientsParNiveau:
          matiere.coefficientsParNiveau ||
          getNiveauDefaultsForMatiere(nom, matiere.niveaux || [...NIVEAUX_PRIMAIRE_CI], matiere.coefficient || 1),
        coefficientsParSerie:
          matiere.coefficientsParSerie || getSeriesDefaultsForMatiere(nom, matiere.coefficient || 1),
        couleur: matiere.couleur || "#00aef0",
        cycle,
        niveaux: matiere.niveaux || [...NIVEAUX_PRIMAIRE_CI],
        seriesTerminale: matiere.seriesTerminale || ["A1", "A2", "B", "C", "D"],
        active: matiere.active !== false,
      });
    } else {
      setFormData(emptyForm());
      setDraftQueue(loadDraftQueue());
    }
  }, [isOpen, isEditMode, matiere]);

  const niveauxDisponibles =
    formData.cycle === "Primaire"
      ? [...NIVEAUX_PRIMAIRE_CI]
      : formData.cycle === "Secondaire"
        ? [...NIVEAUX_SECONDAIRE_CI]
        : formData.cycle === "Les_deux"
          ? niveauxPourFiltreCycle("Les_deux")
          : [];
  const matieresPredefinies = formData.cycle ? MATIERES_PREDEFINIES[formData.cycle] : [];

  const getPredefCoeffs = (entry?: MatierePredef) => ({
    coefficient: entry?.coefficient ?? formData.coefficient,
    coefficientPrimaire:
      entry?.coefficientPrimaire ?? entry?.coefficient ?? formData.coefficientPrimaire,
    coefficientSecondaire:
      entry?.coefficientSecondaire ?? entry?.coefficient ?? formData.coefficientSecondaire,
  });

  const persistQueue = (next: MatiereDraftLine[]) => {
    setDraftQueue(next);
    saveDraftQueue(next);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const numericFields = ["coefficient", "coefficientPrimaire", "coefficientSecondaire"];
    const rawValue = e.target.value;
    const value = numericFields.includes(e.target.name)
      ? rawValue === ""
        ? Number.NaN
        : parseInt(rawValue, 10)
      : rawValue;
    if (e.target.name === "cycle") {
      const cycle = value as "" | CycleMatiere;
      if (!cycle) {
        setFormData({
          ...formData,
          cycle: "",
          niveaux: [],
          nomOption: "",
          nom: "",
          coefficientMode: "",
          coefficientsParNiveau: {},
          seriesTerminale: ["A1", "A2", "B", "C", "D"],
        });
        return;
      }
      const defaultMatiere = MATIERES_PREDEFINIES[cycle][0];
      const defaults = getPredefCoeffs(defaultMatiere);
      setFormData({
        ...formData,
        cycle,
        niveaux: [],
        nomOption: defaultMatiere?.nom || "",
        nom: defaultMatiere?.nom || "",
        coefficient: defaults.coefficient,
        coefficientMode: "",
        coefficientPrimaire: defaults.coefficientPrimaire,
        coefficientSecondaire: defaults.coefficientSecondaire,
        coefficientsParNiveau: {},
        coefficientsParSerie: getSeriesDefaultsForMatiere(defaultMatiere?.nom || "", defaults.coefficient),
        seriesTerminale: ["A1", "A2", "B", "C", "D"],
      });
      return;
    }
    if (e.target.name === "coefficientMode") {
      const nextMode = value as "" | "unique" | "par_cycle" | "par_niveau";
      setFormData({
        ...formData,
        coefficientMode: nextMode,
        coefficientPrimaire:
          nextMode === "par_cycle" ? formData.coefficientPrimaire : formData.coefficient,
        coefficientSecondaire:
          nextMode === "par_cycle" ? formData.coefficientSecondaire : formData.coefficient,
      });
      return;
    }
    if (e.target.name === "nomOption") {
      const nomOption = value as string;
      if (nomOption === "__custom__") {
        setFormData({ ...formData, nomOption, nom: "" });
        return;
      }
      const selected = matieresPredefinies.find((m) => m.nom === nomOption);
      const defaults = getPredefCoeffs(selected);
      setFormData({
        ...formData,
        nomOption,
        nom: nomOption,
        coefficient: defaults.coefficient,
        coefficientPrimaire: defaults.coefficientPrimaire,
        coefficientSecondaire: defaults.coefficientSecondaire,
        coefficientsParNiveau: getNiveauDefaultsForMatiere(
          nomOption,
          formData.niveaux,
          defaults.coefficient
        ),
        coefficientsParSerie: getSeriesDefaultsForMatiere(nomOption, defaults.coefficient),
      });
      return;
    }
    if (e.target.name.startsWith("coefNiveau_")) {
      const niveau = e.target.name.replace("coefNiveau_", "") as NiveauCoefficient;
      const nextVal = e.target.value === "" ? Number.NaN : parseInt(e.target.value, 10);
      setFormData({
        ...formData,
        coefficientsParNiveau: { ...formData.coefficientsParNiveau, [niveau]: nextVal },
      });
      return;
    }
    if (e.target.name.startsWith("coefSerie_")) {
      const serie = e.target.name.replace("coefSerie_", "") as SerieBac;
      const nextVal = e.target.value === "" ? Number.NaN : parseInt(e.target.value, 10);
      setFormData({
        ...formData,
        coefficientsParSerie: { ...formData.coefficientsParSerie, [serie]: nextVal },
      });
      return;
    }
    if (e.target.name === "active") {
      const isActive =
        (e.target as HTMLInputElement).type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value === "active";
      setFormData({ ...formData, active: isActive });
      return;
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  const toggleSerieTerminale = (serie: SerieBac) => {
    const exists = formData.seriesTerminale.includes(serie);
    const next = exists
      ? formData.seriesTerminale.filter((s) => s !== serie)
      : [...formData.seriesTerminale, serie];
    setFormData({ ...formData, seriesTerminale: next });
  };

  const toggleNiveau = (niveau: string) => {
    const exists = formData.niveaux.includes(niveau);
    const nextNiveaux = exists
      ? formData.niveaux.filter((n) => n !== niveau)
      : [...formData.niveaux, niveau];
    const nextMode =
      nextNiveaux.length === 0
        ? ""
        : formData.coefficientMode === "par_niveau" && nextNiveaux.length < 2
          ? "unique"
          : formData.coefficientMode;
    setFormData({
      ...formData,
      niveaux: nextNiveaux,
      coefficientMode: nextMode,
      coefficientsParNiveau: getNiveauDefaultsForMatiere(
        formData.nom,
        nextNiveaux,
        formData.coefficient
      ),
    });
  };

  const handleSelectAllNiveaux = () => {
    setFormData({
      ...formData,
      niveaux: niveauxDisponibles,
      coefficientsParNiveau: getNiveauDefaultsForMatiere(
        formData.nom,
        niveauxDisponibles,
        formData.coefficient
      ),
    });
  };

  const handleClearAllNiveaux = () => {
    setFormData({
      ...formData,
      niveaux: [],
      coefficientMode: "",
      coefficientsParNiveau: {},
      seriesTerminale: [],
    });
  };

  const handleToggleAdvancedParCycle = (enabled: boolean) => {
    setFormData((prev) => ({
      ...prev,
      coefficientMode: enabled
        ? "par_cycle"
        : prev.coefficientMode === "par_cycle"
          ? ""
          : prev.coefficientMode,
      coefficientPrimaire: enabled ? prev.coefficientPrimaire : prev.coefficient,
      coefficientSecondaire: enabled ? prev.coefficientSecondaire : prev.coefficient,
    }));
  };

  const validateForm = (): string | null => {
    const isValidCoef = (value: number, min: number, max: number) =>
      Number.isFinite(value) && value >= min && value <= max;

    if (!formData.cycle) return "Le cycle pédagogique est requis.";
    if (!formData.nom.trim()) return "Le nom de la matière est requis.";
    if (
      (formData.cycle === "Secondaire" || formData.cycle === "Les_deux") &&
      formData.niveaux.length > 0 &&
      !formData.coefficientMode
    ) {
      return "Choisissez un mode coefficient.";
    }
    if (formData.coefficientMode === "unique" && !isValidCoef(formData.coefficient, 1, 9)) {
      return "Le coefficient doit être entre 1 et 9.";
    }
    if (
      formData.cycle === "Les_deux" &&
      formData.coefficientMode === "par_cycle" &&
      (!isValidCoef(formData.coefficientPrimaire, 1, 5) ||
        !isValidCoef(formData.coefficientSecondaire, 1, 5))
    ) {
      return "Les coefficients primaire et secondaire doivent être entre 1 et 5.";
    }
    if (formData.niveaux.length === 0) return "Sélectionnez au moins un niveau.";
    if (formData.coefficientMode === "par_niveau") {
      const invalid = formData.niveaux.some((niveau) => {
        const coef = formData.coefficientsParNiveau[niveau as NiveauCoefficient] ?? formData.coefficient;
        return !isValidCoef(coef, 1, 9);
      });
      if (invalid) return "Chaque coefficient par niveau doit être entre 1 et 9.";
    }
    if (formData.niveaux.includes("Terminale") && formData.seriesTerminale.length === 0) {
      return "Sélectionnez au moins une série pour la Terminale.";
    }
    if (formData.niveaux.includes("Terminale") && formData.seriesTerminale.length > 1) {
      const invalid = formData.seriesTerminale.some((serie) => {
        const coef = formData.coefficientsParSerie[serie];
        return !isValidCoef(coef, 1, 9);
      });
      if (invalid) return "Chaque coefficient par série Terminale doit être entre 1 et 9.";
    }
    return null;
  };

  const isDuplicateInExisting = (nom: string, cycle: CycleMatiere): boolean =>
    existingMatieres.some(
      (m) => m.nom.trim().toLowerCase() === nom.trim().toLowerCase() && m.cycle === cycle
    );

  const isDuplicateInQueue = (nom: string, cycle: CycleMatiere): boolean =>
    draftQueue.some(
      (m) => m.nom.trim().toLowerCase() === nom.trim().toLowerCase() && m.cycle === cycle
    );

  const buildMatierePayload = (data: MatiereFormData) => {
    const effectiveCycle = (data.cycle || "Primaire") as CycleMatiere;
    const effectiveMode: "unique" | "par_cycle" | "par_niveau" = data.coefficientMode || "unique";
    const hasTerminale = data.niveaux.includes("Terminale");
    const selectedSeries = hasTerminale ? data.seriesTerminale : [];
    const firstSeries = selectedSeries[0];
    const coeffFromSeries = firstSeries ? data.coefficientsParSerie[firstSeries] : data.coefficient;
    const base = {
      nom: data.nom.trim(),
      coefficientMode: effectiveMode,
      coefficient:
        hasTerminale && selectedSeries.length > 0
          ? coeffFromSeries
          : effectiveMode === "par_niveau" && data.niveaux.length > 0
            ? data.coefficientsParNiveau[data.niveaux[0] as NiveauCoefficient] ?? data.coefficient
          : data.cycle === "Les_deux" && effectiveMode === "par_cycle"
          ? data.coefficientPrimaire
          : data.coefficient,
      couleur: data.couleur,
      cycle: effectiveCycle,
      niveaux: data.niveaux,
      seriesTerminale: data.seriesTerminale,
      active: data.active,
    };
    if (effectiveCycle === "Les_deux" && effectiveMode === "par_cycle") {
      return {
        ...base,
        coefficientsParCycle: {
          primaire: data.coefficientPrimaire,
          secondaire: data.coefficientSecondaire,
        },
      };
    }
    return {
      ...base,
      coefficientsParCycle: undefined,
      coefficientsParSerie:
        hasTerminale && selectedSeries.length > 0
          ? selectedSeries.reduce((acc, serie) => {
              acc[serie] = data.coefficientsParSerie[serie];
              return acc;
            }, {} as Partial<CoeffParSerie>)
          : undefined,
      coefficientsParNiveau:
        effectiveMode === "par_niveau"
          ? data.niveaux.reduce((acc, niveau) => {
              const key = niveau as NiveauCoefficient;
              acc[key] = data.coefficientsParNiveau[key] ?? data.coefficient;
              return acc;
            }, {} as CoeffParNiveau)
          : undefined,
      coefficientPrimaire: data.coefficient,
      coefficientSecondaire: data.coefficient,
    };
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }
    onSubmit?.({ ...matiere, ...buildMatierePayload(formData) });
    onClose();
  };

  const handleAddToQueue = () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }
    if (!formData.cycle) {
      alert("Sélectionnez un cycle pédagogique.");
      return;
    }
    const nom = formData.nom.trim();
    if (isDuplicateInExisting(nom, formData.cycle)) {
      alert("Cette matière existe déjà dans ce cycle.");
      return;
    }
    if (isDuplicateInQueue(nom, formData.cycle)) {
      alert("Cette matière est déjà dans la liste d'attente.");
      return;
    }
    const nextLine: MatiereDraftLine = { ...formData, nom, draftId: newDraftId() };
    persistQueue([...draftQueue, nextLine]);
    setFormData({ ...emptyForm(), coefficient: formData.coefficient });
  };

  const handleRemoveQueueLine = (draftId: string) => {
    persistQueue(draftQueue.filter((l) => l.draftId !== draftId));
  };

  const handleClearQueue = () => {
    persistQueue([]);
  };

  const handleValidateQueue = () => {
    if (draftQueue.length === 0) {
      alert("Ajoutez au moins une matière à la liste.");
      return;
    }
    onSubmitBatch?.(
      draftQueue.map(({ draftId: _draftId, ...line }) => buildMatierePayload(line))
    );
    persistQueue([]);
    setFormData(emptyForm());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Modifier la matière" : "Ajouter des matières"}
      size={isEditMode ? "md" : "lg"}
    >
      {isEditMode ? (
        <form onSubmit={handleSubmitEdit} className="space-y-6">
          <MatiereFormFields
            formData={formData}
            niveauxDisponibles={niveauxDisponibles}
            onChange={handleChange}
            onToggleNiveau={toggleNiveau}
            onSelectAllNiveaux={handleSelectAllNiveaux}
            onClearAllNiveaux={handleClearAllNiveaux}
            onToggleAdvancedParCycle={handleToggleAdvancedParCycle}
            onToggleSerieTerminale={toggleSerieTerminale}
            onColorSelect={(couleur) => setFormData((prev) => ({ ...prev, couleur }))}
            matieresPredefinies={matieresPredefinies}
          />
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-background border border-input hover:bg-accent rounded-lg transition font-medium text-foreground"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={formData.niveaux.length === 0}
              className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20 disabled:pointer-events-none disabled:opacity-50"
            >
              Modifier
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground">
            Ajoutez plusieurs matières dans cette fenêtre, puis validez en bloc.
          </p>
          <div className="flex flex-col gap-5 lg:flex-row">
            <div className="flex-1 min-w-0">
              <MatiereFormFields
                formData={formData}
                niveauxDisponibles={niveauxDisponibles}
                onChange={handleChange}
                onToggleNiveau={toggleNiveau}
                onSelectAllNiveaux={handleSelectAllNiveaux}
                onClearAllNiveaux={handleClearAllNiveaux}
                onToggleAdvancedParCycle={handleToggleAdvancedParCycle}
                onToggleSerieTerminale={toggleSerieTerminale}
                onColorSelect={(couleur) => setFormData((prev) => ({ ...prev, couleur }))}
                matieresPredefinies={matieresPredefinies}
              />
              <button
                type="button"
                onClick={handleAddToQueue}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-2.5 font-medium text-success transition hover:bg-success/20"
              >
                <ListPlus className="h-4 w-4" />
                Ajouter à la liste
              </button>
            </div>
            <aside className="w-full rounded-xl border border-border bg-muted/20 p-4 lg:w-[260px]">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">En attente</p>
                {draftQueue.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearQueue}
                    className="text-xs font-medium text-danger hover:underline"
                  >
                    Tout vider
                  </button>
                )}
              </div>
              {draftQueue.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune matière pour l'instant.</p>
              ) : (
                <ul className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
                  {draftQueue.map((line) => (
                    <li
                      key={line.draftId}
                      className="rounded-lg border border-border bg-card px-2.5 py-2 text-sm"
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{line.nom}</p>
                          <p className="text-xs text-muted-foreground">
                            {line.cycle === "Les_deux" ? "Les deux" : line.cycle} •{" "}
                            {line.cycle === "Les_deux" && line.coefficientMode === "par_cycle"
                              ? `P:${line.coefficientPrimaire} / S:${line.coefficientSecondaire}`
                              : `Coef ${line.coefficient}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQueueLine(line.draftId)}
                          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-danger"
                          aria-label={`Retirer ${line.nom}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {line.niveaux.length > 2
                          ? `${line.niveaux.slice(0, 2).join(", ")} +${line.niveaux.length - 2}`
                          : line.niveaux.join(", ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
          <div className="flex flex-col-reverse gap-3 pt-4 border-t border-border sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-background border border-input hover:bg-accent rounded-lg transition font-medium"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleValidateQueue}
              disabled={draftQueue.length === 0}
              className="px-4 py-2 bg-success hover:bg-success/90 text-white rounded-lg transition font-medium disabled:pointer-events-none disabled:opacity-50"
            >
              Enregistrer les ajouts
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function MatiereFormFields({
  formData,
  niveauxDisponibles,
  onChange,
  onToggleNiveau,
  onSelectAllNiveaux,
  onClearAllNiveaux,
  onToggleAdvancedParCycle,
  onToggleSerieTerminale,
  onColorSelect,
  matieresPredefinies,
}: {
  formData: MatiereFormData;
  niveauxDisponibles: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onToggleNiveau: (niveau: string) => void;
  onSelectAllNiveaux: () => void;
  onClearAllNiveaux: () => void;
  onToggleAdvancedParCycle: (enabled: boolean) => void;
  onToggleSerieTerminale: (serie: SerieBac) => void;
  onColorSelect: (couleur: string) => void;
  matieresPredefinies: MatierePredef[];
}) {
  const hasCycleSelected = formData.cycle !== "";
  const isPrimaryCycle = formData.cycle === "Primaire";
  const hasNiveauxSelectionnes = formData.niveaux.length > 0;
  const displayNumber = (value: number): number | "" => (Number.isNaN(value) ? "" : value);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Cycle pédagogique <span className="text-danger">*</span>
          </label>
          <select
            name="cycle"
            value={formData.cycle}
            onChange={onChange}
            className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
          >
            <option value="">Choisir un cycle...</option>
            <option value="Primaire">Primaire</option>
            <option value="Secondaire">Secondaire</option>
            <option value="Les_deux">Les deux</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nom de la matière <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              name="nomOption"
              value={formData.nomOption || ""}
              onChange={onChange}
              required
              disabled={!hasCycleSelected}
              className="w-full appearance-none pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            >
              <option value="">Choisir une matière...</option>
              {matieresPredefinies.map((m) => (
                <option key={m.nom} value={m.nom}>
                  {m.nom}
                </option>
              ))}
              <option value="__custom__">Autre (personnalisée)</option>
            </select>
          </div>
          {!hasCycleSelected && (
            <p className="mt-1 text-xs text-muted-foreground">
              Choisissez d'abord le cycle pédagogique pour afficher les matières.
            </p>
          )}
          {formData.nomOption === "__custom__" && (
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={onChange}
              required
              className="mt-2 w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              placeholder="Saisir une matière personnalisée"
            />
          )}
        </div>
      </div>

      {hasCycleSelected && (
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="block text-sm font-medium text-foreground">
            Niveaux concernés <span className="text-danger">*</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSelectAllNiveaux}
              className="rounded-md border border-input px-2.5 py-1 text-xs text-foreground hover:bg-accent transition"
            >
              Tout sélectionner
            </button>
            <button
              type="button"
              onClick={onClearAllNiveaux}
              className="rounded-md border border-input px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent transition"
            >
              Tout désélectionner
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {niveauxDisponibles.map((niveau) => (
            <label
              key={niveau}
              className="flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={formData.niveaux.includes(niveau)}
                onChange={() => onToggleNiveau(niveau)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              <span>{niveau}</span>
            </label>
          ))}
        </div>
      </div>
      )}

      {hasCycleSelected && !isPrimaryCycle && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Mode coefficient</label>
            <select
              name="coefficientMode"
              value={formData.coefficientMode}
              onChange={onChange}
              disabled={!hasNiveauxSelectionnes}
              className={`w-full px-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${
                hasNiveauxSelectionnes
                  ? "bg-white"
                  : "bg-muted/50 text-muted-foreground cursor-not-allowed"
              }`}
            >
              <option value="">Choisir un mode...</option>
              <option value="unique">Coefficient unique (tous niveaux)</option>
              {formData.niveaux.length > 1 && (
                <option value="par_niveau">Coefficient par niveau sélectionné</option>
              )}
              {formData.coefficientMode === "par_cycle" && (
                <option value="par_cycle" hidden>
                  Coefficient par cycle (avancé)
                </option>
              )}
            </select>
            {formData.niveaux.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Aucun niveau sélectionné : choisissez d'abord les niveaux concernés.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Coefficient <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="number"
                name="coefficient"
                value={formData.coefficientMode === "unique" ? displayNumber(formData.coefficient) : ""}
                onChange={onChange}
                required
                disabled={formData.coefficientMode !== "unique"}
                min="1"
                max="9"
                className={`w-full pl-10 pr-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition ${
                  formData.coefficientMode === "unique"
                    ? "bg-white"
                    : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                }`}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formData.coefficientMode === "unique"
                ? "Utilisé uniquement en mode coefficient unique."
                : formData.coefficientMode === "par_niveau"
                  ? "Gelé: la saisie se fait dans les champs par niveau ci-dessous."
                  : formData.coefficientMode === "par_cycle"
                    ? "Gelé: la saisie se fait dans les coefficients par cycle ci-dessous."
                    : "Choisissez d'abord un mode coefficient pour activer la saisie."}
            </p>
          </div>
        </div>
      )}

      {!isPrimaryCycle && formData.cycle === "Les_deux" && (
        <details className="mt-4 rounded-lg border border-border bg-muted/10 p-3" open={formData.coefficientMode === "par_cycle"}>
          <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
            Options avancées
          </summary>
          <div className="mt-3 space-y-3">
            <label className="flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2">
              <input
                type="checkbox"
                checked={formData.coefficientMode === "par_cycle"}
                onChange={(e) => onToggleAdvancedParCycle(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              <span className="text-sm text-foreground">
                Activer la pondération par cycle (exception)
              </span>
            </label>
            <p className="text-xs text-warning">
              Mode non standard : le primaire n'utilise généralement pas de coefficients détaillés.
            </p>
          </div>
        </details>
      )}

      {!isPrimaryCycle &&
        (formData.coefficientMode === "par_cycle" || formData.coefficientMode === "par_niveau") && (
        <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
          {formData.coefficientMode === "par_cycle" && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Coefficient Primaire
                </label>
                <input
                  type="number"
                  name="coefficientPrimaire"
                  value={displayNumber(formData.coefficientPrimaire)}
                  min="1"
                  max="5"
                  onChange={onChange}
                  className="w-full px-3 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Coefficient Secondaire
                </label>
                <input
                  type="number"
                  name="coefficientSecondaire"
                  value={displayNumber(formData.coefficientSecondaire)}
                  min="1"
                  max="5"
                  onChange={onChange}
                  className="w-full px-3 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {formData.coefficientMode === "par_niveau" && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {formData.niveaux.map((niveau) => (
                <div key={niveau}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{niveau}</label>
                  <input
                    type="number"
                    name={`coefNiveau_${niveau}`}
                    value={displayNumber(
                      formData.coefficientsParNiveau[niveau as NiveauCoefficient] ?? formData.coefficient
                    )}
                    min="1"
                    max="9"
                    onChange={onChange}
                    className="w-full px-3 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Statut
        </label>
        <select
          name="active"
          value={formData.active ? "active" : "inactive"}
          onChange={onChange}
          className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          Une matière inactive reste disponible pour l'historique et peut être réactivée.
        </p>
      </div>

      {formData.niveaux.includes("Terminale") && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Séries Terminale concernées <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(["A1", "A2", "B", "C", "D"] as SerieBac[]).map((serie) => (
              <label
                key={serie}
                className="flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={formData.seriesTerminale.includes(serie)}
                  onChange={() => onToggleSerieTerminale(serie)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                <span>{serie}</span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Utilisé par la grille coefficients pour les classes de Terminale.
          </p>
        </div>
      )}

      {formData.niveaux.includes("Terminale") && formData.seriesTerminale.length > 1 && (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <label className="block text-sm font-medium text-foreground mb-2">
            Coefficients par série Terminale
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {formData.seriesTerminale.map((serie) => (
              <div key={serie}>
                <label className="block text-xs text-muted-foreground mb-1">{serie}</label>
                <input
                  type="number"
                  name={`coefSerie_${serie}`}
                  min="1"
                  max="9"
                  value={displayNumber(formData.coefficientsParSerie[serie] ?? formData.coefficient)}
                  onChange={onChange}
                  className="w-full px-3 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Couleur <span className="text-danger">*</span>
        </label>
        <div className="grid grid-cols-5 gap-2">
          {couleursPredefinies.map((couleur) => (
            <button
              key={couleur.valeur}
              type="button"
              onClick={() => onColorSelect(couleur.valeur)}
              className={`w-full h-10 rounded-lg border-2 transition ${
                formData.couleur === couleur.valeur ? "border-primary scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: couleur.valeur }}
              title={couleur.nom}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
