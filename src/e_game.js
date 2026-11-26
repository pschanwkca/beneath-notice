
// ---------- audio (procedural, starts on first click) ----------
const AU = { ctx: null };
function audioInit() {
  if (AU.ctx) { AU.ctx.resume?.(); return; }
  try {
    const C = new (window.AudioContext || window.webkitAudioContext)(); AU.ctx = C; AU.out = C.createGain(); AU.out.gain.value = .85 * SET.vol; AU.out.connect(C.destination);
    const nb = C.createBuffer(1, C.sampleRate * 2, C.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; AU.noise = nb;
    const o1 = C.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 55; const o2 = C.createOscillator(); o2.frequency.value = 110.6;
    const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 230; const hg = C.createGain(); hg.gain.value = .03; o1.connect(lp); o2.connect(lp); lp.connect(hg); hg.connect(AU.out); o1.start(); o2.start(); AU.hum = hg;
    const ns = C.createBufferSource(); ns.buffer = nb; ns.loop = true; const bp = C.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 380; const ng = C.createGain(); ng.gain.value = .025; ns.connect(bp); bp.connect(ng); ng.connect(AU.out); ns.start();
  } catch (e) { AU.ctx = null; }
}
function nz(dur, f, q, vol, type = 'bandpass', when = 0) {
  const C = AU.ctx; if (!C || vol < .0005) return; const t = C.currentTime + when; const s = C.createBufferSource(); s.buffer = AU.noise;
  const fl = C.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = C.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(fl); fl.connect(g); g.connect(AU.out); s.start(t, Math.random() * 1.5); s.stop(t + dur + .05);
}
function tone(f0, f1, dur, vol, type = 'sine', when = 0) {
  const C = AU.ctx; if (!C || vol < .0005) return; const t = C.currentTime + when; const o = C.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); const g = C.createGain();
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(AU.out); o.start(t); o.stop(t + dur + .05);
}
const SND = {
  step: v => nz(.045, 5200, 1.4, .045 * v),
  jump: () => tone(420, 700, .11, .035, 'triangle'),
  land: v => nz(.12, 900, .8, .1 * v, 'lowpass'),
  thud: v => { tone(68, 36, .38, .55 * v); nz(.28, 200, .7, .4 * v, 'lowpass'); },
  creak: () => { const C = AU.ctx; if (!C) return; const t = C.currentTime; const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); for (let i = 0; i < 14; i++) o.frequency.linearRampToValueAtTime(90 + Math.random() * 60, t + i * .1); const f = C.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 760; f.Q.value = 6; const g = C.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.09, t + .1); g.gain.exponentialRampToValueAtTime(.0001, t + 1.5); o.connect(f); f.connect(g); g.connect(AU.out); o.start(t); o.stop(t + 1.6); },
  zapUp: () => { tone(260, 1500, .35, .06, 'square'); nz(.45, 3200, 2, .05); },
  zapDn: () => { tone(1500, 200, .35, .06, 'square'); nz(.45, 1800, 2, .05); },
  pick: () => { [880, 1175, 1568, 2093].forEach((f, i) => tone(f, f, .3, .05, 'sine', i * .07)); },
  crack: v => nz(.07, 2600, 3, .1 * v),
  heart: v => { tone(62, 44, .13, .3 * v); tone(60, 42, .13, .24 * v, 'sine', .17); },
  snap: () => { nz(.06, 3000, 1, .35, 'highpass'); tone(220, 70, .16, .18, 'square'); },
  push: () => nz(.16, 260, .8, .07, 'lowpass'),
  swish: () => nz(.3, 1400, .5, .04),
  sw: () => tone(520, 760, .12, .04, 'sine'),
  clang: v => { tone(900, 700, .5, .12 * v, 'triangle'); tone(1460, 1200, .4, .06 * v, 'sine'); nz(.3, 3000, 1.5, .15 * v); },
  meow: () => { tone(560, 820, .18, .08, 'sawtooth'); tone(820, 420, .45, .07, 'sawtooth', .16); },
  sizzle: () => nz(.5, 5000, .8, .08, 'highpass'),
  drip: () => tone(1500, 700, .07, .05, 'sine')
};

// ---------- input ----------
const keys = {}; let pressed = {};
let mouseDX = 0, mouseDY = 0, locked = false, dragMode = false, dragDist = 0, mbtn = -1, PAUSED = false;
addEventListener('keydown', e => {
  if (['Tab', 'Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
  if (!keys[e.code]) pressed[e.code] = true; keys[e.code] = true;
  if (e.code === 'Escape' && dragMode && (STATE === 'play' || STATE === 'intro')) { PAUSED ? resume() : pause(); }
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
function requestLock() {
  if (dragMode || TOUCH) return;
  // the film ending on its own isn't a click: asking then would fail and switch the game to drag-to-look for good
  if (STATE === 'cine' && !(navigator.userActivation && navigator.userActivation.isActive)) return;
  try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { dragMode = true; }); } catch (e) { dragMode = true; }
}
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  if (!locked && VC.chat) { chatClose(false); return; }   // Esc while typing only closes the chat box
  if (!locked && (STATE === 'play' || STATE === 'intro') && !PAUSED && !dragMode && performance.now() - VC.chatShut > 400) pause();
});
document.addEventListener('pointerlockerror', () => { dragMode = true; });
addEventListener('mousemove', e => {
  if (locked) { mouseDX += e.movementX; mouseDY += e.movementY; }
  else if (dragMode && mbtn >= 0) { mouseDX += e.movementX; mouseDY += e.movementY; dragDist += Math.abs(e.movementX) + Math.abs(e.movementY); }
});
canvas.addEventListener('mousedown', e => {
  if (STATE !== 'play' || PAUSED) return;
  if (locked) { primaryDown(e.button); return; }
  if (!dragMode) { requestLock(); return; }
  mbtn = e.button; dragDist = 0;
});
addEventListener('mouseup', e => { if (e.button === 0) keys.Mouse0 = false; if (e.button === 2) keys.Mouse2 = false; if (dragMode && mbtn >= 0 && dragDist < 6 && STATE === 'play') { primaryDown(mbtn); keys.Mouse0 = false; } mbtn = -1; });
function primaryDown(btn) { const L = leader; if (!L) return; if (L.id === 'bear') { if (btn === 0) { keys.Mouse0 = true; bearShove(); } else if (btn === 2) keys.Mouse2 = true; return; } if (L.id === 'cham') { if (btn === 0) chamTongue(); return; } if (L.id === 'sq') { if (btn === 0) sqCarry(); else if (btn === 2) sqScout(); return; } if (L.id === 'hog') { if (btn === 0) hogRoll(); return; } if (L.id === 'coon') { if (btn === 0) coonThrow(); return; } if (L.id === 'rab' || L.id === 'frog') { if (btn === 0) { if (!POUCH.open) keys.Mouse0 = true; } else if (btn === 2 && L.id === 'frog') frogSwitch(); else if (btn === 2) pouchDown(); return; } if (L.id === 'bat') { if (btn === 0) batPing(); return; } if (L.id === 'tort') { if (btn === 0) tortShell(); return; } if (L.id === 'mole') { if (btn === 0) moleDig(); return; } fireGun(btn === 0); }
canvas.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('wheel', e => { cam.dist = clamp(cam.dist + e.deltaY * .012, 8, 42); }, { passive: true });

// ---------- game state ----------
let CPS, QUESTS, STATE = 'load', T = 0, playT = 0, leader = null, meter = 0, fails = 0, quest = 0, cp = 0, gotBat = 0, cells = 3, cellMax = 3, cellT = 0, introT = 0, failT = 0, endT = 0, QUAL = 'high', hudOn = true;
let trail = [], PORTRAITS = {};
const cam = { yaw: .55, pitch: .22, dist: 15, tgt: V3(), curD: 15, shake: 0 };
const CPS_B = [[-22, 92, -192], [0, 21, -206], [125, 0, -150], [236, 0, 232], [-282, 0, 226]]; CPS = CPS_B;
const G = 250, TERM = -175, STEP = .95;
const _h = { nx: 0, nz: 0, pen: 0 };

