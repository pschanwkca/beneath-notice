// =====================================================================
//  第五章 · 學校（楓林小學） — across the quiet street from the park's back gate
//  The machine's backup password is hidden in the daughter's old notebook, in her cubby at the back
//  of her classroom (3A). Between the park and the notebook:
//   · the street, crossed on the raised zebra crossing;
//   · the school gate (shut in lesson time — but there's a gap under it) and the guard in his booth;
//   · the playground, empty in lessons and full of children at break; the drain along the covered
//     walkway runs the whole length of it, under its grating;
//   · the corridor (low lockers on legs to hide under) and the classroom: the teacher at the board,
//     the class facing her — and the daughter at her desk by the window.
//  The bell runs the day: lessons, then break (the doors open, everyone pours out), then lessons
//  again. The classroom is locked at break; its back door opens only when the class goes back in.
//  The way out is the classroom window at the back, open a little at the bottom.
// =====================================================================
const SC = { said: {}, lights: [], kids: [], doors: {}, lockers: [], bush: [], shade: [], phase: 'class', pt: 0, bell: 0, cycle: 0, gotBook: false, essay: false, near: false, films: {}, net: null };
const SRY = GY - 12;   // the street's surface (a 12 cm kerb)
const SC_YARD = { x0: 920, x1: 3200, z0: 4320, z1: 4868 };
const SC_DRAIN = { x0: 920, x1: 3200, z0: 4868, z1: 4882, y: GY - 12, gaps: [[990, 1050], [2030, 2090], [3110, 3170]] };
const SC_WALK = { z0: 4882, z1: 5000 };
const SC_CORR = { x0: 920, x1: 3200, z0: 5020, z1: 5180 };
const SC_CLASS = { x0: 1716, x1: 2500, z0: 5196, z1: 5820 };
const SC_DOOR = { x0: 2000, x1: 2120, z: 5010 };          // the main entrance (double doors)
const SC_BACKDOOR = { x0: 2380, x1: 2470, z: 5188 };      // 3A's back door from the corridor
const SC_CUBBY = { x: 2470, y: GY + 7, z: 5540 };          // her cubby (bottom row) and the notebook in it
const SC_WIN = { x0: 2350, x1: 2470, z: 5830, sill: GY + 90 };   // the window at the back, open at the bottom
// the class sits in four rows facing the board on the west wall; her desk is by the window
const SC_ROWS = [1930, 2070, 2210, 2350], SC_COLS = [5340, 5500, 5660], SC_HER = [2, 2];

