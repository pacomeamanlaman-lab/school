"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Users, User, Edit, Trash2, Eye } from "lucide-react";
import AddClassModal from "@/components/AddClassModal";

// Données de démonstration
const classesData = [
  {
    id: 1,
    name: "CP - Classe A",
    niveau: "CP",
    effectif: 25,
    capacite: 30,
    titulaire: "Mme Dupont",
    salle: "Salle 101",
    status: "active",
  },
  {
    id: 2,
    name: "CE1 - Classe A",
    niveau: "CE1",
    effectif: 28,
    capacite: 30,
    titulaire: "M. Martin",
    salle: "Salle 102",
    status: "active",
  },
  {
    id: 3,
    name: "CE2 - Classe A",
    niveau: "CE2",
    effectif: 22,
    capacite: 30,
    titulaire: "Mme Bernard",
    salle: "Salle 201",
    status: "active",
  },
  {
    id: 4,
    name: "CM1 - Classe A",
    niveau: "CM1",
    effectif: 30,
    capacite: 30,
    titulaire: "M. Petit",
    salle: "Salle 202",
    status: "active",
  },
  {
    id: 5,
    name: "CM2 - Classe A",
    niveau: "CM2",
    effectif: 27,
    capacite: 30,
    titulaire: "Mme Dubois",
    salle: "Salle 203",
    status: "active",
  },
  {
    id: 6,
    name: "6ème - Classe A",
    niveau: "6ème",
    effectif: 32,
    capacite: 35,
    titulaire: "M. Laurent",
    salle: "Salle 301",
    status: "active",
  },
];

export default function ClassesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [classes, setClasses] = useState(classesData);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);

  const filteredClasses = classes.filter((classe) =>
    classe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classe.titulaire.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClass = (newClass: any) => {
    const classe = {
      id: classes.length + 1,
      ...newClass,
      effectif: 0,
      status: "active",
    };
    setClasses([...classes, classe]);
  };

  const handleEditClass = (updatedClass: any) => {
    setClasses(classes.map(c => c.id === updatedClass.id ? updatedClass : c));
    setEditingClass(null);
  };

  const handleDeleteClass = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette classe ?")) {
      setClasses(classes.filter(c => c.id !== id));
    }
  };

  const getEffectifColor = (effectif: number, capacite: number) => {
    const percentage = (effectif / capacite) * 100;
    if (percentage >= 90) return "text-danger";
    if (percentage >= 75) return "text-warning";
    return "text-success";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des classes</h1>
          <p className="text-muted-foreground">Organisation des classes par niveau</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Créer une classe
        </button>
      </div>

      {/* Recherche */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Rechercher une classe ou un titulaire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total classes</p>
          <p className="text-2xl font-bold text-foreground mt-1">{classes.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total élèves</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {classes.reduce((sum, c) => sum + c.effectif, 0)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Moyenne par classe</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {Math.round(classes.reduce((sum, c) => sum + c.effectif, 0) / classes.length)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Classes pleines</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {classes.filter((c) => c.effectif >= c.capacite).length}
          </p>
        </div>
      </div>

      {/* Grille des classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((classe) => {
          const pourcentage = Math.round((classe.effectif / classe.capacite) * 100);
          return (
            <div
              key={classe.id}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{classe.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{classe.salle}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-semibold">
                  {classe.niveau}
                </span>
              </div>

              {/* Titulaire */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Titulaire</p>
                  <p className="text-sm font-medium text-foreground">{classe.titulaire}</p>
                </div>
              </div>

              {/* Effectif */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Effectif</span>
                  </div>
                  <span className={`text-sm font-bold ${getEffectifColor(classe.effectif, classe.capacite)}`}>
                    {classe.effectif}/{classe.capacite}
                  </span>
                </div>
                {/* Barre de progression */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      pourcentage >= 90
                        ? "bg-danger"
                        : pourcentage >= 75
                        ? "bg-warning"
                        : "bg-success"
                    }`}
                    style={{ width: `${pourcentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{pourcentage}% de remplissage</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <button
                  onClick={() => router.push(`/dashboard/classes/${classe.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-background hover:bg-accent border border-input rounded-lg transition text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Voir
                </button>
                <button
                  onClick={() => setEditingClass(classe)}
                  className="flex items-center justify-center p-2 hover:bg-accent border border-input rounded-lg transition"
                >
                  <Edit className="w-4 h-4 text-primary" />
                </button>
                <button
                  onClick={() => handleDeleteClass(classe.id)}
                  className="flex items-center justify-center p-2 hover:bg-accent border border-input rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4 text-danger" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message si aucun résultat */}
      {filteredClasses.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Aucune classe trouvée</h3>
          <p className="text-muted-foreground">Essayez avec d'autres mots-clés</p>
        </div>
      )}

      {/* Modals */}
      <AddClassModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddClass}
      />

      {editingClass && (
        <AddClassModal
          isOpen={!!editingClass}
          onClose={() => setEditingClass(null)}
          onSubmit={handleEditClass}
          classe={editingClass}
        />
      )}
    </div>
  );
}
