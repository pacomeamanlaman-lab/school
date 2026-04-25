"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import CoefficientGrilleReferencePanel from "@/components/CoefficientGrilleReferencePanel";
import type {
  CoefficientGrilleReferenceRow,
  NiveauCoeffReference,
  SerieBacReference,
} from "@/lib/coefficients-grille-reference";
import { loadCoeffGrilleFromStorage, saveCoeffGrilleToStorage } from "@/lib/coefficients-grille-reference";

export default function CoefficientsReferencePage() {
  const [rows, setRows] = useState<CoefficientGrilleReferenceRow[]>([]);
  const [coeffCycleFilter, setCoeffCycleFilter] = useState<"all" | "Primaire" | "Secondaire">("all");
  const [coeffNiveauFilter, setCoeffNiveauFilter] = useState<"all" | NiveauCoeffReference>("all");
  const [coeffSerieFilter, setCoeffSerieFilter] = useState<"all" | SerieBacReference>("all");
  const [coeffSearch, setCoeffSearch] = useState("");

  useEffect(() => {
    setRows(loadCoeffGrilleFromStorage());
  }, []);

  const handleUpdateCoeffRow = (id: number, next: number) => {
    setRows((prev) => {
      const updated = prev.map((r) =>
        r.id === id ? { ...r, coefficient: Math.max(1, Math.min(9, next || 1)) } : r
      );
      saveCoeffGrilleToStorage(updated);
      return updated;
    });
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
          <p className="text-muted-foreground">Consultation et ajustements détaillés sur une page dédiée.</p>
        </div>
      </div>

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
