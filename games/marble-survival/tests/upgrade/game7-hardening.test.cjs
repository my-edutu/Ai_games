'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createRuntime, createServer } = require('../../scripts/serve-complete-runtime.cjs');
const game = require('../../../../dist/games/marble-survival/src/index.js');
const { checksum } = require('../../../../dist/packages/replay/src/index.js');
const config = { rosterSize: 4, roundQuotas: [3, 2, 2, 2, 1], roundIntroTicks: 0, roundTimeoutTicks: 10000 };
const vote = (id, extra = {}) => ({ id, userId: 'viewer-a', family: 'wind-vote', option: 'east', at: 1000, ...extra });

function resign(snapshot) {
  snapshot.stateChecksum = game.marbleStateChecksum(snapshot.payload.state);
  const { checksum: ignored, ...partial } = snapshot;
  snapshot.checksum = checksum(partial);
  return snapshot;
}

test('host cooldown ignores forged client timestamps', () => {
  const host = createRuntime({ nowMs: 0, clock: () => 1000, config });
  assert.equal(host.submitInfluence(vote('first')).accepted, true);
  assert.equal(host.submitInfluence(vote('second', { at: 999999999999 })).reason, 'cooldown');
});

test('operator commands fail closed when no credential was configured', () => {
  const host = createRuntime({ nowMs: 0, operatorToken: '', config });
  const before = host.checksum();
  assert.equal(host.operator('restart', 'local-self-test-only').ok, false);
  assert.equal(host.operator('pause', '').ok, false);
  assert.equal(host.checksum(), before);
  assert.equal(host.paused, false);
});

test('a second wind request cannot silently overwrite the accepted field', () => {
  const runtime = game.MarbleRuntime.create(config, 'wind-conflict');
  assert.equal(runtime.scheduleInfluence(vote('first')).accepted, true);
  const before = game.marbleStateChecksum(runtime.state);
  assert.equal(runtime.scheduleInfluence(vote('second', { option: 'west' })).accepted, false);
  assert.equal(game.marbleStateChecksum(runtime.state), before);
  runtime.step();
  assert.equal(runtime.state.influence.globalWindX, game.MARBLE_WIND_FORCE);
  assert.equal(runtime.drainEvents().filter(e => e.type === 'influence-applied').length, 1);
});

test('championship influence is refused before any state mutation', () => {
  const runtime = game.MarbleRuntime.create(config, 'championship-input');
  runtime.state.roundIndex = 4;
  runtime.state.roundNumber = 5;
  runtime.state.currentQuota = 1;
  const before = game.marbleStateChecksum(runtime.state);
  assert.equal(runtime.scheduleInfluence(vote('final-vote')).accepted, false);
  assert.equal(game.marbleStateChecksum(runtime.state), before);
});

test('countdown wind starts at the first racing tick, not during frozen introduction', () => {
  const runtime = game.MarbleRuntime.create({ ...config, roundIntroTicks: 60 }, 'countdown-wind');
  const decision = runtime.scheduleInfluence(vote('wind-at-start'));
  assert.equal(decision.accepted, true);
  assert.equal(decision.applyTick, 60);
  runtime.step();
  assert.equal(runtime.state.influence.globalWindX, 0);
  for (let i = 1; i < 61; i++) runtime.step();
  assert.equal(runtime.state.influence.effectUntilTick, 240);
});

test('wind expiry is exclusive and clears obsolete field state', () => {
  const runtime = game.MarbleRuntime.create(config, 'wind-expiry');
  runtime.scheduleInfluence(vote('one-field'));
  runtime.step();
  runtime.state.tick = runtime.state.influence.effectUntilTick;
  assert.equal(game.createMarblePublicSnapshot(runtime.state).influence.active, false);
  runtime.step();
  assert.equal(runtime.state.influence.globalWindX, 0);
  assert.equal(runtime.state.influence.activeFamily, null);
});

test('saved snapshots do not alias mutable runtime state', () => {
  const runtime = game.MarbleRuntime.create(config, 'save-copy');
  const saved = game.createMarbleSnapshot(runtime);
  const before = JSON.stringify(saved);
  runtime.state.marbles[0].position.x += 1;
  assert.equal(JSON.stringify(saved), before);
});

test('restored runtime does not alias the caller snapshot', () => {
  const runtime = game.MarbleRuntime.create(config, 'restore-copy');
  const saved = game.createMarbleSnapshot(runtime);
  const restored = game.restoreMarbleSnapshot(saved);
  const before = game.marbleStateChecksum(restored.state);
  saved.payload.state.marbles[0].position.x += 1;
  assert.equal(game.marbleStateChecksum(restored.state), before);
});

