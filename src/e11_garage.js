
// =====================================================================
//  第三章 · 車房 — through the vent duct at the far end of the living room
//  A man from Origin Dynamics is searching the garage with a torch, and a security camera
//  sweeps the room from the top of the metal shelving.
//  Single player: up to the workbench → take the coil from the old radio → fit it to Dad's old
//  machine base → out through the dog flap in the side door (its latch is too high for one person).
//  Online: knock the camera off the shelf → open the dog-flap latch → everyone out to the yard.
// =====================================================================
const GY = -20; // garage floor
const GS = { agent: null, cam: null, camBroken: false, latch: false, flapA: 0, coil: false, dock: false, lights: [], said: {}, mode: 'patrol', node: 0, wait: 0, trackT: 0 };
function slick() { cols[cols.length - 1].slick = true; }
function noRay() { cols[cols.length - 1].noRay = true; }

// ---------- a full-size person (the Origin Dynamics man, the neighbour) ----------
function buildHuman(o) {
  const H = { pos: V3(), yaw: 0, phase: 0, amp: 0, legs: [], arms: [], aim: V3(), aimT: V3() };
  const g = new THREE.Group(); scene.add(g); H.root = g;
  const mk = (geo, mat, parent, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const pelvis = new THREE.Group(); pelvis.position.y = 90; g.add(pelvis); H.pelvis = pelvis;
  mk(ell(18, 12, 12, 32, 20), o.pants, pelvis, 0, 0, 0);
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 9.5, -2, 0); pelvis.add(hip); mk(capG(8, 30), o.pants, hip, 0, -22, 0);
    const knee = new THREE.Group(); knee.position.y = -44; hip.add(knee); mk(capG(6, 30), o.pants, knee, 0, -20, 0);
    const ankle = new THREE.Group(); ankle.position.y = -40; knee.add(ankle); mk(ell(6, 4.6, 14, 24, 14), o.shoe, ankle, 0, -2.5, 4.5);
    H.legs.push({ hip, knee, ankle, s });
  }
  const chest = new THREE.Group(); chest.position.y = 4; pelvis.add(chest); H.chest = chest;
  const tp = [[16, 0], [17.5, 10], [18, 24], [19.5, 40], [17, 50], [8, 56]].map(p => new THREE.Vector2(p[0], p[1]));
  const torso = mk(new THREE.LatheGeometry(tp, 40), o.top, chest, 0, 0, 0); torso.scale.z = .66;
  mk(new THREE.CylinderGeometry(4.8, 5.2, 9, 20), o.skin, chest, 0, 59, 0);
  const head = new THREE.Group(); head.position.y = 70; chest.add(head); H.head = head;
  mk(ell(9, 11.4, 10.2, 40, 28), o.skin, head, 0, 0, 1);
  if (o.hair) { const hm = furMat({ color: o.hair, len: .9, den: 2, droop: .6, clump: .5, rimK: .08, root: .5, rough: .7 }); const h = furMesh(ell(9.5, o.bald ? 6 : 10.6, 10.6, 40, 28), hm); h.position.set(0, o.bald ? -1 : 2, -1.6); head.add(h); }
  if (o.cap) { mk(new THREE.SphereGeometry(10.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), o.cap, head, 0, 3, -.5).scale.y = .75; const pk = mk(new THREE.CylinderGeometry(8, 8, .8, 24, 1, false, -Math.PI / 2, Math.PI), o.cap, head, 0, 3.2, 6); pk.rotation.x = .12; if (o.badge) { const b = mk(new THREE.CircleGeometry(2.2, 20), o.badge, head, 0, 7.4, 9.6); b.rotation.x = -.5; } }
  if (o.glasses) for (const s of [-1, 1]) mk(new THREE.TorusGeometry(2.2, .3, 6, 20), MAT.dsteel, head, s * 3.6, 1.5, 9.8);
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 19.5, 46, 0); chest.add(sh); mk(capG(4.8, 21), o.top, sh, 0, -13, 0);
    const el = new THREE.Group(); el.position.y = -28; sh.add(el); mk(capG(4, 18), o.top, el, 0, -11, 0);
    const hand = mk(ell(3.3, 4.8, 2.2, 16, 12), o.skin, el, 0, -25, 0); H.arms.push({ sh, el, hand, s });
  }
  if (o.badge) { const b = mk(new THREE.CircleGeometry(3.2, 24), o.badge, chest, -9, 40, 12.2); b.rotation.y = -.35; }
  return H;
}
// walking / standing animation shared by the people
function humanAnim(H, moveD, dt) {
  H.root.position.copy(H.pos); H.root.rotation.y = H.yaw;
  H.phase += moveD / 64 * Math.PI; const ph = H.phase; const walking = moveD > 0; H.amp = walking ? .42 : damp(H.amp, 0, 4, dt); const a = H.amp / .42;
  for (const L of H.legs) { const x = Math.sin(ph) * L.s * H.amp; L.hip.rotation.x = -x; L.knee.rotation.x = .08 + Math.max(0, Math.cos(ph) * L.s) * .75 * a; L.ankle.rotation.x = -(L.hip.rotation.x + L.knee.rotation.x) * .6; }
  H.pelvis.position.y = 90 + Math.abs(Math.cos(ph)) * 1.6 * a - .8;
  return Math.floor((ph - moveD / 64 * Math.PI) / Math.PI) !== Math.floor(ph / Math.PI) && walking;
}
// head / torch-arm aim toward H.aim
function humanAimArm(H, arm, dt) {
  H.root.updateMatrixWorld(true);
  const hp = V3(); H.head.getWorldPosition(hp); const ad = V3().subVectors(H.aim, hp); const yr0 = Math.atan2(ad.x, ad.z) - H.yaw; const yr = Math.atan2(Math.sin(yr0), Math.cos(yr0)); const pitch = Math.atan2(-ad.y, Math.hypot(ad.x, ad.z));
  H.head.rotation.y = damp(H.head.rotation.y, clamp(yr, -.9, .9), 4, dt); H.head.rotation.x = damp(H.head.rotation.x, clamp(pitch * .6, -.3, .7), 4, dt);
  if (arm) { const A = H.arms[arm]; A.sh.rotation.set(-.62 - clamp(-pitch, -.5, .9) * .35, clamp(yr, -.7, .7) * .5, 0); A.el.rotation.x = -1.05 + clamp(pitch, -.2, 1.1) * .45; }
  return { yr, pitch };
}
// "can this eye see the leader?" with an explicit eye position and forward direction
function seeFrom(eye, fwd, fovCos, range) {
  const L = leader; const tp = V3(L.pos.x, L.pos.y + L.h * .55, L.pos.z); const d = V3().subVectors(tp, eye); const dist = d.length(); d.divideScalar(dist);
  const c = d.dot(fwd); if (dist > range || c < fovCos) return 0; if (rayBlocked(eye, d, dist - 1.2, false)) return 0;
  return clamp(1.25 - dist / range, .2, 1) * (.5 + .5 * sstep(fovCos, 1, c));
}
function litAtList(p, list, dark) { for (const l of list) { if (l.on === false || (l.I && l.I() <= 0)) continue; const d = V3().subVectors(p, l.p); const dist = d.length(); if (dist > l.range) continue; d.divideScalar(dist); if (l.cos && d.dot(l.dir) < l.cos) continue; if (!rayBlocked(l.p, d, dist - 1, false)) return 1; } return dark ?? .3; }

