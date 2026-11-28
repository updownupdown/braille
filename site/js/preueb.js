// Pre-UEB braille (EBAE): what differs from the UEB the app teaches, for reading older books and signs.
// Examples are written out by hand as tokens, separated by spaces: "cells=print" (an indicator when print starts with ^),
// plain lowercase letters spelled one cell each, and _ for a space. tests/preueb.test.mjs checks every example
// against liblouis's EBAE table (en-us-g2.ctb) where liblouis is installed.
import { LETTERS } from './braille.js';

export function ebaeParts(spec) {
  return spec.split(' ').flatMap((tok) => {
    if (tok === '_') return [{ cells: '⠀', print: ' ', kind: 'space', note: '' }];
    const i = tok.indexOf('=');
    if (i < 0) return [...tok].map((l) => ({ cells: LETTERS[l], print: l, kind: 'letter', note: '' }));
    const cells = tok.slice(0, i), print = tok.slice(i + 1);
    if (print.startsWith('^')) return [{ cells, print: print === '^number' ? '#' : '', kind: 'indicator', note: print.slice(1) }];
    const kind = /^[0-9]+$/.test(print) ? 'digit' : /^[a-z]$/i.test(print) ? 'letter' : /^[^a-z0-9]+$/i.test(print) ? 'punct' : 'contraction';
    return [{ cells, print, kind, note: '' }];
  });
}
export const ebaeCells = (spec) => ebaeParts(spec).map((p) => p.cells).join('');

// The nine contractions UEB dropped: cells, print, where they go, what the cells mean in UEB.
export const DROPPED = [
  ['⠼', 'ble', 'Inside or at the end of a word, never first. In UEB this cell is only the number sign.'],
  ['⠤', 'com', 'Only at the start of a word, as in “compute” and even “come”. In UEB it’s a hyphen.'],
  ['⠲', 'dd', 'Only in the middle of a word. In UEB it’s a period.'],
  ['⠠⠝', 'ation', 'After other letters. In UEB it reads as a capital N.'],
  ['⠠⠽', 'ally', 'After other letters. In UEB it reads as a capital Y.'],
  ['⠕⠄⠉', 'o’clock', 'The whole word. UEB spells out “clock”.'],
  ['⠖', 'to', 'Joined to the next word. In UEB it’s an exclamation mark.'],
  ['⠔⠖', 'into', 'Joined to the next word. UEB keeps the “in” sign and spells out “to”.'],
  ['⠴', 'by', 'Joined to the next word. Alone it’s “was” in both codes; in UEB after a word it closes a quote.'],
];

// Punctuation that changed: name, print, pre-UEB cells, UEB cells, note.
export const PUNCT = [
  ['Opening parenthesis', '(', '⠶', '⠐⠣', 'One cell both opens and closes. Alone in UEB it means “were”.'],
  ['Closing parenthesis', ')', '⠶', '⠐⠜', ''],
  ['Opening bracket', '[', '⠠⠶', '⠨⠣', ''],
  ['Closing bracket', ']', '⠶⠄', '⠨⠜', ''],
  ['Dash', '—', '⠤⠤', '⠠⠤', 'Two hyphens, with no space either side.'],
  ['Long dash', '——', '⠤⠤⠤⠤', '⠐⠠⠤', 'Four hyphens.'],
  ['Ellipsis', '…', '⠄⠄⠄', '⠲⠲⠲', 'Three apostrophe cells instead of three periods.'],
  ['Opening single quote', '‘', '⠠⠦', '⠠⠦', 'The same in both.'],
  ['Closing single quote', '’', '⠴⠄', '⠠⠴', ''],
  ['Asterisk', '*', '⠔⠔', '⠐⠔', ''],
  ['Decimal point', '.', '⠨', '⠲', 'Inside a number only. In UEB a decimal point is a period.'],
  ['Accent', 'é', '⠈', '⠘⠌', 'One sign before the letter, for any accent. UEB has one for each accent (acute shown).'],
];

