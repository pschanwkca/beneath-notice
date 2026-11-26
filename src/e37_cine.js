// =====================================================================
//  FILMS — short movie-style scenes played in the game's own world (letterbox, subtitles, skip)
//  A film is { len, shots: [{ t0, fov, set(), run(u, dt) → [camera, look at, focus] }], ev: [[t, fn]],
//  begin(), end(skipped), black(t)?, white(t)?, audio(t)?, mus? }. filmPlay(F) runs it; the game stands
//  still meanwhile (STATE 'cine'); when it ends the film puts its things back and play carries on
//  (or, for the cold open, the prologue loads). The button, Space, Enter or Esc skips.
//
//  COLD OPEN — the first film, before the prologue (about a minute)
//  · upstairs it's dinner: the daughter calls Dad, the soup is on the table, his chair stays empty
//  · in the basement Dad says "just a minute" and runs the shrinking machine one last time
//  · the kitchen light flickers, the music box winds down — the flash, the bang — an empty bench
//    with his glasses on it, a tiny voice from inside the machine… the title, and the prologue begins
//  Everything here only moves things for the camera and puts them back at the end.
// =====================================================================
const CINE = { on: false, F: null, prev: 'play', t: 0, last: 0, ev: 0, shot: -1, mus: 1, manual: false, skipReq: false, sub: 0, subT: 0, hud: false,
  dad: null, props: null, specs: null, saved: null, au: null, kh: { y: 0, p: .3 }, shake: 0, white: 0, fov: 52, ap: 0, hw: null, tick: -1 };

// ---------- the player ----------
function filmPlay(F) {
  if (CINE.on || !WORLD) return false;
  CINE.F = F; CINE.prev = STATE; STATE = 'cine';
  Object.assign(CINE, { on: true, t: 0, last: 0, ev: 0, shot: -1, mus: F.mus ?? 1, skipReq: false, subT: 0, shake: 0, tick: -1 });
  CINE.fov = camera.fov; CINE.ap = bokeh.uniforms.aperture.value; bokeh.uniforms.aperture.value = Math.min(CINE.ap * .22, .000035);   // (people-sized distances: a much smaller lens opening)
  CINE.hud = $('hud').classList.contains('off'); $('hud').classList.add('off'); if (TOUCH) $('touch').hidden = true;
  const ov = $('cine'); ov.hidden = false; ov.classList.add('out'); void ov.offsetWidth; ov.classList.remove('out'); $('cineFade').style.transition = ''; $('cineFade').style.opacity = F.black ? F.black(0) : 1;
  $('cineFlash').style.opacity = 0; $('cineTitle').classList.remove('on'); $('cineSub').classList.remove('on'); $('cineSkip').classList.remove('on');
  setTimeout(() => { if (CINE.on && CINE.F === F) $('cineSkip').classList.add('on'); }, 1200);
  if (F.begin) F.begin();
  return true;
}
function filmEnd(skipped) {
  if (!CINE.on) return; const F = CINE.F; CINE.on = false;
  camera.fov = CINE.fov; onResize(); bokeh.uniforms.aperture.value = CINE.ap; LP.snap = true; CINE.mus = 1; CINE.shake = 0;
  $('cineSkip').classList.remove('on'); $('cineSub').classList.remove('on'); $('cineTitle').classList.remove('on'); $('cineFlash').style.opacity = 0;
  if (F.end) F.end(skipped);   // the film puts its things back (and may load what comes next)
  if (STATE !== 'cine') return;
  // back to the game: the bars slide away and the black lifts off the game's own camera
  STATE = CINE.prev && CINE.prev !== 'cine' ? CINE.prev : 'play'; if (!CINE.hud) $('hud').classList.remove('off'); if (TOUCH && STATE === 'play') $('touch').hidden = false;
  const ov = $('cine'), fd = $('cineFade'); fd.style.transition = 'opacity .7s ease'; fd.style.opacity = 0; ov.classList.add('out');
  setTimeout(() => { if (CINE.on) return; ov.hidden = true; ov.classList.remove('out'); fd.style.transition = ''; }, 900);
}
const CINE_LEN = 60;
const CBP = (x, y, z) => V3(x, y, z).add(BO);   // basement coordinates → world

