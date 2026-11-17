// Покадровое видео по прокрутке: единый фильм истории (ZP.storyP) и малые ролики (облёт тары, яйца).
// Видео закодированы так, что каждый кадр ключевой (-g 1): перемотка currentTime мгновенная в обе стороны.
(() => {
  const ZP = window.ZP || {};
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  function scrubber(video, getP, opts = {}) {
    let dur = 0, target = 0, cur = -1, ready = false;
    video.muted = true; video.playsInline = true; video.preload = 'auto';
    const onMeta = () => { dur = video.duration || 0; ready = dur > 0; };
    video.addEventListener('loadedmetadata', onMeta); if (video.readyState >= 1) onMeta();
    // iOS: видео должно «проснуться», прежде чем позволит перематывать
    const wake = () => { const p = video.play(); if (p) p.then(() => video.pause()).catch(() => {}); };
    wake(); addEventListener('touchstart', wake, { once: true, passive: true });
    const ptr = { x: 0, tx: 0 };
    if (opts.parallax) {
      const host = opts.parallax;
      host.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); ptr.tx = (e.clientX - r.left) / r.width - .5; });
      host.addEventListener('pointerleave', () => ptr.tx = 0);
    }
    function tick() {
      if (ready) {
        target = clamp(getP(ptr)) * (dur - .05);
        // мягкое догоняние: прокрутка ощущается как плавная камера
        const next = cur < 0 ? target : cur + (target - cur) * (ZP.reduce ? 1 : .18);
        if (Math.abs(next - cur) > .004) { cur = next; if (!video.seeking) video.currentTime = cur; }
      }
      ptr.x += (ptr.tx - ptr.x) * .08;
      if (opts.parallax) video.style.transform = `translate3d(${(-ptr.x * 18).toFixed(1)}px,0,0) scale(1.04)`;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  ZP.scrubber = scrubber;

  // --- единый фильм истории
  const story = document.querySelector('.story'), film = document.getElementById('storyfilm');
  if (story && film) {
    // прогресс истории → время фильма: главы стоят на ключевых кадрах (8 кадров, 7 переходов)
    const map = [[0, 0], [.05, 0], [.22, 1], [.36, 2], [.5, 3], [.62, 4], [.76, 5], [.9, 6], [1, 7]];
    const toT = P => { for (let i = 1; i < map.length; i++) if (P <= map[i][0]) { const [p0, k0] = map[i - 1], [p1, k1] = map[i]; return (k0 + (k1 - k0) * ((P - p0) / ((p1 - p0) || 1))) / 7; } return 1; };
    scrubber(film, () => toT(clamp(ZP.storyP || 0)), { parallax: film.parentElement });
    story.classList.add('has3d', 'is-film');
  }

  // --- малые ролики: прогресс = положение секции на экране (+ курсор для облёта тары)
  document.querySelectorAll('video[data-scrub]').forEach(v => {
    const sec = v.closest('section') || v.parentElement;
    const mode = v.dataset.scrub;
    scrubber(v, ptr => {
      const r = sec.getBoundingClientRect(), h = innerHeight;
      const p = clamp((h - r.top) / (h + r.height * .4));
      return mode === 'orbit' ? clamp(p * 1.1 - .05 + ptr.tx * .5) : clamp((p - .15) / .6);
    }, mode === 'orbit' ? { parallax: v.parentElement } : {});
  });
})();
