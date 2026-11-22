// =====================================================================
//  EMOTES — every character has a set of stickers made from their own face
//  · hold T: a wheel of eight stickers; flick the mouse toward one (or press 1–8) and let go
//    (touch: the 表情 button, then tap one)
//  · the sticker pops up over your head and the character acts it out; online, everyone sees it
//  · in single player your teammates sometimes answer with one of their own
//  · the stickers are rendered from the real character models (posed + an expression drawn on),
//    with a white sticker outline, a few per frame after the game loads
// =====================================================================
const EMOTES = [
  { id: 'wave', name: '嗨！' }, { id: 'laugh', name: '哈哈' }, { id: 'love', name: '心心' }, { id: 'good', name: '讚' },
  { id: 'huh', name: '咩話？' }, { id: 'shock', name: '嚇死' }, { id: 'cry', name: '喊' }, { id: 'angry', name: '嬲' }
];
const STICK = {};   // STICK[charId][emoteId] = data URL
const EMO = { open: false, sel: -1, dx: 0, dy: 0, bubbles: [], cd: 0, queue: [], kit: null, built: false };
const EMO_FALL = { wave: '👋', laugh: '😆', love: '😍', good: '👍', huh: '❓', shock: '😱', cry: '😭', angry: '💢' };

// ---------- posing (used for the sticker and, animated, in game) ----------
function emoPose(C, e, t) {   // t < 0: the still for the sticker
  const still = t < 0, k = C.k, [aL, aR] = C.arms, wob = still ? 0 : t;
  const eyes = sy => { for (const E of C.eyes) E.scale.y = sy; };
  const armSet = (a, x, z) => a.rotation.set(x, 0, a.userData.s * z);
  switch (e) {
    case 'wave': armSet(aR, 0, 2.55 + Math.sin(wob * 10) * .3); C.head.rotation.z = -.12; break;
    case 'laugh': eyes(.08); C.head.rotation.x = -.3; C.body.position.y += still ? 0 : Math.abs(Math.sin(wob * 14)) * .25 * k; armSet(aL, -.5, .5); armSet(aR, -.5, .5); break;
    case 'love': armSet(aL, -1.35, -.25); armSet(aR, -1.35, -.25); C.head.rotation.z = .2 + (still ? 0 : Math.sin(wob * 4) * .12); break;
    case 'good': armSet(aR, -2.75, .15); eyes(.08); C.head.rotation.z = -.1; break;
    case 'huh': C.head.rotation.z = .34; C.head.rotation.x = .06; armSet(aR, -1.2, .9); break;
    case 'shock': armSet(aL, 0, 2.3); armSet(aR, 0, 2.3); C.head.rotation.x = -.18; for (const E of C.eyes) E.scale.set(1.25, 1.5, .7); if (!still && wob < .25) C.body.position.y += Math.sin(wob / .25 * Math.PI) * .9 * k; break;
    case 'cry': eyes(.08); C.head.rotation.x = .16; armSet(aL, -1.5, -.15); armSet(aR, -1.5, -.15); if (!still) C.body.rotation.y = Math.sin(wob * 22) * .05; break;
    case 'angry': C.head.rotation.x = .16; armSet(aL, -.25, .95); armSet(aR, -.25, .95); if (!still) C.body.rotation.y = Math.sin(wob * 38) * .06; break;
  }
}
function emoUnpose(C) { C.head.rotation.set(0, 0, 0); C.body.rotation.y = 0; for (const E of C.eyes) E.scale.set(1, 1.12, .7); for (const a of C.arms) a.rotation.set(0, 0, a.userData.s * .22); }

