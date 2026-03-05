"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Calendar, BookOpen, School, User } from "lucide-react";

// Données de démonstration
const staffData = {
  id: 1,
  firstName: "Marie",
  lastName: "Dupont",
  role: "Enseignant",
  matiere: "Français",
  classe: "CP - Classe A",
  email: "marie.dupont@ecole.com",
  phone: "+33 6 12 34 56 78",
  adresse: "45 Avenue des Écoles, 75001 Paris",
  dateEmbauche: "2020-09-01",
  statut: "active",
  emploiDuTemps: [
    { jour: "Lundi", horaire: "08:00 - 12:00", classe: "CP - Classe A" },
    { jour: "Lundi", horaire: "14:00 - 16:00", classe: "CP - Classe A" },
    { jour: "Mardi", horaire: "08:00 - 12:00", classe: "CP - Classe A" },
    { jour: "Mardi", horaire: "14:00 - 16:00", classe: "CP - Classe A" },
    { jour: "Jeudi", horaire: "08:00 - 12:00", classe: "CP - Classe A" },
    { jour: "Vendredi", horaire: "08:00 - 12:00", classe: "CP - Classe A" },
  ],
  stats: {
    heuresSemaine: 24,
    nombreEleves: 25,
    anciennete: 4,
  },
};

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();

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
      {/* Header avec retour */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-accent rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Fiche personnel</h1>
          <p className="text-muted-foreground">Informations détaillées</p>
        </div>
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
          {/* Informations personnelles */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-6 mb-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-3xl">
                  {staffData.firstName[0]}{staffData.lastName[0]}
                </span>
              </div>

              {/* Infos principales */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">
                  {staffData.firstName} {staffData.lastName}
                </h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold mt-2 ${getRoleBadgeColor(staffData.role)}`}>
                  {staffData.role}
                </span>
                <div className="flex items-center gap-3 mt-3">
                  <span className="inline-flex items-center px-3 py-1 bg-success/10 text-success rounded-md text-sm font-semibold">
                    Actif
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {staffData.stats.anciennete} ans d'ancienneté
                  </span>
                </div>
              </div>
            </div>

            {/* Détails */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staffData.matiere && (
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Matière enseignée</p>
                    <p className="text-sm font-medium text-foreground">{staffData.matiere}</p>
                  </div>
                </div>
              )}

              {staffData.classe && (
                <div className="flex items-start gap-3">
                  <School className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Classe titulaire</p>
                    <p className="text-sm font-medium text-foreground">{staffData.classe}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="text-sm font-medium text-foreground">{staffData.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">{staffData.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Date d'embauche</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(staffData.dateEmbauche).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Adresse</p>
                  <p className="text-sm font-medium text-foreground">{staffData.adresse}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Emploi du temps */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Emploi du temps hebdomadaire</h3>
            <div className="space-y-3">
              {staffData.emploiDuTemps.map((slot, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-foreground">{slot.jour}</p>
                    <p className="text-xs text-muted-foreground">{slot.classe}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">{slot.horaire}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total heures / semaine</span>
                <span className="text-xl font-bold text-primary">{staffData.stats.heuresSemaine}h</span>
              </div>
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
                <p className="text-xs text-muted-foreground mb-1">Heures par semaine</p>
                <p className="text-3xl font-bold text-foreground">{staffData.stats.heuresSemaine}h</p>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Nombre d'élèves</p>
                <p className="text-2xl font-bold text-foreground">{staffData.stats.nombreEleves}</p>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Ancienneté</p>
                <p className="text-2xl font-bold text-foreground">{staffData.stats.anciennete} ans</p>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Depuis</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(staffData.dateEmbauche).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-background hover:bg-accent border border-input rounded-lg transition text-sm font-medium">
                Voir les classes
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-background hover:bg-accent border border-input rounded-lg transition text-sm font-medium">
                Emploi du temps complet
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-background hover:bg-accent border border-input rounded-lg transition text-sm font-medium">
                Documents RH
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
