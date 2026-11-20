
// =====================================================================
//  TEAMWORK
//  疊羅漢: teammates stand on each other's heads (tallest at the bottom, you on top).
//          You climb onto the ledge, then whoever arrived last reaches down and pulls the next one up.
//  熊的推: tap left = shove (light things slide, fall off edges, make noise); hold left = keep pushing.
// =====================================================================
let STK = null, stkScanT = 0, stkHintK = 0, shoveCD = 0;
const STK_ON = .88, STK_REACH = 1.15;
const easeIO = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
function stkFeet(list, n) { let y = 0; for (let i = 0; i < n - 1; i++) y += list[i].h * STK_ON; return y; }
function stkReach(list) { return stkFeet(list, list.length) + list[list.length - 1].h * STK_REACH; }
// nearest solid face in front of (px,pz), scanned from the feet up to maxH
function stkFace(px, py, pz, dx, dz, maxH) {
  let best = 1e9, foot = 1e9;
  for (let h = .5; h <= maxH; h += .9) {
    for (let t = .2; t < Math.min(best, 9.5); t += .3) {
      const c = solidAt(px + dx * t, py + h, pz + dz * t);
      if (c && !c.cat) { if (t < best) best = t; if (h < 1.6 && t < foot) foot = t; break; }
    }
  }
  return best < 1e9 ? { t: best, foot } : null;
}
// first standable top in the column just behind the face
function stkLedge(fx, fz, dx, dz, y0, maxY, topH) {
  const qx = fx + dx * .9, qz = fz + dz * .9; let y = y0 + .3, c = null;
  while (y < maxY + .6) { c = solidAt(qx, y, qz); if (c) break; y += .4; }
  if (!c) return null;
  let top = c.y1; for (let i = 0; i < 12; i++) { const c2 = solidAt(qx, top + .15, qz); if (!c2) break; top = c2.y1; }
  if (solidAt(qx, top + topH * .5, qz) || solidAt(qx, top + topH * .9, qz)) return null;
  return top;
}
function standable(x, z, y, C) { const [s] = supportAt(x, z, C.r * .55, y + .4); return Math.abs(s - y) < .45 && !solidAt(x, y + C.h * .5, z) && !solidAt(x, y + C.h * .9, z); }
function stkPlan(L, quiet) {
  const near = party.filter(F => F !== L && !F.frozen && !F.carried && !(F.lieK > 0) && Math.hypot(F.pos.x - L.pos.x, F.pos.z - L.pos.z) < 70);
  if (!near.length) return { err: '身邊沒有隊友，疊不了羅漢' };
  near.sort((a, b) => b.h - a.h);
  const all = [...near, L]; const maxH = stkReach(all);
  const [gy] = supportAt(L.pos.x, L.pos.z, L.r * .55, L.pos.y + .05); const py = L.climbing ? gy : L.pos.y;
  const dirs = []; if (L.climbing) dirs.push([-L.climbN.x, -L.climbN.z]);
  dirs.push([Math.sin(L.yaw), Math.cos(L.yaw)]); if (!quiet) dirs.push([-Math.sin(cam.yaw), -Math.cos(cam.yaw)]);
  const rb = near[0].r;
  // if we're under an overhang, step back out until nothing hangs over the tower's spot
  const colClear = (x, z) => { for (const c of cols) { if (c.cat || c.y1 <= py + .6 || c.y0 >= py + maxH) continue; if (xzHit(c, x, z, rb * .85, _h)) return false; } return true; };
  let face = null, d = null, ox = 0, oz = 0;
  for (const [dx, dz] of dirs) {
    let back = -1; for (let k = 0; k <= 10; k += .4) if (colClear(L.pos.x - dx * k, L.pos.z - dz * k)) { back = k; break; }
    if (back < 0) continue;
    const px = L.pos.x - dx * back, pz = L.pos.z - dz * back; const f = stkFace(px, py, pz, dx, dz, maxH);
    if (f && f.t - back < (quiet ? 4 : 7)) { face = f; d = [dx, dz]; ox = px; oz = pz; break; }
  }
  if (!face) return { err: '要面向牆壁或檯邊，才可以疊羅漢' };
  const fx = ox + d[0] * face.t, fz = oz + d[1] * face.t;
  let bx = fx - d[0] * (rb + .3), bz = fz - d[1] * (rb + .3);
  let [by] = supportAt(bx, bz, rb * .55, py + 1.2); if (by < py - 3) { bx = L.pos.x; bz = L.pos.z; by = py; }
  const ledge = stkLedge(fx, fz, d[0], d[1], by, by + maxH, L.h);
  // how many people does this need? (fewest that reach)
  let n = all.length, ok = false;
  if (ledge !== null) for (let k = 2; k <= all.length; k++) { const sub = [...near.slice(0, k - 1), L]; if (stkReach(sub) >= ledge - by) { n = k; ok = true; break; } }
  let mem = [...near.slice(0, n - 1), L];
  // a ceiling above the tower makes it shorter
  let ceilY = 1e9; for (const c of cols) { if (c.y0 < by + .5 || c.y0 > ceilY || c.cat) continue; if (xzHit(c, bx, bz, rb * .8, _h)) ceilY = c.y0; }
  while (mem.length > 2 && by + stkFeet(mem, mem.length) + L.h > ceilY) { mem.splice(mem.length - 2, 1); ok = false; }
  let tgt = null;
  if (ok) for (const k of [L.r + .9, L.r + 1.6, L.r + 2.6, L.r + 4]) { const tx = fx + d[0] * k, tz = fz + d[1] * k; if (standable(tx, tz, ledge, L)) { tgt = V3(tx, ledge, tz); break; } }
  if (!tgt) ok = false;
  const short = ledge !== null ? Math.max(0, ledge - by - stkReach(all)) : null;
  return { mem, extras: ok ? near.filter(F => !mem.includes(F)) : [], d, fx, fz, bx, by, bz, ledge, tgt, ok, short, overhang: face.foot - face.t > .8 };
}
function stkSlot(i) {
  const S = STK, m = S.mem; const y = S.by + stkFeet(m, i + 1); const sw = Math.sin(T * 2.2 + .6) * .1 * i * (1 + S.wob * 5), fw = Math.sin(T * 1.7) * .05 * i * (1 + S.wob * 5);
  return V3(S.bx + S.d[1] * sw + S.d[0] * fw, y, S.bz - S.d[0] * sw + S.d[1] * fw);
}
function stkStart() {
  const L = leader;
  if (STK) { if (STK.phase === 'ready') stkDown(); return; }
  if (STATE !== 'play' || L.mantle || L.tumble > 0 || L.frozen || L.zip) return;
  if (L.carry) sqDrop(L);
  const P = stkPlan(L, false); if (P.err) { toast(P.err); return; }
  STK = Object.assign(P, { phase: 'gather', t: 0, wob: 0, lock: true, yaw: Math.atan2(P.d[0], P.d[1]), from: P.mem.map(C => (C !== L && C.disp ? C.disp : C.pos).clone()) });
  for (const C of P.extras) if (C.disp) C.pos.copy(C.disp);
  for (const C of STK.mem) { C.stk = true; C.climbing = false; C.mantle = null; C.vel.set(0, 0, 0); C.crouch = false; C.tumble = 0; }
  for (const C of STK.extras) C.stk = true;
  SND.swish();
  if (STK.ok && STK.mem.length < party.length) say(L.S.name, STK.mem.length === 2 ? '來，我踩你膊頭上去！' : `要${STK.mem.length}個人疊才夠高，大家來！`, L.S.col, 2.2);
}
function stkDown(collapse) {
  const S = STK; if (!S) return; const L = leader; S.phase = collapse ? 'collapse' : 'down'; S.t = 0; S.lock = false;
  const sd = [S.d[1], -S.d[0]];
  S.drop = S.mem.filter(C => C !== L).map((C, i) => {
    const sgn = i % 2 ? 1 : -1; let gx, gz, ok = false;
    for (let a = 0; a < 6 && !ok; a++) { const back = collapse ? R(3, 9) : 2.6 + i * 1.3, side = collapse ? R(-7, 7) : sgn * (2 + i * 1.6); gx = S.bx - S.d[0] * back + sd[0] * side; gz = S.bz - S.d[1] * back + sd[1] * side; const [gy] = supportAt(gx, gz, C.r * .55, S.by + 2); ok = Math.abs(gy - S.by) < 2 && !solidAt(gx, gy + C.h * .5, gz); }
    if (!ok) { gx = S.bx - S.d[0] * 3; gz = S.bz - S.d[1] * 3; }
    const [gy] = supportAt(gx, gz, C.r * .55, S.by + 2);
    return { C, from: C.pos.clone(), to: V3(gx, gy, gz), delay: collapse ? R(0, .12) : (S.mem.length - 2 - i) * .12, dur: collapse ? R(.5, .75) : .45 };
  });
  // the leader goes back to normal physics
  L.stk = false; L.grounded = false;
  if (collapse) { L.vel.set(-S.d[0] * R(14, 26) + R(-10, 10), R(22, 34), -S.d[1] * R(14, 26) + R(-10, 10)); L.tumble = .8; SND.land(1); tone(700, 220, .5, .05, 'triangle'); }
  else { L.vel.set(-S.d[0] * 13, 26, -S.d[1] * 13); SND.jump(); }
  trail = []; L.lastTrail.copy(L.pos);
}
function stkEnd() {
  const S = STK; if (!S) return; const L = leader;
  for (const C of [...S.mem, ...S.extras]) { C.stk = false; C.tumble = C === L ? C.tumble : 0; if (C !== L) { C.queue = []; C.qst = 'idle'; C.state = 'idle'; C.disp.copy(C.pos); C.offK = 0; C.vel.set(0, 0, 0); } }
  trail = []; L.lastTrail.copy(L.pos); STK = null; refreshPartyHUD();
}
function stkClear() { STK = null; for (const C of party) C.stk = false; }
function stkEdge(C, out) { const S = STK; const k = out ? -(C.r + .25) : C.r * .65; return V3(S.fx + S.d[0] * k, out ? S.ledge - C.h * .72 : S.ledge, S.fz + S.d[1] * k); }
function stkLedgeSlots() {
  const S = STK, L = leader, sd = [S.d[1], -S.d[0]]; const slots = new Map(); slots.set(L, S.tgt.clone());
  const others = [...S.mem, ...S.extras].filter(C => C !== L); const offs = [[1.2, 3.4], [1.2, -3.4], [3.4, 0], [3.2, 6.6], [3.2, -6.6]];
  others.forEach((C, i) => {
    let p = null; for (const [f, s] of offs) { const x = S.tgt.x + S.d[0] * f + sd[0] * s, z = S.tgt.z + S.d[1] * f + sd[1] * s; if (standable(x, z, S.ledge, C) && ![...slots.values()].some(q => Math.hypot(q.x - x, q.z - z) < 2.4)) { p = V3(x, S.ledge, z); break; } }
    slots.set(C, p || S.tgt.clone().addScaledVector(V3(S.d[0], 0, S.d[1]), 1 + i));
  });
  return slots;
}
function updStack(dt) {
  const S = STK; S.t += dt; const L = leader; const n = S.mem.length;
  const face = (C, yaw) => { C.yaw = angDamp(C.yaw, yaw, 12, dt); };
  if (S.phase === 'gather') {
    let done = true;
    S.mem.forEach((C, i) => {
      const t0 = i * .26, k = clamp((S.t - t0) / .42, 0, 1); if (k < 1) done = false;
      const to = stkSlot(i); const e = easeIO(k);
      C.pos.lerpVectors(S.from[i], to, e); if (i > 0) C.pos.y += Math.sin(k * Math.PI) * (2.4 + C.h * .3);
      C.state = k <= 0 ? 'idle' : k < 1 ? (i === 0 ? 'walk' : 'air') : (i < n - 1 ? 'stack' : 'top'); C.spd = i === 0 && k < 1 ? 10 : 0;
      if (k > 0) face(C, S.yaw);
      if (k >= 1 && !C.arrived) { C.arrived = true; C.squash = .45; if (i > 0) { S.mem[i - 1].squash = .6; tone(480 + i * 140, 620 + i * 160, .12, .035, 'triangle'); } }
    });
    if (done) { S.mem.forEach(C => C.arrived = false); S.phase = 'ready'; S.t = 0; if (!S.ok) toast(S.ledge === null ? '上面沒有可以站的地方……' : `太高了！疊到最高還差 ${Math.ceil(S.short)} 公分`, 3); }
  } else if (S.phase === 'ready') {
    S.wob = S.ok ? damp(S.wob, .04, 2, dt) : Math.min(1, S.wob + dt * .75);
    S.mem.forEach((C, i) => { C.pos.copy(stkSlot(i)); C.state = i < n - 1 ? 'stack' : 'top'; C.spd = 0; face(C, S.yaw); });
    const mv = readMove();
    if (!S.ok) { if (S.t > 1.5) { stkDown(true); toast('疊羅漢倒塌了！', 2); } }
    else if (pressed.Space || mv.y > .5 || keys.KeyW) { S.phase = 'climb'; S.t = 0; S.cfrom = L.pos.clone(); SND.swish(); S.slots = stkLedgeSlots(); }
    else if (pressed.KeyS || mv.y < -.5) stkDown(false);
    else if (S.t > 9) stkDown(false);
  } else if (S.phase === 'climb') {
    // the top one grabs the edge and hauls up
    for (let i = 0; i < n - 1; i++) { S.mem[i].pos.copy(stkSlot(i)); S.mem[i].state = 'stack'; }
    const k = clamp(S.t / .5, 0, 1); const hang = stkEdge(L, true); hang.y = Math.max(hang.y, S.cfrom.y);
    if (k < .45) { L.pos.lerpVectors(S.cfrom, hang, easeIO(k / .45)); L.state = 'climb'; L.spd = 6; }
    else { const m = (k - .45) / .55; L.pos.lerpVectors(hang, S.tgt, sstep(0, 1, m)); L.pos.y = lerp(hang.y, S.tgt.y, Math.min(1, m * 1.7)); L.state = 'climb'; L.spd = 6; }
    face(L, S.yaw);
    if (k >= 1) {
      L.squash = .35; L.state = 'idle'; S.phase = 'pull'; S.t = 0;
      S.queue = [...S.mem.slice(0, n - 1).reverse(), ...S.extras]; S.puller = L; S.cur = null;
      say(L.S.name, S.queue.length ? '上來了！我拉你們上來！' : '上來了！', L.S.col, 1.8);
    }
  } else if (S.phase === 'pull') {
    // still-waiting tower members keep standing
    const left = S.queue.filter(C => C !== S.cur); for (const C of S.mem) if (C !== L && left.includes(C) && S.mem.indexOf(C) < n - 1) { const i = S.mem.indexOf(C); const top = Math.max(...left.filter(q => S.mem.includes(q)).map(q => S.mem.indexOf(q))); C.pos.copy(stkSlot(i)); C.state = i < top ? 'stack' : 'top'; face(C, S.yaw); }
    for (const C of S.extras) if (left.includes(C) && C !== S.cur) { C.state = 'idle'; face(C, S.yaw); }
    if (!S.cur) {
      if (!S.queue.length) { // everyone is up: walk to spots
        const P = S.puller, sp = S.slots.get(P); if (!S.pend) S.pend = P.pos.clone(); S.t2 = (S.t2 || 0) + dt; const k = clamp(S.t2 / .35, 0, 1); P.pos.lerpVectors(S.pend, sp, easeIO(k)); P.state = k < 1 ? 'walk' : 'idle'; P.spd = k < 1 ? 8 : 0;
        if (k >= 1) { L.grounded = true; L.vel.set(0, 0, 0); for (const C of party) C.stk = false; stkEnd(); }
        return;
      }
      S.cur = S.queue.shift(); S.t = 0; S.pA = S.puller.pos.clone(); S.cA = S.cur.pos.clone(); S.pE = stkEdge(S.puller, false); S.cH = stkEdge(S.cur, true); S.cH.y = Math.max(S.cH.y, Math.min(S.cA.y, S.ledge - .5)); SND.swish();
    }
    const P = S.puller, C = S.cur, t = S.t;
    // puller: step to the edge, kneel, reach down; afterwards walk to its spot
    if (t < .25) { P.pos.lerpVectors(S.pA, S.pE, easeIO(t / .25)); P.state = 'walk'; P.spd = 6; face(P, S.yaw + Math.PI); }
    else if (t < .85) { P.pos.copy(S.pE); P.state = 'pull'; P.spd = 0; face(P, S.yaw + Math.PI); }
    else { const k = clamp((t - .85) / .35, 0, 1); P.pos.lerpVectors(S.pE, S.slots.get(P), easeIO(k)); P.state = k < 1 ? 'walk' : 'idle'; P.spd = k < 1 ? 8 : 0; face(P, k < 1 ? Math.atan2(S.slots.get(P).x - S.pE.x, S.slots.get(P).z - S.pE.z) : S.yaw); }
    // the one being pulled: grabbed, lifted to the edge, then hauled over
    if (t < .2) { C.state = S.mem.includes(C) ? 'top' : 'idle'; }
    else if (t < .78) { const k = (t - .2) / .58; C.pos.lerpVectors(S.cA, S.cH, easeIO(k)); C.state = 'hang'; face(C, S.yaw); if (t - dt < .3 && t >= .3) tone(190, 150, .14, .045, 'sawtooth'); }
    else { const k = clamp((t - .78) / .38, 0, 1); const E = stkEdge(C, false); C.pos.lerpVectors(S.cH, E, sstep(0, 1, k)); C.pos.y = lerp(S.cH.y, E.y, Math.min(1, k * 1.7)); C.state = 'climb'; C.spd = 6; face(C, S.yaw);
      if (k >= 1) { C.squash = .35; C.state = 'pull'; S.puller = C; S.cur = null; S.t = 0; S.pend = null; S.t2 = 0; } }
  } else { // down / collapse: followers drop to the ground; the leader is already free
    let done = true;
    for (const q of S.drop) {
      const k = clamp((S.t - q.delay) / q.dur, 0, 1); if (k < 1) done = false; const C = q.C;
      C.pos.lerpVectors(q.from, q.to, S.phase === 'collapse' ? k : easeIO(k)); C.pos.y += Math.sin(k * Math.PI) * (S.phase === 'collapse' ? 5 : 3);
      C.state = k < 1 ? (S.phase === 'collapse' ? 'tumble' : 'air') : 'idle'; C.tumble = S.phase === 'collapse' && k < 1 ? .5 : 0;
      if (k >= 1 && !q.landed) { q.landed = true; C.squash = .7; if (S.phase === 'collapse') SND.land(.5); }
    }
    if (done && S.t > .3) stkEnd();
  }
  for (const C of [...S.mem, ...S.extras]) if (C !== L && C.disp) C.disp.copy(C.pos);
}
// context scan: offer F when there is an overhang you can't climb past
function stkScan(dt) {
  stkScanT -= dt; if (stkScanT > 0) return; stkScanT = .35; stkHintK = 0;
  const L = leader; if (STK || STATE !== 'play' || party.length < 2) return;
  if (L.overhang > 0) { stkHintK = 2; return; }
  if (!L.grounded) return;
  const P = stkPlan(L, true); if (P.err) return;
  if (P.ok && (P.overhang || P.ledge - P.by > 12)) stkHintK = 1;
}
function stkHintText() {
  const S = STK; if (!S) return '';
  if (S.phase === 'ready' && S.ok) return TOUCH ? '推搖桿向前（或按「跳」）爬上去 · 向後拉就散開' : '<kbd>W</kbd> 或 <kbd>Space</kbd> 爬上去 · <kbd>S</kbd> 散開';
  if (S.phase === 'pull') return '拉隊友上來中……';
  return '';
}

