# Contract: `lib/conversation.js` — the question-path state machine

**Consumers**: `app.js` (renders from it), `lib/voice.js` (drives it by spoken command),
`tests/e2e.test.mjs`.

Owns `ConversationPosition` and `AnswerRecord` (see [../data-model.md](../data-model.md)). It holds no
DOM references and performs no rendering; `app.js` subscribes and re-renders.

## Exports

```js
createConversation(steps) -> {
  getState()                 // { position, answers, answered, resultVisible }
  setAnswer(key, value)      // writes the answer, marks it answered, advances one step
  back()                     // moves back one step; no answer is touched
  goToConfirm()              // jumps to the confirmation step, only when every step is answered
  confirm()                  // marks resultVisible true
  restart()                  // the only operation that clears answers
  canGoBack()                // false at position 0, true otherwise
  isComplete()               // every step key answered
  summary()                  // [{ question, displayValue }] rendered from `answered`, not position
  subscribe(fn)              // fn(state) on every change
}
```

## Behavioural requirements

| Rule | Requirement |
|---|---|
| FR-007 | `canGoBack()` is true on every step after the first, including the confirmation step. |
| FR-008 | After `back()`, the re-displayed step shows the previous answer as the current answer, including free text typed into the input. |
| FR-009 | `back()` followed by `setAnswer()` on an earlier key leaves all later answers intact. |
| FR-010 | `summary()` and the transcript always reflect current answers, including corrections. |
| FR-011 | `back()` from the confirmation step lands on the last question with every answer preserved. |
| FR-012 | `back()` never clears an answer. `restart()` is the only clearing operation. |
| FR-013 | `canGoBack()` is false at `position === 0`; repeated `back()` there is a no-op. |
| FR-014 | Any state change other than `confirm()` sets `resultVisible` to false. |

## Invariants

1. `answered[key]` is set only by `setAnswer` and cleared only by `restart`.
2. `position` is always in `0 … steps.length`.
3. `summary()` includes a step if and only if `answered[key]` is true — never "position > index".
4. `goToConfirm()` is rejected unless `isComplete()`.
5. `danger === false` is a real answer; `danger === null` is unanswered. No truthiness check
   conflates them.
6. No personal identifier is requested, validated, or stored by any operation.

## Rendering obligations on `app.js` (paired with this contract)

- The back control is a real `<button>`, keyboard- and pointer-operable, with a visible focus ring,
  disabled at position 0 (FR-013, FR-015).
- "Start over" stays visually distinct from back and remains the only discarding control (FR-012).
- On the confirmation step: exactly one primary action, visually dominant, distinguishable from the
  secondary by appearance alone, focused on render, separated from the summary block, and visible
  without scrolling at 375px or accompanied by a persistent cue (FR-001–FR-005).
- On `confirm()`, focus moves to the result heading and it is announced to assistive technology
  (FR-006).
