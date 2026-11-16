// Grade 2 rules by example: a word brailled right next to the same word brailled wrong.
// Used by the "Watch Out" block at the end of each Grade 2 lesson and by Guess > Grade 2 > Spot the right brailling.
// The right braille always comes from the translator (checked against liblouis); the wrong one is built here
// by using a sign where UEB doesn't allow it, or by spelling out a sign that should be used.
import { LETTERS, CONTRACTIONS, cellsOf, translate, unicodeOf } from './braille.js';
import { G2_EXAMPLES } from './g2examples.js';
import { COMMON_WORDS } from './wordlist.js';

const letterParts = (str) => [...str].map((l) => ({ print: l, cells: LETTERS[l] || '', kind: 'letter' }));
// The cells of a contraction, looked up by its print (and group, where the same print is in two groups).
export function signCells(print, group = null) {
  for (const [g, { items }] of Object.entries(CONTRACTIONS)) {
    if (group && g !== group) continue;
    const it = items.find(([p]) => p === print); if (it) return cellsOf(it[1]);
  }
  return null;
}
// Translator parts with their place in the word.
function partsAt(word) {
  let at = 0;
  return translate(word, 'en', 2).map((p) => { const o = { ...p, from: at, to: at + (p.print || '').length }; at = o.to; return o; });
}
// The word with `sign` used for the letters at `at` (the first match by default): parts that overlap it are
// spelled out around it, everything else stays as the translator wrote it.
export function misuseParts(word, sign, group = null, at = word.indexOf(sign)) {
  const cells = signCells(sign, group); if (!cells || at < 0) return null;
  const end = at + sign.length, out = []; let placed = false;
  for (const p of partsAt(word)) {
    if (p.to <= at || p.from >= end) { out.push(p); continue; }
    if (p.from < at) out.push(...letterParts(word.slice(p.from, at)));
    if (!placed) { out.push({ print: sign, cells, kind: 'contraction' }); placed = true; }
    if (p.to > end) out.push(...letterParts(word.slice(end, p.to)));
  }
  return out;
}
// The word with its k-th contraction written out letter by letter (k = -1: every contraction, i.e. Grade 1).
export function spellParts(word, k = -1) {
  let n = -1;
  return partsAt(word).flatMap((p) => (p.kind === 'contraction' && (k < 0 || ++n === k) ? letterParts(p.print) : [p]));
}
export const cellsOfParts = (parts) => parts.map((p) => p.cells).join('');

// ---------- the common mistakes, lesson by lesson ----------
// [word, sign used wrongly (or 'spell' to write a sign out), group of that sign, why]
export const MISTAKES = {
  g2words: [
    ['butter', 'but', 'Alphabetic wordsigns', 'A wordsign only stands alone. Inside a word, b is just b, so this reads “bter”.'],
    ['canal', 'can', 'Alphabetic wordsigns', 'Inside a word, c is just c: this would read “cal”.'],
    ['everyone', 'every', 'Alphabetic wordsigns', 'Wordsigns stand alone. In everyone, use ever + y + one.'],
    ['outside', 'out', 'Strong wordsigns', 'out is a wordsign only on its own; in outside, use ou + t.'],
  ],
  g2strong: [
    ['ingredient', 'ing', 'Strong groupsigns', 'ing never starts a word. Here it is in + g.'],
    ['pothole', 'th', 'Strong groupsigns', 'The t and h are in different parts of the word (pot·hole), so th isn’t used.'],
    ['mishap', 'sh', 'Strong groupsigns', 'The s and h are in different parts of the word (mis·hap), so sh isn’t used.'],
    ['mother', 'spell', null, 'Use a sign wherever one fits: mother has its own two-cell sign.'],
  ],
  g2lower: [
    ['eat', 'ea', 'Lower groupsigns', 'ea only goes in the middle of a word, never first or last.'],
    ['cliff', 'ff', 'Lower groupsigns', 'bb, cc, ff and gg only go in the middle of a word.'],
    ['bacon', 'con', 'Lower groupsigns', 'con is only used at the start of a word.'],
    ['king', 'in', 'Lower groupsigns', 'When in and ing overlap, ing wins: k + ing.'],
  ],
  g2affix: [
    ['lesson', 'less', 'Final-letter groupsigns', 'Final-letter signs never start a word.'],
    ['mental', 'ment', 'Final-letter groupsigns', 'ment is an ending; it never starts a word.'],
    ['today', 'day', 'Initial-letter contractions', 'today has its own shortform: t d.'],
    ['someone', 'spell', null, 'some and one both have initial-letter signs, inside words too.'],
  ],
  g2short: [
    ['shoulder', 'should', 'Shortforms', 'Shortforms are only used inside a few longer words; shoulder isn’t one of them.'],
    ['mustard', 'must', 'Shortforms', 'must keeps its shortform only where it means must.'],
    ['friends', 'spell', null, 'Shortforms can take endings: friend + s.'],
    ['quickly', 'spell', null, 'quick keeps its shortform before an ending: quick + ly.'],
  ],
};
// Right and wrong parts for one mistake.
export function mistake([word, sign, group, why]) {
  const right = translate(word, 'en', 2);
  const wrong = sign === 'spell' ? spellParts(word) : misuseParts(word, sign, group);
  return { word, right, wrong, why };
}

