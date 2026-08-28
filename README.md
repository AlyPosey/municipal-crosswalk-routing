# Jurisdiction Junction — Who Fixes This Crosswalk?

**Working artifact: https://alyposey.github.io/municipal-crosswalk-routing/**

> ⚠️ **Everything in this project is synthetic.** Fictional locations, fictional agencies, fictional
> outcomes. Nothing here is a real resident, a real complaint, or a real agency determination. The
> tool submits nothing to anyone and makes no legal determination of responsibility.

## Team

- **Team name:** Jurisdiction Junction
- **Team ID:** `TODO — fill in on the submission form`
- **Team members (optional):** Alyson Posey

## Challenge and primary user

- **Challenge:** Challenge 2 — Make Regional Services Easier to Navigate
- **Primary user:** Resident — specifically a parent whose child walks to school

## Problem and repeated workflow

The crossing signal outside a school stops working. A parent wants it fixed. Between them and the
fix sit at least three plausible owners: the **municipal traffic engineering** office, the **state
transportation district** office, and the **regional school transportation authority**.

Nothing published tells the parent which one it is. The city page describes the city's scope but not
its state-route exceptions. The state page lists maintenance contacts but does not publish permit
records for locally installed school-zone equipment. The school transportation authority requested
the equipment and holds the complaint history, which makes it look like an owner when it is not one.

So the parent guesses. They call an office that transfers them, or takes a message that goes nowhere,
and a meaningful share of them stop trying. The repeated moment is **"Who owns this?"** and the
outcome that matters is a **correct handoff** — not an answer, a correct *first call*.

## What the project does

A parent answers five questions in a browser — which crossing, what looks broken, is it a school
zone, is anyone in danger right now, and does the summary look right. After they explicitly confirm,
the tool returns:

- a **recommended first contact, pending human confirmation** — never a legal owner;
- **all three jurisdictional roles** with the reason each holds its role, including the school
  transportation authority explicitly marked as a stakeholder that does *not* own the hardware;
- **authoritative source links** and the date those sources were last verified;
- **the specific gap in the public record** — for the state-route case, that "who installed it" and
  "who maintains it" may be different entities and the permit records are not published anywhere a
  resident can check;
- a **plain-language next action** and a **copyable call script** that asks the agency the one
  question that actually resolves ownership;
- an explicit statement that **a person has to confirm this**.

If the description does not clearly match a case, the tool says so and asks for the one distinction
that matters. It does not guess an agency.

## Data and evidence sources

**Synthetic case data (all fictional, labeled `is_synthetic: true`)** — [`data/cases.js`](data/cases.js),
seeded from our synthetic handoff cards in [`docs/school-zone-crosswalk-handoff.md`](docs/school-zone-crosswalk-handoff.md).
The record shape mirrors the official Challenge 2 resource pack's `municipal-service-cases.csv`
fields: `case_id`, `service_type`, `synthetic_location`, `jurisdiction_a`, `jurisdiction_b`,
`authoritative_source`, `conflict_or_gap`, `recommended_handoff`, `requires_human_confirmation`,
`is_synthetic`.

- **CASE-03** — school-zone crosswalk signal outage on a fictional municipal street near Fictional
  Lincoln Heights Elementary.
- **CASE-03B** — school-zone flashing beacon malfunction on Fictional State Route 42 near Fictional
  Maple Ridge Middle School.

**Real public reference pages**, cited as the real-world pattern each fictional agency is modeled on
and as *where a human would go to confirm* — not as evidence that any agency owns any asset. Last
verified **2026-08-27**, per the resource pack:

