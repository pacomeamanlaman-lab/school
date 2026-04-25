"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Calendar, Edit, Plus, Save } from "lucide-react";
import AddTrimestreModal from "@/components/AddTrimestreModal";

export default function AnneeScolaireSettingsPage() {
  const [anneeScolaire, setAnneeScolaire] = useState({
    annee: "2024-2025",
    dateDebut: "2024-09-01",
    dateFin: "2025-06-30",
    active: true,
  });

  const [trimestres, setTrimestres] = useState([
    { id: 1, nom: "Trimestre 1", dateDebut: "2024-09-01", dateFin: "2024-12-20" },
    { id: 2, nom: "Trimestre 2", dateDebut: "2025-01-06", dateFin: "2025-03-28" },
    { id: 3, nom: "Trimestre 3", dateDebut: "2025-04-14", dateFin: "2025-06-30" },
  ]);

  const [isAddTrimestreOpen, setIsAddTrimestreOpen] = useState(false);
  const [editingTrimestre, setEditingTrimestre] = useState<{
    id: number;
    nom: string;
    dateDebut: string;
    dateFin: string;
  } | null>(null);

  const handleSaveAnnee = () => {
    alert("Année scolaire et calendrier enregistrés avec succès !");
  };

  const handleAddTrimestre = (newTrimestre: { nom: string; dateDebut: string; dateFin: string }) => {
    const trimestre = {
      id: trimestres.length ? Math.max(...trimestres.map((t) => t.id)) + 1 : 1,
      ...newTrimestre,
    };
    setTrimestres([...trimestres, trimestre]);
  };

  const handleEditTrimestre = (updatedTrimestre: {
    id: number;
    nom: string;
    dateDebut: string;
    dateFin: string;
  }) => {
    setTrimestres(trimestres.map((t) => (t.id === updatedTrimestre.id ? updatedTrimestre : t)));
    setEditingTrimestre(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Retour aux parametres
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Année scolaire</h1>
        <p className="text-muted-foreground">Période officielle et découpage en trimestres.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-secondary" />
          Année scolaire
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Année <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={anneeScolaire.annee}
              onChange={(e) => setAnneeScolaire({ ...anneeScolaire, annee: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date de début <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={anneeScolaire.dateDebut}
              onChange={(e) => setAnneeScolaire({ ...anneeScolaire, dateDebut: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date de fin <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={anneeScolaire.dateFin}
              onChange={(e) => setAnneeScolaire({ ...anneeScolaire, dateFin: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            id="active-annee"
            checked={anneeScolaire.active}
            onChange={(e) => setAnneeScolaire({ ...anneeScolaire, active: e.target.checked })}
            className="w-4 h-4 text-primary border-input rounded focus:ring-2 focus:ring-ring"
          />
          <label htmlFor="active-annee" className="text-sm font-medium text-foreground">
            Année scolaire active
          </label>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-info" />
            Trimestres
          </h3>
          <button
            type="button"
            onClick={() => setIsAddTrimestreOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-info/10 hover:bg-info/20 text-info rounded-lg transition font-medium border border-info/20"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>

        <div className="space-y-3">
          {trimestres.map((trimestre) => (
            <div key={trimestre.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex-1">
                <p className="font-semibold text-foreground">{trimestre.nom}</p>
                <p className="text-sm text-muted-foreground">
                  Du {new Date(trimestre.dateDebut).toLocaleDateString("fr-FR")} au{" "}
                  {new Date(trimestre.dateFin).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditingTrimestre(trimestre)}
                  className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-primary"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveAnnee}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20"
        >
          <Save className="w-4 h-4" />
          Enregistrer
        </button>
      </div>

      <AddTrimestreModal
        isOpen={isAddTrimestreOpen}
        onClose={() => setIsAddTrimestreOpen(false)}
        onSubmit={handleAddTrimestre}
      />

      {editingTrimestre && (
        <AddTrimestreModal
          isOpen={!!editingTrimestre}
          onClose={() => setEditingTrimestre(null)}
          onSubmit={handleEditTrimestre}
          trimestre={editingTrimestre}
        />
      )}
    </div>
  );
}
