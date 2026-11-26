// =====================================================================
//  VOICE + TEXT CHAT (online) — proximity voice, like PEAK
//  · a friend sounds louder the closer their character is to yours, and comes from where they stand
//  · behind a wall or in another room their voice is muffled; across the house it fades away
//  · you can still talk while you're a toy (call for help!)
//  · mic: open (default) · push-to-talk (hold V) · off — pause menu; M mutes and unmutes
//  · in the lobby everyone hears everyone at full volume
//  · Enter to type: a bubble over your character and a short log on the left
//  Audio is peer-to-peer: one RTCPeerConnection per teammate, negotiated over the game's own
//  message channel (so it also works between two tabs with ?net=local).
// =====================================================================
const VC = { stream: null, track: null, pcs: {}, rem: {}, bus: null, an: null, abuf: null, lvl: {}, asking: false, denied: false, muted: false, chat: false, chatShut: 0, log: [], bub: {}, lastSend: 0, peerMic: {}, touchPTT: false, sentMic: '' };
const VC_ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: 'stun:stun.cloudflare.com:3478' }];
const VC_NEAR = 80, VC_FAR = 560;   // full volume within ~16 body lengths, silent across the kitchen
const MIC_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>';
const MICX_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 11h-2a5 5 0 0 1-.4 1.97l1.47 1.47A6.96 6.96 0 0 0 19 11zM15 11V5a3 3 0 0 0-5.92-.68L15 10.24V11zM4.27 3 3 4.27l6 6V11a3 3 0 0 0 4.08 2.8l1.53 1.53A5 5 0 0 1 7 11H5a7 7 0 0 0 6 6.92V21h2v-3.08a6.9 6.9 0 0 0 2.92-1.07L19.73 21 21 19.73 4.27 3z"/></svg>';
function vcMode() { return SET.mic || 'open'; }
function vcLevelOf(buf) { let s = 0; for (let i = 0; i < buf.length; i += 2) s += buf[i] * buf[i]; return clamp((Math.sqrt(s / (buf.length / 2)) - .008) * 22, 0, 1); }

// ---------- the microphone ----------
async function vcMicStart() {
  if (VC.stream || VC.asking || vcMode() === 'off') { vcUI(); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { VC.denied = true; vcUI(); return; }
  VC.asking = true; vcUI();
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    VC.stream = s; VC.track = s.getAudioTracks()[0]; VC.denied = false;
    audioInit(); vcBus(); const C = AU.ctx;
    if (C) { const src = C.createMediaStreamSource(s); VC.an = C.createAnalyser(); VC.an.fftSize = 512; VC.abuf = new Float32Array(512); src.connect(VC.an); }
    for (const id in VC.pcs) vcAttach(VC.pcs[id]);
  } catch (e) { VC.denied = true; toast('沒有咪的權限——仍然可以聽到隊友，或者按 Enter 打字', 3.4); }
  VC.asking = false; vcUI();
}
function vcMicStop() { if (VC.stream) for (const t of VC.stream.getTracks()) t.stop(); VC.stream = null; VC.track = null; VC.an = null; for (const id in VC.pcs) vcAttach(VC.pcs[id]); vcUI(); }
function vcAttach(P) { if (P.tr && P.tr.sender) P.tr.sender.replaceTrack(VC.track || null).catch(() => { }); }
function vcBus() { const C = AU.ctx; if (!C || VC.bus) return; VC.bus = C.createGain(); VC.bus.gain.value = SET.voice ?? 1; VC.bus.connect(C.destination); }
function vcSetMode(m) { SET.mic = m; saveSet(); VC.muted = false; if (m === 'off') vcMicStop(); else vcMicStart(); vcUI(); }
function vcToggleMute() { if (vcMode() === 'off' || !VC.stream) { if (vcMode() === 'off') vcSetMode('open'); else vcMicStart(); return; } VC.muted = !VC.muted; vcUI(); toast(VC.muted ? '咪已靜音（M 解除）' : '咪已打開', 1.4); }

