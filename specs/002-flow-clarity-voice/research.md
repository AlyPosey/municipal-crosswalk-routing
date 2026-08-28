# Phase 0 Research: Conversation Flow Clarity, Text-First Entry & Usable Voice

**Feature**: `002-flow-clarity-voice` | **Date**: 2026-08-28

The spec's Assumptions section already resolved the product-level unknowns (simulated thread rather
than real SMS, device-local voice rather than cloud TTS, fictional replacement data, back-one-step
navigation). What remained were implementation-level unknowns. Each is resolved below. **No
`NEEDS CLARIFICATION` markers remain in the Technical Context.**

---

## R1. How to make the confirmation action unmistakable at 375px

**Decision**: A single filled, full-width **primary** button ("Yes — show me who to contact first"),
with the "answer again" action rendered below it as a plain ghost/text button at reduced weight. The
answer summary moves into a bordered, visually recessed block with a heading, separated from the
action block by a rule, so the actions never read as list items. On a viewport where the primary
action would fall below the fold, the action block becomes a bottom-sticky bar within the panel
carrying the same button. The primary receives focus on render and keeps a 3px visible focus ring.

**Rationale**: The reported failure is that the step reads as a summary, not a gate. The three signals
that fix it are all presentational: fill versus no fill (distinguishable without reading labels,
FR-001), physical separation from the summary (FR-005), and guaranteed visibility without scrolling
(FR-002). Sticky-within-panel is preferred over a page-level fixed bar because a page-level bar would
also overlay the result after confirmation.

**Alternatives considered**: Auto-advance with no confirmation — rejected outright, Constitution IV
requires the human gate. A modal dialog — rejected: it adds a focus trap and an extra dismissal for
keyboard and voice users, and the spec asks for a clearer step, not a different one. Animating the
button — rejected: motion is not a substitute for hierarchy and is hostile to reduced-motion users.

---

## R2. Separating conversation position from answers

**Decision**: Replace the single `stepIndex` with `position` (an integer cursor, `STEPS.length`
meaning the confirmation step) plus an `answers` object whose keys carry both value and an
`answered` boolean. Rendering the transcript and the summary iterates `STEPS` and includes any step
whose key is answered — never "every step before the cursor". `back()` decrements `position` only.
`answer()` writes the value and advances `position` by one, without clearing anything ahead of it.

**Rationale**: Every P2 requirement (FR-007 to FR-014) falls out of this one change. Deriving
"answered" from the cursor is precisely what makes going back look like erasing. The explicit
`answered` flag also gives `danger: false` a truthful representation, which a truthiness check on the
current shape cannot express.

**Alternatives considered**: An undo stack of prior states — rejected as more machinery than a
four-key record needs, and it makes "preserve later answers" harder rather than easier. Storing
history in the URL hash — rejected: it adds persistence semantics the spec explicitly excludes and
would survive a reload, contradicting the stated design.

---

## R3. A fictional short code that cannot be dialled or texted by accident

**Decision**: Render the short code as a non-numeric demo token — `XING-DEMO` — presented in the
thread header as "Demo short code · not a live number", with the trigger word `CROSSING`. Never print
a five- or six-digit numeric short code anywhere in the artifact.

**Rationale**: FR-019 requires the short code not correspond to any working service. Numeric short
codes are allocated from a live registry, so *any* plausible-looking five-digit number risks landing
on a real one; there is no reserved fictional range for short codes the way 555-0100–555-0199 is
reserved for phone numbers in fiction. A non-numeric token is unallocatable by construction, and it
also makes the edge case "a viewer texts it from a real phone" implausible rather than merely
discouraged.

**Alternatives considered**: `55555` or a similar repdigit — rejected: repdigits are allocatable and
some are in use. A number in the 555-01xx range as the "short code" — rejected: it is a phone number
format, not a short code, and would muddle the demonstration.

---

## R4. Contact numbers a person can choose to dial

**Decision**: Each catalog case gains a `contact_phone` on its primary agency, drawn from the
NANP fiction-reserved range **(205) 555-0100 through (205) 555-0199**. It is rendered as text with a
"fictional number — this tool will not call it" note. A `tel:` link is permitted only as a link the
person taps deliberately; no script may set `location.href` to a `tel:` URL, and no auto-dial of any
kind exists.

**Rationale**: FR-025 wants a number that reads as dialable while Constitution II forbids the tool
placing a call. The 555-01xx range is the standard reserved-for-fiction block, so a viewer who does
dial it reaches nothing. Keeping dialing strictly user-initiated satisfies the "never places a call,
including 911" rule.

**Alternatives considered**: Omitting numbers entirely — rejected: FR-025 and the text path's whole
demonstration require one. Using a real agency's published number — rejected: violates Principle I
outright.

---

## R5. Growing the catalog without changing any existing recommendation

**Decision**: Grow from two cases to four. The two new synthetic crossings use fictional communities,
fictional schools, and fictional agencies with **no keyword overlap** with `CASE-03` or `CASE-03B` —
distinct community names, distinct school names, distinct route identifiers. `tests/routing.test.mjs`
is run before and after the addition, unchanged, as the regression fence.

