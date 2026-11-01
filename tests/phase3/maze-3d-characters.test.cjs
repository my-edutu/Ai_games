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
    const glove=pip.group.getObjectByName('glove');
    assert.equal(key.parent,glove,'the visible key remains part of Pip’s actual left wrist');
    assert.ok(Math.hypot(key.position.x,key.position.y,key.position.z)<.2,
      'the real key grip intersects the wrist instead of floating as a marker');
    const blade=key.children.find(part => part.isMesh && part.material.color.getHexString()==='ffe2a1');
    const fingerGrip=key.children.find(part => part.isMesh && part.material.color.getHexString()==='263e43');
    assert.ok(blade && fingerGrip, 'front blade and grasping glove stay true modeled geometry');
    blade.geometry.computeBoundingBox();
    fingerGrip.geometry.computeBoundingBox();
    assert.ok(blade.geometry.boundingBox.max.z>.105 && fingerGrip.geometry.boundingBox.max.z>.095,
      'continuous bright front ridge and real finger clamps remain proud of the grip at mobile scale');
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
    const elbow = pip.group.getObjectByName('elbow -1');
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
    assert.ok(elbow.rotation.y < -.4, 'the connected wrist counters rightward shoulder twist to expose the key bow');
    assert.ok(keyHeightFromHead() > -.12, 'rightward key bearing retains the existing helmet-height silhouette');
    const rightwardYaw = arm.rotation.y;
    pip.update({heading: 0, keyHeading: -Math.PI / 2, keyStrength: 1, reducedMotion: true});
    assert.ok(arm.rotation.y < -.75, 'the left glove also aims toward a left-hand lock');
    assert.ok(arm.rotation.z < -.25, 'the arm reaches outward toward that side');
    assert.ok(elbow.rotation.y > .4, 'leftward bearing counter-turns the connected wrist, not a detached sprite');
    assert.ok(keyHeightFromHead() > -.12, 'leftward key bearing must not drop the real prop below the helmet');
    pip.update({heading: 0, keyHeading: Math.PI / 2, keyStrength: .4, reducedMotion: true});
    assert.ok(arm.rotation.y > 0 && arm.rotation.y < rightwardYaw,
      'weaker real proximity creates a proportionately smaller presentation');
    pip.update({heading: 0, keyStrength: 0, reducedMotion: true});
    assert.equal(arm.rotation.y, 0, 'no public matching key means no lingering bearing');
    assert.equal(elbow.rotation.y, 0, 'absence of a public matching key clears the wrist counter-turn');
    assert.equal(key.visible, false);
    pip.update({heading: 0, keyHeading: Math.PI / 2, keyStrength: 1,
      attentionHeading: -Math.PI / 2, attentionStrength: 1, reducedMotion: true});
    assert.equal(arm.rotation.y, 0, 'a disclosed guardian takes priority');
    assert.equal(elbow.rotation.y, 0, 'a disclosed guardian clears the wrist counter-turn');
    pip.update({heading: 0, keyHeading: Math.PI / 2, keyStrength: 1,
      result: 'capture', reducedMotion: true});
    assert.equal(arm.rotation.y, 0, 'a real terminal result takes priority');
    assert.equal(elbow.rotation.y, 0, 'a terminal result clears the wrist counter-turn');
    pip.dispose();
  }
});


test('actual wrist-held tooth points to a source-disclosed distant socket, without contact', async () => {
  const {createExplorer} = await modulePromise;
  const {Vector3} = await import(three);
  for (const balanced of [false,true]) {
    const pip=createExplorer({balanced});
    pip.group.position.set(4,1,-3);
    const key=pip.group.getObjectByName('presented matching key');
    const glove=pip.group.getObjectByName('glove');
    const target=new Vector3(1,1.8,-6);
    pip.update({heading:0,keyHeading:-Math.PI/2,keyStrength:1,keyTarget:target,reducedMotion:true});
    assert.equal(key.visible,true);
    assert.equal(key.parent,glove,'the key remains physically connected to the glove');
    const origin=key.getWorldPosition(new Vector3());
    const tooth=key.localToWorld(new Vector3(0,-.24,0));
    assert.ok(tooth.sub(origin).normalize().dot(target.clone().sub(origin).normalize())>.995,
      'actual tooth, not a HUD sprite, aims at the source-modeled socket');
    assert.ok(target.distanceTo(origin)>2,'the pose does not fake an inserted key');
    pip.update({heading:0,keyHeading:-Math.PI/2,keyStrength:1,
      keyTarget:{x:NaN,y:1,z:1},reducedMotion:true});
    assert.ok(Number.isFinite(key.rotation.x),'invalid targets retain finite fallback orientation');
    pip.update({heading:0,keyStrength:0,reducedMotion:true});
    assert.equal(key.visible,false);
    assert.equal(key.rotation.x,0);
    assert.equal(key.rotation.y,0);
    assert.equal(key.rotation.z,0);
    pip.update({heading:0,keyHeading:-Math.PI/2,keyStrength:1,keyTarget:target,
      attentionHeading:Math.PI/2,attentionStrength:1,reducedMotion:true});
    assert.equal(key.visible,false,'public warden overrides physical key presentation');
    pip.dispose();
  }
});


