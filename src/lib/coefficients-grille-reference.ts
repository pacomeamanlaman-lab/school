export const COEFF_GRILLE_REFERENCE_STORAGE_KEY = "school_coeff_grille_reference_mvp";

export type NiveauCoeffReference =
  | "CP1"
  | "CP2"
  | "CE1"
  | "CE2"
  | "CM1"
  | "CM2"
  | "6ème"
  | "5ème"
  | "4ème"
  | "3ème"
  | "2nde"
  | "1ère"
  | "Terminale";

export type SerieBacReference = "A1" | "A2" | "B" | "C" | "D" | "none";

export type CoefficientGrilleReferenceRow = {
  id: number;
  cycle: "Primaire" | "Secondaire";
  niveau: NiveauCoeffReference;
  serie: SerieBacReference;
  matiere: string;
  coefficient: number;
};

export const COEFFICIENTS_GRILLE_REFERENCE_DEFAULT: CoefficientGrilleReferenceRow[] = [
  // Primaire (pondération simplifiée MVP)
  { id: 1, cycle: "Primaire", niveau: "CP1", serie: "none", matiere: "Français", coefficient: 2 },
  { id: 2, cycle: "Primaire", niveau: "CP1", serie: "none", matiere: "Mathématiques", coefficient: 2 },
  { id: 3, cycle: "Primaire", niveau: "CP1", serie: "none", matiere: "Sciences & Technologie", coefficient: 1 },
  { id: 4, cycle: "Primaire", niveau: "CP1", serie: "none", matiere: "EDHC", coefficient: 1 },
  { id: 5, cycle: "Primaire", niveau: "CP1", serie: "none", matiere: "EPS", coefficient: 1 },
  { id: 6, cycle: "Primaire", niveau: "CP1", serie: "none", matiere: "Arts plastiques / Musique", coefficient: 1 },

  { id: 7, cycle: "Primaire", niveau: "CM2", serie: "none", matiere: "Français", coefficient: 2 },
  { id: 8, cycle: "Primaire", niveau: "CM2", serie: "none", matiere: "Mathématiques", coefficient: 2 },
  { id: 9, cycle: "Primaire", niveau: "CM2", serie: "none", matiere: "Sciences & Technologie", coefficient: 1 },
  { id: 10, cycle: "Primaire", niveau: "CM2", serie: "none", matiere: "EDHC", coefficient: 1 },
  { id: 11, cycle: "Primaire", niveau: "CM2", serie: "none", matiere: "EPS", coefficient: 1 },
  { id: 12, cycle: "Primaire", niveau: "CM2", serie: "none", matiere: "Arts plastiques / Musique", coefficient: 1 },

  // Secondaire 1er cycle
  { id: 20, cycle: "Secondaire", niveau: "6ème", serie: "none", matiere: "Français", coefficient: 3 },
  { id: 21, cycle: "Secondaire", niveau: "5ème", serie: "none", matiere: "Français", coefficient: 3 },
  { id: 22, cycle: "Secondaire", niveau: "4ème", serie: "none", matiere: "Français", coefficient: 3 },
  { id: 23, cycle: "Secondaire", niveau: "3ème", serie: "none", matiere: "Français", coefficient: 4 },

  { id: 24, cycle: "Secondaire", niveau: "6ème", serie: "none", matiere: "Mathématiques", coefficient: 3 },
  { id: 25, cycle: "Secondaire", niveau: "5ème", serie: "none", matiere: "Mathématiques", coefficient: 3 },
  { id: 26, cycle: "Secondaire", niveau: "4ème", serie: "none", matiere: "Mathématiques", coefficient: 3 },
  { id: 27, cycle: "Secondaire", niveau: "3ème", serie: "none", matiere: "Mathématiques", coefficient: 3 },

  { id: 28, cycle: "Secondaire", niveau: "6ème", serie: "none", matiere: "Histoire-Géographie", coefficient: 2 },
  { id: 29, cycle: "Secondaire", niveau: "5ème", serie: "none", matiere: "Histoire-Géographie", coefficient: 2 },
  { id: 30, cycle: "Secondaire", niveau: "4ème", serie: "none", matiere: "Histoire-Géographie", coefficient: 2 },
  { id: 31, cycle: "Secondaire", niveau: "3ème", serie: "none", matiere: "Histoire-Géographie", coefficient: 2 },

  { id: 32, cycle: "Secondaire", niveau: "6ème", serie: "none", matiere: "SVT", coefficient: 2 },
  { id: 33, cycle: "Secondaire", niveau: "5ème", serie: "none", matiere: "SVT", coefficient: 2 },
  { id: 34, cycle: "Secondaire", niveau: "4ème", serie: "none", matiere: "SVT", coefficient: 2 },
  { id: 35, cycle: "Secondaire", niveau: "3ème", serie: "none", matiere: "SVT", coefficient: 2 },

  { id: 36, cycle: "Secondaire", niveau: "6ème", serie: "none", matiere: "Physique-Chimie", coefficient: 2 },
  { id: 37, cycle: "Secondaire", niveau: "5ème", serie: "none", matiere: "Physique-Chimie", coefficient: 2 },
  { id: 38, cycle: "Secondaire", niveau: "4ème", serie: "none", matiere: "Physique-Chimie", coefficient: 2 },
  { id: 39, cycle: "Secondaire", niveau: "3ème", serie: "none", matiere: "Physique-Chimie", coefficient: 2 },

  { id: 40, cycle: "Secondaire", niveau: "6ème", serie: "none", matiere: "Anglais (LV1)", coefficient: 2 },
  { id: 41, cycle: "Secondaire", niveau: "5ème", serie: "none", matiere: "Anglais (LV1)", coefficient: 2 },
  { id: 42, cycle: "Secondaire", niveau: "4ème", serie: "none", matiere: "Anglais (LV1)", coefficient: 2 },
  { id: 43, cycle: "Secondaire", niveau: "3ème", serie: "none", matiere: "Anglais (LV1)", coefficient: 2 },

  { id: 44, cycle: "Secondaire", niveau: "4ème", serie: "none", matiere: "Allemand/Espagnol (LV2)", coefficient: 1 },
  { id: 45, cycle: "Secondaire", niveau: "3ème", serie: "none", matiere: "Allemand/Espagnol (LV2)", coefficient: 1 },

  // Seconde A/C (commune)
  { id: 50, cycle: "Secondaire", niveau: "2nde", serie: "none", matiere: "Français", coefficient: 4 },
  { id: 51, cycle: "Secondaire", niveau: "2nde", serie: "none", matiere: "Mathématiques", coefficient: 3 },
  { id: 52, cycle: "Secondaire", niveau: "2nde", serie: "none", matiere: "Histoire-Géographie", coefficient: 2 },
  { id: 53, cycle: "Secondaire", niveau: "2nde", serie: "none", matiere: "SVT", coefficient: 2 },
  { id: 54, cycle: "Secondaire", niveau: "2nde", serie: "none", matiere: "Physique-Chimie", coefficient: 2 },
  { id: 55, cycle: "Secondaire", niveau: "2nde", serie: "none", matiere: "Anglais (LV1)", coefficient: 2 },
  { id: 56, cycle: "Secondaire", niveau: "2nde", serie: "none", matiere: "LV2", coefficient: 1 },
  { id: 57, cycle: "Secondaire", niveau: "2nde", serie: "none", matiere: "Philosophie", coefficient: 1 },
  { id: 58, cycle: "Secondaire", niveau: "2nde", serie: "none", matiere: "EDHC", coefficient: 1 },
  { id: 59, cycle: "Secondaire", niveau: "2nde", serie: "none", matiere: "EPS", coefficient: 1 },
  { id: 60, cycle: "Secondaire", niveau: "2nde", serie: "none", matiere: "Arts plastiques / Musique", coefficient: 1 },

  // Terminale par série (extraits principaux)
  { id: 70, cycle: "Secondaire", niveau: "Terminale", serie: "A1", matiere: "Français / Littérature", coefficient: 5 },
  { id: 71, cycle: "Secondaire", niveau: "Terminale", serie: "A1", matiere: "Philosophie", coefficient: 4 },
  { id: 72, cycle: "Secondaire", niveau: "Terminale", serie: "A1", matiere: "Mathématiques", coefficient: 1 },
  { id: 73, cycle: "Secondaire", niveau: "Terminale", serie: "A1", matiere: "Histoire-Géographie", coefficient: 3 },
  { id: 74, cycle: "Secondaire", niveau: "Terminale", serie: "A1", matiere: "Anglais (LV1)", coefficient: 3 },

  { id: 80, cycle: "Secondaire", niveau: "Terminale", serie: "A2", matiere: "Français / Littérature", coefficient: 4 },
  { id: 81, cycle: "Secondaire", niveau: "Terminale", serie: "A2", matiere: "Philosophie", coefficient: 3 },
  { id: 82, cycle: "Secondaire", niveau: "Terminale", serie: "A2", matiere: "Mathématiques", coefficient: 3 },
  { id: 83, cycle: "Secondaire", niveau: "Terminale", serie: "A2", matiere: "Histoire-Géographie", coefficient: 3 },
  { id: 84, cycle: "Secondaire", niveau: "Terminale", serie: "A2", matiere: "Anglais (LV1)", coefficient: 3 },

  { id: 90, cycle: "Secondaire", niveau: "Terminale", serie: "B", matiere: "Économie", coefficient: 5 },
  { id: 91, cycle: "Secondaire", niveau: "Terminale", serie: "B", matiere: "Mathématiques", coefficient: 3 },
  { id: 92, cycle: "Secondaire", niveau: "Terminale", serie: "B", matiere: "Français / Littérature", coefficient: 3 },
  { id: 93, cycle: "Secondaire", niveau: "Terminale", serie: "B", matiere: "Philosophie", coefficient: 3 },
  { id: 94, cycle: "Secondaire", niveau: "Terminale", serie: "B", matiere: "Histoire-Géographie", coefficient: 3 },

  { id: 100, cycle: "Secondaire", niveau: "Terminale", serie: "C", matiere: "Mathématiques", coefficient: 7 },
  { id: 101, cycle: "Secondaire", niveau: "Terminale", serie: "C", matiere: "Physique-Chimie", coefficient: 5 },
  { id: 102, cycle: "Secondaire", niveau: "Terminale", serie: "C", matiere: "SVT", coefficient: 2 },
  { id: 103, cycle: "Secondaire", niveau: "Terminale", serie: "C", matiere: "Français / Littérature", coefficient: 2 },
  { id: 104, cycle: "Secondaire", niveau: "Terminale", serie: "C", matiere: "Philosophie", coefficient: 2 },

  { id: 110, cycle: "Secondaire", niveau: "Terminale", serie: "D", matiere: "SVT", coefficient: 5 },
  { id: 111, cycle: "Secondaire", niveau: "Terminale", serie: "D", matiere: "Mathématiques", coefficient: 4 },
  { id: 112, cycle: "Secondaire", niveau: "Terminale", serie: "D", matiere: "Physique-Chimie", coefficient: 3 },
  { id: 113, cycle: "Secondaire", niveau: "Terminale", serie: "D", matiere: "Français / Littérature", coefficient: 2 },
  { id: 114, cycle: "Secondaire", niveau: "Terminale", serie: "D", matiere: "Histoire-Géographie", coefficient: 2 },
];

