// =====================================================================
//  THE ROOF — the top of the house at sunset (still chapter one: the house)
//  · up from her bedroom: a pull cord hangs from the attic hatch over the wardrobe
//  · the attic: rafters, pink insulation, Dad's old boxes; sunset light falls in through the roof vent
//  · out of the vent onto the hipped roof, up to the ridge: the street, the park and the city beyond,
//    the sun going down behind the towers (the title screen sits the whole crew up here)
//  · an Origin Dynamics drone sweeps the roofs with a searchlight
//  · down onto the garage roof (jump, or climb down the ivy trellis), in through its roof vent, along the
//    garage attic into the old duct, and down through the grille onto the shelf in the garage
//  Roofs are sloped slabs ('h' colliders: a top that follows the roof, so you can walk up and down it).
// =====================================================================
const RF = { p: Math.tan(26 * Math.PI / 180), open: false, cord: null, lid: null, skyG: null, rings: [], sun: null, hemi: null, drone: null, said: {}, attic: 0, fallT: 0 };
const RFH = { a0: -358, a1: 940, b0: -290, b1: 290, W: 552, r0: -68, r1: 650, th: 12 }; RFH.E = RFH.W - 28 * RF.p; RFH.R = RFH.W + 262 * RF.p;
const RFG = { x0: 914, x1: 1478, z0: -290, z1: 332, zm: 21, W: 270, th: 10 }; RFG.E = RFG.W - 20 * RF.p; RFG.R = RFG.W + 291 * RF.p;
const RF_VENT = { x0: 546, x1: 582, z0: -162, z1: -138, top: 622 };    // the house's roof vent: its curb (outside faces) and the top of the curb
const RF_GVENT = { x0: 950, x1: 986, z0: 108, z1: 132, top: 380 };     // the garage's
const RF_HATCH = { x0: 800, x1: 856, z0: 66, z1: 114 };                // the attic hatch in her ceiling
const SUNSET = V3(-.6, .1, .79).normalize();
const RF_ON = () => !!ZONES.roof && WC.cz === ZONES.roof;

// ---------- the roof surfaces ----------
// the cap along the ridge and the hips (3.5 cm proud and 9 wide, like the shell's cap boards; easing out over a few cm)
function rfCap(d) { return 3.5 * clamp((7 - d) / 2.5, 0, 1); }
function rfHip(x, z) {
  const H = RFH, p = RF.p, az = Math.abs(z);
  const t = Math.min(H.R - az * p, H.R - (H.r0 - x) * p, H.R - (x - H.r1) * p);
  const d = x > H.r1 ? Math.abs(az - (x - H.r1)) * .7071 : x < H.r0 ? Math.abs(az - (H.r0 - x)) * .7071 : az;
  return t + rfCap(d);
}
function rfGab(x, z) { const dz = Math.abs(z - RFG.zm); return RFG.R - dz * RF.p + rfCap(dz); }
const rfIn = (x, z, r, m = 0) => x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m;
// the roof's top at a point (or -1e9 off the roofs)
function rfTopAt(x, z) {
  if (x >= RFH.a0 && x <= RFH.a1 && z >= RFH.b0 && z <= RFH.b1) return rfHip(x, z);
  if (x >= RFG.x0 && x <= RFG.x1 && z >= RFG.z0 && z <= RFG.z1) return rfGab(x, z);
  return -1e9;
}

// ---------- the place ----------
// it comes first in the list of places: up here (above the roof surfaces) it wins over the kitchen, garage, yard and street
{
  const p = RF.p, G = RFG, band = (z0, z1, y0) => [913, 1492, y0, 1150, z0, z1];
  const gy = z => Math.floor(G.R - Math.abs(z - G.zm) * p) - 1;
  zoneDef('roof', { floor: 240, env: 'dusk', core: [
    [-330, 912, 548, 1150, -262, 262],                                   // the attic and the air over the house
    [-440, 1000, 520, 1150, 262, 400], [-440, 1000, 520, 1150, -400, -262], [-440, -330, 520, 1150, -262, 262], [912, 1000, 520, 1150, -262, 262],   // round the eaves
    band(-400, -270, 252), band(-270, -200, gy(-270)), band(-200, -130, gy(-200)), band(-130, -60, gy(-130)), band(-60, G.zm, gy(-60)),
    band(G.zm, 100, gy(100)), band(100, 170, gy(170)), band(170, 240, gy(240)), band(240, 312, gy(312)), band(312, 440, 252)
  ] });
  ZL.splice(ZL.indexOf(ZONES.roof), 1); ZL.unshift(ZONES.roof);
  // from up here you see the street and the yard below
  ZONES.road.peek = [...(ZONES.road.peek || []), [-440, 1500, 380, 1150, -400, 440]];
  ZONES.yard.peek = [...(ZONES.yard.peek || []), [600, 1500, 380, 1150, -400, 440]];
}

