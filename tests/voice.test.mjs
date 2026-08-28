// Unit tests for the pure functions in lib/voice.js. No DOM: jsdom implements neither half of the
// Web Speech API, so voice logic is tested here directly (research R11); the degradation path (no
// speech APIs present) is covered separately in tests/e2e.test.mjs.
import { parseCommand, matchSpokenPhrase, speechTextFor, rankVoices } from '../lib/voice.js';

let failures = 0;
function check(name, cond, detail = '') {
  if (!cond) failures++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : `   <-- ${detail}`}`);
}

/* ---------- parseCommand ---------- */

const COMMAND_TABLE = [
  ['repeat', ['repeat', 'repeat that', 'say that again', 'again', 'what was that']],
  ['back', ['back', 'go back', 'previous', 'change that', 'last question']],
  ['restart', ['start over', 'restart', 'reset', 'begin again']],
  ['confirm', ['confirm', 'yes show me', 'show me', 'that is right', 'correct']],
  ['stop', ['stop listening', 'turn off voice']],
];

for (const [intent, phrases] of COMMAND_TABLE) {
  for (const phrase of phrases) {
    check(`parseCommand("${phrase}") -> ${intent}`, parseCommand(phrase) === intent);
  }
}
check('parseCommand ignores unrelated speech', parseCommand('the light by the walmart is broken') === null);
check('parseCommand ignores bare "yes"', parseCommand('yes') === null,
  'bare "yes" must not globally hijack a choice step\'s own "Yes" answer');

/* ---------- matchSpokenPhrase ---------- */

const EQUIPMENT_STEP = {
  type: 'choices',
  choices: [
    { value: 'signal', label: 'Traffic or walk signal', synonyms: ['signal', 'walk signal', 'stoplight'] },
    { value: 'beacon', label: 'Flashing school-zone beacon', synonyms: ['beacon', 'flashing beacon', 'flashing light'] },
    { value: 'button', label: 'Pedestrian push button', synonyms: ['button', 'push button'] },
    { value: 'other', label: 'Something else', synonyms: ['something else', 'other'] },
  ],
};

const TEXT_STEP = {
  type: 'text-with-choices',
  choices: [
    { value: 'lincoln', label: 'Fictional Lincoln Heights Elementary — city street', synonyms: ['lincoln heights', 'lincoln'] },
    { value: 'maple', label: 'Fictional Maple Ridge Middle — State Route 42', synonyms: ['maple ridge', 'state route 42'] },
  ],
};

check('exact label match selects the choice',
  matchSpokenPhrase('Traffic or walk signal', EQUIPMENT_STEP).kind === 'choice' &&
  matchSpokenPhrase('Traffic or walk signal', EQUIPMENT_STEP).value === 'signal');

check('synonym match selects the choice',
  matchSpokenPhrase('the beacon is stuck on', EQUIPMENT_STEP).value === 'beacon');

check('ordinal form selects by position',
  matchSpokenPhrase('the first one', EQUIPMENT_STEP).value === 'signal');
check('ordinal "number two" selects by position',
  matchSpokenPhrase('number two', EQUIPMENT_STEP).value === 'beacon');

const ambiguous = matchSpokenPhrase('the signal or beacon is broken', EQUIPMENT_STEP);
check('phrase matching two choices is ambiguous, never a guess', ambiguous.kind === 'ambiguous',
  JSON.stringify(ambiguous));

check('gibberish on a choice-only step is unmatched',
  matchSpokenPhrase('asdkjfh qqzzxx', EQUIPMENT_STEP).kind === 'unmatched');

check('unmatched free speech on a text-with-choices step falls through to text',
  matchSpokenPhrase('a crossing near the old mill', TEXT_STEP).kind === 'text');

/* ---------- speechTextFor ---------- */

const QUESTION_STEP = {
  type: 'choices',
  question: 'What looks broken?',
  help: 'Pick the closest match. This changes which office is likely to hold the equipment.',
  choices: EQUIPMENT_STEP.choices,
};

const speech = speechTextFor(QUESTION_STEP);
check('speechTextFor includes the question', speech.includes('What looks broken?'));
for (const c of EQUIPMENT_STEP.choices) {
  check(`speechTextFor includes choice "${c.label}"`, speech.includes(c.label));
}
check('speechTextFor excludes help/disclaimer text', !speech.includes('likely to hold the equipment'));

const CONFIRM_STEP = {
  type: 'confirm',
  question: 'Does this look right?',
  speechGuidance: 'Say yes to see the recommended first contact, or say back to change an answer.',
};
const confirmSpeech = speechTextFor(CONFIRM_STEP);
check('confirm step speech includes the question', confirmSpeech.includes('Does this look right?'));
check('confirm step speech excludes page banners/disclaimers',
  !confirmSpeech.toLowerCase().includes('synthetic') && !confirmSpeech.toLowerCase().includes('nothing is sent'));

/* ---------- rankVoices ---------- */

const voices = [
  { name: 'Compact Voice', lang: 'en-US', localService: true },
  { name: 'Samantha (Enhanced)', lang: 'en-US', localService: true },
  { name: 'Google UK English Neural', lang: 'en-GB', localService: false },
];
const ranked = rankVoices(voices);
check('rankVoices prefers a Neural/Natural voice over a Compact one',
  ranked[0].name !== 'Compact Voice', ranked.map((v) => v.name).join(', '));
check('rankVoices never throws on an empty list', JSON.stringify(rankVoices([])) === '[]');
check('rankVoices never throws on undefined', JSON.stringify(rankVoices(undefined)) === '[]');

console.log(failures === 0 ? '\nAll voice assertions passed.' : `\n${failures} FAILING`);
process.exit(failures === 0 ? 0 : 1);
