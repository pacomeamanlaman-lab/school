"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2 } from "lucide-react";
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

type Props = {
  initialProfiles: UtilisateurRow[];
  loadError: string | null;
  currentUserId: string;
};

const STATUS_OPTIONS: readonly ProfileStatus[] = ["active", "inactive", "suspended"];

export default function UtilisateursManager({ initialProfiles, loadError, currentUserId }: Props) {
  const router = useRouter();
  const [createEmail, setCreateEmail] = useState("");
  const [createFirst, setCreateFirst] = useState("");
  const [createLast, setCreateLast] = useState("");
  const [createRole, setCreateRole] = useState<ProfileRole>("enseignant");
  const [tempPassword, setTempPassword] = useState("");
  const [tempPasswordConfirm, setTempPasswordConfirm] = useState("");
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const patchUser = async (id: string, body: { role?: ProfileRole; status?: ProfileStatus }): Promise<boolean> => {
    setRowBusyId(id);
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/utilisateurs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setBanner({ type: "error", text: data.error ?? "Mise à jour impossible." });
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setBanner({ type: "error", text: "Erreur réseau. Réessayez." });
      return false;
    } finally {
      setRowBusyId(null);
    }
  };

  const handleRoleChange = async (p: UtilisateurRow, el: HTMLSelectElement) => {
    const next = el.value as ProfileRole;
    if (next === p.role) return;
    const label = ROLE_LABEL_FR[next];
    if (!window.confirm(`Changer le rôle de ${p.first_name} ${p.last_name} en « ${label} » ?`)) {
      el.value = p.role;
      return;
    }
    const ok = await patchUser(p.id, { role: next });
    if (!ok) el.value = p.role;
  };

  const handleStatusChange = async (p: UtilisateurRow, el: HTMLSelectElement) => {
    const next = el.value as ProfileStatus;
    if (next === p.status) return;
    if (
      !window.confirm(
        `Modifier le statut de ${p.first_name} ${p.last_name} en « ${STATUS_LABEL_FR[next]} » ?`
      )
    ) {
      el.value = p.status;
      return;
    }
    const ok = await patchUser(p.id, { status: next });
    if (!ok) el.value = p.status;
  };

  const handleDelete = (p: UtilisateurRow) => {
    if (p.id === currentUserId) return;
    if (
      !window.confirm(
        `Supprimer définitivement le compte de ${p.first_name} ${p.last_name} (${p.email}) ? Cette action est irréversible.`
      )
    ) {
      return;
    }
    void (async () => {
      setRowBusyId(p.id);
      setBanner(null);
      try {
        const res = await fetch(`/api/admin/utilisateurs/${p.id}`, { method: "DELETE" });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setBanner({ type: "error", text: data.error ?? "Suppression impossible." });
          return;
        }
        setBanner({ type: "success", text: "Compte supprimé." });
        router.refresh();
      } catch {
        setBanner({ type: "error", text: "Erreur réseau. Réessayez." });
      } finally {
        setRowBusyId(null);
      }
    })();
  };

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
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="px-3 py-3 font-medium">Nom</th>
                <th className="px-3 py-3 font-medium">E-mail</th>
                <th className="px-3 py-3 font-medium w-[11rem]">Rôle</th>
                <th className="px-3 py-3 font-medium w-[9rem]">Statut</th>
                <th className="px-3 py-3 font-medium hidden lg:table-cell w-[7rem]">Créé le</th>
                <th className="px-3 py-3 font-medium text-right w-[4.5rem]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialProfiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Aucun profil.
                  </td>
                </tr>
              ) : (
                initialProfiles.map((p) => {
                  const busy = rowBusyId === p.id;
                  const isSelf = p.id === currentUserId;
                  const roleOk = (ROLE_OPTIONS as readonly string[]).includes(p.role);
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-3 font-medium text-foreground whitespace-nowrap">
                        {p.first_name} {p.last_name}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground max-w-[14rem] truncate" title={p.email}>
                        {p.email}
                      </td>
                      <td className="px-3 py-3">
                        <select
                          className="w-full max-w-[10.5rem] px-2 py-1.5 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                          value={roleOk ? p.role : "enseignant"}
                          disabled={busy || isSelf}
                          title={isSelf ? "Vous ne pouvez pas modifier votre propre rôle ici" : undefined}
                          onChange={(e) => void handleRoleChange(p, e.target)}
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABEL_FR[r]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          className="w-full max-w-[8.5rem] px-2 py-1.5 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                          value={(STATUS_OPTIONS as readonly string[]).includes(p.status) ? p.status : "active"}
                          disabled={busy || isSelf}
                          title={isSelf ? "Utilisez un autre compte super admin pour modifier votre statut" : undefined}
                          onChange={(e) => void handleStatusChange(p, e.target)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL_FR[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          disabled={busy || isSelf}
                          title={isSelf ? "Impossible de supprimer votre propre compte" : "Supprimer le compte"}
                          onClick={() => handleDelete(p)}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-danger hover:bg-danger/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden />
                          <span className="sr-only">Supprimer</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
