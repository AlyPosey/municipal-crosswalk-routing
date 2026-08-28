/**
 * Jurisdiction Junction — school-zone crosswalk routing assistant.
 *
 * Constitution III (no invented ownership) is enforced structurally here:
 * the routing step may only ever produce a `case_id` that exists in the local catalog, or the
 * string "unresolved". Every agency name, role, evidence string, link, gap, next action, and call
 * script rendered below is read from data/cases.js. No model-generated prose reaches the DOM.
 *
 * State lives in two small modules, not here: lib/conversation.js owns the question path's
 * position/answers split, and lib/textThread.js owns the simulated text-message exchange. Both
 * call the single shared match engine in lib/routing.js, so the two entry paths can never diverge
 * (FR-030, SC-015). This file is boot, wiring, and rendering only.
 */

import { CASES, getCase, SOURCE_CHECKED } from './data/cases.js';
import { matchCase } from './lib/routing.js';
import { createConversation } from './lib/conversation.js';
import { createThread } from './lib/textThread.js';
import { createVoice } from './lib/voice.js';

const $ = (id) => document.getElementById(id);

/** Escape anything that could originate outside this file before it touches innerHTML. */
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let liveMode = false;   // true only once /api/health answers successfully

/* ------------------------------------------------------------------ *
 * Conversation definition — five questions, no personal identifiers
 * ------------------------------------------------------------------ */

const STEPS = [
  {
    key: 'location',
    question: 'Which crossing are we talking about?',
    help:
      'Pick one of the two synthetic scenarios, or describe a fictional crossing in your own words. ' +
      'Please do not enter a real home address.',
    type: 'text-with-choices',
    choices: [
      { value: 'A fictional intersection near Fictional Lincoln Heights Elementary, on a city street',
        label: 'Fictional Lincoln Heights Elementary — city street',
        synonyms: ['lincoln heights', 'lincoln', 'lincoln heights elementary'] },
      { value: 'A fictional crossing on Fictional State Route 42, next to Fictional Maple Ridge Middle School',
        label: 'Fictional Maple Ridge Middle — State Route 42',
        synonyms: ['maple ridge', 'maple ridge middle', 'state route 42', 'route 42'] },
    ],
    placeholder: 'e.g. the crossing on the state route by the middle school',
  },
  {
    key: 'equipment',
    question: 'What looks broken?',
    help: 'Pick the closest match. This changes which office is likely to hold the equipment.',
    type: 'choices',
    choices: [
      { value: 'Traffic signal / walk signal is dark or not changing', label: 'Traffic or walk signal',
        synonyms: ['signal', 'walk signal', 'stoplight', 'traffic light'] },
      { value: 'School-zone flashing beacon is not flashing or is stuck on', label: 'Flashing school-zone beacon',
        synonyms: ['beacon', 'flashing beacon', 'flashing light'] },
      { value: 'Pedestrian push button does nothing', label: 'Pedestrian push button',
        synonyms: ['push button', 'button'] },
      { value: 'Something else at the crossing', label: 'Something else',
        synonyms: ['something else', 'other'] },
    ],
  },
  {
    key: 'schoolZone',
    question: 'Is this crossing in or right next to a school zone?',
    help: 'School-zone equipment often involves a third party the city and state pages do not mention.',
    type: 'choices',
    choices: [
      { value: 'Yes — it is a school-zone crossing', label: 'Yes',
        synonyms: ['yes', 'school zone', 'it is a school zone'] },
      { value: 'No — not a school zone', label: 'No',
        synonyms: ['no', 'not a school zone'] },
      { value: 'Not sure', label: 'Not sure',
        synonyms: ['not sure', 'unsure', 'i do not know', 'dont know'] },
    ],
  },
  {
    key: 'danger',
    question: 'Right now, is anyone in immediate danger at this crossing?',
    help:
      'Injury, an active collision risk, or children crossing unsafely at this moment. ' +
      'This tool cannot call anyone for you — it will only show you safety guidance.',
    type: 'choices',
    choices: [
      { value: false, label: 'No — nobody is in danger right now',
        synonyms: ['no', 'nobody', 'no danger', 'safe'] },
      { value: true,  label: 'Yes — there is immediate danger or injury',
        synonyms: ['yes', 'danger', 'emergency', 'someone is hurt'] },
    ],
  },
];

