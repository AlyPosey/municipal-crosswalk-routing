# Contract: `lib/routing.js` — the shared match engine

**Consumers**: `app.js` (question path), `lib/textThread.js` (text path), `tests/routing.test.mjs`,
`tests/thread.test.mjs`.

This module is extracted from the existing `matchCase()` in `app.js`. **Its behaviour must not
change** (FR-052): the same input that produces `CASE-03` today must produce `CASE-03` after the
extraction, and the existing assertions in `tests/routing.test.mjs` are the fence that proves it.

## Exports

```js
matchCase(answers) -> { case_id: string | null, score: number }
```

**Parameters**

| Field of `answers` | Type | Used how |
|---|---|---|
| `location` | string | Scored alone; this score is the gate. |
| `equipment` | string | Scored as context only. |
| `schoolZone` | string | Scored as context only. |

`answers.danger` is not read — it affects presentation, never routing.

**Returns**: `case_id` is either an id present in `CASES` or `null`. It is **never** a
model-generated string, never a constructed identifier, and never an agency name.

## Invariants (Constitution III)

1. **Location gates.** If the location score is below `MATCH_THRESHOLD`, the result is
   `{ case_id: null, score: 0 }`, no matter how strongly equipment or school-zone context scores.
   Equipment or context alone can never produce a match.
2. **Ties decline.** If the top two total scores are equal, the result is `{ case_id: null }`. A
   description that does not distinguish two cases is not resolved by guessing.
3. **Pure.** No module-level mutable state is read or written; no I/O; no DOM; no network. Calling it
   twice with equal input returns equal output.
4. **Catalog-bounded.** Any returned `case_id` satisfies `getCase(case_id) !== null`.

## Live-model interaction (unchanged)

`app.js` may still call `POST /api/route` when the proxy is reachable. The response is honoured only
if `data.case_id` is a string present in the local catalog; otherwise it is discarded and
`matchCase()` runs as the deterministic floor. `lib/routing.js` itself performs no network access —
the fetch stays in `app.js`, so the static build and the text path are unaffected.

## Test obligations

- Every existing assertion in `tests/routing.test.mjs` passes unchanged after extraction.
- Context-only input (equipment and school zone answered, location empty or unrelated) returns
  `case_id: null`.
- Input matching both cases equally returns `case_id: null`.
- After the catalog grows to four cases, all of the above still hold for `CASE-03` and `CASE-03B`
  (FR-052, research R5).
