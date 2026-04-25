import Link from "next/link";
import { BookOpen, Calendar, Clock3, Coins, School } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">Configuration générale de l&apos;établissement</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <School className="w-5 h-5 text-primary" />
                Établissement
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Nom, direction, adresse et coordonnées de l&apos;établissement.
              </p>
            </div>
            <Link
              href="/dashboard/settings/etablissement"
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition whitespace-nowrap"
            >
              Ouvrir
            </Link>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-secondary" />
                Année scolaire
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Période officielle, année active et découpage en trimestres.
              </p>
            </div>
            <Link
              href="/dashboard/settings/annee-scolaire"
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition whitespace-nowrap"
            >
              Ouvrir
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock3 className="w-5 h-5 text-primary" />
              Configuration technique des emplois du temps
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Définis les horaires, pauses/récréations, jours actifs et demi-journées (MVP).
            </p>
          </div>
          <Link
            href="/dashboard/settings/timetable-config"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition"
          >
            Configurer l&apos;EDT
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Coins className="w-5 h-5 text-warning" />
                Frais scolaires par niveau
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Montants annuels et liste d&apos;ajout par niveau.
              </p>
            </div>
            <Link
              href="/dashboard/settings/frais-scolaires"
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition whitespace-nowrap"
            >
              Ouvrir
            </Link>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-success" />
                Matières &amp; coefficients
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Matières, filtres, coefficients et grille de référence.
              </p>
            </div>
            <Link
              href="/dashboard/settings/matieres-coefficients"
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition whitespace-nowrap"
            >
              Ouvrir
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
