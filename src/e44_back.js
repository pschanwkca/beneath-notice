// =====================================================================
//  屋後：地庫門外嘅平台、屋後走廊、儲物房、洗衣間、晾衫繩
//  Behind the house. The basement door opens onto a landing; four big steps up is the back hallway.
//  Off the hallway: the storeroom (quiet, nobody looks in — supplies that come back), with a mouse-size
//  hole under the kitchen counter; at the far end the utility room, with a doorway into the living room.
//  A clothesline runs the length of the hallway: climb the shoe cabinet, grab a hanger, slide.
// =====================================================================
const BK = {
  A: V3(-40, 182, -600), B: V3(606, 86, -600), len: 0, dir: V3(), s0: 5,
  hangers: [], used: false, doorSegs: [], doorFixed: false, shut: false, said: {}, store: [], storeT: 0,
  peekBox: [-60, 260, -10, 210, -624, -500]
};
BK.len = BK.A.distanceTo(BK.B); BK.dir.subVectors(BK.B, BK.A).normalize();
const STORE = { x0: -157, x1: 138, z0: -500, z1: -232 };
const LINE_V = 95;   // top speed on the line
function inStore(p) { return p.x > STORE.x0 && p.x < STORE.x1 && p.z > STORE.z0 && p.z < STORE.z1 && p.y > -5 && p.y < 258; }
function linePt(s) { return BK.A.clone().addScaledVector(BK.dir, clamp(s, 0, BK.len)); }