// ---------- one connection per teammate ----------
function vcPeer(id, g = 0) {
  if (!id || !NET.me || id === NET.me || typeof RTCPeerConnection === 'undefined') return null;
  if (VC.pcs[id]) return VC.pcs[id];
  let pc; try { pc = new RTCPeerConnection({ iceServers: LOCALNET ? [] : VC_ICE }); } catch (e) { return null; }
  const P = VC.pcs[id] = { id, pc, tr: null, ice: [], g, offerer: NET.me < id, offT: 0 };
  pc.onicecandidate = e => { if (e.candidate) nsend({ t: 'vc', k: 'ice', g: P.g, c: e.candidate.toJSON() }, id); };
  pc.ontrack = e => vcRemote(id, e.streams && e.streams[0] ? e.streams[0] : new MediaStream([e.track]));
  pc.onconnectionstatechange = () => {
    if (pc.connectionState !== 'failed' || VC.pcs[id] !== P) return;
    vcClose(id); if (P.offerer) setTimeout(() => { if (NET.peers.includes(id) && !VC.pcs[id]) vcPeer(id, P.g + 1); }, 1500);
  };
  if (P.offerer) { P.tr = pc.addTransceiver('audio', { direction: 'sendrecv' }); vcAttach(P); vcOffer(P); }
  return P;
}
async function vcOffer(P) {
  try { await P.pc.setLocalDescription(await P.pc.createOffer()); nsend({ t: 'vc', k: 'sdp', g: P.g, d: P.pc.localDescription.toJSON() }, P.id); } catch (e) { console.warn('voice offer', e); }
  clearTimeout(P.offT); P.offT = setTimeout(() => { if (VC.pcs[P.id] === P && !P.pc.remoteDescription) vcOffer(P); }, 6000);   // no answer yet: ask again
}
async function vcSignal(d, from) {
  try {
    if (d.k === 'sdp' && d.d && d.d.type === 'offer') {
      let P = VC.pcs[from]; if (P && P.offerer) return;
      if (P && P.g !== d.g) { vcClose(from); P = null; }   // they restarted the connection
      P = P || vcPeer(from, d.g); if (!P) return;
      await P.pc.setRemoteDescription(d.d);
      P.tr = P.pc.getTransceivers()[0]; if (P.tr) { P.tr.direction = 'sendrecv'; vcAttach(P); }
      await P.pc.setLocalDescription(await P.pc.createAnswer());
      nsend({ t: 'vc', k: 'sdp', g: P.g, d: P.pc.localDescription.toJSON() }, from);
      for (const c of P.ice.splice(0)) P.pc.addIceCandidate(c).catch(() => { });
    } else if (d.k === 'sdp') {
      const P = VC.pcs[from]; if (!P || P.g !== d.g || P.pc.signalingState !== 'have-local-offer') return;
      await P.pc.setRemoteDescription(d.d); clearTimeout(P.offT);
      for (const c of P.ice.splice(0)) P.pc.addIceCandidate(c).catch(() => { });
    } else if (d.k === 'ice') {
      const P = VC.pcs[from]; if (!P || P.g !== d.g) return;
      if (P.pc.remoteDescription) P.pc.addIceCandidate(d.c).catch(() => { }); else P.ice.push(d.c);
    }
  } catch (e) { console.warn('voice', e); }
}
function vcRemote(id, stream) {
  audioInit(); vcBus(); const C = AU.ctx; if (!C) return; vcDropRemote(id);
  // Chrome only lets WebRTC audio into Web Audio while a media element is playing it (muted here)
  const el = new Audio(); el.muted = true; el.srcObject = stream; el.play().catch(() => { });
  const src = C.createMediaStreamSource(stream), an = C.createAnalyser(); an.fftSize = 512;
  const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 16000; lp.Q.value = .4;
  const g = C.createGain(); g.gain.value = 0;
  const pan = C.createPanner(); pan.panningModel = 'HRTF'; pan.distanceModel = 'inverse'; pan.rolloffFactor = 0;
  src.connect(an); src.connect(lp); lp.connect(g); g.connect(pan); pan.connect(VC.bus);
  VC.rem[id] = { el, src, an, lp, g, pan, buf: new Float32Array(512), lvl: 0, wall: 0, wallK: 0, wt: 0 };
}
function vcDropRemote(id) { const R = VC.rem[id]; if (!R) return; try { R.src.disconnect(); R.pan.disconnect(); R.el.pause(); R.el.srcObject = null; } catch (e) { } delete VC.rem[id]; }
function vcClose(id) { const P = VC.pcs[id]; if (P) { clearTimeout(P.offT); try { P.pc.close(); } catch (e) { } delete VC.pcs[id]; } vcDropRemote(id); delete VC.peerMic[id]; }
function vcCloseAll() { for (const id in VC.pcs) vcClose(id); vcMicStop(); }
function vcJoined(id) { vcPeer(id); vcSendMic(id); }
function vcSelf() { for (const p of NET.peers) vcPeer(p); vcSendMic(); }
function vcSendMic(to) { const s = vcMicState(); if (!to && s === VC.sentMic) return; if (!to) VC.sentMic = s; nsend({ t: 'vcs', s }, to); }
function vcMicState() { return !VC.stream ? 'none' : VC.muted ? 'mute' : vcMode(); }

