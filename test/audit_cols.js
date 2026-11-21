// In-page audit: find collider faces / tops with no visible geometry ("climbing air", "standing on air").
// For every box / cylinder collider in each zone, cast short rays at its exposed side faces and top, and
// report the ones where nothing visible is there.
(() => {
  const b = window.__bn, T = b.THREE, W = b.W;
  const rc = new T.Raycaster(); const V = (x, y, z) => new T.Vector3(x, y, z);
  const report = [];
  const ZIDS = window.__AUDIT_ZONES || ['basement', 'wall', 'kitchen', 'garage', 'yard', 'road'];
  const inside = (cs, self, x, y, z) => { for (const q of cs) { if (q === self || q.y1 < -900) continue; if (y < q.y0 || y > q.y1) continue; if (q.t === 'c') { if (Math.hypot(x - q.x, z - q.z) < q.r) return q; } else if (x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1) return q; } return null; };
  const meshes = [];
  for (const Z0 of Object.values(W.ZONES)) { if (!Z0.lv) continue; Z0.lv.updateMatrixWorld(true);
    Z0.lv.traverse(o => {
      if (!o.isMesh || o.isPoints) return;
      for (let p = o; p && p !== Z0.lv; p = p.parent) if (!p.visible) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!m || m.visible === false || m.colorWrite === false || (m.transparent && m.opacity < .08) || m.blending === T.AdditiveBlending) return;
      let bx;
      if (o.isInstancedMesh) { o.computeBoundingBox(); bx = o.boundingBox.clone().applyMatrix4(o.matrixWorld); }
      else { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bx = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); }
      meshes.push({ o, bx });
    }); }
  for (const zid of ZIDS) {
    const Z = W.ZONES[zid]; if (!Z || !Z.lv) continue;
    const cs = Z.cols, res = [];
    for (const c of cs) {
      if (c.y1 < -900 || c.shell) continue;
      const h = c.y1 - c.y0; if (h < 1.2) continue;
      const bb = c.t === 'c' ? [c.x - c.r, c.x + c.r, c.z - c.r, c.z + c.r] : [c.x0, c.x1, c.z0, c.z1];
      const ex = new T.Box3(V(bb[0] - 6, c.y0 - 6, bb[2] - 6), V(bb[1] + 6, c.y1 + 6, bb[3] + 6));
      const cand = meshes.filter(m => m.bx.intersectsBox(ex)).map(m => m.o);
      const samples = [];   // [px,py,pz, dx,dy,dz]  (point on the surface, outward normal)
      if (c.t === 'c') { for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, nx = Math.cos(a), nz = Math.sin(a); for (const v of [.25, .75]) samples.push([c.x + nx * c.r, c.y0 + v * h, c.z + nz * c.r, nx, 0, nz]); } }
      else {
        const w = c.x1 - c.x0, d = c.z1 - c.z0, mx = (c.x0 + c.x1) / 2, mz = (c.z0 + c.z1) / 2;
        for (const [nx, nz, fx, fz, span] of [[1, 0, c.x1, mz, d], [-1, 0, c.x0, mz, d], [0, 1, mx, c.z1, w], [0, -1, mx, c.z0, w]]) {
          if (span < 1) continue;
          for (const u of [-.35, 0, .35]) for (const v of [.2, .5, .85]) samples.push([nx ? fx : fx + u * span, c.y0 + v * h, nz ? fz : fz + u * span, nx, 0, nz]);
        }
        if (w > 2 && d > 2) for (const [u, v] of [[0, 0], [-.3, -.3], [.3, .3], [-.3, .3], [.3, -.3]]) samples.push([mx + u * w, c.y1, mz + v * d, 0, 1, 0]);
      }
      let air = 0, n = 0; const bad = [];
      for (const [px, py, pz, dx, dy, dz] of samples) {
        if (inside(cs, c, px + dx * 1.2, py + dy * 1.2 + (dy ? 0 : 0), pz + dz * 1.2)) continue;      // covered by a neighbour: not reachable
        if (dy && inside(cs, c, px, py + 3, pz)) continue;
        n++;
        rc.set(V(px + dx * 4, py + dy * 4, pz + dz * 4), V(-dx, -dy, -dz)); rc.near = 0; rc.far = 4 + 2.5;
        const hit = rc.intersectObjects(cand, false)[0];
        if (!hit) { air++; bad.push((dy ? 'top ' : '') + [px, py, pz].map(v => Math.round(v)).join(',')); }
      }
      if (air) res.push({ air, n, c: c.t === 'c' ? ['cyl', c.x, c.z, c.r, c.y0, c.y1].map(v => typeof v === 'number' ? Math.round(v * 10) / 10 : v) : [c.x0, c.x1, c.y0, c.y1, c.z0, c.z1].map(v => Math.round(v * 10) / 10), tags: Object.keys(c).filter(k => !['t', 'x0', 'x1', 'y0', 'y1', 'z0', 'z1', 'x', 'z', 'r', 'm'].includes(k)).join(' ') + (c.m ? ' m=' + ((c.m.userData.res && c.m.userData.res.name) || c.m.name || c.m.type) + (c.m.visible ? '' : '(HIDDEN)') + '@' + c.m.getWorldPosition(new T.Vector3()).toArray().map(v => Math.round(v)).join(',') : ''), ex: bad.slice(0, 3) });
    }
    res.sort((a, b) => b.air / b.n - a.air / a.n || b.air - a.air);
    report.push(`=== ${zid}: ${cs.length} colliders, ${meshes.length} meshes, ${res.length} with air ===`);
    for (const r of res) report.push(`${r.air}/${r.n}  [${r.c.join(', ')}] ${r.tags}  e.g. ${r.ex.join(' | ')}`);
  }
  return report.join('\n');
})()
