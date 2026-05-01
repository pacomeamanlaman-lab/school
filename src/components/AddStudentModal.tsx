"use client";

import { useEffect, useState } from "react";
import FlashNotice from "./FlashNotice";
import Modal from "./Modal";
import { useFlashNotice } from "@/hooks/useFlashNotice";
import { User, Mail, Phone, Calendar, MapPin, Heart, FileText, Upload, X } from "lucide-react";
import {
  STUDENT_DOC_TYPE_BIRTH,
  STUDENT_DOCUMENT_TYPE_OPTIONS,
} from "@/lib/supabase/student-documents";

const MAX_STUDENT_DOCS = 10;
const DOC_FILE_VALID_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const DOC_FILE_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const PHOTO_FILE_MAX_BYTES = 2 * 1024 * 1024;

type DocRow = { id: string; file: File; type: string };

function newDocRowId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type ClasseSelectOption = { id: string; name: string; niveau: string };

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Retourner `false` pour garder le modal ouvert (ex. erreur enregistrement). */
  onSubmit?: (data: any) => boolean | void | Promise<boolean | void>;
  student?: any;
  /** Classes actives Supabase (valeur du select = `id` → `classe_id`) */
  classOptions: ClasseSelectOption[];
  classesLoading?: boolean;
}

export default function AddStudentModal({
  isOpen,
  onClose,
  onSubmit,
  student,
  classOptions,
  classesLoading = false,
}: AddStudentModalProps) {
  const { notice, flash } = useFlashNotice();
  const [formData, setFormData] = useState({
    firstName: student?.firstName || "",
    lastName: student?.lastName || "",
    dateNaissance: student?.dateNaissance || "",
    lieuNaissance: student?.lieuNaissance || "",
    genre: student?.genre || "M",
    classe: student?.classe || "",
    email: student?.email || "",
    phone: student?.phone || "",
    adresse: student?.adresse || "",
    groupeSanguin: student?.groupeSanguin || "",
    maladiesParticulieres: student?.maladiesParticulieres || "",
    pieceNaissance: student?.pieceNaissance || "",
    parentName: student?.parentName || "",
    parentPhone: student?.parentPhone || "",
    parentPhoneSecondaire: student?.parentPhoneSecondaire || "",
    parentEmail: student?.parentEmail || "",
  });

  const [docRows, setDocRows] = useState<DocRow[]>([]);
  const [docThumbUrl, setDocThumbUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    const imgFile = docRows.map((r) => r.file).find((f) => f.type.startsWith("image/"));
    if (imgFile) {
      url = URL.createObjectURL(imgFile);
      setDocThumbUrl(url);
    } else {
      setDocThumbUrl(null);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [docRows]);

  useEffect(() => {
    let url: string | null = null;
    if (photoFile?.type.startsWith("image/")) {
      url = URL.createObjectURL(photoFile);
      setPhotoPreviewUrl(url);
    } else {
      setPhotoPreviewUrl(null);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [photoFile]);

  useEffect(() => {
    if (!isOpen) {
      setDocRows([]);
      setPhotoFile(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      firstName: student?.firstName || "",
      lastName: student?.lastName || "",
      dateNaissance: student?.dateNaissance || "",
      lieuNaissance: student?.lieuNaissance || "",
      genre: student?.genre || "M",
      classe: student?.classe || "",
      email: student?.email || "",
      phone: student?.phone || "",
      adresse: student?.adresse || "",
      groupeSanguin: student?.groupeSanguin || "",
      maladiesParticulieres: student?.maladiesParticulieres || "",
      pieceNaissance: student?.pieceNaissance || "",
      parentName: student?.parentName || "",
      parentPhone: student?.parentPhone || "",
      parentPhoneSecondaire: student?.parentPhoneSecondaire || "",
      parentEmail: student?.parentEmail || "",
    });
  }, [isOpen, student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      const studentDocumentItems = docRows.map((r) => ({
        file: r.file,
        type_document: r.type,
      }));
      const dataToSubmit = student
        ? {
            ...student,
            ...formData,
            studentDocumentItems,
            profilePhotoFile: photoFile,
          }
        : {
            ...formData,
            studentDocumentItems,
            profilePhotoFile: photoFile,
          };
      const keepOpen = (await onSubmit(dataToSubmit)) === false;
      if (keepOpen) return;
    }
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDocFilesInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;

    setDocRows((prev) => {
      const next = [...prev];
      for (const file of picked) {
        if (next.length >= MAX_STUDENT_DOCS) {
          flash(`Maximum ${MAX_STUDENT_DOCS} fichiers par enregistrement.`, "error");
          break;
        }
        if (!DOC_FILE_VALID_TYPES.includes(file.type)) {
          flash(`${file.name} : format non supporté (PDF, JPG, PNG).`, "error");
          continue;
        }
        if (file.size > DOC_FILE_MAX_BYTES) {
          flash(`${file.name} : trop volumineux (max. 5 Mo).`, "error");
          continue;
        }
        next.push({ id: newDocRowId(), file, type: STUDENT_DOC_TYPE_BIRTH });
      }
      return next;
    });
  };

  const removeDocRow = (id: string) => {
    setDocRows((prev) => prev.filter((r) => r.id !== id));
  };

  const setDocRowType = (id: string, type: string) => {
    setDocRows((prev) => prev.map((r) => (r.id === id ? { ...r, type } : r)));
  };

  const handlePhotoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!PHOTO_FILE_TYPES.includes(file.type)) {
      flash("Photo : JPG, PNG ou WebP uniquement.", "error");
      return;
    }
    if (file.size > PHOTO_FILE_MAX_BYTES) {
      flash("Photo : maximum 2 Mo.", "error");
      return;
    }
    setPhotoFile(file);
  };

  const clearPhoto = () => setPhotoFile(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={student ? "Modifier l'élève" : "Ajouter un élève"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <FlashNotice payload={notice} />
        {/* Informations élève */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Informations de l'élève
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Prénom <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="Marie"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nom <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="Dupont"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date de naissance <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                name="dateNaissance"
                value={formData.dateNaissance}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Lieu de naissance</label>
              <input
                type="text"
                name="lieuNaissance"
                value={formData.lieuNaissance}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="Ex. Abidjan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Genre <span className="text-danger">*</span>
              </label>
              <select
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              >
                <option value="M">Garçon</option>
                <option value="F">Fille</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Classe <span className="text-danger">*</span>
              </label>
              <select
                name="classe"
                value={formData.classe}
                onChange={handleChange}
                required
                disabled={classesLoading || !classOptions.length}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">
                  {classesLoading
                    ? "Chargement des classes…"
                    : classOptions.length
                      ? "Sélectionner une classe"
                      : "Aucune classe — créez-en une dans Classes"}
                </option>
                {classOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.niveau})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Photo de l&apos;élève</label>
              {student?.photoUrl ? (
                <p className="text-xs text-muted-foreground mb-2">Une photo est déjà enregistrée ; choisissez un fichier pour la remplacer.</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-input bg-background cursor-pointer hover:bg-accent text-sm font-medium">
                  Choisir une image
                  <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoInput} />
                </label>
                {photoFile ? (
                  <>
                    <span className="text-sm text-foreground truncate max-w-[200px]">{photoFile.name}</span>
                    <button type="button" onClick={clearPhoto} className="text-sm text-danger hover:underline">
                      Retirer
                    </button>
                  </>
                ) : null}
              </div>
              {photoPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreviewUrl} alt="" className="mt-2 h-24 w-24 rounded-full object-cover border border-border" />
              ) : null}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Adresse
            </label>
            <textarea
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition resize-none"
              placeholder="12 Rue de l'École, 75001 Paris"
            />
          </div>
        </div>

        {/* Informations médicales */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Informations médicales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Groupe sanguin
              </label>
              <select
                name="groupeSanguin"
                value={formData.groupeSanguin}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              >
                <option value="">Non renseigné</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Maladies particulières / Allergies
              </label>
              <textarea
                name="maladiesParticulieres"
                value={formData.maladiesParticulieres}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition resize-none"
                placeholder="Asthme, allergies alimentaires, diabète, etc."
              />
            </div>
          </div>
        </div>

        {/* Pièces jointes */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Pièces administratives
          </h3>

          <div className="space-y-4">
            {/* Numéro extrait */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Numéro extrait de naissance
              </label>
              <input
                type="text"
                name="pieceNaissance"
                value={formData.pieceNaissance}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="Ex: 2024/123/ABC"
              />
            </div>

            {/* Upload fichier(s) + type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Documents joints (un type par fichier)
              </label>

              <label className="flex flex-col items-center justify-center w-full min-h-[8rem] border-2 border-dashed border-input rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition py-4">
                <div className="flex flex-col items-center justify-center px-4">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    <span className="font-semibold">Ajouter des fichiers</span>
                    {docRows.length ? ` (${docRows.length}/${MAX_STUDENT_DOCS})` : null}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    PDF, JPG, PNG — max. 5 Mo par fichier — plusieurs fichiers possibles
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleDocFilesInput}
                />
              </label>

              {docRows.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {docRows.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-success/10 border border-success/20 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <FileText className="w-5 h-5 text-success shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{row.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(row.file.size / 1024).toFixed(0)} Ko — envoi après enregistrement
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={row.type}
                          onChange={(e) => setDocRowType(row.id, e.target.value)}
                          className="text-sm px-2 py-1.5 rounded-lg border border-input bg-white min-w-[10rem]"
                        >
                          {STUDENT_DOCUMENT_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeDocRow(row.id)}
                          className="p-1.5 hover:bg-danger/10 rounded-lg transition text-danger"
                          aria-label={`Retirer ${row.file.name}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {docThumbUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={docThumbUrl}
                  alt="Aperçu (première image pièce)"
                  className="mt-3 max-h-40 rounded-lg border border-border object-contain"
                />
              ) : null}

              <p className="text-xs text-muted-foreground mt-2">
                Bucket « student-documents » — jusqu&apos;à {MAX_STUDENT_DOCS} fichiers (voir seed SQL).
              </p>
            </div>
          </div>
        </div>

        {/* Informations parent/tuteur */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Informations du parent/tuteur
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nom complet <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Téléphone principal <span className="text-danger">*</span>
              </label>
              <input
                type="tel"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Téléphone secondaire
              </label>
              <input
                type="tel"
                name="parentPhoneSecondaire"
                value={formData.parentPhoneSecondaire}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="+33 6 98 76 54 32"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                name="parentEmail"
                value={formData.parentEmail}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="jean.dupont@example.com"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-background border border-input hover:bg-accent rounded-lg transition font-medium text-foreground"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20"
          >
            {student ? "Modifier" : "Ajouter l'élève"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
