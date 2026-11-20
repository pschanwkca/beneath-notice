
// =====================================================================
//  THE ORIGIN DYNAMICS CREW — four more playable characters for online games (up to 8 players)
//  阿刺 (刺蝟, 搬運工): left click = curl up and roll-dash; knocks over anything light in the way
//  跳跳 (兔, 技術員):   hold left click to crouch, let go = a huge jump
//  阿浣 (浣熊, 保安):   left click = flick a pebble at the crosshair; it clatters there and pulls attention
//  阿蛙 (青蛙, 工程師): hold left click = charged long leap; E next to a socket / lamp / TV = lights out
//                       for a while — the whole team is much harder to see in the dark
// =====================================================================
SP.hog = { name: '阿刺', role: '搬運工', k: .9, r: 1.2, h: 4.5, fur: 0xc9a582, belly: 0xf1e2c8, len: .12, den: 40, ear: 'nub', paw: 0x4a3a30, nose: 0x1d1512, tail: 'stub', outfit: 'vest', spines: 0x4b3424, spd: 1.04, jmp: .95, clb: .9, abil: '滾動衝撞', desc: '左鍵縮成一團衝出去，撞跌擋路的東西', col: '#f0a35e' };
SP.rab = { name: '跳跳', role: '技術員', k: .94, r: 1.15, h: 5, fur: 0xeee8de, belly: 0xffffff, len: .17, den: 38, ear: 'long', paw: 0xe3a8b0, nose: 0xe47a8c, tail: 'stub', outfit: 'headset', spd: 1.08, jmp: 1.18, clb: .95, abil: '超級跳', desc: '按住左鍵蓄力，放手跳得好高', col: '#f4c6d4' };
SP.coon = { name: '阿浣', role: '保安', k: 1.06, r: 1.35, h: 5.4, fur: 0x8f8a84, belly: 0xd9d3cb, len: .2, den: 30, ear: 'pointy', paw: 0x2a2624, nose: 0x161210, tail: 'ringed', outfit: 'guard', mask: true, spd: 1, jmp: 1, clb: 1.05, abil: '彈石仔', desc: '左鍵把小石子彈到準星位置，聲音會引開別人', col: '#a9b8cc' };
SP.frog = { name: '阿蛙', role: '工程師', k: .92, r: 1.25, h: 4.5, skin: true, frog: true, skinCol: 0x58a85c, bellyCol: 0xe6e2b4, paw: 0x4f9a52, nose: 0x2b4a22, tail: 'none', outfit: 'hardhat', spd: .98, jmp: 1.08, clb: .9, abil: '蓄力跳＋搞電器', desc: '按住左鍵蓄力遠跳 · E 關掉附近的燈', col: '#7fd4b0' };
const CORE = ['dad', 'sq', 'bear', 'cham'];
IDS.push('hog', 'rab', 'coon', 'frog');

