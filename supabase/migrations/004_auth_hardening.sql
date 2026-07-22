-- Hope Of Life — durcissement de l'authentification
-- Historique des tentatives de connexion (protection anti-bruteforce) et
-- fonctions security definer pour les manipuler sans exposer la table
-- directement aux utilisateurs non authentifiés.

create table login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  success boolean not null,
  created_at timestamptz not null default now()
);

create index idx_login_attempts_email_date on login_attempts(email, created_at desc);

alter table login_attempts enable row level security;
create policy "staff full access" on login_attempts for all using (is_staff()) with check (is_staff());

-- Aucune policy publique : les fonctions ci-dessous, en security definer,
-- contournent RLS pour l'usage précis de l'écran de connexion.

create or replace function record_login_attempt(p_email text, p_success boolean)
returns void
language sql
security definer
as $$
  insert into login_attempts (email, success) values (lower(p_email), p_success);
$$;

create or replace function count_recent_failed_logins(p_email text, p_minutes int default 15)
returns int
language sql
security definer
stable
as $$
  select count(*)::int
  from login_attempts
  where email = lower(p_email)
    and success = false
    and created_at > now() - (p_minutes || ' minutes')::interval;
$$;

grant execute on function record_login_attempt(text, boolean) to anon, authenticated;
grant execute on function count_recent_failed_logins(text, int) to anon, authenticated;
