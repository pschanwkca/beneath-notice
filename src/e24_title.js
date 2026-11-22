// =====================================================================
//  TITLE SCREEN — the crew hanging about on the lab workbench, calm and unhurried
//  · the professor studies the machine, the old partner stretches, the assistant naps on the notes,
//    two of them take a slow stroll, the frog hops now and then, the tortoise peeks out of its shell…
//  · small, slow movements only, and no stickers: a living picture behind the title card
// =====================================================================
const TTL = { on: false, saved: null, t: 0 };
const TC = () => V3(-12, 92, -206).add(BO);   // the middle of the group (open bench top, the machine glowing behind)
// stand on whatever is there (the notebook is a step up)
const ttlY = (x, z) => { const lx = x - BO.x, lz = z - BO.z; return BO.y + (lx > -2 && lx < 28 && lz > -198 && lz < -176 ? 93 : 92); };
// where everyone is (offsets from the middle) and which way they face (toward a point, as an offset too)
const TTL_SPOTS = { dad: [-2, -3, -40, -6], bear: [-9, 3, 4, 40], cham: [-13, -6, 6, 40], sq: [8, 8, -4, 40], frog: [11, 2, -6, 40], bat: [1, -10, 2, 40], tort: [-5, 10, 3, 0], coon: [6, -6, -2, 40] };   // most of them face the viewer
function titleSetup() {
  TTL.on = true; TTL.t = 0;
  TTL.saved = {}; for (const id in chars) { const C = chars[id]; TTL.saved[id] = { vis: C.root.visible, pos: C.pos.clone(), yaw: C.yaw, state: C.state, shell: C.shell, roost: C.roost, wave: C.wave, lie: C.lieK }; }
  for (const id in chars) { const C = chars[id]; C.root.visible = IDS.includes(id); C.shell = false; C.roost = null; C.lieK = 0; C.wave = false; C.tumble = 0; C.emo = null; C.look = 0; C.vel.set(0, 0, 0); if (C.disp) C.disp.copy(C.pos); }
  chars.gecko.root.visible = false;
  for (const B of EMO.bubbles) B.el.remove(); EMO.bubbles.length = 0;
}
function titleEnd() {
  lobbyEnd(); if (!TTL.on) return; TTL.on = false;
  for (const id in TTL.saved) { const C = chars[id], S = TTL.saved[id]; if (!C) continue; C.root.visible = S.vis; C.pos.copy(S.pos); C.yaw = S.yaw; C.state = S.state; C.shell = S.shell; C.roost = S.roost; C.wave = S.wave; C.lieK = S.lie; C.tumble = 0; C.emo = null; C.spd = 0; C.squash = 0; C.look = 0; if (C.disp) C.disp.copy(C.pos); }
  for (const B of EMO.bubbles) B.el.remove(); EMO.bubbles.length = 0;
}
function updTitle(dt) {
  if (!WORLD) return;
  if (!TTL.on) titleSetup();
  if (lobbyActive()) { TTL.t += dt; updLobby(dt); return; } else if (LOBBY.on) lobbyEnd();
  TTL.t += dt; const t = TTL.t, c = TC();
  const put = (C, x, z, y = 0) => { C.pos.set(x, ttlY(x, z) + y, z); if (C.disp) C.disp.copy(C.pos); };
  const faceTo = (C, x, z, k = 3) => { C.yaw = angDamp(C.yaw, Math.atan2(x - C.pos.x, z - C.pos.z), k, dt); };
  // the ones standing about: each in their spot, turning their head now and then to look at someone
  for (const id of ['dad', 'bear', 'cham', 'frog', 'bat', 'coon', 'sq']) {
    const C = chars[id], S = TTL_SPOTS[id]; if (!C) continue; put(C, c.x + S[0], c.z + S[1]); C.state = 'idle'; C.spd = 0;
    faceTo(C, c.x + S[2], c.z + S[3], 2); const ph = (id.charCodeAt(0) * 1.7) % 6;
    C.look = Math.sin(t * .35 + ph) > .6 ? Math.sin(ph * 3) * .7 : 0;
  }
  // the professor studies the machine; once in a while he turns to the others and waves them over
  const dd = chars.dad, dt8 = (t + 3) % 14; dd.wave = dt8 > 11 && dt8 < 12.6; if (dt8 > 10.4 && dt8 < 13) faceTo(dd, c.x - 4, c.z + 6, 3);
  // the old partner stretches; the chameleon gives a little wave back
  if (chars.cham) chars.cham.wave = dt8 > 11.6 && dt8 < 12.8;
  // the assistant reads the lab notes
  const sq = chars.sq; if (sq) { sq.lean = .5; sq.look = 0; }
  // two of them take a slow walk back and forth along the front, side by side
  const wk = (t * .05) % 2, dir = wk < 1 ? 1 : -1, u = wk < 1 ? wk : 2 - wk, ux = sstep(0, 1, u);
  const stroll = (id, off) => { const C = chars[id]; if (!C) return; const x = c.x - 12 + ux * 24 + off * dir, z = c.z + 15 + Math.abs(off) * .3; put(C, x, z);
    const turning = u < .03 || u > .97; C.yaw = angDamp(C.yaw, turning ? 0 : dir > 0 ? Math.PI / 2 : -Math.PI / 2, 3, dt); C.state = turning ? 'idle' : 'walk'; C.spd = turning ? 0 : 6; C.look = id === 'rab' ? -.4 * dir : .3 * dir; };
  stroll('rab', 0); stroll('hog', -3.2);
  // the frog hops on the spot every few seconds
  const fr = chars.frog; if (fr) { const h = t % 6.5; if (h < .5) { fr.pos.y += Math.sin(h / .5 * Math.PI) * 2.4; fr.state = 'air'; } if (fr.disp) fr.disp.copy(fr.pos); }
  // the bat stretches its wings every so often
  const bt = chars.bat; if (bt) bt.flapT = (t % 9) < .5 ? .2 : 0;
  // the tortoise mostly stays in its shell, peeking out for a bit
  const tt = chars.tort; if (tt) { put(tt, c.x + TTL_SPOTS.tort[0], c.z + TTL_SPOTS.tort[1]); tt.state = (t % 12) < 8 ? 'shell' : 'idle'; tt.yaw = .5; }
  // camera: low, close and a little to the side; on wide screens the brawl sits right of the title card,
  // on narrow (portrait) screens it sits in the top half above the card
  TTL.camA = Math.sin(t * .08) * .07; const asp = innerWidth / innerHeight, narrow = innerWidth < 900;
  const dist = narrow ? (asp < .8 ? 62 : 50) : 40, a = .24 + TTL.camA;
  camera.position.set(c.x + Math.sin(a) * dist, c.y + (narrow ? 15 : 11) + Math.sin(t * .12) * .6, c.z + Math.cos(a) * dist);
  const look = narrow ? V3(c.x, c.y - (asp < .8 ? 10 : 6), c.z) : V3(c.x - 11, c.y + 3.5, c.z + 2);
  camera.lookAt(look);
  bokeh.uniforms.focus.value = camera.position.distanceTo(c);
}