// ---------- character physics ----------
// how tall a character is for bumping into things: a tower counts as the whole tower; ducking down makes you lower
function bodyH(C) { return C.colH || (C.crouch ? C.h * .8 : C.h); }
function supportAt(x, z, r, yMax) { let s = -1e9, sc = null; for (const c of colsNear(x, yMax, z)) { if (c.t === 'h') { const top = hTop(c, x, z); if (top <= yMax && top > s) { s = top; sc = c; } continue; } if (c.y1 > yMax || c.y1 < s) continue; if (!xzHit(c, x, z, r, _h)) continue; s = c.y1; sc = c; } return [s, sc]; }
// walking on (or into) a sloped slab: step up onto it while it's low enough (a roof is walked up, not climbed);
// stuck in it from above: slide off downhill; poking up into it from underneath (the attic): back out to where there's headroom
function slopePush(C, c, allowStep) {
  const x = C.pos.x, z = C.pos.z, top = hTop(c, x, z); if (top < -1e8) return false;
  const bot = top - c.th, h = bodyH(C); if (top <= C.pos.y + .001 || bot >= C.pos.y + h) return false;
  const rise = top - C.pos.y; if (rise <= (C.grounded && allowStep ? 2.2 : .45)) { C.pos.y = top; return false; }
  const gx = (hTop(c, x + 1, z) - hTop(c, x - 1, z)) / 2, gz = (hTop(c, x, z + 1) - hTop(c, x, z - 1)) / 2, gl = Math.hypot(gx, gz);
  if (!(gl > 1e-3 && gl < 5)) { if (C.pos.y + h * .5 > (top + bot) / 2) { C.pos.y = top; return false; } return false; }
  const under = C.pos.y + h * .5 < (top + bot) / 2, need = under ? (C.pos.y + h - bot) : rise, d = clamp(need / gl, .05, 1.5) * (under ? 1 : -1);
  C.pos.x += gx / gl * d; C.pos.z += gz / gl * d; return true;
}
function resolveH(C, allowStep) {
  let best = null;
  for (let it = 0; it < 3; it++) {
    let any = false;
    for (const c of colsNear(C.pos.x, C.pos.y + 1, C.pos.z)) {
      if (c.t === 'h') { if (slopePush(C, c, allowStep)) any = true; continue; }
      if (c.y1 <= C.pos.y + .001 || c.y0 >= C.pos.y + bodyH(C)) continue;   // a tower collides as tall as the whole tower
      // a gap a little lower than you are (under the fridge, a low shelf): duck down and squeeze in
      if (!C.colH && !C.crouch && C.grounded && c.y0 >= C.pos.y + C.h * .8 && c.y0 - C.pos.y > 3.6 && xzHit(c, C.pos.x, C.pos.z, C.r, _h)) { C.crouch = true; C.autoCrouch = true; if (C === leader && !C.saidDuck) { C.saidDuck = 1; toast(`${C.S.name}縮低身鑽咗入去`); } continue; }
      if (!xzHit(c, C.pos.x, C.pos.z, C.r, _h)) continue;
      const rise = c.y1 - C.pos.y;
      if (allowStep && rise <= STEP && C.grounded) { C.pos.y = c.y1; continue; }
      if (c.push && C.id === 'bear' && C.grounded && C === leader && !NET.client && pushHeld() && pushCol(c, -_h.nx * _h.pen, -_h.nz * _h.pen)) { C.pushing = true; continue; }
      C.pos.x += _h.nx * _h.pen; C.pos.z += _h.nz * _h.pen; any = true;
      const vn = C.vel.x * _h.nx + C.vel.z * _h.nz; if (vn < 0) { C.vel.x -= vn * _h.nx; C.vel.z -= vn * _h.nz; }
      if (rise > STEP * 1.2 && (!best || _h.pen > best.pen)) best = { nx: _h.nx, nz: _h.nz, pen: _h.pen, c };
    }
    if (!any) break;
  }
  return best;
}
function pushCol(c, dx, dz) {
  const r = resizables.find(q => q.c === c); if (!r) return false;
  if (Math.abs(dx) > Math.abs(dz)) dz = 0; else dx = 0;
  const nb = [c.x0 + dx, c.x1 + dx, c.z0 + dz, c.z1 + dz, c.y0 + .05, c.y1];
  for (const o of colsNear((c.x0 + c.x1) / 2, c.y0 + .1, (c.z0 + c.z1) / 2)) { if (o === c || o.y1 <= nb[4] || o.y0 >= nb[5]) continue; const b = colBounds(o); if (b[1] > nb[0] && b[0] < nb[1] && b[5] > nb[2] && b[4] < nb[3]) return false; }
  r.cx += dx; r.cz += dz; applyResize(r); if (rnd() < .08) SND.push(); return true;
}
function moveVert(C, dt) {
  const prevY = C.pos.y; C.pos.y += C.vel.y * dt;
  const [sup, sc] = supportAt(C.pos.x, C.pos.z, C.r * .55, prevY + .05);
  const wasG = C.grounded; C.grounded = false;
  if (C.pos.y <= sup + .001) { const imp = -C.vel.y; C.pos.y = sup; if (C.vel.y < 0) C.vel.y = 0; C.grounded = true; C.ground = sc; if (!wasG) land(C, imp); if (sc && sc.bouncy && imp > 22 && !wasG) { C.vel.y = clamp(imp * .82, 45, 150); C.grounded = false; C.squash = -.6; tone(260, 520, .16, .05, 'sine'); } }
  else if (wasG && C.vel.y <= 0 && C.pos.y - sup < .3 + (sc && sc.t === 'h' ? Math.hypot(C.vel.x, C.vel.z) * dt * .75 : 0)) { C.pos.y = sup; C.vel.y = 0; C.grounded = true; C.ground = sc; }
  C.ceilHit = ceil(C);
}
function ceil(C) {
  let hit = null; const H = bodyH(C);
  for (const c of colsNear(C.pos.x, C.pos.y + 1, C.pos.z)) { if (c.t === 'h') { const b = hTop(c, C.pos.x, C.pos.z) - c.th; if (b > -1e8 && b >= C.pos.y + H * .55 && b < C.pos.y + H) { C.pos.y = b - H; if (C.vel.y > 0) C.vel.y = 0; hit = c; } continue; } if (c.y0 < C.pos.y + H * .55 || C.pos.y + H <= c.y0) continue; if (!xzHit(c, C.pos.x, C.pos.z, C.r * .7, _h)) continue; C.pos.y = c.y0 - H; if (C.vel.y > 0) C.vel.y = 0; hit = c; }
  return hit;
}
// climbing up into a thin overhang (a table top over its leg, a counter lip): reach round the edge and pull up onto it
function xzIn(c, x, z) { return c.t === 'b' ? x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1 : Math.hypot(x - c.x, z - c.z) < c.r; }
function lipGrab(C, n, c) {
  if (!c || c.slick || c.y1 - c.y0 > 6.5 || c.y0 < -900) return false;
  const reach = C.r + 14; if (xzIn(c, C.pos.x + n.x * reach, C.pos.z + n.z * reach)) return false;   // the lip sticks out too far
  let ox = 0; while (ox < reach && xzIn(c, C.pos.x + n.x * ox, C.pos.z + n.z * ox)) ox += .5;   // how far out its edge is
  // land on the top just behind where you are — or, for a shelf fixed to the wall, right above you
  let px = C.pos.x - n.x * (C.r + .7), pz = C.pos.z - n.z * (C.r + .7);
  if (!xzIn(c, px, pz)) { px = C.pos.x + n.x * .3; pz = C.pos.z + n.z * .3; }
  if (!xzIn(c, px, pz) || solidAt(px, c.y1 + .3, pz) || solidAt(px, c.y1 + C.h * .5, pz)) return false;
  C.mantle = { from: C.pos.clone(), to: V3(px, c.y1, pz), t: 0, out: V3(n.x * (ox + C.r * .6), 0, n.z * (ox + C.r * .6)), dur: .5 + ox * .02 };
  return true;
}
// a thick block overhanging what you're climbing (a mailbox on its post, a shelf on its bracket, a chunky table top):
// reach out round its bottom edge onto its side and keep climbing up that
function faceReach(C, n, c) {
  if (!c || c.t !== 'b' || c.slick || c.y0 < -900 || c.y1 - c.y0 <= 6.5) return false;
  let ox = 0; while (ox < 16 && xzIn(c, C.pos.x + n.x * ox, C.pos.z + n.z * ox)) ox += .5;
  if (ox === 0 || ox >= 16) return false;   // not over us, or it sticks out too far to reach round
  const qx = C.pos.x + n.x * ox, qz = C.pos.z + n.z * ox;
  const d = [[Math.abs(qx - c.x0), -1, 0], [Math.abs(qx - c.x1), 1, 0], [Math.abs(qz - c.z0), 0, -1], [Math.abs(qz - c.z1), 0, 1]].sort((a, b) => a[0] - b[0])[0];
  const off = C.r + .15, px = d[1] ? (d[1] < 0 ? c.x0 - off : c.x1 + off) : clamp(qx, c.x0 + C.r * .5, c.x1 - C.r * .5), pz = d[2] ? (d[2] < 0 ? c.z0 - off : c.z1 + off) : clamp(qz, c.z0 + C.r * .5, c.z1 - C.r * .5);
  const py = c.y0 - C.h * .35;
  if (solidAt(px, py + C.h * .5, pz) || solidAt(px, py + C.h * .9, pz)) return false;
  C.mantle = { from: C.pos.clone(), to: V3(px, py, pz), t: 0, dur: .45, climbN: V3(d[1], 0, d[2]) };
  return true;
}
function land(C, imp) {
  if (C !== leader) return;
  if (imp > 130) { C.rollT = .55; C.squash = .9; SND.land(1); for (let i = 0; i < 10; i++) emit(V3(C.pos.x, C.pos.y + .2, C.pos.z), V3(R(-8, 8), R(2, 9), R(-8, 8)), new THREE.Color(.25, .23, .2), R(.3, .7), R(.4, .8), 40, 3); }
  else if (imp > 45) { C.squash = clamp(imp / 160, .25, .75); SND.land(clamp(imp / 130, .2, .8)); }
  else SND.step(.6);
}
function speedOf(C, run) { return (C.crouch ? 6.5 : run && !C.drag ? 25 : 13.5) * (C.drag ? C.drag.slow : 1) * C.S.spd * (C.slow || 1) * (C.sugarT > T ? 1.22 : 1) * (C.carry ? 1 - .22 * carryWeight(C) : 1) * (C.stackN ? (C.stackN > 1 ? .6 : .76) : 1); }
const joy = { id: null, x: 0, y: 0, ox: 0, oy: 0, on: false };
function readMove() {
  if (joy.on && Math.hypot(joy.x, joy.y) > .1) { const m = Math.min(1, Math.hypot(joy.x, joy.y)); return { x: joy.x, y: joy.y, m, run: m > .93 }; }
  const x = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), y = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
  return { x, y, m: x || y ? 1 : 0, run: !!(keys.ShiftLeft || keys.ShiftRight) };
}
// a carpeted stair: scramble straight up onto the next tread instead of a slow climb
function scramble(C, hit) {
  const c = hit.c, px = C.pos.x - hit.nx * (C.r + 1.6), pz = C.pos.z - hit.nz * (C.r + 1.6);
  const s2 = solidAt(px, c.y1 + .3, pz); if (!xzIn(c, px, pz) || solidAt(px, c.y1 + C.h * .5, pz) || (s2 && s2 !== c)) return false;
  C.mantle = { from: C.pos.clone(), to: V3(px, c.y1, pz), t: 0, dur: .36 + (c.y1 - C.pos.y) * .012 }; C.yaw = Math.atan2(-hit.nx, -hit.nz);
  if (C.id !== 'gecko') C.stamina = Math.max(0, C.stamina - 2); SND.swish(); return true;
}
const LEAP = { cost: 11, dur: .3, up: 1.9, side: 1.5 };   // a climbing leap: stamina, seconds, distance in body heights (up / sideways)
function startClimb(C, hit) { C.leap = null; C.climbing = true; C.climbC = hit.c; C.climbN.set(hit.nx, 0, hit.nz); C.vel.set(0, 0, 0); C.grounded = false; C.crouch = false; C.yaw = Math.atan2(-hit.nx, -hit.nz); SND.swish(); }
function detach(C, push, up, grounded) { C.leap = null; C.climbing = false; C.vel.set(C.climbN.x * push * 20, up, C.climbN.z * push * 20); C.climbCD = .35; if (grounded) C.grounded = true; }
function updLeader(C, dt) {
  const ctl = STATE === 'play' && !(C.tumble > 0) && !PAUSED;
  // the bottom of a tower can still walk, carrying everyone on top (slower; no jumping or climbing)
  const base = isBase(C); C.stackN = base ? towerSize(C) - 1 : 0; C.colH = base ? towerH(C) : 0;
  const mv = ctl ? readMove() : { x: 0, y: 0, m: 0, run: false }; const inX = mv.x, inY = mv.y;
  const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
  let wx = fx * inY + rx * inX, wz = fz * inY + rz * inX; const wl = Math.hypot(wx, wz); if (wl > 0) { wx /= wl; wz /= wl; }
  if (ctl && pressed.KeyC) { if (C.crouch && ceilAt(C.pos.x, C.pos.z, C.pos.y + .1)[0] < C.pos.y + C.h) toast('上面太矮，企唔起身'); else { C.crouch = !C.crouch; C.autoCrouch = false; } }
  C.climbCD = Math.max(0, (C.climbCD || 0) - dt); if (C.rollT > 0) C.rollT -= dt; C.overhang = Math.max(0, (C.overhang || 0) - dt); C.pushing = false;
  if (C.tumble > 0) C.tumble -= dt;
  if (C.mantle) {
    const M = C.mantle; M.t += dt / (M.dur || .3); const t = Math.min(1, M.t);
    C.pos.lerpVectors(M.from, M.to, sstep(0, 1, t)); C.pos.y = lerp(M.from.y, M.to.y, Math.min(1, t * 1.6));
    if (M.out) { const s = Math.sin(Math.PI * Math.min(1, t * 1.25)); C.pos.x += M.out.x * s; C.pos.z += M.out.z * s; }
    C.state = 'climb'; C.spd = 6;
    if (t >= 1) { if (M.climbN) { C.mantle = null; C.climbing = true; C.grounded = false; C.climbN.copy(M.climbN); C.vel.set(0, 0, 0); C.yaw = Math.atan2(-M.climbN.x, -M.climbN.z); return; } C.mantle = null; C.climbing = false; C.grounded = true; C.vel.set(0, 0, 0); C.squash = .35; C.state = 'idle'; }
    return;
  }
  if (C.zip) { updZip(C, dt); return; }
  if (C.climbing) { updClimb(C, dt, inX, inY, ctl, mv.run); return; }
  if (C.roost) { updRoost(C, dt, wx, wz, wl, ctl); return; }
  if (C.dig) { moleDigUpd(C, dt, wx, wz, ctl); return; }
  if (C.shell) { C.state = 'shell'; C.vel.set(0, 0, 0); C.spd = 0; C.stamina = Math.min(C.stamMax || 100, C.stamina + 30 * dt); if (ctl && pressed.Space) { C.shell = false; C.state = 'idle'; } return; }
  if (C.leapT > 0) C.leapT -= dt;
  const sp = speedOf(C, mv.run) * (joy.on ? clamp(mv.m / .85, .35, 1) : 1); const tx = wx * sp, tz = wz * sp; const acc = (C.grounded ? 150 : C.leapT > 0 ? 9 : 50) * dt;
  let dvx = tx - C.vel.x, dvz = tz - C.vel.z; const dl = Math.hypot(dvx, dvz); if (dl > acc && acc > 0) { dvx *= acc / dl; dvz *= acc / dl; }
  if (C.tumble > 0) { if (C.grounded) { C.vel.x *= 1 - 5 * dt; C.vel.z *= 1 - 5 * dt; } } else { C.vel.x += dvx; C.vel.z += dvz; }
  if (wl > 0 && !(C.tumble > 0)) C.yaw = angDamp(C.yaw, Math.atan2(wx, wz), 13, dt);
  if (ctl && pressed.Space && C.grounded && base) { if (!C.noJumpT || T - C.noJumpT > 3) { C.noJumpT = T; toast('頭上有人，跳唔到——叫佢哋先落嚟'); } }
  else if (ctl && pressed.Space && C.grounded && !C.drag) { C.vel.y = 47 * C.S.jmp; C.grounded = false; C.squash = -.55; C.crouch = false; SND.jump(); }
  else if (ctl && pressed.Space && C.id === 'bat' && !C.grounded && !base) batFlap(C);
  if (C.dashT > 0) hogDash(C, dt); chargeJump(C, dt, ctl);
  C.vel.y -= G * dt; const wasGl = C.gliding; C.gliding = false;
  if (C.id === 'sq' && ctl && !C.grounded && keys.Space && (C.vel.y < 0 || wasGl)) {
    const w = carryWeight(C); C.gliding = true; C.vel.y = Math.max(C.vel.y, -10 - 7 * w); const hx = Math.sin(C.yaw), hz = Math.cos(C.yaw);
    const ud = updraftAt(C.pos); if (ud) { C.vel.y = Math.min(C.vel.y + G * dt + 300 * dt, 40 - 10 * w); if (!C.saidUd) { C.saidUd = 1; toast('暖風把你托上去了！'); } }
    C.vel.x = damp(C.vel.x, hx * (30 - 8 * w) + wx * 4, 2.5, dt); C.vel.z = damp(C.vel.z, hz * (30 - 8 * w) + wz * 4, 2.5, dt);
  }
  if (C.id === 'bat' && ctl && !C.grounded && keys.Space && C.vel.y < -14 && !C.gliding) C.vel.y = -14;   // flutter down slowly
  // strong hot air (over a lit burner) lifts anyone light enough — everyone here is 5 cm tall
  //  (step onto the burner and it takes you: no jump needed; the column carries you straight up into the slot)
  if (!C.gliding && !C.climbing && !C.mantle) { const ud = updraftAt(C.pos); if (ud && ud.all && (!C.grounded || C.pos.y < ud.y0 + 6)) { if (C.grounded) { C.grounded = false; C.vel.y = Math.max(C.vel.y, 14); } C.vel.y = Math.min(C.vel.y + G * dt + 150 * dt, 30);
      if (ud.hot && C.pos.y < ud.y1 - 10) { C.vel.x = damp(C.vel.x, (ud.x - C.pos.x) * 3, 5, dt); C.vel.z = damp(C.vel.z, (ud.z - C.pos.z) * 3, 5, dt); } if (!C.saidUd) { C.saidUd = 1; if (C === leader) toast('熱風把你托上去了！'); } } }
  if (C.vel.y < TERM) C.vel.y = TERM;
  C.pos.x += C.vel.x * dt; C.pos.z += C.vel.z * dt;
  const hit = resolveH(C, true);
  // ducked in under something on your own: stand back up once there's room again
  if (C.autoCrouch && C.crouch && ceilAt(C.pos.x, C.pos.z, C.pos.y + .1)[0] >= C.pos.y + C.h + .2) { C.crouch = false; C.autoCrouch = false; }
  moveVert(C, dt);
  if (C.grounded) C.flaps = 0;
  if (C.id === 'bat' && ctl && !C.grounded && keys.Space && C.ceilHit && roostOn(C, C.ceilHit)) return;
  if (hit && ctl && !base && !hit.c.slick && C.climbCD <= 0 && !C.crouch && (C.stamina > 8 || C.id === 'gecko')) { if (-(wx * hit.nx + wz * hit.nz) > .5 && !(hit.c.grip && C.grounded && hit.c.y1 - C.pos.y < 21 && scramble(C, hit))) startClimb(C, hit); }
  if (C.grounded && !C.cold) C.stamina = Math.min(C.stamMax || 100, C.stamina + 45 * dt);
  const hs = Math.hypot(C.vel.x, C.vel.z); C.spd = hs;
  C.state = base && C.grounded ? (hs > .8 ? 'stackwalk' : 'stack') : C.dashT > 0 ? 'roll' : C.tumble > 0 ? 'tumble' : C.gliding ? 'glide' : !C.grounded ? 'air' : hs > .8 ? (C.crouch ? 'sneak' : 'walk') : (C.crouch ? 'crouch' : 'idle');
  // a broken number (NaN) is put back where this character last stood, not sent to the checkpoint
  if (!Number.isFinite(C.pos.x + C.pos.y + C.pos.z)) { nlog('救返：' + C.S.name + ' 位置壞咗（NaN），放返上一個位置'); if (C.okPos) C.pos.copy(C.okPos); else C.pos.set(...CPS[cp]); C.vel.set(0, 0, 0); }
  else if (C.pos.y < -400 || (WORLD && C.pos.y < -5 && !zoneAt(C.pos, 30))) { nlog('救返：' + C.S.name + ' 跌出地圖 ' + C.pos.toArray().map(v => v.toFixed(0)).join(',') + ' → 存檔點 ' + cp); C.pos.set(...CPS[cp]); C.vel.set(0, 0, 0); }
  else (C.okPos || (C.okPos = V3())).copy(C.pos);
}
function resolveClimb(C) {
  let best = null;
  for (let it = 0; it < 2; it++) {
    let any = false;
    for (const c of colsNear(C.pos.x, C.pos.y + 1, C.pos.z)) {
      if (c.t === 'h' || c.y1 <= C.pos.y + .001 || c.y0 >= C.pos.y + C.h) continue;
      if (!xzHit(c, C.pos.x, C.pos.z, C.r, _h)) continue;
      C.pos.x += _h.nx * _h.pen; C.pos.z += _h.nz * _h.pen; any = true;
      if (!best || _h.pen > best.pen) best = { nx: _h.nx, nz: _h.nz, pen: _h.pen, c };
    }
    if (!any) break;
  }
  return best;
}
function updClimb(C, dt, inX, inY, ctl, run) {
  const n = C.climbN, grip = C.climbC && C.climbC.grip; let sp = 9 * C.S.clb * (run ? 1.4 : 1) * (grip ? 1.7 : 1);
  // Space while climbing: a climbing leap (like Zelda) up — or sideways, with the stick held that way — fast, but it
  // costs a chunk of stamina; pull down (back) and press it to jump off the wall instead
  if (ctl && pressed.Space) {
    if (inY < -.3) { C.leap = null; C.climbing = false; C.vel.set(n.x * 24, 40, n.z * 24); C.climbCD = .45; C.yaw = Math.atan2(n.x, n.z); SND.jump(); C.state = 'air'; return; }
    const cost = C.id === 'gecko' ? 2 : LEAP.cost;
    if (C.leap || C.leapCD > 0) { }
    else if (C.stamina < cost + 2) { if (C === leader) toast('體力唔夠彈上去，慢慢爬或者搵位企穩先'); }
    else { let lx = inX, ly = Math.max(0, inY); if (Math.hypot(lx, ly) < .3) { lx = 0; ly = 1; } const l = Math.hypot(lx, ly); C.leap = { x: lx / l, y: ly / l, t: 0, d: C.h * (ly / l > .5 ? LEAP.up : LEAP.side) }; C.stamina -= cost; SND.jump();
      for (let i = 0; i < 6; i++) emit(V3(C.pos.x + n.x * .6, C.pos.y + R(0, C.h * .5), C.pos.z + n.z * .6), V3(n.x * R(4, 10) + R(-3, 3), R(-4, 2), n.z * R(4, 10) + R(-3, 3)), new THREE.Color(.7, .64, .56), R(.12, .24), R(.3, .6), 60, .6); }
  }
  if (C.leapCD > 0) C.leapCD -= dt;
  let leaping = false;
  if (C.leap) { const L = C.leap; L.t += dt; const k = L.t / LEAP.dur;
    if (k >= 1) { C.leap = null; C.leapCD = .08; }
    else { leaping = true; sp = 2 * L.d / LEAP.dur * (1 - k); inX = L.x; inY = L.y; } }   // fast at first, easing off: covers L.d in LEAP.dur
  let sx = n.z, sz = -n.x; if (sx * Math.cos(cam.yaw) + sz * -Math.sin(cam.yaw) < 0) { sx = -sx; sz = -sz; }
  if (leaping) { if (C.leap.sx === undefined) { C.leap.sx = sx; C.leap.sz = sz; } sx = C.leap.sx; sz = C.leap.sz; }   // a sideways leap keeps the side it started on
  const moving = inX !== 0 || inY !== 0;
  if (C.id !== 'gecko' && !leaping) C.stamina -= (moving ? (run ? 11 : 5.4) : 1.8) * (grip ? .55 : 1) * dt;
  if (C.stamina <= 0) { C.stamina = 0; detach(C, .4, 0); toast('體力用完了，先找個地方站穩休息'); return; }
  const ox = C.pos.x, oz = C.pos.z;
  C.pos.y += inY * sp * dt; C.pos.x += sx * inX * sp * (leaping ? 1 : .8) * dt; C.pos.z += sz * inX * sp * (leaping ? 1 : .8) * dt;
  if (inY < 0) { const [sup] = supportAt(C.pos.x, C.pos.z, C.r * .55, C.pos.y + .3); if (C.pos.y <= sup + .05) { C.pos.y = sup; detach(C, 0, 0, true); C.state = 'idle'; return; } }
  const yb = C.pos.y; const cc = ceil(C); if (inY > 0 && C.pos.y < yb - .01) { C.overhang = 1.4; if (C.id === 'bat' && roostOn(C, cc)) { C.overhang = 0; return; } if (lipGrab(C, n, cc) || faceReach(C, n, cc)) { C.overhang = 0; return; } }
  C.pos.x -= n.x * .35; C.pos.z -= n.z * .35;
  let hit = resolveClimb(C);
  if (!hit && inX !== 0) { C.pos.x = ox - n.x * .35; C.pos.z = oz - n.z * .35; hit = resolveClimb(C); }
  if (hit) {
    C.climbC = hit.c; n.x = lerp(n.x, hit.nx, .35); n.z = lerp(n.z, hit.nz, .35); n.normalize();
    C.yaw = angDamp(C.yaw, Math.atan2(-n.x, -n.z), 12, dt);
    if (inY >= 0 && C.pos.y + C.h * .42 > hit.c.y1) {
      const px = C.pos.x - n.x * (C.r + .7), pz = C.pos.z - n.z * (C.r + .7);
      if (!solidAt(px, hit.c.y1 + C.h * .5, pz)) { C.mantle = { from: C.pos.clone(), to: V3(px, hit.c.y1, pz), t: 0 }; return; }
      // another block sits right on top of this one (a pile, stacked cupboards): keep climbing up its face
      const wx = C.pos.x - n.x * (C.r + .3), wz = C.pos.z - n.z * (C.r + .3), up = solidAt(wx, hit.c.y1 + .3, wz);
      if (!(up && up !== hit.c && !up.slick && up.y0 <= hit.c.y1 + .6)) C.pos.y = Math.min(C.pos.y, hit.c.y1 - C.h * .42);
    }
    if (inX !== 0) { // step sideways onto a ledge beside you
      const qx = C.pos.x + sx * inX * (C.r + 1.2) - n.x * .8, qz = C.pos.z + sz * inX * (C.r + 1.2) - n.z * .8; const c2 = solidAt(qx, C.pos.y + .3, qz);
      if (c2 && c2.y1 > C.pos.y - .5 && c2.y1 - C.pos.y < C.h * .9 && !solidAt(qx, c2.y1 + C.h * .5, qz)) { C.mantle = { from: C.pos.clone(), to: V3(qx, c2.y1, qz), t: 0 }; return; }
    }
  } else {
    const px = C.pos.x - n.x * (C.r + .7), pz = C.pos.z - n.z * (C.r + .7); const c = solidAt(px, C.pos.y + .2, pz);
    if (c && c.y1 - C.pos.y < C.h && !solidAt(px, c.y1 + C.h * .5, pz)) { C.mantle = { from: C.pos.clone(), to: V3(px, c.y1, pz), t: 0 }; return; }
    detach(C, .3, 0);
  }
  C.state = 'climb'; C.spd = moving ? sp : 0;
}

