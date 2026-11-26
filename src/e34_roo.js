// =====================================================================
//  跳跳 — 袋鼠 (kangaroo, 技術員)
//  · left click (hold): crouch and let go for the big hop, as before
//  · right click: HOLD and the pouch opens — a GTA-style item wheel (time slows to a crawl in
//    single player); flick the mouse toward an item (or press 1–6) and let go to use it.
//    A quick tap of right click uses the last item again. Touch: the 袋 button.
//  · the pouch's own tool is the springboard (3 a chapter): a spring pad at your feet — anyone who
//    steps on it is thrown high. Everything else in it is what you've picked up (up to six things):
//    take one out and it's in your paws; put it down yourself (E), or it goes back in if you don't use it
//  · online: every use is sent to everyone (each machine moves its own players; the host does the noise)
// =====================================================================
const POUCH_ITEMS = [
  { id: 'spring', name: '彈簧墊', n: 3, desc: '放喺腳邊，踩上去彈好高，隊友都用得',
    svg: '<rect x="8" y="31" width="24" height="4.5" rx="2"/><rect x="10" y="6" width="20" height="4" rx="2"/><path d="M12 28.5 28 25 12 21.5 28 18 12 14.5 28 11"/>' }
];
const POUCH = { store: [], entries: [], open: false, sel: -1, last: 0, dx: 0, dy: 0, t0: 0, held: false, cnt: {}, slow: 1, springs: [], winds: [], clouds: [], pulls: [] };
function pouchRefill() { for (const it of POUCH_ITEMS) POUCH.cnt[it.id] = it.n; }
pouchRefill();
const isRoo = C => !!(C && C.S && C.S.roo);

// ---------- the kangaroo's body: tall ears, a long muzzle, big hind feet, a heavy tail, the pouch ----------
function rooEar(g, s, k, part, plain, fm) {
  g.position.set(s * .5 * k, 1.0 * k, -.16 * k); g.rotation.set(-.12, s * -.22, s * -.3);
  part(ell(.3 * k, .84 * k, .15 * k, 24, 20), fm(0), g, 0, .74 * k, 0);
  plain(ell(.18 * k, .64 * k, .06 * k, 20, 16), new THREE.MeshPhysicalMaterial({ color: 0xe6b49a, roughness: .55, sheen: .6, sheenColor: 0xffd8c8 }), g, 0, .72 * k, .11 * k);
}
function rooTail(C, S, tailRoot, k, part, fm) {
  // a heavy tail of overlapping soft lobes, thick at the root, resting on the ground behind
  let parent = tailRoot; tailRoot.position.set(0, .12 * k, -.7 * k); const tm = fm(0, S.len * .85);
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group(); g.position.z = i ? -.42 * k : 0; parent.add(g); const r = lerp(.46, .16, i / 5);
    part(ell(r * k, r * .92 * k, r * 1.55 * k, 24, 16), tm, g, 0, 0, -.2 * k); g.rotation.x = i === 0 ? .85 : -.14; C.tail.push(g); parent = g;
  }
}
function rooExtras(C, S, head, body, k, part, plain) {
  const fm = (bel, len = S.len, den = S.den, col = S.fur) => furMat({ color: col, belly: S.belly, bellyAmt: bel, len, den, rimK: .07 });
  // a longer muzzle, the nose moved to its tip
  part(ell(.5 * k, .4 * k, .58 * k), fm(.8, S.len * .7), head, 0, -.28 * k, 1.16 * k);
  for (const ch of head.children) if (Math.abs(ch.position.z - 1.45 * k) < .01 && ch.position.y < 0) ch.position.set(0, -.1 * k, 1.74 * k);
  // big hind feet, small forepaws
  for (const L of C.legs) { const f = L.children[1]; if (f) { f.scale.set(1.05, 1, 1.9); f.position.z = .42 * k; } }
  for (const A of C.arms) A.scale.setScalar(.82);
  // the pouch: a soft lip of fur on the belly, which opens when you reach in
  const g = new THREE.Group(); g.position.set(0, .66 * k, .78 * k); body.add(g); C.pouchG = g;
  const shell = new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); shell.scale(.62 * k, .5 * k, .3 * k);
  part(shell, fm(1, S.len * .8, S.den, S.belly), g, 0, 0, .06 * k);
  const lip = plain(new THREE.TorusGeometry(.6 * k, .055 * k, 8, 28, Math.PI), new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: .8 }), g, 0, 0, .06 * k); lip.rotation.set(Math.PI / 2, Math.PI, 0); lip.scale.z = .5;
  const dark = plain(ell(.5 * k, .06 * k, .2 * k, 20, 8), new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 1 }), g, 0, -.01 * k, .02 * k); dark.castShadow = false;
  // an umbrella, folded away until it is needed
  const u = new THREE.Group(); u.position.set(.62 * k, 4.7 * k, .15 * k); u.rotation.z = -.12; u.visible = false; C.root.add(u); C.umbG = u;
  const can = new THREE.Mesh(new THREE.SphereGeometry(2.7 * k, 32, 10, 0, Math.PI * 2, 0, Math.PI * .36), new THREE.MeshPhysicalMaterial({ color: 0xe8523a, roughness: .45, sheen: .5, sheenColor: 0xffc0a8, side: THREE.DoubleSide }));
  can.position.y = -2.2 * k; can.castShadow = true; u.add(can);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06 * k, .06 * k, 3.4 * k, 8), MAT.steel); pole.position.y = -1.4 * k; u.add(pole);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(.28 * k, .07 * k, 6, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: .6 })); hook.position.set(-.28 * k, -3.1 * k, 0); hook.rotation.z = Math.PI; u.add(hook);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.13 * k, 10, 8), new THREE.MeshStandardMaterial({ color: 0x2a2a2e })); tip.position.y = .56 * k; u.add(tip);
}
function rooAnim(C, dt, st) {
  const k = C.k, moving = (st === 'walk' || st === 'sneak') && C.grounded;
  if (moving) {
    // both feet together: a hop for every step
    const h = Math.abs(Math.sin(C.phase)); C.body.position.y += h * .5 * k;
    const v = -.15 + (h - .5) * -.9; C.legs[0].rotation.x = v; C.legs[1].rotation.x = v;
    for (const A of C.arms) A.rotation.x = -.95; C.body.rotation.x += .18;
    if (C.tail[0]) C.tail[0].rotation.x = .72 - h * .35;
  } else if (st === 'air' && C.tail[0]) { C.tail[0].rotation.x = damp(C.tail[0].rotation.x, .3, 6, dt); C.legs[0].rotation.x = C.legs[1].rotation.x = .55; }
  else if (C.tail[0]) C.tail[0].rotation.x = damp(C.tail[0].rotation.x, .72, 6, dt);
  if (C.pouchG) { const want = C === leader && POUCH.open ? 1 : 0; C.pouchK = damp(C.pouchK || 0, want, 12, dt); C.pouchG.rotation.x = -C.pouchK * .55; C.pouchG.scale.set(1 + C.pouchK * .12, 1 + C.pouchK * .2, 1 + C.pouchK * .3); }
  if (C.umbG) { const on = C.umbT > T; C.umbK = damp(C.umbK || 0, on ? 1 : 0, 10, dt); C.umbG.visible = C.umbK > .02; C.umbG.scale.set(C.umbK, Math.max(.05, C.umbK), C.umbK); C.umbG.rotation.z = -.12 + Math.sin(C.t * 3) * .05; if (C.umbK > .5) C.arms[1].rotation.set(-2.9, 0, .25); }
}

