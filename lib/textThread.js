/**
 * lib/textThread.js — the simulated text-message entry path.
 *
 * A SIMULATION. This module sends nothing, connects to nothing, and performs no network access of
 * any kind (FR-017, Constitution II). It exists to demonstrate what texting the service would feel
 * like. It performs no matching of its own — pinpointing answers are assembled into an AnswerRecord
 * of the same shape the question path uses and handed to matchCase() from lib/routing.js, so both
 * entry paths share one routing rule (FR-030, SC-015).
 */

import { matchCase, getCase } from './routing.js';

export const SHORT_CODE = 'XING-DEMO';
export const TRIGGER_WORD = 'CROSSING';

const PINPOINT_QUESTIONS = [
  {
    field: 'school',
    prompt: "What's the nearest school to this crossing?",
  },
  {
    field: 'streets',
    prompt: 'What are the cross streets, or the road it’s on?',
  },
  {
    field: 'equipment',
    prompt: "What looks wrong with it — a signal, a beacon, a push button, or something else?",
  },
];

function seedMessage() {
  return {
    from: 'service',
    text: `Text ${TRIGGER_WORD} to the demo short code ${SHORT_CODE} to start. ` +
      'This is a prototype — the short code is not a live phone number and nothing is actually sent.',
    ts: 'now',
  };
}

function defaultAnswers() {
  return { location: '', equipment: '', schoolZone: '', danger: null };
}

function declineText() {
  return "I don't have enough to route this, and I'm not going to guess. What I described doesn't " +
    'clearly match a synthetic case I hold — try again with a nearby school name and what looks ' +
    'broken (a signal or a beacon).';
}

function routedText(c) {
  const phone = c.agencies.find((a) => a.role === 'primary')?.contact_phone;
  return `${c.text_summary}${phone ? ` You can reach them at ${phone} (fictional number — this tool will not call it).` : ''}`;
}

export function createThread() {
  let messages = [seedMessage()];
  let stage = 'trigger';
  let pinpointIndex = 0;
  let answers = defaultAnswers();
  let matchedCaseId = null;

  const listeners = new Set();

  function notify() {
    const state = getState();
    for (const fn of listeners) fn(state);
  }

  function getState() {
    return {
      messages: messages.map((m) => ({ ...m })),
      stage,
      pinpointIndex,
      answers: { ...answers },
      matchedCaseId,
    };
  }

  function push(from, text) {
    messages.push({ from, text, ts: 'now' });
  }

  function advancePinpoint(text) {
    const q = PINPOINT_QUESTIONS[pinpointIndex];
    if (q.field === 'school') {
      answers.location = text.trim();
    } else if (q.field === 'streets') {
      answers.location = `${answers.location} ${text.trim()}`.trim();
      answers.schoolZone = 'Yes — it is a school-zone crossing';
    } else if (q.field === 'equipment') {
      answers.equipment = text.trim();
    }
    pinpointIndex++;

    if (pinpointIndex < PINPOINT_QUESTIONS.length) {
      push('service', PINPOINT_QUESTIONS[pinpointIndex].prompt);
      return;
    }

    const result = matchCase(answers);
    matchedCaseId = result.case_id;
    stage = 'routed';
    if (matchedCaseId) {
      push('service', routedText(getCase(matchedCaseId)));
    } else {
      push('service', declineText());
    }
  }

  function send(text) {
    const trimmed = String(text ?? '').trim();
    if (!trimmed) return;

    if (stage === 'trigger') {
      push('resident', trimmed);
      if (trimmed.toUpperCase() === TRIGGER_WORD) {
        push('service', 'Thanks — this is a prototype and nothing is actually sent. ' +
          "Let's pinpoint the crossing.");
        stage = 'pinpoint';
        pinpointIndex = 0;
        push('service', PINPOINT_QUESTIONS[0].prompt);
      } else {
        push('service', `Text ${TRIGGER_WORD} to get started. (Demo short code ${SHORT_CODE} — not a live number.)`);
      }
      notify();
      return;
    }

    if (stage === 'pinpoint') {
      push('resident', trimmed);
      advancePinpoint(trimmed);
      notify();
      return;
    }

    // stage === 'routed': the exchange is complete; nothing further advances it.
    push('resident', trimmed);
    push('service', 'This exchange is complete. Use restart to try another crossing.');
    notify();
  }

  function restart() {
    messages = [seedMessage()];
    stage = 'trigger';
    pinpointIndex = 0;
    answers = defaultAnswers();
    matchedCaseId = null;
    notify();
  }

  function jumpToCase(caseId) {
    restart();
    const c = getCase(caseId);
    if (!c) return;
    matchedCaseId = c.case_id;
    stage = 'routed';
    push('service', `Presenter shortcut — jumped directly to a resolved case.`);
    push('service', routedText(c));
    notify();
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return { getState, send, restart, jumpToCase, subscribe };
}
