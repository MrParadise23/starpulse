-- ============================================
-- SCHEMA DE BASE DE DONNEES - MVP SaaS Avis
-- A executer dans Supabase SQL Editor
-- ============================================

-- 1. Profils utilisateurs (commercants)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  phone text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Etablissements
create table public.establishments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  address text,
  city text,
  category text default 'restaurant',
  logo_url text,
  primary_color text default '#2563eb',
  secondary_color text default '#ffffff',
  satisfaction_threshold integer default 4,
  redirect_url text,
  routing_question text default 'Comment s''est passee votre experience ?',
  rating_format text default 'stars',
  ai_tone text default 'chaleureux et professionnel',
  ai_instructions text,
  google_place_id text,
  google_access_token text,
  google_refresh_token text,
  google_token_expires_at timestamp with time zone,
  current_google_rating numeric(2,1),
  total_google_reviews integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Plaques NFC / QR codes
create table public.plates (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  establishment_id uuid references public.establishments(id) on delete set null,
  label text,
  plate_type text default 'nfc',
  is_active boolean default true,
  activated_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 4. Scans
create table public.scans (
  id uuid default gen_random_uuid() primary key,
  plate_id uuid references public.plates(id) on delete cascade not null,
  establishment_id uuid references public.establishments(id) on delete cascade,
  rating_given integer,
  result text not null,
  user_agent text,
  ip_hash text,
  created_at timestamp with time zone default now()
);

-- 5. Feedbacks prives
create table public.feedbacks (
  id uuid default gen_random_uuid() primary key,
  scan_id uuid references public.scans(id) on delete cascade,
  establishment_id uuid references public.establishments(id) on delete cascade not null,
  plate_id uuid references public.plates(id) on delete set null,
  rating integer,
  comment text,
  client_email text,
  client_phone text,
  status text default 'unread',
  created_at timestamp with time zone default now()
);

-- 6. Avis Google
create table public.google_reviews (
  id uuid default gen_random_uuid() primary key,
  establishment_id uuid references public.establishments(id) on delete cascade not null,
  google_review_id text unique,
  author_name text,
  rating integer,
  comment text,
  review_date timestamp with time zone,
  ai_suggested_reply text,
  final_reply text,
  reply_status text default 'pending',
  replied_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 7. Affilies
create table public.affiliates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  referral_code text unique not null,
  referral_link text,
  commission_rate numeric(3,2) default 0.20,
  commission_duration_months integer default 24,
  total_earned numeric(10,2) default 0,
  iban text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- 8. Parrainages
create table public.referrals (
  id uuid default gen_random_uuid() primary key,
  affiliate_id uuid references public.affiliates(id) on delete cascade not null,
  referred_user_id uuid references public.profiles(id) on delete cascade not null,
  referred_establishment_id uuid references public.establishments(id) on delete set null,
  status text default 'active',
  commission_start_date timestamp with time zone default now(),
  commission_end_date timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 9. Commissions
create table public.commissions (
  id uuid default gen_random_uuid() primary key,
  affiliate_id uuid references public.affiliates(id) on delete cascade not null,
  referral_id uuid references public.referrals(id) on delete cascade not null,
  amount numeric(10,2) not null,
  period_start date not null,
  period_end date not null,
  status text default 'pending',
  paid_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 10. Abonnements
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  establishment_id uuid references public.establishments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stripe_subscription_id text,
  stripe_customer_id text,
  plan text default 'essential',
  price_monthly numeric(10,2) default 29.00,
  billing_period text default 'monthly',
  status text default 'active',
  trial_ends_at timestamp with time zone,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- INDEX
create index idx_plates_code on public.plates(code);
create index idx_plates_establishment on public.plates(establishment_id);
create index idx_scans_plate on public.scans(plate_id);
create index idx_scans_establishment on public.scans(establishment_id);
create index idx_scans_created on public.scans(created_at);
create index idx_feedbacks_establishment on public.feedbacks(establishment_id);
create index idx_feedbacks_status on public.feedbacks(status);
create index idx_google_reviews_establishment on public.google_reviews(establishment_id);
create index idx_affiliates_code on public.affiliates(referral_code);
create index idx_subscriptions_establishment on public.subscriptions(establishment_id);

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.establishments enable row level security;
alter table public.plates enable row level security;
alter table public.scans enable row level security;
alter table public.feedbacks enable row level security;
alter table public.google_reviews enable row level security;
alter table public.affiliates enable row level security;
alter table public.referrals enable row level security;
alter table public.commissions enable row level security;
alter table public.subscriptions enable row level security;

-- POLICIES : Profils
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- POLICIES : Etablissements (lecture publique pour le routing, ecriture privee)
create policy "Public read active establishments" on public.establishments for select using (true);
create policy "Users create establishments" on public.establishments for insert with check (auth.uid() = user_id);
create policy "Users update own establishments" on public.establishments for update using (auth.uid() = user_id);

-- POLICIES : Plaques (lecture publique pour le routing)
create policy "Public read plates" on public.plates for select using (true);
create policy "Users update own plates" on public.plates for update using (
  establishment_id in (select id from public.establishments where user_id = auth.uid())
  or establishment_id is null
);

-- POLICIES : Scans (insertion publique, lecture privee)
create policy "Public create scans" on public.scans for insert with check (true);
create policy "Users view own scans" on public.scans for select using (
  establishment_id in (select id from public.establishments where user_id = auth.uid())
);

-- POLICIES : Feedbacks (insertion publique, lecture privee)
create policy "Public create feedbacks" on public.feedbacks for insert with check (true);
create policy "Users view own feedbacks" on public.feedbacks for select using (
  establishment_id in (select id from public.establishments where user_id = auth.uid())
);
create policy "Users update own feedbacks" on public.feedbacks for update using (
  establishment_id in (select id from public.establishments where user_id = auth.uid())
);

-- POLICIES : Avis Google
create policy "Users view own reviews" on public.google_reviews for select using (
  establishment_id in (select id from public.establishments where user_id = auth.uid())
);
create policy "Users update own reviews" on public.google_reviews for update using (
  establishment_id in (select id from public.establishments where user_id = auth.uid())
);

-- POLICIES : Affiliation
create policy "Users view own affiliate" on public.affiliates for select using (auth.uid() = user_id);
create policy "Users update own affiliate" on public.affiliates for update using (auth.uid() = user_id);
create policy "Users view own referrals" on public.referrals for select using (
  affiliate_id in (select id from public.affiliates where user_id = auth.uid())
);
create policy "Users view own commissions" on public.commissions for select using (
  affiliate_id in (select id from public.affiliates where user_id = auth.uid())
);
create policy "Users view own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);

-- TRIGGER : creer un profil automatiquement a l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- TRIGGER : creer un compte affilie automatiquement
create or replace function public.handle_new_profile()
returns trigger as $$
begin
  insert into public.affiliates (user_id, referral_code)
  values (new.id, upper(substring(md5(random()::text) from 1 for 6)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile();

-- FONCTION : activer un tag (claim)
create or replace function public.claim_plate(
  plate_code text,
  target_establishment_id uuid,
  plate_label text default null
)
returns json as $$
declare
  target_plate public.plates;
begin
  select * into target_plate from public.plates where code = plate_code;
  if not found then
    return json_build_object('success', false, 'error', 'Tag introuvable');
  end if;
  if target_plate.establishment_id is not null then
    return json_build_object('success', false, 'error', 'Ce tag est deja active');
  end if;
  update public.plates
  set establishment_id = target_establishment_id,
      label = plate_label,
      activated_at = now(),
      is_active = true
  where code = plate_code;
  return json_build_object('success', true, 'message', 'Tag active');
end;
$$ language plpgsql security definer;
