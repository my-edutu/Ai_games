const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const game = path.join(root, 'games', 'eko-street-run');

const requiredFiles = [
  'README.md',
  'PRD.md',
  'GAME_DESIGN.md',
  'AI_SYSTEM.md',
  'VIEWER_INTERACTION.md',
  'AUDIO_VISUAL.md',
  'TECHNICAL_ARCHITECTURE.md',
  'TESTING_STRATEGY.md',
  'PRODUCTION_READINESS.md',
  'ASSET_LEDGER.md',
  'REQUIREMENT_TRACEABILITY.md',
  'AGENTS.md',
  path.join('docs', 'EKO_EXPERIENCE_STANDARD.md'),
  path.join('docs', 'LAGOS_REFERENCE_PACK.md'),
  path.join('phases', 'PHASE-00-CONSTITUTION.md'),
  path.join('phases', 'PHASE-01-FOUNDATION.md'),
];

const forbiddenPlaceholder = /\b(TBD|TODO|FIXME)\b/;

test('Eko Run Phase 0 documentation contract is complete and placeholder-free', () => {
  for (const relative of requiredFiles) {
    const file = path.join(game, relative);
    assert.ok(fs.existsSync(file), `missing ${relative}`);
    const text = fs.readFileSync(file, 'utf8');
    assert.ok(text.trim().length > 100, `${relative} is unexpectedly empty`);
    assert.equal(forbiddenPlaceholder.test(text), false, `${relative} contains prohibited placeholder language`);
  }
});

test('Eko Run contract locks deterministic authority and experience gates', () => {
  const prd = fs.readFileSync(path.join(game, 'PRD.md'), 'utf8');
  const architecture = fs.readFileSync(path.join(game, 'TECHNICAL_ARCHITECTURE.md'), 'utf8');
  const trace = fs.readFileSync(path.join(game, 'REQUIREMENT_TRACEABILITY.md'), 'utf8');
  const assetLedger = fs.readFileSync(path.join(game, 'ASSET_LEDGER.md'), 'utf8');

  assert.match(prd, /NFR-DET-001/);
  assert.match(prd, /fixed 60 Hz/i);
  assert.match(architecture, /Three\.js is a renderer\/scene adapter, not the game authority/i);
  assert.match(architecture, /route[\s\S]*traffic[\s\S]*ai[\s\S]*reward[\s\S]*audience[\s\S]*cosmetic/i);
  assert.match(trace, /NFR-REL-001/);
  assert.match(assetLedger, /REFERENCE_ONLY/);
  assert.match(assetLedger, /third-party-rights/i);
});
