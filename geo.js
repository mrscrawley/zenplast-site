// География поставок: города со старого сайта zenplast.by, маршруты из Буда-Кошелево прорисовываются по прокрутке.
(() => {
  const svg = document.getElementById('geo-map');
  if (!svg || !window.d3 || !window.topojson) return;
  const ZP = window.ZP;
  const HUB = { ru: 'Буда-Кошелево', en: 'Buda-Kashalyova', c: [30.57, 52.72] };
  const BY = [
    ['Минск', 'Minsk', 27.56, 53.90], ['Гродно', 'Grodno', 23.83, 53.68], ['Брест', 'Brest', 23.69, 52.10],
    ['Витебск', 'Vitebsk', 30.20, 55.19], ['Могилёв', 'Mogilev', 30.33, 53.90], ['Гомель', 'Gomel', 30.98, 52.44],
    ['Калинковичи', 'Kalinkavichy', 29.33, 52.13]
  ];
  const RU = [
    ['Псков', 'Pskov', 28.33, 57.82], ['Москва', 'Moscow', 37.62, 55.76], ['Чехов', 'Chekhov', 37.46, 55.14],
    ['Брянск', 'Bryansk', 34.36, 53.24], ['Курск', 'Kursk', 36.19, 51.73], ['Липецк', 'Lipetsk', 39.60, 52.61],
    ['Самара', 'Samara', 50.15, 53.20], ['Челябинск', 'Chelyabinsk', 61.40, 55.16], ['Шадринск', 'Shadrinsk', 63.63, 56.08]
  ];
  const W = 1200, H = 640;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const proj = d3.geoConicConformal().parallels([50, 58]).rotate([-44, 0]);
  const pts = { type: 'MultiPoint', coordinates: [HUB.c, ...BY.map(c => [c[2], c[3]]), ...RU.map(c => [c[2], c[3]])] };
  proj.fitExtent([[70, 70], [W - 90, H - 60]], pts);
  const path = d3.geoPath(proj);
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); (parent || svg).appendChild(n); return n; };

  // контуры стран растворяются к краям радиальной заливкой (без SVG-маски: она перерисовывала всю карту каждый кадр)
  const defs = el('defs', {});
  const grad = (id, col) => { const rg = el('radialGradient', { id, gradientUnits: 'userSpaceOnUse', cx: W / 2, cy: H / 2, r: W / 2, gradientTransform: `translate(0 ${H / 2}) scale(1 ${H / W}) translate(0 ${-H / 2})` }, defs);
    el('stop', { offset: '52%', 'stop-color': col }, rg); el('stop', { offset: '98%', 'stop-color': col, 'stop-opacity': 0 }, rg); };
  grad('geoFill', '#e3eef7'); grad('geoFillHi', '#eef5fb');
  const gLand = el('g', { class: 'geo-land' }), gArcs = el('g', { class: 'geo-arcs' }), gDots = el('g', { class: 'geo-dots' });
  const hub = proj(HUB.c);
  const arcs = [];
  function addCity(c, group) {
    const p = proj([c[2], c[3]]);
    const dx = p[0] - hub[0], dy = p[1] - hub[1], len = Math.hypot(dx, dy);
    const bend = Math.min(.28, 40 / len + .12);
    const cx = (hub[0] + p[0]) / 2 - dy * bend, cy = (hub[1] + p[1]) / 2 + dx * bend;
    const a = el('path', { d: `M${hub[0]},${hub[1]} Q${cx},${cy} ${p[0]},${p[1]}`, class: 'geo-arc geo-' + group }, gArcs);
    const g = el('g', { class: 'geo-city geo-' + group, transform: `translate(${p[0]},${p[1]})` }, gDots);
    el('circle', { r: 6.5 }, g);
    const left = p[0] < hub[0] - 5 || p[0] > W * .8;
    const below = false;
    const t = el('text', below ? { x: 0, y: 30, 'text-anchor': 'middle' } : { x: left ? -13 : 13, y: 7, 'text-anchor': left ? 'end' : 'start' }, g);
    t.dataset.ru = c[0]; t.dataset.en = c[1]; t.textContent = ZP.t(c[0], c[1]);
    arcs.push({ a, g, group });
  }
  BY.forEach(c => addCity(c, 'by')); RU.forEach(c => addCity(c, 'ru'));
  const gh = el('g', { class: 'geo-hub', transform: `translate(${hub[0]},${hub[1]})` }, gDots);
  el('circle', { r: 22, class: 'pulse' }, gh); el('circle', { r: 10 }, gh);
  const ht = el('text', { x: 6, y: 52, 'text-anchor': 'middle' }, gh); ht.dataset.ru = HUB.ru; ht.dataset.en = HUB.en; ht.textContent = ZP.t(HUB.ru, HUB.en);
  document.addEventListener('zp:lang', () => svg.querySelectorAll('text[data-ru]').forEach(t => t.textContent = ZP.t(t.dataset.ru, t.dataset.en)));

  arcs.forEach(({ a }) => { const L = a.getTotalLength(); a.style.strokeDasharray = L; a.style.strokeDashoffset = L; a.dataset.l = L; });

  // контуры стран (сеть нужна только для подложки; без неё карта всё равно работает)
  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json').then(r => r.json()).then(topo => {
    const fc = topojson.feature(topo, topo.objects.countries);
    const near = new Set(['112', '643', '804', '616', '440', '428', '233', '398', '246', '498', '268', '051', '031', '795', '860']);
    fc.features.filter(f => near.has(String(f.id).padStart(3, '0'))).forEach(f => {
      const id = String(f.id).padStart(3, '0');
      el('path', { d: path(f), class: 'geo-country' + (id === '112' ? ' is-by' : id === '643' ? ' is-ru' : '') }, gLand);
    });
  }).catch(() => {});

  const show = p => {
    const n = arcs.length;
    arcs.forEach(({ a, g }, i) => {
      const k = Math.max(0, Math.min(1, p * (n + 1) - i));
      a.style.strokeDashoffset = a.dataset.l * (1 - k);
      g.classList.toggle('is-on', k > .9);
    });
  };
  if (ZP.reduce || !window.ScrollTrigger) { show(1); return; }
  show(0);
  ScrollTrigger.create({ trigger: '.geo', start: 'top 85%', end: 'top 30%', scrub: .5, onUpdate: s => show(s.progress) });
})();
