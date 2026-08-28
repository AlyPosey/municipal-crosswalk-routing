// End-to-end DOM test: loads the real index.html, runs the real app.js, clicks through the flow.
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

let failures = 0;

function check(name, cond, detail = '') {
  if (!cond) failures++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : `   <-- ${detail}`}`);
}

async function run(scenario, { locationLabel, equipmentLabel, dangerLabel, freeText }) {
  console.log(`\n──────── ${scenario} ────────`);

  const dom = new JSDOM(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), { url: 'http://localhost/' });
  const { window } = dom;
  window.Element.prototype.scrollIntoView = () => {};
  globalThis.window = window;
  globalThis.document = window.document;
  Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });
  // No server in this harness: every probe fails, which is exactly the GitHub Pages condition.
  globalThis.fetch = () => Promise.reject(new Error('no server'));

  await import(`../app.js?v=${Math.random()}`);
  await new Promise((r) => setTimeout(r, 30));   // let probeMode settle

  const doc = window.document;
  const controls = () => doc.getElementById('step-controls');
  const clickByText = (text) => {
    const b = [...controls().querySelectorAll('button')].find((x) => x.textContent.includes(text));
    if (!b) throw new Error(`no button matching "${text}" in: ${[...controls().querySelectorAll('button')].map((x) => x.textContent).join(' | ')}`);
    b.click();
  };

  check('mode banner says simulated with no server',
    doc.getElementById('mode-text').textContent.includes('Simulated routing'),
    doc.getElementById('mode-text').textContent);

  // Q1 location
  if (freeText) {
    const input = doc.getElementById('free-text');
    input.value = freeText;
    clickByText('Continue');
  } else {
    clickByText(locationLabel);
  }
  // Q2 equipment, Q3 school zone, Q4 danger
  clickByText(equipmentLabel);
  clickByText('Yes');
  clickByText(dangerLabel);

  // Confirmation gate
  const resultPanel = doc.getElementById('result-panel');
  check('result hidden before confirmation', resultPanel.hidden === true);
  check('summary step asks for confirmation',
    doc.getElementById('step-question').textContent.includes('Does this look right'));

  clickByText('Yes — show me who to contact first');
  await new Promise((r) => setTimeout(r, 30));

  check('result shown after confirmation', resultPanel.hidden === false);
  return doc.getElementById('result').innerHTML;
}

/* ---------- User Story 1: municipal street ---------- */
let html = await run('US1 — municipal signal outage, no danger', {
  locationLabel: 'Lincoln Heights Elementary',
  equipmentLabel: 'Traffic or walk signal',
  dangerLabel: 'No — nobody is in danger',
});
check('recommends city traffic engineering', html.includes('Fictional City of Lincoln Heights'));
check('does NOT recommend ALDOT as primary',
  !/agency--primary[\s\S]{0,400}ALDOT/.test(html));
check('wording is qualified, not a legal owner',
  html.includes('pending human confirmation') && !html.toLowerCase().includes('is responsible for'));
check('all three roles present',
  html.includes('Lincoln Heights') && html.includes('Regional School Transportation Authority') && html.includes('ALDOT'));
check('school authority marked stakeholder-not-owner',
  html.includes('Stakeholder — holds history, not the hardware'));
check('evidence links present', (html.match(/https?:\/\//g) || []).length >= 3);
check('source freshness shown', html.includes('2026-08-27'));
check('gap shown', html.includes('Where the public record actually breaks down'));
check('next action shown', html.includes('What to do next'));
check('call script shown', html.includes('script'));
check('human confirmation required', html.includes('A person has to confirm this'));
check('synthetic notice in result', html.includes('Synthetic data.'));
check('no-submission notice in result', html.includes('Nothing was submitted.'));
check('NO emergency escalation for routine outage', !html.includes('stop reading and act'));

/* ---------- User Story 2: state route ---------- */
html = await run('US2 — state-route beacon, no danger', {
  locationLabel: 'Maple Ridge Middle',
  equipmentLabel: 'Flashing school-zone beacon',
  dangerLabel: 'No — nobody is in danger',
});
check('recommends ALDOT district office first',
  /rec__name[^>]*>Fictional ALDOT District Traffic Office/.test(html));
check('city permit uncertainty visible', html.includes('under a state permit'));
check('escalation path in next action', html.includes('escalate to Fictional City of Maple Ridge'));
check('school authority still visible', html.includes('Regional School Transportation Authority'));
check('recommendation differs from US1', !html.includes('rec__name">Fictional City of Lincoln'));

/* ---------- User Story 3: unmatched free text ---------- */
html = await run('US3 — unknown location, must not guess', {
  freeText: 'the light by the Walmart',
  equipmentLabel: 'Traffic or walk signal',
  dangerLabel: 'No — nobody is in danger',
});
check('declines to route', html.includes('not going to guess'));
check('names NO agency', !html.includes('Fictional City of Lincoln Heights') && !html.includes('Fictional ALDOT District'));
check('asks the distinguishing question', html.includes('city street or a state-numbered'));
check('offers supported synthetic cases', html.includes('crosswalk signal outage'));

/* ---------- Danger path ---------- */
html = await run('Danger — immediate danger reported', {
  locationLabel: 'Lincoln Heights Elementary',
  equipmentLabel: 'Traffic or walk signal',
  dangerLabel: 'Yes — there is immediate danger',
});
check('safety guidance shown', html.includes('stop reading and act'));
check('states it will NOT place a call', html.includes('cannot and will not place a call'));
check('no tel: link anywhere', !html.includes('tel:'));
check('routing result still rendered beneath', html.includes('Fictional City of Lincoln Heights'));

console.log(failures === 0 ? '\n✅ All end-to-end assertions passed.' : `\n❌ ${failures} FAILING`);
process.exit(failures === 0 ? 0 : 1);
