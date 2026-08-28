# Submission form — copy-paste text

For the GitHub Issue Form at **Birmingham-AI/claude-impact-lab → New Issue → "Project Submission"**.
Deadline **2:00 PM CDT, Friday 2026-08-28**.

> **You need to fill in the Team ID yourself** — it is the one field we do not have.

---

### Team ID

```
TODO — your assigned team ID
```

### Team name

```
Jurisdiction Junction
```

### Participant names (optional)

```
Alyson Posey
```

### Challenge

```
Challenge 2 — Make Regional Services Easier to Navigate
```

### Primary user

```
Resident — a parent whose child walks to school
```

### Repository URL

```
https://github.com/AlyPosey/municipal-crosswalk-routing
```

### Demo URL (optional)

```
https://alyposey.github.io/municipal-crosswalk-routing/
```

### Summary

```
A school-zone crosswalk signal stops working and the parent who noticed it has three plausible
agencies to call: municipal traffic engineering, the state transportation district office, or the
regional school transportation authority. Nothing published tells them which. They guess, get
transferred, and often give up.

Jurisdiction Junction asks five questions -- which crossing, what looks broken, is it a school zone,
is anyone in danger right now, does this summary look right -- and after the parent explicitly
confirms, returns a recommended first contact pending human confirmation. It shows all three
jurisdictional roles with the reason each holds its role, the authoritative source links and when
they were last verified, the specific place the public record breaks down, a plain-language next
action, and a call script that asks the agency the one question that actually resolves ownership.

The two synthetic cases route differently -- a municipal-street signal outage goes to city traffic
engineering, a state-route beacon goes to the state district office with the unresolved city-permit
question kept visible -- which demonstrates the routing responds to facts rather than returning one
canned answer. Input that does not clearly match a case produces a clarifying decline that names no
agency at all.
```

### Data sources

```
Synthetic case data (all fictional, every record carries is_synthetic: true) in data/cases.js,
seeded from our own synthetic handoff cards in docs/school-zone-crosswalk-handoff.md. The record
shape mirrors the official Challenge 2 resource pack's municipal-service-cases.csv field set:
case_id, service_type, synthetic_location, jurisdiction_a, jurisdiction_b, authoritative_source,
conflict_or_gap, recommended_handoff, requires_human_confirmation, is_synthetic.

Two cases: CASE-03 (crosswalk signal outage, fictional municipal street near Fictional Lincoln
Heights Elementary) and CASE-03B (flashing beacon malfunction, Fictional State Route 42 near
Fictional Maple Ridge Middle School).

Real public reference pages, cited as the real-world pattern each fictional agency is modeled on and
as where a human would go to confirm -- NOT as evidence that any agency owns any asset. Verified
2026-08-27 per the resource pack:
- Alabama Department of Transportation, https://www.dot.state.al.us/
- City of Birmingham, https://www.birminghamal.gov/
- Jefferson County, https://www.jccal.org/
- Regional Planning Commission of Greater Birmingham, https://www.rpcgb.org/
- Census TIGERweb, https://tigerweb.geo.census.gov/tigerweb/ -- road classification context only,
  explicitly not used to determine responsibility

No source is scraped, fetched, or called by the application. Every URL is rendered as a link for a
human to click.
```

### Claude integration

```
At runtime -- the model selects, local data renders. An optional zero-dependency Node proxy sends
Claude the parent's three routing-relevant answers plus a compact catalog, under a system prompt
that permits exactly one output shape: {"case_id": "<CASE-03 | CASE-03B | unresolved>", "reason":
"..."}. The prompt forbids naming any agency, phone number, or URL, and instructs the model to
answer "unresolved" rather than guess. The server re-validates the returned case_id against the
catalog and the client validates it again before rendering.

The result is the design's main safety property: no model-generated string ever reaches the DOM.
Every agency name, role, caveat, evidence link, gap, next action, and call script is read from
data/cases.js. A hallucinated agency or fabricated URL is not merely unlikely -- it has no code path
to the screen.

A deterministic keyword engine is the floor rather than a fallback: it is the entire routing engine
for the published static build, and it backstops the live path on any error or invalid payload.
Location is scored separately from equipment and gates the match, so unknown free text declines
instead of matching on a stray keyword.

During the build -- Claude Code driving GitHub Spec Kit. The event rules were encoded first as a
seven-principle project constitution (.specify/memory/constitution.md), then a specification with 20
functional requirements traceable to it, then a plan and task list where every task names the
principles it must satisfy. Principle III ("no invented ownership") is why the model-selects
architecture exists at all -- it made "never invent an agency" a structural requirement rather than
a prompt instruction.
```

