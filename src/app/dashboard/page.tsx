"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Award,
  AlertTriangle,
  CheckCircle,
  LineChart as LineChartIcon,
  ClipboardList,
  CheckSquare,
  FileText,
} from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";

const COLORS = { boys: "#00aef0", girls: "#10a7aa" };

type ClasseEmbed = { niveau: string; name: string };

function embedClass(raw: unknown): ClasseEmbed | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) return (raw[0] as ClasseEmbed | undefined) ?? null;
  return raw as ClasseEmbed;
}

function embedOne<T extends object>(raw: unknown): T | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) return (raw[0] as T | undefined) ?? null;
  return raw as T;
}

type EffectifRow = { niveau: string; eleves: number };
type RepartRow = { name: string; value: number; color: string };
type MoyenneRow = { niveau: string; moyenne: number };
type TopRow = { name: string; classe: string; moyenne: number };
type WeekRow = { jour: string; absents: number; presents: number };
type CritRow = { name: string; classe: string; absences: number };
type ActivityRow = { action: string; detail: string; time: string };

type DashboardPayload = {
  totalStudents: number;
  boys: number;
  girls: number;
  effectifsData: EffectifRow[];
  repartitionData: RepartRow[];
  moyennesData: MoyenneRow[];
  topStudents: TopRow[];
  absencesWeekData: WeekRow[];
  elevesAbsencesCritiques: CritRow[];
  avgGlobal: number | null;
  alertAbsences: number;
  presenceHint: string;
  activities: ActivityRow[];
};

