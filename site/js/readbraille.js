// Braille to text: every likely reading of a row of cells, best first.
// Each word (cells between blanks) is read on its own: as a common English word in UEB Grade 2 (exact, from the
// translator), as a pre-UEB (EBAE) word (from liblouis, see ebaewords.js), spelled out, or sign by sign.
// Readings that make real, common words score highest; UEB comes ahead of pre-UEB unless pre-UEB makes more sense.
import { LETTERS, IND, UEB_PUNCT, CONTRACTIONS, INDICATORS, cellsOf, translate, unicodeOf } from './braille.js';
import { COMMON_WORDS } from './wordlist.js';
import { EBAE_WORDS } from './ebaewords.js';

const BLANK = '⠀';
export const DIGIT_OF_CELL = Object.fromEntries('abcdefghij'.split('').map((l, i) => [LETTERS[l], String((i + 1) % 10)]));

// Signs that only pre-UEB braille has: cells, print, kind, where it may go.
// after = after letters in the word; start = first in a word; middle = between letters; whole = the whole word;
// join = a whole word run together with the next one ("to the"). "and the", "with a" and the like are found as
// whole words (ebaeWords), since those six only join each other.
const PRE = [
  ['⠼', 'ble', 'groupsign', 'after'], ['⠤', 'com', 'groupsign', 'start'], ['⠲', 'dd', 'groupsign', 'middle'],
  ['⠠⠝', 'ation', 'groupsign', 'after'], ['⠠⠽', 'ally', 'groupsign', 'after'], ['⠕⠄⠉', 'o’clock', 'wordsign', 'whole'],
  ['⠖', 'to', 'wordsign', 'join'], ['⠔⠖', 'into', 'wordsign', 'join'], ['⠴', 'by', 'wordsign', 'join'],
  ['⠶', '(', 'parenthesis', 'open'], ['⠶', ')', 'parenthesis', 'punct'], ['⠠⠶', '[', 'bracket', 'open'], ['⠶⠄', ']', 'bracket', 'punct'],
  ['⠤⠤', '—', 'dash', 'mid'], ['⠄⠄⠄', '…', 'ellipsis', 'punct'], ['⠴⠄', '’', 'close quote', 'punct'], ['⠔⠔', '*', 'asterisk', 'punct'],
];
const WHOLE_KINDS = new Set(['alphabetic wordsign', 'strong wordsign', 'lower wordsign']);
const NUM_SEP = { '⠲': ['.', false], '⠂': [',', false], '⠒': [':', true], '⠤': ['-', true], '⠨': ['.', true] };
const OPEN = new Set(['(', '“', '‘', '[']), MID = new Set(['-', '—', '–', '/']);

// Every sign a run of cells can be: { text, kind, role, pre, where }.
let INDEX = null;
export function brailleIndex() {
  if (INDEX) return INDEX;
  const m = new Map();
  const add = (cells, e) => {
    if (!cells) return;
    const a = m.get(cells) || [];
    if (a.some((x) => x.text === e.text && x.kind === e.kind && !!x.pre === !!e.pre)) return;
    a.push(e); m.set(cells, a);
  };
  Object.entries(LETTERS).forEach(([l, c]) => add(c, { text: l, kind: 'letter', role: 'part' }));
  Object.entries(CONTRACTIONS).forEach(([cat, g]) => g.items.forEach(([t, d]) => {
    const kind = cat.toLowerCase().replace(/s$/, '');
    add(cellsOf(d), { text: t, kind, role: WHOLE_KINDS.has(kind) ? 'whole' : 'part' });
  }));
  Object.entries(UEB_PUNCT).forEach(([ch, v]) => v && ch !== '’' && add(v[0], { text: ch, kind: v[1], role: OPEN.has(ch) ? 'open' : MID.has(ch) ? 'mid' : 'punct' }));
  add('⠠⠦', { text: '‘', kind: 'open quote', role: 'open' }); add('⠠⠴', { text: '’', kind: 'close quote', role: 'punct' });
  add('⠨⠣', { text: '[', kind: 'open bracket', role: 'open' }); add('⠨⠜', { text: ']', kind: 'close bracket', role: 'punct' });
  INDICATORS.forEach(([name, d]) => add(cellsOf(d), { text: '', kind: name, role: 'ind' }));
  // One accent sign for every accent, before the letter (shown with the commonest accent).
  Object.entries({ a: 'à', e: 'é', i: 'í', o: 'ó', u: 'ü', c: 'ç', n: 'ñ' }).forEach(([l, a]) => add('⠈' + LETTERS[l], { text: a, kind: 'pre-UEB accented letter', role: 'pre', where: 'any', pre: true }));
  PRE.forEach(([c, t, kind, where]) => add(c, { text: t, kind: 'pre-UEB ' + kind, role: ['open', 'punct', 'mid'].includes(where) ? where : 'pre', where, pre: true }));
  return (INDEX = m);
}

