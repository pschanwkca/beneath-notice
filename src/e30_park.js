// =====================================================================
//  第六章 · 公園（楓林公園） — through the park gate, on the far side of the road
//  A park in the afternoon sun. The control chip only charges in sunlight, and the most open spot
//  is the top of the playground's slide tower. Between the gate and the tower:
//   · the dog run, where two dog owners sit chatting while their dogs chase a ball;
//   · a jogger with a head torch running laps of the loop path;
//   · a teenager riding the skate ramps (his wheels are as bad as a car's).
//  Tall grass is the safe way round; in the trees' shade you're harder to make out.
//  Clouds drift over the sun now and then — the chip only charges while the sun is out.
//  On the far side of the park, beyond its back gate, is the school (the next chapter).
// =====================================================================
const PK = {
  near: false, lights: [], said: {}, shade: [], soft: [], dogs: [], owners: [], jog: null, sk: null, ball: null,
  chip: 0, chipOn: false, charged: false, chipGot: false, cloud: 0, cloudT: 18, cloudOn: false, throwT: 4, thrower: 0,
  gate: V3(2060, GY, 1700), back: V3(2060, GY, 3700), tower: V3(2120, GY, 3000), plat: GY + 120, chipP: V3(2120, GY + 122.5, 3006),
  run: { x0: 1380, x1: 1820, z0: 2380, z1: 2880 }, bench: V3(1600, GY, 2418), play: { x0: 1820, x1: 2440, z0: 2820, z1: 3250 },
  sand: { x0: 1870, x1: 2040, z0: 3090, z1: 3220 }, skate: { x0: 2320, x1: 2760, z0: 2390, z1: 2690 },
  loop: { cx: 2060, cz: 2750, rx: 820, rz: 560 }, moon: V3(.381, .626, -.680)
};
// the slide: from the tower platform eastwards down to the mat
const SLIDE = { x0: 2165, x1: 2420, z0: 2986, z1: 3026, y0: GY + 118, y1: GY + 7 };
function slideH(x) { const t = clamp((x - SLIDE.x0) / (SLIDE.x1 - SLIDE.x0), 0, 1); const s = t < .12 ? t * .5 : t > .86 ? .94 + (t - .86) * .43 : .06 + (t - .12) / .74 * .88; return lerp(SLIDE.y0, SLIDE.y1, s); }

