-- Hope Of Life — extension schema pour le site public
-- Couvre : événements, privatisations, messages de contact.
-- (Le cahier des charges place la gestion complète des événements en V2 ;
-- ces tables minimales permettent au site public V1 d'afficher des
-- événements et de capter des demandes de privatisation dès maintenant.)

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  event_date date not null,
  event_time time,
  price_info text,
  conditions text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_events_date on events(event_date);

create table event_bookings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text,
  party_size int not null default 1,
  status text not null default 'en_attente' check (
    status in ('en_attente', 'confirmee', 'annulee')
  ),
  created_at timestamptz not null default now()
);

create type privatization_occasion as enum (
  'anniversaire', 'mariage', 'diner_prive', 'conference',
  'soiree_entreprise', 'lancement_produit', 'reception', 'shooting', 'ceremonie', 'autre'
);

create table privatization_requests (
  id uuid primary key default gen_random_uuid(),
  occasion privatization_occasion not null,
  requested_date date not null,
  requested_time time,
  party_size int not null,
  desired_areas text,
  budget_indicatif text,
  menu_souhaite text,
  boissons_souhaitees text,
  equipements text,
  animations text,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text,
  status text not null default 'nouvelle' check (
    status in ('nouvelle', 'en_etude', 'devis_envoye', 'confirmee', 'annulee')
  ),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  status text not null default 'nouveau' check (status in ('nouveau', 'traite')),
  created_at timestamptz not null default now()
);