// ---------- followers (they retrace the leader's exact path, so they climb and jump too) ----------
function pushTrail(L) {
  // only the bat can hang under things: while it roosts (and until it is back on its feet) the others wait where it left the ground
  if (L.roost || (L.roostGap && !L.grounded && !L.climbing)) return;
  if (L.pos.distanceTo(L.lastTrail) < .35) return; L.lastTrail.copy(L.pos);
  const pt = { x: L.pos.x, y: L.pos.y, z: L.pos.z, yaw: L.yaw, st: L.state };
  if (L.roostGap) { L.roostGap = false; pt.st = 'warp'; }
  trail.push(pt); if (trail.length > 9000) trail.splice(0, 3000);
  for (const F of party) if (F !== L && !F.frozen) { F.queue.push(pt); if (F.queue.length > 7000) F.queue.splice(0, 2000); }
}
function pathLen(F, L) { let s = 0, px = F.pos.x, py = F.pos.y, pz = F.pos.z; for (const q of F.queue) { s += Math.hypot(q.x - px, q.y - py, q.z - pz); px = q.x; py = q.y; pz = q.z; } return s + Math.hypot(L.pos.x - px, L.pos.y - py, L.pos.z - pz); }
function updFollower(F, L, dt) {
  if (F.dig) molePop(F, true);
  if (F.shell || F.roost) { F.spd = 0; F.state = F.shell ? 'shell' : 'roost'; F.disp && F.disp.copy(F.pos); return; }
  let Lp = pathLen(F, L);
  if (Lp > 150 && F.queue.length > 30) { while (F.queue.length > 2 && Lp > 70) { const q = F.queue.shift(); Lp -= Math.hypot(q.x - F.pos.x, q.y - F.pos.y, q.z - F.pos.z); F.pos.set(q.x, q.y, q.z); } }
  const [sup] = supportAt(F.pos.x, F.pos.z, F.r * .55, F.pos.y + .05);
  const floating = F.pos.y - sup > .35 && F.qst !== 'climb';
  let moved = 0;
  // personal space: when the leader's path doubles back (climb up and drop down, turn round…) don't walk along it into
  // him — skip the loop instead — and wait a step away rather than standing inside him
  const ldx = F.pos.x - L.pos.x, ldz = F.pos.z - L.pos.z, ld = Math.hypot(ldx, ldz), same = Math.abs(F.pos.y - L.pos.y) < 2.2 && !floating;
  let nearL = same && ld < Math.max(F.r + L.r + 2.4, F.gap * .55);
  if (nearL && ld > .3) { const o = V3(F.pos.x, F.pos.y + F.h * .5, F.pos.z), d = V3(-ldx, L.pos.y - F.pos.y, -ldz); const len = d.length(); if (rayBlocked(o, d.divideScalar(len), len, false)) nearL = false; }
  if (nearL) { while (F.queue.length > 1) { const q = F.queue[0]; if (Math.abs(q.y - F.pos.y) > 1.5 || Math.hypot(q.x - L.pos.x, q.z - L.pos.z) < ld - .5) break; F.queue.shift(); } }
  // …and don't walk into the teammate ahead of you on the path
  const jam = !floating && party.some(G2 => G2 !== F && G2 !== L && !G2.frozen && G2.gap < F.gap && Math.abs(G2.pos.y - F.pos.y) < 2.2 && Math.hypot(G2.pos.x - F.pos.x, G2.pos.z - F.pos.z) < F.r + G2.r + 1.2);
  if ((Lp > F.gap && !nearL && !jam) || (floating && F.queue.length)) {
    let move = Math.min(Math.max(Lp - F.gap, floating ? 30 * dt : 0), (Lp - F.gap > 14 || floating ? 32 : 17) * F.S.spd * dt); const m0 = move;
    while (move > 1e-4 && F.queue.length) {
      const q = F.queue[0]; const dx = q.x - F.pos.x, dy = q.y - F.pos.y, dz = q.z - F.pos.z; const d = Math.hypot(dx, dy, dz);
      if (q.st === 'warp') { F.queue.shift(); F.pos.set(q.x, q.y, q.z); F.qst = 'walk'; F.offK = 0; for (let i = 0; i < 8; i++) emit(V3(q.x, q.y + 1, q.z), V3(R(-6, 6), R(2, 8), R(-6, 6)), new THREE.Color(.5, .5, .5), R(.2, .4), R(.3, .6), 20, 2); continue; }
      F.qst = q.st; F.qyaw = q.yaw;
      if (d <= move) { F.pos.set(q.x, q.y, q.z); move -= d; F.queue.shift(); if (Math.hypot(dx, dz) > .3) F.tyaw = Math.atan2(dx, dz); }
      else { const k = move / d; F.pos.x += dx * k; F.pos.y += dy * k; F.pos.z += dz * k; move = 0; if (Math.hypot(dx, dz) > .3) F.tyaw = Math.atan2(dx, dz); }
    }
    moved = dt > 0 ? (m0 - move) / dt : 0;
  }
  if (!floating && F.pos.y - sup < .35) {   // step aside from the leader and from each other (measured where everyone is drawn)
    const DX = F.disp.x - F.pos.x, DZ = F.disp.z - F.pos.z, fx0 = F.pos.x + DX, fz0 = F.pos.z + DZ, edx = fx0 - L.pos.x, edz = fz0 - L.pos.z, ed = Math.hypot(edx, edz);
    let px = 0, pz = 0; const push = (dx, dz, d, s) => { if (d >= s) return; const k = (s - d) / s; if (d < .05) { const a = F.side > 0 ? 1.2 : -1.2; dx = Math.cos(a); dz = Math.sin(a); d = 1; } px += dx / d * k; pz += dz / d * k; };
    if (Math.abs(F.pos.y - L.pos.y) < 3) { push(edx, edz, ed, F.r + L.r + 2.2);
      const lv = Math.hypot(L.vel.x, L.vel.z); if (lv > 2 && ed < F.r + L.r + 6 && (L.vel.x * edx + L.vel.z * edz) > 0) { const s = (L.vel.x * edz - L.vel.z * edx) > 0 ? 1 : -1; px += -L.vel.z / lv * s * .9; pz += L.vel.x / lv * s * .9; } }   // he's walking at you: step to the side
    for (const G2 of party) if (G2 !== F && G2 !== L && !G2.frozen && !G2.on && !G2.hop && Math.abs(G2.pos.y - F.pos.y) < 3) { const gx = fx0 - G2.disp.x, gz = fz0 - G2.disp.z; push(gx, gz, Math.hypot(gx, gz), F.r + G2.r + 1.4); }
    const m = Math.hypot(px, pz);
    if (m > .01) { const step = Math.min(m, 1.5) * 30 * dt, nx = F.pos.x + px / m * step, nz = F.pos.z + pz / m * step; const [s3] = supportAt(nx, nz, F.r * .55, F.pos.y + .5); if (Math.abs(s3 - F.pos.y) < .5 && !solidAt(nx, F.pos.y + F.h * .5, nz)) { F.pos.x = nx; F.pos.z = nz; if (!moved) F.tyaw = Math.atan2(px, pz); } }
  }
  F.spd = moved;
  const st = F.qst || 'idle';
  if (st === 'climb' && (moved > .3 || floating || F.pos.y - sup > .35)) { F.state = 'climb'; F.yaw = angDamp(F.yaw, F.qyaw, 10, dt); }
  else if (moved > .5) { F.state = (st === 'air' || st === 'glide' || st === 'tumble') ? (F.id === 'sq' && st === 'glide' ? 'glide' : 'air') : (st === 'sneak' ? 'sneak' : 'walk'); if (F.tyaw !== undefined) F.yaw = angDamp(F.yaw, F.tyaw, 10, dt); }
  else { F.state = L.crouch ? 'crouch' : 'idle'; const dx = L.pos.x - F.pos.x, dz = L.pos.z - F.pos.z; if (Math.hypot(dx, dz) > 5) F.yaw = angDamp(F.yaw, Math.atan2(dx, dz), 2, dt); }
  F.crouch = F.state === 'crouch' || F.state === 'sneak';
  // walk beside the leader's path instead of in the camera line
  const flat = F.state === 'walk' || F.state === 'idle' || F.state === 'sneak' || F.state === 'crouch';
  let ok = false; const lx = Math.cos(F.yaw) * F.side, lz = -Math.sin(F.yaw) * F.side;
  if (flat && F.pos.y - sup < .35) { const px = F.pos.x + lx, pz = F.pos.z + lz; const [s2] = supportAt(px, pz, F.r * .55, F.pos.y + .5); ok = Math.abs(s2 - F.pos.y) < .4 && !solidAt(px, F.pos.y + F.h * .5, pz); }
  else if (F.state === 'climb') { const px = F.pos.x + lx, pz = F.pos.z + lz, fx = Math.sin(F.yaw) * (F.r + 1), fz = Math.cos(F.yaw) * (F.r + 1); ok = !solidAt(px, F.pos.y + F.h * .5, pz) && !!solidAt(px + fx, F.pos.y + F.h * .5, pz + fz) && !!solidAt(px + fx, F.pos.y + F.h * .1, pz + fz); }
  F.offK = damp(F.offK || 0, ok ? 1 : 0, 5, dt);
  F.disp.set(F.pos.x + lx * F.offK, F.pos.y, F.pos.z + lz * F.offK);
}
function hideOccluders() {
  const L = leader; const a = camera.position, b = V3(L.pos.x, L.pos.y + L.h * .6, L.pos.z); const ab = V3().subVectors(b, a); const len2 = ab.lengthSq();
  for (const F of party) {
    if (F === L || F.on || F.hop || F.frozen || isBase(F)) { F.root.visible = true; continue; }
    const p = V3(F.disp.x, F.disp.y + F.h * .5, F.disp.z); const t = clamp(V3().subVectors(p, a).dot(ab) / len2, 0, 1); const q = V3().copy(a).addScaledVector(ab, t);
    // hide a teammate that blocks the line to you, or that is so close to the camera it would fill the screen
    F.root.visible = !(p.distanceTo(q) < F.r + 1.8 && t < .92) && p.distanceTo(a) > F.r * 2 + 4.5;
  }
}
function switchTo(N) {
  if (NET.on) return;
  if (!N || N === leader || STATE !== 'play' || leader.mantle || leader.hop || N.hop) return;
  if (N.frozen) { toast(`${N.S.name}變成了玩具，要先救回來`); return; }
  const ik = trail.length - N.queue.length;
  for (const F of party) {
    if (F === N) continue;
    if (F === leader) F.queue = trail.slice(Math.max(0, ik)).reverse();
    else { const ij = trail.length - F.queue.length; F.queue = ij <= ik ? trail.slice(ij, ik) : trail.slice(ik, ij).reverse(); }
  }
  const old = leader; old.climbing = false; old.mantle = null; old.tumble = 0; old.rollT = 0; old.qst = old.state === 'climb' ? 'climb' : 'idle'; old.qyaw = old.yaw; old.vel.set(0, 0, 0);
  N.vel.set(0, 0, 0); N.tumble = 0; N.queue = []; N.grounded = false; if (N.state !== 'climb' && N.disp) N.pos.copy(N.disp);
  if (N.state === 'climb') { N.climbing = true; N.climbN.set(-Math.sin(N.yaw), 0, -Math.cos(N.yaw)); }
  trail = []; N.lastTrail.copy(N.pos); leader = N;
  const fol = party.filter(F => F !== N && !F.frozen).sort((a, b) => pathLen(a, N) - pathLen(b, N)); const GP = [7, 13.5, 20], SD = [-3.4, 4, -7]; fol.forEach((F, i) => { F.gap = GP[i] || 20; F.side = SD[i] || 0; });
  SND.sw(); refreshPartyHUD(); toast(`操控：${N.S.name}（${N.S.abil}）`);
}

