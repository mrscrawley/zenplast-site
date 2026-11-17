// Шаблон страницы изделия (п.9): product.html?p=<slug>
(() => {
  const ZP = window.ZP, box = document.getElementById('pd');
  const slug = new URLSearchParams(location.search).get('p');
  let img = 0;
  function render() {
    const f = slug && ZP.find(slug);
    if (!f) {
      box.innerHTML = `<p class="pd-empty">${ZP.t('Изделие не найдено.', 'Product not found.')} <a href="index.html#range">${ZP.t('Вернуться в каталог', 'Back to catalogue')}</a></p>`;
      return;
    }
    const { g, s, it } = f;
    document.title = ZP.tr(it.title) + ' — ' + ZP.t('Зен Пласт', 'Zen Plast');
    const specs = it.specs.length
      ? `<dl class="pd-specs">${it.specs.map(([k, v]) => `<div><dt>${ZP.esc(ZP.tr(k))}</dt><dd>${ZP.esc(ZP.tr(v))}</dd></div>`).join('')}</dl>`
      : `<p class="pd-empty">${ZP.t('Характеристики уточняйте у отдела продаж.', 'Ask the sales team for specifications.')}</p>`;
    const thumbs = it.imgs.length > 1 ? `<div class="pd-thumbs">${it.imgs.map((src, i) => `<button type="button" data-i="${i}" aria-pressed="${i === img}" aria-label="${ZP.t('Фото', 'Photo')} ${i + 1}"><img src="${src}" alt=""></button>`).join('')}</div>` : '';
    const related = s.items.filter(x => x.slug !== it.slug).slice(0, 4).map(x =>
      `<a class="card" href="product.html?p=${encodeURIComponent(x.slug)}"><div class="card-img">${x.imgs[0] ? `<img src="${x.imgs[0]}" alt="" loading="lazy">` : ''}</div><div class="card-body"><h3>${ZP.esc(ZP.tr(x.title))}</h3></div></a>`).join('');
    box.innerHTML = `
      <nav class="crumbs" aria-label="${ZP.t('Навигация', 'Breadcrumbs')}"><a href="index.html">${ZP.t('Главная', 'Home')}</a><span>/</span><a href="index.html?group=${g.id}#range">${ZP.esc(ZP.t(g.ru, g.en))}</a><span>/</span><span>${ZP.esc(ZP.t(s.ru, s.en))}</span></nav>
      <div class="pd">
        <div class="pd-gallery"><div class="pd-main">${it.imgs[img] ? `<img src="${it.imgs[img]}" alt="${ZP.esc(it.title)}">` : ''}</div>${thumbs}</div>
        <div class="pd-info">
          <p class="eyebrow">${ZP.esc(ZP.t(g.ru, g.en))}</p>
          <h1>${ZP.esc(ZP.tr(it.title))}</h1>
          ${specs}
          <div class="pd-actions">
            <a class="btn btn-solid" href="index.html#contacts">${ZP.t('Запросить цену', 'Request a price')}</a>
            <a class="btn btn-ghost" href="tel:+375291703227">+375 29 170 32 27</a>
          </div>
        </div>
      </div>
      ${related ? `<section class="pd-related"><h2>${ZP.t('Ещё в разделе', 'More in this range')}</h2><div class="grid">${related}</div></section>` : ''}`;
    box.querySelectorAll('.pd-thumbs button').forEach(b => b.addEventListener('click', () => { img = +b.dataset.i; render(); }));
  }
  render();
  document.addEventListener('zp:lang', render);
})();
