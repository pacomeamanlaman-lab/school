"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Save, Download, Award, TrendingUp, FileSpreadsheet, MessageCircle } from "lucide-react";
import FlashNotice from "@/components/FlashNotice";
import WhatsAppNotifyModal from "@/components/WhatsAppNotifyModal";
import { useFlashNotice } from "@/hooks/useFlashNotice";
import { useDashboardProfile } from "@/hooks/useDashboardProfile";
import { canDashboardAction } from "@/lib/dashboard-action-policy";
import { buildNoteWhatsAppContext, type WhatsAppNotifyContext } from "@/lib/whatsapp-templates-mvp";
import { exportNotesToPDF } from "@/utils/pdfExport";
import { exportNotesToExcel } from "@/utils/excelExport";
import { createClient } from "@/lib/supabase/client";

type ClasseOption = { id: string; name: string };
type MatiereOption = { id: string; nom: string; coefficient: number };
type TrimestreOption = { id: string; nom: string };
type StudentRow = { id: string; firstName: string; lastName: string };

function appreciationFromNote(studentNote: number | undefined): string {
  if (studentNote === undefined || Number.isNaN(studentNote)) return "-";
  if (studentNote >= 16) return "Très bien";
  if (studentNote >= 14) return "Bien";
  if (studentNote >= 12) return "Assez bien";
  if (studentNote >= 10) return "Passable";
  return "Insuffisant";
}

