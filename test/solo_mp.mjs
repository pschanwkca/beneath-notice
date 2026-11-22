// One player hosting an online room alone: prep area → kitchen; where are the far-away NPCs?
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import path from 'path';
const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const W = +(process.env.W || 960), H = +(process.env.H || 540);
const ctx = await browser.newContext({ viewport: { width: W, height: H }, ...(process.env.MOB ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
await ctx.route('**/*', async route => {
  const u = route.request().url();
  if (u.startsWith('https://cdn.jsdelivr.net/npm/three@0.170.0/')) { const f = path.join(root, 'node_modules/three', u.replace('https://cdn.jsdelivr.net/npm/three@0.170.0/', '')); return route.fulfill({ status: 200, contentType: 'application/javascript', path: f }); }
  if (u.includes('fonts.googleapis') || u.includes('fonts.gstatic')) return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
  return route.continue();
});
await ctx.addInitScript(process.env.INIT || 'window.__NR=true;');
const logs = []; const p = await ctx.newPage();
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); }); p.on('pageerror', e => logs.push('PAGEERROR: ' + e.message));
await p.goto('file://' + root + '/index.html?net=local#dev');
await p.waitForFunction(() => !document.getElementById('start').hidden, null, { timeout: 300000 });
const ev = (f, a) => p.evaluate(f, a); const wait = ms => new Promise(r => setTimeout(r, ms));
const log = (k, v) => console.log(k.padEnd(14), JSON.stringify(v));
const until = async (f, ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(f)) return true; await wait(150); } return false; };
const shot = async name => { await ev(() => new Promise(r => { window.__NR = false; requestAnimationFrame(() => requestAnimationFrame(() => { window.__NR = true; r(); })); })); await wait(400); await p.screenshot({ path: root + '/test/' + name + '.png', timeout: 200000 }); };
globalThis.__t = { p, ev, wait, log, until, shot, logs };
const mod = await import(path.resolve(process.argv[2]));
await mod.default(globalThis.__t);
console.log(logs.slice(0, 20).join('\n'));
await browser.close();