// ---------- the film, shot by shot: [start, setup on the cut, per frame (u = seconds into the shot) → camera] ----------
const CINE_SHOTS = [
  // K1 · dinner. Across the table: the daughter waiting beside an empty chair, Mom at the stove behind
  { t0: 0, fov: 36, set() { cineMomAt('stove'); CINE.kh.y = .1; CINE.kh.p = .35; },
    run(u, dt) { const k = sstep(0, 9, u); const call = u > 2.4 && u < 6.2;
      cineKitchen(dt, { ky: call ? .95 : .1, kp: call ? -.16 : .4, kk: call ? 5 : 2.2, cy: call ? .2 : 0, cx: call ? .04 : .16 });
      return [V3(-288, 126, 208).lerp(V3(-276, 119, 200), k), V3(-40, 84, 28).lerp(V3(-46, 86, 36), k), V3(-90, 104, 157)]; } },
  // K2 · his place at the table: rice getting cold, the chair pushed in
  { t0: 9, fov: 30, set() { cineMomAt('stove'); },
    run(u, dt) { const k = sstep(0, 4.5, u); cineKitchen(dt, { ky: .5, kp: .45, kk: 1.5, cy: 0, cx: .16 }); cineSteam(V3(-170, 82, 116), .9);
      return [V3(-206, 92, 84).lerp(V3(-202, 90, 92), k), V3(-166, 80, 124).lerp(V3(-164, 84, 132), k), V3(-170, 82, 118)]; } },
  // B1 · the basement. Low, behind him: Dad at the bench, the machine glowing past his shoulder
  { t0: 13.5, fov: 38, set() { cineDadShow(true); },
    run(u, dt) { const k = sstep(0, 8, u); const look = u > 1.0 && u < 3.6;
      cineDad(dt, look ? 'glance' : 'work', u); cineMachine(1 + Math.sin(T * 11) * .08);
      return [CBP(78, 104, -36).lerp(CBP(62, 106, -58), k), CBP(-52, 114, -198), CBP(-55, 130, -160)]; } },
  // K3 · over Mom's shoulder: "eat first, the soup's getting cold" — the daughter looks down
  { t0: 21.5, fov: 34, set() { cineMomAt('table'); CINE.kh.y = .9; CINE.kh.p = -.05; },
    run(u, dt) { const k = sstep(0, 9, u); const down = u > 4.2;
      cineKitchen(dt, { ky: down ? .06 : .5, kp: down ? .62 : .1, kk: down ? 1.4 : 2, cy: 0, cx: down ? .3 : .12, mom: 'still' }); cineSteam(V3(-130, 84, 85), .7);
      return [V3(-28, 118, -44).lerp(V3(-36, 114, -30), k), V3(-112, 94, 150).lerp(V3(-106, 96, 152), k), V3(-90, 102, 157)]; } },
  // B2 · his hands at the machine; then the button
  { t0: 30.5, fov: 36, set() { cineDadShow(true); },
    run(u, dt) { const k = sstep(0, 8, u); const press = u > 5.9;
      cineDad(dt, press ? 'press' : 'work', u - 5.9); cineMachine(1 + Math.sin(T * 13) * .1 + (press ? sstep(5.9, 8, u) * 1.6 : 0));
      if (rnd() < dt * (press ? 9 : 2.2)) cineSpark(press ? 1.4 : .7);
      return [CBP(-2, 170, -122).lerp(CBP(-10, 165, -132), k), CBP(-56, 106, -204).lerp(CBP(-56, 108, -208), k), CBP(-55, 106, -196)]; } },
  // K4 · upstairs the light flickers, the music box winds down: "…Dad?"
  { t0: 38.5, fov: 38, set() { cineMomAt('table'); CINE.kh.y = .06; CINE.kh.p = .6; },
    run(u, dt) { const k = sstep(0, 5, u); const up = u > .9 && u < 2.7, floor = u >= 2.7;
      cineKitchen(dt, { ky: floor ? -.3 : .05, kp: up ? -.55 : floor ? .28 : .5, kk: 3, cy: 0, cx: up ? -.06 : .18, mom: 'still', momLook: up ? V3(-130, 196, 85) : V3(-90, 100, 152) });
      cineFlicker(u > .8 && u < 3.4 ? (Math.sin(u * 47) > .3 ? .2 : 1) * (Math.sin(u * 13.7) > -.6 ? 1 : .05) : 1);
      return [V3(-188, 106, 28).lerp(V3(-182, 104, 40), k), V3(-110, 100, 152), V3(-90, 102, 157)]; } },
  // B3 · the machine overloads; he backs off, an arm up against the light
  { t0: 43.5, fov: 38, set() { cineFlicker(1); cineDadShow(true); },
    run(u, dt) { const k = sstep(0, 2.1, u); cineDad(dt, 'shield', u); cineMachine(3 + k * 12 + (rnd() < .35 ? R(-2, 3) : 0));
      if (rnd() < dt * 26) cineSpark(2.2); CINE.shake = .25 + k * 1.4;
      return [CBP(70, 162, -36).lerp(CBP(58, 150, -54), k), CBP(-50, 108, -196), CBP(-52, 112, -200)]; } },
  // B4 · after the flash: the bench is empty — his glasses, smoke, the ring still humming… a tiny voice inside
  { t0: 47, fov: 34, set() { cineDadShow(false); CINE.props.glasses.visible = true; CINE.shake = 0; },
    run(u, dt) { const k = sstep(0, 6.4, u), k2 = sstep(3.6, 6.4, u); cineMachine(.55 + Math.sin(T * 5) * .12 + k2 * 1.8);
      if (rnd() < dt * 7) emit(CBP(-55 + R(-14, 14), 96, -212 + R(-6, 8)), V3(R(-3, 3), R(6, 13), R(-2, 4)), new THREE.Color(.07, .075, .08), R(4, 7), R(2.2, 3.4), -1.5, .3);
      const p = CBP(-12, 101, -150).lerp(CBP(-46, 110, -186), sstep(1.6, 6.5, u)), l = CBP(-30, 93, -177).lerp(CBP(-55, 113, -212), sstep(1.2, 5.4, u));
      return [p, l, l]; } },
];
// what happens when (subtitles, sounds, cuts)
const CINE_EV = [
  [2.8, () => cineSay('女兒', '爸爸——吃飯了！', '#e8a0c0', 2.9)],
  [14.9, () => cineSay('爸爸', '等一下！快好了！', '#f5f0e6', 2.8)],
  [22.3, () => cineBox()],
  [23.5, () => cineSay('太太', '……先吃吧，湯要涼了。', '#f4bb72', 3.3)],
  [27.6, () => cineSay('女兒', '……嗯。', '#e8a0c0', 2.1)],
  [31.7, () => cineSay('爸爸', '最後一次……試完就上去。', '#f5f0e6', 3.5)],
  [36.4, () => cineSfx('press')],
  [41.6, () => cineSay('女兒', '……爸爸？', '#e8a0c0', 2.4)],
  [45.6, () => cineSfx('boom')],
  [50.9, () => cineSay(LANG_EN ? '???' : '？？？', '……咦？', '#82ece6', 2.2)],
  [53.6, () => { $('cineTitle').classList.add('on'); CINE.mus = 1; }],
  [58.4, () => $('cineTitle').classList.remove('on')],
];

