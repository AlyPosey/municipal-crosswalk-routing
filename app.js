/**
 * Jurisdiction Junction — school-zone crosswalk routing assistant.
 *
 * Constitution III (no invented ownership) is enforced structurally here:
 * the routing step may only ever produce a `case_id` that exists in the local catalog, or the
 * string "unresolved". Every agency name, role, evidence string, link, gap, next action, and call
 * script rendered below is read from data/cases.js. No model-generated prose reaches the DOM.
 */

import { CASES, getCase, MATCH_THRESHOLD, SOURCE_CHECKED } from './data/cases.js';

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

const answers = {
  location: '',
  equipment: '',
  schoolZone: '',
  danger: null,   // true | false
};

let stepIndex = 0;
let liveMode = false;      // true only once /api/health answers successfully
let voiceOn = false;
let recognition = null;

const $ = (id) => document.getElementById(id);

/** Escape anything that could originate outside this file before it touches innerHTML. */
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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
        label: 'Fictional Lincoln Heights Elementary — city street' },
      { value: 'A fictional crossing on Fictional State Route 42, next to Fictional Maple Ridge Middle School',
        label: 'Fictional Maple Ridge Middle — State Route 42' },
    ],
    placeholder: 'e.g. the crossing on the state route by the middle school',
  },
  {
    key: 'equipment',
    question: 'What looks broken?',
    help: 'Pick the closest match. This changes which office is likely to hold the equipment.',
    type: 'choices',
    choices: [
      { value: 'Traffic signal / walk signal is dark or not changing', label: 'Traffic or walk signal' },
      { value: 'School-zone flashing beacon is not flashing or is stuck on', label: 'Flashing school-zone beacon' },
      { value: 'Pedestrian push button does nothing', label: 'Pedestrian push button' },
      { value: 'Something else at the crossing', label: 'Something else' },
    ],
  },
  {
    key: 'schoolZone',
    question: 'Is this crossing in or right next to a school zone?',
    help: 'School-zone equipment often involves a third party the city and state pages do not mention.',
    type: 'choices',
    choices: [
      { value: 'Yes — it is a school-zone crossing', label: 'Yes' },
      { value: 'No — not a school zone', label: 'No' },
      { value: 'Not sure', label: 'Not sure' },
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
      { value: false, label: 'No — nobody is in danger right now' },
      { value: true,  label: 'Yes — there is immediate danger or injury' },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Rendering the conversation
 * ------------------------------------------------------------------ */

function renderTranscript() {
  const items = [];
  for (let i = 0; i < stepIndex && i < STEPS.length; i++) {
    const s = STEPS[i];
    let val = answers[s.key];
    if (s.key === 'danger') val = val ? 'Yes — immediate danger reported' : 'No immediate danger';
    items.push(`<li><span class="q">${esc(s.question)}</span><span class="a">${esc(val)}</span></li>`);
  }
  $('transcript').innerHTML = items.join('');
}

function renderStep({ takeFocus = true } = {}) {
  renderTranscript();

  const controls = $('step-controls');
  controls.innerHTML = '';

  // ---- past the last question: summary + confirmation gate (Constitution IV) ----
  if (stepIndex >= STEPS.length) {
    $('step-count').textContent = 'Last step';
    $('step-question').textContent = 'Does this look right?';
    $('step-help').textContent =
      'Nothing is sent anywhere. Confirming just unlocks the recommendation below.';

    const list = document.createElement('ul');
    list.className = 'summary-list';
    list.innerHTML = STEPS.map((s) => {
      let v = answers[s.key];
      if (s.key === 'danger') v = v ? 'Yes — immediate danger reported' : 'No immediate danger';
      return `<li><span class="k">${esc(s.question)}</span><br>${esc(v)}</li>`;
    }).join('');
    controls.appendChild(list);

    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'btn btn--wide';
    go.textContent = 'Yes — show me who to contact first';
    go.addEventListener('click', runRouting);
    controls.appendChild(go);

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'btn btn--ghost btn--wide';
    back.textContent = 'No — let me answer again';
    back.addEventListener('click', reset);
    controls.appendChild(back);

    if (takeFocus) {
      go.focus();
      speak('Does this look right? Confirm to see the recommended first contact.');
    }
    return;
  }

  // ---- an ordinary question ----
  const step = STEPS[stepIndex];
  $('step-count').textContent = `Question ${stepIndex + 1} of ${STEPS.length}`;
  $('step-question').textContent = step.question;
  $('step-help').textContent = step.help;

  if (step.choices) {
    const box = document.createElement('div');
    box.className = 'choices';
    step.choices.forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn--choice';
      b.textContent = c.label;
      b.addEventListener('click', () => answer(step.key, c.value));
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

    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'btn btn--wide';
    submit.textContent = 'Continue';
    const send = () => {
      const v = input.value.trim();
      if (v) answer(step.key, v);
      else input.focus();
    };
    submit.addEventListener('click', send);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });

    controls.append(label, input, submit);
  }

  if (takeFocus) {
    const first = controls.querySelector('button, input');
    if (first && stepIndex > 0) first.focus();
    speak(step.question);
  }
}

