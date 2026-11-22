// =====================================================================
//  TITLE SCREEN — the whole crew in a lazy, slow-motion squabble on the lab workbench
//  · a cartoon fight cloud in the middle: whoever is inside gets flung out every so often, tumbles,
//    shakes it off (with a sticker over their head) and dives straight back in
//  · round the outside: a chase, the frog bouncing about, the bat swooping overhead, the tortoise
//    spinning in its shell, the chameleon cheering on the machine's base, and the professor trying
//    (and failing) to break it up
// =====================================================================
const TTL = { on: false, saved: null, cloud: null, puffs: [], stars: [], t: 0, next: 1.2, inCloud: [], fly: [], camA: 0 };
const TC = () => V3(-12, 92, -206).add(BO);   // the middle of the brawl (open bench top, the machine glowing behind)
// stand on whatever is there (the notebook is a step up)
const ttlY = (x, z) => { const [s] = supportAt(x, z, .5, BO.y + 104); return s > BO.y + 80 ? s : BO.y + 92; };
function titleSetup() {
  TTL.on = true; TTL.t = 0; TTL.next = 2.6;
  TTL.saved = {}; for (const id in chars) { const C = chars[id]; TTL.saved[id] = { vis: C.root.visible, pos: C.pos.clone(), yaw: C.yaw, state: C.state, shell: C.shell, roost: C.roost, wave: C.wave, lie: C.lieK }; }
  if (!TTL.cloud) {
    const g = new THREE.Group(); scene.add(g); TTL.cloud = g;
    const m = new THREE.MeshStandardMaterial({ color: 0xf3ece0, roughness: 1, emissive: 0x4a3a2a, emissiveIntensity: .18 });
    for (let i = 0; i < 18; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), m); p.userData = { a: i / 18 * Math.PI * 2, r: R(2.4, 5.2), y: R(1.2, 6.5), s: R(2, 3.5), sp: R(.35, .8) * (i % 2 ? 1 : -1), ph: R(0, 6) }; g.add(p); TTL.puffs.push(p); }
    const sm = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.35, .35) });
    const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? .45 : 1.1; sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.ShapeGeometry(sh), sm); s.visible = false; s.userData = { t: 9 }; g.add(s); TTL.stars.push(s); }
  }
  TTL.cloud.visible = true; TTL.cloud.position.copy(TC());
  for (const id in chars) { const C = chars[id]; C.root.visible = IDS.includes(id); C.shell = false; C.roost = null; C.lieK = 0; C.wave = false; C.tumble = 0; C.emo = null; C.vel.set(0, 0, 0); if (C.disp) C.disp.copy(C.pos); }
  chars.gecko.root.visible = false;
  // who starts where
  TTL.inCloud = ['sq', 'bear', 'coon'].filter(id => chars[id]); TTL.fly = [];
}
function titleEnd() {
  lobbyEnd(); if (!TTL.on) return; TTL.on = false; if (TTL.cloud) TTL.cloud.visible = false;
  for (const id in TTL.saved) { const C = chars[id], S = TTL.saved[id]; if (!C) continue; C.root.visible = S.vis; C.pos.copy(S.pos); C.yaw = S.yaw; C.state = S.state; C.shell = S.shell; C.roost = S.roost; C.wave = S.wave; C.lieK = S.lie; C.tumble = 0; C.emo = null; C.spd = 0; C.squash = 0; if (C.disp) C.disp.copy(C.pos); }
  for (const B of EMO.bubbles) B.el.remove(); EMO.bubbles.length = 0;
}
// a character flung out of the cloud, or diving back in
function titleFling(id) {
  const C = chars[id], c = TC(), a = R(0, Math.PI * 2) * 0 + pick([.3, 1.2, 2.2, 2.9, 4.1, 5.2]) + R(-.3, .3), d = R(11, 15);
  C.root.visible = true; C.pos.set(c.x, c.y + 4, c.z);
  TTL.fly.push({ C, id, ph: 'out', t: 0, p0: C.pos.clone(), p1: V3(c.x + Math.cos(a) * d, c.y, c.z + Math.sin(a) * d), h: R(5, 7.5), dur: R(1.05, 1.3) });
  for (const s of TTL.stars) if (s.userData.t > .6) { s.userData.t = 0; s.userData.v = V3(Math.cos(a) * R(3, 5), R(5, 8), Math.sin(a) * R(3, 5)); s.position.set(0, R(3, 6), 0); s.visible = true; break; }
  SND.thud(.2); tone(R(380, 460), 220, .14, .025, 'triangle');
}
function updTitle(dt) {
  if (!WORLD) return;
  if (!TTL.on) titleSetup();
  if (lobbyActive()) { TTL.t += dt; updLobby(dt); return; } else if (LOBBY.on) lobbyEnd();
  TTL.t += dt; const t = TTL.t, c = TC();
  // the cloud churns and bobs
  const g = TTL.cloud, n = TTL.inCloud.length; g.visible = n > 0; const big = .6 + n * .1;
  g.position.set(c.x + Math.sin(t * 1.6) * .35, c.y + Math.abs(Math.sin(t * 2.2)) * .5, c.z + Math.cos(t * 1.3) * .35);
  for (const p of TTL.puffs) { const u = p.userData, a = u.a + t * u.sp; p.position.set(Math.cos(a) * u.r * big, u.y * big + Math.sin(t * 1.4 + u.ph) * .5, Math.sin(a) * u.r * big); p.scale.setScalar(u.s * big * (1 + Math.sin(t * 2 + u.ph) * .06)); }
  for (const s of TTL.stars) { const u = s.userData; if (!s.visible) continue; u.t += dt; s.position.addScaledVector(u.v, dt); u.v.y -= 14 * dt; s.quaternion.copy(camera.quaternion); s.rotateZ(t * 2); s.scale.setScalar(1.4 * (1 - u.t / 1.4)); if (u.t > 1.4) s.visible = false; }
  if (rnd() < dt * .9 && n) { const s = TTL.stars.find(q => !q.visible); if (s) { s.userData.t = .2; s.userData.v = V3(R(-4, 4), R(5, 8), R(-4, 4)); s.position.set(R(-4, 4), R(5, 9), R(-4, 4)); s.visible = true; } }
  // every so often someone gets thrown out; whoever is out runs back in
  TTL.next -= dt;
  if (TTL.next <= 0 && TTL.inCloud.length > 1) { const id = TTL.inCloud.splice(Math.floor(rnd() * TTL.inCloud.length), 1)[0]; titleFling(id); TTL.next = R(4.5, 7); }
  for (let i = TTL.fly.length - 1; i >= 0; i--) {
    const F = TTL.fly[i], C = F.C; F.t += dt;
    if (F.ph === 'out') {
      const k = Math.min(1, F.t / F.dur); C.pos.lerpVectors(F.p0, F.p1, k); C.pos.y += Math.sin(k * Math.PI) * F.h; C.state = 'air'; C.tumble = 0; C.yaw += dt * 2.2;
      if (k >= 1) { F.ph = 'daze'; F.t = 0; C.pos.y = ttlY(C.pos.x, C.pos.z); C.tumble = 0; C.squash = .55; C.state = 'idle'; SND.land(.35); C.yaw = Math.atan2(c.x - C.pos.x, c.z - C.pos.z); if (rnd() < .7) emoShow(C, pick(['angry', 'huh', 'laugh', 'laugh', 'shock'])); }
    } else if (F.ph === 'daze') {
      C.state = 'idle'; C.head.rotation.z = Math.sin(F.t * 6) * .14 * Math.max(0, 1 - F.t / 1.6);
      if (F.t > 1.8) { F.ph = 'run'; F.t = 0; C.head.rotation.z = 0; }
    } else if (F.ph === 'run') {
      const dx = c.x - C.pos.x, dz = c.z - C.pos.z, d = Math.hypot(dx, dz), sp = 15 * C.S.spd;
      C.yaw = Math.atan2(dx, dz); C.state = 'walk'; C.spd = sp; C.pos.x += dx / d * sp * dt; C.pos.z += dz / d * sp * dt; C.pos.y = ttlY(C.pos.x, C.pos.z);
      if (d < 7) { F.ph = 'dive'; F.t = 0; F.p0 = C.pos.clone(); }
    } else if (F.ph === 'dive') {
      const k = Math.min(1, F.t / .6); C.pos.lerpVectors(F.p0, V3(c.x, c.y + 2, c.z), k); C.pos.y += Math.sin(k * Math.PI) * 3.5; C.state = 'air';
      if (k >= 1) { TTL.inCloud.push(F.id); TTL.fly.splice(i, 1); C.spd = 0; tone(300, 600, .08, .03, 'triangle'); }
    }
    if (C.disp) C.disp.copy(C.pos);
  }
  // inside the cloud: tumbling round and round, bits sticking out
  TTL.inCloud.forEach((id, i) => { const C = chars[id]; if (!C) return; const a = t * .9 + i * 2.1, r = 2.2 + Math.sin(t * 1.1 + i * 1.7) * .9;
    C.root.visible = true; C.pos.set(g.position.x + Math.cos(a) * r, c.y + 1 + Math.abs(Math.sin(t * 1.8 + i * 2.3)) * 1.4, g.position.z + Math.sin(a) * r); C.yaw = a + Math.PI / 2; C.state = 'walk'; C.spd = 8; C.tumble = 0; if (C.disp) C.disp.copy(C.pos); });
  // the chase: the rabbit with the hedgehog after it, round and round the cloud
  const chase = (id, a, r, sp) => { const C = chars[id]; if (!C) return; const x = c.x + 2 + Math.cos(a) * r, z = c.z + 1 + Math.sin(a) * r * .75; C.pos.set(x, ttlY(x, z) + Math.abs(Math.sin(a * 5)) * (id === 'rab' ? 1.2 : 0), z); C.yaw = Math.atan2(-Math.sin(a) * sp, Math.cos(a) * sp * .75); C.state = 'walk'; C.spd = 11; if (C.disp) C.disp.copy(C.pos); };
  const ca = t * .5; chase('rab', ca, 13, 1); chase('hog', ca - .8, 13, 1);
  if (Math.floor(t / 9.5) !== Math.floor((t - dt) / 9.5) && chars.rab) emoShow(chars.rab, pick(['laugh', 'wave', 'shock']));
  if (Math.floor((t + 4.7) / 9.5) !== Math.floor((t + 4.7 - dt) / 9.5) && chars.hog) emoShow(chars.hog, pick(['angry', 'angry', 'laugh']));
  // the frog bounces about in front
  const fr = chars.frog; if (fr) { const ph = t * .55, hop = Math.min(1, (ph % 1) * 1.8), base = Math.floor(ph); const x0 = c.x - 6 + Math.sin(base * 2.3) * 4, z0 = c.z + 14 + Math.cos(base * 1.7) * 3, x1 = c.x - 6 + Math.sin((base + 1) * 2.3) * 4, z1 = c.z + 14 + Math.cos((base + 1) * 1.7) * 3;
    fr.pos.set(lerp(x0, x1, hop), 0, lerp(z0, z1, hop)); fr.pos.y = ttlY(fr.pos.x, fr.pos.z) + Math.sin(hop * Math.PI) * 3.5; fr.yaw = Math.atan2(x1 - x0, z1 - z0); fr.state = hop < 1 ? 'air' : 'idle'; if (fr.disp) fr.disp.copy(fr.pos); }
  // the bat swoops round above
  const bt = chars.bat; if (bt) { const a = -t * .42; bt.pos.set(c.x + 3 + Math.cos(a) * 13, c.y + 11.5 + Math.sin(t * .9) * 1, c.z + Math.sin(a) * 9); bt.yaw = Math.atan2(Math.sin(a), -Math.cos(a)); bt.state = 'air'; bt.flapT = Math.sin(t * 3.2) > .2 ? .2 : 0; if (bt.disp) bt.disp.copy(bt.pos); }
  // the tortoise spins in its shell
  const tt = chars.tort; if (tt) { tt.pos.set(c.x + 5, 0, c.z + 17); tt.pos.y = ttlY(tt.pos.x, tt.pos.z); tt.state = (t % 11) < 3 ? 'shell' : 'idle'; tt.yaw += dt * (tt.state === 'shell' ? 2.5 : 0); if (tt.state === 'idle') tt.yaw = angDamp(tt.yaw, .3, 6, dt); if (tt.disp) tt.disp.copy(tt.pos); }
  // the chameleon cheers from the machine's base; the professor tries to stop it all
  const ch = chars.cham; if (ch) { ch.pos.set(c.x + 11, 0, c.z + 9); ch.pos.y = ttlY(ch.pos.x, ch.pos.z); ch.yaw = Math.atan2(c.x - ch.pos.x, c.z - ch.pos.z); ch.state = 'idle'; ch.wave = Math.sin(t * .7) > .55; if (ch.disp) ch.disp.copy(ch.pos); }
  const dd = chars.dad; dd.pos.set(c.x + 8, 0, c.z - 7); dd.pos.y = ttlY(dd.pos.x, dd.pos.z); dd.yaw = Math.atan2(c.x - dd.pos.x, c.z - dd.pos.z); dd.state = 'idle'; dd.wave = (t % 8) < 2.2; if (dd.disp) dd.disp.copy(dd.pos);
  if (Math.floor((t + 1) / 11) !== Math.floor((t + 1 - dt) / 11)) emoShow(dd, pick(['huh', 'cry', 'angry']));
  if (ch && Math.floor((t + 6) / 13) !== Math.floor((t + 6 - dt) / 13)) emoShow(ch, pick(['good', 'laugh', 'love']));
  // camera: low, close and a little to the side; on wide screens the brawl sits right of the title card,
  // on narrow (portrait) screens it sits in the top half above the card
  TTL.camA = Math.sin(t * .08) * .07; const asp = innerWidth / innerHeight, narrow = innerWidth < 900;
  const dist = narrow ? (asp < .8 ? 62 : 50) : 40, a = .24 + TTL.camA;
  camera.position.set(c.x + Math.sin(a) * dist, c.y + (narrow ? 15 : 11) + Math.sin(t * .12) * .6, c.z + Math.cos(a) * dist);
  const look = narrow ? V3(c.x, c.y - (asp < .8 ? 10 : 6), c.z) : V3(c.x - 9, c.y + 4, c.z);
  camera.lookAt(look);
  bokeh.uniforms.focus.value = camera.position.distanceTo(c);
}
