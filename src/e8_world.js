
// =====================================================================
//  ONE CONTINUOUS WORLD — no loading screens between places
//  Every place (basement lab, the wall, kitchen + living room …) is built once at start-up into one
//  shared coordinate space and joined by real tunnels and doors: you just walk (or climb) from one to
//  the next. To keep that cheap:
//   · only places near the camera are drawn;
//   · a small fixed pool of real lights is re-aimed at the nearest lamps every frame, so the number of
//     lights never changes and shaders never recompile mid-game;
//   · collision queries only look at the colliders of the place they happen in;
//   · fog / exposure / reflections blend over when the camera moves between places.
//  World layout (the kitchen sits at the origin, everything else hangs off it):
//   basement lab   = its old coordinates + BO  (directly under the kitchen)
//   the wall (hub) = its old coordinates + HO  (a cavity running from the basement floor up to the kitchen floor)
// =====================================================================
const BO = V3(28, -336, -229), HO = V3(-400, -340, -94); let MP_CPS = null;
const ZONES = {}, ZL = []; let WORLD = false;
function zoneDef(id, o) { const Z = Object.assign({ id, off: V3(), core: [], lv: null, fx: null, cols: [], lights: [], beams: [], dust: null, env: null, near: false, prepped: false }, o); ZONES[id] = Z; ZL.push(Z); return Z; }
zoneDef('kitchen', { floor: 0, core: [[-312, 912, -12, 300, -250, 250], [-432, -312, -2, 40, -126, -74], [140, 475, -12, 262, -485, -230], [10, 380, 255, 300, -336, -192], [306, 912, 255, 560, -250, 250], [736, 912, -12, 560, -512, -240]], peek: [[930, 1060, -40, 60, -260, -120]], env: 'kitchen' });
// peek: spots in other places from which you can see in (through a mouse hole) — draw this place too
zoneDef('wall', { floor: HO.y + 4, off: HO, core: [[-530, -312, -360, -2, -140, -52]], peek: [[-282, -140, -345, -250, -160, 10], [-312, -160, -12, 90, -200, 0]], env: 'hub' });
zoneDef('garage', { floor: -20, core: [[912, 1460, -40, 300, -270, 312]], peek: [[820, 912, -10, 70, -240, -150], [1460, 1640, -40, 120, 20, 200]], env: 'garage' });
zoneDef('yard', { floor: -20, core: [[1460, 2770, -40, 1000, -460, 660]], peek: [[-400, 3500, -80, 1000, 660, 1700]], env: 'yard' });
zoneDef('road', { floor: -35, core: [[-340, 3500, -80, 1000, 660, 1700], [-340, 1460, -80, 1000, 262, 660]], peek: [[1460, 2770, -40, 1000, 260, 660], [-340, 3500, -80, 1000, 1700, 2500]], env: 'road' });
zoneDef('park', { floor: -20, core: [[-340, 3500, -80, 1000, 1700, 3760]], peek: [[-340, 3500, -80, 1000, 1180, 1700]], env: 'park' });
zoneDef('basement', { floor: BO.y, off: BO, core: [[-312, 338, -360, -60, -549, 33], [-282, -160, -60, 150, -549, -245]], peek: [[-390, -312, -345, -295, -130, -50]], env: 'basement' });
function inZone(Z, x, y, z, m = 0) { for (const b of Z.core) if (x > b[0] - m && x < b[1] + m && y > b[2] - m && y < b[3] + m && z > b[4] - m && z < b[5] + m) return true; return false; }
// floor height of the place a point is in (the kitchen sits at 0, the basement and the wall far below)
function zoneFloor(p) { if (!WORLD) return 0; const Z = zoneAt(p, 2) || ZONES[LEVEL]; return Z ? Z.floor : 0; }
function zoneAt(p, m = 0) { for (const Z of ZL) if (inZone(Z, p.x, p.y, p.z, m)) return Z; return null; }

