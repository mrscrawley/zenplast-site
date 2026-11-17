// 3D-модели тары клиентов (Sveza, «Карат», «Антарктик криль») и гранула под лупой в «Качестве».
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const ZP = window.ZP || {};
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
const BG = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#d5e5f2';

function makeRenderer(canvas, transparent) {
  let r;
  try { r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: transparent }); } catch (e) { return null; }
  if (!r.getContext()) return null;
  r.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  return r;
}
const loader = new THREE.TextureLoader();
const tex = (src, wrap) => { const t = loader.load(src); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (wrap) t.wrapS = THREE.RepeatWrapping; return t; };
// прогресс секции по прокрутке: 0 — верх секции у низа экрана, 1 — секция по центру
function sectionP(el) { const r = el.getBoundingClientRect(), h = innerHeight; return clamp((h - r.top) / (h * .5 + r.height * .5)); }

/* ---------- геометрия: скруглённый прямоугольник с сужением книзу ---------- */
function rrPerimeter(w, d, r, seg = 10) {
  const hw = w / 2, hd = d / 2, pts = [];
  const line = (x0, z0, x1, z1, n) => { for (let i = 0; i < n; i++) pts.push([x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n]); };
  const arc = (cx, cz, a0, a1) => { for (let i = 0; i < seg; i++) { const a = a0 + (a1 - a0) * i / seg; pts.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]); } };
  // обход так, чтобы на лицевой стороне (+z) текстура шла слева направо, а её центр приходился на центр лицевой стороны
  line(0, -hd, -hw + r, -hd, 8); arc(-hw + r, -hd + r, -Math.PI / 2, -Math.PI);
  line(-hw, -hd + r, -hw, hd - r, 8); arc(-hw + r, hd - r, Math.PI, Math.PI / 2);
  line(-hw + r, hd, hw - r, hd, 16); arc(hw - r, hd - r, Math.PI / 2, 0);
  line(hw, hd - r, hw, -hd + r, 8); arc(hw - r, -hd + r, 0, -Math.PI / 2);
  line(hw - r, -hd, 0, -hd, 8); pts.push([0, -hd]);
  return pts;
}
function tubSide(w, d, r, h, k0) {
  const per = rrPerimeter(w, d, r), n = per.length;
  const len = [0]; for (let i = 1; i < n; i++) len.push(len[i - 1] + Math.hypot(per[i][0] - per[i - 1][0], per[i][1] - per[i - 1][1]));
  const L = len[n - 1], pos = [], uv = [], idx = [];
  const rings = [[0, k0], [h, 1]];
  rings.forEach(([y, k]) => per.forEach(([x, z], i) => { pos.push(x * k, y, z * k); uv.push(len[i] / L, y / h); }));
  for (let i = 0; i < n - 1; i++) { const a = i, b = i + 1, c = n + i, e = n + i + 1; idx.push(a, c, b, b, c, e); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals(); return g;
}
function rrShape(w, d, r) {
  const s = new THREE.Shape(), hw = w / 2, hd = d / 2;
  s.moveTo(-hw + r, -hd); s.lineTo(hw - r, -hd); s.quadraticCurveTo(hw, -hd, hw, -hd + r); s.lineTo(hw, hd - r); s.quadraticCurveTo(hw, hd, hw - r, hd);
  s.lineTo(-hw + r, hd); s.quadraticCurveTo(-hw, hd, -hw, hd - r); s.lineTo(-hw, -hd + r); s.quadraticCurveTo(-hw, -hd, -hw + r, -hd); return s;
}
function planarUV(g, w, d) { const p = g.attributes.position, uv = []; for (let i = 0; i < p.count; i++) uv.push((p.getX(i) + w / 2) / w, (p.getY(i) + d / 2) / d); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return g; }

function makeTub({ w, d, r, h, k0, sideMap, sideColor, lidColor, lidMap }) {
  const g = new THREE.Group();
  const plastic = c => new THREE.MeshPhysicalMaterial({ color: c, roughness: .38, clearcoat: .35, clearcoatRoughness: .3 });
  const side = new THREE.Mesh(tubSide(w, d, r, h, k0), sideMap ? new THREE.MeshPhysicalMaterial({ map: sideMap, roughness: .3, clearcoat: .7, side: THREE.DoubleSide }) : Object.assign(plastic(sideColor), { side: THREE.DoubleSide }));
  g.add(side);
  const bottom = new THREE.Mesh(new THREE.ShapeGeometry(rrShape(w * k0, d * k0, r * k0)), plastic(sideColor || 0xffffff)); bottom.rotation.x = Math.PI / 2; g.add(bottom);
  const lw = w + .1, ld = d + .1, lr = r + .05;
  const lid = new THREE.Mesh(new THREE.ExtrudeGeometry(rrShape(lw, ld, lr), { depth: .1, bevelEnabled: false, curveSegments: 24 }), plastic(lidColor));
  lid.rotation.x = -Math.PI / 2; lid.position.y = h - .01; g.add(lid);
  if (lidMap) {
    const tw = lw - .12, td = ld - .12;
    const top = new THREE.Mesh(planarUV(new THREE.ShapeGeometry(rrShape(tw, td, lr - .05), 24), tw, td), new THREE.MeshPhysicalMaterial({ map: lidMap, roughness: .25, clearcoat: .9, clearcoatRoughness: .08 }));
    top.rotation.x = -Math.PI / 2; top.position.y = h + .1 + .002; g.add(top);
  }
  return g;
}
function makeCup({ wrap, lidMap }) {
  const g = new THREE.Group(), R0 = .66, R1 = .84, H = 1.05;
  const rAt = y => R0 + (R1 - R0) * y / H;
  const prof = [[0, 0], [R0 - .02, 0], [R0, .02], [R1, H], [R1 + .05, H + .01], [R1 + .05, H + .05], [R1 - .03, H + .04], [R0 - .03, .06], [0, .06]].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 128), new THREE.MeshPhysicalMaterial({ color: 0xf7f8f6, roughness: .4, clearcoat: .3 })));
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(rAt(.97) + .004, rAt(.08) + .004, .89, 128, 1, true), new THREE.MeshPhysicalMaterial({ map: wrap, roughness: .25, clearcoat: .8 }));
  lab.position.y = .525; lab.rotation.y = -Math.PI / 2; g.add(lab); // шов этикетки уводим назад
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(R1 + .08, R1 + .08, .1, 128), new THREE.MeshPhysicalMaterial({ color: 0xf2f6fb, roughness: .3, clearcoat: .6 }));
  lid.position.y = H + .09; g.add(lid);
  const top = new THREE.Mesh(new THREE.CircleGeometry(R1 + .02, 96), new THREE.MeshPhysicalMaterial({ map: lidMap, roughness: .22, clearcoat: .9 }));
  top.rotation.x = -Math.PI / 2; top.position.y = H + .141; g.add(top);
  return g;
}

