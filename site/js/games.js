// Games: each game renders into a container and returns a cleanup function.
import { LETTERS, IND, translate, toCells, toDots } from './braille.js?v=33';
import { TRIVIA, RIDDLES, WORDLE, MISSIONS, ANAGRAM_WORDS } from './gamedata.js?v=33';
import { WORDS } from './data.js?v=33';
import { SNOWMAN_WORDS } from './snowman.js?v=33';
import { AGENT_CASES } from './agentcases.js?v=33';
import { COMMON_WORDS } from './wordlist.js?v=33';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const store = {
  get(k, d) { try { const v = localStorage.getItem('dots.g.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('dots.g.' + k, JSON.stringify(v)); } catch {} },
};
const AZ = 'abcdefghijklmnopqrstuvwxyz';
const AJ = 'abcdefghij';
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// Plain cell markup (same structure as the rest of the site; no colour coding, which would give answers away).
function cell(c, cls = '') {
  const on = new Set(toDots(c));
  let d = '';
  for (let i = 1; i <= 6; i++) d += `<i class="${on.has(i) ? 'on' : ''}"></i>`;
  return `<span class="cell ${cls}" aria-hidden="true">${d}</span>`;
}
// A braille line for any text; labels shown under the first cell of each print character when asked.
function line(text, { grade = 1, labels = false, cls = '' } = {}) {
  let out = '', word = '';
  const flush = () => { if (word) out += `<span class="bword">${word}</span>`; word = ''; };
  const list = toCells(translate(text, 'en', grade));
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (c.kind === 'space') { word += '<span class="bw space"><span class="cell" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span></span>'; flush(); continue; }
    if (c.kind === 'newline') continue;
    const l = labels && c.idx === 0 ? (c.print || '') : '';
    let n = 1; if (c.idx === 0) while (list[i + n] && list[i + n].idx > 0 && list[i + n].kind !== 'space') n++;
    word += `<span class="bw">${cell(c.cell, cls)}${labels ? `<span class="lbl${n > 1 ? ' span" style="--n:' + n : ''}">${esc(l)}</span>` : ''}</span>`;
  }
  flush();
  return `<span class="braille-line" role="img" aria-label="${esc(text)} in braille">${out}</span>`;
}
const letterCell = (l, cls = '') => cell(LETTERS[l], cls);
const fromDotsLocal = (d) => String.fromCharCode(0x2800 + [...d].reduce((m, n) => m | (1 << (Number(n) - 1)), 0));
const glow = (el, ok) => { el.classList.remove('glow-good', 'glow-bad'); void el.offsetWidth; el.classList.add(ok ? 'glow-good' : 'glow-bad'); };
const best = (k, v) => { const b = store.get('best.' + k, null); if (v != null && (b == null || v > b)) { store.set('best.' + k, v); return v; } return b; };
const bestLow = (k, v) => { const b = store.get('best.' + k, null); if (v != null && (b == null || v < b)) { store.set('best.' + k, v); return v; } return b; };
// Keyboard listener that ignores typing in inputs and open dialogs.
function keys(fn) {
  const h = (e) => { if (e.metaKey || e.ctrlKey || e.altKey || e.target.tagName === 'INPUT' || !document.getElementById('sheet').hidden) return; fn(e); };
  document.addEventListener('keydown', h);
  return () => document.removeEventListener('keydown', h);
}
const LV3 = [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']];
// On-screen print keyboard for games, in place of a text box (no phone keyboard popping up and taking half the screen).
// The physical keyboard works too. Returns an input-like object: value, disabled, off().
const KB_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
function letterPad({ display = null, mount, digits = false, onInput, onEnter }) {
  let value = '', disabled = false;
  const show = () => { if (display) { display.textContent = value; display.classList.toggle('empty', !value); } };
  const rows = (digits ? ['1234567890'] : []).concat(KB_ROWS);
  mount.innerHTML = `<div class="g-kb">${rows.map((r, i) => `<div class="g-kr">${[...r].map((k) => `<button type="button" data-k="${k}">${k}</button>`).join('')}${i === rows.length - 1 ? '<button type="button" class="wide" data-k="back" aria-label="Delete">⌫</button>' : ''}</div>`).join('')}</div>`;
  const press = (k) => {
    if (disabled) return;
    if (k === 'enter') { if (onEnter) onEnter(); return; }
    value = k === 'back' ? value.slice(0, -1) : value + k;
    show(); if (onInput) onInput();
  };
  const kb = mount.firstElementChild;
  // Act on touch-down for speed; keep the click for keyboard activation (Enter or Space on a focused key).
  kb.addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-k]'); if (!b) return; e.preventDefault(); press(b.dataset.k); });
  kb.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b && e.detail === 0) press(b.dataset.k); });
  const off = keys((e) => {
    const k = e.key.toLowerCase();
    if (k === 'backspace') press('back'); else if (k === 'enter') press('enter');
    else if (/^[a-z]$/.test(k) || (digits && /^[0-9]$/.test(k))) press(k);
  });
  show();
  return { get value() { return value; }, set value(v) { value = v; show(); }, set disabled(d) { disabled = d; kb.classList.toggle('off', d); }, off };
}
// Braille keyboard in the usual QWERTY layout, shared by Braidle and Snowman.
// state maps a letter to a class (hit, near, miss); actions adds Enter and Delete to the last row.
function brailleKeys({ state = {}, disabled = () => false, actions = false } = {}) {
  return KB_ROWS.map((row, ri) => {
    const last = actions && ri === KB_ROWS.length - 1;
    return `<div class="wd-krow">${last ? '<button class="wd-k wide" data-k="enter">Enter</button>' : ''}${[...row].map((k) => `<button class="wd-k ${state[k] || ''}" data-k="${k}" aria-label="${k}" ${disabled(k) ? 'disabled' : ''}>${letterCell(k)}<b>${k}</b></button>`).join('')}${last ? '<button class="wd-k wide" data-k="back" aria-label="Delete">⌫</button>' : ''}</div>`;
  }).join('');
}
// Countdown bar with the seconds written inside it. The blue part is clipped, so the text stays put.
const timerBar = (secs) => `<div class="ta-bar"><span class="ta-t">${secs}s</span><div class="ta-fill" id="bar"><span class="ta-t">${secs}s</span></div></div>`;
function setTimer(el, frac, secs) {
  const b = $('#bar', el); if (!b) return;
  b.style.clipPath = `inset(0 ${((1 - frac) * 100).toFixed(2)}% 0 0 round 999px)`;
  const t = secs + 's';
  if (b.dataset.t !== t) { b.dataset.t = t; $$('.ta-t', b.parentNode).forEach((x) => { x.textContent = t; }); }
}
// One stats row for every game: left, centre and right slots.
const statBar = (l = '', c = '', r = '') => `<div class="g-bar"><span class="l">${l}</span><span class="c">${c}</span><span class="r">${r}</span></div>`;
const scoreBest = (k, extra = '') => `<span class="g-score">Score: <b id="sc">0</b></span><span class="g-sep">/</span><span class="g-best">Best: <b id="best">${store.get('best.' + k, '–') ?? '–'}</b></span>${extra}`;
const livesHTML = (n, of = 3) => Array.from({ length: of }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
// Start screen for timed games: what to do, which symbols are in play at this level, then Start.
const startScreen = (how, incl) => `<p class="g-how">${how}</p><p class="g-incl"><b>Includes</b> ${incl}</p><button class="btn primary" id="go">Start</button>`;

// ---------- Wordle ----------
function wordle(el) {
  let answer, guesses, cur, done;
  el.innerHTML = `<div class="g-card card wd"><div class="g-confirm" id="cf" hidden><div class="g-confirm-box"><p>Start a new word? This one will be lost.</p><div class="row"><button class="btn" id="cfNo">Keep playing</button><button class="btn primary" id="cfYes">New word</button></div></div></div><button class="btn g-corner" id="new" aria-label="New word" title="New word"><svg class="ic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.7-6.2"/><path d="M3 4v5h5"/></svg> New</button><div class="wd-board" id="board"></div><p class="g-msg" id="msg"></p></div>
    <div class="wd-keys" id="keys"></div>`;
  const board = $('#board', el), msg = $('#msg', el), card = $('.g-card', el);
  const state = {};
  const score = (g) => {
    const res = Array(5).fill('miss'), left = {};
    for (let i = 0; i < 5; i++) if (g[i] === answer[i]) res[i] = 'hit'; else left[answer[i]] = (left[answer[i]] || 0) + 1;
    for (let i = 0; i < 5; i++) if (res[i] !== 'hit' && left[g[i]]) { res[i] = 'near'; left[g[i]]--; }
    return res;
  };
  const tile = (l, st = '') => `<span class="wd-tile ${st}">${l ? letterCell(l) + `<b>${l}</b>` : ''}</span>`;
  function render() {
    let h = '';
    for (let r = 0; r < 6; r++) {
      const g = guesses[r], res = g ? score(g) : null;
      const w = g || (r === guesses.length ? cur : '');
      h += `<div class="wd-row ${r === guesses.length && !done ? 'cur' : ''}">${[0, 1, 2, 3, 4].map((i) => tile(w[i], res ? res[i] : '')).join('')}</div>`;
    }
    board.innerHTML = h; card.classList.toggle('done', done);
    $('#keys', el).innerHTML = brailleKeys({ state, actions: true });
  }
  const cf = $('#cf', el);
  function press(k) {
    if (done || !cf.hidden) return;
    if (k === 'enter') {
      if (cur.length < 5) { glow(card, false); return; }
      const res = score(cur);
      [...cur].forEach((l, i) => { const rank = { hit: 3, near: 2, miss: 1 }; if (!state[l] || rank[res[i]] > rank[state[l]]) state[l] = res[i]; });
      guesses.push(cur); cur = '';
      if (guesses[guesses.length - 1] === answer) { done = true; glow(card, true); msg.textContent = `Solved in ${guesses.length}.`; }
      else if (guesses.length === 6) { done = true; glow(card, false); msg.innerHTML = `The word was <b>${answer}</b>.`; }
      render(); return;
    }
    if (k === 'back') { cur = cur.slice(0, -1); render(); return; }
    if (/^[a-z]$/.test(k) && cur.length < 5) { cur += k; render(); }
  }
  $('#keys', el).onclick = (e) => { const b = e.target.closest('[data-k]'); if (b) press(b.dataset.k); };
  const off = keys((e) => { const k = e.key.toLowerCase(); if (!cf.hidden) { if (k === 'escape') cf.hidden = true; else if (k === 'enter') { cf.hidden = true; start(); } return; } if (k === 'enter') press('enter'); else if (k === 'backspace') press('back'); else if (/^[a-z]$/.test(k)) press(k); });
  const start = () => { answer = pick(WORDLE); guesses = []; cur = ''; done = false; Object.keys(state).forEach((k) => delete state[k]); msg.textContent = ''; render(); };
  // Ask first when a word is under way, so a stray tap doesn't throw it away.
  $('#new', el).onclick = () => { if (done || (!guesses.length && !cur)) start(); else cf.hidden = false; };
  $('#cfNo', el).onclick = () => { cf.hidden = true; };
  $('#cfYes', el).onclick = () => { cf.hidden = true; start(); };
  start();
  return off;
}

// ---------- Memory ----------
function memory(el, level) {
  const n = { easy: 6, medium: 8, hard: 15 }[level];
  const LOOK = 'defhijrw';
  const pickLetters = () => (level === 'easy' ? shuffle([...AJ]).slice(0, n) : level === 'hard'
    ? [...LOOK, ...shuffle([...AZ].filter((x) => !LOOK.includes(x))).slice(0, n - LOOK.length)] : shuffle([...AZ]).slice(0, n));
  el.innerHTML = `${statBar(`Pairs <b id="pairs">0</b>/${n}`, '', `Moves <b id="moves">0</b> <span class="g-best">(Best <b id="best">–</b>)</span>`)}<div class="mem-grid n${n}" id="grid"></div><p class="g-msg" id="msg"></p><div class="g-actions"><button class="btn" id="new">New game</button></div>`;
  const grid = $('#grid', el);
  let open = [], moves = 0, matched = 0, lock = false, timer = 0;
  function start() {
    const letters = pickLetters();
    const cards = shuffle(letters.flatMap((l) => [{ l, t: 'b' }, { l, t: 'p' }]));
    grid.innerHTML = cards.map((c, i) => `<button class="mem-card" data-i="${i}" data-l="${c.l}"><span class="mem-back"></span><span class="mem-face">${c.t === 'b' ? letterCell(c.l) : `<b>${c.l}</b>`}</span></button>`).join('');
    open = []; moves = 0; matched = 0; lock = false; clearTimeout(timer);
    $('#moves', el).textContent = 0; $('#pairs', el).textContent = 0; $('#msg', el).textContent = '';
    const b = store.get('best.mem.' + level, null); $('#best', el).textContent = b == null ? '–' : b;
  }
  grid.onclick = (e) => {
    const c = e.target.closest('.mem-card');
    if (!c || c.classList.contains('up') || c.classList.contains('done')) return;
    // Tapping another card while a wrong pair is showing turns the pair back over straight away.
    if (lock) { clearTimeout(timer); open.forEach((x) => x.classList.remove('up')); open = []; lock = false; }
    c.classList.add('up'); open.push(c);
    if (open.length < 2) return;
    moves++; $('#moves', el).textContent = moves;
    const [a, b] = open;
    if (a.dataset.l === b.dataset.l) {
      a.classList.add('done'); b.classList.add('done'); open = []; matched++; $('#pairs', el).textContent = matched;
      if (matched === n) { const bb = bestLow('mem.' + level, moves); $('#best', el).textContent = bb; $('#msg', el).textContent = `All ${n} pairs in ${moves} moves.`; }
    } else {
      lock = true;
      timer = setTimeout(() => { a.classList.remove('up'); b.classList.remove('up'); open = []; lock = false; }, 1800);
    }
  };
  $('#new', el).onclick = start;
  start();
  return () => clearTimeout(timer);
}

// ---------- multiple-choice engine (Trivia, Riddles) ----------
function quiz(el, level, { next, labels = level === 'easy', print = true, choices = 4 }) {
  const grade = level === 'hard' ? 2 : 1;
  el.innerHTML = `<div class="g-qstats"><span>Question <b id="qn">1</b> / 10</span><span>Score: <b id="sc">0</b></span><div class="g-qslot" id="qslot"></div></div>
    <div class="card g-card quiz" id="card"></div><div class="q-next"><button class="btn primary" id="nextBtn" hidden>Next</button></div>`;
  const q$ = (sel) => $(sel, el);
  const card = $('#card', el);
  let n = 0, sc = 0, item, answered;
  function show() {
    item = next(); answered = false;
    const opts = shuffle([item.a, ...item.w.slice(0, choices - 1)]);
    card.classList.remove('glow-good', 'glow-bad');
    card.innerHTML = `<p class="quiz-q">${esc(item.q)}</p><div class="quiz-opts">${opts.map((o) => `<button class="quiz-opt" data-o="${esc(o)}">${line(o, { grade, labels })}${print ? `<span class="quiz-print">${esc(o)}</span>` : ''}</button>`).join('')}</div>`;
    q$('#qn').textContent = n + 1; $('#nextBtn', el).hidden = true;
  }
  card.onclick = (e) => {
    const b = e.target.closest('.quiz-opt'); if (!b || answered) return;
    answered = true;
    const ok = b.dataset.o === item.a;
    if (ok) sc++;
    q$('#sc').textContent = sc;
    glow(card, ok);
    card.classList.add('revealed');
    $$('.quiz-opt', card).forEach((x) => x.classList.add(x.dataset.o === item.a ? 'right' : x === b ? 'wrong' : 'dim'));
    $('#nextBtn', el).hidden = false;
    $('#nextBtn', el).textContent = n === 9 ? 'See score' : 'Next';
  };
  $('#nextBtn', el).onclick = () => {
    n++;
    if (n < 10) { card.classList.remove('revealed'); show(); return; }
    const b = best('quiz.' + (el.dataset.k || '') + level, sc);
    card.classList.remove('revealed', 'glow-good', 'glow-bad');
    card.innerHTML = `<div class="g-end"><b>${sc} / 10</b><span>Best ${b}</span><button class="btn primary" id="again">Play again</button></div>`;
    $('#nextBtn', el).hidden = true;
    $('#again', el).onclick = () => { n = 0; sc = 0; q$('#sc').textContent = 0; show(); };
  };
  show();
  return () => {};
}
function trivia(el, level, ctx) {
  const topics = Object.keys(TRIVIA);
  let topic = store.get('topic', 'All');
  if (topic !== 'All' && !TRIVIA[topic]) topic = 'All';
  const seen = new Set();
  const all = () => (topic === 'All' ? topics.flatMap((t) => TRIVIA[t]) : TRIVIA[topic]);
  const next = () => {
    let list = all().filter((x) => !seen.has(x));
    if (!list.length) { seen.clear(); list = all(); }
    const l = pick(list); seen.add(l);
    const [q, a, ...w] = l.split('|');
    return { q, a, w };
  };
  const run = () => {
    el.dataset.k = 'trivia';
    const stop = quiz(el, level, { next });
    ctx.dropdown($('#qslot', el), { label: 'Topic', options: ['All', ...topics].map((t) => ({ value: t, label: t === 'All' ? 'All topics' : t, hint: t === 'All' ? '500 questions' : TRIVIA[t].length + ' questions' })), value: topic, onChange: (v) => { topic = v; store.set('topic', v); seen.clear(); run(); } });
    return stop;
  };
  return run();
}
function riddles(el, level, ctx) {
  const items = RIDDLES.map((r) => r.split('|'));
  const seen = new Set();
  el.dataset.k = 'riddles';
  // Riddles never show print under the cells; Easy has three choices instead of four.
  return quiz(el, level, { labels: false, print: false, choices: level === 'easy' ? 3 : 4,
    next: () => {
      let list = items.filter((x) => !seen.has(x[0]));
      if (!list.length) { seen.clear(); list = items; }
      const [q, a] = pick(list); seen.add(q);
      const w = shuffle(items.filter((x) => x[1] !== a).map((x) => x[1])).slice(0, 3);
      return { q, a, w };
    },
  });
}

// ---------- Braille Rain ----------
function rain(el, level) {
  const cfg = { easy: { pool: AJ, v: 26, every: 2200, words: 6 }, medium: { pool: AZ, v: 34, every: 1800, words: 4 }, hard: { pool: AZ, v: 44, every: 1400, words: 2 } }[level];
  const shortWords = WORDS.filter((w) => w.length <= 5);
  el.innerHTML = `${statBar('Level <b id="lv">1</b>', '<span class="lives" id="lives"></span>', scoreBest('rain.' + level))}
    <div class="rain-field card" id="field"><div class="g-overlay" id="ov"><button class="btn primary" id="go">Start</button><small>Type each letter before it lands.</small></div></div>
    <div id="kb"></div>`;
  const field = $('#field', el);
  field.insertAdjacentHTML('beforeend', '<div class="rain-typed" id="typed" aria-live="polite"></div>');
  const inp = letterPad({ display: $('#typed', el), mount: $('#kb', el), onInput: () => check() });
  let items = [], raf = 0, last = 0, spawnT = 0, sc = 0, lives = 3, lv = 1, running = false;
  const H = () => field.clientHeight;
  const setLives = () => { $('#lives', el).innerHTML = [0, 1, 2].map((i) => `<i class="${i < lives ? 'on' : ''}"></i>`).join(''); };
  function spawn() {
    const word = lv >= cfg.words && Math.random() < 0.5;
    const text = word ? pick(shortWords) : pick([...cfg.pool]);
    const d = document.createElement('div');
    d.className = 'drop';
    d.innerHTML = line(text);
    field.appendChild(d);
    const x = 6 + Math.random() * 70;
    d.style.left = x + '%';
    items.push({ d, text, y: -50 });
  }
  function tick(t) {
    if (!running) return;
    const dt = Math.min(60, t - (last || t)) / 1000; last = t;
    spawnT -= dt * 1000;
    if (spawnT <= 0) { spawn(); spawnT = Math.max(650, cfg.every - lv * 120); }
    const v = cfg.v + lv * 7;
    for (const it of [...items]) {
      it.y += v * dt; it.d.style.transform = `translateY(${it.y}px)`;
      if (it.y > H() - 40) {
        it.d.remove(); items = items.filter((x) => x !== it); lives--; setLives(); glow(field, false);
        if (lives <= 0) return over();
      }
    }
    raf = requestAnimationFrame(tick);
  }
  function over() {
    running = false; cancelAnimationFrame(raf);
    items.forEach((i) => i.d.remove()); items = [];
    const b = best('rain.' + level, sc); $('#best', el).textContent = b;
    const ov = $('#ov', el); ov.hidden = false;
    ov.innerHTML = `<b class="g-big">${sc}</b><small>Best ${b}</small><button class="btn primary" id="go">Play again</button>`;
    $('#go', el).onclick = go;
  }
  function go() {
    sc = 0; lives = 3; lv = 1; last = 0; spawnT = 300; setLives();
    $('#sc', el).textContent = 0; $('#lv', el).textContent = 1; $('#ov', el).hidden = true;
    running = true; inp.value = ''; raf = requestAnimationFrame(tick);
  }
  const check = () => {
    const v = inp.value.trim().toLowerCase(); if (!v || !running) return;
    const hits = items.filter((i) => i.text === v).sort((a, b) => b.y - a.y);
    if (hits.length) {
      const it = hits[0]; it.d.classList.add('pop'); setTimeout(() => it.d.remove(), 180);
      items = items.filter((x) => x !== it); sc++; inp.value = '';
      $('#sc', el).textContent = sc;
      if (sc % 10 === 0) { lv++; $('#lv', el).textContent = lv; }
    } else if (!items.some((i) => i.text.startsWith(v))) { inp.value = ''; glow(field, false); }
  };
  $('#go', el).onclick = go; setLives();
  return () => { running = false; cancelAnimationFrame(raf); inp.off(); };
}

// ---------- Time Attack ----------
function timeAttack(el, level) {
  const pool = level === 'easy' ? [...AJ] : level === 'medium' ? [...AZ] : [...AZ, ...'0123456789'];
  const cellsOf = (x) => (/\d/.test(x) ? IND.number + LETTERS['jabcdefghi'[Number(x)]] : LETTERS[x]);
  const incl = { easy: 'the letters a to j.', medium: 'all 26 letters.', hard: 'all 26 letters and the digits 0 to 9, each with the number sign.' }[level];
  el.innerHTML = `${statBar('', timerBar(60), scoreBest('time.' + level))}
    <div class="card g-card ta" id="card"><button class="btn g-corner" id="skip">Skip</button><div class="g-overlay" id="ov">${startScreen('Type what each braille cell says, as fast as you can. You have 60 seconds.', incl)}</div><div class="prompt-cells" id="cells"></div></div>
    <div id="kb"></div>`;
  const card = $('#card', el);
  const inp = letterPad({ mount: $('#kb', el), digits: level === 'hard', onInput: () => check() });
  let cur, sc = 0, end = 0, raf = 0, running = false;
  const nextItem = () => { let x; do { x = pick(pool); } while (x === cur && pool.length > 1); cur = x; $('#cells', el).innerHTML = [...cellsOf(x)].map((c) => cell(c)).join(''); };
  function tick() {
    const left = Math.max(0, end - performance.now());
    setTimer(el, left / 60000, Math.ceil(left / 1000));
    if (!left) return over();
    raf = requestAnimationFrame(tick);
  }
  function over() {
    running = false; cancelAnimationFrame(raf); $('#cells', el).innerHTML = '';
    const b = best('time.' + level, sc); $('#best', el).textContent = b;
    const ov = $('#ov', el); ov.hidden = false;
    ov.innerHTML = `<b class="g-big">${sc}</b><small>Best ${b}</small><button class="btn primary" id="go">Play again</button>`;
    $('#go', el).onclick = go;
  }
  function go() { sc = 0; $('#sc', el).textContent = 0; $('#ov', el).hidden = true; running = true; end = performance.now() + 60000; inp.value = ''; nextItem(); raf = requestAnimationFrame(tick); }
  const check = () => {
    if (!running) return;
    const v = inp.value.trim().toLowerCase(); if (!v) return;
    inp.value = '';
    if (v === cur) { sc++; $('#sc', el).textContent = sc; glow(card, true); nextItem(); } else glow(card, false);
  };
  $('#skip', el).onclick = () => { if (running) nextItem(); };
  $('#go', el).onclick = go;
  return () => { running = false; cancelAnimationFrame(raf); inp.off(); };
}

// Eased horizontal scroll over a set time (the browser's smooth scroll is too quick to follow).
function glide(box, to, ms) {
  to = Math.max(0, Math.min(to, box.scrollWidth - box.clientWidth));
  cancelAnimationFrame(box._glide);
  if (!ms) { box.scrollLeft = to; return; }
  const from = box.scrollLeft, d = to - from, t0 = performance.now();
  const f = (t) => {
    const p = Math.min(1, (t - t0) / ms), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    box.scrollLeft = from + d * e;
    if (p < 1) box._glide = requestAnimationFrame(f);
  };
  box._glide = requestAnimationFrame(f);
}

// ---------- Secret Agent ----------
// Cases in rising difficulty, picked from a dropdown in the header. Progress is kept per case; no going back.
const CASES = [...AGENT_CASES, { name: 'The Blue Maple', level: 'Mixed', missions: MISSIONS }];
function agent(el, level, ctx) {
  // Carry over progress from the old single case.
  const old = store.get('agent', null);
  if (old != null && store.get('agent.p.' + (CASES.length - 1), null) == null) store.set('agent.p.' + (CASES.length - 1), Math.max(0, old - 1));
  let ci = Math.min(store.get('agent.case', 0), CASES.length - 1), pad = null;
  const prog = (i) => store.get('agent.p.' + i, 0);
  const pickCase = () => ctx.dropdown(ctx.slot, {
    label: 'Case',
    options: CASES.map((c, i) => ({ value: String(i), label: `${i + 1}. ${c.name}`, hint: `${c.level} · ${prog(i) >= c.missions.length ? 'Solved' : `${prog(i)}/${c.missions.length}`}` })),
    value: String(ci), onChange: (v) => { ci = Number(v); store.set('agent.case', ci); render(); },
  });
  function render() {
    pickCase();
    const cs = CASES[ci], N = cs.missions.length, mi = prog(ci);
    if (mi >= N) {
      if (pad) { pad.off(); pad = null; }
      el.innerHTML = `<div class="card g-card ag ag-done"><div class="ag-prog"><span>Case solved</span><span class="bar"><i style="width:100%"></i></span></div>
        <b class="ag-title">${esc(cs.name)}</b><p class="ag-brief">${esc(cs.missions[N - 1].after)}</p>
        <div class="row"><button class="btn" id="again">Play this case again</button>${ci + 1 < CASES.length ? '<button class="btn primary" id="nextCase">Next case</button>' : ''}</div></div>`;
      $('#again', el).onclick = () => { store.set('agent.p.' + ci, 0); render(); };
      if ($('#nextCase', el)) $('#nextCase', el).onclick = () => { ci++; store.set('agent.case', ci); render(); };
      return;
    }
    const m = cs.missions[mi];
    const words = m.msg.split(' ');
    let wi = 0, hinting = false;
    el.innerHTML = `<div class="ag-prog"><span>Mission ${mi + 1} of ${N}${m.grade === 2 ? ' · Grade 2' : ''}</span><span class="bar"><i style="width:${(mi / N) * 100}%"></i></span></div>
      <div class="card g-card ag">
        <div class="ag-top"><b class="ag-title">${esc(m.title)}</b><button class="btn ghost small-btn" id="hint">Hint</button></div>
        <p class="ag-brief">${esc(m.brief)}</p>
        <div class="ag-msg" id="msg">${words.map((w, i) => `<span class="ag-w" data-i="${i}">${line(w, { grade: m.grade })}<span class="ag-l"></span></span>`).join('')}</div>
        <p class="ag-after" id="after" hidden></p>
      </div>
      <div id="kb"></div>
      <div class="g-actions"><button class="btn primary" id="nextM" hidden>${mi + 1 < N ? 'Next mission' : 'Close the case'}</button></div>`;
    const card = $('.ag', el);
    if (pad) pad.off();
    const tgt = () => norm(words[wi]);
    // What you type appears under the highlighted word; letters that can't be right turn red.
    const showTyped = () => {
      if (wi >= words.length) return;
      const t = tgt();
      $(`.ag-w[data-i="${wi}"] .ag-l`, el).innerHTML = [...inp.value].map((ch, i) => `<span class="${ch === t[i] ? '' : 'bad'}">${esc(ch)}</span>`).join('');
    };
    const check = () => { if (wi < words.length && norm(inp.value) === tgt()) solveWord(); else showTyped(); };
    const inp = pad = letterPad({ mount: $('#kb', el), digits: /\d/.test(m.msg),
      onInput: () => { if (!hinting) check(); },
      onEnter: () => { if (inp.value.trim() && wi < words.length) glow(card, false); } });
    const mark = () => {
      $$('.ag-w', el).forEach((w, i) => { w.classList.toggle('cur', i === wi); w.classList.toggle('done', i < wi); });
      // The message is one scrolling line, so keep the current word centred in it.
      const msg = $('#msg', el), cur = $('.ag-w.cur', el);
      if (msg && cur) glide(msg, cur.offsetLeft - (msg.clientWidth - cur.offsetWidth) / 2, first ? 0 : 1000);
      first = false;
    };
    let first = true;
    const solveWord = () => {
      $(`.ag-w[data-i="${wi}"] .ag-l`, el).textContent = words[wi];
      wi++; inp.value = ''; mark();
      if (wi === words.length) {
        glow(card, true); inp.disabled = true; $('#hint', el).disabled = true; $('#kb', el).hidden = true;
        $('#after', el).hidden = false; $('#after', el).textContent = m.after;
        store.set('agent.p.' + ci, mi + 1); pickCase();
        $('.ag-prog .bar i', el).style.width = ((mi + 1) / N) * 100 + '%'; $('.ag-prog span', el).textContent = `Mission ${mi + 1} of ${N} · solved`;
        $('#nextM', el).hidden = false;
      }
    };
    // Hint types for you: wrong letters are deleted one at a time, then the next right letter goes in.
    $('#hint', el).onclick = () => {
      if (wi >= words.length || hinting) return;
      hinting = true;
      const w0 = wi, t = tgt();
      const step = () => {
        if (wi !== w0 || !el.isConnected) { hinting = false; return; }
        const v = inp.value;
        let k = 0; while (k < v.length && v[k] === t[k]) k++;
        if (k < v.length) { inp.value = v.slice(0, -1); showTyped(); setTimeout(step, 140); return; }
        inp.value = v + t[v.length];
        hinting = false; check();
      };
      step();
    };
    $('#nextM', el).onclick = render;
    mark();
  }
  render();
  return () => { if (pad) pad.off(); };
}

// ---------- Anagrams ----------
// Drag the cells into the right order. When they spell the word, the letters appear.
function anagrams(el, level) {
  const list = ANAGRAM_WORDS[level];
  el.innerHTML = `${statBar('Solved <b id="sc">0</b>', '', 'Streak <b id="st">0</b>')}
    <div class="card g-card an" id="card"><div class="an-cells" id="cells"></div><p class="g-msg an-tip" id="msg">Drag the cells into the right order.</p></div>
    <div class="g-actions"><button class="btn ghost" id="hint">Hint</button><button class="btn ghost" id="skip">Skip</button></div>`;
  const card = $('#card', el), box = $('#cells', el);
  let word, sc = 0, st = 0, used = false, solved = false, timer = 0, drag = null;
  const order = () => $$('.an-t', box).map((t) => t.dataset.l).join('');
  function next() {
    word = pick(list);
    let mixed;
    do { mixed = shuffle([...word]); } while (mixed.join('') === word && word.length > 1);
    used = false; solved = false;
    card.classList.remove('glow-good', 'glow-bad', 'solved');
    box.innerHTML = mixed.map((l) => `<div class="an-t" data-l="${l}">${letterCell(l)}<span class="lbl"></span></div>`).join('');
    $('#msg', el).textContent = 'Drag the cells into the right order.';
  }
  function check() {
    if (order() !== word) return;
    solved = true;
    $$('.an-t', box).forEach((t) => { $('.lbl', t).textContent = t.dataset.l; });
    card.classList.add('solved'); glow(card, true);
    sc++; st = used ? 0 : st + 1; $('#sc', el).textContent = sc; $('#st', el).textContent = st;
    $('#msg', el).textContent = 'Solved!';
    timer = setTimeout(next, 1500);
  }
  box.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('.an-t'); if (!t || solved) return;
    e.preventDefault();
    const r = t.getBoundingClientRect();
    drag = { t, dx: e.clientX - r.left, dy: e.clientY - r.top };
    t.setPointerCapture(e.pointerId); t.classList.add('drag');
  });
  box.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const { t } = drag;
    // Move the dragged cell in the order when the pointer passes the middle of a neighbour.
    let bestEl = null, bestD = Infinity;
    for (const o of $$('.an-t', box)) {
      if (o === t) continue;
      const r = o.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d = Math.hypot(e.clientX - cx, (e.clientY - cy) * 2);
      if (d < bestD) { bestD = d; bestEl = { o, cx }; }
    }
    if (bestEl && bestD < 60) {
      const after = e.clientX > bestEl.cx;
      const ref = after ? bestEl.o.nextSibling : bestEl.o;
      if (ref !== t && ref !== t.nextSibling) box.insertBefore(t, ref);
      else if (!after && bestEl.o.nextSibling === t) box.insertBefore(t, bestEl.o);
    }
    t.style.transform = '';
    const r = t.getBoundingClientRect();
    t.style.transform = `translate(${e.clientX - drag.dx - r.left}px, ${e.clientY - drag.dy - r.top}px)`;
  });
  const drop = () => { if (!drag) return; drag.t.style.transform = ''; drag.t.classList.remove('drag'); drag = null; check(); };
  box.addEventListener('pointerup', drop); box.addEventListener('pointercancel', drop);
  // Hint: put the first misplaced letter into its place.
  $('#hint', el).onclick = () => {
    if (solved) return;
    used = true;
    const tiles = $$('.an-t', box), i = tiles.findIndex((t, k) => t.dataset.l !== word[k]);
    if (i < 0) return;
    const j = tiles.findIndex((t, k) => k > i && t.dataset.l === word[i]);
    box.insertBefore(tiles[j], tiles[i]);
    check();
  };
  $('#skip', el).onclick = () => {
    if (solved) return;
    st = 0; $('#st', el).textContent = 0; solved = true;
    box.innerHTML = [...word].map((l) => `<div class="an-t" data-l="${l}">${letterCell(l)}<span class="lbl">${l}</span></div>`).join('');
    card.classList.add('solved'); timer = setTimeout(next, 1500);
  };
  next();
  return () => clearTimeout(timer);
}

