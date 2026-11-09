import { interfaceDe } from '../i18n/interface.js';

document.documentElement.classList.add('js');
const T = interfaceDe(document.documentElement.lang).tela;

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('.site-nav');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Menu
  const setMenu = (open) => {
    if (!menuToggle || !siteNav) return;
    siteNav.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? T.fecharMenu : T.abrirMenu);
  };
  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => setMenu(!siteNav.classList.contains('is-open')));
    siteNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && siteNav.classList.contains('is-open')) {
        setMenu(false);
        menuToggle.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (siteNav.classList.contains('is-open') && !header.contains(event.target)) setMenu(false);
    });
  }

  // O hero da home tem script próprio (src/scripts/hero.js).

  // Reveal on scroll
  const revealEls = document.querySelectorAll('.reveal, .reveal-img');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('in-view');
        if (el.classList.contains('reveal-img')) setTimeout(() => el.classList.add('done'), 1700);
        io.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view', 'done'));
  }

  // Scroll: progress and header state
  const progress = document.querySelector('.scroll-progress');
  const carimbo = document.querySelector('.carimbo');
  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    if (carimbo && !reduceMotion) carimbo.style.setProperty('--giro', (y * 0.06).toFixed(2) + 'deg');
    if (header) header.classList.toggle('is-scrolled', y > 12);
    ticking = false;
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  document.querySelectorAll('[data-lingua]').forEach((link) => link.addEventListener('click', () => {
    link.href = link.getAttribute('href').split(/[?#]/)[0] + location.search;
  }));

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
});
