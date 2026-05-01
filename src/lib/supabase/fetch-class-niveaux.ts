import type { SupabaseClient } from "@supabase/supabase-js";
import { CLASS_NIVEAUX_ORDERED, type ClasseNiveau } from "@/lib/supabase/class-niveaux";

/** Ordre stable pour tout libellé `classes.niveau` (enum + hors-enum). */
export function sortClassNiveauStrings(levels: string[]): string[] {
  const order = new Map(CLASS_NIVEAUX_ORDERED.map((n, i) => [n, i]));
  return [...new Set(levels)].sort(
    (a, b) =>
      (order.get(a as ClasseNiveau) ?? 999) - (order.get(b as ClasseNiveau) ?? 999) ||
      a.localeCompare(b, "fr")
  );
}

/** `DISTINCT niveau` des classes actives. */
export async function fetchDistinctActiveClassNiveaux(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase.from("classes").select("niveau").eq("status", "active");
  if (error || !data?.length) return [];
  return sortClassNiveauStrings(data.map((r) => String(r.niveau)));
}
