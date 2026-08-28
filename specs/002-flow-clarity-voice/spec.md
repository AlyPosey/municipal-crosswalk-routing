# Feature Specification: Conversation Flow Clarity, Text-First Entry & Usable Voice

**Feature Branch**: `002-flow-clarity-voice`

**Created**: 2026-08-28

**Status**: Draft

**Input**: User description: "The button for 'Yes - Show me who to contact first' is not apparent that it needs to be clicked. Something in that flow needs to be better so that the parent can find the button better. Also the questions need a back button if the parent wants to change an answer. Can we get a better sounding voice. This seems not to hear us is there a way to talk to it that we are missing." Plus a follow-up request to add a text-message entry path, supplied as screenshots of a "Crossing Guard" prototype.

## Problem Context

Five defects and gaps were found while a parent used the crosswalk routing tool out loud during walkthrough testing, plus one new entry path requested afterward. All of them sit in the conversation flow — between the parent describing a problem and the parent reaching a recommended first contact. None of them change *what* the tool recommends or where the recommendation comes from. They change whether the parent can get there at all, and how they get in the door.

1. The parent reaches the confirmation step and does not realize an action is required of them. The step reads as a summary of what they said, not as a gate they must open.
2. Once an answer is given it cannot be corrected. The only recovery is discarding the whole conversation and starting again.
3. There is only one way in: a five-question web form. A resident standing at a dark crossing with a phone in their hand would sooner send a text than fill in a form.
4. The parent speaks to the tool and nothing happens. There is no visible signal about whether it is listening, and no stated way to talk to it.
5. The spoken prompts sound mechanical enough to be off-putting in a demo and hard to follow.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The parent can tell the confirmation step needs a click (Priority: P1)

A parent finishes the last question. The tool shows what it understood and asks whether it looks right. The parent must be able to see, within a second and without reading carefully, that one action on this screen moves them forward, which action it is, and what it will do. Today they read the summary, treat it as the end of the flow, and stall.

**Why this priority**: This is a dead end on the only path to the tool's output. A parent who stalls here never sees a recommendation, so every other capability in the product is unreachable. It is also the failure most likely to happen in front of judges.

**Independent Test**: Give a first-time user the tool with no instructions, ask them to find out who to call, and observe the confirmation step. Success is reaching the recommendation without prompting or hesitation at that step.

**Acceptance Scenarios**:

1. **Given** the parent has answered every question, **When** the confirmation step appears, **Then** one action is presented as clearly dominant over every other control on the screen, and it is distinguishable from the secondary "answer again" action by appearance alone, without reading the labels.
2. **Given** the confirmation step is displayed on a 375px-wide screen, **When** the parent looks at the screen without scrolling, **Then** the confirming action is visible, or a persistent on-screen cue points to it.
3. **Given** the confirmation step is displayed, **When** the parent reads the step, **Then** it states plainly that this action reveals the recommendation and that nothing is submitted to anyone.
4. **Given** the confirmation step appears, **When** the parent presses Enter or Space without touching the mouse, **Then** the confirming action is already focused with a visible focus indicator and activates.
5. **Given** the parent activates the confirming action, **When** the recommendation is produced, **Then** the parent's attention is moved to the recommendation rather than being left on the confirmation step.

---

### User Story 2 - The parent can go back and change an answer (Priority: P2)

Partway through the questions the parent realizes an earlier answer was wrong — they picked the wrong crossing, or misread what was broken. They step back one question, change the answer, and continue, without re-entering everything they already told the tool.

**Why this priority**: Correcting a mistake currently costs the parent the entire conversation. That is a strong incentive to abandon the tool, and a wrong uncorrected answer routes the parent to the wrong first contact — the outcome the tool exists to prevent.

**Independent Test**: Answer all questions with one deliberate mistake, use back navigation to correct it, and confirm the recommendation and the visible answer record both reflect the corrected answer.

**Acceptance Scenarios**:

1. **Given** the parent is on any question after the first, **When** they look at the question, **Then** a back control is available that returns to the immediately preceding question.
2. **Given** the parent goes back to a previously answered question, **When** that question is displayed, **Then** the answer they previously gave is shown as their current answer.
3. **Given** the parent changes an earlier answer, **When** they move forward, **Then** answers already given to later questions are retained and do not have to be re-entered, and the visible answer record shows the corrected answer.
4. **Given** the parent is on the confirmation step, **When** they choose to change something, **Then** they can return to the last question with all earlier answers intact.
5. **Given** the parent is on the first question, **When** the question is displayed, **Then** no enabled back control is offered.
6. **Given** a recommendation is already displayed, **When** the parent goes back to change an answer, **Then** the stale recommendation is withdrawn from view until they confirm again.
7. **Given** the parent uses back navigation, **When** they do so, **Then** the whole conversation is never discarded; only the separate "start over" control does that, and it is visually distinct from back.

---

### User Story 3 - A resident can walk through the text-message path (Priority: P3)

A resident standing at a dark crossing sees a sign on the pole with a word and a short code. They text the word, get an acknowledgement back, answer a few short questions by text to pinpoint which light it is, and receive a reply naming the department to contact first and a number they can tap to dial. The tool demonstrates this whole exchange as a **simulated** message thread inside the page — nothing is sent, no number is live, no phone number is collected.

**Why this priority**: This is the strongest expression of the product's premise — a resident should not have to know which of three agencies owns a pole. It is also the most persuasive thing to show a judge, and it sidesteps the confirmation-button problem in Story 1 entirely by never presenting a form. It ranks below P1 and P2 because it is an additional entry path, not a repair of the existing one, and because the existing path must work regardless.

**Independent Test**: From a cold page load, complete the simulated text exchange end to end and arrive at a named first contact with a dialable number, with the synthetic and not-a-live-number labeling visible throughout.

**Acceptance Scenarios**:

1. **Given** the resident opens the text path, **When** the message thread is displayed, **Then** a persistent, unmissable label states that this is a prototype, that the short code is not a live phone number, and that no message is actually sent.
2. **Given** the resident is at the start of the thread, **When** they send the trigger word to the short code, **Then** an acknowledgement reply appears and the exchange advances to the pinpointing questions.
3. **Given** the resident is answering pinpointing questions, **When** they supply the nearest school, the cross streets, and what is wrong, **Then** the exchange identifies a single crossing from the known catalog.
4. **Given** the exchange has identified a crossing, **When** the routed reply arrives, **Then** it names the recommended **first contact pending human confirmation** — never a legal owner — and presents a number the resident may choose to dial.
5. **Given** the routed reply is displayed, **When** the resident wants the reasoning, **Then** the full evidence for that case is reachable: all three jurisdictional roles, why each holds its role, source links, the date sources were verified, and the specific overlap or gap.
6. **Given** the resident's description does not confidently match a known crossing, **When** the exchange reaches the routing step, **Then** it returns the existing "no confident match" outcome rather than guessing an agency.
7. **Given** a presenter needs to demonstrate quickly, **When** they use the presenter shortcut, **Then** they jump directly to a resolved case without stepping through the exchange, and the shortcut is visually distinct from the resident-facing path.
8. **Given** the resident is partway through the thread, **When** they restart the exchange, **Then** it returns to the first message without a page reload, and progress through the exchange is visible at every step.
9. **Given** the resident completes the text path, **When** they compare it to the five-question path with equivalent answers, **Then** both produce the same recommended first contact and the same evidence.
10. **Given** any screen in the text path, **When** its content is inspected, **Then** every location, school, community, agency, contact name, and phone number shown is fictional and carries the synthetic label.

---

### User Story 4 - The tool actually hears the parent, and says how to talk to it (Priority: P4)

A parent with a phone in one hand at a crossing turns voice on and answers out loud. The tool tells them when to speak, shows them it is listening, accepts spoken answers to every question — including the multiple-choice ones — and tells them what it heard when it cannot match an answer.

**Why this priority**: Voice is currently advertised by a visible control but does not work for the parent in the way the control implies, which is worse than not offering it. It is a high-visibility failure in a live demo. It ranks below P1–P3 because two working text paths to a recommendation exist without it.

