// Six-key braille input, like a Perkins brailler: F D S are dots 1 2 3, J K L are dots 4 5 6.
// Hold the keys of one cell together and let go; the cell is sent when the last key comes up.
// Turned on in Settings ("Physical keyboard: Six-key"); off, those keys type their own letters.
import { LETTERS, fromDots } from './braille.js';
import { store } from './storage.js';

const DOT = { f: 1, d: 2, s: 3, j: 4, k: 5, l: 6 };
const LETTER_OF = Object.fromEntries(Object.entries(LETTERS).map(([l, c]) => [c, l]));

export const sixKeyOn = () => !!(store.get('settings', {}) || {}).sixKey;

// Returns { down(e), up(e) }: each returns true when it consumed the event.
// onCell(dots[], cell, letter) gets the chord once every key is released.
export function chord(onCell) {
  const held = new Set(); let dots = new Set();
  return {
    down(e) {
      const d = DOT[e.key.toLowerCase()]; if (!d) return false;
      e.preventDefault(); if (!e.repeat) { held.add(d); dots.add(d); } return true;
    },
    up(e) {
      const d = DOT[e.key.toLowerCase()]; if (!d) return false;
      e.preventDefault(); held.delete(d);
      if (!held.size && dots.size) { const ds = [...dots].sort(); dots = new Set(); const cell = fromDots(ds.join('')); onCell(ds, cell, LETTER_OF[cell] || null); }
      return true;
    },
  };
}
