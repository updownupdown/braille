// Practice > Write: a short print sentence to write in braille, cell by cell, on the dot pad or with six-key typing.
// Check lines your cells up against the right braille (a shortest-edit alignment), so one missing cell
// doesn't make everything after it look wrong.
import { translate, unicodeOf, fromDots } from './braille.js';
import { COMMON_WORDS } from './wordlist.js';
import { PHRASES } from './phrases.js';
import { chord, sixKeyOn } from './sixkey.js';
import { $, $$, cellHTML, esc, lineHTML, radios, bindRadios, shuffle, store, sheet } from './core.js';
import { announce, feedback, cellsLabel, cellLabel, say, refocus } from './a11y.js';
import { logDay } from './home.js';

export const COMPOSE_SRC = { words: 'Words', phrases: 'Sentences' };
const BLANK = '⠀';
// Fresh text every time, never the same twice in a row.
function deckOf(list) { let d = []; return () => { if (!d.length) d = shuffle(list); return d.pop(); }; }
const nextWords = deckOf(COMMON_WORDS.filter((w) => /^[a-z]{3,5}$/.test(w)).slice(0, 1200));
const nextPhrase = deckOf(PHRASES.filter((p) => p.length <= 34 && /^[a-z ]+$/i.test(p)));
const textFor = (src) => (src === 'words' ? [nextWords(), nextWords(), nextWords()].join(' ') : nextPhrase());

// Shortest-edit alignment of what was written (a) against the answer (b): match, sub, extra (only in a), miss (only in b).
export function align(a, b) {
  const n = a.length, m = b.length, D = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i ? (j ? 0 : i) : j)));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) D[i][j] = Math.min(D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1), D[i - 1][j] + 1, D[i][j - 1] + 1);
  const out = [];
  let i = n, j = m;
  while (i || j) {
    if (i && j && D[i][j] === D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) { out.push({ t: a[i - 1] === b[j - 1] ? 'ok' : 'sub', a: a[i - 1], b: b[j - 1] }); i--; j--; }
    else if (i && D[i][j] === D[i - 1][j] + 1) { out.push({ t: 'extra', a: a[i - 1] }); i--; }
    else { out.push({ t: 'miss', b: b[j - 1] }); j--; }
  }
  return out.reverse();
}

