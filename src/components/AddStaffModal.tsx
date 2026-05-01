"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "./Modal";
import { User, BookOpen, School } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type ProfileRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type ProfileStatus = Database["public"]["Tables"]["profiles"]["Row"]["status"];

/** Rôles `profiles` utilisables pour une fiche personnel (hors parent / élève). */
const STAFF_PROFILE_ROLES: readonly ProfileRole[] = [
  "super_admin",
  "admin",
  "secretaire",
  "comptable",
  "surveillant",
  "enseignant",
];

const ROLE_LABEL_FR: Record<ProfileRole, string> = {
  enseignant: "Enseignant",
  admin: "Administrateur",
  super_admin: "Super administrateur",
  secretaire: "Secrétaire",
  comptable: "Comptable",
  surveillant: "Surveillant",
  parent: "Parent",
  eleve: "Élève",
};

const STATUS_LABEL_FR: Record<ProfileStatus, string> = {
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu",
};

function normalizeStaffRoleForForm(raw: unknown): ProfileRole {
  const s = String(raw ?? "").trim();
  const lower = s.toLowerCase();
  if (
    lower === "super_admin" ||
    lower === "admin" ||
    lower === "enseignant" ||
    lower === "secretaire" ||
    lower === "comptable" ||
    lower === "surveillant"
  )
    return lower as ProfileRole;
  if (lower === "parent" || lower === "eleve") return "enseignant";
  if (s === "Enseignant") return "enseignant";
  if (s === "Surveillant") return "surveillant";
  if (s === "Secrétaire" || s === "Secretaire") return "secretaire";
  if (s === "Comptable") return "comptable";
  if (s === "Directeur" || s === "Personnel administratif" || s === "Administration") return "admin";
  return "enseignant";
}

function normalizeProfileStatusForForm(raw: unknown): ProfileStatus {
  const s = String(raw ?? "").trim();
  if (s === "active" || s === "inactive" || s === "suspended") return s;
  if (s === "conge") return "inactive";
  if (s === "suspendu") return "suspended";
  return "active";
}

type ClasseOpt = { id: string; name: string; niveau: string };
type MatiereOpt = { id: string; nom: string };

export type LinkableProfileOption = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
};

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Retourner `false` pour garder le modal ouvert. */
  onSubmit?: (data: any) => boolean | void | Promise<boolean | void>;
  staff?: any;
  /** Profils sans fiche `staff` — obligatoire pour l’ajout. */
  linkableProfiles?: LinkableProfileOption[];
}

