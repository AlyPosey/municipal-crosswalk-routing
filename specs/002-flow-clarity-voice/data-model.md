# Phase 1 Data Model: Conversation Flow Clarity, Text-First Entry & Usable Voice

**Feature**: `002-flow-clarity-voice` | **Date**: 2026-08-28

All state below is **in-memory, tab-scoped, and discarded on reload**. Nothing is persisted, no
identifier is stored, and no structure below is ever transmitted. Entity names follow the spec's
Key Entities section.

---

## 1. AnswerRecord

The parent's current answers to the five-question path. One record exists per active conversation.

| Field | Type | Rules |
|---|---|---|
| `location` | string | Free text or a choice value. Never validated against a real address; never stored. |
| `equipment` | string | One of the equipment choice values. |
| `schoolZone` | string | One of the school-zone choice values. |
| `danger` | boolean \| null | `null` means unanswered — distinct from `false` ("nobody is in danger"). |
| `answered` | `{ [key]: boolean }` | Per-key flag. The only source of truth for "has this been answered". |

**Validation rules**

- Contains no personal identifiers by construction: no field asks for one, and the privacy note is
  displayed on the path (Privacy Constraints, FR-051).
- `answered[key]` is set `true` only by `setAnswer`. It is never derived from the cursor.
- Cleared in full only by `restart()`. Back navigation never clears a field (FR-012).

**Relationships**: consumed by the transcript renderer, the confirmation summary, and
`matchCase(answers)` in `lib/routing.js`. The text path builds a structurally identical record so a
single engine serves both paths (FR-030).

---

## 2. ConversationPosition

Where the parent currently is, held separately from what they have answered (FR-007–FR-014).

| Field | Type | Rules |
|---|---|---|
| `position` | integer | `0 … STEPS.length`. `STEPS.length` is the confirmation step. |
| `resultVisible` | boolean | True only while a recommendation is displayed. |

**State transitions**

| From | Event | To | Side effects |
|---|---|---|---|
| `position = n` | `answer(key, value)` | `n + 1` | Writes value + `answered[key] = true`; hides any visible result. Answers ahead of the cursor are untouched (FR-009). |
| `position = n > 0` | `back()` | `n - 1` | No answer is modified or cleared. Any displayed recommendation is withdrawn (FR-014). Speech stops; listening restarts on the newly shown question. |
| `position = 0` | `back()` | `0` | No-op. The back control is disabled and never enabled on the first question (FR-013). |
| `position = STEPS.length` | `back()` | `STEPS.length - 1` | Returns to the last question with every earlier answer preserved (FR-011). |
| `position = STEPS.length` | `confirm()` | unchanged | Runs routing, shows the result, moves focus to the recommendation (FR-006). |
| any | `restart()` | `0` | The **only** transition that clears `AnswerRecord`; visually distinct control (FR-012). |

**Invariants**

- The transcript and the confirmation summary are rendered from `answered`, never from `position`.
- Reaching `STEPS.length` requires every step key to be answered.
- `resultVisible` is false at every position other than after an explicit `confirm()`.

---

## 3. StepDefinition (static)

The five-question script. Static data, not runtime state; extended for voice.

| Field | Type | Notes |
|---|---|---|
| `key` | string | Matches an `AnswerRecord` field. |
| `question` | string | Rendered and, via `speechText`, spoken. |
| `help` | string | Rendered; not spoken verbatim unless short (FR-045). |
| `type` | `'choices'` \| `'text-with-choices'` | Determines whether free text is accepted. |
| `choices[]` | `{ value, label, synonyms[] }` | `synonyms` is **new**: spoken alternates for voice matching (FR-034, R7). |
| `placeholder` | string? | Free-text hint. |
| `speechText` | string (derived) | **New**: question + "Your options are:" + labels + at most one guidance sentence (FR-045, R10). |

---

## 4. CrossingCatalogEntry

One synthetic crossing in `data/cases.js`. The existing shape is preserved unchanged; two fields are
added for the text path. **Every value is fictional** (Principle I) and **no field asserts ownership**
(Principle III).

Existing fields retained as-is: `case_id`, `is_synthetic`, `service_type`, `synthetic_location`,
`road_context`, `jurisdiction_a`, `jurisdiction_b`, `authoritative_source`, `source_checked`,
`match_keywords[]`, `equipment_hints[]`, `agencies[]` (each with `name`, `role`, `role_label`,
`why_this_role`, `caveat`, `evidence[]`), `conflict_or_gap`, `stale_or_conflicting`,
`recommended_handoff`, `next_action`, `call_script`, `requires_human_confirmation`,
`confirmation_reason`.

**Added fields**

| Field | Type | Rules |
|---|---|---|
| `agencies[].contact_phone` | string? | Present on the `primary` agency. Fictional, from (205) 555-0100–0199 (R4). Rendered as a number a person may choose to dial; never auto-dialled (FR-025). |
| `text_summary` | string | One-sentence routed reply body used by the thread, drawn from existing case facts. Names the agency as **recommended first contact pending human confirmation** (FR-023). |

