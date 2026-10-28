// Executar: node --test tests/catalogo-core.test.js
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as C from '../src/lib/catalogo-core.js';
import { PRODUTOS_PADRAO as produtos } from '../src/lib/catalogo-dados.js';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

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

test('cadastro: validação e identificador (slug)', () => {
  assert.ok(!C.validarProduto({ nome: '', fotos: [], preco: -1, disponibilidade: 'x' }).valido);
  assert.strictEqual(C.slug('Arranjo Ação & Flor!'), 'arranjo-acao-flor');
});

test('banco -> produto: preço numérico vira número, vazios viram padrão e ativo assume true', () => {
  const p = C.linhaParaProduto({
    id: 'a', nome: 'A', categoria: 'C', descricao: 'D', fotos: ['f.webp'], preco: '129.50', disponibilidade: 'disponivel', prazo: 'P',
    durabilidade: null, cuidados: null, ocasioes: null, cores: ['Vinho'], ativo: null, criado_em: '2026-01-01T00:00:00Z', atualizado_em: '2026-01-01T00:00:00Z'
  });
  assert.strictEqual(p.preco, 129.5);
  assert.strictEqual(p.durabilidade, '');
  assert.strictEqual(p.cuidados, '');
  assert.deepStrictEqual(p.ocasioes, []);
  assert.deepStrictEqual(p.cores, ['Vinho']);
  assert.strictEqual(p.ativo, true);
  assert.ok(!('criado_em' in p) && !('atualizado_em' in p));
  assert.strictEqual(C.linhaParaProduto({ ...p, preco: null, ativo: false }).preco, null);
  assert.strictEqual(C.linhaParaProduto({ ...p, preco: null, ativo: false }).ativo, false);
});

test('produto -> banco: textos opcionais vazios viram null e não envia datas', () => {
  const linha = C.produtoParaLinha({ id: 'a', nome: ' A ', categoria: 'C', descricao: 'D', fotos: ['f'], preco: NaN, disponibilidade: 'disponivel', prazo: 'P', durabilidade: '  ', cuidados: 'Longe da água', ocasioes: ['X'], cores: [], ativo: false });
  assert.strictEqual(linha.nome, 'A');
  assert.strictEqual(linha.preco, null);
  assert.strictEqual(linha.durabilidade, null);
  assert.strictEqual(linha.cuidados, 'Longe da água');
  assert.strictEqual(linha.ativo, false);
  assert.deepStrictEqual(Object.keys(linha).sort(), ['ativo', 'categoria', 'cores', 'cuidados', 'descricao', 'disponibilidade', 'durabilidade', 'fotos', 'id', 'nome', 'ocasioes', 'prazo', 'preco']);
});

test('ida e volta: produtos padrão sobrevivem à conversão banco <-> produto', () => {
  for (const p of produtos) {
    const volta = C.linhaParaProduto(C.produtoParaLinha(p));
    assert.deepStrictEqual(volta, p, p.id);
  }
});

test('foto: aceita webp, jpeg e png até 2 MB; recusa o resto', () => {
  const ok = (type, size) => C.validarArquivoFoto({ name: 'f', type, size });
  for (const tipo of ['image/webp', 'image/jpeg', 'image/png']) assert.strictEqual(ok(tipo, 1000), '');
  assert.strictEqual(ok('image/png', 2 * 1024 * 1024), '');
  assert.match(ok('image/png', 2 * 1024 * 1024 + 1), /2 MB/);
  assert.match(ok('image/gif', 10), /WebP, JPEG ou PNG/);
  assert.match(ok('application/pdf', 10), /WebP, JPEG ou PNG/);
});

test('foto: caminho no Storage usa o id do produto, nome limpo e extensão pelo tipo', () => {
  assert.strictEqual(C.caminhoFoto('vaso-x', { name: 'Minha Foto Ação.JPG', type: 'image/jpeg' }, 'k1'), 'vaso-x/minha-foto-acao-k1.jpg');
  assert.strictEqual(C.caminhoFoto('vaso-x', { name: '....png', type: 'image/png' }, 'k2'), 'vaso-x/foto-k2.png');
});

test('cliente do Supabase: sem configuração é null; configurado sem a biblioteca é erro', () => {
  assert.strictEqual(C.criarCliente(undefined, {}), null);
  assert.strictEqual(C.criarCliente({ url: '', chavePublicavel: '' }, {}), null);
  assert.throws(() => C.criarCliente({ url: 'https://x.supabase.co', chavePublicavel: 'k' }, undefined), /não carregada/);
  const chamadas = [];
  const lib = { createClient: (url, chave) => { chamadas.push([url, chave]); return { ok: true }; } };
  assert.deepStrictEqual(C.criarCliente({ url: 'https://x.supabase.co', chavePublicavel: 'k' }, lib), { ok: true });
  assert.deepStrictEqual(chamadas, [['https://x.supabase.co', 'k']]);
});

test('configuração pública não traz chave secreta', () => {
  const config = fs.readFileSync(path.join(RAIZ, 'src', 'lib', 'supabase-config.js'), 'utf8');
  assert.match(config, /sb_publishable_/);
  assert.ok(!/sb_secret_|eyJ[A-Za-z0-9_-]{10,}\./.test(config), 'só a chave publicável, nunca chave secreta ou JWT');
});

function clienteFalso(resposta) {
  const consulta = { filtros: [] };
  const cadeia = {
    select() { return cadeia; },
    order(coluna) { consulta.filtros.push(coluna); return cadeia; },
    then(ok, falha) { return Promise.resolve(typeof resposta === 'function' ? resposta() : resposta).then(ok, falha); }
  };
  return { consulta, from(tabela) { consulta.tabela = tabela; return cadeia; } };
}

test('carregar produtos: sem cliente usa o catálogo padrão (cópia)', async () => {
  const r = await C.carregarProdutos(produtos, null);
  assert.strictEqual(r.origem, 'padrao');
  assert.strictEqual(r.erro, null);
  assert.deepStrictEqual(r.produtos, produtos);
  r.produtos[0].nome = 'mudou';
  assert.notStrictEqual(produtos[0].nome, 'mudou');
});

test('carregar produtos: com cliente busca em "produtos" e converte as linhas', async () => {
  const cliente = clienteFalso({ data: produtos.map(C.produtoParaLinha), error: null });
  const r = await C.carregarProdutos([], cliente);
  assert.strictEqual(cliente.consulta.tabela, 'produtos');
  assert.strictEqual(r.origem, 'banco');
  assert.strictEqual(r.erro, null);
  assert.deepStrictEqual(r.produtos, produtos);
});

test('carregar produtos: erro do banco ou da rede devolve lista vazia e o erro, sem exibir os exemplos', async () => {
  for (const resposta of [{ data: null, error: { message: 'permissão negada' } }, () => { throw new TypeError('Failed to fetch'); }]) {
    const r = await C.carregarProdutos(produtos, clienteFalso(resposta));
    assert.deepStrictEqual(r.produtos, []);
    assert.ok(r.erro instanceof Error);
    assert.strictEqual(r.origem, 'banco');
  }
});

test('cuidados, durabilidade e prazo: texto ou aviso quando ausente (US04)', () => {
  assert.strictEqual(C.textoOuAviso('  Longe da água  '), 'Longe da água');
  for (const vazio of ['', '   ', undefined, null, 42]) assert.strictEqual(C.textoOuAviso(vazio), C.AVISO_SEM_INFO);
});