/* ---------- ТАРА, КОТОРОЙ МЫ ГОРДИМСЯ ---------- */
(function cases() {
  const canvas = document.getElementById('cases3d'); if (!canvas) return;
  const wrapEl = canvas.closest('.cases');
  const fail = () => wrapEl.classList.add('no3d');
  if (ZP.lite) return fail();
  const r = makeRenderer(canvas, true); if (!r) return fail();
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), .03).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.3); key.position.set(-3, 6, 5); scene.add(key);
  scene.add(new THREE.HemisphereLight(0xf3f8ff, 0xc9dbec, .5));
  const cam = new THREE.PerspectiveCamera(24, 1, .1, 60);

  const feta = makeTub({ w: 1.9, d: 1.4, r: .28, h: .82, k0: .9, sideMap: tex('media/tex/feta-side.jpg', true), sideColor: 0xffffff, lidColor: 0x1d56c4, lidMap: tex('media/tex/feta-lid.jpg') });
  const karatA = makeTub({ w: 1.75, d: 1.2, r: .22, h: .42, k0: .92, sideColor: 0xf3c11d, lidColor: 0xf3c11d, lidMap: tex('media/tex/karat-lid1.jpg') });
  const karatB = makeTub({ w: 1.75, d: 1.2, r: .22, h: .42, k0: .92, sideColor: 0xf3c11d, lidColor: 0xf3c11d, lidMap: tex('media/tex/karat-lid2.jpg') });
  const karat = new THREE.Group(); karat.add(karatA, karatB);
  karatA.position.set(-.18, 0, .25); karatB.position.set(.22, .62, -.25); karatB.rotation.set(.12, -.35, .08);
  const krill = makeCup({ wrap: tex('media/tex/krill-wrap.jpg', true), lidMap: tex('media/tex/krill-lid.jpg') });
  const items = [feta, karat, krill]; items.forEach(m => scene.add(m));

  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  canvas.addEventListener('pointermove', e => { const b = canvas.getBoundingClientRect(); ptr.tx = (e.clientX - b.left) / b.width * 2 - 1; ptr.ty = (e.clientY - b.top) / b.height * 2 - 1; });
  canvas.addEventListener('pointerleave', () => { ptr.tx = 0; ptr.ty = 0; });

  let spread = 3.4;
  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    r.setSize(w, h, false); cam.aspect = w / h;
    spread = w / h < 1.2 ? 2.4 : 3.4;
    const need = spread * 2 + 2.6; // ширина, которую надо вместить
    const dist = need / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) / cam.aspect;
    cam.position.set(0, dist * .32, dist); cam.lookAt(0, .35, 0); cam.updateProjectionMatrix();
  }
  new ResizeObserver(size).observe(canvas); size();
  let visible = false; new IntersectionObserver(es => es.forEach(e => visible = e.isIntersecting), { rootMargin: '120px' }).observe(canvas);
  const clock = new THREE.Clock();
  r.setAnimationLoop(() => {
    if (!visible) return;
    const t = ZP.reduce ? 0 : clock.getElapsedTime(), p = sectionP(wrapEl);
    ptr.x += (ptr.tx - ptr.x) * .06; ptr.y += (ptr.ty - ptr.y) * .06;
    items.forEach((m, k) => {
      const kk = smooth((p - .05 - k * .08) / .45);
      m.position.set((k - 1) * spread, (1 - kk) * -2.2 + Math.sin(t * .9 + k) * .05, (1 - kk) * -1.5);
      m.rotation.y = (1 - kk) * (k - 1) * 1.4 + Math.sin(t * .35 + k * 2) * .35 + ptr.x * .5 + (k === 2 ? t * .25 : 0);
      m.rotation.x = .08 + ptr.y * .18;
      m.scale.setScalar(.7 + .3 * kk);
    });
    r.render(scene, cam);
  });
  wrapEl.classList.add('has3d');
})();