**Independent Test**: Turn voice on, complete the entire conversation by speaking only, and reach a recommendation without touching the keyboard or screen.

**Acceptance Scenarios**:

1. **Given** voice is on, **When** any question is displayed — including a multiple-choice question — **Then** the parent can answer it by speaking.
2. **Given** voice is on and a multiple-choice question is displayed, **When** the parent speaks words matching one of the offered choices, **Then** that choice is selected and the conversation advances.
3. **Given** voice is on, **When** the parent speaks "back", "repeat that", or "start over", **Then** the tool performs the corresponding navigation action.
4. **Given** voice is on, **When** the parent looks at the screen at any moment, **Then** they can see whether the tool is speaking, listening, working on what it heard, or idle.
5. **Given** voice is on, **When** the tool finishes speaking a prompt, **Then** it begins listening on its own, without the parent re-activating anything, and it is not listening while it is speaking.
6. **Given** voice is on and the parent speaks something the tool cannot match to an answer, **When** listening ends, **Then** the tool reports what it heard, or that it heard nothing, and offers to listen again — it never fails silently.
7. **Given** voice is offered, **When** the parent turns it on for the first time, **Then** a short, plainly worded instruction states when to speak and which spoken commands work.
8. **Given** microphone access is denied, unavailable, or unsupported by the browser, **When** the parent turns voice on, **Then** a plain-language explanation of what happened and what to do appears, and the typed path continues to work unchanged.

---

### User Story 5 - The spoken prompts sound like a person, not a machine (Priority: P5)

The tool reads each question aloud in the most natural-sounding voice the parent's device offers, at a pace a first-time listener can follow, and reads only what is useful to hear.

**Why this priority**: This is quality of an existing capability rather than a broken path. It carries real demo weight and low risk, but a parent who cannot be heard (P4) is worse off than one hearing a plain voice. This is the first safe cut under time pressure.

**Independent Test**: Turn voice on and listen through the whole conversation; every prompt is intelligible on first hearing, and no interface boilerplate is read aloud.

**Acceptance Scenarios**:

1. **Given** voice is on and more than one English voice is available on the device, **When** a prompt is spoken, **Then** the most natural-sounding available voice is used automatically without the parent configuring anything.
2. **Given** voice is on, **When** a question is spoken, **Then** only the question, its available choices, and short guidance are read — not disclaimers, headings, or other page furniture.
3. **Given** the parent did not catch a spoken prompt, **When** they ask for it again by voice or by an on-screen control, **Then** the current question is spoken again from the beginning.
4. **Given** more than one voice is available, **When** the parent wants a different one, **Then** they can select it, and the selection holds for the rest of the session.
5. **Given** the device offers no natural-sounding voice, **When** prompts are spoken, **Then** the best available voice is used and the flow is unaffected.

---

### Edge Cases

**Navigation and correction**

- **The parent goes back while the tool is listening or speaking.** Speech stops immediately, listening restarts on the newly displayed question, and no answer is recorded against the wrong question.
- **The parent goes back past a free-text answer they typed.** The typed text is still present in the field when the question is re-displayed.
- **The parent changes an earlier answer and the corrected answers no longer match any known case.** The conversation still completes and the existing "no confident match" outcome is reached — back navigation never produces an invented result.
- **The parent presses back repeatedly from the first question.** Nothing happens; the conversation is never emptied by back navigation.
- **The parent reloads the page mid-conversation.** Answers are gone by design; the conversation restarts from the first message or question.

**Text path**

- **The resident sends something other than the trigger word.** The exchange replies with what to send instead, rather than stalling or treating the stray message as an answer.
- **The described crossing is not in the catalog.** The exchange declines to name an agency and returns the existing "no confident match" outcome with the list of crossings it does know.
- **The resident's answer matches more than one crossing** (two crossings near the same school). The exchange asks which one rather than choosing.
- **A viewer mistakes the short code for a live number and texts it from a real phone.** The labeling must make this implausible; the short code shown is fictional and cannot correspond to a working service.
- **The resident types a real address, a name, or a real phone number into the thread.** Treated exactly as free text elsewhere in the tool — not stored, not transmitted, and the standing privacy notice applies.
- **The presenter shortcut is used mid-exchange.** The in-progress thread is cleared first, so no answers from the abandoned exchange leak into the shown case.
- **Both the text path and the question path are open at once.** Only one conversation is active; entering one makes the other's state inert rather than merging answers.
- **The parent uses voice while the text thread is active.** Spoken input goes to the active conversation only, and is never recorded against both.

