// Accessibility helpers shared by every module: screen-reader announcements, optional speech and sounds
// (both off by default, Settings), braille cells described as dots, and the reduced-motion preference.
import { toDots } from './braille.js';
import { store } from './storage.js';

const setting = (k) => !!(store.get('settings', {}) || {})[k];

// Reduced motion: the system setting. Glides and animated scrolls jump straight to the end.
const RM = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
export const reducedMotion = () => RM.matches;

// A cell as a screen reader should hear it: "dots 1-2-5", or "blank". A run of cells is joined with commas.
export const cellLabel = (c) => { const d = toDots(c); return d.length ? 'dots ' + d.join('-') : 'blank'; };
export const cellsLabel = (cells) => [...cells].map((c) => (c === ' ' || c === '⠀' ? 'space' : cellLabel(c))).join(', ');

// ---------- speech (Settings: Spoken feedback) ----------
const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
let voice = null;
function pickVoice() {
  if (!synth) return null;
  const vs = synth.getVoices();
  return vs.find((v) => /^en-CA/i.test(v.lang)) || vs.find((v) => /^en-(US|GB)/i.test(v.lang) && v.localService) || vs.find((v) => /^en/i.test(v.lang)) || null;
}
if (synth) synth.addEventListener?.('voiceschanged', () => { voice = pickVoice(); });
export const speechAvailable = () => !!synth;
// Speaking replaces whatever is still being said, so feedback never queues up behind old prompts.
export function speak(text, { force = false } = {}) {
  if (!synth || !text || (!force && !setting('speech'))) return;
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/·/g, ',').replace(/–/g, ' to '));
    voice = voice || pickVoice(); if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : 'en-CA'; u.rate = 1.05;
    synth.speak(u);
  } catch {}
}
// Speech only (a screen reader gets the same thing from focus or labels): new questions and prompts.
// Queued behind any feedback still being spoken.
export function say(text) {
  if (!synth || !text || !setting('speech')) return;
  try {
    const u = new SpeechSynthesisUtterance(String(text).replace(/·/g, ',').replace(/–/g, ' to '));
    voice = voice || pickVoice(); if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : 'en-CA'; u.rate = 1.05;
    synth.speak(u);
  } catch {}
}
// After a question is redrawn, put focus on its prompt, but only for someone who was working inside it with the
// keyboard or a screen reader (focus was in `root` and went away with the old question). A page that has just
// opened, or a tap somewhere else, is left alone.
export function refocus(root, target) {
  if (!root || !target) return;
  if (!root._rf) {
    root._rf = true;
    root.addEventListener('focusin', () => { root.dataset.kf = '1'; });
    root.addEventListener('focusout', (e) => { if (e.relatedTarget && !root.contains(e.relatedTarget)) delete root.dataset.kf; });
  }
  const a = document.activeElement;
  if (!root.dataset.kf || (a && a !== document.body && !root.contains(a))) return;
  if (!target.hasAttribute('tabindex') && !/^(BUTTON|A|INPUT)$/.test(target.tagName)) target.tabIndex = -1;
  target.focus({ preventScroll: true });
}
export const stopSpeech =() => { try { if (synth) synth.cancel(); } catch {} };

// ---------- sounds (Settings: Sounds) ----------
// Two soft tones made on the fly (no audio files): a rising pair for right, a low short note for wrong.
let ac = null;
export function tone(ok, { force = false } = {}) {
  if (!force && !setting('sounds')) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime;
    const notes = ok ? [[660, 0, 0.09], [880, 0.08, 0.14]] : [[220, 0, 0.18]];
    for (const [f, at, len] of notes) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = ok ? 'sine' : 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + at);
      g.gain.exponentialRampToValueAtTime(0.18, t + at + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + len);
      o.connect(g).connect(ac.destination); o.start(t + at); o.stop(t + at + len + 0.02);
    }
  } catch {}
}

// ---------- announcements ----------
// One polite live region (#srLive in index.html). Messages sent within a moment of each other are joined,
// so "Correct" and the next question's prompt arrive together instead of one cutting the other off.
let buf = [], timer = 0;
export function announce(text) {
  if (!text) return;
  buf.push(String(text));
  clearTimeout(timer);
  timer = setTimeout(() => {
    const msg = buf.join('. '); buf = [];
    const el = typeof document !== 'undefined' && document.getElementById('srLive');
    if (el) { el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 30); }
    speak(msg);
  }, 120);
}
// Right or wrong: the sound (if on) plays at once; the words go to the screen reader and speech.
export function feedback(ok, extra = '') {
  tone(ok);
  announce((ok ? 'Correct' : 'Not quite') + (extra ? '. ' + extra : ''));
}
// Enter or Space on a focused button, link or radio does that control's own job; page-wide shortcuts leave it alone.
export const nativeKey = (e) => (e.key === 'Enter' || e.key === ' ') && !!(e.target && e.target.closest && e.target.closest('button, a[href], [role="radio"], [role="button"], summary, select, textarea'));
