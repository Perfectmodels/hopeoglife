-- Hope Of Life — durcissement des écritures publiques et des RPC privilégiées
--
-- Les formulaires publics sont traités par des Server Actions validées avec Zod
-- et utilisent la clé secrète uniquement côté serveur. La clé publique n'a donc
-- plus besoin d'un accès direct aux données clients, commandes ou demandes.

drop policy if exists "public can read customers" on public.customers;
drop policy if exists "public can create customers" on public.customers;
drop policy if exists "public can create orders" on public.orders;
drop policy if exists "public can create order items" on public.order_items;
drop policy if exists "public can create reservations" on public.reservations;
drop policy if exists "public can create event bookings" on public.event_bookings;
drop policy if exists "public can create privatization requests" on public.privatization_requests;
drop policy if exists "public can create contact messages" on public.contact_messages;

-- La validation d'une réception modifie plusieurs tables et contourne la RLS.
-- Elle ne doit être appelable que par le service backend, après contrôle du rôle.
alter function public.validate_stock_receipt(uuid, uuid)
  set search_path = public, pg_temp;

revoke all on function public.validate_stock_receipt(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.validate_stock_receipt(uuid, uuid)
  to service_role;
