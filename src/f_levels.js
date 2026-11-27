
// =====================================================================
//  LEVEL SYSTEM  (序章 basement → 第一章 wall hub → kitchen)
// =====================================================================
let LEVEL = 'basement', LVL = null, loadingNext = false, lvT = 0;
const LEVELS = {};
function inScene(o) { while (o) { if (o === scene) return true; o = o.parent; } return false; }
function clearLevel() {
  for (const g of [LV, LVFX]) { g.traverse(c => { if (c.geometry) c.geometry.dispose(); }); g.parent && g.parent.remove(g); }
  COOKIE = null; cols.length = 0; resizables.length = 0; batteries.length = 0; beams.length = 0; VIALS.length = 0; CRUMBS.length = 0; TOY.box = null; TOY.fetch = null; TOY.fetchQ = []; for (const k in STATIC) delete STATIC[k];
  LV = new THREE.Group(); scene.add(LV); LVFX = new THREE.Group(); fxGroup.add(LVFX);
  for (let i = furMeshes.length - 1; i >= 0; i--) if (!inScene(furMeshes[i])) furMeshes.splice(i, 1);
  dust = null;
}
function padBeams() { while (beams.length < 4) beams.push({ m: null, o: V3(0, -999, 0), d: V3(0, -1, 0), ca: 1, len: 1, c: new THREE.Color(0), k: 0 }); }
function addBeam(color, from, to, ang, k) { const len = from.distanceTo(to); const m = beamMesh(color, len, ang, k); aimBeam(m, from, to); beams.push({ m, o: from.clone(), d: V3().subVectors(to, from).normalize(), ca: Math.cos(ang * 1.15), len, c: new THREE.Color(color), k: 1 }); return m; }
function spotL(color, I, from, to, ang, pen, shadow, near = 5, far = 900) {
  const l = new THREE.SpotLight(color, I, 0, ang, pen, 2); l.position.copy(from); l.target.position.copy(to); LV.add(l, l.target);
  if (shadow) { l.castShadow = true; l.shadow.mapSize.setScalar(TOUCH ? 512 : shadow); l.shadow.camera.near = near; l.shadow.camera.far = far; l.shadow.bias = -0.0004; l.shadow.normalBias = .04; }
  return l;
}
function pointL(color, I, x, y, z) { const l = new THREE.PointLight(color, I, 0, 2); l.position.set(x, y, z); LV.add(l); return l; }
function mesh(g, mat, x, y, z, o = {}) { const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = o.cast !== false; m.receiveShadow = true; (o.parent || LV).add(m); return m; }
function tubeM(pts, r, mat, seg = 60) { const c = new THREE.CatmullRomCurve3(pts.map(p => V3(...p))); return mesh(new THREE.TubeGeometry(c, seg, r, 10), mat, 0, 0, 0); }

// ---------- chapter card ----------
// Starting a game somewhere (title → chapter, or joining an online room). The whole world is already
// built at start-up, so this only places everyone; moving between places later never comes back here.
async function loadLevel(name, opt) {
  titleEnd();
  window.__loads = (window.__loads || 0) + 1; if (NET.on && NET.host) nsend({ t: 'lvl', n: name });
  STATE = 'loading'; const D = LEVELS[name]; pouchRefill();   // (a full pouch for every chapter)
  $('lvlA').textContent = opt && opt.chapter || D.chapter; $('lvlB').textContent = opt && opt.title || D.title; $('lvl').hidden = false; requestAnimationFrame(() => $('lvl').classList.add('on'));
  $('end').hidden = true; $('dead').classList.remove('on');
  await new Promise(r => setTimeout(r, 700));
  if (!WORLD) await buildWorld();
  loadingNext = false; enterZone(name, true); LP.snap = true; meter = 0; trail = []; grade.uniforms.uCrys.value = 0;
  stkClear(); toyUnfreezeAll(); D.spawn(); if (opt && opt.after) opt.after(); netAfterSpawn();
  for (const C of party) { C.lastTrail = C.pos.clone(); C.disp = C.pos.clone(); C.queue = []; C.vel.set(0, 0, 0); C.climbing = false; C.mantle = null; C.tumble = 0; C.grounded = true; C.offK = 0; }
  assignGaps(); cam.tgt.set(leader.pos.x, leader.pos.y + leader.h * .8, leader.pos.z); cam.curD = cam.dist;
  for (const id in chars) animChar(chars[id], .016);
  buildPartyHUD(); lvT = 0; STATE = 'play'; $('hud').classList.remove('off', 'cine'); if (TOUCH) $('touch').hidden = false;
  await new Promise(r => setTimeout(r, 700)); $('lvl').classList.remove('on'); setTimeout(() => { $('lvl').hidden = true; }, 900);
}
function assignGaps() { const fol = party.filter(F => F !== leader && !F.frozen); const G = [7, 13.5, 20], S = [-3.4, 4, -7]; fol.forEach((F, i) => { F.gap = G[i] || 20; F.side = S[i] || 0; }); }
function joinGecko() {
  const K = chars.gecko; if (party.includes(K)) return; party.push(K); K.lastTrail = K.pos.clone(); K.disp = K.pos.clone(); K.queue = []; K.wave = false; K.state = 'idle'; K.stamina = 100;
  assignGaps(); buildPartyHUD();
}
function scheduleLines(list, dt = 1 / 60) { for (const L of list) if (lvT - dt < L[0] && lvT >= L[0]) { if (typeof L[1] === 'function') L[1](); else say(L[1], L[2], L[3], L[4] || 3.2); } }

// ---------- noise (distractions) ----------
function noise(p, loud, clang) {
  noiseRing(p); if (NET.on && NET.host) nsend({ t: 'ring', p: [p.x, p.y, p.z], v: clang || 0 });
  if (NET.client) return; const Z = WORLD ? zoneAt(p, 4) : null;
  pestHear(p, loud); if (backQuiet(p)) return;   // (the storeroom: nobody hears it — bar the pest man, if he's in there)
  if (!Z || Z.id === 'kitchen') { momHear(p, loud); catHear(p, loud); kidHear(p); }
  else if (LEVELS[Z.id].hear) LEVELS[Z.id].hear(p, loud);
}
function noiseRing(p) {
  const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.6, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf4bb72).multiplyScalar(2), transparent: true, opacity: .8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, p.y + .3, p.z); ring.userData.t = 0; LVFX.add(ring); NOISERINGS.push(ring);
}
const NOISERINGS = [];
function updRings(dt) { for (let i = NOISERINGS.length - 1; i >= 0; i--) { const r = NOISERINGS[i]; r.userData.t += dt; const t = r.userData.t; r.scale.setScalar(1 + t * 60); r.material.opacity = Math.max(0, .8 - t * 1.1); if (t > .75) { r.parent && r.parent.remove(r); r.geometry.dispose(); NOISERINGS.splice(i, 1); } } }
let _pfI = 0;
function updPushFall(dt) {
  // (things resting where they are only get looked at a few per frame; anything that has just moved, changed size or is falling, every frame)
  const N = resizables.length, rr = new Set(); for (let k = 0; k < Math.min(N, 14); k++) rr.add((_pfI + k) % N); _pfI = (_pfI + 14) % Math.max(1, N);
  for (let ri = 0; ri < N; ri++) { const r = resizables[ri];
    if (!r.c.push) continue; if (!r.vy && !(r.wakeT > T) && !rr.has(ri)) continue;
    const [sup] = supportAt(r.cx, r.cz, .4, r.y0 + .25);   // (a thing sunk a hair into its shelf is still standing on it)
    if (sup < r.y0 - .15 || r.vy) {
      r.vy = (r.vy || 0) - 620 * dt; r.y0 += r.vy * dt;
      if (r.y0 <= sup) { const imp = -r.vy; r.y0 = sup; r.vy = 0; if (imp > 80) { noise(V3(r.cx, sup, r.cz), clamp(imp / 260, .4, 1), clamp(imp / 300, .3, 1)); SND.clang(clamp(imp / 300, .3, 1)); for (let i = 0; i < 16; i++) emit(V3(r.cx, sup + 1, r.cz), V3(R(-30, 30), R(10, 40), R(-30, 30)), new THREE.Color(.5, .45, .4), R(.3, .8), R(.4, .9), 300, 1); if (r.name) toastW(`「${r.name}」掉到地上——發出了好大的聲音！`); } }
      applyResize(r);
    }
  }
}

