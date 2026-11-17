// Покадровое видео по прокрутке: единый фильм истории (ZP.storyP) и малые ролики (облёт тары, яйца, гранула).
// Ролики крутятся, только пока видны на экране; currentTime меняем, лишь когда цель сдвинулась.
(() => {
  const ZP = window.ZP || {};
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  function scrubber(video, getP, watchEl) {
    let dur = 0, cur = -1, visible = false, raf = 0;
    video.muted = true; video.playsInline = true; video.preload = 'auto';
    const onMeta = () => { dur = video.duration || 0; };
    video.addEventListener('loadedmetadata', onMeta); if (video.readyState >= 1) onMeta();
    // iOS: видео должно «проснуться», прежде чем позволит перематывать
    const wake = () => { const p = video.play(); if (p) p.then(() => video.pause()).catch(() => {}); };
    wake(); addEventListener('touchstart', wake, { once: true, passive: true });
    function tick() {
      raf = 0;
      if (!visible || !dur) return;
      const target = clamp(getP()) * (dur - .05);
      const next = cur < 0 ? target : cur + (target - cur) * (ZP.reduce ? 1 : .2);
      if (Math.abs(target - cur) > .02) {
        if (!video.seeking) { cur = Math.abs(next - target) < .02 ? target : next; video.currentTime = cur; }
        raf = requestAnimationFrame(tick); // догоняем цель и засыпаем
      }
    }
    const kick = () => { if (!raf && visible) raf = requestAnimationFrame(tick); };
    addEventListener('scroll', kick, { passive: true });
    video.addEventListener('loadedmetadata', kick); video.addEventListener('seeked', kick);
    new IntersectionObserver(es => { visible = es[0].isIntersecting; kick(); }, { rootMargin: '20% 0px' }).observe(watchEl || video);
  }
  ZP.scrubber = scrubber;

  // --- единый фильм истории: пошагово. Глава = ключевой кадр; переход между главами
  // проигрывается как обычное видео (вперёд — film.mp4, назад — film-rev.mp4), без покадровой перемотки.
  const story = document.querySelector('.story'), film = document.getElementById('storyfilm'), rev = document.getElementById('storyfilmrev');
  if (story && film) {
    const K = 7; let dur = 0, seg = 0, curK = 0, tgtK = 0, busy = false;
    [film, rev].forEach(v => { if (!v) return; v.muted = true; v.playsInline = true; const w = () => { const p = v.play(); if (p) p.then(() => v.pause()).catch(() => {}); }; w(); addEventListener('touchstart', w, { once: true, passive: true }); });
    const meta = () => { dur = film.duration || 0; seg = dur / K; };
    film.addEventListener('loadedmetadata', meta); if (film.readyState >= 1) meta();
    const seek = (v, t) => new Promise(r => { if (Math.abs(v.currentTime - t) < .01) return r(); v.addEventListener('seeked', r, { once: true }); v.currentTime = t; });
    const until = (v, test) => new Promise(r => { const f = () => test() ? r() : requestAnimationFrame(f); requestAnimationFrame(f); });
    async function run() {
      if (busy || !seg) return; busy = true;
      while (tgtK !== curK) {
        const k = tgtK, rate = 1.6;
        // дальний прыжок: встаём на соседний с целью кадр и проигрываем только последний переход
        if (Math.abs(k - curK) > 1) { const pre = k > curK ? k - 1 : k + 1; await seek(film, pre * seg); curK = pre; }
        if (k > curK || !rev) {
          if (k < curK) { await seek(film, k * seg); curK = k; break; }
          film.playbackRate = rate; story.classList.remove('is-rev');
          film.play().catch(() => {});
          await until(film, () => film.currentTime >= k * seg - .03 || film.ended);
          film.pause(); await seek(film, k * seg);
        } else {
          await seek(rev, dur - curK * seg);
          story.classList.add('is-rev'); rev.playbackRate = rate; rev.play().catch(() => {});
          await until(rev, () => rev.currentTime >= dur - k * seg - .03 || rev.ended);
          rev.pause(); await seek(film, k * seg); story.classList.remove('is-rev');
        }
        curK = k;
      }
      busy = false;
      if (tgtK !== curK) run();
    }
    ZP.filmGo = k => { tgtK = Math.max(0, Math.min(K, k)); if (ZP.reduce && seg) { film.currentTime = tgtK * seg; curK = tgtK; return; } run(); };
    film.addEventListener('loadedmetadata', () => ZP.filmGo(tgtK));
    story.classList.add('has3d', 'is-film');
  }

  // --- малые ролики: прогресс = положение секции на экране
  document.querySelectorAll('video[data-scrub]').forEach(v => {
    const sec = v.closest('section') || v.parentElement;
    const mode = v.dataset.scrub;
    scrubber(v, () => {
      const r = sec.getBoundingClientRect(), h = innerHeight;
      const p = clamp((h - r.top) / (h + r.height * .4));
      if (mode === 'lens') return clamp((p - .1) / .8);
      return mode === 'orbit' ? clamp(p * 1.1 - .05) : clamp((p - .42) / .38); // яйца ложатся, когда блок уже в центре экрана
    }, sec);
  });
})();