// ---------- start / stop ----------
const FILM_OPEN = { id: 'open', title: true, len: CINE_LEN, mus: 0, shots: CINE_SHOTS, ev: CINE_EV,
  begin: openBegin, end: openEnd, audio: cineAudioTick,
  black: t => t < 1.8 ? 1 - sstep(.2, 1.8, t) : t > 52.4 ? sstep(52.4, 53.5, t) : 0,
  white: t => t < 45.6 ? 0 : t < 45.7 ? sstep(45.6, 45.7, t) : t < 47.2 ? 1 : 1 - sstep(47.2, 49.8, t) };
function cineStart() {
  if (CINE.on || !WORLD) { startGame(0); return; }
  titleEnd(); $('start').hidden = true; filmPlay(FILM_OPEN);
}
function openBegin() {
  // put away what the title screen shows: the tiny crew isn't tiny yet
  CINE.saved = { vis: {}, kid: KID.root.visible, mom: mom.root.visible, phone: mom.phone.visible, km: [KM.mode, KM.pt], kidP: KID.root.position.clone(), kidY: KID.root.rotation.y, kpose: KID.pose, kseat: KID.seatY, cat: CAT.root ? CAT.root.visible : false };
  for (const id in chars) { CINE.saved.vis[id] = chars[id].root.visible; chars[id].root.visible = false; }
  if (!CINE.dad) cineBuildDad(); if (!CINE.props) cineBuildProps();
  CINE.props.g.visible = true; CINE.props.glasses.visible = true; CINE.dad.root.visible = true;
  if (CINE.hw) CINE.hw.visible = false;   // the homework sheet, the cookie plate, the milk and the pencil case make way for the dinner
  CINE.tbl = resizables.filter(r => r.cx > -230 && r.cx < -30 && r.cz > 30 && r.cz < 140 && r.y0 > 60 && r.mesh.visible); for (const r of CINE.tbl) r.mesh.visible = false;
  if (!mom.spoon) { mom.spoon = new THREE.Mesh(new THREE.CylinderGeometry(.5, .7, 26, 8), kitchenMats().wood); mom.spoon.position.set(0, -27, 8); mom.spoon.rotation.x = 1.2; mom.arms[1].el.add(mom.spoon); }
  mom.root.visible = true; mom.phone.visible = false; KID.root.visible = true; if (CAT.root) CAT.root.visible = false;
  CINE.specs = HX.pend.map(P => [P.l.intensity, P.bulb ? P.bulb.emissiveIntensity : 0]);
  cineAudioStart(); renderer.compile(scene, camera); CINE.props.glasses.visible = false; CINE.dad.root.visible = false;
}
// skipped, or the film ran out: everything back as it was, then the prologue loads behind the black
function openEnd(skipped) {
  const S = CINE.saved;
  for (const id in S.vis) if (chars[id]) chars[id].root.visible = S.vis[id];
  KID.root.visible = S.kid; KID.root.position.copy(S.kidP); KID.root.rotation.y = S.kidY; KID.pose = S.kpose; KID.seatY = S.kseat; if (KID.pen) KID.pen.visible = true;
  mom.root.visible = S.mom; mom.phone.visible = S.phone; if (mom.spoon) mom.spoon.visible = false; KM.mode = S.km[0]; KM.pt = S.km[1]; mom.sitK = 0; if (CAT.root) CAT.root.visible = S.cat;
  CINE.props.g.visible = false; CINE.props.glasses.visible = false; CINE.dad.root.visible = false; if (CINE.hw) CINE.hw.visible = true; for (const r of CINE.tbl || []) r.mesh.visible = true;
  cineFlicker(1); HX.pend.forEach((P, i) => { P.l.intensity = CINE.specs[i][0]; if (P.bulb) P.bulb.emissiveIntensity = CINE.specs[i][1]; });
  cineAudioStop(); $('cineFade').style.opacity = 1;
  // the prologue's chapter card fades in over the black, then the film's black goes away underneath it
  const ov = $('cine'); startGame(0); setTimeout(() => { ov.hidden = true; }, 1100);
  // the film ended on its own (no click to grab the mouse with): once the prologue is up, say how to take over
  let n = 0; const iv = setInterval(() => { if (++n > 40 || locked || dragMode || TOUCH) { clearInterval(iv); return; } if (STATE === 'play') { clearInterval(iv); toast('點一下畫面，開始行動', 4); } }, 300);
}

