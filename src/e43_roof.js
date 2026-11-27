// =====================================================================
//  THE ROOF — the top of the house at sunset (still chapter one: the house)
//  · up from her bedroom: a pull cord hangs from the attic hatch over the wardrobe
//  · the attic: rafters, pink insulation, Dad's old boxes; sunset light falls in through the roof vent
//  · out of the vent onto the hipped roof, up to the ridge: the street, the park and the city beyond,
//    the sun going down behind the towers (the title screen sits the whole crew up here)
//  · a magpie circles over the roofs: if it spots you out in the open it swoops, grabs you and carries you
//    off to its nest on the old TV aerial (full of shiny things) — climb out and try again
//  · down onto the garage roof (jump, or climb down the ivy trellis), in through its roof vent, along the
//    garage attic into the old duct, and down through the grille onto the shelf in the garage
//  Roofs are sloped slabs ('h' colliders: a top that follows the roof, so you can walk up and down it).
// =====================================================================
const RF = { p: Math.tan(26 * Math.PI / 180), open: false, cord: null, lid: null, skyG: null, rings: [], sun: null, hemi: null, bird: null, said: {}, attic: 0, fallT: 0 };
const RFH = { a0: -358, a1: 940, b0: -290, b1: 290, W: 552, r0: -68, r1: 650, th: 12 }; RFH.E = RFH.W - 28 * RF.p; RFH.R = RFH.W + 262 * RF.p;
const RFG = { x0: 914, x1: 1478, z0: -290, z1: 332, zm: 21, W: 270, th: 10 }; RFG.E = RFG.W - 20 * RF.p; RFG.R = RFG.W + 291 * RF.p;
const RF_VENT = { x0: 546, x1: 582, z0: -162, z1: -138, top: 622 };    // the house's roof vent: its curb (outside faces) and the top of the curb
const RF_GVENT = { x0: 950, x1: 986, z0: 108, z1: 132, top: 380 };     // the garage's
const RF_HATCH = { x0: 800, x1: 856, z0: 66, z1: 114 };                // the attic hatch in her ceiling
const SUNSET = V3(-.6, .1, .79).normalize();
const RF_ON = () => !!ZONES.roof && WC.cz === ZONES.roof;
// the garage attic (over the garage's ceiling) and the garage under that ceiling: the ceiling stops light and sight between them
const gIn = p => p.x > 912 && p.x < 1460 && p.z > -272 && p.z < 314;
const gAttic = p => gIn(p) && p.y > 277 && p.y < 420, gUnder = p => gIn(p) && p.y < 274 && p.y > -60;

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
    band(G.zm, 100, gy(100)), band(100, 170, gy(170)), band(170, 240, gy(240)), band(240, 312, gy(312)), band(312, 440, 252),
    // the garage attic (over the garage's ceiling, round the end of the duct — that stays the garage's)
    [952, 1460, 280.5, 420, -270, 312], [912, 952, 280.5, 420, -270, 104], [912, 952, 280.5, 420, 136, 312], [912, 952, 300.5, 420, 104, 136]
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
  solid(912, 943, H.E - 14, H.E, -290, 290); solid(H.a0, H.a1, H.E - 14, H.E, 262, 293); solid(H.a0, 724, H.E - 14, H.E, -293, -262); solid(924, H.a1, H.E - 14, H.E, -293, -262); solid(H.a0 - 3, -330, H.E - 14, H.E, -290, 290);
  solid(H.a0, H.a1, H.E - 16, H.E - 6, 293, 301); solid(H.a0, 724, H.E - 16, H.E - 6, -302.6, -293);   // (the front gutter, the back one: you can walk along in them; the back one a touch deeper than drawn, so climbing up the downpipe under it you reach round its lip)
  solid(G.x0, G.x1, G.E - 14, G.E, G.z1, G.z1 + 3); solid(G.x0, G.x1, G.E - 14, G.E, G.z0 - 3, G.z0);
  solid(G.x0, G.x1, G.E - 16, G.E - 6, G.z1 + 3, G.z1 + 11); solid(G.x0, G.x1, G.E - 16, G.E - 6, G.z0 - 11, G.z0 - 3);
  // the chimney (brick: a good climb), its cap and pots
  solid(-210, -150, 540, H.R + 80, -70, -20); solid(-216, -144, H.R + 80, H.R + 88, -76, -14);
  for (const x of [-196, -166]) cols.push({ t: 'c', x, z: -45, r: 6, y0: H.R + 88, y1: H.R + 100 });
  // an old TV aerial strapped to the chimney: a mast and its rods (the bat likes it)
  { const mx = -180, mz = -24; cyl(mx, mz, 1.3, H.R + 40, H.R + 196, M.dark, { seg: 10 }); for (const [y, w] of [[H.R + 150, 70], [H.R + 168, 54], [H.R + 186, 38]]) { const r = mesh(new THREE.CylinderGeometry(.7, .7, w, 8), M.dark, mx, y, mz); r.rotation.z = Math.PI / 2; cols.push({ t: 'b', x0: mx - w / 2, x1: mx + w / 2, y0: y - .7, y1: y + .7, z0: mz - .7, z1: mz + .7, noRay: true }); }
    for (const y of [H.R + 52, H.R + 72]) box(-151, -148, y, y + 5, -30, -18, M.dark); }
  // the upper east wall over the garage roof, its two window sills (ledges) and the ivy trellis between them
  // (with the ceiling duct's way through it, over the garage attic's floor: z 104…136 up to 300)
  solid(912, 921, 255, H.W, -262, 104); solid(912, 921, 255, H.W, 136, 262); solid(912, 921, 300, H.W, 104, 136); for (const z of [-120, 120]) solid(921, 924, 426, 430, z - 48, z + 48);
  buildTrellis(M);
  // the house's roof vent, and the garage's
  buildRoofVent(M, RF_VENT, rfHip, true); buildRoofVent(M, RF_GVENT, rfGab, false);
  buildAttic(M);
  buildGarageAttic(M);
  buildSunsetSky(); buildSkyline();
  // ---- light: the low sun, a lavender sky over warm ground ----
  RF.hemi = new THREE.HemisphereLight(0x9a90c8, 0x6a4436, 1.45); LV.add(RF.hemi);
  const tgt = V3(420, 560, 0); RF.sun = spotL(0xffb070, 24000000, tgt.clone().addScaledVector(SUNSET, 2600), tgt, .44, .5, 2048, 1700, 3700); RF.sun.userData.prio = 1;
  buildNest(M); buildBird(M);
  flushDeco();
  // everything up here has the colliders it was given (rafters overhead, the moving lid, cord and bird must not be made solid)
  for (const ch of LV.children) ch.userData.noSolid = true;
}
// the ivy trellis: a white lattice on stand-offs, thick with leaves, between the two windows — its foot just over the
// garage roof's ridge (where the ridge meets the wall), so none of it pokes down into the garage attic
function buildTrellis(M) {
  const x0 = 921, x1 = 927, y0 = 418, y1 = 522, z0 = RFG.zm - 40, z1 = RFG.zm + 40;
  cols.push({ t: 'b', x0, x1, y0, y1, z0, z1, grip: true });
  for (let z = z0; z <= z1; z += 10) rfDeco(rfBoxG(1.6, y1 - y0, 1.6, 0, 0, 926, (y0 + y1) / 2, z), M.white);
  for (let y = y0 + 6; y < y1; y += 12) rfDeco(rfBoxG(1.4, 1.4, z1 - z0, 0, 0, 925.4, y, (z0 + z1) / 2), M.white);
  for (const y of [y0 + 20, y1 - 20]) rfDeco(rfBoxG(5, 2, 2, 0, 0, 923.5, y, RFG.zm), M.white);
  // leaves: crossed cards scattered over it, thicker at the bottom
  const lg = new THREE.PlaneGeometry(9, 9), N = 180, im = new THREE.InstancedMesh(lg, M.leaf, N), o = new THREE.Object3D();
  for (let i = 0; i < N; i++) { const t = Math.pow(rnd(), 1.4); o.position.set(927 + R(-.5, 2.5), y0 + 4 + (1 - t) * (y1 - y0 - 10), R(z0 - 4, z1 + 4)); o.rotation.set(R(-.6, .6), Math.PI / 2 + R(-.7, .7), R(0, 6.28)); o.scale.setScalar(R(.7, 1.3)); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
  im.castShadow = true; im.receiveShadow = true; LV.add(im);
}
// a box roof vent: a sheet-metal curb round a hole in the roof, a hood on short legs with louvred sides.
// You come and go between the curb's top and the hood (a 10 cm gap)
function buildRoofVent(M, V, topF, house) {
  const yB = Math.min(topF((V.x0 + V.x1) / 2, V.z0), topF((V.x0 + V.x1) / 2, V.z1)) - 18, yT = V.top, hy = yT + 10;
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
  polyHole([A(H.a1, H.E - th, H.b0), A(H.a0, H.E - th, H.b0), A(H.r0, H.R - th, 0), A(H.r1, H.R - th, 0)], [RF_VENT.x0, RF_VENT.x1, RF_VENT.z0, RF_VENT.z1], M.ply, V3(1, 0, 0), V3(0, .438, .899), 120, LV).castShadow = false;
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
  // Dad's boxes: two under the vent make a way up to it (the big one, the smaller one on top — inside the vent's
  // collar, a little lower than its bottom edge's far side: climb it from the near side, then up the collar's inside)
  const cbox = (x0, x1, y0, y1, z0, z1, lab) => { const m = box(x0, x1, y0, y1, z0, z1, M.card, { uv: 40 }); if (lab) { const L = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(30, (x1 - x0) * .7), Math.min(15, (y1 - y0) * .6)), new THREE.MeshStandardMaterial({ map: lab, roughness: .9 })); L.position.set((x0 + x1) / 2, (y0 + y1) / 2, z1 + .1); LV.add(L); } return m; };
  cbox(534, 594, F, F + 20, -178, -126, M.label('實驗筆記', '2019 – 2022')); cbox(549.8, 578.2, F + 20, F + 33, -158.2, -145, M.label('舊零件'));
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
// the garage attic: the underside of its roof on rafters, pink insulation between the joists and a boarded walkway,
// a bare bulb somebody left on, the round louvred vent in the gable (the sky through its slats), the duct's end peeled
// open — and under the roof vent a crate and a column of junk with a shelf board on top: up those, up the inside of
// the vent's collar, and out under its hood onto the garage roof
function buildGarageAttic(M) {
  const G = RFG, p = RF.p, th = G.th, F = 280, A = (x, y, z) => V3(x, y, z), V = RF_GVENT;
  polyHole([A(G.x0, G.E - th, G.z1), A(G.x1, G.E - th, G.z1), A(G.x1, G.R - th, G.zm), A(G.x0, G.R - th, G.zm)], [V.x0, V.x1, V.z0, V.z1], M.ply, V3(1, 0, 0), V3(0, .438, -.899), 120, LV).castShadow = false;
  polyMesh([A(G.x1, G.E - th, G.z0), A(G.x0, G.E - th, G.z0), A(G.x0, G.R - th, G.zm), A(G.x1, G.R - th, G.zm)], M.ply, V3(1, 0, 0), V3(0, .438, .899), 120, LV).castShadow = false;
  // the inside of the gable end, with the round vent cut through it (a lined hole: the slats and the sky beyond)
  { const sh = new THREE.Shape([new THREE.Vector2(-270, 270), new THREE.Vector2(312, 270), new THREE.Vector2(G.zm, G.R - th)]);
    const h = new THREE.Path(); h.absarc(G.zm, 352, 21.5, 0, Math.PI * 2, true); sh.holes.push(h);
    const g = new THREE.ShapeGeometry(sh, 28), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 120, uv.getY(i) / 120);
    const m = new THREE.Mesh(g, M.plyF); m.rotation.y = -Math.PI / 2; m.position.x = 1458; m.receiveShadow = true; LV.add(m);
    const lin = new THREE.Mesh(new THREE.CylinderGeometry(21.5, 21.5, 2.6, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xb8956a, roughness: .9, side: THREE.DoubleSide })); lin.rotation.z = Math.PI / 2; lin.position.set(1459.3, 352, G.zm); LV.add(lin);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(22.2, 1.4, 8, 36), M.wood); ring.rotation.y = Math.PI / 2; ring.position.set(1457.6, 352, G.zm); LV.add(ring); }
  // rafters down both slopes (none through the vent), the ridge board
  { const dz = (G.R - th - F) / p, L = dz / Math.cos(26 * Math.PI / 180), zc = dz / 2;
    for (let x = 944; x < 1450; x += 40) for (const s of [1, -1]) { if (s > 0 && x > V.x0 - 6 && x < V.x1 + 6) continue;
      const c = V3(x, G.R - th - zc * p, G.zm + s * zc).addScaledVector(V3(0, .899, .438 * s), -4.5); rfDeco(rfBoxG(3, 9, L, s * 26 * Math.PI / 180, 0, c.x, c.y, c.z), M.wood); }
    rfDeco(rfBoxG(1458 - 921, 12, 3, 0, 0, (921 + 1458) / 2, G.R - th - 6, G.zm), M.wood); }
  // joists over the garage ceiling (clear of the grille), pink insulation between them, a walkway of boards
  for (let x = 930; x < 1450; x += 40) { if (x < 952) { deco(x - 1.5, x + 1.5, 279.6, 280.8, -262, 104, M.wood); deco(x - 1.5, x + 1.5, 279.6, 280.8, 136, 304, M.wood); } else deco(x - 1.5, x + 1.5, 279.6, 280.8, -262, 304, M.wood); }
  for (const [x0, x1, z0, z1] of [[921, 1458, -262, 104], [921, 1458, 136, 304], [952, 1458, 104, 136]]) { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) / 70, uv.getY(i) * (z1 - z0) / 70);
    const ins = new THREE.Mesh(g, M.ins); ins.rotation.x = -Math.PI / 2; ins.position.set((x0 + x1) / 2, F + .25, (z0 + z1) / 2); ins.receiveShadow = true; LV.add(ins); }
  for (const [x0, x1, z0, z1] of [[952, 1196, 44, 88], [1196, 1440, 44, 88], [1124, 1168, -170, 44]]) box(x0, x1, F, F + .9, z0, z1, M.plyF, { uv: 60, cast: false });
  // ---- the way up: a crate, then a column of junk right under the vent with an old shelf board across its top ----
  const card = (x0, x1, y0, y1, z0, z1, lab, face = 'z1', o = {}) => { const m = box(x0, x1, y0, y1, z0, z1, M.card, { uv: 40, ...o }); if (lab) { const L = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(30, ((face === 'x1' ? z1 - z0 : x1 - x0)) * .7), Math.min(15, (y1 - y0) * .6)), new THREE.MeshStandardMaterial({ map: lab, roughness: .9 }));
    if (face === 'x1') { L.position.set(x1 + .1, (y0 + y1) / 2, (z0 + z1) / 2); L.rotation.y = Math.PI / 2; } else L.position.set((x0 + x1) / 2, (y0 + y1) / 2, z1 + .1); LV.add(L); } return m; };
  { const crate = new THREE.MeshStandardMaterial({ map: M.wood.map, color: 0xb08a5a, roughness: .85 });
    box(976, 1012, F, F + 24, 100, 140, crate);
    for (const y of [F + 4, F + 12, F + 20]) { deco(1012, 1012.8, y - 2.5, y + 2.5, 100, 140, M.wood); deco(976, 1012, y - 2.5, y + 2.5, 140, 140.8, M.wood); }
    deco(1012, 1013, F, F + 24, 100, 103, M.wood); deco(1012, 1013, F, F + 24, 137, 140, M.wood); }
  // (the column's one collider and its shelf board; the things in it are just drawn)
  cols.push({ t: 'b', x0: 960, x1: 976, y0: F, y1: 340.5, z0: 112, z1: 128 }); box(953.8, 976, 340.5, 342, 111.8, 128.2, M.wood);
  card(960, 976, F, F + 22, 112, 128, M.label('雜物'), 'z1', { col: false });
  { const red = new THREE.MeshStandardMaterial({ color: 0xb8332a, roughness: .45, metalness: .35 }); box(960.6, 975.4, F + 22, F + 38, 112.6, 127.4, red, { col: false });
    box(961, 975, F + 29.6, F + 30.4, 112.4, 127.6, M.dark, { col: false, cast: false }); box(966, 970, F + 38, F + 40, 117, 123, M.dark, { col: false }); }
  { const tin = new THREE.MeshStandardMaterial({ color: 0xd8d4ca, metalness: .55, roughness: .4 }), lab = [0x3a6ea8, 0x4f9a62];
    for (let i = 0; i < 2; i++) { const y0 = F + 40 + i * 10.25; cyl(968, 120, 7, y0, y0 + 10, tin, { col: false, seg: 24 }); cyl(968, 120, 7.08, y0 + 2.5, y0 + 7, new THREE.MeshStandardMaterial({ color: lab[i], roughness: .6 }), { col: false, seg: 24, open: true, cast: false }); } }
  // ---- the rest of the junk: boxes, an old suitcase, paint tins, a rolled-up rug ----
  card(1240, 1300, F, F + 26, -150, -100, M.label('露營用品')); card(1250, 1290, F + 26, F + 44, -146, -106);
  card(1330, 1380, F, F + 22, 140, 186, M.label('車房雜物')); card(1020, 1070, F, F + 20, -60, -20, M.label('舊玩具', '細佬妹'));
  box(1180, 1240, F, F + 12, -112, -72, new THREE.MeshStandardMaterial({ color: 0x6a4a3a, roughness: .6 }), { uv: 30 }); box(1205, 1215, F + 12, F + 14, -96, -88, M.dark);
  { const cols3 = [[1400, 104, 0x3a8a6a], [1414, 112, 0xd8b04a], [1402, 120, 0xb84a3a]];
    for (const [x, z, c] of cols3) { cyl(x, z, 6, F, F + 11, new THREE.MeshStandardMaterial({ color: 0xcfcbc2, metalness: .5, roughness: .45 }), { seg: 20 }); cyl(x, z, 6.06, F + 3, F + 8, new THREE.MeshStandardMaterial({ color: c, roughness: .6 }), { col: false, seg: 20, open: true, cast: false }); } }
  { const r = cyl(0, 0, 8, 0, 110, new THREE.MeshStandardMaterial({ color: 0x5a6e8a, roughness: .95 }), { col: false, seg: 18 }); r.rotation.z = Math.PI / 2; r.position.set(1300, F + 8, 230); cols.push({ t: 'b', x0: 1245, x1: 1355, y0: F, y1: F + 16, z0: 222, z1: 238 }); }
  // ---- light: a bare bulb on a flex from the ridge (left on), the sky through the gable vent ----
  { const bx = 1180, bz = 30, top = G.R - th - Math.abs(bz - G.zm) * p, by = 362;
    cyl(bx, bz, .35, by + 5, top, M.dark, { col: false, seg: 6, cast: false }); cyl(bx, bz, 1.6, by + 2, by + 6, new THREE.MeshStandardMaterial({ color: 0xc8a050, metalness: .7, roughness: .35 }), { col: false, seg: 12 });
    mesh(new THREE.SphereGeometry(2.8, 14, 12), new THREE.MeshStandardMaterial({ color: 0xfff4e0, emissive: 0xffc27a, emissiveIntensity: 3 }), bx, by, bz, { cast: false });
    cyl(bx + 1.2, bz, .15, by - 14, by + 3, M.dark, { col: false, seg: 4, cast: false });
    pointL(0xffc27a, 2100, bx, by - 4, bz); }
  pointL(0x9aa6d8, 320, 1428, 345, G.zm); addBeam(0xc8d0ff, V3(1452, 352, G.zm), V3(1320, 284, G.zm - 10), .26, .035);
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

