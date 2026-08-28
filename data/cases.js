/**
 * Synthetic case catalog — Birmingham Claude Impact Lab, Challenge 2.
 *
 * EVERY case, location, agency, and outcome below is FICTIONAL. Nothing here represents a real
 * resident, a real complaint, or a real agency determination. Seeded from
 * docs/school-zone-crosswalk-handoff.md and shaped to the official resource-pack field set
 * (case_id, service_type, synthetic_location, jurisdiction_a, jurisdiction_b, authoritative_source,
 * conflict_or_gap, recommended_handoff, requires_human_confirmation, is_synthetic).
 *
 * Constitution III — no invented ownership: this file is the ONLY source of agency names, roles,
 * evidence text, and links rendered anywhere in the UI. The language model may select a case_id
 * from this catalog or return "unresolved"; it can never contribute a rendered string.
 *
 * `evidence[].url` entries are REAL, public, organizational pages. They are cited as the real-world
 * pattern each fictional agency is modeled on, and as where a human would go to confirm ownership.
 * They are NOT evidence that any agency owns any specific asset, and no agency has reviewed,
 * approved, or endorsed any routing this tool produces.
 */

/** Date the reference sources were last verified, per the Challenge 2 resource pack. */
export const SOURCE_CHECKED = '2026-08-27';

/** Minimum keyword score before free text is considered a confident match. Below this: unresolved. */
export const MATCH_THRESHOLD = 2;

