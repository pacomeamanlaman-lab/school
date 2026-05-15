import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

type ProfileRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type ProfileStatus = Database["public"]["Tables"]["profiles"]["Row"]["status"];

const ROLES: readonly ProfileRole[] = [
  "super_admin",
  "admin",
  "enseignant",
  "secretaire",
  "comptable",
  "surveillant",
  "parent",
  "eleve",
];

const STATUSES: readonly ProfileStatus[] = ["active", "inactive", "suspended"];

function isProfileRole(v: unknown): v is ProfileRole {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}

function isProfileStatus(v: unknown): v is ProfileStatus {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: uErr,
  } = await supabase.auth.getUser();
  if (uErr || !user) {
    return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) };
  }
  const { data: me, error: mErr } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (mErr || me?.role !== "super_admin") {
    return { error: NextResponse.json({ error: "Accès réservé au super administrateur." }, { status: 403 }) };
  }
  return { user };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return auth.error;

    const { id } = await context.params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
    }

    const roleIn = (body as { role?: unknown }).role;
    const statusIn = (body as { status?: unknown }).status;

    if (roleIn === undefined && statusIn === undefined) {
      return NextResponse.json({ error: "Aucun champ à mettre à jour." }, { status: 400 });
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Configuration serveur.";
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    const { data: target, error: tErr } = await admin.from("profiles").select("id, role").eq("id", id).maybeSingle();
    if (tErr || !target) {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }

    const currentRole = target.role as ProfileRole;

    if (id === auth.user.id) {
      if (roleIn !== undefined && isProfileRole(roleIn) && roleIn !== currentRole) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas modifier votre propre rôle depuis cette page." },
          { status: 400 }
        );
      }
      if (statusIn !== undefined && isProfileStatus(statusIn) && statusIn !== "active") {
        return NextResponse.json(
          { error: "Vous ne pouvez pas désactiver ou suspendre votre propre compte ici." },
          { status: 400 }
        );
      }
    }

    const updates: Partial<{ role: ProfileRole; status: ProfileStatus }> = {};

    if (roleIn !== undefined) {
      if (!isProfileRole(roleIn)) {
        return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
      }
      if (currentRole === "super_admin" && roleIn !== "super_admin") {
        const { data: otherSupers } = await admin.from("profiles").select("id").eq("role", "super_admin").neq("id", id);
        if (!otherSupers?.length) {
          return NextResponse.json(
            { error: "Impossible de retirer le dernier super administrateur." },
            { status: 400 }
          );
        }
      }
      updates.role = roleIn;
    }

    if (statusIn !== undefined) {
      if (!isProfileStatus(statusIn)) {
        return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
      }
      updates.status = statusIn;
    }

    const { error: upErr } = await admin.from("profiles").update(updates).eq("id", id);
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur serveur.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return auth.error;

    const { id } = await context.params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    }

    if (id === auth.user.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 });
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Configuration serveur.";
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    const { data: target, error: tErr } = await admin.from("profiles").select("id, role").eq("id", id).maybeSingle();
    if (tErr || !target) {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }

    if ((target.role as string) === "super_admin") {
      const { data: supers } = await admin.from("profiles").select("id").eq("role", "super_admin");
      if ((supers?.length ?? 0) <= 1) {
        return NextResponse.json(
          { error: "Impossible de supprimer le dernier super administrateur." },
          { status: 400 }
        );
      }
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(id);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur serveur.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
