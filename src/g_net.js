
// =====================================================================
//  ONLINE CO-OP  (1–4 players, peer-to-peer over WebRTC — no game server)
//
//  Ownership: every character is simulated by exactly one machine, its owner,
//  which streams it to everyone else. Players own their own character. The host
//  (whoever opened the room) owns the AI teammates, the family, the cat, the props,
//  the toys and all pickups, and decides level changes.
//  Stacking, carrying and turning into a toy "lease" a character to whoever is
//  moving it, then hand it back with its final position.
//
//  Transport: Trystero (WebRTC, signalling over public Nostr relays).
//  Add ?net=local to the URL to use a BroadcastChannel instead (two tabs, same computer).
// =====================================================================
const NET = { on: false, host: false, client: false, me: '', hostId: '', code: '', tx: null, slots: { dad: null, sq: null, bear: null, cham: null }, peers: [], my: null, sendT: 0, worldT: 0, started: false, pend: {}, seenT: 0, npc: null, joinTimer: 0, order: [] };
const APP_ID = 'pschanwkca/beneath-notice/coop-v1';
// Players connect straight to each other over their own internet (no relay server in between).
// The public STUN servers only help each player find their own address so most home networks can link up.
const STUN_SERVERS = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }];
NET.tokOf = {}; NET.reserved = {};
// a token that survives a reload, so a dropped player gets their own character back
NET.tok = (() => { const k = 'bn-player'; let t = ''; try { const st = /[?&]net=local/.test(location.search) ? sessionStorage : localStorage; t = st.getItem(k); if (!t) { t = Math.random().toString(36).slice(2, 12); st.setItem(k, t); } } catch (e) { t = Math.random().toString(36).slice(2, 12); } return t; })();
const LOCALNET = /[?&]net=local/.test(location.search);
function mine(C) { return !NET.on || C.owner === NET.me; }
function isPlayerChar(C) { return NET.on && !!NET.slots[C.id]; }
function playerChars() { return NET.on ? party.filter(C => NET.slots[C.id]) : [leader]; }
function nsend(d, to) { if (!NET.tx) return; try { NET.tx.send(d, to); } catch (e) { console.warn('net send', e); } }
function sayW(n, x, c, d) { say(n, x, c, d); if (NET.on && NET.host) nsend({ t: 'say', n, x, c, d }); }
function toastW(x, d) { toast(x, d); if (NET.on && NET.host) nsend({ t: 'toast', x, d }); }
function playerLabel(id) { const p = NET.slots[id]; if (!p) return '電腦'; if (p === NET.me) return '你'; return nameOf(p) || 'P' + (NET.order.indexOf(p) + 1); }

// ---------- transports ----------
function trysteroTransport(code) {
  if (!window.Trystero) throw new Error('連線模組載入失敗');
  const room = window.Trystero.joinRoom({ appId: APP_ID, identity: 'none', maxUsers: 10, relayRedundancy: 5, rtcConfig: { iceServers: STUN_SERVERS } }, 'room-' + code);
  const act = room.makeAction('m');
  const T = { send: (d, to) => act.send(d, to ? { target: to } : undefined), leave: () => room.leave(), ping: id => room.ping(id), peers: () => room.getPeers() };
  act.onMessage((d, ctx) => T.onMsg && T.onMsg(d, ctx.peerId));
  room.onPeerJoin(({ peerId }) => T.onJoin && T.onJoin(peerId));
  room.onPeerLeave(({ peerId }) => T.onLeave && T.onLeave(peerId));
  room.onError(e => T.onErr && T.onErr(e));
  room.getSelf().then(s => T.onSelf && T.onSelf(s.peerId));
  return T;
}
function localTransport(code) {
  const ch = new BroadcastChannel('bn-' + code); const me = 'L' + Math.random().toString(36).slice(2, 8); const known = new Set();
  const T = { send: (d, to) => ch.postMessage({ f: me, to: to || null, d }), leave: () => { ch.postMessage({ f: me, bye: 1 }); ch.close(); } };
  ch.onmessage = e => {
    const m = e.data; if (m.f === me) return;
    if (m.bye) { if (known.delete(m.f)) T.onLeave && T.onLeave(m.f); return; }
    if (!known.has(m.f)) { known.add(m.f); T.onJoin && T.onJoin(m.f); if (m.hi) ch.postMessage({ f: me, hi: 1 }); }
    if (m.d !== undefined && (!m.to || m.to === me)) T.onMsg && T.onMsg(m.d, m.f);
  };
  setTimeout(() => { T.onSelf && T.onSelf(me); ch.postMessage({ f: me, hi: 1 }); }, 0);
  addEventListener('beforeunload', () => T.leave());
  return T;
}