// ---------- per frame ----------
function cineTick(dt) {
  if (!CINE.on) return; const F = CINE.F;
  const now = performance.now(), d = CINE.last ? (now - CINE.last) / 1000 : dt; CINE.last = now;
  if (!CINE.manual) CINE.t += clamp(d, 0, .1);   // real time, so music stays with the pictures on a slow machine
  const t = CINE.t;
  if (t > .5 && (pressed.Space || pressed.Enter || pressed.Escape || CINE.skipReq)) { filmEnd(true); return; }
  // which shot
  let si = 0; for (let i = 0; i < F.shots.length; i++) if (t >= F.shots[i].t0) si = i;
  if (si !== CINE.shot) { CINE.shot = si; const S = F.shots[si]; S.set(); camera.fov = S.fov; onResize(); LP.snap = true; }
  while (CINE.ev < F.ev.length && F.ev[CINE.ev][0] <= t) { F.ev[CINE.ev++][1](); if (!CINE.on) return; }
  const S = F.shots[CINE.shot], u = t - S.t0;
  const [p, look, fp] = S.run(u, dt);
  // camera, with a little hand-held breathing (and a shake when asked)
  const br = V3(Math.sin(t * .71) * .35 + Math.sin(t * 1.9) * .12, Math.sin(t * .53 + 1) * .25, Math.sin(t * .87 + 2) * .3).multiplyScalar(F.breath ?? 1);
  const sh = CINE.shake; if (sh > 0) br.add(V3(R(-1, 1), R(-1, 1), R(-1, 1)).multiplyScalar(sh));
  camera.position.copy(p).add(br); camera.lookAt(look); bokeh.uniforms.focus.value = camera.position.distanceTo(fp || look);
  // black at the start and the end (unless the film says otherwise), white for a flash
  const black = F.black ? F.black(t) : t < .8 ? 1 - sstep(0, .8, t) : t > F.len - .8 ? sstep(F.len - .8, F.len, t) : 0;
  const white = F.white ? F.white(t) : 0;
  $('cineFade').style.opacity = black.toFixed(3); $('cineFlash').style.opacity = white.toFixed(3);
  if (CINE.subT > 0) { CINE.subT -= dt; if (CINE.subT <= 0) $('cineSub').classList.remove('on'); }
  if (F.audio) F.audio(t);
  if (t >= F.len) filmEnd(false);
}

