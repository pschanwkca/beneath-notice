// HUD screenshots on desktop and on a phone held sideways, in the busy moments where text piles up.
//   node test/ui_audit.mjs [prefix]      → test/<prefix>_<device>_<state>.png
import { chromium, devices } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import path from 'path'; import fs from 'fs';
const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const prefix = process.argv[2] || 'ui';
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const DEV = {
  desk: { viewport: { width: 1280, height: 720 } },
  phone: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent },
  small: { viewport: { width: 740, height: 360 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['Galaxy S9+'].userAgent }
};
const wait = ms => new Promise(r => setTimeout(r, ms));
for (const [name, opt] of Object.entries(DEV)) {
  if (only && !only.includes(name)) continue;
  const ctx = await browser.newContext(opt);
  await ctx.route('**/*', async route => {
    const u = route.request().url();
    if (u.startsWith('https://cdn.jsdelivr.net/npm/three@0.170.0/')) { const f = path.join(root, 'node_modules/three', u.replace('https://cdn.jsdelivr.net/npm/three@0.170.0/', '')); return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(f) }); }
    if (u.includes('fonts.googleapis') || u.includes('fonts.gstatic')) return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    return route.continue();
  });
  await ctx.addInitScript('window.__NR=true; window.__NODET=true;' + (process.env.EN ? "try{localStorage.setItem('bn_lang','en')}catch(e){}" : ''));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + root + '/index.html#dev' + (process.env.LANGQ ? '' : ''));
  await p.waitForFunction(() => !document.getElementById('start').hidden || document.getElementById('err').textContent.length > 0, null, { timeout: 300000 });
  const shot = async st => { await p.evaluate(() => { window.__NR = false; }); await wait(2200); await p.screenshot({ path: `${root}/test/${prefix}_${name}_${st}.png`, timeout: 150000 }); await p.evaluate(() => { window.__NR = true; }); };
  await shot('title');
  await p.evaluate(async () => { const b = window.__bn; b.applyQ('low'); await b.startChapter('park'); });
  await p.waitForFunction(() => window.__bn.state === 'play', null, { timeout: 200000 });
  await p.evaluate(() => { const b = window.__bn; b.step(20); });
  await wait(1500);
  await shot('play');
  // the busy moment: a new place, someone talking, a notice, a hint, a new teammate — all at once
  await p.evaluate(() => { const b = window.__bn; b.chapterBanner('第六章', '公園'); b.say('爸爸', '這裡就是楓林公園……晶片要在陽光底下才會充電。找個最高、最開揚的地方。', '#f5f0e6', 30); b.toast('全隊到了遊樂場！小狗豆腐走出了狗場', 30); const h = document.getElementById('hint'); h.textContent = '長草裡面——很難被看見'; h.classList.add('on'); h.dataset.pin = 1; });
  await shot('busy');
  await p.evaluate(() => { const b = window.__bn; for (const id of ['busy']) {} document.getElementById('sub').classList.remove('on'); document.getElementById('toast').classList.remove('on'); b.emoShow(b.leader, 'laugh'); const m = b.party.find(C => C !== b.leader); if (m) b.emoShow(m, 'love'); });
  await shot('emo');
  await p.evaluate(() => window.__bn.pause && window.__bn.pause());
  await shot('pause');
  console.log(name, errs.slice(0, 3));
  await ctx.close();
}
await browser.close();