// ---------- textures ----------
function genGarageConcrete() {
  const W = 512, n = noiseField(W, W, 5, 4, 401), n2 = noiseField(W, W, 2, 48, 402), st = noiseField(W, W, 3, 2, 403); const h = new Float32Array(W * W);
  const c = fromFn(W, W, (x, y, i, o) => { let v = .62 + (n[i] - .5) * .16 + (n2[i] - .5) * .08; if (hashI(i * 13 + 7) > .985) v -= .12; const oil = sstep(.62, .78, st[i]) * .22; v -= oil; if (x % 256 < 2 || y % 256 < 2) v -= .18; o[0] = v * 168; o[1] = v * 166; o[2] = v * 160; h[i] = n2[i] * .6 + (x % 256 < 2 || y % 256 < 2 ? -.4 : 0); });
  return { map: tex(c), normalMap: normalTex(h, W, W, 1.2) };
}
function genPeg() { const W = 256; const [c, x] = cnv(W, W); x.fillStyle = '#b89a72'; x.fillRect(0, 0, W, W); x.fillStyle = 'rgba(40,28,16,.85)'; for (let i = 8; i < W; i += 16) for (let j = 8; j < W; j += 16) { x.beginPath(); x.arc(i, j, 2.6, 0, 7); x.fill(); } return tex(c); }
function genPlate(t) { const [c, x] = cnv(256, 128); x.fillStyle = '#f2f0e8'; x.fillRect(0, 0, 256, 128); x.strokeStyle = '#2a3c6a'; x.lineWidth = 6; x.strokeRect(6, 6, 244, 116); x.fillStyle = '#2a3c6a'; x.font = '700 64px Fredoka,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 128, 70); x.font = '600 16px Fredoka'; x.fillText('ONTARIO', 128, 22); return new THREE.MeshStandardMaterial({ map: tex(c), roughness: .4, metalness: .3 }); }
function genSiding(col, sd) { const W = 512, n = noiseField(W, W, 3, 8, sd); const h = new Float32Array(W * W); const b = hex(col); const c = fromFn(W, W, (x, y, i, o) => { const r = y % 64; const sh = r < 4 ? .7 : .92 + r / 64 * .1; const v = sh + (n[i] - .5) * .06; o[0] = b[0] * v; o[1] = b[1] * v; o[2] = b[2] * v; h[i] = r / 64; }); return { map: tex(c), normalMap: normalTex(h, W, W, 2) }; }

// lines the single-player team up at a point (used when a chapter is started from the list)
function spawnSP(p, camYaw, gap) {
  if (!NET.on && !party.includes(chars.cham)) joinCham(); PROTO = Math.max(PROTO, 1);
  const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw), OFF = [[0, 0], [.3, -1.4], [.3, 1.4], [-.2, -2.8], [-.2, 2.8], [-1.2, -.7], [-1.2, .7], [-1.4, 2]];
  party.forEach((C, i) => { const [b, s] = OFF[i % 8]; C.pos.set(p[0] + fx * b * gap - fz * s * gap * .8, p[1], p[2] + fz * b * gap + fx * s * gap * .8); C.yaw = camYaw + Math.PI; C.state = 'idle'; C.wave = false; C.root.visible = true; C.lieK = 0; });
  if (party.includes(chars.dad)) leader = chars.dad; mom.root.visible = false; momReset();
  cam.yaw = camYaw; cam.pitch = .14;
}
// ---------- build ----------
function buildGarage() {
  const K = kitchenMats(), M = MAT;
  const con = genGarageConcrete();
  const floorM = new THREE.MeshStandardMaterial({ ...con, roughness: .85, normalScale: new THREE.Vector2(.6, .6) });
  const wallM = new THREE.MeshStandardMaterial({ ...genPlaster(0xbfc2bf, 411), roughness: .95 });
  const ceilM = new THREE.MeshStandardMaterial({ color: 0x9a9c9a, roughness: 1 });
  const doorM = new THREE.MeshStandardMaterial({ color: 0xd8d6cf, roughness: .55, metalness: .2 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x8a9096, metalness: .8, roughness: .45 });
  const wood = new THREE.MeshStandardMaterial({ ...genWood([168, 128, 86], [96, 68, 44], 421), roughness: .7 });
  const X0 = 912, X1 = 1460, Z0 = -260, Z1 = 310;
  // ---- shell ----
  box(X0, X1, GY - 10, GY, Z0, Z1, floorM, { uv: 160, cast: false });
  box(X0, X1, 270, 280, Z0, Z1, ceilM, { cast: false });
  // west wall, with the duct from the living room's vent (z -214…-186, y 4…24)
  box(X0, 920, GY, 270, Z0, -214, wallM, { uv: 120 }); box(X0, 920, GY, 270, -186, Z1, wallM, { uv: 120 }); box(X0, 920, GY, 4, -214, -186, wallM, { uv: 120 }); box(X0, 920, 24, 270, -214, -186, wallM, { uv: 120 });
  const ductM = new THREE.MeshStandardMaterial({ color: 0xb8bec4, metalness: .85, roughness: .4 });
  box(920, 922, 1, 4, -216, -184, ductM, { col: false }); box(920, 922, 24, 27, -216, -184, ductM, { col: false }); box(920, 922, 4, 24, -217, -214, ductM, { col: false }); box(920, 922, 4, 24, -186, -183, ductM, { col: false });
  box(X0, X1, GY, 270, Z0 - 8, Z0, wallM, { uv: 120 });
  // east wall with the side door (z 60…150) — the door is metal: too smooth to climb
  box(1452, X1, GY, 270, Z0, 60, wallM, { uv: 120 }); box(1452, X1, GY, 270, 150, Z1, wallM, { uv: 120 }); box(1452, X1, 190, 270, 60, 150, wallM, { uv: 120 });
  box(1453, 1457, 18, 190, 60, 150, doorM); slick(); box(1453, 1457, GY, 18, 60, 90, doorM); slick(); box(1453, 1457, GY, 18, 120, 150, doorM); slick();
  box(1451.5, 1453, 186, 190, 58, 152, M.white, { col: false }); box(1451.5, 1453, GY, 190, 56, 60, M.white, { col: false }); box(1451.5, 1453, GY, 190, 150, 154, M.white, { col: false });
  const knob = mesh(new THREE.SphereGeometry(3, 16, 12), K.brass, 1450, 80, 140); knob.scale.set(.7, 1, 1);
  // dog flap: a hinged plastic flap, held shut by a latch above it
  const fg = new THREE.Group(); fg.position.set(1455, 18, 105); LV.add(fg); GS.flap = fg;
  const fm = new THREE.MeshPhysicalMaterial({ color: 0x3a3a40, roughness: .3, transparent: true, opacity: .82 });
  mesh(new THREE.BoxGeometry(1.2, 37, 29), fm, 0, -18.5, 0, { parent: fg }); box(1450.5, 1457.5, 17, 19, 89, 121, M.dsteel, { col: false }); box(1450.5, 1457.5, GY, 19, 88, 90, M.dsteel, { col: false }); box(1450.5, 1457.5, GY, 19, 120, 122, M.dsteel, { col: false });
  GS.flapCol = { t: 'b', x0: 1452, x1: 1458, y0: GY, y1: 18, z0: 90, z1: 120, slick: true }; cols.push(GS.flapCol);
  const lg = new THREE.Group(); lg.position.set(1451.6, GY + 13, 123); LV.add(lg); GS.latchM = lg;
  mesh(new THREE.BoxGeometry(1.2, 2.2, 8), K.brass, 0, 0, -3, { parent: lg }); mesh(new THREE.TorusGeometry(1.4, .4, 6, 14), K.brass, 0, 0, 1.4, { parent: lg }).rotation.y = Math.PI / 2;
  GS.latchP = V3(1449, GY + 13, 121);
  // south wall: the big sectional garage door (street light leaks under it)
  box(X0, 940, GY, 270, 302, Z1, wallM, { uv: 120 }); box(1430, X1, GY, 270, 302, Z1, wallM, { uv: 120 }); box(940, 1430, 200, 270, 302, Z1, wallM, { uv: 120 });
  box(940, 1430, GY + 2, 200, 300, 304, doorM, { uv: 0 }); cols.push({ t: 'b', x0: 940, x1: 1430, y0: GY, y1: GY + 2, z0: 300, z1: 304 });
  for (let i = 0; i < 4; i++) { const y = GY + 4 + i * 54; box(944, 1426, y + 46, y + 48, 299, 300, metal, { col: false }); for (let j = 0; j < 6; j++) box(950 + j * 80, 1020 + j * 80, y + 8, y + 40, 299.4, 300, new THREE.MeshStandardMaterial({ color: 0xc8c6bf, roughness: .6 }), { col: false, cast: false }); }
  mesh(new THREE.PlaneGeometry(488, 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffb070).multiplyScalar(2.2) }), 1185, GY + 1, 299.8, { cast: false }).rotation.y = Math.PI;
  box(1175, 1195, 40, 100, 297, 300, metal, { col: false }); // opener track
  box(1180, 1190, 100, 270, 140, 300, metal, { col: false });
  box(1150, 1220, 250, 268, 120, 160, new THREE.MeshStandardMaterial({ color: 0x6a6e72, roughness: .5 }), { col: false });
  // ---- the car ----
  buildCar(1150, 50);
  // ---- workbench along the back wall (top 90 cm above the floor) ----
  const BT = GY + 90; GS.benchY = BT;
  box(1180, 1440, BT - 8, BT, -260, -196, wood, { uv: 80 });
  for (const x of [1184, 1430]) { box(x, x + 6, GY, BT - 8, -202, -196, wood); box(x, x + 6, GY, BT - 8, -258, -252, wood); }
  box(1184, 1436, GY + 18, GY + 22, -258, -198, wood, { uv: 80 });
  for (let i = 0; i < 3; i++) box(1196 + i * 66, 1250 + i * 66, GY + 22, GY + 52, -254, -210, i === 1 ? M.cardC : M.cardB, { uv: 0 });
  box(1180, 1440, BT + 8, 210, -260, -258, new THREE.MeshStandardMaterial({ map: genPeg(), roughness: .9 }), { uv: 0 });
  // tools hanging on the pegboard
  const toolM = new THREE.MeshStandardMaterial({ color: 0xc23a2a, roughness: .5 }); const handleM = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: .6 });
  box(1210, 1214, 130, 170, -257.5, -255.5, handleM, { col: false }); box(1202, 1222, 168, 176, -257.5, -254.5, metal, { col: false });
  box(1250, 1256, 120, 175, -257.5, -256.5, metal, { col: false }); box(1246, 1260, 172, 182, -257.5, -256.5, metal, { col: false });
  for (let i = 0; i < 5; i++) { box(1290 + i * 9, 1293 + i * 9, 130, 150, -257.5, -255.5, i % 2 ? toolM : M.capRed, { col: false }); box(1290.8 + i * 9, 1292.2 + i * 9, 150, 172, -257.5, -256.5, metal, { col: false }); }
  box(1350, 1420, 140, 180, -257.8, -257.2, metal, { col: false }); box(1350, 1362, 132, 182, -257.6, -255.6, handleM, { col: false });
  box(1180, 1440, 210, 214, -260, -236, wood);
  box(1190, 1240, 214, 244, -258, -238, M.cardB, { uv: 0 }); box(1330, 1360, 214, 240, -258, -240, M.paintRed);
  // stepladder leaning beside the bench: rungs to climb and stand on
  for (const z of [-250, -214]) box(1162, 1166, GY, BT + 6, z, z + 3, metal);
  for (let i = 0; i < 4; i++) { const y = GY + 14 + i * 22; box(1158, 1170, y, y + 2.4, -250, -211, metal); }
  // vice, old radio (with the coil), machine base, toolbox, jars, lamp
  box(1188, 1210, BT, BT + 12, -214, -200, M.dsteel); box(1194, 1204, BT + 12, BT + 18, -212, -196, M.dsteel);
  const radio = new THREE.MeshPhysicalMaterial({ color: 0x5a3018, roughness: .35, clearcoat: .6 });
  box(1270, 1312, BT, BT + 24, -252, -228, radio); box(1274, 1300, BT + 6, BT + 20, -228, -227.4, new THREE.MeshStandardMaterial({ color: 0xd8c08a, roughness: .7 }), { col: false });
  for (const x of [1304, 1308]) cyl(x, -227, 1.6, BT + 10, BT + 13, M.dsteel, { col: false, seg: 12 });
  // the coil (single player): copper winding sitting at the radio's open back
  { const g = new THREE.Group(); g.position.set(1291, BT + 1.6, -218); LV.add(g); const pts = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 16; pts.push(V3(Math.cos(a) * 1.6, -1 + i / 120 * 2.6, Math.sin(a) * 1.6)); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, .22, 6), MAT.copper)); g.add(new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, 3.4, 12), M.dsteel)); g.traverse(o => { o.castShadow = true; }); GS.coilM = g; GS.coilP = V3(1291, BT, -218); }
  // Dad's old machine base
  box(1364, 1396, BT, BT + 4, -244, -212, M.dsteel); GS.dockRing = mesh(new THREE.TorusGeometry(11, 1.2, 10, 40), MAT.copper, 1380, BT + 16, -232); GS.dockGlow = mesh(new THREE.TorusGeometry(9.4, .5, 8, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x5ff2e6).multiplyScalar(.15) }), 1380, BT + 16, -232, { cast: false });
  for (const s of [-1, 1]) box(1380 + s * 12 - 1.5, 1380 + s * 12 + 1.5, BT + 4, BT + 16, -234, -230, M.dsteel, { col: false });
  GS.dockP = V3(1380, BT + 4, -228);
  box(1220, 1256, BT, BT + 18, -252, -232, M.capRed); box(1230, 1246, BT + 18, BT + 21, -244, -240, M.dsteel, { col: false });
  const jarM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .05, transparent: true, opacity: .35, depthWrite: false }); const screwM = new THREE.MeshStandardMaterial({ color: 0x9a9aa0, metalness: .8, roughness: .4 });
  [[1330, -206], [1344, -212]].forEach(([x, z]) => resGroup(cmGroup(8, 12, 8, ({ part }) => { part(new THREE.CylinderGeometry(4, 4, 12, 24, 1, true), jarM, 0, 0, 0); part(new THREE.CylinderGeometry(3.6, 3.6, 5, 16), screwM, 0, -3.4, 0); part(new THREE.CylinderGeometry(4.2, 4.2, 1.6, 24), M.capRed, 0, 6.6, 0); }, [jarM]), x, z, BT, 8, 12, 8, .3, 5, '螺絲樽', true));
  cyl(1424, -232, 6, BT, BT + 2, M.black, { seg: 20 }); tubeM([[1424, BT + 2, -232], [1426, BT + 30, -240], [1422, BT + 46, -230]], .6, M.black, 20);
  mesh(new THREE.ConeGeometry(7, 9, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a5a3a, roughness: .5, side: THREE.DoubleSide }), 1418, BT + 42, -226, { cast: false }).rotation.z = .5;
  GS.lampL = pointL(0xffc890, 2600, 1414, BT + 36, -222);
  // ---- metal shelving on the west wall (the security camera sits on top) ----
  for (const [x, z] of [[922, 20], [973, 20], [922, 227], [973, 227]]) box(x, x + 3, GY, 222, z, z + 3, metal);
  for (const y of [GY + 22, 72, 122, 172, 222]) box(922, 976, y - 3, y, 20, 230, metal, { uv: 40 });
  box(926, 970, 72, 100, 150, 222, M.cardB, { uv: 0 }); box(928, 966, 122, 144, 30, 80, M.cardC, { uv: 0 });
  const paint = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: .4, metalness: .5 });
  [[944, GY + 22, 60, 0x3a6ea8], [952, 72, 40, 0xd8c23a], [948, 172, 60, 0xe8e2d6]].forEach(([x, y, z, c]) => { const pm = paint(c); resGroup(cmGroup(18, 20, 18, ({ part }) => { part(new THREE.CylinderGeometry(9, 9, 20, 28), pm, 0, 0, 0); part(new THREE.TorusGeometry(8.4, .5, 6, 28), MAT.dsteel, 0, 10, 0).rotation.x = Math.PI / 2; }, [pm]), x, z, y, 18, 20, 18, .3, 4, '油漆罐', true); });
  // the camera: a pushable box on the top shelf — knock it off and it stops watching
  { const camBody = new THREE.MeshStandardMaterial({ color: 0xe8e8ea, roughness: .4 }); let head = null, lens = null, led = null;
    const r = resGroup(cmGroup(14, 14, 14, ({ I, part }) => {
      part(new THREE.BoxGeometry(10, 3, 10), camBody, 0, -5.5, 0);
      head = new THREE.Group(); head.position.set(0, 1, 0); I.add(head);
      part(new THREE.BoxGeometry(8, 7, 13), camBody, 0, 0, 0, { p: head }); lens = part(new THREE.CylinderGeometry(2.4, 2.8, 2.4, 20), new THREE.MeshPhysicalMaterial({ color: 0x0a0a10, roughness: .05, clearcoat: 1 }), 0, 0, 7.2, { p: head }); lens.rotation.x = Math.PI / 2;
      led = part(new THREE.SphereGeometry(.7, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff2a2a).multiplyScalar(3) }), 3, 2.6, 6.6, { p: head });
      part(new THREE.CircleGeometry(1.6, 20), crewMats().badge, -2.5, 2.6, 6.6, { p: head });
    }, [camBody]), 950, 125, 222, 14, 14, 14, .4, 3, '監視鏡頭', true);
    GS.cam = r; GS.camHead = head; GS.camLens = lens; GS.camLed = led; GS.camLight = new THREE.PointLight(0xff3030, 30, 0, 2); head.add(GS.camLight); GS.camLight.position.set(3, 2.6, 7); }
  // ---- other garage things ----
  const binM = new THREE.MeshStandardMaterial({ color: 0x2f4a3a, roughness: .6 });
  cyl(1410, 255, 28, GY, GY + 96, binM, { seg: 28 }); cyl(1410, 255, 30, GY + 96, GY + 100, binM, { seg: 28 });
  cyl(1350, 268, 28, GY, GY + 96, new THREE.MeshStandardMaterial({ color: 0x2a4a8a, roughness: .6 }), { seg: 28 }); cyl(1350, 268, 30, GY + 96, GY + 100, new THREE.MeshStandardMaterial({ color: 0x2a4a8a, roughness: .6 }), { seg: 28 });
  // lawn mower
  const mowM = new THREE.MeshStandardMaterial({ color: 0xc83a2a, roughness: .45, metalness: .3 });
  box(1330, 1380, GY + 8, GY + 30, 120, 170, mowM); for (const [x, z] of [[1332, 124], [1378, 124], [1332, 166], [1378, 166]]) { const w = mesh(new THREE.CylinderGeometry(8, 8, 4, 20), M.black, x, GY + 8, z); w.rotation.z = Math.PI / 2; }
  tubeM([[1355, GY + 30, 170], [1355, GY + 70, 200], [1355, GY + 92, 214]], 1.2, M.black, 20); box(1335, 1375, GY + 90, GY + 94, 212, 216, M.black, { col: false });
  // boxes & things to push around
  resGroup(cmGroup(40, 24, 40, ({ part }) => { part(new THREE.BoxGeometry(40, 24, 40), M.cardB, 0, 0, 0); part(new THREE.BoxGeometry(40.4, 2, 6), new THREE.MeshStandardMaterial({ color: 0xc8b48a, roughness: .5 }), 0, 12, 0); }, [M.cardB]), 943, -200, GY, 40, 24, 40, .4, 2.5, '紙箱', true);
  const crateM = new THREE.MeshStandardMaterial({ ...genWood([186, 150, 104], [120, 92, 60], 431, 4), roughness: .8 });
  resGroup(cmGroup(24, 20, 24, ({ part }) => { part(new THREE.BoxGeometry(24, 20, 24), crateM, 0, 0, 0); }, [crateM]), 1400, 30, GY, 24, 20, 24, .4, 3, '木箱', true);
  const ballM = new THREE.MeshStandardMaterial({ color: 0xd8f04a, roughness: .9 }); resGroup(cmGroup(7, 7, 7, ({ part }) => { part(new THREE.SphereGeometry(3.5, 24, 16), ballM, 0, 0, 0); }, [ballM]), 1300, 60, GY, 7, 7, 7, .4, 8, '網球', true);
  const toyCar = new THREE.MeshPhysicalMaterial({ color: 0xe03a3a, roughness: .3, clearcoat: .8 });
  resGroup(cmGroup(10, 5, 18, ({ part }) => { part(new THREE.BoxGeometry(10, 3, 18), toyCar, 0, -.5, 0); part(new THREE.BoxGeometry(8, 2.4, 8), toyCar, 0, 2, -1); for (const [x, z] of [[-5, -6], [5, -6], [-5, 6], [5, 6]]) part(new THREE.CylinderGeometry(1.8, 1.8, 1.4, 14), MAT.black, x, -1.8, z, { r: [0, 0, Math.PI / 2] }); }, [toyCar]), 1000, 262, GY, 10, 5, 18, .4, 6, '玩具車', true);
  // lights
  LV.add(new THREE.HemisphereLight(0x707884, 0x34302a, 1.6));
  const tube = (x, z) => { box(x - 60, x + 60, 262, 270, z - 8, z + 8, new THREE.MeshStandardMaterial({ color: 0xd0d4d8, roughness: .5 }), { col: false }); return mesh(new THREE.BoxGeometry(110, 2, 4), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdfeaff, emissiveIntensity: 3 }), x, 261, z, { cast: false }); };
  tube(1180, -60); GS.tubeB = tube(1300, 160); tube(1020, 120);
  GS.tubeAL = spotL(0xdfe8ff, 230000, V3(1180, 258, -60), V3(1180, GY, -60), 1.05, .7, 1024, 10, 500);
  GS.tubeBL = pointL(0xcfdcff, 70000, 1300, 250, 160); GS.tubeCL = pointL(0xd8e2ff, 52000, 1020, 250, 120);
  GS.streetL = pointL(0xffa860, 1600, 1185, GY + 6, 290);
  // the man's torch (moved every frame)
  GS.torch = new THREE.SpotLight(0xfff0dc, 0, 0, .34, .45, 2); GS.torch.castShadow = true; GS.torch.shadow.mapSize.setScalar(TOUCH ? 512 : 1024); GS.torch.shadow.camera.near = 4; GS.torch.shadow.camera.far = 700; GS.torch.shadow.bias = -.0005; GS.torch.shadow.normalBias = .04; LV.add(GS.torch, GS.torch.target);
  GS.lights = [{ p: V3(1180, 258, -60), dir: V3(0, -1, 0), cos: Math.cos(1.05), range: 330, I: () => GS.tubeAL.intensity }, { p: V3(1300, 250, 160), range: 220, I: () => GS.tubeBL.intensity }, { p: V3(1020, 250, 120), range: 200, I: () => GS.tubeCL.intensity }, { p: V3(1414, BT + 36, -222), range: 70, I: () => GS.lampL.intensity }, { p: V3(1185, GY + 6, 290), range: 60 }];
  // pickups
  addBattery(1150, 121.4, -30); addBattery(946, 222, 205); addVial(1150, GY, 40); addCrumb(1010, GY, -120); addCrumb(1320, BT, -204);
  // frog: power strips
  addSwitch('工作枱的拖板', [1196, GY + 1.5, -194], [1300, 0, -210], 150, { list: 'garage' });
  addSwitch('車房燈的插座', [930, GY + 1.5, -160], [1180, 0, 0], 300, { list: 'garage' });
  box(1190, 1204, GY, GY + 3, -197, -191, M.white); box(924, 936, GY, GY + 3, -164, -156, M.white);
  // the Origin Dynamics man
  const coverall = new THREE.MeshPhysicalMaterial({ color: 0x59636e, roughness: .85, sheen: .4, sheenColor: 0x9aa4b0 });
  const H = buildHuman({ pants: coverall, top: coverall, skin: MAT.skin, shoe: new THREE.MeshStandardMaterial({ color: 0x1e1c1a, roughness: .5 }), cap: new THREE.MeshStandardMaterial({ color: 0x1f2a44, roughness: .7 }), badge: crewMats().badge, hair: 0x241a14 });
  const torchM = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 16, 14), M.dsteel); torchM.position.set(0, -26, 6); torchM.rotation.x = 1.3; H.arms[1].el.add(torchM);
  const lensM = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2e0).multiplyScalar(10) })); lensM.position.set(0, 8.4, 0); torchM.add(lensM); H.lens = lensM;
  H.pos.set(1310, GY, 60); H.yaw = Math.PI; H.root.visible = true; GS.agent = H;
  GS.beam = beamMesh(0xfff0dc, 420, .34, 0); beams.push({ m: GS.beam, o: V3(), d: V3(0, -1, 0), ca: Math.cos(.36), len: 420, c: new THREE.Color(0xfff0dc), k: 0 }); GS.beamRec = beams[beams.length - 1];
}
function buildCar(cx, cz) {
  const paint = new THREE.MeshPhysicalMaterial({ color: 0x24456a, roughness: .32, metalness: .45, clearcoat: 1, clearcoatRoughness: .08 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0c1218, roughness: .05, metalness: .2, clearcoat: 1, transparent: true, opacity: .88 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xdfe4ea, metalness: 1, roughness: .18 });
  const tire = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: .9 });
  const x0 = cx - 86, x1 = cx + 86, zf = cz + 220, zb = cz - 218; // front faces the garage door
  const prof = (pts) => { const s = new THREE.Shape(); pts.forEach(([z, y], i) => i ? s.lineTo(z, y) : s.moveTo(z, y)); return s; };
  const ex = (shape, mat, w, xo) => { const g = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: true, bevelThickness: 3, bevelSize: 3, bevelSegments: 3, curveSegments: 6 }); g.rotateY(-Math.PI / 2); const m = mesh(g, mat, xo, 0, 0); return m; };
  const L = (z) => cz + z;
  ex(prof([[L(-218), -2], [L(218), -2], [L(222), 30], [L(214), 56], [L(140), 62], [L(62), 68], [L(-160), 70], [L(-206), 64], [L(-220), 36]]), paint, 166, x1 - 3);
  ex(prof([[L(62), 68], [L(14), 116], [L(-118), 120], [L(-168), 72], [L(-160), 68]]), glass, 150, x1 - 11);
  box(x0 + 14, x1 - 14, 118, 122, L(-112), L(10), paint, { col: false });
  for (const s of [-1, 1]) box(cx + s * 70 - 2, cx + s * 70 + 2, 66, 120, L(-24), L(-20), paint, { col: false });
  // lights, grille, plates, mirrors, bumpers
  for (const s of [-1, 1]) { mesh(new THREE.BoxGeometry(30, 10, 3), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4dd, emissiveIntensity: .25 }), cx + s * 58, 44, L(222), { cast: false }); mesh(new THREE.BoxGeometry(30, 9, 3), new THREE.MeshStandardMaterial({ color: 0x400808, emissive: 0xff1a1a, emissiveIntensity: .5 }), cx + s * 58, 50, L(-221), { cast: false }); mesh(new THREE.BoxGeometry(14, 8, 4), paint, cx + s * 92, 76, L(52)); }
  box(cx - 40, cx + 40, 20, 34, L(220), L(224), new THREE.MeshStandardMaterial({ color: 0x111214, roughness: .4 }), { col: false });
  mesh(new THREE.PlaneGeometry(52, 26), genPlate('BN 3385'), cx, 30, L(-222), { cast: false }).rotation.y = Math.PI;
  box(x0 + 2, x1 - 2, 6, 14, L(222), L(228), chrome, { col: false }); box(x0 + 2, x1 - 2, 6, 14, L(-226), L(-220), chrome, { col: false });
  // wheels (climbable)
  for (const z of [L(150), L(-150)]) for (const s of [-1, 1]) {
    const x = cx + s * 74; const w = mesh(new THREE.CylinderGeometry(33, 33, 22, 40), tire, x, GY + 33, z); w.rotation.z = Math.PI / 2;
    const hb = mesh(new THREE.CylinderGeometry(18, 18, 22.6, 32), chrome, x, GY + 33, z); hb.rotation.z = Math.PI / 2;
    cols.push({ t: 'b', x0: x - 11, x1: x + 11, y0: GY, y1: GY + 66, z0: z - 30, z1: z + 30 });
  }
  // colliders: body, cabin, stepped windscreen (characters climb it), roof on top
  cols.push({ t: 'b', x0, x1, y0: -2, y1: 64, z0: L(140), z1: L(222) });
  cols.push({ t: 'b', x0, x1, y0: -2, y1: 68, z0: L(-220), z1: L(140) });
  cols.push({ t: 'b', x0: x0 + 8, x1: x1 - 8, y0: 68, y1: 121, z0: L(-160), z1: L(16) });
  cols.push({ t: 'b', x0: x0 + 8, x1: x1 - 8, y0: 68, y1: 102, z0: L(16), z1: L(34) }); cols.push({ t: 'b', x0: x0 + 8, x1: x1 - 8, y0: 68, y1: 84, z0: L(34), z1: L(50) });
  cols.push({ t: 'b', x0: x0 + 8, x1: x1 - 8, y0: 68, y1: 98, z0: L(-174), z1: L(-160) });
  GS.car = { x0, x1, z0: L(-220), z1: L(222) };
}