// ---------- the people ----------
function cineMomAt(where) {
  KM.mode = 'act'; KM.pt = where;
  if (where === 'stove') { mom.pos.set(34, 0, -128); mom.yaw = Math.PI; mom.aimT.set(22, 96, -178); mom.sitK = 0; }
  else { mom.pos.set(-90, 0, 12); mom.yaw = 0; mom.aimT.set(-90, 78, 54); mom.sitK = 1; mom.sitY = 53; }
  mom.aim.copy(mom.aimT);
}
// the kitchen: the daughter at her seat (head and chest as the shot asks), Mom at the stove or the table
function cineKitchen(dt, o) {
  const H = KID; H.root.visible = true; H.root.position.set(-90, 0, 157); H.byaw = Math.PI; H.pose = 'homework'; H.seatY = 50; H.sitK = 1;
  kidBody(dt, 0); if (H.pen) H.pen.visible = false;
  const kk = o.kk || 3; CINE.kh.y = damp(CINE.kh.y, o.ky, kk, dt); CINE.kh.p = damp(CINE.kh.p, o.kp, kk, dt);
  H.head.rotation.set(CINE.kh.p, CINE.kh.y, 0); H.chest.rotation.x = damp(H.chest.rotation.x, o.cx, 3, dt); H.chest.rotation.y = damp(H.chest.rotation.y, o.cy, 3, dt);
  // hands resting on the table
  const A0 = H.arms[0], A1 = H.arms[1], s = Math.sin(T * .9) * .02;
  A0.sh.rotation.set(-.78 + s, -.32, 0); A0.el.rotation.x = -1.02; A1.sh.rotation.set(-.8 - s, .32, 0); A1.el.rotation.x = -1.0; A0.grip = A1.grip = .45;
  if (o.momLook) mom.aimT.copy(o.momLook); else if (KM.pt === 'table') mom.aimT.set(-90, 78, 54);
  momAnimK(dt, 0);
  if (o.mom === 'still' && KM.pt === 'table') { const B0 = mom.arms[0], B1 = mom.arms[1]; B1.sh.rotation.set(-.5, .2, 0); B1.el.rotation.x = -.7; B0.sh.rotation.set(-.48, -.2, 0); B0.el.rotation.x = -.72; mom.spoon.visible = false; }
}
function cineSteam(p, k) { if (rnd() < k * .5) emit(p.clone().add(V3(R(-3, 3), R(0, 2), R(-3, 3))), V3(R(-1.5, 1.5), R(5, 9), R(-1.5, 1.5)), new THREE.Color(.085, .085, .088), R(2.6, 4.2), R(1.6, 2.4), -2, .6); }
function cineFlicker(f) { HX.pend.forEach((P, i) => { const S = CINE.specs && CINE.specs[i]; if (!S) return; P.l.intensity = S[0] * f; if (P.bulb) P.bulb.emissiveIntensity = S[1] * (.15 + .85 * f); }); }

// Dad, full size, at the bench in a lab coat
function cineBuildDad() {
  const coat = new THREE.MeshStandardMaterial({ color: 0xeae7e0, roughness: .86 });
  const H = buildHuman({ top: coat, pants: new THREE.MeshStandardMaterial({ color: 0x30343c, roughness: .85 }), skin: MAT.skin, shoe: new THREE.MeshStandardMaterial({ color: 0x4a3022, roughness: .6 }), hair: 0x3a2a20, glasses: true });
  // the coat's skirt, open at the front, hanging from the waist to mid-thigh
  const sk = new THREE.Mesh(new THREE.CylinderGeometry(15.2, 21.5, 46, 40, 4, true, .36, Math.PI * 2 - .72), new THREE.MeshStandardMaterial({ color: 0xeae7e0, roughness: .86, side: THREE.DoubleSide }));
  sk.position.set(0, -15, -.6); sk.scale.z = .64; sk.castShadow = true; H.pelvis.add(sk);
  H.root.visible = false; CINE.dad = H;
}
function cineDadShow(on) { CINE.dad.root.visible = on; }
function cineDad(dt, mode, u) {
  const H = CINE.dad, P = CINE.dp || (CINE.dp = { hy: 0, hx: .38, cx: .3, a0: [-.86, .2, -.36], a1: [-.84, -.2, -.4], z: -152 });
  // the pose is kept here and eased toward each moment's target (the walk cycle resets the joints every frame)
  let hy = 0, hx = .38, cx = .3, a0, a1, z = -152, k = 4;
  const w = T * 3.1;
  if (mode === 'shield') { cx = -.14; hy = .6; hx = .12; a0 = [-2.05, .5, -1.5]; a1 = [-.35, -.25, -.45]; z = -140; k = 7; }
  else if (mode === 'press') { const r = sstep(0, .5, u), push = Math.max(0, Math.sin(clamp((u - .45) / .4, 0, 1) * Math.PI)) * .1; a0 = [lerp(-.86, -1.12 - push, r), lerp(.2, .06, r), lerp(-.36, -.12, r)]; a1 = [-.6, -.18, -.5]; k = 9; }
  else { a0 = [-.86 + Math.sin(w) * .05, .2, -.36 + Math.sin(w * 1.4) * .09]; a1 = [-.84 + Math.sin(w + 2) * .05, -.2, -.4 + Math.sin(w * 1.2 + 1) * .08]; if (mode === 'glance') { hy = -1.05; hx = .04; } k = mode === 'glance' ? 5 : 9; }
  const e = 1 - Math.exp(-k * dt);
  P.hy += (hy - P.hy) * Math.min(1, e * .8); P.hx += (hx - P.hx) * Math.min(1, e * .8); P.cx += (cx - P.cx) * e; P.z += (z - P.z) * Math.min(1, dt * 2.2);
  for (let i = 0; i < 3; i++) { P.a0[i] += (a0[i] - P.a0[i]) * e; P.a1[i] += (a1[i] - P.a1[i]) * e; }
  H.pos.copy(CBP(-55, 0, P.z)); H.yaw = Math.PI; humanAnim(H, 0, dt);
  H.chest.rotation.x = P.cx; H.head.rotation.set(P.hx, P.hy, 0);
  const A0 = H.arms[0], A1 = H.arms[1];
  A0.sh.rotation.set(P.a0[0], P.a0[1], 0); A0.el.rotation.x = P.a0[2]; A1.sh.rotation.set(P.a1[0], P.a1[1], 0); A1.el.rotation.x = P.a1[2]; A0.grip = A1.grip = .7;
}
function cineMachine(k) {
  machine.light.intensity = 900 * k; machine.field.material.uniforms.uK.value = .85 + (k - 1) * .35; machine.field.material.uniforms.uT.value = T;
}
function cineSpark(k) {
  const a = R(0, 6.28), p = V3(machine.x + Math.cos(a) * 17, machine.y + Math.sin(a) * 17, machine.z + 1);
  for (let i = 0; i < 10; i++) emit(p, V3(R(-30, 30), R(5, 45), R(-10, 30)).multiplyScalar(k), rnd() < .5 ? new THREE.Color(3, 1.6, .5) : new THREE.Color(.8, 3, 2.8), R(.5, 1.1), R(.3, .8), 260, .5);
  nz(.06, 2600 + R(-600, 600), 3, .06 * k);
}

