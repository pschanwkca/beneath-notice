// =====================================================================
//  PHASE 3 — UPSTAIRS: the stairwell behind the living room and the daughter's bedroom
//  · a doorway in the living room's back wall opens onto a real staircase: 16 steps, each one a climb
//    for someone 5 cm tall (the carpet runner is easy to grip), a landing and a short hallway
//  · the daughter's bedroom sits over the living room: a bed with a starry duvet (bouncy), her desk with
//    crayon drawings of Dad and her diary, a cube shelf with a music box, a wardrobe you can scale, a
//    round rug — and her plush bear sitting in the window, waiting
//  · the ceiling duct has a floor register into her room: the secret way up (and a quick way down)
//  · switches: the ceiling light (by the door), her desk lamp, the star projector, the music box —
//    a lullaby the whole house can hear, which brings someone upstairs to switch it off
//  · the family walk the stairs too: she goes up to draw and play; Mom comes up to tidy
// =====================================================================
const UPS = { y: 300, ceil: 540, stars: null, mNext: 0, mStep: 0, mbus: null, mOn: 0, diary: null, diaryRead: false, said: {} };
// the family's feet: the stairs ramp up, the landing / hall / bedroom are at y 300 (the bedroom sits over
// the living room, so there it keeps whichever floor you were already on)
function humanFloor(x, z, cur = 0) {
  if (z > 3700) return GY;   // (the school, across the park)
  if (x > 744 && x < 904 && z < -244) { if (x < 830 && z > -472) return clamp((-246 - z) / 214, 0, 1) * UPS.y; return UPS.y; }
  if (x > 306 && z > -244) return cur > 150 ? UPS.y : 0;
  return 0;
}
// trim, nosing, runners, drawer fronts…: no colliders, merged into one mesh per material (far fewer draw calls)
const DECO = new Map();
function deco(x0, x1, y0, y1, z0, z1, mat) { const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); if (!DECO.has(mat)) DECO.set(mat, []); DECO.get(mat).push(g); }
function flushDeco() { if (window.__NOMERGE) { for (const [mat, gs] of DECO) for (const g of gs) { const m = new THREE.Mesh(g, mat); m.receiveShadow = true; LV.add(m); } DECO.clear(); return; } const G = new THREE.Group(); G.name = 'deco'; LV.add(G); for (const [mat, gs] of DECO) for (const g of gs) { const m = new THREE.Mesh(g, mat); m.receiveShadow = true; G.add(m); } DECO.clear(); DECO_LATER.push(G); }
// (merged into one mesh per material once the world has been made solid — see buildWorld)
const DECO_LATER = [];
function flushDecoLater() { for (const G of DECO_LATER) { mergeZoneStatic(G, new Set()); G.position.set(0, 0, 0); G.updateMatrixWorld(true); } DECO_LATER.length = 0; }
function upMats(K) {
  const C2 = (w, h, f) => { const [c, x] = cnv(w, h); f(x, w, h); return tex(c); };
  const duvet = C2(256, 256, (x) => { x.fillStyle = '#e7a6b6'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 46; i++) { const px = R(0, 256), py = R(0, 256), r = R(3, 7); x.fillStyle = rnd() < .5 ? '#fff4d6' : '#ffe08a'; x.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, rr = k % 2 ? r * .45 : r; x.lineTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr); } x.fill(); } });
  const runner = C2(64, 256, (x) => { x.fillStyle = '#6e2430'; x.fillRect(0, 0, 64, 256); x.fillStyle = '#c9a050'; x.fillRect(5, 0, 3, 256); x.fillRect(56, 0, 3, 256); x.fillStyle = '#8a3440'; for (let y = 8; y < 256; y += 32) { x.beginPath(); x.moveTo(32, y); x.lineTo(42, y + 12); x.lineTo(32, y + 24); x.lineTo(22, y + 12); x.fill(); } });
  const paper = (draw) => new THREE.MeshStandardMaterial({ map: C2(256, 192, (x) => { x.fillStyle = '#fbf8f0'; x.fillRect(0, 0, 256, 192); draw(x); }), roughness: .95 });
  const crayon = (x, col, w = 5) => { x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round'; };
  const person = (x, cx, s, col, hair, glasses) => { crayon(x, col); x.beginPath(); x.arc(cx, 70, 16 * s, 0, 7); x.stroke(); x.beginPath(); x.moveTo(cx, 70 + 16 * s); x.lineTo(cx, 130); x.moveTo(cx - 22 * s, 100); x.lineTo(cx + 22 * s, 100); x.moveTo(cx, 130); x.lineTo(cx - 14, 165); x.moveTo(cx, 130); x.lineTo(cx + 14, 165); x.stroke(); if (hair) { crayon(x, hair, 4); x.beginPath(); x.arc(cx, 66, 18 * s, Math.PI, 0); x.stroke(); } if (glasses) { crayon(x, '#222', 2.5); x.strokeRect(cx - 11 * s, 64, 9 * s, 7); x.strokeRect(cx + 2 * s, 64, 9 * s, 7); } };
  const wall = K.wall.clone(); wall.color = new THREE.Color(0xf6e4df); const low = K.wall.clone(); low.color = new THREE.Color(0xd9b8bb);
  const hall = K.wall.clone(); hall.color = new THREE.Color(0xeadfcd);
  const floor = K.floor.clone(); floor.color = new THREE.Color(0xfff2e6);
  return {
    floor, wall, low, hall, stair: floor,
    wood: new THREE.MeshStandardMaterial({ color: 0xe9d6bc, roughness: .55, map: K.wood.map || null }),
    paint: new THREE.MeshPhysicalMaterial({ color: 0xf7f3ec, roughness: .42, clearcoat: .35 }),
    mint: new THREE.MeshPhysicalMaterial({ color: 0xa8d8c8, roughness: .45, clearcoat: .3 }),
    duvet: new THREE.MeshPhysicalMaterial({ map: duvet, roughness: 1, sheen: 1, sheenColor: 0xffe0ea }),
    sheet: new THREE.MeshPhysicalMaterial({ color: 0xfaf6ee, roughness: 1, sheen: .8 }),
    bear: new THREE.MeshPhysicalMaterial({ color: 0xc49464, roughness: 1, sheen: 1, sheenColor: 0xf0d0a8 }),
    curtain: new THREE.MeshPhysicalMaterial({ color: 0xeab0c0, roughness: .95, sheen: .8, side: THREE.DoubleSide }),
    runner: new THREE.MeshStandardMaterial({ map: runner, roughness: 1 }),
    draw1: paper(x => { person(x, 70, 1.15, '#2a5cb8', '#3a2a1a', true); person(x, 140, 1, '#d8406a', '#3a2a1a'); person(x, 200, .75, '#e89a2a', '#3a2a1a'); crayon(x, '#e8c02a', 4); x.beginPath(); x.arc(228, 28, 14, 0, 7); x.stroke(); x.fillStyle = '#333'; x.font = '700 18px "Noto Sans TC"'; x.fillText('爸爸', 46, 186); x.fillText('媽媽', 120, 186); x.fillText('我', 194, 186); }),
    draw2: paper(x => { x.fillStyle = '#d8406a'; x.font = '900 30px "Noto Sans TC"'; x.fillText('爸爸', 26, 66); x.fillText('早點回來！', 26, 116); crayon(x, '#e8406a', 5); x.beginPath(); const hx = 210, hy = 140; x.moveTo(hx, hy + 22); x.bezierCurveTo(hx - 40, hy - 6, hx - 14, hy - 34, hx, hy - 12); x.bezierCurveTo(hx + 14, hy - 34, hx + 40, hy - 6, hx, hy + 22); x.stroke(); }),
    draw3: paper(x => { crayon(x, '#3a8a4a', 6); x.beginPath(); x.moveTo(20, 160); x.lineTo(236, 160); x.stroke(); crayon(x, '#8a5a3a', 5); x.strokeRect(70, 80, 110, 80); crayon(x, '#c83a2a', 5); x.beginPath(); x.moveTo(60, 82); x.lineTo(125, 30); x.lineTo(190, 82); x.stroke(); crayon(x, '#2a5cb8', 3); x.strokeRect(90, 100, 22, 22); x.strokeRect(140, 100, 22, 22); x.fillStyle = '#333'; x.font = '700 16px "Noto Sans TC"'; x.fillText('我們的家', 86, 186); }),
    draw4: paper(x => { crayon(x, '#2a5cb8', 5); x.beginPath(); x.arc(128, 80, 40, 0, 7); x.stroke(); crayon(x, '#888', 4); x.beginPath(); x.moveTo(98, 58); x.lineTo(70, 30); x.moveTo(158, 58); x.lineTo(186, 30); x.stroke(); x.fillStyle = '#333'; x.font = '700 16px "Noto Sans TC"'; x.fillText('爸爸的實驗室', 74, 160); crayon(x, '#5ff2e6', 4); x.beginPath(); x.moveTo(118, 74); x.lineTo(138, 74); x.lineTo(132, 96); x.lineTo(124, 96); x.closePath(); x.stroke(); })
  };
}
function buildUpstairs(K) {
  const M = upMats(K), Y = UPS.y, Yc = UPS.ceil, W = MAT.white;
  const last = () => cols[cols.length - 1];
  // ================= the stairwell =================
  box(748, 828, -10, 0, -250, -232, M.floor, { cast: false });                          // floor in the doorway
  for (const [x0, x1] of [[744, 748], [828, 832]]) deco(x0, x1, 0, 209, -248, -230, M.paint); deco(744, 832, 205, 209, -248, -230, M.paint);
  box(736, 748, 0, Yc + 10, -510, -244, M.hall, { uv: 120 }); box(900, 912, 0, Yc + 10, -510, -244, M.hall, { uv: 120 }); box(736, 912, 0, Yc + 10, -510, -498, M.hall, { uv: 120 });
  box(748, 900, 205, Y, -250, -244, M.hall, { uv: 120 });                               // over the doorway, up to the bedroom floor
  box(828, 900, 0, Y - 6, -472, -244, M.hall, { uv: 120 });                             // the hallway sits on a solid wall beside the stairs
  box(748, 900, 0, Y - 6, -498, -472, M.hall, { uv: 120 });                             // … and the landing
  box(748, 828, -10, 0, -498, -244, M.floor, { cast: false }); box(736, 912, Yc, Yc + 10, -510, -244, K.ceil, { cast: false });
  const N = 16, rise = Y / N, run = 220 / N;
  for (let i = 0; i < N; i++) {
    const z1 = -250 - i * run, z0 = z1 - run, t = (i + 1) * rise;
    box(748, 828, 0, t, z0, z1, M.wood, { uv: 40 }); last().grip = true;
    deco(748, 828, t - .9, t + .3, z1 - .4, z1 + .7, M.paint);                      // white nosing
    deco(763, 813, i * rise, t + .4, z1, z1 + .6, M.runner);                       // carpet runner (riser)
    deco(763, 813, t, t + .5, z0, z1 + .6, M.runner);                              // (tread)
    deco(762, 814, t + .4, t + 1.3, z0 + .3, z0 + 1.1, K.brass);                   // brass stair rod
  }
  // landing + hallway floors, a balustrade along the open side of the hall
  box(748, 900, Y - 6, Y, -498, -472, M.floor, { uv: 100 }); box(828, 900, Y - 6, Y, -472, -244, M.floor, { uv: 100 });
  deco(828, 832, Y, Y + 4, -472, -250, M.wood); deco(827, 833, Y + 88, Y + 92, -472, -250, M.wood);
  for (let z = -468; z < -252; z += 14) deco(829, 831, Y + 4, Y + 88, z, z + 2, M.paint);
  cols.push({ t: 'b', x0: 827, x1: 833, y0: Y, y1: Y + 92, z0: -472, z1: -250, noRay: true, slick: true });   // a rail between balusters: not something to climb
  // handrail on the wall, on little brass brackets
  tubeM([[751.5, 92, -250], [751.5, Y + 92, -470]], 1.5, M.wood, 24);
  for (let i = 0; i <= N; i += 4) { const z = -250 - i * run - 6; deco(748, 751.5, i * rise + 90, i * rise + 92, z - 1, z + 1, K.brass); }
  // family photos up the stairs (the story told in frames)
  const ph = [['photo', 0, 22, 28], ['photo3', 4, 30, 22], ['photo2', 8, 18, 24], ['photo', 12, 24, 30]];
  for (const [img, i, w, h] of ph) { const z = -262 - i * run, y = i * rise + 140; deco(748, 749.6, y - h / 2, y + h / 2, z - w / 2, z + w / 2, MAT.black); mesh(new THREE.PlaneGeometry(w - 3, h - 3), livingPhoto(img), 749.8, y, z, { cast: false }).rotation.y = Math.PI / 2; }
  // a little round window on the landing
  sunWindow(V3(824, Y + 140, -495), 52, 52, V3(0, 0, 1), Y, { fill: 6000, sun: 90000 });
  // (frosted glass, the way landing windows often are: daylight through it, no view — so nothing painted to give itself away)
  { const fc = document.createElement('canvas'); fc.width = fc.height = 128; const fx = fc.getContext('2d'), gr = fx.createRadialGradient(64, 54, 6, 64, 64, 66);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(.7, '#eef3f6'); gr.addColorStop(1, '#d4dde3'); fx.fillStyle = gr; fx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) { fx.fillStyle = `rgba(${rnd() < .5 ? '255,255,255' : '190,200,210'},${R(.05, .16)})`; fx.fillRect(R(0, 128), R(0, 128), 1.5, 1.5); }
    const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace;
    const r = mesh(new THREE.CircleGeometry(26, 40), new THREE.MeshStandardMaterial({ map: ft, emissive: 0xffffff, emissiveMap: ft, emissiveIntensity: .7, roughness: .9 }), 824, Y + 140, -497.4, { cast: false }); r.rotation.y = 0;
    for (const [w, h] of [[52, 1.6], [1.6, 52]]) box(824 - w / 2, 824 + w / 2, Y + 140 - h / 2, Y + 140 + h / 2, -497.6, -496.6, M.paint, { col: false });
    const fr = mesh(new THREE.TorusGeometry(27, 2.4, 10, 48), M.paint, 824, Y + 140, -497, { cast: false }); fr.rotation.y = 0; }
  // stairwell light: a pendant at the top, a sconce half-way, the hallway ceiling light
  cyl(790, -380, .4, Yc - 70, Yc, MAT.black, { col: false, seg: 6 }); mesh(new THREE.SphereGeometry(9, 24, 14), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe2b8, emissiveIntensity: 3 }), 790, Yc - 76, -380, { cast: false });
  pointL(0xffd8aa, 7000, 790, Yc - 90, -380); pointL(0xffc890, 2200, 756, 170, -330); pointL(0xffd8b0, 3800, 864, Yc - 30, -330);
  mesh(new THREE.SphereGeometry(5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xfff4e0, emissive: 0xffd8a0, emissiveIntensity: 2.2, side: THREE.DoubleSide }), 750, 170, -330, { cast: false }).rotation.z = -Math.PI / 2;
  KS.lights.push({ p: V3(790, Yc - 90, -380), range: 330 }, { p: V3(864, Yc - 30, -330), range: 260 });

  // ================= the bedroom =================
  // floor (with the duct's register by the back wall at x 600–624), walls in two tones, ceiling
  box(306, 600, Y - 6, Y, -244, 244, M.floor, { uv: 75 }); box(624, 906, Y - 6, Y, -244, 244, M.floor, { uv: 75 });
  box(600, 624, Y - 6, Y, -244, -232, M.floor, { uv: 75 }); box(600, 624, Y - 6, Y, -214, 244, M.floor, { uv: 75 });
  box(600, 624, 270, Y - 6, -214, -212, MAT.white);                                                      // the register's boot: a face to climb up from the duct
  for (let i = 0; i < 6; i++) deco(601 + i * 4, 602.4 + i * 4, Y - .7, Y - .1, -231.5, -214.5, W);
  deco(598, 626, Y - .7, Y - .05, -233, -231.5, W); deco(598, 626, Y - .7, Y - .05, -214.5, -213, W);
  UPS.regL = pointL(0xffd8a8, 40, 612, 284, -223); addBeam(0xffe2b8, V3(612, 299, -223), V3(612, 270, -223), .45, .05);
  const wallB = (x0, x1, z0, z1, y0 = Y, y1 = Yc) => { box(x0, x1, y0, y1, z0, z1, M.wall, { uv: 120 }); };
  wallB(300, 312, -244, 244); wallB(900, 912, -244, 244);
  wallB(312, 574, 232, 244); wallB(666, 900, 232, 244); wallB(574, 666, 232, 244, Y, Y + 40); wallB(574, 666, 232, 244, Y + 150, Yc);
  wallB(312, 836, -244, -232); wallB(896, 900, -244, -232); wallB(836, 896, -244, -232, Y + 205, Yc);
  // (with the attic hatch over the wardrobe end: x 800…856, z 66…114 — see e43_roof)
  for (const [x0, x1, z0, z1] of [[300, 800, -244, 244], [856, 912, -244, 244], [800, 856, -244, 66], [800, 856, 114, 244]]) box(x0, x1, Yc, Yc + 12, z0, z1, K.ceil, { cast: false });
  // the lower band of wall in dusty rose, a chair rail, skirting
  const band = (x0, x1, z0, z1) => deco(x0, x1, Y, Y + 92, z0, z1, M.low);
  band(312, 312.5, -232, 232); band(899.5, 900, -232, 232); band(312, 574, 231.5, 232); band(666, 900, 231.5, 232); band(312, 836, -232, -231.5);
  for (const [x0, x1, z0, z1] of [[312, 313.4, -232, 232], [898.6, 900, -232, 232], [312, 574, 230.6, 232], [666, 900, 230.6, 232], [312, 836, -232, -230.6]]) { deco(x0, x1, Y + 91, Y + 94, z0, z1, M.paint); deco(x0, x1, Y, Y + 8, z0, z1, M.paint); }
  // the doorway to the hall, and its door standing open against the wall
  for (const [x0, x1] of [[832, 836], [896, 900]]) deco(x0, x1, Y, Y + 209, -233, -230, M.paint); deco(832, 900, Y + 205, Y + 209, -233, -230, M.paint);
  box(892, 896, Y, Y + 203, -230, -172, M.paint); mesh(new THREE.SphereGeometry(2, 14, 10), K.brass, 891, Y + 100, -178, { cast: false });
  // window, sill, curtains — and her bear in the window, waiting for Dad to come home
  box(570, 670, Y, Y + 36, 198, 232, M.paint); deco(574, 666, Y + 18, Y + 19, 197.6, 198, M.wood);                       // a built-in window seat
  box(572, 668, Y + 36, Y + 42, 198, 234, new THREE.MeshPhysicalMaterial({ color: 0xf0c4cf, roughness: 1, sheen: .9, sheenColor: 0xffe8ee }));   // its cushion
  for (const [x, c] of [[582, 0xffffff], [656, 0xa8d8c8]]) { const pw = mesh(new THREE.SphereGeometry(10, 18, 12), new THREE.MeshPhysicalMaterial({ color: c, roughness: 1, sheen: .8 }), x, Y + 50, 224); pw.scale.set(.9, .9, .45); }
  mesh(new THREE.PlaneGeometry(92, 110), MAT.glassThin, 620, Y + 95, 238, { cast: false }).rotation.y = Math.PI;
  UPS.win = sunWindow(V3(620, Y + 95, 236), 92, 110, V3(0, 0, -1), Y, { fill: 10000 });
  // curtains: open in the daytime; she draws them to watch the star projector
  { const cm = new THREE.MeshPhysicalMaterial({ color: 0xf6dfe4, roughness: .95, sheen: .8, sheenColor: 0xffffff, side: THREE.DoubleSide });
    const mk = () => { const g = new THREE.PlaneGeometry(64, 122, 28, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * .42) * 2.2); g.computeVertexNormals(); const m = new THREE.Mesh(g, cm); m.castShadow = true; m.rotation.y = Math.PI; LV.add(m); return m; };
    UPS.curt = [mk(), mk()]; UPS.curtK = 0;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 150, 10), K.brass); rod.rotation.z = Math.PI / 2; rod.position.set(620, Y + 158, 228); LV.add(rod); }
  deco(574, 666, Y + 93, Y + 96, 236, 239, M.paint); deco(618.5, 621.5, Y + 42, Y + 150, 236, 239, M.paint);
  cols.push({ t: 'b', x0: 574, x1: 666, y0: Y + 42, y1: Y + 150, z0: 237, z1: 239, noRay: true });
  for (const x of [556, 684]) box(x - 12, x + 12, Y + 2, Y + 176, 222, 228, M.curtain);
  tubeM([[532, Y + 180, 226], [708, Y + 180, 226]], 1.1, K.brass, 8);
  { const g = new THREE.Group(); g.position.set(620, Y + 42, 214); LV.add(g); const B = M.bear;
    mesh(new THREE.SphereGeometry(14, 24, 16), B, 0, 14, 0, { parent: g }).scale.set(1, 1.1, .9); mesh(new THREE.SphereGeometry(10, 24, 16), B, 0, 35, -1, { parent: g });
    for (const s of [-1, 1]) { mesh(new THREE.SphereGeometry(3.6, 14, 10), B, s * 7.5, 43.5, 0, { parent: g }); mesh(new THREE.SphereGeometry(5, 14, 10), B, s * 13, 18, 3, { parent: g }); mesh(new THREE.SphereGeometry(5.6, 14, 10), B, s * 7.5, 3, 6, { parent: g }); }
    mesh(new THREE.SphereGeometry(3.4, 14, 10), new THREE.MeshStandardMaterial({ color: 0xf0d8b8, roughness: 1 }), 0, 33, 8, { parent: g });
    mesh(new THREE.TorusGeometry(8.5, 1.4, 8, 24), new THREE.MeshStandardMaterial({ color: 0xc8344a, roughness: .7 }), 0, 26, 0, { parent: g }).rotation.x = Math.PI / 2;   // a ribbon round its neck
    cols.push({ t: 'c', x: 620, z: 214, r: 13.5, y0: Y + 42, y1: Y + 70 }, { t: 'c', x: 620, z: 213, r: 9.5, y0: Y + 70, y1: Y + 87 }); }
  // the bed: legs, slats, mattress, a starry duvet you can bounce on, pillow, headboard
  box(316, 416, Y, Y + 84, 226, 232, M.wood, { uv: 60 }); cyl(366, 229, 50, Y + 84, Y + 85, M.wood, { col: false, seg: 40 });
  for (const [x, z] of [[319, 43], [413, 43], [319, 223], [413, 223]]) box(x - 3, x + 3, Y, Y + 16, z - 3, z + 3, M.wood);
  box(316, 416, Y + 14, Y + 22, 40, 226, M.wood, { uv: 60 });
  box(318, 414, Y + 22, Y + 42, 42, 224, M.sheet);
  box(316, 416, Y + 42, Y + 47, 40, 198, M.duvet, { uv: 80 }); last().bouncy = true;
  box(316, 416, Y + 18, Y + 47, 38, 40, M.duvet, { uv: 80 });                 // hangs over the foot: climb it
  box(416, 418, Y + 20, Y + 47, 40, 198, M.duvet, { uv: 80 });                // … and over the side
  const pil = mesh(new THREE.SphereGeometry(22, 24, 14), M.sheet, 366, Y + 49, 210); pil.scale.set(1.9, .4, .7); cols.push({ t: 'b', x0: 334, x1: 398, y0: Y + 42, y1: Y + 53, z0: 201, z1: 219 }); last().bouncy = true;
  // under the bed: dust, a lost toy car, a battery
  const dustM = furMat({ color: 0x8a8580, len: .6, den: 1.8, droop: .3, clump: .6, rimK: .05, root: .7 });
  for (const [x, z, r] of [[340, 150, 2.4], [392, 90, 1.8], [372, 200, 2]]) { const b = furMesh(new THREE.SphereGeometry(r, 18, 12), dustM); b.position.set(x, Y + r * .6, z); b.scale.y = .6; LV.add(b); }
  box(352, 366, Y, Y + 5, 118, 126, new THREE.MeshPhysicalMaterial({ color: 0x2a6ad8, roughness: .3, clearcoat: .8 }));
  addBattery(380, Y, 170); addCrumb(398, Y, 60);
  // bedside table, star projector, night-light by the skirting
  box(422, 462, Y, Y + 50, 192, 230, M.mint); deco(422, 462, Y + 24, Y + 25, 191.6, 192, M.paint); mesh(new THREE.SphereGeometry(1.4, 10, 8), K.brass, 442, Y + 37, 191.4, { cast: false });
  cyl(442, 211, 9, Y + 50, Y + 53, new THREE.MeshStandardMaterial({ color: 0xf4f0e8, roughness: .4 }), { seg: 28 });
  const sp = mesh(new THREE.SphereGeometry(8, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x3a4aa8, roughness: .15, clearcoat: 1, emissive: 0x2a3aa8, emissiveIntensity: .3 }), 442, Y + 53, 211); UPS.projM = sp.material;
  box(466, 474, Y + 10, Y + 18, 230.4, 232, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffb070, emissiveIntensity: 2 }), { col: false, cast: false });
  pointL(0xffb070, 260, 470, Y + 16, 224);
  // desk: drawer pedestal (climb its front), top, legs, chair, lamp, drawings pinned above, diary, Dad's photo
  box(430, 470, Y, Y + 68, -232, -182, M.paint); for (let i = 0; i < 3; i++) { deco(433, 467, Y + 6 + i * 21, Y + 24 + i * 21, -182, -181.4, M.paint); deco(446, 454, Y + 14 + i * 21, Y + 16 + i * 21, -181.4, -180, K.brass); }
  box(428, 572, Y + 68, Y + 72, -232, -178, M.wood, { uv: 60 }); for (const [x, z] of [[567, -229], [567, -181]]) box(x - 2, x + 2, Y, Y + 68, z - 2, z + 2, M.wood);
  box(476, 514, Y + 42, Y + 45, -170, -132, M.wood); for (const [x, z] of [[478, -168], [512, -168], [478, -134], [512, -134]]) box(x - 1.5, x + 1.5, Y, Y + 42, z - 1.5, z + 1.5, M.wood); box(476, 514, Y + 45, Y + 88, -134, -131, M.wood);
  cyl(550, -220, 5, Y + 72, Y + 74, MAT.dsteel, { seg: 16 }); tubeM([[550, Y + 74, -220], [550, Y + 108, -214], [534, Y + 116, -206]], .7, MAT.dsteel, 20);
  const lh = mesh(new THREE.ConeGeometry(6, 8, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xe8c040, roughness: .4, side: THREE.DoubleSide, emissive: 0xffd080, emissiveIntensity: 0 }), 531, Y + 112, -203, { cast: false }); lh.rotation.x = .7; UPS.deskM = lh.material;
  for (const [x, y, m, r] of [[452, Y + 128, M.draw1, -.05], [500, Y + 140, M.draw2, .06], [548, Y + 124, M.draw3, -.03], [596, Y + 136, M.draw4, .07]]) { const p = mesh(new THREE.PlaneGeometry(40, 30), m, x, y, -231.5, { cast: false }); p.rotation.z = r; mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshStandardMaterial({ color: 0xd83a3a }), x, y + 13, -231.1, { cast: false }); }
  box(448, 476, Y + 72, Y + 74.5, -212, -192, new THREE.MeshStandardMaterial({ color: 0x5a8ac8, roughness: .7 })); box(448, 476, Y + 74.5, Y + 75, -211, -193, new THREE.MeshStandardMaterial({ color: 0xf4efe2, roughness: .9 }), { col: false });
  UPS.diary = V3(462, Y + 75, -202);
  deco(510, 532, Y + 72, Y + 100, -226, -223, MAT.black); mesh(new THREE.PlaneGeometry(19, 25), livingPhoto('photo2'), 521, Y + 86, -222.8, { cast: false });
  cyl(492, -222, 4, Y + 72, Y + 84, new THREE.MeshStandardMaterial({ color: 0xe86a5a, roughness: .5 }), { seg: 16 });
  for (let i = 0; i < 5; i++) { const c = [0xd83a3a, 0x3a7ad8, 0xe8c040, 0x3aa85a, 0x8a4ac8][i]; cyl(489 + (i % 3) * 2.6, -223 + (i > 2 ? 2.6 : 0), .7, Y + 84, Y + 92 + i, new THREE.MeshStandardMaterial({ color: c, roughness: .6 }), { col: false, seg: 8 }); }
  // cube shelf (one solid block to climb; the cubbies are just for looks), the music box on top
  cols.push({ t: 'b', x0: 650, x1: 754, y0: Y, y1: Y + 80, z0: -232, z1: -200 });
  const so = { col: false }; deco(650, 754, Y + 76, Y + 80, -232, -200, M.paint); deco(650, 754, Y, Y + 4, -232, -200, M.paint); deco(650, 654, Y, Y + 80, -232, -200, M.paint); deco(750, 754, Y, Y + 80, -232, -200, M.paint); deco(700, 704, Y, Y + 80, -232, -200, M.paint); deco(650, 754, Y + 38, Y + 42, -232, -200, M.paint); deco(650, 754, Y, Y + 80, -232, -229, M.mint);
  for (const [x0, x1, y0, col] of [[654, 700, Y + 4, 0xf2c84a], [704, 750, Y + 4, 0xa8d8c8], [654, 700, Y + 42, 0xe8a0b0], [704, 750, Y + 42, 0x9ab8e0]]) {
    const bm = new THREE.MeshPhysicalMaterial({ color: col, roughness: .95, sheen: .5 }); box(x0 + .6, x1 - .6, y0 + .4, y0 + 33.6, -229, -200.2, bm, so);
    deco(x0 + 16, x1 - 16, y0 + 22, y0 + 26, -200.3, -199.9, MAT.black);   // the hand-hold slot
  }
  for (let i = 0; i < 5; i++) box(656 + i * 4.6, 660 + i * 4.6, Y + 80, Y + 80 + R(20, 27), -228, -212, new THREE.MeshStandardMaterial({ color: [0x9a3a3a, 0x3a5a9a, 0x3a8a5a, 0xc8a24a, 0xe86a8a][i], roughness: .7 }));   // books on top, between the bookend and the music box
  box(679, 681, Y + 80, Y + 98, -228, -212, MAT.dsteel);
  { const rb = new THREE.MeshPhysicalMaterial({ color: 0xf2f2f2, roughness: .4 }); mesh(new THREE.SphereGeometry(7, 18, 12), rb, 738, Y + 87, -220); for (const s of [-1, 1]) mesh(new THREE.CapsuleGeometry(1.8, 9, 6, 10), rb, 738 + s * 3, Y + 99, -220); mesh(new THREE.SphereGeometry(1, 8, 6), MAT.black, 735.5, Y + 89, -213.5, { cast: false }); mesh(new THREE.SphereGeometry(1, 8, 6), MAT.black, 740.5, Y + 89, -213.5, { cast: false }); cols.push({ t: 'c', x: 738, z: -220, r: 6.5, y0: Y + 80, y1: Y + 94 }); }   // a toy rabbit on top
  box(686, 714, Y + 80, Y + 93, -224, -208, new THREE.MeshPhysicalMaterial({ color: 0xd8a0b8, roughness: .3, clearcoat: .8 })); box(686, 714, Y + 93, Y + 94.4, -224, -208, K.brass);
  UPS.dancer = mesh(new THREE.ConeGeometry(2.8, 8, 14), new THREE.MeshPhysicalMaterial({ color: 0xffe8f0, roughness: .3 }), 700, Y + 98.4, -216, { cast: false });
  mesh(new THREE.SphereGeometry(1.4, 10, 8), new THREE.MeshPhysicalMaterial({ color: 0xffe0c8 }), 700, Y + 103.6, -216, { cast: false });
  deco(712, 716, Y + 85, Y + 87, -217, -215, K.brass);   // the winding key
  // dresser by the door (stand on it to reach the light switch)
  box(752, 826, Y, Y + 96, -232, -200, M.paint); for (let i = 0; i < 3; i++) { deco(756, 822, Y + 6 + i * 30, Y + 32 + i * 30, -200, -199.4, M.paint); for (const x of [774, 804]) deco(x - 4, x + 4, Y + 18 + i * 30, Y + 20 + i * 30, -199.4, -198, K.brass); }
  box(770, 784, Y + 96, Y + 99, -220, -212, new THREE.MeshStandardMaterial({ color: 0xe86a8a, roughness: .5 })); cyl(806, -218, 6, Y + 96, Y + 97, new THREE.MeshStandardMaterial({ color: 0xbfd8e8, metalness: .6, roughness: .2 }), { seg: 20 });
  // wardrobe, with a stack of storage boxes beside it (a long climb to a battery on top)
  box(860, 900, Y, Y + 200, 30, 150, M.wood, { uv: 60 }); deco(859.4, 860, Y + 8, Y + 192, 89.5, 90.5, MAT.black);
  for (const z of [84, 96]) deco(856, 859.4, Y + 96, Y + 116, z - 1, z + 1, K.brass);
  box(852, 900, Y, Y + 56, 150, 206, new THREE.MeshStandardMaterial({ color: 0x6aa8d8, roughness: .6 })); box(858, 900, Y + 56, Y + 102, 152, 200, new THREE.MeshStandardMaterial({ color: 0xf2c84a, roughness: .6 })); box(864, 900, Y + 102, Y + 146, 152, 192, new THREE.MeshStandardMaterial({ color: 0xe86a8a, roughness: .6 }));
  addBattery(880, Y + 200, 90); box(866, 892, Y + 200, Y + 206, 50, 74, new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: .8 }));   // an old photo album up there
  // round rug
  { const g = new THREE.CircleGeometry(72, 48); g.rotateX(-Math.PI / 2); const m = furMesh(g, furMat({ color: 0xc6d6ee, len: .55, den: 2.5, droop: .15, clump: .5, root: .6, rimK: .04 })); m.position.set(640, Y + .3, 20); LV.add(m); cols.push({ t: 'b', x0: 568, x1: 712, y0: Y, y1: Y + .3, z0: -52, z1: 92, small: true }); }
  // ---- light ----
  // ceiling lamp (a shadow-casting spot under a glowing dome), the desk lamp, the star projector, sky light through the window
  UPS.lampMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0d8, emissiveIntensity: .05 });
  mesh(new THREE.SphereGeometry(24, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), UPS.lampMat, 620, Yc, 0, { cast: false });
  UPS.ceilL = spotL(0xffe6c8, 0, V3(620, Yc - 14, 0), V3(620, Y, 0), 1.3, .85, 1024, 10, 500); UPS.fillL = pointL(0xffe8cc, 0, 620, Yc - 40, 0);
  UPS.deskL = pointL(0xffd890, 0, 532, Y + 104, -200); UPS.starL = pointL(0x6a8aff, 0, 442, Y + 70, 211);
  UPS.moon = spotL(DAY ? 0xf2f6ff : 0xa8bcff, DAY ? 130000 : 90000, V3(640, Y + 250, 560), V3(600, Y, 60), .42, .6, 1024, 60, 900); UPS.moonI = UPS.moon.intensity;   // (DAY: bright sky light through her window)
  addBeam(DAY ? 0xfff4e6 : 0xbcd0ff, V3(620, Y + 130, 228), V3(600, Y, 90), .32, .028); UPS.winBeam = beams[beams.length - 1];
  UPS.specs = { ceil: { p: V3(620, Yc - 14, 0), dir: V3(0, -1, 0), cos: Math.cos(1.3), range: 380, on: false }, desk: { p: V3(532, Y + 104, -200), range: 110, on: false }, star: { p: V3(442, Y + 70, 211), range: 150, on: false } };
  UPS.specs.win = { p: V3(620, Y + 112, 226), dir: V3(-.1, -.55, -.83).normalize(), cos: Math.cos(.5), range: 320 };
  KS.lights.push(UPS.specs.ceil, UPS.specs.desk, UPS.specs.star, UPS.specs.win);
  // the star field the projector throws on the ceiling
  { const n = 160, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { p[i * 3] = R(320, 890); p[i * 3 + 1] = Yc - .6; p[i * 3 + 2] = R(-226, 226); } g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    UPS.stars = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(0xc8d6ff).multiplyScalar(2.2), size: 3.4, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); UPS.stars.frustumCulled = false; LV.add(UPS.stars); }
  // ---- switches ----
  const tg = mesh(new THREE.BoxGeometry(2.4, 3.4, .9), new THREE.MeshPhysicalMaterial({ color: 0xf6f4ee, roughness: .3 }), 829.5, Y + 110, -231.1, { cast: false }); mesh(new THREE.BoxGeometry(5, 7, .6), W, 829.5, Y + 110, -231.6, { cast: false });
  hxAdd({ id: 'ulight', name: '女兒房間燈掣', kind: 'light', p: V3(829.5, Y + 110, -231), on: false, r: 17, toggle: tg, verb: ['熄房間燈', '開房間燈'] });
  hxAdd({ id: 'udesk', name: '書枱燈', kind: 'lamp', p: V3(550, Y + 76, -220), on: false, r: 15, verb: ['熄書枱燈', '開書枱燈'] });
  hxAdd({ id: 'ustar', name: '星空投影燈', kind: 'lamp', p: V3(442, Y + 58, 211), on: false, r: 19, verb: ['熄星空燈', '開星空燈'] });
  hxAdd({ id: 'umusic', name: '音樂盒', kind: 'music', p: V3(712, Y + 86, -216), on: false, r: 13, verb: ['停音樂盒', '扭音樂盒發條'] });
  // more things to find up here
  addVial(436, Y + 72, -214); addCrumb(780, Y + 96, -208); addBattery(884, Y, -488); addCrumb(800, 8 * rise, -353);   // the landing, half-way up the stairs
  flushDeco();
}
// every frame: the upstairs lights follow their switches
function upLights() {
  if (LEVEL !== 'kitchen' && UPS.mbus) { UPS.mbus.gain.value = 0; MUS.ext = 1; }
  if (!UPS.ceilL || !HX.id.ulight) return; const on = k => HX.id[k].on;
  const cl = on('ulight'); UPS.ceilL.intensity = cl ? 46000 : 0; UPS.fillL.intensity = cl ? 2600 : 0; UPS.lampMat.emissiveIntensity = cl ? 3.2 : .05; UPS.specs.ceil.on = cl; UPS.regL.intensity = cl ? 160 : 40;
  const dk = on('udesk'); UPS.deskL.intensity = dk ? 2400 : 0; UPS.deskM.emissiveIntensity = dk ? 2.4 : 0; UPS.specs.desk.on = dk;
  const st = on('ustar'); UPS.starL.intensity = st ? 1400 : 0; UPS.specs.star.on = st; UPS.projM.emissiveIntensity = st ? 2.4 : .3;
  // daytime: the curtains are drawn while the stars are on (the room goes dim; the window stops lighting you up)
  if (DAY && UPS.curt) { UPS.curtK = damp(UPS.curtK, st ? 1 : 0, 2.2, 1 / 60); const k = UPS.curtK, Y = UPS.y;
    UPS.curt.forEach((m, i) => { const s = i ? 1 : -1; m.scale.x = .34 + .66 * k; m.position.set(620 + s * lerp(74, 31, k), Y + 96, 229); });
    const open = 1 - k; UPS.moon.intensity = UPS.moonI * (.12 + .88 * open); if (UPS.win.fill) UPS.win.fill.intensity = 10000 * (.15 + .85 * open); UPS.specs.win.on = open > .5;
    if (UPS.winBeam) UPS.winBeam.m.visible = open > .2; }
  if (UPS.stars) { const k = UPS.stars.material; k.opacity = damp(k.opacity, st ? .9 + Math.sin(T * 1.7) * .08 : 0, 3, 1 / 60); UPS.stars.visible = k.opacity > .01; UPS.stars.rotation.y = 0; }
  if (UPS.dancer) UPS.dancer.rotation.y += on('umusic') ? .045 : 0;
}
// the music box: a lullaby on the celesta, heard all over the house (quieter further away); the main score
// steps back while you're close. It winds down by itself after a minute or so.
const LULLABY = [[81, 1], [78, 1], [74, 1], [76, 1], [78, 1], [79, 1], [81, 2], [78, 1], [76, 3], [83, 1], [81, 1], [79, 1], [78, 1], [76, 1], [74, 1], [76, 2], [73, 1], [74, 3]];
const LULL_B = [62, 62, 66, 69, 67, 62, 69, 62];
function upMusic(dt) {
  const C = AU.ctx, o = HX.id.umusic; if (!C || !o) return;
  if (!UPS.mbus) { UPS.mbus = C.createGain(); UPS.mbus.gain.value = 0; const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3800; UPS.mbus.connect(lp); lp.connect(AU.out); UPS.lp = lp; }
  const L = leader, d = L ? L.pos.distanceTo(o.p) : 999, up = L && L.pos.y > 200, near = clamp(1 - d / 900, 0, 1);
  const v = o.on && LEVEL === 'kitchen' ? .75 * Math.pow(Math.max(near, .05), 1.2) : 0;
  UPS.mbus.gain.setTargetAtTime(v, C.currentTime, .15); UPS.lp.frequency.setTargetAtTime(up ? 6000 : 1400, C.currentTime, .3);   // through the floor it's muffled
  MUS.ext = o.on && LEVEL === 'kitchen' ? 1 - .7 * near : 1;
  if (!o.on) { UPS.mNext = 0; UPS.mOn = 0; return; }
  UPS.mOn += dt; if (!NET.client && UPS.mOn > 75) { hxSet(o, false, 'box'); toastW('音樂盒的發條轉完了', 2.2); return; }
  if (!BANK.cel.length) return;
  const slow = 1 + sstep(55, 75, UPS.mOn) * .6, beat = .34 * slow;
  if (UPS.mNext < C.currentTime) UPS.mNext = C.currentTime + .05;
  while (UPS.mNext < C.currentTime + .4) {
    const i = UPS.mStep++ % LULLABY.length, [m, len] = LULLABY[i];
    playS('cel', m, UPS.mNext, .3, 0, UPS.mbus, .15);
    if (i % 3 === 0) playS('cel', LULL_B[(i / 3) % LULL_B.length | 0], UPS.mNext, .14, 0, UPS.mbus, -.15);
    UPS.mNext += len * beat;
  }
}
// the diary on her desk
function upTick(dt) {
  upMusic(dt); const L = leader; if (!L || !UPS.diary || !mine(L) || STATE !== 'play') return;
  const p = L.pos, once = (k, t, d) => { if (!UPS.said[k]) { UPS.said[k] = 1; toast(t, d); } };
  if (p.x > 748 && p.x < 828 && p.z < -256 && p.y < 200) once('stairs', TOUCH ? '樓梯：每一級都要爬，不過地毯很好抓——搖桿推盡就會跑上去' : '樓梯：每一級都要爬，不過地毯很好抓——按住 Shift 跑上去快得多', 3.6);
  else if (p.y > 266 && p.y < 296 && p.x > 560 && p.x < 660 && p.z > -240 && p.z < -212) once('reg', '上面透出光——爬上去就是女兒的房間', 3);
  else if (p.y > 296 && p.x > 312 && p.x < 900 && p.z > -232) once('room', '女兒的房間。燈、星空燈、音樂盒都可以開——音樂盒一響，全屋都聽得到', 4.2);
  const d = UPS.diary; if (!UPS.diaryRead && Math.hypot(L.pos.x - d.x, L.pos.z - d.z) < 20 && Math.abs(L.pos.y - d.y) < 8) { UPS.diaryRead = true; say('女兒的日記', '「今天爸爸還是沒有回家。媽媽在廚房偷偷哭了。我把小熊放在窗口，這樣爸爸回來的時候，第一眼就看見它。」', '#e8a0c0', 7); }
}
function upReset() { UPS.diaryRead = false; UPS.said = {}; UPS.mOn = 0; UPS.mStep = 0; MUS.ext = 1; }
// ---------- the family upstairs ----------
// the daughter goes up to her room: draw at the desk, wind the music box, or lie under the stars
function roomSteps() {
  const S = [{ say: pick(['我上樓一會兒～', '媽，我回房間拿東西。', '我去房間畫畫！']), reply: pick(['小心樓梯。', '別玩太久，等一下吃飯。', '好，記得下來吃飯。']) }, { go: 'uswitch' }, { sw: 'ulight', on: true }];
  const r = rnd();
  if (r < .42) { S.push({ go: 'udesk' }, { sw: 'udesk', on: true }, { sit: 'udesk' }, { wait: R(14, 22), pose: 'homework', at: [500, UPS.y + 72, -205], say2: pick(['畫一張新的給爸爸……', '爸爸的眼鏡是這樣的……', '這張要貼在最中間！']) }, { stand: 1 }); if (rnd() < .6) S.push({ sw: 'udesk', on: false }); }
  else if (r < .72) S.push({ go: 'ushelf' }, { sw: 'umusic', on: true }, { wait: R(9, 13), pose: 'fridge', at: [700, UPS.y + 92, -216], say2: '這是爸爸送給我的……' }, { sw: 'umusic', on: false });
  else { S.push({ go: 'unight' }, { sw: 'ustar', on: true }, { go: 'ubed' }, { sit: 'ubed' }, { wait: R(10, 15), pose: 'sofa', at: [620, UPS.ceil, 0], say2: '……爸爸，你那邊也看得到星星嗎？' }, { stand: 1 }, { go: 'unight' }); if (rnd() < .65) S.push({ sw: 'ustar', on: false }); }
  if (rnd() < .6) S.push({ go: 'uswitch' }, { sw: 'ulight', on: false });
  return S;
}
// someone played with something upstairs
function upIncident(id, o, on, M, K, mr, kr, look) {
  const kidUp = kr === 'u';
  if (id === 'umusic' && on) {
    if (!LIV.open) { setTimeout(() => brainSay('mom', '咦……樓上怎麼有音樂聲？'), 900); return; }
    if (K && kidUp) react(K, 2, [{ say: '咦？音樂盒自己響了……' }, { go: 'ushelf' }, { wait: 2.5, pose: 'fridge', at: [700, UPS.y + 92, -216] }, { sw: 'umusic', on: false }]);
    else if (K && kr !== 'b' && K.act !== 'search') {
      brainSay('kid', pick(['我的音樂盒？！', '咦？我的音樂盒響了！']));
      react(K, 3, [{ go: 'ushelf' }, { sw: 'umusic', on: false }, { wait: R(3, 5), pose: 'fridge', at: [700, UPS.y + 92, -216] }, { say: pick(['誰開的……？', '它自己響的嗎……', '……爸爸？']) }], 'room');
      if (mr !== 'u') setTimeout(() => brainSay('mom', '囡囡，樓梯別跑！'), 2200);
    } else react(M, 2, [{ say: '咦？樓上的音樂盒？' }, { go: 'ushelf' }, { sw: 'umusic', on: false }, ...look, { say: '……奇怪。' }]);
  } else if (id === 'ulight') {
    if (!on && K && kidUp) { brainSay('kid', '媽！我房間的燈熄了！'); react(K, 3, [{ go: 'uswitch' }, { sw: 'ulight', on: true }, { say: '……又跳掣？' }]); }
    else if (on && !kidUp && mr !== 'u' && LIV.open) later(M, [{ go: 'uswitch' }, { sw: 'ulight', on: false }, { say: '囡囡又沒關燈……' }, ...look]);
  } else if (id === 'udesk' || id === 'ustar') {
    const n = id === 'ustar' ? 'unight' : 'udesk';
    if (!on && K && kidUp) react(K, 2, [{ say: id === 'ustar' ? '星星不見了……' : '書枱燈壞了？' }, { go: n }, { sw: id, on: true }]);
    else if (on && !kidUp && LIV.open) later(M, [{ go: n }, { sw: id, on: false }]);
  }
}