// ---------- texture generators for the new places ----------
function genPlaster(col, sd) { const W = 512, n = noiseField(W, W, 5, 4, sd), n2 = noiseField(W, W, 3, 32, sd + 1); const b = hex(col); const h = new Float32Array(W * W); const c = fromFn(W, W, (x, y, i, o) => { const v = .93 + (n[i] - .5) * .1 + (n2[i] - .5) * .05; o[0] = b[0] * v; o[1] = b[1] * v; o[2] = b[2] * v; h[i] = n2[i]; }); return { map: tex(c), normalMap: normalTex(h, W, W, .8) }; }
function genTiles() {
  const W = 512, h = new Float32Array(W * W), ro = new Float32Array(W * W); const n = noiseField(W, W, 3, 8, 301);
  const c = fromFn(W, W, (x, y, i, o) => { const row = Math.floor(y / 64), xo = (x + (row % 2) * 64) % W; const lx = xo % 128, ly = y % 64; const e = Math.min(lx, ly, 128 - lx, 64 - ly); const g = e < 3; const bev = sstep(2, 9, e); const v = g ? .62 : .93 + (n[i] - .5) * .05; o[0] = v * 244; o[1] = v * 242; o[2] = v * 236; h[i] = g ? 0 : .3 + bev * .7; ro[i] = g ? .9 : .08 + (1 - bev) * .2; });
  return { map: tex(c), normalMap: normalTex(h, W, W, 2.5), roughnessMap: grayTex(ro, W, W) };
}
function genQuartz() { const W = 1024, n = noiseField(W, W, 5, 4, 311), n2 = noiseField(W, W, 2, 64, 312); const c = fromFn(W, W, (x, y, i, o) => { const sp = hashI(i * 7 + 3); let v = .92 + (n[i] - .5) * .06; if (sp > .992) v -= .35; else if (sp > .97) v -= .1; const vein = Math.abs(Math.sin((x + n[i] * 300) * .012 + y * .004)) < .02 ? .1 : 0; v -= vein; o[0] = v * 240; o[1] = v * 238; o[2] = v * 233; }); return tex(c); }
function genBrushed() { const W = 512; const n = noiseField(W, W, 3, 4, 321); const c = fromFn(W, W, (x, y, i, o) => { const s = hashI(y * 131 + 7) * .12 + hashI((y >> 1) * 17) * .06; const v = .74 + s + (n[i] - .5) * .05; o[0] = v * 210; o[1] = v * 214; o[2] = v * 218; }); return tex(c); }
function genHomework() {
  const W = 768, H = 1024; const [c, x] = cnv(W, H); x.fillStyle = '#f7f4ec'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(90,130,200,.35)'; x.lineWidth = 2; for (let y = 90; y < H; y += 46) { x.beginPath(); x.moveTo(30, y); x.lineTo(W - 30, y); x.stroke(); }
  x.fillStyle = 'rgba(40,40,60,.85)'; x.font = `700 40px ${HAND}`; x.fillText('數學練習 · 第 12 頁', 50, 70);
  x.font = `500 36px ${HAND}`; ['3 × 7 = 21', '8 × 6 = 48', '9 × 4 = 36', '7 × 7 = 4'].forEach((t, i) => x.fillText(t, 60, 130 + i * 46));
  x.strokeStyle = 'rgba(220,40,50,.8)'; x.lineWidth = 4; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(330, 112 + i * 46); x.lineTo(345, 126 + i * 46); x.lineTo(372, 96 + i * 46); x.stroke(); }
  x.lineCap = 'round';
  const circ = (cx, cy, r, col, w) => { const p = []; for (let a = 0; a <= 6.4; a += .3) p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); crayon(x, p, col, w); };
  circ(250, 560, 40, '#444', 6); crayon(x, [[210, 610], [290, 610], [300, 760], [200, 760], [210, 610]], '#8aa0c8', 7); circ(236, 556, 9, '#444', 3); circ(264, 556, 9, '#444', 3);
  circ(470, 600, 30, '#444', 6); crayon(x, [[470, 632], [430, 740], [510, 740], [470, 632]], '#e0507a', 8);
  for (const [hx, hy] of [[360, 520], [600, 520]]) crayon(x, [[hx, hy + 12], [hx - 14, hy - 4], [hx - 5, hy - 14], [hx, hy - 5], [hx + 5, hy - 14], [hx + 14, hy - 4], [hx, hy + 12]], '#e04a5a', 5);
  x.font = `700 64px ${HAND}`; x.fillStyle = 'rgba(220,70,90,.85)'; x.fillText('爸爸快回家', 170, 880);
  return tex(c);
}
function genPoster() {
  const W = 512, H = 700; const [c, x] = cnv(W, H); x.fillStyle = '#f5f2ea'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#c4202a'; x.font = '900 120px "Noto Sans TC",sans-serif'; x.textAlign = 'center'; x.fillText('尋人', W / 2, 140);
  x.fillStyle = '#c9c4ba'; x.fillRect(136, 180, 240, 280); x.fillStyle = '#7d776c'; x.beginPath(); x.arc(256, 280, 60, 0, 7); x.fill(); x.beginPath(); x.ellipse(256, 450, 100, 80, 0, Math.PI, 0); x.fill();
  x.strokeStyle = '#3a3a3a'; x.lineWidth = 6; x.beginPath(); x.arc(232, 278, 16, 0, 7); x.stroke(); x.beginPath(); x.arc(280, 278, 16, 0, 7); x.stroke();
  x.fillStyle = '#222'; x.font = '700 40px "Noto Sans TC"'; x.fillText('陳教授', W / 2, 520); x.font = '500 26px "Noto Sans TC"'; x.fillText('45 歲 · 最後出現：家中地庫', W / 2, 562); x.fillText('如有消息，請致電家人', W / 2, 600);
  x.fillStyle = 'rgba(0,0,0,.6)'; for (let i = 0; i < 8; i++) x.fillRect(40 + i * 56, 630, 40, 56);
  return tex(c);
}
function genKidArt() {
  const W = 512, H = 400; const [c, x] = cnv(W, H); x.fillStyle = '#fffdf6'; x.fillRect(0, 0, W, H); x.lineCap = 'round';
  crayon(x, [[90, 300], [90, 170], [256, 70], [420, 170], [420, 300], [90, 300]], '#c0503a', 9); crayon(x, [[230, 300], [230, 220], [280, 220], [280, 300]], '#6a4a2a', 7);
  for (const [px, col] of [[150, '#333'], [200, '#e0507a'], [330, '#7a8fb8']]) { crayon(x, [[px, 360], [px, 320]], col, 6); const p = []; for (let a = 0; a <= 6.4; a += .4) p.push([px + Math.cos(a) * 16, 300 + Math.sin(a) * 16]); crayon(x, p, '#333', 5); }
  x.font = `700 48px ${HAND}`; x.fillStyle = 'rgba(60,90,200,.85)'; x.fillText('我們的家', 150, 60);
  return tex(c);
}
function genDusk() {
  if (DAY) {
    const W = 1024, H = 512; const [c, x] = cnv(W, H);
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#4f8fd8'); g.addColorStop(.45, '#94c0ea'); g.addColorStop(.7, '#d8e8f2'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (const [cx, cy, s] of [[180, 70, 1.2], [620, 50, 1], [880, 110, .8]]) for (let i = 0; i < 8; i++) { const r = (22 + i * 4) * s, h = x.createRadialGradient(cx + i * 18 * s, cy - (i % 3) * 8 * s, 2, cx + i * 18 * s, cy, r); h.addColorStop(0, 'rgba(255,255,255,.92)'); h.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = h; x.fillRect(0, 0, W, H); }
    // a tree line behind the houses
    for (let i = 0; i < 40; i++) { const px = R(0, W), r = R(30, 60); x.fillStyle = `rgb(${R(50, 80) | 0},${R(100, 130) | 0},${R(40, 60) | 0})`; x.beginPath(); x.arc(px, H - 210 - R(0, 30), r, 0, Math.PI * 2); x.fill(); }
    const house = (hx, w, hh, roof, wall, rf) => { x.fillStyle = wall; x.fillRect(hx, H - hh, w, hh); x.fillStyle = rf; x.beginPath(); x.moveTo(hx - 14, H - hh); x.lineTo(hx + w / 2, H - hh - roof); x.lineTo(hx + w + 14, H - hh); x.fill();
      x.fillStyle = 'rgba(0,0,0,.08)'; for (let y = H - hh + 8; y < H; y += 10) x.fillRect(hx, y, w, 2); };
    house(60, 300, 170, 90, '#e8dcc4', '#5a4a44'); house(520, 340, 200, 110, '#c8d4dc', '#4a5058'); house(900, 200, 150, 70, '#e4c8b0', '#6a4a3c');
    for (const [wx, wy] of [[110, 400], [250, 400], [580, 360], [720, 360], [580, 430], [940, 420]]) { x.fillStyle = '#f6f4ee'; x.fillRect(wx - 4, wy - 4, 52, 44); const wg = x.createLinearGradient(wx, wy, wx + 44, wy + 36); wg.addColorStop(0, '#7aa4c8'); wg.addColorStop(1, '#c4dcec'); x.fillStyle = wg; x.fillRect(wx, wy, 44, 36); }
    x.fillStyle = '#6a9a44'; x.fillRect(0, H - 40, W, 40);
    x.fillStyle = '#f2efe6'; for (let i = 0; i < W; i += 18) x.fillRect(i, H - 60, 8, 60); x.fillRect(0, H - 50, W, 8);
    return tex(c);
  }
  const W = 1024, H = 512; const [c, x] = cnv(W, H);
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1b2a55'); g.addColorStop(.55, '#4a4f86'); g.addColorStop(.78, '#d98a6a'); g.addColorStop(1, '#f2b77a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 30; i++) { x.fillStyle = `rgba(255,255,255,${R(.2, .7)})`; x.fillRect(R(0, W), R(0, H * .35), 2, 2); }
  x.fillStyle = '#141522';
  const house = (hx, w, hh, roof) => { x.beginPath(); x.moveTo(hx, H); x.lineTo(hx, H - hh); x.lineTo(hx + w / 2, H - hh - roof); x.lineTo(hx + w, H - hh); x.lineTo(hx + w, H); x.fill(); };
  house(60, 300, 170, 90); house(520, 340, 200, 110); house(900, 200, 150, 70);
  x.fillStyle = 'rgba(255,196,110,.95)'; for (const [wx, wy] of [[110, 400], [250, 400], [580, 360], [720, 360], [580, 430], [940, 420]]) { x.fillRect(wx, wy, 44, 36); }
  x.fillStyle = '#0d0e18'; for (let i = 0; i < W; i += 18) x.fillRect(i, H - 60, 8, 60); x.fillRect(0, H - 50, W, 8);
  return tex(c);
}
function genMouseHole() {
  const W = 256; const [c, x] = cnv(W, W); x.clearRect(0, 0, W, W);
  x.strokeStyle = 'rgba(40,30,22,.9)'; x.lineWidth = 9; x.beginPath(); x.moveTo(78, 256); x.lineTo(78, 170); x.quadraticCurveTo(80, 104, 128, 102); x.quadraticCurveTo(176, 104, 178, 170); x.lineTo(178, 256); x.stroke();
  x.strokeStyle = 'rgba(40,30,22,.5)'; x.lineWidth = 2; for (let i = 0; i < 14; i++) { const a = R(-.3, 3.4); const r0 = 56, r1 = R(66, 84); x.beginPath(); x.moveTo(128 + Math.cos(a) * r0, 170 - Math.sin(a) * r0); x.lineTo(128 + Math.cos(a) * r1, 170 - Math.sin(a) * r1); x.stroke(); }
  return tex(c);
}
function genMural() {
  const W = 2048, H = 512; const [c, x] = cnv(W, H); x.clearRect(0, 0, W, H); x.lineCap = 'round'; x.lineJoin = 'round';
  const chalk = (pts, w = 5, a = .8) => { for (let k = 0; k < 3; k++) { x.strokeStyle = `rgba(245,236,220,${a * R(.4, .7)})`; x.lineWidth = w * R(.6, 1.1); x.beginPath(); pts.forEach((p, i) => { const px = p[0] + R(-2, 2), py = p[1] + R(-2, 2); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke(); } };
  const circle = (cx, cy, r, w) => { const p = []; for (let a = 0; a <= 6.4; a += .2) p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); chalk(p, w); };
  // 1. the ring machine flashing
  circle(170, 230, 110, 7); circle(170, 230, 80, 4); for (let a = 0; a < 6.3; a += .5) chalk([[170 + Math.cos(a) * 125, 230 + Math.sin(a) * 125], [170 + Math.cos(a) * 170, 230 + Math.sin(a) * 170]], 4);
  // 2. a person shrinking (big → small)
  for (const [px, s] of [[420, 1], [540, .6], [620, .32]]) { circle(px, 380 - 150 * s, 22 * s, 4); chalk([[px, 400 - 128 * s], [px, 400 - 40 * s], [px - 22 * s, 400]], 4); chalk([[px, 400 - 40 * s], [px + 22 * s, 400]], 4); chalk([[px - 30 * s, 400 - 100 * s], [px + 30 * s, 400 - 100 * s]], 4); }
  chalk([[390, 120], [650, 120]], 3); chalk([[630, 108], [650, 120], [630, 132]], 3);
  // 3. men in suits with the OD logo
  for (const px of [760, 860, 960]) { circle(px, 210, 26, 4); chalk([[px - 34, 250], [px - 40, 420], [px + 40, 420], [px + 34, 250], [px - 34, 250]], 5); chalk([[px, 250], [px, 330]], 3); }
  circle(860, 110, 34, 5); circle(860, 110, 16, 3);
  // 4. the house cross-section: family upstairs, tiny figure in the wall
  chalk([[1080, 440], [1080, 200], [1260, 80], [1440, 200], [1440, 440], [1080, 440]], 6); chalk([[1080, 320], [1440, 320]], 4);
  for (const [px, s] of [[1180, .9], [1260, .6], [1340, 1]]) { circle(px, 250 - 30 * s, 12 * s, 3); chalk([[px, 262 - 30 * s + 12], [px, 318]], 3); }
  chalk([[1420, 330], [1420, 440]], 3); circle(1420, 420, 6, 3); chalk([[1428, 380], [1460, 330]], 2);
  // 5. tally marks: three years
  for (let g = 0; g < 26; g++) { const gx = 1520 + (g % 13) * 38, gy = 140 + Math.floor(g / 13) * 160; for (let k = 0; k < 4; k++) chalk([[gx + k * 7, gy], [gx + k * 7 + 2, gy + 90]], 3); chalk([[gx - 6, gy + 70], [gx + 32, gy + 20]], 3); }
  return tex(c);
}
function genDrywall() { const W = 512; const n = noiseField(W, W, 4, 8, 331); const c = fromFn(W, W, (x, y, i, o) => { const v = .82 + (n[i] - .5) * .15; o[0] = 168 * v; o[1] = 138 * v; o[2] = 100 * v; }); const x = c.getContext('2d'); x.fillStyle = 'rgba(40,30,20,.35)'; x.font = '600 26px Fredoka,sans-serif'; x.fillText('GYPSUM BOARD · 12.7 mm · FIRE-RATED', 30, 260); x.fillStyle = 'rgba(60,60,60,.7)'; for (let yy = 40; yy < W; yy += 120) { x.beginPath(); x.arc(30, yy, 5, 0, 7); x.fill(); x.beginPath(); x.arc(W - 30, yy, 5, 0, 7); x.fill(); } return tex(c); }
function genCarton(main, sub, col) { const W = 256, H = 512; const [c, x] = cnv(W, H); x.fillStyle = '#f7f6f2'; x.fillRect(0, 0, W, H); x.fillStyle = col; x.fillRect(0, 200, W, 140); x.fillStyle = '#fff'; x.font = '900 64px "Noto Sans TC"'; x.textAlign = 'center'; x.fillText(main, W / 2, 290); x.fillStyle = col; x.font = '700 30px Fredoka'; x.fillText(sub, W / 2, 400); return tex(c); }
function genCereal() { const W = 256, H = 384; const [c, x] = cnv(W, H); const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f2b22e'); g.addColorStop(1, '#e0702a'); x.fillStyle = g; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; x.font = '900 46px "Noto Sans TC"'; x.textAlign = 'center'; x.fillText('穀物脆片', W / 2, 90); x.fillStyle = '#7a3a12'; for (let i = 0; i < 26; i++) { x.beginPath(); x.arc(R(40, 216), R(160, 330), R(8, 16), 0, 7); x.fill(); } return tex(c); }

let KMAT = null;
function kitchenMats() {
  if (KMAT) return KMAT;
  const pl = genPlaster(0xe9e0cf, 341), tl = genTiles(), oak = genWood([178, 132, 94], [104, 74, 50], 351, 8);
  const brushed = genBrushed();
  KMAT = {
    floor: new THREE.MeshStandardMaterial({ ...oak, roughness: .5, normalScale: new THREE.Vector2(.5, .5) }),
    wall: new THREE.MeshStandardMaterial({ ...pl, roughness: .92 }),
    ceil: new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: .95 }),
    tiles: new THREE.MeshPhysicalMaterial({ ...tl, roughness: .2, clearcoat: .6, clearcoatRoughness: .1 }),
    quartz: new THREE.MeshPhysicalMaterial({ map: genQuartz(), roughness: .22, clearcoat: .4 }),
    cab: new THREE.MeshStandardMaterial({ color: 0x8ea28a, roughness: .55, metalness: 0 }),
    kick: new THREE.MeshStandardMaterial({ color: 0x3b4238, roughness: .8 }),
    steel: new THREE.MeshStandardMaterial({ map: brushed, color: 0xd8dde2, metalness: .95, roughness: .3 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc9a050, metalness: 1, roughness: .28 }),
    glassBlack: new THREE.MeshPhysicalMaterial({ color: 0x0b0c0e, roughness: .06, clearcoat: 1, metalness: .2 }),
    fridgeIn: new THREE.MeshPhysicalMaterial({ color: 0xf2f4f6, roughness: .35, clearcoat: .3 }),
    shelfGlass: new THREE.MeshPhysicalMaterial({ color: 0xdff2f6, roughness: .05, transparent: true, opacity: .32, depthWrite: false }),
    plastic: new THREE.MeshPhysicalMaterial({ color: 0xe8f4f8, roughness: .2, transparent: true, opacity: .45, depthWrite: false }),
    water: new THREE.MeshPhysicalMaterial({ color: 0xbfe0ee, roughness: .04, transparent: true, opacity: .55, clearcoat: 1, depthWrite: false }),
    hot: new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff3a10, emissiveIntensity: 2.2 }),
    ring: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: .4, metalness: .3 }),
    ovenGlow: new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff8a3a, emissiveIntensity: 1.4 }),
    bulb: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd9a0, emissiveIntensity: 7 }),
    shade: new THREE.MeshStandardMaterial({ color: 0x1d2224, metalness: .7, roughness: .35, side: THREE.DoubleSide }),
    wood: new THREE.MeshStandardMaterial({ ...genWood([172, 120, 78], [96, 64, 40], 361), roughness: .45 }),
    homework: new THREE.MeshStandardMaterial({ map: genHomework(), roughness: .9 }),
    poster: new THREE.MeshStandardMaterial({ map: genPoster(), roughness: .8 }),
    kidArt: new THREE.MeshStandardMaterial({ map: genKidArt(), roughness: .9 }),
    dusk: new THREE.MeshBasicMaterial({ map: genDusk(), color: DAY ? new THREE.Color(0xffffff).multiplyScalar(1.2) : 0xbbbbcc }),
    hole: new THREE.MeshBasicMaterial({ map: genMouseHole(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    milk: new THREE.MeshStandardMaterial({ map: genCarton('鮮奶', 'FRESH MILK', '#2b5fb0'), roughness: .6 }),
    juice: new THREE.MeshStandardMaterial({ map: genCarton('橙汁', 'ORANGE', '#e07a1a'), roughness: .6 }),
    cereal: new THREE.MeshStandardMaterial({ map: genCereal(), roughness: .7 }),
    pulp: new THREE.MeshStandardMaterial({ color: 0xb9b2a5, roughness: 1 }),
    egg: new THREE.MeshPhysicalMaterial({ color: 0xf1e6d6, roughness: .5, sheen: .4 }),
    apple: new THREE.MeshPhysicalMaterial({ color: 0xb8231c, roughness: .25, clearcoat: .8 }),
    lettuce: new THREE.MeshPhysicalMaterial({ color: 0x7fb045, roughness: .6, sheen: .4 }),
    carrot: new THREE.MeshStandardMaterial({ color: 0xe0772a, roughness: .6 }),
    jarRed: new THREE.MeshStandardMaterial({ color: 0x9a2a1a, roughness: .7 }),
    cushion: new THREE.MeshPhysicalMaterial({ color: 0x5a6e8c, roughness: .95, sheen: .8, sheenColor: 0xaac0e0 }),
    milkGlass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .3, transmission: .2 }),
    cookie: new THREE.MeshStandardMaterial({ color: 0xc8904a, roughness: .9 }),
    pencilCase: new THREE.MeshPhysicalMaterial({ color: 0xd65a8a, roughness: .8, sheen: .6, emissive: 0x000000 }),
    can: new THREE.MeshStandardMaterial({ map: genCarton('番茄湯', 'TOMATO SOUP', '#c0281e'), metalness: .3, roughness: .4, emissive: 0x000000 }),
    jar: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .05, transparent: true, opacity: .4, emissive: 0x000000, depthWrite: false }),
    core: new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x7ff6ee, emissiveIntensity: 3.2 }),
    drywall: new THREE.MeshStandardMaterial({ map: genDrywall(), roughness: .95 }),
    mural: new THREE.MeshBasicMaterial({ map: genMural(), transparent: true, depthWrite: false, opacity: .9, color: 0xd8cfc0 }),
    stud: new THREE.MeshStandardMaterial({ ...genWood([200, 160, 112], [140, 104, 70], 371), roughness: .8 })
  };
  return KMAT;
}