const CONFIRM_STEP = {
  type: 'confirm',
  question: 'Does this look right?',
  speechGuidance:
    'Say confirm, or yes, to see the recommended first contact. Say back to change an answer, or ' +
    'start over to begin again.',
};

function displayValue(key, value) {
  if (key === 'danger') return value ? 'Yes — immediate danger reported' : 'No immediate danger';
  return value;
}

const conversation = createConversation(STEPS);

/* ------------------------------------------------------------------ *
 * Rendering the conversation
 * ------------------------------------------------------------------ */

function renderTranscript() {
  const items = conversation.summary().map(({ question, key, value }) =>
    `<li><span class="q">${esc(question)}</span><span class="a">${esc(displayValue(key, value))}</span></li>`
  ).join('');
  $('transcript').innerHTML = items;
}

let suppressFocus = false;

function renderStep(state, { takeFocus = true } = {}) {
  renderTranscript();
  $('step-back').disabled = !conversation.canGoBack();

  const controls = $('step-controls');
  controls.innerHTML = '';

  // ---- past the last question: summary + confirmation gate (Constitution IV) ----
  if (state.position >= STEPS.length) {
    $('step-count').textContent = 'Last step';
    $('step-question').textContent = 'Does this look right?';
    $('step-help').textContent =
      'Nothing is sent anywhere. Confirming just unlocks the recommendation below.';

    const summaryBlock = document.createElement('div');
    summaryBlock.id = 'confirm-summary';
    summaryBlock.className = 'confirm-summary';
    const list = document.createElement('ul');
    list.className = 'summary-list';
    list.innerHTML = conversation.summary().map(({ question, key, value }) =>
      `<li><span class="k">${esc(question)}</span><br>${esc(displayValue(key, value))}</li>`
    ).join('');
    summaryBlock.appendChild(list);
    controls.appendChild(summaryBlock);

    const actions = document.createElement('div');
    actions.id = 'confirm-actions';
    actions.className = 'confirm-actions';

    const go = document.createElement('button');
    go.type = 'button';
    go.id = 'confirm-primary';
    go.className = 'btn btn--primary btn--wide';
    go.textContent = 'Yes — show me who to contact first';
    go.addEventListener('click', runRouting);
    actions.appendChild(go);

    const back = document.createElement('button');
    back.type = 'button';
    back.id = 'confirm-secondary';
    back.className = 'btn btn--ghost btn--wide';
    back.textContent = 'No — let me answer again';
    back.addEventListener('click', () => conversation.back());
    actions.appendChild(back);

    controls.appendChild(actions);

    if (takeFocus) go.focus();
    return;
  }

  // ---- an ordinary question ----
  const step = STEPS[state.position];
  $('step-count').textContent = `Question ${state.position + 1} of ${STEPS.length}`;
  $('step-question').textContent = step.question;
  $('step-help').textContent = step.help;

  if (step.choices) {
    const box = document.createElement('div');
    box.className = 'choices';
    step.choices.forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn--choice';
      const isCurrent = state.answers[step.key] === c.value;
      b.setAttribute('aria-pressed', String(isCurrent));
      if (isCurrent) b.classList.add('is-current');
      b.textContent = c.label;
      b.addEventListener('click', () => conversation.setAnswer(step.key, c.value));
      box.appendChild(b);
    });
    controls.appendChild(box);
  }

  if (step.type === 'text-with-choices') {
    const label = document.createElement('label');
    label.className = 'field-label';
    label.htmlFor = 'free-text';
    label.textContent = 'Or describe it yourself (no real addresses, please)';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'free-text';
    input.placeholder = step.placeholder || '';
    input.autocomplete = 'off';
    const isChip = step.choices.some((c) => c.value === state.answers[step.key]);
    if (!isChip && state.answers[step.key]) input.value = state.answers[step.key];

    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'btn btn--wide';
    submit.textContent = 'Continue';
    const send = () => {
      const v = input.value.trim();
      if (v) conversation.setAnswer(step.key, v);
      else input.focus();
    };
    submit.addEventListener('click', send);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });

    controls.append(label, input, submit);
  }

  if (takeFocus) {
    const first = controls.querySelector('button, input');
    if (first && state.position > 0) first.focus();
  }
}

