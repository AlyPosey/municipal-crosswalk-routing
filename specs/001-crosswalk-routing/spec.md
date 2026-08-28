# Feature Specification: School-Zone Crosswalk Routing Assistant

**Feature Branch**: `001-crosswalk-routing`
**Created**: 2026-08-28
**Status**: Draft
**Input**: Guided conversation that routes a parent's school-zone crosswalk signal outage to a recommended first agency across three jurisdictions.

## User Scenarios & Testing *(mandatory)*

The primary user is a **parent/resident** in Greater Birmingham who has noticed that the crossing
signal outside their child's school is not working. They do not know whether the city, the state
transportation department, or the school transportation authority is responsible. Today they guess,
call the wrong office, get transferred, and often give up. The repeated moment of friction is
**"Who owns this?"**; the desired outcome is a **correct handoff**.

### User Story 1 - Municipal-street signal outage (Priority: P1)

A parent reports a dead crosswalk signal at a fictional intersection near Fictional Lincoln Heights
Elementary. The assistant asks five focused questions, summarizes the answers back, and — only after
the parent confirms — names the city traffic engineering office as the recommended first contact
pending confirmation, alongside the other two jurisdictional roles, the evidence behind each, the
ownership gap, and a call script.

**Why this priority**: This is the most common shape of the problem and the minimum viable product.
It alone proves the coordination layer works across three jurisdictions.

**Independent Test**: Run the flow start to finish choosing the municipal case; a complete,
source-backed, confirmation-gated recommendation renders with no server running.

**Acceptance Scenarios**:

1. **Given** a fresh session, **When** the parent selects the municipal case and answers all five
   questions, **Then** the result names Fictional Lincoln Heights Traffic Engineering as
   "recommended first contact — pending human confirmation", never as the legal owner.
2. **Given** that result, **When** the parent reads the agency comparison, **Then** all three roles
   appear, and the Regional School Transportation Authority is labeled a stakeholder holding
   complaint history, explicitly *not* the hardware owner.
3. **Given** that result, **When** the parent looks for justification, **Then** authoritative source
   links, the date sources were last verified, and the specific ownership gap are all visible.
4. **Given** the summary step, **When** the parent has not yet confirmed, **Then** no recommendation
   is shown.

### User Story 2 - State-route beacon malfunction (Priority: P2)

A parent reports a malfunctioning school-zone flashing beacon on Fictional State Route 42 near
Fictional Maple Ridge Middle School. The route being state-numbered shifts the recommended first
contact to the state transportation district office, while keeping the unresolved city-permit
question and the school authority's stakeholder role visible.

**Why this priority**: It demonstrates that routing actually changes with the facts rather than
returning one canned answer, and it surfaces the hardest real-world gap — installed by one entity,
maintained by another.

**Independent Test**: Run the flow choosing the state-route case; the recommendation differs from
User Story 1 and the permit ambiguity is stated on screen.

**Acceptance Scenarios**:

1. **Given** the state-route case, **When** the result renders, **Then** the Fictional ALDOT District
   Traffic Office is the recommended first contact, qualified as pending confirmation.
2. **Given** that result, **When** the parent reads the gap section, **Then** it states that "who
   installed it" and "who maintains it" may be different entities and that permit records are not
   published.
3. **Given** that result, **When** the parent reads the next action, **Then** it names the escalation
   path to city traffic engineering if the state office confirms a municipal permit.

### User Story 3 - Unrecognized or ambiguous location (Priority: P3)

A parent describes a crossing the tool has no synthetic case for. The assistant asks a clarifying
question or explicitly declines. It never guesses an agency.

**Why this priority**: This is the eligibility-critical behavior. A tool that invents an owner is
worse than no tool and violates the constitution.

**Independent Test**: Enter free text matching no case; verify a clarifying question or decline
appears and that no agency name is recommended.

**Acceptance Scenarios**:

1. **Given** free-text input with no confident catalog match, **When** the assistant responds,
   **Then** it asks for clarification or declines, and names no responsible agency.
2. **Given** a decline, **When** the parent looks for a way forward, **Then** the tool offers the two
   supported synthetic cases rather than a fabricated third.

### Edge Cases

- **Immediate danger reported.** If the parent reports injury, active collision risk, or an unsafe
  crossing right now, static safety guidance appears. The application never dials 911 and never
  places or initiates any call.
- **Routine outage.** A merely non-working signal routes normally and must not escalate to emergency
  guidance.
