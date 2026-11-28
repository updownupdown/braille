// Core braille data and translators.
// Cells are Unicode braille patterns (U+2800 block). Dot n sets bit (n-1).

export const fromDots = (dots) => {
  let v = 0;
  for (const d of String(dots)) if (d >= '1' && d <= '8') v |= 1 << (Number(d) - 1);
  return String.fromCharCode(0x2800 + v);
};
export const toDots = (cell) => {
  const v = cell.charCodeAt(0) - 0x2800;
  const out = [];
  for (let i = 0; i < 8; i++) if (v & (1 << i)) out.push(i + 1);
  return out;
};
export const dotsLabel = (cell) => {
  const d = toDots(cell);
  return d.length ? 'dots ' + d.join('-') : 'blank';
};
const seq = (...dots) => dots.map(fromDots).join('');

// ---------- English (UEB) ----------
export const LETTER_DOTS = {
  a: '1', b: '12', c: '14', d: '145', e: '15', f: '124', g: '1245', h: '125', i: '24', j: '245',
  k: '13', l: '123', m: '134', n: '1345', o: '135', p: '1234', q: '12345', r: '1235', s: '234', t: '2345',
  u: '136', v: '1236', w: '2456', x: '1346', y: '13456', z: '1356',
};
export const LETTERS = Object.fromEntries(Object.entries(LETTER_DOTS).map(([k, v]) => [k, fromDots(v)]));
const DIGIT_LETTER = { '1': 'a', '2': 'b', '3': 'c', '4': 'd', '5': 'e', '6': 'f', '7': 'g', '8': 'h', '9': 'i', '0': 'j' };

export const IND = {
  capital: fromDots('6'),
  number: fromDots('3456'),
  grade1: fromDots('56'),
};

export const UEB_PUNCT = {
  ',': [seq('2'), 'comma'],
  ';': [seq('23'), 'semicolon'],
  ':': [seq('25'), 'colon'],
  '.': [seq('256'), 'period'],
  '!': [seq('235'), 'exclamation'],
  '?': [seq('236'), 'question mark'],
  "'": [seq('3'), 'apostrophe'],
  '’': [seq('3'), 'apostrophe'],
  '-': [seq('36'), 'hyphen'],
  '—': [seq('6', '36'), 'dash'],
  '–': [seq('6', '36'), 'dash'],
  '(': [seq('5', '126'), 'open parenthesis'],
  ')': [seq('5', '345'), 'close parenthesis'],
  '/': [seq('456', '34'), 'slash'],
  '@': [seq('4', '1'), 'at sign'],
  '&': [seq('4', '12346'), 'ampersand'],
  '$': [seq('4', '234'), 'dollar'],
  '%': [seq('46', '356'), 'percent'],
  '+': [seq('5', '235'), 'plus'],
  '=': [seq('5', '2356'), 'equals'],
  '×': [seq('5', '236'), 'times'],
  '÷': [seq('5', '34'), 'divided by'],
  '*': [seq('5', '35'), 'asterisk'],
  '#': [seq('456', '1456'), 'number sign (hash)'],
  '°': [seq('45', '245'), 'degrees'],
  '"': null, // handled: open/close quotes
  '“': [seq('236'), 'open quote'],
  '”': [seq('356'), 'close quote'],
};