function render(state) {
  renderStep(state, { takeFocus: !suppressFocus });
  suppressFocus = false;
  $('result-panel').hidden = !state.resultVisible;
  if (voiceEnabled) voice.speakStep(currentVoiceStep(state));
}

/* ------------------------------------------------------------------ *
 * Routing — deterministic engine (lib/routing.js) is the floor; the model only ever selects
 * ------------------------------------------------------------------ */

/** Ask the local proxy, if one is there. Returns a case_id string or null. Never returns prose. */
async function routeViaServer(answers) {
  try {
    const res = await fetch('./api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: answers.location,
        equipment: answers.equipment,
        schoolZone: answers.schoolZone,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();

    // Constitution III: only a case_id that exists locally is honoured. Anything else is discarded.
    if (data && typeof data.case_id === 'string' && getCase(data.case_id)) {
      return data.case_id;
    }
    return null;
  } catch {
    return null;
  }
}

let lastResultSpeech = '';

async function runRouting() {
  $('step-controls').innerHTML = '<p>Working out who to send you to&hellip;</p>';

  const answers = conversation.getState().answers;
  let caseId = null;
  if (liveMode) caseId = await routeViaServer(answers);
  if (!caseId) caseId = matchCase(answers).case_id;   // deterministic floor

  const matched = caseId ? getCase(caseId) : null;
  renderResult(matched, answers);
  lastResultSpeech = matched
    ? `Recommended first contact, pending confirmation: ${matched.agencies.find((a) => a.role === 'primary').name}.`
    : "I don't have enough to route this, so I'm not going to guess.";

  suppressFocus = true;
  conversation.confirm();
  $('result-panel').hidden = false;
  const heading = $('result-heading');
  heading.focus();
  heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ------------------------------------------------------------------ *
 * Rendering the result — one evidence renderer, used by both entry paths (FR-024, R13)
 * ------------------------------------------------------------------ */

const NOTICES = `
  <div class="callout callout--note">
    <p><strong>Synthetic data.</strong> Every case, location, and agency named above is fictional.
    No real agency has reviewed, approved, or endorsed this routing.</p>
    <p><strong>Nothing was submitted.</strong> This tool did not file a ticket, send a referral, or
    contact anyone. Making the call is up to you.</p>
    <p><strong>Not a legal determination.</strong> Geographic boundaries alone do not decide who is
    legally responsible for a piece of equipment.</p>
  </div>`;

function dangerPanel() {
  return `
  <div class="callout callout--danger" role="alert">
    <h3>If someone is in danger right now, stop reading and act</h3>
    <p><strong>Call your local emergency number yourself, from your phone.</strong> This website
    cannot and will not place a call for you — not to 911, not to anyone.</p>
    <p>If it is safe to do so: keep children back from the curb, cross at a different controlled
    crossing, and treat the intersection as uncontrolled.</p>
    <p>The routing information below is still worth having — a broken signal still needs reporting —
    but it is not urgent help.</p>
  </div>`;
}

function agencyBlock(a) {
  const evidence = (a.evidence || []).map((e) =>
    `<li><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.label)}</a></li>`
  ).join('');

  return `
  <div class="agency agency--${esc(a.role)}">
    <span class="agency__role">${esc(a.role_label)}</span>
    <h4 class="agency__name">${esc(a.name)}</h4>
    <p>${esc(a.why_this_role)}</p>
    ${a.caveat ? `<p class="agency__caveat">${esc(a.caveat)}</p>` : ''}
    ${evidence ? `<ul class="agency__evidence">${evidence}</ul>` : ''}
  </div>`;
}

function unresolvedBlock() {
  const options = CASES.map((c) =>
    `<li>${esc(c.service_type)} — ${esc(c.synthetic_location)}</li>`).join('');

  return `
  <div class="callout callout--gap">
    <h3>I don&rsquo;t have enough to route this, and I&rsquo;m not going to guess</h3>
    <p>What you described doesn&rsquo;t clearly match a synthetic case I hold, and picking an
    agency anyway would be worse than saying so. Naming the wrong office is exactly the failure this
    tool exists to prevent.</p>
    <p><strong>What would help:</strong> whether the crossing is on a city street or a state-numbered
    route, and whether the broken equipment is a traffic signal or a flashing school-zone beacon.
    That single distinction is what moves the first call between the city and the state.</p>
  </div>
  <div class="result-section">
    <h3>Scenarios this prototype does cover</h3>
    <ul class="agency__evidence">${options}</ul>
    <p class="freshness">All synthetic. Use &ldquo;Start over&rdquo; to try one.</p>
  </div>`;
}

/** Shared by the question-path result and the text-path routed reply (FR-024, R13). */
function evidenceMarkup(c, prefix) {
  const primary = c.agencies.find((a) => a.role === 'primary');
  return `
    <div class="rec">
      <p class="rec__label">Recommended first contact — pending human confirmation</p>
      <h3 class="rec__name">${esc(primary.name)}</h3>
      <p class="rec__pending">
        This is a <strong>starting point, not an answer</strong>. It is where the evidence points
        first for a ${esc(c.service_type.toLowerCase())} in this situation. Nobody has confirmed that
        this office holds this specific equipment.
      </p>
      ${primary.contact_phone
        ? `<p class="rec__phone">Fictional number — this tool will not call it: <strong>${esc(primary.contact_phone)}</strong></p>`
        : ''}
    </div>

    <div class="result-section">
      <h3>All three roles, and why</h3>
      ${c.agencies.map(agencyBlock).join('')}
    </div>

    <div class="callout callout--gap">
      <h3>Where the public record actually breaks down</h3>
      <p>${esc(c.conflict_or_gap)}</p>
      <p><strong>Also worth knowing:</strong> ${esc(c.stale_or_conflicting)}</p>
      <p class="freshness">Reference sources last verified ${esc(c.source_checked)}.</p>
    </div>

    <div class="result-section">
      <h3>What to do next</h3>
      <p>${esc(c.next_action)}</p>
      <h4>Something to say when they pick up</h4>
      <div class="script" id="${prefix}-script-text">${esc(c.call_script)}</div>
      <button type="button" class="btn btn--ghost" id="${prefix}-copy-script">Copy this script</button>
    </div>

    <div class="callout callout--confirm">
      <h3>A person has to confirm this</h3>
      <p>${esc(c.confirmation_reason)} Ask them directly whether the equipment is on their
      maintenance list — and if it isn&rsquo;t, who holds it. That question is the point of this
      tool, not a formality.</p>
    </div>

    ${NOTICES}`;
}

function wireCopyScript(c, prefix) {
  const copy = $(`${prefix}-copy-script`);
  if (!copy) return;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(c.call_script);
      copy.textContent = 'Copied';
      setTimeout(() => { copy.textContent = 'Copy this script'; }, 2000);
    } catch {
      copy.textContent = 'Select the text above to copy';
    }
  });
}

