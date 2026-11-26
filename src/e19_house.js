// =====================================================================
//  THE HOUSE COMES ALIVE — kitchen, living room and a new bathroom
//  · a bathroom behind the kitchen (door between the fridge and the living-room wall): Hong Kong
//    "紙皮石" mosaic floor, a toilet you can climb and flush, a pedestal sink, a mirror cabinet,
//    a towel, a laundry basket full of towels under the ceiling fan
//  · a duct through the ceiling void: cooker hood → chimney → over the back wall → the bathroom fan.
//    A spinning fan blocks its end of the duct: switch it off to get through. You drop into the
//    laundry basket. The hot air over the lit burner lifts you up into the hood
//  · things anyone can switch (E / 用): kitchen lights, the sink tap (the basin fills and you float),
//    the cooker hood (fan + light — loud enough that the family hears less), the bathroom light + fan,
//    the toilet flush, the TV, the floor lamp. The family notices every one of them (e20_brain)
// =====================================================================
const HX = { list: [], id: {}, water: 0, bd: { a: 1.35, tgt: 1.35, segs: [] }, snd: {}, flushT: 0, near: null, ring: null, pend: [], hood: null, bfan: null };
const BATH = { x0: 150, x1: 460, z0: -470, z1: -244, ceil: 250, door: [236, 298] };

// ---------- textures ----------
function genMosaic() {
  // 紙皮石: paper-backed mosaic, pale mint / cream / sky with the odd darker chip
  const [c, x] = cnv(512, 512); x.fillStyle = '#b9b5aa'; x.fillRect(0, 0, 512, 512);
  const pal = ['#e3ece8', '#d6e6e1', '#eee9db', '#cfe1dd', '#f3f0e8', '#dde8ea', '#c4dcd6'];
  for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
    const k = rnd(); x.fillStyle = k < .05 ? '#8fb7ae' : k < .08 ? '#d9b7a0' : pal[(rnd() * pal.length) | 0];
    const px = i * 32 + 2 + R(-.6, .6), py = j * 32 + 2 + R(-.6, .6); x.fillRect(px, py, 28, 28);
    const g = x.createLinearGradient(px, py, px + 28, py + 28); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(0,0,0,.06)'); x.fillStyle = g; x.fillRect(px, py, 28, 28);
  }
  return tex(c);
}
function genWallTile() {
  const [c, x] = cnv(256, 256); x.fillStyle = '#c8c3b6'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const g = x.createLinearGradient(0, j * 64, 0, j * 64 + 64); g.addColorStop(0, '#f7f5ef'); g.addColorStop(1, '#ebe7dc'); x.fillStyle = g; x.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(i * 64 + 6, j * 64 + 5, 30, 3); }
  return tex(c);
}
function genBasket() {
  // a pastel plastic laundry basket, rows of rounded slots (very Hong Kong)
  const [c, x] = cnv(256, 256); x.fillStyle = '#a8d8e8'; x.fillRect(0, 0, 256, 256);
  const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(0,40,60,.08)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  x.fillStyle = '#4c6f7c'; for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) { const px = i * 64 + 14 + (r % 2) * 32, py = r * 64 + 22; x.beginPath(); x.roundRect ? x.roundRect(px - 32 * (px > 230), py, 36, 18, 9) : x.rect(px, py, 36, 18); x.fill(); }
  x.fillStyle = 'rgba(255,255,255,.5)'; for (let r = 0; r < 4; r++) x.fillRect(0, r * 64 + 4, 256, 3);
  return tex(c);
}
let BMAT = null;
function bathMats(K) {
  if (BMAT) return BMAT;
  BMAT = {
    mosaic: new THREE.MeshPhysicalMaterial({ map: genMosaic(), roughness: .35, clearcoat: .35 }),
    tile: new THREE.MeshPhysicalMaterial({ map: genWallTile(), roughness: .18, clearcoat: .7 }),
    paint: new THREE.MeshStandardMaterial({ color: 0xdde6e1, roughness: .92, map: K.wall.map || null }),
    porc: new THREE.MeshPhysicalMaterial({ color: 0xf5f4f0, roughness: .1, clearcoat: 1, clearcoatRoughness: .04 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xe6eaee, metalness: 1, roughness: .1 }),
    mirror: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: .03, envMapIntensity: 1.2 }),
    towel: new THREE.MeshPhysicalMaterial({ color: 0xe39a72, roughness: 1, sheen: 1, sheenColor: 0xffd6c0 }),
    towel2: new THREE.MeshPhysicalMaterial({ color: 0x8fb8d8, roughness: 1, sheen: 1, sheenColor: 0xd8ecff }),
    wicker: new THREE.MeshPhysicalMaterial({ map: genBasket(), roughness: .35, clearcoat: .5 }),
    duct: new THREE.MeshStandardMaterial({ map: K.steel.map, color: 0xc4cacd, metalness: .5, roughness: .48 }),
    water: new THREE.MeshPhysicalMaterial({ color: 0x9fd0e0, roughness: .03, transparent: true, opacity: .6, clearcoat: 1, depthWrite: false }),
    plate: new THREE.MeshPhysicalMaterial({ color: 0xf4f1ea, roughness: .35, clearcoat: .4 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0d8, emissiveIntensity: 5 }),
    frost: new THREE.MeshStandardMaterial({ color: 0x2a3446, emissive: 0x31405a, emissiveIntensity: .7, roughness: .4 })
  };
  return BMAT;
}

// ---------- the cooker hood: hollow, with a way in from below and a fan at the chimney ----------
function buildHood(K) {
  const S = K.steel, B = { x0: -2, x1: 78, z0: -220, z1: -172 };
  // bottom plate with the grease-filter slot open over the hot burner (the hot air lifts you in)
  box(B.x0, 44, 158, 160, B.z0, B.z1, S, { uv: 60 }); box(70, B.x1, 158, 160, B.z0, B.z1, S, { uv: 60 });
  box(44, 70, 158, 160, B.z0, -214, S); box(44, 70, 158, 160, -196, B.z1, S);
  // top plate with the chimney hole
  box(B.x0, 16, 184, 186, B.z0, B.z1, S); box(60, B.x1, 184, 186, B.z0, B.z1, S); box(16, 60, 184, 186, -198, B.z1, S);
  // sides
  box(B.x0, B.x1, 160, 184, -174, B.z1, S, { uv: 60 }); box(B.x0, 0, 160, 184, B.z0, -174, S); box(76, B.x1, 160, 184, B.z0, -174, S);
  // chimney: hollow, climbable inside, up through the ceiling into the duct
  box(14, 16, 186, 270, -220, -196, S, { uv: 60 }); box(60, 62, 186, 270, -220, -196, S, { uv: 60 }); box(16, 60, 186, 270, -198, -196, S, { uv: 60 }); box(16, 60, 186, 270, -220, -218, S);
  // the fan at the foot of the chimney (blocks the way up while it's running)
  const fg = new THREE.Group(); fg.position.set(38, 189, -208); LV.add(fg);
  const bm = new THREE.MeshStandardMaterial({ color: 0x3a3e42, metalness: .6, roughness: .45 });
  mesh(new THREE.CylinderGeometry(2.4, 2.4, 3, 16), bm, 0, 0, 0, { parent: fg });
  for (let i = 0; i < 5; i++) { const b = mesh(new THREE.BoxGeometry(9, .5, 4), bm, 0, 0, 0, { parent: fg }); b.geometry.translate(5.5, 0, 0); b.rotation.set(.35, i * Math.PI * 2 / 5, 0); }
  const col = { t: 'b', x0: 16, x1: 60, y0: -999, y1: -998, z0: -218, z1: -198, zone: 'kitchen' }; cols.push(col);
  HX.hood = { g: fg, col, y: [186, 193] };
  // the hot air over the lit burner, rising into the empty filter slot: a faint shimmer you can see from the worktop
  { const [c, x] = cnv(64, 128); for (let i = 0; i < 46; i++) { const x0 = rnd() * 64, a = .08 + rnd() * .22, w = 1 + rnd() * 2.5, ph = rnd() * 6.3, k = 2 + rnd() * 3;
      x.strokeStyle = `rgba(255,${170 + (rnd() * 60 | 0)},${110 + (rnd() * 60 | 0)},${a})`; x.lineWidth = w; x.beginPath();
      for (let y = -4; y <= 132; y += 4) { const px = x0 + Math.sin(y / 128 * Math.PI * k + ph) * 3; y < 0 ? x.moveTo(px, y) : x.lineTo(px, y); } x.stroke(); }
    const [c2, x2] = cnv(4, 64); const g = x2.createLinearGradient(0, 64, 0, 0); g.addColorStop(0, '#000'); g.addColorStop(.12, '#bbb'); g.addColorStop(.55, '#fff'); g.addColorStop(.9, '#555'); g.addColorStop(1, '#000'); x2.fillStyle = g; x2.fillRect(0, 0, 4, 64);
    const st = tex(c), fade = new THREE.CanvasTexture(c2); st.repeat.set(2, 1);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 6, 69, 24, 1, true), new THREE.MeshBasicMaterial({ map: st, alphaMap: fade, color: 0xffb070, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.position.set(57, 89 + 34.5, -205); m.renderOrder = 3; LV.add(m); HX.heat = m; }
  // the control panel on the hood's right side (next to the wall cupboards)
  box(78, 78.6, 164, 182, -185, -174, MAT.black, { col: false });
  HX.hoodLed = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x5fe08a, emissiveIntensity: 1.2 });
  for (let i = 0; i < 3; i++) mesh(new THREE.CylinderGeometry(1, 1, .8, 12), i === 0 ? HX.hoodLed : MAT.dsteel || S, 79, 178 - i * 5, -179.5, { cast: false }).rotation.z = Math.PI / 2;
}

