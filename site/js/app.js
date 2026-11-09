import {
  LETTERS, LETTER_DOTS, IND, UEB_PUNCT, CONTRACTIONS, cellsOf, fromDots, toDots, dotsLabel,
  translate, toCells, unicodeOf, LANGS,
} from './braille.js?v=2';
import {
  SIGN_WORDS, WORDS, SENTENCES, SCIENCE, NEMETH, LANG_INFO, JAPANESE, SYSTEMS, HISTORY, SIGN_REGIONS,
} from './data.js?v=2';

// ---------- tiny helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('dots.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('dots.' + k, JSON.stringify(v)); } catch {} },
};
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Render one braille cell as six dots.
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

// A braille line with optional print labels under each cell.
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

// ---------- sheet ----------
const sheet = $('#sheet');
const backdrop = $('#sheetBackdrop');
function openSheet(html) {
  sheet.innerHTML = `<button class="close" aria-label="Close">✕</button>${html}`;
  sheet.hidden = false; backdrop.hidden = false;
  $('.close', sheet).onclick = closeSheet;
  $('.close', sheet).focus();
}
function closeSheet() { sheet.hidden = true; backdrop.hidden = true; }
backdrop.onclick = closeSheet;
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
sheet.addEventListener('click', (e) => { if (e.target.closest('a')) closeSheet(); });

const WORDSIGN_OF = Object.fromEntries(CONTRACTIONS['Alphabetic wordsigns'].items.map(([w, d]) => [fromDots(d), w]));
const DIGIT_OF = Object.fromEntries('abcdefghij'.split('').map((l, i) => [l, String((i + 1) % 10)]));

// Mirror image (swap left/right columns) — the most common beginner confusion.
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
  return `<div class="detail">
    <div class="detail-top">${cellHTML(c, 'xl numbered raised')}<div><div class="big">${l}</div><div class="muted">${dotsLabel(c)}</div></div></div>
    <p>${row}</p>
    <dl>
      ${DIGIT_OF[l] ? `<dt>As a number</dt><dd>After the number sign ${cellHTML(IND.number, 'sm')} it means <b>${DIGIT_OF[l]}</b></dd>` : ''}
      ${WORDSIGN_OF[c] ? `<dt>Grade 2</dt><dd>Alone, it stands for the word <b>“${WORDSIGN_OF[c]}”</b></dd>` : ''}
      <dt>Capital</dt><dd>${cellHTML(IND.capital, 'sm')}${cellHTML(c, 'sm')} = ${l.toUpperCase()}</dd>
      ${mirrorLetter(l) ? `<dt>Don’t confuse</dt><dd>${cellHTML(LETTERS[mirrorLetter(l)], 'sm')} <b>${mirrorLetter(l)}</b> is its mirror image</dd>` : ''}
    </dl>
    <div class="row"><a class="btn primary" href="#/practice?set=${idx < 10 ? 'aj' : idx < 20 ? 'kt' : 'uz'}">Practise this row</a><a class="btn" href="#/sweep?src=alphabet">Sweep the alphabet</a></div>
  </div>`;
}

function symbolDetail(entry) {
  const cells = [...entry.cells];
  return `<div class="detail">
    <div class="detail-top"><div class="row" style="gap:6px">${cells.map((c) => cellHTML(c, cells.length > 2 ? 'lg numbered raised' : 'xl numbered raised')).join('')}</div></div>
    <h2>${esc(entry.print)}</h2>
    <dl>
      <dt>Type</dt><dd>${esc(entry.cat)}</dd>
      <dt>Dots</dt><dd>${cells.map((c) => toDots(c).join('') || '—').join(' · ')}</dd>
      ${entry.note ? `<dt>Note</dt><dd>${esc(entry.note)}</dd>` : ''}
      ${entry.blurb ? `<dt>Rule</dt><dd>${esc(entry.blurb)}</dd>` : ''}
    </dl>
  </div>`;
}

// ---------- dictionary of everything ----------
const DICT = [];
for (const l of 'abcdefghijklmnopqrstuvwxyz') DICT.push({ print: l, cells: LETTERS[l], cat: 'Letter', group: 'Letters' });
for (const d of '1234567890') DICT.push({ print: d, cells: IND.number + LETTERS['jabcdefghi'[Number(d)]], cat: 'Number', group: 'Numbers' });
const seenP = new Set();
for (const [p, v] of Object.entries(UEB_PUNCT)) {
  if (!v || seenP.has(v[1])) continue; seenP.add(v[1]);
  DICT.push({ print: p, cells: v[0], cat: 'Punctuation & symbols', note: v[1], group: 'Punctuation' });
}
DICT.push({ print: '“ ”', cells: fromDots('236') + fromDots('356'), cat: 'Punctuation & symbols', note: 'open and close quotation marks', group: 'Punctuation' });
const INDICATORS = [
  ['capital letter', '6', 'Next letter is a capital.'],
  ['capital word', '6 6', 'The whole next word is in capitals.'],
  ['capital passage', '6 6 6', 'Three or more words in capitals, ended by the terminator.'],
  ['capitals terminator', '6 3', 'Ends a capital word or passage.'],
  ['number sign', '3456', 'Letters a–j that follow are digits 1–0.'],
  ['grade 1 symbol', '56', 'Read the next cell as a plain letter, not a contraction.'],
  ['grade 1 word', '56 56', 'Read the next word uncontracted.'],
  ['grade 1 passage', '56 56 56', 'Uncontracted passage.'],
  ['italic', '46 23', 'Italic symbol (italic word: 46 2).'],
  ['bold', '45 23', 'Bold symbol.'],
];
for (const [p, d, n] of INDICATORS) DICT.push({ print: p, cells: cellsOf(d), cat: 'Indicator', note: n, group: 'Indicators' });
for (const [cat, { blurb, items }] of Object.entries(CONTRACTIONS)) {
  for (const [p, d, n] of items) DICT.push({ print: p, cells: cellsOf(d), cat, note: n || '', blurb, group: cat, g2: true });
}

function symHTML(e, i) {
  return `<button class="sym" data-i="${i}"><span class="cells">${[...e.cells].map((c) => cellHTML(c)).join('')}</span><b>${esc(e.print)}</b>${e.note && e.note.length < 26 ? `<small>${esc(e.note)}</small>` : ''}</button>`;
}
function bindSyms(root, list) {
  root.addEventListener('click', (ev) => {
    const b = ev.target.closest('.sym');
    if (b && b.dataset.i != null) openSheet(symbolDetail(list[Number(b.dataset.i)]));
  });
}

// ---------- views ----------
const view = $('#view');
const views = {};