// ---------- Spot the right brailling ----------
// A word and two to four ways to braille it (two only for the hand-picked mistakes); only one follows UEB. The wrong ones are the lesson mistakes,
// the counter-examples from the Grade 2 examples, one contraction spelled out, or the whole word in Grade 1.
let SPOT = null;
// Why a sign isn't used at this place in this word.
export function whyNot(p, g, at, word) {
  const start = at === 0, end = at + p.length === word.length;
  if (/wordsigns|Shortforms/.test(g)) return `“${p}” is only written with its sign as a word of its own.`;
  if (p === 'ing' && start) return 'ing never starts a word.';
  if (['ea', 'bb', 'cc', 'ff', 'gg'].includes(p) && (start || end)) return `${p} only goes in the middle of a word, never first or last.`;
  if (['be', 'con', 'dis'].includes(p) && !start) return `${p} is only used as the first syllable of a word.`;
  if (g === 'Final-letter groupsigns' && start) return `${p} is an ending; it never starts a word.`;
  return `${p} isn’t used here: its letters belong to different parts of the word${end ? '' : ', or another sign comes first'}.`;
}
const GROUP_NAME = (g) => ({ 'Alphabetic wordsigns': 'wordsign', 'Strong wordsigns': 'wordsign', 'Lower wordsigns': 'wordsign', Shortforms: 'shortform', 'Initial-letter contractions': 'sign', 'Final-letter groupsigns': 'sign' })[g] || 'sign';
export function spotItems() {
  if (SPOT) return SPOT;
  const byWord = new Map();
  const add = (word, cells, why, first = false) => {
    if (!/^[a-z]+$/.test(word)) return;
    if (!byWord.has(word)) byWord.set(word, { word, right: unicodeOf(translate(word, 'en', 2)), wrongs: [] });
    const it = byWord.get(word);
    if (!cells || cells === it.right || it.wrongs.some((w) => w.cells === cells)) return;
    it.wrongs[first ? 'unshift' : 'push']({ cells, why }); if (first) it.curated = true;
  };
  Object.values(MISTAKES).flat().forEach((m) => { const x = mistake(m); add(x.word, cellsOfParts(x.wrong), x.why, true); });
  // Counter-examples whose note is about writing (not about reading the same dots another way).
  for (const [k, x] of Object.entries(G2_EXAMPLES)) {
    if (!x.no || /[⠀-⣿]|is just|is the letter|means/.test(x.no.note)) continue;
    const [sign, group] = k.split('|');
    const w = misuseParts(x.no.text, sign, group || null);
    if (w) add(x.no.text, cellsOfParts(w), x.no.note.replace(/\.?$/, '.'), true);
  }
  // Everyday words with signs inside them, where the mistake is not using a sign.
  const extra = COMMON_WORDS.filter((w) => w.length >= 4 && w.length <= 9).filter((w) => {
    const ps = translate(w, 'en', 2);
    return ps.length > 1 && ps.some((p) => p.kind === 'contraction');
  }).slice(0, 160);
  extra.forEach((w) => add(w, null));
  for (const it of byWord.values()) {
    // A sign whose letters are in the word but which UEB doesn't use there (the translator didn't).
    if (it.wrongs.length < 2) {
      for (const [g, { items }] of Object.entries(CONTRACTIONS)) for (const [p] of items) {
        if (p.length < 2 || p === it.word || g === 'Alphabetic wordsigns' || it.wrongs.length >= 2) continue;
        for (let at = it.word.indexOf(p); at >= 0 && it.wrongs.length < 2; at = it.word.indexOf(p, at + 1)) {
          const w = misuseParts(it.word, p, g, at); if (!w) continue;
          add(it.word, cellsOfParts(w), whyNot(p, g, at, it.word));
        }
      }
    }
    const ps = translate(it.word, 'en', 2), cons = ps.filter((p) => p.kind === 'contraction');
    cons.forEach((p, k) => {
      const whole = p.print === it.word;
      add(it.word, cellsOfParts(spellParts(it.word, k)), whole ? `“${it.word}” is written with its ${GROUP_NAME(Object.entries(CONTRACTIONS).find(([, g]) => g.items.some(([q]) => q === p.print))?.[0])}.` : `“${p.print}” has its own sign here, so it is used.`);
    });
    if (cons.length > 1) add(it.word, cellsOfParts(spellParts(it.word)), 'That is Grade 1. Grade 2 uses a sign wherever the rules allow one.');
  }
  SPOT = [...byWord.values()].filter((it) => it.wrongs.length >= (it.curated ? 1 : 2)).map((it) => ({ key: 'sp' + it.word, cells: it.right, answer: it.word, kind: 'contraction', spot: it }));
  return SPOT;
}

