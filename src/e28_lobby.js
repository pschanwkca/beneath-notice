// =====================================================================
//  THE ONLINE ROOM — a character select page, and saving online progress
//  · in a room, the title scene moves into the machine's prep area: everyone who'll play lines up in
//    front of the glowing exit, with the player's name over their character
//  · round portraits along the bottom to pick from (locked ones are silhouettes), a name box, the mic
//  · names are kept on this device and shown in game (name tags, chat, the spectate bar)
//  · the host's game saves itself (quest, checkpoint, what's been collected and opened); next time the
//    room can carry on from there — the exit of the prep area then leads straight back to that spot
// =====================================================================
const LOBBY = { on: false, ids: [], pos: {}, hop: {}, tags: {}, hover: null, seen: null, flash: {}, stage: null };
const NAME_KEY = 'bn_name', MPS_KEY = 'bn_mpsave1';
function cleanName(n) { return String(n || '').replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 10); }
function myName() { try { return cleanName(localStorage.getItem(NAME_KEY)); } catch (e) { return ''; } }
function nameOf(peer) { return peer && NET.names && NET.names[peer] || ''; }
function setMyName(v) {
  v = cleanName(v); try { localStorage.setItem(NAME_KEY, v); } catch (e) { }
  for (const id of ['mpName', 'mpName2']) { const el = $(id); if (el && el.value !== v && document.activeElement !== el) el.value = v; }
  if (!NET.me) return; NET.names = NET.names || {};
  if (NET.host) { NET.names[NET.me] = v; mpBroadcastLobby(); if (NET.started) nsend({ t: 'names', names: NET.names }); mpRender(); refreshPartyHUD(); }
  else if (NET.hostId) nsend({ t: 'name', n: v }, NET.hostId);
}
function hostName(peer, n) { NET.names = NET.names || {}; NET.names[peer] = cleanName(n); mpBroadcastLobby(); if (NET.started) nsend({ t: 'names', names: NET.names }); mpRender(); refreshPartyHUD(); }
let _nmT = 0;
for (const id of ['mpName', 'mpName2']) {
  const el = $(id); el.value = myName();
  el.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') el.blur(); });
  el.addEventListener('input', () => { clearTimeout(_nmT); _nmT = setTimeout(() => setMyName(el.value), 350); });
  el.addEventListener('change', () => setMyName(el.value));
}