views[''] = () => {
  const ROWS = [
    ['a–j', 'The foundation', 'abcdefghij', null, 'Only the top four dots. Learn these ten and the rest follow.'],
    ['k–t', 'Add dot 3', 'klmnopqrst', [3], 'Same shapes as a–j, with the lower-left dot added.'],
    ['u–z', 'Add dots 3 and 6', 'uvxyz', [3, 6], 'Same shapes again, with both bottom dots. (W is special, see below.)'],
  ];
  const helloParts = translate('hello', 'en', 1);
  const m = store.get('mastery', {});
  const known = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((l) => (m[l] || 0) >= 3).length;
  view.innerHTML = `
    <div class="hero">
      <div>
        <div class="kicker">Braille, one cell at a time</div>
        <h1>Six dots.<br>Every letter.</h1>
        <p class="lead">Start with the alphabet below — it’s really just ten shapes, repeated three times. Then practise, sweep your finger across real phrases, and learn to read the signs around you.</p>
        <div class="row"><a class="btn primary" href="#/practice">${known ? 'Keep practising' : 'Start practising'}</a><a class="btn" href="#/sweep">Try finger sweep</a></div>
        ${known ? `<p class="muted small" style="margin-top:14px">You know <b style="color:var(--ink)">${known} of 26</b> letters well so far.</p>` : ''}
      </div>
      <div class="hero-demo"><div class="word card">${toCells(helloParts).map((c) => `<span class="bw">${cellHTML(c.cell, 'raised')}<span class="lbl">${c.print}</span></span>`).join('')}</div></div>
    </div>

    <section>
      <div class="row spread" style="margin-bottom:14px">
        <h2 style="margin:0">The alphabet</h2>
        <div class="row">
          <label class="toggle"><input type="checkbox" id="hidePrint"> Hide letters</label>
          <label class="toggle"><input type="checkbox" id="showNums"> Dot numbers</label>
        </div>
      </div>
      <div id="alphaWrap">
      ${ROWS.map(([range, title, letters, added, blurb]) => `
        <div class="decade">
          <div class="decade-head"><h3>${range} · ${title}</h3><span>${blurb}</span></div>
          <div class="alpha">${letters.split('').map((l) => `<button class="letter" data-l="${l}">${cellHTML(LETTERS[l], 'raised', { added })}<b>${l}</b></button>`).join('')}${letters.length === 5 ? '<span class="letter empty"></span>'.repeat(0) : ''}</div>
        </div>`).join('')}
        <div class="decade">
          <div class="decade-head"><h3>w · The latecomer</h3><span>French had no w in 1824, so it was added after. It’s j with dot 6.</span></div>
          <div class="alpha"><button class="letter" data-l="w">${cellHTML(LETTERS.w, 'raised', { added: [6] })}<b>w</b></button></div>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="cell-anatomy">
        ${cellHTML(fromDots('123456'), 'numbered raised')}
        <div>
          <h3>How a cell works</h3>
          <p class="muted" style="margin:0">Two columns of three. Dots 1-2-3 run down the left, 4-5-6 down the right. A real cell is about 6 mm tall — exactly one fingertip. You read by gliding, not pressing.</p>
        </div>
      </div>
    </section>

    <section>
      <h2>Numbers reuse a–j</h2>
      <p class="muted">Put the number sign ${cellHTML(IND.number, 'sm')} in front and a–j become 1–0. So ${cellHTML(IND.number, 'sm')}${cellHTML(LETTERS.b, 'sm')}${cellHTML(LETTERS.a, 'sm')} is 21. You’ll see this on every room sign and elevator button.</p>
      <div class="numbers-strip">${'1234567890'.split('').map((d) => `<span class="bw">${cellHTML(LETTERS['jabcdefghi'[Number(d)]], 'md')}<span class="lbl">${d}</span></span>`).join('')}</div>
    </section>

    <section>
      <h2>Keep going</h2>
      <div class="go-grid">
        <a class="card go" href="#/practice"><h3>${cellHTML(LETTERS.p, 'sm')} Practice</h3><p>Read cells, write them with a tap-pad (or <kbd>F</kbd><kbd>D</kbd><kbd>S</kbd><kbd>J</kbd><kbd>K</kbd><kbd>L</kbd> like a Perkins brailler), and decode words.</p></a>
        <a class="card go" href="#/sweep"><h3>${cellHTML(LETTERS.s, 'sm')} Finger sweep</h3><p>Drag along a line of braille like a fingertip, with clicks (and buzzes on Android) for each raised dot.</p></a>
        <a class="card go" href="#/signs"><h3>${cellHTML(fromDots('146'), 'sm')} Signs in the wild</h3><p>How braille signs work in Ontario and elsewhere, with real sign words to decode.</p></a>
        <a class="card go" href="#/reference"><h3>${cellHTML(LETTERS.r, 'sm')} Reference</h3><p>Every Grade 1 symbol, all Grade 2 contractions, maths, other languages and braille systems worldwide.</p></a>
        <a class="card go" href="#/translate"><h3>${cellHTML(LETTERS.t, 'sm')} Translate</h3><p>Type anything — English Grade 1 or 2, French, Spanish, German, Russian, Greek.</p></a>
        <a class="card go" href="#/reference/grade2"><h3>${cellHTML(fromDots('2346'), 'sm')} Grade 2 next</h3><p>Once a–z feels easy: contractions like ${cellHTML(fromDots('2346'), 'sm')} “the” and ${cellHTML(fromDots('12346'), 'sm')} “and”.</p></a>
      </div>
    </section>`;
  const wrap = $('#alphaWrap');
  wrap.onclick = (e) => { const b = e.target.closest('.letter'); if (b && b.dataset.l) openSheet(letterDetail(b.dataset.l)); };
  const hp = $('#hidePrint'), sn = $('#showNums');
  hp.checked = store.get('hidePrint', false); sn.checked = store.get('showNums', false);
  const apply = () => {
    wrap.classList.toggle('hide-print', hp.checked);
    $$('.letter .cell', wrap).forEach((c) => c.classList.toggle('numbered', sn.checked));
    store.set('hidePrint', hp.checked); store.set('showNums', sn.checked);
  };
  hp.onchange = sn.onchange = apply; apply();
};

// ---------- practice ----------
const PRACTICE_SETS = {
  aj: { name: 'a–j', items: () => 'abcdefghij'.split('').map((l) => ({ key: l, cells: LETTERS[l], answer: l })) },
  kt: { name: 'k–t', items: () => 'klmnopqrst'.split('').map((l) => ({ key: l, cells: LETTERS[l], answer: l })) },
  uz: { name: 'u–z', items: () => 'uvwxyz'.split('').map((l) => ({ key: l, cells: LETTERS[l], answer: l })) },
  az: { name: 'All letters', items: () => 'abcdefghijklmnopqrstuvwxyz'.split('').map((l) => ({ key: l, cells: LETTERS[l], answer: l })) },
  num: { name: 'Numbers', items: () => '1234567890'.split('').map((d) => ({ key: 'n' + d, cells: IND.number + LETTERS['jabcdefghi'[Number(d)]], answer: d, writeCell: LETTERS['jabcdefghi'[Number(d)]] })) },
  punct: { name: 'Punctuation', items: () => [',', ';', ':', '.', '!', '?', "'", '-'].map((p) => ({ key: 'p' + p, cells: UEB_PUNCT[p][0], answer: p, label: UEB_PUNCT[p][1] })) },
  g2: { name: 'Contractions', items: () => [...CONTRACTIONS['Strong contractions'].items, ...CONTRACTIONS['Strong groupsigns'].items, ...CONTRACTIONS['Alphabetic wordsigns'].items.slice(0, 12)].map(([w, d]) => ({ key: 'c' + w, cells: cellsOf(d), answer: w })) },
};
const WORD_SETS = {
  simple: { name: 'Simple words', grade: 1, list: WORDS },
  signs: { name: 'Sign words (Grade 2)', grade: 2, list: SIGN_WORDS.map((w) => w.toLowerCase()) },
  g2: { name: 'Grade 2 words', grade: 2, list: ['the', 'and', 'with', 'for', 'children', 'knowledge', 'people', 'there', 'father', 'mother', 'station', 'thing', 'shower', 'river', 'beach', 'information', 'kindness', 'house', 'light', 'stone'] },
};

