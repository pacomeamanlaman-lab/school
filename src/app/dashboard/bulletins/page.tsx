"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Download, Eye, Send, FileSpreadsheet } from "lucide-react";
import FlashNotice from "@/components/FlashNotice";
import WhatsAppNotifyModal from "@/components/WhatsAppNotifyModal";
import { useFlashNotice } from "@/hooks/useFlashNotice";
import { useDashboardProfile } from "@/hooks/useDashboardProfile";
import { canDashboardAction } from "@/lib/dashboard-action-policy";
import { buildBulletinWhatsAppContext, type WhatsAppNotifyContext } from "@/lib/whatsapp-templates-mvp";
import { exportBulletinToPDF } from "@/utils/pdfExport";
import { exportBulletinsToExcel } from "@/utils/excelExport";
import { createClient } from "@/lib/supabase/client";
import { embedOne } from "@/lib/supabase/embed";

type ClasseOption = { id: string; name: string };
type TrimestreOption = { id: string; nom: string };

export type BulletinStudent = {
  id: string;
  firstName: string;
  lastName: string;
  classe: string;
  moyenne: number;
  rang: number;
  notes: { matiere: string; note: number; coef: number; appreciation: string }[];
  appreciationGenerale: string;
};

function appreciationGeneraleFromMoyenne(m: number): string {
  if (m >= 16) return "Excellent parcours sur la période.";
  if (m >= 14) return "Bon niveau général ; poursuivre les efforts.";
  if (m >= 10) return "Résultats satisfaisants ; certaines matières peuvent être consolidées.";
  return "Résultats fragiles ; un accompagnement renforcé est recommandé.";
}

