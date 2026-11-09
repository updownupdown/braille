import {
  LETTERS, IND, UEB_PUNCT, CONTRACTIONS, cellsOf, fromDots, toDots, dotsLabel,
  translate, toCells, unicodeOf, LANGS,
} from './braille.js?v=3';
import {
  SIGN_WORDS, WORDS, SENTENCES, SCIENCE, NEMETH, LANG_INFO, JAPANESE, SYSTEMS, HISTORY, SIGN_REGIONS,
} from './data.js?v=3';

// ---------- helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('dots.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('dots.' + k, JSON.stringify(v)); } catch {} },
};
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ---------- icons (line icons, not dots) ----------
const P = {
  home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  practice: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/><path d="M8 7h8"/>',
  translate: '<path d="M3 5h9"/><path d="M7.5 3v2"/><path d="M5 5c.8 3.5 3.3 6.3 6.5 7.5"/><path d="M10 5c-.8 3.5-3.3 6.3-6.5 7.5"/><path d="m12.5 21 4.25-10L21 21"/><path d="M14 17.5h5.5"/>',
  settings: '<path d="M4 6h10"/><path d="M18 6h2"/><circle cx="16" cy="6" r="2"/><path d="M4 12h3"/><path d="M11 12h9"/><circle cx="9" cy="12" r="2"/><path d="M4 18h11"/><path d="M19 18h1"/><circle cx="17" cy="18" r="2"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.5"/><path d="M12 17h.01"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  play: '<path d="M7 5v14l11-7z" fill="currentColor"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>',
  restart: '<path d="M3.5 12a8.5 8.5 0 1 0 2.7-6.2"/><path d="M3 4v5h5"/>',
  shuffle: '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="m4 4 5 5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
};
const icon = (n, size = 22) => `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;

// ---------- settings ----------
const DEFAULTS = {
  theme: 'auto', dotNums: false, hideLetters: false, signsHide: false, trLabels: true, trLarge: false,
  swGrade: 1, swLabels: 'show', swSize: 'large', swSound: true, swVibe: true, swSpeak: false, swSpeed: 1,
};
const S = { ...DEFAULTS, ...store.get('settings', {}) };
const canVibrate = 'vibrate' in navigator && matchMedia('(pointer: coarse)').matches;
const canSpeak = 'speechSynthesis' in window;
function applySettings() {
  const r = document.documentElement;
  if (S.theme === 'auto') delete r.dataset.theme; else r.dataset.theme = S.theme;
  const b = document.body.classList;
  b.toggle('s-dotnums', S.dotNums); b.toggle('s-hide-letters', S.hideLetters); b.toggle('s-signs-hide', S.signsHide);
  b.toggle('s-tr-nolabels', !S.trLabels); b.toggle('s-tr-large', S.trLarge);
  b.toggle('s-sw-hidden', S.swLabels === 'hidden'); b.toggle('s-sw-after', S.swLabels === 'after'); b.toggle('s-sw-real', S.swSize === 'real');
}
function setS(k, v) { S[k] = v; store.set('settings', S); applySettings(); window.dispatchEvent(new CustomEvent('settings', { detail: k })); }

// ---------- cells ----------
function cellHTML(cell, cls = '', opts = {}) {
  const on = new Set(toDots(cell));
  let dots = '';
  for (let d = 1; d <= 6; d++) {
    const added = opts.added && opts.added.includes(d) && on.has(d) ? ' added' : '';
    dots += `<i class="${on.has(d) ? 'on' : ''}${added}" data-n="${d}"></i>`;
  }
  return `<span class="cell ${cls}" role="img" aria-label="${esc(dotsLabel(cell))}">${dots}</span>`;
}
const cellsHTML = (str, cls = '') => [...str].map((c) => (c === ' ' || c === '⠀' ? '<span class="bw space"></span>' : cellHTML(c, cls))).join('');
function lineHTML(parts, { labels = true, cls = '' } = {}) {
  let out = '', word = '';
  const flush = () => { if (word) out += `<span class="bword">${word}</span>`; word = ''; };
  for (const c of toCells(parts)) {
    if (c.kind === 'newline') { flush(); out += '<span class="bw-break"></span>'; continue; }
    if (c.kind === 'space') { flush(); out += '<span class="bw space"></span>'; continue; }
    const lbl = c.idx === 0 ? (c.print || (c.kind === 'indicator' ? '·' : '')) : '';
    word += `<span class="bw kind-${c.kind}" title="${esc((c.group.print || '') + ' ' + (c.note || ''))}">${cellHTML(c.cell, cls)}${labels ? `<span class="lbl">${esc(lbl)}</span>` : ''}</span>`;
  }
  flush();
  return `<div class="braille-line">${out}</div>`;
}

// ---------- modal sheet ----------
const sheet = $('#sheet');
const backdrop = $('#sheetBackdrop');
let sheetClose = null;
function openSheet(html, { title = '', onClose = null } = {}) {
  sheet.innerHTML = `<div class="sheet-head">${title ? `<h2>${esc(title)}</h2>` : '<span></span>'}<button class="close" aria-label="Close">✕</button></div>${html}`;
  sheet.hidden = false; backdrop.hidden = false; sheetClose = onClose;
  $('.close', sheet).onclick = closeSheet;
  $('.close', sheet).focus({ preventScroll: true });
}
function closeSheet() { if (sheet.hidden) return; sheet.hidden = true; backdrop.hidden = true; const f = sheetClose; sheetClose = null; f && f(); }
backdrop.onclick = closeSheet;
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeDD(); closeSheet(); } });
sheet.addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]')) closeSheet(); });

// ---------- custom drop-down ----------
let openDD = null;
function closeDD() { if (openDD) { openDD.classList.remove('open'); openDD = null; } }
document.addEventListener('click', (e) => { if (openDD && !openDD.contains(e.target)) closeDD(); });
function dropdown(el, { label = '', options, value, onChange }) {
  const cur = options.find((o) => o.value === value);
  let lastGroup = null;
  el.classList.add('dd');
  el.innerHTML = `<button class="dd-btn" type="button" aria-haspopup="listbox">${label ? `<span class="dd-k">${esc(label)}</span>` : ''}<span class="dd-v">${esc(cur ? cur.label : '…')}</span>${icon('chevron', 18)}</button>
    <div class="dd-menu" role="listbox">${options.map((o) => {
      const g = o.group && o.group !== lastGroup ? `<div class="dd-group">${esc(o.group)}</div>` : '';
      lastGroup = o.group || lastGroup;
      return `${g}<button type="button" role="option" class="dd-opt ${o.value === value ? 'on' : ''}" data-v="${esc(o.value)}"><span>${esc(o.label)}${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</span>${o.value === value ? icon('check', 18) : ''}</button>`;
    }).join('')}</div>`;
  $('.dd-btn', el).onclick = (e) => {
    e.stopPropagation();
    const wasOpen = el.classList.contains('open');
    closeDD();
    if (!wasOpen) {
      el.classList.add('open'); openDD = el;
      const menu = $('.dd-menu', el);
      const r = el.getBoundingClientRect();
      menu.classList.toggle('up', r.top > innerHeight * 0.62);
      menu.classList.toggle('right', r.left > innerWidth * 0.5);
      const on = $('.dd-opt.on', menu); if (on) menu.scrollTop = on.offsetTop - 60;
    }
  };
  $('.dd-menu', el).onclick = (e) => {
    const b = e.target.closest('.dd-opt'); if (!b) return;
    e.stopPropagation();
    closeDD();
    const v = options.find((o) => String(o.value) === b.dataset.v).value;
    dropdown(el, { label, options, value: v, onChange });
    onChange(v);
  };
}
const seg = (name, opts, value) => `<div class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${String(v) === String(value) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
const toggle = (name, label, checked) => `<label class="toggle"><input type="checkbox" data-set="${name}" ${checked ? 'checked' : ''}> ${label}</label>`;

// ---------- settings modal ----------
function openSettings() {
  openSheet(`<div class="settings">
    <div class="set-group"><h3>Appearance</h3>${seg('theme', [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], S.theme)}</div>
    <div class="set-group"><h3>Alphabet</h3>${toggle('dotNums', 'Show dot numbers', S.dotNums)}${toggle('hideLetters', 'Hide letters (test yourself)', S.hideLetters)}</div>
    <div class="set-group"><h3>Sweep</h3>
      <div class="set-row"><span>Braille</span>${seg('swGrade', [[1, 'Grade 1'], [2, 'Grade 2']], S.swGrade)}</div>
      <div class="set-row"><span>Letters</span>${seg('swLabels', [['show', 'Shown'], ['after', 'After'], ['hidden', 'Hidden']], S.swLabels)}</div>
      <div class="set-row"><span>Cell size</span>${seg('swSize', [['large', 'Large'], ['real', 'Real size']], S.swSize)}</div>
      <div class="set-row"><span>Glide speed</span><input type="range" data-range="swSpeed" min="0.4" max="2" step="0.1" value="${S.swSpeed}"></div>
      ${toggle('swSound', 'Dot clicks', S.swSound)}
      ${canVibrate ? toggle('swVibe', 'Vibrate on dots', S.swVibe) : ''}
      ${canSpeak ? toggle('swSpeak', 'Say letters aloud', S.swSpeak) : ''}
    </div>
    <div class="set-group"><h3>Signs</h3>${toggle('signsHide', 'Hide print until tapped', S.signsHide)}</div>
    <div class="set-group"><h3>Translate</h3>${toggle('trLabels', 'Print labels under cells', S.trLabels)}${toggle('trLarge', 'Large cells', S.trLarge)}</div>
    <div class="set-group"><h3>Practice</h3><button class="btn" id="resetAll">Reset practice progress</button></div>
    <div class="set-group about"><h3>About Dots</h3><p>A personal braille learning site. Braille follows Unified English Braille unless noted. Made for learning — for official transcription, consult a certified braille transcriber.</p></div>
  </div>`, { title: 'Settings' });
  $$('[data-seg]', sheet).forEach((g) => g.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', g).forEach((x) => x.classList.toggle('on', x === b));
    const k = g.dataset.seg; setS(k, typeof DEFAULTS[k] === 'number' ? Number(b.dataset.v) : b.dataset.v);
  }));
  $$('[data-set]', sheet).forEach((i) => { i.onchange = () => setS(i.dataset.set, i.checked); });
  $$('[data-range]', sheet).forEach((i) => { i.oninput = () => setS(i.dataset.range, Number(i.value)); });
  let armed = false;
  $('#resetAll').onclick = (e) => {
    if (!armed) { armed = true; e.target.textContent = 'Tap again to confirm'; return; }
    store.set('mastery', {}); e.target.textContent = 'Progress reset ✓'; window.dispatchEvent(new CustomEvent('settings', { detail: 'mastery' }));
  };
}

