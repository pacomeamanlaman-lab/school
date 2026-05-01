"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Mail, Phone, Edit, Trash2, Eye, BookOpen, School, UserCheck } from "lucide-react";
import FlashNotice from "@/components/FlashNotice";
import { useFlashNotice } from "@/hooks/useFlashNotice";
import { createClient } from "@/lib/supabase/client";
import { embedOne } from "@/lib/supabase/embed";
import AddStaffModal, { type LinkableProfileOption } from "@/components/AddStaffModal";

type StaffRow = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  matiere: string;
  classe: string;
  email: string;
  phone: string;
  status: string;
  userId: string;
  profileRole: string;
  profileStatus: string;
  matiereId: string;
  classeId: string;
  dateEmbauche: string;
  adresseStaff: string;
};

function roleLabelFromProfile(role: string): string {
  if (role === "enseignant") return "Enseignant";
  if (role === "admin" || role === "super_admin") return "Administration";
  if (role === "secretaire") return "Secrétaire";
  if (role === "comptable") return "Comptable";
  if (role === "surveillant") return "Surveillant";
  if (role === "parent") return "Parent";
  return role;
}

function statusLabelFromProfile(status: string): string {
  if (status === "active") return "Actif";
  if (status === "inactive") return "Inactif";
  if (status === "suspended") return "Suspendu";
  return status;
}

