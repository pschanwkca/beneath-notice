// In-page "bot player" sweep of one zone (window.__SWEEP_ZONE): stand on every surface, try to walk off in
// four directions, and report anything a player would hit: falling through a top, being shoved out of
// something solid, getting stuck, leaving the world, NaNs.
(() => {
  const b = window.__bn, W = b.W, L = b.leader, zid = window.__SWEEP_ZONE, Z = W.ZONES[zid];
  const cs = Z.cols, R = v => Math.round(v * 10) / 10;
  const inCore = (x, y, z) => Z.core.some(q => x > q[0] && x < q[1] && y > q[2] && y < q[3] && z > q[4] && z < q[5]);
  const inside = (x, y, z, skip) => { for (const q of W.colsNear(x, y, z)) { if (q === skip || q.y1 < -900 || q.small) continue; if (y <= q.y0 || y >= q.y1) continue; if (q.t === 'c') { if (Math.hypot(x - q.x, z - q.z) < q.r) return q; } else if (x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1) return q; } return null; };
  const st = n => { for (let i = 0; i < n; i++) b.step(1); };
  const put = (x, y, z) => { L.pos.set(x, y, z); L.vel.set(0, 0, 0); L.climbing = false; L.mantle = null; L.hop = null; L.tumble = 0; L.rollT = 0; L.stamina = 100; L.grounded = false; L.crouch = false; L.frozen = false; };
  const spots = [];
  for (const c of cs) {
    if (c.y1 < -900 || c.t !== 'b' || c.shell || c.door || c.cat || c.zone) continue;
    const w = c.x1 - c.x0, d = c.z1 - c.z0; if (w < 3.5 || d < 3.5) continue;
    const add = (x, z) => { if (!inCore(x, c.y1 + 2, z) || inside(x, c.y1 + 1.5, z) || inside(x, c.y1 + 4, z) || inside(x, c.y1 + 6, z)) return; spots.push([x, c.y1, z, c]); };
    add((c.x0 + c.x1) / 2, (c.z0 + c.z1) / 2);
    if (w > 100 || d > 100) for (let gx = c.x0 + 25; gx < c.x1 - 10; gx += 70) for (let gz = c.z0 + 25; gz < c.z1 - 10; gz += 70) add(gx, gz);
  }
  const MAX = window.__SWEEP_MAX || 160, step = Math.max(1, spots.length / MAX), pick = [];
  for (let i = 0; i < spots.length && pick.length < MAX; i += step) pick.push(spots[Math.floor(i)]);
  const issues = []; let nStand = 0;
  const floorY = Z.floor ?? 0;
  for (const [x, y, z, c] of pick) {
    if (b.state !== 'play') b.state = 'play';
    put(x, y + .3, z); st(20);
    const p = L.pos, bad = [];
    if (!isFinite(p.x + p.y + p.z)) { issues.push(['NaN', R(x), R(y), R(z)]); put(x, y + .3, z); continue; }
    if (p.y < y - 4 && !L.climbing) bad.push('fell ' + R(y - p.y));
    if (Math.hypot(p.x - x, p.z - z) > 3 && !L.climbing) bad.push('shoved ' + R(Math.hypot(p.x - x, p.z - z)));
    if (p.y < floorY - 120) bad.push('OUT OF WORLD');
    const s0 = p.clone(); let moves = 0, stuckIn = 0;
    for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      put(s0.x, s0.y + .05, s0.z); st(2); b.cam.yaw = yaw; b.keys.KeyW = true; st(18); b.keys.KeyW = false;
      const d = Math.hypot(L.pos.x - s0.x, L.pos.z - s0.z) + Math.abs(L.pos.y - s0.y);
      if (d > .8) moves++;
      if (!isFinite(L.pos.x + L.pos.y)) bad.push('NaN after walking');
      if (L.pos.y < floorY - 120) bad.push('OUT OF WORLD walking yaw ' + R(yaw));
      const q = inside(L.pos.x, L.pos.y + L.h * .5, L.pos.z); if (q) stuckIn++;
    }
    if (!moves) bad.push('STUCK (no direction moves)');
    if (stuckIn) bad.push('inside solid x' + stuckIn);
    nStand++;
    if (bad.length) issues.push([R(x), R(y), R(z), 'top of [' + [c.x0, c.x1, c.y0, c.y1, c.z0, c.z1].map(R).join(',') + ']' + (c.m && c.m.userData && c.m.userData.res ? ' ' + c.m.userData.res.name : ''), bad.join(' / ')]);
  }
  b.keys.KeyW = false;
  return `=== ${zid}: ${spots.length} spots, tested ${nStand}, ${issues.length} with problems ===\n` + issues.map(i => i.join('  ')).join('\n');
})()