test('modeled held key bow remains face-on to two real cameras while the tooth aims at the same disclosed socket', async () => {
  const {createExplorer} = await modulePromise;
  const {Vector3} = await import(three);
  for (const balanced of [false,true]) {
    const pip=createExplorer({balanced});
    pip.group.position.set(4,1,-3);
    const key=pip.group.getObjectByName('presented matching key');
    const glove=pip.group.getObjectByName('glove');
    const target=new Vector3(1,1.8,-6);
    for (const cameraPosition of [new Vector3(9,10,6),new Vector3(-5,8,9)]) {
      pip.update({heading:0,keyHeading:-Math.PI/2,keyStrength:1,
        keyTarget:target,keyCameraPosition:cameraPosition,reducedMotion:true});
      assert.equal(key.visible,true);
      assert.equal(key.parent,glove,'physical key remains joined to Pip\'s glove');
      const origin=key.getWorldPosition(new Vector3());
      const tooth=key.localToWorld(new Vector3(0,-.24,0)).sub(origin).normalize();
      const towardLock=target.clone().sub(origin).normalize();
      assert.ok(tooth.dot(towardLock)>.995,'bow-facing roll does not redirect blade from real public lock');
      const bowNormal=key.localToWorld(new Vector3(0,0,1)).sub(origin).normalize();
      const towardCamera=cameraPosition.clone().sub(origin);
      towardCamera.addScaledVector(tooth,-towardCamera.dot(tooth));
      assert.ok(towardCamera.lengthSq()>.1,'two cameras produce distinct nondegenerate viewing directions');
      assert.ok(bowNormal.dot(towardCamera.normalize())>.98,'mint bow presents its face rather than its edge');
      assert.ok(origin.distanceTo(target)>2,'key is presented, not inserted into an unopened door');
    }
    pip.update({heading:0,keyHeading:-Math.PI/2,keyStrength:1,keyTarget:target,
      keyCameraPosition:{x:NaN,y:0,z:0},reducedMotion:true});
    assert.ok(Number.isFinite(key.rotation.x),'bad viewer data does not corrupt model quaternion');
    pip.update({heading:0,keyStrength:0,reducedMotion:true});
    assert.equal(key.visible,false,'stale key disappears when carried-key cue clears');
    pip.update({heading:0,keyHeading:-Math.PI/2,keyStrength:1,keyTarget:target,
      keyCameraPosition:new Vector3(9,10,6),attentionHeading:0,attentionStrength:1,reducedMotion:true});
    assert.equal(key.visible,false,'actual disclosed guardian overrides cosmetic key presentation');
    pip.dispose();
  }
});


