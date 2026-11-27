// =====================================================================
//  OUTSIDE — the whole house as one building, and the garden all round it (屋外)
//  · the outside walls: siding over a concrete plinth, windows where the rooms have them (the living room's
//    and her bedroom's: net curtains you can half see through), blinds drawn in the ones over rooms nobody goes
//    into, the front door under a little canopy, the back door with a cat flap in it
//  · the single-storey back extension (back hallway, storeroom, utility room) under a low lean-to roof, the
//    open light well the kitchen window looks into, the two-storey stair tower with a flat roof
//  · the garden: lawn all round, flower beds against the walls, a stepping-stone path down the side to the
//    patio at the back door, bins, a shed, the washing line, trees, tall fences and a hedge — and the
//    neighbours' houses beyond them, so the world doesn't stop at the fence
//  · in and out through the cat flap in the back door
// =====================================================================
const OUT = { k: 36 / 378, flap: null, flapA: 0, flapP: V3(690, 0, -626), backdrops: [], said: {}, inited: false };
const outLean = z => 282 + (z + 640) * OUT.k;            // the lean-to roof's top over the back extension (z -640 … -262)
const inLightWell = (x, z) => x > -157 && x < -46 && z > -312;

// ---------- the place ----------
// (after the house, the garage, the yard and the street in the list: wherever they overlap, they win)
zoneDef('garden', { floor: GY, env: 'yard', core: [
  [-1600, -330, -80, 520, -1600, 660],                    // down the west side (and the front corner)
  [-330, 1460, -80, 520, -1600, -632],                    // the back garden
  [-330, -302, -80, 520, -632, -262],                     // the strip beside the back extension
  [756, 1460, -80, 520, -632, -518], [920, 1460, -80, 520, -518, -270],   // behind the stair tower and the garage
  [-302, 736, 266, 520, -632, -262],                      // up on the extension's roof
  [720, 930, 520, 700, -530, -400],                       // the stair tower's flat roof
  [-330, 1460, -80, 520, 262, 660]                        // the front garden and the driveway
], peek: [
  [-1600, 3500, -80, 1200, 646, 1400],                    // from the street
  [1460, 2770, -80, 1200, -1600, 660],                    // from the yard over its fences
  [-700, 1600, 380, 1200, -1000, 700]                     // from the roofs
] });