// =====================================================================
//  WALL HUB — 前拍檔的家
// =====================================================================
function buildHub() {
  const K = kitchenMats(), M = MAT;
  box(-130, 88, -10, 4, -40, 40, M.floor, { uv: 100, cast: false });
  box(-130, 88, 0, 340, -44, -28, M.wall, { uv: 120 });
  box(-130, 88, 0, 340, 28, 40, K.drywall, { uv: 90 });
  // the far stud has the hole from the basement tunnel in it
  box(-88, -80, 0, 340, -28, 28, K.stud, { uv: 60 }); box(80, 88, 0, 340, -28, 11, K.stud, { uv: 60 }); box(80, 88, 0, 340, 19, 28, K.stud, { uv: 60 }); box(80, 88, 13, 340, 11, 19, K.stud, { uv: 60 });
  box(79.6, 80, 13, 14.2, 10.4, 19.6, K.stud, { col: false });
  box(-80, 80, 0, 4, -28, 28, K.stud, { uv: 60 });
  // ledges along the concrete side (rest stops), alternating sides
  for (const [y, x0, x1] of [[70, -80, -22], [130, 22, 80], [190, -80, -22], [250, 22, 80]]) box(x0, x1, y - 4, y, -28, -10, K.stud, { uv: 60 });
  box(-80, 0, 330, 340, -28, 28, K.stud); box(40, 80, 330, 340, -28, 28, K.stud); box(0, 40, 330, 340, -28, -18, K.stud); box(0, 40, 330, 340, 6, 28, K.stud);
  // the last ledge reaches out under the gap; from it, climb the board on the gap's edge up into the crawlspace
  box(0, 40, 306, 310, -28, -4, K.stud, { uv: 60 }); box(0, 2.5, 310, 340, -17, -3, K.stud, { uv: 30 });
  // kitchen gap at the top (warm light leaking in)
  const glow = mesh(new THREE.PlaneGeometry(40, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc890).multiplyScalar(1.6) }), 20, 353, -6, { cast: false }); glow.rotation.x = Math.PI / 2; STATIC.hubGlow = glow;
  // copper pipe running up through the gap: grab it from the top ledge and climb out
  cyl(40, 23, 2.6, 4, 330, M.copper, { seg: 20 });
  tubeM([[-60, 4, 20], [-58, 120, 22], [-62, 240, 20], [-60, 330, 21]], .7, M.rubber); tubeM([[-50, 4, 22], [-46, 160, 24], [-52, 330, 23]], .55, M.paintRed);
  // pink insulation (fluffy fur)
  const ins = furMat({ color: 0xf2a0b4, len: .9, den: 1.6, droop: .2, clump: .55, rimK: .1, root: .7, rough: 1 });
  const ig = new THREE.SphereGeometry(1, 40, 24); ig.scale(30, 24, 16); const im = furMesh(ig, ins); im.position.set(56, 14, -10); LV.add(im);
  const ig2 = new THREE.SphereGeometry(1, 32, 20); ig2.scale(18, 16, 12); const im2 = furMesh(ig2, ins); im2.position.set(64, 34, -14); LV.add(im2);
  cols.push({ t: 'b', x0: 29, x1: 83, y0: 0, y1: 22, z0: -25, z1: 4, m: im }, { t: 'b', x0: 37, x1: 79, y0: 22, y1: 34, z0: -24, z1: 2, m: im }, { t: 'b', x0: 50, x1: 78, y0: 34, y1: 46, z0: -23, z1: -5, m: im2 });
  // mural on the drywall (her three years)
  const mur = mesh(new THREE.PlaneGeometry(170, 42.5), K.mural, 0, 30, 27.8, { cast: false }); mur.rotation.y = Math.PI;
  // camp: matchbox beds, bottle-cap table, thimble cups, LED lamp
  const mb = MAT.match;
  box(-72, -66.5, 4, 5.6, -10, 0, mb, { uv: 0 }); box(-72, -66.5, 4, 5.6, 4, 14, mb, { uv: 0 });
  const blanket = new THREE.MeshPhysicalMaterial({ color: 0x8a3a3a, roughness: .9, sheen: .8 }); box(-71.5, -67, 5.6, 6.1, -9, -2, blanket, { col: false }); box(-71.5, -67, 5.6, 6.1, 5, 12, new THREE.MeshPhysicalMaterial({ color: 0x3a5a8a, roughness: .9, sheen: .8 }), { col: false });
  cyl(-40, 6, 3.2, 4, 5.2, MAT.capRed, { seg: 21 }); cyl(-40, 6, 2.9, 5.2, 5.3, MAT.white, { col: false });
  for (const [x, z] of [[-43, 10], [-37, 3]]) cyl(x, z, .7, 5.3, 6.4, MAT.steel, { col: false, open: false, seg: 12 });
  cyl(-28, -8, 1.3, 4, 4.6, MAT.steel, { seg: 20 }); const led = mesh(new THREE.SphereGeometry(.5, 12, 10), K.bulb, -28, 5.2, -8, { cast: false }); led.scale.y = 1.3;
  pointL(0xffb070, 110, -28, 14, -6); pointL(0xffc890, 2600, 0, 170, 14); pointL(0xffb070, 1400, -10, 60, 18);
  box(-20, -14, 4, 4.4, -16, -6, MAT.cardB, { col: false }); // cracker mat
  const needle = mesh(new THREE.CylinderGeometry(.12, .02, 18, 6), MAT.steel, -76, 12, -24); needle.rotation.z = .25;
  const stamp = mesh(new THREE.PlaneGeometry(6, 7), MAT.photo, -79.7, 14, -14, { cast: false }); stamp.rotation.y = Math.PI / 2;
  // lights
  LV.add(new THREE.HemisphereLight(0x6a5a4c, 0x2a1e16, 1.0));
  { const s = spotL(0xffc890, 1700, V3(20, 352, -6), V3(0, 0, -4), .45, .6, 1024, 6, 600); s.decay = 1.3; }   // (a gentler falloff: still warm on the floor, no longer blinding on the top ledge)
  addBeam(0xffc890, V3(20, 330, -8), V3(0, 4, 0), .2, .07);
  addBeam(0xffb070, V3(-28, 10, -8), V3(-28, 4, 2), .9, .02);
  STATIC.hubTop = V3(20, 341, -6);
}
const HUB_LINES = [
  [.8, '前拍檔', '歡迎來到我的……家。', '#b7d38a', 3],
  [3.8, '爸爸', '你一直……都在這裡？', '#f5f0e6', 2.8],
  [6.6, '前拍檔', '三年了。我每天看到的，都畫在牆腳上。', '#b7d38a', 3.2],
  [9.8, '爸爸', '核心在意外時被彈走了，從暖氣管飛上了廚房。沒有它，我們變不回去。', '#f5f0e6', 4],
  [13.8, '前拍檔', '我的腳受過傷，爬不上去了。小彩——你跟他們去。', '#b7d38a', 3.4],
  [17.4, '小彩', '我、我是 Origin Dynamics 的實習生……上個月來搬地庫的機器，醒來就變成這樣了。', '#9fd86b', 4],
  [17.8, () => { if (!party.includes(chars.cham)) { joinCham(); toast('實習生小彩加入隊伍！停着不動會變色隱身，' + (TOUCH ? '按「舌」吐舌頭（點頭像操控）' : '左鍵吐舌頭（按 4 或點頭像操控）'), 4.5); } }],
  [22, '前拍檔', '……我會在牆洞那邊看着你們。', '#b7d38a', 3]
];
LEVELS.wall = {
  chapter: '第一章', title: '屋企', room: '牆的另一邊', house: true, env: 'hub', envI: .7, fog: [0x120d0a, .0016], expo: 1.25,
  dust: { N: 1800, box: [-80, 80, 4, 330, -28, 28], beamFrac: .6, door: false },
  build: buildHub,
  cps: [[60, 4, 15], [-50, 70, -20], [50, 130, -20], [-50, 190, -20], [50, 250, -20], [20, 310, -23]],
  quests: [{ t: '看看前拍檔的家', s: '牆腳的畫，記錄了她這三年' }, { t: '沿牆身爬上廚房', s: '沿水泥牆中間往上爬，累了就橫移到兩邊的木架上休息；最頂那塊木架伸到缺口下面，沿缺口邊的木板爬上去' }],
  // started from the chapter menu: everyone stands just inside the hole from the basement
  spawn() {
    const P = [[66, 4, 15], [72, 4, 11], [72, 4, 19], [-30, 4, 12], [-22, 4, -6]]; const ids = ['dad', 'sq', 'bear', 'cham', 'gecko'];
    ids.forEach((id, i) => { const C = chars[id]; C.pos.set(...P[i]).add(HO); C.yaw = -Math.PI / 2; C.state = 'idle'; C.wave = false; C.lieK = 0; C.root.visible = true; });
    chars.gecko.yaw = .9; chars.cham.yaw = -2.2; leader = chars.dad; mom.root.visible = false; momReset();
    LEVELS.kitchen.prep(); cam.yaw = Math.PI / 2; cam.pitch = .18;
  },
  // walked in from the basement
  enter(prev, again) {
    if (prev === 'basement' && !again) { if (STATE === 'play') unlockKey('prologue'); momReset(); }
    // (also when you climb down into it from the kitchen, having left the basement by its door)
    if (!again && !party.includes(chars.cham)) { chars.cham.root.visible = true; chars.cham.pos.set(-30, 4, 12).add(HO); chars.cham.yaw = -2.2; }
    KS.metWall = true; LEVELS.kitchen.prep();
  },
  leave() { },
  npc() { }, detect(dt) { meter = Math.max(0, meter - dt * .3); },
  update(dt) {
    lvT += dt; scheduleLines(HUB_LINES, dt);
    // walking up to 小彩 also brings her along, whatever the timing
    const K = chars.cham; if (!party.includes(K) && lvT > 3 && leader.pos.distanceTo(K.pos) < 13) { joinCham(); toast('實習生小彩加入隊伍！停着不動會變色隱身，' + (TOUCH ? '按「舌」吐舌頭（點頭像操控）' : '左鍵吐舌頭（按 4 或點頭像操控）'), 4.5); }
    for (const K of [chars.gecko, chars.cham]) if (!party.includes(K) && !NPCW.some(w => w.C === K)) { const dx = leader.pos.x - K.pos.x, dz = leader.pos.z - K.pos.z; K.yaw = angDamp(K.yaw, Math.atan2(dx, dz), 3, dt); K.state = 'idle'; K.spd = 0; }
    const lx = leader.pos.x - HO.x, lz = leader.pos.z - HO.z;
    if (!NET.on && quest === 0 && (lvT > 17 || (lx < 20 && Math.abs(lx) < 85 && lvT > 4))) setQuest(1);
  },
  win() { },
  marker() { if (NET.on) return proMarker(); return quest >= 1 ? STATIC.hubTop : null; },
  reset() { }, eyeText: () => '', hint: () => ''
};

