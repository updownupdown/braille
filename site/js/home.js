// Home page and the Stats modal.
import { LETTERS } from './braille.js';

import { GAMES, gameStore } from './games.js';

import { AUTO_GAP, CATS, MODES } from './practice.js';
import { $, titleCase, openSheet, cellHTML, crowHTML, icon, level, markMulti, mastery, setSub, setTitle, store, view, views } from './core.js';
import { LESSONS, REF_SECTIONS, isLesson, lessonsDone } from './learn.js';
import { checkMilestones, milestoneLine, milestonesHTML } from './milestones.js';
// 0 untried · 1–3 blues · 4+ known (green)

// ---------- home ----------
export const PROG_GROUPS = () => [
  ['Letters', CATS.letters.sets.az[1](), 'letters', 'az'], ['Numbers', CATS.symbols.sets.num[1](), 'symbols', 'num'],
  ['Punctuation', CATS.symbols.sets.punct[1](), 'symbols', 'punct'], ['Maths & money', CATS.symbols.sets.signs[1](), 'symbols', 'signs'],
  ['Indicators', CATS.symbols.sets.ind[1](), 'symbols', 'ind'], ['Contractions', CATS.contractions.sets.all[1](), 'contractions', 'all'],
];
// Answers per day (first tries only), kept for the stats page's calendar and streak.
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function logDay() { const d = store.get('days', {}), k = dayKey(); d[k] = (d[k] || 0) + 1; store.set('days', d); checkMilestones(); }
export function dayStreak(days) {
  let n = 0; const d = new Date();
  if (!days[dayKey(d)]) d.setDate(d.getDate() - 1); // today not practised yet: the streak still counts up to yesterday
  while (days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
// Stats modal: what is known per group in Guess and Draw, the last 12 weeks of practice, Auto's boxes and the most-missed signs.
// Opened from Home's Stats section, the Known line in Practice, or #/practice/stats; any [data-stats] link opens it.
export function openStats() { openSheet(statsHTML(), { title: 'Stats' }); }
export function statsHTML() {
  const m = mastery(), misses = store.get('misses', {}), days = store.get('days', {});
  const groups = PROG_GROUPS();
  const count = (pre, items) => { let k = 0, l = 0; items.forEach((x) => { const v = level(m[pre + x.key] || 0); if (v >= 4) k++; else if (v > 0) l++; }); return [k, l]; };
  const bar = (pre, items, cat, set, mode) => { const [k, l] = count(pre, items), n = items.length; return `<a class="st-bar" href="#/practice/${mode}?cat=${cat}&set=${set}" aria-label="${k} known, ${l} learning of ${n}"><span class="st-track"><i class="k" style="width:${(k / n) * 100}%"></i><i class="l" style="width:${(l / n) * 100}%"></i></span><span class="st-n"><b>${k}</b>/${n}</span></a>`; };
  const rows = groups.map(([n, items, cat, set]) => `<tr><th scope="row">${n}</th><td>${bar('r:', items, cat, set, 'read')}</td><td>${bar('w:', items, cat, set, 'write')}</td></tr>`).join('');
  // 12 weeks, Monday first, today last.
  const today = new Date(); const start = new Date(today); start.setDate(start.getDate() - 83 - ((today.getDay() + 6) % 7));
  const cellsCal = []; const max = Math.max(1, ...Object.values(days));
  for (const d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) { const v = days[dayKey(d)] || 0; cellsCal.push(`<i class="${v ? 'on' : ''}" style="${v ? `--a:${(0.35 + 0.65 * v / max).toFixed(2)}` : ''}" title="${dayKey(d)}: ${v} answers"></i>`); }
  const daysPractised = Object.keys(days).length, streak = dayStreak(days);
  const all = Object.values(store.get('auto', {})).reduce((acc, st) => { Object.values(st.s || {}).forEach(([b]) => { acc[b] = (acc[b] || 0) + 1; }); return acc; }, {});
  const autoBoxes = AUTO_GAP.map((_, b) => all[b] || 0);
  const BOX = ['New', 'Box 2', 'Box 3', 'Box 4', 'Box 5', 'Box 6', 'Long term'];
  const DICT_BY_KEY = Object.fromEntries(Object.entries(CATS).filter(([k]) => k !== 'auto').flatMap(([, c]) => Object.values(c.sets)).flatMap(([, f]) => { try { return f('r:'); } catch { return []; } }).map((x) => [x.key, x]));
  const missed = Object.entries(misses).map(([k, n]) => [k.slice(2), k[0], n]).filter(([k]) => DICT_BY_KEY[k]).sort((a, b) => b[2] - a[2]).slice(0, 12);
  return `<div class="st-page">
    <div class="st-top">
      <div><b>${streak}</b><span>day streak</span></div>
      <div><b>${daysPractised}</b><span>days practised</span></div>
      <div><b>${Object.values(days).reduce((a, b) => a + b, 0)}</b><span>answers</span></div>
    </div>
    <h2 class="sec-h">Last 12 Weeks</h2>
    <div class="st-cal" aria-label="Practice calendar, darker means more answers">${cellsCal.join('')}</div>
    <h2 class="sec-h">Milestones</h2>
    ${milestonesHTML()}
    <h2 class="sec-h">Known Signs</h2>
    <p class="muted small st-key"><span class="k"></span> known <span class="l"></span> learning. Tap a bar to practise that group.</p>
    <table class="st-table"><thead><tr><th></th><th>Guess</th><th>Draw</th></tr></thead><tbody>${rows}</tbody></table>
    <h2 class="sec-h">Auto</h2>
    <p class="muted small">Signs move up a box each time you get them right and wait longer before coming back (from Box 4, whole days); a miss sends one back to the start.</p>
    <div class="st-boxes">${autoBoxes.map((n, b) => `<div><b>${n}</b><span>${BOX[b]}</span></div>`).join('')}</div>
    <h2 class="sec-h">Most Missed</h2>
    ${missed.length ? `<div class="ctable narrow">${missed.map(([k, pre, n]) => crowHTML(DICT_BY_KEY[k].cells, DICT_BY_KEY[k].answer, { note: `${n} miss${n > 1 ? 'es' : ''} in ${pre === 'w' ? 'Draw' : 'Guess'}` })).join('')}</div>
      <div class="row st-row"><a class="btn primary" href="#/practice/read?cat=auto&set=all">Practise with Auto</a></div>` : '<p class="muted">Nothing missed yet.</p>'}
  </div>`;
}
// Home: each main section in tab order, with "continue" (if visited), a suggestion based on progress, and a carousel of the rest.
export const SEC_ICON = { overview: 'info', alphabet: 'alpha', numbers: 'hash', grade2: 'layers', g2words: 'words', g2strong: 'layers', g2lower: 'layers', g2affix: 'layers', g2short: 'edit', signs: 'sign', science: 'sigma', languages: 'globe', systems: 'map', cheatsheet: 'print' };
export const SEC_DESC = { overview: 'How a cell works · 2 min', alphabet: 'a–z in three simple rows', numbers: 'Digits, capitals, punctuation', grade2: 'Why contract, and where to start', g2words: 'Whole words in one cell', g2strong: 'and, for, the, ch, ing…', g2lower: 'The lower-dot signs', g2affix: 'Two-cell word parts', g2short: '75 common words', signs: 'Real-world signage', science: 'Equations and Nemeth', languages: 'Six other languages', systems: 'Braille around the world', cheatsheet: 'Print a one-page sheet' };
export const GAME_ORDER = ['memory', 'wordle', 'mirror', 'rain', 'snowman', 'anagrams', 'time', 'maze', 'signhunt', 'chunt', 'proof', 'agent', 'trivia', 'riddles'];
views[''] = () => {
  setTitle('Home'); setSub('');
  const m = mastery(), misses = store.get('misses', {});
  const seen = store.get('learnSeen', []);
  const pVisited = store.get('pvisited', false);
  const ren = (k) => (k === 'hangman' ? 'snowman' : k);
  const played = gameStore.get('played', []).map(ren).filter((k) => GAMES[k]);
  const lastGame = GAMES[ren(gameStore.get('last', null))] ? ren(gameStore.get('last', null)) : played[played.length - 1] || null;
  const isNew = !seen.length && !pVisited && !played.length;
  const card = (href, k, t, d, go = false) => `<a class="hcard ${go ? 'go' : ''}" href="${href}"><span class="k">${k}</span><b>${t}</b><span class="d">${d}</span></a>`;
  const head = (ic, t, href, prog) => `<div class="hsec-h"><h2 class="sec-h">${icon(ic, 26)} ${titleCase(t)}</h2><a href="${href}">See all</a></div>${prog ? `<div class="hprog"><span>${prog[1]}</span></div>` : ''}`;

  // Learn
  const secs = REF_SECTIONS.filter(([k]) => k !== 'cheatsheet');
  const secName = (k) => REF_SECTIONS.find(([x]) => x === k)[1];
  const lastSec = store.get('refSec', null);
  const doneL = lessonsDone();
  // Up next: the first unfinished section after the one being read, wrapping round to earlier ones.
  const li = Math.max(0, secs.findIndex(([k]) => k === lastSec));
  const nextSec = [...secs.slice(li + 1), ...secs.slice(0, li)].find(([k]) => (isLesson(k) ? !doneL.includes(k) : !seen.includes(k)));
  let lA, lB;
  if (!seen.length) { lA = card('#/reference/overview', 'Start here', 'Overview', SEC_DESC.overview, true); lB = card('#/reference/alphabet', 'Then', 'Alphabet', 'a–j first'); }
  else {
    lA = card(`#/reference/${lastSec}`, 'Continue', secName(lastSec), SEC_DESC[lastSec]);
    lB = nextSec ? card(`#/reference/${nextSec[0]}`, 'Up next', nextSec[1], SEC_DESC[nextSec[0]], true) : card('#/reference/cheatsheet', 'All done', 'Cheat Sheet', SEC_DESC.cheatsheet, true);
  }
  const learn = `${head('book', 'Learn', '#/reference', seen.length ? [doneL.length / LESSONS.length, `${doneL.length} of ${LESSONS.length} lessons done`] : null)}
    <div class="hsplit">${lA}${lB}</div>`;

  // Practice
  const az = 'abcdefghijklmnopqrstuvwxyz';
  const knownL = [...az].filter((l) => (m['r:' + l] || 0) >= 4).length;
  const pmode = store.get('pmode', 'read'), psel = store.get('psel', { cat: 'letters', set: 'aj' });
  const pset = CATS[psel.cat] && CATS[psel.cat].sets[psel.set];
  const missTop = Object.entries(misses).filter(([k]) => /^[rw]:[a-z]$/.test(k)).sort((x, y) => y[1] - x[1]).map(([k]) => k[2]).filter((l, i, a) => a.indexOf(l) === i && (m['r:' + l] || 0) < 4).slice(0, 5);
  const nextSet = [['aj', 'abcdefghij'], ['kt', 'klmnopqrst'], ['uz', 'uvwxyz']].find(([, ls]) => [...ls].some((l) => (m['r:' + l] || 0) < 4));
  let pA, pB;
  if (!pVisited) { pA = card('#/practice/read?cat=auto&set=g1', 'Get started', 'Auto', 'One new sign at a time, brought back as you learn', true); pB = card('#/practice/write?cat=letters&set=aj', 'Or', 'Draw a–j', 'Tap the dots'); }
  else {
    const label = pmode === 'sweep' ? 'Read' : `${MODES[pmode]} · ${psel.cat === 'auto' ? (psel.set === 'all' ? 'Auto' : `Auto ${pset ? pset[0] : ''}`) : pset ? pset[0] : 'a–j'}`;
    const items = pmode !== 'sweep' && pset ? pset[1](pmode === 'write' ? 'w:' : 'r:') : [];
    const pre = pmode === 'write' ? 'w:' : 'r:';
    pA = card(pmode === 'sweep' ? '#/practice/sweep' : `#/practice/${pmode}?cat=${psel.cat}&set=${psel.set}`, 'Continue', label, items.length ? `${items.filter((x) => (m[pre + x.key] || 0) >= 4).length} of ${items.length} known` : 'Pick up where you left off');
    pB = missTop.length ? card('#/practice/read?cat=auto&set=all', 'Needs work', missTop.join(', '), 'Auto brings them back', true)
      : nextSet ? card(`#/practice/read?cat=letters&set=${nextSet[0]}`, 'Up next', `Guess ${CATS.letters.sets[nextSet[0]][0]}`, 'Learn the next letters', true)
      : card('#/practice/read?cat=contractions&set=k0', 'Up next', 'Grade 2', 'Start the contractions', true);
  }
  const practice = `${head('practice', 'Practice', '#/practice', pVisited ? [knownL / 26, `${knownL} of 26 letters`] : null)}
    <div class="hsplit">${pA}${pB}</div>`;

  // Games
  const nextGame = GAME_ORDER.find((k) => !played.includes(k) && k !== lastGame) || GAME_ORDER.find((k) => k !== lastGame);
  let gA, gB;
  if (!played.length) { gA = card('#/games/memory', 'Easy first', 'Memory', 'Pair cells and letters', true); gB = card('#/games/wordle', 'Or', 'Braidle', 'With letters shown'); }
  else { gA = card(`#/games/${lastGame}`, 'Resume', GAMES[lastGame].name, GAMES[lastGame].desc); gB = card(`#/games/${nextGame}`, 'Try next', GAMES[nextGame].name, GAMES[nextGame].desc, true); }
  const games = `${head('games', 'Games', '#/games', played.length ? [played.length / GAME_ORDER.length, `${played.length} of ${GAME_ORDER.length} played`] : null)}
    <div class="hsplit">${gA}${gB}</div>`;

  view.innerHTML = `
    <div class="home-head">
      <div class="home-brand" role="heading" aria-level="1" aria-label="Learn Braille">${$('.brand').innerHTML}</div>
    </div>
    ${isNew ? '' : milestoneLine()}
    ${isNew ? `<div class="hnew">${cellHTML(LETTERS.a, 'md')}${cellHTML(LETTERS.b, 'md')}<div><b>New here?</b><span>Start with Learn, then practise, then play.</span></div></div>` : ''}
    <section class="hsec">${learn}</section>
    <section class="hsec">${practice}</section>
    <section class="hsec">${games}</section>
    ${isNew ? '' : `<section class="hsec hsec-stats">${homeStats(knownL, doneL.length, played.length)}</section>`}`;
};
// Home's Stats section: a few progress bars and the streak; See all opens the full Stats modal.
function homeStats(knownL, lessons, games) {
  const m = mastery(), days = store.get('days', {});
  const g2 = CATS.contractions.sets.all[1]('r:');
  const g2k = g2.filter((x) => level(m['r:' + x.key] || 0) >= 4).length, g2l = g2.filter((x) => { const v = level(m['r:' + x.key] || 0); return v > 0 && v < 4; }).length;
  const azl = [...'abcdefghijklmnopqrstuvwxyz'].filter((l) => { const v = level(m['r:' + l] || 0); return v > 0 && v < 4; }).length;
  const bar = (label, k, n, l = 0, href = '') => `<${href ? `a href="${href}"` : 'div'} class="hs-row"><span class="hs-l">${label}</span><span class="st-track"><i class="k" style="width:${(k / n) * 100}%"></i><i class="l" style="width:${(l / n) * 100}%"></i></span><span class="hs-n"><b>${k}</b> / ${n}</span></${href ? 'a' : 'div'}>`;
  const streak = dayStreak(days), practised = Object.keys(days).length;
  return `<div class="hsec-h"><h2 class="sec-h">${icon('stats', 26)} Stats</h2><a href="#/practice/stats" data-stats>See all</a></div>
    <div class="h-stats">
      <div class="hs-top"><div><b>${streak}</b><span>day streak</span></div><div><b>${practised}</b><span>days practised</span></div><div><b>${Object.values(days).reduce((a, b) => a + b, 0)}</b><span>answers</span></div></div>
      ${bar('Letters', knownL, 26, azl, '#/practice/read?cat=letters&set=az')}
      ${bar('Grade 2 signs', g2k, g2.length, g2l, '#/practice/read?cat=contractions&set=all')}
      ${bar('Lessons', lessons, LESSONS.length, 0, '#/reference')}
      ${bar('Games played', games, GAME_ORDER.length, 0, '#/games')}
      <p class="muted small st-key"><span class="k"></span> known or done <span class="l"></span> learning</p>
    </div>`;
}