// ---------- materials ----------
function rfMats() {
  const C2 = (w, h, f) => { const [c, x] = cnv(w, h); f(x, w, h); return tex(c); };
  const ply = C2(256, 256, (x) => { x.fillStyle = '#b89468'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 90; i++) { x.strokeStyle = `rgba(${90 + R(0, 40)},${60 + R(0, 30)},30,${R(.08, .22)})`; x.lineWidth = R(1, 3); x.beginPath(); const y = R(0, 256); x.moveTo(0, y); x.bezierCurveTo(80, y + R(-8, 8), 170, y + R(-8, 8), 256, y + R(-6, 6)); x.stroke(); }
    x.fillStyle = 'rgba(60,40,20,.35)'; x.fillRect(0, 126, 256, 2); });
  const ins = C2(128, 128, (x) => { x.fillStyle = '#e8a0a8'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${rnd() < .5 ? '255,200,205' : '190,110,120'},${R(.15, .4)})`; x.beginPath(); x.arc(R(0, 128), R(0, 128), R(2, 7), 0, 7); x.fill(); } });
  const card = C2(128, 128, (x) => { x.fillStyle = '#b8895a'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 128; i += 3) { x.fillStyle = `rgba(120,80,40,${R(.04, .12)})`; x.fillRect(i, 0, 1, 128); } x.fillStyle = 'rgba(210,190,150,.8)'; x.fillRect(56, 0, 16, 128); });
  const label = (t, sub) => C2(256, 128, (x) => { x.fillStyle = '#b8895a'; x.fillRect(0, 0, 256, 128); for (let i = 0; i < 256; i += 3) { x.fillStyle = `rgba(120,80,40,${R(.04, .12)})`; x.fillRect(i, 0, 1, 128); }
    x.fillStyle = '#2a2420'; x.textAlign = 'center'; x.font = '700 40px "Noto Sans TC", sans-serif'; x.save(); x.translate(128, 62); x.rotate(-.04); x.fillText(t, 0, 0); x.font = '500 22px "Noto Sans TC", sans-serif'; if (sub) x.fillText(sub, 0, 36); x.restore(); });
  const leaf = C2(64, 64, (x) => { x.clearRect(0, 0, 64, 64); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28 + R(-.2, .2), d = R(8, 18); x.fillStyle = ['#3d6b2e', '#4f7f3a', '#2f5a26', '#5d8c40'][i % 4]; x.save(); x.translate(32 + Math.cos(a) * d, 32 + Math.sin(a) * d); x.rotate(a); x.beginPath(); x.ellipse(0, 0, 9, 6, 0, 0, 7); x.fill(); x.restore(); } });
  return {
    ply: new THREE.MeshStandardMaterial({ map: ply, color: 0xd8c0a0, roughness: .9, side: THREE.BackSide }), plyF: new THREE.MeshStandardMaterial({ map: ply, color: 0xd8c0a0, roughness: .9 }),
    wood: new THREE.MeshStandardMaterial({ map: ply, color: 0xc8a478, roughness: .85 }), ins: new THREE.MeshStandardMaterial({ map: ins, roughness: 1 }),
    card: new THREE.MeshStandardMaterial({ map: card, roughness: .95 }), label,
    zinc: new THREE.MeshStandardMaterial({ color: 0xb4babe, metalness: .75, roughness: .42 }), dark: new THREE.MeshStandardMaterial({ color: 0x2a2e33, roughness: .6, metalness: .3 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf0ece4, roughness: .7 }), leaf: new THREE.MeshStandardMaterial({ map: leaf, transparent: true, alphaTest: .45, side: THREE.DoubleSide, roughness: .8 }),
    rope: new THREE.MeshStandardMaterial({ color: 0xe8e0cc, roughness: .95 })
  };
}
// a baked, merged piece of trim (rotated boxes: rafters, slats)
function rfDeco(g, mat) { if (!DECO.has(mat)) DECO.set(mat, []); DECO.get(mat).push(g); }
function rfBoxG(w, h, d, rx, ry, x, y, z) { const g = new THREE.BoxGeometry(w, h, d); if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); g.translate(x, y, z); return g; }

// ---------- building ----------
function buildRoof() {
  const M = rfMats(), H = RFH, G = RFG, p = RF.p;
  // ---- the two roofs (their shingles are drawn by the house shell) ----
  slopeCol({ x0: H.a0, x1: H.a1, z0: H.b0, z1: H.b1, y0: H.E - H.th - 1, y1: H.R + 3, th: H.th, top: (x, z) => rfIn(x, z, RF_VENT) ? -1e9 : rfHip(x, z) });
  slopeCol({ x0: G.x0, x1: G.x1, z0: G.z0, z1: G.z1, y0: G.E - G.th - 1, y1: G.R + 3, th: G.th, top: (x, z) => rfIn(x, z, RF_GVENT) ? -1e9 : rfGab(x, z) });
  const solid = (x0, x1, y0, y1, z0, z1, o = {}) => { const c = { t: 'b', x0, x1, y0, y1, z0, z1, ...o }; cols.push(c); return c; };
  // eaves: fascia boards with the soffit behind them (ledges you can climb up onto), the front gutter
  solid(912, 943, H.E - 14, H.E, -290, 290); solid(H.a0, H.a1, H.E - 14, H.E, 262, 293); solid(H.a0, H.a1, H.E - 14, H.E, -293, -262); solid(H.a0 - 3, -330, H.E - 14, H.E, -290, 290);
  solid(H.a0, H.a1, H.E - 16, H.E - 6, 293, 301);
  solid(G.x0, G.x1, G.E - 14, G.E, G.z1, G.z1 + 3); solid(G.x0, G.x1, G.E - 14, G.E, G.z0 - 3, G.z0);
  solid(G.x0, G.x1, G.E - 16, G.E - 6, G.z1 + 3, G.z1 + 11); solid(G.x0, G.x1, G.E - 16, G.E - 6, G.z0 - 11, G.z0 - 3);
  // the chimney (brick: a good climb), its cap and pots
  solid(-210, -150, 540, H.R + 80, -70, -20); solid(-216, -144, H.R + 80, H.R + 88, -76, -14);
  for (const x of [-196, -166]) cols.push({ t: 'c', x, z: -45, r: 6, y0: H.R + 88, y1: H.R + 100 });
  // an old TV aerial strapped to the chimney: a mast and its rods (the bat likes it)
  { const mx = -180, mz = -24; cyl(mx, mz, 1.3, H.R + 40, H.R + 196, M.dark, { seg: 10 }); for (const [y, w] of [[H.R + 150, 70], [H.R + 168, 54], [H.R + 186, 38]]) { const r = mesh(new THREE.CylinderGeometry(.7, .7, w, 8), M.dark, mx, y, mz); r.rotation.z = Math.PI / 2; cols.push({ t: 'b', x0: mx - w / 2, x1: mx + w / 2, y0: y - .7, y1: y + .7, z0: mz - .7, z1: mz + .7, noRay: true }); }
    for (const y of [H.R + 52, H.R + 72]) box(-151, -148, y, y + 5, -30, -18, M.dark); }
  // the upper east wall over the garage roof, its two window sills (ledges) and the ivy trellis between them
  solid(912, 921, 255, H.W, -262, 262); for (const z of [-120, 120]) solid(921, 924, 426, 430, z - 48, z + 48);
  buildTrellis(M);
  // the house's roof vent, and the garage's
  buildRoofVent(M, RF_VENT, rfHip, true); buildRoofVent(M, RF_GVENT, rfGab, false);
  buildAttic(M);
  buildGarageAttic(M);
  buildSunsetSky(); buildSkyline();
  // ---- light: the low sun, a lavender sky over warm ground ----
  RF.hemi = new THREE.HemisphereLight(0x9a90c8, 0x6a4436, 1.45); LV.add(RF.hemi);
  const tgt = V3(420, 560, 0); RF.sun = spotL(0xffb070, 24000000, tgt.clone().addScaledVector(SUNSET, 2600), tgt, .44, .5, 2048, 1700, 3700); RF.sun.userData.prio = 1;
  buildDrone(M);
  flushDeco();
  // everything up here has the colliders it was given (rafters overhead, the moving lid, cord and drone must not be made solid)
  for (const ch of LV.children) ch.userData.noSolid = true;
}
// the ivy trellis: a white lattice on stand-offs, thick with leaves, between the two windows
function buildTrellis(M) {
  const x0 = 921, x1 = 927, y0 = 378, y1 = 522, z0 = -40, z1 = 40;
  cols.push({ t: 'b', x0, x1, y0, y1, z0, z1, grip: true });
  for (let z = z0; z <= z1; z += 10) rfDeco(rfBoxG(1.6, y1 - y0, 1.6, 0, 0, 926, (y0 + y1) / 2, z), M.white);
  for (let y = y0 + 6; y < y1; y += 12) rfDeco(rfBoxG(1.4, 1.4, z1 - z0, 0, 0, 925.4, y, (z0 + z1) / 2), M.white);
  for (const y of [y0 + 20, y1 - 20]) rfDeco(rfBoxG(5, 2, 2, 0, 0, 923.5, y, 0), M.white);
  // leaves: crossed cards scattered over it, thicker at the bottom
  const lg = new THREE.PlaneGeometry(9, 9), N = 180, im = new THREE.InstancedMesh(lg, M.leaf, N), o = new THREE.Object3D();
  for (let i = 0; i < N; i++) { const t = Math.pow(rnd(), 1.4); o.position.set(927 + R(-.5, 2.5), y0 + 4 + (1 - t) * (y1 - y0 - 10), R(z0 - 4, z1 + 4)); o.rotation.set(R(-.6, .6), Math.PI / 2 + R(-.7, .7), R(0, 6.28)); o.scale.setScalar(R(.7, 1.3)); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
  im.castShadow = true; im.receiveShadow = true; LV.add(im);
}
// a box roof vent: a sheet-metal curb round a hole in the roof, a hood on short legs with louvred sides.
// You come and go between the curb's top and the hood (a 10 cm gap)
function buildRoofVent(M, V, topF, house) {
  const yB = topF((V.x0 + V.x1) / 2, V.z0) - 18, yT = V.top, hy = yT + 10;
  const w = (x0, x1, z0, z1) => box(x0, x1, yB, yT, z0, z1, M.zinc, { uv: 30 });
  w(V.x0, V.x0 + 2, V.z0, V.z1); w(V.x1 - 2, V.x1, V.z0, V.z1); w(V.x0 + 2, V.x1 - 2, V.z0, V.z0 + 2); w(V.x0 + 2, V.x1 - 2, V.z1 - 2, V.z1);
  box(V.x0 - 5, V.x1 + 5, hy, hy + 2, V.z0 - 5, V.z1 + 5, M.zinc);
  for (const [x, z] of [[V.x0 + 1, V.z0 + 1], [V.x1 - 1, V.z0 + 1], [V.x0 + 1, V.z1 - 1], [V.x1 - 1, V.z1 - 1]]) rfDeco(rfBoxG(1.2, 10, 1.2, 0, 0, x, yT + 5, z), M.zinc);
  // louvres on the two long sides (a couple bent out of the way: that's the gap you squeeze through)
  for (const z of [V.z0 - 4, V.z1 + 4]) for (let i = 0; i < 3; i++) { const y = yT + 2.5 + i * 2.8; if (i === 1) continue; const g = rfBoxG(V.x1 - V.x0 + 6, .5, 3, z < V.z0 ? .6 : -.6, 0, (V.x0 + V.x1) / 2, y, z); rfDeco(g, M.zinc); }
  // a flashing skirt round the curb where it meets the shingles
  for (const [x0, x1, z0, z1] of [[V.x0 - 4, V.x1 + 4, V.z0 - 4, V.z0], [V.x0 - 4, V.x1 + 4, V.z1, V.z1 + 4], [V.x0 - 4, V.x0, V.z0, V.z1], [V.x1, V.x1 + 4, V.z0, V.z1]]) {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; rfDeco(rfBoxG(x1 - x0, .6, z1 - z0, 0, 0, cx, topF(cx, cz) + .2, cz), M.zinc); }
  // warm evening light falls in
  const cx = (V.x0 + V.x1) / 2, cz = (V.z0 + V.z1) / 2;
  addBeam(0xffc890, V3(cx, yT + 4, cz), V3(cx + 8, yB - 60, cz - 12), .34, house ? .07 : .05);
  pointL(0xffb878, house ? 900 : 500, cx, yB - 6, cz);
}
// the attic over her room: boards, joists and insulation over the ceiling, the rafters and the underside of
// the roof, a partition, Dad's old boxes — and the stack under the vent that gets you up to it
function buildAttic(M) {
  const H = RFH, p = RF.p, th = H.th, F = H.W, A = (x, y, z) => V3(x, y, z);
  // the underside of the roof (seen only from inside)
  polyMesh([A(H.a0, H.E - th, H.b1), A(H.a1, H.E - th, H.b1), A(H.r1, H.R - th, 0), A(H.r0, H.R - th, 0)], M.ply, V3(1, 0, 0), V3(0, .438, -.899), 120, LV).castShadow = false;
  polyMesh([A(H.a1, H.E - th, H.b0), A(H.a0, H.E - th, H.b0), A(H.r0, H.R - th, 0), A(H.r1, H.R - th, 0)], M.ply, V3(1, 0, 0), V3(0, .438, .899), 120, LV).castShadow = false;
  polyMesh([A(H.a1, H.E - th, H.b1), A(H.a1, H.E - th, H.b0), A(H.r1, H.R - th, 0)], M.ply, V3(0, 0, 1), V3(-.899, .438, 0), 120, LV).castShadow = false;
  // rafters (front and back), the ridge board
  // (past the ridge's end the hips cut them short)
  for (let x = 304; x <= 880; x += 36) { const zA = Math.min(237, (H.R - th - F) / p), zB = Math.max(0, x - H.r1); if (zA - zB < 12) continue; const L = (zA - zB) / Math.cos(26 * Math.PI / 180), zc = (zA + zB) / 2;
    for (const s of [1, -1]) { const n = V3(0, .899, .438 * s); const c = V3(x, H.R - th - zc * p, s * zc).addScaledVector(n, -4.5); rfDeco(rfBoxG(3, 9, L, s * 26 * Math.PI / 180, 0, c.x, c.y, c.z), M.wood); } }
  rfDeco(rfBoxG(H.r1 - 300, 12, 3, 0, 0, (300 + H.r1) / 2, H.R - th - 6, 0), M.wood);
  // the floor: plaster ceiling below (her room's), joists, pink insulation, a boarded walkway
  const hx = RF_HATCH;
  for (const [x0, x1, z0, z1] of [[300, hx.x0, -237, 237], [hx.x1, 912, -237, 237], [hx.x0, hx.x1, -237, hx.z0], [hx.x0, hx.x1, hx.z1, 237]]) { const ins = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), M.ins); ins.rotation.x = -Math.PI / 2; ins.position.set((x0 + x1) / 2, F + .25, (z0 + z1) / 2); ins.receiveShadow = true; LV.add(ins); }
  for (let x = 316; x < 900; x += 40) { if (x > hx.x0 - 2 && x < hx.x1 + 2) { deco(x - 1.5, x + 1.5, F - .5, F + .9, -237, hx.z0, M.wood); deco(x - 1.5, x + 1.5, F - .5, F + .9, hx.z1, 237, M.wood); } else deco(x - 1.5, x + 1.5, F - .5, F + .9, -237, 237, M.wood); }
  for (const [x0, x1, z0, z1] of [[300, 900, -40, 40], [740, 800, 40, 128], [520, 610, -190, -40]]) deco(x0, x1, F, F + .6, z0, z1, M.plyF);
  // a partition of boards closes off the dark end over the kitchen
  { const pts = [A(300, F, -237), A(300, F, 237), A(300, H.R - th, 0)]; polyMesh(pts, M.plyF, V3(0, 0, 1), V3(0, 1, 0), 120, LV); const m2 = polyMesh(pts, M.ply, V3(0, 0, 1), V3(0, 1, 0), 120, LV); m2.castShadow = false;
    cols.push({ t: 'b', x0: 296, x1: 300, y0: F, y1: H.R, z0: -240, z1: 240 }); }
  // Dad's boxes: two under the vent make a way up to it (the big one, the smaller one on top)
  const cbox = (x0, x1, y0, y1, z0, z1, lab) => { const m = box(x0, x1, y0, y1, z0, z1, M.card, { uv: 40 }); if (lab) { const L = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(30, (x1 - x0) * .7), Math.min(15, (y1 - y0) * .6)), new THREE.MeshStandardMaterial({ map: lab, roughness: .9 })); L.position.set((x0 + x1) / 2, (y0 + y1) / 2, z1 + .1); LV.add(L); } return m; };
  cbox(534, 594, F, F + 20, -178, -126, M.label('實驗筆記', '2019 – 2022')); cbox(546, 582, F + 20, F + 32, -164, -136, M.label('舊零件'));
  cbox(470, 520, F, F + 26, -150, -100, M.label('聖誕裝飾')); cbox(640, 690, F, F + 22, -120, -72, M.label('BB衫', '留俾細佬妹')); cbox(650, 684, F + 22, F + 38, -112, -82);
  cbox(690, 740, F, F + 24, 132, 176, M.label('相簿')); cbox(380, 430, F, F + 30, 80, 130); cbox(390, 420, F + 30, F + 44, 90, 120, M.label('爸爸', '大學'));
  // an old blue suitcase lying flat, a rolled-up rug, a desk fan, a framed photo leaning on a box
  box(600, 664, F, F + 14, 80, 122, new THREE.MeshStandardMaterial({ color: 0x35558a, roughness: .55 }), { uv: 30 }); box(626, 638, F + 14, F + 16, 96, 106, M.dark);
  { const r = cyl(0, 0, 9, 0, 120, new THREE.MeshStandardMaterial({ color: 0x8a3a34, roughness: .95 }), { col: false, seg: 18 }); r.rotation.z = Math.PI / 2; r.position.set(420, F + 9, 30); cols.push({ t: 'b', x0: 360, x1: 480, y0: F, y1: F + 18, z0: 21, z1: 39 }); }
  { const fr = new THREE.Group(); fr.position.set(715, F + 8.5, 128); fr.rotation.set(-.2, Math.PI, 0, 'YXZ'); LV.add(fr);
    const ph = C2tex(96, 72, (x) => { const g = x.createLinearGradient(0, 0, 0, 72); g.addColorStop(0, '#f4c890'); g.addColorStop(1, '#d88a6a'); x.fillStyle = g; x.fillRect(0, 0, 96, 72);
      const fig = (cx, s, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, 72 - 40 * s, 8 * s, 0, 7); x.fill(); x.fillRect(cx - 9 * s, 72 - 32 * s, 18 * s, 32 * s); }; fig(28, 1, '#5a4a6a'); fig(52, 1.05, '#8a5a4a'); fig(72, .62, '#e88aa0');
      x.fillStyle = '#ffe9a8'; x.beginPath(); x.arc(84, 14, 6, 0, 7); x.fill(); });
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(20, 15), new THREE.MeshStandardMaterial({ map: ph, roughness: .5 })); pm.position.z = .4; fr.add(pm);
    const fm = new THREE.MeshStandardMaterial({ color: 0x6a4a2e, roughness: .6 }); for (const [w, h, x, y] of [[23, 1.6, 0, 8.3], [23, 1.6, 0, -8.3], [1.6, 18, 11.3, 0], [1.6, 18, -11.3, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1), fm); b.position.set(x, y, 0); fr.add(b); }
    RF.photo = V3(715, F, 120); }
  // a bare bulb on a wire (off), and the light coming up through the hatch from her room
  cyl(560, 30, .3, H.R - th - 60, H.R - th - 4, M.dark, { col: false, seg: 6 }); mesh(new THREE.SphereGeometry(3, 12, 10), new THREE.MeshStandardMaterial({ color: 0xf8f4e8, roughness: .2, transparent: true, opacity: .7 }), 560, H.R - th - 63, 30, { cast: false });
  RF.hatchL = pointL(0xffe6cc, 0, 828, F - 30, 90); RF.hatchB = addBeam(0xffe8d0, V3(828, F - 14, 90), V3(828, F + 60, 90), .5, .03);
  pointL(0x8a7aa0, 260, 600, F + 40, 0);
  // the hatch: a plaster lid in a wooden frame, a pull cord hanging from it
  const fr2 = new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: .6 });
  deco(hx.x0 - 3, hx.x1 + 3, 538, 540, hx.z0 - 3, hx.z0, fr2); deco(hx.x0 - 3, hx.x1 + 3, 538, 540, hx.z1, hx.z1 + 3, fr2); deco(hx.x0 - 3, hx.x0, 538, 540, hx.z0, hx.z1, fr2); deco(hx.x1, hx.x1 + 3, 538, 540, hx.z0, hx.z1, fr2);
  const lidG = new THREE.Group(); LV.add(lidG); RF.lidG = lidG;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(hx.x1 - hx.x0 - 1, 3, hx.z1 - hx.z0 - 1), new THREE.MeshStandardMaterial({ color: 0xf4f0ea, roughness: .8 })); lid.castShadow = true; lid.receiveShadow = true; lidG.add(lid);
  RF.lid = { t: 'b', x0: hx.x0, x1: hx.x1, y0: 540, y1: 552, z0: hx.z0, z1: hx.z1 }; cols.push(RF.lid);
  const cx = hx.x1 - 4, cz = (hx.z0 + hx.z1) / 2; RF.cordP = V3(cx, 472, cz);
  RF.cordM = new THREE.Group(); LV.add(RF.cordM);
  { const c = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 82, 6), M.rope); c.position.set(cx, 514, cz); c.castShadow = true; RF.cordM.add(c);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, .5, 8, 20), new THREE.MeshStandardMaterial({ color: 0xd8b060, metalness: .6, roughness: .35 })); ring.position.set(cx, 471, cz); ring.castShadow = true; RF.cordM.add(ring); }
  RF.cord = { t: 'b', x0: cx - 1, x1: cx + 1, y0: 468, y1: 556, z0: cz - 1, z1: cz + 1, grip: true }; cols.push(RF.cord);
  // (both stay where they are until the world's colliders have been filed by place — the first tick then shuts the hatch)
  RF.cordM.visible = false; RF.lidG.position.set((hx.x0 + hx.x1) / 2, 550.5, (hx.z0 + hx.z1) / 2);
}
function C2tex(w, h, f) { const [c, x] = cnv(w, h); f(x, w, h); return tex(c); }
// the hatch shut (lid in place, no cord) or open (the lid pushed aside up in the attic, the cord hanging down to the wardrobe)
function rfHatch(open) {
  RF.open = open; const hx = RF_HATCH; if (!RF.lid) return;
  if (open) { RF.lidG.position.set(hx.x0 - 30, RFH.W + 1.6, (hx.z0 + hx.z1) / 2 + 10); RF.lidG.rotation.set(0, .5, .04); RF.lid.y0 = -999; RF.lid.y1 = -998; RF.cord.y0 = 468; RF.cord.y1 = 556; }
  else { RF.lidG.position.set((hx.x0 + hx.x1) / 2, 550.5, (hx.z0 + hx.z1) / 2); RF.lidG.rotation.set(0, 0, 0); RF.lid.y0 = 540; RF.lid.y1 = 552; RF.cord.y0 = -999; RF.cord.y1 = -998; }
  RF.cordM.visible = open; if (RF.hatchL) { RF.hatchL.intensity = open ? 700 : 0; RF.hatchB.visible = open; }
}
// the garage attic: just the boards over its ceiling, a glow from the vent, and the duct's end peeled open
function buildGarageAttic(M) {
  const G = RFG; const A = (x, y, z) => V3(x, y, z);
  polyMesh([A(G.x0, G.E - G.th, G.z1), A(G.x1, G.E - G.th, G.z1), A(G.x1, G.R - G.th, G.zm), A(G.x0, G.R - G.th, G.zm)], M.ply, V3(1, 0, 0), V3(0, .438, -.899), 120, LV).castShadow = false;
  polyMesh([A(G.x1, G.E - G.th, G.z0), A(G.x0, G.E - G.th, G.z0), A(G.x0, G.R - G.th, G.zm), A(G.x1, G.R - G.th, G.zm)], M.ply, V3(1, 0, 0), V3(0, .438, .899), 120, LV).castShadow = false;
  // the inside of the gable end (so you can't see out through it)
  { const pts = [A(1458, 270, -270), A(1458, 270, 312), A(1458, G.R - G.th, G.zm)]; const m = polyMesh(pts, M.plyF, V3(0, 0, 1), V3(0, 1, 0), 120, LV); m.castShadow = false; }
  for (let x = 930; x < 1450; x += 40) deco(x - 1.5, x + 1.5, 280, 281.2, -262, 304, M.wood);
  pointL(0x9a8aa8, 220, 1000, 300, 120);
  // the duct's end: a panel peeled back at the bottom — walk in, and the grille is right there
  const bent = new THREE.Mesh(new THREE.BoxGeometry(4, 12, 24), new THREE.MeshStandardMaterial({ color: 0xc4cacd, metalness: .5, roughness: .48 })); bent.position.set(953, 286, 120); bent.rotation.z = -.9; bent.castShadow = true; LV.add(bent);
}

// ---------- the sunset ----------
function buildSunsetSky() {
  const G2 = new THREE.Group(); G2.name = 'sunsetSky'; scene.add(G2); RF.skyG = G2; G2.visible = false;
  const g = new THREE.SphereGeometry(3300, 48, 24);
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { sun: { value: SUNSET.clone() } },
    vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 sun; varying vec3 vP; void main(){ vec3 d=normalize(vP); float y=d.y; float s=max(0.,dot(d,sun)); float az=max(0.,dot(normalize(vec3(d.x,0.,d.z)),normalize(vec3(sun.x,0.,sun.z))));
      vec3 zen=vec3(.03,.05,.19), mid=vec3(.24,.15,.38), horA=vec3(.90,.40,.34), horS=vec3(1.7,.60,.14), gnd=vec3(.24,.14,.16);
      vec3 hor=mix(horA,horS,pow(az,3.));
      vec3 c=mix(hor,mid,smoothstep(.0,.22,y)); c=mix(c,zen,smoothstep(.22,.85,y));
      c=mix(gnd,c,smoothstep(-.05,.01,y));
      c+=vec3(1.,.5,.16)*(pow(s,9.)*.55+pow(s,70.)*1.2);
      gl_FragColor=vec4(c,1.); }` });
  const sky = new THREE.Mesh(g, m); sky.frustumCulled = false; sky.renderOrder = -10; G2.add(sky);
  const sp = SUNSET.clone().multiplyScalar(3150);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(70, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd08a).multiplyScalar(3.2), fog: false, depthWrite: false })); disc.position.copy(sp); disc.lookAt(0, 0, 0); disc.renderOrder = -9; G2.add(disc);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(420, 40), new THREE.MeshBasicMaterial({ color: 0xff9a50, transparent: true, opacity: .16, fog: false, depthWrite: false, blending: THREE.AdditiveBlending })); glow.position.copy(sp).multiplyScalar(.995); glow.lookAt(0, 0, 0); glow.renderOrder = -9; G2.add(glow);
  // long streaky clouds, lit from underneath
  const ct = C2tex(256, 64, (x) => { x.clearRect(0, 0, 256, 64); for (let i = 0; i < 26; i++) { const cx = R(20, 236), cy = R(22, 44), w = R(30, 90), h = R(4, 10); const gr = x.createRadialGradient(cx, cy, 1, cx, cy, w * .5); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.save(); x.translate(cx, cy); x.scale(1, h / w); x.beginPath(); x.arc(0, 0, w * .5, 0, 7); x.fill(); x.restore(); } });
  for (let i = 0; i < 16; i++) {
    const a = Math.atan2(SUNSET.x, SUNSET.z) + R(-1.5, 1.5) + (i % 4 === 0 ? Math.PI : 0), el = R(.03, .2), r = 3000, d = V3(Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el));
    const near = Math.max(0, d.dot(SUNSET)); const col = new THREE.Color().setRGB(1.0, .55 + near * .2, .5 - near * .15).multiplyScalar(.75 + near * .9);
    const cm = new THREE.MeshBasicMaterial({ map: ct, color: col, transparent: true, fog: false, depthWrite: false, opacity: R(.45, .85) });
    const w = R(700, 1400); const c = new THREE.Mesh(new THREE.PlaneGeometry(w, w * .16), cm); c.position.copy(d.multiplyScalar(r)); c.lookAt(0, 0, 0); c.renderOrder = -9; G2.add(c);
  }
}
// the view: rows of roofs and trees all round, and the city's towers beyond the park (lights coming on)
function buildSkyline() {
  const C = V3(600, 0, 0);
  const ring = (r, y0, y1, t0, tl, map, rep) => { const g = new THREE.CylinderGeometry(r, r, y1 - y0, 160, 1, true, t0, tl); g.translate(C.x, (y0 + y1) / 2, C.z); map.wrapS = THREE.RepeatWrapping; map.repeat.set(rep, 1);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: .5, side: THREE.BackSide, fog: true })); m.frustumCulled = false; LV.add(m); RF.rings.push(m); return m; };
  // the suburb, seen from up here: a dark sea of trees with roofs scattered through it, getting smaller and hazier
  // towards the horizon, windows and street lamps coming on, the farthest roofline against the sky
  // (y −40…700 on the ring, drawn 4 times round)
  const sub = C2tex(2048, 512, (x, W, Hh) => {
    x.clearRect(0, 0, W, Hh); const yOf = y => Hh - (y + 40) / 740 * Hh, top = yOf(575);
    const haze = [176, 112, 104], mix = (c, k) => `rgb(${c.map((v, j) => Math.round(v + (haze[j] - v) * k)).join(',')})`;
    // the canopy: a ground of dark trees, lighter and hazier with distance
    let g = x.createLinearGradient(0, top, 0, Hh); g.addColorStop(0, mix([70, 60, 70], .55)); g.addColorStop(.3, mix([44, 48, 44], .32)); g.addColorStop(1, mix([30, 36, 30], .1)); x.fillStyle = g; x.fillRect(0, top, W, Hh - top);
    // things scattered at random (no rows): far ones small and hazy, near ones bigger and darker
    const roofC = [[92, 70, 66], [70, 66, 78], [104, 80, 64], [60, 58, 66], [118, 92, 76]], treeC = [[36, 44, 36], [44, 50, 38], [30, 38, 34]];
    for (let i = 0; i < 5200; i++) {
      const u = Math.pow(rnd(), .55), y = lerp(-40, 568, u), s = lerp(2.4, .22, u), hk = Math.pow(u, 1.5) * .6, cx = R(0, W), cy = yOf(y);
      if (rnd() < .5) { x.fillStyle = mix(treeC[(rnd() * 3) | 0], hk); x.beginPath(); x.ellipse(cx, cy, R(8, 16) * s, R(5, 10) * s, 0, 0, 7); x.fill(); continue; }
      const w = R(12, 26) * s, h = R(5, 9) * s; x.fillStyle = mix(roofC[(rnd() * 5) | 0], hk); x.beginPath(); x.moveTo(cx - w / 2, cy); x.lineTo(cx - w * .3, cy - h); x.lineTo(cx + w * .3, cy - h); x.lineTo(cx + w / 2, cy); x.fill();
      if (rnd() < .18) { x.fillStyle = `rgba(255,${200 + R(0, 30)},${130 + R(0, 40)},${.85 - hk * .5})`; const d = Math.max(1, 2.2 * s); x.fillRect(cx + R(-.3, .3) * w, cy + h * .2, d, d * .8); }
    }
    // streets: faint lines of lamps curving across
    for (let r = 0; r < 14; r++) { const u = Math.pow((r + .5) / 14, .6), y = lerp(-20, 560, u), s = lerp(2.2, .25, u); let ph = R(0, 6);
      for (let px = 0; px < W; px += R(18, 40) * s) { const cy = yOf(y) + Math.sin(px / W * 6.28 * 2 + ph) * 10 * s; x.fillStyle = `rgba(255,186,110,${.9 - u * .5})`; x.beginPath(); x.arc(px, cy, Math.max(.8, 1.6 * s), 0, 7); x.fill(); } }
    // the farthest roofline, ragged against the sky
    x.fillStyle = mix([70, 58, 72], .55); for (let px = 0; px < W; px += R(6, 18)) { const h = R(4, 14); x.fillRect(px, top - h, R(6, 16), h + 2); }
  });
  ring(2400, -40, 700, 0, Math.PI * 2, sub, 4);
  // the city: towers between the trees of the park and the sunset (front arc only)
  const city = C2tex(2048, 512, (x, W, Hh) => {
    x.clearRect(0, 0, W, Hh); const yOf = y => Hh - (y - 300) / 760 * Hh;
    const towers = []; let px = 40;
    while (px < W - 40) { const mid = 1 - Math.abs(px / W - .52) * 1.7; const w = R(10, 34), h = R(555, 600) + Math.max(0, mid) * R(30, 190) * (rnd() < .2 ? 1.6 : 1); towers.push([px, w, h]); px += w * R(.55, 1.2); }
    towers.sort((a, b) => a[2] - b[2]);
    for (const [tx, w, h] of towers) {
      const g = x.createLinearGradient(tx, 0, tx + w, 0); g.addColorStop(0, '#5a4660'); g.addColorStop(.25, '#3a3048'); g.addColorStop(1, '#2a2438'); x.fillStyle = g; x.fillRect(tx, yOf(h), w, Hh);
      if (rnd() < .3) { x.fillRect(tx + w * .35, yOf(h + R(14, 40)), w * .3, yOf(h) - yOf(h + 40)); }
      for (let wy = yOf(h) + 5; wy < yOf(520); wy += 5) for (let wx = tx + 3; wx < tx + w - 3; wx += 4) if (rnd() < .16) { x.fillStyle = rnd() < .8 ? 'rgba(255,214,150,.95)' : 'rgba(220,235,255,.9)'; x.fillRect(wx, wy, 2, 2); }
      if (h > 800) { x.fillStyle = '#ff3a2a'; x.fillRect(tx + w / 2 - 1.5, yOf(h) - 4, 3, 3); }
    }
    // the park's trees in front of the city's feet
    x.fillStyle = '#2a2230'; for (let i = 0; i < 90; i++) { const tx = R(0, W), r = R(14, 34); x.beginPath(); x.arc(tx, yOf(R(515, 545)), r, 0, 7); x.fill(); } x.fillRect(0, yOf(520), W, Hh);
  });
  const a0 = Math.atan2(SUNSET.x, SUNSET.z) * .35 - .95;
  ring(2900, 300, 1060, a0, 1.9, city, 1);
}

