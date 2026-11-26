// =====================================================================
//  MUSIC — art direction: "small and sneaky"
//  A chamber band played live by the browser (no audio files): felt piano, pizzicato, upright bass,
//  celesta, clarinet and bassoon, brushes, a few strings — in a warm, small room.
//  One original 8-bar theme (D minor, round the circle of fifths) runs through every place;
//  each place re-arranges it (title: solo piano · lab: celesta · wall: cosy piano and pizz ·
//  kitchen: pizz + clarinet, the sneakiest · garage: bassoon, ostinato bass, pulse ·
//  yards: a nocturne · street: a brushed jazz trio).
//  The band follows the play, like a stealth-comedy score:
//    layer 0  still / hidden     bass and soft piano
//    layer 1  moving             + the place's motion figure (pizz, arpeggios, brushes)
//    layer 2  near a grown-up    + the theme
//    layer 3  being seen         + tremolo strings, a heartbeat, the theme an octave up
//  Short cues for turning into a toy, being rescued and finishing an objective.
//  Plucked and struck sounds are rendered once into small samples (additive piano, Karplus–Strong
//  plucks) a few per frame so loading never hitches, then pitched with playbackRate.
// =====================================================================
const MUS = { ok: false, bus: null, pre: null, rev: null, cur: null, curName: '', want: '', next: 0, step: 0, ahead: .25, lastS: 0, lastT: 0, duck: 1, lv: [1, 0, 0, 0], hold: [0, 0], force: '', prev: null };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const mrand = (a, b) => { let n = (a * 7919 + b * 104729) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967295; };

// ---------- the theme (D minor; [bar, start in 8ths, length in 8ths, midi]) ----------
const THEME = [
  [0, 1, 1, 69], [0, 2, 1, 74], [0, 3, 2, 77], [0, 5, 1, 76], [0, 6, 2, 74],
  [1, 0, 1, 70], [1, 1, 1, 74], [1, 2, 3, 79], [1, 5, 1, 77], [1, 6, 1, 76], [1, 7, 1, 74],
  [2, 0, 2, 76], [2, 2, 1, 72], [2, 3, 1, 76], [2, 4, 3, 79],
  [3, 0, 1, 77], [3, 1, 1, 76], [3, 2, 1, 74], [3, 3, 1, 72], [3, 4, 4, 69],
  [4, 1, 1, 70], [4, 2, 1, 74], [4, 3, 2, 77], [4, 5, 3, 82],
  [5, 0, 2, 79], [5, 2, 1, 76], [5, 3, 1, 74], [5, 4, 3, 70],
  [6, 0, 1, 73], [6, 1, 1, 76], [6, 2, 1, 79], [6, 3, 2, 81], [6, 5, 1, 79], [6, 6, 1, 77], [6, 7, 1, 76],
  [7, 0, 6, 74]
];
// Dm | Gm | C | F | Bb | Em7b5 | A7 | Dm
const ROOTS = [2, 7, 0, 5, 10, 4, 9, 2];
const MQ = ['m', 'm', 'M', 'M', 'M', 'hd', '7', 'm'], MQ7 = ['m7', 'm7', '7', 'M7', 'M7', 'hd', '7', 'm6'];
const INTS = { m: [0, 3, 7], M: [0, 4, 7], hd: [0, 3, 6, 10], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], M7: [0, 4, 7, 11], m6: [0, 3, 7, 9] };
function voice(pc, ints, center) { return ints.map(i => { const p = (pc + i) % 12; let m = center - 6 + ((p - (center - 6)) % 12 + 12) % 12; return m; }).sort((a, b) => a - b); }
function bassRoot(pc) { return 36 + ((pc - 0) % 12 + 12) % 12 + (pc % 12 < 2 ? 12 : 0); }

