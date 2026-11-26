(() => {
  const B = window.__bn, L = B.leader, out = {}; B.toyUnfreezeAll(); B.state = 'play'; window.__NODET = true;
  const face = (dx, dz) => { B.cam.yaw = Math.atan2(-dx, -dz); };
  const put = (x, y, z) => { L.pos.set(x, y, z); L.vel.set(0, 0, 0); L.climbing = false; L.mantle = null; L.stamina = 100; B.step(10); };
  // into the shoe from its open heel
  put(278, .5, 150); face(0, 1); B.keys.KeyW = true; for (let i = 0; i < 150; i++) B.step(1); B.keys.KeyW = false; out.shoe = { pos: L.pos.toArray().map(v => +v.toFixed(1)), crouch: L.crouch, cover: !!B.W.LEVELS && null };
  // the piano: drop onto a key
  const hs = []; const orig = B.W.LEVELS ? null : null; put(745, 9, -58); B.step(30); out.pianoY = +L.pos.y.toFixed(2); out.sus = +B.HB.sus.toFixed(2);
  // magazine steps up the sofa back
  put(510, .3, 106); face(1, 0); B.keys.KeyW = true; let top = 0; for (let i = 0; i < 900; i++) { B.step(1); top = Math.max(top, L.pos.y); } B.keys.KeyW = false; out.steps = { top: +top.toFixed(1), pos: L.pos.toArray().map(v => +v.toFixed(1)) };
  // into the delivery box
  put(472, .5, 86); face(0, -1); B.keys.KeyW = true; for (let i = 0; i < 200; i++) B.step(1); B.keys.KeyW = false; out.box = L.pos.toArray().map(v => +v.toFixed(1));
  // into the bag
  put(246, .5, 206); face(-1, 0); B.keys.KeyW = true; for (let i = 0; i < 200; i++) B.step(1); B.keys.KeyW = false; out.bag = L.pos.toArray().map(v => +v.toFixed(1));
  return out;
})()