**Voice**

- **The parent turns voice on mid-conversation.** Listening starts at the current question; nothing already answered is re-asked or lost.
- **A spoken phrase matches more than one choice** (a description containing both "signal" and "beacon"). The tool does not guess; it asks the parent to choose between the matching options.
- **Background noise or a partial phrase is recognized as gibberish.** Treated the same as an unmatched answer: reported back, listened for again, never recorded as an answer.
- **The parent speaks a personal identifier out loud.** Spoken input is treated exactly as typed input and is bound by the same privacy rule; nothing is recorded or retained.
- **The browser supports speaking but not listening, or vice versa.** Only the supported half is offered, and the tool says which half is available rather than showing a control that does nothing.

## Requirements *(mandatory)*

### Functional Requirements

**Confirmation step clarity (Story 1)**

- **FR-001**: The confirmation step MUST present exactly one primary action, visually dominant over every other control on the screen, and distinguishable from the secondary action by appearance alone.
- **FR-002**: The primary confirming action MUST be visible without scrolling at 375px width and at desktop widths when the confirmation step first appears; where content length prevents this, a persistent on-screen cue MUST indicate the action's location.
- **FR-003**: The confirmation step MUST state, in the parent's own terms, that the action reveals the recommended first contact and that nothing is submitted to any agency.
- **FR-004**: The primary confirming action MUST receive keyboard focus when the confirmation step is displayed and MUST show a visible focus indicator.
- **FR-005**: The summary of answers on the confirmation step MUST be visually separated from the actions, so the actions do not read as part of the summary.
- **FR-006**: On confirmation, the parent's attention MUST be moved to the recommendation, including for users of assistive technology.

**Back navigation (Story 2)**

- **FR-007**: Every question after the first MUST offer a back control returning to the immediately preceding question.
- **FR-008**: A question re-displayed via back navigation MUST show the parent's previous answer as their current answer, including previously typed free text.
- **FR-009**: Changing an earlier answer MUST preserve answers already given to later questions; the parent MUST NOT be required to re-enter them.
- **FR-010**: The visible answer record and the confirmation summary MUST always reflect the parent's current answers, including corrections.
- **FR-011**: The confirmation step MUST offer a return to the last question that preserves all earlier answers.
- **FR-012**: Back navigation MUST NOT clear the conversation. A separate, visually distinct "start over" control MUST remain the only control that discards all answers.
- **FR-013**: The first question MUST NOT present an enabled back control.
- **FR-014**: Back navigation MUST withdraw any displayed recommendation from view until the parent confirms again.
- **FR-015**: Back navigation MUST be operable by keyboard, by pointer, and by voice, with a visible focus indicator.

**Text-first path (Story 3)**

