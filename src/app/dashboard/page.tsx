"use client";

import { useRouter } from "next/navigation";
import { Users, School, UserCog, TrendingUp, Award, AlertTriangle, CheckCircle, LineChart as LineChartIcon, ClipboardList, CheckSquare, FileText } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

// Données de démonstration
const effectifsData = [
  { niveau: "CP", eleves: 45 },
  { niveau: "CE1", eleves: 48 },
  { niveau: "CE2", eleves: 42 },
  { niveau: "CM1", eleves: 50 },
  { niveau: "CM2", eleves: 47 },
  { niveau: "6ème", eleves: 52 },
];

const repartitionData = [
  { name: "Garçons", value: 156, color: "#00aef0" },
  { name: "Filles", value: 128, color: "#10a7aa" },
];

// Données pédagogiques
const moyennesData = [
  { niveau: "CP", moyenne: 14.2 },
  { niveau: "CE1", moyenne: 13.8 },
  { niveau: "CE2", moyenne: 14.5 },
  { niveau: "CM1", moyenne: 13.9 },
  { niveau: "CM2", moyenne: 14.1 },
  { niveau: "6ème", moyenne: 13.5 },
];

const topStudents = [
  { name: "Sophie Bernard", classe: "6ème A", moyenne: 17.8 },
  { name: "Marie Dupont", classe: "CM2 A", moyenne: 16.5 },
  { name: "Lucas Petit", classe: "CE2 A", moyenne: 16.2 },
];

// Données absences sur 7 jours
const absencesWeekData = [
  { jour: "Lun", absents: 8, presents: 276 },
  { jour: "Mar", absents: 12, presents: 272 },
  { jour: "Mer", absents: 6, presents: 278 },
  { jour: "Jeu", absents: 10, presents: 274 },
  { jour: "Ven", absents: 7, presents: 277 },
  { jour: "Sam", absents: 5, presents: 279 },
  { jour: "Dim", absents: 0, presents: 0 },
];

const elevesAbsencesCritiques = [
  { name: "Emma Dubois", classe: "CE1 A", absences: 8 },
  { name: "Jean Martin", classe: "CP A", absences: 7 },
  { name: "Paul Durand", classe: "CM1 A", absences: 6 },
];

const statsCards = [
  {
    title: "Total Élèves",
    value: "284",
    icon: Users,
    color: "bg-primary/10 text-primary",
    trend: "+12 ce mois",
  },
  {
    title: "Moyenne Générale",
    value: "14.0/20",
    icon: Award,
    color: "bg-success/10 text-success",
    trend: "Taux réussite: 87%",
  },
  {
    title: "Présence du jour",
    value: "96%",
    icon: CheckCircle,
    color: "bg-info/10 text-info",
    trend: "273/284 présents",
  },
  {
    title: "Alertes Absences",
    value: "3",
    icon: AlertTriangle,
    color: "bg-warning/10 text-warning",
    trend: "≥6 absences ce mois",
  },
];

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">Vue d&apos;ensemble de votre établissement</p>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => router.push("/dashboard/absences")}
          className="flex items-center gap-4 p-4 bg-info/10 hover:bg-info/20 border border-info/20 rounded-xl transition text-left"
        >
          <div className="w-12 h-12 bg-info/20 rounded-lg flex items-center justify-center">
            <CheckSquare className="w-6 h-6 text-info" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Faire l&apos;appel</p>
            <p className="text-sm text-muted-foreground">Saisir les présences du jour</p>
          </div>
        </button>

        <button
          onClick={() => router.push("/dashboard/notes")}
          className="flex items-center gap-4 p-4 bg-success/10 hover:bg-success/20 border border-success/20 rounded-xl transition text-left"
        >
          <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Saisir des notes</p>
            <p className="text-sm text-muted-foreground">Évaluer les élèves</p>
          </div>
        </button>

        <button
          onClick={() => router.push("/dashboard/bulletins")}
          className="flex items-center gap-4 p-4 bg-warning/10 hover:bg-warning/20 border border-warning/20 rounded-xl transition text-left"
        >
          <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Générer bulletins</p>
            <p className="text-sm text-muted-foreground">Créer les bulletins scolaires</p>
          </div>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-foreground mt-2">{stat.value}</h3>
                  <p className="text-xs text-muted-foreground mt-2">{stat.trend}</p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Graphiques Pédagogiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Moyennes par niveau */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Moyennes par niveau</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={moyennesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="niveau" stroke="#64748b" />
              <YAxis domain={[0, 20]} stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="moyenne" fill="#10a7aa" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 3 Élèves */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-warning" />
            Top 3 Élèves du mois
          </h3>
          <div className="space-y-4">
            {topStudents.map((student, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  index === 0 ? "bg-warning/20 text-warning" :
                  index === 1 ? "bg-muted text-muted-foreground" :
                  "bg-orange-100 text-orange-600"
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.classe}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-success">{student.moyenne}</p>
                  <p className="text-xs text-muted-foreground">/20</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Graphiques Absences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Absences sur 7 jours */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-info" />
            Absences sur 7 jours
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={absencesWeekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="jour" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Line type="monotone" dataKey="absents" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Élèves avec absences critiques */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger" />
            Alertes Absences Critiques
          </h3>
          <div className="space-y-3">
            {elevesAbsencesCritiques.map((eleve, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-danger/5 border border-danger/20 rounded-lg">
                <div>
                  <p className="font-semibold text-foreground">{eleve.name}</p>
                  <p className="text-sm text-muted-foreground">{eleve.classe}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-danger">{eleve.absences}</p>
                  <p className="text-xs text-muted-foreground">absences</p>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Élèves avec ≥6 absences ce mois - Action requise
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activités récentes */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Activités récentes</h3>
        <div className="space-y-4">
          {[
            { action: "Nouvel élève inscrit", detail: "Marie Dupont - CM2", time: "Il y a 2h" },
            { action: "Absence signalée", detail: "Jean Martin - CE1", time: "Il y a 3h" },
            { action: "Personnel ajouté", detail: "Sophie Bernard - Enseignante", time: "Il y a 5h" },
            { action: "Classe créée", detail: "CM1 - Classe B", time: "Hier" },
          ].map((activity, index) => (
            <div key={index} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{activity.action}</p>
                <p className="text-sm text-muted-foreground">{activity.detail}</p>
              </div>
              <span className="text-xs text-muted-foreground">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
