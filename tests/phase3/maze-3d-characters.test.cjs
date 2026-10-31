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

test('disclosed-threat attention turns heads and lantern without affecting terminal poses', async () => {
  const { createExplorer, createWarden } = await modulePromise;
  for (const balanced of [false, true]) {
    const explorer = createExplorer({ balanced }), warden = createWarden({ balanced });
    const head = explorer.group.getObjectByName('curious head');
    const lantern = explorer.group.getObjectByName('swinging lantern');
    const mask = warden.group.getObjectByName('warden mask');
    explorer.update({heading: 0, attentionHeading: Math.PI / 2, attentionStrength: 1, danger: 1, reducedMotion: true});
    assert.ok(head.rotation.y > .6, 'Pip looks toward a publicly observed nearby threat');
    assert.ok(lantern.rotation.y > .2, 'the lantern and gaze share the attention direction');
    explorer.update({heading: 0, attentionStrength: 0, reducedMotion: true});
    assert.equal(head.rotation.y, 0, 'attention releases when the public threat is absent');
    explorer.update({heading: 0, attentionHeading: Math.PI / 2, attentionStrength: 1, result: 'capture', reducedMotion: true});
    assert.equal(head.rotation.x, .28, 'actual loss overrides cosmetic attention');
    warden.update({heading: 0, attentionHeading: -Math.PI / 2, attentionStrength: 1, danger: 1, reducedMotion: true});
    assert.ok(mask.rotation.y < -.5, 'Thornback follows the observed explorer');
    warden.update({heading: 0, attentionStrength: 0, reducedMotion: true});
    assert.equal(mask.rotation.y, 0, 'the guardian resets rather than remembering a hidden target');
    explorer.dispose(); warden.dispose();
  }
});

test('observed-threat cues read in silhouette and clear on neutral or terminal frames', async () => {
  const { createExplorer, createWarden } = await modulePromise;
  for (const balanced of [false, true]) {
    const pip=createExplorer({ balanced }), thornback=createWarden({ balanced });
    const flare=pip.group.getObjectByName('disclosed threat flare');
    const spines=thornback.group.getObjectByName('activated warden spines');
    assert.ok(flare && spines, 'each character has an independently modeled attention cue');
    assert.equal(flare.visible, false);
    assert.equal(spines.visible, false);
    for (const reducedMotion of [false, true]) {
      const attention={heading:0, attentionHeading:Math.PI/2, attentionStrength:.56065, danger:1, time:1, delta:.1, reducedMotion};
      pip.update(attention);
      thornback.update(attention);
      assert.equal(flare.visible, true, 'Pip signals an actually disclosed close guardian');
      assert.equal(spines.visible, true, 'Thornback signals a real nearby encounter');
      assert.ok(thornback.group.getObjectByName('armored body').rotation.y>.06, 'body participates in threat-facing direction');
      assert.ok(flare.scale.x>1, 'cue reads beyond the character silhouette at encounter strength');
      pip.update({...attention,attentionStrength:0});
      thornback.update({...attention,attentionStrength:0});
      assert.equal(flare.visible, false, 'a stale guardian never leaves a persistent threat marker');
      assert.equal(spines.visible, false);
      for (const result of ['escape','capture']) {
        pip.update({...attention,result});
        thornback.update({...attention,result});
        assert.equal(flare.visible, false, 'terminal precedence suppresses the floating cue');
        assert.equal(spines.visible, false, 'terminal precedence suppresses the warden cue');
      }
    }
    pip.dispose(); thornback.dispose();
  }
});

