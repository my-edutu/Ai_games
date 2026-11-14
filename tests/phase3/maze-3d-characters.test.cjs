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

test('a publicly observed Thornback rig resets its whole physical performance for reuse without reallocating meshes', async () => {
  const {createWarden, rigPrimitiveResourceStats} = await modulePromise;
  for (const balanced of [false, true]) {
    const baseline = rigPrimitiveResourceStats();
    const warden = createWarden({balanced});
    const materials = new Set(), shapes = new Set();
    warden.group.traverse(object => {
      if (object.geometry) shapes.add(object.geometry);
      if (object.material) materials.add(object.material);
    });
    const spines = warden.group.getObjectByName('activated warden spines');
    const mask = warden.group.getObjectByName('warden mask');
    assert.ok(spines && mask);
    for (let run = 0; run < 6; run++) {
      warden.update({heading:1.7,attentionHeading:1.7,attentionStrength:1,
        encounterBeat:.94,danger:1,moving:true,time:run+.5,delta:.1});
      assert.equal(spines.visible,true,'a genuinely witnessed threat performs');
      warden.reset();
      assert.equal(spines.visible,false,'a detached rig cannot preserve a prior warning');
      assert.equal(mask.rotation.y,0,'the prior target bearing is not remembered');
      assert.equal(warden.group.rotation.y,0,'the former guardian orientation resets');
      const afterShapes = new Set(), afterMaterials = new Set();
      warden.group.traverse(object => {
        if (object.geometry) afterShapes.add(object.geometry);
        if (object.material) afterMaterials.add(object.material);
      });
      assert.deepEqual(afterShapes,shapes,'all six lives reuse the physical mesh buffers');
      assert.deepEqual(afterMaterials,materials,'no hidden per-reset material allocation');
    }
    warden.dispose();
    assert.deepEqual(rigPrimitiveResourceStats(),baseline,'final teardown restores shared primitive references');
  }
});

