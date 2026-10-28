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
| Administração | `admin.html` | Login (e-mail e senha) e cadastro de produtos com envio de fotos. Grava no Supabase e vale para todos os clientes. |

Mapeamento com o Trello: US01, US02, US04, **US06**, RN01 (regras), RN02 e NFR01 estão atendidos. **US03, US05 e NFR02 estão parciais**: veja o motivo na [matriz de requisitos](docs/matriz-de-requisitos.md).

## Documentação

- [Manual](docs/manual.md): uso para cliente, administradora e equipe técnica.
- [Modelo de dados](docs/modelo-de-dados.md): produto, pedido e regras de disponibilidade.
- [Matriz de requisitos](docs/matriz-de-requisitos.md): cards do Trello, código e testes.
- [Relatório de qualidade e desempenho](docs/relatorio-qualidade.md).
- [Plano de integração com o Supabase](docs/supabase-plano.md): o que foi feito, o projeto e o que falta (**implementado**; restam a senha da administradora e o ajuste de cadastro público no painel).

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

Os testes **não usam a rede**: o Supabase é simulado com `page.route` e a biblioteca `supabase-js` vem de uma cópia em `tests/vendor/`. A checagem das regras de segurança do banco (RLS) é feita à parte, no próprio Supabase (veja o [plano](docs/supabase-plano.md)).

## Estrutura

```
index.html … contato.html   páginas do site
catalogo.html / produto.html / pedido.html / admin.html
styles.css                  estilos de todo o site (tokens em :root)
script.js                   menu, animações e rolagem do site institucional
catalogo-dados.js           produtos padrão (EXEMPLOS, veja abaixo); reserva quando o Supabase não está configurado
supabase-config.js          URL do projeto e chave publicável do Supabase (nunca a service_role)
catalogo-core.js            regras de negócio, sem DOM (testável em Node)
catalogo.js                 interface do catálogo, produto e pedido
admin.js                    interface da administração
supabase/migrations/        SQL do banco (tabelas, RLS, Storage e carga inicial)
scripts/gerar-seed.js       gera o SQL de carga inicial a partir de catalogo-dados.js
tests/                      testes automatizados (tests/vendor: cópia do supabase-js para rodar sem rede)
imagens/web/                imagens otimizadas (.webp) usadas pelo site
```

## Como funciona o catálogo

- Os produtos vêm da tabela `produtos` do Supabase. O catálogo mostra "Carregando produtos…" enquanto busca e, se a busca falhar, uma mensagem com o botão "Tentar de novo" (os exemplos de `catalogo-dados.js` **não** são exibidos no lugar, para não mostrar preço ou disponibilidade desatualizados). Só quando `supabase-config.js` não estiver configurado o site usa `catalogo-dados.js`.
- A administradora entra em `admin.html` com e-mail e senha e cadastra, edita, ativa, desativa e envia fotos (bucket `produtos`). A regra de quem pode escrever está no banco (RLS), não na tela.
- Cada produto tem: `id`, `nome`, `categoria`, `descricao`, `fotos[]`, `preco` (número, ou `null` para "sob orçamento"), `disponibilidade` (`disponivel`, `sob-encomenda` ou `indisponivel`), `prazo`, `durabilidade`, `cuidados`, `ocasioes[]`, `cores[]` e `ativo`.
- Produto `indisponivel` aparece no catálogo, mas **não pode ser pedido** (RN01). Produto com `ativo: false` não aparece.
- O pedido exige nome, quantidade (1 a 99), ocasião e cores. Tamanho, orçamento, link de referência e observações são opcionais. O WhatsApp só é aberto depois do resumo e da confirmação do cliente.
- Número do WhatsApp: `5548991765295`, definido em `catalogo-core.js` (`WHATSAPP`) e nos links `wa.me` das páginas.

## Pendências conhecidas

1. **Preços, prazos e disponibilidade em `catalogo-dados.js` são exemplos** e precisam ser conferidos pela administradora antes de publicar.
2. **A senha da administradora ainda precisa ser definida por ela** e o **cadastro público de usuários deve ser desligado no painel do Supabase**. Os passos estão em [docs/supabase-plano.md](docs/supabase-plano.md). Os produtos hoje no banco são os exemplos de `catalogo-dados.js`.
3. **Referência visual no pedido é um link**, não um upload. O cliente pode enviar a imagem direto na conversa do WhatsApp.

## Identidade visual

- Fonte principal: **Quicksand** (acompanha a letra do logotipo). Títulos grandes e o "ateliê floral" usam **Cormorant Garamond**.
- Paleta: papel (`#f4f1ea`), sálvia, oliva e vinho (`#7a2937`). Os tokens ficam no início de `styles.css`.
- Meta de acessibilidade: foco visível, rótulos em todos os campos, mensagens de erro com `role="alert"`, contraste adequado e navegação por teclado.