function isNiveauCoeffReference(value: string): value is NiveauCoeffReference {
  return (
    [
      "CP1",
      "CP2",
      "CE1",
      "CE2",
      "CM1",
      "CM2",
      "6ème",
      "5ème",
      "4ème",
      "3ème",
      "2nde",
      "1ère",
      "Terminale",
    ] as const
  ).includes(value as NiveauCoeffReference);
}

function isSerieBacReference(value: string): value is SerieBacReference {
  return (["A1", "A2", "B", "C", "D", "none"] as const).includes(value as SerieBacReference);
}

export function normalizeCoeffGrilleRows(parsed: unknown): CoefficientGrilleReferenceRow[] {
  if (!Array.isArray(parsed)) return COEFFICIENTS_GRILLE_REFERENCE_DEFAULT;
  const rows = parsed
    .map((item) => {
      const r = item as Record<string, unknown>;
      const id = Number(r.id);
      const coefficient = Number(r.coefficient);
      const cycle = r.cycle === "Primaire" || r.cycle === "Secondaire" ? r.cycle : null;
      const niveau = typeof r.niveau === "string" && isNiveauCoeffReference(r.niveau) ? r.niveau : null;
      const serie = typeof r.serie === "string" && isSerieBacReference(r.serie) ? r.serie : null;
      const matiere = typeof r.matiere === "string" ? r.matiere.trim() : "";
      if (!Number.isFinite(id) || !cycle || !niveau || !serie || !matiere || !Number.isFinite(coefficient)) {
        return null;
      }
      return {
        id,
        cycle,
        niveau,
        serie,
        matiere,
        coefficient: Math.max(1, Math.min(9, coefficient)),
      } satisfies CoefficientGrilleReferenceRow;
    })
    .filter((x): x is CoefficientGrilleReferenceRow => x !== null);

  if (rows.length === 0) return COEFFICIENTS_GRILLE_REFERENCE_DEFAULT;
  return rows;
}

export function loadCoeffGrilleFromStorage(): CoefficientGrilleReferenceRow[] {
  if (typeof window === "undefined") return COEFFICIENTS_GRILLE_REFERENCE_DEFAULT;
  try {
    const raw = localStorage.getItem(COEFF_GRILLE_REFERENCE_STORAGE_KEY);
    if (!raw) return COEFFICIENTS_GRILLE_REFERENCE_DEFAULT;
    return normalizeCoeffGrilleRows(JSON.parse(raw));
  } catch {
    return COEFFICIENTS_GRILLE_REFERENCE_DEFAULT;
  }
}

export function saveCoeffGrilleToStorage(rows: CoefficientGrilleReferenceRow[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COEFF_GRILLE_REFERENCE_STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // ignore
  }
}
