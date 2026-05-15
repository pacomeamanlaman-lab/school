"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Eye, Edit, Trash2, FileSpreadsheet } from "lucide-react";
import AddStudentModal from "@/components/AddStudentModal";
import FlashNotice from "@/components/FlashNotice";
import { exportStudentsToExcel } from "@/utils/excelExport";
import { useFlashNotice } from "@/hooks/useFlashNotice";
import { useDashboardProfile } from "@/hooks/useDashboardProfile";
import { useStudents, type StudentWithClass } from "@/hooks/useStudents";
import { canDashboardAction } from "@/lib/dashboard-action-policy";
import { createClient } from "@/lib/supabase/client";
import {
  STUDENT_DOC_TYPE_BIRTH,
  uploadStudentDocumentsBatch,
  uploadStudentProfilePhoto,
} from "@/lib/supabase/student-documents";
import type { Database } from "@/lib/supabase/types";

type GroupeSanguin = NonNullable<
  Database["public"]["Tables"]["students"]["Row"]["groupe_sanguin"]
>;

const BLOOD: readonly GroupeSanguin[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

/** Fichiers pièces jointes (ancien payload sans type). */
function birthCertificateFilesFromPayload(p: Record<string, unknown>): File[] {
  const multi = p.birthCertificateFiles;
  if (Array.isArray(multi)) {
    return multi.filter((x): x is File => x instanceof File);
  }
  const single = p.birthCertificateFile;
  if (single instanceof File) return [single];
  return [];
}

function studentDocumentItemsFromPayload(p: Record<string, unknown>): { file: File; type_document: string }[] {
  const raw = p.studentDocumentItems;
  if (Array.isArray(raw)) {
    const out: { file: File; type_document: string }[] = [];
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const o = item as { file?: unknown; type_document?: unknown };
      if (o.file instanceof File && typeof o.type_document === "string" && o.type_document.trim()) {
        out.push({ file: o.file, type_document: o.type_document.trim() });
      }
    }
    return out;
  }
  const legacy = birthCertificateFilesFromPayload(p);
  return legacy.map((file) => ({ file, type_document: STUDENT_DOC_TYPE_BIRTH }));
}

function parseGroupeSanguin(raw: string): GroupeSanguin | null {
  const t = raw.trim();
  return BLOOD.includes(t as GroupeSanguin) ? (t as GroupeSanguin) : null;
}

function strOrNull(v: unknown): string | null {
  const t = String(v ?? "").trim();
  return t || null;
}

type ClasseOption = { id: string; name: string; niveau: string };

type LinkedParentRow = {
  nom: string;
  telephone: string;
  telephone_secondaire: string | null;
  email: string | null;
};

function firstLinkedParent(s: StudentWithClass): LinkedParentRow | null {
  const sps = s.student_parents ?? [];
  for (const row of sps) {
    const p = (row as { parents?: unknown }).parents;
    if (p == null) continue;
    const one = Array.isArray(p) ? (p[0] as LinkedParentRow | undefined) : (p as LinkedParentRow);
    if (one?.nom && one?.telephone) return one;
  }
  return null;
}

/** Ligne UI (camelCase) pour le tableau et le modal */
export type StudentListRow = {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  classe: string;
  /** Identifiant classe (`classes.id`) pour le select « Classe » du modal */
  classeId: string;
  classeNiveau: string;
  dateNaissance: string;
  genre: "M" | "F";
  status: string;
  groupeSanguin: string;
  maladiesParticulieres: string;
  phone: string;
  email: string;
  adresse: string;
  pieceNaissance: string;
  lieuNaissance: string;
  photoUrl: string;
  parentName: string;
  parentPhone: string;
  parentPhoneSecondaire: string;
  parentEmail: string;
};

