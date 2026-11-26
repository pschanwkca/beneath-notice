(() => {
  const b = window.__bn;
  window.__R = {
    async start() { document.getElementById('chaps').hidden = true; await b.startRoof(); for (let i = 0; i < 160 && b.state !== 'play'; i++) await new Promise(r => setTimeout(r, 250)); b.step(5); return b.info(); },
    put(x, y, z) { const L = b.leader; L.pos.set(x, y, z); L.vel.set(0, 0, 0); L.climbing = false; L.mantle = null; L.grounded = false; for (const C of b.party) if (C !== L) { C.pos.set(x + 3, y, z + 3); C.vel.set(0,0,0); C.climbing = false; C.mantle = null; } b.step(2); return b.info().pos; },
    face(dx, dz) { b.cam.yaw = Math.atan2(-dx, -dz); },
    walk(dx, dz, n, key = 'KeyW', every = 10) { this.face(dx, dz); const log = []; b.keys[key] = true; for (let i = 0; i < n; i++) { b.cam.yaw = Math.atan2(-dx, -dz); b.step(1); if (i % every === 0) { const L = b.leader; log.push([Math.round(L.pos.x), +L.pos.y.toFixed(1), Math.round(L.pos.z), L.state[0] + (L.grounded ? 'g' : '')]); } } b.keys[key] = false; b.step(1); return log; },
    jump() { b.press('Space'); b.step(1); }
  };
  return 'ok';
})()