// the hood seen from below: grease filters, two little lamps, and one filter missing — the way in
function hoodUnderside(K) {
  const [c, x] = cnv(128, 128); x.fillStyle = '#3c3f42'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#23262a'; for (let i = 0; i < 128; i += 8) for (let j = 0; j < 128; j += 4) x.fillRect(i + (j % 8 ? 4 : 0), j, 3, 2);
  const fm = new THREE.MeshStandardMaterial({ map: tex(c), metalness: .6, roughness: .5 }); fm.map.repeat.set(3, 2);
  const pl = (x0, x1, z0, z1) => { const m = mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), fm, (x0 + x1) / 2, 157.85, (z0 + z1) / 2, { cast: false }); m.rotation.x = Math.PI / 2; };
  pl(2, 40, -216, -194); pl(74 - 0, 76, -216, -194); pl(2, 76, -192, -178);   // filters (one slot left empty over the burner)
  const lip = new THREE.MeshStandardMaterial({ color: 0xd8dde2, metalness: .9, roughness: .25 });
  box(43, 71, 157.6, 158, -215, -214, lip, { col: false }); box(43, 71, 157.6, 158, -196, -195, lip, { col: false }); box(43, 44, 157.6, 158, -215, -195, lip, { col: false }); box(70, 71, 157.6, 158, -215, -195, lip, { col: false });
  for (const lx of [12, 64]) { const d = mesh(new THREE.CircleGeometry(3.2, 24), HX.hoodBulb, lx, 157.7, -183, { cast: false }); d.rotation.x = Math.PI / 2; }
}
// ---------- the bathroom ----------
function buildBathroom(K) {
  const M = bathMats(K), { x0, x1, z0, z1, ceil } = BATH, [d0, d1] = BATH.door;
  // floor, walls, ceiling (with the fan hole), the doorway
  box(x0, x1, -10, 0, z0, -238, M.mosaic, { uv: 70, cast: false });
  box(d0, d1, 0, .8, -244, -230, new THREE.MeshPhysicalMaterial({ color: 0xe9e6de, roughness: .25, clearcoat: .6 }), { cast: false });   // marble threshold
  box(x0 - 12, x1 + 12, 0, ceil + 10, z0 - 12, z0, M.paint, { uv: 120 });
  box(x0 - 12, x0, 0, ceil + 10, z0, -232, M.paint, { uv: 120 }); box(x1, x1 + 12, 0, ceil + 10, z0, -244, M.paint, { uv: 120 });
  box(x0, 196, 0, ceil + 10, -244, -232, M.paint, { uv: 120 }); box(206, d0, 0, ceil + 10, -244, -232, M.paint, { uv: 120 }); box(196, 206, 8, ceil + 10, -244, -232, M.paint, { uv: 120 }); box(d1, 312, 0, ceil + 10, -244, -232, M.paint, { uv: 120 }); box(d0, d1, 205, ceil + 10, -244, -232, M.paint, { uv: 120 });
  box(x0 - 12, 348, ceil, ceil + 10, z0 - 12, -232, M.paint, { cast: false }); box(372, x1 + 12, ceil, ceil + 10, z0 - 12, -232, M.paint, { cast: false });
  box(348, 372, ceil, ceil + 10, z0 - 12, -330, M.paint, { cast: false }); box(348, 372, ceil, ceil + 10, -308, -232, M.paint, { cast: false });
  // white tiles up to shoulder height, a narrow trim on top
  const tl = (a0, a1, b, axis) => axis === 'z' ? box(a0, a1, 0, 140, b - .2, b + .2, M.tile, { col: false, uv: 32, cast: false }) : box(b - .2, b + .2, 0, 140, a0, a1, M.tile, { col: false, uv: 32, cast: false });
  tl(x0, x1, z0 + .3, 'z'); tl(z0, -244, x0 + .3, 'x'); tl(z0, -244, x1 - .3, 'x'); tl(x0, 196, -244.3, 'z'); tl(206, d0, -244.3, 'z'); tl(d1, 330, -244.3, 'z'); tl(340, x1, -244.3, 'z'); box(196, 206, 8, 140, -244.5, -244.1, M.tile, { col: false, cast: false }); box(330, 340, 8, 140, -244.5, -244.1, M.tile, { col: false, cast: false });
  box(x0, x1, 140, 142, z0, z0 + 1.2, M.porc, { col: false }); box(x0, x0 + 1.2, 140, 142, z0, -244, M.porc, { col: false }); box(x1 - 1.2, x1, 140, 142, z0, -244, M.porc, { col: false });
  // the door: hinged on the right, swings into the bathroom
  { const g = new THREE.Group(); g.position.set(d1 - 1, 0, -240); LV.add(g); HX.bd.g = g;
    const dm = new THREE.MeshPhysicalMaterial({ color: 0xe9e2d4, roughness: .55, clearcoat: .2 });
    mesh(new THREE.BoxGeometry(60, 203, 3), dm, -30, 101.5, 0, { parent: g }); mesh(new THREE.SphereGeometry(2, 14, 10), K.brass, -55, 98, 2.6, { parent: g }); mesh(new THREE.SphereGeometry(2, 14, 10), K.brass, -55, 98, -2.6, { parent: g });
    mesh(new THREE.BoxGeometry(40, 18, .6), new THREE.MeshStandardMaterial({ color: 0xd8cfbe, roughness: .7 }), -30, 150, 1.8, { parent: g, cast: false });
    for (let i = 0; i < 8; i++) { const c = { t: 'b', x0: 0, x1: 0, y0: 0, y1: 203, z0: 0, z1: 0, door: true }; cols.push(c); HX.bd.segs.push(c); }
    box(d0 - 3, d0, 0, 205, -246, -230, MAT.white, { col: false }); box(d1, d1 + 3, 0, 205, -246, -230, MAT.white, { col: false }); box(d0 - 3, d1 + 3, 205, 209, -246, -230, MAT.white, { col: false }); }
  // ---- toilet (back against the far wall) ----
  { const cx = 400, P = M.porc;
    box(382, 418, 38, 76, z0, -452, P); box(380, 420, 76, 79, z0 - .5, -450, P);                   // cistern + lid (stand on it to reach the lever)
    const lv = mesh(new THREE.CylinderGeometry(.8, .8, 9, 12), M.chrome, 377.5, 70, -455); lv.rotation.z = Math.PI / 2; HX.lever = lv;
    mesh(new THREE.SphereGeometry(1.6, 14, 10), M.chrome, 381.6, 70, -455);
    box(388, 412, 0, 20, -447, -414, P);                                                            // foot
    const bowl = mesh(new THREE.LatheGeometry([V3(9, 0, 0), V3(13, 4, 0), V3(17, 12, 0), V3(18.6, 20, 0), V3(18.2, 20.5, 0), V3(16, 12, 0), V3(10, 4, 0), V3(6, 1, 0)], 40), P, cx, 20, -428, { cast: true }); bowl.scale.z = 1.22;
    for (const [y0, y1, rx, rz, h] of [[20, 25, 11, 13.4, 2.4], [25, 31, 14.2, 17.3, 2.5], [31, 41, 16.4, 20, 2.6]]) for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2, x = cx + Math.cos(a) * rx, z = -428 + Math.sin(a) * rz; cols.push({ t: 'b', x0: x - h, x1: x + h, y0, y1, z0: z - h, z1: z + h }); }
    const seat = mesh(new THREE.TorusGeometry(15.5, 2.4, 10, 40), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .3, clearcoat: .6 }), cx, 41.2, -428); seat.rotation.x = Math.PI / 2; seat.scale.y = 1.25;
    const lid = mesh(new THREE.CylinderGeometry(16, 16, 2, 36), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .3, clearcoat: .6 }), cx, 60, -449.4); lid.rotation.x = Math.PI / 2 - .12; lid.scale.x = .95;
    box(388, 412, 20, 22, -446, -410, M.water, { cast: false });                                    // water in the bowl (you can stand in it… until someone flushes)
    HX.bowl = { x0: 386, x1: 414, z0: -448, z1: -408 };
    // paper on the wall beside it
    box(x1 - 1, x1, 58, 62, -428, -412, M.chrome, { col: false }); const roll = mesh(new THREE.CylinderGeometry(5.5, 5.5, 11, 24), new THREE.MeshStandardMaterial({ color: 0xfbfaf6, roughness: .95 }), x1 - 7, 56, -420); roll.rotation.x = Math.PI / 2;
    cols.push({ t: 'c', x: x1 - 7, z: -420, r: 5.5, y0: 50.5, y1: 61.5, m: roll });
    // a shelf above the cistern: spare rolls, an air freshener, a little plant
    box(370, 430, 120, 123, z0, -456, new THREE.MeshStandardMaterial({ color: 0xf0ece2, roughness: .5 }));
    for (const [x, h, c] of [[378, 12, 0xfbfaf6], [390, 12, 0xfbfaf6], [404, 16, 0x7ec8c0], [420, 9, 0x6aa04a]]) cyl(x, -463, 4.8, 123, 123 + h, new THREE.MeshStandardMaterial({ color: c, roughness: .7 }), { seg: 18 });
  }
  // ---- pedestal sink + mirror cabinet ----
  { const P = M.porc;
    cyl(215, -456, 7.5, 0, 70, P, { seg: 28 });
    box(190, 240, 70, 84, z0, -432, P);
    const bw = mesh(new THREE.SphereGeometry(18, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), P, 215, 84.2, -450, { cast: false }); bw.scale.set(1.1, .5, .85);
    cyl(215, -466, 1.8, 84, 96, M.chrome, { seg: 16 }); const sp = mesh(new THREE.CylinderGeometry(1.4, 1.4, 11, 12), M.chrome, 215, 95, -461); sp.rotation.x = Math.PI / 2;
    // the cabinet: open, with two glass-ish shelves; climb up from the basin
    const cm = new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: .5 });
    box(188, 242, 108, 110, z0, -458, cm); box(188, 242, 180, 182, z0, -458, cm); box(188, 190, 110, 180, z0, -458, cm); box(240, 242, 110, 180, z0, -458, cm);
    box(190, 240, 132, 133.5, z0, -460, M.plate); box(190, 240, 156, 157.5, z0, -460, M.plate);
    const dg = new THREE.Group(); dg.position.set(242, 145, -458); dg.rotation.y = -1.75; LV.add(dg);
    mesh(new THREE.BoxGeometry(53, 72, 1.6), cm, -26.5, 0, 0, { parent: dg }); mesh(new THREE.PlaneGeometry(50, 69), M.mirror, -26.5, 0, .9, { parent: dg, cast: false });
    for (const [x, y, h, r, c] of [[196, 110, 12, 2.6, 0x3a7ac0], [204, 110, 8, 3, 0xe8e2d0], [232, 110, 14, 2.4, 0xd05a6a], [198, 133.5, 10, 2.2, 0x6ab07a], [226, 133.5, 7, 3.4, 0xf0d070], [212, 157.5, 11, 2.6, 0xb08ad0]]) cyl(x, -465, r, y, y + h, new THREE.MeshPhysicalMaterial({ color: c, roughness: .3, clearcoat: .6 }), { seg: 16 });
    box(214, 230, 110, 114, -468, -462, new THREE.MeshStandardMaterial({ color: 0x2f6fb0, roughness: .6 }));   // toothpaste box
  }
  // ---- towel on a rail (soft, climbable) ----
  box(x0, x0 + 3, 128, 131, -400, -330, M.chrome, { col: false });
  box(x0 + 1.5, x0 + 6, 70, 132, -396, -334, M.towel, { uv: 40 });
  // ---- laundry basket under the fan: land in the towels ----
  { const bx0 = 336, bx1 = 384, bz0 = -344, bz1 = -296, h = 52, W = 2;
    box(bx0, bx1, 0, h, bz0, bz0 + W, M.wicker, { uv: 48 }); box(bx0, bx1, 0, h, bz1 - W, bz1, M.wicker, { uv: 48 }); box(bx0, bx0 + W, 0, h, bz0 + W, bz1 - W, M.wicker, { uv: 48 }); box(bx1 - W, bx1, 0, h, bz0 + W, bz1 - W, M.wicker, { uv: 48 });
    { const rm = new THREE.MeshPhysicalMaterial({ color: 0x8cc4d8, roughness: .3, clearcoat: .6 }); box(bx0 - 1, bx1 + 1, h, h + 2.4, bz0 - 1, bz0 + W + 1, rm); box(bx0 - 1, bx1 + 1, h, h + 2.4, bz1 - W - 1, bz1 + 1, rm); box(bx0 - 1, bx0 + W + 1, h, h + 2.4, bz0 + W + 1, bz1 - W - 1, rm); box(bx1 - W - 1, bx1 + 1, h, h + 2.4, bz0 + W + 1, bz1 - W - 1, rm); }   // rolled rim (a ring: the basket is open)
    box(bx0 + W, bx1 - W, 0, 40, bz0 + W, bz1 - W, M.towel2, { uv: 30 });
    for (let i = 0; i < 6; i++) { const t = mesh(new THREE.SphereGeometry(R(7, 11), 18, 12), [M.towel, M.towel2, new THREE.MeshPhysicalMaterial({ color: 0xf2ede2, roughness: 1, sheen: 1 })][i % 3], R(bx0 + 10, bx1 - 10), 40 + R(0, 3), R(bz0 + 10, bz1 - 10)); t.scale.y = .4; }
  }
  // ---- bath mats ----
  for (const [x, z, w, d, c] of [[400, -378, 64, 34, 0x9cc8d8], [215, -410, 52, 30, 0xe8c0a8]]) { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); const m = furMesh(g, furMat({ color: c, len: .5, den: 2.4, droop: .15, clump: .5, root: .6, rimK: .04 })); m.position.set(x, .3, z); LV.add(m); cols.push({ t: 'b', x0: x - w / 2, x1: x + w / 2, y0: 0, y1: .3, z0: z - d / 2, z1: z + d / 2, small: true }); }
  // ---- frosted window, ceiling light, extractor fan ----
  box(270, 340, 150, 206, z0 - .4, z0 + .2, M.frost, { col: false, cast: false }); box(268, 342, 148, 150, z0, z0 + 2, MAT.white, { col: false }); box(268, 342, 206, 208, z0, z0 + 2, MAT.white, { col: false });
  const lampM = M.lamp.clone(); mesh(new THREE.CylinderGeometry(14, 15, 2.4, 32), lampM, 300, ceil - 1.2, -357, { cast: false });
  const bl = pointL(0xfff1dc, 0, 300, ceil - 8, -357); const spec = { p: V3(300, ceil - 8, -357), range: 300, on: false }; KS.lights.push(spec);
  HX.blight = { l: bl, spec, mat: lampM, I: 7200 };
  // fan: louvres in the ceiling, blades above them
  for (let i = 0; i < 5; i++) box(349, 371, ceil - .8, ceil, -329 + i * 4.6, -327.6 + i * 4.6, MAT.white, { col: false, cast: false });
  box(346, 348, ceil, 270, -332, -306, M.duct); box(372, 374, ceil, 270, -332, -306, M.duct); box(348, 372, ceil, 270, -332, -330, M.duct); box(348, 372, ceil, 270, -308, -306, M.duct);
  const fg = new THREE.Group(); fg.position.set(360, 258, -319); LV.add(fg); const bm = new THREE.MeshStandardMaterial({ color: 0xdedad0, roughness: .5 });
  mesh(new THREE.CylinderGeometry(2.2, 2.2, 3, 14), bm, 0, 0, 0, { parent: fg }); for (let i = 0; i < 4; i++) { const b = mesh(new THREE.BoxGeometry(9.5, .5, 4.5), bm, 0, 0, 0, { parent: fg }); b.geometry.translate(5.5, 0, 0); b.rotation.set(.3, i * Math.PI / 2, 0); }
  const fcol = { t: 'b', x0: 348, x1: 372, y0: -999, y1: -998, z0: -330, z1: -308, zone: 'kitchen' }; cols.push(fcol);
  HX.bfan = { g: fg, col: fcol, y: [254, 262] };
  // a pull cord hangs from the fan's grille down into the laundry basket: grab it and the light (and the fan)
  // click off, then climb it up through the grille into the duct
  { const cx = 366, cz = -312, y0 = 41.5; const rope = new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: .85 });
    const cm = mesh(new THREE.CylinderGeometry(.32, .32, ceil - y0, 6), rope, cx, (ceil + y0) / 2, cz); cm.castShadow = true;
    const bob = mesh(new THREE.CylinderGeometry(.9, 1.3, 3.4, 14), new THREE.MeshStandardMaterial({ color: 0xf4f0e6, roughness: .4 }), cx, y0 + 1.2, cz); bob.castShadow = true;
    HX.bcord = { t: 'b', x0: cx - 1.1, x1: cx + 1.1, y0, y1: ceil - 1, z0: cz - 1.1, z1: cz + 1.1, grip: true, zone: 'kitchen' }; cols.push(HX.bcord); }
  // light leaking up through the fan into the duct
  HX.leak = pointL(0xfff1dc, 0, 360, 266, -319);
  // a battery for the curious: on the cistern shelf
  addBattery(392, 123, -463);
}