**Rationale**: FR-052 forbids changing which agency is recommended for any existing case, and the
match engine scores keyword hits across all cases, so a careless new entry could out-score an
existing one or create a tie that turns a previously matching input into a decline. Disjoint keyword
sets make interference impossible rather than unlikely; the existing tests prove it.

**Alternatives considered**: Scoping the text path to a separate mini-catalog — rejected: it would
break FR-030 parity, which requires both paths to reach the same routing logic and the same
evidence. Adding many cases for a richer knowledge-base table — rejected under the event window;
four is enough to demonstrate a presenter shortcut with real variety.

---

## R6. Speech recognition on every question, including multiple choice

**Decision**: One long-lived `SpeechRecognition` instance owned by `lib/voice.js` with
`continuous = false` and `interimResults = false`, restarted per turn. Its `result` handler passes the
transcript to a matcher which, in order: (1) tests navigation commands, (2) tests choice labels and
choice synonyms for the current step, (3) if the step accepts free text, takes the transcript as
free text, (4) otherwise returns `unmatched` or `ambiguous`. The `end` event decides what happens
next: if the tool is still listening and got nothing usable, it reports and re-listens; if the tool is
speaking, it does nothing.

**Rationale**: The current implementation only ever wrote recognition results into `#free-text`, which
exists on one of five steps — the direct cause of "it seems not to hear us". Restarting a single
instance per turn is the portable pattern; Chrome's `continuous = true` produces long-running sessions
that fire `end` unpredictably and are harder to stop cleanly before speaking (FR-038).

**Alternatives considered**: Continuous recognition with an activity timer — rejected: harder to
guarantee "not listening while speaking", and it keeps the microphone open longer than the
interaction needs. A push-to-talk button only — rejected: FR-037 requires listening to resume by
itself for each new question.

---

## R7. Matching a spoken phrase to a multiple-choice option

**Decision**: Normalize (lowercase, strip punctuation, collapse whitespace), then score each choice
by: exact match of the label, containment of the label, containment of any of a small hand-written
synonym list per choice (e.g. "signal", "walk signal", "stoplight" → "Traffic or walk signal"), and
ordinal forms ("one", "first", "number two"). Exactly one top scorer selects that choice; two or more
tied scorers return `ambiguous`, which asks the parent to choose between the matching options rather
than guessing; zero returns `unmatched`.

**Rationale**: FR-034 explicitly requires a request to choose rather than a guess when a phrase
matches more than one choice, and the spec's edge case names the realistic collision (a description
containing both "signal" and "beacon"). Ordinals are included because they are what people actually
say to a list read aloud.

**Alternatives considered**: Fuzzy string distance — rejected: it manufactures confident matches from
near-misses, the opposite of the spec's "do not guess" posture, and it is hard to explain in a demo.
Sending the transcript to the model for interpretation — rejected: FR-050 forbids new outbound
network activity and the static build has no server.

---

## R8. Spoken navigation commands

**Decision**: A fixed phrase table, matched after normalization, checked before choice matching:

| Intent | Accepted phrases |
|---|---|
| Repeat | `repeat`, `repeat that`, `say that again`, `again`, `what was that` |
| Back | `back`, `go back`, `previous`, `change that`, `last question` |
| Start over | `start over`, `restart`, `reset`, `begin again` |
| Confirm | `confirm`, `yes`, `yes show me`, `show me`, `that is right`, `correct` |
| Stop voice | `stop listening`, `turn off voice` |

**Rationale**: FR-035 names four required intents; a closed table keeps behaviour predictable and
testable without audio. Commands are checked first so that a step whose choices include "Yes" does
not swallow a confirm command — with the deliberate exception that on the confirmation step, "yes"
resolves to confirm, which is the same action.

**Alternatives considered**: A wake word before commands — rejected as friction the spec does not ask
for. Model-side intent parsing — rejected for the same network reason as R7.

---

## R9. Choosing the most natural-sounding device voice

**Decision**: Rank `speechSynthesis.getVoices()` by score: `+8` if the name matches
`/neural|natural|premium|enhanced/i`; `+4` for known higher-quality vendor prefixes (`Google`,
`Microsoft`, `Samantha`, `Ava`, `Aria`, `Jenny`); `+2` if `localService === false`; `+2` for an exact
`en-US` locale and `+1` for any other `en-*`; `-6` for names matching `/compact|espeak|robot/i`.
Highest score wins, ties break on list order. Speak at `rate 0.95`, `pitch 1.0`. Populate the picker
from the same ranked list; the parent's pick overrides the automatic choice for the session. If the
list is empty on first call, listen once for `voiceschanged` and re-rank.

**Rationale**: FR-043 requires automatic selection with no configuration and FR-048 requires graceful
fallback. Voice availability is device- and browser-specific and the list is asynchronous in Chrome,
which is the standard trap — hence the `voiceschanged` retry. Slightly-under-1 rate measurably helps
first-hearing comprehension (SC-013) without sounding sluggish.

**Alternatives considered**: A cloud TTS voice — rejected by Constitution II and VI, and it would
break the static build. Hard-coding a voice name — rejected: it exists on one platform and fails
silently on every other.

