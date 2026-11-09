import {
  LETTERS, IND, UEB_PUNCT, CONTRACTIONS, cellsOf, fromDots, toDots, dotsLabel,
  translate, toCells, unicodeOf, LANGS,
} from './braille.js?v=6';
import {
  SIGN_WORDS, WORDS, SENTENCES, SCIENCE, SCIENCE_SYMBOLS, NEMETH, LANG_INFO, JAPANESE, SYSTEMS, HISTORY, SIGN_REGIONS,
} from './data.js?v=6';

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

// ---------- icons ----------
const P = {
  home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  practice: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/><path d="M8 7h8"/>',
  translate: '<path d="M3 5h9"/><path d="M7.5 3v2"/><path d="M5 5c.8 3.5 3.3 6.3 6.5 7.5"/><path d="M10 5c-.8 3.5-3.3 6.3-6.5 7.5"/><path d="m12.5 21 4.25-10L21 21"/><path d="M14 17.5h5.5"/>',
  settings: '<path d="M4 6h10"/><path d="M18 6h2"/><circle cx="16" cy="6" r="2"/><path d="M4 12h3"/><path d="M11 12h9"/><circle cx="9" cy="12" r="2"/><path d="M4 18h11"/><path d="M19 18h1"/><circle cx="17" cy="18" r="2"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.5"/><path d="M12 17h.01"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  restart: '<path d="M3.5 12a8.5 8.5 0 1 0 2.7-6.2"/><path d="M3 4v5h5"/>',
  shuffle: '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="m4 4 5 5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  read: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  write: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  words: '<path d="M4 7V5h16v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
  sweep: '<circle cx="5" cy="8" r="1.6" fill="currentColor"/><circle cx="10" cy="8" r="1.6" fill="currentColor"/><circle cx="15" cy="8" r="1.6" fill="currentColor"/><path d="M3 16h15"/><path d="m15 13 3 3-3 3"/>',
};
const icon = (n, size = 22) => `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;

// ---------- settings ----------
const DEFAULTS = { theme: 'auto', dotNums: false, color: true, hideLetters: false, trLabels: true, swGrade: 1, swSize: 'large', swVibe: true };
const S = { ...DEFAULTS, ...store.get('settings', {}) };
const canVibrate = 'vibrate' in navigator && matchMedia('(pointer: coarse)').matches;
function applySettings() {
  const r = document.documentElement;
  if (S.theme === 'auto') delete r.dataset.theme; else r.dataset.theme = S.theme;
  const b = document.body.classList;
  b.toggle('s-dotnums', S.dotNums); b.toggle('s-color', S.color); b.toggle('s-hide-letters', S.hideLetters);
  b.toggle('s-tr-nolabels', !S.trLabels); b.toggle('s-sw-real', S.swSize === 'real');
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
  return `<span class="cell ${cls}${opts.kind ? ' k-' + opts.kind : ''}" role="img" aria-label="${esc(dotsLabel(cell))}">${dots}</span>`;
}
const cellsHTML = (str, cls = '') => [...str].map((c) => (c === ' ' || c === '⠀' ? '<span class="bw space"></span>' : cellHTML(c, cls))).join('');
function lineHTML(parts, { labels = true, cls = '' } = {}) {
  let out = '', word = '';
  const flush = () => { if (word) out += `<span class="bword">${word}</span>`; word = ''; };
  for (const c of toCells(parts)) {
    if (c.kind === 'newline') { flush(); out += '<span class="bw-break"></span>'; continue; }
    if (c.kind === 'space') { flush(); out += '<span class="bw space"></span>'; continue; }
    const lbl = c.idx === 0 ? (c.print || (c.kind === 'indicator' ? '·' : '')) : '';
    word += `<span class="bw kind-${c.kind}" title="${esc((c.group.print || '') + ' ' + (c.note || ''))}">${cellHTML(c.cell, cls, { kind: kindOf(c) })}${labels ? `<span class="lbl">${esc(lbl)}</span>` : ''}</span>`;
  }
  flush();
  return `<div class="braille-line">${out}</div>`;
}
// Colour-coding kind for a translated cell (the number sign belongs with its digits).
function kindOf(c) {
  if (c.kind === 'indicator' && /number/.test(c.note || '')) return 'digit';
  return ['letter', 'digit', 'punct', 'contraction', 'indicator'].includes(c.kind) ? c.kind : '';
}
const cellsK = (str, kind, cls = '') => [...str].map((c) => cellHTML(c, cls, { kind })).join('');
// Labelled groups: "cells:label cells:label _ cells:label" (_ = space)
function groupsHTML(spec, cls = 'md') {
  return `<div class="braille-line groups">${spec.split(' ').map((g) => {
    if (g === '_') return '<span class="bw space"></span>';
    const i = g.indexOf(':');
    const cells = g.slice(0, i), label = g.slice(i + 1);
    const kind = /^[a-z]$/i.test(label) ? 'letter' : /^[0-9.,#]+$/.test(label) ? 'digit' : /^(cap|caps)$/.test(label) ? 'indicator' : 'math';
    return `<span class="bgroup"><span class="mrow">${cellsK(cells, kind, cls)}</span><span class="lbl">${esc(label)}</span></span>`;
  }).join('')}</div>`;
}

// ---------- modal sheet ----------
const sheet = $('#sheet');
const backdrop = $('#sheetBackdrop');
function openSheet(html, { title = '' } = {}) {
  sheet.innerHTML = `<div class="sheet-head"><h2>${esc(title)}</h2><button class="icon-btn close" aria-label="Close">${icon('close', 20)}</button></div><div class="sheet-body">${html}</div>`;
  sheet.hidden = false; backdrop.hidden = false;
  sheet.scrollTop = 0;
  $('.close', sheet).onclick = closeSheet;
  $('.close', sheet).focus({ preventScroll: true });
}
function closeSheet() { if (sheet.hidden) return; sheet.hidden = true; backdrop.hidden = true; }
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
    e.stopPropagation(); closeDD();
    const v = options.find((o) => String(o.value) === b.dataset.v).value;
    dropdown(el, { label, options, value: v, onChange });
    onChange(v);
  };
}
// Segmented radio group
const radios = (name, opts, value) => `<div class="seg radios" role="radiogroup" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" role="radio" aria-checked="${String(v) === String(value)}" data-v="${v}" class="${String(v) === String(value) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
function bindRadios(root, fn) {
  root.addEventListener('click', (e) => {
    const g = e.target.closest('[data-seg]'), b = e.target.closest('[data-seg] button');
    if (!g || !b || !root.contains(g)) return;
    $$('button', g).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
    fn(g.dataset.seg, b.dataset.v);
  });
}
const switchRow = (name, label, checked) => `<label class="set-row switch"><span>${label}</span><input type="checkbox" data-set="${name}" ${checked ? 'checked' : ''}></label>`;

// ---------- header + sticky control row ----------
const headTitle = $('#headTitle');
const subbar = $('#subbar');
const setTitle = (t) => { headTitle.textContent = t; };
const setSub = (html) => { subbar.innerHTML = html; subbar.hidden = !html; syncHeadH(); };
function syncHeadH() { requestAnimationFrame(() => document.documentElement.style.setProperty('--head-h', $('.top').offsetHeight + 'px')); }

// ---------- settings modal ----------
const COLOR_KEY = [['letter', 'Letters (Grade 1)'], ['digit', 'Numbers'], ['contraction', 'Contractions (Grade 2)'], ['punct', 'Punctuation'], ['indicator', 'Indicators'], ['math', 'Maths signs']];
function openSettings() {
  openSheet(`<div class="settings">
    <div class="set-group"><h3>General</h3>
      <div class="set-row"><span>Appearance</span>${radios('theme', [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], S.theme)}</div>
      ${switchRow('dotNums', 'Show dot numbers', S.dotNums)}
      ${switchRow('color', 'Colour-code dots', S.color)}
      <div class="color-key">${COLOR_KEY.map(([k, l]) => `<span>${cellHTML('⠿', 'sm', { kind: k })}${l}</span>`).join('')}</div>
    </div>
    <div class="set-group"><h3>Alphabet</h3>${switchRow('hideLetters', 'Hide letters under cells', S.hideLetters)}</div>
    <div class="set-group"><h3>Translate</h3>${switchRow('trLabels', 'Print labels under cells', S.trLabels)}</div>
    <div class="set-group"><h3>Progress</h3><button class="btn" id="resetAll">Reset practice progress</button></div>
    <div class="set-group about"><h3>About Learn Braille</h3><p>A resource for sighted folks to learn the braille writing system. Braille follows Unified English Braille unless noted. Made for learning — for official transcription, consult a certified braille transcriber.</p><p class="muted small">Sweep settings are on the Sweep page.</p></div>
  </div>`, { title: 'Settings' });
  bindRadios($('.settings', sheet), (k, v) => setS(k, typeof DEFAULTS[k] === 'number' ? Number(v) : v));
  $$('[data-set]', sheet).forEach((i) => { i.onchange = () => setS(i.dataset.set, i.checked); });
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
    <div class="row"><a class="btn primary" href="#/practice/read?cat=letters&set=${idx < 10 ? 'aj' : idx < 20 ? 'kt' : 'uz'}">Practise this row</a><a class="btn" href="#/practice/sweep?src=alphabet">Sweep the alphabet</a></div>
  </div>`;
}
function symbolDetail(e) {
  const cells = [...e.cells];
  return `<div class="detail">
    <div class="detail-top"><div class="row" style="gap:6px">${cells.map((c) => cellHTML(c, cells.length > 2 ? 'lg numbered' : 'xl numbered', { kind: e.kind })).join('')}</div></div>
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
const KIND_OF_GROUP = { Letters: 'letter', Numbers: 'digit', Punctuation: 'punct', Indicators: 'indicator' };
for (const e of DICT) e.kind = KIND_OF_GROUP[e.group] || 'contraction';
const SEC_OF_GROUP = { Letters: 'alphabet', Numbers: 'numbers', Punctuation: 'numbers', Indicators: 'numbers' };
const symHTML = (e, i) => `<button class="sym" data-i="${i}"><span class="cells">${[...e.cells].map((c) => cellHTML(c, '', { kind: e.kind })).join('')}</span><b>${esc(e.print)}</b>${e.note && e.note.length < 26 ? `<small>${esc(e.note)}</small>` : ''}</button>`;
const groupBlock = (g, title, blurb) => `<div class="group-title"><h3>${title}</h3>${blurb ? `<span>${esc(blurb)}</span>` : ''}</div><div class="sym-grid">${DICT.map((e, i) => [e, i]).filter(([e]) => e.group === g).map(([e, i]) => symHTML(e, i)).join('')}</div>`;

const view = $('#view');
const views = {};
const mastery = () => {
  const m = store.get('mastery', {});
  // v4 stored one score per item; keep it as the Read score.
  if (Object.keys(m).some((k) => !/^[rw]:/.test(k))) {
    for (const k of Object.keys(m)) if (!/^[rw]:/.test(k)) { m['r:' + k] = m[k]; delete m[k]; }
    store.set('mastery', m);
  }
  return m;
};
const level = (score) => Math.min(4, score); // 0 untried · 1–3 blues · 4+ known (green)

// ---------- home ----------
function progressHTML() {
  const m = mastery();
  const groups = [['Letters', CATS.letters.sets.az[1]()], ['Numbers', CATS.symbols.sets.num[1]()], ['Punctuation', CATS.symbols.sets.punct[1]()],
    ['Maths & money', CATS.symbols.sets.signs[1]()], ['Indicators', CATS.symbols.sets.ind[1]()], ['Contractions', CATS.contractions.sets.all[1]()]];
  const known = (pre, items) => items.filter((x) => (m[pre + x.key] || 0) >= 4).length;
  const letters = groups[0][1];
  const strip = (pre) => `<div class="pstrip">${letters.map((x) => `<span data-l="${level(m[pre + x.key] || 0)}">${x.answer}</span>`).join('')}</div>`;
  const r = known('r:', letters), w = known('w:', letters);
  return `<details class="progress-card"><summary>
      <span class="pc-title">Your progress</span>
      <span class="pc-sum"><b>${r}</b>/26 read · <b>${w}</b>/26 written</span>${icon('chevron', 20)}</summary>
    <div class="pc-body">
      <table class="ptable"><thead><tr><th></th><th>Read</th><th>Write</th></tr></thead><tbody>
      ${groups.map(([n, items]) => `<tr><td>${n}</td><td><b>${known('r:', items)}</b>/${items.length}</td><td><b>${known('w:', items)}</b>/${items.length}</td></tr>`).join('')}
      </tbody></table>
      <h4>Letters you read</h4>${strip('r:')}
      <h4>Letters you write</h4>${strip('w:')}
      <p class="muted small"><span class="legend"><i data-l="1"></i><i data-l="2"></i><i data-l="3"></i><i data-l="4"></i></span> learning → known. An item counts as known after a few correct answers in a row.</p>
    </div></details>`;
}
views[''] = () => {
  setTitle(''); setSub('');
  const mini = (s, cls = 'sm') => `<span class="mrow">${cellsHTML(s, cls)}</span>`;
  const row = (href, title, desc, art) => `<a class="hrow" href="${href}"><div class="hrow-text"><b>${title}</b><span>${desc}</span></div><div class="hrow-art">${art}</div></a>`;
  view.innerHTML = `
    <div class="home-head">
      <h1 class="wordmark" aria-label="Learn Braille"><span class="wm-l">L</span>earn <span class="wm-b">B</span>ra<span class="wm-i">ı<span class="wm-dots" aria-hidden="true"><i></i><i class="on"></i><i class="on"></i><i></i></span></span>lle</h1>
      <p class="slogan">A resource for sighted folks to learn the braille writing system.</p>
    </div>
    ${progressHTML()}

    <h2 class="sec-h">${icon('practice', 28)} Practice</h2>
    <div class="hrows">
      ${row('#/practice/read', 'Read', 'Name the letter, symbol or contraction', `<div class="art-read">${cellHTML(LETTERS.h, 'sm')}<span class="ok">h</span></div>`)}
      ${row('#/practice/write', 'Write', 'Tap the dots that make it', `<div class="art-write">${[1, 1, 0, 0, 1, 0].map((o) => `<i class="${o ? 'on' : ''}"></i>`).join('')}</div>`)}
      ${row('#/practice/words', 'Words', 'Decode whole words and type them', mini(unicodeOf(translate('cozy', 'en', 1)), 'xs2'))}
      ${row('#/practice/sweep', 'Sweep', 'Glide a finger along a line, like real reading', `<div class="art-sweep">${mini(unicodeOf(translate('read', 'en', 1)), 'xs2')}<span class="line"></span></div>`)}
    </div>

    <h2 class="sec-h">${icon('book', 28)} Reference</h2>
    <div class="hrows">
      ${row('#/reference/alphabet', 'Alphabet', 'a–z in three simple rows', mini('⠁⠃⠉', 'xs2'))}
      ${row('#/reference/numbers', 'Numbers & symbols', 'Digits, punctuation, capitals', mini('⠼⠃', 'xs2'))}
      ${row('#/reference/grade2', 'Grade 2', 'All 180 contractions, like “the” and “and”', mini('⠮⠯', 'xs2'))}
      ${row('#/reference/signs', 'Signs', 'Read real-world signage, by country', `<div class="mini-plate"><b>EXIT</b></div>`)}
      ${row('#/reference/science', 'Maths & science', 'Equations, units and Nemeth', mini('⠐⠖', 'xs2'))}
      ${row('#/reference/languages', 'Languages', 'French, Spanish, German, Russian, Greek, Japanese', mini('⠿⠻', 'xs2'))}
      ${row('#/reference/systems', 'World systems', 'The braille family around the world', mini('⠺⠕', 'xs2'))}
      ${row('#/reference/history', 'History', 'From night writing to UEB', mini('⠓⠊', 'xs2'))}
    </div>

    <h2 class="sec-h">${icon('translate', 28)} Translate</h2>
    <div class="hrows">
      ${row('#/translate', 'Type anything', 'See it in braille: English Grade 1 or 2 and five other languages', mini(unicodeOf(translate('Hi!', 'en', 1)), 'xs2'))}
    </div>`;
};

// ---------- practice data ----------
const L = (letters) => () => letters.split('').map((l) => ({ key: l, cells: LETTERS[l], answer: l }));
const C = (cat) => () => CONTRACTIONS[cat].items.map(([w, d]) => ({ key: 'c' + w, cells: cellsOf(d), answer: w }));
const MATH_SIGNS = ['+', '-', '×', '÷', '=', '$', '%', '@', '&', '#', '*', '°', '/'];
const CATS = {
  letters: { name: 'Letters', sets: {
    aj: ['a–j', L('abcdefghij')], kt: ['k–t', L('klmnopqrst')], uz: ['u–z', L('uvwxyz')],
    az: ['All letters', L('abcdefghijklmnopqrstuvwxyz')], mirror: ['Mirror pairs', L('dfeihjrw'), 'd/f, e/i, h/j, r/w'],
  } },
  symbols: { name: 'Symbols', sets: {
    num: ['Numbers', () => '1234567890'.split('').map((d) => ({ key: 'n' + d, cells: IND.number + LETTERS['jabcdefghi'[Number(d)]], answer: d }))],
    punct: ['Punctuation', () => [',', ';', ':', '.', '!', '?', "'", '-', '—', '(', ')'].map((p) => ({ key: 'p' + p, cells: UEB_PUNCT[p][0], answer: p, label: UEB_PUNCT[p][1] }))],
    signs: ['Maths & money signs', () => MATH_SIGNS.map((p) => ({ key: 'p' + p, cells: (p === '-' ? [fromDots('5') + fromDots('36'), 'minus'] : UEB_PUNCT[p])[0], answer: p === '-' ? '−' : p, label: p === '-' ? 'minus' : UEB_PUNCT[p][1] }))],
    ind: ['Indicators', () => INDICATORS.map(([p, d]) => ({ key: 'i' + p, cells: cellsOf(d), answer: p }))],
  } },
  contractions: { name: 'Contractions', sets: {
    ...Object.fromEntries(Object.keys(CONTRACTIONS).map((cat, i) => ['k' + i, [cat, C(cat)]])),
    all: ['All contractions', () => [...new Map(Object.keys(CONTRACTIONS).flatMap((cat) => C(cat)()).map((x) => [x.key, x])).values()]],
  } },
};
const WORD_SETS = {
  simple: { name: 'Simple', grade: 1, list: WORDS },
  signs: { name: 'Signs', grade: 2, list: SIGN_WORDS.map((w) => w.toLowerCase()) },
  g2: { name: 'Contracted', grade: 2, list: ['the', 'and', 'with', 'for', 'children', 'knowledge', 'people', 'there', 'father', 'mother', 'station', 'thing', 'shower', 'river', 'beach', 'information', 'kindness', 'house', 'light', 'stone'] },
};
// Merge items that share the same cells (e.g. "bb" and "be") so a reading quiz is never ambiguous.
function mergeByCells(items) {
  const map = new Map();
  for (const it of items) {
    const m = map.get(it.cells);
    if (m) { if (!m.answer.split(' / ').includes(it.answer)) m.answer += ' / ' + it.answer; } else map.set(it.cells, { ...it });
  }
  return [...map.values()];
}
const SWEEP_SRC = { alphabet: 'Alphabet', words: 'Words', sentences: 'Sentences', signs: 'Sign words', custom: 'Your own text' };
const MODES = { read: 'Read', write: 'Write', words: 'Words', sweep: 'Sweep' };
const HELP = {
  read: 'A braille cell appears — pick what it says. The card glows green when you’re right and red (with a shake) when you’re not. On a keyboard, press 1–4. Your progress for each item goes from pale blue to dark blue, then green once you know it; ones you miss come up more often.',
  write: 'Tap the dots that make the letter or symbol. It checks itself: the card glows green as soon as the dots are right, and red if you add a dot that doesn’t belong. Symbols longer than one cell are built one cell at a time. On a keyboard, F D S are dots 1 2 3 and J K L are dots 4 5 6, like a Perkins brailler. Turn on dot numbers in Settings to see them on the pad.',
  words: 'Decode the word and type it — it checks as you type. Hint reveals one cell at a time; Skip shows the answer.',
  sweep: 'Put your finger on the line and slide right. The cell under your finger is outlined, and its letter appears once you’ve passed it. Hold your finger in the shaded right edge and the line keeps scrolling. On a laptop, move the mouse across or use the arrow keys. “New line” loads different text and “Start over” goes back to the beginning. Grade, cell size and vibration are below the reading area.',
};

views.practice = (q, sub) => {
  const mode = MODES[sub] ? sub : store.get('pmode', 'read');
  store.set('pmode', mode);
  setTitle('Practice');
  setSub(`<div class="seg radios modes" role="radiogroup">${Object.entries(MODES).map(([k, v]) => `<a role="radio" aria-checked="${k === mode}" class="${k === mode ? 'on' : ''}" href="#/practice/${k}">${icon(k, 20)}<span>${v}</span></a>`).join('')}</div>
    <button class="icon-btn plain" id="helpBtn" aria-label="How this works">${icon('help')}</button>`);
  $('#helpBtn').onclick = () => openSheet(`<p>${esc(HELP[mode])}</p>`, { title: MODES[mode] });
  view.innerHTML = `<div class="practice-wrap mode-${mode}"><div class="picker" id="picker"></div><div id="modeBody"></div></div>`;
  return mode === 'sweep' ? sweepMode(q) : quizMode(mode, q);
};

function quizMode(mode, q) {
  const saved = store.get('psel', { cat: 'letters', set: 'aj' });
  const state = { cat: q.get('cat') || saved.cat, set: q.get('set') || saved.set, wset: store.get('pwset', 'simple'), streak: 0, right: 0, total: 0, last: null, firstTry: true };
  if (!CATS[state.cat]) state.cat = 'letters';
  if (!CATS[state.cat].sets[state.set]) state.set = Object.keys(CATS[state.cat].sets)[0];
  const m = mastery();
  const picker = $('#picker'), body = $('#modeBody');
  body.innerHTML = `<div class="card stage" id="stage"></div>
    <div class="below-stage">
      <div class="stats-row"><div class="stats"><span>Streak <b id="sStreak">0</b></span><span>Correct <b id="sRight">0</b>/<b id="sTotal">0</b></span></div>
      ${mode === 'words' ? '' : '<span class="legend" title="Learning → known"><i data-l="1"></i><i data-l="2"></i><i data-l="3"></i><i data-l="4"></i><small>known</small></span>'}</div>
      <div class="mastery" id="mastery"></div>
    </div>`;
  const stage = $('#stage');
  const items = () => {
    const it = CATS[state.cat].sets[state.set][1]();
    return mode === 'read' ? mergeByCells(it) : it;
  };
  const pre = mode === 'write' ? 'w:' : 'r:';
  const score = (k) => m[pre + k] || 0;
  const bump = (k, d) => { m[pre + k] = Math.max(0, Math.min(5, score(k) + d)); store.set('mastery', m); };

  function renderPicker() {
    if (mode === 'words') {
      picker.innerHTML = radios('wset', Object.entries(WORD_SETS).map(([k, s]) => [k, s.name]), state.wset);
    } else {
      picker.innerHTML = radios('cat', Object.entries(CATS).map(([k, c]) => [k, c.name]), state.cat) + '<div id="setDD"></div>';
      dropdown($('#setDD'), { options: Object.entries(CATS[state.cat].sets).map(([k, [n, , hint]]) => ({ value: k, label: n, hint })), value: state.set, onChange: (v) => { state.set = v; saveSel(); restart(); } });
    }
  }
  const saveSel = () => store.set('psel', { cat: state.cat, set: state.set });
  bindRadios(picker, (k, v) => {
    if (k === 'wset') { state.wset = v; store.set('pwset', v); next(); return; }
    state.cat = v; state.set = Object.keys(CATS[v].sets)[0]; saveSel(); renderPicker(); restart();
  });
  function restart() { state.last = null; renderMastery(); next(); }
  function renderMastery() {
    const el = $('#mastery');
    if (mode === 'words') { el.innerHTML = ''; return; }
    el.innerHTML = items().map((x) => `<span data-l="${level(score(x.key))}" title="${esc(x.answer)}">${esc(x.answer.length > 4 ? x.answer.slice(0, 3) + '…' : x.answer)}</span>`).join('');
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
  // Feedback is a coloured glow on the card (plus a shake when wrong).
  const glow = (ok) => {
    stage.classList.remove('glow-good', 'glow-bad'); void stage.offsetWidth;
    stage.classList.add(ok ? 'glow-good' : 'glow-bad');
  };

  function renderRead() {
    const item = nextItem(); state.last = item; state.firstTry = true;
    stage.classList.remove('glow-good', 'glow-bad');
    const opts = shuffle([item, ...shuffle(items().filter((x) => x.cells !== item.cells)).slice(0, 3)]);
    const long = opts.some((o) => o.answer.length > 2);
    stage.innerHTML = `
      <div class="prompt-cells">${[...item.cells].map((c) => cellHTML(c)).join('')}</div>
      <div class="choices ${long ? 'words' : ''}">${opts.map((o) => `<button class="choice" data-k="${esc(o.key)}">${esc(o.answer)}${o.label ? `<small>${esc(o.label)}</small>` : ''}</button>`).join('')}</div>`;
    const choose = (btn) => {
      if (!btn || btn.classList.contains('right') || btn.classList.contains('wrong')) return;
      const ok = btn.dataset.k === item.key;
      result(ok, item); glow(ok);
      btn.classList.add(ok ? 'right' : 'wrong');
      if (ok) setTimeout(next, 650);
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
    stage.classList.remove('glow-good', 'glow-bad');
    const targets = [...item.cells];
    let ci = 0, done = false;
    const on = new Set();
    stage.innerHTML = `
      <div class="target">${esc(item.answer)}</div>
      ${targets.length > 1 ? `<div class="build" id="build">${targets.map(() => '<span class="slot"></span>').join('')}</div>` : ''}
      <div class="dotpad ${S.dotNums ? 'nums' : ''}" id="pad">${[1, 2, 3, 4, 5, 6].map((d) => `<button data-d="${d}" aria-label="dot ${d}">${d}</button>`).join('')}</div>
      <button class="link-btn corner" id="skip">Show me</button>`;
    const pad = $('#pad');
    const want = () => new Set(toDots(targets[ci]));
    const paint = () => [1, 2, 3, 4, 5, 6].forEach((d) => $(`[data-d="${d}"]`, pad).classList.toggle('on', on.has(d)));
    const markSlots = () => $$('#build .slot').forEach((s, i) => { s.innerHTML = i < ci ? cellHTML(targets[i], 'sm') : ''; s.classList.toggle('cur', i === ci); });
    markSlots();
    const evaluate = (added) => {
      if (done) return;
      const w = want();
      if (added && !w.has(added)) { result(false, item); glow(false); return; }
      if (on.size === w.size && [...w].every((d) => on.has(d))) {
        ci++;
        if (ci >= targets.length) { done = true; markSlots(); result(true, item); glow(true); setTimeout(next, 750); }
        else { on.clear(); setTimeout(() => { paint(); markSlots(); }, 180); }
      }
    };
    const tog = (d) => {
      if (done) return;
      if (on.has(d)) { on.delete(d); paint(); evaluate(0); } else { on.add(d); paint(); evaluate(d); }
    };
    pad.onclick = (e) => { const b = e.target.closest('button'); if (b) tog(Number(b.dataset.d)); };
    $('#skip').onclick = () => {
      if (done) return;
      if (state.firstTry) result(false, item);
      on.clear(); toDots(targets[ci]).forEach((d) => on.add(d)); paint(); evaluate(0);
    };
    const KEYS = { f: 1, d: 2, s: 3, j: 4, k: 5, l: 6 };
    state.key = (e) => { if (KEYS[e.key.toLowerCase()]) tog(KEYS[e.key.toLowerCase()]); };
  }

  function renderWords() {
    const ws = WORD_SETS[state.wset];
    let word = pick(ws.list);
    if (state.last === word) word = pick(ws.list);
    state.last = word; state.firstTry = true;
    stage.classList.remove('glow-good', 'glow-bad');
    const cells = toCells(translate(word, 'en', ws.grade));
    let shown = 0, done = false;
    stage.innerHTML = `
      <div class="prompt-cells words ${cells.length > 6 ? 'many' : ''}" id="wcells">${cells.map((c) => `<span class="bw">${cellHTML(c.cell)}<span class="lbl"></span></span>`).join('')}</div>
      <input class="answer-input" id="ans" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Type the word">
      <div class="row"><button class="btn ghost" id="hint">Hint</button><button class="btn ghost" id="skip">Skip</button></div>`;
    const ans = $('#ans');
    if (matchMedia('(pointer: fine)').matches) ans.focus();
    const lbls = $$('#wcells .lbl');
    const reveal = (n) => cells.slice(0, n).forEach((c, i) => { lbls[i].textContent = c.idx === 0 ? c.print || '·' : ''; });
    ans.oninput = () => {
      if (done) return;
      if (ans.value.trim().toLowerCase() === word) { done = true; result(true, {}); glow(true); reveal(cells.length); setTimeout(next, 900); }
    };
    ans.onkeydown = (e) => { if (e.key === 'Enter' && !done && ans.value.trim()) { result(false, {}); glow(false); } };
    $('#hint').onclick = () => { state.firstTry = false; shown = Math.min(cells.length, shown + 1); reveal(shown); };
    $('#skip').onclick = () => { done = true; reveal(cells.length); ans.value = word; setTimeout(next, 1300); };
    state.key = null;
  }
  let dead = false;
  function next() { if (dead) return; ({ read: renderRead, write: renderWrite, words: renderWords })[mode](); }
  const onKey = (e) => { if (e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey || !sheet.hidden) return; state.key && state.key(e); };
  const onSet = (e) => {
    if (e.detail === 'mastery') { Object.keys(m).forEach((k) => delete m[k]); renderMastery(); }
    if (e.detail === 'dotNums') { const pad = $('#pad'); if (pad) pad.classList.toggle('nums', S.dotNums); }
  };
  document.addEventListener('keydown', onKey);
  window.addEventListener('settings', onSet);
  renderPicker(); renderMastery(); next();
  return () => { dead = true; document.removeEventListener('keydown', onKey); window.removeEventListener('settings', onSet); };
}

// ---------- sweep ----------
function sweepMode(q) {
  let src = q.get('src') || store.get('swSrc', 'words');
  if (!SWEEP_SRC[src]) src = 'words';
  let custom = store.get('swCustom', 'Welcome to Canada');
  $('#picker').innerHTML = `<div id="srcDD"></div>
    <div class="icon-row">
      <button class="btn small-btn" id="editBtn">${icon('edit', 18)} Edit text</button>
      <button class="btn small-btn" id="shuffleBtn">${icon('shuffle', 18)} New line</button>
      <button class="btn small-btn" id="restart">${icon('restart', 18)} Start over</button>
    </div>`;
  $('#modeBody').innerHTML = `
    <div class="sweep-box" id="box" tabindex="0" aria-label="Braille line. Arrow keys move cell by cell.">
      <div class="edge left"></div><div class="edge right"></div>
      <div class="sweep-track" id="track"></div>
      <div class="reader" id="reader"></div>
      <div class="finger" id="finger"></div>
      <div class="sweep-hint" id="hint">put your finger on the line and slide right</div>
    </div>
    <div class="sweep-settings" id="swSet">
      <div class="set-row"><span>Braille</span>${radios('swGrade', [[1, 'Grade 1'], [2, 'Grade 2']], S.swGrade)}</div>
      <div class="set-row"><span>Cell size</span>${radios('swSize', [['large', 'Large'], ['real', 'Real size']], S.swSize)}</div>
      <label class="set-row switch ${canVibrate ? '' : 'disabled'}"><span>Vibrate on dots${canVibrate ? '' : '<small>Not available here: only Android phones let websites vibrate. iPhones, iPads and computers don’t.</small>'}</span><input type="checkbox" data-set="swVibe" ${canVibrate && S.swVibe ? 'checked' : ''} ${canVibrate ? '' : 'disabled'}></label>
    </div>`;
  bindRadios($('#swSet'), (k, v) => setS(k, k === 'swGrade' ? Number(v) : v));
  $('#swSet [data-set]').onchange = (e) => setS('swVibe', e.target.checked);
  const box = $('#box'), track = $('#track'), finger = $('#finger'), reader = $('#reader');
  let cells = [], lefts = [], widths = [], totalW = 0, offset = 0, headX = 0, W = 0;
  let lastKey = '', curIdx = -1, raf = 0, edgeRaf = 0, active = false;

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
      : `<div class="sc kind-${c.kind}" data-i="${i}">${cellHTML(c.cell, '', { kind: kindOf(c) })}<span class="lbl">${esc(c.idx === 0 ? (c.print || '·') : '')}</span></div>`).join('');
    requestAnimationFrame(() => { measure(); reset(); });
  }
  function measure() {
    const els = $$('.sc', track);
    lefts = els.map((e) => e.offsetLeft); widths = els.map((e) => e.offsetWidth);
    totalW = track.scrollWidth; W = box.clientWidth;
  }
  const startOffset = () => Math.round(W * 0.16);
  function reset() { offset = startOffset(); headX = Math.round(W * 0.1); lastKey = ''; curIdx = -1; update(false); }
  const clamp = () => { offset = Math.max(Math.min(startOffset(), W * 0.5 - totalW), Math.min(startOffset(), offset)); };

  function update(feedback = true) {
    clamp();
    track.style.transform = `translateX(${offset}px)`;
    reader.style.left = headX + 'px'; finger.style.left = headX + 'px';
    box.classList.toggle('active', active);
    const pos = headX - offset;
    let idx = -1;
    for (let i = 0; i < cells.length; i++) if (pos >= lefts[i] && pos < lefts[i] + widths[i]) { idx = i; break; }
    $$('.sc', track).forEach((el, i) => el.classList.toggle('passed', lefts[i] + widths[i] < pos));
    if (idx !== curIdx) {
      $$('.sc.cur', track).forEach((e) => e.classList.remove('cur'));
      if (idx >= 0 && cells[idx].kind !== 'space') track.children[idx].classList.add('cur');
      curIdx = idx;
    }
    const c = cells[idx];
    if (feedback && c && c.kind !== 'space' && S.swVibe && canVibrate) {
      const col = (pos - lefts[idx]) / widths[idx] < 0.5 ? 0 : 1;
      const key = idx + ':' + col;
      if (key !== lastKey) {
        lastKey = key;
        const dots = toDots(c.cell).filter((d) => (col === 0 ? d <= 3 : d >= 4 && d <= 6));
        if (dots.length) { const pat = []; dots.forEach(() => pat.push(14, 18)); try { navigator.vibrate(pat); } catch {} }
      }
    }
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
    if (cells[i]) animateTo(headX - (lefts[i] + widths[i] * 0.3));
  });
  function animateTo(target) {
    const start = offset, t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / 420); offset = start + (target - start) * (1 - Math.pow(1 - k, 3)); update(); if (k < 1) raf = requestAnimationFrame(step); };
    cancelAnimationFrame(raf); raf = requestAnimationFrame(step);
  }
  $('#restart').onclick = () => { headX = Math.round(W * 0.1); animateTo(startOffset()); };
  $('#shuffleBtn').onclick = () => { text = textFor(); build(); };
  $('#editBtn').onclick = editText;
  const onResize = () => { const p = headX - offset; measure(); headX = Math.min(headX, W); offset = headX - p; update(false); };
  const onSet = (e) => { if (['swGrade', 'swSize'].includes(e.detail)) build(); };
  window.addEventListener('resize', onResize); window.addEventListener('settings', onSet);
  syncHead(); build();
  return () => { active = false; cancelAnimationFrame(raf); cancelAnimationFrame(edgeRaf); window.removeEventListener('resize', onResize); window.removeEventListener('settings', onSet); };
}

