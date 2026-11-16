// Milestones: real points on the way to reading braille, noted once with the day they were first seen.
// Home shows a quiet line for a milestone from the last three days; Stats lists them all and the next one up.
// Saved as `miles` ({ id: 'YYYY-MM-DD' }). The first time this runs, anything already reached is stored as
// 'earlier' so it doesn't show up on Home as new.
import { store, mastery, level } from './core.js';
import { CATS, autoList } from './practice.js';
import { lessonsDone, LESSONS } from './learn.js';
import { gameStore } from './storage.js';
import { dayKey, dayStreak } from './home.js';
import { GAME_ORDER } from './home.js';

const known = (m, items) => items.filter((x) => level(m['r:' + x.key] || 0) >= 4).length;
// [id, text, progress(ctx) -> [have, need]]
export const MILESTONES = [
  ['aj', 'You can read a to j', (c) => [known(c.m, CATS.letters.sets.aj[1]()), 10]],
  ['az', 'You can read all 26 letters', (c) => [known(c.m, CATS.letters.sets.az[1]()), 26]],
  ['num', 'You can read every digit', (c) => [known(c.m, CATS.symbols.sets.num[1]()), 10]],
  ['g1', 'You know every Grade 1 sign', (c) => { const l = autoList('g1'); return [known(c.m, l), l.length]; }],
  ['g2start', 'You know the 18 starter signs of Grade 2', (c) => [known(c.m, CATS.contractions.sets.start[1]()), CATS.contractions.sets.start[1]().length]],
  ['g2half', 'You know half of the Grade 2 signs', (c) => { const l = autoList('g2'); return [known(c.m, l), Math.ceil(l.length / 2)]; }],
  ['g2all', 'You know every Grade 2 sign', (c) => { const l = autoList('g2'); return [known(c.m, l), l.length]; }],
  ['lesson1', 'First lesson done', (c) => [c.lessons.length, 1]],
  ['g1lessons', 'Grade 1 lessons done', (c) => [['overview', 'alphabet', 'numbers'].filter((k) => c.lessons.includes(k)).length, 3]],
  ['lessons', 'Every lesson done', (c) => [c.lessons.length, LESSONS.length]],
  ['ans100', '100 answers', (c) => [c.answers, 100]],
  ['ans1000', '1,000 answers', (c) => [c.answers, 1000]],
  ['streak7', 'Practised 7 days in a row', (c) => [c.streak, 7]],
  ['streak30', 'Practised 30 days in a row', (c) => [c.streak, 30]],
  ['read10', 'Reading 10 words a minute', (c) => [c.read, 10]],
  ['read20', 'Reading 20 words a minute', (c) => [c.read, 20]],
  ['read40', 'Reading 40 words a minute', (c) => [c.read, 40]],
  ['write5', 'Writing 5 words a minute', (c) => [c.write, 5]],
  ['write10', 'Writing 10 words a minute', (c) => [c.write, 10]],
  ['games', 'Played every game', (c) => [c.games, GAME_ORDER.length]],
];
function context() {
  const days = store.get('days', {});
  return {
    m: mastery(), lessons: lessonsDone(), days,
    answers: Object.values(days).reduce((a, b) => a + b, 0), streak: dayStreak(days),
    read: Math.max(store.get('swBest1', 0), store.get('swBest2', 0)),
    write: Math.max(...['cwBest1', 'cwBest2', 'cwBest1k', 'cwBest2k'].map((k) => store.get(k, 0))),
    games: GAME_ORDER.filter((k) => gameStore.get('played', []).includes(k)).length,
  };
}
// Note any milestone reached since the last check. Returns the whole record.
export function checkMilestones() {
  const first = store.get('miles', null) == null, rec = store.get('miles', {}) || {};
  let changed = first;
  let c = null;
  for (const [id, , prog] of MILESTONES) {
    if (rec[id]) continue;
    c = c || context();
    const [have, need] = prog(c);
    if (have >= need) { rec[id] = first ? 'earlier' : dayKey(); changed = true; }
  }
  if (changed) store.set('miles', rec);
  return rec;
}
const ago = (d) => {
  if (d === 'earlier') return '';
  const t = new Date(), y = new Date(); y.setDate(t.getDate() - 1);
  return d === dayKey(t) ? 'today' : d === dayKey(y) ? 'yesterday' : new Date(d + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
// Home: the newest milestone from the last three days, as one quiet line (empty when there isn't one).
// On the same day, the one listed first wins: knowing signs comes before lessons, which come before counts.
export function milestoneLine() {
  const rec = checkMilestones(), since = new Date(); since.setDate(since.getDate() - 2);
  const recent = MILESTONES.filter(([id]) => rec[id] && rec[id] !== 'earlier' && rec[id] >= dayKey(since)).sort((a, b) => (rec[b[0]] > rec[a[0]] ? 1 : rec[b[0]] < rec[a[0]] ? -1 : MILESTONES.indexOf(a) - MILESTONES.indexOf(b)));
  if (!recent.length) return '';
  const [id, text] = recent[0], more = recent.length - 1;
  return `<a class="h-mile" href="#/practice/stats" data-stats><span class="h-mile-dot" aria-hidden="true"></span><span><b>${text}</b> · ${ago(rec[id])}${more ? ` · ${more} more` : ''}</span></a>`;
}
// Stats: every milestone reached, newest first, then the next two not yet reached with how far along they are.
export function milestonesHTML() {
  const rec = checkMilestones(), c = context();
  const when = (id) => (rec[id] === 'earlier' ? '0' : rec[id]); // dated ones newest first, then those from before milestones existed
  const got = MILESTONES.filter(([id]) => rec[id]).sort((a, b) => when(b[0]).localeCompare(when(a[0])));
  const next = MILESTONES.filter(([id]) => !rec[id]).map(([id, text, prog]) => { const [have, need] = prog(c); return [id, text, Math.min(have, need), need]; })
    .sort((a, b) => b[2] / b[3] - a[2] / a[3]).slice(0, 2);
  const row = (text, note, done) => `<li class="${done ? 'done' : ''}"><span class="ms-mark" aria-hidden="true"></span><span class="ms-t">${text}</span><span class="ms-n">${note}</span></li>`;
  return `<ul class="ms-list">${got.map(([id, text]) => row(text, ago(rec[id]) || 'earlier', true)).join('')}${next.map(([, text, have, need]) => row(text, `${have.toLocaleString()} of ${need.toLocaleString()}`, false)).join('')}</ul>`;
}
