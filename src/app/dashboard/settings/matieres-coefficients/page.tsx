"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Edit, Plus, Trash2 } from "lucide-react";
import AddMatiereModal from "@/components/AddMatiereModal";
import Modal from "@/components/Modal";
import CoefficientGrilleReferencePanel from "@/components/CoefficientGrilleReferencePanel";
import {
  niveauxPourFiltreCycle,
  NIVEAUX_PRIMAIRE_CI as NIVEAUX_PRIMAIRE,
  NIVEAUX_SECONDAIRE_CI as NIVEAUX_SECONDAIRE,
} from "@/lib/cycles-scolaires-ci";
import type {
  CoefficientGrilleReferenceRow,
  NiveauCoeffReference,
  SerieBacReference,
} from "@/lib/coefficients-grille-reference";
import { loadCoeffGrilleFromStorage, saveCoeffGrilleToStorage } from "@/lib/coefficients-grille-reference";

type CycleMatiere = "Primaire" | "Secondaire" | "Les_deux";
type NiveauCoefficient = (typeof NIVEAUX_PRIMAIRE)[number] | (typeof NIVEAUX_SECONDAIRE)[number];

type MatiereItem = {
  id: number;
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

const DEFAULT_MATIERES: MatiereItem[] = [
  { id: 1, nom: "Français", coefficient: 3, couleur: "#00aef0", cycle: "Les_deux", niveaux: ALL_NIVEAUX, active: true },
  {
    id: 2,
    nom: "Mathématiques",
    coefficient: 3,
    couleur: "#10a7aa",
    cycle: "Les_deux",
    niveaux: ALL_NIVEAUX,
    active: true,
  },
  {
    id: 3,
    nom: "Histoire-Géo",
    coefficient: 2,
    couleur: "#f59e0b",
    cycle: "Secondaire",
    niveaux: [...NIVEAUX_SECONDAIRE],
    active: true,
  },
  { id: 4, nom: "Sciences", coefficient: 2, couleur: "#10b981", cycle: "Les_deux", niveaux: ALL_NIVEAUX, active: true },
  {
    id: 5,
    nom: "Anglais",
    coefficient: 2,
    couleur: "#8b5cf6",
    cycle: "Secondaire",
    niveaux: [...NIVEAUX_SECONDAIRE],
    active: true,
  },
  { id: 6, nom: "EPS", coefficient: 1, couleur: "#ef4444", cycle: "Les_deux", niveaux: ALL_NIVEAUX, active: true },
];

export default function MatieresCoefficientsSettingsPage() {
  const [matieres, setMatieres] = useState<MatiereItem[]>(DEFAULT_MATIERES);
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

  useEffect(() => {
    if (!isCoeffGrilleModalOpen) return;
    setCoeffGrilleRows(loadCoeffGrilleFromStorage());
    setCoeffCycleFilter("all");
    setCoeffNiveauFilter("all");
    setCoeffSerieFilter("all");
    setCoeffSearch("");
  }, [isCoeffGrilleModalOpen]);

  const handleUpdateCoeffGrilleRow = (id: number, next: number) => {
    setCoeffGrilleRows((rows) => {
      const updated = rows.map((r) => (r.id === id ? { ...r, coefficient: Math.max(1, Math.min(9, next || 1)) } : r));
      saveCoeffGrilleToStorage(updated);
      return updated;
    });
  };

  const handleAddMatiere = (newMatiere: Omit<MatiereItem, "id">) => {
    const nom = newMatiere.nom.trim();
    if (!nom || newMatiere.niveaux.length === 0) {
      alert("Veuillez renseigner la matiere et au moins un niveau.");
      return;
    }
    const duplicate = matieres.some((m) => m.nom.toLowerCase() === nom.toLowerCase() && m.cycle === newMatiere.cycle);
    if (duplicate) {
      alert("Une matiere avec ce nom existe deja pour ce cycle.");
      return;
    }
    const nextId = matieres.reduce((max, m) => Math.max(max, m.id), 0) + 1;
    setMatieres([...matieres, { ...newMatiere, nom, id: nextId }]);
  };

  const handleAddMatieresBatch = (rows: Omit<MatiereItem, "id">[]) => {
    if (rows.length === 0) return;
    let nextId = matieres.reduce((max, m) => Math.max(max, m.id), 0);
    const merged = [...matieres];
    let added = 0;
    for (const row of rows) {
      const nom = row.nom.trim();
      if (!nom || row.niveaux.length === 0) continue;
      const exists = merged.some((m) => m.nom.toLowerCase() === nom.toLowerCase() && m.cycle === row.cycle);
      if (exists) continue;
      nextId += 1;
      merged.push({ ...row, nom, id: nextId });
      added += 1;
    }
    setMatieres(merged);
    alert(`${added} matiere(s) ajoutee(s).`);
  };

  const handleEditMatiere = (updatedMatiere: MatiereItem) => {
    const nom = updatedMatiere.nom.trim();
    if (!nom || updatedMatiere.niveaux.length === 0) {
      alert("Veuillez renseigner la matiere et au moins un niveau.");
      return;
    }
    setMatieres(matieres.map((m) => (m.id === updatedMatiere.id ? { ...updatedMatiere, nom } : m)));
    setEditingMatiere(null);
  };

  const handleDeleteMatiere = (id: number) => {
    if (confirm("Etes-vous sur de vouloir supprimer cette matiere ?")) {
      setMatieres(matieres.filter((m) => m.id !== id));
    }
  };

  const handleToggleMatiereActive = (id: number) => {
    setMatieres(matieres.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));
  };

  const niveauxDisponiblesFiltreMatieres =
    matiereCycleFilter === "all"
      ? niveauxPourFiltreCycle("Les_deux")
      : matiereCycleFilter === "Les_deux"
      ? niveauxPourFiltreCycle("Les_deux")
      : niveauxPourFiltreCycle(matiereCycleFilter);

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Retour aux parametres
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Matieres & Coefficients</h1>
          <p className="text-muted-foreground">Gestion dediee des matieres par cycle et niveaux.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-success" />
              Matieres
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Gestion par cycle et niveaux pour les ecoles primaire/secondaire mixtes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsCoeffGrilleModalOpen(true)} className="text-sm text-primary hover:underline">
              Grille officielle
            </button>
            <button
              onClick={() => setIsAddMatiereOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-success/10 hover:bg-success/20 text-success rounded-lg transition font-medium border border-success/20"
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
                      <span className="inline-block h-3.5 w-3.5 rounded-full" style={{ backgroundColor: matiere.couleur }}></span>
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
                      onClick={() => handleToggleMatiereActive(matiere.id)}
                      className={`rounded-md px-2 py-1 text-xs font-medium ${
                        matiere.active ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                      }`}
                    >
                      {matiere.active ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditingMatiere(matiere)} className="p-2 hover:bg-accent rounded-lg transition">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteMatiere(matiere.id)} className="p-2 hover:bg-accent rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        onSubmit={handleAddMatiere}
        onSubmitBatch={handleAddMatieresBatch}
        existingMatieres={matieres.map((m) => ({ nom: m.nom, cycle: m.cycle }))}
      />

      {editingMatiere && (
        <AddMatiereModal
          isOpen={!!editingMatiere}
          onClose={() => setEditingMatiere(null)}
          onSubmit={handleEditMatiere}
          matiere={editingMatiere}
          existingMatieres={matieres.map((m) => ({ nom: m.nom, cycle: m.cycle }))}
        />
      )}
    </div>
  );
}

