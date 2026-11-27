// Two players in one browser (BroadcastChannel transport): one goes out to the garden, the other stays in;
// teammate tags (where, how far, edge arrows) and the 集合 call.
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
const tag = PHONE ? 'phone' : 'desk';
const tags = p => ev(p, () => [...document.querySelectorAll('.tt')].map(e => [e.className, e.textContent]));
// A in the living room; B out through the back door into the garden
await tp(A, 600, 0, 40); await tp(B, 640, 0, 60); await wait(1200);
log('close: no tag', await tags(A));
log('dbg', await ev(A, () => { const b = window.__bn, C = b.chars.bear, L = b.leader, Z = b.W.zoneAt; return [L.id, L.pos.toArray().map(Math.round), C.pos.toArray().map(Math.round), Z(L.pos) && Z(L.pos).id, Z(C.pos) && Z(C.pos).id, Math.round(L.pos.distanceTo(C.pos)), b.state]; }));
await tp(B, 690, -20, -720); await wait(2500);
log('levels', [await ev(A, () => window.__bn.LEVEL), await ev(B, () => window.__bn.LEVEL)]);
await ev(A, () => { window.__bn.cam.yaw = Math.PI * .5; }); await wait(800);
log('A sees B tag', await until(A, () => [...document.querySelectorAll('.tt.on')].some(e => /後花園/.test(e.textContent)), 6000), await tags(A));
await shot(A, 'tm_' + tag + '_edge');
// facing B's way: the tag over B (through the walls), not on the edge
await ev(A, () => { const b = window.__bn, C = b.chars.bear, L = b.leader; b.cam.yaw = Math.atan2(L.pos.x - C.pos.x, L.pos.z - C.pos.z); }); await wait(1200);
log('facing', await tags(A));
// B calls everyone over
await ev(B, () => window.__bn.press('KeyG')); await wait(300);
log('A hears call', await until(A, () => /集合/.test(document.getElementById('toast').textContent), 6000), await until(A, () => !!document.querySelector('.tt.call.on'), 4000));
await shot(A, 'tm_' + tag + '_call');
log('B tag of A', await tags(B));
log('errors', logs.filter(l => /PAGEERROR|error/.test(l)).slice(0, 6));
await browser.close();