// ---------- textures ----------
function genCourt() {   // the playground's painted surface: blue-green court paint, white lines, a yellow hopscotch
  const W = 2048, H = 512, [c, x] = cnv(W, H), n = noiseField(256, 64, 4, 6, 1701);
  const X = u => (u - SC_YARD.x0) / (SC_YARD.x1 - SC_YARD.x0) * W, Z = v => (v - SC_YARD.z0) / (SC_YARD.z1 - SC_YARD.z0) * H;
  const id = x.createImageData(W, H), d = id.data;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = (j * W + i) * 4, v = .9 + (n[(j >> 3) * 256 + (i >> 3)] - .5) * .22 + (hashI(j * W + i) - .5) * .06; d[k] = 70 * v; d[k + 1] = 128 * v; d[k + 2] = 118 * v; d[k + 3] = 255; }
  x.putImageData(id, 0, 0);
  x.strokeStyle = 'rgba(244,242,232,.92)'; x.lineWidth = 5;
  const cx = X(2060), cz = Z(4600), hw = X(2060 + 620) - cx, hh = Z(4600 + 230) - cz;
  x.strokeRect(cx - hw, cz - hh, hw * 2, hh * 2); x.beginPath(); x.moveTo(cx, cz - hh); x.lineTo(cx, cz + hh); x.stroke();
  x.beginPath(); x.ellipse(cx, cz, X(2060 + 90) - cx, Z(4600 + 90) - cz, 0, 0, 6.283); x.stroke();
  for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * hw, cz, X(2060 + 190) - cx, Z(4600 + 190) - cz, 0, s > 0 ? Math.PI / 2 : -Math.PI / 2, s > 0 ? Math.PI * 1.5 : Math.PI / 2); x.stroke(); x.strokeRect(s > 0 ? cx + hw - (X(2060 + 160) - cx) : cx - hw, cz - (Z(4600 + 60) - cz), X(2060 + 160) - cx, (Z(4600 + 60) - cz) * 2); }
  // hopscotch and a four-square in the west corner
  x.strokeStyle = 'rgba(240,200,70,.9)'; x.lineWidth = 4; const hx = X(1080), hz = Z(4400), s = X(1080 + 40) - hx;
  [[0, 0], [0, 1], [-.5, 2], [.5, 2], [0, 3], [-.5, 4], [.5, 4], [0, 5]].forEach(([a, b]) => x.strokeRect(hx + a * s, hz + b * s * .5, s, s * .5));
  x.fillStyle = 'rgba(240,200,70,.9)'; x.font = '700 22px "Fredoka", sans-serif'; x.textAlign = 'center'; for (let i = 1; i <= 8; i++) x.fillText(String(i), hx + s * .5 + [0, 0, -.5, .5, 0, -.5, .5, 0][i - 1] * s, hz + [0, 1, 2, 2, 3, 4, 4, 5][i - 1] * s * .5 + 20);
  x.strokeStyle = 'rgba(240,120,90,.85)'; const fx = X(2860), fz = Z(4380), fs = X(2860 + 70) - fx; x.strokeRect(fx, fz, fs * 2, fs * 2); x.beginPath(); x.moveTo(fx + fs, fz); x.lineTo(fx + fs, fz + fs * 2); x.moveTo(fx, fz + fs); x.lineTo(fx + fs * 2, fz + fs); x.stroke();
  const t = tex(c); return t;
}
function genSchoolTiles(seed, a, b, sz = 64) {   // speckled vinyl / terrazzo floor tiles
  const W = 512, n = noiseField(W, W, 3, 10, seed); const h = new Float32Array(W * W);
  const c = fromFn(W, W, (x, y, i, o) => { const lx = x % sz, ly = y % sz, e = Math.min(lx, ly, sz - lx, sz - ly), g = e < 1.5; const sp = hashI(i * 3 + seed); const alt = ((Math.floor(x / sz) + Math.floor(y / sz)) & 1) ? 1 : .96;
    let v = (g ? .78 : alt) * (.95 + (n[i] - .5) * .08); const fleck = sp > .985 ? -.25 : sp > .96 ? .08 : 0; o[0] = (a[0] + (b[0] - a[0]) * n[i]) * (v + fleck); o[1] = (a[1] + (b[1] - a[1]) * n[i]) * (v + fleck); o[2] = (a[2] + (b[2] - a[2]) * n[i]) * (v + fleck); h[i] = g ? 0 : 1; });
  return { map: tex(c), normalMap: normalTex(h, W, W, 1.2) };
}
function genSchoolWallTile() {   // the small glazed tiles on the lower walls of the corridor
  const W = 256, h = new Float32Array(W * W);
  const c = fromFn(W, W, (x, y, i, o) => { const lx = x % 32, ly = y % 32, e = Math.min(lx, ly, 32 - lx, 32 - ly), g = e < 1.2; const v = g ? .74 : .96 + (hashI(Math.floor(x / 32) * 31 + Math.floor(y / 32)) - .5) * .05; o[0] = 214 * v; o[1] = 232 * v; o[2] = 222 * v; h[i] = g ? 0 : sstep(0, 4, e); });
  return { map: tex(c), normalMap: normalTex(h, W, W, 1.6) };
}
// a line of text that squeezes itself narrower if it would run past maxW (the English lines run longer)
function fitText(x, s, px, py, maxW) { const w = x.measureText(s).width; if (w <= maxW) { x.fillText(s, px, py); return; } const k = maxW / w, a = x.textAlign; x.save(); x.translate(px, py); x.scale(k, 1); x.fillText(s, 0, 0); x.restore(); }
function blackboardTex() {
  const W = 1024, H = 512, [c, x] = cnv(W, H); const n = noiseField(128, 64, 3, 4, 1711);
  const id = x.createImageData(W, H), d = id.data; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = (j * W + i) * 4, v = .85 + (n[(j >> 3) * 128 + (i >> 3)] - .5) * .3; d[k] = 34 * v; d[k + 1] = 70 * v; d[k + 2] = 52 * v; d[k + 3] = 255; }
  x.putImageData(id, 0, 0);
  x.fillStyle = 'rgba(240,240,230,.86)'; x.font = `600 40px ${HAND}`; fitText(x, '三年甲班　中文科', 40, 64, 700);
  x.font = `500 34px ${HAND}`; fitText(x, '第十二課　《我的家》', 40, 130, 700); fitText(x, '生字：溫暖　陪伴　忙碌　等待', 40, 190, 700);
  fitText(x, '造句：雖然……但是……', 40, 250, 700); x.fillStyle = 'rgba(250,220,120,.85)'; fitText(x, '今日功課：作業 P.24、P.25', 40, 330, 700);
  x.fillStyle = 'rgba(240,240,230,.8)'; x.font = '500 26px "Noto Sans TC", sans-serif'; x.fillText('值日生：22 號', 40, 470);
  // a chalk sun and a house in the corner
  x.strokeStyle = 'rgba(240,240,230,.7)'; x.lineWidth = 4; x.beginPath(); x.arc(860, 110, 40, 0, 6.283); x.stroke(); for (let a = 0; a < 6.28; a += .79) { x.beginPath(); x.moveTo(860 + Math.cos(a) * 52, 110 + Math.sin(a) * 52); x.lineTo(860 + Math.cos(a) * 72, 110 + Math.sin(a) * 72); x.stroke(); }
  x.strokeRect(800, 300, 140, 110); x.beginPath(); x.moveTo(785, 305); x.lineTo(870, 230); x.lineTo(955, 305); x.stroke(); x.strokeRect(850, 350, 36, 60);
  return tex(c);
}
function corkBoardTex() {   // the class notice board: "我的家人" essays and drawings pinned all over (hers is a separate sheet)
  const W = 1024, H = 256, [c, x] = cnv(W, H); const n = noiseField(256, 64, 3, 16, 1721);
  const id = x.createImageData(W, H), d = id.data; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = (j * W + i) * 4, sp = hashI(j * W + i), v = .78 + (n[(j >> 2) * 256 + (i >> 2)] - .5) * .3 + (sp > .8 ? -.15 : 0); d[k] = 176 * v; d[k + 1] = 128 * v; d[k + 2] = 82 * v; d[k + 3] = 255; }
  x.putImageData(id, 0, 0);
  x.fillStyle = '#c8402e'; x.fillRect(360, 8, 300, 34); x.fillStyle = '#fff6e0'; x.font = '700 24px "Noto Sans TC", sans-serif'; x.textAlign = 'center'; fitText(x, '作文園地：我的家人', 510, 34, 284);
  const titles = ['我的媽媽', '我的哥哥', '我的爺爺', '我的妹妹', '我的家', '我的爸爸', '我的嫲嫲', '我的小狗'];
  for (let i = 0; i < 10; i++) { if (i === 5) continue;   // (her essay goes in the gap)
    const px = 30 + i * 100, py = 56 + (i % 2) * 12; x.save(); x.translate(px + 40, py + 80); x.rotate((hashI(i * 7) - .5) * .08); x.fillStyle = '#f7f3e8'; x.fillRect(-40, -80, 80, 170);
    x.fillStyle = 'rgba(40,40,60,.8)'; x.font = `600 13px ${HAND}`; x.textAlign = 'center'; fitText(x, titles[i % titles.length], 0, -60, 74);
    x.strokeStyle = 'rgba(60,60,80,.35)'; x.lineWidth = 1.2; for (let l = 0; l < 9; l++) { const w = 50 + hashI(i * 31 + l) * 14; x.beginPath(); x.moveTo(-w / 2, -40 + l * 13); for (let s = 0; s < w; s += 4) x.lineTo(-w / 2 + s, -40 + l * 13 + Math.sin(s * 1.3 + l) * 1.2); x.stroke(); }
    if (i % 3 === 0) { x.fillStyle = 'rgba(220,60,60,.75)'; x.font = '700 16px "Noto Sans TC", sans-serif'; x.fillText('優', 26, 74); }
    x.fillStyle = ['#d84a3a', '#3a7ad8', '#e0b030'][i % 3]; x.beginPath(); x.arc(0, -76, 4, 0, 6.283); x.fill(); x.restore(); }
  return tex(c);
}
// her essay, readable up close (its words are part of the story)
function essayTex() {
  const W = 1024, H = 1448, [c, x] = cnv(W, H); x.fillStyle = '#f8f5ec'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(90,130,200,.3)'; x.lineWidth = 2; for (let y = 300; y < H - 120; y += 84) { x.beginPath(); x.moveTo(60, y); x.lineTo(W - 60, y); x.stroke(); }
  x.strokeStyle = 'rgba(220,80,80,.35)'; x.beginPath(); x.moveTo(120, 220); x.lineTo(120, H - 100); x.stroke();
  x.fillStyle = 'rgba(30,34,60,.9)'; x.textAlign = 'center'; x.font = `700 72px ${HAND}`; x.fillText('我的爸爸', W / 2, 130);
  x.font = `500 34px ${HAND}`; x.fillText('三年甲班（22）', W / 2, 200);
  x.textAlign = 'left'; x.font = `500 44px ${HAND}`;
  const L = ['我的爸爸是科學家，他每天都在', '地下室工作，做一部很厲害的機器。', '爸爸很忙，有時候晚飯也不上來吃。', '他說機器做好了，就帶我去公園', '玩滑梯。可是後來，爸爸不見了。', '媽媽說爸爸去了很遠的地方工作。', '我每天都留一碗飯給他。', '爸爸，你快點回來好嗎？'];
  L.forEach((s, i) => fitText(x, s, 140, 288 + i * 84, W - 180));
  // a crayon drawing: her and a tall man holding hands under a sun
  x.lineWidth = 6; x.lineCap = 'round'; x.strokeStyle = '#e0a020'; x.beginPath(); x.arc(860, 1100, 46, 0, 6.283); x.stroke();
  x.strokeStyle = '#3a6ad0'; x.beginPath(); x.arc(640, 1050, 34, 0, 6.283); x.moveTo(640, 1084); x.lineTo(640, 1210); x.moveTo(640, 1210); x.lineTo(610, 1290); x.moveTo(640, 1210); x.lineTo(670, 1290); x.moveTo(600, 1130); x.lineTo(700, 1140); x.stroke();
  x.strokeStyle = '#d0508a'; x.beginPath(); x.arc(760, 1140, 24, 0, 6.283); x.moveTo(760, 1164); x.lineTo(760, 1240); x.moveTo(760, 1240); x.lineTo(740, 1290); x.moveTo(760, 1240); x.lineTo(780, 1290); x.moveTo(700, 1140); x.lineTo(780, 1190); x.stroke();
  x.fillStyle = '#d0508a'; x.beginPath(); x.moveTo(735, 1180); x.lineTo(785, 1180); x.lineTo(800, 1250); x.lineTo(720, 1250); x.fill();
  // the teacher's red comment
  x.fillStyle = 'rgba(210,40,40,.88)'; x.font = `500 34px ${HAND}`; fitText(x, '寫得很真摯。老師相信，', 140, 1360, 660); fitText(x, '爸爸也很想念你。', 140, 1404, 660);
  x.font = '900 64px "Noto Sans TC", sans-serif'; x.fillText('優', 860, 1390); x.strokeStyle = 'rgba(210,40,40,.8)'; x.lineWidth = 5; x.beginPath(); x.arc(892, 1368, 48, 0, 6.283); x.stroke();
  const t = tex(c); t.anisotropy = 8; return t;
}
// her old notebook: the cover (stickers, her name label) and the inside cover with Dad's note
function notebookTex(inside) {
  const W = 512, H = 720, [c, x] = cnv(W, H);
  if (!inside) {
    x.fillStyle = '#e88aa6'; x.fillRect(0, 0, W, H); const n = noiseField(64, 90, 3, 6, 1731); for (let j = 0; j < 90; j++) for (let i = 0; i < 64; i++) { x.fillStyle = `rgba(255,255,255,${(n[j * 64 + i] - .5) * .1 + .03})`; x.fillRect(i * 8, j * 8, 8, 8); }
    x.fillStyle = '#fbf4e6'; x.fillRect(96, 300, 320, 130); x.strokeStyle = '#b84a6a'; x.lineWidth = 4; x.strokeRect(104, 308, 304, 114);
    x.fillStyle = 'rgba(40,40,60,.85)'; x.textAlign = 'center'; x.font = `700 40px ${HAND}`; fitText(x, '秘密筆記', 256, 360, 290); x.font = `500 28px ${HAND}`; x.fillText('3A（22）', 256, 404);
    const st = (sx, sy, col, f) => { x.fillStyle = col; x.beginPath(); f(sx, sy); x.fill(); };
    st(120, 120, '#ffd23a', (a, b) => { for (let i = 0; i < 10; i++) { const r = i % 2 ? 22 : 50, q = i / 10 * 6.283 - 1.57; x.lineTo(a + Math.cos(q) * r, b + Math.sin(q) * r); } });
    st(400, 160, '#7ad0f0', (a, b) => x.arc(a, b, 42, 0, 6.283)); x.fillStyle = '#2a2a3a'; x.beginPath(); x.arc(388, 150, 6, 0, 6.283); x.arc(412, 150, 6, 0, 6.283); x.fill();
    st(380, 560, '#f0f0f0', (a, b) => x.ellipse(a, b, 56, 44, 0, 0, 6.283)); x.fillStyle = '#f2aeb0'; x.beginPath(); x.arc(344, 520, 16, 0, 6.283); x.arc(416, 520, 16, 0, 6.283); x.fill();   // a little white mouse sticker
    x.fillStyle = '#2a2a3a'; x.beginPath(); x.arc(366, 556, 5, 0, 6.283); x.arc(394, 556, 5, 0, 6.283); x.fill();
  } else {
    x.fillStyle = '#f6f1e4'; x.fillRect(0, 0, W, H); x.strokeStyle = 'rgba(90,130,200,.3)'; x.lineWidth = 2; for (let y = 120; y < H; y += 56) { x.beginPath(); x.moveTo(30, y); x.lineTo(W - 30, y); x.stroke(); }
    x.fillStyle = 'rgba(30,40,80,.9)'; x.font = `600 30px ${HAND}`; fitText(x, '給我的小科學家：', 40, 100, W - 70); x.font = `500 28px ${HAND}`;
    fitText(x, '這是我們的秘密密碼，', 40, 160, W - 70); fitText(x, '誰也不要告訴喔！', 40, 216, W - 70);
    x.font = `700 92px ${HAND}`; x.textAlign = 'center'; x.fillStyle = 'rgba(200,50,70,.9)'; x.fillText('0 7 1 8', W / 2, 360);
    x.font = `500 28px ${HAND}`; x.fillStyle = 'rgba(30,40,80,.9)'; fitText(x, '（提示：你的生日）', W / 2, 420, W - 70); x.textAlign = 'right'; x.fillText('—— 爸爸', W - 40, 500);
    x.strokeStyle = '#e0a020'; x.lineWidth = 5; x.beginPath(); x.arc(120, 600, 34, 0, 6.283); x.stroke();
    x.strokeStyle = '#d0508a'; x.beginPath(); x.moveTo(240, 650); x.lineTo(300, 570); x.lineTo(420, 650); x.stroke();   // a slide, drawn by a grown-up
  }
  const t = tex(c); t.anisotropy = 8; return t;
}
function classSignTex(s, sub) {
  const [c, x] = cnv(256, 96); x.fillStyle = '#f4f1e8'; x.fillRect(0, 0, 256, 96); x.fillStyle = '#2f5a8a'; x.fillRect(0, 0, 256, 8); x.fillRect(0, 88, 256, 8);
  x.fillStyle = '#1e3a5a'; x.textAlign = 'center'; x.font = '800 44px "Fredoka", "Noto Sans TC", sans-serif'; fitText(x, s, 128, 56, 236); x.font = '600 18px "Noto Sans TC", sans-serif'; fitText(x, sub, 128, 80, 236); return tex(c);
}
function roadWordTex() {   // "學校 SCHOOL" painted on the road before the crossing
  const [c, x] = cnv(512, 256); x.clearRect(0, 0, 512, 256); x.fillStyle = 'rgba(240,200,70,.92)'; x.textAlign = 'center'; x.font = '900 120px "Noto Sans TC", sans-serif'; x.fillText('學校', 256, 128); x.font = '800 64px "Fredoka", sans-serif'; x.fillText('SCHOOL', 256, 218); return tex(c);
}
function schoolSignBoardTex() {   // the sign on the zone pole: two children walking
  const [c, x] = cnv(256, 256); x.fillStyle = 'rgba(0,0,0,0)'; x.clearRect(0, 0, 256, 256);
  x.fillStyle = '#f4f2ec'; x.strokeStyle = '#c8282a'; x.lineWidth = 22; x.beginPath(); x.moveTo(128, 20); x.lineTo(240, 226); x.lineTo(16, 226); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = '#1a1a1a'; for (const [cx, s] of [[104, 1], [150, .85]]) { x.beginPath(); x.arc(cx, 112 - (1 - s) * 30, 12 * s, 0, 6.283); x.fill(); x.fillRect(cx - 9 * s, 126 - (1 - s) * 30, 18 * s, 44 * s); x.fillRect(cx - 9 * s, 168 - (1 - s) * 18, 7 * s, 34 * s); x.fillRect(cx + 2 * s, 168 - (1 - s) * 18, 7 * s, 34 * s); }
  return tex(c);
}
function flagTex() { const [c, x] = cnv(256, 160); x.fillStyle = '#7a1f22'; x.fillRect(0, 0, 256, 160); x.fillStyle = '#f2efe6'; x.beginPath(); x.arc(128, 80, 46, 0, 6.283); x.fill(); x.fillStyle = '#7a1f22'; x.font = '900 52px "Noto Sans TC", sans-serif'; x.textAlign = 'center'; x.fillText('楓', 128, 98); return tex(c); }
function facadeTex() {   // neighbouring blocks of flats: rows of windows
  const W = 256, H = 512, [c, x] = cnv(W, H); x.fillStyle = '#c9c2b4'; x.fillRect(0, 0, W, H);
  for (let r = 0; r < 8; r++) for (let k = 0; k < 4; k++) { const v = hashI(r * 17 + k * 3); x.fillStyle = v > .7 ? '#5a6878' : '#3e4a58'; x.fillRect(16 + k * 60, 20 + r * 62, 40, 36); x.fillStyle = '#e8e2d6'; x.fillRect(12 + k * 60, 58 + r * 62, 48, 5); }
  return tex(c);
}