// ---------- lobby ----------
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function mpStatus(t) { $('mpStatus').textContent = t; }
function mpOpen(code) { $('start').hidden = true; $('mp').hidden = false; $('mpHome').hidden = false; $('mpRoom').hidden = true; $('mpCode').value = code || ''; if (code) $('mpCode').focus(); }
function mpLink() { return location.origin + location.pathname + '?room=' + NET.code + (LOCALNET ? '&net=local' : ''); }
function mpConnect(code, host) {
  NET.code = code; NET.host = host; NET.client = !host; NET.slots = { dad: null, sq: null, bear: null, cham: null }; NET.peers = []; NET.hostId = ''; NET.order = [];
  $('mpHome').hidden = true; $('mpRoom').hidden = false; $('mp').classList.add('inroom'); $('mpRoomCode').textContent = code; $('mpStart').hidden = !host; $('mpErr').textContent = '';
  NET.names = {}; const sv = host ? mpSaveLoad() : null; NET.save = sv; NET.useSave = !!sv; $('mpSave').hidden = !sv; if (sv) { $('mpSaveTxt').textContent = mpSaveWhere(sv); mpSaveSel(); }
  try { history.replaceState(null, '', mpLink()); } catch (e) { }
  mpStatus(host ? '房間已開好。把房號或連結傳給朋友，然後各自揀角色。' : '正在尋找房間……');
  nlog((host ? '開房 ' : '加入房間 ') + code + (LOCALNET ? '（本機測試）' : ''));
  let T; try { T = NET.tx = LOCALNET ? localTransport(code) : trysteroTransport(code); } catch (e) { mpStatus('連線失敗：' + e.message); return; }
  T.onSelf = id => { NET.me = id; nlog('我的連線 id ' + String(id).slice(0, 4)); if (host) { NET.hostId = id; NET.order = [id]; NET.names[id] = myName(); } mpRender(); vcSelf(); };
  T.onJoin = id => { nlog('連上：' + nlId(id) + (id === NET.hostId ? '（房主）' : '')); if (id === NET.hostId && NET.hostGone) { NET.hostGone = 0; NET.heard = performance.now(); if (NET.started) { nsend({ t: 'hi', tok: NET.tok, n: myName() }, id); toast('重新連上房主了', 2.4); } } if (!NET.peers.includes(id)) NET.peers.push(id); vcJoined(id); if (NET.host) { if (!NET.order.includes(id)) NET.order.push(id); mpBroadcastLobby(); } else nsend({ t: 'hi', tok: NET.tok, n: myName() }, id); mpRender(); };
  T.onLeave = id => mpPeerLeft(id);
  T.onMsg = (d, from) => { NLOG.peer[from] = performance.now(); if (from === NET.hostId) NET.heard = performance.now(); try { netMsg(d, from); } catch (e) { console.warn('net msg', d && d.t, e); } };
  T.onErr = e => { nlog('連線錯誤：' + (e && (e.code || e.error || e.message) || e)); if (e && e.code === 'room-full') mpStatus('房間暫時滿了。如果你剛斷線，等半分鐘再試。'); else if (e && e.code === 'peer-connect-failed') $('mpErr').textContent = '有隊友連唔上（網絡限制）。可以試下用另一個網絡。'; };
  vcMicStart(); vcUI();
  if (!host) { clearTimeout(NET.joinTimer); NET.joinTimer = setTimeout(() => { if (!NET.hostId) mpStatus('找不到這個房間。確認房號，或者等房主開好房間再試。'); }, 15000); }
  mpRender();
}
function mpBroadcastLobby(to) { nsend({ t: 'lobby', host: NET.me, slots: NET.slots, started: NET.started, order: NET.order, names: NET.names }, to); }
function mpPick(id) {
  if (NET.on || !NET.me) return;
  const cur = NET.slots[id]; if (cur && cur !== NET.me) return; if (!canPickMP(id)) return;
  if (NET.host) hostPick(NET.me, id); else nsend({ t: 'pick', id }, NET.hostId || undefined);
}
function hostPick(peer, id) {
  if (NET.started) return; const cur = NET.slots[id];
  if (cur === peer) NET.slots[id] = null;
  else if (!cur) { for (const k of IDS) if (NET.slots[k] === peer) NET.slots[k] = null; NET.slots[id] = peer; }
  mpBroadcastLobby(); mpRender();
}
function mpRender() {
  const box = $('mpSlots'); if (!box) return;
  box.innerHTML = IDS.map(id => {
    const p = NET.slots[id]; const S = SP[id]; const nm = nameOf(p); const who = p ? (p === NET.me ? (nm || '你') : nm || (p === NET.hostId ? '房主' : '玩家 ' + (NET.order.indexOf(p) + 1))) : CORE.includes(id) ? '電腦' : '可以揀';
    // not unlocked on this device yet: a silhouette and how to get it
    if (!p && !canPickMP(id)) { const r = ROSTER.find(q => q.id === id); return `<button class="mps lock" disabled title="${r.how}"><span class="ph">${PORTRAITS[id] ? `<img class="sil" alt="" src="${PORTRAITS[id]}">` : SIL_SVG}<i>?</i></span><b>？？？</b><small>${r.how}</small><em>未解鎖</em></button>`; }
    return `<button class="mps${p === NET.me ? ' me' : p ? ' taken' : ''}" data-id="${id}" ${p && p !== NET.me ? 'disabled' : ''}><span class="ph">${PORTRAITS[id] ? `<img alt="" src="${PORTRAITS[id]}">` : ''}</span><b>${S.name}</b><small>${S.abil}</small><em>${who}</em></button>`;
  }).join('');
  box.querySelectorAll('.mps').forEach(b => { b.addEventListener('click', () => mpPick(b.dataset.id)); b.addEventListener('pointerenter', () => { LOBBY.hover = b.dataset.id; mpInfoRender(); }); b.addEventListener('pointerleave', () => { LOBBY.hover = null; mpInfoRender(); }); });
  mpInfoRender();
  const n = (NET.me ? 1 : 0) + NET.peers.length; $('mpCount').textContent = $('mpCount2').textContent = `${n} / 8 人在房間`;
  if (NET.host) { const everyone = [NET.me, ...NET.peers]; const ok = everyone.every(p => IDS.some(k => NET.slots[k] === p)); $('mpStart').disabled = !ok; $('mpStart').textContent = ok ? '開始' : '等大家揀好角色'; }
  else if (NET.hostId && NET.remoteStarted && !NET.on) mpStatus(IDS.some(k => !NET.slots[k]) ? '遊戲進行中：揀一隻「電腦控制」的角色加入。之前斷了線的話，會自動拿回原本的角色。' : '房間已滿，八隻角色都有人玩。');
  else if (NET.hostId && !NET.started) mpStatus(IDS.some(k => NET.slots[k] === NET.me) ? '已揀好，等房主開始。' : '揀一隻角色。');
}
function mpPeerLeft(id) {
  nlog('斷線：' + nlId(id) + '（' + nlChar(id) + '）' + (id === NET.hostId ? '（房主）' : '')); vcClose(id);
  NET.peers = NET.peers.filter(p => p !== id);
  if (!NET.started) { if (NET.host) { for (const k of IDS) if (NET.slots[k] === id) NET.slots[k] = null; mpBroadcastLobby(); } else if (id === NET.hostId) mpStatus('房主離開了房間。'); mpRender(); return; }
  if (id === NET.hostId && !NET.host) { NET.hostGone = performance.now(); return; }
  for (const k of IDS) {
    const C = chars[k]; if (C.owner === id) C.owner = C.baseOwner;
    if (NET.slots[k] === id) { if (NET.host) NET.reserved[k] = NET.tokOf[id]; NET.slots[k] = null; C.baseOwner = NET.hostId; C.owner = NET.hostId; C.queue = []; if (C.disp) C.disp.copy(C.pos); toast(`${C.S.name}的玩家斷線了，暫時由電腦控制。用同一個房號重新加入就能拿回這隻角色`, 4.2); }
  }
  refreshPartyHUD(); updChip();
}
function mpHostLost() {
  nlog('等唔到房主，呢局完咗');
  STATE = 'title'; if (document.pointerLockElement) document.exitPointerLock();
  $('hud').classList.add('off'); $('touch').hidden = true; $('mp').hidden = false; $('mpHome').hidden = true; $('mpRoom').hidden = false; $('mpStart').hidden = true;
  mpStatus('房主離開了，這局結束。'); $('mpLeave').textContent = '返回主畫面';
}
function mpLeave() { vcCloseAll(); try { NET.tx && NET.tx.leave(); } catch (e) { } location.href = location.pathname + (LOCALNET ? '?net=local' : ''); }
function updChip() { const el = $('mpChip'); if (!NET.on) { el.hidden = true; return; } el.hidden = false; const n = 1 + NET.peers.length; el.innerHTML = `<i></i>房號 <b>${NET.code}</b> · ${n} 位玩家<span class="vcmic"></span>`; vcUI(); }