// ---------- the wheel ----------
function pouchEntries() {
  const E = [Object.assign({ kind: 'tool' }, POUCH_ITEMS[0])];
  for (const t of Object.keys(LOOSE_T)) { const n = POUCH.store.filter(i => LOOSE[i] && LOOSE[i].type === t).length; if (n) E.push({ kind: 'loose', id: t, name: LOOSE_T[t].name, desc: LOOSE_T[t].desc, svg: LOOSE_T[t].svg, n }); }
  return E;
}
function pouchWheelBuild() {
  const W = $('pouchWheel'); if (!W) return; POUCH.entries = pouchEntries(); const ITEMS = POUCH.entries;
  if (!W.dataset.wired) { W.dataset.wired = 1;
    W.addEventListener('pointerover', e => { const b = e.target.closest('.pw-it,.pw-seg'); if (b) { POUCH.sel = +b.dataset.i; pouchMark(); } });
    W.addEventListener('click', e => { const b = e.target.closest('.pw-it,.pw-seg'); if (b) { POUCH.sel = +b.dataset.i; pouchClose(true); } else if (TOUCH) pouchClose(false); }); }
  const n = Math.max(2, ITEMS.length), rI = 80, rO = 186, gap = .022; let segs = '';
  for (let i = 0; i < n; i++) {
    const a0 = (i - .5) / n * Math.PI * 2 - Math.PI / 2 + gap, a1 = (i + .5) / n * Math.PI * 2 - Math.PI / 2 - gap, P = (r, a) => `${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;
    segs += `<path class="pw-seg" data-i="${i}" d="M${P(rI, a0)} L${P(rO, a0)} A${rO} ${rO} 0 0 1 ${P(rO, a1)} L${P(rI, a1)} A${rI} ${rI} 0 0 0 ${P(rI, a0)} Z"/>`;
  }
  W.innerHTML = `<svg class="pw-ring" viewBox="-200 -200 400 400" aria-hidden="true">${segs}</svg>` + ITEMS.map((it, i) => {
    const a = i / n * Math.PI * 2 - Math.PI / 2, r = (rI + rO) / 2;
    return `<button class="pw-it" data-i="${i}" style="--x:${(Math.cos(a) * r).toFixed(1)}px;--y:${(Math.sin(a) * r).toFixed(1)}px"><svg viewBox="0 0 40 40" aria-hidden="true">${it.svg}</svg><b>${it.name}</b><i>0</i><kbd>${i + 1}</kbd></button>`;
  }).join('') + `<div class="pw-hub"><small class="pw-k">育兒袋</small><b class="pw-n"></b><small class="pw-d"></small><em class="pw-c"></em></div>`;
}
function pouchMark() {
  const W = $('pouchWheel'); if (!W) return; const s = POUCH.sel;
  const ITEMS = POUCH.entries, cnt = it => it ? (it.kind === 'tool' ? POUCH.cnt[it.id] || 0 : it.n) : 0;
  W.querySelectorAll('.pw-seg').forEach(p => { const i = +p.dataset.i, it = ITEMS[i]; p.classList.toggle('on', i === s && !!it); p.classList.toggle('out', !cnt(it)); });
  W.querySelectorAll('.pw-it').forEach(b => { const i = +b.dataset.i, it = ITEMS[i], c = cnt(it); b.classList.toggle('on', i === s); b.classList.toggle('out', !c); b.querySelector('i').textContent = c; });
  const it = ITEMS[s >= 0 && ITEMS[s] ? s : 0];
  W.querySelector('.pw-n').textContent = it.name; W.querySelector('.pw-d').textContent = it.kind === 'tool' ? it.desc : it.desc + '（拎出嚟揸喺手）';
  const c = cnt(it); W.querySelector('.pw-c').textContent = c ? (it.kind === 'tool' ? `剩 ${c} 個` : `袋入面 ${c} 個`) : '用晒';
  W.querySelector('.pw-k').textContent = s >= 0 ? (TOUCH ? '點一下' : '放手就揀') : (TOUCH ? '點一樣嘢' : `甩滑鼠揀 · 1–${ITEMS.length}`) + `（袋入面 ${POUCH.store.length}/6）`;
}
function pouchOpen() {
  const L = leader; if (POUCH.open || !isRoo(L) || STATE !== 'play' || PAUSED || L.frozen || EMO.open) return;
  pouchWheelBuild(); POUCH.open = true; POUCH.sel = -1; POUCH.dx = POUCH.dy = 0; pouchMark();
  const W = $('pouchWheel'); W.hidden = false; requestAnimationFrame(() => W.classList.add('on')); SND.swish();
}
function pouchClose(use) {
  if (!POUCH.open) return; POUCH.open = false; const W = $('pouchWheel'); W.classList.remove('on'); setTimeout(() => { if (!POUCH.open) W.hidden = true; }, 140);
  if (use && POUCH.sel >= 0 && POUCH.entries[POUCH.sel]) { const e = POUCH.entries[POUCH.sel]; if (e.kind === 'tool') pouchUse(e.id); else pouchTakeOut(e.id); }
}
function pouchWheelMouse() {   // flick toward an item (pointer locked)
  const d = Math.hypot(POUCH.dx, POUCH.dy); if (d < 24) return; if (d > 150) { POUCH.dx *= 150 / d; POUCH.dy *= 150 / d; }
  const a = Math.atan2(POUCH.dy, POUCH.dx) + Math.PI / 2, n = Math.max(2, POUCH.entries.length), i = ((Math.round(a / (Math.PI * 2) * n) % n) + n) % n;
  if (i !== POUCH.sel) { POUCH.sel = i; pouchMark(); SND.sw(); }
}
// right mouse: held = the wheel, a quick tap = the last item again
function pouchDown() { POUCH.held = true; POUCH.t0 = performance.now(); setTimeout(() => { if (POUCH.held && !POUCH.open) pouchOpen(); }, 170); }
function pouchUp() {
  if (!POUCH.held) return; POUCH.held = false;
  if (POUCH.open) { pouchClose(true); return; }
  if (performance.now() - POUCH.t0 < 170) pouchUse('spring');
}
addEventListener('mouseup', e => { if (e.button === 2) pouchUp(); });
addEventListener('keydown', e => { if (POUCH.open && /^Digit[1-7]$/.test(e.code)) { POUCH.sel = +e.code.slice(5) - 1; pressed[e.code] = false; POUCH.held = false; pouchClose(true); } });
{ const b = $('tbPouch'); if (b) b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); POUCH.open ? pouchClose(false) : pouchOpen(); }); }

// ---------- using things ----------
function pouchUse(id) {
  const L = leader; if (!isRoo(L) || STATE !== 'play' || L.frozen) return;
  const it = POUCH_ITEMS.find(q => q.id === id); const i = POUCH_ITEMS.indexOf(it);
  if (!(POUCH.cnt[id] > 0)) { toast(`育兒袋入面冇${it.name}喇`); return; }
  if (id === 'spring') { if ((POUCH.cd || 0) > T) { toast(`彈簧墊冷卻中（${Math.ceil(POUCH.cd - T)} 秒）`); return; } POUCH.cd = T + 2.5; }
  if (id === 'umb' && L.umbT > T) { toast('雨傘已經開咗'); return; }
  const fx = Math.sin(L.yaw), fz = Math.cos(L.yaw); let a = L.pos.clone(), b = null;
  if (id === 'spring') { a.set(L.pos.x + fx * 3.2, 0, L.pos.z + fz * 3.2); const [sup] = supportAt(a.x, a.z, 1, L.pos.y + 3); if (sup < L.pos.y - 6) { toast('呢度放唔穩彈簧墊'); return; } a.y = sup; }
  else if (id === 'flour') { ray.setFromCamera(_sc, camera); const o = ray.ray.origin.clone(), d = ray.ray.direction.clone(); const [t] = rayHit(o, d, 300); b = o.addScaledVector(d, Math.min(t, 300) - .5); a = V3(L.pos.x + fx * 1.2, L.pos.y + L.h * .8, L.pos.z + fz * 1.2); }
  else if (id === 'wind') a.set(L.pos.x + fx * 2.4, L.pos.y, L.pos.z + fz * 2.4);
  POUCH.cnt[id]--; POUCH.last = i; refreshPartyHUD && refreshPartyHUD();
  const yaw = id === 'wind' ? Math.atan2(-Math.sin(cam.yaw), -Math.cos(cam.yaw)) : L.yaw;
  const d = { t: 'pch', c: L.id, k: id, a: a.toArray().map(v => +v.toFixed(2)), b: b ? b.toArray().map(v => +v.toFixed(2)) : null, y: +yaw.toFixed(3) };
  pouchDo(d, true); if (NET.on) nsend(d);
  L.arms[1].rotation.x = -2.2; SND.swish(); toast(`${it.name}！（剩 ${POUCH.cnt[id]}）`, 1.6);
}
function pouchRecv(d) { if (chars[d.c]) pouchDo(d, false); }
function pouchDo(d, own) {
  const C = chars[d.c], a = V3(...d.a);
  if (d.k === 'spring') spawnSpring(a);
  else if (d.k === 'wind') spawnWind(a, d.y);
  else if (d.k === 'flour') throwFlour(a, V3(...d.b));
  else if (d.k === 'candy') {
    for (const F of party) { if (!mine(F) || F.frozen || F.pos.distanceTo(C.pos) > 150) continue; F.stamina = F.stamMax; F.sugarT = T + 9; for (let i = 0; i < 12; i++) emit(V3(F.pos.x, F.pos.y + F.h * .6, F.pos.z), V3(R(-14, 14), R(8, 24), R(-14, 14)), new THREE.Color(1.6, 1.1, .5), R(.2, .4), R(.4, .8), 60, 1.5); }
    refreshPartyHUD && refreshPartyHUD(); tone(660, 990, .14, .05, 'triangle'); tone(990, 1320, .12, .04, 'triangle', .1);
  } else if (d.k === 'magnet') magnetPull(C, own);
  else if (d.k === 'umb') { C.umbT = T + 12; tone(300, 520, .12, .05, 'triangle'); }
}

// 彈簧墊
let _sprG = null;
function spawnSpring(p) {
  if (!_sprG) { const pts = []; for (let i = 0; i <= 50; i++) { const a = i / 50 * Math.PI * 8; pts.push(V3(Math.cos(a) * 1.6, .5 + i / 50 * 2.2, Math.sin(a) * 1.6)); } _sprG = { coil: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, .2, 6), base: new THREE.CylinderGeometry(2.6, 2.8, .5, 24), top: new THREE.CylinderGeometry(2.4, 2.4, .45, 24),
    mb: new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: .6 }), mt: new THREE.MeshPhysicalMaterial({ color: 0xf0b030, roughness: .35, clearcoat: .8 }) }; }
  const g = new THREE.Group(); g.position.copy(p); fxGroup.add(g);
  const base = new THREE.Mesh(_sprG.base, _sprG.mb); base.position.y = .25; const coil = new THREE.Mesh(_sprG.coil, MAT.steel); const top = new THREE.Mesh(_sprG.top, _sprG.mt); top.position.y = 2.9;
  for (const m of [base, coil, top]) { m.castShadow = true; g.add(m); }
  POUCH.springs.push({ g, coil, top, p: p.clone(), t: 0, k: 0, cd: {} }); if (POUCH.springs.length > 4) { const o = POUCH.springs.shift(); fxGroup.remove(o.g); }
  SND.clang(.25);
}
// 發條老鼠
let _windM = null;
function spawnWind(p, yaw) {
  if (!_windM) _windM = { body: new THREE.MeshPhysicalMaterial({ color: 0x9aa0a8, roughness: .4, metalness: .3, clearcoat: .6 }), key: new THREE.MeshStandardMaterial({ color: 0xd8b040, metalness: .8, roughness: .3 }), pink: new THREE.MeshStandardMaterial({ color: 0xe89aa8, roughness: .6 }) };
  const g = new THREE.Group(); g.position.copy(p); g.rotation.y = yaw; fxGroup.add(g); const M = _windM;
  const body = new THREE.Mesh(ell(1.3, 1.1, 2.1, 20, 14), M.body); body.position.y = 1.05; g.add(body);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.55, 12, 10), M.pink); e.position.set(s * .7, 2.0, 1.1); e.scale.z = .4; g.add(e); }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), M.pink); nose.position.set(0, 1.0, 2.15); g.add(nose);
  const key = new THREE.Group(); key.position.set(0, 2.2, -.4); g.add(key);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .8, 8), M.key); st.position.y = .3; key.add(st);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.45, .14, 6, 14), M.key); w.position.set(s * .5, .85, 0); w.rotation.y = Math.PI / 2; key.add(w); }
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(.07, .12, 2.2, 6), M.pink); tail.rotation.x = Math.PI / 2 - .3; tail.position.set(0, .9, -2.6); g.add(tail);
  g.traverse(q => { if (q.isMesh) q.castShadow = true; });
  POUCH.winds.push({ g, key, p: p.clone(), yaw, t: 0, click: 0 });
}
// 麵粉彈
let _flourM = null;
function throwFlour(a, b) {
  if (!_flourM) { const [c, x] = cnv(128, 128), g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.35, 'rgba(250,248,242,.7)'); g.addColorStop(.7, 'rgba(246,243,236,.25)'); g.addColorStop(1, 'rgba(240,236,228,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    _flourM = { bag: new THREE.MeshStandardMaterial({ color: 0xefe6d2, roughness: .9 }), puff: new THREE.SpriteMaterial({ map: tex(c), color: 0xf6f2ea, transparent: true, opacity: .8, depthWrite: false }) }; }
  const m = new THREE.Mesh(ell(.9, 1.1, .9, 12, 10), _flourM.bag); m.castShadow = true; fxGroup.add(m);
  POUCH.clouds.push({ fly: { m, a: a.clone(), b: b.clone(), t: 0, dur: clamp(a.distanceTo(b) / 150, .3, 1.3), h: Math.min(36, a.distanceTo(b) * .25) + 4 }, p: b.clone(), puffs: [], t: -1, r: 0 });
}
function burstFlour(Cl) {
  Cl.t = 0; fxGroup.remove(Cl.fly.m); Cl.fly = null; const [sup] = supportAt(Cl.p.x, Cl.p.z, 1, Cl.p.y + 2); Cl.p.y = Math.max(sup, Cl.p.y - 6);
  for (let i = 0; i < 26; i++) { const s = new THREE.Sprite(_flourM.puff); const a = i * 2.39996, r = Math.sqrt((i + .5) / 26); s.userData.o = V3(Math.cos(a) * r, .1 + (i % 5) / 5 * .8, Math.sin(a) * r); s.userData.k = .7 + (i % 3) * .2; s.renderOrder = 3; fxGroup.add(s); Cl.puffs.push(s); }
  SND.thud(.2); nz(.6, 1400, .6, .12, 'lowpass');
  for (let i = 0; i < 40; i++) emit(Cl.p.clone().add(V3(0, 3, 0)), V3(R(-60, 60), R(10, 50), R(-60, 60)), new THREE.Color(.95, .93, .9), R(.5, 1.1), R(.8, 1.6), 30, 3);
  if (!NET.client) noise(Cl.p, .35, .25);
}
function inFlour(p) { for (const Cl of POUCH.clouds) if (Cl.t >= 0 && Cl.r > 4 && Math.hypot(p.x - Cl.p.x, p.z - Cl.p.z) < Cl.r * .9 && p.y < Cl.p.y + Cl.r * 1.1 && p.y > Cl.p.y - 4) return true; return false; }
// 磁石
function magnetPull(C, own) {
  const p = C.pos, R0 = 170, list = [];
  for (const [arr, k] of [[batteries, 'bat'], [VIALS, 'vial'], [CRUMBS, 'crumb']]) arr.forEach((q, i) => { if (!q.got && Math.hypot(q.x - p.x, q.z - p.z) < R0 && Math.abs(q.y - p.y) < 90) list.push({ q, k, i }); });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.5, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9ad8ff).multiplyScalar(2), transparent: true, opacity: .8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, p.y + .4, p.z); ring.userData.t = 0; fxGroup.add(ring); POUCH.pulls.push({ ring, t: 0, C, list, own });
  tone(220, 880, .35, .05, 'sawtooth'); if (own && !list.length) setTimeout(() => toast('附近冇嘢吸得到'), 500);
}

// ---------- every frame ----------
function pouchTick(rawDt) {
  // time crawls while the wheel is open (single player only: everyone else keeps playing online)
  POUCH.slow = damp(POUCH.slow, POUCH.open && !NET.on ? .22 : 1, 14, rawDt);
  if (POUCH.open) { pouchWheelMouse(); if (!isRoo(leader) || STATE !== 'play' || leader.frozen) pouchClose(false); }
}
function pouchUpdate(dt) {
  // springs: land or walk onto one and up you go
  for (const S of POUCH.springs) {
    S.t += dt; S.k = damp(S.k, 0, 9, dt); S.coil.scale.y = 1 - S.k * .6; S.top.position.y = 2.9 - S.k * 1.4;
    for (const F of party) { if (!mine(F) || F.frozen || F.climbing) continue; const top = S.p.y + 3.1;
      if (Math.hypot(F.pos.x - S.p.x, F.pos.z - S.p.z) < 2.9 && F.pos.y < top + 1.4 && F.pos.y > top - 2.2 && F.vel.y <= 8 && !(S.cd[F.id] > T)) {
        S.cd[F.id] = T + .45; S.k = 1; F.pos.y = top; F.vel.y = 132; F.grounded = false; F.state = 'air'; F.squash = -.9; F.leapT = .4;
        if (F === leader) { SND.jump(); tone(240, 900, .25, .06, 'triangle'); cam.shake = Math.max(cam.shake, .08); } } }
  }
  for (let i = POUCH.springs.length - 1; i >= 0; i--) if (POUCH.springs[i].t > 90) { fxGroup.remove(POUCH.springs[i].g); POUCH.springs.splice(i, 1); }
  // wind-up mice: off they go, turning away from walls and edges, clicking all the way
  for (let i = POUCH.winds.length - 1; i >= 0; i--) {
    const W = POUCH.winds[i]; W.t += dt; W.key.rotation.z += dt * 10 * (W.t < 8 ? 1 : 0);
    if (W.t < 8) {
      const fx = Math.sin(W.yaw), fz = Math.cos(W.yaw), nx = W.p.x + fx * 38 * dt, nz2 = W.p.z + fz * 38 * dt;
      const [sup] = supportAt(nx + fx * 2.5, nz2 + fz * 2.5, .6, W.p.y + 1.5);
      if (solidAt(nx + fx * 2.2, W.p.y + 1, nz2 + fz * 2.2) || sup < W.p.y - 3) W.yaw += Math.PI / 2 + R(-.4, .4); else { W.p.x = nx; W.p.z = nz2; W.p.y = Math.max(sup, W.p.y - 60 * dt); }
      W.g.position.copy(W.p); W.g.position.y += Math.abs(Math.sin(W.t * 26)) * .25; W.g.rotation.y = angDamp(W.g.rotation.y, W.yaw, 12, dt);
      W.click -= dt; if (W.click <= 0) { W.click = .16; const near = leader && leader.pos.distanceTo(W.p) < 220; if (near) nz(.025, 3800, 2, .05); }
      if (!NET.client && Math.floor(W.t / .7) !== Math.floor((W.t - dt) / .7)) noise(W.p.clone(), .55, .12);
    } else if (W.t > 14) { fxGroup.remove(W.g); POUCH.winds.splice(i, 1); }
  }
  // flour: the bag in flight, then the cloud swelling and slowly thinning out
  for (let i = POUCH.clouds.length - 1; i >= 0; i--) {
    const Cl = POUCH.clouds[i];
    if (Cl.fly) { const F = Cl.fly; F.t += dt; const u = Math.min(1, F.t / F.dur); F.m.position.lerpVectors(F.a, F.b, u); F.m.position.y += Math.sin(u * Math.PI) * F.h; F.m.rotation.x += dt * 9; if (u >= 1) burstFlour(Cl); continue; }
    Cl.t += dt; const grow = Math.min(1, Cl.t / .6), fade = Cl.t > 8 ? Math.max(0, 1 - (Cl.t - 8) / 2.5) : 1; Cl.r = 26 * grow * (fade > .2 ? 1 : fade * 5);
    for (const s of Cl.puffs) { const o = s.userData.o, kk = s.userData.k; s.position.set(Cl.p.x + o.x * Cl.r * .8, Cl.p.y + 4 + o.y * Cl.r * .7 + Cl.t * .6, Cl.p.z + o.z * Cl.r * .8); s.scale.setScalar(Math.max(.01, Cl.r * 1.05 * kk * (.85 + Math.sin(Cl.t * 1.3 + o.x * 5) * .08))); }
    _flourM.puff.opacity = .72 * Math.min(1, Math.max(...POUCH.clouds.filter(q => !q.fly).map(q => q.t > 8 ? Math.max(0, 1 - (q.t - 8) / 2.5) : 1)));
    if (Cl.t > 10.5) { for (const s of Cl.puffs) fxGroup.remove(s); POUCH.clouds.splice(i, 1); }
  }
  // magnet pulses: everything close by streaks in
  for (let i = POUCH.pulls.length - 1; i >= 0; i--) {
    const P = POUCH.pulls[i]; P.t += dt; P.ring.scale.setScalar(1 + P.t * 220); P.ring.material.opacity = Math.max(0, .8 - P.t * 1.3); P.ring.position.set(P.C.pos.x, P.C.pos.y + .4, P.C.pos.z);
    for (const L of P.list) { if (L.done) continue; const q = L.q, u = Math.min(1, P.t / .55), x = lerp(q.x, P.C.pos.x, u), y = lerp(q.y + 2, P.C.pos.y + 2, u), z = lerp(q.z, P.C.pos.z, u);
      if (rnd() < .7) emit(V3(x, y, z), V3(R(-3, 3), R(-3, 3), R(-3, 3)), new THREE.Color(.7, 1.3, 1.8), R(.2, .4), R(.2, .4), 0, 2);
      if (u >= 1) { L.done = true; if (P.own && !q.got) netGet(L.k, L.i); } }
    if (P.t > .8) { fxGroup.remove(P.ring); POUCH.pulls.splice(i, 1); }
  }
  // umbrellas: a gentle way down
  for (const C of party) if (C.umbT > T && mine(C) && !C.grounded && !C.climbing && C.vel.y < -13) C.vel.y = Math.max(C.vel.y, -13);
}
function pouchHint(L) {
  if (!isRoo(L)) return ''; const it = POUCH_ITEMS[POUCH.last], c = POUCH.cnt[it.id] || 0;
  return TOUCH ? `「袋」：育兒袋（${it.name} ×${c}）` : `<kbd>右鍵</kbd> 按住開育兒袋 · 快按再用「${it.name}」×${c}`;
}

// =====================================================================
//  執嘢 — small things lying about that anyone can pick up and carry
//  · E (用) by something small: pick it up (one at a time, in your paws). E again: put it down at your feet
//  · while you hold something your paws are full: your ability button uses it instead —
//      樽蓋 / 鈕扣  thrown where you're looking; it clatters where it lands and draws people there
//      方糖        eaten: stamina back to full, and the cap restored a little
//  · the kangaroo puts what it picks up in the pouch (up to six); take one out from the pouch wheel and
//    it's in your paws — put it down (E) or use it, or after a while unused it goes back in the pouch
//  · online: every pick-up, put-down, throw and bite is sent to everyone; each machine moves the things
// =====================================================================
const LOOSE_T = {
  cap: { name: '樽蓋', desc: '掟出去：跌落地嗰度會響，引人過去', use: '掟', throw: true,
    svg: '<ellipse cx="20" cy="17" rx="13" ry="5"/><path d="M7 17v6c0 2.8 5.8 5 13 5s13-2.2 13-5v-6"/><path d="M11 22v4M16 23.5v4M24 23.5v4M29 22v4"/>' },
  button: { name: '鈕扣', desc: '掟出去：跌落地嗰度會響，引人過去', use: '掟', throw: true,
    svg: '<circle cx="20" cy="20" r="13"/><circle cx="20" cy="20" r="9"/><circle cx="16.5" cy="16.5" r="1.6"/><circle cx="23.5" cy="16.5" r="1.6"/><circle cx="16.5" cy="23.5" r="1.6"/><circle cx="23.5" cy="23.5" r="1.6"/>' },
  sugar: { name: '方糖', desc: '食咗：體力即刻滿返，上限都補返啲', use: '食', food: true,
    svg: '<path d="M8 14l12-6 12 6v13l-12 6-12-6z"/><path d="M8 14l12 6 12-6M20 20v13"/>' },
  raisin: { name: '提子乾', desc: '食咗：體力回返一半', use: '食', food: true, half: true,
    svg: '<ellipse cx="20" cy="20" rx="12" ry="9"/><path d="M11 18c3 2 6-2 9 0s6 2 9-1M12 23c3 1 6-1 9 1s5 1 7-1"/>' },
  marble: { name: '波子', desc: '掟出去：落地之後會一路碌、一路響，引人行遠啲', use: '掟', throw: true, roll: true,
    svg: '<circle cx="20" cy="20" r="12"/><path d="M11 23c4-7 10 3 17-5M14 13c3 2 6 0 8 4"/>' }
};
const LOOSE = [];
function looseMesh(type) {
  const g = new THREE.Group();
  if (type === 'cap') { const m = new THREE.MeshPhysicalMaterial({ color: [0xc8312a, 0x2f8a4a, 0x2a5ab0][LOOSE.length % 3], metalness: .6, roughness: .3, clearcoat: .6 });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.3, .9, 22, 1, true), m); c.position.y = .45; g.add(c); const t = new THREE.Mesh(new THREE.CircleGeometry(2.2, 22), m); t.rotation.x = -Math.PI / 2; t.position.y = .9; g.add(t); }
  else if (type === 'button') { const m = new THREE.MeshPhysicalMaterial({ color: [0xe8c25a, 0x6a3a2a, 0xf2efe6][LOOSE.length % 3], roughness: .35, clearcoat: .8 });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, .6, 24), m); c.position.y = .3; g.add(c);
    for (const [x, z] of [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]]) { const h = new THREE.Mesh(new THREE.CircleGeometry(.22, 10), new THREE.MeshBasicMaterial({ color: 0x1a1410 })); h.rotation.x = -Math.PI / 2; h.position.set(x, .61, z); g.add(h); } }
  else if (type === 'raisin') { const c = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 1), new THREE.MeshPhysicalMaterial({ color: 0x4a2230, roughness: .55, clearcoat: .4 })); c.scale.set(1.25, .7, .95); c.position.y = .8; g.add(c); }
  else if (type === 'marble') { const c = new THREE.Mesh(new THREE.SphereGeometry(1.35, 20, 14), new THREE.MeshPhysicalMaterial({ color: 0xdff2fb, roughness: .04, clearcoat: 1, transparent: true, opacity: .6 })); c.position.y = 1.35; g.add(c);
    const s = new THREE.Mesh(new THREE.TorusGeometry(.6, .28, 8, 16), new THREE.MeshStandardMaterial({ color: [0x3a8ad8, 0xe85a4a, 0x4ab86a][LOOSE.length % 3], roughness: .3 })); s.position.y = 1.35; s.rotation.set(.7, .3, 0); g.add(s); }
  else { const c = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4), new THREE.MeshPhysicalMaterial({ color: 0xfbf8f2, roughness: .9, sheen: .4 })); c.position.y = 1.2; g.add(c); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.noSolid = true; } });
  return g;
}
function addLoose(type, x, y, z) { const g = looseMesh(type); g.position.set(x, y, z); g.rotation.y = R(0, 6.28); scene.add(g); LOOSE.push({ i: LOOSE.length, type, g, p: V3(x, y, z), v: V3(), st: 'ground', by: null, idle: 0 }); }
// the house's loose things (built with the kitchen)
function buildLoose() {
  for (const o of LOOSE) scene.remove(o.g); LOOSE.length = 0; POUCH.store = [];
  for (const [t, x, y, z] of [['cap', 172, 0, -122], ['cap', -110, 76, 72], ['cap', 742, 0, 118], ['button', 40, 0, 64], ['button', 300, 0, -400], ['button', 520, 0, 160],
    ['sugar', -160, 76, 58], ['sugar', 112, 90, -176], ['sugar', 742, 42, 98]]) addLoose(t, x, y, z);
}
const looseHeld = C => C && LOOSE.find(o => o.st === 'held' && o.by === C.id);
function looseNear(C, r = 4.5) { let best = null, bd = r; for (const o of LOOSE) { if (o.st !== 'ground') continue; const d = Math.hypot(o.p.x - C.pos.x, o.p.z - C.pos.z); if (d < bd && Math.abs(o.p.y - C.pos.y) < 4) { bd = d; best = o; } } return best; }
// one place where every change happens (locally, and the same on every machine)
function looseDo(d, local) {
  const o = LOOSE[d.i]; if (!o) return; const C = chars[d.c];
  if (d.k === 'take') { o.st = 'held'; o.by = d.c; o.idle = 0; o.g.visible = true; }
  else if (d.k === 'pouch') { o.st = 'pouch'; o.by = d.c; o.g.visible = false; if (local) { POUCH.store.push(o.i); } }
  else if (d.k === 'out') { o.st = 'held'; o.by = d.c; o.idle = 0; o.g.visible = true; if (local) POUCH.store = POUCH.store.filter(i => i !== o.i); }
  else if (d.k === 'drop') { o.st = 'ground'; o.by = null; o.p.fromArray(d.p); o.g.position.copy(o.p); o.g.visible = true; }
  else if (d.k === 'throw') { o.st = 'air'; o.by = null; o.p.fromArray(d.p); o.v.fromArray(d.v); o.g.visible = true; }
  else if (d.k === 'eat') { o.st = 'gone'; o.by = null; o.g.visible = false; if (C && mine(C)) { if (LOOSE_T[o.type].half) C.stamina = Math.min(C.stamMax || 100, C.stamina + (C.stamMax || 100) * .5); else { C.stamMax = Math.min(100, (C.stamMax || 100) + 15); C.stamina = C.stamMax; } } }
  else if (d.k === 'back') { o.st = 'ground'; o.by = null; o.v.set(0, 0, 0); o.rang = 0; o.p.fromArray(d.p); o.g.position.copy(o.p); o.g.rotation.set(0, R(0, 6.28), 0); o.g.visible = true; }
  if (local && NET.on) nsend(Object.assign({ t: 'loose' }, d));
  if (local) looseUI();
}
function looseRecv(d) { looseDo(d, false); }
// E: pick up what's at your feet, or put down what you hold
function looseInput(L) {
  if (!L || STATE !== 'play' || L.frozen) return false;
  const h = looseHeld(L);
  if (h) { const f = V3(Math.sin(L.yaw), 0, Math.cos(L.yaw)), p = V3(L.pos.x + f.x * (L.r + 1.6), L.pos.y, L.pos.z + f.z * (L.r + 1.6)); const [sup] = supportAt(p.x, p.z, .5, L.pos.y + 2); p.y = Math.max(sup, L.pos.y - 3);
    looseDo({ k: 'drop', i: h.i, c: L.id, p: p.toArray().map(v => +v.toFixed(2)) }, true); toast(`放低咗${LOOSE_T[h.type].name}`, 1.2); return true; }
  const o = looseNear(L); if (!o) return false;
  if (isRoo(L) && POUCH.store.length < 6) { looseDo({ k: 'pouch', i: o.i, c: L.id }, true); toast(`${LOOSE_T[o.type].name}放咗入育兒袋（${POUCH.store.length}/6）`, 1.6); }
  else { looseDo({ k: 'take', i: o.i, c: L.id }, true); toast(`揸住${LOOSE_T[o.type].name}——${TOUCH ? `按「${LOOSE_T[o.type].use}」` : '左鍵'}${LOOSE_T[o.type].use}，${TOUCH ? '「用」' : 'E'} 放低`, 2.4); }
  SND.swish(); return true;
}
// the kangaroo takes something out of the pouch into its paws (anything already held goes back in first)
function pouchTakeOut(type) {
  const L = leader; if (!isRoo(L) || STATE !== 'play' || L.frozen) return;
  const h = looseHeld(L); if (h) { if (h.type === type) return; looseDo({ k: 'pouch', i: h.i, c: L.id }, true); }
  const idx = POUCH.store.find(i => LOOSE[i] && LOOSE[i].type === type); if (idx === undefined) return;
  looseDo({ k: 'out', i: idx, c: L.id }, true); SND.swish(); toast(`拎咗${LOOSE_T[type].name}出嚟——${TOUCH ? `按「${LOOSE_T[type].use}」` : '左鍵'}${LOOSE_T[type].use}，${TOUCH ? '「用」' : 'E'} 放低`, 2.4);
}
// your ability button while your paws are full
function useHeld(L) {
  const h = looseHeld(L); if (!h) return false; const T2 = LOOSE_T[h.type];
  if (T2.food) { looseDo({ k: 'eat', i: h.i, c: L.id }, true); SND.pick && SND.pick(); toast(T2.half ? '食咗粒提子乾——體力回返一半' : '食咗粒方糖——體力滿返', 1.8); return true; }
  if (T2.throw) { ray.setFromCamera(_sc, camera); const d = ray.ray.direction.clone(); d.y = Math.max(d.y, -.1) + .45; d.normalize();
    const p = V3(L.pos.x + Math.sin(L.yaw) * (L.r + 1), L.pos.y + L.h * .8, L.pos.z + Math.cos(L.yaw) * (L.r + 1));
    looseDo({ k: 'throw', i: h.i, c: L.id, p: p.toArray().map(v => +v.toFixed(2)), v: d.multiplyScalar(70).toArray().map(v => +v.toFixed(2)) }, true);
    L.arms[1].rotation.x = -2.4; SND.swish(); return true; }
  return false;
}
// per frame: things in paws follow them; thrown things fly, land and clatter; unused things go back in the pouch
function looseTick(dt) {
  for (const o of LOOSE) {
    if (o.st === 'held') { const C = chars[o.by]; if (!C || C.frozen || !party.includes(C)) { o.st = 'ground'; o.by = null; if (C) { o.p.set(C.pos.x, C.pos.y, C.pos.z); o.g.position.copy(o.p); } continue; }
      o.g.position.set(C.pos.x + Math.sin(C.yaw) * (C.r + .7), C.pos.y + C.h * .42, C.pos.z + Math.cos(C.yaw) * (C.r + .7)); o.g.rotation.y = C.yaw;
      if (isRoo(C) && C === leader && mine(C)) { o.idle += dt; if (o.idle > 12 && POUCH.store.length < 6) { looseDo({ k: 'pouch', i: o.i, c: C.id }, true); toast(`冇用到——${LOOSE_T[o.type].name}收返入育兒袋`, 1.8); } } }
    else if (o.st === 'air') {
      o.v.y -= 160 * dt; const nx = o.p.x + o.v.x * dt, ny = o.p.y + o.v.y * dt, nz = o.p.z + o.v.z * dt;
      if (solidAt(nx, Math.max(ny, o.p.y) + .6, nz)) { o.v.x *= -.3; o.v.z *= -.3; }   // (walls only: touching down on the floor isn't a wall)
      else { o.p.x = nx; o.p.z = nz; }
      const [sup] = supportAt(o.p.x, o.p.z, .4, o.p.y + 1); o.p.y = ny;
      if (o.p.y <= sup) { o.p.y = sup; const hard = o.v.y < -25, roll = LOOSE_T[o.type].roll; o.v.y = hard ? -o.v.y * .3 : 0;
        if (roll) { const k = hard ? .8 : Math.max(0, 1 - 1.1 * dt); o.v.x *= k; o.v.z *= k; o.rt = (o.rt || 0) + dt;   // a marble keeps rolling, ticking along the floor
          if (o.rang && o.rt > .9 && Math.hypot(o.v.x, o.v.z) > 8) { o.rt = 0; tone(2600, 2400, .03, .03, 'triangle'); noise(o.p.clone(), .4, .2); } }
        else { o.v.x *= .5; o.v.z *= .5; }
        if (hard || !o.rang) { tone(2200, 1800, .05, .05, 'square'); tone(1500, 1300, .07, .04, 'triangle'); }
        if (!o.rang) { o.rang = 1; o.rt = 0; noise(o.p.clone(), .75, 1); }   // the first clatter is loud enough to be heard over the hood
        if (Math.abs(o.v.y) < 6 && Math.hypot(o.v.x, o.v.z) < (roll ? 2 : 4)) { o.st = 'ground'; o.v.set(0, 0, 0); o.rang = 0; } }
      if (o.p.y < -400) { o.st = 'gone'; o.g.visible = false; }
      o.g.position.copy(o.p); o.g.rotation.x += dt * 9; }
    else if (o.st === 'ground') { o.g.rotation.x = 0; o.g.rotation.z = 0; }
  }
  looseUI();
}
// the touch buttons: 用 shows when there's something to pick up or put down; the ability button reads 掟 / 食 while holding
function looseUI() {
  if (!TOUCH || !leader) return; const L = leader, h = looseHeld(L), tu = $('touch'); if (!tu) return;
  const near = !h && (!!looseNear(L) || zipNear(L)); tu.classList.toggle('looseUse', near || !!h); tu.classList.toggle('hold', !!h);
  const lbl = h ? LOOSE_T[h.type].use : ''; if (tu.dataset.hold !== lbl) { tu.dataset.hold = lbl; if (h) tbLabel('tbAct', lbl); else if (typeof refreshTouchLabels === 'function') refreshTouchLabels(); }
}
