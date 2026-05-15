"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Users, User, Edit, Trash2, Eye } from "lucide-react";
import AddClassModal from "@/components/AddClassModal";
import FlashNotice from "@/components/FlashNotice";
import { useFlashNotice } from "@/hooks/useFlashNotice";
import { useDashboardProfile } from "@/hooks/useDashboardProfile";
import { canDashboardAction } from "@/lib/dashboard-action-policy";
import { createClient } from "@/lib/supabase/client";
import { embedOne } from "@/lib/supabase/embed";

type ClasseRow = {
  id: string;
  name: string;
  niveau: string;
  effectif: number;
  capacite: number;
  titulaire: string;
  salle: string;
  status: string;
  anneeScolaire: string;
  titulaireId: string | null;
};

export default function ClassesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [classes, setClasses] = useState<ClasseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [titulaireOptions, setTitulaireOptions] = useState<{ value: string; label: string }[]>([]);
  const [anneeScolaireOptions, setAnneeScolaireOptions] = useState<{ value: string; label: string }[]>([]);
  const [anneesLoading, setAnneesLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClasseRow | null>(null);
  const { notice, flash } = useFlashNotice();
  const { profile } = useDashboardProfile();
  const role = profile?.role ?? null;
  const canClasseWrite = canDashboardAction(role, "classeWrite");

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    setError(null);
    try {
      setAnneesLoading(true);
      const { data: anRows, error: anErr } = await supabase.from("annees_scolaires").select("annee").order("annee");
      if (!anErr && anRows?.length) {
        setAnneeScolaireOptions(
          anRows.map((a) => ({ value: a.annee as string, label: a.annee as string }))
        );
      } else {
        setAnneeScolaireOptions([]);
      }
      setAnneesLoading(false);

      const { data: profs } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .in("role", ["enseignant", "admin", "super_admin"])
        .eq("status", "active");
      setTitulaireOptions(
        (profs ?? []).map((p) => ({
          value: p.id as string,
          label: `${p.first_name} ${p.last_name} (${p.role})`,
        }))
      );

      const { data: clRows, error: e1 } = await supabase
        .from("classes")
        .select(
          `
          id, name, niveau, capacite, salle, status, titulaire_id,
          annees_scolaires ( annee )
        `
        )
        .eq("status", "active")
        .order("niveau");

      if (e1) throw e1;

      const { data: studs } = await supabase
        .from("students")
        .select("id, classe_id")
        .eq("status", "active");

      const countBy = new Map<string, number>();
      for (const s of studs ?? []) {
        if (!s.classe_id) continue;
        countBy.set(s.classe_id, (countBy.get(s.classe_id) ?? 0) + 1);
      }

      const titIds = [...new Set((clRows ?? []).map((c) => c.titulaire_id).filter(Boolean))] as string[];
      const titMap = new Map<string, string>();
      if (titIds.length) {
        const { data: titProfs } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", titIds);
        for (const p of titProfs ?? []) {
          titMap.set(p.id as string, `${p.first_name} ${p.last_name}`);
        }
      }

      const mapped: ClasseRow[] = (clRows ?? []).map((c) => {
        const an = embedOne<{ annee: string }>((c as { annees_scolaires?: unknown }).annees_scolaires);
        return {
          id: c.id as string,
          name: c.name as string,
          niveau: c.niveau as string,
          capacite: Number(c.capacite),
          effectif: countBy.get(c.id as string) ?? 0,
          titulaire: c.titulaire_id ? titMap.get(c.titulaire_id as string) ?? "—" : "—",
          salle: (c.salle as string | null) ?? "—",
          status: c.status as string,
          anneeScolaire: an?.annee ?? "—",
          titulaireId: (c.titulaire_id as string | null) ?? null,
        };
      });
      setClasses(mapped);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur chargement");
      setClasses([]);
      setAnneesLoading(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredClasses = useMemo(
    () =>
      classes.filter(
        (classe) =>
          classe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          classe.titulaire.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [classes, searchTerm]
  );

  const resolveAnnee = async (supabase: ReturnType<typeof createClient>, label: string) => {
    const { data } = await supabase.from("annees_scolaires").select("id, etablissement_id").eq("annee", label).maybeSingle();
    return data as { id: string; etablissement_id: string } | null;
  };

  const handleAddClass = async (newClass: Record<string, unknown>) => {
    const supabase = createClient();
    const an = await resolveAnnee(supabase, String(newClass.anneeScolaire ?? ""));
    if (!an) {
      flash(
        `Année scolaire introuvable : ${newClass.anneeScolaire}. Créez-la dans Paramètres → Année scolaire.`,
        "error"
      );
      return false;
    }
    const tit = String(newClass.titulaire || "").trim() || null;
    const { error: err } = await supabase.from("classes").insert({
      etablissement_id: an.etablissement_id,
      annee_scolaire_id: an.id,
      name: String(newClass.name),
      niveau: newClass.niveau as "CP" | "CE1" | "CE2" | "CM1" | "CM2" | "6ème",
      capacite: Number(newClass.capacite) || 30,
      salle: String(newClass.salle || "").trim() || null,
      titulaire_id: tit,
      status: "active",
    });
    if (err) {
      flash(err.message, "error");
      return false;
    }
    await load();
    flash("Classe créée.", "success");
  };

  const handleEditClass = async (updated: Record<string, unknown> & { id: string }) => {
    const supabase = createClient();
    const an = await resolveAnnee(supabase, String(updated.anneeScolaire ?? ""));
    if (!an) {
      flash("Année scolaire introuvable.", "error");
      return false;
    }
    const tit = String(updated.titulaire || "").trim() || null;
    const { error: err } = await supabase
      .from("classes")
      .update({
        name: String(updated.name),
        niveau: updated.niveau as "CP" | "CE1" | "CE2" | "CM1" | "CM2" | "6ème",
        capacite: Number(updated.capacite) || 30,
        salle: String(updated.salle || "").trim() || null,
        titulaire_id: tit,
        annee_scolaire_id: an.id,
        etablissement_id: an.etablissement_id,
      })
      .eq("id", String(updated.id));
    if (err) {
      flash(err.message, "error");
      return false;
    }
    await load();
    flash("Classe mise à jour.", "success");
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Supprimer cette classe ? (impossible s’il reste des élèves liés)")) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("classes").delete().eq("id", id);
    if (err) {
      flash(err.message, "error");
      return;
    }
    await load();
    flash("Classe supprimée.", "success");
  };

  const getEffectifColor = (effectif: number, capacite: number) => {
    const percentage = capacite ? (effectif / capacite) * 100 : 0;
    if (percentage >= 90) return "text-danger";
    if (percentage >= 75) return "text-warning";
    return "text-success";
  };

  return (
    <div className="space-y-6">
      <FlashNotice payload={notice} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Gestion des classes</h1>
          <p className="text-muted-foreground">Groupes, effectifs et affectations</p>
        </div>
        {canClasseWrite ? (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex w-full shrink-0 items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition shadow-lg shadow-primary/20 sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            Créer une classe
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Rechercher une classe ou un titulaire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total classes</p>
          <p className="text-2xl font-bold text-foreground mt-1">{loading ? "…" : classes.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total élèves</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {loading ? "…" : classes.reduce((sum, c) => sum + c.effectif, 0)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Moyenne / classe</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {loading || !classes.length
              ? "—"
              : Math.round(classes.reduce((s, c) => s + c.effectif, 0) / classes.length)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Classes pleines</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {loading ? "…" : classes.filter((c) => c.effectif >= c.capacite).length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-muted-foreground col-span-full">Chargement…</p>
        ) : (
          filteredClasses.map((classe) => {
            const pourcentage = classe.capacite ? Math.round((classe.effectif / classe.capacite) * 100) : 0;
            return (
              <div
                key={classe.id}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">{classe.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{classe.salle}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-semibold">
                    {classe.niveau}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                  <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Titulaire</p>
                    <p className="text-sm font-medium text-foreground">{classe.titulaire}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Effectif</span>
                    </div>
                    <span className={`text-sm font-bold ${getEffectifColor(classe.effectif, classe.capacite)}`}>
                      {classe.effectif}/{classe.capacite}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        pourcentage >= 90 ? "bg-danger" : pourcentage >= 75 ? "bg-warning" : "bg-success"
                      }`}
                      style={{ width: `${Math.min(100, pourcentage)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{pourcentage}% de remplissage</p>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/classes/${classe.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-background hover:bg-accent border border-input rounded-lg transition text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    Voir
                  </button>
                  {canClasseWrite ? (
                    <button
                      type="button"
                      onClick={() => setEditingClass(classe)}
                      className="flex items-center justify-center p-2 hover:bg-accent border border-input rounded-lg transition"
                    >
                      <Edit className="w-4 h-4 text-primary" />
                    </button>
                  ) : null}
                  {canClasseWrite ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteClass(classe.id)}
                      className="flex items-center justify-center p-2 hover:bg-accent border border-input rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4 text-danger" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && filteredClasses.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Aucune classe</h3>
          <p className="text-muted-foreground">Créez une classe ou vérifiez le filtre.</p>
        </div>
      )}

      <AddClassModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddClass}
        titulaireOptions={titulaireOptions}
        anneeScolaireOptions={anneeScolaireOptions}
        anneesLoading={anneesLoading}
      />

      {editingClass ? (
        <AddClassModal
          isOpen
          onClose={() => setEditingClass(null)}
          onSubmit={handleEditClass}
          classe={{
            id: editingClass.id,
            name: editingClass.name,
            niveau: editingClass.niveau,
            capacite: editingClass.capacite,
            salle: editingClass.salle === "—" ? "" : editingClass.salle,
            titulaire: editingClass.titulaireId ?? "",
            anneeScolaire: editingClass.anneeScolaire,
          }}
          titulaireOptions={titulaireOptions}
          anneeScolaireOptions={anneeScolaireOptions}
          anneesLoading={anneesLoading}
        />
      ) : null}
    </div>
  );
}
