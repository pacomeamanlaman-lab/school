"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Users,
  FileText,
  Download,
  Eye,
  MessageCircle,
  Heart,
  Loader2,
} from "lucide-react";
import FlashNotice from "@/components/FlashNotice";
import Modal from "@/components/Modal";
import WhatsAppNotifyModal from "@/components/WhatsAppNotifyModal";
import { useFlashNotice } from "@/hooks/useFlashNotice";
import { buildManualWhatsAppContext, type WhatsAppNotifyContext } from "@/lib/whatsapp-templates-mvp";
import { createClient } from "@/lib/supabase/client";
import { createStudentDocumentSignedUrl } from "@/lib/supabase/student-documents";

type StudentDetailVM = {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  classe: string;
  dateNaissance: string;
  lieuNaissance: string;
  genre: string;
  phone: string;
  email: string;
  adresse: string;
  /** Numéro extrait de naissance (champ libre) */
  pieceNaissance: string;
  groupeSanguin: string;
  maladiesParticulieres: string;
  status: "active" | "inactive" | "transferred";
  statusLabel: string;
  photoUrl: string | null;
  parent: {
    name: string;
    phone: string;
    phoneSecondaire: string;
    email: string;
  };
  dateInscription: string;
  documents: Array<{
    id: string;
    type: string;
    nomFichier: string;
    dateUpload: string;
    taille: string;
    storagePath: string | null;
  }>;
  notes: Array<{ matiere: string; note: number; trimestre: string }>;
  absences: Array<{ date: string; type: string; motif: string | null }>;
};

function embedOne<T extends object>(raw: unknown): T | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) return (raw[0] as T | undefined) ?? null;
  return raw as T;
}

const DOC_LABELS: Record<string, string> = {
  extrait_naissance: "Extrait de naissance",
  certificat_medical: "Certificat médical",
  photo_identite: "Photo d'identité",
  bulletin_ancien: "Bulletin ancien",
  autre: "Autre",
};

function studentStatusLabel(s: StudentDetailVM["status"]): string {
  if (s === "active") return "Actif";
  if (s === "inactive") return "Inactif";
  return "Transféré";
}

function studentStatusBadgeClass(s: StudentDetailVM["status"]): string {
  if (s === "active") return "bg-success/10 text-success";
  if (s === "inactive") return "bg-muted text-muted-foreground";
  return "bg-warning/10 text-warning";
}

type DocPreviewKind = "pdf" | "image" | "other";

function docPreviewKindFromFileName(nomFichier: string): DocPreviewKind {
  const ext = nomFichier.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  return "other";
}

async function downloadFileFromUrl(url: string, filename: string): Promise<{ error: string | null }> {
  try {
    const res = await fetch(url);
    if (!res.ok) return { error: `Téléchargement impossible (${res.status})` };
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename || "document";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur réseau" };
  }
}

