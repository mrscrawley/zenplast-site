// Общее для всех страниц: язык, шрифт из лаборатории, облегчённый режим, меню, прокрутка, словарь каталога
(() => {
  const ZP = window.ZP = {};
  const root = document.documentElement;
  const qs = new URLSearchParams(location.search);
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  // --- облегчённый режим для слабых устройств (п.18)
  const nav = navigator, conn = nav.connection || {};
  const touch = matchMedia('(pointer: coarse)').matches;
  ZP.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  ZP.lite = ZP.reduce || conn.saveData === true || /2g/.test(conn.effectiveType || '') ||
    (nav.deviceMemory && nav.deviceMemory <= 2) || qs.has('lite');
  if (ZP.lite) {
    root.classList.add('is-lite');
    document.querySelectorAll('video.lp-video').forEach(v => { v.removeAttribute('autoplay'); v.pause(); v.preload = 'none'; });
  }

  // --- шрифт из лаборатории (п.14): ?font=a|b|c|d, запоминается
  const fonts = { a: 'Manrope', b: 'Inter Tight', c: 'Onest', d: 'Unbounded' };
  let font = qs.get('font'); if (font && fonts[font]) store.set('zp-font', font); else font = store.get('zp-font');
  if (font === 'b') font = null;
  if (font && fonts[font]) root.dataset.font = font;

  // --- язык (п.15): ru по умолчанию, ?lang=en или кнопка, выбор запоминается
  const dict = {
    // ключи характеристик
    'Размер паллеты, мм': 'Pallet size, mm', 'На паллете, шт': 'Per pallet, pcs', 'В коробке, шт': 'Per box, pcs',
    'Объём': 'Volume', 'Материал': 'Material', 'Вес': 'Weight', 'Вес, кг': 'Weight, kg', 'Размеры, мм': 'Dimensions, mm',
    'Диаметр, мм': 'Diameter, mm', 'Ширина': 'Width', 'Толщина': 'Thickness',
    // значения
    'по желанию заказчика': 'on request', 'По желанию заказчика': 'on request', 'ПЭТ': 'PET',
    'PP, полипропилен': 'PP, polypropylene', 'PS, полистирол': 'PS, polystyrene', 'PP, полипропилен, PE': 'PP, polypropylene, PE'
  };
  const words = [['Стаканчик', 'Cup'], ['Стакан', 'Cup'], ['Крышка', 'Lid'], ['Лоток', 'Tray'], ['Ящик', 'Crate'], ['Контейнер', 'Container'],
    ['Плёнка', 'Film'], ['Упаковка мелкоштучная под яйцо перепелиное', 'Small pack for quail eggs'], ['овальный', 'oval'], ['прозрачный', 'clear'],
    ['белый', 'white'], ['джамбо', 'jumbo'], ['двухсекционный', 'two-compartment'], ['молочный', 'dairy'], ['колбасный', 'sausage'],
    ['сырково-творожный', 'curd'], ['Лоток хлебный с боковой стенкой', 'bread tray with side wall'], ['овощной', 'vegetable'], ['ягодный', 'berry'],
    ['исполнения', 'versions'], ['грибок', 'mushroom'], ['мл', 'ml'], ['г', 'g'], ['мм', 'mm'], ['мкм', 'µm'], ['кг', 'kg'], ['ПЭТ', 'PET'], ['ПП', 'PP'], ['Айран', 'ayran'], ['Экспонента', 'Exponenta'], ['Мираторг', 'Miratorg']];
  ZP.lang = (qs.get('lang') === 'en' || qs.get('lang') === 'ru') ? qs.get('lang') : (store.get('zp-lang') || 'ru');
  ZP.t = (ru, en) => ZP.lang === 'en' ? en : ru;
  ZP.tr = s => {
    if (ZP.lang !== 'en' || !s) return s;
    if (dict[s]) return dict[s];
    let out = s;
    for (const [a, b] of words) out = out.replace(new RegExp('(^|[^А-Яа-яЁё])' + a + '(?=$|[^А-Яа-яЁё])', 'g'), '$1' + b);
    return out.replace(/№/g, 'No.');
  };
  const nodes = [...document.querySelectorAll('[data-en]')];
  nodes.forEach(n => n.dataset.ru = n.innerHTML);
  ZP.applyLang = () => {
    root.lang = ZP.lang;
    nodes.forEach(n => n.innerHTML = ZP.lang === 'en' ? n.dataset.en : n.dataset.ru);
    document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === ZP.lang));
    document.dispatchEvent(new CustomEvent('zp:lang'));
  };
  document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => {
    ZP.lang = b.dataset.lang; store.set('zp-lang', ZP.lang); ZP.applyLang(); closeMenu();
  }));
  ZP.applyLang();

  // --- шапка со стеклом
  const hdr = document.getElementById('hdr');
  const onScroll = () => hdr && hdr.classList.toggle('is-glass', window.scrollY > 40 || document.body.classList.contains('page-product'));
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // --- мобильное меню (п.16)
  const burger = document.querySelector('.burger'), menu = document.getElementById('mmenu');
  function closeMenu() { if (!menu) return; menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); root.classList.remove('menu-open'); }
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = menu.hidden; menu.hidden = !open; burger.setAttribute('aria-expanded', String(open)); root.classList.toggle('menu-open', open);
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  }

  // --- плавная прокрутка
  ZP.lenis = null;
  if (!ZP.lite && window.Lenis) {
    ZP.lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    if (window.gsap && window.ScrollTrigger) {
      ZP.lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => ZP.lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    } else { const raf = t => { ZP.lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href'); const el = id.length > 1 && document.querySelector(id); if (!el) return;
    e.preventDefault();
    if (ZP.lenis) ZP.lenis.scrollTo(el, { offset: id === '#top' ? 0 : -70 }); else el.scrollIntoView({ behavior: ZP.reduce ? 'auto' : 'smooth' });
  });

  // --- каталог: поиск позиции
  ZP.find = slug => {
    for (const g of window.CATALOG || []) for (const s of g.subs) for (const it of s.items) if (it.slug === slug) return { g, s, it };
    return null;
  };
  ZP.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
})();
