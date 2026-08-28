# Implementation Plan: School-Zone Crosswalk Routing Assistant

**Branch**: `001-crosswalk-routing` | **Date**: 2026-08-28 | **Spec**: [spec.md](./spec.md)

## Summary

A single-page browser app walks a parent through five questions about a school-zone crosswalk
outage, then renders a source-backed, confirmation-gated routing recommendation across three
jurisdictions. The app is static-first: it runs completely on GitHub Pages with a deterministic
routing engine. An optional zero-dependency Node server adds a live Claude path for local demos.

## Technical Context

**Language/Version**: JavaScript (ES2022), Node.js 24 for the optional server
**Primary Dependencies**: None. Node 24 provides `node:http` and global `fetch`; the browser provides
the Web Speech API. No `npm install` step exists, so no install can fail during the demo.
**Storage**: None. Conversation state is in-memory in the tab and is discarded on reload.
**Testing**: Manual acceptance run against the spec's scenarios, both with and without the server.
**Target Platform**: Modern browsers, desktop and mobile; GitHub Pages for the public artifact.
**Project Type**: Static web app with an optional local API proxy.
**Constraints**: Must work with zero network access to any agency; must work with no server; must
never expose a credential; must fit inside the event window.

## Constitution Check

| Principle | How this plan satisfies it |
|---|---|
| I. Synthetic-only data | All cases live in `data/cases.js`, each with `is_synthetic: true`. A persistent banner and an in-result notice state it. |
| II. No live writes | The app has exactly one outbound call: `POST /api/route` to our own proxy, which calls only the Anthropic API. Agency URLs are rendered as links, never fetched. No `tel:` auto-dial, no form posts. |
| III. No invented ownership | The model returns only `{case_id\|"unresolved", clarifying_question, rationale}`. `app.js` rejects any `case_id` absent from the local catalog. All displayed agency text comes from `data/cases.js`. |
| IV. Human in the loop | Recommendation is gated behind an explicit confirm step and every result carries the confirmation requirement plus a call script for a person to use. |
| V. Evidence visible | The renderer has no code path that omits roles, evidence, `source_checked`, or the gap. |
| VI. No secrets client-side | Key read by `server.js` from `.env` only; `.env` gitignored; static build has no key and needs none. |
| VII. Accessible / degradable | Native semantic controls, visible focus, responsive layout; voice is progressive enhancement; missing server produces a labeled simulated mode rather than an error. |

No principle requires an exception. Complexity tracking: none.

## Project Structure

```
index.html            accessible conversation + result UI, persistent notices
styles.css            responsive layout, focus states, warning/danger states
app.js                state machine, mode probe, routing call, validation, rendering, voice
data/cases.js         synthetic catalog (CASE-03, CASE-03B) + agencies + evidence
server.js             static file server + POST /api/route Claude proxy (node:http, no deps)
.env.example          ANTHROPIC_API_KEY=, PORT=
package.json          "start": "node server.js", zero dependencies
README.md             official team template, filled
SUBMISSION.md         copy-paste text for the event Issue Form
docs/                 provenance: challenge brief, handoff cards, original plan
specs/001-...         this spec, plan, and tasks
```

**Structure Decision**: Flat root so that GitHub Pages can serve `main` at `/` with no build step.
`data/cases.js` is a plain ES module imported by both `app.js` (browser) and `server.js` (Node), so
the catalog has exactly one definition and cannot drift between the two modes.

## Key Design Decisions

### 1. The model selects; local data renders

The proxy sends Claude the parent's answers plus a compact catalog (`case_id`, `service_type`,
`synthetic_location`, `match_keywords`) and a system prompt that permits only three outputs: a
`case_id` from that list, `"unresolved"` with a `clarifying_question`, or a refusal. The client then
looks the `case_id` up locally. Because no rendered string originates in the model, a hallucinated
agency, phone number, or URL is not merely unlikely — it has no path to the screen.

### 2. Deterministic engine is the floor, not the fallback

`matchCase()` in `app.js` scores free text against each case's `match_keywords` plus the answers to
questions 2 and 3. It is the entire routing engine for the published static build, and it also
backstops the live path when the proxy is absent, errors, or returns an invalid payload. Scoring
requires a minimum confidence; below it the result is `unresolved`.

### 3. Mode probe

On load, `app.js` issues `GET /api/health`. Success renders "Live Claude routing"; failure or
non-JSON renders "Simulated routing — deterministic, no live model". The banner is always visible so
a judge can never mistake which path produced a result.

### 4. Danger handling is a separate render path

Question 4 sets a `danger` flag. When true, a static safety panel renders *above* the routing result:
guidance to move away from the crossing and to call local emergency services from the phone by hand.
The app never invokes `tel:`, never auto-dials, and still shows the routing recommendation beneath —
a broken signal is still a broken signal.

## Verification

Run the acceptance scenarios from spec.md twice: once with `node server.js`, once by opening the
published Pages URL with no server. See the Verification section of the root plan and README.