// ---------- letter + symbol details ----------
const WORDSIGN_OF = Object.fromEntries(CONTRACTIONS['Alphabetic wordsigns'].items.map(([w, d]) => [fromDots(d), w]));
const DIGIT_OF = Object.fromEntries('abcdefghij'.split('').map((l, i) => [l, String((i + 1) % 10)]));
const mirror = (cell) => fromDots(toDots(cell).map((d) => (d <= 3 ? d + 3 : d - 3)).join(''));
const LETTER_OF = Object.fromEntries(Object.entries(LETTERS).map(([l, c]) => [c, l]));
const mirrorLetter = (l) => { const m = LETTER_OF[mirror(LETTERS[l])]; return m && m !== l ? m : null; };

function letterDetail(l) {
  const c = LETTERS[l];
  const idx = 'abcdefghijklmnopqrstuvwxyz'.indexOf(l);
  let row;
  if (idx < 10) row = 'First row (a–j): only the top four dots — 1, 2, 4, 5. Every other row is built from this one.';
  else if (idx < 20) row = `Second row (k–t): ${'abcdefghij'[idx - 10]} plus dot 3.`;
  else if (l === 'w') row = 'W is the odd one out: French had no w when braille was invented, so it was added later. It’s j plus dot 6.';
  else row = `Third row: ${'abcdefghij'['uvxyz'.indexOf(l)]} plus dots 3 and 6.`;
  const m = mirrorLetter(l);
  return `<div class="detail">
    <div class="detail-top">${cellHTML(c, 'xl numbered')}<div><div class="big">${l}</div><div class="muted">${dotsLabel(c)}</div></div></div>
    <p>${row}</p>
    <dl>
      ${DIGIT_OF[l] ? `<dt>As a number</dt><dd>After ${cellHTML(IND.number, 'sm')} it means <b>${DIGIT_OF[l]}</b></dd>` : ''}
      ${WORDSIGN_OF[c] ? `<dt>Grade 2</dt><dd>Alone, it means <b>“${WORDSIGN_OF[c]}”</b></dd>` : ''}
      <dt>Capital</dt><dd>${cellHTML(IND.capital, 'sm')}${cellHTML(c, 'sm')} = ${l.toUpperCase()}</dd>
      ${m ? `<dt>Don’t confuse</dt><dd>${cellHTML(LETTERS[m], 'sm')} <b>${m}</b> is its mirror image</dd>` : ''}
    </dl>
    <div class="row"><a class="btn primary" href="#/practice/read?set=${idx < 10 ? 'aj' : idx < 20 ? 'kt' : 'uz'}">Practise this row</a><a class="btn" href="#/practice/sweep?src=alphabet">Sweep the alphabet</a></div>
  </div>`;
}
function symbolDetail(e) {
  const cells = [...e.cells];
  return `<div class="detail">
    <div class="detail-top"><div class="row" style="gap:6px">${cells.map((c) => cellHTML(c, cells.length > 2 ? 'lg numbered' : 'xl numbered')).join('')}</div></div>
    <h2>${esc(e.print)}</h2>
    <dl>
      <dt>Type</dt><dd>${esc(e.cat)}</dd>
      <dt>Dots</dt><dd>${cells.map((c) => toDots(c).join('') || '—').join(' · ')}</dd>
      ${e.note ? `<dt>Note</dt><dd>${esc(e.note)}</dd>` : ''}
      ${e.blurb ? `<dt>Rule</dt><dd>${esc(e.blurb)}</dd>` : ''}
    </dl>
  </div>`;
}

// ---------- dictionary ----------
const DICT = [];
for (const l of 'abcdefghijklmnopqrstuvwxyz') DICT.push({ print: l, cells: LETTERS[l], cat: 'Letter', group: 'Letters' });
for (const d of '1234567890') DICT.push({ print: d, cells: IND.number + LETTERS['jabcdefghi'[Number(d)]], cat: 'Number', group: 'Numbers' });
const seenP = new Set();
for (const [p, v] of Object.entries(UEB_PUNCT)) {
  if (!v || seenP.has(v[1])) continue; seenP.add(v[1]);
  DICT.push({ print: p, cells: v[0], cat: 'Punctuation & symbols', note: v[1], group: 'Punctuation' });
}
DICT.push({ print: '“ ”', cells: fromDots('236') + fromDots('356'), cat: 'Punctuation & symbols', note: 'open and close quotes', group: 'Punctuation' });
const INDICATORS = [
  ['capital letter', '6', 'Next letter is a capital.'], ['capital word', '6 6', 'The whole next word is in capitals.'],
  ['capital passage', '6 6 6', 'Three or more words in capitals, ended by the terminator.'], ['capitals terminator', '6 3', 'Ends a capital word or passage.'],
  ['number sign', '3456', 'Letters a–j that follow are digits 1–0.'], ['grade 1 symbol', '56', 'Read the next cell as a plain letter, not a contraction.'],
  ['grade 1 word', '56 56', 'Read the next word uncontracted.'], ['grade 1 passage', '56 56 56', 'Uncontracted passage.'],
  ['italic', '46 23', 'Italic symbol (italic word: 46 2).'], ['bold', '45 23', 'Bold symbol.'],
];
for (const [p, d, n] of INDICATORS) DICT.push({ print: p, cells: cellsOf(d), cat: 'Indicator', note: n, group: 'Indicators' });
for (const [cat, { blurb, items }] of Object.entries(CONTRACTIONS)) for (const [p, d, n] of items) DICT.push({ print: p, cells: cellsOf(d), cat, note: n || '', blurb, group: cat });
const symHTML = (e, i) => `<button class="sym" data-i="${i}"><span class="cells">${[...e.cells].map((c) => cellHTML(c)).join('')}</span><b>${esc(e.print)}</b>${e.note && e.note.length < 26 ? `<small>${esc(e.note)}</small>` : ''}</button>`;
const groupBlock = (g, title, blurb) => `<div class="group-title"><h3>${title}</h3>${blurb ? `<span>${esc(blurb)}</span>` : ''}</div><div class="sym-grid">${DICT.map((e, i) => [e, i]).filter(([e]) => e.group === g).map(([e, i]) => symHTML(e, i)).join('')}</div>`;

const view = $('#view');
const views = {};
const mastery = () => store.get('mastery', {});
// 0 untried, 1 pale blue, 2 mid blue, 3 dark blue, 4+ known (green)
const level = (score) => Math.min(4, score);

