// =====================================================================
//  第五章 · 馬路 — out under 陳伯's front gate, across the road to the park
//  The pavement (a man walking his little dog after dinner), the kerb, two lanes of night traffic,
//  a zebra crossing with a "push to cross" button high up its pole, a refuge island halfway,
//  and the park gate on the far side. Cars only stop for the green man — and a car's wheels are
//  the one thing a 5 cm hero must never be under (its body passes right overhead).
// =====================================================================
const RY = GY - 15;                                   // road surface (the kerb is 15 cm)
const ST = { cars: [], lights: [], phase: 'go', pt: 0, req: false, said: {}, walker: null, wdog: null, sky: null, near: false,
  gate: V3(2620, GY, 643), btnP: V3(1960, GY + 104, 772), islP: V3(2060, GY + 56, 1146), parkP: V3(2060, GY, 1660), beepT: 0, passT: {}, hornT: 0, spawnT: [1, 3] };
const LANES = [{ z: 975, dir: 1 }, { z: 1325, dir: -1 }];
const XW0 = 1980, XW1 = 2140, STOPX = [1930, 2190];
const CAR_L = 215, CAR_W = 94;

// ---------- textures ----------
function genAsphalt() {
  const W = 512, n = noiseField(W, W, 5, 5, 701), n2 = noiseField(W, W, 2, 90, 702); const h = new Float32Array(W * W);
  const c = fromFn(W, W, (x, y, i, o) => { const s = hashI(i * 7 + 3); const agg = s > .9 ? (s - .9) * 3.2 : 0; const v = .2 + (n[i] - .5) * .1 + agg * .5 + (n2[i] - .5) * .05; o[0] = 92 * v + 6; o[1] = 94 * v + 6; o[2] = 100 * v + 8; h[i] = n2[i] * .6 + agg; });
  return { map: tex(c), normalMap: normalTex(h, W, W, 2.4) };
}
function pedTex(kind) {
  const [c, x] = cnv(96, 128); x.fillStyle = '#0b0d10'; x.fillRect(0, 0, 96, 128);
  const col = kind === 'walk' ? '#8dffb8' : '#ff6a3c'; x.fillStyle = col; x.strokeStyle = col; x.lineCap = 'round'; x.lineWidth = 9;
  if (kind === 'walk') { x.beginPath(); x.arc(52, 24, 10, 0, 7); x.fill(); x.beginPath(); x.moveTo(50, 40); x.lineTo(44, 74); x.lineTo(28, 108); x.moveTo(44, 74); x.lineTo(62, 104); x.moveTo(48, 46); x.lineTo(30, 66); x.moveTo(50, 46); x.lineTo(70, 64); x.stroke(); }
  else { x.beginPath(); x.arc(48, 22, 10, 0, 7); x.fill(); x.beginPath(); x.moveTo(48, 38); x.lineTo(48, 78); x.moveTo(40, 78); x.lineTo(38, 112); x.moveTo(56, 78); x.lineTo(58, 112); x.moveTo(44, 44); x.lineTo(32, 76); x.moveTo(52, 44); x.lineTo(64, 76); x.stroke(); }
  return tex(c);
}
function signTex() {
  const [c, x] = cnv(512, 160); const g = x.createLinearGradient(0, 0, 0, 160); g.addColorStop(0, '#2c4a36'); g.addColorStop(1, '#1d3325'); x.fillStyle = g; x.fillRect(0, 0, 512, 160);
  x.strokeStyle = '#c9b77a'; x.lineWidth = 6; x.strokeRect(10, 10, 492, 140); x.fillStyle = '#efe2b4'; x.textAlign = 'center'; x.font = '700 72px "Noto Sans TC", sans-serif'; x.fillText('楓 林 公 園', 256, 98); x.font = '600 22px "Fredoka", sans-serif'; x.fillText('MAPLE GROVE PARK', 256, 134);
  return tex(c);
}
function beamTex() { const [c, x] = cnv(64, 256); const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,240,210,.0)'); g.addColorStop(.1, 'rgba(255,240,210,.55)'); g.addColorStop(1, 'rgba(255,240,210,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 256); return tex(c); }
function poolTex() { const [c, x] = cnv(128, 256); const g = x.createRadialGradient(64, 40, 4, 64, 120, 140); g.addColorStop(0, 'rgba(255,236,200,.8)'); g.addColorStop(.5, 'rgba(255,236,200,.22)'); g.addColorStop(1, 'rgba(255,236,200,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 256); return tex(c); }

// ---------- the sky, shared by the yards, the street and the park ----------
function buildNightSky() {
  const keep = LV; ST.sky = new THREE.Group(); ST.sky.name = 'sky'; scene.add(ST.sky); LV = ST.sky; buildSky(2100, 800); LV = keep; ST.sky.visible = false;
}

// ---------- a car (one shape, several paints) ----------
let _carGeo = null;
function carGeos() {
  if (_carGeo) return _carGeo;
  const prof = (pts, depth, bev) => { const s = new THREE.Shape(); pts.forEach(([z, y], i) => i ? s.lineTo(z, y) : s.moveTo(z, y)); const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 4 }); g.rotateY(-Math.PI / 2); g.translate(depth / 2, 0, 0); return g; };
  _carGeo = {
    body: prof([[-212, 26], [-214, 72], [-198, 96], [100, 98], [188, 88], [214, 66], [212, 26], [150, 24], [150, 34], [110, 36], [110, 24], [-110, 24], [-110, 36], [-150, 34], [-150, 24]], 172, 8),
    glass: prof([[-158, 96], [-112, 139], [34, 143], [94, 99]], 152, 6),
    roof: prof([[-118, 138], [-106, 146], [30, 149], [40, 143]], 146, 3),
    wheel: new THREE.CylinderGeometry(32, 32, 22, 28).rotateZ(Math.PI / 2), hub: new THREE.CylinderGeometry(17, 17, 23, 20).rotateZ(Math.PI / 2),
    lamp: new THREE.BoxGeometry(34, 12, 4), beam: new THREE.ConeGeometry(160, 700, 24, 1, true).translate(0, -350, 0).rotateX(-Math.PI / 2), pool: new THREE.PlaneGeometry(360, 640).rotateX(-Math.PI / 2).translate(0, 0, 360)
  };
  return _carGeo;
}
const CAR_PAINTS = [0x8a1c22, 0xd8d8d4, 0x1f3a5c, 0x2a2c30, 0x5c6a3a, 0xb8862c];
function buildRoadCar(i) {
  const G = carGeos(), g = new THREE.Group(); LV.add(g);
  const paint = new THREE.MeshPhysicalMaterial({ color: CAR_PAINTS[i % CAR_PAINTS.length], roughness: .28, metalness: .5, clearcoat: 1, clearcoatRoughness: .08 });
  const add = (geo, mat, x, y, z, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; g.add(m); return m; };
  add(G.body, paint, 0, 0, 0); add(G.glass, ST.mats.glass, 0, 0, 0); add(G.roof, paint, 0, 0, 0);
  const wheels = []; for (const z of [-130, 130]) for (const s of [-1, 1]) { const w = add(G.wheel, ST.mats.tire, s * 82, 32, z); add(G.hub, ST.mats.chrome, s * 82, 32, z); wheels.push(w); }
  for (const s of [-1, 1]) { add(G.lamp, ST.mats.head, s * 60, 72, 214, false); add(G.lamp, ST.mats.tail, s * 64, 78, -216, false); }
  const plate = add(new THREE.BoxGeometry(40, 11, 1), ST.mats.plate, 0, 44, 216, false);
  // fake headlight beams + the bright patch they throw on the road (no real lights: there can be several cars)
  const beams = []; for (const s of [-1, 1]) { const b = new THREE.Mesh(G.beam, ST.mats.beam); b.position.set(s * 60, 70, 216); b.rotation.x = .04; b.visible = !DAY; g.add(b); beams.push(b); }
  const pool = new THREE.Mesh(G.pool, ST.mats.pool); pool.position.set(0, .5, 200); pool.visible = !DAY; g.add(pool);   // (daylight: no beams)
  const C = { g, wheels, x: -9999, lane: 0, v: 0, vmax: 0, alive: false, id: i, gust: new Set() };
  g.visible = false; return C;
}

