-- ============================================
-- MIGRATION : Ajouter les colonnes manquantes
-- A executer dans Supabase SQL Editor
-- ============================================

-- Nouvelles colonnes Google Business Profile sur establishments
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS google_account_email text;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS google_business_name text;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS google_last_sync timestamp with time zone;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS google_connection_status text DEFAULT 'not_connected';

-- Nouvelle colonne prenom sur feedbacks
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS client_first_name text;
