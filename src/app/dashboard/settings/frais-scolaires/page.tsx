"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Coins, Edit, ListPlus, Plus, Save, Trash2 } from "lucide-react";
import type { FiltreCycleFrais } from "@/lib/cycles-scolaires-ci";
import { inferCycleFromNiveau, niveauxPourFiltreCycle } from "@/lib/cycles-scolaires-ci";
import type { FraisDraftLine, FraisScolaireItem } from "@/lib/frais-scolaires";
import {
  clearFraisDraftStorage,
  createDraftLine,
  getDefaultFrais,
  loadFraisDraftFromStorage,
  loadFraisFromStorage,
  saveFraisDraftToStorage,
  saveFraisToStorage,
} from "@/lib/frais-scolaires";

export default function FraisScolairesSettingsPage() {
  const [fraisScolaires, setFraisScolaires] = useState<FraisScolaireItem[]>(getDefaultFrais());
  const [editingFrais, setEditingFrais] = useState<{ id: number; montant: number } | null>(null);
  const [isAddFraisOpen, setIsAddFraisOpen] = useState(false);
  const [newFraisForm, setNewFraisForm] = useState<{
    filtreCycle: FiltreCycleFrais;
    niveau: string;
    montant: number;
  }>({ filtreCycle: "Primaire", niveau: "", montant: 0 });
  const [fraisDraftQueue, setFraisDraftQueue] = useState<FraisDraftLine[]>([]);

  useEffect(() => {
    setFraisScolaires(loadFraisFromStorage());
  }, []);

  const handleUpdateFrais = (id: number, nouveauMontant: number) => {
    setFraisScolaires((prev) => prev.map((f) => (f.id === id ? { ...f, montant: nouveauMontant } : f)));
    setEditingFrais(null);
  };

  const handleDeleteFrais = (id: number) => {
    if (confirm("Etes-vous sur de vouloir supprimer ce niveau de frais ?")) {
      setFraisScolaires((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleSaveFrais = () => {
    saveFraisToStorage(fraisScolaires);
    alert("Configuration des frais scolaires enregistree avec succes !");
  };

  const persistDraft = (next: FraisDraftLine[]) => {
    setFraisDraftQueue(next);
    saveFraisDraftToStorage(next);
  };

  const handleAddFraisToDraft = () => {
    if (!newFraisForm.niveau || newFraisForm.montant <= 0) {
      alert("Veuillez remplir tous les champs correctement");
      return;
    }

    const niveauLower = newFraisForm.niveau.toLowerCase();
    if (fraisScolaires.some((f) => f.niveau.toLowerCase() === niveauLower)) {
      alert("Ce niveau existe deja dans les frais enregistres.");
      return;
    }
    if (fraisDraftQueue.some((f) => f.niveau.toLowerCase() === niveauLower)) {
      alert("Ce niveau est deja dans la liste d'attente.");
      return;
    }

    const cycle = inferCycleFromNiveau(newFraisForm.niveau);
    const line = createDraftLine(newFraisForm.niveau, newFraisForm.montant, cycle);
    persistDraft([...fraisDraftQueue, line]);
    setNewFraisForm((prev) => ({ ...prev, niveau: "" }));
  };

  const handleRemoveDraftLine = (draftId: string) => {
    persistDraft(fraisDraftQueue.filter((l) => l.draftId !== draftId));
  };

  const handleClearDraftQueue = () => {
    persistDraft([]);
  };

  const handleValidateFraisDraft = () => {
    if (fraisDraftQueue.length === 0) {
      alert("Ajoutez au moins un niveau a la liste avant d'enregistrer.");
      return;
    }
    let maxId = fraisScolaires.reduce((m, f) => Math.max(m, f.id), 0);
    const merged = [...fraisScolaires];
    for (const line of fraisDraftQueue) {
      if (merged.some((f) => f.niveau.toLowerCase() === line.niveau.toLowerCase())) continue;
      maxId += 1;
      merged.push({ id: maxId, niveau: line.niveau, montant: line.montant, cycle: line.cycle });
    }
    setFraisScolaires(merged);
    saveFraisToStorage(merged);
    clearFraisDraftStorage();
    setFraisDraftQueue([]);
    setNewFraisForm({ filtreCycle: "Primaire", niveau: "", montant: 0 });
    setIsAddFraisOpen(false);
    alert("Ajouts enregistres localement.");
  };

  const closeAddFraisModal = () => {
    setIsAddFraisOpen(false);
    setNewFraisForm({ filtreCycle: "Primaire", niveau: "", montant: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Retour aux parametres
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Frais scolaires par niveau</h1>
          <p className="text-muted-foreground">Configuration dediee des montants annuels par niveau.</p>
        </div>
        <button
          onClick={handleSaveFrais}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-white hover:bg-primary/90"
        >
          <Save className="h-4 w-4" />
          Enregistrer
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Coins className="w-5 h-5 text-warning" />
            Frais par niveau
          </h3>
          <button
            onClick={() => {
              setNewFraisForm({ filtreCycle: "Primaire", niveau: "", montant: 0 });
              setFraisDraftQueue(loadFraisDraftFromStorage());
              setIsAddFraisOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-4 py-2.5 font-medium text-success hover:bg-success/20"
          >
            <Plus className="h-4 w-4" />
            Ajouter niveau
          </button>
        </div>

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
                    onClick={() => setEditingFrais({ id: frais.id, montant: frais.montant })}
                    className="p-1.5 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-primary"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFrais(frais.id)}
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
                    onClick={() => handleUpdateFrais(editingFrais.id, editingFrais.montant)}
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
      </div>

      {isAddFraisOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAddFraisModal}></div>
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
                {niveauxPourFiltreCycle(newFraisForm.filtreCycle).map((n) => (
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
                <p className="text-sm text-muted-foreground">Aucun niveau pour l'instant.</p>
              ) : (
                <ul className="space-y-2">
                  {fraisDraftQueue.map((line) => (
                    <li key={line.draftId} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm">
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
              <button onClick={closeAddFraisModal} className="px-4 py-2 border border-input rounded-lg hover:bg-accent">
                Fermer
              </button>
              <button
                onClick={handleValidateFraisDraft}
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

