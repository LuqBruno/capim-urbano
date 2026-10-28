// Testes de tela (fluxo, responsividade e acessibilidade básica).
// O site testado é o de dist/: use `npm run test:e2e` (faz o build e roda) ou rode `npm run build` antes.
// O Supabase é simulado com page.route (nada vai à rede); o supabase-js já vai dentro do bundle do site.
// Requer o pacote "playwright" instalado globalmente ou no projeto e um Chromium.
// Executar: node --test tests/e2e.test.js
// Opcional: CHROMIUM_PATH=/caminho/do/chromium (padrão: o navegador do Playwright).
import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as C from '../src/lib/catalogo-core.js';
import { PRODUTOS_PADRAO as PADRAO } from '../src/lib/catalogo-dados.js';

const require = createRequire(import.meta.url); // respeita NODE_PATH, para achar o playwright global
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { /* sem playwright: testes são ignorados */ }

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };
const VIEWPORTS = { celular: { width: 375, height: 800 }, tablet: { width: 768, height: 1024 }, desktop: { width: 1280, height: 900 } };
const SUPABASE = 'https://gkpiwqztgzkuxvwrkpiy.supabase.co';
const EMAIL = 'admin@exemplo.test';
const SENHA = 'senha-de-teste';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const PAGINAS = ['index', 'catalogo', 'produto?id=vaso-terracota-capim', 'pedido', 'admin'];

const opts = { skip: !chromium && 'playwright não instalado' };
let servidor, base, navegador;

test.before(async () => {
  if (!chromium) return;
  if (!fs.existsSync(path.join(RAIZ, 'index.html'))) throw new Error('dist/ não existe: rode `npm run build` antes (ou use `npm run test:e2e`).');
  servidor = http.createServer((req, res) => {
    const arquivo = path.join(RAIZ, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!arquivo.startsWith(RAIZ) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
    fs.createReadStream(arquivo).pipe(res);
  });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  base = 'http://127.0.0.1:' + servidor.address().port + '/';
  navegador = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
});
test.after(async () => {
  if (navegador) await navegador.close();
  if (servidor) servidor.close();
});

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const TOKEN = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: 'u-1', role: 'authenticated', exp: 4102444800 }) + '.assinatura';
const USUARIA = { id: 'u-1', aud: 'authenticated', role: 'authenticated', email: EMAIL, app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };

/* Banco simulado: produtos, quem é administradora e falhas de rede sob demanda. */
function novoBanco(extra = {}) {
  return {
    linhas: PADRAO.map((p, i) => ({ ...C.produtoParaLinha(p), criado_em: '2026-01-0' + (i + 1) + 'T00:00:00Z', atualizado_em: '2026-01-0' + (i + 1) + 'T00:00:00Z' })),
    administradora: true, falhaRede: false, falhaProdutos: false, atrasoMs: 0, chamadas: [], fotosEnviadas: [], ...extra
  };
}