// ---------- building (runs with the kitchen) ----------
function hangerMesh(col) {
  const g = new THREE.Group(), m = new THREE.MeshPhysicalMaterial({ color: col, roughness: .35, clearcoat: .7 });
  const hook = new THREE.Mesh(new THREE.TorusGeometry(1.5, .28, 8, 18, Math.PI * 1.35), MAT.steel); hook.rotation.set(0, Math.PI / 2, Math.PI * .82); hook.position.y = -.9; g.add(hook);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, 2.6, 8), MAT.steel); neck.position.y = -3.3; g.add(neck);
  const bar = (a, b) => { const d = V3().subVectors(b, a), c = new THREE.Mesh(new THREE.CapsuleGeometry(.55, d.length(), 4, 10), m); c.position.copy(a).add(b).multiplyScalar(.5); c.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); g.add(c); };
  const top = V3(0, -4.6, 0), l = V3(-6.5, -11.5, 0), r = V3(6.5, -11.5, 0);
  bar(top, l); bar(top, r); bar(l, r);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.noSolid = true; } });
  return g;
}
const utilF0 = () => new THREE.MeshStandardMaterial({ color: 0x8a8478, roughness: .9 });
function buildBackHall(K) {
  const W = MAT.white;
  const wallM = new THREE.MeshStandardMaterial({ color: 0xdcd3c2, roughness: .95, map: K.wall.map || null });
  const hallF = new THREE.MeshStandardMaterial({ color: 0x9c7a58, roughness: .75, map: K.floor.map || null });
  const storeF = new THREE.MeshStandardMaterial({ color: 0x8e877b, roughness: 1 });
  const utilF = new THREE.MeshStandardMaterial({ color: 0xc9c4b8, roughness: .6, map: K.tiles.map || null });
  const ceilM = K.ceil, steelM = MAT.steel;
  const cloth = c => new THREE.MeshStandardMaterial({ color: c, roughness: 1 });
  const nc = { col: false }, ncs = { col: false, cast: false };

  // ================= the landing outside the basement door, and four big steps up =================
  box(-282, -170, -86, -76, -612, -491, MAT.stair, { uv: 60, cast: false });
  const rise = 19, run = 25;
  for (let i = 0; i < 4; i++) { const x0 = -170 + i * run, top = -76 + (i + 1) * rise; box(x0, x0 + run, -86, top, -612, -512, MAT.stair, { uv: 60 });
    box(x0 - .4, x0 + 1.2, top - 1.2, top + .3, -612, -512, W, nc); }                       // white nosing
  box(-294, 650, -86, 270, -624, -612, wallM, { uv: 120 }); box(730, 748, 0, 270, -624, -612, wallM, { uv: 120 }); box(650, 730, 205, 270, -624, -612, wallM, { uv: 120 });   // the long back wall (the back door at x 650–730)
  box(650, 730, -10, 0, -624, -612, utilF0(), { cast: false });
  box(-294, -282, -86, 270, -612, -479, wallM, { uv: 120 });                                 // west end of the landing
  box(-294, -157, 134, 270, -491, -479, wallM, { uv: 120 });                                 // over the stairwell's top
  box(-170, -157, -86, 270, -512, -479, wallM, { uv: 120 });                                 // beside the steps
  // the stairwell's door wall seen from out here: plaster, a white door frame
  box(-282, -262, -76, 134, -492.4, -491, wallM, ncs); box(-187, -170, -76, 134, -492.4, -491, wallM, ncs); box(-262, -187, 122, 134, -492.4, -491, wallM, ncs);
  box(-266, -262, -76, 122, -494, -491, W, nc); box(-187, -183, -76, 122, -494, -491, W, nc); box(-266, -183, 118.5, 122, -494, -491, W, nc);
  // the basement door's colliders follow the door (see backDoorTick)
  for (let i = 0; i < 5; i++) { const c = { t: 'b', x0: -262 + i * 15, x1: -262 + (i + 1) * 15, y0: -76, y1: 118, z0: -481.5, z1: -478.5, door: true }; cols.push(c); BK.doorSegs.push(c); }

  // ================= the back hallway =================
  box(-70, 472, -10, 0, -612, -500, hallF, { uv: 140, cast: false });
  box(-170, -40, -86, 266, -512, -500, wallM, { uv: 120 }); box(40, 472, 0, 266, -512, -500, wallM, { uv: 120 }); box(-40, 40, 205, 266, -512, -500, wallM, { uv: 120 });
  box(-294, 748, 260, 270, -624, -500, ceilM, { cast: false });
  box(-70, 472, 0, 9, -611.9, -610.4, W, nc); box(-70, -40, 0, 9, -513.5, -512, W, nc); box(40, 472, 0, 9, -513.5, -512, W, nc);   // skirting
  for (const [x0, x1] of [[-44, -40], [40, 44]]) box(x0, x1, 0, 209, -515, -497, W, nc); box(-44, 44, 205, 209, -515, -497, W, nc);   // storeroom door frame
  // a runner rug, a dome light or two
  box(60, 430, 0, .25, -590, -540, new THREE.MeshStandardMaterial({ color: 0x7a3e34, roughness: 1 }), ncs);
  for (const x of [-220, 110, 390]) { mesh(new THREE.SphereGeometry(13, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xfff1da, emissive: 0xffd9a0, emissiveIntensity: .9 }), x, 260, -562, { cast: false }).rotation.x = Math.PI; }
  pointL(0xffd2a0, 1150, 110, 236, -562);
  // the landing is double height: a wall lamp lower down so its floor isn't in the dark
  { const sc = mesh(new THREE.SphereGeometry(7, 18, 10, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xfff1da, emissive: 0xffd9a0, emissiveIntensity: 1.1 }), -282, 96, -552, { cast: false }); sc.rotation.y = Math.PI / 2; sc.userData.noSolid = true;
    pointL(0xffd2a0, 1100, -272, 92, -552); } pointL(0xffd2a0, 1100, 390, 236, -562);
  // ---- the climb to the clothesline: newspapers → shoe cabinet → shoe boxes → tissue box ----
  const cab = new THREE.MeshStandardMaterial({ color: 0xe6dccb, roughness: .55 });
  box(-64, -4, 0, 90, -612, -578, cab, { uv: 60 }); box(-66, -2, 90, 93, -613, -576, new THREE.MeshStandardMaterial({ color: 0x8a6446, roughness: .5 }));
  for (const x of [-62, -34]) { box(x, x + 26, 6, 86, -578, -577.3, cab, nc); box(x + 11, x + 15, 60, 62, -577.3, -575.6, K.brass, nc); }
  box(-2, 30, 0, 34, -610, -584, new THREE.MeshStandardMaterial({ color: 0xdedad0, roughness: .95 }));             // a pile of newspapers
  for (let y = 4; y < 34; y += 6) box(-2.3, 30.3, y, y + .6, -610.3, -583.7, new THREE.MeshStandardMaterial({ color: 0xb9b4a8, roughness: 1 }), ncs);
  box(-60, -22, 93, 123, -610, -582, new THREE.MeshStandardMaterial({ color: 0xc9563c, roughness: .8 }));            // shoe boxes
  box(-61, -21, 119, 123.6, -610.6, -581.4, new THREE.MeshStandardMaterial({ color: 0xb04a32, roughness: .8 }), nc);
  box(-56, -30, 123.6, 141, -609, -588, new THREE.MeshStandardMaterial({ color: 0x2f5f8a, roughness: .8 }));
  box(-52, -36, 141, 159, -608, -592, new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: .9 }));            // tissue box on top
  { const t = mesh(new THREE.SphereGeometry(3, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), -44, 159.6, -600, { cast: false }); t.scale.set(1, .7, .6); t.userData.noSolid = true; }
  // coat hooks on the other wall, a canvas tote bag hanging off one
  for (const x of [164, 190, 216]) { box(x - 1.5, x + 1.5, 168, 172, -517, -512, K.brass, nc); }
  { const bag = box(176, 204, 118, 150, -519, -512.5, cloth(0xd9c9a3), nc); bag.userData.noSolid = true;
    box(184, 196, 128, 140, -519.3, -519, cloth(0x2f6a5a), ncs);
    const h = mesh(new THREE.TorusGeometry(8, .7, 6, 20, Math.PI), cloth(0xb8a882), 190, 150, -516); h.userData.noSolid = true; }
  // ---- the clothesline: brackets on the wall, a taut cord, plastic hangers ----
  for (const P of [BK.A, BK.B]) { box(P.x - 1.5, P.x + 1.5, P.y - 1.5, P.y + 1.5, -612, -599, steelM, nc); box(P.x - 3, P.x + 3, P.y - 3, P.y + 3, -612, -611, steelM, nc); }
  { const d = BK.B.clone().sub(BK.A), c = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, d.length(), 8), new THREE.MeshStandardMaterial({ color: 0xece6d8, roughness: .8 }));
    c.position.copy(BK.A).add(BK.B).multiplyScalar(.5); c.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); c.castShadow = true; c.userData.noSolid = true; LV.add(c); }
  for (const col of [0x8fc8ea, 0xf4a6c0, 0xf2d26a, 0x9ed69a, 0x8fc8ea, 0xf4a6c0, 0xf2d26a, 0x9ed69a]) { const h = hangerMesh(col); h.visible = false; LV.add(h); BK.hangers.push(h); }
  // a couple of things along the way
  cyl(92, -598, 9, 0, 46, new THREE.MeshStandardMaterial({ color: 0x4a5560, roughness: .5, metalness: .4 }), { open: false });   // umbrella stand
  for (const [dx, c] of [[-3, 0x23384f], [3.5, 0x7a1f2c]]) { const u = mesh(new THREE.CylinderGeometry(1.2, 2.6, 88, 10), new THREE.MeshStandardMaterial({ color: c, roughness: .7 }), 92 + dx, 52, -598); u.rotation.z = dx * .03; u.userData.noSolid = true;
    const hd = mesh(new THREE.TorusGeometry(3, .9, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: .5 }), 92 + dx, 97, -598); hd.userData.noSolid = true; }
  { const vg = new THREE.MeshPhysicalMaterial({ color: 0xc8343c, roughness: .35, clearcoat: .6 });   // a vacuum cleaner by the wall
    const v = mesh(new THREE.CapsuleGeometry(11, 20, 6, 16), vg, 270, 12, -526); v.rotation.z = Math.PI / 2;
    for (const x of [258, 282]) cyl(x, -526, 5, 0, 4, MAT.black, { col: false });
    tubeM([[250, 14, -526], [236, 30, -530], [226, 60, -534], [224, 100, -534]], 2.2, new THREE.MeshStandardMaterial({ color: 0x3a3a3c, roughness: .6 }), 30); }
  box(400, 440, 0, 22, -610, -584, new THREE.MeshStandardMaterial({ color: 0xd6cfbf, roughness: 1 }));              // bundled newspapers
  box(399.5, 440.5, 10, 11.2, -610.5, -583.5, new THREE.MeshStandardMaterial({ color: 0x9a7a50, roughness: 1 }), nc);

  // ================= the utility room (washing machine, back door, the basket under the line) =================
  box(472, 736, -10, 0, -612, -244, utilF, { uv: 80, cast: false });
  box(460, 472, 0, 270, -500, -482, wallM, { uv: 120 }); box(736, 748, 0, 270, -624, -510, wallM, { uv: 120 });
  box(472, 736, 260, 270, -500, -244, ceilM, { cast: false });
  box(472, 646, 0, 9, -611.9, -610.4, W, nc); box(734, 736, 0, 9, -611.9, -610.4, W, nc);
  pointL(0xfff0dc, 1300, 600, 238, -430);
  mesh(new THREE.CylinderGeometry(14, 14, 3, 28), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0dc, emissiveIntensity: 1 }), 600, 258.5, -430, { cast: false });
  { const en = new THREE.MeshPhysicalMaterial({ color: 0xf4f4f0, roughness: .3, clearcoat: .8 });   // washing machine
    box(474, 546, 0, 84, -474, -404, en); box(474, 546, 84, 86, -474, -404, new THREE.MeshStandardMaterial({ color: 0xd8d8d2, roughness: .4 }));
    const dr = mesh(new THREE.TorusGeometry(15, 2.6, 10, 32), MAT.steel, 546.5, 40, -439); dr.rotation.y = Math.PI / 2; dr.userData.noSolid = true;
    const gl = mesh(new THREE.CircleGeometry(13, 32), new THREE.MeshPhysicalMaterial({ color: 0x2e3e4a, roughness: .05, metalness: .2, clearcoat: 1 }), 546.3, 40, -439); gl.rotation.y = Math.PI / 2;
    box(546, 547, 70, 78, -470, -446, MAT.black, nc); cyl(530, -416, 4.5, 86, 104, new THREE.MeshPhysicalMaterial({ color: 0x3a8ad8, roughness: .3, clearcoat: .6 })); }
  { const bm = new THREE.MeshPhysicalMaterial({ color: 0x6fb0d8, roughness: .45, clearcoat: .3 });   // laundry basket
    box(556, 608, 0, 28, -612, -609, bm); box(556, 608, 0, 28, -581, -578, bm); box(556, 559, 0, 28, -609, -581, bm); box(605, 608, 0, 28, -609, -581, bm);
    for (let x = 562; x < 604; x += 7) box(x, x + 3, 6, 22, -578.2, -577.8, MAT.black, ncs);
    const rim = (a, b) => { const d = V3().subVectors(b, a), c = mesh(new THREE.CapsuleGeometry(1.7, d.length(), 4, 10), bm, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); c.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); c.userData.noSolid = true; };
    const k = [V3(557.5, 28.5, -610.5), V3(606.5, 28.5, -610.5), V3(606.5, 28.5, -579.5), V3(557.5, 28.5, -579.5)]; for (let i = 0; i < 4; i++) rim(k[i], k[(i + 1) % 4]);
    for (const q of k) cyl(q.x, q.z, 1.9, 0, 28.5, bm, { col: false, seg: 14 });
    box(559, 605, 0, 25, -609, -581, cloth(0xe8e2d4), nc); cols.push({ t: 'b', x0: 559, x1: 605, y0: 0, y1: 25, z0: -609, z1: -581, soft: true });
    for (const [x, z, c, s] of [[570, -598, 0xd8665a, 9], [588, -590, 0x5a7ac8, 10], [596, -603, 0xf2d26a, 7], [575, -586, 0xffffff, 8]]) { const b = mesh(new THREE.SphereGeometry(s, 16, 10), cloth(c), x, 22, z); b.scale.y = .45; b.userData.noSolid = true; } }
  { // the back door's frame and mat (the door itself swings: e45_pest.js)
    for (const [x0, x1] of [[646, 650], [730, 734]]) box(x0, x1, 0, 209, -612, -607, W, nc); box(646, 734, 205, 209, -612, -607, W, nc);
    box(652, 728, 0, .9, -607, -580, new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 1 }), ncs); }
  { const bm = new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: .9 });   // a broom leaning in the corner
    const st = mesh(new THREE.CylinderGeometry(1.1, 1.1, 120, 8), bm, 726, 70, -270); st.rotation.z = .12; st.userData.noSolid = true;
    box(716, 734, 0, 14, -276, -264, new THREE.MeshStandardMaterial({ color: 0x3a6a3a, roughness: .9 })); }
  // ---- the doorway into the living room ----
  box(540, 616, 0, .8, -246, -232, new THREE.MeshPhysicalMaterial({ color: 0xe9e6de, roughness: .25, clearcoat: .6 }), { cast: false });
  for (const [x0, x1] of [[536, 540], [616, 620]]) box(x0, x1, 0, 209, -248, -228, W, nc); box(536, 620, 205, 209, -248, -228, W, nc);

  // ================= the storeroom =================
  box(-157, 138, -10, .05, -500, -232, storeF, { cast: false });
  box(-167, -157, 0, 266, -500, -232, wallM, { uv: 120 }); box(138, 150, 0, 266, -500, -482, wallM, { uv: 120 });
  box(-167, 150, 258, 266, -500, -312, ceilM, { cast: false }); box(-46, 150, 258, 266, -312, -232, ceilM, { cast: false });
  // the light well the kitchen window looks into: open to the sky, the neighbourhood painted over its low back wall (f_levels.js)
  { const ext = new THREE.MeshStandardMaterial({ color: 0xb9c2c4, roughness: .9 }), pav = new THREE.MeshStandardMaterial({ color: 0x8c8a84, roughness: 1 });
    box(-46, -38, -10, 270, -312, -232, ext, { uv: 120 });                          // its east side (the storeroom's on the other side)
    box(-157, -38, -10, 45, -306, -300, ext, { uv: 120 });                           // its low back wall
    box(-157, -38, 45, 270, -314, -304, ext, { uv: 120 });                           // (behind the painted view: the storeroom side)
    box(-157, -46, -10, .2, -300, -232, pav, { cast: false });                       // paving
    for (const [x, z, r, c] of [[-128, -276, 9, 0xa0583a], [-70, -284, 7, 0x8a4a30]]) { cyl(x, z, r, .2, r * 1.6, new THREE.MeshStandardMaterial({ color: c, roughness: .9 })); const p = mesh(new THREE.IcosahedronGeometry(r * 1.5, 1), new THREE.MeshStandardMaterial({ color: 0x3f7a3a, roughness: .9, flatShading: true }), x, r * 2.7, z); p.userData.noSolid = true; } }
  // the pantry door, standing open against the wall
  { const dm = new THREE.MeshPhysicalMaterial({ color: 0xece6da, roughness: .55, clearcoat: .2 });
    box(36, 40, 0, 203, -498, -420, dm); const kb = mesh(new THREE.SphereGeometry(2, 14, 10), K.brass, 34, 98, -426); kb.userData.noSolid = true; }
  // a bare bulb on a cord
  cyl(0, -370, .25, 226, 258, MAT.black, { col: false, seg: 6 });
  mesh(new THREE.SphereGeometry(4.5, 18, 12), new THREE.MeshStandardMaterial({ color: 0xfff2d8, emissive: 0xffd49a, emissiveIntensity: 1.4 }), 0, 222, -370, { cast: false }).userData.noSolid = true;
  pointL(0xffcf94, 950, 0, 214, -370);
  // metal shelving along the west wall
  { const x0 = -155, x1 = -113, z0 = -492, z1 = -322;
    for (const x of [x0, x1 - 2]) for (const z of [z0, z1 - 2, (z0 + z1) / 2]) box(x, x + 2, 0, 200, z, z + 2, steelM, nc);
    for (const y of [40, 80, 120, 160, 198]) box(x0, x1, y - 2, y, z0, z1, new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: .5, roughness: .45 }));
    const can = (x, z, y, c) => cyl(x, z, 4.2, y, y + 11, new THREE.MeshStandardMaterial({ color: c, metalness: .5, roughness: .35 }), { seg: 20 });
    for (let i = 0; i < 6; i++) can(-140, -470 + i * 10, 40, [0xc8312a, 0xe8c25a, 0x2f8a4a][i % 3]);
    for (let i = 0; i < 4; i++) can(-128, -368 + i * 10, 80, [0x3a6ad0, 0xc8312a][i % 2]);
    for (const [z, c, h] of [[-470, 0xf2a33a, 32], [-452, 0xd84a3a, 30], [-432, 0x4a9ad8, 34]]) box(-150, -122, 120, 120 + h, z, z + 14, new THREE.MeshStandardMaterial({ color: c, roughness: .8 }));   // cereal boxes
    // a big jar of marbles (a few have got out) and a jar of raisins on the bottom shelf
    cyl(-134, -342, 9, 40, 62, new THREE.MeshPhysicalMaterial({ color: 0xdff0f6, roughness: .05, transparent: true, opacity: .45, clearcoat: 1 }), { seg: 28 });
    for (let i = 0; i < 14; i++) { const b = mesh(new THREE.SphereGeometry(1.5, 10, 8), new THREE.MeshPhysicalMaterial({ color: [0x4a9ad8, 0xe85a4a, 0x5ac87a, 0xf2c23a][i % 4], roughness: .1, clearcoat: 1 }), -134 + R(-6, 6), 41.5 + (i % 5) * 2.6, -342 + R(-6, 6), { cast: false }); b.userData.noSolid = true; }
    cyl(-134, -400, 8, 40, 58, new THREE.MeshPhysicalMaterial({ color: 0xeedfcf, roughness: .1, transparent: true, opacity: .55 }), { seg: 24 });
    cyl(-134, -400, 8.3, 58, 61, new THREE.MeshStandardMaterial({ color: 0xc8312a, roughness: .5 }), { seg: 24 }); }
  // a rice sack slumped on the floor, a torn bag of sugar, the sewing tin, cardboard boxes, a step stool
  { const prof = [[0, 0], [15, 0], [18.5, 3], [19.5, 12], [19, 30], [16.5, 40], [11, 46], [5.5, 48.5], [4.6, 50], [6.5, 53.5], [5, 57], [0, 57.5]].map(([r, y]) => new THREE.Vector2(r, y));
    const s = mesh(new THREE.LatheGeometry(prof, 28), cloth(0xe6dcc4), -82, 0, -455); s.scale.set(1, 1, .8); s.userData.noSolid = true;   // a rice sack, tied at the neck
    const band = mesh(new THREE.CylinderGeometry(19.6, 19.6, 9, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0xc8312a, roughness: .9, side: THREE.DoubleSide }), -82, 22, -455, { cast: false }); band.scale.set(1, 1, .8); band.userData.noSolid = true;
    const tie = mesh(new THREE.TorusGeometry(5, .8, 6, 16), new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 1 }), -82, 49.5, -455, { cast: false }); tie.rotation.x = Math.PI / 2; tie.userData.noSolid = true;
    cols.push({ t: 'c', x: -82, z: -455, r: 15, y0: 0, y1: 38 }); }
  { box(-40, -12, 0, 10, -470, -452, new THREE.MeshStandardMaterial({ color: 0xf6f2ea, roughness: .9 }));
    box(-41, -11, 6, 8, -470.5, -451.5, new THREE.MeshStandardMaterial({ color: 0x3a6ad0, roughness: .9 }), ncs);
    for (const [x, z] of [[-8, -455], [-4, -462]]) { const c = mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4), new THREE.MeshPhysicalMaterial({ color: 0xfbf8f2, roughness: .9 }), x, 1.25, z, { cast: false }); c.rotation.y = x; c.userData.noSolid = true; } }
  { cyl(64, -470, 12, 0, 8, new THREE.MeshStandardMaterial({ color: 0x2a4a8a, metalness: .6, roughness: .35 }), { seg: 36 }); cyl(80, -486, 12.4, 0, 2.2, new THREE.MeshStandardMaterial({ color: 0x2a4a8a, metalness: .6, roughness: .35 }), { seg: 36 }); }
  box(90, 136, 0, 40, -440, -380, new THREE.MeshStandardMaterial({ color: 0xb89a6a, roughness: .95 })); box(96, 132, 40, 66, -432, -392, new THREE.MeshStandardMaterial({ color: 0xc4a676, roughness: .95 }));
  box(89.5, 136.5, 18, 21, -440.5, -379.5, new THREE.MeshStandardMaterial({ color: 0xd8c9a8, roughness: .9 }), ncs);
  box(60, 100, 0, 30, -300, -270, new THREE.MeshStandardMaterial({ color: 0x5a8ac0, roughness: .5 }));               // step stool
  // the hole under the counter: storeroom side
  mouseArch(-30, 0, -232, -1, wallM, 12, 10);
  // supplies: they come back a while after they're used up or carried off
  for (const [t, x, y, z] of [['sugar', -24, .05, -440], ['sugar', -50, .05, -432], ['raisin', -100, .05, -424], ['raisin', -134, 40, -386], ['marble', 18, .05, -318], ['button', 64, 8, -470], ['cap', 108, .05, -300]]) {
    BK.store.push({ i: LOOSE.length, home: V3(x, y, z), t: 0 }); addLoose(t, x, y, z); }
  // …and a few in the hallway and the utility room that don't
  for (const [t, x, y, z] of [['raisin', -14, 93, -596], ['button', 130, 0, -560], ['cap', 330, 0, -540], ['marble', 520, 0, -360]]) addLoose(t, x, y, z);
}