// ---------- textures ----------
function genGravel() {
  const W = 512, n = noiseField(W, W, 4, 6, 801); const h = new Float32Array(W * W);
  const c = fromFn(W, W, (x, y, i, o) => { const s = hashI(i * 5 + 11), peb = s > .78 ? (s - .78) * 2.4 : 0; const t = hashI(i * 3 + 7); const v = .5 + (n[i] - .5) * .18 + peb * .5 - (s < .08 ? .12 : 0); o[0] = (132 + t * 18) * v * 1.25; o[1] = (122 + t * 12) * v * 1.25; o[2] = (108 + t * 6) * v * 1.25; h[i] = peb + n[i] * .2; });
  return { map: tex(c), normalMap: normalTex(h, W, W, 3) };
}
function genRubber() {   // the playground's poured rubber: terracotta with coloured flecks
  const W = 512, n = noiseField(W, W, 3, 10, 811); const h = new Float32Array(W * W);
  const c = fromFn(W, W, (x, y, i, o) => { const s = hashI(i * 7 + 3); let r = 150, g = 62, b = 48; if (s > .93) { r = 230; g = 196; b = 70; } else if (s > .87) { r = 60; g = 120; b = 150; } else if (s > .8) { r = 70; g = 50; b = 44; } const v = .55 + (n[i] - .5) * .14 + (hashI(i * 13) - .5) * .12; o[0] = r * v; o[1] = g * v; o[2] = b * v; h[i] = hashI(i * 17); });
  return { map: tex(c), normalMap: normalTex(h, W, W, 1.6) };
}
function genSand() {
  const W = 256, n = noiseField(W, W, 4, 6, 821), n2 = noiseField(W, W, 2, 40, 822); const h = new Float32Array(W * W);
  const c = fromFn(W, W, (x, y, i, o) => { const v = .78 + (n[i] - .5) * .2 + (hashI(i) - .5) * .1; o[0] = 214 * v; o[1] = 192 * v; o[2] = 150 * v; h[i] = n2[i] * .8 + n[i] * .2; });
  return { map: tex(c), normalMap: normalTex(h, W, W, 2) };
}
function genChainLink() {
  const [c, x] = cnv(64, 64); x.clearRect(0, 0, 64, 64); x.strokeStyle = 'rgba(190,198,200,1)'; x.lineWidth = 3.2;
  x.beginPath(); x.moveTo(0, 32); x.lineTo(32, 0); x.lineTo(64, 32); x.lineTo(32, 64); x.closePath(); x.stroke();
  x.beginPath(); x.moveTo(-32, 32); x.lineTo(0, 0); x.moveTo(64, 0); x.lineTo(96, 32); x.stroke();
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function parkSignTex() {
  const [c, x] = cnv(512, 300); x.fillStyle = '#20382a'; x.fillRect(0, 0, 512, 300); x.strokeStyle = '#c9b77a'; x.lineWidth = 6; x.strokeRect(10, 10, 492, 280);
  x.fillStyle = '#efe2b4'; x.textAlign = 'center'; x.font = '700 50px "Noto Sans TC", sans-serif'; x.fillText('狗隻自由活動區', 256, 82);
  x.font = '500 26px "Noto Sans TC", sans-serif'; x.fillText('開放時間 早上六時至晚上十一時', 256, 136); x.fillText('請拾起狗糞 · 入閘請關門', 256, 180);
  x.font = '600 22px "Fredoka", sans-serif'; x.fillText('OFF-LEASH DOG AREA', 256, 236); return tex(c);
}
function schoolSignTex() {
  const [c, x] = cnv(512, 128); x.fillStyle = '#f2efe6'; x.fillRect(0, 0, 512, 128); x.fillStyle = '#7a1f22'; x.fillRect(0, 0, 512, 10); x.fillRect(0, 118, 512, 10);
  x.fillStyle = '#7a1f22'; x.textAlign = 'center'; x.font = '900 64px "Noto Sans TC", sans-serif'; x.fillText('楓 林 小 學', 256, 84); x.font = '600 18px "Fredoka", sans-serif'; x.fillText('MAPLE GROVE PRIMARY SCHOOL', 256, 110); return tex(c);
}
function cloudTex() {
  const [c, x] = cnv(256, 128); const g = x.createRadialGradient(128, 64, 6, 128, 64, 128); g.addColorStop(0, 'rgba(40,48,70,.95)'); g.addColorStop(.55, 'rgba(36,42,62,.75)'); g.addColorStop(1, 'rgba(30,36,54,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 9; i++) { const gx = R(50, 206), gy = R(36, 92), r = R(26, 48); const h = x.createRadialGradient(gx, gy, 2, gx, gy, r); h.addColorStop(0, 'rgba(44,52,76,.9)'); h.addColorStop(1, 'rgba(44,52,76,0)'); x.fillStyle = h; x.fillRect(0, 0, 256, 128); }
  return tex(c);
}

// soft ground (grass, sand, soil) — where a mole can dig. Hard: paths, the plaza, the skate pad, the rubber mat, anything raised.
function parkSoft(p) {
  const S = PK.sand; if (p.x > S.x0 + 8 && p.x < S.x1 - 8 && p.z > S.z0 + 8 && p.z < S.z1 - 8) return p.y > GY + 6 && p.y < GY + 14;   // in the sandbox
  if (p.z < 1668 || p.z > 3716 || p.y > GY + 2 || !PK.hard) return false;
  for (const h of PK.hard) if (h(p)) return false; return true;
}

// ---------- build ----------
function buildPark() {
  const K = kitchenMats(), M = MAT;
  if (!ST.sky) buildNightSky();
  const gr = genGrass(); const grassM = new THREE.MeshStandardMaterial({ ...gr, color: DAY ? 0xd4dcc4 : 0xb8c4b0, roughness: .95, normalScale: new THREE.Vector2(.8, .8) });
  const gv = genGravel(); const gravelM = new THREE.MeshStandardMaterial({ ...gv, roughness: .92 });
  const rb = genRubber(); const rubberM = new THREE.MeshStandardMaterial({ ...rb, roughness: .85, normalScale: new THREE.Vector2(.6, .6) });
  const sd = genSand(); const sandM = new THREE.MeshStandardMaterial({ ...sd, roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2) });
  const cedar = new THREE.MeshStandardMaterial({ ...genWood([168, 112, 74], [96, 58, 36], 831, 6), roughness: .8 });
  const benchW = new THREE.MeshStandardMaterial({ ...genWood([132, 92, 58], [70, 46, 28], 833, 0), roughness: .75 });
  const conc = new THREE.MeshStandardMaterial({ map: MAT.floor.map, normalMap: MAT.floor.normalMap, color: 0xc2c0bc, roughness: .8 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x2c3430, metalness: .65, roughness: .45 }), dark = new THREE.MeshStandardMaterial({ color: 0x15171a, metalness: .4, roughness: .5 });
  const red = new THREE.MeshPhysicalMaterial({ color: 0xb8402e, roughness: .38, clearcoat: .6, clearcoatRoughness: .3 }), yellow = new THREE.MeshPhysicalMaterial({ color: 0xe0a83a, roughness: .4, clearcoat: .5 });
  const teal = new THREE.MeshPhysicalMaterial({ color: 0x2f7c86, roughness: .4, clearcoat: .5 }), slideM = new THREE.MeshPhysicalMaterial({ color: 0xd0543a, roughness: .18, clearcoat: 1, clearcoatRoughness: .08 });
  const trunk = new THREE.MeshStandardMaterial({ color: 0x3a2c22, roughness: .95 }), leafA = new THREE.MeshStandardMaterial({ color: DAY ? 0x4f7f3a : 0x2c4a24, roughness: .9, flatShading: true, emissive: DAY ? 0x2a4a1c : 0 }), leafB = new THREE.MeshStandardMaterial({ color: DAY ? 0x6a8a36 : 0x3a5224, roughness: .9, flatShading: true, emissive: DAY ? 0x34481a : 0 });   // (daylight glows through leaves: their shady side is never black)
  const hedgeM = new THREE.MeshStandardMaterial({ color: DAY ? 0x3a5a2c : 0x22381c, roughness: 1, flatShading: true });
  const lampHead = DAY ? new THREE.MeshStandardMaterial({ color: 0xe0dcd0, roughness: .25 }) : new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc887).multiplyScalar(2.3) });
  LV.add(DAY ? new THREE.HemisphereLight(0xc4dcff, 0x8a9a64, 1.6) : new THREE.HemisphereLight(0x50608c, 0x161a12, .85));
  const LI = (v) => DAY ? 0 : v;   // the park's lamps are off in daylight
  PK.hard = [];

  // ---- the ground ----
  box(-340, 3500, GY - 10, GY, 1664, 3740, grassM, { uv: 90, cast: false });
  // the entrance path from the gate to the plaza, the plaza, the loop path, the path to the back gate
  box(2030, 2090, GY, GY + .35, 1664, 2060, gravelM, { uv: 80, col: false, cast: false });
  PK.hard.push(p => p.x > 2026 && p.x < 2094 && p.z < 2064);
  { const g = new THREE.CircleGeometry(150, 64); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, gravelM); m.position.set(2060, GY + .4, 2190); m.receiveShadow = true; LV.add(m);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3.6, uv.getY(i) * 3.6);
    PK.hard.push(p => Math.hypot(p.x - 2060, p.z - 2190) < 154);
    // a ring of setts around the plaza's edge
    const rg = new THREE.RingGeometry(150, 162, 64); rg.rotateX(-Math.PI / 2); const rm = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ color: 0x8c867c, roughness: .9 })); rm.position.set(2060, GY + .5, 2190); rm.receiveShadow = true; LV.add(rm); }
  { const L = PK.loop, N = 160, pos = [], uvs = [], idx = []; let acc = 0, prev = null;
    for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2, cx = L.cx + Math.sin(a) * L.rx, cz = L.cz - Math.cos(a) * L.rz; const tx = Math.cos(a) * L.rx, tz = Math.sin(a) * L.rz, tl = Math.hypot(tx, tz), nx = tz / tl, nz = -tx / tl;
      if (prev) acc += Math.hypot(cx - prev[0], cz - prev[1]); prev = [cx, cz];
      for (const s of [-1, 1]) { pos.push(cx + nx * 32 * s, GY + .35, cz + nz * 32 * s); uvs.push(s > 0 ? 1 : 0, acc / 64); }
      if (i < N) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, gravelM); m.receiveShadow = true; LV.add(m);
    PK.hard.push(p => Math.abs(Math.hypot((p.x - L.cx) / L.rx, (p.z - L.cz) / L.rz) - 1) * 690 < 36); }
  box(2030, 2090, GY, GY + .35, 3300, 3720, gravelM, { uv: 80, col: false, cast: false });
  PK.hard.push(p => p.x > 2026 && p.x < 2094 && p.z > 3296);

  // ---- the park railings: the road side is built by the street, this is the back fence with its gate ----
  const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(2.2, 120, 2.2), new THREE.MeshStandardMaterial({ color: 0x1c2420, metalness: .6, roughness: .45 }), 300); let bi = 0; const m4 = new THREE.Matrix4();
  for (let x = -320; x < 3480 && bi < 300; x += 14) { if (x > 1990 && x < 2130) continue; m4.makeTranslation(x, GY + 60, 3728); bars.setMatrixAt(bi++, m4); } bars.count = bi; bars.castShadow = true; LV.add(bars);
  for (const [a, b] of [[-340, 1990], [2130, 3500]]) { box(a, b, GY + 112, GY + 116, 3726, 3730, metal, { col: false }); box(a, b, GY + 8, GY + 11, 3726, 3730, metal, { col: false }); cols.push({ t: 'b', x0: a, x1: b, y0: GY, y1: GY + 120, z0: 3725, z1: 3731, slick: true }); }
  // side railings (east and west edges of the park)
  for (const x of [-336, 3496]) cols.push({ t: 'b', x0: x - 3, x1: x + 3, y0: GY, y1: GY + 120, z0: 1664, z1: 3740, slick: true });
  const brick = new THREE.MeshStandardMaterial({ color: 0x7a3e2c, roughness: .9 });
  for (const x of [1990, 2110]) { box(x, x + 20, GY, GY + 190, 3718, 3738, brick, { uv: 40 }); box(x - 3, x + 23, GY + 190, GY + 196, 3715, 3741, conc); mesh(new THREE.SphereGeometry(9, 18, 12), K.bulb, x + 10, GY + 206, 3728, { cast: false }); }
  const backL = [pointL(0xffd8a0, LI(9000), 2000, GY + 206, 3728), pointL(0xffd8a0, LI(9000), 2120, GY + 206, 3728)]; for (const l of backL) PK.lights.push({ p: l.position.clone(), range: 120, I: () => l.intensity });
  { const gL = new THREE.Group(); gL.position.set(2010, GY, 3728); gL.rotation.y = 1.3; LV.add(gL); const gR = new THREE.Group(); gR.position.set(2110, GY, 3728); gR.rotation.y = -1.3; LV.add(gR);
    for (const [gg, s] of [[gL, 1], [gR, -1]]) { for (let i = 0; i < 7; i++) mesh(new THREE.BoxGeometry(2, 110, 2), metal, s * (5 + i * 7), 58, 0, { parent: gg }); mesh(new THREE.BoxGeometry(50, 3, 3), metal, s * 26, 108, 0, { parent: gg }); mesh(new THREE.BoxGeometry(50, 3, 3), metal, s * 26, 12, 0, { parent: gg }); } }

  // ---- beyond the back gate: a quiet street and the school (next chapter) ----
  box(-340, 3500, GY - 10, GY, 3740, 3900, new THREE.MeshStandardMaterial({ map: MAT.floor.map, color: 0xa8a49c, roughness: .9 }), { uv: 128, cast: false });
  box(-340, 3500, GY - 22, GY - 10, 3900, 4200, new THREE.MeshStandardMaterial({ color: 0x24272b, roughness: .85 }), { col: false, cast: false });
  { const sx = new THREE.MeshStandardMaterial({ color: 0x8a4a34, roughness: .9 }), win = DAY ? new THREE.MeshPhysicalMaterial({ color: 0x6a7c90, roughness: .05, metalness: .2, clearcoat: 1 }) : new THREE.MeshStandardMaterial({ color: 0x241a10, emissive: 0xffc070, emissiveIntensity: .7, roughness: .3 }), wo = DAY ? new THREE.MeshPhysicalMaterial({ color: 0x4e6074, roughness: .05, metalness: .2, clearcoat: 1 }) : new THREE.MeshStandardMaterial({ color: 0x0c1016, roughness: .1, metalness: .3 });
    box(900, 3300, GY - 10, GY + 760, 4260, 4400, sx, { col: false, uv: 120 }); box(890, 3310, GY + 760, GY + 784, 4250, 4410, conc, { col: false });
    for (let row = 0; row < 3; row++) for (let x = 980; x < 3240; x += 170) { const lit = hashI(row * 31 + x) > .82; box(x, x + 110, GY + 90 + row * 230, GY + 230 + row * 230, 4258, 4260, lit ? win : wo, { col: false, cast: false }); box(x - 4, x + 114, GY + 86 + row * 230, GY + 90 + row * 230, 4256, 4260, conc, { col: false }); }
    const sg = mesh(new THREE.PlaneGeometry(420, 105), new THREE.MeshStandardMaterial({ map: schoolSignTex(), roughness: .6, emissive: 0x444038, emissiveMap: null }), 2100, GY + 700, 4257, { cast: false }); sg.rotation.y = Math.PI;
    PK.schoolL = pointL(0xffe0b0, LI(60000), 2100, GY + 560, 4120); }

  // ---- big trees: their crowns throw shade ----
  const tree = (x, z, s, leaf) => { cyl(x, z, 18 * s, GY, GY + 330 * s, trunk, { seg: 14 }); for (const [dx, dz] of [[1, .2], [-.8, .6], [.2, -1]]) cyl(x + dx * 50 * s, z + dz * 50 * s, 6 * s, GY + 240 * s, GY + 300 * s, trunk, { seg: 8, col: false });
    for (let i = 0; i < 6; i++) { const m = mesh(new THREE.IcosahedronGeometry(R(90, 130) * s, 1), leaf, x + R(-80, 80) * s, GY + R(330, 470) * s, z + R(-80, 80) * s); m.rotation.set(R(0, 3), R(0, 3), 0); }
    PK.shade.push({ x: x + 25 * s, z: z - 40 * s, r: 150 * s }); };
  for (const [x, z, s, l] of [[1660, 1880, 1.1, leafA], [2520, 1930, 1, leafB], [1140, 2420, 1.25, leafA], [2980, 2560, 1.15, leafB], [1500, 3180, 1.2, leafB], [2740, 3260, 1.1, leafA], [1220, 3520, 1.3, leafA], [2930, 3540, 1.2, leafB], [700, 2000, 1.4, leafB], [3300, 2050, 1.3, leafA], [600, 3000, 1.4, leafA], [3350, 3100, 1.3, leafB]]) tree(x, z, s, l);
  // the plaza's old tree with a round bench
  // (on the plaza's north side, clear of the loop path that runs across it)
  const TZ = 2090; cyl(2060, TZ, 26, GY, GY + 420, trunk, { seg: 18 }); for (let i = 0; i < 8; i++) { const m = mesh(new THREE.IcosahedronGeometry(R(110, 160), 1), i % 2 ? leafA : leafB, 2060 + R(-110, 110), GY + R(400, 560), TZ + R(-110, 110)); m.rotation.set(R(0, 3), R(0, 3), 0); }
  PK.shade.push({ x: 2080, z: TZ - 40, r: 190 });
  { const seat = new THREE.Mesh(new THREE.TorusGeometry(58, 9, 6, 40), benchW); seat.rotation.x = Math.PI / 2; seat.scale.z = .25; seat.position.set(2060, GY + 42, TZ); seat.castShadow = seat.receiveShadow = true; LV.add(seat);
    cols.push({ t: 'c', x: 2060, z: TZ, r: 67, y0: GY + 36, y1: GY + 44 }); for (let a = 0; a < 6.28; a += 1.047) cyl(2060 + Math.cos(a) * 58, TZ + Math.sin(a) * 58, 3.5, GY, GY + 36, metal, { seg: 10 }); }
  // hedges along the dog run's north side and around the back gate
  for (const [x0, x1, z0, z1] of [[1300, 1840, 2300, 2340], [1680, 1980, 3620, 3660], [2140, 2440, 3620, 3660]]) { box(x0, x1, GY, GY + 60, z0, z1, hedgeM, { uv: 40 }); }

  // ---- tall grass: the safe way round ----
  const clumps = [];
  const strip = (x0, z0, x1, z1, n, r, cnt) => { for (let i = 0; i < n; i++) { const t = n === 1 ? .5 : i / (n - 1); clumps.push([lerp(x0, x1, t) + R(-14, 14), lerp(z0, z1, t) + R(-14, 14), r, cnt]); } };
  strip(1760, 1720, 1880, 2090, 6, 60, TOUCH ? 34 : 56);           // west of the entrance path
  strip(1860, 2330, 1880, 2900, 8, 56, TOUCH ? 30 : 50);           // along the dog run's east fence
  strip(1900, 2760, 2420, 2770, 7, 50, TOUCH ? 26 : 44);           // north edge of the playground
  strip(2260, 1760, 2420, 2080, 5, 58, TOUCH ? 30 : 50);           // east of the entrance path
  strip(1700, 3300, 1960, 3560, 5, 60, TOUCH ? 30 : 50); strip(2200, 3330, 2460, 3560, 5, 60, TOUCH ? 30 : 50);   // round the back path
  strip(2800, 2300, 2860, 2760, 5, 56, TOUCH ? 26 : 44);           // beside the skate area
  buildGrassClumps(clumps);
  // flower bed by the plaza
  { const fl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.2, 0), new THREE.MeshStandardMaterial({ roughness: .7 }), 260), st = new THREE.InstancedMesh(new THREE.CylinderGeometry(.35, .35, 1, 5), new THREE.MeshStandardMaterial({ color: 0x3a5a2a, roughness: .9 }), 260); const col = new THREE.Color(), t = V3(), q = new THREE.Quaternion(), s = V3();
    for (let i = 0; i < 260; i++) { let a = R(-.6, .6) + (i % 2 ? Math.PI : 0), r = R(176, 230); if (i % 2 && Math.abs(Math.sin(a) * r) < 80) a += Math.sign(Math.sin(a) || 1) * .42; const x = 2060 + Math.sin(a) * r, z = 2190 + Math.cos(a) * r * .9, h = R(10, 22); m4.compose(t.set(x, GY + h, z), q.identity(), s.set(1, R(.8, 1.2), 1)); fl.setMatrixAt(i, m4); col.setHSL(rnd() < .5 ? R(.95, 1) : R(.1, .16), R(.5, .75), R(.45, .62)); fl.setColorAt(i, col); m4.compose(t.set(x, GY + h / 2, z), q, s.set(1, h, 1)); st.setMatrixAt(i, m4); }
    fl.castShadow = true; LV.add(fl, st); box(1880, 2240, GY - 1, GY + .6, 2350, 2420, new THREE.MeshStandardMaterial({ map: genSoil(), roughness: 1 }), { col: false, cast: false }); }

  // ---- lamps along the loop ----
  const lamp = (x, z) => { cyl(x, z, 5, GY, GY + 420, metal, { seg: 14 }); cyl(x, z, 9, GY, GY + 12, metal, { seg: 14 }); mesh(new THREE.CylinderGeometry(14, 9, 22, 6), dark, x, GY + 428, z, { cast: false }); mesh(new THREE.CylinderGeometry(11, 7, 18, 6), lampHead, x, GY + 426, z, { cast: false }); mesh(new THREE.ConeGeometry(18, 12, 6), dark, x, GY + 445, z, { cast: false });
    const l = pointL(0xffb873, LI(120000), x, GY + 420, z); PK.lights.push({ p: V3(x, GY + 420, z), range: 380, I: () => l.intensity }); return l; };
  { const L = PK.loop; for (const a of [.35, 1.2, 2.05, 2.9, 3.6, 4.4, 5.2, 5.95]) lamp(L.cx + Math.sin(a) * (L.rx + 46), L.cz - Math.cos(a) * (L.rz + 46)); lamp(2110, 1760); lamp(2005, 3560); }

  // ---- benches along the loop ----
  const benchAt = (x, z, yaw) => { const g = new THREE.Group(); g.position.set(x, GY, z); g.rotation.y = yaw; LV.add(g);
    for (const dy of [0, 7]) mesh(new THREE.BoxGeometry(120, 3, 7), benchW, 0, 40, -8 + dy * 1.5, { parent: g }); for (const dy of [0, 1, 2]) mesh(new THREE.BoxGeometry(120, 7, 2.5), benchW, 0, 56 + dy * 9, -16, { parent: g }).rotation.x = -.12;
    for (const s of [-50, 50]) { mesh(new THREE.BoxGeometry(4, 40, 4), metal, s, 20, -2, { parent: g }); mesh(new THREE.BoxGeometry(4, 40, 4), metal, s, 20, -14, { parent: g }); mesh(new THREE.BoxGeometry(4, 34, 3), metal, s, 60, -17, { parent: g }); }
    const c = Math.cos(yaw), s = Math.sin(yaw), w = Math.abs(c) * 60 + Math.abs(s) * 12, d = Math.abs(s) * 60 + Math.abs(c) * 12; cols.push({ t: 'b', x0: x - w, x1: x + w, y0: GY + 37, y1: GY + 43, z0: z - d, z1: z + d }); };
  benchAt(2400, 2120, -.5); benchAt(1500, 3330, 2.4); benchAt(2860, 3080, -2.2);
  // bins by the plaza
  for (const [x, z] of [[1870, 2240], [2250, 2240]]) { cyl(x, z, 22, GY, GY + 80, new THREE.MeshStandardMaterial({ color: 0x2c4a36, roughness: .6, metalness: .3 }), { seg: 20 }); cyl(x, z, 24, GY + 80, GY + 86, metal, { seg: 20 }); }

  buildDogRun(benchW, metal, conc);
  buildSkate(conc, metal, red);
  buildPlayground({ cedar, red, yellow, teal, slideM, metal, rubberM, sandM, benchW });

  // ---- the sun (or the moon, at night): one big, soft, shadow-casting light from where it hangs in the sky ----
  { const tgt = V3(2120, GY, 2900), from = DAY ? sunFrom(tgt) : tgt.clone().addScaledVector(PK.moon, 2300); PK.moonL = DAY ? spotL(0xfff0dc, 26000000, from, tgt, .5, .55, 2048, 1200, 3800) : spotL(0x9fb4ff, 16000000, from, tgt, .46, .8, 2048, 1200, 3600); PK.moonL.userData.prio = 1; PK.moonL.shadow.bias = -.0008; PK.moonI = PK.moonL.intensity; }
  // a cloud that drifts across the sun now and then (part of the sky, so it follows the camera)
  { const keep = LV; LV = ST.sky; const cm = new THREE.MeshBasicMaterial({ map: DAY ? dayCloudTex(7) : cloudTex(), transparent: true, depthWrite: false, fog: false, opacity: 0 }); PK.cloudM = cm; PK.cloudC = PK.cloudC || V3(2100, 0, 800).addScaledVector(DAY ? SUN : V3(700, 1150, -1250).normalize(), 1730);
    PK.cloudMesh = mesh(new THREE.PlaneGeometry(DAY ? 640 : 560, DAY ? 300 : 240), cm, PK.cloudC.x, PK.cloudC.y, PK.cloudC.z, { cast: false }); PK.cloudMesh.lookAt(2100, 0, 800); PK.cloudMesh.visible = false; LV = keep; }

  // pickups
  addCrumb(1640, GY, 2050); addCrumb(2460, GY, 3120); addCrumb(2060, GY + 44, 2148); addVial(1210, GY, 3460);
  buildParkPeople();
  const keep = new Set([PK.flag, PK.duck, PK.chipG, PK.mound, PK.ball.g, PK.sk.bd, ...PK.swings.map(s => s.piv), ...CRUMBS.map(c => c.g), ...VIALS.map(v => v.g), ...batteries.map(b => b.g)]);
  PK.merged = mergeZoneStatic(LV, keep);
}

