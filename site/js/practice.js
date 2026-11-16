// Practice: the sets, Auto (spaced practice), Guess / Draw / Type, and Read (the finger sweep).
import { LETTERS, IND, UEB_PUNCT, CONTRACTIONS, cellsOf, fromDots, toDots, translate, toCells } from './braille.js';

import { letterPad, paintTyped, typeHint } from './games.js';
import { COMMON_WORDS } from './wordlist.js';

import { PHRASES, signLine, numberLine } from './phrases.js';
import { chord } from './sixkey.js';
import { PASSAGES } from './passages.js';
import { G2_EXAMPLES } from './g2examples.js';
import { G2_EXAMPLE, G2_START, SHORT_SPELL, grp } from './learn.js';
import { $, $$, INDICATORS, S, announce, reducedMotion, bindRadios, cellHTML, cellsHTML, crowHTML, dropdown, esc, helpBtn, icon, kindOf, lblTag, level, markMulti, mastery, mirror, openSheet, radios, setS, setSub, setTitle, sheet, shuffle, spanOf, store, view, views } from './core.js';
import { logDay, openStats } from './home.js';
import { feedback, cellsLabel, say, refocus, nativeKey } from './a11y.js';
import { spotItems } from './rules.js';
import { composeMode } from './compose.js';
import { placementView } from './placement.js';
// ---------- practice data ----------
export const L = (letters) => () => letters.split('').map((l) => ({ key: l, cells: LETTERS[l], answer: l, kind: 'letter' }));
// The note is only shown in the help sheet's list, never in the quiz.
export const C = (cat) => () => CONTRACTIONS[cat].items.map(([w, d, n]) => ({ key: (cat === 'Lower wordsigns' && (w === 'be' || w === 'in') ? 'cw' : 'c') + w, cells: cellsOf(d), answer: w, kind: 'contraction', grp: cat,
  note: n || (cat === 'Shortforms' ? SHORT_SPELL[w] || '' : G2_EXAMPLE[w] ? 'e.g. ' + G2_EXAMPLE[w] : '') }));