// ---------- the light pool: which side of the walls a point is on ----------
// 's' the storeroom · 'b' the back (landing, hallway, utility room) · 'h' the rest of the house and everywhere else.
// The storeroom and the back share a doorway, and so do the utility room and the living room; anything else has a wall in between.
function lightSide(p) {
  if (inStore(p)) return 's';
  if (p.y > -90 && p.y < 270 && p.x > -294 && p.x < 748 && (p.z < -500 || (p.x < -157 && p.z < -479)) && p.z > -624) return 'b';
  if (p.y > -10 && p.y < 270 && p.x > 472 && p.x < 736 && p.z < -244 && p.z > -624) return 'b';
  return 'h';
}
function wallBetweenLight(lp, cp) {
  if (!WORLD) return false; const a = lightSide(cp), b = lightSide(lp); if (a === b) return false;
  if ((a === 's' && b === 'b') || (a === 'b' && b === 's')) return false;
  if (a === 'b' && b === 'h') return !(cp.x > 472 && lp.x > 312 && lp.z > -244 && lp.y < 270);   // from the utility room, the living room's lamps through the doorway
  if (a === 'h' && b === 'b') return !(cp.x > 472 && cp.z < -100 && cp.y < 270 && lp.x > 472);   // and the other way round
  return true;
}

