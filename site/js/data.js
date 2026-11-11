// Reference content: languages, world systems, signage, science, history.
import { cellsOf } from './braille.js?v=25';

export const SIGN_WORDS = [
  'Exit', 'Men', 'Women', 'Washroom', 'Stairs', 'Elevator', 'Push', 'Pull', 'Room', 'Floor', 'Open', 'Close',
  'Alarm', 'Main', 'Entrance', 'Information', 'Office', 'Kitchen', 'Accessible', 'Emergency', 'Library', 'Lobby',
];

export const WORDS = [
  'cab', 'bed', 'dig', 'fig', 'hide', 'jade', 'milk', 'lamp', 'snow', 'quiz', 'yes', 'zero', 'wave', 'jump',
  'park', 'tree', 'blue', 'fox', 'cozy', 'map', 'rain', 'lake', 'home', 'warm', 'maple', 'canoe', 'north',
];
export const SENTENCES = [
  'the quick brown fox jumps over the lazy dog',
  'braille is read with the fingertips',
  'exit is to the left',
  'washrooms are on the second floor',
  'press the button to open the door',
  'six dots make every letter',
];

// Hand-checked technical examples (Grade 1 context). Groups: "cells:label", "_" = space.
export const SCIENCE = [
  { print: 'x² + y² = z²', g: '⠭:x ⠔:sup ⠼⠃:2 _ ⠐⠖:+ _ ⠽:y ⠔:sup ⠼⠃:2 _ ⠐⠶:= _ ⠵:z ⠔:sup ⠼⠃:2' },
  { print: 'H₂O', g: '⠠:cap ⠓:H ⠢:sub ⠼⠃:2 ⠠:cap ⠕:O' },
  { print: 'E = mc²', g: '⠠:cap ⠑:E _ ⠐⠶:= _ ⠍:m ⠉:c ⠔:sup ⠼⠃:2' },
  { print: '½', g: '⠼:# ⠁:1 ⠌:/ ⠃:2' },
  { print: '3.14', g: '⠼:# ⠉:3 ⠲:. ⠁:1 ⠙:4' },
  { print: '5 × 4 = 20', g: '⠼⠑:5 _ ⠐⠦:× _ ⠼⠙:4 _ ⠐⠶:= _ ⠼⠃⠚:20' },
  { print: '10 − 3 = 7', g: '⠼⠁⠚:10 _ ⠐⠤:− _ ⠼⠉:3 _ ⠐⠶:= _ ⠼⠛:7' },
  { print: '√9 = 3', g: '⠩:√ ⠼⠊:9 ⠬:end√ _ ⠐⠶:= _ ⠼⠉:3' },
  { print: '25%', g: '⠼⠃⠑:25 ⠨⠴:%' },
  { print: '20 °C', g: '⠼⠃⠚:20 _ ⠘⠚:° ⠠:cap ⠉:C' },
];
export const SCIENCE_SYMBOLS = [
  ['⠼', 'number sign'], ['⠲', 'decimal point'], ['⠐⠖', 'plus'], ['⠐⠤', 'minus'], ['⠐⠦', 'times'], ['⠐⠌', 'divided by'],
  ['⠐⠶', 'equals'], ['⠔', 'superscript'], ['⠢', 'subscript'], ['⠌', 'fraction line'], ['⠩', 'open radical'], ['⠬', 'close radical'],
  ['⠨⠴', 'percent'], ['⠘⠚', 'degrees'], ['⠰', 'grade 1 indicator'],
];
export const NEMETH = [
  { print: '3 + 4 = 7', g: '⠼:# ⠒:3 ⠬:+ ⠲:4 _ ⠨⠅:= _ ⠼:# ⠶:7' },
  { print: 'x²', g: '⠭:x ⠘:sup ⠆:2' },
  { print: '½', g: '⠹:open ⠂:1 ⠌:/ ⠆:2 ⠼:close' },
];