// ---------- materials ----------
function outMats() {
  const C2 = (w, h, f) => { const [c, x] = cnv(w, h); f(x, w, h); return tex(c); };
  const blind = C2(64, 64, x => { x.fillStyle = '#e9e1d0'; x.fillRect(0, 0, 64, 64); for (let y = 0; y < 64; y += 8) { x.fillStyle = 'rgba(120,100,70,.28)'; x.fillRect(0, y + 6, 64, 2); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(0, y, 64, 1); } });
  const sheer = C2(64, 64, x => { x.fillStyle = '#f4f0e6'; x.fillRect(0, 0, 64, 64); for (let i = 0; i < 64; i += 4) { x.fillStyle = 'rgba(170,160,140,.22)'; x.fillRect(i, 0, 1, 64); } });
  const paver = C2(256, 256, x => { x.fillStyle = '#7d7a74'; x.fillRect(0, 0, 256, 256); for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const v = 124 + R(-12, 12) | 0; x.fillStyle = `rgb(${v},${v - 4},${v - 10})`; x.fillRect(i * 64 + 2, j * 64 + 2, 60, 60);
    for (let k = 0; k < 40; k++) { x.fillStyle = `rgba(${R(70, 110) | 0},${R(70, 100) | 0},${R(60, 90) | 0},${R(.05, .16)})`; x.fillRect(i * 64 + R(2, 60), j * 64 + R(2, 60), R(1, 4), R(1, 4)); } } });
  const hedge = (() => { const W = 256, n = noiseField(W, W, 4, 10, 761), h = new Float32Array(W * W);
    const c = fromFn(W, W, (x, y, i, o) => { const b = hashI(i * 5 + 7), leaf = b > .62 ? (b - .62) * 1.6 : 0, v = .5 + (n[i] - .5) * .55 + leaf * .45; o[0] = 46 * v; o[1] = 92 * v + 8; o[2] = 40 * v; h[i] = n[i] * .8 + leaf; });
    return { map: tex(c), normalMap: normalTex(h, W, W, 3) }; })();
  const leaf = C2(64, 64, x => { x.clearRect(0, 0, 64, 64); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28 + R(-.3, .3), d = R(6, 20); x.fillStyle = ['#3f6e2f', '#527f3a', '#335f28', '#628f44', '#47783a'][i % 5]; x.save(); x.translate(32 + Math.cos(a) * d, 32 + Math.sin(a) * d); x.rotate(a); x.beginPath(); x.ellipse(0, 0, 10, 6, 0, 0, 7); x.fill(); x.restore(); } });
  const felt = C2(128, 128, x => { x.fillStyle = '#3a3c3e'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(${R(80, 140) | 0},${R(80, 140) | 0},${R(80, 140) | 0},.2)`; x.fillRect(R(0, 128), R(0, 128), 1, 1); } for (let y = 0; y < 128; y += 32) { x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, y, 128, 2); } });
  const num = C2(128, 96, x => { x.fillStyle = '#f2efe6'; x.fillRect(0, 0, 128, 96); x.strokeStyle = '#2a2a2a'; x.lineWidth = 4; x.strokeRect(5, 5, 118, 86); x.fillStyle = '#2a2a2a'; x.font = '700 58px "Fredoka", sans-serif'; x.textAlign = 'center'; x.fillText('18', 64, 68); });
  return {
    sid: new THREE.MeshStandardMaterial({ ...genSiding(0xb7c4c8, 532), roughness: .85 }), sidN: new THREE.MeshStandardMaterial({ ...genSiding(0xc8c2b0, 531), roughness: .85 }), sidW: new THREE.MeshStandardMaterial({ ...genSiding(0xd8cfc4, 533), roughness: .85 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: .6 }), plinth: new THREE.MeshStandardMaterial({ color: 0x86827a, roughness: .95 }), conc: new THREE.MeshStandardMaterial({ color: 0x8c8880, roughness: .95 }),
    shM: new THREE.MeshStandardMaterial({ ...genShingles(943), roughness: .92, side: THREE.DoubleSide, normalScale: new THREE.Vector2(.9, .9) }), shR: new THREE.MeshStandardMaterial({ ...genShingles(947), color: 0x9a7a6a, roughness: .92, side: THREE.DoubleSide }),
    felt: new THREE.MeshStandardMaterial({ map: felt, roughness: .95 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x7e94a8, roughness: .04, metalness: .15, clearcoat: 1, transparent: true, opacity: .32, depthWrite: false }),
    glassD: new THREE.MeshPhysicalMaterial({ color: 0x4e6274, roughness: .05, metalness: .25, clearcoat: 1 }),
    blind: new THREE.MeshStandardMaterial({ map: blind, roughness: .9 }), sheer: new THREE.MeshStandardMaterial({ map: sheer, roughness: 1, transparent: true, opacity: .62, depthWrite: false }),
    door: new THREE.MeshPhysicalMaterial({ color: 0x9a3b2e, roughness: .45, clearcoat: .5 }), shutter: new THREE.MeshStandardMaterial({ color: 0x3e4549, roughness: .7 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc8a050, metalness: .8, roughness: .3 }), dark: new THREE.MeshStandardMaterial({ color: 0x2a2e33, roughness: .6, metalness: .3 }),
    gut: new THREE.MeshStandardMaterial({ color: 0xe8e8e4, roughness: .45, metalness: .1 }), metal: new THREE.MeshStandardMaterial({ color: 0xb4b8bc, metalness: .6, roughness: .4 }),
    grass: new THREE.MeshStandardMaterial({ ...genGrass(), roughness: .95, normalScale: new THREE.Vector2(.8, .8) }), soil: new THREE.MeshStandardMaterial({ map: genSoil(), roughness: 1 }),
    brick: new THREE.MeshStandardMaterial({ ...genBrick(), roughness: .9 }), fence: new THREE.MeshStandardMaterial({ ...genWood([150, 112, 76], [86, 60, 40], 521, 10), roughness: .9 }),
    wood: new THREE.MeshStandardMaterial({ ...genWood([168, 128, 88], [104, 74, 48], 571, 6), roughness: .85 }), bark: new THREE.MeshStandardMaterial({ ...genWood([96, 76, 60], [52, 40, 32], 541), roughness: 1 }),
    paver: new THREE.MeshStandardMaterial({ map: paver, roughness: .95 }), hedge: new THREE.MeshStandardMaterial({ ...hedge, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ map: leaf, transparent: true, alphaTest: .45, side: THREE.DoubleSide, roughness: .85 }), leafIn: new THREE.MeshStandardMaterial({ color: 0x2c4a22, roughness: 1 }),
    num: new THREE.MeshStandardMaterial({ map: num, roughness: .6 }),
    drive: (() => { const tm = MAT.floor.map.clone(), tn = MAT.floor.normalMap && MAT.floor.normalMap.clone(); for (const t of [tm, tn]) if (t) { t.repeat.set(1, 1); t.needsUpdate = true; } return new THREE.MeshStandardMaterial({ map: tm, normalMap: tn || null, color: 0xbab4aa, roughness: .9 }); })()
  };
}

// a box whose texture is laid in world space (siding boards line up across the pieces of a wall)
function wbox(x0, x1, y0, y1, z0, z1, mat, o = {}) {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv, s = o.uv || 120;
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)); uv.setXY(i, (ax > .5 ? p.getZ(i) : p.getX(i)) / s, (ay > .5 ? p.getZ(i) : p.getY(i)) / s); }
  const m = new THREE.Mesh(g, mat); m.castShadow = o.cast !== false; m.receiveShadow = true; (o.parent || LV).add(m);
  if (o.col !== false) cols.push({ t: 'b', x0, x1, y0, y1, z0, z1, m });
  return m;
}
// the open top of a gutter (drawn as a solid box): a dark channel inset along it, a few dead leaves lying in it
let GUT_TOP = null;
function gutTop(x0, x1, y, z0, z1, P) {
  if (!GUT_TOP) { const sh = new THREE.Shape(); sh.moveTo(0, -2.2); sh.quadraticCurveTo(1.5, -.2, 0, 2.2); sh.quadraticCurveTo(-1.5, -.2, 0, -2.2);
    GUT_TOP = { ch: new THREE.MeshStandardMaterial({ color: 0x4a4c48, roughness: .5 }), lf: [0x7a5a32, 0x8f6a3a, 0x5f5530].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .9, side: THREE.DoubleSide })), g: new THREE.ShapeGeometry(sh, 4) }; }
  box(x0 + 1.2, x1 - 1.2, y, y + .12, z0 + 1.3, z1 - 1.3, GUT_TOP.ch, { parent: P, col: false, cast: false });
  for (let x = x0 + R(4, 20); x < x1 - 4; x += R(14, 46)) { const m = new THREE.Mesh(GUT_TOP.g, GUT_TOP.lf[(x * 7 | 0) % 3]); m.rotation.set(-Math.PI / 2 + R(-.2, .2), 0, R(0, 6.3)); m.scale.setScalar(R(.8, 1.2)); m.position.set(x, y + .2, R(z0 + 2.5, z1 - 2.5)); P.add(m); }
}
// a wall with rectangular openings: along x (z0…z1 thick) or along z (x0…x1 thick); holes [a0, a1, y0, y1]
function wallHoles(alongX, a0, a1, y0, y1, t0, t1, holes, mat, P) {
  const xs = [...new Set([a0, a1, ...holes.flatMap(h => [h[0], h[1]])])].filter(v => v >= a0 && v <= a1).sort((p, q) => p - q);
  const seg = (s0, s1, ya, yb) => alongX ? wbox(s0, s1, ya, yb, t0, t1, mat, { parent: P }) : wbox(t0, t1, ya, yb, s0, s1, mat, { parent: P });
  for (let i = 0; i < xs.length - 1; i++) {
    const s0 = xs[i], s1 = xs[i + 1]; if (s1 - s0 < .01) continue; const mid = (s0 + s1) / 2; let y = y0;
    for (const h of holes.filter(h => h[0] < mid && h[1] > mid).sort((p, q) => p[2] - q[2])) { if (h[2] > y) seg(s0, s1, y, h[2]); y = Math.max(y, h[3]); }
    if (y1 > y) seg(s0, s1, y, y1);
  }
}
// boxes placed relative to an outside wall's face: a along the wall, d outwards from the face (d < 0: into the wall)
function faceBox(P, face, f) {
  const s = face[1] === '+' ? 1 : -1, alongX = face[0] === 'z';
  return (a0, a1, y0, y1, d0, d1, mat, o = {}) => { const p0 = f + s * d0, p1 = f + s * d1, lo = Math.min(p0, p1), hi = Math.max(p0, p1);
    return alongX ? box(a0, a1, y0, y1, lo, hi, mat, { parent: P, ...o }) : box(lo, hi, y0, y1, a0, a1, mat, { parent: P, ...o }); };
}
// a flat card on a wall's face, facing out (d outwards from the face)
function facePlane(P, face, f, a, y, d, w, h, mat, o = {}) {
  const s = face[1] === '+' ? 1 : -1, m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  if (face[0] === 'z') { m.position.set(a, y, f + s * d); m.rotation.y = s > 0 ? 0 : Math.PI; } else { m.position.set(f + s * d, y, a); m.rotation.y = s * Math.PI / 2; }
  m.castShadow = false; m.receiveShadow = !!o.rcv; P.add(m); return m;
}
// a window in an outside wall: casing, a sill to stand on, the glass, a glazing bar — and, behind the glass,
// net curtains (rooms you can look into) or blinds drawn (rooms nobody goes into); shutters on the blind ones
function outWindow(P, M, face, f, c, cy, w, h, kind, openId) {
  const B = faceBox(P, face, f), a0 = c - w / 2, a1 = c + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, nc = { col: false };
  B(a0 - 6, a1 + 6, y1, y1 + 7, -1, 2.2, M.trim, nc); B(a0 - 6, a0, y0, y1, -1, 2.2, M.trim, nc); B(a1, a1 + 6, y0, y1, -1, 2.2, M.trim, nc);
  B(a0 - 9, a1 + 9, y0 - 5, y0, -3, 7, M.trim);                                                           // the sill (a ledge)
  B(a0, a1, y0, y0 + .6, -10, -3, M.trim, nc); B(a0, a1, y1 - .6, y1, -10, -3, M.trim, nc); B(a0, a0 + .6, y0, y1, -10, -3, M.trim, nc); B(a1 - .6, a1, y0, y1, -10, -3, M.trim, nc);
  const ytr = cy + h * .18, cur = kind === 'sheer' ? M.sheer : M.blind;
  B(c - 1.6, c + 1.6, y0, y1, -5.4, -4, M.trim, nc); B(a0, a1, ytr - 1.4, ytr + 1.4, -5.4, -4, M.trim, nc);
  if (!openId) { facePlane(P, face, f, c, cy, -5, w, h, M.glass); B(a0, a1, y0, y1, -5.8, -4.8, M.trim, { cast: false, noRay: true, col: true }).visible = false; facePlane(P, face, f, c, cy, -7, w, h, cur, { rcv: true }); }   // (the glass: solid, see-through)
  else {   // a window that opens (e47_windows.js): the lower left light is its own piece, glass, curtain and all
    const q = [a0, c - 1.6, y0, ytr - 1.4], parts = [q, [c - 1.6, a1, y0, y1], [a0, c - 1.6, ytr - 1.4, y1]], W = (OUT.win = OUT.win || {})[openId] = { cols: [] };
    parts.forEach(([u0, u1, v0, v1], i) => { const g = facePlane(P, face, f, (u0 + u1) / 2, (v0 + v1) / 2, -5, u1 - u0, v1 - v0, M.glass), cp = facePlane(P, face, f, (u0 + u1) / 2, (v0 + v1) / 2, -7, u1 - u0, v1 - v0, cur, { rcv: true });
      const lo = Math.min(f - 5.8, f - 4.8), hi = Math.max(f - 5.8, f - 4.8), cl = { t: 'b', x0: u0, x1: u1, y0: v0, y1: v1, z0: lo, z1: hi, noRay: true }; cols.push(cl);
      if (!i) { W.gl = g; W.cu = cp; W.col = cl; W.y = [v0, v1]; } }); }
  if (kind === 'blind') for (const s of [-1, 1]) { const x0 = s < 0 ? a0 - 6 - w * .42 : a1 + 6, x1 = x0 + w * .42; B(x0, x1, y0, y1, 0, 1.6, M.shutter, nc); for (let y = y0 + 6; y < y1 - 4; y += 7) B(x0 + 2, x1 - 2, y, y + 1.2, 1.6, 2.4, M.shutter, nc); }
}

// ---------- the house from outside (part of the always-drawn house shell) ----------
function buildHouseOutside(P) {
  const M = OUT.M || (OUT.M = outMats()); const W0 = -330, W1 = 912, ZF = 262, ZB = -262, WT = 526, nc = { col: false };
  // ---- main block: front, west and the back above the extension ----
  wallHoles(true, W0, W1, GY, WT, ZF - 10, ZF, [[470, 542, GY, 212], [700, 850, 100, 210], [574, 666, 340, 450], [-240, -140, 100, 210], [40, 140, 100, 210], [-240, -140, 340, 450], [40, 140, 340, 450]], M.sid, P);
  wallHoles(false, ZB, ZF - 10, GY, WT, W0, W0 + 10, [[-150, -50, 340, 450], [70, 170, 340, 450], [-114, -86, 0, 18]], M.sid, P);   // (the last: the crawl tunnel from the kitchen's mouse hole goes through it, behind the raised planter)
  wallHoles(true, W0 + 10, 728, 300, WT, ZB, ZB + 10, [[-240, -140, 360, 450], [40, 140, 360, 450]], M.sid, P);
  wbox(W0 + 10, -302, GY, 300, ZB, ZB + 10, M.sid, { parent: P });
  for (const [c, cy, w, h, k, id] of [[775, 155, 150, 110, 'sheer', 'win_l'], [620, 395, 92, 110, 'sheer', 'win_u'], [-190, 155, 100, 110, 'blind'], [90, 155, 100, 110, 'blind'], [-190, 395, 100, 110, 'blind'], [90, 395, 100, 110, 'blind']]) outWindow(P, M, 'z+', ZF, c, cy, w, h, k, id);
  for (const [c, cy] of [[-100, 395], [120, 395]]) outWindow(P, M, 'x-', W0, c, cy, 100, 110, 'blind');
  for (const [c, cy] of [[-190, 405], [90, 405]]) outWindow(P, M, 'z-', ZB, c, cy, 100, 90, 'blind');
  // ---- the back extension: one storey, walls to 282 ----
  wbox(-302, -294, GY, 282, -632, ZB, M.sid, { parent: P });                                               // west
  wallHoles(true, -302, 756, GY, 282, -632, -624, [[646, 734, GY, 209]], M.sid, P);                        // back (the back door)
  wbox(748, 756, GY, 282, -624, -518, M.sid, { parent: P });                                               // east, up to the stair tower
  // ---- the stair tower: two storeys, a flat roof with a low parapet ----
  wbox(748, 920, GY, 552, -518, -510, M.sid, { parent: P }); wbox(728, 748, 282, 552, -518, -510, M.sid, { parent: P });
  wbox(912, 920, GY, 552, -510, -262, M.sid, { parent: P }); wbox(728, 736, 282, 552, -510, -262, M.sid, { parent: P });
  wbox(724, 924, 546, 552, -522, -262, M.plinth, { parent: P }); for (const [x0, x1, z0, z1] of [[724, 924, -522, -516], [724, 730, -516, -262], [918, 924, -516, -262]]) { wbox(x0, x1, 552, 562, z0, z1, M.sid, { parent: P }); box(x0 - 1, x1 + 1, 562, 564, z0 - 1, z1, M.trim, { parent: P, col: false }); }
  // its round landing window (the inside of it is the painted one on the landing)
  { const B = faceBox(P, 'z-', -518); const ring = new THREE.Mesh(new THREE.TorusGeometry(27, 3, 10, 40), M.trim); ring.position.set(824, 440, -519); P.add(ring);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(26, 32), M.glassD); gl.position.set(824, 440, -518.4); gl.rotation.y = Math.PI; P.add(gl); B(796, 852, 408, 412, -2, 5, M.trim); }
  // ---- the lean-to roof over the extension (a notch round the light well) ----
  { const pts = [[-310, -640], [764, -640], [764, -518], [736, -518], [736, ZB], [-46, ZB], [-46, -312], [-157, -312], [-157, ZB], [-310, ZB]].map(([x, z]) => new THREE.Vector2(x, z));
    const faces = THREE.ShapeUtils.triangulateShape(pts, []), pos = [], uv = [], idx = [];
    for (const q of pts) { const y = outLean(q.y); pos.push(q.x, y, q.y); uv.push(q.x / 230, -q.y / 230); }
    for (const [a, b, c] of faces) { const A = pts[a], Bq = pts[b], C = pts[c]; ((Bq.y - A.y) * (C.x - A.x) - (Bq.x - A.x) * (C.y - A.y)) >= 0 ? idx.push(a, b, c) : idx.push(a, c, b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, M.shM); m.receiveShadow = true; m.castShadow = false; P.add(m);
    slopeCol({ x0: -310, x1: 764, z0: -640, z1: ZB, y0: outLean(-640) - 7, y1: outLean(ZB) + 2, th: 6, top: (x, z) => (x > 736 && z > -518) || inLightWell(x, z) ? -1e9 : outLean(z) });
    // fascia round the edges, flashing round the light well and against the wall, the gutter and its downpipes
    const fz = (x0, x1, z) => box(x0, x1, outLean(z) - 9, outLean(z), z - 2, z, M.trim, { parent: P, col: false });
    fz(-312, 766, -640);
    for (const [x0, x1, za, zb] of [[-312, -310, -640, ZB], [764, 766, -640, -518]]) { const g2 = new THREE.BoxGeometry(x1 - x0, 9, zb - za); const pz = g2.attributes.position; for (let i = 0; i < pz.count; i++) { const z = pz.getZ(i) + (za + zb) / 2; pz.setY(i, pz.getY(i) - 4.5 + outLean(z)); pz.setZ(i, z); pz.setX(i, pz.getX(i) + (x0 + x1) / 2); } g2.computeVertexNormals(); const fm = new THREE.Mesh(g2, M.trim); fm.castShadow = true; P.add(fm); }
    box(-157, -46, outLean(-312) - 6, outLean(-312) + 2, -314, -312, M.metal, { parent: P, col: false });
    for (const x of [-159, -46]) { const g3 = new THREE.BoxGeometry(2, 6, 50); g3.translate(x + 1, 0, -287); const p3 = g3.attributes.position; for (let i = 0; i < p3.count; i++) p3.setY(i, p3.getY(i) + outLean(p3.getZ(i)) - 2); g3.computeVertexNormals(); P.add(new THREE.Mesh(g3, M.metal)); }
    box(-310, 728, outLean(ZB) - 1, outLean(ZB) + 8, ZB - 2, ZB, M.metal, { parent: P, col: false });
    box(-312, 766, outLean(-640) - 12, outLean(-640) - 3, -650, -642, M.gut, { parent: P, col: false });
    for (const x of [-300, 754]) { cyl(x, -646, 3.2, GY + 10, outLean(-640) - 8, M.gut, { parent: P, seg: 12, col: false }); box(x - 6, x + 6, GY, GY + 4, -654, -638, M.gut, { parent: P, col: false }); } }
  // ---- the main roof's back gutter (the stair tower stops it) and downpipes at the corners ----
  { const E = 552 - 28 * RF.p; box(-358, 724, E - 16, E - 6, -301, -293, M.gut, { parent: P, col: false }); gutTop(-358, 724, E - 6, -301, -293, P);
    for (const z of [-297, 297]) { cyl(-346, z, 3.4, GY + 10, E - 10, M.gut, { parent: P, seg: 12, col: false }); box(-354, -338, GY, GY + 5, z - 9, z + 9, M.gut, { parent: P, col: false }); } }
  // ---- a downpipe from the main roof's back gutter down onto the lean-to roof (a grip: the climb from the lean-to up
  //      to the main roof — up the pipe, round the gutter's lip, onto the eave), held off the wall by two long stays ----
  { const E = 552 - 28 * RF.p, x = 380, z = -297, yb = outLean(z);
    cyl(x, z, 3.2, yb + 4, E - 16, M.gut, { parent: P, seg: 12, col: false });
    { const sh = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 10, 12), M.gut); sh.rotation.x = -.9; sh.position.set(x, yb + 3.4, z - 3.2); sh.castShadow = true; P.add(sh); }   // (the shoe at its foot)
    cyl(x, z, 4.6, E - 20, E - 15, M.gut, { parent: P, seg: 12, col: false });                                           // (the outlet collar under the gutter)
    for (const y of [392, 470]) { box(x - .8, x + .8, y - .8, y + .8, -294, -262, M.dark, { parent: P, col: false }); cyl(x, z, 3.9, y - 2.5, y + 2.5, M.dark, { parent: P, seg: 12, col: false }); }
    cols.push({ t: 'b', x0: x - 3.4, x1: x + 3.4, y0: yb, y1: E - 16, z0: z - 3.4, z1: z + 3.4, grip: true }); OUT.upPipe = V3(x, yb, z); }
  // ---- white corner boards up every outside corner ----
  for (const [x, z, y0, y1, sx, sz] of [[W0, ZF, GY, WT, -1, 1], [W0, ZB, GY, WT, -1, -1], [-302, -632, GY, 282, -1, -1], [756, -632, GY, 282, 1, -1], [920, -518, GY, 552, 1, -1], [728, -518, 282, 552, -1, -1]]) {
    const o = (a, b) => [Math.min(a, b), Math.max(a, b)], [ax0, ax1] = o(x, x + sx * 1.6), [az0, az1] = o(z - sz * 7, z + sz * 1.6), [bz0, bz1] = o(z, z + sz * 1.6), [bx0, bx1] = o(x - sx * 7, x);
    box(ax0, ax1, y0, y1, az0, az1, M.trim, { parent: P, col: false }); box(bx0, bx1, y0, y1, bz0, bz1, M.trim, { parent: P, col: false }); }
  // ---- the plinth round the bottom of every outside wall ----
  const pl = (x0, x1, z0, z1) => box(x0, x1, GY, 6, z0, z1, M.plinth, { parent: P, col: false, cast: false });
  pl(W0 - 3, 466, ZF - 2, ZF + 3); pl(546, W1, ZF - 2, ZF + 3); pl(W0 - 3, W0 + 2, ZB, -142); pl(W0 - 3, W0 + 2, -50, ZF); pl(W0 - 3, -302, ZB - 3, ZB + 2); pl(-305, -300, -635, ZB);
  pl(-305, 646, -635, -630); pl(734, 759, -635, -630); pl(754, 759, -632, -518); pl(756, 923, -521, -516); pl(918, 923, -518, -270);
  // ---- the front door: a red door in a white surround, a canopy over it, the stoop, the number, a lamp ----
  { const B = faceBox(P, 'z+', ZF);
    B(462, 470, GY, 216, -10, 2.4, M.trim, nc); B(542, 550, GY, 216, -10, 2.4, M.trim, nc); B(462, 550, 210, 218, -10, 2.4, M.trim, nc);
    // (the door itself, with its cat flap, is e47_windows.js)
    const pn = facePlane(P, 'z+', ZF, 441, 170, .6, 26, 19, M.num); pn.receiveShadow = false;
    // canopy: a little gable on two brackets
    const cy = 224; for (const x of [457, 555]) { box(x - 2, x + 2, cy - 22, cy, ZF, ZF + 22, M.trim, { parent: P, col: false }); }
    for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(62, 3, 34), M.shM); m.position.set(506 + s * 26, cy + 9, ZF + 16); m.rotation.z = -s * .42; m.castShadow = true; P.add(m); }
    box(449, 563, cy - 2, cy + 3, ZF, ZF + 34, M.trim, { parent: P }); box(445, 567, cy - 6, cy - 2, ZF + 30, ZF + 35, M.trim, { parent: P, col: false });
    // the stoop: two steps up to the door
    box(452, 560, GY, GY + 10, ZF, ZF + 44, M.conc, { parent: P }); box(462, 550, GY + 10, 0, ZF - 10, ZF + 24, M.conc, { parent: P });
    box(467, 545, 0, .4, ZF - 4, ZF + 20, new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 1 }), { parent: P, cast: false, col: false });
    // a lamp beside the door
    box(567, 575, 168, 196, ZF, ZF + 3, M.dark, { parent: P, col: false }); const lamp = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 14, 12), M.glassD); lamp.position.set(571, 186, ZF + 8); P.add(lamp); box(565, 577, 194, 197, ZF + 2, ZF + 14, M.dark, { parent: P, col: false });
    // pots of lavender on the stoop
    const potM = new THREE.MeshStandardMaterial({ color: 0xb8643a, roughness: .9 }), stM = new THREE.MeshStandardMaterial({ color: 0x5a7a4a }), lvM = new THREE.MeshStandardMaterial({ color: 0x8a6ad0, roughness: .8 }), stG = new THREE.CylinderGeometry(.4, .4, 20, 4), lvG = new THREE.SphereGeometry(1.6, 6, 4);
    for (const x of [455, 557]) { cyl(x, ZF + 34, 8, GY + 10, GY + 26, potM, { parent: P, seg: 16 }); for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(stG, stM); m.position.set(x + R(-5, 5), GY + 36, ZF + 34 + R(-5, 5)); m.rotation.set(R(-.25, .25), 0, R(-.25, .25)); P.add(m); const fl = new THREE.Mesh(lvG, lvM); fl.position.set(m.position.x, GY + 46, m.position.z); fl.scale.y = 2.2; P.add(fl); } } }
  // ---- the back door from outside: its surround, a step down to the patio, a canopy and a lamp ----
  { const B = faceBox(P, 'z-', -632);
    B(640, 646, GY, 215, -8, 2.4, M.trim, nc); B(734, 740, GY, 215, -8, 2.4, M.trim, nc); B(640, 740, 209, 215, -8, 2.4, M.trim, nc);
    box(630, 750, GY, 0, -672, -624, M.conc, { parent: P });                                               // the step (the door's threshold)
    box(628, 752, 226, 230, -664, -632, M.trim, { parent: P }); for (const x of [632, 748]) box(x - 2, x + 2, 206, 226, -640, -632, M.trim, { parent: P, col: false });
    box(618, 626, 176, 200, -635, -632, M.dark, { parent: P, col: false }); const lamp = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 14, 12), M.glassD); lamp.position.set(622, 190, -640); P.add(lamp); box(616, 628, 198, 201, -646, -634, M.dark, { parent: P, col: false });
    // an outdoor tap with a hose reel under it, the dryer's vent
    box(596, 602, 40, 46, -640, -632, M.brass, { parent: P, col: false }); cyl(599, -652, 18, GY, GY + 4, M.dark, { parent: P, seg: 16 });
    { const r = new THREE.Mesh(new THREE.TorusGeometry(13, 3, 10, 24), new THREE.MeshStandardMaterial({ color: 0x2f8a3a, roughness: .5 })); r.position.set(599, GY + 22, -652); P.add(r); cols.push({ t: 'c', x: 599, z: -652, r: 16, y0: GY, y1: GY + 38 }); }
    box(530, 550, 56, 70, -640, -632, M.metal, { parent: P }); for (let y = 58; y < 69; y += 3) box(531, 549, y, y + 1, -641.5, -640, M.dark, { parent: P, col: false }); }
  // ---- the west wall's bits: the air conditioner on its brackets (a ledge), the meter box, a tap ----
  { const B = faceBox(P, 'x-', W0);
    B(-40, 40, 280, 330, 0, 32, M.trim); for (let z = -36; z < 38; z += 5) B(z, z + 2, 288, 322, 32, 33, M.dark, nc); for (const z of [-34, 34]) B(z - 2, z + 2, 272, 280, 0, 34, M.dark);
    B(-150, -110, 110, 160, 0, 10, M.trim); B(-146, -114, 128, 150, 10, 10.6, M.glassD, nc);
    B(140, 146, 34, 40, 0, 8, M.brass, nc); }
  // remember the painted views the living room and her bedroom have outside their windows: they hide from outside
  OUT.backdropsWanted = true;
  // windows that open, the front door and its cat flap, the light well's drainpipe (e47_windows.js)
  buildWindows(P);
}

// ---------- the raised planter against the west wall ----------
// Herbs on top. Under it, out of sight: the top of the wall cavity (前拍檔's home), which reaches out past the house
// wall here, and the crawl chamber behind the kitchen's mouse hole. An old clay drain pipe comes out at its west end:
// climb the brickwork into it and it leads into that chamber — the gap down to her home, the tunnel to the kitchen.
const PLANT = { X0: -538, X1: -330, Z0: -142, Z1: -50, TOP: 30, PZ: -100, PY: 7, PR: 9, PX0: -544, PX1: -428 };
function buildPlanter(M, FL, ST2, SH) {
  const { X0, X1, Z0, Z1, TOP, PZ, PY, PR, PX0, PX1 } = PLANT, nc = { col: false }, U = { uv: 90 };
  const cap = new THREE.MeshStandardMaterial({ color: 0xb4aa9a, roughness: .9 });
  // brick walls: the two long sides, and the west end round the pipe
  wbox(X0, X1, GY, TOP, Z0, Z0 + 4, M.brick, U); wbox(X0, X1, GY, TOP, Z1 - 4, Z1, M.brick, U);
  wbox(X0, X0 + 8, GY, TOP, Z0 + 4, PZ - 11, M.brick, U); wbox(X0, X0 + 8, GY, TOP, PZ + 11, Z1 - 4, M.brick, U);
  wbox(X0, X0 + 8, GY, PY - 11, PZ - 11, PZ + 11, M.brick, U); wbox(X0, X0 + 8, PY + 11, TOP, PZ - 11, PZ + 11, M.brick, U);
  // stone coping round the top, the soil inside (just under the coping's lip)
  box(X0 - 3, X0 + 9, TOP, TOP + 3, Z0 - 3, Z1 + 3, cap, { uv: 40 }); box(X0 + 9, X1, TOP, TOP + 3, Z0 - 3, Z0 + 5, cap, { uv: 40 }); box(X0 + 9, X1, TOP, TOP + 3, Z1 - 5, Z1 + 3, cap, { uv: 40 });
  box(X0 + 8, X1, TOP - 6, TOP - 1, Z0 + 4, Z1 - 4, M.soil, { uv: 40, cast: false });
  // herbs: lavender, rosemary and thyme bushes, a few white daisies
  for (let i = 0; i < 46; i++) { const x = R(X0 + 14, X1 - 8), z = R(Z0 + 10, Z1 - 10), h = R(8, 22); ST2.push([x, z, h, TOP - 1]); FL.push([x, TOP - 1 + h, z, R(1.6, 2.8), i % 5 ? (i % 3 ? 0x8a6ad0 : 0x9a7ae0) : 0xf4f0ea]); }
  for (const [x, z, r] of [[-516, -122, 11], [-470, -70, 9], [-420, -118, 12], [-372, -76, 10], [-350, -120, 8]]) SH.push([x, TOP - 1 + r * .55, z, r]);
  // moss and a damp stain under the pipe's mouth
  { const ms = new THREE.MeshStandardMaterial({ color: 0x55702f, roughness: 1, flatShading: true }), mg = new THREE.IcosahedronGeometry(1, 0);
    for (const [y, z, r] of [[-5, -104, 2.4], [-7, -97, 2], [-9, -101, 2.8], [-12, -95, 1.8], [-14, -106, 2.2], [-17, -99, 3], [-18, -92, 2], [-18, -110, 2.4], [-3, -111, 1.4], [-2, -90, 1.6]]) {
      const m = new THREE.Mesh(mg, ms); m.position.set(X0 - .3, y, z); m.scale.set(.7, r * .8, r); m.rotation.x = R(0, 3); m.receiveShadow = true; LV.add(m); } }
  { const dm = new THREE.MeshStandardMaterial({ color: 0x3e3022, roughness: .85 });
    for (const [x, z, r] of [[X0 - 10, PZ, 9], [X0 - 18, PZ + 5, 6], [X0 - 15, PZ - 6, 5]]) { const d = new THREE.Mesh(new THREE.CircleGeometry(r, 20), dm); d.rotation.x = -Math.PI / 2; d.position.set(x, GY + .06, z); d.receiveShadow = true; LV.add(d); } }
  // the pipe: glazed clay, its socket end sticking out of the brickwork, silt along its floor
  { const len = PX1 - PX0, cx = (PX0 + PX1) / 2, tc = new THREE.MeshStandardMaterial({ color: 0xa65a3c, roughness: .7 }), tin = new THREE.MeshStandardMaterial({ color: 0x6e3a26, roughness: .95, side: THREE.BackSide });
    const tube = (r, l, x, m) => { const g = new THREE.CylinderGeometry(r, r, l, 32, 1, true); g.rotateZ(Math.PI / 2); const t = new THREE.Mesh(g, m); t.position.set(x, PY, PZ); t.castShadow = true; t.receiveShadow = true; LV.add(t); return t; };
    tube(PR + 2, len, cx, tc); tube(PR, len, cx, tin); tube(PR + 4, 7, PX0 + 3.5, tc); tube(PR + .2, 7, PX0 + 3.5, tin);
    const ring = new THREE.Mesh(new THREE.RingGeometry(PR, PR + 4, 32), tc); ring.rotation.y = -Math.PI / 2; ring.position.set(PX0 - .01, PY, PZ); LV.add(ring);
    const mor = new THREE.Mesh(new THREE.RingGeometry(PR + 3.8, PR + 8, 32), new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 1 })); mor.rotation.y = -Math.PI / 2; mor.position.set(X0 - .06, PY, PZ); mor.receiveShadow = true; LV.add(mor);   // (mortared into the brickwork)
    box(PX0, PX1, -.6, .25, PZ - 5.4, PZ + 5.4, M.soil, { uv: 30, cast: false, col: false });
    // (inside: a flat floor, its sides and roof)
    const bc = (y0, y1, z0, z1) => cols.push({ t: 'b', x0: PX0, x1: PX1, y0, y1, z0, z1 });
    bc(-4, 0, PZ - 7.4, PZ + 7.4); bc(-4, PY + PR, PZ - 11, PZ - 7.4); bc(-4, PY + PR, PZ + 7.4, PZ + 11); bc(PY + 7.5, PY + 13, PZ - 11, PZ + 11); }
  // an upturned flowerpot by the pipe's mouth (a step up), a broken half-brick
  { const pot = new THREE.MeshStandardMaterial({ color: 0xb8643a, roughness: .9 }), g = new THREE.CylinderGeometry(6.5, 8.5, 15, 24), m = new THREE.Mesh(g, pot); m.position.set(X0 - 9, GY + 7.5, PZ - 24); m.castShadow = m.receiveShadow = true; LV.add(m);
    cols.push({ t: 'c', x: X0 - 9, z: PZ - 24, r: 7.5, y0: GY, y1: GY + 15 });
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(9.4, 9.6, 3, 24), pot); rim.position.set(X0 - 9, GY + 1.5, PZ - 24); rim.castShadow = rim.receiveShadow = true; LV.add(rim);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(1.6, 12), M.dark); hole.rotation.x = -Math.PI / 2; hole.position.set(X0 - 9, GY + 15.02, PZ - 24); LV.add(hole);
    const hb = new THREE.Mesh(new THREE.BoxGeometry(11, 6, 10), new THREE.MeshStandardMaterial({ color: 0x9a4632, roughness: .95 })); hb.position.set(X0 - 20, GY + 3, PZ - 38); hb.rotation.y = .5; hb.castShadow = hb.receiveShadow = true; LV.add(hb); cols.push({ t: 'c', x: X0 - 20, z: PZ - 38, r: 6, y0: GY, y1: GY + 6 }); }
}

// ---------- the garden ----------
function buildGarden() {
  const M = OUT.M || (OUT.M = outMats()); const nc = { col: false };
  LV.add(new THREE.HemisphereLight(0xc4dcff, 0x8a8a6a, 1.6));
  { const tgt = V3(300, GY, -300); const s = spotL(0xfff0dc, 26000000, sunFrom(tgt), tgt, .64, .5, 2048, 1200, 3900); s.userData.prio = 1; OUT.sun = s; }
  // ---- the ground: lawn all round (and the neighbours' beyond the fences), a far field to the horizon ----
  for (const [x0, x1, z0, z1] of [[-1600, -538, -1600, 1700], [-538, -330, -1600, -142], [-538, -330, -50, 1700], [-330, 1456, -1600, -632], [-330, -302, -632, -262], [756, 1456, -632, -518], [920, 1456, -518, -270], [1456, 3000, -1600, -446]]) box(x0, x1, GY - 10, GY, z0, z1, M.grass, { uv: 90, cast: false });
  { const g = new THREE.PlaneGeometry(12000, 9000); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x5f7a46, roughness: 1 })); m.position.set(-1000, GY - 1.5, -5400); LV.add(m);
    const g2 = new THREE.PlaneGeometry(4000, 9000); g2.rotateX(-Math.PI / 2); const m2 = new THREE.Mesh(g2, m.material); m2.position.set(-3600, GY - 1.5, 3500); LV.add(m2); }
  // ---- the front: lawn, the driveway up to the garage door, a path from the gate to the door ----
  box(-330, 912, GY - 10, GY, 262, 646, M.grass, { uv: 90, cast: false }); box(912, 1460, GY - 10, GY, 312, 646, M.drive, { uv: 160, cast: false });
  box(912, 1460, GY, GY + 200, 312, 314, M.trim, nc); for (let y = GY + 40; y < GY + 200; y += 40) box(912, 1460, y - 1, y + 1, 314, 315, new THREE.MeshStandardMaterial({ color: 0xc8c8c4, roughness: .6 }), nc);
  wbox(912, 1460, GY + 200, GY + 290, 312, 318, M.sid, { col: false });
  for (let z = 306; z < 626; z += 32) box(474, 538, GY, GY + .35, z, z + 28, M.paver, { uv: 64, cast: false, col: false });
  // ---- fences: back and west tall timber, behind the garage; the front a tall hedge with a gate and the driveway's gate ----
  const fenceRun = (x0, x1, z0, z1) => { box(x0, x1, GY, GY + 172, z0, z1, M.fence, { uv: 60 }); const alongX = x1 - x0 > z1 - z0;
    for (let a = alongX ? x0 : z0; a < (alongX ? x1 : z1); a += 120) alongX ? box(a, a + 7, GY, GY + 180, z0 - 2, z1 + 2, M.fence, nc) : box(x0 - 2, x1 + 2, GY, GY + 180, a, a + 7, M.fence, nc); };
  fenceRun(-646, 1460, -966, -960); fenceRun(-646, -640, -960, 640); fenceRun(1452, 1460, -960, -440);
  box(-646, 461, GY, GY + 168, 626, 648, M.hedge, { uv: 70 }); box(551, 912, GY, GY + 168, 626, 648, M.hedge, { uv: 70 });
  for (const [x0, x1] of [[-646, 461], [551, 912]]) box(x0 + 2, x1 - 2, GY + 168, GY + 174, 628, 646, M.hedge, { uv: 70, col: false });
  // (leaves on both faces and the top, so it reads as a hedge, not a green wall)
  { const segs = [[-646, 461], [551, 912]], N = 1500, hl = new THREE.InstancedMesh(new THREE.PlaneGeometry(22, 22), M.leaf, N), ho = new THREE.Object3D(); let k = 0;
    while (k < N) { const sg = segs[k % 2 ? 1 : 0], x = R(sg[0], sg[1]), side = R(0, 1); let y, z;
      if (side < .42) { y = R(GY + 4, GY + 170); z = 626 + R(-2.5, 1.5); } else if (side < .84) { y = R(GY + 4, GY + 170); z = 648 + R(-1.5, 2.5); } else { y = GY + 171 + R(-1, 3); z = R(626, 648); }
      ho.position.set(x, y, z); ho.rotation.set(R(-1.2, 1.2), R(-1.2, 1.2), R(0, 6.28)); ho.scale.setScalar(R(.7, 1.15)); ho.updateMatrix(); hl.setMatrixAt(k++, ho.matrix); }
    hl.receiveShadow = true; LV.add(hl); }
  { box(461, 465, GY, GY + 176, 630, 644, M.trim); box(547, 551, GY, GY + 176, 630, 644, M.trim);          // the front gate: white pickets, latched
    box(465, 547, GY + 2, GY + 150, 635, 639, M.trim); for (let x = 467; x < 545; x += 8) box(x, x + 5, GY + 150, GY + 162, 635.5, 638.5, M.trim, nc); }
  { box(912, 1452, GY, GY + 4, 634, 642, M.dark); box(912, 1452, GY + 150, GY + 156, 634, 642, M.dark, nc);         // the driveway's sliding gate
    box(912, 1452, GY + 4, GY + 150, 636, 640, new THREE.MeshStandardMaterial({ ...genWood([120, 96, 72], [70, 54, 40], 581, 14), roughness: .85 }), { uv: 60 }); for (const x of [912, 1180, 1446]) box(x, x + 6, GY, GY + 160, 632, 644, M.dark, nc); }
  // ---- paths: stepping stones down the west side and along the back, the patio at the back door ----
  { const st = [], rs = [];
    // (down the west side the path swings out round the raised planter, past the mouth of its drain pipe)
    const wc = new THREE.CatmullRomCurve3([[-412, 600], [-412, 150], [-424, 70], [-490, 10], [-576, -38], [-584, -98], [-576, -158], [-490, -214], [-424, -270], [-412, -350], [-412, -720]].map(([x, z]) => V3(x, 0, z)), false, 'centripetal');
    for (const q of wc.getSpacedPoints(Math.round(wc.getLength() / 34))) st.push([q.x + R(-3, 3), q.z + R(-3, 3)]);
    for (let x = -380; x < 560; x += 34) st.push([x + R(-3, 3), -722 + R(-4, 4)]);
    for (const [x, z] of st) { const w = R(26, 32), d = R(20, 24); box(x - w / 2, x + w / 2, GY, GY + .35, z - d / 2, z + d / 2, M.paver, { uv: 64, cast: false, col: false }); rs.push(1); }   // (flush with the lawn: you walk on the grass)
    box(560, 840, GY, GY + .4, -796, -672, M.paver, { uv: 64, cast: false, col: false }); box(560, 840, GY, GY + .45, -798, -796, M.plinth, nc); }
  // ---- flower beds against the walls and along the back fence ----
  const FL = [], SH = [], ST2 = [];
  const bed = (x0, x1, z0, z1, n, pal, shrubs = 0) => {
    box(x0, x1, GY, GY + 3, z0, z0 + 2.5, M.brick, { uv: 20 }); box(x0, x1, GY, GY + 3, z1 - 2.5, z1, M.brick, { uv: 20 }); box(x0, x0 + 2.5, GY, GY + 3, z0, z1, M.brick, { uv: 20 }); box(x1 - 2.5, x1, GY, GY + 3, z0, z1, M.brick, { uv: 20 });
    box(x0 + 2.5, x1 - 2.5, GY, GY + 1.6, z0 + 2.5, z1 - 2.5, M.soil, { uv: 40, cast: false });
    for (let i = 0; i < n; i++) { const x = R(x0 + 5, x1 - 5), z = R(z0 + 5, z1 - 5), h = R(14, 46); ST2.push([x, z, h, GY + 1.6]); FL.push([x, GY + 1.6 + h, z, R(2.2, 4), pal[i % pal.length]]); }
    for (let i = 0; i < shrubs; i++) { const x = R(x0 + 10, x1 - 10), z = R(z0 + 8, z1 - 8), r = R(9, 18); SH.push([x, GY + r * .7, z, r]); }
  };
  const warm = [0xe85a6a, 0xf2c23a, 0xff8a3a, 0xf4f0ea, 0xd85a9a], cool = [0x8a6ad0, 0x5a7ad8, 0xf4f0ea, 0xc8a0e8];
  bed(-374, -333, -250, -152, 16, warm, 2); bed(-374, -333, -40, 250, 44, warm, 5); bed(-290, 550, -678, -636, 90, cool, 10); bed(-300, 380, 265, 300, 50, warm, 6); bed(510, 890, 265, 300, 40, cool, 5);
  bed(-450, 1430, -956, -912, 110, [...warm, ...cool], 28); bed(-636, -596, -780, -230, 20, cool, 10); bed(-636, -596, 30, 600, 22, cool, 11);
  buildPlanter(M, FL, ST2, SH);
  // ---- things in the garden ----
  // wheelie bins by the side of the house (green and blue), climbable
  for (const [x, c] of [[-560, 0x2f6a3a], [-504, 0x2f4f8a]]) { box(x - 23, x + 23, GY + 6, GY + 100, -600, -556, new THREE.MeshStandardMaterial({ color: c, roughness: .6 })); box(x - 25, x + 25, GY + 100, GY + 106, -604, -554, new THREE.MeshStandardMaterial({ color: c, roughness: .5 }));
    for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 4, 14), M.dark); w.rotation.z = Math.PI / 2; w.position.set(x + s * 19, GY + 6, -602); LV.add(w); } }
  // the shed in the back corner
  { const x0 = -630, x1 = -470, z0 = -950, z1 = -800, top = GY + 200, sw = new THREE.MeshStandardMaterial({ ...genWood([126, 96, 70], [78, 58, 42], 591, 9), roughness: .9 });
    box(x0, x1, GY, top, z0, z0 + 6, sw, { uv: 60 }); box(x0, x0 + 6, GY, top, z0, z1, sw, { uv: 60 }); box(x1 - 6, x1, GY, top, z0, z1, sw, { uv: 60 });
    box(x0, -590, GY, top - 20, z1 - 6, z1, sw, { uv: 60 }); box(-520, x1, GY, top - 20, z1 - 6, z1, sw, { uv: 60 }); box(-590, -520, GY + 170, top - 20, z1 - 6, z1, sw, { uv: 60 });
    box(-588, -522, GY + 2, GY + 168, z1 - 4, z1 - 1, new THREE.MeshStandardMaterial({ color: 0x4a6a5a, roughness: .7 })); box(-532, -528, GY + 80, GY + 86, z1 - 1, z1 + 2, M.brass, nc);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 + 24, 4, z1 - z0 + 30), M.felt); roof.position.set((x0 + x1) / 2, top - 8, (z0 + z1) / 2 + 4); roof.rotation.x = .14; roof.castShadow = true; LV.add(roof);
    cols.push({ t: 'b', x0: x0 - 12, x1: x1 + 12, y0: top - 30, y1: top + 6, z0: z0 - 10, z1: z1 + 18 }); }
  // the rotary washing line, a towel and two T-shirts pegged out
  { const cx = 260, cz = -830; cyl(cx, cz, 2.2, GY, GY + 176, M.metal, { seg: 10 }); const arms = new THREE.Group(); arms.position.set(cx, GY + 172, cz); LV.add(arms);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .4, m = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, 120, 6), M.metal); m.rotation.z = Math.PI / 2 - .12; m.position.set(Math.cos(a) * 58, -6, Math.sin(a) * 58); m.rotation.y = -a; arms.add(m); }
    for (const r of [30, 50]) { const ln = new THREE.Mesh(new THREE.TorusGeometry(r, .25, 4, 40), M.trim); ln.rotation.x = Math.PI / 2; ln.rotation.z = .4; ln.position.y = -6 - r * .12; arms.add(ln); }
    for (const [a, r, w, h, c] of [[.9, 50, 44, 60, 0xe8c8a0], [2.6, 50, 30, 34, 0x5a8ad8], [4.3, 30, 28, 32, 0xf4f0ea]]) { const cl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: c, roughness: .95, side: THREE.DoubleSide })); cl.position.set(Math.cos(a) * r, -12 - r * .12 - h / 2, Math.sin(a) * r); cl.rotation.y = -a + Math.PI / 2; cl.castShadow = true; arms.add(cl); } }
  // a raised vegetable bed: lettuces and tomato canes
  { box(0, 240, GY, GY + 30, -902, -896, M.wood); box(0, 240, GY, GY + 30, -846, -840, M.wood); box(0, 6, GY, GY + 30, -902, -840, M.wood); box(234, 240, GY, GY + 30, -902, -840, M.wood); box(6, 234, GY, GY + 27, -896, -846, M.soil, { uv: 40, cast: false });
    for (let i = 0; i < 10; i++) { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(8, 1), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x7ab84a : 0x5a9a3a, roughness: .8, flatShading: true })); l.position.set(18 + (i % 5) * 26, GY + 31, -884 + Math.floor(i / 5) * 24); l.scale.y = .6; LV.add(l); }
    for (let i = 0; i < 4; i++) { cyl(170 + i * 16, -872, .8, GY + 27, GY + 110, M.wood, { col: false, seg: 5 }); for (let k = 0; k < 3; k++) { const t = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 8), new THREE.MeshStandardMaterial({ color: k ? 0xd8402a : 0x7aa040, roughness: .5 })); t.position.set(172 + i * 16, GY + 50 + k * 18, -870); LV.add(t); } } }
  // a bird bath, a bench, a water butt under the downpipe, a football on the lawn
  cyl(420, -870, 7, GY, GY + 70, M.conc, { seg: 16, rt: 5 }); cyl(420, -870, 26, GY + 70, GY + 78, M.conc, { seg: 24, rt: 20 }); cyl(420, -870, 22, GY + 76, GY + 77, new THREE.MeshStandardMaterial({ color: 0x8ab0c8, roughness: .1, metalness: .2 }), { seg: 24, col: false });
  { const x = 900, z = -862; for (const dx of [-70, 70]) box(x + dx - 3, x + dx + 3, GY, GY + 44, z - 20, z + 20, M.dark); box(x - 80, x + 80, GY + 44, GY + 48, z - 22, z + 22, M.wood); for (let i = 0; i < 3; i++) box(x - 80, x + 80, GY + 56 + i * 12, GY + 63 + i * 12, z - 26, z - 22, M.wood); }
  cyl(784, -662, 26, GY, GY + 86, new THREE.MeshStandardMaterial({ color: 0x3a6a3a, roughness: .6 }), { seg: 24 }); cyl(784, -662, 27, GY + 86, GY + 90, M.dark, { seg: 24 });
  // ---- trees (trunks you can climb; leafy cards round a dark core) ----
  const TREES = [[1120, -790, 300, 150], [-520, 430, 240, 120], [-200, -1180, 320, 170], [700, -1230, 280, 150], [1750, -760, 300, 160], [-1000, -800, 260, 140], [2300, -1250, 300, 170], [-1100, 900, 260, 140]];
  const leafG = new THREE.PlaneGeometry(26, 26), NL = TREES.length * 560, leaves = new THREE.InstancedMesh(leafG, M.leaf, NL), o = new THREE.Object3D(); let li = 0;
  for (const [x, z, h, r] of TREES) { cyl(x, z, r * .14, GY, GY + h * .75, M.bark, { seg: 14, rt: r * .09 });
    for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r * (.62 - k * .1), 1), M.leafIn); c.position.set(x + R(-r, r) * .25, GY + h - r * .2 + k * 20, z + R(-r, r) * .25); c.scale.y = .78; LV.add(c); }
    for (let i = 0; i < 560; i++) { const u = R(-1, 1), a = R(0, 6.28), s = Math.sqrt(1 - u * u), rr = r * R(.82, 1.02); o.position.set(x + Math.cos(a) * s * rr, GY + h - r * .2 + u * rr * .78, z + Math.sin(a) * s * rr); o.rotation.set(R(0, 6.28), R(0, 6.28), R(0, 6.28)); o.scale.setScalar(R(.8, 1.3)); o.updateMatrix(); leaves.setMatrixAt(li++, o.matrix); } }
  leaves.castShadow = true; leaves.receiveShadow = true; LV.add(leaves);
  // ---- flowers and shrubs (instanced) ----
  { const sg = new THREE.CylinderGeometry(.35, .45, 1, 4); sg.translate(0, .5, 0); const stems = new THREE.InstancedMesh(sg, new THREE.MeshStandardMaterial({ color: 0x4a7a32, roughness: .8 }), ST2.length);
    ST2.forEach(([x, z, h, y0], i) => { o.position.set(x, y0, z); o.rotation.set(R(-.12, .12), 0, R(-.12, .12)); o.scale.set(1, h, 1); o.updateMatrix(); stems.setMatrixAt(i, o.matrix); }); LV.add(stems);
    const bl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: .7 }), FL.length), col = new THREE.Color();
    FL.forEach(([x, y, z, r, c], i) => { o.position.set(x, y, z); o.rotation.set(0, 0, 0); o.scale.set(r, r * .7, r); o.updateMatrix(); bl.setMatrixAt(i, o.matrix); bl.setColorAt(i, col.setHex(c)); }); bl.castShadow = true; LV.add(bl);
    const sh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0x3f6a32, roughness: .9, flatShading: true }), SH.length);
    SH.forEach(([x, y, z, r], i) => { o.position.set(x, y, z); o.rotation.set(R(0, 3), R(0, 3), 0); o.scale.set(r, r * .75, r); o.updateMatrix(); sh.setMatrixAt(i, o.matrix); if (r > 13) cols.push({ t: 'c', x, z, r: r * .8, y0: y - r * .7, y1: y + r * .6 }); }); sh.castShadow = true; sh.receiveShadow = true; LV.add(sh); }
  // ---- the neighbours' houses beyond the fences ----
  const nHouse = (x0, x1, z0, z1, top, sid, roofM, wins) => {
    box(x0, x1, GY, top, z0, z1, sid, { uv: 120 }); box(x0 - 3, x1 + 3, GY, GY + 22, z0 - 3, z1 + 3, M.plinth, nc);
    const ov = 26, E = top, p = .48, hx = (x1 - x0) / 2 + ov, hz = (z1 - z0) / 2 + ov, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, A = (x, y, z) => V3(x, y, z);
    if (hx >= hz) { const Rr = E + hz * p, r0 = cx - (hx - hz), r1 = cx + (hx - hz);
      polyMesh([A(cx - hx, E, cz + hz), A(cx + hx, E, cz + hz), A(r1, Rr, cz), A(r0, Rr, cz)], roofM, V3(1, 0, 0), V3(0, .43, -.9), 230, LV); polyMesh([A(cx + hx, E, cz - hz), A(cx - hx, E, cz - hz), A(r0, Rr, cz), A(r1, Rr, cz)], roofM, V3(1, 0, 0), V3(0, .43, .9), 230, LV);
      polyMesh([A(cx + hx, E, cz + hz), A(cx + hx, E, cz - hz), A(r1, Rr, cz)], roofM, V3(0, 0, 1), V3(-.9, .43, 0), 230, LV); polyMesh([A(cx - hx, E, cz - hz), A(cx - hx, E, cz + hz), A(r0, Rr, cz)], roofM, V3(0, 0, 1), V3(.9, .43, 0), 230, LV); }
    else { const Rr = E + hx * p, r0 = cz - (hz - hx), r1 = cz + (hz - hx);
      polyMesh([A(cx + hx, E, cz - hz), A(cx + hx, E, cz + hz), A(cx, Rr, r1), A(cx, Rr, r0)], roofM, V3(0, 0, 1), V3(-.9, .43, 0), 230, LV); polyMesh([A(cx - hx, E, cz + hz), A(cx - hx, E, cz - hz), A(cx, Rr, r0), A(cx, Rr, r1)], roofM, V3(0, 0, 1), V3(.9, .43, 0), 230, LV);
      polyMesh([A(cx - hx, E, cz + hz), A(cx + hx, E, cz + hz), A(cx, Rr, r1)], roofM, V3(1, 0, 0), V3(0, .43, -.9), 230, LV); polyMesh([A(cx + hx, E, cz - hz), A(cx - hx, E, cz - hz), A(cx, Rr, r0)], roofM, V3(1, 0, 0), V3(0, .43, .9), 230, LV); }
    box(x0 - ov, x1 + ov, E - 12, E, z0 - ov, z0 - ov + 3, M.trim, nc); box(x0 - ov, x1 + ov, E - 12, E, z1 + ov - 3, z1 + ov, M.trim, nc); box(x0 - ov, x0 - ov + 3, E - 12, E, z0 - ov, z1 + ov, M.trim, nc); box(x1 + ov - 3, x1 + ov, E - 12, E, z0 - ov, z1 + ov, M.trim, nc);
    for (const [face, f, a, y] of wins) { const B = faceBox(LV, face, f); B(a - 46, a + 46, y - 50, y + 50, 0, 1, M.glassD, nc); B(a - 50, a + 50, y + 50, y + 55, 0, 3, M.trim, nc); B(a - 52, a + 52, y - 55, y - 50, 0, 5, M.trim, nc); B(a - 2, a + 2, y - 50, y + 50, 0, 2, M.trim, nc); }
  };
  const sN = M.sidN, sW = M.sidW;
  nHouse(-1360, -790, -560, 440, 510, sN, M.shR, [['x+', -790, -400, 130], ['x+', -790, -100, 130], ['x+', -790, 250, 130], ['x+', -790, -250, 370], ['x+', -790, 100, 370]]);
  nHouse(-700, 380, -1660, -1260, 500, sW, M.shM, [['z+', -1260, -520, 130], ['z+', -1260, -200, 130], ['z+', -1260, 160, 130], ['z+', -1260, -360, 370], ['z+', -1260, 40, 370], ['z+', -1260, 260, 370]]);
  nHouse(520, 1500, -1700, -1300, 520, sN, M.shR, [['z+', -1300, 640, 130], ['z+', -1300, 960, 130], ['z+', -1300, 1300, 130], ['z+', -1300, 800, 380], ['z+', -1300, 1160, 380]]);
  nHouse(1700, 2700, -1560, -1160, 500, sW, M.shM, [['z+', -1160, 1860, 130], ['z+', -1160, 2200, 130], ['z+', -1160, 2540, 130], ['z+', -1160, 2050, 370], ['z+', -1160, 2400, 370]]);
  nHouse(-1400, -800, 760, 1500, 500, sW, M.shM, [['x+', -800, 900, 130], ['x+', -800, 1200, 130], ['x+', -800, 1050, 370]]);
  // a far line of trees on the skyline
  { const far = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0x3f5f36, roughness: 1, flatShading: true }), 70); let i = 0;
    for (let x = -1800; x < 3200 && i < 70; x += R(110, 170)) { const r = R(90, 160); o.position.set(x, GY + r * .9, -2100 + R(-120, 120)); o.rotation.set(0, R(0, 3), 0); o.scale.set(r, r * 1.15, r); o.updateMatrix(); far.setMatrixAt(i++, o.matrix); }
    for (let z = -1900; z < 1700 && i < 70; z += R(130, 190)) { const r = R(90, 160); o.position.set(-1900 + R(-100, 100), GY + r * .9, z); o.rotation.set(0, R(0, 3), 0); o.scale.set(r, r * 1.15, r); o.updateMatrix(); far.setMatrixAt(i++, o.matrix); }
    far.count = i; LV.add(far); }
  flushDeco();
  // everything out here has the colliders it was given (no loose props: nothing tumbles off at the start and makes a noise),
  // and it's all drawn as one mesh per material
  OUT.merged = mergeZoneStatic(LV, new Set());
  // a football on the lawn (you can shrink or blow it up)
  { const bM = new THREE.MeshStandardMaterial({ color: 0xf4f0ea, roughness: .5 }); resGroup(cmGroup(22, 22, 22, ({ part }) => { part(new THREE.SphereGeometry(11, 24, 16), bM, 0, 0, 0); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; part(new THREE.SphereGeometry(3.4, 8, 6), new THREE.MeshStandardMaterial({ color: 0x222222 }), Math.cos(a) * 9.6, Math.sin(a * 2) * 3, Math.sin(a) * 9.6); } }, [bM]), 120, -760, GY, 22, 22, 22, .3, 4, '足球', true); }
  for (const ch of LV.children) ch.userData.noSolid = true;
}

// ---------- the back door's cat flap (built with the door: e45_pest.js) ----------
function outFlapTick(dt) {
  if (!OUT.flap) return; let want = 0;
  for (const C of party) { if (C.frozen) continue; const p = C.pos; if (p.x > 678 && p.x < 702 && p.y < 16 && p.z > -628 && p.z < -594) { want = p.z < -611 ? -1.1 : 1.1; break; } }
  OUT.flapA = damp(OUT.flapA, want, want ? 14 : 5, dt); OUT.flap.rotation.x = OUT.flapA;
  if (want && !OUT.flapSnd) { OUT.flapSnd = true; tone(260, 200, .06, .03, 'triangle'); } if (!want) OUT.flapSnd = false;
}
// per frame: the cat flap, and the painted views outside the front windows (only seen from inside)
function outsideTick(dt) {
  if (!WORLD) return;
  if (OUT.backdropsWanted && !OUT.inited) { OUT.inited = true; const K = kitchenMats(); ZONES.kitchen.lv.traverse(m => { if (m.isMesh && m.material === K.dusk && m.position.z > 300) OUT.backdrops.push(m); }); }
  const inside = camera.position.z < 250; for (const m of OUT.backdrops) m.visible = inside;
  // the warm glow painted over the gap at the top of 前拍檔's wall is for looking up at from her home, not from the chamber above it
  if (STATIC.hubGlow) STATIC.hubGlow.visible = camera.position.y < HO.y + 335;
  outFlapTick(dt); windowsTick(dt);
}

// ---------- the garden as a place ----------
const GQ = [{ t: '屋外：搵路返入屋', s: '前門同後門底都有貓門，鑽得返入屋。開咗嘅窗都爬得返入去' }];
LEVELS.garden = {
  chapter: '第一章', title: '屋企', room: '屋外', house: true, env: 'yard', envI: DAY ? 1 : .5, fog: DAY ? [0xbcd0e2, .00014] : [0x0e1626, .0004], expo: DAY ? .95 : 1.35, bloom: DAY ? [.3, 2.4] : null,
  dust: { N: 0 }, toys: true, npcNear: false, build: buildGarden,
  cps: [[690, 0, -650], [-412, GY, -300], [-412, GY, 450], [300, GY, -760]],
  quests: GQ,
  enter(prev, again) {
    if (again || NET.on) return;
    const line = prev === 'roof' ? '跌咗落花園……冇事冇事。斜屋頂嗰條去水管可以爬返上屋頂。' : '出咗屋外……好大陣風。沿住屋邊行吓，記得由後門個貓門返入去。';
    setTimeout(() => { if (STATE === 'play' && LEVEL === 'garden') say('爸爸', line, '#f5f0e6', 3.6); }, 600);
  },
  keep(id) { return id === 'yard' || id === 'road'; },     // (over a fence or a gate isn't the next chapter: there's no way over them anyway)
  detect(dt) { meter = Math.max(0, meter - dt * .5); KS.watch = null; },
  update(dt) {
    lvT += dt; if (NET.on || STATE !== 'play') return; const L = leader;
    if (L.pos.y < GY - 70) { const p = CPS[cp] || CPS[0]; party.forEach((C, i) => { if (C.frozen) return; C.pos.set(p[0] + (i % 3 - 1) * 4, p[1], p[2] + Math.floor(i / 3) * 4); C.vel.set(0, 0, 0); C.climbing = false; C.mantle = null; C.queue = []; if (C.disp) C.disp.copy(C.pos); }); trail = []; leader.lastTrail.copy(leader.pos); }
    if (!OUT.said.front && L.pos.z > 262) { OUT.said.front = 1; say('爸爸', '前院……前門閂住，閘又鎖咗。', '#f5f0e6', 2.8); }
    if (!OUT.said.side && L.pos.x < -330 && L.pos.z < 0 && L.pos.z > -400) { OUT.said.side = 1; say('老友', '呢邊冷氣機好大部！', '#d9a675', 2.4); }
    if (!OUT.said.lean && L.grounded && L.pos.y > 270 && L.pos.z < -262 && L.pos.z > -640) { OUT.said.lean = 1; say('爸爸', '上到斜屋頂……嗰條去水管一直通上大屋屋頂嘅坑渠。', '#f5f0e6', 3.4); }
    if (!OUT.said.pipe && Math.hypot(L.pos.x - PLANT.PX0, L.pos.z - PLANT.PZ) < 60) { OUT.said.pipe = 1; setTimeout(() => { if (STATE === 'play') say('爸爸', '花槽底呢條舊去水渠……個方向係入返牆身——前拍檔屋企頂嗰度。', '#f5f0e6', 3.6); }, OUT.said.side ? 2600 : 0); }
  },
  win() { }, reset() { }, onSwitch() { },
  marker() { if (NET.on) return mpMarker(); const L = leader, f = V3(506, 0, 262); return L && L.pos.distanceTo(f) < L.pos.distanceTo(OUT.flapP) ? f : OUT.flapP; },
  eyeText: () => '屋外——冇人望到你',
  hint(L) { if (Math.hypot(L.pos.x - 690, L.pos.z + 640) < 50) return '鑽貓門返入洗衣間'; if (Math.hypot(L.pos.x - 506, L.pos.z - 275) < 45) return '鑽前門貓門返入客廳'; if (Math.hypot(L.pos.x + 300, L.pos.z + 646) < 26 || Math.hypot(L.pos.x - 754, L.pos.z + 646) < 26) return '抱住去水管爬上屋後嘅斜屋頂'; if (OUT.upPipe && Math.hypot(L.pos.x - OUT.upPipe.x, L.pos.z - OUT.upPipe.z) < 30 && L.pos.y > 280) return '抱住去水管爬上大屋屋頂——到頂伸手捉住坑渠邊'; if (Math.hypot(L.pos.x - PLANT.PX0, L.pos.z - PLANT.PZ) < 34 && L.pos.y < 2) return '爬上花槽嘅磚牆，鑽入舊去水渠——通去牆身入面'; return ''; }
};