// ---------- building ----------
function shiftCol(c, o) { if (c.t === 'b') { c.x0 += o.x; c.x1 += o.x; c.z0 += o.z; c.z1 += o.z; } else { c.x += o.x; c.z += o.z; } c.y0 += o.y; c.y1 += o.y; }
function shiftAny(v, o) { if (!v || typeof v !== 'object' || v.isObject3D) return; if (v.isVector3) { v.add(o); return; } if (typeof v.x === 'number' && typeof v.z === 'number') { v.x += o.x; v.z += o.z; if (typeof v.y === 'number') v.y += o.y; } }
function buildZone(Z) {
  const D = LEVELS[Z.id];
  const n0 = { c: cols.length, r: resizables.length, b: batteries.length, v: VIALS.length, cr: CRUMBS.length, st: new Set(Object.keys(STATIC)) };
  LV = new THREE.Group(); LV.name = 'zone-' + Z.id; scene.add(LV); LVFX = new THREE.Group(); fxGroup.add(LVFX); beams = []; dust = null;
  Z.lv = LV; Z.fx = LVFX; Z.beams = beams;
  D.build(); padBeams(); buildDust(D.dust || {}); Z.dust = dust;
  const o = Z.off;
  if (o.lengthSq() > 0) {
    for (const ch of LV.children) ch.position.add(o);
    for (const ch of LVFX.children) { if (ch === dust) ch.geometry.translate(o.x, o.y, o.z); else ch.position.add(o); }
    for (let i = n0.c; i < cols.length; i++) shiftCol(cols[i], o);
    for (let i = n0.r; i < resizables.length; i++) { const r = resizables[i]; r.cx += o.x; r.cz += o.z; r.y0 += o.y; applyResize(r); }
    for (const [A, n] of [[batteries, n0.b], [VIALS, n0.v], [CRUMBS, n0.cr]]) for (let i = n; i < A.length; i++) { const q = A[i]; q.x += o.x; q.y += o.y; q.z += o.z; }
    for (const b of beams) b.o.add(o);
    for (const k of Object.keys(STATIC)) if (!n0.st.has(k)) shiftAny(STATIC[k], o);
    if (D.cps) D.cps = D.cps.map(p => [p[0] + o.x, p[1] + o.y, p[2] + o.z]);
    if (D.afterShift) D.afterShift(o);
  }
  Z.envTex = buildEnv(Z.env);
}
async function buildWorld(prog) {
  if (WORLD) return;
  for (const id of ['basement', 'wall', 'kitchen', 'garage', 'yard', 'road', 'park', 'portal']) { if (prog) await prog(id); buildZone(ZONES[id]); }
  ZONES.garage.prepped = ZONES.yard.prepped = ZONES.road.prepped = ZONES.park.prepped = true;
  MP_CPS = [...LEVELS.kitchen.cps, ...LEVELS.garage.cps, ...LEVELS.yard.cps, ...LEVELS.road.cps, ...LEVELS.park.cps];
  ncPlace();
  for (let i = furMeshes.length - 1; i >= 0; i--) if (!inScene(furMeshes[i])) furMeshes.splice(i, 1);
  buildHouseShell(); autoProps(); autoSolid(); if (PK.mergeLater) { PK.merged = mergeZoneStatic(...PK.mergeLater); PK.mergeLater = null; } flushDecoLater(); for (const r of resizables) r.init = [r.cx, r.cz, r.y0]; partitionCols(); setupLightPool(); WORLD = true;
}

// ---------- colliders: each place keeps its own list (plus anything within 60 cm of it) ----------
const CMARGIN = 60;
function colZonesFor(c) { if (c.zone) return [ZONES[c.zone]]; const b = colBounds(c); const out = []; for (const Z of ZL) for (const q of Z.core) if (b[0] < q[1] + CMARGIN && b[1] > q[0] - CMARGIN && b[2] < q[3] + CMARGIN && b[3] > q[2] - CMARGIN && b[4] < q[5] + CMARGIN && b[5] > q[4] - CMARGIN) { out.push(Z); break; } return out; }
function partitionCols() {
  for (const Z of ZL) Z.cols = [];
  for (const c of cols) for (const Z of colZonesFor(c)) Z.cols.push(c);
  // colliders created later (the cat, things that get added while playing) are filed as they come in
  cols.push = function (...a) { const n = Array.prototype.push.apply(this, a); for (const c of a) for (const Z of colZonesFor(c)) Z.cols.push(c); return n; };
}
// the colliders worth testing around a point
function colsNear(x, y, z) { if (!WORLD) return cols; for (const Z of ZL) for (const b of Z.core) if (x > b[0] && x < b[1] && y > b[2] && y < b[3] && z > b[4] && z < b[5]) return Z.cols; return cols; }