// ---------- the props: dinner for four (one place never used), and his glasses on the bench ----------
function cineBuildProps() {
  const g = new THREE.Group(); scene.add(g); g.visible = false;
  const cer = new THREE.MeshPhysicalMaterial({ color: 0xf2eee6, roughness: .3, clearcoat: .6, clearcoatRoughness: .25 });
  const band = new THREE.MeshStandardMaterial({ color: 0x2f4f80, roughness: .4 });
  const rice = new THREE.MeshStandardMaterial({ color: 0xf5f1e8, roughness: .85 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a2c1c, roughness: .5 });
  const soup = new THREE.MeshPhysicalMaterial({ color: 0xb8742e, roughness: .1, clearcoat: 1 });
  const leaf = new THREE.MeshStandardMaterial({ color: 0x4c8a36, roughness: .5 }), stem = new THREE.MeshStandardMaterial({ color: 0xc9dba0, roughness: .5 });
  const V2 = (x, y) => new THREE.Vector2(x, y);
  const put = (geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  // a rice bowl: foot, belly, lip, then the inside back down
  const bowl = new THREE.LatheGeometry([V2(0, .2), V2(2.6, 0), V2(2.9, .7), V2(3.3, 1.1), V2(4.6, 2.4), V2(5.5, 4.2), V2(5.9, 5.7), V2(5.5, 5.8), V2(5.1, 4.3), V2(4.1, 2.8), V2(0, 1.6)], 40);
  const bandG = new THREE.CylinderGeometry(5.95, 5.62, .5, 40, 1, true);
  const riceG = new THREE.SphereGeometry(5.1, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2); riceG.scale(1, .42, 1);
  const stickG = new THREE.CylinderGeometry(.16, .3, 23, 8); stickG.rotateX(Math.PI / 2);
  const place = (x, z, ry, sticks = true) => {
    put(bowl, cer, x, 76, z); put(bandG, band, x, 76 + 5.2, z); put(riceG, rice, x, 76 + 4.4, z);
    if (sticks) for (const s of [-.55, .55]) put(stickG, wood, x + 9 + s, 76.32, z + 1.5, ry);
  };
  place(-170, 118, .06); place(-90, 120, -.04); place(-90, 52, Math.PI + .05);
  // the soup pot in the middle, a plate of greens, a steamed fish
  const pot = new THREE.LatheGeometry([V2(0, .3), V2(8, 0), V2(9, .8), V2(11.2, 4), V2(11.6, 8.6), V2(12.2, 9.1), V2(11.9, 9.5), V2(10.9, 9.0), V2(10.6, 4.4), V2(8.4, 1.4), V2(0, 1.2)], 48);
  put(pot, cer, -130, 76, 85); const sf = put(new THREE.CircleGeometry(10.75, 40), soup, -130, 76 + 7.4, 85); sf.rotation.x = -Math.PI / 2;
  for (const s of [-1, 1]) { const h = put(new THREE.TorusGeometry(2.2, .55, 8, 16, Math.PI), cer, -130 + s * 12, 76 + 7.6, 85); h.rotation.set(0, s > 0 ? 0 : Math.PI, Math.PI / 2); h.rotation.order = 'YZX'; }
  const plate = new THREE.CylinderGeometry(11.5, 8.5, 1.3, 44); const pl1 = put(plate, cer, -162, 76.65, 70); const pl2 = put(plate, cer, -100, 76.65, 84); pl1.scale.set(1, 1, 1); pl2.scale.set(1.15, 1, .8);
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28 + R(-.2, .2), r = R(2, 6.5); const l = put(new THREE.SphereGeometry(3.2, 12, 8), leaf, -162 + Math.cos(a) * r, 78.1, 70 + Math.sin(a) * r, a); l.scale.set(1.25, .22, .62); const st = put(new THREE.SphereGeometry(1.4, 10, 6), stem, -162 + Math.cos(a) * (r - 2.4), 78.4, 70 + Math.sin(a) * (r - 2.4), a); st.scale.set(1.6, .45, .7); }
  const egg = new THREE.MeshStandardMaterial({ color: 0xf2c94a, roughness: .55 }), tom = new THREE.MeshPhysicalMaterial({ color: 0xc8361e, roughness: .25, clearcoat: .8 });
  for (let i = 0; i < 18; i++) { const a = R(0, 6.28), r = R(0, 7.5) * Math.sqrt(rnd()), red = i % 3 !== 0; const m = put(new THREE.IcosahedronGeometry(red ? 2.1 : 2.5, 1), red ? tom : egg, -100 + Math.cos(a) * r * 1.15, 77.9 + (7.5 - r) * .3, 84 + Math.sin(a) * r * .8, a); m.scale.set(R(.8, 1.3), red ? R(.55, .8) : R(.6, .9), R(.7, 1.1)); m.rotation.x = R(-.5, .5); }
  // his glasses, left behind on the bench (basement coordinates)
  const gl = new THREE.Group(); gl.visible = false; scene.add(gl);
  const fr = new THREE.MeshStandardMaterial({ color: 0x24201c, roughness: .35, metalness: .5 }), lens = new THREE.MeshPhysicalMaterial({ color: 0xe8f2f4, roughness: .05, transparent: true, opacity: .22, clearcoat: 1 });
  for (const s of [-1, 1]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.4, .24, 10, 36), fr); rim.position.set(s * 3.25, 0, 0); rim.scale.y = .82; gl.add(rim);
    const ln = new THREE.Mesh(new THREE.CircleGeometry(2.3, 28), lens); ln.position.copy(rim.position); ln.scale.y = .82; gl.add(ln);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 11.5, 6), fr); arm.rotation.z = Math.PI / 2 + s * .05; arm.position.set(s * .9, .7 - (s + 1) * .35, -1.1 - (s + 1) * .3); gl.add(arm);
  }
  const br = new THREE.Mesh(new THREE.TorusGeometry(.9, .2, 6, 12, Math.PI), fr); br.position.set(0, .9, 0); gl.add(br);
  gl.traverse(o => { if (o.isMesh) o.castShadow = true; });
  gl.position.copy(CBP(-28, 92 + 1.7, -177)); gl.rotation.order = 'YXZ'; gl.rotation.set(-Math.PI / 2 + .22, .55, 0);
  CINE.props = { g, glasses: gl };
  // the homework sheet on the table (hidden while the dinner is out)
  const Z = ZONES.kitchen; if (Z && Z.lv) Z.lv.traverse(o => { if (!CINE.hw && o.isMesh && o.material === kitchenMats().homework) CINE.hw = o; });
}

