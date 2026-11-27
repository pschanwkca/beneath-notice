// =====================================================================
//  滅蟲公司 — the third step of the mouse war
//  When the family is sure there are mice and their cardboard and steel wool keep failing, Mom phones
//  pest control. A man in green comes in the back door with a torch and a sprayer: round the utility
//  room, down the back hallway, into the storeroom (it isn't safe while he's in there), then the living
//  room (and the kitchen, if its door is open). He puts down cage traps baited with cheese, stuffs both
//  mouse holes with steel wool, and leaves. Seen by him, you're a toy left lying about.
//  Cage traps: walk in for the cheese and the door snaps shut behind you. A teammate beside the cage
//  lifts it (the bear quickest), or keep jumping to rattle it open. The cheese is yours either way.
// =====================================================================
const PEST = { q: [], st: 'off', t: 0, H: null, i: 0, wait: 0, look: V3(), said: {}, done: 0, calledT: -999, door: null, doorA: 0, torch: null, track: 0, trackP: V3(), path: null };
const PEST_NAME = '滅蟲公司師傅', PEST_COL = '#9fd0a8';
const P_IN = [
  { x: 690, z: -590 }, { x: 680, z: -540 },
  { x: 600, z: -470, stop: 2.4, look: [520, 40, -440], line: 'util' },
  { x: 420, z: -556 }, { x: 160, z: -560, stop: 1.8, look: [92, 60, -598] }, { x: 0, z: -560 }, { x: 0, z: -488 },
  { x: -20, z: -380, stop: 3.4, look: [-110, 30, -420], line: 'store', cage: 0 },
  { x: 0, z: -488 }, { x: 0, z: -560 }, { x: 560, z: -556 }, { x: 590, z: -420 }, { x: 578, z: -260 }, { x: 595, z: -150 }, { x: 595, z: -60 }, { x: 520, z: -30 }, { x: 345, z: -40 },
  { x: 345, z: -150, stop: 3.4, look: [335, 4, -232], line: 'living', cage: 1, steel: true }
];
const P_KIT = [{ x: 345, z: -10 }, { x: 268, z: -10 }, { x: 225, z: -40 }, { x: 236, z: -100, stop: 3, look: [200, 10, -150], line: 'kitchen', cage: 2 }, { x: 225, z: -40 }, { x: 268, z: -10 }, { x: 345, z: -10 }];
const P_OUT = [{ x: 520, z: -30 }, { x: 595, z: -60 }, { x: 595, z: -150 }, { x: 578, z: -260 }, { x: 590, z: -420 }, { x: 680, z: -540 }, { x: 690, z: -590, line: 'bye' }];
const PEST_LINES = {
  util: '你好，滅蟲公司。……後面呢度，有老鼠屎。',
  store: '儲物房最多老鼠——米袋要擺高啲。我放個籠先。',
  living: '牆腳呢度有窿。鋼絲球塞實佢，再擺個籠。',
  kitchen: '雪櫃後面暖，老鼠最鍾意。都擺一個。',
  bye: '搞掂。有咩再打電話俾我。'
};
// cage traps (spot, which way the door faces)
const CAGE_SPOTS = [{ x: -60, z: -320, face: 'x+' }, { x: 345, z: -210, face: 'z+' }, { x: 246, z: -126, face: 'x-' }];
const CAGES = [];

