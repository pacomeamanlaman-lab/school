-- ============================================
-- RLS « dev » : tout utilisateur `authenticated` peut lire/écrire les tables métier
-- ============================================
-- À exécuter une fois dans le SQL Editor si le comptable / surveillant / etc. voient
-- des listes vides alors que le seed a bien été appliqué (conflit avec d’anciennes policies).
-- Idempotent : supprime puis recrée une policy par table listée.
--
-- Production : supprimer ces policies et les remplacer par des règles par rôle / établissement.

DO $rls$
DECLARE
  t text;
  pol text;
  tables text[] := ARRAY[
    'absences',
    'annees_scolaires',
    'classes',
    'emplois_du_temps',
    'frais_scolaires',
    'matieres',
    'notes',
    'paiements',
    'parents',
    'profiles',
    'staff',
    'student_parents',
    'students',
    'trimestres'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    pol := 'school_dev_' || t;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      pol,
      t
    );
  END LOOP;
END
$rls$;

SELECT 'RLS dev appliqué sur les tables métier (authenticated).' AS message;
