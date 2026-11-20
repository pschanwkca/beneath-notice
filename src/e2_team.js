
// =====================================================================
//  TEAMWORK
//  疊羅漢, one person at a time:
//   - F next to a teammate: climb onto their head (or onto the top of their tower).
//   - Anyone else walks up and presses F to climb onto the new top, and so on.
//   - The top person faces a ledge and presses W/Space to climb onto it.
//   - Standing on a ledge, F pulls the nearest teammate below up next to you.
//   - The people underneath can't walk away while someone is standing on them.
//  Each character records who it stands on (C.on); its owner keeps it on top of that
//  character every frame, so the same rules work for AI teammates and online players.
//  熊的推: tap left = shove (light things slide, fall off edges, make noise); hold left = keep pushing.
// =====================================================================
let STK = null, shoveCD = 0, stkScanT = 0, stackHintK = null;
const STK_ON = .88, STK_REACH = 1.15, STACK_R = 8;
const easeIO = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
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
function isBase(C) { for (const q of party) if (q.on === C.id && !q.frozen && q !== C) return q; return null; }
function towerBottom(C) { let b = C, g = 0; while (b.on && chars[b.on] && g++ < 9) b = chars[b.on]; return b; }
function towerTop(C) { let t = towerBottom(C), g = 0, k; while ((k = isBase(t)) && g++ < 9) t = k; return t; }
function towerSize(C) { let n = 1, t = towerBottom(C), g = 0, k; while ((k = isBase(t)) && g++ < 9) { n++; t = k; } return n; }
function topPos(B) { return V3(B.pos.x, B.pos.y + B.h * STK_ON, B.pos.z); }
function stkClear() { for (const C of party) { C.on = null; C.hop = null; C.drop = false; C.pullT = 0; } }
function stackPress() {
  const L = leader; if (STATE !== 'play' || L.frozen || !mine(L) || L.hop || L.mantle || L.zip || L.tumble > 0) return;
  if (L.carry) sqDrop(L);
  if (L.on) { stackOff(L); return; }
  if (isBase(L)) { toast('有人企喺你頭上，要佢哋先落嚟'); return; }
  const P = pullTarget(L); if (P) { pullUp(L, P.T, P.hang, P.to); return; }
  let best = null, bd = STACK_R;
  for (const F of party) {
    if (F === L || F.frozen || F.carried || F.hop || F.drop) continue; const b = towerBottom(F); if (b === L) continue;
    const d = Math.hypot(b.pos.x - L.pos.x, b.pos.z - L.pos.z); if (d < bd && Math.abs(b.pos.y - L.pos.y) < 3 && b.state !== 'climb') { bd = d; best = b; }
  }
  if (!best) { toast(`要走近隊友（${STACK_R} 公分內）先可以爬上去`); return; }
  if (towerSize(best) >= 6) { toast('太高了，再疊上去會倒'); return; }
  const top = towerTop(best), to = topPos(top);
  if (solidAt(to.x, to.y + L.h * .9, to.z) || solidAt(to.x, to.y + L.h * .5, to.z)) { toast('上面沒有位置'); return; }
  L.climbing = false; L.vel.set(0, 0, 0); L.crouch = false; L.hop = { kind: 'onto', from: L.pos.clone(), toId: top.id, t: 0, dur: .45 }; SND.swish();
}
function stackOff(C) {
  const b = towerBottom(C); C.on = null; let to = null;
  for (const [a, d] of [[Math.PI, 2.8], [Math.PI / 2, 2.8], [-Math.PI / 2, 2.8], [Math.PI, 4.2], [0, 3]]) { const x = b.pos.x + Math.sin(C.yaw + a) * d, z = b.pos.z + Math.cos(C.yaw + a) * d; if (standable(x, z, b.pos.y, C)) { to = V3(x, b.pos.y, z); break; } }
  C.hop = { kind: 'off', from: C.pos.clone(), to: to || V3(b.pos.x - Math.sin(C.yaw) * 2.5, b.pos.y, b.pos.z - Math.cos(C.yaw) * 2.5), t: 0, dur: .4 }; SND.jump();
}
// from the top of a tower: is there a ledge we can grab?
function ledgeFrom(C) {
  const dirs = [[Math.sin(C.yaw), Math.cos(C.yaw)], [-Math.sin(cam.yaw), -Math.cos(cam.yaw)]];
  for (const [dx, dz] of dirs) {
    const f = stkFace(C.pos.x, C.pos.y - 1, C.pos.z, dx, dz, C.h * 1.4); if (!f || f.t > 5) continue;
    const fx = C.pos.x + dx * f.t, fz = C.pos.z + dz * f.t; const ledge = stkLedge(fx, fz, dx, dz, C.pos.y - C.h * .6, C.pos.y + C.h * STK_REACH, C.h);
    if (ledge === null || ledge > C.pos.y + C.h * STK_REACH || ledge < C.pos.y - C.h * .6) continue;
    for (const k of [C.r + .9, C.r + 1.6, C.r + 2.6]) { const tx = fx + dx * k, tz = fz + dz * k; if (standable(tx, tz, ledge, C)) return { hang: V3(fx - dx * (C.r + .25), Math.max(ledge - C.h * .72, C.pos.y), fz - dz * (C.r + .25)), to: V3(tx, ledge, tz), yaw: Math.atan2(dx, dz) }; }
  }
  return null;
}
// on a ledge: the nearest teammate below that we can reach down to
function pullTarget(L) {
  if (L.on || !L.grounded) return null; let best = null, bd = 6.5;
  for (const T of party) {
    if (T === L || T.frozen || T.hop || T.carried || T.drop || isBase(T)) continue;
    const dy = L.pos.y - T.pos.y; const d = Math.hypot(T.pos.x - L.pos.x, T.pos.z - L.pos.z);
    if (dy < 1.5 || dy > T.h + L.h * 1.6 || d > bd) continue;
    if (standable(T.pos.x, T.pos.z, L.pos.y, T)) continue; // they're not below an edge
    bd = d; best = T;
  }
  if (!best) return null;
  const ux = (L.pos.x - best.pos.x) / (bd || 1), uz = (L.pos.z - best.pos.z) / (bd || 1); let to = null;
  for (const [f, s] of [[1.4, 2.6], [1.4, -2.6], [2.6, 0], [2.4, 4.4], [2.4, -4.4]]) { const x = L.pos.x + ux * f + uz * s, z = L.pos.z + uz * f - ux * s; if (standable(x, z, L.pos.y, best)) { to = V3(x, L.pos.y, z); break; } }
  if (!to) return null;
  return { T: best, to, hang: V3(lerp(best.pos.x, L.pos.x, .4), Math.max(L.pos.y - best.h * .72, best.pos.y), lerp(best.pos.z, L.pos.z, .4)) };
}
function pullUp(L, T, hang, to) {
  L.pullT = .85; L.yaw = Math.atan2(T.pos.x - L.pos.x, T.pos.z - L.pos.z); SND.swish(); tone(190, 150, .14, .045, 'sawtooth');
  if (mine(T)) startPull(T, hang, to); else nsend({ t: 'pull', id: T.id, hang: [hang.x, hang.y, hang.z], to: [to.x, to.y, to.z] }, T.owner);
}
function startPull(T, hang, to) { T.on = null; T.climbing = false; T.mantle = null; T.drop = false; T.vel.set(0, 0, 0); T.hop = { kind: 'pull', from: T.pos.clone(), hang, to, t: 0, dur: .85 }; }
// moves for characters this machine owns: climbing on, stepping off, climbing over an edge, being pulled
function updHops(dt) {
  for (const C of party) {
    const h = C.hop; if (!h || !mine(C)) continue; h.t += dt; const k = Math.min(1, h.t / h.dur);
    if (h.kind === 'onto') {
      const B = chars[h.toId]; if (!B || B.frozen) { C.hop = null; continue; } const to = topPos(B);
      C.pos.lerpVectors(h.from, to, easeIO(k)); C.pos.y += Math.sin(k * Math.PI) * (2.4 + C.h * .3); C.state = 'air'; C.yaw = angDamp(C.yaw, B.yaw, 8, dt);
      if (k >= 1) { C.hop = null; C.on = B.id; C.squash = .45; B.squash = .6; tone(560, 760, .12, .035, 'triangle'); }
    } else if (h.kind === 'off') {
      C.pos.lerpVectors(h.from, h.to, easeIO(k)); C.pos.y += Math.sin(k * Math.PI) * 2.5; C.state = 'air';
      if (k >= 1) { C.hop = null; C.grounded = true; C.vel.set(0, 0, 0); C.squash = .4; C.state = 'idle'; if (C !== leader) { C.queue = []; } }
    } else { // ledge / pull: up to the edge, then over it
      const hang = h.hang; if (k < .5) { C.pos.lerpVectors(h.from, hang, easeIO(k / .5)); C.state = h.kind === 'pull' ? 'hang' : 'climb'; }
      else { const m = (k - .5) / .5; C.pos.lerpVectors(hang, h.to, sstep(0, 1, m)); C.pos.y = lerp(hang.y, h.to.y, Math.min(1, m * 1.7)); C.state = 'climb'; }
      C.spd = 6; if (h.yaw !== undefined) C.yaw = angDamp(C.yaw, h.yaw, 10, dt);
      if (k >= 1) { C.hop = null; C.grounded = true; C.vel.set(0, 0, 0); C.squash = .35; C.state = 'idle'; if (C !== leader) { C.queue = []; } if (C === leader) { trail = []; C.lastTrail.copy(C.pos); } }
    }
    if (C.disp) C.disp.copy(C.pos);
  }
}
// keep stacked characters on top of whoever is under them; drop them if the base is gone
function stackSolve(dt) {
  for (let pass = 0; pass < 3; pass++) for (const C of party) {
    if (!C.on || C.hop || !mine(C)) continue; const B = chars[C.on];
    const bad = !B || !party.includes(B) || B.frozen || B.carried || B.tumble > 0 || B.hop || B.state === 'climb' || Math.hypot(B.pos.x - C.pos.x, B.pos.z - C.pos.z) > 5;
    if (bad) { C.on = null; C.vel.set(R(-14, 14), 22, R(-14, 14)); C.grounded = false; if (C === leader) C.tumble = .6; else C.drop = true; continue; }
    const i = towerSize(C); const sw = Math.sin(T * 2.2 + i) * .08 * i;
    C.pos.set(B.pos.x + Math.cos(B.yaw) * sw, B.pos.y + B.h * STK_ON, B.pos.z - Math.sin(B.yaw) * sw); C.vel.set(0, 0, 0); C.grounded = true; C.climbing = false; C.spd = 0;
    C.state = isBase(C) ? 'stack' : 'top'; if (C.disp) C.disp.copy(C.pos);
  }
  for (const C of party) {
    if (!mine(C) || C.on || C.hop || C.frozen) continue;
    if (isBase(C)) { C.state = 'stack'; C.spd = 0; if (C !== leader) { C.vel.set(0, 0, 0); if (C.disp) C.disp.copy(C.pos); C.offK = 0; } }
    if (C.drop) { // an AI teammate falling off a tower
      C.vel.y -= G * dt; C.pos.addScaledVector(C.vel, dt); const [s] = supportAt(C.pos.x, C.pos.z, C.r * .55, C.pos.y + 2); C.state = 'tumble'; C.tumble = .3;
      if (C.pos.y <= s) { C.pos.y = s; C.vel.set(0, 0, 0); C.drop = false; C.tumble = 0; C.state = 'idle'; C.queue = []; SND.land(.4); }
      if (C.disp) C.disp.copy(C.pos);
    }
    if (C.pullT > 0) { C.pullT -= dt; C.state = 'pull'; }
  }
}
// the leader standing on someone: W/Space climbs a ledge in reach, S (or Space with no ledge) steps off
function stackInput() {
  const L = leader; if (!L.on || L.hop || !mine(L) || STATE !== 'play' || PAUSED) return;
  const mv = readMove(); if (keys.KeyA || keys.KeyD) L.yaw += ((keys.KeyA ? 1 : 0) - (keys.KeyD ? 1 : 0)) * .03;
  if (pressed.Space || mv.y > .5) {
    const g = ledgeFrom(L);
    if (g) { L.on = null; L.hop = { kind: 'ledge', from: L.pos.clone(), hang: g.hang, to: g.to, yaw: g.yaw, t: 0, dur: .6 }; SND.swish(); return; }
    if (pressed.Space) stackOff(L);
  } else if (pressed.KeyS || mv.y < -.5) stackOff(L);
}
function stackScan(dt) {
  stkScanT -= dt; if (stkScanT > 0) return; stkScanT = .3; stackHintK = null;
  const L = leader; if (STATE !== 'play' || party.length < 2 || L.frozen || !mine(L)) return;
  if (L.on) { stackHintK = ledgeFrom(L) ? { k: 'reach' } : { k: 'short' }; return; }
  if (isBase(L)) { stackHintK = { k: 'base' }; return; }
  const P = pullTarget(L); if (P) { stackHintK = { k: 'pull', n: P.T.S.name }; return; }
  if (L.overhang > 0) { stackHintK = { k: 'over' }; return; }
  if (!L.grounded) return;
  let near = null; for (const F of party) { if (F === L || F.frozen || F.hop) continue; const b = towerBottom(F); if (b !== L && Math.hypot(b.pos.x - L.pos.x, b.pos.z - L.pos.z) < STACK_R && Math.abs(b.pos.y - L.pos.y) < 3) { near = towerTop(F); break; } }
  if (near) { const f = stkFace(L.pos.x, L.pos.y, L.pos.z, Math.sin(L.yaw), Math.cos(L.yaw), 14); if ((f && f.t < 6) || near.on) stackHintK = { k: 'climb', n: near.S.name }; }
}
function stackHintText() {
  const H = stackHintK; if (!H) return ''; const F = TOUCH ? '按「疊」' : '<kbd>F</kbd>';
  if (H.k === 'reach') return TOUCH ? '推搖桿向前爬上去 · 向後拉落返地下' : '<kbd>W</kbd> 爬上去 · <kbd>S</kbd> 落返地下';
  if (H.k === 'short') return NET.on ? '夠唔到——叫隊友走過來按 F 疊上你頭頂' : (TOUCH ? '夠唔到——點頭像換另一隻角色，走過來按「疊」疊上去' : '夠唔到——<kbd>Tab</kbd> 換另一隻角色，走過來按 <kbd>F</kbd> 疊上去');
  if (H.k === 'base') return '有人企喺你頭上，暫時郁唔到';
  if (H.k === 'pull') return `${F} 拉${H.n}上來`;
  if (H.k === 'over') return `上面凸出來爬不過去 · 走近隊友${F}疊羅漢`;
  if (H.k === 'climb') return `${F} 爬上${H.n}頭頂（疊羅漢）`;
  return '';
}
// ---------- bear: shove / push ----------
function pushTarget(C) {
  const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw); let best = null, bd = 1e9;
  for (const r of resizables) {
    if (!r.c.push || r.gone) continue; const c = r.c;
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
  if (NET.client) nsend({ t: 'shv', i: resizables.indexOf(r), vx: fx * v, vz: fz * v }, NET.hostId); else shoveRes(r, fx * v, fz * v); SND.push(); SND.thud(.12); cam.shake = Math.max(cam.shake, .12);
  const p = V3(clamp(C.pos.x, r.c.x0, r.c.x1), C.pos.y + 1, clamp(C.pos.z, r.c.z0, r.c.z1));
  for (let i = 0; i < 8; i++) emit(p, V3(R(-6, 6) + fx * 8, R(2, 8), R(-6, 6) + fz * 8), new THREE.Color(.3, .27, .24), R(.2, .45), R(.3, .6), 30, 2);
}
function shoveRes(r, vx, vz) { r.svx = (r.svx || 0) + vx; r.svz = (r.svz || 0) + vz; if (r === LIV.wedge) LIV.loose = true; }
function slideFree(c, dx, dz) { const nb = [c.x0 + dx, c.x1 + dx, c.z0 + dz, c.z1 + dz, c.y0 + .05, c.y1]; for (const o of colsNear((c.x0 + c.x1) / 2, c.y0 + .1, (c.z0 + c.z1) / 2)) { if (o === c || o.y1 <= nb[4] || o.y0 >= nb[5]) continue; const b = colBounds(o); if (b[1] > nb[0] && b[0] < nb[1] && b[5] > nb[2] && b[4] < nb[3]) return false; } return true; }
function bearHold(dt) { shoveCD = Math.max(0, shoveCD - dt); const L = leader; if (L && L.id === 'bear' && mine(L) && !L.frozen && pushHeld() && shoveCD <= 0 && !(Math.hypot(L.vel.x, L.vel.z) > 2 && L.pushing)) bearShove(); }
function updSlides(dt) {
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
