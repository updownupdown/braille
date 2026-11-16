// Shared helpers: storage, icons, settings, braille cells, the modal sheet, drop-downs, the header, Settings and the symbol dictionary.
import { store, snapshot, restore, clear } from './storage.js';
import { LETTERS, IND, UEB_PUNCT, CONTRACTIONS, cellsOf, fromDots, toDots, dotsLabel, translate, toCells } from './braille.js';

// ---------- helpers ----------
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export { store };
// Headings are Title Case (Chicago style: small words stay lower case unless first).
// Templates call titleCase() on any heading text that comes from data; literal headings are written in Title Case.
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'or', 'per', 'the', 'to', 'vs', 'with']);
export function titleCase(str) {
  let first = true;
  return String(str).replace(/\S+/g, (w) => {
    const isFirst = first; first = false;
    return w.split(/([-–])/).map((part, i) => {
      if (i % 2) return part;
      const m = part.match(/^([(“"‘']?)([a-z])([a-z'’]*)([)”"’'.,:;!?]?)$/);
      if (!m || (part.length === 1 && part !== 'a') || (!(isFirst && i === 0) && SMALL.has(m[2] + m[3]))) return part;
      return m[1] + m[2].toUpperCase() + m[3] + m[4];
    }).join('');
  });
}
export const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
// Screen-reader announcements, optional speech and sounds, cells described as dots: see a11y.js.
export { announce, feedback, cellsLabel, cellLabel, reducedMotion, speak } from './a11y.js';
import { speak, stopSpeech, tone, speechAvailable, haptic, hapticsAvailable } from './a11y.js';
// ---------- icons ----------
export const P = {
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
  warn: '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.3" r=".6" fill="currentColor"/>',
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
  snowman: '<circle cx="12" cy="16.5" r="4.5"/><circle cx="12" cy="8.5" r="3"/><path d="M8.5 4.5h7M10 4.5V2h4v2.5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>',
  t2b: '<path d="M3 6h7M6.5 6v12"/><path d="m12 12h4m-2-2 2 2-2 2"/><circle cx="19" cy="7" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/><circle cx="22" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="17" r="1.3" fill="currentColor"/>',
  b2t: '<circle cx="3" cy="7" r="1.3" fill="currentColor"/><circle cx="3" cy="12" r="1.3" fill="currentColor"/><circle cx="6" cy="12" r="1.3" fill="currentColor"/><circle cx="3" cy="17" r="1.3" fill="currentColor"/><path d="m9 12h4m-2-2 2 2-2 2"/><path d="M15 6h7M18.5 6v12"/>',
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
  stats: '<path d="M4 20h16"/><rect x="5" y="11" width="3.4" height="6" rx="1"/><rect x="10.3" y="5" width="3.4" height="12" rx="1"/><rect x="15.6" y="8" width="3.4" height="9" rx="1"/>',
  sweep: '<circle cx="5" cy="8" r="1.6" fill="currentColor"/><circle cx="10" cy="8" r="1.6" fill="currentColor"/><circle cx="15" cy="8" r="1.6" fill="currentColor"/><path d="M3 16h15"/><path d="m15 13 3 3-3 3"/>',
  compose: '<circle cx="5" cy="6" r="1.5" fill="currentColor"/><circle cx="5" cy="11" r="1.5" fill="currentColor"/><circle cx="10" cy="6" r="1.5" fill="currentColor"/><path d="M3 17h9"/><path d="m14.5 19.5 1-3.6 5-5a1.5 1.5 0 0 1 2.1 2.1l-5 5z"/>',
  hunt: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/><circle cx="8.5" cy="8.5" r="1.1" fill="currentColor"/><circle cx="12.5" cy="8.5" r="1.1" fill="currentColor"/><circle cx="8.5" cy="12.5" r="1.1" fill="currentColor"/>',
  place: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  proof: '<path d="M4 17.5 14.5 7l3 3L7 20.5H4z"/><path d="m12.5 9 3 3"/><path d="M13 20.5c1.3-1.2 2.2 1.2 3.5 0s2.2 1.2 3.5 0"/>',
  peek: '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="8.5" cy="12.5" r="1.2" fill="currentColor"/><circle cx="12.5" cy="8.5" r="1.2" fill="currentColor"/><path d="M15 8.5h2.5"/><path d="M15 12.5h2.5"/><path d="M7.5 16.5h10"/>',
};
export const icon = (n, size = 22) => `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
// ---------- settings ----------
// speech, sounds and haptics are accessibility aids, off unless turned on in Settings.
// swSize: braille size, 'large' or 'real' (true size, in Guess, Type, Read and Translate). mmPx: screen pixels in a real
// millimetre, set by holding a coin to the screen in Settings (0 = not set yet: a guess from the kind of device).
export const DEFAULTS = { theme: 'auto', color: true, sixKey: false, dotFill: 'outline', swGrade: 1, swSize: 'large', mmPx: 0, speech: false, sounds: false, haptics: false };
// A phone's CSS pixel is smaller than the nominal 1/96 inch, so CSS millimetres come out about 40% too small there.
export const mmGuess = () => (matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600 ? 6.3 : 96 / 25.4);
export const LOONIE_MM = 26.5; // the Canadian dollar coin's diameter
export const S = { ...DEFAULTS, ...store.get('settings', {}) };
export function applySettings() {
  const r = document.documentElement;
  if (S.theme === 'auto') delete r.dataset.theme; else r.dataset.theme = S.theme;
  const b = document.body.classList;
  b.toggle('s-color', S.color); b.toggle('s-dotfill', S.dotFill === 'fill'); b.toggle('s-sw-real', S.swSize === 'real');
  r.style.setProperty('--mm', (S.mmPx || mmGuess()) + 'px');
}
export function setS(k, v) { S[k] = v; store.set('settings', S); applySettings(); window.dispatchEvent(new CustomEvent('settings', { detail: k })); }
// ---------- cells ----------
export function cellHTML(cell, cls = '', opts = {}) {
  const on = new Set(toDots(cell));
  let dots = '';
  for (let d = 1; d <= 6; d++) {
    const added = opts.added && opts.added.includes(d) && on.has(d) ? ' added' : '';
    dots += `<i class="${on.has(d) ? 'on' : ''}${added}" data-n="${d}"></i>`;
  }
  return `<span class="cell ${cls}${opts.kind ? ' k-' + opts.kind : ''}" role="img" aria-label="${esc(dotsLabel(cell))}">${dots}</span>`;
}
export const cellsHTML = (str, cls = '') => [...str].map((c) => (c === ' ' || c === '⠀' ? '<span class="bw space"><span class="cell" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span></span>' : cellHTML(c, cls))).join('');
// How many cells one print label covers (a contraction like "ity" or "mother" takes two).
export const spanOf = (list, i) => { let n = 1; while (list[i + n] && list[i + n].idx > 0 && list[i + n].kind !== 'space' && list[i + n].kind !== 'newline') n++; return n; };
// Label element; when it covers several cells it stretches across them with a line after the letters.
export const lblTag = (n, text = '') => `<span class="lbl${n > 1 ? ' span" style="--n:' + n : ''}">${text}</span>`;
export function lineHTML(parts, { labels = true, cls = '' } = {}) {
  let out = '', word = '';
  const flush = () => { if (word) out += `<span class="bword">${word}</span>`; word = ''; };
  const list = toCells(parts);
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (c.kind === 'newline') { flush(); out += '<span class="bw-break"></span>'; continue; }
    if (c.kind === 'space') { word += '<span class="bw space"><span class="cell" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span></span>'; flush(); continue; }
    const lbl = c.idx === 0 ? (c.print || (c.kind === 'indicator' ? '·' : '')) : '';
    word += `<span class="bw kind-${c.kind}" title="${esc((c.group.print || '') + ' ' + (c.note || ''))}">${cellHTML(c.cell, cls, { kind: kindOf(c) })}${labels ? lblTag(c.idx === 0 ? spanOf(list, i) : 1, esc(lbl)) : ''}</span>`;
  }
  flush();
  return `<div class="braille-line">${out}</div>`;
}
// Colour-coding kind for a translated cell (the number sign belongs with its digits).
export function kindOf(c) {
  if (c.kind === 'indicator' && /number/.test(c.note || '')) return 'digit';
  return ['letter', 'digit', 'punct', 'contraction', 'indicator', 'math'].includes(c.kind) ? c.kind : '';
}
export const cellsK = (str, kind, cls = '') => [...str].map((c) => cellHTML(c, cls, { kind })).join('');
// Compact row: cells · label · dot numbers · note (a button when it opens a detail sheet).
export function crowHTML(cells, label, { kind = '', note = '', i = null, added = null, pre = '', ex = '' } = {}) {
  const tag = 'div';
  return `<${tag} class="crow${ex ? ' has-ex' : ''}"><span class="cells">${[...cells].map((c) => cellHTML(c, '', { kind, added })).join('')}</span><b>${pre ? `<span class="pre">${esc(pre)}</span>` : ''}${esc(label)}</b>${ex ? '<button type="button" class="ex-tog" aria-expanded="false">Examples</button>' : ''}<span class="cnote">${esc(note)}</span>${ex ? `<div class="crow-ex" hidden>${ex}</div>` : ''}</${tag}>`;
}
// Tables holding any multi-cell symbol collapse to one column sooner, so every row in a section lines up.
export function markMulti(root = document) {
  $$('.ctable', root).forEach((t) => {
    const multi = !!t.querySelector('.cells .cell + .cell');
    t.classList.toggle('multi', multi);
    // Rows with one, two or three cells share one cells column, so the names line up down the table.
    if (multi) { const w = Math.max(...$$('.crow .cells', t).map((c) => c.scrollWidth)); if (w > 0) { t.style.setProperty('--cw', w + 'px'); t.classList.add('cw'); } }
  });
}
// Labelled groups: "cells:label cells:label _ cells:label" (_ = space)
export function groupsHTML(spec, cls = 'md', fixedKind = '') {
  return `<div class="braille-line groups">${spec.split(' ').map((g) => {
    if (g === '_') return '<span class="bw space"></span>';
    const i = g.indexOf(':');
    const cells = g.slice(0, i), label = g.slice(i + 1);
    const kind = fixedKind || (/^[a-z]$/i.test(label) ? 'letter' : /^[0-9.,#]+$/.test(label) ? 'digit' : /^(cap|caps)$/.test(label) ? 'indicator' : 'math');
    return `<span class="bgroup"><span class="mrow">${cellsK(cells, kind, cls)}</span><span class="lbl">${esc(label)}</span></span>`;
  }).join('')}</div>`;
}
// ---------- modal sheet ----------
export const sheet = $('#sheet');
export const backdrop = $('#sheetBackdrop');
// The sheet is a modal dialog: named by its title, Tab stays inside it, and closing it puts focus back
// on whatever opened it.
let sheetOpener = null;
export function openSheet(html, { title = '' } = {}) {
  if (sheet.hidden) sheetOpener = document.activeElement;
  sheet.innerHTML = `<div class="sheet-head"><h2 id="sheetTitle">${esc(titleCase(title))}</h2><button class="icon-btn close" aria-label="Close">${icon('close', 20)}</button></div><div class="sheet-body">${html}</div>`;
  sheet.setAttribute('aria-labelledby', 'sheetTitle');
  sheet.hidden = false; backdrop.hidden = false; markMulti(sheet);
  sheet.scrollTop = 0;
  $('.close', sheet).onclick = closeSheet;
  $('.close', sheet).focus({ preventScroll: true });
}
export function closeSheet() {
  if (sheet.hidden) return; sheet.hidden = true; backdrop.hidden = true;
  const o = sheetOpener; sheetOpener = null;
  if (o && o.isConnected && typeof o.focus === 'function') o.focus({ preventScroll: true });
}
backdrop.onclick = closeSheet;
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (openDD) { const b = $('.dd-btn', openDD); closeDD(); if (b) b.focus(); return; }
    closeSheet(); return;
  }
  // Keep Tab inside the open sheet.
  if (e.key === 'Tab' && !sheet.hidden) {
    const f = $$('a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select, textarea, summary, [tabindex]:not([tabindex="-1"])', sheet).filter((x) => x.tabIndex >= 0 && (x.offsetParent !== null || x === document.activeElement));
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (!sheet.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
sheet.addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]')) closeSheet(); });
// ---------- custom drop-down ----------
export let openDD = null;
export function closeDD() { if (openDD) { openDD.classList.remove('open'); const b = $('.dd-btn', openDD); if (b) b.setAttribute('aria-expanded', 'false'); openDD = null; } }
document.addEventListener('click', (e) => { if (openDD && !openDD.contains(e.target)) closeDD(); });
export function dropdown(el, { label = '', options, value, onChange, plain = false, lead = '', aria = '' }) {
  const cur = options.find((o) => o.value === value);
  let lastGroup = null;
  el.classList.add('dd');
  el.innerHTML = `<button class="dd-btn" type="button" aria-haspopup="listbox" aria-expanded="false"${label && (plain || !cur) ? '' : ` aria-label="${esc([aria || label, cur ? cur.label : ''].filter(Boolean).join(': '))}"`}>${lead ? `<span class="dd-lead">${icon(lead, 18)}</span>` : ''}${plain || (label && !cur) ? `<span class="dd-v">${esc(label)}</span>` : `${label ? `<span class="dd-k">${esc(label)}</span>` : ''}<span class="dd-v">${esc(cur ? cur.label : '…')}</span>`}${icon('chevron', 18)}</button>
    <div class="dd-menu" role="listbox">${options.map((o) => {
      const g = o.group && o.group !== lastGroup ? `<div class="dd-group">${esc(o.group)}</div>` : '';
      lastGroup = o.group || lastGroup;
      return `${g}<button type="button" role="option" aria-selected="${o.value === value}" class="dd-opt ${o.value === value ? 'on' : ''}" data-v="${esc(o.value)}"><span>${esc(o.label)}${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</span>${o.value === value ? icon('check', 18) : ''}</button>`;
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
      $('.dd-btn', el).setAttribute('aria-expanded', 'true');
      // Opened from the keyboard: focus the chosen option so the arrow keys work straight away.
      if (e.detail === 0) (on || $('.dd-opt', menu)).focus();
    }
  };
  // Arrow keys move through the options; Home and End jump; Tab closes the menu.
  $('.dd-menu', el).addEventListener('keydown', (e) => {
    const opts = $$('.dd-opt', el), i = opts.indexOf(document.activeElement);
    const go = (j) => { e.preventDefault(); opts[(j + opts.length) % opts.length].focus(); };
    if (e.key === 'ArrowDown') go(i + 1); else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0); else if (e.key === 'End') go(opts.length - 1);
    else if (e.key === 'Tab') closeDD();
  });
  $('.dd-btn', el).addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' && !el.classList.contains('open')) { e.preventDefault(); $('.dd-btn', el).click(); (($('.dd-opt.on', el)) || $('.dd-opt', el)).focus(); } });
  $('.dd-menu', el).onclick = (e) => {
    const b = e.target.closest('.dd-opt'); if (!b) return;
    e.stopPropagation(); closeDD();
    const v = options.find((o) => String(o.value) === b.dataset.v).value;
    const kb = e.detail === 0;
    dropdown(el, { label, options, value: plain ? null : v, onChange, plain, lead, aria });
    if (kb) $('.dd-btn', el).focus();
    onChange(v);
  };
}
// Segmented radio group. Screen readers hear the group's name (RADIO_LABEL) and which option is on;
// only the chosen button is a Tab stop and the arrow keys move between options (the usual radio pattern).
export const RADIO_LABEL = { cat: 'Category', color: 'Dot colours', csg: 'Grade', pkg: 'Grade', dotFill: 'Unraised dots', lvl: 'Level', sixKey: 'Physical keyboard', src: 'What to read', swGrade: 'Grade', swSize: 'Size', theme: 'Appearance', trView: 'Show as', wgrade: 'Grade', wlen: 'Word length', speech: 'Spoken feedback', sounds: 'Sounds', haptics: 'Haptics', wsrc: 'What to write', cgrade: 'Grade' };
export const radios = (name, opts, value) => `<div class="seg radios" role="radiogroup" data-seg="${name}"${RADIO_LABEL[name] ? ` aria-label="${RADIO_LABEL[name]}"` : ''}>${opts.map(([v, l]) => { const on = String(v) === String(value); return `<button type="button" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" data-v="${v}" class="${on ? 'on' : ''}">${l}</button>`; }).join('')}</div>`;
export function bindRadios(root, fn) {
  root.addEventListener('click', (e) => {
    const g = e.target.closest('[data-seg]'), b = e.target.closest('[data-seg] button');
    if (!g || !b || !root.contains(g)) return;
    $$('button', g).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); x.tabIndex = x === b ? 0 : -1; });
    fn(g.dataset.seg, b.dataset.v);
  });
}
// Arrow keys in any radio group (segmented buttons, the Practice mode links): move to the next option and pick it.
document.addEventListener('keydown', (e) => {
  if (!/^Arrow(Left|Right|Up|Down)$/.test(e.key) || e.altKey || e.metaKey || e.ctrlKey) return;
  const g = e.target.closest && e.target.closest('[role="radiogroup"]'); if (!g) return;
  const items = $$('[role="radio"]', g).filter((x) => !x.disabled), i = items.indexOf(e.target); if (i < 0) return;
  e.preventDefault(); e.stopPropagation();
  const n = items[(i + (/Right|Down/.test(e.key) ? 1 : -1) + items.length) % items.length];
  n.focus(); n.click();
  // Some pickers redraw themselves when the choice changes: focus the same option in the new group.
  if (!n.isConnected) { const seg = g.dataset.seg, v = n.dataset.v; const m = seg && $(`[data-seg="${seg}"] [data-v="${v}"]`); if (m) m.focus(); }
}, true);
// ---------- header + sticky control row ----------
export const headTitle = $('#headTitle');
export const helpBtn = $('#helpBtn');
export const subbar = $('#subbar');
export const PAGE_ICON = { home: 'home', practice: 'practice', reference: 'book', games: 'games', translate: 'translate' };
// A game passes its key and icon so the bar shows the game's own coloured icon, as on its Games tile.
export const setTitle = (t, game) => { headTitle.innerHTML = `${game ? `<span class="ht-ic ht-game hrow-ic gc-${game[0]}">${icon(game[1], 18)}</span>` : `<span class="ht-ic">${icon(PAGE_ICON[document.body.dataset.page] || 'home', 22)}</span>`}<span class="ht-t">${esc(titleCase(t))}</span>`; };
export const setSub = (html) => { subbar.innerHTML = html; subbar.hidden = !html; syncHeadH(); };
export function syncHeadH() { requestAnimationFrame(() => document.documentElement.style.setProperty('--head-h', $('.top').offsetHeight + 'px')); }
// ---------- settings modal ----------
// Settings preview: one short line that shows every dot colour (capital, Grade 2 sign, number, letters, maths, punctuation).
// It follows the live settings, so theme, unraised dots and colours change in place as you tap.
// Compact: one label per word, so it fits on one line on most phones and two on the smallest.
const settingsPreview = () => {
  const words = [[]];
  translate('The 2 cats + 1!', 'en', 2).forEach((p) => { if (p.kind === 'space') words.push([]); else words.at(-1).push(p.print === '+' ? { ...p, kind: 'math' } : p); });
  const word = (ps) => `<span class="sp-w"><span class="sp-c">${ps.map((p) => [...p.cells].map((c) => cellHTML(c, '', { kind: kindOf(p) })).join('')).join('')}</span><span class="sp-l">${esc(ps.map((p) => (p.kind === 'indicator' ? '' : p.print)).join(''))}</span></span>`;
  return `<div class="set-prev" aria-hidden="true"><small>Preview</small><div class="sp-line">${words.map(word).join('')}</div></div>`;
};
export function openSettings() {
  const pv = (mode) => `<span class="cell pv-${mode}" aria-hidden="true">${[1, 2, 3, 4, 5, 6].map((d) => `<i class="${[1, 4, 5].includes(d) ? 'on' : ''}"></i>`).join('')}</span>`;
  openSheet(`<div class="settings">
    <div class="set-group">
      <div class="set-row stack"><span>Appearance</span>${radios('theme', [['auto', `${icon('auto', 18)}Auto`], ['light', `${icon('sun', 18)}Light`], ['dark', `${icon('moon', 18)}Dark`]], S.theme)}</div>
      ${settingsPreview()}
      <div class="set-row stack"><span>Unraised dots</span>${radios('dotFill', [['outline', `${pv('outline')}Outline`], ['fill', `${pv('fill')}Filled`]], S.dotFill)}</div>
      <div class="set-row stack"><span>Braille size</span>${radios('swSize', [['large', 'Large'], ['real', 'Real size']], S.swSize)}</div>
      <div class="mm-cal" id="mmCal" ${S.swSize === 'real' ? '' : 'hidden'}>
        <p class="set-note">Real size shows braille as big as it is on paper and signs, in Guess, Type, Read and Translate. To get it right on this screen, hold a loonie against the circle and slide until they match.</p>
        <div class="mm-row"><span class="mm-coin" aria-hidden="true"></span><span class="mm-demo" aria-hidden="true">${['⠠', '⠑', '⠭', '⠊', '⠞'].map((c) => cellHTML(c)).join('')}</span></div>
        <div class="mm-ctl"><button class="icon-btn small" type="button" id="mmLess" aria-label="Smaller">−</button><input type="range" id="mmRange" min="2.5" max="9" step="0.05" value="${S.mmPx || mmGuess()}" aria-label="Size of the circle"><button class="icon-btn small" type="button" id="mmMore" aria-label="Bigger">+</button></div>
        <p class="set-note mm-state" id="mmState">${S.mmPx ? 'Matched to a coin on this screen.' : 'Not matched yet: sizes are a guess for this kind of device.'}</p>
      </div>
      <div class="set-row stack"><span>Dot colours</span>${radios('color', [['1', 'Colour-coded'], ['0', 'Uniform']], S.color ? '1' : '0')}</div>
      <div class="set-row stack"><span>Physical keyboard</span>${radios('sixKey', [['0', 'Letters'], ['1', 'Six-key']], S.sixKey ? '1' : '0')}</div>
      <p class="set-note six-note">Six-key types braille like a Perkins brailler with F D S J K L (dots 1 to 6): hold the keys for one cell together, then let go. Works in Guess, Draw, Write, Type, the games and Braille to text.</p>
    </div>
    <div class="set-group"><h3>Accessibility</h3>
      <div class="set-row stack"><span>Spoken feedback</span>${radios('speech', [['0', 'Off'], ['1', 'On']], S.speech ? '1' : '0')}</div>
      <div class="set-row stack"><span>Sounds</span>${radios('sounds', [['0', 'Off'], ['1', 'On']], S.sounds ? '1' : '0')}</div>
      ${hapticsAvailable() ? `<div class="set-row stack"><span>Haptics</span>${radios('haptics', [['0', 'Off'], ['1', 'On']], S.haptics ? '1' : '0')}</div>` : ''}
      <p class="set-note">Spoken feedback reads out right and wrong answers, new questions and braille cells as dot numbers${speechAvailable() ? '' : ' (this browser has no speech voices, so only sounds will play)'}. Turn it off if you use a screen reader, which already hears all of this. Sounds play a soft tone for right and wrong answers.${hapticsAvailable() ? ' Haptics: a light tap when you raise a dot, one tick for right, two for wrong, and a short-long pulse when a round, lesson or game ends.' : ''} Animations follow your device’s reduce-motion setting.</p>
    </div>
    <div class="set-group"><h3>Your data</h3>
      <p class="set-note">Everything is saved on this device only. Save a backup file to keep it safe or move it to another device. Each reset asks you to tap again to confirm.</p>
      <div class="reset-list">
        <div class="reset-row backup-row"><span><b>Backup</b><small>Progress, scores and settings in one small file</small></span><span class="row"><button class="btn small-btn" type="button" id="bkSave">Save</button><button class="btn small-btn" type="button" id="bkLoad">Restore</button></span></div>
        <input type="file" id="bkFile" accept=".json,application/json" hidden>
        <div class="reset-row" data-r="games"><span><b>Game progress</b><small>Scores, bests, levels, solved riddles and Secret Agent cases</small></span><button class="btn small-btn" type="button">Reset</button></div>
        <div class="reset-row" data-r="learn"><span><b>Learning progress</b><small>Practice, Auto and finished lessons</small></span><button class="btn small-btn" type="button">Reset</button></div>
        <div class="reset-row" data-r="all"><span><b>Everything</b><small>All of the above, plus these settings</small></span><button class="btn small-btn" type="button">Reset</button></div>
      </div>
    </div>
    <div class="set-group about"><h3>About Learn Braille</h3><p>A resource for sighted folks to learn the braille writing system. Braille follows Unified English Braille unless noted. Made for learning — for official transcription, consult a certified braille transcriber.</p>
      <a class="gh-link" href="https://github.com/updownupdown/braille" target="_blank" rel="noopener">${icon('github', 16)} Source code on GitHub</a></div>
  </div>`, { title: 'Settings' });
  bindRadios($('.settings', sheet), (k, v) => {
    if (k === 'color') { setS('color', v === '1'); return; }
    if (k === 'sixKey') { setS('sixKey', v === '1'); return; }
    if (k === 'speech') { setS('speech', v === '1'); if (v === '1') speak('Spoken feedback is on'); else stopSpeech(); return; }
    if (k === 'sounds') { setS('sounds', v === '1'); if (v === '1') tone(true); return; }
    if (k === 'swSize') $('#mmCal', sheet).hidden = v !== 'real';
    if (k === 'haptics') { setS('haptics', v === '1'); if (v === '1') haptic('right', { force: true }); return; }
    setS(k, typeof DEFAULTS[k] === 'number' ? Number(v) : v);
  });
  // Coin calibration: the circle is LOONIE_MM "millimetres" wide at the current scale.
  const mm = $('#mmRange', sheet);
  const setMm = (v) => { v = Math.max(2.5, Math.min(9, Math.round(v * 20) / 20)); mm.value = v; setS('mmPx', v); $('#mmState', sheet).textContent = 'Matched to a coin on this screen.'; };
  mm.oninput = () => setMm(Number(mm.value));
  $('#mmLess', sheet).onclick = () => setMm(Number(mm.value) - 0.05);
  $('#mmMore', sheet).onclick = () => setMm(Number(mm.value) + 0.05);
  // Each reset needs a second tap; it goes back to normal after a few seconds if left alone.
  // Backup: every dots.* key in one JSON file; restoring replaces what is on this device and reloads.
  $('#bkSave', sheet).onclick = () => {
    const blob = new Blob([JSON.stringify(snapshot(), null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `learn-braille-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    $('#bkSave', sheet).textContent = 'Saved ✓';
  };
  $('#bkLoad', sheet).onclick = () => $('#bkFile', sheet).click();
  $('#bkFile', sheet).onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const btn = $('#bkLoad', sheet);
    try {
      restore(JSON.parse(await f.text()));
      btn.textContent = 'Restored ✓'; setTimeout(() => location.reload(), 700);
    } catch { btn.textContent = 'Not a backup file'; btn.classList.add('danger'); setTimeout(() => { btn.textContent = 'Restore'; btn.classList.remove('danger'); }, 2500); }
  };
  $$('.reset-row[data-r]', sheet).forEach((row) => {
    const btn = $('button', row); let armed = 0;
    btn.onclick = () => {
      if (!armed) { btn.textContent = 'Tap to confirm'; btn.classList.add('danger'); armed = setTimeout(() => { armed = 0; btn.textContent = 'Reset'; btn.classList.remove('danger'); }, 4000); return; }
      clearTimeout(armed);
      clear(row.dataset.r);
      btn.textContent = 'Done ✓'; btn.disabled = true; btn.classList.remove('danger');
      setTimeout(() => location.reload(), 700);
    };
  });
}
// ---------- letter + symbol details ----------
export const WORDSIGN_OF = Object.fromEntries(CONTRACTIONS['Alphabetic wordsigns'].items.map(([w, d]) => [fromDots(d), w]));
export const DIGIT_OF = Object.fromEntries('abcdefghij'.split('').map((l, i) => [l, String((i + 1) % 10)]));
export const mirror = (cell) => fromDots(toDots(cell).map((d) => (d <= 3 ? d + 3 : d - 3)).join(''));
export const LETTER_OF = Object.fromEntries(Object.entries(LETTERS).map(([l, c]) => [c, l]));
export const mirrorLetter = (l) => { const m = LETTER_OF[mirror(LETTERS[l])]; return m && m !== l ? m : null; };
export function letterDetail(l) {
  const c = LETTERS[l];
  const idx = 'abcdefghijklmnopqrstuvwxyz'.indexOf(l);
  let row;
  if (idx < 10) row = 'First row (a–j): only the top four dots. Every other row is built from this one.';
  else if (idx < 20) row = `Second row (k–t): ${'abcdefghij'[idx - 10]} plus the lower-left dot.`;
  else if (l === 'w') row = 'W is the odd one out: French had no w when braille was invented, so it was added later. It’s j plus the lower-right dot.';
  else row = `Third row: ${'abcdefghij'['uvxyz'.indexOf(l)]} plus both bottom dots.`;
  const m = mirrorLetter(l);
  return `<div class="detail">
    <div class="detail-top">${cellHTML(c, 'xl')}<div><div class="big">${l}</div></div></div>
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
export function symbolDetail(e) {
  const cells = [...e.cells];
  return `<div class="detail">
    <div class="detail-top"><div class="row" style="gap:6px">${cells.map((c) => cellHTML(c, cells.length > 2 ? 'lg' : 'xl', { kind: e.kind })).join('')}</div></div>
    <h2>${esc(e.print)}</h2>
    <dl>
      <dt>Type</dt><dd>${esc(e.cat)}</dd>
      
      ${e.note ? `<dt>Note</dt><dd>${esc(e.note)}</dd>` : ''}
      ${e.blurb ? `<dt>Rule</dt><dd>${esc(e.blurb)}</dd>` : ''}
    </dl>
  </div>`;
}
// ---------- dictionary ----------
export const DICT = [];
for (const l of 'abcdefghijklmnopqrstuvwxyz') DICT.push({ print: l, cells: LETTERS[l], cat: 'Letter', group: 'Letters' });
for (const d of '1234567890') DICT.push({ print: d, cells: IND.number + LETTERS['jabcdefghi'[Number(d)]], cat: 'Number', group: 'Numbers' });
export const seenP = new Set();
for (const [p, v] of Object.entries(UEB_PUNCT)) {
  if (!v || seenP.has(v[1])) continue; seenP.add(v[1]);
  DICT.push({ print: p, cells: v[0], cat: 'Punctuation & symbols', note: v[1], group: 'Punctuation' });
}
DICT.push({ print: '“ ”', cells: fromDots('236') + fromDots('356'), cat: 'Punctuation & symbols', note: 'open and close quotes', group: 'Punctuation' });
export const INDICATORS = [
  ['capital letter', '6', 'Next letter is a capital.'], ['capital word', '6 6', 'The whole next word is in capitals.'],
  ['capital passage', '6 6 6', 'Three or more words in capitals, ended by the terminator.'], ['capitals terminator', '6 3', 'Ends a capital word or passage.'],
  ['number sign', '3456', 'Letters a–j that follow are digits 1–0.'], ['grade 1 symbol', '56', 'Read the next cell as a plain letter, not a contraction.'],
  ['grade 1 word', '56 56', 'Read the next word uncontracted.'], ['grade 1 passage', '56 56 56', 'Uncontracted passage.'],
  ['italic', '46 23', 'Italic symbol (a different sign marks a whole italic word).'], ['bold', '45 23', 'Bold symbol.'],
];
for (const [p, d, n] of INDICATORS) DICT.push({ print: p, cells: cellsOf(d), cat: 'Indicator', note: n, group: 'Indicators' });
for (const [cat, { blurb, items }] of Object.entries(CONTRACTIONS)) for (const [p, d, n] of items) DICT.push({ print: p, cells: cellsOf(d), cat, note: n || '', blurb, group: cat });
export const KIND_OF_GROUP = { Letters: 'letter', Numbers: 'digit', Punctuation: 'punct', Indicators: 'indicator' };
for (const e of DICT) e.kind = KIND_OF_GROUP[e.group] || 'contraction';
export const SEC_OF_GROUP = { Letters: 'alphabet', Numbers: 'numbers', Punctuation: 'numbers', Indicators: 'numbers' };
export const practiseLink = (href) => `<a class="gt-link" href="${href}">Practise ${icon('right', 16)}</a>`;
export const groupBlock = (g, title, blurb, href) => `<div class="group-title"><h3>${titleCase(title)}</h3>${blurb ? `<span>${esc(blurb)}</span>` : ''}${href ? practiseLink(href) : ''}</div><div class="ctable narrow">${DICT.map((e, i) => [e, i]).filter(([e]) => e.group === g).map(([e, i]) => crowHTML(e.cells, e.print, { kind: e.kind, i, note: e.group === 'Numbers' ? '' : e.note })).join('')}</div>`;
// "Examples" block that closes a section: [print, note] pairs.
export const exBlock = (list, grade = 1) => `<div class="ex-block"><h4 class="ex-h">Examples</h4><div class="example-grid">${list.map(([t, n]) => `<div class="example"><div class="print">${esc(t)}</div>${lineHTML(translate(t, 'en', grade), { cls: 'sm' })}${n ? `<p class="muted small ex-note">${esc(n)}</p>` : ''}</div>`).join('')}</div></div>`;
export const view = $('#view');
export const views = {};
export const mastery = () => {
  const m = store.get('mastery', {});
  // v4 stored one score per item; keep it as the Read score.
  if (Object.keys(m).some((k) => !/^[rw]:/.test(k))) {
    for (const k of Object.keys(m)) if (!/^[rw]:/.test(k)) { m['r:' + k] = m[k]; delete m[k]; }
    store.set('mastery', m);
  }
  return m;
};
export const level = (score) => Math.min(4, score);
