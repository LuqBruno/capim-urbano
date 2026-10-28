document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('.site-nav');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Menu
  const setMenu = (open) => {
    if (!menuToggle || !siteNav) return;
    siteNav.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
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

  // Hero unveil (the one authored moment)
  const hero = document.querySelector('.hero');
  const heroImg = hero && hero.querySelector('.hero-frame img');
  const startHero = () => requestAnimationFrame(() => {
    root.classList.add('is-loaded');
    setTimeout(() => root.classList.add('hero-settled'), 2500);
  });
  if (heroImg && !heroImg.complete) {
    heroImg.addEventListener('load', startHero, { once: true });
    heroImg.addEventListener('error', startHero, { once: true });
    setTimeout(startHero, 1200);
  } else {
    startHero();
  }

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

  // Scroll: progress, header state, gentle hero drift
  const progress = document.querySelector('.scroll-progress');
  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    if (header) header.classList.toggle('is-scrolled', y > 12);
    if (heroImg && !reduceMotion && root.classList.contains('hero-settled')) {
      const s = 1 + Math.min(y, 700) / 700 * 0.06;
      heroImg.style.setProperty('--hero-scale', s.toFixed(4));
    }
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

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
});