// ---------- Snowman ----------
// Each wrong guess adds a piece; six and the snowman is finished. Pale outlines show what's still to come.
const SNOW_PARTS = `<circle cx="60" cy="88" r="22"/><circle cx="60" cy="52" r="15"/><circle cx="60" cy="27" r="10"/>
  <path d="M46 49 28 38m4 2-6-6m6 6-8 0"/><path d="M74 49l18-11m-4 2 6-6m-6 6 8 0"/><path d="M48 18h24M52 18V6h16v12"/>`;
function snowman(el) {
  const maxMiss = 6;
  el.innerHTML = `<div class="card g-card hm" id="card"><button class="btn g-corner" id="new"><svg class="ic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.7-6.2"/><path d="M3 4v5h5"/></svg> New word</button><svg class="hm-art sm-art" viewBox="0 0 120 120" id="art" aria-hidden="true">
      <path class="base" d="M14 112h92"/><g class="ghost">${SNOW_PARTS}</g><g class="parts">${SNOW_PARTS}</g></svg>
    <div class="hm-side"><small id="clue"></small><div class="hm-word" id="word"></div><p class="g-msg" id="msg"></p></div></div>
    <div class="wd-keys hm-kb" id="keys"></div>`;
  $$('#art .parts > *', el).forEach((p) => p.classList.add('p'));
  const card = $('#card', el);
  let word, clue, guessed, miss, done;
  function render() {
    $('#clue', el).textContent = clue;
    $('#word', el).innerHTML = [...word].map((l) => `<span class="hm-slot">${guessed.has(l) || done ? letterCell(l) : '<span class="cell blank">' + '<i></i>'.repeat(6) + '</span>'}${guessed.has(l) || done ? `<b>${l}</b>` : ''}</span>`).join(''); card.classList.toggle('done', done);
    const state = {}; guessed.forEach((k) => { state[k] = word.includes(k) ? 'hit' : 'miss'; });
    $('#keys', el).innerHTML = brailleKeys({ state, disabled: (k) => guessed.has(k) || done });
    $$('#art .parts .p', el).forEach((p, i) => p.classList.toggle('on', i < miss));
  }
  function guess(k) {
    if (done || guessed.has(k)) return;
    guessed.add(k);
    if (!word.includes(k)) { miss++; glow(card, false); }
    if ([...word].every((l) => guessed.has(l))) { done = true; glow(card, true); $('#msg', el).textContent = 'Solved!'; }
    else if (miss >= maxMiss) { done = true; $('#msg', el).innerHTML = `The snowman is finished. The word was <b>${word}</b>.`; }
    render();
  }
  $('#keys', el).onclick = (e) => { const b = e.target.closest('[data-k]'); if (b) guess(b.dataset.k); };
  const off = keys((e) => { if (/^[a-z]$/i.test(e.key)) guess(e.key.toLowerCase()); });
  const seen = new Set(store.get('snow.seen', []));
  function start() {
    let pool = SNOWMAN_WORDS.filter(([w]) => !seen.has(w));
    if (!pool.length) { seen.clear(); pool = SNOWMAN_WORDS; }
    [word, clue] = pick(pool); seen.add(word); store.set('snow.seen', [...seen].slice(-800));
    guessed = new Set(); miss = 0; done = false; $('#msg', el).textContent = ''; render();
  }
  $('#new', el).onclick = start;
  start();
  return off;
}