export function composeMode(q) {
  let src = q.get('src') || store.get('cwSrc', 'words');
  if (!COMPOSE_SRC[src]) src = 'words';
  let grade = store.get('cwGrade', 1);
  const stats = { right: 0, total: 0 };
  $('#picker').innerHTML = `<div class="sw-row fit">${radios('wsrc', Object.entries(COMPOSE_SRC), src)}${radios('cgrade', [[1, 'Grade 1'], [2, 'Grade 2']], grade)}</div>`;
  $('#modeBody').innerHTML = `<div class="card stage cw-stage" id="stage"></div><div class="w-score" id="cwScore"></div>`;
  const stage = $('#stage');
  bindRadios($('#picker'), (k, v) => {
    if (k === 'wsrc') { src = v; store.set('cwSrc', v); }
    if (k === 'cgrade') { grade = Number(v); store.set('cwGrade', grade); }
    start();
  });
  let text = '', want = [], cells = [], pad = new Set(), checked = false, firstTry = true;
  const score = () => { $('#cwScore').innerHTML = `<span>Right first time: <b>${stats.right}</b> of ${stats.total}</span>`; };
  function start() {
    text = textFor(src);
    want = [...unicodeOf(translate(text, 'en', grade)).replace(/ /g, BLANK)];
    cells = []; pad = new Set(); checked = false; firstTry = true;
    stage.classList.remove('glow-good', 'glow-bad');
    stage.innerHTML = `
      <div class="cw-text" tabindex="-1"><span class="visually-hidden">Write in Grade ${grade} braille: </span>${esc(text)}</div>
      <div class="cw-line" id="cwLine" role="img"></div>
      <div class="cw-edit" id="cwEdit">
        <div class="dotpad cw-pad" id="cwPad" role="group" aria-label="Dots of the next cell">${[1, 2, 3, 4, 5, 6].map((d) => `<button type="button" data-d="${d}" aria-pressed="false" aria-label="Dot ${d}">${d}</button>`).join('')}</div>
        <div class="cw-keys">
          <button type="button" class="btn" id="cwAdd">Add cell</button>
          <button type="button" class="btn" id="cwSpace">Space</button>
          <button type="button" class="btn" id="cwBack" aria-label="Delete">⌫</button>
        </div>
      </div>
      <div class="cw-result" id="cwRes" hidden></div>
      <div class="cw-foot" id="cwFoot">
        <button type="button" class="link-btn pillish" id="cwHint">Hint</button>
        <button type="button" class="btn primary" id="cwCheck">Check</button>
      </div>`;
    paint(); refocus(stage, $('.cw-text', stage));
    say(`Write in Grade ${grade}: ${text}`);
  }
  // The written line: every cell so far, then the cell being built (dashed).
  function paint() {
    const line = $('#cwLine', stage); if (!line) return;
    const cur = fromDots([...pad].sort().join('')) || BLANK;
    line.innerHTML = cells.map((c) => (c === BLANK ? '<span class="cw-c space"></span>' : `<span class="cw-c">${cellHTML(c, 'sm')}</span>`)).join('') + (checked ? '' : `<span class="cw-c cur">${cellHTML(cur, 'sm')}</span>`);
    line.setAttribute('aria-label', cells.length ? `Written so far, ${cells.length} cells: ${cellsLabel(cells.join(''))}` : 'Nothing written yet');
    $$('#cwPad button', stage).forEach((b) => { const on = pad.has(Number(b.dataset.d)); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    line.scrollLeft = line.scrollWidth;
  }
  const add = (cell) => { if (checked) return; cells.push(cell); pad = new Set(); paint(); announce(cell === BLANK ? 'Space' : `Added ${cellLabel(cell)}`); };
  const commit = () => { if (pad.size) add(fromDots([...pad].sort().join(''))); };
  const back = () => {
    if (checked) return;
    if (pad.size) { pad = new Set(); paint(); announce('Cleared'); return; }
    if (cells.length) { cells.pop(); paint(); announce('Deleted'); }
  };
  const toggle = (d) => { if (checked) return; if (pad.has(d)) pad.delete(d); else pad.add(d); paint(); };
  function check() {
    if (checked) return;
    commit();
    if (!cells.length) return;
    while (cells.length && cells[cells.length - 1] === BLANK) cells.pop();
    const al = align(cells, want), good = al.filter((x) => x.t === 'ok').length, ok = good === want.length && al.length === want.length;
    checked = true;
    if (firstTry) { stats.total++; if (ok) stats.right++; logDay(); score(); }
    firstTry = false;
    const yours = al.map((x) => {
      if (x.t === 'miss') return `<span class="cw-c miss" title="missing"><span class="cw-gap"></span></span>`;
      if (x.a === BLANK) return `<span class="cw-c space ${x.t}"></span>`;
      return `<span class="cw-c ${x.t}">${cellHTML(x.a, 'sm')}</span>`;
    }).join('');
    const issues = al.filter((x) => x.t !== 'ok').length;
    const res = $('#cwRes', stage);
    res.hidden = false;
    res.innerHTML = `<p class="cw-sum">${ok ? 'All right.' : `${good} of ${want.length} cells right${issues ? ` · ${issues} to fix` : ''}.`}</p>
      ${ok ? '' : `<div class="cw-row"><span class="cw-k">Yours</span><div class="cw-line done">${yours}</div></div>`}
      <div class="cw-row"><span class="cw-k">Braille</span>${lineHTML(translate(text, 'en', grade), { cls: 'sm' })}</div>`;
    $('#cwEdit', stage).hidden = true; $('#cwLine', stage).hidden = true;
    $('#cwFoot', stage).innerHTML = ok ? '<button type="button" class="btn primary" id="cwNext">Next</button>' : '<button type="button" class="btn" id="cwRetry">Try again</button><button type="button" class="btn primary" id="cwNext">Next</button>';
    stage.classList.remove('glow-good', 'glow-bad'); void stage.offsetWidth; stage.classList.add(ok ? 'glow-good' : 'glow-bad');
    const wrongAt = al.map((x, i) => [x, i]).filter(([x]) => x.t !== 'ok').slice(0, 3).map(([x]) => x.t === 'miss' ? `missing ${cellLabel(x.b)}` : x.t === 'extra' ? `extra ${cellLabel(x.a)}` : `${cellLabel(x.a)} should be ${cellLabel(x.b)}`);
    feedback(ok, ok ? '' : `${good} of ${want.length} cells right. ${wrongAt.join('; ')}`);
    refocus(stage, $('#cwNext', stage));
  }
  // Try again: back to the pad with your cells as they were, so you can fix the end of the line.
  function retry() {
    checked = false;
    $('#cwRes', stage).hidden = true; $('#cwEdit', stage).hidden = false; $('#cwLine', stage).hidden = false;
    $('#cwFoot', stage).innerHTML = '<button type="button" class="link-btn pillish" id="cwHint">Hint</button><button type="button" class="btn primary" id="cwCheck">Check</button>';
    stage.classList.remove('glow-good', 'glow-bad'); paint();
    refocus(stage, $('#cwPad button', stage));
  }
  // Hint: remove wrong cells from the end until the line matches the answer so far, then add the next right cell.
  function hint() {
    if (checked) return;
    firstTry = false; pad = new Set();
    let k = 0; while (k < cells.length && cells[k] === want[k]) k++;
    if (k < cells.length) { cells = cells.slice(0, k); paint(); announce(`Removed back to cell ${k}`); return; }
    if (cells.length < want.length) add(want[cells.length]);
  }
  stage.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.d) return toggle(Number(b.dataset.d));
    ({ cwAdd: commit, cwSpace: () => { commit(); add(BLANK); }, cwBack: back, cwCheck: check, cwHint: hint, cwNext: start, cwRetry: retry })[b.id]?.();
  });
  // Keyboard: F D S J K L toggle the dots (or, with six-key typing on, a chord adds a whole cell).
  // Enter adds the cell (or checks when the pad is empty), Space adds a space, Backspace deletes.
  const KEYS = { f: 1, d: 2, s: 3, j: 4, k: 5, l: 6 };
  const six = chord((ds, cell) => add(cell));
  const onKey = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey || !sheet.hidden) return;
    if (six.down(e)) return;
    if (checked) { if (e.key === 'Enter' && !e.target.closest?.('button')) { e.preventDefault(); start(); } return; }
    const d = KEYS[e.key.toLowerCase()];
    if (d && !sixKeyOn()) { e.preventDefault(); toggle(d); return; }
    if (e.key === 'Enter' && !e.target.closest?.('button')) { e.preventDefault(); if (pad.size) commit(); else check(); return; }
    if (e.key === ' ' && !e.target.closest?.('button')) { e.preventDefault(); commit(); add(BLANK); return; }
    if (e.key === 'Backspace') { e.preventDefault(); back(); }
  };
  const onKeyUp = (e) => { if (sheet.hidden) six.up(e); };
  document.addEventListener('keydown', onKey); document.addEventListener('keyup', onKeyUp);
  score(); start();
  return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKeyUp); };
}