// through the open basement door: the back's lamps light the top of the basement stairs
function doorSpill(lp, cp) { return !!door && door.rotation.y > .1 && lightSide(lp) === 'b' && cp.x > -300 && cp.x < -150 && cp.z > -500 && cp.z < -150 && cp.y < 150 && Math.hypot(lp.x + 224, lp.z + 480) < 300; }
// the back of the house has its own air: a corridor and a storeroom at night, dimmer than the kitchen, not as dark as the basement
// (eased in like any change of place, so walking up out of the basement or through to the kitchen doesn't jump)
const BACK_ATM = { fog: [0x17130f, .00105], expo: 1.26, envI: .42 };
function backAtmo(D, cp) { if (!WORLD || lightSide(cp) === 'h') return D; return { fog: BACK_ATM.fog, expo: BACK_ATM.expo, envI: BACK_ATM.envI, bloom: D.bloom }; }

// ---------- the basement door: colliders follow it; online it stands ajar; it shuts behind you ----------
function backDoorTick(dt) {
  if (!WORLD || !door) return;
  if (!BK.doorFixed) {   // the old invisible plug and the door's own (fixed) collider: the moving ones replace them
    BK.doorFixed = true;
    for (const c of cols) if (c.t === 'b' && !c.door && c.x0 > -263 && c.x1 < -186 && c.z0 > -492.5 && c.z1 < -477 && c.y0 > -77 && c.y1 < 120.5) { c.y0 = -999; c.y1 = -998; }
  }
  // online nobody's home: the door was left ajar. Single player, once the kitchen has its dinner going, she's not coming down again: it swings shut when nobody's in the way
  if (NET.on) door.rotation.y = damp(door.rotation.y, .45, 2, dt);
  else if (ZONES.kitchen.prepped && door.rotation.y > .001) {
    const inWay = party.some(C => C.pos.x > -275 && C.pos.x < -175 && C.pos.z > -560 && C.pos.z < -455 && C.pos.y < 130);
    if (!inWay) { door.rotation.y = damp(door.rotation.y, 0, 3.2, dt); if (door.rotation.y < .015) { door.rotation.y = 0; if (!BK.shut) { BK.shut = true; SND.thud(.35); } } }
    upLight.intensity = damp(upLight.intensity, 0, 3, dt); doorBeamRec.k = damp(doorBeamRec.k, 0, 3, dt); doorBeam.material.uniforms.uK.value = doorBeamRec.k;
  }
  const th = door.rotation.y, cs = Math.cos(th), sn = Math.sin(th), hx = door.position.x, hz = door.position.z;
  BK.doorSegs.forEach((c, i) => { const a = i * 15, b = (i + 1) * 15, xa = hx + a * cs, za = hz - a * sn, xb = hx + b * cs, zb = hz - b * sn;
    c.x0 = Math.min(xa, xb) - 1.5; c.x1 = Math.max(xa, xb) + 1.5; c.z0 = Math.min(za, zb) - 1.5; c.z1 = Math.max(za, zb) + 1.5; });
  // seen through the open door from the hallway, the basement stairs need drawing too
  const P = ZONES.basement.peek, has = P.includes(BK.peekBox);
  if (th > .05 && !has) P.push(BK.peekBox); else if (th <= .05 && has) P.splice(P.indexOf(BK.peekBox), 1);
  // a nudge, the second time she leaves it open
  if (LEVEL === 'basement' && !NET.on && mom.active && mom.visits >= 2 && th > 1 && !BK.said.door && STATE === 'play') { BK.said.door = 1; toast('樓梯頂道門開住——趁太太喺下面，可以爬樓梯溜出去', 4.2); }
}