export default function AddStaffModal({
  isOpen,
  onClose,
  onSubmit,
  staff,
  linkableProfiles = [],
}: AddStaffModalProps) {
  const [linkProfileId, setLinkProfileId] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    role: "enseignant" as ProfileRole,
    matiereId: "",
    classeId: "",
    email: "",
    phone: "",
    adresse: "",
    dateEmbauche: "",
    statut: "active" as ProfileStatus,
  });

  const [classOptions, setClassOptions] = useState<ClasseOpt[]>([]);
  const [matiereOptions, setMatiereOptions] = useState<MatiereOpt[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    const supabase = createClient();
    const [clRes, mRes] = await Promise.all([
      supabase.from("classes").select("id, name, niveau").eq("status", "active").order("niveau").order("name"),
      supabase.from("matieres").select("id, nom").order("nom"),
    ]);
    setClassOptions(
      (clRes.data ?? []).map((r) => ({
        id: r.id as string,
        name: r.name as string,
        niveau: r.niveau as string,
      }))
    );
    setMatiereOptions(
      (mRes.data ?? []).map((r) => ({
        id: r.id as string,
        nom: r.nom as string,
      }))
    );
    setOptionsLoading(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void loadOptions();
  }, [isOpen, loadOptions]);

  useEffect(() => {
    if (staff) {
      setLinkProfileId("");
      const roleRaw = staff.profileRole ?? staff.role;
      const statusRaw = staff.profileStatus ?? staff.status ?? staff.statut;
      setFormData({
        firstName: staff.firstName || "",
        lastName: staff.lastName || "",
        role: normalizeStaffRoleForForm(roleRaw),
        matiereId: staff.matiereId || "",
        classeId: staff.classeId || "",
        email: staff.email || "",
        phone: staff.phone || "",
        adresse: staff.adresse || "",
        dateEmbauche: staff.dateEmbauche || "",
        statut: normalizeProfileStatusForForm(statusRaw),
      });
    } else {
      setLinkProfileId("");
      setFormData({
        firstName: "",
        lastName: "",
        role: "enseignant",
        matiereId: "",
        classeId: "",
        email: "",
        phone: "",
        adresse: "",
        dateEmbauche: "",
        statut: "active",
      });
    }
  }, [staff, isOpen]);

  useEffect(() => {
    if (!isOpen || staff || !linkProfileId || !linkableProfiles.length) return;
    const p = linkableProfiles.find((x) => x.id === linkProfileId);
    if (!p) return;
    setFormData((fd) => ({
      ...fd,
      firstName: p.first_name,
      lastName: p.last_name,
      email: p.email,
      phone: p.phone ?? "",
      role: normalizeStaffRoleForForm(p.role),
    }));
  }, [linkProfileId, staff, isOpen, linkableProfiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff && !linkProfileId.trim()) return;
    if (onSubmit) {
      const payload = staff
        ? { ...staff, ...formData }
        : { ...formData, linkProfileId: linkProfileId.trim() };
      const keepOpen = (await onSubmit(payload)) === false;
      if (keepOpen) return;
    }
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isEnseignant = formData.role === "enseignant";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={staff ? "Modifier le membre du personnel" : "Ajouter un membre du personnel"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {!staff ? (
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Compte utilisateur (profil) à lier <span className="text-danger">*</span>
            </label>
            {linkableProfiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun profil disponible : tous les comptes éligibles ont déjà une fiche staff, ou créez des utilisateurs dans
                Supabase Auth + <code className="text-xs">profiles</code>.
              </p>
            ) : (
              <select
                value={linkProfileId}
                onChange={(e) => setLinkProfileId(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              >
                <option value="">Choisir un profil…</option>
                {linkableProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} — {p.email} ({p.role})
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : null}

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Informations personnelles
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
                Email <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="marie.dupont@ecole.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Téléphone <span className="text-danger">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-2">Adresse</label>
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

        <div className="pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Informations professionnelles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Rôle <span className="text-danger">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              >
                {STAFF_PROFILE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL_FR[r]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Date d&apos;embauche</label>
              <input
                type="date"
                name="dateEmbauche"
                value={formData.dateEmbauche}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
            </div>

            {isEnseignant && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Matière enseignée</label>
                  <select
                    name="matiereId"
                    value={formData.matiereId}
                    onChange={handleChange}
                    disabled={optionsLoading || !matiereOptions.length}
                    className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition disabled:opacity-60"
                  >
                    <option value="">
                      {optionsLoading ? "Chargement…" : matiereOptions.length ? "Choisir une matière" : "Aucune matière en base"}
                    </option>
                    {matiereOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Classe titulaire</label>
                  <select
                    name="classeId"
                    value={formData.classeId}
                    onChange={handleChange}
                    disabled={optionsLoading || !classOptions.length}
                    className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition disabled:opacity-60"
                  >
                    <option value="">
                      {optionsLoading ? "Chargement…" : classOptions.length ? "Aucune / Choisir une classe" : "Aucune classe en base"}
                    </option>
                    {classOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.niveau})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Statut</label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              >
                {(Object.keys(STATUS_LABEL_FR) as ProfileStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL_FR[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-muted border border-border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-info/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <School className="w-4 h-4 text-info" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Information</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ajout : choisir un profil Auth déjà présent (sans ligne <code className="text-xs">staff</code>), compléter la fiche
                puis enregistrement. Modification : met à jour le profil et la ligne <code className="text-xs">staff</code>.
              </p>
            </div>
          </div>
        </div>

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
            disabled={!staff && (!linkableProfiles.length || !linkProfileId)}
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {staff ? "Modifier" : "Ajouter le membre"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
