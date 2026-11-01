import { PILLARS, evaluateTransformation } from './transformation-gate.mjs';
const qualityLabels = {
  NOT_EVALUATED: 'NOT EVALUATED',
  AWAITING_GAMEPLAY: 'AWAITING REAL GAMEPLAY',
  AWAITING_CRITICS: 'AWAITING INDEPENDENT CRITICS',
  NOT_SUBSTANTIALLY_BETTER: 'NOT SUBSTANTIALLY BETTER',
  BLOCKED_BY_REGRESSION: 'BLOCKED BY REGRESSION',
  TECHNICAL_GATES_OPEN: 'QUALITY PREFERRED · SAFETY OPEN',
  TRANSFORMATION_VERIFIED: 'TRANSFORMATION VERIFIED',
};
function put(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}
function verifiedClip(clip, sha) {
  return !!clip && clip.captureVerified === true && clip.realGameplay === true &&
    clip.sourceSha === sha && Number.isFinite(clip.seconds) && clip.seconds >= 60 &&
    typeof clip.url === 'string' &&
    (clip.url.startsWith('/tower/gauntlet/evidence/') || /^https:\/\//i.test(clip.url)) &&
    /\.(mp4|webm)(?:[?#].*)?$/i.test(clip.url);
}
function renderTransformation(record) {
  const result = evaluateTransformation(record);
  put('transformation-status', qualityLabels[result.status] || 'NOT EVALUATED');
  put('transformation-focus', record?.currentTransformation?.title || 'Current playable transformation not yet defined');
  put('transformation-gap', record?.currentTransformation?.nextDecision ||
    'Capture actual before/after climbing footage and obtain independent comparisons.');
  const labels = {
    SUBSTANTIALLY_BETTER: 'Substantially better',
    NO_PREFERENCE_WIN: 'Not demonstrably better',
    AWAITING_INDEPENDENT_REVIEW: 'Not independently evaluated',
  };
  for (const { id } of PILLARS) {
    const pillar = result.pillars[id];
    put('pillar-' + id + '-status', labels[pillar.status] || 'Not evaluated');
    put('pillar-' + id + '-votes', pillar.count >= 5 ?
      pillar.candidateVotes + ' of ' + pillar.count + ' blind critics prefer the new build' :
      pillar.count + ' independent reviews · 5 required');
  }
  const root = document.getElementById('transformation-scenes');
  if (!root) return;
  const sceneItems = Array.isArray(record?.scenarios) ? record.scenarios : [];
  const cards = sceneItems.map(scene => {
    const article = document.createElement('article'); article.className = 'transformation-scene';
    const heading = document.createElement('h3'); heading.textContent = scene.label || scene.id;
    const clips = document.createElement('div'); clips.className = 'transformation-clips';
    for (const [key, name, sha] of [['baseline','BEFORE',result.baselineSha],['candidate','AFTER',result.candidateSha]]) {
      const box = document.createElement('div'); box.className = 'transformation-clip';
      const title = document.createElement('strong'); title.textContent = name;
      const clip = scene[key];
      const detail = verifiedClip(clip, sha) ? document.createElement('a') : document.createElement('span');
      if (detail.tagName === 'A') {
        detail.href = clip.url; detail.textContent = 'Watch real gameplay ↗';
        detail.target = '_blank'; detail.rel = 'noopener noreferrer';
      } else detail.textContent = 'Real paired footage pending';
      box.append(title, detail); clips.append(box);
    }
    article.append(heading, clips); return article;
  });
  root.replaceChildren(...cards);
  put('transformation-evidence', 'Independent before/after verdict: ' +
    (result.status === 'TRANSFORMATION_VERIFIED' ? 'verified on all three experience pillars.' :
      'not yet established. CI/replay checks prevent regressions but cannot create a quality win.'));
}
let transformationRevision = '';
async function refreshTransformation() {
  try {
    const response = await fetch('/tower/gauntlet/transformation.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('transformation record unavailable');
    const record = await response.json();
    const stamp = JSON.stringify(record);
    if (stamp === transformationRevision) return;
    transformationRevision = stamp;
    renderTransformation(record);
  } catch {
    put('transformation-status', 'NOT EVALUATED');
    put('transformation-evidence', 'Transformation evidence unavailable. A green build is not a substitute for real game footage.');
  }
}

let revision = '';
let selectedCapture = '';
function showCapture(entry, buttons) {
  selectedCapture = entry.src;
  const picture = document.getElementById('capture');
  picture.src = entry.src;
  picture.alt = entry.description || entry.label || 'Actual Infinite Tower Climb browser capture';
  document.getElementById('capture-label').textContent = entry.description || entry.label;
  document.getElementById('capture-link').href = entry.src;
  for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.src === entry.src));
}
async function refresh() {
  try {
    const response = await fetch('/tower/gauntlet/progress.json', { cache: 'no-store' });
    if (!response.ok) return;
    const record = await response.json();
    if (record.updated === revision) return;
    revision = record.updated;
    document.getElementById('updated').textContent = `Last updated ${record.updated} · this page refreshes automatically`;
    document.getElementById('verdict').textContent = record.verdict;
    document.getElementById('next-gap').textContent = record.nextGap;
    const captures = record.captures?.length ? record.captures : [{ src: record.capture, label: 'Latest capture', description: record.captureLabel }];
    let selector = document.getElementById('capture-options');
    if (!selector) {
      selector = document.createElement('div'); selector.id = 'capture-options'; selector.className = 'capture-options';
      selector.setAttribute('role', 'group'); selector.setAttribute('aria-label', 'Choose a real game capture');
      document.getElementById('capture-link').before(selector);
    }
    const buttons = captures.map(entry => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = entry.label; button.dataset.src = entry.src;
      button.addEventListener('click', () => showCapture(entry, buttons)); return button;
    });
    selector.replaceChildren(...buttons); selector.hidden = captures.length < 2;
    showCapture(captures.find(entry => entry.src === selectedCapture) || captures[0], buttons);
    const entries = record.iterations.map(entry => {
      const article = document.createElement('article'); article.className = 'iteration';
      const number = document.createElement('span'); number.className = 'iteration-number'; number.textContent = entry.number;
      const copy = document.createElement('div');
      const title = document.createElement('h3'); title.textContent = entry.title;
      const finding = document.createElement('p'); finding.textContent = entry.finding;
      const checks = document.createElement('p'); checks.className = 'checks'; checks.textContent = entry.checks;
      copy.append(title, finding, checks);
      const meta = document.createElement('div'); meta.className = 'iteration-meta';
      const date = document.createElement('small'); date.textContent = entry.date; meta.append(date);
      if (entry.capture) { const link = document.createElement('a'); link.href = entry.capture; link.textContent = 'View evidence ↗'; meta.append(link); }
      article.append(number, copy, meta); return article;
    });
    document.getElementById('iteration-log').replaceChildren(...entries.reverse());
  } catch { document.getElementById('updated').textContent = 'Connection interrupted. Retrying the progress feed.'; }
}
refresh();
refreshTransformation();
const timer = setInterval(refresh, 5000);
const transformationTimer = setInterval(refreshTransformation, 5000);
addEventListener('pagehide', () => { clearInterval(timer); clearInterval(transformationTimer); }, { once: true });
