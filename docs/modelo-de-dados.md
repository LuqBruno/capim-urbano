# Modelo de dados

Dados do catálogo e do pedido. O catálogo mora na tabela `public.produtos` do Supabase (SQL em [`supabase/migrations/`](../supabase/migrations/)). `catalogo-dados.js` guarda os produtos de exemplo, usados na carga inicial e como reserva só quando o site não está configurado para o Supabase. As regras ficam em `catalogo-core.js`, que converte a linha do banco em produto (`linhaParaProduto`) e o produto em linha (`produtoParaLinha`).

## Produto

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| `id` | texto | sim | Identificador único em minúsculas e com hífens. Gerado pelo nome ao cadastrar (`Arranjo Ação` vira `arranjo-acao`, com sufixo `-2`, `-3` se já existir). Usado nos links `produto.html?id=` e `pedido.html?produto=`. |
| `nome` | texto | sim | |
| `categoria` | texto | sim | Ex.: Vasos, Buquês, Arranjos. |
| `descricao` | texto | sim | |
| `fotos` | lista de textos | sim, ao menos 1 | Caminho (`imagens/web/...`) ou link `https`, inclusive o endereço público de uma foto enviada ao bucket `produtos` (`<id>/<arquivo>-<marca>.webp|jpg|png`). A primeira é a capa. |
| `preco` | número ou `null` | não | Em reais, maior ou igual a 0. `null` aparece como "Sob orçamento". |
| `disponibilidade` | `disponivel`, `sob-encomenda` ou `indisponivel` | sim | Veja as regras abaixo. |
| `prazo` | texto | sim | Prazo de produção ou entrega (RN01). |
| `durabilidade` | texto | não | Se vazio, a página do produto mostra "Não informado. Consulte o ateliê pelo WhatsApp." (US04). |
| `cuidados` | texto | não | Mesmo tratamento de `durabilidade`. |
| `ocasioes` | lista de textos | não | Alimenta o filtro de ocasião. |
| `cores` | lista de textos | não | Alimenta o filtro de cor. |
| `ativo` | verdadeiro ou falso | não (padrão `true`) | `false` tira o produto do catálogo sem apagá-lo. No banco, quem não está logada só consegue ler `ativo = true`. |
| `criado_em`, `atualizado_em` | data e hora | gerados | Só existem no banco. `atualizado_em` é refeito por gatilho a cada alteração. Não fazem parte do produto no site. |

### Tabelas do banco

- `public.produtos`: colunas iguais aos campos acima (`preco` é `numeric(10,2)`; textos opcionais vazios são gravados como `null`). Restrições: `id` em minúsculas com hífens, textos obrigatórios não vazios, ao menos 1 foto, `preco >= 0` ou nulo e `disponibilidade` entre os três valores.
- `public.administradoras`: `user_id` (referência a `auth.users`). Quem está nesta tabela pode criar, editar e apagar produtos, ver os desativados e enviar fotos. Cada usuária só enxerga a própria linha.
- Storage: bucket público `produtos`, até 2 MB por arquivo, apenas `image/webp`, `image/jpeg` e `image/png`; só administradoras escrevem.

### Regras de disponibilidade e exibição (RN01)

| Situação | Catálogo | Página do produto | Pedido |
|---|---|---|---|
| `disponivel` | aparece com selo "Disponível" | botão "Fazer pedido" | permitido |
| `sob-encomenda` | aparece com selo "Sob encomenda" | botão "Fazer pedido" | permitido, valor e prazo confirmados no atendimento |
| `indisponivel` | aparece com selo "Indisponível" | só oferece "Pedir arranjo personalizado" | **bloqueado** (não gera resumo nem link) |
| `ativo: false` | **não aparece** | "Produto não encontrado" | produto ignorado no link |

Preço: `preco` numérico aparece formatado em reais; `null` aparece "Sob orçamento". O valor final sempre é confirmado no atendimento.

### Faixas de preço do filtro

| Chave | Rótulo | Regra |
|---|---|---|
| `ate-100` | Até R$ 100 | `0 <= preco < 100` |
| `100-200` | R$ 100 a R$ 200 | `100 <= preco < 200` |
| `acima-200` | Acima de R$ 200 | `preco >= 200` |
| `orcamento` | Sob orçamento | `preco` é `null` |

Produtos sem preço só aparecem em "Todas" ou em "Sob orçamento".

## Pedido (não é gravado)

O pedido não é armazenado: vira o texto de uma mensagem do WhatsApp.

| Campo | Obrigatório | Validação |
|---|---|---|
| `nome` | sim | ao menos 2 caracteres |
| `quantidade` | sim | inteiro de 1 a 99 |
| `ocasiao` | sim | texto livre, com sugestões do catálogo |
| `cores` | sim | texto livre |
| `tamanho` | não | Pequeno, Médio, Grande ou "Não sei, quero sugestão" |
| `orcamento` | não | uma das faixas listadas no formulário |
| `referencia` | não | link `http` ou `https` válido |
| `observacoes` | não | texto livre |
| produto | não | se vier de um produto `indisponivel`, o pedido é bloqueado |

## Segurança por linha (RLS)

| Quem | Lê produtos | Cria, edita e apaga | Fotos (Storage) |
|---|---|---|---|
| Visitante (chave publicável, sem login) | só `ativo = true` | não | lê pela URL pública; não lista o bucket nem envia |
| Conta logada que não é administradora | só `ativo = true` | não | igual ao visitante |
| Administradora | todos, inclusive desativados | sim | lista, envia, atualiza e apaga |

## Pendências de dados

Os produtos hoje no banco são os **exemplos** de `catalogo-dados.js` (preço, prazo e disponibilidade fictícios). A administradora deve conferir e corrigir todos em `admin.html` antes de divulgar o site.
