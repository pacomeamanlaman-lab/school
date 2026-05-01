import type { Database } from "@/lib/supabase/types";

/** Valeurs de l’enum PostgreSQL `classes.niveau` (schéma Supabase). */
export type ClasseNiveau = Database["public"]["Tables"]["classes"]["Row"]["niveau"];

/** Ordre pédagogique — à garder aligné avec la contrainte en base. */
export const CLASS_NIVEAUX_ORDERED: readonly ClasseNiveau[] = [
  "CP",
  "CE1",
  "CE2",
  "CM1",
  "CM2",
  "6ème",
] as const;