const emptyWeek: WeekRow[] = [
  { jour: "Lun", absents: 0, presents: 0 },
  { jour: "Mar", absents: 0, presents: 0 },
  { jour: "Mer", absents: 0, presents: 0 },
  { jour: "Jeu", absents: 0, presents: 0 },
  { jour: "Ven", absents: 0, presents: 0 },
  { jour: "Sam", absents: 0, presents: 0 },
  { jour: "Dim", absents: 0, presents: 0 },
];

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "À l'instant";
  if (h < 24) return `Il y a ${h}h`;
  return d.toLocaleDateString("fr-FR");
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      try {
        const { data: studs, error: e1 } = await supabase
          .from("students")
          .select("id, genre, created_at, classes(niveau, name)")
          .eq("status", "active");

        if (e1) throw e1;

        const totalStudents = studs?.length ?? 0;
        const boys = studs?.filter((s) => s.genre === "M").length ?? 0;
        const girls = totalStudents - boys;

        const byNiveau = new Map<string, number>();
        for (const s of studs ?? []) {
          const cl = embedClass(s.classes);
          const n = cl?.niveau ?? "Sans classe";
          byNiveau.set(n, (byNiveau.get(n) ?? 0) + 1);
        }
        const effectifsData: EffectifRow[] = Array.from(byNiveau.entries())
          .map(([niveau, eleves]) => ({ niveau, eleves }))
          .sort((a, b) => a.niveau.localeCompare(b.niveau));

        const repartitionData: RepartRow[] = [
          { name: "Garçons", value: boys, color: COLORS.boys },
          { name: "Filles", value: girls, color: COLORS.girls },
        ];

        const { data: noteRows, error: e2 } = await supabase.from("notes").select(`
            note,
            student_id,
            students ( first_name, last_name ),
            classes ( niveau, name )
          `);

        if (e2) throw e2;

        const moyByNiveau = new Map<string, { sum: number; n: number }>();
        const moyByStudent = new Map<
          string,
          { sum: number; n: number; fn: string; ln: string; classe: string }
        >();

        let sumAll = 0;
        let nAll = 0;
        for (const r of noteRows ?? []) {
          const note = Number(r.note);
          if (Number.isNaN(note)) continue;
          sumAll += note;
          nAll += 1;
          const cl = embedClass(r.classes);
          const st = embedOne<{ first_name: string; last_name: string }>(r.students);
          const niveau = cl?.niveau ?? "—";
          const aggN = moyByNiveau.get(niveau) ?? { sum: 0, n: 0 };
          aggN.sum += note;
          aggN.n += 1;
          moyByNiveau.set(niveau, aggN);

          const sid = r.student_id as string;
          const aggS = moyByStudent.get(sid) ?? {
            sum: 0,
            n: 0,
            fn: st?.first_name ?? "",
            ln: st?.last_name ?? "",
            classe: cl?.name ?? cl?.niveau ?? "—",
          };
          aggS.sum += note;
          aggS.n += 1;
          moyByStudent.set(sid, aggS);
        }

        const moyennesData: MoyenneRow[] = Array.from(moyByNiveau.entries())
          .map(([niveau, { sum, n }]) => ({ niveau, moyenne: n ? Math.round((sum / n) * 10) / 10 : 0 }))
          .sort((a, b) => a.niveau.localeCompare(b.niveau));

        const topStudents: TopRow[] = Array.from(moyByStudent.entries())
          .map(([, v]) => ({
            name: `${v.fn} ${v.ln}`.trim() || "Élève",
            classe: v.classe,
            moyenne: v.n ? Math.round((v.sum / v.n) * 10) / 10 : 0,
          }))
          .sort((a, b) => b.moyenne - a.moyenne)
          .slice(0, 3);

        const avgGlobal = nAll ? Math.round((sumAll / nAll) * 10) / 10 : null;

        const { data: absRows, error: e3 } = await supabase
          .from("absences")
          .select(
            `
            student_id,
            statut,
            date,
            students ( first_name, last_name, classes ( name ) )
          `
          );

        if (e3) throw e3;

        const absByStudent = new Map<string, number>();
        const metaByStudent = new Map<string, { name: string; classe: string }>();
        for (const r of absRows ?? []) {
          if (r.statut !== "absent") continue;
          const sid = r.student_id as string;
          absByStudent.set(sid, (absByStudent.get(sid) ?? 0) + 1);
          const st = embedOne<{
            first_name: string;
            last_name: string;
            classes: unknown;
          }>(r.students);
          if (!metaByStudent.has(sid) && st) {
            const classeNom = embedOne<{ name: string }>(st.classes);
            metaByStudent.set(sid, {
              name: `${st.first_name} ${st.last_name}`.trim(),
              classe: classeNom?.name ?? "—",
            });
          }
        }

        const elevesAbsencesCritiques: CritRow[] = Array.from(absByStudent.entries())
          .map(([sid, absences]) => {
            const m = metaByStudent.get(sid);
            return {
              name: m?.name ?? "Élève",
              classe: m?.classe ?? "—",
              absences,
            };
          })
          .sort((a, b) => b.absences - a.absences)
          .slice(0, 5);

        const alertAbsences = elevesAbsencesCritiques.filter((e) => e.absences >= 2).length;

        const labels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
        const weekMap = new Map<number, number>();
        for (const r of absRows ?? []) {
          if (r.statut !== "absent" || !r.date) continue;
          const dow = new Date(r.date as string).getDay();
          weekMap.set(dow, (weekMap.get(dow) ?? 0) + 1);
        }
        const absencesWeekData: WeekRow[] = labels.map((jour, i) => {
          const absents = weekMap.get(i) ?? 0;
          const presents = Math.max(0, totalStudents - absents);
          return { jour, absents, presents };
        });

        const { data: recentStuds } = await supabase
          .from("students")
          .select("first_name, last_name, classes(name), created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        const activities: ActivityRow[] = (recentStuds ?? []).map((s) => {
          const cl = embedClass(s.classes);
          return {
            action: "Élève inscrit",
            detail: `${s.first_name} ${s.last_name} — ${cl?.name ?? "—"}`,
            time: formatRelativeTime(s.created_at as string),
          };
        });

        const presenceHint =
          totalStudents > 0 && nAll > 0
            ? `Moy. notes (${nAll} saisies)`
            : "Synchronisé avec Supabase";

        if (!cancelled) {
          setData({
            totalStudents,
            boys,
            girls,
            effectifsData: effectifsData.length ? effectifsData : [{ niveau: "—", eleves: 0 }],
            repartitionData,
            moyennesData: moyennesData.length ? moyennesData : [{ niveau: "—", moyenne: 0 }],
            topStudents: topStudents.length ? topStudents : [{ name: "—", classe: "—", moyenne: 0 }],
            absencesWeekData,
            elevesAbsencesCritiques,
            avgGlobal,
            alertAbsences,
            presenceHint,
            activities: activities.length
              ? activities
              : [{ action: "Aucune activité", detail: "Ajoutez des élèves ou des notes", time: "—" }],
          });
          setLoadError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Erreur de chargement");
          setData(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statsCards = useMemo(() => {
    const d = data;
    if (!d) {
      return [
        { title: "Total Élèves", value: "—", icon: Users, color: "bg-primary/10 text-primary", trend: "Chargement…" },
        { title: "Moyenne générale", value: "—", icon: Award, color: "bg-success/10 text-success", trend: "" },
        { title: "Présence", value: "—", icon: CheckCircle, color: "bg-info/10 text-info", trend: "" },
        { title: "Alertes absences", value: "—", icon: AlertTriangle, color: "bg-warning/10 text-warning", trend: "" },
      ];
    }
    return [
      {
        title: "Total Élèves",
        value: String(d.totalStudents),
        icon: Users,
        color: "bg-primary/10 text-primary",
        trend: `${d.boys} G / ${d.girls} F`,
      },
      {
        title: "Moyenne générale",
        value: d.avgGlobal != null ? `${d.avgGlobal}/20` : "—",
        icon: Award,
        color: "bg-success/10 text-success",
        trend: "Sur les notes en base",
      },
      {
        title: "Indicateur",
        value: d.totalStudents ? "OK" : "0",
        icon: CheckCircle,
        color: "bg-info/10 text-info",
        trend: d.presenceHint,
      },
      {
        title: "Absences (élèves)",
        value: String(d.alertAbsences),
        icon: AlertTriangle,
        color: "bg-warning/10 text-warning",
        trend: "≥2 absences enregistrées",
      },
    ];
  }, [data]);

  const charts = data ?? {
    effectifsData: [{ niveau: "—", eleves: 0 }],
    repartitionData: [
      { name: "Garçons", value: 0, color: COLORS.boys },
      { name: "Filles", value: 0, color: COLORS.girls },
    ],
    moyennesData: [{ niveau: "—", moyenne: 0 }],
    topStudents: [{ name: "—", classe: "—", moyenne: 0 }],
    absencesWeekData: emptyWeek,
    elevesAbsencesCritiques: [] as CritRow[],
    activities: [
      {
        action: loadError ? "Erreur" : "Chargement…",
        detail: loadError ?? "Récupération des données Supabase",
        time: "",
      },
    ] as ActivityRow[],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">Vue d&apos;ensemble (données Supabase)</p>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {loadError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
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
          type="button"
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
          type="button"
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
                  {stat.trend ? <p className="text-xs text-muted-foreground mt-2">{stat.trend}</p> : null}
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Effectifs par niveau</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.effectifsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="niveau" stroke="#64748b" />
              <YAxis allowDecimals={false} stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="eleves" fill="#10a7aa" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Répartition F / G</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={charts.repartitionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {charts.repartitionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Moyennes par niveau (notes)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.moyennesData}>
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

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-warning" />
            Top élèves (moyenne des notes)
          </h3>
          <div className="space-y-4">
            {charts.topStudents.map((student, index) => (
              <div key={`${student.name}-${index}`} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    index === 0
                      ? "bg-warning/20 text-warning"
                      : index === 1
                        ? "bg-muted text-muted-foreground"
                        : "bg-orange-100 text-orange-600"
                  }`}
                >
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-info" />
            Absences par jour de la semaine (toutes dates confondues)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={charts.absencesWeekData}>
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

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger" />
            Absences par élève
          </h3>
          {charts.elevesAbsencesCritiques.length ? (
            <div className="space-y-3">
              {charts.elevesAbsencesCritiques.map((eleve, index) => (
                <div
                  key={`${eleve.name}-${index}`}
                  className="flex items-center justify-between p-3 bg-danger/5 border border-danger/20 rounded-lg"
                >
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
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune absence &quot;absent&quot; en base.</p>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Derniers élèves inscrits</h3>
        <div className="space-y-4">
          {charts.activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
              <div className="w-2 h-2 bg-primary rounded-full mt-2" />
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