// ---------- where each voice comes from ----------
const _vcA = V3(), _vcB = V3(), _vcD = V3(), _vcE = V3();
function setPos3(p, v) { if (p.positionX) { p.positionX.value = v.x; p.positionY.value = v.y; p.positionZ.value = v.z; } else p.setPosition(v.x, v.y, v.z); }
function vcFrame(dt) {
  const mode = vcMode(), ptt = !!keys.KeyV || VC.touchPTT;
  const live = !!VC.track && !VC.muted && (mode === 'open' || (mode === 'ptt' && ptt));
  if (VC.track && VC.track.enabled !== live) VC.track.enabled = live;
  const myC = NET.my || null;
  if (VC.an && live) { VC.an.getFloatTimeDomainData(VC.abuf); const l = vcLevelOf(VC.abuf); VC.lvl.me = l > (VC.lvl.me || 0) ? l : (VC.lvl.me || 0) * Math.exp(-dt * 6); } else VC.lvl.me = (VC.lvl.me || 0) * Math.exp(-dt * 8);
  if (myC) VC.lvl[myC] = VC.lvl.me;
  if (VC.bus && AU.ctx) {
    const C = AU.ctx, now = C.currentTime, L = C.listener; camera.getWorldDirection(_vcD);
    if (L.positionX) { L.positionX.value = camera.position.x; L.positionY.value = camera.position.y; L.positionZ.value = camera.position.z; L.forwardX.value = _vcD.x; L.forwardY.value = _vcD.y; L.forwardZ.value = _vcD.z; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0; }
    else { L.setPosition(camera.position.x, camera.position.y, camera.position.z); L.setOrientation(_vcD.x, _vcD.y, _vcD.z, 0, 1, 0); }
    const inWorld = NET.on && STATE !== 'title' && STATE !== 'loading';
    const me = myC && chars[myC], meHead = me ? _vcA.set(me.pos.x, me.pos.y + me.h * .85, me.pos.z) : _vcA.copy(camera.position);
    for (const id in VC.rem) {
      const R = VC.rem[id]; R.an.getFloatTimeDomainData(R.buf); const l = vcLevelOf(R.buf); R.lvl = l > R.lvl ? l : R.lvl * Math.exp(-dt * 6);
      const cid = IDS.find(k => NET.slots[k] === id), S = cid && chars[cid]; if (cid) VC.lvl[cid] = R.lvl;
      let vol = 1, cut = 16000;
      if (inWorld && S && me && party.includes(S)) {
        const hp = _vcB.set(S.pos.x, S.pos.y + S.h * .85, S.pos.z); setPos3(R.pan, hp);
        const d = hp.distanceTo(meHead), k = clamp((d - VC_NEAR) / (VC_FAR - VC_NEAR), 0, 1);
        vol = Math.pow(1 - k, 1.7); cut = lerp(16000, 2400, k);
        if ((R.wt -= dt) <= 0) {   // a wall in between, or a different room: muffled
          R.wt = .2; const dl = d; _vcE.copy(hp).sub(meHead).divideScalar(dl || 1);
          const other = zoneAt(meHead) !== zoneAt(hp);
          R.wall = other ? 1 : dl > 6 && (rayBlocked(meHead, _vcE, dl - 3) || rayBlocked(hp, _vcE.clone().negate(), dl - 3)) ? .8 : 0;
        }
        R.wallK = damp(R.wallK, R.wall, 5, dt); vol *= 1 - .5 * R.wallK; cut = Math.min(cut, lerp(cut, 700, R.wallK));
      } else setPos3(R.pan, _vcB.copy(camera.position).addScaledVector(_vcD, .5));   // lobby / menus: right in front of you
      R.g.gain.setTargetAtTime(vol, now, .06); R.lp.frequency.setTargetAtTime(cut, now, .08);
    }
    VC.bus.gain.setTargetAtTime((SET.voice ?? 1) * (PAUSED ? .75 : 1), now, .1);
  }
  vcSendMic(); vcHUD(dt);
}

