(() => {
  const B = window.__bn, L = B.leader; window.__NODET = true; B.TEST.on = true; B.TEST.nodet = true; B.toyUnfreezeAll(); B.state = 'play';
  B.hxSet(B.HX.id.blight, false); L.pos.set(358, 46, -318); L.vel.set(0, 0, 0); L.climbing = false; L.stamina = 100; B.step(30);
  B.cam.yaw = Math.atan2(-(366 - L.pos.x), -(-312 - L.pos.z)); B.keys.KeyW = true; let i = 0; for (; i < 200 && !L.climbing; i++) B.step(1); B.step(20); B.keys.KeyW = false; B.step(5);
  const y0 = L.pos.y; let n = 0, t = 0; const ys = [];
  for (; t < 900 && (L.climbing || L.mantle); t++) { if (L.climbing && !L.leap && !(L.leapCD > 0) && L.stamina > 14) { B.press('Space'); n++; } else if (L.climbing && !L.leap) B.keys.KeyW = true; B.step(1); B.keys.KeyW = false; if (t % 30 === 0) ys.push(+L.pos.y.toFixed(1)); }
  return { y0: +y0.toFixed(1), leaps: n, secs: +(t / 60).toFixed(1), pos: L.pos.toArray().map(v => +v.toFixed(1)), grounded: L.grounded, stamina: +L.stamina.toFixed(1), ys };
})()
