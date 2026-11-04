/* Regras do catálogo e do pedido (sem acesso ao DOM, para poder ser testado em Node). */
import { INTERFACE, interfaceDe } from '../i18n/interface.js';

const PT = INTERFACE['pt-BR'];
const WHATSAPP = '5548991765295';
const TIPOS_FOTO = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };
const TAMANHO_MAX_FOTO = 2 * 1024 * 1024;

const DISPONIBILIDADE = { ...PT.disponibilidade };

const FAIXAS_PRECO = {
  'ate-100': { rotulo: PT.faixas['ate-100'], min: 0, max: 100 },
  '100-200': { rotulo: PT.faixas['100-200'], min: 100, max: 200 },
  'acima-200': { rotulo: PT.faixas['acima-200'], min: 200, max: Infinity },
  'orcamento': { rotulo: PT.faixas.orcamento }
};

const TAMANHOS = PT.tamanhos.slice();
const ORCAMENTOS = PT.orcamentos.slice();

const AVISO_SEM_INFO = PT.semInfo;

const temTexto = (valor) => typeof valor === 'string' && valor.trim() !== '';

/* Texto do cadastro, ou um aviso claro quando a informação não foi preenchida (US04). */
const textoOuAviso = (valor, lingua) => (temTexto(valor) ? valor.trim() : interfaceDe(lingua).semInfo);

const formatarPreco = (preco, lingua) => {
  const t = interfaceDe(lingua);
  return typeof preco === 'number' && isFinite(preco)
    ? 'R$ ' + preco.toLocaleString(t.numeros, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : t.sobOrcamento;
};

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

function descreverFiltros(filtros = {}, lingua) {
  const t = interfaceDe(lingua);
  return Object.entries(t.filtros)
    .filter(([campo]) => (filtros[campo] || '').trim())
    .map(([campo, rotulo]) => {
      const valor = filtros[campo].trim();
      const faixa = campo === 'faixa' && FAIXAS_PRECO[valor] && t.faixas[valor];
      return { campo, rotulo, valor: faixa || valor };
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
function validarPedido(dados, produto, lingua) {
  const t = interfaceDe(lingua).erros;
  const erros = {};
  const nome = (dados.nome || '').trim();
  if (nome.length < 2) erros.nome = t.nome;
  if (produto && produto.disponibilidade === 'indisponivel') erros.produto = t.produto;
  const qtd = Number(dados.quantidade);
  if (!Number.isInteger(qtd) || qtd < 1 || qtd > 99) erros.quantidade = t.quantidade;
  if (!(dados.ocasiao || '').trim()) erros.ocasiao = t.ocasiao;
  if (!(dados.cores || '').trim()) erros.cores = t.cores;
  const ref = (dados.referencia || '').trim();
  if (ref && !ehUrlHttp(ref)) erros.referencia = t.referencia;
  return { valido: Object.keys(erros).length === 0, erros };
}

function montarMensagem(dados, produto, lingua) {
  const t = interfaceDe(lingua).mensagem;
  const campo = (rotulo, valor) => '*' + rotulo + ':* ' + valor;
  const linhas = [t.abertura, ''];
  linhas.push(campo(t.produto, produto ? produto.nome : t.personalizado));
  if (produto) linhas.push(campo(t.preco, formatarPreco(produto.preco, lingua)));
  linhas.push(campo(t.quantidade, Number(dados.quantidade)));
  linhas.push(campo(t.ocasiao, dados.ocasiao.trim()));
  linhas.push(campo(t.cores, dados.cores.trim()));
  if (temTexto(dados.tamanho)) linhas.push(campo(t.tamanho, dados.tamanho.trim()));
  if (temTexto(dados.orcamento)) linhas.push(campo(t.orcamento, dados.orcamento.trim()));
  if (temTexto(dados.referencia)) linhas.push(campo(t.referencia, dados.referencia.trim()));
  if (temTexto(dados.observacoes)) linhas.push(campo(t.observacoes, dados.observacoes.trim()));
  linhas.push(campo(t.nome, dados.nome.trim()));
  linhas.push('', t.fechamento);
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
   - Sem cliente do Supabase (site sem configuração): usa o catálogo padrão.
   - Com cliente: busca em public.produtos (a RLS devolve só os ativos para visitantes e tudo para administradoras).
     Se a busca falhar, NÃO mostra o catálogo padrão no lugar do banco (poderia estar desatualizado): devolve a lista vazia e o erro, para a tela oferecer "Tentar de novo".
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

export {
  WHATSAPP, TIPOS_FOTO, TAMANHO_MAX_FOTO, DISPONIBILIDADE, FAIXAS_PRECO, TAMANHOS, ORCAMENTOS,
  AVISO_SEM_INFO, temTexto, textoOuAviso, formatarPreco, unicos, filtrarProdutos, descreverFiltros, validarPedido, montarMensagem,
  montarLinkWhatsApp, slug, validarProduto, linhaParaProduto, produtoParaLinha, validarArquivoFoto, caminhoFoto, criarCliente, carregarProdutos
};
