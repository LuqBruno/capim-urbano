/* Varal de fotos: arraste o cordão (ou use as setas) e as fotos deslizam, balançando nos prendedores.
   A foto do meio é a ativa. Com "menos movimento" no sistema, não há balanço nem autoplay. */
import { clamp, alturaCordao, passoMola, passoBalanco, maisProxima, proximaFoto, doisDigitos } from '../lib/varal-core.js';

function iniciarVaral(raiz) {
  const cartoes = [...raiz.querySelectorAll('.varal-cartao')];
  const n = cartoes.length;
  if (!n) return;
  const caminho = raiz.querySelector('.varal-cordao path');
  const legenda = raiz.querySelector('.varal-legenda');
  const titulo = raiz.querySelector('.varal-titulo');
  const sub = raiz.querySelector('.varal-sub');
  const contador = raiz.querySelector('.varal-contador b');
  const anuncio = raiz.querySelector('[data-anuncio]');
  const botaoPausa = raiz.querySelector('[data-pausa]');
  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const larguraMax = Number(raiz.dataset.largura) || 260;
  const cede = Number(raiz.dataset.cede) || 40;
  const intervalo = reduzir ? 0 : Number(raiz.dataset.autoplay) || 0;
  const ganho = reduzir ? 0 : 1;

  const S = { desloc: 0, vel: 0, alvo: 0, a: new Array(n).fill(0), av: new Array(n).fill(0) };
  let w = 0, h = 0, cw = larguraMax, espaco = cw * 1.08;
  let ativo = 0, arrasto = null, ultimoToque = 0, pausado = !intervalo;

  const medir = () => {
    const r = raiz.getBoundingClientRect();
    w = r.width; h = r.height;
    const fator = w < 600 ? 0.56 : 0.42; // no celular a foto ocupa mais da largura
    cw = Math.round(Math.max(140, Math.min(larguraMax, w * fator, h * 0.46)));
    espaco = cw * 1.08;
    raiz.style.setProperty('--varal-cw', cw + 'px');
    S.alvo = S.desloc = ativo * espaco;
  };
  const irPara = (i) => { S.alvo = clamp(i, 0, n - 1) * espaco; };

  const mostrarAtivo = () => {
    cartoes.forEach((c, i) => {
      c.dataset.on = i === ativo ? '1' : '0';
      if (i === ativo) c.removeAttribute('aria-hidden'); else c.setAttribute('aria-hidden', 'true');
    });
    const c = cartoes[ativo];
    titulo.textContent = c.dataset.titulo || '';
    sub.textContent = c.dataset.legenda || '';
    contador.textContent = doisDigitos(ativo + 1);
    anuncio.textContent = 'Foto ' + (ativo + 1) + ' de ' + n + (c.dataset.titulo ? ': ' + c.dataset.titulo : '');
    legenda.classList.remove('is-entrando'); void legenda.offsetWidth; legenda.classList.add('is-entrando');
  };

  // simulação escrita direto no DOM a cada quadro; para quando o varal sai da tela
  let visivel = true, raf = 0, antes = performance.now();
  const quadro = (agora) => {
    raf = 0;
    if (!visivel) return;
    const dt = Math.min(0.033, (agora - antes) / 1000);
    antes = agora;
    const y0 = Math.max(36, h * 0.16);
    let velCordao;
    if (arrasto && arrasto.moveu) velCordao = arrasto.v * 1000;
    else {
      const anterior = S.desloc;
      [S.desloc, S.vel] = passoMola(S.desloc, S.vel, S.alvo, dt);
      velCordao = -(S.desloc - anterior) / Math.max(dt, 1e-3);
    }
    const perto = maisProxima(S.desloc, espaco, n);
    for (let i = 0; i < n; i++) {
      const el = cartoes[i];
      const x = w / 2 + i * espaco - S.desloc;
      if (x < -cw * 1.5 || x > w + cw * 1.5) { el.style.visibility = 'hidden'; continue; }
      el.style.visibility = 'visible';
      let [a, av] = passoBalanco(S.a[i], S.av[i], velCordao, dt, ganho);
      if (ganho) a += Math.sin(agora / 1300 + i * 1.7) * 0.0009; // brisa
      S.a[i] = a; S.av[i] = av;
      const y = alturaCordao(x, w, y0, cede) - 6;
      el.style.transform = 'translate(' + (x - cw / 2).toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + a.toFixed(4) + 'rad)';
      el.style.zIndex = String(i === perto ? n + 1 : n - Math.abs(i - perto));
    }
    caminho.setAttribute('d', 'M0 ' + y0 + ' Q' + w / 2 + ' ' + (y0 + 2 * cede) + ' ' + w + ' ' + y0);
    if (perto !== ativo) { ativo = perto; mostrarAtivo(); }
    raf = requestAnimationFrame(quadro);
  };
  new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting;
    if (visivel && !raf) { antes = performance.now(); raf = requestAnimationFrame(quadro); }
  }).observe(raiz);
  new ResizeObserver(medir).observe(raiz);

  // autoplay: espera enquanto alguém interage, com o mouse em cima ou com o foco dentro do varal
  if (intervalo && n > 1) {
    setInterval(() => {
      if (pausado || document.hidden || arrasto || performance.now() - ultimoToque < intervalo) return;
      if (raiz.matches(':hover') || raiz.contains(document.activeElement)) return;
      irPara(proximaFoto(ativo, n));
    }, intervalo);
  }
  if (botaoPausa) {
    if (!intervalo) botaoPausa.hidden = true;
    botaoPausa.addEventListener('click', () => {
      pausado = !pausado;
      botaoPausa.setAttribute('aria-pressed', String(pausado));
      botaoPausa.setAttribute('aria-label', pausado ? 'Continuar a passagem automática' : 'Pausar a passagem automática');
    });
  }

  raiz.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.varal-barra')) return;
    ultimoToque = performance.now();
    arrasto = { x: e.clientX, desloc: S.desloc, lx: e.clientX, lt: e.timeStamp, v: 0, moveu: false };
  });
  raiz.addEventListener('pointermove', (e) => {
    const d = arrasto;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moveu && Math.abs(dx) > 5) { d.moveu = true; raiz.dataset.arrasto = '1'; raiz.setPointerCapture(e.pointerId); }
    if (!d.moveu) return;
    const dt = Math.max(1, e.timeStamp - d.lt);
    d.v = 0.7 * ((e.clientX - d.lx) / dt) + 0.3 * d.v;
    d.lx = e.clientX; d.lt = e.timeStamp;
    const max = (n - 1) * espaco;
    let desloc = d.desloc - dx;
    if (desloc < 0) desloc *= 0.35; // resistência nas pontas
    if (desloc > max) desloc = max + (desloc - max) * 0.35;
    S.desloc = desloc;
  });
  const soltar = (e) => {
    const d = arrasto;
    arrasto = null;
    ultimoToque = performance.now();
    if (!d) return;
    if (d.moveu) {
      raiz.dataset.arrasto = '0';
      S.vel = -d.v * 1000;
      irPara(maisProxima(S.desloc - d.v * 180, espaco, n));
      return;
    }
    const cartao = e.target.closest('[data-i]');
    if (cartao) irPara(Number(cartao.dataset.i));
  };
  raiz.addEventListener('pointerup', soltar);
  raiz.addEventListener('pointercancel', soltar);

  const passo = (dir) => { ultimoToque = performance.now(); irPara(ativo + dir); };
  raiz.querySelector('[data-anterior]').addEventListener('click', () => passo(-1));
  raiz.querySelector('[data-proxima]').addEventListener('click', () => passo(1));
  raiz.addEventListener('keydown', (e) => {
    if (e.target !== raiz) return;
    if (e.key === 'ArrowRight') passo(1);
    else if (e.key === 'ArrowLeft') passo(-1);
    else return;
    e.preventDefault();
  });

  medir();
  mostrarAtivo();
  raiz.classList.add('is-pronto');
  raf = requestAnimationFrame(quadro);
}

document.querySelectorAll('[data-varal]').forEach(iniciarVaral);