// ---------- home ----------
views[''] = () => {
  const m = mastery();
  const known = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((l) => (m[l] || 0) >= 4).length;
  const mini = (s, cls = 'sm') => `<span class="mrow">${cellsHTML(s, cls)}</span>`;
  const tile = (href, title, desc, art, cls = '') => `<a class="tile ${cls}" href="${href}"><div class="art">${art}</div><div class="tile-text"><b>${title}</b><span>${desc}</span></div></a>`;
  view.innerHTML = `
    <div class="home-head">
      <div>
        <h1>Learn braille</h1>
        <p class="muted">Six dots, one fingertip. Start with the alphabet, then read the world around you.</p>
      </div>
      <a class="progress-card" href="#/practice/read?set=az">
        <div class="pbar"><i style="width:${(known / 26) * 100}%"></i></div>
        <span><b>${known}</b> of 26 letters known</span>
      </a>
    </div>

    <h2 class="tile-h">${icon('practice', 20)} Practice</h2>
    <div class="tiles">
      ${tile('#/practice/read', 'Read', 'Name the letter', `<div class="art-read">${cellHTML(LETTERS.h, 'md')}<div class="opts"><span>e</span><span class="ok">h</span><span>j</span></div></div>`)}
      ${tile('#/practice/write', 'Write', 'Tap the dots', `<div class="art-write">${[1, 1, 0, 0, 1, 0].map((o) => `<i class="${o ? 'on' : ''}"></i>`).join('')}</div>`)}
      ${tile('#/practice/words', 'Words', 'Decode whole words', `<div class="art-words"><div>${mini(unicodeOf(translate('cozy', 'en', 1)))}</div><span class="caret">cozy</span></div>`)}
      ${tile('#/practice/sweep', 'Sweep', 'Glide a finger along a line', `<div class="art-sweep"><div class="row-cells">${mini(unicodeOf(translate('read', 'en', 1)))}</div><span class="line"></span><span class="ring"></span></div>`)}
    </div>

    <h2 class="tile-h">${icon('book', 20)} Reference</h2>
    <div class="tiles">
      ${tile('#/reference/alphabet', 'Alphabet', 'a–z in three simple rows', `<div class="art-alpha">${mini('⠁⠃⠉⠙⠑', 'xs2')}<br>${mini('⠅⠇⠍⠝⠕', 'xs2')}<br>${mini('⠥⠧⠭⠽⠵', 'xs2')}</div>`)}
      ${tile('#/reference/grade2', 'Grade 2', 'Contractions like “the”', `<div class="art-g2"><span>${cellHTML('⠮', 'md')}<b>the</b></span><span>${cellHTML('⠯', 'md')}<b>and</b></span></div>`)}
      ${tile('#/reference/signs', 'Signs', 'Read real-world signage', `<div class="art-sign"><div class="mini-plate"><b>EXIT</b>${mini(unicodeOf(translate('Exit', 'en', 2)), 'xs')}</div></div>`)}
      ${tile('#/reference/numbers', 'Numbers & symbols', 'Digits, punctuation, capitals', `<div class="art-g2"><span>${mini('⠼⠃', 'md')}<b>2</b></span><span>${cellHTML('⠦', 'md')}<b>?</b></span></div>`)}
      ${tile('#/reference/languages', 'Languages', 'French, Spanish & more', `<div class="art-g2"><span>${cellHTML('⠿', 'md')}<b>é</b></span><span>${cellHTML('⠻', 'md')}<b>ñ</b></span></div>`)}
      ${tile('#/reference/science', 'Maths & more', 'Science, world systems, history', `<div class="art-g2"><span>${mini('⠐⠖', 'md')}<b>+</b></span><span>${mini('⠐⠶', 'md')}<b>=</b></span></div>`)}
    </div>

    <h2 class="tile-h">${icon('translate', 20)} Translate</h2>
    <div class="tiles one">
      ${tile('#/translate', 'Type anything', 'See it in braille — English Grade 1 or 2 and five other languages', `<div class="art-tr"><span class="tr-word">Hi!</span>${icon('arrow', 20)}${mini(unicodeOf(translate('Hi!', 'en', 1)))}</div>`, 'wide')}
    </div>`;
};

// ---------- practice ----------
const PRACTICE_SETS = {
  aj: { name: 'Letters a–j', group: 'Letters', items: () => 'abcdefghij'.split('').map((l) => ({ key: l, cells: LETTERS[l], answer: l })) },
  kt: { name: 'Letters k–t', group: 'Letters', items: () => 'klmnopqrst'.split('').map((l) => ({ key: l, cells: LETTERS[l], answer: l })) },
  uz: { name: 'Letters u–z', group: 'Letters', items: () => 'uvwxyz'.split('').map((l) => ({ key: l, cells: LETTERS[l], answer: l })) },
  az: { name: 'All letters', group: 'Letters', items: () => 'abcdefghijklmnopqrstuvwxyz'.split('').map((l) => ({ key: l, cells: LETTERS[l], answer: l })) },
  num: { name: 'Numbers', group: 'More', items: () => '1234567890'.split('').map((d) => ({ key: 'n' + d, cells: IND.number + LETTERS['jabcdefghi'[Number(d)]], answer: d, writeCell: LETTERS['jabcdefghi'[Number(d)]] })) },
  punct: { name: 'Punctuation', group: 'More', items: () => [',', ';', ':', '.', '!', '?', "'", '-'].map((p) => ({ key: 'p' + p, cells: UEB_PUNCT[p][0], answer: p, label: UEB_PUNCT[p][1] })) },
  g2: { name: 'Contractions', group: 'More', items: () => [...CONTRACTIONS['Strong contractions'].items, ...CONTRACTIONS['Strong groupsigns'].items, ...CONTRACTIONS['Alphabetic wordsigns'].items.slice(0, 12)].map(([w, d]) => ({ key: 'c' + w, cells: cellsOf(d), answer: w })) },
};
const WORD_SETS = {
  simple: { name: 'Simple words', grade: 1, list: WORDS },
  signs: { name: 'Sign words', hint: 'Grade 2', grade: 2, list: SIGN_WORDS.map((w) => w.toLowerCase()) },
  g2: { name: 'Contracted words', hint: 'Grade 2', grade: 2, list: ['the', 'and', 'with', 'for', 'children', 'knowledge', 'people', 'there', 'father', 'mother', 'station', 'thing', 'shower', 'river', 'beach', 'information', 'kindness', 'house', 'light', 'stone'] },
};
const SWEEP_SRC = { alphabet: 'Alphabet', words: 'Words', sentences: 'Sentences', signs: 'Sign words', custom: 'Your own text' };
const HELP = {
  read: ['Read', 'A cell appears — pick the letter it stands for. On a keyboard, type the answer or press 1–4.', 'Your progress shows under the card: letters go from pale blue to dark blue as you get them right, and turn green once you know them. Ones you miss come up more often.'],
  write: ['Write', 'Tap the dots that make the letter, then Check.', 'On a keyboard use F D S for dots 1 2 3 and J K L for dots 4 5 6 — the same fingers as a Perkins brailler — and Enter to check.'],
  words: ['Words', 'Decode the whole word and type it. Hint reveals one cell at a time.', 'Grade 2 sets use contractions; see Reference → Grade 2 if one is new to you.'],
  sweep: ['Sweep', 'Put your finger on the line and slide right. The cell directly under your finger is the one you’re reading; it appears in the bubble above so your finger never hides it.', 'Each raised dot clicks as you cross it — high for the top row, low for the bottom — and vibrates on Android. Hold your finger in the shaded right edge and the line keeps scrolling under it. On a laptop, just move the mouse across, or use the arrow keys.', 'The buttons: ▶ glides the line automatically, ↺ starts over, and the shuffle button loads a new line. Grade, letter visibility, real-size cells, sounds and speed are in Settings.'],
};

views.practice = (q, sub) => {
  const mode = ['read', 'write', 'words', 'sweep'].includes(sub) ? sub : store.get('pmode', 'read');
  store.set('pmode', mode);
  view.innerHTML = `
    <div class="practice-wrap mode-${mode}">
      <div class="page-head">
        <div class="seg seg-wide" id="modeSeg">${['read', 'write', 'words', 'sweep'].map((m) => `<a href="#/practice/${m}" class="${m === mode ? 'on' : ''}">${HELP[m][0]}</a>`).join('')}</div>
        <button class="icon-btn" id="helpBtn" aria-label="How this works">${icon('help')}</button>
      </div>
      <div class="sub-head" id="subHead"></div>
      <div id="modeBody"></div>
    </div>`;
  $('#helpBtn').onclick = () => openSheet(HELP[mode].slice(1).map((p) => `<p>${esc(p)}</p>`).join(''), { title: HELP[mode][0] });
  return mode === 'sweep' ? sweepMode(q) : quizMode(mode, q);
};

