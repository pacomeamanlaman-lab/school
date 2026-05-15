import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function validateNewPassword(pw: string): string | null {
  if (pw.length < 8) return "Le nouveau mot de passe doit contenir au moins 8 caractères.";
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

    let admin;
    try {
      admin = createAdminClient();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Configuration serveur.";
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    const { data: authUser, error: getErr } = await admin.auth.admin.getUserById(user.id);
    if (getErr || !authUser.user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 400 });
    }

    const meta = authUser.user.app_metadata as Record<string, unknown> | undefined;
    if (meta?.must_change_password !== true) {
      return NextResponse.json({ error: "Aucun changement de mot de passe obligatoire pour ce compte." }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
    }

    const password =
      typeof (body as { password?: unknown }).password === "string" ? (body as { password: string }).password : "";
    const password_confirm =
      typeof (body as { password_confirm?: unknown }).password_confirm === "string"
        ? (body as { password_confirm: string }).password_confirm
        : "";

    const pwErr = validateNewPassword(password);
    if (pwErr) {
      return NextResponse.json({ error: pwErr }, { status: 400 });
    }
    if (password !== password_confirm) {
      return NextResponse.json({ error: "Les mots de passe ne correspondent pas." }, { status: 400 });
    }

    const raw = authUser.user.app_metadata;
    const nextMeta =
      typeof raw === "object" && raw !== null && !Array.isArray(raw)
        ? { ...raw, must_change_password: false }
        : { must_change_password: false };

    const { error: updErr } = await admin.auth.admin.updateUserById(user.id, {
      password,
      app_metadata: nextMeta,
    });

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur serveur.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
