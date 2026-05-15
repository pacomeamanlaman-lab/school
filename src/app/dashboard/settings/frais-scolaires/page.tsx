"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Coins, Edit, ListPlus, Plus, Save, Trash2 } from "lucide-react";
import type { FiltreCycleFrais } from "@/lib/cycles-scolaires-ci";
import { inferCycleFromNiveau, niveauxPourFiltreCycle } from "@/lib/cycles-scolaires-ci";
import FlashNotice from "@/components/FlashNotice";
import { useFlashNotice } from "@/hooks/useFlashNotice";
import { createClient } from "@/lib/supabase/client";
import {
  fetchPrimaryEtablissement,
  loadFraisFromSettings,
  mergeEtablissementSettings,
  type FraisParNiveauStored,
} from "@/lib/supabase/etablissement-settings";
import { fetchDistinctActiveClassNiveaux } from "@/lib/supabase/fetch-class-niveaux";

type FraisDraftLine = {
  draftId: string;
  niveau: string;
  montant: number;
  cycle: "Primaire" | "Secondaire";
};

function newDraftId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function FraisScolairesSettingsPage() {
  const [etablissementId, setEtablissementId] = useState<string | null>(null);
  const [fraisScolaires, setFraisScolaires] = useState<FraisParNiveauStored[]>([]);
  const [editingFrais, setEditingFrais] = useState<{ id: string; montant: number } | null>(null);
  const [isAddFraisOpen, setIsAddFraisOpen] = useState(false);
  const [newFraisForm, setNewFraisForm] = useState<{
    filtreCycle: FiltreCycleFrais;
    niveau: string;
    montant: number;
  }>({ filtreCycle: "Primaire", niveau: "", montant: 0 });
  const [fraisDraftQueue, setFraisDraftQueue] = useState<FraisDraftLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbClassNiveaux, setDbClassNiveaux] = useState<string[]>([]);
  const { notice, flash } = useFlashNotice();

  const persistFrais = useCallback(
    async (next: FraisParNiveauStored[]) => {
      if (!etablissementId) return { error: "Pas d'établissement" };
      const supabase = createClient();
      return mergeEtablissementSettings(supabase, etablissementId, { fraisParNiveau: next });
    },
    [etablissementId]
  );

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    setError(null);
    const { row, error: e0 } = await fetchPrimaryEtablissement(supabase);
    if (e0 || !row) {
      setError(e0 ?? "Établissement introuvable.");
      setLoading(false);
      return;
    }
    setEtablissementId(row.id);
    setFraisScolaires(loadFraisFromSettings(row.settings));
    const nv = await fetchDistinctActiveClassNiveaux(supabase);
    setDbClassNiveaux(nv);
    setLoading(false);
  }, []);

  const niveauxOptionsAjoutFrais = useMemo(() => {
    const filtre = newFraisForm.filtreCycle;
    const fromDb = dbClassNiveaux.filter((n) => {
      if (filtre === "Les_deux") return true;
      return inferCycleFromNiveau(n) === filtre;
    });
    return fromDb.length ? fromDb : niveauxPourFiltreCycle(filtre);
  }, [dbClassNiveaux, newFraisForm.filtreCycle]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpdateFrais = async (id: string, nouveauMontant: number) => {
    const next = fraisScolaires.map((f) => (f.id === id ? { ...f, montant: nouveauMontant } : f));
    setFraisScolaires(next);
    setEditingFrais(null);
    const { error: e } = await persistFrais(next);
    if (e) setError(e);
  };

  const handleDeleteFrais = async (id: string) => {
    if (!confirm("Etes-vous sur de vouloir supprimer ce niveau de frais ?")) return;
    const next = fraisScolaires.filter((f) => f.id !== id);
    setFraisScolaires(next);
    const { error: e } = await persistFrais(next);
    if (e) setError(e);
  };

  const handleSaveFrais = async () => {
    setSaving(true);
    const { error: e } = await persistFrais(fraisScolaires);
    setSaving(false);
    if (e) {
      setError(e);
      return;
    }
    flash("Configuration enregistrée.", "success");
  };

  const handleAddFraisToDraft = () => {
    if (!newFraisForm.niveau || newFraisForm.montant <= 0) {
      flash("Veuillez remplir tous les champs correctement.", "error");
      return;
    }
    const niveauLower = newFraisForm.niveau.toLowerCase();
    if (fraisScolaires.some((f) => f.niveau.toLowerCase() === niveauLower)) {
      flash("Ce niveau existe déjà dans les frais enregistrés.", "error");
      return;
    }
    if (fraisDraftQueue.some((f) => f.niveau.toLowerCase() === niveauLower)) {
      flash("Ce niveau est déjà dans la liste d'attente.", "error");
      return;
    }
    const cycle = inferCycleFromNiveau(newFraisForm.niveau) as "Primaire" | "Secondaire";
    setFraisDraftQueue((q) => [...q, { draftId: newDraftId(), niveau: newFraisForm.niveau, montant: newFraisForm.montant, cycle }]);
    setNewFraisForm((prev) => ({ ...prev, niveau: "" }));
  };

  const handleRemoveDraftLine = (draftId: string) => {
    setFraisDraftQueue((q) => q.filter((l) => l.draftId !== draftId));
  };

  const handleClearDraftQueue = () => setFraisDraftQueue([]);

  const handleValidateFraisDraft = async () => {
    if (fraisDraftQueue.length === 0) {
      flash("Ajoutez au moins un niveau à la liste avant d'enregistrer.", "error");
      return;
    }
    const merged: FraisParNiveauStored[] = [...fraisScolaires];
    for (const line of fraisDraftQueue) {
      if (merged.some((f) => f.niveau.toLowerCase() === line.niveau.toLowerCase())) continue;
      merged.push({
        id: `frais-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        niveau: line.niveau,
        montant: line.montant,
        cycle: line.cycle,
      });
    }
    setFraisScolaires(merged);
    setFraisDraftQueue([]);
    setNewFraisForm({ filtreCycle: "Primaire", niveau: "", montant: 0 });
    setIsAddFraisOpen(false);
    const { error: e } = await persistFrais(merged);
    if (e) setError(e);
    else flash("Ajouts enregistrés.", "success");
  };

  const closeAddFraisModal = () => {
    setIsAddFraisOpen(false);
    setNewFraisForm({ filtreCycle: "Primaire", niveau: "", montant: 0 });
  };

  return (
    <div className="space-y-6">
      <FlashNotice payload={notice} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Retour aux parametres
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Frais scolaires par niveau</h1>
          <p className="text-muted-foreground">Montants par niveau et cycle</p>
        </div>
        <button
          type="button"
          disabled={saving || !etablissementId}
          onClick={() => void handleSaveFrais()}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-white hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
        >
          <Save className="h-4 w-4" />
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 min-w-0">
            <Coins className="w-5 h-5 shrink-0 text-warning" />
            Frais par niveau
          </h3>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setNewFraisForm({ filtreCycle: "Primaire", niveau: "", montant: 0 });
              setFraisDraftQueue([]);
              setIsAddFraisOpen(true);
            }}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-success/20 bg-success/10 px-4 py-2.5 font-medium text-success hover:bg-success/20 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Ajouter niveau
          </button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fraisScolaires.map((frais) => (
              <div key={frais.id} className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{frais.cycle}</p>
                    <span className="text-sm font-semibold text-foreground">{frais.niveau}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingFrais({ id: frais.id, montant: frais.montant })}
                      className="p-1.5 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-primary"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteFrais(frais.id)}
                      className="p-1.5 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {editingFrais?.id === frais.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editingFrais.montant}
                      onChange={(e) =>
                        setEditingFrais({
                          ...editingFrais,
                          montant: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="flex-1 px-3 py-2 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => void handleUpdateFrais(editingFrais.id, editingFrais.montant)}
                      className="px-3 py-2 bg-success hover:bg-success/90 text-white rounded-lg transition text-sm font-medium"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-warning">{frais.montant.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">FCFA</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isAddFraisOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAddFraisModal} aria-hidden />
          <div className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Ajouter un niveau de frais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={newFraisForm.filtreCycle}
                onChange={(e) => setNewFraisForm({ ...newFraisForm, filtreCycle: e.target.value as FiltreCycleFrais, niveau: "" })}
                className="px-4 py-2.5 bg-white border border-input rounded-lg"
              >
                <option value="Primaire">Primaire</option>
                <option value="Secondaire">Secondaire</option>
                <option value="Les_deux">Les deux</option>
              </select>
              <select
                value={newFraisForm.niveau}
                onChange={(e) => setNewFraisForm({ ...newFraisForm, niveau: e.target.value })}
                className="px-4 py-2.5 bg-white border border-input rounded-lg"
              >
                <option value="">Niveau</option>
                {niveauxOptionsAjoutFrais.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={newFraisForm.montant || ""}
                onChange={(e) => setNewFraisForm({ ...newFraisForm, montant: parseInt(e.target.value, 10) || 0 })}
                className="px-4 py-2.5 bg-white border border-input rounded-lg"
                placeholder="Montant FCFA"
              />
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={handleAddFraisToDraft}
                className="inline-flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-2.5 font-medium text-success hover:bg-success/20"
              >
                <ListPlus className="h-4 w-4" />
                Ajouter a la liste
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">En attente</p>
                {fraisDraftQueue.length > 0 && (
                  <button type="button" onClick={handleClearDraftQueue} className="text-xs font-medium text-danger hover:underline">
                    Tout vider
                  </button>
                )}
              </div>
              {fraisDraftQueue.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun niveau pour l&apos;instant.</p>
              ) : (
                <ul className="space-y-2">
                  {fraisDraftQueue.map((line) => (
                    <li
                      key={line.draftId}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    >
                      <span>
                        {line.niveau} - {line.montant.toLocaleString()} FCFA
                      </span>
                      <button type="button" onClick={() => handleRemoveDraftLine(line.draftId)} className="text-danger hover:underline">
                        Retirer
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button type="button" onClick={closeAddFraisModal} className="px-4 py-2 border border-input rounded-lg hover:bg-accent">
                Fermer
              </button>
              <button
                type="button"
                onClick={() => void handleValidateFraisDraft()}
                disabled={fraisDraftQueue.length === 0}
                className="px-4 py-2 bg-success text-white rounded-lg disabled:opacity-50"
              >
                Enregistrer les ajouts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
