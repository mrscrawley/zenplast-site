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

  /* ---------- ИСТОРИЯ: прогресс, главы, навигация ---------- */
  const storyEl = document.querySelector('.story');
  if (storyEl) {
    const chs = [...storyEl.querySelectorAll('.ch')], navs = [...storyEl.querySelectorAll('.story-nav button')];
    const fbs = [...storyEl.querySelectorAll('.story-fallback img')];
    const bounds = [0, .09, .22, .34, .5, .655, .81, .93, 1.01];
    let cur = -1;
    const counter = storyEl.querySelector('[data-count]'); const cnt = { v: 0 }; let counted = false;
    function setCh(i) {
      if (i === cur) return;
      const prev = chs[cur]; cur = i;
      if (prev) gsap.to(prev, { autoAlpha: 0, y: -24, duration: .45, ease: 'power2.in', overwrite: true });
      chs[i].classList.add('is-on');
      gsap.fromTo(chs[i], { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: .8, delay: prev ? .25 : 0, ease: 'power3.out', overwrite: true });
      if (!reduce) gsap.fromTo(chs[i].children, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: .9, stagger: .07, delay: prev ? .3 : .1, ease: 'power3.out', clearProps: 'transform,opacity' });
      navs.forEach((b, k) => b.classList.toggle('is-on', k === i));
      fbs.forEach(im => im.classList.toggle('is-on', +im.dataset.ch === i));
      if (i === 1 && counter && !counted) { counted = true; cnt.v = 0; gsap.to(cnt, { v: 700, duration: reduce ? 0 : 2, ease: 'power3.out', onUpdate: () => counter.textContent = Math.round(cnt.v) }); }
    }
    gsap.set(chs, { autoAlpha: 0 }); setCh(0);
    const st = ScrollTrigger.create({ trigger: storyEl, start: 'top top', end: 'bottom bottom',
      onUpdate: self => { const p = self.progress; ZP.storyP = p; let i = 0; while (i < chs.length - 1 && p >= bounds[i + 1]) i++; setCh(i); } });
    ZP.storyP = 0;
    navs.forEach((b, k) => b.addEventListener('click', () => {
      const y = st.start + (st.end - st.start) * (k === 0 ? 0 : (bounds[k] + .03));
      ZP.lenis ? ZP.lenis.scrollTo(y) : scrollTo({ top: y, behavior: 'smooth' });
    }));
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
  }


  /* ---------- ЗАХОД 3: нижние главы ---------- */
  if (!reduce) {
    // тара клиентов: выплывают с поворотом, по прокрутке слегка вращаются, за курсором наклоняются
    gsap.utils.toArray('.cases figure img').forEach((im, k) => {
      gsap.fromTo(im, { rotateY: (k - 1) * -28, rotateX: 10, z: -260, y: 80 }, { rotateY: (k - 1) * 6, rotateX: 0, z: 0, y: 0, ease: 'none',
        scrollTrigger: { trigger: '.cases-row', start: 'top bottom', end: 'center 45%', scrub: .8 } });
      const fig = im.closest('figure');
      fig.addEventListener('pointermove', e => { const r = fig.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        gsap.to(im, { rotateY: x * 18, rotateX: -y * 14, scale: 1.04, duration: .6, ease: 'power3.out' }); });
      fig.addEventListener('pointerleave', () => gsap.to(im, { rotateY: (k - 1) * 6, rotateX: 0, scale: 1, duration: .8, ease: 'power3.out' }));
    });
    // яйца: упаковки разъезжаются и вращаются по прокрутке
    gsap.utils.toArray('.eggs .cut').forEach((c, k) => gsap.fromTo(c, { rotate: [-14, 10, -6][k], x: [-60, 80, 40][k] }, { rotate: [4, -6, 8][k], x: 0, ease: 'none',
      scrollTrigger: { trigger: '.eggs', start: 'top bottom', end: 'bottom top', scrub: 1 } }));
    // качество: гранула под лупой
    gsap.fromTo('.q-lens-img', { scale: .55, rotate: -20 }, { scale: 1.25, rotate: 10, ease: 'none', scrollTrigger: { trigger: '.q-lens', start: 'top bottom', end: 'bottom 30%', scrub: 1 } });
    gsap.utils.toArray('.q-tag').forEach((t, k) => gsap.fromTo(t, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.q-lens', start: `top+=${120 + k * 90} 70%`, toggleActions: 'play none none reverse' } }));
    // карта: разворачивается из наклона
    gsap.fromTo('#geo-map', { rotateX: 42, y: 60, scale: .9 }, { rotateX: 0, y: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.geo', start: 'top bottom', end: 'top 25%', scrub: 1 } });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