// ---------- a man out walking his little dog ----------
function buildWalker() {
  const jacket = new THREE.MeshPhysicalMaterial({ color: 0x2f4c6a, roughness: .55, sheen: .5, sheenColor: 0x9ab8d8, clearcoat: .2 });
  const H = buildHuman({ pants: new THREE.MeshStandardMaterial({ color: 0x252a33, roughness: .85 }), top: jacket, skin: MAT.skin, shoe: new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: .6 }), hair: 0x2a1e16, cap: new THREE.MeshStandardMaterial({ color: 0x6a2a2a, roughness: .9 }) });
  // phone in the right hand, its screen lighting his face
  const ph = new THREE.Mesh(new THREE.BoxGeometry(7, 14, 1), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: .3 })); ph.position.set(0, -3, 3); H.arms[1].hand.add(ph);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(6, 12.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xbcd8ff).multiplyScalar(1.6) })); scr.position.set(0, 0, .6); ph.add(scr); scr.rotation.y = Math.PI; scr.position.z = -.6;
  H.pos.set(1600, GY, 712); H.yaw = Math.PI / 2; H.root.visible = true;
  const W = { H, mode: 'walk', dir: 1, t: R(4, 7), look: V3(), lookK: 0, phone: 1 };
  const D = buildDog({ pos: V3(1660, GY, 720), anchor: null, fur: 0xeee6d6, belly: 0xfaf4ea, k: .58, collar: 0x2a6ac8, keep: true });
  D.mode = 'walk'; D.sleepK = 0; D.offs = R(-20, 20); D.sniffT = 0;
  const leash = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 12 }, () => V3())), new THREE.LineBasicMaterial({ color: 0x1a1a1a })); leash.frustumCulled = false; LV.add(leash); W.leash = leash;
  ST.walker = W; ST.wdog = D; npcHome(H.root, H.pos, H.yaw, 'road'); npcHome(D.root, D.pos, D.yaw, 'road');
}
function updWalker(dt) {
  const W = ST.walker, D = ST.wdog; if (!W) return; const H = W.H, P = H.pos; let moveD = 0;
  W.t -= dt; const J = TAKE.job && TAKE.job.who === 'walker' ? TAKE.job : null;
  if (J) walkerTake(J, W, dt);
  else {
  if (W.mode === 'walk') { P.z = damp(P.z, 712, 2, dt);
    const tx = W.dir > 0 ? 2950 : 1450, sp = 46, dx = tx - P.x; const s = sp * dt;
    if (Math.abs(dx) < s + 1) { P.x = tx; W.mode = 'turn'; W.t = 2.4; W.dir = -W.dir; }
    else { P.x += Math.sign(dx) * s; moveD = s; H.yaw = angDamp(H.yaw, W.dir > 0 ? Math.PI / 2 : -Math.PI / 2, 4, dt); }
    if (W.t <= 0) { W.mode = 'stop'; W.t = R(3, 5.5); }                 // stops for the dog to sniff / to read a message
    H.aimT.set(P.x + W.dir * 40, GY + 110, P.z + 30);
  } else if (W.mode === 'stop' || W.mode === 'turn') {
    H.aimT.set(P.x + W.dir * 30, GY + 100, P.z + 26); if (W.t <= 0) { W.mode = 'walk'; W.t = R(7, 12); }
  } else if (W.mode === 'look') {
    H.aimT.lerp(W.look, 1 - Math.exp(-4 * dt)); H.yaw = angDamp(H.yaw, Math.atan2(W.look.x - P.x, W.look.z - P.z), 2.5, dt); if (W.t <= 0) { W.mode = 'walk'; W.t = R(5, 9); }
  }
  W.lookK = damp(W.lookK, W.mode === 'look' ? 1 : 0, 4, dt);
  H.aim.lerp(H.aimT, 1 - Math.exp(-3 * dt));
  humanAnim(H, moveD, dt); const aimed = humanAimArm(H, 0, dt);
  // right arm holds the phone up in front of the chest (lowered while he looks around)
  const A = H.arms[1]; A.sh.rotation.set(lerp(-.95, -.3, W.lookK), -.25, 0); A.el.rotation.x = lerp(-1.35, -.4, W.lookK); H.head.rotation.x = lerp(.45, H.head.rotation.x, W.lookK);
  H.arms[0].sh.rotation.set(-.35 + Math.sin(H.phase) * .12, .1, 0); H.arms[0].el.rotation.x = -.3;
  }
  // the dog trots a little ahead on the leash, stopping to sniff
  if (D) {
    D.sniffT -= dt; const ahead = W.mode === 'walk' ? 70 : 46; const tx = P.x + W.dir * ahead, tz = P.z + 16 + D.offs; let sp = 0;
    if (D.mode === 'alert' || D.mode === 'bark') { D.t -= dt; const dx = D.look.x - D.pos.x, dz = D.look.z - D.pos.z; D.yaw = angDamp(D.yaw, Math.atan2(dx, dz), 5, dt); if ((D.barkT -= dt) <= 0 && D.mode === 'bark') { D.barkT = .5; wdogBark(); } if (D.t <= 0) D.mode = 'walk'; }
    else { const dx = tx - D.pos.x, dz = tz - D.pos.z, d = Math.hypot(dx, dz); if (d > 6) { sp = Math.min(70, d * 1.6); D.pos.x += dx / d * sp * dt; D.pos.z += dz / d * sp * dt; D.yaw = angDamp(D.yaw, Math.atan2(dx, dz), 5, dt); } if (D.sniffT <= 0) { D.offs = R(-26, 30); D.sniffT = R(2, 5); } }
    dogAnim(D, sp, dt); if (sp < 8 && D.mode === 'walk') D.neck.rotation.x = .5 + Math.sin(T * 7) * .08;
    D.pos.z = clamp(D.pos.z, 660, 784);
    // leash: hand → collar, sagging
    const a = V3(); H.arms[0].hand.getWorldPosition(a); const b = V3(); D.neck.getWorldPosition(b); const pa = W.leash.geometry.attributes.position;
    for (let i = 0; i < 12; i++) { const t = i / 11; pa.setXYZ(i, lerp(a.x, b.x, t), lerp(a.y, b.y, t) - Math.sin(t * Math.PI) * 14, lerp(a.z, b.z, t)); } pa.needsUpdate = true;
    // little dog sniffs out anyone nearby on the pavement
    if (!NET.client && STATE === 'play' && D.mode === 'walk') for (const C of party) if (!C.frozen && C.root.visible && C.pos.y < GY + 12 && C.pos.z < 795 && Math.hypot(C.pos.x - D.pos.x, C.pos.z - D.pos.z) < 34 && C.state !== 'shell') { D.mode = 'bark'; D.t = 3; D.look.copy(C.pos); walkerLook(C.pos, 3.5); break; }
  }
}
function walkerLook(p, t) { const W = ST.walker; if (!W) return; if (W.mode !== 'look' && (!ST.said.look || T - ST.said.look > 12)) { ST.said.look = T; sayW('行人', rnd() < .5 ? '豆豆，看到什麼了？' : '……什麼東西？', '#9ec4e8', 2.2); } W.mode = 'look'; W.t = t; W.look.set(p.x, GY + 4, p.z); }
function wdogBark() { tone(560, 380, .1, .08, 'sawtooth'); nz(.08, 1400, 1.4, .12); if (!ST.said.bark || T - ST.said.bark > 6) { ST.said.bark = T; sayW('小狗', '汪！汪！', '#eee6d6', 1.4); } }
function roadHear(p, loud) {
  const W = ST.walker; if (!W || loud < .3) return; if (Math.hypot(p.x - W.H.pos.x, p.z - W.H.pos.z) > 360) return;
  walkerLook(p, 2.6); const D = ST.wdog; if (D) { D.mode = 'alert'; D.t = 2.5; D.look.copy(p); }
}
function roadSeen(tp, who) { walkerLook(tp, 3.5); const D = ST.wdog; if (D) { D.mode = 'bark'; D.t = 2.5; D.look.copy(tp); } }
function detectRoad(dt) {
  if (STATE !== 'play') return; if (window.__NODET) { meter = 0; return; } if (TOY.grace > 0) { meter = Math.max(0, meter - dt * .5); return; }
  const L = leader; if (L.frozen || !mine(L)) { meter = Math.max(0, meter - dt * .5); KS.watch = null; return; }
  const W = ST.walker; let seen = 0, who = null;
  if (W) { const hp = V3(); W.H.head.getWorldPosition(hp); const q = new THREE.Quaternion(); W.H.head.getWorldQuaternion(q); const f = V3(0, 0, 1).applyQuaternion(q); const fov = W.mode === 'look' ? .45 : .7; const s = seeFrom(hp, f, fov, W.mode === 'look' ? 340 : 230); if (s > 0) { seen = s; who = 'walker'; } }
  KS.watch = seen > 0 ? { p: W.H.head.getWorldPosition(V3()), s: seen, who } : null;
  if (seen > 0) {
    const p = V3(L.pos.x, L.pos.y + L.h * .5, L.pos.z); const lit = litAtList(p, ST.lights, DAY ? .8 : .45) * (inDark(L.pos) ? .6 : 1);
    const mv = L.spd > 1.5 ? 1 : .5, cr = L.crouch ? .55 : 1;
    meter += seen * lit * mv * cr * hideK(L) * dt; if (meter > .3) netSeen(V3(L.pos.x, L.pos.y + 2, L.pos.z), who);
  } else meter -= dt * .24;
  meter = clamp(meter, 0, 1); if (meter >= 1) toyFreeze(who);
}

