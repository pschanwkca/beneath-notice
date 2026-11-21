// Two players in one browser: proximity voice (fake microphones) and text chat.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs'; import path from 'path';
const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const ctx = await browser.newContext({ viewport: { width: 800, height: 450 } });
await ctx.route('**/*', async route => {
  const u = route.request().url();
  if (u.startsWith('https://cdn.jsdelivr.net/npm/three@0.170.0/')) { const f = path.join(root, 'node_modules/three', u.replace('https://cdn.jsdelivr.net/npm/three@0.170.0/', '')); return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(f) }); }
  if (u.includes('fonts.googleapis') || u.includes('fonts.gstatic')) return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
  return route.continue();
});
const logs = []; const pages = {};
for (const n of ['A', 'B']) { const p = await ctx.newPage(); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(n + ' ' + m.type() + ': ' + m.text()); }); p.on('pageerror', e => logs.push(n + ' PAGEERROR: ' + e.message + '\n' + e.stack)); pages[n] = p; }
const { A, B } = pages; const url = 'file://' + root + '/index.html?net=local#dev';
for (const p of [A, B]) { await p.goto(url); await p.waitForFunction(() => !document.getElementById('start').hidden || document.getElementById('err').textContent.length > 0, null, { timeout: 300000 }); await p.evaluate(() => { window.__NR = true; }); }
console.log('loaded');
for (const p of [A, B]) await p.evaluate(() => { window.__NR = true; window.__NODET = true; window.__bn.applyQ('low'); });
const ev = (p, f, a) => p.evaluate(f, a); const wait = ms => new Promise(r => setTimeout(r, ms));
const log = (k, v) => console.log(k.padEnd(14), JSON.stringify(v));
const until = async (p, f, ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(f)) return true; await wait(150); } return false; };
const shot = async (p, name) => { await p.evaluate(() => { window.__NR = false; }); await wait(2500); await p.screenshot({ path: root + '/test/' + name + '.png', timeout: 150000 }); await p.evaluate(() => { window.__NR = true; }); };


// lobby: both get a mic and a voice connection to each other
await A.click('#goMP'); await A.click('#mpCreate');
await until(A, () => !!window.__bn.NET.me);
const code = await ev(A, () => document.getElementById('mpRoomCode').textContent); log('room', code);
await B.click('#goMP'); await B.fill('#mpCode', code); await B.click('#mpJoin');
log('B found host', await until(B, () => !!window.__bn.NET.hostId));
const vcInfo = p => ev(p, () => { const V = window.__VC(); return { mic: !!V.stream, pcs: Object.values(V.pcs).map(P => P.pc.connectionState), rem: Object.keys(V.rem).length, chip: document.querySelector('#mpVc .vct').textContent }; });
log('mic+conn', [await until(A, () => Object.values(window.__VC().pcs).some(P => P.pc.connectionState === 'connected'), 30000), await until(B, () => Object.keys(window.__VC().rem).length > 0, 30000)]);
log('A voice', await vcInfo(A)); log('B voice', await vcInfo(B));
log('B hears A', await until(B, () => Object.values(window.__VC().rem).some(R => R.lvl > .05), 15000));
await ev(A, () => window.__bn.mpPick('dad')); await wait(300); await ev(B, () => window.__bn.mpPick('bear'));
await until(A, () => window.__bn.NET.slots.bear && window.__bn.NET.slots.dad);
await A.click('#mpStart');
log('both kitchen', [await until(A, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'kitchen', 90000), await until(B, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'kitchen', 90000)]);
await wait(1500); await ev(B, () => { document.getElementById('resume').click(); }); await wait(800);
const tp = (p, x, y, z) => ev(p, ([x, y, z]) => { const L = window.__bn.leader; L.pos.set(x, y, z); L.vel.set(0, 0, 0); L.climbing = false; L.mantle = null; }, [x, y, z]);
const gainOnB = () => ev(B, () => { const R = Object.values(window.__VC().rem)[0]; return R ? [+R.g.gain.value.toFixed(2), Math.round(R.lp.frequency.value), +R.wallK.toFixed(2)] : null; });
// close together, then across the kitchen, then A in the wall (another room)
await tp(A, 100, 0, 0); await tp(B, 130, 0, 10); await wait(2500); log('near', await gainOnB());
await tp(A, -250, 0, -200); await tp(B, 600, 0, 200); await wait(2500); log('far', await gainOnB());
await tp(A, 100, 0, 0); await wait(400); log('A in wall', await ev(A, () => { const b = window.__bn, Z = b.W.ZONES.wall, c = Z.core[0]; const L = b.leader; L.pos.set((c[0] + c[1]) / 2, Z.floor, (c[4] + c[5]) / 2); L.vel.set(0, 0, 0); b.step(3); return [L.pos.toArray().map(v => Math.round(v)), b.W.zoneAt(L.pos) && b.W.zoneAt(L.pos).id]; })); await tp(B, -290, 0, -96); await wait(3000); log('other room', await gainOnB());
// text chat
await ev(A, () => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter' })); }); await wait(300);
log('chat open', await ev(A, () => !document.getElementById('chatIn').hidden));
await A.fill('#chatIn', '喂，我喺牆入面！'); await A.press('#chatIn', 'Enter'); await wait(1200);
log('B got chat', await ev(B, () => [document.getElementById('chatLog').textContent, !!document.getElementById('bub-dad')]));
log('A chat closed', await ev(A, () => [document.getElementById('chatIn').hidden, window.__bn.state]));
// mute
await ev(A, () => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm' }))); await wait(1500);
log('A muted', await ev(A, () => [window.__VC().muted, window.__VC().track.enabled, document.querySelector('#mpChip .vcmic').className]));
log('B sees A muted', await ev(B, () => [Object.values(window.__VC().peerMic), document.getElementById('pm-dad').className]));
await shot(B, 'v1_voice');
console.log(logs.slice(0, 30).join('\n'));
await browser.close();
