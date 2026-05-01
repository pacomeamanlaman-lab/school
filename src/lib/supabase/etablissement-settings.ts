import type { SupabaseClient } from "@supabase/supabase-js";
import type { TimetableTechConfig } from "@/lib/timetable-tech-config";
import { DEFAULT_TIMETABLE_TECH_CONFIG } from "@/lib/timetable-tech-config";
import type { FraisScolaireItem } from "@/lib/frais-scolaires";
import { getDefaultFrais } from "@/lib/frais-scolaires";
import type { CoefficientGrilleReferenceRow } from "@/lib/coefficients-grille-reference";
import { COEFFICIENTS_GRILLE_REFERENCE_DEFAULT } from "@/lib/coefficients-grille-reference";

export type EtablissementSettingsJson = {
  timetableTech?: TimetableTechConfig;
  fraisParNiveau?: FraisParNiveauStored[];
  coeffGrilleRows?: CoefficientGrilleReferenceRow[];
};

export type FraisParNiveauStored = {
  id: string;
  niveau: string;
  montant: number;
  cycle: "Primaire" | "Secondaire";
};

export type EtablissementRow = {
  id: string;
  nom: string;
  adresse: string;
  ville: string | null;
  code_postal: string | null;
  telephone: string | null;
  email: string | null;
  directeur: string | null;
  logo_url: string | null;
  site_web: string | null;
  settings: EtablissementSettingsJson | null;
};

function asSettings(raw: unknown): EtablissementSettingsJson {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as EtablissementSettingsJson;
  return {};
}

/**
 * Établissement « principal » (MVP mono-établissement).
 * Tri par `id` (stable) — ne pas trier par `nom` : un changement de nom changeait l’ordre et
 * au rechargement une autre ligne pouvait passer en premier (données « anciennes » affichées).
 */
export async function fetchPrimaryEtablissement(
  supabase: SupabaseClient
): Promise<{ row: EtablissementRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("etablissements")
    .select("id, nom, adresse, ville, code_postal, telephone, email, directeur, logo_url, site_web, settings")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) return { row: null, error: error.message };
  if (!data) return { row: null, error: null };
  return {
    row: {
      id: data.id as string,
      nom: data.nom as string,
      adresse: data.adresse as string,
      ville: (data.ville as string | null) ?? null,
      code_postal: (data.code_postal as string | null) ?? null,
      telephone: (data.telephone as string | null) ?? null,
      email: (data.email as string | null) ?? null,
      directeur: (data.directeur as string | null) ?? null,
      logo_url: (data.logo_url as string | null) ?? null,
      site_web: (data as { site_web?: string | null }).site_web ?? null,
      settings: asSettings((data as { settings?: unknown }).settings),
    },
    error: null,
  };
}

export async function mergeEtablissementSettings(
  supabase: SupabaseClient,
  etablissementId: string,
  patch: Partial<EtablissementSettingsJson>
): Promise<{ error: string | null }> {
  const { data, error: e1 } = await supabase.from("etablissements").select("settings").eq("id", etablissementId).maybeSingle();
  if (e1) return { error: e1.message };
  const prev = asSettings(data?.settings);
  const next = { ...prev, ...patch };
  const { data: updated, error: e2 } = await supabase
    .from("etablissements")
    .update({ settings: next })
    .eq("id", etablissementId)
    .select("id")
    .maybeSingle();
  if (e2) return { error: e2.message };
  if (!updated)
    return {
      error:
        "Aucune ligne mise à jour (droits RLS ou id invalide). Ajoutez une politique UPDATE sur etablissements pour les utilisateurs connectés.",
    };
  return { error: null };
}

export function loadTimetableFromSettings(settings: EtablissementSettingsJson | null | undefined): TimetableTechConfig {
  const t = settings?.timetableTech;
  if (t && typeof t === "object" && "dayStart" in t) return t as TimetableTechConfig;
  return { ...DEFAULT_TIMETABLE_TECH_CONFIG };
}

/** Config EDT technique (mono-établissement) : toujours depuis `etablissements.settings`. */
export async function fetchTimetableTechConfig(supabase: SupabaseClient): Promise<TimetableTechConfig> {
  const { row, error } = await fetchPrimaryEtablissement(supabase);
  if (error || !row) return loadTimetableFromSettings(null);
  return loadTimetableFromSettings(row.settings);
}

export function loadFraisFromSettings(settings: EtablissementSettingsJson | null | undefined): FraisParNiveauStored[] {
  const list = settings?.fraisParNiveau;
  if (Array.isArray(list) && list.length) {
    return list.filter((x) => x && typeof x.id === "string" && x.niveau && typeof x.montant === "number");
  }
  return getDefaultFrais().map((f) => ({
    id: `default-${f.id}`,
    niveau: f.niveau,
    montant: f.montant,
    cycle: f.cycle as "Primaire" | "Secondaire",
  }));
}

export function loadCoeffGrilleFromSettings(
  settings: EtablissementSettingsJson | null | undefined
): CoefficientGrilleReferenceRow[] {
  const rows = settings?.coeffGrilleRows;
  if (Array.isArray(rows) && rows.length) return rows as CoefficientGrilleReferenceRow[];
  return COEFFICIENTS_GRILLE_REFERENCE_DEFAULT.map((r) => ({ ...r }));
}
