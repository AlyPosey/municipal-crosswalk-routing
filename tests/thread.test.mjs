// Unit tests for lib/textThread.js — the simulated text-message entry path.
import { createThread, TRIGGER_WORD } from '../lib/textThread.js';
import { createConversation } from '../lib/conversation.js';
import { matchCase } from '../lib/routing.js';
import { CASES, getCase } from '../data/cases.js';

let failures = 0;
function check(name, cond, detail = '') {
  if (!cond) failures++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : `   <-- ${detail}`}`);
}

function allText(state) {
  return state.messages.map((m) => m.text).join(' \n ');
}

/* ---------- cold start to routed reply, at least two catalog cases ---------- */

function walkThread(school, streets, equipment) {
  const t = createThread();
  t.send(TRIGGER_WORD);
  t.send(school);
  t.send(streets);
  t.send(equipment);
  return t.getState();
}

const lincolnState = walkThread(
  'Fictional Lincoln Heights Elementary',
  'on a city street',
  'Traffic signal / walk signal is dark or not changing'
);
check('US1 catalog case reachable through the thread', lincolnState.matchedCaseId === 'CASE-03',
  `got ${lincolnState.matchedCaseId}`);
check('US1 routed reply names the agency, pending confirmation',
  allText(lincolnState).includes('pending human confirmation') &&
  allText(lincolnState).includes('Fictional City of Lincoln Heights'));

const mapleState = walkThread(
  'Fictional Maple Ridge Middle School',
  'on Fictional State Route 42',
  'School-zone flashing beacon is not flashing or is stuck on'
);
check('US2 catalog case reachable through the thread', mapleState.matchedCaseId === 'CASE-03B',
  `got ${mapleState.matchedCaseId}`);

/* ---------- non-trigger first message ---------- */

const stray = createThread();
stray.send('hello is anyone there');
let state = stray.getState();
check('non-trigger message stays in trigger stage', state.stage === 'trigger');
check('non-trigger reply tells the resident what to send',
  state.messages.at(-1).text.includes(TRIGGER_WORD));
check('non-trigger message is never recorded as an answer',
  state.answers.location === '' && state.answers.equipment === '');

/* ---------- unmatchable description declines ---------- */

const declined = walkThread('a random place', 'somewhere', 'not sure what is wrong');
check('unmatchable description reaches the decline outcome', declined.matchedCaseId === null);
check('decline outcome names no agency',
  !CASES.some((c) => allText(declined).includes(c.agencies.find((a) => a.role === 'primary').name)));

/* ---------- restart ---------- */

const rt = createThread();
rt.send(TRIGGER_WORD);
rt.send('some school');
rt.restart();
state = rt.getState();
check('restart returns to trigger stage', state.stage === 'trigger');
check('restart empties answers', state.answers.location === '' && state.answers.equipment === '');
check('restart clears matchedCaseId', state.matchedCaseId === null);
check('restart leaves exactly the seed message', state.messages.length === 1);

/* ---------- jumpToCase mid-exchange ---------- */

const jt = createThread();
jt.send(TRIGGER_WORD);
jt.send('Fictional Lincoln Heights Elementary');
jt.jumpToCase('CASE-03B');
state = jt.getState();
check('jumpToCase clears prior in-progress answers', state.answers.location === '');
check('jumpToCase lands on the requested case', state.matchedCaseId === 'CASE-03B');
check('jumpToCase reaches routed stage', state.stage === 'routed');

/* ---------- parity: thread path vs question path, equivalent input ---------- */

const conv = createConversation([
  { key: 'location' }, { key: 'equipment' }, { key: 'schoolZone' }, { key: 'danger' },
]);
conv.setAnswer('location', 'A fictional intersection near Fictional Lincoln Heights Elementary, on a city street');
conv.setAnswer('equipment', 'Traffic signal / walk signal is dark or not changing');
conv.setAnswer('schoolZone', 'Yes — it is a school-zone crossing');
conv.setAnswer('danger', false);
const viaConversation = matchCase(conv.getState().answers);

const viaThread = walkThread(
  'Fictional Lincoln Heights Elementary',
  'on a city street',
  'Traffic signal / walk signal is dark or not changing'
);
check('parity: same case_id from both paths', viaThread.matchedCaseId === viaConversation.case_id,
  `thread=${viaThread.matchedCaseId} conversation=${viaConversation.case_id}`);

const caseFromThread = getCase(viaThread.matchedCaseId);
const caseFromConversation = getCase(viaConversation.case_id);
check('parity: same evidence set from both paths',
  JSON.stringify(caseFromThread?.agencies) === JSON.stringify(caseFromConversation?.agencies));

/* ---------- content scan: no owner string, no real place names ---------- */

const fullCatalogText = CASES.map((c) => JSON.stringify(c)).join(' ');
const threadSurfaceText = [lincolnState, mapleState, declined, state].map(allText).join(' ');

check('no "owner" string in the rendered text path', !/\bowner\b/i.test(threadSurfaceText));
check('no "owner" string anywhere in the catalog data', !/\bowner\b/i.test(fullCatalogText));
check('no real school/community/agency name in the thread surface (Birmingham, Jefferson)',
  !/\bBirmingham\b/i.test(threadSurfaceText.replace(/https?:\/\/\S+/g, '')) &&
  !/\bJefferson\b/i.test(threadSurfaceText.replace(/https?:\/\/\S+/g, '')));

console.log(failures === 0 ? '\nAll thread assertions passed.' : `\n${failures} FAILING`);
process.exit(failures === 0 ? 0 : 1);
