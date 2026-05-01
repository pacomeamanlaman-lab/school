-- ============================================
-- SCRIPT DE RESET - VIDER TOUTES LES DONNÉES
-- ============================================

-- ATTENTION : Ce script supprime TOUTES les données
-- Utilisez avec précaution !

-- Désactiver temporairement les triggers et contraintes pour accélérer
SET session_replication_role = replica;

-- Vider les tables dans l'ordre inverse des dépendances
TRUNCATE TABLE emplois_du_temps CASCADE;
TRUNCATE TABLE absences CASCADE;
TRUNCATE TABLE notes CASCADE;
TRUNCATE TABLE paiements CASCADE;
TRUNCATE TABLE frais_scolaires CASCADE;
TRUNCATE TABLE documents_eleves CASCADE;
TRUNCATE TABLE student_parents CASCADE;
TRUNCATE TABLE students CASCADE;
TRUNCATE TABLE parents CASCADE;
TRUNCATE TABLE staff CASCADE;
TRUNCATE TABLE classes CASCADE;
TRUNCATE TABLE matieres CASCADE;
TRUNCATE TABLE trimestres CASCADE;
TRUNCATE TABLE annees_scolaires CASCADE;
TRUNCATE TABLE etablissements CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- Réactiver les triggers et contraintes
SET session_replication_role = DEFAULT;

-- Succès !
SELECT 'Base de données vidée avec succès !' as message;