- **FR-016**: The tool MUST offer a text-message conversation as an entry path, presented as a phone message thread within the page, in addition to the existing question path.
- **FR-017**: The text path MUST be a **simulation**. It MUST NOT send a message, MUST NOT connect to any messaging or telephony service, and MUST NOT introduce outbound network activity. *(Constitution II)*
- **FR-018**: A persistent, unmissable label MUST state on every screen of the text path that this is a prototype, that the short code shown is not a live phone number, and that nothing is actually sent. *(Constitution I, II)*
- **FR-019**: The short code and trigger word MUST be fictional and MUST NOT correspond to any working service.
- **FR-020**: The text path MUST present four visible stages: the resident sends the trigger word; an acknowledgement reply arrives; a short set of questions pinpoints the crossing; a routed reply names the department and a number. Progress through the stages MUST be visible.
- **FR-021**: The pinpointing questions MUST identify the crossing well enough that the match is gated on location, consistent with the existing routing rule that equipment or context alone can never produce a match.
- **FR-022**: Every location, school, community, agency, contact name, and phone number shown anywhere in the text path — including the knowledge-base table — MUST be fictional and MUST carry the synthetic label. Real school names, real community names, and real agency names MUST NOT appear. *(Constitution I, NON-NEGOTIABLE)*
- **FR-023**: The text path MUST NOT present, label, or imply legal ownership of any asset. The routed result and any knowledge-base display MUST name the agency as the **recommended first contact pending human confirmation**, with the reason and the confirmation step visible. Any column, heading, or copy asserting an "owner" or "legal owner" is prohibited. *(Constitution III, NON-NEGOTIABLE; Constitution IV)*
- **FR-024**: The full evidence for a routed case MUST be reachable from the text result: all three jurisdictional roles, why each holds its role, authoritative source links, the date sources were verified, and the specific overlap, conflict, or gap. *(Constitution V)*
- **FR-025**: A contact number MUST be presented as something a person chooses to dial. The tool MUST NEVER place a call, including 911. *(Constitution II)*
- **FR-026**: Any statement about signage at crossings, short-code deployment, agency participation, or data syncing from municipal systems MUST be framed explicitly as a proposal or future state, never as an existing arrangement or an agency agreement. *(Constitution V)*
- **FR-027**: A presenter shortcut MUST allow jumping directly to a resolved case without stepping through the exchange, and MUST be visually distinct from the resident-facing path so a viewer cannot mistake it for the resident experience.
- **FR-028**: The text path MUST be restartable without a page reload, returning to the first message with no prior answers retained.
- **FR-029**: The text path MUST NOT ask for, accept by design, or store a phone number or any other personal identifier. *(Privacy Constraints)*
- **FR-030**: The text path and the question path MUST reach the same routing logic and produce the same recommended first contact and the same evidence for equivalent input.
- **FR-031**: When the description does not confidently match a known crossing, the text path MUST return the existing "no confident match" outcome and MUST NOT name an agency. *(Constitution III)*
- **FR-032**: Only one conversation MUST be active at a time. Entering one path MUST NOT merge its answers with the other's.

**Voice input (Story 4)**

- **FR-033**: Voice input MUST be available on every question in the active conversation, including multiple-choice questions and the confirmation step — not only on free-text entry.
- **FR-034**: A spoken phrase that clearly matches one of the presented choices MUST select that choice and advance the conversation; a phrase matching more than one choice MUST produce a request to choose rather than a guess.
- **FR-035**: The tool MUST recognize spoken navigation commands for at least: repeat the question, go back, start over, and confirm.
- **FR-036**: The tool MUST display, at all times while voice is on, which state it is in: speaking, listening, interpreting, or idle.
- **FR-037**: While voice is on, listening MUST resume automatically for each new question after the prompt finishes being spoken, without the parent re-activating voice.
- **FR-038**: The tool MUST NOT listen while it is speaking a prompt.
- **FR-039**: When listening ends without a usable answer, the tool MUST report what it heard, or that it heard nothing, and offer another attempt. Silent failure is prohibited.
- **FR-040**: The tool MUST present short, plainly worded instructions for how to talk to it — when to speak and which commands work — visible at the point voice is turned on and reachable thereafter.
- **FR-041**: When microphone access is denied, unavailable, or unsupported, the tool MUST show a plain-language explanation and what the parent can do, and MUST keep the typed path fully functional.
- **FR-042**: Turning voice on mid-conversation MUST NOT discard, repeat, or alter any answer already given.

**Voice output quality (Story 5)**

- **FR-043**: When more than one English voice is available on the device, the tool MUST automatically select the most natural-sounding one, without configuration by the parent.
- **FR-044**: Spoken prompts MUST be delivered at a pace and clarity a first-time listener can follow, and MUST be interruptible.
- **FR-045**: Spoken output MUST be limited to the question, its available choices, and short guidance. Disclaimers, headings, and other page furniture MUST NOT be read aloud.
- **FR-046**: The parent MUST be able to have the current question spoken again, by voice command and by an on-screen control.
- **FR-047**: Where multiple voices are available, the parent MUST be able to choose a different one, and that choice MUST hold for the remainder of the session.
- **FR-048**: When no natural-sounding voice exists on the device, the tool MUST fall back to the best available voice without degrading or blocking the conversation.