function rowFromDb(s: StudentWithClass): StudentListRow {
  const p = firstLinkedParent(s);
  return {
    id: s.id,
    matricule: s.matricule,
    firstName: s.first_name,
    lastName: s.last_name,
    classe: s.classes?.name ?? s.classes?.niveau ?? "—",
    classeId: s.classe_id ?? s.classes?.id ?? "",
    classeNiveau: s.classes?.niveau ?? "",
    dateNaissance: s.date_naissance,
    genre: s.genre,
    status: s.status,
    groupeSanguin: s.groupe_sanguin ?? "",
    maladiesParticulieres: s.maladies_particulieres ?? "",
    phone: s.phone ?? "",
    email: s.email ?? "",
    adresse: s.adresse ?? "",
    pieceNaissance: s.piece_naissance ?? "",
    lieuNaissance: s.lieu_naissance ?? "",
    photoUrl: (s as { photo_url?: string | null }).photo_url ?? "",
    parentName: p?.nom ?? "",
    parentPhone: p?.telephone ?? "",
    parentPhoneSecondaire: p?.telephone_secondaire ?? "",
    parentEmail: p?.email ?? "",
  };
}

async function insertParentAndLink(
  supabase: ReturnType<typeof createClient>,
  studentId: string,
  form: Record<string, unknown>
): Promise<{ error: string | null }> {
  const nom = String(form.parentName ?? "").trim();
  const telephone = String(form.parentPhone ?? "").trim();
  if (!nom || !telephone) {
    return { error: "Nom et téléphone du parent sont obligatoires." };
  }
  const adresse = strOrNull(form.adresse);
  const { data: parentRow, error: pErr } = await supabase
    .from("parents")
    .insert({
      nom,
      telephone,
      telephone_secondaire: strOrNull(form.parentPhoneSecondaire),
      email: strOrNull(form.parentEmail),
      adresse,
      profession: null,
    })
    .select("id")
    .single();
  if (pErr || !parentRow?.id) return { error: pErr?.message ?? "Insertion parent impossible." };

  const { error: spErr } = await supabase.from("student_parents").insert({
    student_id: studentId,
    parent_id: parentRow.id as string,
    relation_type: "tuteur",
  });
  if (spErr) {
    await supabase.from("parents").delete().eq("id", parentRow.id as string);
    return { error: spErr.message };
  }
  return { error: null };
}

async function upsertParentForStudent(
  supabase: ReturnType<typeof createClient>,
  studentId: string,
  form: Record<string, unknown>
): Promise<{ error: string | null }> {
  const nom = String(form.parentName ?? "").trim();
  const telephone = String(form.parentPhone ?? "").trim();
  if (!nom || !telephone) {
    return { error: "Nom et téléphone du parent sont obligatoires." };
  }
  const adresse = strOrNull(form.adresse);
  const sec = strOrNull(form.parentPhoneSecondaire);
  const email = strOrNull(form.parentEmail);

  const { data: link, error: lErr } = await supabase
    .from("student_parents")
    .select("parent_id")
    .eq("student_id", studentId)
    .limit(1)
    .maybeSingle();
  if (lErr) return { error: lErr.message };

  if (link?.parent_id) {
    const { error: uErr } = await supabase
      .from("parents")
      .update({
        nom,
        telephone,
        telephone_secondaire: sec,
        email,
        adresse,
      })
      .eq("id", link.parent_id as string);
    return { error: uErr?.message ?? null };
  }

  return insertParentAndLink(supabase, studentId, form);
}

