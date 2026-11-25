// Object audit: which visible meshes can a character walk into?
// For every mesh in every zone, sample its vertices (pulled 1 cm inwards) and test them against the colliders.
(() => {
  const b = window.__bn, THREE = b.THREE, cols = b.cols, out = [];
  // a coarse grid over the colliders so each point only tests a few
  const CS = 40, grid = new Map(), key = (i, j, k) => i + ',' + j + ',' + k;
  const bounds = c => c.t === 'b' ? [c.x0, c.y0, c.z0, c.x1, c.y1, c.z1] : [c.x - c.r, c.y0, c.z - c.r, c.x + c.r, c.y1, c.z + c.r];
  for (const c of cols) { if (c.y1 < -900) continue; const [a0, a1, a2, b0, b1, b2] = bounds(c);
    for (let i = Math.floor(a0 / CS); i <= Math.floor(b0 / CS); i++) for (let j = Math.floor(a1 / CS); j <= Math.floor(b1 / CS); j++) for (let k = Math.floor(a2 / CS); k <= Math.floor(b2 / CS); k++) { const q = key(i, j, k); if (!grid.has(q)) grid.set(q, []); grid.get(q).push(c); } }
  const T = .45;
  const inside = p => { const L = grid.get(key(Math.floor(p.x / CS), Math.floor(p.y / CS), Math.floor(p.z / CS))); if (!L) return false;
    for (const c of L) { if (p.y < c.y0 - T || p.y > c.y1 + T) continue; if (c.t === 'b') { if (p.x >= c.x0 - T && p.x <= c.x1 + T && p.z >= c.z0 - T && p.z <= c.z1 + T) return true; } else if (Math.hypot(p.x - c.x, p.z - c.z) <= c.r + T) return true; } return false; };
  const skipMat = m => !m || m.isShaderMaterial || m.isPointsMaterial || m.isLineBasicMaterial || m.blending === THREE.AdditiveBlending || (m.transparent && (m.opacity < .55 || m.depthWrite === false)) || m.visible === false;
  const visibleChain = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const charRoots = new Set(Object.values(b.chars).map(C => C.root));
  const v = new THREE.Vector3(), c3 = new THREE.Vector3();
  for (const Z of b.ZL) {
    const lv = Z.lv; if (!lv) continue; const vis = lv.visible; lv.visible = true; lv.updateMatrixWorld(true);
    lv.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh) return; if (!visibleChain(o)) return;
      for (let p = o; p; p = p.parent) if (charRoots.has(p) || p.userData.npc) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material; if (skipMat(m)) return;
      const pa = o.geometry && o.geometry.attributes.position; if (!pa) return;
      const n = pa.count, step = Math.max(1, Math.ceil(n / 260)), pts = [];
      const bb = new THREE.Box3();
      for (let i = 0; i < n; i += step) { v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld); pts.push(v.clone()); bb.expandByPoint(v); }
      const d = bb.getSize(new THREE.Vector3()), mx = Math.max(d.x, d.y, d.z);
      if (mx < 2.5 || mx > 900 || d.y < 1.2) return;
      bb.getCenter(c3); let un = 0, top = 0, topUn = 0; const ty = bb.max.y - d.y * .15;
      for (const p of pts) { const q = p.clone(); const dir = c3.clone().sub(q); const L = dir.length(); if (L > 1e-4) q.addScaledVector(dir, Math.min(1, L * .3) / L);
        const ok = inside(q); if (!ok) un++; if (p.y >= ty) { top++; if (!ok) topUn++; } }
      const f = un / pts.length, ft = top ? topUn / top : 0;
      if (f < .3 && ft < .5) return;
      let tl = o; while (tl.parent && tl.parent !== lv) tl = tl.parent;
      out.push({ z: Z.id, f: +f.toFixed(2), ft: +ft.toFixed(2), c: [Math.round(c3.x), Math.round(c3.y), Math.round(c3.z)], d: [+d.x.toFixed(1), +d.y.toFixed(1), +d.z.toFixed(1)], g: o.geometry.type.replace('Geometry', ''), col: m.color ? m.color.getHexString() : '', mt: m.type.replace('Mesh', '').replace('Material', ''), nm: o.name || tl.name || '', top: lv.children.indexOf(tl), fur: !!o.userData.fur || !!(m.userData && m.userData.fur) });
    });
    lv.visible = vis;
  }
  window.__AUDIT = out;
  const byZ = {}; for (const r of out) byZ[r.z] = (byZ[r.z] || 0) + 1;
  return JSON.stringify({ n: out.length, byZ });
})()