// Grade 2 contractions, grouped as UEB teaches them.
// [print, dots-sequence (space separated cells), note]
export const CONTRACTIONS = {
  'Alphabetic wordsigns': {
    blurb: 'A single letter standing alone means a whole word.',
    items: [
      ['but', '12'], ['can', '14'], ['do', '145'], ['every', '15'], ['from', '124'], ['go', '1245'],
      ['have', '125'], ['just', '245'], ['knowledge', '13'], ['like', '123'], ['more', '134'], ['not', '1345'],
      ['people', '1234'], ['quite', '12345'], ['rather', '1235'], ['so', '234'], ['that', '2345'], ['us', '136'],
      ['very', '1236'], ['will', '2456'], ['it', '1346'], ['you', '13456'], ['as', '1356'],
    ],
  },
  'Strong contractions': {
    blurb: 'Used as whole words and inside words.',
    items: [['and', '12346'], ['for', '123456'], ['of', '12356'], ['the', '2346'], ['with', '23456']],
  },
  'Strong groupsigns': {
    blurb: 'Letter groups that can appear anywhere in a word (ing never starts one).',
    items: [
      ['ch', '16'], ['gh', '126'], ['sh', '146'], ['th', '1456'], ['wh', '156'], ['ed', '1246'],
      ['er', '12456'], ['ou', '1256'], ['ow', '246'], ['st', '34'], ['ar', '345'], ['ing', '346'],
    ],
  },
  'Strong wordsigns': {
    blurb: 'The same cells as ch, sh, th, wh, ou, st, but standing alone.',
    items: [['child', '16'], ['shall', '146'], ['this', '1456'], ['which', '156'], ['out', '1256'], ['still', '34']],
  },
  'Lower groupsigns': {
    blurb: 'Cells using only the lower four dots. Position in the word matters.',
    items: [
      ['ea', '2', 'inside a word only · team'], ['bb', '23', 'inside only · rabbit'], ['cc', '25', 'inside only · accept'],
      ['ff', '235', 'inside only · muffin'], ['gg', '2356', 'inside only · bigger'], ['en', '26', 'anywhere in a word · ten'],
      ['in', '35', 'anywhere in a word · pin'],
      ['be', '23', 'first syllable only · begin'], ['con', '25', 'first syllable only · concert'], ['dis', '256', 'first syllable only · dislike'],
    ],
  },
  'Lower wordsigns': {
    blurb: 'Lower cells that stand alone as words.',
    items: [['be', '23', 'alone'], ['enough', '26', 'alone'], ['were', '2356', 'alone'], ['his', '236', 'alone'], ['in', '35', 'alone'], ['was', '356', 'alone']],
  },
  'Initial-letter contractions': {
    blurb: 'A prefix cell from the right column plus the word’s first letter or groupsign.',
    items: [
      ['day', '5 145'], ['ever', '5 15'], ['father', '5 124'], ['here', '5 125'], ['know', '5 13'], ['lord', '5 123'],
      ['mother', '5 134'], ['name', '5 1345'], ['one', '5 135'], ['part', '5 1234'], ['question', '5 12345'],
      ['right', '5 1235'], ['some', '5 234'], ['time', '5 2345'], ['under', '5 136'], ['work', '5 2456'],
      ['young', '5 13456'], ['there', '5 2346'], ['character', '5 16'], ['through', '5 1456'], ['where', '5 156'],
      ['ought', '5 1256'], ['upon', '45 136'], ['word', '45 2456'], ['these', '45 2346'], ['those', '45 1456'],
      ['whose', '45 156'], ['cannot', '456 14'], ['had', '456 125'], ['many', '456 134'], ['spirit', '456 234'],
      ['world', '456 2456'], ['their', '456 2346'],
    ],
  },
  'Final-letter groupsigns': {
    blurb: 'Word endings: a prefix cell plus a letter. Never at the start of a word.',
    items: [
      ['ound', '46 145'], ['ance', '46 15'], ['sion', '46 1345'], ['less', '46 234'], ['ount', '46 2345'],
      ['ence', '56 15'], ['ong', '56 1245'], ['ful', '56 123'], ['tion', '56 1345'], ['ness', '56 234'],
      ['ment', '56 2345'], ['ity', '56 13456'],
    ],
  },
  'Shortforms': {
    blurb: 'Abbreviated spellings of common words.',
    items: [
      ['about', '1 12'], ['above', '1 12 1236'], ['according', '1 14'], ['across', '1 14 1235'], ['after', '1 124'],
      ['afternoon', '1 124 1345'], ['afterward', '1 124 2456'], ['again', '1 1245'], ['against', '1 1245 34'],
      ['almost', '1 123 134'], ['already', '1 123 1235'], ['also', '1 123'], ['although', '1 123 1456'],
      ['altogether', '1 123 2345'], ['always', '1 123 2456'], ['because', '23 14'], ['before', '23 124'],
      ['behind', '23 125'], ['below', '23 123'], ['beneath', '23 1345'], ['beside', '23 234'], ['between', '23 2345'],
      ['beyond', '23 13456'], ['blind', '12 123'], ['braille', '12 1235 123'], ['children', '16 1345'],
      ['could', '14 145'], ['either', '15 24'], ['first', '124 34'], ['friend', '124 1235'], ['good', '1245 145'],
      ['great', '1245 1235 2345'], ['herself', '125 12456 124'], ['him', '125 134'], ['himself', '125 134 124'],
      ['immediate', '24 134 134'], ['its', '1346 234'], ['itself', '1346 124'], ['letter', '123 1235'],
      ['little', '123 123'], ['much', '134 16'], ['must', '134 34'], ['myself', '134 13456 124'],
      ['necessary', '1345 15 14'], ['neither', '1345 15 24'], ['paid', '1234 145'], ['perhaps', '1234 12456 125'],
      ['quick', '12345 13'], ['receive', '1235 14 1236'], ['said', '234 145'], ['should', '146 145'],
      ['such', '234 16'], ['today', '2345 145'], ['together', '2345 1245 1235'], ['tomorrow', '2345 134'],
      ['tonight', '2345 1345'], ['would', '2456 145'], ['your', '13456 1235'], ['yourself', '13456 1235 124'],
      ['yourselves', '13456 1235 1236 234'], ['conceive', '25 14 1236'], ['conceiving', '25 14 1236 1245'],
      ['deceive', '145 14 1236'], ['deceiving', '145 14 1236 1245'], ['declare', '145 14 123'], ['declaring', '145 14 123 1245'],
      ['oneself', '5 135 124'], ['ourselves', '1256 1235 1236 234'], ['perceive', '1234 12456 14 1236'],
      ['perceiving', '1234 12456 14 1236 1245'], ['receiving', '1235 14 1236 1245'], ['rejoice', '1235 245 14'],
      ['rejoicing', '1235 245 14 1245'], ['themselves', '2346 134 1236 234'], ['thyself', '1456 13456 124'],
    ],
  },
};
export const cellsOf = (dotSeq) => dotSeq.split(' ').map(fromDots).join('');

// Indicators: name, dots, what it does.
export const INDICATORS = [
  ['capital letter', '6', 'Next letter is a capital.'], ['capital word', '6 6', 'The whole next word is in capitals.'],
  ['capital passage', '6 6 6', 'Three or more words in capitals, ended by the terminator.'], ['capitals terminator', '6 3', 'Ends a capital word or passage.'],
  ['number sign', '3456', 'Letters a–j that follow are digits 1–0.'], ['grade 1 symbol', '56', 'Read the next cell as a plain letter, not a contraction.'],
  ['grade 1 word', '56 56', 'Read the next word uncontracted.'], ['grade 1 passage', '56 56 56', 'Uncontracted passage.'],
  ['italic', '46 23', 'Italic symbol (a different sign marks a whole italic word).'], ['bold', '45 23', 'Bold symbol.'],
];

