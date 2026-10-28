# Capim Urbano — Ateliê Floral

Site e catálogo digital da **Capim Urbano Ateliê Floral** (flores desidratadas, Tubarão/SC). O cliente conhece os produtos, filtra por ocasião, cor e faixa de preço, monta um pedido personalizado e conclui o atendimento pelo WhatsApp do ateliê.

Planejamento, requisitos e andamento ficam no Trello:
[Capim Urbano — Kanban de Requisitos, Design e Desenvolvimento](https://trello.com/b/l6GKHhLH/capim-urbano-kanban-de-requisitos-design-e-desenvolvimento)

## O que existe hoje

Site feito com [Astro](https://astro.build/) (saída estática) e Supabase. Cada página fica em `src/pages/<nome>.astro` e é publicada como `<nome>.html`, então os endereços são os mesmos de sempre.

| Página | Arquivo | Descrição |
|---|---|---|
| Início e serviços | `index`, `servicos`, `assinatura-floral`, `eternizacao-de-flores`, `oficinas-florais`, `arranjos-e-presentes`, `contato` | Site institucional. |
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

Requer **Node 22.23.4 ou superior** (exigência do Astro 7) e npm.

```bash
npm install          # uma vez
npm run dev          # servidor de desenvolvimento em http://localhost:4321
npm run build        # gera o site estático em dist/
npm run preview      # serve o dist/ para conferir o resultado final
```

A pasta `dist/` é o site pronto: qualquer hospedagem estática serve (Netlify, Vercel, GitHub Pages, Cloudflare Pages…). Como os produtos vêm do Supabase no navegador, **alterar um produto em `admin.html` não exige refazer o build**.

Abrir os arquivos direto pelo navegador (`file://`) também funciona, mas use um servidor para testar de forma fiel.

## Testes

Requer Node 18 ou superior.

```bash
npm test                                  # regras de negócio (filtros, validação, mensagem do WhatsApp, cadastro, conversão com o banco)
npm run test:e2e                          # constrói o site e testa as telas: fluxo, responsividade (375/768/1280px) e acessibilidade básica
```

Os testes de tela abrem o `dist/` e usam o pacote `playwright` (`npm i -g playwright`, com `NODE_PATH` apontando para a pasta global de módulos) e um Chromium. Sem o pacote, eles são ignorados. Use `CHROMIUM_PATH=/caminho/do/chromium` para apontar um navegador específico.

Os testes **não usam a rede**: o Supabase é simulado com `page.route` e o `supabase-js` já vai dentro do bundle do site. A checagem das regras de segurança do banco (RLS) é feita à parte, no próprio Supabase (veja o [plano](docs/supabase-plano.md)).

## Estrutura

```
astro.config.mjs            configuração do Astro (saída estática, páginas como nome.html)
package.json                scripts e dependências (astro e @supabase/supabase-js)
src/pages/*.astro           uma página por arquivo (index, servicos, catalogo, produto, pedido, admin…)
src/layouts/Base.astro      <head>, cabeçalho, rodapé e scripts comuns a todas as páginas
src/components/             Header.astro (menu com página atual) e Footer.astro
src/styles/styles.css       estilos de todo o site (tokens em :root)
src/scripts/site.js         menu, animações e rolagem do site institucional
src/scripts/catalogo.js     interface do catálogo, produto e pedido
src/scripts/admin.js        interface da administração
src/lib/catalogo-core.js    regras de negócio, sem DOM (módulo ES testável em Node)
src/lib/catalogo-dados.js   produtos padrão (EXEMPLOS, veja abaixo); reserva quando o Supabase não está configurado
src/lib/supabase-config.js  URL do projeto e chave publicável do Supabase (nunca a service_role)
public/imagens/web/         imagens otimizadas (.webp) usadas pelo site (copiadas para dist/imagens/web/)
supabase/migrations/        SQL do banco (tabelas, RLS, Storage e carga inicial)
scripts/gerar-seed.js       gera o SQL de carga inicial a partir de catalogo-dados.js
tests/                      testes automatizados
```

## Como funciona o catálogo

- Os produtos vêm da tabela `produtos` do Supabase. O catálogo mostra "Carregando produtos…" enquanto busca e, se a busca falhar, uma mensagem com o botão "Tentar de novo" (os exemplos de `catalogo-dados.js` **não** são exibidos no lugar, para não mostrar preço ou disponibilidade desatualizados). Só quando `supabase-config.js` não estiver configurado o site usa `catalogo-dados.js`.
- A administradora entra em `admin.html` com e-mail e senha e cadastra, edita, ativa, desativa e envia fotos (bucket `produtos`). A regra de quem pode escrever está no banco (RLS), não na tela.
- Cada produto tem: `id`, `nome`, `categoria`, `descricao`, `fotos[]`, `preco` (número, ou `null` para "sob orçamento"), `disponibilidade` (`disponivel`, `sob-encomenda` ou `indisponivel`), `prazo`, `durabilidade`, `cuidados`, `ocasioes[]`, `cores[]` e `ativo`.
- Produto `indisponivel` aparece no catálogo, mas **não pode ser pedido** (RN01). Produto com `ativo: false` não aparece.
- O pedido exige nome, quantidade (1 a 99), ocasião e cores. Tamanho, orçamento, link de referência e observações são opcionais. O WhatsApp só é aberto depois do resumo e da confirmação do cliente.
- Número do WhatsApp: `5548991765295`, definido em `src/lib/catalogo-core.js` (`WHATSAPP`, usado também pelo rodapé) e nos links `wa.me` das páginas.

## Pendências conhecidas

1. **Preços, prazos e disponibilidade em `src/lib/catalogo-dados.js` são exemplos** e precisam ser conferidos pela administradora antes de publicar.
2. **A senha da administradora ainda precisa ser definida por ela** e o **cadastro público de usuários deve ser desligado no painel do Supabase**. Os passos estão em [docs/supabase-plano.md](docs/supabase-plano.md). Os produtos hoje no banco são os exemplos de `catalogo-dados.js`.
3. **Referência visual no pedido é um link**, não um upload. O cliente pode enviar a imagem direto na conversa do WhatsApp.

## Identidade visual

- Fonte principal: **Quicksand** (acompanha a letra do logotipo). Títulos grandes e o "ateliê floral" usam **Cormorant Garamond**.
- Paleta: papel (`#f4f1ea`), sálvia, oliva e vinho (`#7a2937`). Os tokens ficam no início de `src/styles/styles.css`.
- Meta de acessibilidade: foco visível, rótulos em todos os campos, mensagens de erro com `role="alert"`, contraste adequado e navegação por teclado.