// ---------- the magpie and its nest ----------
const RF_NEST = V3(-160, 0, -24);   // (y set once the roof is known: it sits on the aerial's lowest rods)
function buildNest(M) {
  const N = RF_NEST; N.y = RFH.R + 150; const y0 = N.y + 1;
  const stick = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: .95 }), stick2 = new THREE.MeshStandardMaterial({ color: 0x7a6044, roughness: .95 });
  // a bowl of twigs: a mat underneath, rings of sticks laid round and round
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(15, 20, 10, 0, 6.28, Math.PI * .55, Math.PI * .45), stick); bowl.scale.set(1, .5, 1); bowl.position.set(N.x, y0 + 7, N.z); bowl.castShadow = true; LV.add(bowl);
  const g = new THREE.CylinderGeometry(.26, .3, 1, 5), N2 = 170, im = new THREE.InstancedMesh(g, stick2, N2), o = new THREE.Object3D();
  // (laid round the rim, woven in and out: mostly along the ring, a few poking out)
  for (let i = 0; i < N2; i++) { const a = i / N2 * Math.PI * 2 * 4 + R(-.2, .2), r = R(10.5, 16.5), h = y0 + R(.3, 7.5), L = R(7, 13), wild = rnd() < .12 ? R(-.9, .9) : R(-.2, .2);
    o.position.set(N.x + Math.cos(a) * r, h, N.z + Math.sin(a) * r); o.rotation.set(R(-.25, .25), Math.PI / 2 - a + wild, Math.PI / 2 + R(-.18, .18)); o.scale.set(1, L, 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
  im.castShadow = true; im.receiveShadow = true; LV.add(im);
  // the treasure: a bottle cap, a ring, a twist of foil
  cyl(N.x - 4, N.z + 3, 2.4, y0 + 1.2, y0 + 2, new THREE.MeshStandardMaterial({ color: 0xc83a30, metalness: .7, roughness: .3 }), { col: false, seg: 20 });
  { const r = new THREE.Mesh(new THREE.TorusGeometry(1.6, .35, 8, 20), new THREE.MeshStandardMaterial({ color: 0xffd060, metalness: 1, roughness: .2 })); r.position.set(N.x + 4, y0 + 1.6, N.z - 2); r.rotation.x = 1.2; LV.add(r); }
  { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 0), new THREE.MeshStandardMaterial({ color: 0xd8dce0, metalness: 1, roughness: .25 })); f.position.set(N.x + 1, y0 + 1.6, N.z + 5); LV.add(f); }
  // colliders: the floor of the bowl, and a rim to climb out over
  cols.push({ t: 'c', x: N.x, z: N.z, r: 13, y0: N.y - 3, y1: y0 + 1 });
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, cx = N.x + Math.cos(a) * 14.5, cz = N.z + Math.sin(a) * 14.5; cols.push({ t: 'b', x0: cx - 3.4, x1: cx + 3.4, y0: y0, y1: y0 + 7, z0: cz - 3.4, z1: cz + 3.4, grip: true }); }
}
function buildBird(M) {
  const g = new THREE.Group(); LV.add(g); g.visible = false;
  const black = new THREE.MeshStandardMaterial({ color: 0x121418, roughness: .38, metalness: .25 }), white = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: .7 });
  const sheen = new THREE.MeshStandardMaterial({ color: 0x163a48, roughness: .3, metalness: .5 }), beakM = new THREE.MeshStandardMaterial({ color: 0x1e1f22, roughness: .5 });
  const P = (geo, mat, x, y, z, parent = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
  const body = P(new THREE.SphereGeometry(1, 20, 14), black, 0, 0, 0); body.scale.set(6.5, 6.5, 11);
  const belly = P(new THREE.SphereGeometry(1, 18, 12), white, 0, -1.6, -.5); belly.scale.set(5.6, 5, 8.4);
  const head = new THREE.Group(); head.position.set(0, 3.2, 10.5); g.add(head);
  P(new THREE.SphereGeometry(4.3, 18, 14), black, 0, 0, 0, head);
  const bk = P(new THREE.ConeGeometry(1.25, 6, 10), beakM, 0, -.4, 6, head); bk.rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) { P(new THREE.SphereGeometry(.85, 10, 8), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: .1 }), s * 2.9, 1, 2.6, head); P(new THREE.SphereGeometry(.25, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }), s * 3.2, 1.4, 3.2, head); }
  const tail = new THREE.Group(); tail.position.set(0, 1, -9); g.add(tail);
  P(new THREE.BoxGeometry(3.4, .6, 22), sheen, 0, 0, -11, tail);
  const wings = []; for (const s of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(s * 4.8, 2, 1.5); g.add(w);
    P(new THREE.BoxGeometry(14, .8, 9), black, s * 7, 0, 0, w);
    P(new THREE.BoxGeometry(7, .9, 6), white, s * 9, .05, .4, w);
    for (let k = 0; k < 4; k++) { const f = P(new THREE.BoxGeometry(12, .5, 2.6), black, s * (18 + k * .6), 0, 3 - k * 2.6, w); f.rotation.y = s * (k * .12); }
    wings.push(w);
  }
  const legs = []; for (const s of [-1, 1]) { const l = P(new THREE.CylinderGeometry(.35, .35, 6, 6), beakM, s * 2, -6.5, 2); legs.push(l); }
  RF.bird = { g, head, tail, wings, legs, on: false, state: 'off', t: 0, st: 0, pos: V3(300, 800, 300), vel: V3(), yaw: 0, roll: 0, held: null, cool: 0, perchT: 0, loopA: 0, said: {} };
}
// a flapping, banking flight toward a point at a given speed (returns the distance left)
function birdFly(B, to, sp, dt, turn = 2.2) {
  const d = V3().subVectors(to, B.pos), dist = d.length(); if (dist < 1e-3) return 0;
  const want = d.multiplyScalar(Math.min(sp, dist / Math.max(dt, 1e-3)) / dist); B.vel.lerp(want, 1 - Math.exp(-turn * dt)); B.pos.addScaledVector(B.vel, dt);
  return dist;
}
function birdTick(dt) {
  const B = RF.bird; if (!B) return; const show = B.on && ZONES.roof.near; B.g.visible = show; if (!B.on) return;
  B.t += dt; B.st += dt; B.cool = Math.max(0, B.cool - dt); const H = RFH, N = RF_NEST, perchP = V3(N.x, N.y + 9.5, N.z);
  const L = leader;
  if (B.state === 'circle') {
    // loops over the house, low enough to see everything on the roof; now and then back to the nest for a look round
    B.loopA += dt * .4; const c = V3(300 + Math.sin(B.loopA * .5) * 60, H.R + 95 + Math.sin(B.t * .6) * 14, 0), tgt = V3(c.x + Math.cos(B.loopA) * 470, c.y, c.z + Math.sin(B.loopA) * 250);
    birdFly(B, tgt, 150, dt, 1.4); if (B.st > 24) { B.state = 'home'; B.st = 0; }
  } else if (B.state === 'home') { if (birdFly(B, perchP, 150, dt, 2.5) < 4) { B.state = 'perch'; B.st = 0; B.perchT = 6 + R(0, 3); B.vel.set(0, 0, 0); } }
  else if (B.state === 'perch') { B.pos.lerp(perchP, 1 - Math.exp(-6 * dt)); B.vel.set(0, 0, 0); B.yaw += Math.sin(B.t * .7) * dt * .8; if (B.st > B.perchT) { B.state = 'circle'; B.st = 0; birdCall(); } }
  else if (B.state === 'swoop') {
    // dive at whoever it saw; if they get under something before it arrives, it pulls up
    const tp = V3(L.pos.x, L.pos.y + L.h * .6 + 6.5, L.pos.z), dist = birdFly(B, tp, 270, dt, 5);
    if (coverK(L, B.pos.y) < 1 || L.frozen) { B.state = 'circle'; B.st = 0; B.cool = 4; }
    else if (dist < 7 || B.st > 6) { if (dist < 12) birdGrab(L); else { B.state = 'circle'; B.st = 0; B.cool = 3; } }
  } else if (B.state === 'carry') { if (birdFly(B, perchP.clone().add(V3(0, 6, 0)), 170, dt, 3) < 6) birdDrop(); }
  // facing, banking, flapping
  const hs = Math.hypot(B.vel.x, B.vel.z); if (hs > 5) { const y2 = Math.atan2(B.vel.x, B.vel.z), dy = Math.atan2(Math.sin(y2 - B.yaw), Math.cos(y2 - B.yaw)); B.yaw += dy * Math.min(1, dt * 5); B.roll = damp(B.roll, clamp(-dy * 2.5, -.6, .6), 4, dt); } else B.roll = damp(B.roll, 0, 4, dt);
  const pitch = hs > 5 ? clamp(-B.vel.y / Math.max(hs, 1) * .6, -.7, .7) : 0;
  B.g.position.copy(B.pos); B.g.rotation.set(pitch, B.yaw, B.roll, 'YXZ');
  const flying = B.state !== 'perch', glide = B.state === 'circle' && (B.t % 5) > 2.6, fl = flying && !glide ? Math.sin(B.t * (B.state === 'swoop' ? 9 : B.state === 'carry' ? 16 : 11)) : 0;
  B.wings.forEach((w, i) => { const s = i ? 1 : -1; w.rotation.set(0, flying ? 0 : s * 1.5, flying ? s * (.15 + fl * .75) : s * -.5); w.scale.set(flying ? 1 : .62, 1, flying ? 1 : .6); w.position.y = flying ? 2 : 1.2; });
  B.tail.rotation.x = flying ? -.05 + Math.sin(B.t * 3) * .05 : .35; B.head.rotation.y = B.state === 'perch' ? Math.sin(B.t * 1.3) * .8 : 0;
  for (const l of B.legs) l.visible = !flying || B.state === 'carry' || B.state === 'swoop';
  // the one it's carrying dangles under it
  if (B.held) { const C = B.held; C.pos.copy(B.pos).add(V3(0, -9.5 - C.h * .6, 1.5)); C.vel.set(0, 0, 0); C.grounded = false; C.climbing = false; C.mantle = null; C.state = 'air'; C.crouch = false; if (C.disp) C.disp.copy(C.pos); trail = []; for (const F of party) if (F !== C) F.queue = []; }
}
function birdCall() { for (let i = 0; i < 4; i++) tone(1500 - i * 60, 1100, .05, .03, 'square', i * .09); }
function birdGrab(C) {
  const B = RF.bird; B.held = C; B.state = 'carry'; B.st = 0; meter = 0; birdCall(); SND.swish(); cam.shake = .4;
  toastW(`${C.S.name}俾喜鵲捉咗！`, 2.6); if (!B.said.grab) { B.said.grab = 1; const o = party.find(F => F !== C && !F.frozen); if (o) setTimeout(() => say(o.S.name, `${C.S.name}！……佢擔咗返佢個竇！`, o.S.col, 2.6), 700); }
}
function birdDrop() {
  const B = RF.bird, C = B.held; B.held = null; B.state = 'perch'; B.st = 0; B.perchT = 3.5; B.cool = 9; B.vel.set(0, 0, 0); if (!C) return;
  const N = RF_NEST; C.pos.set(N.x + 3, N.y + 2.4, N.z - 2); C.vel.set(0, 0, 0); C.grounded = false; if (C.disp) C.disp.copy(C.pos);
  // the others hurry over to the foot of the chimney to wait
  const bx = -128, bz = -8; party.forEach((F, i) => { if (F === C || F.frozen) return; F.pos.set(bx + (i % 2) * 5, rfHip(bx, bz + i * 4) + .3, bz + i * 4); F.vel.set(0, 0, 0); F.climbing = false; F.mantle = null; F.queue = []; if (F.disp) F.disp.copy(F.pos); });
  trail = []; C.lastTrail.copy(C.pos); cp = 6; SND.land(.5);
  if (!B.said.drop) { B.said.drop = 1; setTimeout(() => say(C.S.name, '佢個竇……全部都係閃閃嘅嘢。快啲爬出去！', C.S.col, 3.2), 900); setTimeout(() => toast('爬出鳥竇，跳落煙囱頂，再落返屋頂', 3.4), 4200); }
}
// can it see the leader? (looking ahead and down as it flies; all round from the nest)
function birdSees() {
  const B = RF.bird; if (!B || !B.on || !leader || B.held || B.cool > 0 || B.state === 'swoop' || B.state === 'carry' || B.state === 'film') return 0; const L = leader;
  const eye = V3(0, 3.2, 10.5).applyEuler(B.g.rotation).add(B.pos), tp = V3(L.pos.x, L.pos.y + L.h * .5, L.pos.z), d = V3().subVectors(tp, eye), dist = d.length(); d.divideScalar(dist);
  const perched = B.state === 'perch', f = perched ? V3(Math.sin(B.yaw + B.head.rotation.y), -.35, Math.cos(B.yaw + B.head.rotation.y)).normalize() : V3(Math.sin(B.yaw), -.9, Math.cos(B.yaw)).normalize();
  const fc = perched ? .45 : .3, c = d.dot(f); if (c < fc || dist > (perched ? 420 : 650)) return 0;
  if (rayBlocked(eye, d, dist - 1.5, false)) return 0;
  return clamp(1.25 - dist / 650, .25, 1) * sstep(fc, 1, c) * coverK(L, eye.y);
}