// Build lookup tables for the grade 2 translator.
const WORDSIGN = {};
const add = (w, d) => { if (!WORDSIGN[w]) WORDSIGN[w] = cellsOf(d); };
for (const [cat, { items }] of Object.entries(CONTRACTIONS)) {
  if (['Strong groupsigns', 'Lower groupsigns', 'Final-letter groupsigns'].includes(cat)) continue;
  for (const [w, d] of items) add(w, d);
}
// Common words where naive longest-match picks the wrong contraction.
const EXCEPTIONS = {
  then: '2346 1345', when: '156 26', them: '2346 134', themselves: '2346 134 1236 234',
  whenever: '156 26 5 15', ourselves: '1256 1235 1236 234',
};

// Part-word groups: [print, cells, position rule]
// rule: 'any' | 'notStart' | 'middle'
const GROUPS = [];
const g = (p, d, rule = 'any') => GROUPS.push([p, cellsOf(d), rule]);
for (const [p, d] of CONTRACTIONS['Strong contractions'].items) g(p, d);
for (const [p, d] of CONTRACTIONS['Strong groupsigns'].items) g(p, d, p === 'ing' ? 'notStart' : 'any');
for (const [p, d] of CONTRACTIONS['Final-letter groupsigns'].items) g(p, d, 'notStart');
['one', 'some', 'ever', 'day', 'part', 'time', 'name', 'work', 'there', 'mother', 'father', 'ought', 'through', 'where', 'under', 'know', 'here', 'right',
  'lord', 'question', 'young', 'character', 'word', 'world', 'spirit', 'many'].forEach((w) => {
  const it = CONTRACTIONS['Initial-letter contractions'].items.find((x) => x[0] === w);
  g(w, it[1]);
});
g('en', '26'); g('in', '35');
g('ea', '2', 'middle'); g('bb', '23', 'middle'); g('cc', '25', 'middle'); g('ff', '235', 'middle'); g('gg', '2356', 'middle');
GROUPS.sort((a, b) => b[0].length - a[0].length);

// Words where a sign would cut across syllables or change the sound, so it is not used there.
const BLOCK = {
  severe: ['ever'], severely: ['ever'], severity: ['ever'],
  bothered: ['there'], bothering: ['there'], sentiment: ['time'], sentiments: ['time'], sentimental: ['time'],
  tournament: ['name'], tournaments: ['name'], ornament: ['name'], ornaments: ['name'], ornamental: ['name'],
  nowhere: ['ow'], wherever: ['where'],
  mishap: ['sh'], mishaps: ['sh'], dishearten: ['sh'], fruity: ['ity'],
};
// be-, con- and dis- go only at the start of a word, and only when they make the first syllable.
const PREFIX = [['dis', fromDots('256')], ['con', fromDots('25')], ['be', fromDots('23')]];
const VOWEL = /[aeiouy]/;
const BE_YES = /^(being|bestow|bespoke|bespectacled)/;
const BE_NOT_RE = /^(benef|benedict|bever|bedouin)/;
const BE_NOT = new Set(['bedroom', 'bedrooms', 'bedrock', 'beneficial', 'beneficiary', 'benefited', 'benefit', 'benefits', 'beverage', 'beverages', 'bevel', 'beret', 'beryl', 'bevy', 'beluga', 'begonia']);
function prefixOf(s) {
  for (const [p, cell] of PREFIX) {
    if (!s.startsWith(p) || s.length <= p.length) continue;
    const rest = s.slice(p.length);
    if (!VOWEL.test(rest)) continue; // "disk", "best": no second syllable
    if (p === 'be' && !BE_YES.test(s) && (BE_NOT.has(s) || BE_NOT_RE.test(s) || !/^([^aeiou][aeiouy]|[bcdfgpt][rl])/.test(rest) || rest[0] === rest[1])) continue; // be-gin, be-tray; not best, bell
    if (p === 'con' && /^[aeiouy]/.test(rest)) continue; // cone, conic
    if (p === 'dis' && rest[0] === 'h' && !/^h(on|ear|arm|evel)/.test(rest)) continue; // dish, but dis-honest
    return [p, cell];
  }
  return null;
}
// Shortforms and whole-word-only initial-letter signs also work with these endings: friends, goodness, words, theirs.
const SUFFIX_OK = new Set([...CONTRACTIONS.Shortforms.items, ...CONTRACTIONS['Initial-letter contractions'].items].map(([w]) => w));
const SUFFIXES = ['ness', 'ly', 's'];

const LABELS = {}; // cell string -> readable name for grade 2 parts
for (const [cat, { items }] of Object.entries(CONTRACTIONS)) for (const [w, d] of items) LABELS[w] = cat;