**Governing constraints (apply across all stories)**

- **FR-049**: Voice MUST remain an optional enhancement. Every capability reachable by voice MUST have an equivalent visible control, and a parent MUST be able to reach a recommendation without ever enabling voice. *(Constitution VII)*
- **FR-050**: Speech recognition and speech output MUST occur entirely within the parent's browser. No audio MUST be recorded, retained, or transmitted, and this feature MUST introduce no new outbound network activity of any kind. *(Constitution II, Privacy Constraints)*
- **FR-051**: Spoken and texted input MUST be treated as ordinary text input and MUST be bound by the same privacy rule as typed input; the tool MUST NOT ask for or store personal identifiers however they arrive. *(Privacy Constraints)*
- **FR-052**: This feature MUST NOT change which agency is recommended, the evidence shown, the human-confirmation requirement, or the synthetic-data notices for any existing case. It adds an entry path and repairs navigation, presentation, and voice. *(Constitution I, III, IV, V)*
- **FR-053**: All new behavior MUST work in the static build with no server present, and MUST remain keyboard-operable with visible focus states at 375px and desktop widths. *(Constitution VI, VII)*

### Key Entities

- **Conversation position**: Where the parent currently is in the sequence of questions or messages. Distinct from how many have been answered, so that going back does not erase answers.
- **Answer record**: The parent's current answer to each question, revisable in place. Holds no personal identifiers, exists only for the life of the browser tab, and is what the visible answer record and confirmation summary are drawn from.
- **Crossing catalog entry**: One known synthetic crossing — its fictional community, fictional nearest school, fictional intersection, the agency recommended as first contact, why that agency holds that role, and a fictional contact number. Carries the synthetic marker. Never carries an ownership assertion.
- **Message thread**: The simulated exchange for the text path — an ordered list of messages attributed to the resident or the service, plus which of the four stages is current. Session-only, cleared on restart.
- **Voice state**: Whether voice is enabled, which of speaking / listening / interpreting / idle the tool is currently in, and the parent's selected voice for the session. Never persisted beyond the session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In unassisted first-time walkthroughs, 9 out of 10 parents reach the recommendation from the confirmation step without hesitating, asking what to do next, or needing a prompt.
- **SC-002**: Time from the last answered question to a displayed recommendation is under 10 seconds for a first-time user, measured from the confirmation step appearing.
- **SC-003**: A parent who realizes a mistake can correct any single earlier answer and reach a recommendation in under 30 seconds, without re-entering any other answer.
- **SC-004**: 100% of corrections made through back navigation are reflected in the visible answer record, the confirmation summary, and the resulting recommendation.
- **SC-005**: A first-time viewer completes the simulated text exchange end to end and reaches a named first contact in under 90 seconds, without instruction.
- **SC-006**: A presenter reaches a fully resolved case from a cold page load in under 10 seconds and no more than two interactions.
- **SC-007**: 100% of names, locations, schools, communities, agencies, and phone numbers appearing in the text path are fictional and labeled synthetic; zero real school, community, or agency names appear anywhere in the shipped artifact.
- **SC-008**: Zero screens anywhere in the artifact state or imply legal ownership of an asset; 100% of routed results present a first contact pending human confirmation and name the confirmation step.
- **SC-009**: Zero messages are sent, zero calls are placed, and zero phone numbers are collected by the text path.
- **SC-010**: A parent can complete a conversation and reach a recommendation using speech alone, with no keyboard or screen touches after voice is turned on.
- **SC-011**: When voice is on, the parent can identify from the screen whether the tool is listening within 1 second of looking, at every point in the conversation.
- **SC-012**: 100% of unrecognized or unmatched spoken input results in visible or audible feedback within 3 seconds; zero instances of silent non-response.
- **SC-013**: First-time listeners understand each spoken prompt on first hearing without asking for a repeat, in 9 out of 10 prompts.
- **SC-014**: Every path to a recommendation remains finishable by keyboard alone and by pointer alone, at 375px and desktop widths, with voice never enabled.
- **SC-015**: For identical input, the text path and the question path return the same recommended first contact and the same evidence, in 100% of catalog cases.
- **SC-016**: No audio and no new data of any kind leaves the parent's device as a result of this feature, and every path completes with the tool disconnected from any server.

