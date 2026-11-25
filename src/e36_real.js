
// =====================================================================
//  超寫實版 · REAL (real.html) — the same game, pushed as close to real as a browser allows.
//  • A lawn of real blades: hundreds of thousands of 3D grass blades drawn by the GPU in rings
//    round the camera (dense close up, clumps further out), swaying in gusts and pushed aside by
//    anyone walking through — to a 5 cm crew every blade is a tree ("Nanite Foliage" in spirit).
//  • Trees with branches and tens of thousands of leaf sprays that move in the wind; leafy hedges.
//  • The ground at their scale: fallen leaves, pebbles, clover, dandelions, twigs.
//  • A crisp sun: its own shadow map round the camera, so every blade and character casts a sharp
//    shadow; a macro lens (shallow focus) and stronger ambient occlusion.
//  Same rules, same levels, same online play — only the look changes.
// =====================================================================
const REAL = !!window.__REAL;
const REALT = [], REALH = [], REALHIDE = [];   // trees (trunk + crown blobs), hedges, stylised leaf materials to hide
{ const gr = document.getElementById('goReal'); if (gr) { gr.textContent = REAL ? '返回普通版' : '超寫實版 ✦'; gr.title = REAL ? '回到普通畫面' : '草、樹、光影全部寫實化（要較強嘅電腦）'; gr.onclick = () => { location.href = REAL ? 'index.html' : 'real.html'; }; } }
const RL = { on: false, t: 0, grass: [], leafU: null, sun: null, U: null, mask: null, MB: null, acts: [], suns: [] };

// ---------- the grass mask: where real lawn grows (the mole's "soft ground" minus beds and stepping stones) ----------
function realMask() {
  const x0 = -400, x1 = 3600, z0 = -480, z1 = 3800, res = 8, W = Math.ceil((x1 - x0) / res), H = Math.ceil((z1 - z0) / res);
  const a = new Float32Array(W * H), p = V3();
  const holes = [[1490, 105, 17], [1540, 112, 17], [1590, 100, 17], [1640, 118, 17], [1700, 108, 17], [1760, 96, 17], [1830, 110, 17], [1900, 122, 17], [1960, 112, 17], [2030, 104, 17], [2080, 110, 17], [1820, 0, 9]];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const x = x0 + (i + .5) * res, z = z0 + (j + .5) * res; p.set(x, GY, z);
    let v = softAt(p) ? 1 : 0;
    if (v && x > 1880 && x < 2240 && z > 2350 && z < 2420) v = 0;   // the park's flower bed
    if (v) for (const h of holes) if (Math.hypot(x - h[0], z - h[1]) < h[2]) { v = 0; break; }
    a[j * W + i] = v;
  }
  // soften the edges a little (two box-blur passes)
  const b = new Float32Array(W * H);
  for (let pass = 0; pass < 2; pass++) { const src = pass ? b : a, dst = pass ? a : b; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let s = 0, n = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= W || jj >= H) continue; s += src[jj * W + ii]; n++; } dst[j * W + i] = s / n; } }
  const u8 = new Uint8Array(W * H); for (let k = 0; k < W * H; k++) u8[k] = Math.round(a[k] * 255);
  const tex = new THREE.DataTexture(u8, W, H, THREE.RedFormat, THREE.UnsignedByteType); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  RL.mask = { a, W, H, x0, z0, res }; RL.MB = new THREE.Vector4(x0, z0, 1 / (W * res), 1 / (H * res));
  return tex;
}
function realMaskAt(x, z) { const M = RL.mask; const i = Math.floor((x - M.x0) / M.res), j = Math.floor((z - M.z0) / M.res); if (i < 0 || j < 0 || i >= M.W || j >= M.H) return 0; return M.a[j * M.W + i]; }

