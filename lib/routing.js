/**
 * lib/routing.js — the shared match engine.
 *
 * Pure function of an answer record. Both the question path (app.js) and the text path
 * (lib/textThread.js) call this so there is exactly one routing rule, never two to keep in sync
 * (FR-030, SC-015). Extracted verbatim in behaviour from the former matchCase() in app.js.
 *
 * Constitution III (no invented ownership) is enforced structurally here: this function may only
 * ever return a case_id that exists in the local catalog, or null. It never constructs, guesses, or
 * derives a new identifier.
 */

import { CASES, getCase, MATCH_THRESHOLD } from '../data/cases.js';

/**
 * Score the parent's answers against each case's keywords.
 *
 * Location is scored separately and is the gate. Equipment and school-zone answers can only break a
 * tie or widen a lead — they can never, on their own, produce a match. Without that split, a
 * description like "the light by the Walmart" would score on the word "signal" from the equipment
 * question and get routed to a city we have no reason to think is involved, which is precisely the
 * failure Constitution III forbids.
 *
 * Returns { case_id, score }, with case_id null when nothing clears MATCH_THRESHOLD on location.
 */
export function matchCase(answers) {
  const place = String(answers.location).toLowerCase();
  const context = `${answers.equipment} ${answers.schoolZone}`.toLowerCase();

  const score = (text, c) => {
    let n = 0;
    for (const kw of c.match_keywords) {
      if (text.includes(kw.toLowerCase())) n += kw.includes(' ') ? 2 : 1;
    }
    return n;
  };

  const scored = CASES.map((c) => {
    const locationScore = score(place, c);
    let contextScore = score(context, c);
    // Equipment type is a strong secondary signal: a beacon points at the state-route case.
    for (const hint of c.equipment_hints || []) {
      if (context.includes(hint)) contextScore += 2;
    }
    return { case_id: c.case_id, locationScore, score: locationScore + contextScore };
  }).sort((a, b) => b.score - a.score);

  const [best, runnerUp] = scored;

  // Gate: the location must identify the case. Context alone is never enough.
  if (!best || best.locationScore < MATCH_THRESHOLD) return { case_id: null, score: 0 };

  // A tie means the description genuinely does not distinguish the cases — do not guess.
  if (runnerUp && best.score === runnerUp.score) return { case_id: null, score: best.score };

  return best;
}

export { getCase };