// ---------- camera ----------
function updCam(dt) {
  if (EMO.open) { EMO.dx += mouseDX; EMO.dy += mouseDY; mouseDX = mouseDY = 0; }
  if (POUCH.open) { POUCH.dx += mouseDX; POUCH.dy += mouseDY; mouseDX = mouseDY = 0; }
  if (STATE === 'play' && !PAUSED) { cam.yaw -= mouseDX * .0024 * SET.sens; cam.pitch = clamp(cam.pitch + mouseDY * .0022 * SET.sens * (SET.inv ? -1 : 1), -1.4, 1.35); }
  mouseDX = mouseDY = 0;
  const L = watchTarget() || ghostCamTarget() || leader; const ty = L.pos.y + L.h * (L.crouch ? .62 : .8);
  cam.tgt.x = damp(cam.tgt.x, L.pos.x, 16, dt); cam.tgt.y = damp(cam.tgt.y, ty, 10, dt); cam.tgt.z = damp(cam.tgt.z, L.pos.z, 16, dt);
  const d = cam.dist * (L.climbing ? 1.18 : 1) * (L.on || isBase(L) ? 1.3 : 1) * (L.id === '_ghost' ? 1.5 : 1);
  // the camera stays behind the head; tilting further only turns the view up (to the ceiling / sky)
  const pc = Math.max(cam.pitch, -.2);
  const dir = V3(Math.sin(cam.yaw) * Math.cos(pc), Math.sin(pc), Math.cos(cam.yaw) * Math.cos(pc));
  const lk = V3(Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch));
  const o = V3(cam.tgt.x + Math.cos(cam.yaw) * 1.1, cam.tgt.y, cam.tgt.z - Math.sin(cam.yaw) * 1.1);
  const hitT = rayFirst(o, dir, d + 1); const want = Math.max(1.6, Math.min(d, hitT - .9));
  cam.curD = want < cam.curD ? want : damp(cam.curD, want, 5, dt);
  camera.position.copy(o).addScaledVector(dir, cam.curD);
  const fl = zoneFloor(L.pos); if (camera.position.y < fl + .6) camera.position.y = fl + .6;
  // look along the view direction: tilting down past the floor turns the view up to the ceiling / sky
  camera.lookAt(camera.position.x - lk.x, camera.position.y - lk.y, camera.position.z - lk.z);
  if (cam.shake > .001) { camera.position.x += (Math.random() - .5) * cam.shake; camera.position.y += (Math.random() - .5) * cam.shake; cam.shake = Math.max(0, cam.shake - dt * 3); }
  bokeh.uniforms.focus.value = cam.curD;
}

// ---------- size gun ----------
const ray = new THREE.Raycaster(); let aimRes = null; const _sc = new THREE.Vector2(0, 0);
const gunBeam = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1, 8, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x82ece6).multiplyScalar(6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); gunBeam.geometry.translate(0, .5, 0); gunBeam.geometry.rotateX(Math.PI / 2); fxGroup.add(gunBeam);
function updAim() {
  aimRes = null; if (!leader || leader.id !== 'dad' || STATE !== 'play') return;
  ray.setFromCamera(_sc, camera); ray.far = cam.curD + 150;
  const hits = ray.intersectObjects(resizables.filter(r => r.gun !== false && !r.gone).map(r => r.mesh), true);
  if (hits.length) { const h = hits[0]; let o = h.object; while (o && !o.userData.res) o = o.parent; if (o && !rayBlocked(ray.ray.origin, ray.ray.direction, h.distance - .6, true)) aimRes = { r: o.userData.res, p: h.point.clone() }; }
}
function fireGun(grow) {
  if (!leader || leader.id !== 'dad') return;
  if (!aimRes) { toast('瞄準可以改變大小的東西（會發光）再開槍'); return; }
  if (cells < 1) { toast('尺寸槍能量不足，等一下會慢慢充回'); return; }
  const r = aimRes.r; const nt = clamp(r.target * (grow ? 2 : .5), r.min, r.max);
  if (Math.abs(nt - r.target) < 1e-3) { toast(grow ? `${r.name}已經放到最大了` : `${r.name}已經縮到最小了`); return; }
  if (grow && !roomFor(r, nt)) { toast(`空間不夠，「${r.name}」放不大`); SND.zapDn(); return; }
  if (NET.client) nsend({ t: 'gun', i: resizables.indexOf(r), g: grow }, NET.hostId); else { r.target = nt; sizeNotice(r, grow); } cells--; r.pulse = 1; grow ? SND.zapUp() : SND.zapDn();
  const tip = V3(); leader.gunTip.getWorldPosition(tip); const dv = V3().subVectors(aimRes.p, tip); const len = dv.length();
  gunBeam.position.copy(tip); gunBeam.scale.set(1, 1, len); gunBeam.lookAt(aimRes.p); gunBeam.material.opacity = 1;
  for (let i = 0; i < 26; i++) emit(aimRes.p, V3(R(-14, 14), R(-6, 18), R(-14, 14)), new THREE.Color(.5, 2.2, 2.1), R(.15, .4), R(.3, .8), 20, 2);
}
function updResizables(dt) {
  for (const r of resizables) {
    if (Math.abs(r.s - r.target) > .0005) {
      r.s = damp(r.s, r.target, 6, dt); if (Math.abs(r.s - r.target) < .002) r.s = r.target; applyResize(r);
      const c = r.c; for (const C of [leader]) { if (C.pos.y < c.y1 && C.pos.y + C.h > c.y0 && xzHit(c, C.pos.x, C.pos.z, C.r * .55, _h)) { const qx = clamp(C.pos.x, c.x0, c.x1), qz = clamp(C.pos.z, c.z0, c.z1); if (Math.hypot(C.pos.x - qx, C.pos.z - qz) < .01) { C.pos.y = c.y1; C.vel.y = Math.max(C.vel.y, 0); C.climbing = false; } } }
    }
    const hl = aimRes && aimRes.r === r ? .35 + Math.sin(T * 8) * .1 : 0; r.pulse = Math.max(0, r.pulse - dt * 2);

  }
  gunBeam.material.opacity = Math.max(0, gunBeam.material.opacity - dt * 4);
  updOutlines();
}

// ---------- Mom: the family upstairs searching for you ----------
const MOM_PATH = [
  { x: -252, z: -244 }, { x: -252, z: 78, line: 'enter' }, { x: -170, z: 60 },
  { x: -50, z: -116, stop: 4.2, look: [-25, 96, -200], line: 'bench' },
  { x: 108, z: -78, stop: 3, look: [150, 40, -160] },
  { x: 196, z: 66, stop: 3.4, look: [272, 80, 10], line: 'shelf' },
  { x: 120, z: 86 }, { x: 60, z: 150, stop: 3, look: [175, 20, 180], line: 'boxes' },
  { x: -120, z: 112, stop: 3.2, look: [-262, 6, 168], line: 'center' },
  { x: -252, z: 86 }, { x: -252, z: -244, line: 'leave' }
].map(n => ({ ...n, x: n.x + BO.x, z: n.z + BO.z, look: n.look && [n.look[0] + BO.x, n.look[1] + BO.y, n.look[2] + BO.z] }));
const MOM_LINES = [
  { enter: '老公？你在下面嗎？', bench: '實驗室怎麼亂成這樣……機器還在冒火花。', shelf: 'Origin Dynamics 的人又打電話來找你了。', boxes: '你又躲起來做實驗了？', center: '……手機也沒帶走。', leave: '我報警了。你快點回來。' },
  { enter: '老公……？', bench: '女兒一直問爸爸去了哪裡。', shelf: '那些人說，不准我們碰你的東西。', boxes: '……', center: '求你了，快點回來。', leave: '……' }
];
function momY(x, z) { x -= BO.x; z -= BO.z; return (x < -200 && z < 71 ? clamp((60 - z) * .909 + 10, 0, 260) : 0) + BO.y; }
function setShadowLive(l, on) { l.shadow.autoUpdate = on; if (on) l.shadow.needsUpdate = true; }
function startMomVisit() {
  mom.active = true; mom.mode = 'door'; mom.doorT = 0; mom.node = 0; mom.pos.set(-252, 260, -244).add(BO); mom.yaw = 0; mom.root.visible = true; mom.visits++; mom.lines = MOM_LINES[Math.min(1, mom.visits - 1)];
  mom.aim.set(-252, 0, 60).add(BO); mom.aimT.copy(mom.aim); setShadowLive(upLight, true); setShadowLive(flashLight, true); SND.creak();
}
function momReset() { mom.active = false; mom.root.visible = false; mom.mode = 'off'; mom.timer = 24; flashLight.intensity = 0; flashBeamRec.k = 0; setShadowLive(flashLight, false); }
function momSay(key) { const t = mom.lines && mom.lines[key]; if (t && t !== '……' || key === 'leave') say('太太', t || '……', '#f4bb72', 3.4); }
function updMom(dt) {
  if (ZONES.kitchen.prepped) return; // she has gone back upstairs to cook
  if (!mom.active) {
    door.rotation.y = damp(door.rotation.y, 0, 3, dt); upLight.intensity = damp(upLight.intensity, 0, 3, dt); doorBeamRec.k = damp(doorBeamRec.k, 0, 3, dt);
    if (upLight.intensity < 50) setShadowLive(upLight, false);
    if (STATE === 'play') { mom.timer -= dt; if (mom.timer <= 0) startMomVisit(); }
    doorBeam.material.uniforms.uK.value = doorBeamRec.k; return;
  }
  const P = mom.pos;
  if (mom.mode === 'door') { mom.doorT += dt; if (mom.doorT > 1.3) { mom.mode = 'walk'; } }
  if (mom.mode === 'closing') { door.rotation.y = damp(door.rotation.y, 0, 4, dt); mom.doorT += dt; if (mom.doorT > 1.2) { SND.thud(.3); momReset(); mom.timer = 36 + R(0, 14); return; } }
  else door.rotation.y = damp(door.rotation.y, 1.25, 2.2, dt);
  const open = clamp(door.rotation.y / 1.25, 0, 1);
  upLight.intensity = 470000 * open; doorBeamRec.k = .06 * open; doorBeam.material.uniforms.uK.value = doorBeamRec.k;
  let moveD = 0;
  if (mom.mode === 'walk') {
    const nx = MOM_PATH[mom.node + 1]; if (!nx) { mom.mode = 'closing'; mom.doorT = 0; return; }
    const dx = nx.x - P.x, dz = nx.z - P.z, d = Math.hypot(dx, dz); const sp = 66 * dt;
    if (d < sp + .5) { P.x = nx.x; P.z = nx.z; moveD = d; mom.node++; if (nx.line) momSay(nx.line); if (nx.stop) { mom.mode = 'look'; mom.wait = nx.stop; mom.lookAt = V3(...nx.look); } if (mom.node >= MOM_PATH.length - 1) { mom.mode = 'closing'; mom.doorT = 0; } }
    else { P.x += dx / d * sp; P.z += dz / d * sp; moveD = sp; mom.yaw = angDamp(mom.yaw, Math.atan2(dx, dz), 5, dt); }
    const fx = Math.sin(mom.yaw), fz = Math.cos(mom.yaw);
    mom.aimT.set(P.x + fx * 160 + Math.sin(T * .7) * 30, 0, P.z + fz * 160 + Math.cos(T * .6) * 20);
  } else if (mom.mode === 'look') {
    mom.wait -= dt; const la = mom.lookAt; const dx = la.x - P.x, dz = la.z - P.z; const ya = Math.atan2(dx, dz); mom.yaw = angDamp(mom.yaw, ya, 2.5, dt);
    const s = Math.sin(T * .9) * 48; mom.aimT.set(la.x + Math.cos(ya) * s, la.y, la.z - Math.sin(ya) * s);
    if (mom.wait <= 0) mom.mode = 'walk';
  } else if (mom.mode === 'track') {
    mom.trackT -= dt; const dx = mom.trackP.x - P.x, dz = mom.trackP.z - P.z; mom.yaw = angDamp(mom.yaw, Math.atan2(dx, dz), 1.6, dt);
    mom.aimT.copy(mom.trackP);
    if (mom.trackT <= 0) { mom.mode = mom.prevMode === 'look' && mom.wait > 0 ? 'look' : 'walk'; if (!mom.said.lost) { mom.said.lost = 1; say('太太', '……是老鼠嗎？', '#f4bb72', 2.6); } }
  }
  P.y = momY(P.x, P.z);
  mom.aim.x = damp(mom.aim.x, mom.aimT.x, mom.mode === 'track' ? 2.2 : 3, dt); mom.aim.y = damp(mom.aim.y, mom.aimT.y, 3, dt); mom.aim.z = damp(mom.aim.z, mom.aimT.z, mom.mode === 'track' ? 2.2 : 3, dt);
  // body animation
  const R0 = mom.root; R0.position.copy(P); R0.rotation.y = mom.yaw;
  const prev = mom.phase; mom.phase += moveD / 62 * Math.PI; const ph = mom.phase;
  const walking = moveD > 0;
  mom.amp = .42 * humanGait(mom, ph, walking, dt); mom.chest.rotation.x = .03 + .04 * mom.amp / .42;
  // phone arm & head aim
  mom.root.updateMatrixWorld(true);
  const lp = V3(); mom.lens.getWorldPosition(lp); mom.lightPos.copy(lp);
  const ad = V3().subVectors(mom.aim, lp); const yawRel = Math.atan2(ad.x, ad.z) - mom.yaw; const yr = Math.atan2(Math.sin(yawRel), Math.cos(yawRel)); const pitch = Math.atan2(-ad.y, Math.hypot(ad.x, ad.z));
  const A1 = mom.arms[1]; A1.sh.rotation.set(-.62 - clamp(-pitch, -.5, .9) * .35, clamp(yr, -.7, .7) * .5, 0); A1.el.rotation.x = -1.05 + clamp(pitch, -.2, 1.1) * .45;
  mom.head.rotation.y = damp(mom.head.rotation.y, clamp(yr, -.8, .8), 4, dt); mom.head.rotation.x = damp(mom.head.rotation.x, clamp(pitch * .55, -.2, .6), 4, dt);
  mom.lightDir.copy(ad).normalize();
  flashLight.position.copy(lp); flashLight.target.position.copy(mom.aim); flashLight.intensity = 105000;
  flashBeamRec.o.copy(lp); flashBeamRec.d.copy(mom.lightDir); flashBeamRec.k = .055; flashBeam.material.uniforms.uK.value = .05; aimBeam(flashBeam, lp, mom.aim);
  // footsteps
  if (walking && Math.floor(prev / Math.PI) !== Math.floor(ph / Math.PI)) {
    const Lg = mom.legs[Math.floor(ph / Math.PI) % 2 === 0 ? 0 : 1]; const fp = V3(); Lg.ankle.getWorldPosition(fp); fp.y = P.y;
    const dist = leader ? Math.hypot(leader.pos.x - fp.x, leader.pos.y - fp.y, leader.pos.z - fp.z) : 999;
    SND.thud(clamp(1.15 - dist / 420, .08, 1)); cam.shake = Math.max(cam.shake, clamp(1 - dist / 260, 0, 1) * .9);
    for (let i = 0; i < 6; i++) emit(V3(fp.x + R(-6, 6), fp.y + .5, fp.z + R(-8, 12)), V3(R(-14, 14), R(4, 14), R(-14, 14)), new THREE.Color(.22, .2, .18), R(.5, 1.1), R(.6, 1.2), 20, 2.5);
    if (leader && STATE === 'play' && Math.hypot(leader.pos.x - fp.x, leader.pos.z - (fp.z + 4)) < 14 && Math.abs(leader.pos.y - fp.y) < 8) knock(leader, fp, '差點被踩扁！');
  }
}
function knock(C, from, msg) {
  if (NET.on && !mine(C)) return;
  C.on = null; C.hop = null;
  const dx = C.pos.x - from.x, dz = C.pos.z - from.z, d = Math.hypot(dx, dz) || 1;
  C.climbing = false; C.mantle = null; C.vel.set(dx / d * 42, 52, dz / d * 42); C.grounded = false; C.tumble = .9; C.crouch = false; if (msg) toast(msg);
}