// ---------- per frame (runs everywhere, after the other places' world ticks) ----------
function roofTick(dt) {
  if (!ZONES.roof) return; if (!RF.inited) { RF.inited = true; rfHatch(RF.open); } const on = RF_ON();
  if (RF.skyG) { RF.skyG.visible = on; if (on) RF.skyG.position.copy(camera.position); }
  for (const m of RF.rings) m.visible = on;
  if (on && ST.sky) ST.sky.visible = false;
  const far = on ? 3700 : 2400; if (camera.far !== far) { camera.far = far; camera.updateProjectionMatrix(); }
  // under the roof (in the attic): dim and warm; out on top: the evening sky
  const cp = camera.position, inA = on && ((cp.x > -330 && cp.x < 912 && Math.abs(cp.z) < 262 && cp.y < rfHip(cp.x, cp.z) - RFH.th - 1) || gAttic(cp) && cp.y < rfGab(cp.x, cp.z) - RFG.th - 1) ? 1 : 0;
  RF.attic = damp(RF.attic, inA, 4, dt); const D = LEVELS.roof, k = RF.attic;
  if (RF.hemi) RF.hemi.intensity = lerp(1.45, .32, k); D.envI = lerp(.85, .25, k); D.expo = lerp(.98, 1.55, k); D.fog[1] = lerp(.00016, .0006, k);
  // up the cord to the hatch: pull yourself over its edge onto the attic floor beside it
  if (RF.open) for (const C of party) if (C.climbing && C.climbC === RF.cord && C.pos.y > 545 && !C.mantle) { C.climbing = false; C.mantle = { from: C.pos.clone(), to: V3(clamp(C.pos.x - 8, 806, 846), RFH.W, RF_HATCH.z0 - 5), t: 0, dur: .55 }; C.yaw = Math.PI; }
  birdTick(dt);
}