// ---------- the lineup in the prep area ----------
function lobbyActive() { return STATE === 'title' && !NET.on && !$('mp').hidden && !$('mpRoom').hidden && WORLD; }
function lobbyIds() { return IDS.filter(id => chars[id] && (CORE.includes(id) || (NET.slots && NET.slots[id]))); }
function lobbySlot(i, n) { const x = -(i - (n - 1) / 2) * 8.8; return V3(x, 0, 15 + Math.abs(x) * .12).add(PO); }   // seen from the front: first on the left
function updLobby(dt) {
  if (!LOBBY.on) { LOBBY.on = true; LOBBY.seen = null; LP.snap = true; for (const id in chars) { const C = chars[id]; C.root.visible = false; C.emo = null; C.tumble = 0; C.spin = 0; C.lieK = 0; C.shell = false; C.roost = null; C.squash = 0; C.root.rotation.set(0, C.yaw, 0); } LOBBY.pos = {}; }
  const ids = lobbyIds(), n = ids.length, t = TTL.t;
  // who just picked or dropped a character: they hop, wave, show a sticker
  const prev = LOBBY.seen; LOBBY.seen = {}; for (const id of ids) LOBBY.seen[id] = NET.slots[id] || '';
  if (prev) for (const id of ids) if (NET.slots[id] && prev[id] !== NET.slots[id]) { LOBBY.hop[id] = 0; LOBBY.flash[id] = 1; SND.land(.3); }
  for (const id of IDS) if (!ids.includes(id) && chars[id]) { chars[id].root.visible = false; delete LOBBY.pos[id]; }
  chars.gecko.root.visible = false;
  ids.forEach((id, i) => {
    const C = chars[id], to = lobbySlot(i, n); let p = LOBBY.pos[id];
    if (!p) { p = LOBBY.pos[id] = to.clone().add(V3(to.x > PO.x ? 12 : -12, 0, -3)); C.root.visible = true; }
    const d = Math.hypot(to.x - p.x, to.z - p.z), sp = 30 * dt;
    if (d > .3) { p.x += (to.x - p.x) / d * Math.min(d, sp); p.z += (to.z - p.z) / d * Math.min(d, sp); C.state = 'walk'; C.spd = 18; C.yaw = Math.atan2(to.x - p.x, to.z - p.z); }
    else { C.state = 'idle'; C.spd = 0; C.yaw = angDamp(C.yaw, Math.PI + (to.x - PO.x) * -.012, 6, dt); }
    C.tumble = 0; let y = 0; const h = LOBBY.hop[id];
    if (h !== undefined) { LOBBY.hop[id] = h + dt; const k = h / .55; if (k < 1) { y = Math.sin(k * Math.PI) * 4; C.state = 'air'; } else { delete LOBBY.hop[id]; C.squash = .5; } }
    C.pos.set(p.x, PO.y + y, p.z); if (C.disp) C.disp.copy(C.pos);
    C.wave = LOBBY.hover === id || (NET.slots[id] === NET.me && (t % 6) < 1.6);
    lobbyPad(i, p, id, dt);
  });
  for (let i = ids.length; i < 10; i++) if (LOBBY.stage) LOBBY.stage.children[i].visible = false;
  // camera: low, in front of them, the glowing exit behind
  const wide = innerWidth / innerHeight, dist = clamp(16 + n * 2.9, 25, 44) * (wide < 1.5 ? 1.25 : 1);
  // with the info card on the left (wide screens), the line sits a little right of centre
  const card = $('mpInfo'), shift = card && card.offsetParent && card.innerHTML ? clamp((card.getBoundingClientRect().right / innerWidth - .15) * dist * .9, 0, 14) : 0;
  LOBBY.sx = damp(LOBBY.sx || 0, shift, 3, dt);
  camera.position.set(PO.x + LOBBY.sx + Math.sin(t * .15) * 1.5, PO.y + 6.8, PO.z + 15 - dist);
  camera.lookAt(PO.x + LOBBY.sx, PO.y + 1.6, PO.z + 15);
  bokeh.uniforms.focus.value = dist;
  lobbyTags(ids);
}
function lobbyTags(ids) {
  const box = $('lbTags'); if (!box) return;
  for (const id of IDS) {
    let el = LOBBY.tags[id]; const on = ids.includes(id) && chars[id].root.visible;
    if (!el) { if (!on) continue; el = LOBBY.tags[id] = document.createElement('div'); el.className = 'lbtag'; box.appendChild(el); }
    if (!on) { el.style.opacity = 0; continue; }
    const C = chars[id], p = V3(C.pos.x, C.pos.y + C.h * 1.08, C.pos.z).project(camera);
    el.style.opacity = p.z < 1 ? 1 : 0;
    el.style.transform = `translate(${((p.x * .5 + .5) * innerWidth).toFixed(1)}px, ${((-p.y * .5 + .5) * innerHeight).toFixed(1)}px) translate(-50%, -100%)`;
    const peer = NET.slots[id], me = peer && peer === NET.me, label = peer ? (nameOf(peer) || (me ? '你' : '玩家 ' + (NET.order.indexOf(peer) + 1))) : '電腦';
    const sig = label + '|' + me + '|' + !!peer;
    if (el.dataset.sig !== sig) { el.dataset.sig = sig; el.className = 'lbtag' + (me ? ' me' : '') + (peer ? '' : ' ai'); el.style.setProperty('--c', me ? '#f4bb72' : peer ? '#6ff6ee' : '#fff'); el.innerHTML = `<b>${label.replace(/</g, '')}</b><small>${C.S.name}</small>`; }
  }
}
function lobbyEnd() {
  if (!LOBBY.on) return; LOBBY.on = false; if (LOBBY.stage) LOBBY.stage.visible = false;
  for (const id in LOBBY.tags) LOBBY.tags[id].remove(); LOBBY.tags = {}; LOBBY.pos = {}; LOBBY.hop = {};
  for (const id of IDS) if (chars[id]) { chars[id].root.visible = true; chars[id].wave = false; } LP.snap = true;
}

