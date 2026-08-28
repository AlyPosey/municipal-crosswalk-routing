/**
 * Optional local server for Jurisdiction Junction.
 *
 * Two jobs:
 *   1. Serve the same static files GitHub Pages serves.
 *   2. Offer POST /api/route, which asks Claude to SELECT a case_id from the synthetic catalog.
 *
 * The published static build does not need this process at all. Everything here is an enhancement.
 *
 * Constitution II  — the only outbound request this process makes is to the Anthropic API.
 *                    It never contacts an agency, never submits anything, never places a call.
 * Constitution III — the model is given a closed list and may return only a case_id from it or
 *                    "unresolved". Its answer is re-validated against the catalog before it is
 *                    returned, and it never supplies text that gets rendered.
 * Constitution VI  — the API key is read from .env into this process only. It is never written to a
 *                    response, a log line, or any file the browser can reach.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CASES, catalogForModel } from './data/cases.js';

const ROOT = fileURLToPath(new URL('.', import.meta.url));

/* ---------- minimal .env loader (no dependencies) ---------- */
function loadEnv() {
  const path = join(ROOT, '.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = value;
  }
}
loadEnv();

const PORT = Number(process.env.PORT) || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5';
const VALID_IDS = CASES.map((c) => c.case_id);

/* ---------- the constrained prompt ---------- */
const SYSTEM_PROMPT = `You are a routing classifier for a civic prototype about school-zone crosswalk outages in a fictional version of Greater Birmingham.

Your ONLY job is to decide which synthetic case a resident's description matches.

Rules you must follow exactly:
- Reply with a single JSON object and nothing else.
- Shape: {"case_id": "<one of ${VALID_IDS.join(' | ')} | unresolved>", "reason": "<one short sentence>"}
- You may ONLY use a case_id from the list provided in the user message. Never invent one.
- If the description does not clearly match one case, or matches two equally well, you MUST answer "unresolved". Guessing is a failure, not a fallback.
- Do not name any agency, office, phone number, or URL. You are not writing the answer the resident sees; you are only picking an index.
- Do not make any statement about who is legally responsible for anything.
- The strongest signals are: whether the road is a municipal street or a state-numbered route, and whether the broken equipment is a traffic/pedestrian signal or a flashing school-zone beacon.`;

/* ---------- static file serving ---------- */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};

async function serveStatic(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || rel === '') rel = '/index.html';

  // Contain everything under ROOT — no traversal out of the project directory.
  const full = normalize(join(ROOT, rel));
  if (!full.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const body = await readFile(full);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(full).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

/* ---------- routing endpoint ---------- */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 8_000) reject(new Error('payload too large'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const json = (res, code, payload) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

async function handleRoute(req, res) {
  if (!API_KEY) return json(res, 503, { case_id: 'unresolved', reason: 'no api key configured' });

  let input;
  try {
    input = JSON.parse(await readBody(req));
  } catch {
    return json(res, 400, { case_id: 'unresolved', reason: 'bad request body' });
  }

  // Only the three routing-relevant answers are forwarded. The danger flag stays in the browser —
  // it is handled by static guidance and is none of the model's business.
  const userMessage = [
    'Synthetic case catalog:',
    JSON.stringify(catalogForModel(), null, 2),
    '',
    "Resident's description:",
    `- Crossing: ${String(input.location || '').slice(0, 400)}`,
    `- What looks broken: ${String(input.equipment || '').slice(0, 200)}`,
    `- School zone: ${String(input.schoolZone || '').slice(0, 100)}`,
    '',
    'Which case_id is this? Reply with the JSON object only.',
  ].join('\n');

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 256,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!upstream.ok) {
      console.error(`[route] upstream ${upstream.status}`);   // status only — never the key
      return json(res, 502, { case_id: 'unresolved', reason: 'model unavailable' });
    }

    const data = await upstream.json();
    const text = (data.content || []).map((b) => b.text || '').join('').trim();
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : null;

    // Re-validate. Anything not in the catalog becomes "unresolved" (Constitution III).
    const caseId =
      parsed && typeof parsed.case_id === 'string' && VALID_IDS.includes(parsed.case_id)
        ? parsed.case_id
        : 'unresolved';

    console.info(`[route] -> ${caseId}`);
    return json(res, 200, { case_id: caseId });
  } catch (err) {
    console.error(`[route] ${err.message}`);
    return json(res, 502, { case_id: 'unresolved', reason: 'model call failed' });
  }
}

/* ---------- server ---------- */
createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;

  if (path === '/api/health') {
    // Reports only WHETHER a key is present. Never any part of the key itself.
    return json(res, 200, { ok: true, claude: Boolean(API_KEY), model: API_KEY ? MODEL : null });
  }

  if (path === '/api/route') {
    if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
    return handleRoute(req, res);
  }

  return serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`\n  Jurisdiction Junction  ->  http://localhost:${PORT}`);
  console.log(`  Routing mode: ${API_KEY ? `live Claude (${MODEL})` : 'simulated (no ANTHROPIC_API_KEY in .env)'}`);
  console.log('  Synthetic data only. This server submits nothing to any agency.\n');
});
