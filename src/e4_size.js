
// =====================================================================
//  甚麼都可以放大縮小
//  - more household things are resizable (and the bear can shove them)
//  - growing checks for space first, so nothing can be wedged into a dead end
//  - people notice when something changes size in front of them, and come to look
//  - a plush bear: grow it huge and it becomes a trampoline; a giant cookie feeds the whole team
// =====================================================================
let COOKIE = null;
// a resizable whose children are modelled in real cm around the bbox centre (net scale stays uniform, so fur looks right)
function cmGroup(W, H, D, build, mats, rotY = 0) {
  const G = new THREE.Group(); const S = new THREE.Group(); S.scale.set(1 / W, 1 / H, 1 / D); G.add(S); const I = new THREE.Group(); I.rotation.y = rotY; S.add(I);
  const part = (geo, mat, x, y, z, o = {}) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (o.s) m.scale.set(...o.s); if (o.r) m.rotation.set(...o.r); m.castShadow = o.cast !== false; m.receiveShadow = true; (o.p || I).add(m); return m; };
  const fur = (geo, mat, x, y, z, o = {}) => { const m = furMesh(geo, mat); m.position.set(x, y, z); if (o.r) m.rotation.set(...o.r); (o.p || I).add(m); return m; };
  build({ I, part, fur }); G.userData.mats = mats || []; return G;
}
function resGroup(G, cx, cz, y0, W, H, D, mn, mx, name, push) {
  const r = addResizable(G, cx, cz, y0, W, H, D, mn, mx, name); r.hl = G.userData.mats; if (push) r.c.push = true; return r;
}
function makePlush() {
  const W = 11, H = 17, D = 14;
  const fm = furMat({ color: 0xc89058, len: .55, den: 2.4, droop: .25, clump: .55, rimK: .08, root: .62 });
  const fl = furMat({ color: 0xf0d9b5, len: .4, den: 3, droop: .2, clump: .5, rimK: .06, root: .7 });
  const eye = new THREE.MeshPhysicalMaterial({ color: 0x15100c, roughness: .08, clearcoat: 1 });
  const ribbon = new THREE.MeshPhysicalMaterial({ color: 0xd83a4a, roughness: .45, sheen: 1, sheenColor: 0xff9aa6 });
  const G = cmGroup(W, H, D, ({ I, part, fur }) => {
    // in this inner space the bear's own front is +z, width x=14, depth z=11
    fur(ell(5, 5.4, 4.3, 32, 24), fm, 0, -2.9, 0);
    fur(ell(4.4, 4, 4, 32, 24), fm, 0, 3.9, .4);
    for (const s of [-1, 1]) {
      fur(ell(1.5, 1.5, .8, 16, 12), fm, s * 3.3, 7.2, 0); part(ell(.9, .9, .3, 12, 10), new THREE.MeshStandardMaterial({ color: 0xe9b98a, roughness: .9 }), s * 3.3, 7.2, .6);
      fur(ell(1.4, 2.7, 1.4, 16, 12), fm, s * 4.9, -1.4, 1, { r: [0, 0, s * .55] });
      fur(ell(1.75, 1.6, 2.7, 16, 12), fm, s * 2.6, -7, 2.2);
      part(ell(1.25, 1.25, .3, 16, 10), new THREE.MeshStandardMaterial({ color: 0xf0d9b5, roughness: .95 }), s * 2.6, -7, 4.85);
      part(new THREE.SphereGeometry(.48, 16, 12), eye, s * 1.55, 4.7, 4);
    }
    fur(ell(1.9, 1.35, 1.5, 20, 14), fl, 0, 3.1, 3.7);
    part(ell(.6, .42, .38, 14, 10), eye, 0, 3.6, 5.1);
    const bow = part(new THREE.TorusGeometry(2.6, .45, 10, 32), ribbon, 0, .5, .8, { r: [Math.PI / 2 + .25, 0, 0] });
    part(ell(1, .7, .35, 14, 10), ribbon, -1, .6, 3.4, { r: [0, 0, .5] }); part(ell(1, .7, .35, 14, 10), ribbon, 1, .6, 3.4, { r: [0, 0, -.5] });
  }, [fm, fl], -Math.PI / 2); // faces -x, towards the room
  return { G, W, H, D };
}
function kitchenResizables(K) {
  // cereal box, toaster, mugs on the counter
  const cer = resGroup(cmGroup(22, 30, 18, ({ part }) => { part(new THREE.BoxGeometry(22, 30, 18), K.cereal, 0, 0, 0); }, [K.cereal]), -279, -209, 90, 22, 30, 18, .25, 3, '麥片盒', true);
  const tw = new THREE.MeshPhysicalMaterial({ color: 0xf3f0ea, roughness: .25, clearcoat: .8 }), tb = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: .6 });
  resGroup(cmGroup(28, 18, 16, ({ part }) => {
    part(new THREE.BoxGeometry(28, 17, 16), tw, 0, -.5, 0); for (const s of [-1, 1]) part(new THREE.BoxGeometry(9, .8, 3), tb, s * 6, 8.2, 0);
    part(new THREE.BoxGeometry(2, 3, 2.5), tb, 14.5, 2, 0); part(new THREE.BoxGeometry(24, .6, 14), new THREE.MeshStandardMaterial({ color: 0xbfc4c8, metalness: 1, roughness: .3 }), 0, -8.7, 0);
  }, [tw]), 114, -204, 90, 28, 18, 16, .25, 2, '多士爐', true);
  const mw = new THREE.MeshPhysicalMaterial({ color: 0xf2efe8, roughness: .2, clearcoat: 1 }), ms = new THREE.MeshStandardMaterial({ color: 0x9aa1a8, metalness: 1, roughness: .28 });
  for (const [x, mat, h, nm] of [[-270, mw, 16, '馬克杯'], [-256, ms, 13, '鋼杯']]) {
    resGroup(cmGroup(11, h, 8, ({ part }) => { part(new THREE.CylinderGeometry(4, 4, h, 28), mat, -1, 0, 0); part(new THREE.TorusGeometry(2.6, .7, 10, 20, Math.PI), mat, 3, 0, 0, { r: [0, 0, -Math.PI / 2] }); part(new THREE.CircleGeometry(3.6, 24), new THREE.MeshStandardMaterial({ color: 0x3a2416, roughness: .3 }), -1, h / 2 - 1.5, 0, { r: [-Math.PI / 2, 0, 0], cast: false }); }, [mat]), x, -205, 90, 11, h, 8, .25, 3, nm, true);
  }
  // a cookie you can eat (grow it and the whole team eats)
  const ck = new THREE.MeshStandardMaterial({ color: 0xc58a45, roughness: .85 }), chip = new THREE.MeshStandardMaterial({ color: 0x3a2214, roughness: .6 });
  const cg = cmGroup(5, 1, 5, ({ part }) => { part(new THREE.CylinderGeometry(2.4, 2.5, 1, 22), ck, 0, 0, 0); for (let i = 0; i < 8; i++) { const a = i * 2.4, rr = .5 + (i % 3) * .55; part(new THREE.SphereGeometry(.3, 8, 6), chip, Math.cos(a) * rr, .45, Math.sin(a) * rr, { s: [1, .5, 1] }); } }, [ck]);
  COOKIE = resGroup(cg, -150, 88, 77, 5, 1, 5, .5, 8, '曲奇', false); COOKIE.eaten = false;
  // the plush bear by the toy box
  const P = makePlush(); const pr = resGroup(P.G, 175, 178, 0, P.W, P.H, P.D, .5, 5, '毛公仔', true); pr.c.bouncy = true;
}
// ---- growing needs space ----
function roomFor(r, nt) {
  if (nt <= r.target) return true;
  const hx = r.sx * nt / 2, hz = r.sz * nt / 2; const b = [r.cx - hx, r.cx + hx, r.y0 + .05, r.y0 + r.sy * nt, r.cz - hz, r.cz + hz];
  for (const o of cols) {
    if (o === r.c || o.cat || o.y1 <= b[2] || o.y0 >= b[3]) continue; const q = colBounds(o);
    if (q[1] > b[0] + .05 && q[0] < b[1] - .05 && q[5] > b[4] + .05 && q[4] < b[5] - .05) return false;
  }
  return true;
}
// ---- people notice things changing size ----
function sizeNotice(r, grow) {
  if (LEVEL !== 'kitchen' || STATE !== 'play') return;
  const p = V3(r.cx, r.y0 + r.sy * r.target * .5, r.cz);
  const sees = (head, fov, range) => { const e = V3(); head.getWorldPosition(e); const q = new THREE.Quaternion(); head.getWorldQuaternion(q); const f = V3(0, 0, 1).applyQuaternion(q); const d = V3().subVectors(p, e); const dist = d.length(); d.divideScalar(dist); return dist < range && d.dot(f) > fov && !rayBlocked(e, d, dist - Math.max(r.sx, r.sz) * r.target * .6, false); };
  const big = r.target >= 2;
  if (KID.root && sees(KID.head, .3, 380)) { KID.mode = 'noise'; KID.t = 3; KID.look.copy(p); if (!KS.said['kidsz' + r.name]) { KS.said['kidsz' + r.name] = 1; sayW('女兒', r.name === '毛公仔' ? (big ? '媽媽！熊仔變得好大！' : '熊仔……縮小了？') : `那個${r.name}自己${grow ? '變大' : '變小'}了！`, '#e8a0c0', 2.8); } }
  if (sees(mom.head, .35, 440) && !TOY.fetch && KM.mode !== 'fopen') {
    KM.inv = toyApproach(p); KM.invP = p.clone(); KM.mode = 'inv';
    sayW('太太', grow ? `咦？那個${r.name}……是不是變大了？` : `……奇怪，那個${r.name}剛才不是這麼小的吧？`, '#f4bb72', 2.8);
  }
}
// ---- eat the cookie ----
function updCookie() {
  const r = COOKIE; if (!r || r.eaten || STATE !== 'play') return; const L = leader;
  const c = r.c; const near = L.pos.x > c.x0 - 2.5 && L.pos.x < c.x1 + 2.5 && L.pos.z > c.z0 - 2.5 && L.pos.z < c.z1 + 2.5 && L.pos.y > c.y0 - 2 && L.pos.y < c.y1 + 1.5;
  if (!near) return;
  const team = r.s >= 1.9; const who = team ? party.filter(C => !C.frozen) : [L]; const need = who.some(C => (C.stamMax || 100) < 100);
  if (!need) { if (!r.full || T - r.full > 8) { r.full = T; toast(team ? '大曲奇！不過大家都不餓，留着之後吃' : '還不餓——體力上限減少的隊友才需要吃'); } return; }
  if (!mine(L) || L.frozen) return; netGet('cookie');
}