// ---------- Mirror Match ----------
function mirror(el, level) {
  const cfg = {
    easy: { groups: [['d', 'f'], ['e', 'i'], ['h', 'j'], ['r', 'w']], incl: 'the mirror pairs d and f, e and i, h and j, r and w; two choices each time.' },
    medium: { groups: [['d', 'f', 'h', 'j'], ['e', 'i', 'r', 'w'], ['s', 't', 'n', 'z']], incl: 'd, f, h, j; e, i, r, w; s, t, n, z; four choices each time.' },
    hard: { groups: null, incl: 'all of Medium plus k, o, u, m, x, y and the Grade 2 signs ch, sh, th, wh, ed, er, ou and ow.' },
  }[level];
  // Hard: look-alike letters and the Grade 2 groupsigns that are mirror or shifted versions of them.
  const SIGN = { ch: '16', sh: '146', th: '1456', wh: '156', ed: '1246', er: '12456', ou: '1256', ow: '246' };
  const HARD = [...'defhijrwstnzkoumxy', ...Object.keys(SIGN)];
  const cellFor = (x) => (SIGN[x] ? fromDotsLocal(SIGN[x]) : LETTERS[x]);
  const near = (a, b) => { const A = new Set(toDots(cellFor(a))), B = toDots(cellFor(b)); const same = B.filter((d) => A.has(d)).length; return same - Math.abs(A.size - B.length); };
  el.innerHTML = `${statBar('Streak <b id="st">0</b>', timerBar(30), scoreBest('mirror.' + level))}
    <div class="card g-card mm" id="card"><div class="g-overlay" id="ov">${startScreen('Pick the letter each cell shows. Take your time on each one; you have 30 seconds in all.', cfg.incl)}</div><div class="prompt-cells" id="cells"></div><div class="choices" id="opts"></div></div>`;
  const card = $('#card', el);
  let target, sc = 0, st = 0, end = 0, raf = 0, running = false;
  function next() {
    let opts;
    if (cfg.groups) opts = pick(cfg.groups);
    else { const t = pick(HARD); opts = [t, ...HARD.filter((x) => x !== t).sort((a, b) => near(t, b) - near(t, a) + (Math.random() - 0.5)).slice(0, 3)]; }
    target = pick(opts);
    $('#cells', el).innerHTML = cell(cellFor(target));
    $('#opts', el).innerHTML = shuffle(opts).map((o) => `<button class="choice" data-o="${o}">${o}</button>`).join('');
  }
  function answer(ok) {
    if (ok) { sc++; st++; } else st = 0;
    $('#sc', el).textContent = sc; $('#st', el).textContent = st; glow(card, ok); next();
  }
  function tick(t) {
    if (!running) return;
    const left = Math.max(0, end - t);
    setTimer(el, left / 30000, Math.ceil(left / 1000));
    if (!left) return over();
    raf = requestAnimationFrame(tick);
  }
  function over() {
    running = false; cancelAnimationFrame(raf); $('#cells', el).innerHTML = ''; $('#opts', el).innerHTML = '';
    const b = best('mirror.' + level, sc); $('#best', el).textContent = b;
    const ov = $('#ov', el); ov.hidden = false;
    ov.innerHTML = `<b class="g-big">${sc}</b><small>Best ${b}</small><button class="btn primary" id="go">Play again</button>`;
    $('#go', el).onclick = go;
  }
  function go() { sc = 0; st = 0; $('#sc', el).textContent = 0; $('#st', el).textContent = 0; $('#ov', el).hidden = true; running = true; end = performance.now() + 30000; next(); raf = requestAnimationFrame(tick); }
  $('#opts', el).onclick = (e) => { const b = e.target.closest('[data-o]'); if (b && running) answer(b.dataset.o === target); };
  const off = keys((e) => { if (!running) return; const k = e.key.toLowerCase(); if (/^[a-z]$/.test(k) && $(`[data-o="${k}"]`, el)) answer(k === target); });
  $('#go', el).onclick = go;
  return () => { running = false; cancelAnimationFrame(raf); off(); };
}