let _crewM = null;
function crewMats() {
  if (_crewM) return _crewM;
  const [c, x] = cnv(128, 128); x.fillStyle = '#f4f1ea'; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill(); x.strokeStyle = '#1b6b8a'; x.lineWidth = 8; x.beginPath(); x.arc(64, 64, 50, 0, 7); x.stroke();
  x.fillStyle = '#1b6b8a'; x.font = '800 46px Fredoka,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('OD', 64, 67);
  _crewM = {
    badge: new THREE.MeshStandardMaterial({ map: tex(c), roughness: .4, metalness: .1 }),
    vest: new THREE.MeshPhysicalMaterial({ color: 0xff7a1e, roughness: .75, sheen: .4, sheenColor: 0xffc080 }),
    reflect: new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: .25, metalness: .6, emissive: 0x3a3a3a }),
    polo: new THREE.MeshPhysicalMaterial({ color: 0x2f8f94, roughness: .8, sheen: .6, sheenColor: 0x9fe0e0 }),
    navy: new THREE.MeshPhysicalMaterial({ color: 0x25314c, roughness: .8, sheen: .5, sheenColor: 0x7080a8 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd7b04a, metalness: 1, roughness: .3 }),
    hard: new THREE.MeshPhysicalMaterial({ color: 0xf2c21a, roughness: .35, clearcoat: .7 }),
    belt: new THREE.MeshStandardMaterial({ color: 0x7a4a26, roughness: .7 }),
    black: new THREE.MeshStandardMaterial({ color: 0x141210, roughness: .6 }),
    mask: new THREE.MeshPhysicalMaterial({ color: 0x1e1b19, roughness: .8, sheen: .6, sheenColor: 0x6a6460 }),
    white: new THREE.MeshPhysicalMaterial({ color: 0xf2efe8, roughness: .8, sheen: .8, sheenColor: 0xffffff }),
    pink: new THREE.MeshPhysicalMaterial({ color: 0xf2a6b2, roughness: .5, emissive: 0xff7088, emissiveIntensity: .18, sheen: .6, sheenColor: 0xffc8d0 }),
    lip: new THREE.MeshStandardMaterial({ color: 0x24361c, roughness: .5 })
  };
  return _crewM;
}
// ears for the new animals (called from makeChar)
function crewEar(C, S, g, s, k, part, plain, fm) {
  const M = crewMats();
  if (S.ear === 'long') {
    g.position.set(s * .44 * k, 1.0 * k, -.12 * k); g.rotation.set(-.18, s * -.1, s * -.16);
    part(ell(.3 * k, .98 * k, .16 * k, 24, 20), fm(0), g, 0, .82 * k, 0);
    plain(ell(.17 * k, .78 * k, .06 * k, 20, 16), M.pink, g, 0, .82 * k, .12 * k);
  } else if (S.ear === 'pointy') {
    g.position.set(s * .86 * k, .98 * k, -.1 * k); g.rotation.set(0, s * -.3, s * -.36);
    part(ell(.4 * k, .52 * k, .15 * k, 24, 16), fm(0), g, 0, .1 * k, 0);
    plain(ell(.26 * k, .36 * k, .06 * k, 20, 12), M.mask, g, 0, .06 * k, .11 * k);
    plain(ell(.42 * k, .12 * k, .1 * k, 16, 8), M.white, g, 0, .52 * k, 0);
  } else if (S.ear === 'bat') { batEar(g, s, k, part, plain, fm);
  } else if (S.ear === 'nub') {
    g.position.set(s * .86 * k, .84 * k, .05 * k); g.rotation.set(0, s * -.4, s * -.4);
    part(ell(.3 * k, .3 * k, .14 * k, 20, 12), fm(0), g, 0, 0, 0);
    plain(ell(.18 * k, .18 * k, .05 * k, 16, 10), M.pink, g, 0, 0, .1 * k);
  }
}
// tails
function crewTail(C, S, tailRoot, k, part, fm) {
  if (S.tail === 'ringed') {
    let parent = tailRoot; const sz = [.42, .5, .52, .48, .38];
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group(); g.position.set(0, i ? .5 * k : 0, i ? -.12 * k : 0); parent.add(g);
      part(ell(sz[i] * k, .44 * k, sz[i] * .9 * k), fm(0, .3, 20, i % 2 ? 0x2b2724 : S.fur), g, 0, .26 * k, 0);
      g.rotation.x = i === 0 ? -1.05 : -.34; C.tail.push(g); parent = g;
    }
    return true;
  }
  return S.tail === 'none';
}
// faces, spines, outfits
function crewExtras(C, S, head, body, k, part, plain) {
  const M = crewMats();
  if (S.bat) batExtras(C, S, head, body, k, plain); if (S.tort) tortExtras(C, S, head, body, k, plain);
  const badge = (y = 1.16, z = .98) => { const b = plain(new THREE.CircleGeometry(.17 * k, 24), M.badge, body, -.42 * k, y * k, z * k); b.rotation.y = -.38; b.castShadow = false; };
  const lathe = (pts, mat, sz = .95) => { const m = plain(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0] * k, p[1] * k)), 48), mat, body, 0, 0, 0); m.scale.z = sz; return m; };
  if (S.spines) {
    // spiky coat over the back, and a crown of spines over the head that reads from the front too
    const sm = furMat({ color: S.spines, len: .8, den: 7, droop: -.3, clump: .95, rimK: .16, root: .4, belly: 0xe8d6b8, bellyAmt: 0 });
    const g1 = new THREE.SphereGeometry(1, 40, 24, Math.PI * 1.02, Math.PI * .96, .05, 2.3); g1.scale(1.12 * k, 1.14 * k, 1.04 * k);
    part(g1, sm, body, 0, .74 * k, -.06 * k);
    const g2 = new THREE.SphereGeometry(1, 48, 24, Math.PI * .62, Math.PI * 1.76, 0, 1.45); g2.scale(1.36 * k, 1.26 * k, 1.26 * k);
    part(g2, sm, head, 0, .06 * k, -.1 * k);
  }
  if (S.mask) {
    for (const s of [-1, 1]) { const p = plain(ell(.44 * k, .31 * k, .12 * k, 24, 16), M.mask, head, s * .5 * k, .15 * k, .93 * k); p.rotation.y = s * .32; const w = plain(ell(.36 * k, .09 * k, .1 * k, 16, 8), M.white, head, s * .52 * k, .48 * k, .9 * k); w.rotation.set(0, s * .3, s * -.12); }
    plain(ell(.22 * k, .1 * k, .08 * k, 16, 8), M.mask, head, 0, .19 * k, 1.1 * k);
  }
  if (S.frog) {
    if (C.headM) C.headM.scale.set(1.12, .8, 1.02);
    C.eyes.forEach((e, i) => { const s = i ? 1 : -1; e.position.set(s * .56 * k, .78 * k, .66 * k); e.scale.set(1.35, 1.45, 1.1); plain(new THREE.SphereGeometry(.42 * k, 24, 16), C.skinM, head, s * .56 * k, .72 * k, .58 * k); });
    const mouth = plain(new THREE.TorusGeometry(.78 * k, .035 * k, 6, 32, Math.PI * .8), M.lip, head, 0, -.18 * k, .9 * k); mouth.rotation.set(-.35, 0, Math.PI + Math.PI * .1);
  }
  if (S.outfit === 'vest') {
    lathe([[1.1, -.1], [1.12, .3], [1.08, .78], [.96, 1.08], [.7, 1.3]], M.vest, .96);
    for (const y of [.32, .72]) plain(new THREE.TorusGeometry(1.1 * k, .06 * k, 6, 48), M.reflect, body, 0, y * k, 0).rotation.x = Math.PI / 2;
    for (const s of [-1, 1]) plain(new THREE.BoxGeometry(.22 * k, .9 * k, .1 * k), M.reflect, body, s * .45 * k, 1.05 * k, .86 * k).rotation.x = -.18;
    for (const a of C.arms) plain(new THREE.SphereGeometry(.3 * k, 16, 12), M.black, a, 0, -.9 * k, 0);
    badge(1.0, .99);
  } else if (S.outfit === 'headset') {
    lathe([[1.1, -.32], [1.12, 0], [1.08, .5], [1.0, .92], [.74, 1.22]], M.polo);
    plain(new THREE.TorusGeometry(.66 * k, .1 * k, 8, 32), M.polo, body, 0, 1.36 * k, 0).rotation.x = Math.PI / 2;
    const band = plain(new THREE.TorusGeometry(1.24 * k, .07 * k, 8, 40, Math.PI), M.black, head, 0, .1 * k, -.05 * k); band.rotation.y = Math.PI / 2;
    for (const s of [-1, 1]) { const cup = plain(new THREE.CylinderGeometry(.34 * k, .34 * k, .22 * k, 24), M.black, head, s * 1.26 * k, .05 * k, -.05 * k); cup.rotation.z = Math.PI / 2; }
    const boom = plain(new THREE.CylinderGeometry(.04 * k, .04 * k, 1.0 * k, 8), M.black, head, -1.0 * k, -.35 * k, .55 * k); boom.rotation.set(.9, 0, .5);
    plain(new THREE.SphereGeometry(.1 * k, 12, 10), M.black, head, -.75 * k, -.62 * k, .98 * k);
    plain(new THREE.BoxGeometry(.6 * k, .8 * k, .08 * k), M.black, body, .5 * k, .3 * k, -.9 * k).rotation.y = .4;
    badge();
  } else if (S.outfit === 'guard') {
    lathe([[1.12, -.34], [1.13, 0], [1.1, .5], [1.04, .92], [.76, 1.24]], M.navy);
    plain(new THREE.TorusGeometry(1.12 * k, .1 * k, 8, 48), M.black, body, 0, 0, 0).rotation.x = Math.PI / 2;
    const fl = plain(new THREE.CylinderGeometry(.11 * k, .14 * k, .6 * k, 12), M.black, body, .95 * k, .02 * k, .45 * k); fl.rotation.z = .2;
    const cap = plain(new THREE.CylinderGeometry(1.18 * k, 1.08 * k, .55 * k, 40), M.navy, head, 0, .98 * k, -.05 * k); cap.rotation.x = -.12;
    const peak = plain(new THREE.CylinderGeometry(.95 * k, .95 * k, .06 * k, 32, 1, false, -Math.PI / 2, Math.PI), M.black, head, 0, .72 * k, .55 * k); peak.rotation.x = .25;
    plain(new THREE.CircleGeometry(.2 * k, 6), M.gold, head, 0, 1.05 * k, 1.08 * k).rotation.x = -.2;
    const st = plain(new THREE.CircleGeometry(.16 * k, 5), M.gold, body, .42 * k, 1.12 * k, .99 * k); st.rotation.y = .38;
    badge();
  } else if (S.outfit === 'hardhat') {
    const hat = plain(new THREE.SphereGeometry(1.3 * k, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), M.hard, head, 0, .5 * k, -.05 * k); hat.scale.set(1.04, .82, 1.04);
    plain(new THREE.CylinderGeometry(1.5 * k, 1.5 * k, .07 * k, 40), M.hard, head, 0, .52 * k, .05 * k).scale.z = 1.1;
    plain(new THREE.BoxGeometry(.18 * k, .22 * k, 2.4 * k), M.hard, head, 0, 1.55 * k, -.05 * k);
    const hb = plain(new THREE.CircleGeometry(.24 * k, 24), M.badge, head, 0, 1.1 * k, 1.08 * k); hb.rotation.x = -.6;
    plain(new THREE.TorusGeometry(1.08 * k, .13 * k, 8, 48), M.belt, body, 0, .02 * k, 0).rotation.x = Math.PI / 2;
    for (const a of [.9, 1.8, -1.2]) plain(new THREE.BoxGeometry(.32 * k, .38 * k, .2 * k), M.belt, body, Math.sin(a) * 1.08 * k, -.06 * k, Math.cos(a) * 1.08 * k).rotation.y = a;
    const wr = plain(new THREE.BoxGeometry(.12 * k, .9 * k, .08 * k), MAT.steel, body, -.98 * k, .1 * k, .3 * k); wr.rotation.z = -.3;
    badge(1.0, .98);
  }
}

