"use client";

import { useState, useEffect } from "react";
import { DollarSign, Search, Filter, TrendingUp, TrendingDown, AlertCircle, Plus, Eye } from "lucide-react";
import AddPaiementModal from "@/components/AddPaiementModal";

// Charger les frais depuis localStorage
const loadFraisEleves = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("school_frais_eleves");
    return stored ? JSON.parse(stored) : fraisScolairesDataDefault;
  }
  return fraisScolairesDataDefault;
};

const saveFraisEleves = (frais: any[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("school_frais_eleves", JSON.stringify(frais));
  }
};

// Données de démonstration - Frais scolaires par élève
const fraisScolairesDataDefault = [
  {
    id: 1,
    studentId: 1,
    studentName: "Marie Dupont",
    classe: "CM2",
    montantTotal: 75000,
    montantPaye: 75000,
    statutPaiement: "paye",
    dernierPaiement: "2024-03-15",
  },
  {
    id: 2,
    studentId: 2,
    studentName: "Jean Martin",
    classe: "CE1",
    montantTotal: 50000,
    montantPaye: 25000,
    statutPaiement: "partiel",
    dernierPaiement: "2024-01-10",
  },
  {
    id: 3,
    studentId: 3,
    studentName: "Sophie Bernard",
    classe: "6ème",
    montantTotal: 100000,
    montantPaye: 100000,
    statutPaiement: "paye",
    dernierPaiement: "2024-02-20",
  },
  {
    id: 4,
    studentId: 4,
    studentName: "Lucas Petit",
    classe: "CM1",
    montantTotal: 60000,
    montantPaye: 0,
    statutPaiement: "impaye",
    dernierPaiement: null,
  },
  {
    id: 5,
    studentId: 5,
    studentName: "Emma Dubois",
    classe: "CP",
    montantTotal: 45000,
    montantPaye: 30000,
    statutPaiement: "partiel",
    dernierPaiement: "2024-02-05",
  },
];

export default function ComptabilitePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isAddPaiementModalOpen, setIsAddPaiementModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<typeof fraisScolairesDataDefault[0] | null>(null);
  const [fraisScolaires, setFraisScolaires] = useState(fraisScolairesDataDefault);

  // Charger les frais depuis localStorage au montage
  useEffect(() => {
    setFraisScolaires(loadFraisEleves());
  }, []);

  const filteredFrais = fraisScolaires.filter((frais) => {
    const matchSearch = frais.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter =
      selectedFilter === "all" ||
      frais.statutPaiement === selectedFilter;
    return matchSearch && matchFilter;
  });

  // Statistiques
  const stats = {
    total: fraisScolaires.reduce((sum, f) => sum + f.montantTotal, 0),
    paye: fraisScolaires.reduce((sum, f) => sum + f.montantPaye, 0),
    restant: fraisScolaires.reduce((sum, f) => sum + (f.montantTotal - f.montantPaye), 0),
    nombreImpaye: fraisScolaires.filter((f) => f.statutPaiement === "impaye").length,
  };

  const handleAddPaiement = (studentId: number) => {
    const student = fraisScolaires.find((f) => f.studentId === studentId);
    if (student) {
      setSelectedStudent(student);
      setIsAddPaiementModalOpen(true);
    }
  };

  const handleSavePaiement = (data: any) => {
    console.log("Nouveau paiement:", data);

    // Mise à jour locale pour MVP
    const updatedFrais = fraisScolaires.map(f => {
      if (f.studentId === data.studentId) {
        const nouveauMontantPaye = f.montantPaye + parseFloat(data.montant);
        const nouveauStatut =
          nouveauMontantPaye >= f.montantTotal ? "paye" :
          nouveauMontantPaye > 0 ? "partiel" : "impaye";

        return {
          ...f,
          montantPaye: nouveauMontantPaye,
          statutPaiement: nouveauStatut,
          dernierPaiement: data.datePaiement,
        };
      }
      return f;
    });

    setFraisScolaires(updatedFrais);
    saveFraisEleves(updatedFrais); // Sauvegarder dans localStorage
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "paye":
        return "bg-success/10 text-success border-success/20";
      case "partiel":
        return "bg-warning/10 text-warning border-warning/20";
      case "impaye":
        return "bg-danger/10 text-danger border-danger/20";
      default:
        return "bg-muted";
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "paye":
        return "Payé";
      case "partiel":
        return "Partiel";
      case "impaye":
        return "Non payé";
      default:
        return statut;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comptabilité & Frais Scolaires</h1>
        <p className="text-muted-foreground">Gestion des paiements et suivi financier</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total attendu</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.total.toLocaleString()} FCFA
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="bg-card border border-success/20 bg-success/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-success">Total payé</p>
              <p className="text-2xl font-bold text-success mt-1">
                {stats.paye.toLocaleString()} FCFA
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-success" />
          </div>
        </div>

        <div className="bg-card border border-warning/20 bg-warning/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warning">Reste à payer</p>
              <p className="text-2xl font-bold text-warning mt-1">
                {stats.restant.toLocaleString()} FCFA
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-warning" />
          </div>
        </div>

        <div className="bg-card border border-danger/20 bg-danger/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-danger">Impayés</p>
              <p className="text-2xl font-bold text-danger mt-1">{stats.nombreImpaye}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-danger" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Rechercher un élève..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          {/* Filtre statut */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="all">Tous les statuts</option>
              <option value="paye">Payé</option>
              <option value="partiel">Partiellement payé</option>
              <option value="impaye">Non payé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Élève</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Classe</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Montant total</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Déjà payé</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Reste</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Statut</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Dernier paiement</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFrais.map((frais) => {
                const reste = frais.montantTotal - frais.montantPaye;
                const pourcentage = (frais.montantPaye / frais.montantTotal) * 100;

                return (
                  <tr key={frais.id} className="border-b border-border hover:bg-accent/50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{frais.studentName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 bg-secondary/10 text-secondary rounded-md text-sm font-medium">
                        {frais.classe}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      {frais.montantTotal.toLocaleString()} FCFA
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-foreground font-medium">
                          {frais.montantPaye.toLocaleString()} FCFA
                        </p>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              pourcentage === 100
                                ? "bg-success"
                                : pourcentage > 0
                                ? "bg-warning"
                                : "bg-danger"
                            }`}
                            style={{ width: `${pourcentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      <span className={reste === 0 ? "text-success" : "text-warning"}>
                        {reste.toLocaleString()} FCFA
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium border ${getStatutBadge(
                          frais.statutPaiement
                        )}`}
                      >
                        {getStatutLabel(frais.statutPaiement)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {frais.dernierPaiement
                        ? new Date(frais.dernierPaiement).toLocaleDateString("fr-FR")
                        : "Aucun"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAddPaiement(frais.studentId)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition text-sm font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          Paiement
                        </button>
                        <button className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-info">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Affichage de <span className="font-medium text-foreground">{filteredFrais.length}</span> sur{" "}
            <span className="font-medium text-foreground">{fraisScolaires.length}</span> élèves
          </p>
        </div>
      </div>

      {/* Modal ajout paiement */}
      <AddPaiementModal
        isOpen={isAddPaiementModalOpen}
        onClose={() => {
          setIsAddPaiementModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onSubmit={handleSavePaiement}
      />
    </div>
  );
}
