# Manual do projeto

## Para o cliente

1. **Catálogo** (`catalogo.html`): veja os produtos e filtre por **ocasião**, **cor** e **faixa de preço**. Os filtros se combinam. Se nada combinar, aparece uma mensagem com o botão "Limpar filtros" e o atalho para um arranjo personalizado. O link do catálogo filtrado pode ser compartilhado.
2. **Produto** (clique no cartão): fotos, preço (ou "Sob orçamento"), disponibilidade, **prazo de produção ou entrega**, **durabilidade** e **cuidados**. Quando o ateliê não preencheu uma dessas informações, a página avisa e orienta a perguntar pelo WhatsApp.
3. **Pedido** ("Fazer pedido"): informe nome, quantidade, ocasião e cores. Tamanho, faixa de orçamento, link de referência e observações são opcionais. Clique em **Revisar pedido**: o resumo aparece e o botão **Enviar pelo WhatsApp** abre a conversa com a mensagem pronta. Nada é enviado antes de você confirmar no WhatsApp.
4. **Produto indisponível** não aceita pedido. A página oferece o pedido de um arranjo personalizado.
5. A **disponibilidade e o valor final** são sempre confirmados no atendimento.

## Para a administradora (`admin.html`)

A página não está no menu do site. Acesse pelo endereço `/admin.html`.

- **Entrar:** informe o e-mail e a senha da administradora e clique em "Entrar". Se errar, a tela avisa "E-mail ou senha incorretos". Contas sem permissão de administradora são recusadas. Para sair, use o botão "Sair".
- **Painel:** no topo aparece o resumo do catálogo (quantos produtos, quantos estão no catálogo e quantos estão indisponíveis). Use **Buscar produto** para filtrar a lista por nome ou categoria. Cada produto aparece com a foto de capa, a categoria e etiquetas de disponibilidade e de "No catálogo". No celular, cada produto vira um cartão.
- **Novo produto:** botão "Novo produto", preencha o formulário e "Salvar produto". Campos obrigatórios: nome, categoria, descrição, ao menos uma foto, disponibilidade e prazo. Preço vazio vale "sob orçamento". Use vírgula nos centavos (`129,90`). Ao salvar, o produto **já aparece no catálogo para todos os clientes**, sem exportar nem publicar nada.
- **Editar:** botão "Editar" na linha do produto, altere e salve. A linha em edição fica destacada, e o formulário (dividido em Identificação, Fotos, Preço e prazo, Detalhes e Publicação) acompanha a rolagem, com "Salvar produto" sempre visível.
- **Desativar e reativar:** tira o produto do catálogo sem apagar os dados. Produtos desativados continuam na lista da administração.
- **Disponibilidade:** escolha Disponível, Sob encomenda ou Indisponível. Produto indisponível continua visível, mas não aceita pedido.
- **Baixar cópia (JSON):** salva no seu computador uma cópia de todos os produtos (inclusive os desativados), como backup.
- **Ver como o cliente vê:** abre o catálogo em outra aba.
- **Mensagens da tela:** "Carregando produtos…" ao abrir, "Nenhum produto cadastrado" quando a lista está vazia, "Tentar de novo" se a lista não carregar, faixa verde para sucesso e faixa vinho para erro (também lida por leitores de tela).

### Fotos

- **Prévia:** as fotos do produto aparecem em miniatura, com a capa marcada. O "×" de cada miniatura tira aquela foto do produto (vale ao salvar). As fotos escolhidas para enviar aparecem com borda tracejada.
- **Enviar fotos novas:** no formulário, use "Escolher fotos" e escolha arquivos **WebP, JPEG ou PNG de até 2 MB** cada. Elas são guardadas no Supabase (bucket `produtos`, pasta com o identificador do produto) e o endereço entra sozinho no cadastro. Arquivo de outro tipo ou maior que 2 MB é recusado antes do envio.
- **Fotos já cadastradas:** o campo de texto lista um caminho ou link por linha, e a primeira é a capa. Aceita caminhos do site (`imagens/web/arquivo.webp`) ou links `https`. Prefira imagens `.webp` otimizadas.

### Primeiro acesso e senha

A conta da administradora foi criada sem senha conhecida. Para definir a sua: no painel do Supabase, **Authentication → Users**, abra o menu (`...`) do usuário e use **Send password recovery**, ou crie a senha pelo próprio painel. Use uma senha longa e única, e não a compartilhe por mensagem. O passo a passo da equipe técnica está em [supabase-plano.md](supabase-plano.md).

## Para a equipe técnica

- Rodar: `npm install` (uma vez; Node 22.23.4 ou superior) e `npm run dev` (http://localhost:4321). Para o site final: `npm run build` gera `dist/`, que vai para qualquer hospedagem estática.
- Testes: `npm test` (regras) e `npm run test:e2e` (faz o build e testa as telas; precisa do `playwright` e de um Chromium).
- Publicar o site: o push na `main` dispara `.github/workflows/deploy.yml` (testes de regras, build e GitHub Pages). Configure uma vez *Settings → Pages → Source = GitHub Actions*; com "Deploy from a branch" o Jekyll tenta ler os `.astro` e falha. O site fica em `https://<usuário>.github.io/<repositório>/` (`BASE_PATH` e `SITE_URL` no workflow).
- Publicar produtos: não há publicação. A administradora salva em `admin.html` e o catálogo lê direto do Supabase. `src/lib/catalogo-dados.js` só é usado quando `src/lib/supabase-config.js` está sem configuração.
- Banco: o SQL está em `supabase/migrations/`. Mudanças no banco entram como arquivo novo ali e são aplicadas no projeto.
- Os testes de tela simulam o Supabase e não usam a rede.
- Mudar o número do WhatsApp: `WHATSAPP` em `src/lib/catalogo-core.js` e os links `wa.me` das páginas.
- Detalhes dos dados: [modelo-de-dados.md](modelo-de-dados.md). Rastreabilidade: [matriz-de-requisitos.md](matriz-de-requisitos.md). Qualidade: [relatorio-qualidade.md](relatorio-qualidade.md).
