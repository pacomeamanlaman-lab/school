-- ============================================
-- SCRIPT DE SEED - DONNÉES DE TEST
-- ============================================
-- Idempotent : ré-exécution sans erreur 23505 (clés déjà présentes).
-- Pour repartir de zéro : exécuter supabase-reset.sql puis ce script.
-- Comptes de test (même mot de passe pour les 4) : SchoolSeed2024!
-- Les id correspondent aux lignes profiles / staff du seed.
-- Si le projet a déjà des utilisateurs Auth, instance_id est repris du premier.

-- 0. AUTH.USERS + IDENTITIES (obligatoire : profiles.id → auth.users.id)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Colonnes optionnelles (idempotent si le schéma existe déjà)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS adresse text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS piece_naissance text;

ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS site_web text;
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE matieres ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Établissements : RLS lecture + mise à jour pour les comptes connectés (évite UPDATE « silencieux » 0 ligne)
ALTER TABLE public.etablissements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "etablissements_select_auth" ON public.etablissements;
DROP POLICY IF EXISTS "etablissements_update_auth" ON public.etablissements;
CREATE POLICY "etablissements_select_auth" ON public.etablissements FOR SELECT TO authenticated USING (true);
CREATE POLICY "etablissements_update_auth" ON public.etablissements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Documents élèves (métadonnées + chemin Storage) + bucket privé
CREATE TABLE IF NOT EXISTS public.documents_eleves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  type_document text NOT NULL,
  nom_fichier text NOT NULL,
  storage_path text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS documents_eleves_student_idx ON public.documents_eleves (student_id);
ALTER TABLE public.documents_eleves ADD COLUMN IF NOT EXISTS storage_path text;
-- Schémas distants : colonnes exigées par certaines instances
ALTER TABLE public.documents_eleves ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public.documents_eleves ADD COLUMN IF NOT EXISTS uploaded_by uuid;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
SELECT 'student-documents', 'student-documents', false, 5242880
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'student-documents');

DROP POLICY IF EXISTS "student_documents_insert" ON storage.objects;
DROP POLICY IF EXISTS "student_documents_select" ON storage.objects;
CREATE POLICY "student_documents_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-documents');
CREATE POLICY "student_documents_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-documents');

ALTER TABLE public.documents_eleves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents_eleves_all" ON public.documents_eleves;
CREATE POLICY "documents_eleves_all" ON public.documents_eleves FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  COALESCE((SELECT instance_id FROM auth.users LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid),
  u.id,
  'authenticated',
  'authenticated',
  u.email,
  crypt('SchoolSeed2024!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
FROM (VALUES
  ('aaaabbbb-cccc-dddd-eeee-111111111111'::uuid, 'admin@etoiles.edu.ci'),
  ('aaaabbbb-cccc-dddd-eeee-222222222222'::uuid, 'j.kouame@etoiles.edu.ci'),
  ('aaaabbbb-cccc-dddd-eeee-333333333333'::uuid, 'f.diallo@etoiles.edu.ci'),
  ('aaaabbbb-cccc-dddd-eeee-444444444444'::uuid, 'k.yao@etoiles.edu.ci')
) AS u(id, email)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM (VALUES
  ('aaaabbbb-cccc-dddd-eeee-111111111111'::uuid, 'admin@etoiles.edu.ci'),
  ('aaaabbbb-cccc-dddd-eeee-222222222222'::uuid, 'j.kouame@etoiles.edu.ci'),
  ('aaaabbbb-cccc-dddd-eeee-333333333333'::uuid, 'f.diallo@etoiles.edu.ci'),
  ('aaaabbbb-cccc-dddd-eeee-444444444444'::uuid, 'k.yao@etoiles.edu.ci')
) AS u(id, email)
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
);

-- 1. ÉTABLISSEMENT (ré-exécution sans erreur si la ligne existe déjà)
INSERT INTO etablissements (id, nom, adresse, ville, code_postal, telephone, email, directeur, logo_url)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'École Primaire Les Étoiles', '123 Rue de la Paix', 'Abidjan', '00225', '+225 27 20 30 40 50', 'contact@etoiles.edu.ci', 'M. Jean-Baptiste KOUASSI', null)
ON CONFLICT (id) DO NOTHING;

