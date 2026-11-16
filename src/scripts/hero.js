/*
  Hero da home: "atravessar o capim até o ateliê".

  - Um campo de capim-dos-pampas desenhado em canvas com perspectiva real (cada haste tem x e profundidade z,
    projetadas por uma câmera). O ponteiro gira a câmera e sopra as hastes; a rolagem leva a câmera para dentro
    do campo, e as hastes passam por quem olha.
  - A janela em arco com a foto do ateliê se abre até ocupar a tela inteira enquanto o palco fica preso (sticky).
    O CSS define a posição inicial da janela (.hero-alvo); o script só mede e interpola.
  - Sem JavaScript, ou com "menos movimento" no sistema, o hero fica estático: texto, foto em arco e um quadro
    parado do capim (este último só com JavaScript).
*/

const cena = document.querySelector('[data-hero]');

if (cena) {
  const palco = cena.querySelector('.hero-palco');
  const alvo = cena.querySelector('.hero-alvo');
  const janela = cena.querySelector('.hero-janela');
  const foto = cena.querySelector('.hero-foto img');
  const texto = cena.querySelector('.hero-texto');
  const canvas = cena.querySelector('.hero-capim');
  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ponteiroFino = window.matchMedia('(hover: hover) and (pointer: fine)');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;

  const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const mistura = (a, b, t) => a + (b - a) * t;
  const suave = (t) => t * t * (3 - 2 * t);
  const curva = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* Pseudoaleatório com semente: o campo é igual a cada visita e entre o quadro parado e o animado. */
  let semente = 7;
  const acaso = () => { semente = (semente * 16807) % 2147483647; return (semente - 1) / 2147483646; };

  // Cores da marca: talos em sálvia/oliva, plumas em palha e creme, poucos toques do vinho das flores da foto.
  const PLUMAS = ['221, 205, 172', '235, 224, 200', '206, 188, 150', '196, 180, 146'];
  const TALOS = ['143, 138, 118', '110, 106, 90', '165, 158, 135'];
  const VINHO = '122, 41, 55';

  let hastes = [];
  let W = 0, H = 0, dpr = 1, celular = false;
  let geometria = null; // insets da janela no estado inicial

  function semearCampo() {
    semente = 7;
    const total = celular ? 80 : 190;
    hastes = Array.from({ length: total }, () => {
      const z = mistura(0.75, 2.4, Math.pow(acaso(), 0.85));
      return {
        x: (acaso() * 2 - 1) * 1.25,
        z,
        altura: mistura(0.42, 0.78, acaso()),
        fase: acaso() * Math.PI * 2,
        pluma: PLUMAS[Math.floor(acaso() * PLUMAS.length)],
        talo: TALOS[Math.floor(acaso() * TALOS.length)],
        vinho: acaso() < 0.07,
        inclina: (acaso() - 0.5) * 0.35,
        fios: 7 + Math.floor(acaso() * 5)
      };
    }).sort((a, b) => b.z - a.z); // do fundo para a frente
  }

  function medir() {
    celular = window.innerWidth < 821;
    const r = palco.getBoundingClientRect();
    W = r.width; H = r.height;
    if (canvas && ctx) {
      dpr = Math.min(window.devicePixelRatio || 1, celular ? 1.5 : 1.75);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    semearCampo();
    if (cena.classList.contains('is-cinema')) {
      // A janela está ocupando o palco: a posição inicial vem do espaço reservado (.hero-alvo) no layout.
      const a = alvo.getBoundingClientRect();
      geometria = { t: a.top - r.top, l: a.left - r.left, d: r.right - a.right, b: r.bottom - a.bottom, w: a.width, h: a.height };
    }
  }

  /* ---------- capim ---------- */
  function desenharCapim(tempo, avanco, vento, camX) {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    // Ao atravessar o campo, ele se dissolve: a foto aberta fica limpa.
    const geral = 1 - suave(limitar((avanco - 0.18) / 0.3));
    if (geral <= 0.01) return;
    const foco = Math.min(W, H * 1.35) * 0.62;
    const chao = H + 6;
    const cx = W / 2;
    const viagem = avanco * 1.6; // quanto a câmera anda para dentro do campo
    const teto = H * (celular ? 0.3 : 0.36);
    for (const h of hastes) {
      const z = h.z - viagem;
      if (z < 0.12) continue;
      const escala = foco / z;
      const bx = cx + (h.x - camX) * escala;
      if (bx < -160 || bx > W + 160) continue;
      const alt = Math.min(h.altura * escala * (celular ? 0.46 : 0.42), teto * (1 + avanco * 1.6));
      // Perto demais: some aos poucos em vez de cobrir a tela.
      const perto = limitar((z - 0.12) / 0.45);
      const longe = limitar(1.35 - z * 0.38, 0.3, 1);
      const alfa = perto * longe * geral;
      if (alfa < 0.02) continue;

      const balanco = Math.sin(tempo * 0.0011 + h.fase + h.x * 2.4) * 0.07 + Math.sin(tempo * 0.0023 + h.fase * 1.7) * 0.025;
      // vento do ponteiro: empurra mais as hastes próximas ao cursor
      const distancia = Math.abs(bx - vento.x) / Math.max(W, 1);
      const sopro = vento.forca * Math.exp(-distancia * distancia * 18) * (bx < vento.x ? -1 : 1) * 0.22;
      const curvatura = h.inclina + balanco + sopro;
      const tx = bx + curvatura * alt;
      const ty = chao - alt * (1 - Math.abs(curvatura) * 0.12);
      const mx = bx + curvatura * alt * 0.25;
      const my = chao - alt * 0.55;

      const espessura = Math.max(0.6, escala * 0.0016);
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(${h.talo}, ${0.75 * alfa})`;
      ctx.lineWidth = espessura;
      ctx.beginPath();
      ctx.moveTo(bx, chao);
      ctx.quadraticCurveTo(mx, my, tx, ty);
      ctx.stroke();

      // pluma de capim-dos-pampas: um corpo felpudo (elipse translúcida) com fios finos quase paralelos ao talo
      const cor = h.vinho ? VINHO : h.pluma;
      const comprimento = alt * 0.32;
      const dx = (tx - mx), dy = (ty - my);
      const norma = Math.hypot(dx, dy) || 1;
      const ux = dx / norma, uy = dy / norma;
      const angulo = Math.atan2(uy, ux);
      const meioX = tx - ux * comprimento * 0.45, meioY = ty - uy * comprimento * 0.45;
      const largura = comprimento * (h.vinho ? 0.1 : 0.15);
      ctx.fillStyle = `rgba(${cor}, ${(h.vinho ? 0.32 : 0.4) * alfa})`;
      ctx.beginPath();
      ctx.ellipse(meioX, meioY, comprimento * 0.52, largura, angulo, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = Math.max(0.45, espessura * 0.6);
      ctx.strokeStyle = `rgba(${cor}, ${(h.vinho ? 0.5 : 0.6) * alfa})`;
      ctx.beginPath();
      for (let i = 0; i < h.fios; i++) {
        const t = (i + 0.5) / h.fios;
        const px = tx - ux * comprimento * t * 0.9;
        const py = ty - uy * comprimento * t * 0.9;
        const lado = i % 2 ? 1 : -1;
        const fio = comprimento * (0.28 + 0.22 * Math.sin(Math.PI * t));
        const abre = 0.32 + Math.sin(tempo * 0.0025 + h.fase + i) * 0.06; // fios quase paralelos, balançando
        ctx.moveTo(px, py);
        ctx.lineTo(px + (ux * 0.95 - uy * lado * abre) * fio, py + (uy * 0.95 + ux * lado * abre) * fio);
      }
      ctx.stroke();
    }
  }

  /* ---------- modo estático (sem movimento) ---------- */
  function quadroParado() {
    cena.classList.remove('is-cinema');
    janela.style.clipPath = '';
    foto.style.transform = '';
    texto.style.opacity = texto.style.transform = '';
    medir();
    desenharCapim(0, 0, { x: -9999, forca: 0 }, 0);
  }

  /* ---------- modo cinema ---------- */
  let ativo = false, visivel = true, quadro = 0;
  const ponteiro = { x: 0, y: 0, alvoX: 0, alvoY: 0, velocidade: 0, ultimoX: 0 };
  const vento = { x: -9999, forca: 0 };
  let progressoSuave = 0;

  /* Entrada "o ateliê desperta": só quando o <head> ligou .desperta. O relógio é o da página (performance.now()
     conta desde a navegação, como as animações CSS), então foto, texto e capim andam juntos; se o script chegar
     tarde, a entrada já terminou e a foto aparece no lugar. Devolve quanto falta (1 → 0). */
  const comEntrada = document.documentElement.classList.contains('desperta');
  const ENTRADA_INICIO = 160, ENTRADA_DURACAO = 1150;
  const faltaEntrada = () => {
    if (!comEntrada) return 0;
    const t = limitar((performance.now() - ENTRADA_INICIO) / ENTRADA_DURACAO);
    return Math.pow(1 - t, 3);
  };

  function progresso() {
    const r = cena.getBoundingClientRect();
    const curso = r.height - palco.offsetHeight;
    return curso > 0 ? limitar(-r.top / curso) : 0;
  }

  function aplicar(p, tempo) {
    if (!geometria) return;
    const g = geometria;
    const abre = curva(limitar(p / 0.62));              // janela abrindo
    const some = suave(limitar(p / 0.32));              // texto saindo
    const legenda = suave(limitar((p - 0.66) / 0.16));  // ficha "Natureza preservada"

    // Na entrada a janela começa um pouco mais fechada e a foto um pouco maior; a rolagem assume conforme abre.
    const en = faltaEntrada() * (1 - abre);
    const t = mistura(g.t, 0, abre) + g.h * 0.12 * en, l = mistura(g.l, 0, abre) + g.w * 0.07 * en, d = mistura(g.d, 0, abre) + g.w * 0.07 * en, b = mistura(g.b, 0, abre);
    const raio = mistura(g.w / 2, 0, abre);
    const base = mistura(10, 0, abre);
    janela.style.clipPath = `inset(${t.toFixed(1)}px ${d.toFixed(1)}px ${b.toFixed(1)}px ${l.toFixed(1)}px round ${raio.toFixed(1)}px ${raio.toFixed(1)}px ${base.toFixed(1)}px ${base.toFixed(1)}px)`;

    // A foto começa enquadrada dentro do arco (como uma janela pequena) e vira o palco inteiro.
    const k0 = Math.max(g.w / W, g.h / H) * 1.06;
    const k = mistura(k0, 1.0, abre) * mistura(1, 1.04, limitar((p - 0.62) / 0.38)) * (1 + (celular ? 0.04 : 0.07) * en);
    const cxJanela = (g.l + (W - g.d)) / 2 - W / 2;
    const cyJanela = (g.t + (H - g.b)) / 2 - H / 2;
    const px = ponteiro.x * mistura(10, 16, abre);
    const py = ponteiro.y * mistura(6, 10, abre);
    foto.style.transform = `translate3d(${(mistura(cxJanela, 0, abre) - px).toFixed(2)}px, ${(mistura(cyJanela, 0, abre) - py).toFixed(2)}px, 0) scale(${k.toFixed(4)})`;

    texto.style.opacity = (1 - some).toFixed(3);
    texto.style.transform = celular
      ? `translate3d(0, ${(-some * 36).toFixed(1)}px, 0)`
      : `translate3d(${(-some * 56 + ponteiro.x * 4).toFixed(1)}px, ${(ponteiro.y * 3).toFixed(1)}px, 0) scale(${(1 - some * 0.04).toFixed(3)})`;
    texto.style.visibility = some > 0.99 ? 'hidden' : '';
    cena.style.setProperty('--legenda', legenda.toFixed(3));
    cena.style.setProperty('--rolar', (1 - limitar(p / 0.06)).toFixed(3));

    desenharCapim(tempo, p, vento, ponteiro.x * 0.16);
  }

  function laco(tempo) {
    quadro = 0;
    if (!ativo) return;
    ponteiro.x += (ponteiro.alvoX - ponteiro.x) * 0.07;
    ponteiro.y += (ponteiro.alvoY - ponteiro.y) * 0.07;
    vento.forca *= 0.95;
    const p = progresso();
    progressoSuave += (p - progressoSuave) * 0.18;
    if (Math.abs(p - progressoSuave) < 0.0005) progressoSuave = p;
    aplicar(progressoSuave, tempo);
    if (visivel && !document.hidden) quadro = requestAnimationFrame(laco);
  }
  const acordar = () => { if (ativo && !quadro && visivel && !document.hidden) quadro = requestAnimationFrame(laco); };

  function aoMoverPonteiro(e) {
    if (!ponteiroFino.matches) return;
    const r = palco.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    ponteiro.alvoX = limitar(nx, -1, 1);
    ponteiro.alvoY = limitar(ny, -1, 1);
    const v = Math.abs(e.clientX - ponteiro.ultimoX);
    ponteiro.ultimoX = e.clientX;
    vento.x = e.clientX - r.left;
    vento.forca = Math.min(1, vento.forca + v * 0.012);
    acordar();
  }

  function iniciarCinema() {
    cena.classList.add('is-cinema');
    medir();
    ativo = true;
    progressoSuave = progresso();
    aplicar(progressoSuave, performance.now());
    acordar();
  }

  function parar() {
    ativo = false;
    if (quadro) cancelAnimationFrame(quadro);
    quadro = 0;
  }

  function escolherModo() {
    parar();
    if (reduzir.matches || !ctx) quadroParado();
    else iniciarCinema();
  }

  // Entrada: as linhas do texto sobem uma a uma quando a página carrega.
  const entrar = () => requestAnimationFrame(() => cena.classList.add('is-entrou'));
  if (foto.complete) entrar();
  else { foto.addEventListener('load', entrar, { once: true }); foto.addEventListener('error', entrar, { once: true }); setTimeout(entrar, 1200); }

  escolherModo();
  reduzir.addEventListener('change', escolherModo);

  let espera = 0;
  window.addEventListener('resize', () => {
    clearTimeout(espera);
    espera = setTimeout(() => { if (ativo) { medir(); aplicar(progressoSuave, performance.now()); acordar(); } else quadroParado(); }, 120);
  });
  window.addEventListener('scroll', acordar, { passive: true });
  palco.addEventListener('pointermove', aoMoverPonteiro, { passive: true });
  palco.addEventListener('pointerleave', () => { ponteiro.alvoX = 0; ponteiro.alvoY = 0; acordar(); });
  document.addEventListener('visibilitychange', acordar);

  // Só anima enquanto o hero está na tela.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visivel = e.isIntersecting; acordar(); }).observe(cena);
  }

  // Teclado: se o foco cair no texto enquanto ele está escondido pela rolagem, volta ao começo do hero.
  texto.addEventListener('focusin', () => {
    if (ativo && progresso() > 0.2) window.scrollTo({ top: window.scrollY + cena.getBoundingClientRect().top, behavior: 'auto' });
  });
}