// ---------- the dog run ----------
function buildDogRun(benchW, metal, conc) {
  const Rn = PK.run, link = genChainLink(), H = 92;
  const side = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0); const t = link.clone(); t.needsUpdate = true; t.repeat.set(L / 9, H / 9); const m = new THREE.Mesh(new THREE.PlaneGeometry(L, H), new THREE.MeshStandardMaterial({ map: t, alphaTest: .5, side: THREE.DoubleSide, metalness: .6, roughness: .45, color: 0xb8c0c2 })); m.position.set((x0 + x1) / 2, GY + H / 2, (z0 + z1) / 2); m.rotation.y = Math.atan2(-(z1 - z0), x1 - x0); m.castShadow = true; LV.add(m);
    const w = 2, xa = Math.min(x0, x1) - (x0 === x1 ? w : 0), xb = Math.max(x0, x1) + (x0 === x1 ? w : 0), za = Math.min(z0, z1) - (z0 === z1 ? w : 0), zb = Math.max(z0, z1) + (z0 === z1 ? w : 0); cols.push({ t: 'b', x0: xa, x1: xb, y0: GY, y1: GY + H, z0: za, z1: zb, noRay: true });
    box(Math.min(x0, x1) - 1.5, Math.max(x0, x1) + 1.5, GY + H - 2, GY + H + 1, Math.min(z0, z1) - 1.5, Math.max(z0, z1) + 1.5, metal, { col: false }); };
  // fence: the gate gap on the east side faces the plaza path
  side(Rn.x0, Rn.z0, Rn.x1, Rn.z0); side(Rn.x0, Rn.z1, Rn.x1, Rn.z1); side(Rn.x0, Rn.z0, Rn.x0, Rn.z1); side(Rn.x1, Rn.z0, Rn.x1, 2590); side(Rn.x1, 2670, Rn.x1, Rn.z1);
  for (let x = Rn.x0; x <= Rn.x1; x += 110) for (const z of [Rn.z0, Rn.z1]) cyl(x, z, 2.6, GY, GY + H + 3, metal, { seg: 10, col: false });
  for (let z = Rn.z0; z <= Rn.z1; z += 100) for (const x of [Rn.x0, Rn.x1]) cyl(x, z, 2.6, GY, GY + H + 3, metal, { seg: 10, col: false });
  for (const z of [2590, 2670]) cyl(Rn.x1, z, 3.4, GY, GY + H + 6, metal, { seg: 12 });
  // the gate, swung open into the run
  { const g = new THREE.Group(); g.position.set(Rn.x1, GY, 2590); g.rotation.y = -1.1; LV.add(g); const t = link.clone(); t.needsUpdate = true; t.repeat.set(80 / 9, 84 / 9); const m = new THREE.Mesh(new THREE.PlaneGeometry(80, 84), new THREE.MeshStandardMaterial({ map: t, alphaTest: .5, side: THREE.DoubleSide, metalness: .6, roughness: .45, color: 0xb8c0c2 })); m.position.set(0, 46, 40); m.rotation.y = Math.PI / 2; g.add(m); mesh(new THREE.BoxGeometry(2, 2, 80), metal, 0, 88, 40, { parent: g }); mesh(new THREE.BoxGeometry(2, 2, 80), metal, 0, 4, 40, { parent: g }); }
  // worn earth inside the run
  { const sm = new THREE.MeshStandardMaterial({ map: genSoil(), color: 0xa89a88, roughness: 1, transparent: true, opacity: .85 }); for (const [x, z, r] of [[1600, 2640, 150], [1480, 2480, 80], [1720, 2800, 90]]) { const m = mesh(new THREE.CircleGeometry(r, 32), sm, x, GY + .2, z, { cast: false }); m.rotation.x = -Math.PI / 2; m.scale.set(1.3, 1, 1); } }
  // sign on the fence
  { const s = mesh(new THREE.PlaneGeometry(64, 37), new THREE.MeshStandardMaterial({ map: parkSignTex(), roughness: .6 }), Rn.x1 + 1.5, GY + 70, 2720, { cast: false }); s.rotation.y = Math.PI / 2; }
  // the owners' bench (inside, along the north fence, facing the run)
  { const x = PK.bench.x, z = PK.bench.z; for (const dy of [0, 1]) box(x - 80, x + 80, GY + 38, GY + 42, z - 10 + dy * 9, z - 2 + dy * 9, benchW);
    for (const dy of [0, 1, 2]) box(x - 80, x + 80, GY + 52 + dy * 10, GY + 59 + dy * 10, z - 16, z - 13, benchW, { col: false });
    for (const s of [-70, 70]) { box(x + s - 2, x + s + 2, GY, GY + 38, z - 8, z - 4, metal); box(x + s - 2, x + s + 2, GY, GY + 38, z + 6, z + 10, metal); } }
  // water bowl, a rope toy, and the owners' bucket of dog toys (where a found toy ends up)
  { const bowl = new THREE.Mesh(new THREE.CylinderGeometry(13, 10, 7, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x3a6ac8, roughness: .35, metalness: .2, side: THREE.DoubleSide })); bowl.position.set(1700, GY + 3.5, 2446); LV.add(bowl);
    const wt = mesh(new THREE.CircleGeometry(11.5, 24), new THREE.MeshPhysicalMaterial({ color: 0x8ab8d8, roughness: .05, transmission: .5, transparent: true, opacity: .8 }), 1700, GY + 5, 2446, { cast: false }); wt.rotation.x = -Math.PI / 2;
    const rope = new THREE.Mesh(new THREE.TorusGeometry(9, 2.4, 8, 20), new THREE.MeshStandardMaterial({ color: 0xc84a3a, roughness: .9 })); rope.rotation.x = Math.PI / 2; rope.position.set(1540, GY + 2.4, 2700); LV.add(rope);
    const bx = 1470, bz = 2436, bm = new THREE.MeshStandardMaterial({ color: 0xe8c040, roughness: .5 }), W = 1.6;
    box(bx - 22, bx + 22, GY, GY + 2, bz - 16, bz + 16, bm); box(bx - 22, bx + 22, GY, GY + 34, bz - 16, bz - 16 + W, bm); box(bx - 22, bx + 22, GY, GY + 34, bz + 16 - W, bz + 16, bm); box(bx - 22, bx - 22 + W, GY, GY + 34, bz - 16, bz + 16, bm); box(bx + 22 - W, bx + 22, GY, GY + 34, bz - 16, bz + 16, bm);
    const balls = [0xd8e840, 0xe85a3a, 0x3a8ae8]; for (let i = 0; i < 5; i++) mesh(new THREE.SphereGeometry(R(4, 6), 14, 10), new THREE.MeshStandardMaterial({ color: balls[i % 3], roughness: .7 }), bx + R(-12, 12), GY + 10 + R(0, 6), bz + R(-8, 8));
    cols.push({ t: 'b', x0: bx - 20, x1: bx + 20, y0: GY, y1: GY + 14, z0: bz - 14, z1: bz + 14 });
    PK.bucket = V3(bx, GY + 15, bz); }
  // lamp on a pole in the corner of the run
  { cyl(Rn.x0 + 20, Rn.z0 + 20, 5, GY, GY + 380, metal, { seg: 12 }); mesh(new THREE.BoxGeometry(30, 10, 18), new THREE.MeshStandardMaterial({ color: 0x2a2e32, roughness: .5 }), Rn.x0 + 34, GY + 382, Rn.z0 + 26, { cast: false });
    const l = spotL(0xffd2a0, DAY ? 0 : 260000, V3(Rn.x0 + 34, GY + 376, Rn.z0 + 28), V3(1620, GY, 2620), .78, .7, 1024, 20, 900); PK.lights.push({ p: l.position.clone(), dir: V3().subVectors(V3(1620, GY, 2620), l.position).normalize(), cos: Math.cos(.78), range: 800, I: () => l.intensity }); }
  PK.hard.push(p => p.x > Rn.x0 - 4 && p.x < Rn.x1 + 4 && p.z > Rn.z0 - 4 && p.z < Rn.z0 + 40 && p.x > PK.bench.x - 90 && p.x < PK.bench.x + 90);
}

// ---------- the skate area ----------
function buildSkate(conc, metal, red) {
  const S = PK.skate, cm = new THREE.MeshStandardMaterial({ map: MAT.floor.map, normalMap: MAT.floor.normalMap, color: 0xb4b2ae, roughness: .75 });
  box(S.x0, S.x1, GY - 2, GY + .6, S.z0, S.z1, cm, { uv: 160, col: false, cast: false });
  PK.hard.push(p => p.x > S.x0 - 4 && p.x < S.x1 + 4 && p.z > S.z0 - 4 && p.z < S.z1 + 4);
  // two quarter pipes facing each other (curved faces; colliders step up the curve)
  const qp = (x, dir) => {
    // profile (local x from the back of the deck): deck 24 wide on top, then the curve down to the flat
    const Rr = 80, D = 24, W = S.z1 - S.z0 - 40, sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0, Rr); sh.lineTo(D, Rr);
    for (let i = 1; i <= 16; i++) { const a = i / 16 * Math.PI / 2; sh.lineTo(D + Rr - Math.cos(a) * Rr, Rr - Math.sin(a) * Rr); } sh.lineTo(0, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: false, curveSegments: 1 }); g.translate(0, 0, -W / 2);
    const m = new THREE.Mesh(g, cm); m.position.set(x, GY, (S.z0 + S.z1) / 2); m.scale.x = dir; m.castShadow = m.receiveShadow = true; LV.add(m);
    // coping pipe along the lip
    const cp = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, W, 12), MAT.steel); cp.rotation.x = Math.PI / 2; cp.position.set(x + dir * D, GY + Rr, (S.z0 + S.z1) / 2); LV.add(cp);
    for (let i = 0; i < 6; i++) { const y = (i + 1) / 6 * Rr, xl = D + Rr - Math.sqrt(Math.max(0, Rr * Rr - (Rr - y) * (Rr - y))); const xa = x, xb = x + dir * xl; cols.push({ t: 'b', x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0: GY, y1: GY + y, z0: (S.z0 + S.z1) / 2 - W / 2, z1: (S.z0 + S.z1) / 2 + W / 2 }); }
  };
  qp(S.x0, 1); qp(S.x1, -1);
  // a low ledge and a rail in the middle
  box(2470, 2610, GY, GY + 34, 2440, 2468, cm, { uv: 60 }); box(2470, 2610, GY + 33, GY + 35, 2439, 2469, MAT.steel, { col: false });
  for (const x of [2480, 2600]) cyl(x, 2640, 2.4, GY, GY + 30, metal, { seg: 10 }); { const r = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 130, 12), MAT.steel); r.rotation.z = Math.PI / 2; r.position.set(2540, GY + 31, 2640); r.castShadow = true; LV.add(r); cols.push({ t: 'b', x0: 2475, x1: 2605, y0: GY + 28, y1: GY + 33.6, z0: 2637.4, z1: 2642.6 }); }
  // graffiti tag on the ledge face
  { const [c, x] = cnv(256, 64); x.clearRect(0, 0, 256, 64); x.font = '900 44px "Fredoka", sans-serif'; x.lineWidth = 6; x.strokeStyle = 'rgba(30,30,40,.9)'; x.strokeText('MGP', 60, 48); x.fillStyle = '#e85ab0'; x.fillText('MGP', 60, 48); x.fillStyle = '#4ad8e8'; x.fillText('★', 180, 46);
    const m = mesh(new THREE.PlaneGeometry(120, 30), new THREE.MeshStandardMaterial({ map: tex(c), transparent: true, roughness: .8 }), 2540, GY + 17, 2439.4, { cast: false }); m.rotation.y = Math.PI; }
  // flood light for the skate area
  { cyl(S.x1 + 30, S.z0 - 20, 6, GY, GY + 520, metal, { seg: 12 }); const l = spotL(0xe8f0ff, DAY ? 0 : 380000, V3(S.x1 + 10, GY + 510, S.z0), V3(2540, GY, 2560), .7, .6, 1024, 30, 1000); PK.skL = l; PK.lights.push({ p: l.position.clone(), dir: V3().subVectors(V3(2540, GY, 2560), l.position).normalize(), cos: Math.cos(.7), range: 900, I: () => l.intensity });
    mesh(new THREE.BoxGeometry(40, 16, 6), DAY ? new THREE.MeshStandardMaterial({ color: 0xd8dde4, roughness: .3 }) : new THREE.MeshBasicMaterial({ color: new THREE.Color(0xeef4ff).multiplyScalar(2) }), S.x1 + 14, GY + 512, S.z0 + 2, { cast: false }); }
}

