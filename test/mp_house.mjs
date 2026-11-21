// Two players: the living house in chapter one — family brain sync, switches from a client,
// parts in any order (one in the bathroom), door and remote early, checklist.
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
const code = await ev(A, () => document.getElementById('mpRoomCode').textContent);
await B.click('#goMP'); await B.fill('#mpCode', code); await B.click('#mpJoin');
await until(B, () => !!window.__bn.NET.hostId);
await ev(A, () => window.__bn.mpPick('dad')); await wait(300); await ev(B, () => window.__bn.mpPick('bear'));
await until(A, () => window.__bn.NET.slots.bear && window.__bn.NET.slots.dad);
await A.click('#mpStart');
log('both kitchen', [await until(A, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'kitchen', 90000), await until(B, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'kitchen', 90000)]);
await wait(1500); await ev(B, () => { document.getElementById('resume').click(); }); await wait(800);
await ev(A, () => { window.__NODET = true; }); await ev(B, () => { window.__NODET = true; });
const tp = (p, x, y, z) => ev(p, ([x, y, z]) => { const L = window.__bn.leader; L.pos.set(x, y, z); L.vel.set(0, 0, 0); L.climbing = false; L.mantle = null; }, [x, y, z]);
log('checklist', await ev(B, () => [!document.getElementById('qck').hidden, document.getElementById('qck').textContent]));
// the daughter goes to the bathroom: the client sees her walk there
await ev(A, () => { const K = window.__bn.HB.k; K.need.bath = 3; K.q = []; K.cur = null; K.last = ['x', 'y', 'z']; });
await wait(5000);
log('kid sync', await Promise.all([A, B].map(p => ev(p, () => { const P = window.__bn.KID.root.position; return [Math.round(P.x), Math.round(P.z), window.__bn.KID.pose]; }))));
// the client switches the kitchen lights off; Mom comes and switches them back on
await ev(B, () => { const L = window.__bn.leader; L.pos.set(300 - L.r - .05, 113, -82); L.vel.set(0, 0, 0); L.climbing = true; L.climbN.set(-1, 0, 0); L.stamina = 100; }); await wait(300);
log('B near', await ev(B, () => { const o = window.__bn.HX.near; return o && o.id; }));
await B.keyboard.press('e'); await wait(1200);
log('lights off', await Promise.all([A, B].map(p => ev(p, () => window.__bn.HX.id.klight.on))));
log('mom fixes', [await until(A, () => window.__bn.HX.id.klight.on, 25000), await until(B, () => window.__bn.HX.id.klight.on, 4000)]);
log('household', await ev(A, () => [+window.__bn.HB.sus.toFixed(2), window.__bn.HB.m.act]));
// the client flushes the toilet from the top of the cistern: Mom comes to look
await ev(B, () => { const L = window.__bn.leader; L.climbing = false; L.pos.set(392, 79, -462); L.vel.set(0, 0, 0); }); await wait(600);
log('B at cistern', await ev(B, () => { const o = window.__bn.HX.near; return o && o.id; }));
await B.keyboard.press('e'); await wait(1500);
log('flush → mom', await ev(A, () => [window.__bn.HB.m.act, +window.__bn.HB.sus.toFixed(2)]));
log('eye text', await ev(B, () => document.getElementById('eyet').textContent));
// open the living-room door before the parts are done
await ev(A, () => window.__bn.doorOpen()); await wait(800);
log('door early', await ev(B, () => [window.__bn.W.LIV.open, window.__bn.quest, document.getElementById('qck').textContent]));
// the remote's batteries, early (client)
await ev(B, () => { const r = window.__bn.W.LIV.remote; const L = window.__bn.leader; L.pos.set(r.cx, r.y0 + 2, r.cz); L.vel.set(0, 0, 0); });
log('remote early', [await until(A, () => window.__bn.W.LIV.remoteGot, 6000), await ev(A, () => window.__bn.quest)]);
// upstairs: the client winds the music box in the daughter's room; someone in the family comes up to stop it (synced floor height)
await ev(B, () => { const L = window.__bn.leader; L.climbing = false; L.mantle = null; L.pos.set(722, 380.2, -214); L.vel.set(0, 0, 0); }); await wait(700);
log('B by music box', await ev(B, () => { const o = window.__bn.HX.near; return o && o.id; }));
await B.keyboard.press('e'); await wait(1200);
log('music on', await Promise.all([A, B].map(p => ev(p, () => window.__bn.HX.id.umusic.on))));
await ev(B, () => { const L = window.__bn.leader; L.pos.set(380, 300.2, 150); L.vel.set(0, 0, 0); });   // hide under the bed
log('family upstairs (seen on B)', await until(B, () => Math.max(window.__bn.KID.root.position.y, window.__bn.mom.pos.y) > 250, 45000));
log('who', await ev(B, () => [Math.round(window.__bn.KID.root.position.y), Math.round(window.__bn.mom.pos.y), document.getElementById('eyet').textContent]));
log('music stopped', [await until(A, () => !window.__bn.HX.id.umusic.on, 40000), await until(B, () => !window.__bn.HX.id.umusic.on, 4000)]);
// the three parts: one each, the lens from the bathroom cabinet
for (const [p, i] of [[A, 0], [B, 1], [A, 2]]) { await ev(p, i => { const q = window.__bn.W.LIV.parts[i]; const L = window.__bn.leader; L.pos.set(q.x, q.y + 1, q.z); L.vel.set(0, 0, 0); }, i); await wait(1500); }
log('parts', await ev(A, () => [window.__bn.W.LIV.parts.map(p => p.kind + ':' + (p.got ? 1 : 0)).join(' '), window.__bn.quest]));
// everyone into the living room → straight on to the vent
await tp(A, 600, 0, 60); await tp(B, 620, 0, 60);
log('to the vent', [await until(A, () => window.__bn.quest === 4, 8000), await until(B, () => window.__bn.quest === 4, 8000), await ev(B, () => document.getElementById('qck').hidden)]);
console.log(logs.slice(0, 30).join('\n'));
await browser.close();