// ---------- text chat ----------
function chatOpen() {
  if (!NET.on || VC.chat || PAUSED || !(STATE === 'play' || STATE === 'frozen' || STATE === 'intro' || STATE === 'end')) return;
  VC.chat = true; for (const k in keys) keys[k] = false;
  const i = $('chatIn'); i.hidden = false; i.value = ''; $('chat').classList.add('open'); setTimeout(() => i.focus(), 0);
}
function chatClose(send) {
  const i = $('chatIn');
  if (send) { const x = i.value.replace(/\s+/g, ' ').trim().slice(0, 80); if (x && performance.now() - VC.lastSend > 400) { VC.lastSend = performance.now(); nsend({ t: 'chat', x }); chatAdd(NET.me, x); } }
  i.value = ''; i.blur(); i.hidden = true; VC.chat = false; VC.chatShut = performance.now(); $('chat').classList.remove('open');
}
function chatAdd(peer, x) {
  x = String(x || '').slice(0, 80); if (!x) return;
  const cid = IDS.find(k => NET.slots[k] === peer), S = cid && chars[cid];
  const el = document.createElement('div'); el.className = 'cl';
  const b = document.createElement('b'); b.textContent = S ? `${playerLabel(cid)} · ${S.S.name}` : '玩家'; b.style.color = S ? S.S.col : '';
  const s = document.createElement('span'); s.textContent = x; el.append(b, s); $('chatLog').appendChild(el);
  VC.log.push({ el, t: 0 }); while (VC.log.length > 6) VC.log.shift().el.remove();
  if (cid) VC.bub[cid] = { x, t: 0 };
  if (peer !== NET.me) { tone(1046, 1568, .09, .025, 'sine'); tone(1568, 1568, .12, .018, 'sine', .07); }
}
$('chatIn').addEventListener('keydown', e => {
  e.stopPropagation(); if (e.isComposing || e.keyCode === 229) return;   // Chinese input: Enter picks the characters first
  if (e.key === 'Enter') { e.preventDefault(); chatClose(true); } else if (e.key === 'Escape') { e.preventDefault(); chatClose(false); }
});
$('chatIn').addEventListener('keyup', e => e.stopPropagation());
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (e.code === 'Enter' || e.code === 'NumpadEnter') { if (NET.on && !VC.chat) { e.preventDefault(); chatOpen(); } }
  else if (e.code === 'KeyM' && NET.code && !e.repeat) vcToggleMute();
});