export const CASES = [
  {
    case_id: 'CASE-03',
    is_synthetic: true,
    service_type: 'School-zone crosswalk signal outage',
    synthetic_location:
      'Fictional intersection near Fictional Lincoln Heights Elementary (synthetic address)',
    road_context: 'Municipal street inside city limits',
    jurisdiction_a: 'Fictional City of Lincoln Heights — Traffic Engineering',
    jurisdiction_b: 'Fictional Regional School Transportation Authority',
    authoritative_source: 'Municipal public works / traffic engineering service pages',
    source_checked: SOURCE_CHECKED,

    match_keywords: [
      'lincoln', 'lincoln heights', 'elementary', 'city street', 'municipal', 'city',
      'intersection', 'crosswalk signal', 'walk signal', 'pedestrian signal', 'stoplight',
      'traffic light', 'signal out', 'case-03',
    ],
    equipment_hints: ['signal', 'pedestrian-button'],

    agencies: [
      {
        name: 'Fictional City of Lincoln Heights — Traffic Engineering',
        role: 'primary',
        role_label: 'Recommended first contact',
        why_this_role:
          'Traffic signals on municipal streets are normally installed and maintained by the city traffic engineering function, and this crossing sits on a city street. This is a working hypothesis based on how the function is typically organized — not a confirmed ownership record.',
        caveat:
          'The public pages do not state where city responsibility ends and the school transportation authority begins. Ask them to confirm the asset is on their maintenance list.',
        evidence: [
          {
            label: 'City of Birmingham — municipal services and departments (real-world pattern)',
            url: 'https://www.birminghamal.gov/',
          },
          {
            label: 'Jefferson County local government directory (real-world pattern)',
            url: 'https://www.jccal.org/',
          },
        ],
      },
      {
        name: 'Fictional Regional School Transportation Authority',
        role: 'stakeholder',
        role_label: 'Stakeholder — holds history, not the hardware',
        why_this_role:
          'The school transportation authority requested the signal and holds the complaint and incident history for the crossing. It is a useful second call for context. It does NOT own or maintain the equipment.',
        caveat:
          'Do not treat this office as the fix-it owner. Routing a maintenance request here is the most common wrong turn in this scenario.',
        evidence: [
          {
            label: 'Regional Planning Commission of Greater Birmingham (real-world pattern)',
            url: 'https://www.rpcgb.org/',
          },
        ],
      },
      {
        name: 'Fictional ALDOT District Traffic Office',
        role: 'not-applicable',
        role_label: 'Not indicated for this crossing',
        why_this_role:
          'State transportation maintains signals on state-numbered routes. This crossing is described as a municipal street, so the state district office is shown here for contrast rather than as a contact.',
        caveat:
          'If it turns out the road carries a state route number, this case is the wrong one — the state office would move to first contact.',
        evidence: [
          {
            label: 'Alabama Department of Transportation (real-world pattern)',
            url: 'https://www.dot.state.al.us/',
          },
        ],
      },
    ],

    conflict_or_gap:
      'Signal ownership is genuinely unclear between city traffic engineering and the regional school transportation authority. Both have a plausible claim to "who should fix this," and neither public page states the boundary. A resident cannot resolve this from published information alone.',
    stale_or_conflicting:
      'Municipal service pages describe organizational structure, not live case status. A page can be current and still not tell you whether this specific signal is on a maintenance list.',

    recommended_handoff:
      'Fictional City of Lincoln Heights — Traffic Engineering (recommended first contact, pending human confirmation)',
    next_action:
      'Call the city traffic engineering office and ask them to confirm whether this signal is on their maintenance list. If they say it is not theirs, ask them who holds it, then call the Regional School Transportation Authority to check whether a request was already filed for this crossing.',
    call_script:
      'Hello — I want to report a school-zone crosswalk signal that is not working, near a fictional elementary school crossing. I am not sure which office owns this signal. Can you confirm whether this crossing is on your maintenance list, or whether it falls under the Regional School Transportation Authority? If it is not yours, who should I call next?',

    requires_human_confirmation: true,
    confirmation_reason:
      'The ownership boundary is not resolvable from public pages alone. A person at the agency has to confirm it.',
  },

  {
    case_id: 'CASE-03B',
    is_synthetic: true,
    service_type: 'School-zone flashing beacon malfunction',
    synthetic_location:
      'Fictional crossing on Fictional State Route 42, adjacent to Fictional Maple Ridge Middle School (synthetic address)',
    road_context: 'State-numbered route passing through a municipality',
    jurisdiction_a: 'Fictional ALDOT District Traffic Office',
    jurisdiction_b: 'Fictional City of Maple Ridge — Traffic Engineering',
    authoritative_source: 'State transportation district pages and municipal traffic engineering pages',
    source_checked: SOURCE_CHECKED,

    match_keywords: [
      'state route', 'route 42', 'sr 42', 'highway', 'state road', 'maple ridge', 'middle school',
      'beacon', 'flashing beacon', 'flashing light', 'school zone beacon', 'aldot', 'state',
      'case-03b',
    ],
    equipment_hints: ['beacon'],

    agencies: [
      {
        name: 'Fictional ALDOT District Traffic Office',
        role: 'primary',
        role_label: 'Recommended first contact',
        why_this_role:
          'Traffic control devices on state-numbered routes generally fall under state maintenance, and this crossing is described as being on a state route. This is a working hypothesis from how state routes are typically administered — not a confirmed maintenance record for this specific beacon.',
        caveat:
          'The state district page does not publish permit records for locally installed school-zone equipment, so it may not show this beacon at all.',
        evidence: [
          {
            label: 'Alabama Department of Transportation (real-world pattern)',
            url: 'https://www.dot.state.al.us/',
          },
          {
            label: 'Census TIGERweb — road classification reference (context only, not responsibility)',
            url: 'https://tigerweb.geo.census.gov/tigerweb/',
          },
        ],
      },
      {
        name: 'Fictional City of Maple Ridge — Traffic Engineering',
        role: 'secondary',
        role_label: 'Escalation path — may have installed it under permit',
        why_this_role:
          'School-zone beacons on state routes are often installed by the municipality under a state permit. If the beacon was installed that way, the city may be the maintaining party even though the road is state-numbered.',
        caveat:
          'The city page describes its own traffic engineering scope but does not clarify state-route exceptions. Permit records are not published anywhere a resident can check.',
        evidence: [
          {
            label: 'City of Birmingham — municipal services and departments (real-world pattern)',
            url: 'https://www.birminghamal.gov/',
          },
        ],
      },
      {
        name: 'Fictional Regional School Transportation Authority',
        role: 'stakeholder',
        role_label: 'Stakeholder — holds history, not the hardware',
        why_this_role:
          'The school transportation authority requested the beacon and holds the incident and complaint history for the crossing. Useful for establishing that this has been reported before.',
        caveat: 'Does not own or maintain the equipment. Not a fix-it contact.',
        evidence: [
          {
            label: 'Regional Planning Commission of Greater Birmingham (real-world pattern)',
            url: 'https://www.rpcgb.org/',
          },
        ],
      },
    ],

    conflict_or_gap:
      '"Who installed it" and "who maintains it" may be two different answers. The beacon may have been installed by the municipality under a state permit, and that split is not published anywhere a resident or a frontline staffer can check directly.',
    stale_or_conflicting:
      'Permit records are not publicly posted, so the most decisive piece of evidence in this case is simply unavailable. Treat any single page as incomplete rather than authoritative on ownership.',

    recommended_handoff:
      'Fictional ALDOT District Traffic Office (recommended first contact, pending human confirmation)',
    next_action:
      'Call the state district traffic office first, because the road carries a state route number. Ask specifically whether this beacon is state-maintained or was installed under a municipal permit. If they confirm a city permit, escalate to Fictional City of Maple Ridge Traffic Engineering.',
    call_script:
      'Hello — I want to report a malfunctioning school-zone flashing beacon on a state route near a fictional middle school crossing. Can you confirm whether this beacon is state-maintained, or whether it was installed by the city under a state permit? If it was installed under a permit, who maintains it now, and who should I contact?',

    requires_human_confirmation: true,
    confirmation_reason:
      'State-route cases involve an unpublished install-versus-maintain split. Always confirm with a person before assuming ownership.',
  },
];

/** Compact catalog handed to the language model. Deliberately excludes all rendered prose. */
export function catalogForModel() {
  return CASES.map((c) => ({
    case_id: c.case_id,
    service_type: c.service_type,
    synthetic_location: c.synthetic_location,
    road_context: c.road_context,
    match_keywords: c.match_keywords,
  }));
}

export function getCase(caseId) {
  return CASES.find((c) => c.case_id === caseId) || null;
}