export const LANG_INFO = {
  en: {
    title: 'English — Unified English Braille (UEB)',
    blurb: 'The standard in Canada, the US, the UK, Australia, New Zealand, South Africa, Ireland and more. Grade 1 spells every letter; Grade 2 (contracted) adds about 180 contractions and is what you will see on most signs and in books.',
    phrases: ['Hello', 'Thank you', 'Exit', 'Washroom', 'Where is the elevator?', 'Welcome to Ontario'],
    letters: 'abcdefghijklmnopqrstuvwxyz',
  },
  fr: {
    title: 'Français — Code braille français uniformisé',
    blurb: 'Used in France, Quebec and across French Canada. Accented letters get their own cells (é is a full cell ⠿). Numbers use a one-dot number sign ⠠ and “Antoine” digits — letters a–j with the lower-right dot added. On bilingual federal signs across Canada you will often see this beside or below the English.',
    phrases: ['Bonjour', 'Merci', 'Sortie', 'Toilettes', 'Ascenseur', 'Étage 2'],
    letters: 'abcdefghijklmnopqrstuvwxyzéàèùâêîôûëïüçœ',
  },
  es: {
    title: 'Español',
    blurb: 'Spanish braille keeps the same a–z and number system as English, adds accented vowels and ñ, and uses ⠨ as the capital sign. The period is a single dot ⠄.',
    phrases: ['Hola', 'Gracias', 'Salida', '¿Dónde está el baño?', 'Ascensor'],
    letters: 'abcdefghijklmnñopqrstuvwxyzáéíóúü',
  },
  de: {
    title: 'Deutsch',
    blurb: 'German braille adds umlauts and ß. Everyday German braille (Vollschrift / Kurzschrift) traditionally doesn’t mark capitals at all.',
    phrases: ['Hallo', 'Danke', 'Ausgang', 'Aufzug', 'Grüße'],
    letters: 'abcdefghijklmnopqrstuvwxyzäöüß',
  },
  ru: {
    title: 'Русский — Russian',
    blurb: 'Cyrillic braille reuses Latin patterns by sound where it can (а = a, б = b, д = d), and fills the rest with new cells.',
    phrases: ['Привет', 'Спасибо', 'Выход'],
    letters: 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя',
  },
  el: {
    title: 'Ελληνικά — Greek',
    blurb: 'Greek braille maps letters to their Latin look-alikes or sound-alikes (α = a, β = b, π = p). Also used for Greek letters in maths and science.',
    phrases: ['Γεια σου', 'Ευχαριστώ', 'Έξοδος'],
    letters: 'αβγδεζηθικλμνξοπρστυφχψω',
  },
};

// Japanese kana braille, built from rules: vowel shape + consonant dots.
const JV = { a: '1', i: '12', u: '14', e: '124', o: '24' };
const JROWS = [['', ''], ['k', '6'], ['s', '56'], ['t', '35'], ['n', '3'], ['h', '36'], ['m', '356'], ['r', '5']];
const JNAMES = { si: 'shi', ti: 'chi', tu: 'tsu', hu: 'fu' };
const jcell = (d) => String.fromCharCode(0x2800 + [...d].reduce((v, n) => v | (1 << (Number(n) - 1)), 0));
export const JAPANESE = {
  blurb: 'Japanese braille (tenji 点字) is built on kana syllables, not letters. The five vowels use only the top dots; each consonant row adds its own dots to the vowel shape. Kanji are written by their reading.',
  rows: [
    ...JROWS.map(([c, add]) => [c ? c + '-' : 'vowels', Object.entries(JV).map(([v, d]) => [JNAMES[c + v] || c + v, jcell(d + add)])]),
    ['y-, w-, n', [['ya', jcell('34')], ['yu', jcell('346')], ['yo', jcell('345')], ['wa', jcell('3')], ['wo', jcell('35')], ['n', jcell('356')]]],
    ['marks', [['voiced ゛', jcell('5')], ['p- ゜', jcell('6')], ['number', jcell('3456')]]],
  ],
};

