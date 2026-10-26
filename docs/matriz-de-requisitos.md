# Matriz de requisitos

Rastreabilidade entre os cards do Trello, o código e os testes. Situação: **atendido**, **parcial** ou **pendente**.

| Card | Requisito | Situação | Onde está | Testes |
|---|---|---|---|---|
| US01 | Ver catálogo com foto, nome, categoria, preço, disponibilidade e prazo | atendido | `catalogo.html`, `catalogo.js` | `e2e` (catálogo, responsivo) |
| US02 | Filtrar por ocasião, cor e faixa, combinar, limpar, mensagem sem resultado | atendido | `catalogo.js`, `filtrarProdutos` | `core` (filtros, faixas), `e2e` (filtros) |
| US03 | Pedido personalizado com ocasião, cores, tamanho, orçamento, observações e referência | parcial | `pedido.html` | `core` (validação), `e2e` (pedido) |
| US04 | Cuidados, durabilidade e prazo por produto, legíveis em qualquer tela | atendido | `produto.html`, `textoOuAviso` | `core` (aviso), `e2e` (produto com e sem dados) |
| US05 | Mensagem de WhatsApp com produto, quantidade e personalizações | parcial | `montarMensagem`, `montarLinkWhatsApp` | `core` (mensagem, link), `e2e` (pedido) |
| US06 | Administradora cadastra, edita e desativa produtos, com validação, refletindo no catálogo | parcial | `admin.html`, `admin.js` | `e2e` (cadastro, edição, desativar, estados) |
| RN01 | Disponibilidade, preço e prazo; indisponível não gera pedido; alterações aparecem no catálogo | atendido neste navegador | `validarPedido`, `filtrarProdutos` | `core` (indisponível), `e2e` (edição reflete no catálogo e bloqueia pedido) |
| RN02 | Personalização com resumo e validação antes do WhatsApp | atendido | `validarPedido`, `pedido.html` | `core`, `e2e` |
| NFR01 | Responsivo em celular, tablet e desktop | atendido | `styles.css` | `e2e` (5 páginas em 375, 768 e 1280 px) |
| NFR02 | Acessibilidade, desempenho e estados de carregamento, vazio e erro | parcial | todo o site | `e2e` (rótulos, `alt`, `lang`, menu por teclado); [relatório](relatorio-qualidade.md) |
| REQ01 | Requisitos funcionais e não funcionais do MVP | parcial | este documento | todos |
| DS01 | Design system (paleta, tipografia, componentes) | parcial | tokens em `styles.css` | n/a (wireframes e protótipo ficam no Trello/Figma) |
| DEV01 | Estrutura técnica, modelo de dados, WhatsApp e testes | atendido (testes de regressão automáticos) | `catalogo-core.js`, `tests/` | 36 testes |

## Por que US03, US05 e US06 estão parciais

- **US03:** a referência visual é um **link**; não há upload de imagem (o cliente pode enviar a foto na conversa do WhatsApp).
- **US05:** o pedido é de **um produto por vez**; não há carrinho com vários itens.
- **US06 e RN01 ("alterações refletem no catálogo"):** acontece apenas **no navegador de quem edita**. Falta banco de dados e login para valer para todos os clientes. O passo a passo está em [supabase-plano.md](supabase-plano.md).

## Pontos ainda sem evidência automática

- Contraste de cores medido (apenas conferência visual).
- Teste em aparelhos físicos e em Safari ou Firefox (os testes rodam em Chromium).
- Leitor de tela real.