// ---------- arrangements ----------
// floor: the least each layer plays here (title and lab don't follow the play)
const ARR = {
  title: { key: 0, bpm: 68, swing: 0, floor: [1, 1, 1, 0], parts: [['arpLH', 'piano', 0, .2], ['mel', 'piano', 2, .32], ['bassLong', 'bass', 0, .32]] },
  lab: { key: 2, bpm: 60, swing: 0, floor: [1, .7, .8, 0], parts: [['block', 'piano', 0, .14, 55], ['bassLong', 'bass', 0, .38], ['celSparse', 'cel', 1, .16], ['mel', 'cel', 2, .2, 12, 'slow']] },
  hub: { key: 5, bpm: 84, swing: 0, floor: [1, .25, .2, 0], parts: [['block', 'piano', 0, .13, 62], ['root5', 'bass', 0, .32], ['pizz8', 'pizz', 1, .2], ['mel', 'piano', 2, .26, 0], ['trem', 'str', 3, .065], ['heart', 'kick', 3, .3]] },
  sneak: { key: 0, bpm: 108, swing: .1, floor: [1, 0, 0, 0], parts: [['stab', 'piano', 0, .11], ['tiptoe', 'bass', 0, .27], ['pizz8', 'pizz', 1, .27], ['brushLight', 'brush', 1, .5], ['mel', 'clar', 2, .13, 0, 'stacc'], ['mel', 'pizz', 3, .22, 12, 'stacc'], ['trem', 'str', 3, .065], ['heart', 'kick', 3, .32]] },
  tense: { key: -5, bpm: 92, swing: 0, floor: [1, 0, 0, 0], parts: [['cluster', 'piano', 0, .11], ['ostinato', 'bass', 0, .28], ['pulse', 'kick', 1, .26], ['tick', 'brush', 1, .5], ['mel', 'bsn', 2, .14, -12, 'frag'], ['mel', 'clar', 3, .07, 0, 'frag'], ['trem', 'str', 3, .07], ['heart', 'kick', 3, .3]] },
  night: { key: -2, bpm: 66, swing: 0, floor: [1, .3, 0, 0], parts: [['bassLong', 'bass', 0, .28], ['block', 'piano', 0, .09, 58], ['flow', 'piano', 1, .16], ['mel', 'cel', 2, .2, 12], ['mel', 'piano', 2, .14, 0], ['trem', 'str', 3, .065], ['heart', 'kick', 3, .3]] },
  street: { key: 3, bpm: 96, swing: .2, floor: [1, .45, .25, 0], parts: [['walk', 'bass', 0, .36], ['jazz', 'piano', 0, .12], ['swing', 'brush', 1, .55], ['mel', 'piano', 2, .26, 0], ['mel', 'clar', 3, .08, 12], ['heart', 'kick', 3, .3]] }
};