## Assumptions

### About the text path

- **The prototype is a simulated text exchange, not real SMS.** The supplied design carries a "not a live phone number" badge, a send button inside a phone mockup, a restart control, and a step counter — it demonstrates what texting the service would feel like. Real SMS would require a telephony provider, an always-on public webhook, and handling real phone numbers, breaking Constitution II, Constitution VI, and the privacy constraints simultaneously. Simulation is therefore the specified feature; real SMS is out of scope and would require a constitutional amendment.
- **The sample data in the supplied design must be replaced with fictional equivalents before it ships.** The mockup names real Birmingham-area schools, communities, and a real state transportation agency, alongside real intersections. Principle I is non-negotiable and admits no exception for illustrative data, so FR-022 requires fictional stand-ins throughout, matching the pattern already used in the existing catalog ("Fictional Lincoln Heights Elementary", "Fictional State Route 42").
- **The design's "owner" framing must be replaced with first-contact framing.** The mockup's knowledge-base table heads a column `OWNER` and its copy reads "cross-referenced to its legal owner". Principle III forbids stating a definitive legal owner. FR-023 requires the same information presented as a recommended first contact pending human confirmation, which is the language the existing catalog already uses.
- **The existing five-question path remains the default landing experience; the text path is a clearly-labeled parallel entry offered alongside it.** Two reasons: the P1 and P2 repairs in this spec are on the existing path and must be exercised, and a simulation presented as the default risks a viewer mistaking it for a live service. This is a reversible presentation decision, not a structural one.
- **The catalog grows to cover the crossings the text path demonstrates.** The current catalog holds two synthetic cases; the text path's presenter shortcut implies several. New entries are synthetic and follow the existing case shape.
- **"Syncing from municipal GIS/asset systems" is aspirational framing only.** Nothing syncs, nothing is fetched, and the copy must say so — this is exactly the kind of statement Principle V requires be kept clear of implying agency participation.

### About voice

- **"Better sounding voice" is scoped to the best voice already on the device**, not a cloud speech service. Constitution II limits outbound network activity, and Constitution VI requires the static build to work with no key. Quality is improved by selecting the best natural voice the device offers and tuning delivery.
- **"It seems not to hear us" is a product defect, not user error.** Voice input was only ever wired to the single free-text question and never restarted afterward. The fix is making voice work on every question, showing listening state, and stating plainly how to use it.

### General

- **Going back preserves later answers rather than discarding them**, and **back moves one question at a time**. Jumping directly to an arbitrary earlier question is out of scope.
- **Conversation state stays in the browser tab and is lost on reload.** Existing intentional behavior; this feature adds no persistence.
- **English only, modern phone or desktop browser.** Browsers lacking speech capability get the full typed and texted paths.
- **The routing logic, the match-gating rule, and the recommendation output are unchanged.** This feature adds an entry path and repairs navigation, presentation, and voice.

## Out of Scope

- Real SMS, a live short code, any telephony provider, or any messaging service integration.
- Actually syncing from municipal GIS or asset-management systems.
- Collecting, storing, or transmitting a phone number or any other personal identifier.
- Placing calls, including tap-to-call that dials without the person choosing to.
- Changing the routing logic, the match-gating rule, or the content of a recommendation for an existing case.
- Cloud or server-side text-to-speech or speech recognition.
- Saving or resuming a conversation across page reloads or devices.
- Jumping directly to an arbitrary earlier question, or editing answers in place from the confirmation summary.
- Languages other than English.
- Any submission, referral, or outbound contact capability.
