// =====================================================================
//  第五章 · 學校 — the people and the school day
//  The bell runs everything: lessons (the class at their desks, the teacher at the board, the
//  playground empty but for the guard in his booth) → break (the doors open, the class pours out to
//  play, the teacher on duty, the daughter alone on a bench, drawing) → back in (a line through the
//  corridor into 3A; its back door stands open until the last one is in) → lessons again …
//  Children are drawn light (crowd detail); the teacher, the guard and the daughter in full.
// =====================================================================
const SC_NAMES = [['志明', '#7ab8f0'], ['嘉欣', '#f0a0c0'], ['浩然', '#8ad0a0'], ['詠詩', '#e0b0f0'], ['子軒', '#f0c070'], ['曉晴', '#f09080'], ['俊傑', '#a0c0e0'], ['芷晴', '#f0d090'], ['家樂', '#90d0d0'], ['心怡', '#d0a0a0']];
const SC_PH = ['class', 'out', 'recess', 'in'];
// where each child plays at break: [activity, x, z]
const SC_PLAY = [['ball', 1640, 4560], ['ball', 1780, 4640], ['tag', 2300, 4500], ['tag', 2500, 4640], ['tag', 2200, 4700], ['chat', 1320, 4800], ['chat', 1380, 4820], ['hop', 1100, 4440], ['ball', 1720, 4480], ['hop', 1150, 4470]];

function buildSchoolPeople() {
  const cloth = (c, sh) => new THREE.MeshPhysicalMaterial({ color: c, roughness: .8, sheen: sh ?? .4, sheenColor: 0xffffff });
  const shoe = c => new THREE.MeshStandardMaterial({ color: c, roughness: .6 });
  const shirt = cloth(0xf2f0ea), shirtB = cloth(0xc8dcef), navy = cloth(0x23304a, .3), grey = cloth(0x5a5e66, .3);
  const hairs = [0x1a120c, 0x241812, 0x120c08, 0x2e1e14];
  const styles = ['short', 'pig', 'short', 'long', 'short', 'bun', 'short', 'pig', 'short', 'long'];
  for (let i = 0; i < 10; i++) {
    const girl = styles[i] !== 'short';
    const H = buildHuman({ build: 'k', lod: true, top: girl ? shirtB : shirt, pants: girl ? navy : grey, sleeve: 'short', skin: MAT.skin, shoe: shoe(i % 3 ? 0x1a1a1e : 0xf0eee8), sock: null, hair: hairs[i % 4], style: styles[i], tie: new THREE.MeshStandardMaterial({ color: [0xe8607a, 0x4a8ae0, 0xf0c040][i % 3], roughness: .5 }) });
    H.root.visible = true; H.stride = 40;
    const seat = SC.seats.filter(s => !(s.ri === SC_HER[0] && s.ci === SC_HER[1]))[i];
    const k = { H, i, name: SC_NAMES[i][0], col: SC_NAMES[i][1], seat, play: SC_PLAY[i], mode: 'seat', t: R(4, 14), path: null, pi: 0, next: 'seat', look: V3(), said: 0, glance: 0, gk: 0, tgt: V3(), v: 110 };
    H.pos.set(seat.x - 4, GY, seat.z); H.yaw = -Math.PI / 2; npcHome(H.root, H.pos, H.yaw, 'school'); SC.kids.push(k);
  }
  // their teacher, 陳老師 (also on playground duty at break)
  { const H = buildHuman({ build: 'f', top: new THREE.MeshPhysicalMaterial({ color: 0x8aa088, roughness: .9, sheen: .6, sheenColor: 0xd0e0c8 }), pants: cloth(0x2a2e38, .3), skin: MAT.skin, shoe: shoe(0x5a3a2a), hair: 0x1e140e, style: 'bun', glasses: true });
    H.root.visible = true; H.pos.set(1748, GY, 5500); H.yaw = Math.PI / 2; npcHome(H.root, H.pos, H.yaw, 'school');
    const chalk = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 5, 8), new THREE.MeshStandardMaterial({ color: 0xf4f2ea, roughness: .9 })); chalk.position.set(0, -14, 3); chalk.rotation.x = 1.2; H.arms[0].el.add(chalk);
    SC.tch = { H, name: '陳老師', col: '#b8d0b0', mode: 'face', t: R(5, 8), look: V3(2300, GY + 60, 5500), path: null, pi: 0, next: 'face', duty: 0, walked: 0, chalk }; }
  // the guard in his booth
  { const B = SC.booth, H = buildHuman({ top: new THREE.MeshPhysicalMaterial({ color: 0x3a4a64, roughness: .85, sheen: .3, sheenColor: 0x8090b0 }), pants: cloth(0x2a2e34, .2), skin: MAT.skin, shoe: shoe(0x1a1a1a), hair: 0x9a948c, cap: new THREE.MeshStandardMaterial({ color: 0x24304a, roughness: .7 }), badge: new THREE.MeshStandardMaterial({ color: 0xd8b040, metalness: .7, roughness: .3 }) });
    H.root.visible = true; H.pos.set(B.x0 + 64, GY + 10, B.z0 + 60); H.yaw = -Math.PI / 2 - .3; H.pelvis.position.y = 44;
    for (const L of H.legs) { L.hip.rotation.x = -1.45; L.knee.rotation.x = 1.5; L.ankle.rotation.x = 0; } H.root.position.copy(H.pos); H.root.rotation.y = H.yaw; npcHome(H.root, H.pos, H.yaw, 'school');
    const paper = new THREE.Group(); const pm = new THREE.MeshStandardMaterial({ map: typeof newsTex === 'function' ? newsTex() : null, color: 0xece6d8, roughness: .9, side: THREE.DoubleSide });
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(28, 38), pm); p.position.set(s * 14, 0, 0); p.rotation.y = s * .25; paper.add(p); } paper.position.set(0, 112, 30); H.root.add(paper);
    SC.grd = { H, name: '保安伯伯', col: '#a8b4c8', mode: 'news', t: R(6, 10), look: V3(2060, GY + 20, 4300), paper }; }
  // a ball for the kick-about
  { const b = new THREE.Mesh(new THREE.SphereGeometry(10, 20, 14), new THREE.MeshStandardMaterial({ color: 0xd86a2a, roughness: .55 })); b.castShadow = true; LV.add(b); b.position.set(1700, GY + 10, 4560); SC.ball = { m: b, from: 0, to: 1, k: 1, t: 0 }; npcHome(b, b.position, 0, 'school'); }
}

