-- ============================================
-- MIGRATION 003 : Integration Stripe
-- A executer dans Supabase SQL Editor
-- ============================================

-- ===========================================
-- PROFILES : ajout du stripe_customer_id
-- ===========================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);

-- ===========================================
-- SUBSCRIPTIONS : enrichissement pour Stripe
-- ===========================================

-- S'assurer que la table subscriptions a tous les champs necessaires
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_price_id text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

-- Ajouter la colonne plan_interval pour distinguer monthly/yearly
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan_interval text DEFAULT 'monthly';

-- Index pour recherche rapide par stripe_subscription_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ===========================================
-- POLICIES : Les subscriptions doivent etre lisibles par le user
-- et insertables/updatables par le webhook (service role)
-- ===========================================

-- Policy de lecture (deja existante dans schema.sql, on s'assure)
-- "Users view own subscriptions" existe deja

-- Policy pour permettre l'insertion via service_role (webhook)
-- Le service_role bypass RLS, donc pas besoin de policy speciale
-- Mais on ajoute une policy INSERT pour le user au cas ou
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' AND policyname = 'Users insert own subscriptions'
  ) THEN
    CREATE POLICY "Users insert own subscriptions" ON public.subscriptions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' AND policyname = 'Users update own subscriptions'
  ) THEN
    CREATE POLICY "Users update own subscriptions" ON public.subscriptions
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ===========================================
-- TABLE : nfc_orders (commandes de tags NFC)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.nfc_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  establishment_id uuid REFERENCES public.establishments(id) ON DELETE SET NULL,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  pack_type text NOT NULL, -- 'single', 'pack3', 'pack5', 'pack10', 'pack25'
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'delivered'
  shipping_address text,
  shipping_city text,
  shipping_postal_code text,
  shipping_country text DEFAULT 'FR',
  tracking_number text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.nfc_orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'nfc_orders' AND policyname = 'Users view own nfc orders'
  ) THEN
    CREATE POLICY "Users view own nfc orders" ON public.nfc_orders
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'nfc_orders' AND policyname = 'Users insert own nfc orders'
  ) THEN
    CREATE POLICY "Users insert own nfc orders" ON public.nfc_orders
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_nfc_orders_user ON public.nfc_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_nfc_orders_status ON public.nfc_orders(status);

-- ===========================================
-- FONCTION UTILITAIRE : Obtenir l'abonnement actif d'un user
-- ===========================================
CREATE OR REPLACE FUNCTION public.get_active_subscription(target_user_id uuid)
RETURNS json AS $$
DECLARE
  sub record;
BEGIN
  SELECT * INTO sub FROM public.subscriptions
  WHERE user_id = target_user_id
    AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('has_subscription', false);
  END IF;
  
  RETURN json_build_object(
    'has_subscription', true,
    'id', sub.id,
    'plan', sub.plan,
    'plan_interval', sub.plan_interval,
    'status', sub.status,
    'trial_ends_at', sub.trial_ends_at,
    'current_period_end', sub.current_period_end,
    'cancelled_at', sub.cancelled_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
