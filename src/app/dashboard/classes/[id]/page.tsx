"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Users, User, MapPin, Calendar, UserPlus } from "lucide-react";

// Données de démonstration
const classData = {
  id: 1,
  name: "CP - Classe A",
  niveau: "CP",
  effectif: 25,
  capacite: 30,
  titulaire: "Mme Dupont",
  salle: "Salle 101",
  anneeScolaire: "2024-2025",
  status: "active",
  eleves: [
    { id: 1, firstName: "Marie", lastName: "Dupont", genre: "F", moyenne: 15.5 },
    { id: 2, firstName: "Jean", lastName: "Martin", genre: "M", moyenne: 14.2 },
    { id: 3, firstName: "Sophie", lastName: "Bernard", genre: "F", moyenne: 16.8 },
    { id: 4, firstName: "Lucas", lastName: "Petit", genre: "M", moyenne: 13.5 },
    { id: 5, firstName: "Emma", lastName: "Dubois", genre: "F", moyenne: 17.2 },
  ],
};

export default function ClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pourcentageRemplissage = Math.round((classData.effectif / classData.capacite) * 100);
  const moyenneClasse = classData.eleves.reduce((acc, e) => acc + e.moyenne, 0) / classData.eleves.length;

  return (
    <div className="space-y-6">
      {/* Header avec retour */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-accent rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Détails de la classe</h1>
          <p className="text-muted-foreground">Informations et élèves</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/90 text-white rounded-lg transition font-medium shadow-lg shadow-secondary/20">
          <UserPlus className="w-4 h-4" />
          Affecter élève
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20">
          <Edit className="w-4 h-4" />
          Modifier
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition font-medium">
          <Trash2 className="w-4 h-4" />
          Supprimer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de la classe */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-10 h-10 text-primary" />
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">{classData.name}</h2>
                <p className="text-muted-foreground mt-1">Année scolaire {classData.anneeScolaire}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-md text-sm font-semibold">
                    {classData.niveau}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-success/10 text-success rounded-md text-sm font-semibold">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Détails */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Enseignant titulaire</p>
                  <p className="text-sm font-medium text-foreground">{classData.titulaire}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Salle</p>
                  <p className="text-sm font-medium text-foreground">{classData.salle}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Effectif</p>
                  <p className="text-sm font-medium text-foreground">
                    {classData.effectif} / {classData.capacite} élèves
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Année scolaire</p>
                  <p className="text-sm font-medium text-foreground">{classData.anneeScolaire}</p>
                </div>
              </div>
            </div>

            {/* Barre de remplissage */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Taux de remplissage</span>
                <span className={`text-sm font-bold ${
                  pourcentageRemplissage >= 90 ? "text-danger" :
                  pourcentageRemplissage >= 75 ? "text-warning" : "text-success"
                }`}>
                  {pourcentageRemplissage}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    pourcentageRemplissage >= 90 ? "bg-danger" :
                    pourcentageRemplissage >= 75 ? "bg-warning" : "bg-success"
                  }`}
                  style={{ width: `${pourcentageRemplissage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Liste des élèves */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Liste des élèves ({classData.eleves.length})
            </h3>
            <div className="space-y-2">
              {classData.eleves.map((eleve) => (
                <div
                  key={eleve.id}
                  className="flex items-center justify-between p-4 bg-muted hover:bg-accent rounded-lg transition cursor-pointer"
                  onClick={() => router.push(`/dashboard/students/${eleve.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">
                        {eleve.firstName[0]}{eleve.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {eleve.firstName} {eleve.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {eleve.genre === "M" ? "Garçon" : "Fille"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{eleve.moyenne.toFixed(1)}/20</p>
                    <p className="text-xs text-muted-foreground">Moyenne</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Stats rapides */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Statistiques</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Moyenne de classe</p>
                <p className="text-3xl font-bold text-primary">{moyenneClasse.toFixed(2)}/20</p>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Répartition</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Garçons</span>
                    <span className="text-sm font-bold text-foreground">
                      {classData.eleves.filter(e => e.genre === "M").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Filles</span>
                    <span className="text-sm font-bold text-foreground">
                      {classData.eleves.filter(e => e.genre === "F").length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Places restantes</p>
                <p className="text-2xl font-bold text-foreground">
                  {classData.capacite - classData.effectif}
                </p>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-background hover:bg-accent border border-input rounded-lg transition text-sm font-medium">
                Exporter la liste
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-background hover:bg-accent border border-input rounded-lg transition text-sm font-medium">
                Emploi du temps
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-background hover:bg-accent border border-input rounded-lg transition text-sm font-medium">
                Bulletins
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
