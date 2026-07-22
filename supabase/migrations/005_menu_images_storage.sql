-- Hope Of Life — stockage des images du menu
-- Bucket public en lecture (les photos de plats doivent s'afficher sur le site
-- public sans authentification) mais réservé au personnel en écriture.

insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

create policy "public can read menu images"
on storage.objects for select
using (bucket_id = 'menu-images');

create policy "staff can upload menu images"
on storage.objects for insert
with check (bucket_id = 'menu-images' and is_staff());

create policy "staff can update menu images"
on storage.objects for update
using (bucket_id = 'menu-images' and is_staff());

create policy "staff can delete menu images"
on storage.objects for delete
using (bucket_id = 'menu-images' and is_staff());
