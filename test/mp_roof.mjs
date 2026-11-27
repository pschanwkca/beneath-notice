// Two players: the roof route to the garage online (the attic hatch opens with the vent), the markers along it,
// and only being inside the garage counts.
import { chromium, devices } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs'; import path from 'path';
const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const PHONE = process.env.DEV === 'phone';
const ctx = await browser.newContext(PHONE ? { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent } : { viewport: { width: 1280, height: 720 } });
await ctx.route('**/*', async route => {
  const u = route.request().url();
  if (u.startsWith('https://cdn.jsdelivr.net/npm/three@0.170.0/')) { const f = path.join(root, 'node_modules/three', u.replace('https://cdn.jsdelivr.net/npm/three@0.170.0/', '')); return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(f) }); }
  if (u.includes('fonts.googleapis') || u.includes('fonts.gstatic')) return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
  return route.continue();
});
await ctx.addInitScript(process.env.INIT || 'window.__NR=true;');
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


// lobby
await A.evaluate(() => document.getElementById('goMP').click()); await A.evaluate(() => { const e = document.getElementById('mpName'); e.value = 'Jason'; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }); await A.evaluate(() => document.getElementById('mpCreate').click());
await until(A, () => !!window.__bn.NET.me);
const code = await ev(A, () => document.getElementById('mpRoomCode').textContent); log('room', code);
await B.evaluate(() => document.getElementById('goMP').click()); await B.evaluate(() => { const e = document.getElementById('mpName'); e.value = 'Kiki'; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }); await B.evaluate(v => { document.getElementById('mpCode').value = v; }, code); await B.evaluate(() => document.getElementById('mpJoin').click());
log('B found host', await until(B, () => !!window.__bn.NET.hostId));
await ev(A, () => window.__bn.mpPick('dad')); await wait(300); await ev(B, () => window.__bn.mpPick('bear'));
await until(A, () => window.__bn.NET.slots.bear && window.__bn.NET.slots.dad);
await A.evaluate(() => document.getElementById('mpStart').click());
await until(A, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'portal', 90000); await until(B, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'portal', 90000);
await ev(A, () => window.__bn.proSkip()); await ev(B, () => window.__bn.proSkip());
log('both kitchen', [await until(A, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'kitchen', 90000), await until(B, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'kitchen', 90000)]);
await wait(1500); await ev(B, () => { document.getElementById('resume').click(); }); await wait(800);

const tp = (p, x, y, z) => ev(p, ([x, y, z]) => { const L = window.__bn.leader; L.pos.set(x, y, z); L.vel.set(0, 0, 0); L.climbing = false; L.mantle = null; }, [x, y, z]);
const mk = p => ev(p, () => { const m = window.__bn.W.mpMarker(); return m ? m.toArray().map(Math.round) : null; });
await ev(A, () => window.__bn.setQuest(4)); await wait(1500);
log('quest 4', [await ev(A, () => window.__bn.quest), await ev(B, () => window.__bn.quest)]);
log('hatch open', [await until(A, () => window.__bn.RF.open, 6000), await until(B, () => window.__bn.RF.open, 6000)]);
log('quest text', await ev(B, () => document.getElementById('quest').textContent.slice(0, 60)));
// B takes the long way: her room under the hatch → the attic → the roof → the garage roof
await tp(B, 820, 300, 60); await wait(1200); log('B upstairs', await mk(B));
await tp(B, 700, 560, 0); await wait(1500); log('B attic', [await ev(B, () => window.__bn.LEVEL), await mk(B)]);
await tp(B, 400, 640, -120); await wait(1500); log('B roof', [await ev(B, () => window.__bn.LEVEL), await mk(B)]);
await tp(B, 600, 300, -330); await wait(1500); log('B lean-to', [await ev(B, () => window.__bn.LEVEL), await mk(B)]);
// A in the garage, B on the garage roof: not yet
await tp(A, 1100, -20, 0); await tp(B, 1100, 400, 100); await wait(2500);
log('roof ≠ garage', await ev(A, () => window.__bn.quest));
await tp(B, 1120, -20, 20); await wait(2500);
log('both in garage', [await until(A, () => window.__bn.quest === 5, 6000), await until(B, () => window.__bn.quest === 5, 6000)]);
log('errors', logs.filter(l => /PAGEERROR/.test(l)).slice(0, 6));
await browser.close();
