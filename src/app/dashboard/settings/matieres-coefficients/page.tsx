"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Edit, Plus, Trash2 } from "lucide-react";
import AddMatiereModal from "@/components/AddMatiereModal";
import FlashNotice from "@/components/FlashNotice";
import { useFlashNotice } from "@/hooks/useFlashNotice";
import Modal from "@/components/Modal";
import CoefficientGrilleReferencePanel from "@/components/CoefficientGrilleReferencePanel";
import {
  inferCycleFromNiveau,
  niveauxPourFiltreCycle,
  NIVEAUX_PRIMAIRE_CI as NIVEAUX_PRIMAIRE,
  NIVEAUX_SECONDAIRE_CI as NIVEAUX_SECONDAIRE,
} from "@/lib/cycles-scolaires-ci";
import type {
  CoefficientGrilleReferenceRow,
  NiveauCoeffReference,
  SerieBacReference,
} from "@/lib/coefficients-grille-reference";
import { createClient } from "@/lib/supabase/client";
import {
  fetchPrimaryEtablissement,
  loadCoeffGrilleFromSettings,
  mergeEtablissementSettings,
} from "@/lib/supabase/etablissement-settings";
import { fetchDistinctActiveClassNiveaux } from "@/lib/supabase/fetch-class-niveaux";

type CycleMatiere = "Primaire" | "Secondaire" | "Les_deux";
type NiveauCoefficient = (typeof NIVEAUX_PRIMAIRE)[number] | (typeof NIVEAUX_SECONDAIRE)[number];

export type MatiereItem = {
  id: string;
  nom: string;
  coefficient: number;
  coefficientMode?: "unique" | "par_cycle" | "par_niveau";
  coefficientsParCycle?: { primaire: number; secondaire: number };
  coefficientsParNiveau?: Partial<Record<NiveauCoefficient, number>>;
  couleur: string;
  cycle: CycleMatiere;
  niveaux: string[];
  seriesTerminale?: Array<"A1" | "A2" | "B" | "C" | "D">;
  active: boolean;
};

const ALL_NIVEAUX = [...NIVEAUX_PRIMAIRE, ...NIVEAUX_SECONDAIRE];

function mapRowToMatiere(r: {
  id: string;
  nom: string;
  coefficient: number | string;
  couleur: string | null;
  is_active?: boolean | null;
}): MatiereItem {
  return {
    id: r.id,
    nom: r.nom as string,
    coefficient: Number(r.coefficient),
    couleur: (r.couleur as string) || "#6b7280",
    cycle: "Les_deux",
    niveaux: ALL_NIVEAUX,
    active: r.is_active !== false,
  };
}

