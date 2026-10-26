# Manual do projeto

## Para o cliente

1. **Catálogo** (`catalogo.html`): veja os produtos e filtre por **ocasião**, **cor** e **faixa de preço**. Os filtros se combinam. Se nada combinar, aparece uma mensagem com o botão "Limpar filtros" e o atalho para um arranjo personalizado. O link do catálogo filtrado pode ser compartilhado.
2. **Produto** (clique no cartão): fotos, preço (ou "Sob orçamento"), disponibilidade, **prazo de produção ou entrega**, **durabilidade** e **cuidados**. Quando o ateliê não preencheu uma dessas informações, a página avisa e orienta a perguntar pelo WhatsApp.
3. **Pedido** ("Fazer pedido"): informe nome, quantidade, ocasião e cores. Tamanho, faixa de orçamento, link de referência e observações são opcionais. Clique em **Revisar pedido**: o resumo aparece e o botão **Enviar pelo WhatsApp** abre a conversa com a mensagem pronta. Nada é enviado antes de você confirmar no WhatsApp.
4. **Produto indisponível** não aceita pedido. A página oferece o pedido de um arranjo personalizado.
5. A **disponibilidade e o valor final** são sempre confirmados no atendimento.

## Para a administradora (`admin.html`)

A página não está no menu do site. Acesse pelo endereço `/admin.html`.

**Aviso:** neste momento a página não tem senha e guarda as alterações apenas no navegador usado. Os clientes só veem as mudanças depois que o arquivo exportado for aplicado em `catalogo-dados.js` pela equipe técnica.

- **Novo produto:** botão "Novo produto", preencha o formulário e "Salvar produto". Campos obrigatórios: nome, categoria, descrição, ao menos uma foto, disponibilidade e prazo. Preço vazio vale "sob orçamento". Use vírgula nos centavos (`129,90`).
- **Editar:** botão "Editar" na linha do produto, altere e salve.
- **Desativar e reativar:** tira o produto do catálogo sem apagar os dados.
- **Disponibilidade:** escolha Disponível, Sob encomenda ou Indisponível. Produto indisponível continua visível, mas não aceita pedido.
- **Exportar JSON / Importar JSON:** exporta o cadastro para publicação ou backup, e importa um arquivo no mesmo formato. Arquivo inválido é recusado com mensagem de erro.
- **Restaurar padrão:** descarta as alterações deste navegador.
- **Ver como o cliente vê:** abre o catálogo em outra aba.
- **Mensagens da tela:** "Carregando produtos…" ao abrir, "Nenhum produto cadastrado" quando a lista está vazia, faixa verde para sucesso e faixa vinho para erro (também lida por leitores de tela).

### Fotos

Informe um caminho que exista no site (`imagens/web/arquivo.webp`) ou um link `https` de imagem. Há um por linha, e a primeira é a capa. Prefira imagens `.webp` otimizadas.

## Para a equipe técnica

- Rodar: `python3 -m http.server 8000`.
- Testes: `node --test tests/catalogo-core.test.js` e `node --test tests/e2e.test.js` (o segundo precisa do `playwright` e de um Chromium).
- Publicar um novo catálogo: abra `admin.html`, exporte o JSON e copie a lista para `CAPIM_PRODUTOS_PADRAO` em `catalogo-dados.js`.
- Mudar o número do WhatsApp: `WHATSAPP` em `catalogo-core.js` e os links `wa.me` das páginas.
- Detalhes dos dados: [modelo-de-dados.md](modelo-de-dados.md). Rastreabilidade: [matriz-de-requisitos.md](matriz-de-requisitos.md). Qualidade: [relatorio-qualidade.md](relatorio-qualidade.md).