function questionSummaryMarkup(answers) {
  return STEPS.map((s) =>
    `<li><span class="k">${esc(s.question)}</span><br>${esc(displayValue(s.key, answers[s.key]))}</li>`
  ).join('');
}

function renderResult(c, answers) {
  const out = $('result');
  const danger = answers.danger === true ? dangerPanel() : '';

  if (!c) {
    out.innerHTML = danger + unresolvedBlock() + NOTICES;
    return;
  }

  out.innerHTML = `
    ${danger}
    <div class="result-section">
      <h3>What you told me</h3>
      <ul class="summary-list">${questionSummaryMarkup(answers)}</ul>
      <p class="freshness">Matched to synthetic case <strong>${esc(c.case_id)}</strong> ·
        ${esc(c.road_context)}</p>
    </div>
    ${evidenceMarkup(c, 'result')}`;

  wireCopyScript(c, 'result');
}

/* ------------------------------------------------------------------ *
 * Mode probe — the banner must never let anyone mistake which path ran
 * ------------------------------------------------------------------ */

async function probeMode() {
  const banner = $('mode-banner');
  const text = $('mode-text');
  try {
    const res = await fetch('./api/health', { cache: 'no-store' });
    const data = await res.json();
    if (res.ok && data.claude === true) {
      liveMode = true;
      banner.classList.add('is-live');
      text.textContent = 'Live Claude routing — the model selects from the synthetic case catalog';
      return;
    }
    throw new Error('no live model');
  } catch {
    liveMode = false;
    banner.classList.add('is-sim');
    text.textContent = 'Simulated routing — deterministic matching, no live model call';
  }
}

