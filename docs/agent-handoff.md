# Agent Handoff: Parent Crosswalk Signal Routing Website

## Mission

Build a small website for Challenge 2 of the Birmingham Claude Impact Lab. The primary user is a parent who discovers a school-zone crosswalk signal outage and does not know which agency to contact.

The website should use an AI agent to ask focused questions, then provide a source-backed recommendation for the most likely first contact. It must explain uncertainty and require human confirmation. It is a routing suggestion tool, not a live reporting system or legal-responsibility engine.

## Current project files

- `02-municipal-collaboration.md` — local copy of the Challenge 2 brief.
- `school-zone-crosswalk-handoff.md` — existing synthetic CASE-03 and CASE-03B handoff cards.
- `plan.md` — detailed implementation plan and decisions.
- `agent-handoff.md` — this handoff document.

There is currently no application scaffold.

## Agreed product scope

- Primary user: resident/parent.
- Service: school-zone crosswalk signal outage.
- Input: fictional address or synthetic case only.
- Region framing: Greater Birmingham, while keeping cases, locations, agencies, and outcomes clearly synthetic.
- Agent: Claude through a server-side Node proxy, with a deterministic local fallback for the event demo.
- Voice: voice-ready or mock voice experience with a complete text alternative. No live calls and no audio retention.
- Map: static illustrative synthetic context only. No device location, live geocoding, or live boundary lookup.
- Jurisdictions/agencies: state transportation/ALDOT, municipal traffic engineering, and regional school transportation authority.
- Transcript: no server retention by default. If storage is added, it requires explicit consent and excludes audio, exact address, names, contact details, and sensitive information.

## Conversation flow

The agent should ask:

1. What fictional or synthetic location is the crossing near?
2. What appears to be broken: traffic signal, flashing beacon, pedestrian button, or other equipment?
3. Is the crossing near a school or school zone?
4. Is there immediate danger, injury, active collision risk, or an unsafe crossing situation?
5. Can the parent confirm the summarized information before receiving a recommendation?

Do not ask for or store parent names, child names, phone numbers, email addresses, or other personal identifiers.

## Result requirements

Show:

- The parent’s summarized answers.
- “Recommended first contact” or “likely contact pending confirmation,” never a definitive legal owner.
- All three agency roles in a comparison.
- Evidence and authoritative source links.
- Source freshness and stale/conflicting information when known.
- The overlap, conflict, or ownership gap.
- Plain-language next action.
- A suggested call script.
- Explicit human confirmation requirement.
- Synthetic-data and no-live-submission notices.

If the location or scenario is unsupported or ambiguous, ask for clarification or decline to guess. Do not invent an agency owner.

## Synthetic scenarios

### CASE-03: Municipal-road signal outage

- Location: fictional intersection near Fictional Lincoln Heights Elementary.
- Service: school-zone crosswalk signal outage.
- Possible agencies: Fictional City of Lincoln Heights Traffic Engineering and Fictional Regional School Transportation Authority.
- Working routing hypothesis: municipal traffic engineering is the recommended first contact, pending confirmation.
- School transportation authority: stakeholder or complaint-history source, not automatically the hardware owner.
- Gap: public pages do not clearly resolve the ownership boundary.

### CASE-03B: State-route beacon malfunction

- Location: fictional crossing on Fictional State Route 42 near Fictional Maple Ridge Middle School.
- Service: school-zone flashing beacon malfunction.
- Possible agencies: Fictional ALDOT District Traffic Office, Fictional City of Maple Ridge Traffic Engineering, and Fictional Regional School Transportation Authority.
- Working routing hypothesis: state transportation is the recommended first contact because the route is state-numbered, pending confirmation.
- Gap: installation and maintenance may belong to different entities, and permit records are unavailable.

Keep both cases clearly labeled synthetic. Preserve `is_synthetic: true` in structured data.

## Challenge references and rules

- Challenge brief: https://github.com/Birmingham-AI/claude-impact-lab/blob/main/challenges/02-municipal-collaboration.md
- Resource pack: https://github.com/Birmingham-AI/claude-impact-lab/blob/main/resources/02-municipal-collaboration.md
- Event rules: https://github.com/Birmingham-AI/claude-impact-lab/blob/main/RULES.md
- Submission guidance: https://github.com/Birmingham-AI/claude-impact-lab/blob/main/SUBMISSIONS.md
- Judging rubric: https://github.com/Birmingham-AI/claude-impact-lab/blob/main/JUDGING.md

The implementation must comply with these constraints:

- Use public, licensed, or clearly synthetic data.
- Never use attendee data, private client records, health records, HMIS records, personal information, or other sensitive data.
- Do not write to live government or nonprofit systems.
- Do not submit tickets, referrals, applications, or service requests.
- Do not scrape or overload public services.
- Do not present synthetic availability, capacity, eligibility, demand, or agency decisions as real.
- Show sources, uncertainty, limitations, and the human-review point.
- Do not imply agency approval or endorsement.
- Do not use geographic boundaries alone to determine legal service responsibility.
- Keep the project logic and artifact within the event’s permitted timing and submit through the required public GitHub process.

## Suggested implementation

Use a minimal Node application with a static frontend:

- `index.html` — accessible chat/intake and results UI.
- `styles.css` — responsive visual design and warning states.
- `app.js` — conversation state, rendering, fallback mode, and API calls.
- `data/cases.js` — local synthetic cases, agencies, sources, and routing metadata.
- `server.js` — Claude API proxy.
- `.env.example` — configuration names without secrets.
- `.gitignore` — include `.env`, local transcript files, and other secrets.
- `README.md` — completed official team README.
- `package.json` — start script and minimal dependencies.

Keep the Claude API key server-side in `.env`; never place it in browser code. Use a constrained system prompt and validate structured model output before displaying it.

## Emergency behavior

A routine nonworking signal should use normal transportation-agency routing. Show static safety guidance only when the parent reports immediate danger, injury, active collision risk, or an unsafe crossing situation. The website must not automatically call 911 or place any other call.

## Verification checklist

- The site loads locally with a documented command.
- CASE-03 recommends municipal traffic engineering with qualified language and visible uncertainty.
- CASE-03B recommends state transportation with city permit uncertainty and school-authority involvement visible.
- The result shows all three agency roles, evidence, gap, next step, and human confirmation.
- Unsupported input does not produce an invented owner.
- Routine outage input does not automatically escalate to 911.
- Immediate-danger input shows safety guidance without placing a call or submitting a report.
- API-unavailable mode is visibly labeled simulated.
- `.env` is ignored and no API key is sent to browser code.
- No audio, personal identifiers, exact real addresses, or sensitive records are retained.
- Voice controls have an accessible text alternative.
- Synthetic labels and no-live-submission warnings are prominent.
- Desktop and mobile layouts work, with keyboard navigation and visible focus states.
- README documents data sources, Claude use, architecture, limitations, synthetic/mock elements, and one next step toward a pilot.