// A "part" is {cells, print, kind, note}
const P = (cells, print, kind, note = '') => ({ cells, print, kind, note });

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k); // "constructor" is a word too
// Patterns for whole families of words: re-act (prefix), south-east and Shang-hai (compounds).
const BLOCK_RE = [
  [/^(over)?re(act|affirm|appear|assur|assign|assess|align|agent|adjust|awaken|arrang)|^preamble|^deactiv|eaway|pineapple/, ['ea']],
  [/^(south|north)east/, ['the']], [/t(house|hood|hill|hold|hole|hand|heart|head)/, ['th', 'the']],
  [/ssh|^mishandl/, ['sh']], [/^shanghai/, ['gh']], [/^(micr|kil)owa/, ['ow']], [/^(bi|micr|retr|styr|tw|ins)of/, ['of']],
  [/^(takedown|daredevil)/, ['ed']], [/^painstak/, ['st']], [/^(toenail|bottleneck)/, ['en']],
  [/^(centime|multime|sentiment)/, ['time']], [/^ornament/, ['name']], [/^isome/, ['some']], [/^here(s|tic|dit)/, ['here']],
];
// Signs that would cut across syllables in these spots: st-o-n-ed, pris-o-n-er, be-l-i-e-v-er, r-e-v-er-se.
const AVOID = {
  one: (pre, post) => pre.endsWith('o') || /^(d|r|e|o|n[cdt]|l[aiou]?s?$|ts?$)/.test(post),
  st: (pre, post) => post.startsWith('h'), // a-s-th-m-a, e-s-th-er
  there: (pre, post) => pre && /^[dr]/.test(post), // ga-the-r-ed
  here: (pre) => /(ad|co|in)$/.test(pre), // ad-h-er-ed, co-h-er-en-t, in-h-er-en-t
  under: (pre) => pre.endsWith('a'), // l-a-u-n-d-er
  some: (pre, post) => post === 'd', // bl-o-s-s-o-m-ed
  ever: (pre, post) => /[ie]$/.test(pre) || /(^|ir|un|non|pre)r$/.test(pre) && !post.startsWith('en') || /pers$/.test(pre),
};
const blockFor = (s) => [...(has(BLOCK, s) ? BLOCK[s] : []), ...BLOCK_RE.filter(([re]) => re.test(s)).flatMap(([, b]) => b)];

// Shortforms keep their sign inside longer words that keep their meaning: friendly, greatest, received, unnecessary.
const SHORTFORM = CONTRACTIONS.Shortforms.items.map(([w]) => w).sort((a, b) => b.length - a.length);
const SF_CELLS = {}; // cells -> shortform, to spot letter groups that would read as one (al = also)
for (const [w, d] of CONTRACTIONS.Shortforms.items) SF_CELLS[cellsOf(d)] = w;

function contractRun(s, whole) {
  if (whole && has(EXCEPTIONS, s)) return [P(cellsOf(EXCEPTIONS[s]), s, 'contraction', 'whole word')];
  if (whole && has(WORDSIGN, s)) return [P(WORDSIGN[s], s, 'contraction', LABELS[s] || 'wordsign')];
  if (whole) {
    for (const suf of SUFFIXES) {
      const base = s.slice(0, -suf.length);
      if (s.endsWith(suf) && base.length > 1 && SUFFIX_OK.has(base) && has(WORDSIGN, base)) return [P(WORDSIGN[base], base, 'contraction', LABELS[base] || 'wordsign'), ...contractRun('x' + suf, false).slice(1)];
    }
    const sf = shortformIn(s);
    if (sf) return sf;
  }
  const out = contractLetters(s, whole);
  // A word whose cells spell a shortform (al, ab, pd) needs the grade 1 indicator.
  if (whole && out.every((p) => p.kind === 'letter') && has(SF_CELLS, out.map((p) => p.cells).join(''))) {
    out.unshift(P(IND.grade1, '', 'indicator', 'grade 1 indicator (reads as a shortform)'));
  }
  return out;
}

// Endings that keep a shortform's sign: friends, greatest, received (rcv-d), receivers.
const SF_END = {
  '': ['s'], great: ['s', 'er', 'est', 'ly', 'ness'], quick: ['s', 'er', 'est', 'ly', 'ness', 'en', 'ie', 'ies'],
  friend: ['s', 'ly', 'lier', 'liest', 'lies', 'liness', 'ship', 'ships', 'less'], good: ['s', 'ness', 'ly', 'y', 'ie', 'ies'],
  blind: ['s', 'ly', 'ness'], little: ['r', 'st'], letter: ['s', 'ed', 'ing'], afternoon: ['s'], afterward: ['s'],
  first: ['ly', 's'], braille: ['d', 's'], paid: [], said: [], must: ['s'], should: [], could: [], would: [], children: [],
};
const SF_END_E = ['d', 'r', 'rs', 's']; // receive, declare, rejoice and the rest
// Words that can come before a shortform in a compound, and shortforms that start compounds: girlfriend, goodbye.
const SF_START = {
  un: ['necessary', 'said', 'paid', 'friendly'], girl: ['friend'], boy: ['friend'], best: ['friend'], school: ['friend', 'children'],
  grand: ['children'], step: ['children'], god: ['children'], news: ['letter'], under: ['paid'], over: ['paid'], pre: ['paid'],
  re: ['paid'], be: ['friend', 'little'], here: ['about', 'after'], there: ['about', 'after'], where: ['about'],
  herein: ['after'], round: ['about'],
};
const SF_COMPOUND = new Set(['after', 'good', 'first', 'blind', 'quick']);
function shortformIn(s) {
  for (const pre of ['', ...Object.keys(SF_START)]) {
    if (!s.startsWith(pre)) continue;
    for (const base of SHORTFORM) {
      if (!s.startsWith(base, pre.length) || (pre && !SF_START[pre].includes(base))) continue;
      const end = s.slice(pre.length + base.length);
      if (!pre && !end) continue;
      const ends = base.endsWith('e') && !has(SF_END, base) ? SF_END_E : has(SF_END, base) ? SF_END[base] : SF_END[''];
      // A compound: after-life, good-bye, first-hand, blind-fold (blind is spelled out before a vowel).
      const compound = !pre && SF_COMPOUND.has(base) && end.length > 2 && /^[^aeiouy]/.test(end);
      if (end && !ends.includes(end) && !compound) continue;
      const out = [];
      if (pre) out.push(...(pre === 'be' ? [P(fromDots('23'), 'be', 'contraction', 'groupsign')] : contractLetters(pre, false)));
      out.push(P(WORDSIGN[base], base, 'contraction', LABELS[base]));
      if (end) out.push(...(compound ? contractLetters(end, false) : contractLetters('x' + end, false).slice(1)));
      return out;
    }
  }
  return null;
}

