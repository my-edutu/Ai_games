'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const source = fs.readFileSync(path.resolve(__dirname, '../../public/ai-maze-escape/characters.js'), 'utf8');
const three = pathToFileURL(path.resolve(__dirname, '../../node_modules/three/build/three.module.js')).href;
const modulePromise = import(`data:text/javascript;base64,${Buffer.from(source.replace("'./vendor/three.module.js'", JSON.stringify(three))).toString('base64')}`);

test('both character detail levels react to every actual production loss', async () => {
  const { createExplorer, createWarden } = await modulePromise;
  for (const balanced of [false, true]) {
    const explorer = createExplorer({balanced}), warden = createWarden({balanced});
    for (const reason of ['capture', 'trap-death', 'timer-expired', 'stagnation']) {
      for (const result of [reason, {reason}]) {
        explorer.update({result, delta: .1, time: 1});
        warden.update({result, delta: .1, time: 1});
        assert.equal(explorer.group.getObjectByName('curious head').rotation.x, .28);
        assert.equal(explorer.group.getObjectByName('eye -1').scale.y, .32);
        assert.equal(explorer.group.getObjectByName('eye 1').scale.y, .32);
        assert.equal(warden.group.getObjectByName('warden mask').rotation.x, -.13);
      }
    }
    explorer.update({result: 'escape', reducedMotion: true});
    assert.notEqual(explorer.group.getObjectByName('curious head').rotation.x, .28);
    explorer.dispose(); warden.dispose(); explorer.dispose(); warden.dispose();
    assert.equal(explorer.group.children.length, 0);
    assert.equal(warden.group.children.length, 0);
  }
});

test('balanced character meshes retain all articulation while reducing vertex cost', async () => {
  const { createExplorer, createWarden } = await modulePromise;
  for (const create of [createExplorer, createWarden]) {
    const full = create(), balanced = create({balanced: true});
    function inspect(group) {
      const names = [], resources = new Set(); let vertices = 0;
      group.traverse(object => {
        if (object.name) names.push(object.name);
        if (object.geometry) {vertices += object.geometry.attributes.position.count; resources.add(object.geometry);}
        if (object.material) resources.add(object.material);
      });
      return {names, vertices, resources};
    }
    const a = inspect(full.group), b = inspect(balanced.group);
    assert.deepEqual(b.names, a.names);
    assert.ok(b.vertices < a.vertices * .6);
    for (const actor of [full, balanced]) {
      for (let i = 0; i < 20; i++) actor.update({moving: true, heading: Math.PI / 2, delta: .05, time: i / 20});
      assert.ok(actor.group.rotation.y > 1);
      actor.update({moving: true, heading: 0, delta: .05, reducedMotion: true});
      assert.equal(actor.group.rotation.y, 0);
    }
    const releases = new Map([...b.resources].map(resource => [resource, 0]));
    for (const resource of b.resources) resource.addEventListener('dispose', () => releases.set(resource, releases.get(resource) + 1));
    full.dispose(); balanced.dispose(); balanced.dispose(); balanced.update({moving: true});
    assert.ok([...releases.values()].every(count => count === 1));
  }
});
