// Страница изделия: product.html?p=<slug>
// Галерея с лупой, «Подходит к этому» (крышки ↔ тара по серии и диаметру), образец, спецификация PDF.
(() => {
  const ZP = window.ZP, box = document.getElementById('pd');
  const slug = new URLSearchParams(location.search).get('p');
  const C = window.CATALOG || [];
  let img = 0;

  // ключи совместимости: серия (КЛ-1, КУ-7) и диаметр горла (75, 85, 95, 101)
  const isLid = it => /крышк/i.test(it.title);
  function keys(it) {
    const k = new Set(), t = it.title, s = it.slug;
    const code = t.match(/(КЛ|КУ)[\s-]?(\d+)/i); if (code) k.add('c:' + code[1].toUpperCase() + code[2]);
    const tc = t.match(/ТС\/P[SРPР]\/(\d{2,3})\//i); if (tc) k.add('d:' + tc[1]);
    const lid = t.match(/ф\s?(\d{2,3})|(\d{2,3})\s?ф/i); if (lid) k.add('d:' + (lid[1] || lid[2]));
    const sl = s.match(/(?:^|-)f-?(\d{2,3})(?:-|$)/); if (sl) k.add('d:' + sl[1]);
    return k;
  }
  // серия (КЛ-1, КУ-7) — точное совпадение; диаметр — только внутри одной технологии
  function matches(it, gid) {
    const mine = keys(it); if (!mine.size) return [];
    const want = !isLid(it), out = [];
    for (const g of C) for (const s of g.subs) for (const x of s.items) {
      if (x.slug === it.slug || isLid(x) !== want) continue;
      for (const k of keys(x)) if (mine.has(k) && (k[0] === 'c' || g.id === gid)) { out.push(x); break; }
    }
    return out.slice(0, 8);
  }
  const card = x => `<a class="card" href="product.html?p=${encodeURIComponent(x.slug)}"><div class="card-img">${x.imgs[0] ? `<img src="${x.imgs[0]}" alt="" loading="lazy" decoding="async">` : ''}</div><div class="card-body"><h3>${ZP.esc(ZP.tr(x.title))}</h3></div></a>`;

  function render() {
    const f = slug && ZP.find(slug);
    if (!f) {
      box.innerHTML = `<p class="pd-empty">${ZP.t('Изделие не найдено.', 'Product not found.')} <a href="index.html#range">${ZP.t('Вернуться в каталог', 'Back to catalogue')}</a></p>`;
      return;
    }
    const { g, s, it } = f;
    const title = ZP.tr(it.title);
    document.title = title + ' — ' + ZP.t('Зен Пласт', 'Zen Plast');
    const specs = it.specs.length
      ? `<dl class="pd-specs">${it.specs.map(([k, v]) => `<div><dt>${ZP.esc(ZP.tr(k))}</dt><dd>${ZP.esc(ZP.tr(v))}</dd></div>`).join('')}</dl>`
      : `<p class="pd-empty">${ZP.t('Характеристики уточняйте у отдела продаж.', 'Ask the sales team for specifications.')}</p>`;
    const thumbs = it.imgs.length > 1 ? `<div class="pd-thumbs">${it.imgs.map((src, i) => `<button type="button" data-i="${i}" aria-pressed="${i === img}" aria-label="${ZP.t('Фото', 'Photo')} ${i + 1}"><img src="${src}" alt=""></button>`).join('')}</div>` : '';
    const pair = matches(it, g.id);
    const pairTitle = isLid(it) ? ZP.t('Подходит к', 'Fits') : ZP.t('Крышки к этому изделию', 'Matching lids');
    const related = s.items.filter(x => x.slug !== it.slug && !pair.includes(x)).slice(0, 4).map(card).join('');
    box.innerHTML = `
      <div class="pd-print-head"><img src="media/logo.png" alt="Zen Plast" width="110"><span>zenplast.by · +375 29 170 32 27 · info@zenplast.by</span></div>
      <nav class="crumbs" aria-label="${ZP.t('Навигация', 'Breadcrumbs')}"><a href="index.html">${ZP.t('Главная', 'Home')}</a><span>/</span><a href="index.html?group=${g.id}#range">${ZP.esc(ZP.t(g.ru, g.en))}</a><span>/</span><span>${ZP.esc(ZP.t(s.ru, s.en))}</span></nav>
      <div class="pd">
        <div class="pd-gallery">
          <div class="pd-main" title="${ZP.t('Наведите, чтобы рассмотреть', 'Hover to zoom')}">${it.imgs[img] ? `<img src="${it.imgs[img]}" alt="${ZP.esc(it.title)}">` : ''}</div>
          ${thumbs}
        </div>
        <div class="pd-info">
          <p class="eyebrow">${ZP.esc(ZP.t(s.ru, s.en))}</p>
          <h1>${ZP.esc(title)}</h1>
          ${specs}
          <div class="pd-actions">
            <a class="btn btn-solid" href="index.html?sample=${encodeURIComponent(it.slug)}#contacts">${ZP.t('Запросить образец', 'Request a sample')}</a>
            <button class="btn btn-ghost" type="button" data-print>${ZP.t('Спецификация PDF', 'Spec sheet PDF')}</button>
          </div>
          <p class="pd-note">${ZP.t('Цвет, нанесение и IML-этикетка — под ваш продукт. Цену рассчитаем по объёму партии.', 'Colour, decoration and IML label tailored to your product. Pricing depends on the batch size.')}</p>
        </div>
      </div>
      ${pair.length ? `<section class="pd-related pd-pair"><h2>${pairTitle}</h2><div class="grid">${pair.map(card).join('')}</div></section>` : ''}
      ${related ? `<section class="pd-related"><h2>${ZP.t('Ещё в разделе', 'More in this range')}</h2><div class="grid">${related}</div></section>` : ''}`;

    // фото: смена без перерисовки страницы
    const main = box.querySelector('.pd-main'), mainImg = main.querySelector('img');
    box.querySelectorAll('.pd-thumbs button').forEach(b => b.addEventListener('click', () => {
      img = +b.dataset.i;
      box.querySelectorAll('.pd-thumbs button').forEach(x => x.setAttribute('aria-pressed', x === b));
      mainImg.classList.add('is-swap');
      setTimeout(() => { mainImg.src = it.imgs[img]; mainImg.onload = () => mainImg.classList.remove('is-swap'); }, 180);
    }));
    // лупа: увеличение в точке курсора
    if (mainImg && matchMedia('(hover:hover)').matches) {
      main.addEventListener('pointermove', e => { const r = main.getBoundingClientRect(); mainImg.style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`; main.classList.add('is-zoom'); });
      main.addEventListener('pointerleave', () => main.classList.remove('is-zoom'));
    }
    box.querySelector('[data-print]').addEventListener('click', () => print());
  }
  render();
  document.addEventListener('zp:lang', render);
})();
