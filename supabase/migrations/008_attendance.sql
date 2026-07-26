-- Hope Of Life — pointage par géolocalisation
-- Un employé pointe son arrivée/départ depuis son téléphone/la tablette du
-- POS ; la position GPS est comparée à celle du restaurant pour vérifier
-- qu'il est bien sur place (contrôle appliqué côté serveur, voir
-- src/lib/attendance.ts).

create table attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  clock_in timestamptz not null default now(),
  clock_in_lat numeric(10,7) not null,
  clock_in_lng numeric(10,7) not null,
  clock_in_distance_m numeric(10,2) not null,
  clock_out timestamptz,
  clock_out_lat numeric(10,7),
  clock_out_lng numeric(10,7),
  clock_out_distance_m numeric(10,2),
  status text not null default 'ouvert' check (status in ('ouvert', 'ferme')),
  created_at timestamptz not null default now()
);

create index idx_attendance_employee on attendance(employee_id, clock_in desc);
create unique index idx_attendance_one_open_per_employee on attendance(employee_id) where status = 'ouvert';

alter table attendance enable row level security;
create policy "staff full access" on attendance for all using (is_staff()) with check (is_staff());
