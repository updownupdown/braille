// Everything the app saves lives in localStorage on this device, under "dots." (games under "dots.g.").
// This module is the only place that touches localStorage: stores, backup, restore, resets and migrations.
//
// Keys (values are JSON):
//   settings           theme, colour coding, unraised dots, six-key typing, spoken feedback, sounds…
//   mastery            per-sign scores from Guess / Draw / Type ({ key: 0–5 })
//   auto               Auto practice boxes ({ r, w })        misses   most-missed signs
//   days               practice days, for the streak and Stats
//   learnDone          lessons whose check was passed       learnSeen  Learn sections opened
//   psel, pmode        last practice category/set and mode  pvisited   Practice opened at least once
//   pwlen, pwgrade, pwbest1, pwbest2   Type mode options and best streaks
//   swSrc, swPass1, swPass2, swBest1, swBest2   Read source, passage reached and best words a minute, per grade
//   cwSrc, cwGrade     Write mode source and grade (the placement check writes into mastery and auto)
//   cwBest1, cwBest2, cwBest1k, cwBest2k   Write mode best words a minute, per grade, tapping dots or six-key (k)
//   miles              milestones reached ({ id: 'YYYY-MM-DD', or 'earlier' for ones reached before they were tracked })
//   refSec, refLang, csGrade, signRegion, mOpen, topic   where each Learn page was left
//   trText, trMode, trDir, trDots, trView   Translate state
//   searchHist         recent searches, newest first (up to 8)
//   g.*                games: best.<game><level>, played, last, agent.p.<case>, maze, snow, riddles…
//   schema             the storage layout version (below)
const PREFIX = 'dots.';
export const SCHEMA = 3;
// MIGRATIONS[n] upgrades saved data from version n - 1 to n. Add one whenever a key is renamed or reshaped.
const MIGRATIONS = {
  1: () => {}, // version 1 is the layout as of November 2026; nothing to change, it only stamps the version.
  2: () => { const v = store.get('swPass', null); if (v != null) { store.set('swPass1', v); store.remove('swPass'); } }, // Read keeps a passage place per grade
  3: () => { // Trivia and Riddles levels became Grade 1 (easy) / Grade 2 (hard): Medium folds into Grade 1
    const g = gameStore;
    const solved = g.get('riddles.solved.medium', null);
    if (solved) { g.set('riddles.solved.easy', [...new Set([...g.get('riddles.solved.easy', []), ...solved])]); g.remove('riddles.solved.medium'); }
    for (const k of ['trivia', 'riddles']) {
      const m = g.get('best.quiz.' + k + 'medium', null), e = g.get('best.quiz.' + k + 'easy', null);
      if (m != null) { if (e == null || m > e) g.set('best.quiz.' + k + 'easy', m); g.remove('best.quiz.' + k + 'medium'); }
      if (g.get('lvl.' + k, null) === 'medium') g.set('lvl.' + k, 'easy');
    }
  },
};

const ls = () => { try { return window.localStorage; } catch { return null; } };
const ownKeys = (test = () => true) => { const s = ls(); if (!s) return []; try { return Object.keys(s).filter((k) => k.startsWith(PREFIX) && test(k)); } catch { return []; } };

function makeStore(prefix) {
  return {
    get(k, d) { try { const v = ls().getItem(prefix + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { ls().setItem(prefix + k, JSON.stringify(v)); } catch {} },
    remove(k) { try { ls().removeItem(prefix + k); } catch {} },
  };
}
export const store = makeStore(PREFIX);
export const gameStore = makeStore(PREFIX + 'g.');

export function migrate() {
  let v = store.get('schema', 0);
  if (v > SCHEMA) return; // saved by a newer version of the app: leave it alone
  while (v < SCHEMA) { v++; try { MIGRATIONS[v](); } catch {} }
  store.set('schema', SCHEMA);
}
migrate();

// Which keys each reset clears.
const WHICH = {
  games: (k) => k.startsWith(PREFIX + 'g.'),
  learn: (k) => !k.startsWith(PREFIX + 'g.') && k !== PREFIX + 'settings' && k !== PREFIX + 'schema',
  all: () => true,
};
export function clear(which) { ownKeys(WHICH[which]).forEach((k) => { try { ls().removeItem(k); } catch {} }); }

// Backup file: every saved key, raw, plus the schema it was written with.
export function snapshot() {
  const data = {}; ownKeys().forEach((k) => { data[k] = ls().getItem(k); });
  return { app: 'learn-braille', schema: SCHEMA, saved: new Date().toISOString(), data };
}
// Replaces everything saved on this device with the backup, then brings it up to date. Throws on a file that isn't a backup.
export function restore(j) {
  if (!j || j.app !== 'learn-braille' || !j.data || typeof j.data !== 'object') throw new Error('not a backup');
  clear('all');
  Object.entries(j.data).forEach(([k, v]) => { if (k.startsWith(PREFIX) && typeof v === 'string') ls().setItem(k, v); });
  if (!(PREFIX + 'schema' in j.data)) store.set('schema', j.schema || 0);
  migrate();
}
