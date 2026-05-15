"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Users, User, MapPin, Calendar, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { embedOne } from "@/lib/supabase/embed";

type EleveRow = {
  id: string;
  firstName: string;
  lastName: string;
  genre: string;
  moyenne: number | null;
};

type ClassVM = {
  id: string;
  name: string;
  niveau: string;
  effectif: number;
  capacite: number;
  titulaire: string;
  salle: string;
  anneeScolaire: string;
  eleves: EleveRow[];
};

export default function ClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [vm, setVm] = useState<ClassVM | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) {
      setVm(null);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    setLoading(true);
    const { data: cl, error: e1 } = await supabase
      .from("classes")
      .select(
        `
        id, name, niveau, capacite, salle, titulaire_id,
        annees_scolaires ( annee )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (e1 || !cl) {
      setVm(null);
      setLoading(false);
      return;
    }

    let titulaireLabel = "—";
    if (cl.titulaire_id) {
      const { data: tp } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", cl.titulaire_id as string)
        .maybeSingle();
      if (tp) titulaireLabel = `${tp.first_name} ${tp.last_name}`;
    }

    const an = embedOne<{ annee: string }>((cl as { annees_scolaires?: unknown }).annees_scolaires);

    const { data: studs } = await supabase
      .from("students")
      .select("id, first_name, last_name, genre")
      .eq("classe_id", id)
      .eq("status", "active");

    const studentIds = (studs ?? []).map((s) => s.id as string);
    const moyMap = new Map<string, number>();
    if (studentIds.length) {
      const { data: notes } = await supabase.from("notes").select("student_id, note").in("student_id", studentIds);
      const agg = new Map<string, { sum: number; n: number }>();
      for (const n of notes ?? []) {
        const sid = n.student_id as string;
        const a = agg.get(sid) ?? { sum: 0, n: 0 };
        a.sum += Number(n.note);
        a.n += 1;
        agg.set(sid, a);
      }
      for (const [sid, a] of agg) {
        if (a.n) moyMap.set(sid, Math.round((a.sum / a.n) * 10) / 10);
      }
    }

    const eleves: EleveRow[] = (studs ?? []).map((s) => ({
      id: s.id as string,
      firstName: s.first_name as string,
      lastName: s.last_name as string,
      genre: s.genre as string,
      moyenne: moyMap.get(s.id as string) ?? null,
    }));

    setVm({
      id: cl.id as string,
      name: cl.name as string,
      niveau: cl.niveau as string,
      capacite: Number(cl.capacite),
      effectif: eleves.length,
      titulaire: titulaireLabel,
      salle: (cl.salle as string | null) ?? "—",
      anneeScolaire: an?.annee ?? "—",
      eleves,
    });
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="p-8 text-muted-foreground">Chargement…</div>;
  }

  if (!vm) {
    return (
      <div className="p-6 space-y-4">
        <button type="button" onClick={() => router.back()} className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="font-medium">Classe introuvable.</p>
      </div>
    );
  }

  const pourcentageRemplissage = vm.capacite ? Math.round((vm.effectif / vm.capacite) * 100) : 0;
  const valsMoy = vm.eleves.map((e) => e.moyenne).filter((m): m is number => m != null);
  const moyenneClasse = valsMoy.length ? valsMoy.reduce((a, b) => a + b, 0) / valsMoy.length : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <button type="button" onClick={() => router.back()} className="p-2 hover:bg-accent rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Détails de la classe</h1>
          <p className="text-muted-foreground">Effectif, emploi du temps et élèves de la classe</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/students")}
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/90 text-white rounded-lg font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Élèves
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/classes")}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium"
        >
          <Edit className="w-4 h-4" />
          Liste classes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">{vm.name}</h2>
                <p className="text-muted-foreground mt-1">Année scolaire {vm.anneeScolaire}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-md text-sm font-semibold">
                    {vm.niveau}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-success/10 text-success rounded-md text-sm font-semibold">
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Titulaire</p>
                  <p className="text-sm font-medium text-foreground">{vm.titulaire}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Salle</p>
                  <p className="text-sm font-medium text-foreground">{vm.salle}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Effectif</p>
                  <p className="text-sm font-medium text-foreground">
                    {vm.effectif} / {vm.capacite}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Année</p>
                  <p className="text-sm font-medium text-foreground">{vm.anneeScolaire}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Taux de remplissage</span>
                <span
                  className={`text-sm font-bold ${
                    pourcentageRemplissage >= 90 ? "text-danger" : pourcentageRemplissage >= 75 ? "text-warning" : "text-success"
                  }`}
                >
                  {pourcentageRemplissage}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    pourcentageRemplissage >= 90 ? "bg-danger" : pourcentageRemplissage >= 75 ? "bg-warning" : "bg-success"
                  }`}
                  style={{ width: `${Math.min(100, pourcentageRemplissage)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Élèves ({vm.eleves.length})</h3>
            <div className="space-y-2">
              {vm.eleves.map((eleve) => (
                <div
                  key={eleve.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/dashboard/students/${eleve.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/dashboard/students/${eleve.id}`)}
                  className="flex items-center justify-between p-4 bg-muted hover:bg-accent rounded-lg transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">
                        {eleve.firstName[0]}
                        {eleve.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {eleve.firstName} {eleve.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{eleve.genre === "M" ? "Garçon" : "Fille"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      {eleve.moyenne != null ? `${eleve.moyenne.toFixed(1)}/20` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Moyenne notes</p>
                  </div>
                </div>
              ))}
              {vm.eleves.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun élève dans cette classe.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Statistiques</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Moyenne de classe (notes)</p>
                <p className="text-3xl font-bold text-primary">
                  {moyenneClasse != null ? `${moyenneClasse.toFixed(2)}/20` : "—"}
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Répartition</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Garçons</span>
                    <span className="text-sm font-bold">{vm.eleves.filter((e) => e.genre === "M").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Filles</span>
                    <span className="text-sm font-bold">{vm.eleves.filter((e) => e.genre === "F").length}</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Places restantes</p>
                <p className="text-2xl font-bold">{Math.max(0, vm.capacite - vm.effectif)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
