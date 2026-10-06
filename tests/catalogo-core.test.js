// Executar: node --test tests/catalogo-core.test.js
const test = require('node:test');
const assert = require('node:assert');
const C = require('../catalogo-core.js');
globalThis.window = globalThis;
require('../catalogo-dados.js');
const produtos = globalThis.CAPIM_PRODUTOS_PADRAO;

const pedidoValido = { nome: 'Ana', quantidade: '2', ocasiao: 'Aniversário', cores: 'vinho, creme', tamanho: 'Médio', orcamento: 'R$ 100 a R$ 200', referencia: 'https://exemplo.com/foto', observacoes: 'Entrega sexta' };

test('catálogo padrão atende aos campos obrigatórios (RN01)', () => {
  assert.ok(produtos.length > 0);
  for (const p of produtos) assert.ok(C.validarProduto(p).valido, p.id);
  assert.strictEqual(new Set(produtos.map((p) => p.id)).size, produtos.length);
});

test('filtros por ocasião, cor e faixa se combinam (US02)', () => {
  assert.strictEqual(C.filtrarProdutos(produtos, {}).length, produtos.length);
  const so = C.filtrarProdutos(produtos, { ocasiao: 'Decoração' });
  assert.ok(so.length > 0 && so.every((p) => p.ocasioes.includes('Decoração')));
  const comb = C.filtrarProdutos(produtos, { ocasiao: 'Decoração', cor: 'Terracota', faixa: '100-200' });
  assert.deepStrictEqual(comb.map((p) => p.id), ['vaso-terracota-capim']);
  assert.deepStrictEqual(C.filtrarProdutos(produtos, { cor: 'Cor inexistente' }), []);
});

test('faixas de preço: limites e "sob orçamento"', () => {
  const base = { ativo: true, ocasioes: [], cores: [] };
  const lista = [{ ...base, id: 'a', preco: 100 }, { ...base, id: 'b', preco: 99.9 }, { ...base, id: 'c', preco: 200 }, { ...base, id: 'd', preco: null }];
  const ids = (faixa) => C.filtrarProdutos(lista, { faixa }).map((p) => p.id);
  assert.deepStrictEqual(ids('ate-100'), ['b']);
  assert.deepStrictEqual(ids('100-200'), ['a']);
  assert.deepStrictEqual(ids('acima-200'), ['c']);
  assert.deepStrictEqual(ids('orcamento'), ['d']);
});

test('produtos desativados não aparecem no catálogo', () => {
  const lista = [{ id: 'x', ativo: false, ocasioes: [], cores: [] }];
  assert.strictEqual(C.filtrarProdutos(lista, {}).length, 0);
});

test('formatação de preço', () => {
  assert.match(C.formatarPreco(129), /^R\$\s129,00$/);
  assert.strictEqual(C.formatarPreco(null), 'Sob orçamento');
});

test('validação do pedido (RN02)', () => {
  assert.ok(C.validarPedido(pedidoValido, null).valido);
  const r = C.validarPedido({ nome: ' ', quantidade: '0', ocasiao: '', cores: '', referencia: 'foto.jpg' }, null);
  assert.deepStrictEqual(Object.keys(r.erros).sort(), ['cores', 'nome', 'ocasiao', 'quantidade', 'referencia']);
  assert.ok(!C.validarPedido({ ...pedidoValido, quantidade: '1.5' }, null).valido);
});

test('produto indisponível não pode ser pedido (RN01)', () => {
  const indisp = produtos.find((p) => p.disponibilidade === 'indisponivel');
  const r = C.validarPedido(pedidoValido, indisp);
  assert.ok(!r.valido && r.erros.produto);
});

test('mensagem do WhatsApp traz produto, quantidade e personalizações (US05)', () => {
  const msg = C.montarMensagem(pedidoValido, produtos[0]);
  for (const trecho of [produtos[0].nome, '*Quantidade:* 2', '*Ocasião:* Aniversário', '*Cores preferidas:* vinho, creme', '*Tamanho:* Médio', 'https://exemplo.com/foto', 'Entrega sexta', '*Nome:* Ana']) assert.ok(msg.includes(trecho), trecho);
  assert.ok(C.montarMensagem({ ...pedidoValido, tamanho: '', observacoes: '' }, null).includes('Arranjo personalizado'));
  assert.ok(!C.montarMensagem({ ...pedidoValido, tamanho: '' }, null).includes('Tamanho'));
});

test('link do WhatsApp usa o número oficial e codifica a mensagem', () => {
  const msg = 'Olá & café?\nlinha 2';
  const url = new URL(C.montarLinkWhatsApp(msg));
  assert.strictEqual(url.origin + url.pathname, 'https://wa.me/5548991765295');
  assert.strictEqual(url.searchParams.get('text'), msg);
});

test('cadastro: validação, slug e armazenamento', () => {
  assert.ok(!C.validarProduto({ nome: '', fotos: [], preco: -1, disponibilidade: 'x' }).valido);
  assert.strictEqual(C.slug('Arranjo Ação & Flor!'), 'arranjo-acao-flor');
  const mem = { d: {}, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = v; } };
  assert.strictEqual(C.carregarProdutos(produtos, mem).length, produtos.length);
  C.salvarProdutos([produtos[0]], mem);
  assert.strictEqual(C.carregarProdutos(produtos, mem).length, 1);
  mem.d[C.STORAGE_KEY] = '{quebrado';
  assert.strictEqual(C.carregarProdutos(produtos, mem).length, produtos.length);
});