// ---------- the playground ----------
function buildPlayground(Mt) {
  const P = PK.play, T0 = PK.tower, top = PK.plat;
  box(P.x0, P.x1, GY - 2, GY + 1, P.z0, P.z1, Mt.rubberM, { uv: 120, col: false, cast: false });
  box(P.x0 - 6, P.x1 + 6, GY, GY + 4, P.z0 - 6, P.z0, MAT.floor, { col: false }); box(P.x0 - 6, P.x1 + 6, GY, GY + 4, P.z1, P.z1 + 6, MAT.floor, { col: false }); box(P.x0 - 6, P.x0, GY, GY + 4, P.z0, P.z1, MAT.floor, { col: false }); box(P.x1, P.x1 + 6, GY, GY + 4, P.z0, P.z1, MAT.floor, { col: false });
  PK.hard.push(p => p.x > P.x0 - 6 && p.x < P.x1 + 6 && p.z > P.z0 - 6 && p.z < P.z1 + 6 && !(p.x > PK.sand.x0 && p.x < PK.sand.x1 && p.z > PK.sand.z0 && p.z < PK.sand.z1));
  // --- the slide tower: four posts, a deck at 1.2 m with low railings, a ladder (north), a climbing net (west), the slide (east) ---
  const X0 = T0.x - 45, X1 = T0.x + 45, Z0 = T0.z - 45, Z1 = T0.z + 45;
  for (const [x, z] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1]]) { cyl(x, z, 6, GY, top + 70, Mt.yellow, { seg: 16 }); mesh(new THREE.SphereGeometry(7, 16, 10), Mt.red, x, top + 72, z); }
  box(X0, X1, top - 4, top, Z0, Z1, Mt.cedar, { uv: 40 });
  for (let x = X0 + 3; x < X1; x += 11) box(x, x + 9, top - .1, top + .15, Z0 + 2, Z1 - 2, Mt.cedar, { col: false, cast: false });
  // railings: panels on south side, half panels round the ladder (north) and slide (east) openings
  box(X0, X1, top, top + 40, Z1 - 3, Z1, Mt.teal, { uv: 30 }); box(X0, X0 + 3, top, top + 40, Z0, Z1, Mt.teal, { uv: 30 });
  box(X0, T0.x - 16, top, top + 40, Z0, Z0 + 3, Mt.teal, { uv: 30 }); box(T0.x + 16, X1, top, top + 40, Z0, Z0 + 3, Mt.teal, { uv: 30 });
  box(X1 - 3, X1, top, top + 40, Z0, SLIDE.z0, Mt.teal, { uv: 30 }); box(X1 - 3, X1, top, top + 40, SLIDE.z1, Z1, Mt.teal, { uv: 30 });
  // round porthole cut-outs on the south panel (decals)
  for (const x of [T0.x - 20, T0.x + 20]) { const m = mesh(new THREE.CircleGeometry(9, 24), new THREE.MeshStandardMaterial({ color: 0x14302f, roughness: .6 }), x, top + 22, Z1 + .2, { cast: false }); }
  // the roof frame (open — the sun shines straight onto the deck), with a flag
  for (const [xa, za, xb, zb] of [[X0, Z0, X1, Z0], [X0, Z1, X1, Z1]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 90, 10), Mt.yellow); b.rotation.z = Math.PI / 2; b.position.set(T0.x, top + 70, za); b.castShadow = true; LV.add(b); }
  { cyl(X1, Z0, 1.6, top + 70, top + 150, MAT.steel, { seg: 8, col: false }); const fl = new THREE.Mesh(new THREE.PlaneGeometry(36, 22, 8, 1), new THREE.MeshStandardMaterial({ color: 0xe0a83a, roughness: .7, side: THREE.DoubleSide })); fl.position.set(X1 + 18, top + 138, Z0); LV.add(fl); PK.flag = fl; }
  // ladder on the north side: two rails and rungs (climbable — it's a wall to a 5 cm hero)
  { const lz = Z0 - 18; for (const s of [-14, 14]) { const r = new THREE.Mesh(new THREE.BoxGeometry(4, top + 20 - GY, 4), Mt.yellow); r.position.set(T0.x + s, (GY + top + 20) / 2, lz); r.rotation.x = .26; r.castShadow = true; LV.add(r); }
    for (let i = 1; i < 6; i++) { const y = GY + i * 20; const r = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 28, 10), MAT.steel); r.rotation.z = Math.PI / 2; r.position.set(T0.x, y, lz + (y - (GY + top) / 2) * .27 - 2); r.castShadow = true; LV.add(r); }
    // steps that follow the ladder's lean: climb a rung's height, step up, climb again
    const zl = y => lz + (y - (GY + top + 20) / 2) * .267; for (let i = 0; i < 6; i++) { const y1 = GY + (i + 1) / 6 * (top - GY); cols.push({ t: 'b', x0: T0.x - 16, x1: T0.x + 16, y0: GY, y1, z0: zl(y1) - 3, z1: Z0, noCam: true }); } }
  // climbing net on the west side
  { const nm = new THREE.LineBasicMaterial({ color: 0x2a2a2a }), pts = []; const nx0 = X0 - 60;
    for (let i = 0; i <= 8; i++) { const z = Z0 + 6 + i * 10; pts.push(V3(nx0, GY, z), V3(X0, top, z)); }
    for (let j = 1; j < 8; j++) { const t = j / 8; pts.push(V3(lerp(nx0, X0, t), lerp(GY, top, t), Z0 + 6), V3(lerp(nx0, X0, t), lerp(GY, top, t), Z0 + 86)); }
    const g = new THREE.BufferGeometry().setFromPoints(pts); LV.add(new THREE.LineSegments(g, nm));
    const rope = new THREE.MeshStandardMaterial({ color: 0x3a3632, roughness: .95 }); for (let i = 0; i <= 8; i += 2) { const a = V3(nx0, GY, Z0 + 6 + i * 10), b = V3(X0, top, Z0 + 6 + i * 10), d = V3().subVectors(b, a); const m = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, d.length(), 6), rope); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); LV.add(m); }
    // a stepped collider under the net: climbing up the net works like steep steps
    for (let i = 0; i < 8; i++) { const x = lerp(nx0, X0, (i + 1) / 8), y = lerp(GY, top, (i + 1) / 8); cols.push({ t: 'b', x0: x - 7.5, x1: X0, y0: GY, y1: y, z0: Z0 + 4, z1: Z0 + 88, noRay: true, noCam: true }); } }
  // the slide: a smooth tub from the deck down to the mat
  { const N = 36, W = SLIDE.z1 - SLIDE.z0, pos = [], idx = [], nrm = [];
    const prof = [[-W / 2 - 4, 12], [-W / 2 - 2, 14], [-W / 2, 12], [-W / 2 + 2, 1.5], [-W / 2 + 8, 0], [W / 2 - 8, 0], [W / 2 - 2, 1.5], [W / 2, 12], [W / 2 + 2, 14], [W / 2 + 4, 12]];
    for (let i = 0; i <= N; i++) { const x = lerp(SLIDE.x0, SLIDE.x1, i / N), y = slideH(x); for (const [dz, dy] of prof) pos.push(x, y + dy, (SLIDE.z0 + SLIDE.z1) / 2 + dz); }
    const P2 = prof.length; for (let i = 0; i < N; i++) for (let j = 0; j < P2 - 1; j++) { const a = i * P2 + j, b = a + P2; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, Mt.slideM); m.castShadow = m.receiveShadow = true; m.material.side = THREE.DoubleSide; LV.add(m);
    // its underside and a support leg
    cyl(SLIDE.x1 - 30, (SLIDE.z0 + SLIDE.z1) / 2, 3.2, GY, slideH(SLIDE.x1 - 30) - 2, Mt.yellow, { seg: 10 });
    // side walls of the tub stop you walking off sideways (low, so you can still jump out)
    for (let i = 0; i < 6; i++) { const xa = lerp(SLIDE.x0, SLIDE.x1, i / 6), xb = lerp(SLIDE.x0, SLIDE.x1, (i + 1) / 6); for (const [za, zb] of [[SLIDE.z0 - 4, SLIDE.z0 - 1], [SLIDE.z1 + 1, SLIDE.z1 + 4]]) cols.push({ t: 'b', x0: xa, x1: xb, y0: slideH(xb) - 2, y1: slideH(xa) + 14, z0: za, z1: zb, noRay: true, noCam: true, slick: true }); } }
  PK.shade.push({ x: T0.x, z: T0.z, r: 50, below: top - 4 });
  // --- swings: an A-frame with two seats on chains ---
  { const sx0 = 1880, sx1 = 2060, sz = 2900, hh = 230, fm = Mt.red; PK.swings = [];
    for (const x of [sx0, sx1]) for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, Math.hypot(hh, 60), 12), fm); leg.position.set(x, GY + hh / 2, sz + s * 30); leg.rotation.x = s * Math.atan2(60, hh); leg.castShadow = true; LV.add(leg); }
    { const b = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.4, sx1 - sx0 + 16, 14), fm); b.rotation.z = Math.PI / 2; b.position.set((sx0 + sx1) / 2, GY + hh, sz); b.castShadow = true; LV.add(b); cols.push({ t: 'b', x0: sx0 - 8, x1: sx1 + 8, y0: GY + hh - 4.4, y1: GY + hh + 4.4, z0: sz - 4.4, z1: sz + 4.4 }); }
    for (const x of [sx0, sx1]) for (const s of [-1, 1]) { const a = V3(x, GY, sz + s * 60), b = V3(x, GY + hh, sz); cols.push({ t: 'c', x: x, z: sz + s * 52, r: 5, y0: GY, y1: GY + 30, noRay: true }); }
    for (const x of [1925, 2015]) { const piv = new THREE.Group(); piv.position.set(x, GY + hh - 4, sz); LV.add(piv); const chain = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: .9, roughness: .35 });
      for (const s of [-18, 18]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 186, 6), chain); c.position.set(s, -93, 0); piv.add(c); }
      const seat = new THREE.Mesh(new THREE.BoxGeometry(44, 3, 16), new THREE.MeshStandardMaterial({ color: 0x1c1e20, roughness: .8 })); seat.position.set(0, -188, 0); seat.castShadow = true; piv.add(seat); PK.swings.push({ piv, ph: R(0, 6), amp: R(.05, .12) }); } }
  // --- sandbox: a timber frame full of sand, with a bucket and spade ---
  { const S = PK.sand, h = 16, w = 8;
    box(S.x0, S.x1, GY, GY + h, S.z0, S.z0 + w, Mt.cedar, { uv: 30 }); box(S.x0, S.x1, GY, GY + h, S.z1 - w, S.z1, Mt.cedar, { uv: 30 }); box(S.x0, S.x0 + w, GY, GY + h, S.z0 + w, S.z1 - w, Mt.cedar, { uv: 30 }); box(S.x1 - w, S.x1, GY, GY + h, S.z0 + w, S.z1 - w, Mt.cedar, { uv: 30 });
    box(S.x0 + w, S.x1 - w, GY, GY + 10, S.z0 + w, S.z1 - w, Mt.sandM, { uv: 50, cast: false });
    // a few heaped mounds and a half-built castle
    for (const [x, z, r] of [[1920, 3140, 22], [1990, 3180, 16]]) { const m = mesh(new THREE.SphereGeometry(r, 20, 10, 0, 6.283, 0, Math.PI / 2), Mt.sandM, x, GY + 10, z); m.scale.y = .45; }
    PK.mound = mesh(new THREE.SphereGeometry(14, 20, 10, 0, 6.283, 0, Math.PI / 2), Mt.sandM, 1960, GY + 10, 3150, { cast: false }); PK.mound.scale.y = .01;   // where the mole pops up
    cyl(2005, 3120, 7, GY + 10, GY + 26, new THREE.MeshStandardMaterial({ color: 0xd2c29a, roughness: 1 }), { rt: 5.5, seg: 8 });
    const bkt = new THREE.Mesh(new THREE.CylinderGeometry(9, 7, 14, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x3a8ae8, roughness: .45, side: THREE.DoubleSide })); bkt.position.set(1900, GY + 17, 3110); bkt.rotation.z = 1.3; bkt.castShadow = true; LV.add(bkt);
    const sp = new THREE.Group(); sp.position.set(2015, GY + 12, 3185); sp.rotation.set(.2, .6, 1.45); LV.add(sp); mesh(new THREE.CylinderGeometry(1, 1, 22, 8), new THREE.MeshStandardMaterial({ color: 0xe8c040, roughness: .5 }), 0, 0, 0, { parent: sp }); mesh(new THREE.BoxGeometry(8, 9, 1), new THREE.MeshStandardMaterial({ color: 0xe8c040, roughness: .5 }), 0, -14, 0, { parent: sp }); }
  // --- a spring rider (a duck) ---
  { const x = 2330, z = 3170, duck = new THREE.MeshPhysicalMaterial({ color: 0xe8c040, roughness: .35, clearcoat: .7 });
    const spr = []; for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 12; spr.push(V3(Math.cos(a) * 7, GY + 4 + i / 60 * 30, Math.sin(a) * 7)); } const sg = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spr), 200, 1.4, 6), MAT.steel); sg.position.set(x, 0, z); LV.add(sg);
    cyl(x, z, 16, GY, GY + 4, MAT.dsteel, { seg: 16 });
    const d = new THREE.Group(); d.position.set(x, GY + 34, z); LV.add(d); PK.duck = d;
    const body = new THREE.Mesh(ell(16, 11, 26, 24, 16), duck); body.position.y = 12; body.castShadow = true; d.add(body);
    const head = new THREE.Mesh(ell(9, 10, 9, 20, 14), duck); head.position.set(0, 30, 16); head.castShadow = true; d.add(head);
    const bill = new THREE.Mesh(ell(5, 2.4, 7, 14, 8), new THREE.MeshStandardMaterial({ color: 0xe0702a, roughness: .5 })); bill.position.set(0, 28, 25); d.add(bill);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 8), MAT.black); e.position.set(s * 6.4, 33, 21); d.add(e); const hd = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 16, 8), MAT.steel); hd.rotation.z = Math.PI / 2; hd.position.set(0, 34, 12); d.add(hd); }
    cols.push({ t: 'c', x, z, r: 17, y0: GY, y1: GY + 56 }); }
  // a lamp over the playground (warm, shadowed)
  { cyl(2440, 2830, 5, GY, GY + 440, MAT.dsteel, { seg: 12 }); box(2380, 2444, GY + 436, GY + 442, 2826, 2834, MAT.dsteel, { col: false }); mesh(new THREE.CylinderGeometry(12, 8, 10, 12), DAY ? new THREE.MeshStandardMaterial({ color: 0xe0dcd0, roughness: .25 }) : new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffcf90).multiplyScalar(2.2) }), 2384, GY + 432, 2830, { cast: false });
    const l = spotL(0xffc890, DAY ? 0 : 200000, V3(2384, GY + 428, 2830), V3(2300, GY, 3060), .82, .75, 1024, 20, 800); PK.lights.push({ p: l.position.clone(), dir: V3().subVectors(V3(2300, GY, 3060), l.position).normalize(), cos: Math.cos(.82), range: 700, I: () => l.intensity }); }
  // where the chip sits to charge (a little glow while it does)
  { const g = new THREE.Group(); g.position.copy(PK.chipP); LV.add(g); g.visible = false; PK.chipG = g;
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(5, .6, 4), new THREE.MeshStandardMaterial({ color: 0x1f6a3a, roughness: .4, metalness: .2 })); g.add(pcb); const ic = new THREE.Mesh(new THREE.BoxGeometry(2.4, .6, 2.4), MAT.black); ic.position.y = .5; g.add(ic);
    for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(.3, .2, .8), MAT.brass); p.position.set(-1.6 + i * .64, .1, 2.2); g.add(p); }
    PK.chipGlow = new THREE.Mesh(new THREE.RingGeometry(3.2, 4.4, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9cc8ff).multiplyScalar(2), transparent: true, opacity: .6, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })); PK.chipGlow.rotation.x = -Math.PI / 2; PK.chipGlow.position.y = .4; g.add(PK.chipGlow); }
}