// ---------- build ----------
function buildRoad() {
  const K = kitchenMats(), M = MAT;
  ST.mats = {
    glass: new THREE.MeshPhysicalMaterial({ color: 0x0b1016, roughness: .04, metalness: .3, clearcoat: 1 }),
    tire: new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: .92 }), chrome: new THREE.MeshStandardMaterial({ color: 0xc8ccd2, metalness: 1, roughness: .2 }),
    head: new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2d8).multiplyScalar(DAY ? 1.3 : 3) }), tail: new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff2a1a).multiplyScalar(DAY ? .9 : 2) }),
    plate: new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: .5, emissive: 0x403c30 }),
    beam: new THREE.MeshBasicMaterial({ map: beamTex(), transparent: true, opacity: .16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: true }),
    pool: new THREE.MeshBasicMaterial({ map: poolTex(), transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending, fog: true })
  };
  const asp = genAsphalt(); const asphalt = new THREE.MeshStandardMaterial({ ...asp, roughness: .78, normalScale: new THREE.Vector2(.9, .9) });
  const tm = MAT.floor.map.clone(), tn = MAT.floor.normalMap && MAT.floor.normalMap.clone(); for (const t of [tm, tn]) if (t) { t.repeat.set(1, 1); t.needsUpdate = true; }
  const pave = new THREE.MeshStandardMaterial({ map: tm, normalMap: tn || null, color: 0xbab4aa, roughness: .9 });
  const kerbM = new THREE.MeshStandardMaterial({ map: tm, color: 0xd4cec4, roughness: .85 });
  const lineW = new THREE.MeshStandardMaterial({ color: 0xe8e6de, roughness: .7 }), lineY = new THREE.MeshStandardMaterial({ color: 0xd8a830, roughness: .7 });
  const gr = genGrass(); const grassM = new THREE.MeshStandardMaterial({ ...gr, roughness: .95 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x3a4048, metalness: .7, roughness: .45 }), dark = new THREE.MeshStandardMaterial({ color: 0x15171a, metalness: .4, roughness: .5 });
  const sidingU = new THREE.MeshStandardMaterial({ ...genSiding(0xb7c4c8, 532), roughness: .85 }), sidingN = new THREE.MeshStandardMaterial({ ...genSiding(0xc8c2b0, 531), roughness: .85 });
  const brick = new THREE.MeshStandardMaterial({ color: 0x7a3e2c, roughness: .9 }), hedgeM = new THREE.MeshStandardMaterial({ color: 0x24401e, roughness: 1 });
  // daylight: windows are glass that reflects the sky (nobody needs the lights on)
  const winOff = DAY ? new THREE.MeshPhysicalMaterial({ color: 0x5a6e84, roughness: .05, metalness: .2, clearcoat: 1 }) : new THREE.MeshStandardMaterial({ color: 0x0c1016, roughness: .1, metalness: .3 });
  const winM = DAY ? new THREE.MeshPhysicalMaterial({ color: 0x6a7a8a, roughness: .06, metalness: .15, clearcoat: 1 }) : new THREE.MeshStandardMaterial({ color: 0x2a1c10, emissive: 0xffa860, emissiveIntensity: .85, roughness: .3 });
  LV.add(DAY ? new THREE.HemisphereLight(0xc4dcff, 0x8a8a6a, 1.6) : new THREE.HemisphereLight(0x4a5a80, 0x1a1a14, .8));
  if (DAY) { const tgt = V3(1900, RY, 1080); ST.sun = spotL(0xfff0dc, 26000000, sunFrom(tgt), tgt, .52, .5, 2048, 1200, 3800); ST.sun.userData.prio = 1; }

  // ---- the front of our house, the driveway and garage door ----
  box(-330, 912, GY - 10, GY, 262, 646, grassM, { uv: 90, cast: false });
  box(912, 1460, GY - 10, GY, 312, 646, pave, { uv: 160, cast: false });
  box(-330, 912, GY, GY + 560, 250, 262, sidingU, { uv: 120 });
  box(-340, 912, GY + 556, GY + 572, 240, 276, dark, { col: false });
  for (const [x, y, lit] of [[-200, 90, 1], [60, 90, 1], [300, 90, 0], [560, 90, 1], [-120, 330, 0], [240, 330, 1], [620, 330, 0]]) {
    box(x - 46, x + 46, GY + y, GY + y + 120, 262, 263.5, lit ? winM : winOff, { col: false }); box(x - 50, x + 50, GY + y - 4, GY + y, 262, 266, M.white, { col: false }); box(x - 2, x + 2, GY + y, GY + y + 120, 263, 264.5, M.white, { col: false });
  }
  box(420, 470, GY, GY + 200, 262, 264, new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: .6 }), { col: false });
  box(400, 490, GY, GY + 14, 262, 296, kerbM); box(410, 480, GY + 14, GY + 28, 262, 280, kerbM);
  box(912, 1460, GY, GY + 200, 312, 314, M.white, { col: false }); for (let y = GY + 40; y < GY + 200; y += 40) box(912, 1460, y - 1, y + 1, 314, 315, new THREE.MeshStandardMaterial({ color: 0xc8c8c4, roughness: .6 }), { col: false });
  box(912, 1460, GY + 200, GY + 290, 312, 318, sidingU, { col: false });
  ST.porch = pointL(0xffc890, DAY ? 0 : 9000, 445, GY + 230, 300); mesh(new THREE.SphereGeometry(5, 14, 10), K.bulb, 445, GY + 226, 268, { cast: false });
  box(-330, 400, GY, GY + 40, 628, 646, hedgeM, { uv: 40 }); box(490, 912, GY, GY + 40, 628, 646, hedgeM, { uv: 40 });
  // 陳伯's house front, beyond his fence
  box(2768, 3400, GY, GY + 520, 640, 652, sidingN, { uv: 120 });
  for (const [x, lit] of [[2880, 1], [3100, 0]]) { box(x - 50, x + 50, GY + 90, GY + 210, 652, 653.5, lit ? winM : winOff, { col: false }); box(x - 54, x + 54, GY + 86, GY + 90, 652, 656, M.white, { col: false }); }
  // ---- pavement, kerb, gutter ----
  box(-330, 3400, RY - 10, GY, 636, 800, pave, { uv: 128, cast: false });
  box(-330, 3400, GY, GY + .2, 791, 800, kerbM, { col: false, cast: false });
  for (let x = -320; x < 3400; x += 128) box(x, x + 1, GY, GY + .12, 646, 791, dark, { col: false, cast: false });
  box(2280, 2330, RY, RY + .3, 801, 828, dark, { col: false, cast: false });                                    // storm drain grate
  for (let x = 2284; x < 2328; x += 6) box(x, x + 2, RY + .3, RY + .5, 803, 826, metal, { col: false, cast: false });
  // ---- the road ----
  box(-330, 3400, RY - 12, RY, 800, 1500, asphalt, { uv: 220, cast: false });
  box(-330, 3400, RY, RY + .15, 1146, 1149, lineY, { col: false, cast: false }); box(-330, 3400, RY, RY + .15, 1151, 1154, lineY, { col: false, cast: false });
  for (let z = 812; z < 1490; z += 58) if (z < 1128 || z > 1172) box(XW0 + 4, XW1 - 4, RY, RY + .18, z, z + 30, lineW, { col: false, cast: false });
  box(STOPX[0] - 6, STOPX[0], RY, RY + .18, 806, 1144, lineW, { col: false, cast: false }); box(STOPX[1], STOPX[1] + 6, RY, RY + .18, 1156, 1494, lineW, { col: false, cast: false });
  // puddles (night only: a dry summer afternoon has none, and by day they read as dark-blue blots)
  if (!DAY) { const pud = new THREE.MeshPhysicalMaterial({ color: 0x07090c, roughness: .03, metalness: .4, clearcoat: 1, transparent: true, opacity: .85 });
  for (const [x, z, r] of [[1840, 860, 40], [2230, 1240, 56], [2520, 1440, 46], [1650, 1060, 34]]) { const m = mesh(new THREE.CircleGeometry(r, 28), pud, x, RY + .2, z, { cast: false }); m.rotation.x = -Math.PI / 2; m.scale.set(1.5, 1, 1); } }
  // refuge island halfway across
  box(1960, 2160, RY, GY, 1128, 1172, kerbM, { uv: 60 });
  cyl(1950, 1150, 10, GY, GY + 70, new THREE.MeshStandardMaterial({ color: 0xf0f0ea, roughness: .5 }), { seg: 20 });
  mesh(new THREE.CylinderGeometry(12, 12, 4, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x60a0ff).multiplyScalar(1.4) }), 1950, GY + 64, 1150, { cast: false }).rotation.z = Math.PI / 2;
  // far pavement, then the park railings and gate
  box(-330, 3400, RY - 10, GY, 1500, 1664, pave, { uv: 128, cast: false });
  box(-330, 3400, GY, GY + .2, 1500, 1509, kerbM, { col: false, cast: false });
  const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(2.2, 120, 2.2), new THREE.MeshStandardMaterial({ color: 0x1c2420, metalness: .6, roughness: .45 }), 300); let bi = 0; const m4 = new THREE.Matrix4();
  for (let x = -320; x < 3400 && bi < 300; x += 14) { if (x > 1990 && x < 2130) continue; m4.makeTranslation(x, GY + 60, 1660); bars.setMatrixAt(bi++, m4); } bars.count = bi; bars.castShadow = true; LV.add(bars);
  for (const [a, b] of [[-330, 1990], [2130, 3400]]) { box(a, b, GY + 112, GY + 116, 1658, 1662, metal, { col: false }); box(a, b, GY + 8, GY + 11, 1658, 1662, metal, { col: false }); cols.push({ t: 'b', x0: a, x1: b, y0: GY, y1: GY + 120, z0: 1657, z1: 1663, slick: true }); }
  for (const x of [1990, 2110]) { box(x, x + 20, GY, GY + 190, 1650, 1670, brick, { uv: 40 }); box(x - 3, x + 23, GY + 190, GY + 196, 1647, 1673, kerbM); mesh(new THREE.SphereGeometry(9, 18, 12), K.bulb, x + 10, GY + 206, 1660, { cast: false }); }
  const sign = mesh(new THREE.PlaneGeometry(150, 47), new THREE.MeshStandardMaterial({ map: signTex(), roughness: .6 }), 2060, GY + 236, 1660, { cast: false }); sign.rotation.y = Math.PI; box(1996, 2004, GY + 196, GY + 260, 1658, 1662, metal, { col: false }); box(2116, 2124, GY + 196, GY + 260, 1658, 1662, metal, { col: false });
  const gateL = new THREE.Group(); gateL.position.set(2010, GY, 1660); gateL.rotation.y = -1.25; LV.add(gateL); const gateR = new THREE.Group(); gateR.position.set(2110, GY, 1660); gateR.rotation.y = 1.25; LV.add(gateR);
  for (const [gg, s] of [[gateL, 1], [gateR, -1]]) { for (let i = 0; i < 7; i++) mesh(new THREE.BoxGeometry(2, 110, 2), metal, s * (5 + i * 7), 58, 0, { parent: gg }); mesh(new THREE.BoxGeometry(50, 3, 3), metal, s * 26, 108, 0, { parent: gg }); mesh(new THREE.BoxGeometry(50, 3, 3), metal, s * 26, 12, 0, { parent: gg }); }
  // (the park itself — its paths, trees and benches — is its own place: e30_park)
  const trunk = new THREE.MeshStandardMaterial({ color: 0x3a2c22, roughness: .95 }), leafM = new THREE.MeshStandardMaterial({ color: DAY ? 0x4f7f3a : 0x2c4a24, roughness: .9, flatShading: true, emissive: DAY ? 0x2a4a1c : 0 });
  // ---- street furniture on our side ----
  // tree in a pit with a grate
  box(2350, 2410, GY - 2, GY - .5, 712, 772, new THREE.MeshStandardMaterial({ map: genSoil(), roughness: 1 }), { col: false, cast: false });
  cyl(2380, 742, 15, GY, GY + 330, trunk, { seg: 14 }); for (let i = 0; i < 5; i++) mesh(new THREE.IcosahedronGeometry(R(80, 110), 1), leafM, 2380 + R(-70, 70), GY + R(300, 420), 742 + R(-60, 60));
  // mailbox (a battery on the top), recycling bins put out for collection
  box(2557, 2563, GY, GY + 96, 702, 708, metal); box(2540, 2580, GY + 96, GY + 128, 692, 718, new THREE.MeshStandardMaterial({ color: 0x2a4a6a, roughness: .5, metalness: .4 }));
  // recycling bins put out for collection: the blue one stands open (that's where the walker tidies a stray toy), the green one is shut
  { const x = 2690, bm = new THREE.MeshStandardMaterial({ color: 0x1f5a9a, roughness: .6 }), W = 2.4;
    box(x, x + 54, GY + 6, GY + 8, 728, 780, bm); box(x, x + 54, GY + 6, GY + 104, 728, 728 + W, bm); box(x, x + 54, GY + 6, GY + 104, 780 - W, 780, bm); box(x, x + W, GY + 6, GY + 104, 728 + W, 780 - W, bm); box(x + 54 - W, x + 54, GY + 6, GY + 104, 728 + W, 780 - W, bm);
    const lid = new THREE.Group(); lid.position.set(x + 27, GY + 104, 728); lid.rotation.x = -1.9; LV.add(lid); mesh(new THREE.BoxGeometry(58, 6, 58), bm, 0, 3, 29, { parent: lid });
    for (const s of [x + 8, x + 46]) { const w = mesh(new THREE.CylinderGeometry(6, 6, 4, 14), ST.mats.tire, s, GY + 6, 782); w.rotation.z = Math.PI / 2; }
    ST.bin = { cx: x + 27, cz: 754, ap: V3(x + 27, 0, 712) }; }
  { const x = 2752, bm = new THREE.MeshStandardMaterial({ color: 0x2e6a32, roughness: .6 }); box(x, x + 54, GY + 6, GY + 104, 728, 780, bm); box(x - 2, x + 56, GY + 104, GY + 110, 726, 784, bm); for (const s of [x + 8, x + 46]) { const w = mesh(new THREE.CylinderGeometry(6, 6, 4, 14), ST.mats.tire, s, GY + 6, 782); w.rotation.z = Math.PI / 2; } }
  // the bins stand on their wheels: the gap underneath counts as solid, so walking into a bin starts a climb instead of strolling under it
  for (const x of [2690, 2752]) { cols.push({ t: 'b', x0: x, x1: x + 54, y0: GY, y1: GY + 6.5, z0: 728, z1: 780 }); box(x + .4, x + 53.6, GY, GY + 6.2, 728.4, 779.6, new THREE.MeshStandardMaterial({ color: 0x1c2024, roughness: .8 }), { col: false }); }   // the moulded base the bin stands on
  // recycling day: a taped-up cardboard box and a tied bundle of newspapers beside the blue bin — steps up to its rim
  { const kraft = new THREE.MeshStandardMaterial({ map: kraftTex(), roughness: .92 }), news = new THREE.MeshStandardMaterial({ map: newsTex(), roughness: .95 }), twine = new THREE.MeshStandardMaterial({ color: 0xb28a58, roughness: 1 }), tape = new THREE.MeshStandardMaterial({ color: 0xc9a66b, roughness: .4 });
    box(2640, 2688, GY, GY + 58, 734, 776, kraft, { uv: 64 }); box(2662.5, 2665.5, GY + 58, GY + 58.3, 734, 776, tape, { col: false }); box(2662.5, 2665.5, GY + 40, GY + 58.3, 733.7, 734, tape, { col: false });
    const flap = new THREE.Group(); flap.position.set(2640, GY + 58, 755); flap.rotation.z = .5; LV.add(flap); mesh(new THREE.BoxGeometry(1, 24, 40), kraft, 0, 12, 0, { parent: flap });
    { const edge = new THREE.MeshStandardMaterial({ map: paperEdgeTex(), roughness: .95 }); box(2602, 2638, GY, GY + 26, 740, 770, [edge, edge, news, edge, edge, edge], { uv: 40 }); }   // page edges on the sides, the front page on top
    for (const x of [2612, 2628]) { box(x - .5, x + .5, GY + 26, GY + 26.4, 740, 770, twine, { col: false }); box(x - .5, x + .5, GY, GY + 26.4, 739.6, 740, twine, { col: false }); }
    box(2602, 2638, GY + 26, GY + 26.4, 754.5, 755.5, twine, { col: false }); }
  // the blue bin is half full: the toy lands on the recycling, and a rescuer can climb back out
  { const x0 = 2692.4, x1 = 2741.6, z0 = 730.4, z1 = 777.6, top = GY + 46; cols.push({ t: 'b', x0, x1, y0: GY + 8, y1: top, z0, z1 });
    const card = new THREE.MeshStandardMaterial({ map: kraftTex(), roughness: .92 }), paper = new THREE.MeshStandardMaterial({ map: newsTex(), roughness: .95 }), bottle = new THREE.MeshPhysicalMaterial({ color: 0x9fd2c8, roughness: .15, transmission: .6, thickness: 2, transparent: true, opacity: .75 });
    const canM = [new THREE.MeshStandardMaterial({ color: 0xb8322e, roughness: .35, metalness: .7 }), new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: .3, metalness: .85 }), new THREE.MeshStandardMaterial({ color: 0x2f6aa8, roughness: .35, metalness: .7 })];
    box(x0, x1, top - 2, top, z0, z1, new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 1 }), { col: false, cast: false });
    for (let i = 0; i < 7; i++) { const m = mesh(new THREE.BoxGeometry(R(14, 24), .6, R(10, 20)), i % 2 ? card : paper, R(x0 + 8, x1 - 8), top + R(.2, 1.4), R(z0 + 8, z1 - 8)); m.rotation.set(R(-.25, .25), R(0, 6.28), R(-.25, .25)); }
    for (let i = 0; i < 4; i++) { const m = mesh(new THREE.CylinderGeometry(2.4, 2.4, 11, 14), bottle, R(x0 + 6, x1 - 6), top + 2.2, R(z0 + 6, z1 - 6)); m.rotation.set(Math.PI / 2, 0, R(0, 6.28)); }
    for (let i = 0; i < 5; i++) { const m = mesh(new THREE.CylinderGeometry(1.7, 1.7, R(3, 6), 14), canM[i % 3], R(x0 + 5, x1 - 5), top + 1.6, R(z0 + 5, z1 - 5)); m.rotation.set(R(-1.6, 1.6), R(0, 6.28), R(-.4, .4)); }
    for (let i = 0; i < 4; i++) mesh(new THREE.IcosahedronGeometry(R(2.5, 4), 0), paper, R(x0 + 5, x1 - 5), top + 2, R(z0 + 5, z1 - 5));
    ST.bin.floor = top; }
  // a fallen-leaf carpet along the pavement and gutter
  { const ls = new THREE.Shape(); ls.moveTo(0, -1.4); ls.quadraticCurveTo(1.1, -.4, 0, 1.6); ls.quadraticCurveTo(-1.1, -.4, 0, -1.4); const leaf = new THREE.ShapeGeometry(ls, 6); leaf.rotateX(-Math.PI / 2); const lm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .85, side: THREE.DoubleSide }); const N = 520; const IM = new THREE.InstancedMesh(leaf, lm, N); const q = new THREE.Quaternion(), e = new THREE.Euler(), s = V3(), t = V3(), col = new THREE.Color();
    for (let i = 0; i < N; i++) { const onRoad = rnd() < .35; t.set(R(1400, 2900), (onRoad ? RY : GY) + .25, onRoad ? R(802, 840) : R(650, 790)); e.set(R(-.2, .2), rnd() * 6.28, R(-.2, .2)); q.setFromEuler(e); const k = R(.7, 1.3); s.set(k, 1, k); m4.compose(t, q, s); IM.setMatrixAt(i, m4); col.setHSL(R(.03, .1), R(.35, .6), R(.12, .26)); IM.setColorAt(i, col); }
    IM.receiveShadow = true; LV.add(IM); }
  // ---- street lamps ----
  const lampHead = DAY ? new THREE.MeshStandardMaterial({ color: 0xd8d4c8, roughness: .3 }) : new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc070).multiplyScalar(2.4) });
  const lamp = (x, z, side) => { cyl(x, z, 7, GY, GY + 600, metal, { seg: 16 }); box(x - 3, x + 3, GY + 596, GY + 602, side > 0 ? z : z - 90, side > 0 ? z + 90 : z, metal, { col: false }); mesh(new THREE.BoxGeometry(26, 8, 40), metal, x, GY + 594, z + side * 86, { cast: false }); mesh(new THREE.BoxGeometry(20, 2, 32), lampHead, x, GY + 589, z + side * 86, { cast: false }); return V3(x, GY + 580, z + side * 86); };
  for (const [x, z, s] of [[1500, 788, 1], [2850, 788, 1], [1850, 1512, -1], [2560, 1512, -1]]) { const p = lamp(x, z, s); const l = pointL(0xffb466, DAY ? 0 : 160000, p.x, p.y, p.z); ST.lights.push({ p, range: 420, I: () => l.intensity }); }
  { const p = lamp(2200, 788, 1); ST.xl = spotL(0xffbf78, DAY ? 0 : 520000, p, V3(2120, RY, 1000), 1.0, .6, 1024, 50, 900); ST.lights.push({ p, dir: V3().subVectors(V3(2120, RY, 1000), p).normalize(), cos: Math.cos(1.0), range: 900, I: () => ST.xl.intensity }); }
  const gl = [pointL(0xffd8a0, DAY ? 0 : 9000, 2000, GY + 206, 1660), pointL(0xffd8a0, DAY ? 0 : 9000, 2120, GY + 206, 1660)]; for (const l of gl) ST.lights.push({ p: l.position.clone(), range: 120, I: () => l.intensity });
  ST.lights.push({ p: V3(445, GY + 230, 300), range: 160, I: () => ST.porch.intensity });
  // ---- crossing signals: near pole (with the button), island pole (lower button), far pole ----
  ST.walkM = new THREE.MeshBasicMaterial({ map: pedTex('walk'), color: 0x222222 }); ST.stopM = new THREE.MeshBasicMaterial({ map: pedTex('stop'), color: 0xffffff });
  ST.carLamp = { r: new THREE.MeshBasicMaterial({ color: 0x3a0808 }), y: new THREE.MeshBasicMaterial({ color: 0x3a2a08 }), g: new THREE.MeshBasicMaterial({ color: 0x08301a }) };
  const pedHead = (x, y, z, face) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = face; LV.add(g); mesh(new THREE.BoxGeometry(30, 40, 16), dark, 0, 0, 0, { parent: g }); const w = mesh(new THREE.PlaneGeometry(24, 16), ST.walkM, 0, 9, 8.2, { parent: g, cast: false }); const s = mesh(new THREE.PlaneGeometry(24, 16), ST.stopM, 0, -9, 8.2, { parent: g, cast: false }); return g; };
  const carHead = (x, y, z, face) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = face; LV.add(g); mesh(new THREE.BoxGeometry(30, 84, 16), dark, 0, 0, 0, { parent: g }); for (const [k, yy] of [['r', 26], ['y', 0], ['g', -26]]) { const d = mesh(new THREE.CircleGeometry(10, 20), ST.carLamp[k], 0, yy, 8.2, { parent: g, cast: false }); mesh(new THREE.CylinderGeometry(12, 12, 6, 20, 1, true, -Math.PI / 2, Math.PI), dark, 0, yy + 4, 10, { parent: g }).rotation.x = Math.PI / 2; } return g; };
  cyl(1960, 780, 6, GY, GY + 560, metal, { seg: 16 }); box(1957, 1963, GY + 540, GY + 546, 780, 975, metal, { col: false }); carHead(1960, GY + 500, 975, -Math.PI / 2);
  pedHead(1960, GY + 260, 788, 0); pedHead(1960, GY + 260, 772, Math.PI);
  box(1953, 1967, GY + 92, GY + 116, 768, 775, new THREE.MeshStandardMaterial({ color: 0xd8c040, roughness: .5 }));     // the push-button box (yellow), facing the pavement
  ST.btnLamp = mesh(new THREE.CircleGeometry(3.6, 20), new THREE.MeshBasicMaterial({ color: 0x40381c }), 1960, GY + 104, 767.9, { cast: false }); ST.btnLamp.rotation.y = Math.PI;
  ST.btnTxt = mesh(new THREE.PlaneGeometry(11, 4), new THREE.MeshBasicMaterial({ color: 0x1a1a1a }), 1960, GY + 112, 767.9, { cast: false }); ST.btnTxt.rotation.y = Math.PI;
  cyl(2060, 1150, 5, GY, GY + 200, metal, { seg: 14 }); pedHead(2060, GY + 170, 1158, 0); pedHead(2060, GY + 170, 1142, Math.PI);
  box(2054, 2066, GY + 48, GY + 66, 1140, 1145, new THREE.MeshStandardMaterial({ color: 0xd8c040, roughness: .5 }));
  ST.islLamp = mesh(new THREE.CircleGeometry(3, 18), new THREE.MeshBasicMaterial({ color: 0x40381c }), 2060, GY + 57, 1139.9, { cast: false }); ST.islLamp.rotation.y = Math.PI;
  cyl(2160, 1520, 6, GY, GY + 560, metal, { seg: 16 }); box(2157, 2163, GY + 540, GY + 546, 1325, 1520, metal, { col: false }); carHead(2160, GY + 500, 1325, Math.PI / 2);
  pedHead(2160, GY + 260, 1512, Math.PI); pedHead(2160, GY + 260, 1528, 0);
  // pickups
  addBattery(2560, GY + 128, 705); addCrumb(2420, GY, 760); addVial(2096, GY, 1600);
  // cars and the walker
  for (let i = 0; i < 6; i++) ST.cars.push(buildRoadCar(i));
  buildWalker();
}