// ---------- sample bank ----------
const SR = 22050;
const BANK = { piano: [], pizz: [], bass: [], cel: [] }, BQ = [];
for (let m = 45; m <= 93; m += 3) BQ.push(['piano', m]);
for (let m = 28; m <= 58; m += 3) BQ.push(['bass', m]);
for (let m = 33; m <= 42; m += 3) BQ.push(['piano', m]);
for (let m = 52; m <= 92; m += 4) BQ.push(['pizz', m]);
for (let m = 64; m <= 100; m += 4) BQ.push(['cel', m]);
function normalize(a, pk = .8) { let mx = 0; for (let i = 0; i < a.length; i++) mx = Math.max(mx, Math.abs(a[i])); if (mx > 0) { const k = pk / mx; for (let i = 0; i < a.length; i++) a[i] *= k; } return a; }
function fadeEnds(a, atk, rel) { const A = atk * SR | 0, Rl = rel * SR | 0; for (let i = 0; i < A && i < a.length; i++) a[i] *= i / A; for (let i = 0; i < Rl && i < a.length; i++) a[a.length - 1 - i] *= i / Rl; return a; }
// felt piano: inharmonic partials, two strings per note for the low partials, a soft hammer
function renderPiano(m) {
  const f0 = mtof(m), dur = clamp(4.4 - (m - 40) * .045, 1.5, 4.4), n = dur * SR | 0, out = new Float32Array(n);
  const B = .00018 * Math.pow(2, (m - 48) / 18), T0 = dur * .5, felt = .2 + Math.max(0, m - 60) * .006;
  for (let k = 1; k <= 14; k++) {
    const fk = f0 * k * Math.sqrt(1 + B * k * k); if (fk > SR * .42) break;
    const amp = Math.pow(k, -1.1) * (.25 + Math.abs(Math.sin(Math.PI * k * .12))) * Math.exp(-k * felt);
    const tau = T0 / (1 + .45 * (k - 1)), dF = Math.exp(-1 / (tau * .2 * SR)), dS = Math.exp(-1 / (tau * SR));
    for (const dt of k < 4 ? [-.00055, .0006] : [0]) {
      const w = 2 * Math.PI * fk * (1 + dt) / SR, c = Math.cos(w), s = Math.sin(w), a = amp / (k < 4 ? 2 : 1); let x = 1, y = 0, eF = .6, eS = .4;
      for (let i = 0; i < n; i++) { out[i] += a * y * (eF + eS); eF *= dF; eS *= dS; const nx = x * c - y * s; y = x * s + y * c; x = nx; }
    }
  }
  let lp = 0; const hn = .03 * SR | 0; for (let i = 0; i < hn; i++) { lp += .12 * ((Math.random() * 2 - 1) - lp); out[i] += lp * .18 * Math.exp(-i / (SR * .005)); }
  return fadeEnds(normalize(out), .003, .3);
}
// Karplus–Strong pluck; returns the true pitch (the loop length is a whole number of samples)
function renderPluck(m, T60, soft, len, body) {
  const f = mtof(m), L = Math.max(2, Math.round(SR / f - .5)), fA = SR / (L + .5), n = len * SR | 0, out = new Float32Array(n), ring = new Float32Array(L);
  for (let i = 0; i < L; i++) ring[i] = Math.random() * 2 - 1;
  for (let p = 0; p < soft; p++) for (let i = 1; i < L; i++) ring[i] = .5 * (ring[i] + ring[i - 1]);
  let mean = 0; for (let i = 0; i < L; i++) mean += ring[i]; mean /= L; for (let i = 0; i < L; i++) ring[i] -= mean;
  const g = Math.pow(.001, 1 / (fA * T60)); let idx = 0, prev = 0;
  for (let i = 0; i < n; i++) { const cur = ring[idx]; ring[idx] = g * .5 * (cur + prev); prev = cur; out[i] = cur; idx = (idx + 1) % L; }
  if (body) { const a = Math.exp(-2 * Math.PI * body / SR); let y = 0; for (let i = 0; i < n; i++) { y = (1 - a) * out[i] + a * y; out[i] = y; } }
  return { buf: fadeEnds(normalize(out), .002, .15), f: fA };
}
// celesta: a struck plate over a wooden resonator
function renderCel(m) {
  const f0 = mtof(m), dur = clamp(2.6 - (m - 64) * .03, 1.2, 2.6), n = dur * SR | 0, out = new Float32Array(n);
  for (const [r, a, td] of [[1, 1, 1], [2, .1, .5], [4, .2, .22], [6.8, .05, .1]]) { const fk = f0 * r; if (fk > SR * .45) continue; const w = 2 * Math.PI * fk / SR, d = Math.exp(-1 / (dur * .35 * td * SR)); let e = a; for (let i = 0; i < n; i++) { out[i] += e * Math.sin(w * i); e *= d; } }
  for (let i = 0; i < .004 * SR; i++) out[i] += (Math.random() * 2 - 1) * .05 * (1 - i / (.004 * SR));
  return fadeEnds(normalize(out), .001, .2);
}
function bankWork(budget) {
  const t0 = performance.now();
  while (BQ.length && performance.now() - t0 < budget) {
    const [k, m] = BQ.shift(); let S;
    if (k === 'piano') S = { m, f: mtof(m), buf: renderPiano(m) };
    else if (k === 'cel') S = { m, f: mtof(m), buf: renderCel(m) };
    else if (k === 'pizz') { const r = renderPluck(m, clamp(.62 - (m - 52) * .008, .26, .62), 3, .9, 2600); S = { m, f: r.f, buf: r.buf }; }
    else { const r = renderPluck(m, clamp(2 - (m - 28) * .02, 1.2, 2), 7, 2.2, 900); S = { m, f: r.f, buf: r.buf }; }
    const ab = AU.ctx.createBuffer(1, S.buf.length, SR); ab.getChannelData(0).set(S.buf); S.ab = ab; S.buf = null; BANK[k].push(S);
  }
}
function sample(k, m) { let best = null, bd = 99; for (const S of BANK[k]) { const d = Math.abs(S.m - m); if (d < bd) { bd = d; best = S; } } return bd <= 4 ? best : null; }

