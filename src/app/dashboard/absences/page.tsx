"use client";

import { useState } from "react";
import { Calendar, Filter, Download, CheckCircle, XCircle, Clock, AlertTriangle, FileSpreadsheet, MessageCircle } from "lucide-react";
import WhatsAppNotifyModal from "@/components/WhatsAppNotifyModal";
import { buildAbsenceWhatsAppContext, type WhatsAppNotifyContext } from "@/lib/whatsapp-templates-mvp";
import { exportAbsencesToPDF } from "@/utils/pdfExport";
import { exportAbsencesToExcel } from "@/utils/excelExport";

// Données de démonstration
const classesData = [
  { id: 1, name: "CP - Classe A", niveau: "CP" },
  { id: 2, name: "CE1 - Classe A", niveau: "CE1" },
  { id: 3, name: "CE2 - Classe A", niveau: "CE2" },
  { id: 4, name: "CM1 - Classe A", niveau: "CM1" },
  { id: 5, name: "CM2 - Classe A", niveau: "CM2" },
  { id: 6, name: "6ème - Classe A", niveau: "6ème" },
];

const studentsData = [
  { id: 1, firstName: "Marie", lastName: "Dupont", classe: "CP - Classe A", absencesCount: 2 },
  { id: 2, firstName: "Jean", lastName: "Martin", classe: "CP - Classe A", absencesCount: 5 },
  { id: 3, firstName: "Sophie", lastName: "Bernard", classe: "CP - Classe A", absencesCount: 0 },
  { id: 4, firstName: "Lucas", lastName: "Petit", classe: "CP - Classe A", absencesCount: 1 },
  { id: 5, firstName: "Emma", lastName: "Dubois", classe: "CP - Classe A", absencesCount: 8 },
];

type AttendanceStatus = "present" | "absent" | "late" | null;

interface StudentAttendance {
  studentId: number;
  status: AttendanceStatus;
  motif?: string;
  showWhatsAppAction?: boolean;
}

export default function AbsencesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedClass, setSelectedClass] = useState("CP - Classe A");
  const [attendance, setAttendance] = useState<Record<number, StudentAttendance>>({});
  const [showMotifModal, setShowMotifModal] = useState<number | null>(null);
  const [attendanceBeforeMotifModal, setAttendanceBeforeMotifModal] = useState<StudentAttendance | null>(null);
  const [motif, setMotif] = useState("");
  const [motifError, setMotifError] = useState("");
  const [waContext, setWaContext] = useState<WhatsAppNotifyContext | null>(null);

  const filteredStudents = studentsData.filter((s) => s.classe === selectedClass);

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    if (status === "absent") {
      setAttendanceBeforeMotifModal(attendance[studentId] ?? null);
    }

    setAttendance({
      ...attendance,
      [studentId]: {
        studentId,
        status,
        motif: attendance[studentId]?.motif,
        // Le CTA WhatsApp manuel est réservé au cas "absence non justifié".
        showWhatsAppAction: status === "absent" ? false : undefined,
      },
    });

    // Ouvrir modal pour motif si absent
    if (status === "absent") {
      setShowMotifModal(studentId);
    }
  };

  /** Libellé motif + message parent (cohérent avec le libellé du bouton). */
  const MOTIF_NON_JUSTIFIE = "Absence non justifié";

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
    if (showMotifModal) {
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
    }
  };

  /** Motif figé + activation du CTA WhatsApp dans la ligne élève. */
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
    total: filteredStudents.length,
    present: Object.values(attendance).filter((a) => a.status === "present").length,
    absent: Object.values(attendance).filter((a) => a.status === "absent").length,
    late: Object.values(attendance).filter((a) => a.status === "late").length,
  };

  const handleSaveAttendance = () => {
    // TODO: Sauvegarder dans Supabase
    console.log("Sauvegarde appel:", { date: selectedDate, classe: selectedClass, attendance });
    alert("Appel enregistré avec succès !");
  };

  const handleExportPDF = async () => {
    try {
      await exportAbsencesToPDF(selectedClass, selectedDate);
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      alert("Erreur lors de l'export PDF");
    }
  };

  const handleExportExcel = () => {
    const studentsWithAttendance = filteredStudents.map((student) => ({
      firstName: student.firstName,
      lastName: student.lastName,
      status: attendance[student.id]?.status || null,
      motif: attendance[student.id]?.motif,
    }));

    exportAbsencesToExcel(selectedClass, selectedDate, studentsWithAttendance);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Présences & Absences</h1>
        <p className="text-muted-foreground">Appel journalier et suivi des absences</p>
      </div>

      {/* Filtres */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date */}
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

          {/* Classe */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Classe <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none"
              >
                {classesData.map((classe) => (
                  <option key={classe.id} value={classe.name}>
                    {classe.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-3">
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-sm"
            >
              <Download className="w-4 h-4" />
              Exporter en PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-success rounded-lg transition font-medium border border-input shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exporter en Excel
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total élèves</p>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
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

      {/* Liste des élèves */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Appel - {selectedClass} ({filteredStudents.length} élèves)
          </h3>
          <button
            onClick={handleSaveAttendance}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20"
          >
            Enregistrer l'appel
          </button>
        </div>

        <div id="absences-table" className="p-6 space-y-3">
          {filteredStudents.map((student) => {
            const studentStatus = attendance[student.id]?.status;
            const showWhatsAppAction = attendance[student.id]?.showWhatsAppAction;
            const hasAlert = student.absencesCount >= 5;

            return (
              <div
                key={student.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition ${
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
                            classe: selectedClass,
                            dateISO: selectedDate,
                            motif: attendance[student.id]?.motif,
                          })
                        )
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-2 text-xs font-medium text-[#128C7E] transition hover:bg-[#25D366]/20"
                      title="Prévenir le parent par WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Prévenir le parent (WhatsApp)
                    </button>
                  )}
                  <button
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
          })}
        </div>
      </div>

      {/* Modal motif d'absence */}
      <WhatsAppNotifyModal
        isOpen={!!waContext}
        onClose={() => setWaContext(null)}
        context={waContext}
        onConfirmSend={(ctx) => {
          console.log("[MVP WhatsApp] Absence — envoi simulé:", ctx);
          alert("Envoi WhatsApp simulé (branchement Meta + backend à venir).");
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
            <div className="flex items-center justify-end gap-3 mt-4">
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
                title={!motif.trim() ? "Renseigner le motif pour enregistrer" : undefined}
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