- **Model path unavailable.** With no server or no API key, the deterministic engine runs and the
  interface is labeled "Simulated routing" in plain sight.
- **Model returns an unknown agency or case.** The response is rejected and treated as unresolved.
- **Speech recognition unsupported or denied.** The voice control hides or disables itself; the text
  path is unaffected.
- **Parent volunteers personal information.** The tool does not request it, does not store it, and
  does not transmit it to a server.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST ask, in order: synthetic location; what appears broken (signal /
  flashing beacon / pedestrian button / other); whether the crossing is in or near a school zone;
  whether there is immediate danger; and a final confirmation of the summarized answers.
- **FR-002**: The system MUST NOT request parent names, child names, phone numbers, email addresses,
  or exact real addresses at any step.
- **FR-003**: The system MUST withhold the recommendation until the parent explicitly confirms the
  summary.
- **FR-004**: The system MUST express the outcome as "recommended first contact — pending human
  confirmation" and MUST NOT assert a definitive legal owner.
- **FR-005**: The system MUST display all three jurisdictional roles for the matched case, each with
  the reason it holds that role.
- **FR-006**: The system MUST display authoritative source links and the date those sources were last
  verified.
- **FR-007**: The system MUST display the specific overlap, conflict, or ownership gap for the case.
- **FR-008**: The system MUST display a plain-language next action and a copyable call script.
- **FR-009**: The system MUST display an explicit human-confirmation requirement in every result.
- **FR-010**: The system MUST display synthetic-data and no-live-submission notices on load and in
  every result.
- **FR-011**: The system MUST ask for clarification or decline when input does not confidently match
  a catalog case, and MUST NOT name an agency in that response.
- **FR-012**: The system MUST show static safety guidance when immediate danger is reported, and MUST
  NOT initiate a call of any kind.
- **FR-013**: The system MUST NOT show emergency guidance for a routine outage.
- **FR-014**: The system MUST function completely with no server present, using a deterministic
  routing engine, and MUST label that state as simulated.
- **FR-015**: When a live model path is available, the system MUST constrain the model to selecting an
  existing `case_id` or returning `unresolved`, and MUST validate the response against the local
  catalog before rendering.
- **FR-016**: The system MUST render all agency names, roles, evidence, and links from local
  synthetic data, never from model-generated prose.
- **FR-017**: The system MUST keep the API key server-side and MUST NOT expose it in browser code,
  page source, or version control.
- **FR-018**: The system MUST offer voice input and readback as an optional enhancement with a fully
  equivalent text path, and MUST NOT retain or transmit audio.
- **FR-019**: The system MUST NOT store transcripts on a server.
- **FR-020**: The system MUST be fully operable by keyboard with visible focus states, at 375px and
  desktop widths.

### Key Entities

- **Case**: A synthetic scenario. Fields mirror the official resource pack — `case_id`,
  `service_type`, `synthetic_location`, `jurisdiction_a`, `jurisdiction_b`, `authoritative_source`,
  `conflict_or_gap`, `recommended_handoff`, `requires_human_confirmation`, `is_synthetic` — extended
  with `agencies[]`, `next_action`, `call_script`, `match_keywords`, and `source_checked`.
- **Agency**: One jurisdictional role within a case: `name`, `role` (primary / secondary /
  stakeholder / not-applicable), `why_this_role`, `evidence[]` of `{ label, url }`, and `caveat`.
- **Conversation**: In-memory only. The five answers plus a danger flag and a confirmation flag.
  Never persisted server-side.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A parent completes the flow and reaches a source-backed recommendation in under two
  minutes without typing any personal information.
- **SC-002**: Both supported cases produce *different* recommended first contacts, demonstrating that
  routing responds to facts.
- **SC-003**: 100% of results display all three roles, evidence links, source-checked date, the gap,
  the next action, the call script, and the human-confirmation requirement.
- **SC-004**: 0 results name an agency for unmatched input.
- **SC-005**: The published static build performs every one of the above with no server running.
- **SC-006**: No credential appears in the repository or in page source.

## Assumptions

- Both synthetic cases and all agency names are fictional and stand in for the real Greater
  Birmingham pattern; no real agency has reviewed or endorsed any routing.
- Authoritative links are the real, public organizational pages named in the Challenge 2 resource
  pack, cited as evidence of *where a human would confirm*, not as proof of ownership. They were
  verified 2026-08-27 per the resource pack.
- Two cases are sufficient to demonstrate the three-jurisdiction coordination layer; the data shape
  supports more without code changes.
- The parent has a browser; nothing is installed.