// ---------- signs ----------
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
  if (/^men|women|hommes|femmes/.test(w)) return SIGN_ICONS.person;
  if (/exit|sortie|way out/.test(w)) return SIGN_ICONS.exit;
  if (/stair|escalier/.test(w)) return SIGN_ICONS.stairs;
  if (/elev|lift|ascen|main floor/.test(w)) return SIGN_ICONS.elevator;
  if (/info|accueil/.test(w)) return SIGN_ICONS.info;
  if (/fire|alarm/.test(w)) return SIGN_ICONS.fire;
  if (/room|office|platform|salle|entr/.test(w)) return SIGN_ICONS.door;
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
const textList = (pairs) => `<div class="prose-list">${pairs.map(([t, p]) => `<h4>${esc(t)}</h4><p>${esc(p)}</p>`).join('')}</div>`;
function kanaTable() {
  return JAPANESE.rows.map(([n, r]) => `<div class="group-title"><h3>${n}</h3></div><div class="sym-grid">${r.map(([p, c]) => `<div class="sym"><span class="cells">${cellHTML(c)}</span><b>${p}</b></div>`).join('')}</div>`).join('');
}
function signsSection(regionKey) {
  const region = SIGN_REGIONS[regionKey] ? regionKey : (SIGN_REGIONS[store.get('signRegion')] ? store.get('signRegion') : 'ca');
  store.set('signRegion', region);
  const R = SIGN_REGIONS[region];
  const lang = R.signLang || 'en';
  const grade = R.signLang ? 1 : 2;
  const parts = [];
  if (region === 'jp') parts.push(['sg-kana', 'Kana braille', `<p class="lead-p">${esc(JAPANESE.blurb)}</p>${kanaTable()}`]);
  else parts.push(['sg-read', 'Read these signs', `<div class="sign-gallery">${R.signs.map((s) => plateHTML(s, lang, grade)).join('')}${(R.bilingual || []).map(([en, fr]) => plateHTML(en, 'en', 2, [fr, 'fr'], 'light')).join('')}</div><p class="muted small">Tap a sign to see what each cell means. ${esc(R.note || 'Shown in UEB Grade 2, the way new signs are made.')}</p>`]);
  parts.push(['sg-how', 'How it works here', textList(R.facts)]);
  if (R.room) parts.push(['sg-anatomy', 'Anatomy of a room sign', `<div class="anatomy">${plateHTML(R.room, lang, grade)}<ol>
      <li>Raised capitals or a pictogram you can feel.</li>
      <li>Braille directly <b>below</b>, starting at the left.</li>
      <li>A capital sign, then the word${grade === 2 ? ' — often contracted' : ''}.</li>
      <li>A number sign before the digits.</li>
      <li>Mounted on the handle side of the door, at about shoulder height.</li></ol></div>`]);
  if (R.elevator) parts.push(['sg-elevator', 'Elevator buttons', `<div class="elev-wrap"><div class="elevator">
      ${[['★', 'main'], ['3', '3'], ['2', '2'], ['1', '1'], ['◁▷', 'open'], ['▷◁', 'close'], ['bell', 'alarm']].map(([face, word]) => {
        const cs = unicodeOf(translate(word, 'en', 2)).replace(/ /g, '⠀');
        return `<span class="eb">${[...cs].map((c) => cellHTML(c)).join('')}</span><span class="ebtn">${face === 'bell' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zm-2 15a2 2 0 0 0 4 0z"/></svg>' : face}</span>`;
      }).join('')}
    </div><div class="elev-text">
      <p>Braille sits beside each button, usually on the left. Floors use the number sign: ${cellHTML(IND.number, 'sm')}${cellHTML(LETTERS.b, 'sm')} = 2.</p>
      <p>★ is the main floor, spelled <b>main</b>: ${cellsHTML(unicodeOf(translate('main', 'en', 2)), 'sm')} (m-a-<span class="acc">in</span>).</p>
      <p>“Open” is ${cellsHTML(unicodeOf(translate('open', 'en', 2)), 'sm')} (o-p-<span class="acc">en</span>); “alarm” uses <span class="acc">ar</span>: ${cellsHTML(unicodeOf(translate('alarm', 'en', 2)), 'sm')}.</p>
      <p class="muted small">Outside, the same numbers are on both sides of the door frame.</p></div></div>`]);
  if (R.money) parts.push(['sg-money', 'Feel your money', `<p>Canadian notes carry raised cell-shaped clusters in the top corner. Count them:</p><div class="money">${[5, 10, 20, 50, 100].map((v, i) => `<div class="note"><span>${cellHTML(fromDots('123456'), 'sm').repeat(i + 1)}</span><b>$${v}</b></div>`).join('')}</div>`]);
  if (R.tips) parts.push(['sg-tips', 'Field tips', textList(R.tips)]);
  return {
    jumps: parts.map(([id, t]) => ({ value: id, label: t })),
    html: `<div class="picker"><div id="regionDD"></div></div>
      ${parts.map(([id, t, h]) => `<div class="sg" id="${id}"><h3 class="sg-h">${t}</h3>${h}</div>`).join('')}`,
    bind: () => {
      dropdown($('#regionDD'), { label: 'Region', options: Object.entries(SIGN_REGIONS).map(([k, r]) => ({ value: k, label: r.name })), value: region, onChange: (v) => { location.hash = '#/reference/signs/' + v; } });
      $$('.plate').forEach((p) => p.addEventListener('click', () => p.classList.toggle('decoded')));
    },
  };
}


// ---------- grade 2: compact tables ----------
const SHORT_SPELL = {
  about: 'ab', above: 'abv', according: 'ac', across: 'acr', after: 'af', afternoon: 'afn', afterward: 'afw', again: 'ag',
  against: 'ag-st', almost: 'alm', already: 'alr', also: 'al', although: 'al-th', altogether: 'alt', always: 'alw',
  because: 'be-c', before: 'be-f', behind: 'be-h', below: 'be-l', beneath: 'be-n', beside: 'be-s', between: 'be-t', beyond: 'be-y',
  blind: 'bl', braille: 'brl', children: 'ch-n', conceive: 'con-cv', conceiving: 'con-cvg', could: 'cd', deceive: 'dcv',
  deceiving: 'dcvg', declare: 'dcl', declaring: 'dclg', either: 'ei', first: 'f-st', friend: 'fr', good: 'gd', great: 'grt',
  herself: 'h-er-f', him: 'hm', himself: 'hmf', immediate: 'imm', its: 'xs', itself: 'xf', letter: 'lr', little: 'll',
  much: 'm-ch', must: 'm-st', myself: 'myf', necessary: 'nec', neither: 'nei', oneself: 'one-f', ourselves: 'ou-rvs',
  paid: 'pd', perceive: 'p-er-cv', perceiving: 'p-er-cvg', perhaps: 'p-er-h', quick: 'qk', receive: 'rcv', receiving: 'rcvg',
  rejoice: 'rjc', rejoicing: 'rjcg', said: 'sd', should: 'sh-d', such: 's-ch', themselves: 'the-mvs', thyself: 'th-yf',
  today: 'td', together: 'tgr', tomorrow: 'tm', tonight: 'tn', would: 'wd', your: 'yr', yourself: 'yrf', yourselves: 'yrvs',
};
const G2_EXAMPLE = {
  ch: 'chip', gh: 'laugh', sh: 'shy', th: 'myth', wh: 'whip', ed: 'edit', er: 'verb', ou: 'loud', ow: 'owl', st: 'stop',
  ar: 'park', ing: 'sing', and: 'sand', for: 'form', of: 'often', the: 'other', with: 'without',
  ound: 'pound', ance: 'dance', sion: 'mansion', less: 'useless', ount: 'mount', ence: 'fence', ong: 'song', ful: 'joyful',
  tion: 'nation', ness: 'madness', ment: 'moment', ity: 'city',
};
const G2_START = ['and', 'for', 'of', 'the', 'with', 'but', 'can', 'do', 'it', 'that', 'you', 'ing', 'st', 'sh', 'th', 'ch', 'er', 'ed'];
function grade2Section() {
  const cats = Object.entries(CONTRACTIONS);
  const row = (e, i) => {
    const note = e.cat === 'Shortforms' ? (SHORT_SPELL[e.print] || '') : (e.note || (G2_EXAMPLE[e.print] ? 'e.g. ' + G2_EXAMPLE[e.print] : ''));
    return `<button class="crow" data-i="${i}"><span class="cells">${[...e.cells].map((c) => cellHTML(c, '', { kind: 'contraction' })).join('')}</span><b>${esc(e.print)}</b><span class="cdots">${[...e.cells].map((c) => toDots(c).join('')).join(' ')}</span><span class="cnote">${esc(note)}</span></button>`;
  };
  const sample = 'The children went to the park with their father.';
  const g1 = unicodeOf(translate(sample, 'en', 1)).replace(/ /g, '').length;
  const g2 = unicodeOf(translate(sample, 'en', 2)).replace(/ /g, '').length;
  const html = `
    <p class="lead-p">Grade 2 uses about 180 contractions to make braille shorter. Most books and public signs in Canada use it. Many cells mean different things alone versus inside a word, so each table notes where a sign may go.</p>
    <div class="g2-compare">
      <div><small>Grade 1 · ${g1} cells</small>${lineHTML(translate(sample, 'en', 1), { labels: false, cls: 'sm' })}</div>
      <div><small>Grade 2 · ${g2} cells</small>${lineHTML(translate(sample, 'en', 2), { cls: 'sm' })}</div>
    </div>
    <h3 class="sg-h">Start with these</h3>
    <p class="muted small">The most frequent signs. Learn a few at a time, then practise them in Practice → Contractions.</p>
    <div class="sym-grid compact">${G2_START.map((w) => { const i = DICT.findIndex((e) => e.print === w && e.group !== 'Letters'); return symHTML(DICT[i], i); }).join('')}</div>
    ${cats.map(([cat, { blurb }], ci) => `<div class="sg" id="g2-${ci}"><div class="group-title"><h3>${esc(cat)}</h3><span>${CONTRACTIONS[cat].items.length} · ${esc(blurb)}</span></div>
      <div class="ctable">${DICT.map((e, i) => [e, i]).filter(([e]) => e.group === cat).map(([e, i]) => row(e, i)).join('')}</div></div>`).join('')}`;
  return { html, jumps: cats.map(([cat, { items }], ci) => ({ value: 'g2-' + ci, label: cat, hint: items.length + ' signs' })) };
}

// ---------- reference ----------
const REF_SECTIONS = [
  ['alphabet', 'Alphabet'], ['numbers', 'Numbers & symbols'], ['grade2', 'Grade 2'], ['signs', 'Signs'],
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
    <div class="cell-anatomy">${cellHTML(fromDots('123456'), 'numbered')}<div><h3>How a cell works</h3><p class="muted">Dots 1-2-3 run down the left, 4-5-6 down the right. A real cell is about 6 mm tall — one fingertip. You read by gliding, not pressing.</p></div></div>`;
}
// Full character table for a language, shown in a modal from World systems or Languages.
function charsTable(k) {
  if (k === 'ja') return `<p class="muted">${esc(JAPANESE.blurb)}</p>${kanaTable()}`;
  const info = LANG_INFO[k];
  return `<p class="muted">${esc(info.blurb)}</p>
    <div class="group-title"><h3>Letters</h3></div>
    <div class="sym-grid">${[...info.letters].map((l) => `<div class="sym"><span class="cells">${cellsK(translate(l, k, 1)[0].cells, 'letter')}</span><b>${l}</b></div>`).join('')}</div>
    <div class="group-title"><h3>Digits</h3></div>
    <div class="sym-grid">${'1234567890'.split('').map((d) => `<div class="sym"><span class="cells">${cellsK(unicodeOf(translate(d, k, 1)), 'digit')}</span><b>${d}</b></div>`).join('')}</div>`;
}
const LANG_NAMES = () => ({ ...Object.fromEntries(Object.keys(LANG_INFO).map((k) => [k, k === 'en' ? 'English (UEB)' : LANGS[k].name])), ja: '日本語 Japanese' });
function languagesSection() {
  return { html: '<div class="picker"><div id="langDD"></div></div><div id="langBody"></div>', bind: () => {
    const render = (k) => {
      store.set('refLang', k);
      const body = $('#langBody');
      if (k === 'ja') { body.innerHTML = charsTable('ja'); return; }
      const info = LANG_INFO[k];
      body.innerHTML = `${charsTable(k)}
        <div class="group-title"><h3>Phrases</h3><span>${k === 'en' ? 'Grade 2' : 'uncontracted'}</span></div>
        <div class="example-grid">${info.phrases.map((p) => `<a class="example" href="#/translate?lang=${k}&text=${encodeURIComponent(p)}"><div class="print">${esc(p)}</div>${lineHTML(translate(p, k, k === 'en' ? 2 : 1), { cls: 'sm' })}</a>`).join('')}</div>`;
    };
    const v = store.get('refLang', 'en');
    dropdown($('#langDD'), { label: 'Language', options: Object.entries(LANG_NAMES()).map(([value, label]) => ({ value, label })), value: v, onChange: render });
    render(v);
  } };
}
function systemsSection() {
  return { html: `<p class="lead-p">The braille family: the codes you’re likely to meet, plus special-purpose and tactile cousins. Tap a row to expand it.</p>
    ${SYSTEMS.map((g) => `<div class="group-title"><h3>${esc(g.group)}</h3></div><div class="acc-list">${g.items.map(([n, w, d, chars]) => `
      <details class="acc-item"><summary><span><b>${esc(n)}</b><small>${esc(w)}</small></span>${icon('chevron', 20)}</summary>
      <div class="acc-body"><p>${esc(d)}</p>${chars ? `<button class="btn small-btn" data-chars="${chars}">See all characters ${icon('right', 16)}</button>` : ''}</div></details>`).join('')}</div>`).join('')}`,
    bind: () => { $$('[data-chars]').forEach((b) => { b.onclick = () => openSheet(charsTable(b.dataset.chars), { title: LANG_NAMES()[b.dataset.chars] }); }); },
  };
}
function scienceSection() {
  const ex = (s) => `<div class="example"><div class="print">${esc(s.print)}</div>${groupsHTML(s.g)}</div>`;
  return { html: `<p class="lead-p">UEB uses extra indicators for technical material. Each group of cells is labelled below. In Grade 2 text a grade 1 indicator ⠰ often goes before superscript ⠔ and subscript ⠢ so they aren’t read as “in” and “en”; these examples are in Grade 1 mode.</p>
    <div class="example-grid">${SCIENCE.map(ex).join('')}</div>
    <div class="group-title"><h3>Nemeth Code</h3><span>still used for maths in many Canadian and US schools</span></div>
    <div class="example-grid">${NEMETH.map(ex).join('')}</div>
    <hr class="pale">
    <div class="group-title"><h3>Symbols used above</h3><span>UEB</span></div>
    <div class="sym-grid">${SCIENCE_SYMBOLS.map(([c, n]) => `<div class="sym"><span class="cells">${cellsK(c, 'math')}</span><b>${esc(n)}</b></div>`).join('')}</div>` };
}
function refSection(key, sub) {
  switch (key) {
    case 'alphabet': return { html: alphabetSection() };
    case 'numbers': return { html: `<p class="lead-p">Numbers, punctuation and the indicators that change how the next cells are read.</p>${groupBlock('Numbers', 'Numbers', 'number sign ⠼ + a–j')}${groupBlock('Punctuation', 'Punctuation & symbols')}${groupBlock('Indicators', 'Indicators')}` };
    case 'grade2': return grade2Section();
    case 'signs': return signsSection(sub);
    case 'science': return scienceSection();
    case 'languages': return languagesSection();
    case 'systems': return systemsSection();
    case 'history': return { html: `<ol class="timeline">${HISTORY.map(([y, t]) => `<li><b>${y}</b>${esc(t)}</li>`).join('')}</ol>` };
  }
  return { html: '' };
}