function quizMode(mode, q) {
  const state = { set: q.get('set') || store.get('pset', 'aj'), wset: store.get('pwset', 'simple'), streak: 0, right: 0, total: 0, last: null, firstTry: true };
  if (!PRACTICE_SETS[state.set]) state.set = 'aj';
  const m = mastery();
  const subHead = $('#subHead'), body = $('#modeBody');
  body.innerHTML = `<div class="card stage" id="stage"></div>
    <div class="below-stage">
      <div class="stats"><span>Streak <b id="sStreak">0</b></span><span>Correct <b id="sRight">0</b>/<b id="sTotal">0</b></span></div>
      <div class="mastery" id="mastery"></div>
    </div>`;
  const stage = $('#stage');
  const items = () => {
    let it = PRACTICE_SETS[state.set].items();
    if (mode === 'write') it = it.filter((x) => (x.writeCell || x.cells).length === 1);
    return it;
  };
  const score = (k) => m[k] || 0;
  const bump = (k, d) => { m[k] = Math.max(0, Math.min(5, score(k) + d)); store.set('mastery', m); };

  subHead.innerHTML = '<div id="setDD"></div><span class="legend" title="Learning → known"><i data-l="1"></i><i data-l="2"></i><i data-l="3"></i><i data-l="4"></i><small>known</small></span>';
  if (mode === 'words') {
    dropdown($('#setDD'), { options: Object.entries(WORD_SETS).map(([k, s]) => ({ value: k, label: s.name, hint: s.hint })), value: state.wset, onChange: (v) => { state.wset = v; store.set('pwset', v); next(); } });
    $('.legend', subHead).remove();
  } else {
    dropdown($('#setDD'), { options: Object.entries(PRACTICE_SETS).map(([k, s]) => ({ value: k, label: s.name, group: s.group })), value: state.set, onChange: (v) => { state.set = v; store.set('pset', v); state.last = null; renderMastery(); next(); } });
  }
  function renderMastery() {
    const el = $('#mastery');
    if (mode === 'words') { el.innerHTML = ''; return; }
    el.innerHTML = items().map((x) => `<span data-l="${level(score(x.key))}" title="${esc(x.answer)}">${esc(x.answer.length > 3 ? x.answer.slice(0, 3) : x.answer)}</span>`).join('');
  }
  function nextItem() {
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
      state.total++;
      if (ok) { state.right++; state.streak++; } else state.streak = 0;
      if (item.key) bump(item.key, ok ? 1 : -1);
    }
    state.firstTry = false;
    $('#sStreak').textContent = state.streak; $('#sRight').textContent = state.right; $('#sTotal').textContent = state.total;
    renderMastery();
  }
  // The top line is the prompt until the first guess, then becomes feedback.
  const say = (text, cls = '') => { const t = $('#top', stage); t.className = 'stage-top ' + cls; t.textContent = text; };

  function renderRead() {
    const item = nextItem(); state.last = item; state.firstTry = true;
    const opts = shuffle([item, ...shuffle(items().filter((x) => x.key !== item.key)).slice(0, 3)]);
    stage.innerHTML = `
      <div class="stage-top" id="top">What does this say?</div>
      <div class="prompt-cells">${[...item.cells].map((c) => cellHTML(c)).join('')}</div>
      <div class="choices ${opts.some((o) => o.answer.length > 2) ? 'words' : ''}">${opts.map((o) => `<button class="choice" data-k="${esc(o.key)}">${esc(o.answer)}${o.label ? `<small>${esc(o.label)}</small>` : ''}</button>`).join('')}</div>`;
    const choose = (btn) => {
      if (!btn || btn.classList.contains('right') || btn.classList.contains('wrong')) return;
      const ok = btn.dataset.k === item.key;
      result(ok, item);
      btn.classList.add(ok ? 'right' : 'wrong');
      if (ok) { say(pick(['Yes!', 'Nice.', 'Exactly.', 'You’ve got it.']), 'good'); setTimeout(next, 650); return; }
      const picked = opts.find((o) => o.key === btn.dataset.k);
      const isMirror = picked.cells.length === 1 && item.cells.length === 1 && mirror(picked.cells) === item.cells;
      say(isMirror ? `${picked.answer} is the mirror image — check the columns.` : `That’s ${picked.answer}. Try again.`, 'bad');
    };
    stage.onclick = (e) => choose(e.target.closest('.choice'));
    state.key = (e) => {
      const btns = $$('.choice', stage);
      if (/^[1-4]$/.test(e.key) && state.set !== 'num') return choose(btns[Number(e.key) - 1]);
      const o = opts.find((x) => x.answer === e.key.toLowerCase());
      if (o) choose(btns.find((b) => b.dataset.k === o.key));
    };
  }

  function renderWrite() {
    const item = nextItem(); state.last = item; state.firstTry = true;
    const target = item.writeCell || item.cells;
    const want = new Set(toDots(target));
    const on = new Set();
    stage.innerHTML = `
      <div class="stage-top" id="top">${state.set === 'num' ? 'Make this digit (after the number sign)' : 'Make this'}</div>
      <div class="target">${esc(item.answer)}</div>
      <div class="dotpad" id="pad">${[1, 2, 3, 4, 5, 6].map((d) => `<button data-d="${d}" aria-label="dot ${d}">${d}</button>`).join('')}</div>
      <div class="row"><button class="btn primary" id="check">Check</button><button class="btn ghost" id="skip">Show me</button></div>`;
    const pad = $('#pad');
    const tog = (d) => { on.has(d) ? on.delete(d) : on.add(d); $(`[data-d="${d}"]`, pad).classList.toggle('on', on.has(d)); pad.classList.remove('wrong'); };
    pad.onclick = (e) => { const b = e.target.closest('button'); if (b) tog(Number(b.dataset.d)); };
    const check = () => {
      const ok = on.size === want.size && [...want].every((d) => on.has(d));
      result(ok, item);
      if (ok) { pad.classList.add('right'); say(`Yes — ${dotsLabel(target)}.`, 'good'); setTimeout(next, 800); }
      else { pad.classList.add('wrong'); say('Not quite. Adjust and check again.', 'bad'); }
    };
    $('#check').onclick = check;
    $('#skip').onclick = () => {
      if (state.firstTry) result(false, item);
      [1, 2, 3, 4, 5, 6].forEach((d) => { if (want.has(d) !== on.has(d)) tog(d); });
      say(`${item.answer} is ${dotsLabel(target)}.`);
    };
    const KEYS = { f: 1, d: 2, s: 3, j: 4, k: 5, l: 6 };
    state.key = (e) => {
      if (KEYS[e.key.toLowerCase()]) tog(KEYS[e.key.toLowerCase()]);
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); check(); }
    };
  }

  function renderWords() {
    const ws = WORD_SETS[state.wset];
    let word = pick(ws.list);
    if (state.last === word) word = pick(ws.list);
    state.last = word; state.firstTry = true;
    const cells = toCells(translate(word, 'en', ws.grade));
    let shown = 0;
    stage.innerHTML = `
      <div class="stage-top" id="top">Decode this word</div>
      <div class="prompt-cells ${cells.length > 6 ? 'many' : ''}" id="wcells">${cells.map((c) => `<span class="bw">${cellHTML(c.cell)}<span class="lbl"></span></span>`).join('')}</div>
      <input class="answer-input" id="ans" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="type it">
      <div class="row"><button class="btn primary" id="check">Check</button><button class="btn ghost" id="hint">Hint</button><button class="btn ghost" id="skip">Skip</button></div>`;
    const ans = $('#ans');
    if (matchMedia('(pointer: fine)').matches) ans.focus();
    const lbls = $$('#wcells .lbl');
    const reveal = (n) => cells.slice(0, n).forEach((c, i) => { lbls[i].textContent = c.idx === 0 ? c.print || '·' : ''; });
    const check = () => {
      const ok = ans.value.trim().toLowerCase() === word;
      result(ok, {});
      if (ok) { say('Yes!', 'good'); reveal(cells.length); setTimeout(next, 900); } else say('Not quite — try a hint.', 'bad');
    };
    $('#check').onclick = check;
    ans.onkeydown = (e) => { if (e.key === 'Enter') check(); };
    $('#hint').onclick = () => { state.firstTry = false; shown = Math.min(cells.length, shown + 1); reveal(shown); };
    $('#skip').onclick = () => { reveal(cells.length); say(`It was “${word}”.`); setTimeout(next, 1400); };
    state.key = null;
  }
  function next() { ({ read: renderRead, write: renderWrite, words: renderWords })[mode](); }
  const onKey = (e) => { if (e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey || !sheet.hidden) return; state.key && state.key(e); };
  const onSet = (e) => { if (e.detail === 'mastery') { Object.keys(m).forEach((k) => delete m[k]); renderMastery(); } };
  document.addEventListener('keydown', onKey);
  window.addEventListener('settings', onSet);
  renderMastery(); next();
  return () => { document.removeEventListener('keydown', onKey); window.removeEventListener('settings', onSet); };
}

