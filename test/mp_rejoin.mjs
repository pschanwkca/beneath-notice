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
log('slots', await ev(A, () => { const N = window.__bn.NET; return Object.fromEntries(Object.entries(N.slots).map(([k, v]) => [k, v ? (v === N.me ? 'A' : 'B') : null])); }));
log('start btn', await ev(A, () => [document.getElementById('mpStart').disabled, document.getElementById('mpStart').textContent]));
await A.click('#mpStart');
log('both in hub', [await until(A, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'wall', 60000), await until(B, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'wall', 60000)]);
log('leaders', [await ev(A, () => window.__bn.leader.id), await ev(B, () => window.__bn.leader.id)]);
await ev(B, () => { document.getElementById('resume').click(); }); await wait(1600); log('B paused', await ev(B, () => !document.getElementById('pause').hidden));

await ev(B, () => { document.getElementById('resume').click(); });
await ev(A, () => { const L = window.__bn.leader; L.pos.set(0, 280, -6); });
log('kitchen', [await until(A, () => window.__bn.LEVEL === 'kitchen' && window.__bn.state === 'play', 60000), await until(B, () => window.__bn.LEVEL === 'kitchen' && window.__bn.state === 'play', 60000)]);
await wait(1500);
await ev(B, () => { const L = window.__bn.leader; L.pos.set(60, 0, -60); L.vel.set(0, 0, 0); L.stamMax = 80; });
await wait(1200);
// B drops: reload the tab with the invite link
await B.goto('file://' + root + '/index.html?room=' + code + '&net=local#dev');
log('A after drop', await until(A, () => !window.__bn.NET.slots.bear && window.__bn.chars.bear.owner === window.__bn.NET.me, 15000));
log('A toast', await ev(A, () => document.getElementById('toast').textContent));
log('B back in game', await until(B, () => window.__bn && window.__bn.state === 'play' && window.__bn.LEVEL === 'kitchen', 300000));
await ev(B, () => { window.__NR = true; window.__NODET = true; window.__bn.applyQ('low'); });
await wait(1500);
log('B is bear', await ev(B, () => { const b = window.__bn; return [b.leader.id, b.chars.bear.owner === b.NET.me, b.leader.pos.toArray().map(v => +v.toFixed(0)), b.leader.stamMax]; }));
log('A sees B', await ev(A, () => { const b = window.__bn; return [b.NET.slots.bear === b.chars.bear.owner, b.chars.bear.owner !== b.NET.me, document.getElementById('toast').textContent]; }));
await ev(B, () => { document.getElementById('resume').click(); });
await ev(B, () => { const L = window.__bn.leader; L.pos.set(40, 0, -40); });
await wait(1000);
log('A sees move', await ev(A, () => window.__bn.chars.bear.pos.toArray().map(v => +v.toFixed(0))));
// a new friend joins mid-game and takes 小彩
const C = await ctx.newPage(); C.on('pageerror', e => logs.push('C PAGEERROR: ' + e.message));
await C.goto('file://' + root + '/index.html?room=' + code + '&net=local#dev');
await C.waitForFunction(() => window.__bn && window.__bn.NET.remoteStarted, null, { timeout: 300000 });
await C.evaluate(() => { window.__NR = true; window.__NODET = true; window.__bn.applyQ('low'); });
log('C lobby', await ev(C, () => document.getElementById('mpStatus').textContent));
await ev(C, () => window.__bn.mpPick('cham'));
log('C in game', await until(C, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'kitchen', 300000));
await wait(1500);
log('C is cham', await ev(C, () => [window.__bn.leader.id, window.__bn.chars.cham.owner === window.__bn.NET.me]));
log('A slots', await ev(A, () => { const N = window.__bn.NET; return Object.values(N.slots).map(v => v ? (v === N.me ? 'A' : 'peer') : null); }));
console.log('--- logs ---\n' + logs.filter(l => !l.includes('GL Driver') && !l.includes('GPU stall')).slice(0, 30).join('\n'));
await browser.close();
