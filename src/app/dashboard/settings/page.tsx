"use client";

import { useState } from "react";
import { School, Calendar, BookOpen, Save, Plus, Edit, Trash2 } from "lucide-react";
import AddMatiereModal from "@/components/AddMatiereModal";
import AddTrimestreModal from "@/components/AddTrimestreModal";

export default function SettingsPage() {
  const [schoolInfo, setSchoolInfo] = useState({
    nom: "École Primaire & Collège Saint-Exupéry",
    adresse: "123 Avenue de l'Éducation, 75001 Paris",
    telephone: "+33 1 23 45 67 89",
    email: "contact@ecole-saint-exupery.fr",
    siteWeb: "www.ecole-saint-exupery.fr",
    directeur: "M. Pierre Dupont",
  });

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

  const [matieres, setMatieres] = useState([
    { id: 1, nom: "Français", coefficient: 3, couleur: "#00aef0" },
    { id: 2, nom: "Mathématiques", coefficient: 3, couleur: "#10a7aa" },
    { id: 3, nom: "Histoire-Géo", coefficient: 2, couleur: "#f59e0b" },
    { id: 4, nom: "Sciences", coefficient: 2, couleur: "#10b981" },
    { id: 5, nom: "Anglais", coefficient: 2, couleur: "#8b5cf6" },
    { id: 6, nom: "EPS", coefficient: 1, couleur: "#ef4444" },
    { id: 7, nom: "Arts plastiques", coefficient: 1, couleur: "#ec4899" },
    { id: 8, nom: "Musique", coefficient: 1, couleur: "#6366f1" },
  ]);

  const [isAddMatiereOpen, setIsAddMatiereOpen] = useState(false);
  const [editingMatiere, setEditingMatiere] = useState<any>(null);
  const [isAddTrimestreOpen, setIsAddTrimestreOpen] = useState(false);
  const [editingTrimestre, setEditingTrimestre] = useState<any>(null);

  const handleSaveSchoolInfo = () => {
    alert("Informations de l'école enregistrées avec succès !");
  };

  const handleAddMatiere = (newMatiere: any) => {
    const matiere = {
      id: matieres.length + 1,
      ...newMatiere,
    };
    setMatieres([...matieres, matiere]);
  };

  const handleEditMatiere = (updatedMatiere: any) => {
    setMatieres(matieres.map(m => m.id === updatedMatiere.id ? updatedMatiere : m));
    setEditingMatiere(null);
  };

  const handleDeleteMatiere = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette matière ?")) {
      setMatieres(matieres.filter(m => m.id !== id));
    }
  };

  const handleAddTrimestre = (newTrimestre: any) => {
    const trimestre = {
      id: trimestres.length + 1,
      ...newTrimestre,
    };
    setTrimestres([...trimestres, trimestre]);
  };

  const handleEditTrimestre = (updatedTrimestre: any) => {
    setTrimestres(trimestres.map(t => t.id === updatedTrimestre.id ? updatedTrimestre : t));
    setEditingTrimestre(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">Configuration générale de l'établissement</p>
      </div>

      {/* Informations de l'école */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <School className="w-5 h-5 text-primary" />
          Informations de l'école
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nom de l'établissement <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={schoolInfo.nom}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, nom: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Directeur/Directrice <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={schoolInfo.directeur}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, directeur: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              Adresse <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={schoolInfo.adresse}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, adresse: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Téléphone <span className="text-danger">*</span>
            </label>
            <input
              type="tel"
              value={schoolInfo.telephone}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, telephone: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              value={schoolInfo.email}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Site Web
            </label>
            <input
              type="url"
              value={schoolInfo.siteWeb}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, siteWeb: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSaveSchoolInfo}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
        </div>
      </div>

      {/* Année scolaire */}
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
            id="active"
            checked={anneeScolaire.active}
            onChange={(e) => setAnneeScolaire({ ...anneeScolaire, active: e.target.checked })}
            className="w-4 h-4 text-primary border-input rounded focus:ring-2 focus:ring-ring"
          />
          <label htmlFor="active" className="text-sm font-medium text-foreground">
            Année scolaire active
          </label>
        </div>
      </div>

      {/* Trimestres */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-info" />
            Trimestres
          </h3>
          <button
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
                  Du {new Date(trimestre.dateDebut).toLocaleDateString('fr-FR')} au {new Date(trimestre.dateFin).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
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

      {/* Matières */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-success" />
            Matières & Coefficients
          </h3>
          <button
            onClick={() => setIsAddMatiereOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-success/10 hover:bg-success/20 text-success rounded-lg transition font-medium border border-success/20"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {matieres.map((matiere) => (
            <div key={matiere.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: matiere.couleur }}
                ></div>
                <div>
                  <p className="font-semibold text-foreground">{matiere.nom}</p>
                  <p className="text-sm text-muted-foreground">Coefficient: {matiere.coefficient}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingMatiere(matiere)}
                  className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-primary"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteMatiere(matiere.id)}
                  className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-danger"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <AddMatiereModal
        isOpen={isAddMatiereOpen}
        onClose={() => setIsAddMatiereOpen(false)}
        onSubmit={handleAddMatiere}
      />

      {editingMatiere && (
        <AddMatiereModal
          isOpen={!!editingMatiere}
          onClose={() => setEditingMatiere(null)}
          onSubmit={handleEditMatiere}
          matiere={editingMatiere}
        />
      )}

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