// ---------- building (with the kitchen) ----------
function buildPest(K) {
  // the man: green coveralls, a cap, a sprayer tank on his back, a torch
  const cov = new THREE.MeshPhysicalMaterial({ color: 0x3f6a4a, roughness: .85, sheen: .4, sheenColor: 0x8ab89a });
  const H = buildHuman({ pants: cov, top: cov, skin: MAT.skin, shoe: new THREE.MeshStandardMaterial({ color: 0x1e1c1a, roughness: .5 }), cap: new THREE.MeshStandardMaterial({ color: 0x2c4a34, roughness: .7 }), hair: 0x1e1612 });
  const tank = new THREE.Mesh(new THREE.CapsuleGeometry(8, 22, 6, 16), new THREE.MeshPhysicalMaterial({ color: 0xe8c23a, roughness: .4, clearcoat: .5 })); tank.position.set(0, 4, -15); H.chest.add(tank);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(10, .9, 6, 20), MAT.black); strap.position.set(0, 8, -6); strap.rotation.x = Math.PI / 2; H.chest.add(strap);
  const wand = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 30, 8), MAT.dsteel); wand.position.set(0, -20, 4); wand.rotation.x = 1.1; H.arms[0].el.add(wand);
  const torchM = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 16, 14), MAT.dsteel); torchM.position.set(0, -26, 6); torchM.rotation.x = 1.3; H.arms[1].el.add(torchM);
  const lensM = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2e0).multiplyScalar(10) })); lensM.position.set(0, 8.4, 0); torchM.add(lensM); H.lens = lensM;
  H.pos.set(690, 0, -650); H.yaw = 0; H.root.visible = false; PEST.H = H; npcHome(H.root, H.pos, H.yaw, 'kitchen');
  const sp = new THREE.SpotLight(0xfff0dc, 0, 0, .36, .5, 2); sp.castShadow = false; LV.add(sp, sp.target); PEST.torch = sp;
  // the back door swings in for him (the yard beyond is just dark for now)
  const g = new THREE.Group(); g.position.set(650, 0, -610.5); LV.add(g); PEST.door = g;
  const dm = new THREE.MeshStandardMaterial({ color: 0x5a4434, roughness: .6 });
  mesh(new THREE.BoxGeometry(80, 205, 3), dm, 40, 102.5, 0, { parent: g }); mesh(new THREE.BoxGeometry(56, 70, .6), new THREE.MeshPhysicalMaterial({ color: 0x9ab4c8, roughness: .1, transparent: true, opacity: .7 }), 40, 155, 1.7, { parent: g, cast: false });
  mesh(new THREE.SphereGeometry(2.4, 14, 10), K.brass, 72, 100, 3, { parent: g }); g.traverse(o => { if (o.isMesh) o.userData.noSolid = true; });
  box(640, 740, -10, 230, -662, -650, new THREE.MeshBasicMaterial({ color: 0x0b1018 }), { col: false, cast: false });   // night outside
  box(640, 740, -10, 0, -650, -612, new THREE.MeshStandardMaterial({ color: 0x5a5a56, roughness: 1 }), { col: false, cast: false });   // the back step
  cols.push({ t: 'b', x0: 650, x1: 730, y0: 0, y1: 205, z0: -624, z1: -611 });   // (nobody goes out this way yet)
  // the cages, put away until he brings them
  CAGE_SPOTS.forEach((S, i) => CAGES.push(cageBuild(S, i)));
}
function cageBuild(S, i) {
  const wire = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: .8, roughness: .35 });
  const L = 22, W = 13, Hh = 11, g = new THREE.Group(); g.position.set(S.x, 0, S.z); g.rotation.y = { 'x+': 0, 'z-': Math.PI / 2, 'x-': Math.PI, 'z+': -Math.PI / 2 }[S.face]; g.visible = false; LV.add(g);
  // (local: the door end at +x, the cheese at -x)
  const bar = (x0, x1, y0, y1, z0, z1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), wire); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.castShadow = true; m.userData.noSolid = true; g.add(m); return m; };
  bar(-L / 2, L / 2, 0, .6, -W / 2, W / 2);
  for (let x = -L / 2; x <= L / 2 - 1; x += 2.75) { bar(x - .15, x + .15, 0, Hh, -W / 2 - .15, -W / 2 + .15); bar(x - .15, x + .15, 0, Hh, W / 2 - .15, W / 2 + .15); bar(x - .15, x + .15, Hh - .15, Hh + .15, -W / 2, W / 2); }
  for (let z = -W / 2; z <= W / 2; z += 2.6) bar(-L / 2 - .15, -L / 2 + .15, 0, Hh, z - .15, z + .15);
  for (const z of [-W / 2, W / 2]) bar(-L / 2, L / 2, Hh - .2, Hh + .2, z - .2, z + .2);
  const door = new THREE.Group(); door.position.set(L / 2, Hh, 0); g.add(door);   // hinged at the top; up = open
  for (let z = -W / 2 + 1.3; z < W / 2; z += 2.6) { const m = new THREE.Mesh(new THREE.BoxGeometry(.3, Hh, .3), wire); m.position.set(0, -Hh / 2, z); m.userData.noSolid = true; door.add(m); }
  { const m = new THREE.Mesh(new THREE.BoxGeometry(.4, .4, W), wire); m.position.set(0, -Hh + .2, 0); m.userData.noSolid = true; door.add(m); }
  door.rotation.z = 1.45;
  const cheese = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2, 2.6), new THREE.MeshPhysicalMaterial({ color: 0xf2c84a, roughness: .45, clearcoat: .3 })); cheese.position.set(-L / 2 + 3, 1.6, 0); cheese.rotation.y = .4; cheese.userData.noSolid = true; g.add(cheese);
  // colliders (world): the two long sides, the back, the roof; the door only when it's down
  const c = Math.cos(g.rotation.y), s = Math.sin(g.rotation.y);
  const W2 = (lx, lz) => [S.x + lx * c + lz * s, S.z - lx * s + lz * c];
  const aabb = (x0, x1, z0, z1, y0, y1) => { const P = [W2(x0, z0), W2(x1, z0), W2(x0, z1), W2(x1, z1)]; return { t: 'b', x0: Math.min(...P.map(p => p[0])), x1: Math.max(...P.map(p => p[0])), z0: Math.min(...P.map(p => p[1])), z1: Math.max(...P.map(p => p[1])), y0: -999, y1: -998, on: [y0, y1] }; };
  const walls = [aabb(-L / 2, L / 2, -W / 2 - .6, -W / 2 + .4, 0, Hh), aabb(-L / 2, L / 2, W / 2 - .4, W / 2 + .6, 0, Hh), aabb(-L / 2 - .6, -L / 2 + .4, -W / 2, W / 2, 0, Hh), aabb(-L / 2, L / 2, -W / 2, W / 2, Hh - .3, Hh + .3)];
  const dcol = aabb(L / 2 - .4, L / 2 + .6, -W / 2, W / 2, 0, Hh);
  for (const q of [...walls, dcol]) cols.push(q);
  return { i, S, g, door, cheese, walls, dcol, L, W, Hh, c, s, shut: false, bait: true, by: null, k: 0 };
}
// HX entries so where the cages are is the same on every machine (added with the house's switches)
function pestSwitches() { CAGE_SPOTS.forEach((_, i) => hxAdd({ id: 'cage' + i, name: '捕鼠籠', kind: 'cage', noUse: true, quiet: true, p: V3(CAGE_SPOTS[i].x, 1, CAGE_SPOTS[i].z), r: 0, on: false, verb: ['', ''] })); }
function cageApply(o) {
  const K = CAGES[+o.id.slice(4)]; if (!K) return; K.g.visible = o.on;
  for (const q of K.walls) { q.y0 = o.on ? q.on[0] : -999; q.y1 = o.on ? q.on[1] : -998; }
  if (o.on) { K.shut = false; K.bait = true; K.by = null; K.cheese.visible = true; } else { K.dcol.y0 = -999; K.dcol.y1 = -998; }
}
// inside the cage (cage-local), past the middle = at the cheese
function cageLocal(K, p) { const dx = p.x - K.S.x, dz = p.z - K.S.z; return [dx * K.c - dz * K.s, dx * K.s + dz * K.c]; }

