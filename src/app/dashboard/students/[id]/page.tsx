"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Calendar, User, Users } from "lucide-react";

// Données de démonstration (à remplacer par Supabase)
const studentData = {
  id: 1,
  matricule: "EL2024001",
  firstName: "Marie",
  lastName: "Dupont",
  dateNaissance: "2014-03-15",
  genre: "F",
  classe: "CM2",
  photo: null,
  email: "marie.dupont@ecole.com",
  phone: "+33 6 12 34 56 78",
  adresse: "12 Rue de l'École, 75001 Paris",
  status: "active",
  parent: {
    name: "Jean Dupont",
    phone: "+33 6 98 76 54 32",
    email: "jean.dupont@example.com",
  },
  dateInscription: "2023-09-01",
  notes: [
    { matiere: "Français", note: 15.5, trimestre: "T1" },
    { matiere: "Mathématiques", note: 17.0, trimestre: "T1" },
    { matiere: "Histoire", note: 14.0, trimestre: "T1" },
    { matiere: "Sciences", note: 16.5, trimestre: "T1" },
  ],
  absences: [
    { date: "2024-02-15", type: "Justifiée", motif: "Maladie" },
    { date: "2024-02-16", type: "Justifiée", motif: "Maladie" },
  ],
};

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();

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
          <h1 className="text-2xl font-bold text-foreground">Fiche élève</h1>
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
              {/* Photo */}
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-3xl">
                  {studentData.firstName[0]}{studentData.lastName[0]}
                </span>
              </div>

              {/* Infos principales */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">
                  {studentData.firstName} {studentData.lastName}
                </h2>
                <p className="text-muted-foreground font-mono mt-1">{studentData.matricule}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="inline-flex items-center px-3 py-1 bg-secondary/10 text-secondary rounded-md text-sm font-semibold">
                    {studentData.classe}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-success/10 text-success rounded-md text-sm font-semibold">
                    Actif
                  </span>
                </div>
              </div>
            </div>

            {/* Détails */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Date de naissance</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(studentData.dateNaissance).toLocaleDateString("fr-FR")} ({Math.floor((Date.now() - new Date(studentData.dateNaissance).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} ans)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Genre</p>
                  <p className="text-sm font-medium text-foreground">
                    {studentData.genre === "M" ? "Garçon" : "Fille"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="text-sm font-medium text-foreground">{studentData.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">{studentData.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Adresse</p>
                  <p className="text-sm font-medium text-foreground">{studentData.adresse}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Parent/Tuteur */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Parent / Tuteur
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Nom complet</p>
                  <p className="text-sm font-medium text-foreground">{studentData.parent.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="text-sm font-medium text-foreground">{studentData.parent.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">{studentData.parent.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes récentes */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Notes récentes (Trimestre 1)</h3>
            <div className="space-y-3">
              {studentData.notes.map((note, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium text-foreground">{note.matiere}</span>
                  <span className={`text-lg font-bold ${
                    note.note >= 16 ? "text-success" :
                    note.note >= 12 ? "text-primary" :
                    note.note >= 10 ? "text-warning" : "text-danger"
                  }`}>
                    {note.note.toFixed(1)}/20
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Moyenne générale</span>
                <span className="text-xl font-bold text-primary">
                  {(studentData.notes.reduce((acc, n) => acc + n.note, 0) / studentData.notes.length).toFixed(2)}/20
                </span>
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
                <p className="text-xs text-muted-foreground mb-1">Taux de présence</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-success h-2 rounded-full" style={{ width: "96%" }}></div>
                  </div>
                  <span className="text-sm font-bold text-success">96%</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Absences ce mois</p>
                <p className="text-2xl font-bold text-foreground">{studentData.absences.length}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Date d'inscription</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(studentData.dateInscription).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          </div>

          {/* Absences récentes */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Absences récentes</h3>
            {studentData.absences.length > 0 ? (
              <div className="space-y-3">
                {studentData.absences.map((absence, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">
                        {new Date(absence.date).toLocaleDateString("fr-FR")}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        absence.type === "Justifiée"
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                      }`}>
                        {absence.type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{absence.motif}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune absence enregistrée</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