-- 2. ANNÉE SCOLAIRE
INSERT INTO annees_scolaires (id, etablissement_id, annee, date_debut, date_fin, is_active)
VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '2024-2025', '2024-09-01', '2025-06-30', true)
ON CONFLICT (id) DO NOTHING;

-- 3. TRIMESTRES
INSERT INTO trimestres (id, annee_scolaire_id, nom, numero, date_debut, date_fin)
VALUES
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Trimestre 1', 1, '2024-09-01', '2024-12-15'),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Trimestre 2', 2, '2025-01-05', '2025-03-20'),
  ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'Trimestre 3', 3, '2025-03-25', '2025-06-30')
ON CONFLICT (id) DO NOTHING;

-- 4. MATIÈRES
INSERT INTO matieres (id, etablissement_id, nom, coefficient, couleur)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Mathématiques', 3, '#3b82f6'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Français', 3, '#ef4444'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Sciences', 2, '#10b981'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'Histoire-Géographie', 2, '#f59e0b'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'Anglais', 2, '#8b5cf6'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111', 'EPS', 1, '#06b6d4')
ON CONFLICT (id) DO NOTHING;

-- 5. PROFILS UTILISATEURS (mêmes id que section 0 — auth.users)
-- Si `profiles.role` est un ENUM PostgreSQL (colonne de ce type), utiliser ALTER TYPE … ADD VALUE au lieu du CHECK ci-dessous.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (
  role IN (
    'super_admin',
    'admin',
    'enseignant',
    'secretaire',
    'comptable',
    'surveillant',
    'parent',
    'eleve'
  )
);

-- Admin
INSERT INTO profiles (id, role, first_name, last_name, email, phone, status)
VALUES
  ('aaaabbbb-cccc-dddd-eeee-111111111111', 'admin', 'Marie', 'KOFFI', 'admin@etoiles.edu.ci', '+225 07 12 34 56 78', 'active')
ON CONFLICT (id) DO NOTHING;

-- Enseignants
INSERT INTO profiles (id, role, first_name, last_name, email, phone, status)
VALUES
  ('aaaabbbb-cccc-dddd-eeee-222222222222', 'enseignant', 'Jean', 'KOUAME', 'j.kouame@etoiles.edu.ci', '+225 07 23 45 67 89', 'active'),
  ('aaaabbbb-cccc-dddd-eeee-333333333333', 'enseignant', 'Fatou', 'DIALLO', 'f.diallo@etoiles.edu.ci', '+225 07 34 56 78 90', 'active'),
  ('aaaabbbb-cccc-dddd-eeee-444444444444', 'enseignant', 'Kofi', 'YAO', 'k.yao@etoiles.edu.ci', '+225 07 45 67 89 01', 'active')
ON CONFLICT (id) DO NOTHING;

-- 6. STAFF (Personnel) — classe titulaire optionnelle
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS classe_id uuid REFERENCES public.classes (id);

INSERT INTO staff (id, user_id, matiere_id, date_embauche, adresse)
VALUES
  ('66666666-6666-6666-6666-666666666666', 'aaaabbbb-cccc-dddd-eeee-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2020-09-01', 'Cocody, Abidjan'),
  ('77777777-7777-7777-7777-777777777777', 'aaaabbbb-cccc-dddd-eeee-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2019-09-01', 'Plateau, Abidjan'),
  ('88888888-8888-8888-8888-888888888888', 'aaaabbbb-cccc-dddd-eeee-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2021-09-01', 'Yopougon, Abidjan')
ON CONFLICT (id) DO NOTHING;

