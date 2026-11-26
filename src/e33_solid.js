// =====================================================================
//  實物就係實物 — anything that looks solid is solid.
//  When the world has been built, every visible thing a character could walk into, or sink into,
//  (a mesh that no collider covers) gets colliders shaped like it: one box or one cylinder for
//  compact, upright things; for long, slanted or odd shapes, columns of boxes from a coarse
//  voxel pass over its surface. Built the same way on every machine (no randomness), so online
//  play agrees. Anything that later moves (a swing, a door, a fan) drops its colliders as soon
//  as it does.
// =====================================================================
const SOLID = { list: [], i: 0, made: 0, meshes: 0 };
const SOLID_SKIP_GEO = new Set(['PlaneGeometry', 'CircleGeometry', 'RingGeometry', 'TubeGeometry', 'ShapeGeometry', 'EdgesGeometry', 'WireframeGeometry']);
function solidSkipMat(m) {
  return !m || m.isShaderMaterial || m.isMeshBasicMaterial || m.isPointsMaterial || m.isLineBasicMaterial || m.visible === false || m.colorWrite === false ||
    m.blending === THREE.AdditiveBlending || (m.transparent && (m.opacity < .55 || m.depthWrite === false));
}
function solidSkipSet() {
  const skip = new Set(), mark = o => o && o.traverse && o.traverse(q => skip.add(q));
  for (const r of resizables) mark(r.mesh);
  for (const A of [batteries, VIALS, CRUMBS]) for (const q of A) { mark(q.g); mark(q.halo); }
  // things the game itself moves or switches (doors, fans, curtains, swings, lamps, people…) keep the colliders they were given
  const zoneRoots = new Set(ZL.map(Z => Z.lv)), big = o => { let n = 0; o.traverse(() => n++); return n > 400; };
  const markRef = (v, depth) => {
    if (!v || typeof v !== 'object') return;
    if (v.isObject3D) { if (v !== scene && !zoneRoots.has(v) && !big(v)) mark(v); return; }
    if (depth <= 0 || v.isVector3 || v.isColor || v.isMaterial || v.isTexture || ArrayBuffer.isView(v)) return;
    for (const k of Object.keys(v)) markRef(v[k], depth - 1);
  };
  for (const S of [HX, LIV, UPS, KS, GS, YS, ST, PK, SC, TOY, KM, KID, HB, AGB, OLDB, NC, MOLE, CREW, machine]) markRef(S, 3);
  return skip;
}
function autoSolid() {
  if (window.__NOSOLID) return;
  const skip = solidSkipSet();
  // what's already covered: a coarse grid over the colliders
  const CS = 40, grid = new Map(), key = (i, j, k) => i + ',' + j + ',' + k;
  const addGrid = c => { const a = c.t === 'b' ? [c.x0, c.y0, c.z0, c.x1, c.y1, c.z1] : [c.x - c.r, c.y0, c.z - c.r, c.x + c.r, c.y1, c.z + c.r];
    for (let i = Math.floor(a[0] / CS); i <= Math.floor(a[3] / CS); i++) for (let j = Math.floor(a[1] / CS); j <= Math.floor(a[4] / CS); j++) for (let k = Math.floor(a[2] / CS); k <= Math.floor(a[5] / CS); k++) { const q = key(i, j, k); let L = grid.get(q); if (!L) grid.set(q, L = []); L.push(c); } };
  for (const c of cols) if (c.y1 > -900) addGrid(c);
  const TOL = .45, covered = p => { const L = grid.get(key(Math.floor(p.x / CS), Math.floor(p.y / CS), Math.floor(p.z / CS))); if (!L) return false;
    for (const c of L) { if (p.y < c.y0 - TOL || p.y > c.y1 + TOL) continue; if (c.t === 'b') { if (p.x >= c.x0 - TOL && p.x <= c.x1 + TOL && p.z >= c.z0 - TOL && p.z <= c.z1 + TOL) return true; } else if (Math.hypot(p.x - c.x, p.z - c.z) <= c.r + TOL) return true; } return false; };
  const v = V3(), ctr = V3(), out = [];
  for (const Z of ZL) {
    const lv = Z.lv; if (!lv) continue; lv.updateMatrixWorld(true);
    const inCore = p => Z.core.some(b => p.x > b[0] && p.x < b[1] && p.y > b[2] && p.y < b[3] - 20 && p.z > b[4] && p.z < b[5]);
    lv.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || skip.has(o)) return;
      for (let p = o; p && p !== lv; p = p.parent) if (!p.visible || p.userData.noSolid || skip.has(p)) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material; if (solidSkipMat(m)) return;
      const geo = o.geometry; if (!geo || (SOLID_SKIP_GEO.has(geo.type) && !(geo.type === 'TubeGeometry' && geo.parameters && geo.parameters.radius >= 1.2))) return;   // (thin cables stay soft; spouts and hoses don't)
      const pa = geo.attributes.position; if (!pa) return;
      const n = pa.count, step = Math.max(1, Math.ceil(n / 260)), pts = [], bb = new THREE.Box3();
      for (let i = 0; i < n; i += step) { v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld); pts.push(v.clone()); bb.expandByPoint(v); }
      const d = bb.getSize(V3()), mx = Math.max(d.x, d.y, d.z);
      const ds = [d.x, d.y, d.z].sort((a, b) => a - b);
      if (mx < 2.5 || mx > 400 || ds[0] < 1.2 || ds[1] < 3.2) return;   // specks, sheets (tiles, posters, rugs) and thin rods (stems, handles, spouts, rails) stay as they are
      if (/Icosahedron|Dodecahedron|Octahedron/.test(geo.type) && mx > 40) return;   // tree tops and bushes
      bb.getCenter(ctr); if (!inCore(ctr)) return;                                     // scenery beyond where anyone can go
      let un = 0, top = 0, topUn = 0; const ty = bb.max.y - d.y * .15;
      for (const p of pts) { const q = p.clone(), dir = ctr.clone().sub(q), L = dir.length(); if (L > 1e-4) q.addScaledVector(dir, Math.min(1, L * .3) / L); const ok = covered(q); if (!ok) un++; if (p.y >= ty) { top++; if (!ok) topUn++; } }
      if (un / pts.length < .3 && (top ? topUn / top : 0) < .5) return;
      out.push({ o, bb: bb.clone(), d, Z });
    });
  }
  // shape the colliders
  const e = new THREE.Vector3(), ax = [V3(), V3(), V3()];
  for (const { o, bb, d } of out) {
    o.matrixWorld.extractBasis(ax[0], ax[1], ax[2]); for (const a of ax) a.normalize();
    const aligned = ax.every(a => Math.max(Math.abs(a.x), Math.abs(a.y), Math.abs(a.z)) > .9995), upright = Math.abs(ax[1].y) > .998;
    const gt = o.geometry.type, made = [], mx = Math.max(d.x, d.y, d.z), small = mx < 4, round = /Cylinder|Sphere|Lathe|Capsule|Cone|Torus|Icosahedron|Dodecahedron/.test(gt);
    if (gt === 'BoxGeometry' && aligned) made.push({ t: 'b', x0: bb.min.x, x1: bb.max.x, y0: bb.min.y, y1: bb.max.y, z0: bb.min.z, z1: bb.max.z });
    else if (round && upright && Math.abs(d.x - d.z) < Math.max(d.x, d.z) * .25) made.push({ t: 'c', x: (bb.min.x + bb.max.x) / 2, z: (bb.min.z + bb.max.z) / 2, r: Math.min(d.x, d.z) / 2 * (/Sphere|Icosa|Dodeca/.test(gt) ? .86 : .94), y0: bb.min.y, y1: bb.max.y });
    else if (mx <= 24) { const k = round ? .82 : .92, cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;   // small odd things: one box, pulled in a little at the sides
      made.push({ t: 'b', x0: cx - d.x / 2 * k, x1: cx + d.x / 2 * k, y0: bb.min.y, y1: bb.max.y, z0: cz - d.z / 2 * k, z1: cz + d.z / 2 * k }); }
    else for (const b of solidVoxels(o, bb, d)) made.push(b);
    for (const c of made) { c.m = o; c.small = small; c.auto = true; cols.push(c); }
    if (made.length) SOLID.list.push({ m: o, e: o.matrixWorld.elements.slice(), cs: made });
    SOLID.made += made.length;
  }
  SOLID.meshes = out.length;
  // never wall in a checkpoint or a spawn point
  const spots = []; for (const id of Object.keys(LEVELS)) { const L = LEVELS[id]; if (L.cps) for (const p of L.cps) spots.push(p); }
  for (const w of WARPS) { const p = typeof w[2] === 'function' ? w[2]() : w[2]; if (p) spots.push([p.x, p.y, p.z]); }
  for (const S of SOLID.list) for (const c of S.cs) for (const p of spots) { const x = p[0], y = p[1] + 2, z = p[2];
    if (y < c.y0 - 1 || y > c.y1 + 3) continue;
    if (c.t === 'b' ? (x > c.x0 - 2 && x < c.x1 + 2 && z > c.z0 - 2 && z < c.z1 + 2) : Math.hypot(x - c.x, z - c.z) < c.r + 2) { c.y0 = -999; c.y1 = -998; }
  }
}
// boxes standing in columns, from the cells the surface passes through (filled top to bottom)
function solidVoxels(o, bb, d) {
  const geo = o.geometry, pa = geo.attributes.position, idx = geo.index, nt = idx ? idx.count / 3 : pa.count / 3;
  let cell = Math.min(5, Math.max(1.3, Math.max(d.x, d.y, d.z) / 9));
  const A = V3(), B = V3(), C = V3(), P = V3(), e1 = V3(), e2 = V3();
  for (let tries = 0; tries < 4; tries++) {
    const colm = new Map(), put = p => { const i = Math.floor((p.x - bb.min.x) / cell), j = Math.floor((p.y - bb.min.y) / cell), k = Math.floor((p.z - bb.min.z) / cell), q = i + ',' + k; const c = colm.get(q); if (!c) colm.set(q, [i, k, j, j]); else { if (j < c[2]) c[2] = j; if (j > c[3]) c[3] = j; } };
    const tstep = Math.max(1, Math.floor(nt / 6000));
    for (let t = 0; t < nt; t += tstep) {
      const ia = idx ? idx.getX(t * 3) : t * 3, ib = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, ic = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
      A.fromBufferAttribute(pa, ia).applyMatrix4(o.matrixWorld); B.fromBufferAttribute(pa, ib).applyMatrix4(o.matrixWorld); C.fromBufferAttribute(pa, ic).applyMatrix4(o.matrixWorld);
      put(A); put(B); put(C);
      // an even spread over the triangle, finer than a cell along its longest edge (no randomness: every machine gets the same colliders)
      const g = Math.min(48, Math.ceil(Math.max(A.distanceTo(B), B.distanceTo(C), C.distanceTo(A)) / (cell * .6))); for (let a = 0; a <= g; a++) for (let b = 0; a + b <= g; b++) { const u = a / g, w = b / g; P.copy(A).addScaledVector(e1.subVectors(B, A), u).addScaledVector(e2.subVectors(C, A), w); put(P); }
    }
    // merge columns into boxes: runs along x, then runs of runs along z
    const rows = new Map(); for (const c of colm.values()) { const q = c[1] + '|' + c[2] + '|' + c[3]; let L = rows.get(q); if (!L) rows.set(q, L = []); L.push(c[0]); }
    const runs = []; for (const [q, xs] of rows) { const [k, j0, j1] = q.split('|').map(Number); xs.sort((a, b) => a - b); let s = xs[0], p = xs[0]; for (let i = 1; i <= xs.length; i++) { if (i < xs.length && xs[i] === p + 1) { p = xs[i]; continue; } runs.push({ i0: s, i1: p, k0: k, k1: k, j0, j1 }); if (i < xs.length) s = p = xs[i]; } }
    runs.sort((a, b) => a.i0 - b.i0 || a.i1 - b.i1 || a.j0 - b.j0 || a.j1 - b.j1 || a.k0 - b.k0);
    const boxes = []; for (const r of runs) { const prev = boxes[boxes.length - 1]; if (prev && prev.i0 === r.i0 && prev.i1 === r.i1 && prev.j0 === r.j0 && prev.j1 === r.j1 && prev.k1 === r.k0 - 1) prev.k1 = r.k0; else boxes.push({ ...r }); }
    if (boxes.length > 24 && tries < 3) { cell *= 1.5; continue; }
    return boxes.map(r => ({ t: 'b', x0: bb.min.x + r.i0 * cell, x1: Math.min(bb.max.x, bb.min.x + (r.i1 + 1) * cell), y0: bb.min.y + r.j0 * cell, y1: Math.min(bb.max.y, bb.min.y + (r.j1 + 1) * cell), z0: bb.min.z + r.k0 * cell, z1: Math.min(bb.max.z, bb.min.z + (r.k1 + 1) * cell) }));
  }
  return [];
}
// a thing that moves after it was made solid loses its colliders (a few checked each frame)
function solidTick() {
  const L = SOLID.list; if (!L.length) return;
  for (let n = 0; n < 24; n++) {
    const S = L[SOLID.i = (SOLID.i + 1) % L.length]; if (S.dead) continue; const a = S.m.matrixWorld.elements;
    for (let k = 0; k < 16; k++) if (Math.abs(a[k] - S.e[k]) > .02) { S.dead = true; for (const c of S.cs) { c.y0 = -999; c.y1 = -998; } break; }
  }
}