// ---------- grass ----------
const GRASS_GLSL = `
uniform float uT, uS, uN, uH, uW; uniform vec4 uO; uniform vec4 uC; uniform vec2 uOut;
uniform sampler2D uMask; uniform vec4 uMB; uniform vec4 uAct[16]; uniform vec3 uCam, uFoc;
attribute vec3 bl;
varying vec3 vGC; varying float vGH;
float gh(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float gn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(gh(i), gh(i + vec2(1., 0.)), f.x), mix(gh(i + vec2(0., 1.)), gh(i + vec2(1., 1.)), f.x), f.y); }
void blade(out vec3 P, out vec3 Nn) {
  float id = float(gl_InstanceID), bi = bl.z;
  vec2 cell = floor(uO.xy / uS) + vec2(mod(id, uN), floor(id / uN)) - floor(uN * .5);
  vec2 wp = (cell + vec2(gh(cell + bi * 3.17), gh(cell + 11.3 + bi * 7.21))) * uS;
  float d = length(wp - uC.xy);
  float k = smoothstep(uC.z, uC.w, d) * (1. - smoothstep(uOut.x, uOut.y, d));
  float m = texture2D(uMask, (wp - uMB.xy) * uMB.zw).r;
  float pt = gn(wp * .012) * .65 + gn(wp * .05) * .35;
  m = smoothstep(.35, .65, m + (pt - .5) * .3);
  float dc = length(wp - uCam.xz); float low = step(uCam.y, uO.z + 24.); k *= m * mix(1., smoothstep(2.5, 9., dc), low);
  // keep the line of sight to the one you're playing clear: blades between the camera and them lie low
  vec2 sa = uCam.xz, sb = uFoc.xz, sd = sb - sa; float st = clamp(dot(wp - sa, sd) / max(dot(sd, sd), 1.), 0., 1.);
  float clr = (1. - smoothstep(1.6, 5., length(wp - sa - sd * st))) * smoothstep(.02, .15, st) * (1. - smoothstep(.78, .93, st));
  k *= 1. - .82 * clr * low;
  float hgt = uH * (.55 + .8 * gh(cell + 3.1 + bi)) * (.7 + .6 * pt), wid = uW * (.75 + .5 * gh(cell + 5.7 + bi));
  float yaw = gh(cell + 9.2 + bi * 1.7) * 6.2832; vec2 ac = vec2(cos(yaw), sin(yaw));
  float la = .12 + .38 * gh(cell + 4.4 + bi), ly = gh(cell + 8.8 + bi) * 6.2832;
  vec2 B = vec2(cos(ly), sin(ly)) * la;
  float w = sin(uT * 1.4 + wp.x * .018 + wp.y * .011) * .55 + sin(uT * 3.1 + wp.x * .07 - wp.y * .05) * .2 + gn(wp * .004 + uT * .15) * .7;
  B += vec2(.944, .33) * w * .38;
  for (int i = 0; i < 16; i++) { vec4 a = uAct[i]; if (a.w <= 0.) continue; vec2 dv = wp - a.xz; float dd = length(dv); float Rr = a.w * 2.4; if (dd < Rr && abs(a.y - uO.z) < hgt + 6.) B += dv / max(dd, .01) * (1. - dd / Rr) * 1.7; }
  float bm = min(length(B), 1.45); vec2 bd = B / max(length(B), 1e-4);
  float h = bl.y, s = bl.x, Hh = hgt * k, wd = wid * (1. - h * .88) * k;
  vec2 off = bd * Hh * sin(bm * h * .9) * h * .95;
  float up = Hh * h * (1. - .3 * bm * bm * h);
  P = vec3(wp.x + ac.x * s * wd * .5 + off.x, uO.z + up, wp.y + ac.y * s * wd * .5 + off.y);
  vec3 tW = vec3(ac.x, 0., ac.y), tH = normalize(vec3(bd.x * bm * h, 1., bd.y * bm * h));
  Nn = normalize(cross(tW, tH) + vec3(0., .5, 0.));
  float dry = step(.93, gh(cell + 21.7 + bi));
  vec3 tip = mix(vec3(.27, .43, .11), vec3(.55, .50, .24), dry) * (.78 + .44 * gh(cell + 2.2 + bi));
  tip = mix(tip, tip * vec3(1.12, 1.04, .78), pt * .6);
  vGC = mix(vec3(.05, .1, .03), tip, smoothstep(0., .85, h)) * (.5 + .5 * h);
  vGH = h;
}`;
// one instance = `blades` blades of `seg` segments; bl = (side −1..1, height 0..1, blade index)
function realBladeGeo(blades, seg) {
  const bl = [], idx = []; let v = 0;
  for (let b = 0; b < blades; b++) {
    for (let i = 0; i < seg; i++) { const h = i / seg; bl.push(-1, h, b, 1, h, b); }
    bl.push(0, 1, b);
    for (let i = 0; i < seg - 1; i++) { const a = v + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const t = v + (seg - 1) * 2; idx.push(t, t + 1, t + 2);
    v += seg * 2 + 1;
  }
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(v * 3), 3)); g.setAttribute('bl', new THREE.Float32BufferAttribute(bl, 3)); g.setIndex(idx); return g;
}
function realGrassLevel(o, maskTex) {
  const U = { uT: RL.U.uT, uS: { value: o.S }, uN: { value: o.N }, uH: { value: o.H }, uW: { value: o.W }, uO: { value: new THREE.Vector4(0, 0, GY, 0) }, uC: { value: new THREE.Vector4(0, 0, o.in[0], o.in[1]) }, uOut: { value: new THREE.Vector2(o.out[0], o.out[1]) },
    uMask: { value: maskTex }, uMB: { value: RL.MB }, uAct: RL.U.uAct, uCam: RL.U.uCam, uFoc: RL.U.uFoc };
  const geo = realBladeGeo(o.blades, o.seg); geo.instanceCount = o.N * o.N;
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .62, side: THREE.DoubleSide });
  mat.onBeforeCompile = s => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\n' + GRASS_GLSL)
      .replace('#include <beginnormal_vertex>', 'vec3 gP, gN; blade(gP, gN); vec3 objectNormal = gN;')
      .replace('#include <begin_vertex>', 'vec3 transformed = gP;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vGC; varying float vGH;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= vGC;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vGC * .16 * vGH;');
  };
  mat.customProgramCacheKey = () => 'realgrass';
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.receiveShadow = true; m.castShadow = !!o.cast;
  if (o.cast) { const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }); dm.onBeforeCompile = s => { Object.assign(s.uniforms, U); s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\n' + GRASS_GLSL).replace('#include <begin_vertex>', 'vec3 gP, gN; blade(gP, gN); vec3 transformed = gP;'); }; dm.customProgramCacheKey = () => 'realgrassD'; m.customDepthMaterial = dm; }
  scene.add(m); return { m, U, o };
}