// ---------- the bell ----------
function scBell(next) {
  SC.phase = next; SC.pt = 0; SC.bellT = 3.2;
  if (STATE === 'play' || STATE === 'cine' || STATE === 'frozen') scBellSound();
  for (const k of SC.kids) scSend(k, next);
  scSendTeacher(next); scSendHer(next);
}
function scBellSound() {   // an old electric school bell: a fast-beating metal ring, three seconds
  const C = AU.ctx; if (!C) return; const n = C.currentTime, d = 2.8;
  const g = C.createGain(); g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(.075, n + .03); g.gain.setValueAtTime(.075, n + d - .25); g.gain.linearRampToValueAtTime(0, n + d); g.connect(AU.out);
  const am = C.createOscillator(), amg = C.createGain(); am.frequency.value = 24; amg.gain.value = .5; am.connect(amg);
  const vca = C.createGain(); vca.gain.value = .5; amg.connect(vca.gain); vca.connect(g);
  for (const [f, a] of [[1850, 1], [2470, .5], [3720, .3]]) { const o = C.createOscillator(), og = C.createGain(); o.type = 'square'; o.frequency.value = f; og.gain.value = a * .3; o.connect(og); og.connect(vca); o.start(n); o.stop(n + d); }
  am.start(n); am.stop(n + d);
}
// paths between the classroom and the playground (back door → corridor → main doors → walkway)
function scPathOut(seat, end) {
  const p = [[seat.x + 34, seat.z], [seat.x + 34, 5250], [2425, 5250], [2425, 5130], [2090 + R(-20, 20), 5100], [2060 + R(-30, 30), 4990], [2060 + R(-60, 60), 4930]];
  if (end) p.push(end); return p;
}
function scPathIn(from, seat) { return [[from[0], from[1]], [2060 + R(-50, 50), 4930], [2060 + R(-25, 25), 4990], [2090, 5100], [2425, 5130], [2425, 5250], [seat.x + 34, 5250], [seat.x + 34, seat.z], [seat.x - 4, seat.z]]; }
function scSend(k, ph) {
  const H = k.H;
  if (ph === 'out') { k.mode = 'path'; k.pi = 0; k.wait = .5 + k.i * .55; k.v = 120; k.path = scPathOut(k.seat, [k.play[1], k.play[2]]); k.next = k.play[0]; }
  else if (ph === 'in') { k.mode = 'path'; k.pi = 0; k.wait = .3 + k.i * .5; k.v = 125; k.path = scPathIn([H.pos.x, H.pos.z], k.seat); k.next = 'seat'; }
}
function scSendTeacher(ph) {
  const S = SC.tch; if (!S) return;
  if (ph === 'out') { S.mode = 'path'; S.pi = 0; S.wait = .2; S.path = [[1760, 5300], [1760, 5240], [2425, 5250], [2425, 5130], [2060, 5100], [2060, 4970], [1500, 4940]]; S.next = 'duty'; S.duty = 0; }
  else if (ph === 'in') { S.mode = 'path'; S.pi = 0; S.wait = 6; S.path = [[S.H.pos.x, S.H.pos.z], [2060, 4970], [2090, 5100], [2425, 5130], [2425, 5250], [1760, 5250], [1748, 5500]]; S.next = 'face'; S.walked = 0; }
}