// ---------- observer effect: being seen collapses the shrunken state ----------
function updDetect(dt) {
  if (!mom.active || STATE !== 'play' || mom.mode === 'door') { meter = Math.max(0, meter - dt * .3); return; }
  const L = leader; const tp = V3(L.pos.x, L.pos.y + L.h * .55, L.pos.z); const o = mom.lightPos; const d = V3().subVectors(tp, o); const dist = d.length(); d.divideScalar(dist);
  const cosA = d.dot(mom.lightDir); let seen = 0;
  if (dist < 480 && cosA > Math.cos(.36) && !rayBlocked(o, d, dist - 1.2, false)) seen = (1.2 - dist / 520) * (L.crouch ? .5 : 1) * (.55 + .45 * sstep(Math.cos(.36), 1, cosA));
  const md = Math.hypot(L.pos.x - mom.pos.x, L.pos.z - mom.pos.z);
  if (md < 80 && L.pos.y < BO.y + 30 && L.spd > 2 && !L.crouch) { const fx = Math.sin(mom.yaw), fz = Math.cos(mom.yaw); if (((L.pos.x - mom.pos.x) * fx + (L.pos.z - mom.pos.z) * fz) / md > .25) seen = Math.max(seen, .4); }
  if (seen > 0) {
    meter += seen * dt * .95;
    if (meter > .3 && mom.mode !== 'track' && mom.mode !== 'closing') { mom.prevMode = mom.mode; mom.mode = 'track'; if (!mom.said.sus) { mom.said.sus = 1; say('太太', '嗯？……什麼東西在動？', '#f4bb72', 2.6); } }
    if (mom.mode === 'track') { mom.trackT = 2.2; mom.trackP = tp.clone(); }
  } else meter -= dt * .22;
  meter = clamp(meter, 0, 1);
  if (meter >= 1) fail();
}
function fail() {
  STATE = 'fail'; failT = 0; fails++; SND.heart(1); tone(1800, 600, .8, .08, 'triangle'); nz(1.2, 4200, 1, .08, 'highpass');
  const [n, , c] = toyWho(TOY.lastWho || (LEVEL === 'basement' || LEVEL === 'kitchen' ? 'mom' : '')); say(n, '……！', c, 2);   // whoever caught the last of you
}
function respawn() {
  stkClear(); toyUnfreezeAll();
  if (NET.on) for (const C of party) { C.owner = C.baseOwner; C.carried = false; C.carry = null; }
  const p = CPS[cp] || CPS[0]; const L = leader; const off = NET.on ? IDS.indexOf(L.id) * 3 : 0; L.pos.set(p[0] + off, p[1], p[2]); L.vel.set(0, 0, 0); L.climbing = false; L.mantle = null; L.tumble = 0; L.grounded = true; L.crouch = false;
  let i = 0; for (const F of party) if (F !== L && mine(F)) { i = NET.on ? IDS.indexOf(F.id) : i + 1; F.pos.set(p[0] + i * (cp === 1 ? 3.4 : 2.6), p[1], p[2] + (cp === 1 ? 0 : i * 2.2)); F.queue = []; F.qst = 'idle'; F.state = 'idle'; F.disp.copy(F.pos); F.offK = 0; }
  trail = []; L.lastTrail.copy(L.pos); meter = 0; LVL.reset(); cam.tgt.copy(L.pos);
}

