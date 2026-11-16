// Practice > Placement check (#/practice/place): a few questions from each group of the course, in teaching order,
// for people who already know some braille. Groups you get all right are marked known, so Auto (and the Known
// counts) start where you are instead of at a. It stops after two groups in a row go badly.
import { $, $$, cellHTML, esc, icon, mastery, setSub, setTitle, shuffle, store, view, sheet } from './core.js';
import { announce, feedback, cellsLabel, say, refocus, nativeKey } from './a11y.js';
import { autoCourse, autoState, autoSave, guessOptions } from './practice.js';
import { logDay } from './home.js';

const PER_GROUP = 3;
const NAMES = { start: 'Grade 2 starter signs', Numbers: 'Numbers', Punctuation: 'Punctuation', Indicators: 'Indicators' };
// The course split into its groups, in order: [name, items].
export function placementGroups() {
  const out = [];
  for (const x of autoCourse()) {
    const name = NAMES[x.src] || (/^[a-z]–[a-z]$/.test(x.src) ? `Letters ${x.src}` : x.src);
    if (!out.length || out[out.length - 1][0] !== name) out.push([name, []]);
    out[out.length - 1][1].push(x);
  }
  return out;
}
// Results go into Guess progress: a group got fully right counts as known; single right answers as learning.
export function applyPlacement(known, learning) {
  const m = mastery(), st = autoState('r:');
  known.forEach((x, i) => { m['r:' + x.key] = Math.max(m['r:' + x.key] || 0, 4); if (!st.s[x.key] || st.s[x.key][0] < 3) st.s[x.key] = [3, st.turn + 4 + (i % 20)]; });
  learning.forEach((x) => { m['r:' + x.key] = Math.max(m['r:' + x.key] || 0, 2); if (!st.s[x.key]) st.s[x.key] = [1, st.turn + 1]; });
  store.set('mastery', m); autoSave('r:', st);
}

export function placementView() {
  setTitle('Placement Check');
  setSub(`<div class="g-sub"><a class="back-link" href="#/practice/read?cat=auto">${icon('right', 18)} Practice</a></div>`);
  const groups = placementGroups(), course = autoCourse();
  view.innerHTML = `<div class="practice-wrap pl-wrap"><div class="card stage pl-stage" id="stage"></div></div>`;
  const stage = $('#stage');
  let gi = 0, qi = 0, qs = [], right = 0, fails = 0, total = 0, busy = false;
  const known = [], learning = [], passed = [];
  function intro() {
    stage.innerHTML = `<div class="pl-intro">
      <p class="pl-lead" tabindex="-1">Already know some braille? Answer a few questions from each part of the course, from the alphabet to Grade 2 shortforms.</p>
      <p class="muted">Parts you get right are marked as known, so Auto starts with what’s new to you. It stops by itself when the questions get too hard, and takes two to five minutes.</p>
      <button class="btn primary" id="plGo" type="button">Start</button></div>`;
    $('#plGo').onclick = () => { group(); };
    refocus(stage, $('.pl-lead', stage));
  }
  function group() {
    if (gi >= groups.length || fails >= 2) return finish();
    qs = shuffle(groups[gi][1]).slice(0, PER_GROUP); qi = 0; right = 0;
    ask();
  }
  function ask() {
    busy = false;
    const item = qs[qi], [name, items] = groups[gi];
    const pool = [...items, ...course.filter((x) => x.src === item.src)].filter((x) => x.key !== item.key);
    const opts = shuffle([item, ...guessOptions(item, pool.length >= 3 ? pool : course)]);
    stage.classList.remove('glow-good', 'glow-bad');
    stage.innerHTML = `<p class="pl-where"><span>${esc(name)}</span><span>Question ${total + 1}</span></p>
      <div class="prompt-cells" role="img" tabindex="-1" aria-label="Sign: ${esc(cellsLabel(item.cells))}">${[...item.cells].map((c) => cellHTML(c)).join('')}</div>
      <div class="choices ${opts.some((o) => o.answer.length > 2) ? 'words' : ''}" role="group" aria-label="Answers">${opts.map((o) => `<button class="choice" data-k="${esc(o.key)}">${esc(o.answer)}${o.label ? `<small>${esc(o.label)}</small>` : ''}</button>`).join('')}</div>
      <div class="pl-foot"><button class="link-btn pillish" id="plSkip" type="button">I don’t know</button><button class="link-btn pillish" id="plStop" type="button">Stop here</button></div>`;
    refocus(stage, $('.prompt-cells', stage));
    say(`${name}. ${cellsLabel(item.cells)}. Choices: ${opts.map((o) => o.answer).join(', ')}`);
    const answer = (ok, btn) => {
      if (busy) return; busy = true; total++; logDay();
      if (btn) { btn.classList.add(ok ? 'right' : 'wrong'); stage.classList.remove('glow-good', 'glow-bad'); void stage.offsetWidth; stage.classList.add(ok ? 'glow-good' : 'glow-bad'); feedback(ok); }
      if (!ok) { const r = $$('.choice', stage).find((b) => b.dataset.k === item.key); if (r) r.classList.add('reveal'); }
      if (ok) { right++; learning.push(item); }
      setTimeout(() => {
        if (!stage.isConnected) return;
        if (++qi < qs.length) return ask();
        // The whole group is known when every sampled sign was right.
        const all = right === qs.length;
        if (all) { passed.push(name); known.push(...items); fails = 0; } else if (right <= 1) fails++; else fails = 0;
        gi++; group();
      }, ok ? 450 : 1100);
    };
    stage.onclick = (e) => {
      const b = e.target.closest('.choice'); if (b) return answer(b.dataset.k === item.key, b);
      if (e.target.closest('#plSkip')) answer(false, null);
      if (e.target.closest('#plStop')) finish();
    };
    keyFn = (e) => { const btns = $$('.choice', stage); if (/^[1-4]$/.test(e.key) && !opts.some((o) => /^[0-9]$/.test(o.answer))) answer(btns[Number(e.key) - 1].dataset.k === item.key, btns[Number(e.key) - 1]); };
  }
  function finish() {
    keyFn = null;
    const knownSet = new Set(known.map((x) => x.key));
    const learn = learning.filter((x) => !knownSet.has(x.key));
    applyPlacement(known, learn);
    stage.classList.remove('glow-good', 'glow-bad');
    stage.innerHTML = `<div class="pl-done">
      <div class="pl-big" tabindex="-1"><b>${known.length}</b><span>signs marked known</span></div>
      ${passed.length ? `<p>You know: ${esc(passed.join(', '))}.</p>` : '<p>No part was all right, so Auto will start at the beginning. That’s the best place to start.</p>'}
      ${learn.length ? `<p class="muted">${learn.length} more you got right are marked as learning; Auto brings them back soon.</p>` : ''}
      <div class="row"><a class="btn primary" href="#/practice/read?cat=auto&set=all">Continue with Auto</a><button class="btn" id="plAgain" type="button">Start over</button></div></div>`;
    $('#plAgain').onclick = () => { gi = 0; total = 0; fails = 0; known.length = 0; learning.length = 0; passed.length = 0; intro(); };
    refocus(stage, $('.pl-big', stage));
    announce(`${known.length} signs marked known. ${passed.length ? 'You know ' + passed.join(', ') : ''}`);
  }
  let keyFn = null;
  const onKey = (e) => { if (e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey || !sheet.hidden || nativeKey(e)) return; if (keyFn) keyFn(e); };
  document.addEventListener('keydown', onKey);
  intro();
  return () => document.removeEventListener('keydown', onKey);
}