/* ---------- ГРАНУЛА ПОД ЛУПОЙ ---------- */
(function lens() {
  const canvas = document.getElementById('lens3d'); if (!canvas) return;
  const box = canvas.closest('.q-lens');
  if (ZP.lite) return box.classList.add('no3d');
  const r = makeRenderer(canvas, false); if (!r) return box.classList.add('no3d');
  const scene = new THREE.Scene(); scene.background = new THREE.Color(BG);
  scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), .03).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-3, 5, 4); scene.add(key);
  const cam = new THREE.PerspectiveCamera(30, 1, .1, 40); cam.position.set(0, 0, 7);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: 1.6, roughness: .02, ior: 1.5, clearcoat: 1, envMapIntensity: 1.7, dispersion: .6, attenuationColor: new THREE.Color('#a9cdef'), attenuationDistance: 2.2 });
  const milk = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: .35, thickness: .5, roughness: .28, clearcoat: .6 });
  const big = new THREE.Mesh(new THREE.CapsuleGeometry(.9, .9, 16, 64), glass); big.rotation.z = Math.PI / 2; scene.add(big);
  const small = []; const cg = new THREE.CapsuleGeometry(.09, .1, 6, 16), lg = new THREE.SphereGeometry(.12, 20, 14); lg.scale(1, .58, 1);
  for (let i = 0; i < 46; i++) { const m = new THREE.Mesh(i % 2 ? cg : lg, i % 2 ? glass : milk); const a = i / 46 * Math.PI * 2; m.userData = { a, rad: 2.0 + (i % 5) * .22, y: ((i * 37) % 11 - 5) * .14, s: .6 + (i % 3) * .25 }; scene.add(m); small.push(m); }
  function size() { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  new ResizeObserver(size).observe(canvas); size();
  let visible = false; new IntersectionObserver(es => es.forEach(e => visible = e.isIntersecting), { rootMargin: '120px' }).observe(canvas);
  const clock = new THREE.Clock();
  r.setAnimationLoop(() => {
    if (!visible) return;
    const t = ZP.reduce ? 0 : clock.getElapsedTime(), p = sectionP(box);
    big.rotation.set(p * 1.2 + Math.sin(t * .4) * .1, p * 2.2 + t * .15, Math.PI / 2 + .3);
    big.scale.setScalar(.75 + p * .45);
    small.forEach((m, i) => { const u = m.userData, a = u.a + t * .12 + p * 1.5; m.position.set(Math.cos(a) * u.rad, u.y + Math.sin(a * 2) * .1, Math.sin(a) * u.rad * .6); m.rotation.set(a * 2, a, 0); m.scale.setScalar(u.s); });
    r.render(scene, cam);
  });
  box.classList.add('has3d');
})();