// ---------- HUD ----------
let subT = 0, toastT = 0;
function say(name, text, color, dur = 3) { $('subn').textContent = name; $('subn').style.color = color || 'var(--amber)'; $('subt').textContent = text; $('sub').classList.add('on'); subT = dur; }
function toast(t, dur = 2.6) { $('toast').textContent = t; $('toast').classList.add('on'); toastT = dur; }
// online, a portrait carries its player's name (the character's name moves to the small line); the computer's keep theirs
function partyName(id) { const p = NET.on && NET.slots[id]; if (!p) return SP[id].name; return (p === NET.me ? nameOf(p) || myName() : nameOf(p)) || 'P' + (NET.order.indexOf(p) + 1); }
function refreshPartyHUD() {
  for (const id of IDS) { const el = $('pm-' + id); if (!el) continue; const C = chars[id]; { const b = el.querySelector('b'), nm = partyName(id); if (b && b.textContent !== nm) { b.textContent = nm; el.title = NET.on && NET.slots[id] ? `${nm} · ${SP[id].name}` : nm; } } el.classList.toggle('on', leader && leader.id === id); el.classList.toggle('toy', !!C.frozen); const sm = el.querySelector('small'); if (sm && party.includes(C)) sm.textContent = C.frozen ? (C.toyAt === 'box' ? '在玩具箱' : C.toyAt === 'hand' ? '被拿走了' : '變成玩具') : NET.on ? (NET.slots[id] ? SP[id].name : TR('電腦')) + ((C.stamMax || 100) < 100 ? ` · ${C.stamMax}%` : '') : (C.stamMax || 100) < 100 ? `體力 ${C.stamMax}%` : SP[id].role; }
  if (!leader) return; for (const id of IDS) $('touch').classList.toggle(id, leader.id === id); tbLabel('tbAct', ({ cham: '舌', sq: '抱', hog: '滾', coon: '彈', rab: '跳', frog: '跳', bat: '聲', tort: '殼', mole: '鑽' })[leader.id] || '抱', TB_ACT[leader.id] || TB_ACT.sq); tbLabel('tbScout', leader.id === 'frog' ? '電' : '偵察', leader.id === 'frog' ? TB_ZAP : TB_EYE); $('tbCrouch').classList.toggle('dn', !!leader.crouch); $('an').textContent = leader.S.abil; $('ad').textContent = leader.S.desc; $('cells').style.display = leader.id === 'dad' ? 'flex' : 'none';
}
function buildPartyHUD() {
  const has = id => party.includes(chars[id]); const order = IDS.filter(has).map((id, i) => [id, i + 1]);
  $('party').classList.toggle('many', order.length > 4);
  $('party').innerHTML = order.map(([id, k]) => `<div class="pm${!has(id) ? ' lock' : ''}" id="pm-${id}" data-id="${id}"><div class="ph">${PORTRAITS[id] ? `<img alt="${SP[id].name}" src="${PORTRAITS[id]}">` : ''}</div><b>${SP[id].name}</b><small>${!has(id) ? '在牆裡等你' : SP[id].role}</small>${has(id) ? `<kbd>${k}</kbd>` : ''}</div>`).join('');
  document.querySelectorAll('.pm[data-id]').forEach(el => el.addEventListener('pointerdown', e => { const id = el.dataset.id; if (has(id)) { e.preventDefault(); pressed['sw_' + id] = true; } }));
  refreshPartyHUD(); partyLayout();
}
// phone: the portraits sit top-right; a big party wraps into two even rows, and the eye (and the status
// under it) sits in the middle of whatever room is left between the quest card and the portraits
function partyLayout() {
  const P = $('party'), R = document.documentElement;
  if (!TOUCH) { P.style.maxWidth = ''; return; }
  const n = P.children.length; if (!n) return;
  const cs = getComputedStyle(P), pr = parseFloat(cs.right) || 62, gap = parseFloat(cs.columnGap) || 5, w = P.children[0].offsetWidth || 34;
  const fit = Math.max(3, Math.floor((innerWidth / 2 - pr - 70 + gap) / (w + gap))), cols = n <= fit ? n : Math.ceil(n / 2);
  P.style.maxWidth = (cols * w + (cols - 1) * gap + 1) + 'px';
  const b = P.getBoundingClientRect(), q = $('quest').getBoundingClientRect(), qR = q.width ? q.right : 0;
  const cx = Math.min(innerWidth / 2, (qR + b.left) / 2);
  R.style.setProperty('--partyB', Math.round(b.bottom) + 'px');
  R.style.setProperty('--eyeX', Math.round(cx) + 'px');
  R.style.setProperty('--eyeW', Math.round(Math.max(100, Math.min(280, 2 * Math.min(cx - qR, b.left - cx) - 16))) + 'px');
}
QUESTS = [
  { t: '離開工作枱', s: '找路下到地面。你很輕，直接跳下去也不會受傷' },
  { t: '找到牆腳的裂縫', s: '左邊牆腳，好像有人在等你' },
  { t: '移開紙箱', s: '熊可以推開它，或者用爸爸的尺寸槍把它縮小' },
  { t: '跟着前拍檔進入牆內', s: '穿過牆腳的洞，沿着隧道走' }
];
const BASE_Q = QUESTS;
function setQuest(q) { quest = q; if (!QUESTS[q]) return; $('qt').textContent = QUESTS[q].t; $('qs').textContent = QUESTS[q].s; questOpen(); if (TOUCH) requestAnimationFrame(partyLayout); }
let _qT = 0; function questOpen() { const el = $('quest'); el.classList.add('open'); clearTimeout(_qT); _qT = setTimeout(() => el.classList.remove('open'), 7000); }
$('quest').addEventListener('pointerdown', e => { if (TOUCH) { e.stopPropagation(); questOpen(); } });
const _pv = V3();
function project(p, el, offX = 0, offY = 0, clampEdge = false) {
  _pv.copy(p).project(camera); let x = (_pv.x * .5 + .5) * innerWidth, y = (-_pv.y * .5 + .5) * innerHeight; const behind = _pv.z > 1;
  if (clampEdge) { if (behind) { x = innerWidth - x; y = innerHeight - 40; } const mx = TOUCH ? 84 : 60; x = clamp(x, mx, innerWidth - mx); y = clamp(y, TOUCH ? 90 : 170, innerHeight - (TOUCH ? 120 : 170));
    const q = $('quest'); if (q && q.offsetParent) { const r = q.getBoundingClientRect(); if (x < r.right + 30 && y < r.bottom + 28) y = r.bottom + 28; } }   // never on top of the quest card
  el.style.left = (x + offX) + 'px'; el.style.top = (y + offY) + 'px'; return !behind;
}
let lastHint = '';
function hint(h) { if (h !== lastHint) { $('hint').innerHTML = h; lastHint = h; } $('hint').classList.toggle('on', !!h); }
function updHUD(dt) {
  if (subT > 0) { subT -= dt; if (subT <= 0) $('sub').classList.remove('on'); }
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').classList.remove('on'); }
  if (STATE !== 'play' && STATE !== 'fail') { hint(''); $('mk').classList.remove('on'); $('stam').classList.remove('on'); $('cross').classList.remove('on'); return; }
  const L = leader;
  $('eye').classList.toggle('on', mom.active || meter > .01 || LEVEL === 'kitchen');
  $('eyering').setAttribute('stroke-dashoffset', (175.9 * (1 - meter)).toFixed(1));
  $('eyering').setAttribute('stroke', meter > .6 ? '#ff8f9f' : '#bff6ff');
  $('eyepupil').setAttribute('r', (4 + meter * 5).toFixed(1));
  $('eyet').textContent = LVL.eyeText();
  const cap = (L.stamMax || 100) / 100; const showSt = L.climbing || L.stamina < cap * 100 - .5 || cap < 1;
  $('stcap').style.strokeDasharray = `${(94.25 * (1 - cap)).toFixed(1)} 200`; $('stcap').style.transform = `rotate(${(-90 + 360 * cap).toFixed(1)}deg)`;
  $('protw').style.display = LVL.toys ? '' : 'none'; $('protn').textContent = PROTO;
  const fz = party.find(C => C.frozen); const ptg = fz && !L.frozen ? protoTarget(L) : null;
  $('touch').classList.toggle('proto', !!ptg && PROTO > 0);
  $('stam').classList.toggle('on', showSt && L.id !== 'gecko'); $('stam').classList.toggle('low', L.stamina < 30);
  if (showSt) { project(V3(L.pos.x, L.pos.y + L.h * .9, L.pos.z), $('stam'), 46, -10); $('stc').style.strokeDashoffset = (94.25 * (1 - L.stamina / 100)).toFixed(1); }
  const mkp = LVL.marker && !GHOST.on ? LVL.marker() : null;   // (a toy can't do the objective: no marker while you're a soul)
  if (mkp) { const on = project(mkp, $('mk'), 0, -18, true); $('mk').classList.add('on'); $('mkd').textContent = (Math.hypot(L.pos.x - mkp.x, L.pos.z - mkp.z) / 100).toFixed(1) + ' m'; } else $('mk').classList.remove('on');
  $('cross').classList.toggle('on', L.id === 'dad' || L.id === 'cham'); $('cross').classList.toggle('t', !!aimRes || !!tongueAim);
  $('cells').innerHTML = Array.from({ length: cellMax }, (_, i) => `<i class="${i < cells ? 'f' : ''}"></i>`).join('');
  let h = '';
  const ph = L.id === 'bear' && !STK ? pushTarget(L) : null;
  if (NET.on && L.frozen) h = L.toyAt === 'box' ? `你被收在${L.toyPlace || '某處'}裡——要隊友帶 Prototype 走過來救你` : L.toyAt === 'hand' ? '你正被拿走……' : (TOUCH ? '靈魂出竅：搖桿飄 · 「我喺度」叫隊友 · 撳上面頭像換鏡頭' : '靈魂出竅：WASD 飄 · Space／C 上落 · F 叫隊友 · 撳上面頭像或 Tab 換鏡頭');
  else if (NET.on && !mine(L)) h = '隊友正在帶着你行動……';
  else if (stackHintK && stackHintText()) h = stackHintText();
  else if (TOY.rescuing) h = `正在搖醒${TOY.rescuing.S.name}…… ${Math.min(99, Math.round(TOY.rescuing.rescueT / 1.4 * 100))}%`;
  else if (ptg && PROTO > 0 && !L.climbing) h = TOUCH ? `按「復活」用 Prototype 救回${ptg.S.name}（體力上限 -20%）` : `<kbd>R</kbd> 用 Prototype 救回${ptg.S.name}（體力上限 -20%）`;
  else if (fz && !L.climbing && fz.toyAt === 'box') h = PROTO > 0 ? `${fz.S.name}被收在${fz.toyPlace || '某處'}裡——帶着 Prototype 走到他旁邊、面向他按 ${TOUCH ? '「復活」' : '<kbd>R</kbd>'}` : `${fz.S.name}被收在${fz.toyPlace || '某處'}裡——要先找到 Prototype 藥水才救得回`;
  else if (fz && !L.climbing && fz.toyAt === 'hand') h = `${fz.S.name}正被拿走！`;
  else if (fz && !L.climbing && fz.toyAt === 'floor') h = `${fz.S.name}變成了玩具——趁還沒被收走，走到他旁邊就能搖醒他`;
  else if (L.id === 'cham' && tongueAim && !L.climbing) h = tongueAim.item ? (TOUCH ? '按「舌」用舌頭拿過來' : '左鍵 用舌頭拿過來') : (TOUCH ? '按「舌」黐住那裡飛過去' : '左鍵 吐舌頭黐住那裡飛過去');
  else if (L.id === 'cham' && L.camo > .85) h = '變色中——停着不動很難被看見';
  else if (L.id === 'sq' && L.carry) h = TOUCH ? `抱着${L.carry.S.name}——跳起按住「跳」一起滑翔 · 再按「抱」放下` : `抱着${L.carry.S.name}——跳起按住 <kbd>Space</kbd> 一起滑翔 · 左鍵放下`;
  else if (hxHint(L)) h = hxHint(L);
  else if (crewHint(L)) h = crewHint(L);
  else if (L.drag) h = TOUCH ? `拉住「${L.drag.r.name}」——向後行拖住走 · 再按「拉」放手` : `拉住「${L.drag.r.name}」——向後行拖住走 · 放開右鍵放手`;
  else if (ph) h = TOUCH ? `按「推」推動「${ph.name}」 · 按「拉」抓住拖走` : `左鍵 推「${ph.name}」 · 按住左鍵 推着走 · 按住右鍵 拉`;
  else if (TOUCH) {
    if (L.climbing) h = '推搖桿攀爬 · 按「跳」彈上去（用體力）· 向下拉再按「跳」跳開';
    else if (L.id === 'sq' && !L.grounded) h = '按住「跳」滑翔';
    else if (aimRes) h = `按「放大」或「縮小」改變「${aimRes.r.name}」`;
    else if (LEVEL === 'basement' && quest === 2 && L.id !== 'bear' && L.id !== 'dad') h = '點右上角頭像，換熊去推或換爸爸用尺寸槍';
    else if (LVL.hint(L)) h = LVL.hint(L);
    else if (L.crouch) h = '潛行中，比較不容易被發現';
    else if (playT < 14) h = NET.on ? '推搖桿撞向牆壁就會攀爬 · 按「表情」同隊友打招呼' : '推搖桿撞向牆壁就會攀爬 · 點頭像換角色';
  } else if (L.climbing) h = '<kbd>W</kbd><kbd>S</kbd> 上下 · <kbd>A</kbd><kbd>D</kbd> 橫移 · <kbd>Space</kbd> 彈上去（用體力）· <kbd>S</kbd>+<kbd>Space</kbd> 跳開';
  else if (L.id === 'sq' && !L.grounded) h = '按住 <kbd>Space</kbd> 滑翔';
  else if (aimRes) h = `左鍵 放大 · 右鍵 縮小「${aimRes.r.name}」`;
  else if (LEVEL === 'basement' && quest === 2 && L.id !== 'bear' && L.id !== 'dad') h = '<kbd>Tab</kbd> 換成熊去推，或換爸爸用尺寸槍';
  else if (LVL.hint(L)) h = LVL.hint(L);
  else if (L.crouch) h = '潛行中，比較不容易被發現 · <kbd>C</kbd> 站起來';
  else if (playT < 14) h = NET.on ? '走向牆壁按住 <kbd>W</kbd> 就會攀爬 · 按住 <kbd>T</kbd> 用表情' : '走向牆壁按住 <kbd>W</kbd> 就會攀爬 · <kbd>Tab</kbd> 換角色';
  hint(h);
}

// ---------- animation ----------
function animChar(C, dt) {
  if (C.frozen) { C.root.position.copy(C.pos); C.root.rotation.set(C.toyTilt || 0, C.yaw, C.toyRoll || 0); return; }
  if (C !== leader && C.tumble > 0) C.tumble = Math.max(0, C.tumble - dt);
  C.t += dt; const k = C.k, b = C.body, st = C.state, spd = C.spd || 0;
  C.root.position.copy(C !== leader && C.disp && party.includes(C) ? C.disp : C.pos); C.root.rotation.set(0, C.yaw, 0);
  let legA = 0, armA = 0, bob = 0, lean = 0, roll = 0, armZ = 0, legZ = 0, armX = 0, legT = 0, armAlt = 0;
  if (st === 'walk' || st === 'sneak' || st === 'stackwalk') {
    const prev = C.phase; C.phase += dt * spd / (.95 * k) * 1.25; const s = Math.sin(C.phase); const a = clamp(spd / 13, .35, 1);
    legA = s * .75 * a; armA = -s * .65 * a; bob = Math.abs(Math.cos(C.phase)) * .16 * k * a; lean = clamp(spd * .013, 0, .32); roll = s * .08 * a;
    if (st === 'stackwalk') { armA = 0; armX = -2.7 + s * .05; lean = .04; legZ = .18; roll *= 1.6; bob -= .1 * k; }
    if (C === leader && Math.floor(prev / Math.PI) !== Math.floor(C.phase / Math.PI)) SND.step(st === 'sneak' ? .3 : .8);
  } else if (st === 'air' || st === 'tumble') { legT = .55; armX = -1.1; armZ = .5; }
  else if (st === 'glide') { armZ = 1.35; legZ = .55; lean = 1.25; }
  else if (st === 'climb') { C.phase += dt * Math.max(spd, .001) / (.8 * k) * 1.6; const s = Math.sin(C.phase); armX = -2.55; armAlt = s * .35; legA = s * .35; legT = .35; lean = -.1;
    if (C.leap) { const q = Math.sin(Math.min(1, C.leap.t / LEAP.dur) * Math.PI); armX = -2.55 - .45 * q; armAlt = 0; legA = -.3 * q; legT = .35 - .3 * q; lean = -.1 - .1 * q; } }
  else if (st === 'crouch') { armX = -.4; }
  else if (st === 'stack') { armX = -2.75 + Math.sin(C.t * 4 + k) * .06; legZ = .3; bob = -.14 * k; lean = -.06; }
  else if (st === 'top') { armX = -2.45 + Math.sin(C.t * 3) * .14; armZ = .25; legZ = .12; lean = -.14; }
  else if (st === 'pull') { armX = -.9 + Math.sin(C.t * 9) * .08; lean = .95; bob = -.4 * k; legZ = .32; }
  else if (st === 'hang') { armX = -2.95; legT = .12; legA = Math.sin(C.t * 11) * .38; lean = .04; }
  else if (st === 'sit') { legT = 1.32 + (C.sitLeg || 0); legA = C.sitKick || 0; armX = .42; armZ = .05; lean = -.16; }   // sitting: legs out in front (down the slope), hands back on the roof
  const pushing = C.shoveT > 0 || (C.pushing && spd > .5);
  if (C.shoveT > 0) C.shoveT -= dt;
  if (pushing) { const s = C.shoveT > 0 ? Math.sin(clamp(1 - C.shoveT / .38, 0, 1) * Math.PI) : .85; armX = lerp(armX, -1.55, s); armA *= 1 - s; lean = Math.max(lean, .34 * s); armZ = -.1; }
  b.position.y = .92 * k + bob - (C.crouch ? .3 * k : 0) + Math.sin(C.t * 2.1) * .018 * k; if (st === 'sit') b.position.y = .4 * k + Math.sin(C.t * 1.6) * .012 * k;
  C.lean = damp(C.lean, lean, 9, dt); C.roll = damp(C.roll, roll, 10, dt);
  let bx = C.lean, bz = C.roll;
  if (C.tumble > 0) { C.spin += dt * 13; bx = C.spin; } else if (st === 'roll') { C.spin += dt * 24; bx = C.spin; } else C.spin = 0;
  if (C.rollT > 0) bx = (1 - C.rollT / .55) * Math.PI * 2;
  if (C.lieK > 0) { bx = lerp(bx, -1.5, C.lieK); b.position.y = lerp(b.position.y, .45 * k, C.lieK); }
  b.rotation.set(bx, 0, bz);
  C.squash = damp(C.squash, 0, 9, dt); const sq = C.squash; b.scale.set(1 + sq * .16, 1 - sq * .2, 1 + sq * .16);
  C.legs[0].rotation.set(-legA - legT, 0, -legZ); C.legs[1].rotation.set(legA - legT, 0, legZ);
  for (const a of C.arms) { const s = a.userData.s; const sw = s < 0 ? armA : -armA; a.rotation.set(sw + armX + (s < 0 ? armAlt : -armAlt), 0, s * (.22 + armZ)); }
  if (C.wave) { const a = C.arms[1]; a.rotation.set(0, 0, 2.55 + Math.sin(C.t * 9) * .32); }
  if (C.id === 'dad' && C === leader && aimRes && st !== 'climb') { C.arms[0].rotation.x = damp(C.arms[0].rotation.x, -1.45, 12, dt); }
  C.neck.rotation.y = damp(C.neck.rotation.y, C.look || 0, 4, dt); C.head.rotation.x = -C.lean * .45 + Math.sin(C.t * 1.3) * .03;
  C.ears.forEach((e, i) => { e.rotation.x = clamp(-C.vel.y * .005, -.4, .4) + Math.sin(C.t * 1.9 + i * 2) * .035 + bob * .8; });
  C.tail.forEach((g, i) => { g.rotation.y = Math.sin(C.t * 2.2 - i * .55) * (.1 + spd * .008); });
  C.blink -= dt; if (C.blink < 0) { C.blink = R(2, 5); C.blinkT = .13; }
  const bl = C.blinkT > 0 ? (C.blinkT -= dt, .08) : 1.12; for (const e of C.eyes) e.scale.y = bl;
  if (C.S.cham) chamAnim(C, dt);
  if (C.wing) { C.glideK = damp(C.glideK, st === 'glide' ? 1 : 0, 10, dt); for (const w of C.wing) { w.visible = C.glideK > .02; w.scale.y = Math.max(.01, C.glideK); } }
  ncAnim(C, dt, st); if (C.S.roo) rooAnim(C, dt, st); emoAnim(C, dt);
}

