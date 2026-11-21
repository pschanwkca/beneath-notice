// =====================================================================
//  TOYS GET TIDIED AWAY — in every chapter, not just the kitchen
//  kitchen : Mom puts the toy in the toy box (e3_toy)
//  garage  : the Origin Dynamics man drops it in his evidence box
//  yard    : 陳伯's dog carries it to its kennel; in the sunroom 陳伯 picks it up with his
//            reacher grabber and puts it on his desk
//  street  : the man walking his dog drops it in the blue recycling bin
//  A toy still lying where it fell can be shaken awake by a teammate standing next to it.
//  Once it has been put away, only a Prototype brings it back — and only used right next to it,
//  facing it.
// =====================================================================
const TAKE = { job: null, q: [] };
const PLACES = ['', '玩具箱', '證物箱', '狗屋', '書枱', '回收桶'];
function takeEligible(C) {
  const p = C.pos, Z = zoneAt(p, 4), id = Z && Z.id;
  if (id === 'garage' && GS.agent) {
    const c = GS.car; if (p.x > c.x0 - 6 && p.x < c.x1 + 6 && p.z > c.z0 - 6 && p.z < c.z1 + 6) return null;   // on, under or against the car: he can't get at it
    if (p.y > GY + 200) return null; return { who: 'agent', place: '證物箱' };
  }
  if (id === 'yard') {
    if (YS.old && p.x > 2558 && p.x < 2752 && p.z > -60 && p.z < 220 && p.y > DECK - 2) return { who: 'old', place: '書枱' };
    if (YS.dog && p.x > 2108 && p.y < DECK + 8 && Math.hypot(p.x - 2300, p.z - 410) < 200) return { who: 'dog', place: '狗屋' };
    return null;
  }
  if (id === 'road' && ST.walker && p.z > 640 && p.z < 796 && p.y < GY + 30 && p.x > 1400 && p.x < 3000) return { who: 'walker', place: '回收桶' };
  return null;
}
function takeQueue(C) { if (NET.client) return; if (takeEligible(C)) TAKE.q.push(C); }
function takeTick() {
  if (NET.client) return;
  const J = TAKE.job;
  if (J) { if (!J.C.frozen || STATE === 'fail') { if (J.C.frozen && J.C.toyAt === 'hand') J.C.toyAt = 'floor'; TAKE.job = null; } return; }
  while (TAKE.q.length) { const C = TAKE.q.shift(); if (!C.frozen || C.toyAt !== 'floor') continue; const e = takeEligible(C); if (!e) continue; TAKE.job = Object.assign({ C, mode: 'go', t: 0, bend: 0 }, e); break; }
}
const handW = (H, i) => H.arms[i].hand.getWorldPosition(V3());
function takeHold(C, p) { if (C.toyAt !== 'hand') { C.toyAt = 'hand'; refreshPartyHUD(); } C.pos.copy(p).add(V3(0, -C.h * .45, 0)); C.toyTilt = .5; C.toyVy = 0; }
function takeDrop(J, p) {
  const C = J.C; C.toyAt = 'box'; C.toyPlace = J.place; C.pos.copy(p); C.toyVy = -10; C.yaw = R(0, 6.28); C.toyTilt = R(-1.2, 1.2); C.toyRoll = R(-.4, .4);
  TAKE.job = null; refreshPartyHUD(); SND.thud(.3);
  toastW(`${C.S.name}被收在${J.place}裡！要帶 Prototype 走過去、面向他才救得回`, 3.6);
}
function takeApproach(from, to, d) { const dx = from.x - to.x, dz = from.z - to.z, l = Math.hypot(dx, dz) || 1; return V3(to.x + dx / l * d, 0, to.z + dz / l * d); }
// how much a person bends down to pick something off the floor (0 → upright)
function takeBend(H, b, armK) {
  H.chest.rotation.x = b * .95; H.pelvis.position.y -= b * 26;
  for (const L of H.legs) { L.hip.rotation.x -= b * .55; L.knee.rotation.x += b * 1.05; L.ankle.rotation.x -= b * .4; }
  if (armK > 0) { const A = H.arms[0]; A.sh.rotation.set(-(.55 + b * .8) * armK, 0, 0); A.el.rotation.x = -.35 * armK; }
}

