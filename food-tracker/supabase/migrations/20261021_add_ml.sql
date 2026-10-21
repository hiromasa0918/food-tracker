-- Run once in Supabase SQL Editor before deploying the ml-enabled frontend.
alter table public.foods
  add column if not exists serving_unit text not null default 'g';

alter table public.foods
  add column if not exists basis_amount numeric not null default 100;

alter table public.foods
  add column if not exists basis_unit text not null default 'g';

update public.foods
set basis_unit = case when basis = '100ml' then 'ml' else 'g' end
where basis_unit = 'g' and basis = '100ml';

alter table public.foods
  drop constraint if exists foods_basis_check;

alter table public.foods
  add constraint foods_basis_check
  check (basis in ('100g', '100ml', 'serving'));

alter table public.foods
  drop constraint if exists foods_serving_unit_check;

alter table public.foods
  add constraint foods_serving_unit_check
  check (serving_unit in ('g', 'ml'));

alter table public.foods
  drop constraint if exists foods_basis_amount_check;

alter table public.foods
  add constraint foods_basis_amount_check
  check (basis_amount > 0);

alter table public.foods
  drop constraint if exists foods_basis_unit_check;

alter table public.foods
  add constraint foods_basis_unit_check
  check (basis_unit in ('g', 'ml'));

alter table public.diary_entries
  add column if not exists milliliters numeric;

alter table public.diary_entries
  drop constraint if exists diary_entries_milliliters_check;

alter table public.diary_entries
  add constraint diary_entries_milliliters_check
  check (milliliters is null or milliliters >= 0);

