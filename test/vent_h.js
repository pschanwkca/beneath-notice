(() => {
  const b = window.__bn;
  window.__V = {
    // hold W toward a sequence of xz targets, switching to the next when within r (or after n frames); log
    go(path, n = 1800, every = 30) {
      const L = b.leader; const log = []; let k = 0, my = -1e9;
      b.keys.KeyW = true;
      for (let i = 0; i < n && k < path.length; i++) {
        const [tx, tz, ty] = path[k]; const dx = tx - L.pos.x, dz = tz - L.pos.z;
        if (Math.hypot(dx, dz) < 4 && (ty === undefined || L.pos.y > ty)) { k++; continue; }
        if (!L.climbing) b.cam.yaw = Math.atan2(-dx, -dz);
        b.step(1); my = Math.max(my, L.pos.y);
        if (i % every === 0) log.push([Math.round(L.pos.x), +L.pos.y.toFixed(1), Math.round(L.pos.z), (L.climbing ? 'C' : L.mantle ? 'M' : L.grounded ? 'g' : 'a'), Math.round(L.stamina)]);
      }
      b.keys.KeyW = false; b.step(1);
      return { reached: k, of: path.length, maxY: +my.toFixed(1), end: L.pos.toArray().map(v => +v.toFixed(1)), zone: b.W.WC.cz ? b.W.WC.cz.id : '', log };
    }
  };
  return 'ok';
})()