// ---------- sound ----------
function cineAudioStart() {
  const C = AU.ctx; CINE.au = null; if (!C) return;
  const o = C.createOscillator(), o2 = C.createOscillator(), lp = C.createBiquadFilter(), g = C.createGain();
  o.type = 'sawtooth'; o.frequency.value = 55; o2.type = 'sine'; o2.frequency.value = 110.7; lp.type = 'lowpass'; lp.frequency.value = 300; lp.Q.value = 3; g.gain.value = 0;
  o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(AU.out); o.start(); o2.start();
  // the music box: its own little room (a short echo)
  const box = C.createGain(); box.gain.value = .95 * clamp((SET.mus ?? .6) / .6, 0, 1.6); const dl = C.createDelay(1), fb = C.createGain(), wet = C.createGain(), lpf = C.createBiquadFilter();
  dl.delayTime.value = .29; fb.gain.value = .32; wet.gain.value = .4; lpf.type = 'lowpass'; lpf.frequency.value = 2400;
  box.connect(AU.out); box.connect(dl); dl.connect(lpf); lpf.connect(fb); fb.connect(dl); lpf.connect(wet); wet.connect(AU.out);
  CINE.au = { o, o2, lp, g, box, wet, dl, fb };
}
function cineAudioStop() {
  const A = CINE.au; if (!A) return; const C = AU.ctx, n = C.currentTime; CINE.au = null;
  for (const x of [A.g, A.box, A.wet]) { x.gain.cancelScheduledValues(n); x.gain.setTargetAtTime(0, n, .12); }
  setTimeout(() => { try { A.o.stop(); A.o2.stop(); A.g.disconnect(); A.box.disconnect(); A.wet.disconnect(); A.fb.disconnect(); } catch (e) { } }, 1500);
}
function cineAudioTick(t) {
  const A = CINE.au; if (!A) return; const C = AU.ctx, n = C.currentTime;
  // the machine's hum: loud below, a faint rumble through the floor upstairs; it climbs after the button
  const S = CINE.shot, inB = S === 2 || S === 4 || S === 6, hum = t > 45.6 ? (S === 7 ? .018 : 0) : inB ? (S === 6 ? .16 : S === 4 && t > 36.4 ? .11 : .055) : (t > 36.4 ? .03 : 0);
  A.g.gain.setTargetAtTime(hum * 1.4, n, S === 7 ? .8 : .06);
  // the kitchen clock
  const kit = S === 0 || S === 1 || S === 3 || S === 5, sec = Math.floor(t);
  if (sec !== CINE.tick) { CINE.tick = sec; if (kit && t < 40) nz(.022, sec % 2 ? 3900 : 2900, 4, S === 1 ? .1 : .055); }
}
// an original little tune: a lullaby the music box plays while they eat; it slows, sags and stops mid-phrase
const CINE_TUNE = [
  [72, 77, 81], [79, 0, 77], [76, 77, 79], [72, 0, 0],
  [74, 77, 82], [81, 0, 79], [77, 76, 74], [77, 0, 0],
  [72, 77, 81], [84, 0, 82], [81, 79, 77], [79, 0, 0]];