export default function StaffPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [linkableProfiles, setLinkableProfiles] = useState<LinkableProfileOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffRow | null>(null);
  const { notice, flash } = useFlashNotice();

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    setError(null);
    try {
      const { data, error: e1 } = await supabase.from("staff").select(`
          id,
          user_id,
          matiere_id,
          classe_id,
          date_embauche,
          adresse,
          profiles ( first_name, last_name, email, phone, role, status ),
          matieres ( nom ),
          classes ( name )
        `);
      if (e1) throw e1;

      const usedUserIds = new Set(
        (data ?? []).map((r) => (r as { user_id?: string }).user_id).filter(Boolean) as string[]
      );

      const { data: profs, error: e2 } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone, role")
        .in("role", ["enseignant", "admin", "super_admin", "secretaire", "comptable", "surveillant"]);
      if (e2) throw e2;

      const linkable = (profs ?? [])
        .filter((p) => !usedUserIds.has(p.id as string))
        .map((p) => ({
          id: p.id as string,
          first_name: p.first_name as string,
          last_name: p.last_name as string,
          email: (p.email as string) ?? "",
          phone: (p.phone as string | null) ?? null,
          role: p.role as string,
        }));
      setLinkableProfiles(linkable);

      const rows: StaffRow[] = (data ?? []).map((r) => {
        const p = embedOne<{
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          role: string;
          status: string;
        }>((r as { profiles?: unknown }).profiles);
        const m = embedOne<{ nom: string }>((r as { matieres?: unknown }).matieres);
        const c = embedOne<{ name: string }>((r as { classes?: unknown }).classes);
        const raw = r as {
          user_id?: string;
          matiere_id?: string | null;
          classe_id?: string | null;
          date_embauche?: string | null;
          adresse?: string | null;
        };
        return {
          id: r.id as string,
          userId: (raw.user_id as string) ?? "",
          profileRole: p?.role ?? "enseignant",
          profileStatus: p?.status ?? "active",
          matiereId: (raw.matiere_id as string) ?? "",
          classeId: (raw.classe_id as string) ?? "",
          dateEmbauche: (raw.date_embauche as string) ?? "",
          adresseStaff: (raw.adresse as string) ?? "",
          firstName: p?.first_name ?? "—",
          lastName: p?.last_name ?? "—",
          role: p ? roleLabelFromProfile(p.role) : "—",
          matiere: m?.nom ?? "—",
          classe: c?.name ?? "—",
          email: p?.email ?? "—",
          phone: p?.phone ?? "—",
          status: statusLabelFromProfile(p?.status ?? "active"),
        };
      });
      setStaff(rows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
      setStaff([]);
      setLinkableProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const roleOptionsFromData = useMemo(() => {
    const set = new Set(staff.map((s) => s.role).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [staff]);

  const filteredStaff = useMemo(() => {
    return staff.filter((person) => {
      const matchSearch =
        person.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = selectedRole === "all" || person.role === selectedRole;
      return matchSearch && matchRole;
    });
  }, [staff, searchTerm, selectedRole]);

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Supprimer cette fiche staff ?")) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("staff").delete().eq("id", id);
    if (err) {
      flash(err.message, "error");
      return;
    }
    await load();
    flash("Fiche personnel supprimée.", "success");
  };

  const staffModalStaffProp = editingStaff
    ? {
        id: editingStaff.id,
        userId: editingStaff.userId,
        firstName: editingStaff.firstName,
        lastName: editingStaff.lastName,
        email: editingStaff.email,
        phone: editingStaff.phone,
        profileRole: editingStaff.profileRole,
        profileStatus: editingStaff.profileStatus,
        matiereId: editingStaff.matiereId,
        classeId: editingStaff.classeId,
        dateEmbauche: editingStaff.dateEmbauche,
        adresse: editingStaff.adresseStaff,
      }
    : undefined;

  const handleSaveStaff = async (payload: Record<string, unknown>) => {
    const supabase = createClient();
    if (editingStaff) {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          first_name: String(payload.firstName ?? ""),
          last_name: String(payload.lastName ?? ""),
          email: String(payload.email ?? ""),
          phone: String(payload.phone ?? "").trim() || null,
          role: payload.role as string,
          status: payload.statut as string,
        })
        .eq("id", editingStaff.userId);
      if (pErr) {
        flash(pErr.message, "error");
        return false;
      }
      const { error: sErr } = await supabase
        .from("staff")
        .update({
          adresse: String(payload.adresse ?? "").trim() || null,
          date_embauche: String(payload.dateEmbauche ?? "").trim() || null,
          matiere_id: payload.role === "enseignant" && payload.matiereId ? (payload.matiereId as string) : null,
          classe_id: payload.role === "enseignant" && payload.classeId ? (payload.classeId as string) : null,
        })
        .eq("id", editingStaff.id);
      if (sErr) {
        flash(sErr.message, "error");
        return false;
      }
      flash("Fiche personnel mise à jour.", "success");
    } else {
      const uid = String(payload.linkProfileId ?? "").trim();
      if (!uid) {
        flash("Choisissez un profil utilisateur.", "error");
        return false;
      }
      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          first_name: String(payload.firstName ?? ""),
          last_name: String(payload.lastName ?? ""),
          email: String(payload.email ?? ""),
          phone: String(payload.phone ?? "").trim() || null,
          role: payload.role as string,
          status: payload.statut as string,
        })
        .eq("id", uid);
      if (pErr) {
        flash(pErr.message, "error");
        return false;
      }
      const { error: sErr } = await supabase.from("staff").insert({
        user_id: uid,
        adresse: String(payload.adresse ?? "").trim() || null,
        date_embauche: String(payload.dateEmbauche ?? "").trim() || null,
        matiere_id: payload.role === "enseignant" && payload.matiereId ? (payload.matiereId as string) : null,
        classe_id: payload.role === "enseignant" && payload.classeId ? (payload.classeId as string) : null,
      });
      if (sErr) {
        flash(sErr.message, "error");
        return false;
      }
      flash("Fiche personnel ajoutée.", "success");
    }
    setStaffModalOpen(false);
    setEditingStaff(null);
    await load();
    return;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Administration":
        return "bg-danger/10 text-danger";
      case "Enseignant":
        return "bg-primary/10 text-primary";
      case "Secrétaire":
        return "bg-info/10 text-info";
      case "Comptable":
        return "bg-amber-500/10 text-amber-800 dark:text-amber-200";
      case "Surveillant":
        return "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <FlashNotice payload={notice} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion du personnel</h1>
          <p className="text-muted-foreground">Table staff + profils Supabase</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingStaff(null);
            setStaffModalOpen(true);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Ajouter
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              value={roleOptionsFromData.includes(selectedRole) || selectedRole === "all" ? selectedRole : "all"}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="all">Tous les rôles</option>
              {roleOptionsFromData.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-foreground mt-1">{loading ? "…" : staff.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Enseignants</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {loading ? "…" : staff.filter((s) => s.role === "Enseignant").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Administration</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {loading ? "…" : staff.filter((s) => s.role === "Administration").length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Secrétariat / compta. / vie scolaire</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {loading
              ? "…"
              : staff.filter((s) => ["Secrétaire", "Comptable", "Surveillant"].includes(s.role)).length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Résultats</p>
          <p className="text-2xl font-bold text-foreground mt-1">{filteredStaff.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : (
          filteredStaff.map((person) => (
            <div key={person.id} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-xl">
                    {person.firstName[0]}
                    {person.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground">
                    {person.firstName} {person.lastName}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold mt-1 ${getRoleBadgeColor(person.role)}`}
                  >
                    {person.role}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {person.matiere !== "—" && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Matière</p>
                      <p className="text-sm font-medium text-foreground">{person.matiere}</p>
                    </div>
                  </div>
                )}
                {person.classe !== "—" && (
                  <div className="flex items-start gap-3">
                    <School className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Classe</p>
                      <p className="text-sm font-medium text-foreground">{person.classe}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-foreground truncate">{person.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="text-sm font-medium text-foreground">{person.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Statut (profil)</p>
                    <p className="text-sm font-medium text-foreground">{person.status}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/staff/${person.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-background hover:bg-accent border border-input rounded-lg transition text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Voir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingStaff(person);
                    setStaffModalOpen(true);
                  }}
                  className="p-2 border border-input rounded-lg hover:bg-accent transition"
                  title="Modifier"
                >
                  <Edit className="w-4 h-4 text-primary" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteStaff(person.id)}
                  className="flex items-center justify-center p-2 hover:bg-accent border border-input rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4 text-danger" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && filteredStaff.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
          Aucun membre trouvé.
        </div>
      )}

      <AddStaffModal
        isOpen={staffModalOpen}
        onClose={() => {
          setStaffModalOpen(false);
          setEditingStaff(null);
        }}
        onSubmit={async (d) => handleSaveStaff(d as Record<string, unknown>)}
        staff={staffModalStaffProp}
        linkableProfiles={linkableProfiles}
      />
    </div>
  );
}
