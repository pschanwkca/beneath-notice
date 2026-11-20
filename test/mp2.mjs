// Two players in one browser (BroadcastChannel transport): lobby → kitchen → living room → vent opens,
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
await A.click('#goMP'); await A.click('#mpCreate');
await until(A, () => !!window.__bn.NET.me);
const code = await ev(A, () => document.getElementById('mpRoomCode').textContent); log('room', code);
await B.click('#goMP'); await B.fill('#mpCode', code); await B.click('#mpJoin');
log('B found host', await until(B, () => !!window.__bn.NET.hostId));
await ev(A, () => window.__bn.mpPick('dad')); await wait(300); await ev(B, () => window.__bn.mpPick('bear'));
await until(A, () => window.__bn.NET.slots.bear && window.__bn.NET.slots.dad);
await A.click('#mpStart');
log('both kitchen', [await until(A, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'kitchen', 90000), await until(B, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'kitchen', 90000)]);
await wait(1500);
log('mode A/B', [await ev(A, () => [window.__bn.KS.mp, document.getElementById('qt').textContent, window.__bn.KS.core.visible, window.__bn.KS.grate.g.visible]), await ev(B, () => [window.__bn.KS.mp, document.getElementById('qt').textContent, window.__bn.W.LIV.parts.map(p => p.g.visible).join()])]);
await ev(B, () => { document.getElementById('resume').click(); }); await wait(1200);
// Esc menu on the client shows the room code
await ev(B, () => window.__bn.pauseNow()); await wait(300);
log('B pause', await ev(B, () => [!document.getElementById('pause').hidden, !document.getElementById('pauseMP').hidden, document.getElementById('pauseCode').textContent]));
await shot(B, 'mp5_pause');
await ev(B, () => document.getElementById('resume').click()); await wait(800);
// the client picks up the three parts
for (const [i, p] of [[0, [44, 88.5, -212]], [1, [-122, 76, 116]], [2, [-112, 13, -186]]]) { await ev(B, (p) => { const L = window.__bn.leader; L.pos.set(p[0], p[1], p[2]); L.vel.set(0, 0, 0); }, p); await wait(900); }
log('parts', [await until(A, () => window.__bn.W.LIV.partsGot === 3, 8000), await ev(A, () => [window.__bn.quest, document.getElementById('qt').textContent]), await until(B, () => window.__bn.quest === 1, 5000)]);
// the bear (client) shoves the door wedge away
await ev(B, () => { const b = window.__bn; const L = b.leader; L.pos.set(289, 0, -64.4); L.yaw = 0; L.vel.set(0, 0, 0); }); await wait(500);
await ev(B, () => window.__bn.bearShove()); await wait(400); await ev(B, () => window.__bn.bearShove());
log('door', [await until(A, () => window.__bn.W.LIV.open, 8000), await until(B, () => window.__bn.W.LIV.open, 8000), await ev(A, () => window.__bn.quest)]);
// everyone walks into the living room
await ev(A, () => { const L = window.__bn.leader; L.pos.set(360, 0, -10); L.vel.set(0, 0, 0); });
await ev(B, () => { const L = window.__bn.leader; L.pos.set(366, 0, 0); L.vel.set(0, 0, 0); });
log('in living', await until(A, () => window.__bn.quest === 3, 8000));
log('positions', await ev(A, () => { const b = window.__bn; return [b.state, b.LEVEL, b.quest, b.chars.dad.pos.toArray().map(v => +v.toFixed(1)), b.chars.bear.pos.toArray().map(v => +v.toFixed(1)), b.chars.bear.frozen, Object.keys(b.NET.slots).filter(k => b.NET.slots[k])]; }));
await ev(B, () => { const b = window.__bn; const r = b.W.LIV.remote; const L = b.leader; L.pos.set(r.cx + 1, r.y0 + r.sy, r.cz); L.vel.set(0, 0, 0); });
log('remote', [await until(A, () => window.__bn.W.LIV.remoteGot && window.__bn.quest === 4, 8000), await until(B, () => window.__bn.quest === 4, 5000)]);
log('vent open', [await until(A, () => window.__bn.W.LIV.ventCol.y0 < -900, 8000), await until(B, () => window.__bn.W.LIV.ventCol.y0 < -900, 8000)]);
console.log(logs.slice(0, 30).join('\n'));
await browser.close();