// Example cards: print, pre-UEB tokens, note, and optionally UEB tokens (otherwise the app's UEB translator)
// and the text given to liblouis when it differs from print.
export const EX = {
  gone: [
    { p: 'table', e: 'ta ⠼=ble', n: '“ble” at the end of a word.' },
    { p: 'compute', e: '⠤=com pute', n: 'A hyphen cell starting a word is “com”.' },
    { p: 'middle', e: 'mi ⠲=dd le', n: 'A period cell inside a word is “dd”.' },
    { p: 'nation', e: 'n ⠠⠝=ation', n: 'A capital N after small letters is “ation”.' },
    { p: 'really', e: 're ⠠⠽=ally', n: 'A capital Y after small letters is “ally”.' },
    { p: 'at 3 o’clock', e: 'at _ ⠼=^number ⠉=3 _ ⠕⠄⠉=o’clock', n: '', lou: "at 3 o'clock" },
  ],
  join: [
    { p: 'go to the park', e: '⠛=go _ ⠖=to ⠮=the _ p ⠜=ar k', n: '“to” sits against “the”.' },
    { p: 'come into the house', e: '⠤=com e _ ⠔⠖=into ⠮=the _ h ⠳=ou se', n: '“into” is joined too, and “come” uses “com”.' },
    { p: 'by the sea', e: '⠴=by ⠮=the _ sea', n: 'Joined to a word, this cell is “by”.' },
    { p: 'one of the best', e: '⠐⠕=one _ ⠷=of ⠮=the _ be ⠌=st', n: '“of” and “the” run together.' },
    { p: 'with a smile', e: '⠾=with ⠁=a _ smile', n: '“a” joins “with” as well.' },
    { p: 'to be', e: '⠖=to be', n: '“be” is spelled out: its one-cell sign would make two lower cells in a row.' },
    { p: 'went to.', e: 'w ⠢=en t _ to ⠲=.', n: 'With nothing after it but punctuation, “to” is spelled out.' },
  ],
  punct: [
    { p: '(see page 5)', e: '⠶=( see _ page _ ⠼=^number ⠑=5 ⠶=)', n: 'The same cell on both sides.' },
    { p: '[sic]', e: '⠠⠶=[ sic ⠶⠄=]', n: '' },
    { p: 'yes—no', e: 'yes ⠤⠤=— no', n: '' },
    { p: 'wait…', e: 'wait ⠄⠄⠄=…', n: '', lou: 'wait...' },
    { p: 'note*', e: 'note ⠔⠔=*', n: '' },
    { p: 'café', e: 'caf ⠈=^accent e', n: 'The accent sign goes before the letter it marks.' },
  ],
  num: [
    { p: '3.5', e: '⠼=^number ⠉=3 ⠨=. ⠑=5', n: '' },
    { p: '4:30', e: '⠼=^number ⠙=4 ⠒=: ⠉⠚=30', n: 'One number sign covers the whole time.' },
    { p: '555-1234', e: '⠼=^number ⠑⠑⠑=555 ⠤=- ⠁⠃⠉⠙=1234', n: 'The number carries on after the hyphen.' },
  ],
  caps: [
    { p: 'ONE TWO THREE', e: '⠠⠠=^capitals ⠐⠕=one _ ⠠⠠=^capitals two _ ⠠⠠=^capitals ⠹=th ree', n: 'Each word gets its own double capital sign. There is no passage sign and no end sign.' },
    { p: 'Stop (in italics)', e: '⠨=^italic ⠠=^capital ⠌=st op', u: '⠨⠆=^italic ⠠=^capital ⠌=st op', n: 'One italic sign before the word.', lou: 'Stop', loux: '⠨' },
    { p: 'read this book now (in italics)', e: '⠨⠨=^italics r ⠂=ea d _ ⠹=this _ book _ ⠨=^italic n ⠪=ow', u: '⠨⠶=^italics r ⠂=ea d _ ⠹=this _ book _ n ⠪=ow ⠨⠄=^end', n: 'Two italic signs start the passage; one more goes before its last word, not after it.', lou: 'read this book now', loux: 'passage' },
  ],
  sent: [
    { p: 'He went into the house by the back door.', e: '⠠=^capital he _ w ⠢=en t _ ⠔⠖=into ⠮=the _ h ⠳=ou se _ ⠴=by ⠮=the _ back _ door ⠲=.', n: 'Two joined words: “into the” and “by the”.' },
    { p: 'Add the eggs and the milk to the bowl.', e: '⠠=^capital add _ ⠮=the _ e ⠶=gg s _ ⠯=and ⠮=the _ milk _ ⠖=to ⠮=the _ b ⠪=ow l ⠲=.', n: '“Add” keeps both d’s: “dd” never ends a word.' },
    { p: 'Mix 2.5 cups (as noted) at 4:30.', e: '⠠=^capital mix _ ⠼=^number ⠃=2 ⠨=. ⠑=5 _ cups _ ⠶=( ⠵=as _ not ⠫=ed ⠶=) _ at _ ⠼=^number ⠙=4 ⠒=: ⠉⠚=30 ⠲=.', n: 'Old decimal point, parentheses and time.' },
    { p: 'It was possible, really.', e: '⠠=^capital ⠭=it _ ⠴=was _ possi ⠼=ble ⠂=, _ re ⠠⠽=ally ⠲=.', n: 'Standing alone, the “by” cell is “was”.' },
  ],
};
