"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import CoefficientGrilleReferencePanel from "@/components/CoefficientGrilleReferencePanel";
import type {
  CoefficientGrilleReferenceRow,
  NiveauCoeffReference,
  SerieBacReference,
} from "@/lib/coefficients-grille-reference";
import { createClient } from "@/lib/supabase/client";
import { fetchPrimaryEtablissement, loadCoeffGrilleFromSettings, mergeEtablissementSettings } from "@/lib/supabase/etablissement-settings";

export default function CoefficientsReferencePage() {
  const [etablissementId, setEtablissementId] = useState<string | null>(null);
  const [rows, setRows] = useState<CoefficientGrilleReferenceRow[]>([]);
  const [coeffCycleFilter, setCoeffCycleFilter] = useState<"all" | "Primaire" | "Secondaire">("all");
  const [coeffNiveauFilter, setCoeffNiveauFilter] = useState<"all" | NiveauCoeffReference>("all");
  const [coeffSerieFilter, setCoeffSerieFilter] = useState<"all" | SerieBacReference>("all");
  const [coeffSearch, setCoeffSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    const { row, error } = await fetchPrimaryEtablissement(supabase);
    if (error || !row) {
      setRows(loadCoeffGrilleFromSettings(null));
      setFeedback(error ?? "Établissement introuvable — affichage des valeurs par défaut.");
      setLoading(false);
      return;
    }
    setEtablissementId(row.id);
    setRows(loadCoeffGrilleFromSettings(row.settings));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const persistRows = async (updated: CoefficientGrilleReferenceRow[]) => {
    setRows(updated);
    if (!etablissementId) return;
    const supabase = createClient();
    const { error } = await mergeEtablissementSettings(supabase, etablissementId, { coeffGrilleRows: updated });
    if (error) {
      setFeedback(`Erreur sauvegarde: ${error}`);
      return;
    }
    setFeedback("Grille enregistrée dans Supabase.");
  };

  const handleUpdateCoeffRow = (id: number, next: number) => {
    const updated = rows.map((r) =>
      r.id === id ? { ...r, coefficient: Math.max(1, Math.min(9, next || 1)) } : r
    );
    void persistRows(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux paramètres
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Grille des coefficients (référence)</h1>
          <p className="text-muted-foreground">Stockée dans `etablissements.settings.coeffGrilleRows`</p>
        </div>
        <button
          type="button"
          disabled={loading || !etablissementId}
          onClick={() => void persistRows(rows)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Ré-enregistrer tout
        </button>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Chargement…</p> : null}
      {feedback ? <p className="text-sm text-info">{feedback}</p> : null}

      <div className="bg-card border border-border rounded-xl p-6">
        <CoefficientGrilleReferencePanel
          rows={rows}
          onUpdateRow={handleUpdateCoeffRow}
          search={coeffSearch}
          onSearchChange={setCoeffSearch}
          cycleFilter={coeffCycleFilter}
          onCycleFilterChange={setCoeffCycleFilter}
          niveauFilter={coeffNiveauFilter}
          onNiveauFilterChange={setCoeffNiveauFilter}
          serieFilter={coeffSerieFilter}
          onSerieFilterChange={setCoeffSerieFilter}
        />
      </div>
    </div>
  );
}
