// Executar: node --test tests/varal-core.test.js
import test from 'node:test';
import assert from 'node:assert';
import { clamp, alturaCordao, passoMola, passoBalanco, maisProxima, proximaFoto, doisDigitos } from '../src/lib/varal-core.js';

test('cordão: preso nas pontas e cedendo o máximo no meio', () => {
  assert.strictEqual(alturaCordao(0, 1000, 100, 40), 100);
  assert.strictEqual(alturaCordao(1000, 1000, 100, 40), 100);
  assert.strictEqual(alturaCordao(500, 1000, 100, 40), 140);
  assert.ok(alturaCordao(250, 1000, 100, 40) < 140 && alturaCordao(250, 1000, 100, 40) > 100);
  assert.strictEqual(alturaCordao(-50, 1000, 100, 40), 100, 'fora da tela fica na altura da ponta');
});

test('mola: chega ao alvo sem passar muito e para', () => {
  let x = 0, v = 0, maior = 0;
  for (let i = 0; i < 240; i++) { [x, v] = passoMola(x, v, 100, 1 / 60); maior = Math.max(maior, x); }
  assert.ok(Math.abs(x - 100) < 0.5, 'posição final ' + x);
  assert.ok(Math.abs(v) < 1, 'velocidade final ' + v);
  assert.ok(maior < 106, 'overshoot pequeno: ' + maior);
});

test('balanço: a foto fica para trás do movimento, volta ao repouso e respeita o limite', () => {
  let [a, w] = passoBalanco(0, 0, 2000, 1 / 60, 1);
  assert.ok(a > 0, 'cordão indo para a direita inclina a foto');
  for (let i = 0; i < 600; i++) [a, w] = passoBalanco(a, w, 0, 1 / 60, 1);
  assert.ok(Math.abs(a) < 0.001, 'volta ao repouso: ' + a);
  let b = 0, bw = 0;
  for (let i = 0; i < 200; i++) [b, bw] = passoBalanco(b, bw, 1e7, 1 / 60, 1);
  assert.ok(Math.abs(b) <= 0.6, 'ângulo limitado: ' + b);
  assert.deepStrictEqual(passoBalanco(0, 0, 5000, 1 / 60, 0), [0, 0], 'ganho 0 (menos movimento) não balança');
});

test('foto ativa: a mais perto do centro, dentro dos limites', () => {
  assert.strictEqual(maisProxima(0, 280, 8), 0);
  assert.strictEqual(maisProxima(130, 280, 8), 0);
  assert.strictEqual(maisProxima(150, 280, 8), 1);
  assert.strictEqual(maisProxima(-900, 280, 8), 0);
  assert.strictEqual(maisProxima(99999, 280, 8), 7);
  assert.strictEqual(maisProxima(500, 280, 0), 0);
});

test('autoplay volta à primeira depois da última; formatação do contador', () => {
  assert.strictEqual(proximaFoto(0, 8), 1);
  assert.strictEqual(proximaFoto(7, 8), 0);
  assert.strictEqual(proximaFoto(0, 0), 0);
  assert.strictEqual(doisDigitos(3), '03');
  assert.strictEqual(doisDigitos(12), '12');
  assert.strictEqual(clamp(5, 0, 3), 3);
});
