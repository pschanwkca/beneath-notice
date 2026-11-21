// Renders each music arrangement offline (OfflineAudioContext) to WAV so the score can be listened to
// and measured without running the game. Layers come in one by one:
//   0–8 s still · 8–16 s moving · 16–28 s near a grown-up · 28–36 s being seen
// Usage: node test/music_render.mjs [theme ...]   → test/music/<theme>.wav (+ stings.wav)
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const src = fs.readFileSync(root + '/src/e17_music.js', 'utf8');
const want = process.argv.slice(2);
const harness = `(() => {
  const setInterval = () => 0, clamp = (v, a, b) => v < a ? a : v > b ? b : v, damp = (a, b) => b;
  const AU = { ctx: null }, SET = { mus: .6 }, NET = { on: false }, chars = {}, party = [];
  let STATE = 'play', LEVEL = 'kitchen', leader = null, PAUSED = false, meter = 0, quest = 0; const watchTargets = () => [];
  ${src}
  function wav(buf) {
    const n = buf.length, ch = buf.numberOfChannels, sr = buf.sampleRate, out = new DataView(new ArrayBuffer(44 + n * ch * 2));
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); ws(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
    out.setUint32(24, sr, true); out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); ws(36, 'data'); out.setUint32(40, n * ch * 2, true);
    const d = [...Array(ch)].map((_, c) => buf.getChannelData(c)); let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { out.setInt16(o, Math.max(-1, Math.min(1, d[c][i])) * 32767, true); o += 2; }
    let s = ''; const u = new Uint8Array(out.buffer); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s);
  }
  function setup(secs) {
    const C = new OfflineAudioContext(2, 44100 * secs, 44100); AU.ctx = C; AU.out = C.createGain(); AU.out.gain.value = .85; AU.out.connect(C.destination);
    const nb = C.createBuffer(1, C.sampleRate * 2, C.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; AU.noise = nb;
    MUS.ok = false; MUS.cur = null; for (const k in BANK) BANK[k].length = 0; BQ.length = 0;
    for (let m = 45; m <= 93; m += 3) BQ.push(['piano', m]); for (let m = 28; m <= 58; m += 3) BQ.push(['bass', m]); for (let m = 33; m <= 42; m += 3) BQ.push(['piano', m]); for (let m = 52; m <= 92; m += 4) BQ.push(['pizz', m]); for (let m = 64; m <= 100; m += 4) BQ.push(['cel', m]);
    musicInit(); bankWork(1e9); MUS.bus.gain.value = musVol(); return C;
  }
  window.H = {
    async theme(name, secs = 36) {
      const C = setup(secs); musicSwitch(name, 0); const A = ARR[name]; MUS.lv = [1, 1, 1, 1];
      const at = [[0, [1, 0, 0, 0]], [8, [1, 1, 0, 0]], [16, [1, 1, 1, 0]], [28, [1, 1, 1, 1]]];
      for (const [t, lv] of at) lv.forEach((v, i) => MUS.cur.lay[i].gain.setTargetAtTime(Math.max(v, A.floor[i]), t, v ? .4 : 1.2));
      MUS.step = 0; for (let t = .1; t < secs - 1; t += 30 / A.bpm) { musStep(t); MUS.step++; }
      return wav(await C.startRendering());
    },
    async note(k, m) { const C = setup(2); musicSwitch('sneak', 0); MUS.cur.g.gain.cancelScheduledValues(0); MUS.cur.g.gain.value = 1; MUS.cur.lay[0].gain.value = 1; MUS.pre.disconnect(); MUS.pre.connect(C.destination);
      if (k === 'clar' || k === 'bsn') playWind(k, m, .05, 1.5, .3, MUS.cur.lay[0]); else playS(k, m, .05, .5, 0, MUS.cur.lay[0]); return wav(await C.startRendering()); },
    async stings() {
      const C = setup(10); musicSwitch('sneak', 0); MUS.cur.g.gain.cancelScheduledValues(0); MUS.cur.g.gain.value = 0;
      const orig = C.currentTime; const at = { toy: .5, save: 3.5, goal: 6.5 };
      for (const k in at) { Object.defineProperty(C, 'currentTime', { value: at[k], configurable: true }); musicSting(k); }
      return wav(await C.startRendering());
    }
  };
})();`;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await browser.newPage(); page.on('pageerror', e => console.log('PAGEERROR', e.message)); page.on('console', m => console.log(m.text()));
await page.setContent('<html><body></body></html>'); await page.addScriptTag({ content: harness });
fs.mkdirSync(root + '/test/music', { recursive: true });
if (want[0] === 'tune') { const out = []; for (const [k, ms] of [['piano', [36, 47, 60, 71, 84]], ['bass', [29, 36, 43, 50, 57]], ['pizz', [55, 62, 69, 76, 88]], ['cel', [67, 74, 86, 97]], ['clar', [62, 74, 86]], ['bsn', [43, 50, 57]]]) for (const m of ms) { const b64 = await page.evaluate(([k, m]) => H.note(k, m), [k, m]); fs.writeFileSync(root + `/test/music/n_${k}_${m}.wav`, Buffer.from(b64, 'base64')); } await browser.close(); process.exit(0); }
for (const name of want.length ? want : ['title', 'lab', 'hub', 'sneak', 'tense', 'night', 'street', 'stings']) {
  const t0 = Date.now(); const b64 = await page.evaluate(n => n === 'stings' ? H.stings() : H.theme(n), name);
  fs.writeFileSync(root + '/test/music/' + name + '.wav', Buffer.from(b64, 'base64')); console.log(name, ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
await browser.close();
