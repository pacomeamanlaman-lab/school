# Roadmap Intégration Supabase - Phase 3

## État actuel
✅ **MVP Frontend complet** avec CRUD fonctionnel en state local
✅ **Tous les modules** : Élèves, Classes, Personnel, Parents, Absences, Notes, Bulletins, Paramètres
✅ **Build production** fonctionnel

---

## Phase 3 : Backend & Authentification Supabase

### 3.1 Configuration Supabase (1-2h)
- [ ] Créer projet Supabase
- [ ] Installer dépendances : `@supabase/supabase-js`, `@supabase/ssr`
- [ ] Configurer variables d'environnement (`.env.local`)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Créer utilitaires Supabase (`src/lib/supabase/`)
  - `client.ts` - Client côté navigateur
  - `server.ts` - Client côté serveur
  - `middleware.ts` - Auth middleware

### 3.2 Schéma Base de Données (2-3h)
- [ ] **Table `profiles`** - Profils utilisateurs
  - `id` (UUID, FK vers auth.users)
  - `role` (ENUM: super_admin, admin, enseignant, parent, eleve)
  - `first_name`, `last_name`, `email`, `phone`
  - `status` (active, inactive, suspended)
  - `created_at`, `updated_at`

- [ ] **Table `etablissements`** - Multi-établissement (préparation future)
  - `id` (UUID)
  - `nom`, `adresse`, `ville`, `code_postal`
  - `telephone`, `email`, `directeur`
  - `logo_url`

- [ ] **Table `annees_scolaires`**
  - `id` (UUID)
  - `etablissement_id` (FK)
  - `annee` (ex: "2024-2025")
  - `date_debut`, `date_fin`
  - `is_active` (boolean)

- [ ] **Table `trimestres`**
  - `id` (UUID)
  - `annee_scolaire_id` (FK)
  - `nom` (ex: "Trimestre 1")
  - `numero` (1, 2, 3)
  - `date_debut`, `date_fin`

- [ ] **Table `matieres`**
  - `id` (UUID)
  - `etablissement_id` (FK)
  - `nom` (ex: "Mathématiques")
  - `coefficient` (INTEGER)
  - `couleur` (TEXT)

- [ ] **Table `classes`**
  - `id` (UUID)
  - `etablissement_id` (FK)
  - `annee_scolaire_id` (FK)
  - `name` (ex: "CP - Classe A")
  - `niveau` (CP, CE1, CE2, CM1, CM2, 6ème)
  - `capacite` (INTEGER)
  - `salle` (TEXT)
  - `titulaire_id` (FK vers profiles)
  - `status` (active, archived)

- [ ] **Table `students`** - Élèves
  - `id` (UUID)
  - `user_id` (FK vers profiles, nullable)
  - `matricule` (TEXT UNIQUE)
  - `first_name`, `last_name`
  - `date_naissance`, `lieu_naissance`
  - `genre` (M, F)
  - `classe_id` (FK)
  - `status` (active, inactive, transferred)
  - `photo_url`

- [ ] **Table `parents`** - Parents/Tuteurs
  - `id` (UUID)
  - `user_id` (FK vers profiles, nullable)
  - `nom`, `telephone`, `email`
  - `adresse`, `profession`

- [ ] **Table `student_parents`** - Relation Many-to-Many
  - `student_id` (FK)
  - `parent_id` (FK)
  - `relation_type` (père, mère, tuteur)

- [ ] **Table `staff`** - Personnel
  - `id` (UUID)
  - `user_id` (FK vers profiles)
  - `matiere_id` (FK, nullable)
  - `classe_id` (FK, nullable)
  - `date_embauche`
  - `adresse`

- [ ] **Table `absences`**
  - `id` (UUID)
  - `student_id` (FK)
  - `classe_id` (FK)
  - `date` (DATE)
  - `statut` (present, absent, retard)
  - `motif` (TEXT, nullable)
  - `justifiee` (BOOLEAN)
  - `created_by` (FK vers profiles)

- [ ] **Table `notes`**
  - `id` (UUID)
  - `student_id` (FK)
  - `matiere_id` (FK)
  - `trimestre_id` (FK)
  - `classe_id` (FK)
  - `note` (DECIMAL)
  - `appreciation` (TEXT)
  - `created_by` (FK vers profiles)

- [ ] **Table `emplois_du_temps`**
  - `id` (UUID)
  - `classe_id` (FK)
  - `matiere_id` (FK)
  - `enseignant_id` (FK vers profiles)
  - `jour` (lundi, mardi, mercredi, jeudi, vendredi)
  - `heure_debut`, `heure_fin`

### 3.3 Sécurité RLS (Row Level Security) (2-3h)
- [ ] **Policies `profiles`**
  - SELECT : Tous authentifiés peuvent lire leurs propres données
  - UPDATE : Utilisateur peut modifier son profil
  - Admin peut tout modifier

- [ ] **Policies `students`**
  - SELECT : Parents voient leurs enfants, Enseignants voient leur classe, Admin voit tout
  - INSERT/UPDATE/DELETE : Admin et Directeur uniquement

- [ ] **Policies `classes`**
  - SELECT : Tous authentifiés
  - INSERT/UPDATE/DELETE : Admin et Directeur

- [ ] **Policies `absences`**
  - SELECT : Enseignants (leur classe), Parents (leurs enfants), Admin (tout)
  - INSERT : Enseignants et Admin
  - UPDATE : Créateur ou Admin