// =====================================================================
//  people and dogs
// =====================================================================
function buildParkPeople() {
  const pants = c => new THREE.MeshStandardMaterial({ color: c, roughness: .85 }), puff = (c, sc) => new THREE.MeshPhysicalMaterial({ color: c, roughness: .5, sheen: .6, sheenColor: sc, clearcoat: .25 });
  const shoe = c => new THREE.MeshStandardMaterial({ color: c, roughness: .6 });
  // two dog owners on the bench in the dog run
  const mk = (o, x, name, col) => { const H = buildHuman(o); H.pos.set(x, GY + 10, PK.bench.z - 4); H.yaw = 0; H.root.visible = true; H.pelvis.position.y = 44;
    for (const L of H.legs) { L.hip.rotation.x = -1.45; L.knee.rotation.x = 1.5; L.ankle.rotation.x = 0; } H.root.position.copy(H.pos); npcHome(H.root, H.pos, 0, 'park');
    const O = { H, name, col, mode: 'chat', t: R(4, 8), look: V3(), lookK: 0, aimY: 0 }; PK.owners.push(O); return O; };
  const A = mk({ pants: pants(0x2a2f3a), top: puff(0x8a2f3a, 0xe8a0a8), skin: MAT.skin, shoe: shoe(0xe4e0d8), hair: 0x3a2418, cap: new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: .95 }) }, PK.bench.x - 34, '狗主（女）', '#e8a0a8');
  const B = mk({ pants: pants(0x303a2a), top: new THREE.MeshPhysicalMaterial({ color: 0x4a5a6a, roughness: .9, sheen: .5, sheenColor: 0x9ab0c4 }), skin: MAT.skin, shoe: shoe(0x2a2a2a), hair: 0x1a1410 }, PK.bench.x + 34, '狗主（男）', '#9ab0c4');
  // her phone; his coffee
  { const ph = new THREE.Mesh(new THREE.BoxGeometry(7, 14, 1), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: .3 })); ph.position.set(0, -3, 3); A.H.arms[1].hand.add(ph); const scr = new THREE.Mesh(new THREE.PlaneGeometry(6, 12.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xbcd8ff).multiplyScalar(1.5) })); scr.rotation.y = Math.PI; scr.position.z = -.6; ph.add(scr); A.phone = ph; }
  { const cup = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 3.6, 12, 16), new THREE.MeshStandardMaterial({ color: 0xf0ece4, roughness: .6 })); cup.position.set(0, -4, 2); B.H.arms[0].hand.add(cup); const lid = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 1.6, 16), MAT.black); lid.position.y = 6.6; cup.add(lid); B.cup = cup; }
  A.dog = 0; B.dog = 1; A.other = B; B.other = A;
  // their dogs: a golden retriever and a little white terrier
  const d0 = buildDog({ pos: V3(1560, GY, 2700), anchor: null, fur: 0xd09a50, belly: 0xf0d2a0, k: .95, collar: 0x2a6ac8, keep: true });
  const d1 = buildDog({ pos: V3(1720, GY, 2560), anchor: null, fur: 0xf2eee6, belly: 0xfaf6ee, k: .52, collar: 0xc83a3a, keep: true });
  for (const [D, nm, cl] of [[d0, '金仔', '#d09a50'], [d1, '豆腐', '#f2eee6']]) { D.mode = 'roam'; D.sleepK = 0; D.t = R(2, 5); D.name = nm; D.col = cl; D.target = null; D.sp = 0; D.vx = 0; D.vz = 0; npcHome(D.root, D.pos, D.yaw, 'park'); PK.dogs.push(D); }
  // the ball
  { const g = new THREE.Group(); const fm = new THREE.MeshStandardMaterial({ color: 0xd8e840, roughness: .95 }); const b = new THREE.Mesh(new THREE.SphereGeometry(3.3, 20, 14), fm); b.castShadow = true; g.add(b); const seam = new THREE.Mesh(new THREE.TorusGeometry(3.32, .18, 6, 32), new THREE.MeshStandardMaterial({ color: 0xf4f4e8, roughness: .9 })); seam.rotation.x = 1.1; g.add(seam);
    g.position.set(1600, GY + 3.3, 2480); LV.add(g); npcHome(g, g.position, 0, 'park'); PK.ball = { g, p: g.position, v: V3(), held: -1, air: false, rest: true, dog: -1 }; }
  // a jogger with a head torch, running laps of the loop path
  { const vest = new THREE.MeshPhysicalMaterial({ color: 0xc8f040, roughness: .45, sheen: .4, sheenColor: 0xf0ffa0, emissive: 0x1a2408 });
    const H = buildHuman({ pants: pants(0x16181c), top: vest, skin: MAT.skin, shoe: shoe(0xf06a3a), hair: 0x2a1a10, cap: new THREE.MeshStandardMaterial({ color: 0x1a1c22, roughness: .7 }) });
    H.root.visible = true;
    if (DAY) { for (const sx of [-4, 4]) { const g = new THREE.Mesh(new THREE.SphereGeometry(2.6, 14, 10), new THREE.MeshPhysicalMaterial({ color: 0x101418, roughness: .05, metalness: .6, clearcoat: 1 })); g.scale.set(1, .7, .4); g.position.set(sx, 3.4, 10.2); H.head.add(g); } }   // sunglasses
    else { const lampM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf4f8ff).multiplyScalar(3) }); const hl = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 2), lampM); hl.position.set(0, 4, 10.4); H.head.add(hl); }
    const strap = new THREE.Mesh(new THREE.TorusGeometry(10.2, .7, 6, 28), MAT.black); strap.rotation.x = Math.PI / 2 - .2; strap.position.y = 4; H.head.add(strap);
    // the torch's light lives in the park's own light list (the light pool lends it a real light when it matters); it follows his head each frame
    const lt = new THREE.SpotLight(0xeef4ff, DAY ? 0 : 90000, 0, .42, .5, 2); LV.add(lt, lt.target); const hp = new THREE.Object3D(); hp.position.set(0, 4, 12); H.head.add(hp); const tg = new THREE.Object3D(); tg.position.set(0, -30, 120); H.head.add(tg);
    const J = { H, a: 0, v: 300, mode: 'run', t: 0, laps: 0, lamp: lt, lampAt: hp, lampTo: tg, ent: { p: V3(), dir: V3(), cos: Math.cos(.42), range: 420, I: () => lt.intensity } }; PK.lights.push(J.ent);
    const L = PK.loop; H.pos.set(L.cx, GY, L.cz - L.rz); npcHome(H.root, H.pos, 0, 'park'); PK.jog = J; }
  // a teenager on the skate ramps
  { const hood = new THREE.MeshPhysicalMaterial({ color: 0x3a3048, roughness: .9, sheen: .6, sheenColor: 0x8a78a8 });
    const H = buildHuman({ pants: pants(0x5a5848), top: hood, skin: MAT.skin, shoe: shoe(0xe8e4dc), hair: 0x1a120c, cap: new THREE.MeshStandardMaterial({ color: 0xc83a3a, roughness: .95 }) });
    H.root.visible = true; const bd = new THREE.Group(); LV.add(bd);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(20, 1.4, 80), new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: .6 })); deck.position.y = 7; deck.castShadow = true; bd.add(deck);
    const under = new THREE.Mesh(new THREE.BoxGeometry(19, .4, 79), new THREE.MeshStandardMaterial({ color: 0xe85ab0, roughness: .6 })); under.position.y = 6.2; bd.add(under);
    const wm = new THREE.MeshStandardMaterial({ color: 0xf0e8c8, roughness: .5 }), wheels = []; for (const z of [-28, 28]) { const tr = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 4), MAT.steel); tr.position.set(0, 4.6, z); bd.add(tr); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 3, 14), wm); w.rotation.z = Math.PI / 2; w.position.set(s * 8.5, 2.8, z); bd.add(w); wheels.push(w); } }
    const S = PK.skate, K = { H, bd, wheels, x: S.x0 + 140, dir: 1, v: 240, y: GY, mode: 'ride', t: R(30, 45), turnT: 0, z: 2560, said: 0 };
    H.pos.set(K.x, GY + 8, K.z); npcHome(H.root, H.pos, 0, 'park'); npcHome(bd, V3(K.x, GY, K.z), 0, 'park'); PK.sk = K; }
}