export default function StudentsPage() {
  const router = useRouter();
  const { profile } = useDashboardProfile();
  const role = profile?.role ?? null;
  const canCreateStudent = canDashboardAction(role, "studentCreate");
  const canWriteStudent = canDashboardAction(role, "studentWrite");
  const canExportStudents = canDashboardAction(role, "studentExportExcel");

  const { students: dbStudents, loading, error, addStudent, updateStudent, deleteStudent, refresh } =
    useStudents();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentListRow | null>(null);
  const [classOptions, setClassOptions] = useState<ClasseOption[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const { notice, flash } = useFlashNotice();

  const rows = useMemo(() => dbStudents.map(rowFromDb), [dbStudents]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setClassesLoading(true);
      const supabase = createClient();
      const { data, error: e } = await supabase
        .from("classes")
        .select("id, name, niveau")
        .eq("status", "active")
        .order("niveau")
        .order("name");
      if (cancelled) return;
      if (e) {
        setClassOptions([]);
        setClassesLoading(false);
        return;
      }
      setClassOptions(
        (data ?? []).map((r) => ({
          id: r.id as string,
          name: r.name as string,
          niveau: r.niveau as string,
        }))
      );
      setClassesLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredStudents = useMemo(() => {
    return rows.filter((student) => {
      const matchSearch =
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.matricule.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = selectedClass === "all" || student.classeId === selectedClass;
      return matchSearch && matchClass;
    });
  }, [rows, searchTerm, selectedClass]);

  const handleAddStudent = async (newStudent: Record<string, unknown>) => {
    const classeId = String(newStudent.classe ?? "").trim();
    if (!classeId) {
      flash("Sélectionnez une classe.", "error");
      return false;
    }
    const matricule = `EL${Date.now().toString(36).toUpperCase().slice(-10)}`;
    const { data, error: err } = await addStudent({
      matricule,
      first_name: String(newStudent.firstName ?? ""),
      last_name: String(newStudent.lastName ?? ""),
      date_naissance: String(newStudent.dateNaissance ?? ""),
      lieu_naissance: strOrNull(newStudent.lieuNaissance),
      genre: newStudent.genre === "F" ? "F" : "M",
      classe_id: classeId,
      status: "active",
      groupe_sanguin: parseGroupeSanguin(String(newStudent.groupeSanguin ?? "")),
      maladies_particulieres: String(newStudent.maladiesParticulieres ?? "").trim() || null,
      phone: strOrNull(newStudent.phone),
      email: strOrNull(newStudent.email),
      adresse: strOrNull(newStudent.adresse),
      piece_naissance: strOrNull(newStudent.pieceNaissance),
    });
    if (err) {
      flash(String(err), "error");
      return false;
    }
    const sid = data?.id as string | undefined;
    const supabase = createClient();
    const docItems = studentDocumentItemsFromPayload(newStudent);
    let docErr: string | null = null;
    if (sid && docItems.length > 0) {
      const { errors } = await uploadStudentDocumentsBatch(supabase, sid, docItems);
      docErr = errors.length ? errors.join(" ; ") : null;
    }
    let photoErr: string | null = null;
    const photoF = newStudent.profilePhotoFile;
    if (sid && photoF instanceof File) {
      const pr = await uploadStudentProfilePhoto(supabase, sid, photoF);
      photoErr = pr.error;
    }
    let parentErr: string | null = null;
    if (sid) {
      parentErr = (await insertParentAndLink(supabase, sid, newStudent)).error;
    }
    setIsAddModalOpen(false);
    await refresh();
    const extras = [docErr && `document(s) : ${docErr}`, photoErr && `photo : ${photoErr}`, parentErr && `parent : ${parentErr}`].filter(
      Boolean
    ) as string[];
    if (extras.length) {
      flash(`Élève enregistré ; ${extras.join(" ; ")}`, docErr || photoErr ? "error" : "info");
    } else {
      flash("Élève enregistré.", "success");
    }
  };

  const handleEditStudent = async (updated: Record<string, unknown> & { id: string }) => {
    const classeId = String(updated.classe ?? "").trim();
    if (!classeId) {
      flash("Sélectionnez une classe.", "error");
      return false;
    }
    const studentId = String(updated.id);
    const { error: err } = await updateStudent(studentId, {
      first_name: String(updated.firstName ?? ""),
      last_name: String(updated.lastName ?? ""),
      date_naissance: String(updated.dateNaissance ?? ""),
      lieu_naissance: strOrNull(updated.lieuNaissance),
      genre: updated.genre === "F" ? "F" : "M",
      classe_id: classeId,
      groupe_sanguin: parseGroupeSanguin(String(updated.groupeSanguin ?? "")),
      maladies_particulieres: String(updated.maladiesParticulieres ?? "").trim() || null,
      phone: strOrNull(updated.phone),
      email: strOrNull(updated.email),
      adresse: strOrNull(updated.adresse),
      piece_naissance: strOrNull(updated.pieceNaissance),
    });
    if (err) {
      flash(String(err), "error");
      return false;
    }
    const supabase = createClient();
    const parentErr = (await upsertParentForStudent(supabase, studentId, updated)).error;
    const docItems = studentDocumentItemsFromPayload(updated);
    let docErr: string | null = null;
    if (docItems.length > 0) {
      const { errors } = await uploadStudentDocumentsBatch(supabase, studentId, docItems);
      docErr = errors.length ? errors.join(" ; ") : null;
    }
    let photoErr: string | null = null;
    const photoF = updated.profilePhotoFile;
    if (photoF instanceof File) {
      const pr = await uploadStudentProfilePhoto(supabase, studentId, photoF);
      photoErr = pr.error;
    }
    setEditingStudent(null);
    await refresh();
    const parts: string[] = [];
    if (parentErr) parts.push(`parent : ${parentErr}`);
    if (docErr) parts.push(`document(s) : ${docErr}`);
    if (photoErr) parts.push(`photo : ${photoErr}`);
    if (parts.length) flash(`Fiche mise à jour ; ${parts.join(" ; ")}`, docErr || photoErr ? "error" : "info");
    else flash("Fiche élève mise à jour.", "success");
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet élève ?")) return;
    const { error: err } = await deleteStudent(id);
    if (err) {
      flash(String(err), "error");
      return;
    }
    await refresh();
    flash("Élève supprimé.", "success");
  };

  const handleExportExcel = () => {
    const studentsForExport = filteredStudents.map((student) => ({
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateNaissance,
      classe: student.classe,
      parent: { name: "—", phone: "—" },
    }));
    exportStudentsToExcel(studentsForExport);
  };

  const statusLabel = (s: string) => {
    if (s === "active") return "Actif";
    if (s === "inactive") return "Inactif";
    if (s === "transferred") return "Transféré";
    return s;
  };

  return (
    <div className="space-y-6">
      <FlashNotice payload={notice} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Gestion des élèves</h1>
          <p className="text-muted-foreground">Liste complète des élèves inscrits</p>
        </div>
        {canCreateStudent ? (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex w-full shrink-0 items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition shadow-lg shadow-primary/20 sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            Ajouter un élève
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Rechercher par nom, prénom ou matricule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={classesLoading}
              className="pl-10 pr-8 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none cursor-pointer min-w-[150px] disabled:opacity-60"
            >
              <option value="all">Toutes les classes</option>
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.niveau})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={!canExportStudents}
            title={!canExportStudents ? "Export non autorisé pour votre rôle" : undefined}
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-success rounded-lg transition font-medium border border-input shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exporter en Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total élèves</p>
          <p className="text-2xl font-bold text-foreground mt-1">{loading ? "…" : rows.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Garçons</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {loading ? "…" : rows.filter((s) => s.genre === "M").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Filles</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {loading ? "…" : rows.filter((s) => s.genre === "F").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Résultats filtre</p>
          <p className="text-2xl font-bold text-foreground mt-1">{filteredStudents.length}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-8 text-center text-muted-foreground">Chargement des élèves…</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Matricule</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Nom complet</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Classe</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Date de naissance</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Genre</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Statut</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b border-border hover:bg-accent/50 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-muted-foreground">{student.matricule}</span>
                    </td>
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
                      <span className="inline-flex items-center px-2.5 py-1 bg-secondary/10 text-secondary rounded-md text-sm font-medium">
                        {student.classe}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(student.dateNaissance).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {student.genre === "M" ? "Garçon" : "Fille"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 bg-success/10 text-success rounded-md text-sm font-medium">
                        {statusLabel(student.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/students/${student.id}`)}
                          className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-info"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canWriteStudent ? (
                          <button
                            type="button"
                            onClick={() =>
                              setEditingStudent({
                                ...student,
                                classe: student.classeId,
                              })
                            }
                            className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-primary"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        ) : null}
                        {canWriteStudent ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(student.id)}
                            className="p-2 hover:bg-accent rounded-lg transition text-muted-foreground hover:text-danger"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Affichage de <span className="font-medium text-foreground">{filteredStudents.length}</span> sur{" "}
            <span className="font-medium text-foreground">{rows.length}</span> élèves
          </p>
        </div>
      </div>

      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddStudent}
        classOptions={classOptions}
        classesLoading={classesLoading}
      />

      {editingStudent ? (
        <AddStudentModal
          isOpen
          onClose={() => setEditingStudent(null)}
          onSubmit={handleEditStudent}
          student={editingStudent}
          classOptions={classOptions}
          classesLoading={classesLoading}
        />
      ) : null}
    </div>
  );
}
