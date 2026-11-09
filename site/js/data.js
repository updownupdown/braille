// Reference content: languages, world systems, signage, science, history.
import { cellsOf } from './braille.js?v=2';

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

// Hand-checked technical examples (Grade 1 context).
export const SCIENCE = [
  { print: 'x² + y² = z²', ueb: '⠭⠔⠼⠃ ⠐⠖ ⠽⠔⠼⠃ ⠐⠶ ⠵⠔⠼⠃', notes: ['⠔ superscript indicator', '⠼⠃ number 2', '⠐⠖ plus', '⠐⠶ equals'] },
  { print: 'H₂O', ueb: '⠠⠓⠢⠼⠃⠠⠕', notes: ['⠠ capital', '⠢ subscript indicator', '⠼⠃ 2'] },
  { print: 'E = mc²', ueb: '⠠⠑ ⠐⠶ ⠍⠉⠔⠼⠃', notes: ['⠠⠑ capital E', '⠔ superscript'] },
  { print: '½', ueb: '⠼⠁⠌⠃', notes: ['⠌ simple numeric fraction line'] },
  { print: '3.14', ueb: '⠼⠉⠲⠁⠙', notes: ['⠲ decimal point stays in number mode'] },
  { print: '5 × 4 = 20', ueb: '⠼⠑ ⠐⠦ ⠼⠙ ⠐⠶ ⠼⠃⠚', notes: ['⠐⠦ multiplication', '⠐⠶ equals'] },
  { print: '√9 = 3', ueb: '⠩⠼⠊⠬ ⠐⠶ ⠼⠉', notes: ['⠩ open radical', '⠬ close radical'] },
  { print: '25%', ueb: '⠼⠃⠑⠨⠴', notes: ['⠨⠴ percent'] },
  { print: '20 °C', ueb: '⠼⠃⠚ ⠘⠚⠠⠉', notes: ['⠘⠚ degrees', '⠠⠉ capital C'] },
];
export const NEMETH = [
  { print: '3 + 4 = 7', cells: '⠼⠒⠬⠲⠀⠨⠅⠀⠼⠶', notes: ['digits drop to the lower dots (3 = ⠒)', '⠬ plus, no spaces', '⠨⠅ equals, spaced'] },
  { print: 'x²', cells: '⠭⠘⠆', notes: ['⠘ superscript level', '⠆ lower-cell 2'] },
  { print: '½', cells: '⠹⠂⠌⠆⠼', notes: ['⠹ open fraction', '⠌ fraction line', '⠼ close fraction'] },
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
    blurb: 'Used in France, Quebec and across French Canada. Accented letters get their own cells (é is a full cell ⠿). Numbers use a dot-6 sign ⠠ and “Antoine” digits — letters a–j with dot 6 added. On bilingual federal signs in Ontario you will see this below the English.',
    phrases: ['Bonjour', 'Merci', 'Sortie', 'Toilettes', 'Ascenseur', 'Étage 2'],
    letters: 'abcdefghijklmnopqrstuvwxyzéàèùâêîôûëïüçœ',
  },
  es: {
    title: 'Español',
    blurb: 'Spanish braille keeps the same a–z and number system as English, adds accented vowels and ñ, and uses dots 4-6 ⠨ as the capital sign. The period is a single dot 3 ⠄.',
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

export const JAPANESE = {
  blurb: 'Japanese braille (tenji 点字) is built on kana syllables, not letters. Vowels use dots 1, 2, 4; a consonant row adds other dots to the vowel shape. Kanji are written by their reading.',
  rows: [
    ['vowels', [['a', '⠁'], ['i', '⠃'], ['u', '⠉'], ['e', '⠋'], ['o', '⠊']]],
    ['k-', [['ka', '⠡'], ['ki', '⠣'], ['ku', '⠩'], ['ke', '⠫'], ['ko', '⠪']]],
    ['s-', [['sa', '⠱'], ['shi', '⠳'], ['su', '⠹'], ['se', '⠻'], ['so', '⠺']]],
  ],
};

export const SYSTEMS = [
  { group: 'English', items: [
    ['Unified English Braille (UEB)', 'Canada, US, UK, Australia, NZ, South Africa…', 'The current English standard since the 2000s–2010s. Grade 1 (uncontracted) and Grade 2 (contracted). Covers literary text, maths and computer notation in one code.'],
    ['English Braille American Edition (EBAE)', 'US & Canada (until 2010s)', 'The previous North American code. Still on many older signs. UEB dropped nine of its contractions: ble, com, dd, ally, ation, by, into, to, o’clock.'],
    ['Nemeth Code', 'US & Canada (maths)', 'A dedicated maths and science code from 1952. Digits sit in the lower part of the cell. Canada and the US allow Nemeth alongside UEB for technical material.'],
    ['Grade 3 / personal shorthand', 'Note-taking', 'Heavily abbreviated personal systems used by experienced readers. Not standardised.'],
  ]},
  { group: 'Other Latin-script languages', items: [
    ['French (CBFU)', 'France, Quebec, French Canada, Belgium, Switzerland…', 'Intégral (uncontracted) and abrégé (contracted). Own accents and Antoine numbers.'],
    ['Spanish', 'Spain, Latin America', 'Uncontracted in everyday use. Capital sign ⠨, ñ is ⠻.'],
    ['German', 'Germany, Austria, Switzerland', 'Vollschrift (full), Kurzschrift (contracted). Capitals usually not marked.'],
    ['Italian, Portuguese, Dutch, Nordic…', 'Europe & beyond', 'Each adapts the same 26-letter base with its own accented letters and punctuation.'],
  ]},
  { group: 'Other scripts', items: [
    ['Cyrillic (Russian, Ukrainian…)', 'Eastern Europe, Central Asia', 'Letters mapped by sound to Latin cells where possible.'],
    ['Greek', 'Greece, Cyprus', 'Also used inside UEB/Nemeth for Greek letters in maths.'],
    ['Arabic', 'Middle East, North Africa', 'Print reads right-to-left, but Arabic braille is read left-to-right.'],
    ['Hebrew', 'Israel', 'Also read left-to-right in braille.'],
    ['Bharati', 'India, Nepal, Sri Lanka, Bangladesh', 'One shared system for Hindi, Bengali, Tamil, Telugu and more: the same sound gets the same cell across scripts.'],
    ['Japanese (tenji)', 'Japan', 'Kana-based (syllables). An 8-dot Kanji braille exists but is rare.'],
    ['Korean (Hangul braille)', 'South Korea', 'Built from Hangul jamo; initial and final consonants have different cells.'],
    ['Chinese braille', 'Mainland China, Taiwan, Hong Kong', 'Syllable-based: initial + final (+ tone). Mainland has “Current Braille” and the newer National Common Braille (2018); Taiwan and Cantonese use their own systems.'],
    ['Thai, Vietnamese, Ethiopic, Tibetan…', 'Many more', 'Most writing systems now have a braille code, usually coordinated through UNESCO / World Blind Union work.'],
  ]},
  { group: 'Special-purpose codes', items: [
    ['Music braille', 'International', 'Notes, durations and octaves in 6-dot cells. Read one hand at a time.'],
    ['Computer braille / 8-dot', 'Refreshable displays', 'Adds dots 7 and 8 so each cell can stand for one ASCII character. Common on electronic braille displays.'],
    ['IPA braille', 'Linguistics', 'Phonetic symbols for pronunciation.'],
    ['Chess, knitting, other notations', 'Hobbies', 'Specialist codes from braille authorities.'],
  ]},
  { group: 'Tactile, but not braille', items: [
    ['Moon type', 'UK (1845)', 'Simplified raised print-like shapes. Easier to learn later in life; still used by some.'],
    ['Night writing (Barbier)', 'France (1810s)', 'A 12-dot military code; Louis Braille simplified it into the 6-dot cell.'],
    ['Tactile paving', 'Worldwide (Japan, 1965)', 'Bumps (stop/caution) and bars (direction) underfoot — not text, but part of the same world you’ll be reading.'],
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
    name: 'Canada · Ontario',
    code: 'en',
    facts: [
      ['Code', 'Unified English Braille, Grade 2 (contracted). Older signs (before about 2015) may be in EBAE — letters and most contractions are the same, but capital signs are often missing.'],
      ['Rules', 'Ontario’s AODA standards and the Ontario Building Code set where accessible signs go; the CSA B651 standard describes how tactile signs are made: raised print, with braille directly below it.'],
      ['Where to reach', 'Room signs sit on the wall beside the door, on the latch (handle) side, roughly at shoulder height (about 1.2–1.5 m). That way you never stand in the door’s swing.'],
      ['Elevators', 'Raised floor numbers with braille are on both sides of the door frame outside, and to the left of each button inside. A ★ star marks the main / street floor.'],
      ['Bilingual', 'Federal buildings and some Ottawa signage add French braille (CBFU) under the English.'],
      ['Money', 'Canadian $5–$100 notes have raised 6-dot clusters in the top corner: 1 cluster = $5, 2 = $10, 3 = $20, 4 = $50, 5 = $100. They’re not letters, but they’re braille-cell sized.'],
    ],
    signs: ['Washroom', 'Men', 'Women', 'Exit', 'Stairs', 'Room 101', 'Elevator', 'Main floor', 'Information', 'Fire alarm'],
    bilingual: [['Exit', 'Sortie'], ['Washroom', 'Toilettes'], ['Elevator', 'Ascenseur']],
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
  },
  eu: {
    name: 'Europe (EU)',
    code: 'fr',
    facts: [
      ['Code', 'Each country uses braille in its own language — French, German, Spanish and so on. Try the language tabs in Reference.'],
      ['Medicine', 'Since 2004 an EU directive requires the medicine name in braille on packaging.'],
      ['Elevators', 'Lift standard EN 81-70 calls for tactile buttons; braille next to them is common.'],
      ['Transit', 'Train and metro stations often put braille on handrails, giving the platform or exit direction.'],
    ],
    signs: ['Sortie', 'Toilettes', 'Ascenseur'],
    signLang: 'fr',
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
    signs: ['Toilet', 'Exit', 'Lift'],
  },
};
export { cellsOf };
