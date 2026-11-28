// Pre-UEB (EBAE) examples on Learn > Pre-UEB Braille, checked against liblouis's EBAE table.
// Needs liblouis (apt-get install liblouis-bin liblouis-data); skipped where lou_translate is missing.
// Run: node --test tests/preueb.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { EX, ebaeCells, DROPPED } from '../site/js/preueb.js';

let hasLou = true;
try { execFileSync('lou_translate', ['--version'], { stdio: 'ignore' }); } catch { hasLou = false; }
const lou = (s) => execFileSync('lou_translate', ['--forward', 'unicode.dis,en-us-g2.ctb'], { input: s }).toString().trim();

test('pre-UEB examples match liblouis EBAE', { skip: !hasLou && 'liblouis not installed' }, () => {
  for (const [group, list] of Object.entries(EX)) for (const x of list) {
    let want = lou(x.lou || x.p).replace(/ /g, '⠀');
    // Emphasis isn't in plain text: add EBAE italics by the rule (one sign before a word; for a passage two before
    // the first word and one before the last).
    if (x.loux === '⠨') want = '⠨' + want;
    if (x.loux === 'passage') { const w = want.split('⠀'); w[0] = '⠨⠨' + w[0]; w[w.length - 1] = '⠨' + w[w.length - 1]; want = w.join('⠀'); }
    assert.equal(ebaeCells(x.e), want, `${group}: ${x.p}`);
  }
});

test('dropped contractions appear as in liblouis EBAE', { skip: !hasLou && 'liblouis not installed' }, () => {
  const word = { ble: ['table', 2], com: ['compute', 0], dd: ['middle', 2], ation: ['nation', 1], ally: ['really', 2], 'o’clock': ["o'clock", 0], to: ['to the', 0], into: ['into the', 0], by: ['by the', 0] };
  for (const [cells, print] of DROPPED) {
    const [w, at] = word[print];
    assert.equal(lou(w).slice(at, at + cells.length), cells, print);
  }
});

test('pre-UEB word list for Braille to text is up to date with liblouis', { skip: !hasLou && 'liblouis not installed' }, async () => {
  const { build, FILE } = await import('./ebaewords.mjs');
  const { readFileSync } = await import('node:fs');
  assert.equal(readFileSync(FILE, 'utf8'), build(), 'run: node tests/ebaewords.mjs');
});
