// =====================================================================
//  WINDOWS THAT OPEN, CAT FLAPS, DRAINPIPES — every way out of the house has a way back in
//  · three windows have a latch on the sill you can push: the kitchen's over the sink (out into the light well),
//    the living room's and her bedroom's at the front (out over the flower bed). The lower left light swings
//    out; climb through and drop
//  · the family notice an open window: Mom comes over, shuts it and wonders who opened it
//  · the light well has a drainpipe up its corner, onto the back extension's roof; the extension's downpipes
//    go down to the garden at its back corners (and back up)
//  · the front door has a cat flap through into the living room, like the back door's
// =====================================================================
const WIN = { L: {}, g: null, flaps: [] };
const WIN_DEF = {
  win_l: { name: '客廳窗閂', x0: 700, x1: 850, mid: 775, y0: 100, y1: 206, gy: [100, 210], tr: 174.8, zi: 238, out: 1, latch: [712, 100, 225], nav: 'lwin', gap: [244, 252], fy: 100, wy: 210 },
  win_u: { name: '睡房窗閂', x0: 574, x1: 666, mid: 620, y0: 342, y1: 450, gy: [340, 450], tr: 414.8, zi: 238, out: 1, latch: [588, 342, 229], nav: 'uwin', gap: [244, 252], fy: 340, wy: 450 },
  win_k: { name: '廚房窗閂', x0: -150, x1: -50, mid: -100, y0: 110, y1: 190, gy: [111, 189], tr: 150, zi: -228, out: -1, latch: [-140, 110, -218], nav: 'sink' }
};
// (Mom walks to a window by these: one in front of the living-room window)
navN('lwin', 775, 192); navL('lwin', 'lsofa'); navL('lwin', 'ltv');

