# Contract: DOM surface

The stable ids, roles, and live regions that `app.js`, `lib/voice.js`, and the jsdom test harness all
depend on. Changing any of these breaks tests, so they are listed here rather than discovered by
reading markup.

## Existing — must keep working (used by `tests/e2e.test.mjs` today)

| Selector | Role |
|---|---|
| `#main` | Skip-link target. |
| `#mode-banner`, `#mode-text` | Live/simulated routing banner, `role="status"`. |
| `#transcript` | The visible answer record (`<ol>`), labelled "Answers so far". |
| `#step`, `#step-count`, `#step-question`, `#step-help`, `#step-controls` | The current question. `#step` is `aria-live="polite"`. |
| `#restart` | "Start over" — the only control that discards answers. |
| `#result-panel`, `#result`, `#result-heading` | The recommendation. `#result-heading` has `tabindex="-1"` and receives focus on confirm. |
| `#voice-toggle`, `#voice-label`, `#voice-note` | Voice enablement; hidden when unsupported. |
| `#free-text` | The free-text input on the location step. |
| `#copy-script`, `#script-text` | Call-script copy affordance. |

## New — question path

| Selector | Role |
|---|---|
| `#step-back` | Back control. A real `<button>`, `disabled` at position 0 (FR-013), visible focus ring. |
| `#confirm-primary` | The single primary confirming action. Focused on render of the confirmation step (FR-004). |
| `#confirm-secondary` | "No — let me answer again". Ghost styling; distinguishable from the primary by appearance alone (FR-001). |
| `#confirm-summary` | The answers block on the confirmation step, visually separated from the actions (FR-005). |
| `#confirm-actions` | The action block; becomes sticky within the panel when it would otherwise fall below the fold (FR-002). |

## New — entry-path switcher

| Selector | Role |
|---|---|
| `#path-tabs` | `role="tablist"`, keyboard-operable. |
| `#tab-questions` / `#panel-questions` | Default selected tab and its panel. |
| `#tab-text` / `#panel-text` | The text path's tab and panel. |

## New — text path

| Selector | Role |
|---|---|
| `#thread-badge` | The persistent prototype / not-a-live-number / nothing-is-sent label (FR-018). Present in every state. |
| `#thread-stage` | Visible stage progress, `role="status"` (FR-020). |
| `#thread-messages` | The ordered message list. |
| `#thread-input`, `#thread-send` | The resident's composer. Never labelled or typed as a phone number field (FR-029). |
| `#thread-restart` | Restart without a page reload (FR-028). |
| `#presenter-strip`, `#presenter-jump` | The presenter shortcut, visually distinct and outside the phone mockup (FR-027). |
| `#thread-evidence` | Container for the shared evidence renderer reached from the routed reply (FR-024). |

## New — voice

| Selector | Role |
|---|---|
| `#voice-status` | Current mode: speaking / listening / interpreting / idle. `role="status"`, `aria-live="polite"` (FR-036). |
| `#voice-heard` | What the tool last heard, or that it heard nothing (FR-039). |
| `#voice-help` | Short instructions: when to speak and which commands work (FR-040). |
| `#voice-repeat` | On-screen "say that again" control (FR-046). |
| `#voice-picker` | Voice selection, rendered only when more than one voice exists (FR-047). |
| `#voice-error` | Plain-language mic-denied / unsupported explanation (FR-041). |

## Cross-cutting rules

- Every interactive element above is a native `<button>`, `<input>`, `<select>`, or `<a>` with a
  visible focus indicator, operable by keyboard and by pointer (Principle VII, FR-015, SC-014).
- All of the above render and function in the static build with no server present (FR-053).
- No element carries or solicits a personal identifier, and no new element performs a network call.