// things go into their zone's group, so they're only drawn when that place is near
function realZoneOf(x, z) { const Z = zoneAt(V3(x, GY + 1, z), 2); return Z ? Z.lv : scene; }
function realByZone(items, xz, fn) { const M = new Map(); for (const it of items) { const [x, z] = xz(it); const g = realZoneOf(x, z); if (!M.has(g)) M.set(g, []); M.get(g).push(it); } for (const [g, list] of M) fn(g, list); }

// ---------- leaves ----------
function realLeafTex(kind) {
  const N = 256, [c, x] = cnv(N, N); x.clearRect(0, 0, N, N);
  const leaf = (px, py, len, wid, ang, col) => {
    x.save(); x.translate(px, py); x.rotate(ang);
    const g = x.createLinearGradient(0, 0, 0, -len); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]); x.fillStyle = g;
    x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(wid, -len * .25, wid * .9, -len * .75, 0, -len); x.bezierCurveTo(-wid * .9, -len * .75, -wid, -len * .25, 0, 0); x.fill();
    x.strokeStyle = 'rgba(220,240,180,.35)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -len * .96); x.stroke();
    x.strokeStyle = 'rgba(30,50,20,.25)'; x.lineWidth = .8; for (let i = 1; i < 6; i++) { const t = i / 6; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(0, -len * t * .9); x.lineTo(s * wid * .7 * Math.sin(t * Math.PI), -len * (t * .9 + .12)); x.stroke(); } }
    x.restore();
  };
  if (kind === 'spray') {
    x.strokeStyle = '#4a3a26'; x.lineWidth = 4; x.lineCap = 'round'; x.beginPath(); x.moveTo(128, 254); x.quadraticCurveTo(122, 150, 138, 40); x.stroke();
    const cols = [['#a8c48a', '#e2eec8'], ['#b4cc94', '#eef4d8'], ['#9cb880', '#d6e6bc'], ['#b0c890', '#e8f0cc']];   // pale: each spray is tinted per instance
    const L = [[126, 210, -1.1], [130, 182, .95], [128, 150, -1.0], [132, 122, 1.05], [133, 92, -.9], [136, 66, .85], [138, 44, -.1]];
    for (let i = 0; i < L.length; i++) { const [px, py, a] = L[i]; leaf(px, py, R(62, 80), R(19, 25), a + R(-.15, .15), cols[i % 4]); }
  } else leaf(128, 250, 236, 84, 0, ['#cdbb96', '#f2e6c8']);   // one pale fallen leaf, tinted per instance
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function realLeafMat(map, U) {
  const mat = new THREE.MeshStandardMaterial({ map, alphaTest: .42, side: THREE.DoubleSide, roughness: .62 });
  const wind = `vec3 ipW = (instanceMatrix * vec4(0., 0., 0., 1.)).xyz; float fl = sin(uT * 2.3 + ipW.x * .031 + ipW.z * .027) * .6 + sin(uT * 4.7 + ipW.y * .09) * .25;
    transformed.x += fl * 1.4 * uv.y; transformed.z += cos(uT * 1.9 + ipW.z * .02) * .9 * uv.y;`;
  mat.onBeforeCompile = s => { Object.assign(s.uniforms, U); s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' + wind);
    s.fragmentShader = s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * .12;'); };
  mat.customProgramCacheKey = () => 'realleaf';
  const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: .42 });
  dm.onBeforeCompile = s => { Object.assign(s.uniforms, U); s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' + wind); };
  dm.customProgramCacheKey = () => 'realleafD';
  return { mat, dm };
}
// a tapered branch between two points
function realLimb(a, b, r0, r1, seg = 8) { const d = V3().subVectors(b, a), L = d.length(); const g = new THREE.CylinderGeometry(r1, r0, L, seg, 1); g.translate(0, L / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.normalize())); g.translate(a.x, a.y, a.z); return g; }
function realTrees() {
  const spray = realLeafTex('spray'); const LM = realLeafMat(spray, { uT: RL.U.uT });
  const bark = new THREE.MeshStandardMaterial({ ...genWood([92, 74, 58], [46, 36, 28], 771), roughness: 1 });
  const all = [];
  for (const T of REALT) {
    // branches: from the trunk's top into every crown blob, then twigs out to the crown's edge
    const geos = []; const top = V3(T.x, T.top, T.z);
    for (const [bx, by, bz, r] of T.bl) {
      const c = V3(bx, by, bz); const s0 = V3(T.x + R(-.3, .3) * T.r, T.top - R(10, 50), T.z + R(-.3, .3) * T.r);
      geos.push(realLimb(s0, c, T.r * .42, T.r * .16));
      for (let i = 0; i < 5; i++) { const d = V3(R(-1, 1), R(-.3, 1), R(-1, 1)).normalize(); const e = c.clone().addScaledVector(d, r * R(.55, .85)); geos.push(realLimb(c.clone().addScaledVector(d, -r * .1), e, T.r * .14, T.r * .03, 6)); }
    }
    if (!T.keepTrunk) geos.push(realLimb(V3(T.x, T.top - 40, T.z), top.clone().add(V3(0, 30, 0)), T.r * .8, T.r * .5, 12));
    const bm = new THREE.Mesh(mergeGeometries(geos), bark); bm.castShadow = bm.receiveShadow = true; realZoneOf(T.x, T.z).add(bm);
    // leaf sprays: mostly near the surface of each blob, pointing outward
    for (const [bx, by, bz, r] of T.bl) { const n = Math.round(r * r * .075); for (let i = 0; i < n; i++) { const d = V3(R(-1, 1), R(-1, 1), R(-1, 1)); if (d.lengthSq() > 1 || d.lengthSq() < .01) { i--; continue; } d.normalize(); const rr = r * (.42 + .58 * Math.cbrt(rnd())); all.push({ p: V3(bx + d.x * rr, by + d.y * rr * .86, bz + d.z * rr), d, f: rr / r }); } }
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), s = V3(), col = new THREE.Color(); const sprayG = new THREE.PlaneGeometry(30, 30).translate(0, 15, 0);
  RL.leaves = [];
  realByZone(all, L => [L.p.x, L.p.z], (grp, list) => {
    const IM = new THREE.InstancedMesh(sprayG, LM.mat, list.length); IM.customDepthMaterial = LM.dm; IM.castShadow = IM.receiveShadow = true;
    list.forEach((L, i) => {
      const up = L.d.clone().add(V3(R(-.5, .5), R(-.1, .6), R(-.5, .5))).normalize(); q.setFromUnitVectors(V3(0, 1, 0), up); q2.setFromAxisAngle(up, R(0, 6.283)); q.premultiply(q2);
      const k = R(.75, 1.2); m4.compose(L.p, q, s.set(k, k, k)); IM.setMatrixAt(i, m4);
      const ao = (.45 + .55 * L.f) * (.7 + .3 * Math.max(0, L.d.y)); col.setHSL(R(.2, .28), R(.45, .62), R(.3, .42) * ao); IM.setColorAt(i, col);
    });
    grp.add(IM); RL.leaves.push(IM);
  });
  // leafy hedges: sprays over the boxes' sides and tops
  const hs = []; for (const [x0, x1, y0, y1, z0, z1] of REALH) { const A = (x1 - x0) * (y1 - y0) * 2 + (z1 - z0) * (y1 - y0) * 2 + (x1 - x0) * (z1 - z0); const n = Math.round(A / 55);
    for (let i = 0; i < n; i++) { const f = rnd() * A; let p, d; const a1 = (x1 - x0) * (y1 - y0), a2 = (z1 - z0) * (y1 - y0);
      if (f < a1 * 2) { const sd = f < a1 ? -1 : 1; p = V3(R(x0, x1), R(y0, y1), sd < 0 ? z0 : z1); d = V3(0, 0, sd); }
      else if (f < a1 * 2 + a2 * 2) { const sd = f < a1 * 2 + a2 ? -1 : 1; p = V3(sd < 0 ? x0 : x1, R(y0, y1), R(z0, z1)); d = V3(sd, 0, 0); }
      else { p = V3(R(x0, x1), y1, R(z0, z1)); d = V3(0, 1, 0); }
      hs.push({ p: p.addScaledVector(d, R(-4, 2)), d }); } }
  const hg = new THREE.PlaneGeometry(26, 26).translate(0, 13, 0);
  realByZone(hs, L => [L.p.x, L.p.z], (grp, hl) => { const HM = new THREE.InstancedMesh(hg, LM.mat, hl.length); HM.customDepthMaterial = LM.dm; HM.castShadow = HM.receiveShadow = true;
    hl.forEach((L, i) => { const up = L.d.clone().add(V3(R(-.7, .7), R(-.2, .8), R(-.7, .7))).normalize(); q.setFromUnitVectors(V3(0, 1, 0), up); q2.setFromAxisAngle(up, R(0, 6.283)); q.premultiply(q2); m4.compose(L.p, q, s.setScalar(R(.7, 1))); HM.setMatrixAt(i, m4); col.setHSL(R(.24, .3), R(.45, .6), R(.22, .32)); HM.setColorAt(i, col); });
    grp.add(HM); });
  for (const m of REALHIDE) m.visible = false;
}

