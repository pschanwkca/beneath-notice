// =====================================================================
//  MUSIC — written live by the browser (no audio files), one mood per place:
//  title (warm piano) · basement lab (mysterious bells) · inside the wall (cosy) · kitchen & living room
//  (sneaky marimba and a walking bass) · garage (tense pulse) · the yards at night (nocturne + crickets)
//  · the street (lo-fi night). A low heartbeat and a thin string cluster creep in while you're being seen.
//  Themes cross-fade on the next bar as you walk from one place into the next.
// =====================================================================
const MUS = { ahead: .22, lastS: 0, lastT: 0, bus: null, send: null, cur: null, curName: '', want: '', fadeG: null, next: 0, step: 0, bar: 0, ten: 0, tenG: null, timer: 0, duck: 1, ok: false };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const THEMES = {
  title: { bpm: 70, ch: [[48, 55, 60, 64, 71], [45, 52, 57, 60, 67], [41, 48, 53, 57, 64], [43, 50, 55, 59, 62]], sc: [60, 62, 64, 67, 69, 72, 74, 76, 79], lead: 'piano', pad: .5, bass: 1, arp: 'up', dr: 0, vol: 1 },
  lab: { bpm: 62, ch: [[38, 45, 50, 53, 57], [34, 41, 46, 50, 57], [31, 38, 43, 46, 50], [33, 40, 45, 49, 52]], sc: [62, 64, 65, 67, 69, 70, 72, 74, 76], lead: 'bell', pad: .75, bass: 1, arp: 'sparse', dr: 0, vol: .9 },
  hub: { bpm: 76, ch: [[41, 48, 53, 57, 64], [38, 45, 50, 53, 60], [34, 41, 46, 50, 57], [36, 43, 48, 52, 58]], sc: [65, 67, 69, 72, 74, 76, 77, 79, 81], lead: 'piano', pad: .45, bass: 1, arp: 'up', dr: 0, vol: .9 },
  sneak: { bpm: 100, ch: [[40, 47, 52, 55, 59], [40, 47, 52, 55, 59], [36, 43, 48, 52, 55], [35, 42, 47, 51, 54]], sc: [64, 66, 67, 69, 71, 72, 74, 75, 76], lead: 'marimba', pad: .22, bass: 2, arp: 'sneak', dr: 1, vol: .85 },
  tense: { bpm: 88, ch: [[33, 40, 45, 48, 52], [33, 40, 45, 48, 52], [29, 36, 41, 45, 48], [31, 38, 43, 47, 50]], sc: [57, 59, 60, 62, 64, 65, 67, 69, 72], lead: 'bell', pad: .55, bass: 3, arp: 'sparse', dr: 2, vol: .9 },
  night: { bpm: 66, ch: [[43, 50, 55, 59, 62], [40, 47, 52, 55, 62], [36, 43, 48, 52, 59], [38, 45, 50, 54, 57]], sc: [67, 69, 71, 74, 76, 78, 79, 81, 83], lead: 'piano', pad: .5, bass: 1, arp: 'flow', dr: 0, crick: 1, vol: .9 },
  street: { bpm: 80, ch: [[41, 48, 52, 57, 64], [40, 47, 50, 55, 62], [38, 45, 48, 53, 60], [36, 43, 47, 52, 59]], sc: [65, 67, 69, 72, 74, 76, 77, 79, 81], lead: 'keys', pad: .5, bass: 1, arp: 'lofi', dr: 3, vol: .9 }
};
const mrand = (a, b) => { let n = (a * 7919 + b * 104729) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967295; };

