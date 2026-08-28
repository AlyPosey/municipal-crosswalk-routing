# Handoff: Jurisdiction Junction — Challenge 2

**Purpose of this doc:** so anyone picking this up — a teammate, a judge, or future-you — can get oriented without the person who built it in the room.

---

## Where this stands right now

| Area | Status |
|---|---|
| Challenge & user | Confirmed: Challenge 2, primary user = resident or frontline staff, moment = "who owns this?" |
| Service chosen | School-zone traffic signal / crosswalk |
| Jurisdictions | Municipal Traffic Engineering, ALDOT (state routes), Regional School Transportation Authority, County Roads Dept |
| Team name | Jurisdiction Junction (already live on the deployed site's byline) |
| Working prototype | Deployed at `alyposey.github.io/municipal-crosswalk-routing` |
| Local artifact copy | `school-zone-locator.html` — HTML/JS intake tool with web + SMS-mockup channels |
| Case-level reference | `school-zone-crosswalk-handoff.md` — CASE-03 and CASE-03B one-page handoff cards |
| Pitch deck | `jurisdiction-junction-pitch.pptx` — 10 slides, built for the 4-min presentation + 2-min Q&A format |
| Team README (required by SUBMISSIONS.md) | **Not yet drafted — this is the biggest open item** |

---

## What the tool does

Accepts a plain-language question, an address, or a labeled synthetic case, and returns:

1. **Responsible entity** (primary contact + any secondary stakeholders)
2. **Evidence** (link to the agency's own published page, never paraphrased)
3. **Next action** (a concrete first call to make)
4. **Overlap/gap flag** (shown explicitly, never silently resolved)
5. **Staleness flag** (when a source hasn't been re-verified recently)

It never files a ticket, referral, or service request, and it never makes a legal responsibility determination — a human confirms that.

### Data model
The ownership matrix (currently three synthetic cases: municipal, state-route/ALDOT, county) is static and human-curated. The tool's only job is matching input to a row and rendering it honestly — not inferring jurisdiction from first principles.

---

## Compliance check — what's confirmed vs. still open

Cross-referenced against `RULES.md` and `JUDGING.md`'s eligibility gate:

| Requirement | Status |
|---|---|
| No PII collected/stored | ✅ Confirmed on the live site's own disclaimer |
| No tickets/referrals/requests submitted | ✅ Confirmed on the live site |
| Synthetic data labeled, not presented as real | ✅ Confirmed |
| Human-confirmation point identified | ✅ Confirmed ("a person at the agency confirms that") |
| Submitted via GitHub Issue Form, public repo, by 2:00 PM CDT | ❓ **Unconfirmed** — haven't located/verified the backing repo or an open submission issue |
| No commit predating 9:30 AM CDT establishing project logic | ❓ **Unconfirmed** — needs a look at repo commit history |

**Action:** confirm the public repo exists, has commits starting at/after 9:30 AM CDT today, and that the GitHub Issue Form submission is filed before 2:00 PM CDT (warning fires at 1:45 PM CDT).

---

## What's real vs. simulated

**Working now:**
- Web intake tool, live and demoable
- Three-case ownership matrix spanning city / state / county
- Overlap/gap and staleness flags render on every result

**Simulated / not live:**
- The SMS short code (55-0142) is a design mockup — no live number exists
- Matching is keyword-based, not true natural-language understanding
- The matrix is hand-curated for three cases, not fed from a live agency data source

---

## Named next step (for the README and the pitch)

Partner with one municipal public works office to validate the matrix against their actual published pages, then extend the matrix past this one service.

---

## Still open before submission

1. **Team README** — needs to follow `templates/TEAM_README_TEMPLATE.md`: team name/ID, primary user, problem, what the project does, data sources, architecture + how Claude was used, link to the artifact, what works today, known limitations, named next step.
2. **Repo verification** — confirm public visibility and commit timing against the eligibility gate.
3. **GitHub Issue Form submission** — must be filed before the 2:00 PM CDT deadline.
4. **Optional:** a 60-second demo video, only required if the artifact can't be reviewed through a working public link.

---

## Reuse notes

- Keep the `is_synthetic` label on any copy of the case data.
- Don't send any of this as a real ticket, request, or referral — including during a live demo.
- If you extend the matrix, keep the same five-field shape (entity / evidence / next step / gap / staleness) so the deck and the tool stay consistent with each other.