export default function NotesPage() {
  const [classes, setClasses] = useState<ClasseOption[]>([]);
  const [matieres, setMatieres] = useState<MatiereOption[]>([]);
  const [trimestres, setTrimestres] = useState<TrimestreOption[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState("");
  const [selectedMatiereId, setSelectedMatiereId] = useState("");
  const [selectedTrimestreId, setSelectedTrimestreId] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [notes, setNotes] = useState<Record<string, number>>({});
  const [waContext, setWaContext] = useState<WhatsAppNotifyContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notice, flash } = useFlashNotice();
  const { profile } = useDashboardProfile();
  const userRole = profile?.role ?? null;
  const canNotesWrite = canDashboardAction(userRole, "notesWrite");
  const canNotesExport = canDashboardAction(userRole, "notesExport");

  const selectedClassName = useMemo(
    () => classes.find((c) => c.id === selectedClasseId)?.name ?? "",
    [classes, selectedClasseId]
  );
  const selectedMatiereNom = useMemo(
    () => matieres.find((m) => m.id === selectedMatiereId)?.nom ?? "",
    [matieres, selectedMatiereId]
  );
  const selectedTrimestreNom = useMemo(
    () => trimestres.find((t) => t.id === selectedTrimestreId)?.nom ?? "",
    [trimestres, selectedTrimestreId]
  );
  const currentMatiere = useMemo(
    () => matieres.find((m) => m.id === selectedMatiereId),
    [matieres, selectedMatiereId]
  );

  const loadMeta = useCallback(async () => {
    const supabase = createClient();
    const [{ data: cl, error: e1 }, { data: mat, error: e2 }, { data: tr, error: e3 }] = await Promise.all([
      supabase.from("classes").select("id, name").eq("status", "active").order("niveau"),
      supabase.from("matieres").select("id, nom, coefficient").order("nom"),
      supabase.from("trimestres").select("id, nom, numero").order("numero"),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;
    if (e3) throw e3;
    const clOpts = (cl ?? []).map((r) => ({ id: r.id as string, name: r.name as string }));
    const mOpts = (mat ?? []).map((r) => ({
      id: r.id as string,
      nom: r.nom as string,
      coefficient: Number(r.coefficient) || 1,
    }));
    const tOpts = (tr ?? []).map((r) => ({ id: r.id as string, nom: r.nom as string }));
    setClasses(clOpts);
    setMatieres(mOpts);
    setTrimestres(tOpts);
    setSelectedClasseId((prev) => prev || clOpts[0]?.id || "");
    setSelectedMatiereId((prev) => prev || mOpts[0]?.id || "");
    setSelectedTrimestreId((prev) => prev || tOpts[0]?.id || "");
  }, []);

  const loadStudentsAndNotes = useCallback(
    async (classeId: string, matiereId: string, trimestreId: string) => {
      if (!classeId || !matiereId || !trimestreId) {
        setStudents([]);
        setNotes({});
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
      const list: StudentRow[] = (studs ?? []).map((s) => ({
        id: s.id as string,
        firstName: s.first_name as string,
        lastName: s.last_name as string,
      }));
      setStudents(list);
      const ids = list.map((s) => s.id);
      const nextNotes: Record<string, number> = {};
      if (ids.length) {
        const { data: nrows, error: e2 } = await supabase
          .from("notes")
          .select("student_id, note")
          .eq("classe_id", classeId)
          .eq("matiere_id", matiereId)
          .eq("trimestre_id", trimestreId)
          .in("student_id", ids);
        if (e2) throw e2;
        for (const r of nrows ?? []) {
          nextNotes[r.student_id as string] = Number(r.note);
        }
      }
      setNotes(nextNotes);
    },
    []
  );

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
    if (!selectedClasseId || !selectedMatiereId || !selectedTrimestreId) return;
    let cancelled = false;
    (async () => {
      try {
        await loadStudentsAndNotes(selectedClasseId, selectedMatiereId, selectedTrimestreId);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedClasseId, selectedMatiereId, selectedTrimestreId, loadStudentsAndNotes]);

  const handleNoteChange = (studentId: string, value: string) => {
    if (!canNotesWrite) return;
    const note = parseFloat(value);
    if (!Number.isNaN(note) && note >= 0 && note <= 20) {
      setNotes({ ...notes, [studentId]: note });
    } else if (value === "") {
      const newNotes = { ...notes };
      delete newNotes[studentId];
      setNotes(newNotes);
    }
  };

  const calculateMoyenne = () => {
    const notesArray = Object.values(notes);
    if (notesArray.length === 0) return "0.00";
    return (notesArray.reduce((acc, n) => acc + n, 0) / notesArray.length).toFixed(2);
  };

  const ranksByStudentId = useMemo(() => {
    const entries = students
      .map((s) => ({ id: s.id, note: notes[s.id] }))
      .filter((x) => x.note !== undefined && !Number.isNaN(x.note))
      .sort((a, b) => (b.note as number) - (a.note as number));
    const map = new Map<string, number>();
    entries.forEach((e, i) => map.set(e.id, i + 1));
    return map;
  }, [students, notes]);

  const handleSaveNotes = async () => {
    if (!canNotesWrite) {
      flash("La saisie des notes est réservée aux enseignants et aux administrateurs.", "error");
      return;
    }
    if (!selectedClasseId || !selectedMatiereId || !selectedTrimestreId) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      flash("Session requise.", "error");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error: delE } = await supabase
        .from("notes")
        .delete()
        .eq("classe_id", selectedClasseId)
        .eq("matiere_id", selectedMatiereId)
        .eq("trimestre_id", selectedTrimestreId);
      if (delE) throw delE;

      const toInsert: {
        student_id: string;
        matiere_id: string;
        trimestre_id: string;
        classe_id: string;
        note: number;
        appreciation: string;
        created_by: string;
      }[] = [];
      for (const s of students) {
        const val = notes[s.id];
        if (val === undefined || Number.isNaN(val)) continue;
        toInsert.push({
          student_id: s.id,
          matiere_id: selectedMatiereId,
          trimestre_id: selectedTrimestreId,
          classe_id: selectedClasseId,
          note: val,
          appreciation: appreciationFromNote(val),
          created_by: user.id,
        });
      }
      if (toInsert.length) {
        const { error: insE } = await supabase.from("notes").insert(toInsert);
        if (insE) throw insE;
      }
      await loadStudentsAndNotes(selectedClasseId, selectedMatiereId, selectedTrimestreId);
      flash("Notes enregistrées.", "success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!canNotesExport) {
      flash("Export non autorisé pour votre rôle.", "error");
      return;
    }
    try {
      await exportNotesToPDF(selectedClassName, selectedMatiereNom, selectedTrimestreNom);
    } catch (e) {
      console.error(e);
      flash("Erreur export PDF.", "error");
    }
  };

  const handleExportExcel = () => {
    if (!canNotesExport) {
      flash("Export non autorisé pour votre rôle.", "error");
      return;
    }
    const studentsWithNotes = students.map((student) => {
      const studentNote = notes[student.id];
      return {
        firstName: student.firstName,
        lastName: student.lastName,
        note: studentNote,
        appreciation: appreciationFromNote(studentNote),
      };
    });
    exportNotesToExcel(selectedClassName, selectedMatiereNom, selectedTrimestreNom, studentsWithNotes);
  };

  return (
    <div className="space-y-6">
      <FlashNotice payload={notice} />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notes & Évaluations</h1>
        <p className="text-muted-foreground">Saisie et suivi des notes par matière et trimestre</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              Matière <span className="text-danger">*</span>
            </label>
            <select
              value={selectedMatiereId}
              onChange={(e) => setSelectedMatiereId(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none"
            >
              {matieres.map((matiere) => (
                <option key={matiere.id} value={matiere.id}>
                  {matiere.nom} (Coef {matiere.coefficient})
                </option>
              ))}
            </select>
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

          <div className="flex flex-col gap-2 justify-end">
            <button
              type="button"
              disabled={!canNotesExport}
              onClick={() => void handleExportPDF()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              type="button"
              disabled={!canNotesExport}
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-success rounded-lg transition font-medium border border-input shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Élèves</p>
          <p className="text-2xl font-bold text-foreground mt-1">{loading ? "…" : students.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Notes saisies</p>
          <p className="text-2xl font-bold text-foreground mt-1">{Object.keys(notes).length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Moyenne classe</p>
          <p className="text-2xl font-bold text-primary mt-1">{calculateMoyenne()}/20</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Coefficient</p>
          <p className="text-2xl font-bold text-foreground mt-1">{currentMatiere?.coefficient ?? 1}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-4 sm:px-6 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-foreground min-w-0">
            Saisie des notes - {selectedMatiereNom} ({selectedTrimestreNom})
          </h3>
          <button
            type="button"
            disabled={!canNotesWrite || saving || loading}
            title={!canNotesWrite ? "Saisie réservée aux enseignants et administrateurs" : undefined}
            onClick={() => void handleSaveNotes()}
            className="flex w-full shrink-0 items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20 sm:w-auto"
          >
            <Save className="w-4 h-4" />
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table id="notes-table" className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Élève</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Note / 20</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Appréciation</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Rang</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Chargement…
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Aucun élève dans cette classe.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const studentNote = notes[student.id];
                  const appreciation = appreciationFromNote(studentNote);
                  const appreciationColor =
                    studentNote !== undefined && !Number.isNaN(studentNote)
                      ? studentNote >= 16
                        ? "text-success"
                        : studentNote >= 14
                          ? "text-primary"
                          : studentNote >= 10
                            ? "text-warning"
                            : "text-danger"
                      : "text-muted-foreground";
                  const rank = ranksByStudentId.get(student.id);

                  return (
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
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={0.5}
                          readOnly={!canNotesWrite}
                          value={notes[student.id] ?? ""}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          placeholder="--"
                          className="w-24 px-3 py-2 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition text-center font-semibold text-lg read-only:bg-muted/50 read-only:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-medium ${appreciationColor}`}>{appreciation}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {rank != null ? (
                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-md text-sm font-semibold">
                            <Award className="w-4 h-4" />
                            {rank}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {studentNote !== undefined && !Number.isNaN(studentNote) ? (
                          <button
                            type="button"
                            disabled={!canNotesWrite}
                            onClick={() =>
                              setWaContext(
                                buildNoteWhatsAppContext({
                                  studentFirstName: student.firstName,
                                  studentLastName: student.lastName,
                                  classe: selectedClassName,
                                  matiere: selectedMatiereNom,
                                  trimestre: selectedTrimestreNom,
                                  note: String(studentNote),
                                })
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-[#25D366]/40 bg-[#25D366]/10 px-2.5 py-1.5 text-xs font-medium text-[#128C7E] transition hover:bg-[#25D366]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Notifier
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-4 sm:px-6 border-t border-border bg-muted/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:flex-wrap">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Moyenne de la classe</p>
                <p className="text-2xl font-bold text-primary">{calculateMoyenne()}/20</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Note la plus haute</p>
                <p className="text-xl font-bold text-success">
                  {Object.values(notes).length > 0 ? Math.max(...Object.values(notes)).toFixed(1) : "--"}/20
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Note la plus basse</p>
                <p className="text-xl font-bold text-danger">
                  {Object.values(notes).length > 0 ? Math.min(...Object.values(notes)).toFixed(1) : "--"}/20
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-sm text-muted-foreground">Taux de réussite (≥10/20)</p>
              <p className="text-2xl font-bold text-foreground">
                {Object.values(notes).length > 0
                  ? Math.round((Object.values(notes).filter((n) => n >= 10).length / Object.values(notes).length) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

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