// ---------- light pool ----------
// A fixed set of real lights (so shaders never recompile) is pointed at the lamps that matter most for
// what the camera sees. Choices are re-made a few times a second, a lamp only loses its slot to a clearly
// stronger one, and swaps fade — so lights never pop or flicker as you move.
const LP = { grp: new THREE.Group(), pt: [], sh: [], sp: [], hemi: null, snap: true, t: 0, want: null, frame: 0 };
function setupLightPool() {
  scene.add(LP.grp);
  for (const Z of ZL) { Z.lights = []; for (const g of [Z.lv, Z.fx]) g.traverse(o => { if (o.isLight) { Z.lights.push(o); o.visible = false; } }); }
  const NP = TOUCH ? 5 : 9, NS = TOUCH ? 2 : 3;
  for (let i = 0; i < NP; i++) { const l = new THREE.PointLight(0xffffff, 0, 0, 2); LP.grp.add(l); LP.pt.push({ l, cur: null, f: 0 }); }
  for (let i = 0; i < NS; i++) {
    const l = new THREE.SpotLight(0xffffff, 0, 0, .5, .5, 2); l.castShadow = true; l.shadow.mapSize.setScalar(1024); l.shadow.autoUpdate = false; LP.grp.add(l, l.target); LP.sh.push({ l, cur: null, f: 0 });
  }
  { const l = new THREE.SpotLight(0xffffff, 0, 0, .5, .5, 2); LP.grp.add(l, l.target); LP.sp.push({ l, cur: null, f: 0 }); }
  LP.hemi = new THREE.HemisphereLight(0x606070, 0x302820, 0); LP.grp.add(LP.hemi);
}
const _lw = V3(), _lt = V3();
function lightScore(l, cp, lp) { if (l.userData.prio) return 1e6; l.getWorldPosition(_lw); const d2 = Math.min(_lw.distanceToSquared(cp), _lw.distanceToSquared(lp)); const c = l.color; return l.intensity * (c.r * .3 + c.g * .55 + c.b * .15) / (d2 + 900); }
function poolAssign(slots, want, dt, copy) {
  const N = slots.length, sc = new Map(want.map(e => [e.l, e.sc])), top = want.slice(0, N);
  for (const s of slots) if (s.cur && !s.out && !sc.has(s.cur)) s.out = true;   // gone dark or out of reach
  const used = new Set(); for (const s of slots) if (s.cur) used.add(s.cur);
  for (const e of top) {
    if (used.has(e.l)) continue;
    let s = slots.find(q => !q.cur);
    if (!s) {   // only give up a slot for a clearly stronger lamp
      let weak = null; for (const q of slots) if (q.cur && !q.out && (!weak || (sc.get(q.cur) || 0) < (sc.get(weak.cur) || 0))) weak = q;
      if (weak && e.sc > (sc.get(weak.cur) || 0) * 1.6) weak.out = true;
      continue;
    }
    s.cur = e.l; s.f = LP.snap ? 1 : 0; s.out = false; s.fresh = true; used.add(e.l);
  }
  for (const s of slots) {
    if (s.out) { s.f -= dt * 3; if (s.f <= 0 || LP.snap) { s.cur = null; s.f = 0; s.out = false; } }
    else if (s.cur) s.f = Math.min(1, s.f + dt * 3);
    copy(s);
  }
}
function copyPoint(s) {
  const l = s.l, v = s.cur; if (!v) { l.intensity = 0; return; }
  v.getWorldPosition(l.position); l.color.copy(v.color); l.intensity = v.intensity * s.f; l.distance = v.distance; l.decay = v.decay;
}
function copySpot(s) {
  const l = s.l, v = s.cur;
  if (!v) { l.intensity = 0; if (l.castShadow) l.shadow.autoUpdate = false; return; }
  v.getWorldPosition(l.position); v.target.getWorldPosition(_lt); l.target.position.copy(_lt); l.target.updateMatrixWorld();
  l.color.copy(v.color); l.intensity = v.intensity * s.f; l.distance = v.distance; l.decay = v.decay; l.angle = v.angle; l.penumbra = v.penumbra;
  if (l.castShadow) {
    const sh = l.shadow, vs = v.shadow;
    if (s.fresh) {
      s.fresh = false; const ms = TOUCH ? 1024 : vs.mapSize.x;
      if (sh.mapSize.x !== ms) { sh.mapSize.setScalar(ms); if (sh.map) { sh.map.dispose(); sh.map = null; } }
      sh.bias = vs.bias * (TOUCH ? 1.6 : 1); sh.normalBias = vs.normalBias * (TOUCH ? 1.8 : 1); sh.radius = TOUCH ? 3 : 1; sh.camera.near = vs.camera.near; sh.camera.far = vs.camera.far; sh.camera.updateProjectionMatrix(); sh.needsUpdate = true;
    }
    const live = vs.autoUpdate && v.castShadow;
    // phones redraw shadows every other frame
    if (TOUCH) { sh.autoUpdate = false; if (live && (LP.frame & 1)) sh.needsUpdate = true; } else sh.autoUpdate = live;
    if (vs.needsUpdate) { sh.needsUpdate = true; vs.needsUpdate = false; }
  }
}
function lightTick(dt) {
  LP.frame++; LP.t -= dt;
  if (LP.t <= 0 || LP.snap || !LP.want) {
    LP.t = .16; const cp = camera.position, lp = leader ? leader.pos : cp; const pts = [], shs = [], sps = [];
    for (const Z of ZL) if (Z.near) for (const l of Z.lights) {
      if (l.isHemisphereLight || !(l.intensity > 0)) continue;
      // lamps from a neighbouring place only count when they are close (e.g. right through the mouse hole)
      if (Z !== WC.cz) { l.getWorldPosition(_lw); if (_lw.distanceTo(cp) > 150 && _lw.distanceTo(lp) > 150) continue; }
      const e = { l, sc: lightScore(l, cp, lp) };
      if (l.isSpotLight) (l.castShadow ? shs : sps).push(e); else if (l.isPointLight) pts.push(e);
    }
    const ord = a => a.sort((p, q) => q.sc - p.sc);
    LP.want = [ord(pts), ord(shs), ord(sps)];
  }
  poolAssign(LP.pt, LP.want[0], dt, copyPoint); poolAssign(LP.sh, LP.want[1], dt, copySpot); poolAssign(LP.sp, LP.want[2], dt, copySpot);
  // the room's ambient sky light follows the camera
  const Z = WC.cz; const h = Z && Z.lights.find(l => l.isHemisphereLight);
  if (h) { const k = LP.snap ? 1 : 1 - Math.exp(-3 * dt); LP.hemi.color.lerp(h.color, k); LP.hemi.groundColor.lerp(h.groundColor, k); LP.hemi.intensity += (h.intensity - LP.hemi.intensity) * k; }
  LP.snap = false;
}