// =====================================================================
//  KITCHEN — 晚飯時間
// =====================================================================
const KS = { door: null, doorA: 0, doorT: 0, closeT: 0, doorCol: null, flight: null, core: null, coreGot: false, carried: false, said: {}, lights: [] };
function cabinetRun(x0, x1, K, gap) {
  if (gap) { box(x0, gap[0], 0, 10, -220, -168, K.kick); box(gap[1], x1, 0, 10, -220, -168, K.kick); }   // (a broken-off bit of kickboard: a way under the cabinet)
  else box(x0, x1, 0, 10, -220, -168, K.kick);
  box(x0, x1, 10, 86, -220, -162, K.cab, { uv: 60 });
  const n = Math.max(1, Math.round((x1 - x0) / 45)), w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * w + 1, b = x0 + (i + 1) * w - 1;
    box(a, b, 13, 17, -161.9, -160.8, K.cab, { col: false }); box(a, b, 79, 83, -161.9, -160.8, K.cab, { col: false });
    box(a, a + 4, 17, 79, -161.9, -160.8, K.cab, { col: false }); box(b - 4, b, 17, 79, -161.9, -160.8, K.cab, { col: false });
    box(b - 9, b - 7, 62, 74, -160.8, -159.3, K.brass, { col: false });
  }
}
function upperRun(x0, x1, K) {
  box(x0, x1, 150, 230, -220, -186, K.cab, { uv: 60 });
  const n = Math.max(1, Math.round((x1 - x0) / 45)), w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) { const a = x0 + i * w + 1, b = x0 + (i + 1) * w - 1; box(a, b, 152, 155, -185.9, -185, K.cab, { col: false }); box(a, b, 225, 228, -185.9, -185, K.cab, { col: false }); box(a + 3, a + 5, 155, 166, -185, -183.6, K.brass, { col: false }); }
}
function buildKitchen() {
  const K = kitchenMats(), M = MAT;
  // shell
  box(-312, 330, -10, 0, -240, 240, K.floor, { uv: 140, cast: false });
  // ceiling (with the hole the hood's chimney goes up through)
  box(-330, 16, 260, 270, -240, 240, K.ceil, { cast: false }); box(60, 330, 260, 270, -240, 240, K.ceil, { cast: false }); box(16, 60, 260, 270, -240, -218, K.ceil, { cast: false }); box(16, 60, 260, 270, -198, 240, K.ceil, { cast: false });
  box(-312, -150, 0, 260, -232, -220, K.wall, { uv: 120 }); box(-50, -36, 0, 260, -232, -220, K.wall, { uv: 120 }); box(-36, -24, 10, 260, -232, -220, K.wall, { uv: 120 }); box(-24, 196, 0, 260, -232, -220, K.wall, { uv: 120 });   // (a mouse-size hole behind the counter, through to the storeroom)
  box(206, 236, 0, 260, -232, -220, K.wall, { uv: 120 }); box(196, 206, 8, 260, -232, -220, K.wall, { uv: 120 });   // (a mouse hole behind the fridge, through to the bathroom)
  box(298, 312, 0, 260, -232, -220, K.wall, { uv: 120 }); box(236, 298, 205, 260, -232, -220, K.wall, { uv: 120 });
  box(-150, -50, 0, 110, -232, -220, K.wall, { uv: 120 }); box(-150, -50, 190, 260, -232, -220, K.wall, { uv: 120 });
  // (the back wall has the bathroom door in it, between the fridge and the living-room wall)
  box(-312, 312, 0, 260, 220, 232, K.wall, { uv: 120 }); box(300, 312, 0, 260, -232, -62, K.wall, { uv: 120 }); box(300, 312, 0, 260, 44, 232, K.wall, { uv: 120 }); box(300, 312, 212, 260, -62, 44, K.wall, { uv: 120 });
  box(-312, -300, 0, 260, -232, -104, K.wall, { uv: 120 }); box(-312, -300, 0, 260, -96, 232, K.wall, { uv: 120 }); box(-312, -300, 8, 260, -104, -96, K.wall, { uv: 120 });
  // behind the mouse hole: a crawl tunnel, then a small chamber over the gap that drops into the wall cavity
  // (the cavity's top board is the floor here; the copper pipe sticks up through the gap)
  box(-344, -312, 0, 18, -114, -110, K.stud); box(-344, -312, 0, 18, -90, -86, K.stud); box(-344, -312, 15, 18, -110, -90, K.stud);
  box(-428, -424, 0, 24, -124, -107.4, K.stud); box(-428, -424, 0, 24, -92.6, -76, K.stud); box(-428, -424, 14.5, 24, -107.4, -92.6, K.stud);   // (a gap in the far end: the old drain pipe from the garden comes in there)
  box(-428, -340, 0, 24, -124, -120, K.stud); box(-428, -340, 0, 24, -80, -76, K.stud);
  box(-344, -340, 0, 24, -120, -110, K.stud); box(-344, -340, 0, 24, -90, -80, K.stud); box(-344, -340, 15, 24, -110, -90, K.stud);
  box(-428, -340, 20, 24, -124, -76, K.stud);
  // online games don't go down there: a grate covers the gap
  { const g = new THREE.Group(); g.position.set(-380, 0, -100); LV.add(g); const gm = new THREE.MeshStandardMaterial({ color: 0x5a5e62, metalness: .9, roughness: .45 });
    for (let i = 0; i <= 10; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.7, .6, 25), gm); b.position.set(-20 + i * 4, .3, 0); b.castShadow = true; g.add(b); }
    for (const z of [-12.3, 0, 12.3]) { const b = new THREE.Mesh(new THREE.BoxGeometry(41, .6, .7), gm); b.position.set(0, .3, z); g.add(b); }
    KS.grate = { g, c: { t: 'b', x0: -401, x1: -359, y0: -999, y1: -998, z0: -113, z1: -87 } }; cols.push(KS.grate.c); g.visible = false; }
  pointL(0xffa860, 40, -326, 4, -100);
  addDecal(K.hole, 22, 22, -299.8, 7, -100, 0, Math.PI / 2);
  // baseboards
  box(-300, -298.5, 0, 9, -96, 220, MAT.white, { col: false }); box(-300, -298.5, 0, 9, -158, -104, MAT.white, { col: false }); box(-300, 300, 0, 9, 218.5, 220, MAT.white, { col: false }); box(298.5, 300, 0, 9, -150, -64, MAT.white, { col: false }); box(298.5, 300, 0, 9, 44, 220, MAT.white, { col: false });
  // backsplash
  box(-300, -150, 90, 150, -220.2, -219.9, K.tiles, { uv: 60, col: false, cast: false }); box(-150, -50, 90, 110, -220.2, -219.9, K.tiles, { uv: 60, col: false, cast: false }); box(-50, 148, 90, 150, -220.2, -219.9, K.tiles, { uv: 60, col: false, cast: false });
  // window above the sink
  box(-152, -48, 104, 110, -232, -212, MAT.white); box(-152, -148, 110, 190, -232, -224, MAT.white); box(-52, -48, 110, 190, -232, -224, MAT.white); box(-152, -48, 186, 190, -232, -224, MAT.white); box(-101.5, -98.5, 110, 190, -230, -226, MAT.white, { col: false }); box(-150, -50, 148.5, 151.5, -230, -226, MAT.white, { col: false });
  mesh(new THREE.PlaneGeometry(98, 78), MAT.glassThin, -100, 150, -228, { cast: false });
  // the view: a little light well behind the house (the storeroom wraps round it), the lean-to roof and the sky over it
  sunWindow(V3(-100, 150, -226), 98, 78, V3(0, 0, 1), 0, { fill: 12000 });
  cols.push({ t: 'b', x0: -150, x1: -50, y0: 110, y1: 190, z0: -229, z1: -227, noRay: true });
  // potted herb on the sill
  // base cabinets + under-sink cupboard (hollow, door open)
  cabinetRun(-300, -140, K); cabinetRun(-60, 0, K, [-36, -24]); cabinetRun(76, 148, K);
  box(-140, -60, 0, 10, -220, -168, K.kick);
  box(-140, -60, 10, 13, -220, -162, K.cab); box(-140, -138, 13, 62, -220, -162, K.cab); box(-62, -60, 13, 62, -220, -162, K.cab); box(-140, -60, 13, 62, -220, -218, K.cab);
  box(-140, -60, 62, 66, -220, -162, K.cab);
  const cd = new THREE.Group(); cd.position.set(-140, 10, -161.5); cd.rotation.y = -1.25; LV.add(cd);
  mesh(new THREE.BoxGeometry(80, 52, 1.8), K.cab, 40, 26, 0, { parent: cd }); mesh(new THREE.BoxGeometry(2, 12, 1.4), K.brass, 72, 34, 1.5, { parent: cd });
  tubeM([[-100, 64, -205], [-100, 40, -205], [-100, 30, -200], [-92, 30, -196], [-92, 42, -196], [-92, 44, -218]], 1.8, MAT.steel);
  // countertops
  box(-302, -140, 86, 90, -222, -158, K.quartz, { uv: 100 }); box(-60, 0, 86, 90, -222, -158, K.quartz, { uv: 100 }); box(76, 150, 86, 90, -222, -158, K.quartz, { uv: 100 });
  box(-140, -60, 86, 90, -222, -210, K.quartz, { uv: 100 }); box(-140, -60, 86, 90, -170, -158, K.quartz, { uv: 100 }); box(-140, -130, 86, 90, -210, -170, K.quartz, { uv: 100 }); box(-70, -60, 86, 90, -210, -170, K.quartz, { uv: 100 });
  // sink basin
  box(-130, -70, 66, 67, -210, -170, K.steel); box(-131, -130, 66, 86, -210, -170, K.steel); box(-70, -69, 66, 86, -210, -170, K.steel); box(-130, -70, 66, 86, -211, -210, K.steel); box(-130, -70, 66, 86, -170, -169, K.steel);
  const water = mesh(new THREE.PlaneGeometry(59, 39), K.water, -100, 68.6, -190, { cast: false }); water.rotation.x = -Math.PI / 2;
  box(-126, -112, 67, 71, -206, -196, new THREE.MeshPhysicalMaterial({ color: 0xf2d24a, roughness: .9, sheen: .5 }), { uv: 0 }); box(-126, -112, 71, 72.5, -206, -196, new THREE.MeshStandardMaterial({ color: 0x2f7a3a, roughness: 1 }), { uv: 0 });
  KS.basin = { x0: -130, x1: -70, z0: -210, z1: -170 };
  // faucet
  cyl(-100, -214, 3, 90, 93, K.steel, { seg: 24 }); tubeM([[-100, 92, -214], [-100, 122, -214], [-100, 130, -206], [-100, 126, -196], [-100, 118, -193]], 1.4, K.steel);
  const lever = mesh(new THREE.CylinderGeometry(.6, .6, 9, 10), K.steel, -94, 98, -214); lever.rotation.z = 1.1;
  KS.tap = V3(-100, 116.5, -193);
  // stove
  box(0, 76, 0, 86, -220, -160, K.steel, { uv: 60 }); box(0, 76, 86, 88.5, -220, -160, K.glassBlack);
  const ow = mesh(new THREE.PlaneGeometry(60, 34), K.ovenGlow, 38, 42, -159.8, { cast: false }); box(8, 68, 66, 68, -159.7, -157, K.steel, { col: false });
  for (let i = 0; i < 5; i++) { const kb = mesh(new THREE.CylinderGeometry(2, 2, 2.4, 16), MAT.black, 10 + i * 14, 78, -158.8); kb.rotation.x = Math.PI / 2; }
  const burner = (x, z, r, hot) => { const t = mesh(new THREE.TorusGeometry(r, .5, 8, 40), hot ? K.hot : K.ring, x, 88.6, z, { cast: false }); t.rotation.x = Math.PI / 2; const t2 = mesh(new THREE.TorusGeometry(r * .55, .4, 8, 32), hot ? K.hot : K.ring, x, 88.6, z, { cast: false }); t2.rotation.x = Math.PI / 2; };
  burner(19, -178, 9, true); burner(57, -178, 9, false); burner(19, -205, 7, false); burner(57, -205, 7, true);
  KS.hot = [{ x: 57, z: -205, r: 8 }];
  const pot = mesh(new THREE.LatheGeometry([V3(0, 0, 0), V3(11, 0, 0), V3(11.6, .6, 0), V3(11.6, 14, 0), V3(12.2, 14.4, 0), V3(11, 14.4, 0), V3(11, 1.2, 0)], 48), K.steel, 19, 88.5, -178);
  cols.push({ t: 'c', x: 19, z: -178, r: 11.8, y0: 88.5, y1: 103, m: pot });
  const lid = mesh(new THREE.SphereGeometry(11.4, 32, 10, 0, Math.PI * 2, 0, .5), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .35, roughness: .05, depthWrite: false }), 19, 98, -178, { cast: false });
  KS.potTop = V3(19, 104, -178);
  for (const s of [-1, 1]) { const h = mesh(new THREE.TorusGeometry(2.4, .7, 8, 16, Math.PI), MAT.black, 19 + s * 12.5, 100, -178); h.rotation.set(0, s > 0 ? -Math.PI / 2 : Math.PI / 2, 0); }
  // hood
  buildHood(K);
  HX.hoodBulb = K.bulb.clone(); hoodUnderside(K);
  // upper cabinets
  upperRun(-300, -160, K); upperRun(-40, -2, K); upperRun(78, 148, K); box(150, 232, 200, 236, -220, -150, K.cab, { uv: 60 });
  // counter props
  kitchenResizables(K);
  // pushables: things the bear can shove off the edge to make noise
  const jar = new THREE.Group(); mesh(new THREE.CylinderGeometry(.5, .5, .82, 24), K.jar, 0, -.08, 0, { parent: jar }); mesh(new THREE.CylinderGeometry(.46, .46, .5, 24), K.jarRed, 0, -.22, 0, { parent: jar }); mesh(new THREE.CylinderGeometry(.52, .52, .16, 24), MAT.black, 0, .42, 0, { parent: jar });
  const rj = addResizable(jar, -232, -164, 90, 5, 10, 5, .3, 6, '香料瓶'); rj.c.push = true;
  const can = new THREE.Group(); mesh(new THREE.CylinderGeometry(.5, .5, 1, 28), K.can, 0, 0, 0, { parent: can });
  const rc = addResizable(can, 112, -164, 90, 7, 10, 7, .3, 6, '湯罐頭'); rc.c.push = true;
  // fridge (hollow, door swings open when Mom gets something)
  const FX0 = 150, FX1 = 232, FZ0 = -220, FZ1 = -150;
  box(FX0, FX0 + 4, 6, 184, FZ0, FZ1, K.fridgeIn); box(FX1 - 4, FX1, 6, 184, FZ0, FZ1, K.fridgeIn); box(FX0, FX1, 6, 184, FZ0, FZ0 + 4, K.fridgeIn);
  box(FX0, FX1, 180, 184, FZ0, FZ1, K.fridgeIn); box(FX0, FX1, 6, 12, FZ0, FZ1, K.fridgeIn);
  box(FX0 - .5, FX0, 6, 184.5, FZ0, FZ1, K.steel, { col: false }); box(FX1, FX1 + .5, 6, 184.5, FZ0, FZ1, K.steel, { col: false }); box(FX0, FX1, 184, 184.5, FZ0, FZ1, K.steel, { col: false });
  for (const [x, z] of [[153, -217], [229, -217], [153, -153], [229, -153]]) box(x - 1.5, x + 1.5, 0, 6, z - 1.5, z + 1.5, MAT.black);
  for (const y of [48, 86, 124]) box(FX0 + 4, FX1 - 4, y - 1, y, FZ0 + 4, FZ1 - 2, K.shelfGlass);
  box(156, 190, 12, 34, -214, -168, K.plastic); box(192, 226, 12, 34, -214, -168, K.plastic);
  mesh(new THREE.SphereGeometry(6, 16, 12), K.lettuce, 172, 22, -192, { cast: false }); for (let i = 0; i < 3; i++) { const cr = mesh(new THREE.CylinderGeometry(1.2, .3, 16, 10), K.carrot, 205 + i * 5, 20, -190); cr.rotation.x = Math.PI / 2; }
  cyl(214, -200, 6, 48, 60, MAT.glass, { seg: 20 }); mesh(new THREE.SphereGeometry(5.6, 20, 14), K.lettuce, 214, 53.5, -200, { cast: false });
  box(160, 190, 86, 93, -200, -186, K.pulp, { uv: 0 }); for (let i = 0; i < 6; i++) mesh(new THREE.SphereGeometry(2.3, 14, 10), K.egg, 164 + (i % 3) * 5 + R(-.3, .3), 94.5, -197 + Math.floor(i / 3) * 6, { cast: false }).scale.y = 1.25;
  mesh(new THREE.SphereGeometry(4, 20, 16), K.apple, 210, 90, -190); mesh(new THREE.SphereGeometry(3.8, 20, 16), K.apple, 218, 89.8, -178);
  cols.push({ t: 'c', x: 210, z: -190, r: 4, y0: 86, y1: 94 });
  box(196, 224, 124, 134, -210, -186, MAT.white, { uv: 0 });
  // kept cold: Dad's Prototype rack (two vials), cheese and ham (food puts back lost stamina). Taken, they come back while the door stays shut
  box(162, 186, 86, 88.5, -173, -163, new THREE.MeshPhysicalMaterial({ color: 0x5aa8d8, roughness: .3, clearcoat: .7 }));   // (low enough to step onto)
  box(162, 186, 88.5, 92, -173.4, -172.6, new THREE.MeshPhysicalMaterial({ color: 0x5aa8d8, roughness: .3, clearcoat: .7 }), { col: false });
  { const t = mesh(new THREE.PlaneGeometry(14, 2.6), new THREE.MeshBasicMaterial({ map: fridgeLabelTex() }), 174, 90.3, -172.5, { cast: false }); t.userData.noSolid = true; }
  for (const x of [168, 180]) { FSTOCK.v.push({ i: VIALS.length, t: 0 }); addVial(x, 88.5, -168); VIALS[VIALS.length - 1].cold = true; }
  FSTOCK.c.push({ i: CRUMBS.length, t: 0 }); addCrumb(204, 48, -172, false, 'cheese');
  FSTOCK.c.push({ i: CRUMBS.length, t: 0 }); addCrumb(176, 124, -172, true, 'ham');
  KS.fridgeLight = pointL(0xeaf4ff, 0, 191, 172, -178);
  mesh(new THREE.PlaneGeometry(40, 3), K.bulb, 191, 179.5, -190, { cast: false }).rotation.x = Math.PI / 2;
  // drain hole (secret route to under the fridge)
  mesh(new THREE.CircleGeometry(2.6, 24), new THREE.MeshBasicMaterial({ color: 0x000000 }), 191, 12.05, -212, { cast: false }).rotation.x = -Math.PI / 2;
  KS.drain = V3(191, 12, -212);
  // door
  const door = new THREE.Group(); door.position.set(FX1, 6, FZ1 + 3); LV.add(door); KS.door = door;
  mesh(new THREE.BoxGeometry(82, 178, 5.8), K.steel, -41, 89, 0, { parent: door });
  mesh(new THREE.PlaneGeometry(78, 174), K.fridgeIn, -41, 89, -2.95, { parent: door, cast: false }).rotation.y = Math.PI;
  for (const y of [40, 90, 140]) { mesh(new THREE.BoxGeometry(70, 1.5, 9), K.plastic, -41, y, -7.5, { parent: door, cast: false }); mesh(new THREE.BoxGeometry(70, 7, .8), K.plastic, -41, y + 3, -11.6, { parent: door, cast: false }); }
  for (let i = 0; i < 3; i++) mesh(new THREE.CylinderGeometry(3, 3, 18, 16), i === 1 ? K.juice : MAT.glass, -60 + i * 16, 50, -7, { parent: door });
  mesh(new THREE.BoxGeometry(2.4, 50, 3), K.steel, -76, 110, 4.2, { parent: door });
  mesh(new THREE.PlaneGeometry(22, 30), K.poster, -50, 120, 2.95, { parent: door, cast: false }); mesh(new THREE.PlaneGeometry(26, 20), K.kidArt, -22, 92, 2.95, { parent: door, cast: false }).rotation.z = -.06;
  for (const [x, y] of [[-50, 134], [-22, 101]]) mesh(new THREE.CylinderGeometry(1.2, 1.2, .8, 16), MAT.paintRed, x, y, 3.3, { parent: door }).rotation.x = Math.PI / 2;
  KS.doorCol = { t: 'b', x0: FX0, x1: FX1, y0: 6, y1: 184, z0: FZ1, z1: FZ1 + 6 }; cols.push(KS.doorCol);
  // core under the fridge + dust bunnies
  const core = new THREE.Group(); core.position.set(212, 1.6, -194); LV.add(core);
  mesh(new THREE.SphereGeometry(1.25, 24, 18), K.core, 0, 0, 0, { parent: core, cast: false });
  for (let i = 0; i < 3; i++) { const rg = mesh(new THREE.TorusGeometry(1.7, .12, 8, 32), MAT.copper, 0, 0, 0, { parent: core }); rg.rotation.set(i * 1.05, i * .7, 0); }
  KS.core = core; KS.coreLight = new THREE.PointLight(0x7ff6ee, 80, 0, 2); core.add(KS.coreLight); KS.coreGot = false;
  const bun = furMat({ color: 0x8a8580, len: .6, den: 1.8, droop: .3, clump: .6, rimK: .05, root: .7 });
  for (const [x, z, r] of [[170, -205, 2.4], [196, -186, 1.6], [224, -210, 2.8], [180, -168, 1.4], [30, -166, 1.8]]) { const b = furMesh(new THREE.SphereGeometry(r, 20, 14), bun); b.position.set(x, r * .7, z); b.scale.y = .7; LV.add(b); }
  // cat cushion
  // dining table + chairs
  box(-215, -45, 72, 76, 40, 130, K.wood, { uv: 80 });
  for (const [x, z] of [[-210, 45], [-50, 45], [-210, 125], [-50, 125]]) box(x - 2.5, x + 2.5, 0, 72, z - 2.5, z + 2.5, K.wood, { uv: 60 });
  box(-212, -48, 66, 72, 43, 45, K.wood, { col: false }); box(-212, -48, 66, 72, 125, 127, K.wood, { col: false });
  const chair = (cx, cz, face) => {
    box(cx - 20, cx + 20, 44, 47, cz - 20, cz + 20, K.wood, { uv: 50 });
    for (const [dx, dz] of [[-18, -18], [18, -18], [-18, 18], [18, 18]]) box(cx + dx - 1.5, cx + dx + 1.5, 0, 44, cz + dz - 1.5, cz + dz + 1.5, K.wood, { uv: 50 });
    const bz = cz + face * 19; box(cx - 20, cx + 20, 47, 92, bz - 1.5, bz + 1.5, K.wood, { uv: 50 });
  };
  chair(-170, 18, -1); chair(-90, 18, -1); chair(-170, 152, 1); chair(-90, 152, 1);
  mesh(new THREE.PlaneGeometry(21, 28), K.homework, -92, 76.05, 112, { cast: false }).rotation.set(-Math.PI / 2, 0, .12);
  const pc = new THREE.Group(); mesh(new THREE.BoxGeometry(1, 1, 1), K.pencilCase, 0, 0, 0, { parent: pc }); mesh(new THREE.BoxGeometry(1.02, .08, .2), K.brass, 0, .3, 0, { parent: pc });
  const rp = addResizable(pc, -53, 112, 76, 6, 4, 14, .3, 6, '鉛筆盒'); rp.c.push = true;
  addResizable(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), MAT.sugar.clone()), -112, 64, 0, 1.6, 1.6, 1.6, .5, 12, '方糖');
  addResizable(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), MAT.sugar.clone()), 128, -190, 90, 1.6, 1.6, 1.6, .5, 12, '方糖');
  // runner rug in front of the sink
  const rr = furMat({ color: 0xffffff, map: genRug(), len: .28, den: 3.4, droop: 0, clump: .45, root: .6, rimK: .02, rough: 1 });
  const rg = new THREE.PlaneGeometry(150, 46); rg.rotateX(-Math.PI / 2); const rug = furMesh(rg, rr); rug.position.set(-100, .3, -126); rug.castShadow = false; LV.add(rug);
  cols.push({ t: 'b', x0: -175, x1: -25, y0: 0, y1: .3, z0: -149, z1: -103, small: true });
  // wall clock + calendar
  propsKitchen2(K); hideSpotsKitchen(K); cordRoute(140, -205, 150, -140); cordRoute(-170, -205, -160, -140);
  // batteries: top of the fridge, inside the cupboard
  addBattery(200, 184.5, -200); addBattery(-74, 13, -210);
  // ---------- lights ----------
  LV.add(DAY ? new THREE.HemisphereLight(0xa8a49c, 0x4a3c30, 1.2) : new THREE.HemisphereLight(0x8a7c6c, 0x3a2c22, .95));
  const pend = (x, z, y, tx, tz, I, sh) => {
    cyl(x, z, .25, y + 8, 260, MAT.black, { col: false, seg: 6 });
    const sd = mesh(new THREE.SphereGeometry(13, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), K.shade, x, y, z); sd.scale.y = .8;
    const bm = K.bulb.clone(); mesh(new THREE.SphereGeometry(3, 16, 12), bm, x, y - 2, z, { cast: false });
    const l = spotL(0xffc68e, I, V3(x, y - 4, z), V3(tx, 0, tz), 1.0, .75, sh, 10, 700); const spec = { p: V3(x, y - 4, z), dir: V3(tx - x, -(y - 4), tz - z).normalize(), cos: Math.cos(1.0), range: 520 }; KS.lights.push(spec);
    HX.pend.push({ l, I, spec, bulb: bm });
    return l;
  };
  KS.lights = []; HX.pend = [];
  pend(-130, 85, 196, -130, 85, 60000, 2048); pend(-40, -110, 206, -40, -150, 64000, 2048);
  { const l = pointL(0xffd2a0, 3200, 38, 154, -194), spec = { p: V3(38, 154, -194), range: 110 }; KS.lights.push(spec); HX.hoodL = { l, I: 3200, spec, bulb: HX.hoodBulb }; }
  for (const x of [-230, -20, 110]) { pointL(0xffd8a8, 1300, x, 146, -196); KS.lights.push({ p: V3(x, 146, -196), range: 75 }); }
  mesh(new THREE.BoxGeometry(140, .6, 2), K.bulb, -230, 149.6, -192, { cast: false }); mesh(new THREE.BoxGeometry(36, .6, 2), K.bulb, -21, 149.6, -192, { cast: false }); mesh(new THREE.BoxGeometry(66, .6, 2), K.bulb, 113, 149.6, -192, { cast: false });
  pointL(0xff8a3a, 700, 38, 30, -148); KS.lights.push({ p: V3(38, 30, -150), range: 55 });
  pointL(0xff4a1a, 220, 57, 92, -205);
  KS.fridgeL = { p: V3(191, 160, -160), range: 150, on: false }; KS.lights.push(KS.fridgeL);
  if (DAY) KS.lights.push({ p: V3(-100, 150, -222), dir: SUN.clone().negate(), cos: Math.cos(.42), range: 320 });   // the sunshine through the kitchen window
  HX.pend[0].beam = addBeam(0xffc68e, V3(-130, 190, 85), V3(-130, 0, 85), .55, .05); HX.pend[0].rec = beams[beams.length - 1]; HX.pend[0].k = .05;
  HX.pend[1].beam = addBeam(0xffc68e, V3(-40, 200, -110), V3(-40, 0, -150), .55, .05); HX.pend[1].rec = beams[beams.length - 1]; HX.pend[1].k = .05;
  KS.fridgeBeam = addBeam(0xeaf4ff, V3(191, 120, -175), V3(191, 0, -60), .45, 0); KS.fridgeBeamRec = beams[beams.length - 1]; KS.fridgeBeamRec.k = 0;
  STATIC.home = V3(-296, 0, -100);
  KS.coreGot = false; KS.carried = false; KS.doorA = 0; KS.closeT = 0; KS.said = {};
  buildBathroom(K); buildDuct(K);
}