// Spell a letter run with groupsigns, choosing the spelling with the fewest cells (busi-ness, sugges-tion).
// On a tie the earlier, longer sign wins.
function contractLetters(s, whole, noPrefix = false) {
  const block = blockFor(s);
  const out = [];
  let start = 0;
  const pre = !noPrefix && prefixOf(s);
  if (pre) { out.push(P(pre[1], pre[0], 'contraction', 'groupsign')); start = pre[0].length; }
  const n = s.length;
  const best = new Array(n + 1);
  best[n] = { cost: 0 };
  for (let i = n - 1; i >= start; i--) {
    let pick = null;
    const consider = (p, cells, kind) => {
      const cost = [...cells].length + best[i + p.length].cost;
      if (!pick || cost < pick.cost) pick = { cost, p, cells, kind };
    };
    for (const [p, cells, rule] of GROUPS) {
      if (!s.startsWith(p, i)) continue;
      if (block.includes(p)) continue;
      if (rule === 'notStart' && i === 0) continue;
      if (rule === 'middle' && (i === 0 || i + p.length >= s.length)) continue;
      // A lower sign (ea, bb…) gives way to an upper one that starts on its second letter: n-e-ar, not n-ea-r.
      if (rule === 'middle' && GROUPS.some(([q, , r]) => r !== 'middle' && q.length > 1 && s.startsWith(q, i + 1) && !block.includes(q))) continue;
      if (has(AVOID, p) && AVOID[p](s.slice(0, i), s.slice(i + p.length))) continue;
      if (whole && p === s && !['er', 'ed', 'ow'].includes(p)) continue; // st alone is s-t, not still; er, ed, ow keep their sign
      consider(p, cells, 'contraction');
    }
    consider(s[i], LETTERS[s[i]], 'letter');
    best[i] = pick;
  }
  for (let i = start; i < n;) {
    const b = best[i];
    out.push(b.kind === 'letter' ? P(b.cells, b.p, 'letter') : P(b.cells, b.p, 'contraction', 'groupsign'));
    i += b.p.length;
  }
  return out;
}

const HYPHENS = ['-', '–', '—'];
// Accented letters: a modifier (dots 4-5 plus a mark) before the plain letter: café = c-a-f-⠘⠌-e.
const ACCENT = { '́': ['45 34', 'acute accent'], '̀': ['45 16', 'grave accent'], '̂': ['45 146', 'circumflex'], '̈': ['45 25', 'diaeresis'], '̧': ['45 12346', 'cedilla'], '̃': ['45 12456', 'tilde'], '̊': ['45 1246', 'ring'] };
const accentOf = (c) => { const d = c.normalize('NFD'); return d.length === 2 && /[a-z]/i.test(d[0]) && ACCENT[d[1]] ? [d[0], ACCENT[d[1]]] : null; };
const baseOf = (c) => (accentOf(c) ? accentOf(c)[0] : c);
const isLetter = (c) => /[a-z]/i.test(c) || !!accentOf(c);
const isDigit = (c) => /[0-9]/.test(c);
const isUpper = (c) => /[A-Z]/.test(baseOf(c));
// Symbols beyond the punctuation lessons, so they are not left blank.
const UEB_MORE = {
  '[': ['46 126', 'open square bracket'], ']': ['46 345', 'close square bracket'], '{': ['456 126', 'open curly bracket'], '}': ['456 345', 'close curly bracket'],
  '<': ['4 126', 'less than'], '>': ['4 345', 'greater than'], '~': ['4 35', 'tilde'], _: ['46 36', 'underscore'], '\\': ['456 16', 'backslash'], '|': ['456 1256', 'vertical bar'],
  '€': ['4 15', 'euro'], '£': ['4 123', 'pound'], '¢': ['4 14', 'cent'], '¥': ['4 13456', 'yen'], '§': ['45 234', 'section'], '¶': ['45 1234', 'paragraph'],
  '©': ['45 14', 'copyright'], '®': ['45 1235', 'registered'], '™': ['45 2345', 'trademark'], '…': ['256 256 256', 'ellipsis'], '•': ['456 256', 'bullet'],
  '‘': ['6 236', 'open single quote'], '−': ['5 36', 'minus'], '^': ['4 26', 'caret'], '→': ['56 1256 135', 'right arrow'], '←': ['56 1256 246', 'left arrow'],
  '«': ['45 236', 'open angle quote'], '»': ['45 356', 'close angle quote'],
};
// Lower cells that would read as a word when they stand alone (? is also "his"), so they take the grade 1 symbol.
const LOWER_WORDS = new Set(['23', '26', '2356', '236', '35', '356'].map(fromDots));

// Three or more words in capitals make a capitals passage: ⠠⠠⠠ before, ⠠⠄ after the last.
function capsPassages(words) {
  const caps = words.map((w) => /^\s*$/.test(w) ? null : /[a-z]/i.test(w.normalize('NFD')) && ![...w].some((c) => isLetter(c) && !isUpper(c)));
  const start = new Set(); const end = new Set();
  for (let i = 0; i < words.length;) {
    if (caps[i] !== true) { i++; continue; }
    let j = i, n = 0, last = i;
    while (j < words.length && caps[j] !== false) { if (caps[j]) { n++; last = j; } j++; }
    if (n >= 3) { start.add(i); end.add(last); }
    i = last + 1;
  }
  return { start, end, inside: (k) => [...start].some((a) => a <= k && [...end].some((b) => b >= k && b >= a && ![...end].some((c) => c >= a && c < b))) };
}

