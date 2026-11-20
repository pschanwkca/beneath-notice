
// ---------- lore / decal textures (story told in the room, not in menus) ----------
const HAND = '"LXGW WenKai TC","Caveat","Noto Sans TC",cursive';
function scribble(x, x0, y, w, col, lw = 1.6) {
  x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); let px = x0; x.moveTo(px, y);
  while (px < x0 + w) { const s = R(4, 9); x.bezierCurveTo(px + s * .3, y - R(2, 7), px + s * .7, y + R(1, 5), px + s, y + R(-1.5, 1.5)); px += s; if (rnd() < .12) { px += R(5, 10); x.moveTo(px, y); } }
  x.stroke();
}
function genNotebook() {
  const W = 1024, H = 720; const [c, x] = cnv(W, H);
  x.fillStyle = '#efe8d8'; x.fillRect(0, 0, W, H);
  const g = x.createLinearGradient(W / 2 - 40, 0, W / 2 + 40, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, 'rgba(60,40,20,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(W / 2 - 40, 0, 80, H);
  x.strokeStyle = 'rgba(80,120,190,.35)'; x.lineWidth = 1.5; for (let y = 70; y < H; y += 32) { x.beginPath(); x.moveTo(20, y); x.lineTo(W - 20, y); x.stroke(); }
  x.strokeStyle = 'rgba(200,80,80,.35)'; x.beginPath(); x.moveTo(70, 0); x.lineTo(70, H); x.moveTo(W / 2 + 60, 0); x.lineTo(W / 2 + 60, H); x.stroke();
  const ink = 'rgba(25,40,95,.88)';
  x.fillStyle = ink; x.font = `700 34px ${HAND}`; x.fillText('第 37 次測試', 86, 58);
  x.font = `500 26px ${HAND}`;
  x.fillText('縮放場 λ⁻¹ → 0.012', 86, 126); x.fillText('DNA 樣本 A–D 已載入', 86, 190);
  x.fillStyle = 'rgba(170,30,30,.9)'; x.font = `700 30px ${HAND}`; x.fillText('縮小態被觀測就會塌縮！', 86, 254);
  x.fillText('絕對不能讓人看見', 86, 318); x.strokeStyle = 'rgba(170,30,30,.8)'; x.lineWidth = 3; x.beginPath(); x.moveTo(84, 328); x.lineTo(360, 330); x.stroke();
  for (let y = 382; y < H - 20; y += 32) scribble(x, 86, y - 8, R(240, 380), ink);
  // right page: ring machine sketch
  x.strokeStyle = ink; x.lineWidth = 2.4; const cx = 770, cy = 250;
  x.beginPath(); x.arc(cx, cy, 120, 0, 7); x.stroke(); x.beginPath(); x.arc(cx, cy, 98, 0, 7); x.stroke();
  for (let a = 0; a < 6.28; a += .52) { x.beginPath(); x.moveTo(cx + Math.cos(a) * 98, cy + Math.sin(a) * 98); x.lineTo(cx + Math.cos(a) * 120, cy + Math.sin(a) * 120); x.stroke(); }
  x.beginPath(); x.moveTo(cx - 70, cy + 160); x.lineTo(cx + 70, cy + 160); x.lineTo(cx + 40, cy + 120); x.lineTo(cx - 40, cy + 120); x.closePath(); x.stroke();
  x.font = `500 24px ${HAND}`; x.fillStyle = ink; x.fillText('核心 ←', cx + 130, cy + 8); x.fillText('Origin Dynamics 週五要數據', 600, 470);
  for (let y = 540; y < H - 20; y += 32) scribble(x, 600, y - 8, R(200, 320), ink);
  const n = noiseField(256, 256, 3, 8, 61); const id = x.getImageData(0, 0, W, H); const d = id.data;
  for (let i = 0; i < W * H; i++) { const v = (n[((i / W | 0) % 256) * 256 + (i % W) % 256] - .5) * 18; d[i * 4] += v; d[i * 4 + 1] += v; d[i * 4 + 2] += v; }
  x.putImageData(id, 0, 0);
  return tex(c);
}
function genLetter() {
  const W = 512, H = 700; const [c, x] = cnv(W, H);
  x.fillStyle = '#f4f2ec'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#16384f'; x.beginPath(); x.arc(70, 70, 30, 0, 7); x.fill(); x.fillStyle = '#f4f2ec'; x.beginPath(); x.arc(70, 70, 15, 0, 7); x.fill();
  x.fillStyle = '#16384f'; x.font = '700 30px Fredoka,sans-serif'; x.fillText('ORIGIN DYNAMICS', 116, 66); x.font = '500 18px "Noto Sans TC",sans-serif'; x.fillText('機密 · CONFIDENTIAL', 118, 94);
  x.fillStyle = 'rgba(40,40,40,.8)'; x.font = '500 20px "Noto Sans TC",sans-serif'; x.fillText('致 陳教授：', 50, 170);
  x.fillStyle = 'rgba(60,60,60,.45)'; for (let y = 210; y < 560; y += 26) x.fillRect(50, y, R(330, 410), 9);
  x.fillStyle = 'rgba(40,40,40,.85)'; x.fillText('任何資料外洩，後果將波及閣下家人。', 50, 600);
  x.save(); x.translate(360, 620); x.rotate(-.2); x.strokeStyle = 'rgba(190,30,40,.75)'; x.lineWidth = 5; x.strokeRect(-70, -34, 150, 60); x.fillStyle = 'rgba(190,30,40,.75)'; x.font = '700 34px "Noto Sans TC"'; x.fillText('機密', -36, 10); x.restore();
  return tex(c);
}
function crayon(x, pts, col, w) { for (let p = 0; p < 4; p++) { x.strokeStyle = col; x.globalAlpha = .35; x.lineWidth = w * R(.6, 1.1); x.beginPath(); pts.forEach((q, i) => { const px = q[0] + R(-2, 2), py = q[1] + R(-2, 2); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke(); } x.globalAlpha = 1; }
function genDrawing() {
  const W = 640, H = 480; const [c, x] = cnv(W, H); x.fillStyle = '#fbf8f1'; x.fillRect(0, 0, W, H); x.lineCap = 'round'; x.lineJoin = 'round';
  const circ = (cx, cy, r, col, w) => { const p = []; for (let a = 0; a <= 6.4; a += .25) p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); crayon(x, p, col, w); };
  circ(540, 80, 40, '#f2b230', 8); for (let a = 0; a < 6.3; a += .6) crayon(x, [[540 + Math.cos(a) * 52, 80 + Math.sin(a) * 52], [540 + Math.cos(a) * 75, 80 + Math.sin(a) * 75]], '#f2b230', 6);
  crayon(x, [[20, 420], [620, 420]], '#5aa04a', 10);
  // dad: lab coat, glasses, ring machine
  circ(190, 170, 38, '#333', 6); circ(176, 168, 9, '#333', 3); circ(204, 168, 9, '#333', 3);
  crayon(x, [[150, 215], [230, 215], [245, 360], [135, 360], [150, 215]], '#7a8fb8', 7);
  crayon(x, [[160, 360], [155, 415]], '#333', 6); crayon(x, [[220, 360], [225, 415]], '#333', 6);
  crayon(x, [[150, 240], [100, 300]], '#333', 6); crayon(x, [[235, 240], [290, 280]], '#333', 6);
  circ(320, 280, 42, '#2bb0b0', 7); circ(320, 280, 24, '#2bb0b0', 4);
  // girl
  circ(440, 260, 30, '#333', 6); crayon(x, [[410, 250], [395, 300]], '#8a4a2a', 8); crayon(x, [[470, 250], [485, 300]], '#8a4a2a', 8);
  crayon(x, [[440, 292], [400, 390], [480, 390], [440, 292]], '#e0507a', 8);
  crayon(x, [[420, 390], [418, 418]], '#333', 5); crayon(x, [[460, 390], [462, 418]], '#333', 5);
  crayon(x, [[410, 320], [370, 290]], '#333', 5);
  // hearts
  for (const [hx, hy] of [[360, 160], [395, 130]]) crayon(x, [[hx, hy + 10], [hx - 12, hy - 4], [hx - 4, hy - 12], [hx, hy - 4], [hx + 4, hy - 12], [hx + 12, hy - 4], [hx, hy + 10]], '#e04a5a', 5);
  x.font = `700 58px ${HAND}`; x.fillStyle = 'rgba(220,70,90,.85)'; x.fillText('爸爸最棒！', 40, 80);
  return tex(c);
}
function genPhoto() {
  const W = 300, H = 360; const [c, x] = cnv(W, H); x.fillStyle = '#f4f1e8'; x.fillRect(0, 0, W, H);
  const g = x.createLinearGradient(0, 20, 0, 280); g.addColorStop(0, '#f6c79b'); g.addColorStop(.55, '#f19a7a'); g.addColorStop(.56, '#4f7f9c'); g.addColorStop(1, '#d8c39a');
  x.fillStyle = g; x.fillRect(20, 20, 260, 260);
  x.filter = 'blur(5px)'; x.fillStyle = '#fff2c4'; x.beginPath(); x.arc(200, 120, 26, 0, 7); x.fill();
  x.fillStyle = 'rgba(40,30,40,.85)';
  for (const [px, ph, pw] of [[95, 120, 34], [140, 135, 32], [182, 80, 24]]) { x.beginPath(); x.ellipse(px, 280 - ph / 2 - 12, pw / 2, ph / 2, 0, 0, 7); x.fill(); x.beginPath(); x.arc(px, 280 - ph - 22, pw / 2.6, 0, 7); x.fill(); }
  x.filter = 'none'; x.font = `500 26px ${HAND}`; x.fillStyle = 'rgba(40,40,60,.8)'; x.fillText('一家人 · 夏天', 60, 330);
  return tex(c);
}
function genScreen() {
  const W = 640, H = 400; const [c, x] = cnv(W, H); x.fillStyle = '#05080c'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#0d1a24'; x.fillRect(0, 0, W, 28); x.fillStyle = '#82ece6'; x.font = '600 16px Fredoka,monospace'; x.fillText('ORIGIN DYNAMICS · SECURE UPLINK', 14, 19);
  x.font = '13px ui-monospace,Menlo,monospace';
  const lines = ['> field.calibrate(lambda=0.012)', '  ok  coil[0..7] 4.98 kV', '> dna.bind(A, B, C, D)', '  warn sample drift 3.1%', '> scale.collapse.observer = TRUE', '  !! CONTAINMENT FAULT', '  !! core ejected', '> upload --to od-secure'];
  lines.forEach((l, i) => { x.fillStyle = l.includes('!!') ? '#ff7a8a' : l.includes('warn') ? '#f4bb72' : 'rgba(200,235,230,.85)'; x.fillText(l, 16, 60 + i * 22); });
  x.fillStyle = 'rgba(130,236,230,.18)'; x.fillRect(16, 260, 608, 14); x.fillStyle = '#82ece6'; x.fillRect(16, 260, 608 * .37, 14);
  x.fillStyle = 'rgba(220,240,240,.85)'; x.font = '500 15px "Noto Sans TC",sans-serif'; x.fillText('上傳中…… 37%（連線中斷）', 16, 300);
  x.strokeStyle = '#f4bb72'; x.lineWidth = 2; x.beginPath(); for (let i = 0; i < 300; i++) { const px = 330 + i, py = 350 + Math.sin(i * .09) * 18 * Math.sin(i * .013) + R(-3, 3); i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
  return tex(c);
}
function genBook(col, title) {
  const W = 512, H = 256; const n = noiseField(W, H, 3, 16, 71); const b = hex(col);
  const c = fromFn(W, H, (x, y, i, o) => { const v = .8 + (n[(y % 256) * 512 + x % 512] || .5) * .35; o[0] = b[0] * v; o[1] = b[1] * v; o[2] = b[2] * v; });
  const x = c.getContext('2d'); x.fillStyle = 'rgba(214,182,110,.9)'; x.font = '700 30px Fredoka,serif'; x.textAlign = 'center'; x.fillText(title, W / 2, H / 2 + 10);
  x.fillRect(40, 40, W - 80, 3); x.fillRect(40, H - 43, W - 80, 3);
  return tex(c);
}
function genNight() {
  const W = 512, H = 256; const [c, x] = cnv(W, H);
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a3f6e'); g.addColorStop(.6, '#162442'); g.addColorStop(1, '#0a1020'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  const rg = x.createRadialGradient(W * .3, -20, 10, W * .3, -20, 260); rg.addColorStop(0, 'rgba(210,225,255,.85)'); rg.addColorStop(1, 'rgba(210,225,255,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(255,255,255,${R(.2, .8)})`; x.fillRect(R(0, W), R(0, H * .5), 1.5, 1.5); }
  x.fillStyle = '#05070c';
  for (let i = 0; i < 260; i++) { const px = R(0, W), h = R(30, 120); x.beginPath(); x.moveTo(px - 3, H); x.quadraticCurveTo(px + R(-10, 10), H - h * .6, px + R(-14, 14), H - h); x.lineTo(px + 2, H); x.fill(); }
  return tex(c);
}
function genCrack() {
  const W = 256; const [c, x] = cnv(W, W); x.clearRect(0, 0, W, W); x.lineCap = 'round';
  const cx = 128, by = 256; // hole spans ~94px wide x 105px tall at the bottom centre
  x.strokeStyle = 'rgba(20,16,14,.85)';
  const rays = [[-60, 200, -100, 150], [-52, 140, -110, 90], [-30, 120, -40, 20], [0, 110, 18, 6], [34, 124, 70, 40], [52, 150, 120, 120], [58, 210, 118, 196]];
  for (const r of rays) { x.lineWidth = R(1.5, 3); x.beginPath(); let px = cx + r[0], py = r[1]; x.moveTo(px, py); const steps = 6; for (let i = 1; i <= steps; i++) { px = lerp(cx + r[0], cx + r[2], i / steps) + R(-6, 6); py = lerp(r[1], r[3], i / steps) + R(-4, 4); x.lineTo(px, py); } x.stroke(); }
  x.lineWidth = 7; x.strokeStyle = 'rgba(25,20,16,.9)'; x.beginPath(); x.moveTo(cx - 52, by); x.lineTo(cx - 54, 196); x.lineTo(cx - 40, 150); x.lineTo(cx - 14, 134); x.lineTo(cx + 18, 140); x.lineTo(cx + 44, 160); x.lineTo(cx + 52, 210); x.lineTo(cx + 50, by); x.stroke();
  x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.moveTo(cx - 47, by); x.lineTo(cx - 48, 198); x.lineTo(cx - 36, 156); x.lineTo(cx - 12, 140); x.lineTo(cx + 16, 146); x.lineTo(cx + 40, 164); x.lineTo(cx + 46, 210); x.lineTo(cx + 46, by); x.closePath(); x.fill();
  return tex(c);
}
function genWeb() {
  const W = 512; const [c, x] = cnv(W, W); x.clearRect(0, 0, W, W); x.strokeStyle = 'rgba(235,240,245,.55)'; x.lineWidth = 1.2;
  const cx = 60, cy = 60; for (let a = 0; a < 1.6; a += .2) { x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * 520, cy + Math.sin(a) * 520); x.stroke(); }
  for (let r = 40; r < 480; r += R(22, 34)) { x.beginPath(); for (let a = 0; a <= 1.61; a += .2) { const rr = r + R(-6, 6); const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; a ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
  return tex(c);
}
function genDirt() {
  const W = 64, H = 256; const [c, x] = cnv(W, H); const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,1)'); x.fillStyle = g; x.fillRect(0, 0, W, H); return tex(c, { srgb: false });
}
function genRadial(inner, outer) {
  const W = 256; const [c, x] = cnv(W, W); const g = x.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2); g.addColorStop(0, inner); g.addColorStop(1, outer); x.fillStyle = g; x.fillRect(0, 0, W, W); return tex(c);
}