// ---------- the room and the mix ----------
function makeIR(C, secs) {
  const n = secs * C.sampleRate | 0, ir = C.createBuffer(2, n, C.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch); let lp = 0;
    for (let i = 0; i < n; i++) { const t = i / C.sampleRate, k = .5 - .42 * Math.min(1, t / secs); lp += k * ((Math.random() * 2 - 1) - lp); d[i] = lp * Math.pow(1 - t / secs, 2.2) * (t < .012 ? t / .012 : 1); }
    for (const [t, a] of [[.011, .5], [.019, .35], [.027, .28], [.041, .2]]) d[(t + ch * .003) * C.sampleRate | 0] += a; // early reflections off the skirting
  }
  return ir;
}
function musicInit() {
  const C = AU.ctx; if (!C || MUS.ok) return; MUS.ok = true;
  MUS.bus = C.createGain(); MUS.bus.gain.value = 0; MUS.bus.connect(AU.out);
  const comp = C.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 2; comp.attack.value = .02; comp.release.value = .3; comp.knee.value = 12;
  const lo = C.createBiquadFilter(); lo.type = 'lowshelf'; lo.frequency.value = 220; lo.gain.value = 2;
  const hi = C.createBiquadFilter(); hi.type = 'highshelf'; hi.frequency.value = 6500; hi.gain.value = -4;
  MUS.pre = C.createGain(); MUS.pre.connect(lo); lo.connect(hi); hi.connect(comp); comp.connect(MUS.bus);
  MUS.rev = C.createConvolver(); MUS.rev.buffer = makeIR(C, 2.1); const rHP = C.createBiquadFilter(); rHP.type = 'highpass'; rHP.frequency.value = 240; const rG = C.createGain(); rG.gain.value = .9;
  MUS.revIn = rHP; rHP.connect(MUS.rev); MUS.rev.connect(rG); rG.connect(MUS.pre);
  MUS.timer = setInterval(musicSched, 40);
}
function musVol() { return .5 * (SET.mus ?? .6); }

