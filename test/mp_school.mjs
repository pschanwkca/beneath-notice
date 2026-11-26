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
const Q = await ev(A, () => window.__bn.MPQ_SCHOOL); log('MPQ_SCHOOL', Q);
const q = p => ev(p, () => window.__bn.quest - window.__bn.MPQ_SCHOOL);
// skip to the end of the park: chip charged and taken, everyone out of the back gate
await ev(A, () => { const b = window.__bn; b.PK.chipOn = b.PK.charged = b.PK.chipGot = true; b.setQuest(b.MPQ_PARK + 4); });
await tp(A, 2060, -20, 3745); await tp(B, 2066, -20, 3748);
log('school start', [await until(A, () => window.__bn.quest === window.__bn.MPQ_SCHOOL, 10000), await until(B, () => window.__bn.quest === window.__bn.MPQ_SCHOOL, 10000), await ev(A, () => window.__bn.state)]);
await tp(A, 2060, -20, 4200); await tp(B, 2070, -20, 4205);
log('at the gate', [await until(A, () => window.__bn.quest === window.__bn.MPQ_SCHOOL + 1, 8000), await ev(B, () => [window.__bn.LEVEL, document.getElementById('chapA').textContent, document.getElementById('chap').classList.contains('on')])]);
await shot(B, 'mps_banner');
await tp(A, 2060, -20, 4345); await tp(B, 2070, -20, 4345);
log('in the yard', await until(A, () => window.__bn.quest === window.__bn.MPQ_SCHOOL + 2, 8000));
await tp(A, 2060, -20, 4450);
log('recess film', [await until(A, () => window.__bn.state === 'cine', 12000), await until(B, () => window.__bn.state === 'cine', 6000), await ev(B, () => window.__bn.CINE.F && window.__bn.CINE.F.id)]);
await wait(3000); await ev(B, () => window.__bn.filmEnd(true));
await wait(2500);
log('B skipped', await ev(B, () => [window.__bn.state, document.getElementById('netbar').hidden, window.__bn.quest - window.__bn.MPQ_SCHOOL]));
log('kid sync (A film / B game)', await Promise.all([A, B].map(p => ev(p, () => window.__bn.SC.kids.slice(0, 4).map(k => k.H.pos.toArray().map(v => Math.round(v / 40) * 40).join(','))))));
await ev(A, () => window.__bn.filmEnd(true));
log('A film ends', [await until(A, () => window.__bn.state === 'play', 25000), await until(B, () => window.__bn.quest - window.__bn.MPQ_SCHOOL === 3, 6000)]);
await wait(1500);
log('break on B', await ev(B, () => { const S = window.__bn.SC; return [S.phase, S.doors.main.want, +S.doors.main.open.toFixed(2), S.kids.map(k => k.mode).join(' '), window.__bn.chars.rab.root.visible]; }));
log('kid sync', await Promise.all([A, B].map(p => ev(p, () => window.__bn.SC.kids.slice(0, 5).map(k => k.H.pos.toArray().map(v => Math.round(v / 30) * 30).join(','))))));
log('teacher sync', await Promise.all([A, B].map(p => ev(p, () => [window.__bn.SC.tch.mode, window.__bn.SC.tch.H.pos.toArray().map(v => Math.round(v / 30) * 30).join(','), window.__bn.SC.grd.mode]))));
await ev(B, () => { const b = window.__bn; b.cam.yaw = Math.PI; }); await shot(B, 'mps_break');
// a kid sees B: the host's kid turns to look
await ev(B, () => { const b = window.__bn; b.leader.pos.set(2000, -20, 4600); });
await wait(600);
await tp(A, 2100, -20, 5100); await tp(B, 2110, -20, 5104);
log('corridor', [await until(A, () => window.__bn.quest - window.__bn.MPQ_SCHOOL === 4, 8000), await ev(A, () => Math.round(window.__bn.SC.pt))]);
await ev(A, () => { window.__bn.SC.pt = 79.5; });
log('bell: back in', [await until(B, () => window.__bn.SC.phase === 'in', 40000), await until(B, () => window.__bn.SC.doors.back.open > .5, 30000)]);
log('B hint', await ev(B, () => window.__bn.W.LEVELS.school.hint(window.__bn.leader)));
await tp(A, 2425, -20, 5260);
log('A in class', [await until(A, () => window.__bn.quest - window.__bn.MPQ_SCHOOL === 5, 8000), await ev(B, () => document.getElementById('toast').textContent)]);
await tp(B, 2430, -20, 5270);
// toy and rescue (detection is off in this test: B is "seen" by hand)
await ev(B, () => window.__bn.toyFreeze('tch'));
log('B a toy', [await until(A, () => window.__bn.chars.bear.frozen, 6000), await until(B, () => window.__bn.chars.bear.frozen, 6000), await ev(B, () => window.__bn.W.LEVELS.school.toys)]);
await ev(A, () => { const b = window.__bn, C = b.chars.bear; b.leader.pos.set(C.pos.x + 3, C.pos.y, C.pos.z); b.leader.vel.set(0, 0, 0); });
log('rescued', [await until(A, () => !window.__bn.chars.bear.frozen, 8000), await until(B, () => !window.__bn.chars.bear.frozen, 6000)]);
// the cubby: the essay film on both
await ev(A, () => { const b = window.__bn, S = b.SC; b.leader.pos.set(S.cubby.x0 + 20, -14, 5540); b.leader.vel.set(0, 0, 0); });
log('essay film', [await until(A, () => window.__bn.state === 'cine' && window.__bn.CINE.F.id === 'essay', 8000), await until(B, () => window.__bn.state === 'cine' && window.__bn.CINE.F.id === 'essay', 6000)]);
await wait(4000); await shot(B, 'mps_essay');
await ev(A, () => window.__bn.filmEnd(true)); await ev(B, () => window.__bn.filmEnd(true));
log('after essay', [await until(A, () => window.__bn.quest - window.__bn.MPQ_SCHOOL === 6, 6000), await until(B, () => window.__bn.quest - window.__bn.MPQ_SCHOOL === 6, 6000), await ev(B, () => { const m = window.__bn.mpSchoolMarker(); return m && m.toArray().map(Math.round); })]);
await tp(A, 2400, -20, 5872);
await wait(1500); log('only A out: no film', await ev(A, () => window.__bn.state));
await tp(B, 2410, -20, 5874);
log('end film', [await until(A, () => window.__bn.state === 'cine' && window.__bn.CINE.F.id === 'end', 8000), await until(B, () => window.__bn.state === 'cine' && window.__bn.CINE.F.id === 'end', 6000)]);
await wait(2000); await ev(B, () => window.__bn.filmEnd(true)); await wait(1000); await ev(A, () => window.__bn.filmEnd(true));
log('end', [await until(A, () => window.__bn.state === 'end', 6000), await until(B, () => window.__bn.state === 'end', 6000)]);
await until(A, () => !document.getElementById('end').hidden, 30000); await until(B, () => !document.getElementById('end').hidden, 30000);
log('end card', await Promise.all([A, B].map(p => ev(p, () => [document.getElementById('endA').textContent, document.getElementById('end').hidden]))));
await shot(B, 'mps_end');
console.log(logs.filter(l => !/GPU stall|GL Driver/.test(l)).slice(0, 30).join('\n'));
await browser.close();
