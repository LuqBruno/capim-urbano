// Testes de tela (fluxo, responsividade e acessibilidade básica).
// Requer o pacote "playwright" instalado globalmente ou no projeto e um Chromium.
// Executar: node --test tests/e2e.test.js
// Opcional: CHROMIUM_PATH=/caminho/do/chromium (padrão: o navegador do Playwright).
const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { /* sem playwright: testes são ignorados */ }

const RAIZ = path.join(__dirname, '..');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };
const VIEWPORTS = { celular: { width: 375, height: 800 }, tablet: { width: 768, height: 1024 }, desktop: { width: 1280, height: 900 } };
const PAGINAS = ['index', 'catalogo', 'produto?id=vaso-terracota-capim', 'pedido', 'admin'];

const opts = { skip: !chromium && 'playwright não instalado' };
let servidor, base, navegador;

test.before(async () => {
  if (!chromium) return;
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

async function abrir(viewport, url) {
  const ctx = await navegador.newContext({ viewport });
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/fonts\.(g|gstatic)|net::ERR/.test(m.text()) && erros.push(m.text()));
  await page.goto(base + url);
  return { ctx, page, erros };
}

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

test('administração: cadastro novo aparece no catálogo (US06, neste navegador)', opts, async () => {
  const { ctx, page } = await abrir(VIEWPORTS.desktop, 'admin.html');
  await page.click('#form-produto button[type=submit]');
  assert.ok((await page.locator('#form-produto .field-error:visible').count()) >= 4);
  await page.fill('#a-nome', 'Produto de teste'); await page.fill('#a-cat', 'Teste'); await page.fill('#a-desc', 'Descrição');
  await page.fill('#a-fotos', 'imagens/web/capim5.webp'); await page.fill('#a-preco', '49,90'); await page.fill('#a-prazo', '2 dias');
  await page.click('#form-produto button[type=submit]');
  await page.goto(base + 'catalogo.html');
  assert.ok((await page.locator('.product-card h2', { hasText: 'Produto de teste' }).count()) === 1);
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

test('produto sem cuidados e durabilidade mostra aviso, sem campo vazio (US04)', opts, async () => {
  const { ctx, page } = await abrir(VIEWPORTS.desktop, 'admin.html');
  await page.fill('#a-nome', 'Sem detalhes'); await page.fill('#a-cat', 'Teste'); await page.fill('#a-desc', 'd');
  await page.fill('#a-fotos', 'imagens/web/capim5.webp'); await page.fill('#a-prazo', '3 dias');
  await page.click('#form-produto button[type=submit]');
  await page.goto(base + 'produto.html?id=sem-detalhes');
  assert.strictEqual(await page.locator('.spec-missing').count(), 2);
  assert.match(await page.locator('.spec-missing').first().textContent(), /Não informado/);
  await ctx.close();
});

test('administração: edição e disponibilidade refletem no catálogo e no pedido (US06, RN01)', opts, async () => {
  const { ctx, page } = await abrir(VIEWPORTS.desktop, 'admin.html');
  await page.click('button[aria-label="Editar: Vaso terracota com capim laranja"]');
  assert.strictEqual(await page.inputValue('#a-nome'), 'Vaso terracota com capim laranja');
  await page.fill('#a-preco', '150,50');
  await page.selectOption('#a-disp', 'indisponivel');
  await page.click('#form-produto button[type=submit]');
  assert.match(await page.textContent('#admin-status'), /Produto salvo/);
  await page.goto(base + 'catalogo.html');
  const cartao = page.locator('.product-card', { hasText: 'Vaso terracota com capim laranja' });
  assert.match(await cartao.textContent(), /150,50/);
  assert.match(await cartao.textContent(), /Indisponível/);
  await page.goto(base + 'produto.html?id=vaso-terracota-capim');
  assert.strictEqual(await page.locator('a', { hasText: 'Fazer pedido' }).count(), 0, 'indisponível não oferece pedido');
  await page.goto(base + 'pedido.html?produto=vaso-terracota-capim');
  await page.fill('#p-nome', 'Ana'); await page.fill('#p-ocasiao', 'x'); await page.fill('#p-cores', 'y');
  await page.click('button[type=submit]');
  assert.strictEqual(await page.locator('#resumo').isVisible(), false);
  await ctx.close();
});

test('administração: desativar remove do catálogo e reativar devolve (US06)', opts, async () => {
  const { ctx, page } = await abrir(VIEWPORTS.desktop, 'admin.html');
  const nome = 'Guirlanda de flores desidratadas';
  await page.click(`button[aria-label="Desativar: ${nome}"]`);
  assert.match(await page.textContent('#admin-status'), /Desativado/);
  await page.goto(base + 'catalogo.html');
  assert.strictEqual(await page.locator('.product-card', { hasText: nome }).count(), 0);
  await page.goto(base + 'admin.html');
  await page.click(`button[aria-label="Reativar: ${nome}"]`);
  await page.goto(base + 'catalogo.html');
  assert.strictEqual(await page.locator('.product-card', { hasText: nome }).count(), 1);
  await ctx.close();
});

test('administração: estados de carregamento, vazio, sucesso e erro (Trello: interface administrativa)', opts, async () => {
  const { ctx, page } = await abrir(VIEWPORTS.celular, 'admin.html');
  assert.strictEqual(await page.locator('#tabela tr').count(), 7);
  // erro de validação
  await page.click('#form-produto button[type=submit]');
  assert.strictEqual(await page.getAttribute('#admin-status', 'role'), 'alert');
  assert.match(await page.textContent('#admin-status'), /Corrija/);
  // erro de importação
  await page.setInputFiles('#importar', { name: 'ruim.json', mimeType: 'application/json', buffer: Buffer.from('{quebrado') });
  await page.waitForFunction(() => /inválido/.test(document.getElementById('admin-status').textContent));
  assert.ok(await page.locator('.admin-status.is-error').count());
  // estado vazio e sucesso
  await page.setInputFiles('#importar', { name: 'vazio.json', mimeType: 'application/json', buffer: Buffer.from('[]') });
  await page.waitForFunction(() => /Nenhum produto cadastrado/.test(document.getElementById('tabela').textContent));
  assert.ok(await page.locator('.admin-status.is-success').count());
  await page.goto(base + 'catalogo.html');
  assert.strictEqual(await page.locator('.product-card').count(), 0);
  assert.strictEqual(await page.locator('#catalogo-vazio').isVisible(), true);
  await ctx.close();
});
