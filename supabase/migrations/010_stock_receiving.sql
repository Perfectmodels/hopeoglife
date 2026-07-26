-- Hope Of Life — module de réception de stock par scan (phase 1)
-- Fournisseurs, codes-barres multiples par produit, conditionnements
-- (carton/pack/unité), lots & péremption, bons de réception multi-produits
-- (brouillon → validation atomique), extension de l'historique des mouvements.

-- =========================================================
-- 1. FOURNISSEURS & EMPLACEMENTS
-- =========================================================

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table stock_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

insert into stock_locations (name) values
  ('Stock principal'),
  ('Réserve bar'),
  ('Bar principal'),
  ('Cuisine'),
  ('Chambre froide'),
  ('Cave'),
  ('Espace VIP'),
  ('Dépôt secondaire');

-- =========================================================
-- 2. CONDITIONNEMENTS & CODES-BARRES MULTIPLES
-- =========================================================

create table product_packagings (
  id uuid primary key default gen_random_uuid(),
  stock_item_id uuid not null references stock_items(id) on delete cascade,
  name text not null,                          -- ex: Unité, Pack de 6, Carton de 24
  units_per_package numeric(12,3) not null default 1,
  purchase_price numeric(12,2),
  created_at timestamptz not null default now()
);

create index idx_product_packagings_item on product_packagings(stock_item_id);

create table product_barcodes (
  id uuid primary key default gen_random_uuid(),
  stock_item_id uuid not null references stock_items(id) on delete cascade,
  barcode text not null,
  barcode_type text,
  packaging_id uuid references product_packagings(id) on delete set null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (barcode)
);

create index idx_product_barcodes_item on product_barcodes(stock_item_id);