// ---------- the clothesline ----------
function lineGrab(C) { const p = linePt(BK.s0); return V3(p.x, p.y - 15 - C.h, p.z); }
function zipNear(L) {
  if (!L || L.line || L.frozen || STATE !== 'play' || LEVEL !== 'kitchen') return false;
  if (looseHeld(L)) return false;
  const g = lineGrab(L); return Math.hypot(L.pos.x - g.x, L.pos.z - g.z) < 13 && L.pos.y > g.y - 7 && L.pos.y < g.y + 4 && (L.grounded || L.climbing);
}
function zipInput(L) {
  if (!zipNear(L)) return false;
  L.line = { s: BK.s0, v: 10 }; L.climbing = false; L.mantle = null; L.grounded = false; L.vel.set(0, 0, 0); L.crouch = false; SND.swish(); tone(520, 760, .18, .05, 'triangle');
  if (!BK.said.ride) { BK.said.ride = 1; toast(TOUCH ? '捉實衣架！按「跳」可以中途鬆手' : '捉實衣架！撳 Space 可以中途鬆手', 2.6); }
  return true;
}
function lineOff(C, jumped) {
  const R0 = C.line; if (!R0) return; C.line = null; BK.used = true;
  const v = R0.v, d = BK.dir; C.vel.set(d.x * v * (jumped ? .7 : .2), jumped ? 24 : 0, d.z * v * (jumped ? .7 : .2)); C.grounded = false; C.state = 'air'; C.climbCD = .4;
  if (jumped) SND.jump();
}
function lineRide(C, dt, ctl) {
  const R0 = C.line, slope = (BK.A.y - BK.B.y) / BK.len;
  R0.v = Math.min(LINE_V, R0.v + (G * slope - R0.v * .08) * dt); R0.s += R0.v * dt;
  const p = linePt(R0.s); C.pos.set(p.x, p.y - 15 - C.h, p.z); C.vel.copy(BK.dir).multiplyScalar(R0.v);
  C.yaw = angDamp(C.yaw, Math.atan2(BK.dir.x, BK.dir.z), 10, dt); C.state = 'climb'; C.spd = 6; C.grounded = false; C.climbing = false;
  C.stamina = Math.min(C.stamMax || 100, C.stamina + 6 * dt);
  if (ctl && pressed.Space) { lineOff(C, true); return; }
  if (R0.s >= BK.len - 14) lineOff(C, false);
}
// a hanger over everyone who's hanging off the line (the leader, followers retracing the ride, other players)
function hangerTick(dt) {
  if (!BK.hangers.length) return; let n = 0;
  const show = (s, tilt) => { const h = BK.hangers[n++]; if (!h) return; const p = linePt(s); h.position.copy(p); h.rotation.set(0, Math.atan2(BK.dir.x, BK.dir.z), 0); h.rotateX(tilt); h.visible = true; };
  let startTaken = false;
  for (const C of party) { if (C.frozen || !C.root.visible) continue; let s = null, tilt = 0;
    if (C.line) { s = C.line.s; tilt = -clamp(C.line.v / LINE_V, 0, 1) * .25; }
    else { const q = V3(C.pos.x, C.pos.y + 15 + C.h, C.pos.z), t = V3().subVectors(q, BK.A).dot(BK.dir); if (t > 2 && t < BK.len && linePt(t).distanceTo(q) < 2.6 && (C.state === 'climb' || C !== leader)) { s = t; tilt = -.12; } }
    if (s !== null) { show(s, tilt); if (Math.abs(s - BK.s0) < 6) startTaken = true; } }
  if (!startTaken) show(BK.s0, Math.sin(T * 1.3) * .04);
  if (BK.used) show(BK.len - 6, Math.sin(T * 1.1 + 1) * .05);
  for (; n < BK.hangers.length; n++) BK.hangers[n].visible = false;
}