// =====================================================================
//  拎得起嘅嘢都係真物件 — loose household things become real objects.
//  Every small thing standing loose on a floor, a counter, a shelf or a table (a can, a cup, a box,
//  a book, a toy…) becomes a resizable: Dad's gun grows and shrinks it, the bear shoves it, it falls
//  off edges with a clatter. Structural things, the furniture itself, anything the game moves or
//  switches, and anything that glows stay as they are. Same result on every machine.
// =====================================================================
const PROPS = { n: 0 };
function autoProps() {
  if (window.__NOPROPS) return;
  const skip = solidSkipSet(), box = new THREE.Box3(), d = V3();
  for (const Z of ZL) {
    const lv = Z.lv; if (!lv || Z.id === 'portal') continue; lv.updateMatrixWorld(true);
    const inCore = p => Z.core.some(b => p.x > b[0] && p.x < b[1] && p.y > b[2] && p.y < b[3] - 20 && p.z > b[4] && p.z < b[5]);
    const cand = [];
    for (const o of lv.children) {
      if (skip.has(o) || !o.visible || o.userData.noSolid || o.userData.noProp || o.isLight || !(o.isMesh || o.isGroup) || o.renderOrder) continue;
      let meshes = 0, bad = false;
      o.traverse(q => { if (q.isLight || q.isPoints || q.isLine || q.isSprite || q.isInstancedMesh || (q !== o && !q.visible)) bad = true;
        if (q.isMesh) { meshes++; const m = Array.isArray(q.material) ? q.material[0] : q.material; if (!m || m.isShaderMaterial || m.blending === THREE.AdditiveBlending || (m.emissiveIntensity > .6 && m.emissive && m.emissive.getHex() !== 0) || m.isMeshBasicMaterial) bad = true;
          if (q.geometry && /Plane|Circle|Ring|Shape/.test(q.geometry.type) && meshes === 1 && o === q) bad = true; } });
      if (bad || !meshes || meshes > 30) continue;
      box.setFromObject(o); box.getSize(d); const mx = Math.max(d.x, d.y, d.z), mn = Math.min(d.x, d.y, d.z);
      if (mx < 3.5 || mx > 36 || mn < 1.5) continue;
      if (d.y > 15 && d.y > 2.5 * Math.max(d.x, d.z)) continue;                          // posts and poles
      const c = box.getCenter(V3()); if (!inCore(c)) continue;
      if (machine && machine.x !== undefined && Math.hypot(c.x - machine.x, c.z - machine.z) < 70) continue;   // the shrinking machine and its bench
      // standing loose on something wider than itself (its underside a hair above a collider's top)
      const [sup, sc] = supportAt(c.x, c.z, Math.min(d.x, d.z) * .3, box.min.y + 1.5);
      if (sup < box.min.y - 2.5 || sup > box.min.y + 1.5 || !sc) continue;
      if (sc.t === 'b' ? (sc.x1 - sc.x0 < d.x + 4 || sc.z1 - sc.z0 < d.z + 4) : sc.r * 2 < Math.max(d.x, d.z) + 4) continue;   // (a cap on a post isn't loose)
      cand.push({ o, bb: box.clone() });
    }
    // a candidate that touches something else that isn't loose (a table leg's foot, a lamp's base, a finial on a fence) is part of that thing
    const touch = (a, b, t) => Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x) > -t && Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y) > -t && Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z) > -t;
    const meshBoxes = new Map(); lv.traverse(q => { if (q.isMesh && !q.isInstancedMesh) meshBoxes.set(q, new THREE.Box3().setFromObject(q)); });
    for (let pass = 0, changed = true; changed && pass < 6; pass++) {
      changed = false; const live = new Set(cand.map(q => q.o)), others = [], rising = [];
      const under = q => { for (let p = q; p && p !== lv; p = p.parent) { if (live.has(p)) return true; if (!p.visible) return true; } return false; };
      for (const o of lv.children) { if (live.has(o) || !o.visible) continue; const b = new THREE.Box3(); let any = false; o.traverse(q => { const mb = meshBoxes.get(q); if (mb && q.visible) { b.union(mb); any = true; } }); if (!any) continue;
        const s3 = b.getSize(V3()); if (Math.max(s3.x, s3.y, s3.z) <= 150) others.push(b); }
      for (const [q, b] of meshBoxes) if (!under(q)) rising.push(b);
      for (let i = cand.length - 1; i >= 0; i--) { const a = cand[i].bb;
        const attached = others.some(b => b.max.y > a.min.y + .6 && touch(a, b, .25));
        const under2 = rising.some(b => b.min.y > a.min.y - .5 && b.min.y < a.max.y + 1 && b.max.y > a.max.y + .5 && Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x) > .5 && Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z) > .5);
        if (attached || under2) { cand.splice(i, 1); changed = true; } }
    }
    // parts that overlap are one thing (a mug and its handle, a pot and its lid)
    const par = cand.map((_, i) => i), f = i => par[i] === i ? i : (par[i] = f(par[i]));
    for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) { const a = cand[i].bb, b = cand[j].bb;
      if (touch(a, b, .25)) par[f(i)] = f(j); }
    const groups = new Map(); cand.forEach((q, i) => { const k = f(i); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(q); });
    for (const list of groups.values()) {
      const bb = list[0].bb.clone(); for (const q of list) bb.union(q.bb); bb.getSize(d); if (Math.max(d.x, d.y, d.z) > 40 || list.length > 4) continue;
      let o = list[0].o; if (list.length > 1) { o = new THREE.Group(); lv.add(o); for (const q of list) o.attach(q.o); }
      // the colliders that were made for it go; the resizable brings its own
      const inside = c => c.t === 'b' ? c.x0 > bb.min.x - .6 && c.x1 < bb.max.x + .6 && c.z0 > bb.min.z - .6 && c.z1 < bb.max.z + .6 && c.y0 > bb.min.y - .6 && c.y1 < bb.max.y + .6
        : c.x - c.r > bb.min.x - .6 && c.x + c.r < bb.max.x + .6 && c.z - c.r > bb.min.z - .6 && c.z + c.r < bb.max.z + .6 && c.y0 > bb.min.y - .6 && c.y1 < bb.max.y + .6;
      let mine = false; o.traverse(q => { if (cols.some(c => c.m === q)) mine = true; });
      for (let i = cols.length - 1; i >= 0; i--) { const c = cols[i]; let ours = false; if (c.m) o.traverse(q => { if (q === c.m) ours = true; }); if (ours || (inside(c) && !c.door && !c.cat && !c.push)) cols.splice(i, 1); }
      let round = 0, all = 0; o.traverse(q => { if (q.isMesh) { all++; if (/Cylinder|Sphere|Lathe|Capsule|Torus|Cone/.test(q.geometry.type)) round++; } });
      addPropRes(o, bb, Math.max(d.x, d.y, d.z) < 10 ? '小東西' : '東西', round > all / 2 ? .84 : 1);
      PROPS.n++;
    }
  }
}
function addPropRes(o, bb, name, fill) {
  const d = bb.getSize(V3()), B0 = V3((bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2), mx = Math.max(d.x, d.y, d.z);
  o.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } });
  const c = { t: 'b', x0: 0, x1: 0, y0: B0.y, y1: 0, z0: 0, z1: 0, m: o, small: false, push: true };
  const r = { mesh: o, c, cx: B0.x, cz: B0.z, y0: B0.y, sx: d.x, sy: d.y, sz: d.z, s: 1, target: 1, min: .35, max: clamp(60 / mx, 1.5, 4), name, pulse: 0, fill,
    prop: { P0: o.position.clone(), S0: o.scale.clone(), B0 } };
  cols.push(c); resizables.push(r); o.userData.res = r; applyResize(r); return r;
}
