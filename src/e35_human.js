
// =====================================================================
//  People — one body for every full-size human (Mom, the daughter, the O.D. men, the neighbours,
//  everyone in the park). A face (brows, lids that blink, eyes, nose, lips, ears), hands with a
//  thumb and fingers, tapered limbs with knees/elbows/shoulders, shoes with soles and a toe joint.
//  Walking is two-bone IK: a planted foot stays planted (heel strike → flat → heel off → toe off),
//  the pelvis rides over the stance leg (rise/fall, side shift, rotation, list), the chest
//  counter-rotates, the arms swing against the legs, the head stays steady and leads turns.
//  Standing: weight drifts from leg to leg (the free knee softens), breathing, blinking.
//  The joint layout is the same as the old rig (pelvis → hip → knee → ankle, chest → shoulder →
//  elbow → hand, chest → head), so poses set elsewhere (sitting, reaching, aiming) still work.
// =====================================================================
const HUMANS = [];
const HUM_B = {
  m: { hipX: 9.2, th: 44, sh: 40, shX: 19.5, shY: 46, up: 28, fo: 24.5, head: 67.5, neckY: 55, kl: 1, ka: 1, foot: 1, hand: 1, hs: 1, pelR: [15.4, 11.5, 9.4], tz: .6, delt: 4.6, collar: 6.2,
    torso: [[0, -1], [16, 0], [16.3, 6], [15.6, 14], [17.2, 26], [18.8, 36], [19.7, 43], [19.6, 46.2], [16.8, 50.4], [10.4, 54.4], [5.6, 56], [0, 56.6]], neck: [5.0, 5.6, 12] },
  f: { hipX: 9, th: 43, sh: 38, shX: 18.5, shY: 45, up: 27, fo: 24.5, head: 65.8, neckY: 52.5, kl: .95, ka: .88, foot: .9, hand: .9, hs: .95, pelR: [15.6, 12, 9.6], tz: .64, delt: 4.2, collar: 5.6,
    torso: [[0, -1], [15.6, 0], [15, 7], [14, 14], [15.2, 25], [16.4, 33], [16.6, 40], [17, 44.5], [14.2, 48.6], [8.4, 52.2], [5.2, 53.6], [0, 54]], neck: [4.3, 4.9, 12] },
  k: { hipX: 6.2, th: 29, sh: 25, shX: 12.5, shY: 32, up: 19, fo: 15.5, head: 48.6, neckY: 37.5, kl: .66, ka: .64, foot: .62, hand: .64, hs: .78, pelR: [10.6, 7.6, 7.6], tz: .7, delt: 3.1, collar: 4.2,
    torso: [[0, -1], [11.2, 0], [11.6, 8], [11.4, 16], [12.2, 25], [12.6, 30], [11.2, 34.5], [7.5, 37.5], [3.8, 39], [0, 39.3]], neck: [3.1, 3.6, 10] }
};
// limb outlines (adult man; radius, fraction of the bone's length from the top joint)
const HUM_THIGH = [[7.6, -.06], [8.7, .04], [8.7, .18], [7.8, .45], [6.6, .72], [5.7, .94], [5.4, 1.02]];
const HUM_SHIN = [[5.3, -.02], [5.85, .12], [5.75, .3], [4.8, .6], [4.0, .84], [3.85, .94], [3.9, 1.0]];
const HUM_UP = [[3.8, -.06], [4.9, .06], [4.9, .25], [4.4, .6], [4.0, .9], [3.9, 1.0]];
const HUM_FORE = [[3.9, -.02], [4.15, .14], [3.75, .45], [3.0, .84], [2.75, .97], [2.7, 1.0]];
let HUMM = null;
function humMats() {
  if (HUMM) return HUMM;
  HUMM = {
    white: new THREE.MeshPhysicalMaterial({ color: 0xe6e0d6, roughness: .25, clearcoat: .6, clearcoatRoughness: .1 }),
    iris: new THREE.MeshPhysicalMaterial({ color: 0x3a2618, roughness: .08, clearcoat: 1, clearcoatRoughness: .02 }),
    lip: new THREE.MeshPhysicalMaterial({ color: 0xb46a5c, roughness: .42, sheen: .3, sheenColor: 0xff9a88, clearcoat: .15 }),
    mouth: new THREE.MeshStandardMaterial({ color: 0x4a2420, roughness: .7 }),
    sole: new THREE.MeshStandardMaterial({ color: 0x6a625a, roughness: .9 }),
    soleW: new THREE.MeshStandardMaterial({ color: 0xe6e2da, roughness: .85 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x2a2624, roughness: .35, metalness: .4 }),
    lens: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .02, transmission: .9, transparent: true, opacity: .22, depthWrite: false })
  };
  return HUMM;
}
// a lathe outline for a limb: points top→bottom given as [r, t]; built bottom→top so the normals face out
let HUM_LOD = 0;   // set while building a crowd person: coarser surfaces, plain hair, mitten hands
function humLimb(prof, len, kr, seg = HUM_LOD ? 10 : 18) {
  const pts = [new THREE.Vector2(0, -prof[prof.length - 1][1] * len - .25)];
  for (let i = prof.length - 1; i >= 0; i--) pts.push(new THREE.Vector2(prof[i][0] * kr, -prof[i][1] * len));
  pts.push(new THREE.Vector2(0, -prof[0][1] * len + .25));
  return new THREE.LatheGeometry(pts, seg);
}
// collects shapes per (bone, material) and merges them into one mesh each — a whole person is ~30 draws
function humParts() {
  const G = new Map(); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), vp = new THREE.Vector3(), vs = new THREE.Vector3();
  return {
    add(bone, mat, geo, p, r, s, noShadow) {
      e.set(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0); q.setFromEuler(e); vp.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0); vs.set(s ? s[0] : 1, s ? s[1] : 1, s ? s[2] : 1);
      geo.applyMatrix4(m4.compose(vp, q, vs)); if (geo.index === null) return;
      const k = bone.uuid + mat.uuid + (noShadow ? '-' : ''); let g = G.get(k); if (!g) G.set(k, g = { bone, mat, geos: [], ns: noShadow }); g.geos.push(geo);
    },
    done() { const out = []; for (const g of G.values()) { const geo = g.geos.length > 1 ? mergeGeometries(g.geos) : g.geos[0]; const m = new THREE.Mesh(geo, g.mat); m.castShadow = !g.ns; m.receiveShadow = true; g.bone.add(m); out.push(m); } return out; }
  };
}
const HUM_SW = [[0, 3.3], [.25, 3.8], [.62, 4.6], [.85, 4.3], [1, 3.4]], HUM_ST = [[0, 2.6], [.18, 3.6], [.42, 3.6], [.6, 1.7], [.8, -.1], [1, -1.0]];
function humPL(tab, t) { for (let i = 1; i < tab.length; i++) if (t <= tab[i][0]) { const a = tab[i - 1], b = tab[i]; return lerp(a[1], b[1], sstep(0, 1, (t - a[0]) / (b[0] - a[0]))); } return tab[tab.length - 1][1]; }
function humShoeTop(t) { return humPL(HUM_ST, t); }
// part 0 = heel→ball (ankle space), 1 = ball→toe (toe-joint space). sole: a slab outline; withSole: the upper sits on one.
function humShoeGeo(F, part, withSole, sole) {
  const zH = -7.6, zT = 19.4, ts = (11.5 - zH) / (zT - zH), yb = -4.45, NZ = 22, NA = 36;
  const t0 = part ? ts - .03 : 0, t1 = part ? 1 : ts + .03, oy = part ? -3.6 : 0, oz = part ? 11.5 : 0;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= NZ; i++) {
    const t = t0 + (t1 - t0) * i / NZ; let k = 1;
    if (t < .1) k = Math.sqrt(Math.max(0, 1 - ((.1 - t) / .1) ** 2)); else if (t > .76) k = Math.sqrt(Math.max(0, 1 - ((t - .76) / .24) ** 2));
    const z = zH + (zT - zH) * t; const w = (humPL(HUM_SW, t) + (sole ? .3 : 0)) * Math.pow(k, .55);
    const bot = sole ? yb : yb + (withSole ? .7 : 0), top = sole ? yb + 1.3 * Math.pow(k, .4) : bot + (humShoeTop(t) - bot) * Math.pow(k, .5);
    const mid = (top + bot) / 2, half = Math.max(.001, (top - bot) / 2);
    for (let j = 0; j <= NA; j++) {
      const an = j / NA * Math.PI * 2, c = Math.cos(an), sn = Math.sin(an);
      const X = Math.sign(c) * Math.pow(Math.abs(c), .7), Y = Math.sign(sn) * Math.pow(Math.abs(sn), sn < 0 ? .3 : .75);
      pos.push(X * w * F, (mid + half * Y - oy) * F, (z - oz) * F); uv.push(j / NA, t);
    }
  }
  for (let i = 0; i < NZ; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1, c = a + 1, d = b + 1; idx.push(a, c, b, c, d, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

// ---------- the body ----------
// o: { build 'm'|'f'|'k', top, pants, skin, shoe, sole, hair (colour), style 'short'|'bald'|'bun'|'long'|'pig', bald, cap, badge,
//      glasses, sleeve 'long'|'short', slipper (fur material), ankleSkin, sock (material, no shoe), lip, hood }
function humanBody(o, H = {}) {
  HUM_LOD = o.lod ? 1 : 0;
  const B = HUM_B[o.build || 'm'], MM = humMats(), P = humParts();
  const kl = B.kl, ka = B.ka, F = B.foot;
  Object.assign(H, { pos: H.pos || V3(), yaw: H.yaw || 0, phase: H.phase || 0, amp: 0, legs: [], arms: [], aim: H.aim || V3(), aimT: H.aimT || V3() });
  H.dim = { th: B.th, sh: B.sh, hipX: B.hipX, F, sole: 4.3 * F, heel: -6.6 * F, ball: 11.5 * F, pelN: 2 + B.th + B.sh + 4.3 * F - .15 };
  const g = new THREE.Group(); scene.add(g); H.root = g;
  const style = o.bald ? 'bald' : (o.style || 'short');
  const skin = o.skin || MAT.skin, top = o.top, pants = o.pants || top;
  // pelvis
  const pelvis = grp(g, 0, H.dim.pelN); H.pelvis = pelvis;
  P.add(pelvis, pants, ell(B.pelR[0], B.pelR[1], B.pelR[2], 28, 18));
  for (const s of [-1, 1]) P.add(pelvis, pants, ell(B.pelR[0] * .42, B.pelR[1] * .58, B.pelR[2] * .5, 16, 12), [s * B.pelR[0] * .3, -B.pelR[1] * .3, -B.pelR[2] * .42]);
  // legs
  for (const s of [-1, 1]) {
    const hip = grp(pelvis, s * B.hipX, -2); P.add(hip, pants, humLimb(HUM_THIGH, B.th, kl));
    const knee = grp(hip, 0, -B.th); P.add(knee, pants, new THREE.SphereGeometry(5.75 * kl, 16, 12));
    if (o.ankleSkin) { P.add(knee, pants, humLimb(HUM_SHIN.slice(0, 5), B.sh * .9, kl)); P.add(knee, skin, new THREE.CylinderGeometry(3.4 * kl, 3.3 * kl, B.sh * .3, 14), [0, -B.sh * .88, 0]); }
    else { P.add(knee, pants, humLimb(HUM_SHIN, B.sh, kl), [0, 0, -.4 * kl], null, [1, 1, .94]); if (!o.sock) P.add(knee, pants, new THREE.TorusGeometry(4.3 * kl, .7 * kl, 6, 18), [0, -B.sh * .9, -.3 * kl], [Math.PI / 2, 0, 0]); }
    const ankle = grp(knee, 0, -B.sh); const toe = grp(ankle, 0, -3.6 * F, 11.5 * F);
    if (o.slipper) {
      const sl = furMesh(ell(5.6 * F, 3.8 * F, 12.6 * F, 28, 16), o.slipper); sl.position.set(0, -1.3 * F, 4.4 * F); ankle.add(sl);
      P.add(ankle, o.sole || MM.sole, ell(5.8 * F, 1.0 * F, 13 * F, 20, 8), [0, -3.6 * F, 4.4 * F]);
    } else {
      const sm = o.sock || o.shoe, so = o.sock ? null : (o.sole || MM.sole);
      // one smooth shoe surface (heel counter, instep, rounded toe) split at the ball of the foot so the toe can flex; a sole slab under it
      P.add(ankle, sm, humShoeGeo(F, 0, !!so)); P.add(toe, sm, humShoeGeo(F, 1, !!so));
      if (so) { P.add(ankle, so, humShoeGeo(F, 0, true, true)); P.add(toe, so, humShoeGeo(F, 1, true, true));
        P.add(ankle, sm, new THREE.TorusGeometry(3.5 * F, .6 * F, 6, 18), [0, 2.6 * F, -2.6 * F], [Math.PI / 2 + .35, 0, 0], [1, 1.25, 1]);   // the collar round the ankle
        for (let i = 0; i < 4; i++) { const z = (3.4 + i * 1.3) * F; P.add(ankle, o.lace || HUMM.soleW, new THREE.CylinderGeometry(.2 * F, .2 * F, 3.6 * F, 6), [0, humShoeTop((z / F + 7.6) / 27) * F + .2 * F, z], [0, 0, Math.PI / 2], null, true); } }
    }
    H.legs.push({ hip, knee, ankle, toe, s });
  }
  // torso
  const chest = grp(pelvis, 0, 4); H.chest = chest;
  const torso = new THREE.Mesh(new THREE.LatheGeometry(B.torso.map(p => new THREE.Vector2(p[0], p[1])), 36), top); torso.scale.z = B.tz; torso.castShadow = torso.receiveShadow = true; chest.add(torso); H.torso = torso; H.torsoZ = B.tz;
  P.add(chest, top, new THREE.TorusGeometry(B.torso[1][0] + .2, .9 * ka, 6, 36), [0, .4, 0], [Math.PI / 2, 0, 0], [1, B.tz * 1.02, 1]);   // hem
  if (o.hood) { const hd = new THREE.TorusGeometry(B.collar + 1.6, 2.2 * ka, 10, 24, Math.PI * 1.3); P.add(chest, o.hood, hd, [0, B.neckY - 2, -2.4 * ka], [Math.PI / 2 + .3, 0, Math.PI * 1.15]); }
  else P.add(chest, top, new THREE.TorusGeometry(B.collar, 1.05 * ka, 8, 24), [0, B.neckY - .9, .25], [Math.PI / 2 - .12, 0, 0], [1, 1, .9]);   // collar
  if (o.badge) { const zb = B.torso[5][0] * B.tz * Math.sqrt(1 - .22); const b = new THREE.Mesh(new THREE.CircleGeometry(3.2 * ka, 24), o.badge); b.position.set(-9 * ka, B.torso[5][1] + 3, zb + .25); b.rotation.y = -.31; chest.add(b); }
  // neck + head
  const neck = grp(chest, 0, B.neckY); H.neck = neck; P.add(neck, skin, new THREE.CylinderGeometry(B.neck[0], B.neck[1], B.neck[2], 18), [0, B.neck[2] / 2 - 2, -.3]);
  const head = grp(neck, 0, B.head - B.neckY); H.head = head; const face = grp(head); face.scale.setScalar(B.hs); H.face = face;
  humFace(H, P, face, o, skin, MM);
  // arms
  for (const s of [-1, 1]) {
    const sh = grp(chest, s * B.shX, B.shY); const sleeve = o.sleeve === 'short' ? skin : top;
    P.add(sh, top, new THREE.SphereGeometry(B.delt, 16, 12), [-s * 1.8 * ka, -1.6, 0], null, [1, .9, .88]);
    if (o.sleeve === 'short') { P.add(sh, top, new THREE.CylinderGeometry(5.4 * ka, 5.1 * ka, 11 * ka, 16), [0, -4.5 * ka, 0]); P.add(sh, skin, humLimb(HUM_UP.slice(1), B.up, ka * .92)); }
    else P.add(sh, top, humLimb(HUM_UP, B.up, ka));
    const el = grp(sh, 0, -B.up); P.add(el, sleeve, new THREE.SphereGeometry(4.0 * ka, 14, 10));
    P.add(el, sleeve, humLimb(HUM_FORE, B.fo, ka));
    if (o.sleeve !== 'short') P.add(el, top, new THREE.TorusGeometry(3.2 * ka, .55 * ka, 6, 16), [0, -B.fo * .93, 0], [Math.PI / 2, 0, 0]);
    const hand = grp(el, 0, -B.fo + .3); const fing = grp(hand, 0, -5.4 * B.hand);
    humHand(P, hand, fing, s, B.hand, skin);
    H.arms.push({ sh, el, hand, fing, s, shY0: B.shY, grip: .35 });
  }
  P.done(); HUM_LOD = 0; H.lod = !!o.lod;
  H._g = { a: 0, run: 0, wt: R(0, 50), py: H.dim.pelN, ry: null, yr: 0 }; H._nk = { x: 0, y: 0, z: 0 }; H._lt = R(0, 20); H._seed = R(0, 6.28); H._bl = R(1, 4); H._bk = 0;
  HUMANS.push(H);
  return H;
}
function humHand(P, hand, fing, s, k, skin) {
  if (HUM_LOD) { P.add(hand, skin, ell(1.35 * k, 3.4 * k, 2.75 * k, 10, 8), [0, -2.8 * k, 0]); P.add(fing, skin, ell(1.1 * k, 2.6 * k, 2.6 * k, 10, 8), [0, -2.2 * k, 0]); return; }   // a mitten
  // palm faces the thigh (−s·x), thumb at the front edge, fingers curl toward the palm
  P.add(hand, skin, ell(1.35 * k, 3.4 * k, 2.75 * k, 14, 10), [0, -2.8 * k, 0]);
  P.add(hand, skin, ell(1.2 * k, 1.4 * k, 2.6 * k, 12, 8), [0, -.2 * k, 0]);   // wrist
  const th = new THREE.CapsuleGeometry(.72 * k, 2.6 * k, 4, 10); P.add(hand, skin, th, [-s * .55 * k, -3.0 * k, 2.35 * k], [-.55, 0, -s * .35]);
  for (let i = 0; i < 4; i++) { const zz = (-1.65 + i * 1.1) * k, l = [3.0, 4.0, 4.3, 3.9][i] * k; P.add(fing, skin, new THREE.CapsuleGeometry(.56 * k, l, 4, 8), [0, -l / 2 - .2 * k, zz * -1 + .1 * k]); }
}
// ---------- the head: one sculpted surface (a sphere pushed into a skull, jaw, brow, sockets, nose, lips, chin) ----------
// bumps/hollows in direction space: [x, y, z, σx, σy, σz, cm, mirrored]
const HEAD_G = [
  [.36, .27, .89, .22, .06, .3, .5, 1], [.38, .12, .92, .15, .085, .3, -1.05, 1], [0, .22, .97, .08, .08, .3, .25, 0],
  [0, -.06, .998, .065, .24, .3, 1.35, 0], [0, -.29, .957, .11, .085, .3, 2.0, 0], [.11, -.32, .94, .075, .055, .3, .8, 1],
  [0, -.45, .89, .2, .06, .3, .2, 0], [0, -.52, .85, .19, .04, .3, .32, 0], [0, -.61, .79, .15, .045, .3, .36, 0], [.22, -.56, .8, .05, .05, .3, -.35, 1],
  [0, -.84, .54, .2, .12, .3, 1.3, 0], [.64, -.62, .45, .16, .16, .3, .7, 1], [.6, 0, .8, .14, .1, .25, .45, 1],
  [.6, -.4, .7, .14, .12, .3, -.3, 1], [.82, .3, .48, .15, .15, .3, -.35, 1], [.38, -.01, .92, .13, .04, .3, .15, 1]
];
const HEAD_C = [
  [0, -.52, .85, .2, .045, .76, .47, .44, 0], [0, -.61, .79, .16, .05, .76, .47, .44, 0],
  [.5, -.15, .85, .18, .15, 1, .93, .9, 1], [.38, .14, .92, .14, .08, .86, .79, .77, 1], [.075, -.33, .94, .03, .02, .45, .28, .26, 1]
];
function humHeadPt(x, y, z, out) {
  const lo = sstep(-.05, -.9, y);
  let px = x * 8.0 * (1 - .15 * lo), py = y * 11.2, pz = z * 10.0;
  if (z < 0) pz *= 1 + .07 * Math.max(0, y) - .38 * lo;
  else pz *= (1 + .28 * sstep(0, .7, y) * (1 - sstep(.75, 1, y)) + .18 * sstep(0, -.75, y)) * (1 - .05 * lo);   // a flat, upright face: forehead and mouth/chin forward
  let d = 0;
  for (const g of HEAD_G) for (let m = g[7] ? -1 : 1; m <= 1; m += 2) { const dx = (x - m * g[0]) / g[3], dy = (y - g[1]) / g[4], dz = (z - g[2]) / g[5]; d += g[6] * Math.exp(-(dx * dx + dy * dy + dz * dz)); }
  return out.set(px + x * d, py + y * d + .2, pz + z * d - .4);
}
function humHeadGeo() {
  const g = HUM_LOD ? new THREE.SphereGeometry(1, 40, 34) : new THREE.SphereGeometry(1, 96, 84); const P = g.attributes.position; const col = new Float32Array(P.count * 3); const v = V3(), w = V3();
  for (let i = 0; i < P.count; i++) {
    v.set(P.getX(i), P.getY(i), P.getZ(i)).normalize(); humHeadPt(v.x, v.y, v.z, w); P.setXYZ(i, w.x, w.y, w.z);
    let r = 1, gg = 1, b = 1;
    for (const c of HEAD_C) for (let m = c[8] ? -1 : 1; m <= 1; m += 2) { if (v.z < .3) continue; const dx = (v.x - m * c[0]) / c[3], dy = (v.y - c[1]) / c[4]; const k = Math.exp(-(dx * dx + dy * dy)); r = lerp(r, c[5], k); gg = lerp(gg, c[6], k); b = lerp(b, c[7], k); }
    col[i * 3] = r; col[i * 3 + 1] = gg; col[i * 3 + 2] = b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
}
function humColor(geo) { const n = geo.attributes.position.count; geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3)); return geo; }
// hair that follows the skull: part of a sphere (θ ≤ thL, tipped back by tilt), each point pushed onto the head + lift
function humHairGeo(thL, tilt, lift, phiS = 0, phiL = Math.PI * 2, thS = 0) {
  const g = new THREE.SphereGeometry(1, HUM_LOD ? 24 : 56, HUM_LOD ? 10 : 22, phiS, phiL, thS, thL); g.rotateX(tilt); const P = g.attributes.position, v = V3(), w = V3();
  for (let i = 0; i < P.count; i++) { v.set(P.getX(i), P.getY(i), P.getZ(i)).normalize(); humHeadPt(v.x, v.y, v.z, w); w.addScaledVector(v, lift * (1 + .5 * Math.max(0, v.y))); P.setXYZ(i, w.x, w.y, w.z); }
  g.computeVertexNormals(); return g;
}
const HUM_SKIN = new Map();
function humFace(H, P, f, o, skin, MM) {
  let hs = HUM_SKIN.get(skin.uuid); if (!hs) { hs = skin.clone(); hs.vertexColors = true; HUM_SKIN.set(skin.uuid, hs); }
  P.add(f, hs, humHeadGeo());
  const v = V3();
  for (const s of [-1, 1]) { humHeadPt(s * .995, .05, -.08, v); P.add(f, hs, humColor(ell(1.0, 2.7, 1.85, 12, 10)), [v.x + s * .25, v.y + .3, v.z], [0, s * .35, s * .08]); P.add(f, hs, humColor(ell(.45, 1.5, 1.0, 8, 6)), [v.x + s * .75, v.y + .3, v.z + .3], [0, s * .35, 0]); }
  // eyes, lids, brows
  H.lids = [];
  for (const s of [-1, 1]) {
    const d = V3(s * .38, .12, .92).normalize(); humHeadPt(d.x, d.y, d.z, v); const c = V3(v.x, v.y, v.z - .6);
    P.add(f, MM.white, ell(1.25, 1.12, 1.1, 16, 12), [c.x, c.y, c.z], null, null, true);
    P.add(f, MM.iris, new THREE.SphereGeometry(.68, 16, 12), [c.x, c.y - .05, c.z + .9], null, [1, 1, .42], true);
    const lid = grp(f, c.x, c.y + 1.12, c.z + .02); const lm = new THREE.Mesh(ell(1.3, 1.16, 1.18, 16, 10), hs); lm.geometry = humColor(lm.geometry); lm.position.y = -1.14; lid.add(lm); lid.scale.y = .34; H.lids.push(lid);
    const lo = grp(f, c.x, c.y - 1.12, c.z + .02); const lw = new THREE.Mesh(ell(1.3, 1.16, 1.18, 16, 10), hs); lw.geometry = humColor(lw.geometry); lw.position.y = 1.14; lo.add(lw); lo.scale.y = .2;
    if (s > 0) H.eyeZ = c.z;
  }
  { const d = V3(0, -.565, .82).normalize(); humHeadPt(d.x, d.y, d.z, v); P.add(f, MM.mouth, ell(2.35, .14, .5, 16, 6), [v.x, v.y, v.z - .2], [-.5, 0, 0], null, true); }   // the line between the lips
  const brow = new THREE.MeshStandardMaterial({ color: new THREE.Color(o.brow ?? o.hair ?? 0x2a1c14).lerp(new THREE.Color(0xc89a80), .22), roughness: .9 });
  for (const s of [-1, 1]) { const d = V3(s * .36, .3, .88).normalize(); humHeadPt(d.x, d.y, d.z, v); P.add(f, brow, ell(2.3, .27, .42, 10, 6), [v.x, v.y, v.z + .12], [-.15, s * .3, s * .03], null, true); }
  // hair
  const st = style0(o);
  if (o.hair !== undefined && o.hair !== null) {
    const hm = HUM_LOD ? new THREE.MeshStandardMaterial({ color: o.hair, roughness: .75 }) : furMat({ color: o.hair, len: st === 'bald' ? .55 : .8, den: 2.4, droop: .45, clump: .55, rimK: .08, root: .55, rough: .7 });
    const add = (geo, x = 0, y = 0, z = 0) => { const m = HUM_LOD ? new THREE.Mesh(geo, hm) : furMesh(geo, hm); if (HUM_LOD) m.castShadow = true; m.position.set(x, y, z); f.add(m); return m; };
    if (st === 'bald') add(humHairGeo(.5, -.25, .3, Math.PI - .35, Math.PI + .7, 1.35));
    else {
      add(o.cap ? humHairGeo(.5, -.62, .45, 0, Math.PI * 2, 1.05) : humHairGeo(1.52, -.62, .55));
      if (st === 'bun') { add(ell(7.8, 6.4, 5.2, 24, 16), 0, -2.2, -5.6); add(new THREE.SphereGeometry(4.4, 20, 14), 0, 6.4, -10.6); }
      else if (st === 'long') add(ell(8.8, 12.5, 4.8, 24, 16), 0, -7.5, -5.8);
      else if (st === 'pig') for (const s of [-1, 1]) { const pt = add(ell(3, 5.4, 3, 18, 12), s * 8.8, -2.6, -3.4); pt.rotation.z = s * .4; P.add(f, o.tie || MM.lip, new THREE.TorusGeometry(1.6, .6, 8, 16), [s * 8, 2.0, -3], [0, Math.PI / 2, 0]); }
    }
  }
  if (o.cap) {
    P.add(f, o.cap, new THREE.SphereGeometry(10.8, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), [0, 3.6, -.2], [-.1, 0, 0], [.88, .76, 1.02]);
    P.add(f, o.cap, new THREE.CylinderGeometry(8.0, 8.0, .7, 24, 1, false, -Math.PI / 2, Math.PI), [0, 4.3, 7.4], [.14, 0, 0], [1, 1, 1.15]);
    if (o.badge) { const b = new THREE.Mesh(new THREE.CircleGeometry(2.2, 20), o.badge); b.position.set(0, 8.2, 8.7); b.rotation.x = -.5; f.add(b); }
  }
  if (o.glasses) { const ez = (H.eyeZ || 8.4) + 1.9; for (const s of [-1, 1]) {
    P.add(f, MM.frame, new THREE.TorusGeometry(2.2, .24, 6, 22), [s * 3.15, 1.35, ez], null, [1, .86, 1], true);
    P.add(f, MM.frame, new THREE.BoxGeometry(.32, .32, ez - 1), [s * 7.4, 1.8, (ez - 1) / 2 + .2], [0, s * .08, 0], null, true);
    if (s > 0) P.add(f, MM.frame, new THREE.BoxGeometry(2.0, .28, .28), [0, 1.75, ez + .1], null, null, true); } }
}
function style0(o) { return o.bald ? 'bald' : (o.style || 'short'); }

// ---------- motion ----------
const _hv = new THREE.Vector3();
function humStanceP(v) { return v < .14 ? lerp(-.26, 0, sstep(0, .14, v)) : v < .62 ? 0 : .62 * sstep(.62, 1, v); }
function humSwingP(t) { return t < .3 ? lerp(.62, .14, sstep(0, .3, t)) : t < .75 ? lerp(.14, -.04, (t - .3) / .45) : lerp(-.04, -.26, sstep(.75, 1, t)); }
// the ankle position when the foot's flat reference point is at z (on the ground) and the foot is pitched by p
function humAnkle(Dm, z, p, out) {
  if (p < 0) { const pz = z + Dm.heel, dy = Dm.sole, dz = -Dm.heel; out.y = dy * Math.cos(p) - dz * Math.sin(p); out.z = pz + dy * Math.sin(p) + dz * Math.cos(p); }
  else { const pz = z + Dm.ball, dy = Dm.sole, dz = -Dm.ball; out.y = dy * Math.cos(p) - dz * Math.sin(p); out.z = pz + dy * Math.sin(p) + dz * Math.cos(p); }
  return out;
}
// legs, pelvis, chest twist, neck steadying and the default arm swing. walking: bool; run 0..1.
// Doesn't touch chest.rotation.x (callers lean the body themselves). noArms: leave the arms alone.
function humanGait(H, ph, walking, dt, run = 0, noArms = false) {
  const G = H._g, Dm = H.dim, L1 = Dm.th, L2 = Dm.sh, sc = L1 / 44;
  G.a = damp(G.a, walking ? 1 : 0, walking ? 9 : 4.5, dt); const a = G.a;
  G.run = damp(G.run, run, 3, dt); const r = G.run * a;
  const ry = H.root.rotation.y; if (G.ry === null) G.ry = ry; let dy = ry - G.ry; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); G.ry = ry; G.yr = damp(G.yr, dt > 0 ? clamp(dy / dt, -6, 6) : 0, 6, dt);
  G.wt += dt; const w = Math.tanh(2.4 * (Math.sin(G.wt * .21 + H._seed) + .5 * Math.sin(G.wt * .097 + H._seed * 2.3)));
  // pelvis
  const tilt = .02 + .05 * a + .12 * r;
  const yaw = a * (.075 - .03 * r) * Math.cos(ph) + (1 - a) * w * .03;
  const roll = -a * .042 * Math.sin(ph) * (1 - .5 * r) + (1 - a) * w * .045 + clamp(-G.yr * .05 * a, -.1, .1);
  const PV = H.pelvis; PV.rotation.set(tilt, yaw, roll); PV.position.x = -a * 1.4 * sc * Math.sin(ph) * (1 - .6 * r) + (1 - a) * w * 2.0 * sc;
  // foot targets
  const stride = H.stride || 64, Dt = lerp(.6, .38, r), S = 2 * stride * Dt, zb = 1.5 * sc, liftH = (9 + 20 * r) * sc;
  const Lr = (L1 + L2) * lerp(.9985, lerp(.996, .955, r), a);
  let py = Infinity; const T = G.T || (G.T = [{}, {}]);
  for (let i = 0; i < 2; i++) {
    const L = H.legs[i], s = L.s, t = T[i]; const u = ((ph / (2 * Math.PI) + (s < 0 ? 0 : .5)) % 1 + 1) % 1;
    let zW, pW, tbW, lW = 0, stance;
    if (u < Dt) { const v = u / Dt; zW = zb + S / 2 - v * S; pW = humStanceP(v) * (1 + .3 * r); tbW = v > .62 ? -pW : 0; stance = true; }
    else { const tt = (u - Dt) / (1 - Dt), e = tt * tt * (3 - 2 * tt); zW = zb - S / 2 + S * e; lW = liftH * Math.sin(Math.PI * Math.pow(tt, .75)); pW = humSwingP(tt); tbW = -.62 * (1 - sstep(0, .3, tt)); stance = tt > .97; }
    const wb = (1 + s * w) / 2;
    const zI = (s > 0 ? 1.2 : -.8) * sc + (1 - wb) * 3.5 * sc, pI = (1 - wb) * .07;
    const z = lerp(zI, zW, a), p = lerp(pI, pW, a), tb = lerp(-pI, tbW, a), lift = lW * a;
    t.x = s * (Dm.hipX + lerp(.7 + (1 - wb), .5, a) * sc) * (1 - .45 * r);
    humAnkle(Dm, z, p, t); t.y += lift; t.p = p; t.tb = tb;
    // hip position (pelvis rotation applied; height still unknown)
    _hv.copy(L.hip.position).applyEuler(PV.rotation); t.hx = PV.position.x + _hv.x; t.hy = _hv.y; t.hz = _hv.z;
    if (stance || a < .4) { const dx = t.x - t.hx, dz = t.z - t.hz; const m = Lr * Lr - dx * dx - dz * dz; py = Math.min(py, t.y + Math.sqrt(Math.max(1, m)) - t.hy); }
  }
  py = Math.min(py === Infinity ? G.py : py, Dm.pelN - 3 * r * sc);
  G.py = py < G.py ? py : damp(G.py, py, 22, dt); PV.position.y = G.py;
  // two-bone IK per leg
  const Lmax = (L1 + L2) * .9995;
  for (let i = 0; i < 2; i++) {
    const L = H.legs[i], t = T[i]; const hy = G.py + t.hy;
    const dx = t.x - t.hx, dyv = hy - t.y, dz = t.z - t.hz;
    const lat = Math.atan2(dx, dyv); const dyz = Math.hypot(dyv, dx);
    let d = Math.hypot(dyz, dz); d = clamp(d, Math.abs(L1 - L2) + 1, Lmax);
    const k = Math.PI - Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
    const fwd = Math.atan2(dz, dyz) + Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    L.hip.rotation.set(-fwd - tilt, -yaw, lat - roll); L.knee.rotation.x = k;
    L.ankle.rotation.set(t.p + fwd - k, 0, -lat); if (L.toe) L.toe.rotation.x = t.tb;
  }
  // chest counter-rotation; the head stays level and leads turns
  H.chest.rotation.y = -yaw * 1.75; H.chest.rotation.z = -roll * .85;
  H._nk.x = -.02 * a; H._nk.y = yaw * .5 + clamp(G.yr * .15, -.28, .28); H._nk.z = -roll * .12;
  if (!noArms) for (const A of H.arms) {   // contralateral: this arm comes forward with the other leg
    const c = Math.cos(ph - .3), As = .3 * a + .5 * r;
    A.sh.rotation.set(-A.s * As * c + .03 + .14 * r, 0, A.s * (.07 + .03 * a));
    A.el.rotation.x = -(.14 + .24 * a * Math.max(0, A.s * c) + 1.3 * r);
  }
  return a;
}
// sitting / crouching poses blend the gait's side-to-side bits back to neutral
function humanSettle(H, k) {
  if (k <= 0) return; const PV = H.pelvis; PV.position.x *= 1 - k; PV.rotation.y *= 1 - k; PV.rotation.z *= 1 - k; PV.rotation.x *= 1 - k;
  H.chest.rotation.y *= 1 - k; H.chest.rotation.z *= 1 - k;
  for (const L of H.legs) { L.hip.rotation.y *= 1 - k; L.hip.rotation.z *= 1 - k; L.ankle.rotation.z *= 1 - k; if (L.toe) L.toe.rotation.x *= 1 - k; }
}
// walking / standing for the NPC people (returns true on a footfall). run: 0..1 jog.
function humanAnim(H, moveD, dt, run = 0) {
  H.root.position.copy(H.pos); H.root.rotation.y = H.yaw;
  const sw = (H.stride || 64) * (H.root.scale.x || 1); const prev = H.phase;
  H.phase += moveD / sw * Math.PI; const walking = moveD > 0;
  const a = humanGait(H, H.phase, walking, dt, run); H.amp = .42 * a;
  H.chest.rotation.x = .03 + .04 * a + .16 * H._g.run * a;
  return walking && Math.floor(prev / Math.PI) !== Math.floor(H.phase / Math.PI);
}
// head / torch-arm aim toward H.aim
function humanAimArm(H, arm, dt) {
  H.root.updateMatrixWorld(true);
  const hp = V3(); H.head.getWorldPosition(hp); const ad = V3().subVectors(H.aim, hp); const yr0 = Math.atan2(ad.x, ad.z) - H.yaw; const yr = Math.atan2(Math.sin(yr0), Math.cos(yr0)); const pitch = Math.atan2(-ad.y, Math.hypot(ad.x, ad.z));
  H.head.rotation.y = damp(H.head.rotation.y, clamp(yr, -.9, .9), 4, dt); H.head.rotation.x = damp(H.head.rotation.x, clamp(pitch * .6, -.3, .7), 4, dt);
  if (arm) { const A = H.arms[arm]; A.sh.rotation.set(-.62 - clamp(-pitch, -.5, .9) * .35, clamp(yr, -.7, .7) * .5, 0); A.el.rotation.x = -1.05 + clamp(pitch, -.2, 1.1) * .45; A.grip = .9; }
  return { yr, pitch };
}
// every frame for everyone on show: breathing, blinking, a living neck, relaxed fingers
function humanLifeTick(dt) {
  const cp = camera.position;
  for (let i = HUMANS.length - 1; i >= 0; i--) {
    const H = HUMANS[i]; const R0 = H.root; if (!R0.parent) continue;
    let vis = R0.visible, p = R0.parent; while (vis && p) { vis = p.visible; p = p.parent; } if (!vis) continue;
    if (R0.position.distanceToSquared(cp) > 1400 * 1400) continue;
    H._lt += dt; const t = H._lt, sd = H._seed;
    const br = Math.sin(t * 1.46 + sd);
    H.torso.scale.set(1, 1 + br * .006, H.torsoZ * (1 + br * .022));
    for (const A of H.arms) { A.sh.position.y = A.shY0 + br * .22; A.fing.rotation.z = -A.s * (A.grip + Math.sin(t * .5 + A.s) * .04); }
    const nk = H._nk;
    H.neck.rotation.set(nk.x + Math.sin(t * .37 + sd) * .022 + Math.sin(t * .93 + sd * 3) * .01 - br * .01, nk.y + Math.sin(t * .29 + sd * 2) * .035, nk.z + Math.sin(t * .23 + sd) * .015);
    nk.x *= .9; nk.y *= .9; nk.z *= .9;
    H._bl -= dt; if (H._bl <= 0) { H._bk = .17; H._bl = rnd() < .15 ? .32 : R(2, 6); }
    let lid = .34 + clamp(H.head.rotation.x, 0, .7) * .25; if (H._bk > 0) { H._bk -= dt; lid = lerp(1, lid, Math.abs(H._bk / .17 * 2 - 1)); }
    for (const l of H.lids) l.scale.y = lid;
  }
}
function buildHuman(o) { return humanBody(o); }