// ---------- starting ----------
function mpStartGame() { if (!NET.host || $('mpStart').disabled) return; nlog('開始遊戲（' + (1 + NET.peers.length) + ' 人' + (NET.useSave ? '，繼續上次進度' : '') + '）'); NET.started = true; NET.resume = NET.useSave ? NET.save : null; nsend({ t: 'start', slots: NET.slots, order: NET.order, names: NET.names, res: NET.resume }); netBegin(); }
function mpSaveSel() { $('mpSaveSel').querySelectorAll('button').forEach(b => b.classList.toggle('on', (b.dataset.s === 'cont') === NET.useSave)); }
$('mpSaveSel').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { NET.useSave = b.dataset.s === 'cont'; mpSaveSel(); }));
function netBegin() {
  nlog('遊戲開始');
  titleEnd(); lobbyEnd();
  NET.on = true; NET.started = true; NET.client = !NET.host; NET.my = IDS.find(id => NET.slots[id] === NET.me);
  for (const id of ['bat', 'tort', 'mole']) if (!NET.slots[id]) { const K = chars[id]; K.root.visible = false; K.pos.set(0, -900, 0); K.state = 'idle'; K.shell = false; K.roost = null; }
  for (const id of IDS) { const C = chars[id]; C.owner = C.baseOwner = NET.slots[id] || NET.hostId; C.net = null; }
  audioInit(); $('mp').hidden = true; $('start').hidden = true; updChip(); document.documentElement.classList.add('net');
  setTimeout(() => toast(TOUCH ? '近距離語音已開：越近越大聲 · 「聊天」打字' : '近距離語音已開：越近越大聲 · Enter 打字 · M 靜音', 4), 2500);
  joinCham(); syncParty(); playT = 0; fails = 0; PROTO = 0;
  proStart(); if (NET.host) { requestLock(); loadLevel('portal'); } // online games start in the prep area; clients follow the host's level message
}
// the four Origin Dynamics characters only come along when a player picks them
function syncParty() {
  if (!NET.on) return; let ch = false;
  for (const id of IDS) { const C = chars[id]; if (CORE.includes(id) || !NET.slots[id] || party.includes(C)) continue; party.push(C); C.root.visible = true; C.queue = []; C.lastTrail = C.pos.clone(); C.disp = C.pos.clone(); C.stamina = 100; C.stamMax = 100; if (STATE === 'play' && leader) { C.pos.copy(leader.pos); C.disp.copy(C.pos); } ch = true; }
  if (ch) { assignGaps(); buildPartyHUD(); }
}
function netAfterSpawn() {
  if (!NET.on) return;
  for (const C of party) { C.owner = C.baseOwner; C.stk = false; C.carried = false; C.carry = null; C.net = null; C.frozen = false; }
  const L8 = NET.late; NET.late = null;
  if (L8) { for (const k of IDS) chars[k].owner = L8.own[k]; const C = chars[NET.my]; C.pos.set(L8.me[0], L8.me[1], L8.me[2]); C.yaw = L8.me[3]; C.stamMax = L8.me[4]; C.stamina = C.stamMax; C.vel.set(0, 0, 0); C.grounded = false; if (C.disp) C.disp.copy(C.pos); }
  leader = chars[NET.my]; trail = []; leader.lastTrail.copy(leader.pos); assignGaps(); refreshPartyHUD(); NET.pend = {};
  if (NET.client && !TOUCH && !locked) setTimeout(() => { if (!locked && STATE === 'play') pause(); }, 1400);
}

// ---------- joining a game that is already running ----------
function hostRejoin(peer) {
  const tok = NET.tokOf[peer]; if (!tok) return false; nlog('重新連返：' + nlId(peer));
  // the old connection may not have timed out yet: drop it first
  for (const k of IDS) { const p = NET.slots[k]; if (p && p !== peer && p !== NET.me && NET.tokOf[p] === tok) mpPeerLeft(p); }
  const k = IDS.find(k => !NET.slots[k] && NET.reserved[k] === tok); if (!k) return false;
  hostAssignLate(peer, k, true); return true;
}
function hostAssignLate(peer, id, back) {
  const C = chars[id]; if (NET.slots[id] || IDS.some(k => NET.slots[k] === peer)) return;
  nlog('中途加入：' + nlId(peer) + ' 揀咗 ' + C.S.name); NET.slots[id] = peer; delete NET.reserved[id]; C.baseOwner = peer; if (C.owner === NET.hostId && !C.frozen && !C.stk && !C.carried) C.owner = peer;
  if (!NET.order.includes(peer)) NET.order.push(peer);
  const own = {}; for (const k of IDS) own[k] = chars[k].owner;
  nsend({ t: 'slot', id, peer, order: NET.order, own });
  nsend({ t: 'late', names: NET.names, slots: NET.slots, order: NET.order, lv: PRO.on ? 'portal' : ['portal', 'basement', 'wall'].includes(LEVEL) ? 'kitchen' : LEVEL, own, me: [C.pos.x, C.pos.y, C.pos.z, C.yaw, C.stamMax || 100], back }, peer);
  C.queue = []; refreshPartyHUD(); updChip(); toastW(back ? `${C.S.name}的玩家回來了！` : `有新玩家加入，操控${C.S.name}`, 3);
}

