# StarPulse - Guide d'integration Stripe

## ETAPE 1 : Executer la migration SQL

1. Va sur **Supabase Dashboard** > **SQL Editor**
2. Copie-colle le contenu de `supabase/migration-003-stripe.sql`
3. Clique **Run**

Ca ajoute : colonnes Stripe dans profiles, table nfc_orders, enrichissement subscriptions.

---

## ETAPE 2 : Deployer les Edge Functions

### 2a. Fonction `create-checkout`
```bash
cd ~/Desktop/PAPYSTAR/mvp-saas-improved
supabase functions deploy create-checkout --no-verify-jwt
```

### 2b. Fonction `stripe-webhook`
```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```

> **Important** : `--no-verify-jwt` est necessaire pour le webhook car Stripe n'envoie pas de JWT.

---

## ETAPE 3 : Configurer les secrets Supabase

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE
```

Le STRIPE_WEBHOOK_SECRET sera configure a l'etape 4 (apres creation du webhook Stripe).

---

## ETAPE 4 : Configurer le webhook Stripe

1. Va sur **[dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)**
2. Clique **"Ajouter un endpoint"**
3. URL : `https://wkuimxofonzzhpnpeubz.supabase.co/functions/v1/stripe-webhook`
4. Evenements a ecouter :
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copie le **Signing Secret** (commence par `whsec_...`)
6. Configure-le dans Supabase :
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_SECRET
```

---

## ETAPE 5 : Variable d'environnement front (Vercel)

Va sur **Vercel** > ton projet > **Settings** > **Environment Variables** et ajoute :

| Variable | Valeur |
|---|---|
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_VOTRE_CLE_PUBLIQUE` |

> Note : la cle publique n'est pas utilisee cote front dans cette integration (on utilise Stripe Checkout heberge), mais c'est bon de l'avoir configuree pour le futur.

---

## ETAPE 6 : Push et deployer

```bash
cd ~/Desktop/PAPYSTAR/mvp-saas-improved
git add .
git commit -m "feat: integration Stripe complete (checkout, webhook, abonnement, NFC)"
git push
```

Vercel redéploie automatiquement.

---

## ETAPE 7 : Tester

1. Va sur ton app > **Dashboard** > **Abonnement**
2. Clique **"S'abonner maintenant"**
3. Tu seras redirige vers Stripe Checkout (mode test)
4. Utilise la carte test : `4242 4242 4242 4242`, date future, CVC quelconque
5. Apres le paiement, tu reviens sur le dashboard avec le statut "Actif"

### Tester le webhook localement (optionnel)
```bash
stripe listen --forward-to https://wkuimxofonzzhpnpeubz.supabase.co/functions/v1/stripe-webhook
```

---

## Fichiers modifies/crees

### Nouveaux fichiers :
- `supabase/migration-003-stripe.sql` — Migration BDD
- `supabase/functions/stripe-webhook/index.ts` — Webhook Stripe
- `supabase/functions/create-checkout/index.ts` — Creation de sessions Checkout
- `src/pages/PricingPage.tsx` — Page pricing publique
- `src/pages/dashboard/SubscriptionPage.tsx` — Gestion abonnement dashboard

### Fichiers modifies :
- `src/App.tsx` — Ajout routes /pricing et /dashboard/subscription
- `src/pages/dashboard/DashboardLayout.tsx` — Ajout item "Abonnement" dans sidebar
- `src/pages/LandingPage.tsx` — Refonte section pricing (toggle mensuel/annuel, tags NFC)

---

## Architecture du flow Stripe

```
Utilisateur clique "S'abonner"
    |
    v
Edge Function "create-checkout"
    |-- Cree un Stripe Customer (ou reutilise)
    |-- Cree une Checkout Session (mode subscription, 14j trial)
    |-- Retourne l'URL de checkout
    |
    v
Stripe Checkout (page hebergee par Stripe)
    |-- L'utilisateur entre sa carte
    |-- Paiement traite
    |
    v
Webhook "stripe-webhook"
    |-- Recoit checkout.session.completed
    |-- Upsert dans subscriptions (Supabase)
    |-- Met a jour profiles.stripe_customer_id
    |
    v
Dashboard "SubscriptionPage"
    |-- Lit la subscription depuis Supabase
    |-- Affiche statut, dates, bouton "Gerer la facturation"
    |-- "Gerer" -> Stripe Customer Portal (changer carte, annuler, etc.)
```

## Prix configures dans Stripe

| Formule | Price ID | Montant |
|---|---|---|
| Mensuel | `price_1TCJcSLMRsVfhf6RykLYqoSx` | 29 EUR/mois |
| Annuel | `price_1TCJdCLMRsVfhf6RCBzCAUP3` | 249 EUR/an |

## Tags NFC (paiement unique via Checkout)

| Pack | Prix |
|---|---|
| 1 tag | 24.90 EUR |
| 3 tags | 59 EUR |
| 5 tags | 89 EUR |
| 10 tags | 149 EUR |
| 25 tags | 299 EUR |
