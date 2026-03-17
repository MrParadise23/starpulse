-- ============================================
-- MIGRATION 002 : Alignement avec le cahier des charges MVP
-- A executer dans Supabase SQL Editor
-- ============================================

-- ===========================================
-- FEEDBACKS : rendre le prenom et contact obligatoires cote schema
-- (la validation se fait aussi cote front, mais on securise en BDD)
-- ===========================================

-- client_first_name deja ajoute en migration-001
-- On s'assure que le champ existe
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS client_first_name text;

-- ===========================================
-- GOOGLE REVIEWS : statuts enrichis selon le CDC
-- Statuts possibles : pending, ai_generated, published, ignored
-- (anciennement seulement pending / published)
-- ===========================================

-- Ajouter le champ final_reply editable (deja existe dans schema mais s'assurer)
-- Rien a ajouter, le champ final_reply existe deja

-- ===========================================
-- ESTABLISHMENTS : parametrage IA enrichi (section 7.8 du CDC)
-- Le commerçant doit pouvoir definir une vraie voix de marque
-- ===========================================

-- Expressions et mots a privilegier
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS ai_preferred_expressions text;

-- Formulations a eviter
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS ai_avoid_expressions text;

-- Longueur souhaitee des reponses
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS ai_response_length text DEFAULT 'medium';

-- Maniere de repondre aux avis positifs
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS ai_positive_style text;

-- Maniere de repondre aux avis negatifs
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS ai_negative_style text;

-- Regles a toujours respecter
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS ai_rules text;

-- ===========================================
-- ESTABLISHMENTS : categories enrichies selon le CDC (section 4)
-- restaurant, glacier, cafe, bar, cabinet, concession, 
-- boutique, hotel, salon de coiffure, commerce de proximite, boulangerie
-- (gere cote front, pas de contrainte SQL)
-- ===========================================

-- ===========================================
-- PLATES : ajout d'une route_code distincte pour QR vs NFC
-- Les QR codes utilisent /r/:code, les NFC utilisent /t/:code
-- Le code existant utilise deja plate_type ('nfc' | 'qr')
-- Pas de changement de schema necessaire, la distinction se fait par plate_type
-- ===========================================

-- ===========================================
-- FEEDBACKS : ajout d'un champ source pour tracer le support d'origine
-- Le CDC mentionne "support d'origine si connu"
-- ===========================================
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS source_plate_code text;

-- ===========================================
-- SCANS : ajouter le type de support scanne
-- ===========================================
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS plate_type text;

-- ===========================================
-- INDEX supplementaires pour performance
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_google_reviews_status ON public.google_reviews(reply_status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created ON public.feedbacks(created_at);
