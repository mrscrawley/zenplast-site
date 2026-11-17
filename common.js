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
    ['исполнения', 'versions'], ['грибок', 'mushroom cap'], ['мл', 'ml'], ['г', 'g'], ['мм', 'mm'], ['мкм', 'µm'], ['кг', 'kg'], ['ПЭТ', 'PET'], ['ПП', 'PP'], ['Айран', 'ayran'], ['Экспонента', 'Exponenta'], ['Мираторг', 'Miratorg']];
  ZP.lang = (qs.get('lang') === 'en' || qs.get('lang') === 'ru') ? qs.get('lang') : (store.get('zp-lang') || 'ru');
  ZP.t = (ru, en) => ZP.lang === 'en' ? en : ru;
  ZP.tr = s => {
    if (ZP.lang !== 'en' || !s) return s;
    if (dict[s]) return dict[s];
    let out = s.replace('Лоток хлебный с боковой стенкой', 'bread tray with side wall');
    for (const [a, b] of words) out = out.replace(new RegExp('(^|[^А-Яа-яЁё])' + a + '(?=$|[^А-Яа-яЁё])', 'g'), '$1' + b);
    out = out.replace(/№/g, 'No.')
      .replace(/[фФ]\s?(\d{2,3})/g, 'Ø$1').replace(/(\d{2,3})\s?[фФ]/g, 'Ø$1')
      .replace(/(\d)\s?[хx×*]\s?(?=\d)/g, '$1×').replace(/(\d),(\d)/g, '$1.$2').replace(/грибок/gi, 'mushroom cap');
    // артикулы и остатки кириллицы — латиницей (КЛ-1 → KL-1, ЛС-8 → LS-8, ТС/PР → TS/PP)
    const T = { А:'A',Б:'B',В:'V',Г:'G',Д:'D',Е:'E',Ё:'E',Ж:'Zh',З:'Z',И:'I',Й:'Y',К:'K',Л:'L',М:'M',Н:'N',О:'O',П:'P',Р:'R',С:'S',Т:'T',У:'U',Ф:'F',Х:'Kh',Ц:'Ts',Ч:'Ch',Ш:'Sh',Щ:'Shch',Ы:'Y',Э:'E',Ю:'Yu',Я:'Ya',Ь:'',Ъ:'' };
    out = out.replace(/ТС\//g, 'TS/').replace(/\/PР\//g, '/PP/');
    return out.replace(/[А-ЯЁЬЪ]/g, ch => T[ch] ?? ch).replace(/[а-яё]/g, ch => { const u = T[ch.toUpperCase()]; return u === undefined ? ch : u.toLowerCase(); });
  };
  const nodes = [...document.querySelectorAll('[data-en]')];
  nodes.forEach(n => n.dataset.ru = n.innerHTML);
  // атрибуты (alt, aria-label, title) и заголовок вкладки — тоже на английском
  const ATTR = { 'Зен Пласт':'Zen Plast','Зен Пласт, на главную':'Zen Plast, home','Разделы':'Sections','Меню':'Menu','Быстрые действия':'Quick actions','От гранулы до упаковки':'From granule to packaging','Главы':'Chapters','Производство':'Production','Цех Зен Пласт':'Zen Plast factory floor','Тара наших клиентов':"Our clients' packaging",'Контейнер Sveza «Фета нежная»':'Sveza feta container','Контейнеры «Карат»':'Karat containers','Стакан «Антарктик криль»':'Antarctic Krill cup','Контейнеры для сыра фета':'Feta cheese containers','Контейнеры для плавленого сыра':'Processed cheese containers','Стаканы для продукции из криля':'Cups for krill products','Каталог':'Catalogue','Упаковка для яиц':'Egg packaging','Качество':'Quality','Партнёры':'Partners','Савушкин':'Savushkin','Санта Бремор':'Santa Bremor','Карат':'Karat','Экспонента':'Exponenta','Серволюкс':'Servolux','Тимоша':'Timosha','Джинн':'Dzhinn','Агрокомбинат Дзержинский':'Dzerzhinsky Agro Plant','1М Молочный':'1M Dairy','География поставок':'Delivery geography','Карта поставок: маршруты из Буда-Кошелево в города Беларуси и России':'Delivery map: routes from Buda-Kashalyova to cities in Belarus and Russia','Вакансии':'Careers','Обсудим вашу упаковку':"Let's talk about your packaging",'Навигация':'Breadcrumbs','Фото':'Photo' };
  const attrEls = [...document.querySelectorAll('[alt],[aria-label],[title]')].filter(e => ['alt','aria-label','title'].some(a => /[А-Яа-яЁё]/.test(e.getAttribute(a) || '')));
  attrEls.forEach(e => ['alt','aria-label','title'].forEach(a => { const v = e.getAttribute(a); if (v && /[А-Яа-яЁё]/.test(v)) e.dataset['ru' + a.replace('-', '')] = v; }));
  const docTitle = document.title;
  ZP.applyLang = () => {
    root.lang = ZP.lang;
    nodes.forEach(n => n.innerHTML = ZP.lang === 'en' ? n.dataset.en : n.dataset.ru);
    attrEls.forEach(e => ['alt','aria-label','title'].forEach(a => { const ru = e.dataset['ru' + a.replace('-', '')]; if (ru) e.setAttribute(a, ZP.lang === 'en' ? (ATTR[ru] || ZP.tr(ru)) : ru); }));
    if (docTitle.startsWith('Зен Пласт —')) document.title = ZP.lang === 'en' ? 'Zen Plast — polymer packaging manufacturer' : docTitle;
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