// ---------- the Origin Dynamics man ----------
function agentTake(J, H, walkTo, dt) {
  const P = H.pos, C = J.C, B = GS.ev;
  if (J.mode === 'go') {
    const a = takeApproach(P, C.pos, 24); H.aimT.copy(C.pos);
    if (walkTo(a.x, a.z, 64) || Math.hypot(C.pos.x - P.x, C.pos.z - P.z) < 30) { J.mode = 'grab'; J.t = 0; J.from = C.pos.clone(); }
  } else if (J.mode === 'grab') {
    J.t += dt; H.yaw = angDamp(H.yaw, Math.atan2(J.from.x - P.x, J.from.z - P.z), 6, dt); H.aimT.copy(J.from);
    const k = clamp((J.t - .55) / .45, 0, 1); if (k > 0) { const hp = handW(H, 0).add(V3(0, -C.h * .45, 0)); if (C.toyAt !== 'hand') { C.toyAt = 'hand'; refreshPartyHUD(); } C.pos.lerpVectors(J.from, hp, easeIO(k)); }
    if (J.t > 1.35) { J.mode = 'carry'; if (!GS.said.take || T - GS.said.take > 30) { GS.said.take = T; sayW('Origin Dynamics 職員', '……先收起來，帶回公司化驗。', '#9fb3c8', 2.8); } }
  } else if (J.mode === 'carry') {
    H.aimT.set(B.cx, GY + 20, B.cz); if (walkTo(B.ap.x, B.ap.z, 56)) { J.mode = 'drop'; J.t = 0; } takeHold(C, handW(H, 0));
  } else if (J.mode === 'drop') {
    J.t += dt; H.yaw = angDamp(H.yaw, Math.atan2(B.cx - P.x, B.cz - P.z), 6, dt); H.aimT.set(B.cx, GY, B.cz);
    if (J.t < .65) takeHold(C, handW(H, 0)); else { takeDrop(J, V3(R(B.x0 + 6, B.x1 - 6), B.y + 14, R(B.z0 + 6, B.z1 - 6))); GS.mode = 'look'; GS.wait = 1.6; GS.look = V3(B.cx, GY, B.cz); }
  }
  J.bend = J.mode === 'grab' ? sstep(.05, .55, J.t) * (1 - sstep(.95, 1.35, J.t)) : J.mode === 'drop' ? sstep(0, .45, J.t) * (1 - sstep(.6, .65, J.t)) * .8 : 0;
}
function buildEvidenceBox() {
  const B = GS.ev = { x0: 1352, x1: 1400, z0: 248, z1: 288, y: GY, cx: 1376, cz: 268, ap: V3(1376, 0, 220) };
  const pm = new THREE.MeshPhysicalMaterial({ color: 0xd8e4ea, roughness: .25, transmission: .55, thickness: .8, transparent: true, opacity: .62, clearcoat: .6 });
  const W = 1.4, Hh = 24;
  box(B.x0, B.x1, GY, GY + 1, B.z0, B.z1, pm); box(B.x0, B.x1, GY, GY + Hh, B.z0, B.z0 + W, pm); box(B.x0, B.x1, GY, GY + Hh, B.z1 - W, B.z1, pm); box(B.x0, B.x0 + W, GY, GY + Hh, B.z0 + W, B.z1 - W, pm); box(B.x1 - W, B.x1, GY, GY + Hh, B.z0 + W, B.z1 - W, pm);
  const lid = mesh(new THREE.BoxGeometry(48, 1.2, 40), pm, B.x1 + 2, GY + 12, B.cz, { cast: false }); lid.rotation.z = 1.35;
  const [c, x] = cnv(512, 128); x.fillStyle = '#f2d23a'; x.fillRect(0, 0, 512, 128); x.fillStyle = '#111'; for (let i = -2; i < 16; i++) { x.beginPath(); x.moveTo(i * 40, 0); x.lineTo(i * 40 + 20, 0); x.lineTo(i * 40 - 10, 128); x.lineTo(i * 40 - 30, 128); x.fill(); }
  x.fillStyle = '#f2d23a'; x.fillRect(20, 24, 472, 80); x.fillStyle = '#111'; x.textAlign = 'center'; x.font = '800 40px "Fredoka", sans-serif'; x.fillText('ORIGIN DYNAMICS', 256, 64); x.font = '700 30px "Noto Sans TC", sans-serif'; x.fillText('證物 · 請勿觸碰', 256, 98);
  const lab = mesh(new THREE.PlaneGeometry(40, 10), new THREE.MeshStandardMaterial({ map: tex(c), roughness: .6 }), B.cx, GY + 12, B.z0 - .1, { cast: false }); lab.rotation.y = Math.PI;
}