views.practice = (q) => {
  const state = {
    mode: q.get('mode') || store.get('pmode', 'read'),
    set: q.get('set') || store.get('pset', 'aj'),
    wset: store.get('pwset', 'simple'),
    streak: 0, right: 0, total: 0, current: null, last: null, firstTry: true,
  };
  const mastery = store.get('mastery', {});
  view.innerHTML = `
    <div class="practice-wrap">
      <div class="row spread">
        <h1 style="font-size:2rem;margin:0">Practice</h1>
        <div class="seg" id="modeSeg">
          <button data-m="read">Read</button><button data-m="write">Write</button><button data-m="words">Words</button>
        </div>
      </div>
      <div class="scroll-x"><div class="chips" id="setChips"></div></div>
      <div class="card stage" id="stage"></div>
      <div class="row spread">
        <div class="stats"><span>Streak <b id="sStreak">0</b></span><span>Correct <b id="sRight">0</b>/<b id="sTotal">0</b></span></div>
        <button class="chip" id="resetM">Reset progress</button>
      </div>
      <div><div class="kicker">Your progress in this set</div><div class="mastery" id="mastery"></div></div>
      <p class="muted small" id="pHelp"></p>
    </div>`;

  const stage = $('#stage');
  const items = () => {
    if (state.mode === 'words') return [];
    let it = PRACTICE_SETS[state.set].items();
    if (state.mode === 'write') it = it.filter((x) => (x.writeCell || x.cells).length === 1);
    return it;
  };
  const score = (k) => mastery[k] || 0;
  const bump = (k, d) => { mastery[k] = Math.max(0, Math.min(5, score(k) + d)); store.set('mastery', mastery); };

  function renderChips() {
    $$('#modeSeg button').forEach((b) => b.classList.toggle('on', b.dataset.m === state.mode));
    const chips = $('#setChips');
    if (state.mode === 'words') {
      chips.innerHTML = Object.entries(WORD_SETS).map(([k, s]) => `<button class="chip ${k === state.wset ? 'on' : ''}" data-s="${k}">${s.name}</button>`).join('');
    } else {
      chips.innerHTML = Object.entries(PRACTICE_SETS).filter(([k]) => state.mode !== 'write' || k !== 'num' || true)
        .map(([k, s]) => `<button class="chip ${k === state.set ? 'on' : ''}" data-s="${k}">${s.name}</button>`).join('');
    }
    $('#pHelp').innerHTML = {
      read: 'Tip: on a keyboard, just type the answer, or press <kbd>1</kbd>–<kbd>4</kbd>.',
      write: 'Tap the dots, then Check. On a keyboard use <kbd>F</kbd> <kbd>D</kbd> <kbd>S</kbd> for dots 1 2 3 and <kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd> for 4 5 6 — the same fingers as a Perkins brailler — and <kbd>Enter</kbd> to check.',
      words: 'Decode the word and type it. Hint reveals one cell at a time. Grade 2 sets use contractions — tap a cell in Reference if you’re unsure.',
    }[state.mode];
  }
  function renderMastery() {
    const m = $('#mastery');
    if (state.mode === 'words') { m.innerHTML = '<span class="muted small" style="width:auto;background:none">Word progress isn’t tracked — just enjoy decoding.</span>'; return; }
    m.innerHTML = items().map((x) => `<span data-l="${Math.min(3, Math.ceil(score(x.key) / 1.7))}" title="${esc(x.answer)}">${esc(x.answer.length > 3 ? x.answer.slice(0, 3) : x.answer)}</span>`).join('');
  }
  function nextItem() {
    const it = items();
    let pool = it.filter((x) => !state.last || x.key !== state.last.key);
    if (!pool.length) pool = it;
    const weights = pool.map((x) => 6 - score(x.key));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
    return pool[0];
  }
  function updateStats() {
    $('#sStreak').textContent = state.streak; $('#sRight').textContent = state.right; $('#sTotal').textContent = state.total;
  }
  function result(ok, item) {
    if (state.firstTry) {
      state.total++;
      if (ok) { state.right++; state.streak++; } else state.streak = 0;
      if (item.key) bump(item.key, ok ? 1 : -1);
    }
    state.firstTry = false;
    updateStats(); renderMastery();
  }

  function renderRead() {
    const item = state.current = nextItem(); state.last = item; state.firstTry = true;
    const pool = items();
    const opts = shuffle([item, ...shuffle(pool.filter((x) => x.key !== item.key)).slice(0, 3)]);
    stage.innerHTML = `
      <div class="kicker">What does this say?</div>
      <div class="prompt-cells">${[...item.cells].map((c) => cellHTML(c, 'raised')).join('')}</div>
      <div class="choices ${opts.some((o) => o.answer.length > 2) ? 'words' : ''}">${opts.map((o, i) => `<button class="choice" data-k="${esc(o.key)}">${esc(o.answer)}${o.label ? `<div class="small muted">${esc(o.label)}</div>` : ''}</button>`).join('')}</div>
      <div class="feedback" id="fb"></div>`;
    const choose = (btn) => {
      if (!btn || btn.classList.contains('right')) return;
      const ok = btn.dataset.k === item.key;
      result(ok, item);
      btn.classList.add(ok ? 'right' : 'wrong');
      const fb = $('#fb');
      if (ok) { fb.className = 'feedback good'; fb.textContent = pick(['Yes!', 'Nice.', 'Exactly.', 'You’ve got it.']); setTimeout(renderRead, 650); }
      else {
        const picked = opts.find((o) => o.key === btn.dataset.k);
        const isMirror = picked && picked.cells.length === 1 && item.cells.length === 1 && mirror(picked.cells) === item.cells;
        fb.className = 'feedback bad';
        fb.textContent = isMirror ? `Close — ${picked.answer} is the mirror image. Check which column the dots are in.` : `Not quite — that’s ${picked ? picked.answer : '?'} ${picked ? '(' + dotsLabel(picked.cells.slice(-1)) + ')' : ''}. Try again.`;
      }
    };
    stage.onclick = (e) => choose(e.target.closest('.choice'));
    state.key = (e) => {
      const btns = $$('.choice', stage);
      if (/^[1-4]$/.test(e.key) && !(PRACTICE_SETS[state.set] && state.set === 'num')) return choose(btns[Number(e.key) - 1]);
      const m = btns.find((b) => b.dataset.k === item.key && item.answer === e.key.toLowerCase()) || btns.find((b) => {
        const o = opts.find((x) => x.key === b.dataset.k); return o && o.answer === e.key.toLowerCase();
      });
      if (m) choose(m);
    };
  }

  function renderWrite() {
    const item = state.current = nextItem(); state.last = item; state.firstTry = true;
    const target = item.writeCell || item.cells;
    const want = new Set(toDots(target));
    const on = new Set();
    stage.innerHTML = `
      <div class="kicker">Make this ${state.set === 'num' ? 'digit (the number sign is already there)' : state.set === 'g2' ? 'contraction' : 'symbol'}</div>
      <div class="target">${esc(item.answer)}</div>
      <div class="dotpad" id="pad">${[1, 2, 3, 4, 5, 6].map((d) => `<button data-d="${d}" aria-label="dot ${d}">${d}</button>`).join('')}</div>
      <div class="row"><button class="btn primary" id="check">Check</button><button class="btn ghost" id="skip">Show me</button></div>
      <div class="feedback" id="fb"></div>`;
    const pad = $('#pad');
    const toggle = (d) => { on.has(d) ? on.delete(d) : on.add(d); $(`[data-d="${d}"]`, pad).classList.toggle('on', on.has(d)); pad.classList.remove('wrong'); };
    pad.onclick = (e) => { const b = e.target.closest('button'); if (b) toggle(Number(b.dataset.d)); };
    const check = () => {
      const ok = on.size === want.size && [...want].every((d) => on.has(d));
      result(ok, item);
      const fb = $('#fb');
      if (ok) { pad.classList.add('right'); fb.className = 'feedback good'; fb.textContent = `Yes — ${dotsLabel(target)}.`; setTimeout(renderWrite, 800); }
      else { pad.classList.add('wrong'); fb.className = 'feedback bad'; fb.textContent = 'Not quite. Adjust and check again.'; }
    };
    $('#check').onclick = check;
    $('#skip').onclick = () => {
      state.firstTry && result(false, item);
      [1, 2, 3, 4, 5, 6].forEach((d) => { if (want.has(d) !== on.has(d)) toggle(d); });
      $('#fb').className = 'feedback'; $('#fb').textContent = `${item.answer} is ${dotsLabel(target)}. Press Check when ready.`;
    };
    const KEYS = { f: 1, d: 2, s: 3, j: 4, k: 5, l: 6 };
    state.key = (e) => {
      if (KEYS[e.key.toLowerCase()]) toggle(KEYS[e.key.toLowerCase()]);
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); check(); }
    };
  }

  function renderWords() {
    const ws = WORD_SETS[state.wset];
    let word = pick(ws.list);
    if (state.last && state.last === word) word = pick(ws.list);
    state.last = word; state.firstTry = true;
    const parts = translate(word, 'en', ws.grade);
    const cells = toCells(parts);
    let shown = 0;
    stage.innerHTML = `
      <div class="kicker">Decode this ${ws.grade === 2 ? 'contracted ' : ''}word</div>
      <div class="prompt-cells ${cells.length > 6 ? 'many' : ''}" id="wcells">${cells.map((c) => `<span class="bw">${cellHTML(c.cell, 'raised')}<span class="lbl"></span></span>`).join('')}</div>
      <input class="answer-input" id="ans" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="type it">
      <div class="row"><button class="btn primary" id="check">Check</button><button class="btn ghost" id="hint">Hint</button><button class="btn ghost" id="skip">Skip</button></div>
      <div class="feedback" id="fb"></div>`;
    const ans = $('#ans');
    if (matchMedia('(pointer: fine)').matches) ans.focus();
    const lbls = $$('#wcells .lbl');
    const reveal = (n) => { cells.slice(0, n).forEach((c, i) => { lbls[i].textContent = c.idx === 0 ? c.print || '·' : ''; }); };
    const check = () => {
      const ok = ans.value.trim().toLowerCase() === word;
      result(ok, {});
      const fb = $('#fb');
      if (ok) { fb.className = 'feedback good'; fb.textContent = 'Yes!'; reveal(cells.length); setTimeout(renderWords, 900); }
      else { fb.className = 'feedback bad'; fb.textContent = 'Not quite — try a hint.'; }
    };
    $('#check').onclick = check;
    ans.onkeydown = (e) => { if (e.key === 'Enter') check(); };
    $('#hint').onclick = () => { state.firstTry = false; shown = Math.min(cells.length, shown + 1); reveal(shown); };
    $('#skip').onclick = () => { reveal(cells.length); $('#fb').className = 'feedback'; $('#fb').textContent = `It was “${word}”.`; setTimeout(renderWords, 1400); };
    state.key = null;
  }

  function render() {
    store.set('pmode', state.mode); store.set('pset', state.set); store.set('pwset', state.wset);
    renderChips(); renderMastery();
    ({ read: renderRead, write: renderWrite, words: renderWords })[state.mode]();
  }
  $('#modeSeg').onclick = (e) => { const b = e.target.closest('button'); if (b) { state.mode = b.dataset.m; state.last = null; render(); } };
  $('#setChips').onclick = (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    if (state.mode === 'words') state.wset = b.dataset.s; else state.set = b.dataset.s;
    state.last = null; render();
  };
  $('#resetM').onclick = () => { for (const x of items()) delete mastery[x.key]; store.set('mastery', mastery); renderMastery(); };
  const onKey = (e) => { if (e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey) return; state.key && state.key(e); };
  document.addEventListener('keydown', onKey);
  render();
  return () => document.removeEventListener('keydown', onKey);
};

