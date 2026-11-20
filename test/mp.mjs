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
await shot(B, 'mp1_lobby');
await A.click('#mpStart');
log('both in hub', [await until(A, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'wall', 60000), await until(B, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'wall', 60000)]);
log('leaders', [await ev(A, () => window.__bn.leader.id), await ev(B, () => window.__bn.leader.id)]);
await ev(B, () => { document.getElementById('resume').click(); }); await wait(1600); log('B paused', await ev(B, () => !document.getElementById('pause').hidden));

// movement sync both ways
await ev(A, () => { const L = window.__bn.leader; L.pos.set(10, 4, 0); });
await ev(B, () => { const L = window.__bn.leader; L.pos.set(-20, 4, 6); });
await wait(1200);
log('B sees dad', await ev(B, () => window.__bn.chars.dad.pos.toArray().map(v => +v.toFixed(1))));
log('A sees bear', await ev(A, () => window.__bn.chars.bear.pos.toArray().map(v => +v.toFixed(1))));
log('AI sq owner', [await ev(A, () => window.__bn.chars.sq.owner === window.__bn.NET.me), await ev(B, () => window.__bn.chars.sq.owner === window.__bn.NET.hostId)]);

// host moves everyone on to the kitchen
await ev(A, () => { const L = window.__bn.leader; L.pos.set(0, 280, -6); });
log('kitchen', [await until(A, () => window.__bn.LEVEL === 'kitchen' && window.__bn.state === 'play', 60000), await until(B, () => window.__bn.LEVEL === 'kitchen' && window.__bn.state === 'play', 60000)]);
await wait(2500);
log('mom A/B', [await ev(A, () => window.__bn.mom.pos.toArray().map(v => +v.toFixed(0))), await ev(B, () => window.__bn.mom.pos.toArray().map(v => +v.toFixed(0)))]);
log('cat A/B', [await ev(A, () => [window.__bn.CAT.mode, Math.round(window.__bn.CAT.pos.x)]), await ev(B, () => [window.__bn.CAT.mode, Math.round(window.__bn.CAT.pos.x)])]);

// bear (B) gets seen → becomes a toy on both screens; Mom tidies it
await ev(B, () => { const L = window.__bn.leader; L.pos.set(60, 0, -60); });
await wait(400);
await ev(B, () => window.__bn.toyFreeze('mom'));
log('frozen A/B', [await until(A, () => window.__bn.chars.bear.frozen, 5000), await until(B, () => window.__bn.chars.bear.frozen, 5000)]);
log('B hint', await ev(B, () => document.getElementById('hint').textContent));
log('to box', await until(A, () => window.__bn.chars.bear.toyAt === 'box', 40000));
await wait(800);
log('B sees box', await ev(B, () => [window.__bn.chars.bear.toyAt, window.__bn.chars.bear.pos.toArray().map(v => +v.toFixed(0))]));
// dad (A) climbs in and shakes him awake
await ev(A, () => { const b = window.__bn.chars.bear; const L = window.__bn.leader; L.pos.set(b.pos.x + 2, b.pos.y, b.pos.z + 1); L.vel.set(0, 0, 0); });
log('rescued', await until(B, () => !window.__bn.chars.bear.frozen && window.__bn.chars.bear.owner === window.__bn.NET.me, 8000));
log('B can move', await ev(B, async () => { const b = window.__bn; const L = b.leader; const x0 = L.pos.x; b.keys.KeyD = true; await new Promise(r => setTimeout(r, 600)); b.keys.KeyD = false; return +(Math.abs(L.pos.x - x0) + Math.abs(L.pos.z - L.pos.z)).toFixed(1); }));

// stacking across players: dad (A) uses bear (B) + the AI squirrel to get into the sink cupboard
await ev(B, () => { const L = window.__bn.leader; L.pos.set(-104, 0, -153); L.vel.set(0, 0, 0); });
await ev(A, () => { const L = window.__bn.leader; L.pos.set(-100, 0, -156); L.yaw = Math.PI; L.vel.set(0, 0, 0); const s = window.__bn.chars.sq; s.pos.set(-96, 0, -153); s.disp.copy(s.pos); s.queue = []; });
await wait(600);
await ev(A, () => window.__bn.press('KeyF')); await wait(200);
log('stack A', await ev(A, () => window.__bn.STK && [window.__bn.STK.mem.map(c => c.id), window.__bn.STK.ok, window.__bn.STK.ledge, window.__bn.leader.pos.toArray().map(v => +v.toFixed(1))]));
await wait(1600);
log('B bear in tower', await ev(B, () => [window.__bn.chars.bear.state, window.__bn.chars.bear.owner === window.__bn.NET.hostId, document.getElementById('hint').textContent]));
await ev(A, () => { window.__bn.keys.KeyW = true; }); await wait(300); await ev(A, () => { window.__bn.keys.KeyW = false; });
await wait(900); await shot(B, 'mp2_pull');
log('stack done', await until(A, () => !window.__bn.STK, 15000));
log('A after', await ev(A, () => ['dad','bear','sq'].map(id => [id, window.__bn.chars[id].pos.toArray().map(v => +v.toFixed(1))])));
await wait(800);
log('positions', await ev(B, () => ['dad', 'bear', 'sq'].map(id => [id, +window.__bn.chars[id].pos.y.toFixed(1)])));
log('bear back to B', await ev(B, () => window.__bn.chars.bear.owner === window.__bn.NET.me));
await shot(A, 'mp3_inside');

// Prototype used by the client on the host's frozen dad
await ev(A, () => window.__bn.toyFreeze('kid'));
await until(B, () => window.__bn.chars.dad.frozen, 5000);
const p0 = await ev(A, () => window.__bn.PROTO);
await ev(B, () => window.__bn.press('KeyR'));
log('proto revive', [await until(A, () => !window.__bn.chars.dad.frozen, 5000), p0, await ev(A, () => [window.__bn.PROTO, window.__bn.chars.dad.stamMax])]);
log('B sees dad cap', await ev(B, async () => { await new Promise(r => setTimeout(r, 600)); return window.__bn.chars.dad.stamMax; }));
await shot(B, 'mp4_play');

console.log('--- logs ---\n' + logs.filter(l => !l.includes('GL Driver') && !l.includes('GPU stall')).slice(0, 40).join('\n'));
await browser.close();