// ---------- what's on screen ----------
function vcUI() {
  const st = VC.asking ? 'ask' : vcMode() === 'off' ? 'off' : !VC.stream ? 'none' : VC.muted ? 'mute' : vcMode();
  const txt = { ask: '等待咪權限…', off: '咪已關 · Enter 打字', none: '冇咪 · Enter 打字', mute: '已靜音 · M', open: '開咪 · M 靜音', ptt: '按住 V 講' }[st];
  const html = `${st === 'mute' || st === 'off' || st === 'none' ? MICX_SVG : MIC_SVG}<em>${txt}</em>`;
  for (const el of document.querySelectorAll('.vcmic')) { el.className = 'vcmic ' + st; el.innerHTML = html; }
  const lob = $('mpVc'); if (lob) lob.querySelector('.vct').textContent = { ask: '等待咪權限…（瀏覽器會問你）', off: '咪已關，隊友聽唔到你', none: VC.denied ? '冇咪權限：聽得到隊友，但佢哋聽唔到你' : '冇咪', mute: '已靜音', open: '咪已開：講嘢時下面條線會郁', ptt: '按住 V 講嘢' }[st];
  const tb = $('tbMic'); if (tb) { tb.classList.toggle('dn', st === 'mute' || st === 'off' || st === 'none'); tbLabel('tbMic', st === 'ptt' ? '按住講' : st === 'open' ? '咪' : '靜音', st === 'open' || st === 'ptt' ? TB_MIC : TB_MICOFF); }
  document.querySelectorAll('#micSel button').forEach(b => b.classList.toggle('on', b.dataset.m === vcMode()));
  for (const el of document.querySelectorAll('.vconly')) el.hidden = !NET.code;
}
function vcHUD(dt) {
  // who's talking: a ring on their portrait, sound bars on their name tag, the lobby card
  for (const id of IDS) {
    const t = (VC.lvl[id] || 0) > .1; const pm = $('pm-' + id);
    if (pm) { pm.classList.toggle('talk', t && NET.on); const peer = NET.slots[id]; pm.classList.toggle('nomic', NET.on && !!peer && peer !== NET.me && (VC.peerMic[peer] === 'none' || VC.peerMic[peer] === 'off' || VC.peerMic[peer] === 'mute')); }
    const tag = TAGS[id]; if (tag) tag.classList.toggle('talk', t);
  }
  if (!NET.on && NET.code) for (const b of document.querySelectorAll('.mps[data-id]')) b.classList.toggle('talk', (VC.lvl[b.dataset.id] || 0) > .1);
  const mic = document.querySelector('#mpChip .vcmic'); if (mic) mic.style.setProperty('--lv', (VC.lvl.me || 0).toFixed(2));
  const bar = document.querySelector('#mpVc .lv i'); if (bar) bar.style.width = ((VC.lvl.me || 0) * 100).toFixed(0) + '%';
  // chat log fades after a while; bubbles over heads
  for (const L of VC.log) { L.t += dt; L.el.classList.toggle('old', L.t > 12); }
  for (const id of IDS) {
    const B = VC.bub[id]; let el = $('bub-' + id);
    if (!B) { if (el) el.classList.remove('on'); continue; }
    B.t += dt; if (!el) { el = document.createElement('div'); el.id = 'bub-' + id; el.className = 'pbub'; $('hud').appendChild(el); }
    if (el.textContent !== B.x) el.textContent = B.x;
    const C = chars[id], p = V3(C.pos.x, C.pos.y + C.h * 1.35, C.pos.z);
    const on = B.t < 6 && NET.on && party.includes(C) && project(p, el, 0, TAGS[id] && TAGS[id].classList.contains('on') ? -24 : 0) && camera.position.distanceTo(p) < 600;
    el.classList.toggle('on', on); if (B.t > 6.5) delete VC.bub[id];
  }
}
// lobby + pause controls
document.querySelectorAll('#micSel button').forEach(b => b.addEventListener('click', () => vcSetMode(b.dataset.m)));
$('setVoice').value = SET.voice ?? 1;
$('setVoice').addEventListener('input', e => { SET.voice = +e.target.value; saveSet(); });
$('mpVcBtn').addEventListener('click', () => vcSetMode(vcMode() === 'off' ? 'open' : 'off'));
// touch: a mic button (tap to mute, or hold to talk in push-to-talk) and a chat button
{ const m = $('tbMic'), c = $('tbChat');
  m.addEventListener('pointerdown', e => { e.preventDefault(); if (vcMode() === 'ptt') VC.touchPTT = true; else vcToggleMute(); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) m.addEventListener(ev, () => { VC.touchPTT = false; });
  c.addEventListener('pointerdown', e => { e.preventDefault(); chatOpen(); }); }
vcUI();
