// =====================================================================
//  The outside of our house, as the street and the back yard see it:
//  a hipped roof with a brick chimney over the house, a gabled roof over
//  the garage (its gable end faces the yard, with an attic vent), fascia
//  boards and gutters, a downpipe, the exposed upper east wall of the house
//  with two windows, and a window with drawn blinds in the garage's yard wall.
//  It lives in its own group, shown while the yard or the street is near,
//  so it never floats about on its own and never shows from indoors.
// =====================================================================
const SHELL = { g: null };
function genBrick() {
  const W = 256, n = noiseField(W, W, 3, 8, 77), h = new Float32Array(W * W);
  const c = fromFn(W, W, (x, y, i, o) => { const r = (y / 16) | 0, v = y % 16, off = (r & 1) * 16, u = (x + off) % 32, b = ((x + off) / 32) | 0, mort = v < 2 || u < 2;
    const k = .8 + hashI(r * 31 + b * 7) * .35, s = mort ? 1 : k * (.9 + n[i] * .2); o[0] = mort ? 168 : 128 * s; o[1] = mort ? 160 : 62 * s; o[2] = mort ? 150 : 46 * s; h[i] = mort ? 0 : 1; });
  return { map: tex(c), normalMap: normalTex(h, W, W, 1.5) };
}
function genShingles(sd) {
  const W = 512, n = noiseField(W, W, 3, 16, sd), h = new Float32Array(W * W);
  const c = fromFn(W, W, (x, y, i, o) => {
    const r = y >> 5, v = y & 31, off = (r & 1) * 24, tab = ((x + off) / 48) | 0, u = (x + off) % 48;
    const k = .82 + hashI(r * 97 + tab * 13 + sd) * .3, gap = u < 2, lip = v > 27;
    let s = k * (gap ? .45 : lip ? .62 : .9 + v / 32 * .12) * (.92 + n[i] * .16);
    o[0] = 78 * s; o[1] = 74 * s; o[2] = 70 * s; h[i] = gap ? 0 : v / 32;
  });
  return { map: tex(c), normalMap: normalTex(h, W, W, 2.4) };
}
// a flat convex polygon with world-scaled UVs: u along U, v along V (cm / s)
function polyMesh(pts, mat, U, V, s, parent) {
  const pos = [], uv = [], idx = [];
  for (const p of pts) { pos.push(p.x, p.y, p.z); uv.push(p.dot(U) / s, p.dot(V) / s); }
  const n = V3().subVectors(pts[1], pts[0]).cross(V3().subVectors(pts[2], pts[0]));
  for (let i = 1; i < pts.length - 1; i++) n.y >= 0 ? idx.push(0, i, i + 1) : idx.push(0, i + 1, i);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
// the cap over a ridge or a hip: half a cylinder (9 cm across, 3.5 proud) laid from p to q, its overlapping cap shingles drawn on
function capMesh(p, q, mat) {
  const d = V3().subVectors(q, p), L = d.length(), g = new THREE.CylinderGeometry(4.6, 4.6, L, 14, 1, true, -Math.PI / 2, Math.PI);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * L / 22);
  g.rotateX(-Math.PI / 2); g.scale(1, .76, 1); const m = new THREE.Mesh(g, mat); m.position.copy(p).add(q).multiplyScalar(.5); m.lookAt(q); m.castShadow = true; m.receiveShadow = true; return m;
}
function genCapTex() {
  const W = 128, H = 128, n = noiseField(W, H, 3, 8, 321);
  const c = fromFn(W, H, (x, y, i, o) => { const v = y % 64, lip = v > 58, k = .85 + n[i] * .2 - (lip ? .25 : 0) + v / 64 * .08; o[0] = 92 * k; o[1] = 88 * k; o[2] = 84 * k; });
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function buildHouseShell() {
  if (SHELL.g) return; const P = new THREE.Group(); P.name = 'houseShell'; scene.add(P); SHELL.g = P;
  const pitch = Math.tan(26 * Math.PI / 180);
  const shM = new THREE.MeshStandardMaterial({ ...genShingles(941), roughness: .92, side: THREE.DoubleSide, normalScale: new THREE.Vector2(.9, .9) });
  const sidingU = new THREE.MeshStandardMaterial({ ...genSiding(0xb7c4c8, 532), roughness: .85 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: .6 }), soffit = new THREE.MeshStandardMaterial({ color: 0xe4e2dc, roughness: .8 });
  const gutM = new THREE.MeshStandardMaterial({ color: 0xe8e8e4, roughness: .45, metalness: .1 });
  const brick = new THREE.MeshStandardMaterial({ ...genBrick(), roughness: .9 });
  const o = { parent: P, col: false };
  const capM = new THREE.MeshStandardMaterial({ map: genCapTex(), color: 0x8a8580, roughness: .9 });
  // ---------- the house: hipped roof (walls x -330…912, z -262…262, top 552) ----------
  { const a0 = -358, a1 = 940, b0 = -290, b1 = 290, W = 552, E = W - 28 * pitch, R = W + 262 * pitch, r0 = -330 + 262, r1 = 912 - 262;
    const A = (x, y, z) => V3(x, y, z);
    polyMesh([A(a0, E, b1), A(a1, E, b1), A(r1, R, 0), A(r0, R, 0)], shM, V3(1, 0, 0), V3(0, .438, -.899), 230, P);
    polyMesh([A(a1, E, b0), A(a0, E, b0), A(r0, R, 0), A(r1, R, 0)], shM, V3(1, 0, 0), V3(0, .438, .899), 230, P);
    polyMesh([A(a1, E, b1), A(a1, E, b0), A(r1, R, 0)], shM, V3(0, 0, 1), V3(-.899, .438, 0), 230, P);
    polyMesh([A(a0, E, b0), A(a0, E, b1), A(r0, R, 0)], shM, V3(0, 0, 1), V3(.899, .438, 0), 230, P);
    // ridge and hip caps
    const cap = (p, q) => { const m = capMesh(p, q, capM); P.add(m); };
    cap(A(r0, R, 0), A(r1, R, 0)); for (const [x, z, rx] of [[a0, b0, r0], [a0, b1, r0], [a1, b0, r1], [a1, b1, r1]]) cap(A(x, E, z), A(rx, R, 0));
    // fascia round the eaves, soffit underneath
    box(a0, a1, E - 14, E, b1, b1 + 3, trim, o); box(a0, a1, E - 14, E, b0 - 3, b0, trim, o); box(a0 - 3, a0, E - 14, E, b0, b1, trim, o); box(a1, a1 + 3, E - 14, E, b0, b1, trim, o);
    box(a0, a1, E - 14, E - 12, 262, b1, soffit, o); box(a0, a1, E - 14, E - 12, b0, -262, soffit, o); box(912, a1, E - 14, E - 12, -262, 262, soffit, o);
    // gutter along the front
    box(a0, a1, E - 16, E - 6, b1 + 3, b1 + 11, gutM, o);
    // the upper east wall that stands clear of the garage roof, with two windows (blinds half down)
    box(913, 921, 260, W, -262, 262, sidingU, { ...o, uv: 120 });
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x5a6e84, roughness: .06, metalness: .2, clearcoat: 1 }), blind = new THREE.MeshStandardMaterial({ color: 0xece4d2, roughness: .8 });
    for (const z of [-120, 120]) { box(921, 922, 430, 520, z - 42, z + 42, glass, o); box(920.5, 921.5, 482, 520, z - 40, z + 40, blind, o);
      for (let y = 484; y < 520; y += 5) box(921.4, 922, y, y + 1, z - 40, z + 40, blind, o);
      box(921, 924, 426, 430, z - 48, z + 48, trim, o); box(921, 924, 520, 524, z - 46, z + 46, trim, o); box(921, 924, 430, 520, z - 46, z - 42, trim, o); box(921, 924, 430, 520, z + 42, z + 46, trim, o); box(921, 923, 430, 520, z - 1.5, z + 1.5, trim, o); }
    // a brick chimney on the west side
    box(-210, -150, 560, R + 80, -70, -20, brick, { ...o, uv: 60 }); box(-216, -144, R + 80, R + 88, -76, -14, new THREE.MeshStandardMaterial({ color: 0x6a6a68, roughness: .8 }), o);
    for (const x of [-196, -166]) cyl(x, -45, 6, R + 88, R + 100, new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: .7 }), { ...o, seg: 12 });
  }
  // ---------- the garage: gabled, ridge running east–west, gable end facing the yard ----------
  { const x0 = 914, x1 = 1478, z0 = -290, z1 = 332, zm = 21, W = 270, E = W - 20 * pitch, R = W + 291 * pitch, A = (x, y, z) => V3(x, y, z);
    polyMesh([A(x0, E, z1), A(x1, E, z1), A(x1, R, zm), A(x0, R, zm)], shM, V3(1, 0, 0), V3(0, .438, -.899), 230, P);
    polyMesh([A(x1, E, z0), A(x0, E, z0), A(x0, R, zm), A(x1, R, zm)], shM, V3(1, 0, 0), V3(0, .438, .899), 230, P);
    P.add(capMesh(A(x0, R, zm), A(x1, R, zm), capM));
    // the gable: siding triangle on the yard wall, with a round louvred attic vent
    { const pts = [A(1460, W, -270), A(1460, W, 312), A(1460, R - 6, zm)], pos = [], uv = [];
      for (const p of pts) { pos.push(p.x, p.y, p.z); uv.push(p.z / 120, p.y / 120); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex([0, 2, 1]); g.computeVertexNormals();
      const m = new THREE.Mesh(g, sidingU); m.receiveShadow = true; m.castShadow = true; P.add(m); }
    box(1452, 1460, W - 2, W + 2, -270, 312, trim, o);   // a band where the wall meets the gable
    { const vg = new THREE.Group(); vg.position.set(1461, W + 82, zm); vg.rotation.y = Math.PI / 2; P.add(vg);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(22, 3, 10, 40), trim); vg.add(ring);
      const back = new THREE.Mesh(new THREE.CircleGeometry(21, 32), new THREE.MeshStandardMaterial({ color: 0x2a2e32, roughness: .7 })); back.position.z = -.5; vg.add(back);
      for (let i = -3; i <= 3; i++) { const y = i * 5.6, w = 2 * Math.sqrt(Math.max(0, 21 * 21 - y * y)); const s = new THREE.Mesh(new THREE.BoxGeometry(w, 2.6, 1.4), trim); s.position.set(0, y, .4); s.rotation.x = -.5; vg.add(s); } }
    // barge boards up the two rakes, fascia along the eaves, soffit underneath
    for (const [za, zb] of [[z0, zm], [z1, zm]]) { const p = A(1470, E, za), q = A(1470, R, zb), d = V3().subVectors(q, p), m = new THREE.Mesh(new THREE.BoxGeometry(4, 16, d.length() + 6), trim); m.position.copy(p).add(q).multiplyScalar(.5).add(V3(0, -6, 0)); m.lookAt(q.clone().add(V3(0, -6, 0))); m.castShadow = true; P.add(m); }
    box(x0, x1, E - 14, E, z1, z1 + 3, trim, o); box(x0, x1, E - 14, E, z0 - 3, z0, trim, o);
    box(x0, x1, E - 14, E - 12, 312, z1, soffit, o); box(x0, x1, E - 14, E - 12, z0, -270, soffit, o);
    // gutters front and back, and a downpipe down the yard-side front corner
    box(x0, x1, E - 16, E - 6, z1 + 3, z1 + 11, gutM, o); box(x0, x1, E - 16, E - 6, z0 - 11, z0 - 3, gutM, o);
    cyl(1470, 337, 3.4, GY + 10, E - 10, gutM, { ...o, seg: 12 }); box(1462, 1478, GY, GY + 6, 330, 352, gutM, o);
    for (const y of [60, 160]) box(1466, 1474, y, y + 3, 331, 339, gutM, o);
  }
  // ---------- the garage's yard wall: a window with the blinds drawn (they're drawn inside too) ----------
  { const z0 = -170, z1 = -50, y0 = 110, y1 = 215, glass = new THREE.MeshPhysicalMaterial({ color: 0x7a8a9a, roughness: .05, metalness: .1, clearcoat: 1, transparent: true, opacity: .38, depthWrite: false });
    const blind = new THREE.MeshStandardMaterial({ color: 0xeae4d6, roughness: .85 });
    box(1460, 1460.4, y0, y1, z0, z1, new THREE.MeshStandardMaterial({ color: 0xd6cfbf, roughness: .9 }), o);
    for (let y = y0 + 2; y < y1; y += 4.2) box(1460.3, 1461, y, y + 3, z0, z1, blind, { ...o, cast: false });
    box(1461.6, 1462, y0, y1, z0, z1, glass, { ...o, cast: false });
    box(1460, 1464, y0 - 6, y0, z0 - 8, z1 + 8, trim, o); box(1460, 1465, y0 - 8, y0 - 5, z0 - 10, z1 + 10, trim, o);   // sill
    box(1460, 1464, y1, y1 + 6, z0 - 8, z1 + 8, trim, o); box(1460, 1464, y0, y1, z0 - 8, z0, trim, o); box(1460, 1464, y0, y1, z1, z1 + 8, trim, o); box(1460, 1463, y0, y1, (z0 + z1) / 2 - 1.5, (z0 + z1) / 2 + 1.5, trim, o);
  }
}
// the inside of that window, built with the garage: frame, blinds lit a little by the day behind them
function garageBlindWindow() {
  const z0 = -170, z1 = -50, y0 = 110, y1 = 215, trim = MAT.white;
  const blind = new THREE.MeshStandardMaterial({ color: 0xeae4d6, roughness: .85, emissive: DAY ? 0xfff2dc : 0x000000, emissiveIntensity: DAY ? .22 : 0 });
  for (let y = y0 + 2; y < y1; y += 4.2) box(1451, 1452, y, y + 3, z0, z1, blind, { col: false, cast: false });
  box(1452, 1452.4, y0, y1, z0, z1, new THREE.MeshStandardMaterial({ color: 0xcfc8b8, roughness: .9, emissive: DAY ? 0xfff0d8 : 0, emissiveIntensity: DAY ? .12 : 0 }), { col: false, cast: false });
  box(1448, 1452, y0 - 6, y0, z0 - 8, z1 + 8, trim, { col: false }); box(1447, 1452, y0 - 8, y0 - 5, z0 - 10, z1 + 10, trim, { col: false });
  box(1448, 1452, y1, y1 + 6, z0 - 8, z1 + 8, trim, { col: false }); box(1448, 1452, y0, y1, z0 - 8, z0, trim, { col: false }); box(1448, 1452, y0, y1, z1, z1 + 8, trim, { col: false });
  box(1449, 1451, y1 + 6, y1 + 10, z0 - 4, z1 + 4, new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: .5 }), { col: false });   // the blind's head rail
}
function houseShellTick() { if (SHELL.g) SHELL.g.visible = !!(ZONES.yard.near || ZONES.road.near || (ZONES.roof && ZONES.roof.near)); }