// ---------- the owners ----------
function ownerLook(p, t, who) {
  for (const O of PK.owners) { O.mode = 'alert'; O.t = t * R(.85, 1.1); O.look.set(p.x, GY + 4, p.z); }
  if (!PK.said.look || T - PK.said.look > 10) { PK.said.look = T; const O = who || PK.owners[0]; sayW(O.name, rnd() < .5 ? `${PK.dogs[O.dog].name}，看到什麼了？` : '……那邊有東西？', O.col, 2.4); }
}
function updOwners(dt) {
  for (const O of PK.owners) {
    const H = O.H, D = PK.dogs[O.dog]; O.t -= dt; if (NET.client) O.t = 99;
    if (TAKE.job && TAKE.job.who === 'pdog' && TAKE.job.mode === 'drop' && O === PK.owners[0]) { O.mode = 'watch'; O.t = 2; }
    if (O.mode === 'chat') { O.look.set(O.other.H.pos.x, GY + 120, O.other.H.pos.z + 10); if (O.t <= 0) { O.mode = rnd() < .5 ? 'watch' : (O.phone ? 'phone' : 'watch'); O.t = R(5, 9); } }
    else if (O.mode === 'watch') { O.look.set(D.pos.x, GY + 20, D.pos.z); if (O.t <= 0) { O.mode = rnd() < .55 ? 'chat' : (O.phone ? 'phone' : 'chat'); O.t = R(5, 10); } }
    else if (O.mode === 'phone') { O.look.set(H.pos.x, GY + 40, H.pos.z + 30); if (O.t <= 0) { O.mode = 'chat'; O.t = R(4, 8); } }
    else if (O.mode === 'alert') { if (O.t <= 0) { O.mode = 'watch'; O.t = R(3, 6); } }
    else if (O.mode === 'throw') { O.look.set(PK.ball.p.x, PK.ball.p.y, PK.ball.p.z); if (O.t <= 0) { O.mode = 'watch'; O.t = R(4, 7); } O.throwK = (O.throwK || 0) + dt; } if (O.mode !== 'throw') O.throwK = 0;
    O.lookK = damp(O.lookK, O.mode === 'phone' ? 0 : 1, 3, dt);
    H.aimT.copy(O.look); H.aim.lerp(H.aimT, 1 - Math.exp(-3 * dt)); humanAimArm(H, 0, dt);
    H.chest.rotation.x = O.mode === 'phone' ? .25 : O.mode === 'alert' ? -.05 : .06;
    // arms: phone held low in her lap, his coffee near his chest; a big overarm swing when throwing
    const R1 = H.arms[1], R0 = H.arms[0];
    if (O.mode === 'throw') { const k = clamp(O.throwK / .5, 0, 1); R1.sh.rotation.set(-2.6 + k * 2.2, 0, 0); R1.el.rotation.x = -.6 + k * .4; }
    else if (O.phone) { R1.sh.rotation.set(O.mode === 'phone' ? -.9 : -.5, -.3, 0); R1.el.rotation.x = O.mode === 'phone' ? -1.2 : -.9; }
    else { R1.sh.rotation.set(-.35, .1, 0); R1.el.rotation.x = -.5; }
    if (O.cup) { R0.sh.rotation.set(-.7, .2, 0); R0.el.rotation.x = -1.5; } else { R0.sh.rotation.set(-.4, -.1, 0); R0.el.rotation.x = -.7; }
    H.root.position.copy(H.pos); H.root.rotation.y = H.yaw;
  }
}
// ---------- the dogs ----------
function runSpot() { const R0 = PK.run; return V3(R(R0.x0 + 40, R0.x1 - 40), GY, R(R0.z0 + 110, R0.z1 - 40)); }
function inRun(p, m = 0) { const R0 = PK.run; return p.x > R0.x0 + m && p.x < R0.x1 - m && p.z > R0.z0 + m && p.z < R0.z1 - m; }
const RUN_GATE = V3(1820, GY, 2630);
function dogGo(D, t, sp, dt) {   // walk toward t — through the gate when one end is inside the run and the other outside
  let tgt = t; const a = inRun(D.pos, -6), b = inRun(t, -6);
  if (a !== b) { const inner = V3(RUN_GATE.x - 26, GY, RUN_GATE.z), outer = V3(RUN_GATE.x + 30, GY, RUN_GATE.z), first = a ? inner : outer;
    tgt = Math.hypot(D.pos.x - first.x, D.pos.z - first.z) > 12 ? first : (a ? outer : inner); }
  return moveDog(D, tgt, sp, dt) && tgt === t;
}
function dogBarkAt(D, p, t = 3) {
  D.mode = 'bark'; D.t = t; D.look.copy(p); D.barkT = 0;
  const O = PK.owners.find(o => PK.dogs[o.dog] === D) || PK.owners[0]; ownerLook(p, t + 1.5, O);
}
function parkDogBark(D) { const big = D.root.scale.x > .8; tone(big ? 300 : 620, big ? 170 : 420, .12, .1, 'sawtooth'); nz(.1, big ? 800 : 1600, 1.3, .14); if (!D.saidT || T - D.saidT > 5) { D.saidT = T; sayW(D.name, big ? '汪！汪！' : '吠吠吠！', D.col, 1.4); } }
function updParkDogs(dt) {
  const B = PK.ball;
  PK.dogs.forEach((D, i) => {
    if (TAKE.job && TAKE.job.who === 'pdog' && TAKE.job.dog === i) { pdogTake(TAKE.job, D, dt); return; }
    D.t -= dt; let sp = 0; const P = D.pos;
    if (D.mode === 'roam') { if (!D.target || D.t <= 0) { D.target = rnd() < .15 ? V3(1700, GY, 2470) : runSpot(); D.t = R(4, 9); } if (dogGo(D, D.target, 36, dt)) { sp = 0; if (rnd() < dt * .5) D.target = null; } else sp = 36; }
    else if (D.mode === 'chase') { if (B.held >= 0 && B.held !== i) { D.mode = 'roam'; D.t = 2; } else if (!B.air) { if (dogGo(D, B.p, 150, dt) || Math.hypot(B.p.x - P.x, B.p.z - P.z) < 10) { B.held = i; B.rest = false; D.mode = 'return'; } else sp = 150; } else { if (!dogGo(D, V3(B.p.x, GY, B.p.z), 130, dt)) sp = 130; } }
    else if (D.mode === 'return') { const tgt = V3(PK.bench.x + (i ? 30 : -30), GY, PK.bench.z + 56); if (dogGo(D, tgt, 90, dt)) { D.mode = 'give'; D.t = 1.2; D.yaw = Math.PI; } else sp = 90; }
    else if (D.mode === 'give') { if (D.t <= 0) { B.held = -1; B.rest = true; B.p.set(D.pos.x, GY + 3.3, D.pos.z - 8); D.mode = 'sit'; D.t = R(2, 4); PK.throwT = R(2.5, 5); PK.thrower = i; } }
    else if (D.mode === 'sit') { if (D.t <= 0) { D.mode = 'roam'; D.t = R(3, 6); } }
    else if (D.mode === 'sniff') { if (dogGo(D, D.look, 22, dt) || Math.hypot(D.look.x - P.x, D.look.z - P.z) < 18) { dogBarkAt(D, D.look, 3); } else sp = 22; if (D.t <= 0) { D.mode = 'roam'; D.t = 2; } }
    else if (D.mode === 'bark' || D.mode === 'alert') { const dx = D.look.x - P.x, dz = D.look.z - P.z; D.yaw = angDamp(D.yaw, Math.atan2(dx, dz), 5, dt); if (D.mode === 'bark' && (D.barkT -= dt) <= 0) { D.barkT = D.root.scale.x > .8 ? .7 : .35; parkDogBark(D); } if (D.t <= 0) { D.mode = 'roam'; D.t = R(2, 4); } }
    else if (D.mode === 'out') { if (!D.target || D.t <= 0 && D.leg < 4) { D.target = V3(PK.tower.x + R(-160, 200), GY, PK.tower.z + R(-160, 180)); D.t = R(3, 6); D.leg = (D.leg || 0) + 1; } if (dogGo(D, D.target, 44, dt)) D.target = null; else sp = 44; if (D.leg >= 4 && D.t <= 0) { D.mode = 'home'; } }
    else if (D.mode === 'home') { const tgt = V3(PK.bench.x + 60, GY, PK.bench.z + 70); if (dogGo(D, tgt, 70, dt)) { D.mode = 'sit'; D.t = 3; } else sp = 70; }
    // stay in the run unless out on an errand
    if (!['out', 'home', 'sniff', 'bark'].includes(D.mode) && !(TAKE.job && TAKE.job.dog === i)) { const R0 = PK.run; P.x = clamp(P.x, R0.x0 + 14, R0.x1 - 14); P.z = clamp(P.z, R0.z0 + 30, R0.z1 - 14); }
    // never stand on the owners' bench
    if (inRun(P) && Math.abs(P.x - PK.bench.x) < 86 && P.z < PK.bench.z + 16) P.z = PK.bench.z + 16;
    // bump into small things in the way
    if (sp > 30 && !NET.client) for (const C of party) if (mine(C) && !C.frozen && C.pos.y < GY + 10 && C.state !== 'dig' && Math.hypot(C.pos.x - (P.x + Math.sin(D.yaw) * 26 * D.root.scale.x), C.pos.z - (P.z + Math.cos(D.yaw) * 26 * D.root.scale.x)) < 12) knock(C, V3(P.x, GY, P.z), C === leader ? `被${D.name}撞開了！` : null);
    D.sp = sp; const m0 = D.mode; if (D.mode === 'roam' || D.mode === 'out' || D.mode === 'home') D.mode = sp < 8 ? 'sniff' : 'walk'; if (D.mode === 'chase' || D.mode === 'return') D.mode = 'walk'; dogAnim(D, sp, dt); D.mode = m0;
    if (D.mode === 'sit') { D.body.position.y = lerp(D.body.position.y, 34, .3); D.legs[2].g.rotation.x = 1.1; D.legs[3].g.rotation.x = 1.1; D.body.rotation.x = -.3; } else D.body.rotation.x = 0;
    D.tongue.visible = sp > 60 || D.mode === 'sit';
  });
  // the owner throws the ball again (host decides)
  if (!NET.client && B.rest && B.held < 0 && PK.throwT != null) { PK.throwT -= dt; if (PK.throwT <= 0) { PK.throwT = null; ballThrow(PK.thrower || 0); } }
}
function ballThrow(i) {
  const O = PK.owners[i] || PK.owners[0], B = PK.ball, to = runSpot(); to.z = Math.max(to.z, PK.run.z0 + 200);
  B.p.set(O.H.pos.x, GY + 110, O.H.pos.z + 10); const d = V3(to.x - B.p.x, 0, to.z - B.p.z), dist = d.length(), tf = clamp(dist / 260, .9, 1.8);
  B.v.set(d.x / tf, (GY - B.p.y + .5 * 250 * tf * tf) / tf, d.z / tf); B.air = true; B.rest = false; B.held = -1; O.mode = 'throw'; O.t = 1.2;
  const D = PK.dogs[i]; if (D && !['out', 'home', 'bark', 'sniff'].includes(D.mode)) { D.mode = 'chase'; } const D2 = PK.dogs[1 - i]; if (D2 && D2.mode === 'roam' && rnd() < .4) D2.mode = 'chase';
  tone(500, 300, .05, .04, 'triangle');
}
function updBall(dt) {
  const B = PK.ball; if (!B) return;
  if (B.held >= 0) { const D = PK.dogs[B.held]; const p = V3(); D.head.getWorldPosition(p); const k = D.root.scale.x; B.p.set(p.x + Math.sin(D.yaw) * 12 * k, p.y - 7 * k, p.z + Math.cos(D.yaw) * 12 * k); }
  else if (B.air) { B.v.y -= 250 * dt; B.p.addScaledVector(B.v, dt); if (B.p.y < GY + 3.3) { B.p.y = GY + 3.3; if (Math.abs(B.v.y) > 40) { B.v.y = -B.v.y * .45; B.v.x *= .7; B.v.z *= .7; tone(180, 120, .04, .04); } else { B.v.y = 0; B.air = false; } } }
  else if (!B.rest) { B.v.multiplyScalar(Math.exp(-2.5 * dt)); B.p.addScaledVector(B.v, dt); }
  const R0 = PK.run; B.p.x = clamp(B.p.x, R0.x0 + 6, R0.x1 - 6); B.p.z = clamp(B.p.z, R0.z0 + 6, R0.z1 - 6);
  B.g.rotation.x += (B.v.z || 0) * dt * .2; B.g.rotation.z -= (B.v.x || 0) * dt * .2;
}
// ---------- the jogger ----------
function jogPos(a) { const L = PK.loop; return V3(L.cx + Math.sin(a) * L.rx, GY, L.cz - Math.cos(a) * L.rz); }
function updJogger(dt) {
  const J = PK.jog; if (!J) return; const H = J.H; let moveD = 0;
  if (J.mode === 'run') {
    const L = PK.loop, r = Math.hypot(Math.cos(J.a) * L.rx, Math.sin(J.a) * L.rz); const da = NET.client ? 0 : J.v * dt / r, a0 = J.a; J.a += da;
    if (Math.floor(a0 / 6.2832) !== Math.floor(J.a / 6.2832)) { J.laps++; if (J.laps % 2 === 0) { J.mode = 'stretch'; J.t = R(9, 13); J.a = Math.ceil(a0 / 6.2832) * 6.2832; } }
    const p = jogPos(J.a), q = jogPos(J.a + .02); H.pos.copy(p); moveD = J.v * dt * .55; H.yaw = angDamp(H.yaw, Math.atan2(q.x - p.x, q.z - p.z), 8, dt);
    H.aimT.set(q.x + (q.x - p.x) * 20, GY + 40, q.z + (q.z - p.z) * 20);
    // feet: knock over anyone small on the path just ahead
    if (!NET.client) for (const C of party) if (mine(C) && !C.frozen && C.pos.y < GY + 12 && C.state !== 'dig' && Math.hypot(C.pos.x - p.x, C.pos.z - p.z) < 20) knock(C, V3(p.x - Math.sin(H.yaw) * 30, GY, p.z - Math.cos(H.yaw) * 30), C === leader ? '差點被跑步的人踩到！' : null);
    if (!PK.said.jog || T - PK.said.jog > 6) { const d = leader ? Math.hypot(leader.pos.x - p.x, leader.pos.z - p.z) : 999; if (d < 500 && d > 0) { PK.said.jog = T; tone(80, 70, .05, .05); } }
  } else if (J.mode === 'stretch' || J.mode === 'alert') {
    if (J.mode === 'stretch') H.aimT.set(H.pos.x + Math.sin(H.yaw) * 100, GY + 60 + Math.sin(T * .7) * 30, H.pos.z + Math.cos(H.yaw) * 100);
    else H.aimT.copy(J.look);
    if ((J.t -= dt) <= 0 && !NET.client) { J.mode = 'run'; }
  }
  H.aim.lerp(H.aimT, 1 - Math.exp(-4 * dt));
  humanAnim(H, moveD, dt); humanAimArm(H, 0, dt);
  if (J.mode === 'run') { for (const L of H.legs) { L.hip.rotation.x *= 1.7; L.knee.rotation.x = .3 + Math.max(0, Math.cos(H.phase) * L.s) * 1.5; } H.chest.rotation.x = .16; H.pelvis.position.y = 90 + Math.abs(Math.sin(H.phase)) * 5 - 3; for (const A of H.arms) { A.sh.rotation.set(Math.sin(H.phase) * A.s * .9 - .2, 0, -A.s * .12); A.el.rotation.x = -1.5; } }
  else { H.chest.rotation.x = J.mode === 'stretch' ? .5 + Math.sin(T * .7) * .3 : 0; for (const A of H.arms) { A.sh.rotation.set(J.mode === 'stretch' ? -.3 : -.2, 0, -A.s * .1); A.el.rotation.x = -.3; } }
  // the head torch feeds the detection light list
  H.root.updateMatrixWorld(true); J.lampAt.getWorldPosition(J.lamp.position); J.lampTo.getWorldPosition(J.lamp.target.position); J.lamp.target.updateMatrixWorld();
  J.ent.p.copy(J.lamp.position); J.ent.dir.subVectors(J.lamp.target.position, J.ent.p).normalize();
}
function jogLook(p, t) { const J = PK.jog; if (!J) return; J.mode = 'alert'; J.t = t; J.look = V3(p.x, GY + 4, p.z); if (!PK.said.jl || T - PK.said.jl > 12) { PK.said.jl = T; sayW('跑步的人', '……咦？', '#c8f040', 1.8); } }
// ---------- the skater ----------
function skateH(x) { const S = PK.skate, Rr = 80, E = 24 + Rr; let d = 0; if (x < S.x0 + E) d = S.x0 + E - x; else if (x > S.x1 - E) d = x - (S.x1 - E); else return 0; d = Math.min(d, Rr); return Rr - Math.sqrt(Math.max(0, Rr * Rr - d * d)); }
function updSkater(dt) {
  const K = PK.sk; if (!K) return; const H = K.H, S = PK.skate; K.t -= dt;
  let rideK = 0;
  if (K.mode === 'ride') {
    const h = skateH(K.x), v = Math.sqrt(Math.max(400, 300 * 300 - 2 * 250 * h * 1.15)); K.v = v; if (!NET.client) K.x += K.dir * v * dt;
    if (h > 64 && ((K.dir > 0 && K.x > 2540) || (K.dir < 0 && K.x < 2540))) { K.dir = -K.dir; K.turnT = .45; tone(160, 120, .05, .05, 'square'); }
    K.y = GY + skateH(K.x); rideK = 1;
    if (K.t <= 0 && skateH(K.x) < 1 && Math.abs(K.x - 2540) < 60) { K.mode = 'sit'; K.t = R(12, 16); K.v = 0; }
    // wheels: whoever is on the pad in his way gets bowled over
    if (!NET.client) for (const C of party) if (mine(C) && !C.frozen && C.pos.y < K.y + 14 && C.state !== 'dig' && Math.abs(C.pos.z - K.z) < 26 && Math.abs(C.pos.x - K.x) < 44) knock(C, V3(K.x - K.dir * 40, GY, K.z), C === leader ? '被滑板撞飛了！' : null);
  } else if (K.mode === 'sit' || K.mode === 'alert') {
    K.x = damp(K.x, 2540, 3, dt); K.y = GY; if (K.t <= 0) { K.mode = 'ride'; K.t = R(30, 50); K.dir = rnd() < .5 ? 1 : -1; }
  }
  K.turnT = Math.max(0, K.turnT - dt);
  // board and body
  const a = skateSlope(K.x), sitting = K.mode !== 'ride', side = K.x < 2540 ? 1 : -1;
  K.bd.rotation.order = 'YXZ';
  if (sitting) { K.bd.position.set(K.x + 56, GY, 2496); K.bd.rotation.set(0, Math.PI / 2 + .3, 0); }
  else { K.bd.position.set(K.x, K.y, K.z); K.bd.rotation.set(a * side, Math.PI / 2, 0); for (const w of K.wheels) w.rotation.x += K.v * dt / 2.8; }
  if (sitting) {   // on the ledge, feet on the ground, phone in his lap
    H.pos.set(K.x, GY + 2, 2460); H.yaw = 0; H.pelvis.position.y = 44; for (const L of H.legs) { L.hip.rotation.set(-1.45, 0, 0); L.knee.rotation.x = 1.45; L.ankle.rotation.x = 0; }
    H.aimT.set(K.x, GY + 10, 2500); if (K.mode === 'alert') H.aimT.copy(K.look);
    H.aim.lerp(H.aimT, 1 - Math.exp(-3 * dt)); H.root.position.copy(H.pos); H.root.rotation.set(0, 0, 0); humanAimArm(H, 0, dt);
    for (const A of H.arms) { A.sh.rotation.set(-.8, A.s * -.2, 0); A.el.rotation.x = -1.1; } H.chest.rotation.x = K.mode === 'alert' ? 0 : .35;
  } else {         // side-on, knees bent, arms out for balance; leaning into the ramp
    H.pos.set(K.x, K.y + 8, K.z); H.yaw = 0; H.pelvis.position.y = 78; H.root.position.copy(H.pos); H.root.rotation.set(0, 0, -a * side * .9);
    H.legs[0].hip.rotation.set(-.15, 0, -.32); H.legs[0].knee.rotation.x = .75; H.legs[1].hip.rotation.set(-.15, 0, .32); H.legs[1].knee.rotation.x = .75; for (const L of H.legs) L.ankle.rotation.x = -.2;
    H.arms[0].sh.rotation.set(0, 0, 1.0 + Math.sin(T * 2) * .1); H.arms[1].sh.rotation.set(0, 0, -1.0 + Math.sin(T * 2.3) * .1); for (const A of H.arms) A.el.rotation.x = -.3; H.chest.rotation.x = .12;
    H.aimT.set(K.x + K.dir * 200, GY + 30, K.z); H.aim.lerp(H.aimT, 1 - Math.exp(-5 * dt)); humanAimArm(H, 0, dt);
  }
  // rolling sound while near
  if (K.mode === 'ride' && leader && PK.near) { K.snd = (K.snd || 0) - dt; if (K.snd <= 0) { K.snd = .12; const d = Math.hypot(leader.pos.x - K.x, leader.pos.z - K.z); if (d < 700) nz(.12, 260, .6, .05 * (1 - d / 700)); } }
}
function skateSlope(x) { const S = PK.skate, Rr = 80, E = 24 + Rr; let d = 0; if (x < S.x0 + E) d = S.x0 + E - x; else if (x > S.x1 - E) d = x - (S.x1 - E); else return 0; d = Math.min(d, Rr - .1); return Math.asin(d / Rr); }
function skLook(p, t) { const K = PK.sk; if (!K || K.mode === 'ride') return; K.mode = 'alert'; K.t = t; K.look = V3(p.x, GY + 4, p.z); }
// ---------- the retriever thinks a frozen hero is a new toy: into the owners' toy bucket ----------
function pdogTake(J, D, dt) {
  const C = J.C; let sp = 0;
  const mouth = () => { const p = V3(); D.head.getWorldPosition(p); const k = D.root.scale.x; return p.add(V3(Math.sin(D.yaw) * 11 * k, -6 * k, Math.cos(D.yaw) * 11 * k)); };
  if (J.mode === 'go') { if (dogGo(D, C.pos, 70, dt) || Math.hypot(C.pos.x - D.pos.x, C.pos.z - D.pos.z) < 22) { J.mode = 'grab'; J.t = 0; J.from = C.pos.clone(); } else sp = 70; }
  else if (J.mode === 'grab') { J.t += dt; D.yaw = angDamp(D.yaw, Math.atan2(J.from.x - D.pos.x, J.from.z - D.pos.z), 6, dt); const k = clamp((J.t - .3) / .35, 0, 1); if (k > 0) { if (C.toyAt !== 'hand') { C.toyAt = 'hand'; refreshPartyHUD(); } C.pos.lerpVectors(J.from, mouth().add(V3(0, -C.h * .45, 0)), easeIO(k)); } if (J.t > .7) { J.mode = 'carry'; if (!PK.said.take || T - PK.said.take > 30) { PK.said.take = T; sayW(PK.owners[0].name, `${D.name}，你咬住什麼？……一個公仔？`, PK.owners[0].col, 2.8); } } }
  else if (J.mode === 'carry') { const tgt = V3(PK.bucket.x + 30, GY, PK.bucket.z + 26); if (dogGo(D, tgt, 60, dt)) { J.mode = 'drop'; J.t = 0; } else sp = 60; takeHold(C, mouth()); }
  else if (J.mode === 'drop') { J.t += dt; D.yaw = angDamp(D.yaw, Math.atan2(PK.bucket.x - D.pos.x, PK.bucket.z - D.pos.z), 5, dt); if (J.t < .8) takeHold(C, V3().lerpVectors(mouth(), PK.bucket, clamp(J.t / .8, 0, 1))); else { takeDrop(J, V3(PK.bucket.x + R(-8, 8), PK.bucket.y + 2, PK.bucket.z + R(-6, 6))); D.mode = 'sit'; D.t = 3; } }
  const m0 = D.mode; D.mode = sp > 8 ? 'walk' : 'sniff'; dogAnim(D, sp, dt); D.mode = m0; D.tail.rotation.y = Math.sin(T * 16) * .6; D.tongue.visible = false;
}