// ---------- traffic ----------
const carGreen = () => ST.phase === 'go' || ST.phase === 'wait';
function setPhase(p) { ST.phase = p; ST.pt = 0; if (p === 'walk') { ST.req = false; if (LEVEL === 'road' && !ST.said.walk) { ST.said.walk = 1; toast('綠色公仔燈亮了——快過！（中間的安全島可以停）', 3.2); } } }
function updSignals(dt) {
  ST.pt += dt; const P = ST.phase, t = ST.pt;
  if (P === 'go') { if (ST.req && t > 4) setPhase('wait'); }
  else if (P === 'wait') { if (t > 1.6) setPhase('amber'); }
  else if (P === 'amber') { if (t > 3) setPhase('red'); }
  else if (P === 'red') { if (t > 1.2) setPhase('walk'); }
  else if (P === 'walk') { if (t > 26) setPhase('flash'); }
  else if (P === 'flash') { if (t > 9) setPhase('clear'); }
  else if (P === 'clear') { if (t > 2) setPhase('go'); }
}
function signalLooks() {
  const P = ST.phase, blink = Math.sin(T * 9) > 0;
  const g = carGreen(), a = P === 'amber', r = !g && !a;
  ST.carLamp.g.color.setHex(g ? 0x40ff9a : 0x08301a); ST.carLamp.y.color.setHex(a ? 0xffb020 : 0x3a2a08); ST.carLamp.r.color.setHex(r ? 0xff3020 : 0x3a0808);
  if (g) ST.carLamp.g.color.multiplyScalar(2); if (a) ST.carLamp.y.color.multiplyScalar(2); if (r) ST.carLamp.r.color.multiplyScalar(2);
  const walk = P === 'walk', stopOn = !walk && (P !== 'flash' || blink);
  ST.walkM.color.setHex(walk ? 0xffffff : 0x1a1a1a); ST.stopM.color.setHex(stopOn ? 0xffffff : 0x1a1a1a);
  const w = ST.req ? (blink ? 0xffd040 : 0xa08020) : 0x40381c; ST.btnLamp.material.color.setHex(w); ST.islLamp.material.color.setHex(w);
}
function pressButton(C) {
  if (ST.req || ST.phase !== 'go' && ST.phase !== 'clear') return;
  ST.req = true; ST.pressed = true; tone(1200, 1200, .06, .08, 'square'); tone(1600, 1600, .06, .06, 'square', .08);
  if (C) toastW(`${C.S.name}按了過路掣！等綠色公仔燈`, 2.8);
  if (NET.client) nsend({ t: 'xbtn' });
}
function updCars(dt) {
  const host = !NET.client;
  if (host) {
    for (let li = 0; li < 2; li++) {
      ST.spawnT[li] -= dt; const lane = LANES[li], sx = lane.dir > 0 ? 300 : 3800;
      if (ST.spawnT[li] <= 0) { const clear = !ST.cars.some(c => c.alive && c.lane === li && Math.abs(c.x - sx) < 700); const free = ST.cars.find(c => !c.alive); if (clear && free) { free.alive = true; free.lane = li; free.x = sx; free.vmax = R(620, 860); free.v = free.vmax; free.gust.clear(); free.g.visible = true; } ST.spawnT[li] = R(3.2, 8.5); }
    }
    for (const c of ST.cars) {
      if (!c.alive) continue; const lane = LANES[c.lane], d = lane.dir, front = c.x + d * CAR_L;
      let want = c.vmax;
      // the car in front
      for (const o of ST.cars) { if (o === c || !o.alive || o.lane !== c.lane) continue; const gap = (o.x - c.x) * d - CAR_L * 2; if (gap > -50 && gap < 900) want = Math.min(want, Math.sqrt(Math.max(0, 2 * 1100 * (gap - 70)))); }
      // the stop line
      const stopX = d > 0 ? STOPX[0] : STOPX[1], toLine = (stopX - front) * d;
      if (!carGreen() && toLine > -4) { if (!(ST.phase === 'amber' && toLine < c.v * .55)) want = Math.min(want, Math.sqrt(Math.max(0, 2 * 1100 * (toLine - 3)))); }
      c.v = c.v < want ? Math.min(want, c.v + 420 * dt) : Math.max(want, c.v - 1500 * dt);
      c.x += d * c.v * dt; if ((d > 0 && c.x > 3900) || (d < 0 && c.x < 200)) { c.alive = false; c.g.visible = false; }
    }
  }
  for (const c of ST.cars) {
    if (!c.alive) { c.g.visible = false; continue; } const lane = LANES[c.lane];
    c.g.visible = true; c.g.position.set(c.x, RY, lane.z); c.g.rotation.y = lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    const spin = c.v * dt / 32; for (const w of c.wheels) w.rotation.x += spin;
  }
}
// a car meets a 5 cm hero: under the wheels = squashed (back to the checkpoint); between them = blown over
function carHits(dt) {
  if (STATE !== 'play') return;
  for (const c of ST.cars) {
    if (!c.alive || c.v < 30) continue; const lane = LANES[c.lane], d = lane.dir;
    for (const C of party) {
      if (!mine(C) || C.frozen || !C.root.visible || C.pos.y > RY + 18) continue; if (!NET.on && C !== leader) continue;
      const lx = (C.pos.x - c.x) * d, lz = (C.pos.z - lane.z) * d; if (Math.abs(lx) > CAR_L + 4 || Math.abs(lz) > CAR_W) continue;
      const underWheel = Math.abs(Math.abs(lx) - 130) < 30 && Math.abs(Math.abs(lz) - 82) < 13;
      if (underWheel) { roadCrush(C); return; }
      if (!c.gust.has(C.id)) { c.gust.add(C.id); knock(C, V3(c.x - d * 300, RY, lane.z), C === leader ? '車在頭頂飛過！' : null); }
    }
  }
}
function roadCrush(C) {
  SND.thud(1); tone(220, 60, .5, .14, 'sawtooth'); nz(.5, 300, .8, .3); cam.shake = 1.4;
  if (NET.on) { const p = CPS[cp] || CPS[0]; C.pos.set(p[0] + IDS.indexOf(C.id) * 3, p[1], p[2]); C.vel.set(0, 0, 0); C.climbing = false; C.mantle = null; C.roost = null; trail = []; C.lastTrail.copy(C.pos); toast('差點被車輪輾到！回到存檔點', 3); return; }
  toast('差點被車輪輾到！回到存檔點——車身底可以過，車輪不可以', 3.6); respawn();
}
function roadSounds(dt) {
  const L = leader; if (!L || LEVEL !== 'road') return;
  for (const c of ST.cars) {
    if (!c.alive) continue; const lane = LANES[c.lane], dz = Math.abs(L.pos.z - lane.z), dx = (L.pos.x - c.x) * lane.dir;
    const k = `${c.id}`; if (dx < 0 && dx > -260 && dz < 700 && c.v > 200 && ST.passT[k] !== c.x) { if (!ST.passT['s' + k]) { ST.passT['s' + k] = 1; const v = clamp(1 - dz / 700, .05, 1); nz(1.1, 420, .7, .35 * v); tone(90, 60, .9, .06 * v, 'sawtooth'); } }
    if (dx > 0 || dx < -400) ST.passT['s' + k] = 0;
    if (c.v > 300 && dx > 0 && dx < 900 && dz < CAR_W && L.pos.y < RY + 18 && carGreen() && T - ST.hornT > 4) { ST.hornT = T; tone(392, 392, .4, .07, 'square'); tone(494, 494, .4, .05, 'square'); }
  }
  // the crossing's ticking while the green man is on
  if (ST.phase === 'walk' || ST.phase === 'flash') { ST.beepT -= dt; if (ST.beepT <= 0) { ST.beepT = ST.phase === 'walk' ? .5 : .25; const near = Math.hypot(L.pos.x - 2060, L.pos.z - 1150) < 700; if (near) tone(2400, 2400, .03, .03, 'square'); } }
}
function updRoadWorld(dt) {
  ST.near = !!(ZONES.road && ZONES.road.near);
  if (ST.sky) ST.sky.visible = ST.near || !!(ZONES.yard && ZONES.yard.near) || !!(ZONES.park && ZONES.park.near);
  if (!ST.near && !NET.on) return;
  if (!NET.client) updSignals(dt);
  updCars(dt); signalLooks(); carHits(dt); roadSounds(dt);
  // pressing the button: any hero's head up at the button box (near pole), or at the island's lower button
  if (STATE === 'play' && !ST.req && (ST.phase === 'go' || ST.phase === 'clear')) {
    for (const C of party) { if (C.frozen || !C.root.visible) continue; const top = C.pos.y + C.h;
      if ((Math.hypot(C.pos.x - 1960, C.pos.z - 774) < 16 && top > GY + 90 && C.pos.y < GY + 120) || (Math.hypot(C.pos.x - 2060, C.pos.z - 1144) < 14 && top > GY + 44 && C.pos.y < GY + 70)) { if (mine(C) || !NET.on) { pressButton(C); break; } } }
  }
}
function crossLeft() { return ST.phase === 'walk' ? 26 - ST.pt + 9 : ST.phase === 'flash' ? 9 - ST.pt : 0; }

