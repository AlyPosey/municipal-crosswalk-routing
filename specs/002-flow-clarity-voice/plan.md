# Implementation Plan: Conversation Flow Clarity, Text-First Entry & Usable Voice

**Branch**: `002-flow-clarity-voice` | **Date**: 2026-08-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-flow-clarity-voice/spec.md`

## Summary

Three repairs and one addition to the existing crosswalk routing assistant, all of them inside the
conversation flow and none of them touching what the tool recommends:

1. **The confirmation gate reads as a gate** — one visually dominant primary action, focused on
   arrival, visible without scrolling at 375px, separated from the answer summary, with focus moved
   to the recommendation on activation.
2. **Back navigation** — one question at a time, preserving every other answer, with the visible
   answer record and the confirmation summary always drawn from the current answers.
3. **A simulated text-message entry path** — a phone-style message thread inside the page that
   demonstrates texting a fictional short code, answering pinpointing questions, and receiving a
   routed first contact. Nothing is sent; no telephony, no new network activity.
4. **Voice that works** — recognition on every question including multiple choice, spoken navigation
   commands, a visible speaking/listening/interpreting/idle state, automatic listen-after-speak,
   never-silent failure, plain instructions, the best available natural voice, and a repeat control.

The technical spine is a **state refactor plus a routing extraction**. Today the question path
derives "how many questions are answered" from `stepIndex`, which makes going back indistinguishable
from erasing; and `matchCase()` reads module-level `answers` directly, so a second entry path cannot
reach it. Separating *position* from *answers*, and making the match engine a pure function of an
answer record, is what makes back navigation, the text path, and voice-driven navigation possible
without duplicating routing logic (FR-030, SC-015).

## Technical Context

**Language/Version**: JavaScript (ES2022), native browser ES modules; Node.js 18+ for the optional
proxy and the test harness.

**Primary Dependencies**: None at runtime — the app still installs nothing. The browser supplies the
Web Speech API (`SpeechSynthesis`, `SpeechRecognition` / `webkitSpeechRecognition`); both halves are
optional enhancements. `jsdom` remains a dev-only dependency for the test harness.

**Storage**: None. Conversation state, thread state, and voice state live in memory in the tab and
are discarded on reload. No `localStorage`, no cookies, no server-side transcript.

**Testing**: The existing zero-framework harness (`node tests/*.mjs`, jsdom driving the real
`index.html` and `app.js`), extended with navigation, text-thread, and voice-logic suites. Web Speech
APIs are stubbed in jsdom so voice *logic* — choice matching, command parsing, state transitions,
voice ranking — is tested without audio.

**Target Platform**: Modern mobile and desktop browsers, 375px through desktop widths; the published
static build on GitHub Pages with no server present.

**Project Type**: Static single-page web application with an optional local API proxy (unchanged).

**Performance Goals**: Confirmation to displayed recommendation under 10s for a first-time user
(SC-002); a correction round trip under 30s (SC-003); the text path completed end to end under 90s
(SC-005); presenter shortcut to a resolved case in two interactions or fewer (SC-006); any unmatched
spoken input acknowledged within 3s (SC-012).

**Constraints**: No new outbound network activity of any kind (FR-050, SC-016). No audio recorded,
retained, or transmitted. Every path finishable by keyboard alone and by pointer alone with voice
never enabled (SC-014). Full behaviour in the static build with no server (FR-053). No personal
identifiers requested or stored on any path. Work must land inside the event window (hard deadline
2:00 PM CDT, 2026-08-28), so the plan is sequenced strictly by spec priority.

**Scale/Scope**: One five-question path, one four-stage simulated thread, a synthetic catalog growing
from 2 to 4 cases, four new browser modules, two new test suites. No build step is introduced.

## Constitution Check

*GATE: evaluated before Phase 0 and re-evaluated after Phase 1 design. Both passes are recorded below.*

| Principle | How this feature satisfies it | Post-design verdict |
|---|---|---|
| **I. Synthetic-only data** (NON-NEGOTIABLE) | Every new case, crossing, school, community, agency, contact name, and phone number is fictional and carries `is_synthetic: true`. The supplied mockup's real Birmingham-area schools, communities, and real state agency are **replaced**, not adapted (FR-022, SC-007). The persistent page banner is joined by a thread-level "prototype / not a live number / nothing is sent" label visible on every text-path screen (FR-018). Contact numbers use the NANP fiction-reserved 555-01xx range. | PASS |
| **II. No writes to live systems** (NON-NEGOTIABLE) | The text path is a pure client-side simulation: no telephony provider, no webhook, no `fetch`, no form post, no auto-dial. Numbers are rendered as something a person chooses to dial (FR-025). Speech recognition and synthesis run in the browser; no audio leaves the device (FR-050). Outbound network activity is unchanged — still only the optional `POST /api/route` to our own proxy. | PASS |
| **III. No invented ownership** (NON-NEGOTIABLE) | Both entry paths call the *same* extracted match engine, which may return only an existing `case_id` or `null` for unresolved. The mockup's `OWNER` column and its "legal owner" copy are prohibited; the knowledge-base display and every routed reply say **recommended first contact pending human confirmation**, with the reason visible (FR-023). All rendered agency prose still comes only from `data/cases.js`. A description that does not confidently match produces the existing decline, on the text path too (FR-031). | PASS |
| **IV. Human in the loop** | The confirmation gate is strengthened, not softened — the change makes the required human action *more* obvious, and the step states plainly that nothing is submitted (FR-003). The text result carries the confirmation requirement and reaches the same call script. | PASS |
| **V. Evidence and uncertainty visible** | The text result links through to the same full evidence rendering: all three roles, why each holds its role, source links, `source_checked`, and the specific gap (FR-024). Short-code signage, agency participation, and "syncing from municipal systems" are labelled as proposals, never as existing arrangements (FR-026). | PASS |
| **VI. No secrets client-side** | No new credential and no new key surface. The feature adds no server code path; every new capability works in the static build with no server (FR-053). | PASS |
| **VII. Accessible and degradable** | Back, confirm, path switching, thread send, and repeat are native buttons with visible focus. Voice stays strictly an enhancement: every voice capability has an equivalent visible control, and a browser with neither half of the Web Speech API loses nothing (FR-041, FR-049). Layout verified at 375px. | PASS |
| **Privacy constraints** | The thread never asks for a phone number and has no field soliciting an identifier (FR-029). Spoken and texted input is treated exactly as typed input (FR-051). Nothing persists past the tab. | PASS |

**Gate result: PASS at both checkpoints. No principle requires an exception, so Complexity Tracking
is empty.** The one place the supplied design conflicted with the constitution — real place names and
an `OWNER` column — is resolved by replacing that content, per the spec's own assumptions. The
feature is built to the constitution, not to the mockup.

## Project Structure

### Documentation (this feature)

```text
specs/002-flow-clarity-voice/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output — decisions and rationale
├── data-model.md        # Phase 1 output — entities and state shapes
├── quickstart.md        # Phase 1 output — runnable validation guide
├── contracts/           # Phase 1 output — module and DOM contracts
│   ├── routing.md
│   ├── conversation.md
│   ├── text-thread.md
│   ├── voice.md
│   └── dom-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source code (repository root)

```text
index.html              + entry-path switcher, text-thread panel, voice status region,
                          voice help and voice picker, back control in the step nav
styles.css              + primary/secondary button hierarchy, sticky confirm affordance,
                          path switcher, phone-mockup thread, voice status pill
app.js                  boot, wiring, question-path rendering, result rendering
lib/routing.js          NEW — pure match engine, extracted from app.js unchanged in behaviour
lib/conversation.js     NEW — question-path state machine (position, answers, back/forward)
lib/textThread.js       NEW — simulated thread script and four-stage machine
lib/voice.js            NEW — voice controller: state machine, TTS voice ranking,
                          recognition lifecycle, command grammar, choice matching
data/cases.js           grown catalog (4 synthetic cases) + fictional contact numbers
server.js               unchanged
tests/routing.test.mjs  extended — existing assertions must still pass unchanged
tests/e2e.test.mjs      extended — confirmation affordance, focus, back navigation
tests/thread.test.mjs   NEW — text-path stages, parity with the question path, decline
tests/voice.test.mjs    NEW — choice matching, command grammar, voice ranking (no audio)
```

**Structure Decision**: The flat root is kept so GitHub Pages serves `main` at `/` with no build
step. New logic goes into `lib/` as plain ES modules imported by both `app.js` (browser) and the Node
test harness — the same dual-consumer pattern `data/cases.js` already uses, and what keeps a single
definition of the routing rule shared by both entry paths. `server.js` already serves arbitrary
static subdirectories with a correct `text/javascript` content type, so `lib/` needs no server change.

## Key Design Decisions

### 1. Position is not the same as progress

`stepIndex` currently means both "which question is showing" and "how many are answered". Splitting it
into a `position` cursor and an `answers` record with a per-key answered flag is the whole of back
navigation: going back moves the cursor and touches nothing else. The transcript and the confirmation
summary render from `answers`, not from the cursor, so a correction shows up everywhere at once
(FR-010, SC-004). See [contracts/conversation.md](./contracts/conversation.md).

### 2. One match engine, two entry paths

`matchCase()` moves to `lib/routing.js` as `matchCase(answers)` — a pure function of an answer record,
with the location gate and the tie-decline rule carried over unchanged. Both entry paths build an
answer record and call it, which makes FR-030 and SC-015 structural rather than something to keep in
sync by hand. The existing `tests/routing.test.mjs` assertions are the regression fence for
"unchanged behaviour" (FR-052).

### 3. The text path is a simulation, and says so on every screen

No telephony, no webhook, no phone numbers collected. The short code is rendered as a plainly
non-numeric demo token so a viewer cannot dial or text it by mistake, alongside a persistent badge
(FR-018, FR-019). The presenter shortcut clears any in-progress thread before jumping, so no
abandoned answers leak into the shown case.

### 4. Voice is one explicit state machine, not scattered callbacks

`lib/voice.js` owns exactly one of `idle | speaking | listening | interpreting`, renders it into a
status region, and enforces the two rules that make voice usable: never listen while speaking, and
always resume listening once a prompt finishes (FR-036–FR-038). Recognition results route through a
matcher that resolves a phrase to a choice, a navigation command, free text, an ambiguity, or nothing
— and every outcome except a clean match produces visible and audible feedback (FR-039).

### 5. Voice quality is device-local

No cloud TTS. Available voices are ranked by name and locale against a preference list (Neural,
Natural, Premium, Enhanced, then known-good vendor names), with rate and pitch tuned for
first-hearing intelligibility, an on-screen picker when more than one voice exists, and graceful use
of the default when nothing ranks (FR-043, FR-047, FR-048).

### 6. Sequencing follows spec priority and the constitution's cut order

P1 (confirm affordance) → P2 (back navigation) → P3 (text path) → P4 (voice input) → P5 (voice
quality). The constitution's pre-agreed cut order places voice above the live model proxy, so if the
window closes early, P4 and P5 are dropped and the artifact remains complete and rule-compliant.

## Phase 0 — Research

Complete. See [research.md](./research.md). No `NEEDS CLARIFICATION` markers remain: the spec's
Assumptions section resolved the product-level unknowns (simulation rather than real SMS,
device-local voice, fictional replacement data), and research.md resolves the implementation-level
ones (fictional short-code form, dialable-number format, TTS voice ranking, recognition restart
semantics, testing Web Speech under jsdom, growing the catalog without regressing existing matches).

## Phase 1 — Design & Contracts

Complete. Generated:

- [data-model.md](./data-model.md) — conversation position and answer record, crossing catalog entry
  (grown shape), message thread, voice state, with validation rules and state transitions.
- [contracts/routing.md](./contracts/routing.md) — the shared match engine's signature, gating rule,
  and invariants.
- [contracts/conversation.md](./contracts/conversation.md) — question-path operations and invariants.
- [contracts/text-thread.md](./contracts/text-thread.md) — the four-stage machine, its replies, the
  decline outcome, and the presenter shortcut.
- [contracts/voice.md](./contracts/voice.md) — voice states, transitions, command grammar, and the
  matcher's outcomes.
- [contracts/dom-contract.md](./contracts/dom-contract.md) — the stable element ids, roles, and live
  regions the tests and the voice controller depend on.
- [quickstart.md](./quickstart.md) — how to run and validate every user story, including the
  no-server static run and the accessibility and privacy checks.

## Complexity Tracking

No constitutional violations. Table intentionally empty.
