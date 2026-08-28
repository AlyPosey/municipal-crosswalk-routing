# Tasks: School-Zone Crosswalk Routing Assistant

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)
**Tests**: The spec did not request an automated suite, but the eligibility-critical behaviours
(never invent an owner; never auto-escalate; never place a call) are too important to leave to a
manual pass, so `tests/` holds 55 assertions run by `npm test`. Every task carries the constitution
principles it must satisfy.

## Format: `[ID] [P?] [Story] Description`

`[P]` = can run in parallel with other `[P]` tasks in the same phase.

---

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Initialize Spec Kit, write `.specify/memory/constitution.md` (I–VII), move source docs to `docs/`
- [X] T002 Write `.gitignore` covering `.env`, `node_modules/`, local transcripts (Principle VI)
- [X] T003 Write `spec.md`, `plan.md`, `tasks.md` under `specs/001-crosswalk-routing/`
- [X] T004 [P] Write `package.json` — `"start": "node server.js"`, `"type": "module"`, zero dependencies
- [X] T005 [P] Write `.env.example` with `ANTHROPIC_API_KEY=` and `PORT=` names only (Principle VI)

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story can be implemented until the catalog exists — it is the single source
of every agency name, link, and evidence string on screen (Principle III).

- [X] T006 Write `data/cases.js` as an ES module exporting `CASES`, seeded from
  `docs/school-zone-crosswalk-handoff.md`. Both `CASE-03` and `CASE-03B` carry the resource-pack
  field set plus `agencies[]`, `next_action`, `call_script`, `match_keywords`, `source_checked`,
  and `is_synthetic: true` (Principles I, III, V)
- [X] T007 Write `index.html` — semantic conversation region, result region, persistent synthetic and
  no-live-submission notices, mode banner, voice toggle (Principles I, VII)
- [X] T008 Write `styles.css` — responsive at 375px and desktop, visible `:focus-visible` states,
  distinct warning and danger treatments (Principle VII)

**Checkpoint**: Shell renders; catalog is importable.

---

## Phase 3: User Story 1 - Municipal-street signal outage (P1) 🎯 MVP

**Goal**: A complete, confirmation-gated, source-backed recommendation for CASE-03.
**Independent Test**: Open `index.html` with no server; run the municipal case end to end.

- [X] T009 [US1] Implement the five-question state machine in `app.js`; no step requests a personal
  identifier (FR-001, FR-002)
- [X] T010 [US1] Implement the summary + explicit confirm gate; recommendation is unreachable before
  confirmation (FR-003, Principle IV)
- [X] T011 [US1] Implement `matchCase()` deterministic scoring over `match_keywords` with a minimum
  confidence threshold (FR-011, FR-014)
- [X] T012 [US1] Implement `renderResult()` — qualified recommendation wording, three-role
  comparison, evidence links, `source_checked`, gap, next action, copyable call script, human
  confirmation requirement, synthetic and no-submission notices (FR-004 → FR-010, Principle V)

**Checkpoint**: US1 fully functional with zero server and zero dependencies.

---

## Phase 4: User Story 2 - State-route beacon malfunction (P2)

**Goal**: Routing changes with the facts; permit ambiguity stays visible.
**Independent Test**: Run the state-route case; recommendation differs from US1.

- [X] T013 [US2] Verify CASE-03B routes to the state district office with the city-permit caveat and
  the school authority stakeholder role rendered (FR-005, FR-007)
- [X] T014 [US2] Render the escalation path in the next action (FR-008)

**Checkpoint**: Both cases produce different, correctly-qualified recommendations.

---

## Phase 5: User Story 3 - Unrecognized or ambiguous location (P3)

**Goal**: Never invent an owner. Eligibility-critical.
**Independent Test**: Enter unmatched free text; confirm no agency is named.

- [X] T015 [US3] Implement the `unresolved` render path — clarifying question or explicit decline,
  offering the supported synthetic cases, naming no agency (FR-011, Principle III)

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Live model path (optional enhancement)

- [X] T016 Write `server.js` — `node:http` static file server plus `GET /api/health` and
  `POST /api/route`; loads `.env` manually; key never leaves the process (FR-017, Principle VI)
- [X] T017 Write the constrained system prompt; model may return only a catalog `case_id`,
  `"unresolved"`, or a refusal (FR-015, Principle III)
- [X] T018 Client-side validation — reject any `case_id` not present in `CASES`, fall back to the
  deterministic engine on any error or invalid payload (FR-015, FR-016)
- [X] T019 Mode probe and banner — "Live Claude routing" vs "Simulated routing" (FR-014)

---

## Phase 7: Safety and voice

- [X] T020 Static danger panel on the immediate-danger flag; no auto-dial, no `tel:` invocation;
  routing result still renders beneath (FR-012, FR-013, Principle II)
- [X] T021 Web Speech input + readback behind a toggle; hidden when unsupported; text path unchanged;
  no audio retained or transmitted (FR-018, Principle VII)

---

## Phase 8: Polish, publish, submit

- [X] T022 Accessibility and responsive pass — keyboard-only run, focus visibility, 375px (FR-020)
- [X] T023 Create public repo `AlyPosey/municipal-crosswalk-routing`, commit, push, enable Pages
- [X] T024 Write `README.md` from `TEAM_README_TEMPLATE.md` — all sections, team ID marked TODO
- [X] T025 Write `SUBMISSION.md` — copy-paste text for every Issue Form field
- [X] T026 Final constitution audit: grep the repo for credentials, verify `is_synthetic` on every
  case, verify no result path omits evidence or the confirmation requirement

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → Phase 3 (MVP). Phases 4 and 5 depend only on Phase 3.
- Phase 6 is optional and must not be a prerequisite for any user story.
- Phase 7 is additive; Phase 8 closes out.

## Cut order under time pressure

Static map panel (already excluded) → transcript download (already excluded) → Phase 7 voice →
Phase 6 live proxy. Phases 1–5 plus 8 constitute a complete, rule-compliant submission.