// ---------- each child ----------
// (a route can be missing: online, a film can start when only the host knows where everyone was walking)
function scKidTick(k, dt) {
  const H = k.H; k.t -= dt; let moveD = 0, run = 0, sit = false;
  if (k.wait > 0) { k.wait -= dt; sit = k.mode === 'path' && SC.phase === 'out'; k.sit = sit; if (!sit) humanAnim(H, 0, dt); else scSit(k, dt); H.aim.lerp(H.aimT, 1 - Math.exp(-4 * dt)); humanAimArm(H, 0, dt); return; }
  switch (k.mode) {
    case 'seat': sit = true;
      if (k.glance > 0) { k.glance -= dt; H.aimT.set(H.pos.x + 200, GY + 40, H.pos.z + (k.i % 2 ? 160 : -160)); }
      else { H.aimT.set(1716, GY + 150 + Math.sin(T * .4 + k.i) * 30, 5500 + Math.sin(T * .3 + k.i * 2) * 60); if (k.t <= 0) { k.t = R(9, 22); if (SC.phase === 'class' && rnd() < .55) { k.glance = R(1.4, 2.4); } } }
      break;
    case 'path': { const w = k.path && k.path[k.pi]; if (!w) { k.mode = k.next || (SC.phase === 'class' ? 'seat' : k.play[0]); k.t = R(3, 6); break; } const st = kidStep(H, w[0], w[1], k.v, dt); moveD = st; H.aimT.set(w[0] + (w[0] - H.pos.x) * 3, GY + 70, w[1] + (w[1] - H.pos.z) * 3); if (!st) k.pi++; break; }
    case 'tag': { run = 1; if (!k.tgt.x || Math.hypot(k.tgt.x - H.pos.x, k.tgt.z - H.pos.z) < 20 || k.t <= 0) { k.tgt.set(R(1900, 2700), GY, R(4400, 4820)); k.t = R(2, 4); } moveD = kidStep(H, k.tgt.x, k.tgt.z, 205, dt); H.aimT.set(k.tgt.x, GY + 50, k.tgt.z);
      if (STATE === 'play') for (const C of party) if (mine(C) && !C.frozen && C.pos.y < GY + 10 && Math.hypot(C.pos.x - H.pos.x, C.pos.z - H.pos.z) < 10) knock(C, V3(H.pos.x - Math.sin(H.yaw) * 16, GY, H.pos.z - Math.cos(H.yaw) * 16), C === leader ? '差點被同學踩到！' : null);
      break; }
    case 'ball': { const B = SC.ball, j = SC.kids.filter(q => q.mode === 'ball').indexOf(k); const home = V3(k.play[1], GY, k.play[2]); moveD = kidStep(H, home.x, home.z, 120, dt); H.aimT.copy(B.m.position); if (!moveD) H.yaw = angDamp(H.yaw, Math.atan2(B.m.position.x - H.pos.x, B.m.position.z - H.pos.z), 6, dt); k.bj = j; break; }
    case 'chat': { const o = SC.kids[k.i === 5 ? 6 : 5]; moveD = kidStep(H, k.play[1], k.play[2], 110, dt); if (!moveD) H.yaw = angDamp(H.yaw, Math.atan2(o.H.pos.x - H.pos.x, o.H.pos.z - H.pos.z), 5, dt); H.aimT.set(o.H.pos.x, GY + 80, o.H.pos.z); break; }
    case 'hop': { const z0 = 4410 + (k.i === 9 ? 40 : 0), z1 = 4540; const f = (Math.sin(T * 1.1 + k.i) + 1) / 2; moveD = kidStep(H, 1100 + Math.sin(T * 2.3 + k.i) * 6, lerp(z0, z1, f), 70, dt); H.aimT.set(1100, GY, H.pos.z + 60); break; }
    case 'chase': run = 1; moveD = kidStep(H, k.tgt.x, k.tgt.z, k.v, dt); H.aimT.set(k.tgt.x, GY, k.tgt.z); break;
    case 'alert': if (k.prev === 'seat') sit = true; else humanAnim(H, 0, dt); H.aimT.copy(k.look); if (k.t <= 0) k.mode = k.prev || (SC.phase === 'class' ? 'seat' : k.play[0]); break;
  }
  k.sit = sit;
  if (k.mode === 'alert' && !sit) { }
  else if (sit) scSit(k, dt);
  else { H.pelvis.position.y = H.dim.pelN; const foot = humanAnim(H, moveD, dt, run); if (k.mode === 'hop') { H.root.position.y = GY + Math.abs(Math.sin(T * 6 + k.i)) * 6; } }
  H.aim.lerp(H.aimT, 1 - Math.exp(-4 * dt)); const yr = humanAimArm(H, 0, dt);
  if (k.mode === 'seat') H.chest.rotation.y = damp(H.chest.rotation.y, k.glance > 0 ? (k.i % 2 ? .7 : -.7) : 0, 5, dt);
}
// seated at a desk, writing
function scSit(k, dt) {
  const H = k.H, S = k.seat; H.pos.set(S.x - 4, GY, S.z); H.yaw = -Math.PI / 2; H.root.position.copy(H.pos); H.root.rotation.y = H.yaw;
  humanGait(H, H.phase, false, dt, 0, true); H.pelvis.position.y = 39;
  for (const L of H.legs) { L.hip.rotation.x = -1.5; L.knee.rotation.x = 1.55 + Math.sin(T * 2 + k.i + L.s) * .12; L.ankle.rotation.x = .1; }
  humanSettle(H, 1); H.chest.rotation.x = .18;
  const A0 = H.arms[0], A1 = H.arms[1]; A0.sh.rotation.set(-1.05, -.25, 0); A0.el.rotation.x = -.95; A1.sh.rotation.set(-1.0 + Math.sin(T * 5 + k.i) * .03, .25, 0); A1.el.rotation.x = -1.05 + Math.sin(T * 8 + k.i) * .04;
}
// the ball goes back and forth between whoever's playing ball
function scBallTick(dt) {
  const B = SC.ball, P = SC.kids.filter(q => q.mode === 'ball' && !q.wait); if (!B) return;
  if (P.length < 2 || SC.phase !== 'recess') { if (SC.phase === 'class') B.m.position.set(2720, GY + 30, 4940); return; }
  B.k += dt / 1.1; if (B.k >= 1) { B.k = 0; B.from = B.to % P.length; B.to = (B.from + 1 + Math.floor(rnd() * (P.length - 1))) % P.length; nz(.05, 900, 2, .035); const kk = P[B.from].H; kk.arms[0].sh.rotation.x = -.6; }
  const a = P[B.from % P.length].H.pos, b = P[B.to % P.length].H.pos; const t = B.k;
  B.m.position.set(lerp(a.x, b.x, t) + Math.sin(a.z) * 0, GY + 10 + Math.sin(t * Math.PI) * 50, lerp(a.z, b.z, t)); B.m.rotation.x += dt * 9;
}