// ---------------- daughter (seated at the dining table) ----------------
const KID = {};
function buildKid() {
  if (KID.root) return;
  const hood = new THREE.MeshPhysicalMaterial({ color: 0xb6a2d6, roughness: .95, sheen: .9, sheenColor: 0xfff0ff, normalMap: MAT.knit.normalMap, normalScale: new THREE.Vector2(.8, .8) });
  const legM = new THREE.MeshPhysicalMaterial({ color: 0x2c3550, roughness: .9, sheen: .5, sheenColor: 0x8090c0 });
  const sock = new THREE.MeshPhysicalMaterial({ color: 0xf6f2ea, roughness: .95, sheen: .7 });
  humanBody({ build: 'k', top: hood, pants: legM, skin: MAT.skin, sock, hood, hair: 0x2a1b14, style: 'pig', tie: new THREE.MeshPhysicalMaterial({ color: 0xe8607a, roughness: .5 }) }, KID);
  KID.root.visible = false; KID.stride = 40;
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 12, 8), new THREE.MeshStandardMaterial({ color: 0xf2c230 })); pen.position.set(0, -16, 2.4); pen.rotation.x = 1; KID.arms[1].el.add(pen); KID.pen = pen; KID.arms[1].grip = .8;
  KID.pelvis.position.y = 50; KID.mode = 'read'; KID.t = 6; KID.yaw = 0; KID.pitch = .6; KID.look = V3();
}
// ---------------- the cat (小橘) ----------------
const CAT = {};
function buildCat() {
  if (CAT.root) return; const g = new THREE.Group(); scene.add(g); CAT.root = g; g.visible = false;
  const fur = furMat({ color: 0xd9893a, belly: 0xf5e2c6, bellyAmt: 1, len: .75, den: 2.6, droop: .3, clump: .42, rimK: .07, root: .62, stripe: .7, stripeF: .42 });
  const furW = furMat({ color: 0xf3e4cc, len: .6, den: 3, droop: .2, clump: .4, rimK: .06, root: .7 });
  const body = new THREE.Group(); body.position.y = 20; g.add(body); CAT.body = body;
  const torso = furMesh(ell(10.5, 10, 21, 40, 28), fur); body.add(torso); CAT.torso = torso;
  const chestM = furMesh(ell(8.5, 9, 8, 28, 20), furW); chestM.position.set(0, -1.5, 12); body.add(chestM);
  const neck = new THREE.Group(); neck.position.set(0, 5, 17); body.add(neck); CAT.neck = neck;
  const head = new THREE.Group(); head.position.set(0, 5, 4); neck.add(head); CAT.head = head;
  head.add(Object.assign(furMesh(ell(8.2, 7.2, 7.6, 36, 26), fur), {}));
  const muz = furMesh(ell(3.8, 2.8, 3, 20, 14), furW); muz.position.set(0, -2.4, 6.2); head.add(muz);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(.85, 12, 10), new THREE.MeshPhysicalMaterial({ color: 0xd8858a, roughness: .3, clearcoat: 1 })); nose.position.set(0, -1, 9.1); nose.scale.set(1.3, .8, .8); head.add(nose);
  CAT.eyes = [];
  const iris = new THREE.MeshPhysicalMaterial({ color: 0xc89a2a, roughness: .05, clearcoat: 1, emissive: 0x3a2400, emissiveIntensity: .4 });
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(1.9, 24, 18), iris); e.position.set(s * 3.3, 1.3, 6.1); e.scale.set(1, 1, .6); head.add(e);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), MAT.eye); pu.scale.set(.32, 1.7, .5); pu.position.set(0, 0, 1.4); e.add(pu); CAT.eyes.push(e);
    const ear = new THREE.Group(); ear.position.set(s * 4.8, 5.6, 1); ear.rotation.set(-.15, 0, s * -.35); head.add(ear);
    ear.add(Object.assign(furMesh(new THREE.ConeGeometry(3.2, 6, 16), fur), {}));
    const inn = new THREE.Mesh(new THREE.ConeGeometry(2.1, 4.4, 12), new THREE.MeshStandardMaterial({ color: 0xe8a0a8, roughness: .7 })); inn.position.set(0, -.4, .9); inn.scale.z = .4; ear.add(inn);
    for (let k = 0; k < 3; k++) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.05, .03, 11, 4), MAT.eyeHL); w.position.set(s * 6.5, -2.2 + k * .6, 7.5); w.rotation.set(0, 0, s * (Math.PI / 2 + (k - 1) * .12)); head.add(w); }
  }
  CAT.legs = [];
  for (const [x, z] of [[-5.5, 13], [5.5, 13], [-5.5, -13], [5.5, -13]]) {
    const L = new THREE.Group(); L.position.set(x, -3, z); body.add(L);
    const lm = furMesh(capG(2.6, 13), z > 0 ? fur : fur); lm.position.y = -8; L.add(lm);
    const paw = furMesh(ell(2.6, 1.6, 3.2, 14, 10), furW); paw.position.set(0, -16.4, .8); L.add(paw);
    CAT.legs.push({ g: L, z });
  }
  CAT.tail = []; let parent = body; const tr = new THREE.Group(); tr.position.set(0, 3, -20); body.add(tr); parent = tr;
  for (let i = 0; i < 7; i++) { const s = new THREE.Group(); s.position.z = i ? -5 : 0; parent.add(s); const m = furMesh(capG(lerp(2.3, 1.5, i / 7), 3.4), fur); m.rotation.x = Math.PI / 2; m.position.z = -2.5; s.add(m); s.rotation.x = i === 0 ? -.9 : .14; CAT.tail.push(s); parent = s; }
  CAT.pos = V3(190, 4, -114); CAT.yaw = 2.4; CAT.mode = 'sleep'; CAT.t = 0; CAT.phase = 0; CAT.home = V3(190, 4, -114); CAT.target = V3(); CAT.sleepK = 1;
}