// ---------- single player: quests ----------
const RQ_SP = [
  { t: '去斑馬線，爬上燈柱按「過路」掣', s: '黃色的掣在燈柱半腰。被車輪輾到會回到存檔點——車身底下反而沒事' },
  { t: '等綠色公仔燈，過馬路', s: '車會停下來。走不完就在中間的安全島等，島上的柱也有掣' },
  { t: '去對面的公園門口', s: '公園的鐵閘開着。小心路邊遛狗的人' }
];
const YQ_SP2 = [{ t: '從前園的閘底鑽出去', s: '陳伯的前閘下面有條縫，鑽過去就是馬路。小心他的狗' }];
LEVELS.road = {
  chapter: '第五章', title: '馬路', mpChapter: '第四章（多人）', env: 'road', envI: DAY ? 1 : .55, fog: DAY ? [0xbcd0e2, .00014] : [0x0d1420, .00036], expo: DAY ? .95 : 1.35, bloom: DAY ? [.3, 2.4] : null,
  dust: { N: 900, box: [1400, 2900, GY, 400, 660, 1640], beamFrac: .0, door: false },
  toys: true, npcNear: true, build: buildRoad,
  cps: [[2620, GY, 690], [1940, GY, 740], [2060, GY, 1150], [2060, GY, 1580]],
  quests: RQ_SP,
  spawn() { if (!NET.on) { crewJoin('bat', true); crewJoin('tort', true); } spawnSP(this.cps[0], 0 + Math.PI, 5); if (!GS.latch) GS.latch = true; if (!LIV.ventOpen) { LIV.ventOpen = true; LIV.ventCol.y0 = -999; LIV.ventCol.y1 = -998; } YS.chip = true; if (YS.chipM) { YS.chipM.visible = false; YS.chipHalo.visible = false; } },
  enter(prev, again) { if (!again && !NET.on && prev === 'yard' && STATE === 'play') unlockKey('ch4'); if (again || NET.on) return; setTimeout(() => say('爸爸', '公園在馬路對面。車太快了……要等行人燈。', '#f5f0e6', 3.6), 1400); },
  npc(dt) { if (STATE === 'play' || STATE === 'fail' || STATE === 'frozen' || STATE === 'end') updWalker(dt); },
  detect: detectRoad, hear: roadHear, seen: roadSeen,
  update(dt) {
    lvT += dt; if (NET.on) return; const L = leader;
    if (quest === 0 && ST.pressed) setQuest(1);
    if (quest <= 1 && L.pos.z > 1505 && L.pos.y > GY - 2) setQuest(2);
    if (quest === 2 && L.pos.z > 1640 && L.pos.x > 1995 && L.pos.x < 2125) roadWin();
  },
  win() { },
  marker() { if (NET.on) return mpMarker(); if (quest === 0) return V3(1960, GY + 118, 770); if (quest === 1) return leader.pos.z < 1130 ? V3(2060, GY + 4, 1150) : V3(2060, GY + 4, 1560); return ST.parkP; },
  reset() { if (ST.walker) { ST.walker.mode = 'walk'; ST.walker.t = R(4, 8); } if (ST.wdog) ST.wdog.mode = 'walk'; },
  eyeText: () => meter > .3 ? '被看見了！' : '遛狗的人',
  hint(L) {
    const left = crossLeft(); if (left > 0 && L.pos.z > 780 && L.pos.z < 1520) return ST.phase === 'walk' ? `綠燈：還有 ${Math.ceil(left)} 秒` : `燈快轉了！還有 ${Math.ceil(left)} 秒`;
    if (ST.req && carGreen()) return '已經按了掣——等綠色公仔燈';
    if (L.pos.y < RY + 18 && L.pos.z > 800 && L.pos.z < 1500 && carGreen()) return '小心車！車輪會輾人';
    return '';
  },
  onSwitch() { }
};
// across: the park carries straight on (no end screen — the world is one place)
function roadWin() {
  if (STATE !== 'play' || ST.won) return; ST.won = true; unlockKey('ch5');
  say('爸爸', '到了……公園。晶片要在陽光底下才會充電——', '#f5f0e6', 3.6);
  QUESTS = [{ t: '走進公園', s: '楓林公園的鐵閘開着' }]; setQuest(0);
}

