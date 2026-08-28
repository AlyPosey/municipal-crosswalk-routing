---
description: "Task list for 002-flow-clarity-voice"
---

# Tasks: Conversation Flow Clarity, Text-First Entry & Usable Voice

**Input**: Design documents from `/specs/002-flow-clarity-voice/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test tasks ARE included. plan.md names two new suites (`tests/thread.test.mjs`,
`tests/voice.test.mjs`), every contract carries a "Test obligations" section, and
`tests/routing.test.mjs` is the designated regression fence for FR-052.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and
demoed independently. Priority order matches the constitution's pre-agreed cut order: if the event
window closes early, drop from the bottom (US5, then US4) and the artifact remains complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Include exact file paths in descriptions

## Path Conventions

Flat repository root, served directly by GitHub Pages with no build step: `index.html`, `app.js`,
`styles.css`, `data/`, `lib/` (new), `tests/`. New logic goes into `lib/` as plain ES modules
imported by both the browser and the Node test harness.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make room for the new modules and establish the pre-change baseline

- [X] T001 Create the `lib/` directory at the repository root and confirm `server.js` serves `lib/*.js` with a `text/javascript` content type (no server change expected — verify only, per plan.md "Structure Decision")
- [X] T002 [P] Extend the `test` script in `package.json` to run all four suites: `node tests/routing.test.mjs && node tests/e2e.test.mjs && node tests/thread.test.mjs && node tests/voice.test.mjs` (new suites may be empty stubs until their phases land)
- [X] T003 [P] Run `npm test` and record the passing baseline from `tests/routing.test.mjs` and `tests/e2e.test.mjs` — this is the FR-052 regression fence every later phase must not break

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The state refactor plus routing extraction described in plan.md "Key Design Decisions"
1 and 2. Back navigation, the text path, and voice-driven navigation are all impossible until
*position* is separated from *answers* and `matchCase` is a pure function of an answer record.

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create `lib/routing.js` exporting pure `matchCase(answers) -> { case_id, score }`, moved verbatim in behaviour from `matchCase()` in `app.js:235`, reading only `answers.location` / `answers.equipment` / `answers.schoolZone`, importing the catalog from `data/cases.js` (per contracts/routing.md)
- [X] T005 Preserve the two Constitution III invariants explicitly in `lib/routing.js`: the location score gates the match (context alone returns `{ case_id: null, score: 0 }`), and an equal top-two total returns `{ case_id: null }` (contracts/routing.md invariants 1–2)
- [X] T006 Update `app.js` to import `matchCase` from `lib/routing.js`, delete the local copy, and keep the `POST /api/route` live-model call in `app.js` honouring a response only when `data.case_id` exists in the local catalog (contracts/routing.md "Live-model interaction")
- [X] T007 Update `tests/routing.test.mjs` to import `matchCase` from `lib/routing.js` and pass an answer record; every existing assertion stays semantically unchanged
- [X] T008 [P] Add assertions to `tests/routing.test.mjs` for context-only input (equipment and school zone answered, location empty or unrelated) returning `case_id: null`, and for equally-matching input returning `case_id: null`
- [X] T009 Create `lib/conversation.js` exporting `createConversation(steps)` with `getState / setAnswer / back / goToConfirm / confirm / restart / canGoBack / isComplete / summary / subscribe`, holding `position` and an `AnswerRecord` with per-key `answered` flags, no DOM references and no rendering (contracts/conversation.md, data-model.md §1–§2)
- [X] T010 Enforce the conversation invariants in `lib/conversation.js`: `answered[key]` set only by `setAnswer` and cleared only by `restart`; `summary()` built from `answered` and never from `position`; `goToConfirm()` rejected unless `isComplete()`; `danger === false` treated as a real answer distinct from `null`; any state change other than `confirm()` clearing `resultVisible`
- [X] T011 Refactor `app.js` to drive all question-path state through `createConversation(STEPS)` — remove the module-level `answers` object (`app.js:16`) and `stepIndex` (`app.js:23`), and render `renderTranscript()`, `renderStep()`, `answer()`, and `reset()` from the subscribed state
- [X] T012 Run `npm test`; the baseline from T003 must still pass unchanged before any story begins

**Checkpoint**: Foundation ready — position, answers, and routing are separable. User stories can now proceed.

---

## Phase 3: User Story 1 - The parent can tell the confirmation step needs a click (Priority: P1) — MVP

**Goal**: One visually dominant primary action on the confirmation step, focused on arrival, visible
without scrolling at 375px, separated from the answer summary, that plainly says it reveals the
recommendation and submits nothing.

**Independent Test**: Give a first-time user the tool with no instructions, ask them to find out who
to call, and observe the confirmation step. Success is reaching the recommendation without prompting
or hesitation at that step.

### Tests for User Story 1

- [X] T013 [P] [US1] Add assertions to `tests/e2e.test.mjs` that the confirmation step renders `#confirm-summary`, `#confirm-actions`, exactly one `#confirm-primary`, and one `#confirm-secondary`, and that the primary and secondary carry different classes (FR-001, FR-005)
- [X] T014 [P] [US1] Add assertions to `tests/e2e.test.mjs` that `#confirm-primary` holds `document.activeElement` when the confirmation step renders, and that activating it moves focus to `#result-heading` (FR-004, FR-006)

### Implementation for User Story 1

- [X] T015 [US1] Add the confirmation-step markup to `index.html`: `#confirm-summary` and a separate `#confirm-actions` block containing `#confirm-primary` and `#confirm-secondary`, both native `<button>` elements (contracts/dom-contract.md "New — question path")
- [X] T016 [US1] Replace the inline confirmation branch in `renderStep()` at `app.js:114` so it renders `#confirm-summary` from `conversation.summary()` and the actions from `#confirm-actions`
- [X] T017 [US1] Write the confirmation copy in `index.html` and `app.js` stating in the parent's terms that the action reveals the recommended first contact and that nothing is submitted to any agency (FR-003)
- [X] T018 [US1] Move focus to `#confirm-primary` in `app.js` when the confirmation step renders, and move focus to `#result-heading` (`tabindex="-1"`) when `confirm()` produces the result (FR-004, FR-006)
- [X] T019 [P] [US1] Add the filled-primary / ghost-secondary button hierarchy to `styles.css` so the two actions are distinguishable by appearance alone, with a visible focus ring on both (research R1)
- [X] T020 [P] [US1] Style `#confirm-summary` in `styles.css` as a recessed block visually separated from `#confirm-actions` (FR-005)
- [X] T021 [P] [US1] Make `#confirm-actions` sticky within the confirmation panel in `styles.css` so the primary action is visible without scrolling at 375px (FR-002, research R1)
- [X] T022 [US1] Run `npm test` and open `index.html` at 375px to confirm the primary action is visible without scrolling

**Checkpoint**: A first-time user reaches a recommendation from the confirmation step unaided. MVP complete.

---

## Phase 4: User Story 2 - The parent can go back and change an answer (Priority: P2)

**Goal**: Back navigation one question at a time that preserves every other answer, restores the
previous answer into the re-displayed question, keeps the transcript and summary in sync, and
withdraws a stale recommendation.

**Independent Test**: Answer all questions with one deliberate mistake, use back navigation to
correct it, and confirm the recommendation and the visible answer record both reflect the corrected
answer.

### Tests for User Story 2

- [X] T023 [P] [US2] Add assertions to `tests/e2e.test.mjs` that `#step-back` returns to the immediately preceding question, that the previous answer is shown as current (including free text in `#free-text`), and that later answers survive a correction (FR-007–FR-009)
- [X] T024 [P] [US2] Add assertions to `tests/e2e.test.mjs` that `#step-back` is `disabled` at position 0, that repeated back there is a no-op, that back from the confirmation step lands on the last question with answers intact, and that back hides `#result-panel` (FR-011, FR-013, FR-014)
- [X] T025 [P] [US2] Add an assertion to `tests/e2e.test.mjs` that `#restart` clears every answer while `#step-back` clears none (FR-012)

### Implementation for User Story 2

- [X] T026 [US2] Add the `#step-back` native `<button>` to the step navigation in `index.html`, placed apart from `#restart` (contracts/dom-contract.md)
- [X] T027 [US2] Wire `#step-back` in `app.js` to `conversation.back()`, setting `disabled` from `canGoBack()` on every render (FR-013, FR-015)
- [X] T028 [US2] Re-populate the re-displayed question in `renderStep()` in `app.js` from the stored answer — the selected choice marked current and `#free-text` pre-filled with the typed text (FR-008)
- [X] T029 [US2] Render `#transcript` and `#confirm-summary` in `app.js` from `answered`, never from the cursor, so a correction updates both at once (FR-010, contracts/conversation.md invariant 3)
- [X] T030 [US2] Wire `#confirm-secondary` in `app.js` to `conversation.back()` so "let me answer again" returns to the last question with all earlier answers preserved (FR-011)
- [X] T031 [US2] Hide `#result-panel` in `app.js` whenever the conversation state changes with `resultVisible` false, so a stale recommendation is withdrawn on back (FR-014)
- [X] T032 [P] [US2] Style `#step-back` in `styles.css` as visually distinct from `#restart`, with a visible focus indicator, so the discarding control is never confused with back (FR-012, FR-015)
- [X] T033 [US2] Run `npm test` and walk the correction round trip by keyboard alone

**Checkpoint**: US1 and US2 both work independently; a mistake costs one question, not the conversation.

---

## Phase 5: User Story 3 - A resident can walk through the text-message path (Priority: P3)

**Goal**: A simulated phone-style message thread inside the page — trigger word, acknowledgement,
pinpointing questions, routed first contact with a dialable fictional number and reachable evidence —
sending nothing, connecting to nothing, collecting no identifier.

**Independent Test**: From a cold page load, complete the simulated text exchange end to end and
arrive at a named first contact with a dialable number, with the synthetic and not-a-live-number
labeling visible throughout.

### Data for User Story 3 (catalog growth)

- [X] T034 [P] [US3] Add `agencies[].contact_phone` to the primary agency of `CASE-03` and `CASE-03B` in `data/cases.js`, using the fiction-reserved (205) 555-0100–0199 range (research R4)
- [X] T035 [P] [US3] Add a `text_summary` one-sentence routed reply to `CASE-03` and `CASE-03B` in `data/cases.js`, naming the agency as recommended first contact pending human confirmation and drawn only from existing case facts (FR-023, data-model.md §4)
- [X] T036 [US3] Add two new synthetic cases to `data/cases.js` (four total) with fictional communities, schools, and agencies, `is_synthetic: true`, and `match_keywords` disjoint from `CASE-03` and `CASE-03B`, each carrying `contact_phone` and `text_summary` (research R5)
- [X] T037 [US3] Run `tests/routing.test.mjs` unchanged after the catalog grows — no existing recommendation may change and no previously matching input may become a tie or a decline (FR-052)

### Tests for User Story 3

- [X] T038 [P] [US3] Create `tests/thread.test.mjs` asserting cold start to a routed reply for at least two catalog cases through `createThread()`
- [X] T039 [P] [US3] Add assertions to `tests/thread.test.mjs` that a non-trigger first message replies with what to send instead and stays in `trigger`, and that an unmatchable description reaches the decline outcome naming no agency (FR-031)
- [X] T040 [P] [US3] Add assertions to `tests/thread.test.mjs` that `restart()` empties messages, answers, and `matchedCaseId` and returns to `trigger`, and that `jumpToCase()` mid-exchange leaves no prior answers in state (FR-027, FR-028)
- [X] T041 [P] [US3] Add the parity assertion to `tests/thread.test.mjs`: equivalent input through the thread and through `lib/conversation.js` plus `lib/routing.js` yields the same `case_id` and the same evidence set (FR-030, SC-015)
- [X] T042 [P] [US3] Add a content scan to `tests/thread.test.mjs` asserting the rendered text path contains no `owner` string and no real school, community, or agency name (FR-022, FR-023, SC-007, SC-008)

### Implementation for User Story 3

- [X] T043 [US3] Create `lib/textThread.js` with `SHORT_CODE = 'XING-DEMO'`, `TRIGGER_WORD = 'CROSSING'`, and `createThread()` returning `getState / send / restart / jumpToCase / subscribe` (contracts/text-thread.md, research R3)
- [X] T044 [US3] Implement the four-stage machine in `lib/textThread.js` — `trigger` to `ack` to `pinpoint` to `routed` — with case-insensitive trigger matching and a non-trigger reply that never records an answer (data-model.md §5)
- [X] T045 [US3] Implement the pinpointing questions in `lib/textThread.js` (nearest school, cross streets, what is wrong), assembling an `AnswerRecord` of the same shape the question path uses and calling `matchCase(answers)` from `lib/routing.js` — the thread performs no matching of its own (research R13)
- [X] T046 [US3] Implement the routed reply, the "no confident match" decline, and the "which one?" ambiguity reply in `lib/textThread.js`, rendering every agency string from `data/cases.js` (FR-031, contracts/text-thread.md invariant 5)
- [X] T047 [US3] Implement `restart()` and `jumpToCase(caseId)` in `lib/textThread.js`, with `jumpToCase` clearing the in-progress thread before jumping (FR-027, FR-028)
- [X] T048 [US3] Add the entry-path tablist to `index.html`: `#path-tabs` with `role="tablist"`, `#tab-questions` and `#panel-questions` selected by default, `#tab-text` and `#panel-text` (research R12)
- [X] T049 [US3] Add the thread markup to `index.html`: `#thread-badge`, `#thread-stage` with `role="status"`, `#thread-messages`, `#thread-input`, `#thread-send`, `#thread-restart`, `#thread-evidence` — with no field labelled or typed as a phone number (FR-018, FR-020, FR-029)
- [X] T050 [US3] Add `#presenter-strip` and `#presenter-jump` to `index.html`, outside the phone mockup and presenter-labelled so a viewer cannot mistake it for the resident experience (FR-027)
- [X] T051 [US3] Extract the evidence rendering from `renderResult()` and `agencyBlock()` in `app.js` into one reusable renderer covering all three roles, `why_this_role`, source links, `source_checked`, and `conflict_or_gap`, and call it from both the question result and `#thread-evidence` (FR-024)
- [X] T052 [US3] Wire the thread in `app.js`: subscribe to `createThread()`, render messages and stage progress, handle `#thread-send`, `#thread-restart`, and `#presenter-jump`, and render the contact number as text a person may choose to dial with no auto-dial and no scripted `tel:` navigation (FR-025)
- [X] T053 [US3] Wire tab switching in `app.js` so exactly one conversation is active — entering one path makes the other's state inert and never merges answers (FR-032)
- [X] T054 [US3] Add the proposal / future-state framing in `index.html` for any statement about pole signage, short-code deployment, agency participation, or syncing from municipal systems (FR-026)
- [X] T055 [P] [US3] Style the phone mockup, `#thread-badge`, stage counter, message bubbles, and `#presenter-strip` in `styles.css`, keyboard-operable with visible focus at 375px and desktop
- [X] T056 [US3] Run `npm test` and walk the text path end to end from a cold load

**Checkpoint**: Both entry paths reach the same recommendation from the same engine, proven by test.

---

## Phase 6: User Story 4 - The tool actually hears the parent, and says how to talk to it (Priority: P4)

**Goal**: Voice input on every question including multiple choice and confirmation, spoken navigation
commands, a visible speaking/listening/interpreting/idle state, automatic listen-after-speak,
never-silent failure, and plain instructions for how to talk to it.

**Independent Test**: Turn voice on, complete the entire conversation by speaking only, and reach a
recommendation without touching the keyboard or screen.

### Tests for User Story 4

- [X] T057 [P] [US4] Create `tests/voice.test.mjs` asserting `parseCommand` resolves every phrase in the closed table — repeat, back, start over, confirm, stop listening — and returns `null` for unrelated speech (research R8)
- [X] T058 [P] [US4] Add assertions to `tests/voice.test.mjs` that `matchSpokenPhrase` selects on exact label, on synonym, and on ordinal form; returns `ambiguous` for a phrase matching two choices such as one containing both "signal" and "beacon"; and returns `unmatched` for gibberish on a choice-only step (FR-034, research R7)
- [X] T059 [P] [US4] Add an assertion to `tests/e2e.test.mjs` that with no Web Speech APIs present in jsdom the voice controls stay hidden and the typed path completes unchanged (FR-041, FR-049)

### Implementation for User Story 4

- [X] T060 [US4] Add a `synonyms[]` array to every choice in the `STEPS` definition in `app.js` for spoken alternates (data-model.md §3, research R7)
- [X] T061 [US4] Create `lib/voice.js` exporting the pure functions `parseCommand(phrase)` and `matchSpokenPhrase(phrase, step)` with normalization (lowercase, strip punctuation, collapse whitespace), commands checked before choice matching, and ties returning `ambiguous` (contracts/voice.md)
- [X] T062 [US4] Implement `createVoice({ getStep, onCommand, onChoice, onFreeText, onStatus })` in `lib/voice.js` with the `idle`/`speaking`/`listening`/`interpreting` state machine, never listening while an utterance is in progress, and listening resuming automatically once a prompt finishes (FR-036–FR-038)
- [X] T063 [US4] Implement the recognition lifecycle in `lib/voice.js` — one long-lived `SpeechRecognition` with `continuous = false` and `interimResults = false`, restarted per turn — and surface mic-denied, unavailable, and unsupported as a plain-language explanation in `#voice-error` (research R6, FR-041)
- [X] T064 [US4] Implement never-silent failure in `lib/voice.js`: when listening ends without a usable answer, report what was heard or that nothing was heard, then listen again (FR-039, SC-012)
- [X] T065 [US4] Add `#voice-status` with `role="status"` and `aria-live="polite"`, plus `#voice-heard`, `#voice-help`, and `#voice-error` to `index.html` (contracts/dom-contract.md "New — voice")
- [X] T066 [US4] Write the short "how to talk to it" instructions into `#voice-help` in `index.html` — when to speak and which commands work — shown when voice is turned on and reachable thereafter (FR-040)
- [X] T067 [US4] Wire `lib/voice.js` into `app.js`: route `onChoice` to `conversation.setAnswer`, `onFreeText` to the free-text step, and `onCommand` to back, repeat, restart, and confirm, with "yes" resolving to confirm on the confirmation step (FR-033, FR-035)
- [X] T068 [US4] Remove the old `speak()` (`app.js:484`) and `setupVoice()` (`app.js:490`) and the module-level `voiceOn` and `recognition` state (`app.js:25-26`), replacing them with the controller
- [X] T069 [US4] Route spoken input in `app.js` to the active conversation only, never recording it against both paths, and ensure enabling voice mid-conversation alters no existing answer (FR-032, FR-042)
- [X] T070 [P] [US4] Style the `#voice-status` pill, `#voice-heard`, and `#voice-error` in `styles.css` so listening state is identifiable within a second of looking (SC-011)
- [X] T071 [US4] Run `npm test` and complete a conversation by speaking only

**Checkpoint**: The parent can reach a recommendation by voice, and never fails silently.

---

## Phase 7: User Story 5 - The spoken prompts sound like a person, not a machine (Priority: P5)

**Goal**: The most natural-sounding device voice selected automatically, delivery paced for a
first-time listener and interruptible, only the question and choices read aloud, a repeat control,
and a session-scoped voice picker.

**Independent Test**: Turn voice on and listen through the whole conversation; every prompt is
intelligible on first hearing, and no interface boilerplate is read aloud.

### Tests for User Story 5

- [X] T072 [P] [US5] Add assertions to `tests/voice.test.mjs` that `rankVoices` prefers a "Neural" or "Natural" named voice over a "Compact" one and never throws on an empty list (research R9)
- [X] T073 [P] [US5] Add assertions to `tests/voice.test.mjs` that `speechTextFor(step)` includes the question and every choice label and excludes disclaimer and banner text (FR-045, research R10)

### Implementation for User Story 5

- [X] T074 [US5] Implement `rankVoices(voices)` in `lib/voice.js` with the scoring heuristic (Neural, Natural, Premium, Enhanced, known-good vendor names, English locale) and the `voiceschanged` retry, falling back to the platform default when nothing ranks (FR-043, FR-048, research R9)
- [X] T075 [US5] Add a derived `speechText` per step and implement `speechTextFor(step)` in `lib/voice.js` — question, "Your options are:" plus choice labels, and at most one short guidance sentence; never disclaimers, headings, or banners (FR-045)
- [X] T076 [US5] Set utterance rate to about 0.95 and tune pitch for first-hearing intelligibility in `lib/voice.js`, and make speech interruptible so navigating or repeating cancels the current utterance immediately (FR-044, research R9)
- [X] T077 [US5] Implement `repeat()`, `setVoice(voiceURI)`, and `listVoices()` in `lib/voice.js`, with the voice override held for the session only (FR-046, FR-047)
- [X] T078 [US5] Add `#voice-repeat` and `#voice-picker` to `index.html`, the picker rendered only when more than one voice exists (contracts/dom-contract.md)
- [X] T079 [US5] Wire `#voice-repeat` and `#voice-picker` in `app.js` to `repeat()` and `setVoice()`, keeping both reachable by on-screen control as well as by voice command (FR-046, FR-047)
- [X] T080 [US5] Run `npm test` and listen through the whole conversation on a device with more than one English voice

**Checkpoint**: All five user stories are independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T081 [P] Scan the whole artifact (`index.html`, `app.js`, `styles.css`, `data/cases.js`, `lib/`) for the string `owner` or "legal owner" and for any real school, community, or agency name; zero occurrences permitted (SC-007, SC-008, Constitution I and III)
- [X] T082 [P] Audit `lib/` for outbound network activity — no `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, form submission, or navigation in `lib/textThread.js` or `lib/voice.js`; the only outbound call in the artifact remains `POST /api/route` in `app.js` (FR-050, SC-016)
- [X] T083 Keyboard-and-pointer pass over every path at 375px and desktop with voice never enabled — tabs, back, confirm, restart, thread composer, presenter jump — each with a visible focus indicator (SC-014, Principle VII)
- [X] T084 Run the static build with no server present (open `index.html` directly) and confirm both entry paths reach a recommendation (FR-053, SC-016)
- [X] T085 Execute `specs/002-flow-clarity-voice/quickstart.md` end to end and correct any step that no longer matches the built behaviour
- [ ] T086 [P] Update `README.md` and `SUBMISSION.md` to describe the two entry paths, the simulated short code, and the voice enhancement, with the prototype framing intact — DEFERRED: a peer session is actively editing both files (submission deadline today); re-run this task once that settles to avoid clobbering concurrent work
- [X] T087 Remove dead code left by the refactor in `app.js` (old `stepIndex` helpers, the inline confirmation branch, the retired voice functions) and confirm no unused exports remain in `lib/`
- [X] T088 Run the full `npm test` suite one final time; all four suites pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS every user story. The position/answers split (T009–T011) and the routing extraction (T004–T006) are prerequisites for US1–US5.
- **US1 (Phase 3)**: Depends on Foundational only
- **US2 (Phase 4)**: Depends on Foundational only. T030 touches `#confirm-secondary`, which US1 creates — run US1 first if both are in play, or coordinate on `index.html`.
- **US3 (Phase 5)**: Depends on Foundational only (needs `lib/routing.js` and the `AnswerRecord` shape)
- **US4 (Phase 6)**: Depends on Foundational only (drives `lib/conversation.js` by spoken command)
- **US5 (Phase 7)**: Depends on US4 — `lib/voice.js` must exist before its speech quality is tuned
- **Polish (Phase 8)**: Depends on all desired stories being complete

### Within Each User Story

- Tests are written before the implementation they cover and are expected to fail first
- Data before modules; modules before markup; markup before wiring; wiring before styling
- Each story ends with a test run at its checkpoint

### Parallel Opportunities

- **Setup**: T002 and T003 run together
- **Foundational**: T008 runs alongside T009 (different files)
- **US1**: T013 and T014 together (tests); T019, T020, and T021 together (distinct `styles.css` rules — serialize if one editor)
- **US2**: T023, T024, and T025 together (tests); T032 independent
- **US3**: T034 and T035 together; T038–T042 all together (one new test file, distinct assertions); T055 independent of the module work
- **US4**: T057, T058, and T059 together; T070 independent
- **US5**: T072 and T073 together
- **Cross-story**: once Foundational lands, US1, US3, and US4 can be worked by three people in parallel — US1 owns the confirmation block, US3 owns `lib/textThread.js` and the thread panel, US4 owns `lib/voice.js`. All three touch `index.html` and `styles.css`, so coordinate those two files.

---

## Parallel Example: User Story 3

```bash
# Launch the thread test suite assertions together:
Task: "Cold start to routed reply for two cases in tests/thread.test.mjs"
Task: "Non-trigger and decline outcomes in tests/thread.test.mjs"
Task: "restart() and jumpToCase() state clearing in tests/thread.test.mjs"
Task: "Parity assertion across both paths in tests/thread.test.mjs"
Task: "Content scan for owner strings and real names in tests/thread.test.mjs"

# Launch the catalog data tasks together:
Task: "Add contact_phone to existing cases in data/cases.js"
Task: "Add text_summary to existing cases in data/cases.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1: Setup
2. Phase 2: Foundational — the state refactor and routing extraction (CRITICAL, blocks everything)
3. Phase 3: User Story 1 — the confirmation gate reads as a gate
4. **STOP and VALIDATE**: hand the tool to someone with no instructions and watch the confirmation step
5. This alone repairs the dead end on the only path to the tool's output

### Incremental Delivery

1. Setup + Foundational — foundation ready, existing tests still green
2. Add US1 — the confirmation gate works — demo (MVP)
3. Add US2 — corrections cost one question, not the conversation — demo
4. Add US3 — the text path, the strongest expression of the premise — demo
5. Add US4 — voice that hears the parent — demo
6. Add US5 — voice that sounds like a person — demo

### Cut Order Under Time Pressure

The constitution's pre-agreed cut order is honoured by the phase order: drop Phase 7 (US5) first,
then Phase 6 (US4). The artifact remains complete and rule-compliant with US1–US3 shipped, because
two working text paths to a recommendation exist without voice.

---

## Notes

- `[P]` tasks touch different files and have no dependency on an incomplete task
- `tests/routing.test.mjs` is the FR-052 regression fence — run it after T006, T011, and T037
- Nothing in this feature may change which agency is recommended, the evidence shown, the human-confirmation requirement, or the synthetic-data notices for any existing case
- Commit after each task or logical group; stop at any checkpoint to validate a story independently
