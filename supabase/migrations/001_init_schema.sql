-- Hope Of Life — schema V1 (Supabase / Postgres)
-- Couvre : utilisateurs & rôles, plan de salle, réservations, menu, commandes,
-- tickets cuisine/bar, paiements & caisse, stock principal, journal d'activité.

create extension if not exists "pgcrypto";

-- =========================================================
-- 1. UTILISATEURS & RÔLES
-- =========================================================

create type user_role as enum (
  'admin',
  'manager',
  'caissier',
  'serveur',
  'cuisine',
  'bar',
  'stock'
);

-- Profil applicatif lié à auth.users (Supabase Auth)
create table employees (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text,
  email text,
  photo_url text,
  role user_role not null,
  active boolean not null default true,
  hired_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  phone text,
  email text,
  auth_user_id uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 2. PLAN DE SALLE & RÉSERVATIONS
-- =========================================================

create type table_status as enum (
  'libre',
  'reservee',
  'occupee',
  'commande_en_cours',
  'commande_prete',
  'paiement_demande',
  'a_nettoyer',
  'indisponible'
);

create table dining_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,           -- ex: Salle intérieure, Terrasse, VIP Lounge
  description text,
  is_vip boolean not null default false,
  sort_order int not null default 0
);

create table dining_tables (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references dining_areas(id) on delete cascade,
  label text not null,          -- ex: T12
  capacity int not null default 2,
  pos_x numeric,                -- coordonnées plan de salle
  pos_y numeric,
  status table_status not null default 'libre',
  created_at timestamptz not null default now()
);

create type reservation_status as enum (
  'en_attente',
  'confirmee',
  'arrivee',
  'installee',
  'terminee',
  'annulee',
  'absence'
);

create table reservations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text,
  party_size int not null,
  reservation_date date not null,
  reservation_time time not null,
  area_id uuid references dining_areas(id),
  table_id uuid references dining_tables(id),
  occasion text,
  special_requests text,
  status reservation_status not null default 'en_attente',
  created_by uuid references employees(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_reservations_date on reservations(reservation_date, reservation_time);

-- =========================================================
-- 3. MENU (restaurant + bar)
-- =========================================================

create table menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('restaurant', 'bar')),
  sort_order int not null default 0
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references menu_categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  allergens text[],
  is_available boolean not null default true,
  is_daily_special boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table menu_item_variants (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  name text not null,           -- ex: "Grand format", "Sans alcool"
  price_delta numeric(10,2) not null default 0
);

-- =========================================================
-- 4. COMMANDES
-- =========================================================

create type order_source as enum (
  'site_web', 'compte_client', 'serveur', 'caisse', 'qr_table', 'terminal_bar', 'telephone'
);

create type order_status as enum (
  'brouillon', 'confirmee', 'transmise', 'en_preparation',
  'partiellement_prete', 'prete', 'servie',
  'en_attente_paiement', 'payee', 'annulee', 'remboursee'
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references customers(id) on delete set null,
  server_id uuid references employees(id) on delete set null,
  table_id uuid references dining_tables(id) on delete set null,
  source order_source not null,
  status order_status not null default 'brouillon',
  notes text,
  discount_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id),
  variant_id uuid references menu_item_variants(id),
  quantity int not null default 1,
  unit_price numeric(10,2) not null,
  notes text,
  destination text not null check (destination in ('cuisine', 'bar')),
  status text not null default 'recu' check (
    status in ('recu', 'en_preparation', 'pret', 'servi', 'indisponible')
  ),
  created_at timestamptz not null default now()
);

create index idx_order_items_order on order_items(order_id);
create index idx_order_items_destination_status on order_items(destination, status);

-- =========================================================
-- 5. PAIEMENTS & CAISSE
-- =========================================================

create type payment_method as enum (
  'especes', 'carte', 'mobile_money', 'virement', 'en_ligne', 'mixte', 'offert'
);

create table cash_sessions (
  id uuid primary key default gen_random_uuid(),
  cashier_id uuid not null references employees(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_amount numeric(10,2) not null default 0,
  closing_amount numeric(10,2),
  expected_amount numeric(10,2),
  variance numeric(10,2),
  status text not null default 'ouverte' check (status in ('ouverte', 'cloturee'))
);

create table cash_movements (
  id uuid primary key default gen_random_uuid(),
  cash_session_id uuid not null references cash_sessions(id) on delete cascade,
  type text not null check (type in ('vente', 'entree', 'sortie', 'ajustement')),
  amount numeric(10,2) not null,
  reason text,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  cash_session_id uuid references cash_sessions(id),
  method payment_method not null,
  amount numeric(10,2) not null,
  received_by uuid references employees(id),
  created_at timestamptz not null default now()
);

-- =========================================================
-- 6. STOCK (principal)
-- =========================================================

create table stock_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null,             -- ex: kg, L, unité, bouteille
  category text,
  quantity_on_hand numeric(12,3) not null default 0,
  low_stock_threshold numeric(12,3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  stock_item_id uuid not null references stock_items(id) on delete cascade,
  type text not null check (type in ('entree', 'sortie', 'perte', 'ajustement', 'inventaire')),
  quantity numeric(12,3) not null,
  reason text,
  created_by uuid references employees(id),
  created_at timestamptz not null default now()
);

-- =========================================================
-- 7. JOURNAL D'ACTIVITÉ (horodatage & traçabilité)
-- =========================================================

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references employees(id),
  action text not null,           -- ex: 'order.cancel', 'price.update', 'cash.close'
  entity_type text,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  reason text,
  ip_address text,
  created_at timestamptz not null default now()
);

create index idx_activity_logs_entity on activity_logs(entity_type, entity_id);
create index idx_activity_logs_actor on activity_logs(actor_id);

-- =========================================================
-- 8. PARAMÈTRES
-- =========================================================

create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