### Current capabilities

```
- Both synthetic cases route end to end and produce different recommended first contacts.
- All three jurisdictional roles render with rationale, caveats, evidence links, and verified-on date.
- The recommendation is unreachable until the parent explicitly confirms the summary.
- Unmatched input produces a clarifying decline that names no agency (verified against four
  different unmatched inputs).
- Immediate-danger input renders static safety guidance above the routing result. The app never
  dials anything -- there is no tel: link or auto-call anywhere in the codebase.
- A routine outage does not escalate to emergency guidance.
- The published build works with no server, no API key, and no network access to any agency.
- Voice input and readback via the browser's Web Speech API: off by default, hidden when
  unsupported, with a fully equivalent text path. No audio is recorded or transmitted.
- Keyboard-operable throughout with visible focus states; responsive at 375px and desktop.
- A visible banner always states which routing path produced the result.
- Verified by 55 passing assertions (npm test). tests/routing.test.mjs lifts the real matchCase()
  source out of app.js so the test cannot drift from the implementation; tests/e2e.test.mjs loads
  the real index.html and runs the real app.js under jsdom with every network call failing --
  exactly the GitHub Pages condition -- and clicks through all four scenarios including the
  must-not-guess path and the immediate-danger path.
```

### Limitations

```
- Every case, location, agency, and outcome is fictional. The agency names do not exist. No real
  agency has reviewed, approved, or endorsed any routing this tool produces.
- The routing hypotheses are hypotheses. "Signals on municipal streets are usually maintained by
  city traffic engineering" is how the function is typically organized, not a verified ownership
  record for any specific asset. The tool states this on screen every time and requires human
  confirmation.
- Two cases only. Real Greater Birmingham has many more jurisdictions and edge cases. The data shape
  supports more cases without code changes; the coverage is what is synthetic.
- Keyword matching is deliberately shallow and tuned to decline rather than stretch. A real
  deployment would need a far richer location model, and would still need the decline path.
- No live data of any kind: no geocoding, no device location, no boundary lookup, no agency API, no
  ticket status. Geographic boundaries are never used to determine legal responsibility.
- Nothing is stored. Answers live in the browser tab and vanish on reload. No server transcript
  storage, no audio retention.
- The live Claude path requires running the local server. The public link runs the deterministic
  engine and labels itself "Simulated routing" so no one can mistake which path produced a result.
```

### Next steps

```
Sit down with one municipal traffic engineering office and one ALDOT district office and fill in a
single real case together -- one intersection, one beacon -- recording who actually holds it, how
they learned that, and which published page (if any) would have told a resident.

That session is the whole pilot. It converts one synthetic card into one verified card and, more
usefully, produces the first honest measurement of how wide the ownership gap really is. If two
agencies in the same room need more than five minutes to agree who owns one beacon, that finding is
worth more to the region than the tool is -- and it is the number that would justify funding the
shared asset registry this interface is a front end for.
```

---

## Mandatory acknowledgments

All four are satisfied — check them:

- [x] **Project resides in a public repository** — https://github.com/AlyPosey/municipal-crosswalk-routing
- [x] **Synthetic data is labeled as such** — every record carries `is_synthetic: true`; a persistent
  page banner and an in-result notice both state it.
- [x] **No sensitive or personally identifiable information was used** — the conversation never asks
  for names, phone numbers, email addresses, or real addresses, and stores nothing.
- [x] **Critical workflow decisions include human review checkpoints** — the recommendation is gated
  behind explicit confirmation, is always phrased "pending human confirmation", and every result
  carries the confirmation requirement plus a call script for a person to use.
