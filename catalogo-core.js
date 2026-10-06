/* Regras do catálogo e do pedido (sem acesso ao DOM, para poder ser testado em Node). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CapimCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const WHATSAPP = '5548991765295';
  const STORAGE_KEY = 'capim.produtos.v1';

  const DISPONIBILIDADE = {
    'disponivel': 'Disponível',
    'sob-encomenda': 'Sob encomenda',
    'indisponivel': 'Indisponível'
  };

  const FAIXAS_PRECO = {
    'ate-100': { rotulo: 'Até R$ 100', min: 0, max: 100 },
    '100-200': { rotulo: 'R$ 100 a R$ 200', min: 100, max: 200 },
    'acima-200': { rotulo: 'Acima de R$ 200', min: 200, max: Infinity },
    'orcamento': { rotulo: 'Sob orçamento' }
  };

  const TAMANHOS = ['Pequeno', 'Médio', 'Grande', 'Não sei, quero sugestão'];
  const ORCAMENTOS = ['Até R$ 100', 'R$ 100 a R$ 200', 'R$ 200 a R$ 400', 'Acima de R$ 400', 'Prefiro conversar'];

  const formatarPreco = (preco) =>
    typeof preco === 'number' && isFinite(preco)
      ? 'R$ ' + preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : 'Sob orçamento';

  const unicos = (produtos, campo) =>
    [...new Set(produtos.flatMap((p) => p[campo] || []))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  function filtrarProdutos(produtos, filtros = {}) {
    const { ocasiao = '', cor = '', faixa = '' } = filtros;
    return produtos.filter((p) => {
      if (p.ativo === false) return false;
      if (ocasiao && !(p.ocasioes || []).includes(ocasiao)) return false;
      if (cor && !(p.cores || []).includes(cor)) return false;
      if (faixa) {
        const f = FAIXAS_PRECO[faixa];
        if (!f) return false;
        const semPreco = typeof p.preco !== 'number';
        if (faixa === 'orcamento') return semPreco;
        if (semPreco || p.preco < f.min || p.preco >= f.max) return false;
      }
      return true;
    });
  }

  const ehUrlHttp = (valor) => {
    try {
      const u = new URL(valor);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (e) {
      return false;
    }
  };

  /* Valida o pedido. Retorna { valido, erros: { campo: mensagem } }. */
  function validarPedido(dados, produto) {
    const erros = {};
    const nome = (dados.nome || '').trim();
    if (nome.length < 2) erros.nome = 'Informe seu nome.';
    if (produto && produto.disponibilidade === 'indisponivel') {
      erros.produto = 'Este produto está indisponível no momento. Escolha outro ou faça um pedido personalizado.';
    }
    const qtd = Number(dados.quantidade);
    if (!Number.isInteger(qtd) || qtd < 1 || qtd > 99) erros.quantidade = 'Informe uma quantidade entre 1 e 99.';
    if (!(dados.ocasiao || '').trim()) erros.ocasiao = 'Informe a ocasião ou a finalidade.';
    if (!(dados.cores || '').trim()) erros.cores = 'Informe ao menos uma cor preferida.';
    const ref = (dados.referencia || '').trim();
    if (ref && !ehUrlHttp(ref)) erros.referencia = 'Use um link completo, começando com http:// ou https://.';
    return { valido: Object.keys(erros).length === 0, erros };
  }

  function montarMensagem(dados, produto) {
    const linhas = ['Oi, Capim Urbano! Quero fazer um pedido pelo site.', ''];
    linhas.push('*Produto:* ' + (produto ? produto.nome : 'Arranjo personalizado (sem produto do catálogo)'));
    if (produto) linhas.push('*Preço de referência:* ' + formatarPreco(produto.preco));
    linhas.push('*Quantidade:* ' + Number(dados.quantidade));
    linhas.push('*Ocasião:* ' + dados.ocasiao.trim());
    linhas.push('*Cores preferidas:* ' + dados.cores.trim());
    if ((dados.tamanho || '').trim()) linhas.push('*Tamanho:* ' + dados.tamanho.trim());
    if ((dados.orcamento || '').trim()) linhas.push('*Orçamento:* ' + dados.orcamento.trim());
    if ((dados.referencia || '').trim()) linhas.push('*Referência visual:* ' + dados.referencia.trim());
    if ((dados.observacoes || '').trim()) linhas.push('*Observações:* ' + dados.observacoes.trim());
    linhas.push('*Nome:* ' + dados.nome.trim());
    linhas.push('', 'Aguardo a confirmação de disponibilidade e valor final.');
    return linhas.join('\n');
  }

  const montarLinkWhatsApp = (mensagem) => 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(mensagem);

  const slug = (texto) =>
    String(texto || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  /* Valida um produto do cadastro. */
  function validarProduto(p) {
    const erros = {};
    if (!(p.nome || '').trim()) erros.nome = 'Informe o nome.';
    if (!(p.categoria || '').trim()) erros.categoria = 'Informe a categoria.';
    if (!(p.descricao || '').trim()) erros.descricao = 'Informe a descrição.';
    if (!Array.isArray(p.fotos) || p.fotos.length === 0) erros.fotos = 'Informe ao menos uma foto.';
    if (p.preco !== null && p.preco !== undefined && !(typeof p.preco === 'number' && isFinite(p.preco) && p.preco >= 0)) {
      erros.preco = 'Informe um valor válido ou deixe em branco para "sob orçamento".';
    }
    if (!DISPONIBILIDADE[p.disponibilidade]) erros.disponibilidade = 'Escolha a disponibilidade.';
    if (!(p.prazo || '').trim()) erros.prazo = 'Informe o prazo de produção ou entrega.';
    return { valido: Object.keys(erros).length === 0, erros };
  }

  /* Produtos: usa o cadastro salvo pela administradora neste navegador; senão, o padrão. */
  function carregarProdutos(padrao, storage) {
    try {
      const bruto = storage && storage.getItem(STORAGE_KEY);
      if (bruto) {
        const lista = JSON.parse(bruto);
        if (Array.isArray(lista)) return lista;
      }
    } catch (e) { /* cai no catálogo padrão */ }
    return padrao.map((p) => ({ ...p }));
  }

  function salvarProdutos(lista, storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  return {
    WHATSAPP, STORAGE_KEY, DISPONIBILIDADE, FAIXAS_PRECO, TAMANHOS, ORCAMENTOS,
    formatarPreco, unicos, filtrarProdutos, validarPedido, montarMensagem,
    montarLinkWhatsApp, slug, validarProduto, carregarProdutos, salvarProdutos
  };
});