export default function MatieresCoefficientsSettingsPage() {
  const [etablissementId, setEtablissementId] = useState<string | null>(null);
  const [matieres, setMatieres] = useState<MatiereItem[]>([]);
  const [isAddMatiereOpen, setIsAddMatiereOpen] = useState(false);
  const [editingMatiere, setEditingMatiere] = useState<MatiereItem | null>(null);
  const [matiereCycleFilter, setMatiereCycleFilter] = useState<"all" | CycleMatiere>("all");
  const [matiereNiveauFilter, setMatiereNiveauFilter] = useState("all");
  const [matiereSearch, setMatiereSearch] = useState("");
  const [isCoeffGrilleModalOpen, setIsCoeffGrilleModalOpen] = useState(false);
  const [coeffGrilleRows, setCoeffGrilleRows] = useState<CoefficientGrilleReferenceRow[]>([]);
  const [coeffCycleFilter, setCoeffCycleFilter] = useState<"all" | "Primaire" | "Secondaire">("all");
  const [coeffNiveauFilter, setCoeffNiveauFilter] = useState<"all" | NiveauCoeffReference>("all");
  const [coeffSerieFilter, setCoeffSerieFilter] = useState<"all" | SerieBacReference>("all");
  const [coeffSearch, setCoeffSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbClassNiveaux, setDbClassNiveaux] = useState<string[]>([]);
  const { notice, flash } = useFlashNotice();

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    setError(null);
    const { row: etab, error: e0 } = await fetchPrimaryEtablissement(supabase);
    if (e0 || !etab) {
      setError(e0 ?? "Établissement introuvable.");
      setLoading(false);
      return;
    }
    setEtablissementId(etab.id);
    setCoeffGrilleRows(loadCoeffGrilleFromSettings(etab.settings));

    const classNv = await fetchDistinctActiveClassNiveaux(supabase);
    setDbClassNiveaux(classNv);

    const { data: rows, error: e1 } = await supabase
      .from("matieres")
      .select("id, nom, coefficient, couleur, is_active")
      .eq("etablissement_id", etab.id)
      .order("nom");
    if (e1) {
      const { data: fallback, error: e2 } = await supabase
        .from("matieres")
        .select("id, nom, coefficient, couleur")
        .eq("etablissement_id", etab.id)
        .order("nom");
      if (e2) {
        setError(e2.message);
        setLoading(false);
        return;
      }
      setMatieres((fallback ?? []).map((r) => mapRowToMatiere({ ...r, is_active: true })));
    } else {
      setMatieres((rows ?? []).map((r) => mapRowToMatiere(r as Parameters<typeof mapRowToMatiere>[0])));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isCoeffGrilleModalOpen || !etablissementId) return;
    const supabase = createClient();
    void (async () => {
      const { row } = await fetchPrimaryEtablissement(supabase);
      if (row) setCoeffGrilleRows(loadCoeffGrilleFromSettings(row.settings));
    })();
    setCoeffCycleFilter("all");
    setCoeffNiveauFilter("all");
    setCoeffSerieFilter("all");
    setCoeffSearch("");
  }, [isCoeffGrilleModalOpen, etablissementId]);

  const persistCoeffRows = async (updated: CoefficientGrilleReferenceRow[]) => {
    if (!etablissementId) return;
    const supabase = createClient();
    const { error: e } = await mergeEtablissementSettings(supabase, etablissementId, { coeffGrilleRows: updated });
    if (e) setError(e);
  };

  const handleUpdateCoeffGrilleRow = (id: number, next: number) => {
    setCoeffGrilleRows((rows) => {
      const updated = rows.map((r) => (r.id === id ? { ...r, coefficient: Math.max(1, Math.min(9, next || 1)) } : r));
      void persistCoeffRows(updated);
      return updated;
    });
  };

  const handleAddMatiere = async (newMatiere: Omit<MatiereItem, "id">) => {
    if (!etablissementId) return;
    const nom = newMatiere.nom.trim();
    if (!nom) return;
    const supabase = createClient();
    const { data, error: e } = await supabase
      .from("matieres")
      .insert({
        etablissement_id: etablissementId,
        nom,
        coefficient: newMatiere.coefficient,
        couleur: newMatiere.couleur || "#6b7280",
        is_active: newMatiere.active !== false,
      })
      .select("id, nom, coefficient, couleur, is_active")
      .single();
    if (e) {
      flash(e.message, "error");
      return;
    }
    setMatieres((prev) => [...prev, mapRowToMatiere(data as Parameters<typeof mapRowToMatiere>[0])]);
    flash("Matière ajoutée.", "success");
  };

  const handleAddMatieresBatch = async (batch: Omit<MatiereItem, "id">[]) => {
    if (!etablissementId || batch.length === 0) return;
    const supabase = createClient();
    const inserts = batch.map((row) => ({
      etablissement_id: etablissementId,
      nom: row.nom.trim(),
      coefficient: row.coefficient,
      couleur: row.couleur || "#6b7280",
      is_active: row.active !== false,
    }));
    const { data, error: e } = await supabase.from("matieres").insert(inserts).select("id, nom, coefficient, couleur, is_active");
    if (e) {
      flash(e.message, "error");
      return;
    }
    setMatieres((prev) => [...prev, ...(data ?? []).map((r) => mapRowToMatiere(r as Parameters<typeof mapRowToMatiere>[0]))]);
    flash(`${data?.length ?? 0} matière(s) ajoutée(s).`, "success");
  };

  const handleEditMatiere = async (updatedMatiere: MatiereItem) => {
    const nom = updatedMatiere.nom.trim();
    if (!nom) return;
    const supabase = createClient();
    const { error: e } = await supabase
      .from("matieres")
      .update({
        nom,
        coefficient: updatedMatiere.coefficient,
        couleur: updatedMatiere.couleur,
        is_active: updatedMatiere.active !== false,
      })
      .eq("id", updatedMatiere.id);
    if (e) {
      flash(e.message, "error");
      return;
    }
    setMatieres((prev) => prev.map((m) => (m.id === updatedMatiere.id ? { ...updatedMatiere, nom } : m)));
    setEditingMatiere(null);
    flash("Matière mise à jour.", "success");
  };

  const handleDeleteMatiere = async (id: string) => {
    if (!confirm("Etes-vous sur de vouloir supprimer cette matiere ?")) return;
    const supabase = createClient();
    const { error: e } = await supabase.from("matieres").delete().eq("id", id);
    if (e) {
      flash(e.message, "error");
      return;
    }
    setMatieres((prev) => prev.filter((m) => m.id !== id));
    flash("Matière supprimée.", "success");
  };

  const handleToggleMatiereActive = async (id: string) => {
    const m = matieres.find((x) => x.id === id);
    if (!m) return;
    const next = !m.active;
    const supabase = createClient();
    const { error: e } = await supabase.from("matieres").update({ is_active: next }).eq("id", id);
    if (e) {
      flash(e.message, "error");
      return;
    }
    setMatieres((prev) => prev.map((x) => (x.id === id ? { ...x, active: next } : x)));
  };

  const niveauxDisponiblesFiltreMatieres = useMemo(() => {
    const fallback =
      matiereCycleFilter === "all" || matiereCycleFilter === "Les_deux"
        ? niveauxPourFiltreCycle("Les_deux")
        : niveauxPourFiltreCycle(matiereCycleFilter);
    if (!dbClassNiveaux.length) return fallback;
    const filt =
      matiereCycleFilter === "all" || matiereCycleFilter === "Les_deux"
        ? dbClassNiveaux
        : dbClassNiveaux.filter((n) => inferCycleFromNiveau(n) === matiereCycleFilter);
    return filt.length ? filt : fallback;
  }, [dbClassNiveaux, matiereCycleFilter]);

  const matieresFiltrees = matieres
    .filter((matiere) => {
      const matchSearch = matiere.nom.toLowerCase().includes(matiereSearch.toLowerCase());
      const matchCycle = matiereCycleFilter === "all" || matiere.cycle === matiereCycleFilter || matiere.cycle === "Les_deux";
      const matchNiveau = matiereNiveauFilter === "all" || matiere.niveaux.includes(matiereNiveauFilter);
      return matchSearch && matchCycle && matchNiveau;
    })
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr-FR"));

  return (
    <div className="space-y-6">
      <FlashNotice payload={notice} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Retour aux parametres
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Matieres & Coefficients</h1>
          <p className="text-muted-foreground">Table `matieres` (coefficient, couleur, actif)</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-success" />
              Matieres
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Les champs cycle / niveaux détaillés du formulaire servent à la saisie ; seuls nom, coefficient et couleur
              sont persistés en base sur ce schéma.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsCoeffGrilleModalOpen(true)} className="text-sm text-primary hover:underline">
              Grille officielle
            </button>
            <button
              type="button"
              disabled={loading || !etablissementId}
              onClick={() => setIsAddMatiereOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-success/10 hover:bg-success/20 text-success rounded-lg transition font-medium border border-success/20 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input
            type="search"
            value={matiereSearch}
            onChange={(e) => setMatiereSearch(e.target.value)}
            placeholder="Rechercher une matiere..."
            className="px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={matiereCycleFilter}
            onChange={(e) => {
              setMatiereCycleFilter(e.target.value as "all" | CycleMatiere);
              setMatiereNiveauFilter("all");
            }}
            className="px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Tous les cycles</option>
            <option value="Primaire">Primaire</option>
            <option value="Secondaire">Secondaire</option>
            <option value="Les_deux">Les deux</option>
          </select>
          <select
            value={matiereNiveauFilter}
            onChange={(e) => setMatiereNiveauFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Tous les niveaux</option>
            {niveauxDisponiblesFiltreMatieres.map((niveau) => (
              <option key={niveau} value={niveau}>
                {niveau}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          {loading ? (
            <p className="p-6 text-muted-foreground">Chargement…</p>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Matiere</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Cycle</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Niveaux concernes</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Coefficient</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Statut</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {matieresFiltrees.map((matiere) => (
                  <tr key={matiere.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-3.5 w-3.5 rounded-full" style={{ backgroundColor: matiere.couleur }} />
                        <span className="font-medium text-foreground">{matiere.nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{matiere.cycle === "Les_deux" ? "Les deux" : matiere.cycle}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {matiere.niveaux.length > 3 ? `${matiere.niveaux.slice(0, 3).join(", ")} +${matiere.niveaux.length - 3}` : matiere.niveaux.join(", ")}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{matiere.coefficient}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => void handleToggleMatiereActive(matiere.id)}
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          matiere.active ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                        }`}
                      >
                        {matiere.active ? "Actif" : "Inactif"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => setEditingMatiere(matiere)} className="p-2 hover:bg-accent rounded-lg transition">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => void handleDeleteMatiere(matiere.id)} className="p-2 hover:bg-accent rounded-lg transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={isCoeffGrilleModalOpen} onClose={() => setIsCoeffGrilleModalOpen(false)} title="Grille des coefficients (reference)" size="xl">
        <div className="space-y-4">
          <CoefficientGrilleReferencePanel
            rows={coeffGrilleRows}
            onUpdateRow={handleUpdateCoeffGrilleRow}
            search={coeffSearch}
            onSearchChange={setCoeffSearch}
            cycleFilter={coeffCycleFilter}
            onCycleFilterChange={setCoeffCycleFilter}
            niveauFilter={coeffNiveauFilter}
            onNiveauFilterChange={setCoeffNiveauFilter}
            serieFilter={coeffSerieFilter}
            onSerieFilterChange={setCoeffSerieFilter}
          />
          <div className="flex justify-end">
            <Link
              href="/dashboard/settings/coefficients-reference"
              onClick={() => setIsCoeffGrilleModalOpen(false)}
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition"
            >
              Ouvrir en plein ecran
            </Link>
          </div>
        </div>
      </Modal>

      <AddMatiereModal
        isOpen={isAddMatiereOpen}
        onClose={() => setIsAddMatiereOpen(false)}
        onSubmit={(d) => void handleAddMatiere(d as Omit<MatiereItem, "id">)}
        onSubmitBatch={(rows) => void handleAddMatieresBatch(rows as Omit<MatiereItem, "id">[])}
        existingMatieres={matieres.map((m) => ({ nom: m.nom, cycle: m.cycle }))}
        classNiveauxFromDb={dbClassNiveaux}
      />

      {editingMatiere && (
        <AddMatiereModal
          isOpen={!!editingMatiere}
          onClose={() => setEditingMatiere(null)}
          onSubmit={(d) => void handleEditMatiere(d as MatiereItem)}
          matiere={editingMatiere}
          existingMatieres={matieres.map((m) => ({ nom: m.nom, cycle: m.cycle }))}
          classNiveauxFromDb={dbClassNiveaux}
        />
      )}
    </div>
  );
}