// ---------- build ----------
function buildSchool() {
  const K = kitchenMats(), M = MAT;
  LV.add(new THREE.HemisphereLight(0xc4dcff, 0xb2b2b0, 1.35));   // (a neutral ground colour: the ceilings indoors would turn olive)
  const conc = new THREE.MeshStandardMaterial({ map: MAT.floor.map, normalMap: MAT.floor.normalMap, color: 0xc4c2bc, roughness: .85 });
  const pave = new THREE.MeshStandardMaterial({ map: MAT.floor.map, normalMap: MAT.floor.normalMap, color: 0xb0aca4, roughness: .9 });
  const asph = new THREE.MeshStandardMaterial({ map: (ST.mats && ST.mats.asph) || null, color: ST.mats && ST.mats.asph ? 0xffffff : 0x3a3c40, roughness: .9 });
  const white = new THREE.MeshStandardMaterial({ color: 0xeeece4, roughness: .7 }), yellowL = new THREE.MeshStandardMaterial({ color: 0xe8c040, roughness: .7 });
  const wallW = new THREE.MeshStandardMaterial({ color: 0xece6d8, roughness: .92 }), wallG = new THREE.MeshStandardMaterial({ color: 0xd8e4da, roughness: .9 });
  const brick = new THREE.MeshStandardMaterial({ color: 0x8a4a36, roughness: .9 }), green = new THREE.MeshStandardMaterial({ color: 0x2c5a46, metalness: .5, roughness: .45 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x2c3430, metalness: .65, roughness: .45 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x8aa2b4, roughness: .05, metalness: .25, clearcoat: 1, transparent: true, opacity: .32, depthWrite: false });
  const frame = new THREE.MeshStandardMaterial({ color: 0xdedad0, roughness: .5, metalness: .3 });
  const wt = genSchoolWallTile(); const tileW = new THREE.MeshPhysicalMaterial({ ...wt, roughness: .25, clearcoat: .5 });
  const ct = genSchoolTiles(1741, [214, 206, 192], [190, 182, 170], 64); const corrF = new THREE.MeshPhysicalMaterial({ ...ct, roughness: .35, clearcoat: .4, normalScale: new THREE.Vector2(.4, .4) });
  const vt = genSchoolTiles(1743, [206, 200, 186], [176, 168, 150], 128); const classF = new THREE.MeshPhysicalMaterial({ ...vt, roughness: .4, clearcoat: .3, normalScale: new THREE.Vector2(.3, .3) });
  const desk = new THREE.MeshStandardMaterial({ ...genWood([198, 160, 112], [140, 104, 66], 1751), roughness: .5 }), deskEdge = new THREE.MeshStandardMaterial({ color: 0x3a5a7a, roughness: .5 });
  const ceil = new THREE.MeshStandardMaterial({ color: 0xeef0f0, roughness: .95, envMapIntensity: .12, emissive: 0x44474c }), lampM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4f8ff, emissiveIntensity: 2.2 });
  const leafA = new THREE.MeshStandardMaterial({ color: 0x4f7f3a, roughness: .9, flatShading: true, emissive: 0x2a4a1c }), leafB = new THREE.MeshStandardMaterial({ color: 0x6a8a36, roughness: .9, flatShading: true, emissive: 0x34481a });
  const shrub = new THREE.MeshStandardMaterial({ color: 0x3e6a32, roughness: 1, flatShading: true }), trunk = new THREE.MeshStandardMaterial({ color: 0x3a2c22, roughness: .95 });
  SC.mats = { glass, frame, desk, deskEdge, metal, white, lampM };
  const W0 = 900, W1 = 3220;   // the school's grounds, wall to wall

  // ================= the street =================
  box(-340, 3500, GY - 10, GY, 3740, 3900, pave, { uv: 128, cast: false });                       // pavement on the park's side
  box(-340, 3500, GY - .2, GY + .15, 3886, 3900, white, { col: false, cast: false });
  box(-340, 3500, SRY - 10, SRY, 3900, 4180, asph, { uv: 220, cast: false });                     // the road
  box(-340, 3500, GY - 10, GY, 4180, 4300, pave, { uv: 128, cast: false });                       // pavement on the school's side
  box(-340, 3500, GY - .2, GY + .15, 4180, 4194, white, { col: false, cast: false });
  // the raised zebra crossing (a school zone: level with both pavements) and its ramps for the cars
  box(1990, 2130, SRY, GY, 3900, 4180, conc, { uv: 80, cast: false });
  for (let z = 3912; z < 4172; z += 44) box(1996, 2124, GY, GY + .25, z, z + 22, white, { col: false, cast: false });
  for (const [xa, xb] of [[1930, 1990], [2190, 2130]]) {
    const g = new THREE.BufferGeometry(), lo = SRY, hi = GY, z0 = 3900, z1 = 4180;
    g.setAttribute('position', new THREE.Float32BufferAttribute([xa, lo, z0, xb, hi, z0, xb, hi, z1, xa, lo, z0, xb, hi, z1, xa, lo, z1], 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, conc); m.material = conc.clone(); m.material.side = THREE.DoubleSide; m.receiveShadow = true; m.userData.noSolid = true; LV.add(m);
    for (let i = 1; i <= 13; i++) { const y = SRY + (GY - SRY) * i / 13, xi = xa + (xb - xa) * (i / 13); cols.push({ t: 'b', x0: Math.min(xi, xb), x1: Math.max(xi, xb), y0: SRY, y1: y, z0: 3900, z1: 4180 }); }
  }
  for (const s of [-1, 1]) for (let z = 3920; z < 4170; z += 38) box(2060 + s * 140 - 6, 2060 + s * 140 + 6, SRY, SRY + .2, z, z + 18, white, { col: false, cast: false });   // zigzag stubs
  { const w = new THREE.Mesh(new THREE.PlaneGeometry(220, 110), new THREE.MeshStandardMaterial({ map: roadWordTex(), transparent: true, depthWrite: false, roughness: .8 })); w.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); w.position.set(1640, SRY + .3, 4040); LV.add(w); w.userData.noSolid = true;
    const w2 = w.clone(); w2.rotation.z = Math.PI / 2; w2.position.x = 2480; LV.add(w2); }
  // a parked car on the school's side (good cover; nothing drives here in lesson time)
  if (typeof buildRoadCar === 'function' && ST.mats) { const C = buildRoadCar(4); C.g.visible = true; C.g.position.set(2640, SRY, 4100); C.g.rotation.y = -Math.PI / 2; SC.car = C.g; }
  // the school-zone sign
  cyl(1880, 4256, 3, GY, GY + 260, metal, { seg: 10 }); { const s = mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshStandardMaterial({ map: schoolSignBoardTex(), transparent: true, alphaTest: .5, roughness: .6, side: THREE.DoubleSide }), 1880, GY + 236, 4253, { cast: false }); s.rotation.y = Math.PI; }
  for (let x = 1500; x < 2700; x += 140) if (x < 1960 || x > 2180) cyl(x, 4270, 5, GY, GY + 70, new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: .6 }), { seg: 12 });   // bollards

  // ================= the school's front wall, the gate and the guard's booth =================
  const rails = new THREE.InstancedMesh(new THREE.BoxGeometry(2.2, 120, 2.2), green, 400); let ri = 0; const m4 = new THREE.Matrix4();
  for (const [a, b] of [[W0, 1640], [2480, W1]]) { box(a, b, GY, GY + 70, 4300, 4320, wallW, { uv: 60 }); box(a, b, GY + 70, GY + 76, 4298, 4322, conc);
    for (let x = a + 8; x < b - 4 && ri < 400; x += 14) { m4.makeTranslation(x, GY + 136, 4310); rails.setMatrixAt(ri++, m4); }
    box(a, b, GY + 192, GY + 196, 4308, 4312, green, { col: false }); cols.push({ t: 'b', x0: a, x1: b, y0: GY + 76, y1: GY + 196, z0: 4306, z1: 4314, slick: true }); }
  rails.count = ri; rails.castShadow = true; LV.add(rails);
  // solid walls either side of the gate, with the school's name
  for (const [a, b] of [[1640, 1940], [2180, 2480]]) { box(a, b, GY, GY + 210, 4296, 4324, wallW, { uv: 60 }); box(a - 4, b + 4, GY + 210, GY + 218, 4292, 4328, conc); }
  for (const x of [1940, 2160]) { box(x, x + 20, GY, GY + 230, 4292, 4328, brick, { uv: 40 }); box(x - 3, x + 23, GY + 230, GY + 238, 4289, 4331, conc); }
  { const sg = mesh(new THREE.PlaneGeometry(280, 70), new THREE.MeshStandardMaterial({ map: schoolSignTex(), roughness: .6 }), 1790, GY + 140, 4294.5, { cast: false }); sg.rotation.y = Math.PI; }
  // the sliding gate, shut: a gap of 9 cm under it
  { const g = new THREE.Group(); g.position.set(2060, GY, 4310); LV.add(g); SC.gate = g;
    for (let x = -96; x <= 96; x += 12) mesh(new THREE.BoxGeometry(2.4, 158, 2.4), green, x, 9 + 79, 0, { parent: g });
    for (const y of [10, 60, 120, 166]) mesh(new THREE.BoxGeometry(200, 3.2, 3.2), green, 0, y, 0, { parent: g });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(3, 3, 4, 12), MAT.dsteel, s * 80, 6, 0, { parent: g }).rotation.x = Math.PI / 2;   // its little wheels
    cols.push({ t: 'b', x0: 1960, x1: 2160, y0: GY + 9, y1: GY + 170, z0: 4306, z1: 4314, slick: true });
    box(1960, 2400, GY, GY + .8, 4307, 4313, MAT.dsteel, { col: false, cast: false });   // the track it slides on
    box(1940, 2180, GY - 10, GY, 4296, 4324, conc, { cast: false }); }
  // the guard's booth, just inside the gate
  { const bx0 = 2200, bx1 = 2330, bz0 = 4336, bz1 = 4450, H = 230;
    box(bx0, bx1, GY - .2, GY + .6, bz0, bz1, conc, { cast: false });
    box(bx0, bx1, GY, GY + 100, bz0, bz0 + 8, wallW); box(bx0, bx0 + 8, GY, GY + 100, bz0, bz1, wallW);                       // low walls under the windows (north, west)
    box(bx1 - 8, bx1, GY, GY + H, bz0, bz1, wallW); box(bx0, bx1 - 50, GY, GY + H, bz1 - 8, bz1, wallW);                    // east wall, south wall (door gap at the east end)
    box(bx0, bx1, GY + 200, GY + H, bz0, bz0 + 8, wallW); box(bx0, bx0 + 8, GY + 200, GY + H, bz0, bz1, wallW);
    for (const x of [bx0, bx0 + 64, bx1 - 8]) box(x, x + 8, GY + 100, GY + 200, bz0, bz0 + 8, frame); for (const z of [bz0 + 56, bz1 - 8]) box(bx0, bx0 + 8, GY + 100, GY + 200, z, z + 8, frame);
    box(bx0 + 2, bx1 - 2, GY + 100, GY + 200, bz0 + 3, bz0 + 5, glass, { col: false, cast: false }); box(bx0 + 3, bx0 + 5, GY + 100, GY + 200, bz0 + 2, bz1 - 2, glass, { col: false, cast: false });
    box(bx0 - 10, bx1 + 10, GY + H, GY + H + 12, bz0 - 14, bz1 + 10, conc);
    box(bx0 + 10, bx0 + 60, GY, GY + 74, bz0 + 30, bz1 - 20, desk); box(bx0 + 10, bx0 + 60, GY + 74, GY + 76, bz0 + 30, bz1 - 20, deskEdge);   // his desk under the window
    { const s = mesh(new THREE.PlaneGeometry(60, 22), new THREE.MeshStandardMaterial({ map: classSignTex('保安室', LANG_EN ? '' : 'SECURITY'), roughness: .6 }), bx0 + 66, GY + 214, bz0 - .5, { cast: false }); s.rotation.y = Math.PI; }
    SC.booth = { x0: bx0, x1: bx1, z0: bz0, z1: bz1 }; }

  // ================= the playground =================
  box(920, 3200, GY - 22, GY - 1, SC_YARD.z0, SC_YARD.z1, conc, { uv: 90, cast: false, col: false });   // (concrete under the painted court: the drain's side shows it)
  box(920, 3200, GY - 1, GY, SC_YARD.z0, SC_YARD.z1, new THREE.MeshStandardMaterial({ map: genCourt(), normalMap: MAT.floor.normalMap, roughness: .78 }), { cast: false });
  cols.push({ t: 'b', x0: 920, x1: 3200, y0: GY - 22, y1: GY, z0: SC_YARD.z0, z1: SC_YARD.z1 });
  box(W0, 920, GY - 10, GY + 250, 4300, 5000, wallW, { uv: 60 }); box(3200, W1, GY - 10, GY + 250, 4300, 5000, wallW, { uv: 60 });   // side walls of the grounds
  box(W0 - 3, 923, GY + 250, GY + 258, 4296, 5000, conc); box(3197, W1 + 3, GY + 250, GY + 258, 4296, 5000, conc);
  // the drain along the walkway: a channel 14 wide, 12 deep, under a grating (three grates are missing)
  box(920, 3200, GY - 26, SC_DRAIN.y, SC_DRAIN.z0, SC_DRAIN.z1, new THREE.MeshStandardMaterial({ color: 0x3a3c38, roughness: .95 }), { cast: false });
  { const segs = []; let a = 920; for (const [g0, g1] of SC_DRAIN.gaps) { segs.push([a, g0]); a = g1; } segs.push([a, 3200]);
    let nb = 0; for (const [s0, s1] of segs) nb += Math.ceil((s1 - s0) / 4.5);
    const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 1.2, 14), MAT.dsteel, nb); let bi = 0;
    for (const [s0, s1] of segs) { for (let x = s0 + 1; x < s1 && bi < nb; x += 4.5) { m4.makeTranslation(x, GY - .6, (SC_DRAIN.z0 + SC_DRAIN.z1) / 2); bars.setMatrixAt(bi++, m4); }
      box(s0, s1, GY - 1.2, GY - .9, SC_DRAIN.z0, SC_DRAIN.z0 + 1.2, MAT.dsteel, { col: false, cast: false }); box(s0, s1, GY - 1.2, GY - .9, SC_DRAIN.z1 - 1.2, SC_DRAIN.z1, MAT.dsteel, { col: false, cast: false });
      cols.push({ t: 'b', x0: s0, x1: s1, y0: GY - 1.2, y1: GY, z0: SC_DRAIN.z0, z1: SC_DRAIN.z1 }); }
    bars.count = bi; bars.receiveShadow = true; LV.add(bars);
    // the missing grates lean against the wall nearby
    for (const [g0, g1] of SC_DRAIN.gaps) { const gr = mesh(new THREE.BoxGeometry(g1 - g0 - 4, 1.2, 14), MAT.dsteel, (g0 + g1) / 2 + 30, GY + 1, SC_DRAIN.z1 + 30); gr.rotation.y = .3; } }
  // the covered walkway in front of the building
  box(920, 3200, GY - 22, GY, SC_WALK.z0, SC_WALK.z1, conc, { uv: 90, cast: false });
  box(920, 3200, GY + 300, GY + 318, 4876, 5000, ceil); box(920, 3200, GY + 318, GY + 322, 4872, 5000, conc);
  for (let x = 1000; x < 3200; x += 300) { if (Math.abs(x - 2060) < 80) continue; box(x - 12, x + 12, GY, GY + 300, 4888, 4912, wallW, { uv: 40 }); }
  for (let x = 1100; x < 3200; x += 300) { box(x - 40, x + 40, GY + 296, GY + 300, 4930, 4940, lampM, { col: false, cast: false }); }
  // planters with shrubs (climb in and hide), benches, the drinking fountain, the ball cage
  for (const [x0, z0] of [[1150, 4600], [2720, 4600]]) { box(x0, x0 + 270, GY, GY + 60, z0, z0 + 140, brick, { uv: 30 }); box(x0 + 8, x0 + 262, GY + 52, GY + 56, z0 + 8, z0 + 132, new THREE.MeshStandardMaterial({ map: genSoil(), roughness: 1 }), { cast: false });
    for (let i = 0; i < 9; i++) { const sx = x0 + 30 + (i % 5) * 52 + R(-8, 8), sz = z0 + 40 + Math.floor(i / 5) * 60 + R(-8, 8), r = R(26, 38); const s = mesh(new THREE.IcosahedronGeometry(r, 1), shrub, sx, GY + 56 + r * .6, sz); s.scale.y = .8; s.userData.noSolid = true; }
    SC.bush.push({ x0: x0 + 8, x1: x0 + 262, z0: z0 + 8, z1: z0 + 132, y: GY + 56 }); }
  const bench = (x, z, yaw) => { const g = new THREE.Group(); g.position.set(x, GY, z); g.rotation.y = yaw; LV.add(g);
    for (const dz of [-7, 0, 7]) mesh(new THREE.BoxGeometry(150, 3, 6), desk, 0, 42, dz, { parent: g }); for (const s of [-60, 60]) { mesh(new THREE.BoxGeometry(4, 42, 4), metal, s, 21, -8, { parent: g }); mesh(new THREE.BoxGeometry(4, 42, 4), metal, s, 21, 8, { parent: g }); }
    const c = Math.abs(Math.cos(yaw)), s = Math.abs(Math.sin(yaw)); cols.push({ t: 'b', x0: x - 75 * c - 11 * s, x1: x + 75 * c + 11 * s, y0: GY + 40, y1: GY + 44, z0: z - 75 * s - 11 * c, z1: z + 75 * s + 11 * c }); return g; };
  bench(1000, 4520, Math.PI / 2); bench(3120, 4520, -Math.PI / 2); bench(2380, 4950, 0); bench(1700, 4950, 0);
  SC.herBench = V3(2380, GY, 4950);
  box(1480, 1540, GY, GY + 76, 4960, 4994, MAT.steel); box(1484, 1536, GY + 76, GY + 80, 4962, 4992, K.steel);   // drinking fountain
  { const cage = new THREE.Group(); cage.position.set(2720, GY, 4940); LV.add(cage); const wm = new THREE.MeshStandardMaterial({ color: 0x8a9298, metalness: .7, roughness: .4 });
    for (const [w, h, d, x, y, z] of [[96, 2, 2, 0, 70, -30], [96, 2, 2, 0, 70, 30], [2, 2, 60, -48, 70, 0], [2, 2, 60, 48, 70, 0], [96, 2, 60, 0, 6, 0]]) mesh(new THREE.BoxGeometry(w, h, d), wm, x, y, z, { parent: cage });
    for (const x of [-48, 48]) for (const z of [-30, 30]) mesh(new THREE.BoxGeometry(2, 70, 2), wm, x, 35, z, { parent: cage });
    for (let i = 0; i < 7; i++) { const b = mesh(new THREE.SphereGeometry(11.5, 20, 14), new THREE.MeshStandardMaterial({ color: [0xd86a2a, 0xf0f0e8, 0x3a6ad0][i % 3], roughness: .6 }), R(-34, 34), 18 + (i > 3 ? 20 : 0), R(-18, 18), { parent: cage }); b.userData.noSolid = true; }
    cols.push({ t: 'b', x0: 2672, x1: 2768, y0: GY, y1: GY + 72, z0: 4910, z1: 4970 }); }
  // the flagpole and a big old tree with a round bench in its shade
  cyl(1100, 4420, 5, GY, GY + 900, MAT.steel, { seg: 12 }); cyl(1100, 4420, 22, GY, GY + 30, conc, { seg: 20 });
  { const g = new THREE.PlaneGeometry(150, 96, 12, 4); const f = mesh(g, new THREE.MeshStandardMaterial({ map: flagTex(), roughness: .8, side: THREE.DoubleSide }), 1100 + 76, GY + 840, 4420, { cast: true }); SC.flag = f; f.userData.noSolid = true; }
  { const x = 2960, z = 4480; cyl(x, z, 24, GY, GY + 360, trunk, { seg: 16 }); const bl = []; for (let i = 0; i < 7; i++) { const r = R(110, 150); const m = mesh(new THREE.IcosahedronGeometry(r, 1), i % 2 ? leafA : leafB, x + R(-100, 100), GY + R(380, 520), z + R(-100, 100)); m.rotation.set(R(0, 3), R(0, 3), 0); bl.push([m.position.x, m.position.y, m.position.z, r]); }
    REALT.push({ x, z, r: 24, y0: GY, top: GY + 360, bl, mat: leafA }); SC.shade.push({ x, z, r: 170 });
    const seat = new THREE.Mesh(new THREE.TorusGeometry(54, 8, 6, 40), desk); seat.rotation.x = Math.PI / 2; seat.scale.z = .25; seat.position.set(x, GY + 40, z); seat.castShadow = seat.receiveShadow = true; LV.add(seat); cols.push({ t: 'c', x, z, r: 62, y0: GY + 35, y1: GY + 42 }); }
  REALHIDE.push(leafA, leafB);

  // ================= the building =================
  const BZ0 = 5000, BZ1 = 5820, TOP = GY + 950;
  // the north face: the ground floor's corridor windows and the doors, three storeys of classroom windows above
  const winOut = new THREE.MeshPhysicalMaterial({ color: 0x4e6074, roughness: .05, metalness: .2, clearcoat: 1 });
  const winRow = (z, y0, y1, x0, x1) => { for (let x = x0; x < x1; x += 170) { box(x + 10, x + 150, y0, y1, z - 1, z + 1, winOut, { col: false, cast: false }); box(x + 6, x + 154, y0 - 4, y0, z - 6, z + 6, frame, { col: false }); } };
  { const DX0 = SC_DOOR.x0 - 30, DX1 = SC_DOOR.x1 + 30;
    for (const [a, b] of [[920, DX0], [DX1, 3200]]) {
      box(a, b, GY, GY + 90, BZ0, BZ0 + 20, tileW, { uv: 32 }); box(a, b, GY + 250, GY + 320, BZ0, BZ0 + 20, wallW);
      for (let x = a; x < b - 20; x += 170) { const xe = Math.min(x + 170, b - 10); box(x, x + 10, GY + 90, GY + 250, BZ0, BZ0 + 20, wallW); box(x + 10, xe, GY + 90, GY + 250, BZ0 + 9, BZ0 + 11, glass, { cast: false }); }
      box(b - 10, b, GY + 90, GY + 250, BZ0, BZ0 + 20, wallW); }
    box(DX0, SC_DOOR.x0, GY, GY + 250, BZ0, BZ0 + 20, wallW); box(SC_DOOR.x1, DX1, GY, GY + 250, BZ0, BZ0 + 20, wallW);
    box(DX0, DX1, GY + 240, GY + 320, BZ0, BZ0 + 20, wallW); box(SC_DOOR.x0, SC_DOOR.x1, GY + 236, GY + 242, BZ0 - 2, BZ0 + 22, frame, { col: false });
    box(SC_DOOR.x0, SC_DOOR.x1, GY - 10, GY, BZ0, BZ0 + 20, conc, { cast: false }); }   // the threshold
  { const mk = (hx, s) => { const g = new THREE.Group(); g.position.set(hx, GY, BZ0 + 10); LV.add(g); mesh(new THREE.BoxGeometry(60, 236, 3), glass, s * 30, 120, 0, { parent: g, cast: false }); for (const [w, h, x, y] of [[60, 6, 30, 3], [60, 6, 30, 237], [5, 236, 2.5, 120], [5, 236, 57.5, 120], [60, 5, 30, 110]]) mesh(new THREE.BoxGeometry(w, h, 4), frame, s * x, y, 0, { parent: g });
      mesh(new THREE.BoxGeometry(3, 30, 3), MAT.steel, s * 50, 110, 4, { parent: g }); return g; };
    const L = mk(SC_DOOR.x0, 1), Rr = mk(SC_DOOR.x1, -1); SC.doors.main = { L, R: Rr, open: 0, want: 0, col: { t: 'b', x0: SC_DOOR.x0, x1: SC_DOOR.x1, y0: GY, y1: GY + 240, z0: BZ0 + 7, z1: BZ0 + 13, slick: true } }; cols.push(SC.doors.main.col); }
  { const sg = mesh(new THREE.PlaneGeometry(260, 64), new THREE.MeshStandardMaterial({ map: schoolSignTex(), roughness: .6 }), 2060, GY + 284, BZ0 - .6, { cast: false }); sg.rotation.y = Math.PI; }
  // upper storeys (outside only)
  box(920, 3200, GY + 320, TOP, BZ0, BZ0 + 20, wallW, { uv: 80, col: false }); for (const y of [GY + 400, GY + 610]) winRow(BZ0 - 1, y, y + 150, 920, 3200);
  for (const y of [GY + 320, GY + 530, GY + 740]) box(915, 3205, y, y + 8, BZ0 - 6, BZ0, conc, { col: false });
  box(915, 3205, TOP, TOP + 30, BZ0 - 6, BZ1 + 6, conc, { col: false }); box(920, 3200, TOP - 20, TOP, BZ0, BZ1, conc, { col: false });
  { const sg = mesh(new THREE.PlaneGeometry(520, 128), new THREE.MeshStandardMaterial({ map: schoolSignTex(), roughness: .6, emissive: 0x302820 }), 2060, GY + 860, BZ0 - 1.5, { cast: false }); sg.rotation.y = Math.PI; }
  box(W0, 920, GY, TOP, BZ0, BZ1, wallW, { uv: 80 }); box(3200, W1, GY, TOP, BZ0, BZ1, wallW, { uv: 80 });                     // the building's ends
  box(920, 3200, GY + 320, TOP, BZ1, BZ1 + 20, wallW, { uv: 80, col: false }); for (const y of [GY + 400, GY + 610]) winRow(BZ1 + 21, y, y + 150, 920, 3200);   // the south face, upstairs
  box(920, 3200, GY + 300, GY + 320, BZ0 + 20, BZ1, ceil, { col: false });                                                     // ground floor ceiling

  // ---- the corridor ----
  box(920, 3200, GY - 10, GY, SC_CORR.z0, SC_CORR.z1 + 16, corrF, { uv: 128, cast: false });
  box(920, 3200, GY + 90, GY + 92, BZ0 + 20, BZ0 + 30, frame, { col: false });   // window sill inside
  // low lockers on legs along the windows (hide underneath)
  const lockM = new THREE.MeshStandardMaterial({ color: 0x5a7a9a, roughness: .5, metalness: .3 }), lockD = new THREE.MeshStandardMaterial({ color: 0x4a6a8a, roughness: .45, metalness: .35 });
  for (const [a, b] of [[960, 1900], [2220, 3160]]) for (let x = a; x < b; x += 160) {
    const x1 = Math.min(x + 156, b); box(x, x1, GY + 12, GY + 88, BZ0 + 22, BZ0 + 62, lockM); for (let dx = x + 4; dx < x1 - 4; dx += 38) { box(dx, Math.min(dx + 36, x1 - 2), GY + 15, GY + 86, BZ0 + 62, BZ0 + 63, lockD, { col: false }); box(dx + 28, dx + 31, GY + 50, GY + 58, BZ0 + 63, BZ0 + 64.5, MAT.steel, { col: false }); }
    for (const lx of [x + 4, x1 - 6]) for (const lz of [BZ0 + 26, BZ0 + 58]) box(lx, lx + 2, GY, GY + 12, lz, lz + 2, MAT.dsteel, { col: false });
    SC.lockers.push({ x0: x, x1, z0: BZ0 + 22, z1: BZ0 + 62 }); }
  // the corridor's south wall: tiled below, notice boards, the classroom doors
  const doorsAt = [[1000, 1090, '2A'], [1580, 1670, '2A'], [1730, 1820, '3A'], [2380, 2470, '3A'], [2530, 2620, '4A'], [3080, 3170, '4A']];
  { let a = 920; for (const [d0, d1] of doorsAt) { box(a, d0, GY, GY + 300, SC_CORR.z1, SC_CORR.z1 + 16, wallG, { uv: 80 }); box(a, d0, GY, GY + 100, SC_CORR.z1 - 1, SC_CORR.z1, tileW, { col: false, uv: 32 }); a = d1; }
    box(a, 3200, GY, GY + 300, SC_CORR.z1, SC_CORR.z1 + 16, wallG, { uv: 80 }); box(a, 3200, GY, GY + 100, SC_CORR.z1 - 1, SC_CORR.z1, tileW, { col: false, uv: 32 }); }
  for (const [d0, d1, nm] of doorsAt) { box(d0, d1, GY + 236, GY + 300, SC_CORR.z1, SC_CORR.z1 + 16, wallG); box(d0 - 4, d0, GY, GY + 240, SC_CORR.z1 - 3, SC_CORR.z1 + 19, frame); box(d1, d1 + 4, GY, GY + 240, SC_CORR.z1 - 3, SC_CORR.z1 + 19, frame); }
  const doorM = new THREE.MeshStandardMaterial({ color: 0xa8784a, roughness: .6 }), doorWin = glass;
  const mkDoor = (d0, d1, inward) => { const g = new THREE.Group(); g.position.set(d0, GY, SC_CORR.z1 + 8); LV.add(g); const w = d1 - d0;
    mesh(new THREE.BoxGeometry(w, 234, 4), doorM, w / 2, 1.5 + 117, 0, { parent: g }); mesh(new THREE.BoxGeometry(w * .4, 60, 4.4), doorWin, w * .5, 170, 0, { parent: g, cast: false }); mesh(new THREE.BoxGeometry(14, 3, 6), MAT.steel, w - 12, 110, 0, { parent: g });
    const col = { t: 'b', x0: d0, x1: d1, y0: GY, y1: GY + 236, z0: SC_CORR.z1 + 5, z1: SC_CORR.z1 + 11, slick: true }; cols.push(col); return { g, open: 0, want: 0, col, inward }; };
  for (const [d0, d1, nm] of doorsAt) { const D = mkDoor(d0, d1, true); if (d0 === SC_BACKDOOR.x0) SC.doors.back = D; if (nm === '3A' && d0 === 1730) SC.doors.front = D; }
  // classroom signs stick out from the wall above each class's front door, so they read down the corridor
  for (const [x, nm, sub] of [[1045, '2A', '二年甲班'], [1775, '3A', '三年甲班'], [2575, '4A', '四年甲班']]) { const s = mesh(new THREE.BoxGeometry(2, 34, 90), new THREE.MeshStandardMaterial({ map: classSignTex(nm, sub), roughness: .6 }), x, GY + 262, SC_CORR.z1 - 46, { cast: false }); s.userData.noSolid = true; box(x - 1, x + 1, GY + 280, GY + 300, SC_CORR.z1 - 4, SC_CORR.z1, MAT.steel, { col: false }); }
  for (const [x0, x1] of [[1150, 1520], [1880, 2320], [2680, 3020]]) { box(x0, x1, GY + 120, GY + 210, SC_CORR.z1 - 2, SC_CORR.z1, MAT.cork, { col: false }); }
  box(2860, 2900, GY, GY + 110, SC_CORR.z1 - 32, SC_CORR.z1, new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: .4 })); cyl(2880, SC_CORR.z1 - 16, 14, GY + 110, GY + 150, new THREE.MeshPhysicalMaterial({ color: 0xa8d8f0, roughness: .1, transparent: true, opacity: .6 }), { seg: 16 });   // water dispenser
  cyl(1240, SC_CORR.z1 - 10, 8, GY + 60, GY + 110, MAT.paintRed, { seg: 16 });   // fire extinguisher
  for (let x = 1100; x < 3200; x += 340) { box(x - 70, x + 70, GY + 296, GY + 300, SC_CORR.z0 + 60, SC_CORR.z0 + 74, lampM, { col: false, cast: false }); const l = pointL(0xf2f6ff, 26000, x, GY + 280, (SC_CORR.z0 + SC_CORR.z1) / 2); SC.lights.push({ p: l.position.clone(), range: 260, I: () => l.intensity }); }

  // ---- 3A ----
  const C = SC_CLASS;
  box(C.x0, C.x1, GY - 10, GY, C.z0, C.z1, classF, { uv: 160, cast: false });
  box(1700, C.x0, GY, GY + 300, C.z0, BZ1, wallW, { uv: 80 }); box(C.x1, C.x1 + 16, GY, GY + 300, C.z0, BZ1, wallW, { uv: 80 });
  box(1700, C.x0 + 1, GY, GY + 12, C.z0, BZ1, deskEdge, { col: false }); box(C.x1 - 1, C.x1 + 16, GY, GY + 12, C.z0, BZ1, deskEdge, { col: false });   // skirting
  // the south wall: windows over a sill; the one at the back is open a little at the bottom
  box(920, 3200, GY, GY + 90.5, BZ1, BZ1 + 20, wallW, { uv: 60 }); box(920, 3200, GY + 250, GY + 320, BZ1, BZ1 + 20, wallW);
  for (let x = 920; x < 3200; x += 130) box(x, x + 10, GY + 90, GY + 250, BZ1, BZ1 + 20, wallW);
  for (let x = 920; x < 3200; x += 130) { const open = x + 10 >= SC_WIN.x0 - 10 && x + 130 <= SC_WIN.x1 + 20; if (open) { cols.push({ t: 'b', x0: x + 10, x1: x + 130, y0: GY + 102, y1: GY + 250, z0: BZ1, z1: BZ1 + 20 }); continue; } box(x + 10, x + 130, GY + 90, GY + 250, BZ1 + 9, BZ1 + 11, glass, { cast: false }); }
  box(1716, 2500, GY + 89.5, GY + 90.5, BZ1 - 8, BZ1, frame);   // inside sill — flush with the shelf top and the wall, so you walk straight out
  { const g = new THREE.Group(); g.position.set(SC_WIN.x0 + 10, GY + 250, BZ1 + 10); g.rotation.x = -.18; LV.add(g); SC.winG = g;   // hinged at the top, tipped out at the bottom
    mesh(new THREE.BoxGeometry(SC_WIN.x1 - SC_WIN.x0 - 10, 156, 2), glass, (SC_WIN.x1 - SC_WIN.x0 - 10) / 2, -80, 0, { parent: g, cast: false }); for (const [w, h, x, y] of [[SC_WIN.x1 - SC_WIN.x0 - 10, 5, (SC_WIN.x1 - SC_WIN.x0 - 10) / 2, -158], [5, 160, 2, -80], [5, 160, SC_WIN.x1 - SC_WIN.x0 - 12, -80]]) mesh(new THREE.BoxGeometry(w, h, 4), frame, x, y, 0, { parent: g }); }
  box(1716, 2500, GY + 89, GY + 90.5, BZ1 + 20, BZ1 + 32, conc);   // outside sill
  // the blackboard (west wall), the teacher's desk
  box(C.x0, C.x0 + 3, GY + 86, GY + 214, 5290, 5710, new THREE.MeshStandardMaterial({ color: 0x6a6258, roughness: .6 }), { col: false });
  { const b = mesh(new THREE.PlaneGeometry(400, 120), new THREE.MeshStandardMaterial({ map: blackboardTex(), roughness: .85 }), C.x0 + 3.2, GY + 150, 5500, { cast: false }); b.rotation.y = Math.PI / 2; }
  box(C.x0 + 3, C.x0 + 12, GY + 86, GY + 89, 5290, 5710, frame);
  box(1770, 1830, GY, GY + 76, 5440, 5560, desk); box(1768, 1832, GY + 76, GY + 79, 5436, 5564, deskEdge);
  // twelve desks and chairs, facing the board
  const legM = MAT.dsteel;
  SC.seats = [];
  SC_ROWS.forEach((dx, ri) => SC_COLS.forEach((dz, ci) => {
    box(dx - 22, dx + 22, GY + 62, GY + 66, dz - 30, dz + 30, desk); box(dx - 22, dx + 22, GY + 52, GY + 62, dz - 30, dz + 30, deskEdge, { col: false });
    for (const lx of [dx - 19, dx + 17]) for (const lz of [dz - 27, dz + 25]) box(lx, lx + 2, GY, GY + 52, lz, lz + 2, legM, { col: false });
    cols.push({ t: 'b', x0: dx - 22, x1: dx + 22, y0: GY + 52, y1: GY + 66, z0: dz - 30, z1: dz + 30 });
    const cx = dx + 40; box(cx - 16, cx + 16, GY + 34, GY + 37, dz - 17, dz + 17, desk); box(cx + 14, cx + 17, GY + 37, GY + 80, dz - 16, dz + 16, desk);
    for (const lx of [cx - 14, cx + 12]) for (const lz of [dz - 15, dz + 13]) box(lx, lx + 2, GY, GY + 34, lz, lz + 2, legM, { col: false });
    cols.push({ t: 'b', x0: cx - 16, x1: cx + 16, y0: GY + 32, y1: GY + 37, z0: dz - 17, z1: dz + 17 });
    if (hashI(ri * 7 + ci * 3 + 5) > .35) { const bk = mesh(new THREE.BoxGeometry(20, 1.6, 27), new THREE.MeshStandardMaterial({ color: [0xe0c060, 0x6aa0d0, 0xe08a8a, 0x8ac08a][(ri + ci) % 4], roughness: .8 }), dx + R(-4, 4), GY + 66.8, dz + R(-6, 6)); bk.rotation.y = R(-.3, .3); }
    SC.seats.push({ x: cx, z: dz, ri, ci });
  }));
  // the back of the room: twenty-four cubbies under the notice board; hers is on the bottom row
  { const x0 = 2440, x1 = 2496, z0 = 5260, z1 = 5740, y0 = GY + 6, rows = 4, rh = 30, cw = 80;
    box(x0, x1, GY, y0, z0, z1, deskEdge); box(x0, x1, y0 + rows * rh, y0 + rows * rh + 3, z0 - 2, z1 + 2, desk);
    for (let r = 0; r <= rows; r++) box(x0, x1, y0 + r * rh - 1.5, y0 + r * rh, z0, z1, desk);
    for (let k = 0; k <= 6; k++) box(x0, x1, y0, y0 + rows * rh, z0 + k * cw - 1.2, z0 + k * cw + 1.2, desk);
    box(x1 - 2, x1, y0, y0 + rows * rh, z0, z1, desk);
    cols.push({ t: 'b', x0, x1, y0: GY, y1: y0, z0, z1 });
    const bagC = [0x3a5a8a, 0xc84a4a, 0x4a8a5a, 0xe0b030, 0x8a4ac8, 0x2a2a3a];
    for (let r = 0; r < rows; r++) for (let k = 0; k < 6; k++) { const id = r * 6 + k; if (r === 0 && k === 3) continue; if (hashI(id * 13 + 1) > .45) { mesh(new THREE.BoxGeometry(34, 22, 60), new THREE.MeshStandardMaterial({ color: bagC[id % 6], roughness: .8 }), x0 + 22, y0 + r * rh + 11, z0 + k * cw + 40); }
      else for (let q = 0; q < 3; q++) { mesh(new THREE.BoxGeometry(24, 2, 30), new THREE.MeshStandardMaterial({ color: bagC[(id + q) % 6], roughness: .85 }), x0 + 24, y0 + r * rh + 1 + q * 2, z0 + k * cw + 40); } }
    // name tags under each cubby; hers has a little white mouse sticker
    for (let k = 0; k < 6; k++) for (let r = 0; r < rows; r++) { const n = (rows - 1 - r) * 6 + k + 1; const [cc, xx] = cnv(64, 24); xx.fillStyle = '#fbf6ea'; xx.fillRect(0, 0, 64, 24); xx.fillStyle = '#2a2a3a'; xx.font = '700 16px "Fredoka", sans-serif'; xx.textAlign = 'center'; xx.fillText(String(n), 32, 18);
      if (n === 22) { xx.fillStyle = '#f0f0f0'; xx.beginPath(); xx.arc(52, 12, 7, 0, 6.283); xx.fill(); xx.fillStyle = '#f2aeb0'; xx.beginPath(); xx.arc(47, 6, 3, 0, 6.283); xx.arc(57, 6, 3, 0, 6.283); xx.fill(); }
      const t = mesh(new THREE.PlaneGeometry(16, 6), new THREE.MeshStandardMaterial({ map: tex(cc), roughness: .7 }), x0 - .3, y0 + r * rh + 1.2, z0 + k * cw + 40, { cast: false }); t.rotation.y = -Math.PI / 2; }
    // (the tags run left to right from the top row: hers, bottom row, fourth along, is 22 — her class number)
    SC.cubby = { x0, x1, z0: z0 + 3 * cw, z1: z0 + 4 * cw, y: y0 };
    // the notice board above, and her essay pinned in the gap
    { box(x1 - 1, x1, GY + 136, GY + 264, z0 - 6, z1 + 6, desk, { col: false });
      const b = mesh(new THREE.PlaneGeometry(480, 120), new THREE.MeshStandardMaterial({ map: corkBoardTex(), roughness: .9 }), x1 - 1.2, GY + 200, (z0 + z1) / 2, { cast: false }); b.rotation.y = -Math.PI / 2;
      const es = mesh(new THREE.PlaneGeometry(21, 29.7), new THREE.MeshStandardMaterial({ map: essayTex(), roughness: .85 }), x1 - 1.6, GY + 196, (z0 + z1) / 2 + 13, { cast: false }); es.rotation.set(0, -Math.PI / 2, .03); SC.essay = es;
      const pin = mesh(new THREE.SphereGeometry(.8, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd84a3a, roughness: .3 }), x1 - 2.2, GY + 209.5, (z0 + z1) / 2 + 13, { cast: false }); pin.userData.noSolid = true; }
    // the notebook, lying in her cubby
    { const g = new THREE.Group(); g.position.set(SC_CUBBY.x, y0 + .2, SC_CUBBY.z); g.rotation.y = Math.PI / 2 + .1; LV.add(g); SC.book = g;   // (local z runs into the cubby: its top edge is at the back)
      const cover = new THREE.MeshStandardMaterial({ map: notebookTex(false), roughness: .7 }), inner = new THREE.MeshStandardMaterial({ map: notebookTex(true), roughness: .85 });
      const pg = mesh(new THREE.BoxGeometry(14.2, 1.1, 20.2), MAT.pages, 0, .7, 0, { parent: g }); pg.userData.noSolid = true;
      const back = mesh(new THREE.BoxGeometry(14.8, .3, 21), cover, 0, .15, 0, { parent: g });
      const lid = new THREE.Group(); lid.position.set(7.4, 1.4, 0); g.add(lid); SC.bookLid = lid;   // the front cover, hinged at the spine (on the left as you look in)
      const fc = mesh(new THREE.PlaneGeometry(14.8, 21), cover, -7.4, .16, 0, { parent: lid }); fc.rotation.set(-Math.PI / 2, 0, Math.PI);
      const ic = mesh(new THREE.PlaneGeometry(14.8, 21), inner, -7.4, .14, 0, { parent: lid }); ic.rotation.set(Math.PI / 2, 0, 0);
      SC.bookCover = fc; }
  }
  // the class library shelf in the back corner, under the open window (climb it to reach the sill)
  { const x0 = 2330, x1 = 2470, z0 = 5784, z1 = 5820; for (const y of [0, 30, 60, 88]) box(x0, x1, GY + y, GY + y + 2.5, z0, z1, desk, { col: false }); box(x0, x0 + 3, GY, GY + 90, z0, z1, desk, { col: false }); box(x1 - 3, x1, GY, GY + 90, z0, z1, desk, { col: false }); box(x0, x1, GY, GY + 90, z1 - 2, z1, desk, { col: false });
    cols.push({ t: 'b', x0, x1, y0: GY, y1: GY + 90.5, z0, z1 });   // (climb its face of books)
    for (let s = 0; s < 3; s++) for (let i = 0; i < 9; i++) { const h = R(18, 25); const b = mesh(new THREE.BoxGeometry(R(2.4, 4.2), h, 18), new THREE.MeshStandardMaterial({ color: [0xc84a4a, 0x3a6ad0, 0xe0b030, 0x4a8a5a, 0xe8e4da][(i + s) % 5], roughness: .8 }), x0 + 8 + i * 6 + s * 30, GY + s * 30 + 2.5 + h / 2, z0 + 16); b.rotation.z = R(-.08, .08); b.userData.noSolid = true; }
    SC.shelf = { x0, x1, z0, z1 }; }
  // a wall clock, a ceiling fan, and the lights
  { const ck = mesh(new THREE.CylinderGeometry(16, 16, 3, 32), new THREE.MeshStandardMaterial({ color: 0xf6f4ee, roughness: .4 }), C.x0 + 3, GY + 250, 5500, { cast: false }); ck.rotation.z = Math.PI / 2; ck.userData.noSolid = true;
    SC.clockH = mesh(new THREE.BoxGeometry(.6, 9, 1), MAT.black, C.x0 + 5, GY + 250, 5500, { cast: false }); SC.clockM = mesh(new THREE.BoxGeometry(.6, 13, .8), MAT.black, C.x0 + 5.4, GY + 250, 5500, { cast: false }); }
  { const g = new THREE.Group(); g.position.set(2140, GY + 270, 5500); LV.add(g); SC.fan = g; mesh(new THREE.CylinderGeometry(7, 9, 10, 16), white, 0, 0, 0, { parent: g }); for (let i = 0; i < 3; i++) { const b = mesh(new THREE.BoxGeometry(70, 1, 12), white, 35, -3, 0, { parent: g }); b.rotation.y = 0; const p = new THREE.Group(); p.rotation.y = i * 2.094; g.add(p); p.add(b); }
    box(2139, 2141, GY + 275, GY + 300, 5499, 5501, MAT.steel, { col: false }); }
  for (const [x, z] of [[1900, 5360], [1900, 5640], [2260, 5360], [2260, 5640]]) { box(x - 70, x + 70, GY + 296, GY + 300, z - 7, z + 7, lampM, { col: false, cast: false }); }
  for (const [x, z] of [[1900, 5500], [2260, 5500]]) { const l = pointL(0xf4f8ff, 42000, x, GY + 280, z); SC.lights.push({ p: l.position.clone(), range: 380, I: () => l.intensity }); }

  // ================= behind the school: a strip of garden =================
  { const gr = genGrass(); box(W0, W1, GY - 10, GY, BZ1 + 20, 6200, new THREE.MeshStandardMaterial({ ...gr, color: 0xd4dcc4, roughness: .95 }), { uv: 90, cast: false }); }
  box(W0, W1, GY, GY + 200, 6180, 6200, wallW, { uv: 60 });
  for (const [x0, x1] of [[1000, 1500], [2600, 3100]]) { box(x0, x1, GY, GY + 50, 5940, 5990, new THREE.MeshStandardMaterial({ map: genSoil(), roughness: 1 }), { uv: 40 }); for (let x = x0 + 30; x < x1; x += 60) { const s = mesh(new THREE.IcosahedronGeometry(R(14, 22), 0), leafB, x, GY + 60, 5965); s.userData.noSolid = true; } }   // the school's vegetable beds
  buildGrassClumps([[1800, 5900, 70, TOUCH ? 30 : 50], [2200, 5880, 60, TOUCH ? 26 : 44], [2480, 5960, 70, TOUCH ? 30 : 50], [2050, 6100, 80, TOUCH ? 30 : 50]]);
  // the neighbours' blocks either side of the grounds close the view
  { const fm = new THREE.MeshStandardMaterial({ map: facadeTex(), roughness: .85 }); fm.map.repeat.set(4, 2);
    box(-340, W0, GY, GY + 1300, 4320, 6300, fm, { col: false }); box(W1, 3500, GY, GY + 1300, 4320, 6300, fm, { col: false });
    box(-340, 3500, GY, GY + 1300, 6200, 6300, fm, { col: false }); }

  // ---- the sun: one big, soft, shadow-casting light over the grounds ----
  { const tgt = V3(2060, GY, 4900); SC.sun = spotL(0xfff0dc, 26000000, sunFrom(tgt), tgt, .5, .55, 2048, 1200, 3800); SC.sun.userData.prio = 1; SC.sun.shadow.bias = -.0008; }
  // pickups
  addCrumb(1180, GY + 56, 4680); addCrumb(2420, GY, 5120); addCrumb(2300, GY, 5700); addVial(3150, GY, 4920);
  buildSchoolPeople();
}
