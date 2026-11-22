// Practice > Write: a few words or a short sentence to write in braille on the dot pad (or with six-key typing).
// Every cell is checked as you go: the cell being written waits as an empty outline in the line above; when the
// dots match, the pad flashes green and the cell flies up into its place. A dot that isn't in the cell turns red at
// once, and spaces between words are added for you. The words and what you've written
// sit on one line at the top that scrolls sideways for longer text. Each finished line shows its writing speed in
// words a minute, from the first dot to the last cell; the best is kept per grade and per way of writing (tapping
// the dots or six-key typing), and only lines written without a hint or a peek count towards it.
import { translate, unicodeOf, toDots } from './braille.js';
import { COMMON_WORDS } from './wordlist.js';
import { PHRASES, formatLine } from './phrases.js';
import { chord, sixKeyOn } from './sixkey.js';
import { $, $$, cellHTML, esc, radios, bindRadios, shuffle, store, sheet } from './core.js';
import { announce, feedback, cue, haptic, cellLabel, say, refocus, reducedMotion } from './a11y.js';
import { logDay } from './home.js';
import { activeNow } from './clock.js';
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
  // landing: cells ("word:cell") still flying up from the pad, kept hidden in the line until they arrive.
  const landing = new Set();
  let text = '', words = [], wi = 0, ci = 0, pad = new Set(), bad = 0, slips = 0, done = false, t0 = 0, helped = false, sixUsed = false;
  const want = () => words[wi]?.cells[ci];
  // Peeking at the cheat sheet mid-line counts like a hint: not right first time, and the speed isn't a best.
  setPeek(() => [grade, src === 'formats' ? 'numbers' : grade === 2 ? null : 'letters'], () => { if (!done) { slips++; helped = true; } });
  const score = () => {
    const b = store.get(speedKey(grade, stats.six), 0);
    $('#cwScore').innerHTML = `<span>Right first time: <b>${stats.right}</b> of ${stats.total}</span>${stats.wpm ? `<span>Speed: <b>${stats.wpm}</b> words a minute${!stats.counts ? ' (with help, so not a best)' : stats.wpm >= b ? ' · new best' : ''}</span>` : ''}${b ? `<span>Best${stats.six ? ' (six-key)' : ''}: <b>${b}</b></span>` : ''}`;
  };
  function start() {
    text = textFor(src); words = composeWords(text, grade);
    landing.clear(); $$('.cw-fly').forEach((f) => f.remove());
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
  // The line at the top: every word's cells so far, the current word marked, the cell being written an empty outline.
  function paint(jump) {
    $$('.cw-w', stage).forEach((el, i) => {
      const w = words[i], n = i < wi || done ? w.cells.length : i === wi ? ci : 0;
      el.classList.toggle('cur', i === wi && !done); el.classList.toggle('done', i < wi || done);
      let h = w.cells.slice(0, n).map((c, k) => `<span class="cw-c${landing.has(`${i}:${k}`) ? ' landing' : ''}" data-k="${i}:${k}">${cellHTML(c, 'sm')}</span>`).join('');
      if (i === wi && !done) h += `<span class="cw-c now${bad ? ' bad' : ''}">${cellHTML(BLANK, 'sm')}</span>`;
      el.querySelector('.cw-cells').innerHTML = h;
      el.setAttribute('aria-hidden', 'true');
    });
    const need = done ? [] : toDots(want());
    $$('#cwPad button', stage).forEach((b) => {
      const d = Number(b.dataset.d), on = pad.has(d);
      b.classList.toggle('on', on); b.classList.toggle('bad', on && !need.includes(d)); b.setAttribute('aria-pressed', String(on));
    });
    const strip0 = $('#cwStrip', stage);
    if (strip0) strip0.setAttribute('aria-label', done ? `Written in Grade ${grade}: ${text}` : `Write in Grade ${grade} braille: ${text}. Now writing ${words[wi].print}, ${ci ? `${ci} ${ci === 1 ? 'cell' : 'cells'} done` : 'first cell'}${pad.size ? `, dots ${[...pad].sort().join('-')} set` : ''}`);
    const cur = $('.cw-w.cur', stage) || $('.cw-w', stage), strip = $('#cwStrip', stage);
    if (cur && strip) {
      const x = cur.offsetLeft + cur.offsetWidth / 2 - strip.clientWidth / 2;
      strip.scrollTo({ left: Math.max(0, x), behavior: jump || reducedMotion() ? 'auto' : 'smooth' });
    }
  }
  // A right cell: a green copy of the pad flashes where the pad is, then shrinks and flies into the cell's place in
  // the line (following it if the line scrolls). The pad itself is clear at once, ready for the next cell.
  function flyUp(cell, key) {
    const p = $('#cwPad', stage);
    if (!p || reducedMotion()) return () => {};
    const from = p.getBoundingClientRect(), on = toDots(cell);
    const fly = p.cloneNode(true);
    fly.removeAttribute('id'); fly.removeAttribute('role'); fly.removeAttribute('aria-label'); fly.setAttribute('aria-hidden', 'true');
    fly.className = 'dotpad cw-fly';
    fly.querySelectorAll('button').forEach((b) => { b.className = on.includes(Number(b.dataset.d)) ? 'on' : ''; b.tabIndex = -1; b.removeAttribute('aria-label'); b.removeAttribute('aria-pressed'); });
    Object.assign(fly.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
    landing.add(key);
    return () => {
      document.body.appendChild(fly);
      const t0f = performance.now(), HOLD = 220, GO = 420;
      const land = () => {
        fly.remove(); landing.delete(key);
        const c = stage.querySelector(`.cw-c[data-k="${key}"]`);
        if (c) { c.classList.remove('landing'); c.classList.add('fresh'); }
      };
      const step = (now) => {
        const c = stage.isConnected && stage.querySelector(`.cw-c[data-k="${key}"]`);
        if (!c) { fly.remove(); landing.delete(key); return; }
        const t = Math.min(1, Math.max(0, (now - t0f - HOLD) / GO)), e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        const to = c.getBoundingClientRect(), s = to.height / from.height;
        const dx = to.left + to.width / 2 - (from.left + from.width / 2), dy = to.top + to.height / 2 - (from.top + from.height / 2);
        fly.style.transform = `translate(${dx * e}px, ${dy * e}px) scale(${1 + (s - 1) * e})`;
        fly.classList.toggle('go', t > 0);
        if (t < 1) requestAnimationFrame(step); else land();
      };
      requestAnimationFrame(step);
    };
  }
  // A cell is right: add it, step past the end of the word (the space is written for you), maybe finish.
  function accept() {
    const cell = want(), go = flyUp(cell, `${wi}:${ci}`);
    pad = new Set(); bad = 0; ci++;
    let msg = `Right, ${cellLabel(cell)}`;
    if (ci >= words[wi].cells.length) {
      wi++; ci = 0;
      if (wi >= words.length) { finish(); go(); return; }
      msg += `. Next word: ${words[wi].print}`;
    }
    haptic('right'); paint(); go(); announce(msg);
  }
  function slip(what) {
    slips++;
    const p = $('#cwPad', stage); p.classList.remove('wrong'); void p.offsetWidth; p.classList.add('wrong');
    cue(false); announce(what);
  }
  // Tapping a dot: right only when the pad holds exactly the cell's dots, as in Draw, so a red dot left on never
  // lets a cell through. A dot that isn't in the cell is shown red until tapped off; taking it off can complete the cell.
  function toggle(d) {
    if (done) return;
    t0 = t0 || activeNow();
    const need = toDots(want());
    if (pad.has(d)) {
      pad.delete(d);
      bad = [...pad].find((x) => !need.includes(x)) || 0;
    } else {
      pad.add(d);
      if (!need.includes(d)) { bad = d; paint(); return slip(`Dot ${d} isn't in this cell`); }
    }
    paint();
    if (need.length === pad.size && need.every((x) => pad.has(x))) accept();
  }
  // Six-key typing: a whole cell at once.
  function whole(cell) {
    if (done) return;
    t0 = t0 || activeNow(); sixUsed = true;
    if (cell === want()) { pad = new Set(); bad = 0; return accept(); }
    slip(`Not quite, ${cellLabel(cell)} isn't the next cell`);
  }
  function hint() {
    if (done) return;
    slips++; helped = true; t0 = t0 || activeNow(); pad = new Set(toDots(want()));
    paint(); announce(`Hint: ${cellLabel(want())}`);
    setTimeout(() => { if (!done && stage.isConnected) accept(); }, 700);
  }
  function finish() {
    done = true; pad = new Set(); bad = 0; stage.classList.add('finished');
    const ok = !slips;
    stats.total++; if (ok) stats.right++; logDay();
    // Words a minute for this line; a new best only counts without hints or peeks, and after at least two seconds.
    const secs = (activeNow() - t0) / 1000, n = text.trim().split(/\s+/).length;
    stats.wpm = Math.max(1, Math.round(n / (secs / 60))); stats.six = sixUsed; stats.counts = !helped && secs >= 2;
    if (stats.counts) { const k = speedKey(grade, sixUsed); if (stats.wpm > store.get(k, 0)) store.set(k, stats.wpm); }
    score();
    paint();
    $('#cwEdit', stage).hidden = true; $('#cwFoot', stage).hidden = false;
    stage.classList.remove('glow-good', 'glow-bad'); void stage.offsetWidth; stage.classList.add(ok ? 'glow-good' : 'glow-bad');
    const speed = `${stats.wpm} words a minute`;
    if (ok) feedback(true, `All right first time. ${speed}`); else { cue(true); announce(`Done, with ${slips} ${slips === 1 ? 'slip' : 'slips'}. ${speed}`); }
    refocus(stage, $('#cwNext', stage));
  }
  stage.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.d) { const d = Number(b.dataset.d); if (!done && !pad.has(d)) haptic('dot'); return toggle(d); }
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