// ---------------- kitchen NPC brains ----------------
const MKP = { stove: { x: 34, z: -128, look: [22, 96, -178] }, sink: { x: -100, z: -127, look: [-100, 72, -192] }, fridge: { x: 176, z: -88, look: [191, 96, -186] }, table: { x: -90, z: 12, look: [-90, 112, 152] } };
const MSCHED = [['stove', 10], ['table', 18], ['sink', 6], ['fridge', 0], ['table', 15], ['stove', 7], ['table', 14]];
const KM = { mode: 'act', sched: 0, pt: 'stove', t: 10, inv: null, prev: null, trackT: 0 };
const MOMK_LINES = { fridge: '雞蛋……還有半盒。', sink: '那間公司的人今天又來了，說要拿走地庫的東西。', table: '先吃吧。警察說，要等四十八小時才能立案。' };
function momLineK(k) { const t = MOMK_LINES[k]; if (!t || KS.said['m_' + k]) return; KS.said['m_' + k] = 1; sayW('太太', t, '#f4bb72', 3.6); if (k === 'table') setTimeout(() => { if (LEVEL === 'kitchen') sayW('女兒', '……我想爸爸。', '#e8a0c0', 2.8); }, 3800); }
function nextSched() { KM.sched = (KM.sched + 1) % MSCHED.length; KM.pt = MSCHED[KM.sched][0]; KM.mode = 'goto'; }
function momHear(p, loud) { if (TOY.fetch) return; brainHear(p, loud); }
function kidHear(p) { if (!KID.root) return; KID.mode = 'noise'; KID.t = 2.6; KID.look.copy(p); }
function momWalk(x, z, sp, dt) {
  const P = mom.pos; const dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz); const st = sp * dt;
  if (d < st + .5) { P.x = x; P.z = z; return [true, d]; }
  P.x += dx / d * st; P.z += dz / d * st; mom.yaw = angDamp(mom.yaw, Math.atan2(dx, dz), 5, dt); mom.aimT.set(P.x + dx / d * 150, 0, P.z + dz / d * 150); return [false, st];
}
function updKitchenMom(dt) {
  let moveD = 0; const P = mom.pos; const fd = momFetch(dt);
  if (fd !== null) { moveD = fd; const A = HB.m; if (A && (A.q.length || A.cur || A.seat)) { if (A.act === 'bath' && HX.bd.tgt < .5) HX.bd.tgt = 1.35; A.q = []; A.cur = null; A.seat = null; A.act = ''; A.react = 0; } }
  else if (KM.mode === 'sus') { mom.aimT.copy(KM.susP); mom.yaw = angDamp(mom.yaw, Math.atan2(KM.susP.x - P.x, KM.susP.z - P.z), 1.6, dt); KM.trackT -= dt; if (KM.trackT <= 0) KM.mode = 'goto'; }
  else if (KM.mode === 'inv' && KM.invP) { const p = KM.invP; KM.invP = null; KM.mode = 'goto'; brainHear(p, 1); }
  else moveD = brainMom(dt);
  brainTick(dt);
  // the fridge door stays open while someone's getting something out
  const forced = HX.id.fridge && HX.id.fridge.on;   // a player pulled it open (the bear): it stays open until someone shuts it
  if (HB.fridgeHold > 0) { HB.fridgeHold -= dt; KS.doorTarget = 1.5; KS.closeT = 2.4; } else if (forced) { KS.doorTarget = 1.5; KS.closeT = 0; } else if (KS.closeT > 0) { KS.closeT -= dt; if (KS.closeT <= 0) KS.doorTarget = 0; } else KS.doorTarget = 0;
  KS.doorA = damp(KS.doorA, KS.doorTarget || 0, KS.doorTarget ? 3.2 : 2.4, dt); fridgeDoor();
  momAnimK(dt, moveD);
}
function momAnimK(dt, moveD) {
  const P = mom.pos; P.y = mom.fy = humanFloor(P.x, P.z, mom.fy || 0); const R0 = mom.root; R0.position.copy(P); R0.rotation.y = mom.yaw;
  const prev = mom.phase; mom.phase += moveD / 62 * Math.PI; const ph = mom.phase; const walking = moveD > 0;
  const sitting = KM.mode === 'act' && (KM.pt === 'table' || KM.pt === 'toilet' || KM.pt === 'sofa') && !walking; if (sitting) mom.sitY = { table: 53, toilet: 47, sofa: 50 }[KM.pt]; mom.sitK = damp(mom.sitK || 0, sitting ? 1 : 0, 5, dt); const sk = mom.sitK;
  mom.amp = .42 * humanGait(mom, ph, walking, dt);
  if (sk > 0) { for (const L of mom.legs) { L.hip.rotation.x = lerp(L.hip.rotation.x, -1.5, sk); L.knee.rotation.x = lerp(L.knee.rotation.x, 1.55, sk); L.ankle.rotation.x = lerp(L.ankle.rotation.x, -.05, sk); } humanSettle(mom, sk); }
  mom.pelvis.position.y = lerp(mom.pelvis.position.y, mom.sitY || 53, sk);
  mom.aim.x = damp(mom.aim.x, mom.aimT.x, 3, dt); mom.aim.y = damp(mom.aim.y, mom.aimT.y, 3, dt); mom.aim.z = damp(mom.aim.z, mom.aimT.z, 3, dt);
  R0.updateMatrixWorld(true); const hp = V3(); mom.head.getWorldPosition(hp);
  const ad = V3().subVectors(mom.aim, hp); const yr = Math.atan2(Math.sin(Math.atan2(ad.x, ad.z) - mom.yaw), Math.cos(Math.atan2(ad.x, ad.z) - mom.yaw)); const pitch = Math.atan2(-ad.y, Math.hypot(ad.x, ad.z));
  mom.head.rotation.y = damp(mom.head.rotation.y, clamp(yr, -.9, .9), 4, dt); mom.head.rotation.x = damp(mom.head.rotation.x, clamp(pitch * .7, -.25, .75), 4, dt);
  const A0 = mom.arms[0], A1 = mom.arms[1]; if (!(KM.mode === 'fetch' && TOY.fetch && TOY.fetch.mode !== 'walk')) mom.chest.rotation.x = damp(mom.chest.rotation.x, KM.mode === 'look' && mom.aimT.y < 30 ? .5 : 0, 4, dt);
  if (sk > .5 && KM.pt !== 'table') { A1.sh.rotation.set(-.55, .15, 0); A1.el.rotation.x = -.75; A0.sh.rotation.set(-.55, -.15, 0); A0.el.rotation.x = -.75; mom.spoon.visible = false; }
  else if (KM.mode === 'act' && KM.pt === 'phone') { A1.sh.rotation.set(-1.05, .35, 0); A1.el.rotation.x = -1.25; A0.sh.rotation.set(-.2, 0, 0); A0.el.rotation.x = -.3; mom.spoon.visible = false; }
  else if (KM.mode === 'press') { const up = clamp(1.65 - (140 - mom.aimT.y) / 75, .35, 1.9); A1.sh.rotation.set(-up, .12, 0); A1.el.rotation.x = -.15; A0.sh.rotation.set(-.15, 0, 0); A0.el.rotation.x = -.3; mom.spoon.visible = false; }
  else if (sk > .5) { const e = Math.max(0, Math.sin(T * 1.3)); A1.sh.rotation.set(-.9 - e * .55, .25, 0); A1.el.rotation.x = -.9 - e * .9; A0.sh.rotation.set(-.55, -.1, 0); A0.el.rotation.x = -.9; mom.spoon.visible = true; }
  else if (KM.mode === 'act' && KM.pt === 'stove') { A1.sh.rotation.set(-.95 + Math.sin(T * 4) * .08, .25, Math.cos(T * 4) * .06); A1.el.rotation.x = -.85 + Math.cos(T * 4) * .1; A0.sh.rotation.set(-.3, 0, 0); A0.el.rotation.x = -.6; mom.spoon.visible = true; }
  else if (KM.mode === 'act' && KM.pt === 'sink') { A1.sh.rotation.set(-.75 + Math.sin(T * 5) * .05, 0, 0); A1.el.rotation.x = -.7; A0.sh.rotation.set(-.75 + Math.cos(T * 5) * .05, 0, 0); A0.el.rotation.x = -.7; mom.spoon.visible = false; }
  else if (KM.mode === 'fetch' && TOY.fetch && TOY.fetch.mode !== 'walk') { const F = TOY.fetch; const reach = F.mode === 'grab' ? sstep(0, .5, F.t) * (1 - sstep(.9, 1.15, F.t)) : F.mode === 'drop' ? Math.sin(clamp(F.t / 1.1, 0, 1) * Math.PI) : 0; const low = F.from && F.from.y < 40 ? 1 : .4; A1.sh.rotation.set(-.55 - reach * (.25 + low * .2), 0, 0); A1.el.rotation.x = F.mode === 'carry' ? -1.35 : -.9 + reach * .7; mom.chest.rotation.x = reach * low * .5; A0.sh.rotation.set(-.15, 0, 0); A0.el.rotation.x = -.3; mom.spoon.visible = false; }
  else if (KM.mode === 'fopen') { A1.sh.rotation.set(-1.25, .2, 0); A1.el.rotation.x = -.25; A0.sh.rotation.x = -.2; A0.el.rotation.x = -.2; mom.spoon.visible = false; }
  else mom.spoon.visible = KM.pt === 'stove';   // walking: the gait swings the arms
  if (walking && Math.floor(prev / Math.PI) !== Math.floor(ph / Math.PI)) {
    const Lg = mom.legs[Math.floor(ph / Math.PI) % 2 === 0 ? 0 : 1]; const fp = V3(); Lg.ankle.getWorldPosition(fp); fp.y = P.y;
    const dist = Math.hypot(leader.pos.x - fp.x, leader.pos.y - fp.y, leader.pos.z - fp.z);
    SND.thud(clamp(1.1 - dist / 420, .06, .9)); cam.shake = Math.max(cam.shake, clamp(1 - dist / 240, 0, 1) * .8);
    for (let i = 0; i < 4; i++) emit(V3(fp.x + R(-6, 6), fp.y + .5, fp.z + R(-8, 12)), V3(R(-12, 12), R(3, 10), R(-12, 12)), new THREE.Color(.2, .18, .16), R(.5, 1), R(.5, 1), 20, 2.5);
    if (STATE === 'play' && Math.hypot(leader.pos.x - fp.x, leader.pos.z - (fp.z + 4)) < 14 && leader.pos.y - fp.y < 8 && leader.pos.y - fp.y > -3) knock(leader, fp, '差點被踩扁！');
  }
}
function updKid(dt) {
  const H = KID; H.t -= dt; let moveD = 0;
  if (NET.client) moveD = kidNetApply(dt); else if (LEVEL === 'kitchen') moveD = brainKid(dt);
  let ty = 0, tp = .62;
  if (NET.client) { const w = NET.npc; if (w && w.k) { ty = w.k[0]; tp = w.k[1]; } H.mode = '_net'; }
  else if (H.mode === 'noise' || H.mode === 'sus') { const hp = V3(); H.head.getWorldPosition(hp); const d = V3().subVectors(H.look, hp); const by = H.root.rotation.y; ty = clamp(Math.atan2(Math.sin(Math.atan2(d.x, d.z) - by), Math.cos(Math.atan2(d.x, d.z) - by)), -1.3, 1.3); tp = clamp(Math.atan2(-d.y, Math.hypot(d.x, d.z)), -.3, .9); if (H.t <= 0) { H.mode = 'read'; H.t = R(5, 9); } }
  else if ((H.pose || 'homework') === 'homework') {
    if (H.mode === 'look') { ty = H.dir * Math.sin((2.8 - H.t) / 2.8 * Math.PI) * 1.15; tp = .2; if (H.t <= 0) { H.mode = 'read'; H.t = R(6, 11); } }
    else { H.mode = 'read'; ty = Math.sin(T * .7) * .08; tp = .62; if (H.t <= 0) { H.mode = 'look'; H.t = 2.8; H.dir = rnd() < .5 ? -1 : 1; } }
    if (KM.mode === 'act' && KM.pt === 'table') { const hp = V3(); H.head.getWorldPosition(hp); const d = V3().subVectors(mom.head.getWorldPosition(V3()), hp); const by = H.root.rotation.y; ty = clamp(Math.atan2(Math.sin(Math.atan2(d.x, d.z) - by), Math.cos(Math.atan2(d.x, d.z) - by)), -1.2, 1.2); tp = -.25; }
  } else if (H.lookP) { const hp = V3(); H.head.getWorldPosition(hp); const d = V3().subVectors(H.lookP, hp); const by = H.root.rotation.y; ty = clamp(Math.atan2(Math.sin(Math.atan2(d.x, d.z) - by), Math.cos(Math.atan2(d.x, d.z) - by)), -1.1, 1.1); tp = clamp(Math.atan2(-d.y, Math.hypot(d.x, d.z)), -.4, .8); }
  H.yaw = damp(H.yaw, ty, NET.client ? 9 : 4, dt); H.pitch = damp(H.pitch, tp, NET.client ? 9 : 4, dt); H.head.rotation.set(H.pitch, H.yaw, 0);
  kidBody(dt, moveD);
}
function catHear(p) {
  if (!CAT.root || CAT.mode === 'pounce' || CAT.mode === 'stalk') return;
  CAT.target.set(clamp(p.x, -280, 280), 0, clamp(p.z, -140, 205)); CAT.mode = CAT.mode === 'sleep' ? 'wake' : 'inv'; CAT.t = .9; CAT.next = 'inv';
}
function catTarget() {
  if (!NET.on) return leader; let best = null, bd = 1e9;
  for (const C of playerChars()) { if (C.frozen) continue; const d = Math.hypot(C.pos.x - CAT.pos.x, C.pos.z - CAT.pos.z); if (d < bd) { bd = d; best = C; } }
  return best || leader;
}
function knockAny(C, from, msg) { if (mine(C)) knock(C, from, msg); else if (NET.on && isPlayerChar(C)) nsend({ t: 'knock', id: C.id, x: from.x, z: from.z, m: msg }); }
function catSee(L = leader) {
  if (L.pos.y > 22 || CAT.cool > 0) return false;
  const dx = L.pos.x - CAT.pos.x, dz = L.pos.z - CAT.pos.z, d = Math.hypot(dx, dz); if (d > 140) return false;
  const fx = Math.sin(CAT.yaw), fz = Math.cos(CAT.yaw); if ((dx * fx + dz * fz) / d < .2) return false;
  if (!(L.spd > 1.2 || d < 45) || (L.crouch && d > 70)) return false;
  const [cl] = ceilAt(L.pos.x, L.pos.z, L.pos.y); if (cl - L.pos.y < 28) return false;
  const eye = V3(CAT.pos.x, 22, CAT.pos.z); const tp = V3(L.pos.x, L.pos.y + 2, L.pos.z); const v = V3().subVectors(tp, eye); const dl = v.length(); v.divideScalar(dl);
  for (const c of colsNear(eye.x, eye.y, eye.z)) { if (c.cat || c.small) continue; const t = rayT(eye, v, dl - 1, c); if (t > .5 && t < dl - 1) return false; }
  return true;
}
function ceilAt(x, z, y) { let m = 1e9, mc = null; for (const c of colsNear(x, y, z)) { if (c.t === 'h') { const b = hTop(c, x, z) - c.th; if (b >= y + .5 && b < m) { m = b; mc = c; } continue; } if (c.y0 < y + .5 || c.y0 > m) continue; if (!xzHit(c, x, z, .6, _h)) continue; m = c.y0; mc = c; } return [m, mc]; }
// the cat walks round walls, not through them (furniture it slips past, as before): is there a wall within its
// head's reach of (x, z), going (ux, uz)?
function catWall(x, z, ux, uz) {
  for (const d of [0, 12, 24, 32]) { const px = x + ux * d, pz = z + uz * d;
    for (const c of colsNear(px, 15, pz)) if (c.t === 'b' && c.y1 - c.y0 > 120 && c.y0 < 15 && c.y1 > 15 && px > c.x0 - 2 && px < c.x1 + 2 && pz > c.z0 - 2 && pz < c.z1 + 2) return true; }
  return false;
}
// kitchen ↔ living room: through the doorway (the open half: the door stands in the other), not the wall either side of it
function catVia(C, p) { const inL = C.pos.x > 306, toL = p.x > 306; return inL !== toL && Math.abs(C.pos.x - 306) > 14 ? V3(inL ? 282 : 330, 0, clamp(C.pos.z, -12, 30)) : p; }
function updCat(dt) {
  const C = CAT; let sp = 0, ty = null; C.cool = Math.max(0, (C.cool || 0) - dt);
  if (NET.client) { const w = NET.npc; if (w && w.c) { const ox = C.pos.x, oz = C.pos.z; const k = 1 - Math.exp(-10 * dt); C.pos.x += (w.c[0] - C.pos.x) * k; C.pos.z += (w.c[1] - C.pos.z) * k; sp = Math.hypot(C.pos.x - ox, C.pos.z - oz) / Math.max(dt, 1e-4); ty = w.c[2]; C.mode = w.c[3]; C.jump = w.c[4]; } const L = leader; catAnim(dt, sp, ty, L.pos.x - C.pos.x, L.pos.z - C.pos.z); return; }
  const L = catTarget();
  const dx = L.pos.x - C.pos.x, dz = L.pos.z - C.pos.z, dl = Math.hypot(dx, dz);
  const toward = (p0, speed) => {
    const p = catVia(C, p0), ex = p.x - C.pos.x, ez = p.z - C.pos.z, e = Math.hypot(ex, ez); if (p === p0 && e < speed * dt + 1) return true;
    const ux = ex / e, uz = ez / e, st = speed * dt; ty = Math.atan2(ex, ez);
    // blocked: slide along the wall (one axis at a time); still blocked: give up the way it was going
    if (!catWall(C.pos.x, C.pos.z, ux, uz)) { C.pos.x += ux * st; C.pos.z += uz * st; }
    else if (Math.abs(ux) > .05 && !catWall(C.pos.x, C.pos.z, Math.sign(ux), 0)) C.pos.x += Math.sign(ux) * st;
    else if (Math.abs(uz) > .05 && !catWall(C.pos.x, C.pos.z, 0, Math.sign(uz))) C.pos.z += Math.sign(uz) * st;
    else { C.stuckT = (C.stuckT || 0) + dt; if (C.stuckT > 1.2) { C.stuckT = 0; return 'stuck'; } return false; }
    C.stuckT = 0; sp = speed; return false; };
  const inHouse = P => { const Z = zoneAt(P); return !!Z && Z.id === 'kitchen' && P.x > -312 && P.y < 250; };   // (her world: the kitchen and the living room, never outside or in the walls)
  switch (C.mode) {
    case 'sleep': if (dl < (L.crouch ? 15 : 30) && L.pos.y < 15 && L.spd > .5 && STATE === 'play') { C.mode = 'wake'; C.t = .9; C.next = 'sniff'; C.sniffT = 3; } break;
    case 'wake': C.t -= dt; if (C.t <= 0) { C.mode = C.next || 'sniff'; C.t = 3.5; if (!KS.said.catwake) { KS.said.catwake = 1; sayW('前拍檔', '貓醒了！別動，或者躲到牠鑽不進去的地方！', '#b7d38a', 3); } } break;
    case 'inv': if (toward(C.target, 95)) { C.mode = 'sniff'; C.t = 4; } if (catSee(L) && inHouse(L.pos)) { C.mode = 'stalk'; } break;
    case 'sniff': C.t -= dt; ty = C.yaw + Math.sin(T * 1.6) * .03; if (catSee(L) && inHouse(L.pos)) C.mode = 'stalk'; else if (C.t <= 0) { C.mode = 'home'; } break;
    case 'home': { const r = toward(C.home, 40); if (r === true) { C.mode = 'settle'; C.t = 1.4; } else if (r === 'stuck') { C.mode = 'settle'; C.t = 1.4; } if (catSee(L) && inHouse(L.pos)) C.mode = 'stalk'; break; }   // (can't get home: curls up where she is)
    case 'settle': C.t -= dt; ty = 2.4; if (C.t <= 0) C.mode = 'sleep'; break;
    case 'stalk': {
      const [cl] = ceilAt(L.pos.x, L.pos.z, L.pos.y);
      if (L.pos.y > 22 || cl - L.pos.y < 28 || dl > 190 || !inHouse(L.pos)) { C.mode = 'sniff'; C.t = 3; break; }   // (out of the cat flap, into the wall: gone)
      if (toward(V3(L.pos.x, 0, L.pos.z), 26) === 'stuck') { C.mode = 'sniff'; C.t = 3; break; } if (dl < 42) { C.mode = 'crouch'; C.t = .75; ty = Math.atan2(dx, dz); }
      break;
    }
    case 'crouch': C.t -= dt; ty = Math.atan2(dx, dz); if (C.t <= 0 && catWall(C.pos.x, C.pos.z, dx / (dl || 1), dz / (dl || 1))) { C.mode = 'sniff'; C.t = 3; break; } if (C.t <= 0) { C.mode = 'pounce'; C.t = 0; C.from = C.pos.clone(); C.to = V3(L.pos.x - dx / (dl || 1) * 6, 0, L.pos.z - dz / (dl || 1) * 6); SND.swish(); } break;
    case 'pounce': {
      C.t += dt / .5; const t = Math.min(1, C.t); C.pos.lerpVectors(C.from, C.to, t); C.jump = Math.sin(t * Math.PI) * 16; ty = Math.atan2(C.to.x - C.from.x, C.to.z - C.from.z);
      if (t >= 1) { C.jump = 0; const d = Math.hypot(L.pos.x - C.pos.x, L.pos.z - C.pos.z); if (d < 13 && L.pos.y < 10) { knockAny(L, C.pos, '小橘撲過來了！'); SND.meow(); noise(C.pos.clone(), .7); if (!KS.said.catcatch) { KS.said.catcatch = 1; setTimeout(() => sayW('太太', '小橘！別亂來！', '#f4bb72', 2.2), 400); } } C.mode = 'play'; C.t = 1.4; }
      break;
    }
    case 'play': C.t -= dt; if (C.t <= 0) { C.mode = 'home'; C.cool = 9; } break;
  }
  catAnim(dt, sp, ty, dx, dz);
}
function catAnim(dt, sp, ty, dx, dz) {
  const C = CAT;
  if (ty !== null) C.yaw = angDamp(C.yaw, ty, 6, dt);
  // body animation
  C.sleepK = damp(C.sleepK, C.mode === 'sleep' || C.mode === 'settle' ? 1 : 0, 3, dt);
  const crouch = C.mode === 'crouch' || C.mode === 'stalk' ? 1 : 0; C.crK = damp(C.crK || 0, crouch, 6, dt);
  C.root.position.set(C.pos.x, (C.jump || 0), C.pos.z); C.root.rotation.y = C.yaw;
  C.phase += dt * sp / 9;
  C.body.position.y = lerp(20, 9, C.sleepK) - C.crK * 5 + Math.abs(Math.sin(C.phase * 2)) * .6 * (sp > 0 ? 1 : 0);
  C.body.rotation.set(C.mode === 'pounce' ? -.25 : 0, 0, C.sleepK * .1);
  C.legs.forEach((l, i) => { const ph = C.phase + (i === 0 || i === 3 ? 0 : Math.PI); l.g.rotation.x = sp > 0 ? Math.sin(ph) * .55 : 0; l.g.scale.y = lerp(1, .3, Math.max(C.sleepK, C.crK * .5)); });
  C.neck.rotation.x = lerp(0, .5, C.sleepK) + C.crK * .2; C.neck.rotation.y = C.sleepK * .9;
  const lookP = (C.mode === 'stalk' || C.mode === 'crouch') ? Math.atan2(Math.sin(Math.atan2(dx, dz) - C.yaw), Math.cos(Math.atan2(dx, dz) - C.yaw)) : Math.sin(T * .8) * .3 * (1 - C.sleepK);
  C.head.rotation.y = damp(C.head.rotation.y, clamp(lookP, -.8, .8), 5, dt);
  C.tail.forEach((s, i) => { s.rotation.y = Math.sin(T * (C.crK > .5 ? 7 : 1.6) - i * .6) * (C.crK > .5 ? .25 : .14) * (1 - C.sleepK * .8) + C.sleepK * .62; if (i > 0) s.rotation.x = lerp(.14, 0, C.sleepK); });
  C.tail[0].rotation.x = lerp(-.9, .5, C.sleepK);
  for (const e of C.eyes) e.scale.y = lerp(1, .08, C.sleepK);
  // dynamic collider
  if (!C.col) { C.col = { t: 'c', x: 0, z: 0, r: 13, y0: 0, y1: 20, cat: true, noCam: true }; cols.push(C.col); }
  C.col.x = C.pos.x; C.col.z = C.pos.z; C.col.y1 = lerp(32, 18, C.sleepK) + (C.jump || 0);
}

