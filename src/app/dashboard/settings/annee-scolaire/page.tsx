"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Calendar, Edit, Plus, Save } from "lucide-react";
import AddTrimestreModal from "@/components/AddTrimestreModal";
import FlashNotice from "@/components/FlashNotice";
import { useFlashNotice } from "@/hooks/useFlashNotice";
import { createClient } from "@/lib/supabase/client";
import { fetchPrimaryEtablissement } from "@/lib/supabase/etablissement-settings";

type TrimestreRow = {
  id: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
  numero: number;
};

export default function AnneeScolaireSettingsPage() {
  const [anneeId, setAnneeId] = useState<string | null>(null);
  const [anneeScolaire, setAnneeScolaire] = useState({
    annee: "",
    dateDebut: "",
    dateFin: "",
    active: true,
  });
  const [trimestres, setTrimestres] = useState<TrimestreRow[]>([]);
  const [isAddTrimestreOpen, setIsAddTrimestreOpen] = useState(false);
  const [editingTrimestre, setEditingTrimestre] = useState<TrimestreRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notice, flash } = useFlashNotice();

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    setError(null);
    const { row: etab, error: e0 } = await fetchPrimaryEtablissement(supabase);
    if (e0 || !etab) {
      setError(e0 ?? "Établissement introuvable.");
      setLoading(false);
      return;
    }

    const { data: annee, error: e1 } = await supabase
      .from("annees_scolaires")
      .select("id, annee, date_debut, date_fin, is_active")
      .eq("etablissement_id", etab.id)
      .eq("is_active", true)
      .maybeSingle();

    let anneeRow = annee;
    if (!anneeRow) {
      const { data: fallback } = await supabase
        .from("annees_scolaires")
        .select("id, annee, date_debut, date_fin, is_active")
        .eq("etablissement_id", etab.id)
        .order("date_debut", { ascending: false })
        .limit(1)
        .maybeSingle();
      anneeRow = fallback;
    }

    if (!anneeRow) {
      setError("Aucune année scolaire en base.");
      setLoading(false);
      return;
    }

    const aid = anneeRow.id as string;
    setAnneeId(aid);
    setAnneeScolaire({
      annee: anneeRow.annee as string,
      dateDebut: (anneeRow.date_debut as string).slice(0, 10),
      dateFin: (anneeRow.date_fin as string).slice(0, 10),
      active: !!(anneeRow as { is_active?: boolean }).is_active,
    });

    const { data: tr, error: e2 } = await supabase
      .from("trimestres")
      .select("id, nom, numero, date_debut, date_fin")
      .eq("annee_scolaire_id", aid)
      .order("numero");
    if (e2) {
      setError(e2.message);
      setLoading(false);
      return;
    }
    setTrimestres(
      (tr ?? []).map((t) => ({
        id: t.id as string,
        nom: t.nom as string,
        numero: Number(t.numero),
        dateDebut: (t.date_debut as string).slice(0, 10),
        dateFin: (t.date_fin as string).slice(0, 10),
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveAnnee = async () => {
    if (!anneeId) return;
    const supabase = createClient();
    setSaving(true);
    setError(null);
    try {
      const { row: etab } = await fetchPrimaryEtablissement(supabase);
      const etabId = etab?.id;
      if (anneeScolaire.active && etabId) {
        await supabase.from("annees_scolaires").update({ is_active: false }).eq("etablissement_id", etabId);
      }
      const { error: e } = await supabase
        .from("annees_scolaires")
        .update({
          annee: anneeScolaire.annee.trim(),
          date_debut: anneeScolaire.dateDebut,
          date_fin: anneeScolaire.dateFin,
          is_active: anneeScolaire.active,
        })
        .eq("id", anneeId);
      if (e) throw e;
      flash("Année scolaire enregistrée.", "success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTrimestre = async (data: { nom: string; dateDebut: string; dateFin: string }) => {
    if (!anneeId) return;
    const supabase = createClient();
    const nextNum = trimestres.length ? Math.max(...trimestres.map((t) => t.numero)) + 1 : 1;
    const { data: inserted, error } = await supabase
      .from("trimestres")
      .insert({
        annee_scolaire_id: anneeId,
        nom: data.nom.trim(),
        numero: nextNum,
        date_debut: data.dateDebut,
        date_fin: data.dateFin,
      })
      .select("id, nom, numero, date_debut, date_fin")
      .single();
    if (error) {
      flash(error.message, "error");
      return;
    }
    setTrimestres([
      ...trimestres,
      {
        id: inserted.id as string,
        nom: inserted.nom as string,
        numero: Number(inserted.numero),
        dateDebut: (inserted.date_debut as string).slice(0, 10),
        dateFin: (inserted.date_fin as string).slice(0, 10),
      },
    ]);
    flash("Trimestre ajouté.", "success");
  };

  const handleEditTrimestre = async (data: TrimestreRow & { nom: string; dateDebut: string; dateFin: string }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("trimestres")
      .update({
        nom: data.nom.trim(),
        date_debut: data.dateDebut,
        date_fin: data.dateFin,
      })
      .eq("id", data.id);
    if (error) {
      flash(error.message, "error");
      return;
    }
    setTrimestres(
      trimestres.map((t) =>
        t.id === data.id
          ? { ...t, nom: data.nom.trim(), dateDebut: data.dateDebut, dateFin: data.dateFin }
          : t
      )
    );
    setEditingTrimestre(null);
    flash("Trimestre mis à jour.", "success");
  };

  return (
    <div className="space-y-6">
      <FlashNotice payload={notice} />
      <div>
        <Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Retour aux parametres
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Année scolaire</h1>
        <p className="text-muted-foreground">Tables `annees_scolaires` et `trimestres`</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-secondary" />
          Année scolaire
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Année <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={anneeScolaire.annee}
              onChange={(e) => setAnneeScolaire({ ...anneeScolaire, annee: e.target.value })}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date de début <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={anneeScolaire.dateDebut}
              onChange={(e) => setAnneeScolaire({ ...anneeScolaire, dateDebut: e.target.value })}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date de fin <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={anneeScolaire.dateFin}
              onChange={(e) => setAnneeScolaire({ ...anneeScolaire, dateFin: e.target.value })}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            id="active-annee"
            checked={anneeScolaire.active}
            onChange={(e) => setAnneeScolaire({ ...anneeScolaire, active: e.target.checked })}
            disabled={loading}
            className="w-4 h-4 text-primary border-input rounded focus:ring-2 focus:ring-ring"
          />
          <label htmlFor="active-annee" className="text-sm font-medium text-foreground">
            Année scolaire active
          </label>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-info" />
            Trimestres
          </h3>
          <button
            type="button"
            onClick={() => setIsAddTrimestreOpen(true)}
            disabled={loading || !anneeId}
            className="flex items-center gap-2 px-3 py-2 bg-info/10 hover:bg-info/20 text-info rounded-lg transition font-medium border border-info/20 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : (
            trimestres.map((trimestre) => (
              <div key={trimestre.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{trimestre.nom}</p>
                  <p className="text-sm text-muted-foreground">
                    Du {new Date(trimestre.dateDebut).toLocaleDateString("fr-FR")} au{" "}
                    {new Date(trimestre.dateFin).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingTrimestre(trimestre)}
                    className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-primary"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={loading || saving || !anneeId}
          onClick={() => void handleSaveAnnee()}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20"
        >
          <Save className="w-4 h-4" />
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      <AddTrimestreModal
        isOpen={isAddTrimestreOpen}
        onClose={() => setIsAddTrimestreOpen(false)}
        onSubmit={(d) => void handleAddTrimestre(d as { nom: string; dateDebut: string; dateFin: string })}
      />

      {editingTrimestre && (
        <AddTrimestreModal
          isOpen={!!editingTrimestre}
          onClose={() => setEditingTrimestre(null)}
          onSubmit={(d) => void handleEditTrimestre(d as TrimestreRow & { nom: string; dateDebut: string; dateFin: string })}
          trimestre={editingTrimestre}
        />
      )}
    </div>
  );
}
