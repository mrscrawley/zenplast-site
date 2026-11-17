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
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0004;
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 6, bottom: -6, near: 1, far: 30 });
  scene.add(key, key.target);
  scene.add(new THREE.HemisphereLight(0xf3f8ff, 0xbdd2e6, .55));
  const rim = new THREE.DirectionalLight(0xcfe3ff, .6); rim.position.set(6, 2, -6); scene.add(rim);

  // мягкая тень на «полу»
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 24), new THREE.ShadowMaterial({ opacity: .12 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(15, -1.95, 0); floor.receiveShadow = true; scene.add(floor);

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


  /* ===================== ЗАХОД 2: термоформование, литьё IML, ящики, вся линия ===================== */
  const clearPet = new THREE.MeshPhysicalMaterial({ color: 0xf3f9ff, transmission: .94, thickness: .12, roughness: .04, ior: 1.5, clearcoat: 1, clearcoatRoughness: .03, side: THREE.DoubleSide, envMapIntensity: 1.6, iridescence: .3, attenuationColor: new THREE.Color('#cfe4f7'), attenuationDistance: 1.2 });

  // --- термоформование (x = 16)
  const TX = 16;
  const thermo = new THREE.Group(); scene.add(thermo);
  const mould = new THREE.Mesh(new RoundedBoxGeometry(3.0, .5, 1.7, 6, .1), steel); mould.position.set(TX, -.75, 0); mould.castShadow = true; mould.receiveShadow = true; thermo.add(mould);
  const heater = new THREE.Mesh(new RoundedBoxGeometry(3.0, .16, 1.7, 4, .06), steel);
  heater.position.set(TX, 1.6, 0); heater.castShadow = true; thermo.add(heater);
  const coilMat = new THREE.MeshStandardMaterial({ color: 0x3a1c0c, emissive: new THREE.Color('#ff7a2e'), emissiveIntensity: 0, roughness: .5 });
  for (let k = 0; k < 7; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 2.7, 12), coilMat); c.rotation.z = Math.PI / 2; c.position.set(TX, 1.49, -.66 + k * .22); thermo.add(c); }
  const glow = new THREE.PointLight(0xffa25a, 0, 5, 2); glow.position.set(TX, 1.2, 0); thermo.add(glow);
  // лист 2.6 × 1.3 с ячейками 5 × 2 под яйца
  const SW = 2.6, SD = 1.3, sGeo = new THREE.PlaneGeometry(SW, SD, 150, 76); sGeo.rotateX(-Math.PI / 2);
  const sBase = sGeo.attributes.position.array.slice();
  const cells = []; for (let cx = 0; cx < 5; cx++) for (let cz = 0; cz < 2; cz++) cells.push([-1.0 + cx * .5, -.32 + cz * .64]);
  const depthAt = (x, z) => { let d = 0; for (const [cx, cz] of cells) { const r = Math.hypot((x - cx) / .2, (z - cz) / .24); if (r < 1) d = Math.max(d, Math.pow(1 - r * r, .55)); } return d; };
  const sDepth = new Float32Array(sBase.length / 3);
  for (let v = 0; v < sDepth.length; v++) sDepth[v] = depthAt(sBase[v * 3], sBase[v * 3 + 2]);
  const sheet = new THREE.Mesh(sGeo, clearPet); sheet.castShadow = true; thermo.add(sheet);
  // готовые упаковки уходят стопкой
  const packs = [];
  for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(sGeo, clearPet); m.castShadow = true; m.visible = false; thermo.add(m); packs.push(m); }

  // --- литьё под давлением с IML (x = 24)
  const IX = 24;
  const iml = new THREE.Group(); scene.add(iml);
  const halfGeo = new RoundedBoxGeometry(1.25, 2.1, 1.8, 6, .12);
  const halfL = new THREE.Mesh(halfGeo, steel), halfR = new THREE.Mesh(halfGeo, steel);
  [halfL, halfR].forEach(h => { h.castShadow = true; iml.add(h); });
  const plateMat = new THREE.MeshPhysicalMaterial({ color: 0x9fb2c6, metalness: .8, roughness: .3 });
  const plateL = new THREE.Mesh(new RoundedBoxGeometry(.18, 2.4, 2.1, 3, .05), plateMat), plateR = plateL.clone();
  iml.add(plateL, plateR);
  // стакан: белый PP, профиль как у литьевой тары клиента
  const R0 = .62, R1 = .78, CH = 1.32;
  const rAt = y => R0 + (R1 - R0) * (y - .03) / (CH - .03);
  const cupPts = [[0, 0], [R0 - .02, 0], [R0, .02], [R0, .03], [R1, CH], [R1 + .055, CH + .012], [R1 + .06, CH + .05], [R1 + .015, CH + .055], [R1 - .025, CH + .04], [R1 - .03, CH], [R0 - .03, .07], [0, .07]].map(([x, y]) => new THREE.Vector2(x, y));
  const cup = new THREE.Group(); iml.add(cup);
  const cupBody = new THREE.Mesh(new THREE.LatheGeometry(cupPts, 128), new THREE.MeshPhysicalMaterial({ color: 0xf6f7f4, roughness: .4, clearcoat: .3, sheen: .3 }));
  cupBody.castShadow = true; cup.add(cupBody);
  const yA = .14, yB = 1.2;
  const labGeo = new THREE.CylinderGeometry(rAt(yB) + .004, rAt(yA) + .004, yB - yA, 128, 1, true);
  const labMat = () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .25, clearcoat: .9, clearcoatRoughness: .1, transparent: true });
  const labA = new THREE.Mesh(labGeo, labMat()), labB = new THREE.Mesh(labGeo, labMat());
  labA.position.y = labB.position.y = (yA + yB) / 2; labB.scale.setScalar(1.002); labA.renderOrder = 1; labB.renderOrder = 2;
  labB.material.polygonOffset = true; labB.material.polygonOffsetFactor = -2;
  cup.add(labA, labB);
  const lidPts = [[0, .05], [R1 + .05, .04], [R1 + .08, .015], [R1 + .08, -.05], [R1 + .055, -.06], [R1 + .055, -.01], [R1 - .02, 0], [0, .01]].map(([x, y]) => new THREE.Vector2(x, y));
  const lid = new THREE.Mesh(new THREE.LatheGeometry(lidPts, 128), new THREE.MeshPhysicalMaterial({ color: 0x014e9e, roughness: .35, clearcoat: .5 }));
  lid.castShadow = true; cup.add(lid);
  // этикетки: 4 развёртки (картинки из Higgsfield; пока грузятся — однотонная заглушка)
  const texLoader = new THREE.TextureLoader();
  const blank = new THREE.DataTexture(new Uint8Array([246, 247, 244, 255]), 1, 1); blank.needsUpdate = true;
  const labelTex = [0, 1, 2, 3].map(i => {
    const t = texLoader.load(`media/labels/label-${i + 1}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = THREE.RepeatWrapping;
    t.offset.x = .5; return t;
  });
  labA.material.map = labelTex[0]; labB.material.map = labelTex[1];
  // летящая этикетка перед литьём
  const flyTex = texLoader.load('media/labels/label-1.jpg'); flyTex.colorSpace = THREE.SRGBColorSpace; flyTex.anisotropy = 8;
  const flyLab = new THREE.Mesh(new THREE.PlaneGeometry(1.9, .62), new THREE.MeshPhysicalMaterial({ map: flyTex, roughness: .3, clearcoat: .8, side: THREE.DoubleSide, transparent: true }));
  iml.add(flyLab);

  // --- ящики на паллете (x = 32)
  const BX = 32;
  const crates = new THREE.Group(); scene.add(crates);
  const holesC = document.createElement('canvas'); holesC.width = 512; holesC.height = 256;
  { const g = holesC.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#000';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) { const x = 40 + c * 50, y = 70 + r * 50; g.beginPath(); g.roundRect(x, y, 26, 18, 6); g.fill(); } }
  const holesTex = new THREE.CanvasTexture(holesC);
  const crateMat = col => new THREE.MeshPhysicalMaterial({ color: col, roughness: .38, clearcoat: .35, alphaMap: holesTex, alphaTest: .5, side: THREE.DoubleSide });
  function makeCrate(col) {
    const g = new THREE.Group(), W = 1.5, H = .62, D = 1.0, T = .05;
    const m = crateMat(col), solid = new THREE.MeshPhysicalMaterial({ color: col, roughness: .38, clearcoat: .35 });
    const add = (geo, mat, x, y, z) => { const p = new THREE.Mesh(geo, mat); p.position.set(x, y, z); p.castShadow = true; p.receiveShadow = true; g.add(p); };
    add(new RoundedBoxGeometry(W, T, D, 2, .02), solid, 0, T / 2, 0);
    add(new THREE.BoxGeometry(W, H, T), m, 0, H / 2, D / 2 - T / 2); add(new THREE.BoxGeometry(W, H, T), m, 0, H / 2, -D / 2 + T / 2);
    const sideGeo = new THREE.BoxGeometry(D, H, T); sideGeo.rotateY(Math.PI / 2);
    add(sideGeo, m, W / 2 - T / 2, H / 2, 0); add(sideGeo, m, -W / 2 + T / 2, H / 2, 0);
    add(new RoundedBoxGeometry(W + .04, .07, D + .04, 2, .02), solid, 0, H, 0);
    return g;
  }
  const crateList = [makeCrate(0x1d5fbf), makeCrate(0x1d5fbf), makeCrate(0x2f8f4e), makeCrate(0x1d5fbf)];
  crateList.forEach(c => crates.add(c));
  const wood = new THREE.MeshStandardMaterial({ color: 0xd2b48c, roughness: .85 });
  for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(3.3, .06, .34), wood); b.position.set(BX, -1.62, -.92 + k * .46); b.castShadow = true; b.receiveShadow = true; crates.add(b); }
  for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.3, .26, .3), wood); b.position.set(BX - 1.4 + k * 1.4, -1.81, -.85 + j * .85); b.castShadow = true; crates.add(b); }
  const crateSlots = [[BX - .78, -1.59, 0], [BX + .78, -1.59, 0], [BX - .78, -.93, 0], [BX + .78, -.93, 0]];

  const camKeys2 = [
    [0.00, V(8.9, 3.0, 8.0), V(8.85, -.2, 0)],
    [0.08, V(14.6, 3.8, 8.4), V(15.6, -.2, 0)],
    [0.20, V(16, 3.2, 6.8), V(16, -.35, 0)],
    [0.27, V(16.3, 2.6, 6.2), V(16.1, -.1, 0)],
    [0.34, V(23.6, 1.6, 7.8), V(24, .25, 0)],
    [0.50, V(24, 1.5, 8.2), V(24, .45, .6)],
    [0.60, V(24.3, 1.6, 7.6), V(24.2, .5, .8)],
    [0.66, V(31.4, 2.6, 9.2), V(32, -.4, 0)],
    [0.82, V(32.2, 2.2, 8.0), V(32, -.5, 0)],
    [0.92, V(19.6, 6.5, 34), V(19.2, -.3, 0)],
    [1.00, V(19.4, 8, 39), V(19.4, -.6, 0)]
  ];
  function camAt2(Q) {
    let i = 0; while (i < camKeys2.length - 2 && Q > camKeys2[i + 1][0]) i++;
    const [p0, a0, b0] = camKeys2[i], [p1, a1, b1] = camKeys2[i + 1];
    const k = smooth((Q - p0) / (p1 - p0));
    camPos.lerpVectors(a0, a1, k); camTgt.lerpVectors(b0, b1, k);
  }

  const sPos = sGeo.attributes.position;
  let lastDepth = -1;
  function update2(Q, t) {
    // термоформование: нагрев → лист опускается → формуется → готовая упаковка поднимается
    const kHeat = smooth((Q - .06) / .07) * (1 - smooth((Q - .17) / .05));
    coilMat.emissiveIntensity = kHeat * 2.4; glow.intensity = kHeat * 5;
    const kDown = smooth((Q - .12) / .06), kForm = smooth((Q - .16) / .07), kLift = smooth((Q - .24) / .07);
    const d = kForm * .5;
    if (Math.abs(d - lastDepth) > .002) {
      for (let v = 0; v < sDepth.length; v++) sPos.setY(v, sBase[v * 3 + 1] - sDepth[v] * d);
      sPos.needsUpdate = true; sGeo.computeVertexNormals(); lastDepth = d;
    }
    sheet.position.set(TX, lerp(.75, -.47, kDown) + kLift * 1.15, 0);
    sheet.rotation.x = kLift * -.55; sheet.rotation.y = kLift * .25;
    packs.forEach((m, k) => { const kk = smooth((Q - .25 - k * .02) / .05); m.visible = kk > .01 && Q < .4; m.position.set(TX + .2 + k * .06, .02 + k * .09 + (1 - kk) * -.5, -.15 - k * .05); m.rotation.set(-.55, .25, 0); m.scale.setScalar(kk); });
    thermo.visible = Q > .02 || camPos.x > 11;

    // литьё: форма раскрыта → этикетка влетает → форма смыкается → раскрывается → стакан выходит, этикетки меняются, крышка закрывается
    const open1 = 1 - smooth((Q - .38) / .04);          // смыкание
    const open2 = smooth((Q - .44) / .04);              // раскрытие
    const gap = .35 + .9 * Math.max(open1, open2);
    halfL.position.set(IX - .63 - gap / 2, .45, 0); halfR.position.set(IX + .63 + gap / 2, .45, 0);
    plateL.position.set(IX - 1.35 - gap / 2, .45, 0); plateR.position.set(IX + 1.35 + gap / 2, .45, 0);
    const kFly = smooth((Q - .32) / .06);
    flyLab.visible = kFly > .01 && Q < .41;
    flyLab.position.set(lerp(IX - 3.2, IX, kFly), lerp(1.9, .5, kFly) + Math.sin(t * 2) * .03 * (1 - kFly), lerp(1.4, 0, kFly));
    flyLab.rotation.set(lerp(-.4, 0, kFly), lerp(.9, 0, kFly), lerp(.3, 0, kFly));
    flyLab.material.opacity = 1 - smooth((Q - .39) / .02);
    const kOut = smooth((Q - .46) / .05);
    cup.visible = Q > .44;
    cup.position.set(IX, -.2 + kOut * .05, kOut * 1.3);
    cup.scale.setScalar(lerp(.85, 1, kOut));
    const lp = clamp((Q - .5) / .1) * 3.999, li = Math.floor(lp), lf = lp - li;
    labA.material.map = labelTex[li]; labB.material.map = labelTex[Math.min(3, li + 1)];
    labB.material.opacity = smooth((lf - .7) / .3) * (li < 3 ? 1 : 0);
    cup.rotation.y = -.5 + Q * 9 + Math.sin(t * .5) * .05;
    const kLid = smooth((Q - .58) / .05);
    lid.position.y = CH + .055 + (1 - kLid) * 1.1; lid.rotation.x = (1 - kLid) * .25; lid.visible = kOut > .5;

    // ящики падают на паллету по одному
    crateList.forEach((c, k) => {
      const kk = smooth((Q - .63 - k * .045) / .06), [x, y, z] = crateSlots[k];
      c.position.set(x, y + (1 - kk) * 3.2, z); c.rotation.set(0, (1 - kk) * .6 * (k % 2 ? 1 : -1), (1 - kk) * .25);
      c.visible = kk > .005;
    });
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
    const SP = clamp(ZP.storyP || 0), P = clamp(SP / .5), Q = clamp((SP - .5) / .5);

    // адаптивное качество
    if (frames++ < 90) { if (dt > .022) slow++; if (frames === 90 && slow > 45 && dpr > 1) { dpr = 1; renderer.setPixelRatio(1); size(); } }

    if (SP <= .5) camAt(P); else camAt2(Q);
    ptr.sx = lerp(ptr.sx, ptr.active ? ptr.x : 0, .05); ptr.sy = lerp(ptr.sy, ptr.active ? ptr.y : 0, .05);
    cam.position.set(camPos.x + ptr.sx * .35, camPos.y + ptr.sy * .22, camPos.z);
    cam.lookAt(camTgt);
    // ключевой свет и его тени ходят за камерой
    key.target.position.set(camTgt.x, -1, 0); key.position.set(camTgt.x - 4, 8, 6); key.target.updateMatrixWorld();

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

    update2(Q, t);
    renderer.render(scene, cam);
  });
  story.classList.add('has3d');
})();
