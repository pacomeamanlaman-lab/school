/** Schéma DB : lundi, mardi, … — UI : Lundi, Mardi, … */
export const DAY_LABEL_TO_DB: Record<string, string> = {
  Lundi: "lundi",
  Mardi: "mardi",
  Mercredi: "mercredi",
  Jeudi: "jeudi",
  Vendredi: "vendredi",
};

export const DAY_DB_TO_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(DAY_LABEL_TO_DB).map(([k, v]) => [v, k])
);

export function dayLabelFromDb(jour: string): string {
  return DAY_DB_TO_LABEL[jour.toLowerCase()] ?? jour;
}

export function dayDbFromLabel(label: string): string {
  return DAY_LABEL_TO_DB[label] ?? label.toLowerCase();
}