// [name, where, description, characters-table key (optional)]
export const SYSTEMS = [
  { group: 'English', items: [
    ['Unified English Braille (UEB)', 'Canada, US, UK, Ireland, Australia, NZ, South Africa, Nigeria', 'Developed by the International Council on English Braille from 1991 and adopted in 2004. Australia implemented it first (2005); Canada adopted it in 2010 and the US switched in 2016. One code covers literary text, maths and computer notation, in Grade 1 (uncontracted) and Grade 2 (contracted).', 'en'],
    ['English Braille American Edition (EBAE)', 'US & Canada, before UEB', 'The previous North American literary code, still found on many older signs. UEB dropped nine of its contractions — ble, com, dd, ally, ation, by, into, to and o’clock — and stopped joining “to”, “into” and “by” to the next word.', 'ebae'],
    ['Standard English Braille', 'UK, before UEB', 'The British code that preceded UEB; very close to EBAE.'],
    ['Nemeth Code', 'US & Canada (maths)', 'Created by Abraham Nemeth and adopted in the US in 1952. Digits use the lower part of the cell and operations have their own signs. Many schools still teach maths in Nemeth, sometimes inside UEB text.', 'nemeth'],
    ['Computer Braille Code', 'US (until UEB)', 'A one-cell-per-character code for programming and web addresses; UEB now handles these itself.'],
  ]},
  { group: 'Other Latin-script languages', items: [
    ['French (Code braille français uniformisé)', 'France, Quebec, French Canada, Belgium, Switzerland, Africa', 'Intégral (uncontracted) and abrégé (contracted). Accented letters have their own cells and numbers use “Antoine” digits after a one-dot number sign.', 'fr'],
    ['Spanish', 'Spain, Latin America', 'Mostly uncontracted. Accented vowels and ñ have their own cells; ⠨ marks capitals; the period is a single dot.', 'es'],
    ['German (Deutsche Blindenschrift)', 'Germany, Austria, Switzerland', 'Basisschrift (uncontracted, formerly Vollschrift) and Kurzschrift (contracted). Umlauts and ß have their own cells; capitals are traditionally not marked.', 'de'],
    ['Italian, Portuguese, Dutch, Nordic and others', 'Europe & beyond', 'Each adapts the same a–z base from French braille, adding its own accented letters and punctuation.'],
  ]},
  { group: 'Other scripts', items: [
    ['Cyrillic (Russian and others)', 'Russia, Eastern Europe, Central Asia', 'Letters are mapped to Latin cells by sound where possible (б = b, д = d); the rest get new cells. Ukrainian, Bulgarian and others vary slightly.', 'ru'],
    ['Greek', 'Greece, Cyprus', 'Letters map to Latin look-alikes or sound-alikes (α = a, π = p). Greek letters in maths use the same cells after a Greek indicator.', 'el'],
    ['Arabic', 'Middle East, North Africa', 'Print reads right-to-left, but Arabic braille is read left-to-right. Many letters share cells with their Latin sound-alikes.', 'ar'],
    ['Hebrew', 'Israel', 'Also read left-to-right in braille, with letters loosely matched to Latin sounds.'],
    ['Bharati braille', 'India, Nepal, Sri Lanka, Bangladesh', 'Standardised in 1951. One system shared by Hindi, Bengali, Tamil, Telugu, Punjabi and more: the same sound gets the same cell whatever the print script.'],
    ['Japanese (tenji)', 'Japan', 'Devised by Kuraji Ishikawa in 1890. Kana-based: each cell is a syllable, built from a vowel shape plus consonant dots. An 8-dot Kanji braille exists but is rare.', 'ja'],
    ['Korean (Hangeul jeomja)', 'South Korea', 'Published by Park Du-seong in 1926. Built from Hangul letters (jamo), with different cells for initial and final consonants.'],
    ['Chinese braille', 'Mainland China, Taiwan, Hong Kong', 'Written by sound, not by character: initial + final + tone. Mainland China uses Current Braille (1950s) and the newer National Common Braille (2018); Taiwan and Cantonese have their own systems.'],
    ['Thai, Vietnamese, Amharic, Tibetan and more', 'Worldwide', 'Most writing systems now have a braille code, often coordinated through UNESCO and the World Blind Union.'],
  ]},
  { group: 'Special-purpose codes', items: [
    ['Music braille', 'International', 'Notes, durations, octaves and dynamics in 6-dot cells. Louis Braille included music in his 1829 method.', 'music'],
    ['8-dot / computer braille', 'Refreshable displays', 'Adds a fourth row of two dots below the cell, giving 256 patterns — one per character. Unicode’s braille block (U+2800–U+28FF) contains all of them.'],
    ['Gardner–Salinas braille', 'Science', 'An 8-dot code for maths and science notation, developed in the 1990s.'],
    ['IPA braille', 'Linguistics', 'Phonetic symbols for writing pronunciation.'],
    ['Chess and other notations', 'Hobbies', 'Specialist codes published by braille authorities.'],
  ]},
  { group: 'Tactile, but not braille', items: [
    ['Moon type', 'UK, 1845', 'Created by William Moon: simplified raised shapes based on print letters. Easier for people who lose their sight later in life.'],
    ['Boston Line Type', 'US, 1830s', 'Raised print letters, promoted by Samuel Gridley Howe before braille won out.'],
    ['Night writing', 'France, 1810s–1820s', 'Charles Barbier’s 12-dot military code; Louis Braille simplified it into the 6-dot cell.'],
    ['Tactile paving', 'Japan, 1965 → worldwide', 'Invented by Seiichi Miyake: bumps warn of a hazard or edge, bars point the way.'],
  ]},
];

