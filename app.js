(() => {
  const ZP = window.ZP, reduce = ZP.reduce, lite = ZP.lite;
  const hasGsap = window.gsap && window.ScrollTrigger;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- КАТАЛОГ (п.1) ---------- */
  const C = window.CATALOG || [];
  const tabs = document.getElementById('tabs'), chips = document.getElementById('chips'), grid = document.getElementById('grid');
  let curG = C[0] && C[0].id, curS = 'all';
  const keySpecs = it => {
    const want = ['Объём', 'Размеры, мм', 'Ширина', 'Диаметр, мм', 'Материал'];
    const out = [];
    for (const k of want) { const kv = it.specs.find(s => s[0] === k); if (kv && out.length < 2 && kv[1].toLowerCase() !== 'по желанию заказчика') out.push(kv); }
    return out;
  };
  function renderTabs() {
    tabs.innerHTML = C.map(g => {
      const n = g.subs.reduce((a, s) => a + s.items.length, 0);
      return `<button role="tab" type="button" data-g="${g.id}" aria-selected="${g.id === curG}"><span>${ZP.esc(ZP.t(g.ru, g.en))}</span><i>${n}</i></button>`;
    }).join('');
    const g = C.find(x => x.id === curG);
    const subs = g.subs.filter(s => s.items.length);
    chips.innerHTML = subs.length > 1 ? [`<button type="button" data-s="all" aria-pressed="${curS === 'all'}">${ZP.t('Все', 'All')}</button>`]
      .concat(subs.map(s => `<button type="button" data-s="${s.id}" aria-pressed="${curS === s.id}">${ZP.esc(ZP.t(s.ru, s.en))}</button>`)).join('') : '';
  }
  function renderGrid() {
    const g = C.find(x => x.id === curG);
    const items = g.subs.filter(s => curS === 'all' || s.id === curS).flatMap(s => s.items);
    grid.innerHTML = items.map(it => {
      const sp = keySpecs(it).map(([k, v]) => `<span><em>${ZP.esc(ZP.tr(k))}</em>${ZP.esc(ZP.tr(v))}</span>`).join('');
      const img = it.imgs[0] ? `<img src="${it.imgs[0]}" alt="${ZP.esc(it.title)}" loading="lazy">` : '';
      return `<a class="card" href="product.html?p=${encodeURIComponent(it.slug)}"><div class="card-img">${img}</div><div class="card-body"><h3>${ZP.esc(ZP.tr(it.title))}</h3><div class="card-specs">${sp}</div></div></a>`;
    }).join('');
    grid.querySelectorAll('img').forEach(im => im.addEventListener('load', () => hasGsap && ScrollTrigger.refresh(), { once: true }));
    if (hasGsap && !reduce) gsap.from(grid.querySelectorAll('.card-img img, .card-body'), { y: 24, opacity: 0, duration: .7, ease: 'power3.out', stagger: .02, clearProps: 'all' });
    hasGsap && requestAnimationFrame(() => ScrollTrigger.refresh());
  }
  function openGroup(id, sub = 'all') { curG = id; curS = sub; renderTabs(); renderGrid(); }
  if (tabs) {
    tabs.addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) openGroup(b.dataset.g); });
    chips.addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b) { curS = b.dataset.s; renderTabs(); renderGrid(); } });
    document.querySelectorAll('[data-open-group]').forEach(a => a.addEventListener('click', () => openGroup(a.dataset.openGroup)));
    const fromHash = new URLSearchParams(location.search).get('group'); if (fromHash && C.some(g => g.id === fromHash)) curG = fromHash;
    renderTabs(); renderGrid();
    document.addEventListener('zp:lang', () => { renderTabs(); renderGrid(); });
  }

  /* ---------- ЗАЯВКА (п.7) ---------- */
  const form = document.getElementById('form'), out = document.getElementById('form-out');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.querySelector('#f-name'), phone = form.querySelector('#f-phone');
    [name, phone].forEach(i => i.classList.toggle('bad', !i.value.trim()));
    if (!name.value.trim() || !phone.value.trim()) { (name.value.trim() ? phone : name).focus(); return; }
    out.hidden = false;
  });

  if (!hasGsap) return;

  /* ---------- ПЕРВЫЙ ЭКРАН ---------- */
  if (!reduce) {
    gsap.from('.hero-title .ln', { yPercent: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .12, delay: .15 });
    gsap.from(['.hero .eyebrow', '.hero-lead', '.hero-actions'], { y: 18, opacity: 0, duration: 1, ease: 'power3.out', stagger: .1, delay: .45 });
    gsap.to('.hero-video', { scale: 1.05, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- ЦИФРЫ (п.12) ---------- */
  document.querySelectorAll('[data-count]').forEach(el => {
    const to = +el.dataset.count, fmt = n => Math.round(n).toLocaleString('ru-RU');
    if (reduce) { el.textContent = fmt(to); return; }
    const o = { v: 0 }; el.textContent = '0';
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true,
      onEnter: () => gsap.to(o, { v: to, duration: to > 10 ? 2.2 : 1.2, ease: 'power3.out', onUpdate: () => el.textContent = fmt(o.v) }) });
  });
  if (!reduce) {
    gsap.fromTo('.facts-bg', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.facts', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.fact', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: '.facts-row', start: 'top 85%' } });
  }

  /* ---------- reveal для обычных блоков (анимируем детей, не родителей картинок с multiply) ---------- */
  if (!reduce) gsap.utils.toArray('.sec-head, .q-grid article, .cases figure figcaption, .eggs-copy, .jobs-copy, .jobs-list li, .ct-col, .ct-list > div').forEach(el =>
    gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
  if (!reduce) {
    gsap.utils.toArray('.eggs .cut').forEach((c, k) => {
      gsap.from(c, { y: 80 + k * 30, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.eggs', start: 'top 75%' } });
      gsap.to(c, { yPercent: (k % 2 ? -1 : 1) * 10, ease: 'none', scrollTrigger: { trigger: '.eggs', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // анимируем ячейку, а не сам логотип: у логотипа своя прозрачность в CSS, from() её затирал
    gsap.fromTo('.logos li', { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .8, ease: 'power3.out', stagger: .05, clearProps: 'transform,opacity,visibility', scrollTrigger: { trigger: '.logos', start: 'top 85%' } });
    gsap.from('.cases figure img', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: .12, scrollTrigger: { trigger: '.cases-row', start: 'top 85%' } });
  }

  /* ---------- ПУТЬ ПОЛИМЕРА (п.11) ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 821px)', () => {
    const wa = document.querySelector('.wire-a'), wb = document.querySelector('.wire-b');
    [wa, wb].forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.dataset.l = L; });
    const steps = [...document.querySelectorAll('.step')];
    gsap.set('.stage .node:not(.node-g) .tag', { autoAlpha: 0, y: 10 });
    gsap.set('.stage .node:not(.node-g) .cut', { y: 50, scale: .82, autoAlpha: 0 });
    gsap.set('.node-g', { '--x': '50%', scale: 1.35 });
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' },
      scrollTrigger: { trigger: '.path', start: 'top top', end: 'bottom bottom', scrub: .8,
        onUpdate: self => {
          const p = self.progress, i = p < .16 ? 0 : p < .38 ? 1 : p < .58 ? 2 : p < .8 ? 3 : 4;
          steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
          gsap.set('.path-progress span', { scaleX: p });
        } } });
    const show = (sel, at) => tl.to(sel + ' .cut', { y: 0, scale: 1, autoAlpha: 1, duration: .9, stagger: .12, ease: 'power3.out' }, at)
                                .to(sel + ' .tag', { autoAlpha: 1, y: 0, duration: .5 }, '<.3');
    tl.to('.node-g', { '--x': '15%', scale: 1, duration: 1 });
    tl.to(wa, { strokeDashoffset: () => wa.dataset.l * .52, duration: 1 }, '+=.1'); show('.node-a1', '<.5');
    tl.to(wa, { strokeDashoffset: 0, duration: 1 }, '+=.3'); show('.node-a2', '<.5');
    tl.to(wb, { strokeDashoffset: () => wb.dataset.l * .52, duration: 1 }, '+=.3'); show('.node-b1', '<.5');
    tl.to(wb, { strokeDashoffset: 0, duration: 1 }, '+=.3'); show('.node-b2', '<.5');
    tl.to({}, { duration: .6 });
    if (!reduce && !lite) gsap.utils.toArray('.stage .cut').forEach((c, k) =>
      gsap.to(c, { rotation: k % 2 ? 2.5 : -2.5, yPercent: k % 2 ? -5 : 5, duration: 3.2 + (k % 3) * .7, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    return () => [wa, wb].forEach(p => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; });
  });

  /* ---------- IML: шаги текста; 3D читает тот же прогресс ---------- */
  const imlItems = [...document.querySelectorAll('.iml-list li')];
  ScrollTrigger.create({ trigger: '.iml', start: 'top top', end: 'bottom bottom',
    onUpdate: self => {
      const p = self.progress; window.ZP.imlProgress = p;
      const i = Math.min(imlItems.length - 1, Math.floor(p * imlItems.length * .999));
      imlItems.forEach((li, k) => li.classList.toggle('is-on', k === i));
    } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
