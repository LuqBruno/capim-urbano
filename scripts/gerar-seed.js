/* Gera o SQL de carga inicial a partir de catalogo-dados.js.
   Uso: node scripts/gerar-seed.js > supabase/migrations/20261028000400_seed_produtos_exemplo.sql */
import { PRODUTOS_PADRAO as lista } from '../src/lib/catalogo-dados.js';

const txt = (v) => (v == null || v === '' ? 'null' : "'" + String(v).replace(/'/g, "''") + "'");
const arr = (a) => (a && a.length ? 'array[' + a.map(txt).join(', ') + ']::text[]' : "'{}'::text[]");
const linhas = lista.map((p) =>
  '  (' + [txt(p.id), txt(p.nome), txt(p.categoria), txt(p.descricao), arr(p.fotos),
    p.preco == null ? 'null' : p.preco, txt(p.disponibilidade), txt(p.prazo), txt(p.durabilidade), txt(p.cuidados),
    arr(p.ocasioes), arr(p.cores), p.ativo === false ? 'false' : 'true'].join(', ') + ')');
console.log('-- ATENÇÃO: preços, prazos e disponibilidade são EXEMPLOS do MVP (catalogo-dados.js).');
console.log('-- A administradora deve conferi-los em admin.html antes de divulgar o site.');
console.log('insert into public.produtos (id, nome, categoria, descricao, fotos, preco, disponibilidade, prazo, durabilidade, cuidados, ocasioes, cores, ativo) values');
console.log(linhas.join(',\n') + '\non conflict (id) do nothing;');
