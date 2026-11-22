
// =====================================================================
//  第四章 · 後園與鄰居家 — out through the garage's dog flap into the night
//  Our back yard (tall grass to hide in, a sprinkler sweeping the lawn, a big tree) → a broken board
//  in the fence → the neighbour's yard (his dog on a chain by its kennel) → the deck → the cat flap
//  into his glass sunroom, where 陳伯 reads the paper and looks up every so often.
//  The control chip is on his writing desk.
// =====================================================================
const YS = { dog: null, old: null, chip: false, lights: [], said: {}, spr: null, clumps: [], gap: V3(2103, GY, 109), flap: V3(2558, -8, 68), chipP: V3(2716, 58, 160) };
const DECK = -8;
function genGrass() {
  const W = 512, n = noiseField(W, W, 5, 6, 501), n2 = noiseField(W, W, 2, 64, 502); const h = new Float32Array(W * W);
  const c = fromFn(W, W, (x, y, i, o) => { const b = hashI(i * 3 + 1); const blade = b > .55 ? (b - .55) * .5 : 0; const v = .55 + (n[i] - .5) * .3 + blade; const dry = sstep(.6, .8, n[i]) * .25; o[0] = (38 + dry * 120) * v * 1.4; o[1] = (78 + dry * 40) * v * 1.4; o[2] = 30 * v; h[i] = n2[i] * .5 + blade; });
  return { map: tex(c), normalMap: normalTex(h, W, W, 2.2) };
}
function genSoil() { const W = 256, n = noiseField(W, W, 4, 8, 511); const c = fromFn(W, W, (x, y, i, o) => { const v = .6 + (n[i] - .5) * .4 + (hashI(i) > .97 ? .2 : 0); o[0] = 88 * v; o[1] = 62 * v; o[2] = 44 * v; }); return tex(c); }
// night sky: gradient dome, stars, the moon
function buildSky(cx, cz) {
  const g = new THREE.SphereGeometry(1900, 48, 24);
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: {},
    vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vP; void main(){ float y=vP.y; vec3 top=vec3(.012,.02,.05), mid=vec3(.05,.07,.15), hor=vec3(.28,.17,.16); vec3 c=mix(hor,mid,smoothstep(-.02,.22,y)); c=mix(c,top,smoothstep(.2,.8,y)); c+=vec3(.5,.3,.18)*pow(max(0.,1.-abs(y)*6.),3.)*.35; gl_FragColor=vec4(c,1.); }` });
  const sky = new THREE.Mesh(g, m); sky.position.set(cx, 0, cz); sky.frustumCulled = false; sky.renderOrder = -10; LV.add(sky);
  const N = 900, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const u = rnd() * 2 - 1, a = rnd() * 6.283; const y = Math.abs(u) * .9 + .08; const r = Math.sqrt(1 - y * y); pos.set([cx + Math.cos(a) * r * 1800, y * 1800, cz + Math.sin(a) * r * 1800], i * 3); const k = R(.4, 1.6); col.set([k, k, k * 1.1], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.5, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false, transparent: true, opacity: .75 })); stars.frustumCulled = false; LV.add(stars);
  const moon = mesh(new THREE.CircleGeometry(60, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf6ecd0).multiplyScalar(1.8), fog: false }), cx + 700, 1150, cz - 1250, { cast: false }); moon.lookAt(cx, 0, cz);
  const halo = mesh(new THREE.CircleGeometry(200, 40), new THREE.MeshBasicMaterial({ color: 0x8aa0c8, transparent: true, opacity: .12, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }), cx + 690, 1145, cz - 1240, { cast: false }); halo.lookAt(cx, 0, cz);
}
// clumps of tall grass — taller than the characters, the best hiding place outdoors
function buildGrassClumps(list) {
  const blade = new THREE.PlaneGeometry(1.6, 1, 1, 4); blade.translate(0, .5, 0); const p = blade.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) * (1 - y * .9)); p.setZ(i, y * y * .35); }
  blade.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0x4f7a34, roughness: .8, side: THREE.DoubleSide });
  let n = 0; for (const c of list) n += c[3]; const IM = new THREE.InstancedMesh(blade, mat, n); IM.castShadow = true; IM.receiveShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = V3(), t = V3(), col = new THREE.Color(); let k = 0;
  for (const [x, z, r, cnt] of list) { YS.clumps.push({ x, z, r }); for (let i = 0; i < cnt; i++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * r; t.set(x + Math.cos(a) * d, GY, z + Math.sin(a) * d); e.set(R(-.2, .2), rnd() * 6.283, R(-.25, .25)); q.setFromEuler(e); const hgt = R(14, 30); s.set(R(.8, 1.4), hgt, 1); m4.compose(t, q, s); IM.setMatrixAt(k, m4); col.setHSL(R(.22, .3), R(.35, .55), R(.22, .38)); IM.setColorAt(k, col); k++; } }
  LV.add(IM); return IM;
}
function inGrass(p) { if (p.y > GY + 16) return false; for (const c of YS.clumps) if (Math.hypot(p.x - c.x, p.z - c.z) < c.r) return true; return false; }

function buildYard() {
  const K = kitchenMats(), M = MAT; buildNightSky();
  const gr = genGrass(); const grassM = new THREE.MeshStandardMaterial({ ...gr, roughness: .95, normalScale: new THREE.Vector2(.8, .8) });
  const soilM = new THREE.MeshStandardMaterial({ map: genSoil(), roughness: 1 });
  const fenceM = new THREE.MeshStandardMaterial({ ...genWood([150, 112, 76], [86, 60, 40], 521, 10), roughness: .9 });
  const sidingN = new THREE.MeshStandardMaterial({ ...genSiding(0xc8c2b0, 531), roughness: .85 });
  const sidingU = new THREE.MeshStandardMaterial({ ...genSiding(0xb7c4c8, 532), roughness: .85 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x8a8680, roughness: .9 });
  const X0 = 1460, X1 = 2760, Z0 = -440, Z1 = 640;
  // ground + boundaries
  box(X0 - 4, X1, GY - 10, GY, Z0, Z1, grassM, { uv: 90, cast: false });
  box(X0, X1, GY, GY + 170, Z0 - 6, Z0, fenceM, { uv: 60 }); box(X0, 2588, GY, GY + 170, Z1, Z1 + 6, fenceM, { uv: 60 }); box(2652, X1, GY, GY + 170, Z1, Z1 + 6, fenceM, { uv: 60 });
  // 陳伯's front gate: a picket gate hung a hand's width off the path — room to squeeze under
  box(2588, 2594, GY, GY + 180, Z1 - 2, Z1 + 8, fenceM); box(2646, 2652, GY, GY + 180, Z1 - 2, Z1 + 8, fenceM);
  box(2594, 2646, GY + 11, GY + 150, Z1 + 1, Z1 + 5, fenceM, { uv: 40 }); for (let x = 2598; x < 2644; x += 9) box(x, x + 5, GY + 150, GY + 160, Z1 + 1.5, Z1 + 4.5, fenceM, { col: false });
  box(2594, 2646, GY, GY + .6, Z1 - 30, Z1 + 30, new THREE.MeshStandardMaterial({ color: 0x8a8278, roughness: .95 }), { col: false, cast: false });
  for (let x = X0; x < X1; x += 120) { box(x, x + 6, GY, GY + 176, Z0 - 8, Z0 - 2, fenceM, { col: false }); box(x, x + 6, GY, GY + 176, Z1 + 2, Z1 + 8, fenceM, { col: false }); }
  // our house's outside wall (the garage) and the fence beyond it
  box(X0 - 8, X0, GY, 270, -260, 56, sidingU, { uv: 120 }); box(X0 - 8, X0, GY, 270, 154, 310, sidingU, { uv: 120 }); box(X0 - 8, X0, 190, 270, 56, 154, sidingU, { uv: 120 }); box(X0 - 8, X0, GY, GY + 170, Z0, -260, fenceM, { uv: 60 }); box(X0 - 8, X0, GY, GY + 170, 310, Z1, fenceM, { uv: 60 });
  // outside of the side door (the door itself is part of the garage); lamp above it
  box(X0, X0 + 3, 186, 194, 56, 154, M.white, { col: false });
  mesh(new THREE.BoxGeometry(6, 12, 8), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: .5 }), X0 + 4, 210, 105); mesh(new THREE.SphereGeometry(3.4, 14, 10), K.bulb, X0 + 5, 204, 105, { cast: false });
  YS.doorL = pointL(0xffc890, 6000, X0 + 12, 200, 105);
  // the property-line fence with a broken board at the bottom
  box(2100, 2106, GY, GY + 160, Z0, 100, fenceM, { uv: 60 }); box(2100, 2106, GY, GY + 160, 118, Z1, fenceM, { uv: 60 }); box(2100, 2106, GY + 20, GY + 160, 100, 118, fenceM, { uv: 60 });
  const brk = mesh(new THREE.BoxGeometry(5, 22, 18), fenceM, 2096, GY + 4, 109); brk.rotation.set(0, .3, 1.2);
  // the neighbour's house wall (with the sunroom built against it)
  box(2752, X1 + 8, GY, 300, Z0, Z1, sidingN, { uv: 120 });
  for (const z of [-300, 400]) { box(2750, 2752, 90, 200, z - 50, z + 50, new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: .1, metalness: .3 }), { col: false }); box(2749, 2752, 86, 90, z - 54, z + 54, M.white, { col: false }); }
  // --- our yard: stepping stones, flower bed, gnome, tree, hose, sprinkler, toys ---
  const path = [[1490, 105], [1540, 112], [1590, 100], [1640, 118], [1700, 108], [1760, 96], [1830, 110], [1900, 122], [1960, 112], [2030, 104], [2080, 110]];
  // flagstones: irregular, bevelled, flush with the lawn (low enough to just walk over)
  { const tm = MAT.floor.map.clone(), tn = MAT.floor.normalMap && MAT.floor.normalMap.clone(); for (const t of [tm, tn]) if (t) { t.repeat.set(1 / 34, 1 / 34); t.needsUpdate = true; }
    const flagM = new THREE.MeshStandardMaterial({ map: tm, normalMap: tn || null, color: 0xc4beb2, roughness: .92 });
    for (const [x, z] of path) { const r = R(13, 17), sh = new THREE.Shape(), N = 11, a0 = R(0, 6.28);
      for (let i = 0; i < N; i++) { const a = a0 + i / N * Math.PI * 2, rr = r * R(.84, 1.06); i ? sh.lineTo(Math.cos(a) * rr * 1.1, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr * 1.1, Math.sin(a) * rr); }
      const g = new THREE.ExtrudeGeometry(sh, { depth: .3, bevelEnabled: true, bevelThickness: .25, bevelSize: .9, bevelSegments: 2, curveSegments: 1 }); g.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(g, flagM); m.position.set(x, GY + .25, z); m.rotation.y = R(0, 6.28); m.receiveShadow = true; LV.add(m);
      cols.push({ t: 'c', x, z, r: r * .95, y0: GY, y1: GY + .8, small: true }); } }
  box(1560, 2060, GY, GY + 5, Z0, Z0 + 60, soilM, { uv: 40 });
  const stemM = new THREE.MeshStandardMaterial({ color: 0x3f6a2a, roughness: .7 }); const pet = [0xe85a6a, 0xf2c23a, 0xd8d0ff, 0xff8a3a];
  for (let i = 0; i < 26; i++) { const x = 1575 + i * 18 + R(-5, 5), z = Z0 + 14 + R(0, 36), h = R(35, 70); cyl(x, z, .8, GY + 5, GY + h, stemM, { col: false, seg: 6 }); const fl = mesh(new THREE.SphereGeometry(R(3.5, 6), 12, 8), new THREE.MeshStandardMaterial({ color: pet[i % 4], roughness: .6 }), x, GY + h + 2, z); fl.scale.y = .55; }
  // garden gnome
  const gM = new THREE.MeshStandardMaterial({ color: 0x3a6ea8, roughness: .6 }); cyl(1950, -250, 12, GY, GY + 26, gM, { seg: 20, rt: 9 });
  mesh(new THREE.SphereGeometry(7, 20, 14), MAT.skin, 1950, GY + 33, -250); mesh(new THREE.ConeGeometry(7, 16, 20), new THREE.MeshStandardMaterial({ color: 0xc8302a, roughness: .5 }), 1950, GY + 45, -250); mesh(new THREE.ConeGeometry(6, 10, 16), new THREE.MeshStandardMaterial({ color: 0xf2f0e8, roughness: .9 }), 1950, GY + 26, -244).rotation.x = Math.PI;
  cols.push({ t: 'c', x: 1950, z: -250, r: 8, y0: GY + 26, y1: GY + 52 });
  // the big tree: climb the trunk, walk out along the low branch
  const bark = new THREE.MeshStandardMaterial({ ...genWood([96, 76, 60], [52, 40, 32], 541), roughness: 1 });
  cyl(1800, 360, 24, GY, 330, bark, { seg: 24, rt: 18 }); box(1818, 1920, 118, 128, 352, 368, bark); box(1910, 1960, 124, 132, 356, 364, bark, { col: false });
  const leafM = furMat({ color: 0x2f5a2a, len: 5, den: .35, droop: -.1, clump: .8, rimK: .12, root: .4 });
  for (const [x, y, z, r] of [[1800, 360, 360, 120], [1890, 320, 330, 90], [1730, 330, 420, 90], [1830, 420, 400, 80]]) { const f = furMesh(new THREE.SphereGeometry(r, 28, 18), leafM); f.position.set(x, y, z); LV.add(f); }
  // hose from the house to the sprinkler
  tubeM([[X0 + 2, GY + 40, -120], [X0 + 10, GY + 2, -110], [1560, GY + 1.5, -60], [1700, GY + 1.5, -20], [1820, GY + 1.5, 0]], 1.4, new THREE.MeshStandardMaterial({ color: 0x2f8a3a, roughness: .5 }), 80);
  const sp = new THREE.Group(); sp.position.set(1820, GY, 0); LV.add(sp); mesh(new THREE.CylinderGeometry(5, 7, 4, 16), M.dsteel, 0, 2, 0, { parent: sp }); const arm = mesh(new THREE.BoxGeometry(2, 2, 12), M.paintRed, 0, 5, 0, { parent: sp });
  YS.spr = { g: sp, arm, a: 0, p: V3(1820, GY, 0), R: 130 }; cols.push({ t: 'c', x: 1820, z: 0, r: 6, y0: GY, y1: GY + 6 });
  // toys and things to resize
  const ballM = new THREE.MeshPhysicalMaterial({ color: 0xe84a6a, roughness: .35, clearcoat: .6 });
  resGroup(cmGroup(24, 24, 24, ({ part }) => { part(new THREE.SphereGeometry(12, 32, 20), ballM, 0, 0, 0); part(new THREE.TorusGeometry(12.05, .8, 6, 40), new THREE.MeshStandardMaterial({ color: 0xf2f0e8 }), 0, 0, 0); }, [ballM]), 1650, 250, GY, 24, 24, 24, .3, 4, '皮球', true);
  const canM = new THREE.MeshStandardMaterial({ color: 0x5aa8c8, roughness: .4, metalness: .4 });
  resGroup(cmGroup(30, 26, 18, ({ part }) => { part(new THREE.CylinderGeometry(9, 9, 22, 24), canM, 0, -2, 0); part(new THREE.CylinderGeometry(1.4, 2.4, 22, 10), canM, 12, 2, 0, { r: [0, 0, -.9] }); part(new THREE.TorusGeometry(7, 1.2, 6, 20, Math.PI), canM, -2, 10, 0); }, [canM]), 1700, -300, GY, 30, 26, 18, .3, 4, '花灑', true);
  const potM = new THREE.MeshStandardMaterial({ color: 0xb8643a, roughness: .9 });
  // tall grass clumps (hiding) — kept off the stone path
  const clumps = []; for (let i = 0; i < 46; i++) { const x = R(1490, 2690), z = R(Z0 + 70, Z1 - 30); if (Math.abs(z - 110) < 34 && x < 2100) continue; if (x > 2380 && x < 2560 && z > -80 && z < 240) continue; if (Math.hypot(x - 2300, z - 420) < 70) continue; if (Math.hypot(x - 1820, z) < 40) continue; clumps.push([x, z, R(10, 18), 18]); }
  clumps.push([2080, 70, 16, 22], [2130, 150, 16, 22], [2250, 60, 14, 20], [2380, 260, 16, 20], [1560, 40, 14, 20]);
  buildGrassClumps(clumps);
  // --- the neighbour's yard ---
  // kennel
  const kenM = new THREE.MeshStandardMaterial({ ...genWood([170, 70, 50], [110, 40, 30], 551, 6), roughness: .8 });
  box(2250, 2350, GY, GY + 70, 440, 444, kenM); box(2250, 2254, GY, GY + 70, 380, 444, kenM); box(2346, 2350, GY, GY + 70, 380, 444, kenM);
  box(2250, 2280, GY, GY + 70, 376, 380, kenM); box(2320, 2350, GY, GY + 70, 376, 380, kenM); box(2280, 2320, GY + 50, GY + 70, 376, 380, kenM);
  box(2250, 2350, GY, GY + 2, 380, 440, kenM, { col: false });
  // a gentler roof the little ones can walk up (stepped underneath, and each step is one you scramble straight onto)
  const roofM = new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: .8 }), PT = Math.tan(.3);
  for (const s of [-1, 1]) { const r = mesh(new THREE.BoxGeometry(56, 4, 76), roofM, 2300 + s * 25, GY + 70 + 25 * PT, 410); r.rotation.z = s * -.3; }
  { const sh = new THREE.Shape(); sh.moveTo(-50, 0); sh.lineTo(50, 0); sh.lineTo(0, 50 * PT); sh.closePath(); for (const z of [376, 440]) { const g = new THREE.ExtrudeGeometry(sh, { depth: 4, bevelEnabled: false }); mesh(g, kenM, 2300, GY + 70, z); } }
  for (let i = 0; i < 8; i++) { const t = GY + 70 + (i + .5) * 6.25 * PT + 1.8; cols.push({ t: 'b', x0: 2250 + i * 6.25, x1: 2256.25 + i * 6.25, y0: GY + 70, y1: t, z0: 374, z1: 446, grip: true }, { t: 'b', x0: 2343.75 - i * 6.25, x1: 2350 - i * 6.25, y0: GY + 70, y1: t, z0: 374, z1: 446, grip: true }); }
  mesh(new THREE.CylinderGeometry(9, 7, 6, 20), M.dsteel, 2215, GY + 3, 400); // water bowl
  // BBQ
  const bbqM = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: .4, metalness: .6 });
  cyl(2450, -250, 30, GY + 60, GY + 92, bbqM, { seg: 28 }); mesh(new THREE.SphereGeometry(30, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), bbqM, 2450, GY + 92, -250);
  for (const a of [0, 2.1, 4.2]) { const l = mesh(new THREE.CylinderGeometry(1.5, 1.5, 62, 8), bbqM, 2450 + Math.cos(a) * 20, GY + 30, -250 + Math.sin(a) * 20); l.rotation.set(Math.sin(a) * .2, 0, -Math.cos(a) * .2); }
  cyl(2450, -250, 3.6, GY, GY + 60, bbqM, { col: false, seg: 16 }); cyl(2450, -250, 14, GY + 24, GY + 26, bbqM, { col: false, seg: 24 });   // centre post + ash pan
  cols.push({ t: 'c', x: 2450, z: -250, r: 4, y0: GY, y1: GY + 60 });
  // deck in front of the sunroom
  const deckM = new THREE.MeshStandardMaterial({ ...genWood([150, 104, 70], [96, 64, 42], 561, 12), roughness: .75 });
  box(2400, 2556, GY, DECK, -60, 220, deckM, { uv: 60 }); box(2390, 2400, GY, GY + 6, -60, 220, deckM, { uv: 60 });
  cyl(2470, 30, 40, DECK + 70, DECK + 73, new THREE.MeshPhysicalMaterial({ color: 0xe8e6e0, roughness: .3, clearcoat: .5 }), { seg: 36 }); cyl(2470, 30, 3, DECK, DECK + 70, M.dsteel, { seg: 12 }); cyl(2470, 30, 20, DECK, DECK + 2, M.dsteel, { seg: 24 });
  for (const [x, z] of [[2420, 30], [2520, 30]]) { box(x - 18, x + 18, DECK + 42, DECK + 45, z - 18, z + 18, M.white); for (const [dx, dz] of [[-16, -16], [16, -16], [-16, 16], [16, 16]]) box(x + dx - 1.2, x + dx + 1.2, DECK, DECK + 42, z + dz - 1.2, z + dz + 1.2, M.white); }
  for (const [x, z] of [[2412, -40], [2412, 200]]) { cyl(x, z, 16, DECK, DECK + 30, potM, { seg: 24, rt: 19 }); const f = furMesh(new THREE.SphereGeometry(20, 20, 14), leafM); f.position.set(x, DECK + 46, z); LV.add(f); }
  // --- the sunroom (glass: you can see in, he can see out) ---
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xcfe6f0, roughness: .04, transmission: .85, thickness: .3, transparent: true, opacity: .22, depthWrite: false });
  const frameM = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: .5 });
  box(2556, 2752, GY, DECK, -60, 220, deckM, { uv: 60 }); box(2556, 2752, 230, 234, -64, 224, glass, { cast: false }); noRay();
  // west glass wall with the sliding door (closed) and the cat flap
  box(2556, 2560, DECK, 230, -60, 60, glass, { cast: false }); noRay(); box(2556, 2560, DECK + 16, 230, 60, 80, glass, { cast: false }); noRay(); box(2556, 2560, DECK, 230, 80, 220, glass, { cast: false }); noRay();
  box(2555, 2561, DECK, DECK + 16, 59, 61, frameM); box(2555, 2561, DECK, DECK + 16, 79, 81, frameM); box(2555, 2561, DECK + 15, DECK + 17, 60, 80, frameM);
  const cf = new THREE.Group(); cf.position.set(2558, DECK + 15, 70); LV.add(cf); YS.catFlap = cf; mesh(new THREE.BoxGeometry(.8, 14, 18), new THREE.MeshPhysicalMaterial({ color: 0x8aa0aa, roughness: .2, transparent: true, opacity: .55 }), 0, -7, 0, { parent: cf, cast: false });
  box(2556, 2752, DECK, 230, -64, -60, glass, { cast: false }); noRay(); box(2556, 2752, DECK, 230, 220, 224, glass, { cast: false }); noRay();
  for (const z of [-60, 0, 60, 140, 220]) box(2555, 2561, DECK, 232, z - 2, z + 2, frameM, { col: false });
  for (const x of [2600, 2660, 2720]) { box(x - 2, x + 2, DECK, 232, -64, -60, frameM, { col: false }); box(x - 2, x + 2, DECK, 232, 220, 224, frameM, { col: false }); box(x - 2, x + 2, 228, 234, -64, 224, frameM, { col: false }); }
  box(2555, 2561, 228, 234, -64, 224, frameM, { col: false });
  // inside: rug, armchair, lamp, side table, plant shelf, writing desk, bookshelf
  const rugM = furMat({ color: 0xb85a48, len: .5, den: 2.6, droop: .1, clump: .45, rimK: .03, root: .6 });
  const rg = new THREE.PlaneGeometry(120, 160); rg.rotateX(-Math.PI / 2); const rug = furMesh(rg, rugM); rug.position.set(2650, DECK + .3, 60); LV.add(rug); cols.push({ t: 'b', x0: 2590, x1: 2710, y0: DECK, y1: DECK + .3, z0: -20, z1: 140, small: true });
  const wick = new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: .95 });
  box(2630, 2690, DECK, DECK + 40, 20, 90, wick); box(2682, 2694, DECK + 40, DECK + 100, 20, 90, wick); box(2630, 2690, DECK + 40, DECK + 66, 14, 22, wick); box(2630, 2690, DECK + 40, DECK + 66, 88, 96, wick);
  box(2636, 2684, DECK + 40, DECK + 48, 24, 86, new THREE.MeshPhysicalMaterial({ color: 0x5a7a9a, roughness: .9, sheen: .6 }));
  cyl(2620, 120, 16, DECK + 50, DECK + 53, M.wood || K.wood, { seg: 24 }); cyl(2620, 120, 2, DECK, DECK + 50, M.dsteel, { seg: 10 }); cyl(2620, 120, 3, DECK + 53, DECK + 61, new THREE.MeshPhysicalMaterial({ color: 0xf2f0ea, roughness: .2, clearcoat: .8 }), { seg: 16 });
  cyl(2700, -10, 1, DECK, DECK + 150, M.dsteel, { seg: 8 }); mesh(new THREE.CylinderGeometry(10, 15, 18, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xf2e6cc, roughness: .9, side: THREE.DoubleSide, emissive: 0xffb36a, emissiveIntensity: .7 }), 2700, DECK + 152, -10, { cast: false });
  YS.lampL = pointL(0xffc890, 9000, 2700, DECK + 140, -10);
  for (const y of [DECK + 40, DECK + 80]) box(2580, 2740, y - 3, y, 196, 218, frameM);
  for (let i = 0; i < 6; i++) { const x = 2595 + i * 26; cyl(x, 207, 7, DECK + 80, DECK + 94, potM, { seg: 16, rt: 8 }); const f = furMesh(new THREE.SphereGeometry(9, 14, 10), leafM); f.position.set(x, DECK + 102, 207); f.scale.y = .8; LV.add(f); }
  // writing desk (the chip is on it) and its chair
  const deskM = new THREE.MeshStandardMaterial({ ...genWood([120, 76, 50], [70, 44, 28], 571), roughness: .5 });
  const DT = DECK + 66; box(2690, 2750, DT - 4, DT, 120, 200, deskM); for (const [x, z] of [[2692, 122], [2746, 122], [2692, 196], [2746, 196]]) box(x - 2, x + 2, DECK, DT - 4, z - 2, z + 2, deskM);
  box(2700, 2748, DT - 18, DT - 4, 124, 196, deskM); // drawers
  box(2660, 2690, DECK + 42, DECK + 45, 145, 175, deskM); for (const [dx, dz] of [[2, 2], [28, 2], [2, 28], [28, 28]]) box(2660 + dx - 1.2, 2660 + dx + 1.2, DECK, DECK + 42, 145 + dz - 1.2, 145 + dz + 1.2, deskM); box(2660, 2663, DECK + 45, DECK + 90, 145, 175, deskM);
  box(2730, 2746, DT, DT + 22, 130, 150, M.cardB, { uv: 0 }); box(2700, 2724, DT, DT + .6, 170, 192, new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: .9 }), { col: false });
  // the chip: a little green board with a glow
  { const g = new THREE.Group(); g.position.set(YS.chipP.x, DT + .4, YS.chipP.z); LV.add(g); g.add(new THREE.Mesh(new THREE.BoxGeometry(5, .4, 4), new THREE.MeshStandardMaterial({ color: 0x1f7a3a, roughness: .5 }))); const ch = new THREE.Mesh(new THREE.BoxGeometry(2, .6, 2), new THREE.MeshStandardMaterial({ color: 0x111, roughness: .3 })); ch.position.y = .5; g.add(ch); for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(.3, .2, .8), MAT.brass); p.position.set(-1.6 + i * .64, .3, 1.8); g.add(p); }
    const halo = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.3, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7ff6a0).multiplyScalar(2), transparent: true, opacity: .5, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })); LVFX.add(halo); halo.position.set(YS.chipP.x, DT + 2, YS.chipP.z); YS.chipM = g; YS.chipHalo = halo; YS.chipP.y = DT; }
  // a moving box with books piled on it, pushed against the desk — the way up to the top
  { box(2700, 2734, DECK, DECK + 46, 92, 119, M.cardB, { uv: 0 }); box(2700, 2734, DECK + 22, DECK + 23.5, 91.6, 92, new THREE.MeshStandardMaterial({ color: 0xc8a878, roughness: .8 }), { col: false });
    const bk = [0x8a3a2e, 0x2e4a6a, 0x4a6a3a, 0xc8a060, 0x5a3a5a, 0x2a2a30]; let y = DECK + 46;
    for (let i = 0; i < bk.length; i++) { const h = 3.2 + (i * 7 % 5) * .3, dx = [0, 1.2, -.8, .6, -1, .4][i], dz = [0, -.6, .8, -.3, .5, 0][i];
      box(2704 + dx, 2730 + dx, y, y + h, 98 + dz, 118 + dz * .5, new THREE.MeshStandardMaterial({ color: bk[i], roughness: .65 }), { col: false });
      box(2705 + dx, 2729 + dx, y + .5, y + h - .5, 97.6 + dz, 98 + dz, new THREE.MeshStandardMaterial({ color: 0xeee6d2, roughness: .9 }), { col: false }); y += h; }
    YS.bookTop = y; cols.push({ t: 'b', x0: 2704, x1: 2730, y0: DECK + 46, y1: y, z0: 98, z1: 118 }); }
  // bookshelf on the house wall
  box(2735, 2752, DECK, DECK + 180, -50, 10, deskM); for (const y of [DECK + 40, DECK + 80, DECK + 120, DECK + 160]) box(2735, 2752, y - 2, y, -50, 10, deskM);
  // pickups, switches
  addBattery(1900, 128, 360); addBattery(2450, GY + 122, -250); addVial(2130, GY, 150); addCrumb(1640, GY, 40); addCrumb(2470, DECK + 73, 30);
  addSwitch('露台的插座', [2404, DECK + 1.5, 210], [2560, 0, 60], 220, { list: 'yard' }); box(2398, 2410, DECK, DECK + 3, 206, 214, M.white);
  // lights: the moon, a dim sky fill, lamps
  LV.add(new THREE.HemisphereLight(0x50648c, 0x16220f, .95));
  YS.moon = spotL(0xb8c8ff, 2600000, V3(2400, 900, -900), V3(2000, GY, 100), .55, .5, 2048, 300, 2600);
  YS.porchL = pointL(0xffd2a0, 7000, 2564, 200, 70);
  buildYardSwitches(X0);
  YS.lights = [{ p: V3(X0 + 12, 200, 105), range: 120, I: () => YS.doorL.intensity }, { p: V3(2564, 200, 70), range: 150, I: () => YS.porchL.intensity }, { p: V3(2700, DECK + 140, -10), range: 170, I: () => YS.lampL.intensity }];
  // the dog and 陳伯
  buildDog(); buildOldMan();
}

// ---------- the neighbour's dog ----------
function buildDog(o = {}) {
  const D = { pos: o.pos || V3(2300, GY, 368), yaw: Math.PI, mode: 'sleep', t: 0, phase: 0, anchor: o.anchor === undefined ? V3(2300, GY, 410) : o.anchor, look: V3(), sleepK: 1, barkT: 0 };
  const g = new THREE.Group(); scene.add(g); D.root = g; if (o.k) g.scale.setScalar(o.k);
  const fur = furMat({ color: o.fur || 0xd8a45a, belly: o.belly || 0xf0d8a8, bellyAmt: .8, len: 1.4, den: 1.8, droop: .5, clump: .5, rimK: .07, root: .6 });
  const body = new THREE.Group(); body.position.y = 46; g.add(body); D.body = body;
  body.add(furMesh(ell(17, 17, 38, 40, 28), fur));
  const neck = new THREE.Group(); neck.position.set(0, 10, 32); body.add(neck); D.neck = neck;
  const head = new THREE.Group(); head.position.set(0, 12, 8); neck.add(head); D.head = head;
  head.add(furMesh(ell(11, 11, 12, 32, 24), fur)); const snout = furMesh(ell(6, 5.4, 9, 20, 14), fur); snout.position.set(0, -3, 11); head.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(2.2, 14, 10), new THREE.MeshPhysicalMaterial({ color: 0x1a1210, roughness: .2, clearcoat: 1 })); nose.position.set(0, -1, 19.6); nose.scale.set(1.3, .9, .8); head.add(nose);
  D.eyes = []; for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 12), MAT.eye); e.position.set(s * 5, 3, 9.6); head.add(e); D.eyes.push(e);
    const ear = new THREE.Group(); ear.position.set(s * 9, 5, 0); ear.rotation.z = s * .35; head.add(ear); const em = furMesh(ell(3.2, 9, 6, 16, 12), fur); em.position.y = -7; ear.add(em);
  }
  const tongue = new THREE.Mesh(ell(2.4, .6, 4, 12, 8), new THREE.MeshStandardMaterial({ color: 0xe0707a, roughness: .5 })); tongue.position.set(0, -7, 14); head.add(tongue); D.tongue = tongue;
  const collar = new THREE.Mesh(new THREE.TorusGeometry(9.5, 1.4, 8, 28), o.collar ? new THREE.MeshStandardMaterial({ color: o.collar, roughness: .4 }) : MAT.paintRed); collar.position.set(0, 2, 2); collar.rotation.x = Math.PI / 2 - .4; neck.add(collar);
  D.legs = []; for (const [x, z] of [[-8, 26], [8, 26], [-8, -26], [8, -26]]) { const L = new THREE.Group(); L.position.set(x, -8, z); body.add(L); const lm = furMesh(capG(4.2, 26), fur); lm.position.y = -16; L.add(lm); const paw = furMesh(ell(4.4, 2.6, 5.4, 12, 8), fur); paw.position.set(0, -32, 1.4); L.add(paw); D.legs.push({ g: L, z }); }
  D.tail = new THREE.Group(); D.tail.position.set(0, 8, -36); body.add(D.tail); const tm = furMesh(capG(3, 26), fur); tm.position.set(0, 0, -14); tm.rotation.x = Math.PI / 2 + .5; D.tail.add(tm);
  if (!o.keep) { YS.dog = D; npcHome(g, D.pos, D.yaw, 'yard'); } return D;
}
function updDog(dt) {
  const D = YS.dog; if (!D) return; if (TAKE.job && TAKE.job.who === 'dog') { dogTake(TAKE.job, D, dt); return; } D.t -= dt; const P = D.pos; let sp = 0;
  if (D.mode === 'sleep') { D.sleepK = damp(D.sleepK, 1, 2, dt); if (D.t <= 0 && rnd() < dt * .03) { D.mode = 'sniff'; D.t = R(8, 14); D.target = dogSpot(); } }
  else {
    D.sleepK = damp(D.sleepK, 0, 3, dt);
    if (D.mode === 'sniff') { if (!D.target) D.target = dogSpot(); if (moveDog(D, D.target, 26, dt)) { D.target = dogSpot(); sp = 0; } else sp = 26; if (D.t <= 0) { D.mode = 'home'; } }
    else if (D.mode === 'alert' || D.mode === 'bark') { const dx = D.look.x - P.x, dz = D.look.z - P.z; D.yaw = angDamp(D.yaw, Math.atan2(dx, dz), 4, dt); if (D.mode === 'alert' && Math.hypot(dx, dz) > 60) { moveDog(D, D.look, 40, dt); sp = 40; } if (D.t <= 0) { D.mode = 'sniff'; D.t = R(5, 9); D.target = dogSpot(); } if (D.mode === 'bark' && (D.barkT -= dt) <= 0) { D.barkT = .45; dogBark(); } }
    else if (D.mode === 'home') { const h = V3(2300, GY, 368); if (moveDog(D, h, 28, dt)) { D.mode = 'sleep'; D.t = R(10, 20); D.yaw = Math.PI; } else sp = 28; }
  }
  // the chain
  const ax = P.x - D.anchor.x, az = P.z - D.anchor.z, ad = Math.hypot(ax, az); if (ad > 175) { P.x = D.anchor.x + ax / ad * 175; P.z = D.anchor.z + az / ad * 175; }
  // bump into small things
  if (sp > 0 && !NET.client) for (const C of party) if (mine(C) && !C.frozen && C.pos.y < GY + 10 && Math.hypot(C.pos.x - (P.x + Math.sin(D.yaw) * 30), C.pos.z - (P.z + Math.cos(D.yaw) * 30)) < 14) knock(C, V3(P.x, GY, P.z), C === leader ? '被狗的鼻撞開了！' : null);
  dogAnim(D, sp, dt);
}
function dogSpot() { const a = rnd() * 6.283, r = R(40, 170); return V3(2300 + Math.cos(a) * r, GY, 410 + Math.sin(a) * r); }
function moveDog(D, t, sp, dt) { const dx = t.x - D.pos.x, dz = t.z - D.pos.z, d = Math.hypot(dx, dz); if (d < 6) return true; D.pos.x += dx / d * sp * dt; D.pos.z += dz / d * sp * dt; D.yaw = angDamp(D.yaw, Math.atan2(dx, dz), 4, dt); return false; }
function dogAnim(D, sp, dt) {
  D.root.position.copy(D.pos); D.root.rotation.y = D.yaw; D.phase += dt * sp * .22; const k = D.sleepK;
  D.body.position.y = lerp(46, 22, k); D.body.rotation.z = k * .15; D.neck.rotation.x = lerp(D.mode === 'sniff' ? .55 + Math.sin(T * 7) * .08 : -.05, .9, k);
  D.legs.forEach((L, i) => { L.g.rotation.x = sp > 0 ? Math.sin(D.phase + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * .55 : lerp(0, i < 2 ? -1.4 : 1.3, k); });
  D.tail.rotation.y = Math.sin(T * (D.mode === 'bark' ? 18 : 6)) * (k > .5 ? .1 : .5);
  for (const e of D.eyes) e.scale.y = k > .6 ? .12 : 1; D.tongue.visible = k < .4 && sp > 0;
  D.head.rotation.x = D.mode === 'bark' ? Math.sin(T * 14) * .12 : 0;
}
function dogBark() { SND.thud(.25); tone(330, 180, .14, .12, 'sawtooth'); nz(.12, 900, 1.2, .2); if (!YS.said.bark || T - YS.said.bark > 6) { YS.said.bark = T; sayW('鄰居的狗', '汪！汪汪！', '#d8a45a', 1.6); } oldManLook(YS.dog.look, 4); }
function yardHear(p, loud) {
  const D = YS.dog; if (D && loud > .25 && Math.hypot(p.x - D.pos.x, p.z - D.pos.z) < 360) { D.mode = 'alert'; D.t = 4; D.look.copy(p); if (D.sleepK > .5) sayW('鄰居的狗', '……？', '#d8a45a', 1.2); }
  if (Math.hypot(p.x - 2650, p.z - 60) < 260 && loud > .3) oldManLook(p, 3);
}
function yardSeen(tp, who) { if (who === 'dog') { const D = YS.dog; D.mode = 'bark'; D.t = 3; D.look.copy(tp); } else oldManLook(tp, 3.5); }

// ---------- 陳伯 in his armchair ----------
function buildOldMan() {
  const cardig = new THREE.MeshPhysicalMaterial({ color: 0x7a5a3a, roughness: .95, sheen: .6, sheenColor: 0xc8a888 });
  const H = buildHuman({ pants: new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: .9 }), top: cardig, skin: MAT.skin, shoe: new THREE.MeshStandardMaterial({ color: 0x4a2a1a, roughness: .7 }), hair: 0xd8d4cc, bald: true, glasses: true });
  H.pos.set(2662, DECK + 4, 55); H.yaw = -Math.PI / 2; H.root.visible = true; npcHome(H.root, H.pos, H.yaw, 'yard');
  // seated: thighs forward, shins down
  H.pelvis.position.y = 44; for (const L of H.legs) { L.hip.rotation.x = -1.45; L.knee.rotation.x = 1.5; L.ankle.rotation.x = 0; }
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(52, 34), new THREE.MeshStandardMaterial({ map: genNews(), roughness: .9, side: THREE.DoubleSide })); paper.position.set(0, 52, 26); H.chest.add(paper); H.paper = paper;
  YS.old = { H, mode: 'read', t: R(8, 12), look: V3(2500, 40, 60), lookK: 0 };
  H.root.position.copy(H.pos); H.root.rotation.y = H.yaw;
}
function genNews() { const [c, x] = cnv(256, 168); x.fillStyle = '#ece6d8'; x.fillRect(0, 0, 256, 168); x.fillStyle = '#222'; x.font = '900 26px "Noto Sans TC"'; x.fillText('尋人：陳教授', 14, 36); x.font = '500 12px "Noto Sans TC"'; for (let i = 0; i < 9; i++) x.fillRect(14, 52 + i * 12, R(150, 226), 4); x.fillStyle = '#888'; x.fillRect(176, 48, 66, 64); return tex(c); }
function oldManLook(p, d) { const O = YS.old; if (!O) return; O.mode = 'alert'; O.t = d; O.look.copy(p); if (!YS.said.old || T - YS.said.old > 12) { YS.said.old = T; sayW('陳伯', rnd() < .5 ? '嗯？外面有什麼？' : '……小黃，又吠什麼？', '#c8b8a0', 2.4); } }
function updOldMan(dt) {
  const O = YS.old; if (!O) return; const H = O.H; oldBrain(dt);
  if (TAKE.job && TAKE.job.who === 'old') oldTake(TAKE.job, dt); else if (O.grab) O.grab.visible = false;
}
// sprinkler: one jet sweeping round; whoever it hits gets knocked over
function updSprinkler(dt) {
  const S = YS.spr; if (!S) return; if (HX.id.otap && !HX.id.otap.on) return; S.a += dt * .9; S.arm.rotation.y = S.a; const dx = Math.sin(S.a), dz = Math.cos(S.a);
  if (YS.near) for (let i = 0; i < 3; i++) { const v = R(60, 120); emit(V3(S.p.x + dx * 5, GY + 6, S.p.z + dz * 5), V3(dx * v + R(-4, 4), R(40, 70), dz * v + R(-4, 4)), new THREE.Color(.55, .7, .85), R(.15, .3), R(.8, 1.4), 120, 0); }
  if (NET.client) return;
  for (const C of party) { if (!mine(C) || C.frozen || C.pos.y > GY + 14) continue; const rx = C.pos.x - S.p.x, rz = C.pos.z - S.p.z, d = Math.hypot(rx, rz); if (d < 20 || d > S.R) continue; const ca = (rx * dx + rz * dz) / d; if (ca > .985) knock(C, V3(S.p.x, GY, S.p.z), C === leader ? '被灑水器射中了！' : null); }
}
function detectYard(dt) {
  if (STATE !== 'play') return; if (window.__NODET) { meter = 0; return; } if (TOY.grace > 0) { meter = Math.max(0, meter - dt * .5); return; }
  const L = leader; if (L.frozen || !mine(L)) { meter = Math.max(0, meter - dt * .5); KS.watch = null; return; }
  let seen = 0, who = null; const D = YS.dog, O = YS.old;
  if (D && D.sleepK < .5) { const hp = V3(); D.head.getWorldPosition(hp); const q = new THREE.Quaternion(); D.head.getWorldQuaternion(q); const f = V3(0, 0, 1).applyQuaternion(q); const s = seeFrom(hp, f, .5, 320) * 1.2; if (s > seen) { seen = s; who = 'dog'; } }
  if (O && O.lookK > .5 && O.mode !== 'doze' && O.mode !== 'listen') { const hp = V3(); O.H.head.getWorldPosition(hp); const q = new THREE.Quaternion(); O.H.head.getWorldQuaternion(q); const f = V3(0, 0, 1).applyQuaternion(q); const s = seeFrom(hp, f, .5, 320); if (s > seen) { seen = s; who = 'old'; } }
  KS.watch = seen > 0 ? { p: who === 'dog' ? D.head.getWorldPosition(V3()) : O.H.head.getWorldPosition(V3()), s: seen, who } : null;
  if (seen > 0) {
    const p = V3(L.pos.x, L.pos.y + L.h * .5, L.pos.z); let lit = litAtList(p, YS.lights, .6) * (inDark(L.pos) ? .6 : 1); if (inGrass(L.pos)) lit *= .3;
    const mv = L.spd > 1.5 ? 1 : .5; const cr = L.crouch ? .55 : 1;
    meter += seen * lit * mv * cr * hideK(L) * (who === 'old' ? OLDB.eye : 1) * dt;
    if (meter > .3) netSeen(V3(L.pos.x, L.pos.y + 2, L.pos.z), who);
  } else meter -= dt * .24;
  meter = clamp(meter, 0, 1); if (meter >= 1) toyFreeze(who);
}
function updYardWorld(dt) {
  YS.near = ZONES.yard && ZONES.yard.near; updSprinkler(dt);
  const lw = YS.flapW = YS.flapW || 0; let push = 0; for (const C of party) if (Math.abs(C.pos.x - 2558) < 5 && C.pos.z > 61 && C.pos.z < 79 && C.pos.y < DECK + 12) push = C.pos.x < 2558 ? 1 : -1;
  YS.flapW = damp(lw, push, push ? 10 : 3, dt); YS.catFlap.rotation.z = YS.flapW;
  if (!YS.chip && YS.chipM) { YS.chipM.rotation.y += dt; YS.chipHalo.lookAt(camera.position); }
  if (!YS.chip && !NET.client && STATE === 'play') { for (const C of party) if ((NET.on || C === leader) && !C.frozen && C.pos.distanceTo(YS.chipP) < 5) { chipGet(C); break; } }
}
function chipGet(C) {
  if (YS.chip) return; YS.chip = true; YS.chipM.visible = false; YS.chipHalo.visible = false; SND.pick();
  for (let i = 0; i < 30; i++) emit(YS.chipP.clone().add(V3(0, 2, 0)), V3(R(-10, 10), R(4, 18), R(-10, 10)), new THREE.Color(.6, 2.2, 1), R(.15, .35), R(.4, 1), 30, 2);
  toastW(`${C.S.name}拿到了控制晶片！`, 3);
  if (NET.on) { if (quest === 10) { setQuest(11); chapterBanner('第三章（多人）· 完', '控制晶片'); nsend({ t: 'ban', a: '第三章（多人）· 完', b: '控制晶片' }); } }
  else {
    say('爸爸', '找到了！有這塊晶片，縮小機就可以重新啟動……', '#f5f0e6', 3.4); setTimeout(() => say('陳伯', '……教授？是你嗎？', '#c8b8a0', 3), 3600); unlockKey('ch4');
    setTimeout(() => { chapterBanner('第四章 · 完', '控制晶片'); QUESTS = YQ_SP2; setQuest(0); say('爸爸', '別讓他看見！由前園的閘底出去——公園就在馬路對面。', '#f5f0e6', 4); }, 7200);
  }
}
const YQ_SP = [
  { t: '穿過後園，去圍欄的爛板', s: '圍欄最下面有塊爛板可以鑽過去。小心灑水器，長草可以躲' },
  { t: '避開鄰居的狗，去陽光房', s: '狗醒了會吠，陳伯會望出來。陽光房的玻璃門下面有貓門' },
  { t: '找出控制晶片', s: '晶片在陳伯的書枱上。他在看報紙，但不時會抬頭' }
];
LEVELS.yard = {
  chapter: '第四章', title: '後園與鄰居家', mpChapter: '第三章（多人）', env: 'yard', envI: .5, fog: [0x0e1626, .0004], expo: 1.35,
  dust: { N: 1400, box: [1500, 2740, GY, 220, -420, 620], beamFrac: .0, door: false },
  toys: true, npcNear: true, build: buildYard,
  cps: [[1480, GY, 105], [1900, GY, 112], [2130, GY, 109], [2420, DECK, 100], [2600, DECK, 140]],
  quests: YQ_SP,
  spawn() { if (!NET.on) crewJoin('bat', true); spawnSP(this.cps[0], -Math.PI / 2, 5); if (!GS.latch) { GS.latch = true; } if (!LIV.ventOpen) { LIV.ventOpen = true; LIV.ventCol.y0 = -999; LIV.ventCol.y1 = -998; } },
  enter(prev, again) { if (!again && !NET.on && prev === 'garage' && STATE === 'play') unlockKey('ch3'); if (again || NET.on) return; setTimeout(() => say('爸爸', '陳伯就住隔籬，那邊的玻璃屋……小心他的狗。', '#f5f0e6', 3.6), 1500); },
  npc(dt) { if (STATE === 'play' || STATE === 'fail' || STATE === 'frozen' || STATE === 'end') { updDog(dt); updOldMan(dt); } },
  detect: detectYard, hear: yardHear, seen: yardSeen,
  update(dt) {
    lvT += dt; hxUI(); radioTick(); if (NET.on) return; const L = leader;
    if (QUESTS === YQ_SP2) return;
    if (quest === 0 && L.pos.x > 2108) setQuest(1);
    if (quest === 1 && L.pos.x > 2562 && L.pos.y > DECK - 2) { setQuest(2); toast('進了陽光房'); }
  },
  win() { },
  marker() { if (NET.on) return mpMarker(); if (QUESTS === YQ_SP2) return ST.gate; return quest === 0 ? YS.gap : quest === 1 ? YS.flap : (YS.chip ? null : YS.chipP); },
  reset() { if (YS.dog) { YS.dog.mode = 'home'; } if (YS.old) { YS.old.mode = 'read'; YS.old.t = 8; } },
  eyeText: () => { if (meter > .3) return '被看見了！躲進長草'; const O = YS.old, m = O && O.mode; return m === 'doze' ? '陳伯睡着了——趁現在' : m === 'listen' ? '陳伯閉着眼聽粵曲' : OLDB.sus >= 2 ? '陳伯起了疑心' : '鄰居的狗和陳伯'; },
  hint(L) { if (inGrass(L.pos)) return '躲在長草裡——比較難被看見'; return ''; },
  onSwitch() { }
};

// ---------- online co-op: one shared chain of objectives across the whole house (host decides) ----------
function mpObjectives() {
  if (!NET.on || NET.client || STATE !== 'play' || !WORLD || PRO.on) return;
  const P = playerChars().filter(C => !C.frozen); if (!P.length) return;
  if (quest === 2 && P.every(C => C.pos.x > 316 && C.pos.x < 912 && C.pos.z > -232)) { setQuest(3); toastW('全隊到齊客廳！', 2.4); }
  if (quest <= 3) mpAdvance();
  if (quest === 4 && !LIV.ventOpen) ventOpen();
  if (quest === 4 && P.every(C => C.pos.x > 924)) { setQuest(5); toastW('全隊到了車房！', 2.4); }
  if (quest === 5 && GS.camBroken) setQuest(6);
  if (quest === 6 && GS.latch) setQuest(7);
  if (quest === 7 && P.every(C => C.pos.x > 1462)) { setQuest(8); toastW('全隊出了後園！', 2.4); }
  if (quest === 8 && P.every(C => C.pos.x > 2108)) setQuest(9);
  if (quest === 9 && P.every(C => C.pos.x > 2562 && C.pos.y > DECK - 2)) { setQuest(10); toastW('全隊進了陽光房！', 2.4); }
  if (quest === 11 && P.every(C => C.pos.z > 650)) { setQuest(12); toastW('全隊到了行人路！', 2.4); }
  if (quest === 12 && ST.pressed) setQuest(13);
  if ((quest === 12 || quest === 13) && P.every(C => C.pos.z > 1505 && C.pos.y > GY - 2)) { setQuest(14); toastW('全隊過了馬路！', 2.4); }
  if (quest === 14 && P.every(C => C.pos.z > 1640 && C.pos.x > 1995 && C.pos.x < 2125) && STATE === 'play') { STATE = 'end'; endT = 0; END_TXT = ['第四章（多人）· 完', '馬路', '全隊安全過了馬路。公園裡面……好像有很多狗。（下一章：公園，製作中）']; nsend({ t: 'end', e: END_TXT }); }
}
function mpMarker() {
  const L = leader;
  if (quest === 0) { const p = LIV.parts.filter(q => !q.got).sort((a, b) => Math.hypot(a.x - L.pos.x, a.z - L.pos.z) - Math.hypot(b.x - L.pos.x, b.z - L.pos.z))[0]; return p ? V3(p.x, p.y + 2, p.z) : null; }
  if (quest === 1) return V3(LIV.wedge.cx, 4, LIV.wedge.cz); if (quest === 2) return V3(345, 0, -10); if (quest === 3) return V3(LIV.remote.cx, 46, LIV.remote.cz);
  if (quest === 4) return L.pos.x > 924 ? null : V3(896, 6, -200); if (quest === 5) return V3(GS.cam.cx, GS.cam.y0 + 14, GS.cam.cz); if (quest === 6) return GS.latchP; if (quest === 7) return L.pos.x > 1462 ? null : V3(1455, GY + 2, 105);
  if (quest === 8) return L.pos.x > 2108 ? null : YS.gap; if (quest === 9) return L.pos.x > 2562 ? null : YS.flap; if (quest === 10) return YS.chip ? null : YS.chipP;
  if (quest === 11) return L.pos.z > 650 ? null : ST.gate; if (quest === 12) return V3(1960, GY + 118, 770);
  if (quest === 13) return L.pos.z < 1130 ? V3(2060, GY + 4, 1150) : V3(2060, GY + 4, 1560); return ST.parkP;
}
// what the host tells everyone about the garage and the yard
function netWorldExtra(w) {
  const A = GS.agent, D = YS.dog, O = YS.old;
  w.ga = [+A.pos.x.toFixed(1), +A.pos.z.toFixed(1), +A.yaw.toFixed(3), +A.aimT.x.toFixed(1), +A.aimT.y.toFixed(1), +A.aimT.z.toFixed(1), GS.camBroken ? 1 : 0, GS.latch ? 1 : 0];
  w.rd = [['go', 'wait', 'amber', 'red', 'walk', 'flash', 'clear'].indexOf(ST.phase), +ST.pt.toFixed(2), ST.req ? 1 : 0, ...ST.cars.flatMap(c => [c.alive ? 1 : 0, c.lane, Math.round(c.x), Math.round(c.v)])];
  if (ST.walker) { const H = ST.walker.H, D = ST.wdog; w.wk = [+H.pos.x.toFixed(1), +H.yaw.toFixed(3), ST.walker.mode, +ST.walker.look.x.toFixed(0), +ST.walker.look.z.toFixed(0), +D.pos.x.toFixed(1), +D.pos.z.toFixed(1), +D.yaw.toFixed(3), D.mode]; }
  w.ya = [+D.pos.x.toFixed(1), +D.pos.z.toFixed(1), +D.yaw.toFixed(3), D.mode, +D.sleepK.toFixed(2), O.mode, +O.look.x.toFixed(0), +O.look.y.toFixed(0), +O.look.z.toFixed(0), YS.chip ? 1 : 0, LIV.ventOpen ? 1 : 0];
}
function netRecvExtra(w) {
  if (w.rd) { ST.phase = ['go', 'wait', 'amber', 'red', 'walk', 'flash', 'clear'][w.rd[0]] || 'go'; ST.pt = w.rd[1]; ST.req = !!w.rd[2]; for (let i = 0; i < ST.cars.length; i++) { const c = ST.cars[i], b = 3 + i * 4; if (w.rd[b] == null) break; const was = c.alive; c.alive = !!w.rd[b]; c.lane = w.rd[b + 1]; if (!was || Math.abs(c.x - w.rd[b + 2]) > 160) c.x = w.rd[b + 2]; c.tx = w.rd[b + 2]; c.v = w.rd[b + 3]; if (!was && c.alive) c.gust.clear(); } }
  if (w.ga) { if (w.ga[6] && !GS.camBroken) { GS.cam.y0 = Math.min(GS.cam.y0, 150); } if (w.ga[7] && !GS.latch) latchOpen(null); }
  if (w.ya) { if (w.ya[9] && !YS.chip) { YS.chip = true; YS.chipM.visible = false; YS.chipHalo.visible = false; } if (w.ya[10] && !LIV.ventOpen) ventOpen(); }
}
function netNPCExtra(dt) {
  const w = NET.npc; if (!w) return;
  for (const c of ST.cars) if (c.alive && c.tx != null) { c.x += LANES[c.lane].dir * c.v * dt; c.x += (c.tx - c.x) * (1 - Math.exp(-4 * dt)); }
  if (w.wk && ST.walker) { const W = ST.walker, H = W.H, D = ST.wdog, k = w.wk; H.pos.x += (k[0] - H.pos.x) * (1 - Math.exp(-8 * dt)); H.yaw = angDamp(H.yaw, k[1], 8, dt); W.mode = k[2]; W.look.set(k[3], GY + 4, k[4]); D.pos.x += (k[5] - D.pos.x) * (1 - Math.exp(-8 * dt)); D.pos.z += (k[6] - D.pos.z) * (1 - Math.exp(-8 * dt)); D.yaw = angDamp(D.yaw, k[7], 8, dt); D.mode = k[8]; W.t = 99; }
  if (w.ga && GS.agent) { const A = GS.agent, g = w.ga, ox = A.pos.x, oz = A.pos.z; const k = 1 - Math.exp(-8 * dt); if (Math.hypot(g[0] - ox, g[1] - oz) > 80) { A.pos.x = g[0]; A.pos.z = g[1]; } else { A.pos.x += (g[0] - ox) * k; A.pos.z += (g[1] - oz) * k; } A.pos.y = GY; A.yaw = angDamp(A.yaw, g[2], 8, dt); A.aimT.set(g[3], g[4], g[5]); A.aim.lerp(A.aimT, 1 - Math.exp(-3 * dt)); agentPose(A, Math.hypot(A.pos.x - ox, A.pos.z - oz), dt); }
  if (w.ya && YS.dog) { const D = YS.dog, y = w.ya, ox = D.pos.x, oz = D.pos.z; const k = 1 - Math.exp(-8 * dt); D.pos.x += (y[0] - ox) * k; D.pos.z += (y[1] - oz) * k; D.yaw = angDamp(D.yaw, y[2], 8, dt); D.mode = y[3]; D.sleepK = y[4]; dogAnim(D, Math.hypot(D.pos.x - ox, D.pos.z - oz) / Math.max(dt, 1e-3), dt);
    const O = YS.old; O.mode = y[5]; O.t = 99; O.look.set(y[6], y[7], y[8]); updOldMan(dt); }
}