// ---------- the ground at a 5 cm scale: fallen leaves, pebbles, clover, dandelions, twigs ----------
// one instanced mesh per zone; set(IM, i, item) places each
function realInst(geo, mat, items, xz, set, cast = true) { realByZone(items, xz, (grp, list) => { const IM = new THREE.InstancedMesh(geo, mat, list.length); IM.castShadow = cast; IM.receiveShadow = true; list.forEach((it, i) => set(IM, i, it)); grp.add(IM); }); }
function realScatter() {
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = V3(), t = V3(), col = new THREE.Color();
  const lawn = (n, fn, tries = 8) => { const out = []; for (let i = 0; i < n; i++) for (let k = 0; k < tries; k++) { const x = R(-400, 3600), z = R(-480, 3800); if (realMaskAt(x, z) > .7) { out.push(fn(x, z)); break; } } return out; };
  const XZ = it => [it[0], it[1]];
  // fallen leaves under every tree
  { const tex = realLeafTex('fallen'); const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: .45, side: THREE.DoubleSide, roughness: .8 });
    const geo = new THREE.PlaneGeometry(6, 6, 3, 3); { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, x * x * .08); } geo.computeVertexNormals(); }
    const tints = [[.55, .34, .16], [.78, .6, .24], [.5, .52, .2], [.34, .46, .16], [.42, .28, .14]];
    const L = []; for (const T of REALT) for (let i = 0; i < 260; i++) { const a = R(0, 6.283), d = Math.sqrt(rnd()) * 190; L.push([T.x + Math.cos(a) * d, T.z + Math.sin(a) * d, R(-.25, .25), R(0, 6.283), R(-.2, .2), R(.6, 1.15), rnd(), R(.8, 1.1), rnd()]); }
    realInst(geo, mat, L, XZ, (IM, i, [x, z, rx, ry, rz, sc, h, v, ti]) => { e.set(-Math.PI / 2 + rx, ry, rz); q.setFromEuler(e); m4.compose(t.set(x, GY + .25 + h * .3, z), q, s.set(sc, sc, sc)); IM.setMatrixAt(i, m4); const c = tints[Math.floor(ti * tints.length)]; col.setRGB(c[0] * v, c[1] * v, c[2] * v); IM.setColorAt(i, col); }); }
  // pebbles (lawn and paths)
  { const geo = new THREE.DodecahedronGeometry(1, 0); { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const v = V3(p.getX(i), p.getY(i), p.getZ(i)); v.multiplyScalar(.85 + hashI(i * 7 + 3) * .3); p.setXYZ(i, v.x, v.y, v.z); } geo.computeVertexNormals(); }
    const mat = new THREE.MeshStandardMaterial({ roughness: .85 }); const P = [];
    for (let i = 0; i < 9000; i++) { let x, z; for (let k = 0; k < 8; k++) { x = R(-400, 3600); z = R(-480, 3800); const Z = zoneAt(V3(x, GY + 1, z), 2); if (Z && (Z.id === 'yard' || Z.id === 'road' || Z.id === 'park')) break; } P.push([x, z, R(.25, 1.3) * (rnd() < .1 ? 2 : 1), R(0, 6), R(0, 6), R(0, 6), R(.45, .75), R(.7, 1), R(.06, .1), R(.05, .15), R(.32, .58)]); }
    realInst(geo, mat, P, XZ, (IM, i, [x, z, r, a, b, c, sy, sz, hh, ss, ll]) => { e.set(a, b, c); q.setFromEuler(e); m4.compose(t.set(x, GY + r * .25, z), q, s.set(r, r * sy, r * sz)); IM.setMatrixAt(i, m4); col.setHSL(hh, ss, ll); IM.setColorAt(i, col); }, false); }
  // clover: three heart-shaped leaflets on a stem
  { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(.5, .22, .85, .72, .55, 1.04); sh.bezierCurveTo(.34, 1.2, .1, 1.06, 0, .88); sh.bezierCurveTo(-.1, 1.06, -.34, 1.2, -.55, 1.04); sh.bezierCurveTo(-.85, .72, -.5, .22, 0, 0);
    const parts = []; for (let k = 0; k < 3; k++) { const g = new THREE.ShapeGeometry(sh, 6); g.scale(.75, .75, .75); g.rotateX(-Math.PI / 2 + .38); g.rotateY(k / 3 * Math.PI * 2); g.translate(0, 2.4, 0); parts.push(g); }
    const st = new THREE.CylinderGeometry(.06, .09, 2.4, 4); st.translate(0, 1.2, 0); parts.push(st);
    const geo = mergeGeometries(parts); const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .55, side: THREE.DoubleSide });
    const P = []; lawn(900, (x, z) => [x, z]).forEach(([x, z]) => { for (let i = 0; i < 9; i++) P.push([x + R(-9, 9), z + R(-9, 9), R(-.15, .15), R(0, 6.283), R(-.15, .15), R(.6, 1.1), R(.8, 1.3), R(.24, .3), R(.35, .5), R(.32, .44)]); });
    realInst(geo, mat, P, XZ, (IM, i, [x, z, a, b, c, sc, sy, hh, ss, ll]) => { e.set(a, b, c); q.setFromEuler(e); m4.compose(t.set(x, GY, z), q, s.set(sc, sc * sy, sc)); IM.setMatrixAt(i, m4); col.setHSL(hh, ss, ll); IM.setColorAt(i, col); }, false); }
  // dandelions: a stem, a yellow head
  { const stem = new THREE.CylinderGeometry(.12, .15, 1, 5); stem.translate(0, .5, 0); const sm = new THREE.MeshStandardMaterial({ color: 0x5a7a2a, roughness: .7 });
    const head = new THREE.SphereGeometry(1.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.2); head.scale(1, .55, 1); const hm = new THREE.MeshStandardMaterial({ color: 0xf2c418, roughness: .55, emissive: 0x3a2a00 });
    const P = lawn(420, (x, z) => [x, z, R(4, 9), R(-.12, .12), R(-.12, .12), R(.8, 1.2)]);
    realInst(stem, sm, P, XZ, (IM, i, [x, z, h, a, c]) => { e.set(a, 0, c); q.setFromEuler(e); m4.compose(t.set(x, GY, z), q, s.set(1, h, 1)); IM.setMatrixAt(i, m4); });
    realInst(head, hm, P, XZ, (IM, i, [x, z, h, a, c, k]) => { e.set(a, 0, c); q.setFromEuler(e); const tip = V3(0, h, 0).applyQuaternion(q); m4.compose(t.set(x + tip.x, GY + tip.y, z + tip.z), q, s.setScalar(k)); IM.setMatrixAt(i, m4); }); }
  // twigs
  { const geo = new THREE.CylinderGeometry(.18, .26, 1, 5); geo.rotateZ(Math.PI / 2); const mat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: .95 }); const P = [];
    for (const T of REALT) for (let i = 0; i < 70; i++) { const a = R(0, 6.283), d = Math.sqrt(rnd()) * 210; P.push([T.x + Math.cos(a) * d, T.z + Math.sin(a) * d, R(0, 6.283), R(-.08, .08), R(4, 14), R(.7, 1.4), R(.7, 1.4)]); }
    realInst(geo, mat, P, XZ, (IM, i, [x, z, ry, rz, L, a, b]) => { e.set(0, ry, rz); q.setFromEuler(e); m4.compose(t.set(x, GY + .25, z), q, s.set(L, a, b)); IM.setMatrixAt(i, m4); }); }
}

