(() => {
  const B = window.__bn, L = B.leader, out = {}; window.__NODET = true; B.TEST.on = true; B.TEST.nodet = true; B.toyUnfreezeAll(); B.state = 'play';
  const face = (dx, dz) => { B.cam.yaw = Math.atan2(-dx, -dz); };
  B.hxSet(B.HX.id.blight, false); L.pos.set(358, 46, -318); L.vel.set(0, 0, 0); L.climbing = false; L.stamina = 100; B.step(30);
  face(366 - L.pos.x, -312 - L.pos.z); B.keys.KeyW = true; let i = 0; for (; i < 200 && !L.climbing; i++) B.step(1);
  B.step(20); B.keys.KeyW = false; B.step(5);
  const y0 = L.pos.y, s0 = L.stamina; out.start = { y: +y0.toFixed(2), st: +s0.toFixed(1), climbing: L.climbing };
  B.press('Space'); B.step(1); const leapOn = !!L.leap; B.step(25);
  out.leapUp = { dy: +(L.pos.y - y0).toFixed(2), dst: +(s0 - L.stamina).toFixed(1), leapOn, climbing: L.climbing, h: L.h };
  // sideways leap
  const x0 = L.pos.x; B.keys.KeyD = true; B.press('Space'); B.step(1); B.step(25); B.keys.KeyD = false;
  out.leapSide = { dx: +(L.pos.x - x0).toFixed(2), dy: +(L.pos.y - y0).toFixed(2), climbing: L.climbing };
  // normal climbing for comparison: 0.3 s of W
  const y1 = L.pos.y, s1 = L.stamina; B.keys.KeyW = true; B.step(18); B.keys.KeyW = false;
  out.normal = { dy: +(L.pos.y - y1).toFixed(2), dst: +(s1 - L.stamina).toFixed(1) };
  // jump off: S + Space
  B.keys.KeyS = true; B.press('Space'); B.step(2); B.keys.KeyS = false; out.off = { climbing: L.climbing, st: L.state };
  // chain leaps up the wall to the top
  L.pos.set(358, 46, -318); L.vel.set(0, 0, 0); L.climbing = false; L.stamina = 100; B.step(30); face(366 - L.pos.x, -312 - L.pos.z); B.keys.KeyW = true; for (i = 0; i < 200 && !L.climbing; i++) B.step(1); B.step(30); B.keys.KeyW = false;
  let n = 0, t = 0; const ys = []; for (; t < 900 && (L.climbing || L.mantle); t++) { if (!L.leap && !(L.leapCD > 0)) { B.press('Space'); n++; } B.step(1); if (t % 30 === 0) ys.push(+L.pos.y.toFixed(1)); }
  out.chain = { leaps: n, frames: t, y: +L.pos.y.toFixed(1), pos: L.pos.toArray().map(v => +v.toFixed(1)), grounded: L.grounded, stamina: +L.stamina.toFixed(1), climbing: L.climbing, ys };
  return out;
})()