// ---------- flow ----------
function placeStart() {
  const D = chars.dad, S = chars.sq, B = chars.bear, K = chars.gecko;
  D.pos.set(-22, 92, -192).add(BO); D.yaw = 2.6; S.pos.set(-9, 92, -186).add(BO); S.yaw = -1.9; B.pos.set(-30, 92, -177).add(BO); B.yaw = 2.2;
  S.gap = 7; B.gap = 13.5; S.side = -3.4; B.side = 4; D.side = -3.4; for (const C of [D, S, B]) { C.lastTrail = C.pos.clone(); C.disp = C.pos.clone(); C.queue = []; C.state = 'idle'; C.stamina = 100; }
  K.pos.set(-305, 0, 150).add(BO); K.yaw = Math.PI / 2; K.state = 'idle'; K.root.visible = true; chars.cham.root.visible = false; chars.cham.pos.set(-30, 4, 12).add(HO); chars.cham.yaw = -2.2;
  leader = D; trail = [];
}
function startGame(ch = 0) {
  titleEnd();
  if (ch === 1) { $('start').hidden = true; playT = 0; fails = 0; requestLock(); loadLevel('wall'); return; }
  // the prologue starts inside the machine's field (the prep area); walking out drops you on the workbench
  $('start').hidden = true; playT = 0; quest = 0; cp = 0; meter = 0; fails = 0; requestLock(); loadLevel('portal');
}
const INTRO = [[.5, '爸爸', '……我、我真的變小了？', '#f5f0e6'], [2.5, '助手', '教授！我們全部都縮小了——還變成了動物？！', '#e8c9a8'], [4.6, '老友', '這張工作枱怎麼高得像懸崖一樣……', '#d9a675'], [6.6, '爸爸', '先下去。記住，千萬不能被任何人看見。一被看見，縮小態就會定型。', '#f5f0e6']];
function updIntro(dt) {
  introT += dt; const t = introT;
  for (const L of INTRO) if (t - dt < L[0] && t >= L[0]) say(L[1], L[2], L[3], L[0] === 6.6 ? 4.6 : 2.1);
  chars.sq.look = t > 2.5 && t < 4.5 ? .5 : 0;
  const k = sstep(0, 6.4, t);
  const p0 = V3(-24, 106, -150).add(BO), l0 = V3(-55, 101, -200).add(BO);
  cam.yaw = .55; cam.pitch = .22; const D = chars.dad;
  const dir = V3(Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch));
  const tg = V3(D.pos.x, D.pos.y + D.h * .8, D.pos.z); const p1 = tg.clone().addScaledVector(dir, 15);
  camera.position.lerpVectors(p0, p1, k); const look = V3().lerpVectors(l0, tg, k); camera.lookAt(look);
  bokeh.uniforms.focus.value = camera.position.distanceTo(look);
  cam.tgt.copy(D.pos); cam.tgt.y = tg.y; cam.curD = 15;
  if (t > 6.5 || ((pressed.Space || pressed.Enter) && t > 1.4)) { STATE = 'play'; $('hud').classList.remove('cine'); for (const C of party) C.lieK = 0; if (t < 6.5) say(INTRO[3][1], INTRO[3][2], INTRO[3][3], 4.6); }
}
function winBasement() {
  if (quest === 0 && leader.grounded && leader.pos.y < BO.y + 2) { setQuest(1); toast('下到地面了'); mom.timer = Math.min(mom.timer, 9); }
  if (quest >= 1) {
    const g = chars.gecko; const d = Math.hypot(leader.pos.x - (BO.x - 300), leader.pos.z - (BO.z + 150));
    if (d < 70 && !mom.said.gk) { mom.said.gk = 1; say('前拍檔', '教授？……真的是你？我在紙箱後面！', '#b7d38a', 3.4); }
    const c = crackBox.c; const blocked = c.z0 < BO.z + 154 && c.z1 > BO.z + 146 && c.x0 < BO.x - 293 && c.y1 > BO.y + 6;
    if (quest === 1 && d < 45 && blocked) setQuest(2);
    if (quest === 2 && !blocked) { setQuest(1); toast('路打開了！'); }
    if (!mom.said.lead) g.wave = !blocked && d < 120;
    // the way is open: she turns and leads everyone through the hole, along the tunnel and into the wall
    if (!blocked && d < 16 && leader.pos.y < BO.y + 3 && !mom.said.lead) {
      mom.said.lead = 1; g.wave = false; setQuest(3); say('前拍檔', '三年了……我一直在等你。快進來，牆裡面比較安全。', '#b7d38a', 4.5);
      npcWalk(g, [V3(-318, 0, 150).add(BO), V3(-345, 0, 150).add(BO), V3(70, 4, 15).add(HO), V3(30, 4, 8).add(HO), V3(-22, 4, -6).add(HO)], 13, () => { g.yaw = .9; });
    }
  }
}
function updCheckpoints() { if (!CPS) return; const who = NET.on ? playerChars().filter(C => !C.frozen) : [leader]; CPS.forEach((p, i) => { if (who.some(C => (C.grounded || !mine(C)) && Math.hypot(C.pos.x - p[0], C.pos.y - p[1], C.pos.z - p[2]) < 30)) cp = i; }); }
function updBatteries(dt) {
  for (const b of batteries) {
    if (b.got) continue; b.b.rotation.y += dt * 2; b.b.position.y = 1.4 + Math.sin(T * 2.4 + b.x) * .3; b.halo.position.y = b.y + b.b.position.y; b.halo.lookAt(camera.position);
    if (leader && STATE === 'play' && !leader.frozen && mine(leader) && Math.hypot(leader.pos.x - b.x, leader.pos.y + 1 - b.y - 1.2, leader.pos.z - b.z) < 3.4) netGet('bat', batteries.indexOf(b));
  }
}
function updTrap() {
  const t = STATIC.trap; if (!t || !t.armed || STATE !== 'play') return;
  if (Math.hypot(leader.pos.x - t.x, leader.pos.z - t.z) < 5 && leader.pos.y < BO.y + 2) { t.armed = false; t.bar.rotation.x = Math.PI / 2; SND.snap(); knock(leader, V3(t.x, BO.y, t.z + 4), '老鼠夾！好險……'); cam.shake = .6; }
}

// ---------- main loop ----------
let fpsAcc = 0, fpsN = 0, fpsLow = 0; const DYN = { k: 1 };
function update(dt) {
  T += dt; grade.uniforms.uT.value = T;
  if (STATE === 'loading') { pressed = {}; updParticles(dt); return; }
  $('batn').textContent = batteries.filter(q => q.got).length; $('batt').textContent = '/' + batteries.length; $('batw').style.display = batteries.length ? '' : 'none';
  if (LEVEL === 'basement') { machine.field.material.uniforms.uT.value = T;
  const fl = .75 + Math.sin(T * 13) * .08 + (rnd() < .04 ? R(-.5, .6) : 0); machine.light.intensity = 900 * fl; machine.field.material.uniforms.uK.value = .85 + (fl - .75);
  if (rnd() < dt * 1.3) { const a = R(0, 6.28); const p = V3(machine.x + Math.cos(a) * 17, machine.y + Math.sin(a) * 17, machine.z + 1); for (let i = 0; i < 14; i++) emit(p, V3(R(-25, 25), R(5, 40), R(-10, 25)), rnd() < .5 ? new THREE.Color(3, 1.6, .5) : new THREE.Color(.8, 3, 2.8), R(.12, .25), R(.3, .9), 220, .5); if (leader) SND.crack(clamp(1 - leader.pos.distanceTo(V3(machine.x, machine.y, machine.z)) / 200, 0, 1)); } }
  updRings(dt); updPebbles(dt); pouchUpdate(dt); if (STATE === 'play') { bearHold(dt); if (!NET.client) { updSlides(dt); updPushFall(dt); } } updResizables(dt); if (LVL && LVL.toys && STATE !== 'loading') updToys(dt); updTongue(dt); updScout(dt); updWatch(); updBatteries(dt); updParticles(dt);
  if (STATE === 'title') updTitle(dt);
  else if (STATE === 'cine') cineTick(dt);
  else if (STATE === 'intro') { updIntro(dt); for (const C of party) { C.state = 'idle'; C.spd = 0; } }
  else if (STATE === 'play') {
    playT += dt;
    if (!NET.on && !EMO.open && !POUCH.open) for (let i = 0; i < party.length; i++) if (pressed['Digit' + (i + 1)]) switchTo(party[i]);
    if (!NET.on) if (pressed.Tab) { const act = party.filter(C => !C.frozen); if (act.length > 1) switchTo(act[(act.indexOf(leader) + 1) % act.length]); }
    if (pressed.KeyR) useProto();
    if (!NET.on) for (const C of party) if (pressed['sw_' + C.id]) switchTo(C);
    if (pressed.KeyC || pressed.Tab) setTimeout(refreshPartyHUD, 30);
    if (pressed.KeyH) { hudOn = !hudOn; $('hud').classList.toggle('off', !hudOn); }
    if (pressed.KeyF && !GHOST.on) stackPress(); crewInput(leader, !leader.frozen && mine(leader));
    const lockL = !mine(leader) || leader.frozen || !!leader.on || !!leader.hop || leader.pullT > 0 || !!leader.ptw;
    if (!lockL) { const sub = dt > 1 / 30 ? 2 : 1; for (let s = 0; s < sub; s++) updLeader(leader, dt / sub); bearDrag(dt); }
    updHops(dt); stackInput(); stackSolve(dt);
    if (!lockL) pushTrail(leader); for (const F of party) if (F !== leader && !F.on && !F.hop && !F.drop && !F.frozen && !F.carried && !F.ptw && mine(F) && !isBase(F)) updFollower(F, leader, dt);
    updCarry(dt); updTongueAim(); updVentFx(dt);
    stackScan(dt);
    updAim(); LVL.detect(dt); if (!NET.client) updCheckpoints(); LVL.update(dt); if (!NET.client) LVL.win();
    cellT += dt; if (cells < cellMax && cellT > 10) { cells++; cellT = 0; } if (cells >= cellMax) cellT = 0;
    updCam(dt); hideOccluders();
    if (meter > .4 && Math.floor((T - dt) * (1 + meter * 1.5)) !== Math.floor(T * (1 + meter * 1.5))) SND.heart(meter);
  } else if (STATE === 'frozen') {
    failT += dt; updCam(dt); hideOccluders(); $('dead').classList.remove('on'); if (failT > 2.3) toyHandOff();
  } else if (STATE === 'fail') {
    failT += dt; updCam(dt); hideOccluders();
    $('dead').classList.toggle('on', failT > .5 && failT < 2.6);
    if (failT > 2.4 && failT - dt <= 2.4) respawn();
    if (failT > 3.2) { STATE = 'play'; $('dead').classList.remove('on'); }
  } else if (STATE === 'end') {
    endT += dt; updCam(dt); if (STK) stkClear(); for (const F of party) if (F !== leader && !F.frozen) updFollower(F, leader, dt); hideOccluders();
    if (endT > 3.6 && $('end').hidden) { const E = END_TXT || (NET.on ? ['第一章（多人）· 完', '零件與電池', '三個零件和電池都齊了。從通風口爬出去——下一站：車房的工作枱。'] : ['第一章 · 完', '找回核心', '核心找回來了，但它的光越來越弱。']); $('endA').textContent = E[0]; $('endB').textContent = E[1]; $('endC').textContent = E[2]; $('st3l').textContent = '鈕扣電池（總數）'; $('st3').textContent = gotBat;
      $('end').hidden = false; $('hud').classList.add('off'); $('touch').hidden = true; if (document.pointerLockElement) document.exitPointerLock();
      const m = Math.floor(playT / 60), s = Math.floor(playT % 60); $('st1').textContent = `${m}:${String(s).padStart(2, '0')}`; $('st2').textContent = fails; $('st3').textContent = `${gotBat}/${batteries.length}`;
    }
  }
  zoneTick(dt); if (WORLD && (ZONES.kitchen.near || LEVEL === 'kitchen')) updLiving(dt);
  if (NET.client) { if (STATE !== 'cine') netNPC(dt); } else for (const Z of ZL) { const D = LEVELS[Z.id]; if (!D || !D.npc) continue; if (Z.id === LEVEL || (Z.near && Z.prepped && D.npcNear) || (NET.on && Z.prepped && D.npcNear && playerChars().some(C => inZone(Z, C.pos.x, C.pos.y, C.pos.z, 60)))) D.npc(dt); }
  mpObjectives(); portalTick(dt); mpProTick(dt); unstuckTick(dt); ghostTick(dt);
  const cr = STATE === 'frozen' ? clamp(1 - failT / 2.3, 0, 1) * .8 : STATE === 'fail' ? clamp(failT / .7, 0, 1) * (failT < 2.4 ? 1 : clamp(1 - (failT - 2.4) / .8, 0, 1)) : meter * .55;
  grade.uniforms.uCrys.value = damp(grade.uniforms.uCrys.value, cr, 8, dt);
  grade.uniforms.uFlash.value = STATE === 'fail' && failT > .6 && failT < 1.1 ? (1 - Math.abs(failT - .85) / .25) * .5 : 0;
  grade.uniforms.uFade.value = STATE === 'end' ? clamp((endT - 2) / 1.6, 0, .85) : STATE === 'fail' ? clamp((failT - 2) / .4, 0, 1) * clamp((3.2 - failT) / .8, 0, 1) : 0;
  netUpdate(dt);
  for (const id in chars) animChar(chars[id], dt);
  updHUD(dt);
  pressed = {};
}
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame); musicFrame();
  // a frame time that goes backwards (it happens: tab switches, some phones) must never reach the physics — a negative step turned into NaN positions
  const raw = (now - last) / 1000; last = now; const dt = raw > 0 ? Math.min(.05, raw) : 1 / 240; vcFrame(dt); netLogTick(dt); emoTick(dt); watchTick(); pouchTick(dt);
  { const [w, h] = viewSize(); if (w !== RS.w || h !== RS.h) onResize(); }
  if (STATE === 'load') return;
  if (!PAUSED || NET.on) update(dt * POUCH.slow);   // (the kangaroo's pouch slows time while it's open)
  if (window.__CAMO) { camera.position.set(...window.__CAMO.p); camera.lookAt(...window.__CAMO.t); if (ST.sky) ST.sky.position.set(camera.position.x - 2100, 0, camera.position.z - 800); }   // dev: a fixed camera for screenshots
  if (!window.__NR) composer.render();
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 2) {
    const fps = fpsN / fpsAcc; NLOG.fps = fps; $('fps').textContent = Math.round(fps) + ' fps · ' + ({ high: '高', med: '中', low: '低' })[QUAL]; fpsAcc = 0; fpsN = 0;
    if ((STATE === 'play' || STATE === 'title') && !PAUSED && TOUCH && QUAL === 'low') { const k0 = DYN.k; if (fps < 27) DYN.k = Math.max(.7, DYN.k - .1); else if (fps > 50) DYN.k = Math.min(1, DYN.k + .1); if (DYN.k !== k0) applyQ('low'); }
    if (STATE === 'play' && !PAUSED) { if ((QUAL === 'high' && fps < 30) || (QUAL === 'med' && fps < 22)) { if (++fpsLow >= 2) { applyQ(QUAL === 'high' ? 'med' : 'low'); toast('畫質已自動調低，保持流暢'); fpsLow = 0; } } else fpsLow = 0; }
  }
}
// phones report stale sizes around a rotation: the canvas always fills the screen by CSS, and the
// drawing size is re-checked every frame so it settles on the real size
const RS = { w: 0, h: 0 };
function viewSize() { const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight; return [Math.max(1, w), Math.max(1, h)]; }
function onResize() {
  if (canvas.style.width || canvas.style.height) canvas.style.width = canvas.style.height = '';
  const [w, h] = viewSize(); RS.w = w; RS.h = h; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  grade.uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio()); fxaa.material.uniforms.resolution.value.set(1 / (w * renderer.getPixelRatio()), 1 / (h * renderer.getPixelRatio()));
  const sc = h * renderer.getPixelRatio() / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)); onResizeDust(sc); if (parts) parts.material.uniforms.uScale.value = sc;
}
addEventListener('resize', () => { onResize(); partyLayout(); }); addEventListener('orientationchange', () => { onResize(); setTimeout(onResize, 250); setTimeout(() => { onResize(); partyLayout(); }, 700); }); if (window.visualViewport) visualViewport.addEventListener('resize', onResize);
function applyQ(q) {
  QUAL = q; const P = { high: [Math.min(devicePixelRatio, 1.5), true, true, 16], med: [Math.min(devicePixelRatio, 1.1), true, false, 12], low: [TOUCH ? Math.min(devicePixelRatio, 1.25) * DYN.k : .85, false, false, TOUCH ? 5 : 8] }[q];
  BLOOM_K = q === 'low' ? .5 : 1; fxaa.enabled = TOUCH || q === 'low'; grade.uniforms.uGrain.value = TOUCH ? .014 : .035;
  renderer.setPixelRatio(P[0]); composer.setPixelRatio(P[0]); onResize(); gtao.enabled = P[1]; bokeh.enabled = P[2]; setShells(P[3]);
  document.querySelectorAll('.sel button').forEach(b => b.classList.toggle('on', b.dataset.q === q));
}
function pause() { PAUSED = true; $('pause').hidden = false; document.body.classList.add('paused'); $('pauseMP').hidden = !NET.on; if (NET.on) $('pauseCode').textContent = NET.code; pauseRefresh(); }
function resume() { PAUSED = false; $('pause').hidden = true; $('pause').classList.remove('covered'); document.body.classList.remove('paused'); $('help').hidden = true; $('roster').hidden = true; last = performance.now(); requestLock(); }
document.querySelectorAll('.sel button[data-q]').forEach(b => b.addEventListener('click', () => applyQ(b.dataset.q)));
$('go').addEventListener('click', () => { audioInit(); cineStart(); });   // the prologue opens with the short film (e37_cine)
$('resume').addEventListener('click', () => { audioInit(); resume(); });
$('again').addEventListener('click', () => location.reload());