// ---------- chapter one, on top of the house ----------
const RQ = [
  { t: '穿過閣樓，去有光嘅地方', s: '屋頂通風口透入夕陽。爬上爸爸啲舊紙箱，就夠得着通風口嘅鐵框' },
  { t: '由通風口爬出屋頂', s: '爬上鐵框頂，喺罩下面嘅空隙鑽出去' },
  { t: '上屋脊', s: '沿住瓦面向上行。屋脊最高，望得最遠' },
  { t: '避開喜鵲，去屋頂東邊', s: '喜鵲喺屋頂上空兜圈。俾佢見到太耐，佢會衝落嚟捉你返佢喺天線頂嘅竇。等佢飛遠或者返竇先郁；佢衝落嚟就躲入通風口個罩底' },
  { t: '落去車房屋頂', s: '屋頂東邊下面就係車房屋頂。跳落去，或者沿長春藤架爬落去' },
  { t: '由車房屋頂嘅通風口入車房', s: '爬上通風口嘅鐵框，跳入去。車房閣樓有條舊風槽，風槽底嘅鐵網通落車房' }
];
const rfOut = (C) => { const t = rfTopAt(C.pos.x, C.pos.z); return t > -1e8 && C.pos.y >= t - .6 && !rfIn(C.pos.x, C.pos.z, RF_VENT, 7) && !rfIn(C.pos.x, C.pos.z, RF_GVENT, 7); };
LEVELS.roof = {
  chapter: '第一章', title: '屋企', room: '閣樓', house: true, env: 'dusk', envI: .85, fog: [0xc8805e, .00016], expo: .98, bloom: [.34, 1.7],
  dust: { N: 900, box: [300, 900, 552, 660, -230, 230], beamFrac: .5, door: false },
  toys: true, npcNear: false, build: buildRoof,
  cps: [[820, 552, 30], [564, 585.5, -151], [560, 651, -60], [300, RFH.R + 3.5, 0], [880, 568, 0], [1100, 393, 60], [-128, 670, -8]],
  quests: RQ,
  // started from the chapter list: the crew has just climbed up through her ceiling into the attic
  spawn() {
    spawnSP(this.cps[0], .96, 5); rfHatch(true); RF.bird.on = false; RF.bird.state = 'off'; RF.bird.held = null; RF.said = {};
    KS.coreGot = true; KS.carried = false; KS.coreDrop = null; KS.home = true; KS.ch2 = true; KS.ch3 = true; LIV.remoteGot = true;
    if (KS.core) KS.core.position.set(-306, 1.6, -100);
    ZONES.kitchen.save = { qs: SP_Q2B, q: 1, cp: 6, lvT: 0 };
  },
  enter(prev, again) {
    rfHatch(true); if (again || NET.on) return;
    RF.bird.on = false; RF.bird.state = 'off'; RF.bird.held = null; RF.said = {}; RF.via = prev === 'garage' ? 'g' : '';
    // (up from the garage: the way out is the garage roof's vent; fall off, and you're back on the garage roof)
    if (RF.via) { setQuest(1); cp = 5; setTimeout(() => { if (STATE === 'play' && LEVEL === 'roof') say('爸爸', '車房閣樓……通風口嗰度有光。爬上去就出到屋頂。', '#f5f0e6', 3.2); }, 500); }
    if (prev === 'garden') cp = 2;   // (up the downpipe from the lean-to: already outside, on the roof)
    if (prev === 'kitchen') { setTimeout(() => say('爸爸', '閣樓……我啲舊嘢都擺喺度。', '#f5f0e6', 3), 900); setTimeout(() => say('爸爸', '通風口嗰邊有光——由嗰度出得去屋頂。', '#f5f0e6', 3.4), 4400); }
  },
  keep(id) { return id === 'yard' || id === 'road'; },   // falling off over the yard or the street doesn't start the next chapter: you're put back on the roof (off into the garden, you're in the garden: the downpipe from the lean-to climbs back up)
  detect: detectRoof,
  update(dt) {
    lvT += dt; const L = leader; if (NET.on || STATE !== 'play') return;
    if (quest === 0 && L.grounded && L.pos.y > 580 && rfIn(L.pos.x, L.pos.z, RF_VENT, 10)) { setQuest(1); toast('爬上鐵框頂，喺罩下面鑽出去'); }
    if (quest <= 1 && RF.via && L.grounded && rfOut(L) && L.pos.x > 925) { setQuest(2); roomBanner('屋頂'); setTimeout(() => say('爸爸', '出到嚟喇！沿長春藤架爬上大屋屋頂，上屋脊睇吓。', '#f5f0e6', 3.2), 600); }
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
    const L = leader; if (RF.via && quest <= 1) return V3(968, RF_GVENT.top + 2, 120); if (quest === 0) return V3(564, 586, -150); if (quest === 1) return V3(564, 624, -150);
    if (quest === 2) return V3(clamp(L.pos.x, RFH.r0 + 30, RFH.r1 - 30), RFH.R + 4, 0);
    if (quest === 3) return V3(820, rfHip(820, 0) + 3, 0); if (quest === 4) return V3(1060, rfGab(1060, 40) + 3, 40);
    return V3(968, RF_GVENT.top + 2, 120);
  },
  reset() { const B = RF.bird; if (B && B.on) { B.held = null; B.state = 'circle'; B.cool = 4; } },
  eyeText: () => { const B = RF.bird; if (!B || !B.on) return ''; if (B.state === 'swoop') return '佢衝落嚟喇！躲入通風口個罩底！'; if (B.held) return '俾喜鵲擔走緊……'; return meter > .3 ? '喜鵲望緊你！快啲躲' : B.state === 'perch' ? '喜鵲喺佢個竇度四圍望' : '喜鵲喺上面兜圈——唔好俾佢見到'; },
  hint(L) { if ((quest === 4 || quest === 2 && RF.via) && Math.abs(L.pos.x - 924) < 30 && Math.abs(L.pos.z - RFG.zm) < 50) return '長春藤架可以爬上爬落'; if (L.pos.z < -290 && L.pos.y > 520 && L.pos.y < 536 && L.pos.x < 724) return '喺坑渠度跳落去就係屋後嘅斜屋頂——條去水管可以爬返上嚟'; return ''; },
  onSwitch() { }
};
function rfPutBack() {
  const p = CPS[cp] || CPS[0]; party.forEach((C, i) => { if (C.frozen) return; C.pos.set(p[0] + (i % 3 - 1) * 4, p[1], p[2] + Math.floor(i / 3) * 4); C.vel.set(0, 0, 0); C.climbing = false; C.mantle = null; C.tumble = 0; C.queue = []; if (C.disp) C.disp.copy(C.pos); });
  trail = []; leader.lastTrail.copy(leader.pos); cam.tgt.set(leader.pos.x, leader.pos.y + leader.h * .8, leader.pos.z);
}
function detectRoof(dt) {
  if (STATE !== 'play') return; if (window.__NODET) { meter = 0; return; } const B = RF.bird;
  const L = leader; if (L.frozen || !mine(L) || !B || !B.on || B.held) { meter = Math.max(0, meter - dt * .5); KS.watch = null; return; }
  const s = birdSees();
  if (s > 0) { meter += s * (L.crouch ? .6 : 1) * (L.spd > 1.5 ? 1.15 : .7) * hideK(L) * .55 * dt; KS.watch = { p: B.pos.clone(), s, who: 'bird' }; }
  else { meter -= dt * .3; KS.watch = null; }
  meter = clamp(meter, 0, 1);
  // seen for long enough: it folds its wings and dives
  if (meter >= 1 && B.state !== 'swoop') { B.state = 'swoop'; B.st = 0; birdCall(); toast('喜鵲衝落嚟喇！', 1.6); }
}
// the sunset on the ridge: everyone sits down for a moment, then a magpie comes in and lands on its nest on the aerial
function rfSeat(x0) {
  const ids = party.filter(C => !C.frozen); RF.rx = x0;
  ids.forEach((C, i) => { const x = x0 + (i - (ids.length - 1) / 2) * 7.5; C.pos.set(x, RFH.R + 3.5, 0); if (C.disp) C.disp.copy(C.pos); C.yaw = .15 - (i - ids.length / 2) * .04; C.state = 'sit'; C.spd = 0; C.vel.set(0, 0, 0); C.climbing = false; C.mantle = null; C.wave = false; C.root.visible = true; C.look = 0; });
}
const FILM_RIDGE = { id: 'ridge', len: 17.5, mus: .55,
  begin() { rfSeat(clamp(leader.pos.x, RFH.r0 + 60, RFH.r1 - 60)); const B = RF.bird; B.on = false; B.state = 'off'; B.held = null; B.t = 0; },
  end() {
    const B = RF.bird; party.forEach(C => { if (C.state === 'sit') C.state = 'idle'; C.grounded = true; C.queue = []; }); trail = []; leader.lastTrail.copy(leader.pos);
    B.on = true; B.state = 'perch'; B.st = 0; B.perchT = 4; B.cool = 4; B.pos.set(RF_NEST.x, RF_NEST.y + 9.5, RF_NEST.z); B.vel.set(0, 0, 0); setQuest(3); cp = 3;
    setTimeout(() => { if (STATE === 'play') say('爸爸', '佢飛走或者返竇嗰陣先郁。俾佢見到，就躲入通風口個罩底！', '#f5f0e6', 3.8); }, 600);
  },
  shots: [
    // behind them, rising slowly: their backs on the ridge, the street, the park and the towers, the sun going down
    { t0: 0, fov: 42, set() { }, run(u) { rfSitTick(u); const k = sstep(0, 6.5, u), c = V3(RF.rx, RFH.R + 3.5, 0); return [V3(c.x + 22 - k * 8, c.y + 7 + k * 5, c.z - 36 + k * 6), V3(c.x - 40, c.y - 12, c.z + 200), c]; } },
    // side-on, close: their faces in the last of the sun
    { t0: 6.5, fov: 30, set() { }, run(u) { rfSitTick(u + 6.5); const c = V3(RF.rx, RFH.R + 3.5, 0); return [V3(c.x - 30 + u * 1.5, c.y + 4.2, c.z + 13), V3(c.x + 6, c.y + 3.2, c.z), c]; } },
    // a big black-and-white bird sweeps in over their heads and lands on the old aerial — on a nest full of shiny things
    { t0: 11.5, fov: 40, set() { const B = RF.bird; B.on = true; B.state = 'film'; B.pos.set(RF.rx + 260, RFH.R + 160, 260); B.vel.set(-120, 0, -100); B.t = 0; },
      run(u, dt) { rfSitTick(u + 11.5); const B = RF.bird, N = V3(RF_NEST.x, RF_NEST.y + 9.5, RF_NEST.z); const k = clamp(u / 4.2, 0, 1), mid = V3(RF.rx - 40, RFH.R + 40, 40);
        const p = k < .5 ? V3().lerpVectors(V3(RF.rx + 260, RFH.R + 160, 260), mid, k * 2) : V3().lerpVectors(mid, N, (k - .5) * 2); B.vel.subVectors(p, B.pos).divideScalar(Math.max(dt, 1e-3)); B.pos.copy(p); if (k >= 1) { B.state = 'perch'; B.vel.set(0, 0, 0); }
        const c = V3(RF.rx, RFH.R + 3.5, 0); return [V3(c.x + 10, c.y + 7, c.z + 26), V3().lerpVectors(B.pos, N, .3), c]; } }
  ],
  ev: [[1, () => cineSay('爸爸', '……好耐冇咁樣睇過日落。', '#f5f0e6', 3)], [4.2, () => cineSay('助手', '教授，嗰邊就係市中心？', '#e8c9a8', 2.6)], [7, () => cineSay('爸爸', '嗯。Origin Dynamics 嘅大樓就喺嗰度。', '#f5f0e6', 2.8)],
    [9.8, () => cineSay('老友', '咁我哋早晚都要去一轉。', '#d9a675', 2.4)], [12, () => { birdCall(); cineSay('小彩', '……上面！好大隻雀！', '#9fd86b', 2); }], [14.6, () => cineSay('爸爸', '喜鵲……佢最鍾意擔閃閃嘅嘢返竇。唔好俾佢見到！', '#f5f0e6', 3)]]
};
// little movements while they sit: heads turning, a kick of the legs, someone points
function rfSitTick(t) {
  party.forEach((C, i) => { if (C.frozen) return; C.state = 'sit'; C.grounded = true; const ph = i * 1.7; C.look = Math.sin(t * .5 + ph) > .7 ? Math.sin(ph * 3) * .6 : 0; C.sitKick = Math.sin(t * 1.3 + ph) * .12; });
  if (t > 12) party.forEach(C => { C.look = damp(C.look || 0, .5, 3, 1 / 60); });
  const D = chars.dad; if (D && party.includes(D)) D.wave = t > 7 && t < 9.5;
}
function startRoof() { return startChapter('roof', { chapter: '第一章', title: '屋企', after() { setTimeout(() => roomBanner('閣樓'), 900); } }); }
