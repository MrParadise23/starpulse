-- ============================================
-- MIGRATION 004 : Système d'affiliation fonctionnel
-- ============================================

-- Fonction RPC pour incrémenter les gains d'un affilié
CREATE OR REPLACE FUNCTION public.increment_affiliate_earnings(aff_id uuid, earn_amount numeric)
RETURNS void AS $$
BEGIN
  UPDATE public.affiliates
  SET total_earned = total_earned + earn_amount
  WHERE id = aff_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy pour permettre l'insertion de referrals par les nouveaux inscrits
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='referrals' AND policyname='Users insert own referrals') THEN
    CREATE POLICY "Users insert own referrals" ON public.referrals
      FOR INSERT WITH CHECK (auth.uid() = referred_user_id);
  END IF;
END $$;

-- Policy pour permettre la lecture publique des affiliates (pour vérifier un code parrainage)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='affiliates' AND policyname='Public read affiliate codes') THEN
    CREATE POLICY "Public read affiliate codes" ON public.affiliates
      FOR SELECT USING (true);
  END IF;
END $$;

-- Policy pour permettre l'insertion de commissions par le service role (webhook)
-- Le service_role bypass RLS donc pas strictement nécessaire, mais par sécurité :
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='commissions' AND policyname='Service insert commissions') THEN
    CREATE POLICY "Service insert commissions" ON public.commissions
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Ajouter un champ IBAN sur les affiliés pour le paiement
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS payment_email text;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'bank_transfer';

-- Index pour accélérer la recherche de referrals par user
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user ON public.referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON public.referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON public.commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);
