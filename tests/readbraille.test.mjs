// Braille to text (Translate): the best reading of UEB and pre-UEB (EBAE) braille comes first.
// Run: node --test tests/readbraille.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readBraille } from '../site/js/readbraille.js';
import { translate, unicodeOf } from '../site/js/braille.js';
import { EX, ebaeCells } from '../site/js/preueb.js';
import { PASSAGES } from '../site/js/passages.js';
import { COMMON_WORDS } from '../site/js/wordlist.js';

const ueb = (s) => unicodeOf(translate(s, 'en', 2)).replace(/ /g, '⠀');
const best = (cells) => readBraille(cells)[0];
const same = (a, b) => a.replace(/’/g, "'") === b.replace(/’/g, "'");

test('UEB passages read back as written, as UEB', () => {
  const lines = [...new Set(PASSAGES.flatMap((p) => p[1].match(/[^.!?]+[.!?]+["”]?/g).map((s) => s.trim())))];
  for (const l of lines) { const r = best(ueb(l)); assert.ok(same(r.text, l), `${l} -> ${r.text}`); assert.equal(r.pre, false, l); }
});

test('common words read back as themselves', () => {
  const miss = COMMON_WORDS.filter((w) => w.length > 1).filter((w) => best(ueb(w))?.text !== w);
  assert.ok(miss.length <= 3, miss.join(', '));
});

test('pre-UEB examples from Learn read back, labelled pre-UEB', () => {
  for (const list of Object.values(EX)) for (const x of list) {
    if (/italics/.test(x.p)) continue; // emphasis isn't shown in a reading
    const r = best(ebaeCells(x.e));
    assert.ok(same(r.text, x.p), `${x.p} -> ${r.text}`);
  }
  for (const [cells, text] of [['⠞⠁⠼', 'table'], ['⠤⠏⠥⠞⠻', 'computer'], ['⠍⠊⠲⠇⠑', 'middle'], ['⠝⠠⠝', 'nation'], ['⠖⠮⠀⠏⠜⠅', 'to the park'], ['⠾⠁⠀⠎⠍⠊⠇⠑', 'with a smile']]) {
    const r = best(cells);
    assert.equal(r.text, text); assert.equal(r.pre, true, text);
  }
});

test('UEB comes first when both make sense', () => {
  for (const [cells, text] of [['⠶', 'were'], ['⠴', 'was'], ['⠃', 'but'], ['⠡', 'child'], ['⠖', '!'], ['⠼⠉⠒⠼⠉⠚', '3:30'], ['⠑⠲⠛⠲', 'e.g.'], ['⠉⠄⠞', "can't"]]) {
    const r = best(cells);
    assert.equal(r.text, text); assert.equal(r.pre, false, text);
  }
  const all = readBraille('⠶').map((r) => r.text);
  assert.ok(all.includes('(') && all.indexOf('(') > 0, 'pre-UEB parenthesis offered after "were"');
});