views.reference = (q, sub, sub2) => {
  const key = REF_SECTIONS.find(([k]) => k === sub) ? sub : store.get('refSec', 'alphabet');
  store.set('refSec', key);
  const i = REF_SECTIONS.findIndex(([k]) => k === key);
  const sec = refSection(key, sub2);
  setTitle('Reference');
  setSub(`<div id="secDD" class="dd-strong"></div>${sec.jumps ? '<div id="jumpDD" class="dd-right"></div>' : ''}`);
  dropdown($('#secDD'), { options: REF_SECTIONS.map(([k, t]) => ({ value: k, label: t })), value: key, onChange: (v) => { location.hash = '#/reference/' + v; } });
  if (sec.jumps) dropdown($('#jumpDD'), { label: 'Jump to', options: sec.jumps, value: null, onChange: (v) => { const el = document.getElementById(v); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  view.innerHTML = `${sec.html}
      <div class="pager">${i > 0 ? `<a href="#/reference/${REF_SECTIONS[i - 1][0]}">← ${REF_SECTIONS[i - 1][1]}</a>` : '<span></span>'}${i < REF_SECTIONS.length - 1 ? `<a href="#/reference/${REF_SECTIONS[i + 1][0]}">${REF_SECTIONS[i + 1][1]} →</a>` : ''}</div>`;
  if (sec.bind) sec.bind();
  view.onclick = (ev) => {
    const s = ev.target.closest('.sym[data-i], .crow[data-i]'); if (s) { openSheet(symbolDetail(DICT[Number(s.dataset.i)]), { title: 'Symbol' }); return; }
    const l = ev.target.closest('.letter[data-l]'); if (l) openSheet(letterDetail(l.dataset.l), { title: 'Letter ' + l.dataset.l });
  };
  return () => { view.onclick = null; };
};

// ---------- global search ----------
let INDEX = null;
function buildIndex() {
  const out = [];
  const nav = (h) => () => { closeSearch(); location.hash = h; };
  DICT.forEach((e, i) => out.push({
    title: e.print, sub: e.group === 'Letters' ? 'Letter' : e.cat + (e.note && e.note.length < 40 ? ' · ' + e.note : ''), cells: e.cells, kind: e.kind,
    sec: SEC_OF_GROUP[e.group] || 'grade2', dict: e,
    act: () => openSheet(e.group === 'Letters' ? letterDetail(e.print) : symbolDetail(e), { title: e.group === 'Letters' ? 'Letter ' + e.print : 'Symbol' }),
  }));
  REF_SECTIONS.forEach(([k, t]) => out.push({ title: t, sub: 'Reference section', sec: k, page: true, act: nav('#/reference/' + k) }));
  Object.entries(MODES).forEach(([k, t]) => out.push({ title: t, sub: 'Practice mode', sec: 'practice', page: true, act: nav('#/practice/' + k) }));
  SCIENCE_SYMBOLS.forEach(([c, n]) => out.push({ title: n, sub: 'Maths & science symbol', cells: c, kind: 'math', sec: 'science', act: nav('#/reference/science') }));
  for (const k of ['fr', 'es', 'de', 'ru', 'el']) {
    for (const l of LANG_INFO[k].letters) {
      if (/[a-z]/.test(l)) continue;
      out.push({ title: l, sub: LANGS[k].name + ' letter', cells: translate(l, k, 1)[0].cells, kind: 'letter', sec: 'languages', act: () => openSheet(charsTable(k), { title: LANG_NAMES()[k] }) });
    }
  }
  for (const [rk, r] of Object.entries(SIGN_REGIONS)) for (const w of r.signs) out.push({ title: w, sub: 'Sign · ' + r.name, cells: unicodeOf(translate(w, r.signLang || 'en', r.signLang ? 1 : 2)), sec: 'signs', act: nav('#/reference/signs/' + rk) });
  for (const g of SYSTEMS) for (const [n, w] of g.items) out.push({ title: n, sub: 'World system · ' + w, sec: 'systems', act: nav('#/reference/systems') });
  for (const [y, t] of HISTORY) out.push({ title: String(y), sub: t, sec: 'history', act: nav('#/reference/history') });
  return out;
}
const curSec = () => (document.body.dataset.page === 'reference' ? store.get('refSec', 'alphabet') : document.body.dataset.page);
function searchResults(raw) {
  INDEX = INDEX || buildIndex();
  const s = raw.trim().toLowerCase();
  const isDots = /^[1-6][1-6\s-]*$/.test(s), isBraille = /^[⠀-⣿]+$/.test(raw.trim());
  const here = curSec();
  const scored = [];
  for (const e of INDEX) {
    let sc = 0;
    const t = e.title.toLowerCase();
    if (isDots) { if (e.cells && [...e.cells].map((c) => toDots(c).join('')).join(' ').includes(s.replace(/-/g, ''))) sc = 50; }
    else if (isBraille) { if (e.cells && e.cells.includes(raw.trim())) sc = e.cells === raw.trim() ? 100 : 50; }
    else if (t === s) sc = 100; else if (t.startsWith(s)) sc = 60; else if (s.length > 1 && t.includes(s)) sc = 35; else if (s.length > 2 && e.sub.toLowerCase().includes(s)) sc = 12;
    if (!sc) continue;
    if (e.sec === here) sc += 25;
    if (e.page) sc += 5;
    scored.push([sc, e]);
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, 60).map(([, e]) => e);
}
const searchBar = $('#searchBar'), searchPanel = $('#searchPanel');
function openSearch() {
  searchBar.hidden = false; syncHeadH();
  const q = $('#gq'); q.focus(); if (q.value) renderSearch();
}
function closeSearch() { searchBar.hidden = true; searchPanel.hidden = true; $('#gq').value = ''; syncHeadH(); }
let RESULTS = [];
function renderSearch() {
  const raw = $('#gq').value;
  if (!raw.trim()) { searchPanel.hidden = true; return; }
  RESULTS = searchResults(raw);
  const secName = Object.fromEntries([...REF_SECTIONS, ['practice', 'Practice']]);
  const tr = /[a-z]/i.test(raw) && !/^[1-6\s-]+$/.test(raw) ? `<a class="sr tr" href="#/translate?lang=en&text=${encodeURIComponent(raw)}"><span class="sr-cells">${lineHTML(translate(raw, 'en', 2), { labels: false, cls: 'sm' })}</span><span class="sr-text"><b>Translate “${esc(raw)}”</b><small>English Grade 2</small></span></a>` : '';
  searchPanel.innerHTML = `<div class="sp-inner">${RESULTS.length ? `<div class="sr-list">${RESULTS.map((e, i) => `<button class="sr" data-r="${i}"><span class="sr-cells">${e.cells ? cellsK(e.cells, e.kind || '', 'sm') : icon(e.page ? 'book' : 'right', 18)}</span><span class="sr-text"><b>${esc(e.title)}</b><small>${esc(e.sub.length > 90 ? e.sub.slice(0, 88) + '…' : e.sub)}</small></span><span class="sr-sec">${esc(secName[e.sec] || '')}</span></button>`).join('')}</div>` : '<p class="muted">Nothing matches. Try a word, a symbol, or dot numbers like 1456.</p>'}${tr}</div>`;
  searchPanel.hidden = false;
}
$('#gq').addEventListener('input', renderSearch);
$('#gq').addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearch(); if (e.key === 'Enter') { const b = $('.sr', searchPanel); if (b) b.click(); } });
$('#searchClose').onclick = closeSearch;
searchPanel.addEventListener('click', (e) => {
  const b = e.target.closest('[data-r]'); if (b) { const r = RESULTS[Number(b.dataset.r)]; r.act(); return; }
  if (e.target.closest('a.sr')) { closeSearch(); return; }
  if (e.target === searchPanel) closeSearch();
});
$('#searchBtn').onclick = () => (searchBar.hidden ? openSearch() : closeSearch());

// ---------- translate ----------
views.translate = (q) => {
  const LOPTS = [['en1', 'English · Grade 1', 'English'], ['en2', 'English · Grade 2', 'English'], ['fr', 'Français', 'Other languages'], ['es', 'Español', 'Other languages'], ['de', 'Deutsch', 'Other languages'], ['ru', 'Русский', 'Other languages'], ['el', 'Ελληνικά', 'Other languages']];
  let mode = q.get('lang') ? (q.get('lang') === 'en' ? 'en2' : q.get('lang')) : store.get('trMode', 'en2');
  const initial = q.get('text') || store.get('trText', 'Welcome to Canada. The washroom is on floor 2.');
  setTitle('Translate');
  setSub('<div id="langDD" class="dd-strong"></div><div id="exDD" class="dd-right"></div>');
  view.innerHTML = `
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
    dropdown($('#langDD'), { options: LOPTS.map(([v, l, g]) => ({ value: v, label: l, group: g })), value: mode, onChange: (v) => { mode = v; render(); syncDD(); } });
    dropdown($('#exDD'), { label: 'Examples', options: LANG_INFO[exLang()].phrases.map((p) => ({ value: p, label: p })), value: null, onChange: (v) => { inp.value = v; render(); } });
  };
  inp.oninput = render;
  $('#trCopy').onclick = async () => { try { await navigator.clipboard.writeText($('#trOut').dataset.uni); $('#trCopy').textContent = 'Copied ✓'; setTimeout(() => ($('#trCopy').textContent = 'Copy braille'), 1400); } catch {} };
  $('#trSweep').onclick = () => { store.set('swCustom', inp.value.slice(0, 200)); store.set('swSrc', 'custom'); };
  syncDD(); render();
};

// ---------- router ----------
let cleanup = null;
const TITLES = { '': 'Learn Braille', practice: 'Practice · Learn Braille', reference: 'Reference · Learn Braille', translate: 'Translate · Learn Braille' };
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
  closeSheet(); closeDD(); if (!searchBar.hidden) closeSearch();
  document.body.dataset.page = key || 'home';
  const r = views[key](q, sub, sub2);
  cleanup = typeof r === 'function' ? r : null;
  $$('[data-route]').forEach((a) => a.classList.toggle('active', a.dataset.route === key));
  window.scrollTo(0, 0);
  document.title = TITLES[key];
}
window.addEventListener('hashchange', route);
window.addEventListener('scroll', () => $('.top').classList.toggle('scrolled', scrollY > 4), { passive: true });
$$('[data-icon]').forEach((el) => { el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)); });
$('#settingsBtn').onclick = openSettings;
window.addEventListener('resize', syncHeadH);
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
applySettings();
route();
