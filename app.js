(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = window.gsap && window.ScrollTrigger;

  // Плавная прокрутка
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const el = id.length > 1 && document.querySelector(id);
      if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: id === '#top' ? 0 : -10 }); }
    }));
  }

  // Шапка со стеклом после первого экрана
  const hdr = document.getElementById('hdr');
  const onScroll = () => hdr.classList.toggle('is-glass', window.scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);

  // Первый экран: строки заголовка и текст
  if (!reduce) {
    gsap.from('.hero-title .ln', { yPercent: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .12, delay: .15 });
    gsap.from(['.hero .eyebrow', '.hero-lead', '.hero-actions'], { y: 18, opacity: 0, duration: 1, ease: 'power3.out', stagger: .1, delay: .45 });
    gsap.to('.hero-video', { scale: 1.06, yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-copy', { y: -60, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });
  }

  // Цифры: разгон до значения с сайта
  document.querySelectorAll('[data-count]').forEach(el => {
    const to = +el.dataset.count;
    const fmt = n => Math.round(n).toLocaleString('ru-RU');
    if (reduce) { el.textContent = fmt(to); return; }
    const o = { v: 0 }; el.textContent = '0';
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => gsap.to(o, { v: to, duration: to > 10 ? 2.2 : 1.2, ease: 'power3.out', onUpdate: () => el.textContent = fmt(o.v) })
    });
  });
  gsap.from('.facts-note', { y: 30, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.facts-note', start: 'top 88%' } });

  // Путь полимера: развилка по прокрутке (только на широком экране)
  const mm = gsap.matchMedia();
  mm.add('(min-width: 821px)', () => {
    const wa = document.querySelector('.wire-a'), wb = document.querySelector('.wire-b');
    [wa, wb].forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.dataset.l = L; });
    const steps = [...document.querySelectorAll('.step')];
    const nodes = sel => gsap.utils.toArray(sel);
    gsap.set(['.node-a1 .tag', '.node-a2 .tag', '.node-b1 .tag', '.node-b2 .tag'], { autoAlpha: 0 });
    gsap.set(nodes('.node-a1 .cut, .cluster .cut'), { y: 40, scale: .86, autoAlpha: 0 });
    gsap.set('.node-g', { '--x': '50%', scale: 1.4 });

    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' },
      scrollTrigger: { trigger: '.path', start: 'top top', end: 'bottom bottom', scrub: .8,
        onUpdate: self => {
          const p = self.progress;
          const i = p < .16 ? 0 : p < .38 ? 1 : p < .58 ? 2 : p < .8 ? 3 : 4;
          steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
          gsap.set('.path-progress span', { scaleX: p });
        } } });

    tl.to('.node-g', { '--x': '16%', scale: 1, duration: 1 })
      .to(wa, { strokeDashoffset: () => wa.dataset.l * .5, duration: 1 }, '+=.1')
      .to('.node-a1 .tag', { autoAlpha: 1, duration: .3 }, '<.4')
      .to('.node-a1 .cut', { y: 0, scale: 1, autoAlpha: 1, duration: .8, ease: 'power3.out' }, '<')
      .to(wa, { strokeDashoffset: 0, duration: 1 }, '+=.3')
      .to('.node-a2 .tag', { autoAlpha: 1, duration: .3 }, '<.5')
      .to('.node-a2 .cut', { y: 0, scale: 1, autoAlpha: 1, duration: .8, stagger: .12, ease: 'power3.out' }, '<')
      .to(wb, { strokeDashoffset: () => wb.dataset.l * .5, duration: 1 }, '+=.3')
      .to('.node-b1 .tag', { autoAlpha: 1, duration: .3 }, '<.4')
      .to('.node-b1 .cut', { y: 0, scale: 1, autoAlpha: 1, duration: .8, stagger: .12, ease: 'power3.out' }, '<')
      .to(wb, { strokeDashoffset: 0, duration: 1 }, '+=.3')
      .to('.node-b2 .tag', { autoAlpha: 1, duration: .3 }, '<.5')
      .to('.node-b2 .cut', { y: 0, scale: 1, autoAlpha: 1, duration: .8, stagger: .12, ease: 'power3.out' }, '<')
      .to({}, { duration: .6 });

    // лёгкое парение изделий после появления
    if (!reduce) gsap.utils.toArray('.stage .cut').forEach((c, k) =>
      gsap.to(c, { rotation: k % 2 ? 2.5 : -2.5, yPercent: k % 2 ? -4 : 4, duration: 3.2 + (k % 3) * .7, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    return () => [wa, wb].forEach(p => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; });
  });
})();