// ---------- 陳伯's dog: carries it home to the kennel ----------
function dogTake(J, D, dt) {
  const C = J.C; D.sleepK = damp(D.sleepK, 0, 4, dt); let sp = 0;
  const mouth = () => { const p = V3(); D.head.getWorldPosition(p); return p.add(V3(Math.sin(D.yaw) * 11 * (D.root.scale.x || 1), -6, Math.cos(D.yaw) * 11 * (D.root.scale.x || 1))); };
  if (J.mode === 'go') { if (moveDog(D, C.pos, 48, dt)) { J.mode = 'grab'; J.t = 0; J.from = C.pos.clone(); } else sp = 48; if (Math.hypot(C.pos.x - D.pos.x, C.pos.z - D.pos.z) < 26) { J.mode = 'grab'; J.t = 0; J.from = C.pos.clone(); } }
  else if (J.mode === 'grab') { J.t += dt; D.yaw = angDamp(D.yaw, Math.atan2(J.from.x - D.pos.x, J.from.z - D.pos.z), 6, dt); D.neck.rotation.x = .9; const k = clamp((J.t - .3) / .35, 0, 1); if (k > 0) { if (C.toyAt !== 'hand') { C.toyAt = 'hand'; refreshPartyHUD(); } C.pos.lerpVectors(J.from, mouth().add(V3(0, -C.h * .45, 0)), k); } if (J.t > .8) { J.mode = 'carry'; sayW('鄰居的狗', '（叼着玩具，尾巴搖個不停）', '#d8a45a', 2); } }
  else if (J.mode === 'carry') { if (moveDog(D, V3(2300, GY, 362), 40, dt)) { J.mode = 'drop'; J.t = 0; } else sp = 40; takeHold(C, mouth()); }
  else if (J.mode === 'drop') { J.t += dt; D.yaw = angDamp(D.yaw, 0, 5, dt); if (J.t < .5) takeHold(C, mouth()); else { takeDrop(J, V3(2300 + R(-24, 24), GY + 6, 412 + R(-6, 14))); D.mode = 'home'; D.t = 0; } }
  const ax = D.pos.x - D.anchor.x, az = D.pos.z - D.anchor.z, ad = Math.hypot(ax, az); if (ad > 175) { D.pos.x = D.anchor.x + ax / ad * 175; D.pos.z = D.anchor.z + az / ad * 175; }
  const m0 = D.mode; if (TAKE.job === J) D.mode = 'sniff'; dogAnim(D, sp, dt); if (TAKE.job === J) D.mode = m0 === 'sleep' ? 'sniff' : m0; D.tail.rotation.y = Math.sin(T * 16) * .6; D.tongue.visible = false;
  if (TAKE.job !== J) D.mode = 'home';
}

// ---------- 陳伯: reaches out with his grabber and puts it on his desk ----------
function oldTake(J, dt) {
  const O = YS.old, H = O.H, C = J.C; J.t += dt;
  if (!O.grab) { const g = new THREE.Group(); const stick = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 80, 8), new THREE.MeshStandardMaterial({ color: 0x8a9098, metalness: .7, roughness: .4 })); stick.position.y = -40; g.add(stick); const jaw = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 2), new THREE.MeshStandardMaterial({ color: 0xd04030, roughness: .5 })); jaw.position.y = -81; g.add(jaw); H.arms[1].hand.add(g); O.grab = g; O.grabTip = jaw; }
  O.grab.visible = true; O.lookK = damp(O.lookK, 1, 4, dt); O.look.copy(J.mode === 'place' ? V3(2716, 60, 180) : C.pos);
  const A = H.arms[1], tip = () => O.grabTip.getWorldPosition(V3());
  const tgt = J.mode === 'place' ? V3(2716, 60, 180) : C.pos; const dx = tgt.x - H.pos.x, dz = tgt.z - H.pos.z, dy = tgt.y - (H.pos.y + 100);
  const yaw = Math.atan2(dx, dz) - H.yaw; const pitch = Math.atan2(-dy, Math.hypot(dx, dz));
  A.sh.rotation.set(-Math.PI / 2 + pitch * .8, clamp(Math.atan2(Math.sin(yaw), Math.cos(yaw)), -1.2, 1.2), 0); A.el.rotation.x = -.15;
  if (J.mode === 'go') { if (!J.from) J.from = C.pos.clone(); if (J.t > .9) { J.mode = 'lift'; J.t = 0; if (!YS.said.grab || T - YS.said.grab > 30) { YS.said.grab = T; sayW('陳伯', '小朋友的玩具……先放好。', '#c8b8a0', 2.4); } } }
  else if (J.mode === 'lift') { const k = clamp(J.t / .45, 0, 1); if (C.toyAt !== 'hand') { C.toyAt = 'hand'; refreshPartyHUD(); } C.pos.lerpVectors(J.from, tip().add(V3(0, -C.h * .7, 0)), easeIO(k)); if (J.t > .5) { J.mode = 'place'; J.t = 0; } }
  else if (J.mode === 'place') { takeHold(C, tip().add(V3(0, -C.h * .3, 0))); if (J.t > 1.1) { takeDrop(J, V3(2704 + R(-6, 6), 60, 186 + R(-6, 6))); O.grab.visible = false; O.mode = 'read'; O.t = R(6, 10); } }
}