const CINE_LOW = [65, 60, 58, 60, 62, 58, 60, 65, 65, 57, 58, 60];
function cineBox() {
  const A = CINE.au; if (!A) return; const C = AU.ctx; let tt = C.currentTime + .05, beat = 0;
  CINE_TUNE.forEach((bar, bi) => bar.forEach((m, j) => {
    const i = Math.max(0, beat - 24), slow = 1 + i * .16, dur = .5 * slow, det = -i * 9, vel = (beat >= 24 ? 1 - i * .07 : 1) * (j === 0 ? 1 : .8);
    if (beat <= 31) { if (m) cineNote(m, tt, vel * .085, det); if (j === 0) cineNote(CINE_LOW[bi], tt, vel * .05, det); }
    tt += dur; beat++;
  }));
}
function cineNote(m, t, vel, det = 0) {
  const A = CINE.au; if (!A) return; const C = AU.ctx, f = 440 * Math.pow(2, (m - 69) / 12) * Math.pow(2, det / 1200);
  const g = C.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + 2.4); g.connect(A.box);
  for (const [r, a, d] of [[1, 1, 2.4], [2.98, .3, .55], [5.43, .1, .22]]) { const o = C.createOscillator(), og = C.createGain(); o.frequency.value = f * r; og.gain.setValueAtTime(a, t); og.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(og); og.connect(g); o.start(t); o.stop(t + d + .05); }
}
function cineSfx(k) {
  const A = CINE.au;
  if (k === 'press') { tone(1300, 900, .05, .08, 'square'); nz(.04, 3000, 2, .1); if (A) { const n = AU.ctx.currentTime; A.o.frequency.setValueAtTime(55, n); A.o.frequency.exponentialRampToValueAtTime(150, n + 9); A.o2.frequency.setValueAtTime(110.7, n); A.o2.frequency.exponentialRampToValueAtTime(330, n + 9); A.lp.frequency.setValueAtTime(300, n); A.lp.frequency.exponentialRampToValueAtTime(1800, n + 9); } }
  else if (k === 'boom') {
    tone(96, 26, 2.6, .9); tone(60, 22, 3.2, .7, 'triangle'); nz(2.8, 340, .5, .9, 'lowpass'); nz(1.1, 2600, .6, .4); nz(.25, 6000, .7, .3, 'highpass');
    tone(3500, 3420, 5, .02, 'sine', .4);   // the ringing in the ears afterwards
    CINE.shake = 0; cineMachine(1);
  }
}
function cineSay(n, t, c, dur) { $('cineSubN').textContent = n; $('cineSubN').style.color = c; $('cineSubT').textContent = t; $('cineSub').classList.add('on'); CINE.subT = dur; }

// skip: the button, or Space / Enter / Esc (read in cineTick)
$('cineSkip').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (CINE.on && CINE.t > .5) { audioInit(); filmEnd(true); } });
// dev: jump to a moment of the film (tests)
function cineAt(t, F) {
  F = F || CINE.F || FILM_OPEN; if (!CINE.on) { if (F === FILM_OPEN) cineStart(); else filmPlay(F); }
  CINE.manual = true; CINE.t = t; CINE.ev = F.ev.findIndex(e => e[0] > t); if (CINE.ev < 0) CINE.ev = F.ev.length; CINE.shot = -1; return 1;
}
