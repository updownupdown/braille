// Search overlay: Enter, Escape (sheet first, then search), focus return, history, Tab trap, gaps to the screen edge.
// Run: node tests/search.mjs [screenshot dir]
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const out = process.argv[2];
const ROOT = fileURLToPath(new URL('../site/', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  try { const file = path.endsWith('/') ? path + 'index.html' : path; const body = await readFile(join(ROOT, file)); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body); } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}/`;
const browser = await chromium.launch();
const fail = [];
const ok = (c, m) => { if (!c) fail.push(m); };
for (const [tag, opts] of [['phone', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }], ['dark', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, colorScheme: 'dark' }]]) {
  const page = await (await browser.newContext(opts)).newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(base + '#/reference/alphabet'); await page.waitForTimeout(400);
  await page.click('#searchBtn'); await page.waitForTimeout(250);
  ok(await page.evaluate(() => document.activeElement.id === 'gq'), tag + ': input focused');
  if (out) await page.screenshot({ path: `${out}/${tag}-empty.png` });
  await page.fill('#gq', 'and'); await page.waitForTimeout(150);
  await page.keyboard.press('Enter'); await page.waitForTimeout(300); // opens the sheet for "and"
  ok(await page.evaluate(() => !document.querySelector('.sheet').hidden), tag + ': Enter opens first result');
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => !document.querySelector('#searchOv').hidden), tag + ': Escape closes only the sheet');
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => document.querySelector('#searchOv').hidden && document.activeElement.id === 'searchBtn'), tag + ': Escape closes search, focus back on button');
  await page.click('#searchBtn'); await page.fill('#gq', 'the'); await page.waitForTimeout(150);
  await page.click('.sr[data-r="0"]'); await page.waitForTimeout(200); await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  await page.click('#searchBtn'); await page.fill('#gq', 'snow'); await page.waitForTimeout(150);
  await page.click('.sr[data-r="0"]'); await page.waitForTimeout(400);
  ok(await page.evaluate(() => location.hash === '#/games/snowman' && document.querySelector('#searchOv').hidden), tag + ': page result navigates and closes');
  await page.click('#searchBtn'); await page.waitForTimeout(200);
  const hist = await page.$$eval('.so-h span', (x) => x.map((e) => e.textContent));
  ok(JSON.stringify(hist) === '["snow","the","and"]', tag + ': history ' + JSON.stringify(hist));
  if (out) await page.screenshot({ path: `${out}/${tag}-history.png` });
  // Tab trap and arrows
  for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
  ok(await page.evaluate(() => document.querySelector('#searchOv').contains(document.activeElement)), tag + ': Tab stays inside');
  await page.click('.so-h[data-h="1"]'); await page.waitForTimeout(150);
  ok(await page.inputValue('#gq') === 'the' && await page.$('.sr'), tag + ': history tap searches');
  const fit = await page.evaluate(() => { const b = document.querySelector('.so-box').getBoundingClientRect(); return [b.top, innerHeight - b.bottom, b.left, innerWidth - b.right]; });
  ok(fit.every((g) => g >= 10), tag + ': gaps ' + fit);
  if (out) await page.screenshot({ path: `${out}/${tag}-results.png` });
  await page.fill('#gq', 'zz'); await page.waitForTimeout(150);
  if (out) await page.screenshot({ path: `${out}/${tag}-short.png` });
  await page.fill('#gq', ''); await page.click('.so-clear'); await page.waitForTimeout(100);
  ok(!(await page.$('.so-h')), tag + ': clear');
  await page.mouse.click(5, opts.viewport.height - 5); await page.waitForTimeout(100);
  ok(await page.evaluate(() => document.querySelector('#searchOv').hidden), tag + ': mask tap closes');
  ok(!errs.length, tag + ': errors ' + errs.join('; '));
}
await browser.close(); server.close();
if (fail.length) { console.error('FAIL\n' + fail.join('\n')); process.exit(1); }
console.log('OK: search overlay');