// ---------- sweep (finger trainer) ----------
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

views.sweep = (q) => {
  const canVibrate = 'vibrate' in navigator && matchMedia('(pointer: coarse)').matches;
  const canSpeak = 'speechSynthesis' in window;
  const st = {
    src: q.get('src') || store.get('swSrc', 'words'),
    grade: store.get('swGrade', 1),
    labels: store.get('swLabels', 'show'),
    sound: store.get('swSound', true),
    vibe: store.get('swVibe', canVibrate),
    speak: store.get('swSpeak', false),
    size: store.get('swSize', 'large'),
    speed: store.get('swSpeed2', 1),
    custom: q.get('text') || store.get('swCustom', 'Welcome to Ontario'),
  };
  if (q.get('text')) st.src = 'custom';
  const SOURCES = { alphabet: 'Alphabet', words: 'Words', sentences: 'Sentences', signs: 'Sign words', custom: 'Your text' };
  view.innerHTML = `
    <div class="sweep-intro">
      <h1 style="font-size:2rem">Finger sweep</h1>
      <p class="muted">Put your finger on the line and slide right. The cell directly under your finger is the one you’re reading, and it shows in the bubble above so your finger never hides it. Each raised dot clicks as you cross it: high for the top row, low for the bottom. Keep going into the shaded right edge and the line scrolls under your finger, so you can read on without lifting. On a laptop, just move the mouse across.</p>
    </div>
    <div class="scroll-x" style="margin-bottom:12px"><div class="chips" id="srcChips">${Object.entries(SOURCES).map(([k, v]) => `<button class="chip" data-s="${k}">${v}</button>`).join('')}</div></div>
    <div class="row" id="customRow" style="margin-bottom:12px"><input class="custom-input" id="customText" maxlength="200" placeholder="Type something to read"><button class="btn" id="customGo">Load</button></div>
    <div class="sweep-box" id="box" tabindex="0" aria-label="Braille strip. Use arrow keys to move cell by cell.">
      <div class="edge left"></div><div class="edge right"></div>
      <div class="sweep-track" id="track"></div>
      <div class="reader" id="reader"></div>
      <div class="loupe" id="loupe"></div>
      <div class="finger" id="finger"></div>
      <div class="sweep-hint" id="hint">place a finger on the line and slide right</div>
    </div>
    <div class="word-reveal" id="wordReveal"></div>
    <div class="sweep-controls">
      <div class="row">
        <div class="seg" id="gradeSeg"><button data-g="1">Grade 1</button><button data-g="2">Grade 2</button></div>
        <div class="seg" id="lblSeg"><button data-l="show">Letters shown</button><button data-l="after">Reveal after</button><button data-l="hidden">Hidden</button></div>
        <div class="seg" id="sizeSeg"><button data-z="large">Large</button><button data-z="real">Real size</button></div>
      </div>
      <div class="row">
        <label class="toggle"><input type="checkbox" id="snd"> Dot clicks</label>
        ${canVibrate ? '<label class="toggle"><input type="checkbox" id="vib"> Vibrate</label>' : ''}
        ${canSpeak ? '<label class="toggle"><input type="checkbox" id="spk"> Say letters</label>' : ''}
      </div>
      <div class="row">
        <button class="btn" id="glide">▶ Auto-glide</button>
        <label class="toggle">Glide speed <input type="range" id="spd" min="0.4" max="2" step="0.1"></label>
        <button class="btn ghost" id="restart">↺ Start over</button>
        <button class="btn ghost" id="shuffleBtn">New line</button>
      </div>
    </div>`;

  const box = $('#box'), track = $('#track'), loupe = $('#loupe'), finger = $('#finger'), reader = $('#reader');
  let cells = [], lefts = [], widths = [], totalW = 0, offset = 0, headX = 0, W = 0;
  let lastKey = '', curIdx = -1, glideOn = false, raf = 0, edgeRaf = 0, active = false;

  function textFor() {
    if (st.src === 'alphabet') return 'abcdefghijklmnopqrstuvwxyz'.split('').join(' ');
    if (st.src === 'words') return shuffle(WORDS).slice(0, 8).join(' ');
    if (st.src === 'sentences') return pick(SENTENCES);
    if (st.src === 'signs') return shuffle(SIGN_WORDS).slice(0, 6).join(' ');
    return st.custom;
  }
  let text = textFor();

  function build() {
    const grade = st.src === 'signs' ? 2 : st.grade;
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

  function wordAround(i) {
    let a = i, b = i;
    while (a > 0 && cells[a - 1].kind !== 'space') a--;
    while (b < cells.length - 1 && cells[b + 1].kind !== 'space') b++;
    return [a, b];
  }
  function say(t) {
    if (!st.speak || !canSpeak || !t) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.rate = 1.1; u.lang = 'en-CA'; speechSynthesis.speak(u); } catch {}
  }
  function update(feedback = true) {
    clamp();
    track.style.transform = `translateX(${offset}px)`;
    reader.style.left = headX + 'px'; finger.style.left = headX + 'px';
    loupe.style.left = Math.max(80, Math.min(W - 80, headX)) + 'px';
    box.classList.toggle('active', active || glideOn);
    const pos = headX - offset; // position along the line, in track pixels
    let idx = -1;
    for (let i = 0; i < cells.length; i++) if (pos >= lefts[i] && pos < lefts[i] + widths[i]) { idx = i; break; }
    $$('.sc', track).forEach((el, i) => el.classList.toggle('passed', lefts[i] + widths[i] < pos));
    if (idx !== curIdx) {
      $$('.sc.cur', track).forEach((e) => e.classList.remove('cur'));
      if (idx >= 0 && cells[idx].kind !== 'space') {
        track.children[idx].classList.add('cur');
        const c = cells[idx];
        if (feedback && c.idx === 0) say(c.kind === 'indicator' ? '' : c.print);
      }
      const finished = curIdx >= 0 && cells[curIdx].kind !== 'space' && (idx > curIdx && (!cells[idx] || cells[idx].kind === 'space') || (idx === -1 && pos > totalW));
      if (finished) {
        const [a, b] = wordAround(curIdx);
        $('#wordReveal').textContent = cells.slice(a, b + 1).map((c) => (c.idx === 0 ? c.print : '')).join('');
      }
      if (idx !== -1 || pos > totalW) curIdx = idx;
    }
    const c = cells[idx];
    if (c && c.kind !== 'space') {
      loupe.style.display = '';
      const g = c.group;
      const kindName = c.kind === 'indicator' ? (c.note || 'indicator') : c.kind === 'contraction' ? (g.note === 'groupsign' ? 'groupsign' : 'contraction') : c.kind === 'digit' ? 'digit' : c.kind === 'punct' ? (c.note || 'punctuation') : dotsLabel(c.cell);
      loupe.innerHTML = `${cellHTML(c.cell, 'numbered')}<div class="lp"><b>${esc(g.print || '·')}</b><span>${esc(kindName)}${c.span > 1 ? ` · cell ${c.idx + 1}/${c.span}` : ''}</span></div>`;
      loupe.classList.toggle('hidden-print', st.labels !== 'show');
      if (feedback) {
        const col = (pos - lefts[idx]) / widths[idx] < 0.5 ? 0 : 1;
        const key = idx + ':' + col;
        if (key !== lastKey) {
          lastKey = key;
          const dots = toDots(c.cell).filter((d) => (col === 0 ? d <= 3 : d >= 4 && d <= 6));
          if (st.sound) dots.forEach((d, k) => tick((d - 1) % 3, k * 0.025));
          if (st.vibe && canVibrate && dots.length) { const pat = []; dots.forEach(() => pat.push(14, 18)); try { navigator.vibrate(pat); } catch {} }
        }
      }
    } else {
      loupe.style.display = 'none';
      if (!c) lastKey = '';
    }
  }

  // Edge zones: holding your finger near an edge scrolls the line under it,
  // so the text moves beneath a still fingertip (which is also how reading feels).
  const EDGE = () => Math.min(90, W * 0.18);
  function edgeLoop() {
    cancelAnimationFrame(edgeRaf);
    let prev = performance.now();
    const step = (t) => {
      const dt = Math.min(50, t - prev) / 1000; prev = t;
      if (!active) return;
      const e = EDGE();
      let v = 0;
      if (headX > W - e) v = -((headX - (W - e)) / e);
      else if (headX < e) v = (e - headX) / e;
      if (v) { offset += v * 260 * dt; update(); }
      edgeRaf = requestAnimationFrame(step);
    };
    edgeRaf = requestAnimationFrame(step);
  }

  // Pointer: the reading point is exactly where the finger / cursor is (1:1).
  const boxX = (e) => e.clientX - box.getBoundingClientRect().left;
  box.addEventListener('pointerdown', (e) => {
    stopGlide(); active = true; box.setPointerCapture(e.pointerId); box.classList.add('dragging');
    headX = boxX(e); $('#hint').style.opacity = 0; update(); edgeLoop();
  });
  box.addEventListener('pointermove', (e) => {
    const touchLike = e.pointerType !== 'mouse';
    if (touchLike && !box.hasPointerCapture(e.pointerId)) return;
    if (!touchLike && glideOn) return;
    if (!active && !touchLike) { active = true; edgeLoop(); $('#hint').style.opacity = 0; }
    headX = Math.max(0, Math.min(W, boxX(e))); update();
  });
  const end = (e) => {
    if (e.pointerType !== 'mouse' || e.type === 'pointerleave') { active = false; box.classList.remove('dragging'); update(false); }
  };
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
    const start = offset, t0 = performance.now(), dur = 420;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur); const ease = 1 - Math.pow(1 - k, 3);
      offset = start + (target - start) * ease; update();
      if (k < 1) raf = requestAnimationFrame(step);
    };
    cancelAnimationFrame(raf); raf = requestAnimationFrame(step);
  }
  function startGlide() {
    glideOn = true; $('#glide').textContent = '❚❚ Pause';
    if (headX < W * 0.2 || headX > W * 0.8) headX = Math.round(W * 0.35);
    let prev = performance.now();
    const step = (t) => {
      if (!glideOn) return;
      // about 1 cell per second at speed 1
      const pitch = widths[0] ? widths[0] * 1.4 : 60;
      offset -= (t - prev) / 1000 * pitch * st.speed; prev = t; update();
      if (headX - offset > totalW + 10) { stopGlide(); return; }
      raf = requestAnimationFrame(step);
    };
    cancelAnimationFrame(raf); raf = requestAnimationFrame(step);
  }
  function stopGlide() { glideOn = false; const g = $('#glide'); if (g) g.textContent = '▶ Auto-glide'; }

  function syncControls() {
    $$('#srcChips .chip').forEach((b) => b.classList.toggle('on', b.dataset.s === st.src));
    $$('#gradeSeg button').forEach((b) => b.classList.toggle('on', Number(b.dataset.g) === (st.src === 'signs' ? 2 : st.grade)));
    $$('#lblSeg button').forEach((b) => b.classList.toggle('on', b.dataset.l === st.labels));
    $$('#sizeSeg button').forEach((b) => b.classList.toggle('on', b.dataset.z === st.size));
    box.classList.toggle('labels-hidden', st.labels === 'hidden');
    box.classList.toggle('labels-after', st.labels === 'after');
    box.classList.toggle('real', st.size === 'real');
    $('#customRow').style.display = st.src === 'custom' ? '' : 'none';
    $('#shuffleBtn').style.display = ['words', 'sentences', 'signs'].includes(st.src) ? '' : 'none';
    $('#customText').value = st.custom;
    $('#snd').checked = st.sound; if ($('#vib')) $('#vib').checked = st.vibe; if ($('#spk')) $('#spk').checked = st.speak; $('#spd').value = st.speed;
    store.set('swSrc', st.src); store.set('swGrade', st.grade); store.set('swLabels', st.labels); store.set('swSize', st.size);
  }
  $('#srcChips').onclick = (e) => { const b = e.target.closest('.chip'); if (!b) return; st.src = b.dataset.s; text = textFor(); syncControls(); build(); };
  $('#gradeSeg').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; st.grade = Number(b.dataset.g); syncControls(); build(); };
  $('#lblSeg').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; st.labels = b.dataset.l; syncControls(); update(false); };
  $('#sizeSeg').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; st.size = b.dataset.z; syncControls(); build(); };
  $('#snd').onchange = (e) => { st.sound = e.target.checked; store.set('swSound', st.sound); if (st.sound) tick(0); };
  if ($('#vib')) $('#vib').onchange = (e) => { st.vibe = e.target.checked; store.set('swVibe', st.vibe); };
  if ($('#spk')) $('#spk').onchange = (e) => { st.speak = e.target.checked; store.set('swSpeak', st.speak); };
  $('#spd').oninput = (e) => { st.speed = Number(e.target.value); store.set('swSpeed2', st.speed); };
  $('#glide').onclick = () => (glideOn ? stopGlide() : startGlide());
  $('#restart').onclick = () => { stopGlide(); headX = Math.round(W * 0.1); animateTo(startOffset()); $('#wordReveal').textContent = ''; };
  $('#shuffleBtn').onclick = () => { text = textFor(); build(); };
  const loadCustom = () => { st.custom = $('#customText').value.trim() || st.custom; store.set('swCustom', st.custom); text = st.custom; build(); };
  $('#customGo').onclick = loadCustom;
  $('#customText').onkeydown = (e) => { if (e.key === 'Enter') loadCustom(); };
  const onResize = () => { const p = headX - offset; measure(); headX = Math.min(headX, W); offset = headX - p; update(false); };
  window.addEventListener('resize', onResize);
  syncControls(); build();
  return () => { stopGlide(); active = false; cancelAnimationFrame(raf); cancelAnimationFrame(edgeRaf); window.removeEventListener('resize', onResize); try { speechSynthesis.cancel(); } catch {} };
};

