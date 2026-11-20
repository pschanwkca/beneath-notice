
// =====================================================================
//  定型 → 玩具: a teammate who is seen turns into a plastic toy. Mom tidies it into the toy box.
//  Rescue it from the toy box (full strength), or use a Prototype vial anywhere (stamina cap -20%).
//  Food crumbs restore the stamina cap.
// =====================================================================
const TOY = { box: null, fetchQ: [], fetch: null, focus: null };
let PROTO = 0; const VIALS = [], CRUMBS = [];
const PLASTIC = new Map();
function toyLook(C, on) {
  C.root.traverse(o => {
    if (!o.isMesh) return;
    if (on) {
      if (o.userData.orig) return; o.userData.orig = o.material;
      if (o.isInstancedMesh) { o.userData.toy = true; o.count = 1; }
      const col = o.material.color ? o.material.color.clone() : new THREE.Color(.8, .8, .8); const key = col.getHexString();
      let m = PLASTIC.get(key); if (!m) { m = new THREE.MeshPhysicalMaterial({ color: col, roughness: .2, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.4 }); PLASTIC.set(key, m); }
      o.material = m;
    } else if (o.userData.orig) { o.material = o.userData.orig; o.userData.orig = null; if (o.isInstancedMesh) { o.userData.toy = false; o.count = SHELLS; } }
  });
}
function toyBurst(p) { for (let i = 0; i < 34; i++) emit(p, V3(R(-16, 16), R(4, 24), R(-16, 16)), new THREE.Color(.5, 2.2, 2.1), R(.15, .4), R(.4, 1), 40, 2); }
function toyReachable(C) {
  const p = C.pos; if (p.x < -300 || p.x > 300) return false;
  if (p.y < 6 && p.x > 148 && p.x < 234 && p.z > -222 && p.z < -148) return false; // under the fridge
  if (inFridge(C)) return false;
  return true;
}
function toyFreeze(who) {
  if (NET.on) { const L = leader; if (L.frozen || (NET.pend.frz && T - NET.pend.frz < 2)) return; NET.pend.frz = T; meter = 0; if (NET.host) hostFreeze(L, who); else nsend({ t: 'frz', id: L.id, who, p: [L.pos.x, L.pos.y, L.pos.z], y: L.yaw }, NET.hostId); return; }
  const L = leader; const left = party.filter(C => !C.frozen && C !== L);
  if (!left.length || !LVL.toys) { fail(); return; }
  L.on = null; L.hop = null;
  if (LEVEL === 'kitchen' && KS.carried) { KS.carried = false; KS.coreDrop = coreGround(L.pos); }
  L.frozen = true; L.toyAt = 'floor'; L.climbing = false; L.mantle = null; L.vel.set(0, 0, 0); L.tumble = 0; L.toyVy = 0; L.crouch = false; L.toyTilt = 0; L.toyRoll = 0;
  toyLook(L, true); meter = 0; STATE = 'frozen'; failT = 0; TOY.focus = L;
  SND.heart(1); tone(1800, 600, .8, .08, 'triangle'); nz(1.2, 4200, 1, .08, 'highpass'); toyBurst(V3(L.pos.x, L.pos.y + L.h * .5, L.pos.z));
  if (who === 'kid') { say('女兒', '媽媽！那裡有隻玩具！', '#e8a0c0', 2.6); } else say('太太', '咦？……哪來的玩具？', '#f4bb72', 2.4);
  if (KM.mode === 'sus') KM.mode = 'goto';
  if (toyReachable(L)) TOY.fetchQ.push(L);
  refreshPartyHUD();
}
function toyHandOff() {
  const F = TOY.focus; const cand = party.filter(C => !C.frozen).sort((a, b) => a.pos.distanceTo(F.pos) - b.pos.distanceTo(F.pos)); const N = cand[0];
  if (!N) { fail(); return; }
  leader = N; N.vel.set(0, 0, 0); N.tumble = 0; N.queue = []; N.grounded = false; N.stk = false;
  if (N.state !== 'climb' && N.disp) N.pos.copy(N.disp);
  if (N.state === 'climb') { N.climbing = true; N.climbN.set(-Math.sin(N.yaw), 0, -Math.cos(N.yaw)); }
  for (const C of party) if (C !== N && !C.frozen) { C.queue = []; if (C.disp) C.disp.copy(C.pos); }
  trail = []; N.lastTrail.copy(N.pos); assignGaps(); STATE = 'play'; TOY.grace = 1.5; SND.sw(); refreshPartyHUD();
  toast(`${F.S.name}變成了玩具！現在操控：${N.S.name}`, 3.4);
}
function toyRevive(C, proto, by = leader) {
  TOY.fetchQ = TOY.fetchQ.filter(q => q !== C);
  if (TOY.fetch && TOY.fetch.C === C) { TOY.fetch = null; KM.mode = 'goto'; setTimeout(() => { if (LEVEL === 'kitchen') sayW('太太', '……咦？玩具呢？', '#f4bb72', 2.2); }, 300); }
  const L = by;
  if (proto) {
    let p = null; for (const [a, d] of [[1.2, 3.2], [-1.2, 3.2], [2.6, 3], [-2.6, 3], [3.14, 3]]) { const x = L.pos.x + Math.sin(L.yaw + a) * d, z = L.pos.z + Math.cos(L.yaw + a) * d; if (standable(x, z, L.pos.y, C)) { p = V3(x, L.pos.y, z); break; } }
    C.pos.copy(p || L.pos); C.stamMax = Math.max(60, (C.stamMax || 100) - 20); C.stamina = Math.min(C.stamina, C.stamMax);
  }
  C.frozen = false; C.toyAt = null; toyLook(C, false); C.root.rotation.set(0, C.yaw, 0);
  C.disp.copy(C.pos); C.queue = []; C.vel.set(0, 0, 0); C.state = 'idle'; C.qst = 'idle'; C.offK = 0; C.lastTrail = C.pos.clone();
  if (NET.on) { netUnlease([{ id: C.id, x: C.pos.x, y: C.pos.y, z: C.pos.z }]); nsend({ t: 'rev', id: C.id, x: C.pos.x, y: C.pos.y, z: C.pos.z, sm: C.stamMax, pr: proto ? 1 : 0 }); if (C === leader) { TOY.grace = 1.5; meter = 0; } }
  assignGaps(); refreshPartyHUD(); toyBurst(V3(C.pos.x, C.pos.y + C.h * .5, C.pos.z)); SND.pick();
  toastW(proto ? `用 Prototype 救回了${C.S.name}！體力上限變成 ${C.stamMax}%` : `從玩具箱救回了${C.S.name}！`, 3.2);
  sayW(C.S.name, proto ? '……我回來了？身體好重。' : '謝了！還以為要一直做玩具……', C.S.col, 2.4);
}
function useProto() {
  if (NET.on) { if (STATE !== 'play') return; if (leader.frozen) { toast('你變成了玩具，要等隊友救你'); return; } if (NET.host) hostProto(leader.id, null); else nsend({ t: 'proto', id: leader.id }, NET.hostId); return; }
  const fz = party.filter(C => C.frozen); if (STATE !== 'play') return;
  if (!fz.length) { toast(PROTO ? '隊友都好好的，Prototype 留着之後用' : '沒有 Prototype'); return; }
  if (!PROTO) { toast('沒有 Prototype 了——去玩具箱把隊友救出來'); return; }
  PROTO--; toyRevive(fz[0], true);
}
function toyUnfreezeAll() { for (const C of party) if (C.frozen) { C.frozen = false; C.toyAt = null; toyLook(C, false); C.root.rotation.set(0, C.yaw, 0); } TOY.fetch = null; TOY.fetchQ = []; }
function toyHand() { const p = V3(); mom.arms[1].hand.getWorldPosition(p); return p; }
// Mom tidies the toy away (called from her kitchen brain; returns distance walked, or null if not busy)
function momFetch(dt) {
  let F = TOY.fetch;
  if (!F) {
    if (!TOY.fetchQ.length || KM.mode === 'fopen' || STATE === 'fail') return null;
    const C = TOY.fetchQ.shift(); if (!C.frozen || C.toyAt !== 'floor' || !toyReachable(C)) return null;
    F = TOY.fetch = { C, mode: 'walk', t: 0, ap: toyApproach(C.pos) }; KM.mode = 'fetch';
  }
  const P = mom.pos, C = F.C;
  if (!C.frozen) { TOY.fetch = null; KM.mode = 'goto'; return 0; }
  if (F.mode === 'walk') {
    const [ok, d] = momWalk(F.ap.x, F.ap.z, 84, dt); mom.aimT.copy(C.pos);
    if (ok) { F.mode = 'grab'; F.t = 0; F.from = C.pos.clone(); }
    return d;
  }
  if (F.mode === 'grab') {
    F.t += dt; mom.yaw = angDamp(mom.yaw, Math.atan2(C.pos.x - P.x, C.pos.z - P.z), 5, dt); mom.aimT.copy(F.from);
    const k = clamp((F.t - .45) / .5, 0, 1); if (k > 0) { if (C.toyAt !== 'hand') { C.toyAt = 'hand'; refreshPartyHUD(); } C.pos.lerpVectors(F.from, V3().copy(toyHand()).add(V3(0, -C.h * .4, 0)), easeIO(k)); }
    if (F.t > 1.15) { F.mode = 'carry'; F.wps = P.x < 40 && TOY.box.ap.x > 40 ? [V3(60, 0, 8), TOY.box.ap] : [TOY.box.ap]; sayW('太太', LEVEL === 'kitchen' && !KS.said.tidy ? '女兒的玩具又亂放……' : '玩具要收好。', '#f4bb72', 2.2); KS.said.tidy = 1; }
    return 0;
  }
  if (F.mode === 'carry') {
    const wp = F.wps[0]; const [ok, d] = momWalk(wp.x, wp.z, 74, dt); if (ok) { F.wps.shift(); if (!F.wps.length) { F.mode = 'drop'; F.t = 0; } }
    C.pos.copy(toyHand()).add(V3(0, -C.h * .4, 0)); C.toyTilt = .5; return d;
  }
  if (F.mode === 'drop') {
    F.t += dt; const B = TOY.box; mom.yaw = angDamp(mom.yaw, Math.atan2(B.cx - P.x, B.cz - P.z), 5, dt); mom.aimT.set(B.cx, 6, B.cz);
    if (F.t < .5) C.pos.copy(toyHand()).add(V3(0, -C.h * .4, 0));
    else if (C.toyAt === 'hand') { C.toyAt = 'box'; C.pos.set(R(B.x0 + 4, B.x1 - 4), 24, R(B.z0 + 4, B.z1 - 4)); C.toyVy = -20; C.yaw = R(0, 6.28); C.toyTilt = R(-1.3, 1.3); C.toyRoll = R(-.4, .4); refreshPartyHUD(); }
    if (F.t > 1.3) { TOY.fetch = null; KM.mode = 'goto'; }
    return 0;
  }
  return 0;
}
function toyApproach(p) {
  let x = clamp(p.x, -270, 270), z = clamp(p.z, -134, 200);
  if (x > -240 && x < -20 && z > 0 && z < 172) z = p.z < 86 ? -4 : 176; // keep out of the dining table
  const dx = x - p.x, dz = z - p.z; if (Math.hypot(dx, dz) < 16) { const ax = mom.pos.x - p.x, az = mom.pos.z - p.z, a = Math.hypot(ax, az) || 1; x = p.x + ax / a * 18; z = p.z + az / a * 18; }
  return V3(clamp(x, -270, 270), 0, clamp(z, -134, 200));
}
function updToys(dt) {
  const L = leader; TOY.rescuing = null; if (TOY.grace > 0) TOY.grace -= dt;
  if (NET.client) { for (const C of party) if (C.frozen && C.rescueT > 0 && !L.frozen && Math.hypot(L.pos.x - C.pos.x, L.pos.z - C.pos.z) < 4.6) TOY.rescuing = C; }
  else for (const C of party) {
    if (!C.frozen) continue;
    if (C.toyAt !== 'hand') { // fall, rest on whatever is below
      const [s] = supportAt(C.pos.x, C.pos.z, C.r * .5, C.pos.y + .05);
      if (C.pos.y > s + .01 || C.toyVy > 0) { C.toyVy = (C.toyVy || 0) - G * dt; C.pos.y = Math.max(s, C.pos.y + C.toyVy * dt); if (C.pos.y <= s) { if (C.toyVy < -60) SND.land(.4); C.toyVy = 0; } }
    }
    const rs = STATE === 'play' && C.toyAt !== 'hand' ? (NET.on ? playerChars() : [L]).find(q => q !== C && !q.frozen && Math.hypot(q.pos.x - C.pos.x, q.pos.z - C.pos.z) < 4.6 && Math.abs(q.pos.y - C.pos.y) < 4) : null;
    if (rs) {
      C.rescueT = (C.rescueT || 0) + dt; if (rs === L) TOY.rescuing = C; C.toyRoll = Math.sin(T * 34) * .12 * Math.min(1, C.rescueT * 2); if (rnd() < dt * 8) SND.step(.5);
      if (C.rescueT >= 1.4) { C.rescueT = 0; toyRevive(C, false, rs); }
    } else if (C.rescueT > 0) { C.rescueT = Math.max(0, C.rescueT - dt * 2); if (C.toyAt === 'floor') C.toyRoll = 0; }
  }
  // vials
  for (const v of VIALS) {
    if (v.got) continue; v.g.rotation.y += dt * 1.6; v.g.position.y = v.y + 1.6 + Math.sin(T * 2.2 + v.x) * .35; v.halo.position.set(v.x, v.g.position.y, v.z); v.halo.lookAt(camera.position);
    if (STATE === 'play' && !L.frozen && mine(L) && Math.hypot(L.pos.x - v.x, L.pos.y + 1 - v.y - 1.6, L.pos.z - v.z) < 3.6) netGet('vial', VIALS.indexOf(v));
  }
  // crumbs restore the stamina cap
  for (const c of CRUMBS) {
    if (c.got) continue; c.g.rotation.y += dt * .8; c.halo.lookAt(camera.position);
    if (STATE !== 'play' || L.frozen || !mine(L) || Math.hypot(L.pos.x - c.x, L.pos.z - c.z) > 3.4 || Math.abs(L.pos.y - c.y) > 2.5) continue;
    const cap = L.stamMax || 100;
    if (cap >= 100) { if (!c.full || T - c.full > 8) { c.full = T; toast('還不餓——體力上限減少的隊友才需要吃'); } continue; }
    netGet('crumb', CRUMBS.indexOf(c));
  }
}
// ---------- props ----------
let _vialM = null;
function addVial(x, y, z) {
  if (!_vialM) _vialM = { glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .04, transmission: .9, thickness: .3, ior: 1.45, transparent: true, opacity: .55, depthWrite: false }), liq: new THREE.MeshStandardMaterial({ color: 0x5ff2e6, emissive: 0x2ad8cc, emissiveIntensity: 1.6, roughness: .2 }), cap: new THREE.MeshStandardMaterial({ color: 0xd8dde2, metalness: 1, roughness: .25 }) };
  const g = new THREE.Group(); g.position.set(x, y + 1.6, z); LV.add(g);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 2.4, 20, 1, true), _vialM.glass); g.add(tube);
  const bot = new THREE.Mesh(new THREE.SphereGeometry(.42, 20, 10, 0, 6.29, Math.PI / 2, Math.PI / 2), _vialM.glass); bot.position.y = -1.2; g.add(bot);
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, 1.6, 16), _vialM.liq); liq.position.y = -.35; g.add(liq);
  const lb = new THREE.Mesh(new THREE.SphereGeometry(.34, 16, 8, 0, 6.29, Math.PI / 2, Math.PI / 2), _vialM.liq); lb.position.y = -1.15; g.add(lb);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .5, 20), _vialM.cap); cap.position.y = 1.4; g.add(cap);
  g.rotation.z = .18; g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.7, 2.3, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x5ff2e6).multiplyScalar(2.4), transparent: true, opacity: .5, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  LVFX.add(halo); halo.position.set(x, y + 1.6, z);
  const l = new THREE.PointLight(0x5ff2e6, 18, 0, 2); l.position.y = 0; g.add(l);
  VIALS.push({ g, halo, x, y, z, got: false });
}
let _crumbM = null;
function addCrumb(x, y, z, big) {
  if (!_crumbM) _crumbM = new THREE.MeshStandardMaterial({ color: 0xc58a45, roughness: .85, map: null });
  const g = new THREE.Group(); g.position.set(x, y, z); LV.add(g);
  const n = big ? 1 : 4;
  for (let i = 0; i < n; i++) { const geo = big ? new THREE.CylinderGeometry(2.2, 2.3, .8, 18) : new THREE.IcosahedronGeometry(R(.45, .8), 0); const m = new THREE.Mesh(geo, _crumbM); m.position.set(big ? 0 : R(-1, 1), big ? .4 : .35, big ? 0 : R(-1, 1)); m.rotation.set(R(0, 3), R(0, 3), big ? 0 : R(0, 3)); if (big) m.rotation.set(.1, 0, .06); m.castShadow = true; g.add(m); }
  if (big) for (let i = 0; i < 7; i++) { const ch = new THREE.Mesh(new THREE.SphereGeometry(.28, 8, 6), new THREE.MeshStandardMaterial({ color: 0x3a2214, roughness: .6 })); const a = R(0, 6.28), r = R(.3, 1.7); ch.position.set(Math.cos(a) * r, .82, Math.sin(a) * r); ch.scale.y = .5; g.add(ch); }
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.9, 28), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf4bb72).multiplyScalar(1.6), transparent: true, opacity: .35, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  LVFX.add(halo); halo.position.set(x, y + 1.5, z);
  CRUMBS.push({ g, halo, x, y, z, v: big ? 20 : 10, big, got: false });
}
function buildToyBin() {
  const X0 = 226, X1 = 274, Z0 = 98, Z1 = 142, H = 26, W = 1.6;
  const pm = new THREE.MeshPhysicalMaterial({ color: 0x86b8dc, roughness: .38, clearcoat: .7, clearcoatRoughness: .2 });
  const rim = new THREE.MeshPhysicalMaterial({ color: 0xf2c94c, roughness: .35, clearcoat: .6 });
  box(X0, X1, 0, 1.2, Z0, Z1, pm); box(X0, X1, 0, H, Z0, Z0 + W, pm); box(X0, X1, 0, H, Z1 - W, Z1, pm); box(X0, X0 + W, 0, H, Z0 + W, Z1 - W, pm); box(X1 - W, X1, 0, H, Z0 + W, Z1 - W, pm);
  box(X0 - .6, X1 + .6, H, H + 1.4, Z0 - .6, Z0 + W + .2, rim, { col: false }); box(X0 - .6, X1 + .6, H, H + 1.4, Z1 - W - .2, Z1 + .6, rim, { col: false }); box(X0 - .6, X0 + W + .2, H, H + 1.4, Z0, Z1, rim, { col: false }); box(X1 - W - .2, X1 + .6, H, H + 1.4, Z0, Z1, rim, { col: false });
  const [c, x] = cnv(512, 200); x.fillStyle = '#fffaf0'; x.fillRect(0, 0, 512, 200); x.lineCap = 'round';
  x.font = `700 110px ${HAND}`; x.textAlign = 'center'; x.fillStyle = '#e0507a'; x.fillText('玩具', 190, 140); x.font = `700 64px ${HAND}`; x.fillStyle = '#3c78c8'; x.fillText('TOYS', 400, 132);
  crayon(x, [[40, 175], [470, 172]], '#f2c94c', 9);
  const lab = mesh(new THREE.PlaneGeometry(30, 11.7), new THREE.MeshStandardMaterial({ map: tex(c), roughness: .8 }), 250, 13, Z0 - .06, { cast: false }); lab.rotation.y = Math.PI;
  // things already inside
  const bred = new THREE.MeshPhysicalMaterial({ color: 0xe5483f, roughness: .3, clearcoat: .8 }); const bwh = new THREE.MeshPhysicalMaterial({ color: 0xf2f0e8, roughness: .3 });
  resGroup(cmGroup(12.8, 12.8, 12.8, ({ part }) => { part(new THREE.SphereGeometry(6.4, 32, 24), bred, 0, 0, 0); part(new THREE.TorusGeometry(6.42, .7, 10, 48), bwh, 0, 0, 0, { r: [1.1, 0, 0] }); }, [bred]), 238, 130, 1.2, 12.8, 12.8, 12.8, .3, 5, '波波', true);
  const bm = ['#e0507a', '#3c78c8', '#f2c94c'].map((col, i) => { const [bc, bx] = cnv(128, 128); bx.fillStyle = '#e9d6b4'; bx.fillRect(0, 0, 128, 128); bx.font = '900 92px "Fredoka",sans-serif'; bx.textAlign = 'center'; bx.fillStyle = col; bx.fillText('ABC'[i], 64, 98); return new THREE.MeshStandardMaterial({ map: tex(bc), roughness: .7 }); });
  [[259.5, 111.5, 1.2], [267, 111.5, 1.2], [263, 112, 8.2]].forEach(([x, z, y], i) => resGroup(cmGroup(7, 7, 7, ({ part }) => { part(new THREE.BoxGeometry(7, 7, 7), bm[i], 0, 0, 0); }, [bm[i]]), x, z, y, 7, 7, 7, .4, 5, '積木', true));
  TOY.box = { x0: X0 + W, x1: X1 - W, z0: Z0 + W, z1: Z1 - W, cx: 250, cz: 120, ap: V3(250, 0, 74) };
  STATIC.toyBox = V3(250, 30, 120);
}
function toyMarker() { const f = party.find(C => C.frozen && C.toyAt !== 'hand'); return f ? V3(f.pos.x, f.pos.y + f.h + 2, f.pos.z) : null; }