// ---------- the cages, every frame ----------
function cageTick(dt) {
  for (const K of CAGES) {
    K.door.rotation.z = damp(K.door.rotation.z, K.shut ? 0 : 1.45, K.shut ? 18 : 4, dt);
    K.dcol.y0 = K.g.visible && K.shut ? 0 : -999; K.dcol.y1 = K.g.visible && K.shut ? K.Hh : -998;
    if (!K.g.visible) continue;
    for (const C of party) {
      if (C.frozen || !mine(C)) continue;
      const [lx, lz] = cageLocal(K, C.pos), inside = Math.abs(lz) < K.W / 2 - .3 && lx > -K.L / 2 && lx < K.L / 2 && C.pos.y < K.Hh - 1;
      if (!K.shut && K.bait && inside && lx < 0) {   // snap!
        K.shut = true; K.bait = false; K.by = C.id; K.k = 1; K.cheese.visible = false; C.caged = K;
        if (C.stamMax < 100) { C.stamMax = Math.min(100, C.stamMax + 10); } C.stamina = Math.min(C.stamMax, C.stamina + 30);
        SND.snap && SND.snap(); tone(900, 300, .12, .08, 'square'); cam.shake = Math.max(cam.shake, .35);
        if (C === leader) toastW('啪！捕鼠籠閂咗——芝士係你嘅，但出唔到。叫隊友嚟掀起道門，或者不停撳跳搖開佢', 4);
        if (NET.on) nsend({ t: 'cage', i: K.i, s: 1 });
        humanSus(.15, '捕鼠籠閂咗');
      }
    }
    if (!K.shut) continue;
    const C = K.by && chars[K.by];
    if (!C || C.frozen || C.caged !== K) { if (C && C.caged === K) C.caged = null; cageOpen(K, true); continue; }
    // someone outside lifting the door
    const helper = party.find(F => F !== C && !F.frozen && !F.caged && Math.hypot(F.pos.x - K.S.x, F.pos.z - K.S.z) < K.L / 2 + 7 && Math.abs(F.pos.y - C.pos.y) < 6);
    if (helper) K.k -= dt / (helper.id === 'bear' ? .7 : 1.8);
    if (C !== leader && !helper) K.k -= dt / 25;   // an AI teammate rattles itself out, given time
    if (K.k <= 0) cageOpen(K, true);
  }
  // a caged player: kept inside, jumping rattles the door
  const L = leader; if (L && L.caged && mine(L)) { const K = L.caged; if (!K.shut) L.caged = null;
    else if (L.vel.y > 20 && L.grounded === false && !L.cagedJump) { L.cagedJump = true; K.k -= .085; L.stamina = Math.max(0, L.stamina - 5); for (let i = 0; i < 4; i++) emit(V3(L.pos.x, L.pos.y + 3, L.pos.z), V3(R(-6, 6), R(3, 9), R(-6, 6)), new THREE.Color(.8, .82, .86), R(.12, .2), R(.3, .5), 120, 1); tone(1400, 1100, .05, .04, 'square'); }
    if (L.grounded) L.cagedJump = false; }
}
function cageOpen(K, local) {
  if (!K.shut) return; K.shut = false; const C = K.by && chars[K.by]; if (C && C.caged === K) C.caged = null; K.by = null;
  SND.swish && SND.swish(); if (local && NET.on) nsend({ t: 'cage', i: K.i, s: 0 });
  if (C && (C === leader || local)) toastW(`${C.S.name}出返嚟喇！`, 1.8);
}
function cageRecv(d) { const K = CAGES[d.i]; if (!K) return; if (d.s) { K.shut = true; K.bait = false; K.cheese.visible = false; K.k = 1; } else cageOpen(K, false); }