// ---------- bear: shove / push ----------
function pushTarget(C) {
  const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw); let best = null, bd = 1e9;
  for (const r of resizables) {
    if (!r.c.push) continue; const c = r.c;
    if (c.y0 > C.pos.y + C.h * .8 || c.y1 < C.pos.y + .3) continue;
    const qx = clamp(C.pos.x, c.x0, c.x1), qz = clamp(C.pos.z, c.z0, c.z1); const dx = qx - C.pos.x, dz = qz - C.pos.z; const d = Math.hypot(dx, dz);
    if (d > C.r + 3.2) continue; if (d > .01 && (dx * fx + dz * fz) / d < .3) continue;
    if (d < bd) { bd = d; best = r; }
  }
  return best;
}
function pushHeld() { return !!(keys.Mouse0 || keys.TPush); }
function bearShove() {
  const C = leader; if (!C || C.id !== 'bear' || STK || C.climbing || C.mantle || shoveCD > 0 || STATE !== 'play') return;
  shoveCD = .5; C.shoveT = .38;
  const r = pushTarget(C);
  if (!r) { SND.push(); if (!C.noPushT || T - C.noPushT > 6) { C.noPushT = T; toast('前面沒有推得動的東西'); } return; }
  const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw); const vol = r.sx * r.sy * r.sz * r.s ** 3;
  const v = clamp(70 / Math.cbrt(Math.max(1, vol / 60)), 6, 48);
  r.svx = (r.svx || 0) + fx * v; r.svz = (r.svz || 0) + fz * v; SND.push(); SND.thud(.12); cam.shake = Math.max(cam.shake, .12);
  const p = V3(clamp(C.pos.x, r.c.x0, r.c.x1), C.pos.y + 1, clamp(C.pos.z, r.c.z0, r.c.z1));
  for (let i = 0; i < 8; i++) emit(p, V3(R(-6, 6) + fx * 8, R(2, 8), R(-6, 6) + fz * 8), new THREE.Color(.3, .27, .24), R(.2, .45), R(.3, .6), 30, 2);
}
function slideFree(c, dx, dz) { const nb = [c.x0 + dx, c.x1 + dx, c.z0 + dz, c.z1 + dz, c.y0 + .05, c.y1]; for (const o of cols) { if (o === c || o.y1 <= nb[4] || o.y0 >= nb[5]) continue; const b = colBounds(o); if (b[1] > nb[0] && b[0] < nb[1] && b[5] > nb[2] && b[4] < nb[3]) return false; } return true; }
function updSlides(dt) {
  shoveCD = Math.max(0, shoveCD - dt);
  const L = leader; if (L && L.id === 'bear' && pushHeld() && shoveCD <= 0 && !(Math.hypot(L.vel.x, L.vel.z) > 2 && L.pushing)) bearShove();
  for (const r of resizables) {
    if (!r.svx && !r.svz) continue; const c = r.c;
    const dx = r.svx * dt, dz = r.svz * dt;
    if (dx && slideFree(c, dx, 0)) { r.cx += dx; applyResize(r); } else r.svx = 0;
    if (dz && slideFree(c, 0, dz)) { r.cz += dz; applyResize(r); } else r.svz = 0;
    const k = Math.exp(-(r.vy ? .4 : 5.5) * dt); r.svx *= k; r.svz *= k;
    if (Math.hypot(r.svx, r.svz) < .6) { r.svx = 0; r.svz = 0; }
    if (!r.vy && rnd() < dt * 10) emit(V3(r.cx, r.y0 + .2, r.cz), V3(R(-3, 3), R(1, 3), R(-3, 3)), new THREE.Color(.28, .25, .22), R(.15, .3), R(.3, .5), 20, 2);
  }
}
