# Specification Quality Checklist: Conversation Flow Clarity, Text-First Entry & Usable Voice

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-28
**Updated**: 2026-08-28 — text-first entry path folded in as User Story 3
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Constitutional Compliance Review

The supplied "Crossing Guard" design was reviewed against the constitution before being folded in. Two blocking violations were found in the design as drawn and are corrected by requirement in this spec.

| Finding in the supplied design | Principle | Resolution in spec |
|--------------------------------|-----------|--------------------|
| Real Birmingham-area schools, communities, and a real state transportation agency are named, with real intersections, as the data "the agent actually matches against" | **I — Synthetic-Only Data (NON-NEGOTIABLE)** | **FR-022** requires every location, school, community, agency, contact name, and number in the text path to be fictional and synthetic-labeled. **SC-007** makes it verifiable at zero tolerance. |
| Knowledge-base column headed `OWNER`; body copy reads "cross-referenced to its **legal owner**" | **III — No Invented Ownership (NON-NEGOTIABLE)** | **FR-023** prohibits any owner/legal-owner column, heading, or copy, and requires first-contact-pending-human-confirmation framing with the reason visible. **SC-008** verifies at zero tolerance. |
| "Signs at every crossing light carry the short code"; "in production it would sync from each municipality's GIS/asset system" — reads as an existing arrangement | **V — Evidence And Uncertainty Visible** (no implied agency agreement) | **FR-026** requires such statements be framed explicitly as proposal or future state. |
| Stage 04 "tap-to-call number" | **II — No Writes To Live Systems** (never places a call) | **FR-025** permits presenting a number a person chooses to dial; prohibits the tool placing a call. Auto-dial listed in Out of Scope. |

The design's simulated nature (not-a-live-number badge, in-page send button, restart control, step counter) was confirmed as compliant with Principle II and requires no telephony. Real SMS is recorded in Out of Scope as needing a constitutional amendment.

## Validation Notes

**Iteration 2 — all items pass.** (Iteration 1 covered the original four-defect scope; this iteration re-validates with User Story 3 added.)

- **Implementation detail check**: Speech, microphone, message threads, and browser-tab lifetime appear as user-facing subject matter and constitutional privacy constraints, not technology choices. No language, framework, library, API, or DOM detail appears. The `375px` figure is an accessibility target inherited from Constitution VII.
- **Zero clarification markers**: Four judgment calls were resolved by informed default rather than by asking, each recorded in Assumptions with rationale — simulated-vs-real SMS, fictional data substitution, first-contact-vs-owner framing, and which path is the default landing experience. The last of these is flagged in the spec as a reversible presentation decision.
- **Cross-path consistency**: FR-030 and SC-015 require the text path and the question path to produce identical results from identical input, so the new entry path cannot drift from the audited routing logic.
- **Scope boundary**: Out of Scope explicitly excludes telephony, GIS sync, phone-number collection, auto-dial, and changes to routing logic.

## Notes

- Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`
- Story priority order (P1 confirmation clarity → P2 back navigation → P3 text-first path → P4 voice input → P5 voice output quality) is arranged so the lowest-priority story is the first safe cut, consistent with the constitution's pre-agreed cut order.
- **Largest risk to the plan**: User Story 3 is materially bigger than the other four combined — it adds a second entry path, a message-thread interaction model, and new synthetic catalog entries. It is the story most likely to need descoping.