// Mixed case (McDonald, CDs, iPhone) or accented letters: capitals marked inside the word, each piece contracted.
function mixedRun(run, grade, atStart) {
  const out = [];
  const pieces = run.match(/[A-ZÀ-ÖØ-Þ]+[^A-ZÀ-ÖØ-Þ]*|[^A-ZÀ-ÖØ-Þ]+/g) || [];
  pieces.forEach((pc, n) => {
    const capLen = [...pc].findIndex((c) => !isUpper(c));
    const nCap = capLen < 0 ? pc.length : capLen;
    if (nCap >= 2) out.push(P(IND.capital + IND.capital, '', 'indicator', 'capitals word'));
    else if (nCap === 1) out.push(P(IND.capital, '', 'indicator', 'capital'));
    const spell = (str, first) => {
      // split on accented letters, contract the plain stretches
      let buf = '';
      const flush = () => {
        if (!buf) return;
        if (grade === 2) {
          let k = 0; // carry original case for display
          for (const p of contractLetters(buf.toLowerCase(), false, !first)) { p.print = buf.slice(k, k + p.print.length); k += p.print.length; out.push(p); }
        } else for (const ch of buf) out.push(P(LETTERS[ch.toLowerCase()], ch, 'letter'));
        buf = ''; first = false;
      };
      for (const ch of str) {
        const acc = accentOf(ch);
        if (acc) { flush(); out.push(P(cellsOf(acc[1][0]), '', 'indicator', acc[1][1]), P(LETTERS[acc[0].toLowerCase()], ch, 'letter')); first = false; } else buf += ch;
      }
      flush();
    };
    if (nCap >= 2 && nCap < pc.length) {
      spell(pc.slice(0, nCap), atStart && n === 0);
      out.push(P(IND.capital + fromDots('3'), '', 'indicator', 'capitals terminator'));
      spell(pc.slice(nCap), false);
    } else spell(pc, atStart && n === 0);
  });
  return out;
}