// ---------- instruments ----------
function outTo(node, dest, pan) { if (pan && AU.ctx.createStereoPanner) { const p = AU.ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node.connect(p); p.connect(dest); } else node.connect(dest); }
function playS(k, m, t, vel, dur, dest, pan = 0, bright = 1) {
  const S = sample(k, m); if (!S) return; const C = AU.ctx;
  const src = C.createBufferSource(); src.buffer = S.ab; src.playbackRate.value = mtof(m) / S.f;
  const g = C.createGain(); g.gain.value = vel; let n = src;
  if (k === 'piano') { const f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900 + 5200 * clamp(vel * 2.4 * bright, 0, 1); src.connect(f); n = f; }
  n.connect(g); outTo(g, dest, pan);
  src.start(t); const end = t + (dur || S.ab.duration / src.playbackRate.value);
  if (dur) { g.gain.setValueAtTime(vel, t + dur); g.gain.setTargetAtTime(0, t + dur, k === 'piano' ? .12 : .05); }
  src.stop(Math.min(t + S.ab.duration / src.playbackRate.value, end + .6) + .05);
}
// clarinet (hollow, odd harmonics) and bassoon (reedy, nasal): played live so they can breathe and vibrate
function playWind(kind, m, t, dur, vel, dest, pan = 0) {
  const C = AU.ctx, f = mtof(m), g = C.createGain(), lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = .6;
  const oA = C.createOscillator(), oB = C.createOscillator(), mA = C.createGain(), mB = C.createGain();
  if (kind === 'clar') { oA.type = 'square'; oB.type = 'triangle'; mA.gain.value = .55; mB.gain.value = .5; lp.frequency.value = Math.min(f * 3.4, 3600); }
  else { oA.type = 'sawtooth'; oB.type = 'square'; mA.gain.value = .5; mB.gain.value = .25; lp.frequency.value = Math.min(f * 5, 1900); const bp = C.createBiquadFilter(); bp.type = 'peaking'; bp.frequency.value = 480; bp.Q.value = 1.4; bp.gain.value = 7; lp.connect(bp); bp.connect(g); }
  oA.frequency.value = f; oB.frequency.value = f; oB.detune.value = 3; oA.connect(mA); oB.connect(mB); mA.connect(lp); mB.connect(lp); if (kind === 'clar') lp.connect(g);
  const vib = C.createOscillator(), vg = C.createGain(); vib.frequency.value = 5.1; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * .0045, t + Math.min(.5, dur * .7)); vib.connect(vg); vg.connect(oA.frequency); vg.connect(oB.frequency);
  const br = C.createBufferSource(); br.buffer = AU.noise; const bf = C.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = kind === 'clar' ? 2200 : 1200; bf.Q.value = 1.2; const bg = C.createGain(); bg.gain.value = .05; br.connect(bf); bf.connect(bg); bg.connect(g);
  const a = kind === 'clar' ? .035 : .05; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + a); g.gain.linearRampToValueAtTime(vel * .82, t + a + .12); g.gain.setValueAtTime(vel * .82, t + Math.max(a + .12, dur)); g.gain.linearRampToValueAtTime(0, t + dur + .07);
  outTo(g, dest, pan); const e = t + dur + .12;
  for (const o of [oA, oB, vib]) { o.start(t); o.stop(e); } br.start(t, mrand(t * 7, 3) * 1.4); br.stop(e);
}
// a desk of strings, bowed tremolo — only when you're being watched
function playStr(m, t, dur, vel, dest, pan = 0) {
  const C = AU.ctx, f = mtof(m), g = C.createGain(), lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1700; lp.Q.value = .5;
  for (const d of [-7, 0, 8]) { const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d; o.connect(lp); o.start(t); o.stop(t + dur + .4); }
  const tr = C.createGain(); tr.gain.value = .65; const lfo = C.createOscillator(); lfo.frequency.value = 8.5 + mrand(m, t) * 2; const lg = C.createGain(); lg.gain.value = .35; lfo.connect(lg); lg.connect(tr.gain); lfo.start(t); lfo.stop(t + dur + .4);
  lp.connect(tr); tr.connect(g); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + dur * .4); g.gain.setValueAtTime(vel, t + dur * .8); g.gain.linearRampToValueAtTime(0, t + dur + .35); outTo(g, dest, pan);
}
function playPerc(kind, t, vel, dest, pan = 0) {
  const C = AU.ctx, g = C.createGain(); outTo(g, dest, pan);
  if (kind === 'kick' || kind === 'heart') { const o = C.createOscillator(); o.frequency.setValueAtTime(kind === 'heart' ? 66 : 78, t); o.frequency.exponentialRampToValueAtTime(40, t + .18); o.connect(g); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(.0001, t + .3); o.start(t); o.stop(t + .34); return; }
  const s = C.createBufferSource(); s.buffer = AU.noise; const f = C.createBiquadFilter(); s.connect(f); f.connect(g);
  if (kind === 'swish') { f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = .5; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + .05); g.gain.exponentialRampToValueAtTime(.0001, t + .26); }
  else if (kind === 'tap') { f.type = 'highpass'; f.frequency.value = 5200; g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(.0001, t + .045); }
  else if (kind === 'tick') { f.type = 'bandpass'; f.frequency.value = 3800; f.Q.value = 6; g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(.0001, t + .025); }
  s.start(t, mrand(t * 13, 5) * 1.6); s.stop(t + .3);
}