// ---------- the drone ----------
function buildDrone(M) {
  const g = new THREE.Group(); LV.add(g); g.visible = false;
  const body = new THREE.Mesh(new THREE.BoxGeometry(14, 4, 10), M.dark); g.add(body);
  const top = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 10, 0, 6.28, 0, 1.4), M.dark); top.position.y = 1.5; g.add(top);
  const rot = []; for (const [x, z] of [[-12, -10], [12, -10], [-12, 10], [12, 10]]) { const a = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(x, z), 1.4, 1.6), M.dark); a.position.set(x / 2, 0, z / 2); a.rotation.y = -Math.atan2(z, x); g.add(a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 3, 12), M.dark); m.position.set(x, 1, z); g.add(m);
    const pr = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, .3, 24), new THREE.MeshBasicMaterial({ color: 0x9aa0a8, transparent: true, opacity: .25, depthWrite: false })); pr.position.set(x, 2.8, z); g.add(pr); rot.push(pr); }
  const led = (c, x, z) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(3) })); m.position.set(x, -1, z); g.add(m); return m; };
  const leds = [led(0xff2a1a, -12, 10), led(0x2aff5a, 12, 10), led(0xffffff, 0, -6)];
  const cam = new THREE.Mesh(new THREE.SphereGeometry(3, 14, 10), new THREE.MeshStandardMaterial({ color: 0x111418, metalness: .6, roughness: .2 })); cam.position.set(0, -4, 3); g.add(cam);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(1.6, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xdfe8ff).multiplyScalar(4) })); lens.position.set(0, -4, 6.1); g.add(lens);
  // a printed logo on its back: O.D.
  const lg = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshBasicMaterial({ map: C2tex(128, 64, (x) => { x.fillStyle = '#e8eef4'; x.font = '700 40px sans-serif'; x.textAlign = 'center'; x.fillText('O·D', 64, 46); }), transparent: true })); lg.rotation.x = -Math.PI / 2; lg.position.y = 2.05; g.add(lg);
  const L = new THREE.SpotLight(0xe8f0ff, 0, 0, .2, .35, 2); L.castShadow = true; L.shadow.mapSize.setScalar(TOUCH ? 512 : 1024); L.shadow.camera.near = 20; L.shadow.camera.far = 1200; L.shadow.bias = -.0005; L.shadow.normalBias = .04; L.userData.prio = 1; LV.add(L, L.target);
  const beam = beamMesh(0xdfe8ff, 100, .2, .32); beam.visible = false;
  RF.drone = { g, rot, leds, L, beam, on: false, t: 0, pos: V3(300, 820, 600), aim: V3(300, 640, 0), lock: 0, see: 0 };
}
// where it flies (a slow loop round the house, bobbing) and where its light points (sweeping the roofs)
function droneTick(dt) {
  const D = RF.drone; if (!D) return; const show = D.on && ZONES.roof.near; D.g.visible = show; D.beam.visible = show; D.L.intensity = show ? 120000 : 0; if (!D.on) return;
  D.t += dt; const t = D.t;
  const want = V3(330 + Math.sin(t * .11) * 720, 790 + Math.sin(t * .7) * 8, Math.cos(t * .11) * 460);
  D.pos.lerp(want, 1 - Math.exp(-1.5 * dt));
  let aim = V3(300 + Math.sin(t * .37) * 440, 0, Math.sin(t * .53 + 1) * 200); aim.y = Math.max(rfTopAt(aim.x, aim.z), GY);
  if (D.lock > 0 && leader) { aim = V3(leader.pos.x, leader.pos.y + 2, leader.pos.z); }
  D.aim.lerp(aim, 1 - Math.exp(-(D.lock > 0 ? 4 : 1.2) * dt));
  D.g.position.copy(D.pos); D.g.rotation.set(Math.sin(t * .9) * .05, Math.atan2(D.aim.x - D.pos.x, D.aim.z - D.pos.z), Math.sin(t * .7) * .06);
  for (const r of D.rot) r.rotation.y += dt * 40;
  D.leds[0].visible = D.leds[1].visible = (t % 1.2) < .6; D.leds[2].visible = (t % .9) < .12;
  D.L.position.copy(D.pos).add(V3(0, -5, 0)); D.L.target.position.copy(D.aim); D.L.target.updateMatrixWorld();
  const from = D.L.position, len = from.distanceTo(D.aim); aimBeam(D.beam, from, D.aim); D.beam.scale.setScalar(len / 100);
}
// can its light see the leader? (inside the cone, nothing in the way)
function droneSees() {
  const D = RF.drone; if (!D || !D.on || !leader) return 0; const L = leader;
  const eye = D.L.position, tp = V3(L.pos.x, L.pos.y + L.h * .5, L.pos.z), d = V3().subVectors(tp, eye), dist = d.length(); d.divideScalar(dist);
  const ax = V3().subVectors(D.aim, eye).normalize(); const c = d.dot(ax); if (c < Math.cos(.24) || dist > 1100) return 0;
  if (rayBlocked(eye, d, dist - 1.5, false)) return 0;
  return sstep(Math.cos(.24), Math.cos(.1), c);
}