export const HISTORY = [
  ['1820s', 'Charles Barbier shows a 12-dot “night writing” code at the Paris institute for blind youth.'],
  ['1824', 'Louis Braille, age 15, reduces it to a 6-dot cell that fits under one fingertip.'],
  ['1829', 'Braille publishes his method, including music.'],
  ['1878', 'An international congress in Paris recommends braille for all European languages.'],
  ['1932', 'Standard English Braille agreed between the UK and the US.'],
  ['1952', 'Nemeth Code for maths published in the US.'],
  ['2004', 'Unified English Braille adopted by the International Council on English Braille.'],
  ['2005', 'Australia is first to implement UEB.'],
  ['2010', 'Canada adopts UEB (rolled out through the 2010s).'],
  ['2016', 'The US switches to UEB for literary braille.'],
];

// ---------- Signage by country ----------
export const SIGN_REGIONS = {
  ca: {
    name: 'Canada (English)',
    facts: [
      ['Code', 'Unified English Braille, Grade 2 (contracted). Signs made before UEB rolled out in the 2010s may be in EBAE — letters and most contractions are the same, but capital signs are often missing.'],
      ['Rules', 'The National Building Code and each province’s code (for example the Ontario Building Code and Ontario’s AODA standards) say where accessible signs are required. The CSA B651 standard describes how tactile signs are made: raised characters, with braille directly below.'],
      ['Where to reach', 'Room signs sit on the wall beside the door, on the latch (handle) side, at about shoulder height (roughly 1.2–1.5 m), so you never stand in the door’s swing.'],
      ['Elevators', 'Raised floor numbers with braille are on both sides of the door frame outside, and next to each button inside (CSA B44). A ★ star marks the main / street floor.'],
      ['Bilingual signs', 'Federal buildings, New Brunswick and some cities show French braille under the English. See Canada (French) for how that reads.'],
      ['Money', 'Canadian $5–$100 notes have raised 6-dot clusters in the top corner: 1 cluster = $5, 2 = $10, 3 = $20, 4 = $50, 5 = $100. They’re not letters, but they’re braille-cell sized.'],
    ],
    signs: ['Washroom', 'Men', 'Women', 'Exit', 'Stairs', 'Room 101', 'Elevator', 'Main floor', 'Information', 'Fire alarm'],
    bilingual: [['Exit', 'Sortie'], ['Washroom', 'Toilettes'], ['Elevator', 'Ascenseur']],
    room: 'Room 101',
    elevator: true, money: true,
    tips: [
      ['Start with numbers', 'Room numbers and elevator floors are the easiest wins — the number sign plus a–j.'],
      ['Expect contractions', 'Learn sh, en, ar, in, st and “the” early: washroom, men, women, alarm, main, stairs.'],
      ['Missing capitals', 'Older (EBAE) signs often leave out the capital sign.'],
      ['Keep moving', 'Use the pad of your finger with light pressure. Stopping makes dots harder to feel.'],
    ],
  },
  cafr: {
    name: 'Canada (French)',
    signLang: 'fr',
    facts: [
      ['Code', 'French braille — the same code used in France (Code braille français uniformisé). Accented letters have their own cells: é is a full cell ⠿, à is ⠷, è is ⠮.'],
      ['Where', 'Quebec, francophone communities across Canada, and the French half of bilingual federal signs.'],
      ['Numbers', 'French braille marks numbers with a single dot ⠠ followed by “Antoine” digits — a–j with the lower-right dot added, so 1 is ⠡ and 2 is ⠣. Some signs may use the English ⠼ style instead, so be ready for both.'],
      ['Capitals', '⠨ marks a capital letter.'],
      ['Rules', 'The same national standard (CSA B651) and provincial building codes as in English Canada decide where tactile signs go.'],
    ],
    signs: ['Sortie', 'Toilettes', 'Hommes', 'Femmes', 'Escalier', 'Ascenseur', 'Accueil', 'Entrée', 'Salle 101'],
    room: 'Salle 101',
    note: 'Shown in uncontracted (intégral) French braille.',
  },
  us: {
    name: 'United States',
    code: 'en',
    facts: [
      ['Code', 'UEB Grade 2 since 2016; EBAE on older signs. Signs are very similar to Canada’s.'],
      ['Rules', 'The 2010 ADA Standards (§703) require Grade 2 braille directly below the raised text, with domed dots.'],
      ['Height', 'Braille baseline at least 48 in (1220 mm) and raised text no higher than 60 in (1525 mm) above the floor, on the latch side of the door.'],
      ['Capitals', 'ADA only asks for capital signs before proper nouns, the first word of a sentence, initials and acronyms — so many signs look all lowercase in braille.'],
      ['Elevators', 'Braille left of each button. ADA-style labels use contractions: “open” is ⠕⠏⠢ (o-p-en), “alarm” is ⠁⠇⠜⠍ (a-l-ar-m), “phone” is ⠏⠓⠐⠕ (p-h-one).'],
    ],
    signs: ['Restroom', 'Exit', 'Stairs', 'Elevator', 'Room 214', 'Open', 'Close', 'Alarm', 'Phone'],
    room: 'Room 214', elevator: true,
  },
  uk: {
    name: 'United Kingdom',
    code: 'en',
    facts: [
      ['Code', 'UEB (Grade 1 and 2). Short sign labels are often uncontracted.'],
      ['Rules', 'The Equality Act 2010 and design guidance such as BS 8300 cover tactile signs; braille is common on toilets, lifts and handrails.'],
      ['Medicine', 'Medicine packs must show the product name in braille — you’ll find braille on almost every pharmacy box.'],
      ['Vocabulary', 'Expect “Toilets”, “Lift” and “Way out” instead of “Washroom”, “Elevator” and “Exit”.'],
    ],
    signs: ['Toilets', 'Lift', 'Way out', 'Platform 2'],
    room: 'Room 12',
  },
  eu: {
    name: 'Europe (EU)',
    code: 'fr',
    facts: [
      ['Code', 'Each country uses braille in its own language — French, German, Spanish and so on. See Reference → Languages for each alphabet.'],
      ['Medicine', 'Since 2004 an EU directive requires the medicine name in braille on packaging.'],
      ['Elevators', 'Lift standard EN 81-70 calls for tactile buttons; braille next to them is common.'],
      ['Transit', 'Train and metro stations often put braille on handrails, giving the platform or exit direction.'],
    ],
    signs: ['Sortie', 'Toilettes', 'Ascenseur'],
    signLang: 'fr',
    note: 'Shown in uncontracted French braille.',
  },
  jp: {
    name: 'Japan',
    code: 'ja',
    facts: [
      ['Code', 'Japanese kana braille (tenji). Each cell is a syllable.'],
      ['Everywhere', 'Station handrails, ticket machines, toilet controls and stair rails carry braille.'],
      ['Cans', 'Alcoholic drink cans are marked in braille with “osake” (alcohol) so they can be told apart from soft drinks.'],
      ['Underfoot', 'Tactile paving was invented in Japan in 1965 and is extremely widespread.'],
    ],
    signs: [],
  },
  au: {
    name: 'Australia',
    code: 'en',
    facts: [
      ['Code', 'The first country to implement UEB (2005).'],
      ['Rules', 'The building code and AS 1428.1 require braille and tactile signs for toilets, accessible facilities and exits, among others.'],
    ],
    signs: ['Toilet', 'Exit', 'Lift', 'Stairs'],
    room: 'Room 5',
  },
};
export { cellsOf };
