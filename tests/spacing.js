// Cell spacing check, run in the page by smoke.mjs. Braille geometry (style.css, v11): inside a cell the gap between
// the two dot columns is 2/3 of a dot; between neighbouring cells it is 1.5 dots edge to edge. When neighbours sit
// closer than 2x the inside gap (the geometry gives 2.25x), a word reads as one run of dots. Returns one line per offending pair.
export function cellSpacingProblems() {
  const out = [];
  const seen = new Set();
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  // .money: banknote markings, a row of full cells by design, not braille text.
  const cells = [...document.querySelectorAll('.cell')].filter((c) => !c.closest('[hidden], .sr-only, .visually-hidden, .money') && c.querySelector('i[data-n="1"]') && visible(c));
  // Neighbours in one run of braille share an ancestor at most three levels up (cell > word part > word > line).
  const near = (a, b) => { let x = a; for (let i = 0; i < 3 && x; i++) x = x.parentElement; return !!x && x.contains(b); };
  const geo = cells.map((c) => {
    const d1 = c.querySelector('i[data-n="1"]').getBoundingClientRect(), d4 = c.querySelector('i[data-n="4"]').getBoundingClientRect();
    return { c, left: d1.left, right: d4.right, inner: d4.left - d1.right, top: d1.top, h: d1.height };
  });
  for (const a of geo) {
    if (a.inner <= 0.5) continue;
    // The nearest cell to the right on the same row (dots level within half a dot).
    let best = null;
    for (const b of geo) {
      if (b === a || Math.abs(b.top - a.top) > a.h / 2 || Math.abs(b.h - a.h) > a.h * 0.25 || b.left <= a.left || !near(a.c, b.c)) continue;
      if (!best || b.left < best.left) best = b;
    }
    if (!best) continue;
    const gap = best.left - a.right;
    // Far apart: separate items (tiles, options), not neighbours in a word.
    if (gap > a.inner * 6) continue;
    if (gap < a.inner * 2) {
      const where = a.c.parentElement?.closest('[class]')?.className || '?';
      const key = where + Math.round(gap) + '/' + Math.round(a.inner);
      if (seen.has(key)) continue; seen.add(key);
      out.push(`cells in .${String(where).trim().split(/\s+/).join('.')} are ${gap.toFixed(1)}px apart, dots inside a cell ${a.inner.toFixed(1)}px`);
    }
  }
  return out;
}
