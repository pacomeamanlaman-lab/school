-- ============================================
-- Comptes de test : super_admin, secretaire, comptable, surveillant
-- ============================================
-- À exécuter dans le SQL Editor Supabase (après `supabase-seed.sql` si besoin).
-- Mot de passe identique au seed principal : SchoolSeed2024!
-- Idempotent : ré-exécution sans erreur si les lignes existent déjà.
-- Si `profiles.role` est un ENUM (type dédié), il faut `ALTER TYPE ... ADD VALUE` au lieu du bloc ci-dessous.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 0) Remplacer le CHECK historique (souvent admin / enseignant / parent / élève seulement)
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

-- 1) auth.users
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
  ('aaaabbbb-cccc-dddd-eeee-555555555551'::uuid, 'super@etoiles.edu.ci'),
  ('aaaabbbb-cccc-dddd-eeee-555555555552'::uuid, 'secretaire@etoiles.edu.ci'),
  ('aaaabbbb-cccc-dddd-eeee-555555555553'::uuid, 'comptable@etoiles.edu.ci'),
  ('aaaabbbb-cccc-dddd-eeee-555555555554'::uuid, 'surveillant@etoiles.edu.ci')
) AS u(id, email)
ON CONFLICT (id) DO NOTHING;

-- 2) auth.identities (connexion email)
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
  ('aaaabbbb-cccc-dddd-eeee-555555555551'::uuid, 'super@etoiles.edu.ci'),
  ('aaaabbbb-cccc-dddd-eeee-555555555552'::uuid, 'secretaire@etoiles.edu.ci'),
  ('aaaabbbb-cccc-dddd-eeee-555555555553'::uuid, 'comptable@etoiles.edu.ci'),
  ('aaaabbbb-cccc-dddd-eeee-555555555554'::uuid, 'surveillant@etoiles.edu.ci')
) AS u(id, email)
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
);

-- 3) public.profiles (même id que auth.users)
INSERT INTO public.profiles (id, role, first_name, last_name, email, phone, status)
VALUES
  ('aaaabbbb-cccc-dddd-eeee-555555555551', 'super_admin', 'Aminata', 'TRAORE', 'super@etoiles.edu.ci', '+225 01 02 03 04 05', 'active'),
  ('aaaabbbb-cccc-dddd-eeee-555555555552', 'secretaire', 'Awa', 'N''GUESSAN', 'secretaire@etoiles.edu.ci', '+225 01 02 03 04 06', 'active'),
  ('aaaabbbb-cccc-dddd-eeee-555555555553', 'comptable', 'Issouf', 'CAMARA', 'comptable@etoiles.edu.ci', '+225 01 02 03 04 07', 'active'),
  ('aaaabbbb-cccc-dddd-eeee-555555555554', 'surveillant', 'Brigitte', 'OUATTARA', 'surveillant@etoiles.edu.ci', '+225 01 02 03 04 08', 'active')
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  status = EXCLUDED.status;

-- Récap
SELECT id, email, role, first_name, last_name
FROM public.profiles
WHERE id IN (
  'aaaabbbb-cccc-dddd-eeee-555555555551',
  'aaaabbbb-cccc-dddd-eeee-555555555552',
  'aaaabbbb-cccc-dddd-eeee-555555555553',
  'aaaabbbb-cccc-dddd-eeee-555555555554'
)
ORDER BY email;
