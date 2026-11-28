// Translate: text to braille and braille to text.
import { fromDots, translate, unicodeOf } from './braille.js';
import { readBraille } from './readbraille.js';
import { LANG_INFO } from './data.js';

import { chord } from './sixkey.js';

import { $, bindRadios, cellHTML, dropdown, esc, icon, lineHTML, radios, setSub, setTitle, store, view, views } from './core.js';
import { plateHTML } from './learn.js';
// ---------- translate ----------
// Direction pictograms: a print "A", an arrow, and a braille cell (or the reverse).
export function dirIcon(dir) {
  const A = (x) => `<path d="M${x} 17 ${x + 5} 5l5 12M${x + 2} 13h6"/>`;
  const cellG = (x) => [[0, 0, 1], [0, 1, 1], [0, 2, 0], [1, 0, 1], [1, 1, 0], [1, 2, 0]].map(([c, r, on]) => `<circle cx="${x + c * 6}" cy="${5 + r * 6}" r="2.1" ${on ? 'fill="currentColor" stroke="none"' : 'fill="none" stroke-width="1.3"'}/>`).join('');
  const arrow = '<path d="M18 11h9m-3.5-3.5L27 11l-3.5 3.5"/>';
  const body = dir === 'text' ? A(2) + arrow + cellG(34) : cellG(4) + arrow + A(31);
  return `<svg class="ic dir-ic" width="46" height="22" viewBox="0 0 44 22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
views.translate = (q) => {
  const LOPTS = [['en1', 'English (Grade 1)', 'English'], ['en2', 'English (Grade 2)', 'English'], ['fr', 'Français', 'Other languages'], ['es', 'Español', 'Other languages'], ['de', 'Deutsch', 'Other languages'], ['ru', 'Русский', 'Other languages'], ['el', 'Ελληνικά', 'Other languages']];
  let mode = q.get('lang') ? (q.get('lang') === 'en' ? 'en2' : q.get('lang')) : store.get('trMode', 'en2');
  const initial = q.get('text') || store.get('trText', 'Welcome to Canada. The washroom is on floor 2.');
  setTitle('Translate');
  let dir = q.get('text') ? 'text' : store.get('trDir', 'text');
  setSub(`<div class="seg radios tr-dir" role="radiogroup" aria-label="Direction" data-seg="trDir">${[['text', 't2b', 'Text to braille'], ['dots', 'b2t', 'Braille to text']].map(([v, ic, l]) => `<button type="button" role="radio" aria-checked="${v === dir}" tabindex="${v === dir ? 0 : -1}" data-v="${v}" class="${v === dir ? 'on' : ''}" aria-label="${l}" title="${l}">${dirIcon(v)}</button>`).join('')}</div><div id="langDD" class="dd-strong"></div><button type="button" class="btn small-btn tr-clear" id="trClear" hidden>Clear all</button>`);
  view.innerHTML = `
    <div id="trText">
      <div class="tr-ex" id="exDD"></div>
      <textarea class="tr-input" id="trIn" spellcheck="false" aria-label="Text to translate">${esc(initial)}</textarea>
      <div class="tr-view">${radios('trView', [['line', 'Line'], ['sign', 'As a sign']], store.get('trView', 'line'))}</div>
      <div class="card tr-out" id="trOut" role="region" aria-label="Braille"></div>
      <div class="tr-tools">
        <button class="btn" id="trCopy">Copy braille</button>
        <button class="btn" id="trShare">Share</button>
      </div>
      <p class="muted small">Grade 2 follows the main UEB contraction rules but is simplified — a learning aid, not a transcription tool. Other languages are uncontracted.</p>
    </div>
    <div id="trDots"></div>`;
  const showDir = () => {
    $('#trText').hidden = dir !== 'text'; $('#trDots').hidden = dir !== 'dots';
    $('#langDD').hidden = dir !== 'text'; $('#trClear').hidden = dir !== 'dots';
    if (dir === 'dots') dotsEditor($('#trDots'));
  };
  bindRadios($('.tr-dir'), (k, v) => { dir = v; store.set('trDir', v); showDir(); });
  $('#trClear').onclick = () => { if (dotsClear) dotsClear(); };
  const inp = $('#trIn');
  // The box grows with the text (field-sizing in CSS; measured here where that isn't supported).
  const fit = CSS.supports('field-sizing', 'content') ? () => {} : () => { inp.style.height = 'auto'; inp.style.height = inp.scrollHeight + 2 + 'px'; };
  const render = () => {
    fit();
    const [lang, grade] = mode.startsWith('en') ? ['en', Number(mode[2])] : [mode, 1];
    const parts = translate(inp.value, lang, grade);
    // "As a sign" shows the text the way a door or wall sign would carry it (pictogram, raised print, braille below).
    const asSign = store.get('trView', 'line') === 'sign' && inp.value.trim();
    $('#trOut').classList.toggle('as-sign', !!asSign);
    $('#trOut').innerHTML = asSign ? `<div class="sign-gallery tr-sign">${plateHTML(inp.value.trim(), lang, grade)}</div>` : lineHTML(parts);
    if (asSign) $('.plate', $('#trOut')).onclick = (e) => e.currentTarget.classList.toggle('decoded');
    $('#trOut').dataset.uni = unicodeOf(parts);
    store.set('trMode', mode); store.set('trText', inp.value);
  };
  const exLang = () => (mode.startsWith('en') ? 'en' : mode);
  const syncDD = () => {
    dropdown($('#langDD'), { lead: 'globe', options: LOPTS.map(([v, l, g]) => ({ value: v, label: l, group: g })), value: mode, onChange: (v) => { mode = v; render(); syncDD(); } });
    dropdown($('#exDD'), { label: 'Examples', plain: true, options: LANG_INFO[exLang()].phrases.map((p) => ({ value: p, label: p })), value: null, onChange: (v) => { inp.value = v; render(); } });
  };
  inp.oninput = render;
  bindRadios($('.tr-view'), (k, v) => { store.set('trView', v); render(); });
  // Share a link that opens this translation (the page reads ?lang= and ?text=); falls back to copying the link.
  $('#trShare').onclick = async () => {
    const url = `${location.origin}${location.pathname}#/translate?lang=${encodeURIComponent(mode === 'en2' ? 'en' : mode)}&text=${encodeURIComponent(inp.value)}`;
    try { if (navigator.share) { await navigator.share({ title: 'Learn Braille', text: inp.value, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(url); $('#trShare').textContent = 'Link copied ✓'; setTimeout(() => ($('#trShare').textContent = 'Share'), 1400); } catch {}
  };
  $('#trCopy').onclick = async () => { try { await navigator.clipboard.writeText($('#trOut').dataset.uni); $('#trCopy').textContent = 'Copied ✓'; setTimeout(() => ($('#trCopy').textContent = 'Copy braille'), 1400); } catch {} };
  syncDD(); render(); showDir();
  const onKey = (e) => { if (dir === 'dots' && dotsKey) dotsKey(e); };
  const onKeyUp = (e) => { if (dir === 'dots' && dotsKeyUp) dotsKeyUp(e); };
  document.addEventListener('keydown', onKey); document.addEventListener('keyup', onKeyUp);
  return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKeyUp); };
};
// Braille to text: tap dots across one or more cells along the bottom; the likeliest readings are listed above, best first.
export let dotsKey = null, dotsKeyUp = null, dotsClear = null;
export function dotsEditor(root) {
  let cells = store.get('trDots', [[5], [1, 2, 4]]);
  if (!Array.isArray(cells) || !cells.length) cells = [[]];
  let cur = cells.length - 1; // keyboard input goes to the last cell
  const uni = (d) => (d.length ? fromDots(d.slice().sort().join('')) : '⠀');
  const save = () => store.set('trDots', cells);
  const POS = [1, 4, 2, 5, 3, 6];
  dotsClear = () => { cells = [[]]; cur = 0; save(); draw(); };
  function draw() {
    // Redrawing replaces the buttons: put keyboard focus back on the same one.
    const a = document.activeElement, keep = a && root.contains(a) ? (a.dataset.n ? `.tb-cell[data-c="${a.closest('.tb-cell').dataset.c}"] [data-n="${a.dataset.n}"]` : a.id ? '#' + a.id : null) : null;
    root.innerHTML = `
      <div id="tbOut" class="tb-out" role="region" aria-label="Readings" aria-live="polite" tabindex="0"></div>
      <div class="tb-row" id="tbRow">${cells.map((d, i) => `<div class="tb-col"><div class="tb-cell" data-c="${i}">${POS.map((n) => `<button type="button" class="tb-dot ${d.includes(n) ? 'on' : ''}" data-n="${n}" aria-label="Cell ${i + 1}, dot ${n}" aria-pressed="${d.includes(n)}"></button>`).join('')}</div><button type="button" class="tb-del" data-del="${i}" aria-label="Remove cell ${i + 1}">${icon('trash', 18)}</button></div>`).join('')}
        <button type="button" class="tb-add" id="tbAdd"><span>+</span>Add cell</button></div>`;
    if (keep) { const k = $(keep, root); if (k) k.focus(); }
    // Keep the cell being written in view; a new cell at the end brings the Add button along.
    const row = $('#tbRow', root), at = $(`.tb-cell[data-c="${cur}"]`, root);
    if (cur === cells.length - 1) row.scrollLeft = row.scrollWidth;
    else if (at) { const r = at.getBoundingClientRect(), rr = row.getBoundingClientRect(); if (r.left < rr.left || r.right > rr.right) row.scrollLeft += r.left - rr.left - 12; }
    $('#tbRow', root).onclick = (e) => {
      const add = e.target.closest('#tbAdd');
      if (add) { cells.push([]); cur = cells.length - 1; save(); draw(); return; }
      const del = e.target.closest('[data-del]');
      if (del) { const i = Number(del.dataset.del); if (cells.length > 1) cells.splice(i, 1); else cells = [[]]; cur = cells.length - 1; save(); draw(); return; }
      const cell = e.target.closest('.tb-cell'); if (!cell) return;
      cur = Number(cell.dataset.c);
      const b = e.target.closest('.tb-dot');
      if (b) { const n = Number(b.dataset.n), d = cells[cur]; cells[cur] = d.includes(n) ? d.filter((x) => x !== n) : [...d, n]; save(); }
      draw();
    };
    results();
  }
  function results() {
    const str = cells.map(uni).join('').replace(/⠀+$/, '');
    const out = $('#tbOut', root);
    if (!str.replace(/⠀/g, '')) { out.innerHTML = '<p class="muted">Tap dots to build one or more cells. Leave a cell empty for a space.</p>'; return; }
    const reads = readBraille(str);
    if (!reads.length) { out.innerHTML = `<p class="muted">No known reading for this. Check the dots, or try it as separate cells.</p>`; return; }
    out.innerHTML = `<ol class="tb-list">${reads.map((r) => `<li><b>${esc(r.text)}${r.pre ? ' <span class="tb-pre" title="Read as pre-UEB (older) braille">Pre-UEB</span>' : ''}</b>
        <span>${r.toks.filter((t) => t.kind !== 'space').map((t) => `<span class="tb-tok"><span class="tb-c">${[...t.cells].map((c) => cellHTML(c, 'xs')).join('')}</span>${t.text ? `<i>${esc(t.text)}</i>` : ''} ${esc(t.kind)}</span>`).join('')}</span></li>`).join('')}</ol>`;
    out.scrollTop = 0;
  }
  const KEYS = { f: 1, d: 2, s: 3, j: 4, k: 5, l: 6 };
  // Six-key mode: a chord fills the current cell (or a new one after a filled cell) and the next chord goes after it.
  const six = chord((ds) => { if (cells[cur].length) { cells.splice(cur + 1, 0, []); cur++; } cells[cur] = ds.map(Number); save(); draw(); });
  dotsKeyUp = (e) => { if (six && !(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) six.up(e); };
  dotsKey = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.metaKey || e.ctrlKey) return;
    if (six && six.down(e)) return;
    const n = KEYS[e.key.toLowerCase()];
    if (n) { const d = cells[cur]; cells[cur] = d.includes(n) ? d.filter((x) => x !== n) : [...d, n]; save(); draw(); }
    else if (e.key === ' ') { e.preventDefault(); cells.splice(cur + 1, 0, []); cur++; save(); draw(); }
    else if (e.key === 'Backspace') { if (cells[cur].length) cells[cur] = []; else if (cells.length > 1) { cells.splice(cur, 1); cur = Math.max(0, cur - 1); } save(); draw(); }
  };
  draw();
}