// ---------- signs ----------
const ICONS = {
  person: '<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="4.5" r="2.3"/><path d="M9 8h6l1 7h-2l-.5 7h-3L10 15H8z"/></svg>',
  people: '<svg width="36" height="30" viewBox="0 0 30 24" fill="currentColor"><circle cx="8" cy="4.5" r="2.2"/><path d="M5.5 8h5l1 7h-2l-.4 7H7l-.4-7H4.5z"/><circle cx="22" cy="4.5" r="2.2"/><path d="M19.5 8h5l2.5 9h-3l-.3 5h-3l-.3-5h-3z"/></svg>',
  exit: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4h5v16h-5"/><path d="M4 12h10m-4-4 4 4-4 4"/></svg>',
  stairs: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 20h5v-5h5v-5h5V5h3"/></svg>',
  elevator: '<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 3 4 9h8zM8 21l4-6H4z"/><rect x="14" y="3" width="7" height="18" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  info: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  fire: '<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/></svg>',
  door: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="3" width="12" height="18" rx="1"/><circle cx="15" cy="12" r=".8" fill="currentColor"/></svg>',
};
function iconFor(w) {
  w = w.toLowerCase();
  if (/wash|toilet|restroom|toilettes/.test(w)) return ICONS.people;
  if (/^men|women|^man/.test(w)) return ICONS.person;
  if (/exit|sortie|way out|ausgang|salida/.test(w)) return ICONS.exit;
  if (/stair/.test(w)) return ICONS.stairs;
  if (/elev|lift|ascen|main floor/.test(w)) return ICONS.elevator;
  if (/info/.test(w)) return ICONS.info;
  if (/fire|alarm/.test(w)) return ICONS.fire;
  if (/room|office/.test(w)) return ICONS.door;
  return '';
}
function plateHTML(print, lang = 'en', grade = 2, extra = null, cls = '') {
  const tone = /exit|sortie|way out|fire/i.test(print) ? 'blue' : cls;
  const parts = translate(print, lang, grade);
  return `<button class="plate ${tone}" aria-label="Sign: ${esc(print)}">
    <span class="pic">${iconFor(print)}</span>
    <span class="ptxt">${esc(print)}${extra ? `<br><span style="font-size:.8em;opacity:.85">${esc(extra[0])}</span>` : ''}</span>
    ${lineHTML(parts)}
    ${extra ? lineHTML(translate(extra[0], extra[1], 1)) : ''}
    <span class="tap">tap to decode</span>
  </button>`;
}