function answer(key, value) {
  answers[key] = value;
  stepIndex++;
  $('result-panel').hidden = true;
  renderStep();
}

function reset() {
  stepIndex = 0;
  answers.location = answers.equipment = answers.schoolZone = '';
  answers.danger = null;
  $('result-panel').hidden = true;
  $('result').innerHTML = '';
  renderStep();
}

/* ------------------------------------------------------------------ *
 * Routing — deterministic engine is the floor; the model only ever selects
 * ------------------------------------------------------------------ */

/**
 * Score the parent's answers against each case's keywords.
 *
 * Location is scored separately and is the gate. Equipment and school-zone answers can only break a
 * tie or widen a lead — they can never, on their own, produce a match. Without that split, a
 * description like "the light by the Walmart" would score on the word "signal" from the equipment
 * question and get routed to a city we have no reason to think is involved, which is precisely the
 * failure Constitution III forbids.
 *
 * Returns { case_id, score }, with case_id null when nothing clears MATCH_THRESHOLD on location.
 */
function matchCase() {
  const place = String(answers.location).toLowerCase();
  const context = `${answers.equipment} ${answers.schoolZone}`.toLowerCase();

  const score = (text, c) => {
    let n = 0;
    for (const kw of c.match_keywords) {
      if (text.includes(kw.toLowerCase())) n += kw.includes(' ') ? 2 : 1;
    }
    return n;
  };

  const scored = CASES.map((c) => {
    const locationScore = score(place, c);
    let contextScore = score(context, c);
    // Equipment type is a strong secondary signal: a beacon points at the state-route case.
    for (const hint of c.equipment_hints || []) {
      if (context.includes(hint)) contextScore += 2;
    }
    return { case_id: c.case_id, locationScore, score: locationScore + contextScore };
  }).sort((a, b) => b.score - a.score);

  const [best, runnerUp] = scored;

  // Gate: the location must identify the case. Context alone is never enough.
  if (!best || best.locationScore < MATCH_THRESHOLD) return { case_id: null, score: 0 };

  // A tie means the description genuinely does not distinguish the cases — do not guess.
  if (runnerUp && best.score === runnerUp.score) return { case_id: null, score: best.score };

  return best;
}

