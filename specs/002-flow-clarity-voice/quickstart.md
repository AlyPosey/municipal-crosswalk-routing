# Quickstart: validating `002-flow-clarity-voice`

**Feature**: Conversation Flow Clarity, Text-First Entry & Usable Voice | **Date**: 2026-08-28

How to run the artifact and prove each user story works. Details of state shapes live in
[data-model.md](./data-model.md); module behaviour lives in [contracts/](./contracts/).

## Prerequisites

- Node.js 18 or newer (only for the optional proxy and the test harness — the app itself installs
  nothing).
- A modern browser. Chrome or Edge for the voice checks; the Web Speech API is absent or partial in
  some browsers, which is itself a case to verify.
- `npm install` once, only if you intend to run the tests (`jsdom` is the sole dev dependency).

## Running

```bash
# Static build — the GitHub Pages condition. No server, no key.
# Open index.html directly, or serve the folder with any static server.
npx serve .        # or: python -m http.server

# With the optional proxy (adds the live-model path; still no live writes)
npm start          # http://localhost:3000

# Tests
npm test           # routing + e2e + thread + voice — all four suites
```

The mode banner must read **"Simulated routing"** in the static build and **"Live Claude routing"**
only when the proxy answers `/api/health`. Everything below must pass in the static build.

---

## Story 1 — the confirmation step reads as a gate (P1)

1. Answer all five questions.
2. At the confirmation step, without reading any label, confirm one action is obviously dominant and
   the secondary action is obviously not.
3. At a 375px viewport, confirm the primary action is visible without scrolling — or that a
   persistent cue points to it.
4. Confirm the step states that this reveals the recommendation and that nothing is submitted.
5. Without touching the mouse, press Enter — the primary action is already focused with a visible
   ring, and activates.
6. On activation, focus lands on the recommendation heading, not back up the page.

**Expected**: FR-001–FR-006 satisfied; a first-time user reaches the recommendation in under 10s
(SC-002).

## Story 2 — going back and correcting an answer (P2)

1. Answer all five questions, deliberately choosing the wrong crossing at question 1.
2. From the confirmation step, go back to the last question, then back again to question 1.
3. Confirm each re-displayed question shows your previous answer as the current answer, including
   free text still present in the input.
4. Change the question 1 answer and continue.
5. Confirm every later answer is still there and was not re-asked.
6. Confirm the transcript, the confirmation summary, and the recommendation all reflect the
   correction.
7. On question 1, confirm the back control is disabled and pressing it repeatedly does nothing.
8. Confirm "Start over" — and only "Start over" — clears everything.

**Expected**: FR-007–FR-015; correction completes in under 30s with nothing re-entered (SC-003,
SC-004).

## Story 3 — the simulated text path (P3)

1. Switch to the text tab from a cold load.
2. Confirm the prototype / not-a-live-number / nothing-is-sent label is visible before you do
   anything, and stays visible in every later state.
3. Send the trigger word; confirm an acknowledgement arrives and the stage advances.
4. Answer the pinpointing questions; confirm a single crossing is identified and stage progress is
   visible throughout.
5. Confirm the routed reply names a **recommended first contact pending human confirmation** — never
   an owner — and shows a number presented as yours to dial.
6. Open the evidence: all three roles, why each holds its role, source links, the verified date, and
   the specific gap.
7. Restart mid-exchange; confirm it returns to the first message with no page reload and nothing
   retained.
8. Send something other than the trigger word first; confirm it replies with what to send instead
   and does not treat the stray message as an answer.
9. Describe a crossing that is not in the catalog; confirm the decline outcome and that no agency is
   named.
10. Use the presenter shortcut mid-exchange; confirm the in-progress thread is cleared first and the
    shortcut is visually distinct from the resident path.
11. Run equivalent answers through both entry paths; confirm the same first contact and the same
    evidence.
12. Scan every text-path screen: no real school, community, or agency name, and no "owner" anywhere.

**Expected**: FR-016–FR-032; end to end under 90s without instruction (SC-005), presenter shortcut in
two interactions (SC-006), zero real names (SC-007), zero ownership claims (SC-008), zero messages
sent and zero numbers collected (SC-009), full parity (SC-015).

## Story 4 — the tool hears you (P4)

1. Turn voice on; confirm short instructions appear saying when to speak and which commands work.
2. Answer a **multiple-choice** question by speaking; confirm it selects and advances.
3. Say "back", "repeat that", and "start over"; confirm each performs its action.
4. At any moment, glance at the screen and confirm you can tell whether it is speaking, listening,
   interpreting, or idle.
5. Confirm listening resumes on its own after each prompt, and that it is not listening while it
   speaks.
6. Say something unmatchable; confirm it reports what it heard, or that it heard nothing, and offers
   another attempt — never silence.
7. Say a phrase that matches two choices; confirm it asks you to choose rather than guessing.
8. Deny microphone permission and turn voice on; confirm a plain-language explanation appears and the
   typed path still works.
9. Turn voice on mid-conversation; confirm nothing already answered is lost or re-asked.

**Expected**: FR-033–FR-042; a full conversation completed by speech alone (SC-010), listening state
identifiable within 1s (SC-011), feedback within 3s with zero silent non-responses (SC-012).

## Story 5 — the voice sounds like a person (P5)

1. With voice on, listen through the conversation; confirm the voice is the best available on the
   device without you configuring anything.
2. Confirm only the question, its choices, and short guidance are read — no disclaimers, headings, or
   banner text.
3. Ask for a repeat by voice and by the on-screen control; confirm the current question is spoken
   again from the beginning.
4. Pick a different voice; confirm the choice holds for the rest of the session.
5. On a device with only a basic voice, confirm the flow is unaffected.

**Expected**: FR-043–FR-048; prompts understood on first hearing (SC-013).

---

## Cross-cutting checks (run before calling it done)

**Accessibility and degradation**

- Complete both entry paths using the keyboard only, with voice never enabled, at 375px and at
  desktop width. Every focused control shows a visible ring (SC-014, FR-053).
- Complete both entry paths with the pointer only.
- Load in a browser with no Web Speech support: the voice controls stay hidden, nothing else changes.

**Privacy and no-writes**

- With DevTools Network recording, run every path end to end in the static build. Expect **zero**
  requests beyond the initial static assets — no audio, no telemetry, no messages (SC-016, FR-050).
- Confirm no field anywhere asks for a name, phone number, email, or real address (FR-029, FR-051).
- Reload mid-conversation: answers are gone by design; the conversation restarts cleanly.

**Constitutional review** (verify by name before marking tasks complete)

- I — every new case, crossing, school, agency, and number is fictional and labelled synthetic.
- II — nothing sent, nothing dialled automatically, no new outbound activity.
- III — no ownership assertion anywhere; every rendered agency string comes from `data/cases.js`;
  unmatched input declines rather than guesses.
- IV — the confirmation gate is more visible than before, and both paths name the confirmation step.
- V — evidence, roles, source links, verified date, and the gap are reachable from both paths.
- VI — no credential in client code; the static build works with no key.
- VII — keyboard-operable, 375px-clean, works with no server, voice strictly optional.

**Regression**

- `npm test` passes, with the pre-existing `tests/routing.test.mjs` assertions unchanged — the fence
  proving no existing recommendation moved (FR-052).
