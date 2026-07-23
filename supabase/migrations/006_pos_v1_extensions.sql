-- Hope Of Life — extensions POS V1
-- Identification rapide par PIN, transfert de table, paiement mixte/pourboire,
-- modificateurs de commande et type de service.

alter table employees add column pin_hash text;
create unique index idx_employees_pin_hash on employees (pin_hash) where pin_hash is not null;

alter table orders add column customer_name text;
alter table orders add column service_type text not null default 'sur_place'
  check (service_type in ('sur_place', 'a_emporter', 'livraison'));

alter table order_items add column priority text not null default 'normale'
  check (priority in ('normale', 'urgente'));
alter table order_items add column modifiers text[] not null default '{}';

alter table payments add column tip_amount numeric(10,2) not null default 0;
