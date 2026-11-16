// Practice > Write: a few words or a short sentence to write in braille on the dot pad (or with six-key typing).
// Every cell is checked as you go: when the dots match the next cell it is added by itself, a dot that isn't in
// that cell turns red at once, and spaces between words are added for you. The words and what you've written
// sit on one line at the top that scrolls sideways for longer text. Each finished line shows its writing speed in
// words a minute, from the first dot to the last cell; the best is kept per grade and per way of writing (tapping
// the dots or six-key typing), and only lines written without a hint or a peek count towards it.
import { translate, unicodeOf, fromDots, toDots } from './braille.js';
import { COMMON_WORDS } from './wordlist.js';
import { PHRASES, formatLine } from './phrases.js';
import { chord, sixKeyOn } from './sixkey.js';
import { $, $$, cellHTML, esc, radios, bindRadios, shuffle, store, sheet } from './core.js';
import { announce, feedback, tone, cellLabel, say, refocus, reducedMotion } from './a11y.js';
import { logDay } from './home.js';
import { setPeek } from './learn.js';

export const COMPOSE_SRC = { words: 'Words', phrases: 'Sentences', formats: 'Everyday' };
const BLANK = '⠀';
// Fresh text every time, never the same twice in a row.
function deckOf(list) { let d = []; return () => { if (!d.length) d = shuffle(list); return d.pop(); }; }
const nextWords = deckOf(COMMON_WORDS.filter((w) => /^[a-z]{3,5}$/.test(w)).slice(0, 1200));
const nextPhrase = deckOf(PHRASES.filter((p) => p.length <= 34 && /^[a-z ]+$/i.test(p)));
const textFor = (src) => (src === 'words' ? [nextWords(), nextWords(), nextWords()].join(' ') : src === 'formats' ? formatLine()[0] : nextPhrase());
// Best writing speed: per grade, and per way of writing, since six-key typing is much faster than tapping dots.
export const speedKey = (grade, six) => `cwBest${grade}${six ? 'k' : ''}`;

// The text split into words, each with its braille cells, in writing order.
export function composeWords(text, grade) {
  const cells = [...unicodeOf(translate(text, 'en', grade)).replace(/ /g, BLANK)];
  const prints = text.trim().split(/\s+/), groups = [[]];
  for (const c of cells) { if (c === BLANK) groups.push([]); else groups[groups.length - 1].push(c); }
  const words = groups.filter((g) => g.length);
  // Print and braille words line up one to one for this text (letters and spaces only); if not, one block.
  if (words.length !== prints.length) return [{ print: text, cells: words.flat() }];
  return words.map((c, i) => ({ print: prints[i], cells: c }));
}

