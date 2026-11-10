import {
  LETTERS, IND, UEB_PUNCT, CONTRACTIONS, cellsOf, fromDots, toDots, dotsLabel,
  translate, toCells, unicodeOf, LANGS,
} from './braille.js?v=15';
import {
  SIGN_WORDS, WORDS, SENTENCES, SCIENCE, SCIENCE_SYMBOLS, NEMETH, LANG_INFO, JAPANESE, SYSTEMS, HISTORY, SIGN_REGIONS,
} from './data.js?v=15';
import { GAMES, GAME_GROUPS, gameStore } from './games.js?v=15';

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
  alpha: '<path d="M3 19 8 5l5 14"/><path d="M5 14h6"/><path d="M15 11.5c.5-1 1.4-1.5 2.5-1.5 1.7 0 2.5 1 2.5 2.6V19"/><path d="M20 15.2c-.6-.5-1.5-.7-2.5-.7-1.5 0-2.7.8-2.7 2.2s1 2.3 2.4 2.3c1.3 0 2.3-.7 2.8-1.6"/>',
  hash: '<path d="M5 9h15M4 15h15M10 3 8 21M16 3l-2 18"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  sign: '<path d="M12 3v18"/><path d="M5 6h12l3 3-3 3H5z"/><path d="M9 21h6"/>',
  sigma: '<path d="M18 5H6l6 7-6 7h12"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
  map: '<path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.5"/>',
  read: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  write: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  words: '<path d="M4 7V5h16v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
  games: '<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7 10.5v4M5 12.5h4"/><circle cx="15.5" cy="11.5" r=".9" fill="currentColor"/><circle cx="18" cy="13.8" r=".9" fill="currentColor"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  gallows: '<path d="M4 21h10M7 21V3h9v3"/><circle cx="16" cy="8.5" r="2.5"/><path d="M16 11v5M16 13l-2.5 2M16 13l2.5 2"/>',
  key: '<circle cx="8" cy="15" r="4.5"/><path d="m11.5 11.5 8-8M16.5 6.5l2.5 2.5M14 9l2 2"/>',
  rain: '<circle cx="6" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="10" r="1.5" fill="currentColor"/><circle cx="18" cy="4" r="1.5" fill="currentColor"/><circle cx="8" cy="15" r="1.5" fill="currentColor"/><path d="M3 21h18"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M9.5 2.5h5M19 6l-1.5 1.5"/>',
  mirror: '<path d="M12 3v18" stroke-dasharray="2 2.5"/><circle cx="7" cy="8" r="1.6" fill="currentColor"/><circle cx="7" cy="13" r="1.6" fill="currentColor"/><circle cx="17" cy="8" r="1.6" fill="currentColor"/><circle cx="17" cy="13" r="1.6" fill="currentColor"/><circle cx="4" cy="8" r="1.6"/><circle cx="20" cy="8" r="1.6"/>',
  cards: '<rect x="3" y="5" width="10" height="14" rx="2"/><rect x="11" y="3" width="10" height="14" rx="2" fill="var(--bg, #fff)"/>',
  maze: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h6v6M15 3v6h-3M21 15h-6v6M9 21v-3"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/>',
  keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M6 13.5h.01M18 13.5h.01M9 14h6"/>',
  github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
  sweep: '<circle cx="5" cy="8" r="1.6" fill="currentColor"/><circle cx="10" cy="8" r="1.6" fill="currentColor"/><circle cx="15" cy="8" r="1.6" fill="currentColor"/><path d="M3 16h15"/><path d="m15 13 3 3-3 3"/>',
};
const icon = (n, size = 22) => `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;

// ---------- settings ----------
const DEFAULTS = { theme: 'auto', color: true, dotFill: 'outline', swGrade: 1, swSize: 'large', swVibe: true };
const S = { ...DEFAULTS, ...store.get('settings', {}) };
const canVibrate = 'vibrate' in navigator && matchMedia('(pointer: coarse)').matches;
function applySettings() {
  const r = document.documentElement;
  if (S.theme === 'auto') delete r.dataset.theme; else r.dataset.theme = S.theme;
  const b = document.body.classList;
  b.toggle('s-color', S.color); b.toggle('s-dotfill', S.dotFill === 'fill'); b.toggle('s-sw-real', S.swSize === 'real');
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
const cellsHTML = (str, cls = '') => [...str].map((c) => (c === ' ' || c === '⠀' ? '<span class="bw space"><span class="cell" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span></span>' : cellHTML(c, cls))).join('');
function lineHTML(parts, { labels = true, cls = '' } = {}) {
  let out = '', word = '';
  const flush = () => { if (word) out += `<span class="bword">${word}</span>`; word = ''; };
  for (const c of toCells(parts)) {
    if (c.kind === 'newline') { flush(); out += '<span class="bw-break"></span>'; continue; }
    if (c.kind === 'space') { word += '<span class="bw space"><span class="cell" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span></span>'; flush(); continue; }
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
// Compact row: cells · label · dot numbers · note (a button when it opens a detail sheet).
function crowHTML(cells, label, { kind = '', note = '', i = null, added = null } = {}) {
  const tag = 'div';
  return `<${tag} class="crow"><span class="cells">${[...cells].map((c) => cellHTML(c, '', { kind, added })).join('')}</span><b>${esc(label)}</b><span class="cdots">${[...cells].map((c) => toDots(c).join('') || '0').join(' ')}</span><span class="cnote">${esc(note)}</span></${tag}>`;
}
// Tables holding any multi-cell symbol collapse to one column sooner, so every row in a section lines up.
function markMulti(root = document) { $$('.ctable', root).forEach((t) => t.classList.toggle('multi', !!t.querySelector('.cells .cell + .cell'))); }
// Labelled groups: "cells:label cells:label _ cells:label" (_ = space)
function groupsHTML(spec, cls = 'md', fixedKind = '') {
  return `<div class="braille-line groups">${spec.split(' ').map((g) => {
    if (g === '_') return '<span class="bw space"></span>';
    const i = g.indexOf(':');
    const cells = g.slice(0, i), label = g.slice(i + 1);
    const kind = fixedKind || (/^[a-z]$/i.test(label) ? 'letter' : /^[0-9.,#]+$/.test(label) ? 'digit' : /^(cap|caps)$/.test(label) ? 'indicator' : 'math');
    return `<span class="bgroup"><span class="mrow">${cellsK(cells, kind, cls)}</span><span class="lbl">${esc(label)}</span></span>`;
  }).join('')}</div>`;
}

// ---------- modal sheet ----------
const sheet = $('#sheet');
const backdrop = $('#sheetBackdrop');
function openSheet(html, { title = '' } = {}) {
  sheet.innerHTML = `<div class="sheet-head"><h2>${esc(title)}</h2><button class="icon-btn close" aria-label="Close">${icon('close', 20)}</button></div><div class="sheet-body">${html}</div>`;
  sheet.hidden = false; backdrop.hidden = false; markMulti(sheet);
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
function dropdown(el, { label = '', options, value, onChange, plain = false, lead = '' }) {
  const cur = options.find((o) => o.value === value);
  let lastGroup = null;
  el.classList.add('dd');
  el.innerHTML = `<button class="dd-btn" type="button" aria-haspopup="listbox">${lead ? `<span class="dd-lead">${icon(lead, 18)}</span>` : ''}${plain ? `<span class="dd-v">${esc(label)}</span>` : `${label ? `<span class="dd-k">${esc(label)}</span>` : ''}<span class="dd-v">${esc(cur ? cur.label : '…')}</span>`}${icon('chevron', 18)}</button>
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
    dropdown(el, { label, options, value: plain ? null : v, onChange, plain, lead });
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
const helpBtn = $('#helpBtn');
const subbar = $('#subbar');
const PAGE_ICON = { home: 'home', practice: 'practice', reference: 'book', games: 'games', translate: 'translate' };
const setTitle = (t) => { headTitle.innerHTML = `<span class="ht-ic">${icon(PAGE_ICON[document.body.dataset.page] || 'home', 22)}</span><span class="ht-t">${esc(t)}</span>`; };
const setSub = (html) => { subbar.innerHTML = html; subbar.hidden = !html; syncHeadH(); };
function syncHeadH() { requestAnimationFrame(() => document.documentElement.style.setProperty('--head-h', $('.top').offsetHeight + 'px')); }

// ---------- settings modal ----------
const COLOR_KEY = [['letter', 'Letters (Grade 1)'], ['digit', 'Numbers'], ['contraction', 'Contractions (Grade 2)'], ['punct', 'Punctuation'], ['indicator', 'Indicators'], ['math', 'Maths signs']];
function openSettings() {
  const pv = (mode) => `<span class="cell pv-${mode}" aria-hidden="true">${[1, 2, 3, 4, 5, 6].map((d) => `<i class="${[1, 4, 5].includes(d) ? 'on' : ''}"></i>`).join('')}</span>`;
  openSheet(`<div class="settings">
    <div class="set-group"><h3>General</h3>
      <div class="set-row stack"><span>Appearance</span>${radios('theme', [['auto', `${icon('auto', 18)}Auto`], ['light', `${icon('sun', 18)}Light`], ['dark', `${icon('moon', 18)}Dark`]], S.theme)}</div>
      <div class="set-row stack"><span>Unraised dots</span>${radios('dotFill', [['outline', `${pv('outline')}Outline`], ['fill', `${pv('fill')}Filled`]], S.dotFill)}</div>
      <div class="set-row stack"><span>Dot colours</span>${radios('color', [['1', 'Colour-coded'], ['0', 'Uniform']], S.color ? '1' : '0')}</div>
      <div class="color-key ${S.color ? '' : 'off'}">${COLOR_KEY.map(([k, l]) => `<span>${cellHTML('⠿', 'sm', { kind: k })}${l}</span>`).join('')}</div>
    </div>
    <div class="set-group"><h3>Your data</h3>
      <p class="set-note">Resetting clears everything this site has saved on this device: practice progress, the daily review, game scores and levels, and these settings.</p>
      <div class="row reset-row"><button class="btn" id="resetAll">Reset everything</button><button class="btn ghost" id="resetCancel" hidden>Cancel</button></div>
    </div>
    <div class="set-group about"><h3>About Learn Braille</h3><p>A resource for sighted folks to learn the braille writing system. Braille follows Unified English Braille unless noted. Made for learning — for official transcription, consult a certified braille transcriber.</p>
      <a class="gh-link" href="https://github.com/updownupdown/braille" target="_blank" rel="noopener">${icon('github', 16)} Source code on GitHub</a></div>
  </div>`, { title: 'Settings' });
  bindRadios($('.settings', sheet), (k, v) => {
    if (k === 'color') { setS('color', v === '1'); $('.color-key', sheet).classList.toggle('off', v !== '1'); return; }
    setS(k, typeof DEFAULTS[k] === 'number' ? Number(v) : v);
  });
  // Three taps to reset, with a way out.
  let taps = 0;
  const btn = $('#resetAll'), cancel = $('#resetCancel');
  const label = ['Reset everything', 'Tap 2 more times to confirm', 'Tap once more to erase everything'];
  const set = () => { btn.textContent = label[taps]; btn.classList.toggle('danger', taps > 0); cancel.hidden = taps === 0; };
  btn.onclick = () => {
    taps++;
    if (taps < 3) { set(); return; }
    try { Object.keys(localStorage).filter((k) => k.startsWith('dots.')).forEach((k) => localStorage.removeItem(k)); } catch {}
    btn.textContent = 'Everything reset ✓'; cancel.hidden = true; btn.disabled = true;
    setTimeout(() => location.reload(), 700);
  };
  cancel.onclick = () => { taps = 0; set(); };
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
  if (idx < 10) row = 'First row (a–j): only the top four dots. Every other row is built from this one.';
  else if (idx < 20) row = `Second row (k–t): ${'abcdefghij'[idx - 10]} plus the lower-left dot.`;
  else if (l === 'w') row = 'W is the odd one out: French had no w when braille was invented, so it was added later. It’s j plus the lower-right dot.';
  else row = `Third row: ${'abcdefghij'['uvxyz'.indexOf(l)]} plus both bottom dots.`;
  const m = mirrorLetter(l);
  return `<div class="detail">
    <div class="detail-top">${cellHTML(c, 'xl')}<div><div class="big">${l}</div><div class="muted dots-info">${dotsLabel(c)}</div></div></div>
    <p>${row}</p>
    <dl>
      ${DIGIT_OF[l] ? `<dt>As a number</dt><dd>After ${cellHTML(IND.number, 'sm')} it means <b>${DIGIT_OF[l]}</b></dd>` : ''}
      ${WORDSIGN_OF[c] ? `<dt>Grade 2</dt><dd>Alone, it means <b>“${WORDSIGN_OF[c]}”</b></dd>` : ''}
      <dt>Capital</dt><dd>${cellHTML(IND.capital, 'sm')}${cellHTML(c, 'sm')} = ${l.toUpperCase()}</dd>
      ${m ? `<dt>Don’t confuse</dt><dd>${cellHTML(LETTERS[m], 'sm')} <b>${m}</b> is its mirror image</dd>` : ''}
    </dl>
    <div class="row"><a class="btn primary" href="#/practice/read?cat=letters&set=${idx < 10 ? 'aj' : idx < 20 ? 'kt' : 'uz'}">Practise this row</a></div>
  </div>`;
}
function symbolDetail(e) {
  const cells = [...e.cells];
  return `<div class="detail">
    <div class="detail-top"><div class="row" style="gap:6px">${cells.map((c) => cellHTML(c, cells.length > 2 ? 'lg' : 'xl', { kind: e.kind })).join('')}</div></div>
    <h2>${esc(e.print)}</h2>
    <dl>
      <dt>Type</dt><dd>${esc(e.cat)}</dd>
      <dt class="dots-info">Dots</dt><dd class="dots-info">${cells.map((c) => toDots(c).join('') || '—').join(' · ')}</dd>
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
  ['italic', '46 23', 'Italic symbol (a different sign marks a whole italic word).'], ['bold', '45 23', 'Bold symbol.'],
];
for (const [p, d, n] of INDICATORS) DICT.push({ print: p, cells: cellsOf(d), cat: 'Indicator', note: n, group: 'Indicators' });
for (const [cat, { blurb, items }] of Object.entries(CONTRACTIONS)) for (const [p, d, n] of items) DICT.push({ print: p, cells: cellsOf(d), cat, note: n || '', blurb, group: cat });
const KIND_OF_GROUP = { Letters: 'letter', Numbers: 'digit', Punctuation: 'punct', Indicators: 'indicator' };
for (const e of DICT) e.kind = KIND_OF_GROUP[e.group] || 'contraction';
const SEC_OF_GROUP = { Letters: 'alphabet', Numbers: 'numbers', Punctuation: 'numbers', Indicators: 'numbers' };
const symHTML = (e, i) => `<button class="sym" data-i="${i}"><span class="cells">${[...e.cells].map((c) => cellHTML(c, '', { kind: e.kind })).join('')}</span><b>${esc(e.print)}</b>${e.note && e.note.length < 26 ? `<small>${esc(e.note)}</small>` : ''}</button>`;
const practiseLink = (href) => `<a class="gt-link" href="${href}">Practise ${icon('right', 16)}</a>`;
const groupBlock = (g, title, blurb, href) => `<div class="group-title"><h3>${title}</h3>${blurb ? `<span>${esc(blurb)}</span>` : ''}${href ? practiseLink(href) : ''}</div><div class="ctable narrow">${DICT.map((e, i) => [e, i]).filter(([e]) => e.group === g).map(([e, i]) => crowHTML(e.cells, e.print, { kind: e.kind, i, note: e.group === 'Numbers' ? '' : e.note })).join('')}</div>`;
// "Examples" block that closes a section: [print, note] pairs.
const exBlock = (list, grade = 1) => `<div class="ex-block"><h4 class="ex-h">Examples</h4><div class="example-grid">${list.map(([t, n]) => `<div class="example"><div class="print">${esc(t)}</div>${lineHTML(translate(t, 'en', grade), { cls: 'sm' })}${n ? `<p class="muted small ex-note">${esc(n)}</p>` : ''}</div>`).join('')}</div></div>`;

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
const PROG_GROUPS = () => [
  ['Letters', CATS.letters.sets.az[1](), 'letters', 'az'], ['Numbers', CATS.symbols.sets.num[1](), 'symbols', 'num'],
  ['Punctuation', CATS.symbols.sets.punct[1](), 'symbols', 'punct'], ['Maths & money', CATS.symbols.sets.signs[1](), 'symbols', 'signs'],
  ['Indicators', CATS.symbols.sets.ind[1](), 'symbols', 'ind'], ['Contractions', CATS.contractions.sets.all[1](), 'contractions', 'all'],
];
function progressHTML() {
  const m = mastery();
  const groups = PROG_GROUPS();
  const known = (pre, items) => items.filter((x) => (m[pre + x.key] || 0) >= 4).length;
  let got = 0, all = 0;
  const tally = (mode, pre, items, cat, set) => {
    const k = known(pre, items); got += k; all += items.length;
    return `<a class="tally" href="#/practice/${mode}?cat=${cat}&set=${set}"><span class="t-num"><b>${k}</b> / ${items.length}</span><span class="t-bar"><i style="width:${(k / items.length) * 100}%"></i></span></a>`;
  };
  const rows = groups.map(([n, items, cat, set]) => `<tr><th scope="row">${n}</th><td>${tally('read', 'r:', items, cat, set)}</td><td>${tally('write', 'w:', items, cat, set)}</td></tr>`).join('');
  return `<details class="progress-card"><summary>
      <span class="pc-title">Your progress</span>
      <span class="pc-bar" aria-hidden="true"><i style="width:${(got / all) * 100}%"></i></span>
      <span class="pc-sum"><b>${got}</b> / ${all}</span>${icon('chevron', 20)}</summary>
    <div class="pc-body">
      <table class="ptable"><thead><tr><th></th><th>Read</th><th>Write</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="muted small">Something counts as learned after a few correct answers in a row. Tap a tally to practise it.</p>
      <div class="row"><a class="btn primary" href="#/practice">Practice</a><a class="btn" href="#/practice/read?cat=review&set=today">Daily review</a></div>
    </div></details>`;
}
views[''] = () => {
  setTitle('Home'); setSub('');
  const row = (href, title, desc, ic) => `<a class="hrow" href="${href}"><div class="hrow-text"><b>${title}</b><span>${desc}</span></div><span class="hrow-ic">${icon(ic, 26)}</span></a>`;
  view.innerHTML = `
    <div class="home-head">
      <div class="home-brand" aria-label="Learn Braille">${$('.brand').innerHTML}</div>
      <p class="slogan">A resource for sighted folks to learn the braille writing system.</p>
    </div>
    ${progressHTML()}

    <h2 class="sec-h">${icon('practice', 28)} Practice</h2>
    <div class="hrows">
      ${row('#/practice/read', 'Read', 'Name the letter, symbol or contraction', 'read')}
      ${row('#/practice/write', 'Write', 'Tap the dots that make it', 'write')}
      ${row('#/practice/words', 'Words', 'Decode whole words and type them', 'words')}
      ${row('#/practice/sweep', 'Sweep', 'Glide a finger along a line, like real reading', 'sweep')}
    </div>

    <h2 class="sec-h">${icon('book', 28)} Learn</h2>
    <div class="hrows">
      ${row('#/reference/overview', 'Overview', 'What braille is, how a cell works, and its history', 'info')}
      ${row('#/reference/alphabet', 'Alphabet', 'a–z in three simple rows', 'alpha')}
      ${row('#/reference/numbers', 'Numbers & symbols', 'Digits, punctuation, capitals', 'hash')}
      ${row('#/reference/grade2', 'Grade 2', 'All 180 contractions, like “the” and “and”', 'layers')}
      ${row('#/reference/signs', 'Signs', 'Read real-world signage, by country', 'sign')}
      ${row('#/reference/science', 'Maths & science', 'Equations, units and Nemeth', 'sigma')}
      ${row('#/reference/languages', 'Languages', 'French, Spanish, German, Russian, Greek, Japanese', 'globe')}
      ${row('#/reference/systems', 'World systems', 'The braille family around the world', 'map')}
    </div>

    <h2 class="sec-h">${icon('games', 28)} Games</h2>
    <div class="hrows">
      ${row('#/games/wordle', 'Braille Wordle', 'Guess the five-letter word in six tries', 'grid')}
      ${row('#/games/agent', 'Secret Agent', 'Decode braille messages to crack a case', 'key')}
      ${row('#/games/rain', 'Braille Rain', 'Type falling letters before they land', 'rain')}
      ${row('#/games', 'All games', 'Eleven games, from easy to hard', 'games')}
    </div>

    <h2 class="sec-h">${icon('translate', 28)} Translate</h2>
    <div class="hrows">
      ${row('#/translate', 'Type anything', 'See it in braille: English Grade 1 or 2 and five other languages', 'translate')}
    </div>`;
};

// ---------- practice data ----------
const L = (letters) => () => letters.split('').map((l) => ({ key: l, cells: LETTERS[l], answer: l }));
const C = (cat) => () => CONTRACTIONS[cat].items.map(([w, d]) => ({ key: 'c' + w, cells: cellsOf(d), answer: w }));
const MATH_SIGNS = ['+', '-', '×', '÷', '=', '$', '%', '@', '&', '#', '*', '°', '/'];
const CATS = {
  letters: { name: 'ABC', sets: {
    aj: ['a–j', L('abcdefghij')], kt: ['k–t', L('klmnopqrst')], uz: ['u–z', L('uvwxyz')],
    az: ['All letters', L('abcdefghijklmnopqrstuvwxyz')], mirror: ['Mirror pairs', L('dfeihjrw'), 'd/f, e/i, h/j, r/w'],
  } },
  symbols: { name: '!?#', sets: {
    num: ['Numbers', () => '1234567890'.split('').map((d) => ({ key: 'n' + d, cells: IND.number + LETTERS['jabcdefghi'[Number(d)]], answer: d }))],
    punct: ['Punctuation', () => [',', ';', ':', '.', '!', '?', "'", '-', '—', '(', ')'].map((p) => ({ key: 'p' + p, cells: UEB_PUNCT[p][0], answer: p, label: UEB_PUNCT[p][1] }))],
    signs: ['Maths & money signs', () => MATH_SIGNS.map((p) => ({ key: 'p' + p, cells: (p === '-' ? [fromDots('5') + fromDots('36'), 'minus'] : UEB_PUNCT[p])[0], answer: p === '-' ? '−' : p, label: p === '-' ? 'minus' : UEB_PUNCT[p][1] }))],
    ind: ['Indicators', () => INDICATORS.map(([p, d]) => ({ key: 'i' + p, cells: cellsOf(d), answer: p }))],
  } },
  review: { name: 'Review', sets: { today: ['Today’s mix', () => reviewItems()] } },
  contractions: { name: 'Grade 2', sets: {
    ...Object.fromEntries(Object.keys(CONTRACTIONS).map((cat, i) => ['k' + i, [cat, C(cat)]])),
    all: ['All contractions', () => [...new Map(Object.keys(CONTRACTIONS).flatMap((cat) => C(cat)()).map((x) => [x.key, x])).values()]],
  } },
};
// Daily review: the 15 items you miss most (then the least practised), fixed for the day.
function reviewItems() {
  const all = new Map();
  for (const [c, cat] of Object.entries(CATS)) if (c !== 'review') for (const [k, [, f]] of Object.entries(cat.sets)) for (const it of f()) all.set(it.key, it);
  const today = new Date().toISOString().slice(0, 10);
  let r = store.get('review', null);
  if (!r || r.date !== today || !r.keys.every((k) => all.has(k))) {
    const ms = store.get('misses', {}), m = mastery();
    const miss = (k) => (ms['r:' + k] || 0) + (ms['w:' + k] || 0);
    const sc = (k) => (m['r:' + k] || 0) + (m['w:' + k] || 0);
    const tried = [...all.keys()].filter((k) => miss(k) > 0).sort((a, b) => miss(b) - miss(a) || sc(a) - sc(b));
    const rest = shuffle([...all.keys()].filter((k) => !tried.includes(k) && /^[a-z]$/.test(k))).sort((a, b) => sc(a) - sc(b));
    r = { date: today, keys: [...tried, ...rest].slice(0, 15) };
    store.set('review', r);
  }
  return r.keys.map((k) => all.get(k));
}
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
const SWEEP_SRC = { words: 'Words', sentences: 'Sentences', signs: 'Signs' };
const MODES = { read: 'Read', write: 'Write', words: 'Words', sweep: 'Sweep' };
const HELP = {
  read: ['A braille cell appears. Pick what it says.', 'The card glows green when you’re right, and red with a small shake when you’re not.', 'Each item’s pill goes from pale blue to dark blue, then green once you know it. Ones you miss come up more often.'],
  write: ['Tap the dots that make the letter or symbol. It checks itself as you go.', 'The card glows green when the dots are right, and red if you add one that doesn’t belong.', 'Longer symbols are built one cell at a time.'],
  words: ['Decode the word and type it. It checks as you type.', 'Hint reveals one cell at a time. Skip shows the answer.'],
  sweep: ['Put your finger on the line and slide right, like reading real braille.', 'The cell under your finger is shaded, and its letter appears once you’ve passed it.', 'Hold your finger near the right edge and the line keeps scrolling.', 'Restart goes back to the start of the line. Next loads a new one.'],
};
const HELP_KEYS = {
  read: 'Press 1, 2, 3 or 4 to pick an answer.',
  write: 'F, D and S are the left column, top to bottom; J, K and L are the right column, like a Perkins brailler. Backspace clears.',
  words: 'Just type the word; there is no need to press Enter.',
  sweep: 'Move the mouse along the line, or use the arrow keys.',
};
const helpHTML = (k) => HELP[k].map((t) => `<p>${esc(t)}</p>`).join('') + (HELP_KEYS[k] ? `<p class="help-keys">${icon('keyboard', 18)}<span>${esc(HELP_KEYS[k])}</span></p>` : '');

views.practice = (q, sub) => {
  const mode = MODES[sub] ? sub : store.get('pmode', 'read');
  store.set('pmode', mode);
  setTitle('Practice');
  setSub(`<div class="seg radios modes" role="radiogroup">${Object.entries(MODES).map(([k, v]) => `<a role="radio" aria-checked="${k === mode}" class="${k === mode ? 'on' : ''}" href="#/practice/${k}">${icon(k, 20)}<span>${v}</span></a>`).join('')}</div>`);
  helpBtn.hidden = false;
  helpBtn.onclick = () => openSheet(`<div class="help">${helpHTML(mode)}</div>`, { title: MODES[mode] });
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
    ${mode === 'words' ? '' : `<div class="below-stage">
      <div class="mastery" id="mastery"></div>
      <div class="stats-row"><div class="stats"><span>Streak <b id="sStreak">0</b></span><span>Correct <b id="sRight">0</b>/<b id="sTotal">0</b></span></div>
      <span class="legend" title="Learning → known"><i data-l="1"></i><i data-l="2"></i><i data-l="3"></i><i data-l="4"></i><small>known</small></span></div>
    </div>`}`;
  const stage = $('#stage');
  const items = () => {
    const it = CATS[state.cat].sets[state.set][1]();
    return mode === 'read' ? mergeByCells(it) : it;
  };
  const pre = mode === 'write' ? 'w:' : 'r:';
  const score = (k) => m[pre + k] || 0;
  const bump = (k, d) => {
    m[pre + k] = Math.max(0, Math.min(5, score(k) + d)); store.set('mastery', m);
    if (d < 0) { const ms = store.get('misses', {}); ms[pre + k] = (ms[pre + k] || 0) + 1; store.set('misses', ms); }
  };

  function renderPicker() {
    if (mode === 'words') {
      picker.innerHTML = radios('wset', Object.entries(WORD_SETS).map(([k, s]) => [k, s.name]), state.wset);
    } else {
      picker.innerHTML = radios('cat', Object.entries(CATS).map(([k, c]) => [k, c.name]), state.cat) + '<div id="setDD"></div>';
      if (state.cat === 'review') return;
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
    if (mode === 'words') return;
    $('#mastery').innerHTML = items().map((x) => `<span data-l="${level(score(x.key))}">${esc(x.answer)}</span>`).join('');
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
    if (mode === 'words') return;
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
      <div class="dotpad" id="pad">${[1, 2, 3, 4, 5, 6].map((d) => `<button data-d="${d}" aria-label="dot ${d}">${d}</button>`).join('')}</div>
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
    const cellsHTML = cells.map((c) => `<span class="bw">${cellHTML(c.cell)}<span class="lbl"></span></span>`).join('');
    // Keep the same input between words so the phone keyboard stays open.
    if ($('#ans', stage) && $('#wcells', stage)) {
      const wc = $('#wcells', stage); wc.className = `prompt-cells words ${cells.length > 6 ? 'many' : ''}`; wc.innerHTML = cellsHTML;
      $('#ans', stage).value = '';
    } else {
      stage.innerHTML = `
      <div class="prompt-cells words ${cells.length > 6 ? 'many' : ''}" id="wcells">${cellsHTML}</div>
      <input class="answer-input" id="ans" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="Type the word">
      <div class="row"><button class="btn ghost" id="hint">Hint</button><button class="btn ghost" id="skip">Skip</button></div>`;
      // Tapping Hint or Skip shouldn't take focus away from the input (and close the keyboard).
      $$('#hint, #skip', stage).forEach((b) => b.addEventListener('pointerdown', (e) => { if (document.activeElement === $('#ans', stage)) e.preventDefault(); }));
    }
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
  $('#picker').innerHTML = radios('src', Object.entries(SWEEP_SRC), src);
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
    <div class="sweep-settings" id="swSet">
      <div class="set-row"><span>Braille</span>${radios('swGrade', [[1, 'Grade 1'], [2, 'Grade 2']], S.swGrade)}</div>
      <div class="set-row"><span>Cell size</span>${radios('swSize', [['large', 'Large'], ['real', 'Real size']], S.swSize)}</div>
      ${canVibrate ? `<label class="set-row switch"><span>Vibrate on dots</span><input type="checkbox" data-set="swVibe" ${S.swVibe ? 'checked' : ''}></label>` : ''}
    </div>`;
  bindRadios($('#picker'), (k, v) => { src = v; store.set('swSrc', v); text = textFor(); build(); });
  bindRadios($('#swSet'), (k, v) => setS(k, k === 'swGrade' ? Number(v) : v));
  if (canVibrate) $('#swSet [data-set]').onchange = (e) => setS('swVibe', e.target.checked);
  const box = $('#box'), track = $('#track'), finger = $('#finger'), reader = $('#reader');
  let cells = [], lefts = [], widths = [], totalW = 0, offset = 0, headX = 0, W = 0;
  let lastKey = '', curIdx = -1, raf = 0, edgeRaf = 0, active = false;

  const textFor = () => {
    if (src === 'words') return shuffle(WORDS).slice(0, 8).join(' ');
    if (src === 'sentences') return pick(SENTENCES);
    return shuffle(SIGN_WORDS).slice(0, 6).join(' ');
  };
  let text = textFor();
  function build() {
    const grade = src === 'signs' ? 2 : S.swGrade;
    cells = toCells(translate(text, 'en', grade)).filter((c) => c.kind !== 'newline');
    track.innerHTML = cells.map((c, i) => c.kind === 'space'
      ? `<div class="sc space" data-i="${i}"><span class="cell" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span></div>`
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
    $('#swProg').style.width = (totalW ? Math.max(0, Math.min(1, (pos - (lefts[0] || 0)) / (totalW - (lefts[0] || 0)))) * 100 : 0) + '%';
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
  $('.sweep-top', box).addEventListener('pointerdown', (e) => e.stopPropagation());
  const onResize = () => { const p = headX - offset; measure(); headX = Math.min(headX, W); offset = headX - p; update(false); };
  const onSet = (e) => { if (['swGrade', 'swSize'].includes(e.detail)) build(); };
  window.addEventListener('resize', onResize); window.addEventListener('settings', onSet);
  build();
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
  return JAPANESE.rows.map(([n, r]) => `<div class="group-title"><h3>${n}</h3></div><div class="ctable narrow">${r.map(([p, c]) => crowHTML(c, p, { kind: 'letter' })).join('')}</div>`).join('');
}
function signsSection(regionKey) {
  const region = SIGN_REGIONS[regionKey] ? regionKey : (SIGN_REGIONS[store.get('signRegion')] ? store.get('signRegion') : 'ca');
  store.set('signRegion', region);
  const R = SIGN_REGIONS[region];
  const lang = R.signLang || 'en';
  const grade = R.signLang ? 1 : 2;
  const parts = [];
  if (region === 'jp') parts.push(['sg-kana', 'Kana braille', `<p class="lead-p">${esc(JAPANESE.blurb)}</p>${kanaTable()}`]);
  else parts.push(['sg-read', 'Read these signs', `<div class="sign-gallery">${R.signs.map((s) => plateHTML(s, lang, grade)).join('')}${(R.bilingual || []).map(([en, fr]) => plateHTML(en, 'en', 2, [fr, 'fr'])).join('')}</div>`]);
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
      ${region === 'jp' ? '' : `<p class="lead-p">Tap a sign to see what each cell means. ${esc(R.note || 'Shown in UEB Grade 2, the way new signs are made.')}</p>`}
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
    return crowHTML(e.cells, e.print, { kind: 'contraction', note });
  };
  const sample = 'The children went to the park with their father.';
  const g1 = unicodeOf(translate(sample, 'en', 1)).replace(/ /g, '').length;
  const g2 = unicodeOf(translate(sample, 'en', 2)).replace(/ /g, '').length;
  const html = `
    <p class="lead-p">Grade 2 uses about 180 contractions to make braille shorter. Most books and public signs in Canada use it. Many cells mean different things alone versus inside a word, so each table notes where a sign may go.</p>
    <div class="g2-compare">
      <div><small>Grade 1 · ${g1} cells</small>${lineHTML(translate(sample, 'en', 1), { cls: 'sm' })}</div>
      <div><small>Grade 2 · ${g2} cells</small>${lineHTML(translate(sample, 'en', 2), { cls: 'sm' })}</div>
    </div>
    <h3 class="sg-h">Start with these</h3>
    <p class="muted small">The most frequent signs. Learn a few at a time, then practise them in Practice → Contractions.</p>
    <div class="ctable narrow">${G2_START.map((w) => { const i = DICT.findIndex((e) => e.print === w && e.group !== 'Letters'); return crowHTML(DICT[i].cells, w, { kind: 'contraction', i, note: DICT[i].cat }); }).join('')}</div>
    ${cats.map(([cat, { blurb }], ci) => `<div class="sg" id="g2-${ci}"><div class="group-title"><h3>${esc(cat)}<span class="count">${CONTRACTIONS[cat].items.length} signs</span></h3><span>${esc(blurb)}</span>${practiseLink(`#/practice/read?cat=contractions&set=k${ci}`)}</div>
      <div class="ctable">${DICT.map((e, i) => [e, i]).filter(([e]) => e.group === cat).map(([e, i]) => row(e, i)).join('')}</div></div>`).join('')}
    ${exBlock([['the children', 'Two wordsigns: “the” and “children”.'], ['mother and father', 'Initial-letter contractions plus “and”.'], ['with you', '“with” and the wordsign for “you”.'], ['knowledge', 'One cell for a whole word.']], 2)}`;
  return { html, jumps: cats.map(([cat, { items }], ci) => ({ value: 'g2-' + ci, label: cat, hint: items.length + ' signs' })) };
}

// ---------- reference ----------
const REF_SECTIONS = [
  ['overview', 'Overview'], ['alphabet', 'Alphabet'], ['numbers', 'Numbers & Symbols'], ['grade2', 'Grade 2'], ['signs', 'Signs'],
  ['science', 'Maths & Science'], ['languages', 'Languages'], ['systems', 'World Systems'], ['cheatsheet', 'Cheat Sheet'],
];
function alphabetSection() {
  const ROWS = [
    ['a–j', 'The foundation', 'abcdefghij', null, 'Only the top four dots are used. Learn these ten and the rest follow.', 'aj'],
    ['k–t', 'Add the lower-left dot', 'klmnopqrst', [3], 'The same shapes as a–j, with one more dot below on the left.', 'kt'],
    ['u–z', 'Add both bottom dots', 'uvxyz', [3, 6], 'The same shapes again, with both bottom dots.', 'uz'],
    ['w', 'The latecomer', 'w', [6], 'French had no w in 1824, so it was added later. It’s j plus the lower-right dot.', 'uz'],
  ];
  return `<p class="lead-p">The alphabet is ten shapes, repeated. Each new row adds dots (in blue) to the first.</p>
    <div id="alphaWrap">${ROWS.map(([range, title, letters, added, blurb, set]) => `
      <div class="decade"><div class="decade-head"><h3 class="range">${range}</h3>${letters.length > 1 ? practiseLink(`#/practice/read?cat=letters&set=${set}`) : ''}</div><p class="decade-p">${title}. ${blurb}</p>
      <div class="ctable narrow">${letters.split('').map((l) => crowHTML(LETTERS[l], l, { kind: 'letter', i: 'abcdefghijklmnopqrstuvwxyz'.indexOf(l), added })).join('')}</div></div>`).join('')}</div>
    ${exBlock([['hello', 'Letters are simply written one after another.'], ['braille', ''], ['jazz quiz', 'A space is an empty cell.']])}
    <p class="muted small">New to braille? Start with the <a href="#/reference/overview">Overview</a>. Mixing up d, f, h and j? Try <a href="#/practice/read?cat=letters&set=mirror">mirror pairs</a>.</p>`;
}
function overviewSection() {
  const parts = [
    ['ov-what', 'What braille is', `<p>Braille is a way of <b>writing</b> with raised dots that you read by touch. It isn’t a language: English, French, Japanese and many others each have their own braille. Blind and low-vision people use it to read books, labels, signs, music and maths, and to write with a braille device or a slate and stylus.</p>
      <p>Every symbol is made inside a small <b>cell</b> of six possible dots. Which dots are raised tells you what the cell means.</p>`],
    ['ov-cell', 'How a cell works', `<div class="cell-anatomy">${cellHTML(fromDots('123456'), 'numbered xl')}<div>
      <p>The six spots are numbered <b>1-2-3</b> down the left column and <b>4-5-6</b> down the right. Every braille symbol is described by its raised dots, so “dots 1-2” means the top two on the left.</p>
      <p>That gives 63 possible patterns plus the blank cell. A real cell is about 6 mm tall, small enough to feel all at once under one fingertip.</p></div></div>
      <div class="ctable narrow ov-rows">${['a', 'b', 'c', 'l'].map((l) => crowHTML(LETTERS[l], l, { kind: 'letter', note: dotsLabel(LETTERS[l]) })).join('')}</div>
      <p class="muted small">a is dot 1 alone. b adds dot 2 below it, c adds dot 4 beside it, and l is the whole left column. The <a href="#/reference/alphabet">alphabet</a> builds on these ten-letter patterns.</p>`],
    ['ov-context', 'One cell, several meanings', `<p>There are far more symbols than patterns, so context matters. ${cellHTML(LETTERS.b, 'sm')} is <b>b</b> on its own in a word, the word <b>“but”</b> when it stands alone in Grade 2, and the digit <b>2</b> after the number sign ${cellHTML(IND.number, 'sm')}. A capital sign ${cellHTML(IND.capital, 'sm')} makes the next letter uppercase.</p>
      <p>See <a href="#/reference/numbers">Numbers &amp; symbols</a> for these signs.</p>`],
    ['ov-grades', 'Grade 1 and Grade 2', `<p><b>Grade 1</b> spells every letter. <b>Grade 2</b> adds about 180 contractions, like ${cellHTML('⠮', 'sm')} for “the”, so text takes far less space. Most books and public signs in Canada use Grade 2. Learners usually start with Grade 1, then add contractions a few at a time.</p>
      <p>See <a href="#/reference/grade2">Grade 2</a> for every contraction.</p>`],
    ['ov-read', 'Reading and writing it', `<p>Readers glide the pads of their fingers lightly left to right along a line, often using both hands, rather than pressing on each cell. Experienced readers can reach speeds similar to reading print aloud. You can try the motion in <a href="#/practice/sweep">Sweep</a>.</p>
      <p>Braille is written on a <b>Perkins brailler</b> (a six-key machine from 1951), by hand with a <b>slate and stylus</b> (pressing dots from the back, so you write right to left), or electronically with a <b>refreshable braille display</b> that raises pins under each cell. <a href="#/practice/write">Write</a> uses the same six-key idea.</p>`],
    ['ov-where', 'Where you’ll see it', `<p>Room and washroom signs, elevator buttons, medicine boxes (required in the EU), Canadian bank notes, ATMs, transit handrails and many product labels. See <a href="#/reference/signs">Signs</a> for examples by country, and <a href="#/reference/languages">Languages</a> and <a href="#/reference/systems">World systems</a> for braille beyond English.</p>`],
    ['ov-learn', 'Learning it as a sighted person', `<p>Most sighted learners start by reading braille <b>by sight</b>, which is what this site teaches. It’s a great way to understand signs, help a blind friend or family member, or begin training as a teacher or transcriber. Reading by touch takes much longer, because your fingertips need months of practice to tell the dots apart.</p>
      <p>A good order is: the letters a–j, then the rest of the <a href="#/reference/alphabet">alphabet</a>, then <a href="#/reference/numbers">numbers and capitals</a>, then the most common <a href="#/reference/grade2">Grade 2</a> contractions. Practise a little each day in <a href="#/practice/read">Read</a> and <a href="#/practice/write">Write</a>, then try real <a href="#/reference/signs">signs</a>.</p>`],
    ['ov-history', 'History', `<p>Louis Braille was born in 1809 in Coupvray, France, and lost his sight after an accident in his father’s workshop at age three. At the Royal Institute for Blind Youth in Paris he met Charles Barbier’s 12-dot “night writing”, a military code for reading in the dark. In 1824, at 15, he simplified it into the six-dot cell that fits under one fingertip. Braille died in 1852; France made his system official two years later.</p>
      <ol class="timeline">${HISTORY.map(([y, t]) => `<li><b>${y}</b>${esc(t)}</li>`).join('')}</ol>`],
  ];
  return {
    jumps: parts.map(([id, t]) => ({ value: id, label: t })),
    html: `<p class="lead-p">A primer for sighted learners: what braille is, how the six-dot cell works, and where it came from.</p>${parts.map(([id, t, h]) => `<div class="sg prose" id="${id}"><h3 class="sg-h">${t}</h3>${h}</div>`).join('')}
      <div class="row"><a class="btn primary" href="#/reference/alphabet">Learn the alphabet</a><a class="btn" href="#/practice/read">Start practising</a></div>`,
  };
}
function numbersSection() {
  const parts = [
    ['nu-num', 'Numbers', groupBlock('Numbers', 'Numbers', 'number sign ⠼ + a–j', '#/practice/read?cat=symbols&set=num') + exBlock([
      ['2025', 'One number sign covers every digit that follows.'],
      ['1 2 3', 'After a space, each number needs its own number sign.'],
    ])],
    ['nu-punct', 'Punctuation & symbols', groupBlock('Punctuation', 'Punctuation & symbols', '', '#/practice/read?cat=symbols&set=punct') + exBlock([
      ['yes!', 'Punctuation follows the word, just like print.'],
      ['e-mail', 'A hyphen joins the two parts.'],
      ['3.5', 'The decimal point keeps the number going.'],
      ['1,000', 'So does a comma inside a number.'],
      ['$20', 'Symbols like $ come before the number sign.'],
      ['50%', 'Percent is a two-cell symbol after the digits.'],
    ])],
    ['nu-ind', 'Indicators', groupBlock('Indicators', 'Indicators', '', '#/practice/read?cat=symbols&set=ind') + exBlock([
      ['Canada', 'One capital sign before the letter.'],
      ['CANADA', 'Two capital signs make the whole word uppercase.'],
      ['Hi!', 'Capitals and punctuation together.'],
      ['Room 2B', 'A grade 1 indicator stops “b” being read as a digit.'],
    ])],
  ];
  return {
    jumps: parts.map(([value, label]) => ({ value, label })),
    html: `<p class="lead-p">Numbers, punctuation and the indicators that change how the next cells are read.</p>${parts.map(([id, , h]) => `<div class="sg" id="${id}">${h}</div>`).join('')}`,
  };
}
// Printable cheat sheets: Grade 1 on one page (letters laid out by decade), Grade 2 over a few pages.
function cheatSection() {
  const item = (cells, label, kind, cls = '') => `<div class="cs-i ${cls}${cells.length > 1 ? ' wide' : ''}"><span class="cs-c">${[...cells].map((c) => cellHTML(c, '', { kind })).join('')}</span><b>${esc(label)}</b></div>`;
  const blank = '<div class="cs-i cs-blank" aria-hidden="true"></div>';
  const block = (title, body, cls = '', note = '') => `<section class="cs-block ${cls}"><h3>${title}${note ? `<span>${note}</span>` : ''}</h3><div class="cs-grid">${body}</div></section>`;
  const L = (str) => [...str].map((l) => item(LETTERS[l], l, 'letter')).join('');
  const P = (ch, label) => item(UEB_PUNCT[ch][0], label || ch, 'punct');
  const grade1 = () => `<h2 class="cs-title">Braille cheat sheet · Grade 1 <small>Unified English Braille</small></h2>
    ${block('Letters', `${L('abcdefghij')}${L('klmnopqrst')}${L('uvxyz')}${blank.repeat(4)}${L('w')}`, 'cs-decades', 'each row adds dots to the one above')}
    ${block('Numbers', '1234567890'.split('').map((d) => item(LETTERS['jabcdefghi'[Number(d)]], d, 'digit')).join(''), 'cs-decades', `put ${cellHTML(IND.number, 'cs-inline', { kind: 'digit' })} before a number: 1–0 are a–j`)}
    ${block('Signs', [item(IND.capital, 'capital', 'indicator'), item(IND.capital + IND.capital, 'all caps', 'indicator'), item(IND.number, 'number', 'digit'), P('.'), P(','), P('?'), P('!'), P('’', '’'), P('-'), P(':'), P(';'), P('“'), P('”'), P('('), P(')'), P('/')].join(''), 'cs-decades')}
    <p class="cs-foot">learn braille · updownupdown.github.io/braille</p>`;
  const grade2 = () => `<h2 class="cs-title">Braille cheat sheet · Grade 2 <small>Unified English Braille contractions</small></h2>
    ${Object.entries(CONTRACTIONS).map(([cat, { blurb }]) => block(esc(cat), DICT.filter((e) => e.group === cat).map((e) => item(e.cells, e.print, 'contraction', e.cells.length > 1 ? 'wide' : '')).join(''), 'cs-g2', esc(blurb))).join('')}
    <p class="cs-foot">learn braille · updownupdown.github.io/braille</p>`;
  let g = store.get('csGrade', '1');
  return { html: `<div class="cs-head"><p class="lead-p">Print it, or save it as a PDF. Grade 1 fits on one page; Grade 2 takes a few.</p><div class="row">${radios('csg', [['1', 'Grade 1'], ['2', 'Grade 2']], g)}<button class="btn primary" id="csPrint">${icon('print', 18)} Print</button></div></div>
    <div class="cheatsheet" id="cheatsheet"></div>`, bind: () => {
    const render = () => { $('#cheatsheet').innerHTML = g === '2' ? grade2() : grade1(); $('#cheatsheet').dataset.grade = g; };
    render();
    bindRadios($('.cs-head'), (k, v) => { g = v; store.set('csGrade', v); render(); });
    $('#csPrint').onclick = () => window.print();
  } };
}
// Extra charts for World systems that aren't full translators. Cells are dot strings; a space joins multi-cell signs.
const D = (s) => s.split(' ').map(fromDots).join('');
const grp = (pairs, kind = '') => pairs.map(([dots, label]) => dots === '_' ? '_' : `${D(dots)}:${label}`).join(' ');
const MUSIC_NOTES = [['C', '145'], ['D', '15'], ['E', '124'], ['F', '1245'], ['G', '125'], ['A', '24'], ['B', '245']];
const withDots = (d, add) => [...new Set([...d, ...add])].sort().join('');
const EXTRA_CHARTS = {
  ebae: { name: 'EBAE', kind: 'contraction',
    blurb: 'Letters, numbers and most contractions are the same as UEB. These signs were dropped when Canada and the US moved to UEB in 2010–2016, but you will still find them on older signs and books.',
    examples: [['by the way', grp([['356', 'by'], ['2346', 'the'], ['_'], ['2456', 'w'], ['1', 'a'], ['13456', 'y']])], ['table', grp([['2345', 't'], ['1', 'a'], ['3456', 'ble']])], ['nation', grp([['1345', 'n'], ['6 1345', 'ation']])]],
    groups: [['Signs dropped in UEB', [['3456', 'ble'], ['36', 'com'], ['256', 'dd'], ['356', 'by'], ['235', 'to'], ['35 235', 'into'], ['6 1345', 'ation'], ['6 13456', 'ally'], ['135 3 14', 'o’clock']]]] },
  nemeth: { name: 'Nemeth Code', kind: 'math',
    blurb: 'Nemeth writes digits in the lower part of the cell, so a number never looks like a letter. The numeric indicator comes before a number that starts a line or follows a space.',
    examples: NEMETH.map((s) => [s.print, s.g]),
    groups: [['Digits', [['2', '1'], ['23', '2'], ['25', '3'], ['256', '4'], ['26', '5'], ['235', '6'], ['2356', '7'], ['236', '8'], ['35', '9'], ['356', '0']]],
      ['Signs', [['3456', 'numeric indicator'], ['346', 'plus'], ['36', 'minus'], ['16', 'times'], ['46 34', 'divided by'], ['46 13', 'equals'], ['46', 'decimal point']]]] },
  ar: { name: 'Arabic braille', kind: 'letter',
    blurb: 'Read left to right, even though print Arabic runs right to left. A letter has one cell whatever its position in the word, and many share cells with Latin sound-alikes (ب = b, د = d, ف = f).',
    examples: [['سلام · peace', grp([['234', 'س'], ['123', 'ل'], ['1', 'ا'], ['134', 'م']])], ['كتاب · book', grp([['13', 'ك'], ['2345', 'ت'], ['1', 'ا'], ['12', 'ب']])]],
    groups: [['Letters', [['1', 'ا'], ['12', 'ب'], ['2345', 'ت'], ['1456', 'ث'], ['245', 'ج'], ['156', 'ح'], ['1346', 'خ'], ['145', 'د'], ['2346', 'ذ'], ['1235', 'ر'], ['1356', 'ز'], ['234', 'س'], ['146', 'ش'], ['12346', 'ص'], ['1246', 'ض'], ['23456', 'ط'], ['123456', 'ظ'], ['12356', 'ع'], ['126', 'غ'], ['124', 'ف'], ['12345', 'ق'], ['13', 'ك'], ['123', 'ل'], ['134', 'م'], ['1345', 'ن'], ['125', 'ه'], ['2456', 'و'], ['24', 'ي']]]] },
  music: { name: 'Music braille', kind: 'contraction',
    blurb: 'Each note is one cell. The top four dots give the pitch (using the shapes of d to j), and dots 3 and 6 give the length. Octave, rests and dynamics have signs of their own.',
    examples: [['Twinkle, twinkle', grp([['1456', 'C'], ['1456', 'C'], ['1256', 'G'], ['1256', 'G'], ['246', 'A'], ['246', 'A'], ['1235', 'G']])], ['A scale in eighth notes', grp(MUSIC_NOTES.map(([n, d]) => [d, n]))]],
    groups: [['Eighth notes', MUSIC_NOTES.map(([n, d]) => [d, n])], ['Quarter notes (add the lower-right dot)', MUSIC_NOTES.map(([n, d]) => [withDots(d, '6'), n])],
      ['Half notes (add the lower-left dot)', MUSIC_NOTES.map(([n, d]) => [withDots(d, '3'), n])], ['Whole notes (add both bottom dots)', MUSIC_NOTES.map(([n, d]) => [withDots(d, '36'), n])]] },
};
const exTiles = (items) => `<div class="group-title"><h3>Examples</h3></div><div class="example-grid">${items.join('')}</div>`;
// Full character table for a language, shown in a modal from World systems or Languages (with examples first in the modal).
function charsTable(k, { examples = false } = {}) {
  const X = EXTRA_CHARTS[k];
  if (X) return `<p class="muted">${esc(X.blurb)}</p>${exTiles(X.examples.map(([p, g]) => `<div class="example"><div class="print">${esc(p)}</div>${groupsHTML(g, 'sm', X.kind)}</div>`))}
    ${X.groups.map(([t, items]) => `<div class="group-title"><h3>${esc(t)}</h3></div><div class="ctable narrow">${items.map(([d, l]) => crowHTML(D(d), l, { kind: X.kind })).join('')}</div>`).join('')}`;
  if (k === 'ja') {
    const kana = Object.fromEntries(JAPANESE.rows.flatMap(([, r]) => r));
    const words = [['さくら · sakura', ['sa', 'ku', 'ra']], ['ねこ · neko', ['ne', 'ko']], ['すし · sushi', ['su', 'shi']], ['やま · yama', ['ya', 'ma']], ['ひかり · hikari', ['hi', 'ka', 'ri']]];
    return `<p class="muted">${esc(JAPANESE.blurb)}</p>${examples ? exTiles(words.map(([p, sy]) => `<div class="example"><div class="print">${esc(p)}</div>${groupsHTML(sy.map((x) => `${kana[x]}:${x}`).join(' '), 'sm', 'letter')}</div>`)) : ''}${kanaTable()}`;
  }
  const info = LANG_INFO[k];
  return `<p class="muted">${esc(info.blurb)}</p>${examples ? exTiles(info.phrases.map((p) => `<div class="example"><div class="print">${esc(p)}</div>${lineHTML(translate(p, k, k === 'en' ? 2 : 1), { cls: 'sm' })}</div>`)) : ''}
    <div class="group-title"><h3>Letters</h3></div>
    <div class="ctable narrow">${[...info.letters].map((l) => crowHTML(translate(l, k, 1)[0].cells, l, { kind: 'letter' })).join('')}</div>
    <div class="group-title"><h3>Digits</h3></div>
    <div class="ctable narrow">${'1234567890'.split('').map((d) => crowHTML(unicodeOf(translate(d, k, 1)), d, { kind: 'digit' })).join('')}</div>`;
}
const LANG_NAMES = () => ({ ...Object.fromEntries(Object.keys(LANG_INFO).map((k) => [k, k === 'en' ? 'English (UEB)' : LANGS[k].name])), ja: '日本語 Japanese' });
const CHART_NAMES = () => ({ ...LANG_NAMES(), ...Object.fromEntries(Object.entries(EXTRA_CHARTS).map(([k, x]) => [k, x.name])) });
function languagesSection() {
  return { html: '<div class="picker"><div id="langDD"></div></div><div id="langBody"></div>', bind: () => {
    const render = (k) => {
      store.set('refLang', k);
      const body = $('#langBody');
      if (k === 'ja') { body.innerHTML = charsTable('ja'); markMulti(body); return; }
      const info = LANG_INFO[k];
      body.innerHTML = `${charsTable(k)}
        <div class="group-title"><h3>Phrases</h3><span>${k === 'en' ? 'Grade 2' : 'uncontracted'}</span></div>
        <div class="example-grid">${info.phrases.map((p) => `<a class="example" href="#/translate?lang=${k}&text=${encodeURIComponent(p)}"><div class="print">${esc(p)}</div>${lineHTML(translate(p, k, k === 'en' ? 2 : 1), { cls: 'sm' })}</a>`).join('')}</div>`;
      markMulti(body);
    };
    const v = store.get('refLang', 'en');
    dropdown($('#langDD'), { label: 'Language', options: Object.entries(LANG_NAMES()).map(([value, label]) => ({ value, label })), value: v, onChange: render });
    render(v);
  } };
}
function systemsSection() {
  return { html: `<p class="lead-p">The braille family: the codes you’re likely to meet, plus special-purpose and tactile cousins. Tap a row to expand it; many include a full chart.</p>
    ${SYSTEMS.map((g) => `<div class="group-title"><h3>${esc(g.group)}</h3></div><div class="acc-list">${g.items.map(([n, w, d, chars]) => `
      <details class="acc-item"><summary><span><b>${esc(n)}</b><small>${esc(w)}</small></span>${icon('chevron', 20)}</summary>
      <div class="acc-body"><p>${esc(d)}</p>${chars ? `<button class="btn small-btn" data-chars="${chars}">See all characters ${icon('right', 16)}</button>` : ''}</div></details>`).join('')}</div>`).join('')}`,
    bind: () => { $$('[data-chars]').forEach((b) => { b.onclick = () => openSheet(charsTable(b.dataset.chars, { examples: true }), { title: CHART_NAMES()[b.dataset.chars] }); }); },
  };
}
function scienceSection() {
  const ex = (s) => `<div class="example"><div class="print">${esc(s.print)}</div>${groupsHTML(s.g)}</div>`;
  const parts = [
    ['sc-sym', 'Symbols', `<p class="lead-p">UEB uses extra signs and indicators for technical material. These are the ones used in the examples below.</p><div class="ctable narrow">${SCIENCE_SYMBOLS.map(([c, n]) => crowHTML(c, n, { kind: 'math' })).join('')}</div>`],
    ['sc-ueb', 'UEB examples', `<p class="muted small">Each group of cells is labelled. In Grade 2 text a grade 1 indicator ⠰ often goes before superscript ⠔ and subscript ⠢ so they aren’t read as “in” and “en”; these examples are in Grade 1 mode.</p><div class="example-grid">${SCIENCE.map(ex).join('')}</div>`],
    ['sc-nem', 'Nemeth Code', `<p class="muted small">Still used for maths in many Canadian and US schools.</p><div class="example-grid">${NEMETH.map(ex).join('')}</div>`],
  ];
  return {
    jumps: parts.map(([value, label]) => ({ value, label })),
    html: parts.map(([id, t, h]) => `<div class="sg" id="${id}"><h3 class="sg-h">${t}</h3>${h}</div>`).join(''),
  };
}
function refSection(key, sub) {
  switch (key) {
    case 'alphabet': return { html: alphabetSection() };
    case 'numbers': return numbersSection();
    case 'grade2': return grade2Section();
    case 'signs': return signsSection(sub);
    case 'science': return scienceSection();
    case 'languages': return languagesSection();
    case 'systems': return systemsSection();
    case 'overview': return overviewSection();
    case 'cheatsheet': return cheatSection();
  }
  return { html: '' };
}

views.reference = (q, sub, sub2) => {
  const key = REF_SECTIONS.find(([k]) => k === sub) ? sub : store.get('refSec', 'overview');
  store.set('refSec', key);
  const i = REF_SECTIONS.findIndex(([k]) => k === key);
  const sec = refSection(key, sub2);
  setTitle('Learn');
  setSub(`<div id="secDD" class="dd-strong"></div>${sec.jumps ? '<div id="jumpDD" class="dd-right"></div>' : ''}`);
  dropdown($('#secDD'), { lead: 'book', options: REF_SECTIONS.map(([k, t]) => ({ value: k, label: t })), value: key, onChange: (v) => { location.hash = '#/reference/' + v; } });
  if (sec.jumps) dropdown($('#jumpDD'), { label: 'Jump to', options: sec.jumps, value: null, onChange: (v) => { const el = document.getElementById(v); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  view.innerHTML = `${sec.html}
      <div class="pager">${i > 0 ? `<a class="btn" href="#/reference/${REF_SECTIONS[i - 1][0]}"><span class="pg-dir">${icon('right', 18)}</span><span><small>Previous</small>${REF_SECTIONS[i - 1][1]}</span></a>` : '<span></span>'}${i < REF_SECTIONS.length - 1 ? `<a class="btn next" href="#/reference/${REF_SECTIONS[i + 1][0]}"><span><small>Next</small>${REF_SECTIONS[i + 1][1]}</span>${icon('right', 18)}</a>` : ''}</div>`;
  if (sec.bind) sec.bind();
  markMulti(view);
  view.onclick = (ev) => {
    const l = ev.target.closest('.letter[data-l]'); if (l) openSheet(letterDetail(l.dataset.l), { title: 'Letter ' + l.dataset.l });
  };
  return () => { view.onclick = null; };
};

// ---------- games ----------
views.games = (q, sub) => {
  const g = GAMES[sub];
  if (!g) {
    setTitle('Games'); setSub('');
    const row = (k) => { const x = GAMES[k]; return `<a class="hrow g-tile" href="#/games/${k}"><div class="hrow-text"><b>${x.name}</b><span>${x.desc}</span></div><span class="hrow-ic gc-${k}">${icon(x.icon, 26)}</span></a>`; };
    view.innerHTML = `<p class="lead-p g-intro">Play with braille. Each game has its own difficulty levels, and your best scores are saved on this device.</p>
      ${GAME_GROUPS.map(([t, ks]) => `<h2 class="sec-h">${t}</h2><div class="hrows g-tiles">${ks.map(row).join('')}</div>`).join('')}`;
    return;
  }
  setTitle(g.name);
  helpBtn.hidden = false;
  helpBtn.onclick = () => openSheet(`<div class="help">${g.help.map((t) => `<p>${esc(t)}</p>`).join('')}</div>`, { title: g.name });
  let lvl = gameStore.get('lvl.' + sub, g.levels ? g.levels[0][0] : null);
  if (g.levels && !g.levels.some(([k]) => k === lvl)) lvl = g.levels[0][0];
  const top = g.levels && sub !== 'trivia';
  setSub(`<div class="g-sub"><a class="back-link" href="#/games">${icon('right', 18)} Games</a>${top ? `<div class="picker">${radios('lvl', g.levels, lvl)}</div>` : ''}</div>`);
  view.innerHTML = `<div class="game-wrap game-${sub}">${g.levels && !top ? `<div class="picker">${radios('lvl', g.levels, lvl)}</div>` : ''}<div class="game" id="game"></div></div>`;
  const gameEl = $('#game');
  // Stats and buttons share one row at the bottom, to save height.
  const arrange = () => {
    const st = $(':scope > .g-stats', gameEl), ac = $(':scope > .g-actions', gameEl);
    if (!st && !ac) return;
    const foot = document.createElement('div'); foot.className = 'g-foot';
    if (st) foot.append(st); if (ac) foot.append(ac);
    gameEl.append(foot);
  };
  const mo = new MutationObserver(arrange); mo.observe(gameEl, { childList: true });
  const lvlClass = () => { gameEl.className = `game lv-${lvl}`; };
  lvlClass();
  let stop = g.run(gameEl, lvl, { dropdown }); arrange();
  // Display-only toggles (With letters / Braille only) keep the current puzzle.
  if (g.levels) bindRadios(top ? $('.g-sub .picker') : $('.picker', view), (k, v) => { lvl = v; gameStore.set('lvl.' + sub, v); lvlClass(); if (g.display) return; if (stop) stop(); stop = g.run(gameEl, lvl, { dropdown }); });
  return () => { mo.disconnect(); if (stop) stop(); };
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
  REF_SECTIONS.forEach(([k, t]) => out.push({ title: t, sub: 'Learn section', sec: k, page: true, act: nav('#/reference/' + k) }));
  Object.entries(MODES).forEach(([k, t]) => out.push({ title: t, sub: 'Practice mode', sec: 'practice', page: true, act: nav('#/practice/' + k) }));
  Object.entries(GAMES).forEach(([k, g]) => out.push({ title: g.name, sub: 'Game · ' + g.desc, sec: 'games', page: true, act: nav('#/games/' + k) }));
  SCIENCE_SYMBOLS.forEach(([c, n]) => out.push({ title: n, sub: 'Maths & science symbol', cells: c, kind: 'math', sec: 'science', act: nav('#/reference/science') }));
  for (const k of ['fr', 'es', 'de', 'ru', 'el']) {
    for (const l of LANG_INFO[k].letters) {
      if (/[a-z]/.test(l)) continue;
      out.push({ title: l, sub: LANGS[k].name + ' letter', cells: translate(l, k, 1)[0].cells, kind: 'letter', sec: 'languages', act: () => openSheet(charsTable(k, { examples: true }), { title: LANG_NAMES()[k] }) });
    }
  }
  for (const [rk, r] of Object.entries(SIGN_REGIONS)) for (const w of r.signs) out.push({ title: w, sub: 'Sign · ' + r.name, cells: unicodeOf(translate(w, r.signLang || 'en', r.signLang ? 1 : 2)), sec: 'signs', act: nav('#/reference/signs/' + rk) });
  for (const g of SYSTEMS) for (const [n, w] of g.items) out.push({ title: n, sub: 'World system · ' + w, sec: 'systems', act: nav('#/reference/systems') });
  for (const [y, t] of HISTORY) out.push({ title: String(y), sub: t, sec: 'overview', act: nav('#/reference/overview') });
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
  const secName = Object.fromEntries([...REF_SECTIONS, ['practice', 'Practice'], ['games', 'Games']]);
  const tr = /[a-z]/i.test(raw) && !/^[1-6\s-]+$/.test(raw) ? `<a class="sr tr" href="#/translate?lang=en&text=${encodeURIComponent(raw)}"><span class="sr-cells">${lineHTML(translate(raw, 'en', 2), { labels: false, cls: 'sm' })}</span><span class="sr-text"><b>Translate “${esc(raw)}”</b><small>English Grade 2</small></span></a>` : '';
  searchPanel.innerHTML = `<div class="sp-inner">${RESULTS.length ? `<div class="sr-list">${RESULTS.map((e, i) => `<button class="sr" data-r="${i}"><span class="sr-cells">${e.cells ? cellsK(e.cells, e.kind || '', 'sm') : icon(e.page ? 'book' : 'right', 18)}</span><span class="sr-text"><b>${esc(e.title)}</b><small>${esc(e.sub.length > 90 ? e.sub.slice(0, 88) + '…' : e.sub)}</small></span><span class="sr-sec">${esc(secName[e.sec] || '')}</span></button>`).join('')}</div>` : '<p class="muted">Nothing matches. Try a word or a symbol.</p>'}${tr}</div>`;
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
  const LOPTS = [['en1', 'English (Grade 1)', 'English'], ['en2', 'English (Grade 2)', 'English'], ['fr', 'Français', 'Other languages'], ['es', 'Español', 'Other languages'], ['de', 'Deutsch', 'Other languages'], ['ru', 'Русский', 'Other languages'], ['el', 'Ελληνικά', 'Other languages']];
  let mode = q.get('lang') ? (q.get('lang') === 'en' ? 'en2' : q.get('lang')) : store.get('trMode', 'en2');
  const initial = q.get('text') || store.get('trText', 'Welcome to Canada. The washroom is on floor 2.');
  setTitle('Translate');
  setSub('<div id="langDD" class="dd-strong"></div><div id="exDD" class="dd-right"></div>');
  view.innerHTML = `
    <textarea class="tr-input" id="trIn" spellcheck="false">${esc(initial)}</textarea>
    <div class="card tr-out" id="trOut"></div>
    <div class="tr-tools">
      <button class="btn" id="trCopy">Copy braille</button>
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
    dropdown($('#langDD'), { lead: 'globe', options: LOPTS.map(([v, l, g]) => ({ value: v, label: l, group: g })), value: mode, onChange: (v) => { mode = v; render(); syncDD(); } });
    dropdown($('#exDD'), { label: 'Examples', plain: true, options: LANG_INFO[exLang()].phrases.map((p) => ({ value: p, label: p })), value: null, onChange: (v) => { inp.value = v; render(); } });
  };
  inp.oninput = render;
  $('#trCopy').onclick = async () => { try { await navigator.clipboard.writeText($('#trOut').dataset.uni); $('#trCopy').textContent = 'Copied ✓'; setTimeout(() => ($('#trCopy').textContent = 'Copy braille'), 1400); } catch {} };
  syncDD(); render();
};

// ---------- Title Case for headings ----------
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'or', 'per', 'the', 'to', 'vs', 'with']);
function titleCase(str) {
  let first = true;
  return str.replace(/\S+/g, (w) => {
    const m = w.match(/^([(“"‘']?)([a-z])([a-z'’]*)([)”"’'.,:;!?]?)$/);
    const isFirst = first; first = false;
    if (!m || (w.length === 1 && w !== 'a') || (!isFirst && SMALL.has(m[2] + m[3]))) return w;
    return m[1] + m[2].toUpperCase() + m[3] + m[4];
  });
}
const TC_SEL = '.sec-h, .sg-h, .group-title h3, .cs-title, .hrow-text b, .sheet-head h2, .ht-t, .acc-item summary b';
function applyTitleCase(root = document) {
  $$(TC_SEL, root).forEach((el) => el.childNodes.forEach((n) => { if (n.nodeType === 3 && n.textContent.trim()) { const t = titleCase(n.textContent); if (t !== n.textContent) n.textContent = t; } }));
}
let tcQueued = false;
new MutationObserver(() => { if (tcQueued) return; tcQueued = true; requestAnimationFrame(() => { tcQueued = false; applyTitleCase(); }); }).observe(document.body, { childList: true, subtree: true });

// ---------- on-screen keyboard: size content to the visible area ----------
if (window.visualViewport) {
  const vv = window.visualViewport;
  const onVV = () => {
    document.documentElement.style.setProperty('--vvh', vv.height + 'px');
    document.body.classList.toggle('kb-open', vv.height < window.innerHeight * 0.78);
  };
  vv.addEventListener('resize', onVV); onVV();
}

// ---------- router ----------
let cleanup = null;
const TITLES = { '': 'Learn Braille', practice: 'Practice · Learn Braille', reference: 'Learn · Learn Braille', translate: 'Translate · Learn Braille', games: 'Games · Learn Braille' };
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
  helpBtn.hidden = true;
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
