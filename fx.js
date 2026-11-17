// Премиальные детали: заголовки выезжают по строкам из-под маски, магнитные кнопки.
(() => {
  const ZP = window.ZP; if (!ZP) return;
  const SEL = '.hero-title .ln, .ch-title, .sec-head h2, .eggs h2, .geo h2, .contacts h2, .jobs h2, .cta-final h2';

  // разбивка на строки: слова → группы по offsetTop → <span.lm><span.lmi>…</span></span>
  function split(el) {
    if (!el.isConnected) return;
    const src = el._lmSrc && el.innerHTML === el._lmOut ? el._lmSrc : el.innerHTML;
    el._lmSrc = src;
    const tmp = document.createElement('div'); tmp.innerHTML = src;
    const words = [];
    const walk = (node) => node.childNodes.forEach(n => {
      if (n.nodeType === 3) n.textContent.split(/ +/).forEach(w => { if (w) words.push({ t: 'w', h: w.replace(/&/g, '&amp;').replace(/</g, '&lt;') }); });
      else if (n.nodeName === 'BR') words.push({ t: 'br' });
      else walk(n);
    });
    walk(tmp);
    el.innerHTML = words.map(w => w.t === 'br' ? '<br>' : `<span class="lw">${w.h}</span>`).join(' ');
    const lines = []; let top = null;
    el.querySelectorAll('.lw, br').forEach(n => {
      if (n.nodeName === 'BR') { top = null; return; }
      const t = n.offsetTop;
      if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; }
      lines[lines.length - 1].push(n.innerHTML);
    });
    el.innerHTML = lines.map(l => `<span class="lm"><span class="lmi">${l.join(' ')}</span></span>`).join('');
    el._lmOut = el.innerHTML;
  }
  const all = () => document.querySelectorAll(SEL).forEach(el => { split(el); if (el._lmHide && window.gsap) gsap.set(el.querySelectorAll('.lmi'), { yPercent: 115 }); });
  ZP.splitLines = all;
  all();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(all);
  document.addEventListener('zp:lang', () => requestAnimationFrame(all));
  let rw = innerWidth, rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (innerWidth !== rw) { rw = innerWidth; all(); } }, 200); });

  // показ строк: для глав истории вызывается из app.js, для секций — по прокрутке
  ZP.revealLines = (root, delay = 0) => {
    if (ZP.reduce || !window.gsap) return;
    const ls = root.querySelectorAll('.lmi'); if (!ls.length) return;
    gsap.fromTo(ls, { yPercent: 115 }, { yPercent: 0, duration: 1.05, ease: 'power4.out', stagger: .09, delay, overwrite: true });
  };
  if (window.gsap && window.ScrollTrigger && !ZP.reduce) {
    document.querySelectorAll(SEL).forEach(h => { if (h.closest('.story')) return;
      h._lmHide = true; gsap.set(h.querySelectorAll('.lmi'), { yPercent: 115 });
      ScrollTrigger.create({ trigger: h, start: 'top 88%', once: true, onEnter: () => { h._lmHide = false; ZP.revealLines(h); } });
    });
  }

  // интро первого экрана: без прелоадера — шапка, кадр и заголовок проявляются за секунду
  if (window.gsap && !ZP.reduce && scrollY < 40) {
    const stage = document.querySelector('.story-stage'), ch0 = document.querySelector('.ch[data-ch="0"]');
    gsap.from('.hdr', { y: -28, opacity: 0, duration: 1, ease: 'power3.out', delay: .1, clearProps: 'transform,opacity' });
    if (stage) gsap.from(stage, { opacity: 0, scale: 1.05, duration: 1.6, ease: 'power2.out', clearProps: 'transform,opacity' });
    gsap.from('.story-nav', { opacity: 0, y: 12, duration: .9, delay: .7, ease: 'power3.out', clearProps: 'transform,opacity' });
    let done = false; const go = () => { if (done) return; done = true; if (ch0) ZP.revealLines(ch0, .1); };
    if (ch0) gsap.set(ch0.querySelectorAll('.lmi'), { yPercent: 115 });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { all(); if (ch0) gsap.set(ch0.querySelectorAll('.lmi'), { yPercent: 115 }); go(); });
    setTimeout(go, 900);
  }

  // магнитные кнопки: слегка тянутся к курсору, отпускаются с пружиной
  if (window.gsap && !ZP.reduce && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.addEventListener('pointerover', e => {
      const b = e.target.closest('.btn, .hdr-cta'); if (!b || b._mag) return; b._mag = true;
      const xTo = gsap.quickTo(b, 'x', { duration: .45, ease: 'power3.out' }), yTo = gsap.quickTo(b, 'y', { duration: .45, ease: 'power3.out' });
      b.addEventListener('pointermove', ev => { const r = b.getBoundingClientRect(); xTo((ev.clientX - r.left - r.width / 2) * .28); yTo((ev.clientY - r.top - r.height / 2) * .38); });
      b.addEventListener('pointerleave', () => { gsap.to(b, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1,.45)', overwrite: true }); });
    });
  }
})();
