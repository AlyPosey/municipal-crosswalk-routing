# Jurisdiction Junction Constitution

Governing principles for the Birmingham Claude Impact Lab Challenge 2 artifact: a school-zone
crosswalk signal routing-suggestion tool. These principles are derived from the event RULES.md,
the Challenge 2 brief, and the Challenge 2 resource pack. They are eligibility requirements, not
preferences: a violation disqualifies the submission before judging.

## Core Principles

### I. Synthetic-Only Data (NON-NEGOTIABLE)

Every case, location, agency, contact, and outcome in this artifact is fictional. Every case record
carries `is_synthetic: true`, and that label survives any copy or transformation. No attendee data,
client records, health records, HMIS records, PII, or confidential nonprofit data is used, stored, or
transmitted. Synthetic availability, capacity, eligibility, demand, or agency decisions are never
presented as real. A visible synthetic-data notice appears on load and inside every result.

### II. No Writes To Live Systems (NON-NEGOTIABLE)

The artifact never submits a ticket, referral, application, or service request; never writes to any
government or nonprofit system; never places a phone call, including 911; and never scrapes or
otherwise loads a public service. Outbound network activity is limited to the Anthropic API through
our own server-side proxy. Authoritative source URLs are rendered as links for a human to click, and
are never fetched by the application.

### III. No Invented Ownership (NON-NEGOTIABLE)

The artifact recommends a *first contact pending human confirmation*. It never states a definitive
legal owner and never performs an automated legal-responsibility determination. Agency selection is
constrained to a fixed local catalog: the language model may only choose an existing `case_id` or
return `unresolved`. All agency names, roles, evidence text, and links rendered on screen come from
local synthetic data — never from model-generated prose. Input that does not confidently match the
catalog produces a clarifying question or an explicit decline. Geographic boundaries alone are never
treated as determining legal service responsibility.

### IV. Human In The Loop

Every result states the human-confirmation requirement explicitly and names the confirmation step as
the point of the tool, not a formality. The parent is given a call script so a person makes the
consequential contact. No workflow completes without a human acting.

### V. Evidence And Uncertainty Are Always Visible

Every result renders: all three jurisdictional roles, the reason each holds its role, authoritative
source links, the date sources were last verified, and the specific overlap, conflict, or ownership
gap. Stale or conflicting information is surfaced as a warning rather than smoothed over. The
artifact never implies agency approval, endorsement, or agreement to a shared policy.

### VI. No Secrets Client-Side

The Anthropic API key lives only in `.env`, is read only by `server.js`, and never reaches browser
code, committed files, or model output. `.env` is gitignored. The published static build contains no
credentials and must remain fully usable without any key.

### VII. Accessible And Degradable By Default

The full flow is operable by keyboard with visible focus states, works at 375px and desktop widths,
and works in the published static build with no server. Voice is an optional enhancement; the text
path is always present and equivalent. When the live model path is unavailable, the deterministic
path runs and is labeled "Simulated routing" in plain sight.

## Privacy Constraints

The conversation never asks for, accepts by design, or stores: parent names, child names, phone
numbers, email addresses, exact real addresses, or any other personal identifier. No microphone audio
is retained or transmitted to a server. There is no server-side transcript storage. Speech
recognition, when used, runs in the browser and its result is treated as ordinary text input.

## Development Workflow

Built spec-driven with GitHub Spec Kit: constitution → spec → plan → tasks → implementation. Project
logic and the artifact are created inside the event window (start 9:30 AM CDT, hard deadline 2:00 PM
CDT, 2026-08-28). Pre-existing frameworks and tooling are permitted; the project logic is not
pre-existing. The submission ships as a public GitHub repository with a README based on the official
team template.

Every task is checked against Principles I–VII before it is marked complete. If a feature cannot be
built without violating a principle, the feature is cut, not the principle. The pre-agreed cut order
under time pressure is: static map panel → transcript download → voice → live model proxy. The
deterministic static build plus the README is a complete, rule-compliant submission on its own.

## Governance

This constitution supersedes convenience, demo polish, and judging-rubric optimization. Any amendment
must be recorded here with a version bump and a one-line rationale. Reviews verify compliance with
each principle by name.

**Version**: 1.0.0 | **Ratified**: 2026-08-28 | **Last Amended**: 2026-08-28
