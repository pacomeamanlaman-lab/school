/** Nomenclature Côte d'Ivoire — cycles et niveaux pour frais / classes */

export type CycleScolaire = "Primaire" | "Secondaire";

/** Valeur UI du 1er select (filtre des niveaux proposés) */
export type FiltreCycleFrais = CycleScolaire | "Les_deux";

export const NIVEAUX_PRIMAIRE_CI = [
  "Maternelle",
  "CP1",
  "CP2",
  "CE1",
  "CE2",
  "CM1",
  "CM2",
] as const;

export const NIVEAUX_SECONDAIRE_CI = [
  "6ème",
  "5ème",
  "4ème",
  "3ème",
  "2nde",
  "1ère",
  "Terminale",
] as const;

export type NiveauPrimaireCI = (typeof NIVEAUX_PRIMAIRE_CI)[number];
export type NiveauSecondaireCI = (typeof NIVEAUX_SECONDAIRE_CI)[number];

const PRIMAIRE_SET = new Set<string>(NIVEAUX_PRIMAIRE_CI);
const SECONDAIRE_SET = new Set<string>(NIVEAUX_SECONDAIRE_CI);

export function inferCycleFromNiveau(niveau: string): CycleScolaire {
  const n = niveau.trim();
  if (PRIMAIRE_SET.has(n)) return "Primaire";
  if (SECONDAIRE_SET.has(n)) return "Secondaire";
  // Ancien libellé « CP » sans numéro → primaire
  if (n.toUpperCase() === "CP") return "Primaire";
  return "Primaire";
}

export function niveauxPourFiltreCycle(filtre: FiltreCycleFrais): string[] {
  if (filtre === "Primaire") return [...NIVEAUX_PRIMAIRE_CI];
  if (filtre === "Secondaire") return [...NIVEAUX_SECONDAIRE_CI];
  return [...NIVEAUX_PRIMAIRE_CI, ...NIVEAUX_SECONDAIRE_CI];
}

/** Harmonise l’ancienne étiquette « CP » avec CP1 pour la grille des frais */
export function niveauFraisPourClasse(classe: string): string {
  const c = classe.trim();
  if (c.toUpperCase() === "CP") return "CP1";
  return c;
}
