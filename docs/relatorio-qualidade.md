# Relatório de qualidade e desempenho

Medições feitas em laboratório (Chromium headless, servidor local, viewport de celular 375×800, mediana de 3 execuções), em 26/10/2026. **São medidas de referência**: não incluem a latência de uma hospedagem real, e o carregamento das fontes do Google Fonts depende da rede.

## Carregamento das telas principais

| Tela | DOMContentLoaded | Load | Peso local | Requisições locais |
|---|---|---|---|---|
| Início | 412 ms | 651 ms | 334 KB | 7 |
| Catálogo | 377 ms | 639 ms | 386 KB | 9 |
| Produto | 324 ms | 529 ms | 384 KB | 8 |
| Pedido | 430 ms | 642 ms | 37 KB | 7 |
| Administração | 285 ms | 603 ms | 17 KB | 6 |
| Serviços | 363 ms | 627 ms | 343 KB | 8 |

Leitura: todas as telas carregam abaixo de 1 s no ambiente de teste, com menos de 400 KB. O peso vem das imagens `.webp`, que já são carregadas com `loading="lazy"` abaixo da dobra.

## Navegação (fluxo principal)

Do catálogo ao WhatsApp são 4 passos: escolher o produto, "Fazer pedido", preencher e "Revisar pedido", e "Enviar pelo WhatsApp". Um pedido personalizado sem produto sai em 3 passos (menu, formulário, WhatsApp).

Não há dados de abandono, porque o site não tem analítica. Essa análise do card de desempenho exige uma ferramenta de métricas com dados reais de uso.

## Verificações automáticas (`node --test tests/e2e.test.js`)

- Sem rolagem horizontal e sem erros de console em 5 páginas, em 375, 768 e 1280 px.
- Todo campo de formulário tem rótulo, toda imagem tem `alt` e a página declara `lang="pt-BR"`.
- Menu abre e fecha por teclado (Escape).
- Erros de validação recebem foco no primeiro campo inválido e usam `role="alert"`.

## O que ainda precisa de verificação manual

- Contraste com medição (WCAG AA) e teste com leitor de tela.
- Navegadores Safari e Firefox, e aparelhos reais.
- Medição em hospedagem real, com cache e CDN.

## Melhorias técnicas sugeridas

1. Publicar com compressão (gzip ou brotli) e cache longo para `imagens/` e `styles.css`.
2. Hospedar a fonte Quicksand localmente, para não depender do Google Fonts no primeiro carregamento.
3. Banco de dados e login para o cadastro de produtos, que também elimina a exportação manual do JSON.
4. Adicionar analítica simples para medir abandono no fluxo do pedido.
