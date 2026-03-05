"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Users, Phone, Mail, Edit, Trash2, FileSpreadsheet } from "lucide-react";
import AddParentModal from "@/components/AddParentModal";

// Données de démonstration - Parents
const parentsData = [
  {
    id: 1,
    nom: "Jean Dupont",
    telephone: "+33 6 12 34 56 78",
    email: "jean.dupont@example.com",
    adresse: "12 Rue de l'École, 75001 Paris",
    profession: "Ingénieur",
    enfants: [
      { id: 1, nom: "Marie Dupont", classe: "CM2" },
    ],
  },
  {
    id: 2,
    nom: "Sophie Martin",
    telephone: "+33 6 23 45 67 89",
    email: "sophie.martin@example.com",
    adresse: "45 Avenue Victor Hugo, 75016 Paris",
    profession: "Médecin",
    enfants: [
      { id: 2, nom: "Jean Martin", classe: "CE1" },
      { id: 5, nom: "Lucas Martin", classe: "CP" },
    ],
  },
  {
    id: 3,
    nom: "Pierre Bernard",
    telephone: "+33 6 34 56 78 90",
    email: "pierre.bernard@example.com",
    adresse: "78 Boulevard Saint-Germain, 75005 Paris",
    profession: "Avocat",
    enfants: [
      { id: 3, nom: "Sophie Bernard", classe: "6ème" },
    ],
  },
  {
    id: 4,
    nom: "Marie Petit",
    telephone: "+33 6 45 67 89 01",
    email: "marie.petit@example.com",
    adresse: "23 Rue de la Paix, 75002 Paris",
    profession: "Professeur",
    enfants: [
      { id: 4, nom: "Lucas Petit", classe: "CM1" },
    ],
  },
];

export default function ParentsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [parents, setParents] = useState(parentsData);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<any>(null);

  const filteredParents = parents.filter((parent) =>
    parent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.telephone.includes(searchTerm)
  );

  const handleAddParent = (newParent: any) => {
    const parent = {
      id: parents.length + 1,
      ...newParent,
      enfants: [],
    };
    setParents([...parents, parent]);
  };

  const handleEditParent = (updatedParent: any) => {
    setParents(parents.map(p => p.id === updatedParent.id ? updatedParent : p));
    setEditingParent(null);
  };

  const handleDeleteParent = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce parent ?")) {
      setParents(parents.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Parents/Tuteurs</h1>
          <p className="text-muted-foreground">Liste complète des parents et tuteurs légaux</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Ajouter un parent
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un parent (nom, email, téléphone)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          {/* Export Excel */}
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-success rounded-lg transition font-medium border border-input shadow-sm">
            <FileSpreadsheet className="w-4 h-4" />
            Exporter en Excel
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Parents</p>
          <p className="text-2xl font-bold text-foreground mt-1">{parents.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Emails valides</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {parents.filter(p => p.email).length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Téléphones</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {parents.filter(p => p.telephone).length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Résultats</p>
          <p className="text-2xl font-bold text-foreground mt-1">{filteredParents.length}</p>
        </div>
      </div>

      {/* Liste des parents */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Parent/Tuteur</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Profession</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Enfants</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParents.map((parent) => (
                <tr key={parent.id} className="border-b border-border hover:bg-accent/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{parent.nom}</p>
                        <p className="text-sm text-muted-foreground">{parent.adresse}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{parent.telephone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{parent.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">{parent.profession}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {parent.enfants.map((enfant) => (
                        <div key={enfant.id} className="inline-flex items-center gap-2 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium mr-1">
                          {enfant.nom} ({enfant.classe})
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingParent(parent)}
                        className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-primary"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteParent(parent.id)}
                        className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Affichage de <span className="font-medium text-foreground">{filteredParents.length}</span> sur{" "}
            <span className="font-medium text-foreground">{parents.length}</span> parents
          </p>
        </div>
      </div>

      {/* Modals */}
      <AddParentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddParent}
      />

      {editingParent && (
        <AddParentModal
          isOpen={!!editingParent}
          onClose={() => setEditingParent(null)}
          onSubmit={handleEditParent}
          parent={editingParent}
        />
      )}
    </div>
  );
}