| Source | Used as |
|---|---|
| [Alabama Department of Transportation](https://www.dot.state.al.us/) | Pattern for the state district traffic office role |
| [City of Birmingham](https://www.birminghamal.gov/) | Pattern for the municipal traffic engineering role |
| [Jefferson County](https://www.jccal.org/) | Pattern for the county/municipal directory layer |
| [Regional Planning Commission of Greater Birmingham](https://www.rpcgb.org/) | Pattern for the regional authority role |
| [Census TIGERweb](https://tigerweb.geo.census.gov/tigerweb/) | Road-classification context only — explicitly **not** used to determine responsibility |

No source is scraped, fetched, or called by the application. Every URL above is rendered as a link
for a human to click.

## Architecture or approach

Zero npm dependencies. No build step. Two ways to run the same interface:

```
GitHub Pages ──► index.html + app.js + data/cases.js
                 deterministic routing engine
                 banner: "Simulated routing — deterministic matching, no live model call"

local demo   ──► node server.js   (.env → ANTHROPIC_API_KEY)
                 serves the same files + POST /api/route → Claude
                 banner: "Live Claude routing"
```

**Claude at runtime — the model selects, local data renders.** The proxy sends Claude the parent's
three routing-relevant answers plus a compact catalog, and a system prompt that permits exactly one
output shape: `{"case_id": "<CASE-03 | CASE-03B | unresolved>", "reason": "..."}`. The prompt
forbids naming any agency, phone number, or URL, and instructs the model to answer `unresolved`
rather than guess. The server then re-validates the returned `case_id` against the catalog, and the
client validates it *again* before rendering.

The consequence is the design's main safety property: **no model-generated string reaches the DOM.**
Every agency name, role, caveat, evidence link, gap, next action, and call script is read from
`data/cases.js`. A hallucinated agency, a fabricated phone number, or an invented URL is not merely
unlikely here — it has no code path to the screen.

**The deterministic engine is the floor, not a fallback.** `matchCase()` scores the parent's answers
against each case's keywords. Location is scored *separately* and gates the match; equipment and
school-zone answers can only break a tie or widen a lead. That split matters: without it, a
description like "the light by the Walmart" scores on the word "signal" from the equipment question
and gets routed to a city with no reason to be involved. Ten assertions covering both cases, both
free-text paths, and four unmatched inputs are documented in the Verification section below.

**Claude during the build.** Built with Claude Code driving [GitHub Spec Kit](https://github.com/github/spec-kit).
The event rules were encoded first as a project constitution
([`.specify/memory/constitution.md`](.specify/memory/constitution.md), seven principles), then a
specification ([`specs/001-crosswalk-routing/spec.md`](specs/001-crosswalk-routing/spec.md)) with 20
functional requirements traceable to it, then a plan and task list. Every task names the principles
it must satisfy. The constitution is why the "model selects, local data renders" architecture exists
at all — Principle III made "never invent an agency" a structural requirement rather than a prompt
instruction.

## Working artifact

**https://alyposey.github.io/municipal-crosswalk-routing/** — fully functional with no server.

To run the live Claude path locally:

```bash
git clone https://github.com/AlyPosey/municipal-crosswalk-routing.git
cd municipal-crosswalk-routing
cp .env.example .env      # add your ANTHROPIC_API_KEY
npm start                 # no install step — there are no dependencies
# http://localhost:3000
```

Key files: [`app.js`](app.js) · [`data/cases.js`](data/cases.js) · [`server.js`](server.js) ·
[`.specify/memory/constitution.md`](.specify/memory/constitution.md) ·
[`specs/001-crosswalk-routing/`](specs/001-crosswalk-routing/)

## Verification

```bash
npm install     # jsdom, for the tests only — the app itself still has zero dependencies
npm test
```

**55 assertions, all passing.** [`tests/routing.test.mjs`](tests/routing.test.mjs) lifts the real
`matchCase()` source out of `app.js` so the test cannot drift from the implementation, and checks 10
routing decisions including four unmatched inputs that must decline.
[`tests/e2e.test.mjs`](tests/e2e.test.mjs) loads the real `index.html`, runs the real `app.js` under
jsdom with every network call failing — exactly the GitHub Pages condition — and clicks through all
four scenarios:

| Scenario | Asserted |
|---|---|
| US1 municipal signal | Recommends city traffic engineering; ALDOT not primary; qualified wording; all three roles; school authority marked stakeholder-not-owner; evidence links; freshness date; gap; next action; call script; confirmation requirement; both notices; **no** emergency escalation |
| US2 state-route beacon | Recommends the ALDOT district office; permit uncertainty visible; escalation path present; recommendation differs from US1 |
| US3 unknown location | Declines to route; **names no agency**; asks the distinguishing question; offers the supported synthetic cases |
| Immediate danger | Safety guidance shown; states it will not place a call; **no `tel:` link**; routing result still rendered beneath |

Every scenario also asserts that the result stays hidden until the parent confirms, and that the
mode banner reads "Simulated routing" when no server answers.

## What works today

- Both synthetic cases route end to end and produce **different** recommended first contacts.
- All three jurisdictional roles render with rationale, caveats, evidence links, and the verified-on date.
- The recommendation is unreachable until the parent explicitly confirms the summary.
- Unmatched input produces a clarifying decline that names **no** agency.
- Immediate-danger input renders static safety guidance above the routing result. The app never
  dials anything — there is no `tel:` link and no auto-call anywhere in the codebase.
- A routine outage does not escalate to emergency guidance.
- The published build works with no server, no key, and no network access to any agency.
- Voice input and readback via the browser's Web Speech API, off by default, hidden when
  unsupported, with a fully equivalent text path.
- Keyboard-operable throughout with visible focus; responsive at 375px and desktop.

## Known limitations and simulated elements

- **Every case, location, agency, and outcome is fictional.** The agency names do not exist. No real
  agency has reviewed, approved, or endorsed any routing this tool produces.
- **The routing hypotheses are hypotheses.** "Signals on municipal streets are usually maintained by
  city traffic engineering" is how the function is typically organized, not a verified ownership
  record for any specific asset. The tool says this on screen, every time.
- **Two cases only.** The catalog covers a municipal-street signal and a state-route beacon. Real
  Greater Birmingham has many more jurisdictions and edge cases. The data shape supports more cases
  without code changes; the coverage is what is synthetic.
- **Keyword matching is deliberately shallow.** It is tuned to decline rather than to stretch. A
  real deployment would need a far richer location model — and would still need the decline path.
- **No live data of any kind.** No geocoding, no device location, no boundary lookup, no agency API,
  no ticket status. Geographic boundaries are never used to determine legal responsibility.
- **Nothing is stored.** Answers live in the browser tab and vanish on reload. There is no server
  transcript storage and no audio is retained or transmitted.
- **The live Claude path needs a local server.** The public link runs the deterministic engine and
  labels itself "Simulated routing" so no one can mistake which path produced a result.

## Next step toward a pilot

**Sit down with one municipal traffic engineering office and one ALDOT district office and fill in a
single real case together** — one intersection, one beacon — recording who actually holds it, how
they learned that, and which published page (if any) would have told a resident.

That session is the whole pilot. It converts one synthetic card into one verified card and, more
usefully, produces the first honest measurement of how wide the ownership gap really is. If two
agencies in the same room need more than five minutes to agree who owns one beacon, that finding is
worth more to the region than the tool is — and it is the number that would justify funding the
shared asset registry this interface is a front end for.

## Demo video (if needed)

Not required — the artifact has a public working link above.
