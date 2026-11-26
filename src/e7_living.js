
// =====================================================================
//  LIVING / DINING ROOM — same level as the kitchen, through the door on the right wall
//  (no loading: you just walk through once the door is open)
//  The door is held shut by a rubber wedge on the kitchen side: push it away (bear) or
//  shrink it (Dad) and the draught from the living-room window swings the door open.
//  Online co-op chapter 1 objectives: find 3 machine parts → open the door → everyone
//  into the living room → take the batteries from the TV remote → leave through the vent.
// =====================================================================
const LIV = { door: null, a: 0, target: .025, open: false, wedge: null, wedge0: null, segs: [], parts: [], partsGot: 0, remote: null, remoteGot: false, vent: V3(893, 0, -200) };
function buildLivingRoom(K) {
  const M = MAT, X0 = 312, X1 = 900;
  const wallM = new THREE.MeshStandardMaterial({ color: 0xd9cbb5, roughness: .95, map: K.wall.map || null });
  const floorM = new THREE.MeshStandardMaterial({ color: 0x8a5c3a, roughness: .7, map: K.floor.map || null });
  box(X0 - 2, X1 + 12, -10, 0, -240, 240, floorM, { uv: 140, cast: false });
  box(X0 - 2, 650, 260, 270, -240, 240, K.ceil, { cast: false }); box(666, X1 + 12, 260, 270, -240, 240, K.ceil, { cast: false }); box(650, 666, 260, 270, -232, 240, K.ceil, { cast: false });
  box(X0, 330, 0, 260, -244, -232, wallM, { uv: 120 }); box(340, 650, 0, 260, -244, -232, wallM, { uv: 120 }); box(666, 748, 0, 260, -244, -232, wallM, { uv: 120 }); box(330, 340, 8, 260, -244, -232, wallM, { uv: 120 });
  box(650, 666, 0, 200, -244, -232, wallM, { uv: 120 }); box(650, 666, 200, 270, -244, -240, wallM, { uv: 120 }); box(650, 666, 224, 260, -236, -232, wallM, { uv: 120 });   // the vent shaft over the fish tank, up into the duct box(828, X1 + 12, 0, 260, -244, -232, wallM, { uv: 120 }); box(748, 828, 205, 260, -244, -232, wallM, { uv: 120 }); // far wall (a doorway to the stairs); the vent near the floor leads through a duct into the garage
  box(X1, X1 + 12, 0, 260, -232, -214, wallM, { uv: 120 }); box(X1, X1 + 12, 0, 260, -186, 232, wallM, { uv: 120 }); box(X1, X1 + 12, 0, 4, -214, -186, wallM, { uv: 120 }); box(X1, X1 + 12, 24, 260, -214, -186, wallM, { uv: 120 });
  // front wall with the window opening (x 700–850, y 100–210)
  box(X0, 700, 0, 260, 232, 244, wallM, { uv: 120 }); box(850, X1 + 12, 0, 260, 232, 244, wallM, { uv: 120 }); box(700, 850, 0, 100, 232, 244, wallM, { uv: 120 }); box(700, 850, 210, 260, 232, 244, wallM, { uv: 120 });
  box(X0, 330, 0, 9, -232, -230.5, M.white, { col: false }); box(340, 744, 0, 9, -232, -230.5, M.white, { col: false }); box(832, X1, 0, 9, -232, -230.5, M.white, { col: false }); box(X0, X1, 0, 9, 230.5, 232, M.white, { col: false }); box(X1 - 1.5, X1, 0, 9, -230, 230, M.white, { col: false });
  // the door: hinged at z=40, closes towards z=-60, swings into the kitchen
  const dg = new THREE.Group(); dg.position.set(300, 0, 40); LV.add(dg); LIV.door = dg;
  const dm = new THREE.MeshPhysicalMaterial({ color: 0xf0ebe2, roughness: .55, clearcoat: .2 });
  mesh(new THREE.BoxGeometry(4, 205, 98), dm, -2, 102.5, -49, { parent: dg }); mesh(new THREE.SphereGeometry(2.2, 16, 12), K.brass, -5.5, 100, -88, { parent: dg }); mesh(new THREE.SphereGeometry(2.2, 16, 12), K.brass, 1.5, 100, -88, { parent: dg });
  for (const [y0, y1] of [[30, 95], [115, 190]]) mesh(new THREE.BoxGeometry(4.4, y1 - y0, 70), new THREE.MeshPhysicalMaterial({ color: 0xe6e0d4, roughness: .6 }), -2, (y0 + y1) / 2, -49, { parent: dg, cast: false });
  for (let i = 0; i < 10; i++) { const c = { t: 'b', x0: 0, x1: 0, y0: 0, y1: 205, z0: 0, z1: 0, door: true }; cols.push(c); LIV.segs.push(c); }
  box(299, 313, 205, 212, -62, 44, M.white, { col: false }); box(299, 313, 0, 212, -62, -58, M.white); box(299, 313, 0, 212, 40, 44, M.white);
  // light under/through the gap
  LIV.gapLight = pointL(0xffd9a8, 0, 306, 20, -55);
  // rubber wedge jammed under the door's free end (kitchen side)
  const wm = new THREE.MeshStandardMaterial({ color: 0x5b3f2c, roughness: .9 });
  const wg = new THREE.BufferGeometry(); { const P = [-.5, -.5, -.5, .5, -.5, -.5, -.5, .5, -.5, -.5, -.5, .5, .5, -.5, .5, -.5, .5, .5]; wg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); wg.setIndex([2, 1, 0, 4, 5, 3, 4, 3, 0, 1, 4, 0, 5, 2, 0, 3, 5, 0, 5, 4, 1, 2, 5, 1]); const nw = wg.toNonIndexed(); nw.computeVertexNormals(); wg.copy(nw); }
  const wr = resGroup(cmGroup(9, 5, 14, ({ part }) => { const m = part(new THREE.Mesh(wg).geometry, wm, 0, 0, 0, { s: [9, 5, 14] }); m.rotation.y = Math.PI; }, [wm]), 289, -54, 0, 9, 5, 14, .3, 3, '門擋', true);
  LIV.wedge = wr; LIV.wedge0 = V3(wr.cx, 0, wr.cz);
  // ---- dining zone ----
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3a24, roughness: .55, map: K.wood.map || null });
  box(400, 580, 72, 76, -175, -85, wood, { uv: 80 }); for (const [x, z] of [[405, -170], [575, -170], [405, -90], [575, -90]]) box(x - 3, x + 3, 0, 72, z - 3, z + 3, wood);
  const chairL = (cx, cz, face) => { box(cx - 18, cx + 18, 44, 47, cz - 18, cz + 18, wood); for (const [dx, dz] of [[-16, -16], [16, -16], [-16, 16], [16, 16]]) box(cx + dx - 1.5, cx + dx + 1.5, 0, 44, cz + dz - 1.5, cz + dz + 1.5, wood); const bz = cz + face * 17; box(cx - 18, cx + 18, 47, 95, bz - 1.5, bz + 1.5, wood); };
  for (const x of [440, 490, 540]) { chairL(x, -192, -1); chairL(x, -68, 1); }
  // runner, fruit bowl, candle
  box(410, 570, 76, 76.4, -140, -120, new THREE.MeshStandardMaterial({ color: 0x7a2f2f, roughness: .9 }), { col: false });
  const fb = new THREE.MeshPhysicalMaterial({ color: 0xe8e2d6, roughness: .2, clearcoat: .6 });
  resGroup(cmGroup(26, 9, 26, ({ part }) => { part(new THREE.CylinderGeometry(13, 8, 9, 32, 1, true), fb, 0, 0, 0); part(new THREE.SphereGeometry(4.6, 16, 12), K.apple, -4, 2, 2); part(new THREE.SphereGeometry(4.2, 16, 12), new THREE.MeshStandardMaterial({ color: 0xf2a33a, roughness: .5 }), 4, 2.5, -2); part(new THREE.SphereGeometry(4, 16, 12), K.apple, 0, 4, 5); }, [fb]), 490, -130, 76, 26, 9, 26, .3, 4, '生果碗', true);
  // sideboard with drawers + family photos
  const sb = new THREE.MeshStandardMaterial({ color: 0x3c2a1e, roughness: .6 }); box(360, 580, 0, 88, -230, -196, sb, { uv: 60 });
  for (let i = 0; i < 4; i++) { const x = 368 + i * 53; box(x, x + 46, 52, 82, -196, -195, sb, { col: false }); box(x + 18, x + 28, 66, 68, -195, -192, K.brass); }
  for (const [x, w, h, img] of [[385, 22, 28, 'photo'], [430, 18, 24, 'photo2'], [530, 26, 20, 'photo3']]) { box(x - w / 2, x + w / 2, 88, 88 + h, -224, -222, M.black); mesh(new THREE.PlaneGeometry(w - 3, h - 3), livingPhoto(img), x, 88 + h / 2, -221.8, { cast: false }); }
  // fish tank on its stand (lid is walkable)
  const st = new THREE.MeshStandardMaterial({ color: 0x24201c, roughness: .5 }); box(620, 720, 0, 80, -228, -186, st);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .02, transmission: .9, thickness: .5, transparent: true, opacity: .35, depthWrite: false });
  box(620, 720, 80, 82, -228, -186, st); box(620, 721, 80, 140, -229, -228, glass, { cast: false }); box(620, 721, 80, 140, -186, -185, glass, { cast: false }); box(619, 620, 80, 140, -228, -186, glass, { cast: false }); box(720, 721, 80, 140, -228, -186, glass, { cast: false });
  const water = mesh(new THREE.BoxGeometry(98, 50, 40), new THREE.MeshPhysicalMaterial({ color: 0x3a8cb0, roughness: .05, transmission: .6, transparent: true, opacity: .45, depthWrite: false }), 670, 107, -207, { cast: false });
  box(621, 719, 82, 88, -227, -187, new THREE.MeshStandardMaterial({ color: 0xc8b48a, roughness: 1 }), { col: false });
  box(618, 722, 140, 143, -230, -184, st); // lid
  LIV.fish = []; for (let i = 0; i < 4; i++) { const f = mesh(new THREE.SphereGeometry(2, 14, 10), new THREE.MeshStandardMaterial({ color: [0xff8a2a, 0xffd23a, 0x4ac0ff, 0xff5a7a][i], emissive: 0x221100, roughness: .3 }), 670, 105, -207, { cast: false }); f.scale.set(1.6, 1, .6); LIV.fish.push({ m: f, ph: i * 1.7, r: 20 + i * 6, y: 95 + i * 7 }); }
  const fl = new THREE.PointLight(0x7fd6ff, 900, 0, 2); fl.position.set(670, 135, -207); LV.add(fl);
  // ---- living zone ----
  const sofaM = new THREE.MeshPhysicalMaterial({ color: 0x4a5a6e, roughness: .95, sheen: .8, sheenColor: 0x8aa0c0 });
  box(560, 578, 0, 85, 20, 222, sofaM); box(578, 650, 0, 30, 20, 222, sofaM); box(578, 650, 0, 60, 20, 36, sofaM); box(578, 650, 0, 60, 206, 222, sofaM);
  ['左', '中', '右'].forEach((n, i) => resGroup(cmGroup(66, 15, 54, ({ part }) => { part(new THREE.BoxGeometry(66, 15, 54), sofaM, 0, 0, 0); }, [sofaM]), 614, 36 + 18 + 30 + i * 60 - 30 + 0, 30, 66, 15, 54, .4, 2.5, n + '坐墊', true));
  const pil = new THREE.MeshPhysicalMaterial({ color: 0xe0b45a, roughness: .9, sheen: .9 }); resGroup(cmGroup(14, 34, 34, ({ part }) => { part(new THREE.BoxGeometry(14, 34, 34), pil, 0, 0, 0); }, [pil]), 590, 70, 45, 14, 34, 34, .4, 3, '咕𠱸', true);
  const rugM = furMat({ color: 0xd9c9a8, len: .5, den: 2.6, droop: .1, clump: .5, rimK: .03, root: .65 });
  const rg = new THREE.PlaneGeometry(190, 170); rg.rotateX(-Math.PI / 2); const rug = furMesh(rg, rugM); rug.position.set(745, .3, 120); LV.add(rug); cols.push({ t: 'b', x0: 650, x1: 840, y0: 0, y1: .3, z0: 35, z1: 205, small: true });
  const ct = new THREE.MeshPhysicalMaterial({ color: 0x8a6a4a, roughness: .4, clearcoat: .5 }); box(690, 790, 38, 42, 70, 170, ct); for (const [x, z] of [[694, 74], [786, 74], [694, 166], [786, 166]]) box(x - 2.5, x + 2.5, 0, 38, z - 2.5, z + 2.5, ct);
  box(694, 786, 10, 12, 74, 166, ct);  // lower shelf
  // remote control (holds the batteries)
  const rm = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: .5 }); const bt = new THREE.MeshStandardMaterial({ color: 0x9a9aa2, roughness: .4 });
  LIV.remote = resGroup(cmGroup(5, 2.2, 18, ({ part }) => { part(new THREE.BoxGeometry(5, 2.2, 18), rm, 0, 0, 0); for (let i = 0; i < 9; i++) part(new THREE.BoxGeometry(1.1, .5, 1.1), i === 0 ? new THREE.MeshStandardMaterial({ color: 0xd03030 }) : bt, (i % 3 - 1) * 1.4, 1.2, -6 + Math.floor(i / 3) * 1.8); }, [rm]), 730, 120, 42, 5, 2.2, 18, .4, 6, '遙控器', true);
  resGroup(cmGroup(22, 1.4, 28, ({ part }) => { part(new THREE.BoxGeometry(22, 1.4, 28), new THREE.MeshStandardMaterial({ color: 0xc84a3a, roughness: .7 }), 0, 0, 0); }, []), 760, 150, 42, 22, 1.4, 28, .3, 4, '雜誌', true);
  const mugM = new THREE.MeshPhysicalMaterial({ color: 0x3a6ea8, roughness: .25, clearcoat: .8 }); resGroup(cmGroup(9, 10, 9, ({ part }) => { part(new THREE.CylinderGeometry(4, 4, 10, 24), mugM, 0, 0, 0); }, [mugM]), 705, 90, 42, 9, 10, 9, .3, 5, '咖啡杯', true);
  // TV on a low cabinet against the far wall (facing the sofa)
  const tvc = new THREE.MeshStandardMaterial({ color: 0x2b2420, roughness: .55 }); box(860, 900, 0, 46, 30, 210, tvc);
  box(888, 892, 52, 140, 40, 200, M.black); mesh(new THREE.PlaneGeometry(156, 84), LIV.tvMat = new THREE.MeshBasicMaterial({ map: tvShowTex(), color: new THREE.Color(0x4a7ab0).multiplyScalar(1.4) }), 887.8, 96, 120, { cast: false }).rotation.y = -Math.PI / 2;
  box(884, 896, 46, 52, 110, 130, M.black);
  LIV.tvLight = new THREE.PointLight(0x7aa8ff, 2600, 0, 2); LIV.tvLight.position.set(850, 95, 120); LV.add(LIV.tvLight);
  box(866, 884, 46, 52, 60, 84, new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: .3 })); // console
  for (let i = 0; i < 3; i++) box(870 + i * 4, 872 + i * 4, 52, 52.6, 66, 68, new THREE.MeshBasicMaterial({ color: new THREE.Color(0x52ff9a).multiplyScalar(2) }), { col: false });
  for (const [dx, dz] of [[0, 0], [1.6, .8], [-.4, 1.8]]) tubeM([[891 + dx, 56, 142 + dz], [892.6 + dx, 30, 145 + dz], [893 + dx, 4, 148 + dz], [892 + dx, 1, 156 + dz], [880 + dx, 1, 215 + dz]], .7, M.black, 40); cols.push({ t: 'b', x0: 890.5, x1: 895.5, y0: 0, y1: 52, z0: 141, z1: 150.5 }); // a climbable cable bundle
  // bookshelf with walkable shelves
  const bs = new THREE.MeshStandardMaterial({ color: 0x6a4a30, roughness: .6 });
  box(330, 334, 0, 200, 196, 230, bs); box(446, 450, 0, 200, 196, 230, bs); box(330, 450, 0, 200, 228, 232, bs);
  for (const y of [0, 40, 80, 120, 160, 196]) box(330, 450, y, y + 4, 196, 230, bs);
  const bc = [0x9a3a3a, 0x3a5a9a, 0x3a8a5a, 0xc8a24a, 0x5a3a7a, 0x2a2a2a];
  [[44, 345, 6], [84, 352, 7], [124, 340, 5], [164, 360, 6]].forEach(([y, x0, n]) => { for (let i = 0; i < n; i++) { const h = R(22, 32), w = R(4, 6.5); const mat = new THREE.MeshStandardMaterial({ color: bc[(i + y) % 6], roughness: .7 }); const x = x0 + i * 8; resGroup(cmGroup(w, h, 22, ({ part }) => { part(new THREE.BoxGeometry(w, h, 22), mat, 0, 0, 0); }, [mat]), x, 214, y, w, h, 22, .3, 3, '書', true); } });
  const robot = new THREE.MeshPhysicalMaterial({ color: 0xd8dde2, metalness: .6, roughness: .3 });
  resGroup(cmGroup(14, 22, 10, ({ part }) => { part(new THREE.BoxGeometry(12, 12, 8), robot, 0, -3, 0); part(new THREE.BoxGeometry(9, 8, 8), robot, 0, 7, 0); part(new THREE.SphereGeometry(1.2, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff5a3a).multiplyScalar(2) }), -2, 7.5, 4.2); part(new THREE.SphereGeometry(1.2, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff5a3a).multiplyScalar(2) }), 2, 7.5, 4.2); }, [robot]), 420, 210, 124, 14, 22, 10, .3, 4, '玩具機械人', true);
  // window + curtains (curtains reach the floor: climb them to the sill)
  box(700, 850, 96, 100, 214, 232, M.white); box(700, 850, 206, 210, 228, 240, M.white, { col: false }); box(700, 704, 100, 206, 228, 240, M.white, { col: false }); box(846, 850, 100, 206, 228, 240, M.white, { col: false }); box(773.5, 776.5, 100, 206, 236, 239, M.white, { col: false });
  mesh(new THREE.PlaneGeometry(420, 210), K.dusk, 775, 150, 330, { cast: false }).rotation.y = Math.PI;
  mesh(new THREE.PlaneGeometry(146, 110), MAT.glassThin, 775, 155, 238, { cast: false }).rotation.y = Math.PI;
  sunWindow(V3(775, 155, 236), 146, 110, V3(0, 0, -1), 0, { fill: 14000 });
  if (DAY) { pointL(0xf2eee6, 10000, 640, 240, 40); pointL(0xe2eaff, 8000, 470, 220, 170); }   // daylight bouncing round the room (the window faces away from the sun)
  cols.push({ t: 'b', x0: 700, x1: 850, y0: 100, y1: 206, z0: 237, z1: 239, noRay: true });
  const cur = new THREE.MeshPhysicalMaterial({ color: 0x8a7a9a, roughness: .95, sheen: .8, side: THREE.DoubleSide });
  for (const x of [690, 852]) { box(x - 12, x + 12, 2, 230, 214, 220, cur); }
  addBeam(0xbcd0ff, V3(775, 200, 225), V3(700, 0, 120), .35, .03);
  // floor lamp
  cyl(575, 8, 1, 0, 150, M.dsteel, { seg: 10 }); cyl(575, 8, 12, 0, 2, M.dsteel, { seg: 24 }); const shade = LIV.shade = mesh(new THREE.CylinderGeometry(10, 16, 18, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0xf2e6cc, roughness: .9, side: THREE.DoubleSide, emissive: 0xffb36a, emissiveIntensity: .6 }), 575, 158, 8, { cast: false });
  LIV.lamp = pointL(0xffc890, 9000, 575, 150, 8); pointL(0xffe0b8, 7000, 700, 235, 20);
  // pendant over the dining table (shadow-casting)
  cyl(490, -130, .3, 200, 260, M.black, { col: false, seg: 6 }); mesh(new THREE.SphereGeometry(16, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), K.shade, 490, 195, -130); spotL(0xffd2a0, 52000, V3(490, 190, -130), V3(490, 0, -130), .95, .7, 1024, 10, 500);
  // the vent out (online co-op exit)
  // vent grille: hinged at the top, swings up once the way on is open
  { const g = new THREE.Group(); g.position.set(898.6, 24, -200); LV.add(g); LIV.grille = g; const gm = new THREE.MeshStandardMaterial({ color: 0xd8dde2, metalness: .8, roughness: .35 });
    mesh(new THREE.BoxGeometry(1.2, 21, 30), gm, 0, -10.5, 0, { parent: g }).visible = false; for (let i = 0; i < 6; i++) mesh(new THREE.BoxGeometry(1.4, 1.4, 27), gm, .2, -2.6 - i * 3.2, 0, { parent: g }); for (const z of [-14, 14]) mesh(new THREE.BoxGeometry(1.6, 21, 1.6), gm, 0, -10.5, z, { parent: g }); mesh(new THREE.BoxGeometry(1.6, 1.6, 30), gm, 0, -.8, 0, { parent: g }); mesh(new THREE.BoxGeometry(1.6, 1.6, 30), gm, 0, -20.2, 0, { parent: g });
    LIV.ventCol = { t: 'b', x0: 897.6, x1: 900, y0: 4, y1: 24, z0: -214, z1: -186 }; cols.push(LIV.ventCol); }
  box(900, 912, 3.4, 4, -214, -186, new THREE.MeshStandardMaterial({ color: 0xb8bec4, metalness: .85, roughness: .4 }), { col: false });
  // houseplant + toy ball for good measure
  cyl(860, -150, 14, 0, 26, new THREE.MeshPhysicalMaterial({ color: 0xe8e2d6, roughness: .4 }), { seg: 28 }); const leaf = furMat({ color: 0x3f7a33, len: 3, den: .45, droop: -.2, clump: .7, rimK: .12, root: .45 }); const lf = furMesh(new THREE.SphereGeometry(18, 28, 18), leaf); lf.position.set(860, 46, -150); LV.add(lf); for (const [r, y0, y1] of [[9, 28, 33], [14.5, 33, 38], [17.5, 38, 55], [14, 55, 60], [9, 60, 64]]) cols.push({ t: 'c', x: 860, z: -150, r, y0, y1 });
  const pb = new THREE.MeshPhysicalMaterial({ color: 0x4ab0e0, roughness: .3, clearcoat: .8 }); resGroup(cmGroup(14, 14, 14, ({ part }) => { part(new THREE.SphereGeometry(7, 28, 20), pb, 0, 0, 0); }, [pb]), 640, 120, 0, 14, 14, 14, .3, 5, '皮球', true);
  addBattery(420, 164, 212); addVial(670, 143, -200); addCrumb(480, 76.4, -110); addCrumb(740, 12, 150);
  // where the living room's lamps actually light you up (used by 'can they see me')
  if (DAY) KS.lights.push({ p: V3(775, 160, 226), dir: V3(0, -.4, -.92).normalize(), cos: Math.cos(.55), range: 300 });   // daylight from the window
  KS.lights.push({ p: V3(575, 150, 8), range: 170 }, { p: V3(490, 186, -130), dir: V3(0, -1, 0), cos: Math.cos(.95), range: 300 }, { p: V3(850, 95, 120), range: 150 }, { p: V3(700, 235, 20), range: 200 });
  buildSwitches(); updDoorSegs();
}
function livingPhoto(kind) {
  const [c, x] = cnv(256, 320); x.fillStyle = '#e9e1d2'; x.fillRect(0, 0, 256, 320);
  const g = x.createLinearGradient(0, 0, 0, 320); g.addColorStop(0, kind === 'photo3' ? '#9ac0d8' : '#c8a882'); g.addColorStop(1, '#5a4a3a'); x.fillStyle = g; x.fillRect(14, 14, 228, 292);
  x.fillStyle = 'rgba(40,30,25,.75)'; const fig = (cx, s) => { x.beginPath(); x.arc(cx, 150, 22 * s, 0, 7); x.fill(); x.fillRect(cx - 26 * s, 176, 52 * s, 120); };
  if (kind === 'photo') { fig(90, 1.1); fig(170, 1); } else if (kind === 'photo2') { fig(128, .8); } else { fig(70, 1); fig(130, .7); fig(190, 1.05); }
  return new THREE.MeshStandardMaterial({ map: tex(c), roughness: .5 });
}
// the swinging door is a row of boxes that overlap, so nothing slips between them at any angle
function updDoorSegs() {
  const a = LIV.a, dx = -Math.sin(a), dz = -Math.cos(a), nx = -dz, nz = dx, n = LIV.segs.length, LEN = 98;
  LIV.segs.forEach((c, i) => {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const t of [i * LEN / n, (i + 1) * LEN / n]) for (const s of [-2.4, 2.4]) { const x = 298 + dx * t + nx * s, z = 40 + dz * t + nz * s; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    c.x0 = x0; c.x1 = x1; c.z0 = z0; c.z1 = z1;
  });
}
function updLiving(dt) {
  if (!LIV.door) return;
  // the wedge is gone (pushed away, shrunk, or fell) → the draught opens the door
  if (!LIV.open && !NET.client) { const w = LIV.wedge; const moved = LIV.loose || Math.hypot(w.cx - LIV.wedge0.x, w.cz - LIV.wedge0.z) > 5 || w.target <= .5 || w.gone; if (moved) doorOpen(); }
  const tgt = LIV.open ? .62 : .025; const pa = LIV.a; LIV.a = damp(LIV.a, tgt, LIV.open ? 1.3 : 6, dt); LIV.door.rotation.y = LIV.a;
  if (Math.abs(LIV.a - pa) > 1e-5) updDoorSegs();
  LIV.gapLight.intensity = 300 + LIV.a * 4000;
  if (LIV.grille) LIV.grille.rotation.z = damp(LIV.grille.rotation.z, LIV.ventOpen ? 1.45 : 0, 3, dt);
  for (const f of LIV.fish) { f.ph += dt * .5; f.m.position.set(670 + Math.cos(f.ph) * f.r * 1.6, f.y + Math.sin(f.ph * 2.3) * 2, -207 + Math.sin(f.ph) * 10); f.m.rotation.y = -f.ph + Math.PI; }
  if (LIV.tvMat) { if (LIV.tvOff) { LIV.tvMat.color.setRGB(.015, .016, .02); LIV.tvLight.intensity = 0; } else { const fl = .9 + Math.sin(T * 7) * .05 + (rnd() < .04 ? .12 : 0); LIV.tvMat.color.setRGB(1.05 * fl, 1.05 * fl, 1.12 * fl); LIV.tvLight.intensity = 2200 * fl; if (LIV.tvMat.map) LIV.tvMat.map.offset.x = (T * .012) % 1; } }
  // pickups for the objectives
  const L = leader; if (LEVEL !== 'kitchen' || !L) return;
  for (const p of LIV.parts) { if (p.got || !KS.mp) continue; p.g.rotation.y += dt * 1.4; p.g.position.y = p.y + 2 + Math.sin(T * 2 + p.x) * .4; p.halo.position.set(p.x, p.g.position.y, p.z); p.halo.lookAt(camera.position);
    if (STATE === 'play' && !L.frozen && mine(L) && Math.hypot(L.pos.x - p.x, L.pos.y + 1 - p.y - 2, L.pos.z - p.z) < 4) netGet('part', LIV.parts.indexOf(p)); }
  if (remoteOn() && !LIV.remoteGot && LIV.remote && !L.frozen && mine(L) && STATE === 'play') { const r = LIV.remote; if (Math.hypot(L.pos.x - r.cx, L.pos.z - r.cz) < 6 && Math.abs(L.pos.y - (r.y0 + 2)) < 5) netGet('remote'); }
}
function remoteOn() { return KS.mp ? LIV.open && quest <= 3 : (KS.ch2 && quest === 1); }
// online chapter one: the objectives can be done in any order — skip whatever is already done
function mpAdvance() {
  if (!KS.mp || NET.client) return;
  if (quest === 0 && LIV.partsGot >= 3) setQuest(1);
  if (quest === 1 && LIV.open) setQuest(2);
  if (quest === 3 && LIV.remoteGot) setQuest(4);
}
// the quest card shows what's done so far, so a split team can see where help is needed
function mpChecklist() {
  if (!KS.mp || quest > 3 || LEVEL !== 'kitchen') { if (HX.ckShown) { $('qck').hidden = true; HX.ckShown = false; } return; }
  const it = (ok, t) => `<span class="${ok ? 'ok' : ''}">${ok ? '✓' : '○'} ${t}</span>`;
  const P = k => LIV.parts.find(p => p.kind === k);
  const html = it(P('spring') && P('spring').got, '彈簧') + it(P('cap') && P('cap').got, '電容') + it(P('lens') && P('lens').got, '鏡片') + it(LIV.open, '客廳門') + it(LIV.remoteGot, '遙控器電池');
  if (html !== HX.ck) { HX.ck = html; $('qck').innerHTML = html; } if (!HX.ckShown) { $('qck').hidden = false; HX.ckShown = true; }
}
function doorOpen() {
  if (LIV.open) return; LIV.open = true; SND.creak(); noise(V3(296, 0, -10), .6); const w = LIV.wedge; if (!w.gone) { w.svx = -34; w.svz = 0; }
  toastW('門擋移開了——一陣風把門吹開了！', 3);
  if (KS.mp) mpAdvance();
  else if (KS.ch2 && quest === 0) { setQuest(1); say('爸爸', '門開了！遙控器應該在沙發前面的咖啡枱上。', '#f5f0e6', 3); }
}
// someone picked up a part / the batteries (runs on the host, or directly in single player)
function livingGet(d, C) {
  if (d.k === 'part') {
    const p = LIV.parts[d.i]; if (!p || p.got) return; p.got = true; p.g.visible = false; p.halo.visible = false; LIV.partsGot = LIV.parts.filter(q => q.got).length; SND.pick();
    for (let i = 0; i < 24; i++) emit(V3(p.x, p.y + 2, p.z), V3(R(-10, 10), R(4, 18), R(-10, 10)), new THREE.Color(2, 1.6, .7), R(.15, .35), R(.4, 1), 30, 2);
    toastW(`${C.S.name}找到了${PART_NAME[p.kind]}！（零件 ${LIV.partsGot}/3）`, 3);
    if (LIV.partsGot >= 3 && quest === 0) { sayW('爸爸', LIV.open ? '三個零件齊了！門也開了——全隊去客廳！' : '三個零件齊了！下一步：打開去客廳的門。', '#f5f0e6', 3.2); mpAdvance(); }
  } else if (d.k === 'remote') {
    if (LIV.remoteGot) return; LIV.remoteGot = true; SND.pick(); const r = LIV.remote;
    for (let i = 0; i < 30; i++) emit(V3(r.cx, r.y0 + 3, r.cz), V3(R(-10, 10), R(4, 20), R(-10, 10)), new THREE.Color(.6, 2, 1.9), R(.15, .35), R(.4, 1), 30, 2);
    if (KS.mp) { if (quest === 3) { setQuest(4); toastW('電池到手！全隊到客廳最裡面的通風口集合', 3.4); sayW(C.S.name, '電池拿到了！去通風口！', C.S.col, 2.6); } else toastW(`${C.S.name}先拿到了遙控器的電池！其餘目標完成後就可以去通風口`, 3.4); }
    else {
      say('爸爸', '兩粒電池……夠核心撐一陣子了。', '#f5f0e6', 3.2); unlockKey('ch2');
      // chapter two is done; the vent behind the TV cabinet leads on to the garage — no stopping
      // the vent to the garage is rusted shut: the way there is up through the house and over the roof
      setTimeout(() => { roomBanner('核心又亮起來了'); rfHatch(true); QUESTS = SP_Q2B; setQuest(0); KS.ch3 = true; say('爸爸', '車房嘅工作枱可以修好縮小機……但通風口個蓋鏽死咗。', '#f5f0e6', 3.6);
        setTimeout(() => say('爸爸', '樓上有條路：女兒房天花有個閣樓活門，閣樓出得去屋頂，由屋頂落車房。', '#f5f0e6', 4.6), 3900);
        setTimeout(() => say('爸爸', '……順便，我想上去睇吓佢。', '#f5f0e6', 2.8), 8800); }, 2600);
    }
  }
}
// machine parts for the online co-op objective
function addPart(x, y, z, kind) {
  const g = new THREE.Group(); g.position.set(x, y + 2, z); LV.add(g);
  if (kind === 'spring') { const pts = []; for (let i = 0; i <= 80; i++) { const a = i / 80 * Math.PI * 10; pts.push(V3(Math.cos(a) * .9, i / 80 * 3 - 1.5, Math.sin(a) * .9)); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, .14, 6), MAT.copper)); }
  else if (kind === 'lens') { const l = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, .3, 32), new THREE.MeshPhysicalMaterial({ color: 0xcfefff, roughness: 0, transmission: .8, thickness: .4, transparent: true, opacity: .7 })); l.rotation.x = Math.PI / 2; g.add(l); const rim = new THREE.Mesh(new THREE.TorusGeometry(1.45, .16, 8, 32), MAT.brass); g.add(rim); }
  else { g.add(new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, 2.4, 20), new THREE.MeshStandardMaterial({ color: 0x2a5ad0, roughness: .4 }))); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 1.6, 6), MAT.steel); w.position.set(s * .35, -1.9, 0); g.add(w); } }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.5, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd27a).multiplyScalar(2.2), transparent: true, opacity: .5, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })); LVFX.add(halo);
  LIV.parts.push({ g, halo, x, y, z, kind, got: false });
}
const PART_NAME = { spring: '彈簧', lens: '鏡片', cap: '電容' };
const MP_QUESTS = [
  { t: '找齊三個零件', s: '彈簧在爐頭旁、電容在洗手盆下面的櫃、鏡片在廁所的鏡櫃。次序隨意，分頭行動最快——客廳門、遙控器電池都可以隨時先做' },
  { t: '打開通往客廳的門', s: '門被門擋卡住了——熊可以推開或拉走門擋，或者爸爸把它縮小' },
  { t: '全隊進入客廳', s: '所有玩家都要走過去（電腦隊友會跟着）' },
  { t: '拿走遙控器的電池', s: '遙控器在咖啡枱上——女兒在沙發看電視就引開她：關電視、熄燈、弄點聲音；或者派兩個人沿天花槽爬上她的房間，扭動音樂盒——她一定會跑上樓' },
  { t: '爬過通風口去車房', s: '電池到手，通風口的蓋打開了——全隊一齊爬過去' },
  { t: '弄跌監視鏡頭', s: '鐵架頂有部 Origin Dynamics 的監視鏡頭——爬上去把它推跌（熊推、阿刺撞都得）' },
  { t: '打開狗門的門扣', s: '側門下面有狗門，門扣太高——疊羅漢、跳跳跳上去，或者推木箱過去墊腳' },
  { t: '全隊由狗門出去後園', s: '所有玩家都要出去' },
  { t: '全隊穿過圍欄的爛板', s: '去隔籬陳伯的後園。小心灑水器，長草可以躲' },
  { t: '全隊從貓門進入陽光房', s: '鄰居的狗會吠，陳伯會望出來' },
  { t: '拿走書枱上的控制晶片', s: '陳伯的書枱在陽光房最入面' },
  { t: '全隊從前園的閘底鑽出去', s: '陳伯的前閘下面有條縫，外面就是行人路' },
  { t: '按過路燈的掣', s: '斑馬線燈柱半腰有個黃色的掣——爬上去按，或者疊羅漢' },
  { t: '全隊過馬路', s: '綠色公仔燈亮了才過。車輪會輾人，車身底下可以過；中間有安全島' },
  { t: '全隊到公園門口', s: '公園的鐵閘就在對面行人路' }
];
const SP_Q2B = [
  { t: '上樓去女兒房', s: '客廳後面嘅門口有樓梯，每一級都要爬。太太同女兒都可能會上嚟' },
  { t: '經天花活門上閣樓', s: '衣櫃頂旁邊吊住條拉繩：由衣櫃頂跳過去捉住佢，爬上閣樓。衣櫃隔籬啲收納箱可以幫你爬上衣櫃' }
];
function ventOpen() { if (LIV.ventOpen) return; LIV.ventOpen = true; LIV.ventCol.y0 = -999; LIV.ventCol.y1 = -998; SND.creak(); toastW('通風口的蓋打開了！', 2.6); }
function livingHost() { }

