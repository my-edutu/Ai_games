'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');

const scenePath = path.join(__dirname, '../../public/infinite-tower-climb/visuals/scene.mjs');
const source = fs.readFileSync(scenePath, 'utf8');
const matched = source.match(/^function followClimberContact\(position, target, blend, state\) \{[\s\S]*?^\}/m);
assert.ok(matched, 'actual shipped scene contains the contact adjustment');
const followClimberContact = vm.runInNewContext(`${matched[0]}\nfollowClimberContact`);
const vec = (x, y, z) => ({
  x, y, z,
  lerp(target, alpha) {
    this.x += (target.x - this.x) * alpha;
    this.y += (target.y - this.y) * alpha;
    this.z += (target.z - this.z) * alpha;
    return this;
  },
});

test('standing climber soles track the authoritative platform top without vertical lag', async () => {
  const current = vec(1, 8, 3), destination = vec(7, 10, 9);
  assert.strictEqual(followClimberContact(current, destination, 0.2, 'standing'), current);
  assert.equal(current.x, 2.2, 'horizontal presentation remains smoothed');
  assert.equal(current.y, 10, 'grounded feet have zero vertical interpolation lag');
  assert.ok(Math.abs(current.z - 4.2) < 1e-10);
  assert.deepEqual([destination.x, destination.y, destination.z], [7, 10, 9], 'authority target is immutable to presentation');
});

test('standing contact follows moving platforms up and down without leaving the deck', async () => {
  const current = vec(3, 12, 4);
  for (const platformTop of [12.4, 11.1, 13.9, 13.9]) {
    followClimberContact(current, vec(5, platformTop, 8), 0.05, 'standing');
    assert.equal(current.y, platformTop, 'each visible standing pose contacts the latest truthful surface');
  }
});

test('airborne, dashing, dead and hurt retain smooth 3D motion without invented contacts', async () => {
  for (const state of ['airborne', 'dashing', 'dead', 'hurt']) {
    const current = vec(0, 8, 0);
    followClimberContact(current, vec(10, 12, 20), 0.25, state);
    assert.deepEqual([current.x, current.y, current.z], [2.5, 9, 5], state);
  }
});

test('scene integration applies platform contact only after authoritative player state is read', () => {
  assert.match(source, /function followClimberContact\(position, target, blend, state\)/);
  assert.match(source, /followClimberContact\(climber\.group\.position,\s*actorTarget,\s*blend,\s*p\.state\)/);
  assert.ok(source.indexOf('const p = snapshot.player;') < source.indexOf('followClimberContact(climber.group.position'),
    'contact state comes from the authoritative snapshot');
});