test('Thornback opens physical paired shell halves only during a true disclosed encounter', async () => {
  const {createWarden} = await modulePromise;
  for (const balanced of [false,true]) {
    const warden=createWarden({balanced});
    const heart=warden.group.getObjectByName('opened guardian signal heart');
    assert.ok(heart?.isGroup, 'guardian has a connected physical inner-heart, not a screen overlay');
    assert.equal(heart.visible,false,'no unobserved guardian glow reveals a hidden enemy');
    const sides=[-1,1].map(side=>({
      side, wing:warden.group.getObjectByName(`flared elytron ${side}`),
      lining:warden.group.getObjectByName(`exposed elytron lining ${side}`),
      seam:warden.group.getObjectByName(`opened elytron ember seam ${side}`)
    }));
    for (const entry of sides) {
      assert.ok(entry.wing && entry.lining && entry.seam, 'both shell plates, ember linings and visible seams must be modeled');
      assert.equal(entry.lining.parent,entry.wing,'real underside remains attached to the opening armor');
      assert.equal(entry.seam.parent,entry.wing,'visible seam is physically attached to the opening armor');
      assert.equal(entry.lining.visible,false,'no secret threat may leak at rest');
      assert.equal(entry.seam.visible,false,'an undisclosed threat cannot light the seam');
    }
    for (const reducedMotion of [false,true]) {
      warden.update({heading:0,attentionHeading:Math.PI/2,attentionStrength:.56065,
        danger:1,reducedMotion,time:1,delta:.05});
      assert.equal(heart.visible,true,'only an actual public encounter reveals the modeled signal heart');
      assert.ok(heart.position.y>.42,'an internal physical core rises through the opened shell');
      assert.ok(heart.scale.x>1,'the exposed core is readable at gameplay size');
      const observedPosition=[heart.position.x,heart.position.y,heart.position.z];
      warden.update({heading:0,attentionHeading:Math.PI/2,attentionStrength:.56065,
        danger:1,reducedMotion,time:27,delta:.05});
      assert.deepEqual([heart.position.x,heart.position.y,heart.position.z],observedPosition,
        'reduced-motion attention poses remain static across display time');
      if (reducedMotion) {
        assert.equal(heart.rotation.y,0,'reduced motion disables the interior core sweep');
      } else {
        assert.ok(Math.abs(heart.rotation.y)>.05,
          'ordinary motion moves the connected core visibly rather than presenting a static glow');
      }
      for (const entry of sides) {
        assert.ok(entry.wing.rotation.z*entry.side>.60,'shell must visibly separate at real public warning strength');
        assert.ok(entry.wing.rotation.y*entry.side<-.20,'wing opens in three dimensions');
        assert.ok(entry.wing.rotation.x<-.05,'shell opens around a third physical axis');
        assert.equal(entry.lining.visible,true,'real exposed ember underside follows public close warning');
        assert.equal(entry.seam.visible,true,'physically attached ember seam follows the public warning');
      }
      warden.update({heading:0,attentionStrength:0,reducedMotion,time:2,delta:.05});
      assert.equal(heart.visible,false,'withdrawn public threat cannot retain a secret luminous marker');
      for (const entry of sides) {
        assert.equal(entry.wing.rotation.z,0,'unseen threat closes the shell with no stale position');
        assert.equal(entry.wing.rotation.y,0);
        assert.equal(entry.wing.rotation.x,0);
        assert.equal(entry.lining.visible,false);
        assert.equal(entry.seam.visible,false);
      }
      for (const result of ['capture','escape']) {
        warden.update({heading:0,attentionHeading:Math.PI/2,attentionStrength:1,
          danger:1,result,reducedMotion,time:3,delta:.05});
        assert.equal(heart.visible,false,'real terminal truth cancels cosmetic encounter cues');
        for (const entry of sides) {
          assert.equal(entry.wing.rotation.z,0,'terminal truth outranks shell threat pose');
          assert.equal(entry.wing.rotation.x,0);
          assert.equal(entry.lining.visible,false);
          assert.equal(entry.seam.visible,false);
        }
      }
    }
    warden.dispose();
    assert.equal(warden.group.children.length,0);
  }
});


test('Thornback performs an original physical public encounter without a hidden-state cue or frame allocations', async () => {
  const {createWarden}=await modulePromise;
  for (const balanced of [false,true]) {
    const warden=createWarden({balanced});
    const pincers=[-1,1].map(side=>({side,node:warden.group.getObjectByName(`foreleg pincer ${side}`)}));
    const antennae=[-1,1].map(side=>({side,node:warden.group.getObjectByName(`antenna ${side}`)}));
    // Antennae have physically modeled pivots and colored tips, not billboards.
    for (const item of [...pincers,...antennae]) assert.ok(item.node?.isGroup);
    const resources=()=>{
      const found=new Set();
      warden.group.traverse(object=>{
        if (object.geometry) found.add(object.geometry);
        if (object.material) found.add(object.material);
      });
      return found;
    };
    const original=resources();
    const close={heading:0, attentionHeading:Math.PI/2,
      attentionStrength:.5606531154547746, danger:1, moving:false,
      reducedMotion:true, time:2, delta:.05};
    warden.update(close);
    for (const {side,node} of pincers) {
      assert.ok(node.rotation.y*side>.22,'disclosed close warning must open a real front pincer');
      assert.ok(node.parent.rotation.x>.1,'front knee visibly braces in three dimensions');
    }
    for (const {side,node} of antennae) {
      assert.ok(node.rotation.z*side>.25,'physical feelers must attend to the observed explorer');
      assert.ok(node.rotation.x>.1,'feelers should also track in depth');
    }
    const head=warden.group.getObjectByName('warden mask');
    assert.ok(head.position.z>.65,'mask advances into a close public encounter');
    const originalPose=[...pincers,...antennae].map(({node})=>[node.rotation.x,node.rotation.y,node.rotation.z]);
    warden.update({...close,time:25});
    assert.deepEqual([...pincers,...antennae].map(({node})=>[node.rotation.x,node.rotation.y,node.rotation.z]),originalPose,
      'reduced motion keeps a stable static encounter pose');
    for (let frame=0;frame<40;frame++) warden.update({...close,time:frame/30,reducedMotion:false,moving:frame%2===0});
    assert.deepEqual(resources(),original,'animation must reuse every geometry and material');
    for (const result of [null,'capture','escape']) {
      warden.update({...close,attentionStrength:result?1:0,result,reducedMotion:true});
      for (const {node} of pincers) assert.equal(node.rotation.y,0,'neutral and terminal poses erase stale pincer warnings');
      for (const {side,node} of antennae) assert.equal(node.rotation.z,side*.08,'terminal truth cannot retain a threat gesture');
      assert.equal(head.position.z,.62,'neutral and terminal mask returns to its real rest position');
    }
    warden.dispose();
  }
});