// ---------- the man: patrol, inspect, investigate ----------
const AG_PATH = [
  { x: 1010, z: -140, stop: 3, look: [950, 120, 140], line: 'shelf' },
  { x: 1010, z: 200 },
  { x: 1290, z: 220, stop: 2.6, look: [1150, 60, 150], line: 'car' },
  { x: 1320, z: 40 },
  { x: 1300, z: -150, stop: 4, look: [1300, GY + 90, -240], line: 'bench' },
  { x: 1150, z: -170 }
];
const AG_LINES = { shelf: '教授的東西……會不會藏在這些箱裡？', car: '車裡面也查過了。', bench: '這張工作枱……他以前一定在這裡做實驗。' };
function agentSay(k) { if (GS.said[k] && T - GS.said[k] < 40) return; GS.said[k] = T; sayW('Origin Dynamics 職員', AG_LINES[k] || k, '#9fb3c8', 3); }
function updAgent(dt) {
  const H = GS.agent; if (!H) return; const P = H.pos; let moveD = 0;
  const walkTo = (tx, tz, sp) => { const dx = tx - P.x, dz = tz - P.z, d = Math.hypot(dx, dz); const s = sp * dt; if (d < s + .5) { P.x = tx; P.z = tz; moveD = d; return true; } P.x += dx / d * s; P.z += dz / d * s; moveD = s; H.yaw = angDamp(H.yaw, Math.atan2(dx, dz), 5, dt); return false; };
  if (GS.mode === 'patrol') {
    const n = AG_PATH[GS.node % AG_PATH.length];
    if (walkTo(n.x, n.z, 52)) { if (n.stop) { GS.mode = 'look'; GS.wait = n.stop; GS.look = V3(...n.look); if (n.line && rnd() < .5) agentSay(n.line); } GS.node++; }
    const fx = Math.sin(H.yaw), fz = Math.cos(H.yaw); H.aimT.set(P.x + fx * 150 + Math.sin(T * .8) * 40, GY, P.z + fz * 150 + Math.cos(T * .7) * 30);
  } else if (GS.mode === 'look') {
    GS.wait -= dt; const la = GS.look; H.yaw = angDamp(H.yaw, Math.atan2(la.x - P.x, la.z - P.z), 2.5, dt); const s = Math.sin(T * 1.1) * 34; H.aimT.set(la.x + s, la.y, la.z + Math.cos(T * .9) * 20);
    if (GS.wait <= 0) GS.mode = 'patrol';
  } else if (GS.mode === 'sus' || GS.mode === 'hear') {
    GS.trackT -= dt; const tp = GS.trackP; const d = Math.hypot(tp.x - P.x, tp.z - P.z);
    if (d > 70) walkTo(tp.x, tp.z, GS.mode === 'sus' ? 38 : 60); else H.yaw = angDamp(H.yaw, Math.atan2(tp.x - P.x, tp.z - P.z), 2, dt);
    H.aimT.copy(tp);
    if (GS.trackT <= 0) { GS.mode = 'look'; GS.wait = 2.5; GS.look = tp.clone(); if (!GS.said.lost || T - GS.said.lost > 30) { GS.said.lost = T; sayW('Origin Dynamics 職員', '……是老鼠嗎？', '#9fb3c8', 2.4); } }
  }
  // keep him out of the car
  const C = GS.car; if (P.x > C.x0 - 22 && P.x < C.x1 + 22 && P.z > C.z0 - 22 && P.z < C.z1 + 22) { const dl = P.x - (C.x0 - 22), dr = C.x1 + 22 - P.x, db = P.z - (C.z0 - 22), df = C.z1 + 22 - P.z; const m = Math.min(dl, dr, db, df); if (m === dl) P.x = C.x0 - 22; else if (m === dr) P.x = C.x1 + 22; else if (m === db) P.z = C.z0 - 22; else P.z = C.z1 + 22; }
  P.x = clamp(P.x, 950, 1430); P.z = clamp(P.z, -180, 270); P.y = GY;
  H.aim.lerp(H.aimT, 1 - Math.exp(-3 * dt));
  agentPose(H, moveD, dt);
}
function agentPose(H, moveD, dt) {
  const step = humanAnim(H, moveD, dt); const A0 = H.arms[0]; A0.sh.rotation.x = Math.sin(H.phase) * .3 * (H.amp / .42); A0.el.rotation.x = -.25;
  humanAimArm(H, 1, dt);
  const lp = V3(); H.lens.getWorldPosition(lp); const dir = V3().subVectors(H.aim, lp).normalize(); H.lightPos = lp; H.lightDir = dir;
  const on = ZONES.garage && ZONES.garage.near; GS.torch.position.copy(lp); GS.torch.target.position.copy(lp).addScaledVector(dir, 100); GS.torch.intensity = on ? 90000 : 0;
  GS.beamRec.o.copy(lp); GS.beamRec.d.copy(dir); GS.beamRec.k = on ? .05 : 0; GS.beam.material.uniforms.uK.value = .045; aimBeam(GS.beam, lp, V3().copy(lp).addScaledVector(dir, 420));
  if (step && leader && LEVEL === 'garage') {
    const fp = V3(); H.legs[Math.floor(H.phase / Math.PI) % 2 === 0 ? 0 : 1].ankle.getWorldPosition(fp); const dist = Math.hypot(leader.pos.x - fp.x, leader.pos.y - GY, leader.pos.z - fp.z);
    SND.thud(clamp(1.15 - dist / 420, .08, 1)); cam.shake = Math.max(cam.shake, clamp(1 - dist / 260, 0, 1) * .8);
    for (let i = 0; i < 5; i++) emit(V3(fp.x + R(-6, 6), GY + .5, fp.z + R(-8, 12)), V3(R(-14, 14), R(4, 14), R(-14, 14)), new THREE.Color(.22, .22, .22), R(.5, 1), R(.6, 1.2), 20, 2.5);
    for (const C of party) if (mine(C) && !C.frozen && STATE === 'play' && Math.hypot(C.pos.x - fp.x, C.pos.z - (fp.z + 4)) < 14 && C.pos.y < GY + 8) knock(C, fp, C === leader ? '差點被踩扁！' : null);
  }
}
function garageSeen(tp, who) {
  if (GS.mode !== 'sus') { GS.mode = 'sus'; if (who === 'cam') sayW('Origin Dynamics 職員', '（對講機）鏡頭拍到有東西在動……我去看看。', '#9fb3c8', 3); else if (!GS.said.sus || T - GS.said.sus > 20) { GS.said.sus = T; sayW('Origin Dynamics 職員', '嗯？誰在那裡？', '#9fb3c8', 2.4); } }
  GS.trackP = tp.clone(); GS.trackP.y = Math.max(GY, tp.y); GS.trackT = 3;
}
function garageHear(p, loud) {
  if (!GS.agent || loud < .3) return; if (Math.hypot(p.x - GS.agent.pos.x, p.z - GS.agent.pos.z) > 520) return;
  if (GS.mode !== 'sus') { GS.mode = 'hear'; GS.trackP = p.clone(); GS.trackT = 3.5; if (!GS.said.hear || T - GS.said.hear > 15) { GS.said.hear = T; sayW('Origin Dynamics 職員', '什麼聲音？', '#9fb3c8', 2); } }
}
// the security camera: sweeps left and right until it is knocked off its shelf
function updSecCam(dt) {
  const r = GS.cam; if (!r) return;
  if (!GS.camBroken && (r.y0 < 200 || r.gone || r.target < .7)) { GS.camBroken = true; GS.camLight.intensity = 0; GS.camLed.material.color.setRGB(.05, .02, .02); if (!NET.client) { toastW('監視鏡頭掉下來，壞了！', 3); noise(V3(r.cx, r.y0, r.cz), .9, .8); } }
  if (GS.camBroken) return;
  GS.camYaw = Math.PI / 2 + Math.sin(T * .35) * .85; GS.camHead.rotation.set(.38, GS.camYaw - Math.PI / 2 + Math.PI / 2, 0);
  GS.camHead.rotation.y = GS.camYaw; const blink = Math.sin(T * 6) > .4; GS.camLed.material.color.setRGB(blink ? 3 : .4, blink ? .3 : .05, blink ? .3 : .05); GS.camLight.intensity = blink ? 30 : 4;
}
function camEye() {
  const r = GS.cam; const eye = V3(); GS.camLens.getWorldPosition(eye); const q = new THREE.Quaternion(); GS.camHead.getWorldQuaternion(q); const fwd = V3(0, 0, 1).applyQuaternion(q); return { eye, fwd };
}
function detectGarage(dt) {
  if (STATE !== 'play') return; if (window.__NODET) { meter = 0; return; } if (TOY.grace > 0) { meter = Math.max(0, meter - dt * .5); return; }
  const L = leader; if (L.frozen || !mine(L)) { meter = Math.max(0, meter - dt * .5); KS.watch = null; return; }
  let seen = 0, who = null; const H = GS.agent;
  const hp = V3(); H.head.getWorldPosition(hp); const q = new THREE.Quaternion(); H.head.getWorldQuaternion(q); const hf = V3(0, 0, 1).applyQuaternion(q);
  const s1 = seeFrom(hp, hf, .55, 420); if (s1 > seen) { seen = s1; who = 'agent'; }
  if (H.lightPos) { const s2 = seeFrom(H.lightPos, H.lightDir, Math.cos(.34), 520) * 1.5; if (s2 > seen) { seen = s2; who = 'agent'; } }
  if (!GS.camBroken) { const ce = camEye(); const s3 = seeFrom(ce.eye, ce.fwd, .8, 420); if (s3 > seen) { seen = s3; who = 'cam'; } }
  KS.watch = seen > 0 ? { p: who === 'cam' ? camEye().eye : hp, s: seen, who } : null;
  if (seen > 0) {
    const lit = Math.max(litAtList(V3(L.pos.x, L.pos.y + L.h * .5, L.pos.z), GS.lights), who === 'agent' && H.lightPos && seeFrom(H.lightPos, H.lightDir, Math.cos(.34), 520) > 0 ? 1 : 0) * (inDark(L.pos) ? .6 : 1);
    const under = L.pos.y < 0 && L.pos.x > GS.car.x0 && L.pos.x < GS.car.x1 && L.pos.z > GS.car.z0 && L.pos.z < GS.car.z1 ? .35 : 1;
    const mv = L.spd > 1.5 ? 1 : .5; const cr = L.crouch ? .55 : 1;
    meter += seen * lit * mv * cr * under * (L.id === 'cham' ? 1 - .82 * L.camo : 1) * dt;
    if (meter > .32) netSeen(V3(L.pos.x, L.pos.y + 2, L.pos.z), who);
  } else meter -= dt * .24;
  meter = clamp(meter, 0, 1); if (meter >= 1) toyFreeze(who);
}
function updGarageWorld(dt) {
  // the side door's dog flap: swings when someone goes through once the latch is open
  if (GS.latch) {
    GS.flapCol.y0 = -999; GS.flapCol.y1 = -998; let push = 0;
    for (const C of party) if (Math.abs(C.pos.x - 1455) < 6 && C.pos.z > 88 && C.pos.z < 122 && C.pos.y < GY + 16) push = C.pos.x < 1455 ? 1 : -1;
    GS.flapA = damp(GS.flapA, push * 1.1, push ? 10 : 3, dt); GS.flap.rotation.z = GS.flapA;
    GS.latchM.rotation.x = damp(GS.latchM.rotation.x, -1.2, 6, dt);
  } else if (!NET.client) {
    // anyone whose head reaches the latch flips it open
    for (const C of party) if (!C.frozen && Math.hypot(C.pos.x - GS.latchP.x, C.pos.z - GS.latchP.z) < 7 && C.pos.y + C.h >= GS.latchP.y - .6) { latchOpen(C); break; }
  }
  if (GS.dock) { GS.dockGlow.material.color.setRGB(.6 + Math.sin(T * 5) * .2, 2.4, 2.3); GS.dockRing.rotation.z += dt * .6; }
  if (GS.coilM && !GS.coil) { GS.coilM.rotation.y += dt * .8; }
  // the far tube flickers
  if (GS.tubeBL) { const f = rnd() < .03 ? .1 : 1; GS.tubeBL.intensity = 70000 * f; GS.tubeB.material.emissiveIntensity = 3 * f; }
}
function latchOpen(C) { if (GS.latch) return; GS.latch = true; SND.snap(); toastW(`${C ? C.S.name : ''}打開了狗門的門扣！`, 3); if (NET.on && quest === 6) setQuest(7); if (!NET.on && LEVEL === 'garage' && quest === 3) setQuest(4); }