// ---------- tall wild grass (the hiding clumps): long curved blades with seed heads, moving in the wind ----------
function realClumps(list) {
  const seed0 = SEED; SEED = 555013 + list.length;
  const seg = 7, g = new THREE.BufferGeometry(), pos = [], col = [], idx = [];
  for (let i = 0; i <= seg; i++) { const h = i / seg, w = .55 * (1 - h * .92); pos.push(-w, h, h * h * .32, w, h, h * h * .32); const c = .32 + .68 * h; col.push(c, c, c, c, c, c); if (i < seg) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  const U = { uT: RL.U ? RL.U.uT : (RL.clumpT = RL.clumpT || { value: 0 }) };
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .7, side: THREE.DoubleSide });
  const wind = `vec3 ipW = (instanceMatrix * vec4(0., 0., 0., 1.)).xyz; float sw = (sin(uT * 1.3 + ipW.x * .02 + ipW.z * .013) * .6 + sin(uT * 2.7 + ipW.x * .09) * .25) * position.y * position.y; transformed.z += sw * .35; transformed.x += sw * .12;`;
  mat.onBeforeCompile = s => { Object.assign(s.uniforms, U); s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;').replace('#include <begin_vertex>', '#include <begin_vertex>\n' + wind); };
  mat.customProgramCacheKey = () => 'realclump';
  let n = 0; for (const c of list) n += c[3] * 3; const IM = new THREE.InstancedMesh(g, mat, n); IM.castShadow = IM.receiveShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = V3(), t = V3(), cc = new THREE.Color(); let k = 0;
  for (const [x, z, r, cnt] of list) for (let i = 0; i < cnt * 3; i++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * r * 1.05; t.set(x + Math.cos(a) * d, GY, z + Math.sin(a) * d); e.set(R(-.25, .25), rnd() * 6.283, R(-.3, .3)); q.setFromEuler(e); const hgt = R(12, 32) * (1 - .35 * d / r); s.set(R(.7, 1.3), hgt, hgt * R(.6, 1.2)); m4.compose(t, q, s); IM.setMatrixAt(k, m4); const dry = rnd() < .18; cc.setHSL(dry ? R(.1, .14) : R(.2, .28), dry ? R(.3, .45) : R(.38, .58), dry ? R(.45, .6) : R(.3, .46)); IM.setColorAt(k, cc); k++; }
  LV.add(IM); SEED = seed0; return IM;
}

