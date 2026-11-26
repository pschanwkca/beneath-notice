(() => {
  const B = window.__bn, L = B.leader, out = []; window.__NODET = true; B.TEST.on = true; B.TEST.nodet = true;
  const HX = B.HX; B.hxSet(HX.id.blight, false);
  L.pos.set(358, 46, -318); L.vel.set(0, 0, 0); L.climbing = false; L.mantle = null; B.step(30);
  B.cam.yaw = Math.atan2(-(366 - L.pos.x), -(-312 - L.pos.z)); B.keys.KeyW = true;
  for (let i = 0; i < 400; i++) { B.step(1); if (i % 20 === 0) out.push([i, ...L.pos.toArray().map(v => +v.toFixed(1)), L.climbing ? (L.climbC === HX.bcord ? 'CORD' : 'C:' + L.climbC.t + (L.climbC.grip ? 'g' : '')) : '-', L.state, +(L.stamina || 0).toFixed(0)]); }
  B.keys.KeyW = false; return out;
})()
