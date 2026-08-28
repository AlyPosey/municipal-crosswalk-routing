# [Team Name] ([Team ID])

> Copy this template into your public project repository's README and fill in every section. See SUBMISSIONS.md and JUDGING.md in the event repository for the full submission process and how this will be scored.

## Team

- **Team name:** Jurisdiction Junction
- **Team ID:** 2A
- **Team members (optional):** 
Alyson Posey
Sarina P. Hall
LTW Montgomery
Kathy Chandler
Lance Moore

## Challenge and primary user

- **Challenge:** Challenge 2 — Make Regional Services Easier to Navigate
- **Primary user:** Resident — specifically a parent whose child walks to school

## Problem and repeated workflow

The crossing signal outside a school stops working. A parent wants it fixed. Between them and the
fix sit at least three plausible owners: **municipal traffic engineering**, the **state
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
the tool returns a **recommended first contact, pending human confirmation** (never a legal owner);
**all three jurisdictional roles** with the reason each holds its role, including the school
transportation authority explicitly marked as a stakeholder that does *not* own the hardware;
**authoritative source links** and the date those sources were last verified; **the specific gap in
the public record**; a **plain-language next action** and a **copyable call script**; and an explicit
statement that **a person has to confirm this**.

If the description does not clearly match a case, the tool says so and asks for the one distinction
that matters. It does not guess an agency.

## Data and evidence sources

**Synthetic case data (all fictional, labeled `is_synthetic: true`)** — [`data/cases.js`](data/cases.js),
seeded from synthetic handoff cards in [`docs/school-zone-crosswalk-handoff.md`](docs/school-zone-crosswalk-handoff.md).
The record shape mirrors the official Challenge 2 resource pack's `municipal-service-cases.csv`
fields. Two cases: **CASE-03** (crosswalk signal outage, fictional municipal street near Fictional
Lincoln Heights Elementary) and **CASE-03B** (flashing beacon malfunction, Fictional State Route 42
near Fictional Maple Ridge Middle School).

**Real public reference pages**, cited as the real-world pattern each fictional agency is modeled on
and as where a human would go to confirm — not as evidence that any agency owns any asset. Last
verified **2026-08-27**: [Alabama Department of Transportation](https://www.dot.state.al.us/),
[City of Birmingham](https://www.birminghamal.gov/), [Jefferson County](https://www.jccal.org/),
[Regional Planning Commission of Greater Birmingham](https://www.rpcgb.org/), and
[Census TIGERweb](https://tigerweb.geo.census.gov/tigerweb/) (road-classification context only, not
used to determine responsibility). No source is scraped, fetched, or called by the application —
every URL is rendered as a link for a human to click.

## Architecture or approach

Zero npm dependencies, no build step, two ways to run the same interface: GitHub Pages serves
`index.html` + `app.js` + `data/cases.js` running a deterministic routing engine ("Simulated
routing" banner); a local `node server.js` serves the same files plus `POST /api/route`, which calls
Claude ("Live Claude routing" banner).

**Claude at runtime — the model selects, local data renders.** The proxy sends Claude the parent's
routing-relevant answers plus a compact catalog, under a system prompt that permits exactly one
output shape (`{"case_id": ..., "reason": ...}`), forbids naming any agency, phone number, or URL,
and instructs the model to answer `unresolved` rather than guess. The server re-validates the
returned `case_id` against the catalog, and the client validates it again before rendering — so no
model-generated string ever reaches the DOM. Every agency name, role, caveat, evidence link, gap,
next action, and call script is read from `data/cases.js`.

**The deterministic engine is the floor, not a fallback.** `matchCase()` scores the parent's answers
against each case's keywords, with location scored separately so it gates the match rather than
being outweighed by a stray keyword.

**Claude during the build.** Built with Claude Code driving [GitHub Spec Kit](https://github.com/github/spec-kit):
a project constitution ([`.specify/memory/constitution.md`](.specify/memory/constitution.md), seven
principles) first, then a specification ([`specs/001-crosswalk-routing/spec.md`](specs/001-crosswalk-routing/spec.md))
with 20 functional requirements traceable to it, then a plan and task list. Principle III ("no
invented ownership") is why the "model selects, local data renders" architecture exists at all.

## Working artifact

**https://alyposey.github.io/municipal-crosswalk-routing/** — fully functional with no server.

Key files: [`app.js`](app.js) · [`data/cases.js`](data/cases.js) · [`server.js`](server.js) ·
[`.specify/memory/constitution.md`](.specify/memory/constitution.md) ·
[`specs/001-crosswalk-routing/`](specs/001-crosswalk-routing/)

## What works today

- Both synthetic cases route end to end and produce **different** recommended first contacts.
- All three jurisdictional roles render with rationale, caveats, evidence links, and the verified-on date.
- The recommendation is unreachable until the parent explicitly confirms the summary.
- Unmatched input produces a clarifying decline that names **no** agency.
- Immediate-danger input renders static safety guidance above the routing result; the app never
  dials anything — no `tel:` link, no auto-call anywhere in the codebase.
- A routine outage does not escalate to emergency guidance.
- The published build works with no server, no key, and no network access to any agency.
- Voice input and readback via the browser's Web Speech API, off by default, hidden when
  unsupported, with a fully equivalent text path.
- Keyboard-operable throughout with visible focus; responsive at 375px and desktop.
- Verified by **55 passing assertions** (`npm test`) — [`tests/routing.test.mjs`](tests/routing.test.mjs)
  lifts the real `matchCase()` source out of `app.js`, and [`tests/e2e.test.mjs`](tests/e2e.test.mjs)
  loads the real `index.html` and runs the real `app.js` under jsdom with every network call failing
  (the GitHub Pages condition), clicking through all four core scenarios.

## Known limitations and simulated elements

- **Every case, location, agency, and outcome is fictional.** The agency names do not exist. No real
  agency has reviewed, approved, or endorsed any routing this tool produces.
- **The routing hypotheses are hypotheses**, not verified ownership records for any specific asset.
  The tool says this on screen, every time.
- **Two cases only.** The data shape supports more without code changes; the coverage is what is synthetic.
- **Keyword matching is deliberately shallow** — tuned to decline rather than to stretch.
- **No live data of any kind.** No geocoding, device location, boundary lookup, agency API, or ticket
  status. Geographic boundaries are never used to determine legal responsibility.
- **Nothing is stored.** Answers live in the browser tab and vanish on reload; no server transcript
  storage; no audio retained or transmitted.
- **The live Claude path needs a local server.** The public link runs the deterministic engine and
  labels itself "Simulated routing."

## Next step toward a pilot

**Sit down with one municipal traffic engineering office and one ALDOT district office and fill in a
single real case together** — one intersection, one beacon — recording who actually holds it, how
they learned that, and which published page (if any) would have told a resident.

That session is the whole pilot. It converts one synthetic card into one verified card and produces
the first honest measurement of how wide the ownership gap really is.

## Demo video (if needed)

Not required — the artifact has a public working link above:
https://alyposey.github.io/municipal-crosswalk-routing/
