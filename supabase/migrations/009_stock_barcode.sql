-- Hope Of Life — scan de code-barres pour le stock
-- Permet de retrouver un produit déjà connu par son code-barres, ou de le
-- créer avec le nom/l'image renvoyés par Open Food Facts lors du premier scan.

alter table stock_items add column barcode text;
alter table stock_items add column image_url text;

create unique index idx_stock_items_barcode on stock_items (barcode) where barcode is not null;