// ---------------- kitchen observers ----------------
function eyeSee(head, fovCos, range) {
  const L = leader; const eye = V3(); head.getWorldPosition(eye);
  const q = new THREE.Quaternion(); head.getWorldQuaternion(q); const fwd = V3(0, 0, 1).applyQuaternion(q);
  const tp = V3(L.pos.x, L.pos.y + L.h * .55, L.pos.z); const d = V3().subVectors(tp, eye); const dist = d.length(); d.divideScalar(dist);
  const c = d.dot(fwd); if (dist > range || c < fovCos) return 0;
  if (rayBlocked(eye, d, dist - 1.2, false)) return 0;
  return clamp(1.25 - dist / range, .2, 1) * (.5 + .5 * sstep(fovCos, 1, c)) * coverK(L, eye.y);
}
// tucked in under something (a table, a chair, a shelf): in its shade, and the edge hides you from anyone
// looking down from above it — only someone at your level (the cat, a dog) sees you properly under there
function underCover(L) { const [cy] = ceilAt(L.pos.x, L.pos.z, L.pos.y + L.h * .9); return cy < L.pos.y + 95 ? cy : 0; }
function coverK(L, eyeY) { const cy = underCover(L); return cy && eyeY > cy + 3 ? .2 : 1; }
function litAt(p) { for (const l of KS.lights) { if (l.on === false) continue; const d = V3().subVectors(p, l.p); const dist = d.length(); if (dist > l.range) continue; d.divideScalar(dist); if (l.cos && d.dot(l.dir) < l.cos) continue; if (!rayBlocked(l.p, d, dist - 1, false)) return 1; } return .3; }
function detectKitchen(dt) {
  if (STATE !== 'play') return;
  if (window.__NODET) { meter = 0; return; }
  if (TOY.grace > 0) { meter = Math.max(0, meter - dt * .5); return; }
  const pz = PEST.st === 'in' && PEST.H && (inStore(PEST.H.pos) || PEST.H.pos.z < -480);   // (the pest man is the one who does look in there)
  if (inStore(leader.pos) && !pz) { meter = Math.max(0, meter - dt * .5); KS.watch = null; return; }   // nobody looks into the storeroom
  const L = leader; let seen = 0, who = null;
  if (L.frozen || !mine(L)) { meter = Math.max(0, meter - dt * .5); KS.watch = null; return; }
  const s1 = eyeSee(mom.head, .55, 440); if (s1 > seen) { seen = s1; who = 'mom'; }
  const s2 = eyeSee(KID.head, .5, 360); if (s2 > seen) { seen = s2; who = 'kid'; }
  const s3 = pestSee(); if (s3 > seen) { seen = s3; who = 'pest'; }
  KS.watch = seen > 0 ? { p: (who === 'kid' ? KID.head : who === 'pest' ? PEST.H.head : mom.head).getWorldPosition(V3()), s: seen, who } : null;
  const kd = Math.hypot(L.pos.x - KID.root.position.x, L.pos.z - KID.root.position.z); if (kd < 45 && Math.abs(L.pos.y - KID.root.position.y) < 40 && L.spd > 2 && !L.crouch && KID.mode !== 'read' && !underCover(L)) { seen = Math.max(seen, .3); who = who || 'kid'; }
  if (seen > 0) {
    const lit = litAt(V3(L.pos.x, L.pos.y + L.h * .5, L.pos.z)) * (inDark(L.pos) ? .6 : 1); const mv = L.spd > 1.5 ? 1 : .5; const cr = L.crouch ? .55 : 1; const glow = KS.carried && (!NET.on || KS.carrier === L.id) ? 1.35 : 1;
    const k = seen * lit * mv * cr * glow * hideK(L) * HB.eye; meter += k * dt * 1.0;
    const tp = V3(L.pos.x, L.pos.y + 2, L.pos.z);
    if (meter > .32) netSeen(tp, who);
  } else meter -= dt * .24;
  meter = clamp(meter, 0, 1); if (meter >= 1) { toyFreeze(who); }
}
function coreGround(p) { const [s] = supportAt(p.x, p.z, .8, p.y + 1); return V3(p.x, (s > -1e8 ? s : 0) + 1.6, p.z); }
function inFridge(L) { return L.pos.x > 154 && L.pos.x < 228 && L.pos.z > -216 && L.pos.z < -150 && L.pos.y >= 11.5 && L.pos.y < 180; }
function updKitchenPlayer(dt) {
  const L = leader; L.slow = 1;
  const B = KS.basin; if (L.pos.x > B.x0 && L.pos.x < B.x1 && L.pos.z > B.z0 && L.pos.z < B.z1 && L.pos.y < 69 && L.pos.y > 62) { L.slow = .5; if (L.spd > 2 && rnd() < dt * 8) emit(V3(L.pos.x, 68.8, L.pos.z), V3(R(-8, 8), R(6, 14), R(-8, 8)), new THREE.Color(.6, .75, .85), R(.15, .3), R(.3, .5), 200, 1); if (!KS.said.wet) { KS.said.wet = 1; toast('掉進洗手盆的積水裡了，走得比較慢'); } }
  for (const h of KS.hot) if (Math.hypot(L.pos.x - h.x, L.pos.z - h.z) < h.r && Math.abs(L.pos.y - 88.5) < 1.2 && !(L.vel.y > 0 && !L.grounded && updraftAt(L.pos))) { knock(L, V3(h.x, 88, h.z), '好燙！爐頭還開着！跳起喺佢上面，熱風會托你上去'); SND.sizzle(); for (let i = 0; i < 10; i++) emit(V3(L.pos.x, 90, L.pos.z), V3(R(-5, 5), R(8, 20), R(-5, 5)), new THREE.Color(.3, .3, .32), R(.6, 1.2), R(.6, 1), -6, 1); }
  if (inFridge(L)) { L.cold = true; if (!KS.said.cold) { KS.said.cold = 1; toast('雪櫃裡好冷……體力不會恢復'); } if (rnd() < dt * 1.5) emit(V3(L.pos.x, L.pos.y + L.h * .8, L.pos.z) .add(V3(Math.sin(L.yaw), 0, Math.cos(L.yaw)).multiplyScalar(1.2)), V3(Math.sin(L.yaw) * 2, 1.5, Math.cos(L.yaw) * 2), new THREE.Color(.25, .27, .3), R(.4, .7), R(.6, 1), -1, 1); } else L.cold = false;
  if (Math.hypot(L.pos.x - KS.drain.x, L.pos.z - KS.drain.z) < 3.6 && Math.abs(L.pos.y - 12) < 1.5) {
    L.pos.set(191, 0, -196); L.vel.set(0, 0, 0); L.climbing = false; L.mantle = null; L.squash = .8; SND.swish(); toast('從排水口滑到了雪櫃底下！');
    for (const F of party) if (F !== L && mine(F) && !F.frozen) { const fits = F.h < 5.9; F.pos.set(fits ? 191 + R(-8, 8) : 191, 0, fits ? -186 + R(-6, 6) : -140); F.queue = []; F.disp.copy(F.pos); F.qst = 'idle'; }
    trail = []; L.lastTrail.copy(L.pos);
  }
  if (KS.mp) return;
  if (KS.coreGot && !KS.carried && KS.coreDrop && !L.frozen && Math.hypot(L.pos.x - KS.coreDrop.x, L.pos.z - KS.coreDrop.z) < 5.5 && Math.abs(L.pos.y + 1 - KS.coreDrop.y) < 6) netGet('cdrop');
  if (!KS.coreGot && !L.frozen && L.pos.distanceTo(V3(212, 0, -194)) < 4.5) netGet('core');
  if (KS.carried) { const C = NET.on && KS.carrier ? chars[KS.carrier] : leader; const p = V3(C.pos.x, C.pos.y + C.h + 1.4 + Math.sin(T * 3) * .25, C.pos.z); KS.core.position.lerp(p, 1 - Math.exp(-14 * dt)); KS.core.rotation.y += dt * 2; KS.coreLight.intensity = 60 + Math.sin(T * 5) * 15; }
  else if (KS.coreDrop) { KS.core.position.lerp(KS.coreDrop, 1 - Math.exp(-10 * dt)); KS.core.rotation.y += dt; }
  else { KS.core.rotation.y += dt; KS.core.position.y = 1.6 + Math.sin(T * 2) * .2; }
  if (!NET.client && quest === 0 && !KS.coreGot && playerChars().some(C => Math.hypot(C.pos.x - 191, C.pos.z + 120) < 80) && CAT.mode === 'sleep') setQuest(1);
}
const SP_Q1 = [{ t: '找回縮小機的核心', s: '它掉到雪櫃底下了，發着青光' }, { t: '貓睡在雪櫃前面', s: '潛行繞過牠、讓熊推跌東西把牠引開，或者趁太太開雪櫃時溜進去找排水口' }, { t: '把核心帶回牆腳的洞', s: '核心在發光，比平時更容易被看見' }];
const SP_Q2 = [{ t: '打開通往客廳的門', s: '核心的光越來越弱。門被門擋卡住了——熊可以推開門擋，或者爸爸把它縮小' }, { t: '拿走遙控器的電池', s: '客廳咖啡枱上的遙控器有電池，可以幫核心充電' }];
const KLINES_SP = [[1.2, '女兒', '媽，爸爸今晚會回來吃飯嗎？', '#e8a0c0', 3], [4.6, '太太', '……先吃吧，湯快好了。', '#f4bb72', 2.8], [8, '小彩', '雪櫃底下有青光——核心應該就在那裡。小心那隻貓，還有她們的視線。', '#9fd86b', 4]];
const KLINES_SPD = KLINES_SP.map(l => l[1] === '小彩' ? [l[0], '爸爸', '雪櫃底下有青光——核心應該就在那裡。小心那隻貓，還有她們的視線。', '#f5f0e6', l[4]] : l);   // (小彩 isn't with you yet)
const KLINES_MP = [[1.2, '女兒', '媽，爸爸今晚會回來吃飯嗎？', '#e8a0c0', 3], [4.6, '太太', '……先吃吧，湯快好了。', '#f4bb72', 2.8], [8, '爸爸', '聽好：縮小機少了三個零件——彈簧、鏡片、電容，全部都掉在這個廚房裡。', '#f5f0e6', 4.2], [12.6, '小彩', '找齊之後去客廳，從通風口出去。別讓她們看見！', '#9fd86b', 3.4]];
let END_TXT = null;
LEVELS.kitchen = {
  chapter: '第一章', title: '屋企', room: '晚飯時間的廚房', house: true, env: 'kitchen', envI: .75, fog: DAY ? [0xbfb6a8, .00034] : [0x1a1510, .0007], expo: DAY ? 1.22 : 1.18,
  dust: { N: 2600, box: [-300, 900, 0, 250, -220, 220], beamFrac: .45, door: false },
  toys: true, npcNear: true,
  build() {
    buildKitchen(); buildKid(); buildCat(); buildToyBin(); LEVELS.kitchen.updrafts = [{ x: 57, z: -205, r: 11, y0: 88.5, y1: 178, fx: 14, all: true, hot: true }, buildVent()];
    addVial(-128, 13, -200); addVial(170, 184, -168); addVial(70, 88.5, -215); for (const p of [[-120, 0, 70], [-70, 0, 100], [20, 0, -146], [-30, 91.8, -182], [246, 1.2, 122]]) addCrumb(...p);
    buildLivingRoom(kitchenMats()); buildPassages(kitchenMats()); buildMouseWar(kitchenMats()); buildLivedIn(kitchenMats()); buildBackHall(kitchenMats()); buildPest(kitchenMats()); buildHouseSwitches(kitchenMats()); buildUpstairs(kitchenMats());
    // online co-op: the three machine parts
    addPart(44, 88.5, -212, 'spring'); addPart(205, 110, -464, 'lens'); addPart(-112, 13, -186, 'cap');
  },
  cps: [[-286, 0, -100], [-100, 13, -192], [-130, 0, 86], [191, 0, -190], [260, 0, 190], [340, 0, -10], [640, 0, 60]],
  quests: SP_Q1,
  // the family at dinner — set up once, before anyone can see into the kitchen
  prep() {
    const Z = ZONES.kitchen; if (Z.prepped) return; Z.prepped = true;
    mom.root.visible = true; mom.phone.visible = false; mom.active = false; if (!mom.spoon) { mom.spoon = new THREE.Mesh(new THREE.CylinderGeometry(.5, .7, 26, 8), KMAT.wood); mom.spoon.position.set(0, -27, 8); mom.spoon.rotation.x = 1.2; mom.arms[1].el.add(mom.spoon); }
    mom.pos.set(34, 0, -128); mom.yaw = Math.PI; mom.aim.set(22, 96, -178); mom.aimT.copy(mom.aim); KM.mode = 'act'; KM.pt = 'stove'; KM.sched = 0; KM.t = 10;
    KID.root.visible = true; KID.root.position.set(-90, 0, 157); KID.root.rotation.y = Math.PI; KID.mode = 'read'; KID.t = 7;
    HX.bd.a = 1.35; for (const o of HX.list) { if (o.lv) continue; o.on = o.def; hxApply(o, true); } HX.water = 0; mom.fy = 0; KID.fy = 0; upReset(); brainReset();
    CAT.root.visible = true; CAT.pos.copy(CAT.home); CAT.mode = 'sleep'; CAT.sleepK = 1;
    kitchenMode();
  },
  // an online game starts here (everyone comes out of the mouse hole)
  spawn() {
    const P = [[-288, 0, -100], [-294, 0, -96], [-294, 0, -104], [-318, 0, -100], [-322, 0, -94], [-322, 0, -106], [-330, 0, -100], [-336, 0, -95]]; party.forEach((C, i) => { C.pos.set(...P[(NET.on ? slotOf(C) : i) % 8]); C.yaw = Math.PI / 2; C.state = 'idle'; C.wave = false; C.root.visible = true; C.lieK = 0; });
    chars.gecko.pos.set(-340, 0, -100); chars.gecko.yaw = Math.PI / 2; chars.gecko.state = 'idle'; chars.gecko.wave = false; chars.gecko.root.visible = true;
    chars.cham.root.visible = true; leader = chars.dad; if (!party.includes(chars.cham)) joinCham(); PROTO = Math.max(PROTO, 1);
    momReset(); ZONES.kitchen.prepped = false; this.prep(); kitchenMode();
    cam.yaw = -1.75; cam.pitch = .12;
  },
  // climbed up out of the wall
  enter(prev, again) {
    // out through the basement door instead of the wall: 小彩 is still in there, and the old partner has gone back in
    const viaDoor = prev === 'basement' && !again && !NET.on && STATE === 'play' && leader && leader.pos.z < -470;
    this.prep(); if (!party.includes(chars.cham) && prev !== 'basement') joinCham(); PROTO = Math.max(PROTO, 1); kitchenMode();
    if (viaDoor) {
      KS.viaDoor = true; if (STATE === 'play') unlockKey('prologue');
      const g = chars.gecko; if (!mom.said.lead) { for (let i = NPCW.length - 1; i >= 0; i--) if (NPCW[i].C === g) NPCW.splice(i, 1); g.pos.set(-22, 4, -6).add(HO); g.yaw = .9; } g.wave = false;
      toast('出咗地庫門！呢度係屋後走廊——太太返咗上廚房煮飯，唔會再落地庫', 4.2);
    } else if (!again) { chars.gecko.wave = false; toast('穿過老鼠洞就是廚房。這裡開始，太太、女兒和貓都可能看見你', 4); }
  },
  npc(dt) { if (STATE === 'play' || STATE === 'fail' || STATE === 'end' || STATE === 'frozen') { updKitchenMom(dt); updKid(dt); updCat(dt); } },
  detect: detectKitchen,
  update(dt) {
    lvT += dt; updKitchenPlayer(dt); updCookie(); hxTick(dt); upTick(dt); mpChecklist();
    if (KS.ch3 && !KS.mp && QUESTS === SP_Q2B && quest === 0 && STATE === 'play' && leader.pos.y > UPS.y - 2 && leader.pos.x > 312 && leader.pos.x < 900 && Math.abs(leader.pos.z) < 232) { setQuest(1); roomBanner('女兒房'); setTimeout(() => say('爸爸', '衣櫃頂……天花嗰度就係閣樓活門。', '#f5f0e6', 3), 1200); }
    scheduleLines(KS.mp ? KLINES_MP : party.includes(chars.cham) ? KLINES_SP : KLINES_SPD, dt);
    if (rnd() < dt * .75) { emit(KS.tap, V3(0, -2, 0), new THREE.Color(.5, .62, .7), .35, .9, 300, 0); setTimeout(() => { if (ZONES.kitchen.near) { for (let i = 0; i < 4; i++) emit(V3(-100, 68.9, -193), V3(R(-6, 6), R(5, 12), R(-6, 6)), new THREE.Color(.5, .62, .72), .2, .35, 200, 1); if (leader.pos.distanceTo(V3(-100, 68, -193)) < 120) SND.drip(); } }, 420); }
  },
  win() {
    if (KS.mp) { livingHost(); return; }
    const W = KS.carried ? leader : null; if (!W || KS.ch2) return;
    const home = Math.hypot(W.pos.x + 296, W.pos.z + 100) < 9 && W.pos.y < 3 && STATE === 'play';
    if (home && party.some(C => C.frozen)) { if (!KS.said.leftToy || T - KS.said.leftToy > 6) { KS.said.leftToy = T; toast('還有隊友是玩具！先把他救回來，不能丟下任何人', 3.4); } return; }
    if (home) {
      // chapter one is done — but nothing stops: the story just carries on into the living room
      KS.carried = false; KS.coreDrop = null; KS.home = true; KS.core.position.set(-306, 1.6, -100); KS.ch2 = true;
      QUESTS = SP_Q2; setQuest(0); roomBanner('核心找回來了'); unlockKey('ch1');
      if (KS.viaDoor && !KS.metWall) say('？？？', '（牆入面有把聲）……教授？係你？放喺洞口就得，我幫你睇住佢。', '#b7d38a', 3.8);
      else say('前拍檔', '（從牆裡）放在洞口就好，我看着它。……它的光越來越弱了。', '#b7d38a', 3.6);
      setTimeout(() => say('爸爸', '客廳的遙控器裡有電池。去拿過來，幫核心充電。', '#f5f0e6', 3.4), 3800);
      setTimeout(() => roomBanner('客廳'), 7600);
    }
  },
  marker() {
    const t = toyMarker(); if (t) return t;
    if (KS.mp) return mpMarker();
    if (KS.ch3) { const L = leader; if (quest === 0) return L.pos.y < 150 ? V3(788, 2, -250) : V3(866, UPS.y + 2, -238); return L.pos.y < UPS.y + 195 ? V3(880, UPS.y + 202, 140) : RF.cordP.clone().add(V3(0, 4, 0)); }
    if (KS.ch2) return quest === 0 ? V3(LIV.wedge.cx, 4, LIV.wedge.cz) : (LIV.remoteGot ? null : V3(LIV.remote.cx, 46, LIV.remote.cz));
    if (KS.coreDrop) return KS.coreDrop; return quest >= 2 ? STATIC.home : (KS.coreGot ? null : V3(212, 2, -194));
  },
  reset() { if (KS.coreGot && !KS.carried) KS.coreDrop = KS.home ? null : coreGround(KS.coreDrop || KS.core.position); else KS.coreDrop = null; KS.carrier = null; KM.mode = 'goto'; KM.pt = 'stove'; KS.doorTarget = 0; KS.closeT = 0; CAT.mode = 'home'; KID.mode = 'read'; KID.t = 6; if (HB.m) { HB.m.q = []; HB.m.cur = null; HB.m.seat = null; HB.m.react = 0; } HB.search = 0; if (KS.carried) { const C = leader; KS.core.position.set(C.pos.x, C.pos.y + 6, C.pos.z); } },
  eyeText: () => brainEyeText(),
  hint(L) {
    const bh = backHint(L) || winHint(L); if (bh) return bh;
    // the vent to the garage (single player): rusted shut — say so, and where the way on is
    if (!KS.mp && !LIV.ventOpen && Math.hypot(L.pos.x - 896, L.pos.z + 200) < 26 && L.pos.y < 40) return KS.ch3 ? '通風口個蓋鏽死咗。行樓上：女兒房衣櫃頂有條拉繩通去閣樓' : '通風口個蓋鏽死咗，推唔開——車房要第二條路先去到';
    // the ways up into the ceiling duct: the hot air over the burner, and the bathroom fan's pull cord
    const hood = HX.id.hood, bl = HX.id.blight;
    if (hood && L.pos.x > -2 && L.pos.x < 78 && L.pos.z > -220 && L.pos.z < -172 && L.pos.y > 157 && L.pos.y < 186) return hood.on ? '抽油煙機開住，風扇擋住煙囱。行去右邊撳「用」熄咗佢' : '貼住後面嘅牆向上爬，煙囱上面就係天花風槽';
    if (hood && !L.climbing && L.pos.y > 82 && L.pos.y < 100 && Math.hypot(L.pos.x - 57, L.pos.z + 205) < 55) return '後面著緊火嘅細爐頭有熱風：行入去，熱風會托你上抽油煙機';
    if (bl && L.pos.y < 120 && L.pos.x > 150 && L.pos.x < 460 && L.pos.z > -470 && L.pos.z < -244 && Math.hypot(L.pos.x - 366, L.pos.z + 312) < 60 && !L.climbing) return bl.on ? '抽氣扇轉緊。捉住條拉繩一拉，燈同扇都會熄' : '跳入洗衣籃，捉住抽氣扇條拉繩爬上天花風槽';
    if (inFridge(L) && Math.hypot(L.pos.x - 174, L.pos.z + 168) < 22 && Math.abs(L.pos.y - 86) < 6) { const s = fridgeChillLeft(); if (s) return `新嘅 Prototype 凍緊：門閂住再等 ${s} 秒`; if (PROTO >= PROTO_COLD) return '身上最多帶 2 支 Prototype——用完先返嚟攞'; }
    for (const id in SEALS) if (steelIn(id) && L.pos.y < 12 && Math.abs(L.pos.x - SEALS[id].x) < 14 && L.pos.z > -262 && L.pos.z < -214) return L.id === 'dad' ? '鋼絲球塞實咗個窿——用尺寸槍對準佢縮細，佢就會跌出嚟' : '鋼絲球塞實咗個窿，老友都撞唔開——換爸爸用尺寸槍縮細佢';
    const fr = HX.id.fridge; if (fr && !fr.on && KS.doorA < .3 && L.pos.y < 12 && L.pos.x > 140 && L.pos.x < 240 && L.pos.z > -150 && L.pos.z < -125) return L.id === 'bear' ? '老友：撳「用」用力拉開雪櫃門' : '雪櫃門好實——換老友（熊）嚟拉開';
    const mh = HX.id.mhcover;
    if (mh && !mh.on && L.pos.y < 9 && L.pos.x > 326 && L.pos.x < 344 && L.pos.z > -248 && L.pos.z < -233) return '另一邊有塊踢腳線蓋擋住——要由客廳嗰邊拆開';
    if (!L.climbing && L.pos.y > 140 && L.pos.y < 150 && L.pos.x > 618 && L.pos.x < 722 && L.pos.z > -232 && L.pos.z < -184) return '牆上個通風口個蓋甩咗——爬上去，入面條槽通上天花風槽';
    if (TOUCH) return '';
    if (L.id === 'bear' && !KS.said.bearhint && L.pos.y > 80) { return '熊可以把檯面上的瓶子推下去，製造聲音引開別人'; }
    return '';
  },
  onSwitch() { }
};
// single player and online co-op tell different stories in the same rooms
function kitchenMode() {
  KS.mp = NET.on;
  // online games now come up through the wall, so the grate over the shaft only closes for games that started in the kitchen
  const shut = KS.mp && !PRO.used; if (KS.grate) { KS.grate.g.visible = shut; KS.grate.c.y0 = shut ? 0 : -999; KS.grate.c.y1 = shut ? .6 : -998; }
  if (KS.core) KS.core.visible = !KS.mp;
  for (const p of LIV.parts) { const on = KS.mp && !p.got; p.g.visible = on; p.halo.visible = on; }
  if (KS.mp && QUESTS !== MP_QUESTS && !PRO.on) { QUESTS = MP_QUESTS; LEVELS.kitchen.quests = MP_QUESTS; setQuest(0); }
}
LEVELS.basement = {
  chapter: '第一章', title: '屋企', room: '地庫實驗室', house: true, env: 'basement', envI: .85, fog: DAY ? [0x1e2026, .00105] : [0x0a0d12, .00135], expo: 1.3, dust: {},
  build() { buildRoom(); buildLights(); },
  afterShift(o) { machine.x += o.x; machine.y += o.y; machine.z += o.z; },
  cps: CPS_B, quests: BASE_Q, spawn() { placeStart(); },
  // online, nobody is home in the basement: no wife, no timer, no getting caught
  npc(dt) { if (NET.on) return; if (STATE === 'play' || STATE === 'fail' || STATE === 'end' || STATE === 'frozen') updMom(dt); }, detect(dt) { if (NET.on) { meter = 0; return; } updDetect(dt); }, update(dt) { updTrap(); }, win() { if (!NET.on) winBasement(); },
  marker() { if (NET.on) return proMarker(); return quest === 3 ? V3(70, 6, 15).add(HO) : quest >= 1 ? V3(-300, 7, 150).add(BO) : null; }, reset() { momReset(); },
  eyeText: () => NET.on ? '地庫今日沒有人' : meter > .3 ? '她在看這邊！快躲起來' : mom.mode === 'door' ? '樓上的門打開了' : '太太在地庫', hint: () => ''
};
LVL = LEVELS.basement;