-- Reprise des codes-barres existants (un seul par produit aujourd'hui) avant
-- de supprimer la colonne — un même code ne doit exister qu'à un seul endroit.
insert into product_barcodes (stock_item_id, barcode, is_primary)
select id, barcode, true from stock_items where barcode is not null;

drop index if exists idx_stock_items_barcode;
alter table stock_items drop column barcode;

-- =========================================================
-- 3. LOTS & PÉREMPTION
-- =========================================================

create table product_batches (
  id uuid primary key default gen_random_uuid(),
  stock_item_id uuid not null references stock_items(id) on delete cascade,
  batch_number text not null,
  quantity numeric(12,3) not null default 0,   -- quantité reçue pour ce lot (traçabilité/alerte
                                                -- de péremption — ne se déplète pas à la vente,
                                                -- le solde vivant reste stock_items.quantity_on_hand)
  manufacturing_date date,
  expiration_date date,
  supplier_id uuid references suppliers(id) on delete set null,
  unit_cost numeric(12,2),
  stock_location_id uuid references stock_locations(id) on delete set null,
  received_at timestamptz not null default now(),
  created_by uuid references employees(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (stock_item_id, batch_number)
);

create index idx_product_batches_expiration on product_batches(stock_item_id, expiration_date);

-- =========================================================
-- 4. PRODUITS — champs additionnels (fiche produit enrichie)
-- =========================================================

alter table stock_items add column subcategory text;
alter table stock_items add column brand text;
alter table stock_items add column content_size text;              -- ex: "33 cl"
alter table stock_items add column purchase_price numeric(12,2);
alter table stock_items add column sale_price numeric(12,2);
alter table stock_items add column tax_rate numeric(5,2);
alter table stock_items add column default_supplier_id uuid references suppliers(id) on delete set null;
alter table stock_items add column default_location_id uuid references stock_locations(id) on delete set null;
alter table stock_items add column destination text check (destination in ('bar', 'cuisine', 'reserve'));
alter table stock_items add column is_sellable boolean not null default true;
alter table stock_items add column expiration_tracked boolean not null default false;

-- =========================================================
-- 5. BONS DE RÉCEPTION
-- =========================================================

create table stock_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique,
  supplier_id uuid references suppliers(id) on delete set null,
  invoice_number text,
  stock_location_id uuid references stock_locations(id) on delete set null,
  status text not null default 'brouillon' check (status in ('brouillon', 'validee', 'annulee')),
  notes text,
  created_by uuid references employees(id) on delete set null,
  validated_by uuid references employees(id) on delete set null,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table stock_receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references stock_receipts(id) on delete cascade,
  stock_item_id uuid not null references stock_items(id) on delete restrict,
  barcode_id uuid references product_barcodes(id) on delete set null,
  quantity_scanned numeric(12,3) not null default 0,
  quantity_received numeric(12,3) not null,    -- en unité de base du produit ; la multiplication
                                                -- carton/pack est appliquée côté client avant écriture
  unit_cost numeric(12,2),
  batch_number text,
  manufacturing_date date,
  expiration_date date,
  stock_location_id uuid references stock_locations(id) on delete set null,
  condition text check (condition in ('bon', 'abime', 'perime')),
  comment text,
  created_at timestamptz not null default now()
);

create index idx_stock_receipt_items_receipt on stock_receipt_items(receipt_id);

-- =========================================================
-- 6. MOUVEMENTS — extension (emplacement, lot, réception, corrections)
-- =========================================================

alter table stock_movements add column stock_location_id uuid references stock_locations(id) on delete set null;
alter table stock_movements add column batch_id uuid references product_batches(id) on delete set null;
alter table stock_movements add column receipt_item_id uuid references stock_receipt_items(id) on delete set null;
alter table stock_movements add column quantity_before numeric(12,3);
alter table stock_movements add column quantity_after numeric(12,3);
alter table stock_movements add column reversed_from_id uuid references stock_movements(id) on delete set null;

-- =========================================================
-- 7. VALIDATION ATOMIQUE D'UNE RÉCEPTION
-- =========================================================

create or replace function validate_stock_receipt(p_receipt_id uuid, p_employee_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_status text;
  v_item record;
  v_current numeric(12,3);
  v_new numeric(12,3);
  v_batch_id uuid;
  v_movement_id uuid;
begin
  select status into v_status from stock_receipts where id = p_receipt_id for update;

  if v_status is null then
    raise exception 'Réception introuvable.';
  end if;

  if v_status <> 'brouillon' then
    raise exception 'Cette réception a déjà été validée ou annulée.';
  end if;

  for v_item in
    select * from stock_receipt_items where receipt_id = p_receipt_id
  loop
    v_batch_id := null;

    if v_item.batch_number is not null then
      insert into product_batches (
        stock_item_id, batch_number, quantity, manufacturing_date, expiration_date,
        supplier_id, unit_cost, stock_location_id, created_by
      )
      select
        v_item.stock_item_id, v_item.batch_number, v_item.quantity_received,
        v_item.manufacturing_date, v_item.expiration_date,
        (select supplier_id from stock_receipts where id = p_receipt_id),
        v_item.unit_cost, v_item.stock_location_id, p_employee_id
      on conflict (stock_item_id, batch_number)
      do update set quantity = product_batches.quantity + excluded.quantity
      returning id into v_batch_id;
    end if;

    select quantity_on_hand into v_current from stock_items where id = v_item.stock_item_id for update;
    v_new := coalesce(v_current, 0) + v_item.quantity_received;

    insert into stock_movements (
      stock_item_id, type, quantity, reason, created_by,
      stock_location_id, batch_id, receipt_item_id, quantity_before, quantity_after
    ) values (
      v_item.stock_item_id, 'entree', v_item.quantity_received, 'Réception de stock', p_employee_id,
      v_item.stock_location_id, v_batch_id, v_item.id, v_current, v_new
    ) returning id into v_movement_id;

    update stock_items set quantity_on_hand = v_new, updated_at = now() where id = v_item.stock_item_id;
  end loop;

  update stock_receipts
  set status = 'validee', validated_by = p_employee_id, validated_at = now(), updated_at = now()
  where id = p_receipt_id;
end;
$$;

-- =========================================================
-- 8. RLS — même convention que le reste du schéma
-- =========================================================

alter table suppliers enable row level security;
alter table stock_locations enable row level security;
alter table product_packagings enable row level security;
alter table product_barcodes enable row level security;
alter table product_batches enable row level security;
alter table stock_receipts enable row level security;
alter table stock_receipt_items enable row level security;

create policy "staff full access" on suppliers for all using (is_staff()) with check (is_staff());
create policy "staff full access" on stock_locations for all using (is_staff()) with check (is_staff());
create policy "staff full access" on product_packagings for all using (is_staff()) with check (is_staff());
create policy "staff full access" on product_barcodes for all using (is_staff()) with check (is_staff());
create policy "staff full access" on product_batches for all using (is_staff()) with check (is_staff());
create policy "staff full access" on stock_receipts for all using (is_staff()) with check (is_staff());
create policy "staff full access" on stock_receipt_items for all using (is_staff()) with check (is_staff());