// ---------- stickers ----------
// stickers are drawn by the game's own renderer into a small offscreen target (no second WebGL context,
// and the characters' shaders are already compiled); flagged like an XR target so it gets the same
// tone mapping and sRGB output as the screen
function emoKit() {
  if (EMO.kit) return EMO.kit;
  const rt = new THREE.WebGLRenderTarget(176, 176, { samples: 4, colorSpace: THREE.SRGBColorSpace }); rt.isXRRenderTarget = true; rt.texture.internalFormat = 'RGBA8';
  const s = new THREE.Scene(); const pm = new THREE.PMREMGenerator(renderer); s.environment = pm.fromScene(new RoomEnvironment(), .04).texture; s.environmentIntensity = .62; pm.dispose();
  const key = new THREE.DirectionalLight(0xffe6c8, 2.6); key.position.set(3, 5, 6); s.add(key); const rim = new THREE.DirectionalLight(0xa8ccff, 2.4); rim.position.set(-4, 3, -5); s.add(rim);
  const cv = document.createElement('canvas'); cv.width = cv.height = 176; const cx = cv.getContext('2d');
  EMO.kit = { rt, s, cam: new THREE.PerspectiveCamera(26, 1, .1, 100), buf: new Uint8Array(176 * 176 * 4), cv, cx, img: cx.createImageData(176, 176) }; return EMO.kit;
}
function emoKitDone() { if (!EMO.kit) return; EMO.kit.rt.dispose(); EMO.kit.s.environment.dispose(); EMO.kit = null; }
const _cc = new THREE.Color();
function emoRender(K, cam) {
  const prt = renderer.getRenderTarget(), pex = renderer.toneMappingExposure, pa = renderer.getClearAlpha(); renderer.getClearColor(_cc);
  renderer.setRenderTarget(K.rt); renderer.setClearColor(0, 0); renderer.toneMappingExposure = 1.2; renderer.clear(); renderer.render(K.s, cam);
  renderer.readRenderTargetPixels(K.rt, 0, 0, 176, 176, K.buf);
  renderer.setRenderTarget(prt); renderer.setClearColor(_cc, pa); renderer.toneMappingExposure = pex;
  // flip (GL rows run bottom-up) and un-premultiply the soft edges
  const B = K.buf, D = K.img.data;
  for (let y = 0; y < 176; y++) for (let x = 0; x < 176; x++) {
    const i = ((175 - y) * 176 + x) * 4, j = (y * 176 + x) * 4, al = B[i + 3];
    if (!al) { D[j + 3] = 0; continue; } const f = al < 255 ? 255 / al : 1;
    D[j] = Math.min(255, B[i] * f); D[j + 1] = Math.min(255, B[i + 1] * f); D[j + 2] = Math.min(255, B[i + 2] * f); D[j + 3] = al;
  }
  K.cx.putImageData(K.img, 0, 0); return K.cv;
}
const _ev = V3();
function renderSticker(C, e) {
  const K = emoKit(), cam = K.cam, k = C.k;
  const par = C.root.parent, pp = C.root.position.clone(), rr = C.root.rotation.clone(), vis = C.root.visible, st = C.state, by = C.body.position.y, wv = C.wave, lie = C.lieK, tu = C.tumble, br = C.body.rotation.clone(), ny = C.neck.rotation.y, em = C.emo;
  C.root.visible = true; C.state = 'idle'; C.shellK = 0; C.tumble = 0; C.spin = 0; C.wave = false; C.lieK = 0; C.emo = null; animChar(C, .016);
  K.s.add(C.root); C.root.position.set(0, 0, 0); C.root.rotation.set(0, -.28, 0); C.body.position.y = .92 * k; C.body.rotation.set(0, 0, 0); C.neck.rotation.y = 0; emoUnpose(C); emoPose(C, e, -1);
  const hy = 3.55 * k; cam.position.set(1.2 * k, hy + .15 * k, 10.5 * k); cam.lookAt(0, hy - .35 * k, 0); C.root.updateMatrixWorld(true);
  const img = emoRender(K, cam);
  const eyes = C.eyes.map(E => { E.getWorldPosition(_ev); _ev.project(cam); return [(_ev.x * .5 + .5) * 176, (-_ev.y * .5 + .5) * 176]; });
  // composite: white outline, the render, then the drawn expression
  const W = 200, cv = document.createElement('canvas'); cv.width = cv.height = W; const x = cv.getContext('2d'), o = 12;
  // the body melts away toward the bottom, so the sticker reads as a bust with no hard cut
  const ren = document.createElement('canvas'); ren.width = ren.height = 176; const rx = ren.getContext('2d'); rx.drawImage(img, 0, 0);
  rx.globalCompositeOperation = 'destination-in'; const fg = rx.createLinearGradient(0, 128, 0, 174); fg.addColorStop(0, 'rgba(0,0,0,1)'); fg.addColorStop(1, 'rgba(0,0,0,0)'); rx.fillStyle = fg; rx.fillRect(0, 0, 176, 176);
  const sil = document.createElement('canvas'); sil.width = sil.height = 176; const sx = sil.getContext('2d'); sx.drawImage(ren, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#fff'; sx.fillRect(0, 0, 176, 176);
  x.save(); x.shadowColor = 'rgba(0,0,0,.28)'; x.shadowBlur = 8; x.shadowOffsetY = 3; for (let a = 0; a < 16; a++) x.drawImage(sil, o + Math.cos(a / 16 * Math.PI * 2) * 5, o + Math.sin(a / 16 * Math.PI * 2) * 5); x.restore();
  x.drawImage(ren, o, o);
  emoDecorate(x, e, eyes.map(([a, b]) => [a + o, b + o]), C);
  par.add(C.root); C.root.position.copy(pp); C.root.rotation.copy(rr); C.root.visible = vis; C.state = st; C.body.position.y = by; C.wave = wv; C.lieK = lie; C.tumble = tu; emoUnpose(C); C.body.rotation.copy(br); C.neck.rotation.y = ny; C.emo = em;
  return cv.toDataURL('image/png');
}
// the expression, drawn on like a sticker (bold shapes with a white edge)
function emoDecorate(x, e, eyes, C) {
  const ink = '#2a1d18', edge = (w = 5) => { x.lineWidth = w; x.strokeStyle = '#fff'; x.lineJoin = x.lineCap = 'round'; };
  const heart = (cx, cy, s, col) => { x.save(); x.translate(cx, cy); x.scale(s, s); x.beginPath(); x.moveTo(0, 6); x.bezierCurveTo(-12, -2, -8, -14, 0, -7); x.bezierCurveTo(8, -14, 12, -2, 0, 6); x.closePath(); edge(4 / s); x.stroke(); x.fillStyle = col; x.fill(); x.restore(); };
  const drop = (cx, cy, s, col = '#7cc8ff') => { x.save(); x.translate(cx, cy); x.scale(s, s); x.beginPath(); x.moveTo(0, -9); x.quadraticCurveTo(7, 2, 0, 7); x.quadraticCurveTo(-7, 2, 0, -9); edge(3.5 / s); x.stroke(); x.fillStyle = col; x.fill(); x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.arc(-2, 1, 1.6, 0, 7); x.fill(); x.restore(); };
  const star = (cx, cy, r, col = '#ffd24a') => { x.save(); x.translate(cx, cy); x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * .34 : r; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath(); edge(4); x.stroke(); x.fillStyle = col; x.fill(); x.restore(); };
  const word = (t, cx, cy, size, col, rot = 0) => { x.save(); x.translate(cx, cy); x.rotate(rot); x.font = `900 ${size}px "Noto Sans TC", "PingFang TC", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = size * .28; x.strokeStyle = '#fff'; x.lineJoin = 'round'; x.strokeText(t, 0, 0); x.fillStyle = col; x.fillText(t, 0, 0); x.restore(); };
  const arcEye = ([ex, ey], up, w = 9) => { x.beginPath(); if (up) x.arc(ex, ey + 4, w, Math.PI * 1.12, Math.PI * 1.88); else x.arc(ex, ey - 5, w, Math.PI * .12, Math.PI * .88); edge(7); x.stroke(); x.lineWidth = 3.6; x.strokeStyle = ink; x.stroke(); };
  const [eL, eR] = eyes, top = Math.min(eL[1], eR[1]) - 46, mid = (eL[0] + eR[0]) / 2;
  switch (e) {
    case 'wave': for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(150, 58, 14 + i * 9, -1.1, .2); edge(7); x.stroke(); x.lineWidth = 3; x.strokeStyle = C.S.col || '#f4bb72'; x.stroke(); } word('嗨！', 46, 34, 30, '#f08a3a', -.15); break;
    case 'laugh': arcEye(eL, true); arcEye(eR, true); drop(eL[0] - 16, eL[1] + 4, .8); drop(eR[0] + 16, eR[1] + 4, .8); word('哈哈', 152, 36, 30, '#f08a3a', .12); break;
    case 'love': heart(eL[0], eL[1], 1.25, '#ff4d6d'); heart(eR[0], eR[1], 1.25, '#ff4d6d'); heart(40, 44, 1.7, '#ff6f8c'); heart(160, 30, 1.25, '#ff8fa6'); heart(150, 74, .9, '#ff4d6d'); break;
    case 'good': arcEye(eL, true); arcEye(eR, true); star(40, 46, 16); star(162, 34, 12); star(156, 76, 8, '#fff2a8'); word('讚！', 44, 150, 32, '#3aa86a', -.1); break;
    case 'huh': word('？', 156, 52, 56, '#4a7ad8', .2); word('？', 134, 26, 30, '#4a7ad8', -.2); drop(mid + 34, top + 30, 1); break;
    case 'shock': x.save(); x.lineCap = 'round'; for (let i = 0; i < 5; i++) { const lx = mid - 30 + i * 15; x.beginPath(); x.moveTo(lx, top - 2); x.lineTo(lx, top + 22); edge(7); x.stroke(); x.lineWidth = 3.2; x.strokeStyle = '#5a6ad8'; x.stroke(); } x.restore(); drop(eR[0] + 24, eR[1] - 16, 1.1); drop(eL[0] - 26, eL[1] - 6, .8); word('！！', 160, 44, 40, '#e8404a', .15); break;
    case 'cry': arcEye(eL, false); arcEye(eR, false); for (const [ex, ey] of eyes) { x.save(); x.beginPath(); x.moveTo(ex - 4, ey + 2); x.quadraticCurveTo(ex - 8, ey + 40, ex - 2, ey + 70); x.lineTo(ex + 8, ey + 70); x.quadraticCurveTo(ex + 4, ey + 40, ex + 6, ey + 2); x.closePath(); edge(4); x.stroke(); x.fillStyle = 'rgba(120,200,255,.92)'; x.fill(); x.restore(); } drop(36, 70, 1.1); drop(166, 82, .9); break;
    case 'angry': {
      for (const [[ex, ey], s] of [[eL, 1], [eR, -1]]) { x.beginPath(); x.moveTo(ex - 11 * s, ey - 16); x.lineTo(ex + 9 * s, ey - 8); edge(9); x.stroke(); x.lineWidth = 5; x.strokeStyle = ink; x.stroke(); }
      x.save(); x.translate(152, 42); x.lineCap = 'round'; for (let i = 0; i < 4; i++) { x.save(); x.rotate(i * Math.PI / 2); x.beginPath(); x.moveTo(5, -16); x.quadraticCurveTo(5, -5, 16, -5); edge(9); x.stroke(); x.lineWidth = 5; x.strokeStyle = '#e8303a'; x.stroke(); x.restore(); } x.restore();
      for (const [px, py] of [[40, 52], [30, 34]]) { x.beginPath(); x.arc(px, py, 9, 0, 7); edge(4); x.stroke(); x.fillStyle = 'rgba(235,235,235,.95)'; x.fill(); }
      break;
    }
  }
}
// build every character's set, a little at a time so the game never stutters
function emoBuildAll() {
  if (EMO.built) return; EMO.built = true;
  for (const id of (window.__EMO_IDS || IDS)) for (const E of EMOTES) EMO.queue.push([id, E.id]);
  // one sticker per idle slot (never in the middle of a busy frame); the wheel fills in as they arrive
  const later = window.requestIdleCallback ? f => requestIdleCallback(f, { timeout: 1200 }) : f => setTimeout(f, 50);
  const step = dl => {
    let n = 0;
    while (EMO.queue.length && (n++ === 0 || (dl && dl.timeRemaining && dl.timeRemaining() > 12))) {
      const [id, e] = EMO.queue.shift(); const C = chars[id]; if (!C) continue;
      try { (STICK[id] = STICK[id] || {})[e] = renderSticker(C, e); } catch (err) { console.warn('sticker', id, e, err); }
    }
    if (EMO.queue.length) later(step); else { emoKitDone(); emoWheelFill(); }
  };
  later(step);
}
function stickerFor(id, e) { return STICK[id] && STICK[id][e]; }

// ---------- the wheel ----------
function emoWheelFill() {
  const W = $('emoWheel'); if (!W) return; const id = leader ? leader.id : 'dad';
  W.innerHTML = '<div class="ew-hub"><b>表情</b><small>' + (TOUCH ? '點一個' : '甩滑鼠揀 · 1–8') + '</small></div>' + EMOTES.map((E, i) => {
    const a = i / EMOTES.length * Math.PI * 2 - Math.PI / 2, src = stickerFor(id, E.id);
    return `<button class="ew-it${i === EMO.sel ? ' on' : ''}" data-i="${i}" style="--x:${(Math.cos(a) * 142).toFixed(1)}px;--y:${(Math.sin(a) * 142).toFixed(1)}px">${src ? `<img alt="" src="${src}">` : `<span class="ew-fb">${EMO_FALL[E.id]}</span>`}<em>${E.name}</em><kbd>${i + 1}</kbd></button>`;
  }).join('');
}
function emoOpen() { if (EMO.open || STATE !== 'play' || PAUSED || !leader) return; EMO.open = true; EMO.sel = -1; EMO.dx = EMO.dy = 0; emoWheelFill(); $('emoWheel').hidden = false; requestAnimationFrame(() => $('emoWheel').classList.add('on')); }
function emoClose(send) {
  if (!EMO.open) return; EMO.open = false; const W = $('emoWheel'); W.classList.remove('on'); setTimeout(() => { if (!EMO.open) W.hidden = true; }, 160);
  if (send && EMO.sel >= 0) emoDo(EMOTES[EMO.sel].id);
}
function emoMarkSel() { for (const b of document.querySelectorAll('#emoWheel .ew-it')) b.classList.toggle('on', +b.dataset.i === EMO.sel); }
function emoWheelMouse() {   // flick toward a sticker (pointer locked)
  const d = Math.hypot(EMO.dx, EMO.dy); if (d < 26) return; if (d > 140) { EMO.dx *= 140 / d; EMO.dy *= 140 / d; }
  const a = Math.atan2(EMO.dy, EMO.dx) + Math.PI / 2, n = EMOTES.length; const i = ((Math.round(a / (Math.PI * 2) * n) % n) + n) % n;
  if (i !== EMO.sel) { EMO.sel = i; emoMarkSel(); }
}
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (e.code === 'KeyT' && !e.repeat) { emoOpen(); return; }
  if (EMO.open && /^Digit[1-8]$/.test(e.code)) { EMO.sel = +e.code.slice(5) - 1; pressed[e.code] = false; emoClose(true); }
});
addEventListener('keyup', e => { if (e.code === 'KeyT') emoClose(true); });
$('emoWheel').addEventListener('pointerover', e => { const b = e.target.closest('.ew-it'); if (b) { EMO.sel = +b.dataset.i; emoMarkSel(); } });
$('emoWheel').addEventListener('click', e => { const b = e.target.closest('.ew-it'); if (b) { EMO.sel = +b.dataset.i; emoClose(true); } else if (TOUCH) emoClose(false); });
$('tbEmo').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); EMO.open ? emoClose(false) : emoOpen(); });

// ---------- doing one ----------
function emoDo(e) {
  const C = leader; if (!C || STATE !== 'play' || EMO.cd > 0) return; EMO.cd = .6;
  emoShow(C, e); if (NET.on) nsend({ t: 'emo', c: C.id, e });
  // single player: a teammate nearby sometimes answers
  if (!NET.on) {
    const reply = { wave: 'wave', laugh: 'laugh', love: 'love', good: 'good', huh: 'huh', shock: 'shock', cry: 'love', angry: 'shock' }[e];
    const near = party.filter(F => F !== C && !F.frozen && F.root.visible && F.pos.distanceTo(C.pos) < 120);
    if (near.length && rnd() < .7) { const F = pick(near); setTimeout(() => { if (STATE === 'play') emoShow(F, rnd() < .8 ? reply : pick(EMOTES).id); }, R(650, 1300)); }
  }
}
function emoRecv(d) { const C = chars[d.c]; if (C && EMOTES.some(E => E.id === d.e)) emoShow(C, d.e); }
function emoShow(C, e) {
  C.emo = { e, t: 0, dur: 1.7 };
  for (let i = EMO.bubbles.length - 1; i >= 0; i--) if (EMO.bubbles[i].C === C) { EMO.bubbles[i].el.remove(); EMO.bubbles.splice(i, 1); }
  const el = document.createElement('div'); el.className = 'emob'; const src = stickerFor(C.id, e);
  el.innerHTML = src ? `<img alt="" src="${src}">` : `<span>${(EMOTES.find(E => E.id === e) || {}).name || EMO_FALL[e]}</span>`; $('emoLayer').appendChild(el);
  EMO.bubbles.push({ C, e, t: 0, el });
  if (AU.ctx && C.pos.distanceTo(camera.position) < 420) { const v = clamp(1 - C.pos.distanceTo(camera.position) / 420, .2, 1); const f = { wave: 660, laugh: 880, love: 740, good: 990, huh: 520, shock: 1180, cry: 440, angry: 330 }[e]; tone(f, f * 1.5, .09, .05 * v, 'sine'); tone(f * 1.5, f * 1.2, .12, .04 * v, 'triangle', .07); }
}
// every frame: wheel input, the gestures, the bubbles over heads
function emoTick(dt) {
  EMO.cd = Math.max(0, EMO.cd - dt);
  if (EMO.open) { if (STATE !== 'play' || PAUSED) emoClose(false); else emoWheelMouse(); }
  // on the title screen, never draw a sticker over the title card
  let card = null, hide = PAUSED; if (STATE === 'title' && EMO.bubbles.length) { const el = document.querySelector('#start .card'); if (el && !$('start').hidden) card = el.getBoundingClientRect(); else if (!LOBBY.on) hide = true; }
  for (let i = EMO.bubbles.length - 1; i >= 0; i--) {
    const B = EMO.bubbles[i], C = B.C; B.t += dt;
    if (B.t > 2.8 || !C.root.visible || LEVEL === undefined) { B.el.remove(); EMO.bubbles.splice(i, 1); continue; }
    const p = C.root.position, d = camera.position.distanceTo(p);
    _ev.set(p.x, p.y + C.h * 1.18 + 2.2 * C.k, p.z).project(camera);
    const sx = (_ev.x * .5 + .5) * innerWidth, sy = (-_ev.y * .5 + .5) * innerHeight;
    const on = !hide && _ev.z < 1 && d < 700 && Math.abs(_ev.x) < 1.2 && Math.abs(_ev.y) < 1.2 && !(card && sx > card.left - 40 && sx < card.right + 50 && sy > card.top - 20 && sy < card.bottom + 120);
    B.el.style.display = on ? '' : 'none'; if (!on) continue;
    const sz = clamp(2400 / Math.max(d, 1), 54, 104) * (STATE === 'title' ? 1.2 : 1), pop = B.t < .18 ? .4 + B.t / .18 * .75 : B.t < .3 ? 1.15 - (B.t - .18) / .12 * .15 : 1, fade = B.t > 2.4 ? 1 - (B.t - 2.4) / .4 : 1;
    B.el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -100%) scale(${pop.toFixed(3)})`;
    B.el.style.width = B.el.style.height = sz.toFixed(0) + 'px'; B.el.style.opacity = fade.toFixed(3);
  }
}
// called at the end of animChar: act it out
function emoAnim(C, dt) {
  const M = C.emo; if (!M) return; M.t += dt;
  if (M.t > M.dur) { C.emo = null; C.head.rotation.z = 0; C.body.rotation.y = 0; for (const E of C.eyes) { E.scale.x = 1; E.scale.z = .7; } return; }
  if (C.climbing || C.state === 'climb' || C.state === 'hang' || C.frozen) return;
  emoPose(C, M.e, M.t);
}