// ---------- sweep ----------
let audioCtx = null;
function tick(row, when = 0) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime + when;
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.value = [880, 660, 495][row];
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + 0.07);
  } catch {}
}

function sweepMode(q) {
  let src = q.get('src') || store.get('swSrc', 'words');
  if (!SWEEP_SRC[src]) src = 'words';
  let custom = store.get('swCustom', 'Welcome to Ontario');
  $('#subHead').innerHTML = `<div id="srcDD"></div>
    <div class="icon-row">
      <button class="icon-btn" id="editBtn" aria-label="Edit text">${icon('edit')}</button>
      <button class="icon-btn" id="shuffleBtn" aria-label="New line">${icon('shuffle')}</button>
      <button class="icon-btn" id="restart" aria-label="Start over">${icon('restart')}</button>
      <button class="icon-btn accent" id="glide" aria-label="Auto-glide">${icon('play')}</button>
    </div>`;
  $('#modeBody').innerHTML = `
    <div class="sweep-box" id="box" tabindex="0" aria-label="Braille line. Arrow keys move cell by cell.">
      <div class="edge left"></div><div class="edge right"></div>
      <div class="sweep-track" id="track"></div>
      <div class="reader" id="reader"></div>
      <div class="loupe" id="loupe"></div>
      <div class="finger" id="finger"></div>
      <div class="word-reveal" id="wordReveal"></div>
      <div class="sweep-hint" id="hint">put your finger on the line and slide right</div>
    </div>`;
  const box = $('#box'), track = $('#track'), loupe = $('#loupe'), finger = $('#finger'), reader = $('#reader');
  let cells = [], lefts = [], widths = [], totalW = 0, offset = 0, headX = 0, W = 0;
  let lastKey = '', curIdx = -1, glideOn = false, raf = 0, edgeRaf = 0, active = false;

  const textFor = () => {
    if (src === 'alphabet') return 'abcdefghijklmnopqrstuvwxyz'.split('').join(' ');
    if (src === 'words') return shuffle(WORDS).slice(0, 8).join(' ');
    if (src === 'sentences') return pick(SENTENCES);
    if (src === 'signs') return shuffle(SIGN_WORDS).slice(0, 6).join(' ');
    return custom;
  };
  let text = textFor();
  const syncHead = () => {
    dropdown($('#srcDD'), { options: Object.entries(SWEEP_SRC).map(([k, v]) => ({ value: k, label: v })), value: src, onChange: (v) => { src = v; store.set('swSrc', v); syncHead(); if (v === 'custom') { text = custom; build(); editText(); } else { text = textFor(); build(); } } });
    $('#editBtn').hidden = src !== 'custom';
    $('#shuffleBtn').hidden = !['words', 'sentences', 'signs'].includes(src);
  };
  function editText() {
    openSheet(`<textarea class="tr-input" id="swText" maxlength="200">${esc(custom)}</textarea><div class="row" style="margin-top:12px"><button class="btn primary" id="swLoad">Read this</button></div>`, { title: 'Your text' });
    $('#swText').focus();
    $('#swLoad').onclick = () => { custom = $('#swText').value.trim() || custom; store.set('swCustom', custom); text = custom; closeSheet(); build(); };
  }

  function build() {
    const grade = src === 'signs' ? 2 : S.swGrade;
    cells = toCells(translate(text, 'en', grade)).filter((c) => c.kind !== 'newline');
    track.innerHTML = cells.map((c, i) => c.kind === 'space'
      ? `<div class="sc space" data-i="${i}"></div>`
      : `<div class="sc kind-${c.kind}" data-i="${i}">${cellHTML(c.cell)}<span class="lbl">${esc(c.idx === 0 ? (c.print || '·') : '')}</span></div>`).join('');
    requestAnimationFrame(() => { measure(); reset(); });
  }
  function measure() {
    const els = $$('.sc', track);
    lefts = els.map((e) => e.offsetLeft); widths = els.map((e) => e.offsetWidth);
    totalW = track.scrollWidth; W = box.clientWidth;
  }
  const startOffset = () => Math.round(W * 0.16);
  function reset() { offset = startOffset(); headX = Math.round(W * 0.1); lastKey = ''; curIdx = -1; $('#wordReveal').textContent = ''; update(false); }
  const clamp = () => { offset = Math.max(Math.min(startOffset(), W * 0.5 - totalW), Math.min(startOffset(), offset)); };
  const wordAround = (i) => { let a = i, b = i; while (a > 0 && cells[a - 1].kind !== 'space') a--; while (b < cells.length - 1 && cells[b + 1].kind !== 'space') b++; return [a, b]; };
  const speak = (t) => { if (!S.swSpeak || !canSpeak || !t) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.rate = 1.1; u.lang = 'en-CA'; speechSynthesis.speak(u); } catch {} };

  function update(feedback = true) {
    clamp();
    track.style.transform = `translateX(${offset}px)`;
    reader.style.left = headX + 'px'; finger.style.left = headX + 'px';
    loupe.style.left = Math.max(80, Math.min(W - 80, headX)) + 'px';
    box.classList.toggle('active', active || glideOn);
    const pos = headX - offset;
    let idx = -1;
    for (let i = 0; i < cells.length; i++) if (pos >= lefts[i] && pos < lefts[i] + widths[i]) { idx = i; break; }
    $$('.sc', track).forEach((el, i) => el.classList.toggle('passed', lefts[i] + widths[i] < pos));
    if (idx !== curIdx) {
      $$('.sc.cur', track).forEach((e) => e.classList.remove('cur'));
      if (idx >= 0 && cells[idx].kind !== 'space') {
        track.children[idx].classList.add('cur');
        if (feedback && cells[idx].idx === 0 && cells[idx].kind !== 'indicator') speak(cells[idx].print);
      }
      const finished = curIdx >= 0 && cells[curIdx].kind !== 'space' && ((idx > curIdx && (!cells[idx] || cells[idx].kind === 'space')) || (idx === -1 && pos > totalW));
      if (finished) { const [a, b] = wordAround(curIdx); $('#wordReveal').textContent = cells.slice(a, b + 1).map((c) => (c.idx === 0 ? c.print : '')).join(''); }
      if (idx !== -1 || pos > totalW) curIdx = idx;
    }
    const c = cells[idx];
    if (c && c.kind !== 'space') {
      loupe.style.display = '';
      const g = c.group;
      const kind = c.kind === 'indicator' ? (c.note || 'indicator') : c.kind === 'contraction' ? (g.note === 'groupsign' ? 'groupsign' : 'contraction') : c.kind === 'digit' ? 'digit' : c.kind === 'punct' ? (c.note || 'punctuation') : dotsLabel(c.cell);
      loupe.innerHTML = `${cellHTML(c.cell, 'numbered')}<div class="lp"><b>${esc(g.print || '·')}</b><span>${esc(kind)}${c.span > 1 ? ` · ${c.idx + 1}/${c.span}` : ''}</span></div>`;
      loupe.classList.toggle('hidden-print', S.swLabels !== 'show');
      if (feedback) {
        const col = (pos - lefts[idx]) / widths[idx] < 0.5 ? 0 : 1;
        const key = idx + ':' + col;
        if (key !== lastKey) {
          lastKey = key;
          const dots = toDots(c.cell).filter((d) => (col === 0 ? d <= 3 : d >= 4 && d <= 6));
          if (S.swSound) dots.forEach((d, k) => tick((d - 1) % 3, k * 0.025));
          if (S.swVibe && canVibrate && dots.length) { const pat = []; dots.forEach(() => pat.push(14, 18)); try { navigator.vibrate(pat); } catch {} }
        }
      }
    } else { loupe.style.display = 'none'; if (!c) lastKey = ''; }
  }
  const EDGE = () => Math.min(90, W * 0.18);
  function edgeLoop() {
    cancelAnimationFrame(edgeRaf);
    let prev = performance.now();
    const step = (t) => {
      const dt = Math.min(50, t - prev) / 1000; prev = t;
      if (!active) return;
      const e = EDGE();
      let v = 0;
      if (headX > W - e) v = -((headX - (W - e)) / e); else if (headX < e) v = (e - headX) / e;
      if (v) { offset += v * 260 * dt; update(); }
      edgeRaf = requestAnimationFrame(step);
    };
    edgeRaf = requestAnimationFrame(step);
  }
  const boxX = (e) => e.clientX - box.getBoundingClientRect().left;
  box.addEventListener('pointerdown', (e) => { stopGlide(); active = true; box.setPointerCapture(e.pointerId); headX = boxX(e); $('#hint').style.opacity = 0; update(); edgeLoop(); });
  box.addEventListener('pointermove', (e) => {
    const touchLike = e.pointerType !== 'mouse';
    if (touchLike && !box.hasPointerCapture(e.pointerId)) return;
    if (!touchLike && glideOn) return;
    if (!active && !touchLike) { active = true; edgeLoop(); $('#hint').style.opacity = 0; }
    headX = Math.max(0, Math.min(W, boxX(e))); update();
  });
  const end = (e) => { if (e.pointerType !== 'mouse' || e.type === 'pointerleave') { active = false; update(false); } };
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end); box.addEventListener('pointerleave', end);
  box.addEventListener('wheel', (e) => { e.preventDefault(); offset -= (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.6; update(false); }, { passive: false });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      let i = Math.max(0, curIdx) + dir;
      while (cells[i] && cells[i].kind === 'space') i += dir;
      if (cells[i]) animateTo(headX - (lefts[i] + widths[i] * 0.3));
    } else if (e.key === ' ') { e.preventDefault(); glideOn ? stopGlide() : startGlide(); }
  });
  function animateTo(target) {
    stopGlide();
    const start = offset, t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / 420); offset = start + (target - start) * (1 - Math.pow(1 - k, 3)); update(); if (k < 1) raf = requestAnimationFrame(step); };
    cancelAnimationFrame(raf); raf = requestAnimationFrame(step);
  }
  function startGlide() {
    glideOn = true; $('#glide').innerHTML = icon('pause');
    if (headX < W * 0.2 || headX > W * 0.8) headX = Math.round(W * 0.35);
    $('#hint').style.opacity = 0;
    let prev = performance.now();
    const step = (t) => {
      if (!glideOn) return;
      const pitch = widths[0] ? widths[0] * 1.4 : 60;
      offset -= ((t - prev) / 1000) * pitch * S.swSpeed; prev = t; update();
      if (headX - offset > totalW + 10) { stopGlide(); return; }
      raf = requestAnimationFrame(step);
    };
    cancelAnimationFrame(raf); raf = requestAnimationFrame(step);
  }
  function stopGlide() { glideOn = false; const g = $('#glide'); if (g) g.innerHTML = icon('play'); }
  $('#glide').onclick = () => (glideOn ? stopGlide() : startGlide());
  $('#restart').onclick = () => { stopGlide(); headX = Math.round(W * 0.1); animateTo(startOffset()); $('#wordReveal').textContent = ''; };
  $('#shuffleBtn').onclick = () => { text = textFor(); build(); };
  $('#editBtn').onclick = editText;
  const onResize = () => { const p = headX - offset; measure(); headX = Math.min(headX, W); offset = headX - p; update(false); };
  const onSet = (e) => { if (['swGrade', 'swSize'].includes(e.detail)) build(); else update(false); };
  window.addEventListener('resize', onResize); window.addEventListener('settings', onSet);
  syncHead(); build();
  return () => { stopGlide(); active = false; cancelAnimationFrame(raf); cancelAnimationFrame(edgeRaf); window.removeEventListener('resize', onResize); window.removeEventListener('settings', onSet); try { speechSynthesis.cancel(); } catch {} };
}

