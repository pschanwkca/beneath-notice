// =====================================================================
//  GETTING UNSTUCK
//  · the game keeps the last few places you stood safely (on solid ground, room all round you)
//  · wedged inside something solid for a moment → you're put back out by yourself
//  · fallen through a floor or out of the world → straight back to the last safe spot
//  · hold K (touch: tap the 卡住 chip), or 我卡住了 in the pause menu → back to the last safe spot;
//    online you can also go to a teammate instead
//  · each time, the spot is noted (pause menu → 複製位置) so it can be sent in and fixed
// =====================================================================
const UNSTK = { safe: [], t: 0, hold: 0, inT: {}, moveT: 0, ref: null, hint: 0, last: '', shown: '', seq: { n: 0, t: -99, last: null } };
function unstkReset() { UNSTK.safe.length = 0; UNSTK.hold = 0; UNSTK.inT = {}; UNSTK.moveT = 0; UNSTK.ref = null; UNSTK.hint = 0; }
const UN_SKIP = c => c.door || c.y0 < -900 || c.cat || c.noStk;
function unInside(C) {   // the body is inside something solid (not just touching it)
  const x = C.pos.x, z = C.pos.z, r = Math.max(.3, C.r * .45);
  for (const f of [.35, .75]) { const y = C.pos.y + C.h * f; for (const c of colsNear(x, y, z)) { if (UN_SKIP(c) || y < c.y0 + .05 || y > c.y1 - .05) continue; if (c.t === 'b' ? (x > c.x0 + r && x < c.x1 - r && z > c.z0 + r && z < c.z1 - r) : Math.hypot(x - c.x, z - c.z) < c.r - r) return c; } }
  return null;
}
function unRoomy(C) {     // a good place to come back to
  const x = C.pos.x, y = C.pos.y, z = C.pos.z, hy = y + C.h * .55, rr = C.r + 1;
  if (solidAt(x, hy, z) || solidAt(x, y + C.h * .95, z)) return false;
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; if (solidAt(x + Math.cos(a) * rr, hy, z + Math.sin(a) * rr)) return false; }
  const [s, sc] = supportAt(x, z, C.r * .7, y + .6);
  const onFloor = Math.abs(y - zoneFloor(C.pos)) < .8;
  if (!onFloor && (s < y - 1.2 || !sc)) return false;
  if (sc && (sc.small || sc.door || sc.push || sc.cat || resizables.some(r => r.c === sc))) return false;
  return true;
}
function unPlace(C, p) {
  C.pos.copy(p); C.pos.y += .3; C.vel.set(0, 0, 0); C.climbing = false; C.mantle = null; C.zip = null; C.line = null; C.on = null; C.hop = null; C.drop = false; C.pullT = 0; C.tumble = 0; C.ptw = null;
  C.grounded = false; C.queue = []; C.lastTrail = C.pos.clone(); if (C.disp) C.disp.copy(C.pos); UNSTK.inT[C.id] = 0;
}
// where to put a wedged follower: the nearest spot back along the leader's path where it stands clear, on something
function unTrailSpot(C, L) {
  for (let i = trail.length - 1, n = 0; i >= 0 && n < 400; i--, n++) {
    const q = trail[i], d = Math.hypot(q.x - L.pos.x, q.z - L.pos.z); if (d < 3 || q.st === 'climb' || q.st === 'air' || q.st === 'glide') continue; if (d > 60) break;
    if (solidAt(q.x, q.y + C.h * .5, q.z) || solidAt(q.x, q.y + C.h * .95, q.z)) continue;
    const [s] = supportAt(q.x, q.z, C.r * .6, q.y + .6); if (Math.abs(s - q.y) > .8) continue;
    let room = true; for (let k = 0; k < 6 && room; k++) { const a = k * Math.PI / 3; if (solidAt(q.x + Math.cos(a) * C.r, q.y + C.h * .5, q.z + Math.sin(a) * C.r)) room = false; }
    if (room) return V3(q.x, q.y, q.z);
  }
  const a = L.yaw + Math.PI, p = V3(L.pos.x + Math.sin(a) * 4, L.pos.y, L.pos.z + Math.cos(a) * 4);
  return solidAt(p.x, p.y + C.h * .5, p.z) ? L.pos.clone() : p;
}
function unPoof(p) { for (let i = 0; i < 14; i++) emit(V3(p.x, p.y + 2, p.z), V3(R(-14, 14), R(6, 22), R(-14, 14)), new THREE.Color(.55, .95, .92), R(.3, .7), R(.35, .7), 200, 1); tone(520, 880, .12, .04, 'sine'); }
function unNote(C, why) {
  const p = C.pos; UNSTK.last = `${LEVEL} · ${C.id} · ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)} · ${why}`;
  console.info('[unstuck]', UNSTK.last); nlog('卡住：' + UNSTK.last);
}
// back to safety: how = 'key' (asked for), 'wedged', 'fell', 'mate'
function unstuck(how) {
  const L = leader; if (!L || !mine(L) || L.frozen || STATE !== 'play') return false;
  unNote(L, how); const from = L.pos.clone(); let to = null;
  if (how === 'mate') {
    const M = playerChars().filter(C => C !== L && !C.frozen && C.grounded).sort((a, b) => a.pos.distanceTo(from) - b.pos.distanceTo(from))[0];
    if (M) { const a = M.yaw + Math.PI; to = V3(M.pos.x + Math.sin(a) * (M.r + L.r + 2), M.pos.y, M.pos.z + Math.cos(a) * (M.r + L.r + 2)); if (solidAt(to.x, to.y + L.h * .5, to.z)) to = M.pos.clone().add(V3(0, M.h + .5, 0)); }
  }
  let toCp = false;
  if (!to && how === 'key') {
    // asked for: a good spot well away from here; pressed again straight after (still stuck) → one further back each time
    const Q = UNSTK.seq, again = T - Q.t < 30 && Q.last && from.distanceTo(Q.last) < 8; Q.n = again ? Q.n + 1 : 0;
    const cands = UNSTK.safe.filter(s => s.z !== 'portal' && s.p.distanceTo(from) > 8).reverse();
    if (cands[Q.n]) to = cands[Q.n].p.clone();
  } else if (!to && UNSTK.safe.length) to = UNSTK.safe[UNSTK.safe.length - 1].p.clone();
  if (!to && CPS) { const p = CPS[cp] || CPS[0]; to = V3(p[0] + (NET.on ? IDS.indexOf(L.id) * 3 : 0), p[1], p[2]); toCp = true; }
  if (how === 'key') { UNSTK.seq.t = T; UNSTK.seq.last = to ? to.clone() : null; }
  if (!to) return false;
  unPlace(L, to); trail = []; cam.tgt.set(to.x, to.y + L.h * .8, to.z); LP.snap = from.distanceTo(to) > 120;
  // single player: the rest of the party comes along
  if (!NET.on) party.forEach((F, i) => { if (F === L || F.frozen || F.carried || !mine(F)) return; const a = L.yaw + Math.PI + (i % 2 ? .7 : -.7); const p = V3(to.x + Math.sin(a) * (3 + i * 1.4), to.y, to.z + Math.cos(a) * (3 + i * 1.4)); unPlace(F, solidAt(p.x, p.y + F.h * .5, p.z) ? to : p); });
  unPoof(to); UNSTK.hint = 0; UNSTK.moveT = 0;
  toast(how === 'mate' ? '已經去到隊友身邊' : toCp ? '已經送回存檔點' : how === 'fell' ? '跌出了地圖——送回剛才站得穩的位置' : how === 'wedged' ? '卡在東西裡面——已經把你移出來' : UNSTK.seq.n ? '再退後一點——如果仍然卡住，再按一次' : '已經送回剛才站得穩的位置', 2.8);
  return true;
}
function unstuckTick(dt) {
  if (!WORLD || STATE !== 'play') { UNSTK.hold = 0; unChip(); return; }
  const L = leader; if (!L || !mine(L)) { unChip(); return; }
  const free = C => !C.frozen && !C.carried && !C.climbing && !C.mantle && !C.zip && !C.line && !C.caged && !C.on && !C.hop && !C.ptw && !C.roost && !(C.pullT > 0);
  // remember good places to come back to
  UNSTK.t -= dt;
  if (UNSTK.t <= 0 && free(L) && L.grounded && !isBase(L) && LEVEL !== 'portal') {
    UNSTK.t = .4;
    if (unRoomy(L)) { const S = UNSTK.safe, last = S[S.length - 1]; if (!last || last.p.distanceTo(L.pos) > 3) { S.push({ p: L.pos.clone(), z: LEVEL }); if (S.length > 16) S.shift(); } else if (last) last.p.copy(L.pos); }
  }
  // fallen out of the world
  if (L.pos.y < zoneFloor(L.pos) - 45 && !L.climbing) { unstuck('fell'); return; }
  // wedged inside something: everybody you control
  for (const C of party) {
    if (!mine(C) || !free(C)) { UNSTK.inT[C.id] = 0; continue; }
    // (a follower walking the leader's path brushes through tight corners — it's bigger than him — and comes out the
    //  other side: only stuck when it stays inside and stops getting anywhere)
    const c = unInside(C), going = C !== L && C.spd > .5; UNSTK.inT[C.id] = c && !going ? (UNSTK.inT[C.id] || 0) + dt : c ? (UNSTK.inT[C.id] || 0) * .9 : 0;
    if (UNSTK.inT[C.id] > (C === L ? .45 : 1)) {
      if (C === L) { unstuck('wedged'); return; }
      unNote(C, 'wedged'); const p = unTrailSpot(C, L); unPlace(C, p); unPoof(C.pos);
    }
  }
  // pushing on the stick but going nowhere → offer the way out
  const mv = readMove();
  if (mv.m > .3 && free(L) && !L.pushing && !PAUSED && !isBase(L)) {
    if (!UNSTK.ref) { UNSTK.ref = L.pos.clone(); UNSTK.moveT = 0; }
    UNSTK.moveT += dt;
    if (L.pos.distanceTo(UNSTK.ref) > 1.6) { UNSTK.ref.copy(L.pos); UNSTK.moveT = 0; }
    else if (UNSTK.moveT > 2.8 && UNSTK.hint <= 0) UNSTK.hint = 7;
  } else { UNSTK.ref = null; UNSTK.moveT = 0; }
  UNSTK.hint = Math.max(0, UNSTK.hint - dt);
  // hold K
  if (keys.KeyK && !PAUSED && UNSTK.hold >= 0) { UNSTK.hold += dt; if (UNSTK.hold >= .8) { UNSTK.hold = -1; unstuck('key'); } }
  else if (!keys.KeyK) UNSTK.hold = 0;
  unChip();
}
function unChip() {
  const el = $('unstk'); if (!el) return;
  const holding = UNSTK.hold > 0 && STATE === 'play', show = STATE === 'play' && !PAUSED && (holding || UNSTK.hint > 0);
  const sig = show ? (holding ? 'h' + Math.round(UNSTK.hold * 10) : 'hint') : '';
  if (sig === UNSTK.shown) return; UNSTK.shown = sig; el.hidden = !show; if (!show) return;
  el.innerHTML = holding ? `<span>回到安全位置…</span><i class="bar"><i style="width:${Math.min(100, UNSTK.hold / .8 * 100).toFixed(0)}%"></i></i>`
    : TOUCH ? '<span>卡住了？點這裡回到安全位置</span>' : '<span>卡住了？長按 <kbd>K</kbd> 回到安全位置</span>';
}
$('unstk').addEventListener('click', e => { e.stopPropagation(); if (TOUCH || !locked) unstuck('key'); });
// the pause menu
function unPauseRefresh() {
  $('pauseMate').hidden = !NET.on;
  $('pauseStk').hidden = !UNSTK.last; $('pauseStkT').textContent = UNSTK.last;
}
$('pauseStuck').addEventListener('click', () => { resume(); setTimeout(() => unstuck('key'), 60); });
$('pauseMate').addEventListener('click', () => { resume(); setTimeout(() => unstuck('mate'), 60); });
$('pauseStkC').addEventListener('click', () => {
  const t = UNSTK.last; if (!t) return;
  const done = () => { $('pauseStkC').textContent = '已複製'; setTimeout(() => { $('pauseStkC').textContent = '複製位置'; }, 1600); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, () => { const r = document.createRange(); r.selectNodeContents($('pauseStkT')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  else { const r = document.createRange(); r.selectNodeContents($('pauseStkT')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
});