/** Ask the local proxy, if one is there. Returns a case_id string or null. Never returns prose. */
async function routeViaServer() {
  try {
    const res = await fetch('/api/route', {
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

async function runRouting() {
  $('step-controls').innerHTML = '<p>Working out who to send you to&hellip;</p>';

  let caseId = null;
  if (liveMode) caseId = await routeViaServer();
  if (!caseId) caseId = matchCase().case_id;   // deterministic floor

  const matched = caseId ? getCase(caseId) : null;
  renderResult(matched);

  stepIndex = STEPS.length;
  renderStep({ takeFocus: false });          // keep focus heading to the result, not back up the page
  $('result-panel').hidden = false;
  const heading = $('result-heading');
  heading.focus();
  heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ------------------------------------------------------------------ *
 * Rendering the result
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
    <p>What you described doesn&rsquo;t clearly match either synthetic case I hold, and picking an
    agency anyway would be worse than saying so. Naming the wrong office is exactly the failure this
    tool exists to prevent.</p>
    <p><strong>What would help:</strong> whether the crossing is on a city street or a state-numbered
    route, and whether the broken equipment is a traffic signal or a flashing school-zone beacon.
    That single distinction is what moves the first call between the city and the state.</p>
  </div>
  <div class="result-section">
    <h3>Scenarios this prototype does cover</h3>
    <ul class="agency__evidence">${options}</ul>
    <p class="freshness">Both are synthetic. Use &ldquo;Start over&rdquo; to try one.</p>
  </div>`;
}

function renderResult(c) {
  const out = $('result');
  const danger = answers.danger === true ? dangerPanel() : '';

  if (!c) {
    out.innerHTML = danger + unresolvedBlock() + NOTICES;
    return;
  }

  const primary = c.agencies.find((a) => a.role === 'primary');

  const summary = STEPS.map((s) => {
    let v = answers[s.key];
    if (s.key === 'danger') v = v ? 'Yes — immediate danger reported' : 'No immediate danger';
    return `<li><span class="k">${esc(s.question)}</span><br>${esc(v)}</li>`;
  }).join('');

  out.innerHTML = `
    ${danger}

    <div class="rec">
      <p class="rec__label">Recommended first contact — pending human confirmation</p>
      <h3 class="rec__name">${esc(primary.name)}</h3>
      <p class="rec__pending">
        This is a <strong>starting point, not an answer</strong>. It is where the evidence points
        first for a ${esc(c.service_type.toLowerCase())} in this situation. Nobody has confirmed that
        this office owns this specific equipment.
      </p>
    </div>

    <div class="result-section">
      <h3>What you told me</h3>
      <ul class="summary-list">${summary}</ul>
      <p class="freshness">Matched to synthetic case <strong>${esc(c.case_id)}</strong> ·
        ${esc(c.road_context)}</p>
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
      <div class="script" id="script-text">${esc(c.call_script)}</div>
      <button type="button" class="btn btn--ghost" id="copy-script">Copy this script</button>
    </div>

    <div class="callout callout--confirm">
      <h3>A person has to confirm this</h3>
      <p>${esc(c.confirmation_reason)} Ask them directly whether the equipment is on their
      maintenance list — and if it isn&rsquo;t, who holds it. That question is the point of this
      tool, not a formality.</p>
    </div>

    ${NOTICES}`;

  const copy = $('copy-script');
  if (copy) {
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

  speak(`Recommended first contact, pending confirmation: ${primary.name}.`);
}

/* ------------------------------------------------------------------ *
 * Mode probe — the banner must never let anyone mistake which path ran
 * ------------------------------------------------------------------ */

async function probeMode() {
  const banner = $('mode-banner');
  const text = $('mode-text');
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
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
 * Voice — optional enhancement. Browser-side only, nothing recorded or sent.
 * ------------------------------------------------------------------ */

function speak(phrase) {
  if (!voiceOn || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(phrase));
}

function setupVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canSpeak = 'speechSynthesis' in window;
  if (!SR && !canSpeak) return;   // stays hidden; text path is untouched

  const toggle = $('voice-toggle');
  toggle.hidden = false;
  $('voice-note').hidden = false;

  if (SR) {
    recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.addEventListener('result', (e) => {
      const said = e.results[0][0].transcript;
      const input = $('free-text');
      if (input) { input.value = said; input.focus(); }
    });
    recognition.addEventListener('error', () => { /* silently fall back to typing */ });
  }

  toggle.addEventListener('click', () => {
    voiceOn = !voiceOn;
    toggle.setAttribute('aria-pressed', String(voiceOn));
    $('voice-label').textContent = voiceOn ? 'Turn off voice' : 'Turn on voice';
    if (voiceOn) {
      speak($('step-question').textContent);
      if (recognition && $('free-text')) { try { recognition.start(); } catch { /* already running */ } }
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (recognition) { try { recognition.stop(); } catch { /* not running */ } }
    }
  });
}

/* ------------------------------------------------------------------ *
 * Boot
 * ------------------------------------------------------------------ */

$('restart').addEventListener('click', reset);
setupVoice();
renderStep();
probeMode();

// Surfaced for the README's verification steps.
console.info(
  `Jurisdiction Junction — ${CASES.length} synthetic cases loaded, sources verified ${SOURCE_CHECKED}. ` +
  'No credentials in client code; no data leaves this tab except an optional case-id lookup.');