**Catalog growth**: two new entries are added (four total), using fictional communities, fictional
schools, and fictional agencies whose `match_keywords` are **disjoint** from `CASE-03` and `CASE-03B`
so no existing recommendation changes (FR-052, R5).

**Prohibited by construction**: any field named or labelled `owner`; any real school, community, or
agency name in `synthetic_location`, `agencies[].name`, or `text_summary`. `evidence[].url` entries
remain real public organizational pages cited as the real-world pattern each fictional agency is
modelled on — the existing, already-documented exception, unchanged by this feature.

---

## 5. MessageThread

The simulated text exchange. Session-only, cleared on restart, never transmitted (FR-017, FR-028).

| Field | Type | Rules |
|---|---|---|
| `messages[]` | `{ from: 'resident' \| 'service', text, ts }` | Ordered. `ts` is a display-only relative label, not a stored timestamp. |
| `stage` | `'trigger' \| 'ack' \| 'pinpoint' \| 'routed'` | Exactly one is current; progress is visible (FR-020). |
| `pinpointIndex` | integer | Which pinpointing question is outstanding within the `pinpoint` stage. |
| `answers` | AnswerRecord | Same shape as §1, so the shared match engine can be called (FR-030). |
| `matchedCaseId` | string \| null | `null` until routed; `null` after routing means the decline outcome (FR-031). |

**State transitions**

| From | Event | To | Rules |
|---|---|---|---|
| `trigger` | resident sends the trigger word | `ack` | Case-insensitive match on `CROSSING`. |
| `trigger` | resident sends anything else | `trigger` | Replies with what to send instead; the stray message is never treated as an answer. |
| `ack` | acknowledgement rendered | `pinpoint` | Automatic. |
| `pinpoint` | resident answers a question | `pinpoint` or `routed` | Advances `pinpointIndex`; on the last answer, calls `matchCase(answers)`. |
| `pinpoint` | answer matches more than one crossing | `pinpoint` | Asks which one; never chooses (edge case, FR-031 posture). |
| `routed` | resident restarts | `trigger` | Clears `messages`, `answers`, `matchedCaseId`; no page reload (FR-028). |
| any | presenter shortcut | `routed` | Clears the in-progress thread **first**, then shows the chosen resolved case (FR-027). |

**Invariants**

- No field holds or solicits a phone number or any other identifier (FR-029).
- No transition performs any network call, dials, or sends anything (FR-017, FR-025).
- The prototype / not-a-live-number / nothing-is-sent label is present in every rendered state (FR-018).
- `matchedCaseId` is either an id present in the catalog or `null` — never a model-produced string
  (Principle III).

---

## 6. VoiceState

Optional enhancement state. Never persisted beyond the session (FR-050).

| Field | Type | Rules |
|---|---|---|
| `enabled` | boolean | False by default; the tool is fully usable without ever setting it true (FR-049). |
| `mode` | `'idle' \| 'speaking' \| 'listening' \| 'interpreting'` | Exactly one; rendered continuously while `enabled` (FR-036). |
| `selectedVoiceURI` | string \| null | The parent's session-scoped override; `null` uses the automatic ranking (FR-043, FR-047). |
| `lastHeard` | string \| null | The most recent transcript, shown back on an unmatched result. Not stored beyond display (FR-039). |
| `support` | `{ canSpeak: boolean, canListen: boolean }` | Each half offered only if present; the tool states which half is available (edge case, FR-041). |

**State transitions**

| From | Event | To |
|---|---|---|
| `idle` | voice enabled / new step rendered | `speaking` |
| `speaking` | utterance ends | `listening` (automatic, FR-037) |
| `speaking` | parent interrupts or navigates | `idle` then `speaking` for the new step (FR-044) |
| `listening` | recognition result received | `interpreting` |
| `interpreting` | clean match | applies the action, then `speaking` for the next step |
| `interpreting` | unmatched / ambiguous / nothing heard | reports what was heard, then `listening` (never silent, FR-039) |
| any | voice disabled, or mic denied/unavailable | `idle`, with a plain-language explanation; the typed path is unaffected (FR-041) |

**Invariants**

- `mode` is never `listening` while an utterance is in progress (FR-038).
- Turning voice on mid-conversation changes no answer and re-asks nothing (FR-042).
- Every action reachable by voice has an equivalent visible control (FR-049).
- No audio is recorded, retained, or transmitted, and no network call originates here (FR-050, SC-016).

---

## Entity relationships

```text
StepDefinition[] ──drives──> ConversationPosition ──cursor over──> AnswerRecord
                                                                      │
MessageThread ──owns its own──> AnswerRecord ─────────────────────────┤
                                                                      ▼
                                                        lib/routing.js  matchCase(answers)
                                                                      │
                                                                      ▼
                                                        CrossingCatalogEntry | null
                                                                      │
                                                                      ▼
                                             one evidence renderer, used by both paths

VoiceState ──observes and drives──> whichever conversation is active (exactly one, FR-032)
```