// Word lists: rank by frequency, UEB cells of each common word, and the pre-UEB words that differ.
let W = null;
function words() {
  if (W) return W;
  const rank = new Map(), ueb = new Map(), uebOf = new Map(), ebae = new Map(), ebaeOf = new Map();
  COMMON_WORDS.forEach((w, i) => { if (!rank.has(w)) rank.set(w, i); });
  const push = (m, k, v) => { const a = m.get(k); if (a) { if (!a.includes(v)) a.push(v); } else m.set(k, [v]); };
  for (const w of rank.keys()) { const c = unicodeOf(translate(w, 'en', 2)); uebOf.set(w, c); push(ueb, c, w); }
  for (const [w, c] of [...EBAE_WORDS, ...EBAE_MORE]) { ebaeOf.set(w, c); push(ebae, c, w); }
  // Letter-triple counts, to tell English-looking words (names, rarer words) from jumbles of letters.
  const tri = new Map(), bi = new Map();
  for (const w of rank.keys()) { const x = '^^' + w + '$'; for (let i = 2; i < x.length; i++) { const k = x.slice(i - 2, i); bi.set(k, (bi.get(k) || 0) + 1); tri.set(k + x[i], (tri.get(k + x[i]) || 0) + 1); } }
  return (W = { rank, ueb, uebOf, ebae, ebaeOf, tri, bi });
}
// How English a word looks: average log-chance of each letter after the two before it (about -2 to -7).
function englishness(w) {
  const { tri, bi } = words(), x = '^^' + w + '$';
  let t = 0;
  for (let i = 2; i < x.length; i++) { const k = x.slice(i - 2, i); t += Math.log2(((tri.get(k + x[i]) || 0) + 0.1) / ((bi.get(k) || 0) + 2.7)); }
  return t / (x.length - 2);
}
// How common a word is, 10 (the) down to 0 (5,000th). Plurals and simple endings of common words count a bit less.
function freq(w) {
  const { rank } = words(), r = rank.get(w);
  if (r != null) return 10 * (1 - Math.log(r + 1) / Math.log(5001));
  const ap = w.match(/^(.+?)(n['’]t|['’](?:s|re|ll|d|ve|m|t))$/);
  if (ap) { const b = freq(ap[1]) ?? (ap[2][0] === 'n' ? freq(ap[1] + 'n') : null); if (b != null) return b * 0.8; }
  for (const [end, add] of [['s', ''], ['es', ''], ['ed', ''], ['ed', 'e'], ['d', ''], ['ing', ''], ['ing', 'e'], ['er', ''], ['ly', ''], ['’s', ''], ["'s", '']]) {
    if (w.endsWith(end) && w.length > end.length + 1) { const r2 = rank.get(w.slice(0, -end.length) + add); if (r2 != null) return 6 * (1 - Math.log(r2 + 1) / Math.log(5001)); }
  }
  return null;
}
const capWord = (w, cap) => (cap === 2 ? w.toUpperCase() : cap === 1 ? w[0].toUpperCase() + w.slice(1) : w);