// ---------- the man walking his dog: into the recycling bin ----------
function walkerTake(J, W, dt) {
  const H = W.H, P = H.pos, C = J.C; let moveD = 0; const BIN = ST.bin;
  const go = (tx, tz, sp) => { const dx = tx - P.x, dz = tz - P.z, d = Math.hypot(dx, dz), s = sp * dt; if (d < s + .5) { P.x = tx; P.z = tz; moveD = d; return true; } P.x += dx / d * s; P.z += dz / d * s; moveD = s; H.yaw = angDamp(H.yaw, Math.atan2(dx, dz), 5, dt); return false; };
  if (J.mode === 'go') { const a = takeApproach(P, C.pos, 22); a.z = clamp(a.z, 676, 770); H.aimT.copy(C.pos); if (go(a.x, a.z, 60)) { J.mode = 'grab'; J.t = 0; J.from = C.pos.clone(); } }
  else if (J.mode === 'grab') { J.t += dt; H.yaw = angDamp(H.yaw, Math.atan2(J.from.x - P.x, J.from.z - P.z), 6, dt); H.aimT.copy(J.from); const k = clamp((J.t - .55) / .45, 0, 1); if (k > 0) { if (C.toyAt !== 'hand') { C.toyAt = 'hand'; refreshPartyHUD(); } C.pos.lerpVectors(J.from, handW(H, 0).add(V3(0, -C.h * .45, 0)), easeIO(k)); } if (J.t > 1.35) { J.mode = 'carry'; sayW('行人', '誰亂丟玩具……丟進回收桶好了。', '#9ec4e8', 2.6); } }
  else if (J.mode === 'carry') { H.aimT.set(BIN.cx, GY + 100, BIN.cz); if (go(BIN.ap.x, BIN.ap.z, 50)) { J.mode = 'drop'; J.t = 0; } takeHold(C, handW(H, 0)); }
  else if (J.mode === 'drop') { J.t += dt; H.yaw = angDamp(H.yaw, Math.atan2(BIN.cx - P.x, BIN.cz - P.z), 6, dt); H.aimT.set(BIN.cx, GY + 110, BIN.cz); if (J.t < .7) takeHold(C, V3(BIN.cx, GY + 116, BIN.cz).lerp(handW(H, 0), 1 - J.t / .7)); else { takeDrop(J, V3(BIN.cx + R(-12, 12), (BIN.floor || GY + 8) + 14, BIN.cz + R(-10, 10))); W.mode = 'stop'; W.t = 1.5; } }
  H.aim.lerp(H.aimT, 1 - Math.exp(-3 * dt));
  humanAnim(H, moveD, dt); humanAimArm(H, 0, dt);
  J.bend = J.mode === 'grab' ? sstep(.05, .55, J.t) * (1 - sstep(.95, 1.35, J.t)) : 0;
  takeBend(H, J.bend, J.mode === 'carry' || J.mode === 'drop' ? 1 : J.mode === 'grab' ? 1 : 0);
  if (J.mode === 'drop') { const A = H.arms[0]; A.sh.rotation.set(-1.9, 0, 0); A.el.rotation.x = -.2; }
}

// ---------- Prototype: only next to the toy, facing it ----------
function protoTarget(by) {
  let best = null, bd = 1e9;
  for (const C of party) {
    if (!C.frozen || C === by || C.toyAt === 'hand') continue;
    const dx = C.pos.x - by.pos.x, dz = C.pos.z - by.pos.z, dy = C.pos.y - by.pos.y, d = Math.hypot(dx, dz);
    if (d > 10 || Math.abs(dy) > 7) continue;
    const f = (Math.sin(by.yaw) * dx + Math.cos(by.yaw) * dz) / Math.max(d, .01);
    // must face the toy; right up close the angle is allowed to be wider (it's under your nose)
    if (d > .6 && f < (d < 2.6 ? .1 : .45)) continue;
    if (d < bd) { bd = d; best = C; }
  }
  return best;
}
function frozenNear(by) { return party.filter(C => C.frozen && C !== by).sort((a, b) => a.pos.distanceTo(by.pos) - b.pos.distanceTo(by.pos))[0] || null; }
