-- Hope Of Life — enrichissement du catalogue site et POS

alter table menu_items add column internal_reference text;
alter table menu_items add column barcode text;
alter table menu_items add column purchase_price numeric(12,2);
alter table menu_items add column promotional_price numeric(12,2);
alter table menu_items add column quantity_available numeric(12,3) not null default 0;
alter table menu_items add column minimum_stock numeric(12,3) not null default 0;
alter table menu_items add column supplier_name text;
alter table menu_items add column storage_location text;
alter table menu_items add column tax_rate numeric(5,2) not null default 18;
alter table menu_items add column is_sellable boolean not null default true;
alter table menu_items add column destination text
  check (destination in ('bar', 'cuisine', 'lounge'));
alter table menu_items add column preparation_minutes integer;
alter table menu_items add column available_sides text[];
alter table menu_items add column available_supplements text[];
alter table menu_items add column expiration_date date;

create unique index idx_menu_items_internal_reference
  on menu_items (internal_reference)
  where internal_reference is not null;

create unique index idx_menu_items_barcode
  on menu_items (barcode)
  where barcode is not null;

alter table stock_items add column internal_reference text;
alter table stock_items add column promotional_price numeric(12,2);
alter table stock_items add column supplier_name text;
alter table stock_items add column storage_location text;
alter table stock_items add column active boolean not null default true;

create unique index idx_stock_items_internal_reference
  on stock_items (internal_reference)
  where internal_reference is not null;
