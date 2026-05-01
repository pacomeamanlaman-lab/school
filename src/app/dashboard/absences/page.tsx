"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  MessageCircle,
} from "lucide-react";
import FlashNotice from "@/components/FlashNotice";
import WhatsAppNotifyModal from "@/components/WhatsAppNotifyModal";
import { useFlashNotice } from "@/hooks/useFlashNotice";
import { buildAbsenceWhatsAppContext, type WhatsAppNotifyContext } from "@/lib/whatsapp-templates-mvp";
import { exportAbsencesToPDF } from "@/utils/pdfExport";
import { exportAbsencesToExcel } from "@/utils/excelExport";
import { createClient } from "@/lib/supabase/client";

type AttendanceStatus = "present" | "absent" | "late" | null;

interface StudentAttendance {
  studentId: string;
  status: AttendanceStatus;
  motif?: string;
  showWhatsAppAction?: boolean;
}

type ClasseOption = { id: string; name: string };
type StudentRow = {
  id: string;
  firstName: string;
  lastName: string;
  classeName: string;
  absencesCount: number;
};

const MOTIF_NON_JUSTIFIE = "Absence non justifié";

function monthBoundsISO(d: string): { start: string; end: string } {
  const dt = new Date(d + "T12:00:00");
  const y = dt.getFullYear();
  const m = dt.getMonth();
  const start = new Date(y, m, 1).toISOString().slice(0, 10);
  const end = new Date(y, m + 1, 0).toISOString().slice(0, 10);
  return { start, end };
}