// what's on the TV: a cartoon landscape that slowly pans (the screen's colour sets brightness / off)
function tvShowTex() {
  const [c, x] = cnv(512, 160); const g = x.createLinearGradient(0, 0, 0, 160); g.addColorStop(0, '#7cc4f4'); g.addColorStop(1, '#d6f0ff'); x.fillStyle = g; x.fillRect(0, 0, 512, 160);
  x.fillStyle = '#fff6c8'; x.beginPath(); x.arc(400, 36, 16, 0, 7); x.fill();
  x.fillStyle = 'rgba(255,255,255,.9)'; for (const [cx, cy] of [[70, 30], [230, 22], [470, 48]]) { for (const [dx, dy, r] of [[0, 0, 12], [14, -5, 14], [28, 0, 11]]) { x.beginPath(); x.arc(cx + dx, cy + dy, r, 0, 7); x.fill(); } }
  const hill = (col, y0, a, f, ph) => { x.fillStyle = col; x.beginPath(); x.moveTo(0, 160); for (let i = 0; i <= 512; i += 8) x.lineTo(i, y0 - a * Math.sin(i / 512 * Math.PI * 2 * f + ph)); x.lineTo(512, 160); x.fill(); };
  hill('#8fd06a', 100, 14, 2, .5); hill('#5fb04a', 120, 10, 3, 2); hill('#3f8f3a', 142, 6, 4, 1);
  for (const [tx, ty] of [[60, 112], [150, 118], [300, 110], [440, 116]]) { x.fillStyle = '#6a4a2a'; x.fillRect(tx - 2, ty, 4, 14); x.fillStyle = '#2f7a34'; x.beginPath(); x.arc(tx, ty, 11, 0, 7); x.fill(); }
  x.fillStyle = '#f4f0e8'; x.fillRect(200, 104, 40, 26); x.fillStyle = '#d0503a'; x.beginPath(); x.moveTo(194, 106); x.lineTo(220, 86); x.lineTo(246, 106); x.fill(); x.fillStyle = '#5a7aa8'; x.fillRect(210, 112, 9, 9); x.fillRect(224, 112, 9, 9);
  const t = tex(c); t.repeat.set(.5, 1); return t;
}
