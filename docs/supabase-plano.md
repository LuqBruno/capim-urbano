# Plano de integração com o Supabase (a fazer depois)

**Situação:** ainda **não implementado**. Hoje o cadastro de produtos (`admin.html`) guarda os dados no navegador de quem edita e não tem login. Este documento descreve como ligar o cadastro a um banco de dados com login para fechar o card **US06** e a regra "alterações refletem no catálogo" da **RN01**.

Nada aqui foi criado no Supabase ainda: não existe projeto, tabela, política nem usuário configurado por este repositório.

## Objetivo

- A administradora entra com e-mail e senha, e cadastra, edita, desativa produtos e envia fotos.
- Os clientes veem o catálogo sempre atualizado, sem exportar JSON nem publicar de novo.
- Só quem está autorizado consegue escrever. Qualquer visitante só lê produtos ativos.

## Pré-requisitos

1. Um projeto Supabase (crie em https://supabase.com e anote a **URL do projeto** e a **chave publicável** (`anon`/publishable)).
2. Reautorizar o conector do Supabase em https://claude.ai/customize/connectors, se a ideia for deixar o Claude aplicar as migrações.
3. Decidir quem será administradora (e-mail) e se haverá mais de uma pessoa.

**Segredos:** use somente a URL e a chave publicável no site. **Nunca** coloque a chave `service_role` no repositório nem no navegador. Ela ignora todas as regras de segurança.

## Passo 1: tabela de produtos

Mantém exatamente os campos do [modelo de dados](modelo-de-dados.md), com nomes em minúsculas e sem acento.

```sql
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
```

## Passo 2: quem é administradora

```sql
create table public.administradoras (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.administradoras enable row level security;
-- sem políticas: ninguém lê nem escreve pela API. Só o painel/SQL cadastra administradoras.
```

Depois de criar o usuário em Authentication → Users, cadastre-o pelo SQL Editor:

```sql
insert into public.administradoras (user_id) values ('<uuid do usuário>');
```

No painel, **desative o cadastro público** (Authentication → Providers → Email → "Allow new users to sign up" desligado), para ninguém criar conta sozinho.

## Passo 3: segurança por linha (RLS)

Obrigatório antes de usar a chave publicável no site.

```sql
alter table public.produtos enable row level security;

-- Visitantes (e logados) leem só produtos ativos.
create policy "ler produtos ativos" on public.produtos
  for select using (ativo = true);

-- Administradoras leem tudo, inclusive desativados.
create policy "administradoras leem tudo" on public.produtos
  for select to authenticated
  using (exists (select 1 from public.administradoras a where a.user_id = (select auth.uid())));

-- Administradoras criam, editam e apagam.
create policy "administradoras escrevem" on public.produtos
  for all to authenticated
  using (exists (select 1 from public.administradoras a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.administradoras a where a.user_id = (select auth.uid())));
```

Depois de aplicar, rode os verificadores de segurança do Supabase (Advisors) e confirme que não há alertas para `produtos` e `administradoras`.

## Passo 4: fotos (Storage)

- Crie o bucket público `produtos` (leitura pública, para as fotos aparecerem no catálogo).
- Política de escrita: só administradoras (`insert`, `update` e `delete` em `storage.objects` com `bucket_id = 'produtos'` e a mesma checagem da tabela `administradoras`).
- No cadastro, enviar o arquivo para `produtos/<id-do-produto>/<arquivo>.webp` e gravar a URL pública em `fotos`. Limitar tipo (`image/webp`, `image/jpeg`, `image/png`) e tamanho (por exemplo 2 MB).

## Passo 5: ajustes no código

| Arquivo | Mudança |
|---|---|
| novo `supabase-config.js` | Exporta `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`. Só chaves públicas. |
| `catalogo-core.js` | `carregarProdutos` passa a ser assíncrona: busca em `produtos` (apenas `ativo = true` para clientes) e, se falhar, usa `CAPIM_PRODUTOS_PADRAO` como reserva. Conversão de nomes de colunas fica numa função pura, testável. |
| `catalogo.js` | Aguarda os dados e mostra o estado "Carregando produtos…" e uma mensagem de erro com botão "Tentar de novo" se a busca falhar (US01 e NFR02). |
| `admin.js` | Tela de login (e-mail e senha) com `signInWithPassword`; salvar, editar, ativar e desativar via `upsert`/`update`; upload de fotos no Storage; botão "Sair". Mantém os estados de carregamento, vazio, sucesso e erro. |
| `admin.html` | Formulário de login e área protegida visível só após entrar. A página continua `noindex`. |
| carregar a biblioteca | `@supabase/supabase-js` por CDN fixando a versão (ou copiada para o repositório), carregada antes de `catalogo-core.js`. |

Ao ligar o banco, **remova** a gravação no `localStorage` e os botões "Exportar/Importar JSON" e "Restaurar padrão" do `admin.js`, ou deixe-os apenas como ferramenta de backup para administradoras logadas.

## Passo 6: migrar os dados atuais

1. Conferir com a administradora os valores reais (preços, prazos e disponibilidade em `catalogo-dados.js` são **exemplos**).
2. Gerar os `insert` a partir de `catalogo-dados.js` (um script `scripts/gerar-seed.js` pode converter a lista em SQL) e aplicar no banco.
3. Subir as imagens de `imagens/web/` para o bucket e atualizar `fotos`, ou manter os caminhos relativos enquanto as fotos permanecerem no site.

## Passo 7: testes

- **Unitários:** função de conversão de linhas do banco para produtos e de produtos para linhas, com os mesmos casos de `tests/catalogo-core.test.js`.
- **Telas (`tests/e2e.test.js`):** interceptar as chamadas ao Supabase (`page.route`) com respostas simuladas, para não depender da rede nem de dados reais. Cobrir: catálogo carregando, erro de rede com "Tentar de novo", login inválido, login válido, cadastro, edição, desativação e produto indisponível bloqueando o pedido.
- **Segurança (manual, uma vez):** com a chave publicável e sem login, tentar `insert`, `update` e `delete` em `produtos` e confirmar que são negados, e que produtos `ativo = false` não aparecem.

## Critérios de pronto

- A administradora faz login, cria, edita e desativa um produto, e um visitante em outro aparelho vê a mudança sem exportar arquivo.
- Visitante sem login não consegue escrever nem ler produtos desativados.
- Nenhuma chave secreta no repositório. `service_role` não aparece em nenhum arquivo.
- Estados de carregamento, vazio, sucesso e erro cobertos em celular, tablet e desktop.
- README, manual, modelo de dados e matriz de requisitos atualizados (US06 e RN01 passam a **atendidos**).

## Riscos e decisões em aberto

- **Quem administra e como recuperar a senha:** definir o e-mail e o fluxo de "esqueci a senha".
- **Hospedagem do site:** o site é estático. Qualquer hospedagem estática serve, porque a segurança está nas regras do banco, e não no servidor do site.
- **Custos e limites** do plano gratuito do Supabase: conferir antes de publicar.
- **Pedido no banco:** hoje o pedido só vira mensagem de WhatsApp. Guardar pedidos é outra decisão, com impacto em privacidade (LGPD), e **não** faz parte deste plano.