// the stage: a glowing ring on the floor and a soft cone of light over each place in the line
// (warm for you, cyan for the other players, a faint white for the computer-run ones)
function lobbyStage() {
  if (LOBBY.stage) return LOBBY.stage;
  const g = new THREE.Group(); scene.add(g); LOBBY.stage = g;
  const ringG = new THREE.RingGeometry(3.3, 4.1, 48), discG = new THREE.CircleGeometry(4.1, 48), coneG = new THREE.CylinderGeometry(1.2, 4.4, 26, 32, 1, true);
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Group();
    const rm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending });
    const dm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .12, depthWrite: false, blending: THREE.AdditiveBlending });
    const cm = new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Color() }, uA: { value: .2 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = uv.y; vec4 w = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-w.xyz); gl_Position = projectionMatrix*w; }',
      fragmentShader: 'uniform vec3 uC; uniform float uA; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float e = pow(1.0-abs(dot(vN,vV)),1.5); float f = (1.0-vY)*(1.0-vY); gl_FragColor = vec4(uC*uA*f*(0.35+e), 1.0); }' });
    const ring = new THREE.Mesh(ringG, rm), disc = new THREE.Mesh(discG, dm), cone = new THREE.Mesh(coneG, cm);
    ring.rotation.x = disc.rotation.x = -Math.PI / 2; ring.position.y = .08; disc.position.y = .06; cone.position.y = 13;
    s.add(disc, ring, cone); s.userData = { rm, dm, cm }; g.add(s);
  }
  return g;
}
const _pc = new THREE.Color();
function lobbyPad(i, p, id, dt) {
  const g = lobbyStage(); g.visible = true; const s = g.children[i]; if (!s) return; s.visible = true; s.position.set(p.x, PO.y, p.z);
  const peer = NET.slots[id], me = peer && peer === NET.me, f = LOBBY.flash[id] || 0; if (f > 0) LOBBY.flash[id] = Math.max(0, f - dt * 1.4);
  _pc.set(me ? 0xf4bb72 : peer ? 0x6ff6ee : 0xbfd8dc);
  const k = (me ? 1.15 : peer ? .95 : .35) + f * 1.4 + (LOBBY.hover === id ? .35 : 0), U = s.userData;
  U.rm.color.copy(_pc).multiplyScalar(k * 1.6); U.dm.color.copy(_pc).multiplyScalar(k); U.cm.uniforms.uC.value.copy(_pc); U.cm.uniforms.uA.value = (me ? .32 : peer ? .24 : .07) + f * .3;
  s.children[1].scale.setScalar(1 + Math.sin(TTL.t * 2.2 + i) * .03 + f * .25);
}
// the card on the left: whoever you're pointing at, or the one you've picked
function mpInfoRender() {
  const el = $('mpInfo'); if (!el) return;
  const id = LOBBY.hover && isUnlocked(LOBBY.hover) ? LOBBY.hover : IDS.find(k => NET.slots[k] === NET.me);
  if (!id) { el.innerHTML = ''; return; }
  const S = SP[id], peer = NET.slots[id], bar = v => `${Math.round(clamp((v - .65) / .85, .08, 1) * 100)}%`;
  const who = peer ? (peer === NET.me ? '你' : nameOf(peer) || '另一位玩家') : CORE.includes(id) ? '電腦控制中（揀佢就由你玩）' : '未有人揀';
  el.style.setProperty('--c', S.col);
  el.innerHTML = `<div class="ih"><div class="ip">${PORTRAITS[id] ? `<img alt="" src="${PORTRAITS[id]}">` : ''}</div><div class="in"><b>${S.name}</b><small>${S.role}</small></div></div>
    <div class="ia"><em>${S.abil}</em><p>${S.desc}</p></div>
    <div class="is"><span>速度</span><i style="--v:${bar(S.spd)}"></i><span>跳躍</span><i style="--v:${bar(S.jmp)}"></i><span>攀爬</span><i style="--v:${bar(S.clb)}"></i></div>
    <div class="iw">玩家：<b>${who.replace(/</g, '')}</b></div>`;
}

