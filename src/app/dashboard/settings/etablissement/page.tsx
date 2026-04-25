"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Save, School } from "lucide-react";

export default function EtablissementSettingsPage() {
  const [schoolInfo, setSchoolInfo] = useState({
    nom: "École Primaire & Collège Saint-Exupéry",
    adresse: "123 Avenue de l'Éducation, 75001 Paris",
    telephone: "+33 1 23 45 67 89",
    email: "contact@ecole-saint-exupery.fr",
    siteWeb: "www.ecole-saint-exupery.fr",
    directeur: "M. Pierre Dupont",
  });

  const handleSaveSchoolInfo = () => {
    alert("Informations de l'école enregistrées avec succès !");
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Retour aux parametres
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Établissement</h1>
        <p className="text-muted-foreground">Identité et coordonnées de l&apos;établissement.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <School className="w-5 h-5 text-primary" />
          Informations de l&apos;école
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nom de l&apos;établissement <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={schoolInfo.nom}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, nom: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Directeur/Directrice <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={schoolInfo.directeur}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, directeur: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              Adresse <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={schoolInfo.adresse}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, adresse: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Téléphone <span className="text-danger">*</span>
            </label>
            <input
              type="tel"
              value={schoolInfo.telephone}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, telephone: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              value={schoolInfo.email}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Site Web</label>
            <input
              type="url"
              value={schoolInfo.siteWeb}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, siteWeb: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveSchoolInfo}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20"
        >
          <Save className="w-4 h-4" />
          Enregistrer
        </button>
      </div>
    </div>
  );
}