// English UEB translator. grade: 1 or 2. Returns array of parts.
export function translateEnglish(text, grade = 1) {
  const parts = [];
  const words = text.replace(/\r/g, '').normalize('NFC').split(/(\s+)/);
  const passage = capsPassages(words);
  let inPassage = false;
  let quoteOpen = false;
  words.forEach((w, wi) => {
    if (!w) return;
    if (/^\s+$/.test(w)) {
      if (w.includes('\n')) parts.push(P('\n', '↵', 'newline'));
      else parts.push(P('⠀', ' ', 'space'));
      return;
    }
    const wordStart = parts.length;
    // core letters for whole-word detection
    const lettersOnly = w.replace(/^[^a-z0-9À-ɏ]+|[^a-z0-9À-ɏ]+$/gi, '');
    const allCaps = lettersOnly.length >= 2 && [...lettersOnly].every((c) => isLetter(c) && isUpper(c));
    let capsWordDone = false;
    let i = 0;
    let numMode = false;
    if (passage.start.has(wi)) inPassage = true;
    let passageOpen = passage.start.has(wi);
    while (i < w.length) {
      const c = w[i];
      if (isDigit(c)) {
        if (!numMode) { parts.push(P(IND.number, '#', 'indicator', 'number sign')); numMode = true; }
        parts.push(P(LETTERS[DIGIT_LETTER[c]], c, 'digit'));
        i++;
        // decimal point or thousands comma inside a number keeps number mode
        if ((w[i] === '.' || w[i] === ',') && isDigit(w[i + 1] || '')) {
          parts.push(w[i] === '.' ? P(fromDots('256'), '.', 'punct', 'decimal point') : P(fromDots('2'), ',', 'punct', 'numeric comma'));
          i++;
        }
        continue;
      }
      if (isLetter(c)) {
        let j = i;
        while (j < w.length && isLetter(w[j])) j++;
        const run = w.slice(i, j);
        // Only lowercase a–j can be mistaken for digits; a capital sign already ends number mode.
        if (numMode && /^[a-j]/.test(baseOf(run[0]))) parts.push(P(IND.grade1, '', 'indicator', 'grade 1 indicator (letter after number)'));
        numMode = false;
        if (passageOpen) { parts.push(P(IND.capital + IND.capital + IND.capital, '', 'indicator', 'capitals passage')); passageOpen = false; }
        const lower = run.toLowerCase();
        // A hyphen or dash also bounds a word: so-called, x-ray, mother-in-law.
        const segStart = Math.max(...HYPHENS.map((h) => (i ? w.lastIndexOf(h, i - 1) : -1))) + 1;
        const segEnd = Math.min(...HYPHENS.map((h) => { const k = w.indexOf(h, j); return k < 0 ? w.length : k; }));
        const seg = w.slice(segStart, segEnd);
        const segLetters = seg.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');
        // it's, that's, you'll, can't: the wordsign is still used before the apostrophe.
        const apos = segLetters.match(/^([A-Za-z]+)['’](s|ll|d|re|ve|m|t)$/);
        let whole = run === segLetters || (apos && run === apos[1] && i === segStart + seg.indexOf(apos[1]));
        // be, were, his and was are spelled out (other contractions still apply: w-er-e) when punctuation touches them.
        if (whole && ['be', 'were', 'his', 'was'].includes(lower) && lettersOnly !== w) whole = false;
        const plain = /^[a-z]+$/i.test(run);
        const simple = plain && (inPassage || allCaps || /^[A-Z]?[a-z]*$/.test(run) || /^[A-Z]+$/.test(run));
        if (!simple) {
          parts.push(...mixedRun(run, grade, i === segStart));
          i = j;
          continue;
        }
        // capitals
        if (inPassage) {
          // the passage indicator covers every letter
        } else if (allCaps) {
          if (!capsWordDone) { parts.push(P(IND.capital + IND.capital, '', 'indicator', 'capitals word')); capsWordDone = true; }
        } else if (/^[A-Z]+$/.test(run) && run.length > 1) {
          parts.push(P(IND.capital + IND.capital, '', 'indicator', 'capitals word')); // ADA-style: the hyphen ends it
        } else if (/^[A-Z]/.test(run)) {
          parts.push(P(IND.capital, '', 'indicator', 'capital'));
        }
        if (grade === 2) {
          if (whole && lower.length === 1 && !'aio'.includes(lower)) {
            parts.push(P(IND.grade1, '', 'indicator', 'grade 1 indicator (lone letter)'));
            parts.push(P(LETTERS[lower], run, 'letter'));
          } else {
            const cp = contractRun(lower, whole);
            // carry original case for display
            let k = 0;
            for (const p of cp) { p.print = run.slice(k, k + p.print.length); k += p.print.length; parts.push(p); }
          }
        } else {
          for (const ch of run) parts.push(P(LETTERS[ch.toLowerCase()], ch, 'letter'));
        }
        i = j;
        continue;
      }
      // A number that starts with its decimal point: .5 is the number sign, then the point.
      if (c === '.' && !numMode && isDigit(w[i + 1] || '')) {
        parts.push(P(IND.number, '#', 'indicator', 'number sign'), P(fromDots('256'), '.', 'punct', 'decimal point'));
        numMode = true; i++; continue;
      }
      numMode = false;
      const code = c.charCodeAt(0);
      if (c === '"') {
        parts.push(quoteOpen ? P(fromDots('356'), '”', 'punct', 'close quote') : P(fromDots('236'), '“', 'punct', 'open quote'));
        quoteOpen = !quoteOpen;
      } else if (code >= 0x2800 && code <= 0x28ff) {
        parts.push(P(c, c, 'punct', 'braille cell')); // braille typed or pasted in stays as it is
      } else if (UEB_PUNCT[c]) {
        parts.push(P(UEB_PUNCT[c][0], c, 'punct', UEB_PUNCT[c][1]));
      } else if (has(UEB_MORE, c)) {
        parts.push(P(cellsOf(UEB_MORE[c][0]), c, 'punct', UEB_MORE[c][1]));
      } else {
        parts.push(P(fromDots(''), c, 'unknown', 'not in this table'));
      }
      i++;
    }
    // A lone lower sign such as ? would read as a word (his), so it takes the grade 1 symbol.
    const mine = parts.slice(wordStart);
    if (mine.length === 1 && mine[0].kind === 'punct' && LOWER_WORDS.has(mine[0].cells)) parts.splice(wordStart, 0, P(IND.grade1, '', 'indicator', 'grade 1 symbol'));
    if (passage.end.has(wi)) { parts.push(P(IND.capital + fromDots('3'), '', 'indicator', 'capitals terminator')); inPassage = false; }
  });
  return parts;
}

// ---------- Other languages (uncontracted / grade 1) ----------
// Checked against the official codes: CBFU 2008 (French), ONCE/CBE (Spanish), Das System der deutschen
// Brailleschrift (German Basisschrift), Russian braille, and modern Greek braille.
const A_J = 'abcdefghij';
const LANG = {
  fr: {
    name: 'Français (CBFU)',
    capital: fromDots('46'),
    number: 'antoine',
    extra: {
      é: '123456', à: '12356', è: '2346', ù: '23456', â: '16', ê: '126', î: '146', ô: '1456', û: '156',
      ë: '1246', ï: '12456', ü: '1256', ç: '12346', œ: '246', æ: '345', w: '2456',
    },
    punct: {
      ',': '2', ';': '23', ':': '25', '.': '256', '?': '26', '!': '235', "'": '3', '’': '3', '-': '36', '/': '34',
      '«': '2356', '»': '2356', '"': '2356', '“': '2356', '”': '2356', '(': '236', ')': '356', '€': '45 15',
    },
  },
  es: {
    name: 'Español',
    capital: fromDots('46'),
    number: 'standard',
    extra: { á: '12356', é: '2346', í: '34', ó: '346', ú: '23456', ü: '1256', ñ: '12456' },
    punct: {
      ',': '2', ';': '23', ':': '25', '.': '3', '?': '26', '¿': '26', '!': '235', '¡': '235', '-': '36',
      '(': '126', ')': '345', '"': '236', '“': '236', '”': '236', '«': '236', '»': '236',
    },
  },
  de: {
    name: 'Deutsch',
    // A capital sign (dots 4-6) exists, but ordinary German braille leaves capitals unmarked.
    capital: null,
    number: 'standard',
    extra: { ä: '345', ö: '246', ü: '1256', ß: '2346' },
    punct: { ',': '2', ';': '23', ':': '25', '.': '3', '?': '26', '!': '235', '-': '36', '(': '2356', ')': '2356', '„': '236', '“': '356', "'": '6', '’': '6' },
  },
  ru: {
    name: 'Русский',
    // Ordinary Russian braille text leaves capitals unmarked.
    capital: null,
    number: 'standard',
    map: {
      а: '1', б: '12', в: '2456', г: '1245', д: '145', е: '15', ё: '16', ж: '245', з: '1356', и: '24', й: '12346',
      к: '13', л: '123', м: '134', н: '1345', о: '135', п: '1234', р: '1235', с: '234', т: '2345', у: '136',
      ф: '124', х: '125', ц: '14', ч: '12345', ш: '156', щ: '1346', ъ: '12356', ы: '2346', ь: '23456',
      э: '246', ю: '1256', я: '1246',
    },
    punct: { ',': '2', ';': '23', ':': '25', '.': '256', '?': '26', '!': '235', '-': '36', '—': '36', '–': '36', '«': '236', '»': '356', '(': '126', ')': '345' },
  },
  el: {
    name: 'Ελληνικά',
    capital: fromDots('46'),
    number: 'standard',
    map: {
      α: '1', β: '12', γ: '1245', δ: '145', ε: '15', ζ: '1356', η: '345', θ: '1456', ι: '24', κ: '13', λ: '123',
      μ: '134', ν: '1345', ξ: '1346', ο: '135', π: '1234', ρ: '1235', σ: '234', ς: '234', τ: '2345', υ: '13456',
      φ: '124', χ: '125', ψ: '12346', ω: '245',
    },
    // Vowel pairs written as one cell. The accent (tonos) is dot 5, placed before the vowel or pair.
    digraphs: { αι: '126', ει: '146', οι: '246', υι: '12456', αυ: '16', ευ: '156', ηυ: '1256', ου: '136' },
    accent: '5',
    punct: { ',': '2', '.': '256', ';': '26', ';': '26', '·': '23', '·': '23', ':': '25', '!': '235', '-': '36', "'": '3', '’': '3', '(': '2356', ')': '2356', '«': '236', '»': '356' },
  },
};
export const LANGS = LANG;

export function translateOther(text, code) {
  const L = LANG[code];
  const parts = [];
  let numMode = false;
  // Greek: split an accented vowel into its base letter and marks (tonos, dialytika).
  const split = (c) => {
    const d = c.normalize('NFD');
    return { base: [...d][0], tonos: d.includes('́'), dia: d.includes('̈') };
  };
  const chars = [...(L.accent ? text.normalize('NFC') : text)];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const low = ch.toLocaleLowerCase();
    if (/\s/.test(ch)) { numMode = false; parts.push(ch === '\n' ? P('\n', '↵', 'newline') : P('⠀', ' ', 'space')); continue; }
    if (isDigit(ch)) {
      const d = A_J[(Number(ch) + 9) % 10];
      if (L.number === 'antoine') {
        if (!numMode) parts.push(P(fromDots('6'), '#', 'indicator', 'number sign'));
        parts.push(P(fromDots(ch === '0' ? '3456' : LETTER_DOTS[d] + '6'), ch, 'digit', 'Antoine notation'));
      } else {
        if (!numMode) parts.push(P(IND.number, '#', 'indicator', 'number sign'));
        parts.push(P(LETTERS[d], ch, 'digit'));
      }
      numMode = true;
      continue;
    }
    // A decimal comma or point between digits keeps the number going: 3,5.
    if (numMode && (ch === ',' || ch === '.') && isDigit(chars[i + 1] || '') && L.punct[ch]) { parts.push(P(cellsOf(L.punct[ch]), ch, 'punct', 'decimal')); continue; }
    numMode = false;
    if (L.accent && !L.map[low]) {
      const a = split(low);
      if (L.map[a.base] && (a.tonos || a.dia)) {
        if (ch !== low) parts.push(P(L.capital, '', 'indicator', 'capital'));
        if (a.tonos) parts.push(P(fromDots(L.accent), '', 'indicator', 'accent'));
        parts.push(P(fromDots(L.map[a.base]), ch, 'letter'));
        continue;
      }
    }
    if (L.digraphs && L.map[low] && i + 1 < chars.length) {
      // A pair is one cell unless the second vowel carries a dialytika (ϊ, ϋ).
      const b = split(chars[i + 1].toLocaleLowerCase());
      const dg = !b.dia && L.digraphs[low + b.base];
      if (dg) {
        if (ch !== low) parts.push(P(L.capital, '', 'indicator', 'capital'));
        if (b.tonos) parts.push(P(fromDots(L.accent), '', 'indicator', 'accent'));
        parts.push(P(fromDots(dg), ch + chars[i + 1], 'letter'));
        i++;
        continue;
      }
    }
    const isUpper = ch !== low && L.capital;
    let dots = (L.map && L.map[low]) || (L.extra && L.extra[low]) || (!L.map && LETTER_DOTS[low]);
    if (dots) {
      if (isUpper) parts.push(P(L.capital, '', 'indicator', 'capital'));
      parts.push(P(fromDots(dots), ch, 'letter'));
      continue;
    }
    if (L.punct[ch]) { parts.push(P(cellsOf(L.punct[ch]), ch, 'punct')); continue; }
    parts.push(P(fromDots(''), ch, 'unknown', 'not in this table'));
  }
  return parts;
}

export function translate(text, lang = 'en', grade = 1) {
  return lang === 'en' ? translateEnglish(text, grade) : translateOther(text, lang);
}

// Split each part into individual cells, keeping its print label on the first.
export function toCells(parts) {
  const out = [];
  for (const p of parts) {
    if (p.kind === 'newline') { out.push({ cell: '\n', print: '', kind: 'newline' }); continue; }
    const chars = [...p.cells];
    chars.forEach((c, i) => out.push({
      cell: c, print: i === 0 ? p.print : '', kind: p.kind, note: p.note, span: chars.length, idx: i, group: p,
    }));
  }
  return out;
}
export const unicodeOf = (parts) => parts.map((p) => (p.kind === 'space' ? ' ' : p.cells)).join('');
