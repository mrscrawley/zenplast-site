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

  // --- единый фильм истории: главы стоят на ключевых кадрах (8 кадров, 7 переходов)
  const story = document.querySelector('.story'), film = document.getElementById('storyfilm');
  if (story && film) {
    const map = [[0, 0], [.06, 0], [.2, 1], [.24, 1], [.34, 2], [.38, 2], [.48, 3], [.52, 3], [.61, 4], [.63, 4], [.74, 5], [.78, 5], [.88, 6], [.92, 6], [.98, 7], [1, 7]];
    const toT = P => { for (let i = 1; i < map.length; i++) if (P <= map[i][0]) { const [p0, k0] = map[i - 1], [p1, k1] = map[i]; return (k0 + (k1 - k0) * ((P - p0) / ((p1 - p0) || 1))) / 7; } return 1; };
    scrubber(film, () => toT(clamp(ZP.storyP || 0)), story);
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
