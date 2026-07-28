-- Hope Of Life — liaison catalogue de vente ↔ inventaire
-- Le prix reste porté par menu_items, la quantité par stock_items : on relie les
-- deux au lieu de dupliquer, pour qu'une page puisse afficher prix et stock d'une
-- même boisson. La liaison est facultative et se fait au fil de l'eau.

alter table menu_items add column stock_item_id uuid references stock_items(id) on delete set null;

-- Contrainte (et non index unique partiel) : Postgres considère déjà les NULL
-- comme distincts, et l'introspection des relations de PostgREST s'appuie sur
-- pg_constraint — c'est ce qui rend le select imbriqué détectable en to-one.
alter table menu_items add constraint menu_items_stock_item_unique unique (stock_item_id);

create index idx_stock_items_destination on stock_items (destination);
