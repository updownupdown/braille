// App entry: the Games page wrapper, global search, Title Case, the on-screen keyboard fit and the router.
// The view modules register themselves on `views` when loaded.
import { openStats } from './home.js';
import './practice.js';
import './learn.js';
import './translate.js';
import { toDots, translate, unicodeOf, LANGS } from './braille.js';
import { SCIENCE_SYMBOLS, LANG_INFO, SYSTEMS, HISTORY, SIGN_REGIONS } from './data.js';
import { GAMES, GAME_GROUPS, gameStore } from './games.js';

import { announce } from './a11y.js';
import { $, $$, titleCase, DICT, SEC_OF_GROUP, applySettings, bindRadios, cellsHTML, cellsK, closeDD, closeSheet, dropdown, esc, helpBtn, icon, letterDetail, lineHTML, openSettings, openSheet, radios, setSub, setTitle, store, symbolDetail, syncHeadH, view, views } from './core.js';
import { G2_LESSONS, LANG_NAMES, REF_SECTIONS, charsTable } from './learn.js';
import { MODES } from './practice.js';
// ---------- games ----------
views.games = (q, sub) => {
  const g = GAMES[sub];
  if (!g) {
    setTitle('Games'); setSub('');
    // Same card as the Learn index: icon, name and line, then a chevron.
    const row = (k) => { const x = GAMES[k]; return `<a class="hrow g-tile" href="#/games/${k}"><span class="hrow-ic gc-${k}">${icon(x.icon, 24)}</span><div class="hrow-text"><b>${titleCase(x.name)}</b><span>${x.desc}</span></div>${icon('right', 20)}</a>`; };
    view.innerHTML = `<p class="lead-p g-intro">Play with braille. Each game has its own difficulty levels, and your best scores are saved on this device.</p>
      ${GAME_GROUPS.map(([t, ks]) => `<h2 class="sec-h">${titleCase(t)}</h2><div class="hrows g-tiles">${ks.map(row).join('')}</div>`).join('')}`;
    return;
  }
  setTitle(g.name);
  gameStore.set('last', sub);
  { const pl = gameStore.get('played', []); if (!pl.includes(sub)) gameStore.set('played', [...pl, sub]); }
  helpBtn.hidden = false;
  helpBtn.onclick = () => openSheet(`<div class="help">${g.help.map((t) => `<p>${esc(t)}</p>`).join('')}</div>`, { title: g.name });
  let lvl = gameStore.get('lvl.' + sub, g.levels ? g.levels[0][0] : null);
  if (g.levels && !g.levels.some(([k]) => k === lvl)) lvl = g.levels[0][0];
  // Trivia and Riddles keep their level in the page, next to the question count and score.
  const top = g.levels && !g.inline;
  setSub(`<div class="g-sub"><a class="back-link" href="#/games">${icon('right', 18)} Games</a><div class="g-slot" id="gSlot"></div>${top ? `<div class="picker">${radios('lvl', g.levels, lvl)}</div>` : ''}</div>`);
  view.innerHTML = `<div class="game-wrap game-${sub}">${g.levels && !top ? `<div class="picker g-lvrow">${radios('lvl', g.levels, lvl)}<div class="g-stat-slot" id="gStat"></div></div>` : ''}<div class="game" id="game"></div></div>`;
  const ctx = { dropdown, slot: $('#gSlot'), statSlot: $('#gStat') };
  const gameEl = $('#game');
  // Stats and buttons share one row at the bottom, to save height.
  const arrange = () => {
    const st = $(':scope > .g-stats', gameEl), ac = $(':scope > .g-actions', gameEl);
    if (!st && !ac) return;
    const foot = document.createElement('div'); foot.className = 'g-foot';
    if (st) foot.append(st); if (ac) foot.append(ac);
    gameEl.append(foot);
  };
  const mo = new MutationObserver(arrange); mo.observe(gameEl, { childList: true });
  const lvlClass = () => { gameEl.className = `game lv-${lvl}`; };
  lvlClass();
  let stop = g.run(gameEl, lvl, ctx); arrange();
  // Display-only toggles (With letters / Braille only) keep the current puzzle.
  if (g.levels) bindRadios(top ? $('.g-sub .picker') : $('.picker', view), (k, v) => { lvl = v; gameStore.set('lvl.' + sub, v); lvlClass(); if (g.display) return; if (stop) stop(); stop = g.run(gameEl, lvl, ctx); });
  return () => { mo.disconnect(); if (stop) stop(); };
};
// ---------- global search ----------
export let INDEX = null;
export function buildIndex() {
  const out = [];
  const nav = (h) => () => { closeSearch(); location.hash = h; };
  DICT.forEach((e, i) => out.push({
    title: e.print, sub: e.group === 'Letters' ? 'Letter' : e.cat + (e.note && e.note.length < 40 ? ' · ' + e.note : ''), cells: e.cells, kind: e.kind,
    sec: SEC_OF_GROUP[e.group] || (Object.entries(G2_LESSONS).find(([, [, cs]]) => cs.includes(e.group)) || ['grade2'])[0], dict: e,
    act: () => openSheet(e.group === 'Letters' ? letterDetail(e.print) : symbolDetail(e), { title: e.group === 'Letters' ? 'Letter ' + e.print : 'Symbol' }),
  }));
  REF_SECTIONS.forEach(([k, t]) => out.push({ title: t, sub: 'Learn section', sec: k, page: true, act: nav('#/reference/' + k) }));
  Object.entries(MODES).forEach(([k, t]) => out.push({ title: t, sub: 'Practice mode', sec: 'practice', page: true, act: nav('#/practice/' + k) }));
  out.push({ title: 'Placement Check', sub: 'Practice · already know some braille? Find where to start', sec: 'practice', page: true, act: nav('#/practice/place') });
  Object.entries(GAMES).forEach(([k, g]) => out.push({ title: g.name, sub: 'Game · ' + g.desc, sec: 'games', page: true, act: nav('#/games/' + k) }));
  SCIENCE_SYMBOLS.forEach(([c, n]) => out.push({ title: n, sub: 'Maths & science symbol', cells: c, kind: 'math', sec: 'science', act: nav('#/reference/science') }));
  for (const k of ['fr', 'es', 'de', 'ru', 'el']) {
    for (const l of LANG_INFO[k].letters) {
      if (/[a-z]/.test(l)) continue;
      out.push({ title: l, sub: LANGS[k].name + ' letter', cells: translate(l, k, 1)[0].cells, kind: 'letter', sec: 'languages', act: () => openSheet(charsTable(k, { examples: true }), { title: LANG_NAMES()[k] }) });
    }
  }
  for (const [rk, r] of Object.entries(SIGN_REGIONS)) for (const w of r.signs) out.push({ title: w, sub: 'Sign · ' + r.name, cells: unicodeOf(translate(w, r.signLang || 'en', r.signLang ? 1 : 2)), sec: 'signs', act: nav('#/reference/signs/' + rk) });
  for (const g of SYSTEMS) for (const [n, w] of g.items) out.push({ title: n, sub: 'World system · ' + w, sec: 'systems', act: nav('#/reference/systems') });
  for (const [y, t] of HISTORY) out.push({ title: String(y), sub: t, sec: 'overview', act: nav('#/reference/overview') });
  return out;
}
export const curSec = () => (document.body.dataset.page === 'reference' ? store.get('refSec', 'overview') : document.body.dataset.page);
export function searchResults(raw) {
  INDEX = INDEX || buildIndex();
  const s = raw.trim().toLowerCase();
  const isDots = /^[1-6][1-6\s-]*$/.test(s), isBraille = /^[⠀-⣿]+$/.test(raw.trim());
  const here = curSec();
  const scored = [];
  for (const e of INDEX) {
    let sc = 0;
    const t = e.title.toLowerCase();
    if (isDots) { if (e.cells && [...e.cells].map((c) => toDots(c).join('')).join(' ').includes(s.replace(/-/g, ''))) sc = 50; }
    else if (isBraille) { if (e.cells && e.cells.includes(raw.trim())) sc = e.cells === raw.trim() ? 100 : 50; }
    else if (t === s) sc = 100; else if (t.startsWith(s)) sc = 60; else if (s.length > 1 && t.includes(s)) sc = 35; else if (s.length > 2 && e.sub.toLowerCase().includes(s)) sc = 12;
    if (!sc) continue;
    if (e.sec === here) sc += 25;
    if (e.page) sc += 5;
    scored.push([sc, e]);
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, 60).map(([, e]) => e);
}
export const searchBar = $('#searchBar'), searchPanel = $('#searchPanel');
export function openSearch() {
  searchBar.hidden = false; syncHeadH();
  const q = $('#gq'); q.focus(); if (q.value) renderSearch();
}
export function closeSearch() { searchBar.hidden = true; searchPanel.hidden = true; $('#gq').value = ''; syncHeadH(); $('#searchBtn').blur(); }
export let RESULTS = [];
export function renderSearch() {
  const raw = $('#gq').value;
  if (!raw.trim()) { searchPanel.hidden = true; return; }
  RESULTS = searchResults(raw);
  const secName = Object.fromEntries([...REF_SECTIONS, ['practice', 'Practice'], ['games', 'Games']]);
  const tr = /[a-z]/i.test(raw) && !/^[1-6\s-]+$/.test(raw) ? `<a class="sr tr" href="#/translate?lang=en&text=${encodeURIComponent(raw)}"><span class="sr-cells">${lineHTML(translate(raw, 'en', 2), { labels: false, cls: 'sm' })}</span><span class="sr-text"><b>Translate “${esc(raw)}”</b><small>English Grade 2</small></span></a>` : '';
  searchPanel.innerHTML = `<div class="sp-inner">${RESULTS.length ? `<div class="sr-list">${RESULTS.map((e, i) => `<button class="sr${e.cells && [...e.cells].length > 3 ? ' long' : ''}" data-r="${i}"><span class="sr-cells">${e.cells ? ([...e.cells].length > 3 ? cellsHTML(e.cells, 'sm') : cellsK(e.cells, e.kind || '', 'sm')) : icon(e.page ? 'book' : 'right', 18)}</span><span class="sr-text"><b>${esc(e.title)}</b><small>${esc(e.sub.length > 90 ? e.sub.slice(0, 88) + '…' : e.sub)}</small></span><span class="sr-sec">${esc(secName[e.sec] || '')}</span></button>`).join('')}</div>` : '<p class="muted">Nothing matches. Try a word or a symbol.</p>'}${tr}</div>`;
  searchPanel.hidden = false;
  const st = $('#srStatus'); if (st) st.textContent = RESULTS.length ? `${RESULTS.length} result${RESULTS.length > 1 ? 's' : ''}` : 'Nothing matches';
}
$('#gq').addEventListener('input', renderSearch);
$('#gq').addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearch(); if (e.key === 'Enter') { const b = $('.sr', searchPanel); if (b) b.click(); } });
$('#searchClose').onclick = closeSearch;
searchPanel.addEventListener('click', (e) => {
  const b = e.target.closest('[data-r]'); if (b) { const r = RESULTS[Number(b.dataset.r)]; r.act(); return; }
  if (e.target.closest('a.sr')) { closeSearch(); return; }
  if (e.target === searchPanel) closeSearch();
});
$('#searchBtn').onclick = () => (searchBar.hidden ? openSearch() : closeSearch());
// ---------- on-screen keyboard: size content to the visible area ----------
// On Android the page itself resizes with the keyboard, so the viewport alone can't tell; on a touch screen,
// a focused text field means the keyboard is up.
{
  const touch = matchMedia('(pointer: coarse)').matches;
  const typing = () => { const a = document.activeElement; return !!a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && !/^(checkbox|radio|button|submit|range|color|file)$/.test(a.type))); };
  const vv = window.visualViewport;
  const onVV = () => {
    if (vv) document.documentElement.style.setProperty('--vvh', vv.height + 'px');
    document.body.classList.toggle('kb-open', (touch && typing()) || (!!vv && vv.height < window.innerHeight * 0.78));
  };
  if (vv) vv.addEventListener('resize', onVV);
  document.addEventListener('focusin', onVV); document.addEventListener('focusout', () => setTimeout(onVV, 50));
  onVV();
}
// Any [data-stats] link opens the Stats modal in place.
document.addEventListener('click', (e) => { if (e.target.closest('[data-stats]')) { e.preventDefault(); openStats(); } });
// ---------- router ----------
export let cleanup = null;
export const TITLES = { '': 'Learn Braille', practice: 'Practice · Learn Braille', reference: 'Learn · Learn Braille', translate: 'Translate · Learn Braille', games: 'Games · Learn Braille' };
let routed = false;
export function route() {
  // Where keyboard focus was, so it can be put back somewhere sensible once the new page is drawn.
  const was = document.activeElement, wasHref = was && was.getAttribute && was.getAttribute('href');
  const fromNav = !!(was && was.closest && was.closest('.tabbar, .nav'));
  const raw = location.hash.replace(/^#\/?/, '');
  let [path, qs] = raw.split('?');
  path = path || '';
  if (path === 'sweep') path = 'practice/sweep';
  if (path === 'games/hangman') { location.replace('#/games/snowman'); return; }
  if (path.startsWith('signs')) path = 'reference/' + path;
  const [name, sub, sub2] = path.split('/');
  const q = new URLSearchParams(qs || '');
  const key = views[name] ? name : '';
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  closeSheet(); closeDD(); if (!searchBar.hidden) closeSearch();
  helpBtn.hidden = true;
  document.body.dataset.page = key || 'home';
  const r = views[key](q, sub, sub2);
  cleanup = typeof r === 'function' ? r : null;
  $$('[data-route]').forEach((a) => { const on = a.dataset.route === key; a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  window.scrollTo(0, 0);
  document.title = TITLES[key];
  // Screen readers: say which page this is, and move focus into it when the old focus is gone or was a main tab.
  if (routed) {
    const same = wasHref && !(was && was.isConnected) ? $$('#subbar [href]').find((x) => x.getAttribute('href') === wasHref) : null;
    if (same) same.focus({ preventScroll: true });
    else if (fromNav || !(was && was.isConnected) || was === document.body) view.focus({ preventScroll: true });
    announce($('#headTitle').textContent.trim() || 'Learn Braille');
  }
  routed = true;
}
$('#skipLink').onclick = () => { view.focus(); };
window.addEventListener('hashchange', route);
window.addEventListener('scroll', () => $('.top').classList.toggle('scrolled', scrollY > 4), { passive: true });
$$('[data-icon]').forEach((el) => { el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)); });
$('#settingsBtn').onclick = openSettings;
window.addEventListener('resize', syncHeadH);
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
// "Updated" bar: each deploy stamps version.json; when it changes while the app is open, offer a reload.
export let loadedVersion = null;
export async function checkVersion() {
  try {
    const r = await fetch('version.json', { cache: 'no-store' }); if (!r.ok) return;
    const { v } = await r.json();
    if (loadedVersion == null) { loadedVersion = v; return; }
    if (v !== loadedVersion && !$('#updBar')) {
      document.body.insertAdjacentHTML('beforeend', `<div class="upd-bar" id="updBar" role="status"><span>Updated</span><button class="btn" type="button">Reload</button></div>`);
      $('#updBar button').onclick = () => location.reload();
    }
  } catch {}
}
checkVersion();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkVersion(); });
setInterval(checkVersion, 30 * 60 * 1000);
applySettings();
route();
