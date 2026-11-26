// Two players in one browser (BroadcastChannel transport): lobby → hub → kitchen,
// movement/NPC sync, toy freeze + rescue, cross-player stacking, Prototype from a client.
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
// both in the living room, a little apart
await tp(A, 600, 0, 40); await tp(B, 640, 0, 60); await wait(1500);
for (const p of [A, B]) await ev(p, () => { window.__bn.cam.yaw = Math.PI * .5; });
await ev(B, () => window.__bn.toyFreeze('mom'));
log('names', await Promise.all([A, B].map(p => ev(p, () => [...document.querySelectorAll('#party .pm')].map(el => el.dataset.id + ':' + el.querySelector('b').textContent)))));
log('B a toy', [await until(A, () => window.__bn.chars.bear.frozen, 8000), await until(B, () => window.__bn.chars.bear.frozen, 8000)]);
log('soul out', await until(B, () => window.__bn.GHOST.on && window.__bn.GHOST.t > 1.5, 20000));
await shot(B, 'gh_' + tag + '_soul');
// float forward (the camera looks along -x at yaw π/2) for a while: the cord holds
log('dbg', await ev(B, () => { const b = window.__bn; return [document.activeElement && document.activeElement.tagName, b.PAUSED, b.state, b.GHOST.on, b.GHOST.t.toFixed(1), typeof b.keys, !!b.WATCH && b.WATCH.id]; }));
await ev(B, () => { window.__bn.keys.KeyW = true; });
await wait(9000);
await ev(B, () => { window.__bn.keys.KeyW = false; });
log('blockers', await ev(B, () => { const b = window.__bn, P = b.GHOST.p, out = []; for (const c of b.W.colsNear(P.x, P.y, P.z)) { if (c.t !== 'b') continue; if (P.x > c.x0 - 3 && P.x < c.x1 + 3 && P.y > c.y0 - 3 && P.y < c.y1 + 3 && P.z > c.z0 - 3 && P.z < c.z1 + 3) out.push([c.x0, c.x1, c.y0, c.y1, c.z0, c.z1].map(Math.round)); } return [P.toArray().map(Math.round), out.slice(0, 6), b.GHOST.v.toArray().map(v => +v.toFixed(1))]; }));
log('cord', await ev(B, () => { const b = window.__bn, G = b.GHOST, C = b.leader; return [Math.round(G.p.distanceTo(C.pos)), G.p.toArray().map(Math.round)]; }));
await shot(B, 'gh_' + tag + '_far');
// the soul reaches A's screen
log('A sees soul', await until(A, () => { const r = window.__bn.GHOST.remote.bear; return !!r && performance.now() - r.t < 2000; }, 6000));
// 我喺度！
await ev(B, () => { window.__bn.GHOST.pingCd = 0; window.__bn.ghostPing(); });
log('A hears ping', await until(A, () => /我喺度/.test(document.getElementById('toast').textContent), 6000));
await ev(A, () => { const b = window.__bn, C = b.chars.bear; b.cam.yaw = Math.atan2(b.leader.pos.x - C.pos.x, b.leader.pos.z - C.pos.z); });
await shot(A, 'gh_' + tag + '_seen');
// watching a teammate, then back
await wait(600); await shot(B, 'gh_' + tag + '_row');
// tap A's portrait in the row
await ev(B, () => { const b = document.querySelector('#specRow .sw[data-id="dad"]'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
await wait(1200);
log('watching', await ev(B, () => [window.__bn.WATCH.id, [...document.querySelectorAll('#specRow .sw')].map(b => b.dataset.id + (b.classList.contains('on') ? '*' : ''))]));
await shot(B, 'gh_' + tag + '_watch');
// tap yourself: back to the soul
await ev(B, () => { const b = document.querySelector('#specRow .sw.me'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
await wait(600);
log('back', await ev(B, () => [window.__bn.WATCH.id, [...document.querySelectorAll('#specRow .sw')].map(b => b.dataset.id + (b.classList.contains('on') ? '*' : ''))]));
// rescue: the soul drops back in
for (let i = 0; i < 20; i++) { await ev(A, () => { const b = window.__bn, C = b.chars.bear; b.leader.pos.set(C.pos.x + 2.5, C.pos.y, C.pos.z); b.leader.vel.set(0, 0, 0); }); await wait(250); if (!(await ev(A, () => window.__bn.chars.bear.frozen))) break; }
log('rescued', [await until(B, () => !window.__bn.chars.bear.frozen, 12000), await until(B, () => !window.__bn.GHOST.on, 4000), await ev(B, () => +window.__bn.grade.uniforms.uGhost.value.toFixed(2))]);
console.log(logs.filter(l => !/GPU stall|GL Driver/.test(l)).slice(0, 20).join('\n'));
await browser.close();
