
// =====================================================================
//  CHARACTERS
//  小彩 (變色龍, 實習生): stand still → colour-match the surface (much harder to see); left click = tongue
//      (grab items from afar, or zip to a ledge/wall); her eyes swivel on their own and warn about watchers behind you.
//  助手 (鼯鼠): left click = hold a teammate and glide with them (heavier → sinks faster);
//      warm air (stove, floor vent) lifts a glide; right click = scout: shows where people are looking.
//  前拍檔 (壁虎) is no longer playable: she guides from the wall.
// =====================================================================
SP.cham = { name: '小彩', role: '實習生', k: .95, r: 1.15, h: 4.9, skin: true, cham: true, skinCol: 0x86c94a, paw: 0x6fae3c, nose: 0x3b5a24, tail: 'curl', outfit: 'lanyard', spd: 1.02, jmp: 1, clb: 1.15, abil: '變色＋舌頭', desc: '停着不動會變色 · 左鍵吐舌頭', col: '#9fd86b' };
SP.sq.abil = '滑翔＋抱人'; SP.sq.desc = '空中按住 Space · 左鍵抱隊友 · 右鍵偵察';
const IDS = ['dad', 'sq', 'bear', 'cham'];
function joinCham() {
  const K = chars.cham; if (party.includes(K)) return; party.push(K); K.lastTrail = K.pos.clone(); K.disp = K.pos.clone(); K.queue = []; K.state = 'idle'; K.stamina = 100;
  assignGaps(); buildPartyHUD();
}
// ---------- chameleon model extras (called from makeChar) ----------
function chamExtras(C, head, body, plain) {
  const k = C.k, S = C.S;
  // casque
  const cq = plain(new THREE.ConeGeometry(.62 * k, 1.25 * k, 24), C.skinM, head, 0, .78 * k, -.42 * k); cq.rotation.x = -.75; cq.scale.z = .55;
  // turret eyes: the eye sits in a skin cone that swivels independently
  C.turrets = [];
  C.eyes.forEach((e, i) => {
    const s = i ? 1 : -1; const tg = new THREE.Group(); tg.position.set(s * .62 * k, .16 * k, .82 * k); head.add(tg);
    const tur = plain(new THREE.SphereGeometry(.4 * k, 24, 16, 0, Math.PI * 2, .55, Math.PI - .55), C.skinM, tg, 0, 0, 0); tur.rotation.x = Math.PI / 2;
    e.position.set(0, 0, .16 * k); e.scale.set(.8, .9, .7); tg.add(e); C.turrets.push(tg);
  });
  // lanyard + intern badge
  plain(new THREE.TorusGeometry(.78 * k, .05 * k, 8, 32), new THREE.MeshStandardMaterial({ color: 0x3c78c8, roughness: .6 }), body, 0, 1.5 * k, .02 * k).rotation.x = Math.PI / 2 - .25;
  const [cv, cx] = cnv(128, 160); cx.fillStyle = '#f7f6f2'; cx.fillRect(0, 0, 128, 160); cx.fillStyle = '#3c78c8'; cx.fillRect(0, 0, 128, 34); cx.fillStyle = '#fff'; cx.font = '700 20px "Noto Sans TC"'; cx.textAlign = 'center'; cx.fillText('ORIGIN', 64, 24); cx.fillStyle = '#c9c4ba'; cx.fillRect(34, 46, 60, 60); cx.fillStyle = '#222'; cx.font = '700 22px "Noto Sans TC"'; cx.fillText('實習生', 64, 134);
  plain(new THREE.BoxGeometry(.5 * k, .62 * k, .04 * k), new THREE.MeshStandardMaterial({ map: tex(cv), roughness: .6 }), body, 0, .92 * k, 1.0 * k).rotation.x = -.18;
  C.camo = 0; C.happyT = 0;
}
function chamTail(C, tailRoot, plain) {
  const k = C.k; let parent = tailRoot; const n = 11;
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group(); g.position.z = i ? -.42 * k : 0; parent.add(g);
    const r0 = lerp(.3, .06, i / n), r1 = lerp(.3, .06, (i + 1) / n), L = .46 * k;
    const sg = new THREE.CylinderGeometry(r1 * k, r0 * k, L, 12); sg.rotateX(Math.PI / 2); sg.translate(0, 0, -L / 2);
    plain(sg, C.skinM, g, 0, 0, 0); g.rotation.x = i === 0 ? .3 : i < 3 ? .05 : .62; C.tail.push(g); parent = g;
  }
}
// ---------- tongue (world-space so it can aim anywhere) ----------
const TNG = { mesh: null, tip: null, k: 0, a: V3(), b: V3(), phase: 'off', t: 0, item: null, zip: null };
function tongueMesh() {
  if (TNG.mesh) return; const mat = new THREE.MeshPhysicalMaterial({ color: 0xe86a86, roughness: .3, clearcoat: .8, sheen: .5 });
  const g = new THREE.CylinderGeometry(.13, .17, 1, 10, 1, true); g.translate(0, .5, 0); g.rotateX(Math.PI / 2);
  TNG.mesh = new THREE.Mesh(g, mat); TNG.tip = new THREE.Mesh(new THREE.SphereGeometry(.42, 16, 12), mat); fxGroup.add(TNG.mesh, TNG.tip); TNG.mesh.visible = TNG.tip.visible = false;
}
function mouthPos(C) { const p = V3(); C.head.localToWorld(p.set(0, -.32 * C.k, 1.35 * C.k)); return p; }
function rayHit(o, d, maxT) { let best = maxT, bc = null; for (const c of colsNear(o.x, o.y, o.z)) { if (c.noCam || c.cat) continue; const t = rayT(o, d, maxT, c); if (t > .001 && t < best) { best = t; bc = c; } } return [best, bc]; }
function hitNormal(c, P) {
  if (Math.abs(P.y - c.y1) < .35) return V3(0, 1, 0); if (Math.abs(P.y - c.y0) < .35) return V3(0, -1, 0);
  if (c.t === 'c') { const n = V3(P.x - c.x, 0, P.z - c.z); return n.lengthSq() > 1e-6 ? n.normalize() : V3(1, 0, 0); }
  const ds = [[P.x - c.x0, -1, 0], [c.x1 - P.x, 1, 0], [P.z - c.z0, 0, -1], [c.z1 - P.z, 0, 1]].sort((a, b) => Math.abs(a[0]) - Math.abs(b[0]));
  return V3(ds[0][1], 0, ds[0][2]);
}
function tongueItems() {
  const out = [];
  for (const b of batteries) if (!b.got) out.push({ p: V3(b.x, b.y + 1.2, b.z), set: q => { b.x = q.x; b.y = q.y - 1.2; b.z = q.z; b.g.position.set(b.x, b.y, b.z); b.halo.position.set(b.x, b.y + 1.2, b.z); } });
  for (const v of VIALS) if (!v.got) out.push({ p: V3(v.x, v.y + 1.6, v.z), set: q => { v.x = q.x; v.y = q.y - 1.6; v.z = q.z; } });
  if (LEVEL === 'kitchen' && KS.coreDrop && !KS.carried) out.push({ p: KS.coreDrop.clone(), set: q => { KS.coreDrop = q.clone(); KS.core.position.copy(q); } });
  for (const c of CRUMBS) if (!c.got) out.push({ p: V3(c.x, c.y + .5, c.z), set: q => { c.x = q.x; c.y = q.y - .5; c.z = q.z; c.g.position.set(c.x, c.y, c.z); c.halo.position.set(c.x, c.y + 1.5, c.z); } });
  return out;
}
let tongueAim = null;
function updTongueAim() {
  tongueAim = null; const L = leader; if (!L || L.id !== 'cham' || STATE !== 'play') return;
  const o = camera.position.clone(), d = V3(); camera.getWorldDirection(d); const [t, c] = rayHit(o, d, cam.curD + 70); const m = mouthPos(L);
  // items close to the aim line (in front of whatever the line hits) come first
  let item = null, bd = 1e9;
  for (const it of tongueItems()) {
    const v = V3().subVectors(it.p, o); const along = v.dot(d); if (along < 0 || along > t + 1.5) continue;
    if (v.addScaledVector(d, -along).length() > 2.8 || it.p.distanceTo(m) > 36) continue;
    const dir = V3().subVectors(it.p, m); const dl = dir.length(); dir.divideScalar(dl); if (rayBlocked(m, dir, dl - 1.5, true)) continue;
    if (along < bd) { bd = along; item = it; }
  }
  if (item) { tongueAim = { P: item.p.clone(), c: null, item, n: V3(0, 1, 0) }; return; }
  if (!c) return; const P = o.clone().addScaledVector(d, t); if (P.distanceTo(m) > 36) return;
  tongueAim = { P, c, item: null, n: hitNormal(c, P) };
}
function chamTongue() {
  const C = leader; if (!C || C.id !== 'cham' || TNG.phase !== 'off' || STK || C.mantle || C.zip || STATE !== 'play' || !mine(C) || C.frozen) return; tongueMesh();
  const A = tongueAim; SND.swish(); tone(900, 300, .12, .04, 'triangle');
  if (!A) { TNG.phase = 'miss'; TNG.t = 0; const d = V3(); camera.getWorldDirection(d); TNG.b.copy(mouthPos(C)).addScaledVector(d, 14); return; }
  TNG.b.copy(A.item ? A.item.p : A.P); TNG.t = 0;
  if (A.item) { TNG.phase = 'grab'; TNG.item = A.item; return; }
  if (A.n.y < -.5) { TNG.phase = 'miss'; return; }
  // zip: land on top, or stick to a wall and start climbing
  const n = A.n; let to;
  if (n.y > .5) { to = V3(A.P.x, A.P.y, A.P.z); if (!standable(to.x, to.z, to.y, C)) { const back = V3().subVectors(mouthPos(C), A.P).setY(0).normalize(); to.addScaledVector(back, -C.r * .2); } }
  else to = V3(A.P.x + n.x * (C.r + .15), A.P.y - C.h * .55, A.P.z + n.z * (C.r + .15));
  TNG.phase = 'zip'; C.zip = { from: C.pos.clone(), to, n, top: n.y > .5, t: 0, dur: clamp(C.pos.distanceTo(to) / 70, .22, .5) };
  C.climbing = false; C.vel.set(0, 0, 0);
}
function updZip(C, dt) {
  const Z = C.zip; Z.t += dt / Z.dur; const k = Math.min(1, Z.t); const e = easeIO(k);
  C.pos.lerpVectors(Z.from, Z.to, e); C.pos.y += Math.sin(k * Math.PI) * 2; C.state = 'air'; C.spd = 0; C.yaw = angDamp(C.yaw, Math.atan2(Z.to.x - Z.from.x, Z.to.z - Z.from.z), 12, dt);
  if (k >= 1) {
    C.zip = null; TNG.phase = 'back'; TNG.t = 0;
    if (Z.top) { C.grounded = true; C.vel.set(0, 0, 0); C.state = 'idle'; C.squash = .4; }
    else { startClimb(C, { nx: Z.n.x, nz: Z.n.z }); C.climbCD = 0; }
  }
}
function updTongue(dt) {
  if (!TNG.mesh || TNG.phase === 'off') { if (TNG.mesh) TNG.mesh.visible = TNG.tip.visible = false; return; }
  const C = chars.cham; TNG.t += dt; const a = mouthPos(C); let b = TNG.b.clone(); let ext = 1;
  if (TNG.phase === 'miss') { ext = TNG.t < .12 ? TNG.t / .12 : Math.max(0, 1 - (TNG.t - .12) / .15); if (TNG.t > .27) TNG.phase = 'off'; }
  else if (TNG.phase === 'grab') {
    if (TNG.t < .14) ext = TNG.t / .14;
    else { ext = Math.max(0, 1 - (TNG.t - .14) / .2); const q = V3().lerpVectors(a, TNG.b, ext); TNG.item.set(q); if (ext <= 0) { TNG.item.set(V3(C.pos.x, C.pos.y + 1, C.pos.z)); C.happyT = 1.2; TNG.phase = 'off'; TNG.item = null; } }
  } else if (TNG.phase === 'zip') { b = C.zip ? TNG.b.clone() : b; ext = 1; }
  else if (TNG.phase === 'back') { ext = Math.max(0, 1 - TNG.t / .12); b = a.clone().addScaledVector(V3().subVectors(TNG.b, a).normalize(), .1 + 3 * ext); if (TNG.t > .12) TNG.phase = 'off'; }
  const end = V3().lerpVectors(a, b, ext); const len = a.distanceTo(end);
  TNG.mesh.visible = TNG.tip.visible = len > .05; TNG.mesh.position.copy(a); TNG.mesh.scale.set(1, 1, Math.max(.01, len)); TNG.mesh.lookAt(end); TNG.tip.position.copy(end);
}
// ---------- camouflage, mood, swivel eyes ----------
const _ccol = new THREE.Color(), _base = new THREE.Color(), _grey = new THREE.Color(0x8d9399), _happy = new THREE.Color(0xf4d64e);
function chamAnim(C, dt) {
  if (!C.skinM) return;
  const lead = C === leader; const moving = lead ? (C.spd > .6 || !(C.grounded || C.climbing) || C.zip) : (C.spd > .4 || C.state === 'air');
  C.camo = clamp(C.camo + (moving || C.frozen ? -dt * 3 : dt * .75), 0, 1);
  const surf = lead ? (C.climbing ? C.climbC : C.ground) : null; const sc = surf && surf.m && surf.m.material && surf.m.material.color;
  if (sc) C.surfCol = (C.surfCol || new THREE.Color()).copy(sc);
  _base.setHex(C.S.skinCol); _ccol.copy(_base);
  if (C.surfCol) _ccol.lerp(C.surfCol, C.camo * .92);
  const scared = lead ? clamp((meter - .25) * 2, 0, 1) * (1 - C.camo) : 0; if (scared > 0) _ccol.lerp(_grey, scared * .8);
  C.happyT = Math.max(0, C.happyT - dt); if (C.happyT > 0) _ccol.lerp(_happy, Math.min(1, C.happyT) * .7);
  C.skinM.color.lerp(_ccol, 1 - Math.exp(-6 * dt)); C.bellyM.color.copy(C.skinM.color).lerp(new THREE.Color(0xffffff), .35);
  // eyes swivel on their own
  C.turrets.forEach((tg, i) => { const ph = C.t * (.7 + i * .23) + i * 2.1; tg.rotation.y = damp(tg.rotation.y, Math.sin(ph) * .55 + (i ? .25 : -.25), 3, dt); tg.rotation.x = damp(tg.rotation.x, Math.sin(ph * 1.3) * .3, 3, dt); });
}
// ---------- squirrel: carry & scout ----------
function sqCarry() {
  const C = leader; if (!C || C.id !== 'sq' || STK || STATE !== 'play' || !mine(C) || C.frozen) return;
  if (C.carry) { sqDrop(C); return; }
  if (C.climbing || C.on || isBase(C)) { toast(C.climbing ? '攀爬時抱不了人' : '疊羅漢時抱不了人'); return; }
  let best = null, bd = 6; for (const F of party) { if (F === C || F.frozen || F.on || F.hop || isBase(F) || (NET.on && F.owner !== F.baseOwner)) continue; const p = F.disp || F.pos; const d = Math.hypot(p.x - C.pos.x, p.z - C.pos.z); if (d < bd && Math.abs(p.y - C.pos.y) < 3) { bd = d; best = F; } }
  if (!best) { toast('要走近隊友才抱得到'); return; }
  C.carry = best; best.carried = true; best.state = 'hang'; best.queue = []; netLease([best.id], NET.me); SND.swish(); tone(500, 760, .12, .04, 'triangle');
  say(C.S.name, best.id === 'bear' ? '老友你……好重……' : `抱緊${best.S.name}！`, C.S.col, 1.8);
}
function sqDrop(C) {
  const F = C.carry; if (!F) return; C.carry = null; F.carried = false;
  let p = null; for (const a of [1.6, -1.6, 2.6, -2.6, 0, Math.PI]) { const x = C.pos.x + Math.sin(C.yaw + a) * 2.6, z = C.pos.z + Math.cos(C.yaw + a) * 2.6; if (standable(x, z, C.pos.y, F)) { p = V3(x, C.pos.y, z); break; } }
  F.pos.copy(p || C.pos); F.disp.copy(F.pos); F.queue = []; F.qst = 'idle'; F.state = 'idle'; F.vel.set(0, 0, 0); F.offK = 0; F.squash = .5;
  netUnlease([{ id: F.id, x: F.pos.x, y: F.pos.y, z: F.pos.z }]);
}
function carryWeight(C) { return C.carry ? C.carry.h / 5 : 0; }
function updCarry(dt) {
  const C = chars.sq; if (!C || !C.carry) return; const F = C.carry;
  if (C !== leader || F.frozen || C.frozen || C.climbing) { sqDrop(C); return; }
  if (!C.grounded) C.cAir = (C.cAir || 0) + dt; else { const fl = C.cAir || 0; C.cAir = 0; if (fl > .35) { sqDrop(C); return; } } // landed after a flight
  const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw);
  if (C.grounded) F.pos.set(C.pos.x + fx * 1.3, C.pos.y + .9, C.pos.z + fz * 1.3); else F.pos.set(C.pos.x, C.pos.y - F.h * .82, C.pos.z);
  F.yaw = C.yaw; F.state = 'hang'; F.disp.copy(F.pos);
}
// warm air columns lift a glide
function updraftAt(p) { for (const u of (LVL.updrafts || [])) if (Math.hypot(p.x - u.x, p.z - u.z) < u.r && p.y > u.y0 - 2 && p.y < u.y1) return u; return null; }
const SCOUT = { t: 0, cd: 0, cones: [] };
function scoutCones() {
  if (SCOUT.cones.length) return;
  const mk = (L, cosA, op) => { const r = L * Math.tan(Math.acos(cosA)); const g = new THREE.ConeGeometry(r, L, 40, 1, true); g.translate(0, -L / 2, 0); g.rotateX(-Math.PI / 2); return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff7a4a), transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); };
  for (const [who, L, op] of [['mom', 230, .055], ['kid', 190, .055], ['cat', 120, .05]]) { const inner = mk(L, .86, op), outer = mk(L * .9, .55, op * .45); fxGroup.add(inner, outer); SCOUT.cones.push({ who, inner, outer, op }); }
}
function sqScout() {
  const C = leader; if (!C || C.id !== 'sq' || STATE !== 'play') return;
  if (LEVEL !== 'kitchen') { toast('這裡沒有人，不用偵察'); return; }
  if (SCOUT.cd > 0) { toast(`偵察冷卻中（${Math.ceil(SCOUT.cd)} 秒）`); return; }
  scoutCones(); const high = C.pos.y - zoneFloor(C.pos) > 40; SCOUT.t = high ? 10 : 5; SCOUT.cd = 14; SND.zapUp(); if (NET.on) nsend({ t: 'scout', d: SCOUT.t });
  toast(high ? '在高處偵察：顯示她們的視線範圍 10 秒' : '偵察：顯示她們的視線範圍 5 秒（站高一點看得更久）', 3);
}
function updScout(dt) {
  SCOUT.cd = Math.max(0, SCOUT.cd - dt); SCOUT.t = Math.max(0, SCOUT.t - dt);
  for (const s of SCOUT.cones) {
    const head = s.who === 'mom' ? mom.head : s.who === 'kid' ? KID.head : CAT.head; const vis = LEVEL === 'kitchen' && head && SCOUT.t > 0 && !(s.who === 'cat' && CAT.mode === 'sleep');
    const f = vis ? Math.min(1, SCOUT.t / .8) : 0; s.inner.visible = s.outer.visible = f > .01;
    if (!s.inner.visible) continue; const p = V3(), q = new THREE.Quaternion(); head.getWorldPosition(p); head.getWorldQuaternion(q);
    for (const m of [s.inner, s.outer]) { m.position.copy(p); m.quaternion.copy(q); }
    s.inner.material.opacity = s.op * f * (.85 + Math.sin(T * 4) * .15); s.outer.material.opacity = s.op * .45 * f;
  }
}
// ---------- the swivel eyes warn about watchers you can't see ----------
function updWatch() {
  const el = $('watch'); const K = chars.cham; const w = LEVEL === 'kitchen' && STATE === 'play' && party.includes(K) && !K.frozen ? KS.watch : null;
  if (!w || w.s <= 0) { el.classList.remove('on'); return; }
  const v = w.p.clone().project(camera); const off = v.z > 1 || Math.abs(v.x) > .92 || Math.abs(v.y) > .92;
  if (!off) { el.classList.remove('on'); return; }
  let x = v.x, y = v.y; if (v.z > 1) { x = -x; y = -y; } const a = Math.atan2(y, x); const rx = innerWidth / 2 - 90, ry = innerHeight / 2 - 120;
  const t = Math.min(rx / Math.abs(Math.cos(a) || 1e-6), ry / Math.abs(Math.sin(a) || 1e-6));
  el.style.left = (innerWidth / 2 + Math.cos(a) * t) + 'px'; el.style.top = (innerHeight / 2 - Math.sin(a) * t) + 'px'; el.querySelector('i').style.transform = `rotate(${-a}rad)`;
  el.querySelector('span').textContent = w.who === 'kid' ? '小彩：女兒在看這邊！' : '小彩：太太在看這邊！'; el.classList.add('on');
}
// ---------- kitchen warm-air vent ----------
function buildVent() {
  const g = new THREE.Group(); g.position.set(60, 0, 120); LV.add(g);
  const frame = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, metalness: 1, roughness: .35 });
  const fr = new THREE.Mesh(new THREE.BoxGeometry(26, .5, 16), frame); fr.position.y = .25; fr.receiveShadow = true; g.add(fr);
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(23, 13), new THREE.MeshBasicMaterial({ color: 0x0a0806 })); hole.rotation.x = -Math.PI / 2; hole.position.y = .52; g.add(hole);
  for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.5, .4, 13), frame); s.position.set(-10.4 + i * 2.3, .7, 0); s.rotation.z = .5; g.add(s); }
  const glow = new THREE.PointLight(0xff9a50, 60, 0, 2); glow.position.set(0, -1, 0); g.add(glow);
  return { x: 60, z: 120, r: 12, y0: 0, y1: 150 };
}
function updVentFx(dt) {
  for (const u of (LVL.updrafts || [])) if (rnd() < dt * (u.fx || 10)) emit(V3(u.x + R(-u.r * .6, u.r * .6), u.y0 + R(1, 6), u.z + R(-u.r * .5, u.r * .5)), V3(R(-1, 1), R(18, 34), R(-1, 1)), new THREE.Color(.55, .5, .45), R(.15, .35), R(1.4, 2.6), -6, .3);
}
