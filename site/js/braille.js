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
      ['ea', '2', 'inside a word only · tea'], ['bb', '23', 'inside only · rabbit'], ['cc', '25', 'inside only · accept'],
      ['ff', '235', 'inside only · coffee'], ['gg', '2356', 'inside only · egg'], ['en', '26', 'anywhere in a word · ten'],
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

// Build lookup tables for the grade 2 translator.
const WORDSIGN = {};
const add = (w, d) => { if (!WORDSIGN[w]) WORDSIGN[w] = cellsOf(d); };
for (const [cat, { items }] of Object.entries(CONTRACTIONS)) {
  if (['Strong groupsigns', 'Lower groupsigns', 'Final-letter groupsigns'].includes(cat)) continue;
  for (const [w, d] of items) add(w, d);
}
// Common words where naive longest-match picks the wrong contraction.
const EXCEPTIONS = {
  then: '1456 26', when: '156 26', them: '2346 134', themselves: '2346 134 1236 234',
  whenever: '156 26 5 15', ourselves: '1256 1235 1236 234',
};

// Part-word groups: [print, cells, position rule]
// rule: 'any' | 'notStart' | 'middle'
const GROUPS = [];
const g = (p, d, rule = 'any') => GROUPS.push([p, cellsOf(d), rule]);
for (const [p, d] of CONTRACTIONS['Strong contractions'].items) g(p, d);
for (const [p, d] of CONTRACTIONS['Strong groupsigns'].items) g(p, d, p === 'ing' ? 'notStart' : 'any');
for (const [p, d] of CONTRACTIONS['Final-letter groupsigns'].items) g(p, d, 'notStart');
['one', 'some', 'ever', 'day', 'part', 'time', 'name', 'work', 'there', 'mother', 'father', 'ought', 'through', 'where', 'under', 'know', 'here', 'right'].forEach((w) => {
  const it = CONTRACTIONS['Initial-letter contractions'].items.find((x) => x[0] === w);
  g(w, it[1]);
});
g('en', '26'); g('in', '35');
g('ea', '2', 'middle'); g('bb', '23', 'middle'); g('cc', '25', 'middle'); g('ff', '235', 'middle'); g('gg', '2356', 'middle');
GROUPS.sort((a, b) => b[0].length - a[0].length);

const LABELS = {}; // cell string -> readable name for grade 2 parts
for (const [cat, { items }] of Object.entries(CONTRACTIONS)) for (const [w, d] of items) LABELS[w] = cat;

// A "part" is {cells, print, kind, note}
const P = (cells, print, kind, note = '') => ({ cells, print, kind, note });

function contractRun(s, whole) {
  if (whole && EXCEPTIONS[s]) return [P(cellsOf(EXCEPTIONS[s]), s, 'contraction', 'whole word')];
  if (whole && WORDSIGN[s]) return [P(WORDSIGN[s], s, 'contraction', LABELS[s] || 'wordsign')];
  const out = [];
  let i = 0;
  while (i < s.length) {
    let hit = null;
    for (const [p, cells, rule] of GROUPS) {
      if (!s.startsWith(p, i)) continue;
      if (rule === 'notStart' && i === 0) continue;
      if (rule === 'middle' && (i === 0 || i + p.length >= s.length)) continue;
      if (whole && p === s) continue; // whole-word forms handled above
      hit = [p, cells];
      break;
    }
    if (hit) { out.push(P(hit[1], hit[0], 'contraction', 'groupsign')); i += hit[0].length; }
    else { out.push(P(LETTERS[s[i]], s[i], 'letter')); i++; }
  }
  return out;
}

const isLetter = (c) => /[a-z]/i.test(c);
const isDigit = (c) => /[0-9]/.test(c);