// ---------- the duct in the ceiling void ----------
function buildDuct(K) {
  const D = bathMats(K).duct;
  // segment A: from the top of the hood's chimney straight back over the kitchen's back wall
  box(14, 62, 268, 270, -330, -240, D); box(14, 16, 270, 294, -332, -196, D); box(60, 62, 270, 294, -306, -196, D); box(16, 60, 270, 294, -198, -196, D); box(14, 62, 292, 294, -332, -196, D);
  // segment B: along the back of the house to the bathroom fan
  box(62, 348, 268, 270, -330, -308, D); box(14, 374, 270, 294, -332, -330, D); box(62, 320, 270, 294, -308, -306, D); box(344, 374, 270, 294, -308, -306, D); box(372, 374, 270, 294, -330, -308, D); box(62, 374, 292, 294, -332, -306, D);
  // segment C: a branch before the fan, north over the bathroom, east over the living room, then north to the garage
  box(320, 344, 268, 270, -306, -240, D); box(318, 320, 270, 294, -306, -214, D); box(344, 346, 270, 294, -306, -238, D); box(320, 344, 292, 294, -306, -214, D);
  box(346, 904, 270, 294, -240, -238, D); box(320, 880, 270, 294, -214, -212, D); box(320, 600, 292, 294, -240, -212, D); box(624, 904, 292, 294, -240, -212, D); box(600, 624, 292, 294, -240, -232, D);
  box(904, 906, 270, 294, -240, 108, D); box(878, 880, 270, 294, -214, 134, D); box(878, 904, 292, 294, -214, 134, D);
  for (let x = 380; x < 880; x += 60) box(x, x + 1.2, 270, 292, -239.6, -239.2, new THREE.MeshStandardMaterial({ color: 0x8a9094, metalness: .8, roughness: .5 }), { col: false, cast: false });
  addBattery(620, 270, -226); addCrumb(892, 270, -40);
  pointL(0xffc890, 55, 600, 284, -226); pointL(0x9fc4ff, 50, 892, 284, 20);
  // seams, dust, a lost button and a vial: someone's been up here before
  for (let x = 80; x < 340; x += 48) box(x, x + 1.2, 270, 292, -330, -329.6, new THREE.MeshStandardMaterial({ color: 0x8a9094, metalness: .8, roughness: .5 }), { col: false, cast: false });
  const bun = furMat({ color: 0x8a8580, len: .6, den: 1.8, droop: .3, clump: .6, rimK: .05, root: .7 });
  for (const [x, z, r] of [[38, -262, 2], [120, -318, 2.6], [260, -322, 1.8], [30, -310, 1.4]]) { const b = furMesh(new THREE.SphereGeometry(r, 18, 12), bun); b.position.set(x, 270 + r * .6, z); b.scale.y = .6; LV.add(b); }
  addVial(200, 270, -319); addBattery(38, 270, -300);
  pointL(0xffc890, 70, 38, 284, -262); pointL(0x9fc4ff, 60, 200, 284, -319);
  // a seam that lets a thin line of cool night light in
  box(196, 204, 292.2, 292.6, -329, -309, new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x9fc4ff, emissiveIntensity: 2.2 }), { col: false, cast: false });
}

