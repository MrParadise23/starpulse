# MVP SaaS - Smart Routing Avis Clients

## Stack
Vite + React + TypeScript + Tailwind + Supabase + Edge Functions

---

## GUIDE DE DÉPLOIEMENT COMPLET

### ÉTAPE 1 : Supabase (15 min)

Si tu as déjà un projet Supabase avec le schema.sql et migration-001.sql exécutés, passe directement à 1.2.

#### 1.1 Si projet Supabase pas encore créé
1. Va sur https://supabase.com, crée un projet
2. Va dans SQL Editor
3. Copie-colle le contenu de `supabase/schema.sql` et exécute
4. Copie-colle le contenu de `supabase/migration-001.sql` et exécute

#### 1.2 Exécuter la nouvelle migration
1. Va dans SQL Editor de ton projet Supabase
2. Copie-colle le contenu de `supabase/migration-002.sql` et exécute
3. Vérifie : pas d'erreur rouge

#### 1.3 Récupérer tes clés
1. Va dans Settings > API
2. Note ton `Project URL` (c'est VITE_SUPABASE_URL)
3. Note ton `anon public` key (c'est VITE_SUPABASE_ANON_KEY)

#### 1.4 Pré-enregistrer des tags NFC dans la BDD
Pour que le système reconnaisse tes tags, il faut les insérer à l'avance.
Va dans SQL Editor et exécute (adapte les codes à ce que tu encodes sur tes tags) :

```sql
INSERT INTO public.plates (code, plate_type) VALUES
('TAG001', 'nfc'),
('TAG002', 'nfc'),
('TAG003', 'nfc'),
('TAG004', 'nfc'),
('TAG005', 'nfc'),
('TAG006', 'nfc'),
('TAG007', 'nfc'),
('TAG008', 'nfc'),
('TAG009', 'nfc'),
('TAG010', 'nfc');
```

Ces tags seront reconnus par le SaaS mais non attribués. Le commerçant les activera en les scannant.

---

### ÉTAPE 2 : Déployer les Edge Functions IA (20 min)

#### 2.1 Installer Supabase CLI
```bash
npm install -g supabase
```

#### 2.2 Se connecter
```bash
supabase login
supabase link --project-ref TON_PROJECT_REF
```
(TON_PROJECT_REF = l'ID dans l'URL de ton dashboard Supabase, genre `abcdefghijklmnop`)

#### 2.3 Configurer la clé OpenAI
```bash
supabase secrets set OPENAI_API_KEY=sk-ta-cle-openai-ici
```
Si tu n'as pas encore de clé : https://platform.openai.com/api-keys
Le modèle utilisé est gpt-4o-mini (très peu cher, ~0.15$/1000 requêtes).

#### 2.4 Déployer les fonctions
```bash
supabase functions deploy generate-review-reply
supabase functions deploy generate-private-reply
```

#### 2.5 Vérifier
Dans le dashboard Supabase > Edge Functions, tu dois voir les 2 fonctions listées en "Active".

**Si tu veux lancer SANS l'IA pour le moment** : pas de problème, le code a un fallback. Les réponses seront des templates basiques, mais tout le reste fonctionne.

---

### ÉTAPE 3 : Déployer le front sur Vercel (10 min)

#### 3.1 Push sur GitHub
```bash
cd mvp-saas-improved
git init
git add .
git commit -m "MVP SaaS v2 - aligné CDC"
git remote add origin https://github.com/TON-USERNAME/TON-REPO.git
git push -u origin main
```

#### 3.2 Déployer sur Vercel
1. Va sur https://vercel.com
2. "Add New Project" > importe ton repo GitHub
3. Framework Preset : Vite
4. Environment Variables : ajoute
   - `VITE_SUPABASE_URL` = ton URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = ta clé anon
5. Deploy

#### 3.3 Domaine personnalisé
1. Dans Vercel > Settings > Domains
2. Ajoute ton domaine (ex: app.tondomaine.com)
3. Configure les DNS chez ton registrar (CNAME vers cname.vercel-dns.com)

---

### ÉTAPE 4 : Commander les tags NFC (à faire en parallèle)

#### Ce qu'il faut commander
- Tags NFC NTAG215 ou NTAG216 (format sticker, carte, ou support de table)
- Fournisseurs : GoToTags, NFC TagWriter, ou fournisseurs Alibaba pour le volume

#### Ce qu'il faut encoder sur chaque tag
Chaque tag doit pointer vers :
```
https://app.tondomaine.com/t/TAG001
https://app.tondomaine.com/t/TAG002
...
```

Le code (TAG001, etc.) doit correspondre EXACTEMENT à ce que tu as inséré en BDD à l'étape 1.4.

#### Combien en commander pour démarrer
10-20 tags pour les premiers clients. Tu pourras en réinsérer dans la BDD au fur et à mesure.

---

### ÉTAPE 5 : Tester le parcours complet (30 min)

#### 5.1 Créer un compte commerçant
1. Va sur ton URL Vercel
2. Crée un compte
3. Crée un établissement avec un lien Google de test

#### 5.2 Tester le smart routing
1. Copie l'URL d'un QR code depuis le dashboard (ou va sur /t/TAG001)
2. Teste une note positive (4-5) : tu dois être redirigé INSTANTANEMENT vers Google
3. Teste une note négative (1-3) : formulaire privé avec prénom et contact obligatoires
4. Vérifie que le retour apparaît dans le dashboard > Retours privés

#### 5.3 Tester l'IA
1. Va dans Avis Google
2. Ajoute un avis manuellement dans Supabase (table google_reviews) pour tester
3. Clique "Générer une réponse IA"
4. Vérifie que la réponse est personnalisée
5. Teste "Modifier" > modifie le texte > sauvegarde
6. Teste "Publier sur Google" (pour l'instant ça marque juste le statut, la publication réelle viendra avec l'API Google)

---

## CE QUI FONCTIONNE MAINTENANT

- Smart routing complet (redirection instantanée + retours privés)
- Tags NFC (activation par scan)
- QR codes intelligents (génération auto + téléchargement)
- Dashboard (overview, plates, retours, avis, réglages, affiliation)
- Auth complète
- Génération IA de réponses (avec Edge Function si déployée, sinon fallback)
- Édition manuelle des réponses avant publication
- Paramétrage voix de marque IA complet (8 champs)
- Affiliation (structure + interface)

## CE QUI RESTE À FAIRE PLUS TARD

- **Google Business Profile OAuth** : synchronisation automatique des avis. Nécessite une app Google Cloud + validation. Tu peux vendre sans ça au début (saisie manuelle des avis).
- **Stripe** : paiement des abonnements. Tu peux commencer par du paiement manuel/virement.
- **Publication réelle sur Google** : nécessite l'API Google My Business (même prérequis que l'OAuth).
- **Aide IA sur retours privés** : Edge Function prête, bouton à ajouter dans RetourPrivesPage.

---

## STRUCTURE DES FICHIERS

```
src/
  App.tsx                    # Routes principales
  lib/supabase.ts            # Client + types
  pages/
    RoutingPage.tsx           # Parcours client (notation + routing)
    ActivatePage.tsx          # Activation tag NFC
    LoginPage.tsx             # Connexion
    RegisterPage.tsx          # Inscription
    dashboard/
      DashboardLayout.tsx     # Layout sidebar
      Overview.tsx            # Vue d'ensemble
      PlatesPage.tsx          # Tags NFC + QR codes
      RetourPrivesPage.tsx    # Retours privés
      ReviewsPage.tsx         # Avis Google + IA
      SettingsPage.tsx        # Réglages + voix de marque
      AffiliatePage.tsx       # Affiliation

supabase/
  schema.sql                 # Schéma initial
  migration-001.sql          # Migration 1
  migration-002.sql          # Migration 2 (alignement CDC)
  functions/
    generate-review-reply/    # Edge Function IA avis Google
    generate-private-reply/   # Edge Function IA retour privé
```