// =====================================================================
//  rules of the park
// =====================================================================
const PQ_SP = [
  { t: '穿過公園，去遊樂場', s: '晶片要在陽光底下才會充電，遊樂場的滑梯塔最開揚。狗、跑步的人都會看到你——長草可以躲，樹蔭下比較難被看見' },
  { t: '沙池裡面有東西在動', s: '去沙池看看' },
  { t: '爬上滑梯塔頂', s: '北面有梯，西面有攀網。塔頂沒有屋頂，陽光直接照下來' },
  { t: '守住晶片，等它充滿電', s: '雲遮住太陽時會停。不要被看見' },
  { t: '拿回晶片', s: '晶片充滿電了，在塔頂' },
  { t: '從公園後門出去', s: '後門在遊樂場南面' }
];
const MP_PARK_Q = [
  { t: '全隊到遊樂場', s: '晶片要在陽光底下充電。狗場的狗會吠，跑步的人會看到你——長草可以躲，樹蔭下比較難被看見' },
  { t: '爬上滑梯塔頂放下晶片', s: '北面有梯，西面有攀網。疊羅漢、跳跳跳上去都得' },
  { t: '守住晶片，等它充滿電', s: '雲遮住太陽時會停。全隊不要被看見——小狗豆腐走出了狗場' },
  { t: '拿回晶片', s: '晶片充滿電了，在塔頂' },
  { t: '全隊從公園後門出去', s: '後門在遊樂場南面，所有玩家都要出去' }
];
const MPQ_PARK = MP_QUESTS.length;   // MP quest index of the first park quest
MP_QUESTS.push(...MP_PARK_Q);
const inPlay = p => { const P = PK.play; return p.x > P.x0 && p.x < P.x1 && p.z > P.z0 && p.z < P.z1; };
const onDeck = C => Math.abs(C.pos.x - PK.tower.x) < 46 && Math.abs(C.pos.z - PK.tower.z) < 46 && C.pos.y > PK.plat - 3 && C.pos.y < PK.plat + 30;
const outBack = C => C.pos.z > 3734 && Math.abs(C.pos.x - 2060) < 300;

// out in the open (sun or moon) unless under a tree's crown or the tower's deck
function moonShade(p) { for (const s of PK.shade) { if (s.below != null && p.y > s.below) continue; if (Math.hypot(p.x - s.x, p.z - s.z) < s.r) return true; } return false; }
function parkLit(p) { const cover = PK.cloud; const dark = DAY ? (moonShade(p) ? .48 : .64 + .18 * (1 - cover)) : (moonShade(p) ? .28 : .3 + .3 * (1 - cover)); return litAtList(p, PK.lights, dark); }

function detectPark(dt) {
  if (STATE !== 'play') return; if (window.__NODET) { meter = 0; return; } if (TOY.grace > 0) { meter = Math.max(0, meter - dt * .5); return; }
  const L = leader; if (L.frozen || !mine(L)) { meter = Math.max(0, meter - dt * .5); KS.watch = null; return; }
  if (L.state === 'dig') { meter = Math.max(0, meter - dt * .4); KS.watch = null; return; }
  let seen = 0, who = null, wp = null; const hp = V3(), q = new THREE.Quaternion(), f = V3();
  const look = (head, fov, range, k, id) => { head.getWorldPosition(hp); head.getWorldQuaternion(q); f.set(0, 0, 1).applyQuaternion(q); const s = seeFrom(hp, f, fov, range) * k; if (s > seen) { seen = s; who = id; wp = hp.clone(); } };
  PK.owners.forEach((O, i) => { if (O.lookK > .5 && O.mode !== 'phone') look(O.H.head, O.mode === 'alert' ? .5 : .62, O.mode === 'alert' ? 460 : 360, 1, 'owner' + i); });
  PK.dogs.forEach((D, i) => { if (D.mode !== 'sit' || D.t < 1) look(D.head, .5, 300, 1.15, 'dog' + i); });
  const J = PK.jog; if (J) look(J.H.head, J.mode === 'alert' ? .5 : .74, J.mode === 'alert' ? 420 : 320, 1, 'jog');
  const K = PK.sk; if (K) look(K.H.head, K.mode === 'ride' ? .8 : .55, K.mode === 'ride' ? 200 : 300, K.mode === 'ride' ? .6 : 1, 'sk');
  KS.watch = seen > 0 ? { p: wp, s: seen, who } : null;
  if (seen > 0) {
    const p = V3(L.pos.x, L.pos.y + L.h * .5, L.pos.z); let lit = parkLit(p) * (inDark(L.pos) ? .6 : 1); if (inGrass(L.pos)) lit *= .3;
    const mv = L.spd > 1.5 ? 1 : .5, cr = L.crouch ? .55 : 1;
    meter += seen * lit * mv * cr * hideK(L) * dt; if (meter > .3) netSeen(V3(L.pos.x, L.pos.y + 2, L.pos.z), who);
  } else meter -= dt * .24;
  meter = clamp(meter, 0, 1); if (meter >= 1) toyFreeze(who);
}
// dogs smell small things nearby, wherever they hide (host / single player)
function parkSmell() {
  if (NET.client || STATE !== 'play') return;
  for (const D of PK.dogs) { if (!['roam', 'out', 'sit'].includes(D.mode)) continue;
    for (const C of party) { if (C.frozen || !C.root.visible || C.state === 'dig' || C.state === 'shell' || C.pos.y > GY + 30 || (!NET.on && C !== leader && C.queue)) continue;
      const d = Math.hypot(C.pos.x - D.pos.x, C.pos.z - D.pos.z); if (d < 50 * (D.root.scale.x > .8 ? 1 : .8)) { D.mode = 'sniff'; D.t = 4; D.look.set(C.pos.x, GY, C.pos.z); break; } } }
}
function parkHear(p, loud) {
  if (loud < .25) return;
  for (const D of PK.dogs) if (Math.hypot(p.x - D.pos.x, p.z - D.pos.z) < 380 && ['roam', 'sit', 'out'].includes(D.mode)) { D.mode = 'alert'; D.t = 2.5; D.look.set(p.x, GY, p.z); }
  if (Math.hypot(p.x - PK.bench.x, p.z - PK.bench.z) < 420 && loud > .35) ownerLook(p, 3);
  if (PK.jog && Math.hypot(p.x - PK.jog.H.pos.x, p.z - PK.jog.H.pos.z) < 300) jogLook(p, 2.2);
  if (PK.sk && Math.hypot(p.x - PK.sk.x, p.z - PK.sk.z) < 320) skLook(p, 2.5);
}
function parkSeen(tp, who) {
  if (!who) return;
  if (who.startsWith('owner')) ownerLook(tp, 3.5, PK.owners[+who.slice(5)]);
  else if (who.startsWith('dog')) dogBarkAt(PK.dogs[+who.slice(3)], tp, 2.5);
  else if (who === 'jog') jogLook(tp, 2.6); else if (who === 'sk') skLook(tp, 3);
}

// the slide: follow its curve and pick up speed
function slideTick(dt) {
  for (const C of party) {
    if ((NET.on && !mine(C)) || C.frozen || C.climbing) continue;
    const x = C.pos.x, z = C.pos.z; if (x < SLIDE.x0 + 2 || x > SLIDE.x1 + 4 || z < SLIDE.z0 + 1 || z > SLIDE.z1 - 1) { C.sliding = false; continue; }
    const h = slideH(x); if (C.pos.y < h - 4 || C.pos.y > h + 3.5 || C.vel.y > 30) { C.sliding = false; continue; }
    C.pos.y = h; if (C.vel.y < 0) C.vel.y = 0; C.grounded = true; C.tumble = 0;
    // pick up speed downhill (strong enough to beat the walking brakes), keep to the middle of the tub
    const sl = (slideH(x - 2) - slideH(x + 2)) / 4; C.vel.x = Math.min(260, Math.max(C.vel.x, 0) + (150 + sl * 700) * dt); C.vel.z = C.vel.z * Math.exp(-4 * dt) + ((SLIDE.z0 + SLIDE.z1) / 2 - z) * 2 * dt;
    if (C.state === 'air' || C.state === 'walk' || C.state === 'run') C.state = 'crouch';
    if (x > SLIDE.x1 - 30) C.vel.x = Math.min(C.vel.x, 130);   // the run-out at the bottom
    if (!C.sliding && C.vel.x > 30) { C.sliding = true; if (C === leader) { tone(500, 900, .5, .05, 'sine'); if (!PK.said.slide) { PK.said.slide = 1; toast('嘩——滑梯！', 2); } } }
  }
}
// the cloud that drifts across the sun (host decides when; everyone draws it)
function cloudTick(dt) {
  if (!NET.client) { if (PK.cloudOn) { PK.cloudP += dt / 16; if (PK.cloudP >= 1) { PK.cloudOn = false; PK.cloudT = R(26, 40); } } else if ((PK.cloudT -= dt) <= 0) { PK.cloudOn = true; PK.cloudP = 0; } }
  const pp = PK.cloudOn ? PK.cloudP : 1; PK.cloud = PK.cloudOn ? clamp(1.25 - Math.abs(pp - .5) * 3.2, 0, 1) : 0;
  if (PK.cloudMesh) { const off = (pp - .5) * 1100; PK.cloudMesh.visible = PK.cloudOn; const sd = V3(-PK.cloudC.z + 800, 0, PK.cloudC.x - 2100).normalize(); PK.cloudMesh.position.set(PK.cloudC.x + sd.x * off, PK.cloudC.y + off * .06, PK.cloudC.z + sd.z * off); PK.cloudM.opacity = clamp(1 - Math.abs(pp - .5) * 2, 0, 1) * .95; }
  if (PK.moonL) PK.moonL.intensity = PK.moonI * (1 - .8 * PK.cloud);
}
// the chip charging on the tower deck
function chipTick(dt) {
  const G = PK.chipG; if (!G) return;
  G.visible = PK.chipOn && !PK.chipGot; if (G.visible) { const k = PK.chip; PK.chipGlow.material.opacity = .25 + .45 * k * (1 - PK.cloud * .8) + Math.sin(T * 5) * .05; PK.chipGlow.scale.setScalar(1 + k * .6 + Math.sin(T * 3) * .05); G.rotation.y += dt * .2; }
  if (NET.client || STATE !== 'play') return;
  if (PK.chipOn && !PK.charged) {
    const was = PK.chip; if (PK.cloud < .45) PK.chip = Math.min(1, PK.chip + dt / 45);
    if (PK.cloud >= .45 && !PK.said.cloud) { PK.said.cloud = 1; toastW('雲遮住了太陽——晶片暫停充電', 2.6); }
    if (was < .5 && PK.chip >= .5) toastW('晶片充了一半……', 2);
    if (PK.chip >= 1) { PK.charged = true; tone(660, 990, .4, .08, 'triangle'); tone(990, 1320, .5, .06, 'triangle', .2); toastW('晶片充滿電了！', 2.8); }
  }
}
function chipPlace(C) {
  if (PK.chipOn) return; PK.chipOn = true; PK.chip = 0; PK.cloudT = Math.min(PK.cloudT, 14);
  tone(880, 880, .08, .06, 'square'); toastW(`${C ? C.S.name : '你'}把晶片放在陽光底下……開始充電`, 3);
  if (!NET.on) say('爸爸', '陽光……好像真的有反應。等它充滿——不要被人看見。', '#f5f0e6', 3.4);
  // the little terrier slips out of the dog run and comes sniffing round the playground
  const D = PK.dogs[1]; if (D) setTimeout(() => { if (STATE !== 'play' || !PK.chipOn || PK.charged) return; D.mode = 'out'; D.leg = 0; D.t = 0; D.target = null; sayW(PK.owners[0].name, '豆腐？豆腐！又走出去……', PK.owners[0].col, 2.8); }, 6000);
}
function chipTake(C) {
  if (PK.chipGot || !PK.charged) return; PK.chipGot = true; tone(990, 1480, .3, .07, 'triangle'); toastW(`${C ? C.S.name : '你'}拿回了晶片！`, 2.6);
  const D = PK.dogs[1]; if (D && D.mode === 'out') { D.mode = 'home'; }
}