test('Pip performs an original planted startle only toward a publicly disclosed guardian', async () => {
  const {createExplorer}=await modulePromise;
  for (const balanced of [false,true]) {
    const pip=createExplorer({balanced});
    const body=pip.group.getObjectByName('breathing torso');
    const head=pip.group.getObjectByName('curious head');
    const scarf=pip.group.getObjectByName('scarf tail');
    const left=pip.group.getObjectByName('shoulder -1');
    const right=pip.group.getObjectByName('shoulder 1');
    const hips=[-1,1].map(side=>pip.group.getObjectByName(`hip ${side}`));
    const knees=[-1,1].map(side=>pip.group.getObjectByName(`knee ${side}`));
    const lantern=pip.group.getObjectByName('swinging lantern');
    for (const part of [body,head,scarf,left,right,...hips,...knees,lantern]) assert.ok(part?.isGroup);
    const resources=()=>{
      const found=new Set();
      pip.group.traverse(node=>{if(node.geometry)found.add(node.geometry);if(node.material)found.add(node.material)});
      return found;
    };
    const original=resources();
    const close={heading:0,attentionHeading:Math.PI/2,attentionStrength:.5606531154547746,
      danger:1,reducedMotion:true,moving:false,time:1,delta:.05};
    pip.update(close);
    assert.ok(body.position.y<.74 && body.position.z<-.05,'visible physical recoil crouches without moving the actor group');
    assert.ok(body.rotation.x<-.16 && head.rotation.z<-.09,'torso and face tilt away while looking at the disclosed guardian');
    assert.ok(left.rotation.x<-.45 && right.rotation.x<-.9,'paired arms brace while raising the real lantern');
    assert.ok(left.rotation.z<-.45 && right.rotation.z>.65,'gloves open into a readable two-sided silhouette');
    assert.ok(hips[0].rotation.z<-.12 && hips[1].rotation.z>.12,'both feet widen into a grounded stance');
    assert.ok(knees.every(part=>part.rotation.x>.15),'bent articulated knees complete the crouch');
    assert.ok(scarf.rotation.x<-.14 && scarf.rotation.z>.1,'physical scarf trails the original character gesture');
    assert.equal(pip.group.position.x,0,'cosmetic recoil must not alter the source-owned world position');
    const pose=[body.position.y,body.position.z,body.rotation.x,head.rotation.z,
      left.rotation.x,right.rotation.x,...hips.map(part=>part.rotation.z),scarf.rotation.x];
    pip.update({...close,time:50});
    assert.deepEqual([body.position.y,body.position.z,body.rotation.x,head.rotation.z,
      left.rotation.x,right.rotation.x,...hips.map(part=>part.rotation.z),scarf.rotation.x],pose,
      'reduced-motion physical response is fixed and accessible, not time-based jitter');
    for(let frame=0;frame<48;frame++) pip.update({...close,time:frame/24,
      reducedMotion:false,moving:frame%3===0});
    assert.deepEqual(resources(),original,'the original performance does not allocate geometry or materials per frame');
    pip.update({heading:0,attentionStrength:1,danger:0,reducedMotion:true});
    assert.equal(body.position.y,.78,'no disclosed target means no recoil');
    assert.equal(body.position.z,0,'unknown danger cannot retain a false retreat');
    assert.equal(scarf.rotation.z,0,'a hidden/withdrawn encounter clears the scarf');
    assert.equal(left.rotation.z,-.15);
    assert.equal(right.rotation.z,.34);
    assert.ok(hips.every(part=>part.rotation.z===0),'the stance resets without a target');
    pip.update({...close,result:'capture'});
    assert.equal(body.position.z,0,'actual terminal truth cancels a physical alert');
    assert.ok(hips.every(part=>part.rotation.z===0),'terminal gestures have no stale leg warning');
    assert.equal(head.rotation.x,.28,'the established production loss pose wins');
    pip.dispose(); pip.dispose();
  }
});
