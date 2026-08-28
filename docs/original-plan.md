## Plan: AI Parent Crosswalk Handoff Website

Build a website for Challenge 2 that lets a parent have a guided conversation with an AI agent about a school-zone crosswalk signal outage. The agent asks focused questions, accepts a fictional address or synthetic case, identifies the recommended first agency across three jurisdictions, explains evidence and uncertainty, and gives the parent a call script. The product remains a routing suggestion tool, not a live reporting service or legal-responsibility engine.

**Steps**

1. Create a lightweight web application in `c:\Users\alyso\Code\02-municipal-collaboration`. Use a simple frontend and minimal Node backend because there is currently no application scaffold. Keep project logic and the artifact created during the event timeframe.
2. Add local synthetic case data for at least three agency/jurisdiction roles: state transportation/ALDOT, municipal traffic engineering, and the regional school transportation authority. Include case ID, fictional location, service type, agency role, evidence/source metadata, freshness, overlap/gap, recommended first handoff, next action, human-confirmation flag, and `is_synthetic: true`.
3. Implement a resident-facing conversation flow. The agent should ask:
   - Where is the fictional/synthetic crossing?
   - What appears to be broken: signal, flashing beacon, pedestrian button, or other equipment?
   - Is it near a school or school zone?
   - Is there immediate danger, injury, active collision risk, or an unsafe crossing situation?
   - Can the parent confirm the summarized details before receiving a recommendation?
   Do not request names, phone numbers, email addresses, child information, or other personal identifiers.
4. Implement the Claude integration through a server-side Node proxy. Read the API key from `.env`, ensure `.env` is in `.gitignore`, send only the minimum synthetic/conversation context needed, and use a constrained system prompt that prevents the model from inventing agency ownership, treating results as legal determinations, or submitting requests. The backend should return structured routing output that the frontend validates before rendering.
5. Provide a local fallback or demo mode if the API is unavailable, clearly labeled as simulated. The normal event demo should still work without exposing secrets.
6. Render the conversation result with:
   - Parent’s summarized answers
   - Recommended first contact, using “recommended first contact” or “likely contact pending confirmation” wording
   - All three agency roles and comparison
   - Evidence and authoritative links
   - Conflict/overlap/gap
   - Plain-language next action and call script
   - Explicit human confirmation requirement
   - Synthetic-data and no-live-submission notices
7. Add voice-ready interaction. Provide microphone/transcript controls or a clearly labeled mock voice mode, with a complete text alternative. Do not place calls, store microphone audio, or imply that a voice command submits a report.
8. Add immediate-danger handling. Show static safety guidance only when the parent reports immediate danger, injury, active collision risk, or an unsafe crossing situation. The site must not automatically call 911. Routine outages continue through agency routing.
9. Add consent and data controls. Default to no server transcript storage. If transcript saving is implemented, require explicit opt-in, exclude audio, exact address, names, contact details, and other personal identifiers, and explain retention/deletion. A local download is safer than server storage and should be preferred for the event demo.
10. Add a static illustrative map or synthetic location panel only. Do not use device location, live geocoding, live boundary lookups, or geographic data alone to determine responsibility. Keep fictional addresses and cases clearly synthetic and framed as Greater Birmingham examples.
11. Complete the project README using the official team template, documenting the challenge, primary resident user, service, data sources, Claude use, architecture, limitations, synthetic/mock elements, and one next step toward a pilot.

**Challenge References and Rules**

