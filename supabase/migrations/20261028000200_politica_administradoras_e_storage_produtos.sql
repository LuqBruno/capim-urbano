-- A checagem "exists (select ... from administradoras)" das políticas de produtos roda com RLS.
-- Sem esta política a subconsulta nunca retornaria linha. Cada usuária lê apenas a própria linha.
create policy "ler a propria linha" on public.administradoras
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Bucket público de fotos: leitura pela URL pública, limite de tipo e de tamanho (2 MB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produtos', 'produtos', true, 2097152, array['image/webp','image/jpeg','image/png']);

-- Sem política de select para visitantes: a URL pública funciona sem ela e a listagem do bucket fica fechada.
create policy "administradoras listam fotos" on storage.objects
  for select to authenticated
  using (bucket_id = 'produtos' and exists (select 1 from public.administradoras a where a.user_id = (select auth.uid())));

create policy "administradoras enviam fotos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'produtos' and exists (select 1 from public.administradoras a where a.user_id = (select auth.uid())));

create policy "administradoras atualizam fotos" on storage.objects
  for update to authenticated
  using (bucket_id = 'produtos' and exists (select 1 from public.administradoras a where a.user_id = (select auth.uid())))
  with check (bucket_id = 'produtos' and exists (select 1 from public.administradoras a where a.user_id = (select auth.uid())));

create policy "administradoras apagam fotos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'produtos' and exists (select 1 from public.administradoras a where a.user_id = (select auth.uid())));