// ---------- the teacher ----------
function scTeacherTick(dt) {
  const S = SC.tch; if (!S) return; const H = S.H; S.t -= dt; let moveD = 0;
  if (S.wait > 0) { S.wait -= dt; humanAnim(H, 0, dt); }
  else switch (S.mode) {
    case 'write': humanAnim(H, 0, dt); H.yaw = angDamp(H.yaw, -Math.PI / 2, 4, dt); H.aimT.set(1700, GY + 160, H.pos.z); if (S.t <= 0) { S.mode = 'face'; S.t = R(5, 8); } break;
    case 'face': humanAnim(H, 0, dt); H.yaw = angDamp(H.yaw, Math.PI / 2, 4, dt); H.aimT.set(2350, GY + 40, 5500 + Math.sin(T * .5) * 240);
      if (S.t <= 0) { if (SC.pt > 30 && !S.walked && rnd() < .5) { S.walked = 1; S.mode = 'path'; S.pi = 0; S.path = [[1860, 5420], [2300, 5420], [2380, 5560], [2300, 5420], [1860, 5420], [1748, 5500]]; S.next = 'face'; sayW(S.name, rnd() < .5 ? '大家專心做作業。' : '我睇吓大家寫成點……', S.col, 2.4); }
        else { S.mode = 'write'; S.t = R(6, 10); } } break;
    case 'path': { const w = S.path && S.path[S.pi]; if (!w) { S.mode = S.next || 'face'; S.t = R(4, 7); break; } const st = kidStep(H, w[0], w[1], 95, dt); moveD = st; H.aimT.set(w[0] + (w[0] - H.pos.x) * 2, GY + 60, w[1] + (w[1] - H.pos.z) * 2); if (!st) S.pi++; break; }
    case 'duty': { const pts = [[1500, 4940], [2700, 4940], [2400, 4650], [1700, 4650]]; const w = pts[S.duty % pts.length]; const st = kidStep(H, w[0], w[1], 70, dt); moveD = st; if (!st && S.t <= 0) { S.duty++; S.t = R(3, 6); } H.aimT.set(H.pos.x + Math.sin(T * .6) * 300, GY + 30, H.pos.z - 300); break; }
    case 'alert': humanAnim(H, 0, dt); H.aimT.copy(S.look); if (S.t <= 0) S.mode = S.prev || 'face'; break;
  }
  if (S.mode === 'path' || S.mode === 'duty') { H.pelvis.position.y = H.dim.pelN; humanAnim(H, moveD, dt); }
  H.aim.lerp(H.aimT, 1 - Math.exp(-3.5 * dt)); humanAimArm(H, 0, dt);
  S.chalk.visible = S.mode === 'write';
  if (S.mode === 'write') { const A = H.arms[0]; A.sh.rotation.set(-2.2 + Math.sin(T * 3) * .1, -.2, 0); A.el.rotation.x = -.5 + Math.sin(T * 7) * .15; }
}
// ---------- the guard: newspaper, a look out of the window, tea ----------
function scGuardTick(dt) {
  const S = SC.grd; if (!S) return; const H = S.H; S.t -= dt;
  if (S.mode === 'news' && S.t <= 0) { S.mode = 'look'; S.t = R(4, 6); }
  else if (S.mode === 'look' && S.t <= 0) { S.mode = rnd() < .3 ? 'tea' : 'news'; S.t = S.mode === 'news' ? R(7, 12) : R(3, 4); }
  else if ((S.mode === 'tea' || S.mode === 'alert') && S.t <= 0) { S.mode = 'news'; S.t = R(7, 11); }
  const news = S.mode === 'news'; S.paper.visible = news || S.mode === 'tea';
  S.paper.position.y = damp(S.paper.position.y, news ? 112 : 70, 4, dt); S.paper.position.z = damp(S.paper.position.z, news ? 30 : 22, 4, dt);
  if (S.mode === 'look') S.look.set(2060 + Math.sin(T * .7) * 160, GY + 10, 4300 + Math.cos(T * .5) * 60);
  H.aimT.copy(news ? V3(H.pos.x - 60, GY + 100, H.pos.z) : S.look); H.aim.lerp(H.aimT, 1 - Math.exp(-3 * dt)); humanAimArm(H, 0, dt);
  for (const A of H.arms) { A.sh.rotation.set(news ? -1.2 : -.45, A.s * (news ? -.35 : -.15), 0); A.el.rotation.x = news ? -1.1 : -.8; }
  H.root.position.copy(H.pos); H.root.rotation.y = H.yaw;
}
// ---------- the daughter: at her desk in lessons, alone on the bench at break ----------
function scSendHer(ph) {
  const S = SC.her || (SC.her = { mode: 'seat', path: null, pi: 0, wait: 0 }); const seat = SC.seats.find(s => s.ri === SC_HER[0] && s.ci === SC_HER[1]);
  if (ph === 'out') { S.mode = 'path'; S.pi = 0; S.wait = 6.5; S.path = scPathOut(seat, [SC.herBench.x, SC.herBench.z + 14]); S.next = 'bench'; }
  else if (ph === 'in') { const P = KID.root.position; S.mode = 'path'; S.pi = 0; S.wait = 2; S.path = scPathIn([P.x, P.z], seat); S.next = 'seat'; }
}
function scHerTick(dt) {
  const S = SC.her || (SC.her = { mode: 'seat', path: null, pi: 0, wait: 0 }), H = KID; if (!H.root) return;
  const seat = SC.seats.find(s => s.ri === SC_HER[0] && s.ci === SC_HER[1]);
  H.root.visible = true; let moveD = 0;
  if (S.wait > 0) { S.wait -= dt; }
  else if (S.mode === 'path') { const w = S.path && S.path[S.pi]; if (!w) { S.mode = S.next || 'seat'; } else { const P = H.root.position, d = V3(w[0] - P.x, 0, w[1] - P.z), L = d.length(); if (L < 4) S.pi++; else { const st = Math.min(L, 105 * dt); P.addScaledVector(d.normalize(), st); moveD = st; H.byaw = angDamp(H.byaw ?? 0, Math.atan2(d.x, d.z), 8, dt); } } }
  const sitting = S.wait > 0 ? (S.mode !== 'path' || SC.phase === 'out') : S.mode === 'seat' || S.mode === 'bench';
  if (S.mode === 'seat' && !(S.wait > 0 && SC.phase === 'in')) { H.root.position.set(seat.x - 6, GY, seat.z); H.byaw = -Math.PI / 2; H.seatY = 40; }
  if (S.mode === 'bench') { H.root.position.set(SC.herBench.x, GY, SC.herBench.z + 10); H.byaw = Math.PI; H.seatY = 47; }
  H.pose = sitting ? 'homework' : 'walk';
  kidBody(dt, moveD); H.root.position.y = GY;
  // head: down at her page, now and then out of the window (lessons) or up at the others playing (break)
  const up = S.lookOut || Math.sin(T * .23) > .55; H.head.rotation.x = damp(H.head.rotation.x, sitting ? (up ? .05 : .62) : .08, 3, dt); H.head.rotation.y = damp(H.head.rotation.y, sitting && up ? (S.mode === 'seat' ? .85 : .4) : 0, 3, dt);
  H.pitch = H.head.rotation.x; H.yaw = H.head.rotation.y;   // (what an online host sends for her head)
}