- [Challenge 2 brief](https://github.com/Birmingham-AI/claude-impact-lab/blob/main/challenges/02-municipal-collaboration.md) — requires one high-friction service, a coordination layer across at least three jurisdictions, evidence, overlap/gap visibility, and a next action.
- [Challenge 2 resource pack](https://github.com/Birmingham-AI/claude-impact-lab/blob/main/resources/02-municipal-collaboration.md) — provides the synthetic municipal-service cases, Birmingham and national reference sources, data limitations, licensing notes, and prohibited uses.
- [Event rules](https://github.com/Birmingham-AI/claude-impact-lab/blob/main/RULES.md) — requires public, licensed, or clearly synthetic data; prohibits sensitive attendee or client data; prohibits writes to live government or nonprofit systems and real ticket/referral/application submissions; and requires human oversight for consequential decisions.
- [Submission guidance](https://github.com/Birmingham-AI/claude-impact-lab/blob/main/SUBMISSIONS.md) — governs the public repository contents and submission process.
- [Judging rubric](https://github.com/Birmingham-AI/claude-impact-lab/blob/main/JUDGING.md) — prioritizes real civic impact, coherent execution, and clear evidence, limitations, and next step.

The implementation must preserve the following constraints from these documents:

- Keep every case, location, and outcome clearly synthetic; retain `is_synthetic: true` in copied or modified records.
- Use authoritative links as evidence, but do not imply agency endorsement or treat geographic boundaries alone as legal responsibility.
- Present “recommended first contact” or “likely contact pending confirmation,” not a definitive legal owner.
- Do not scrape or overload public services, use live geocoding, submit reports, place calls, or write to agency systems.
- Show uncertainty, stale or conflicting information, the human-confirmation point, and the product limitations.
- Follow the event timing and submission deadline in the rules; project logic and the artifact must not predate the permitted start time.

**Relevant files**

- `c:\Users\alyso\Code\02-municipal-collaboration\02-municipal-collaboration.md` — local copy of the Challenge 2 brief and prohibited scope.
- `c:\Users\alyso\Code\02-municipal-collaboration\school-zone-crosswalk-handoff.md` — existing CASE-03 and CASE-03B synthetic handoff content; use as the initial data source while treating ownership statements as hypotheses pending confirmation.
- `https://github.com/Birmingham-AI/claude-impact-lab/blob/main/resources/02-municipal-collaboration.md` — official Challenge 2 resource pack and synthetic dataset reference.
- `https://github.com/Birmingham-AI/claude-impact-lab/blob/main/RULES.md` — official event rules and safety requirements.
- `c:\Users\alyso\Code\02-municipal-collaboration\index.html` — accessible conversation and result UI.
- `c:\Users\alyso\Code\02-municipal-collaboration\styles.css` — responsive visual design, warnings, focus states, and readable conversation layout.
- `c:\Users\alyso\Code\02-municipal-collaboration\app.js` — conversation state, API calls, fallback mode, validation, and rendering.
- `c:\Users\alyso\Code\02-municipal-collaboration\data\cases.js` — synthetic cases, agencies, sources, and routing metadata.
- `c:\Users\alyso\Code\02-municipal-collaboration\server.js` — secure Claude proxy and optional consent-based transcript endpoint, if storage is implemented.
- `c:\Users\alyso\Code\02-municipal-collaboration\.env.example` — required configuration without secrets.
- `c:\Users\alyso\Code\02-municipal-collaboration\.gitignore` — must ignore `.env` and any local transcript files.
- `c:\Users\alyso\Code\02-municipal-collaboration\README.md` — filled official team README.

**Verification**

1. Start the Node server with a documented command and verify the frontend loads locally.
2. Run CASE-03 municipal-road flow and confirm the city traffic engineering recommendation is qualified, source-backed, and human-confirmed.
3. Run CASE-03B state-route flow and confirm the state transportation office is the recommended first contact while city permit uncertainty and school-authority stakeholder role remain visible.
4. Test unsupported or ambiguous locations and confirm the agent asks for clarification or declines to guess.
5. Test immediate-danger input and confirm safety guidance appears without an automated 911 call or report submission.
6. Test normal outage input and confirm it does not automatically escalate to 911.
7. Test API-unavailable fallback mode and confirm it is visibly labeled simulated.
8. Verify `.env` is ignored, no API key reaches browser code, and no transcript/audio/exact address is stored by default.
9. Test the consent flow if transcript saving exists; verify prohibited personal fields are excluded.
10. Test keyboard navigation, text alternative to voice, responsive desktop/mobile layout, source links, synthetic banners, and all no-live-system notices.
11. Review the final README and interface against the Challenge 2 eligibility rules and judging criteria.

**Decisions**

- Primary user: resident/parent.
- Service: school-zone crosswalk signal outage.
- Agent: real Claude integration through a server-side Node proxy, with a deterministic fallback for demos.
- API security: key in `.env`; `.env` ignored by Git; never expose the key in frontend code.
- Location: synthetic fictional addresses and case selection only; device location disabled in the first version.
- Jurisdictions: state transportation/ALDOT, municipal traffic engineering, and regional school transportation authority.
- Voice: voice-ready/mock interaction with a full text alternative; no live calls or audio retention.
- Emergency: safety guidance only for immediate danger; no automatic 911 call. Routine outages use normal routing.
- Transcript: no server retention by default; any storage requires explicit consent and excludes audio, exact address, identifiers, and sensitive information.
- Map: static illustrative synthetic context only.
- Excluded: live tickets, referrals, applications, service requests, writes to government systems, personal data, device geolocation, agency endorsement, and automated legal-responsibility determinations.