// Ways to split a word's cells into opening signs (capitals, quotes, brackets), the word itself, and closing punctuation.
function peels(cells) {
  const idx = brailleIndex(), out = [];
  const lead = (i, toks, cap) => {
    trail(cells.length, i, toks, [], cap);
    if (toks.length >= 3) return;
    for (let L = 1; L <= 3 && i + L < cells.length; L++) for (const e of idx.get(cells.slice(i, i + L)) || []) {
      if (e.role === 'open') lead(i + L, [...toks, { text: e.text, kind: e.kind, cells: cells.slice(i, i + L), pre: e.pre }], cap);
      else if (e.kind === 'capital letter' || e.kind === 'capital word') lead(i + L, [...toks, { text: '', kind: e.kind, cells: cells.slice(i, i + L) }], e.kind === 'capital word' ? 2 : 1);
    }
  };
  const trail = (j, i, lt, tt, cap) => {
    out.push({ lead: lt, core: cells.slice(i, j), trail: tt, cap });
    if (tt.length >= 3) return;
    for (let L = 1; L <= 3 && j - L > i; L++) for (const e of idx.get(cells.slice(j - L, j)) || []) {
      if (e.role === 'punct' || e.kind === 'capitals terminator') trail(j - L, i, lt, [{ text: e.text, kind: e.kind, cells: cells.slice(j - L, j), pre: e.pre }, ...tt], cap);
    }
  };
  lead(0, [], 0);
  return out.filter((p) => p.core);
}

// Signs that spell a known word from its cells (first match; ordinary signs before pre-UEB ones).
function tokensFor(cells, word, pre) {
  if (!pre) {
    const parts = translate(word, 'en', 2);
    if (parts.map((p) => p.cells).join('') === cells) return parts.map((p) => ({ text: p.print, kind: p.kind === 'contraction' ? p.note.toLowerCase().replace(/s$/, '') : p.kind === 'indicator' ? p.note : p.kind, cells: p.cells }));
  }
  const idx = brailleIndex(), target = word.toLowerCase();
  const go = (i, pos, toks) => {
    if (i === cells.length) return pos === target.length ? toks : null;
    for (let L = Math.min(4, cells.length - i); L >= 1; L--) for (const e of (idx.get(cells.slice(i, i + L)) || []).slice().sort((a, b) => !!a.pre - !!b.pre)) {
      if (e.role === 'ind' || (e.pre && !pre)) continue;
      const t = e.text.toLowerCase();
      if (!t || !target.startsWith(t, pos)) continue;
      const r = go(i + L, pos + t.length, [...toks, { text: e.text, kind: e.kind, cells: cells.slice(i, i + L), pre: e.pre }]);
      if (r) return r;
    }
    return null;
  };
  return go(0, 0, []) || [{ text: word, kind: pre ? 'pre-UEB word' : 'word', cells, pre }];
}

// Pre-UEB words for some cells: one word, or words run together ("to the", "and the", "with a").
// to, into and by join any next word; and, for, of, the, with and a join only each other.
const JOIN = { to: '⠖', into: '⠔⠖', by: '⠴', and: '⠯', for: '⠿', of: '⠷', the: '⠮', with: '⠾', a: '⠁' };
const SIX = new Set(['and', 'for', 'of', 'the', 'with', 'a']);
const EBAE_MORE = [['o’clock', '⠕⠄⠉']];
function ebaeWords(cells, depth = 0) {
  const { ueb, ebae, ebaeOf } = words(), out = [];
  if (depth && cells[0] === '⠠') {
    const cap = cells[1] === '⠠' ? 2 : 1;
    return ebaeWords(cells.slice(cap), depth).map(([w, ...r]) => [{ w, cap }, ...r]);
  }
  for (const w of ebae.get(cells) || []) out.push([w]);
  if (depth) for (const w of ueb.get(cells) || []) if (!ebaeOf.has(w)) out.push([w]);
  if (depth < 3) for (const [w, c] of Object.entries(JOIN)) if (cells.startsWith(c) && cells.length > c.length) {
    for (const rest of ebaeWords(cells.slice(c.length), depth + 1)) if (!SIX.has(w) || SIX.has(rest[0])) out.push([w, ...rest]);
  }
  return out;
}