---

## R10. Restricting what gets read aloud

**Decision**: Every spoken utterance is composed from a dedicated `speechText` built for the step —
the question, then "Your options are:" and the choice labels, then at most one short guidance
sentence. Disclaimers, the synthetic banner, headings, the privacy note, evidence blocks, and the
result body are never passed to the synthesizer. The result announcement stays what it is today: the
primary agency name with its pending-confirmation framing.

**Rationale**: FR-045 prohibits reading page furniture, and the current implementation reads whatever
is in `#step-question` plus, for the confirmation step, a hand-written line. Composing speech text
explicitly per step rather than scraping the DOM is what makes the rule enforceable and testable.

**Alternatives considered**: An `aria-hidden`-driven filter over the DOM — rejected: it couples
speech content to markup structure and breaks the moment the layout changes.

---

## R11. Testing Web Speech under jsdom

**Decision**: jsdom implements neither `speechSynthesis` nor `SpeechRecognition`. Voice logic is
therefore written as exported pure functions in `lib/voice.js` — `matchSpokenPhrase(phrase, step)`,
`parseCommand(phrase)`, `rankVoices(list)`, `speechTextFor(step)` — and unit-tested directly in
`tests/voice.test.mjs` with no DOM. The e2e suite additionally asserts the *degradation* path: with
no speech APIs present, the voice toggle stays hidden and the typed path completes unchanged, which
is the existing harness's condition today.

**Rationale**: This gives real coverage of the parts that carry the requirements (FR-034, FR-035,
FR-043, FR-045) while keeping the harness dependency-free, and it directly exercises SC-014 and
FR-049 — the tool must be fully usable with no voice at all.

**Alternatives considered**: Stubbing the full Web Speech API in jsdom — rejected: the stub would be
larger than the code under test and would prove only that the stub works. Headless-browser testing —
rejected: it adds a heavyweight dependency inside a four-hour window.

---

## R12. Presenting two entry paths without letting either be mistaken for the other

**Decision**: A tablist above the conversation with two tabs — "Answer five questions" (default,
selected) and "Text the crossing (demo)". Switching tabs makes the other path's state inert without
merging or discarding it; only one conversation is active at a time (FR-032). The text panel carries
its own persistent prototype badge independent of the page-level synthetic banner, and the presenter
shortcut lives in a visually distinct strip labelled for presenters, outside the phone mockup
(FR-027).

**Rationale**: The spec's assumption fixes the question path as the default landing experience, both
because the P1/P2 repairs live there and because a simulation shown first risks being read as a live
service. A native tablist keeps the switch keyboard-operable with visible focus at no cost.

**Alternatives considered**: Two separate pages — rejected: it doubles the notice surface and breaks
the single-page static deployment. Showing both panels stacked — rejected: it invites simultaneous
use, which FR-032 forbids and which makes voice routing ambiguous.

---

## R13. Keeping the two paths' results identical

**Decision**: The text path's pinpointing stage collects the same three fields the match engine reads
— location description, equipment, school-zone context — and calls `matchCase(answers)` from
`lib/routing.js`. The routed reply renders the primary agency and contact number from the matched
case, and its "why this" expansion renders the *same* evidence component the question path's result
uses. A parity assertion in `tests/thread.test.mjs` runs equivalent input through both paths and
compares the resulting `case_id` and rendered evidence.

**Rationale**: FR-030 and SC-015 demand identical outcomes for equivalent input across paths, and the
only durable way to get that is one engine plus one renderer, proven by a test rather than by
inspection.

**Alternatives considered**: A thread-specific reply table keyed by case — rejected: it duplicates the
recommendation content and will drift from `data/cases.js`, which is exactly the failure Principle III
guards against.

---

## Summary of decisions

| # | Decision |
|---|---|
| R1 | Filled primary + ghost secondary, recessed summary block, sticky-within-panel action, focus on render |
| R2 | `position` cursor separate from an `answers` record carrying per-key `answered` flags |
| R3 | Non-numeric demo short code `XING-DEMO`, trigger word `CROSSING`, never a numeric short code |
| R4 | Fictional contact numbers from (205) 555-0100–0199; user-initiated dialling only, never automatic |
| R5 | Catalog grows to four cases with keyword sets disjoint from the existing two; existing tests are the fence |
| R6 | One `SpeechRecognition` instance, non-continuous, restarted per turn, owned by the voice state machine |
| R7 | Normalized label + synonym + ordinal matching; ties return `ambiguous` and ask, never guess |
| R8 | Closed command phrase table for repeat / back / start over / confirm / stop, checked before choices |
| R9 | Voice ranking heuristic with `voiceschanged` retry; rate 0.95; session-scoped manual override |
| R10 | Speech composed from a per-step `speechText`; page furniture is never spoken |
| R11 | Voice logic exported as pure functions and unit-tested; e2e asserts the no-speech degradation path |
| R12 | Native tablist, question path default, prototype badge inside the text panel, presenter strip outside the mockup |
| R13 | Both paths call one match engine and render one evidence component; parity proven by test |