/* ------------------------------------------------------------------ *
 * Entry-path switcher — exactly one conversation is active at a time (FR-032, R12)
 * ------------------------------------------------------------------ */

const TABS = [
  { tab: 'tab-questions', panel: 'panel-questions', name: 'questions' },
  { tab: 'tab-text', panel: 'panel-text', name: 'text' },
];

function selectTab(name) {
  for (const t of TABS) {
    const isActive = t.name === name;
    $(t.tab).setAttribute('aria-selected', String(isActive));
    $(t.tab).tabIndex = isActive ? 0 : -1;
    $(t.panel).hidden = !isActive;
  }
}

TABS.forEach(({ tab, name }, i) => {
  const btn = $(tab);
  btn.addEventListener('click', () => selectTab(name));
  btn.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length];
    $(next.tab).focus();
    selectTab(next.name);
  });
});

/* ------------------------------------------------------------------ *
 * Text-message entry path — a simulation, nothing sent (FR-016–FR-032)
 * ------------------------------------------------------------------ */

const thread = createThread();

const STAGE_LABEL = { trigger: 'Send the trigger word', ack: 'Acknowledgement', pinpoint: 'Pinpointing the crossing', routed: 'Routed' };
const STAGE_NUMBER = { trigger: 1, ack: 2, pinpoint: 3, routed: 4 };

function renderThread(state) {
  $('thread-stage').textContent =
    `Stage ${STAGE_NUMBER[state.stage] || 1} of 4 — ${STAGE_LABEL[state.stage] || state.stage}`;

  $('thread-messages').innerHTML = state.messages.map((m) =>
    `<li class="thread-msg thread-msg--${esc(m.from)}">
       <span class="thread-msg__from">${m.from === 'resident' ? 'You' : 'Service'}</span>
       <p>${esc(m.text)}</p>
     </li>`
  ).join('');

  const evidenceEl = $('thread-evidence');
  if (state.stage === 'routed' && state.matchedCaseId) {
    const c = getCase(state.matchedCaseId);
    evidenceEl.innerHTML = c ? evidenceMarkup(c, 'thread') : '';
    if (c) wireCopyScript(c, 'thread');
  } else {
    evidenceEl.innerHTML = '';
  }

  const list = $('thread-messages');
  list.scrollTop = list.scrollHeight;
}

thread.subscribe(renderThread);

$('thread-composer').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('thread-input');
  const v = input.value.trim();
  if (!v) return;
  thread.send(v);
  input.value = '';
  input.focus();
});

$('thread-restart').addEventListener('click', () => thread.restart());

const presenterJump = $('presenter-jump');
presenterJump.innerHTML = CASES.map((c) =>
  `<button type="button" class="btn btn--ghost btn--small" data-case="${esc(c.case_id)}">${esc(c.service_type)}</button>`
).join('');
presenterJump.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-case]');
  if (!btn) return;
  selectTab('text');
  thread.jumpToCase(btn.dataset.case);
});

/* ------------------------------------------------------------------ *
 * Voice — optional enhancement. Browser-side only, nothing recorded or sent (FR-033–FR-050)
 * ------------------------------------------------------------------ */

