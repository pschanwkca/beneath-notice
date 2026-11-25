import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs'; import path from 'path';
const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const shots = process.argv[2] || 'basic';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: +(process.env.W||960), height: +(process.env.H||540) }, ...(process.env.MOB ? { hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : {}) });
const logs = [];
page.on('console', m => logs.push(m.type() + ': ' + m.text()));
page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message + '\n' + e.stack));
await page.route('**/*', async route => {
  const u = route.request().url();
  if (u.startsWith('https://cdn.jsdelivr.net/npm/three@0.170.0/')) {
    const rel = u.replace('https://cdn.jsdelivr.net/npm/three@0.170.0/', '');
    const f = path.join(root, 'node_modules/three', rel);
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(f) });
  }
  if (u.includes('fonts.googleapis') || u.includes('fonts.gstatic')) return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
  if (u.startsWith('file://') || u.startsWith('http://localhost')) return route.continue();
  return route.continue();
});
if (process.env.INIT) await page.addInitScript(process.env.INIT);
page.on('crash', () => { console.log('PAGE CRASHED'); console.log(logs.slice(-30).join('\n')); });
await page.goto('file://' + root + '/index.html#dev'); page.setDefaultTimeout(180000);
const t0 = Date.now();
await page.waitForFunction(() => document.getElementById('start') && !document.getElementById('start').hidden || document.getElementById('err').textContent.length > 0, null, { timeout: 240000 });
console.log('loaded in', (Date.now() - t0) / 1000, 's');
const err = await page.$eval('#err', e => e.textContent);
if (err) console.log('ERR:', err);
if (process.env.Q) await page.evaluate(q => window.__bn.applyQ(q), process.env.Q);
await page.waitForTimeout(1500);
if (!process.env.NOTITLE) await page.screenshot({ path: root + '/test/01_title.png' });
// expose hooks via window for scripted tests
const steps = JSON.parse(fs.readFileSync(root + '/test/steps_' + shots + '.json', 'utf8'));
for (const s of steps) {
  if (s.resize) await page.setViewportSize({ width: s.resize[0], height: s.resize[1] });
  if (s.click) await page.click(s.click, { force: true });
  if (s.key) { await page.keyboard.down(s.key); await page.waitForTimeout(s.hold || 100); await page.keyboard.up(s.key); }
  if (s.down) await page.keyboard.down(s.down);
  if (s.up) await page.keyboard.up(s.up);
  if (s.eval) { const r = await page.evaluate(s.eval); if (r !== undefined) console.log('eval:', JSON.stringify(r)); }
  if (s.evalFile) { const r = await page.evaluate(fs.readFileSync(root + '/test/' + s.evalFile, 'utf8')); if (r !== undefined) console.log('eval:', typeof r === 'string' ? r : JSON.stringify(r)); }
  if (s.dump) { const r = await page.evaluate(s.dump); fs.writeFileSync(root + '/test/' + s.to, typeof r === 'string' ? r : JSON.stringify(r)); console.log('dumped', s.to); }
  if (s.frame) await page.evaluate(() => new Promise(r => { window.__NR = false; requestAnimationFrame(() => requestAnimationFrame(() => { window.__NR = true; r(); })); }));
  if (s.wait) await page.waitForTimeout(s.wait);
  if (s.shot) await page.screenshot({ path: root + '/test/' + s.shot + '.png' });
}
console.log(logs.slice(0, 60).join('\n'));
await browser.close();