// ---------- Maze ----------
const MAZE_WORDS = {
  easy: ['cat', 'dog', 'sun', 'map', 'pen', 'cup', 'hat', 'bed', 'fox', 'owl', 'jam', 'box', 'ant', 'bus', 'web', 'zip'],
  medium: ['lake', 'frog', 'milk', 'rain', 'snow', 'bird', 'fish', 'cake', 'kite', 'star', 'ship', 'lamp', 'wolf', 'maple', 'cloud', 'grape', 'horse', 'lemon', 'tiger'],
};
// Hard: longer common words in Grade 2, so the path is made of contractions as well as letters.
const MAZE_HARD = () => COMMON_WORDS.filter((w) => w.length >= 7 && w.length <= 10).filter((w) => toCells(translate(w, 'en', 2)).length < w.length);
const FILLER_CELLS = () => [...Object.values(LETTERS), ...['16', '146', '1456', '156', '1246', '12456', '1256', '246', '1236', '12346', '123456', '12356', '2346', '23456', '34', '346', '26', '35', '356'].map(fromDotsLocal)];
function maze(el, level) {
  const N = { easy: 4, medium: 5, hard: 6 }[level];
  const hardList = level === 'hard' ? MAZE_HARD() : null;
  el.innerHTML = `${statBar('Solved <b id="sc">' + store.get('maze.' + level, 0) + '</b>', '<span class="lives" id="lives"></span>', '<button class="btn small-btn" id="new">New maze</button>')}
    <div class="card g-card mz-card" id="card"><div class="mz-target">Spell: <b id="target"></b></div><div class="mz-grid" id="grid" style="--n:${N}"></div></div>
    <p class="muted small g-tip">Start at the flag. Step up, down, left or right onto the cells that spell the word, in order. Wrong cells are traps.</p>`;
  const grid = $('#grid', el), card = $('#card', el);
  let word, target, chunks, cells, pos, step, lives, done, won;
  function makePath(len) {
    for (let tries = 0; tries < 300; tries++) {
      const path = [[0, 0]], seen = new Set(['0,0']);
      while (path.length < len + 1) {
        const [r, c] = path[path.length - 1];
        const nb = shuffle([[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]).filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && !seen.has(a + ',' + b));
        if (!nb.length) break;
        path.push(nb[0]); seen.add(nb[0].join(','));
      }
      if (path.length === len + 1) return path;
    }
    return null;
  }
  function start() {
    let path;
    do {
      word = level === 'hard' ? pick(hardList) : pick(MAZE_WORDS[level].filter((w) => new Set(w).size === w.length));
      const tc = toCells(translate(word, 'en', level === 'hard' ? 2 : 1));
      target = tc.map((c) => c.cell);
      // Print pieces of the word and the last cell each one needs (contractions can take two cells).
      chunks = [];
      tc.forEach((c, i) => { if (c.idx === 0 || !chunks.length) chunks.push({ t: c.print || '', end: i }); else chunks[chunks.length - 1].end = i; });
      path = target.length <= N * N - 1 ? makePath(target.length) : null;
    } while (!path);
    const filler = (level === 'hard' ? FILLER_CELLS() : Object.values(LETTERS)).filter((c) => !target.includes(c));
    cells = Array.from({ length: N }, () => Array.from({ length: N }, () => pick(filler)));
    path.slice(1).forEach(([r, c], i) => { cells[r][c] = target[i]; });
    cells[0][0] = null;
    pos = [0, 0]; step = 0; lives = 3; done = false; won = false;
    Object.keys(grid.dataset).forEach((k) => delete grid.dataset[k]);
    render();
  }
  function render() {
    $('#lives', el).innerHTML = livesHTML(lives);
    const t = $('#target', el); t.classList.toggle('won', won);
    t.innerHTML = chunks.map((c) => `<span class="${step > c.end ? 'got' : ''}">${esc(c.t)}</span>`).join('');
    grid.innerHTML = cells.map((row, r) => row.map((c, k) => {
      const here = pos[0] === r && pos[1] === k;
      const st = grid.dataset['s' + r + '_' + k] || '';
      return `<button class="mz-cell ${st} ${here ? 'here' : ''}" data-r="${r}" data-c="${k}">${c ? cell(c) : '<span class="mz-flag">⚑</span>'}</button>`;
    }).join('')).join('');
  }
  grid.onclick = (e) => {
    const b = e.target.closest('.mz-cell'); if (!b || done) return;
    const r = Number(b.dataset.r), c = Number(b.dataset.c);
    if (Math.abs(r - pos[0]) + Math.abs(c - pos[1]) !== 1) return;
    if (cells[r][c] === target[step] && grid.dataset['s' + r + '_' + c] !== 'walked') {
      grid.dataset['s' + r + '_' + c] = 'walked'; pos = [r, c]; step++;
      if (step === target.length) { done = true; won = true; glow(card, true); const n = store.get('maze.' + level, 0) + 1; store.set('maze.' + level, n); $('#sc', el).textContent = n; }
    } else if (grid.dataset['s' + r + '_' + c] !== 'walked') {
      grid.dataset['s' + r + '_' + c] = 'trap'; lives--; glow(card, false);
      if (lives <= 0) { done = true; reveal(); }
    }
    render();
  };
  // Out of lives: reveal the route.
  function reveal() {
    let [r, c] = pos;
    const seen = new Set();
    for (let i = step; i < target.length; i++) {
      const nb = [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].find(([a, b]) => cells[a] && cells[a][b] === target[i] && !seen.has(a + ',' + b));
      if (!nb) break;
      [r, c] = nb; seen.add(r + ',' + c); grid.dataset['s' + r + '_' + c] = 'walked';
    }
  }
  $('#new', el).onclick = start;
  start();
  return () => {};
}

