-- Tabelas do cadastro de produtos e das administradoras, com segurança por linha (RLS).
-- As políticas de produtos foram refeitas na migração 20261028000300.
create table public.produtos (
  id              text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nome            text not null check (length(trim(nome)) > 0),
  categoria       text not null check (length(trim(categoria)) > 0),
  descricao       text not null check (length(trim(descricao)) > 0),
  fotos           text[] not null check (array_length(fotos, 1) >= 1),
  preco           numeric(10,2) check (preco is null or preco >= 0),
  disponibilidade text not null check (disponibilidade in ('disponivel','sob-encomenda','indisponivel')),
  prazo           text not null check (length(trim(prazo)) > 0),
  durabilidade    text,
  cuidados        text,
  ocasioes        text[] not null default '{}',
  cores           text[] not null default '{}',
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create or replace function public.tocar_atualizado_em() returns trigger
language plpgsql set search_path = '' as $$
begin new.atualizado_em = now(); return new; end $$;

create trigger produtos_atualizado_em before update on public.produtos
for each row execute function public.tocar_atualizado_em();

create table public.administradoras (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.administradoras enable row level security;

alter table public.produtos enable row level security;

create policy "ler produtos ativos" on public.produtos
  for select using (ativo = true);

create policy "administradoras leem tudo" on public.produtos
  for select to authenticated
  using (exists (select 1 from public.administradoras a where a.user_id = (select auth.uid())));

create policy "administradoras escrevem" on public.produtos
  for all to authenticated
  using (exists (select 1 from public.administradoras a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.administradoras a where a.user_id = (select auth.uid())));