// ---------- the visit ----------
function pestWant() {
  if (NET.client || PEST.st !== 'off' || LEVEL !== 'kitchen' || STATE !== 'play' || T - PEST.calledT < 300) return false;
  const out = Object.values(HB.steelOut || {}).reduce((a, b) => a + b, 0);
  return (out > 0 && susV() >= .7) || HUM.bel >= .75;
}
function pestTick(dt) {
  if (!PEST.H) return;
  cageTick(dt);
  if (NET.client) { pestPose(dt, PEST.netMove || 0); return; }
  for (let i = PEST.q.length - 1; i >= 0; i--) { const a = PEST.q[i]; a.t -= dt; if (a.t <= 0) { PEST.q.splice(i, 1); a.fn(); } }   // (things he does a moment after he gets somewhere, in game time)
  if (pestWant()) { PEST.st = 'called'; PEST.t = 40; PEST.calledT = T; brainSay('mom', '唔得……我打電話叫滅蟲公司嚟。', 3); PEST.q.push({ t: 1.6, fn: () => toastW('太太叫咗滅蟲公司——大約 40 秒後，師傅會由洗衣間後門入嚟', 4.2) }); }
  if (PEST.st === 'called') { PEST.t -= dt; if (PEST.t <= 0) pestArrive(); return; }
  if (PEST.st === 'off') { PEST.doorA = damp(PEST.doorA, 0, 3, dt); if (PEST.door) PEST.door.rotation.y = -PEST.doorA; return; }
  const H = PEST.H, P = H.pos; let moveD = 0;
  const atDoor = Math.hypot(P.x - 690, P.z + 600) < 70; PEST.doorA = damp(PEST.doorA, atDoor ? 1.3 : 0, 3, dt); PEST.door.rotation.y = -PEST.doorA;
  if (PEST.track > 0) {   // something caught his eye
    PEST.track -= dt; H.yaw = angDamp(H.yaw, Math.atan2(PEST.trackP.x - P.x, PEST.trackP.z - P.z), 2.2, dt); H.aimT.copy(PEST.trackP);
    if (PEST.track <= 0 && (!PEST.said.lost || T - PEST.said.lost > 20)) { PEST.said.lost = T; sayW(PEST_NAME, '……睇錯？', PEST_COL, 2); }
  } else if (PEST.wait > 0) {
    PEST.wait -= dt; const la = PEST.look; H.yaw = angDamp(H.yaw, Math.atan2(la.x - P.x, la.z - P.z), 2.5, dt); const sw = Math.sin(T * 1.1) * 30; H.aimT.set(la.x + Math.cos(H.yaw) * sw, la.y, la.z - Math.sin(H.yaw) * sw);
    if (PEST.wait <= 0) PEST.i++;
  } else {
    const n = PEST.path[PEST.i];
    if (!n) { pestLeave(); return; }
    const dx = n.x - P.x, dz = n.z - P.z, d = Math.hypot(dx, dz), sp = 60 * dt;
    if (d < sp + .5) { P.x = n.x; P.z = n.z; moveD = d; pestArrived(n); }
    else { P.x += dx / d * sp; P.z += dz / d * sp; moveD = sp; H.yaw = angDamp(H.yaw, Math.atan2(dx, dz), 5, dt); }
    const fx = Math.sin(H.yaw), fz = Math.cos(H.yaw); H.aimT.set(P.x + fx * 150, 4, P.z + fz * 150);
  }
  P.y = 0; pestPose(dt, moveD);
}
function pestArrive() {
  const H = PEST.H; PEST.st = 'in'; PEST.i = 0; PEST.wait = 0; PEST.track = 0; PEST.said = {};
  PEST.path = [...P_IN, ...(LIV.open ? P_KIT : []), ...P_OUT];
  H.pos.set(690, 0, -640); H.yaw = 0; H.root.visible = true; SND.creak && SND.creak();
  if (leader && Math.hypot(leader.pos.x - 690, leader.pos.z + 600) < 500) toastW('後門開咗——滅蟲師傅入咗嚟！', 3);
}
function pestArrived(n) {
  if (n.line) sayW(PEST_NAME, PEST_LINES[n.line], PEST_COL, 3.4);
  if (n.line === 'store' && leader && (inStore(leader.pos) || leader.pos.z < -480) && !PEST.said.storeWarn) { PEST.said.storeWarn = 1; PEST.q.push({ t: .6, fn: () => toast('師傅入咗儲物房——呢度而家唔安全！', 3) }); }
  if (n.cage !== undefined) PEST.q.push({ t: 2, fn: () => { if (PEST.st === 'in') hxSet(HX.id['cage' + n.cage], true, 'pest'); } });
  if (n.steel) PEST.q.push({ t: 2.6, fn: () => { if (PEST.st !== 'in') return; for (const id in SEALS) { if (HX.id[id] && HX.id[id].on) hxSet(HX.id[id], false, 'pest'); steelPlug(id); } } });
  if (n.stop) { PEST.wait = n.stop; PEST.look.set(...n.look); } else PEST.i++;
}
function pestLeave() {
  PEST.st = 'off'; PEST.H.root.visible = false; PEST.H.pos.set(690, 0, -650); PEST.done++;
  HUM.bel = Math.min(HUM.bel, .2); HUM.v = Math.min(HUM.v, .6); HB.steelOut = {}; HB.sealBroke = {};
  PEST.q.push({ t: 1.5, fn: () => brainSay('mom', '師傅搞掂咗……希望冇事啦。', 2.6) });
}
function pestPose(dt, moveD) {
  const H = PEST.H; if (!H.root.visible) { PEST.torch.intensity = 0; PEST.torch.userData.prio = false; return; }
  H.aim.lerp(H.aimT, 1 - Math.exp(-3 * dt));
  const step = humanAnim(H, moveD, dt); humanAimArm(H, 1, dt);
  const lp = V3(); H.lens.getWorldPosition(lp); const dir = V3().subVectors(H.aim, lp).normalize(); H.lightPos = lp; H.lightDir = dir;
  PEST.torch.position.copy(lp); PEST.torch.target.position.copy(lp).addScaledVector(dir, 100); PEST.torch.intensity = 80000; PEST.torch.userData.prio = true;
  if (step && leader && LEVEL === 'kitchen') {
    const fp = V3(); H.legs[Math.floor(H.phase / Math.PI) % 2 === 0 ? 0 : 1].ankle.getWorldPosition(fp); const dist = Math.hypot(leader.pos.x - fp.x, leader.pos.y, leader.pos.z - fp.z);
    SND.thud(clamp(1.15 - dist / 420, .08, 1)); cam.shake = Math.max(cam.shake, clamp(1 - dist / 260, 0, 1) * .8);
    for (const C of party) if (mine(C) && !C.frozen && !C.caged && STATE === 'play' && Math.hypot(C.pos.x - fp.x, C.pos.z - (fp.z + 4)) < 14 && C.pos.y < 8) knock(C, fp, C === leader ? '差點被踩扁！' : null);
  }
}
// his eyes, for the kitchen's detection (same rules as the family's)
function pestSee() { return PEST.st === 'in' && PEST.H && PEST.H.root.visible ? eyeSee(PEST.H.head, .5, 420) : 0; }
function pestSeen(tp) { PEST.track = 2.6; PEST.trackP.copy(tp); if (!PEST.said.sus || T - PEST.said.sus > 15) { PEST.said.sus = T; sayW(PEST_NAME, '嗯？……有嘢郁。', PEST_COL, 2.2); } humanSus(.2, '師傅好似見到嘢'); }
function pestHear(p, loud) { if (PEST.st !== 'in' || loud < .3) return; const H = PEST.H; if (Math.hypot(p.x - H.pos.x, p.z - H.pos.z) > 360) return; PEST.track = 2; PEST.trackP.copy(p); }
// online: where he is, for clients
function pestNetOut(w) { const H = PEST.H; if (!H) return; w.pe = [PEST.st === 'in' ? 1 : 0, +H.pos.x.toFixed(1), +H.pos.z.toFixed(1), +H.yaw.toFixed(3), +H.aimT.x.toFixed(1), +H.aimT.y.toFixed(1), +H.aimT.z.toFixed(1), +PEST.doorA.toFixed(2)]; }
function pestNetIn(dt) {
  const w = NET.npc, H = PEST.H; if (!w || !w.pe || !H) return; const e = w.pe; const on = !!e[0];
  if (on && !H.root.visible) { H.pos.set(e[1], 0, e[2]); } H.root.visible = on; PEST.st = on ? 'in' : 'off';
  const ox = H.pos.x, oz = H.pos.z, k = 1 - Math.exp(-8 * dt); H.pos.x += (e[1] - ox) * k; H.pos.z += (e[2] - oz) * k; PEST.netMove = Math.hypot(H.pos.x - ox, H.pos.z - oz);
  H.yaw = angDamp(H.yaw, e[3], 8, dt); H.aimT.set(e[4], e[5], e[6]); PEST.doorA = damp(PEST.doorA, e[7], 8, dt); PEST.door.rotation.y = -PEST.doorA;
}
function pestReset() { PEST.q = []; PEST.st = 'off'; PEST.calledT = -999; PEST.track = 0; PEST.wait = 0; PEST.doorA = 0; if (PEST.H) { PEST.H.root.visible = false; PEST.H.pos.set(690, 0, -650); } if (PEST.door) PEST.door.rotation.y = 0; for (const K of CAGES) { K.shut = false; K.by = null; } for (const C of party) C.caged = null; }