// ---------- secret passages: mouse holes in the walls, and a vent up into the duct ----------
//  · behind the fridge: a mouse hole through the back wall into the bathroom (open both ways)
//  · bathroom → living room: a mouse hole whose living-room end is hidden behind a skirting vent cover;
//    you can only unclip it from the living-room side — once open it's a shortcut both ways
//  · over the fish tank: a vent in the living room's far wall, its cover hanging off one screw; climb
//    into it from the tank's lid and up the shaft into the ceiling duct
//  · single player: the rusted living-room vent can be pushed open from the garage end of its duct
function mouseArch(x, y0, z, dir, mat, w = 10, h = 8) {
  // the wall over the hole's top corners, so the hole reads as an arch
  const r = w / 2, sh = new THREE.Shape(); sh.moveTo(-r, h - r); sh.absarc(0, h - r, r, Math.PI, 0, true); sh.lineTo(r, h); sh.lineTo(-r, h); sh.lineTo(-r, h - r);
  const m = mesh(new THREE.ShapeGeometry(sh, 16), mat, x, y0, z + dir * .06, { cast: false }); if (dir < 0) m.rotation.y = Math.PI; m.material.side = THREE.DoubleSide;
  // a dark mouth: the tunnel's back lies in shadow
  const d = mesh(new THREE.PlaneGeometry(w - .2, h - .2), new THREE.MeshBasicMaterial({ color: 0x0b0806, transparent: true, opacity: .55, depthWrite: false }), x, y0 + (h - .2) / 2, z - dir * 2.5, { cast: false }); if (dir < 0) d.rotation.y = Math.PI;
  return m;
}
function buildPassages(K) {
  const bm = bathMats(K), wallM = new THREE.MeshStandardMaterial({ color: 0xd9cbb5, roughness: .95, map: K.wall.map || null });
  // behind the fridge ↔ bathroom
  mouseArch(201, 0, -220, 1, K.wall); mouseArch(201, 0, -244, -1, bm.tile);
  // bathroom ↔ living room (the cover is on the living-room side)
  mouseArch(335, 0, -244, -1, bm.tile); mouseArch(335, 0, -232, 1, wallM);
  { const g = new THREE.Group(); g.position.set(335, 0, -231.2); LV.add(g); const wm = new THREE.MeshStandardMaterial({ color: 0xf1ede6, roughness: .5 });
    mesh(new THREE.BoxGeometry(13, 9.5, .8), wm, 0, 4.75, 0, { parent: g }); for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(10, .7, .5), new THREE.MeshStandardMaterial({ color: 0x8a847a, roughness: .7 }), 0, 1.8 + i * 1.9, .45, { parent: g, cast: false });
    HX.mhc = { g, col: { t: 'b', x0: 328.5, x1: 341.5, y0: 0, y1: 9.5, z0: -232, z1: -230.6, slick: true } }; cols.push(HX.mhc.col); }
  // the vent over the fish tank
  { const fm = new THREE.MeshStandardMaterial({ color: 0xe9e6e0, roughness: .45 });
    box(648, 668, 198, 200, -232, -231, fm, { col: false }); box(648, 668, 224, 226, -232, -231, fm, { col: false }); box(648, 650, 198, 226, -232, -231, fm, { col: false }); box(666, 668, 198, 226, -232, -231, fm, { col: false });
    const cg = new THREE.Group(); cg.position.set(649.5, 224.5, -230.6); cg.rotation.z = -.95; LV.add(cg); HX.ventCover = cg;   // hanging off its one remaining screw
    mesh(new THREE.BoxGeometry(18, 25, .7), fm, 9, -12.5, 0, { parent: cg }); for (let i = 0; i < 7; i++) mesh(new THREE.BoxGeometry(15, .8, .6), new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: .6 }), 9, -3 - i * 3.2, .3, { parent: cg, cast: false });
    mesh(new THREE.CylinderGeometry(.7, .7, .6, 8), new THREE.MeshStandardMaterial({ color: 0xb8b0a0, metalness: .7, roughness: .4 }), 649.5, 224.5, -230.4, { cast: false }).rotation.x = Math.PI / 2;
    pointL(0xffc890, 14, 658, 248, -238);   // a little warm light falls down the shaft from the duct
    mesh(new THREE.PlaneGeometry(16, 30), new THREE.MeshBasicMaterial({ color: 0x0b0806, transparent: true, opacity: .6, depthWrite: false }), 658, 215, -239.9, { cast: false }); }   // the shaft's depths   // a little warm light falls down the shaft from the duct
}
// the passages' own switches (only players use them; the family doesn't notice) — added with the house's switches
// ---------- what the family does once they're sure there are mice ----------
//  · stage 2 (起疑心): Mom puts down glue boards near where odd things happened. Step on one and you're stuck:
//    struggle free (Jump, costs stamina) or a teammate beside you pulls you off
//  · after a search finds nothing: she blocks the mouse hole she thinks they use with cardboard and tape —
//    only ever one with another way round. The bear can barge through it
const GLUE_SPOTS = [[-276, -100], [192, -128], [262, -268], [352, -268], [338, -212], [330, -20], [70, -120], [-120, -60]];
const SEALS = { seal_fh: { x: 201, hole: [196, 206] }, seal_lh: { x: 335, hole: [330, 340] } };
function buildMouseWar(K) {
  HX.glue = GLUE_SPOTS.map(([x, z]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = (x * 7 + z * 3) % 6.28; g.visible = false; LV.add(g);
    mesh(new THREE.BoxGeometry(16, .5, 11), new THREE.MeshStandardMaterial({ color: 0xe8d9b0, roughness: .8 }), 0, .25, 0, { parent: g, cast: false });
    mesh(new THREE.BoxGeometry(14.4, .25, 9.4), new THREE.MeshPhysicalMaterial({ color: 0xf2c93a, roughness: .08, clearcoat: 1, clearcoatRoughness: .02, transparent: true, opacity: .9 }), 0, .62, 0, { parent: g, cast: false });
    return { g, x, z };
  });
  for (const id in SEALS) { const S = SEALS[id], g = new THREE.Group(); g.position.set(S.x, 0, -244.9); g.visible = false; LV.add(g);
    mesh(new THREE.BoxGeometry(15, 11.5, 1.2), new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: .95 }), 0, 5.6, 0, { parent: g });
    for (const [x, r] of [[-4.5, .25], [4.2, -.3]]) { const t = mesh(new THREE.BoxGeometry(2.6, 14, .3), new THREE.MeshStandardMaterial({ color: 0xcfc6a8, roughness: .5, transparent: true, opacity: .85 }), x, 5.5, -.72, { parent: g, cast: false }); t.rotation.z = r; }
    S.g = g; S.col = { t: 'b', x0: S.hole[0] - 1.5, x1: S.hole[1] + 1.5, y0: -999, y1: -998, z0: -245.6, z1: -244, slick: true }; cols.push(S.col);
    S.steel = steelWool(S.x); }
}
// ---------- steel wool: the next step up from cardboard ----------
// Stuffed into the hole, it won't move for the bear. Shrink it with the size gun and it drops out.
// (it waits inside the wall when it isn't in use, so its collider is filed with the kitchen from the start)
const STEEL_PARK = (x, r) => { r.cx = x; r.cz = -238; r.y0 = 20; r.s = r.target = 1; applyResize(r); };
function steelWool(x) {
  const sm = new THREE.MeshStandardMaterial({ color: 0x9aa2aa, metalness: .85, roughness: .38 });
  const fm = furMat({ color: 0xa8b0b8, len: .55, den: 2.2, droop: .05, clump: .85, rimK: .25, root: .8 });
  const G = cmGroup(11, 9, 7, ({ part, fur }) => {
    const g = new THREE.IcosahedronGeometry(1, 3), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 1 + .14 * Math.sin(p.getX(i) * 9.1 + p.getY(i) * 5.3) + .1 * Math.sin(p.getZ(i) * 11.7); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
    g.computeVertexNormals(); part(g, sm, 0, 0, 0, { s: [4.9, 3.9, 3.1] });
    fur(ell(5.2, 4.2, 3.4, 24, 16), fm, 0, 0, 0);
  }, [sm]);
  const r = resGroup(G, x, -238, 20, 11, 9, 7, .3, 1, '鋼絲球', false); r.c.push = false; STEEL_PARK(x, r); return r;   // (no falling: it's wedged in)
}
const steelIn = id => { const S = SEALS[id], r = S && S.steel; return !!r && r.y0 < 5 && Math.abs(r.cx - S.x) < 3 && r.s > .45; };
function steelPlug(id) { const S = SEALS[id], r = S.steel; r.cx = S.x; r.cz = -238; r.y0 = 0; r.s = r.target = 1; applyResize(r); r.wakeT = T + 1; }
// shrunk in the hole: it drops out on the bathroom side, and the hole is open again
function steelTick() {
  if (NET.client) return;
  for (const id in SEALS) { const S = SEALS[id], r = S.steel; if (!r || !(r.y0 < 5 && Math.abs(r.cx - S.x) < 3) || r.s > .45) continue;
    r.cx = S.x + 9; r.cz = -251; r.y0 = 0; applyResize(r); HB.steelOut = HB.steelOut || {}; HB.steelOut[id] = (HB.steelOut[id] || 0) + 1;
    toastW('鋼絲球縮細咗，跌咗出嚟——條老鼠窿又通返', 2.8); SND.snap && SND.snap(); for (let i = 0; i < 14; i++) emit(V3(S.x, 4, -244), V3(R(-10, 10), R(2, 10), R(-14, -2)), new THREE.Color(.62, .66, .7), R(.15, .3), R(.4, .8), 200, 1); }
}
function hxPassageSwitches() {
  // the family's own counter-measures: not for players to switch (glue), or only the bear can undo (seals)
  GLUE_SPOTS.forEach(([x, z], i) => hxAdd({ id: 'glue' + i, name: '黐鼠膠', kind: 'trap', noUse: true, quiet: true, p: V3(x, 1, z), r: 0, on: false, verb: ['', ''] }));
  for (const id in SEALS) hxAdd({ id, name: '封住老鼠窿嘅紙皮', kind: 'seal', who: 'bear', seal: true, quiet: true, p: V3(SEALS[id].x, 5, -248), r: 9, on: false, verb: ['撞開紙皮', '撞開紙皮'] });
  // the fridge: its seal is strong — only the bear can pull the door open (and the family will notice it's open)
  hxAdd({ id: 'fridge', name: '雪櫃門', kind: 'door', who: 'bear', p: V3(152, 8, -142), r: 10, on: false, verb: ['閂雪櫃門', '用力拉開雪櫃門'] });
  hxAdd({ id: 'mhcover', name: '踢腳線蓋', kind: 'cover', p: V3(335, 4, -226), r: 7, once: true, quiet: true, verb: ['拆開踢腳線蓋', '拆開踢腳線蓋'] });
  hxAdd({ id: 'gvent', name: '通風口蓋（由呢邊推開）', kind: 'cover', lv: 'any', sp: true, p: V3(903, 12, -200), r: 8, once: true, quiet: true, verb: ['推開通風口蓋', '推開通風口蓋'] });
}
function glueTick(dt) {
  if (!HX.glue) return;
  for (const C of party) {
    if (C.frozen) { C.glued = null; continue; }
    // which mouse hole they use (the one Mom will block): counted on the host as anyone passes through
    if (!NET.client && C.pos.y < 8 && C.pos.z > -244 && C.pos.z < -232) for (const id in SEALS) { const S = SEALS[id]; if (C.pos.x > S.hole[0] && C.pos.x < S.hole[1] && C.holeT !== id) { C.holeT = id; HB.holeUse = HB.holeUse || {}; HB.holeUse[id] = (HB.holeUse[id] || 0) + 1; } }
    if (C.pos.z < -246 || C.pos.z > -230) C.holeT = null;
    if (!mine(C)) continue;
    if (C.glued) {
      const G = C.glued; C.pos.x = G.x; C.pos.z = G.z; C.vel.x = C.vel.z = 0; if (C.pos.y > .9) C.pos.y = .9; C.climbing = false; C.leap = null;
      if (C.vel.y > 20) { C.vel.y = 0; G.k -= .22; C.stamina = Math.max(0, C.stamina - 7); SND.swish && SND.swish(); for (let i = 0; i < 4; i++) emit(V3(C.pos.x, .8, C.pos.z), V3(R(-6, 6), R(3, 8), R(-6, 6)), new THREE.Color(1.1, .9, .3), R(.12, .22), R(.3, .5), 120, 1); }   // a jump is a struggle
      if (C !== leader) G.k -= dt * .3;   // AI teammates wriggle free in time
      if (party.some(F => F !== C && !F.frozen && !F.glued && F.pos.distanceTo(C.pos) < 6)) G.k -= dt * .9;   // a teammate pulls you off
      if (G.k <= 0) { C.glued = null; C.glueOff = T; C.pos.x += Math.sin(C.yaw + Math.PI) * 9; C.pos.z += Math.cos(C.yaw + Math.PI) * 9; if (C === leader) toast('甩開咗！', 1.2); }
      continue;
    }
    if (C.pos.y > 1.2 || (C.glueOff && T - C.glueOff < 1.5)) continue;
    for (let i = 0; i < HX.glue.length; i++) { const o = HX.id['glue' + i], G = HX.glue[i]; if (!o || !o.on) continue;
      const dx = C.pos.x - G.x, dz = C.pos.z - G.z, a = -G.g.rotation.y, lx = dx * Math.cos(a) - dz * Math.sin(a), lz = dx * Math.sin(a) + dz * Math.cos(a);
      if (Math.abs(lx) < 7.6 && Math.abs(lz) < 5 ) { C.glued = { x: C.pos.x, z: C.pos.z, k: 1 }; C.squash = .6; if (C === leader) toast('黐住咗！撳「跳」用力掙扎，或者等隊友過嚟拉你', 3); break; } }
  }
}
// ---------- the fridge's cold ----------
//  · inside, the cold creeps in (twice as fast with the door shut): stay too long and you freeze stiff —
//    a toy on the shelf. Mom comes for something soon after, finds it, and tidies it away to the toy box
//  · the way out when the door's shut: the drain hole in the floor of the fridge, down to under it
function fridgeTick(dt) {
  if (!KS.door) return;
  for (const C of party) {
    if (C !== leader || !mine(C) || C.frozen) continue;
    if (inFridge(C) && STATE === 'play') {
      const shut = KS.doorA < .5; C.frost = Math.min(1, (C.frost || 0) + dt / (shut ? 16 : 32));
      if (C.frost > .5 && !C.frostSaid) { C.frostSaid = 1; toast(shut ? '好凍……門閂咗！搵雪櫃底嘅排水口滑出去' : '好凍……再留落去會凍僵變玩具！快啲出去', 3); }
      if (C.frost >= 1) { C.frost = 0; C.frostSaid = 0; toyFreeze('fridge'); }
    } else { C.frost = Math.max(0, (C.frost || 0) - dt / 5); if (C.frost < .2) C.frostSaid = 0; }
  }
  const L = leader, f = L && !L.frozen ? L.frost || 0 : 0, el = $('frost'); if (el && Math.abs((+el.dataset.k || 0) - f) > .01) { el.dataset.k = f.toFixed(2); el.style.opacity = (f * .9).toFixed(2); }
  // shut in the dark: only light that leaks round the door seal
  { const dk = $('fdark'), k = L && !L.frozen && inFridge(L) && KS.doorA < .3 ? 1 : 0; if (dk && dk.dataset.k !== String(k)) { dk.dataset.k = k; dk.style.opacity = k ? .82 : 0; } }
  // a toy left on a fridge shelf: once the door's open it gets tidied away; until then Mom wants something from the fridge
  if (NET.client) return;
  fridgeStock(dt); steelTick();
  for (const C of party) if (C.frozen && C.toyAt === 'floor' && inFridge(C)) {
    if (KS.doorA > .8) { if (!TOY.fetchQ.includes(C) && !(TOY.fetch && TOY.fetch.C === C)) TOY.fetchQ.push(C); }
    else if (HB.m && HB.m.need) HB.m.need.fridge = Math.max(HB.m.need.fridge || 0, 1.6);
  }
}
// the fridge restocks: a fresh Prototype sets once its slot has had a minute's cold with the door shut; food comes back too
const FSTOCK = { v: [], c: [], vT: 60, cT: 75 };
const PROTO_COLD = 2;   // Prototypes go off out of the cold: nobody carries more than two from the fridge
function fridgeStock(dt) {
  const shut = KS.doorA < .15;
  for (const S of FSTOCK.v) { const o = VIALS[S.i]; if (!o) continue; if (!o.got) { S.t = 0; continue; } if (shut) S.t += dt;
    if (S.t >= FSTOCK.vT) { S.t = 0; o.got = false; o.g.visible = o.halo.visible = true; } }
  for (const S of FSTOCK.c) { const o = CRUMBS[S.i]; if (!o) continue; if (!o.got) { S.t = 0; continue; } if (shut) S.t += dt;
    if (S.t >= FSTOCK.cT) { S.t = 0; o.got = false; o.g.visible = o.halo.visible = true; } }
}
function fridgeChillLeft() { let m = 1e9; for (const S of FSTOCK.v) { const o = VIALS[S.i]; if (o && o.got) m = Math.min(m, FSTOCK.vT - S.t); } return m < 1e9 ? Math.max(1, Math.ceil(m)) : 0; }
function fridgeLabelTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 48; const x = c.getContext('2d');
  x.fillStyle = '#f6f2e6'; x.fillRect(0, 0, 256, 48); x.fillStyle = '#c8312a'; x.font = '900 30px "Noto Sans TC", sans-serif'; x.textBaseline = 'middle'; const tx = '勿動！爸爸'; const w = x.measureText(tx).width; if (w > 232) x.font = `900 ${Math.floor(30 * 232 / w)}px "Noto Sans TC", sans-serif`; x.fillText(tx, 12, 25);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// ---------- switches, taps and fans ----------