// English UEB translator. grade: 1 or 2. Returns array of parts.
export function translateEnglish(text, grade = 1) {
  const parts = [];
  const words = text.replace(/\r/g, '').split(/(\s+)/);
  let quoteOpen = false;
  for (const w of words) {
    if (!w) continue;
    if (/^\s+$/.test(w)) {
      if (w.includes('\n')) parts.push(P('\n', '↵', 'newline'));
      else parts.push(P('⠀', ' ', 'space'));
      continue;
    }
    // core letters for whole-word detection
    const lettersOnly = w.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');
    const allCaps = lettersOnly.length >= 2 && /^[A-Z]+$/.test(lettersOnly);
    let capsWordDone = false;
    let i = 0;
    let numMode = false;
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
        if (numMode && /^[a-j]/.test(run)) parts.push(P(IND.grade1, '', 'indicator', 'grade 1 indicator (letter after number)'));
        numMode = false;
        const lower = run.toLowerCase();
        const whole = run === lettersOnly;
        // capitals
        if (allCaps) {
          if (!capsWordDone) { parts.push(P(IND.capital + IND.capital, '', 'indicator', 'capitals word')); capsWordDone = true; }
        } else if (/^[A-Z][a-z]*$/.test(run)) {
          parts.push(P(IND.capital, '', 'indicator', 'capital'));
        }
        const mixed = !allCaps && !/^[A-Z]?[a-z]*$/.test(run);
        if (mixed) {
          for (const ch of run) {
            if (/[A-Z]/.test(ch)) parts.push(P(IND.capital, '', 'indicator', 'capital'));
            parts.push(P(LETTERS[ch.toLowerCase()], ch, 'letter'));
          }
        } else if (grade === 2) {
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
      numMode = false;
      if (c === '"') {
        parts.push(quoteOpen ? P(fromDots('356'), '”', 'punct', 'close quote') : P(fromDots('236'), '“', 'punct', 'open quote'));
        quoteOpen = !quoteOpen;
      } else if (UEB_PUNCT[c]) {
        parts.push(P(UEB_PUNCT[c][0], c, 'punct', UEB_PUNCT[c][1]));
      } else {
        parts.push(P(fromDots(''), c, 'unknown', 'not in this table'));
      }
      i++;
    }
  }
  return parts;
}

// ---------- Other languages (uncontracted / grade 1) ----------
const A_J = 'abcdefghij';
const LANG = {
  fr: {
    name: 'Français (CBFU)',
    capital: fromDots('46'),
    number: 'antoine',
    extra: {
      é: '123456', à: '12356', è: '2346', ù: '23456', â: '16', ê: '126', î: '146', ô: '1456', û: '156',
      ë: '1246', ï: '12456', ü: '1256', ç: '12346', œ: '246', w: '2456',
    },
    punct: { ',': '2', ';': '23', ':': '25', '.': '256', '?': '26', '!': '235', "'": '3', '’': '3', '-': '36', '«': '2356', '»': '2356', '(': '236', ')': '356' },
  },
  es: {
    name: 'Español',
    capital: fromDots('46'),
    number: 'standard',
    extra: { á: '12356', é: '2346', í: '34', ó: '346', ú: '23456', ü: '1256', ñ: '12456' },
    punct: { ',': '2', ';': '23', ':': '25', '.': '3', '?': '26', '¿': '26', '!': '235', '¡': '235', '-': '36', '(': '126', ')': '345', '"': '236' },
  },
  de: {
    name: 'Deutsch',
    capital: null,
    number: 'standard',
    extra: { ä: '345', ö: '246', ü: '1256', ß: '2346' },
    punct: { ',': '2', ';': '23', ':': '25', '.': '3', '?': '26', '!': '235', '-': '36' },
  },
  ru: {
    name: 'Русский',
    capital: null,
    number: 'standard',
    map: {
      а: '1', б: '12', в: '2456', г: '1245', д: '145', е: '15', ё: '16', ж: '245', з: '1356', и: '24', й: '12346',
      к: '13', л: '123', м: '134', н: '1345', о: '135', п: '1234', р: '1235', с: '234', т: '2345', у: '136',
      ф: '124', х: '125', ц: '14', ч: '12345', ш: '156', щ: '1346', ъ: '12356', ы: '2346', ь: '23456',
      э: '246', ю: '1256', я: '1246',
    },
    punct: { ',': '2', ';': '23', ':': '25', '.': '256', '?': '26', '!': '235', '-': '36' },
  },
  el: {
    name: 'Ελληνικά',
    capital: null,
    number: 'standard',
    map: {
      α: '1', β: '12', γ: '1245', δ: '145', ε: '15', ζ: '1356', η: '345', θ: '1456', ι: '24', κ: '13', λ: '123',
      μ: '134', ν: '1345', ξ: '1346', ο: '135', π: '1234', ρ: '1235', σ: '234', ς: '234', τ: '2345', υ: '136',
      φ: '124', χ: '12346', ψ: '13456', ω: '2456',
    },
    punct: { ',': '2', '.': '256', ';': '26', '!': '235', '-': '36' },
  },
};
export const LANGS = LANG;

export function translateOther(text, code) {
  const L = LANG[code];
  const parts = [];
  let numMode = false;
  for (const ch of text) {
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
    numMode = false;
    const isUpper = ch !== low && L.capital;
    if (isUpper) parts.push(P(L.capital, '', 'indicator', 'capital'));
    let dots = (L.map && L.map[low]) || (L.extra && L.extra[low]) || (!L.map && LETTER_DOTS[low]);
    if (dots) { parts.push(P(fromDots(dots), ch, 'letter')); continue; }
    if (L.punct[ch]) { parts.push(P(fromDots(L.punct[ch]), ch, 'punct')); continue; }
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
