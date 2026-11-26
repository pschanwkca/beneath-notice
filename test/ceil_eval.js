(() => {
  const B = window.__bn, L = B.leader, out = {};
  const HX = B.HX; B.TEST.on = true; B.TEST.nodet = true; window.__NODET = true; out.st0 = B.state; B.toyUnfreezeAll && B.toyUnfreezeAll(); B.state = 'play'; B.meter = 0; B.hxSet(HX.id.hood, false); B.hxSet(HX.id.blight, false);
  const face = (dx, dz) => { B.cam.yaw = Math.atan2(-dx, -dz); };
  const put = (x, y, z) => { if (B.state !== 'play') { B.toyUnfreezeAll && B.toyUnfreezeAll(); B.state = 'play'; } L.pos.set(x, y, z); L.vel.set(0, 0, 0); L.climbing = false; L.mantle = null; L.grounded = false; };
  // A: step onto the burner → lifted into the hood
  put(57, 92, -190); face(0, -1); B.keys.KeyW = true; for (let i = 0; i < 60 && L.pos.z > -203; i++) B.step(1); B.keys.KeyW = false;
  let maxY = 0; for (let i = 0; i < 120; i++) { B.step(1); maxY = Math.max(maxY, L.pos.y); }
  out.lift = { st: B.state, maxY: +maxY.toFixed(1), pos: L.pos.toArray().map(v => +v.toFixed(1)), hint: document.getElementById('hint').textContent };
  // B: inside the hood, walk to the back wall and climb up the chimney
  put(38, 161, -205); B.step(20); face(0, -1); B.keys.KeyW = true; let top = 0; for (let i = 0; i < 900; i++) { B.step(1); top = Math.max(top, L.pos.y); if (L.pos.y > 269 && L.grounded) break; } B.keys.KeyW = false;
  out.chimney = { top: +top.toFixed(1), pos: L.pos.toArray().map(v => +v.toFixed(1)), lv: B.LEVEL, climbing: L.climbing };
  // C: bathroom: stand in the laundry basket, walk into the cord, climb
  B.hxSet(HX.id.blight, true);
  put(358, 46, -318); B.step(30); const y0 = L.pos.y; const p0 = L.pos.toArray().map(v => +v.toFixed(1)); face(366 - L.pos.x, -312 - L.pos.z); 
  B.keys.KeyW = true; let ct = 0, gotCord = false, top2 = 0; for (let i = 0; i < 1600; i++) { B.step(1); if (L.climbing && L.climbC === HX.bcord) gotCord = true; top2 = Math.max(top2, L.pos.y); if (L.pos.y > 269 && L.grounded) break; } B.keys.KeyW = false;
  out.cord = { standY: +y0.toFixed(1), p0, gotCord, blightAfter: HX.id.blight.on, top: +top2.toFixed(1), pos: L.pos.toArray().map(v => +v.toFixed(1)), grounded: L.grounded };
  out.state = B.state; return out;
})()