test('Pip presents a modeled carried key to a real nearby lock and clears it for unobserved or terminal states', async () => {
  const {createExplorer} = await modulePromise;
  for (const balanced of [false,true]) {
    const pip=createExplorer({balanced});
    const key=pip.group.getObjectByName('presented matching key');
    const arm=pip.group.getObjectByName('shoulder -1');
    const head=pip.group.getObjectByName('curious head');
    assert.ok(key && arm && head, 'a reusable 3D prop and articulated arm, not a sprite or HUD');
    const propColors=new Set(key.children.filter(part => part.isMesh).map(part => part.material.color.getHexString()));
    assert.ok(['a5ffdc','ffe2a1','263e43'].every(color => propColors.has(color)),
      'the held object has a mint bow, warm key teeth and dark hand-grip contact');
    assert.equal(key.visible,false);
    pip.update({heading:0,keyHeading:Math.PI/2,keyStrength:1,reducedMotion:true});
    assert.equal(key.visible,true,'real matching carried-key cue shows a physical key in Pip’s glove');
    assert.ok(arm.rotation.x<-1.7 && arm.rotation.z>-.4,
      'left glove rises beside Pip instead of reaching behind foreground masonry');
    assert.ok(key.rotation.x>2.5 && key.scale.x>1.2,
      'key is counter-rotated upright and enlarged at gameplay scale');
    const {Vector3}=await import(three);
    pip.group.updateMatrixWorld(true);
    const keyPosition=key.getWorldPosition(new Vector3());
    const facePosition=head.getWorldPosition(new Vector3());
    assert.ok(keyPosition.y>facePosition.y-.12 && keyPosition.x>facePosition.x-.48,
      'key rises beside the face instead of below the gate post');
    assert.ok(head.rotation.y>.6,'Pip visibly looks toward the disclosed lock');
    pip.update({heading:0,keyStrength:0,reducedMotion:true});
    assert.equal(key.visible,false,'hidden/unmatched/open gate cannot leave a stale key');
    assert.equal(key.rotation.x,0,'cleared cue resets the presentation rotation');
    assert.equal(key.scale.x,1,'cleared cue resets presentation scale');
    assert.equal(head.rotation.y,0);
    pip.update({heading:0,keyHeading:Math.PI/2,keyStrength:1,attentionHeading:-Math.PI/2,attentionStrength:1,reducedMotion:true});
    assert.equal(key.visible,false,'a real warden encounter takes priority over the cosmetic lock gesture');
    pip.update({heading:0,keyHeading:Math.PI/2,keyStrength:1,result:'capture',reducedMotion:true});
    assert.equal(key.visible,false,'terminal truth overrides the presentation gesture');
    assert.equal(head.rotation.x,.28);
    pip.update({heading:0,keyHeading:Math.PI/2,keyStrength:1,result:'escape',reducedMotion:true});
    assert.equal(key.visible,false);
    pip.dispose();
    assert.equal(pip.group.children.length,0);
  }
});


test('Pip turns the actual presenting glove toward either public lock bearing and clears the pose', async () => {
  const {createExplorer} = await modulePromise;
  for (const balanced of [false, true]) {
    const pip = createExplorer({balanced});
    const arm = pip.group.getObjectByName('shoulder -1');
    const key = pip.group.getObjectByName('presented matching key');
    const head = pip.group.getObjectByName('curious head');
    const {Vector3} = await import(three);
    const keyHeightFromHead = () => {
      pip.group.updateMatrixWorld(true);
      return key.getWorldPosition(new Vector3()).y - head.getWorldPosition(new Vector3()).y;
    };
    // The gate is already disclosed and its exact key already carried when
    // the presentation adapter supplies these values. This unit test checks
    // articulation only; the pure public-state selector has separate tests.
    pip.update({heading: 0, keyHeading: Math.PI / 2, keyStrength: 1, reducedMotion: true});
    assert.equal(key.visible, true);
    assert.ok(arm.rotation.y > .75, 'the left glove aims toward a right-hand lock');
    assert.ok(arm.rotation.z > 0, 'the arm reaches across the chest instead of hanging below the key');
    assert.ok(keyHeightFromHead() > -.12, 'rightward key bearing retains the existing helmet-height silhouette');
    const rightwardYaw = arm.rotation.y;
    pip.update({heading: 0, keyHeading: -Math.PI / 2, keyStrength: 1, reducedMotion: true});
    assert.ok(arm.rotation.y < -.75, 'the left glove also aims toward a left-hand lock');
    assert.ok(arm.rotation.z < -.25, 'the arm reaches outward toward that side');
    assert.ok(keyHeightFromHead() > -.12, 'leftward key bearing must not drop the real prop below the helmet');
    pip.update({heading: 0, keyHeading: Math.PI / 2, keyStrength: .4, reducedMotion: true});
    assert.ok(arm.rotation.y > 0 && arm.rotation.y < rightwardYaw,
      'weaker real proximity creates a proportionately smaller presentation');
    pip.update({heading: 0, keyStrength: 0, reducedMotion: true});
    assert.equal(arm.rotation.y, 0, 'no public matching key means no lingering bearing');
    assert.equal(key.visible, false);
    pip.update({heading: 0, keyHeading: Math.PI / 2, keyStrength: 1,
      attentionHeading: -Math.PI / 2, attentionStrength: 1, reducedMotion: true});
    assert.equal(arm.rotation.y, 0, 'a disclosed guardian takes priority');
    pip.update({heading: 0, keyHeading: Math.PI / 2, keyStrength: 1,
      result: 'capture', reducedMotion: true});
    assert.equal(arm.rotation.y, 0, 'a real terminal result takes priority');
    pip.dispose();
  }
});