// ---------- Proofreader ----------
// Ways to braille one word wrongly, each with the reason it is wrong. Grade 1: one letter swapped for a look-alike
// (the reason names what it then reads as). Grade 2: a sign used where UEB doesn't allow it, or a sign left out.
const LOOK_ALIKE = { d: 'f', f: 'd', e: 'i', i: 'e', h: 'j', j: 'h', r: 'w', w: 'r', a: 'b', b: 'a', k: 'l', l: 'k', m: 'n', n: 'm', s: 't', t: 's', o: 'e', u: 'v', v: 'u', x: 'y', y: 'x' };
export function wrongWays(word, grade) {
  const out = [], right = unicodeOf(translate(word, 'en', grade));
  const add = (cells, why) => { if (cells && cells !== right && !out.some((w) => w.cells === cells)) out.push({ cells, why }); };
  if (grade === 1) {
    [...word].forEach((l, i) => {
      const s = LOOK_ALIKE[l]; if (!s) return;
      const reads = word.slice(0, i) + s + word.slice(i + 1);
      add(unicodeOf(translate(reads, 'en', 1)), `Cell ${i + 1} is ${s}, not ${l}, so this reads “${reads}”.`);
    });
    return out;
  }
  const parts = partsAt(word);
  for (const m of Object.values(MISTAKES).flat()) if (m[0] === word) { const x = mistake(m); add(cellsOfParts(x.wrong), x.why); }
  for (const [g, { items }] of Object.entries(CONTRACTIONS)) for (const [p] of items) {
    if (p.length < 2 || p === word || g === 'Alphabetic wordsigns') continue;
    for (let at = word.indexOf(p); at >= 0; at = word.indexOf(p, at + 1)) {
      const w = misuseParts(word, p, g, at); if (!w) continue;
      // A bigger sign already covers these letters: say so, rather than the general rule.
      const big = parts.find((q) => q.kind === 'contraction' && q.from <= at && q.to >= at + p.length && q.print.length > p.length);
      add(cellsOfParts(w), big ? `“${big.print}” has its own sign, so “${p}” isn’t used.` : whyNot(p, g, at, word));
    }
  }
  const cons = translate(word, 'en', 2).filter((p) => p.kind === 'contraction');
  cons.forEach((p, k) => {
    const g = Object.entries(CONTRACTIONS).find(([, x]) => x.items.some(([q]) => q === p.print))?.[0];
    add(cellsOfParts(spellParts(word, k)), p.print === word ? `“${word}” is written with its ${GROUP_NAME(g)}.` : `“${p.print}” has its own sign here, so it is used.`);
  });
  return out;
}