const GQ_SP = [
  { t: '上到工作枱', s: '工作枱在車房最入面。小心 Origin Dynamics 的人和鐵架頂的監視鏡頭——躲到車底會比較安全' },
  { t: '從舊收音機拆出線圈', s: '收音機的後蓋打開了，銅線圈就在後面' },
  { t: '把線圈裝上機座', s: '工作枱另一邊是爸爸以前的縮小機機座' },
  { t: '打開狗門的門扣', s: '側門下面有狗門，但門扣太高，一個人夠不到——疊羅漢、推木箱過去墊腳，或者用尺寸槍' },
  { t: '由狗門逃出後園', s: '快！那個人聽到聲音了' }
];
LEVELS.garage = {
  chapter: '第三章', title: '車房', mpChapter: '第二章（多人）', env: 'garage', envI: .95, fog: [0x10141a, .0009], expo: 1.3,
  dust: { N: 2200, box: [930, 1450, GY, 260, -250, 300], beamFrac: .2, door: false },
  toys: true, npcNear: true, build: buildGarage,
  cps: [[978, GY, -196], [1000, GY, -150], [1172, GY + 80, -232], [1400, GY, 100]],
  quests: GQ_SP,
  // started straight from the chapter list: the team has just dropped out of the duct
  spawn() {
    spawnSP(this.cps[0], -Math.PI / 2, 5);
    if (!LIV.ventOpen) { LIV.ventOpen = true; LIV.ventCol.y0 = -999; LIV.ventCol.y1 = -998; }
  },
  enter(prev, again) {
    if (again) return;
    if (!NET.on) { setTimeout(() => sayW('小彩', '有人在車房……灰色制服、帽上有標誌——是 Origin Dynamics 的人！', '#9fd86b', 3.6), 1200); setTimeout(() => say('爸爸', '工作枱上有我以前的機座。拿收音機的線圈裝上去，縮小機就可以重新啟動。', '#f5f0e6', 4.2), 5400); }
  },
  npc(dt) { if (STATE === 'play' || STATE === 'fail' || STATE === 'frozen' || STATE === 'end') updAgent(dt); },
  detect: detectGarage, hear: garageHear, seen: garageSeen,
  update(dt) {
    lvT += dt; const L = leader;
    if (NET.on) return;
    if (quest === 0 && L.grounded && L.pos.y > GS.benchY - 1 && L.pos.x > 1180 && L.pos.x < 1440 && L.pos.z < -194) { setQuest(1); toast('上到工作枱了'); }
    if (quest === 1 && !GS.coil && L.pos.distanceTo(GS.coilP) < 5) { GS.coil = true; GS.coilM.visible = false; SND.pick(); toast('拿到線圈！'); setQuest(2); }
    if (quest === 2 && L.pos.y > GS.benchY - 1 && L.pos.y < GS.benchY + 9 && L.pos.x > 1358 && L.pos.x < 1402 && L.pos.z > -250 && L.pos.z < -205) {
      GS.dock = true; setQuest(3); SND.zapUp && SND.zapUp(); noise(GS.dockP, 1, .3); toast('機座重新亮起來了！', 3);
      say('爸爸', '機座修好了……但控制晶片不見了。陳伯以前替我保管過一塊後備晶片——他就住在隔籬。', '#f5f0e6', 4.6);
      setTimeout(() => sayW('Origin Dynamics 職員', '那是什麼光？！', '#9fb3c8', 2.4), 4800);
    }
  },
  win() { },
  marker() {
    if (NET.on) return mpMarker();
    if (quest === 0) return V3(1300, GS.benchY + 2, -205); if (quest === 1) return GS.coilP; if (quest === 2) return GS.dockP; if (quest === 3) return GS.latchP; return V3(1455, GY + 2, 105);
  },
  reset() { GS.mode = 'patrol'; },
  eyeText: () => meter > .3 ? '他看到你了！躲起來' : GS.camBroken ? 'Origin Dynamics 的人在搜車房' : 'Origin Dynamics 的人和監視鏡頭',
  hint(L) { if (!GS.latch && Math.hypot(L.pos.x - GS.latchP.x, L.pos.z - GS.latchP.z) < 12) return '門扣在頭頂——疊羅漢夠上去，或者推木箱過來墊腳'; return ''; },
  onSwitch() { }
};