// ---------- leases ----------
function netLease(ids, to) { if (!NET.on || !ids.length) return; for (const id of ids) { chars[id].owner = to; } nsend({ t: 'lease', ids, to }); }
function netUnlease(list) { if (!NET.on || !list.length) return; for (const u of list) applyUnlease(u); nsend({ t: 'unl', l: list }); }
function applyUnlease(u) {
  const C = chars[u.id]; C.owner = C.baseOwner;
  if (u.x !== undefined && C.owner === NET.me) {
    C.pos.set(u.x, u.y, u.z); C.vel.set(0, 0, 0); C.grounded = false; C.climbing = false; C.mantle = null; C.queue = []; C.stk = false; C.carried = false; if (C.disp) C.disp.copy(C.pos);
    if (C === leader) { trail = []; C.lastTrail.copy(C.pos); }
  }
}

// ---------- per-frame sync ----------
function netUpdate(dt) {
  if (!NET.on || !NET.tx) return;
  if (STATE === 'play' || STATE === 'fail' || STATE === 'end') {
    NET.sendT -= dt; if (NET.sendT <= 0) { NET.sendT = 1 / 20; netSendChars(); }
    if (NET.host) { NET.worldT -= dt; if (NET.worldT <= 0) { NET.worldT = .1; netSendWorld(); } }
  }
  netInterp(dt); netTags(); netWatch();
}
// how the line to the host is doing: a quiet note when it's shaky, a way back in if it's gone
function netWatch() {
  const el = $('netbar'); if (!el) return;
  if (!NET.on || NET.host || !NET.started) { if (!el.hidden) el.hidden = true; return; }
  const now = performance.now(), quiet = NET.heard ? (now - NET.heard) / 1000 : 0, gone = NET.hostGone ? (now - NET.hostGone) / 1000 : 0;
  let mode = '';
  if (gone > 45) { mpHostLost(); NET.hostGone = 0; return; }
  if (gone > 0 || quiet > 12) mode = 'lost'; else if (quiet > 3) mode = 'weak';
  if (el.dataset.m !== mode) { el.dataset.m = mode; el.hidden = !mode; el.innerHTML = mode === 'lost' ? '<i></i><span>和房主的連線中斷了，正在等待重新連接…</span><button id="netRe">重新加入</button>' : '<i></i><span>網絡不穩定…</span>'; const b = $('netRe'); if (b) b.addEventListener('click', () => { location.reload(); }); }
}
function netSendChars() {
  const c = [];
  for (const C of party) if (C.owner === NET.me) c.push([C.id, +C.pos.x.toFixed(2), +C.pos.y.toFixed(2), +C.pos.z.toFixed(2), +C.yaw.toFixed(3), C.state, +(C.spd || 0).toFixed(1), (C.crouch ? 1 : 0) | (C.climbing ? 2 : 0) | (C.gliding ? 4 : 0) | (C.shoveT > 0 ? 8 : 0) | (C.pushing ? 16 : 0), Math.round(C.stamina), C.stamMax || 100, +(C.camo || 0).toFixed(2), C.on || '']);
  if (c.length) nsend({ t: 'p', lv: LEVEL, c });
}
function netRecvChars(d, from) {
  const now = performance.now();
  for (const a of d.c) { const C = chars[a[0]]; if (!C || C.owner !== from || !Number.isFinite(a[1] + a[2] + a[3])) continue; const o = C.net, gap = o ? (now - o.t) / 1000 : 0; const v = o && gap > .02 && gap < .5 ? [(a[1] - o.x) / gap, (a[2] - o.y) / gap, (a[3] - o.z) / gap] : [0, 0, 0];
    if (Math.hypot(v[0], v[2]) > 160) v[0] = v[1] = v[2] = 0;
    C.net = { x: a[1], y: a[2], z: a[3], yaw: a[4], st: a[5], spd: a[6], fl: a[7], t: now, vx: v[0], vy: v[1], vz: v[2] }; C.stamina = a[8]; C.stamMax = a[9]; C.camo = a[10]; C.on = a[11] || null; }
}
function netInterp(dt) {
  const k = 1 - Math.exp(-12 * dt), now = performance.now();
  for (const C of party) {
    if (mine(C) || !C.net) continue; const n = C.net, age = Math.min(.2, (now - (n.t || now)) / 1000), still = C.frozen || C.on;
    const tx = n.x + (still ? 0 : (n.vx || 0) * age), ty = n.y + (still ? 0 : (n.vy || 0) * age * .5), tz = n.z + (still ? 0 : (n.vz || 0) * age);
    const dx = tx - C.pos.x, dy = ty - C.pos.y, dz = tz - C.pos.z;
    if (dx * dx + dy * dy + dz * dz > 900) C.pos.set(tx, ty, tz); else { C.pos.x += dx * k; C.pos.y += dy * k; C.pos.z += dz * k; }
    C.yaw = angDamp(C.yaw, n.yaw, 14, dt); if (!C.frozen) C.state = n.st; C.spd = n.spd;
    C.crouch = !!(n.fl & 1); C.gliding = !!(n.fl & 4); if ((n.fl & 8) && !(C.shoveT > 0)) C.shoveT = .38; C.pushing = !!(n.fl & 16);
    if (C.disp) C.disp.copy(C.pos);
  }
  if (NET.client) for (const r of resizables) if (r.net) {
    const q = r.net; const kk = 1 - Math.exp(-10 * dt); const moved = Math.abs(q[0] - r.cx) + Math.abs(q[1] - r.cz) + Math.abs(q[2] - r.y0) > .005;
    r.cx += (q[0] - r.cx) * kk; r.cz += (q[1] - r.cz) * kk; r.y0 += (q[2] - r.y0) * kk; r.target = q[3]; if (moved) applyResize(r);
  }
}
function netSendWorld() {
  syncParty();
  const w = { t: 'w', lv: LEVEL, q: quest, cp, pr: PROTO, gb: gotBat, cm: cellMax };
  w.bat = batteries.map(b => b.got ? 1 : 0); w.vi = VIALS.map(v => v.got ? 1 : 0); w.cr = CRUMBS.map(c => c.got ? 1 : 0);
  w.res = []; resizables.forEach((r, i) => { if (!r.init) return; if (!r.everMoved && (r.gone || r.target !== 1 || Math.abs(r.cx - r.init[0]) + Math.abs(r.cz - r.init[1]) + Math.abs(r.y0 - r.init[2]) > .01)) r.everMoved = true;
    if (r.everMoved) w.res.push([i, +r.cx.toFixed(2), +r.cz.toFixed(2), +r.y0.toFixed(2), +r.target.toFixed(3), r.gone ? 1 : 0]); });   // (only what has ever moved: there are hundreds of things in the house)
  w.toy = IDS.map(id => { const C = chars[id]; return C.frozen ? [1, C.toyAt === 'hand' ? 2 : C.toyAt === 'box' ? 3 : 1, +(C.toyTilt || 0).toFixed(2), +(C.toyRoll || 0).toFixed(2), +(C.rescueT || 0).toFixed(2), Math.max(0, PLACES.indexOf(C.toyPlace || ''))] : 0; });
  netWorldExtra(w); proSend(w); mpSaveTick();
  {
    const F = TOY.fetch;
    w.m = [+mom.pos.x.toFixed(1), +mom.pos.z.toFixed(1), +mom.yaw.toFixed(3), +mom.aimT.x.toFixed(1), +mom.aimT.y.toFixed(1), +mom.aimT.z.toFixed(1), KM.mode, KM.pt, F ? F.mode : '', F ? +F.t.toFixed(2) : 0, F && F.from ? +F.from.y.toFixed(1) : 0, +(mom.fy || 0).toFixed(1)];
    w.k = kidNet();
    w.c = [+CAT.pos.x.toFixed(1), +CAT.pos.z.toFixed(1), +CAT.yaw.toFixed(3), CAT.mode, +(CAT.jump || 0).toFixed(2)];
    w.d = +KS.doorA.toFixed(3);
    w.core = [KS.coreGot ? 1 : 0, KS.carried ? 1 : 0, KS.carrier || '', KS.coreDrop ? [+KS.coreDrop.x.toFixed(1), +KS.coreDrop.y.toFixed(1), +KS.coreDrop.z.toFixed(1)] : 0];
    w.hx = hxState(); w.hb = brainNet();
    w.liv = [LIV.open ? 1 : 0, LIV.parts.map(p => p.got ? 1 : 0).join(''), LIV.remoteGot ? 1 : 0];
  }
  nsend(w);
}
function netRecvWorld(w) {
  syncParty();
  if (STATE === 'loading') return;
  proRecv(w);
  if (w.q !== quest) setQuest(w.q); cp = w.cp; PROTO = w.pr; gotBat = w.gb; if (w.cm !== cellMax) { cellMax = w.cm; cells = cellMax; }
  const hide = o => { o.got = true; if (o.g) o.g.visible = false; if (o.halo) o.halo.visible = false; };
  w.bat.forEach((g, i) => { if (g && batteries[i] && !batteries[i].got) hide(batteries[i]); });
  w.vi.forEach((g, i) => { if (g && VIALS[i] && !VIALS[i].got) hide(VIALS[i]); });
  w.cr.forEach((g, i) => { if (g && CRUMBS[i] && !CRUMBS[i].got) hide(CRUMBS[i]); });
  w.res.forEach(e => { const i = e[0], q = e.slice(1), r = resizables[i]; if (!r) return; r.net = q; if (q[4] && !r.gone) { r.gone = true; r.mesh.visible = false; r.c.y0 = -999; r.c.y1 = -998; if (r === COOKIE) COOKIE.eaten = true; } });
  let changed = false;
  w.toy.forEach((t, i) => {
    const C = chars[IDS[i]];
    if (t) { if (!C.frozen) { C.frozen = true; toyLook(C, true); changed = true; if (C === leader) { SND.heart(1); toyBurst(V3(C.pos.x, C.pos.y + C.h * .5, C.pos.z)); meter = 0; } } const at = ['', 'floor', 'hand', 'box'][t[1]]; if (at !== C.toyAt) { C.toyAt = at; changed = true; } C.toyTilt = t[2]; C.toyRoll = t[3]; C.rescueT = t[4]; C.toyPlace = PLACES[t[5] || 0] || null; }
    else if (C.frozen) { C.frozen = false; C.toyAt = null; toyLook(C, false); C.root.rotation.set(0, C.yaw, 0); changed = true; }
  });
  if (changed) refreshPartyHUD();
  if (w.m) NET.npc = w; netRecvExtra(w);
  if (w.hx) hxRecvState(w.hx); if (w.hb) brainNetRecv(w.hb);
  if (w.liv) { if (w.liv[0] && !LIV.open) { LIV.open = true; SND.creak(); } [...w.liv[1]].forEach((g, i) => { const p = LIV.parts[i]; if (g === '1' && p && !p.got) { p.got = true; p.g.visible = false; p.halo.visible = false; } }); LIV.partsGot = LIV.parts.filter(p => p.got).length; LIV.remoteGot = !!w.liv[2]; }
  if (w.core) { KS.coreGot = !!w.core[0]; KS.carried = !!w.core[1]; KS.carrier = w.core[2] || null; KS.coreDrop = w.core[3] ? V3(...w.core[3]) : null; }
}
// the family and the cat on a client: follow the host's snapshot, animate locally
function netNPC(dt) {
  const w = NET.npc; if (!w || !w.m) return; netNPCExtra(dt);
  const m = w.m, P = mom.pos, ox = P.x, oz = P.z;
  const dx = m[0] - P.x, dz = m[1] - P.z; if (dx * dx + dz * dz > 3600) { P.x = m[0]; P.z = m[1]; } else { const k = 1 - Math.exp(-8 * dt); P.x += dx * k; P.z += dz * k; }
  mom.yaw = angDamp(mom.yaw, m[2], 8, dt); mom.aimT.set(m[3], m[4], m[5]); KM.mode = m[6]; KM.pt = m[7]; if (m[11] !== undefined) mom.fy = m[11];
  TOY.fetch = m[8] ? { mode: m[8], t: m[9], from: { y: m[10] }, C: null } : null;
  KS.doorA = damp(KS.doorA, w.d, 10, dt); fridgeDoor();
  momAnimK(dt, Math.hypot(P.x - ox, P.z - oz));
  updKid(dt); updCat(dt);
}
function fridgeDoor() {
  KS.door.rotation.y = KS.doorA; const open = clamp(KS.doorA / 1.2, 0, 1); KS.fridgeLight.intensity = 2600 * open; KS.fridgeL.on = open > .2; KS.fridgeBeamRec.k = .045 * open; KS.fridgeBeam.material.uniforms.uK.value = KS.fridgeBeamRec.k;
  if (KS.doorA > .35) { KS.doorCol.y0 = -1000; KS.doorCol.y1 = -999; } else { KS.doorCol.y0 = 6; KS.doorCol.y1 = 184; }
}
// name tags above teammates
const TAGS = {};
function netTags() {
  for (const id of IDS) {
    let el = TAGS[id]; const C = chars[id]; const show = NET.on && STATE !== 'title' && NET.slots[id] && NET.slots[id] !== NET.me && party.includes(C) && !$('hud').classList.contains('off');
    if (!el) { if (!show) continue; el = TAGS[id] = document.createElement('div'); el.className = 'ptag'; $('hud').appendChild(el); }
    if (!show) { el.classList.remove('on'); continue; }
    const p = V3(C.pos.x, C.pos.y + C.h * 1.35, C.pos.z); const on = project(p, el, 0, 0) && camera.position.distanceTo(p) < 260;
    el.textContent = `${playerLabel(id)} · ${C.S.name}${C.frozen ? '（玩具）' : ''}`; el.style.color = C.S.col; el.classList.toggle('on', on);
  }
}