function hxAdd(o) { o.i = HX.list.length; o.on = !!o.on; o.def = o.on; o.r = o.r || 8; HX.list.push(o); HX.id[o.id] = o; return o; }
function buildHouseSwitches(K) {
  HX.list.length = 0; HX.id = {}; HX.water = 0;
  const plate = (x, y, z, ry) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; LV.add(g); mesh(new THREE.BoxGeometry(7, 7, .6), MAT.white, 0, 0, 0, { parent: g }); const t = mesh(new THREE.BoxGeometry(2.4, 3.4, .9), new THREE.MeshPhysicalMaterial({ color: 0xf6f4ee, roughness: .3 }), 0, 0, .5, { parent: g }); return t; };
  // kitchen lights: a switch on the wall by the living-room door
  const kt = plate(299.6, 118, -82, -Math.PI / 2);
  hxAdd({ id: 'klight', name: '廚房燈掣', kind: 'light', p: V3(299, 118, -82), on: true, toggle: kt, verb: ['熄燈', '開燈'] });
  // bathroom light + fan: on the kitchen side, next to the bathroom door (Hong Kong style)
  const bt = plate(299.6, 118, -200, -Math.PI / 2);
  hxAdd({ id: 'blight', name: '廁所燈掣（連抽氣扇）', kind: 'light', p: V3(299, 118, -200), on: false, toggle: bt, verb: ['熄廁所燈', '開廁所燈'] });
  hxAdd({ id: 'tap', name: '洗碗盆水龍頭', kind: 'tap', p: V3(-96, 97, -213), on: false, r: 10, verb: ['關水龍頭', '開水龍頭'] });
  hxAdd({ id: 'hood', name: '抽油煙機', kind: 'fan', p: V3(79, 173, -179.5), on: true, r: 16, verb: ['關抽油煙機', '開抽油煙機'] });
  hxAdd({ id: 'flush', name: '馬桶', kind: 'flush', p: V3(388, 78, -458), r: 17, oneShot: true, verb: ['沖廁', '沖廁'] });
  hxAdd({ id: 'tv', name: '電視機', kind: 'tv', p: V3(870, 47, 76), on: true, r: 10, verb: ['關電視', '開電視'] });
  hxAdd({ id: 'lamp', name: '落地燈', kind: 'lamp', p: V3(588, 1.5, 4), on: true, r: 8, verb: ['熄落地燈', '開落地燈'] });
  // the water stream from the kitchen tap
  HX.stream = mesh(new THREE.CylinderGeometry(.9, 1.2, 1, 12, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xcfeaf4, roughness: 0, transparent: true, opacity: .5, transmission: .3, depthWrite: false }), -100, 100, -193, { cast: false }); HX.stream.visible = false;
  HX.basinW = null; LV.traverse(o => { if (!HX.basinW && o.isMesh && o.material === K.water && Math.abs(o.position.y - 68.6) < .2) HX.basinW = o; });
  // the pulsing ring that shows a switch is in reach
  const rg = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.2, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x82ece6).multiplyScalar(1.6), transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false, depthTest: false }));
  rg.renderOrder = 10; rg.visible = false; scene.add(rg); HX.ring = rg;
  hxPassageSwitches();
  for (const o of HX.list) hxApply(o, true);
}
// what being on or off looks like (runs on everyone; quiet = no sound)
function hxApply(o, quiet) {
  if (o.toggle) o.toggle.rotation.x = o.on ? -.35 : .35;
  if (o.id === 'blight' && HX.blight) { const B = HX.blight; B.spec.on = o.on; B.mat.emissiveIntensity = o.on ? 5 : .05; }
  if (o.id === 'tv') LIV.tvOff = !o.on;
  if (o.id === 'lamp' && LIV.shade) LIV.shade.material.emissiveIntensity = o.on ? .6 : 0;
  if (o.id === 'hood' && HX.hoodLed) HX.hoodLed.emissiveIntensity = o.on ? 1.2 : 0;
  if (o.id === 'hood' && HX.hood) HX.hood.col.y0 = o.on ? HX.hood.y[0] : -999, HX.hood.col.y1 = o.on ? HX.hood.y[1] : -998;
  if (o.id === 'gstrip' && !o.on && !quiet && !NET.client) toastW('監視鏡頭斷了電——它現在甚麼都看不到', 3);
  if (o.id === 'blight' && HX.bfan) HX.bfan.col.y0 = o.on ? HX.bfan.y[0] : -999, HX.bfan.col.y1 = o.on ? HX.bfan.y[1] : -998;
  if (o.id === 'mhcover' && HX.mhc) { const g = HX.mhc.g; if (o.on) { g.position.set(346, .4, -225); g.rotation.set(-Math.PI / 2, 0, .4); HX.mhc.col.y0 = -999; HX.mhc.col.y1 = -998; if (!quiet) toastW('踢腳線蓋拆開咗——後面個老鼠窿通去廁所', 2.6); } }
  if (o.kind === 'trap' && HX.glue) { const G = HX.glue[+o.id.slice(4)]; if (G) G.g.visible = o.on; }
  if (o.seal && SEALS[o.id] && SEALS[o.id].g) { const S = SEALS[o.id]; S.g.visible = o.on; S.col.y0 = o.on ? 0 : -999; S.col.y1 = o.on ? 11.5 : -998; if (!o.on && !quiet) { if (!NET.client) { HB.sealBroke = HB.sealBroke || {}; HB.sealBroke[o.id] = (HB.sealBroke[o.id] || 0) + 1; } toastW('紙皮俾老友撞爛咗——條老鼠窿又通返', 2.4); for (let i = 0; i < 16; i++) emit(V3(S.x, 5, -245), V3(R(-12, 12), R(2, 14), R(-14, -2)), new THREE.Color(.7, .55, .36), R(.3, .6), R(.5, .9), 200, 1); } }
  if (o.id === 'gvent' && o.on && !LIV.ventOpen) { ventOpen(); if (!quiet) toastW('通風口蓋推開咗——客廳同車房而家打通咗', 2.6); }
  if (!quiet) { SND.snap && SND.snap(); if (o.kind === 'flush') hxFlushSnd(o.p); }
}
// someone pressed it: players ask the host; the family calls this directly on the host
function hxSet(o, on, by) {
  if (!o) return; if (o.oneShot) { HX.flushT = 3.6; hxApply(o); if (!NET.client) hxFlushed(); }
  else { if (o.on === on) return; o.on = on; hxApply(o); }
  if (NET.on && NET.host) nsend({ t: 'hxs', i: o.i, on: o.on ? 1 : 0, f: o.oneShot ? 1 : 0 });
  if (!NET.client && isPlayerId(by) && !o.quiet) { if (o.lv === 'garage') agentIncident(o.id, o.on); else if (o.lv === 'yard') oldIncident(o.id, o.on); else brainIncident(o.id, o, on, by); }
}
function isPlayerId(by) { return !!(by && chars[by]); }
function hxRequest(o, C) {
  if (NET.client) nsend({ t: 'hx', i: o.i, by: C.id }, NET.hostId); else hxSet(o, !o.on, C.id);
  const say = o.oneShot ? '沖！' : o.on ? o.verb[0] : o.verb[1]; toast(`${C.S.name}：${say}`, 1.4);
  for (let k = 0; k < 10; k++) emit(o.p.clone(), V3(R(-6, 6), R(3, 10), R(-6, 6)), new THREE.Color(1.6, 2.2, 2.1), R(.08, .16), R(.2, .4), 80, 1);
}
function hxRecv(d) { const o = HX.list[d.i]; if (!o) return; if (d.f) { HX.flushT = 3.6; hxApply(o); } else if (o.on !== !!d.on) { o.on = !!d.on; hxApply(o); } }
function hxState() { return HX.list.map(o => o.on ? 1 : 0).join('') + '|' + HX.water.toFixed(2) + '|' + HX.bd.tgt.toFixed(2); }
function hxRecvState(s) { if (!s) return; const [f, w, d] = s.split('|'); [...f].forEach((c, i) => { const o = HX.list[i]; if (o && !o.oneShot && o.on !== (c === '1')) { o.on = c === '1'; hxApply(o, true); } }); HX.water = +w; HX.bd.tgt = +d; }
function hxNear(C) {
  if (!C || !HX.list.length) return null; const cx = C.pos.x, cy = C.pos.y + C.h * .5, cz = C.pos.z; let best = null, bd = 1e9;
  for (const o of HX.list) { if (o.lv !== 'any' && (o.lv || 'kitchen') !== LEVEL) continue; if (o.once && o.on) continue; if (o.who && C.id !== o.who) continue; if (o.noUse || (o.seal && !o.on)) continue; if (o.sp && (NET.on || (o.id === 'gvent' && LIV.ventOpen))) continue; const d = Math.hypot(o.p.x - cx, o.p.y - cy, o.p.z - cz); if (d < o.r && d < bd) { bd = d; best = o; } }
  return best;
}
function hxInput(L, ctl) { if (!ctl || !pressed.KeyE || STATE !== 'play') return false; const o = hxNear(L); if (!o) return false; hxRequest(o, L); return true; }
function hxHint(L) { const o = HX.near; if (!o || L.frozen) return ''; const v = o.oneShot ? o.verb[0] : o.on ? o.verb[0] : o.verb[1]; return TOUCH ? `按「用」${v}` : `<kbd>E</kbd> ${v}`; }
// toilet flushed: anyone standing in the bowl goes down the pipe… and comes out of the drain under the fridge
function hxFlushed() {
  const B = HX.bowl; for (const C of playerChars()) if (!C.frozen && C.pos.x > B.x0 && C.pos.x < B.x1 && C.pos.z > B.z0 && C.pos.z < B.z1 && C.pos.y < 30) {
    if (mine(C)) hxFlushChar(C); else if (NET.on) nsend({ t: 'hxw', id: C.id });
  }
}
function hxFlushChar(C) { C.pos.set(191 + R(-6, 6), 0, -196 + R(-4, 4)); C.vel.set(0, 0, 0); C.climbing = false; C.mantle = null; C.squash = .9; if (C === leader) { trail = []; C.lastTrail.copy(C.pos); toastW('被沖走了……從雪櫃底下的去水口冒出來！', 3); } }
function hxFlushSnd(p) {
  const C = AU.ctx; if (!C) return; const d = leader ? leader.pos.distanceTo(p) : 0, v = clamp(1.2 - d / 700, .08, 1) * .5;
  const s = C.createBufferSource(); s.buffer = AU.noise; s.loop = true; const f = C.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = .8; const g = C.createGain(); const t = C.currentTime;
  f.frequency.setValueAtTime(300, t); f.frequency.linearRampToValueAtTime(1400, t + .6); f.frequency.linearRampToValueAtTime(500, t + 3.4);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .25); g.gain.setValueAtTime(v, t + 1.8); g.gain.linearRampToValueAtTime(0, t + 3.6);
  s.connect(f); f.connect(g); g.connect(AU.out); s.start(t); s.stop(t + 3.8);
}
// steady sounds: running water, the hood, the bathroom fan (louder the closer you are)
function hxLoop(key, kind) {
  const C = AU.ctx; if (!C) return null; if (HX.snd[key]) return HX.snd[key];
  const g = C.createGain(); g.gain.value = 0; g.connect(AU.out);
  const s = C.createBufferSource(); s.buffer = AU.noise; s.loop = true; const f = C.createBiquadFilter(); s.connect(f); f.connect(g);
  if (kind === 'water') { f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = .45; }
  else { f.type = 'lowpass'; f.frequency.value = kind === 'hood' ? 520 : 1100; const o = C.createOscillator(); o.type = 'triangle'; o.frequency.value = kind === 'hood' ? 98 : 172; const og = C.createGain(); og.gain.value = .25; o.connect(og); og.connect(g); o.start(); }
  s.start(0, rnd() * 1.5); return (HX.snd[key] = g);
}
function hxLoopVol(key, kind, on, p, base, range) { const g = hxLoop(key, kind); if (!g) return; const L = leader; const d = L ? L.pos.distanceTo(p) : 999; g.gain.setTargetAtTime(on && LEVEL === 'kitchen' ? base * Math.pow(clamp(1 - d / range, 0, 1), 1.4) : 0, AU.ctx.currentTime, .12); }