/* Intercepta o Supabase. Visitante (chave publicável) só vê ativos; com o token, a administradora vê tudo. */
async function simularSupabase(ctx, banco) {
  await ctx.route(SUPABASE + '/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const cors = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': req.headers()['access-control-request-headers'] || '*',
      'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'access-control-expose-headers': '*'
    };
    const json = (status, corpo) => route.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(corpo) });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    banco.chamadas.push(req.method() + ' ' + url.pathname + url.search);
    if (banco.atrasoMs) await new Promise((ok) => setTimeout(ok, banco.atrasoMs));
    if (banco.falhaRede) return route.abort('failed');
    const logada = (req.headers().authorization || '') === 'Bearer ' + TOKEN;
    const igual = url.searchParams.get('id');
    const id = igual && igual.replace(/^eq\./, '');

    if (url.pathname === '/auth/v1/token' && req.method() === 'POST') {
      const corpo = JSON.parse(req.postData() || '{}');
      if (corpo.email === EMAIL && corpo.password === SENHA) {
        return json(200, { access_token: TOKEN, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r', user: USUARIA });
      }
      return json(400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
    }
    if (url.pathname === '/auth/v1/user') return json(200, USUARIA);
    if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, headers: cors });
    if (url.pathname === '/rest/v1/administradoras') return json(200, logada && banco.administradora ? [{ user_id: 'u-1' }] : []);
    if (url.pathname.startsWith('/storage/v1/object/public/produtos/')) return route.fulfill({ status: 200, headers: cors, contentType: 'image/png', body: PNG });
    if (url.pathname.startsWith('/storage/v1/object/produtos/')) {
      if (!logada) return json(403, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' });
      const caminho = decodeURIComponent(url.pathname.replace('/storage/v1/object/produtos/', ''));
      banco.fotosEnviadas.push({ caminho, tipo: req.headers()['content-type'], corpo: req.postDataBuffer().toString('latin1') });
      return json(200, { Key: 'produtos/' + caminho });
    }
    if (url.pathname === '/rest/v1/produtos') {
      if (banco.falhaProdutos) return route.abort('failed');
      if (req.method() === 'GET') return json(200, banco.linhas.filter((l) => logada || l.ativo));
      if (!logada) return json(401, { code: '42501', message: 'new row violates row-level security policy for table "produtos"' });
      if (req.method() === 'POST') {
        const linha = { ...JSON.parse(req.postData()), criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() };
        if (banco.linhas.some((l) => l.id === linha.id)) return json(409, { code: '23505', message: 'duplicate key value' });
        banco.linhas.push(linha);
        return json(201, [linha]);
      }
      if (req.method() === 'PATCH') {
        const alvo = banco.linhas.find((l) => l.id === id);
        if (!alvo) return json(200, []);
        Object.assign(alvo, JSON.parse(req.postData()));
        return json(200, [alvo]);
      }
    }
    return json(404, { message: 'rota não simulada: ' + url.pathname });
  });
}

/* Espera a página terminar de buscar os produtos (os estados de carregando e erro também contam como "terminou"). */
async function aguardarCarga(page, url) {
  if (url.startsWith('catalogo')) await page.waitForFunction(() => document.getElementById('catalogo-contagem').textContent !== 'Carregando produtos…');
  else if (url.startsWith('produto')) await page.waitForFunction(() => !/^Carregando produto/.test(document.getElementById('produto').textContent));
  else if (url.startsWith('pedido')) {
    if (/produto=/.test(url)) await page.waitForSelector('#produto-escolhido:not([hidden])');
    else await page.waitForSelector('#ocasioes-sugeridas option', { state: 'attached' });
  } else if (url.startsWith('admin')) await page.waitForSelector('#admin-carregando', { state: 'hidden' });
}

async function abrir(viewport, url, banco = novoBanco(), esperar = true) {
  const ctx = await navegador.newContext({ viewport });
  await simularSupabase(ctx, banco);
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/fonts\.(g|gstatic)|net::ERR|Failed to load resource/.test(m.text()) && erros.push(m.text()));
  await page.goto(base + url);
  if (esperar) await aguardarCarga(page, url);
  return { ctx, page, erros, banco };
}

/* Abre admin.html e entra com o e-mail e a senha de teste. */
async function abrirAdminLogada(viewport, banco = novoBanco()) {
  const t = await abrir(viewport, 'admin.html', banco);
  await entrar(t.page);
  await t.page.waitForSelector('#area-admin:not([hidden])');
  await aguardarTabela(t.page);
  return t;
}
const aguardarTabela = (page) => page.waitForFunction(() => !/Carregando produtos…/.test(document.getElementById('tabela').textContent));
async function entrar(page, email = EMAIL, senha = SENHA) {
  await page.fill('#l-email', email);
  await page.fill('#l-senha', senha);
  await page.click('#entrar');
}
const preencherProduto = async (page, d) => {
  await page.fill('#a-nome', d.nome); await page.fill('#a-cat', d.categoria || 'Teste'); await page.fill('#a-desc', d.descricao || 'Descrição');
  if (d.fotos) await page.fill('#a-fotos', d.fotos);
  await page.fill('#a-prazo', d.prazo || '2 dias');
  if (d.preco) await page.fill('#a-preco', d.preco);
};

for (const [nomeVp, vp] of Object.entries(VIEWPORTS)) {
  for (const pagina of PAGINAS) {
    test(`responsivo: ${pagina} sem rolagem horizontal nem erros (${nomeVp})`, opts, async () => {
      const { ctx, page, erros } = await abrir(vp, pagina.includes('.') || pagina.includes('?') ? pagina.replace(/^([a-z]+)(\?.*)?$/, '$1.html$2') : pagina + '.html');
      assert.strictEqual(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'rolagem horizontal');
      assert.deepStrictEqual(erros, []);
      await ctx.close();
    });
  }
}