// ---------- per frame (runs everywhere, after the other places' world ticks) ----------
function roofTick(dt) {
  if (!ZONES.roof) return; if (!RF.inited) { RF.inited = true; rfHatch(RF.open); } const on = RF_ON();
  if (RF.skyG) { RF.skyG.visible = on; if (on) RF.skyG.position.copy(camera.position); }
  for (const m of RF.rings) m.visible = on;
  if (on && ST.sky) ST.sky.visible = false;
  const far = on ? 3700 : 2400; if (camera.far !== far) { camera.far = far; camera.updateProjectionMatrix(); }
  // under the roof (in the attic): dim and warm; out on top: the evening sky
  const cp = camera.position, inA = on && cp.x > -330 && cp.x < 912 && Math.abs(cp.z) < 262 && cp.y < rfHip(cp.x, cp.z) - RFH.th - 1 ? 1 : 0;
  RF.attic = damp(RF.attic, inA, 4, dt); const D = LEVELS.roof, k = RF.attic;
  if (RF.hemi) RF.hemi.intensity = lerp(1.45, .32, k); D.envI = lerp(.85, .25, k); D.expo = lerp(.98, 1.55, k); D.fog[1] = lerp(.00016, .0006, k);
  // up the cord to the hatch: pull yourself over its edge onto the attic floor beside it
  if (RF.open) for (const C of party) if (C.climbing && C.climbC === RF.cord && C.pos.y > 545 && !C.mantle) { C.climbing = false; C.mantle = { from: C.pos.clone(), to: V3(clamp(C.pos.x - 8, 806, 846), RFH.W, RF_HATCH.z0 - 5), t: 0, dur: .55 }; C.yaw = Math.PI; }
  droneTick(dt);
}

