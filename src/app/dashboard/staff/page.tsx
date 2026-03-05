"use client";

import { useState } from "react";
import { Plus, Search, Filter, Mail, Phone, Edit, Trash2, Eye, BookOpen, School } from "lucide-react";

// Données de démonstration
const staffData = [
  {
    id: 1,
    firstName: "Marie",
    lastName: "Dupont",
    role: "Enseignant",
    matiere: "Français",
    classe: "CP - Classe A",
    email: "marie.dupont@ecole.com",
    phone: "+33 6 12 34 56 78",
    status: "active",
  },
  {
    id: 2,
    firstName: "Jean",
    lastName: "Martin",
    role: "Enseignant",
    matiere: "Mathématiques",
    classe: "CE1 - Classe A",
    email: "jean.martin@ecole.com",
    phone: "+33 6 23 45 67 89",
    status: "active",
  },
  {
    id: 3,
    firstName: "Sophie",
    lastName: "Bernard",
    role: "Enseignant",
    matiere: "Sciences",
    classe: "CE2 - Classe A",
    email: "sophie.bernard@ecole.com",
    phone: "+33 6 34 56 78 90",
    status: "active",
  },
  {
    id: 4,
    firstName: "Pierre",
    lastName: "Petit",
    role: "Directeur",
    matiere: "-",
    classe: "-",
    email: "pierre.petit@ecole.com",
    phone: "+33 6 45 67 89 01",
    status: "active",
  },
  {
    id: 5,
    firstName: "Claire",
    lastName: "Dubois",
    role: "Secrétaire",
    matiere: "-",
    classe: "-",
    email: "claire.dubois@ecole.com",
    phone: "+33 6 56 78 90 12",
    status: "active",
  },
  {
    id: 6,
    firstName: "Marc",
    lastName: "Laurent",
    role: "Enseignant",
    matiere: "Histoire-Géo",
    classe: "6ème - Classe A",
    email: "marc.laurent@ecole.com",
    phone: "+33 6 67 89 01 23",
    status: "active",
  },
];

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  const filteredStaff = staffData.filter((person) => {
    const matchSearch =
      person.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = selectedRole === "all" || person.role === selectedRole;
    return matchSearch && matchRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Directeur":
        return "bg-danger/10 text-danger";
      case "Enseignant":
        return "bg-primary/10 text-primary";
      case "Secrétaire":
        return "bg-secondary/10 text-secondary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion du personnel</h1>
          <p className="text-muted-foreground">Liste complète des membres du personnel</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" />
          Ajouter un membre
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          {/* Filtre rôle */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="all">Tous les rôles</option>
              <option value="Enseignant">Enseignant</option>
              <option value="Directeur">Directeur</option>
              <option value="Secrétaire">Secrétaire</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total personnel</p>
          <p className="text-2xl font-bold text-foreground mt-1">{staffData.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Enseignants</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {staffData.filter((s) => s.role === "Enseignant").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Administration</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {staffData.filter((s) => s.role !== "Enseignant").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Résultats</p>
          <p className="text-2xl font-bold text-foreground mt-1">{filteredStaff.length}</p>
        </div>
      </div>

      {/* Grille du personnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((person) => (
          <div
            key={person.id}
            className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition"
          >
            {/* Header avec avatar */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-xl">
                  {person.firstName[0]}
                  {person.lastName[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground">
                  {person.firstName} {person.lastName}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold mt-1 ${getRoleBadgeColor(person.role)}`}>
                  {person.role}
                </span>
              </div>
            </div>

            {/* Informations */}
            <div className="space-y-3 mb-4">
              {person.matiere !== "-" && (
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Matière</p>
                    <p className="text-sm font-medium text-foreground">{person.matiere}</p>
                  </div>
                </div>
              )}

              {person.classe !== "-" && (
                <div className="flex items-start gap-3">
                  <School className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Classe</p>
                    <p className="text-sm font-medium text-foreground">{person.classe}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">{person.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="text-sm font-medium text-foreground">{person.phone}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-border">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-background hover:bg-accent border border-input rounded-lg transition text-sm font-medium">
                <Eye className="w-4 h-4" />
                Voir
              </button>
              <button className="flex items-center justify-center p-2 hover:bg-accent border border-input rounded-lg transition">
                <Edit className="w-4 h-4 text-primary" />
              </button>
              <button className="flex items-center justify-center p-2 hover:bg-accent border border-input rounded-lg transition">
                <Trash2 className="w-4 h-4 text-danger" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Message si aucun résultat */}
      {filteredStaff.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Aucun membre trouvé</h3>
          <p className="text-muted-foreground">Essayez avec d'autres mots-clés ou filtres</p>
        </div>
      )}
    </div>
  );
}