// Sign-by-sign readings of one word, for anything that isn't a common word (names, numbers, symbols).
function signReadings(cells) {
  const idx = brailleIndex(), out = [];
  // w: signs read in the current word so far; done: only punctuation may follow (1: after a whole-word sign,
  // 2: after a closing mark, where a number may still follow, as in 3:30).
  const go = (i, toks, cap, w, done) => {
    if (out.length >= 80) return;
    if (i >= cells.length) { out.push(toks); return; }
    if (cells[i] === IND.number && done !== 1) {
      // Digits, and a decimal point or comma inside the number; pre-UEB also carries on across a colon or hyphen.
      let j = i + 1, d = '', pre = false;
      for (;;) {
        while (j < cells.length && DIGIT_OF_CELL[cells[j]]) d += DIGIT_OF_CELL[cells[j++]];
        const sep = d && DIGIT_OF_CELL[cells[j + 1]] && NUM_SEP[cells[j]];
        if (!sep) break;
        d += sep[0]; pre = pre || sep[1]; j++;
      }
      if (d) go(j, [...toks, { text: d, kind: pre ? 'pre-UEB number' : 'number', cells: cells.slice(i, j), pre }], 0, w + 1, false);
    }
    for (let L = Math.min(4, cells.length - i); L >= 1; L--) {
      const c = cells.slice(i, i + L), next = cells.length - i - L;
      for (const e of idx.get(c) || []) {
        const tok = { text: e.text, kind: e.kind, cells: c, pre: e.pre };
        if (e.role === 'ind') {
          if (e.kind === 'capital letter' || e.kind === 'capital word') { if (!done && next) go(i + L, [...toks, tok], e.kind === 'capital word' ? 2 : 1, w, done); }
          else if (L === cells.length) go(i + L, [...toks, tok], cap, w, done);
          continue;
        }
        if (e.role === 'open') { if (!w) go(i + L, [...toks, tok], cap, 0, false); continue; }
        if (e.role === 'mid') { if (next) go(i + L, [...toks, tok], 0, 0, false); continue; }
        // An apostrophe keeps the word going; a period may (e.g.); other closing marks end it.
        if (e.role === 'punct') { const ap = e.text === '’' || e.text === "'"; go(i + L, [...toks, tok], cap, ap ? w : 0, ap ? 0 : e.text === '.' ? (done === 1 ? 1 : 0) : e.kind === 'capitals terminator' ? done : 2); continue; }
        if (done) continue;
        if (e.role === 'whole') { if (!w && toks.every((t) => !t.text || OPEN.has(t.text))) go(i + L, [...toks, { ...tok, text: capWord(e.text, cap) }], 0, 1, 1); continue; }
        if (e.pre) {
          const rest = cells.slice(i + L);
          // A letter (or a letter's contraction) must follow where the rule says the word goes on.
          const letterNext = [1, 2, 3].some((n) => n <= next && (idx.get(rest.slice(0, n)) || []).some((x) => x.role === 'part' && !x.pre));
          const ok = { any: true, after: w > 0, start: !w && letterNext, middle: w > 0 && letterNext, whole: !w, join: !w && (letterNext || rest[0] === '⠠' || rest[0] === '⠼') }[e.where];
          if (!ok) continue;
          if (e.where === 'join') { go(i + L, [...toks, { ...tok, text: capWord(e.text, cap) }, { text: ' ', kind: 'space', cells: '' }], 0, 0, false); continue; }
          go(i + L, [...toks, { ...tok, text: capWord(e.text, cap) }], cap === 2 ? 2 : 0, w + 1, e.where === 'whole' ? 1 : 0); continue;
        }
        if (e.kind === 'final-letter groupsign' && !w) continue;
        if (e.kind === 'lower groupsign' && (['be', 'con', 'dis'].includes(e.text) ? w || !next : ['ea', 'bb', 'cc', 'ff', 'gg'].includes(e.text) && (!w || !next))) continue;
        go(i + L, [...toks, { ...tok, text: capWord(e.text, cap) }], cap === 2 ? 2 : 0, w + 1, false);
      }
    }
  };
  go(0, [], 0, 0, false);
  return out;
}