// ---------- signs (inside reference) ----------
const SIGN_ICONS = {
  people: '<svg width="34" height="28" viewBox="0 0 30 24" fill="currentColor"><circle cx="8" cy="4.5" r="2.2"/><path d="M5.5 8h5l1 7h-2l-.4 7H7l-.4-7H4.5z"/><circle cx="22" cy="4.5" r="2.2"/><path d="M19.5 8h5l2.5 9h-3l-.3 5h-3l-.3-5h-3z"/></svg>',
  person: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="4.5" r="2.3"/><path d="M9 8h6l1 7h-2l-.5 7h-3L10 15H8z"/></svg>',
  exit: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4h5v16h-5"/><path d="M4 12h10m-4-4 4 4-4 4"/></svg>',
  stairs: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 20h5v-5h5v-5h5V5h3"/></svg>',
  elevator: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 3 4 9h8zM8 21l4-6H4z"/><rect x="14" y="3" width="7" height="18" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  info: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  fire: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/></svg>',
  door: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="3" width="12" height="18" rx="1"/><circle cx="15" cy="12" r=".8" fill="currentColor"/></svg>',
};
function signIcon(w) {
  w = w.toLowerCase();
  if (/wash|toilet|restroom/.test(w)) return SIGN_ICONS.people;
  if (/^men|women/.test(w)) return SIGN_ICONS.person;
  if (/exit|sortie|way out/.test(w)) return SIGN_ICONS.exit;
  if (/stair/.test(w)) return SIGN_ICONS.stairs;
  if (/elev|lift|ascen|main floor/.test(w)) return SIGN_ICONS.elevator;
  if (/info/.test(w)) return SIGN_ICONS.info;
  if (/fire|alarm/.test(w)) return SIGN_ICONS.fire;
  if (/room|office|platform/.test(w)) return SIGN_ICONS.door;
  return '';
}
function plateHTML(print, lang = 'en', grade = 2, extra = null, cls = '') {
  const tone = /exit|sortie|way out|fire/i.test(print) ? 'blue' : cls;
  return `<button class="plate ${tone}" aria-label="Sign: ${esc(print)}">
    <span class="pic">${signIcon(print)}</span>
    <span class="ptxt">${esc(print)}${extra ? `<br><span class="ptxt2">${esc(extra[0])}</span>` : ''}</span>
    ${lineHTML(translate(print, lang, grade))}
    ${extra ? lineHTML(translate(extra[0], extra[1], 1)) : ''}
  </button>`;
}
function signsSection(regionKey) {
  const region = SIGN_REGIONS[regionKey] ? regionKey : store.get('signRegion', 'ca');
  store.set('signRegion', region);
  const R = SIGN_REGIONS[region];
  const elevator = region === 'ca' || region === 'us';
  const parts = [];
  if (region === 'jp') parts.push(['sg-kana', 'Kana braille', `<p class="muted">${esc(JAPANESE.blurb)}</p>${JAPANESE.rows.map(([n, r]) => `<div class="group-title"><h3>${n}</h3></div><div class="sym-grid">${r.map(([p, c]) => `<div class="sym"><span class="cells">${cellHTML(c)}</span><b>${p}</b></div>`).join('')}</div>`).join('')}`]);
  else parts.push(['sg-read', 'Read these signs', `<div class="sign-gallery">${R.signs.map((s) => plateHTML(s, R.signLang || 'en', R.signLang ? 1 : 2)).join('')}${(R.bilingual || []).map(([en, fr]) => plateHTML(en, 'en', 2, [fr, 'fr'], 'light')).join('')}</div><p class="muted small">Tap a sign to see what each cell means.${R.signLang ? ' Shown in uncontracted French braille.' : ' Shown in UEB Grade 2, the way new signs are made.'}</p>`]);
  parts.push(['sg-how', 'How it works here', `<div class="facts">${R.facts.map(([t, p]) => `<div class="fact"><b>${esc(t)}</b><p>${esc(p)}</p></div>`).join('')}</div>`]);
  if (region !== 'jp') parts.push(['sg-anatomy', 'Anatomy of a room sign', `<div class="anatomy">${plateHTML('Room 101', 'en', 2)}<ol>
      <li>Raised capitals or a pictogram you can feel.</li>
      <li>Braille directly <b>below</b>, starting at the left.</li>
      <li>${cellHTML(IND.capital, 'sm')} capital sign, then the word — often contracted.</li>
      <li>${cellHTML(IND.number, 'sm')} number sign before the digits.</li>
      <li>Mounted on the handle side of the door, at about shoulder height.</li></ol></div>`]);
  if (elevator) parts.push(['sg-elevator', 'Elevator buttons', `<div class="elev-wrap"><div class="elevator">
      ${[['★', 'main'], ['3', '3'], ['2', '2'], ['1', '1'], ['◁▷', 'open'], ['▷◁', 'close'], ['bell', 'alarm']].map(([face, word]) => {
        const cs = unicodeOf(translate(word, 'en', 2)).replace(/ /g, '⠀');
        return `<span class="eb">${[...cs].map((c) => cellHTML(c)).join('')}</span><span class="ebtn">${face === 'bell' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zm-2 15a2 2 0 0 0 4 0z"/></svg>' : face}</span>`;
      }).join('')}
    </div><div class="elev-text">
      <p>Braille sits to the <b>left</b> of each button. Floors use the number sign: ${cellHTML(IND.number, 'sm')}${cellHTML(LETTERS.b, 'sm')} = 2.</p>
      <p>★ is the main floor, spelled <b>main</b>: ${cellsHTML(unicodeOf(translate('main', 'en', 2)), 'sm')} (m-a-<span class="acc">in</span>).</p>
      <p>“Open” is ${cellsHTML(unicodeOf(translate('open', 'en', 2)), 'sm')} (o-p-<span class="acc">en</span>); “alarm” uses <span class="acc">ar</span>: ${cellsHTML(unicodeOf(translate('alarm', 'en', 2)), 'sm')}.</p>
      <p class="muted small">Outside, the same numbers are on both sides of the door frame.</p></div></div>`]);
  if (region === 'ca') {
    parts.push(['sg-money', 'Feel your money', `<p class="muted">Canadian notes carry raised cell-shaped clusters in the top corner. Count them:</p><div class="money">${[5, 10, 20, 50, 100].map((v, i) => `<div class="note"><span>${cellHTML(fromDots('123456'), 'sm').repeat(i + 1)}</span><b>$${v}</b></div>`).join('')}</div>`]);
    parts.push(['sg-tips', 'Field tips for Ontario', `<div class="facts">
      <div class="fact"><b>Start with numbers</b><p>Room numbers and elevator floors are the easiest wins — the number sign plus a–j.</p></div>
      <div class="fact"><b>Expect contractions</b><p>Learn sh, en, ar, in, st and “the” early: washroom, men, women, alarm, main, stairs.</p></div>
      <div class="fact"><b>Missing capitals</b><p>Older (EBAE) signs often leave out the capital sign.</p></div>
      <div class="fact"><b>Keep moving</b><p>Use the pad of your finger with light pressure. Stopping makes dots harder to feel.</p></div></div>`]);
  }
  return {
    html: `<div class="sub-head"><div id="regionDD"></div><div id="jumpDD"></div></div>
      ${parts.map(([id, t, h]) => `<div class="sg" id="${id}"><h3 class="sg-h">${t}</h3>${h}</div>`).join('')}`,
    bind: () => {
      dropdown($('#regionDD'), { label: 'Region', options: Object.entries(SIGN_REGIONS).map(([k, r]) => ({ value: k, label: r.name })), value: region, onChange: (v) => { location.hash = '#/reference/signs/' + v; } });
      dropdown($('#jumpDD'), { label: 'Jump to', options: parts.map(([id, t]) => ({ value: id, label: t })), value: null, onChange: (v) => { const el = document.getElementById(v); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
      $$('.plate').forEach((p) => p.addEventListener('click', () => p.classList.toggle('decoded')));
    },
  };
}

// ---------- reference ----------
const REF_SECTIONS = [
  ['alphabet', 'Alphabet'], ['numbers', 'Numbers & symbols'], ['grade2', 'Grade 2 contractions'], ['signs', 'Signs in the wild'],
  ['science', 'Maths & science'], ['languages', 'Languages'], ['systems', 'World systems'], ['history', 'History'],
];
function alphabetSection() {
  const ROWS = [
    ['a–j', 'the foundation', 'abcdefghij', null, 'Only the top four dots. Learn these ten and the rest follow.'],
    ['k–t', 'add dot 3', 'klmnopqrst', [3], 'Same shapes as a–j, plus the lower-left dot.'],
    ['u–z', 'add dots 3 and 6', 'uvxyz', [3, 6], 'Same shapes again, plus both bottom dots.'],
    ['w', 'the latecomer', 'w', [6], 'French had no w in 1824. It’s j plus dot 6.'],
  ];
  return `<p class="lead-p">The alphabet is ten shapes, repeated. Each new row adds dots (in blue) to the first. Tap any letter for details.</p>
    <div id="alphaWrap">${ROWS.map(([range, title, letters, added, blurb]) => `
      <div class="decade"><div class="decade-head"><h3>${range} · ${title}</h3><span>${blurb}</span></div>
      <div class="alpha">${letters.split('').map((l) => `<button class="letter" data-l="${l}">${cellHTML(LETTERS[l], '', { added })}<b>${l}</b></button>`).join('')}</div></div>`).join('')}</div>
    <div class="card cell-anatomy">${cellHTML(fromDots('123456'), 'numbered')}<div><h3>How a cell works</h3><p class="muted">Dots 1-2-3 run down the left, 4-5-6 down the right. A real cell is about 6 mm tall — one fingertip. You read by gliding, not pressing.</p></div></div>`;
}
function languagesSection() {
  return { html: '<div class="sub-head"><div id="langDD"></div></div><div id="langBody"></div>', bind: () => {
    const render = (k) => {
      store.set('refLang', k);
      const body = $('#langBody');
      if (k === 'ja') { body.innerHTML = `<p class="muted">${esc(JAPANESE.blurb)}</p>${JAPANESE.rows.map(([n, r]) => `<div class="group-title"><h3>${n}</h3></div><div class="sym-grid">${r.map(([p, c]) => `<div class="sym"><span class="cells">${cellHTML(c)}</span><b>${p}</b></div>`).join('')}</div>`).join('')}`; return; }
      const info = LANG_INFO[k];
      body.innerHTML = `<p class="muted">${esc(info.blurb)}</p>
        <div class="sym-grid">${[...info.letters].map((l) => `<div class="sym"><span class="cells">${[...translate(l, k, 1)[0].cells].map((c) => cellHTML(c)).join('')}</span><b>${l}</b></div>`).join('')}</div>
        <div class="group-title"><h3>Numbers</h3></div><div class="example">${lineHTML(translate('2026', k, 1))}</div>
        <div class="group-title"><h3>Phrases</h3><span>${k === 'en' ? 'Grade 2' : 'uncontracted'}</span></div>
        <div class="example-grid">${info.phrases.map((p) => `<a class="example" href="#/translate?lang=${k}&text=${encodeURIComponent(p)}"><div class="print">${esc(p)}</div>${lineHTML(translate(p, k, k === 'en' ? 2 : 1), { cls: 'sm' })}</a>`).join('')}</div>`;
    };
    const v = store.get('refLang', 'en');
    dropdown($('#langDD'), { label: 'Language', options: [...Object.keys(LANG_INFO).map((k) => ({ value: k, label: k === 'en' ? 'English (UEB)' : LANGS[k].name })), { value: 'ja', label: '日本語 Japanese' }], value: v, onChange: render });
    render(v);
  } };
}
function refSection(key, sub) {
  switch (key) {
    case 'alphabet': return { html: alphabetSection() };
    case 'numbers': return { html: `<p class="lead-p">Numbers, punctuation and the indicators that change how the next cells are read.</p>${groupBlock('Numbers', 'Numbers', 'number sign ⠼ + a–j')}${groupBlock('Punctuation', 'Punctuation & symbols')}${groupBlock('Indicators', 'Indicators')}` };
    case 'grade2': return { html: `<p class="lead-p">About 180 contractions make braille shorter. Most books and public signs in Canada use Grade 2. Many cells mean different things alone versus inside a word.</p>${Object.entries(CONTRACTIONS).map(([cat, { blurb }]) => groupBlock(cat, cat, blurb)).join('')}` };
    case 'signs': return signsSection(sub);
    case 'science': return { html: `<p class="lead-p">UEB uses extra indicators for technical material: superscript ⠔, subscript ⠢, and operation signs starting with dot 5. In Grade 2 text a grade 1 indicator ⠰ often goes before ⠔ and ⠢. Examples are in Grade 1 mode.</p>
      <div class="example-grid">${SCIENCE.map((s) => `<div class="example"><div class="print">${esc(s.print)}</div><div class="braille-line">${cellsHTML(s.ueb, 'md')}</div><div class="notes">${s.notes.map((n) => `<span>${esc(n)}</span>`).join('')}</div></div>`).join('')}</div>
      <div class="group-title"><h3>Nemeth Code</h3><span>still allowed for maths in Canada and the US</span></div>
      <div class="example-grid">${NEMETH.map((s) => `<div class="example"><div class="print">${esc(s.print)}</div><div class="braille-line">${cellsHTML(s.cells, 'md')}</div><div class="notes">${s.notes.map((n) => `<span>${esc(n)}</span>`).join('')}</div></div>`).join('')}</div>` };
    case 'languages': return languagesSection();
    case 'systems': return { html: `<p class="lead-p">The braille family: the codes you’re likely to meet, plus special-purpose and tactile cousins. Tap one for details.</p>${SYSTEMS.map((g) => `<div class="group-title"><h3>${esc(g.group)}</h3></div><div class="table-list">${g.items.map(([n, w, d]) => `<details class="sys"><summary><b>${esc(n)}</b><span class="where">${esc(w)}</span></summary><p>${esc(d)}</p></details>`).join('')}</div>`).join('')}` };
    case 'history': return { html: `<ol class="timeline">${HISTORY.map(([y, t]) => `<li><b>${y}</b>${esc(t)}</li>`).join('')}</ol>` };
  }
  return { html: '' };
}

views.reference = (q, sub, sub2) => {
  const key = REF_SECTIONS.find(([k]) => k === sub) ? sub : store.get('refSec', 'alphabet');
  store.set('refSec', key);
  const i = REF_SECTIONS.findIndex(([k]) => k === key);
  const sec = refSection(key, sub2);
  view.innerHTML = `
    <div class="page-head">
      <div id="secDD" class="dd-title"></div>
      <button class="icon-btn" id="searchBtn" aria-label="Search">${icon('search')}</button>
    </div>
    <div class="search-wrap" id="searchWrap" hidden><input class="search" id="q" type="search" placeholder="A word (“the”), a symbol (“?”) or dot numbers (“1456”)" autocomplete="off"></div>
    <div id="results"></div>
    <div id="secBody">${sec.html}
      <div class="pager">${i > 0 ? `<a href="#/reference/${REF_SECTIONS[i - 1][0]}">← ${REF_SECTIONS[i - 1][1]}</a>` : '<span></span>'}${i < REF_SECTIONS.length - 1 ? `<a href="#/reference/${REF_SECTIONS[i + 1][0]}">${REF_SECTIONS[i + 1][1]} →</a>` : ''}</div>
    </div>`;
  dropdown($('#secDD'), { options: REF_SECTIONS.map(([k, t]) => ({ value: k, label: t })), value: key, onChange: (v) => { location.hash = '#/reference/' + v; } });
  if (sec.bind) sec.bind();
  view.onclick = (ev) => {
    const s = ev.target.closest('.sym[data-i]'); if (s) { openSheet(symbolDetail(DICT[Number(s.dataset.i)])); return; }
    const l = ev.target.closest('.letter[data-l]'); if (l) openSheet(letterDetail(l.dataset.l));
  };
  const results = $('#results'), body = $('#secBody');
  const doSearch = () => {
    const raw = $('#q').value.trim();
    body.hidden = !!raw;
    if (!raw) { results.innerHTML = ''; return; }
    const s = raw.toLowerCase();
    const isDots = /^[1-6][1-6\s-]*$/.test(s), isBraille = /^[⠀-⣿]+$/.test(raw);
    const hits = DICT.map((e, n) => [e, n]).filter(([e]) => {
      if (isDots) return [...e.cells].map((c) => toDots(c).join('')).join(' ').includes(s.replace(/-/g, ''));
      if (isBraille) return e.cells.includes(raw);
      return e.print.toLowerCase().includes(s) || (e.note || '').toLowerCase().includes(s);
    }).sort(([a], [b]) => (a.print.toLowerCase() === s ? -1 : 0) - (b.print.toLowerCase() === s ? -1 : 0));
    const tr = !isDots && !isBraille && /[a-z]/i.test(raw) ? `<div class="example" style="margin-top:12px"><div class="small muted">“${esc(raw)}” in Grade 2</div>${lineHTML(translate(raw, 'en', 2))}</div>` : '';
    results.innerHTML = (hits.length ? `<div class="sym-grid">${hits.slice(0, 60).map(([e, n]) => symHTML(e, n)).join('')}</div>` : '<p class="muted">No symbol matches.</p>') + tr;
  };
  $('#q').oninput = doSearch;
  $('#searchBtn').onclick = () => { const w = $('#searchWrap'); w.hidden = !w.hidden; if (!w.hidden) $('#q').focus(); else { $('#q').value = ''; doSearch(); } };
  return () => { view.onclick = null; };
};

// ---------- translate ----------
views.translate = (q) => {
  const LOPTS = [['en1', 'English · Grade 1', 'English'], ['en2', 'English · Grade 2', 'English'], ['fr', 'Français', 'Other languages'], ['es', 'Español', 'Other languages'], ['de', 'Deutsch', 'Other languages'], ['ru', 'Русский', 'Other languages'], ['el', 'Ελληνικά', 'Other languages']];
  let mode = q.get('lang') ? (q.get('lang') === 'en' ? 'en2' : q.get('lang')) : store.get('trMode', 'en2');
  const initial = q.get('text') || store.get('trText', 'Welcome to Ontario. The washroom is on floor 2.');
  view.innerHTML = `
    <div class="page-head"><h1>Translate</h1></div>
    <div class="sub-head"><div id="langDD"></div><div id="exDD"></div></div>
    <textarea class="tr-input" id="trIn" spellcheck="false">${esc(initial)}</textarea>
    <div class="card tr-out" id="trOut"></div>
    <div class="tr-tools">
      <button class="btn" id="trCopy">Copy braille</button>
      <a class="btn" id="trSweep" href="#/practice/sweep?src=custom">Sweep this ${icon('arrow', 18)}</a>
    </div>
    <p class="muted small">Grade 2 follows the main UEB contraction rules but is simplified — a learning aid, not a transcription tool. Other languages are uncontracted.</p>`;
  const inp = $('#trIn');
  const render = () => {
    const [lang, grade] = mode.startsWith('en') ? ['en', Number(mode[2])] : [mode, 1];
    const parts = translate(inp.value, lang, grade);
    $('#trOut').innerHTML = lineHTML(parts);
    $('#trOut').dataset.uni = unicodeOf(parts);
    store.set('trMode', mode); store.set('trText', inp.value);
  };
  const exLang = () => (mode.startsWith('en') ? 'en' : mode);
  const syncDD = () => {
    dropdown($('#langDD'), { label: 'Braille', options: LOPTS.map(([v, l, g]) => ({ value: v, label: l, group: g })), value: mode, onChange: (v) => { mode = v; render(); syncDD(); } });
    dropdown($('#exDD'), { label: 'Examples', options: LANG_INFO[exLang()].phrases.map((p) => ({ value: p, label: p })), value: null, onChange: (v) => { inp.value = v; render(); } });
  };
  inp.oninput = render;
  $('#trCopy').onclick = async () => { try { await navigator.clipboard.writeText($('#trOut').dataset.uni); $('#trCopy').textContent = 'Copied ✓'; setTimeout(() => ($('#trCopy').textContent = 'Copy braille'), 1400); } catch {} };
  $('#trSweep').onclick = () => { store.set('swCustom', inp.value.slice(0, 200)); store.set('swSrc', 'custom'); };
  syncDD(); render();
};

// ---------- router ----------
let cleanup = null;
const TITLES = { '': 'Dots — learn braille', practice: 'Practice · Dots', reference: 'Reference · Dots', translate: 'Translate · Dots' };
function route() {
  const raw = location.hash.replace(/^#\/?/, '');
  let [path, qs] = raw.split('?');
  path = path || '';
  if (path === 'sweep') path = 'practice/sweep';
  if (path.startsWith('signs')) path = 'reference/' + path;
  const [name, sub, sub2] = path.split('/');
  const q = new URLSearchParams(qs || '');
  const key = views[name] ? name : '';
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  closeSheet(); closeDD();
  const r = views[key](q, sub, sub2);
  cleanup = typeof r === 'function' ? r : null;
  $$('[data-route]').forEach((a) => a.classList.toggle('active', a.dataset.route === key));
  document.body.dataset.page = key || 'home';
  window.scrollTo(0, 0);
  document.title = TITLES[key];
}
window.addEventListener('hashchange', route);
window.addEventListener('scroll', () => $('.top').classList.toggle('scrolled', scrollY > 4), { passive: true });
$$('[data-icon]').forEach((el) => { el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)); });
$('#settingsBtn').onclick = openSettings;
applySettings();
route();
