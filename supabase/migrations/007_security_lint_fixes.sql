-- Hope Of Life — corrections suite au linter de sécurité Supabase
-- 1. Fixe le search_path mutable sur les fonctions SECURITY DEFINER (évite un
--    détournement via un search_path manipulé par l'appelant).
-- 2. Retire la policy SELECT publique sur storage.objects pour menu-images :
--    le bucket est déjà marqué "public" (storage.buckets.public = true), donc
--    la lecture par URL publique (getPublicUrl) fonctionne sans cette policy.
--    La policy actuelle permet en plus le LISTING de tous les fichiers du
--    bucket via l'API, ce qui n'est pas nécessaire et élargit la surface.

create or replace function is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from employees
    where id = auth.uid() and active = true
  );
$$;

create or replace function record_login_attempt(p_email text, p_success boolean)
returns void
language sql
security definer
set search_path = public
as $$
  insert into login_attempts (email, success) values (lower(p_email), p_success);
$$;

create or replace function count_recent_failed_logins(p_email text, p_minutes int default 15)
returns int
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::int
  from login_attempts
  where email = lower(p_email)
    and success = false
    and created_at > now() - (p_minutes || ' minutes')::interval;
$$;

drop policy if exists "public can read menu images" on storage.objects;