// ---------- phone controls: floating joystick (left), camera drag (right), buttons ----------
let camTouch = null;
// phone buttons: an icon and a small label (the character's own move changes both)
const TB_ACT = {"sq": "<rect x=\"6\" y=\"10\" width=\"12\" height=\"9\" rx=\"1.6\"/><path d=\"M4 7.5l4 2.5M20 7.5L16 10\"/>", "cham": "<path d=\"M3 12h9.5a3.8 3.8 0 1 1 3.8 3.8\"/><circle cx=\"16.3\" cy=\"12\" r=\"1.1\"/>", "hog": "<circle cx=\"13.5\" cy=\"12\" r=\"6\"/><path d=\"M3.5 8.5h3M2.5 12.5h3M4 16.5h3\"/>", "coon": "<path d=\"M4 18.5C7 10 12.5 6.5 19.5 6\"/><circle cx=\"19\" cy=\"6\" r=\"2.2\"/><path d=\"M4 21h4\"/>", "rab": "<path d=\"M3.5 19.5c2-8 5-12 8.5-12s6.5 4 8.5 12\"/><path d=\"M12 3v2.5\"/>", "frog": "<path d=\"M3.5 19.5c2-8 5-12 8.5-12s6.5 4 8.5 12\"/><path d=\"M12 3v2.5\"/>", "bat": "<circle cx=\"5.5\" cy=\"12\" r=\"1.6\"/><path d=\"M9.5 8.6a4.8 4.8 0 0 1 0 6.8\"/><path d=\"M13 5.6a9 9 0 0 1 0 12.8\"/><path d=\"M16.6 2.8a13 13 0 0 1 0 18.4\"/>", "tort": "<path d=\"M3 16.5a9 9 0 0 1 18 0z\"/><path d=\"M8 16.5l1.6-5h4.8l1.6 5M12 7.6v3.9\"/>", "mole": "<path d=\"M3 14.5h18\"/><path d=\"M12 3v8.5\"/><path d=\"M8.6 8.2L12 11.6l3.4-3.4\"/><path d=\"M5.5 18.5h2.5M10.8 18.5h2.5M16 18.5h2.5\"/>"};
const TB_EYE = "<path d=\"M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z\"/><circle cx=\"12\" cy=\"12\" r=\"2.8\"/>", TB_ZAP = "<path d=\"M13 2.5L5 13.5h6l-1 8 8-11h-6z\"/>";
function tbLabel(id, label, icon) { const b = $(id); if (!b) return; const ti = b.querySelector('.ti'); if (!ti) { b.textContent = label; return; } const lb = ti.querySelector('b'); if (lb && lb.textContent !== TR(label)) lb.textContent = TR(label); const sv = ti.querySelector('svg'); if (sv && icon && sv.dataset.k !== icon.length + label) { sv.innerHTML = icon; sv.dataset.k = icon.length + label; } }
// a short tick in the hand when a button goes down (Android; iPhones don't let web pages do this)
function haptic(ms = 8) { if (!SET.haptic && SET.haptic !== undefined) return; try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } }
// phones: play full-screen and sideways, like an installed game (Android; on iPhone, 'Add to Home Screen' does it)
function goFull() { if (!TOUCH || document.fullscreenElement) return; const el = document.documentElement; try { const r = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen && el.webkitRequestFullscreen(); if (r && r.then) r.then(() => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } }).catch(() => { }); } catch (e) { } }
const TB_MIC = '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.6 11a6.4 6.4 0 0 0 12.8 0"/><path d="M12 17.4V21"/>', TB_MICOFF = TB_MIC + '<path d="M4 4l16 16"/>';
// any menu button on a phone: go full-screen (it has to come from a tap)
document.addEventListener('click', e => { if (TOUCH && e.target.closest('.ov button, .ov .ch')) goFull(); }, true);
function setupTouch() {
  const T = $('touch'); const base = $('joyBase'), knob = $('joyKnob'); const RAD = 54;
  const drawJoy = () => { base.style.left = joy.ox + 'px'; base.style.top = joy.oy + 'px'; knob.style.transform = `translate(${joy.x * RAD}px,${-joy.y * RAD}px)`; };
  T.addEventListener('pointerdown', e => {
    if (e.target.closest('.tb')) return; e.preventDefault();
    if (STATE !== 'play' || PAUSED) return;
    if (e.clientX < innerWidth * .45 && joy.id === null) { joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.x = joy.y = 0; joy.on = true; base.classList.add('on'); drawJoy(); T.classList.add('used'); }
    else if (!camTouch) camTouch = { id: e.pointerId, x: e.clientX, y: e.clientY };
    try { T.setPointerCapture(e.pointerId); } catch (er) { }
  });
  T.addEventListener('pointermove', e => {
    if (e.pointerId === joy.id) {
      let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const d = Math.hypot(dx, dy);
      if (d > RAD) { joy.ox += dx * (1 - RAD / d); joy.oy += dy * (1 - RAD / d); dx = e.clientX - joy.ox; dy = e.clientY - joy.oy; }
      joy.x = dx / RAD; joy.y = -dy / RAD; drawJoy();
    } else if (camTouch && e.pointerId === camTouch.id) { mouseDX += (e.clientX - camTouch.x) * 2.6; mouseDY += (e.clientY - camTouch.y) * 2.2; camTouch.x = e.clientX; camTouch.y = e.clientY; }
  });
  const end = e => { if (e.pointerId === joy.id) { joy.id = null; joy.on = false; joy.x = joy.y = 0; base.classList.remove('on'); } if (camTouch && e.pointerId === camTouch.id) camTouch = null; };
  T.addEventListener('pointerup', end); T.addEventListener('pointercancel', end);
  const hold = (id, on, off) => {
    const b = $(id);
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (STATE !== 'play' && id !== 'tbPause' && !(STATE === 'intro' && id === 'tbJump')) return; b.classList.remove('pr'); void b.offsetWidth; b.classList.add('pr'); haptic(id === 'tbJump' ? 12 : 8); on(); try { b.setPointerCapture(e.pointerId); } catch (er) { } });
    const up = () => { b.classList.remove('pr'); off && off(); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
  };
  hold('tbJump', () => { pressed.Space = true; keys.Space = true; }, () => { keys.Space = false; });
  hold('tbCrouch', () => { pressed.KeyC = true; keys.GDown = true; }, () => { keys.GDown = false; });
  hold('tbPing', () => { pressed.GPing = true; });
  hold('tbSwap', () => { pressed.Tab = true; });
  hold('tbGrow', () => fireGun(true)); hold('tbShrink', () => fireGun(false));
  hold('tbStack', () => { pressed.KeyF = true; });
  hold('tbProto', () => { pressed.KeyR = true; });
  hold('tbUse', () => { pressed.KeyE = true; });
  hold('tbAct', () => { const id = leader.id; if (id === 'cham') chamTongue(); else if (id === 'sq') sqCarry(); else if (id === 'hog') hogRoll(); else if (id === 'coon') coonThrow(); else if (id === 'rab' || id === 'frog') keys.Mouse0 = true; else if (id === 'bat') batPing(); else if (id === 'tort') tortShell(); else if (id === 'mole') moleDig(); }, () => { keys.Mouse0 = false; });
  hold('tbScout', () => { if (leader.id === 'frog') frogSwitch(); else sqScout(); });
  hold('tbPush', () => { keys.TPush = true; bearShove(); }, () => { keys.TPush = false; });
  hold('tbPull', () => { keys.TPull = !keys.TPull; $('tbPull').classList.toggle('on', keys.TPull); }, () => { });
  hold('tbPause', () => { if (STATE === 'play' || STATE === 'intro') pause(); });
  T.addEventListener('contextmenu', e => e.preventDefault());
}
function makePortraits() {
  try {
    const pr = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); pr.setSize(160, 160); pr.setPixelRatio(1);
    pr.toneMapping = THREE.ACESFilmicToneMapping; pr.toneMappingExposure = 1.15; pr.setClearColor(0x000000, 0);
    const ps = new THREE.Scene(); const pm = new THREE.PMREMGenerator(pr); ps.environment = pm.fromScene(new RoomEnvironment(), .04).texture; ps.environmentIntensity = .55;
    const key = new THREE.DirectionalLight(0xffe2c0, 2.4); key.position.set(3, 5, 6); ps.add(key); const rim = new THREE.DirectionalLight(0x9fc6ff, 2.6); rim.position.set(-4, 3, -5); ps.add(rim);
    const pc = new THREE.PerspectiveCamera(24, 1, .1, 100);
    for (const id of IDS) {
      const C = chars[id]; const par = C.root.parent; const pp = C.root.position.clone(), rr = C.root.rotation.clone(), vis = C.root.visible, st = C.state; C.root.visible = true; if (st === 'roost' || st === 'shell') { C.state = 'idle'; C.shellK = 0; animChar(C, .016); } ps.add(C.root); C.root.position.set(0, 0, 0); C.root.rotation.set(0, -.35, 0);
      const hy = 3.55 * C.k; pc.position.set(1.4 * C.k, hy + .5 * C.k, 9 * C.k); pc.lookAt(0, hy - .1 * C.k, 0); pr.render(ps, pc); PORTRAITS[id] = pr.domElement.toDataURL('image/png');
      par.add(C.root); C.root.position.copy(pp); C.root.rotation.copy(rr); C.root.visible = vis; C.state = st;
    }
    pm.dispose(); pr.dispose(); pr.forceContextLoss && pr.forceContextLoss();
  } catch (e) { console.warn('portraits', e); }
  buildPartyHUD();
}

async function init() {
  setLoad(.05, '載入字體…');
  try { await Promise.race([Promise.all(['500 20px "LXGW WenKai TC"', '700 20px "Noto Sans TC"', '600 20px Fredoka', '600 20px Caveat'].map(f => document.fonts.load(f, '爸爸最棒第測試縮小態被觀測ABC'))), new Promise(r => setTimeout(r, 3500))]); } catch (e) { }
  setLoad(.15, '生成材質…'); await tick(); makeMaterials();
  setLoad(.3, '喚醒角色…'); await tick();
  for (const id of ['dad', 'sq', 'bear', 'gecko', 'cham', 'hog', 'rab', 'coon', 'frog', 'bat', 'tort', 'mole']) chars[id] = makeChar(id);
  for (const id of ['hog', 'rab', 'coon', 'frog', 'bat', 'tort', 'mole']) { chars[id].root.visible = false; chars[id].pos.set(0, -900, 0); }
  party.push(chars.dad, chars.sq, chars.bear); buildMom();
  // the whole house is built now, once: walking from room to room never loads anything
  const WL = { basement: [.42, '搭建地庫…'], wall: [.52, '搭建牆內…'], kitchen: [.58, '搭建廚房和客廳…'], garage: [.64, '搭建車房…'], yard: [.7, '搭建後園和陽光房…'] , road: [.72, '搭建馬路…'], park: [.75, '搭建公園…'], school: [.77, '搭建學校…'], portal: [.78, '打開縮小機的場域…'], roof: [.8, '搭建屋頂…'] };
  await buildWorld(async id => { setLoad(...WL[id]); await tick(); });
  buildParticles(); enterZone('basement', true); scene.environment = ZONES.basement.envTex; placeStart();
  for (const id in chars) animChar(chars[id], .016);
  setLoad(.82, '拍攝頭像…'); await tick(); makePortraits(); setTimeout(emoBuildAll, 2500);
  setLoad(.92, '編譯著色器…'); await tick();
  applyQ(TOUCH ? 'low' : 'high'); onResize(); if (TOUCH) setupTouch();
  for (const Z of ZL) Z.lv.visible = Z.fx.visible = true; const kv = [KID.root.visible, CAT.root.visible]; KID.root.visible = CAT.root.visible = true;
  mom.root.visible = true; renderer.compile(scene, camera); mom.root.visible = false; KID.root.visible = kv[0]; CAT.root.visible = kv[1];
  setShadowLive(upLight, false); setShadowLive(flashLight, false);
  STATE = 'title'; updTitle(0); composer.render();
  setLoad(1, '完成'); $('load').hidden = true; $('start').hidden = false;
  if (NET.autoJoin) { mpOpen(NET.autoJoin); mpConnect(NET.autoJoin, false); }
}