views.signs = (q, sub) => {
  const region = SIGN_REGIONS[sub] ? sub : 'ca';
  const R = SIGN_REGIONS[region];
  const elevator = region === 'ca' || region === 'us';
  view.innerHTML = `
    <h1 style="font-size:2rem;margin-top:16px">Signs in the wild</h1>
    <p class="muted" style="max-width:62ch">Braille signs follow patterns. Once you know where to reach and which code to expect, a sign takes seconds to read. Pick a place:</p>
    <div class="scroll-x" style="margin:14px -16px 22px"><div class="chips">${Object.entries(SIGN_REGIONS).map(([k, r]) => `<a class="chip ${k === region ? 'on' : ''}" href="#/signs/${k}">${r.name}</a>`).join('')}</div></div>


    ${region === 'jp' ? `
      <section><h2>Kana braille</h2><p class="muted">${esc(JAPANESE.blurb)}</p>
      ${JAPANESE.rows.map(([n, r]) => `<div class="group-title"><h3>${n}</h3></div><div class="sym-grid">${r.map(([p, c]) => `<div class="sym"><span class="cells">${cellHTML(c)}</span><b>${p}</b></div>`).join('')}</div>`).join('')}
      </section>` : `
      <section style="margin-top:8px">
        <div class="row spread" style="margin-bottom:14px">
          <h2 style="margin:0">Read these signs</h2>
          <label class="toggle"><input type="checkbox" id="hideSignPrint"> Hide the print — read the braille first</label>
        </div>
        <div class="sign-gallery" id="gallery">
          ${R.signs.map((s) => plateHTML(s, R.signLang || 'en', R.signLang ? 1 : 2)).join('')}
          ${(R.bilingual || []).map(([en, fr]) => plateHTML(en, 'en', 2, [fr, 'fr'], 'light')).join('')}
        </div>
        <p class="muted small" style="margin-top:12px">${R.signLang ? 'Shown in uncontracted French braille.' : 'Shown in UEB Grade 2, the way new signs are made. Tap a sign to see what each cell means.'}</p>
      </section>`}

    <section><h2>How it works here</h2>
    <div class="facts">${R.facts.map(([t, p]) => `<div class="fact"><b>${esc(t)}</b><p>${esc(p)}</p></div>`).join('')}</div></section>

    ${region !== 'jp' ? `
    <section class="card">
      <div class="anatomy">
        ${plateHTML('Room 101', 'en', 2)}
        <div>
          <h3>Anatomy of a room sign</h3>
          <ol>
            <li>A raised pictogram or text you can feel, in capitals, with high contrast.</li>
            <li>Braille directly <b>below</b> the text, starting at the left.</li>
            <li>${cellHTML(IND.capital, 'sm')} capital sign (dot 6), then the word, often contracted.</li>
            <li>${cellHTML(IND.number, 'sm')} number sign before the room number — a–j become digits.</li>
            <li>Mounted beside the door on the handle side, so your hand finds it without searching.</li>
          </ol>
        </div>
      </div>
    </section>` : ''}

    ${elevator ? `
    <section>
      <h2>Elevator buttons</h2>
      <div class="row" style="align-items:flex-start;gap:28px">
        <div class="elevator">
          ${[['★', 'Main', 'main'], ['3', '#3'], ['2', '#2'], ['1', '#1'], ['◁▷', 'open', 'open'], ['▷◁', 'close', 'close'], ['🔔', 'alarm', 'alarm']].map(([face, , word]) => {
            const t = word || face;
            const cells = unicodeOf(translate(/^\d$/.test(face) ? face : t, 'en', 2)).replace(/ /g, '⠀');
            return `<span class="eb">${[...cells].map((c) => cellHTML(c)).join('')}</span><span class="ebtn">${face === '🔔' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zm-2 15a2 2 0 0 0 4 0z"/></svg>' : face}</span>`;
          }).join('')}
        </div>
        <div style="flex:1;min-width:240px">
          <p>Braille sits to the <b>left</b> of each button. Floor numbers use the number sign: ${cellHTML(IND.number, 'sm')}${cellHTML(LETTERS.b, 'sm')} = 2.</p>
          <p>The star ★ marks the main floor; its braille spells <b>main</b> as ${cellsHTML(unicodeOf(translate('main', 'en', 2)), 'sm')} (m-a-<span style="color:var(--accent)">in</span>).</p>
          <p>“Open” is ${cellsHTML(unicodeOf(translate('open', 'en', 2)), 'sm')} — o, p, then the <span style="color:var(--accent)">en</span> contraction. “Alarm” uses <span style="color:var(--accent)">ar</span>: ${cellsHTML(unicodeOf(translate('alarm', 'en', 2)), 'sm')}.</p>
          <p class="muted small">Outside, the same numbers appear on both sides of the elevator door frame at about 1.5 m.</p>
        </div>
      </div>
    </section>` : ''}

    ${region === 'ca' ? `
    <section>
      <h2>Feel your money</h2>
      <p class="muted" style="max-width:62ch">Since 2001, Canadian banknotes carry raised cell-shaped clusters in the top corner. Count the clusters:</p>
      <div class="row" style="gap:18px">${[5, 10, 20, 50, 100].map((v, i) => `<div class="card" style="padding:14px 16px;display:flex;flex-direction:column;gap:8px;align-items:flex-start"><span class="row" style="gap:6px">${cellHTML(fromDots('123456'), 'sm').repeat(i + 1)}</span><b>$${v}</b></div>`).join('')}</div>
    </section>
    <section>
      <h2>Field tips for Ontario</h2>
      <div class="facts">
        <div class="fact"><b>Start with numbers</b><p>Room numbers and elevator floors are the easiest wins — just the number sign plus a–j.</p></div>
        <div class="fact"><b>Expect contractions</b><p>Learn “sh”, “en”, “ar”, “in”, “st” and “the” early: they appear in washroom, men, women, alarm, main, stairs.</p></div>
        <div class="fact"><b>Missing capitals</b><p>Older (EBAE) signs often leave out the capital sign — don’t let that throw you.</p></div>
        <div class="fact"><b>Read the line, not the dot</b><p>Use the pad of your finger, light pressure, and keep moving. Stopping makes dots harder to feel.</p></div>
      </div>
    </section>` : ''}
  `;
  const gallery = $('#gallery');
  if (gallery) {
    const hp = $('#hideSignPrint');
    hp.checked = store.get('signsHide', false);
    const apply = () => { gallery.classList.toggle('signs-hide', hp.checked); store.set('signsHide', hp.checked); };
    hp.onchange = apply; apply();
  }
  $$('.plate').forEach((p) => p.addEventListener('click', () => p.classList.toggle('decoded')));
};