- [ ] **Policies `notes`**
  - SELECT : Enseignants (leurs matières), Parents (leurs enfants), Admin (tout)
  - INSERT/UPDATE : Enseignants (leurs matières) et Admin

- [ ] **Policies générales**
  - Filtrage par `etablissement_id` pour multi-tenant futur
  - Vérification du rôle via `auth.uid()`

### 3.4 Authentification (2-3h)
- [ ] Créer middleware Next.js pour auth
- [ ] Implémenter page Login avec Supabase Auth
  - Email/Password
  - Magic Link (optionnel)
- [ ] Système de reset password
- [ ] Gestion des sessions
- [ ] Redirection automatique si non authentifié
- [ ] Logout fonctionnel

### 3.5 Migration State Local → Supabase (3-4h)
- [ ] **Créer hooks personnalisés**
  - `useStudents()` - Remplace `useState(studentsData)`
  - `useClasses()` - Remplace `useState(classesData)`
  - `useStaff()` - Remplace `useState(staffData)`
  - `useParents()` - Remplace `useState(parentsData)`
  - `useMatieres()` - Remplace `useState(matieresData)`
  - `useAbsences(classeId, date)` - Données temps réel
  - `useNotes(classeId, matiereId, trimestreId)` - Données temps réel

- [ ] **Modifier les pages**
  - `students/page.tsx` : Remplacer state local par `useStudents()`
  - `classes/page.tsx` : Remplacer state local par `useClasses()`
  - `staff/page.tsx` : Remplacer state local par `useStaff()`
  - `parents/page.tsx` : Remplacer state local par `useParents()`
  - `settings/page.tsx` : Remplacer state local par `useMatieres()` et `useAnneesScolaires()`
  - `absences/page.tsx` : Utiliser `useAbsences()`
  - `notes/page.tsx` : Utiliser `useNotes()`

- [ ] **Modifier les handlers**
  - `handleAdd*` : Appeler `supabase.from().insert()`
  - `handleEdit*` : Appeler `supabase.from().update()`
  - `handleDelete*` : Appeler `supabase.from().delete()`
  - Gestion des erreurs avec toast/notifications

### 3.6 Gestion des Permissions (2h)
- [ ] Créer contexte `useAuth()` avec rôle utilisateur
- [ ] Composant `<ProtectedRoute>` selon rôle
- [ ] Conditionnel sur boutons Add/Edit/Delete selon rôle
- [ ] Sidebar dynamique selon rôle :
  - **Super Admin** : Tout
  - **Admin/Directeur** : Tout sauf Paramètres établissement
  - **Enseignant** : Dashboard, Élèves (lecture), Classes (lecture), Absences, Notes, Bulletins
  - **Parent** : Dashboard (leurs enfants), Absences (enfants), Notes (enfants), Bulletins (enfants)

### 3.7 Fonctionnalités Avancées (3-4h)
- [ ] **Upload fichiers (Supabase Storage)**
  - Photos élèves
  - Logo établissement
  - Documents (bulletins PDF)

- [ ] **Realtime Subscriptions**
  - Absences en temps réel (appel en cours)
  - Notifications nouvelles notes

- [ ] **Exports améliorés**
  - Export depuis données Supabase (pas state local)
  - Génération bulletins en masse avec queue

- [ ] **Statistiques Dashboard**
  - Calculées depuis Supabase avec agrégations
  - Graphiques temps réel

### 3.8 Seed Data & Tests (1-2h)
- [ ] Script seed pour données de démo
  - Créer utilisateurs test (admin, enseignant, parent)
  - Créer classes, élèves, matières de démo
  - Générer absences et notes factices
- [ ] Tester tous les CRUDs avec Supabase
- [ ] Tester permissions selon rôles
- [ ] Tester exports PDF/Excel avec données réelles

### 3.9 Optimisations & Polish (1-2h)
- [ ] Loading states pendant fetch Supabase
- [ ] Error boundaries pour erreurs réseau
- [ ] Toast notifications (succès/erreur)
- [ ] Optimistic UI updates
- [ ] Pagination pour grandes listes
- [ ] Cache avec `react-query` ou `swr` (optionnel)

---

## Phase 4 : Déploiement & Production (après Phase 3)

### 4.1 Configuration Production
- [ ] Variables d'environnement Vercel/Netlify
- [ ] Configuration domaine personnalisé
- [ ] SSL/HTTPS
- [ ] Sauvegardes automatiques Supabase

### 4.2 Monitoring
- [ ] Supabase Dashboard monitoring
- [ ] Logs d'erreurs (Sentry optionnel)
- [ ] Analytics (Vercel Analytics)

### 4.3 Documentation
- [ ] Guide admin : Créer utilisateurs, gérer classes
- [ ] Guide enseignant : Saisir absences, notes
- [ ] Guide parent : Consulter suivi enfant

---

## Estimation Totale Phase 3
**16-24 heures** (2-3 jours de développement actif)

### Ordre recommandé :
1. **Jour 1** : Config Supabase + Schéma DB + RLS (3.1 → 3.3)
2. **Jour 2** : Auth + Migration Students/Classes (3.4 → 3.5 partiel)
3. **Jour 3** : Migration reste modules + Permissions + Tests (3.5 → 3.8)
4. **Bonus** : Fonctionnalités avancées si temps (3.7 → 3.9)

---

## Notes importantes
- **Backup avant migration** : Commit actuel = fallback si problème Supabase
- **Migration progressive** : Tester un module (Students) avant de migrer tous
- **Données de démo** : Conserver pour développement local
- **Multi-tenant ready** : Structure DB prête pour multi-établissement futur
