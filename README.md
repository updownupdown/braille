# Learn Braille

A small, dependency-free website for learning to read braille, starting with Unified English Braille (UEB) Grade 1 and growing into Grade 2, other languages and real-world signage (with an Ontario, Canada focus).

**Live site:** https://updownupdown.github.io/braille/

## What's inside

- **Home** — visual tiles into every section, plus letters-known progress.
- **Practice** — pick Letters, Symbols or Contractions (any set, including all 180 Grade 2 signs), then Read (pick the answer), Write (tap-pad or Perkins-style F D S / J K L keys, checks itself), Words (type what you read) and **Sweep**: slide a finger along a line of braille; the cell under your finger is read 1:1, letters appear once you pass them, the right edge keeps the line scrolling, and Android phones vibrate on dots. A green or red glow shows right or wrong. Progress per item goes pale blue → dark blue → green (known).
- **Learn** — Alphabet, Numbers & symbols, Grade 2 contractions, Signs in the wild (Ontario first, plus US, UK, EU, Japan, Australia), Maths & science, Languages, World systems, with search by word, symbol or dot numbers.
- **Translate** — English Grade 1/2, French, Spanish, German, Russian and Greek.
- **Settings** (top right) — theme, alphabet, sweep, signs and translate options.

## Structure

```
site/            static site (deployed as-is)
  index.html
  css/style.css
  js/app.js        entry: router, search, Games page wrapper (loads the view modules)
  js/core.js       shared UI: cells, sheet, drop-downs, header, Settings, symbol dictionary, titleCase
  js/home.js       Home and Practice stats      js/practice.js  Practice modes and Auto
  js/learn.js      Learn lessons and reference  js/translate.js Translate
  js/storage.js    everything saved (localStorage "dots.*"): key list, schema version, backup, resets
  js/braille.js    braille data + translators   js/data.js      reference content
  js/games.js      games (data in gamedata.js and friends)
.github/workflows/pages.yml   deploys site/ on every push to main
```

Run locally with any static server, e.g. `python3 -m http.server -d site`.

## Tests and deploys

Every pull request and every push to main runs `.github/workflows/pages.yml`:

- `node --test tests/translator.test.mjs` checks every Grade 2 example in `js/g2examples.js` against the translator.
- `node tests/smoke.mjs` (needs `npm install --no-save playwright`) opens every route at phone and laptop sizes and fails on any page error or sideways scroll. Add new routes to its `ROUTES` list.

Pushes to main deploy only when both pass. There are no cache version numbers to bump: the service worker fetches the app's files network-first (cached copy offline), and the deploy stamps `site/version.json` so an open app can show an "Updated · Reload" bar.

Headings are Title Case: write literal headings that way, and wrap heading text that comes from data in `titleCase()`. A storage change that renames or reshapes a key needs a new entry in `MIGRATIONS` in `js/storage.js` and a bump of `SCHEMA`; backups carry the schema they were saved with.

The Grade 2 translator follows the main UEB contraction rules but is simplified; treat it as a learning aid, not a transcription tool.

## Install as an app

The site is a Progressive Web App (`site/manifest.webmanifest`, `site/sw.js`). On Android, Chrome offers "Install app"; on iPhone, use Share → Add to Home Screen. Once installed it works offline.
