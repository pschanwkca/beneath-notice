(() => {
  const B = window.__bn, L = B.leader, out = {}; window.__NODET = true; B.TEST.on = true; B.TEST.nodet = true; B.toyUnfreezeAll(); B.state = 'play';
  const face = (dx, dz) => { B.cam.yaw = Math.atan2(-dx, -dz); };
  const P = () => L.pos.toArray().map(v => +v.toFixed(1));
  const put = (x, y, z) => { if (B.state !== 'play') { B.toyUnfreezeAll(); B.state = 'play'; } L.pos.set(x, y, z); L.vel.set(0, 0, 0); L.climbing = false; L.mantle = null; L.leap = null; L.stamina = 100; B.step(8); };
  const walk = (dx, dz, n, key = 'KeyW') => { face(dx, dz); B.keys[key] = true; for (let i = 0; i < n; i++) B.step(1); B.keys[key] = false; };
  // T1 under the fridge → bathroom
  put(201, 0.3, -205); walk(0, -1, 260); out.t1 = { pos: P(), lv: B.LEVEL };
  // T1b back again
  walk(0, 1, 260); out.t1b = P();
  // T2 bathroom → living, cover shut
  put(335, 0.3, -256); const tr = []; face(0, 1); B.keys.KeyW = true; for (let i = 0; i < 200; i++) { B.step(1); if (i % 20 === 0) tr.push([+L.pos.y.toFixed(1), +L.pos.z.toFixed(1), L.state]); } B.keys.KeyW = false; out.t2 = { tr, pos: P(), hint: document.getElementById('hint').textContent };
  // open the cover from the living-room side
  put(335, 0.3, -226); const nr = B.hxNear(L); out.near = nr && nr.id; if (nr) B.hxSet(nr, true, L.id);
  put(335, 0.3, -256); walk(0, 1, 260); out.t2b = P();
  // T4 fish tank lid → vent → duct
  put(658, 144, -222); out.lidHint = document.getElementById('hint').textContent; face(0, -1); B.keys.KeyW = true; const ys = []; let i = 0; for (; i < 1500; i++) { B.step(1); if (i % 60 === 0) ys.push([+L.pos.y.toFixed(1), +L.pos.z.toFixed(1), L.climbing ? 'C' : (L.mantle ? 'M' : '-')]); if (L.pos.y > 269 && L.grounded) break; } B.keys.KeyW = false;
  out.t4 = { pos: P(), frames: i, ys, stamina: +L.stamina.toFixed(0) };
  // T5 duct → down the shaft → lid
  put(658, 270.6, -229); walk(0, -1, 40); B.step(60); out.t5a = P(); walk(0, 1, 120); B.step(60); out.t5 = P();
  // T6 the garage end of the living-room vent (single player)
  put(906, 4.5, -200); const g = B.hxNear(L); out.gnear = g && g.id; if (g) B.hxSet(g, true, L.id); out.gnearAfter = (B.hxNear(L) || {}).id || null;
  return out;
})()
