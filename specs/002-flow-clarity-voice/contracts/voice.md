# Contract: `lib/voice.js` — the voice controller

**Consumers**: `app.js` (wiring and status rendering), `tests/voice.test.mjs` (pure functions only).

Voice is an **optional enhancement**. Everything it can do has an equivalent visible control, and the
tool is fully usable with voice never enabled (FR-049, SC-014). All speech runs in the browser; no
audio is recorded, retained, or transmitted, and this module makes no network call (FR-050, SC-016).

## Exports — controller

```js
createVoice({ getStep, onCommand, onChoice, onFreeText, onStatus }) -> {
  enable() / disable()
  isSupported()          // { canSpeak, canListen }
  speakStep(step)        // speaks speechTextFor(step), then listens
  repeat()               // re-speaks the current step from the beginning
  stopAll()              // cancels speech and recognition; returns to idle
  setVoice(voiceURI)     // session-scoped override
  listVoices()           // ranked list for the picker
}
```

## Exports — pure functions (unit-tested without a DOM)

```js
speechTextFor(step)          -> string
parseCommand(phrase)         -> 'repeat' | 'back' | 'restart' | 'confirm' | 'stop' | null
matchSpokenPhrase(phrase, step)
    -> { kind: 'choice', value }        // exactly one choice matched
     | { kind: 'ambiguous', options }   // two or more matched — ask, never guess
     | { kind: 'text', value }          // step accepts free text
     | { kind: 'unmatched' }
rankVoices(voices)           -> voices sorted best-first
```

## State machine (FR-036–FR-038)

`idle → speaking → listening → interpreting → (action) → speaking …`

| Rule | Requirement |
|---|---|
| FR-036 | The current mode is displayed at all times while voice is on: speaking, listening, interpreting, or idle. |
| FR-037 | Listening resumes automatically for each new question once the prompt finishes, without the parent re-activating anything. |
| FR-038 | The tool never listens while it is speaking. Recognition is stopped before an utterance starts and started only after it ends. |
| FR-039 | When listening ends without a usable answer, the tool reports what it heard, or that it heard nothing, and offers another attempt. Silent failure is prohibited; feedback appears within 3s (SC-012). |
| FR-042 | Enabling voice mid-conversation discards, repeats, and alters nothing already answered. |
| FR-044 | Speech is interruptible; navigating or repeating cancels the current utterance immediately. |

## Recognition and matching (FR-033–FR-035)

- Voice input is available on **every** step, including multiple-choice steps and the confirmation
  step — not only on free text.
- `parseCommand` is checked **before** choice matching, using the closed phrase table (research R8):
  repeat, back, start over, confirm, stop listening. On the confirmation step, "yes" resolves to
  confirm.
- `matchSpokenPhrase` normalizes (lowercase, strip punctuation, collapse whitespace) and scores each
  choice on label equality, label containment, per-choice `synonyms`, and ordinal forms ("one",
  "first", "number two").
- Exactly one top scorer selects the choice and advances. Two or more return `ambiguous`, which asks
  the parent to choose between the matching options rather than guessing (FR-034).
- Spoken input is treated exactly as typed input and is bound by the same privacy rule (FR-051).

## Speech output (FR-043–FR-048)

- `rankVoices` selects the most natural-sounding English voice automatically, with no configuration
  (FR-043); the ranking heuristic and its `voiceschanged` retry are specified in research R9.
- `speechTextFor(step)` yields only the question, its choices, and at most one short guidance
  sentence. Disclaimers, headings, banners, and other page furniture are never spoken (FR-045).
- `repeat()` is reachable both by voice command and by an on-screen control (FR-046).
- A picker lets the parent choose a different voice when more than one exists; the choice holds for
  the session (FR-047).
- When nothing ranks, the platform default is used and the flow is unaffected (FR-048).

## Degradation (FR-040, FR-041)

- If neither half of the Web Speech API is present, the voice controls stay hidden and nothing else
  changes.
- If only one half is present, only that half is offered and the tool states which half is available.
- If microphone access is denied or unavailable, a plain-language explanation of what happened and
  what to do is shown, and the typed path continues to work unchanged.
- Short, plainly worded instructions — when to speak and which commands work — are shown at the point
  voice is turned on and remain reachable afterwards (FR-040).

## Invariants

1. No network request originates in this module.
2. No audio buffer is stored, copied, or passed anywhere but to the browser's own recognizer.
3. `mode` is never `listening` while an utterance is in progress.
4. Every voice-reachable action has an equivalent visible control.
5. Spoken input is routed to the **active** conversation only, and never recorded against both paths
   (FR-032).

## Test obligations (`tests/voice.test.mjs`, no audio)

- `parseCommand` resolves every phrase in the command table and returns `null` for unrelated speech.
- `matchSpokenPhrase` selects on exact label, on synonym, and on ordinal; returns `ambiguous` for a
  phrase containing both "signal" and "beacon"; returns `unmatched` for gibberish on a choice-only
  step.
- `speechTextFor` includes the question and the choice labels and excludes disclaimer and banner text.
- `rankVoices` prefers a "Neural"/"Natural" named voice over a "Compact" one and never throws on an
  empty list.
- `tests/e2e.test.mjs` asserts the degradation path: with no speech APIs present, the voice toggle
  stays hidden and the typed path completes unchanged.