// ---------- chapter one, on top of the house ----------
const RQ = [
  { t: '穿過閣樓，去有光嘅地方', s: '屋頂通風口透入夕陽。爬上爸爸啲舊紙箱，就夠得着通風口嘅鐵框' },
  { t: '由通風口爬出屋頂', s: '爬上鐵框頂，喺罩下面嘅空隙鑽出去' },
  { t: '上屋脊', s: '沿住瓦面向上行。屋脊最高，望得最遠' },
  { t: '避開無人機，去屋頂東邊', s: 'Origin Dynamics 嘅無人機用射燈搜緊屋頂。躲喺煙囱、通風口後面，或者屋脊另一邊' },
  { t: '落去車房屋頂', s: '屋頂東邊下面就係車房屋頂。跳落去，或者沿長春藤架爬落去' },
  { t: '由車房屋頂嘅通風口入車房', s: '爬上通風口嘅鐵框，跳入去。車房閣樓有條舊風槽，風槽底嘅鐵網通落車房' }
];
const rfOut = (C) => { const t = rfTopAt(C.pos.x, C.pos.z); return t > -1e8 && C.pos.y >= t - .6 && !rfIn(C.pos.x, C.pos.z, RF_VENT, 7) && !rfIn(C.pos.x, C.pos.z, RF_GVENT, 7); };
LEVELS.roof = {
  chapter: '第一章', title: '屋企', room: '閣樓', house: true, env: 'dusk', envI: .85, fog: [0xc8805e, .00016], expo: .98, bloom: [.34, 1.7],
  dust: { N: 900, box: [300, 900, 552, 660, -230, 230], beamFrac: .5, door: false },
  toys: true, npcNear: false, build: buildRoof,
  cps: [[820, 552, 30], [565, 584, -150], [560, 651, -60], [300, RFH.R + 3.5, 0], [880, 568, 0], [1100, 393, 60]],
  quests: RQ,
  // started from the chapter list: the crew has just climbed up through her ceiling into the attic
  spawn() {
    spawnSP(this.cps[0], .96, 5); rfHatch(true); RF.drone.on = false; RF.said = {};
    KS.coreGot = true; KS.carried = false; KS.coreDrop = null; KS.home = true; KS.ch2 = true; KS.ch3 = true; LIV.remoteGot = true;
    if (KS.core) KS.core.position.set(-306, 1.6, -100);
    ZONES.kitchen.save = { qs: SP_Q2B, q: 1, cp: 6, lvT: 0 };
  },
  enter(prev, again) {
    rfHatch(true); if (again || NET.on) return;
    RF.drone.on = false; RF.said = {};
    if (prev === 'kitchen') { setTimeout(() => say('爸爸', '閣樓……我啲舊嘢都擺喺度。', '#f5f0e6', 3), 900); setTimeout(() => say('爸爸', '通風口嗰邊有光——由嗰度出得去屋頂。', '#f5f0e6', 3.4), 4400); }
  },
  keep(id) { return id === 'yard' || id === 'road'; },   // falling off the edge doesn't start the next chapter: you're put back on the roof
  detect: detectRoof,
  update(dt) {
    lvT += dt; const L = leader; if (NET.on || STATE !== 'play') return;
    if (quest === 0 && L.grounded && L.pos.y > 580 && rfIn(L.pos.x, L.pos.z, RF_VENT, 10)) { setQuest(1); toast('爬上鐵框頂，喺罩下面鑽出去'); }
    if (quest <= 1 && L.grounded && rfOut(L) && L.pos.x < RFH.a1) { setQuest(2); roomBanner('屋頂'); setTimeout(() => say('老友', '嘩……好高！', '#d9a675', 2.2), 600); setTimeout(() => say('爸爸', '上屋脊睇吓。', '#f5f0e6', 2.4), 2900); }
    if (quest === 2 && L.grounded && L.pos.y > RFH.R - 1 && Math.abs(L.pos.z) < 7 && L.pos.x > RFH.r0 + 10 && L.pos.x < RFH.r1 - 10) filmPlay(FILM_RIDGE);
    if (quest === 3 && L.grounded && L.pos.x > 780 && rfOut(L)) { setQuest(4); say('爸爸', '下面就係車房屋頂。跳落去！', '#f5f0e6', 2.6); }
    if (quest <= 4 && quest >= 3 && L.grounded && L.pos.x > 925 && L.pos.y < 430 && rfOut(L)) { setQuest(5); say('爸爸', '車房屋頂都有個通風口——由嗰度入車房。', '#f5f0e6', 3.2); }
    if (!RF.said.photo && RF.photo && L.pos.distanceTo(RF.photo) < 26) { RF.said.photo = 1; say('爸爸', '呢張相……佢五歲生日嗰日影嘅。', '#f5f0e6', 3.4); }
    // fell off: back up to the last checkpoint (the yard and the street are another day)
    if (L.pos.y < 240 && (L.grounded || L.pos.y < -10)) { rfPutBack(); toast('跌咗落去！……返上屋頂', 2.6); }
  },
  win() { },
  marker() {
    if (NET.on) return mpMarker();
    const L = leader; if (quest === 0) return V3(564, 586, -150); if (quest === 1) return V3(564, 624, -150);
    if (quest === 2) return V3(clamp(L.pos.x, RFH.r0 + 30, RFH.r1 - 30), RFH.R + 4, 0);
    if (quest === 3) return V3(820, rfHip(820, 0) + 3, 0); if (quest === 4) return V3(1060, rfGab(1060, 40) + 3, 40);
    return V3(968, RF_GVENT.top + 2, 120);
  },
  reset() { if (RF.drone) RF.drone.lock = 0; },
  eyeText: () => RF.drone && RF.drone.on ? (meter > .3 ? '無人機嘅射燈照到你！快啲躲' : 'Origin Dynamics 嘅無人機喺上面巡緊') : '',
  hint(L) { if (quest === 4 && Math.abs(L.pos.x - 924) < 30 && Math.abs(L.pos.z) < 50) return '長春藤架可以爬上爬落'; return ''; },
  onSwitch() { }
};
function rfPutBack() {
  const p = CPS[cp] || CPS[0]; party.forEach((C, i) => { if (C.frozen) return; C.pos.set(p[0] + (i % 3 - 1) * 4, p[1], p[2] + Math.floor(i / 3) * 4); C.vel.set(0, 0, 0); C.climbing = false; C.mantle = null; C.tumble = 0; C.queue = []; if (C.disp) C.disp.copy(C.pos); });
  trail = []; leader.lastTrail.copy(leader.pos); cam.tgt.set(leader.pos.x, leader.pos.y + leader.h * .8, leader.pos.z);
}
function detectRoof(dt) {
  if (STATE !== 'play') return; if (window.__NODET) { meter = 0; return; } const D = RF.drone;
  if (TOY.grace > 0) { meter = Math.max(0, meter - dt * .5); return; }
  const L = leader; if (L.frozen || !mine(L) || !D || !D.on) { meter = Math.max(0, meter - dt * .5); KS.watch = null; return; }
  const s = droneSees();
  if (D.grace > 0) { D.grace -= dt; meter = Math.max(0, meter - dt * .5); KS.watch = null; return; }
  if (s > 0) { meter += s * (L.crouch ? .6 : 1) * (L.spd > 1.5 ? 1.2 : .85) * hideK(L) * .7 * dt; if (meter > .22) D.lock = Math.max(D.lock, 1.6); KS.watch = { p: D.pos.clone(), s, who: 'drone' }; if (meter > .3) netSeen(V3(L.pos.x, L.pos.y + 2, L.pos.z), 'drone'); }
  else { meter -= dt * .28; KS.watch = null; }
  D.lock -= dt; meter = clamp(meter, 0, 1); if (meter >= 1) { D.lock = 0; toyFreeze('drone'); }
}
// the sunset on the ridge: everyone sits down for a moment, then the drone comes up from the street
function rfSeat(x0) {
  const ids = party.filter(C => !C.frozen); RF.rx = x0;
  ids.forEach((C, i) => { const x = x0 + (i - (ids.length - 1) / 2) * 7.5; C.pos.set(x, RFH.R + 3.5, 0); if (C.disp) C.disp.copy(C.pos); C.yaw = .15 - (i - ids.length / 2) * .04; C.state = 'sit'; C.spd = 0; C.vel.set(0, 0, 0); C.climbing = false; C.mantle = null; C.wave = false; C.root.visible = true; C.look = 0; });
}
const FILM_RIDGE = { id: 'ridge', len: 17.5, mus: .55,
  begin() { rfSeat(clamp(leader.pos.x, RFH.r0 + 60, RFH.r1 - 60)); const D = RF.drone; D.on = false; D.pos.set(RF.rx + 160, 470, 760); D.t = 0; },
  end() {
    const D = RF.drone; party.forEach(C => { if (C.state === 'sit') C.state = 'idle'; C.grounded = true; C.queue = []; }); trail = []; leader.lastTrail.copy(leader.pos);
    D.on = true; D.lock = 0; D.t = 9; D.grace = 3.5; D.pos.set(RF.rx + 120, 760, 520); setQuest(3); cp = 3;
    setTimeout(() => { if (STATE === 'play') say('爸爸', '躲喺屋脊後面，唔好俾個射燈照到！去東邊。', '#f5f0e6', 3.6); }, 600);
  },
  shots: [
    // behind them, rising slowly: their backs on the ridge, the street, the park and the towers, the sun going down
    { t0: 0, fov: 42, set() { }, run(u) { rfSitTick(u); const k = sstep(0, 6.5, u), c = V3(RF.rx, RFH.R + 3.5, 0); return [V3(c.x + 22 - k * 8, c.y + 7 + k * 5, c.z - 36 + k * 6), V3(c.x - 40, c.y - 12, c.z + 200), c]; } },
    // side-on, close: their faces in the last of the sun
    { t0: 6.5, fov: 30, set() { }, run(u) { rfSitTick(u + 6.5); const c = V3(RF.rx, RFH.R + 3.5, 0); return [V3(c.x - 30 + u * 1.5, c.y + 4.2, c.z + 13), V3(c.x + 6, c.y + 3.2, c.z), c]; } },
    // something comes up from the street: the drone, its light snapping on
    { t0: 11.5, fov: 40, set() { const D = RF.drone; D.on = true; D.pos.set(RF.rx + 160, 470, 760); }, run(u, dt) { rfSitTick(u + 11.5); const D = RF.drone; D.pos.lerp(V3(RF.rx + 90, 740, 300), 1 - Math.exp(-1.1 * dt)); D.aim.lerp(V3(RF.rx, RFH.R, 20), 1 - Math.exp(-2 * dt)); D.lock = 0;
      const c = V3(RF.rx, RFH.R + 3.5, 0); return [V3(c.x - 16, c.y + 6, c.z - 26), D.pos.clone(), c]; } }
  ],
  ev: [[1, () => cineSay('爸爸', '……好耐冇咁樣睇過日落。', '#f5f0e6', 3)], [4.2, () => cineSay('助手', '教授，嗰邊就係市中心？', '#e8c9a8', 2.6)], [7, () => cineSay('爸爸', '嗯。Origin Dynamics 嘅大樓就喺嗰度。', '#f5f0e6', 2.8)],
    [9.8, () => cineSay('老友', '咁我哋早晚都要去一轉。', '#d9a675', 2.4)], [12.2, () => cineSay('小彩', '……有嘢飛緊上嚟！', '#9fd86b', 2)], [15, () => cineSay('爸爸', '無人機！散開！', '#f5f0e6', 2.2)]]
};
// little movements while they sit: heads turning, a kick of the legs, someone points
function rfSitTick(t) {
  party.forEach((C, i) => { if (C.frozen) return; C.state = 'sit'; C.grounded = true; const ph = i * 1.7; C.look = Math.sin(t * .5 + ph) > .7 ? Math.sin(ph * 3) * .6 : 0; C.sitKick = Math.sin(t * 1.3 + ph) * .12; });
  if (t > 12) party.forEach(C => { C.look = damp(C.look || 0, .5, 3, 1 / 60); });
  const D = chars.dad; if (D && party.includes(D)) D.wave = t > 7 && t < 9.5;
}
function startRoof() { return startChapter('roof', { chapter: '第一章', title: '屋企', after() { setTimeout(() => roomBanner('閣樓'), 900); } }); }