// ---------- abilities ----------
const CREW = { peb: [], pebCD: 0, sw: [] };
function hogRoll() {
  const C = leader; if (!C || C.id !== 'hog' || STATE !== 'play' || C.climbing || C.dashT > 0 || (C.dashCD || 0) > T || !C.grounded) return;
  if (isBase(C)) { toast('頭上有人，滾唔到'); return; }
  if (C.stamina < 12) { toast('體力不夠，先休息一下'); return; }
  C.dashT = .62; C.dashCD = T + 1.1; C.dashHit = new Set(); C.stamina -= 12; C.crouch = false; SND.swish(); SND.jump();
}
// called from updLeader while rolling
function hogDash(C, dt) {
  C.dashT -= dt; const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw), v = 78;
  C.vel.x = fx * v; C.vel.z = fz * v;
  const r = pushTarget(C);
  if (r && !C.dashHit.has(r)) {
    C.dashHit.add(r); const vol = r.sx * r.sy * r.sz * r.s ** 3; const sv = clamp(95 / Math.cbrt(Math.max(1, vol / 60)), 8, 60);
    if (NET.client) nsend({ t: 'shv', i: resizables.indexOf(r), vx: fx * sv, vz: fz * sv }, NET.hostId); else shoveRes(r, fx * sv, fz * sv);
    SND.thud(.3); cam.shake = Math.max(cam.shake, .3); C.dashT = Math.min(C.dashT, .08); C.vel.x *= -.3; C.vel.z *= -.3;
  }
  if (rnd() < dt * 30) emit(V3(C.pos.x, C.pos.y + .3, C.pos.z), V3(R(-5, 5) - fx * 8, R(2, 6), R(-5, 5) - fz * 8), new THREE.Color(.3, .27, .24), R(.2, .4), R(.3, .5), 30, 2);
}
// rabbit & frog: hold to charge, release to jump
function chargeJump(C, dt, ctl) {
  if (C.id !== 'rab' && C.id !== 'frog') return;
  if (C.stackN) { C.charge = 0; return; }
  const holding = ctl && keys.Mouse0 && C.grounded && !C.climbing;
  if (holding) { C.charge = Math.min(1, (C.charge || 0) + dt / .85); C.crouch = true; C.vel.x *= .8; C.vel.z *= .8; return; }
  if (C.charge > 0) {
    const c = Math.max(.25, C.charge); C.charge = 0; C.crouch = false; if (!C.grounded || !ctl) return;
    const cost = 6 + 14 * c; if (C.stamina < cost) { toast('體力不夠'); return; } C.stamina -= cost;
    const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw);
    if (C.id === 'rab') { C.vel.y = 60 + 78 * c; C.vel.x += fx * 8 * c; C.vel.z += fz * 8 * c; }
    else { C.vel.y = 40 + 34 * c; C.vel.x = fx * (40 + 62 * c); C.vel.z = fz * (40 + 62 * c); C.leapT = .9; }
    C.grounded = false; C.squash = -.8; SND.jump(); for (let i = 0; i < 10; i++) emit(V3(C.pos.x, C.pos.y + .2, C.pos.z), V3(R(-8, 8), R(2, 8), R(-8, 8)), new THREE.Color(.3, .27, .24), R(.3, .6), R(.3, .6), 40, 3);
  }
}
// raccoon: flick a pebble where the crosshair points
function coonThrow() {
  const C = leader; if (!C || C.id !== 'coon' || STATE !== 'play' || C.climbing) return;
  if (CREW.pebCD > T) return; CREW.pebCD = T + 2.2;
  ray.setFromCamera(_sc, camera); const o = ray.ray.origin.clone(), d = ray.ray.direction.clone();
  const [t] = rayHit(o, d, 520); const to = o.addScaledVector(d, Math.min(t, 520) - .3);
  const from = V3(C.pos.x + Math.sin(C.yaw) * 1.2, C.pos.y + C.h * .75, C.pos.z + Math.cos(C.yaw) * 1.2);
  const dur = clamp(from.distanceTo(to) / 140, .3, 1.4);
  launchPebble(from, to, dur, true); if (NET.on) nsend({ t: 'peb', a: from.toArray(), b: to.toArray(), d: dur });
  C.arms[1].rotation.x = -2.4; SND.swish();
}
let _pebM = null;
function launchPebble(a, b, dur, mineOne) {
  if (!_pebM) _pebM = new THREE.MeshStandardMaterial({ color: 0x8c8379, roughness: .8 });
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(.42, 0), _pebM); m.castShadow = true; fxGroup.add(m);
  CREW.peb.push({ m, a: a.clone(), b: b.clone(), t: 0, dur, h: Math.min(40, a.distanceTo(b) * .25) + 4 });
}
function updPebbles(dt) {
  for (let i = CREW.peb.length - 1; i >= 0; i--) {
    const P = CREW.peb[i]; P.t += dt; const u = Math.min(1, P.t / P.dur);
    P.m.position.lerpVectors(P.a, P.b, u); P.m.position.y += Math.sin(u * Math.PI) * P.h; P.m.rotation.x += dt * 14; P.m.rotation.z += dt * 9;
    if (u >= 1) {
      fxGroup.remove(P.m); P.m.geometry.dispose(); CREW.peb.splice(i, 1);
      SND.clang(.35); for (let k = 0; k < 10; k++) emit(P.b.clone(), V3(R(-8, 8), R(4, 12), R(-8, 8)), new THREE.Color(.42, .4, .37), R(.15, .3), R(.3, .6), 200, 1);
      if (!NET.client) noise(P.b, .8, .45);
    }
  }
}
// frog: lights out near a socket / lamp / TV
function addSwitch(name, p, c, R, opts = {}) { CREW.sw.push({ name, p: V3(...p), c: V3(...c), R, until: 0, cd: 0, lights: null, specs: null, ...opts }); }
function swResolve(s) {
  if (s.lights) return; const Z = ZONES[s.list] || ZONES.kitchen; const specList = s.list === 'garage' ? GS.lights : s.list === 'yard' ? YS.lights : KS.lights;
  s.lights = Z.lights.filter(l => !l.isHemisphereLight && l.intensity >= 150 && l !== KS.coreLight && l !== KS.fridgeLight && l !== LIV.gapLight && (() => { const p = l.getWorldPosition(V3()); return Math.hypot(p.x - s.c.x, p.z - s.c.z) < s.R; })());
  s.orig = s.lights.map(l => l.intensity);
  s.specs = specList.filter(q => q !== KS.fridgeL && Math.hypot(q.p.x - s.c.x, q.p.z - s.c.z) < s.R);
}
function swNear(C) { let best = null, bd = 9; for (const s of CREW.sw) { const d = C.pos.distanceTo(s.p); if (d < bd) { bd = d; best = s; } } return best; }
function frogSwitch() {
  const C = leader; if (!C || C.id !== 'frog' || STATE !== 'play') return;
  const s = swNear(C); if (!s) { toast('附近沒有插座、燈或電器'); return; }
  if (s.until > T) { toast('這裡已經黑了'); return; } if (s.cd > T) { toast(`電路還在冷卻（${Math.ceil(s.cd - T)} 秒）`); return; }
  if (NET.client) nsend({ t: 'swr', i: CREW.sw.indexOf(s), id: C.id }, NET.hostId); else hostSwitch(CREW.sw.indexOf(s), C.id);
}
function hostSwitch(i, id) {
  const s = CREW.sw[i]; if (!s || s.until > T || s.cd > T) return; const C = chars[id];
  swOn(i, 20); if (NET.on) nsend({ t: 'swo', i, d: 20 });
  sayW(C ? C.S.name : '阿蛙', '搞定！燈熄了——趁黑行動！', C ? C.S.col : '#7fd4b0', 2.4);
}
function swOn(i, d) {
  const s = CREW.sw[i]; swResolve(s); s.until = T + d; s.cd = T + d + 25; s.on = true;
  for (const q of s.specs) q.on = false; if (s.tv) LIV.tvOff = true; if (s.lamp && LIV.shade) LIV.shade.material.emissiveIntensity = 0;
  SND.snap(); for (let k = 0; k < 18; k++) emit(s.p.clone().add(V3(0, 2, 0)), V3(R(-10, 10), R(4, 16), R(-10, 10)), new THREE.Color(2.4, 2, .8), R(.1, .22), R(.2, .5), 120, 1);
  toast(`${s.name}：附近的燈熄了 ${d} 秒，全隊在黑暗裡更難被看見`, 3.4);
}
// keep switched-off lights dark; put them back afterwards (runs just before the light pool copies them)
function swTick() {
  for (const s of CREW.sw) {
    if (!s.on) continue;
    if (s.until > T) { s.lights.forEach(l => { if (!(s.tv && l === LIV.tvLight)) l.intensity = 0; }); }
    else { s.on = false; s.lights.forEach((l, i) => l.intensity = s.orig[i]); for (const q of s.specs) q.on = true; if (s.tv) LIV.tvOff = false; if (s.lamp && LIV.shade) LIV.shade.material.emissiveIntensity = .6; if (STATE === 'play' && ZONES.kitchen.near) toast(`${s.name}：燈又亮了`, 2); }
  }
}
function inDark(p) { for (const s of CREW.sw) if (s.on && s.until > T && Math.hypot(p.x - s.c.x, p.z - s.c.z) < s.R * .9) return true; return false; }
function buildSwitches() {
  CREW.sw.length = 0;
  addSwitch('洗手盆旁的插座', [-160, 1.5, -140], [-110, 0, -170], 125);
  addSwitch('爐頭旁的插座', [150, 1.5, -140], [60, 0, -180], 110);
  addSwitch('餐桌旁的插座', [-297, 1.5, 70], [-130, 0, 85], 95);
  { const g = new THREE.Group(); g.position.set(-299.2, 6, 70); LV.add(g); const pl = new THREE.Mesh(new THREE.BoxGeometry(.6, 6, 4.4), MAT.white); g.add(pl); for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.BoxGeometry(.3, 1.4, .5), MAT.black); h.position.set(.35, 0, s * 1.1); g.add(h); } }
  addSwitch('落地燈的開關', [575, 1.5, 8], [620, 0, 30], 150, { lamp: true });
  addSwitch('電視機', [875, 47, 72], [840, 0, 120], 120, { tv: true });
  addSwitch('飯廳的燈掣', [470, 89, -205], [490, 0, -130], 120);
}
// ability buttons, hints and per-frame upkeep for the crew
function crewInput(L, ctl) {
  if (!L || !ctl) return;
  if (pressed.KeyE && L.id === 'frog') frogSwitch();
}
function crewHint(L) {
  if (!L) return ''; const nh = ncHint(L); if (nh) return nh;
  if (L.id === 'frog') { const s = swNear(L); if (s) return s.until > T ? `${s.name}：已經熄了` : s.cd > T ? `${s.name}：電路冷卻中` : `${TOUCH ? '按「電」' : '<kbd>E</kbd>'} 搞電器：${s.name}（附近熄燈 20 秒）`; }
  if ((L.id === 'rab' || L.id === 'frog') && L.charge > 0) return `蓄力 ${Math.round(L.charge * 100)}%……放手${L.id === 'rab' ? '起跳' : '跳出去'}`;
  return '';
}
