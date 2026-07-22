-- Hope Of Life — Row Level Security
-- Règle générale : le personnel authentifié (présent et actif dans `employees`)
-- a accès complet aux données internes. Le public (clé anon, visiteurs du site)
-- ne peut que consulter le menu/les événements publiés et déposer des
-- réservations, commandes, demandes de contact/privatisation.

create or replace function is_staff()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from employees
    where id = auth.uid() and active = true
  );
$$;

-- =========================================================
-- Tables internes : accès complet au personnel authentifié
-- =========================================================
alter table employees enable row level security;
alter table dining_areas enable row level security;
alter table dining_tables enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table menu_item_variants enable row level security;
alter table cash_sessions enable row level security;
alter table cash_movements enable row level security;
alter table payments enable row level security;
alter table stock_items enable row level security;
alter table stock_movements enable row level security;
alter table activity_logs enable row level security;
alter table settings enable row level security;
alter table event_bookings enable row level security;
alter table privatization_requests enable row level security;
alter table contact_messages enable row level security;

create policy "staff full access" on employees for all using (is_staff()) with check (is_staff());
create policy "staff can read own row" on employees for select using (id = auth.uid());
create policy "staff full access" on dining_areas for all using (is_staff()) with check (is_staff());
create policy "staff full access" on dining_tables for all using (is_staff()) with check (is_staff());
create policy "staff full access" on menu_item_variants for all using (is_staff()) with check (is_staff());
create policy "staff full access" on cash_sessions for all using (is_staff()) with check (is_staff());
create policy "staff full access" on cash_movements for all using (is_staff()) with check (is_staff());
create policy "staff full access" on payments for all using (is_staff()) with check (is_staff());
create policy "staff full access" on stock_items for all using (is_staff()) with check (is_staff());
create policy "staff full access" on stock_movements for all using (is_staff()) with check (is_staff());
create policy "staff full access" on activity_logs for all using (is_staff()) with check (is_staff());
create policy "staff full access" on settings for all using (is_staff()) with check (is_staff());
create policy "staff full access" on event_bookings for all using (is_staff()) with check (is_staff());
create policy "staff full access" on privatization_requests for all using (is_staff()) with check (is_staff());
create policy "staff full access" on contact_messages for all using (is_staff()) with check (is_staff());

-- Menu : le personnel gère tout, le public consulte les produits disponibles.
create policy "staff full access" on menu_categories for all using (is_staff()) with check (is_staff());
create policy "public can read menu categories" on menu_categories for select using (true);
create policy "staff full access" on menu_items for all using (is_staff()) with check (is_staff());
create policy "public can read available menu items" on menu_items for select using (is_available = true);

-- =========================================================
-- Réservations : le personnel gère tout, le public peut créer une demande.
-- =========================================================
alter table reservations enable row level security;
create policy "staff full access" on reservations for all using (is_staff()) with check (is_staff());
create policy "public can create reservations" on reservations for insert with check (true);

-- =========================================================
-- Commandes : le personnel gère tout, le public peut créer une commande en ligne.
-- =========================================================
alter table orders enable row level security;
alter table order_items enable row level security;
create policy "staff full access" on orders for all using (is_staff()) with check (is_staff());
create policy "public can create orders" on orders for insert with check (source = 'site_web');
create policy "staff full access" on order_items for all using (is_staff()) with check (is_staff());
create policy "public can create order items" on order_items for insert with check (true);

-- =========================================================
-- Clients : le personnel gère tout, le public peut créer/consulter par
-- correspondance téléphonique (nécessaire pour rattacher une commande en ligne).
-- =========================================================
alter table customers enable row level security;
create policy "staff full access" on customers for all using (is_staff()) with check (is_staff());
create policy "public can create customers" on customers for insert with check (true);
create policy "public can read customers" on customers for select using (true);

-- =========================================================
-- Événements : le personnel gère tout, le public consulte les événements publiés.
-- =========================================================
alter table events enable row level security;
create policy "staff full access" on events for all using (is_staff()) with check (is_staff());
create policy "public can read published events" on events for select using (is_published = true);
create policy "public can create event bookings" on event_bookings for insert with check (true);

-- =========================================================
-- Privatisation / contact : le public peut uniquement déposer une demande.
-- =========================================================
create policy "public can create privatization requests" on privatization_requests for insert with check (true);
create policy "public can create contact messages" on contact_messages for insert with check (true);