function buildWindows(P) {
  const K = kitchenMats(), KV = ZONES.kitchen.lv, white = MAT.white, g = WIN.g = new THREE.Group(); scene.add(g); const kv0 = KV.children.length;
  const brass = K.brass || new THREE.MeshStandardMaterial({ color: 0xc8a050, metalness: .8, roughness: .3 });
  for (const [id, D] of Object.entries(WIN_DEF)) {
    const W = WIN.L[id] = { id, D, a: 0, tgt: 0, out: D.out, ext: OUT.win && OUT.win[id] }, cx1 = D.mid - 1.5, cy1 = D.tr - 1.4, rot = D.out > 0 ? Math.PI : 0;
    // the room's own glass: hidden, and laid again in three pieces (the lower left one on hinges)
    KV.traverse(m => { if (m.isMesh && m.material === MAT.glassThin && Math.abs(m.position.z - D.zi) < .6 && m.position.x > D.x0 && m.position.x < D.x1 && m.position.y > D.gy[0] && m.position.y < D.gy[1]) m.visible = false; });
    const pane = (u0, u1, v0, v1, parent, ox = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(u1 - u0, v1 - v0), MAT.glassThin); m.position.set((u0 + u1) / 2 - ox, (v0 + v1) / 2, parent === g ? D.zi : 0); m.rotation.y = rot; parent.add(m); return m; };
    pane(cx1, D.x1, D.gy[0], D.gy[1], g); pane(D.x0, cx1, cy1, D.gy[1], g);
    const pv = new THREE.Group(); pv.position.set(D.x0, 0, D.zi); g.add(pv); W.pv = pv; pane(D.x0, cx1, D.gy[0], cy1, pv, D.x0);
    const fb = (x0, x1, y0, y1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, 1.6), white); m.position.set((x0 + x1) / 2 - D.x0, (y0 + y1) / 2, 0); m.castShadow = false; pv.add(m); };
    fb(D.x0, cx1, D.gy[0], D.gy[0] + 1.6); fb(D.x0, cx1, cy1 - 1.6, cy1); fb(D.x0, D.x0 + 1.6, D.gy[0], cy1); fb(cx1 - 1.6, cx1, D.gy[0], cy1);
    // the bars the casement shuts against (where the room's window didn't have them)
    const zz = D.zi + D.out * -.8; box(D.mid - 1.5, D.mid + 1.5, D.gy[0], D.gy[1], zz - 1.2, zz + 1.2, white, { parent: g, col: false }); box(D.x0, D.mid - 1.5, D.tr - 1.4, D.tr + 1.4, zz - 1.2, zz + 1.2, white, { parent: g, col: false });
    // its colliders: the room's glass made the right-hand piece, the top-left piece and the casement added
    const old = cols.find(c => c.t === 'b' && c.noRay && Math.abs(c.x0 - D.x0) < .1 && Math.abs(c.x1 - D.x1) < .1 && c.z0 < D.zi && c.z1 > D.zi && c.y0 < D.y1 && c.y1 > D.y0);
    const z0 = old ? old.z0 : D.zi - 1, z1 = old ? old.z1 : D.zi + 1; if (old) old.x0 = cx1; else cols.push({ t: 'b', x0: cx1, x1: D.x1, y0: D.y0, y1: D.y1, z0, z1, noRay: true });
    cols.push({ t: 'b', x0: D.x0, x1: cx1, y0: cy1, y1: D.y1, z0, z1, noRay: true }); W.ci = { t: 'b', x0: D.x0, x1: cx1, y0: D.y0, y1: cy1, z0, z1, noRay: true }; cols.push(W.ci); W.cy = [D.y0, cy1];
    // between the room's wall and the outside wall (the front ones): a floor and linings through the gap
    if (D.gap) { const [a, b] = D.gap; box(D.x0, D.x1, D.fy - 4, D.fy, a, b, white, { parent: KV }); box(D.x0, D.x1, D.wy, D.wy + 4, a, b, white, { parent: KV, col: false }); box(D.x0 - 2, D.x0, D.fy, D.wy, a, b, white, { parent: KV }); box(D.x1, D.x1 + 2, D.fy, D.wy, a, b, white, { parent: KV }); }
    // the latch on the sill: a little brass lever
    const [lx, ly, lz] = D.latch, lg = new THREE.Group(); lg.position.set(lx, ly + .4, lz); KV.add(lg); lg.userData.noSolid = true;
    mesh(new THREE.BoxGeometry(6, .8, 4), brass, 0, 0, 0, { parent: lg, cast: false }); const lev = new THREE.Group(); lev.position.y = .4; lg.add(lev); mesh(new THREE.BoxGeometry(1.4, 5, 1.4), brass, 0, 2.5, 0, { parent: lev }); mesh(new THREE.SphereGeometry(1.3, 10, 8), brass, 0, 5.2, 0, { parent: lev });
    W.o = hxAdd({ id, name: D.name, kind: 'win', p: V3(lx, ly + 3, lz), r: 15, on: false, toggle: lev, verb: ['閂窗', '推開窗'] }); hxApply(W.o, true);
  }
  // ---- the light well: a parapet round its top, a soffit under the house's back wall, a drainpipe up the corner ----
  { const ext = new THREE.MeshStandardMaterial({ color: 0xb9c2c4, roughness: .9 }), cap = OUT.M.trim, pipe = OUT.M.gut;
    box(-163, -157, 266, 322, -312, -262, ext, { parent: KV }); box(-46, -40, 270, 322, -312, -262, ext, { parent: KV }); box(-163, -40, 270, 318, -314, -308, ext, { parent: KV });
    box(-164, -156, 322, 324, -313, -262, cap, { parent: KV, col: false }); box(-47, -39, 322, 324, -313, -262, cap, { parent: KV, col: false }); box(-164, -39, 318, 320, -315, -307, cap, { parent: KV, col: false });
    box(-157, -46, 266, 300, -264, -262, ext, { parent: KV }); box(-157, -46, 296, 300, -262, -232, ext, { parent: KV, col: false });
    cyl(-151, -295, 3, .2, 318, pipe, { parent: KV, seg: 12, col: false }); for (let y = 40; y < 310; y += 60) box(-157, -148, y, y + 3, -297, -293, OUT.M.metal, { parent: KV, col: false });
    box(-155, -147, 316, 320, -300, -290, pipe, { parent: KV, col: false });
    cols.push({ t: 'b', x0: -154.5, x1: -147.5, y0: .2, y1: 320, z0: -298.5, z1: -291.5, grip: true });
    // (the extension's downpipes at its back corners: hold on and climb)
    for (const x of [-300, 754]) cols.push({ t: 'b', x0: x - 3.6, x1: x + 3.6, y0: GY, y1: outLean(-640) + 3, z0: -649.6, z1: -642.4, grip: true });
  }
  // ---- the front door: its inside (a white panelled door), the wall cut for it, a cat flap right through ----
  { const dw = new THREE.MeshPhysicalMaterial({ color: 0xece6da, roughness: .5, clearcoat: .2 }), pm = new THREE.MeshStandardMaterial({ color: 0x2c2e30, roughness: .5 }), M = OUT.M, red = M.door;
    // inside face (z 233…236) and outside face (z 255…258), each round the flap's hole (x 496…516, y 0…18)
    for (const [z0, z1, mat, par] of [[233, 236, dw, KV], [255, 258, red, P]]) { box(470, 496, 0, 210, z0, z1, mat, { parent: par, col: false }); box(516, 542, 0, 210, z0, z1, mat, { parent: par, col: false }); box(496, 516, 18, 210, z0, z1, mat, { parent: par, col: false });
      for (const [w, h, x, y] of [[24, 3, 506, 19.5], [3, 21, 494.5, 10], [3, 21, 517.5, 10]]) box(x - w / 2, x + w / 2, y - h / 2, y + h / 2, z0 - .8, z1 + .8, pm, { parent: par, col: false }); }
    box(496, 516, -.2, 0, 236, 255, pm, { parent: KV, col: false }); box(495, 497, 0, 18, 236, 255, pm, { parent: KV, col: false }); box(515, 517, 0, 18, 236, 255, pm, { parent: KV, col: false }); box(496, 516, 17, 19, 236, 255, pm, { parent: KV, col: false });
    box(470, 542, -10, 0, 240, 252, M.conc, { parent: KV, cast: false });                                    // (a threshold under it)
    for (const [x0, x1, y0] of [[470, 496, 0], [516, 542, 0], [496, 516, 18]]) cols.push({ t: 'b', x0, x1, y0, y1: 210, z0: 233, z1: 258 });
    // inside: an architrave round the door, a brass knob, a doormat
    for (const [x0, x1, y0, y1] of [[462, 470, 0, 218], [542, 550, 0, 218], [462, 550, 210, 218]]) box(x0, x1, y0, y1, 229.5, 232, white, { parent: KV, col: false });
    mesh(new THREE.SphereGeometry(2.4, 14, 10), K.brass, 535, 100, 231, { parent: KV, cast: false });
    box(471, 541, 0, .4, 196, 230, new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 1 }), { parent: KV, cast: false, col: false });
    // outside: the knob and the letter slot
    box(531, 535, 96, 104, 258, 261, M.brass, { parent: P, col: false }); box(493, 519, 104, 109, 258, 258.8, M.brass, { parent: P, col: false });
    for (const [y0, y1] of [[24, 92], [112, 196]]) for (const [x0, x1] of [[476, 493], [519, 536]]) box(x0, x1, y0, y1, 258, 258.6, red, { parent: P, col: false });
    // the flap: on the outside face, hinged at the top
    const pv = new THREE.Group(); pv.position.set(506, 18, 256.5); P.add(pv); mesh(new THREE.BoxGeometry(19.4, 17.4, .8), new THREE.MeshPhysicalMaterial({ color: 0x3a3a38, roughness: .2, transparent: true, opacity: .55, clearcoat: .6 }), 0, -8.8, 0, { parent: pv, cast: false });
    WIN.flaps.push({ pv, x0: 494, x1: 518, z0: 226, z1: 270, mid: 256, inSide: -1, a: 0 });
  }
  // (what's added to the house's rooms here keeps the colliders it was given: no loose props, no extra solids)
  for (let i = kv0; i < KV.children.length; i++) KV.children[i].userData.noSolid = true;
}

