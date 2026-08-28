/**
 * lib/voice.js — the voice controller.
 *
 * Voice is an optional enhancement: everything it can do has an equivalent visible control, and the
 * tool is fully usable with voice never enabled (FR-049, SC-014). All speech runs in the browser; no
 * audio is recorded, retained, or transmitted, and this module makes no network call (FR-050,
 * SC-016).
 *
 * The pure functions below (speechTextFor, parseCommand, matchSpokenPhrase, rankVoices) carry the
 * requirements that matter and are unit-tested without a DOM (research R11). The controller
 * (createVoice) wires them to the real Web Speech API and is exercised only through the browser /
 * the e2e degradation path, since jsdom implements neither half of that API.
 */

function normalize(phrase) {
  return String(phrase ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const COMMANDS = [
  { intent: 'repeat', phrases: ['repeat', 'repeat that', 'say that again', 'again', 'what was that'] },
  { intent: 'back', phrases: ['back', 'go back', 'previous', 'change that', 'last question'] },
  { intent: 'restart', phrases: ['start over', 'restart', 'reset', 'begin again'] },
  { intent: 'confirm', phrases: ['confirm', 'yes show me', 'show me', 'that is right', 'correct'] },
  { intent: 'stop', phrases: ['stop listening', 'turn off voice'] },
];

/** Closed phrase table, checked before choice matching (research R8). No bare "yes" here — see
 *  createVoice's dispatch, which is the only place "yes" resolves to confirm, and only on the
 *  confirmation step, so it never swallows a choice step's own "Yes" answer. */
export function parseCommand(phrase) {
  const norm = normalize(phrase);
  for (const { intent, phrases } of COMMANDS) {
    if (phrases.includes(norm)) return intent;
  }
  return null;
}

const ORDINAL_WORDS = [
  ['one', 'first', '1'],
  ['two', 'second', '2'],
  ['three', 'third', '3'],
  ['four', 'fourth', '4'],
  ['five', 'fifth', '5'],
];

/**
 * Score each of the step's choices against a spoken phrase: exact label, label containment,
 * per-choice synonym, and ordinal form. Exactly one top scorer selects; two or more tie and the
 * result is 'ambiguous' — the tool asks rather than guesses (FR-034).
 */
export function matchSpokenPhrase(phrase, step) {
  const norm = normalize(phrase);
  const choices = step?.choices || [];
  const acceptsText = step?.type === 'text-with-choices' || step?.type === 'text';

  if (choices.length === 0) {
    return acceptsText ? { kind: 'text', value: String(phrase ?? '').trim() } : { kind: 'unmatched' };
  }

  const scored = choices.map((c, i) => {
    let score = 0;
    const normLabel = normalize(c.label);
    if (norm && normLabel) {
      if (norm === normLabel) score += 3;
      else if (norm.includes(normLabel) || normLabel.includes(norm)) score += 2;
    }
    for (const syn of c.synonyms || []) {
      const normSyn = normalize(syn);
      if (!normSyn) continue;
      if (norm === normSyn) score += 3;
      else if (norm.includes(normSyn)) score += 2;
    }
    const words = ORDINAL_WORDS[i] || [];
    const ordinalHit =
      words.some((w) => new RegExp(`\\b${w}\\b`).test(norm)) ||
      new RegExp(`\\bnumber ${i + 1}\\b`).test(norm);
    if (ordinalHit) score += 2;
    return { choice: c, score };
  });

  const max = Math.max(...scored.map((s) => s.score));
  if (max === 0) {
    return acceptsText ? { kind: 'text', value: String(phrase ?? '').trim() } : { kind: 'unmatched' };
  }

  const top = scored.filter((s) => s.score === max);
  if (top.length > 1) return { kind: 'ambiguous', options: top.map((s) => s.choice.label) };
  return { kind: 'choice', value: top[0].choice.value };
}

/**
 * speechTextFor(step) is the ONLY source of what gets spoken. Disclaimers, banners, and other page
 * furniture are never passed in, so they can never be read aloud (FR-045, research R10).
 */
export function speechTextFor(step) {
  if (!step) return '';
  if (step.type === 'confirm') {
    return [step.question, step.speechGuidance].filter(Boolean).join(' ');
  }
  const parts = [step.question];
  if (step.choices?.length) {
    parts.push(`Your options are: ${step.choices.map((c) => c.label).join(', ')}.`);
  }
  if (step.speechGuidance) parts.push(step.speechGuidance);
  return parts.filter(Boolean).join(' ');
}

/**
 * Rank available voices best-first: neural/natural/premium/enhanced named voices win, known
 * higher-quality vendors are favoured, non-local (cloud-quality on-device) and en-US voices get a
 * small bump, and compact/robotic-sounding voices are penalized. Never throws on an empty list
 * (research R9).
 */
export function rankVoices(voices) {
  const list = Array.isArray(voices) ? voices : [];
  const scored = list.map((v, i) => {
    const name = v?.name || '';
    let score = 0;
    if (/neural|natural|premium|enhanced/i.test(name)) score += 8;
    if (/google|microsoft|samantha|ava|aria|jenny/i.test(name)) score += 4;
    if (v?.localService === false) score += 2;
    if (v?.lang === 'en-US') score += 2;
    else if (/^en/i.test(v?.lang || '')) score += 1;
    if (/compact|espeak|robot/i.test(name)) score -= 6;
    return { voice: v, score, i };
  });
  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  return scored.map((s) => s.voice);
}

/* ------------------------------------------------------------------ *
 * Controller — wires the pure functions above to the real Web Speech API.
 * Not exercised by the unit suite (no DOM in jsdom); the e2e suite proves the degradation path.
 * ------------------------------------------------------------------ */

export function createVoice({ getStep, onCommand, onChoice, onFreeText, onStatus } = {}) {
  const hasWindow = typeof window !== 'undefined';
  const SR = hasWindow ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  const canSpeak = hasWindow && 'speechSynthesis' in window;
  const canListen = Boolean(SR);

  let enabled = false;
  let mode = 'idle';
  let recognition = null;
  let selectedVoiceURI = null;
  let lastHeard = null;
  let voicesRetried = false;

  function isSupported() {
    return { canSpeak, canListen };
  }

  function report(extra = {}) {
    onStatus?.({ mode, lastHeard, ...extra });
  }

  function setMode(next, extra) {
    mode = next;
    report(extra);
  }

  function getRawVoices() {
    if (!canSpeak) return [];
    const list = window.speechSynthesis.getVoices() || [];
    if (list.length === 0 && !voicesRetried && 'onvoiceschanged' in window.speechSynthesis) {
      voicesRetried = true;
      window.speechSynthesis.addEventListener('voiceschanged', () => report(), { once: true });
    }
    return list;
  }

  function listVoices() {
    return rankVoices(getRawVoices());
  }

  function pickVoice() {
    const ranked = listVoices();
    if (selectedVoiceURI) {
      const chosen = ranked.find((v) => v.voiceURI === selectedVoiceURI);
      if (chosen) return chosen;
    }
    return ranked[0];
  }

  function setVoice(voiceURI) {
    selectedVoiceURI = voiceURI || null;
  }

  function ensureRecognition() {
    if (!canListen || recognition) return;
    recognition = new SR();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.addEventListener('result', (e) => {
      const said = e.results[0][0].transcript;
      lastHeard = said;
      setMode('interpreting', { lastHeard: said });
      processPhrase(said);
    });
    recognition.addEventListener('end', () => {
      if (mode === 'listening') {
        lastHeard = null;
        announceAndRelisten("I didn't hear anything. Please try again.");
      }
    });
    recognition.addEventListener('error', (e) => {
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        enabled = false;
        setMode('idle', {
          error: 'Microphone access was denied. Voice is off; typing still works exactly the same.',
        });
        return;
      }
      if (mode === 'listening') announceAndRelisten("I didn't hear anything. Please try again.");
    });
  }

  function startListening() {
    if (!enabled || !canListen) return;
    ensureRecognition();
    setMode('listening');
    try {
      recognition.start();
    } catch {
      /* already running */
    }
  }

  function stopRecognition() {
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        /* not running */
      }
    }
  }

  function speakText(text, { thenListen = true } = {}) {
    if (!canSpeak) {
      if (thenListen) startListening();
      return;
    }
    setMode('speaking');
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.pitch = 1.0;
    const voice = pickVoice();
    if (voice) utter.voice = voice;
    utter.onend = () => {
      if (enabled && thenListen) startListening();
    };
    utter.onerror = () => {
      if (enabled && thenListen) startListening();
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function speakStep(step) {
    if (!enabled) return;
    stopRecognition();
    speakText(speechTextFor(step));
  }

  function repeat() {
    if (!enabled) return;
    speakStep(getStep?.());
  }

  function announceAndRelisten(message) {
    setMode('speaking', { lastHeard: message });
    speakText(message);
  }

  function processPhrase(phrase) {
    const step = getStep?.();
    let cmd = parseCommand(phrase);
    if (!cmd && step?.type === 'confirm' && normalize(phrase) === 'yes') cmd = 'confirm';

    if (cmd === 'stop') {
      disable();
      return;
    }
    if (cmd) {
      onCommand?.(cmd);
      return;
    }

    const result = matchSpokenPhrase(phrase, step);
    if (result.kind === 'choice') {
      onChoice?.(result.value);
      return;
    }
    if (result.kind === 'text') {
      onFreeText?.(result.value);
      return;
    }
    if (result.kind === 'ambiguous') {
      announceAndRelisten(`I heard more than one match: ${result.options.join(', or ')}. Please say one of those.`);
      return;
    }
    announceAndRelisten(`I heard "${phrase}" but couldn't match that. Please try again.`);
  }

  function stopAll() {
    if (canSpeak) window.speechSynthesis.cancel();
    stopRecognition();
    setMode('idle', { lastHeard: null, error: null });
  }

  function enable() {
    enabled = true;
    setMode('idle');
  }

  function disable() {
    enabled = false;
    stopAll();
  }

  return {
    enable,
    disable,
    isSupported,
    speakStep,
    repeat,
    stopAll,
    setVoice,
    listVoices,
  };
}
