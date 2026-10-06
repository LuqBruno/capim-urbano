# Capim Urbano — Ateliê Floral

Site e catálogo digital da **Capim Urbano Ateliê Floral** (flores desidratadas, Tubarão/SC). O cliente conhece os produtos, filtra por ocasião, cor e faixa de preço, monta um pedido personalizado e conclui o atendimento pelo WhatsApp do ateliê.

Planejamento, requisitos e andamento ficam no Trello:
[Capim Urbano — Kanban de Requisitos, Design e Desenvolvimento](https://trello.com/b/l6GKHhLH/capim-urbano-kanban-de-requisitos-design-e-desenvolvimento)

## O que existe hoje

| Página | Arquivo | Descrição |
|---|---|---|
| Início e serviços | `index.html`, `servicos.html`, `assinatura-floral.html`, `eternizacao-de-flores.html`, `oficinas-florais.html`, `arranjos-e-presentes.html`, `contato.html` | Site institucional. |
| Catálogo | `catalogo.html` | Lista de produtos com filtros combináveis por ocasião, cor e faixa de preço. Os filtros ficam na URL (`?ocasiao=…&cor=…&faixa=…`). |
| Produto | `produto.html?id=<id>` | Fotos, preço, disponibilidade, prazo, durabilidade e cuidados. |
| Pedido | `pedido.html` (`?produto=<id>` opcional) | Formulário com validação, resumo e envio pelo WhatsApp. |
| Administração | `admin.html` | Cadastro de produtos (veja as limitações abaixo). |

Mapeamento com o Trello: US01–US05, RN01, RN02, NFR01 e NFR02 estão implementados. **US06 (administradora) está só parcialmente atendida**, porque não há login nem banco de dados.

## Como rodar

Não há build nem dependências. É um site estático.

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Abrir os arquivos direto pelo navegador (`file://`) também funciona, mas use um servidor para testar de forma fiel.

## Testes

Requer Node 18 ou superior.

```bash
node --test tests/catalogo-core.test.js   # regras de negócio (filtros, validação, mensagem do WhatsApp, cadastro)
node --test tests/e2e.test.js             # telas: fluxo, responsividade (375/768/1280px) e acessibilidade básica
```

Os testes de tela usam o pacote `playwright` (`npm i -g playwright`) e um Chromium. Sem o pacote, eles são ignorados. Use `CHROMIUM_PATH=/caminho/do/chromium` para apontar um navegador específico.

## Estrutura

```
index.html … contato.html   páginas do site
catalogo.html / produto.html / pedido.html / admin.html
styles.css                  estilos de todo o site (tokens em :root)
script.js                   menu, animações e rolagem do site institucional
catalogo-dados.js           produtos padrão (EXEMPLOS, veja abaixo)
catalogo-core.js            regras de negócio, sem DOM (testável em Node)
catalogo.js                 interface do catálogo, produto e pedido
admin.js                    interface da administração
tests/                      testes automatizados
imagens/web/                imagens otimizadas (.webp) usadas pelo site
```

## Como funciona o catálogo

- Os produtos vêm de `catalogo-dados.js`. Se a administradora salvar alterações em `admin.html`, elas ficam no `localStorage` do navegador dela e substituem o padrão **apenas naquele navegador**.
- Cada produto tem: `id`, `nome`, `categoria`, `descricao`, `fotos[]`, `preco` (número, ou `null` para "sob orçamento"), `disponibilidade` (`disponivel`, `sob-encomenda` ou `indisponivel`), `prazo`, `durabilidade`, `cuidados`, `ocasioes[]`, `cores[]` e `ativo`.
- Produto `indisponivel` aparece no catálogo, mas **não pode ser pedido** (RN01). Produto com `ativo: false` não aparece.
- O pedido exige nome, quantidade (1 a 99), ocasião e cores. Tamanho, orçamento, link de referência e observações são opcionais. O WhatsApp só é aberto depois do resumo e da confirmação do cliente.
- Número do WhatsApp: `5548991765295`, definido em `catalogo-core.js` (`WHATSAPP`) e nos links `wa.me` das páginas.

## Pendências conhecidas

1. **Preços, prazos e disponibilidade em `catalogo-dados.js` são exemplos** e precisam ser conferidos pela administradora antes de publicar.
2. **A administração não tem senha e não publica para os clientes.** Hoje o fluxo é: editar em `admin.html`, "Exportar JSON" e levar o conteúdo para `catalogo-dados.js`. O próximo passo é um backend com login e banco de dados.
3. **Referência visual no pedido é um link**, não um upload. O cliente pode enviar a imagem direto na conversa do WhatsApp.

## Identidade visual

- Fonte principal: **Quicksand** (acompanha a letra do logotipo). Títulos grandes e o "ateliê floral" usam **Cormorant Garamond**.
- Paleta: papel (`#f4f1ea`), sálvia, oliva e vinho (`#7a2937`). Os tokens ficam no início de `styles.css`.
- Meta de acessibilidade: foco visível, rótulos em todos os campos, mensagens de erro com `role="alert"`, contraste adequado e navegação por teclado.