for (const [nomeVp, vp] of Object.entries(VIEWPORTS)) {
  test(`responsivo: administração logada sem rolagem horizontal nem erros (${nomeVp})`, opts, async () => {
    const { ctx, page, erros } = await abrirAdminLogada(vp);
    assert.strictEqual(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'rolagem horizontal');
    assert.deepStrictEqual(erros, []);
    await ctx.close();
  });
}

test('catálogo: filtros combinam, mostram estado vazio e limpam (US02)', opts, async () => {
  const { ctx, page } = await abrir(VIEWPORTS.celular, 'catalogo.html');
  const total = await page.locator('.product-card').count();
  assert.ok(total >= 5);
  await page.selectOption('#f-ocasiao', 'Decoração');
  await page.selectOption('#f-cor', 'Terracota');
  assert.strictEqual(await page.locator('.product-card').count(), 2);
  assert.match(page.url(), /ocasiao=Decora/);
  await page.selectOption('#f-faixa', 'orcamento');
  assert.strictEqual(await page.locator('#catalogo-vazio').isVisible(), true);
  await page.click('#limpar-vazio');
  assert.strictEqual(await page.locator('.product-card').count(), total);
  await ctx.close();
});

test('pedido: valida, mostra resumo e gera link do WhatsApp (US03, US05)', opts, async () => {
  const { ctx, page } = await abrir(VIEWPORTS.desktop, 'pedido.html?produto=vaso-terracota-capim');
  await page.click('button[type=submit]');
  assert.strictEqual(await page.locator('#resumo').isVisible(), false);
  assert.ok((await page.locator('.field-error:visible').count()) >= 3);
  assert.strictEqual(await page.evaluate(() => document.activeElement.id), 'p-nome', 'foco no primeiro erro');
  await page.fill('#p-nome', 'Ana');
  await page.fill('#p-ocasiao', 'Aniversário');
  await page.fill('#p-cores', 'vinho');
  await page.click('button[type=submit]');
  assert.strictEqual(await page.locator('#resumo').isVisible(), true);
  const href = new URL(await page.getAttribute('#enviar-whatsapp', 'href'));
  assert.strictEqual(href.origin + href.pathname, 'https://wa.me/5548991765295');
  const texto = href.searchParams.get('text');
  assert.ok(texto.includes('Vaso terracota com capim laranja') && texto.includes('*Ocasião:* Aniversário') && texto.includes('*Nome:* Ana'));
  await ctx.close();
});

test('pedido: produto indisponível não gera resumo (RN01)', opts, async () => {
  const { ctx, page } = await abrir(VIEWPORTS.desktop, 'pedido.html?produto=composicao-estudio-creme');
  await page.fill('#p-nome', 'Ana'); await page.fill('#p-ocasiao', 'x'); await page.fill('#p-cores', 'y');
  await page.click('button[type=submit]');
  assert.strictEqual(await page.locator('#resumo').isVisible(), false);
  await ctx.close();
});

