// =====================================================================
//  TITLE SCREEN — the whole crew up on the ridge of the house at sunset, looking out over the street,
//  the park and the city (the towers' lights coming on, the sun going down behind them)
//  · they sit in a row on the ridge cap; heads turn now and then, legs swing, the professor points,
//    the frog hops, the tortoise peeks out of its shell, the bat stretches its wings
//  · small, slow movements only: a living picture behind the title card
// =====================================================================
const TTL = { on: false, saved: null, t: 0 };
const TC = () => V3(180, RFH.R + 3.5, 0);   // the middle of the row, on the ridge cap
// where everyone sits along the ridge (offset in x) and a little personality for each
const TTL_ROW = ['frog', 'mole', 'dad', 'bear', 'cham', 'sq', 'bat', 'tort', 'coon', 'hog', 'rab'];
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
  const row = TTL_ROW.filter(id => chars[id] && IDS.includes(id)), n = row.length;
  row.forEach((id, i) => {
    const C = chars[id], x = c.x + (i - (n - 1) / 2) * 7.2 + (id === 'bear' ? .6 : 0); const ph = (id.charCodeAt(0) * 1.7 + i) % 6;
    C.pos.set(x, c.y, c.z); if (C.disp) C.disp.copy(C.pos); C.state = 'sit'; C.spd = 0; C.vel.set(0, 0, 0); C.wave = false; C.shell = false; C.roost = null;
    C.yaw = -.38 - (i - (n - 1) / 2) * .03 + Math.sin(t * .2 + ph) * .03;   // facing out toward the sunset and the towers
    // now and then a head turns to the neighbour, legs swing a little
    C.look = Math.sin(t * .33 + ph) > .65 ? Math.sin(ph * 3) * .7 : 0; C.sitKick = Math.sin(t * (.9 + ph * .07) + ph) * .1; C.sitLeg = 0;
  });
  // the professor points out at the city every so often
  const dd = chars.dad, dt8 = (t + 4) % 15; if (dd) { dd.wave = dt8 > 11 && dt8 < 13.4; if (dd.wave) dd.look = .25; }
  if (chars.sq && dt8 > 11.6 && dt8 < 13.6) chars.sq.look = -.6;
  // the frog hops on the spot; the tortoise mostly stays tucked in; the bat stretches its wings; the kangaroo stands up for a look
  const fr = chars.frog; if (fr && row.includes('frog')) { const h = t % 7; if (h < .5) { fr.pos.y += Math.sin(h / .5 * Math.PI) * 2.6; fr.state = 'air'; } if (fr.disp) fr.disp.copy(fr.pos); }
  const tt = chars.tort; if (tt && row.includes('tort')) tt.state = (t % 13) < 8.5 ? 'shell' : 'sit';
  const bt = chars.bat; if (bt) bt.flapT = (t % 10) < .55 ? .2 : 0;
  const rb = chars.rab; if (rb && row.includes('rab') && (t % 17) > 12 && (t % 17) < 15.5) { rb.state = 'idle'; rb.look = -.5; }
  // camera: low behind them and off to the right, looking out the way they look: their backs against the sky,
  // the sun just left of centre over the towers. Wide screens: the row sits right of the title card; narrow
  // (portrait) screens: further back, in the top half above the card
  TTL.camA = Math.sin(t * .06) * .04; const asp = innerWidth / innerHeight, narrow = innerWidth < 900;
  const f = -.46, fx = Math.sin(f), fz = Math.cos(f), rx = -Math.cos(f), rz = Math.sin(f);
  const back = narrow ? (asp < .8 ? 62 : 48) : 30, side = narrow ? 6 : 20 + TTL.camA * 40, up = narrow ? (asp < .8 ? 13 : 10) : 6;
  camera.position.set(c.x - fx * back + rx * side, c.y + up + Math.sin(t * .1) * .5, c.z - fz * back + rz * side);
  const look = narrow ? V3(c.x + fx * 60, c.y - (asp < .8 ? 16 : 9), c.z + fz * 60) : V3(c.x + fx * 80 - rx * 32, c.y + 9, c.z + fz * 80 - rz * 32);
  camera.lookAt(look);
  bokeh.uniforms.focus.value = camera.position.distanceTo(c);
}
