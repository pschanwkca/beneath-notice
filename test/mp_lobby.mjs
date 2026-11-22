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
const tp = (p, x, y, z) => ev(p, ([x, y, z]) => { const L = window.__bn.leader; L.pos.set(x, y, z); L.vel.set(0, 0, 0); L.climbing = false; L.mantle = null; L.grounded = false; }, [x, y, z]);
await ev(A, () => localStorage.removeItem('bn_mpsave1'));
// names before the room
await ev(A, () => { const e = document.getElementById('mpName'); e.value = 'Jason'; e.dispatchEvent(new Event('change')); });
await ev(B, () => { const e = document.getElementById('mpName'); e.value = 'Mei<b>'; e.dispatchEvent(new Event('change')); });
await A.evaluate(() => document.getElementById('goMP').click()); await A.evaluate(() => document.getElementById('mpCreate').click());
await until(A, () => !!window.__bn.NET.me);
const code = await ev(A, () => document.getElementById('mpRoomCode').textContent); log('room', code);
await B.evaluate(() => document.getElementById('goMP').click()); await B.evaluate(v => { document.getElementById('mpCode').value = v; }, code); await B.evaluate(() => document.getElementById('mpJoin').click());
log('B found host', await until(B, () => !!window.__bn.NET.hostId));
await ev(A, () => window.__bn.mpPick('dad')); await wait(300); await ev(B, () => window.__bn.mpPick('bear'));
await until(A, () => window.__bn.NET.slots.bear && window.__bn.NET.slots.dad); await wait(1200);
log('names A', await ev(A, () => window.__bn.NET.names)); log('names B', await ev(B, () => window.__bn.NET.names));
log('slots A', await ev(A, () => [...document.querySelectorAll('#mpSlots .mps em')].map(e => e.textContent).join(' | ')));
log('lobby', await ev(A, () => [window.__bn.LOBBY.on, [...document.querySelectorAll('.lbtag')].map(e => e.textContent).join(' | '), document.getElementById('mpSave').hidden]));
await shot(A, 'lobby_A'); await shot(B, 'lobby_B');
// rename in the room
await ev(B, () => { const e = document.getElementById('mpName2'); e.value = 'Mei'; e.dispatchEvent(new Event('change')); }); await wait(1200);
log('renamed', await ev(A, () => window.__bn.NET.names));
await ev(A, () => document.getElementById('mpStart').click());
log('both portal', [await until(A, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'portal', 90000), await until(B, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'portal', 90000)]);
log('label', await ev(A, () => window.__bn.W ? null : null));
log('tag A sees', await ev(A, () => { const b = window.__bn; return b.NET.names[b.NET.slots.bear]; }));
// some progress, then check the save
await ev(A, () => { const b = window.__bn, c = b.prC(); const L = b.leader; L.pos.set(c.x, c.y + .5, c.z); L.vel.set(0, 0, 0); });
await ev(B, () => { const b = window.__bn, c = b.prC(); const L = b.leader; L.pos.set(c.x + 4, c.y + .5, c.z + 3); L.vel.set(0, 0, 0); });
log('out', [await until(A, () => window.__bn.LEVEL === 'basement' && window.__bn.quest === 1, 60000), await until(B, () => window.__bn.quest === 1, 60000)]);
await tp(B, 153, -334, -379);
log('floor', await until(A, () => window.__bn.quest === 2, 60000));
await wait(800);
log('save', await ev(A, () => { const S = window.__bn.mpSaveLoad(); return S && [S.pro, S.q, S.cp, S.zone]; }));
// next session: both reload, the host carries on
for (const p of [A, B]) { await p.goto(url); await p.waitForFunction(() => !document.getElementById('start').hidden || document.getElementById('err').textContent.length > 0, null, { timeout: 300000 }); await p.evaluate(() => { window.__NR = true; window.__NODET = true; window.__bn.applyQ('low'); }); }
await A.evaluate(() => document.getElementById('goMP').click()); await A.evaluate(() => document.getElementById('mpCreate').click());
await until(A, () => !!window.__bn.NET.me);
const code2 = await ev(A, () => document.getElementById('mpRoomCode').textContent);
await B.evaluate(() => document.getElementById('goMP').click()); await B.evaluate(v => { document.getElementById('mpCode').value = v; }, code2); await B.evaluate(() => document.getElementById('mpJoin').click());
await until(B, () => !!window.__bn.NET.hostId);
log('save offer', await ev(A, () => [document.getElementById('mpSave').hidden, document.getElementById('mpSaveTxt').textContent, window.__bn.NET.useSave]));
await ev(A, () => window.__bn.mpPick('dad')); await wait(300); await ev(B, () => window.__bn.mpPick('bear'));
await until(A, () => window.__bn.NET.slots.bear && window.__bn.NET.slots.dad);
await ev(A, () => document.getElementById('mpStart').click());
log('both portal 2', [await until(A, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'portal', 90000), await until(B, () => window.__bn.state === 'play' && window.__bn.LEVEL === 'portal', 90000)]);
await ev(A, () => { const b = window.__bn, c = b.prC(); const L = b.leader; L.pos.set(c.x, c.y + .5, c.z); L.vel.set(0, 0, 0); });
await ev(B, () => { const b = window.__bn, c = b.prC(); const L = b.leader; L.pos.set(c.x + 4, c.y + .5, c.z + 3); L.vel.set(0, 0, 0); });
log('resumed', [await until(A, () => window.__bn.LEVEL === 'basement' && window.__bn.quest === 2, 60000), await until(B, () => window.__bn.quest === 2 && document.getElementById('qt').textContent === '去牆腳的裂縫', 60000)]);
log('where', await Promise.all([A, B].map(p => ev(p, () => [window.__bn.LEVEL, window.__bn.leader.pos.toArray().map(v => Math.round(v))]))));
console.log(logs.slice(0, 30).join('\n'));
await browser.close();
