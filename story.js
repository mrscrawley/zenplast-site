// 3D-мир истории «От гранулы до полки», главы 1–4.
// Всё положение сцены — функция прогресса прокрутки P (ZP.storyP, 0..1) и времени только для лёгкого покачивания.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const ZP = window.ZP || {};
const story = document.querySelector('.story');
const canvas = document.getElementById('world');
const stage = canvas && canvas.parentElement;
const fail = () => story && story.classList.add('no3d');

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
const lerp = (a, b, t) => a + (b - a) * t;
// детерминированный ГПСЧ, чтобы сцена была одинаковой при каждой загрузке
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

(function start() {
  if (!canvas) return;
  if (ZP.lite) return fail();
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { return fail(); }
  if (!renderer.getContext()) return fail();
  let dpr = Math.min(devicePixelRatio, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const BG = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#d5e5f2');
  const scene = new THREE.Scene();
  scene.background = BG; // фон = цвет страницы: стекло преломляет его, а не пустоту
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;

  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-4, 8, 6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 6;
  Object.assign(key.shadow.camera, { left: -8, right: 14, top: 6, bottom: -6, near: 1, far: 30 });
  scene.add(key, key.target);
  scene.add(new THREE.HemisphereLight(0xf3f8ff, 0xbdd2e6, .55));
  const rim = new THREE.DirectionalLight(0xcfe3ff, .6); rim.position.set(6, 2, -6); scene.add(rim);

  // мягкая тень на «полу»
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 20), new THREE.ShadowMaterial({ opacity: .12 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.95; floor.receiveShadow = true; scene.add(floor);

  /* ---------- ГРАНУЛЫ ---------- */
  const mobile = matchMedia('(max-width: 820px)').matches;
  const N = mobile ? 300 : 560;
  const clearMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: .7, roughness: .02, ior: 1.52, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 1.6, specularIntensity: 1, attenuationColor: new THREE.Color('#b9d7f2'), attenuationDistance: .6, dispersion: .4 });
  const milkMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: .35, thickness: .5, roughness: .28, envMapIntensity: 1.3, ior: 1.45, clearcoat: .6, clearcoatRoughness: .3, sheen: .4, sheenColor: new THREE.Color('#ffffff') });
  const capsule = new THREE.CapsuleGeometry(.062, .07, 6, 16); capsule.rotateZ(Math.PI / 2);
  const lentil = new THREE.SphereGeometry(.078, 20, 14); lentil.scale(1, .58, 1);
  const nA = Math.floor(N * .45), nB = N - nA;
  const meshA = new THREE.InstancedMesh(capsule, clearMat, nA);
  const meshB = new THREE.InstancedMesh(lentil, milkMat, nB);
  [meshA, meshB].forEach(m => { m.castShadow = true; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); });

  // траектории потока: общий ствол и две ветки (A — к экструдеру, B — к литью)
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const curveA = new THREE.CatmullRomCurve3([V(0, -1.05), V(-.35, -.35), V(.35, .45), V(1.7, 1.0, .25), V(3.4, 1.15), V(5.2, 1.25), V(6.55, 1.75)]);
  const curveB = new THREE.CatmullRomCurve3([V(0, -1.05), V(-.35, -.35), V(.45, -.75), V(1.9, -1.25, .25), V(3.5, -1.5), V(5.0, -1.75)]);
  const HEAP = { x: 0, y: -1.95, R: 1.55, H: 1.05 };
  const P_ = [];
  for (let i = 0; i < N; i++) {
    // облако: эллипсоид, плотнее к центру
    const u = rnd(), v = rnd(), w = Math.cbrt(rnd());
    const th = u * Math.PI * 2, ph = Math.acos(2 * v - 1);
    const cloud = V(.6 + 3.1 * w * Math.sin(ph) * Math.cos(th), .15 + 1.75 * w * Math.cos(ph), 1.5 * w * Math.sin(ph) * Math.sin(th));
    // горка: конус
    const hy = 1 - Math.sqrt(rnd());
    const rr = HEAP.R * (1 - hy) * Math.sqrt(rnd()), ta = rnd() * Math.PI * 2;
    const heap = V(HEAP.x + rr * Math.cos(ta), HEAP.y + .08 + hy * HEAP.H, rr * Math.sin(ta) * .8);
    P_.push({
      cloud, heap, delay: hy, d2: rnd(), u0: rnd(), branch: i % 2,
      jit: V((rnd() - .5) * .34, (rnd() - .5) * .34, (rnd() - .5) * .5),
      axis: V(rnd() - .5, rnd() - .5, rnd() - .5).normalize(), spin: .2 + rnd() * .5, phase: rnd() * 6.28,
      s: .82 + rnd() * .38
    });
  }

  /* ---------- ЭКСТРУЗИЯ ---------- */
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xe3eaf1, metalness: .85, roughness: .22, clearcoat: .6, envMapIntensity: 1.4 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x23344a, metalness: .5, roughness: .4 });
  const ext = new THREE.Group(); scene.add(ext);
  const die = new THREE.Mesh(new RoundedBoxGeometry(1.15, .62, 1.7, 6, .12), steel);
  die.position.set(7.25, .45, 0); die.castShadow = true; ext.add(die);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(.02, .05, 1.42), dark); slot.position.set(7.83, .36, 0); ext.add(slot);
  const lip = new THREE.Mesh(new RoundedBoxGeometry(.16, .26, 1.6, 4, .05), steel); lip.position.set(7.86, .36, 0); ext.add(lip);
  const hopper = new THREE.Mesh(new THREE.CylinderGeometry(.62, .16, .9, 48, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xe3eaf1, metalness: .8, roughness: .25, side: THREE.DoubleSide, envMapIntensity: 1.4 }));
  hopper.position.set(6.95, 1.3, 0); hopper.castShadow = true; ext.add(hopper);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .3, 32), steel); neck.position.set(6.95, .8, 0); ext.add(neck);

  const filmMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: .015, roughness: .03, ior: 1.5, metalness: 0, clearcoat: 1, clearcoatRoughness: .04, side: THREE.DoubleSide, envMapIntensity: 1.6, iridescence: .55, iridescenceIOR: 1.3, specularIntensity: 1 });
  const SEG = 60, FW = 1.36;
  const filmGeo = new THREE.PlaneGeometry(1, FW, SEG, 1);
  const film = new THREE.Mesh(filmGeo, filmMat); film.castShadow = true; ext.add(film);
  const ROLL = V(10.05, -.45, 0);
  // торец рулона: витки плёнки кольцами
  const ringC = document.createElement('canvas'); ringC.width = ringC.height = 512;
  { const g = ringC.getContext('2d'); g.fillStyle = '#e7eff7'; g.fillRect(0, 0, 512, 512);
    for (let k = 0; k < 140; k++) { const rr = 256 * k / 140; g.strokeStyle = `rgba(${150 + (k % 3) * 30},${180 + (k % 5) * 10},${210 + (k % 4) * 10},${.25 + (k % 2) * .25})`; g.lineWidth = 1.2; g.beginPath(); g.arc(256, 256, rr, 0, 7); g.stroke(); } }
  const ringTex = new THREE.CanvasTexture(ringC); ringTex.colorSpace = THREE.SRGBColorSpace;
  const rollSide = new THREE.MeshPhysicalMaterial({ color: 0xf2f7fc, metalness: .35, roughness: .08, clearcoat: 1, clearcoatRoughness: .03, transmission: .55, thickness: .5, envMapIntensity: 1.8, iridescence: .3 });
  const rollCap = new THREE.MeshPhysicalMaterial({ map: ringTex, metalness: .3, roughness: .2, clearcoat: .8, transmission: .2, thickness: .4 });
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, FW, 128, 1), [rollSide, rollCap, rollCap]);
  roll.rotation.x = Math.PI / 2; roll.position.copy(ROLL); roll.castShadow = true; ext.add(roll);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, FW + .1, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0xc08d5c, roughness: .75, side: THREE.DoubleSide }));
  core.rotation.x = Math.PI / 2; core.position.copy(ROLL); ext.add(core);

  /* ---------- КАМЕРА ПО КЛЮЧАМ ---------- */
  const keys = [
    [0.00, V(.6, .25, 10.4), V(.6, .05, 0)],
    [0.14, V(.6, .1, 9.6), V(.6, -.1, 0)],
    [0.32, V(.1, -.55, 6.6), V(.05, -1.25, 0)],
    [0.44, V(.2, -.45, 7.4), V(.2, -1.0, 0)],
    [0.58, V(1.7, .1, 10.6), V(1.7, -.15, 0)],
    [0.70, V(6.6, 2.4, 10.2), V(7.4, .1, 0)],
    [0.86, V(8.4, 3.4, 8.6), V(8.6, -.1, 0)],
    [1.00, V(8.9, 3.0, 8.0), V(8.85, -.2, 0)]
  ];
  const camPos = V(0, 0, 0), camTgt = V(0, 0, 0);
  function camAt(P) {
    let i = 0; while (i < keys.length - 2 && P > keys[i + 1][0]) i++;
    const [p0, a0, b0] = keys[i], [p1, a1, b1] = keys[i + 1];
    const k = smooth((P - p0) / (p1 - p0));
    camPos.lerpVectors(a0, a1, k); camTgt.lerpVectors(b0, b1, k);
  }

  /* ---------- ВВОД ---------- */
  const ptr = { x: 0, y: 0, sx: 0, sy: 0, world: V(99, 99, 0), active: false };
  stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect();
    ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1; ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1; ptr.active = true;
  });
  stage.addEventListener('pointerleave', () => ptr.active = false);
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(V(0, 0, 1), 0);

  function size() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h;
    cam.fov = w / h < 1 ? 42 : 30; cam.updateProjectionMatrix();
  }
  new ResizeObserver(size).observe(stage); size();

  let visible = true;
  new IntersectionObserver(es => es.forEach(e => visible = e.isIntersecting), { rootMargin: '150px' }).observe(story);

  /* ---------- КАДР ---------- */
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = V(0, 0, 0), sc = V(1, 1, 1), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0);
  const clock = new THREE.Clock(); let frames = 0, slow = 0;
  const filmPos = filmGeo.attributes.position;
  const reduce = ZP.reduce;

  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const dt = clock.getDelta(); const t = reduce ? 0 : clock.elapsedTime;
    const P = clamp(ZP.storyP || 0);

    // адаптивное качество
    if (frames++ < 90) { if (dt > .022) slow++; if (frames === 90 && slow > 45 && dpr > 1) { dpr = 1; renderer.setPixelRatio(1); size(); } }

    camAt(P);
    ptr.sx = lerp(ptr.sx, ptr.active ? ptr.x : 0, .05); ptr.sy = lerp(ptr.sy, ptr.active ? ptr.y : 0, .05);
    cam.position.set(camPos.x + ptr.sx * .35, camPos.y + ptr.sy * .22, camPos.z);
    cam.lookAt(camTgt);

    // курсор в мире (для отталкивания гранул в первой главе)
    if (ptr.active) { ray.setFromCamera({ x: ptr.x, y: ptr.y }, cam); ray.ray.intersectPlane(plane, ptr.world); } else ptr.world.set(99, 99, 0);

    const fade3 = smooth((P - .64) / .06);   // ветка B уходит со сцены
    let ia = 0, ib = 0;
    for (let i = 0; i < N; i++) {
      const g = P_[i];
      // 1) облако + покачивание
      pos.copy(g.cloud);
      pos.y += Math.sin(t * .6 + g.phase) * .06; pos.x += Math.cos(t * .45 + g.phase) * .05;
      // отталкивание курсором
      const dx = pos.x - ptr.world.x, dy = pos.y - ptr.world.y, d = Math.hypot(dx, dy);
      if (d < 1.3) { const f = (1 - d / 1.3) * .55; pos.x += dx / (d || 1) * f; pos.y += dy / (d || 1) * f; }
      // 2) горка
      const k1 = smooth((P - .14 - g.delay * .1) / .1);
      if (k1 > 0) {
        tmp.copy(g.heap);
        pos.lerp(tmp, k1);
        pos.y += Math.sin(Math.PI * k1) * .35 * (1 - g.delay);
      }
      // 3) поток по веткам
      const k2 = smooth((P - .41 - g.d2 * .07) / .08);
      let scale = g.s;
      if (k2 > 0) {
        const curve = g.branch ? curveB : curveA;
        const sAlong = (g.u0 + t * .035 + P * .6) % 1;
        curve.getPointAt(sAlong, tmp2);
        tmp2.add(tmp.copy(g.jit).multiplyScalar(1 - sAlong * .5));
        pos.lerp(tmp2, k2);
        if (g.branch) scale *= 1 - fade3;
        else {
          // у бункера гранула «проваливается» внутрь
          const into = smooth((sAlong - .9) / .08) * smooth((P - .6) / .06);
          scale *= 1 - into;
        }
      }
      q.setFromAxisAngle(g.axis, t * g.spin + g.phase + P * 6);
      sc.setScalar(Math.max(0, scale));
      m4.compose(pos, q, sc);
      if (i < nA) meshA.setMatrixAt(ia++, m4); else meshB.setMatrixAt(ib++, m4);
    }
    meshA.instanceMatrix.needsUpdate = true; meshB.instanceMatrix.needsUpdate = true;

    // 4) экструзия: линия появляется, плёнка выходит и наматывается
    const kE = smooth((P - .6) / .1);
    ext.visible = kE > .001;
    ext.position.y = (1 - kE) * -.6;
    const kF = smooth((P - .7) / .1);           // длина выпущенной плёнки
    const kR = smooth((P - .76) / .22);         // рост рулона
    const r = .26 + .5 * kR;
    roll.scale.set(r, 1, r); roll.visible = kF > .02;
    roll.rotation.y = -P * 30;
    const sx = 7.95, sy = .36;                  // выход щелевой головки
    const ex = lerp(sx + .05, ROLL.x, kF), ey = lerp(sy, ROLL.y + r, kF);
    const len = Math.hypot(ex - sx, ey - sy) || .001;
    for (let j = 0; j <= SEG; j++) {
      const u = j / SEG;
      const x = lerp(sx, ex, u), y = lerp(sy, ey, u) - Math.sin(Math.PI * u) * .12 * len / 2.5 + Math.sin(u * 9 - t * 2) * .012;
      filmPos.setXY(j, x, y); filmPos.setXY(j + SEG + 1, x, y);
      filmPos.setZ(j, FW / 2); filmPos.setZ(j + SEG + 1, -FW / 2);
    }
    filmPos.needsUpdate = true; filmGeo.computeVertexNormals(); filmGeo.computeBoundingSphere();
    film.visible = kF > .01;

    renderer.render(scene, cam);
  });
  story.classList.add('has3d');
})();