// ---------- the storeroom: quiet, and its shelves fill up again ----------
function storeTick(dt) {
  if (NET.client || !BK.store.length) return;
  for (const S of BK.store) { const o = LOOSE[S.i]; if (!o) continue;
    const away = o.st === 'gone' || (o.st === 'ground' && o.p.distanceTo(S.home) > 30 && !party.some(C => C.pos.distanceTo(o.p) < 60));
    if (!away) { S.t = 0; continue; }
    S.t += dt; if (S.t > 45) { S.t = 0; looseDo({ k: 'back', i: S.i, c: 'dad', p: S.home.toArray() }, true); }
  }
}
// noises in the storeroom don't carry; nobody looks in there
function backQuiet(p) { return WORLD && inStore(p); }

// ---------- per frame (with the kitchen) ----------
function backTick(dt) {
  if (!WORLD) return;
  backDoorTick(dt); hangerTick(dt); storeTick(dt); pestTick(dt);
  for (const C of party) if (C.line && C !== leader) lineOff(C, false);   // switched away mid-ride: let go
  const L = leader; if (!L || STATE !== 'play') return;
  if (LEVEL === 'kitchen' && mine(L)) {
    if (inStore(L.pos) && !BK.said.store) { BK.said.store = 1; toast('儲物房：呢度冇人望到你，整出聲都冇人聽到。架上啲嘢拎得，拎完過一陣會補返', 4.2); }
    // the living room reached round the back, before the door's open
    if (!LIV.open && playerChars().some(C => C.pos.x > 314 && C.pos.x < 900 && C.pos.z > -230 && C.pos.z < 232 && C.pos.y < 60)) {
      if (!KS.backLiv) { KS.backLiv = true; if (KS.mp) mpAdvance(); }
      if (!KS.mp && KS.ch2 && QUESTS === SP_Q2 && quest === 0) { setQuest(1); say('爸爸', '由後面條走廊都入到客廳！遙控器應該喺沙發前面嘅咖啡枱。', '#f5f0e6', 3.4); }
    }
  }
}
function backHint(L) {
  if (L.line) return TOUCH ? '滑緊……按「跳」可以中途鬆手' : '滑緊……撳 Space 可以中途鬆手';
  if (zipNear(L)) return TOUCH ? '按「用」捉住衣架，沿晾衫繩滑去走廊尾' : '撳 E 捉住衣架，沿晾衫繩滑去走廊尾';
  if (!BK.used && !L.climbing && L.pos.y < 40 && L.pos.x > -70 && L.pos.x < 60 && L.pos.z < -540 && L.pos.z > -612) return '爬上報紙、鞋櫃同鞋盒，捉住頂嗰個衣架就可以滑過成條走廊';
  if (inStore(L.pos) && L.pos.y < 9 && Math.hypot(L.pos.x + 30, L.pos.z + 238) < 18) return '牆腳個窿通去廚房櫃底——一出去就係太太腳邊，小心';
  if (L.pos.y < 9 && L.pos.x > -40 && L.pos.x < -20 && L.pos.z > -232 && L.pos.z < -168) return '櫃底條窿通去後面嘅儲物房（嗰度冇人望到你）';
  if (PEST.st === 'off' && L.pos.y < 30 && L.pos.x > 630 && L.pos.x < 750 && L.pos.z < -580 && L.pos.z > -612) return '後門鎖咗——之後會通去後園';
  return '';
}