// ---------- saving online progress (host) ----------
function mpSaveLoad() { try { const S = JSON.parse(localStorage.getItem(MPS_KEY) || 'null'); return S && S.v === 1 ? S : null; } catch (e) { return null; } }
function mpSaveWhere(S) {
  const Q = S.pro ? MP_PRO : MP_QUESTS, q = Q[S.q] || Q[0];
  const z = { portal: '準備區', basement: '序章 · 地庫', wall: '序章 · 牆內', kitchen: '第一章 · 廚房', garage: '第二章 · 車房', yard: '第三章 · 後園', road: '第四章 · 馬路' }[S.zone] || '';
  const ago = Math.max(1, Math.round((Date.now() - S.at) / 60000)), when = ago < 60 ? `${ago} 分鐘前` : ago < 1440 ? `${Math.round(ago / 60)} 小時前` : `${Math.round(ago / 1440)} 日前`;
  return `${z}${z ? '：' : ''}${q.t}（${when}）`;
}
let _svSig = '';
function mpSaveTick() {
  if (!NET.on || !NET.host || STATE !== 'play' || !WORLD) return;
  if (PRO.on && quest === 0) return;   // still in the prep area: nothing to carry on from yet
  const f = [LIV.open, LIV.remoteGot, LIV.ventOpen, GS.camBroken, GS.latch, YS.chip].map(v => v ? 1 : 0).join('');
  const parts = LIV.parts.map(p => p.got ? 1 : 0).join('');
  const sig = [PRO.on ? 1 : 0, quest, cp, gotBat, PROTO, parts, f].join('|'); if (sig === _svSig) return; _svSig = sig;
  const S = { v: 1, at: Date.now(), pro: PRO.on ? 1 : 0, q: quest, cp, zone: LEVEL, gb: gotBat, cm: cellMax, pr: PROTO, parts, f,
    bat: batteries.map(b => b.got ? 1 : 0).join(''), vi: VIALS.map(v => v.got ? 1 : 0).join(''), cr: CRUMBS.map(c => c.got ? 1 : 0).join('') };
  try { localStorage.setItem(MPS_KEY, JSON.stringify(S)); } catch (e) { }
}
// everyone applies the saved world when the game starts (the host's snapshots keep it in step after)
function mpApplySave(S) {
  if (!S) return;
  const hide = o => { o.got = true; if (o.g) o.g.visible = false; if (o.halo) o.halo.visible = false; if (o.m) o.m.visible = false; };
  [...(S.bat || '')].forEach((g, i) => { if (g === '1' && batteries[i]) hide(batteries[i]); });
  [...(S.vi || '')].forEach((g, i) => { if (g === '1' && VIALS[i]) hide(VIALS[i]); });
  [...(S.cr || '')].forEach((g, i) => { if (g === '1' && CRUMBS[i]) hide(CRUMBS[i]); });
  [...(S.parts || '')].forEach((g, i) => { const p = LIV.parts[i]; if (g === '1' && p) { p.got = true; p.g.visible = false; p.halo.visible = false; } }); LIV.partsGot = LIV.parts.filter(p => p.got).length;
  gotBat = S.gb || 0; cellMax = S.cm || cellMax; cells = cellMax; PROTO = Math.max(PROTO, S.pr || 0);
  const f = S.f || '';
  if (f[0] === '1' && !LIV.open) { LIV.open = true; const w = LIV.wedge; if (w && !w.gone) { w.cx -= 34; applyResize(w); } }
  if (f[1] === '1' && !LIV.remoteGot) { LIV.remoteGot = true; const r = LIV.remote; if (r && r.bat) r.bat.visible = false; }
  if (f[2] === '1') { LIV.ventOpen = true; LIV.ventCol.y0 = -999; LIV.ventCol.y1 = -998; }
  if (f[3] === '1' && GS.cam && !GS.camBroken) { GS.cam.y0 = Math.min(GS.cam.y0, 150); applyResize(GS.cam); }
  if (f[4] === '1') GS.latch = true;
  if (f[5] === '1' && !YS.chip) { YS.chip = true; YS.chipM.visible = false; YS.chipHalo.visible = false; }
}
function saveCps(S) { return S.pro ? (PRO.cps || MP_CPS) : MP_CPS; }
// the exit of the prep area takes everyone back to the saved checkpoint
function portalResumeLand(S) {
  const L = saveCps(S), p = L[Math.min(S.cp, L.length - 1)] || L[0];
  PRO.on = !!S.pro; QUESTS = PRO.on ? MP_PRO : MP_QUESTS; LEVELS.kitchen.quests = QUESTS; CPS = PRO.on ? (PRO.cps || MP_CPS) : MP_CPS; cp = S.cp;
  party.forEach(C => { if (!mine(C)) return; const i = slotOf(C), a = i * 2.39996; C.pos.set(p[0] + Math.cos(a) * (2 + i * .9), p[1] + .5, p[2] + Math.sin(a) * (2 + i * .9)); C.vel.set(0, 0, 0); C.grounded = false; C.climbing = false; C.mantle = null; C.ptw = null; C.queue = []; C.lastTrail = C.pos.clone(); if (C.disp) C.disp.copy(C.pos); unPoof(C.pos); });
  const nz = zoneAt(leader.pos); if (nz) enterZone(nz.id, true); LP.snap = true; trail = []; cam.tgt.set(leader.pos.x, leader.pos.y + leader.h * .8, leader.pos.z); cam.curD = cam.dist;
  if (!NET.client) { setQuest(S.q); toastW('回到上次的進度！', 2.6); }
}
