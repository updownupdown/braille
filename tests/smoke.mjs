// Smoke test: serve site/, open every route at phone and laptop sizes, fail on any page error,
// console error or sideways overflow. Run: node tests/smoke.mjs   (needs the playwright package)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('../site/', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = http.createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  try {
    const file = path.endsWith('/') ? path + 'index.html' : path;
    const body = await readFile(join(ROOT, file));
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}/`;

export const ROUTES = ['', 'reference', 'reference/overview', 'reference/alphabet', 'reference/numbers', 'reference/grade2',
  'reference/g2words', 'reference/g2strong', 'reference/g2lower', 'reference/g2affix', 'reference/g2short',
  'reference/signs', 'reference/science', 'reference/languages', 'reference/systems', 'reference/cheatsheet',
  'practice', 'practice/read', 'practice/write', 'practice/words', 'practice/sweep', 'practice/read?cat=auto', 'practice/stats',
  'games', 'games/wordle', 'games/snowman', 'games/anagrams', 'games/agent', 'games/rain', 'games/time', 'games/mirror',
  'games/memory', 'games/maze', 'games/signhunt', 'games/trivia', 'games/riddles', 'translate', 'translate?text=Exit%20floor%202'];

const browser = await chromium.launch();
const failures = [];
for (const [tag, opts] of [['phone', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 } }]]) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  let errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/version\.json|favicon|fonts\.g/.test(m.text() + (m.location().url || ''))) errs.push(m.text()); });
  for (const r of ROUTES) {
    errs = [];
    await page.goto(base + '#/' + r);
    await page.waitForTimeout(400);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const empty = await page.evaluate(() => !document.querySelector('#view')?.children.length);
    if (errs.length) failures.push(`${tag} #/${r}: ${errs.join(' | ')}`);
    if (over > 1) failures.push(`${tag} #/${r}: page scrolls sideways by ${over}px`);
    if (empty) failures.push(`${tag} #/${r}: nothing rendered`);
  }
  await ctx.close();
}
// Guess: the choices alone must settle the answer. No wrong choice may share the sign's cells
// (b is also "but", bb is also "be" and ";"), for every set and for Auto's whole course.
{
  const page = await browser.newPage();
  await page.goto(base + '#/practice/read');
  await page.waitForTimeout(400);
  const bad = await page.evaluate(async () => {
    const P = await import('./js/practice.js');
    const out = [];
    const pools = Object.entries(P.CATS).filter(([k]) => k !== 'auto').flatMap(([c, cat]) => Object.entries(cat.sets).map(([s, [, f]]) => [`${c}.${s}`, f('r:')]));
    pools.push(['auto', P.autoCourse()]);
    for (const [name, pool] of pools) for (const item of pool) for (let i = 0; i < 8; i++) {
      const opts = P.guessOptions(item, pool.filter((x) => x.key !== item.key));
      const readings = new Set(P.readingsOf(item.cells));
      for (const o of opts) if (o.cells === item.cells || readings.has(o.answer)) out.push(`${name}: ${item.answer} offered with ${o.answer}`);
      if (new Set(opts.map((o) => o.answer)).size !== opts.length) out.push(`${name}: ${item.answer} has a repeated choice`);
    }
    return [...new Set(out)];
  });
  if (bad.length) failures.push('Guess choices with two right answers:\n  ' + bad.slice(0, 20).join('\n  '));
  await page.close();
}
await browser.close();
server.close();
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`OK: ${ROUTES.length} routes x 2 sizes`);