// Score of a reading's words: common words count most; letters that make no word count against it.
function wordsScore(text) {
  let s = 0;
  for (const w of text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().match(/[a-z’']+|[0-9]+/g) || []) {
    if (/^[0-9]+$/.test(w)) { s += 1; continue; }
    const f = freq(w.replace(/^['’]+|['’]+$/g, ''));
    s += f == null ? w.length === 1 ? -3 : Math.max(-8, Math.min(-2, -5 + 1.5 * (englishness(w.replace(/['’]/g, '')) + 4))) : 3 + f * 0.5;
  }
  return s;
}
// Punctuation that would sit oddly in print: repeated hyphens or apostrophes, a closing mark run into the next
// letter, a word starting with a hyphen or dash, or a period inside a word that isn't an abbreviation.
function punctOdd(text) {
  text = text.replace(/’/g, "'");
  return 8 * (text.match(/([-'])\1+/g) || []).length + 5 * (text.match(/[.,;:!?”)\]…][A-Za-z]/g) || []).length + 6 * (text.match(/(^|\s)[-—–][A-Za-z]/g) || []).length
    + 5 * (text.match(/[a-z]{2}\.[a-z]/g) || []).length;
}

// Readings of one word's cells: [{ toks, text, pre, score, uebOnly }], best first.
function readWord(cells) {
  const { ueb, rank, uebOf, ebaeOf } = words(), found = new Map();
  const keep = (r) => { const k = r.text.replace(/’/g, "'") + '|' + r.pre; const o = found.get(k); if (!o || o.score < r.score) found.set(k, r); };
  for (const p of peels(cells)) {
    const wrap = (toks) => [...p.lead, ...toks, ...p.trail];
    const extra = -0.4 * (p.lead.length + p.trail.length) - (p.lead.some((t) => t.pre) || p.trail.some((t) => t.pre) ? 2 : 0) - punctOdd([...p.lead, ...p.trail].map((t) => t.text).join(''));
    const preWrap = p.lead.some((t) => t.pre) || p.trail.some((t) => t.pre);
    const text = (ws) => p.lead.map((t) => t.text).join('') + capWord(ws.join(' '), p.cap) + p.trail.map((t) => t.text).join('');
    const capToks = (toks) => { if (p.cap && toks[0]) toks[0] = { ...toks[0], text: capWord(toks[0].text, p.cap === 2 ? 2 : 1) }; if (p.cap === 2) toks.forEach((t, i) => (toks[i] = { ...t, text: t.text.toUpperCase() })); return toks; };
    // A common word in UEB Grade 2, exactly as the translator writes it.
    for (const w of ueb.get(p.core) || []) keep({ toks: wrap(capToks(tokensFor(p.core, w, false))), text: text([w]), pre: preWrap, score: 22 + freq(w) + extra, uebOnly: ebaeOf.has(w) });
    // Spelled out letter by letter (Grade 1).
    const spelled = [...p.core].map((c) => Object.keys(LETTERS).find((l) => LETTERS[l] === c)).join('');
    if (spelled.length === p.core.length && rank.has(spelled) && uebOf.get(spelled) !== p.core) keep({ toks: wrap(capToks(tokensFor(p.core, spelled, true))), text: text([spelled]), pre: preWrap, score: 17 + freq(spelled) + extra, uebOnly: false });
    // Pre-UEB: a word written differently before UEB, or words run together.
    for (const ws of ebaeWords(p.core)) {
      const toks = [], shown = []; let at = 0;
      ws.forEach((x, i) => {
        const { w, cap } = typeof x === 'string' ? { w: x, cap: 0 } : x;
        if (cap) { const c = cap === 2 ? '⠠⠠' : '⠠'; toks.push({ text: '', kind: cap === 2 ? 'capital word' : 'capital letter', cells: c }); at += c.length; }
        const c = ebaeOf.get(w) || (JOIN[w] && i < ws.length - 1 ? JOIN[w] : uebOf.get(w));
        const part = tokensFor(p.core.slice(at, at + c.length), w, true);
        if (cap) part[0] = { ...part[0], text: capWord(part[0].text, cap) };
        toks.push(...part); shown.push(capWord(w, cap));
        if (i < ws.length - 1) toks.push({ text: ' ', kind: 'space', cells: '' });
        at += c.length;
      });
      const f = ws.reduce((a, x) => a + (freq(typeof x === 'string' ? x : x.w) ?? 3), 0) / ws.length;
      keep({ toks: wrap(capToks(toks)), text: text(shown), pre: true, score: 16 + f + extra, uebOnly: false });
    }
  }
  // Sign by sign, checked against the translator (a UEB reading it would write scores higher).
  for (const toks of signReadings(cells)) {
    const t = toks.map((x) => x.text).join(''), pre = toks.some((x) => x.pre);
    const valid = !pre && !!t && (unicodeOf(translate(t, 'en', 2)) === cells ? 6 : unicodeOf(translate(t, 'en', 1)) === cells ? 4 : 0);
    let s = wordsScore(t) - punctOdd(t) - 0.3 * toks.length + (pre ? 1 : valid);
    // A shortform inside a longer word, where the translator wouldn't write it, is unlikely.
    if (!valid && toks.length > 1) s -= 3 * toks.filter((x) => x.kind === 'shortform').length;
    keep({ toks, text: t || toks.map((x) => x.kind).join(' + '), pre, score: s, uebOnly: false });
  }
  return [...found.values()].sort((a, b) => b.score - a.score);
}

// All likely readings of a row of cells (blank cell = space), best first: [{ toks, text, pre, score }].
export function readBraille(str, max = 12) {
  const chunks = str.split(/⠀+/).filter(Boolean);
  if (!chunks.length) return [];
  let beam = [{ toks: [], words: [], score: 0, pre: false, ueb: false }];
  for (const c of chunks) {
    let rs = readWord(c).slice(0, 8);
    if (!rs.length) rs = [{ toks: [{ text: '?', kind: 'unknown', cells: c }], text: '?', pre: false, score: -20, uebOnly: false }];
    const next = [];
    for (const b of beam) for (const r of rs) {
      const pre = b.pre || r.pre, ueb = b.ueb || r.uebOnly;
      next.push({ toks: b.toks.length ? [...b.toks, { text: ' ', kind: 'space', cells: BLANK }, ...r.toks] : r.toks, words: [...b.words, r.text], score: b.score + r.score - (pre && ueb && !(b.pre && b.ueb) ? 6 : 0), pre, ueb });
    }
    beam = next.sort((a, b) => b.score - a.score).slice(0, 24);
  }
  // Readings far less likely than the best are left out.
  const seen = new Set(), best = beam[0].score;
  return beam.map((b) => ({ toks: b.toks, text: b.words.join(' '), pre: b.pre, score: b.score }))
    .filter((r) => r.score > best - 30 && (seen.has(r.text) ? false : seen.add(r.text))).slice(0, max);
}