// ---------- one 8th-note step ----------
function musStep(t) {
  const M = MUS.cur, A = M.A, st = MUS.step % 8, barN = Math.floor(MUS.step / 8), b = barN % 8, pass = Math.floor(barN / 8) % 4;
  const beat = 60 / A.bpm, e = beat / 2, k = A.key, pc = (ROOTS[b] + k + 120) % 12, ints = INTS[MQ[b]], ch7 = INTS[MQ7[b]];
  const r = n => mrand(barN * 17 + st, n + M.seed);
  const sw = st % 2 ? A.swing * e * 2 : 0, hum = n => t + sw + (r(n) - .5) * .014;
  const root = bassRoot(pc), third = ints[1], fifth = 7;
  const nextPc = (ROOTS[(b + 1) % 8] + k + 120) % 12;
  for (const [role, inst, L, v0, arg, mode] of A.parts) {
    if (MUS.lv[L] < .02 && M.lay[L].gain.value < .02) continue;
    const D = M.lay[L], v = v0 * (.9 + r(role.length) * .2);
    switch (role) {
      case 'mel': {
        if (pass === 2 && L === 2) break; // every fourth time round the theme rests and the band breathes
        if (mode === 'frag' && !(b === 0 || b === 1 || b === 4 || b === 5)) break;
        const slow = mode === 'slow', bb = slow ? Math.floor(b / 2) + (pass % 2) * 4 : b, half = slow ? (b % 2) * 8 : 0;
        for (const [nb, s0, len, mm] of THEME) {
          if (nb !== (mode === 'frag' ? b % 2 : bb)) continue; const s = slow ? s0 * 2 - half : s0; if (s !== st) continue;
          let m = mm + k + (arg || 0) + (pass === 1 && L === 2 && inst !== 'bsn' ? 12 : 0); const top = { piano: 96, cel: 103, pizz: 95, clar: 91, bsn: 70 }[inst]; while (m > top) m -= 12;
          const dur = (slow ? len * 2 : len) * e * (mode === 'stacc' ? .55 : .95);
          if (inst === 'clar' || inst === 'bsn') playWind(inst, m, hum(1), dur, v, D, .12);
          else playS(inst, m, hum(1), v, inst === 'piano' ? dur + e : 0, D, .1);
        }
        break;
      }
      case 'arpLH': { const seq = [0, 7, 12, 12 + third, 19, 12 + third, 12, 7]; playS('piano', root - 12 + seq[st] + (root < 40 ? 12 : 0), hum(2), v * (st === 0 ? 1.2 : .85), beat * 2, D, -.15); break; }
      case 'block': if (st === 0 || (st === 4 && A.bpm > 70)) for (const m of voice(pc, ints, arg || 60)) playS('piano', m, hum(3) + (m % 3) * .006, v * (st ? .7 : 1), beat * (st ? 1.8 : 3.6), D, -.1); break;
      case 'stab': if (st === 2 || st === 6 || (st === 0 && r(4) < .5)) for (const m of voice(pc, ints, 64)) playS('piano', m, hum(5), v * (st === 0 ? .8 : 1), e * .7, D, -.2); break;
      case 'cluster': if (st === 0) { for (const m of voice(pc, ints, 50)) playS('piano', m, hum(6), v, beat * 4, D, -.1); if (b === 3 || b === 7) playS('piano', voice(pc, ints, 50)[0] + 13, t + beat * 2, v * .7, beat * 2, D, .2); } break;
      case 'flow': { const vv = voice(pc, ints, 62), seq = [vv[0] - 12, vv[0], vv[1], vv[2], vv[0] + 12, vv[2], vv[1], vv[0]]; playS('piano', seq[st], hum(7), v * (st === 0 ? 1.15 : .8), beat * 1.5, D, .2); break; }
      case 'jazz': if (st === 0 || st === 3 || (st === 6 && r(8) < .35)) for (const m of voice(pc, ch7, 60)) playS('piano', m, hum(9), v * (st === 3 ? 1.1 : .9), st === 0 ? beat * .9 : e * 1.4, D, -.15); break;
      case 'bassLong': if (st === 0) playS('bass', root, hum(10), v, beat * 3.8, D); else if (st === 4 && r(11) < .5) playS('bass', root + fifth, hum(11), v * .7, beat * 1.8, D); break;
      case 'root5': if (st === 0) playS('bass', root, hum(12), v, beat * 1.9, D); else if (st === 4) playS('bass', root + fifth - (root + fifth > 52 ? 12 : 0), hum(12), v * .85, beat * 1.9, D); break;
      case 'tiptoe': if (st % 2 === 0) { const seq = [0, fifth - 12, 0, fifth - 12]; const m = root + seq[st / 2]; playS('bass', m < 30 ? m + 12 : m, hum(13), v * (st === 0 ? 1.1 : .85), e * .8, D); } break;
      case 'ostinato': if (st === 0 || st === 3 || st === 6 || r(14) < .3) playS('bass', root, hum(14), v * (st === 0 || st === 3 || st === 6 ? 1 : .55), e * .75, D); break;
      case 'walk': if (st % 2 === 0) { const q = st / 2; const appr = mrand(barN, 77) < .5 ? -1 : 1; let m = q === 0 ? root : q === 1 ? root + (r(15) < .5 ? third : fifth) : q === 2 ? root + (r(16) < .5 ? fifth : 12) : bassRoot(nextPc) + appr; while (m > 52) m -= 12; while (m < 33) m += 12; playS('bass', m, hum(15), v * (q === 0 ? 1.1 : .9), beat * .92, D); } break;
      case 'pizz8': { const vv = voice(pc, ints, 62), seq = [vv[1], vv[2], vv[0] + 12, vv[2], vv[1], vv[2], vv[0] + 12, vv[2]]; if (st % 2 === 0 || r(17) < .7) playS('pizz', seq[st], hum(17), v * (st % 4 === 0 ? 1.15 : .85), 0, D, .3); break; }
      case 'celSparse': if (st === 0 || st === 3 || (st === 6 && r(18) < .6)) { const vv = voice(pc, ints, 79); playS('cel', vv[Math.floor(r(19) * vv.length)], hum(18), v, 0, D, (r(20) - .5) * .8); } break;
      case 'brushLight': if (st === 2 || st === 6) playPerc('swish', hum(21), .06 * v, D, .2); if (st % 2 === 1) playPerc('tap', hum(22), .018 * v, D, .3); break;
      case 'swing': if (st === 2 || st === 6) playPerc('swish', hum(23), .075 * v, D, .15); playPerc('tap', hum(24), (st % 2 ? .016 : .026) * v, D, .35); break;
      case 'tick': if (st % 2 === 0) playPerc('tick', hum(25), .03 * v, D, .4); break;
      case 'pulse': if (st === 0 || st === 3) playPerc('kick', hum(26), v, D); break;
      case 'heart': if (st === 0 || st === 4) { playPerc('heart', t, v, D); playPerc('heart', t + .17, v * .65, D); } break;
      case 'trem': if (st === 0) { const vv = voice(pc, ints, 74); vv.forEach((m, i) => playStr(m, t, beat * 4, v, D, (i - 1) * .35)); playStr(root + 12, t, beat * 4, v * .8, D, 0); } break;
    }
  }
}