// ---- printed things for recycling day ----
let _kraft = null, _news = null, _edge = null;
function paperEdgeTex() {
  if (_edge) return _edge; const [c, x] = cnv(256, 256); x.fillStyle = '#ddd6c6'; x.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += R(1.6, 3.2)) { const k = R(.75, 1.05), ins = rnd() < .035; x.fillStyle = ins ? `hsla(${R(0, 360)},45%,62%,.8)` : `rgba(${238 * k | 0},${230 * k | 0},${212 * k | 0},1)`; x.fillRect(0, y, 256, R(1, 2.4)); x.fillStyle = 'rgba(60,50,40,.18)'; x.fillRect(0, y, 256, .6); }
  for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(R(0, 256), 0, R(1, 4), 256); }
  return (_edge = tex(c));
}
function kraftTex() {
  if (_kraft) return _kraft; const [c, x] = cnv(256, 256); x.fillStyle = '#a77d4f'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${rnd() < .5 ? '70,45,20' : '220,190,140'},${R(.03, .09)})`; x.fillRect(R(0, 256), R(0, 256), R(1, 3), R(1, 3)); }
  for (let y = 0; y < 256; y += 4) { x.fillStyle = 'rgba(60,40,20,.05)'; x.fillRect(0, y, 256, 1); }
  x.strokeStyle = 'rgba(40,28,16,.55)'; x.lineWidth = 3; x.strokeRect(78, 92, 100, 56); x.fillStyle = 'rgba(40,28,16,.6)'; x.font = '700 26px "Noto Sans TC", sans-serif'; x.textAlign = 'center'; x.fillText('小心輕放', 128, 130);
  return (_kraft = tex(c));
}
function newsTex() {
  if (_news) return _news; const [c, x] = cnv(256, 256); x.fillStyle = '#e8e2d4'; x.fillRect(0, 0, 256, 256);
  for (let col = 0; col < 4; col++) for (let y = 8; y < 250; y += 7) { const w = R(30, 56); x.fillStyle = `rgba(40,40,40,${R(.25, .45)})`; x.fillRect(8 + col * 62, y, w, 2.2); if (rnd() < .06) { x.fillStyle = 'rgba(30,30,30,.55)'; x.fillRect(8 + col * 62, y, 56, 5); y += 4; } }
  x.fillStyle = 'rgba(120,110,90,.25)'; x.fillRect(132, 40, 56, 44);
  return (_news = tex(c));
}
