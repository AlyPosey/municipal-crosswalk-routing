# Handoff Cards: School-Zone Traffic Signal / Crosswalk

> ⚠️ **All cases below are entirely synthetic.** They describe fictional locations, agencies, and outcomes for prototyping purposes only. Nothing here represents a real resident, a real complaint, or a real agency determination, and none of it should be sent as an actual service request. This artifact does not make a legal responsibility determination — it routes to the agency that can confirm one.

---

## CASE-03: Signal Outage Near a Municipal School Crossing

**Service type:** School-zone crosswalk signal outage
**Location:** Fictional intersection near Fictional Lincoln Heights Elementary *(synthetic address)*

### Who is responsible
| Role | Entity | Notes |
|---|---|---|
| **Primary contact** | Fictional Lincoln Heights Traffic Engineering | Owns/maintains signals on municipal streets |
| **Secondary stakeholder** | Fictional Regional School Transportation Authority | Requested the signal; holds complaint history — does **not** own the hardware |

### What is available here
Fictional Lincoln Heights traffic engineering publishes signal maintenance requests and outage reporting on its public works page. The Regional School Transportation Authority does not maintain infrastructure but may confirm whether a prior request was filed.

### Where is the overlap or gap
Signal ownership is unclear between city traffic engineering and the regional school transport authority — both have a plausible claim to "who should fix this," and neither page states the boundary explicitly.

### What is the next action
Route to Fictional Lincoln Heights Traffic Engineering first, for signal ownership confirmation.

**Script line:** *"I'm reporting a school-zone signal outage near [fictional location]. Can you confirm whether this signal is on your maintenance list, or if it falls under [Regional School Transportation Authority]?"*

**Requires human confirmation:** ✅ Yes — ownership boundary is not resolvable from public pages alone.

---

## CASE-03B: Signal on a State Route Running Through a School Zone *(new — added to cover the third jurisdiction)*

**Service type:** School-zone flashing beacon malfunction
**Location:** Fictional crossing on Fictional State Route 42, adjacent to Fictional Maple Ridge Middle School *(synthetic address)*

### Who is responsible
| Role | Entity | Notes |
|---|---|---|
| **Primary contact** | Fictional ALDOT District Traffic Office | Signals on state-numbered routes generally fall under state maintenance |
| **Secondary contact** | Fictional City of Maple Ridge Traffic Engineering | May have installed the school-zone beacon under a state permit — permit records aren't publicly posted |
| **Tertiary stakeholder** | Fictional Regional School Transportation Authority | Requested the beacon; holds incident/complaint history |

### What is available here
The fictional ALDOT district page lists state-route maintenance contacts but does not publish permit records for locally installed school-zone equipment. The fictional city page describes its own traffic engineering scope but doesn't clarify state-route exceptions.

### Where is the overlap or gap
The beacon may have been installed by the municipality under an ALDOT permit, which means "who installed it" and "who maintains it" could be two different answers — and that split isn't published anywhere a resident or frontline staffer can check directly.

### What is the next action
Route to the fictional ALDOT District Traffic Office first, since the road is a state route; escalate to Fictional City of Maple Ridge Traffic Engineering if ALDOT confirms the beacon was installed under municipal permit.

**Script line:** *"I'm reporting a malfunctioning school-zone beacon on [fictional state route]. Can you confirm whether this asset is state-maintained or installed under a city permit?"*

**Requires human confirmation:** ✅ Yes — state-route cases should always be confirmed before any action is implied.

---

## Reuse notes for the team

- Keep the `is_synthetic` label on any copy of these cards, per the resource file's licensing terms.
- Do not send these as real tickets, service requests, or referrals to any agency, live or synthetic.
- Do not imply that any agency has approved, endorsed, or confirmed a routing decision this card produces — the "confirm" step is the point, not a formality.
- If you add more cases, keep the same structure (Who / What's available / Overlap-gap / Next action / Confirmation flag) so they can be batch-rendered into a single lookup tool later.
