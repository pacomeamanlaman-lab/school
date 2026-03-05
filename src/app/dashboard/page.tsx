"use client";

import { Users, School, UserCog, TrendingUp } from "lucide-react";
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

const statsCards = [
  {
    title: "Total Élèves",
    value: "284",
    icon: Users,
    color: "bg-primary/10 text-primary",
    trend: "+12 ce mois",
  },
  {
    title: "Classes",
    value: "12",
    icon: School,
    color: "bg-secondary/10 text-secondary",
    trend: "6 niveaux",
  },
  {
    title: "Personnel",
    value: "28",
    icon: UserCog,
    color: "bg-success/10 text-success",
    trend: "18 enseignants",
  },
  {
    title: "Taux de présence",
    value: "96%",
    icon: TrendingUp,
    color: "bg-info/10 text-info",
    trend: "+2% vs mois dernier",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble de votre établissement</p>
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

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Effectifs par niveau */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Effectifs par niveau</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={effectifsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="niveau" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="eleves" fill="#00aef0" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition Garçons/Filles */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Répartition par genre</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={repartitionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {repartitionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {repartitionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
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
