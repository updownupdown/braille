# Learn Braille

A small, dependency-free website for learning to read braille, starting with Unified English Braille (UEB) Grade 1 and growing into Grade 2, other languages and real-world signage (with an Ontario, Canada focus).

**Live site:** https://updownupdown.github.io/braille/

## What's inside

- **Home** — visual tiles into every section, plus letters-known progress.
- **Practice** — pick Letters, Symbols or Contractions (any set, including all 180 Grade 2 signs), then Read (pick the answer), Write (tap-pad or Perkins-style F D S / J K L keys, checks itself), Words (type what you read) and **Sweep**: slide a finger along a line of braille; the cell under your finger is read 1:1, letters appear once you pass them, the right edge keeps the line scrolling, and Android phones vibrate on dots. A green or red glow shows right or wrong. Progress per item goes pale blue → dark blue → green (known).
- **Reference** — Alphabet, Numbers & symbols, Grade 2 contractions, Signs in the wild (Ontario first, plus US, UK, EU, Japan, Australia), Maths & science, Languages, World systems, History, with search by word, symbol or dot numbers.
- **Translate** — English Grade 1/2, French, Spanish, German, Russian and Greek.
- **Settings** (top right) — theme, alphabet, sweep, signs and translate options.

## Structure

```
site/            static site (deployed as-is)
  index.html
  css/style.css
  js/braille.js  braille data + translators
  js/data.js     reference content
  js/app.js      views and router
.github/workflows/pages.yml   deploys site/ on every push to main
```

Run locally with any static server, e.g. `python3 -m http.server -d site`.

The Grade 2 translator follows the main UEB contraction rules but is simplified; treat it as a learning aid, not a transcription tool.
