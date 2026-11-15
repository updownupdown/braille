// Learn: lessons and reference sections, Grade 2 lessons and the end-of-lesson checks.
import { LETTERS, IND, UEB_PUNCT, CONTRACTIONS, cellsOf, fromDots, dotsLabel, translate, unicodeOf, LANGS } from './braille.js';
import { SCIENCE, SCIENCE_SYMBOLS, NEMETH, LANG_INFO, JAPANESE, SYSTEMS, HISTORY, SIGN_REGIONS } from './data.js';

import { LANG_CONTRACTIONS } from './langcontractions.js';
import { G2_EXAMPLES } from './g2examples.js';

import { $, $$, titleCase, DICT, P, announce, bindRadios, cellHTML, cellsHTML, crowHTML, dropdown, esc, exBlock, groupBlock, groupsHTML, icon, letterDetail, lineHTML, markMulti, openSheet, pick, practiseLink, radios, setSub, setTitle, shuffle, store, view, views } from './core.js';
import { SEC_DESC, SEC_ICON } from './home.js';
import { C, CATS } from './practice.js';
// ---------- signs ----------
export const SIGN_ICONS = {
  people: '<svg width="34" height="28" viewBox="0 0 30 24" fill="currentColor"><circle cx="8" cy="4.5" r="2.2"/><path d="M5.5 8h5l1 7h-2l-.4 7H7l-.4-7H4.5z"/><circle cx="22" cy="4.5" r="2.2"/><path d="M19.5 8h5l2.5 9h-3l-.3 5h-3l-.3-5h-3z"/></svg>',
  person: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="4.5" r="2.3"/><path d="M9 8h6l1 7h-2l-.5 7h-3L10 15H8z"/></svg>',
  exit: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4h5v16h-5"/><path d="M4 12h10m-4-4 4 4-4 4"/></svg>',
  stairs: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 20h5v-5h5v-5h5V5h3"/></svg>',
  elevator: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 3 4 9h8zM8 21l4-6H4z"/><rect x="14" y="3" width="7" height="18" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  info: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  fire: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/></svg>',
  door: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="3" width="12" height="18" rx="1"/><circle cx="15" cy="12" r=".8" fill="currentColor"/></svg>',
};
export function signIcon(w) {
  w = w.toLowerCase();
  if (/wash|toilet|restroom/.test(w)) return SIGN_ICONS.people;
  if (/^men|women|hommes|femmes/.test(w)) return SIGN_ICONS.person;
  if (/exit|sortie|way out/.test(w)) return SIGN_ICONS.exit;
  if (/stair|escalier/.test(w)) return SIGN_ICONS.stairs;
  if (/elev|lift|ascen|main floor/.test(w)) return SIGN_ICONS.elevator;
  if (/info|accueil/.test(w)) return SIGN_ICONS.info;
  if (/fire|alarm/.test(w)) return SIGN_ICONS.fire;
  if (/room|office|platform|salle|entr/.test(w)) return SIGN_ICONS.door;
  return '';
}
export function plateHTML(print, lang = 'en', grade = 2, extra = null, cls = '') {
  const tone = /exit|sortie|way out|fire/i.test(print) ? 'blue' : cls;
  return `<button class="plate ${tone}" aria-label="Sign: ${esc(print)}">
    <span class="pic">${signIcon(print)}</span>
    <span class="ptxt">${esc(print)}${extra ? `<br><span class="ptxt2">${esc(extra[0])}</span>` : ''}</span>
    ${lineHTML(translate(print, lang, grade))}
    ${extra ? lineHTML(translate(extra[0], extra[1], 1)) : ''}
  </button>`;
}
export const textList = (pairs) => `<div class="prose-list">${pairs.map(([t, p]) => `<h4>${esc(t)}</h4><p>${esc(p)}</p>`).join('')}</div>`;
export function kanaTable() {
  return JAPANESE.rows.map(([n, r]) => `<div class="group-title"><h3>${titleCase(n)}</h3></div><div class="ctable narrow">${r.map(([p, c]) => crowHTML(c, p, { kind: 'letter' })).join('')}</div>`).join('');
}
export function signsSection(regionKey) {
  const region = SIGN_REGIONS[regionKey] ? regionKey : (SIGN_REGIONS[store.get('signRegion')] ? store.get('signRegion') : 'ca');
  store.set('signRegion', region);
  const R = SIGN_REGIONS[region];
  const lang = R.signLang || 'en';
  const grade = R.signLang ? 1 : 2;
  const parts = [];
  if (region === 'jp') parts.push(['sg-kana', 'Kana braille', `<p class="lead-p">${esc(JAPANESE.blurb)}</p>${kanaTable()}`]);
  else parts.push(['sg-read', 'Read these signs', `<div class="sign-gallery">${R.signs.map((s) => plateHTML(s, lang, grade)).join('')}${(R.bilingual || []).map(([en, fr]) => plateHTML(en, 'en', 2, [fr, 'fr'])).join('')}</div>`]);
  parts.push(['sg-how', 'How it works here', textList(R.facts)]);
  if (R.room) parts.push(['sg-anatomy', 'Anatomy of a room sign', `<div class="anatomy">${plateHTML(R.room, lang, grade)}<ol>
      <li>Raised capitals or a pictogram you can feel.</li>
      <li>Braille directly <b>below</b>, starting at the left.</li>
      <li>A capital sign, then the word${grade === 2 ? ' — often contracted' : ''}.</li>
      <li>A number sign before the digits.</li>
      <li>Mounted on the handle side of the door, at about shoulder height.</li></ol></div>`]);
  if (R.elevator) parts.push(['sg-elevator', 'Elevator buttons', `<div class="elev-wrap"><div class="elevator">
      ${[['★', 'main'], ['3', '3'], ['2', '2'], ['1', '1'], ['◁▷', 'open'], ['▷◁', 'close'], ['bell', 'alarm']].map(([face, word]) => {
        const cs = unicodeOf(translate(word, 'en', 2)).replace(/ /g, '⠀');
        return `<span class="eb">${[...cs].map((c) => cellHTML(c)).join('')}</span><span class="ebtn">${face === 'bell' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zm-2 15a2 2 0 0 0 4 0z"/></svg>' : face}</span>`;
      }).join('')}
    </div><div class="elev-text">
      <p>Braille sits beside each button, usually on the left. Floors use the number sign: ${cellHTML(IND.number, 'sm')}${cellHTML(LETTERS.b, 'sm')} = 2.</p>
      <p>★ is the main floor, spelled <b>main</b>: ${cellsHTML(unicodeOf(translate('main', 'en', 2)), 'sm')} (m-a-<span class="acc">in</span>).</p>
      <p>“Open” is ${cellsHTML(unicodeOf(translate('open', 'en', 2)), 'sm')} (o-p-<span class="acc">en</span>); “alarm” uses <span class="acc">ar</span>: <span class="nw">${cellsHTML(unicodeOf(translate('alarm', 'en', 2)), 'sm')}.</span></p>
      <p class="muted small">Outside, the same numbers are on both sides of the door frame.</p></div></div>`]);
  if (R.money) parts.push(['sg-money', 'Feel your money', `<p>Canadian notes carry raised cell-shaped clusters in the top corner. Count them:</p><div class="money">${[5, 10, 20, 50, 100].map((v, i) => { const c = cellHTML(fromDots('123456'), 'sm'); return `<div class="note"><span>${v === 100 ? `${c}<i class="note-gap"></i>${c}` : c.repeat(i + 1)}</span><b>$${v}</b></div>`; }).join('')}</div><p class="muted small">The $100 note has two clusters with a wide smooth gap between them.</p>`]);
  if (R.tips) parts.push(['sg-tips', 'Field tips', textList(R.tips)]);
  return {
    jumps: parts.map(([id, t]) => ({ value: id, label: t })),
    html: `<div class="picker"><div id="regionDD"></div></div>
      ${region === 'jp' ? '' : `<p class="lead-p">Tap a sign to see what each cell means. ${esc(R.note || 'Shown in UEB Grade 2, the way new signs are made.')}</p>`}
      <div class="g2-groups">${parts.map(([id, t, h], i) => foldHTML(id, t, h, i === 0)).join('')}</div>`,
    bind: () => {
      dropdown($('#regionDD'), { label: 'Region', options: Object.entries(SIGN_REGIONS).map(([k, r]) => ({ value: k, label: r.name })), value: region, onChange: (v) => { location.hash = '#/reference/signs/' + v; } });
      $$('.plate').forEach((p) => p.addEventListener('click', () => p.classList.toggle('decoded')));
    },
  };
}
// ---------- grade 2: compact tables ----------
export const SHORT_SPELL = {
  about: 'ab', above: 'abv', according: 'ac', across: 'acr', after: 'af', afternoon: 'afn', afterward: 'afw', again: 'ag',
  against: 'ag-st', almost: 'alm', already: 'alr', also: 'al', although: 'al-th', altogether: 'alt', always: 'alw',
  because: 'be-c', before: 'be-f', behind: 'be-h', below: 'be-l', beneath: 'be-n', beside: 'be-s', between: 'be-t', beyond: 'be-y',
  blind: 'bl', braille: 'brl', children: 'ch-n', conceive: 'con-cv', conceiving: 'con-cvg', could: 'cd', deceive: 'dcv',
  deceiving: 'dcvg', declare: 'dcl', declaring: 'dclg', either: 'ei', first: 'f-st', friend: 'fr', good: 'gd', great: 'grt',
  herself: 'h-er-f', him: 'hm', himself: 'hmf', immediate: 'imm', its: 'xs', itself: 'xf', letter: 'lr', little: 'll',
  much: 'm-ch', must: 'm-st', myself: 'myf', necessary: 'nec', neither: 'nei', oneself: 'one-f', ourselves: 'ou-rvs',
  paid: 'pd', perceive: 'p-er-cv', perceiving: 'p-er-cvg', perhaps: 'p-er-h', quick: 'qk', receive: 'rcv', receiving: 'rcvg',
  rejoice: 'rjc', rejoicing: 'rjcg', said: 'sd', should: 'sh-d', such: 's-ch', themselves: 'the-mvs', thyself: 'th-yf',
  today: 'td', together: 'tgr', tomorrow: 'tm', tonight: 'tn', would: 'wd', your: 'yr', yourself: 'yrf', yourselves: 'yrvs',
};
export const G2_EXAMPLE = {
  ch: 'chip', gh: 'laugh', sh: 'shy', th: 'myth', wh: 'whip', ed: 'edit', er: 'verb', ou: 'loud', ow: 'owl', st: 'stop',
  ar: 'park', ing: 'sing', and: 'sand', for: 'form', of: 'often', the: 'other', with: 'without',
  ound: 'pound', ance: 'dance', sion: 'mansion', less: 'useless', ount: 'mount', ence: 'fence', ong: 'song', ful: 'joyful',
  tion: 'nation', ness: 'madness', ment: 'moment', ity: 'city',
};
export const G2_USE = { 'Alphabetic wordsigns': 'whole word', 'Strong contractions': 'word or part of one', 'Strong groupsigns': 'part of a word' };
export const G2_START = ['and', 'for', 'of', 'the', 'with', 'but', 'can', 'do', 'it', 'that', 'you', 'ing', 'st', 'sh', 'th', 'ch', 'er', 'ed'];
// Grade 2 is taught as a short basics lesson and then five lessons, each a few contraction groups with its own check.
export const G2_LESSONS = {
  g2words: ['Wordsigns', ['Alphabetic wordsigns', 'Strong wordsigns'], 'One cell for a whole word: a letter or a strong sign standing alone.'],
  g2strong: ['Strong Signs', ['Strong contractions', 'Strong groupsigns'], 'Signs that work anywhere: and, for, of, the, with, and letter groups like ch, sh and ing.'],
  g2lower: ['Lower Signs', ['Lower groupsigns', 'Lower wordsigns'], 'Cells that use only the lower four dots. Where they sit in a word decides what they mean.'],
  g2affix: ['Initial & Final Letters', ['Initial-letter contractions', 'Final-letter groupsigns'], 'Two-cell signs: a prefix cell plus a letter, at the start or end of a word.'],
  g2short: ['Shortforms', ['Shortforms'], 'Abbreviated spellings of 75 common words, such as ab for about and brl for braille.'],
};
export function grade2Section(key = 'grade2') {
  const lesson = G2_LESSONS[key];
  const cats = Object.entries(CONTRACTIONS).filter(([cat]) => !lesson || lesson[1].includes(cat));
  const catIndex = (cat) => Object.keys(CONTRACTIONS).indexOf(cat);
  // Examples for a sign: two right uses (green tick) and, where it helps, one place it doesn't apply (orange warning).
  const exOf = (e) => G2_EXAMPLES[e.print + '|' + e.cat] || G2_EXAMPLES[e.print];
  // be-, con- and dis- aren't produced by the translator, so those examples carry their braille; label the first cell with the prefix.
  const fixedParts = (t, uni, pre) => {
    const rest = t.slice(pre.length), cells = [...uni].slice(1), tr = translate(rest, 'en', 2);
    const same = tr.map((x) => x.cells).join('') === cells.join('');
    return [{ cells: [...uni][0], print: pre, kind: 'contraction' }, ...(same ? tr : [...rest].map((ch, i) => ({ cells: cells[i] || '', print: ch, kind: 'letter' })))];
  };
  const exHTML = (x, pre = '') => !x ? '' : [...x.ok.map((t, i) => [t, 'ok', '', x.okBraille && x.okBraille[i]]), ...(x.no ? [[x.no.text, 'no', x.no.note]] : [])].map(([t, k, n, uni]) => `<div class="g2ex ${k}"><span class="g2ex-mark" aria-label="${k === 'ok' ? 'Correct use' : 'Not this sign'}">${k === 'ok' ? icon('check', 16) : icon('warn', 16)}</span><span class="g2ex-b">${lineHTML(uni ? fixedParts(t, uni, pre) : translate(t, 'en', 2), { cls: 'sm' })}</span><span class="g2ex-t"><b>${esc(t)}</b>${n ? `<small>${esc(n)}</small>` : ''}</span></div>`).join('');
  // These three only ever follow other letters, so a pale hyphen goes in front.
  const PRE = { ound: '-', ance: '-', sion: '-' };
  const row = (e, i) => {
    const x = exOf(e);
    const note = e.cat === 'Shortforms' ? (SHORT_SPELL[e.print] || '') : (e.note || (!x && G2_EXAMPLE[e.print] ? 'e.g. ' + G2_EXAMPLE[e.print] : ''));
    return crowHTML(e.cells, e.print, { kind: 'contraction', note, pre: e.cat === 'Final-letter groupsigns' ? PRE[e.print] || '' : '', ex: exHTML(x, e.print) });
  };
  const practiseBtn = (href, t = 'Practise these') => `<div class="practise-row"><a class="btn practise-btn" href="${href}">${t} ${icon('right', 16)}</a></div>`;
  const sample = 'The children went to the park with their father.';
  const g1 = unicodeOf(translate(sample, 'en', 1)).replace(/ /g, '').length;
  const g2 = unicodeOf(translate(sample, 'en', 2)).replace(/ /g, '').length;
  // Word by word, so each Grade 2 word sits under its Grade 1 version and the saving shows as a gap.
  const sWords = sample.split(' ');
  const groupHTML = ([cat, { blurb }]) => `<div class="sg g2-sec" id="g2-${catIndex(cat)}"><div class="group-title"><h3>${esc(titleCase(cat))}<span class="count">${CONTRACTIONS[cat].items.length} signs</span></h3><span>${esc(blurb)}</span></div>
      <div class="ctable">${DICT.map((e, i) => [e, i]).filter(([e]) => e.group === cat).map(([e, i]) => row(e, i)).join('')}</div>${practiseBtn(`#/practice/read?cat=contractions&set=k${catIndex(cat)}`)}</div>`;
  const html = lesson ? `<p class="lead-p">${esc(lesson[2])}</p>${cats.map(groupHTML).join('')}` : `
    <p class="lead-p">Grade 2 uses about 180 contractions to make braille shorter. Most books and public signs in Canada use it. Many cells mean different things alone versus inside a word, so each table notes where a sign may go.</p>
    <div class="g2-compare"><div class="g2c-scroll"><div class="g2c-grid">
      <small class="g2c-k">Grade 1<span>${g1} cells</span></small><small class="g2c-k">Grade 2<span>${g2} cells</span></small>
      ${sWords.map((w) => `<div class="g2c-w">${lineHTML(translate(w, 'en', 1), { cls: 'sm' })}</div><div class="g2c-w">${lineHTML(translate(w, 'en', 2), { cls: 'sm' })}</div>`).join('')}
    </div></div></div>
    <div class="group-title"><h3>Start with These</h3><span>The most frequent signs. Learn a few at a time.</span></div>
    <div class="ctable narrow">${G2_START.map((w) => { const i = DICT.findIndex((e) => e.print === w && e.group !== 'Letters'); return crowHTML(DICT[i].cells, w, { kind: 'contraction', i, note: G2_USE[DICT[i].cat] || DICT[i].cat }); }).join('')}</div>${practiseBtn('#/practice/read?cat=contractions&set=start')}
    <div class="group-title"><h3>Five Lessons</h3><span>Each covers a few groups and ends with its own check.</span></div>
    <div class="hrows g-tiles g2-lessons">${Object.entries(G2_LESSONS).map(([k, [t, cs]]) => `<a class="hrow g-tile ${lessonsDone().includes(k) ? 'li-done' : ''}" href="#/reference/${k}"><span class="hrow-ic">${icon(lessonsDone().includes(k) ? 'check' : SEC_ICON[k], 24)}</span><div class="hrow-text"><b>${titleCase(t)}</b><span>${cs.reduce((n, c) => n + CONTRACTIONS[c].items.length, 0)} signs · ${cs.join(', ')}</span></div>${icon('right', 20)}</a>`).join('')}</div>
    ${exBlock([['the children', 'Two wordsigns: “the” and “children”.'], ['mother and father', 'Initial-letter contractions plus “and”.'], ['with you', '“with” and the wordsign for “you”.'], ['knowledge', 'One cell for a whole word.']], 2)}`;
  const bind = () => {
    // The comparison strip scrolls sideways on narrow screens: fade the right edge while there is more to see.
    const sc = $('.g2c-scroll');
    if (sc) { const f = () => sc.classList.toggle('more', sc.scrollLeft + sc.clientWidth < sc.scrollWidth - 4); sc.addEventListener('scroll', f, { passive: true }); f(); }
    if (!view.dataset.exBound) view.addEventListener('click', (e) => {
      const t = e.target.closest('.ex-tog'); if (!t) return;
      const p = $('.crow-ex', t.closest('.crow')); const open = p.hidden;
      p.hidden = !open; t.setAttribute('aria-expanded', String(open)); t.classList.toggle('open', open);
    });
    view.dataset.exBound = '1';
  };
  return { html, bind, jumps: lesson ? cats.map(([cat, { items }]) => ({ value: 'g2-' + catIndex(cat), label: cat, hint: items.length + ' signs' })) : null };
}
// ---------- reference ----------
export const REF_SECTIONS = [
  ['overview', 'Overview'], ['alphabet', 'Alphabet'], ['numbers', 'Numbers & Symbols'], ['grade2', 'Grade 2 Basics'], ...Object.entries(G2_LESSONS).map(([k, [t]]) => [k, t]), ['signs', 'Signs'],
  ['science', 'Maths & Science'], ['languages', 'Languages'], ['systems', 'World Systems'], ['cheatsheet', 'Cheat Sheet'],
];
export function alphabetSection() {
  const ROWS = [
    ['a–j', 'The foundation', 'abcdefghij', null, 'Only the top four dots are used. Learn these ten and the rest follow.', 'aj'],
    ['k–t', 'Add the lower-left dot', 'klmnopqrst', [3], 'The same shapes as a–j, with one more dot below on the left.', 'kt'],
    ['u–z', 'Add both bottom dots', 'uvxyz', [3, 6], 'The same shapes again, with both bottom dots.', 'uz'],
    ['w', 'The latecomer', 'w', [6], 'French had no w in 1824, so it was added later. It’s j plus the lower-right dot.', 'uz'],
  ];
  return `<p class="lead-p">The alphabet is ten shapes, repeated. Each new row adds dots (in blue) to the first.</p>
    <div id="alphaWrap">${ROWS.map(([range, title, letters, added, blurb, set]) => `
      <div class="decade"><div class="decade-head"><h3 class="range">${range}</h3>${letters.length > 1 ? practiseLink(`#/practice/read?cat=letters&set=${set}`) : ''}</div><p class="decade-p">${title}. ${blurb}</p>
      <div class="ctable narrow">${letters.split('').map((l) => crowHTML(LETTERS[l], l, { kind: 'letter', i: 'abcdefghijklmnopqrstuvwxyz'.indexOf(l), added })).join('')}</div></div>`).join('')}</div>
    ${exBlock([['hello', 'Letters are simply written one after another.'], ['braille', ''], ['jazz quiz', 'A space is an empty cell.']])}
    <p class="muted small">New to braille? Start with the <a href="#/reference/overview">Overview</a>. Mixing up d, f, h and j? Try <a href="#/practice/read?cat=letters&set=mirror">mirror pairs</a>.</p>
    <div class="row"><a class="btn primary" href="#/practice/read?cat=letters&set=az">Practise all letters</a><a class="btn" href="#/reference/cheatsheet">Cheat sheet</a></div>`;
}
export function overviewSection() {
  const parts = [
    ['ov-what', 'What braille is', `<p>Braille is a way of <b>writing</b> with raised dots that you read by touch. It isn’t a language: English, French, Japanese and many others each have their own braille. Blind and low-vision people use it to read books, labels, signs, music and maths, and to write with a braille device or a slate and stylus.</p>
      <p>Every symbol is made inside a small <b>cell</b> of six possible dots. Which dots are raised tells you what the cell means.</p>`],
    ['ov-cell', 'How a cell works', `<div class="cell-anatomy">${cellHTML(fromDots('123456'), 'numbered xl')}<div>
      <p>The six spots are numbered <b>1-2-3</b> down the left column and <b>4-5-6</b> down the right. Every braille symbol is described by its raised dots, so “dots 1-2” means the top two on the left.</p>
      <p>That gives 63 possible patterns plus the blank cell. A real cell is about 6 mm tall, small enough to feel all at once under one fingertip.</p></div></div>
      <div class="ctable narrow ov-rows">${['a', 'b', 'c', 'l'].map((l) => crowHTML(LETTERS[l], l, { kind: 'letter', note: dotsLabel(LETTERS[l]) })).join('')}</div>
      <p class="muted small">a is dot 1 alone. b adds dot 2 below it, c adds dot 4 beside it, and l is the whole left column. The <a href="#/reference/alphabet">alphabet</a> builds on these ten-letter patterns.</p>`],
    ['ov-context', 'One cell, several meanings', `<p>There are far more symbols than patterns, so context matters. ${cellHTML(LETTERS.b, 'sm')} is <b>b</b> on its own in a word, the word <b>“but”</b> when it stands alone in Grade 2, and the digit <b>2</b> after the number sign ${cellHTML(IND.number, 'sm')}. A capital sign ${cellHTML(IND.capital, 'sm')} makes the next letter uppercase.</p>
      <p>See <a href="#/reference/numbers">Numbers &amp; symbols</a> for these signs.</p>`],
    ['ov-grades', 'Grade 1 and Grade 2', `<p><b>Grade 1</b> spells every letter. <b>Grade 2</b> adds about 180 contractions, like ${cellHTML('⠮', 'sm')} for “the”, so text takes far less space. Most books and public signs in Canada use Grade 2. Learners usually start with Grade 1, then add contractions a few at a time.</p>
      <p>See <a href="#/reference/grade2">Grade 2 Basics</a> and its five lessons for every contraction.</p>`],
    ['ov-read', 'Reading and writing it', `<p>Readers glide the pads of their fingers lightly left to right along a line, often using both hands, rather than pressing on each cell. Experienced readers can reach speeds similar to reading print aloud. You can try the motion in <a href="#/practice/sweep">Practice › Read</a>.</p>
      <p>Braille is written on a <b>Perkins brailler</b> (a six-key machine from 1951), by hand with a <b>slate and stylus</b> (pressing dots from the back, so you write right to left), or electronically with a <b>refreshable braille display</b> that raises pins under each cell. You can build cells dot by dot in <a href="#/practice/write">Practice › Draw</a>.</p>`],
    ['ov-where', 'Where you’ll see it', `<p>Room and washroom signs, elevator buttons, medicine boxes (required in the EU), ATMs, transit handrails and many product labels. Canadian bank notes have braille-sized dots too, though they are a counting code rather than braille. See <a href="#/reference/signs">Signs</a> for examples by country, and <a href="#/reference/languages">Languages</a> and <a href="#/reference/systems">World systems</a> for braille beyond English.</p>`],
    ['ov-learn', 'Learning it as a sighted person', `<p>Most sighted learners start by reading braille <b>by sight</b>, which is what this site teaches. It’s a great way to understand signs, help a blind friend or family member, or begin training as a teacher or transcriber. Reading by touch takes much longer, because your fingertips need months of practice to tell the dots apart.</p>
      <p>A good order is: the letters a–j, then the rest of the <a href="#/reference/alphabet">alphabet</a>, then <a href="#/reference/numbers">numbers and capitals</a>, then the most common <a href="#/reference/grade2">Grade 2</a> contractions. Practise a little each day in <a href="#/practice/read">Guess</a> and <a href="#/practice/write">Draw</a>, then try real <a href="#/reference/signs">signs</a>.</p>`],
    ['ov-history', 'History', `<p>Louis Braille was born in 1809 in Coupvray, France, and lost his sight after an accident in his father’s workshop at age three. At the Royal Institute for Blind Youth in Paris he met Charles Barbier’s 12-dot “night writing”, a military code for reading in the dark. In 1824, at 15, he simplified it into the six-dot cell that fits under one fingertip. Braille died in 1852; France made his system official two years later.</p>
      <ol class="timeline">${HISTORY.map(([y, t]) => `<li><b>${y}</b>${esc(t)}</li>`).join('')}</ol>`],
  ];
  return {
    jumps: parts.map(([id, t]) => ({ value: id, label: t })),
    html: `<p class="lead-p">A primer for sighted learners: what braille is, how the six-dot cell works, and where it came from.</p>${parts.map(([id, t, h]) => `<div class="sg prose" id="${id}"><h3 class="sg-h">${titleCase(t)}</h3>${h}</div>`).join('')}
      <div class="row"><a class="btn primary" href="#/reference/alphabet">Learn the alphabet</a><a class="btn" href="#/practice/read">Start practising</a></div>`,
  };
}
// A long page's sections fold like the Grade 2 groups: the first starts open, Jump to opens the one it goes to.
export const foldHTML = (id, title, body, open = false, sub = '') => `<details class="g2-group fold" id="${id}"${open ? ' open' : ''}><summary><span class="g2-t"><h3>${title}</h3>${sub ? `<small>${esc(sub)}</small>` : ''}</span>${icon('chevron', 20)}</summary><div class="g2-body">${body}</div></details>`;
export function numbersSection() {
  const parts = [
    ['nu-num', 'Numbers', groupBlock('Numbers', 'Numbers', 'number sign ⠼ + a–j', '#/practice/read?cat=symbols&set=num') + exBlock([
      ['2025', 'One number sign covers every digit that follows.'],
      ['1 2 3', 'After a space, each number needs its own number sign.'],
    ])],
    ['nu-punct', 'Punctuation & symbols', groupBlock('Punctuation', 'Punctuation & symbols', '', '#/practice/read?cat=symbols&set=punct') + exBlock([
      ['yes!', 'Punctuation follows the word, just like print.'],
      ['e-mail', 'A hyphen joins the two parts.'],
      ['3.5', 'The decimal point keeps the number going.'],
      ['1,000', 'So does a comma inside a number.'],
      ['$20', 'Symbols like $ come before the number sign.'],
      ['50%', 'Percent is a two-cell symbol after the digits.'],
    ])],
    ['nu-ind', 'Indicators', groupBlock('Indicators', 'Indicators', '', '#/practice/read?cat=symbols&set=ind') + exBlock([
      ['Canada', 'One capital sign before the letter.'],
      ['CANADA', 'Two capital signs make the whole word uppercase.'],
      ['Hi!', 'Capitals and punctuation together.'],
      ['Room 2b', 'A grade 1 indicator stops “b” being read as a second 2.'],
      ['Room 2B', 'A capital B needs no grade 1 indicator: the capital sign already ends the number.'],
    ])],
  ];
  return {
    jumps: parts.map(([value, label]) => ({ value, label })),
    html: `<p class="lead-p">Numbers, punctuation and the indicators that change how the next cells are read.</p><div class="g2-groups">${parts.map(([id, t, h], i) => foldHTML(id, t, h, i === 0)).join('')}</div>`,
  };
}
// Printable cheat sheets: Grade 1 on one page (letters laid out by decade), Grade 2 over a few pages.
export function cheatSection() {
  const item = (cells, label, kind, cls = '') => `<div class="cs-i ${cls}${cells.length > 1 ? ' wide' : ''}"><span class="cs-c">${[...cells].map((c) => cellHTML(c, '', { kind })).join('')}</span><b>${esc(label)}</b></div>`;
  const blank = '<div class="cs-i cs-blank" aria-hidden="true"></div>';
  const block = (title, body, cls = '', note = '') => `<section class="cs-block ${cls}"><h3>${title}${note ? `<span>${note}</span>` : ''}</h3><div class="cs-grid">${body}</div></section>`;
  const L = (str) => [...str].map((l) => item(LETTERS[l], l, 'letter')).join('');
  const P = (ch, label) => item(UEB_PUNCT[ch][0], label || ch, 'punct');
  const grade1 = () => `<h2 class="cs-title">Braille Cheat Sheet · Grade 1 <small>Unified English Braille</small></h2>
    ${block('Letters', `${L('abcdefghij')}${L('klmnopqrst')}${L('uvxyz')}${blank.repeat(4)}${L('w')}`, 'cs-decades', 'each row adds dots to the one above')}
    ${block('Numbers', '1234567890'.split('').map((d) => item(LETTERS['jabcdefghi'[Number(d)]], d, 'digit')).join(''), 'cs-decades', `put ${cellHTML(IND.number, 'cs-inline', { kind: 'digit' })} before a number: 1–0 are a–j`)}
    ${block('Signs', [item(IND.capital, 'capital', 'indicator'), item(IND.capital + IND.capital, 'all caps', 'indicator'), item(IND.number, 'number', 'digit'), P('.'), P(','), P('?'), P('!'), P('’', '’'), P('-'), P(':'), P(';'), P('“'), P('”'), P('('), P(')'), P('/')].join(''), 'cs-decades')}
    <p class="cs-foot">learn braille · updownupdown.github.io/braille</p>`;
  const grade2 = () => `<h2 class="cs-title">Braille Cheat Sheet · Grade 2 <small>Unified English Braille contractions</small></h2>
    ${Object.entries(CONTRACTIONS).map(([cat, { blurb }]) => block(esc(cat), DICT.filter((e) => e.group === cat).map((e) => item(e.cells, e.print, 'contraction', e.cells.length > 1 ? 'wide' : '')).join(''), 'cs-g2', esc(blurb))).join('')}
    <p class="cs-foot">learn braille · updownupdown.github.io/braille</p>`;
  let g = store.get('csGrade', '1');
  return { html: `<div class="cs-head"><p class="lead-p">Print it, or save it as a PDF. Grade 1 fits on one page; Grade 2 takes a few.</p><div class="row">${radios('csg', [['1', 'Grade 1'], ['2', 'Grade 2']], g)}<button class="btn primary" id="csPrint">${icon('print', 18)} Print</button></div></div>
    <div class="cheatsheet" id="cheatsheet"></div>`, bind: () => {
    const render = () => { $('#cheatsheet').innerHTML = g === '2' ? grade2() : grade1(); $('#cheatsheet').dataset.grade = g; };
    render();
    bindRadios($('.cs-head'), (k, v) => { g = v; store.set('csGrade', v); render(); });
    $('#csPrint').onclick = () => window.print();
  } };
}
// Extra charts for World systems that aren't full translators. Cells are dot strings; a space joins multi-cell signs.
export const D = (s) => s.split(' ').map(fromDots).join('');
export const grp = (pairs, kind = '') => pairs.map(([dots, label]) => dots === '_' ? '_' : `${D(dots)}:${label}`).join(' ');
export const MUSIC_NOTES = [['C', '145'], ['D', '15'], ['E', '124'], ['F', '1245'], ['G', '125'], ['A', '24'], ['B', '245']];
export const withDots = (d, add) => [...new Set([...d, ...add])].sort().join('');
export const EXTRA_CHARTS = {
  ebae: { name: 'EBAE', kind: 'contraction',
    blurb: 'Letters, numbers and most contractions are the same as UEB. These signs were dropped when Canada and the US moved to UEB in 2010–2016, but you will still find them on older signs and books.',
    examples: [['by the way', grp([['356', 'by'], ['2346', 'the'], ['_'], ['2456', 'w'], ['1', 'a'], ['13456', 'y']])], ['table', grp([['2345', 't'], ['1', 'a'], ['3456', 'ble']])], ['nation', grp([['1345', 'n'], ['6 1345', 'ation']])]],
    groups: [['Signs dropped in UEB', [['3456', 'ble'], ['36', 'com'], ['256', 'dd'], ['356', 'by'], ['235', 'to'], ['35 235', 'into'], ['6 1345', 'ation'], ['6 13456', 'ally'], ['135 3 14', 'o’clock']]]] },
  nemeth: { name: 'Nemeth Code', kind: 'math',
    blurb: 'Nemeth writes digits in the lower part of the cell, so a number never looks like a letter. The numeric indicator comes before a number that starts a line or follows a space.',
    examples: NEMETH.map((s) => [s.print, s.g]),
    groups: [['Digits', [['2', '1'], ['23', '2'], ['25', '3'], ['256', '4'], ['26', '5'], ['235', '6'], ['2356', '7'], ['236', '8'], ['35', '9'], ['356', '0']]],
      ['Signs', [['3456', 'numeric indicator'], ['346', 'plus'], ['36', 'minus'], ['4 16', 'times'], ['46 34', 'divided by'], ['46 13', 'equals'], ['46', 'decimal point']]]] },
  ar: { name: 'Arabic braille', kind: 'letter',
    blurb: 'Read left to right, even though print Arabic runs right to left. A letter has one cell whatever its position in the word, and many share cells with Latin sound-alikes (ب = b, د = d, ف = f).',
    examples: [['سلام · peace', grp([['234', 'س'], ['123', 'ل'], ['1', 'ا'], ['134', 'م']])], ['كتاب · book', grp([['13', 'ك'], ['2345', 'ت'], ['1', 'ا'], ['12', 'ب']])]],
    groups: [['Letters', [['1', 'ا'], ['12', 'ب'], ['2345', 'ت'], ['1456', 'ث'], ['245', 'ج'], ['156', 'ح'], ['1346', 'خ'], ['145', 'د'], ['2346', 'ذ'], ['1235', 'ر'], ['1356', 'ز'], ['234', 'س'], ['146', 'ش'], ['12346', 'ص'], ['1246', 'ض'], ['23456', 'ط'], ['123456', 'ظ'], ['12356', 'ع'], ['126', 'غ'], ['124', 'ف'], ['12345', 'ق'], ['13', 'ك'], ['123', 'ل'], ['134', 'م'], ['1345', 'ن'], ['125', 'ه'], ['2456', 'و'], ['24', 'ي']]]] },
  music: { name: 'Music braille', kind: 'contraction',
    blurb: 'Each note is one cell. The top four dots give the pitch (using the shapes of d to j), and dots 3 and 6 give the length. Octave, rests and dynamics have signs of their own.',
    examples: [['Twinkle, twinkle', grp([['1456', 'C'], ['1456', 'C'], ['1256', 'G'], ['1256', 'G'], ['246', 'A'], ['246', 'A'], ['1235', 'G']])], ['A scale in eighth notes', grp(MUSIC_NOTES.map(([n, d]) => [d, n]))]],
    groups: [['Eighth Notes', MUSIC_NOTES.map(([n, d]) => [d, n])], ['Quarter Notes (Add the Lower-Right Dot)', MUSIC_NOTES.map(([n, d]) => [withDots(d, '6'), n])],
      ['Half Notes (Add the Lower-Left Dot)', MUSIC_NOTES.map(([n, d]) => [withDots(d, '3'), n])], ['Whole Notes (Add Both Bottom Dots)', MUSIC_NOTES.map(([n, d]) => [withDots(d, '36'), n])]] },
};
export const exTiles = (items) => `<div class="group-title"><h3>Examples</h3></div><div class="example-grid">${items.join('')}</div>`;
// Full character table for a language, shown in a modal from World systems or Languages (with examples first in the modal).
export function charsTable(k, { examples = false } = {}) {
  const X = EXTRA_CHARTS[k];
  if (X) return `<p class="muted">${esc(X.blurb)}</p>${exTiles(X.examples.map(([p, g]) => `<div class="example"><div class="print">${esc(p)}</div>${groupsHTML(g, 'sm', X.kind)}</div>`))}
    ${X.groups.map(([t, items]) => `<div class="group-title"><h3>${esc(titleCase(t))}</h3></div><div class="ctable narrow">${items.map(([d, l]) => crowHTML(D(d), l, { kind: X.kind })).join('')}</div>`).join('')}`;
  if (k === 'ja') {
    const kana = Object.fromEntries(JAPANESE.rows.flatMap(([, r]) => r));
    const words = [['さくら · sakura', ['sa', 'ku', 'ra']], ['ねこ · neko', ['ne', 'ko']], ['すし · sushi', ['su', 'shi']], ['やま · yama', ['ya', 'ma']], ['ひかり · hikari', ['hi', 'ka', 'ri']]];
    return `<p class="muted">${esc(JAPANESE.blurb)}</p>${examples ? exTiles(words.map(([p, sy]) => `<div class="example"><div class="print">${esc(p)}</div>${groupsHTML(sy.map((x) => `${kana[x]}:${x}`).join(' '), 'sm', 'letter')}</div>`)) : ''}${kanaTable()}`;
  }
  const info = LANG_INFO[k];
  // Other languages show only what differs from English: a letter is left out when it has the same cell as the English letter.
  const cellOf = (x) => unicodeOf(translate(x, k, 1));
  const enCell = (x) => unicodeOf(translate(x, 'en', 1));
  const letters = k === 'en' ? [...info.letters] : [...info.letters].filter((l) => !/[a-z]/.test(l) || cellOf(l) !== enCell(l));
  const sameLetters = k !== 'en' && letters.length < [...info.letters].length;
  const digits = '1234567890'.split('');
  const sameDigits = k !== 'en' && digits.every((d) => cellOf(d) === enCell(d));
  const C = LANG_CONTRACTIONS[k];
  return `<p class="muted">${esc(info.blurb)}</p>${examples ? exTiles(info.phrases.map((p) => `<div class="example"><div class="print">${esc(p)}</div>${lineHTML(translate(p, k, k === 'en' ? 2 : 1), { cls: 'sm' })}</div>`)) : ''}
    <div class="group-title"><h3>${sameLetters ? 'Letters That Differ From English' : 'Letters'}</h3>${sameLetters ? '<span>The rest of a–z are the same as in English.</span>' : ''}</div>
    ${letters.length ? `<div class="ctable narrow">${letters.map((l) => crowHTML(cellOf(l), l, { kind: 'letter' })).join('')}</div>` : ''}
    ${info.digraphs ? `<div class="group-title"><h3>Vowel Pairs</h3><span>Each pair is written as one cell.</span></div><div class="ctable narrow">${info.digraphs.map(([pr, d]) => crowHTML(cellsOf(d), pr, { kind: 'letter' })).join('')}</div>` : ''}
    ${sameDigits ? '<p class="muted small">Digits are written the same way as in English: the number sign, then a–j.</p>' : `<div class="group-title"><h3>Digits</h3></div>
    <div class="ctable narrow">${digits.map((d) => crowHTML(cellOf(d), d, { kind: 'digit' })).join('')}</div>`}
    ${C ? `<div class="group-title"><h3>${esc(titleCase(C.name))}</h3><span>${esc(C.blurb)}</span></div>${C.groups.map(([t, items]) => `<h4 class="ex-h">${esc(t)}</h4><div class="ctable narrow">${items.map(([pr, d, n]) => crowHTML(cellsOf(d), pr, { kind: 'contraction', note: n || '' })).join('')}</div>`).join('')}` : ''}`;
}
export const LANG_NAMES = () => ({ ...Object.fromEntries(Object.keys(LANG_INFO).map((k) => [k, k === 'en' ? 'English (UEB)' : LANGS[k].name])), ja: '日本語 Japanese' });
export const CHART_NAMES = () => ({ ...LANG_NAMES(), ...Object.fromEntries(Object.entries(EXTRA_CHARTS).map(([k, x]) => [k, x.name])) });
export function languagesSection() {
  return { html: '<div class="picker"><div id="langDD"></div></div><div id="langBody"></div>', bind: () => {
    const render = (k) => {
      store.set('refLang', k);
      const body = $('#langBody');
      if (k === 'ja') { body.innerHTML = charsTable('ja'); markMulti(body); return; }
      const info = LANG_INFO[k];
      body.innerHTML = `${charsTable(k)}
        <div class="group-title"><h3>Phrases</h3><span>${k === 'en' ? 'Grade 2' : 'uncontracted'}</span></div>
        <div class="example-grid">${info.phrases.map((p) => `<a class="example" href="#/translate?lang=${k}&text=${encodeURIComponent(p)}"><div class="print">${esc(p)}</div>${lineHTML(translate(p, k, k === 'en' ? 2 : 1), { cls: 'sm' })}</a>`).join('')}</div>`;
      markMulti(body);
    };
    const v = store.get('refLang', 'en');
    dropdown($('#langDD'), { label: 'Language', options: Object.entries(LANG_NAMES()).map(([value, label]) => ({ value, label })), value: v, onChange: render });
    render(v);
  } };
}
export function systemsSection() {
  return { html: `<p class="lead-p">The braille family: the codes you’re likely to meet, plus special-purpose and tactile cousins. Tap a row to expand it; many include a full chart.</p>
    ${SYSTEMS.map((g) => `<div class="group-title"><h3>${esc(titleCase(g.group))}</h3></div><div class="acc-list">${g.items.map(([n, w, d, chars]) => `
      <details class="acc-item"><summary><span><b>${esc(titleCase(n))}</b><small>${esc(w)}</small></span>${icon('chevron', 20)}</summary>
      <div class="acc-body"><p>${esc(d)}</p>${chars ? `<button class="btn small-btn" data-chars="${chars}">See all characters ${icon('right', 16)}</button>` : ''}</div></details>`).join('')}</div>`).join('')}`,
    bind: () => { $$('[data-chars]').forEach((b) => { b.onclick = () => openSheet(charsTable(b.dataset.chars, { examples: true }), { title: CHART_NAMES()[b.dataset.chars] }); }); },
  };
}
export function scienceSection() {
  const ex = (s) => `<div class="example"><div class="print">${esc(s.print)}</div>${groupsHTML(s.g)}</div>`;
  const parts = [
    ['sc-sym', 'Symbols', `<p class="lead-p">UEB uses extra signs and indicators for technical material. These are the ones used in the examples below.</p><div class="ctable narrow">${SCIENCE_SYMBOLS.map(([c, n]) => crowHTML(c, n, { kind: 'math' })).join('')}</div>`],
    ['sc-ueb', 'UEB examples', `<p class="muted small">Each group of cells is labelled. In Grade 2 text a grade 1 indicator ⠰ often goes before superscript ⠔ and subscript ⠢ so they aren’t read as “in” and “en”; these examples are in Grade 1 mode.</p><div class="example-grid">${SCIENCE.map(ex).join('')}</div>`],
    ['sc-nem', 'Nemeth Code', `<p class="muted small">Still used for maths in many Canadian and US schools.</p><div class="example-grid">${NEMETH.map(ex).join('')}</div>`],
  ];
  return {
    jumps: parts.map(([value, label]) => ({ value, label })),
    html: parts.map(([id, t, h]) => `<div class="sg" id="${id}"><h3 class="sg-h">${titleCase(t)}</h3>${h}</div>`).join(''),
  };
}
export function refSection(key, sub) {
  switch (key) {
    case 'alphabet': return { html: alphabetSection() };
    case 'numbers': return numbersSection();
    case 'grade2': return grade2Section();
    case 'g2words': case 'g2strong': case 'g2lower': case 'g2affix': case 'g2short': return grade2Section(key);
    case 'signs': return signsSection(sub);
    case 'science': return scienceSection();
    case 'languages': return languagesSection();
    case 'systems': return systemsSection();
    case 'overview': return overviewSection();
    case 'cheatsheet': return cheatSection();
  }
  return { html: '' };
}
// ---------- Learn: lessons, reference and the end-of-lesson check ----------
// The first four sections are lessons (read in order, each ends with a short check); the rest is look-up material.
export const LESSONS = ['overview', 'alphabet', 'numbers', 'grade2', ...Object.keys(G2_LESSONS)];
export const isLesson = (k) => LESSONS.includes(k);
export const lessonsDone = () => store.get('learnDone', []).filter(isLesson);
export const QUIZ_LEN = 5, QUIZ_PASS = 4;
export const OVERVIEW_QUIZ = [
  { q: 'How many dots can one braille cell have?', a: '6', x: ['4', '8', '12'] },
  { q: 'Which dots run down the left side of a cell?', a: '1-2-3', x: ['4-5-6', '1-4', '2-5'] },
  { q: 'Braille is…', a: 'a way of writing', x: ['a language', 'a typeface', 'a sign language'] },
  { q: 'What does Grade 2 add?', a: 'Contractions', x: ['Capital letters', 'Numbers', 'Punctuation'] },
  { q: 'Which dot is raised here?', cells: LETTERS.a, a: 'dot 1', x: ['dot 2', 'dot 4', 'dot 6'] },
  { q: 'This cell can be b, “but” or 2. What decides?', cells: LETTERS.b, a: 'The cells around it', x: ['How big the dots are', 'Which line it is on', 'How hard it is pressed'] },
  { q: 'Who invented braille?', a: 'Louis Braille', x: ['Charles Barbier', 'Helen Keller', 'Valentin Haüy'] },
];
export function quizQuestions(key) {
  const pick = (arr, n) => shuffle(arr).slice(0, n);
  const fromItems = (items, n) => pick(items, n).map((it) => ({
    cells: it.cells, answer: it.answer,
    choices: shuffle([it, ...pick(items.filter((x) => x.cells !== it.cells && x.answer !== it.answer), 3)]).map((x) => ({ t: x.answer, small: x.label })),
  }));
  if (key === 'overview') return pick(OVERVIEW_QUIZ, QUIZ_LEN).map((o) => ({ q: o.q, cells: o.cells, answer: o.a, choices: shuffle([o.a, ...o.x]).map((t) => ({ t })) }));
  if (key === 'alphabet') return fromItems(CATS.letters.sets.az[1](), QUIZ_LEN);
  if (key === 'numbers') return shuffle([...fromItems(CATS.symbols.sets.num[1](), 2), ...fromItems(CATS.symbols.sets.punct[1](), 2), ...fromItems(CATS.symbols.sets.ind[1](), 1)]);
  if (G2_LESSONS[key]) return fromItems(G2_LESSONS[key][1].flatMap((c) => C(c)()), QUIZ_LEN);
  return fromItems(CATS.contractions.sets.start[1](), QUIZ_LEN);
}
export const quizHTML = (key) => `<div class="sg lq-wrap" id="check"><div class="group-title"><h3>Test Yourself${lessonsDone().includes(key) ? '<span class="count lq-done">Done</span>' : ''}</h3><span>${QUIZ_LEN} quick questions. Get ${QUIZ_PASS} right to complete this lesson.</span></div><div class="card lq" id="lq"></div></div>`;
export function bindQuiz(key) {
  const box = $('#lq'); if (!box) return;
  let qs, n, right, first;
  const start = () => { qs = quizQuestions(key); n = 0; right = 0; show(); };
  const pips = () => `<div class="lq-pips" aria-label="Question ${Math.min(n + 1, QUIZ_LEN)} of ${QUIZ_LEN}">${qs.map((_, i) => `<i class="${i < n ? 'past' : i === n ? 'now' : ''}"></i>`).join('')}</div>`;
  function show() {
    box.classList.remove('glow-good', 'glow-bad');
    const Q = qs[n]; first = true;
    const long = Q.choices.some((c) => c.t.length > 2 || c.small);
    box.innerHTML = `${pips()}${Q.q ? `<p class="lq-q">${esc(Q.q)}</p>` : ''}${Q.cells ? `<div class="prompt-cells">${[...Q.cells].map((c) => cellHTML(c)).join('')}</div>` : ''}
      <div class="choices ${long ? 'words' : ''}">${Q.choices.map((c) => `<button class="choice" data-t="${esc(c.t)}">${esc(c.t)}${c.small ? `<small>${esc(c.small)}</small>` : ''}</button>`).join('')}</div>`;
  }
  function finish() {
    const pass = right >= QUIZ_PASS;
    if (pass) { const d = store.get('learnDone', []); if (!d.includes(key)) store.set('learnDone', [...d, key]); }
    const i = REF_SECTIONS.findIndex(([k]) => k === key), nx = REF_SECTIONS[i + 1];
    box.classList.remove('glow-good', 'glow-bad');
    box.innerHTML = `<div class="lq-score ${pass ? 'pass' : ''}">${pass ? icon('check', 30) : ''}<b>${right} of ${QUIZ_LEN}</b></div>
      <p class="lq-q">${pass ? 'Lesson complete.' : `Get ${QUIZ_PASS} right to complete this lesson.`}</p>
      <div class="row lq-row">${pass && nx ? `<a class="btn primary" href="#/reference/${nx[0]}">Next: ${nx[1]}</a>` : ''}<button class="btn ${pass ? '' : 'primary'}" id="lqAgain">Try again</button></div>`;
    if (pass) { const h = $('#check h3'); if (h && !$('.lq-done', h)) h.insertAdjacentHTML('beforeend', '<span class="count lq-done">Done</span>'); }
    $('#lqAgain').onclick = start;
  }
  box.onclick = (e) => {
    const b = e.target.closest('.choice');
    if (!b || b.classList.contains('right') || b.classList.contains('wrong') || $('.choice.right', box)) return;
    const ok = b.dataset.t === qs[n].answer;
    if (ok && first) right++;
    first = false;
    box.classList.remove('glow-good', 'glow-bad'); void box.offsetWidth;
    box.classList.add(ok ? 'glow-good' : 'glow-bad');
    announce(ok ? 'Correct' : 'Not quite');
    b.classList.add(ok ? 'right' : 'wrong');
    if (!ok && $$('.choice.wrong', box).length >= 2) { const r = $$('.choice', box).find((x) => x.dataset.t === qs[n].answer); if (r) r.classList.add('reveal'); }
    if (ok) setTimeout(() => { if (!box.isConnected) return; n++; if (n < QUIZ_LEN) show(); else finish(); }, 650);
  };
  start();
}
// Learn landing page: the lessons in order with progress, then the reference sections.
export function learnIndex() {
  setTitle('Learn'); setSub('');
  const done = lessonsDone();
  const row = (k, t, n) => `<a class="hrow g-tile ${done.includes(k) ? 'li-done' : ''}" href="#/reference/${k}"><span class="hrow-ic">${icon(done.includes(k) ? 'check' : SEC_ICON[k], 24)}</span><div class="hrow-text"><b>${n ? `${n}. ` : ''}${titleCase(t)}</b><span>${done.includes(k) ? 'Done · ' : ''}${SEC_DESC[k]}</span></div>${icon('right', 18)}</a>`;
  const les = REF_SECTIONS.filter(([k]) => isLesson(k)), ref = REF_SECTIONS.filter(([k]) => !isLesson(k));
  view.innerHTML = `<h2 class="sec-h li-h">Lessons</h2>
    <p class="lead-p li-p">${les.length} short lessons, from the six-dot cell to every contraction. Each one ends with a quick check.</p>
    <div class="hprog li-prog"><span class="bar"><i style="width:${Math.round(done.length / les.length * 100)}%"></i></span><span>${done.length} of ${les.length} done</span></div>
    <div class="hrows g-tiles">${les.map(([k, t], i) => row(k, t, i + 1)).join('')}</div>
    <h2 class="sec-h">Reference</h2>
    <p class="lead-p li-p">Look things up when you need them.</p>
    <div class="hrows g-tiles">${ref.map(([k, t]) => row(k, t)).join('')}</div>`;
}
views.reference = (q, sub, sub2) => {
  if (!REF_SECTIONS.find(([k]) => k === sub)) return learnIndex();
  const key = sub;
  store.set('refSec', key);
  { const seen = store.get('learnSeen', []); if (!seen.includes(key)) store.set('learnSeen', [...seen, key]); }
  const i = REF_SECTIONS.findIndex(([k]) => k === key);
  const sec = refSection(key, sub2);
  const lesson = isLesson(key);
  if (lesson) sec.jumps = [...(sec.jumps || []), { value: 'check', label: 'Test Yourself' }];
  setTitle('Learn');
  setSub(`<a class="back-link ref-back" href="#/reference" aria-label="All Learn sections">${icon('right', 18)}</a><div id="secDD" class="dd-strong"></div>${sec.jumps ? '<div id="jumpDD" class="dd-right"></div>' : ''}`);
  dropdown($('#secDD'), { lead: 'book', options: REF_SECTIONS.map(([k, t]) => ({ value: k, label: t, group: isLesson(k) ? 'Lessons' : 'Reference' })), value: key, onChange: (v) => { location.hash = '#/reference/' + v; } });
  if (sec.jumps) dropdown($('#jumpDD'), { label: 'Jump to', options: sec.jumps, value: null, onChange: (v) => { const el = document.getElementById(v); if (!el) return; if (el.tagName === 'DETAILS') el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  view.innerHTML = `${sec.html}${lesson ? quizHTML(key) : ''}
      <div class="pager">${i > 0 ? `<a class="btn" href="#/reference/${REF_SECTIONS[i - 1][0]}"><span class="pg-dir">${icon('right', 18)}</span><span><small>Previous</small>${REF_SECTIONS[i - 1][1]}</span></a>` : '<span></span>'}${i < REF_SECTIONS.length - 1 ? `<a class="btn next" href="#/reference/${REF_SECTIONS[i + 1][0]}"><span><small>Next</small>${REF_SECTIONS[i + 1][1]}</span>${icon('right', 18)}</a>` : ''}</div>`;
  if (sec.bind) sec.bind();
  if (lesson) bindQuiz(key);
  markMulti(view);
  view.onclick = (ev) => {
    const l = ev.target.closest('.letter[data-l]'); if (l) openSheet(letterDetail(l.dataset.l), { title: 'Letter ' + l.dataset.l });
  };
  return () => { view.onclick = null; };
};
