// Grade 2 translator check: every "ok" example in js/g2examples.js must use its contraction,
// and every "no" counter-example must not. Run: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACTIONS, cellsOf, translate } from '../site/js/braille.js';
import { G2_EXAMPLES } from '../site/js/g2examples.js';

const uses = (text, print, cells) => translate(text, 'en', 2).some((p) => p.cells === cells && String(p.print).toLowerCase() === print);

for (const [group, { items }] of Object.entries(CONTRACTIONS)) {
  for (const [print, dots] of items) {
    const ex = G2_EXAMPLES[`${print}|${group}`] || G2_EXAMPLES[print];
    if (!ex) continue;
    const cells = cellsOf(dots);
    test(`${group}: ${print}`, () => {
      ex.ok.forEach((t, i) => {
        if (ex.okBraille && ex.okBraille[i]) return; // shown with fixed braille, not translated
        assert.ok(uses(t, print, cells), `"${t}" should use the ${print} sign`);
      });
      if (ex.no) assert.ok(!uses(ex.no.text, print, cells), `"${ex.no.text}" should not use the ${print} sign`);
    });
  }
}