function updParkWorld(dt) {
  PK.near = !!(ZONES.park && ZONES.park.near);
  if (ST.sky && ST.sky.visible) ST.sky.position.set(camera.position.x - 2100, 0, camera.position.z - 800);   // the sky dome (sun, clouds) stays round the camera
  if (!PK.near && !NET.on) return;
  cloudTick(dt); chipTick(dt); slideTick(dt);
  if (PK.swings) for (const S of PK.swings) S.piv.rotation.z = Math.sin(T * 1.3 + S.ph) * S.amp;
  if (PK.flag) { const p = PK.flag.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) + 18; p.setZ(i, Math.sin(T * 4 + x * .25) * x * .06); } p.needsUpdate = true; }
  if (PK.duck) PK.duck.rotation.z = Math.sin(T * .9) * .03;
  if (!NET.client && STATE === 'play') {
    // place / take the chip: anyone standing on the deck (quests decide when it counts)
    const q = quest, mp = NET.on;
    for (const C of party) { if (C.frozen || (!mp && C !== leader)) continue; if (!onDeck(C)) continue;
      if (!PK.chipOn && ((!mp && q === 2) || (mp && q === MPQ_PARK + 1))) chipPlace(C);
      if (PK.charged && !PK.chipGot && C.pos.distanceTo(PK.chipP) < 14) chipTake(C); }
  }
}
function parkNPC(dt) {
  if (NET.client) return;
  updOwners(dt); updParkDogs(dt); updBall(dt); updJogger(dt); updSkater(dt); parkSmell();
}

LEVELS.park = {
  chapter: '第六章', title: '公園', mpChapter: '第五章（多人）', env: 'park', envI: DAY ? 1 : .5, fog: DAY ? [0xbcd0e2, .00014] : [0x0c1420, .00032], expo: DAY ? .95 : 1.35,
  dust: { N: 700, box: [1700, 2500, GY, 300, 2700, 3300], beamFrac: .0, door: false },
  toys: true, npcNear: true, build: buildPark,
  cps: [[2060, GY, 1760], [1880, GY, 2300], [2060, GY, 2760], [2120, GY + 121, 2990], [2060, GY, 3560]],
  quests: PQ_SP,
  spawn() { if (!NET.on) { crewJoin('bat', true); crewJoin('tort', true); } spawnSP(this.cps[0], Math.PI, 5); if (!GS.latch) GS.latch = true; if (!LIV.ventOpen) { LIV.ventOpen = true; LIV.ventCol.y0 = -999; LIV.ventCol.y1 = -998; } YS.chip = true; if (YS.chipM) { YS.chipM.visible = false; YS.chipHalo.visible = false; } ST.won = true; parkPrep(); },
  enter(prev, again) { if (!again && !NET.on && prev === 'road' && STATE === 'play') unlockKey('ch5'); if (again || NET.on) return; setTimeout(() => say('爸爸', '這裡就是楓林公園……晶片要在陽光底下才會充電。找個最高、最開揚的地方。', '#f5f0e6', 4), 1400); },
  npc(dt) { if (STATE === 'play' || STATE === 'fail' || STATE === 'frozen' || STATE === 'end') parkNPC(dt); },
  detect: detectPark, hear: parkHear, seen: parkSeen,
  update(dt) {
    lvT += dt; if (NET.on) return; const L = leader;
    if (quest === 0 && inPlay(L.pos)) setQuest(1);
    if (quest === 1) { const S = PK.sand; if (Math.hypot(L.pos.x - (S.x0 + S.x1) / 2, L.pos.z - (S.z0 + S.z1) / 2) < 140) { if (typeof moleMeet === 'function' && !PK.moleMet) { PK.moleMet = true; moleMeet(); } else if (PK.moleMet === undefined || typeof moleMeet !== 'function') setQuest(2); } }
    if (quest === 2 && PK.chipOn) setQuest(3);
    if (quest === 3 && PK.charged) setQuest(4);
    if (quest === 4 && PK.chipGot) setQuest(5);
    if (quest === 5 && outBack(L)) parkWin();
  },
  win() { },
  marker() { if (NET.on) return mpMarker(); const L = leader;
    if (quest === 0) return V3(2060, GY + 4, 2830); if (quest === 1) return V3((PK.sand.x0 + PK.sand.x1) / 2, GY + 14, (PK.sand.z0 + PK.sand.z1) / 2);
    if (quest === 2) return onDeck(L) ? null : V3(PK.tower.x, PK.plat + 4, PK.tower.z); if (quest === 3) return null; if (quest === 4) return PK.chipP.clone().add(V3(0, 4, 0)); return V3(2060, GY + 4, 3740); },
  reset() { parkPrep(true); },
  eyeText: () => meter > .3 ? '被看見了！' : PK.cloud > .45 ? '雲遮住了太陽' : '狗主、跑步的人、滑板少年',
  hint(L) {
    if (PK.chipOn && !PK.charged) return PK.cloud >= .45 ? `晶片 ${Math.floor(PK.chip * 100)}%——雲遮住了太陽，等一等` : `晶片充電中 ${Math.floor(PK.chip * 100)}%`;
    if (L.sliding) return '';
    if (inGrass(L.pos)) return '長草裡面——很難被看見';
    if (moonShade(L.pos) && L.pos.y < GY + 30) return '樹蔭底下——比較難被看見';
    return '';
  },
  onSwitch() { }
};
// put the park back as it starts (after a respawn the dogs, ball and chip keep their story state)
function parkPrep(soft) {
  const B = PK.ball; if (B && !soft) { B.held = -1; B.air = false; B.rest = true; B.p.set(1600, GY + 3.3, 2480); PK.throwT = 3; PK.thrower = 0; }
  for (const D of PK.dogs) { if (D.mode === 'out' && soft) continue; D.mode = 'roam'; D.t = R(1, 3); D.target = null; }
  for (const O of PK.owners) { O.mode = 'chat'; O.t = R(3, 6); }
  if (PK.jog) { PK.jog.mode = 'run'; } if (PK.sk) { PK.sk.mode = 'ride'; PK.sk.t = R(20, 40); }
}
function parkWin() {
  if (STATE !== 'play') return; unlockKey('ch6');
  say('爸爸', '晶片充滿了……我們走。', '#f5f0e6', 3);
  END_TXT = ['第六章 · 完', '公園', '晶片在陽光底下充滿了電。公園後門對面，就是楓林小學。（第七章：學校，製作中）'];
  STATE = 'end'; endT = 0;
}
// online: the park part of the shared objective list
function mpParkObjectives(P) {
  if (quest === MPQ_PARK && P.every(C => inPlay(C.pos) || onDeck(C))) { setQuest(MPQ_PARK + 1); toastW('全隊到了遊樂場！', 2.4); }
  if (quest === MPQ_PARK + 1 && PK.chipOn) setQuest(MPQ_PARK + 2);
  if (quest === MPQ_PARK + 2 && PK.charged) setQuest(MPQ_PARK + 3);
  if (quest === MPQ_PARK + 3 && PK.chipGot) setQuest(MPQ_PARK + 4);
  if (quest === MPQ_PARK + 4 && P.every(outBack) && STATE === 'play') { STATE = 'end'; endT = 0; END_TXT = ['第五章（多人）· 完', '公園', '晶片在陽光底下充滿了電。公園後門對面，就是楓林小學。（下一章：學校，製作中）']; nsend({ t: 'end', e: END_TXT }); }
}
function mpParkMarker() {
  const L = leader, q = quest - MPQ_PARK;
  if (q === 0) return inPlay(L.pos) ? null : V3(2060, GY + 4, 2830); if (q === 1) return onDeck(L) ? null : V3(PK.tower.x, PK.plat + 4, PK.tower.z);
  if (q === 2) return null; if (q === 3) return PK.chipP.clone().add(V3(0, 4, 0)); return outBack(L) ? null : V3(2060, GY + 4, 3740);
}
// ---------- online: what the host tells everyone about the park ----------
const PK_DM = ['roam', 'chase', 'return', 'give', 'sit', 'sniff', 'bark', 'alert', 'out', 'home'], PK_OM = ['chat', 'watch', 'phone', 'alert', 'throw'];
function parkNetOut(w) {
  if (!PK.ball) return; const B = PK.ball, J = PK.jog, K = PK.sk;
  w.pk = [PK.chipOn ? 1 : 0, Math.round(PK.chip * 1000), PK.charged ? 1 : 0, PK.chipGot ? 1 : 0, PK.cloudOn ? 1 : 0, +(PK.cloudP || 0).toFixed(3),
    ...PK.owners.flatMap(O => [PK_OM.indexOf(O.mode), Math.round(O.look.x), Math.round(O.look.y), Math.round(O.look.z)]),
    ...PK.dogs.flatMap(D => [+D.pos.x.toFixed(1), +D.pos.z.toFixed(1), +D.yaw.toFixed(2), Math.max(0, PK_DM.indexOf(D.mode)), Math.round(D.sp || 0), Math.round(D.look.x), Math.round(D.look.z)]),
    +B.p.x.toFixed(1), +B.p.y.toFixed(1), +B.p.z.toFixed(1), B.held,
    +J.a.toFixed(4), J.mode === 'run' ? 0 : J.mode === 'stretch' ? 1 : 2, Math.round((J.look || J.H.aimT).x), Math.round((J.look || J.H.aimT).z),
    +K.x.toFixed(1), K.dir, K.mode === 'ride' ? 0 : K.mode === 'sit' ? 1 : 2, Math.round(K.v || 0)];
}
function parkNetIn(w) {
  const k = w.pk; if (!k || !PK.ball) return;
  const wasOn = PK.chipOn; PK.chipOn = !!k[0]; PK.chip = k[1] / 1000; PK.charged = !!k[2]; PK.chipGot = !!k[3]; PK.cloudOn = !!k[4]; PK.cloudP = k[5];
  if (PK.chipOn && !wasOn) tone(880, 880, .08, .06, 'square');
  PK.net = k;
}
function parkNetNPC(dt) {
  const k = PK.net; if (!k || !PK.ball) return; let i = 6; const e = 1 - Math.exp(-8 * dt);
  for (const O of PK.owners) { O.mode = PK_OM[k[i]] || 'chat'; O.look.set(k[i + 1], k[i + 2], k[i + 3]); i += 4; }
  updOwners(dt);
  for (const D of PK.dogs) { const ox = D.pos.x, oz = D.pos.z; if (Math.hypot(k[i] - ox, k[i + 1] - oz) > 120) { D.pos.x = k[i]; D.pos.z = k[i + 1]; } else { D.pos.x += (k[i] - ox) * e; D.pos.z += (k[i + 1] - oz) * e; } D.yaw = angDamp(D.yaw, k[i + 2], 8, dt); D.mode = PK_DM[k[i + 3]]; const sp = k[i + 4]; D.look.set(k[i + 5], GY, k[i + 6]); i += 7;
    const m0 = D.mode; if (['roam', 'out', 'home', 'chase', 'return'].includes(m0)) D.mode = sp < 8 ? 'sniff' : 'walk'; dogAnim(D, sp, dt); D.mode = m0;
    if (D.mode === 'sit') { D.body.position.y = lerp(D.body.position.y, 34, .3); D.legs[2].g.rotation.x = 1.1; D.legs[3].g.rotation.x = 1.1; D.body.rotation.x = -.3; } else D.body.rotation.x = 0;
    if (D.mode === 'bark' && (D.barkT = (D.barkT || 0) - dt) <= 0) { D.barkT = D.root.scale.x > .8 ? .7 : .35; parkDogBark(D); } }
  const B = PK.ball; B.held = k[i + 3]; if (B.held >= 0) updBall(0); else B.p.lerp(V3(k[i], k[i + 1], k[i + 2]), e); i += 4;
  const J = PK.jog; let da = k[i] - J.a; if (Math.abs(da) > 1) J.a = k[i]; else J.a += da * e; J.mode = ['run', 'stretch', 'alert'][k[i + 1]]; J.look = V3(k[i + 2], GY + 4, k[i + 3]); J.t = 99; i += 4;
  updJogger(dt);
  const K = PK.sk; K.x += (k[i] - K.x) * e; K.dir = k[i + 1]; K.mode = ['ride', 'sit', 'alert'][k[i + 2]]; K.v = k[i + 3]; K.t = 99; K.y = GY + skateH(K.x); i += 4;
  updSkater(dt);
}

// ---------- fewer draw calls: bake the park's static meshes into one mesh per material ----------
// (phones choke on hundreds of small meshes; nothing here moves, and nothing looks them up again)
function mergeZoneStatic(root, keep) {
  root.updateMatrixWorld(true); const B = new Map(), dead = [];
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || !o.visible || o.renderOrder) return;
    for (let p = o; p && p !== root; p = p.parent) if (keep.has(p)) return;
    const m = o.material; if (!m || Array.isArray(m) || m.transparent) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(o.matrixWorld);
    if (o.matrixWorld.determinant() < 0) for (const a of Object.values(g.attributes)) { const n = a.itemSize, A = a.array; for (let i = 0; i < a.count; i += 3) for (let c = 0; c < n; c++) { const t = A[(i + 1) * n + c]; A[(i + 1) * n + c] = A[(i + 2) * n + c]; A[(i + 2) * n + c] = t; } }
    const key = m.uuid + (o.castShadow ? 'c' : 'n'); if (!B.has(key)) B.set(key, { m, cast: o.castShadow, gs: [] }); B.get(key).gs.push(g); dead.push(o);
  });
  for (const o of dead) o.parent.remove(o);
  let n = 0; for (const { m, cast, gs } of B.values()) { const mg = mergeGeometries(gs); gs.forEach(g => g.dispose()); if (!mg) continue; const me = new THREE.Mesh(mg, m); me.castShadow = cast; me.receiveShadow = true; root.add(me); n++; }
  return [dead.length, n];
}
