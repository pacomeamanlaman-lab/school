"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Save, School } from "lucide-react";
import FlashNotice from "@/components/FlashNotice";
import { useFlashNotice } from "@/hooks/useFlashNotice";
import { createClient } from "@/lib/supabase/client";
import { fetchPrimaryEtablissement } from "@/lib/supabase/etablissement-settings";

export default function EtablissementSettingsPage() {
  const [etablissementId, setEtablissementId] = useState<string | null>(null);
  const [schoolInfo, setSchoolInfo] = useState({
    nom: "",
    adresse: "",
    ville: "",
    codePostal: "",
    telephone: "",
    email: "",
    siteWeb: "",
    directeur: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notice, flash } = useFlashNotice();

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    setError(null);
    const { row, error: e } = await fetchPrimaryEtablissement(supabase);
    if (e) {
      setError(e);
      setLoading(false);
      return;
    }
    if (!row) {
      setError("Aucun établissement configuré. Contactez l'administrateur.");
      setLoading(false);
      return;
    }
    setEtablissementId(row.id);
    setSchoolInfo({
      nom: row.nom,
      adresse: row.adresse,
      ville: row.ville ?? "",
      codePostal: row.code_postal ?? "",
      telephone: row.telephone ?? "",
      email: row.email ?? "",
      siteWeb: row.site_web ?? "",
      directeur: row.directeur ?? "",
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveSchoolInfo = async () => {
    if (!etablissementId) return;
    const supabase = createClient();
    setSaving(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from("etablissements")
        .update({
          nom: schoolInfo.nom.trim(),
          adresse: schoolInfo.adresse.trim(),
          ville: schoolInfo.ville.trim() || null,
          code_postal: schoolInfo.codePostal.trim() || null,
          telephone: schoolInfo.telephone.trim() || null,
          email: schoolInfo.email.trim() || null,
          directeur: schoolInfo.directeur.trim() || null,
          site_web: schoolInfo.siteWeb.trim() || null,
        })
        .eq("id", etablissementId)
        .select("id, nom, adresse, ville, code_postal, telephone, email, directeur, site_web")
        .maybeSingle();

      if (e) {
        setError(e.message);
        return;
      }
      if (!data) {
        setError(
          "Enregistrement impossible : vérifiez vos droits ou contactez l'administrateur."
        );
        return;
      }
      setSchoolInfo({
        nom: data.nom as string,
        adresse: data.adresse as string,
        ville: (data.ville as string | null) ?? "",
        codePostal: (data.code_postal as string | null) ?? "",
        telephone: (data.telephone as string | null) ?? "",
        email: (data.email as string | null) ?? "",
        siteWeb: (data as { site_web?: string | null }).site_web ?? "",
        directeur: (data.directeur as string | null) ?? "",
      });
      setError(null);
      flash("Modifications enregistrées.", "success");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Retour aux parametres
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Établissement</h1>
        <p className="text-muted-foreground">Identité, coordonnées et direction de l&apos;établissement</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}
      <FlashNotice payload={notice} />

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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Ville</label>
            <input
              type="text"
              value={schoolInfo.ville}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, ville: e.target.value })}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Code postal</label>
            <input
              type="text"
              value={schoolInfo.codePostal}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, codePostal: e.target.value })}
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">Site Web</label>
            <input
              type="url"
              value={schoolInfo.siteWeb}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, siteWeb: e.target.value })}
              disabled={loading}
              placeholder="https://..."
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
            <p className="text-xs text-muted-foreground mt-1">Adresse du site web de l&apos;établissement (optionnel).</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={loading || saving || !etablissementId}
          onClick={() => void handleSaveSchoolInfo()}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20"
        >
          <Save className="w-4 h-4" />
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
