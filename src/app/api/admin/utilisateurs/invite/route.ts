import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

type ProfileRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];

const INVITABLE_ROLES: readonly ProfileRole[] = [
  "super_admin",
  "admin",
  "enseignant",
  "secretaire",
  "comptable",
  "surveillant",
  "parent",
  "eleve",
];

function isProfileRole(v: unknown): v is ProfileRole {
  return typeof v === "string" && (INVITABLE_ROLES as readonly string[]).includes(v);
}

function siteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { data: me, error: meErr } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (meErr || me?.role !== "super_admin") {
      return NextResponse.json({ error: "Accès réservé au super administrateur." }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
    }

    const email = typeof (body as { email?: unknown }).email === "string" ? (body as { email: string }).email.trim().toLowerCase() : "";
    const first_name =
      typeof (body as { first_name?: unknown }).first_name === "string" ? (body as { first_name: string }).first_name.trim() : "";
    const last_name =
      typeof (body as { last_name?: unknown }).last_name === "string" ? (body as { last_name: string }).last_name.trim() : "";
    const roleRaw = (body as { role?: unknown }).role;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
    }
    if (!first_name || !last_name) {
      return NextResponse.json({ error: "Prénom et nom sont obligatoires." }, { status: 400 });
    }
    if (!isProfileRole(roleRaw)) {
      return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Configuration serveur.";
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    const redirectTo = `${siteOrigin()}/login`;

    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { first_name, last_name },
      redirectTo,
    });

    if (inviteErr) {
      const msg =
        inviteErr.message?.includes("already been registered") || inviteErr.message?.includes("already exists")
          ? "Un compte existe déjà avec cet e-mail."
          : inviteErr.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const uid = invited.user?.id;
    if (!uid) {
      return NextResponse.json({ error: "Invitation créée mais identifiant utilisateur manquant." }, { status: 500 });
    }

    const { error: profileErr } = await admin.from("profiles").upsert(
      {
        id: uid,
        email,
        first_name,
        last_name,
        role: roleRaw,
        status: "active",
        phone: null,
      },
      { onConflict: "id" }
    );

    if (profileErr) {
      return NextResponse.json(
        { error: `Compte invité mais fiche profil : ${profileErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, userId: uid });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur serveur.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