let voiceEnabled = false;

function currentVoiceStep(state) {
  if (state.resultVisible) return { type: 'confirm', question: lastResultSpeech };
  if (state.position >= STEPS.length) return CONFIRM_STEP;
  return STEPS[state.position];
}

function handleVoiceStatus({ mode, lastHeard, error } = {}) {
  const statusEl = $('voice-status');
  if (statusEl && mode) statusEl.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
  const heardEl = $('voice-heard');
  if (heardEl) heardEl.textContent = lastHeard ? `Heard: "${lastHeard}"` : '';
  const errorEl = $('voice-error');
  if (errorEl) {
    errorEl.textContent = error || '';
    errorEl.hidden = !error;
  }
}

const voice = createVoice({
  getStep: () => currentVoiceStep(conversation.getState()),
  onStatus: handleVoiceStatus,
  onCommand: (cmd) => {
    switch (cmd) {
      case 'repeat':
        voice.repeat();
        break;
      case 'back':
        conversation.back();
        break;
      case 'restart':
        conversation.restart();
        break;
      case 'confirm': {
        const s = conversation.getState();
        if (s.position >= STEPS.length && !s.resultVisible) runRouting();
        break;
      }
      default:
        break;
    }
  },
  onChoice: (value) => {
    const s = conversation.getState();
    if (s.position < STEPS.length) conversation.setAnswer(STEPS[s.position].key, value);
  },
  onFreeText: (value) => {
    const s = conversation.getState();
    if (s.position < STEPS.length) conversation.setAnswer(STEPS[s.position].key, value);
  },
});

function populateVoicePicker() {
  const picker = $('voice-picker');
  const voices = voice.listVoices();
  if (voices.length > 1) {
    picker.innerHTML = voices.map((v) => `<option value="${esc(v.voiceURI)}">${esc(v.name)}</option>`).join('');
    picker.hidden = false;
  } else {
    picker.hidden = true;
  }
}

function setupVoiceUI() {
  const { canSpeak, canListen } = voice.isSupported();
  if (!canSpeak && !canListen) return;   // stays hidden; text and typed paths are untouched

  const toggle = $('voice-toggle');
  toggle.hidden = false;
  const note = $('voice-note');
  note.hidden = false;
  if (!canSpeak) {
    note.textContent = 'This browser can listen but not speak prompts aloud. Typing does exactly the same thing.';
  } else if (!canListen) {
    note.textContent = 'This browser can speak prompts aloud but cannot listen. Typing does exactly the same thing.';
  }

  toggle.addEventListener('click', () => {
    voiceEnabled = !voiceEnabled;
    toggle.setAttribute('aria-pressed', String(voiceEnabled));
    $('voice-label').textContent = voiceEnabled ? 'Turn off voice' : 'Turn on voice';
    $('voice-status-block').hidden = !voiceEnabled;
    $('voice-help').textContent =
      'Speak your answer, or say "repeat", "back", "start over", or "confirm". ' +
      'Say "stop listening" to turn voice off.';
    if (voiceEnabled) {
      voice.enable();
      populateVoicePicker();
      voice.speakStep(currentVoiceStep(conversation.getState()));
    } else {
      voice.disable();
    }
  });

  $('voice-repeat').addEventListener('click', () => voice.repeat());
  $('voice-picker').addEventListener('change', (e) => voice.setVoice(e.target.value));
}

/* ------------------------------------------------------------------ *
 * Boot
 * ------------------------------------------------------------------ */

$('restart').addEventListener('click', () => conversation.restart());
$('step-back').addEventListener('click', () => conversation.back());
conversation.subscribe(render);
render(conversation.getState());
renderThread(thread.getState());

setupVoiceUI();
probeMode();

// Surfaced for the README's verification steps.
console.info(
  `Jurisdiction Junction — ${CASES.length} synthetic cases loaded, sources verified ${SOURCE_CHECKED}. ` +
  'No credentials in client code; no data leaves this tab except an optional case-id lookup.');
