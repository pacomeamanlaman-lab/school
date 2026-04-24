import {
  inferCycleFromNiveau,
  niveauFraisPourClasse,
  type CycleScolaire,
} from "./cycles-scolaires-ci";

export const FRAIS_STORAGE_KEY = "school_frais_scolaires";

export type FraisScolaireItem = {
  id: number;
  niveau: string;
  montant: number;
  cycle: CycleScolaire;
};

export function getDefaultFrais(): FraisScolaireItem[] {
  return [
    { id: 1, cycle: "Primaire", niveau: "CP1", montant: 45000 },
    { id: 2, cycle: "Primaire", niveau: "CE1", montant: 50000 },
    { id: 3, cycle: "Primaire", niveau: "CE2", montant: 55000 },
    { id: 4, cycle: "Primaire", niveau: "CM1", montant: 60000 },
    { id: 5, cycle: "Primaire", niveau: "CM2", montant: 75000 },
    { id: 6, cycle: "Secondaire", niveau: "6ème", montant: 100000 },
  ];
}

export function normalizeFraisList(parsed: unknown): FraisScolaireItem[] {
  if (!Array.isArray(parsed)) return getDefaultFrais();
  const out = parsed
    .map((raw, i) => {
      const f = raw as Record<string, unknown>;
      const niveau = String(f.niveau ?? "").trim();
      if (!niveau) return null;
      const id = typeof f.id === "number" ? f.id : i + 1;
      const montant = Number(f.montant) || 0;
      const cycle: CycleScolaire =
        f.cycle === "Primaire" || f.cycle === "Secondaire"
          ? f.cycle
          : inferCycleFromNiveau(niveau);
      return { id, niveau, montant, cycle } satisfies FraisScolaireItem;
    })
    .filter((row): row is FraisScolaireItem => row !== null);
  return out.length > 0 ? out : getDefaultFrais();
}

export function loadFraisFromStorage(): FraisScolaireItem[] {
  if (typeof window === "undefined") return getDefaultFrais();
  try {
    const stored = localStorage.getItem(FRAIS_STORAGE_KEY);
    if (!stored) return getDefaultFrais();
    return normalizeFraisList(JSON.parse(stored));
  } catch {
    return getDefaultFrais();
  }
}

export function saveFraisToStorage(frais: FraisScolaireItem[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(FRAIS_STORAGE_KEY, JSON.stringify(frais));
  }
}

export function getMontantParClasse(classe: string): number {
  const resolved = niveauFraisPourClasse(classe);
  const frais = loadFraisFromStorage();
  const found =
    frais.find((f) => f.niveau === classe) ??
    frais.find((f) => f.niveau === resolved);
  return found ? found.montant : 50000;
}