// ---------- the day goes on ----------
function scDayTick(dt) {
  SC.pt += dt;
  if (SC.phase === 'class' && SC.cycle > 0 && SC.pt > scClassLen()) scBell('out');
  else if (SC.phase === 'out' && SC.kids.every(k => k.mode !== 'path')) { SC.phase = 'recess'; SC.pt = 0; }
  else if (SC.phase === 'recess' && SC.pt > 80) { scBell('in'); }
  else if (SC.phase === 'in' && SC.kids.every(k => k.mode === 'seat') && (!SC.her || SC.her.mode === 'seat') && SC.tch.mode !== 'path') { SC.phase = 'class'; SC.pt = 0; SC.cycle++; }
  // doors: the main doors stand open from the bell out until the class is back in; 3A's back door only while they file through
  const inCorr = q => q.H.pos.z > 4980 && q.H.pos.z < 5290;
  const D = SC.doors; if (D.main) D.main.want = SC.phase !== 'class' ? 1 : 0;
  if (D.back) { const flow = (SC.phase === 'out' && SC.kids.some(k => k.mode === 'path' && k.H.pos.z > 5120)) || (SC.phase === 'in' && SC.kids.some(k => k.mode === 'path' && k.pi >= 2)); if (flow) SC.backHold = 16; else SC.backHold = Math.max(0, (SC.backHold || 0) - dt); D.back.want = SC.backHold > 0 ? 1 : 0; }
  scDoorsTick(dt);
}
// the doors swing towards where they're wanted (online, the host says where)
function scDoorsTick(dt) {
  const D = SC.doors;
  for (const k of ['main', 'back']) { const d = D[k]; if (!d) continue; const was = d.open; d.open = damp(d.open, d.want, 3, dt); if (Math.abs(d.open - d.want) < .01) d.open = d.want;
    if (k === 'main') { d.L.rotation.y = -d.open * 1.45; d.R.rotation.y = d.open * 1.45; } else d.g.rotation.y = -d.open * 1.5;
    const solid = d.open < .2; if (solid) { d.col.y0 = GY; d.col.y1 = GY + 238; } else { d.col.y0 = d.col.y1 = -999; }
    if ((was < .05 && d.open >= .05) || (was > .95 && d.open <= .95)) nz(.25, 600, 1.6, .05); }
}
function scNPC(dt) {
  if (!SC.kids.length) return;
  scDayTick(dt); for (const k of SC.kids) scKidTick(k, dt); scBallTick(dt); scTeacherTick(dt); scGuardTick(dt); scHerTick(dt);
  scDecoTick(dt);
}
// the flag, the fan, the clock
function scDecoTick(dt) {
  if (SC.flag) { const p = SC.flag.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) + 75; p.setZ(i, Math.sin(T * 3.4 + x * .08) * x * .05); } p.needsUpdate = true; }
  if (SC.fan) SC.fan.rotation.y += dt * 4.2;
  if (SC.clockM) { const a = T * .05; SC.clockM.rotation.x = a; SC.clockH.rotation.x = a / 12 + 1.2; }
}