test('acessibilidade: campos com rótulo, imagens com alt e menu por teclado (NFR02)', opts, async () => {
  for (const pagina of ['catalogo.html', 'pedido.html', 'admin.html', 'produto.html?id=vaso-terracota-capim']) {
    const { ctx, page } = await abrir(VIEWPORTS.desktop, pagina);
    await page.waitForTimeout(200);
    const semRotulo = await page.evaluate(() =>
      [...document.querySelectorAll('input:not([type=hidden]):not([type=file]), select, textarea')]
        .filter((el) => !el.labels.length && !el.getAttribute('aria-label')).map((el) => el.name || el.id));
    assert.deepStrictEqual(semRotulo, [], pagina + ': campos sem rótulo');
    const semAlt = await page.evaluate(() => [...document.querySelectorAll('img:not([alt])')].map((i) => i.src));
    assert.deepStrictEqual(semAlt, [], pagina + ': imagens sem alt');
    assert.ok(await page.locator('html[lang="pt-BR"]').count(), pagina + ': sem lang');
    await ctx.close();
  }
  const { ctx, page } = await abrir(VIEWPORTS.celular, 'catalogo.html');
  await page.click('.menu-toggle');
  assert.strictEqual(await page.getAttribute('.menu-toggle', 'aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  assert.strictEqual(await page.getAttribute('.menu-toggle', 'aria-expanded'), 'false');
  await ctx.close();
});

test('produto: cuidados, durabilidade e prazo aparecem para cada produto (US04)', opts, async () => {
  const { ctx, page } = await abrir(VIEWPORTS.celular, 'produto.html?id=vaso-terracota-capim');
  const specs = await page.locator('.specs .spec').allTextContents();
  const texto = specs.join(' | ');
  assert.match(texto, /Prazo de produção ou entrega/);
  assert.match(texto, /Durabilidade.*Mais de 1 ano/);
  assert.match(texto, /Cuidados.*longe de água/);
  assert.strictEqual(await page.locator('.spec-missing').count(), 0);
  await ctx.close();
});

const nomesDosCartoes = (page) => page.locator('.product-card h2').allTextContents();

test('catálogo: mostra "Carregando produtos…" e depois os produtos do banco (US01)', opts, async () => {
  const { ctx, page, banco } = await abrir(VIEWPORTS.celular, 'catalogo.html', novoBanco({ atrasoMs: 400 }), false);
  assert.strictEqual(await page.textContent('#catalogo-contagem'), 'Carregando produtos…');
  assert.strictEqual(await page.locator('.product-card').count(), 0);
  await page.waitForSelector('.product-card');
  assert.strictEqual(await page.locator('.product-card').count(), PADRAO.length);
  assert.match(await page.textContent('#catalogo-contagem'), /7 produtos encontrados/);
  assert.ok(banco.chamadas.some((c) => c.startsWith('GET /rest/v1/produtos')));
  await ctx.close();
});

test('catálogo: o que o banco devolve manda; produto desativado não aparece (RN01)', opts, async () => {
  const banco = novoBanco();
  banco.linhas[5].ativo = false; // guirlanda
  banco.linhas[0].preco = 150.5;
  const { ctx, page } = await abrir(VIEWPORTS.desktop, 'catalogo.html', banco);
  const nomes = await nomesDosCartoes(page);
  assert.strictEqual(nomes.length, 6);
  assert.ok(!nomes.includes('Guirlanda de flores desidratadas'));
  assert.match(await page.locator('.product-card', { hasText: 'Vaso terracota' }).textContent(), /150,50/);
  await ctx.close();
});

test('catálogo: erro de rede mostra mensagem e "Tentar de novo" recupera (NFR02)', opts, async () => {
  const { ctx, page, banco } = await abrir(VIEWPORTS.celular, 'catalogo.html', novoBanco({ falhaRede: true }));
  assert.strictEqual(await page.locator('#catalogo-erro').isVisible(), true);
  assert.match(await page.textContent('#catalogo-erro'), /Não foi possível carregar os produtos/);
  assert.strictEqual(await page.locator('.product-card').count(), 0, 'não mostra os exemplos como se fossem reais');
  assert.strictEqual(await page.locator('#catalogo-vazio').isVisible(), false);
  banco.falhaRede = false;
  await page.click('#tentar-de-novo');
  await page.waitForSelector('.product-card');
  assert.strictEqual(await page.locator('#catalogo-erro').isVisible(), false);
  assert.strictEqual(await page.locator('.product-card').count(), PADRAO.length);
  await ctx.close();
});

test('catálogo: tentar de novo mantém os filtros escolhidos', opts, async () => {
  const { ctx, page, banco } = await abrir(VIEWPORTS.desktop, 'catalogo.html?ocasiao=Decora%C3%A7%C3%A3o');
  const antes = await page.locator('.product-card').count();
  assert.ok(antes > 0 && antes < PADRAO.length);
  banco.falhaRede = true;
  await page.reload();
  await page.waitForSelector('#catalogo-erro:not([hidden])');
  banco.falhaRede = false;
  await page.click('#tentar-de-novo');
  await page.waitForSelector('.product-card');
  assert.strictEqual(await page.inputValue('#f-ocasiao'), 'Decoração');
  assert.strictEqual(await page.locator('.product-card').count(), antes);
  await ctx.close();
});

test('catálogo: banco sem produtos mostra o estado vazio', opts, async () => {
  const { ctx, page } = await abrir(VIEWPORTS.desktop, 'catalogo.html', novoBanco({ linhas: [] }));
  assert.strictEqual(await page.locator('.product-card').count(), 0);
  assert.strictEqual(await page.locator('#catalogo-vazio').isVisible(), true);
  await ctx.close();
});

test('produto: erro de rede oferece "Tentar de novo"', opts, async () => {
  const { ctx, page, banco } = await abrir(VIEWPORTS.celular, 'produto.html?id=vaso-terracota-capim', novoBanco({ falhaRede: true }));
  assert.match(await page.textContent('#produto'), /Não foi possível carregar o produto/);
  banco.falhaRede = false;
  await page.click('#produto button:has-text("Tentar de novo")');
  await page.waitForSelector('#produto h1:has-text("Vaso terracota")');
  await ctx.close();
});

test('produto de outro visitante: desativado no banco vira "Produto não encontrado"', opts, async () => {
  const banco = novoBanco();
  banco.linhas[0].ativo = false;
  const { ctx, page } = await abrir(VIEWPORTS.desktop, 'produto.html?id=vaso-terracota-capim', banco);
  assert.match(await page.textContent('#produto'), /Produto não encontrado/);
  await ctx.close();
});

test('produto sem cuidados e durabilidade mostra aviso, sem campo vazio (US04)', opts, async () => {
  const banco = novoBanco();
  Object.assign(banco.linhas[0], { durabilidade: null, cuidados: null });
  const { ctx, page } = await abrir(VIEWPORTS.desktop, 'produto.html?id=vaso-terracota-capim', banco);
  assert.strictEqual(await page.locator('.spec-missing').count(), 2);
  assert.match(await page.locator('.spec-missing').first().textContent(), /Não informado/);
  await ctx.close();
});

test('pedido: produto indisponível no banco bloqueia o pedido, mesmo preenchido (RN01)', opts, async () => {
  const banco = novoBanco();
  banco.linhas.find((l) => l.id === 'vaso-terracota-capim').disponibilidade = 'indisponivel';
  const { ctx, page } = await abrir(VIEWPORTS.desktop, 'pedido.html?produto=vaso-terracota-capim', banco);
  assert.match(await page.textContent('#produto-escolhido'), /indisponível no momento/);
  await page.fill('#p-nome', 'Ana'); await page.fill('#p-ocasiao', 'x'); await page.fill('#p-cores', 'y');
  await page.click('button[type=submit]');
  assert.strictEqual(await page.locator('#resumo').isVisible(), false);
  await ctx.close();
});

test('pedido: se o produto do link não carregar, o pedido fica bloqueado até tentar de novo', opts, async () => {
  const { ctx, page, banco } = await abrir(VIEWPORTS.desktop, 'pedido.html?produto=vaso-terracota-capim', novoBanco({ falhaRede: true }));
  assert.match(await page.textContent('#produto-escolhido'), /Não foi possível carregar o produto/);
  await page.fill('#p-nome', 'Ana'); await page.fill('#p-ocasiao', 'x'); await page.fill('#p-cores', 'y');
  await page.click('button[type=submit]');
  assert.strictEqual(await page.locator('#resumo').isVisible(), false);
  banco.falhaRede = false;
  await page.click('#produto-escolhido button:has-text("Tentar de novo")');
  await page.waitForSelector('#produto-escolhido .product-name');
  await page.fill('#p-nome', 'Ana'); await page.fill('#p-ocasiao', 'x'); await page.fill('#p-cores', 'y');
  await page.click('button[type=submit]');
  assert.strictEqual(await page.locator('#resumo').isVisible(), true);
  await ctx.close();
});

/* ---------- Administração ---------- */

test('administração: sem login só aparece o formulário de entrada e nada é buscado (US06)', opts, async () => {
  const { ctx, page, banco } = await abrir(VIEWPORTS.celular, 'admin.html');
  assert.strictEqual(await page.locator('#form-login').isVisible(), true);
  assert.strictEqual(await page.locator('#area-admin').isVisible(), false);
  assert.strictEqual(await page.locator('#tabela tr').count(), 1);
  assert.ok(!banco.chamadas.some((c) => c.includes('/rest/v1/produtos')), 'não busca produtos sem login');
  await ctx.close();
});

test('administração: login com campos vazios mostra erros e leva o foco ao primeiro', opts, async () => {
  const { ctx, page } = await abrir(VIEWPORTS.desktop, 'admin.html');
  await page.click('#entrar');
  assert.strictEqual(await page.locator('#form-login .field-error:visible').count(), 2);
  assert.strictEqual(await page.evaluate(() => document.activeElement.id), 'l-email');
  assert.strictEqual(await page.getAttribute('#l-email', 'aria-invalid'), 'true');
  await ctx.close();
});

test('administração: login inválido é recusado sem abrir a área', opts, async () => {
  const { ctx, page } = await abrir(VIEWPORTS.desktop, 'admin.html');
  await entrar(page, EMAIL, 'senha-errada');
  await page.waitForFunction(() => /incorretos/.test(document.getElementById('login-status').textContent));
  assert.strictEqual(await page.getAttribute('#login-status', 'role'), 'alert');
  assert.strictEqual(await page.locator('#area-admin').isVisible(), false);
  assert.strictEqual(await page.inputValue('#l-senha'), '', 'a senha digitada é apagada');
  await ctx.close();
});

test('administração: login sem conexão mostra erro de rede, não "senha incorreta"', opts, async () => {
  const { ctx, page, banco } = await abrir(VIEWPORTS.desktop, 'admin.html');
  banco.falhaRede = true;
  await entrar(page);
  await page.waitForFunction(() => /conexão/.test(document.getElementById('login-status').textContent));
  assert.strictEqual(await page.locator('#area-admin').isVisible(), false);
  await ctx.close();
});

test('administração: conta que não é administradora é recusada', opts, async () => {
  const { ctx, page } = await abrir(VIEWPORTS.desktop, 'admin.html', novoBanco({ administradora: false }));
  await entrar(page);
  await page.waitForFunction(() => /não tem permissão/.test(document.getElementById('login-status').textContent));
  assert.strictEqual(await page.locator('#area-admin').isVisible(), false);
  await ctx.close();
});

test('administração: login válido lista todos os produtos, inclusive desativados; sair volta ao login', opts, async () => {
  const banco = novoBanco();
  banco.linhas[5].ativo = false;
  const { ctx, page } = await abrirAdminLogada(VIEWPORTS.desktop, banco);
  assert.strictEqual(await page.locator('#tabela tr').count(), 7);
  assert.strictEqual(await page.locator('#tabela tr', { hasText: 'Guirlanda' }).locator('td').nth(2).textContent(), 'Não');
  await page.reload();
  await page.waitForSelector('#area-admin:not([hidden])');
  await aguardarTabela(page);
  assert.strictEqual(await page.locator('#tabela tr').count(), 7, 'a sessão continua após recarregar');
  await page.click('#sair');
  await page.waitForSelector('#form-login', { state: 'visible' });
  assert.strictEqual(await page.locator('#area-admin').isVisible(), false);
  await page.reload();
  await page.waitForSelector('#form-login', { state: 'visible' });
  await ctx.close();
});

test('administração: cadastro novo, com foto enviada ao Storage, aparece no catálogo (US06, RN01)', opts, async () => {
  const { ctx, page, banco } = await abrirAdminLogada(VIEWPORTS.desktop);
  await page.click('#form-produto button[type=submit]');
  assert.ok((await page.locator('#form-produto .field-error:visible').count()) >= 4);
  assert.strictEqual(await page.getAttribute('#admin-status', 'role'), 'alert');
  await preencherProduto(page, { nome: 'Produto novo', preco: '49,90' });
  await page.click('#form-produto button[type=submit]');
  assert.match(await page.textContent('#form-produto .field-error:visible'), /ao menos uma foto/, 'sem foto não salva');
  await page.setInputFiles('#a-arquivos', { name: 'Foto Bonita.png', mimeType: 'image/png', buffer: PNG });
  await page.click('#form-produto button[type=submit]');
  await page.waitForFunction(() => /Produto salvo/.test(document.getElementById('admin-status').textContent));
  assert.strictEqual(banco.fotosEnviadas.length, 1);
  assert.match(banco.fotosEnviadas[0].caminho, /^produto-novo\/foto-bonita-[a-z0-9]+\.png$/);
  assert.match(banco.fotosEnviadas[0].corpo, /Content-Type: image\/png/, 'envia o arquivo com o tipo da imagem');
  const gravado = banco.linhas.find((l) => l.id === 'produto-novo');
  assert.strictEqual(gravado.preco, 49.9);
  assert.strictEqual(gravado.ativo, true);
  assert.strictEqual(gravado.cuidados, null, 'campo vazio vai como null');
  assert.match(gravado.fotos[0], /\/storage\/v1\/object\/public\/produtos\/produto-novo\/foto-bonita-/);
  assert.strictEqual(await page.locator('#tabela tr').count(), 8);
  await page.goto(base + 'catalogo.html');
  await page.waitForSelector('.product-card');
  assert.strictEqual(await page.locator('.product-card h2', { hasText: 'Produto novo' }).count(), 1);
  await ctx.close();
});

test('administração: cadastro com nome repetido ganha identificador com sufixo', opts, async () => {
  const { ctx, page, banco } = await abrirAdminLogada(VIEWPORTS.desktop);
  await preencherProduto(page, { nome: 'Vaso terracota com capim laranja', fotos: 'imagens/web/capim5.webp' });
  await page.click('#form-produto button[type=submit]');
  await page.waitForFunction(() => /Produto salvo/.test(document.getElementById('admin-status').textContent));
  assert.ok(banco.linhas.some((l) => l.id === 'vaso-terracota-com-capim-laranja'));
  await ctx.close();
});

test('administração: foto de tipo ou tamanho inválido é recusada antes de enviar', opts, async () => {
  const { ctx, page, banco } = await abrirAdminLogada(VIEWPORTS.desktop);
  await preencherProduto(page, { nome: 'Com foto ruim' });
  await page.setInputFiles('#a-arquivos', { name: 'documento.pdf', mimeType: 'application/pdf', buffer: Buffer.from('x') });
  await page.click('#form-produto button[type=submit]');
  assert.match(await page.textContent('[data-campo=arquivos] .field-error'), /WebP, JPEG ou PNG/);
  await page.setInputFiles('#a-arquivos', { name: 'grande.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
  await page.click('#form-produto button[type=submit]');
  assert.match(await page.textContent('[data-campo=arquivos] .field-error'), /2 MB/);
  assert.strictEqual(banco.fotosEnviadas.length, 0);
  assert.ok(!banco.linhas.some((l) => l.id === 'com-foto-ruim'));
  assert.strictEqual(await page.evaluate(() => document.activeElement.id), 'a-arquivos');
  await ctx.close();
});

test('administração: edição e disponibilidade refletem no catálogo e no pedido (US06, RN01)', opts, async () => {
  const { ctx, page, banco } = await abrirAdminLogada(VIEWPORTS.desktop);
  await page.click('button[aria-label="Editar: Vaso terracota com capim laranja"]');
  assert.strictEqual(await page.inputValue('#a-nome'), 'Vaso terracota com capim laranja');
  assert.strictEqual(await page.inputValue('#a-fotos'), 'imagens/web/capim5.webp');
  await page.fill('#a-preco', '150,50');
  await page.selectOption('#a-disp', 'indisponivel');
  await page.click('#form-produto button[type=submit]');
  await page.waitForFunction(() => /Produto salvo/.test(document.getElementById('admin-status').textContent));
  const gravado = banco.linhas.find((l) => l.id === 'vaso-terracota-capim');
  assert.strictEqual(gravado.preco, 150.5);
  assert.strictEqual(gravado.disponibilidade, 'indisponivel');
  assert.ok(banco.chamadas.some((c) => c.startsWith('PATCH /rest/v1/produtos?id=eq.vaso-terracota-capim')));
  assert.strictEqual(banco.linhas.length, PADRAO.length, 'editar não cria outro produto');
  await page.goto(base + 'catalogo.html');
  await page.waitForSelector('.product-card');
  const cartao = page.locator('.product-card', { hasText: 'Vaso terracota com capim laranja' });
  assert.match(await cartao.textContent(), /150,50/);
  assert.match(await cartao.textContent(), /Indisponível/);
  await page.goto(base + 'produto.html?id=vaso-terracota-capim');
  await page.waitForSelector('#produto h1');
  assert.strictEqual(await page.locator('a', { hasText: 'Fazer pedido' }).count(), 0, 'indisponível não oferece pedido');
  await page.goto(base + 'pedido.html?produto=vaso-terracota-capim');
  await page.waitForSelector('#produto-escolhido:not([hidden])');
  await page.fill('#p-nome', 'Ana'); await page.fill('#p-ocasiao', 'x'); await page.fill('#p-cores', 'y');
  await page.click('button[type=submit]');
  assert.strictEqual(await page.locator('#resumo').isVisible(), false);
  await ctx.close();
});

test('administração: desativar tira do catálogo e reativar devolve (US06)', opts, async () => {
  const { ctx, page, banco } = await abrirAdminLogada(VIEWPORTS.desktop);
  const nome = 'Guirlanda de flores desidratadas';
  await page.click(`button[aria-label="Desativar: ${nome}"]`);
  await page.waitForFunction(() => /Desativado/.test(document.getElementById('admin-status').textContent));
  assert.strictEqual(banco.linhas.find((l) => l.id === 'guirlanda-desidratada').ativo, false);
  assert.strictEqual(await page.locator(`button[aria-label="Reativar: ${nome}"]`).count(), 1);
  const visitante = await ctx.newPage();
  await visitante.goto(base + 'catalogo.html');
  await visitante.waitForSelector('.product-card');
  assert.strictEqual(await visitante.locator('.product-card', { hasText: nome }).count(), 0);
  await page.click(`button[aria-label="Reativar: ${nome}"]`);
  await page.waitForFunction(() => /Reativado/.test(document.getElementById('admin-status').textContent));
  await visitante.reload();
  await visitante.waitForSelector('.product-card');
  assert.strictEqual(await visitante.locator('.product-card', { hasText: nome }).count(), 1);
  await ctx.close();
});

test('administração: erro ao salvar mostra mensagem e mantém o que foi digitado', opts, async () => {
  const { ctx, page, banco } = await abrirAdminLogada(VIEWPORTS.celular);
  await preencherProduto(page, { nome: 'Não vai salvar', fotos: 'imagens/web/capim5.webp' });
  banco.falhaRede = true;
  await page.click('#form-produto button[type=submit]');
  await page.waitForFunction(() => /Não foi possível salvar/.test(document.getElementById('admin-status').textContent));
  assert.strictEqual(await page.getAttribute('#admin-status', 'role'), 'alert');
  assert.strictEqual(await page.inputValue('#a-nome'), 'Não vai salvar');
  assert.strictEqual(await page.locator('#form-produto button[type=submit]').isEnabled(), true);
  assert.ok(!banco.linhas.some((l) => l.id === 'nao-vai-salvar'));
  await ctx.close();
});

test('administração: escrita negada pelo banco (sem efeito) não é tratada como sucesso', opts, async () => {
  const { ctx, page, banco } = await abrirAdminLogada(VIEWPORTS.desktop);
  banco.linhas = banco.linhas.filter((l) => l.id !== 'guirlanda-desidratada'); // o PATCH não acha linha, como a RLS faria
  await page.click('button[aria-label="Desativar: Guirlanda de flores desidratadas"]');
  await page.waitForFunction(() => /Não foi possível alterar/.test(document.getElementById('admin-status').textContent));
  assert.strictEqual(await page.getAttribute('#admin-status', 'role'), 'alert');
  assert.strictEqual(await page.locator('button[aria-label="Desativar: Guirlanda de flores desidratadas"]').count(), 1);
  await ctx.close();
});

test('administração: erro ao carregar a lista oferece "Tentar de novo"; lista vazia tem aviso', opts, async () => {
  const banco = novoBanco({ falhaProdutos: true });
  const { ctx, page } = await abrir(VIEWPORTS.desktop, 'admin.html', banco);
  await entrar(page);
  await page.waitForSelector('#tabela button:has-text("Tentar de novo")');
  assert.match(await page.textContent('#tabela'), /Não foi possível carregar os produtos/);
  assert.strictEqual(await page.getAttribute('#admin-status', 'role'), 'alert');
  banco.falhaProdutos = false;
  banco.linhas = [];
  await page.click('#tabela button:has-text("Tentar de novo")');
  await page.waitForFunction(() => /Nenhum produto cadastrado/.test(document.getElementById('tabela').textContent));
  await ctx.close();
});

test('o site não grava produtos no localStorage', opts, async () => {
  const { ctx, page } = await abrirAdminLogada(VIEWPORTS.desktop);
  await preencherProduto(page, { nome: 'Sem cache local', fotos: 'imagens/web/capim5.webp' });
  await page.click('#form-produto button[type=submit]');
  await page.waitForFunction(() => /Produto salvo/.test(document.getElementById('admin-status').textContent));
  const chaves = await page.evaluate(() => Object.keys(localStorage));
  assert.ok(!chaves.includes('capim.produtos.v1'), 'chaves: ' + chaves);
  assert.ok(chaves.every((c) => c.startsWith('sb-')), 'só a sessão do Supabase: ' + chaves);
  await ctx.close();
});
