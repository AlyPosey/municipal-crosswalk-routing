# Contract: `lib/textThread.js` — the simulated text-message path

**Consumers**: `app.js` (renders the phone mockup), `tests/thread.test.mjs`.

A **simulation**. This module sends nothing, connects to nothing, and performs no network access of
any kind (FR-017, Constitution II). It exists to demonstrate what texting the service would feel
like.

## Constants

```js
SHORT_CODE   = 'XING-DEMO'   // non-numeric by design; cannot correspond to a working service (FR-019)
TRIGGER_WORD = 'CROSSING'
```

## Exports

```js
createThread() -> {
  getState()             // { messages, stage, pinpointIndex, answers, matchedCaseId }
  send(text)             // the resident's message; advances the stage machine
  restart()              // back to the first message, no page reload, nothing retained
  jumpToCase(caseId)     // presenter shortcut; clears the in-progress thread first
  subscribe(fn)
}
```

## The four visible stages (FR-020)

| Stage | What happens | Advance condition |
|---|---|---|
| `trigger` | The resident sends the trigger word to the demo short code. | Case-insensitive match on `CROSSING`. Anything else replies with what to send instead and stays in `trigger`. |
| `ack` | An acknowledgement reply arrives, stating this is a prototype and nothing is sent. | Automatic. |
| `pinpoint` | Short questions identify the crossing: nearest school, cross streets, what is wrong. | All questions answered. |
| `routed` | A reply names the recommended first contact and a number, with evidence reachable. | Terminal until `restart()`. |

Stage progress is rendered visibly at every step (a step counter or equivalent).

## Routing

The `pinpoint` answers are assembled into an `AnswerRecord` and passed to `matchCase(answers)` from
[`lib/routing.js`](./routing.md). The thread performs no matching of its own.

- A matched `case_id` renders the routed reply from that catalog entry.
- `null` renders the **existing** "no confident match" outcome and names no agency (FR-031).
- An answer that matches more than one crossing produces a "which one?" reply rather than a choice.

**Parity (FR-030, SC-015)**: equivalent input to this path and to the question path must yield the
same `case_id` and the same evidence. Proven by an explicit parity assertion, not by inspection.

## Content rules (non-negotiable)

| Rule | Requirement |
|---|---|
| FR-018 | A persistent, unmissable label is present in **every** rendered state: prototype, the short code is not a live phone number, nothing is actually sent. |
| FR-022 | Every location, school, community, agency, contact name, and phone number is fictional and carries the synthetic label. No real school, community, or agency name appears anywhere, including the knowledge-base table. |
| FR-023 | The routed reply and any knowledge-base display name the agency as **recommended first contact pending human confirmation**, with the reason and the confirmation step visible. No column, heading, or copy asserting "owner" or "legal owner" may exist. |
| FR-024 | Full evidence is reachable from the routed reply: all three roles, why each holds its role, source links, `source_checked`, and the specific overlap, conflict, or gap — rendered by the same component the question path uses. |
| FR-025 | The contact number is presented as something a person chooses to dial. No auto-dial, no scripted navigation to a `tel:` URL, never 911. |
| FR-026 | Any statement about pole signage, short-code deployment, agency participation, or syncing from municipal systems is framed explicitly as a proposal or future state. |
| FR-029 | No phone number or other personal identifier is asked for, accepted by design, or stored. |

## Presenter shortcut (FR-027)

- Reaches a fully resolved case in at most two interactions from a cold load (SC-006).
- Clears any in-progress thread **before** jumping, so no abandoned answers leak into the shown case.
- Lives in a visually distinct, presenter-labelled strip outside the phone mockup, so a viewer cannot
  mistake it for the resident experience.

## Invariants

1. No `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, form submission, or navigation occurs in
   this module or its rendering.
2. `matchedCaseId` is an id present in the catalog or `null`.
3. `restart()` leaves no message, answer, or match from the previous exchange.
4. Only one conversation is active at a time; while the text path is active, the question path's
   state is inert and is never merged with it (FR-032).
5. Every rendered agency string comes from `data/cases.js` (Principle III).

## Test obligations (`tests/thread.test.mjs`)

- Cold start to routed reply for at least two catalog cases.
- A non-trigger first message replies with instructions and does not advance.
- An unmatchable description reaches the decline outcome and names no agency.
- `restart()` empties the thread and returns to `trigger`.
- `jumpToCase()` mid-exchange leaves no prior answers in state.
- Parity: the same input through both paths yields the same `case_id` and the same evidence set.
- Content scan: no real school, community, or agency name and no "owner" string appears in the
  rendered text path.
