(() => {
  const B = window.__bn, L = B.leader, out = []; window.__NODET = true; B.TEST.on = true; B.TEST.nodet = true; B.toyUnfreezeAll(); B.state = 'play';
  L.pos.set(150, 0.2, -212); L.vel.set(0, 0, 0); L.climbing = false; L.stamina = 100; B.step(10);
  B.cam.yaw = 0; B.keys.KeyW = true; let i = 0; for (; i < 200 && !L.climbing; i++) B.step(1); B.step(40); B.keys.KeyW = false; B.step(3);
  out.push(['c', L.pos.toArray().map(v => +v.toFixed(2)), L.climbC && [L.climbC.t, L.climbC.y0, L.climbC.y1, L.climbC.z0, L.climbC.z1]]);
  B.press('Space');
  for (let f = 0; f < 8; f++) { B.step(1); out.push([f, +L.pos.y.toFixed(2), L.leap ? +L.leap.t.toFixed(3) : null, L.climbing, L.state, L.mantle ? 'M' : '']); }
  return out;
})()
