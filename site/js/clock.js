// A clock that stops while the app is out of sight (phone asleep, another app or tab in front), so answer
// times, round times, writing speed and game countdowns only count time spent looking at the app.
let hiddenAt = document.hidden ? performance.now() : 0, away = 0;
const hide = () => { if (!hiddenAt) hiddenAt = performance.now(); };
const show = () => { if (hiddenAt) { away += performance.now() - hiddenAt; hiddenAt = 0; } };
document.addEventListener('visibilitychange', () => (document.hidden ? hide() : show()));
addEventListener('pagehide', hide);
addEventListener('pageshow', () => { if (!document.hidden) show(); });
// Milliseconds of time in view; while hidden it stands still at the moment the app went away.
export const activeNow = () => (hiddenAt || performance.now()) - away;
// One answer never counts as more than this, in case the app stayed open and unattended.
export const MAX_ANSWER_MS = 60000;
