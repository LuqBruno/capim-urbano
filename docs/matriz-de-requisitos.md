# Matriz de requisitos

Rastreabilidade entre os cards do Trello, o código e os testes. Situação: **atendido**, **parcial** ou **pendente**.

| Card | Requisito | Situação | Onde está | Testes |
|---|---|---|---|---|
| US01 | Ver catálogo com foto, nome, categoria, preço, disponibilidade e prazo | atendido | `src/paginas/Catalogo.astro`, `src/scripts/catalogo.js` | `e2e` (catálogo, responsivo) |
| US02 | Filtrar por ocasião, cor e faixa, combinar, limpar, mensagem sem resultado | atendido | `src/scripts/catalogo.js`, `filtrarProdutos` | `core` (filtros, faixas), `e2e` (filtros) |
| US03 | Pedido personalizado com ocasião, cores, tamanho, orçamento, observações e referência | parcial | `src/paginas/Pedido.astro` | `core` (validação), `e2e` (pedido) |
| US04 | Cuidados, durabilidade e prazo por produto, legíveis em qualquer tela | atendido | `src/paginas/Produto.astro`, `textoOuAviso` | `core` (aviso), `e2e` (produto com e sem dados) |
| US05 | Mensagem de WhatsApp com produto, quantidade e personalizações | parcial | `montarMensagem`, `montarLinkWhatsApp` | `core` (mensagem, link), `e2e` (pedido) |
| US06 | Administradora cadastra, edita e desativa produtos, com validação, refletindo no catálogo | atendido | `src/pages/admin.astro`, `src/scripts/admin.js`, `supabase/migrations/` | `e2e` (login inválido e válido, cadastro com foto, edição, desativar, estados), `core` (conversão banco ↔ produto, foto); RLS verificada no Supabase |
| RN01 | Disponibilidade, preço e prazo; indisponível não gera pedido; alterações aparecem no catálogo | atendido (vale para todos os clientes) | `validarPedido`, `filtrarProdutos`, tabela `produtos` | `core` (indisponível), `e2e` (edição reflete no catálogo e bloqueia pedido, inclusive em outra aba de visitante) |
| RN02 | Personalização com resumo e validação antes do WhatsApp | atendido | `validarPedido`, `src/paginas/Pedido.astro` | `core`, `e2e` |
| NFR01 | Responsivo em celular, tablet e desktop | atendido | `src/styles/global.css` (Tailwind) e classes utilitárias nas páginas | `e2e` (5 páginas em 375, 768 e 1280 px) |
| NFR02 | Acessibilidade, desempenho e estados de carregamento, vazio e erro | atendido (falta só a verificação manual com leitor de tela e outros navegadores) | todo o site | `e2e` (axe-core WCAG 2.2 AA em todas as páginas, rótulos, `alt`, `lang`, teclado, estados de carregando, vazio e erro); [relatório](relatorio-qualidade.md) |
| REQ01 | Requisitos funcionais e não funcionais do MVP | parcial | este documento | todos |
| DS01 | Design system (paleta, tipografia, componentes) | parcial | tokens no `@theme` de `src/styles/global.css` (Tailwind CSS 4), componentes `.astro` em `src/components/` | n/a (wireframes e protótipo ficam no Trello/Figma) |
| DEV01 | Estrutura técnica, modelo de dados, WhatsApp e testes | atendido (testes de regressão automáticos) | `src/lib/catalogo-core.js`, `tests/` | 36 testes de regras + 63 de telas |

## Fora do Trello

| Pedido | Situação | Onde está | Testes |
|---|---|---|---|
| Site em inglês e espanhol, além do português | atendido nas páginas públicas (administração e 404 só em português; dados dos produtos em português; traduções a revisar) | `src/i18n/`, `src/paginas/`, `src/pages/[lingua]/[pagina].astro` | `i18n` (chaves das três línguas, preço, validação, mensagem, RN01 em toda língua), `e2e` (páginas sem erro, seletor de idioma, catálogo em espanhol, pedido em inglês, axe) |
| Estilo com Tailwind CSS no lugar do CSS próprio | atendido (mesmo visual; componentes reaproveitados, estados dos scripts e herbário seguem em `@layer components`) | `astro.config.mjs`, `src/styles/global.css`, classes utilitárias em `src/paginas/` e `src/components/` | `e2e` (telas, rolagem horizontal, axe em celular e desktop) |

## Por que US03 e US05 estão parciais

- **US03:** a referência visual é um **link**; não há upload de imagem (o cliente pode enviar a foto na conversa do WhatsApp).
- **US05:** o pedido é de **um produto por vez**; não há carrinho com vários itens.

## US06 e RN01 atendidos com ressalvas

- As alterações agora valem para todos os clientes (banco Supabase com login da administradora). Detalhes em [supabase-plano.md](supabase-plano.md).
- **Feito em 03/11/2026:** cadastro público desligado, conta única de administradora com senha definida e os 7 produtos do banco aprovados como oficiais pelo Product Owner.
- **Ainda por conta de uma pessoa:** trocar a senha da administradora por uma longa (12 caracteres ou mais).
- A RLS foi verificada no próprio Supabase (visitante sem login: escrita negada e desativados invisíveis); os testes automáticos simulam o Supabase e **não** exercitam a RLS real.

## Pontos ainda sem evidência automática

- Teste em aparelhos físicos e em Safari ou Firefox (os testes rodam em Chromium).
- Leitor de tela real.
