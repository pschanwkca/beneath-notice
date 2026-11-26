(() => {
  const B = window.__bn, L = B.leader, out = []; B.toyUnfreezeAll(); B.state = 'play'; window.__NODET = true;
  L.pos.set(278, .5, 150); L.vel.set(0, 0, 0); L.climbing = false; B.step(20);
  B.cam.yaw = Math.atan2(-0, -1); B.keys.KeyW = true;
  for (let i = 0; i < 70; i++) { B.step(1); if (i % 5 === 0) out.push([i, ...L.pos.toArray().map(v => +v.toFixed(2)), L.grounded ? 'G' : '-', L.state, L.crouch ? 'c' : '']); }
  B.keys.KeyW = false; return out;
})()