// ---------- scheduling ----------
function musicSched() {
  const C = AU.ctx; if (!C || !MUS.cur) return;
  const now = C.currentTime;
  // a slow machine or a heavy frame: look further ahead so the notes are queued before the main thread gets busy
  const pn = performance.now(), gap = MUS.lastS ? (pn - MUS.lastS) / 1000 : .03; MUS.lastS = pn;
  MUS.ahead = Math.max(clamp(gap * 3, .25, 1.2), MUS.ahead * .97);
  if (now - MUS.next > 2) MUS.next = now + .05; // a long stall: pick the beat up again rather than racing to catch up
  while (MUS.next < now + MUS.ahead) {
    const late = MUS.next < now - .03;
    if (MUS.step % 8 === 0 && MUS.want !== MUS.curName) musicSwitch(MUS.want, Math.max(MUS.next, now));
    if (!late) musStep(MUS.next); MUS.step++; MUS.next += 30 / MUS.cur.A.bpm;
  }
}
function musicSwitch(name, t) {
  const C = AU.ctx, A = ARR[name]; if (!A) return;
  const old = MUS.cur; if (old) { old.g.gain.cancelScheduledValues(t); old.g.gain.setValueAtTime(old.g.gain.value, t); old.g.gain.linearRampToValueAtTime(.0001, t + 2.5); setTimeout(() => { try { old.g.disconnect(); } catch (e) { } }, 4500); }
  const g = C.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(1, t + 2.2); g.connect(MUS.pre); const send = C.createGain(); send.gain.value = .3; g.connect(send); send.connect(MUS.revIn);
  const lay = [0, 1, 2, 3].map(i => { const n = C.createGain(); n.gain.value = Math.max(A.floor[i], i === 0 ? 1 : 0); n.connect(g); return n; });
  MUS.cur = { A, g, lay, seed: Math.floor(Math.random() * 1000) }; MUS.curName = name; MUS.step = 0;
}
function musicWant() {
  if (MUS.force) return MUS.force;
  if (STATE === 'title' || STATE === 'load' || STATE === 'intro' || STATE === 'end' || STATE === 'cine') return 'title';
  return ({ basement: 'lab', wall: 'hub', kitchen: 'sneak', garage: 'tense', yard: 'night', road: 'street' })[LEVEL] || 'title';
}
// how much of the band plays: moving, a grown-up nearby, being seen
function musicLayers(dt) {
  const A = MUS.cur.A, L = leader, play = STATE === 'play' && L && !PAUSED;
  let mov = 0, near = 0; const seen = play ? clamp((meter - .06) / .45, 0, 1) : 0;
  if (play) {
    mov = Math.hypot(L.vel.x, L.vel.z) > 3 ? 1 : 0;
    for (const w of watchTargets()) { const d = w.p.distanceTo(L.pos); if (d < 360) near = Math.max(near, clamp(1 - (d - 140) / 220, 0, 1)); }
  }
  MUS.hold[0] = mov ? 4 : Math.max(0, MUS.hold[0] - dt); MUS.hold[1] = near > .2 ? 6 : Math.max(0, MUS.hold[1] - dt);
  const tgt = MUS.lvForce || [1, Math.max(A.floor[1], MUS.hold[0] > 0 ? 1 : 0, near > .2 || seen > 0 ? 1 : 0), Math.max(A.floor[2], MUS.hold[1] > 0 ? Math.max(.75, near) : 0, seen > 0 ? 1 : 0), Math.max(A.floor[3], seen)];
  const now = AU.ctx.currentTime;
  for (let i = 0; i < 4; i++) { MUS.lv[i] = tgt[i]; const g = MUS.cur.lay[i].gain; g.cancelScheduledValues(now); g.setTargetAtTime(tgt[i], now, tgt[i] > g.value ? .5 : 1.6); }
}
// ---------- cues ----------
function musicSting(kind) {
  const C = AU.ctx; if (!C || !MUS.ok) return; const t = C.currentTime + .03, k = MUS.cur ? MUS.cur.A.key : 0, D = MUS.pre;
  const g = C.createGain(); g.gain.value = 1; g.connect(D); const s2 = C.createGain(); s2.gain.value = .45; g.connect(s2); s2.connect(MUS.revIn);
  if (kind === 'toy') { [86, 82, 79, 75, 72, 67].forEach((m, i) => playS('cel', m + k, t + i * .07, .3 - i * .03, 0, g, .2 - i * .08)); for (const m of [38, 44, 49]) playS('piano', m + k, t + .45, .26, 2.4, g, -.2); }
  else if (kind === 'save') { [62, 65, 69, 74, 77, 81].forEach((m, i) => playS('cel', m + k, t + i * .06, .18 + i * .02, 0, g, -.3 + i * .12)); for (const m of [50, 57, 62, 65]) playS('piano', m + k, t + .36, .2, 1.8, g, 0); }
  else if (kind === 'goal') { for (const m of [57, 61, 64, 67]) playS('piano', m + k, t, .17, .5, g, -.1); for (const m of [50, 57, 62, 65]) playS('piano', m + k, t + .42, .2, 1.6, g, -.1); playS('cel', 74 + k, t + .42, .22, 0, g, .2); playS('cel', 81 + k, t + .6, .16, 0, g, .3); }
}
function musicCues() {
  const L = leader; if (!L) return; const me = NET.on ? (NET.my && chars[NET.my]) || L : L;
  const nFrozen = party.filter(C => C.frozen).length, P = MUS.prev;
  if (P && STATE !== 'title') {
    if (me.frozen && !P.meFrozen) musicSting('toy');
    else if (nFrozen < P.nFrozen && STATE === 'play') musicSting('save');
    else if (quest > P.quest && P.lv === LEVEL && STATE === 'play') musicSting('goal');
  }
  MUS.prev = { meFrozen: !!me.frozen, nFrozen, quest, lv: LEVEL };
}
function musicTick(dt) {
  const C = AU.ctx; if (!C) return; if (!MUS.ok) musicInit();
  MUS.want = musicWant();
  if (!MUS.cur) { if (!BANK.piano.length) return; MUS.next = C.currentTime + .15; musicSwitch(MUS.want, MUS.next); }
  musicLayers(dt); musicCues();
  const duck = (PAUSED ? .4 : 1) * (STATE === 'frozen' || STATE === 'fail' ? .3 : 1) * (MUS.ext ?? 1) * (STATE === 'cine' ? CINE.mus : 1);
  MUS.duck = damp(MUS.duck, duck, 3, dt);
  MUS.bus.gain.setTargetAtTime(musVol() * MUS.duck, C.currentTime, .1);
}
// driven by the game's frames, with a timer as a fallback when frames stop (a hidden tab)
function musicFrame() {
  if (!AU.ctx) return; if (!MUS.ok) musicInit(); if (BQ.length) bankWork(MUS.cur ? 4 : 10);
  const pn = performance.now(); musicSched(); if (pn - MUS.lastT > 100) { musicTick(Math.min(.5, MUS.lastT ? (pn - MUS.lastT) / 1000 : .1)); MUS.lastT = pn; }
}
setInterval(musicFrame, 250);
