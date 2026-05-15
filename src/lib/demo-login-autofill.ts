/**
 * Feature flag (client) : préremplissage login/mdp sur la page /login pour les tests / démo.
 * Activer dans `.env.local` : NEXT_PUBLIC_DEMO_LOGIN_AUTOFILL=true
 *
 * Les emails correspondent à `supabase-seed-test-roles.sql`.
 * Le mot de passe doit rester aligné avec ce script (seed test rôles).
 */
export const DEMO_LOGIN_AUTOFILL_ENABLED =
  process.env.NEXT_PUBLIC_DEMO_LOGIN_AUTOFILL === "true";

/** Identique au seed `supabase-seed-test-roles.sql` */
export const DEMO_SEED_PASSWORD = "SchoolSeed2024!";

export type DemoLoginProfileId = "super" | "secretaire" | "comptable" | "surveillant";

export type DemoLoginProfile = {
  id: DemoLoginProfileId;
  email: string;
  label: string;
};

export const DEMO_LOGIN_PROFILES: DemoLoginProfile[] = [
  { id: "super", email: "super@etoiles.edu.ci", label: "Super admin" },
  { id: "secretaire", email: "secretaire@etoiles.edu.ci", label: "Secrétaire" },
  { id: "comptable", email: "comptable@etoiles.edu.ci", label: "Comptable" },
  { id: "surveillant", email: "surveillant@etoiles.edu.ci", label: "Surveillant" },
];

export function getDemoProfileById(id: DemoLoginProfileId): DemoLoginProfile | undefined {
  return DEMO_LOGIN_PROFILES.find((p) => p.id === id);
}