-- 7. CLASSES
INSERT INTO classes (id, etablissement_id, annee_scolaire_id, name, niveau, capacite, salle, titulaire_id, status)
VALUES
  ('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'CP - Classe A', 'CP', 30, 'Salle 101', 'aaaabbbb-cccc-dddd-eeee-222222222222', 'active'),
  ('aaaaaaaa-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'CE1 - Classe A', 'CE1', 30, 'Salle 102', 'aaaabbbb-cccc-dddd-eeee-333333333333', 'active'),
  ('bbbbbbbb-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'CM2 - Classe A', 'CM2', 30, 'Salle 201', 'aaaabbbb-cccc-dddd-eeee-444444444444', 'active'),
  ('cccccccc-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '6ème - Classe A', '6ème', 35, 'Salle 301', null, 'active')
ON CONFLICT (id) DO NOTHING;

-- 8. ÉLÈVES
INSERT INTO students (id, matricule, first_name, last_name, date_naissance, lieu_naissance, genre, classe_id, status, groupe_sanguin, maladies_particulieres)
VALUES
  ('01010101-0101-4101-8101-000000000001', 'EL2024001', 'Aya', 'KOUASSI', '2017-03-15', 'Abidjan', 'F', '99999999-9999-9999-9999-999999999999', 'active', 'A+', 'Asthme léger'),
  ('01010101-0102-4102-8102-000000000002', 'EL2024002', 'Mamadou', 'TOURE', '2017-07-22', 'Bouaké', 'M', '99999999-9999-9999-9999-999999999999', 'active', 'O+', null),
  ('01010101-0103-4103-8103-000000000003', 'EL2024003', 'Aminata', 'TRAORE', '2016-11-08', 'Abidjan', 'F', 'aaaaaaaa-9999-9999-9999-999999999999', 'active', 'B+', 'Allergie aux arachides'),
  ('01010101-0104-4104-8104-000000000004', 'EL2024004', 'Kofi', 'MENSAH', '2016-05-19', 'Yamoussoukro', 'M', 'aaaaaaaa-9999-9999-9999-999999999999', 'active', 'AB+', null),
  ('01010101-0105-4105-8105-000000000005', 'EL2024005', 'Fatoumata', 'CISSE', '2014-09-12', 'Abidjan', 'F', 'bbbbbbbb-9999-9999-9999-999999999999', 'active', 'O-', 'Diabète type 1'),
  ('01010101-0106-4106-8106-000000000006', 'EL2024006', 'Ibrahim', 'KONE', '2014-01-25', 'Korhogo', 'M', 'bbbbbbbb-9999-9999-9999-999999999999', 'active', 'A-', null),
  ('01010101-0107-4107-8107-000000000007', 'EL2024007', 'Mariam', 'COULIBALY', '2013-06-10', 'Abidjan', 'F', 'cccccccc-9999-9999-9999-999999999999', 'active', 'B-', null),
  ('01010101-0108-4108-8108-000000000008', 'EL2024008', 'Yao', 'N''GUESSAN', '2013-12-03', 'San Pedro', 'M', 'cccccccc-9999-9999-9999-999999999999', 'active', 'O+', null)
ON CONFLICT (id) DO NOTHING;

-- 9. PARENTS
INSERT INTO parents (id, nom, telephone, telephone_secondaire, email, adresse, profession)
VALUES
  ('02020202-0201-4201-8201-000000000001', 'Monsieur KOUASSI', '+225 07 11 22 33 44', '+225 07 99 88 77 66', 'kouassi@email.com', 'Cocody, Abidjan', 'Ingénieur'),
  ('02020202-0202-4202-8202-000000000002', 'Madame KOUASSI', '+225 07 22 33 44 55', null, 'mme.kouassi@email.com', 'Cocody, Abidjan', 'Enseignante'),
  ('02020202-0203-4203-8203-000000000003', 'Monsieur TOURE', '+225 07 33 44 55 66', '+225 07 88 77 66 55', null, 'Yopougon, Abidjan', 'Commerçant'),
  ('02020202-0204-4204-8204-000000000004', 'Madame TRAORE', '+225 07 44 55 66 77', null, 'traore@email.com', 'Plateau, Abidjan', 'Médecin'),
  ('02020202-0205-4205-8205-000000000005', 'Monsieur MENSAH', '+225 07 55 66 77 88', '+225 07 77 66 55 44', null, 'Marcory, Abidjan', 'Fonctionnaire')
ON CONFLICT (id) DO NOTHING;

-- 10. RELATION ÉLÈVES-PARENTS (pas d’id : évite doublons si contrainte unique ou PK composite)
INSERT INTO student_parents (student_id, parent_id, relation_type)
SELECT v.student_id, v.parent_id, v.relation_type
FROM (VALUES
  ('01010101-0101-4101-8101-000000000001'::uuid, '02020202-0201-4201-8201-000000000001'::uuid, 'père'),
  ('01010101-0101-4101-8101-000000000001'::uuid, '02020202-0202-4202-8202-000000000002'::uuid, 'mère'),
  ('01010101-0102-4102-8102-000000000002'::uuid, '02020202-0203-4203-8203-000000000003'::uuid, 'père'),
  ('01010101-0103-4103-8103-000000000003'::uuid, '02020202-0204-4204-8204-000000000004'::uuid, 'mère'),
  ('01010101-0104-4104-8104-000000000004'::uuid, '02020202-0205-4205-8205-000000000005'::uuid, 'père')
) AS v(student_id, parent_id, relation_type)
WHERE NOT EXISTS (
  SELECT 1 FROM student_parents sp
  WHERE sp.student_id = v.student_id AND sp.parent_id = v.parent_id
);

-- 11. FRAIS SCOLAIRES (une ligne par élève + année si déjà présente → ignorée)
INSERT INTO frais_scolaires (student_id, annee_scolaire_id, montant_total, montant_paye, statut_paiement, date_limite)
SELECT v.student_id, v.annee_scolaire_id, v.montant_total, v.montant_paye, v.statut_paiement, v.date_limite::date
FROM (VALUES
  ('01010101-0101-4101-8101-000000000001'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 45000, 45000, 'paye', '2024-12-31'),
  ('01010101-0102-4102-8102-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 45000, 22500, 'partiel', '2024-12-31'),
  ('01010101-0103-4103-8103-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 50000, 50000, 'paye', '2024-12-31'),
  ('01010101-0104-4104-8104-000000000004'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 50000, 0, 'impaye', '2024-12-31'),
  ('01010101-0105-4105-8105-000000000005'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 75000, 50000, 'partiel', '2024-12-31'),
  ('01010101-0106-4106-8106-000000000006'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 75000, 75000, 'paye', '2024-12-31'),
  ('01010101-0107-4107-8107-000000000007'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 100000, 100000, 'paye', '2024-12-31'),
  ('01010101-0108-4108-8108-000000000008'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 100000, 30000, 'partiel', '2024-12-31')
) AS v(student_id, annee_scolaire_id, montant_total, montant_paye, statut_paiement, date_limite)
WHERE NOT EXISTS (
  SELECT 1 FROM frais_scolaires f
  WHERE f.student_id = v.student_id AND f.annee_scolaire_id = v.annee_scolaire_id
);

-- 12. PAIEMENTS (numéro de reçu unique → pas de doublon au re-seed)
INSERT INTO paiements (frais_scolaire_id, montant, date_paiement, mode_paiement, numero_recu, created_by)
SELECT f.id, v.montant, v.date_paiement::date, v.mode_paiement, v.numero_recu, v.created_by
FROM (VALUES
  ('01010101-0101-4101-8101-000000000001'::uuid, 45000, '2024-09-05', 'virement', 'REC-2024-001', 'aaaabbbb-cccc-dddd-eeee-111111111111'::uuid),
  ('01010101-0102-4102-8102-000000000002'::uuid, 22500, '2024-09-10', 'especes', 'REC-2024-002', 'aaaabbbb-cccc-dddd-eeee-111111111111'::uuid),
  ('01010101-0103-4103-8103-000000000003'::uuid, 50000, '2024-09-01', 'mobile_money', 'REC-2024-003', 'aaaabbbb-cccc-dddd-eeee-111111111111'::uuid),
  ('01010101-0105-4105-8105-000000000005'::uuid, 30000, '2024-09-15', 'cheque', 'REC-2024-004', 'aaaabbbb-cccc-dddd-eeee-111111111111'::uuid),
  ('01010101-0105-4105-8105-000000000005'::uuid, 20000, '2024-10-15', 'especes', 'REC-2024-005', 'aaaabbbb-cccc-dddd-eeee-111111111111'::uuid)
) AS v(student_id, montant, date_paiement, mode_paiement, numero_recu, created_by)
JOIN frais_scolaires f
  ON f.student_id = v.student_id AND f.annee_scolaire_id = '22222222-2222-2222-2222-222222222222'::uuid
WHERE NOT EXISTS (SELECT 1 FROM paiements p WHERE p.numero_recu = v.numero_recu);

-- 13. NOTES (Trimestre 1)
INSERT INTO notes (student_id, matiere_id, trimestre_id, classe_id, note, appreciation, created_by)
SELECT v.student_id, v.matiere_id, v.trimestre_id, v.classe_id, v.note, v.appreciation, v.created_by
FROM (VALUES
  ('01010101-0101-4101-8101-000000000001'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, '99999999-9999-9999-9999-999999999999'::uuid, 16.5, 'Très bon travail', 'aaaabbbb-cccc-dddd-eeee-222222222222'::uuid),
  ('01010101-0101-4101-8101-000000000001'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, '99999999-9999-9999-9999-999999999999'::uuid, 15.0, 'Bien', 'aaaabbbb-cccc-dddd-eeee-222222222222'::uuid),
  ('01010101-0102-4102-8102-000000000002'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, '99999999-9999-9999-9999-999999999999'::uuid, 14.0, 'Assez bien', 'aaaabbbb-cccc-dddd-eeee-222222222222'::uuid),
  ('01010101-0102-4102-8102-000000000002'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, '99999999-9999-9999-9999-999999999999'::uuid, 13.5, 'Peut mieux faire', 'aaaabbbb-cccc-dddd-eeee-222222222222'::uuid),
  ('01010101-0105-4105-8105-000000000005'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'bbbbbbbb-9999-9999-9999-999999999999'::uuid, 18.0, 'Excellent', 'aaaabbbb-cccc-dddd-eeee-444444444444'::uuid),
  ('01010101-0105-4105-8105-000000000005'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'bbbbbbbb-9999-9999-9999-999999999999'::uuid, 17.5, 'Excellent travail', 'aaaabbbb-cccc-dddd-eeee-444444444444'::uuid),
  ('01010101-0105-4105-8105-000000000005'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'bbbbbbbb-9999-9999-9999-999999999999'::uuid, 16.0, 'Très bien', 'aaaabbbb-cccc-dddd-eeee-444444444444'::uuid)
) AS v(student_id, matiere_id, trimestre_id, classe_id, note, appreciation, created_by)
WHERE NOT EXISTS (
  SELECT 1 FROM notes n
  WHERE n.student_id = v.student_id AND n.matiere_id = v.matiere_id AND n.trimestre_id = v.trimestre_id AND n.classe_id = v.classe_id
);

-- 14. ABSENCES
INSERT INTO absences (student_id, classe_id, date, statut, motif, justifiee, created_by)
SELECT v.student_id, v.classe_id, v.date::date, v.statut, v.motif, v.justifiee, v.created_by
FROM (VALUES
  ('01010101-0101-4101-8101-000000000001'::uuid, '99999999-9999-9999-9999-999999999999'::uuid, '2024-11-15', 'absent', 'Maladie'::text, true, 'aaaabbbb-cccc-dddd-eeee-222222222222'::uuid),
  ('01010101-0102-4102-8102-000000000002'::uuid, '99999999-9999-9999-9999-999999999999'::uuid, '2024-11-20', 'retard', null::text, false, 'aaaabbbb-cccc-dddd-eeee-222222222222'::uuid),
  ('01010101-0105-4105-8105-000000000005'::uuid, 'bbbbbbbb-9999-9999-9999-999999999999'::uuid, '2024-11-10', 'absent', 'Rendez-vous médical'::text, true, 'aaaabbbb-cccc-dddd-eeee-444444444444'::uuid)
) AS v(student_id, classe_id, date, statut, motif, justifiee, created_by)
WHERE NOT EXISTS (
  SELECT 1 FROM absences a
  WHERE a.student_id = v.student_id AND a.classe_id = v.classe_id AND a.date = v.date::date
);

-- 15. EMPLOIS DU TEMPS
INSERT INTO emplois_du_temps (classe_id, matiere_id, enseignant_id, jour, heure_debut, heure_fin)
SELECT v.classe_id, v.matiere_id, v.enseignant_id, v.jour, v.heure_debut::time, v.heure_fin::time
FROM (VALUES
  ('99999999-9999-9999-9999-999999999999'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'aaaabbbb-cccc-dddd-eeee-222222222222'::uuid, 'lundi', '08:00', '10:00'),
  ('99999999-9999-9999-9999-999999999999'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'aaaabbbb-cccc-dddd-eeee-222222222222'::uuid, 'lundi', '10:30', '12:00'),
  ('99999999-9999-9999-9999-999999999999'::uuid, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, 'aaaabbbb-cccc-dddd-eeee-222222222222'::uuid, 'mardi', '14:00', '15:30'),
  ('aaaaaaaa-9999-9999-9999-999999999999'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'aaaabbbb-cccc-dddd-eeee-333333333333'::uuid, 'lundi', '08:00', '10:00'),
  ('aaaaaaaa-9999-9999-9999-999999999999'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'aaaabbbb-cccc-dddd-eeee-333333333333'::uuid, 'mardi', '08:00', '10:00'),
  ('bbbbbbbb-9999-9999-9999-999999999999'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'aaaabbbb-cccc-dddd-eeee-444444444444'::uuid, 'lundi', '08:00', '09:30'),
  ('bbbbbbbb-9999-9999-9999-999999999999'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'aaaabbbb-cccc-dddd-eeee-444444444444'::uuid, 'lundi', '10:00', '12:00'),
  ('bbbbbbbb-9999-9999-9999-999999999999'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'aaaabbbb-cccc-dddd-eeee-444444444444'::uuid, 'mardi', '08:00', '10:00')
) AS v(classe_id, matiere_id, enseignant_id, jour, heure_debut, heure_fin)
WHERE NOT EXISTS (
  SELECT 1 FROM emplois_du_temps e
  WHERE e.classe_id = v.classe_id AND e.matiere_id = v.matiere_id AND e.jour = v.jour
    AND e.heure_debut = v.heure_debut::time AND e.heure_fin = v.heure_fin::time
);

-- ---------------------------------------------------------------------------
-- 16. RLS dev sur les tables métier (même contenu que `supabase-rls-permissive-dev.sql`)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Production : resserrer les RLS (ce seed reste volontairement permissif pour le dev).
-- Exemples : policies par `auth.uid()`, par `etablissement_id` joint au profil,
-- lecture `students` limitée aux classes de l’établissement, etc. — à valider avec vos rôles métier.
-- ---------------------------------------------------------------------------

-- Succès !
SELECT 'Données de test insérées avec succès !' as message;