// ---------- per-frame: what to draw, which place's rules run, atmosphere ----------
const BLOOM_IN = [.42, .95];
const WC = { cz: null, envK: 1, envWant: null, fogC: new THREE.Color(), banner: 0 };
function zoneTick(dt) {
  if (!WORLD) return;
  const cp = camera.position, lp = leader ? leader.pos : cp;
  for (const Z of ZL) { Z.near = inZone(Z, cp.x, cp.y, cp.z, 45) || inZone(Z, lp.x, lp.y, lp.z, 45) || (!!Z.peek && Z.peek.some(b => cp.x > b[0] && cp.x < b[1] && cp.y > b[2] && cp.y < b[3] && cp.z > b[4] && cp.z < b[5])); Z.lv.visible = Z.fx.visible = Z.near; if (Z.npcs) for (const o of Z.npcs) o.visible = Z.near; }
  houseShellTick(); solidTick(); humanLifeTick(dt);
  // atmosphere of the place the camera is in
  const cz = zoneAt(cp) || (leader && zoneAt(leader.pos)) || WC.cz || ZONES[LEVEL]; if (cz) WC.cz = cz;
  const D = LEVELS[WC.cz.id]; const k = LP.snap ? 1 : 1 - Math.exp(-2.5 * dt);
  WC.fogC.setHex(D.fog[0]); scene.fog.color.lerp(WC.fogC, k); scene.fog.density += (D.fog[1] - scene.fog.density) * k; renderer.toneMappingExposure += (D.expo - renderer.toneMappingExposure) * k;
  // bloom per place: in the sun almost everything is brighter than the indoor threshold, so outdoors by day only the really bright things (the sun, glints) glow
  const BL = D.bloom || BLOOM_IN; bloom.strength += (BL[0] - bloom.strength) * k; bloom.threshold += (BL[1] - bloom.threshold) * k;
  if (scene.environment !== WC.cz.envTex) { WC.envK = LP.snap ? 0 : WC.envK - dt * 5; if (WC.envK <= 0) { scene.environment = WC.cz.envTex; WC.envK = 0; } }
  else WC.envK = Math.min(1, WC.envK + dt * 3);
  scene.environmentIntensity = D.envI * WC.envK;
  for (const Z of ZL) if (Z.near && Z.dust) { const U = Z.dust.material.uniforms; U.uT.value = T; for (let i = 0; i < 4; i++) U.uBK.value[i] = Z.beams[i] ? Z.beams[i].k : 0; }
  swTick(); lightTick(dt);
  // single player: the rules of the place the leader walks into take over
  if (leader && mine(leader) && (STATE === 'play' || STATE === 'frozen')) {
    const cur = ZONES[LEVEL]; if (!cur || !inZone(cur, lp.x, lp.y, lp.z, 2)) { const nz = zoneAt(lp); if (nz && nz.id !== LEVEL) enterZone(nz.id); }
  }
  updNpcWalk(dt); updBanner(dt); updSecCam(dt); updGarageWorld(dt); updYardWorld(dt); updRoadWorld(dt); updParkWorld(dt); ncTick(dt); testTick();
}
// a place's rules take over (no loading, nothing moves)
function enterZone(id, quiet) {
  const prev = LEVEL, D = LEVELS[id], Z = ZONES[id], P = ZONES[prev];
  if (P && prev !== id) { P.save = { qs: QUESTS, q: quest, cp, lvT }; if (LVL && LVL.leave) LVL.leave(id); }
  LEVEL = id; LVL = D; LV = Z.lv; LVFX = Z.fx; beams = Z.beams; dust = Z.dust; CPS = D.cps;
  const again = !quiet && !!Z.save;   // walking back into a place you've been: carry on where you left off
  if (NET.on && MP_CPS) { if (PRO.on) { CPS = PRO.cps || MP_CPS; QUESTS = MP_PRO; } else { CPS = MP_CPS; QUESTS = MP_QUESTS; } setQuest(quest); if (!quiet && !Z.mpSeen) { Z.mpSeen = true; if (D.mpChapter) chapterBanner(D.mpChapter, D.title); } if (party.length && PORTRAITS.dad) buildPartyHUD(); return; }
  if (again) { QUESTS = Z.save.qs; cp = Z.save.cp; lvT = Z.save.lvT; setQuest(Z.save.q); } else { QUESTS = D.quests; cp = 0; lvT = 0; setQuest(0); }
  if (D.enter) D.enter(prev, again);
  if (!quiet && !again) chapterBanner(D.chapter, D.title);
  if (party.length && PORTRAITS.dad) buildPartyHUD();
}
function onResizeDust(sc) { for (const Z of ZL) if (Z.dust) Z.dust.material.uniforms.uScale.value = sc; }

