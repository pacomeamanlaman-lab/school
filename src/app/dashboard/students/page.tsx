"use client";

import { useState } from "react";
import { Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2, Download } from "lucide-react";
import AddStudentModal from "@/components/AddStudentModal";

// Données de démonstration
const studentsData = [
  {
    id: 1,
    matricule: "EL2024001",
    firstName: "Marie",
    lastName: "Dupont",
    classe: "CM2",
    dateNaissance: "2014-03-15",
    genre: "F",
    status: "active",
  },
  {
    id: 2,
    matricule: "EL2024002",
    firstName: "Jean",
    lastName: "Martin",
    classe: "CE1",
    dateNaissance: "2016-07-22",
    genre: "M",
    status: "active",
  },
  {
    id: 3,
    matricule: "EL2024003",
    firstName: "Sophie",
    lastName: "Bernard",
    classe: "6ème",
    dateNaissance: "2013-11-08",
    genre: "F",
    status: "active",
  },
  {
    id: 4,
    matricule: "EL2024004",
    firstName: "Lucas",
    lastName: "Petit",
    classe: "CM1",
    dateNaissance: "2014-05-19",
    genre: "M",
    status: "active",
  },
  {
    id: 5,
    matricule: "EL2024005",
    firstName: "Emma",
    lastName: "Dubois",
    classe: "CP",
    dateNaissance: "2017-09-12",
    genre: "F",
    status: "active",
  },
];

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredStudents = studentsData.filter((student) => {
    const matchSearch =
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.matricule.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = selectedClass === "all" || student.classe === selectedClass;
    return matchSearch && matchClass;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des élèves</h1>
          <p className="text-muted-foreground">Liste complète des élèves inscrits</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Ajouter un élève
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
              placeholder="Rechercher par nom, prénom ou matricule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          {/* Filtre classe */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none cursor-pointer min-w-[150px]"
            >
              <option value="all">Toutes les classes</option>
              <option value="CP">CP</option>
              <option value="CE1">CE1</option>
              <option value="CE2">CE2</option>
              <option value="CM1">CM1</option>
              <option value="CM2">CM2</option>
              <option value="6ème">6ème</option>
            </select>
          </div>

          {/* Export */}
          <button className="flex items-center gap-2 px-4 py-2.5 bg-background border border-input hover:bg-accent rounded-lg transition font-medium text-foreground">
            <Download className="w-5 h-5" />
            Exporter
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total élèves</p>
          <p className="text-2xl font-bold text-foreground mt-1">{studentsData.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Garçons</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {studentsData.filter((s) => s.genre === "M").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Filles</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {studentsData.filter((s) => s.genre === "F").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Résultats</p>
          <p className="text-2xl font-bold text-foreground mt-1">{filteredStudents.length}</p>
        </div>
      </div>

      {/* Tableau des élèves */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Matricule</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Nom complet</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Classe</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Date de naissance</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Genre</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Statut</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-border hover:bg-accent/50 transition">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-muted-foreground">{student.matricule}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {student.firstName} {student.lastName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 bg-secondary/10 text-secondary rounded-md text-sm font-medium">
                      {student.classe}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(student.dateNaissance).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{student.genre === "M" ? "Garçon" : "Fille"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 bg-success/10 text-success rounded-md text-sm font-medium">
                      Actif
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-info">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-primary">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-danger">
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
            Affichage de <span className="font-medium text-foreground">{filteredStudents.length}</span> sur{" "}
            <span className="font-medium text-foreground">{studentsData.length}</span> élèves
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-background border border-input hover:bg-accent rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              Précédent
            </button>
            <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">1</button>
            <button className="px-3 py-1.5 bg-background border border-input hover:bg-accent rounded-lg transition text-sm font-medium">
              2
            </button>
            <button className="px-3 py-1.5 bg-background border border-input hover:bg-accent rounded-lg transition text-sm font-medium">
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Modal d'ajout d'élève */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