export default function BulletinsPage() {
  const [classes, setClasses] = useState<ClasseOption[]>([]);
  const [trimestres, setTrimestres] = useState<TrimestreOption[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState("");
  const [selectedTrimestreId, setSelectedTrimestreId] = useState("");
  const [bulletinStudents, setBulletinStudents] = useState<BulletinStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<BulletinStudent | null>(null);
  const [waContext, setWaContext] = useState<WhatsAppNotifyContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notice, flash } = useFlashNotice();
  const { profile } = useDashboardProfile();
  const userRole = profile?.role ?? null;
  const canBulletinPdf = canDashboardAction(userRole, "bulletinPdfExcel");
  const canBulletinNotify = canDashboardAction(userRole, "bulletinParentNotify");

  const selectedClassName = useMemo(
    () => classes.find((c) => c.id === selectedClasseId)?.name ?? "",
    [classes, selectedClasseId]
  );
  const selectedTrimestreNom = useMemo(
    () => trimestres.find((t) => t.id === selectedTrimestreId)?.nom ?? "",
    [trimestres, selectedTrimestreId]
  );

  const loadMeta = useCallback(async () => {
    const supabase = createClient();
    const [{ data: cl, error: e1 }, { data: tr, error: e2 }] = await Promise.all([
      supabase.from("classes").select("id, name").eq("status", "active").order("niveau"),
      supabase.from("trimestres").select("id, nom, numero").order("numero"),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;
    const clOpts = (cl ?? []).map((r) => ({ id: r.id as string, name: r.name as string }));
    const tOpts = (tr ?? []).map((r) => ({ id: r.id as string, nom: r.nom as string }));
    setClasses(clOpts);
    setTrimestres(tOpts);
    setSelectedClasseId((prev) => prev || clOpts[0]?.id || "");
    setSelectedTrimestreId((prev) => prev || tOpts[0]?.id || "");
  }, []);

  const loadBulletins = useCallback(async (classeId: string, trimestreId: string, classeName: string) => {
    if (!classeId || !trimestreId) {
      setBulletinStudents([]);
      return;
    }
    const supabase = createClient();
    const { data: studs, error: e1 } = await supabase
      .from("students")
      .select("id, first_name, last_name")
      .eq("classe_id", classeId)
      .eq("status", "active")
      .order("last_name");
    if (e1) throw e1;
    const studentIds = (studs ?? []).map((s) => s.id as string);
    if (studentIds.length === 0) {
      setBulletinStudents([]);
      return;
    }

    const { data: nrows, error: e2 } = await supabase
      .from("notes")
      .select(
        `
        student_id, note, appreciation,
        matieres ( nom, coefficient )
      `
      )
      .eq("classe_id", classeId)
      .eq("trimestre_id", trimestreId)
      .in("student_id", studentIds);
    if (e2) throw e2;

    const byStudent = new Map<
      string,
      { matiere: string; note: number; coef: number; appreciation: string }[]
    >();
    for (const sid of studentIds) byStudent.set(sid, []);
    for (const r of nrows ?? []) {
      const sid = r.student_id as string;
      const m = embedOne<{ nom: string; coefficient: number }>(r.matieres);
      const arr = byStudent.get(sid);
      if (!arr) continue;
      arr.push({
        matiere: m?.nom ?? "—",
        note: Number(r.note),
        coef: Number(m?.coefficient) || 1,
        appreciation: (r.appreciation as string) || "—",
      });
    }

    const rows: BulletinStudent[] = (studs ?? []).map((s) => {
      const sid = s.id as string;
      const notes = byStudent.get(sid) ?? [];
      let sum = 0;
      let csum = 0;
      for (const n of notes) {
        sum += n.note * n.coef;
        csum += n.coef;
      }
      const moyenne = csum > 0 ? Math.round((sum / csum) * 100) / 100 : 0;
      return {
        id: sid,
        firstName: s.first_name as string,
        lastName: s.last_name as string,
        classe: classeName,
        moyenne,
        rang: 0,
        notes,
        appreciationGenerale: appreciationGeneraleFromMoyenne(moyenne),
      };
    });

    const sorted = [...rows].sort((a, b) => b.moyenne - a.moyenne);
    const rankMap = new Map<string, number>();
    sorted.forEach((r, i) => rankMap.set(r.id, i + 1));
    for (const r of rows) {
      r.rang = rankMap.get(r.id) ?? 0;
    }
    setBulletinStudents(rows);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadMeta();
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMeta]);

  useEffect(() => {
    if (!selectedClasseId || !selectedTrimestreId) return;
    let cancelled = false;
    const name = classes.find((c) => c.id === selectedClasseId)?.name ?? "";
    (async () => {
      try {
        await loadBulletins(selectedClasseId, selectedTrimestreId, name);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedClasseId, selectedTrimestreId, classes, loadBulletins]);

  const moyenneClasse = useMemo(() => {
    const withNotes = bulletinStudents.filter((s) => s.notes.length > 0);
    if (!withNotes.length) return 0;
    return withNotes.reduce((a, s) => a + s.moyenne, 0) / withNotes.length;
  }, [bulletinStudents]);

  const handleGeneratePDF = async (student: BulletinStudent) => {
    if (!canBulletinPdf) {
      flash("Export PDF non autorisé pour votre rôle.", "error");
      return;
    }
    setSelectedStudent(student);
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      await exportBulletinToPDF(`${student.firstName} ${student.lastName}`, selectedTrimestreNom);
      setSelectedStudent(null);
    } catch (e) {
      console.error(e);
      flash("Erreur PDF.", "error");
      setSelectedStudent(null);
    }
  };

  const handleGenerateAllPDF = async () => {
    if (!canBulletinPdf) {
      flash("Export PDF non autorisé pour votre rôle.", "error");
      return;
    }
    for (const student of bulletinStudents) {
      setSelectedStudent(student);
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        await exportBulletinToPDF(`${student.firstName} ${student.lastName}`, selectedTrimestreNom);
      } catch (e) {
        console.error(e);
      }
    }
    setSelectedStudent(null);
    flash(`${bulletinStudents.length} bulletin(s) traité(s).`, "success");
  };

  const handleExportExcel = () => {
    if (!canBulletinPdf) {
      flash("Export Excel non autorisé pour votre rôle.", "error");
      return;
    }
    exportBulletinsToExcel(selectedClassName, selectedTrimestreNom, bulletinStudents);
  };

  return (
    <div className="space-y-6">
      <FlashNotice payload={notice} />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bulletins scolaires</h1>
        <p className="text-muted-foreground">Synthèses et moyennes par période</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Classe <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={selectedClasseId}
                onChange={(e) => setSelectedClasseId(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none"
              >
                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Trimestre <span className="text-danger">*</span>
            </label>
            <select
              value={selectedTrimestreId}
              onChange={(e) => setSelectedTrimestreId(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none"
            >
              {trimestres.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-3">
            <button
              type="button"
              disabled={!canBulletinPdf}
              onClick={() => void handleGenerateAllPDF()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              PDF (tous)
            </button>
            <button
              type="button"
              disabled={!canBulletinPdf}
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-success rounded-lg transition font-medium border border-input shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Élèves</p>
          <p className="text-2xl font-bold text-foreground mt-1">{loading ? "…" : bulletinStudents.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Moyenne de classe</p>
          <p className="text-2xl font-bold text-primary mt-1">
            {bulletinStudents.some((s) => s.notes.length > 0) ? `${moyenneClasse.toFixed(2)}/20` : "—"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Période</p>
          <p className="text-lg font-bold text-foreground mt-1">{selectedTrimestreNom || "—"}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Élèves - {selectedClassName} ({bulletinStudents.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Élève</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Moyenne</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Rang</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Statut</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Chargement…
                  </td>
                </tr>
              ) : bulletinStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Aucun élève ou aucune note pour cette période.
                  </td>
                </tr>
              ) : (
                bulletinStudents.map((student) => (
                  <tr key={student.id} className="border-b border-border hover:bg-accent/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {student.firstName[0]}
                            {student.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {student.firstName} {student.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`text-lg font-bold ${
                          student.moyenne >= 16
                            ? "text-success"
                            : student.moyenne >= 14
                              ? "text-primary"
                              : student.moyenne >= 10
                                ? "text-warning"
                                : "text-danger"
                        }`}
                      >
                        {student.notes.length ? `${student.moyenne.toFixed(2)}/20` : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-md text-sm font-semibold">
                        {student.notes.length ? `${student.rang} / ${bulletinStudents.length}` : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold ${
                          !student.notes.length
                            ? "bg-muted text-muted-foreground"
                            : student.moyenne >= 10
                              ? "bg-success/10 text-success"
                              : "bg-danger/10 text-danger"
                        }`}
                      >
                        {!student.notes.length ? "Sans notes" : student.moyenne >= 10 ? "Admis" : "Non admis"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(student)}
                          className="flex items-center gap-2 px-3 py-2 bg-background border border-input hover:bg-accent rounded-lg transition text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Aperçu
                        </button>
                        <button
                          type="button"
                          disabled={!canBulletinPdf}
                          onClick={() => void handleGeneratePDF(student)}
                          className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </button>
                        <button
                          type="button"
                          disabled={!canBulletinNotify}
                          onClick={() =>
                            setWaContext(
                              buildBulletinWhatsAppContext({
                                studentFirstName: student.firstName,
                                studentLastName: student.lastName,
                                classe: student.classe,
                                trimestre: selectedTrimestreNom,
                                moyenne: student.moyenne.toFixed(2),
                              })
                            )
                          }
                          className="flex items-center gap-2 px-3 py-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />
                          Notifier
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedStudent(null)}
            aria-hidden
          />
          <div className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-4xl my-8">
            <div className="px-4 py-4 sm:px-6 border-b border-border flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-foreground min-w-0 pr-2">
                Bulletin scolaire - {selectedTrimestreNom}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="self-end p-2 hover:bg-accent rounded-lg transition sm:self-auto"
              >
                ✕
              </button>
            </div>

            <div id="bulletin-content" className="p-8 bg-white">
              <div className="text-center mb-6 pb-6 border-b-2 border-primary">
                <h2 className="text-3xl font-bold text-primary mb-2">BULLETIN SCOLAIRE</h2>
                <p className="text-lg text-foreground">Établissement</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTrimestreNom} — {selectedClassName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 bg-muted p-4 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Nom et prénom</p>
                  <p className="font-semibold text-foreground">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Classe</p>
                  <p className="font-semibold text-foreground">{selectedStudent.classe}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Moyenne générale</p>
                  <p className="font-bold text-primary text-xl">
                    {selectedStudent.notes.length ? `${selectedStudent.moyenne.toFixed(2)}/20` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rang</p>
                  <p className="font-semibold text-foreground">
                    {selectedStudent.notes.length
                      ? `${selectedStudent.rang}${selectedStudent.rang === 1 ? "er" : "ème"} / ${bulletinStudents.length}`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-foreground mb-3">Notes par matière</h4>
                <table className="w-full border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left px-4 py-2 border-b border-border text-sm">Matière</th>
                      <th className="text-center px-4 py-2 border-b border-border text-sm">Coef.</th>
                      <th className="text-center px-4 py-2 border-b border-border text-sm">Note</th>
                      <th className="text-left px-4 py-2 border-b border-border text-sm">Appréciation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudent.notes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-sm text-muted-foreground text-center">
                          Aucune note saisie pour cette période.
                        </td>
                      </tr>
                    ) : (
                      selectedStudent.notes.map((note, index) => (
                        <tr key={`${note.matiere}-${index}`} className="border-b border-border">
                          <td className="px-4 py-2 text-sm font-medium">{note.matiere}</td>
                          <td className="px-4 py-2 text-center text-sm">{note.coef}</td>
                          <td className="px-4 py-2 text-center">
                            <span
                              className={`font-bold ${
                                note.note >= 16
                                  ? "text-success"
                                  : note.note >= 14
                                    ? "text-primary"
                                    : note.note >= 10
                                      ? "text-warning"
                                      : "text-danger"
                              }`}
                            >
                              {note.note.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-muted-foreground">{note.appreciation}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mb-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Appréciation générale</h4>
                <p className="text-sm text-foreground">{selectedStudent.appreciationGenerale}</p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Signature du Directeur</p>
                  <div className="h-16 border-b border-dashed border-border" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Visa des parents</p>
                  <div className="h-16 border-b border-dashed border-border" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                disabled={!canBulletinNotify}
                onClick={() => {
                  setWaContext(
                    buildBulletinWhatsAppContext({
                      studentFirstName: selectedStudent.firstName,
                      studentLastName: selectedStudent.lastName,
                      classe: selectedStudent.classe,
                      trimestre: selectedTrimestreNom,
                      moyenne: selectedStudent.moyenne.toFixed(2),
                    })
                  );
                }}
                className="px-4 py-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Notifier parent (WhatsApp)
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-background border border-input hover:bg-accent rounded-lg transition font-medium"
              >
                Fermer
              </button>
              <button
                type="button"
                disabled={!canBulletinPdf}
                onClick={() => void handleGeneratePDF(selectedStudent)}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <WhatsAppNotifyModal
        isOpen={!!waContext}
        onClose={() => setWaContext(null)}
        context={waContext}
        onConfirmSend={() => {
          flash("Notification préparée. L'envoi automatique sera disponible prochainement.", "info");
        }}
      />
    </div>
  );
}