function musicInit() {
  const C = AU.ctx; if (!C || MUS.ok) return; MUS.ok = true;
  MUS.bus = C.createGain(); MUS.bus.gain.value = 0; MUS.bus.connect(AU.out);
  // a little space: two filtered feedback delays standing in for a room
  MUS.send = C.createGain(); MUS.send.gain.value = .32;
  for (const [t, fb] of [[.29, .42], [.43, .3]]) { const d = C.createDelay(1); d.delayTime.value = t; const f = C.createGain(); f.gain.value = fb; const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2300; MUS.send.connect(d); d.connect(lp); lp.connect(f); f.connect(d); lp.connect(MUS.bus); }
  // the "you're being watched" layer: a slow cluster that swells with the eye meter
  MUS.tenG = C.createGain(); MUS.tenG.gain.value = 0; const tlp = C.createBiquadFilter(); tlp.type = 'lowpass'; tlp.frequency.value = 1400; MUS.tenG.connect(tlp); tlp.connect(MUS.bus);
  for (const [m, dt] of [[76, 0], [77, 3], [71, -4]]) { const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt; const g = C.createGain(); g.gain.value = .05; const lfo = C.createOscillator(); lfo.frequency.value = 5.2 + dt * .1; const lg = C.createGain(); lg.gain.value = .03; lfo.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(MUS.tenG); o.start(); lfo.start(); }
  MUS.timer = setInterval(musicSched, 40);
}
function musVol() { return .95 * (SET.mus ?? .6); }
// ---------- instruments ----------
function mNote(t, m, dur, vol, kind, pan = 0) {
  const C = AU.ctx; const f = mtof(m); const g = C.createGain();
  // voice → (pad: a slow-opening lowpass) → (pan) → theme bus, plus a send into the room
  let tail = g; if (kind === 'pad') { const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1100, t + dur * .5); lp.frequency.linearRampToValueAtTime(600, t + dur); g.connect(lp); tail = lp; }
  let out = tail; if (pan && C.createStereoPanner) { const p = C.createStereoPanner(); p.pan.value = pan; tail.connect(p); out = p; }
  out.connect(MUS.cur.g); if (kind !== 'bass') { const s = C.createGain(); s.gain.value = kind === 'pad' ? .5 : .8; tail.connect(s); s.connect(MUS.send); }
  const osc = (type, fr, k) => { const o = C.createOscillator(); o.type = type; o.frequency.value = fr; const og = C.createGain(); og.gain.value = k; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + .1); return o; };
  const env = (a, d) => { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + d); };
  if (kind === 'piano') { osc('triangle', f, .7); osc('sine', f * 2, .25); osc('sine', f * 3.01, .06); env(.006, dur); }
  else if (kind === 'keys') { osc('sine', f, .8); osc('triangle', f * 2.001, .14); osc('sine', f * 7, .03); env(.01, dur); }
  else if (kind === 'bell') { osc('sine', f, .6); osc('sine', f * 2.76, .22); osc('sine', f * 5.4, .08); env(.004, dur * 1.4); }
  else if (kind === 'marimba') { osc('sine', f, .8); osc('sine', f * 4, .12); env(.003, Math.min(dur, .32)); }
  else if (kind === 'bass') { osc('sine', f, .9); osc('triangle', f * 2, .15); env(.01, dur); }
  else if (kind === 'pad') {
    for (const dt of [-7, 6]) { const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt; const og = C.createGain(); og.gain.value = .5; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + .2); }
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * .35); g.gain.linearRampToValueAtTime(vol * .8, t + dur * .8); g.gain.linearRampToValueAtTime(.0001, t + dur + .15);
  }
}
function mDrum(t, kind, vol) {
  const C = AU.ctx; const g = C.createGain(); g.connect(MUS.cur.g);
  if (kind === 'kick' || kind === 'heart') { const o = C.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(kind === 'heart' ? 70 : 110, t); o.frequency.exponentialRampToValueAtTime(kind === 'heart' ? 38 : 44, t + .16); o.connect(g); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .28); o.start(t); o.stop(t + .32); return; }
  const s = C.createBufferSource(); s.buffer = AU.noise; const f = C.createBiquadFilter();
  if (kind === 'hat') { f.type = 'highpass'; f.frequency.value = 7000; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .05); }
  else if (kind === 'snare') { f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = .7; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .16); }
  else if (kind === 'rim') { f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 4; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .03); }
  else if (kind === 'crick') { f.type = 'bandpass'; f.frequency.value = 4600 + mrand(t * 100, 3) * 600; f.Q.value = 18; g.gain.setValueAtTime(.0001, t); for (let i = 0; i < 3; i++) { g.gain.setValueAtTime(vol, t + i * .045); g.gain.setValueAtTime(.0001, t + i * .045 + .022); } }
  s.connect(f); f.connect(g); s.start(t, mrand(t, 9) * 1.5); s.stop(t + .25);
}
// ---------- one eighth-note step of the current theme ----------
function musStep(t) {
  const M = MUS.cur, th = M.th, st = MUS.step % 8, bar = MUS.bar, ch = th.ch[bar % th.ch.length], beat = 60 / th.bpm, e = beat / 2, V = th.vol;
  const r = k => mrand(bar * 13 + st, k + M.seed);
  if (st === 0) {
    if (th.pad) for (const m of ch.slice(1, 4)) mNote(t, m + 12, beat * 4, .045 * th.pad * V, 'pad', (m % 3 - 1) * .3);
    if (th.bass === 1) { mNote(t, ch[0], beat * 2, .16 * V, 'bass'); }
  }
  if (th.bass === 1 && st === 4) mNote(t, ch[0] + (bar % 2 ? 7 : 0), beat * 2, .12 * V, 'bass');
  if (th.bass === 2) { const walk = [0, 7, 12, 10, 0, 7, 3, 6]; if (st % 2 === 0 || r(1) < .3) mNote(t, ch[0] + walk[st], e * .7, .15 * V, 'bass'); }
  if (th.bass === 3) mNote(t, ch[0] + (st === 6 ? 12 : 0), e * .8, (st % 2 ? .07 : .12) * V, 'bass');
  // the tune
  const L = th.lead, sc = th.sc;
  if (th.arp === 'up') { if (st !== 1 && st !== 5 || r(2) < .4) { const tones = [ch[2] + 12, ch[3] + 12, ch[4] + 12, ch[2] + 24, ch[4] + 12, ch[3] + 12, ch[2] + 12, ch[1] + 12]; mNote(t, tones[st], beat * 1.6, .055 * V, L, st % 2 ? .25 : -.25); } if ((st === 2 || st === 6) && r(3) < .5) mNote(t + e * .5, sc[Math.floor(r(4) * sc.length)] + 12, beat, .04 * V, L, .1); }
  else if (th.arp === 'flow') { const tones = [ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[4] + 12, ch[3] + 24, ch[4] + 12, ch[3] + 12, ch[2] + 12]; if (r(5) < .82) mNote(t, tones[st], beat * 2, .05 * V, L, st % 2 ? .3 : -.3); if (st === 0 && bar % 2 === 1) mNote(t + beat * 1.5, sc[Math.floor(r(6) * sc.length)] + 12, beat * 2.5, .045 * V, L, 0); }
  else if (th.arp === 'sparse') { if (r(7) < .22) mNote(t, sc[Math.floor(r(8) * sc.length)] + 12, beat * 3, .05 * V, L, (r(9) - .5) * .8); }
  else if (th.arp === 'sneak') {
    // a creeping motif: short, staccato, with a chromatic step at the end of each phrase
    const ph = [0, -1, 2, -1, 4, 3, -1, 2], idx = ph[st]; if (idx >= 0 && (bar % 4 !== 3 || st < 4)) mNote(t, sc[(idx + (bar % 2) * 2) % sc.length] + (bar % 4 === 2 ? 12 : 0), e * .9, .085 * V, L, (st - 3.5) * .08);
    if (bar % 4 === 3 && st >= 4) mNote(t, sc[7 - (st - 4)] - (st === 7 ? 1 : 0), e * .8, .08 * V, L, .2);
  }
  else if (th.arp === 'lofi') { if (st === 0 || st === 3) for (const m of ch.slice(1)) mNote(t + (st === 3 ? .02 : 0), m + 12, beat * (st === 0 ? 1.4 : 1), .03 * V, L); if (st === 5 && r(10) < .7) mNote(t, sc[Math.floor(r(11) * 6) + 2] + 12, beat * 1.5, .05 * V, L, .2); if (st === 7 && r(12) < .4) mNote(t, sc[Math.floor(r(13) * 6) + 2] + 12, beat, .04 * V, L, -.2); }
  // percussion
  if (th.dr === 1) { if (st % 2 === 1) mDrum(t, 'rim', .05 * V); if (st === 0) mDrum(t, 'kick', .1 * V); }
  else if (th.dr === 2) { if (st === 0 || st === 3) mDrum(t, 'heart', .16 * V); if (st % 2 === 1 && r(14) < .5) mDrum(t, 'hat', .02 * V); }
  else if (th.dr === 3) { if (st === 0 || st === 5) mDrum(t, 'kick', .15 * V); if (st === 2 || st === 6) mDrum(t, 'snare', .05 * V); mDrum(t + (st % 2 ? e * .12 : 0), 'hat', (st % 2 ? .016 : .025) * V); }
  if (th.crick && st % 2 === 0 && r(15) < .6) mDrum(t + r(16) * e, 'crick', .012 * V);
  // being watched: a heartbeat under everything
  if (MUS.ten > .3 && (st === 0 || st === 4 || (MUS.ten > .75 && st % 2 === 0))) { mDrum(t, 'heart', .24 * MUS.ten); mDrum(t + .17, 'heart', .16 * MUS.ten); }
}
function musicSched() {
  const C = AU.ctx; if (!C || !MUS.cur) return;
  const now = C.currentTime;
  // slow machine or a heavy frame: look further ahead so the notes are already queued when the main thread is busy
  const pn = performance.now(), gap = MUS.lastS ? (pn - MUS.lastS) / 1000 : .03; MUS.lastS = pn;
  MUS.ahead = Math.max(clamp(gap * 3, .22, 1.2), MUS.ahead * .97);
  // after a long frame (loading a place, a hidden tab) skip the missed steps silently so the beat stays on its grid
  if (now - MUS.next > 2) MUS.next = now + .05;
  while (MUS.next < now + MUS.ahead) {
    const th = MUS.cur.th, e = 30 / th.bpm, late = MUS.next < now - .03;
    if (MUS.step % 8 === 0 && MUS.want !== MUS.curName) { musicSwitch(MUS.want, Math.max(MUS.next, now)); }
    if (!late) musStep(MUS.next); MUS.step++; if (MUS.step % 8 === 0) MUS.bar++; MUS.next += e;
  }
}
function musicSwitch(name, t) {
  const C = AU.ctx, th = THEMES[name]; if (!th) return;
  const old = MUS.cur; if (old) { old.g.gain.cancelScheduledValues(t); old.g.gain.setValueAtTime(old.g.gain.value, t); old.g.gain.linearRampToValueAtTime(.0001, t + 2.2); setTimeout(() => { try { old.g.disconnect(); } catch (e) { } }, 4000); }
  const g = C.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(1, t + 2.4); g.connect(MUS.bus);
  MUS.cur = { th, g, seed: Math.floor(Math.random() * 1000) }; MUS.curName = name; MUS.bar = 0;
}
// which theme fits right now
function musicWant() {
  if (MUS.force) return MUS.force;
  if (STATE === 'title' || STATE === 'load' || STATE === 'intro') return 'title';
  if (STATE === 'end') return 'title';
  return ({ basement: 'lab', wall: 'hub', kitchen: 'sneak', garage: 'tense', yard: 'night', road: 'street' })[LEVEL] || 'title';
}
function musicTick(dt) {
  const C = AU.ctx; if (!C) return; if (!MUS.ok) musicInit();
  MUS.want = musicWant();
  if (!MUS.cur) { MUS.next = C.currentTime + .1; MUS.step = 0; musicSwitch(MUS.want, MUS.next); }
  MUS.ten = damp(MUS.ten, STATE === 'play' ? clamp((meter - .15) / .7, 0, 1) : 0, 3, dt);
  const duck = (PAUSED ? .45 : 1) * (STATE === 'frozen' || STATE === 'fail' ? .35 : 1);
  MUS.duck = damp(MUS.duck, duck, 3, dt);
  MUS.bus.gain.setTargetAtTime(musVol() * MUS.duck, C.currentTime, .1);
  MUS.tenG.gain.setTargetAtTime(MUS.ten * .5, C.currentTime, .3);
}
// driven by the game's frames, with a timer as a fallback when frames stop (title fade, a hidden tab)
function musicFrame() { if (!AU.ctx) return; const pn = performance.now(); musicSched(); if (pn - MUS.lastT > 100) { musicTick(Math.min(.5, MUS.lastT ? (pn - MUS.lastT) / 1000 : .1)); MUS.lastT = pn; } }
setInterval(musicFrame, 250);