// ---------- messages ----------
function netMsg(d, from) {
  switch (d.t) {
    case 'hi': if (NET.host) { if (d.tok) NET.tokOf[from] = d.tok; NET.names = NET.names || {}; NET.names[from] = cleanName(d.n); if (NET.started && hostRejoin(from)) break; mpBroadcastLobby(from); } break;
    case 'lobby': if (NET.host) break; NET.hostId = d.host; NET.slots = d.slots; NET.order = d.order || []; NET.names = d.names || {}; clearTimeout(NET.joinTimer); NET.remoteStarted = !!d.started; mpRender(); syncParty(); break;
    case 'pick': if (NET.host) { if (!NET.started) hostPick(from, d.id); else hostAssignLate(from, d.id, false); } break;
    case 'slot': if (NET.on && !NET.host) { NET.slots[d.id] = d.peer; NET.order = d.order; const C = chars[d.id]; C.baseOwner = d.peer; C.owner = d.own[d.id]; refreshPartyHUD(); updChip(); } break;
    case 'late': if (!NET.host && !NET.on) { NET.slots = d.slots; NET.order = d.order; NET.names = d.names || NET.names || {}; NET.late = d; netBegin(); loadLevel(d.lv); } break;
    case 'start': if (!NET.host && !NET.started) { NET.slots = d.slots; NET.order = d.order || NET.order; NET.names = d.names || NET.names || {}; NET.resume = d.res || null; netBegin(); } break;
    case 'name': if (NET.host) hostName(from, d.n); break;
    case 'names': if (!NET.host) { NET.names = d.names || {}; refreshPartyHUD(); } break;
    case 'p': if (NET.on) netRecvChars(d, from); break;
    case 'w': if (NET.on && !NET.host) netRecvWorld(d); break;
    case 'lease': for (const id of d.ids) chars[id].owner = d.to; break;
    case 'unl': for (const u of d.l) applyUnlease(u); break;
    case 'lvl': if (NET.on && !NET.host && !(d.n === LEVEL && STATE === 'loading')) loadLevel(d.n); break;
    case 'end': if (NET.on && !NET.host && STATE === 'play') { if (d.e) END_TXT = d.e; STATE = 'end'; endT = 0; } break;
    case 'ban': chapterBanner(d.a, d.b); break;
    case 'xbtn': if (NET.host) pressButton(null); break;
    case 'drg': if (NET.host) { const r = resizables[d.i]; if (r && !r.gone) dragTo(r, d.x, d.z); } break;
    case 'fail': if (NET.on && !NET.host) { cp = d.cp; fail(); } break;
    case 'say': say(d.n, d.x, d.c, d.d); break;
    case 'vc': vcSignal(d, from); break;
    case 'bsay': brainSayShow(d.n, d.x, d.c, d.d, d.p[0], d.p[1]); break;
    case 'hx': if (NET.host) { const o = HX.list[d.i]; if (o) hxSet(o, !o.on, d.by); } break;
    case 'hxs': if (!NET.host) hxRecv(d); break;
    case 'hxw': { const C = chars[d.id]; if (C && mine(C)) hxFlushChar(C); } break;
    case 'vcs': VC.peerMic[from] = d.s; break;
    case 'chat': chatAdd(from, d.x); break;
    case 'emo': emoRecv(d); break;
    case 'toast': toast(d.x, d.d); break;
    case 'ring': noiseRing(V3(...d.p)); if (d.v) { SND.clang(d.v); for (let i = 0; i < 16; i++) emit(V3(d.p[0], d.p[1] + 1, d.p[2]), V3(R(-30, 30), R(10, 40), R(-30, 30)), new THREE.Color(.5, .45, .4), R(.3, .8), R(.4, .9), 300, 1); } break;
    case 'knock': if (NET.my === d.id && mine(leader)) knock(leader, V3(d.x, leader.pos.y, d.z), d.m); break;
    case 'rev': netApplyRevive(d); break;
    case 'pull': { const C = chars[d.id]; if (C && mine(C) && !C.frozen) startPull(C, V3(...d.hang), V3(...d.to)); break; }
    case 'stam': { const C = chars[d.id]; if (C && mine(C)) { C.stamMax = d.max; C.stamina = Math.min(C.stamMax, C.stamina + (d.st || 0)); refreshPartyHUD(); } break; }
    case 'scout': scoutCones(); SCOUT.t = d.d; break;
    // requests that only the host acts on
    case 'frz': if (NET.host) { const C = chars[d.id]; if (C && d.p && !C.frozen) { C.pos.set(...d.p); C.yaw = d.y || C.yaw; C.net = null; } hostFreeze(C, d.who); } break;
    case 'seen': if (NET.host) hostSeen(V3(...d.p), d.who); break;
    case 'gun': if (NET.host) hostGun(d.i, d.g, from); break;
    case 'shv': if (NET.host) { const r = resizables[d.i]; if (r && !r.gone) { shoveRes(r, d.vx, d.vz); SND.push(); } } break;
    case 'peb': launchPebble(V3(...d.a), V3(...d.b), d.d); break;
    case 'pch': pouchRecv(d); break;
    case 'swr': if (NET.host) hostSwitch(d.i, d.id); break;
    case 'swo': if (!NET.host) swOn(d.i, d.d); break;
    case 'get': if (NET.host) hostGet(d); break;
    case 'proto': if (NET.host) hostProto(d.id, from); break;
  }
}