// Short everyday words spelled letter by letter (Grade 1), for drawing whole words cell by cell. 40 per session.
export let SHORT_POOL = null;
export const SHORT_WORDS = () => { SHORT_POOL = SHORT_POOL || shuffle(COMMON_WORDS.filter((w) => /^[a-z]{3,4}$/.test(w))).slice(0, 40); return SHORT_POOL; };
export const MATH_SIGNS = ['+', '-', '×', '÷', '=', '$', '%', '@', '&', '#', '*', '°', '/'];
export const CATS = {
  letters: { name: 'ABC', sets: {
    aj: ['a–j', L('abcdefghij')], kt: ['k–t', L('klmnopqrst')], uz: ['u–z', L('uvwxyz')],
    az: ['All letters', L('abcdefghijklmnopqrstuvwxyz')], mirror: ['Mirror pairs', L('dfeihjrw'), 'd/f, e/i, h/j, r/w'],
    words: ['Words', () => SHORT_WORDS().map((w) => ({ key: 'sw' + w, cells: [...w].map((l) => LETTERS[l]).join(''), answer: w, kind: 'letter' })), 'Three and four letters, Grade 1'],
  } },
  symbols: { name: '!?#', sets: {
    num: ['Numbers', () => '1234567890'.split('').map((d) => ({ key: 'n' + d, cells: IND.number + LETTERS['jabcdefghi'[Number(d)]], answer: d, kind: 'digit' }))],
    punct: ['Punctuation', () => [',', ';', ':', '.', '!', '?', "'", '-', '—', '(', ')'].map((p) => ({ key: 'p' + p, cells: UEB_PUNCT[p][0], answer: p, label: UEB_PUNCT[p][1], kind: 'punct' }))],
    signs: ['Maths & money signs', () => MATH_SIGNS.map((p) => ({ key: p === '-' ? 'pminus' : 'p' + p, cells: (p === '-' ? [fromDots('5') + fromDots('36'), 'minus'] : UEB_PUNCT[p])[0], answer: p === '-' ? '−' : p, label: p === '-' ? 'minus' : UEB_PUNCT[p][1], kind: 'math' }))],
    ind: ['Indicators', () => INDICATORS.map(([p, d, n]) => ({ key: 'i' + p, cells: cellsOf(d), answer: p, kind: 'indicator', note: n }))],
  } },
  contractions: { name: 'Grade 2', sets: {
    start: ['Starter signs', () => G2_START.map((w) => Object.keys(CONTRACTIONS).flatMap((cat) => C(cat)()).find((x) => x.answer === w)).filter(Boolean)],
    ...Object.fromEntries(Object.keys(CONTRACTIONS).map((cat, i) => ['k' + i, [cat, C(cat)]])),
    all: ['All contractions', () => [...new Map(Object.keys(CONTRACTIONS).flatMap((cat) => C(cat)()).map((x) => [x.key, x])).values()]],
    // A word and a few ways to braille it: pick the one that follows the rules (Guess only).
    spot: ['Spot the right brailling', () => spotItems(), 'Which one follows the rules?', 'read'],
  } },
  // Auto: the set is the signs introduced so far (per mode), drawn from the whole course or one grade of it.
  auto: { name: 'Auto', sets: {
    all: ['All', (pre) => autoItems(pre, 'all'), 'Grade 1, then Grade 2'],
    g1: ['Grade 1', (pre) => autoItems(pre, 'g1'), 'Letters, numbers, punctuation'],
    g2: ['Grade 2', (pre) => autoItems(pre, 'g2'), 'Contractions only'],
  } },
};
// Auto comes first in the picker: it is the best way to learn, introducing and bringing back signs on its own.
export const CAT_ORDER = ['auto', ...Object.keys(CATS).filter((k) => k !== 'auto')];
// ---------- Auto: spaced practice ----------
// The course in teaching order: Grade 1 (letters, numbers, punctuation, indicators, maths) then Grade 2
// (the starter signs, then each contraction group). An item appears once, at its first place.
export let AUTO_COURSE = null;
export function autoCourse() {
  if (AUTO_COURSE) return AUTO_COURSE;
  const S = CATS.symbols.sets, G = CATS.contractions.sets;
  const tag = (src, list) => list.map((x) => ({ ...x, src }));
  const g1 = [CATS.letters.sets.aj, CATS.letters.sets.kt, CATS.letters.sets.uz, S.num, S.punct, S.ind, S.signs].flatMap(([n, f]) => tag(n, f()));
  const g2order = ['Strong contractions', 'Alphabetic wordsigns', 'Strong groupsigns', 'Strong wordsigns', 'Lower groupsigns', 'Lower wordsigns', 'Initial-letter contractions', 'Final-letter groupsigns', 'Shortforms'];
  const g2 = [...tag('start', G.start[1]()), ...g2order.flatMap((c) => tag(c, C(c)()))];
  const seen = new Set(), out = [];
  for (const [g, list] of [[1, g1], [2, g2]]) for (const it of list) if (!seen.has(it.key)) { seen.add(it.key); out.push({ ...it, g }); }
  AUTO_COURSE = out;
  return out;
}
export const autoList = (scope) => autoCourse().filter((x) => scope === 'g1' ? x.g === 1 : scope === 'g2' ? x.g === 2 : true);
// Each sign sits in a box; a right answer moves it up a box and it comes back after that many more turns.
// A miss sends it back to the first box.
export const AUTO_GAP = [1, 3, 6, 12, 25, 50, 100];
export const AUTO_NEW_AT_ONCE = 3; // signs still in the first two boxes before another new one arrives
export function autoState(pre) {
  const all = store.get('auto', {}), k = pre[0];
  if (!all[k]) {
    // First visit: signs already known from other practice start further along, so they're only reviewed.
    const m = mastery(), st = { turn: 0, s: {} };
    autoCourse().forEach((x, i) => { if ((m[pre + x.key] || 0) >= 4) st.s[x.key] = [3, 4 + (i % 20)]; });
    all[k] = st; store.set('auto', all);
  }
  return all[k];
}
export const autoSave = (pre, st) => { const all = store.get('auto', {}); all[pre[0]] = st; store.set('auto', all); };
export function autoItems(pre, scope) { const st = autoState(pre || 'r:'); return autoList(scope).filter((x) => st.s[x.key]); }
export function autoPick(pre, scope, lastKey) {
  const st = autoState(pre), list = autoList(scope);
  const met = list.filter((x) => st.s[x.key]);
  const learning = met.filter((x) => st.s[x.key][0] < 2).length;
  let fresh = list.find((x) => !st.s[x.key]);
  // Before showing a sign as new, check what you already know of it from other practice and lessons.
  if (fresh && learning < AUTO_NEW_AT_ONCE) {
    const m = mastery(), other = pre === 'w:' ? 'r:' : 'w:', done = store.get('learnDone', []);
    const lesson = (x) => (done.includes('alphabet') && x.kind === 'letter') || (done.includes('numbers') && ['digit', 'punct', 'indicator'].includes(x.kind)) || (done.includes('grade2') && x.src === 'start');
    let n = learning, changed = false;
    while (fresh && n < AUTO_NEW_AT_ONCE) {
      const a = m[pre + fresh.key] || 0, b = m[other + fresh.key] || 0;
      if (a >= 4) st.s[fresh.key] = [3, st.turn + 4 + Math.floor(Math.random() * 12)];
      else if (b >= 4) st.s[fresh.key] = [2, st.turn + 2 + Math.floor(Math.random() * 6)];
      else if (a > 0 || b > 0 || lesson(fresh)) { st.s[fresh.key] = [1, st.turn]; n++; }
      else break;
      changed = true;
      fresh = list.find((x) => !st.s[x.key]);
    }
    if (changed) { autoSave(pre, st); return autoPick(pre, scope, lastKey); }
    if (fresh) return { ...fresh, isNew: true };
  }
  const pool = met.filter((x) => x.key !== lastKey);
  if (!pool.length) return met[0] || (fresh && { ...fresh, isNew: true });
  // Most overdue first; among signs due on the same turn, a random one.
  const due = (x) => st.s[x.key][1];
  const best = Math.min(...pool.map(due));
  const tied = pool.filter((x) => due(x) === best);
  return tied[Math.floor(Math.random() * tied.length)];
}
export function autoMeet(pre, key) { const st = autoState(pre); if (!st.s[key]) st.s[key] = [0, st.turn]; autoSave(pre, st); }
export function autoResult(pre, key, ok) {
  const st = autoState(pre);
  st.turn++;
  const box = ok ? Math.min(AUTO_GAP.length - 1, ((st.s[key] || [0])[0]) + 1) : 0;
  st.s[key] = [box, st.turn + (ok ? AUTO_GAP[box] : 2)];
  autoSave(pre, st);
}
// ---------- Guess: confusable answers ----------
// A sign is shown on its own. No other reading of the same cells is ever offered (bb is never beside be or ;),
// so the choices alone settle what it means; the wrong answers favour the signs most easily confused with it.
// How alike two signs look: mirror image, moved up or down a row, one dot apart, same prefix, same group.
export const dotSet = (cells) => [...cells].map((c) => new Set(toDots(c)));
export function likeness(a, b) {
  const A = dotSet(a.cells), B = dotSet(b.cells);
  if (A.length !== B.length) return a.src && a.src === b.src ? 10 : 0;
  const same = (f) => A.every((s, i) => { const t = new Set([...s].map(f)); return t.size === B[i].size && [...t].every((d) => B[i].has(d)); });
  if (same((d) => (d <= 3 ? d + 3 : d - 3))) return 60;
  const down = (d) => (d === 3 || d === 6 ? 0 : d + 1), up = (d) => (d === 1 || d === 4 ? 0 : d - 1);
  if (A.every((s) => ![...s].includes(3) && ![...s].includes(6)) && same(down)) return 50;
  if (A.every((s) => ![...s].includes(1) && ![...s].includes(4)) && same(up)) return 50;
  const diff = A.reduce((n, s, i) => n + [...s].filter((d) => !B[i].has(d)).length + [...B[i]].filter((d) => !s.has(d)).length, 0);
  const firstSame = A.length > 1 && [...A[0]].length === B[0].size && [...A[0]].every((d) => B[0].has(d));
  return (diff === 1 ? 40 : diff === 2 ? 15 : 0) + (firstSame ? 20 : 0) + (a.src && a.src === b.src ? 10 : 0);
}
// Every reading of these cells anywhere in the course (b is also "but", bb also "be" and ";").
export const readingsOf = (cells) => autoCourse().filter((u) => u.cells === cells).map((u) => u.answer);
// Where in a word a sign may sit (none for signs that are never part of a word: wordsigns, punctuation, digits).
export function allowedPos(x) {
  if (x.kind === 'letter') return ['start', 'mid', 'end'];
  if (x.kind !== 'contraction') return [];
  switch (x.grp) {
    case 'Alphabetic wordsigns': case 'Strong wordsigns': case 'Lower wordsigns': case 'Shortforms': return [];
    case 'Strong groupsigns': return x.answer === 'ing' ? ['mid', 'end'] : ['start', 'mid', 'end'];
    case 'Lower groupsigns': return ['ea', 'bb', 'cc', 'ff', 'gg'].includes(x.answer) ? ['mid'] : ['be', 'con', 'dis'].includes(x.answer) ? ['start'] : ['start', 'mid', 'end'];
    case 'Final-letter groupsigns': return ['mid', 'end'];
    default: return ['start', 'mid', 'end'];
  }
}
// Shown on its own (pos null), no other reading of the same cells is offered, so the choices alone settle it.
// Shown inside a real word (pos start/mid/end), the word settles it, so readings that can't sit there
// become the best wrong answers (bb in rabbit is offered with be and ;).
export function guessOptions(item, pool, pos = null) {
  const same = autoCourse().filter((u) => u.cells === item.cells && u.answer !== item.answer);
  const fits = same.filter((u) => !pos || allowedPos(u).includes(pos));
  const bad = new Set([item.answer, ...fits.map((u) => u.answer)]);
  const seen = new Set(), cands = [];
  for (const x of [...pool, ...(pos ? same : [])]) {
    if ((!pos && x.cells === item.cells) || bad.has(x.answer) || seen.has(x.answer)) continue;
    seen.add(x.answer); cands.push([(x.cells === item.cells ? 100 : likeness(item, x)) + Math.random() * 9, x]);
  }
  return cands.sort((p, q) => q[0] - p[0]).slice(0, 3).map(([, x]) => x);
}
// ---------- Guess: signs inside real words ----------
// Grade 2 signs that live inside words are asked inside a real word: the sign at full strength, the rest of
// the word faded. Wordsigns and shortforms stand alone, so they are shown alone.
const IN_WORD_ONLY = ['Strong groupsigns', 'Lower groupsigns', 'Final-letter groupsigns'];
const IN_WORD_SOMETIMES = ['Strong contractions', 'Initial-letter contractions'];
const WORD_CACHE = new Map();
let WORD_SOURCE = null;
export function wordsFor(item) {
  if (WORD_CACHE.has(item.key)) return WORD_CACHE.get(item.key);
  WORD_SOURCE = WORD_SOURCE || [...new Set([...COMMON_WORDS, ...Object.values(G2_EXAMPLES).flatMap((x) => x.ok || []).filter((w) => /^[a-z]+$/.test(w))])];
  const out = [];
  for (const w of WORD_SOURCE) {
    if (w.length < 3 || w.length > 10 || !w.includes(item.answer) || w === item.answer) continue;
    const parts = translate(w, 'en', 2);
    const n = parts.reduce((a, x) => a + [...x.cells].length, 0);
    if (n < 2 || n > 6) continue;
    let at = 0;
    for (let i = 0; i < parts.length; i++) {
      const x = parts[i];
      if (x.kind === 'contraction' && x.print === item.answer && x.cells === item.cells) {
        const len = [...x.cells].length;
        out.push({ word: w, parts, at, len, pos: at === 0 ? 'start' : at + len === n ? 'end' : 'mid' });
        break;
      }
      at += [...x.cells].length;
    }
  }
  WORD_CACHE.set(item.key, out);
  return out;
}
export function wordContext(item) {
  if (item.kind !== 'contraction') return null;
  const always = IN_WORD_ONLY.includes(item.grp);
  if (!always && !(IN_WORD_SOMETIMES.includes(item.grp) && Math.random() < 0.5)) return null;
  const list = wordsFor(item);
  return list.length ? list[Math.floor(Math.random() * list.length)] : null;
}
// The word's cells: the asked sign at full strength, every other cell faded.
// What a screen reader hears for a prompt: the sign's dots, and the whole word when it is shown inside one.
export const promptLabel = (item, wc) => wc ? `Sign: ${cellsLabel(item.cells)}, shown inside a ${[...wc.parts.map((x) => x.cells).join('')].length}-cell word: ${cellsLabel(wc.parts.map((x) => x.cells).join(''))}` : `Sign: ${cellsLabel(item.cells)}`;
export const promptHTML = (item, wc) => `<div class="prompt-cells${wc ? ' in-word' : ''}" role="img" tabindex="-1" aria-label="${esc(promptLabel(item, wc))}">${wc ? wordCellsHTML(wc) : [...item.cells].map((c) => cellHTML(c)).join('')}</div>`;
export const wordCellsHTML = (wc) => [...wc.parts.map((x) => x.cells).join('')].map((c, i) => cellHTML(c, i >= wc.at && i < wc.at + wc.len ? '' : 'dim')).join('');
// ---------- practice help: what the chosen set is ----------
export const LOWER_NOTE = 'Lower signs are the shapes of a–j moved down one row, so they never use the top dots.';
export const SET_HELP = {
  'letters.aj': ['Letters a–j', ['The first ten letters use only the top four dots of the cell. They are the pattern the rest of the alphabet is built on, so they are worth knowing well.', 'After a number sign, the same ten cells are the digits 1 to 0.']],
  'letters.kt': ['Letters k–t', ['k to t are a to j with the lower-left dot added: k is a plus that dot, l is b plus it, and so on to t, which is j plus it.', 'If you know a–j, you only need to spot the extra dot.']],
  'letters.uz': ['Letters u–z', ['u, v, x, y and z are a to e with both bottom dots added.', 'w is the odd one out. French had no w when Louis Braille made the system, so it was added later and doesn’t follow the pattern: it is j plus the lower-right dot.']],
  'letters.az': ['All letters', ['The alphabet comes in three rows of ten. a–j use only the top four dots. k–t add the lower-left dot. u, v, x, y, z add both bottom dots to a–e, and w is j plus the lower-right dot.']],
  'letters.mirror': ['Mirror pairs', ['These letters are left-to-right mirror images of each other, so they are the easiest to mix up: d and f, e and i, h and j, r and w.', 'Look at which side of the cell the dots lean towards.']],
  'letters.words': ['Words', ['Everyday words of three or four letters, written letter by letter as in Grade 1.', 'In Draw, fill every cell of the word: each cell turns faintly green when it is right. In Guess, read the whole word.']],
  'symbols.num': ['Numbers', ['There are no separate digit cells. A number sign in front turns a–j into digits: a is 1, b is 2 and so on to i for 9 and j for 0.', 'One number sign covers the whole number, so 25 is the number sign, then b, then e. A comma or decimal point inside a number keeps it going; a space ends it.']],
  'symbols.punct': ['Punctuation', ['Most punctuation marks are lower signs. ' + LOWER_NOTE + ' The comma is a moved down, the period is d moved down, the exclamation mark is f.', 'The dash and the brackets take two cells: a prefix, then the sign. In Grade 2 the same lower cells are also contractions; where they sit in the word tells you which it is.']],
  'symbols.signs': ['Maths & money signs', ['These take two cells: a prefix, then a cell that names the sign.', 'Plus, minus, times, divided by, equals and the asterisk share the same prefix (the middle-right dot), so it is the second cell that tells them apart. Dollar, at and ampersand use the top-right dot instead: dollar is that dot plus s, at is that dot plus a.']],
  'symbols.ind': ['Indicators', ['Indicators are not printed characters. They change how the next cells are read.', 'The capital sign makes the next letter a capital; two make the whole word capitals, and three a whole passage, closed by the terminator. The number sign starts digits. The grade 1 indicator says the next cell is a plain letter, not a contraction. Italic and bold mark emphasis.']],
  'contractions.start': ['Starter signs', ['The 18 signs that turn up most in everyday text: the five strong contractions (and, for, of, the, with), a few one-letter wordsigns (but, can, do, it, that, you) and the commonest letter groups (ing, st, sh, th, ch, er, ed).', 'Knowing these makes most Grade 2 text much easier to read.']],
  'contractions.spot': ['Spot the right brailling', ['A word in print, and two to four ways to write it in braille. Only one follows the Grade 2 rules; the others use a sign where it isn’t allowed, or skip a sign that should be used.', 'After you answer, the reason appears under the choices. Each Grade 2 lesson in Learn has a Watch Out list with the same kind of mistakes.']],
  'contractions.all': ['All contractions', ['Grade 2 uses about 180 contractions to make braille shorter. Many cells mean different things alone and inside a word, so each sign has rules for where it may go.', 'Learn them group by group; this set mixes every group.']],
  'Alphabetic wordsigns': ['Alphabetic wordsigns', ['When a letter stands alone, with a space or punctuation on each side, it means a whole word: b alone is “but”, c is “can”, d is “do”.', 'Inside a word the letter is just a letter. a, i and o are already words, so they have no wordsign; x is “it”, y is “you” and z is “as”.']],
  'Strong contractions': ['Strong contractions', ['and, for, of, the and with each have their own cell. They are “strong” because they can go anywhere: as a whole word (the) or inside one (them, form, often, without).', 'They fill the cell from the top, so they are easy to tell apart from the lower signs.']],
  'Strong groupsigns': ['Strong groupsigns', ['Common letter groups get one cell each and can be used anywhere in a word: ch in chip, ed in edit, ar in park.', 'The one exception is ing, which never starts a word. Where a group spans two parts of a compound word (like the t and h in pothole), the letters are written out.']],
  'Strong wordsigns': ['Strong wordsigns', ['Six of the strong groupsigns double as whole words when they stand alone: ch is “child”, sh is “shall”, th is “this”, wh is “which”, ou is “out” and st is “still”.', 'Inside a word they go back to being the letter group.']],
  'Lower groupsigns': ['Lower groupsigns', [LOWER_NOTE + ' ea is a moved down, bb is b, cc is c, en is e, in is i.', 'Because they look alike, position matters. ea, bb, cc, ff and gg go only in the middle of a word, never first or last. en and in can go anywhere. be, con and dis only start a word, as its first syllable. The same cell can mean two things by position: one is both bb and be, another both cc and con.']],
  'Lower wordsigns': ['Lower wordsigns', ['be, enough, were, his, in and was each use one lower cell when they stand alone as a word. ' + LOWER_NOTE, 'A word made only of lower cells is hard to place in the line, so these are only used when nothing touches them. Next to punctuation the word is written another way.']],
  'Initial-letter contractions': ['Initial-letter contractions', ['A prefix from the right-hand column of the cell, then the first letter (or groupsign) of the word: the middle-right dot plus d is “day”, plus m is “mother”.', 'There are three prefixes, each with its own list: the middle-right dot alone, the top and middle-right dots, and the whole right column. They work as words and inside words: someone, daytime, mother’s.']],
  'Final-letter groupsigns': ['Final-letter groupsigns', ['Common word endings: a prefix, then the last letter of the ending. ound, ance, sion, less and ount use the top-right and bottom-right dots as the prefix; ence, ong, ful, tion, ness, ment and ity use the middle-right and bottom-right dots.', 'They only ever follow letters, never start a word: pound, dance, nation, city.']],
  'Shortforms': ['Shortforms', ['Shortforms are abbreviated spellings of common words: about is ab, could is cd, braille is brl. Each one is listed with its spelling.', 'They are mainly used as whole words, and some take endings (friends, braille’s). Inside longer words only some are allowed, so learn them as words first.']],
  'auto': ['Auto', ['Auto teaches you braille a few signs at a time, in the order most courses use: letters, numbers and punctuation first, then Grade 2 contractions.', 'Each new sign is shown to you before it is asked. Signs you get right come back less and less often; a miss brings a sign back soon. A new one arrives once the last few are settling in.', 'Use the drop-down to stick to Grade 1 or Grade 2. Guess and Draw keep their own progress, and signs you already know from other practice start as known.', 'Already know some braille? The placement check (Practice > Guess > Auto, below the card) asks a few questions from each part of the course and marks what you know.']],
};
export const setHelpKey = (cat, set) => cat === 'auto' ? 'auto' : cat === 'contractions' && /^k\d+$/.test(set) ? Object.keys(CONTRACTIONS)[Number(set.slice(1))] : `${cat}.${set}`;
export const helpTitle = (cat, set) => (SET_HELP[setHelpKey(cat, set)] || [MODES.read])[0];
export function practiceHelp(mode, cat, set) {
  const info = SET_HELP[setHelpKey(cat, set)];
  const pre = mode === 'write' ? 'w:' : 'r:';
  const sets = CATS[cat] && CATS[cat].sets;
  const list = sets && sets[set] ? sets[set][1](pre) : [];
  const rows = list.map((x) => crowHTML(x.cells, x.answer, { kind: x.kind || '', note: x.label || x.note || '' })).join('');
  const listH = cat === 'auto' ? (list.length ? `Signs so far <span class="count">${list.length} of ${autoList(set).length}</span>` : 'Signs so far') : `Signs in this set <span class="count">${list.length}</span>`;
  return `<div class="help">
    ${info ? info[1].map((t) => `<p>${esc(t)}</p>`).join('') : ''}
    <details class="help-mode"><summary><span>How ${esc(MODES[mode])} works</span>${icon('chevron', 18)}</summary><div>${helpHTML(mode)}</div></details>
    <h3 class="help-h">${listH}</h3>
    ${rows ? `<div class="ctable help-list">${rows}</div>` : '<p class="muted">Your first sign is on its way.</p>'}
  </div>`;
}
export const SWEEP_SRC = { words: 'Words', phrases: 'Phrases', numbers: 'Numbers', signs: 'Signs', passages: 'Passages' };
// Mode keys stay as they were (URLs, saved progress); only the names changed.
export const MODES = { read: 'Guess', write: 'Draw', words: 'Type', sweep: 'Read', compose: 'Write' };
// A shuffled deck: every item comes up once before any repeats.
export function deck(list) {
  let d = [];
  return () => { if (!d.length) d = shuffle(list); return d.pop(); };
}
export const WORD_LEN = { short: ['Short', (w) => w.length >= 2 && w.length <= 4], medium: ['Medium', (w) => w.length >= 5 && w.length <= 7], long: ['Long', (w) => w.length >= 8] };
export const HELP = {
  read: ['A braille cell appears. Pick what it says.', 'Grade 2 signs that sit inside words are shown in a real word, with the rest of the word faded. Where the sign falls in the word tells you what it means.', 'The card glows green when you’re right, and red with a small shake when you’re not.', 'Each item’s pill goes from pale blue to dark blue, then green once you know it. Ones you miss come up more often.'],
  write: ['Tap the dots that make the letter or symbol. It checks itself as you go.', 'The card glows green when the dots are right, and red if you add one that doesn’t belong.', 'Longer symbols are built one cell at a time.'],
  words: ['Decode the word and type it. It checks as you type.', 'Pick Grade 1 or Grade 2 braille, and short, medium or long words. Words come from the 5,000 most common in English, in random order.', 'Hint reveals one cell at a time. Skip shows the answer.'],
  compose: ['Write the words or sentence in braille, one cell at a time: tap the dots of the next cell. As soon as they match, the cell is added and you move on; spaces between words are added for you.', 'A dot that isn’t in the cell turns red: tap it again to take it off. The words and your braille sit on one line at the top, which scrolls along as you write.', 'Pick Grade 1 to spell everything out, or Grade 2 to use contractions. Hint fills in the next cell. Right first time counts the ones written with no red dots or hints.'],
  sweep: ['Put your finger on the line and slide right, like reading real braille.', 'Each letter fades in as you reach the end of its cell.', 'Hold your finger right of the middle and the line keeps moving, faster the further out you go. Lift it and you glide back to the middle.', 'Restart goes back to the start of the line. Next loads a new one.'],
};
export const HELP_KEYS = {
  read: 'Press 1, 2, 3 or 4 to pick an answer.',
  write: 'F, D and S are the left column, top to bottom; J, K and L are the right column, like a Perkins brailler. Backspace clears.',
  words: 'Just type the word; there is no need to press Enter.',
  sweep: 'Move the mouse along the line, or use the arrow keys.',
  compose: 'F D S J K L are dots 1 to 6, and Enter goes to the next one when you finish. With six-key typing on, press a whole cell at once.',
};
export const helpHTML = (k) => HELP[k].map((t) => `<p>${esc(t)}</p>`).join('') + (HELP_KEYS[k] ? `<p class="help-keys">${icon('keyboard', 18)}<span>${esc(HELP_KEYS[k])}</span></p>` : '');
views.practice = (q, sub) => {
  if (sub === 'stats') { const r = views.practice(q); openStats(); return r; }
  if (sub === 'place') return placementView();
  const mode = MODES[sub] ? sub : store.get('pmode', 'read');
  store.set('pmode', mode); store.set('pvisited', true);
  setTitle('Practice');
  setSub(`<div class="seg radios modes" role="radiogroup">${Object.entries(MODES).map(([k, v]) => `<a role="radio" aria-checked="${k === mode}" class="${k === mode ? 'on' : ''}" href="#/practice/${k}">${icon(k, 20)}<span>${v}</span></a>`).join('')}</div>`);
  helpBtn.hidden = false;
  helpBtn.onclick = () => openSheet(`<div class="help">${helpHTML(mode)}</div>`, { title: MODES[mode] });
  view.innerHTML = `<div class="practice-wrap mode-${mode}"><div class="picker" id="picker"></div><div id="modeBody"></div></div>`;
  return mode === 'sweep' ? sweepMode(q) : mode === 'compose' ? composeMode(q) : quizMode(mode, q);
};
export const ROUND_LEN = 20;
export function quizMode(mode, q) {
  const saved = store.get('psel', { cat: 'auto', set: 'g1' });
  if (saved.cat === 'review') saved.cat = 'auto';
  const state = { cat: (q.get('cat') === 'review' ? 'auto' : q.get('cat')) || saved.cat, set: q.get('set') || saved.set, wgrade: store.get('pwgrade', 1), wlen: store.get('pwlen', 'medium'), streak: 0, right: 0, total: 0, last: null, firstTry: true };
  if (!CATS[state.cat]) state.cat = 'letters';
  // Some sets only work in one mode (Spot the right brailling is Guess only).
  const setsFor = (cat) => Object.entries(CATS[cat].sets).filter(([, x]) => !x[3] || x[3] === mode);
  if (!CATS[state.cat].sets[state.set] || !setsFor(state.cat).some(([k]) => k === state.set)) state.set = setsFor(state.cat)[0][0];
  const m = mastery();
  // Practice runs in rounds of ROUND_LEN scored questions, then shows a summary (see renderSummary).
  const newRound = () => ({ n: 0, right: 0, best: 0, run: 0, met: 0, start: Date.now(), log: [] });
  let round = newRound(), queue = [];
  const rlen = () => round.len || ROUND_LEN;
  const picker = $('#picker'), body = $('#modeBody');
  if (mode !== 'words') helpBtn.onclick = () => openSheet(practiceHelp(mode, state.cat, state.set), { title: helpTitle(state.cat, state.set) });
  body.innerHTML = `<div class="card stage" id="stage"></div>
    ${mode === 'words' ? `<div class="w-score" id="wScore"></div><div id="wkb"></div>` : `<div class="below-stage">
      <div class="mastery-h"><span><span id="pRound"></span>Known: <b id="known">0</b> of <b id="kTotal">0</b><span id="mLearn"></span> <span class="m-sep">·</span> <a class="st-link" href="#/practice/stats" data-stats>Stats</a></span><button type="button" class="m-more" id="mMore" aria-expanded="false" aria-label="Show all" hidden>${icon('chevron', 20)}</button></div>
      <div class="mastery" id="mastery" role="list" aria-label="Signs in this set"></div>
      <p class="pl-link" id="plLink" hidden>Know braille already? <a href="#/practice/place">Take the placement check</a></p>
      <p class="kb-hint">${mode === 'read' ? 'Keys: press the answer, or <b>1</b>–<b>4</b> for the choices. <b>Enter</b> moves on after a new sign.' : 'Keys: <b>F D S</b> and <b>J K L</b> are dots 1 2 3 and 4 5 6.'}</p>
    </div>`}`;
  const stage = $('#stage');
  const pre = mode === 'write' ? 'w:' : 'r:';
  const auto = () => state.cat === 'auto';
  // Auto never merges: its options already skip anything with the same cells as the answer.
  const items = () => {
    const it = CATS[state.cat].sets[state.set][1](pre);
    return it;
  };
  const score = (k) => m[pre + k] || 0;
  const bump = (k, d) => {
    m[pre + k] = Math.max(0, Math.min(5, score(k) + d)); store.set('mastery', m);
    if (d < 0) { const ms = store.get('misses', {}); ms[pre + k] = (ms[pre + k] || 0) + 1; store.set('misses', ms); }
  };

  let wordDeck = null;
  function renderPicker() {
    if (mode === 'words') {
      if (!WORD_LEN[state.wlen]) state.wlen = 'medium';
      picker.innerHTML = '<div class="sw-row fit">' + radios('wgrade', [[1, 'Grade 1'], [2, 'Grade 2']], state.wgrade) + radios('wlen', Object.entries(WORD_LEN).map(([k, [n]]) => [k, n]), state.wlen) + '</div>';
      wordDeck = deck(COMMON_WORDS.filter(WORD_LEN[state.wlen][1]));
    } else {
      picker.innerHTML = radios('cat', CAT_ORDER.map((k) => [k, CATS[k].name]), state.cat) + '<div id="setDD"></div>';
      dropdown($('#setDD'), { aria: 'Set', options: setsFor(state.cat).map(([k, [n, , hint]]) => ({ value: k, label: n, hint })), value: state.set, onChange: (v) => { state.set = v; saveSel(); restart(); } });
    }
  }
  const saveSel = () => store.set('psel', { cat: state.cat, set: state.set });
  bindRadios(picker, (k, v) => {
    if (k === 'wgrade') { state.wgrade = Number(v); store.set('pwgrade', state.wgrade); round = newRound(); queue = []; wScore(); next(); return; }
    if (k === 'wlen') { state.wlen = v; store.set('pwlen', v); wordDeck = deck(COMMON_WORDS.filter(WORD_LEN[v][1])); round = newRound(); queue = []; wScore(); next(); return; }
    state.cat = v; state.set = setsFor(v)[0][0]; saveSel(); renderPicker(); restart();
  });
  function restart() { state.last = null; round = newRound(); queue = []; renderMastery(); next(); }
  // Pills for every symbol in the set, collapsed to four rows with a fade; the chevron only shows when there is more.
  let mOpen = store.get('mOpen', false);
  function renderMastery() {
    if (mode === 'words') return;
    const it = items(), box = $('#mastery');
    $('#pRound').innerHTML = `Round: <b>${Math.min(round.n + 1, rlen())}</b> / ${rlen()} <span class="m-sep">·</span> `;
    const LV = ['new', 'learning', 'learning', 'learning', 'known'];
    box.innerHTML = it.map((x) => `<span data-l="${level(score(x.key))}" role="listitem">${esc(x.answer)}<span class="visually-hidden">, ${LV[level(score(x.key))]}</span></span>`).join('');
    // Auto lists only the signs met so far, but counts against the whole course.
    $('#known').textContent = it.filter((x) => level(score(x.key)) >= 4).length;
    // Signs on their way (one to three right in a row) count too, so progress shows from the first answers.
    const learning = it.filter((x) => { const l = level(score(x.key)); return l > 0 && l < 4; }).length;
    // Early in Auto, offer the placement check so people who know some braille can skip ahead.
    const pl = $('#plLink'); if (pl) pl.hidden = !(auto() && it.length < 12);
    $('#mLearn').innerHTML = learning ? ` <span class="m-sep">·</span> Learning: <b>${learning}</b>` : ''; $('#kTotal').textContent = auto() ? autoList(state.set).length : it.length;
    fitMastery(); requestAnimationFrame(fitMastery);
  }
  function fitMastery() {
    const box = $('#mastery'), more = $('#mMore'); if (!box || !more) return;
    box.classList.remove('clamp');
    const first = box.firstElementChild;
    const fits = !first || !first.offsetHeight || box.scrollHeight <= first.offsetHeight * 2 + 4 + 2;
    more.hidden = fits;
    box.classList.toggle('clamp', !fits && !mOpen);
    more.setAttribute('aria-expanded', String(!fits && mOpen)); more.classList.toggle('open', mOpen);
  }
  if (mode !== 'words') $('#mMore').onclick = () => { mOpen = !mOpen; store.set('mOpen', mOpen); renderMastery(); };
  function nextItem() {
    if (auto()) return autoPick(pre, state.set, state.last && state.last.key);
    const it = items();
    let pool = it.filter((x) => !state.last || x.key !== state.last.key);
    if (!pool.length) pool = it;
    const w = pool.map((x) => 6 - score(x.key));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
    return pool[0];
  }
  function result(ok, item) {
    if (state.firstTry) {
      logDay();
      state.total++;
      if (ok) { state.right++; state.streak++; } else state.streak = 0;
      if (item.key) bump(item.key, ok ? 1 : -1);
      if (item.key && auto()) autoResult(pre, item.key, ok);
      round.n++; round.run = ok ? round.run + 1 : 0; round.best = Math.max(round.best, round.run);
      if (ok) round.right++;
      round.log.push({ item: mode === 'words' ? state.last : item, ok, ms: Date.now() - state.shownAt, wrong: ok ? null : state.wrongAns });
    }
    state.firstTry = false;
    if (mode === 'words') { wScore(); return; }
    renderMastery();
  }
  // Feedback is a coloured glow on the card (plus a shake when wrong).
  // Screen readers hear the result too.
  const glow = (ok) => {
    stage.classList.remove('glow-good', 'glow-bad'); void stage.offsetWidth;
    stage.classList.add(ok ? 'glow-good' : 'glow-bad');
    feedback(ok);
  };

  // Auto: a new sign is shown with its answer before it is asked.
  function renderIntro(item) {
    state.last = item;
    stage.classList.remove('glow-good', 'glow-bad');
    const wc = mode === 'read' ? wordContext(item) : null;
    stage.innerHTML = `<div class="intro">
      <span class="intro-tag">New sign</span>
      ${promptHTML(item, wc)}
      <div class="intro-ans">${esc(item.answer)}</div>
      ${wc ? `<p class="intro-note">as in “${esc(wc.word)}”</p>` : ''}
      ${item.label || item.note || item.grp ? `<p class="intro-note">${esc([item.label, item.grp, item.note].filter(Boolean).join(' · '))}</p>` : ''}
      <button class="btn primary" id="gotIt" type="button">Got it</button></div>`;
    const go = () => { autoMeet(pre, item.key); round.met++; state.forced = item; state.wc = wc ? [item.key, wc] : null; next(); };
    $('#gotIt').onclick = go;
    refocus(stage, $('#gotIt'));
    say(`New sign: ${item.answer}. ${promptLabel(item, wc)}`);
    state.key = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
  }

  function renderRead() {
    const item = takeItem(); if (!item) return; state.last = item; state.firstTry = true; state.shownAt = Date.now(); state.wrongAns = null;
    if (item.spot) return renderSpot(item);
    stage.classList.remove('glow-good', 'glow-bad');
    let pool = items().filter((x) => x.key !== item.key);
    // Early in Auto, top up from the sign's own group so there are always three wrong answers.
    if (auto() && pool.length < 6) pool = [...pool, ...autoList('all').filter((x) => x.src === item.src && x.key !== item.key && !pool.some((o) => o.key === x.key))];
    const wc = state.wc && state.wc[0] === item.key ? state.wc[1] : wordContext(item);
    state.wc = null;
    const opts = shuffle([item, ...guessOptions(item, pool, wc && wc.pos)]);
    const long = opts.some((o) => o.answer.length > 2);
    stage.innerHTML = `
      ${promptHTML(item, wc)}
      <div class="choices ${long ? 'words' : ''}" role="group" aria-label="Answers">${opts.map((o) => `<button class="choice" data-k="${esc(o.key)}">${esc(o.answer)}${o.label ? `<small>${esc(o.label)}</small>` : ''}</button>`).join('')}</div>`;
    refocus(stage, $('.prompt-cells', stage));
    say(`${promptLabel(item, wc)}. Choices: ${opts.map((o) => o.answer).join(', ')}`);
    let misses = 0;
    const choose = (btn) => {
      if (!btn || btn.classList.contains('right') || btn.classList.contains('wrong') || $('.choice.right', stage)) return;
      const ok = btn.dataset.k === item.key;
      state.wrongAns = ok ? null : (opts.find((o) => o.key === btn.dataset.k) || {}).answer;
      result(ok, item); glow(ok);
      btn.classList.add(ok ? 'right' : 'wrong');
      if (ok) setTimeout(next, 650);
      // After a second miss, outline the right answer; it still has to be tapped to move on.
      else if (++misses >= 2) { const r = $$('.choice', stage).find((b) => b.dataset.k === item.key); if (r) { r.classList.add('reveal'); announce(`The answer is ${item.answer}`); } }
    };
    stage.onclick = (e) => choose(e.target.closest('.choice'));
    state.key = (e) => {
      const btns = $$('.choice', stage);
      if (/^[1-4]$/.test(e.key) && !opts.some((o) => /^[0-9]$/.test(o.answer))) return choose(btns[Number(e.key) - 1]);
      const o = opts.find((x) => x.answer === e.key.toLowerCase());
      if (o) choose(btns.find((b) => b.dataset.k === o.key));
    };
  }

  // Spot the right brailling: a print word and two to four brailled versions; only one follows UEB.
  // Cells are plain (no colour coding, no print); once answered, the reason for the trap is shown under the choices.
  function renderSpot(item) {
    stage.classList.remove('glow-good', 'glow-bad');
    const sp = item.spot;
    const opts = shuffle([{ cells: sp.right, ok: true }, ...shuffle(sp.wrongs).slice(0, 3)]);
    const optHTML = (o, i) => `<button type="button" class="spot-opt" data-i="${i}" aria-label="Option ${i + 1}: ${esc(cellsLabel(o.cells))}"><span class="spot-n" aria-hidden="true">${i + 1}</span><span class="spot-cells">${[...o.cells].map((c) => cellHTML(c)).join('')}</span></button>`;
    stage.innerHTML = `<p class="spot-q" tabindex="-1">Which is <b>${esc(sp.word)}</b> in Grade 2?</p>
      <div class="spot-opts" role="group" aria-label="Brailled versions">${opts.map((o, i) => optHTML(o, i)).join('')}</div>
      <p class="spot-why" id="spotWhy" aria-live="polite"></p>
      <div class="spot-next"><button class="btn primary" id="spotNext" type="button" hidden>Next</button></div>`;
    refocus(stage, $('.spot-q', stage));
    say(`Which is ${sp.word} in Grade 2? ${opts.map((o, i) => `Option ${i + 1}: ${cellsLabel(o.cells)}`).join('. ')}`);
    let misses = 0, done = false;
    const why = $('#spotWhy', stage), btns = $$('.spot-opt', stage);
    const finish = () => {
      done = true;
      btns.forEach((b, i) => { if (opts[i].ok) b.classList.add('right'); else if (!b.classList.contains('wrong')) b.classList.add('dim'); });
      $('#spotNext', stage).hidden = false;
    };
    const choose = (b) => {
      if (!b || done || b.classList.contains('wrong')) return;
      const o = opts[Number(b.dataset.i)];
      result(o.ok, item); glow(o.ok);
      b.classList.add(o.ok ? 'right' : 'wrong');
      if (o.ok) {
        // Right: say what the main trap was, so the rule sticks.
        const trap = opts.find((x) => !x.ok);
        why.innerHTML = `<b>Right.</b> ${trap ? esc(trap.why) : ''}`;
        finish();
      } else {
        why.innerHTML = `<b>Not this one.</b> ${esc(o.why)}`;
        if (++misses >= 2 || opts.length - misses <= 1) finish();
      }
    };
    stage.onclick = (e) => { const b = e.target.closest('.spot-opt'); if (b) return choose(b); if (e.target.closest('#spotNext')) next(); };
    state.key = (e) => {
      if (/^[1-4]$/.test(e.key)) return choose(btns[Number(e.key) - 1]);
      if ((e.key === 'Enter' || e.key === 'ArrowRight') && done && !e.target.closest?.('button')) { e.preventDefault(); next(); }
    };
  }

  function renderWrite() {
    const item = takeItem(); if (!item) return; state.last = item; state.firstTry = true; state.shownAt = Date.now(); state.wrongAns = null;
    stage.classList.remove('glow-good', 'glow-bad');
    const targets = [...item.cells];
    let done = false, shown = false;
    const on = targets.map(() => new Set()), ok = targets.map(() => false);
    // Several cells sit side by side at full size; each one turns faintly green when it's right.
    stage.innerHTML = `
      <div class="target" tabindex="-1" aria-label="Draw ${esc(item.answer)}${item.label ? ', ' + esc(item.label) : ''}${targets.length > 1 ? `, ${targets.length} cells` : ''}">${esc(item.answer)}</div>
      <div class="pads" style="--n:${targets.length}">${targets.map((_, ci) => `<div class="dotpad" data-c="${ci}">${[1, 2, 3, 4, 5, 6].map((d) => `<button data-d="${d}" aria-pressed="false" aria-label="${targets.length > 1 ? `Cell ${ci + 1}, ` : ''}dot ${d}">${d}</button>`).join('')}</div>`).join('')}</div>
      <button class="link-btn corner" id="skip">Show me</button>`;
    const pads = $$('.dotpad', stage);
    const paint = (ci) => { [1, 2, 3, 4, 5, 6].forEach((d) => { const b = $(`[data-d="${d}"]`, pads[ci]); b.classList.toggle('on', on[ci].has(d)); b.setAttribute('aria-pressed', String(on[ci].has(d))); }); pads[ci].classList.toggle('ok', ok[ci]); };
    refocus(stage, $('.target', stage));
    say(`Draw ${item.answer}${item.label ? ', ' + item.label : ''}`);
    const evaluate = (ci, added) => {
      if (done) return;
      const w = new Set(toDots(targets[ci]));
      if (added && !w.has(added)) { result(false, item); glow(false); pads[ci].classList.remove('bad'); void pads[ci].offsetWidth; pads[ci].classList.add('bad'); }
      const was = ok[ci];
      ok[ci] = on[ci].size === w.size && [...w].every((d) => on[ci].has(d)); paint(ci);
      if (ok[ci] && !was && targets.length > 1 && !ok.every(Boolean)) announce(`Cell ${ci + 1} done`);
      // After "Show me", stay three times as long so the answer can sink in.
      if (ok.every(Boolean)) { done = true; result(true, item); glow(true); setTimeout(next, shown ? 2250 : 750); }
    };
    const tog = (ci, d) => {
      if (done) return;
      if (on[ci].has(d)) { on[ci].delete(d); paint(ci); evaluate(ci, 0); } else { on[ci].add(d); paint(ci); evaluate(ci, d); }
    };
    stage.querySelector('.pads').onclick = (e) => { const b = e.target.closest('button[data-d]'); if (b) tog(Number(b.closest('.dotpad').dataset.c), Number(b.dataset.d)); };
    $('#skip').onclick = () => {
      if (done) return;
      if (state.firstTry) result(false, item);
      shown = true;
      targets.forEach((t, ci) => { on[ci] = new Set(toDots(t)); });
      targets.forEach((t, ci) => evaluate(ci, 0));
      announce(`${item.answer} is ${cellsLabel(item.cells)}`);
    };
    const KEYS = { f: 1, d: 2, s: 3, j: 4, k: 5, l: 6 };
    state.key = (e) => { const d = KEYS[e.key.toLowerCase()]; if (!d) return; const ci = Math.max(0, ok.indexOf(false)); tog(ci, d); };
  }

  function renderWords() {
    const word = queue.length ? queue.shift() : wordDeck();
    state.last = word; state.firstTry = true; state.shownAt = Date.now(); state.wrongAns = null;
    stage.classList.remove('glow-good', 'glow-bad');
    const cells = toCells(translate(word, 'en', state.wgrade));
    let done = false, hinting = false;
    // Contractions are colour coded like everywhere else; cells stay one size so nothing jumps around.
    const cellsHTML = cells.map((c, i) => `<span class="bw">${cellHTML(c.cell, '', { kind: kindOf(c) })}${lblTag(c.idx === 0 ? spanOf(cells, i) : 1)}</span>`).join('');
    stage.innerHTML = `
      <div class="w-top"><button class="link-btn pillish" id="hint">Hint</button><button class="link-btn pillish" id="skip">Skip</button></div>
      <div class="prompt-cells words many" id="wcells" role="img" tabindex="-1" aria-label="Word: ${esc(cellsLabel(cells.map((c) => c.cell).join('')))}">${cellsHTML}</div>`;
    refocus(stage, $('#wcells', stage));
    say(`Word: ${cellsLabel(cells.map((c) => c.cell).join(''))}`);
    const lbls = $$('#wcells .lbl');
    const target = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    const check = () => {
      if (done) return;
      if (wpad.value === target) { done = true; result(true, {}); glow(true); paintTyped(lbls, cells, '', true); setTimeout(next, 900); }
      else paintTyped(lbls, cells, wpad.value);
    };
    wOnInput = () => { if (!hinting) check(); };
    wOnEnter = () => { if (!done && wpad.value) { result(false, {}); glow(false); } };
    wpad.value = ''; check();
    $('#hint').onclick = () => {
      if (done || hinting) return;
      state.firstTry = false; hinting = true;
      typeHint(wpad, target, (fin) => { if (fin) { hinting = false; check(); } else paintTyped(lbls, cells, wpad.value); }, () => done || state.last !== word);
    };
    $('#skip').onclick = () => { if (done) return; done = true; if (state.firstTry) result(false, {}); paintTyped(lbls, cells, '', true); announce(`The word was ${word}`); setTimeout(next, 1300); };
    state.key = null;
  }
  // Type mode score: words right first time this session, the current streak and the best streak ever (per grade).
  function wScore() {
    const el = $('#wScore'); if (!el) return;
    const bk = 'pwbest' + state.wgrade, b = Math.max(store.get(bk, 0), state.streak); store.set(bk, b);
    el.innerHTML = `<span>Round: <b>${Math.min(round.n + 1, rlen())}</b> / ${rlen()}</span><span>Right: <b>${state.right}</b> of ${state.total}</span><span>Streak: <b>${state.streak}</b></span><span>Best: <b>${b}</b></span>`;
  }
  // Type mode: one on-screen keyboard for the whole session; each word plugs in its own handlers.
  let wOnInput = () => {}, wOnEnter = () => {};
  const wpad = mode === 'words' ? letterPad({ mount: $('#wkb'), onInput: () => wOnInput(), onEnter: () => wOnEnter() }) : null;
  // The next item to ask; in Auto a brand-new sign gets its intro card first.
  function takeItem() {
    if (state.forced) { const f = state.forced; state.forced = null; return f; }
    if (queue.length) return queue.shift();
    const it = nextItem();
    if (it && it.isNew) { renderIntro(it); return null; }
    return it;
  }
  let dead = false;
  function next() {
    if (dead) return;
    if (round.n >= rlen()) return renderSummary();
    ({ read: renderRead, write: renderWrite, words: renderWords })[mode]();
  }
  // End of a round: score, a few facts, then the signs worth another look (misses first, then the slowest).
  function renderSummary() {
    stage.classList.remove('glow-good', 'glow-bad');
    const secs = Math.round((Date.now() - round.start) / 1000);
    const cellsOf = (x) => (mode === 'words' ? toCells(translate(x, 'en', state.wgrade)).map((c) => c.cell).join('') : x.cells);
    const keyOf = (x) => (mode === 'words' ? x : x.key);
    const seen = new Map();
    for (const r of round.log) {
      const k = keyOf(r.item), s = seen.get(k) || { item: r.item, miss: 0, wrong: new Map(), ms: 0 };
      if (!r.ok) { s.miss++; if (r.wrong) s.wrong.set(r.wrong, (s.wrong.get(r.wrong) || 0) + 1); }
      s.ms = Math.max(s.ms, r.ms); seen.set(k, s);
    }
    const missed = [...seen.values()].filter((s) => s.miss).sort((a, b) => b.miss - a.miss);
    const slow = [...seen.values()].filter((s) => !s.miss && s.ms >= 5000).sort((a, b) => b.ms - a.ms);
    const look = [...missed, ...slow].slice(0, 5);
    const note = (s) => {
      if (!s.miss) return `Slow: ${Math.round(s.ms / 1000)} s`;
      const w = [...s.wrong.entries()].sort((a, b) => b[1] - a[1])[0];
      const times = s.miss > 1 ? (s.miss === 2 ? ', twice' : `, ${s.miss} times`) : '';
      return w ? `Mixed up with ${w[0]}${times}` : `Missed${times}`;
    };
    const label = (x) => (mode === 'words' ? x : x.answer);
    const facts = [auto() && !round.len ? [round.met, 'new signs'] : [round.best, 'best run'], [`${Math.round(round.right / Math.max(1, round.n) * 100)}%`, 'first try'], [`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, 'time']];
    stage.innerHTML = `<div class="rsum">
      <h3>${round.len ? 'Practice Done' : 'Round Done'}</h3>
      <div class="rs-big">${round.right}<small> / ${round.n}</small></div>
      <div class="rs-facts">${facts.map(([v, k]) => `<div><b>${v}</b>${k}</div>`).join('')}</div>
      ${look.length ? `<div class="rs-k">Worth another look</div><div class="ctable narrow rs-rows">${look.map((s) => crowHTML(cellsOf(s.item), label(s.item), { note: note(s) })).join('')}</div>` : '<p class="rs-k rs-clean">Nothing missed this round.</p>'}
      <div class="rs-acts">${look.length ? `<button class="btn" id="rsDrill" type="button">Practise ${look.length === 1 ? 'This One' : `These ${look.length}`}</button>` : ''}<button class="btn primary" id="rsNext" type="button">Next Round</button></div></div>`;
    const go = (items) => {
      round = newRound(); state.last = null;
      // A drill asks each sign twice, spread out; it is a short round of its own.
      if (items) { queue = shuffle([...items, ...items]); round.len = queue.length; } else queue = [];
      if (mode === 'words') wScore(); else renderMastery();
      next();
    };
    markMulti(stage);
    $('#rsNext').onclick = () => go();
    if ($('#rsDrill')) $('#rsDrill').onclick = () => go(look.map((s) => s.item));
    state.key = (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
    if (mode === 'words') { wOnInput = () => {}; wOnEnter = () => go(); }
    if (mode === 'words') wScore(); else renderMastery();
  }
  // Six-key input in Guess: a chord spelling one of the answers picks it (Draw already uses F D S J K L for its dots).
  const six = mode === 'read' ? chord((ds, cell, letter) => { if (letter && state.key) state.key({ key: letter, preventDefault() {} }); }) : null;
  const onKey = (e) => { if (e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey || !sheet.hidden || nativeKey(e)) return; if (six && six.down(e)) return; state.key && state.key(e); };
  const onKeyUp = (e) => { if (six && sheet.hidden) six.up(e); };
  document.addEventListener('keyup', onKeyUp);
  const onSet = (e) => {
    if (e.detail === 'mastery') { Object.keys(m).forEach((k) => delete m[k]); renderMastery(); }
  };
  document.addEventListener('keydown', onKey);
  window.addEventListener('settings', onSet);
  window.addEventListener('resize', fitMastery);
  renderPicker(); renderMastery(); wScore(); next();
  return () => { dead = true; if (wpad) wpad.off(); document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKeyUp); window.removeEventListener('settings', onSet); window.removeEventListener('resize', fitMastery); };
}
// ---------- sweep ----------
export function sweepMode(q) {
  let src = q.get('src') || store.get('swSrc', 'words');
  if (src === 'sentences') src = 'phrases';
  if (!SWEEP_SRC[src]) src = 'words';
  $('#picker').innerHTML = `<div class="sw-row">${radios('src', Object.entries(SWEEP_SRC), src)}</div>
    <div class="sw-row">${radios('swGrade', [[1, 'Grade 1'], [2, 'Grade 2']], S.swGrade)}${radios('swSize', [['large', 'Large'], ['real', 'Real size']], S.swSize)}</div>`;
  $('#modeBody').innerHTML = `
    <div class="sweep-box" id="box" tabindex="0" aria-label="Braille line. Arrow keys move cell by cell.">
      <div class="edge left"></div><div class="edge right"></div>
      <div class="sweep-track" id="track"></div>
      <div class="reader" id="reader"></div>
      <div class="finger" id="finger"></div>
      <div class="sweep-top"><button class="link-btn pillish" id="restart">${icon('restart', 16)} Restart</button>
        <span class="sw-prog" aria-hidden="true"><i id="swProg"></i></span><button class="link-btn pillish" id="shuffleBtn">Next ${icon('right', 16)}</button></div>
      <div class="sweep-hint" id="hint">put your finger on the line and slide right</div>
    </div>
    <p class="sw-info" id="swInfo" aria-live="polite"></p>
`;
  bindRadios($('#picker'), (k, v) => {
    if (k === 'src') { src = v; store.set('swSrc', v); text = textFor(); build(); return; }
    setS(k, k === 'swGrade' ? Number(v) : v);
  });
  const box = $('#box'), track = $('#track'), finger = $('#finger'), reader = $('#reader');
  let cells = [], lefts = [], widths = [], totalW = 0, offset = 0, headX = 0, W = 0;
  let curIdx = -1, raf = 0, edgeRaf = 0, active = false;

  const nextWord = deck(COMMON_WORDS.slice(0, 3000)), nextPhrase = deck(PHRASES);
  const textFor = () => {
    if (src === 'words') return Array.from({ length: 7 }, nextWord).join(' ');
    if (src === 'phrases') return nextPhrase();
    if (src === 'numbers') return numberLine();
    if (src === 'passages') return passList()[passIdx][1];
    return [signLine(), signLine(), signLine()].join(', ');
  };
  // Passages go in order, easiest first; Next moves on and the place is remembered (per grade).
  // Grade 2 adds the contraction-rich passages, first within each level.
  const passList = () => (S.swGrade === 2 ? [...PASSAGES].sort((a, b) => a[0] - b[0] || (b[2] ? 1 : 0) - (a[2] ? 1 : 0)) : PASSAGES.filter((x) => !x[2]));
  const passKey = () => 'swPass' + S.swGrade;
  const loadPass = () => Math.min(passList().length - 1, store.get(passKey(), 0));
  let passIdx = loadPass();
  // Reading speed: timed from the first touch to passing the last cell, in words a minute (best kept per grade).
  let t0 = 0, tDone = 0;
  const words = () => text.split(/\s+/).filter(Boolean).length;
  const info = (extra = '') => {
    const el = $('#swInfo'); if (!el) return;
    const pl = passList(), pass = src === 'passages' ? `Passage ${passIdx + 1} of ${pl.length} · level ${pl[passIdx][0]}${pl[passIdx][2] ? ' · contractions' : ''}` : '';
    const b = store.get('swBest' + S.swGrade, 0);
    el.innerHTML = [pass, extra || `${words()} words${b ? ` · best ${b} words a minute` : ''}`].filter(Boolean).join(' · ');
  };
  function timing(pos) {
    if (!t0 && active) t0 = performance.now();
    const last = cells.length - 1;
    if (t0 && !tDone && last >= 0 && pos > lefts[last] + widths[last]) {
      tDone = performance.now();
      const secs = (tDone - t0) / 1000, wpm = Math.round(words() / (secs / 60));
      const bk = 'swBest' + S.swGrade, b = Math.max(store.get(bk, 0), wpm);
      if (secs > 2) store.set(bk, b);
      info(`${words()} words in ${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, '0')} · <b>${wpm} words a minute</b>${b > wpm ? ` (best ${b})` : wpm >= b && secs > 2 ? ' · new best' : ''}`);
    }
  }
  let text = textFor();
  function build() {
    const grade = S.swGrade;
    cells = toCells(translate(text, 'en', grade)).filter((c) => c.kind !== 'newline');
    t0 = 0; tDone = 0; info();
    track.innerHTML = cells.map((c, i) => c.kind === 'space'
      ? `<div class="sc space" data-i="${i}"><span class="cell" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span></div>`
      : `<div class="sc kind-${c.kind}" data-i="${i}">${cellHTML(c.cell, '', { kind: kindOf(c) })}${lblTag(c.idx === 0 ? spanOf(cells, i) : 1, esc(c.idx === 0 ? (c.print || '·') : ''))}</div>`).join('');
    requestAnimationFrame(() => { measure(); reset(); });
  }
  function measure() {
    const els = $$('.sc', track);
    lefts = els.map((e) => e.offsetLeft); widths = els.map((e) => e.offsetWidth);
    totalW = track.scrollWidth; W = box.clientWidth;
  }
  // The line starts just right of the middle, so the reader rests in the middle with the upcoming cells in view.
  const homeX = () => Math.round(W * 0.5);
  const startOffset = () => homeX() + 24;
  function reset() { offset = startOffset(); headX = homeX(); curIdx = -1; update(false); }
  const clampV = (o) => Math.max(Math.min(startOffset(), W * 0.5 - totalW), Math.min(startOffset(), o));
  const clamp = () => { offset = clampV(offset); };
  // When the finger lifts, ease the reader back to the middle and slide the line with it,
  // so the same cell stays under the reader (at either end of the line the line can't move, so the reader stays put).
  let settleRaf = 0;
  function settle() {
    cancelAnimationFrame(settleRaf);
    let prev = performance.now();
    const step = (t) => {
      const dt = Math.min(50, t - prev) / 1000; prev = t;
      if (active) { settleRaf = requestAnimationFrame(step); return; }
      const gap = homeX() - headX;
      const want = Math.abs(gap) < 0.5 ? gap : gap * Math.min(1, dt * 2.4);
      const d = clampV(offset + want) - offset;
      if (!d) { settleRaf = requestAnimationFrame(step); return; }
      offset += d; headX += d; update(false);
      settleRaf = requestAnimationFrame(step);
    };
    settleRaf = requestAnimationFrame(step);
  }

  function update(feedback = true) {
    clamp();
    track.style.transform = `translateX(${offset}px)`;
    reader.style.left = headX + 'px'; finger.style.left = headX + 'px';
    box.classList.toggle('active', active);
    const pos = headX - offset;
    timing(pos);
    $('#swProg').style.width = (totalW ? Math.max(0, Math.min(1, (pos - (lefts[0] || 0)) / (totalW - (lefts[0] || 0)))) * 100 : 0) + '%';
    let idx = -1;
    for (let i = 0; i < cells.length; i++) if (pos >= lefts[i] && pos < lefts[i] + widths[i]) { idx = i; break; }
    $$('.sc', track).forEach((el, i) => el.classList.toggle('passed', lefts[i] + widths[i] < pos));
    // The current cell's letter fades in with a strong ease-in: barely visible at first, mostly appearing near the cell's right edge.
    if (idx !== curIdx && curIdx >= 0 && track.children[curIdx]) { const l = $('.lbl', track.children[curIdx]); if (l) l.style.cssText = ''; }
    if (idx >= 0 && cells[idx].kind !== 'space') {
      const l = $('.lbl', track.children[idx]), f = (pos - lefts[idx]) / widths[idx];
      if (l) l.style.opacity = Math.pow(Math.max(0, Math.min(1, f)), 4).toFixed(3);
    }
    if (idx !== curIdx) {
      $$('.sc.cur', track).forEach((e) => e.classList.remove('cur'));
      if (idx >= 0 && cells[idx].kind !== 'space') track.children[idx].classList.add('cur');
      curIdx = idx;
    }
  }
  function edgeLoop() {
    cancelAnimationFrame(edgeRaf);
    let prev = performance.now();
    const step = (t) => {
      const dt = Math.min(50, t - prev) / 1000; prev = t;
      if (!active) return;
      // The further the reader is from the middle, the faster the line moves (and backwards left of the middle).
      const v = -(headX - homeX()) / (W / 2);
      if (Math.abs(v) > 0.04) { offset += v * 300 * dt; update(); }
      edgeRaf = requestAnimationFrame(step);
    };
    edgeRaf = requestAnimationFrame(step);
  }
  const boxX = (e) => e.clientX - box.getBoundingClientRect().left;
  box.addEventListener('pointerdown', (e) => { active = true; box.setPointerCapture(e.pointerId); headX = boxX(e); $('#hint').style.opacity = 0; update(); edgeLoop(); });
  box.addEventListener('pointermove', (e) => {
    const touchLike = e.pointerType !== 'mouse';
    if (touchLike && !box.hasPointerCapture(e.pointerId)) return;
    if (!active && !touchLike) { active = true; edgeLoop(); $('#hint').style.opacity = 0; }
    headX = Math.max(0, Math.min(W, boxX(e))); update();
  });
  const end = (e) => { if (e.pointerType !== 'mouse' || e.type === 'pointerleave') { active = false; update(false); } };
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end); box.addEventListener('pointerleave', end);
  box.addEventListener('wheel', (e) => { e.preventDefault(); offset -= (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.6; update(false); }, { passive: false });
  box.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    let i = Math.max(0, curIdx) + dir;
    while (cells[i] && cells[i].kind === 'space') i += dir;
    if (cells[i]) { animateTo(headX - (lefts[i] + widths[i] * 0.3)); const c = cells[i]; announce(`${cellsLabel(c.cell)}${c.idx === 0 && c.print ? ': ' + c.print : ''}`); }
  });
  function animateTo(target) {
    if (reducedMotion()) { offset = target; update(); return; }
    const start = offset, t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / 420); offset = start + (target - start) * (1 - Math.pow(1 - k, 3)); update(); if (k < 1) raf = requestAnimationFrame(step); };
    cancelAnimationFrame(raf); raf = requestAnimationFrame(step);
  }
  $('#restart').onclick = () => { headX = homeX(); animateTo(startOffset()); t0 = 0; tDone = 0; info(); };
  $('#shuffleBtn').onclick = () => { if (src === 'passages') { passIdx = (passIdx + 1) % passList().length; store.set(passKey(), passIdx); } text = textFor(); build(); };
  $('.sweep-top', box).addEventListener('pointerdown', (e) => e.stopPropagation());
  const onResize = () => { const p = headX - offset; measure(); headX = Math.min(headX, W); offset = headX - p; update(false); };
  const onSet = (e) => {
    if (e.detail === 'swGrade' && src === 'passages') { passIdx = loadPass(); text = textFor(); }
    if (['swGrade', 'swSize'].includes(e.detail)) build();
  };
  window.addEventListener('resize', onResize); window.addEventListener('settings', onSet);
  build(); settle();
  return () => { active = false; cancelAnimationFrame(raf); cancelAnimationFrame(edgeRaf); cancelAnimationFrame(settleRaf); window.removeEventListener('resize', onResize); window.removeEventListener('settings', onSet); };
}
