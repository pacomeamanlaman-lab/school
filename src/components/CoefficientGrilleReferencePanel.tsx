"use client";

import { useMemo } from "react";
import type {
  CoefficientGrilleReferenceRow,
  NiveauCoeffReference,
  SerieBacReference,
} from "@/lib/coefficients-grille-reference";

type Props = {
  rows: CoefficientGrilleReferenceRow[];
  onUpdateRow: (id: number, next: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  cycleFilter: "all" | "Primaire" | "Secondaire";
  onCycleFilterChange: (value: "all" | "Primaire" | "Secondaire") => void;
  niveauFilter: "all" | NiveauCoeffReference;
  onNiveauFilterChange: (value: "all" | NiveauCoeffReference) => void;
  serieFilter: "all" | SerieBacReference;
  onSerieFilterChange: (value: "all" | SerieBacReference) => void;
  showIntro?: boolean;
};

const NIVEAUX_OPTIONS: NiveauCoeffReference[] = [
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
];

export default function CoefficientGrilleReferencePanel({
  rows,
  onUpdateRow,
  search,
  onSearchChange,
  cycleFilter,
  onCycleFilterChange,
  niveauFilter,
  onNiveauFilterChange,
  serieFilter,
  onSerieFilterChange,
  showIntro = true,
}: Props) {
  const filteredRows = useMemo(() => {
    return rows
      .filter((row) => {
        const matchCycle = cycleFilter === "all" || row.cycle === cycleFilter;
        const matchNiveau = niveauFilter === "all" || row.niveau === niveauFilter;
        const matchSerie = serieFilter === "all" || row.serie === serieFilter;
        const matchSearch =
          row.matiere.toLowerCase().includes(search.toLowerCase()) ||
          row.niveau.toLowerCase().includes(search.toLowerCase());
        return matchCycle && matchNiveau && matchSerie && matchSearch;
      })
      .sort((a, b) => a.matiere.localeCompare(b.matiere, "fr-FR"));
  }, [rows, cycleFilter, niveauFilter, serieFilter, search]);

  return (
    <div>
      {showIntro && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Grille des coefficients par classe / série</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Référence CI (MENA/DPFC) modifiable par l&apos;administration.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher matière ou niveau..."
          className="px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={cycleFilter}
          onChange={(e) => {
            onCycleFilterChange(e.target.value as "all" | "Primaire" | "Secondaire");
            onNiveauFilterChange("all");
            onSerieFilterChange("all");
          }}
          className="px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Tous les cycles</option>
          <option value="Primaire">Primaire</option>
          <option value="Secondaire">Secondaire</option>
        </select>
        <select
          value={niveauFilter}
          onChange={(e) => onNiveauFilterChange(e.target.value as "all" | NiveauCoeffReference)}
          className="px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Tous les niveaux</option>
          {NIVEAUX_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select
          value={serieFilter}
          onChange={(e) => onSerieFilterChange(e.target.value as "all" | SerieBacReference)}
          className="px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Toutes séries</option>
          <option value="none">Sans série</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Cycle</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Niveau</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Série</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Matière</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Coefficient</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Aucun coefficient ne correspond aux filtres.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3 text-sm">{row.cycle}</td>
                  <td className="px-4 py-3 text-sm">{row.niveau}</td>
                  <td className="px-4 py-3 text-sm">{row.serie === "none" ? "—" : row.serie}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{row.matiere}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="1"
                      max="9"
                      value={row.coefficient}
                      onChange={(e) => onUpdateRow(row.id, parseInt(e.target.value, 10) || 1)}
                      className="w-20 px-2.5 py-1.5 bg-white border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
