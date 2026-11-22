// Two players in one browser (BroadcastChannel transport): lobby → hub → kitchen,
// movement/NPC sync, toy freeze + rescue, cross-player stacking, Prototype from a client.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs'; import path from 'path';
const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const ctx = await browser.newContext({ viewport: { width: 800, height: 450 } });
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
await A.evaluate(() => document.getElementById('goMP').click()); await A.evaluate(() => document.getElementById('mpCreate').click());
await until(A, () => !!window.__bn.NET.me);
// lobby
await until(A, () => !!window.__bn.NET.me);
const code = await ev(A, () => document.getElementById('mpRoomCode').textContent); log('room', code);
await B.evaluate(() => document.getElementById('goMP').click()); await B.evaluate(v => { document.getElementById('mpCode').value = v; }, code); await B.evaluate(() => document.getElementById('mpJoin').click());
log('B found host', await until(B, () => !!window.__bn.NET.hostId));
await ev(A, () => window.__bn.mpPick('dad')); await wait(300); await ev(B, () => window.__bn.mpPick('bear'));
await until(A, () => window.__bn.NET.slots.bear && window.__bn.NET.slots.dad);
await A.evaluate(() => document.getElementById('mpStart').click());
log('both portal', [await until(A, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'portal', 90000), await until(B, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'portal', 90000)]);
await wait(1500); await ev(B, () => { document.getElementById('resume').click(); }); await wait(500);
const info = p => ev(p, () => { const b = window.__bn; return [b.LEVEL, b.quest, document.getElementById('qt').textContent, b.PRO.on, b.leader.id, b.leader.pos.toArray().map(v => Math.round(v))]; });
log('A', await info(A)); log('B', await info(B));
log('B party', await ev(B, () => window.__bn.party ? window.__bn.party.map(C => C.id + ':' + C.pos.toArray().map(v => Math.round(v)).join(',')) : null));
const tp = (p, x, y, z) => ev(p, ([x, y, z]) => { const L = window.__bn.leader; L.pos.set(x, y, z); L.vel.set(0, 0, 0); L.climbing = false; L.mantle = null; L.grounded = false; }, [x, y, z]);
// host steps into the circle: 1 / 2
await ev(A, () => { const b = window.__bn, c = b.prC(); const L = b.leader; L.pos.set(c.x, c.y + .5, c.z); L.vel.set(0, 0, 0); });
await wait(1200);
log('half ready', [await ev(A, () => [window.__bn.PORT.rdy, window.__bn.PORT.tot]), await ev(B, () => [window.__bn.PORT.rdy, window.__bn.PORT.tot, document.getElementById('xtag').textContent])]);
await shot(B, 'mpp_portal');
await ev(B, () => { const b = window.__bn, c = b.prC(); const L = b.leader; L.pos.set(c.x + 4, c.y + .5, c.z + 3); L.vel.set(0, 0, 0); });
const outB = until(B, () => window.__bn.LEVEL === 'basement' && window.__bn.quest === 1, 40000);
log('out', [await until(A, () => window.__bn.LEVEL === 'basement' && window.__bn.quest >= 1, 90000), await outB]);
log('A after out', await info(A));
await wait(1500);
log('A', await info(A)); log('B', await info(B));
log('B sees A', await ev(B, () => window.__bn.chars.dad.pos.toArray().map(v => Math.round(v))));
await shot(B, 'mpp_bench');
// down to the floor → the crack → the wall → the kitchen
await tp(B, 153, -334, -379);
log('floor', [await until(A, () => window.__bn.quest === 2, 8000), await until(B, () => window.__bn.quest === 2 && document.getElementById('qt').textContent === '去牆腳的裂縫', 8000)]);
await tp(A, -252, -334, -79);
log('crack', [await until(A, () => window.__bn.quest === 3, 8000), await until(B, () => window.__bn.quest === 3 && window.__bn.PRO.gk, 8000)]);
await tp(A, -340, -334, -79);
log('wall', [await until(A, () => window.__bn.quest === 4, 8000), await until(B, () => window.__bn.quest === 4, 8000)]);
log('mom', await ev(A, () => [window.__bn.mom.mode, window.__bn.meter]));
await tp(A, -288, 2, -100);
log('kitchen', [await until(A, () => !window.__bn.PRO.on && window.__bn.quest === 0 && document.getElementById('qt').textContent === '找齊三個零件', 8000), await until(B, () => !window.__bn.PRO.on && document.getElementById('qt').textContent === '找齊三個零件', 8000)]);
log('A', await info(A)); log('B', await info(B));
// turned into a toy: look through the teammate's camera
await tp(B, -280, 2, -96); await wait(600);
await ev(A, () => window.__bn.hostFreeze(window.__bn.chars.bear, 'mom'));
log('B frozen', await until(B, () => window.__bn.leader.frozen, 8000));
await wait(600); await ev(B, () => { if (!document.getElementById('pause').hidden) document.getElementById('resume').click(); }); await wait(300); await ev(B, () => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Tab' }))); await wait(600);
log('watch', await ev(B, () => [window.__bn.WATCH.id, document.getElementById('spec').hidden, document.getElementById('specT').textContent]));
await shot(B, 'mpp_watch');
await ev(A, () => window.__bn.toyUnfreezeAll()); await until(B, () => !window.__bn.leader.frozen, 8000); await wait(500);
log('unwatch', await ev(B, () => [window.__bn.WATCH.id, document.getElementById('spec').hidden]));
console.log(logs.slice(0, 30).join('\n'));
await browser.close();
