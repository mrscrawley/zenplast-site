(() => {
  const ZP = window.ZP, reduce = ZP.reduce, lite = ZP.lite;
  const hasGsap = window.gsap && window.ScrollTrigger;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- КАТАЛОГ: меню категорий, поиск, витрина ---------- */
  const C = window.CATALOG || [];
  const tabs = document.getElementById('tabs'), chips = document.getElementById('chips'), grid = document.getElementById('grid');
  const meta = document.getElementById('range-meta'), q = document.getElementById('cat-q');
  const DESC = {
    iml: ['Контейнеры, крышки и стаканы с этикеткой, вплавленной в стенку при литье.', 'Containers, lids and cups with the label fused into the wall during moulding.'],
    thermo: ['Лотки, стаканы и укупорочные крышки из собственной плёнки.', 'Trays, cups and closure lids made from our own film.'],
    small: ['Упаковка для яиц, лотки под запайку и прозрачные ПЭТ-контейнеры.', 'Egg packs, sealable trays and clear PET containers.'],
    crates: ['Ящики для молочной продукции, хлеба и овощей.', 'Crates for dairy, bread and vegetables.'],
    film: ['Плёнка PP, PET и PS для термоформования.', 'PP, PET and PS film for thermoforming.']
  };
  let curG = C[0] && C[0].id, curS = 'all', query = '';
  const count = g => g.subs.reduce((a, s) => a + s.items.length, 0);
  const pad = n => String(n).padStart(2, '0');
  const keySpecs = it => {
    const want = ['Объём', 'Размеры, мм', 'Ширина', 'Диаметр, мм', 'Материал'];
    const out = [];
    for (const k of want) { const kv = it.specs.find(s => s[0] === k); if (kv && out.length < 2 && kv[1].toLowerCase() !== 'по желанию заказчика') out.push(kv); }
    return out;
  };
  const norm = s => String(s).toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');
  function renderTabs() {
    tabs.innerHTML = C.map((g, k) => `<button role="tab" type="button" data-g="${g.id}" aria-selected="${!query && g.id === curG}"><span class="t">${ZP.esc(ZP.t(g.ru, g.en))}</span><i>${count(g)}</i></button>`).join('');
    const g = C.find(x => x.id === curG);
    const subs = g.subs.filter(s => s.items.length);
    chips.innerHTML = !query && subs.length > 1 ? [`<button type="button" data-s="all" aria-pressed="${curS === 'all'}">${ZP.t('Все', 'All')}</button>`]
      .concat(subs.map(s => `<button type="button" data-s="${s.id}" aria-pressed="${curS === s.id}">${ZP.esc(ZP.t(s.ru, s.en))}</button>`)).join('') : '';
  }
  function items() {
    if (query) {
      const w = norm(query).split(' ').filter(Boolean);
      return C.flatMap(g => g.subs.flatMap(s => s.items.map(it => ({ it, hay: norm([it.title, ZP.tr(it.title), g.ru, s.ru, s.en, ...it.specs.map(x => x[1])].join(' ')) }))))
        .filter(x => w.every(t => x.hay.includes(t))).map(x => x.it);
    }
    const g = C.find(x => x.id === curG);
    return g.subs.filter(s => curS === 'all' || s.id === curS).flatMap(s => s.items);
  }
  function renderGrid(animate = true) {
    const list = items();
    const g = C.find(x => x.id === curG);
    meta.innerHTML = query
      ? `<div><h3>${ZP.t('Поиск', 'Search')}: «${ZP.esc(query)}»</h3></div><b>${list.length} ${ZP.t('поз.', 'items')}</b>`
      : `<div><h3>${ZP.esc(ZP.t(g.ru, g.en))}</h3><p>${ZP.esc(ZP.t(...(DESC[g.id] || ['', ''])))}</p></div><b>${list.length} ${ZP.t('поз.', 'items')}</b>`;
    grid.innerHTML = list.length ? list.map((it, k) => {
      const sp = keySpecs(it).map(([key, v]) => `<span><em>${ZP.esc(ZP.tr(key))}</em>${ZP.esc(ZP.tr(v))}</span>`).join('');
      const alt = it.imgs[1] ? `<img class="alt" src="${it.imgs[1]}" alt="" loading="lazy" decoding="async">` : '';
      const img = it.imgs[0] ? `<img class="${alt ? 'has-alt' : ''}" src="${it.imgs[0]}" alt="${ZP.esc(it.title)}" loading="lazy" decoding="async">` : '';
      return `<a class="card" href="product.html?p=${encodeURIComponent(it.slug)}"><div class="card-img">${img}${alt}<span class="card-go"><svg viewBox="0 0 16 16"><path d="M4 12L12 4M5.5 4H12v6.5"/></svg></span></div><div class="card-body"><h3>${ZP.esc(ZP.tr(it.title))}</h3><div class="card-specs">${sp}</div></div></a>`;
    }).join('') : `<p class="range-empty">${ZP.t('Ничего не нашли. Попробуйте другое слово или напишите нам — подберём.', 'Nothing found. Try another word or write to us.')}</p>`;
    if (hasGsap && !reduce && animate) {
      gsap.fromTo(grid.querySelectorAll('.card'), { y: 40, opacity: 0, clipPath: 'inset(12% 0 0 0 round 26px)' }, { y: 0, opacity: 1, clipPath: 'inset(0% 0 0 0 round 26px)', duration: .8, ease: 'power3.out', stagger: .035, clearProps: 'all' });
      gsap.fromTo(meta.children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'power3.out', stagger: .06, clearProps: 'all' });
    }
    hasGsap && requestAnimationFrame(() => ScrollTrigger.refresh());
  }
  const toTop = () => { const r = document.getElementById('range'); if (r && r.getBoundingClientRect().top < -40) { const y = r.getBoundingClientRect().top + scrollY - 20; ZP.lenis ? ZP.lenis.scrollTo(y) : scrollTo({ top: y, behavior: 'smooth' }); } };
  function openGroup(id, sub = 'all') { curG = id; curS = sub; query = ''; if (q) q.value = ''; renderTabs(); renderGrid(); }
  if (tabs) {
    tabs.addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) { openGroup(b.dataset.g); toTop(); } });
    chips.addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b) { curS = b.dataset.s; renderTabs(); renderGrid(); } });
    document.querySelectorAll('[data-open-group]').forEach(a => a.addEventListener('click', () => openGroup(a.dataset.openGroup)));
    let qt; if (q) q.addEventListener('input', () => { clearTimeout(qt); qt = setTimeout(() => { query = q.value.trim(); renderTabs(); renderGrid(); }, 180); });
    const fromHash = new URLSearchParams(location.search).get('group'); if (fromHash && C.some(g => g.id === fromHash)) curG = fromHash;
    renderTabs(); renderGrid(false);
    document.addEventListener('zp:lang', () => { if (q) q.placeholder = ZP.t('Поиск: стакан, 500 мл, PET…', 'Search: cup, 500 ml, PET…'); renderTabs(); renderGrid(false); });
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
    // главы привязаны к ключевым кадрам фильма (film.js): гранулы, сырьё, поток, плёнка, формование, IML, ящики, вся линия
    const bounds = [0, .08, .17, .29, .43, .69, .83, .95, 1.01];
    const navAt = [0, .12, .22, .36, .5, .76, .9, 1];
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
      ZP.filmGo && ZP.filmGo(i);
      fbs.forEach(im => im.classList.toggle('is-on', +im.dataset.ch === i));
      if (i === 1 && counter && !counted) { counted = true; cnt.v = 0; gsap.to(cnt, { v: 700, duration: reduce ? 0 : 2, ease: 'power3.out', onUpdate: () => counter.textContent = Math.round(cnt.v) }); }
    }
    gsap.set(chs, { autoAlpha: 0 }); setCh(0);
    // каждый жест прокрутки доводит до следующей главы
    const st = ScrollTrigger.create({ trigger: storyEl, start: 'top top', end: 'bottom bottom',
      onUpdate: self => { const p = self.progress; ZP.storyP = p; let i = 0; while (i < chs.length - 1 && p >= bounds[i + 1]) i++; setCh(i); } });
    ZP.storyP = 0;
    // внутри истории один жест = одна глава; инерция трекпада гасится, пока идёт переход
    const goCh = k => { const y = st.start + (st.end - st.start) * navAt[k]; ZP.lenis ? ZP.lenis.scrollTo(y, { duration: 1, easing: t => 1 - Math.pow(1 - t, 3) }) : scrollTo({ top: y, behavior: 'smooth' }); };
    let lockUntil = 0, lastWheel = 0;
    const inStory = () => scrollY >= st.start - 4 && scrollY <= st.end + 4;
    const step = dir => {
      const now = performance.now();
      if (now < lockUntil) return true;                       // ещё листаем — гасим
      const next = cur + dir;
      if (next < 0 || next > chs.length - 1) return false;    // край истории — отпускаем прокрутку дальше
      lockUntil = now + 1100; goCh(next); return true;
    };
    if (!reduce) {
      addEventListener('wheel', e => {
        if (!inStory() || Math.abs(e.deltaY) < 2) return;
        const now = performance.now(), quiet = now - lastWheel > 220; lastWheel = now;
        // хвост инерции после перехода тоже гасим, пока жест не закончится
        if (!quiet && now >= lockUntil && now - lockUntil < 1200) { lockUntil = now + 60; e.preventDefault(); e.stopImmediatePropagation(); return; }
        if (step(Math.sign(e.deltaY))) { e.preventDefault(); e.stopImmediatePropagation(); }
      }, { passive: false, capture: true });
      let ty = null, used = false;
      addEventListener('touchstart', e => { ty = inStory() ? e.touches[0].clientY : null; used = false; }, { passive: true });
      addEventListener('touchmove', e => {
        if (ty === null) return;
        if (used) { e.preventDefault(); return; }               // остаток свайпа не листает дальше
        const dy = ty - e.touches[0].clientY;
        const dir = Math.sign(dy), edge = cur + dir < 0 || cur + dir > chs.length - 1;
        if (edge && performance.now() >= lockUntil) { ty = null; return; }
        e.preventDefault();
        if (Math.abs(dy) > 40) { step(dir); used = true; }
      }, { passive: false });
      addEventListener('keydown', e => {
        if (!inStory() || e.target.closest('input,textarea')) return;
        const dir = ['ArrowDown', 'PageDown', ' '].includes(e.key) ? 1 : ['ArrowUp', 'PageUp'].includes(e.key) ? -1 : 0;
        if (dir && step(dir)) e.preventDefault();
      });
    }
    navs.forEach((b, k) => b.addEventListener('click', () => {
      const y = st.start + (st.end - st.start) * navAt[k];
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
    gsap.utils.toArray('.cases-fallback img').forEach((im, k) => {
      gsap.fromTo(im, { rotateY: (k - 1) * -28, rotateX: 10, z: -260, y: 80 }, { rotateY: (k - 1) * 6, rotateX: 0, z: 0, y: 0, ease: 'none',
        scrollTrigger: { trigger: '.cases-row', start: 'top bottom', end: 'center 45%', scrub: .8 } });
      const fig = im;
      fig.addEventListener('pointermove', e => { const r = fig.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        gsap.to(im, { rotateY: x * 18, rotateX: -y * 14, scale: 1.04, duration: .6, ease: 'power3.out' }); });
      fig.addEventListener('pointerleave', () => gsap.to(im, { rotateY: (k - 1) * 6, rotateX: 0, scale: 1, duration: .8, ease: 'power3.out' }));
    });
    // тара на полке: выплывает по прокрутке, за курсором слегка наклоняется
    gsap.utils.toArray('.orbit img').forEach((im, k) => {
      gsap.fromTo(im, { y: 90, rotate: (k - 1) * 6, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, ease: 'power3.out', duration: 1.2, delay: k * .08,
        scrollTrigger: { trigger: '.orbits', start: 'top 80%' } });
      const box = im.parentElement;
      box.addEventListener('pointermove', e => { const r = box.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        gsap.to(im, { rotateY: x * 16, rotateX: -y * 12, scale: 1.04, duration: .6, ease: 'power3.out' }); });
      box.addEventListener('pointerleave', () => gsap.to(im, { rotateY: 0, rotateX: 0, scale: 1, duration: .8, ease: 'power3.out' }));
    });
    // яйца: упаковки разъезжаются и вращаются по прокрутке
    gsap.utils.toArray('.eggs .cut').forEach((c, k) => gsap.fromTo(c, { rotate: [-14, 10, -6][k], x: [-60, 80, 40][k] }, { rotate: [4, -6, 8][k], x: 0, ease: 'none',
      scrollTrigger: { trigger: '.eggs', start: 'top bottom', end: 'bottom top', scrub: 1 } }));
    // качество: гранула под лупой
    gsap.fromTo('.q-lens-video', { scale: .8, rotate: -12, y: 20 }, { scale: 1, rotate: 8, y: -10, ease: 'none', scrollTrigger: { trigger: '.q-lens', start: 'top bottom', end: 'bottom 30%', scrub: 1 } });
    gsap.utils.toArray('.q-tag').forEach((t, k) => gsap.fromTo(t, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.q-lens', start: `top+=${120 + k * 90} 70%`, toggleActions: 'play none none reverse' } }));
    // карта: разворачивается из наклона
    gsap.fromTo('#geo-map', { rotateX: 42, y: 60, scale: .9 }, { rotateX: 0, y: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.geo', start: 'top bottom', end: 'top 25%', scrub: 1 } });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
