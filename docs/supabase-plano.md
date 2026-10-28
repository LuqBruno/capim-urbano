# Integração com o Supabase

**Situação:** **implementado** em 2026-10-28, com duas pendências que dependem de uma pessoa (veja "O que falta" abaixo). O cadastro de produtos (`admin.html`) agora tem login e grava no banco, e o catálogo lê do banco. Isso fecha o card **US06** e a regra "alterações refletem no catálogo" da **RN01**.

| Item | Valor |
|---|---|
| Projeto | `capim-urbano` (plano Free, região `sa-east-1`, São Paulo) |
| Project ref | `gkpiwqztgzkuxvwrkpiy` |
| URL | https://gkpiwqztgzkuxvwrkpiy.supabase.co |
| Chave no site | somente a **publicável** (`sb_publishable_…`), em `src/lib/supabase-config.js`. A `service_role` não é usada nem gravada em nenhum arquivo |
| Migrações | [`supabase/migrations/`](../supabase/migrations/) |
| Administradora | uma conta, cadastrada em `public.administradoras` (e-mail informado pelo time no pedido do trabalho) |

## O que foi feito

- [x] **Passo 1:** tabela `public.produtos` (com gatilho de `atualizado_em`) e `public.administradoras`.
- [x] **Passo 2:** administradora cadastrada. Usuário criado por SQL com uma senha aleatória que ninguém conhece (veja "O que falta").
- [x] **Passo 3:** RLS. Visitante lê só `ativo = true`; só administradora escreve. Desvios em relação ao plano original, explicados abaixo.
- [x] **Passo 4:** bucket público `produtos` (2 MB; `image/webp`, `image/jpeg`, `image/png`), escrita só de administradoras.
- [x] **Advisors:** segurança e desempenho sem nenhum alerta após as migrações (verificado duas vezes: antes e depois de unificar as políticas).
- [x] **Passo 5:** `src/lib/supabase-config.js`, `carregarProdutos` assíncrona, estados de carregando e erro com "Tentar de novo" no catálogo, no produto e no pedido, login e cadastro no `admin.html`/`admin.js`, upload de fotos. Gravação em `localStorage` removida (e "Importar JSON" e "Restaurar padrão" também, que dependiam dela; "Exportar" virou "Baixar cópia").
- [x] **Passo 6:** carga inicial com os 7 produtos de `catalogo-dados.js` (**são exemplos**, veja "O que falta").
- [x] **Passo 7:** testes. `tests/catalogo-core.test.js` (conversão, foto, cliente, carga) e `tests/e2e.test.js` (Supabase simulado com `page.route`).
- [x] **Segurança:** testado com a chave publicável, sem login (veja "Verificação de segurança").

### Desvios em relação ao plano original

1. **Política em `administradoras`.** O plano dizia "sem políticas". Mas as políticas de `produtos` consultam essa tabela, e o RLS vale também dentro dessas consultas: com a tabela fechada, a checagem nunca acharia ninguém e **nem a administradora conseguiria escrever**. Foi criada a política `ler a propria linha` (cada usuária lê só o próprio `user_id`). Ninguém consegue listar as administradoras.
2. **Políticas de `produtos` unificadas.** O plano tinha 3 políticas, e duas liam o mesmo dado. O Supabase avisou "múltiplas políticas permissivas" no desempenho. Ficaram: `ler produtos` (visitante vê ativos; administradora vê tudo) e uma política por ação para escrever (`administradoras criam`, `editam`, `apagam`).
3. **Falha de rede no catálogo.** O plano falava em usar `CAPIM_PRODUTOS_PADRAO` como reserva em caso de falha. Isso exibiria preços e disponibilidade de **exemplo** como se fossem reais (e um produto marcado como indisponível no banco apareceria como disponível). Por isso a reserva só vale quando o site **não** está configurado para o Supabase. Se a busca falhar, a tela mostra o erro e "Tentar de novo". No pedido, se o produto do link não carregar, o envio fica bloqueado até a busca funcionar (RN01).
4. **Biblioteca.** O plano previa o `supabase-js` por CDN. Depois da migração do site para Astro (2026-10-28) ele é dependência do npm, com versão exata no `package.json`, e entra no bundle das páginas. Não há mais CDN nem `integrity`.
5. **Fotos do seed.** Os 7 produtos continuam com os caminhos `imagens/web/...` do site (a opção permitida no passo 6.3 do plano). Fotos novas vão para o bucket.

## O que falta (depende de uma pessoa)

