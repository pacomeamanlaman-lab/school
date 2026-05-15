import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UtilisateursManager, { type UtilisateurRow } from "./UtilisateursManager";

export default async function UtilisateursPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "super_admin") redirect("/dashboard");

  const { data: rows, error } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, role, status, phone, created_at")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  const initialProfiles: UtilisateurRow[] = (rows ?? []).map((r) => ({
    id: r.id as string,
    email: (r.email as string) ?? "",
    first_name: (r.first_name as string) ?? "",
    last_name: (r.last_name as string) ?? "",
    role: (r.role as string) ?? "",
    status: (r.status as string) ?? "",
    phone: (r.phone as string | null) ?? null,
    created_at: (r.created_at as string) ?? "",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestion des utilisateurs</h1>
        <p className="text-muted-foreground mt-1">
          Création des comptes (mot de passe temporaire) et liste des profils — réservé au super administrateur.
        </p>
      </div>
      <UtilisateursManager initialProfiles={initialProfiles} loadError={error?.message ?? null} />
    </div>
  );
}