export function composeMode(q) {
  let src = q.get('src') || store.get('cwSrc', 'words');
  if (!COMPOSE_SRC[src]) src = 'words';
  let grade = store.get('cwGrade', 1);
  const stats = { right: 0, total: 0, wpm: 0, best: 0, six: false, counts: false };
  $('#picker').innerHTML = `<div class="sw-row cw-pick">${radios('wsrc', Object.entries(COMPOSE_SRC), src)}${radios('cgrade', [[1, 'Grade 1'], [2, 'Grade 2']], grade)}</div>`;
  $('#modeBody').innerHTML = `<div class="card stage cw-stage" id="stage"></div><div class="w-score" id="cwScore"></div>`;
  const stage = $('#stage');
  bindRadios($('#picker'), (k, v) => {
    if (k === 'wsrc') { src = v; store.set('cwSrc', v); }
    if (k === 'cgrade') { grade = Number(v); store.set('cwGrade', grade); }
    stats.wpm = 0; score();
    start();
  });
  // words: [{print, cells}]; wi/ci: the cell being written; pad: dots set so far; bad: a wrong dot shown in red.
  // t0: the first dot or cell of the line; helped: a hint or a peek was used; sixUsed: a cell came from six-key typing.
  let fresh = null, text = '', words = [], wi = 0, ci = 0, pad = new Set(), bad = 0, slips = 0, done = false, t0 = 0, helped = false, sixUsed = false;
  const want = () => words[wi]?.cells[ci];
  // Peeking at the cheat sheet mid-line counts like a hint: not right first time, and the speed isn't a best.
  setPeek(() => [grade, src === 'formats' ? 'numbers' : grade === 2 ? null : 'letters'], () => { if (!done) { slips++; helped = true; } });
  const score = () => {
    const b = store.get(speedKey(grade, stats.six), 0);
    $('#cwScore').innerHTML = `<span>Right first time: <b>${stats.right}</b> of ${stats.total}</span>${stats.wpm ? `<span>Speed: <b>${stats.wpm}</b> words a minute${!stats.counts ? ' (with help, so not a best)' : stats.wpm >= b ? ' · new best' : ''}</span>` : ''}${b ? `<span>Best${stats.six ? ' (six-key)' : ''}: <b>${b}</b></span>` : ''}`;
  };
  function start() {
    text = textFor(src); words = composeWords(text, grade);
    wi = 0; ci = 0; pad = new Set(); bad = 0; slips = 0; done = false; t0 = 0; helped = false; sixUsed = false;
    stage.classList.remove('glow-good', 'glow-bad', 'finished');
    stage.innerHTML = `
      <div class="cw-strip" id="cwStrip" tabindex="-1" role="img">${words.map((w, i) => `
        <div class="cw-w" data-w="${i}"><span class="cw-p">${esc(w.print)}</span><span class="cw-cells"></span></div>`).join('')}</div>
      <div class="cw-edit" id="cwEdit">
        <button type="button" class="link-btn pillish" id="cwHint">Hint</button>
        <div class="dotpad cw-pad" id="cwPad" role="group" aria-label="Dots">${[1, 2, 3, 4, 5, 6].map((d) => `<button type="button" data-d="${d}" aria-pressed="false" aria-label="Dot ${d}">${d}</button>`).join('')}</div>
        <button type="button" class="link-btn pillish" id="cwSkip">Skip</button>
      </div>
      <div class="cw-foot" id="cwFoot" hidden><button type="button" class="btn primary" id="cwNext">Next</button></div>`;
    paint(true); refocus(stage, $('#cwStrip', stage));
    say(`Write in Grade ${grade}: ${text}`);
  }
  // The line at the top: every word's cells so far, the current word marked, the cell being built dashed.
  function paint(jump) {
    $$('.cw-w', stage).forEach((el, i) => {
      const w = words[i], n = i < wi || done ? w.cells.length : i === wi ? ci : 0;
      el.classList.toggle('cur', i === wi && !done); el.classList.toggle('done', i < wi || done);
      let h = w.cells.slice(0, n).map((c, k) => `<span class="cw-c${fresh && fresh[0] === i && fresh[1] === k ? ' fresh' : ''}">${cellHTML(c, 'sm')}</span>`).join('');
      if (i === wi && !done) h += `<span class="cw-c now${bad ? ' bad' : ''}">${cellHTML(fromDots([...pad].sort().join('')) || BLANK, 'sm')}</span>`;
      el.querySelector('.cw-cells').innerHTML = h;
      el.setAttribute('aria-hidden', 'true');
    });
    $$('#cwPad button', stage).forEach((b) => {
      const d = Number(b.dataset.d), on = pad.has(d);
      b.classList.toggle('on', on); b.classList.toggle('bad', d === bad); b.setAttribute('aria-pressed', String(on));
    });
    const strip0 = $('#cwStrip', stage);
    if (strip0) strip0.setAttribute('aria-label', done ? `Written in Grade ${grade}: ${text}` : `Write in Grade ${grade} braille: ${text}. Now writing ${words[wi].print}, ${ci ? `${ci} ${ci === 1 ? 'cell' : 'cells'} done` : 'first cell'}${pad.size ? `, dots ${[...pad].sort().join('-')} set` : ''}`);
    const cur = $('.cw-w.cur', stage) || $('.cw-w', stage), strip = $('#cwStrip', stage);
    if (cur && strip) {
      const x = cur.offsetLeft + cur.offsetWidth / 2 - strip.clientWidth / 2;
      strip.scrollTo({ left: Math.max(0, x), behavior: jump || reducedMotion() ? 'auto' : 'smooth' });
    }
  }
  // A cell is right: add it, step past the end of the word (the space is written for you), maybe finish.
  function accept() {
    const cell = want(); pad = new Set(); bad = 0; fresh = [wi, ci]; ci++;
    const p = $('#cwPad', stage); p.classList.remove('ok'); void p.offsetWidth; p.classList.add('ok');
    let msg = `Right, ${cellLabel(cell)}`;
    if (ci >= words[wi].cells.length) {
      wi++; ci = 0;
      if (wi >= words.length) return finish();
      msg += `. Next word: ${words[wi].print}`;
    }
    paint(); fresh = null; announce(msg);
  }
  function slip(what) {
    slips++;
    const p = $('#cwPad', stage); p.classList.remove('wrong'); void p.offsetWidth; p.classList.add('wrong');
    tone(false); announce(what);
  }
  // Tapping a dot: right when the pad now matches the cell; a dot that isn't in the cell is shown red until tapped off.
  function toggle(d) {
    if (done) return;
    t0 = t0 || performance.now();
    if (pad.has(d)) { pad.delete(d); if (bad === d) bad = 0; paint(); return; }
    pad.add(d);
    const need = toDots(want());
    if (!need.includes(d)) { bad = d; paint(); return slip(`Dot ${d} isn't in this cell`); }
    paint();
    if (need.length === pad.size) accept();
  }
  // Six-key typing: a whole cell at once.
  function whole(cell) {
    if (done) return;
    t0 = t0 || performance.now(); sixUsed = true;
    if (cell === want()) { pad = new Set(); bad = 0; return accept(); }
    slip(`Not quite, ${cellLabel(cell)} isn't the next cell`);
  }
  function hint() {
    if (done) return;
    slips++; helped = true; t0 = t0 || performance.now(); pad = new Set(toDots(want()));
    paint(); announce(`Hint: ${cellLabel(want())}`);
    const c = $('.cw-c.now', stage); if (c) c.classList.add('hinted');
    setTimeout(() => { if (!done && stage.isConnected) accept(); }, 700);
  }
  function finish() {
    done = true; pad = new Set(); bad = 0; stage.classList.add('finished');
    const ok = !slips;
    stats.total++; if (ok) stats.right++; logDay();
    // Words a minute for this line; a new best only counts without hints or peeks, and after at least two seconds.
    const secs = (performance.now() - t0) / 1000, n = text.trim().split(/\s+/).length;
    stats.wpm = Math.max(1, Math.round(n / (secs / 60))); stats.six = sixUsed; stats.counts = !helped && secs >= 2;
    if (stats.counts) { const k = speedKey(grade, sixUsed); if (stats.wpm > store.get(k, 0)) store.set(k, stats.wpm); }
    score();
    paint();
    $('#cwEdit', stage).hidden = true; $('#cwFoot', stage).hidden = false;
    stage.classList.remove('glow-good', 'glow-bad'); void stage.offsetWidth; stage.classList.add(ok ? 'glow-good' : 'glow-bad');
    const speed = `${stats.wpm} words a minute`;
    if (ok) feedback(true, `All right first time. ${speed}`); else { tone(true); announce(`Done, with ${slips} ${slips === 1 ? 'slip' : 'slips'}. ${speed}`); }
    refocus(stage, $('#cwNext', stage));
  }
  stage.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.d) return toggle(Number(b.dataset.d));
    ({ cwHint: hint, cwSkip: start, cwNext: start })[b.id]?.();
  });
  // Keyboard: F D S J K L toggle the dots (or, with six-key typing on, a chord writes a whole cell). Enter: next.
  const KEYS = { f: 1, d: 2, s: 3, j: 4, k: 5, l: 6 };
  const six = chord((ds, cell) => whole(cell));
  const onKey = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey || !sheet.hidden) return;
    if (done) { if (e.key === 'Enter' && !e.target.closest?.('button')) { e.preventDefault(); start(); } return; }
    if (six.down(e)) return;
    const d = KEYS[e.key.toLowerCase()];
    if (d && !sixKeyOn()) { e.preventDefault(); toggle(d); }
  };
  const onKeyUp = (e) => { if (sheet.hidden) six.up(e); };
  document.addEventListener('keydown', onKey); document.addEventListener('keyup', onKeyUp);
  score(); start();
  return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKeyUp); };
}
