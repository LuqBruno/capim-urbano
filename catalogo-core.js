/* Regras do catálogo e do pedido (sem acesso ao DOM, para poder ser testado em Node). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CapimCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const WHATSAPP = '5548991765295';
  const TIPOS_FOTO = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };
  const TAMANHO_MAX_FOTO = 2 * 1024 * 1024;

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

  const AVISO_SEM_INFO = 'Não informado. Consulte o ateliê pelo WhatsApp.';

  /* Texto do cadastro, ou um aviso claro quando a informação não foi preenchida (US04). */
  const textoOuAviso = (valor) => (typeof valor === 'string' && valor.trim() ? valor.trim() : AVISO_SEM_INFO);

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

  /* Linha da tabela public.produtos -> produto usado pelo site. */
  function linhaParaProduto(l) {
    const preco = l.preco === null || l.preco === undefined || l.preco === '' ? null : Number(l.preco);
    return {
      id: l.id,
      nome: l.nome,
      categoria: l.categoria,
      descricao: l.descricao,
      fotos: Array.isArray(l.fotos) ? l.fotos.slice() : [],
      preco: preco !== null && isFinite(preco) ? preco : null,
      disponibilidade: l.disponibilidade,
      prazo: l.prazo,
      durabilidade: l.durabilidade || '',
      cuidados: l.cuidados || '',
      ocasioes: Array.isArray(l.ocasioes) ? l.ocasioes.slice() : [],
      cores: Array.isArray(l.cores) ? l.cores.slice() : [],
      ativo: l.ativo !== false
    };
  }

  /* Produto do cadastro -> linha para gravar. Texto opcional vazio vira null; não envia criado_em/atualizado_em. */
  function produtoParaLinha(p) {
    const opcional = (t) => (typeof t === 'string' && t.trim() ? t.trim() : null);
    return {
      id: p.id,
      nome: String(p.nome || '').trim(),
      categoria: String(p.categoria || '').trim(),
      descricao: String(p.descricao || '').trim(),
      fotos: (p.fotos || []).slice(),
      preco: typeof p.preco === 'number' && isFinite(p.preco) ? p.preco : null,
      disponibilidade: p.disponibilidade,
      prazo: String(p.prazo || '').trim(),
      durabilidade: opcional(p.durabilidade),
      cuidados: opcional(p.cuidados),
      ocasioes: (p.ocasioes || []).slice(),
      cores: (p.cores || []).slice(),
      ativo: p.ativo !== false
    };
  }

  /* Confere tipo (webp, jpeg ou png) e tamanho (até 2 MB) de uma foto antes de enviar. Retorna a mensagem de erro ou ''. */
  function validarArquivoFoto(arquivo) {
    if (!TIPOS_FOTO[arquivo.type]) return arquivo.name + ': use uma imagem WebP, JPEG ou PNG.';
    if (arquivo.size > TAMANHO_MAX_FOTO) return arquivo.name + ': a imagem passa de 2 MB.';
    return '';
  }

  /* Nome do arquivo no Storage: "<id-do-produto>/<nome-limpo>-<marca>.<extensão>". */
  function caminhoFoto(idProduto, arquivo, marca) {
    const base = slug(arquivo.name.replace(/\.[^.]+$/, '')) || 'foto';
    return idProduto + '/' + base + '-' + marca + '.' + TIPOS_FOTO[arquivo.type];
  }

  /* Cliente do Supabase a partir da configuração pública (URL e chave publicável).
     Sem configuração, devolve null (o site usa o catálogo padrão). Configurado mas sem a biblioteca carregada, é erro. */
  function criarCliente(config, lib) {
    if (!config || !config.url || !config.chavePublicavel) return null;
    if (!lib || typeof lib.createClient !== 'function') throw new Error('Biblioteca do Supabase não carregada.');
    return lib.createClient(config.url, config.chavePublicavel);
  }

  /* Produtos do catálogo.
     - Sem cliente do Supabase (site sem configuração): usa o catálogo padrão de exemplo.
     - Com cliente: busca em public.produtos (a RLS devolve só os ativos para visitantes e tudo para administradoras).
       Se a busca falhar, NÃO mostra os exemplos como se fossem reais: devolve a lista vazia e o erro, para a tela oferecer "Tentar de novo".
     Retorna { produtos, origem: 'padrao' | 'banco', erro: Error | null }. */
  async function carregarProdutos(padrao, cliente) {
    if (!cliente) return { produtos: padrao.map((p) => ({ ...p })), origem: 'padrao', erro: null };
    try {
      const { data, error } = await cliente.from('produtos').select('*').order('criado_em', { ascending: true }).order('id', { ascending: true });
      if (error) throw error;
      return { produtos: (data || []).map(linhaParaProduto), origem: 'banco', erro: null };
    } catch (e) {
      return { produtos: [], origem: 'banco', erro: e instanceof Error ? e : new Error(String((e && e.message) || e)) };
    }
  }

  return {
    WHATSAPP, TIPOS_FOTO, TAMANHO_MAX_FOTO, DISPONIBILIDADE, FAIXAS_PRECO, TAMANHOS, ORCAMENTOS,
    AVISO_SEM_INFO, textoOuAviso, formatarPreco, unicos, filtrarProdutos, validarPedido, montarMensagem,
    montarLinkWhatsApp, slug, validarProduto, linhaParaProduto, produtoParaLinha, validarArquivoFoto, caminhoFoto, criarCliente, carregarProdutos
  };
});
