// Games: each game renders into a container and returns a cleanup function.
import { LETTERS, IND, translate, toCells, toDots } from './braille.js?v=19';
import { TRIVIA, RIDDLES, WORDLE, HANGMAN, MISSIONS, ANAGRAM_WORDS } from './gamedata.js?v=19';
import { WORDS } from './data.js?v=19';

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
  for (const c of toCells(translate(text, 'en', grade))) {
    if (c.kind === 'space') { word += '<span class="bw space"><span class="cell" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span></span>'; flush(); continue; }
    if (c.kind === 'newline') continue;
    const l = labels && c.idx === 0 ? (c.print || '') : '';
    word += `<span class="bw">${cell(c.cell, cls)}${labels ? `<span class="lbl">${esc(l)}</span>` : ''}</span>`;
  }
  flush();
  return `<span class="braille-line" role="img" aria-label="${esc(text)} in braille">${out}</span>`;
}
const letterCell = (l, cls = '') => cell(LETTERS[l], cls);
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

// ---------- Wordle ----------
function wordle(el) {
  let answer, guesses, cur, done;
  const kb = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  el.innerHTML = `<div class="g-card card wd"><button class="btn g-corner" id="new" aria-label="New word" title="New word"><svg class="ic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.7-6.2"/><path d="M3 4v5h5"/></svg> New</button><div class="wd-board" id="board"></div><p class="g-msg" id="msg"></p></div>
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
    $('#keys', el).innerHTML = kb.map((row, ri) => `<div class="wd-krow">${ri === 2 ? '<button class="wd-k wide" data-k="enter">Enter</button>' : ''}${[...row].map((k) => `<button class="wd-k ${state[k] || ''}" data-k="${k}" aria-label="${k}">${letterCell(k)}<b>${k}</b></button>`).join('')}${ri === 2 ? '<button class="wd-k wide" data-k="back" aria-label="Delete">⌫</button>' : ''}</div>`).join('');
  }
  function press(k) {
    if (done) return;
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
  const off = keys((e) => { const k = e.key.toLowerCase(); if (k === 'enter') press('enter'); else if (k === 'backspace') press('back'); else if (/^[a-z]$/.test(k)) press(k); });
  const start = () => { answer = pick(WORDLE); guesses = []; cur = ''; done = false; Object.keys(state).forEach((k) => delete state[k]); msg.textContent = ''; render(); };
  $('#new', el).onclick = start;
  start();
  return off;
}

// ---------- Memory ----------
function memory(el, level) {
  const n = { easy: 6, medium: 8, hard: 15 }[level];
  const LOOK = 'defhijrw';
  const pickLetters = () => (level === 'easy' ? shuffle([...AJ]).slice(0, n) : level === 'hard'
    ? [...LOOK, ...shuffle([...AZ].filter((x) => !LOOK.includes(x))).slice(0, n - LOOK.length)] : shuffle([...AZ]).slice(0, n));
  el.innerHTML = `<div class="g-stats"><span>Moves <b id="moves">0</b></span><span>Best <b id="best">–</b></span></div><div class="mem-grid n${n}" id="grid"></div><p class="g-msg" id="msg"></p><div class="g-actions"><button class="btn" id="new">New game</button></div>`;
  const grid = $('#grid', el);
  let open = [], moves = 0, matched = 0, lock = false, timer = 0;
  function start() {
    const letters = pickLetters();
    const cards = shuffle(letters.flatMap((l) => [{ l, t: 'b' }, { l, t: 'p' }]));
    grid.innerHTML = cards.map((c, i) => `<button class="mem-card" data-i="${i}" data-l="${c.l}"><span class="mem-back"></span><span class="mem-face">${c.t === 'b' ? letterCell(c.l) : `<b>${c.l}</b>`}</span></button>`).join('');
    open = []; moves = 0; matched = 0; lock = false;
    $('#moves', el).textContent = 0; $('#msg', el).textContent = '';
    const b = store.get('best.mem.' + level, null); $('#best', el).textContent = b == null ? '–' : b;
  }
  grid.onclick = (e) => {
    const c = e.target.closest('.mem-card');
    if (!c || lock || c.classList.contains('up') || c.classList.contains('done')) return;
    c.classList.add('up'); open.push(c);
    if (open.length < 2) return;
    moves++; $('#moves', el).textContent = moves;
    const [a, b] = open;
    if (a.dataset.l === b.dataset.l) {
      a.classList.add('done'); b.classList.add('done'); open = []; matched++;
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
function quiz(el, level, { next, topicHTML }) {
  const grade = level === 'hard' ? 2 : 1, labels = level === 'easy';
  el.innerHTML = `${topicHTML || ''}<div class="g-stats"><span>Question <b id="qn">1</b>/10</span><span>Score <b id="sc">0</b></span></div>
    <div class="card g-card quiz" id="card"></div><div class="g-actions"><button class="btn primary" id="nextBtn" hidden>Next</button></div>`;
  const card = $('#card', el);
  let n = 0, sc = 0, item, answered;
  function show() {
    item = next(); answered = false;
    const opts = shuffle([item.a, ...item.w]);
    card.classList.remove('glow-good', 'glow-bad');
    card.innerHTML = `<p class="quiz-q">${esc(item.q)}</p><div class="quiz-opts">${opts.map((o) => `<button class="quiz-opt" data-o="${esc(o)}">${line(o, { grade, labels })}<span class="quiz-print">${esc(o)}</span></button>`).join('')}</div>`;
    $('#qn', el).textContent = n + 1; $('#nextBtn', el).hidden = true;
  }
  card.onclick = (e) => {
    const b = e.target.closest('.quiz-opt'); if (!b || answered) return;
    answered = true;
    const ok = b.dataset.o === item.a;
    if (ok) sc++;
    $('#sc', el).textContent = sc;
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
    $('#again', el).onclick = () => { n = 0; sc = 0; $('#sc', el).textContent = 0; show(); };
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
    const stop = quiz(el, level, { next, topicHTML: '<div class="g-pick"><div id="topicDD"></div></div>' });
    ctx.dropdown($('#topicDD', el), { label: 'Topic', options: ['All', ...topics].map((t) => ({ value: t, label: t === 'All' ? 'All topics' : t, hint: t === 'All' ? '500 questions' : TRIVIA[t].length + ' questions' })), value: topic, onChange: (v) => { topic = v; store.set('topic', v); seen.clear(); run(); } });
    return stop;
  };
  return run();
}
function riddles(el, level) {
  const items = RIDDLES.map((r) => r.split('|'));
  const seen = new Set();
  el.dataset.k = 'riddles';
  return quiz(el, level, {
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
  el.innerHTML = `<div class="g-stats"><span>Level <b id="lv">1</b></span><span>Score <b id="sc">0</b></span><span class="lives" id="lives"></span><span>Best <b id="best">${store.get('best.rain.' + level, '–') ?? '–'}</b></span></div>
    <div class="rain-field card" id="field"><div class="g-overlay" id="ov"><button class="btn primary" id="go">Start</button><small>Type each letter before it lands.</small></div></div>
    <input class="answer-input rain-in" id="in" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Type here" enterkeyhint="done">`;
  const field = $('#field', el), inp = $('#in', el);
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
    running = true; inp.value = ''; inp.focus(); raf = requestAnimationFrame(tick);
  }
  inp.oninput = () => {
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
  return () => { running = false; cancelAnimationFrame(raf); };
}

