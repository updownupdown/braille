// Smoke test: serve site/, open every route at phone and laptop sizes, fail on any page error,
// console error or sideways overflow. Run: node tests/smoke.mjs   (needs the playwright package)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('../site/', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
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
  'practice', 'practice/read', 'practice/write', 'practice/words', 'practice/sweep', 'practice/read?cat=auto', 'practice/stats', 'practice/compose', 'practice/compose?src=phrases', 'practice/place', 'practice/read?cat=contractions&set=spot', 'practice/read?cat=symbols&set=fmt', 'practice/compose?src=formats',
  'games', 'games/wordle', 'games/snowman', 'games/anagrams', 'games/agent', 'games/rain', 'games/time', 'games/mirror',
  'games/memory', 'games/maze', 'games/signhunt', 'games/chunt', 'games/proof', 'games/trivia', 'games/riddles', 'translate', 'translate?text=Exit%20floor%202'];

const browser = await chromium.launch();
const failures = [];
const loaded = new Set(); // every file the app fetched while visiting the routes
for (const [tag, opts] of [['phone', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 } }]]) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  let errs = [];
  page.on('request', (q) => { if (q.url().startsWith(base)) loaded.add('./' + new URL(q.url()).pathname.slice(1)); });
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
// Guess: exactly one choice may be right. Shown alone, no wrong choice may share the sign's cells
// (b is also "but", bb is also "be" and ";"); shown inside a word, only readings that can't sit there may.
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
    // Inside a real word, a choice with the same cells is fine only if it can't sit at that place in a word.
    for (const item of P.autoCourse()) for (const wc of P.wordsFor(item)) {
      const word = wc.parts.map((x) => x.cells).join('');
      if ([...word].slice(wc.at, wc.at + wc.len).join('') !== item.cells) out.push(`word ${wc.word}: ${item.answer} is not at the faded gap`);
      const opts = P.guessOptions(item, P.autoCourse().filter((x) => x.key !== item.key), wc.pos);
      for (const o of opts) if (o.cells === item.cells && P.allowedPos(o).includes(wc.pos)) out.push(`word ${wc.word}: ${item.answer} offered with ${o.answer}`);
      if (opts.some((o) => o.answer === item.answer)) out.push(`word ${wc.word}: ${item.answer} offered twice`);
    }
    if (!P.wordsFor(P.autoCourse().find((x) => x.key === 'cbb')).length) out.push('no words found for bb');
    return [...new Set(out)];
  });
  if (bad.length) failures.push('Guess choices with two right answers:\n  ' + bad.slice(0, 20).join('\n  '));
  await page.close();
}
// Practice rounds: twenty answers in Guess end on a summary, and its drill is a shorter round of its own.
{
  const page = await browser.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(base + '#/practice/read?cat=letters&set=aj');
  await page.waitForTimeout(400);
  for (let i = 0; i < 300 && !(await page.$('.rsum')); i++) {
    const c = await page.$$('.choice:not(.wrong)');
    if (c.length) await c[i % c.length].click();
    await page.waitForTimeout(i % 3 ? 60 : 720);
  }
  if (!(await page.$('.rsum'))) failures.push('Practice: no summary after a round of Guess');
  else if (await page.$('#rsDrill')) {
    await page.click('#rsDrill'); await page.waitForTimeout(300);
    const t = await page.$eval('#pRound', (e) => e.textContent);
    if (!/Round: 1 \/ ([2-9]|10)$/.test(t)) failures.push(`Practice: drill round reads "${t}"`);
  }
  if (errs.length) failures.push('Practice rounds: ' + errs.join(' | '));
  await page.close();
}
// Spot the right brailling and Watch Out: the right braille is the translator's, every wrong one differs from it
// and from each other. Write: each text splits into its words with the translator's cells.
{
  const page = await browser.newPage();
  await page.goto(base + '#/practice/read');
  await page.waitForTimeout(400);
  const bad = await page.evaluate(async () => {
    const R = await import('./js/rules.js'), B = await import('./js/braille.js'), W = await import('./js/compose.js');
    const out = [];
    for (const [k, list] of Object.entries(R.MISTAKES)) for (const m of list) {
      const x = R.mistake(m);
      if (!x.wrong) out.push(`${k} ${x.word}: no wrong version`);
      else if (R.cellsOfParts(x.wrong) === B.unicodeOf(x.right)) out.push(`${k} ${x.word}: wrong equals right`);
    }
    const items = R.spotItems();
    if (items.length < 60) out.push(`only ${items.length} spot items`);
    for (const it of items) {
      const sp = it.spot;
      if (sp.right !== B.unicodeOf(B.translate(sp.word, 'en', 2))) out.push(`spot ${sp.word}: right is not the translator's`);
      const all = [sp.right, ...sp.wrongs.map((w) => w.cells)];
      if (new Set(all).size !== all.length) out.push(`spot ${sp.word}: two options are the same`);
      if (!sp.wrongs.length || sp.wrongs.some((w) => !w.why)) out.push(`spot ${sp.word}: missing a reason`);
    }
    for (const [t, g, n] of [['offer watch other', 1, 3], ['the cat and the dog', 2, 5], ['knowledge is power', 2, 3]]) {
      const ws = W.composeWords(t, g);
      if (ws.length !== n) out.push(`Write: ${t} split into ${ws.length} words`);
      if (ws.map((w) => w.cells.join('')).join(' ') !== B.unicodeOf(B.translate(t, 'en', g))) out.push(`Write: ${t} cells differ from the translator`);
    }
    return out;
  });
  if (bad.length) failures.push('Grade 2 rules / Write:\n  ' + bad.slice(0, 20).join('\n  '));
  await page.close();
}
// Auto: from box 4 a right answer schedules the sign whole days ahead; until that day it waits behind every
// other sign, and on the day it is due straight away.
{
  const page = await browser.newPage();
  await page.goto(base + '#/practice');
  await page.waitForTimeout(300);
  const bad = await page.evaluate(async () => {
    const P = await import('./js/practice.js');
    const out = [], st = { turn: 10, s: { a: [3, 5], b: [3, 12, 0], c: [1, 14] } };
    const today = P.dayNum();
    st.s.b[2] = today + 1;
    if (P.autoDue(st, 'a', today) !== 5) out.push('a sign saved without a day should go by turns');
    if (P.autoDue(st, 'b', today) <= P.autoDue(st, 'c', today)) out.push('a sign due tomorrow should wait behind one due by turns');
    if (P.autoDue(st, 'b', today + 1) > st.turn) out.push('a sign whose day has come should be due now');
    localStorage.removeItem('dots.auto');
    for (let i = 0; i < 4; i++) P.autoResult('r:', 'la', true);
    const e = P.autoState('r:').s.la;
    if (e[0] !== 4 || e[2] !== today + P.AUTO_DAYS[4]) out.push('four right answers should give box 5 and a day ' + P.AUTO_DAYS[4] + ' ahead, got ' + JSON.stringify(e));
    P.autoResult('r:', 'la', false);
    if (P.autoState('r:').s.la.length !== 2) out.push('a miss should drop the day');
    localStorage.removeItem('dots.auto');
    return out;
  });
  if (bad.length) failures.push('Auto days:\n  ' + bad.join('\n  '));
  await page.close();
}
// Proofreader: every wrong brailling differs from the translator's and has a reason. Everyday formats: every
// generated line looks like a real one, and each wrong choice is a real-looking line one look-alike cell away.
// Milestones: reached ones are dated today, and ones reached before tracking began are only 'earlier'.
{
  const page = await browser.newPage();
  await page.goto(base + '#/practice/read');
  await page.waitForTimeout(400);
  const bad = await page.evaluate(async () => {
    const R = await import('./js/rules.js'), B = await import('./js/braille.js'), Ph = await import('./js/phrases.js'), P = await import('./js/practice.js'), M = await import('./js/milestones.js');
    const out = [];
    const words = [...new Set(Ph.PHRASES.filter((p) => /^[a-z ]+$/.test(p)).flatMap((p) => p.split(' ')))].filter((w) => w.length > 1);
    let withG2 = 0;
    for (const g of [1, 2]) for (const w of words) {
      const right = B.unicodeOf(B.translate(w, 'en', g)), ws = R.wrongWays(w, g);
      if (g === 2 && ws.length) withG2++;
      for (const x of ws) {
        if (x.cells === right) out.push(`proof g${g} ${w}: wrong equals right`);
        if (!x.why) out.push(`proof g${g} ${w}: no reason`);
      }
    }
    if (withG2 < 150) out.push(`only ${withG2} sentence words have a Grade 2 mistake`);
    for (const k of Object.keys(Ph.FORMAT_KINDS)) for (let i = 0; i < 40; i++) {
      const [t] = Ph.formatLine(k);
      if (!Ph.FORMAT_OK[k].test(t)) out.push(`format ${k}: ${t} doesn't look like one`);
      for (const a of P.lookAlts(t, k)) {
        if (!Ph.FORMAT_OK[k].test(a)) out.push(`format ${k}: wrong choice ${a} for ${t} doesn't look like one`);
        if ([...a].filter((c, j) => c !== t[j]).length !== 1) out.push(`format ${k}: ${a} is more than one cell from ${t}`);
        if (B.unicodeOf(B.translate(a, 'en', 1)) === B.unicodeOf(B.translate(t, 'en', 1))) out.push(`format ${k}: ${a} brailles the same as ${t}`);
      }
    }
    if (P.FORMATS().length < 20) out.push(`only ${P.FORMATS().length} everyday format items`);
    localStorage.removeItem('dots.miles'); localStorage.setItem('dots.days', JSON.stringify({ '2026-01-01': 150 }));
    if (M.checkMilestones().ans100 !== 'earlier') out.push('a milestone reached before tracking should be "earlier"');
    localStorage.setItem('dots.days', JSON.stringify({ '2026-01-01': 1500 }));
    if (!/^\d{4}-\d\d-\d\d$/.test(M.checkMilestones().ans1000 || '')) out.push('a new milestone should be dated');
    localStorage.removeItem('dots.miles'); localStorage.removeItem('dots.days');
    return out;
  });
  if (bad.length) failures.push('Proofreader / formats / milestones:\n  ' + bad.slice(0, 20).join('\n  '));
  await page.close();
}
// Haptics: off by default; turning it on gives one tick; in Draw a raised dot ticks and a wrong dot gives the
// two-tap pattern. Laptops (no touch) don't offer the setting.
for (const [tag, opts] of [['phone', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 } }]]) {
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript(() => { window.__vib = []; navigator.vibrate = (p) => { window.__vib.push(JSON.stringify(p)); return true; }; });
  const page = await ctx.newPage();
  const vib = () => page.evaluate(() => window.__vib.splice(0));
  const draw = async () => { await page.goto(base + '#/practice/write?cat=letters&set=aj'); await page.waitForTimeout(400); };
  await draw();
  await page.click('.dotpad [data-d="1"]');
  if ((await vib()).length) failures.push(`Haptics ${tag}: vibrated while the setting is off`);
  await page.click('#settingsBtn'); await page.waitForTimeout(200);
  const row = await page.$('[data-seg="haptics"]');
  if (tag === 'laptop') { if (row) failures.push('Haptics: the setting shows on a laptop'); await ctx.close(); continue; }
  if (!row) { failures.push('Haptics: no setting on a phone'); await ctx.close(); continue; }
  await page.click('[data-seg="haptics"] [data-v="1"]');
  const pre = await vib();
  if (pre.join() !== '[14]') failures.push(`Haptics: turning it on gave ${JSON.stringify(pre)}`);
  await page.keyboard.press('Escape'); await page.reload(); await page.waitForTimeout(400);
  await page.click('.dotpad [data-d="3"]'); // no letter a–j uses dot 3
  const got = await vib();
  if (got.join(' ') !== '[8] [10,70,10]') failures.push(`Haptics: a wrong dot in Draw gave ${JSON.stringify(got)}`);
  await ctx.close();
}
// Offline: every file the app loads must be in the service worker's SHELL, or that page breaks offline
// until it has been visited online once.
{
  const sw = await readFile(join(ROOT, 'sw.js'), 'utf8');
  const shell = new Set(JSON.parse(sw.match(/const SHELL = (\[[^\]]*\])/)[1].replace(/'/g, '"')));
  const missing = [...loaded].filter((u) => u !== './version.json' && u !== './sw.js' && !shell.has(u === './' ? './' : u));
  if (missing.length) failures.push('Missing from SHELL in sw.js: ' + missing.join(', '));
  if (!loaded.has('./fonts/outfit-latin.woff2')) failures.push('The Outfit font was never loaded');
}
await browser.close();
server.close();
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`OK: ${ROUTES.length} routes x 2 sizes`);