export default function AbsencesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [classes, setClasses] = useState<ClasseOption[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState<string>("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attendance, setAttendance] = useState<Record<string, StudentAttendance>>({});
  const [showMotifModal, setShowMotifModal] = useState<string | null>(null);
  const [attendanceBeforeMotifModal, setAttendanceBeforeMotifModal] = useState<StudentAttendance | null>(null);
  const [motif, setMotif] = useState("");
  const [motifError, setMotifError] = useState("");
  const [waContext, setWaContext] = useState<WhatsAppNotifyContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notice, flash } = useFlashNotice();

  const selectedClassName = useMemo(
    () => classes.find((c) => c.id === selectedClasseId)?.name ?? "",
    [classes, selectedClasseId]
  );

  const loadClasses = useCallback(async () => {
    const supabase = createClient();
    const { data, error: e } = await supabase
      .from("classes")
      .select("id, name")
      .eq("status", "active")
      .order("niveau");
    if (e) throw e;
    const opts = (data ?? []).map((r) => ({ id: r.id as string, name: r.name as string }));
    setClasses(opts);
    setSelectedClasseId((prev) => prev || opts[0]?.id || "");
  }, []);

  const loadStudentsAndCounts = useCallback(async (classeId: string) => {
    if (!classeId) {
      setStudents([]);
      return;
    }
    const supabase = createClient();
    const { data: clRow } = await supabase.from("classes").select("name").eq("id", classeId).maybeSingle();
    const classeName = (clRow?.name as string) ?? "";
    const { start, end } = monthBoundsISO(selectedDate);
    const { data: studs, error: e1 } = await supabase
      .from("students")
      .select("id, first_name, last_name")
      .eq("classe_id", classeId)
      .eq("status", "active")
      .order("last_name");
    if (e1) throw e1;
    const ids = (studs ?? []).map((s) => s.id as string);
    const counts = new Map<string, number>();
    if (ids.length) {
      const { data: absM, error: e2 } = await supabase
        .from("absences")
        .select("student_id")
        .eq("statut", "absent")
        .gte("date", start)
        .lte("date", end)
        .in("student_id", ids);
      if (e2) throw e2;
      for (const r of absM ?? []) {
        const sid = r.student_id as string;
        counts.set(sid, (counts.get(sid) ?? 0) + 1);
      }
    }
    setStudents(
      (studs ?? []).map((s) => ({
        id: s.id as string,
        firstName: s.first_name as string,
        lastName: s.last_name as string,
        classeName,
        absencesCount: counts.get(s.id as string) ?? 0,
      }))
    );
  }, [selectedDate]);

  const loadDayAttendance = useCallback(
    async (classeId: string, date: string) => {
      if (!classeId) {
        setAttendance({});
        return;
      }
      const supabase = createClient();
      const { data: rows, error: e } = await supabase
        .from("absences")
        .select("student_id, statut, motif, justifiee")
        .eq("classe_id", classeId)
        .eq("date", date);
      if (e) throw e;
      const next: Record<string, StudentAttendance> = {};
      for (const r of rows ?? []) {
        const sid = r.student_id as string;
        const st = r.statut as string;
        if (st === "absent") {
          const motifStr = (r.motif as string | null) ?? "";
          const justified = !!(r as { justifiee?: boolean }).justifiee;
          const isUnjustLabel = motifStr === MOTIF_NON_JUSTIFIE;
          next[sid] = {
            studentId: sid,
            status: "absent",
            motif: motifStr || undefined,
            showWhatsAppAction: isUnjustLabel || (!justified && !motifStr.trim()),
          };
        } else if (st === "retard") {
          next[sid] = { studentId: sid, status: "late", motif: (r.motif as string | null) ?? undefined };
        }
      }
      setAttendance(next);
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadClasses();
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur chargement classes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadClasses]);

  useEffect(() => {
    if (!selectedClasseId) return;
    let cancelled = false;
    (async () => {
      try {
        await loadStudentsAndCounts(selectedClasseId);
        await loadDayAttendance(selectedClasseId, selectedDate);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedClasseId, selectedDate, loadStudentsAndCounts, loadDayAttendance]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (status === "absent") {
      setAttendanceBeforeMotifModal(attendance[studentId] ?? null);
    }

    setAttendance({
      ...attendance,
      [studentId]: {
        studentId,
        status,
        motif: attendance[studentId]?.motif,
        showWhatsAppAction: status === "absent" ? false : undefined,
      },
    });

    if (status === "absent") {
      setShowMotifModal(studentId);
    }
  };

  const closeMotifModal = () => {
    setShowMotifModal(null);
    setAttendanceBeforeMotifModal(null);
    setMotif("");
    setMotifError("");
  };

  const cancelMotifModal = () => {
    if (!showMotifModal) return;
    const studentId = showMotifModal;
    setAttendance((prev) => {
      const next = { ...prev };
      if (attendanceBeforeMotifModal) {
        next[studentId] = attendanceBeforeMotifModal;
      } else {
        delete next[studentId];
      }
      return next;
    });
    closeMotifModal();
  };

  const saveMotif = () => {
    if (!showMotifModal) return;
    const cleanedMotif = motif.trim();
    if (!cleanedMotif) {
      setMotifError("Le motif est obligatoire pour enregistrer une absence justifiée.");
      return;
    }
    setAttendance({
      ...attendance,
      [showMotifModal]: { ...attendance[showMotifModal], motif: cleanedMotif, showWhatsAppAction: false },
    });
    closeMotifModal();
  };

  const saveUnjustifiedAndEnableWhatsApp = () => {
    if (!showMotifModal) return;
    setAttendance({
      ...attendance,
      [showMotifModal]: {
        studentId: showMotifModal,
        status: "absent",
        motif: MOTIF_NON_JUSTIFIE,
        showWhatsAppAction: true,
      },
    });
    closeMotifModal();
  };

  const stats = {
    total: students.length,
    present: Object.values(attendance).filter((a) => a.status === "present").length,
    absent: Object.values(attendance).filter((a) => a.status === "absent").length,
    late: Object.values(attendance).filter((a) => a.status === "late").length,
  };

  const handleSaveAttendance = async () => {
    if (!selectedClasseId) return;
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
      for (const studentId of Object.keys(attendance)) {
        const att = attendance[studentId];
        if (!att?.status) continue;

        await supabase
          .from("absences")
          .delete()
          .eq("student_id", studentId)
          .eq("classe_id", selectedClasseId)
          .eq("date", selectedDate);

        if (att.status === "present") continue;

        if (att.status === "absent") {
          const justif = !!(att.motif && att.motif.trim() && att.motif !== MOTIF_NON_JUSTIFIE);
          const { error: insE } = await supabase.from("absences").insert({
            student_id: studentId,
            classe_id: selectedClasseId,
            date: selectedDate,
            statut: "absent",
            motif: att.motif?.trim() || null,
            justifiee: justif,
            created_by: user.id,
          });
          if (insE) throw insE;
        } else if (att.status === "late") {
          const { error: insE } = await supabase.from("absences").insert({
            student_id: studentId,
            classe_id: selectedClasseId,
            date: selectedDate,
            statut: "retard",
            motif: att.motif?.trim() || null,
            justifiee: false,
            created_by: user.id,
          });
          if (insE) throw insE;
        }
      }
      await loadDayAttendance(selectedClasseId, selectedDate);
      await loadStudentsAndCounts(selectedClasseId);
      flash("Appel enregistré.", "success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportAbsencesToPDF(selectedClassName || "Classe", selectedDate);
    } catch (e) {
      console.error(e);
      flash("Erreur export PDF.", "error");
    }
  };

  const handleExportExcel = () => {
    const studentsWithAttendance = students.map((student) => ({
      firstName: student.firstName,
      lastName: student.lastName,
      status: attendance[student.id]?.status ?? null,
      motif: attendance[student.id]?.motif,
    }));
    exportAbsencesToExcel(selectedClassName || "Classe", selectedDate, studentsWithAttendance);
  };

  return (
    <div className="space-y-6">
      <FlashNotice payload={notice} />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Présences & Absences</h1>
        <p className="text-muted-foreground">Données Supabase (table absences)</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Classe <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={selectedClasseId}
                onChange={(e) => setSelectedClasseId(e.target.value)}
                disabled={loading || !classes.length}
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

          <div className="flex items-end gap-3">
            <button
              type="button"
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-sm"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-success rounded-lg transition font-medium border border-input shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total élèves</p>
          <p className="text-2xl font-bold text-foreground mt-1">{loading ? "…" : stats.total}</p>
        </div>
        <div className="bg-card border border-success/20 bg-success/5 rounded-lg p-4">
          <p className="text-sm text-success">Présents</p>
          <p className="text-2xl font-bold text-success mt-1">{stats.present}</p>
        </div>
        <div className="bg-card border border-danger/20 bg-danger/5 rounded-lg p-4">
          <p className="text-sm text-danger">Absents</p>
          <p className="text-2xl font-bold text-danger mt-1">{stats.absent}</p>
        </div>
        <div className="bg-card border border-warning/20 bg-warning/5 rounded-lg p-4">
          <p className="text-sm text-warning">Retards</p>
          <p className="text-2xl font-bold text-warning mt-1">{stats.late}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Appel - {selectedClassName} ({students.length} élèves)
          </h3>
          <button
            type="button"
            disabled={saving || !selectedClasseId}
            onClick={() => void handleSaveAttendance()}
            className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20"
          >
            {saving ? "Enregistrement…" : "Enregistrer l'appel"}
          </button>
        </div>

        <div id="absences-table" className="p-6 space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Chargement…</p>
          ) : students.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun élève dans cette classe.</p>
          ) : (
            students.map((student) => {
              const studentStatus = attendance[student.id]?.status;
              const showWhatsAppAction = attendance[student.id]?.showWhatsAppAction;
              const hasAlert = student.absencesCount >= 5;

              return (
                <div
                  key={student.id}
                  className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border transition ${
                    studentStatus === "present"
                      ? "bg-success/5 border-success/20"
                      : studentStatus === "absent"
                        ? "bg-danger/5 border-danger/20"
                        : studentStatus === "late"
                          ? "bg-warning/5 border-warning/20"
                          : "bg-muted border-border"
                  }`}
                >
                  <div className="flex items-center gap-4">
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
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {student.absencesCount} absence(s) ce mois
                        </p>
                        {hasAlert && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-danger/10 text-danger rounded text-xs font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            Alerte
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {studentStatus === "absent" && showWhatsAppAction && (
                      <button
                        type="button"
                        onClick={() =>
                          setWaContext(
                            buildAbsenceWhatsAppContext({
                              studentFirstName: student.firstName,
                              studentLastName: student.lastName,
                              classe: selectedClassName,
                              dateISO: selectedDate,
                              motif: attendance[student.id]?.motif,
                            })
                          )
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-2 text-xs font-medium text-[#128C7E] transition hover:bg-[#25D366]/20"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Prévenir le parent (WhatsApp)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "present")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                        studentStatus === "present"
                          ? "bg-success text-white"
                          : "bg-background border border-input hover:bg-accent"
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Présent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "absent")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                        studentStatus === "absent"
                          ? "bg-danger text-white"
                          : "bg-background border border-input hover:bg-accent"
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "late")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                        studentStatus === "late"
                          ? "bg-warning text-white"
                          : "bg-background border border-input hover:bg-accent"
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      Retard
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <WhatsAppNotifyModal
        isOpen={!!waContext}
        onClose={() => setWaContext(null)}
        context={waContext}
        onConfirmSend={(ctx) => {
          console.log("[MVP WhatsApp] Absence — envoi simulé:", ctx);
          flash("Envoi WhatsApp simulé (branchement Meta + backend à venir).", "info");
        }}
      />

      {showMotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={cancelMotifModal}></div>
          <div className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Motif d'absence</h3>
            <textarea
              value={motif}
              onChange={(e) => {
                setMotif(e.target.value);
                if (motifError) setMotifError("");
              }}
              rows={4}
              className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition resize-none ${
                motifError ? "border-danger" : "border-input"
              }`}
              placeholder="Saisir le motif (maladie, absence justifiée...)"
            />
            {!motif.trim() && !motifError && (
              <p className="mt-2 text-sm text-warning">
                Le motif est obligatoire pour valider une absence justifiée.
              </p>
            )}
            {motifError && <p className="mt-2 text-sm text-danger">{motifError}</p>}
            <div className="flex items-center justify-end gap-3 mt-4 flex-wrap">
              <button
                type="button"
                onClick={cancelMotifModal}
                className="px-4 py-2 bg-background border border-input hover:bg-accent rounded-lg transition font-medium"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={saveUnjustifiedAndEnableWhatsApp}
                className="flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg transition font-medium border border-[#25D366]/40 bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                Absence non justifié
              </button>
              <button
                type="button"
                onClick={saveMotif}
                disabled={!motif.trim()}
                className={`px-4 py-2 text-white rounded-lg transition font-medium ${
                  motif.trim()
                    ? "bg-primary hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