async function loadStudent(id: string): Promise<StudentDetailVM | null> {
  const supabase = createClient();

  const { data: st, error } = await supabase
    .from("students")
    .select("*, classes ( name, niveau )")
    .eq("id", id)
    .maybeSingle();

  if (error || !st) return null;

  const { data: links } = await supabase
    .from("student_parents")
    .select("parents ( nom, telephone, telephone_secondaire, email )")
    .eq("student_id", id)
    .limit(1);

  let parent = {
    name: "—",
    phone: "—",
    phoneSecondaire: "",
    email: "—",
  };
  const pl = embedOne<{
    nom: string;
    telephone: string;
    telephone_secondaire: string | null;
    email: string | null;
  }>(links?.[0]?.parents);
  if (pl) {
    parent = {
      name: pl.nom,
      phone: pl.telephone,
      phoneSecondaire: pl.telephone_secondaire ?? "",
      email: pl.email ?? "—",
    };
  }

  const { data: noteRows } = await supabase
    .from("notes")
    .select("note, matieres ( nom ), trimestres ( nom )")
    .eq("student_id", id);

  const notes = (noteRows ?? []).map((r) => {
    const m = embedOne<{ nom: string }>(r.matieres);
    const t = embedOne<{ nom: string }>(r.trimestres);
    return {
      matiere: m?.nom ?? "—",
      note: Number(r.note),
      trimestre: t?.nom ?? "—",
    };
  });

  const { data: absRows } = await supabase
    .from("absences")
    .select("date, justifiee, motif, statut")
    .eq("student_id", id)
    .in("statut", ["absent", "retard"])
    .order("date", { ascending: false });

  const absences = (absRows ?? []).map((r) => ({
    date: r.date as string,
    type: r.justifiee ? "Justifiée" : "Non justifiée",
    motif: r.motif as string | null,
  }));

  const { data: docs } = await supabase
    .from("documents_eleves")
    .select("id, type_document, nom_fichier, uploaded_at, storage_path")
    .eq("student_id", id);

  const documents = (docs ?? []).map((d) => {
    const row = d as {
      id: unknown;
      type_document: unknown;
      nom_fichier: unknown;
      uploaded_at: unknown;
      storage_path?: unknown;
    };
    return {
      id: String(row.id),
      type: DOC_LABELS[String(row.type_document)] ?? String(row.type_document),
      nomFichier: row.nom_fichier as string,
      dateUpload: row.uploaded_at as string,
      taille: "—",
      storagePath: typeof row.storage_path === "string" && row.storage_path ? row.storage_path : null,
    };
  });

  const cl = embedOne<{ name: string; niveau: string }>(st.classes);

  const dash = (v: unknown) => {
    const t = typeof v === "string" ? v.trim() : "";
    return t || "—";
  };

  const rawStatus = (st as { status?: string }).status;
  const status: StudentDetailVM["status"] =
    rawStatus === "inactive" || rawStatus === "transferred" ? rawStatus : "active";

  const gs = (st as { groupe_sanguin?: string | null }).groupe_sanguin;
  const groupeSanguin = gs && String(gs).trim() ? String(gs) : "—";

  return {
    id: st.id as string,
    firstName: st.first_name as string,
    lastName: st.last_name as string,
    matricule: st.matricule as string,
    classe: cl?.name ?? cl?.niveau ?? "—",
    dateNaissance: st.date_naissance as string,
    lieuNaissance: dash((st as { lieu_naissance?: string | null }).lieu_naissance),
    genre: st.genre as string,
    phone: dash((st as { phone?: string | null }).phone),
    email: dash((st as { email?: string | null }).email),
    adresse: dash((st as { adresse?: string | null }).adresse),
    pieceNaissance: dash((st as { piece_naissance?: string | null }).piece_naissance),
    groupeSanguin,
    maladiesParticulieres: dash((st as { maladies_particulieres?: string | null }).maladies_particulieres),
    status,
    statusLabel: studentStatusLabel(status),
    photoUrl: ((st as { photo_url?: string | null }).photo_url ?? "").trim() || null,
    parent,
    dateInscription: st.created_at as string,
    documents,
    notes,
    absences,
  };
}

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [vm, setVm] = useState<StudentDetailVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [waContext, setWaContext] = useState<WhatsAppNotifyContext | null>(null);
  const [docPreview, setDocPreview] = useState<{
    id: string;
    nomFichier: string;
    storagePath: string;
    url: string;
    kind: DocPreviewKind;
  } | null>(null);
  const [docActionLoading, setDocActionLoading] = useState<string | null>(null);
  const [deletingStudent, setDeletingStudent] = useState(false);
  const { notice, flash } = useFlashNotice();

  const refresh = useCallback(async () => {
    if (!id) {
      setVm(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await loadStudent(id);
    setVm(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDeleteStudent = async () => {
    if (!vm) return;
    if (!confirm(`Supprimer définitivement ${vm.firstName} ${vm.lastName} ? Cette action est irréversible.`)) return;
    setDeletingStudent(true);
    const supabase = createClient();
    const { error } = await supabase.from("students").delete().eq("id", vm.id);
    setDeletingStudent(false);
    if (error) {
      flash(error.message, "error");
      return;
    }
    flash("Élève supprimé.", "success");
    router.push("/dashboard/students");
  };

  const handleDownload = async (document: { nomFichier: string; storagePath: string | null; id: string }) => {
    if (!document.storagePath) {
      flash("Ce document n'a pas de fichier associé en stockage.", "error");
      return;
    }
    setDocActionLoading(`dl-${document.id}`);
    const supabase = createClient();
    const { url, error } = await createStudentDocumentSignedUrl(supabase, document.storagePath, 3600);
    if (error || !url) {
      setDocActionLoading(null);
      flash(error ?? "Impossible de générer le lien de téléchargement.", "error");
      return;
    }
    const dl = await downloadFileFromUrl(url, document.nomFichier);
    setDocActionLoading(null);
    if (dl.error) {
      flash(dl.error, "error");
    }
  };

  const handlePreview = async (document: { nomFichier: string; storagePath: string | null; id: string }) => {
    if (!document.storagePath) {
      flash("Ce document n'a pas de fichier associé en stockage.", "error");
      return;
    }
    setDocActionLoading(`pv-${document.id}`);
    const supabase = createClient();
    const { url, error } = await createStudentDocumentSignedUrl(supabase, document.storagePath, 3600);
    setDocActionLoading(null);
    if (error || !url) {
      flash(error ?? "Impossible de générer l’aperçu.", "error");
      return;
    }
    setDocPreview({
      id: document.id,
      nomFichier: document.nomFichier,
      storagePath: document.storagePath,
      url,
      kind: docPreviewKindFromFileName(document.nomFichier),
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Chargement de la fiche élève…
      </div>
    );
  }

  if (!vm) {
    return (
      <div className="space-y-4 p-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 hover:bg-accent rounded-lg transition inline-flex"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-foreground font-medium">Élève introuvable.</p>
        <p className="text-sm text-muted-foreground">Vérifiez l&apos;URL ou les droits RLS sur la table students.</p>
      </div>
    );
  }

  const moyenneGenerale =
    vm.notes.length > 0
      ? vm.notes.reduce((acc, n) => acc + n.note, 0) / vm.notes.length
      : null;

  return (
    <div className="space-y-6">
      <FlashNotice payload={notice} />
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 hover:bg-accent rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Fiche élève</h1>
          <p className="text-muted-foreground">Informations détaillées (Supabase)</p>
        </div>
        <button
          type="button"
          onClick={() =>
            setWaContext(
              buildManualWhatsAppContext({
                parentNomComplet: vm.parent.name,
                whatsapp: vm.parent.phone,
                sujet: `Élève ${vm.firstName} ${vm.lastName}`,
                eleveOuEnfants: `${vm.firstName} ${vm.lastName} (${vm.classe})`,
              })
            )
          }
          className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] rounded-lg transition font-medium border border-[#25D366]/30"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp parent
        </button>
        <button
          type="button"
          onClick={() => router.push(`/dashboard/students`)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20"
        >
          <Edit className="w-4 h-4" />
          Liste / modifier
        </button>
        <button
          type="button"
          disabled={deletingStudent}
          onClick={() => void handleDeleteStudent()}
          className="flex items-center gap-2 px-4 py-2.5 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition font-medium disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          {deletingStudent ? "Suppression…" : "Supprimer"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-6 mb-6">
              {vm.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vm.photoUrl}
                  alt=""
                  className="w-24 h-24 rounded-full object-cover border border-border flex-shrink-0 bg-muted"
                />
              ) : (
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-3xl">
                    {vm.firstName[0]}
                    {vm.lastName[0]}
                  </span>
                </div>
              )}

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">
                  {vm.firstName} {vm.lastName}
                </h2>
                <p className="text-muted-foreground font-mono mt-1">{vm.matricule}</p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1 bg-secondary/10 text-secondary rounded-md text-sm font-semibold">
                    {vm.classe}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold ${studentStatusBadgeClass(vm.status)}`}
                  >
                    {vm.statusLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Date de naissance</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(vm.dateNaissance).toLocaleDateString("fr-FR")} (
                    {Math.floor(
                      (Date.now() - new Date(vm.dateNaissance).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
                    )}{" "}
                    ans)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Lieu de naissance</p>
                  <p className="text-sm font-medium text-foreground">{vm.lieuNaissance}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Genre</p>
                  <p className="text-sm font-medium text-foreground">
                    {vm.genre === "M" ? "Garçon" : "Fille"}
                  </p>
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

              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Adresse</p>
                  <p className="text-sm font-medium text-foreground">{vm.adresse}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 md:col-span-2">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">N° extrait de naissance</p>
                  <p className="text-sm font-medium text-foreground">{vm.pieceNaissance}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Informations médicales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Groupe sanguin</p>
                    <p className="text-sm font-medium text-foreground">{vm.groupeSanguin}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 md:col-span-2">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Maladies particulières / Allergies</p>
                    <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{vm.maladiesParticulieres}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Parent / Tuteur
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Nom complet</p>
                  <p className="text-sm font-medium text-foreground">{vm.parent.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone principal</p>
                  <p className="text-sm font-medium text-foreground">{vm.parent.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone secondaire</p>
                  <p className="text-sm font-medium text-foreground">
                    {vm.parent.phoneSecondaire?.trim() ? vm.parent.phoneSecondaire : "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 md:col-span-2">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">{vm.parent.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Notes en base</h3>
            {vm.notes.length ? (
              <>
                <div className="space-y-3">
                  {vm.notes.map((note, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium text-foreground">
                        {note.matiere} <span className="text-muted-foreground">({note.trimestre})</span>
                      </span>
                      <span
                        className={`text-lg font-bold ${
                          note.note >= 16
                            ? "text-success"
                            : note.note >= 12
                              ? "text-primary"
                              : note.note >= 10
                                ? "text-warning"
                                : "text-danger"
                        }`}
                      >
                        {note.note.toFixed(1)}/20
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Moyenne générale</span>
                    <span className="text-xl font-bold text-primary">
                      {moyenneGenerale != null ? moyenneGenerale.toFixed(2) : "—"}/20
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune note pour cet élève.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Statistiques</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Absences / retards enregistrés</p>
                <p className="text-2xl font-bold text-foreground">{vm.absences.length}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Date d&apos;inscription (created_at)</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(vm.dateInscription).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Absences & retards</h3>
            {vm.absences.length > 0 ? (
              <div className="space-y-3">
                {vm.absences.map((absence, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">
                        {new Date(absence.date).toLocaleDateString("fr-FR")}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          absence.type === "Justifiée"
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        {absence.type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{absence.motif ?? "—"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune absence ou retard.</p>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents administratifs
            </h3>
            {vm.documents.length > 0 ? (
              <div className="space-y-3">
                {vm.documents.map((document) => (
                  <div key={document.id} className="p-3 bg-muted rounded-lg hover:bg-accent transition group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{document.nomFichier}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{document.type}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{document.taille}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(document.dateUpload).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={docActionLoading === `pv-${document.id}`}
                          onClick={() => void handlePreview(document)}
                          className="p-1.5 hover:bg-info/10 rounded-lg transition text-info disabled:opacity-50"
                          title="Voir"
                        >
                          {docActionLoading === `pv-${document.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={docActionLoading === `dl-${document.id}`}
                          onClick={() => void handleDownload(document)}
                          className="p-1.5 hover:bg-success/10 rounded-lg transition text-success disabled:opacity-50"
                          title="Télécharger"
                        >
                          {docActionLoading === `dl-${document.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">Aucun document en base pour cet élève.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!docPreview}
        onClose={() => setDocPreview(null)}
        title={docPreview ? `Aperçu — ${docPreview.nomFichier}` : "Aperçu"}
        size="xl"
      >
        {docPreview ? (
          <div className="space-y-4">
            {docPreview.kind === "pdf" ? (
              <iframe
                title={docPreview.nomFichier}
                src={docPreview.url}
                className="w-full min-h-[70vh] rounded-lg border border-border bg-muted"
              />
            ) : null}
            {docPreview.kind === "image" ? (
              <div className="flex justify-center overflow-auto max-h-[75vh] rounded-lg border border-border bg-muted p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={docPreview.url}
                  alt={docPreview.nomFichier}
                  className="max-w-full object-contain"
                />
              </div>
            ) : null}
            {docPreview.kind === "other" ? (
              <div className="rounded-lg border border-border bg-muted/50 p-6 text-center text-sm text-muted-foreground">
                <p>Aperçu non disponible pour ce type de fichier.</p>
                <p className="mt-2">Utilisez le bouton Télécharger pour enregistrer le document.</p>
              </div>
            ) : null}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() =>
                  void handleDownload({
                    id: docPreview.id,
                    nomFichier: docPreview.nomFichier,
                    storagePath: docPreview.storagePath,
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <WhatsAppNotifyModal
        isOpen={!!waContext}
        onClose={() => setWaContext(null)}
        context={waContext}
        onConfirmSend={(ctx) => {
          console.log("[MVP WhatsApp] Fiche élève — envoi simulé:", ctx);
          flash("Envoi WhatsApp simulé (branchement Meta + backend à venir).", "info");
        }}
      />
    </div>
  );
}
