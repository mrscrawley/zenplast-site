// 3D-стакан с IML-этикеткой (п.2). Белый PP как у литьевой тары клиента, этикетки — демо, рисуются на canvas.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const ZP = window.ZP || {};
const canvas = document.getElementById('jar');
const stageEl = canvas && canvas.parentElement;
const fail = () => stageEl && stageEl.classList.add('no3d');

(function start() {
  if (!canvas) return;
  if (ZP.lite) return fail();
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { return fail(); }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  cam.position.set(0, 1.7, 8.2); cam.lookAt(0, 1.15, 0);
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-3, 5, 4); scene.add(key);
  scene.add(new THREE.HemisphereLight(0xeef4ff, 0xd9e2ea, .6));

  // --- профиль стакана: дно, конусная стенка, бортик, внутренняя стенка
  const R0 = 0.80, R1 = 1.0, H = 1.70;
  const rAt = y => R0 + (R1 - R0) * (y - 0.04) / (H - 0.04);
  const pts = [[0, 0], [R0 - .03, 0], [R0, .03], [R0, .04], [R1, H], [R1 + .07, H + .015], [R1 + .075, H + .06], [R1 + .02, H + .07], [R1 - .03, H + .05], [R1 - .035, H], [R0 - .035, .09], [0, .09]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const cupMat = new THREE.MeshPhysicalMaterial({ color: 0xf6f7f4, roughness: .42, clearcoat: .25, clearcoatRoughness: .5, sheen: .3, sheenColor: 0xffffff });
  const cup = new THREE.Mesh(new THREE.LatheGeometry(pts, 160), cupMat);

  // --- этикетка: открытый конус чуть больше стенки
  const yA = .2, yB = 1.56;
  const labelGeo = new THREE.CylinderGeometry(rAt(yB) + .004, rAt(yA) + .004, yB - yA, 160, 1, true);
  const mkLabelMat = tex => new THREE.MeshPhysicalMaterial({ map: tex, roughness: .28, clearcoat: .8, clearcoatRoughness: .15, transparent: true });

  const W = 2048, Hh = 680;
  const designs = [
    { bg: '#f7d4dc', ink: '#b3123f', acc: '#e94a6f', ru: ['Йогурт', 'клубника'], en: ['Yogurt', 'strawberry'], w: '250 г', shape: 'dots' },
    { bg: '#fbf0cf', ink: '#0d3b8c', acc: '#f2c14e', ru: ['Пломбир', 'ванильный'], en: ['Ice cream', 'vanilla'], w: '400 г', shape: 'waves' },
    { bg: '#014e9e', ink: '#ffffff', acc: '#6fb0ff', ru: ['Творог', 'нежный 5%'], en: ['Cottage cheese', 'soft 5%'], w: '350 г', shape: 'rings' },
    { bg: '#ffe2c4', ink: '#7a2e00', acc: '#ff8a2a', ru: ['Соус', 'сырный'], en: ['Sauce', 'cheese'], w: '200 г', shape: 'stripes' }
  ];
  function drawLabel(d) {
    const c = document.createElement('canvas'); c.width = W; c.height = Hh;
    const g = c.getContext('2d');
    g.fillStyle = d.bg; g.fillRect(0, 0, W, Hh);
    g.globalAlpha = .9; g.fillStyle = d.acc; g.strokeStyle = d.acc;
    if (d.shape === 'dots') for (let i = 0; i < 26; i++) { g.beginPath(); g.arc((i * 211) % W, 80 + (i * 137) % (Hh - 160), 18 + (i % 4) * 14, 0, 7); g.fill(); }
    if (d.shape === 'waves') { g.lineWidth = 22; for (let k = 0; k < 4; k++) { g.beginPath(); for (let x = 0; x <= W; x += 16) g.lineTo(x, 470 + k * 50 + Math.sin(x / 90 + k) * 20); g.stroke(); } }
    if (d.shape === 'rings') { g.lineWidth = 10; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(1560, 340, 60 + i * 55, 0, 7); g.stroke(); } }
    if (d.shape === 'stripes') for (let x = -Hh; x < W; x += 120) { g.beginPath(); g.moveTo(x, Hh); g.lineTo(x + Hh, 0); g.lineTo(x + Hh + 50, 0); g.lineTo(x + 50, Hh); g.fill(); }
    g.globalAlpha = 1;
    // две «лицевые» стороны, чтобы название читалось при вращении
    const lang = ZP.lang === 'en' ? 'en' : 'ru';
    [W * .25, W * .75].forEach(cx => {
      g.fillStyle = d.bg; g.globalAlpha = .82; g.beginPath(); g.roundRect(cx - 360, 150, 720, 380, 40); g.fill(); g.globalAlpha = 1;
      g.fillStyle = d.ink; g.textAlign = 'center';
      g.font = '600 120px "Inter Tight", Inter, sans-serif'; g.fillText(d[lang][0], cx, 300, 660);
      g.font = '300 76px "Inter Tight", Inter, sans-serif'; g.fillText(d[lang][1], cx, 400, 660);
      g.font = '500 40px "JetBrains Mono", monospace'; g.fillText(d.w + '  ·  IML DEMO', cx, 480);
    });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = THREE.RepeatWrapping;
    return t;
  }
  let textures = designs.map(drawLabel);
  const labA = new THREE.Mesh(labelGeo, mkLabelMat(textures[0])); labA.position.y = (yA + yB) / 2;
  const labB = new THREE.Mesh(labelGeo, mkLabelMat(textures[1])); labB.position.y = (yA + yB) / 2; labB.material.opacity = 0; labB.scale.setScalar(1.002);
  labA.renderOrder = 1; labB.renderOrder = 2;
  labB.material.polygonOffset = true; labB.material.polygonOffsetFactor = -2; labB.material.polygonOffsetUnits = -2;

  // --- крышка (синяя, как литьевые крышки клиента)
  const lidPts = [[0, .06], [R1 + .06, .045], [R1 + .1, .02], [R1 + .1, -.06], [R1 + .07, -.07], [R1 + .07, -.01], [R1 - .02, 0], [0, .01]].map(([x, y]) => new THREE.Vector2(x, y));
  const lid = new THREE.Mesh(new THREE.LatheGeometry(lidPts, 160), new THREE.MeshPhysicalMaterial({ color: 0x014e9e, roughness: .38, clearcoat: .5 }));
  const group = new THREE.Group(); group.add(cup, labA, labB, lid); scene.add(group);

  // --- мягкая тень
  const sh = document.createElement('canvas'); sh.width = sh.height = 256;
  const sg = sh.getContext('2d'), grd = sg.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(13,27,42,.28)'); grd.addColorStop(1, 'rgba(13,27,42,0)'); sg.fillStyle = grd; sg.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.42; scene.add(shadow);

  // --- размеры
  function size() {
    const w = stageEl.clientWidth, h = stageEl.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h;
    cam.position.z = w / h < .9 ? 11 : w / h < 1.25 ? 10 : 9; cam.updateProjectionMatrix();
  }
  new ResizeObserver(size).observe(stageEl); size();

  // --- смена этикетки
  let cur = 0, fading = null;
  function setLabel(i) {
    if (i === cur) return; cur = i;
    labB.material.map = textures[i]; labB.material.needsUpdate = true;
    fading = { t0: performance.now() };
  }
  const redraw = () => {
    textures.forEach(t => t.dispose()); textures = designs.map(drawLabel);
    labA.material.map = textures[cur]; labA.material.needsUpdate = true;
  };
  document.addEventListener('zp:lang', redraw);
  document.fonts && document.fonts.ready.then(redraw);

  // --- цикл; рендер только когда секция видна
  let visible = false;
  new IntersectionObserver(es => es.forEach(e => visible = e.isIntersecting), { rootMargin: '100px' }).observe(stageEl);
  const clock = new THREE.Clock(); let rot = 0;
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    const p = ZP.imlProgress || 0;
    setLabel(Math.min(3, Math.floor(p * 4 * .999)));
    if (fading) {
      const k = Math.min(1, (performance.now() - fading.t0) / 450);
      labB.material.opacity = k;
      if (k >= 1) { labA.material.map = labB.material.map; labA.material.needsUpdate = true; labB.material.opacity = 0; fading = null; }
    }
    const target = -0.6 + p * Math.PI * 3 + Math.sin(t * .5) * .06;
    rot += (target - rot) * Math.min(1, dt * 4);
    group.rotation.y = rot;
    group.rotation.z = Math.sin(t * .7) * .025;
    group.position.y = .05 + Math.sin(t * 1.1) * .04;
    // крышка парит над стаканом и закрывается к концу сцены
    const close = Math.min(1, Math.max(0, (p - .72) / .2));
    lid.position.y = H + .07 + .55 * (1 - close) + Math.sin(t * 1.3) * .03 * (1 - close);
    lid.rotation.x = .18 * (1 - close); lid.rotation.z = -.1 * (1 - close);
    shadow.material.opacity = .9 - (group.position.y) * .6;
    renderer.render(scene, cam);
  });
  stageEl.classList.add('has3d');
})();
