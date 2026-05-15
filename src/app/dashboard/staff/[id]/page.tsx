"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Phone, Mail, MapPin, Calendar, BookOpen, School } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { embedOne } from "@/lib/supabase/embed";
import { dayLabelFromDb } from "@/lib/supabase/day-map";

type VM = {
  firstName: string;
  lastName: string;
  role: string;
  matiere: string;
  classe: string;
  email: string;
  phone: string;
  adresse: string;
  dateEmbauche: string | null;
  emploiRows: { jour: string; horaire: string; classe: string; matiere: string }[];
  heuresSemaine: number;
  nombreEleves: number;
  anciennete: number;
};

function roleLabel(role: string) {
  if (role === "enseignant") return "Enseignant";
  if (role === "admin" || role === "super_admin") return "Administration";
  if (role === "secretaire") return "Secrétaire";
  if (role === "comptable") return "Comptable";
  if (role === "surveillant") return "Surveillant";
  return role;
}

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [vm, setVm] = useState<VM | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) {
      setVm(null);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    setLoading(true);
    const { data: row, error } = await supabase
      .from("staff")
      .select(
        `
        id, user_id, date_embauche, adresse,
        profiles ( first_name, last_name, email, phone, role ),
        matieres ( nom ),
        classes ( id, name )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !row) {
      setVm(null);
      setLoading(false);
      return;
    }

    const p = embedOne<{ first_name: string; last_name: string; email: string | null; phone: string | null; role: string }>(
      (row as { profiles?: unknown }).profiles
    );
    const m = embedOne<{ nom: string }>((row as { matieres?: unknown }).matieres);
    const cl = embedOne<{ id: string; name: string }>((row as { classes?: unknown }).classes);

    const userId = row.user_id as string;
    const { data: edt } = await supabase
      .from("emplois_du_temps")
      .select(
        `
        jour, heure_debut, heure_fin,
        matieres ( nom ),
        classes ( name )
      `
      )
      .eq("enseignant_id", userId);

    const emploiRows = (edt ?? []).map((e) => {
      const mat = embedOne<{ nom: string }>((e as { matieres?: unknown }).matieres);
      const cls = embedOne<{ name: string }>((e as { classes?: unknown }).classes);
      return {
        jour: dayLabelFromDb(String(e.jour)),
        horaire: `${e.heure_debut} – ${e.heure_fin}`,
        classe: cls?.name ?? "—",
        matiere: mat?.nom ?? "—",
      };
    });

    let nombreEleves = 0;
    if (cl?.id) {
      const { count } = await supabase
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("classe_id", cl.id)
        .eq("status", "active");
      nombreEleves = count ?? 0;
    }

    const emb = row.date_embauche as string | null;
    let anciennete = 0;
    if (emb) {
      anciennete = Math.max(0, Math.floor((Date.now() - new Date(emb).getTime()) / (365.25 * 24 * 3600000)));
    }

    let heuresSemaine = 0;
    for (const e of edt ?? []) {
      const a = String((e as { heure_debut: string }).heure_debut).split(":");
      const b = String((e as { heure_fin: string }).heure_fin).split(":");
      const start = parseInt(a[0], 10) * 60 + parseInt(a[1] || "0", 10);
      const end = parseInt(b[0], 10) * 60 + parseInt(b[1] || "0", 10);
      if (end > start) heuresSemaine += (end - start) / 60;
    }

    setVm({
      firstName: p?.first_name ?? "—",
      lastName: p?.last_name ?? "—",
      role: p ? roleLabel(p.role) : "—",
      matiere: m?.nom ?? "—",
      classe: cl?.name ?? "—",
      email: p?.email ?? "—",
      phone: p?.phone ?? "—",
      adresse: (row.adresse as string | null) ?? "—",
      dateEmbauche: emb,
      emploiRows,
      heuresSemaine: Math.round(heuresSemaine * 10) / 10,
      nombreEleves,
      anciennete,
    });
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="p-8 text-muted-foreground">Chargement…</div>;
  if (!vm) {
    return (
      <div className="p-6 space-y-4">
        <button type="button" onClick={() => router.back()} className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="font-medium">Fiche introuvable.</p>
      </div>
    );
  }

  const badge =
    vm.role === "Administration"
      ? "bg-danger/10 text-danger"
      : vm.role === "Enseignant"
        ? "bg-primary/10 text-primary"
        : vm.role === "Secrétaire"
          ? "bg-info/10 text-info"
          : vm.role === "Comptable"
            ? "bg-amber-500/10 text-amber-800 dark:text-amber-200"
            : vm.role === "Surveillant"
              ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
              : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <button type="button" onClick={() => router.back()} className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Fiche personnel</h1>
          <p className="text-muted-foreground">Fiche membre du personnel</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/staff")}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium"
        >
          <Edit className="w-4 h-4" />
          Liste
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-3xl">
                  {vm.firstName[0]}
                  {vm.lastName[0]}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">
                  {vm.firstName} {vm.lastName}
                </h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold mt-2 ${badge}`}>
                  {vm.role}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Matière</p>
                  <p className="text-sm font-medium text-foreground">{vm.matiere}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <School className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Classe liée</p>
                  <p className="text-sm font-medium text-foreground">{vm.classe}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="text-sm font-medium text-foreground">{vm.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">{vm.email}</p>
                </div>
              </div>
              {vm.dateEmbauche && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Embauche</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(vm.dateEmbauche).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Adresse</p>
                  <p className="text-sm font-medium text-foreground">{vm.adresse}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Créneaux (emplois_du_temps)</h3>
            {vm.emploiRows.length ? (
              <div className="space-y-3">
                {vm.emploiRows.map((slot, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {slot.jour} — {slot.matiere}
                      </p>
                      <p className="text-xs text-muted-foreground">{slot.classe}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">{slot.horaire}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun créneau pour cet enseignant.</p>
            )}
            <div className="mt-4 pt-4 border-t border-border flex justify-between">
              <span className="text-sm text-muted-foreground">Volume hebdo (approx.)</span>
              <span className="text-xl font-bold text-primary">{vm.heuresSemaine}h</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Statistiques</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Élèves (classe liée)</p>
                <p className="text-2xl font-bold">{vm.nombreEleves}</p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Ancienneté</p>
                <p className="text-2xl font-bold">{vm.anciennete} ans</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