// people and animals that live in one zone: stood where they belong from the start (not at the world's
// origin, i.e. the middle of the kitchen), and only drawn while that zone is near
function npcHome(root, pos, yaw, zone) { root.position.copy(pos); root.rotation.y = yaw || 0; const Z = ZONES[zone]; if (Z) (Z.npcs = Z.npcs || []).push(root); }

// ---------- small scripted walks for the guide characters ----------
const NPCW = [];
function npcWalk(C, pts, spd = 11, done) { for (let i = NPCW.length - 1; i >= 0; i--) if (NPCW[i].C === C) NPCW.splice(i, 1); NPCW.push({ C, pts: pts.map(p => p.clone ? p.clone() : V3(...p)), i: 0, spd, done }); }
function updNpcWalk(dt) {
  for (let k = NPCW.length - 1; k >= 0; k--) {
    const W = NPCW[k], C = W.C, P = W.pts[W.i]; if (!P) { NPCW.splice(k, 1); C.state = 'idle'; C.spd = 0; W.done && W.done(); continue; }
    const dx = P.x - C.pos.x, dy = P.y - C.pos.y, dz = P.z - C.pos.z, d = Math.hypot(dx, dy, dz), s = W.spd * dt;
    if (d <= s) { C.pos.copy(P); W.i++; } else { C.pos.x += dx / d * s; C.pos.y += dy / d * s; C.pos.z += dz / d * s; }
    if (Math.hypot(dx, dz) > .2) C.yaw = angDamp(C.yaw, Math.atan2(dx, dz), 8, dt);
    C.state = 'walk'; C.spd = W.spd; C.wave = false; if (C.disp) C.disp.copy(C.pos);
  }
}

// ---------- chapter title: fades in over the game, never stops it ----------
function chapterBanner(a, b) { const el = $('chap'); if (!el || !a) return; $('chapA').textContent = a; $('chapB').textContent = b || ''; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); WC.banner = 4.2; }
function updBanner(dt) { if (WC.banner > 0) { WC.banner -= dt; if (WC.banner <= 0) $('chap').classList.remove('on'); } }