// ---------- reference ----------
views.reference = (q, sub) => {
  const SECTIONS = [
    ['search', 'Search'], ['grade1', 'Grade 1'], ['grade2', 'Grade 2'], ['science', 'Maths & science'],
    ['languages', 'Languages'], ['systems', 'World systems'], ['history', 'History'],
  ];
  const groupBlock = (g, title, blurb) => {
    const list = DICT.map((e, i) => [e, i]).filter(([e]) => e.group === g);
    return `<div class="group-title"><h3>${title}</h3>${blurb ? `<span>${esc(blurb)}</span>` : ''}</div><div class="sym-grid">${list.map(([e, i]) => symHTML(e, i)).join('')}</div>`;
  };
  const lang = store.get('refLang', 'en');
  view.innerHTML = `
    <div class="ref-layout">
      <nav class="ref-nav" id="refNav">${SECTIONS.map(([k, t]) => `<a href="#/reference/${k}" data-k="${k}">${t}</a>`).join('')}<a href="#/translate">Translate →</a></nav>
      <div>
        <div class="ref-section" id="sec-search">
          <h1 style="font-size:2rem;margin-top:8px">Reference</h1>
          <input class="search" id="q" type="search" placeholder="Search: a word (“the”), a symbol (“?”), or dot numbers (“1456”)" autocomplete="off">
          <div id="results" style="margin-top:14px"></div>
        </div>

        <div class="ref-section" id="sec-grade1">
          <h2>Grade 1 — uncontracted</h2>
          <p>Every letter, digit and punctuation mark gets its own cell (or two). This is where everyone starts, and it’s used for spelling things out, for names and for most other languages.</p>
          ${groupBlock('Letters', 'Letters')}
          ${groupBlock('Numbers', 'Numbers', 'number sign ⠼ + a–j')}
          ${groupBlock('Punctuation', 'Punctuation & symbols', 'UEB')}
          ${groupBlock('Indicators', 'Indicators', 'they change how the next cells are read')}
        </div>

        <div class="ref-section" id="sec-grade2">
          <h2>Grade 2 — contracted</h2>
          <p>About 180 contractions that make braille shorter and faster to read. Most books, magazines and public signs in Canada use Grade 2. The trick is that many cells have more than one meaning, depending on whether they stand alone or sit inside a word.</p>
          ${Object.entries(CONTRACTIONS).map(([cat, { blurb }]) => groupBlock(cat, cat, blurb)).join('')}
        </div>

        <div class="ref-section" id="sec-science">
          <h2>Maths & science</h2>
          <p>UEB handles technical material with extra indicators — superscript ⠔, subscript ⠢, operation signs that start with dot 5. In Grade 2 text, a grade 1 indicator ⠰ often goes in front of ⠔ and ⠢ so they aren’t mistaken for “in” and “en”. Examples below are written in Grade 1 mode.</p>
          <div class="example-grid">${SCIENCE.map((s) => `<div class="example"><div class="print">${esc(s.print)}</div><div class="braille-line">${cellsHTML(s.ueb, 'md')}</div><div class="notes">${s.notes.map((n) => `<span>${esc(n)}</span>`).join('')}</div></div>`).join('')}</div>
          <div class="group-title"><h3>Nemeth Code</h3><span>still allowed for maths in Canada and the US</span></div>
          <div class="example-grid">${NEMETH.map((s) => `<div class="example"><div class="print">${esc(s.print)}</div><div class="braille-line">${cellsHTML(s.cells, 'md')}</div><div class="notes">${s.notes.map((n) => `<span>${esc(n)}</span>`).join('')}</div></div>`).join('')}</div>
        </div>

        <div class="ref-section" id="sec-languages">
          <h2>Languages</h2>
          <p>The 6-dot cell is shared worldwide, but every language assigns its own meanings. Toggle a language to see its alphabet and phrases.</p>
          <div class="scroll-x" style="margin-bottom:16px"><div class="chips" id="langChips">${[...Object.keys(LANG_INFO), 'ja'].map((k) => `<button class="chip" data-l="${k}">${k === 'ja' ? '日本語' : k === 'en' ? 'English' : LANGS[k].name}</button>`).join('')}</div></div>
          <div id="langBody"></div>
        </div>

        <div class="ref-section" id="sec-systems">
          <h2>World braille systems</h2>
          <p>A map of the braille family: the codes you’re likely to meet, plus the special-purpose and tactile cousins.</p>
          ${SYSTEMS.map((g) => `<div class="group-title"><h3>${esc(g.group)}</h3></div><div class="table-list">${g.items.map(([n, w, d]) => `<div class="sys"><b>${esc(n)}</b><span class="where">${esc(w)}</span><p>${esc(d)}</p></div>`).join('')}</div>`).join('')}
        </div>

        <div class="ref-section" id="sec-history">
          <h2>History & standards</h2>
          <ol class="timeline">${HISTORY.map(([y, t]) => `<li><b>${y}</b>${esc(t)}</li>`).join('')}</ol>
        </div>
      </div>
    </div>`;
  bindSyms(view, DICT);

  // search
  const results = $('#results');
  const doSearch = () => {
    const raw = $('#q').value.trim();
    if (!raw) { results.innerHTML = '<p class="muted small">Tip: tap any symbol for its dots and rules.</p>'; return; }
    const s = raw.toLowerCase();
    const isDots = /^[1-6][1-6\s-]*$/.test(s);
    const isBraille = /^[⠀-⣿]+$/.test(raw);
    const hits = DICT.map((e, i) => [e, i]).filter(([e]) => {
      if (isDots) return [...e.cells].map((c) => toDots(c).join('')).join(' ').includes(s.replace(/-/g, ''));
      if (isBraille) return e.cells.includes(raw);
      return e.print.toLowerCase().includes(s) || (e.note || '').toLowerCase().includes(s);
    }).sort(([a], [b]) => (a.print.toLowerCase() === s ? -1 : 0) - (b.print.toLowerCase() === s ? -1 : 0));
    const tr = !isDots && !isBraille && /[a-z]/i.test(raw) ? `<div class="example" style="margin-top:12px"><div class="small muted">“${esc(raw)}” in Grade 2</div>${lineHTML(translate(raw, 'en', 2))}</div>` : '';
    results.innerHTML = (hits.length ? `<div class="sym-grid">${hits.slice(0, 60).map(([e, i]) => symHTML(e, i)).join('')}</div>` : '<p class="muted">No symbol matches.</p>') + tr;
  };
  $('#q').oninput = doSearch; doSearch();

  // languages
  const renderLang = (k) => {
    store.set('refLang', k);
    $$('#langChips .chip').forEach((b) => b.classList.toggle('on', b.dataset.l === k));
    const body = $('#langBody');
    if (k === 'ja') {
      body.innerHTML = `<h3>日本語 — Japanese</h3><p class="muted">${esc(JAPANESE.blurb)}</p>${JAPANESE.rows.map(([n, r]) => `<div class="group-title"><h3>${n}</h3></div><div class="sym-grid">${r.map(([p, c]) => `<div class="sym"><span class="cells">${cellHTML(c)}</span><b>${p}</b></div>`).join('')}</div>`).join('')}`;
      return;
    }
    const info = LANG_INFO[k];
    body.innerHTML = `<h3>${esc(info.title)}</h3><p class="muted">${esc(info.blurb)}</p>
      <div class="sym-grid">${[...info.letters].map((l) => { const p = translate(l, k, 1); return `<div class="sym"><span class="cells">${[...p[0].cells].map((c) => cellHTML(c)).join('')}</span><b>${l}</b></div>`; }).join('')}</div>
      <div class="group-title"><h3>Numbers</h3></div>
      <div class="example">${lineHTML(translate('2026', k, 1))}</div>
      <div class="group-title"><h3>Phrases</h3>${k === 'en' ? '<span>Grade 2</span>' : '<span>uncontracted</span>'}</div>
      <div class="example-grid">${info.phrases.map((p) => `<div class="example"><div class="print">${esc(p)}</div>${lineHTML(translate(p, k, k === 'en' ? 2 : 1), { cls: 'sm' })}<a class="small" href="#/translate?lang=${k}&text=${encodeURIComponent(p)}">Open in translator</a></div>`).join('')}</div>`;
  };
  $('#langChips').onclick = (e) => { const b = e.target.closest('.chip'); if (b) renderLang(b.dataset.l); };
  renderLang(lang);

  // section nav
  const nav = $('#refNav');
  const setOn = (k) => $$('a', nav).forEach((a) => a.classList.toggle('on', a.dataset.k === k));
  if (sub && $('#sec-' + sub)) requestAnimationFrame(() => $('#sec-' + sub).scrollIntoView({ behavior: 'instant', block: 'start' }));
  setOn(sub || 'search');
  const io = new IntersectionObserver((ents) => {
    const vis = ents.filter((x) => x.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (vis) { const k = vis.target.id.slice(4); setOn(k); const a = $(`a[data-k="${k}"]`, nav); a && nav.scrollTo && nav.scrollWidth > nav.clientWidth && nav.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' }); }
  }, { rootMargin: '-90px 0px -60% 0px' });
  $$('.ref-section').forEach((s) => io.observe(s));
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-k]'); if (!a) return;
    e.preventDefault(); history.replaceState(null, '', a.getAttribute('href'));
    $('#sec-' + a.dataset.k).scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  return () => io.disconnect();
};

// ---------- translate ----------
views.translate = (q) => {
  const LOPTS = [['en1', 'English · Grade 1'], ['en2', 'English · Grade 2'], ['fr', 'Français'], ['es', 'Español'], ['de', 'Deutsch'], ['ru', 'Русский'], ['el', 'Ελληνικά']];
  let mode = q.get('lang') ? (q.get('lang') === 'en' ? 'en2' : q.get('lang')) : store.get('trMode', 'en2');
  const initial = q.get('text') || store.get('trText', 'Welcome to Ontario. The washroom is on floor 2.');
  view.innerHTML = `
    <h1 style="font-size:2rem;margin-top:16px">Translate</h1>
    <div class="scroll-x" style="margin-bottom:12px"><div class="chips" id="trLang">${LOPTS.map(([k, n]) => `<button class="chip" data-k="${k}">${n}</button>`).join('')}</div></div>
    <textarea class="tr-input" id="trIn" spellcheck="false">${esc(initial)}</textarea>
    <div class="tr-tools">
      <label class="toggle"><input type="checkbox" id="trLbl" checked> Labels</label>
      <label class="toggle"><input type="checkbox" id="trBig"> Large</label>
      <button class="btn" id="trCopy">Copy braille text</button>
      <button class="btn" id="trSweep">Sweep this →</button>
    </div>
    <div class="card tr-out" id="trOut"></div>
    <p class="unicode" id="trUni"></p>
    <p class="muted small">Grade 2 here follows the main UEB contraction rules and handles common words well, but real transcription has many fine rules — a certified transcriber or tool like Liblouis is the authority. Other languages are shown uncontracted.</p>
    <div class="group-title"><h3>Try</h3></div>
    <div class="chips" id="trEx"></div>`;
  const inp = $('#trIn');
  const render = () => {
    const [lang, grade] = mode.startsWith('en') ? ['en', Number(mode[2])] : [mode, 1];
    const parts = translate(inp.value, lang, grade);
    $('#trOut').innerHTML = lineHTML(parts, { labels: $('#trLbl').checked });
    $('#trOut').classList.toggle('big', $('#trBig').checked);
    $('#trUni').textContent = unicodeOf(parts);
    $$('#trLang .chip').forEach((b) => b.classList.toggle('on', b.dataset.k === mode));
    const exLang = mode.startsWith('en') ? 'en' : mode;
    $('#trEx').innerHTML = LANG_INFO[exLang].phrases.map((p) => `<button class="chip" data-t="${esc(p)}">${esc(p)}</button>`).join('');
    store.set('trMode', mode); store.set('trText', inp.value);
  };
  inp.oninput = render;
  $('#trLbl').onchange = $('#trBig').onchange = render;
  $('#trLang').onclick = (e) => { const b = e.target.closest('.chip'); if (b) { mode = b.dataset.k; render(); } };
  $('#trEx').onclick = (e) => { const b = e.target.closest('.chip'); if (b) { inp.value = b.dataset.t; render(); } };
  $('#trCopy').onclick = async () => { try { await navigator.clipboard.writeText($('#trUni').textContent); $('#trCopy').textContent = 'Copied ✓'; setTimeout(() => ($('#trCopy').textContent = 'Copy braille text'), 1400); } catch {} };
  $('#trSweep').onclick = () => { store.set('swCustom', inp.value.slice(0, 200)); store.set('swSrc', 'custom'); location.hash = '#/sweep?src=custom'; };
  render();
};

// ---------- router ----------
let cleanup = null;
function route() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  const [name, sub] = path.split('/');
  const q = new URLSearchParams(qs || '');
  const fn = views[name] || views[''];
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  closeSheet();
  const r = fn(q, sub);
  cleanup = typeof r === 'function' ? r : null;
  $$('[data-route]').forEach((a) => a.classList.toggle('active', a.dataset.route === (views[name] ? name : '')));
  if (!(name === 'reference' && sub)) window.scrollTo(0, 0);
  document.title = { '': 'Dots — learn braille', practice: 'Practice · Dots', sweep: 'Finger sweep · Dots', signs: 'Signs · Dots', reference: 'Reference · Dots', translate: 'Translate · Dots' }[views[name] ? name : ''];
}
window.addEventListener('hashchange', route);

// header scroll shadow, theme toggle, tab icons
window.addEventListener('scroll', () => $('.top').classList.toggle('scrolled', scrollY > 4), { passive: true });
const savedTheme = store.get('theme', null);
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
$('#themeBtn').onclick = () => {
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'light' : 'dark';
  store.set('theme', document.documentElement.dataset.theme);
};
$$('.tabbar .ti').forEach((t) => { t.outerHTML = cellHTML(t.textContent, 'xs'); });

const foot = document.createElement('footer');
foot.className = 'foot';
foot.innerHTML = 'Dots — a personal braille learning site. Braille shown follows Unified English Braille unless noted. Made for learning; for official transcription consult a certified braille transcriber.';
document.body.insertBefore(foot, $('.tabbar'));
route();
