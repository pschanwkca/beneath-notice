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
const code = await ev(A, () => document.getElementById('mpRoomCode').textContent); log('room', code);
await B.evaluate(() => document.getElementById('goMP').click()); await B.evaluate(v => { document.getElementById('mpCode').value = v; }, code); await B.evaluate(() => document.getElementById('mpJoin').click());
log('B found host', await until(B, () => !!window.__bn.NET.hostId));
await ev(A, () => window.__bn.mpPick('dad')); await wait(300); await ev(B, () => window.__bn.mpPick('bear'));
await until(A, () => window.__bn.NET.slots.bear && window.__bn.NET.slots.dad);
await A.evaluate(() => document.getElementById('mpStart').click());
await until(A, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'portal', 90000); await until(B, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'portal', 90000);
await ev(A, () => window.__bn.proSkip()); await ev(B, () => window.__bn.proSkip());
log('both kitchen', [await until(A, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'kitchen', 90000), await until(B, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'kitchen', 90000)]);
await wait(1500); await ev(B, () => { document.getElementById('resume').click(); }); await wait(800);
const tp = (p, x, y, z) => ev(p, ([x, y, z]) => { const L = window.__bn.leader; L.pos.set(x, y, z); L.vel.set(0, 0, 0); L.climbing = false; L.mantle = null; }, [x, y, z]);
// skip chapter 1: the host jumps to "battery taken"
await ev(A, () => { const b = window.__bn; b.W.LIV.remoteGot = true; b.setQuest(4); });
log('vent open', [await until(A, () => window.__bn.W.LIV.ventCol && window.__bn.W.LIV.ventCol.y0 < -900, 6000), await until(B, () => window.__bn.quest === 4 && window.__bn.W.LIV.ventCol.y0 < -900, 6000)]);
await tp(A, 1000, -20, -150); await tp(B, 1006, -20, -150);
log('garage', [await until(A, () => window.__bn.quest === 5 && window.__bn.LEVEL === 'garage', 8000), await until(B, () => window.__bn.LEVEL === 'garage' && window.__bn.quest === 5, 8000), await ev(B, () => [document.getElementById('chapA') && document.getElementById('chapA').textContent, document.getElementById('chapB').textContent])]);
await wait(1500);
log('agent sync', await Promise.all([A, B].map(p => ev(p, () => window.__bn.W.GS.agent.pos.toArray().map(v => +v.toFixed(0))))));
log('marker', await ev(B, () => { const m = window.__bn.W.mpMarker(); return m && m.toArray().map(v => +v.toFixed(0)); }));
// client shrinks the camera with the size gun stand-in: host sees it fall
await ev(A, () => { const G = window.__bn.W.GS; G.cam.y0 = 150; });
log('camera', [await until(A, () => window.__bn.quest === 6, 6000), await until(B, () => window.__bn.W.GS.camBroken && window.__bn.quest === 6, 6000)]);
// the client's head reaches the latch: host opens it
await ev(B, () => { const b = window.__bn, G = b.W.GS; const L = b.leader; L.pos.set(G.latchP.x, G.latchP.y - 4, G.latchP.z); L.vel.set(0, 0, 0); });
log('latch', [await until(A, () => window.__bn.W.GS.latch && window.__bn.quest === 7, 6000), await until(B, () => window.__bn.W.GS.latch, 6000)]);
await tp(A, 1480, -20, 105); await tp(B, 1486, -20, 112);
log('yard', [await until(A, () => window.__bn.quest === 8 && window.__bn.LEVEL === 'yard', 8000), await until(B, () => window.__bn.LEVEL === 'yard', 8000)]);
await tp(A, 2120, -20, 109); await tp(B, 2126, -20, 112);
log('gap', await until(A, () => window.__bn.quest === 9, 6000));
await wait(1200);
log('dog sync', await Promise.all([A, B].map(p => ev(p, () => [window.__bn.W.YS.dog.pos.toArray().map(v => +v.toFixed(0)), window.__bn.W.YS.dog.mode, window.__bn.W.YS.old.mode]))));
await tp(A, 2600, -8, 100); await tp(B, 2606, -8, 104);
log('sunroom', await until(A, () => window.__bn.quest === 10, 6000));
await ev(B, () => { const b = window.__bn, Y = b.W.YS; const L = b.leader; L.pos.set(Y.chipP.x, Y.chipP.y, Y.chipP.z); L.vel.set(0, 0, 0); });
log('chip', [await until(A, () => window.__bn.quest === 11, 8000), await until(B, () => window.__bn.quest === 11, 8000)]);
await tp(A, 2620, -20, 700); await tp(B, 2626, -20, 704);
log('pavement', [await until(A, () => window.__bn.quest === 12 && window.__bn.LEVEL === 'road', 8000), await until(B, () => window.__bn.LEVEL === 'road', 8000)]);
await ev(B, () => { const L = window.__bn.leader; L.pos.set(1960, 70, 772); L.vel.set(0, 0, 0); L.climbing = true; });
log('button', [await until(A, () => window.__bn.ST.pressed && window.__bn.quest === 13, 8000), await until(B, () => window.__bn.ST.req || window.__bn.ST.phase !== 'go', 8000)]);
await wait(1500);
log('car sync', await Promise.all([A, B].map(p => ev(p, () => window.__bn.ST.cars.filter(c => c.alive).map(c => [c.lane, Math.round(c.x / 50) * 50])))));
await tp(A, 2060, -20, 1560); await tp(B, 2066, -20, 1564);
log('crossed', await until(A, () => window.__bn.quest === 14, 8000));
await tp(A, 2060, -20, 1680); await tp(B, 2066, -20, 1684);
log('park/end', [await until(A, () => window.__bn.state === 'end', 8000), await until(B, () => window.__bn.state === 'end', 8000)]);
await wait(4000);
log('end card', await ev(B, () => [document.getElementById('endA').textContent, document.getElementById('end').hidden]));
console.log(logs.slice(0, 30).join('\n'));
await browser.close();