// ---------- who can see you ----------
function scHidden(p) {
  if (p.y < GY - 5 && p.z > SC_DRAIN.z0 - 1 && p.z < SC_DRAIN.z1 + 1) return 0;                                  // down in the drain
  for (const L of SC.lockers) if (p.y < GY + 11 && p.x > L.x0 + 2 && p.x < L.x1 - 2 && p.z > L.z0 && p.z < L.z1 + 2) return .08;   // under the lockers
  for (const B of SC.bush) if (p.y > B.y - 4 && p.x > B.x0 && p.x < B.x1 && p.z > B.z0 && p.z < B.z1) return .2;        // in the planter's shrubs
  if (p.y < GY + 50 && p.x > 1700 && p.x < 2500 && p.z > 5196) for (const s of SC.seats) if (Math.abs(p.x - (s.x - 40)) < 22 && Math.abs(p.z - s.z) < 30) return .45;   // under a desk
  if (inGrass(p)) return .3;
  return 1;
}
function detectSchool(dt) {
  if (STATE !== 'play') return; if (window.__NODET) { meter = 0; return; } if (TOY.grace > 0) { meter = Math.max(0, meter - dt * .5); return; }
  const L = leader; if (L.frozen || !mine(L)) { meter = Math.max(0, meter - dt * .5); KS.watch = null; return; }
  const hid = scHidden(L.pos); if (hid <= 0) { meter = Math.max(0, meter - dt * .5); KS.watch = null; return; }
  let seen = 0, who = null, wp = null; const hp = V3(), q = new THREE.Quaternion(), f = V3();
  const look = (head, fov, range, k, id) => { head.getWorldPosition(hp); head.getWorldQuaternion(q); f.set(0, 0, 1).applyQuaternion(q); const s = seeFrom(hp, f, fov, range) * k; if (s > seen) { seen = s; who = id; wp = hp.clone(); } };
  SC.kids.forEach((k, i) => { if (!k.H.root.visible) return; const sat = k.mode === 'seat' && !(k.glance > 0); look(k.H.head, k.mode === 'alert' ? .5 : sat ? .82 : .62, k.mode === 'alert' ? 320 : sat ? 160 : 260, k.mode === 'tag' ? .8 : 1, 'skid' + i); });
  const S = SC.tch; if (S && S.mode !== 'write') look(S.H.head, S.mode === 'alert' ? .5 : .6, S.mode === 'alert' ? 460 : 380, 1, 'tch');
  const G = SC.grd; if (G && G.mode !== 'news') look(G.H.head, G.mode === 'alert' ? .5 : .62, 420, 1, 'grd');
  if (KID.root && KID.root.visible && KID.head) { const up = Math.abs(KID.head.rotation.x) < .3; if (up) look(KID.head, .7, 220, .9, 'her'); }
  KS.watch = seen > 0 ? { p: wp, s: seen, who } : null;
  if (seen > 0) {
    const p = V3(L.pos.x, L.pos.y + L.h * .5, L.pos.z); const indoor = p.z > 5000, under = p.z > 4876 && p.z < 5000;
    const lit = (indoor ? .85 : under ? .75 : 1) * (moonShadeSC(p) ? .7 : 1);
    const mv = L.spd > 1.5 ? 1 : .5, cr = L.crouch ? .55 : 1;
    meter += seen * lit * mv * cr * hid * hideK(L) * dt * 1.1;
  } else meter -= dt * .24;
  meter = clamp(meter, 0, 1); if (meter > .3 && who) netSeen(V3(L.pos.x, L.pos.y + 2, L.pos.z), who);   // (they turn and look: "咦？嗰度有嘢郁……")
  if (meter >= 1) toyFreeze(who);
}
function moonShadeSC(p) { for (const s of SC.shade) if (Math.hypot(p.x - s.x, p.z - s.z) < s.r) return true; return false; }
function scHear(p, loud) {
  if (loud < .25) return;
  for (const k of SC.kids) if (Math.hypot(p.x - k.H.pos.x, p.z - k.H.pos.z) < 260 && k.mode !== 'path') { if (k.mode !== 'alert') k.prev = k.mode; k.mode = 'alert'; k.t = 2.2; k.look.set(p.x, GY + 4, p.z); }
  const S = SC.tch; if (S && Math.hypot(p.x - S.H.pos.x, p.z - S.H.pos.z) < 420 && S.mode !== 'path') { if (S.mode !== 'alert') S.prev = S.mode === 'write' ? 'face' : S.mode; S.mode = 'alert'; S.t = 2.6; S.look.set(p.x, GY + 4, p.z); }
  const G = SC.grd; if (G && Math.hypot(p.x - G.H.pos.x, p.z - G.H.pos.z) < 360) { G.mode = 'alert'; G.t = 3; G.look.set(p.x, GY + 4, p.z); }
}
function scSeen(tp, who) {
  if (!who) return;
  if (who.startsWith('skid')) { const k = SC.kids[+who.slice(4)]; if (k && k.mode !== 'path') { if (k.mode !== 'alert') k.prev = k.mode; k.mode = 'alert'; k.t = 2.6; k.look.copy(tp); if (T - k.said > 8) { k.said = T; sayW(k.name, rnd() < .5 ? '咦？嗰度有嘢郁……' : '你睇！係咪有隻老鼠？', k.col, 2.4); } } }
  else if (who === 'tch') { const S = SC.tch; if (S.mode !== 'path') { if (S.mode !== 'alert') S.prev = S.mode === 'write' ? 'face' : S.mode; S.mode = 'alert'; S.t = 3; S.look.copy(tp); if (!SC.said.tl || T - SC.said.tl > 12) { SC.said.tl = T; sayW(S.name, '……嗯？', S.col, 1.8); } } }
  else if (who === 'grd') { const G = SC.grd; G.mode = 'alert'; G.t = 3.4; G.look.copy(tp); if (!SC.said.gl || T - SC.said.gl > 12) { SC.said.gl = T; sayW(G.name, '……乜嘢嚟㗎？', G.col, 2); } }
}