// the bathroom door: a row of overlapping boxes so nothing slips through at any angle
function hxDoorSegs() {
  const a = HX.bd.a, n = HX.bd.segs.length, LEN = 60, hx = BATH.door[1] - 1, hz = -240;
  const dx = -Math.cos(a), dz = -Math.sin(a), nx = -dz, nz = dx;
  HX.bd.segs.forEach((c, i) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const t of [i * LEN / n, (i + 1) * LEN / n]) for (const s of [-1.8, 1.8]) { const x = hx + dx * t + nx * s, z = hz + dz * t + nz * s; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } c.x0 = x0; c.x1 = x1; c.z0 = z0; c.z1 = z1; });
}
// lights the switches control: kept dark every frame while off (runs after the frog's blackout code)
function hxLights() {
  if (!HX.list.length) return; const kl = HX.id.klight;
  for (const P of HX.pend) { const on = kl.on; P.spec.on = on; if (!on) P.l.intensity = 0; else if (P.l.intensity === 0 && !inDark(P.spec.p)) P.l.intensity = P.I; P.bulb.emissiveIntensity = on ? 7 : .08; P.rec.k = on ? 1 : 0; P.beam.material.uniforms.uK.value = on ? P.k : 0; }
  const B = HX.blight; if (B) { B.l.intensity = HX.id.blight.on ? B.I : 0; if (HX.leak) HX.leak.intensity = HX.id.blight.on ? 260 : 0; }
  const H = HX.hoodL; if (H) { const on = HX.id.hood.on; H.spec.on = on; H.l.intensity = on ? H.I : 0; H.bulb.emissiveIntensity = on ? 7 : .08; }
  if (LEVEL !== 'kitchen') for (const k in HX.snd) HX.snd[k].gain.value = 0;
  upLights(); garageLights(); if (RADIO.bus && LEVEL !== 'garage') RADIO.bus.gain.value = 0; if (RADIO2.bus && LEVEL !== 'yard') RADIO2.bus.gain.value = 0;
  if (YS.lampL && HX.id.olamp) { if (!HX.id.olamp.on) YS.lampL.intensity = 0; else if (YS.lampL.intensity === 0 && !inDark(YS.lampL.position)) YS.lampL.intensity = 9000; }
  const lp = HX.id.lamp; if (LIV.lamp && lp) { if (!lp.on) { LIV.lamp.intensity = 0; if (LIV.shade) LIV.shade.material.emissiveIntensity = 0; } else if (LIV.lamp.intensity === 0 && !inDark(LIV.lamp.position)) LIV.lamp.intensity = 9000; const s = KS.lights.find(q => q.p.x === 575 && q.p.z === 8); if (s) s.on = lp.on; }
  const tv = HX.id.tv; if (tv && !tv.on) LIV.tvOff = true; if (tv) { const s = KS.lights.find(q => q.p.x === 850 && q.p.z === 120); if (s) s.on = tv.on; }
}
// every frame in the kitchen level
function hxTick(dt) {
  if (!HX.list.length) return; const L = leader;
  // fans spin, water rises while the tap runs (and drains slowly), the door swings
  const hood = HX.id.hood, bl = HX.id.blight, tap = HX.id.tap;
  if (HX.hood) HX.hood.g.rotation.y += dt * (hood.on ? 26 : 0);
  if (HX.bfan) HX.bfan.g.rotation.y += dt * (bl.on ? 22 : 0);
  // up the vent shaft over the fish tank: pull yourself over its lip into the duct
  for (const C of party) if (C.climbing && !C.mantle && C.climbDir > 0 && C.pos.y > 257 && C.pos.y < 270 && C.pos.x > 648 && C.pos.x < 668 && C.pos.z > -246 && C.pos.z < -230) { C.climbing = false; C.leap = null; C.mantle = { from: C.pos.clone(), to: V3(658, 270.1, -225), t: 0, dur: .55 }; if (C === leader) toast('入咗天花風槽', 1.8); }
  fridgeTick(dt); glueTick(dt); livedTick(dt);
  if (HX.heat) { HX.heat.material.map.offset.y -= dt * .55; HX.heat.material.map.offset.x = Math.sin(T * .7) * .04; }
  if (HX.bcord) for (const C of party) {
    if (!C.climbing || C.climbC !== HX.bcord) { C.bcordPull = false; continue; }
    // grabbing the cord pulls it: the bathroom light and its fan click off
    if (!C.bcordPull) { C.bcordPull = true; if (bl.on && (C === leader || !NET.on)) { hxRequest(bl, C); if (C === leader) toast('拉咗一下——廁所燈同抽氣扇熄咗', 2.2); } }
    if (C.pos.y > 241 && !C.mantle) {
      if (bl.on) { C.pos.y = 241; if (C === leader && !HX.saidFan) { HX.saidFan = 1; toast('扇葉轉緊，上唔到——要熄咗廁所燈先', 2.4); setTimeout(() => HX.saidFan = 0, 4000); } }
      else { C.climbing = false; C.mantle = { from: C.pos.clone(), to: V3(338, 270.1, -319), t: 0, dur: .6 }; C.yaw = Math.PI * 1.5; if (C === leader) toast('入咗天花風槽', 1.8); }
    }
  }
  HX.water = clamp(HX.water + dt * (tap.on ? 1 / 22 : -1 / 90), 0, 1);
  const wy = 68.6 + HX.water * 15.4; if (HX.basinW) HX.basinW.position.y = wy;
  HX.stream.visible = tap.on; if (tap.on) { const top = 116, len = top - wy; HX.stream.scale.y = len; HX.stream.position.y = wy + len / 2; HX.stream.material.opacity = .42 + Math.sin(T * 40) * .06; if (rnd() < dt * 30) emit(V3(-100 + R(-2, 2), wy + .2, -193 + R(-2, 2)), V3(R(-10, 10), R(6, 16), R(-10, 10)), new THREE.Color(.62, .78, .88), R(.12, .25), R(.3, .5), 200, 1); }
  if (HX.water > .98 && tap.on && rnd() < dt * 20) emit(V3(R(-130, -70), 86, -170), V3(R(-4, 4), R(-2, 2), R(4, 12)), new THREE.Color(.6, .76, .86), R(.15, .3), R(.6, 1), 200, 1);
  KS.basinY = wy;
  const pa = HX.bd.a; HX.bd.a = damp(HX.bd.a, HX.bd.tgt, 3.2, dt); if (Math.abs(HX.bd.a - pa) > 1e-4 || !HX.bd.init) { HX.bd.init = true; HX.bd.g.rotation.y = -HX.bd.a; hxDoorSegs(); }
  if (HX.flushT > 0) { HX.flushT -= dt; if (rnd() < dt * 40) emit(V3(400 + R(-8, 8), 22, -428 + R(-10, 10)), V3(R(-6, 6), R(2, 8), R(-6, 6)), new THREE.Color(.6, .78, .9), R(.15, .3), R(.3, .6), 120, 1); if (HX.lever) HX.lever.rotation.x = HX.flushT > 3 ? -.6 : 0; }
  // sounds
  hxLoopVol('water', 'water', tap.on, V3(-100, 80, -193), .32, 420);
  hxLoopVol('hood', 'hood', hood.on, V3(38, 175, -196), .22, 520);
  hxLoopVol('bfan', 'fan', bl.on, V3(360, 255, -319), .16, 300);
  // you float in the filling basin
  if (L && mine(L)) {
    const B = KS.basin; if (L.pos.x > B.x0 && L.pos.x < B.x1 && L.pos.z > B.z0 && L.pos.z < B.z1 && L.pos.y < wy - .8 && L.pos.y > 60) { L.pos.y = Math.min(wy - .8, L.pos.y + dt * 30); L.vel.y = Math.max(L.vel.y, 0); L.grounded = true; L.swim = true; } else L.swim = false;
    // spinning fans knock you back
    const H = HX.hood; if (hood.on && L.pos.x > 16 && L.pos.x < 60 && L.pos.z > -218 && L.pos.z < -198 && L.pos.y > 176 && L.pos.y < 196) { knock(L, V3(38, 195, -208), '抽油煙機的風扇在轉！先把它關掉'); L.vel.y = -30; }
    if (bl.on && L.pos.x > 344 && L.pos.x < 374 && L.pos.z > -332 && L.pos.z < -306 && L.pos.y > 262 && L.pos.y < 272 && Math.abs(L.vel.y) < 60) { if (!HX.saidFan || T - HX.saidFan > 4) { HX.saidFan = T; toast('抽氣扇在轉，下不去——要有人關廁所燈（連抽氣扇）', 3); } }
  }
  hxUI();
}
// which switch is in reach (and the ring that shows it) — kitchen and garage
function hxUI() {
  const L = leader; HX.near = L && mine(L) && !L.frozen && STATE === 'play' ? hxNear(L) : null;
  const rg = HX.ring; if (!rg) return; if (HX.near) { rg.visible = true; rg.position.copy(HX.near.p); rg.lookAt(camera.position); const s = 1 + Math.sin(T * 6) * .12; rg.scale.setScalar(s); } else rg.visible = false;
  if (TOUCH) $('touch').classList.toggle('use', !!HX.near);
}
