-- Uma única política de leitura (evita o aviso de políticas permissivas sobrepostas) e
-- políticas de escrita separadas por ação, sem repetir o SELECT.
drop policy "ler produtos ativos" on public.produtos;
drop policy "administradoras leem tudo" on public.produtos;
drop policy "administradoras escrevem" on public.produtos;

-- Visitantes leem só produtos ativos; administradoras leem tudo, inclusive desativados.
create policy "ler produtos" on public.produtos
  for select to anon, authenticated
  using (ativo = true or exists (select 1 from public.administradoras a where a.user_id = (select auth.uid())));

create policy "administradoras criam" on public.produtos
  for insert to authenticated
  with check (exists (select 1 from public.administradoras a where a.user_id = (select auth.uid())));

create policy "administradoras editam" on public.produtos
  for update to authenticated
  using (exists (select 1 from public.administradoras a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.administradoras a where a.user_id = (select auth.uid())));

create policy "administradoras apagam" on public.produtos
  for delete to authenticated
  using (exists (select 1 from public.administradoras a where a.user_id = (select auth.uid())));