// ---------- host-side game rules (also used directly in single player) ----------
function netGet(k, i = 0) {
  if (!NET.on || NET.host) { hostGet({ k, i, id: leader.id }); return; }
  const key = k + i; if (NET.pend[key] && T - NET.pend[key] < 1.2) return; NET.pend[key] = T; nsend({ t: 'get', k, i, id: leader.id }, NET.hostId);
}
function stamGive(C, max, st) {
  if (mine(C)) { C.stamMax = max; C.stamina = Math.min(max, C.stamina + st); refreshPartyHUD(); }
  else nsend({ t: 'stam', id: C.id, max, st }, C.owner);
}
function hostGet(d) {
  const C = chars[d.id] || leader;
  if (d.k === 'bat') {
    const b = batteries[d.i]; if (!b || b.got) return; b.got = true; b.g.visible = false; b.halo.visible = false; gotBat++; cellMax++; cells = cellMax; SND.pick();
    toastW(`${NET.on ? C.S.name : ''}找到鈕扣電池！尺寸槍能量上限 +1（${batteries.filter(q => q.got).length}/${batteries.length}）`);
    if (batteries.every(q => q.got)) unlockKey('bat6');
    for (let i = 0; i < 30; i++) emit(V3(b.x, b.y + 1.4, b.z), V3(R(-10, 10), R(4, 20), R(-10, 10)), new THREE.Color(.5, 2, 1.9), R(.15, .35), R(.4, 1), 30, 2);
  } else if (d.k === 'vial') {
    const v = VIALS[d.i]; if (!v || v.got) return; v.got = true; v.g.visible = false; v.halo.visible = false; PROTO++; SND.pick(); toyBurst(V3(v.x, v.y + 1.6, v.z));
    toastW(`${NET.on ? C.S.name : ''}拾到一支 Prototype！（共 ${PROTO} 支）隊友變成玩具時，按 ${TOUCH ? '「復活」' : 'R'} 就能救回來`, 3.6);
  } else if (d.k === 'crumb') {
    const c = CRUMBS[d.i]; const cap = C.stamMax || 100; if (!c || c.got || cap >= 100) return;
    c.got = true; c.g.visible = false; c.halo.visible = false; const nm = Math.min(100, cap + c.v); stamGive(C, nm, 30); SND.pick();
    toastW(`${C.S.name}吃了餅乾碎，體力上限回到 ${nm}%`, 3);
  } else if (d.k === 'cookie') {
    const r = COOKIE; if (!r || r.eaten) return; const team = r.s >= 1.9; const who = team ? party.filter(q => !q.frozen) : [C];
    if (!who.some(q => (q.stamMax || 100) < 100)) return;
    r.eaten = true; r.gone = true; r.mesh.visible = false; r.c.y0 = -999; r.c.y1 = -998;
    for (const q of who) stamGive(q, Math.min(100, (q.stamMax || 100) + (team ? 25 : 20)), 40);
    SND.pick(); for (let k = 0; k < 24; k++) emit(V3(r.cx, r.y0 + 1, r.cz), V3(R(-12, 12), R(4, 16), R(-12, 12)), new THREE.Color(.8, .55, .28), R(.2, .5), R(.4, .8), 200, 1);
    toastW(team ? '巨型曲奇！全隊一起吃，體力上限 +25%' : `${C.S.name}吃了曲奇，體力上限 +20%`, 3.4);
    if (team) sayW(C.S.name, '放大曲奇真是天才！', C.S.col, 2.2);
  } else if (d.k === 'core') {
    if (KS.coreGot) return; KS.coreGot = true; KS.carried = true; KS.carrier = NET.on ? C.id : null; PROTO++; SND.pick(); setQuest(2);
    toastW(`拿到核心了！旁邊還有一支 Prototype（共 ${PROTO} 支）。核心在發光——帶着它更容易被看見`, 4.2);
    sayW(C.S.name, C.id === 'dad' ? '找到了……光比之前弱。我們得快點。' : '核心找到了！光比之前弱，快點！', C.S.col, 3);
  } else if (d.k === 'part' || d.k === 'remote') { livingGet(d, C);
  } else if (d.k === 'cdrop') {
    if (!KS.coreDrop || KS.carried) return; KS.carried = true; KS.carrier = NET.on ? C.id : null; KS.coreDrop = null; SND.pick(); toastW(`${NET.on ? C.S.name : ''}重新拿起了核心`);
  }
}
function hostSeen(tp, who) {
  if (who === 'agent' || who === 'cam') { garageSeen(tp, who); return; } if (who === 'dog' || who === 'old') { yardSeen(tp, who); return; } if (who === 'walker' || who === 'wdog') { roadSeen(tp, who); return; }
  if (who === 'mom' || who === 'kid') brainGlimpse(tp);
  if (who === 'mom' && KM.mode !== 'sus' && KM.mode !== 'fopen' && !TOY.fetch) { KM.prev = KM.mode; KM.mode = 'sus'; KM.susP = tp; KM.trackT = 2.2; if (!KS.said.sus) { KS.said.sus = 1; sayW('太太', '嗯？……什麼東西？', '#f4bb72', 2.2); } }
  if (who === 'mom' && KM.mode === 'sus') { KM.susP = tp; KM.trackT = 2.2; }
  if (who === 'kid') { KID.mode = 'sus'; KID.t = 2.2; KID.look.copy(tp); if (!KS.said.kidsus) { KS.said.kidsus = 1; sayW('女兒', '媽媽……那邊好像有東西在動。', '#e8a0c0', 2.8); } }
}
function netSeen(tp, who) { if (NET.client) { if (T - NET.seenT > .4) { NET.seenT = T; nsend({ t: 'seen', p: [tp.x, tp.y, tp.z], who }, NET.hostId); } } else hostSeen(tp, who); }
function hostGun(i, grow, from) {
  const r = resizables[i]; if (!r || r.gone) return; const nt = clamp(r.target * (grow ? 2 : .5), r.min, r.max); if (Math.abs(nt - r.target) < 1e-3) return;
  if (grow && !roomFor(r, nt)) { nsend({ t: 'toast', x: `空間不夠，「${r.name}」放不大` }, from); return; }
  r.target = nt; r.pulse = 1; sizeNotice(r, grow);
}
function hostFreeze(C, who) {
  if (!C || C.frozen) return; nlog('被發現：' + C.S.name + (who ? '（' + who + '）' : ''));
  C.on = null; C.hop = null;
  const holder = party.find(q => q.carry === C); if (holder && mine(holder)) sqDrop(holder);
  if (LEVEL === 'kitchen' && KS.carried && (KS.carrier === C.id || !NET.on)) { KS.carried = false; KS.carrier = null; KS.coreDrop = coreGround(C.pos); }
  netLease([C.id], NET.hostId);
  C.frozen = true; C.toyAt = 'floor'; C.climbing = false; C.mantle = null; C.vel.set(0, 0, 0); C.tumble = 0; C.toyVy = 0; C.crouch = false; C.toyTilt = 0; C.toyRoll = 0; C.stk = false; C.carried = false;
  toyLook(C, true); toyBurst(V3(C.pos.x, C.pos.y + C.h * .5, C.pos.z)); SND.heart(1); tone(1800, 600, .8, .08, 'triangle');
  toySay(who, sayW);
  const inK = zoneAt(C.pos, 4); if (!inK || inK.id === 'kitchen') { if (KM.mode === 'sus') KM.mode = 'goto'; if (toyReachable(C)) TOY.fetchQ.push(C); } else takeQueue(C);
  toastW(`${C.S.name}被看見，變成了玩具！`, 3);
  refreshPartyHUD();
  if (playerChars().every(q => q.frozen)) { fail(); nsend({ t: 'fail', cp }); }
}
function hostProto(id, from) {
  const by = chars[id]; if (!PROTO) { const x = '沒有 Prototype——要先找到 Prototype 藥水'; if (from) nsend({ t: 'toast', x }, from); else toast(x); return; }
  const fz = party.filter(C => C.frozen); if (!fz.length) { nsend({ t: 'toast', x: '隊友都好好的，Prototype 留着之後用' }, from); return; }
  const tg = protoTarget(by); if (!tg) { const n = frozenNear(by); const x = `要走到${n ? n.S.name : '隊友'}旁邊、面向他，才可以用 Prototype`; if (from) nsend({ t: 'toast', x }, from); else toast(x); return; }
  PROTO--; toyRevive(tg, true, by);
}
function netApplyRevive(d) {
  const C = chars[d.id]; C.frozen = false; C.toyAt = null; toyLook(C, false); C.root.rotation.set(0, C.yaw, 0); C.owner = C.baseOwner;
  if (C.owner === NET.me) { C.pos.set(d.x, d.y, d.z); C.vel.set(0, 0, 0); C.grounded = false; C.queue = []; C.stamMax = d.sm; C.stamina = Math.min(C.stamina, C.stamMax); if (C.disp) C.disp.copy(C.pos); if (C === leader) { trail = []; C.lastTrail.copy(C.pos); TOY.grace = 1.5; meter = 0; } }
  toyBurst(V3(C.pos.x, C.pos.y + C.h * .5, C.pos.z)); SND.pick(); refreshPartyHUD();
}
// ---------- UI wiring ----------
$('goMP').addEventListener('click', () => { audioInit(); mpOpen(''); });
$('mpCreate').addEventListener('click', () => { let c = ''; for (let i = 0; i < 4; i++) c += CODE_CH[Math.floor(Math.random() * CODE_CH.length)]; mpConnect(c, true); });
$('mpJoin').addEventListener('click', () => { const c = $('mpCode').value.trim().toUpperCase(); if (c.length < 4) { $('mpCode').focus(); return; } mpConnect(c, false); });
$('mpCode').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') $('mpJoin').click(); });
$('mpBack').addEventListener('click', () => { $('mp').hidden = true; $('start').hidden = false; });
$('mpStart').addEventListener('click', mpStartGame);
$('mpLeave').addEventListener('click', mpLeave);
$('pauseLeave').addEventListener('click', mpLeave);
$('pauseCopy').addEventListener('click', () => { const l = mpLink(); (navigator.clipboard ? navigator.clipboard.writeText(l) : Promise.reject()).then(() => { $('pauseCopy').textContent = '已複製！'; setTimeout(() => $('pauseCopy').textContent = '複製邀請連結', 1600); }).catch(() => prompt('複製這條連結傳給朋友', l)); });
$('mpCopy').addEventListener('click', () => { const l = mpLink(); (navigator.clipboard ? navigator.clipboard.writeText(l) : Promise.reject()).then(() => { $('mpCopy').textContent = '已複製！'; setTimeout(() => $('mpCopy').textContent = '複製邀請連結', 1600); }).catch(() => prompt('複製這條連結傳給朋友', l)); });
// opened from an invite link: go straight to the join screen
(() => { const m = location.search.match(/[?&]room=([A-Za-z0-9]{4})/); if (m) NET.autoJoin = m[1].toUpperCase(); })();
