# Modelo de dados

Dados do catálogo e do pedido. O catálogo mora em `catalogo-dados.js` (padrão) e, quando a administradora salva alterações em `admin.html`, em `localStorage` no navegador dela (chave `capim.produtos.v1`). As regras ficam em `catalogo-core.js`.

## Produto

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| `id` | texto | sim | Identificador único em minúsculas e com hífens. Gerado pelo nome ao cadastrar (`Arranjo Ação` vira `arranjo-acao`, com sufixo `-2`, `-3` se já existir). Usado nos links `produto.html?id=` e `pedido.html?produto=`. |
| `nome` | texto | sim | |
| `categoria` | texto | sim | Ex.: Vasos, Buquês, Arranjos. |
| `descricao` | texto | sim | |
| `fotos` | lista de textos | sim, ao menos 1 | Caminho (`imagens/web/...`) ou link `https`. A primeira é a capa. |
| `preco` | número ou `null` | não | Em reais, maior ou igual a 0. `null` aparece como "Sob orçamento". |
| `disponibilidade` | `disponivel`, `sob-encomenda` ou `indisponivel` | sim | Veja as regras abaixo. |
| `prazo` | texto | sim | Prazo de produção ou entrega (RN01). |
| `durabilidade` | texto | não | Se vazio, a página do produto mostra "Não informado. Consulte o ateliê pelo WhatsApp." (US04). |
| `cuidados` | texto | não | Mesmo tratamento de `durabilidade`. |
| `ocasioes` | lista de textos | não | Alimenta o filtro de ocasião. |
| `cores` | lista de textos | não | Alimenta o filtro de cor. |
| `ativo` | verdadeiro ou falso | não (padrão `true`) | `false` tira o produto do catálogo sem apagá-lo. |

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

## Limitação atual

Os dados dos produtos ficam no navegador de quem edita. Para que a alteração chegue aos clientes é preciso exportar o JSON e atualizar `catalogo-dados.js`. O passo seguinte é uma tabela `produtos` em um banco com login da administradora (Supabase foi a opção levantada), mantendo exatamente os campos acima.