// ---------- setup / per frame ----------
function realSetup() {
  if (!REAL || RL.on) return; RL.on = true; const seed0 = SEED; SEED = 777001;   // its own random numbers: the shared world sequence stays as in the normal version
  RL.U = { uT: { value: 0 }, uAct: { value: Array.from({ length: 16 }, () => new THREE.Vector4()) }, uCam: { value: V3() }, uFoc: { value: V3() } };
  const mask = realMask();
  RL.grass = [
    realGrassLevel({ N: 230, S: .7, H: 2.9, W: .32, blades: 1, seg: 5, in: [-2, -1], out: [64, 78], cast: true }, mask),
    realGrassLevel({ N: 200, S: 2.4, H: 3.3, W: .42, blades: 3, seg: 4, in: [62, 78], out: [196, 236] }, mask),
    realGrassLevel({ N: 180, S: 7.6, H: 3.8, W: .6, blades: 5, seg: 3, in: [190, 236], out: [560, 676] }, mask)
  ];
  realTrees(); realScatter();
  // the sun: its own crisp shadow round the camera, sharing the work with the wide (softer) sun spot
  const sun = new THREE.DirectionalLight(0xfff0dc, 0); sun.castShadow = true; const SS = TOUCH ? 2048 : 4096; sun.shadow.mapSize.set(SS, SS);
  Object.assign(sun.shadow.camera, { left: -440, right: 440, top: 440, bottom: -440, near: 100, far: 5200 }); sun.shadow.bias = -0.00025; sun.shadow.normalBias = .02;
  scene.add(sun, sun.target); RL.sun = sun;
  for (const l of [PK.moonL, YS.moon, ST.sun]) if (l) { l.intensity *= .45; RL.suns.push(l); }
  for (const s of LP.sh) { s.l.shadow.mapSize.setScalar(TOUCH ? 1024 : 2048); if (s.l.shadow.map) { s.l.shadow.map.dispose(); s.l.shadow.map = null; } }
  // a macro lens
  bokeh.uniforms.aperture.value = .00032; bokeh.uniforms.maxblur.value = .011;
  SEED = seed0;
  const b = document.createElement('div'); b.id = 'realBadge'; b.textContent = '超寫實版 · REAL'; Object.assign(b.style, { position: 'fixed', right: '12px', top: '10px', zIndex: 40, font: '600 11px Fredoka, sans-serif', letterSpacing: '.12em', color: 'rgba(255,255,255,.72)', background: 'rgba(0,0,0,.28)', padding: '4px 9px', borderRadius: '10px', pointerEvents: 'none' }); document.body.appendChild(b);
}
const _rf = V3();
function realTick(dt) {
  if (!RL.on) return; RL.t += dt; RL.U.uT.value = RL.t;
  const out = !!(WC.cz && (WC.cz.id === 'yard' || WC.cz.id === 'road' || WC.cz.id === 'park'));
  if (RL.clumpT) RL.clumpT.value = RL.t;
  const f = leader ? _rf.copy(leader.pos) : _rf.copy(camera.position); RL.U.uCam.value.copy(camera.position); RL.U.uFoc.value.copy(f);
  for (const G of RL.grass) { G.m.visible = out; G.U.uO.value.x = f.x; G.U.uO.value.y = f.z; G.U.uC.value.x = f.x; G.U.uC.value.y = f.z; }
  // who flattens the grass: the crew, and the feet of any person nearby
  const A = RL.U.uAct.value; let n = 0;
  if (out) {
    for (const C of party) { if (n >= 16) break; if (!C.pos || C.frozen) continue; if (Math.hypot(C.pos.x - f.x, C.pos.z - f.z) > 300) continue; A[n++].set(C.pos.x, C.pos.y, C.pos.z, Math.max(2, (C.r || 1.4) * 1.5)); }
    for (const H of HUMANS) { if (n >= 15) break; if (!H.root.visible || !H.root.parent) continue; const p = H.root.position; if (Math.hypot(p.x - f.x, p.z - f.z) > 400) continue; for (const L of H.legs) { if (n >= 16) break; L.ankle.getWorldPosition(_rf2); A[n++].set(_rf2.x, _rf2.y - 4, _rf2.z, 5); } }
  }
  for (let i = n; i < 16; i++) A[i].w = 0;
  // the sun follows the camera's subject (snapped so the shadow doesn't shimmer)
  const S = RL.sun, sn = 880 / S.shadow.mapSize.x * 2;
  S.intensity = out ? 2.5 : 0; S.shadow.autoUpdate = out; if (out) { const tx = Math.round(f.x / sn) * sn, tz = Math.round(f.z / sn) * sn; S.target.position.set(tx, GY, tz); S.position.set(tx, GY, tz).addScaledVector(SUN, 2400); S.target.updateMatrixWorld(); }
}
const _rf2 = V3();
