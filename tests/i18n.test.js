// Executar: node --test tests/i18n.test.js
import test from 'node:test';
import assert from 'node:assert';
import * as C from '../src/lib/catalogo-core.js';
import { INTERFACE, LINGUAS, interfaceDe, linguaValida, pastaDaLingua } from '../src/i18n/interface.js';
import { SITE, siteDe } from '../src/i18n/site.js';

const pedido = { nome: 'Ana', quantidade: '2', ocasiao: 'Birthday', cores: 'wine, cream', tamanho: 'Medium', orcamento: '', referencia: '', observacoes: '' };
const produto = { nome: 'Vaso terracota', preco: 1234.5, disponibilidade: 'disponivel' };

function estrutura(valor) {
  if (Array.isArray(valor)) return valor.map(estrutura);
  if (typeof valor === 'function') return 'função';
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.keys(valor).sort().map((k) => [k, estrutura(valor[k])]));
  return typeof valor;
}

test('as três línguas têm exatamente as mesmas chaves e listas do português', () => {
  assert.deepStrictEqual(LINGUAS, ['pt-BR', 'en', 'es']);
  for (const lingua of LINGUAS) {
    assert.deepStrictEqual(estrutura(INTERFACE[lingua]), estrutura(INTERFACE['pt-BR']), 'interface ' + lingua);
    assert.deepStrictEqual(estrutura(SITE[lingua]), estrutura(SITE['pt-BR']), 'site ' + lingua);
  }
});

test('nenhum texto traduzido ficou vazio', () => {
  const vazios = [];
  const varrer = (valor, caminho) => {
    if (typeof valor === 'string') { if (!valor.trim()) vazios.push(caminho); return; }
    if (valor && typeof valor === 'object') Object.entries(valor).forEach(([k, v]) => varrer(v, caminho + '.' + k));
  };
  for (const lingua of LINGUAS) { varrer(INTERFACE[lingua], lingua); varrer(SITE[lingua], lingua); }
  assert.deepStrictEqual(vazios, []);
});

test('língua desconhecida cai no português; a pasta só existe fora do português', () => {
  assert.strictEqual(linguaValida('fr'), 'pt-BR');
  assert.strictEqual(linguaValida(undefined), 'pt-BR');
  assert.strictEqual(interfaceDe('xx'), INTERFACE['pt-BR']);
  assert.strictEqual(siteDe('xx'), SITE['pt-BR']);
  assert.deepStrictEqual(LINGUAS.map(pastaDaLingua), ['', 'en/', 'es/']);
});

test('o português continua sendo a fonte das constantes do core', () => {
  assert.deepStrictEqual(C.DISPONIBILIDADE, INTERFACE['pt-BR'].disponibilidade);
  assert.deepStrictEqual(C.TAMANHOS, INTERFACE['pt-BR'].tamanhos);
  assert.deepStrictEqual(C.ORCAMENTOS, INTERFACE['pt-BR'].orcamentos);
  assert.strictEqual(C.AVISO_SEM_INFO, INTERFACE['pt-BR'].semInfo);
  assert.deepStrictEqual(Object.values(C.FAIXAS_PRECO).map((f) => f.rotulo), Object.values(INTERFACE['pt-BR'].faixas));
});

test('preço em reais com a pontuação de cada língua; sem preço vira "sob orçamento" traduzido', () => {
  assert.strictEqual(C.formatarPreco(1234.5), 'R$ 1.234,50');
  assert.strictEqual(C.formatarPreco(1234.5, 'en'), 'R$ 1,234.50');
  assert.strictEqual(C.formatarPreco(1234.5, 'es'), 'R$ 1.234,50');
  assert.strictEqual(C.formatarPreco(null, 'en'), 'Price on request');
  assert.strictEqual(C.formatarPreco(null, 'es'), 'Precio a consultar');
});

test('validação do pedido traduz as mensagens, mas a regra é a mesma em toda língua (RN02)', () => {
  for (const lingua of LINGUAS) {
    const { valido, erros } = C.validarPedido({ nome: '', quantidade: '0', ocasiao: '', cores: '', referencia: 'foto.jpg' }, null, lingua);
    assert.strictEqual(valido, false);
    assert.deepStrictEqual(Object.keys(erros).sort(), ['cores', 'nome', 'ocasiao', 'quantidade', 'referencia']);
    assert.deepStrictEqual(erros, Object.fromEntries(Object.keys(erros).map((k) => [k, INTERFACE[lingua].erros[k]])));
    assert.ok(C.validarPedido(pedido, produto, lingua).valido, lingua);
  }
  assert.strictEqual(C.validarPedido({}, null, 'en').erros.nome, 'Enter your name.');
  assert.strictEqual(C.validarPedido({}, null, 'es').erros.nome, 'Escribe tu nombre.');
});

test('produto indisponível nunca gera pedido, em nenhuma língua (RN01)', () => {
  for (const lingua of LINGUAS) {
    const r = C.validarPedido(pedido, { ...produto, disponibilidade: 'indisponivel' }, lingua);
    assert.strictEqual(r.valido, false, lingua);
    assert.strictEqual(r.erros.produto, INTERFACE[lingua].erros.produto);
  }
});

test('mensagem do WhatsApp em inglês e espanhol traz os mesmos campos e pede confirmação (US05)', () => {
  const en = C.montarMensagem(pedido, produto, 'en').split('\n');
  assert.strictEqual(en[0], 'Hi, Capim Urbano! I would like to place an order through the website.');
  assert.ok(en.includes('*Product:* Vaso terracota'));
  assert.ok(en.includes('*Reference price:* R$ 1,234.50'));
  assert.ok(en.includes('*Quantity:* 2'));
  assert.ok(en.includes('*Size:* Medium'));
  assert.ok(!en.some((l) => l.startsWith('*Budget:*')));
  assert.ok(en.includes('*Name:* Ana'));
  assert.strictEqual(en.at(-1), 'I look forward to your confirmation of availability and final price.');

  const es = C.montarMensagem(pedido, null, 'es').split('\n');
  assert.strictEqual(es[0], '¡Hola, Capim Urbano! Quiero hacer un pedido desde el sitio web.');
  assert.ok(es.includes('*Producto:* Arreglo personalizado (sin producto del catálogo)'));
  assert.ok(!es.some((l) => l.startsWith('*Precio de referencia:*')));
  assert.ok(es.includes('*Colores preferidos:* wine, cream'));
  assert.match(es.at(-1), /confirmación de disponibilidad y del precio final/);
});

test('etiquetas dos filtros e aviso de informação ausente seguem a língua (US02, US04)', () => {
  const filtros = { ocasiao: 'Decoração', cor: '', faixa: 'acima-200' };
  assert.deepStrictEqual(C.descreverFiltros(filtros, 'en'), [
    { campo: 'ocasiao', rotulo: 'Occasion', valor: 'Decoração' },
    { campo: 'faixa', rotulo: 'Price range', valor: 'Over R$ 200' }
  ]);
  assert.deepStrictEqual(C.descreverFiltros({ faixa: 'orcamento' }, 'es'), [{ campo: 'faixa', rotulo: 'Rango de precio', valor: 'Precio a consultar' }]);
  assert.strictEqual(C.textoOuAviso('', 'en'), 'Not provided. Ask the atelier on WhatsApp.');
  assert.strictEqual(C.textoOuAviso('  Longe do sol ', 'es'), 'Longe do sol');
});
