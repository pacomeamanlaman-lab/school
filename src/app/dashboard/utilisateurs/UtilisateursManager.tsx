"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

export type UtilisateurRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  phone: string | null;
  created_at: string;
};

type ProfileRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type ProfileStatus = Database["public"]["Tables"]["profiles"]["Row"]["status"];

const ROLE_OPTIONS: readonly ProfileRole[] = [
  "enseignant",
  "admin",
  "super_admin",
  "secretaire",
  "comptable",
  "surveillant",
  "parent",
  "eleve",
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

function roleLabel(role: string): string {
  if (role in ROLE_LABEL_FR) return ROLE_LABEL_FR[role as ProfileRole];
  return role;
}

function statusLabel(status: string): string {
  if (status in STATUS_LABEL_FR) return STATUS_LABEL_FR[status as ProfileStatus];
  return status;
}

function badgeRoleClass(role: string): string {
  switch (role) {
    case "super_admin":
      return "bg-violet-500/15 text-violet-800 dark:text-violet-200";
    case "admin":
      return "bg-danger/10 text-danger";
    case "enseignant":
      return "bg-primary/10 text-primary";
    case "secretaire":
      return "bg-info/10 text-info";
    case "comptable":
      return "bg-amber-500/10 text-amber-800 dark:text-amber-200";
    case "surveillant":
      return "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
    case "parent":
      return "bg-secondary/15 text-secondary";
    case "eleve":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

type Props = {
  initialProfiles: UtilisateurRow[];
  loadError: string | null;
};

export default function UtilisateursManager({ initialProfiles, loadError }: Props) {
  const router = useRouter();
  const [createEmail, setCreateEmail] = useState("");
  const [createFirst, setCreateFirst] = useState("");
  const [createLast, setCreateLast] = useState("");
  const [createRole, setCreateRole] = useState<ProfileRole>("enseignant");
  const [tempPassword, setTempPassword] = useState("");
  const [tempPasswordConfirm, setTempPasswordConfirm] = useState("");
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    setFormBusy(true);
    try {
      const res = await fetch("/api/admin/utilisateurs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: createEmail.trim(),
          first_name: createFirst.trim(),
          last_name: createLast.trim(),
          role: createRole,
          temporary_password: tempPassword,
          temporary_password_confirm: tempPasswordConfirm,
        }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setBanner({ type: "error", text: data.error ?? "Création impossible." });
        return;
      }
      setBanner({
        type: "success",
        text: "Compte créé. Communiquez le mot de passe temporaire par un canal sécurisé ; l’utilisateur devra choisir un nouveau mot de passe à la première connexion. Pensez à la fiche Personnel si besoin.",
      });
      setCreateEmail("");
      setCreateFirst("");
      setCreateLast("");
      setCreateRole("enseignant");
      setTempPassword("");
      setTempPasswordConfirm("");
      router.refresh();
    } catch {
      setBanner({ type: "error", text: "Erreur réseau. Réessayez." });
    } finally {
      setFormBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      {loadError ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{loadError}</div>
      ) : null}

      {banner ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border-success/30 bg-success/5 text-success"
              : "border-danger/30 bg-danger/5 text-danger"
          }`}
        >
          {banner.text}
        </div>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Créer un utilisateur</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Définissez un <strong>mot de passe temporaire</strong> (minimum 8 caractères) : communiquez-le hors de la
          plateforme ; à la première connexion, l’utilisateur devra en choisir un nouveau. Les comptes staff restent à
          rattacher dans <strong>Personnel</strong> pour la fiche RH.
        </p>
        <form onSubmit={(e) => void handleCreateUser(e)} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Prénom <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={createFirst}
              onChange={(e) => setCreateFirst(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nom <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={createLast}
              onChange={(e) => setCreateLast(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              E-mail <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              required
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="prenom.nom@ecole.ci"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Rôle sur la plateforme <span className="text-danger">*</span>
            </label>
            <select
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value as ProfileRole)}
              className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL_FR[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Mot de passe temporaire <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type={showTempPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                className="w-full pl-4 pr-11 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowTempPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                aria-label={showTempPassword ? "Masquer" : "Afficher"}
              >
                {showTempPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Confirmer le mot de passe temporaire <span className="text-danger">*</span>
            </label>
            <input
              type={showTempPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={tempPasswordConfirm}
              onChange={(e) => setTempPasswordConfirm(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={formBusy}
              className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {formBusy ? "Création…" : "Créer le compte"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Comptes ({initialProfiles.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Rôle</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Créé le</th>
              </tr>
            </thead>
            <tbody>
              {initialProfiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Aucun profil.
                  </td>
                </tr>
              ) : (
                initialProfiles.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {p.first_name} {p.last_name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${badgeRoleClass(p.role)}`}
                      >
                        {roleLabel(p.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{statusLabel(p.status)}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