test('restore rejects checksummed but inconsistent outer and inner configurations', () => {
  const saved = structuredClone(game.createMarbleSnapshot(game.MarbleRuntime.create(config, 'config-mismatch')));
  saved.payload.config.maxSpeed += 1;
  assert.throws(() => game.restoreMarbleSnapshot(resign(saved)), game.MarbleSnapshotError);
});

test('restore rejects overlapping active and eliminated sets', () => {
  const saved = game.createMarbleSnapshot(game.MarbleRuntime.create(config, 'set-overlap'));
  saved.payload.state.eliminatedIds.push(saved.payload.state.activeIds[0]);
  assert.throws(() => game.restoreMarbleSnapshot(resign(saved)), game.MarbleSnapshotError);
});

test('restore rejects out-of-contract wind strength even with a valid checksum', () => {
  const saved = game.createMarbleSnapshot(game.MarbleRuntime.create(config, 'wind-strength'));
  saved.payload.state.influence.globalWindX = 999999;
  assert.throws(() => game.restoreMarbleSnapshot(resign(saved)), game.MarbleSnapshotError);
});

test('public event feed redacts integrity diagnostic details', () => {
  const host = createRuntime({ seed: 'private-context', nowMs: 0, config });
  host.authority.state.marbles[0].position.x = Number.MAX_SAFE_INTEGER;
  host.advanceDue(host.tickMs);
  const event = host.events.find(e => e.type === 'integrity-quarantined');
  assert.ok(event);
  assert.equal(Object.hasOwn(event.data || {}, 'detail'), false);
});

test('public HTTP participation requires a server-issued session', async () => {
  const { server, runtime } = createServer({ config, operatorToken: 'fixture-only' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const response = await fetch(`${base}/api/influence`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(vote('unauthenticated')),
    });
    assert.equal(response.status, 401);
    assert.equal(runtime.authority.state.influence.pending.length, 0);
  } finally { await new Promise(resolve => server.close(resolve)); }
});


test('HTTP sessions cannot be bypassed with a new body userId or timestamp', async () => {
  let now = 1000;
  const { server, runtime } = createServer({ config, nowMs: now, clock: () => now, operatorToken: 'fixture-only' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const stateResponse = await fetch(`${base}/api/snapshot`);
    const cookie = stateResponse.headers.get('set-cookie');
    assert.ok(cookie && cookie.includes('HttpOnly'), 'server must issue an HTTP-only session');
    const snapshot = await stateResponse.json();
    const headers = { 'content-type': 'application/json', cookie: cookie.split(';')[0], origin: base };
    const send = (id, extra = {}) => fetch(`${base}/api/influence`, {
      method: 'POST', headers, body: JSON.stringify(vote(id, { runId: snapshot.run.id, roundIndex: snapshot.round.index, ...extra })),
    });
    assert.equal((await send('valid')).status, 202);
    const bypass = await send('different', { userId: 'forged-new-person', at: 999999999999 });
    assert.equal(bypass.status, 429);
    assert.equal((await bypass.json()).reason, 'cooldown');
    assert.equal(runtime.authority.state.influence.pending.length, 1);
    const crossSite = await fetch(`${base}/api/influence`, { method: 'POST', headers: { ...headers, origin: 'https://evil.invalid' }, body: JSON.stringify(vote('cross-site')) });
    assert.equal(crossSite.status, 403);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('host reports stale run-bound requests without applying them to the next tournament', () => {
  const host = createRuntime({ nowMs: 0, config, operatorToken: 'fixture-only' });
  const old = host.currentSnapshot();
  host.operator('restart', 'fixture-only');
  const decision = host.submitInfluence(vote('stale', { runId: old.run.id, roundIndex: old.round.index }));
  assert.equal(decision.reason, 'stale-run');
  assert.equal(host.authority.state.influence.pending.length, 0);
});

test('old influence-policy snapshots fail with an explicit version error', () => {
  const saved = game.createMarbleSnapshot(game.MarbleRuntime.create(config, 'old-policy'));
  delete saved.influencePolicyVersion;
  assert.throws(() => game.restoreMarbleSnapshot(resign(saved)), error => error instanceof game.MarbleSnapshotError && error.code === 'version');
});

test('durable JSON round-trip restores contact events without checksum drift', () => {
  const runtime = game.MarbleRuntime.create(config, 'json-contact');
  runtime.state.marbles[0].position = { x: 12000, y: 11000 };
  runtime.state.marbles[1].position = { x: 12020, y: 11000 };
  runtime.step();
  const saved = JSON.parse(JSON.stringify(game.createMarbleSnapshot(runtime)));
  const restored = game.restoreMarbleSnapshot(saved);
  assert.equal(game.marbleStateChecksum(runtime.state), game.marbleStateChecksum(restored.state));
});