// ---------- Time Attack ----------
function timeAttack(el, level) {
  const pool = level === 'easy' ? [...AJ] : level === 'medium' ? [...AZ] : [...AZ, ...'0123456789'];
  const cellsOf = (x) => (/\d/.test(x) ? IND.number + LETTERS['jabcdefghi'[Number(x)]] : LETTERS[x]);
  el.innerHTML = `<div class="g-stats"><span>Score <b id="sc">0</b></span><span>Best <b id="best">${store.get('best.time.' + level, '–') ?? '–'}</b></span></div>
    <div class="ta-bar"><i id="bar"></i></div>
    <div class="card g-card ta" id="card"><div class="g-overlay" id="ov"><button class="btn primary" id="go">Start 60 seconds</button><small>Type each letter as fast as you can.</small></div><div class="prompt-cells" id="cells"></div></div>
    <input class="answer-input" id="in" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Type the letter" enterkeyhint="next">
    <div class="g-actions"><button class="btn ghost" id="skip">Skip</button></div>`;
  const card = $('#card', el), inp = $('#in', el);
  let cur, sc = 0, end = 0, raf = 0, running = false;
  const nextItem = () => { let x; do { x = pick(pool); } while (x === cur && pool.length > 1); cur = x; $('#cells', el).innerHTML = [...cellsOf(x)].map((c) => cell(c)).join(''); };
  function tick() {
    const left = Math.max(0, end - performance.now());
    $('#bar', el).style.width = (left / 600) + '%';
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
  function go() { sc = 0; $('#sc', el).textContent = 0; $('#ov', el).hidden = true; running = true; end = performance.now() + 60000; inp.value = ''; inp.focus(); nextItem(); raf = requestAnimationFrame(tick); }
  inp.oninput = () => {
    if (!running) return;
    const v = inp.value.trim().toLowerCase(); if (!v) return;
    inp.value = '';
    if (v === cur) { sc++; $('#sc', el).textContent = sc; glow(card, true); nextItem(); } else glow(card, false);
  };
  $('#skip', el).onclick = () => { if (running) { nextItem(); inp.focus(); } };
  $('#go', el).onclick = go;
  return () => { running = false; cancelAnimationFrame(raf); };
}

// ---------- Secret Agent ----------
function agent(el) {
  let unlocked = store.get('agent', 1);
  let mi = Math.min(unlocked, MISSIONS.length) - 1;
  function render() {
    const m = MISSIONS[mi];
    const words = m.msg.split(' ');
    let wi = 0;
    const hints = words.map(() => 0);
    el.innerHTML = `<div class="ag-chips">${MISSIONS.map((x, i) => `<button class="ag-chip ${i === mi ? 'on' : ''}" data-m="${i}" ${i < unlocked ? '' : 'disabled'} aria-label="Mission ${i + 1}">${i < unlocked ? i + 1 : '🔒'}</button>`).join('')}</div>
      <div class="card g-card ag">
        <div class="ag-head"><small>Mission ${mi + 1} of ${MISSIONS.length}${m.grade === 2 ? ' · Grade 2' : ''}</small><b>${esc(m.title)}</b></div>
        <p class="ag-brief">${esc(m.brief)}</p>
        <div class="ag-msg" id="msg">${words.map((w, i) => `<span class="ag-w" data-i="${i}">${line(w, { grade: m.grade })}<span class="ag-l"></span></span>`).join('')}</div>
        <div class="ag-input"><input class="answer-input" id="in" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Type the highlighted word" enterkeyhint="next"><button class="btn ghost" id="hint">Hint</button></div>
        <p class="ag-after" id="after" hidden></p>
      </div>
      <div class="g-actions"><button class="btn primary" id="nextM" hidden>Next mission</button></div>`;
    const inp = $('#in', el), card = $('.ag', el);
    const mark = () => $$('.ag-w', el).forEach((w, i) => { w.classList.toggle('cur', i === wi); w.classList.toggle('done', i < wi); });
    const solveWord = () => {
      $(`.ag-w[data-i="${wi}"] .ag-l`, el).textContent = words[wi];
      wi++; inp.value = ''; mark();
      if (wi === words.length) {
        glow(card, true); inp.disabled = true; $('#hint', el).disabled = true;
        $('#after', el).hidden = false; $('#after', el).textContent = m.after;
        if (mi + 1 >= unlocked && mi + 1 < MISSIONS.length) { unlocked = mi + 2; store.set('agent', unlocked); }
        $('#nextM', el).hidden = mi + 1 >= MISSIONS.length;
      }
    };
    inp.oninput = () => { if (wi < words.length && norm(inp.value) === norm(words[wi])) solveWord(); };
    inp.onkeydown = (e) => { if (e.key === 'Enter' && inp.value.trim() && wi < words.length) { glow(card, false); } };
    $('#hint', el).onclick = () => {
      if (wi >= words.length) return;
      const target = words[wi].replace(/[^A-Za-z0-9]/g, '');
      hints[wi] = Math.min(target.length, hints[wi] + 1);
      $(`.ag-w[data-i="${wi}"] .ag-l`, el).textContent = target.slice(0, hints[wi]) + '…';
      inp.focus();
    };
    $('#nextM', el).onclick = () => { mi++; render(); };
    $('.ag-chips', el).onclick = (e) => { const b = e.target.closest('[data-m]'); if (b && !b.disabled) { mi = Number(b.dataset.m); render(); } };
    mark();
  }
  render();
  return () => {};
}

// ---------- Anagrams ----------
function anagrams(el, level) {
  const list = ANAGRAM_WORDS[level];
  el.innerHTML = `<div class="g-stats"><span>Solved <b id="sc">0</b></span><span>Streak <b id="st">0</b></span></div>
    <div class="card g-card an" id="card"><div class="an-cells" id="cells"></div><input class="answer-input" id="in" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Unscramble the word"></div>
    <div class="g-actions"><button class="btn ghost" id="hint">Hint</button><button class="btn ghost" id="skip">Skip</button></div>`;
  const card = $('#card', el), inp = $('#in', el);
  let word, mixed, shown, sc = 0, st = 0, used = false, timer = 0;
  function next() {
    word = pick(list);
    do { mixed = shuffle([...word]); } while (mixed.join('') === word && word.length > 1);
    shown = 0; used = false; inp.value = ''; inp.disabled = false;
    card.classList.remove('glow-good', 'glow-bad');
    $('#cells', el).innerHTML = mixed.map((l) => `<span class="bw">${letterCell(l)}<span class="lbl"></span></span>`).join('');
    $('#hint', el).dataset.word = '';
  }
  inp.oninput = () => {
    if (norm(inp.value) === word) {
      sc++; st = used ? 0 : st + 1; $('#sc', el).textContent = sc; $('#st', el).textContent = st;
      glow(card, true); inp.disabled = true; timer = setTimeout(next, 900);
    } else if (inp.value.length >= word.length) glow(card, false);
  };
  $('#hint', el).onclick = () => {
    used = true;
    // Reveal the next letter of the answer as a print letter under the matching scrambled cell.
    if (shown >= word.length) return;
    const l = word[shown];
    const slots = $$('#cells .bw', el);
    const idx = mixed.findIndex((m, i) => m === l && !slots[i].classList.contains('shown'));
    if (idx >= 0) { slots[idx].classList.add('shown'); $('.lbl', slots[idx]).textContent = `${shown + 1}`; }
    shown++;
  };
  $('#skip', el).onclick = () => { st = 0; $('#st', el).textContent = 0; inp.value = word; inp.disabled = true; timer = setTimeout(next, 1200); };
  next();
  return () => clearTimeout(timer);
}

// ---------- Hangman ----------
function hangman(el) {
  const maxMiss = 6;
  el.innerHTML = `<div class="card g-card hm" id="card"><button class="btn g-corner" id="new"><svg class="ic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.7-6.2"/><path d="M3 4v5h5"/></svg> New word</button><svg class="hm-art" viewBox="0 0 120 120" id="art" aria-hidden="true">
      <path class="base" d="M10 112h60M30 112V10h50v14"/>
      <circle class="p p1" cx="80" cy="34" r="10"/><path class="p p2" d="M80 44v30"/><path class="p p3" d="M80 52l-14 12"/><path class="p p4" d="M80 52l14 12"/><path class="p p5" d="M80 74l-12 20"/><path class="p p6" d="M80 74l12 20"/></svg>
    <div class="hm-side"><small id="clue"></small><div class="hm-word" id="word"></div><p class="g-msg" id="msg"></p></div></div>
    <div class="hm-keys" id="keys"></div>`;
  const card = $('#card', el);
  let word, clue, guessed, miss, done;
  function render() {
    $('#clue', el).textContent = clue;
    $('#word', el).innerHTML = [...word].map((l) => `<span class="hm-slot">${guessed.has(l) || done ? letterCell(l) : '<span class="cell blank">' + '<i></i>'.repeat(6) + '</span>'}${guessed.has(l) || done ? `<b>${l}</b>` : ''}</span>`).join(''); card.classList.toggle('done', done);
    $('#keys', el).innerHTML = [...AZ].map((k) => `<button class="hm-k ${guessed.has(k) ? (word.includes(k) ? 'hit' : 'miss') : ''}" data-k="${k}" ${guessed.has(k) || done ? 'disabled' : ''} aria-label="${k}">${letterCell(k)}<b>${k}</b></button>`).join('');
    $$('.hm-art .p', el).forEach((p, i) => p.classList.toggle('on', i < miss));
  }
  function guess(k) {
    if (done || guessed.has(k)) return;
    guessed.add(k);
    if (!word.includes(k)) { miss++; glow(card, false); }
    if ([...word].every((l) => guessed.has(l))) { done = true; glow(card, true); $('#msg', el).textContent = 'Saved!'; }
    else if (miss >= maxMiss) { done = true; $('#msg', el).innerHTML = `The word was <b>${word}</b>.`; }
    render();
  }
  $('#keys', el).onclick = (e) => { const b = e.target.closest('[data-k]'); if (b) guess(b.dataset.k); };
  const off = keys((e) => { if (/^[a-z]$/i.test(e.key)) guess(e.key.toLowerCase()); });
  function start() { [word, clue] = pick(HANGMAN); guessed = new Set(); miss = 0; done = false; $('#msg', el).textContent = ''; render(); }
  $('#new', el).onclick = start;
  start();
  return off;
}

// ---------- Mirror Match ----------
function mirror(el, level) {
  const cfg = {
    easy: { groups: [['d', 'f'], ['e', 'i'], ['h', 'j'], ['r', 'w']], t: 4000 },
    medium: { groups: [['d', 'f', 'h', 'j'], ['e', 'i', 'r', 'w']], t: 2600 },
    hard: { groups: null, t: 1700 },
  }[level];
  const HARD = [...'defhijrwnzoe'];
  el.innerHTML = `<div class="g-stats"><span>Score <b id="sc">0</b></span><span>Streak <b id="st">0</b></span><span>Best <b id="best">${store.get('best.mirror.' + level, '–') ?? '–'}</b></span></div>
    <div class="ta-bar"><i id="bar"></i></div>
    <div class="card g-card mm" id="card"><div class="g-overlay" id="ov"><button class="btn primary" id="go">Start 30 seconds</button><small>Tell the look-alikes apart, fast.</small></div><div class="prompt-cells" id="cells"></div><div class="choices" id="opts"></div></div>`;
  const card = $('#card', el);
  let target, sc = 0, st = 0, end = 0, itemEnd = 0, raf = 0, running = false;
  function next() {
    let opts;
    if (cfg.groups) opts = pick(cfg.groups);
    else { const t = pick(HARD); opts = shuffle([t, ...shuffle([...new Set(HARD)].filter((x) => x !== t)).slice(0, 3)]); }
    target = pick(opts);
    $('#cells', el).innerHTML = letterCell(target);
    $('#opts', el).innerHTML = shuffle(opts).map((o) => `<button class="choice" data-o="${o}">${o}</button>`).join('');
    itemEnd = performance.now() + cfg.t;
  }
  function answer(ok) {
    if (ok) { sc++; st++; } else st = 0;
    $('#sc', el).textContent = sc; $('#st', el).textContent = st; glow(card, ok); next();
  }
  function tick(t) {
    if (!running) return;
    const left = Math.max(0, end - t);
    $('#bar', el).style.width = (left / 300) + '%';
    if (!left) return over();
    if (t > itemEnd) answer(false);
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
  const off = keys((e) => { if (!running) return; const k = e.key.toLowerCase(); if ($(`[data-o="${k}"]`, el)) answer(k === target); });
  $('#go', el).onclick = go;
  return () => { running = false; cancelAnimationFrame(raf); off(); };
}

// ---------- Maze ----------
const MAZE_WORDS = {
  easy: ['cat', 'dog', 'sun', 'map', 'pen', 'cup', 'hat', 'bed', 'fox', 'owl', 'jam', 'box', 'ant', 'bus', 'web', 'zip'],
  medium: ['lake', 'frog', 'milk', 'rain', 'snow', 'bird', 'fish', 'cake', 'kite', 'star', 'ship', 'lamp', 'wolf', 'maple', 'cloud', 'grape', 'horse', 'lemon', 'tiger'],
  hard: ['planet', 'basket', 'candle', 'forest', 'island', 'rocket', 'winter', 'garden', 'pencil', 'cloudy', 'bright', 'stormy'],
};
function maze(el, level) {
  const N = { easy: 4, medium: 5, hard: 6 }[level];
  const words = MAZE_WORDS[level].filter((w) => w && new Set(w).size === w.length);
  el.innerHTML = `<div class="g-stats"><span>Spell <b id="target"></b></span><span class="lives" id="lives"></span><span>Solved <b id="sc">${store.get('maze.' + level, 0)}</b></span></div>
    <div class="card g-card mz-card" id="card"><div class="mz-grid" id="grid" style="--n:${N}"></div></div>
    <p class="muted small g-tip">Start at the flag. Step up, down, left or right onto the cells that spell the word, in order. Wrong cells are traps.</p>
    <div class="g-actions"><button class="btn" id="new">New maze</button></div>`;
  const grid = $('#grid', el), card = $('#card', el);
  let word, cells, pos, step, lives, done;
  function makePath(len) {
    for (let tries = 0; tries < 200; tries++) {
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
    do { word = pick(words); path = makePath(word.length); } while (!path);
    const filler = [...AZ].filter((l) => !word.includes(l));
    cells = Array.from({ length: N }, () => Array.from({ length: N }, () => pick(filler)));
    path.slice(1).forEach(([r, c], i) => { cells[r][c] = word[i]; });
    cells[0][0] = null;
    pos = [0, 0]; step = 0; lives = 3; done = false;
    $('#target', el).textContent = word;
    render();
  }
  function render() {
    $('#lives', el).innerHTML = [0, 1, 2].map((i) => `<i class="${i < lives ? 'on' : ''}"></i>`).join('');
    grid.innerHTML = cells.map((row, r) => row.map((l, c) => {
      const here = pos[0] === r && pos[1] === c;
      const st = grid.dataset['s' + r + '_' + c] || '';
      return `<button class="mz-cell ${st} ${here ? 'here' : ''}" data-r="${r}" data-c="${c}">${l ? letterCell(l) : '<span class="mz-flag">⚑</span>'}${st === 'walked' ? `<b>${l}</b>` : ''}${here ? '<span class="mz-pawn"></span>' : ''}</button>`;
    }).join('')).join('');
  }
  grid.onclick = (e) => {
    const b = e.target.closest('.mz-cell'); if (!b || done) return;
    const r = Number(b.dataset.r), c = Number(b.dataset.c);
    if (Math.abs(r - pos[0]) + Math.abs(c - pos[1]) !== 1) return;
    if (cells[r][c] === word[step]) {
      grid.dataset['s' + r + '_' + c] = 'walked'; pos = [r, c]; step++;
      if (step === word.length) { done = true; glow(card, true); const n = store.get('maze.' + level, 0) + 1; store.set('maze.' + level, n); $('#sc', el).textContent = n; }
    } else if (grid.dataset['s' + r + '_' + c] !== 'walked') {
      grid.dataset['s' + r + '_' + c] = 'trap'; lives--; glow(card, false);
      if (lives <= 0) { done = true; path0(); }
    }
    render();
  };
  // Out of lives: reveal the route.
  function path0() { cells.forEach((row, r) => row.forEach((l, c) => { if (l && word.includes(l)) grid.dataset['s' + r + '_' + c] = 'walked'; })); }
  $('#new', el).onclick = () => { Object.keys(grid.dataset).forEach((k) => delete grid.dataset[k]); start(); };
  start();
  return () => {};
}

export const GAME_GROUPS = [
  ['Word Games', ['wordle', 'hangman', 'anagrams', 'agent']],
  ['Quick Fire', ['rain', 'time', 'mirror']],
  ['Puzzles and Quizzes', ['memory', 'maze', 'trivia', 'riddles']],
];
export const GAMES = {
  wordle: { name: 'Braille Wordle', icon: 'grid', range: 'Medium', desc: 'Guess the five-letter word in six tries, in braille', levels: [['easy', 'With letters'], ['hard', 'Braille only']], display: true, run: wordle,
    help: ['Guess the hidden five-letter word in six tries. Type on the braille keyboard or your own keyboard.', 'After each guess, green means the right letter in the right spot, yellow means it’s in the word somewhere else, and grey means it’s not in the word.', '“With letters” shows print under each cell. “Braille only” makes you read every cell.'] },
  hangman: { name: 'Hangman', icon: 'gallows', range: 'Easy–Hard', desc: 'Guess letters from a braille keyboard before the drawing is done', levels: [['easy', 'With letters'], ['hard', 'Braille only']], display: true, run: hangman,
    help: ['Guess the word one letter at a time. Each correct letter appears as a braille cell.', 'Six wrong guesses and the drawing is complete.', '“Braille only” hides the print letters on the keyboard.'] },
  anagrams: { name: 'Anagrams', icon: 'shuffle', range: 'Easy–Hard', desc: 'Read the scrambled braille, then unscramble the word', levels: LV3, run: anagrams,
    help: ['The letters of a word appear as braille cells, but in the wrong order.', 'Read each cell, then type the real word.', 'Hint numbers the cells in their correct order, one at a time.'] },
  agent: { name: 'Secret Agent', icon: 'key', range: 'Easy–Hard', desc: 'Decode intercepted braille messages to solve a ten-part case', run: agent,
    help: ['Each mission has a message written in braille. Decode it one word at a time: the highlighted word is the one to type.', 'Solve a mission to unlock the next. Later missions add capitals and numbers, then Grade 2 contractions.', 'Hint reveals the next letter of the current word.'] },
  rain: { name: 'Braille Rain', icon: 'rain', range: 'Medium–Hard', desc: 'Type falling letters before they land; later, whole words', levels: LV3, run: rain,
    help: ['Braille cells fall from the top. Type the matching letter before each one reaches the bottom.', 'Every ten catches the level goes up and things fall faster. From a later level, whole words start to fall too.', 'Three misses and the game ends.'] },
  time: { name: 'Time Attack', icon: 'timer', range: 'Easy–Hard', desc: 'Sixty seconds: read as many letters as you can', levels: LV3, run: timeAttack,
    help: ['You have 60 seconds. A braille cell appears: type its letter, and the next one appears right away.', 'Easy uses a–j, Medium all letters, Hard adds numbers (type the digit).', 'Your best score is saved for each level.'] },
  mirror: { name: 'Mirror Match', icon: 'mirror', range: 'Medium–Hard', desc: 'Tell look-alike letters like d, f, h and j apart, fast', levels: LV3, run: mirror,
    help: ['Some letters are mirror images of each other, like d and f, or e and i. Pick the right one before the time runs out.', 'Easy gives you two choices, Medium four, and Hard mixes many look-alikes with less time.', 'Each round lasts 30 seconds.'] },
  memory: { name: 'Memory', icon: 'cards', range: 'Easy–Hard', desc: 'Flip cards to pair each braille cell with its letter', levels: LV3, run: memory,
    help: ['Flip two cards at a time. Match each braille cell with its print letter.', 'Easy uses 6 pairs from a–j, Medium 8 pairs, Hard 15 pairs with lots of look-alikes.', 'Try to finish in as few moves as you can.'] },
  maze: { name: 'Braille Maze', icon: 'maze', range: 'Easy–Hard', desc: 'Step only on the cells that spell the word, in order', levels: LV3, run: maze,
    help: ['Start at the flag. Step up, down, left or right onto the next letter of the word.', 'Cells that don’t spell the word are traps. Three traps and the route is revealed.', 'Bigger grids and longer words on harder levels.'] },
  trivia: { name: 'Trivia', icon: 'help', range: 'Easy–Hard', desc: '500 questions on ten topics, with answers in braille', levels: LV3, run: trivia,
    help: ['Read the question, then pick the answer. The answers are written in braille.', 'Easy shows print under the cells, Medium is braille only, Hard uses Grade 2 contractions.', 'Rounds are ten questions. Choose a topic or play them all.'] },
  riddles: { name: 'Riddles', icon: 'bulb', range: 'Easy–Hard', desc: 'Over 100 riddles; pick the answer written in braille', levels: LV3, run: riddles,
    help: ['Read the riddle, then pick the answer. The answers are written in braille.', 'Easy shows print under the cells, Medium is braille only, Hard uses Grade 2 contractions.'] },
};
export const gameStore = store;