1. **Definir a senha da administradora.** Ninguém conhece a senha atual (foi gerada aleatoriamente no banco). Em https://supabase.com/dashboard/project/gkpiwqztgzkuxvwrkpiy/auth/users, abra o menu (`...`) do usuário e escolha **Send password recovery** (chega ao e-mail da administradora), ou **Reset password**. Antes disso, configure em **Authentication → URL Configuration** o *Site URL* com o endereço onde o site for publicado (no GitHub Pages, `https://<usuário>.github.io/<repositório>/`), para o link do e-mail abrir a página certa. Nunca envie a senha por chat, e-mail ou commit.
2. **Desligar o cadastro público.** O ambiente de trabalho não tem ferramenta para mudar essa configuração. Em **Authentication → Sign In / Providers → Email**, desligue **Allow new users to sign up** (e, se aparecer, mantenha a confirmação de e-mail ligada). Enquanto estiver ligado, qualquer pessoa pode criar uma conta no Auth, mas **essa conta não escreve nada**: só quem está em `public.administradoras` escreve (isso foi testado). O risco restante é de abuso do serviço (contas de lixo), não de alteração de dados.
3. **Trocar os valores de exemplo.** Os 7 produtos do banco vêm de `catalogo-dados.js`: preços, prazos e disponibilidade são fictícios. A administradora deve conferir cada um em `admin.html` antes de divulgar o site.
4. **Plano e limites.** O projeto está no plano Free (pausa por inatividade e 500 MB de banco, 1 GB de arquivos). Pausar derrubaria o catálogo. Avaliar um plano pago antes de divulgar.

## Verificação de segurança

Feita em 2026-10-28 com a chave publicável e **sem login** (requisições reais à API do projeto):

| Tentativa | Resultado |
|---|---|
| `GET /rest/v1/produtos` | 7 produtos, todos `ativo = true` |
| `INSERT` em `produtos` | negado (`401`, `42501`, "violates row-level security policy") |
| `PATCH` em `produtos` | `200` com `[]`: nenhuma linha afetada (conferido no banco: nada mudou) |
| `DELETE` em `produtos` | `200` com `[]`: nenhuma linha afetada (conferido: 7 produtos intactos) |
| `GET /rest/v1/administradoras` | `[]` |
| Upload no bucket `produtos` | negado (`403`, RLS) |
| Listar o bucket | `[]` |
| Produto `ativo = false` visto como visitante | não aparece (testado em transação com `ROLLBACK`: 0 linhas da inativa, 6 de 7 visíveis) |
| Administradora (simulada por papel e `sub` da conta) | lê `administradoras`, vê produto inativo, cria, edita e apaga (transação revertida) |
| Conta logada que **não** é administradora | lê só ativos; não escreve |

Não foi possível testar o login real da administradora (a senha não é conhecida por design). Teste esse caminho ao definir a senha: entre em `admin.html`, crie um produto, veja-o no catálogo em outro aparelho e desative-o.

## Objetivo (plano original)

> As seções abaixo são o plano original, mantidas como referência. O SQL que vale é o de [`supabase/migrations/`](../supabase/migrations/) (veja os desvios acima).

- A administradora entra com e-mail e senha, e cadastra, edita, desativa produtos e envia fotos.
- Os clientes veem o catálogo sempre atualizado, sem exportar JSON nem publicar de novo.
- Só quem está autorizado consegue escrever. Qualquer visitante só lê produtos ativos.

## Pré-requisitos (cumpridos, exceto os do "O que falta")

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

> Situação: os critérios técnicos estão cumpridos. Falta confirmar o primeiro bloco depois que a administradora definir a senha.

- A administradora faz login, cria, edita e desativa um produto, e um visitante em outro aparelho vê a mudança sem exportar arquivo.
- Visitante sem login não consegue escrever nem ler produtos desativados.
- Nenhuma chave secreta no repositório. a chave `service_role` não é usada nem gravada em nenhum arquivo (só é citada em avisos).
- Estados de carregamento, vazio, sucesso e erro cobertos em celular, tablet e desktop.
- README, manual, modelo de dados e matriz de requisitos atualizados (US06 e RN01 passam a **atendidos**).

## Riscos e decisões em aberto

- **Quem administra e como recuperar a senha:** definir o e-mail e o fluxo de "esqueci a senha".
- **Hospedagem do site:** o site é estático. Qualquer hospedagem estática serve, porque a segurança está nas regras do banco, e não no servidor do site.
- **Custos e limites** do plano gratuito do Supabase: conferir antes de publicar.
- **Pedido no banco:** hoje o pedido só vira mensagem de WhatsApp. Guardar pedidos é outra decisão, com impacto em privacidade (LGPD), e **não** faz parte deste plano.