test('dormant public Thornback releases its WebGL registrations but preserves CPU rig and Pip buffers', async () => {
  const {createExplorer, createWarden, rigPrimitiveResourceStats} = await modulePromise;
  const {Scene} = await import(three);
  for (const balanced of [false, true]) {
    const baseline = rigPrimitiveResourceStats();
    const pip = createExplorer({balanced}), warden = createWarden({balanced});
    const pipGeometry = new Set(), wardenGeometry = new Set();
    // Only actually visible Pip meshes hold live renderer registrations.
    // Hidden/rigid-batched CPU primitives must not protect dormant Warden GPU.
    pip.group.traverseVisible(object => {if (object.geometry) pipGeometry.add(object.geometry);});
    warden.group.traverse(object => {if (object.geometry) wardenGeometry.add(object.geometry);});
    const privateShapes = [...wardenGeometry].filter(g => !pipGeometry.has(g));
    const sharedShapes = [...wardenGeometry].filter(g => pipGeometry.has(g));
    assert.ok(privateShapes.length > 0, 'a full articulated guardian has private rigid geometry');
    const releases = new Map([...wardenGeometry].map(g => [g, 0]));
    for (const g of wardenGeometry) g.addEventListener('dispose', () => releases.set(g, releases.get(g) + 1));
    const stage = new Scene();
    stage.add(pip.group, warden.group);
    assert.equal(warden.suspendGpuBuffers(), false, 'never release an attached public enemy');
    assert.ok([...releases.values()].every(count => count === 0));
    stage.remove(warden.group);
    const liveGeometries = new Set();
    stage.traverseVisible(object => {if (object.geometry) liveGeometries.add(object.geometry);});
    assert.deepEqual(liveGeometries, pipGeometry,
      'the protected GPU shape set covers actual active Pip meshes, not idle CPU cache refs');
    assert.equal(warden.suspendGpuBuffers(liveGeometries), true,
      'detached witnessed enemy releases GPU registrations not used by live Pip');
    assert.ok(privateShapes.every(g => releases.get(g) === 1),
      'ALL Thornback-only render geometries release, even with surviving CPU-only cache owners');
    assert.ok(sharedShapes.every(g => releases.get(g) === 0),
      'Pip-shared resources must not be evicted during guardian withdrawal');
    warden.reset();
    stage.add(warden.group);
    const recovered = new Set();
    warden.group.traverse(object => {if (object.geometry) recovered.add(object.geometry);});
    assert.deepEqual(recovered, wardenGeometry,
      'a later true public encounter reuses the same authored CPU meshes and geometry IDs');
    assert.equal(warden.suspendGpuBuffers(), false, 'cannot suspend redisclosed living enemy');
    stage.remove(warden.group);
    pip.dispose(); warden.dispose();
    assert.deepEqual(rigPrimitiveResourceStats(), baseline, 'final scene teardown releases both owners');
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
      // Pass331: the actual published reciprocal Pip–Thornback court already
      // gives three independent in-world warnings. The old exclamation glyph
      // sits directly on Pip's face in native 390px notice/brace/release.
      // Keep the full model and alternate near-warning glyph unchanged.
      for(const beat of [0,.48889,.89953,1]) {
        pip.update({...attention,attentionStrength:.818181818,guardianEncounterBeat:beat});
        assert.equal(flare.visible,false,
          'a real public open-court duel must not hide Pip/Thornback behind a floating warning triangle');
        assert.ok(pip.group.getObjectByName('swinging lantern').visible,
          'the physical local lantern cue survives the change');
      }
      pip.update({...attention,attentionStrength:.818181818,guardianEncounterBeat:NaN});
      assert.equal(flare.visible,true,
        'a nearby disclosed warning without a witnessed reciprocal duel keeps the accessible shape cue');
      pip.update({...attention,attentionStrength:.818181818,guardianEncounterBeat:.5,attentionHeading:undefined});
      assert.equal(flare.visible,false,'unknown/ended attention cannot keep the former duel cue');
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
    // The character rig legally batches co-material extrusions into shared
    // BufferGeometry before returning, so inspect real resulting 3D meshes,
    // not a pre-batching geometry implementation detail.
    const heartMeshes=heart.children.filter(part=>part.isMesh && part.geometry?.attributes?.position);
    assert.ok(heartMeshes.length>=3 && heartMeshes.some(part=>part.geometry.attributes.position.count>200),
      'the public warning has multiple sculpted, triangulated 3D parts rather than a flat halo');
    assert.equal(heart.children.filter(part=>part.geometry?.type==='TorusGeometry').length,0,
      'the rejected circular ring cannot return as a false pickup cue');
    const sides=[-1,1].map(side=>({
      side, wing:warden.group.getObjectByName(`flared elytron ${side}`),
      lining:warden.group.getObjectByName(`exposed elytron lining ${side}`),
      seam:warden.group.getObjectByName(`opened elytron ember seam ${side}`),
      fronds:warden.group.getObjectByName(`unfurled sea-glass wing fronds ${side}`),
      sail:warden.group.getObjectByName(`articulated tidal sail ${side}`),
      dorsal:warden.group.getObjectByName(`fixed sculpted warden shell relief ${side}`),
      tideblade:warden.group.getObjectByName(`fixed sculpted warden tideblade ${side}`)
    }));
    for (const entry of sides) {
      assert.ok(entry.wing && entry.lining && entry.seam && entry.fronds,
        'both shell plates, ember linings, physically attached fronds and seams must be modeled');
      assert.equal(entry.dorsal?.parent,entry.wing,
        'large identifiable armor relief must be physically rooted to each genuine hinged elytron');
      assert.equal(entry.dorsal.visible,true,
        'Thornback anatomy exists in neutral play, never requiring private/disclosed threat attention');
      const scutes=entry.dorsal.children.filter(part=>part.isMesh && part.geometry?.attributes?.position);
      assert.ok(scutes.length>=3,
        'actual batched ivory, copper and bronze sculptures must break the small dark-shell silhouette');
      assert.ok(scutes.some(part=>part.material?.color?.getHexString()==='e1c997'),
        'real ivory ribs remain contrasting three-dimensional geometry at mobile resolution');
      assert.ok(scutes.some(part=>part.material?.color?.getHexString()==='a17b5b'),
        'warm copper physical keel remains attached to the shell');
      assert.equal(entry.tideblade?.parent,entry.wing,
        'both dominant tideblade silhouettes are physically bolted to actual articulated shell halves');
      const tideParts=entry.tideblade.children.filter(part=>part.isMesh&&part.geometry?.attributes?.position);
      assert.ok(tideParts.length>=3,
        'a real non-billboard ivory blade, copper inlay and rooted base must survive rig batching');
      const pale=tideParts.find(part=>part.material?.color?.getHexString()==='e1c997');
      const copper=tideParts.find(part=>part.material?.color?.getHexString()==='a17b5b');
      assert.ok(pale&&copper&&pale.geometry.attributes.position.count>100,
        'large contrast surfaces must be rendered geometry, not an icon or thin warning ribbon');
      pale.geometry.computeBoundingBox();
      const crownHeight=pale.geometry.boundingBox.max.y-pale.geometry.boundingBox.min.y;
      assert.ok(crownHeight>=.65,
        'the authored crest must materially exceed old subpixel dorsal scutes at mobile scale');
      assert.equal(entry.tideblade.visible,true,
        'the actor silhouette must not depend on private guardian knowledge or an alert state');
      assert.equal(entry.fronds.parent,entry.wing,'every botanical blade is physically hinged to the guardian, not a screen marker');
      assert.equal(entry.sail?.parent,entry.fronds,
        'a large original sail is physically joined to each existing shell hinge, never a floating marker');
      assert.ok(entry.sail.children.filter(part=>part.isMesh).length>=2,
        'the expanded silhouette is multiple actual connected bronze and sea-glass 3D meshes');
      assert.equal(entry.fronds.visible,false,'no secret warning frond is visible for an undisclosed threat');
      assert.ok(entry.fronds.children.filter(part=>part.isMesh).length>=2,
        'multiple sculpted rigid meshes construct an actual three-dimensional crest');
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
        assert.equal(entry.fronds.visible,true,'tall original physical blades bloom in a disclosed encounter');
        assert.ok(entry.sail.rotation.z*entry.side>.27,
          'both sculpted tide sails unfold visibly toward the true public explorer encounter');
        if (reducedMotion) {
          const stable=entry.sail.rotation.z;
          warden.update({heading:0,attentionHeading:Math.PI/2,attentionStrength:.56065,
            danger:1,reducedMotion:true,time:100,delta:.05});
          assert.equal(entry.sail.rotation.z,stable,'reduced motion retains a still encounter silhouette');
        }
        if (reducedMotion) assert.equal(entry.fronds.rotation.y,0,
          'the large botanical silhouette stays still for reduced-motion users');
      }
      warden.update({heading:0,attentionStrength:0,reducedMotion,time:2,delta:.05});
      assert.equal(heart.visible,false,'withdrawn public threat cannot retain a secret luminous marker');
      assert.equal(heart.rotation.y,0,'neutral threat withdrawal resets to positive-zero pose');
      for (const entry of sides) {
        assert.equal(entry.wing.rotation.z,0,'unseen threat closes the shell with no stale position');
        assert.equal(entry.wing.rotation.y,0);
        assert.equal(entry.wing.rotation.x,0);
        assert.equal(entry.lining.visible,false);
        assert.equal(entry.seam.visible,false);
        assert.equal(entry.fronds.visible,false,'unobserved opponent never leaves a lingering false bloom');
        assert.equal(entry.fronds.rotation.y,0,'neutral pose resets to exact positive zero');
        assert.equal(entry.sail.rotation.z,0,'withdrawn attention resets the sculpted tide sail to +0');
      }
      for (const result of ['capture','escape']) {
        warden.update({heading:0,attentionHeading:Math.PI/2,attentionStrength:1,
          danger:1,result,reducedMotion,time:3,delta:.05});
        assert.equal(heart.visible,false,'real terminal truth cancels cosmetic encounter cues');
        assert.equal(heart.rotation.y,0,'terminal states cannot retain signed-zero or an earlier gaze sweep');
        for (const entry of sides) {
          assert.equal(entry.wing.rotation.z,0,'terminal truth outranks shell threat pose');
          assert.equal(entry.wing.rotation.x,0);
          assert.equal(entry.lining.visible,false);
          assert.equal(entry.seam.visible,false);
          assert.equal(entry.fronds.visible,false,'terminal truth cancels the blossom as well as the spines');
          assert.equal(entry.fronds.rotation.y,0,'terminal reset cannot retain hidden attention');
          assert.equal(entry.sail.rotation.z,0,'a terminal result must retract every extended physical sail');
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
      assert.equal(head.position.z,.73,'neutral and terminal mask returns to the actual raised forward skull, not a stale prior pose');
      assert.equal(head.position.y,.27,'the disconnected public warning must settle the new complete face height');
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

test('Pip models a witnessed gate-opening salute without stale cues, secret authority or allocations', async () => {
  const {createExplorer}=await modulePromise;
  for (const balanced of [false,true]) {
    const pip=createExplorer({balanced});
    const head=pip.group.getObjectByName('curious head');
    const torso=pip.group.getObjectByName('breathing torso');
    const arm=pip.group.getObjectByName('shoulder 1');
    const scarf=pip.group.getObjectByName('scarf tail');
    const lantern=pip.group.getObjectByName('swinging lantern');
    const key=pip.group.getObjectByName('presented matching key');
    const resources=()=>{const s=new Set();pip.group.traverse(o=>{if(o.geometry)s.add(o.geometry);if(o.material)s.add(o.material)});return s};
    const original=resources();
    const cue={heading:0,gateHeading:Math.PI/2,gateStrength:1,reducedMotion:true,delta:.05,time:3,moving:false,danger:0};
    pip.update(cue);
    assert.ok(head.rotation.y>.55 && head.rotation.x<-.17,'Pip looks up toward the actually opened passage');
    assert.ok(arm.rotation.x<-1.3 && torso.position.y>.86,'modeled lantern and torso physically rise');
    assert.ok(scarf.rotation.x>.2 && lantern.rotation.y>.2,'scarf and lamp participate in the static readable gesture');
    assert.equal(key.visible,false,'opening a gate is not a new key or repeated key gesture');
    assert.deepEqual(pip.group.position.toArray(),[0,0,0],'actor authority never moves');
    const pose=[head.rotation.x,head.rotation.y,arm.rotation.x,torso.position.y,scarf.rotation.x];
    pip.update({...cue,time:50});
    assert.deepEqual([head.rotation.x,head.rotation.y,arm.rotation.x,torso.position.y,scarf.rotation.x],pose,
      'reduced-motion salutes are stable and non-pulsing');
    pip.update({heading:0,gateStrength:1,reducedMotion:true,delta:.05});
    assert.equal(torso.position.y,.78,'missing source heading disables a false or stale opening');
    assert.equal(arm.rotation.x,-.16,'neutral arm returns');
    assert.equal(scarf.rotation.x,0,'neutral scarf returns');
    const threat={heading:0,attentionHeading:Math.PI/2,attentionStrength:.8,danger:1,reducedMotion:true,delta:.05};
    pip.update(threat);
    const threatPose=[torso.position.y,head.rotation.x,arm.rotation.x,lantern.rotation.y];
    pip.update({...threat,gateHeading:-Math.PI/2,gateStrength:1});
    assert.deepEqual([torso.position.y,head.rotation.x,arm.rotation.x,lantern.rotation.y],threatPose,
      'genuinely disclosed danger suppresses the gate gesture');
    pip.update({...cue,result:'capture'});
    assert.equal(head.rotation.x,.28,'terminal source truth overrides celebration');
    pip.update({...cue,gateStrength:0});
    assert.equal(torso.position.y,.78,'expired real event clears pose');
    for(let i=0;i<40;i++)pip.update({...cue,gateStrength:i/40,reducedMotion:false,time:i/24});
    assert.deepEqual(resources(),original,'animation reuses already modeled geometry and material');
    pip.dispose();
  }
});

test('Pip physically acknowledges only a witnessed public pickup with stable priority and no allocation',async()=>{
  const {createExplorer}=await modulePromise;
  for(const balanced of [false,true]){
    const pip=createExplorer({balanced});
    const body=pip.group.getObjectByName('breathing torso');
    const head=pip.group.getObjectByName('curious head');
    const left=pip.group.getObjectByName('shoulder -1');
    const right=pip.group.getObjectByName('shoulder 1');
    const scarf=pip.group.getObjectByName('scarf tail');
    const key=pip.group.getObjectByName('presented matching key');
    const resources=()=>{const all=new Set();pip.group.traverse(p=>{if(p.geometry)all.add(p.geometry);if(p.material)all.add(p.material)});return all};
    const original=resources();
    const cue={heading:0,pickupStrength:1,reducedMotion:true,delta:.05,time:2,moving:false,danger:0};
    pip.update(cue);
    assert.ok(body.position.y>.90,'original torso visibly lifts for actual collection');
    assert.ok(head.rotation.x<-.2,'head looks toward the airborne physical prize');
    assert.ok(left.rotation.x<-.6 && right.rotation.x<-1.4,
      'existing hand and lantern physically celebrate real key pickup');
    assert.ok(scarf.rotation.x>.2,'physical scarf follows the original pose');
    assert.equal(key.visible,true,'the witnessed inventoried key is physically displayed in the connected glove');
    assert.equal(key.parent,pip.group.getObjectByName('glove'),
      'the celebratory key must remain a real wrist-held 3D object, not a screen sprite');
    assert.ok(left.rotation.x < -1.15 && left.rotation.z < -.5,
      'Pip lifts and opens its left arm to make the original collected key legible');
    assert.ok(key.rotation.x > 2.4 && key.scale.x > 1.55,
      'the genuinely collected connected key must be visibly turned and large enough for native mobile');
    assert.ok(key.position.x < -.24 && key.position.y > .02 && key.position.z > .16,
      'during witnessed reward, the same connected key is lifted outward from Pip’s face rather than covering it');

    // Render-camera-relative face acting is an ORIGINAL 3D rig movement, not
    // a sprite or autonomous steering command. Two actual viewpoints must
    // produce opposite signed joint turns, then clear without hidden data.
    pip.update({...cue,keyCameraPosition:{x:12,y:18,z:12}});
    assert.ok(body.rotation.y>.18 && head.rotation.y>.5,
      'pickup face acting must look toward the public render camera, not just raise the key');
    assert.deepEqual(pip.group.position.toArray(),[0,0,0],
      'camera-relative facial acting never moves the autonomous explorer');
    pip.update({...cue,keyCameraPosition:{x:-12,y:18,z:12}});
    assert.ok(body.rotation.y<-.18 && head.rotation.y<-.5,
      'the same physical actor turns left when the camera is on its left');
    pip.update({...cue,keyCameraPosition:{x:NaN,y:18,z:12}});
    assert.equal(body.rotation.y,0,'invalid camera direction cannot corrupt Pip pose');
    assert.equal(head.rotation.y,0,'invalid camera direction cannot leave a false face cue');
    pip.update({...cue,pickupStrength:0,keyCameraPosition:{x:12,y:18,z:12}});
    assert.equal(body.rotation.y,0,'an expired pickup cannot keep looking at the camera');
    assert.equal(head.rotation.y,0,'no public event means no staged hero facial turn');
    pip.update(cue);
    assert.deepEqual(pip.group.position.toArray(),[0,0,0],'presentation never changes engine actor position');
    const staticPose=[body.position.y,head.rotation.x,left.rotation.x,right.rotation.x,scarf.rotation.x];
    pip.update({...cue,time:700});
    assert.deepEqual([body.position.y,head.rotation.x,left.rotation.x,right.rotation.x,scarf.rotation.x],staticPose,
      'reduced-motion presentation must be static');
    pip.update({...cue,pickupStrength:0});
    assert.equal(body.position.y,.78,'clearing the public moment clears physical celebratory lift');
    assert.equal(scarf.rotation.x,0,'no ghost scarves after cue expiry');
    assert.equal(key.visible,false,'expired source event must remove the collected-key pose');
    assert.ok(Math.abs(key.position.x)<1e-9 && Math.abs(key.position.y+.075)<1e-9 && Math.abs(key.position.z-.14)<1e-9,
      'event expiry returns the attached key to its authentic locked-gate grip without stale offset');
    const trueThreat={...cue,attentionHeading:Math.PI/2,attentionStrength:1,danger:1,pickupStrength:1};
    pip.update(trueThreat);
    const threatPose=[body.position.y,head.rotation.x,right.rotation.x];
    pip.update({...trueThreat,pickupStrength:0});
    assert.deepEqual([body.position.y,head.rotation.x,right.rotation.x],threatPose,
      'a genuinely disclosed warden always overrides pickup delight');
    assert.equal(key.visible,false,'real nearby warden suppresses the pickup key');
    pip.update({...cue,keyHeading:Math.PI/2,keyStrength:1});
    const trueLockPose=[body.position.y,left.rotation.x,right.rotation.x];
    pip.update({...cue,keyHeading:Math.PI/2,keyStrength:1,pickupStrength:0});
    assert.deepEqual([body.position.y,left.rotation.x,right.rotation.x],trueLockPose,
      'an actually carried matching lock takes priority');
    assert.equal(key.visible,true,'the real matching closed-gate model remains authoritative');
    pip.update({...cue,gateHeading:Math.PI/2,gateStrength:1});
    const gatePose=[body.position.y,head.rotation.x,right.rotation.x];
    pip.update({...cue,gateHeading:Math.PI/2,gateStrength:1,pickupStrength:0});
    assert.deepEqual([body.position.y,head.rotation.x,right.rotation.x],gatePose,
      'actual gate opening remains a higher-priority physical event');
    assert.equal(key.visible,false,'a witnessed gate opening is not an additional key pickup');
    pip.update({...cue,result:'capture'});
    assert.equal(head.rotation.x,.28,'actual terminal failure never celebrates a pickup');
    assert.equal(key.visible,false,'terminal reality hides the pickup model');
    pip.update({...cue,pickupStrength:NaN});
    assert.equal(body.position.y,.78,'invalid source intensity never corrupts pose');
    for(let i=0;i<32;i++)pip.update({...cue,pickupStrength:i/32,time:i/30,reducedMotion:false});
    assert.deepEqual(resources(),original,'real 3D acting reuses every material and geometry');
    pip.dispose();
  }
});

test('Thornback has a real hinged tail silhouette and coral gape only for a disclosed close encounter',async()=>{
  const {createWarden}=await modulePromise;
  for(const balanced of [false,true]){
    const warden=createWarden({balanced});
    const root=warden.group.getObjectByName('guardian shell-tail root');
    const vanes=[-1,1].map(side=>({side,part:warden.group.getObjectByName(`articulated guardian tail vane ${side}`)}));
    const jaw=warden.group.getObjectByName('hinged guardian lower mandible');
    const throat=warden.group.getObjectByName('guardian disclosed coral throat');
    const head=warden.group.getObjectByName('warden mask');
    assert.ok(root?.isGroup && jaw?.isGroup && throat?.isGroup && head?.isGroup);
    assert.equal(root.parent?.name,'armored body','shell-tail is part of the original guardian, not a stage sprite');
    assert.equal(jaw.parent,head,'the jaw must be physically connected to the articulated face');
    assert.equal(throat.parent,head,'the real recessed throat moves with the head');
    assert.equal(throat.visible,false,'neutral gameplay does not signal an undisclosed opponent');
    for(const {part} of vanes){
      assert.ok(part?.isGroup && part.parent===root,'paired rigid fans use real shared shell hinges');
      assert.ok(part.children.some(child=>child.isMesh && child.geometry?.attributes?.position),
        'each fan must contain genuine three-dimensional armor, not a screen-space glyph');
    }
    const resources=()=>{const resources=new Set();warden.group.traverse(node=>{
      if(node.geometry)resources.add(node.geometry);
      if(node.material)resources.add(node.material);
    });return resources;};
    const originals=resources();
    const close={heading:0,attentionHeading:Math.PI/2,attentionStrength:.85,danger:1,
      reducedMotion:true,moving:false,time:20,delta:.05};
    warden.update(close);
    assert.equal(throat.visible,true,'only a real source-disclosed encounter reveals the physical mouth');
    assert.ok(jaw.rotation.x>.55,'the joined bronze jaw must physically open rather than just recolor the eyes');
    for(const {side,part} of vanes){
      assert.ok(part.rotation.z*side>.5,'the two tail fins must visibly fan outward');
      assert.ok(part.rotation.x<-.2,'the attached vanes must tilt into the physical silhouette');
    }
    const staticPose=[jaw.rotation.x,...vanes.flatMap(({part})=>part.rotation.toArray())];
    warden.update({...close,time:1000});
    assert.deepEqual([jaw.rotation.x,...vanes.flatMap(({part})=>part.rotation.toArray())],staticPose,
      'reduced-motion performance must be a stable 3D pose, not an inaccessible blink');
    warden.update({...close,time:1.4,reducedMotion:false});
    assert.ok(jaw.rotation.x>.55 && throat.visible,'motion-enabled pose also models real mouth opening');
    for(let frame=0;frame<35;frame++)
      warden.update({...close,time:frame/30,reducedMotion:false,moving:frame%2===0});
    assert.deepEqual(resources(),originals,'no per-frame geometry or materials may be allocated');
    for(const result of [undefined,'capture','escaped']){
      const noThreat={...close,attentionStrength:result?1:0,result,time:2,reducedMotion:true};
      warden.update(noThreat);
      assert.equal(jaw.rotation.x,0,'neutral or terminal state must close the mouth exactly');
      assert.equal(throat.visible,false,'source truth must clear all stale public warnings');
      for(const {part} of vanes){
        assert.equal(part.rotation.x,0,'the tail folds completely without hidden opponent persistence');
        assert.equal(part.rotation.y,0);
        assert.equal(part.rotation.z,0);
      }
    }
    assert.deepEqual(warden.group.position.toArray(),[0,0,0],
      'physical acting never moves the autonomous guardian in the authoritative world');
    warden.dispose(); warden.dispose();
    assert.equal(warden.group.children.length,0,'new joints and materials must clean up with the original rig');
  }
});


test('Pip and Thornback share immutable primitive buffers with exact last-owner disposal', async () => {
  const {createExplorer, createWarden, rigPrimitiveResourceStats} = await modulePromise;
  const baseline = rigPrimitiveResourceStats();
  for (const balanced of [true, false]) {
    const pip = createExplorer({balanced});
    const first = rigPrimitiveResourceStats();
    assert.ok(first.unique > baseline.unique && first.references > baseline.references,
      'a live Pip owns modeled primitive buffers');
    const thornback = createWarden({balanced});
    const together = rigPrimitiveResourceStats();
    assert.ok(together.references > first.references,
      'a live guardian has its own reference to actual primitive geometry');
    assert.ok(together.unique < first.unique + together.references - first.references,
      'at least one identical 3D primitive is genuinely shared, not silently duplicated');
    pip.dispose();
    const guardianOnly = rigPrimitiveResourceStats();
    assert.ok(guardianOnly.references > baseline.references,
      'disposing Pip cannot prematurely release Thornback geometry');
    thornback.group.traverse(child => {
      if (child.geometry) assert.ok(child.geometry.attributes.position.count > 0,
        'the remaining guardian retains valid source mesh buffers');
    });
    thornback.dispose();
    pip.dispose(); thornback.dispose();
    assert.deepEqual(rigPrimitiveResourceStats(), baseline,
      'final rig release returns primitive resource counts to their exact baseline');
  }
});

test('Pass349 raised Thornback face is two true overhead-readable connected optics with event-linked head lift',async()=>{
  const {createWarden,rigPrimitiveResourceStats}=await modulePromise;
  for(const balanced of [false,true]){
    const before=rigPrimitiveResourceStats();
    const warden=createWarden({balanced});
    const head=warden.group.getObjectByName('warden mask');
    const jaw=warden.group.getObjectByName('hinged guardian lower mandible');
    assert.ok(head?.isGroup && jaw?.parent===head,'new skull keeps its original animated physical mandible');
    const optics=[-1,1].map(side=>warden.group.getObjectByName(`rooted guardian raised optical lens ${side}`));
    const sockets=[-1,1].map(side=>warden.group.getObjectByName(`rooted guardian upper optical socket ${side}`));
    const cheeks=[-1,1].map(side=>warden.group.getObjectByName(`rooted guardian cheek armor ${side}`));
    for(let i=0;i<2;i++){
      const side=i===0?-1:1;
      const lens=optics[i],socket=sockets[i],cheek=cheeks[i];
      assert.ok(lens?.isMesh && socket?.isMesh && cheek?.isMesh,
        'each eye and structural cheek exists as actual original Three.js geometry');
      assert.equal(lens.parent,head,'eyes move with the physically hinged skull, not with the HUD/camera');
      assert.equal(socket.parent,head);
      assert.equal(cheek.parent,head);
      assert.ok(side*lens.position.x>.19 && lens.position.y>.30 && lens.position.z>.28,
        'full-size original left/right eye faces UP and FORWARD for native elevated gameplay cameras');
      assert.ok(socket.position.y>.24 && cheek.position.y>0);
      assert.ok(lens.geometry.getAttribute('position') && cheek.geometry.getAttribute('position'));
    }
    warden.reset();
    assert.equal(head.position.y,.27);
    assert.equal(head.position.z,.73);
    const eyePositions=optics.map(eye=>eye.position.toArray());
    const linkedMeshes=new Set();
    warden.group.traverse(node=>{if(node.geometry)linkedMeshes.add(node.geometry);});
    const witness={heading:0,attentionHeading:.9,attentionStrength:1,danger:1,
      encounterBeat:.49,moving:false,time:2,delta:.05,reducedMotion:true};
    warden.update(witness);
    assert.ok(head.position.y>.33 && head.position.z>.87,
      'actual witnessed brace must raise and advance the complete skull, not merely recolor pupils');
    const freeze=[head.position.y,head.position.z,...optics.flatMap(eye=>eye.position.toArray())];
    warden.update({...witness,time:90});
    assert.deepEqual([head.position.y,head.position.z,...optics.flatMap(eye=>eye.position.toArray())],
      freeze,'reduced motion preserves a stable physically readable gaze');
    warden.update({...witness,attentionStrength:0,encounterBeat:undefined});
    assert.equal(head.position.y,.27,'unwitnessed danger cannot leave a raised face');
    assert.equal(head.position.z,.73);
    assert.deepEqual(optics.map(eye=>eye.position.toArray()),eyePositions);
    for(let i=0;i<35;i++)warden.update({...witness,time:i/30,reducedMotion:false});
    const afterMeshes=new Set();
    warden.group.traverse(node=>{if(node.geometry)afterMeshes.add(node.geometry);});
    assert.deepEqual(afterMeshes,linkedMeshes,'full animated face must reuse geometry without frame allocations');
    warden.dispose();
    assert.deepEqual(rigPrimitiveResourceStats(),before,'new original mask shares and releases every geometry buffer');
  }
});
