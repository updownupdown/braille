# Dots — learn braille

A small, dependency-free website for learning to read braille, starting with Unified English Braille (UEB) Grade 1 and growing into Grade 2, other languages and real-world signage (with an Ontario, Canada focus).

**Live site:** https://updownupdown.github.io/braille/

## What's inside

- **Alphabet** — a–z laid out as the three “decades” braille is built from, with details per letter.
- **Practice** — read cells (multiple choice), write cells on a tap-pad or with Perkins-style keys (F D S / J K L), and decode words. Progress per symbol is saved in your browser.
- **Finger sweep** — drag across a strip of braille; the text slides under a fixed “fingertip”, each raised dot clicks (and vibrates on Android) as it passes, and a loupe shows what you're on.
- **Signs** — how braille signage works in Canada/Ontario, the US, UK, EU, Japan and Australia, with decodable example signs and an elevator panel.
- **Reference** — searchable dictionary of every Grade 1 symbol and Grade 2 contraction, maths & science (UEB and Nemeth), six languages, a catalog of world braille systems, and history.
- **Translate** — English Grade 1/2, French, Spanish, German, Russian and Greek.

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