export const GAME_GROUPS = [
  ['Word Games', ['wordle', 'snowman', 'anagrams', 'agent']],
  ['Quick Fire', ['rain', 'time', 'mirror']],
  ['Puzzles and Quizzes', ['memory', 'maze', 'trivia', 'riddles']],
];
export const GAMES = {
  wordle: { name: 'Braidle', icon: 'grid', range: 'Medium', desc: 'Guess the five-letter word in six tries, in braille', levels: [['easy', 'With letters'], ['hard', 'Braille only']], display: true, run: wordle,
    help: ['Guess the hidden five-letter word in six tries. Type on the braille keyboard or your own keyboard.', 'After each guess, green means the right letter in the right spot, yellow means it’s in the word somewhere else, and grey means it’s not in the word.', '“With letters” shows print under each cell. “Braille only” makes you read every cell.'] },
  snowman: { name: 'Snowman', icon: 'snowman', range: 'Easy–Hard', desc: 'Guess the word from a braille keyboard before the snowman is built', levels: [['easy', 'With letters'], ['hard', 'Braille only']], display: true, run: snowman,
    help: ['Guess the word one letter at a time. Each correct letter appears as a braille cell. The clue tells you the category.', 'Each wrong guess adds a piece to the snowman. The pale outline shows what’s left; six wrong guesses and it’s finished.', 'Over 1,000 words in 16 categories.', '“Braille only” hides the print letters on the keyboard.'] },
  anagrams: { name: 'Anagrams', icon: 'shuffle', range: 'Easy–Hard', desc: 'Drag scrambled braille cells into the right order', levels: LV3, run: anagrams,
    help: ['The letters of a word appear as braille cells, but in the wrong order.', 'Drag the cells to reorder them. When they spell the word, the letters appear.', 'Hint moves the next letter into place.'] },
  agent: { name: 'Secret Agent', icon: 'key', range: 'Easy–Hard', desc: 'Decode intercepted braille messages to crack ten cases', run: agent,
    help: ['Each mission has a message written in braille. Decode it one word at a time: the highlighted word is the one to type.', 'Pick a case from the menu at the top. Easy cases are lowercase Grade 1, Medium adds capitals, numbers and punctuation, Hard is Grade 2.', 'Your place in each case is saved. Once a case is solved you can play it again.', 'Hint reveals the next letter of the current word.'] },
  rain: { name: 'Braille Rain', icon: 'rain', range: 'Medium–Hard', desc: 'Type falling letters before they land; later, whole words', levels: LV3, run: rain,
    help: ['Braille cells fall from the top. Type the matching letter before each one reaches the bottom.', 'Every ten catches the level goes up and things fall faster. From a later level, whole words start to fall too.', 'Three misses and the game ends.'] },
  time: { name: 'Time Attack', icon: 'timer', range: 'Easy–Hard', desc: 'Sixty seconds: read as many letters as you can', levels: LV3, run: timeAttack,
    help: ['You have 60 seconds. A braille cell appears: type its letter, and the next one appears right away.', 'Easy uses a–j, Medium all letters, Hard adds numbers (type the digit).', 'Your best score is saved for each level.'] },
  mirror: { name: 'Mirror Match', icon: 'mirror', range: 'Medium–Hard', desc: 'Tell look-alike letters like d, f, h and j apart, fast', levels: LV3, run: mirror,
    help: ['Some letters are mirror images of each other, like d and f, or e and i. Pick the right one.', 'Easy gives you two choices, Medium four, and Hard mixes many more look-alikes, including Grade 2 signs.', 'Each round lasts 30 seconds; there is no limit on a single answer.'] },
  memory: { name: 'Memory', icon: 'cards', range: 'Easy–Hard', desc: 'Flip cards to pair each braille cell with its letter', levels: LV3, run: memory,
    help: ['Flip two cards at a time. Match each braille cell with its print letter.', 'Easy uses 6 pairs from a–j, Medium 8 pairs, Hard 15 pairs with lots of look-alikes.', 'Try to finish in as few moves as you can.'] },
  maze: { name: 'Braille Maze', icon: 'maze', range: 'Easy–Hard', desc: 'Step only on the cells that spell the word, in order', levels: LV3, run: maze,
    help: ['Start at the flag. Step up, down, left or right onto the next letter of the word.', 'Cells that don’t spell the word are traps. Three traps and the route is revealed.', 'Bigger grids and longer words on harder levels. Hard uses Grade 2, so some steps are contractions.'] },
  trivia: { name: 'Trivia', icon: 'help', range: 'Easy–Hard', desc: '500 questions on ten topics, with answers in braille', levels: LV3, run: trivia,
    help: ['Read the question, then pick the answer. The answers are written in braille.', 'Easy shows print under the cells, Medium is braille only, Hard uses Grade 2 contractions.', 'Rounds are ten questions. Choose a topic or play them all.'] },
  riddles: { name: 'Riddles', icon: 'bulb', range: 'Easy–Hard', desc: 'Over 100 riddles; pick the answer written in braille', levels: LV3, run: riddles,
    help: ['Read the riddle, then pick the answer. The answers are written in braille only.', 'Easy has three choices, Medium four, and Hard uses Grade 2 contractions.'] },
};
export const gameStore = store;
