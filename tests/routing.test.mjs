// Exercises the real matchCase() from lib/routing.js — the single engine both entry paths call.
import { matchCase } from '../lib/routing.js';

const LINCOLN = 'A fictional intersection near Fictional Lincoln Heights Elementary, on a city street';
const MAPLE = 'A fictional crossing on Fictional State Route 42, next to Fictional Maple Ridge Middle School';
const SIGNAL = 'Traffic signal / walk signal is dark or not changing';
const BEACON = 'School-zone flashing beacon is not flashing or is stuck on';
const BUTTON = 'Pedestrian push button does nothing';
const YES = 'Yes — it is a school-zone crossing';

const cases = [
  ['US1 municipal chip',          LINCOLN, SIGNAL, YES, 'CASE-03'],
  ['US2 state-route chip',        MAPLE,   BEACON, YES, 'CASE-03B'],
  ['US1 free text',               'the crosswalk signal at the intersection by lincoln heights elementary', SIGNAL, YES, 'CASE-03'],
  ['US2 free text',               'the crossing on state route 42 by the middle school', BEACON, YES, 'CASE-03B'],
  ['US3 unknown place + signal',  'the light by the Walmart', SIGNAL, YES, null],
  ['US3 unknown place + beacon',  'somewhere downtown maybe', BEACON, YES, null],
  ['US3 empty location',          '', SIGNAL, YES, null],
  ['US3 vague',                   'a school',  BUTTON, YES, null],
  ['municipal chip + beacon',     LINCOLN, BEACON, YES, 'CASE-03'],
  ['state chip + signal',         MAPLE,   SIGNAL, YES, 'CASE-03B'],
  // Context-only input: equipment and school zone answered, location empty or unrelated — never a match.
  ['context-only, empty location',      '', SIGNAL, YES, null],
  ['context-only, unrelated location',  'somewhere near a park', BEACON, YES, null],
  // A tie means the description does not distinguish the cases — decline, never guess.
  ['equally-matching input ties',       'lincoln heights state route', BUTTON, YES, null],
];

let fail = 0;
for (const [name, location, equipment, schoolZone, expected] of cases) {
  const got = matchCase({ location, equipment, schoolZone });
  const ok = got.case_id === expected;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(36)} expected=${String(expected).padEnd(9)} got=${String(got.case_id).padEnd(9)} score=${got.score}`);
}
console.log(fail === 0 ? '\nAll routing assertions passed.' : `\n${fail} FAILING`);
process.exit(fail === 0 ? 0 : 1);
