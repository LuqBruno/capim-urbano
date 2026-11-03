# Relatório de qualidade e desempenho

Atualizado em 03/11/2026, já com o site em Astro, publicado no GitHub Pages e ligado ao Supabase. Os testes automáticos rodam no Chromium; as medições de desempenho foram feitas no **site publicado** (https://luqbruno.github.io/capim-urbano/), em laboratório.

## Desempenho (site publicado)

Chromium headless, viewport de celular 375×800, sem limitação de rede, mediana de 3 execuções. O peso e as requisições incluem tudo o que a página busca: arquivos do site, fontes do Google Fonts e consultas ao Supabase.

| Tela | DOMContentLoaded | Load | LCP (maior elemento visível) | Peso | Requisições |
|---|---|---|---|---|---|
| Início | 655 ms | 941 ms | 708 ms | 570 KB | 20 |
| Catálogo | 862 ms | 965 ms | 704 ms | 441 KB | 15 |
| Produto | 685 ms | 905 ms | 1 668 ms | 728 KB | 14 |
| Pedido | 725 ms | 874 ms | 636 ms | 353 KB | 13 |
| Administração (login) | 627 ms | 936 ms | 640 ms | 370 KB | 10 |
| Serviços | 653 ms | 885 ms | 928 ms | 458 KB | 12 |

Leitura: todas as telas terminam de carregar em menos de 1 s e abaixo de 750 KB. O LCP fica abaixo de 2,5 s, o limite que o Google considera bom; o maior é o da página do produto, por causa da foto grande. São medidas de referência de um ambiente de laboratório: um celular real em rede móvel será mais lento. A migração para Astro e a leitura dos produtos no Supabase não pioraram o resultado medido em 26/10 (site estático, tudo local, 0,5 a 0,65 s), e agora o teste inclui fontes e banco de dados.

## Navegação (fluxo principal)

Do catálogo ao WhatsApp são 4 passos: escolher o produto, "Fazer pedido", preencher e "Revisar pedido", e "Enviar pelo WhatsApp". Um pedido personalizado sem produto sai em 3 passos (menu, formulário, WhatsApp).

Não há dados de abandono, porque o site não tem analítica. Essa análise exige uma ferramenta de métricas com dados reais de uso.

## Acessibilidade

**Contraste e regras WCAG 2.2 AA (axe-core):** auditoria automática de todas as páginas (início, serviços, assinatura, eternização, oficinas, arranjos, contato, catálogo, produto, pedido, administração e 404), em celular (375 px) e desktop (1280 px), incluindo a **administração logada**. Resultado atual: **nenhuma violação**.

Na primeira rodada achou-se um problema real, já corrigido: na página de contato o botão "Conversar" do menu ficava com texto grafite sobre fundo grafite (contraste 1,3:1, mínimo 4,5:1). O caso é coberto pelo teste.

**Outras verificações automáticas** (`npm run test:e2e`):

- Sem rolagem horizontal e sem erros de console em celular, tablet e desktop, incluindo a administração logada.
- Todo campo tem rótulo, toda imagem tem `alt` e a página declara `lang="pt-BR"`.
- Menu abre e fecha por teclado (Escape); o varal de fotos funciona por teclado e tem botão de pausa; sem animação com "menos movimento".
- Erros de validação recebem foco no primeiro campo inválido e usam `role="alert"`.
- A administração fica fora dos buscadores (`noindex` e `robots.txt`); a página 404 existe e também fica fora.

## O que a automação não cobre

- **Leitor de tela real** (NVDA, VoiceOver, TalkBack): o axe confere rótulos, papéis e ordem, mas não substitui ouvir a página.
- **Safari e Firefox**, e **aparelhos físicos**: os testes rodam só no Chromium.
- **Medição em rede móvel real**, com cache e CDN.

## Melhorias técnicas sugeridas

1. Reduzir o peso das fotos de produto (a do produto pesa cerca de 0,5 MB) e dar prioridade de carregamento à imagem principal da página do produto.
2. Hospedar as fontes localmente, para não depender do Google Fonts no primeiro carregamento.
3. Adicionar analítica simples para medir abandono no fluxo do pedido.
4. Avaliar plano pago do Supabase (o gratuito pausa o projeto por inatividade; o workflow `verificar-catalogo.yml` reduz o risco, mas não o elimina).
