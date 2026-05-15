import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

type ProfileRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];

const CREATABLE_ROLES: readonly ProfileRole[] = [
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
  return typeof v === "string" && (CREATABLE_ROLES as readonly string[]).includes(v);
}

function validateTempPassword(pw: string): string | null {
  if (pw.length < 8) return "Le mot de passe temporaire doit contenir au moins 8 caractères.";
  if (pw.length > 128) return "Mot de passe trop long.";
  return null;
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
    const temporary_password =
      typeof (body as { temporary_password?: unknown }).temporary_password === "string"
        ? (body as { temporary_password: string }).temporary_password
        : "";
    const temporary_password_confirm =
      typeof (body as { temporary_password_confirm?: unknown }).temporary_password_confirm === "string"
        ? (body as { temporary_password_confirm: string }).temporary_password_confirm
        : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
    }
    if (!first_name || !last_name) {
      return NextResponse.json({ error: "Prénom et nom sont obligatoires." }, { status: 400 });
    }
    if (!isProfileRole(roleRaw)) {
      return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
    }
    const pwErr = validateTempPassword(temporary_password);
    if (pwErr) {
      return NextResponse.json({ error: pwErr }, { status: 400 });
    }
    if (temporary_password !== temporary_password_confirm) {
      return NextResponse.json({ error: "Les deux mots de passe temporaires ne correspondent pas." }, { status: 400 });
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Configuration serveur.";
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: temporary_password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
      },
      app_metadata: {
        must_change_password: true,
      },
    });

    if (createErr) {
      const msg =
        createErr.message?.includes("already been registered") || createErr.message?.includes("already exists")
          ? "Un compte existe déjà avec cet e-mail."
          : createErr.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const uid = created.user?.id;
    if (!uid) {
      return NextResponse.json({ error: "Compte créé mais identifiant utilisateur manquant." }, { status: 500 });
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
      await admin.auth.admin.deleteUser(uid);
      return NextResponse.json(
        { error: `Création du profil impossible : ${profileErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, userId: uid });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur serveur.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