// a window being opened or shut (runs on everyone)
function winApply(o, quiet) {
  const W = WIN.L[o.id]; if (!W) return; W.tgt = o.on ? 1.25 : 0;
  const set = (c, on) => { if (!c) return; if (on) { c.y0 = -999; c.y1 = -998; } else { c.y0 = c._y0; c.y1 = c._y1; } };
  for (const c of [W.ci, W.ext && W.ext.col]) if (c && c._y0 === undefined) { c._y0 = c.y0; c._y1 = c.y1; }
  set(W.ci, o.on); set(W.ext && W.ext.col, o.on);
  if (!o.on) {   // shut on someone half through: they're put out on the sill
    const D = W.D, zOut = D.out > 0 ? 266 : D.zi - 10; for (const C of party) { const p = C.pos; if (p.x > D.x0 && p.x < D.mid && p.y > D.y0 - 4 && p.y < W.cy[1] && (D.out > 0 ? p.z > D.zi - 3 && p.z < 264 : p.z < D.zi + 3 && p.z > D.zi - 10)) { p.z = zOut; C.vel.set(0, 0, 0); } } }
  if (!quiet && o.on && !NET.client) toastW(o.id === 'win_k' ? '窗推開咗——出面係天井' : '窗推開咗——小心，出面好高', 2.4);
}
function windowsTick(dt) {
  for (const W of Object.values(WIN.L)) { W.a = damp(W.a, W.tgt, W.tgt > W.a ? 2.2 : 3.2, dt); if (W.pv) W.pv.rotation.y = -W.out * W.a; if (W.ext) { const v = W.a < .03; W.ext.gl.visible = v; W.ext.cu.visible = v; } }
  for (const F of WIN.flaps) { let want = 0;
    for (const C of party) { if (C.frozen) continue; const p = C.pos; if (p.x > F.x0 && p.x < F.x1 && p.y < 16 && p.z > F.z0 && p.z < F.z1) { want = (p.z > F.mid) === (F.inSide < 0) ? 1.1 : -1.1; break; } }
    F.a = damp(F.a, want, want ? 14 : 5, dt); F.pv.rotation.x = F.a; }
}
// hints: the latch, the cat flap from inside
function winHint(L) {
  const p = L.pos; if (p.x > 466 && p.x < 546 && p.z > 150 && p.z < 236 && p.y < 20) return '前門底有個貓門——鑽出去係前院';
  if (p.x > 720 && p.x < 830 && p.z > 150 && p.z < 232 && p.y < 30) return '窗台上有個窗閂——爬上窗簾，推開佢就出得去';
  if (p.x > 560 && p.x < 680 && p.z > 150 && p.z < 232 && p.y > 290 && p.y < 330) return '窗座上面有個窗閂——推開就出得去（好高，跌落前院花槽）';
  return '';
}
