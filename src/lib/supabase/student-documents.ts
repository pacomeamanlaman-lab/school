import type { SupabaseClient } from "@supabase/supabase-js";

/** Bucket Storage (créer via seed SQL ou Dashboard Supabase). */
export const STUDENT_DOCUMENTS_BUCKET = "student-documents";

export const STUDENT_DOC_TYPE_BIRTH = "extrait_naissance";

/** Valeurs `documents_eleves.type_document` utilisées par l’app. */
export const STUDENT_DOCUMENT_TYPE_OPTIONS = [
  { value: "extrait_naissance", label: "Extrait de naissance" },
  { value: "certificat_medical", label: "Certificat médical" },
  { value: "photo_identite", label: "Photo d’identité" },
  { value: "bulletin_ancien", label: "Bulletin ancien établissement" },
  { value: "autre", label: "Autre" },
] as const;

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "document";
}

async function getUploadedByOrError(
  supabase: SupabaseClient,
  rollbackRemovePath: string | null
): Promise<{ uploadedBy: string } | { error: string }> {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  const uploadedBy = authData.user?.id;
  if (authErr || !uploadedBy) {
    if (rollbackRemovePath) {
      await supabase.storage.from(STUDENT_DOCUMENTS_BUCKET).remove([rollbackRemovePath]);
    }
    return {
      error:
        authErr?.message ??
        "Session requise : reconnectez-vous pour enregistrer le document (uploaded_by).",
    };
  }
  return { uploadedBy };
}

/** Upload Storage + ligne `documents_eleves` pour un type de pièce donné. */
export async function uploadStudentDocument(
  supabase: SupabaseClient,
  studentId: string,
  file: File,
  typeDocument: string
): Promise<{ error: string | null }> {
  const objectName = `${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const path = `${studentId}/${objectName}`;

  const { error: upErr } = await supabase.storage.from(STUDENT_DOCUMENTS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });
  if (upErr) return { error: upErr.message };

  const auth = await getUploadedByOrError(supabase, path);
  if ("error" in auth) return { error: auth.error };

  const { data: pub } = supabase.storage.from(STUDENT_DOCUMENTS_BUCKET).getPublicUrl(path);
  const fileUrl = (pub.publicUrl ?? "").trim() || `${STUDENT_DOCUMENTS_BUCKET}/${path}`;

  const { error: insErr } = await supabase.from("documents_eleves").insert({
    student_id: studentId,
    type_document: typeDocument,
    nom_fichier: file.name,
    storage_path: path,
    file_url: fileUrl,
    uploaded_by: auth.uploadedBy,
  });
  if (insErr) {
    await supabase.storage.from(STUDENT_DOCUMENTS_BUCKET).remove([path]);
    return { error: insErr.message };
  }
  return { error: null };
}

export async function uploadStudentBirthDocument(
  supabase: SupabaseClient,
  studentId: string,
  file: File
): Promise<{ error: string | null }> {
  return uploadStudentDocument(supabase, studentId, file, STUDENT_DOC_TYPE_BIRTH);
}

export type StudentDocumentUploadItem = { file: File; type_document: string };

export async function uploadStudentDocumentsBatch(
  supabase: SupabaseClient,
  studentId: string,
  items: StudentDocumentUploadItem[]
): Promise<{ errors: string[] }> {
  const errors: string[] = [];
  for (const { file, type_document } of items) {
    const r = await uploadStudentDocument(supabase, studentId, file, type_document);
    if (r.error) errors.push(`${file.name}: ${r.error}`);
  }
  return { errors };
}

/** @deprecated utiliser `uploadStudentDocumentsBatch` */
export async function uploadStudentBirthDocuments(
  supabase: SupabaseClient,
  studentId: string,
  files: File[]
): Promise<{ errors: string[] }> {
  return uploadStudentDocumentsBatch(
    supabase,
    studentId,
    files.map((file) => ({ file, type_document: STUDENT_DOC_TYPE_BIRTH }))
  );
}

const PHOTO_MAX_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/** Photo de profil élève : upload dans le même bucket, met à jour `students.photo_url`. */
export async function uploadStudentProfilePhoto(
  supabase: SupabaseClient,
  studentId: string,
  file: File
): Promise<{ error: string | null }> {
  if (!PHOTO_TYPES.includes(file.type)) {
    return { error: "Photo : utilisez JPG, PNG ou WebP." };
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return { error: "Photo : maximum 2 Mo." };
  }

  const objectName = `photo-${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const path = `${studentId}/${objectName}`;

  const { error: upErr } = await supabase.storage.from(STUDENT_DOCUMENTS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (upErr) return { error: upErr.message };

  const { data: pub } = supabase.storage.from(STUDENT_DOCUMENTS_BUCKET).getPublicUrl(path);
  const photoUrl = (pub.publicUrl ?? "").trim() || `${STUDENT_DOCUMENTS_BUCKET}/${path}`;

  const { error: updErr } = await supabase.from("students").update({ photo_url: photoUrl }).eq("id", studentId);
  if (updErr) {
    await supabase.storage.from(STUDENT_DOCUMENTS_BUCKET).remove([path]);
    return { error: updErr.message };
  }
  return { error: null };
}

export async function createStudentDocumentSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresSec = 3600
): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage
    .from(STUDENT_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresSec);
  if (error) return { url: null, error: error.message };
  return { url: data?.signedUrl ?? null, error: null };
}
