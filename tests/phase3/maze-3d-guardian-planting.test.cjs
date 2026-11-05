'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

// Exercise the actual connected, batched production Three.js rig. No stub
// posture function, fake encounter frame, solver data, or screenshot substitute.
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const production=import('data:text/javascript;base64,'+
  Buffer.from(source.replace("'./vendor/three.module.js'",JSON.stringify(three))).toString('base64'));

test('witnessed guardian brace physically plants connected forelegs before late shell release',async()=>{
  const {createWarden}=await production;
  for(const balanced of [false,true]) for(const reducedMotion of [false,true]){
    const guardian=createWarden({balanced});
    const body=guardian.group.getObjectByName('armored body');
    const head=guardian.group.getObjectByName('warden mask');
    const hip=guardian.group.getObjectByName('leg 1 0');
    const knee=hip?.getObjectByName('claw knee');
    const pincer=knee?.getObjectByName('foreleg pincer 1');
    const wing=guardian.group.getObjectByName('flared elytron 1');
    assert.ok(body&&head&&hip&&knee&&pincer&&wing,'the full original articulated guardian is required');
    const resourceSet=()=>{
      const resources=new Set();
      guardian.group.traverse(object=>{if(object.geometry)resources.add(object.geometry);if(object.material)resources.add(object.material)});
      return resources;
    };
    const originalResources=resourceSet();
    const cue={heading:0,attentionHeading:.5,attentionStrength:.8,
      moving:false,danger:1,time:1,delta:0,reducedMotion};
    const pose=()=>[hip.rotation.x,knee.rotation.x,pincer.rotation.y,
      head.rotation.x,body.position.y,wing.rotation.z];
    guardian.update({...cue,encounterBeat:0});
    const noticed=pose();
    guardian.update({...cue,encounterBeat:.5});
    const planted=pose();
    assert.ok(planted[0]<noticed[0]-.35,'original foreleg must visibly fold in a true brace');
    assert.ok(planted[1]>noticed[1]+.25,'connected knee counters the planted foreleg');
    assert.ok(planted[2]>noticed[2]+.20,'modeled physical pincer joins the defensive plant');
    assert.ok(planted[3]<noticed[3]-.12,'original bronze mask crouches before release');
    assert.ok(planted[4]<noticed[4]-.08,'body visibly settles in its connected contact');
    guardian.update({...cue,encounterBeat:1});
    const released=pose();
    assert.ok(released[0]>planted[0]+.2,'foreclaws lift after shell release begins');
    assert.ok(released[3]>planted[3]+.12,'mask raises after the grounded brace');
    assert.ok(released[5]>planted[5]+.55,'existing armor still gives its dominant late reveal');
    guardian.update({...cue,encounterBeat:1});
    assert.deepEqual(pose(),released,'same public clock must replay precisely');
    guardian.update({...cue,attentionStrength:0,attentionHeading:undefined,encounterBeat:1});
    const withdrawn=pose();
    guardian.update({...cue,attentionStrength:0,attentionHeading:undefined});
    assert.deepEqual(pose(),withdrawn,'missing witness clears all new physical cues');
    assert.equal(hip.rotation.x,0,'old motion must not persist in unseen guardians');
    assert.equal(knee.rotation.x,0);
    assert.equal(pincer.rotation.y,0);
    assert.equal(wing.rotation.z,0);
    guardian.update({...cue,result:'capture',encounterBeat:1});
    assert.equal(hip.rotation.x,0,'real terminal state overrides cosmetic actions');
    assert.equal(pincer.rotation.y,0);
    assert.equal(wing.rotation.z,0);
    assert.deepEqual(resourceSet(),originalResources,'render updates must allocate no new graphics resources');
    guardian.dispose();
    assert.equal(guardian.group.children.length,0);
  }
});

test('public brace sweeps both existing armored foreclaws sideways and withdraws at release',async()=>{
  const {createWarden}=await production;
  for(const balanced of [false,true]) for(const reducedMotion of [false,true]){
    const warden=createWarden({balanced});
    const pair=[-1,1].map(side=>{
      const hip=warden.group.getObjectByName(`leg ${side} 0`);
      const knee=hip?.getObjectByName('claw knee');
      const pincer=knee?.getObjectByName(`foreleg pincer ${side}`);
      assert.ok(hip&&knee&&pincer,'existing connected foreclaw hierarchy remains intact');
      assert.ok(pincer.children.some(child=>child.isMesh
        && child.material?.color?.getHexString()==='a17b5b'),
        'physical bronze buckler stays connected to the modeled pincer');
      return {side,hip,knee,pincer};
    });
    const cue={heading:0,attentionHeading:.5,attentionStrength:.8,
      danger:1,moving:false,time:1,delta:0,reducedMotion};
    const pose=()=>pair.map(({side,hip,knee,pincer})=>[
      hip.rotation.z*side,knee.rotation.z*side,pincer.rotation.z*side
    ]);
    warden.update({...cue,encounterBeat:0});
    const recognition=pose();
    warden.update({...cue,encounterBeat:.5});
    const brace=pose();
    warden.update({...cue,encounterBeat:1});
    const release=pose();
    for(let i=0;i<2;i++){
      assert.ok(brace[i][0]>recognition[i][0]+.25,'front shoulder widens in the middle beat');
      assert.ok(brace[i][1]<recognition[i][1]-.12,'connected knee counter-rotates');
      assert.ok(brace[i][2]>recognition[i][2]+.25,'armored pincer swings outward');
      assert.ok(release[i][0]<brace[i][0]-.19,'foreclaw retracts for shell release');
      assert.ok(release[i][2]<brace[i][2]-.19,'bronze buckler clears on release');
    }
    warden.update({...cue,encounterBeat:1});
    assert.deepEqual(pose(),release,'same public clock gives exactly the same rig pose');
    warden.update({...cue,attentionHeading:undefined,attentionStrength:0,encounterBeat:1});
    for(const {hip,knee,pincer} of pair){
      assert.equal(hip.rotation.z,0,'withdrawal clears the flared foreleg');
      assert.equal(knee.rotation.z,0,'withdrawal clears the planted knee');
      assert.equal(pincer.rotation.z,0,'withdrawal clears the physical guard');
    }
    warden.update({...cue,result:'capture',encounterBeat:1});
    for(const {hip,knee,pincer} of pair){
      assert.equal(hip.rotation.z,0,'terminal outcome cancels the foreleg spread');
      assert.equal(knee.rotation.z,0,'terminal outcome cancels the counter-fold');
      assert.equal(pincer.rotation.z,0,'terminal outcome cancels the buckler sweep');
    }
    warden.dispose();
    assert.equal(warden.group.children.length,0);
  }
});


test('real paired shoulder guards rise during a witnessed brace and fold before shell release',async()=>{
  const {createWarden}=await production;
  for(const balanced of [false,true]) for(const reducedMotion of [false,true]){
    const guardian=createWarden({balanced});
    const guards=[-1,1].map(side=>{
      const guard=guardian.group.getObjectByName('articulated guardian shoulder guard '+side);
      assert.ok(guard && guard.children.filter(child=>child.isMesh).length>=2,
        'each guard is permanent connected 3D geometry, not a HUD effect');
      return guard;
    });
    const resources=new Set();
    guardian.group.traverse(node=>{
      if(node.geometry) resources.add(node.geometry);
      if(node.material) resources.add(node.material);
    });
    const cue={heading:0,attentionHeading:.5,attentionStrength:.8,
      moving:false,danger:1,time:1,delta:0,reducedMotion};
    const pose=()=>guards.map(guard=>[guard.rotation.x,guard.rotation.z]);
    guardian.update({...cue,encounterBeat:0});
    const first=pose();
    assert.deepEqual(first,[[0,0],[0,0]],'ordinary recognized guard begins folded');
    guardian.update({...cue,encounterBeat:.5});
    const brace=pose();
    assert.ok(brace.every(pair=>pair[0]<-.55),
      'the center 390px public encounter should lift both connected plates');
    assert.ok(brace[0][1]<-.60 && brace[1][1]>.60,
      'rooted armor must fan outward on opposite sides, not simply glow');
    guardian.update({...cue,encounterBeat:1});
    const release=pose();
    assert.ok(release.every((pair,i)=>pair[0]>brace[i][0]+.45),
      'paired panels fold again when the real carapace releases');
    guardian.update({...cue,encounterBeat:1});
    assert.deepEqual(pose(),release,'same public clock replays without drift');
    guardian.update({...cue,attentionHeading:undefined,attentionStrength:0,encounterBeat:1});
    assert.deepEqual(pose(),[[0,0],[0,0]],
      'lost public guardian testimony must reset both physical shields');
    guardian.update({...cue,result:'capture',encounterBeat:1});
    assert.deepEqual(pose(),[[0,0],[0,0]],
      'terminal result cannot expose an unwitnessed threat through the rig');
    const after=new Set();
    guardian.group.traverse(node=>{
      if(node.geometry) after.add(node.geometry);
      if(node.material) after.add(node.material);
    });
    assert.deepEqual(after,resources,'updates do not allocate geometry or material');
    guardian.dispose();
    assert.equal(guardian.group.children.length,0);
  }
});


test('Pip physically guards its face at the same witnessed Thornback middle beat without a false action',async()=>{
  const {createExplorer}=await production;
  for(const balanced of [false,true]) for(const reducedMotion of [false,true]){
    const pip=createExplorer({balanced});
    const shoulder=pip.group.getObjectByName('shoulder -1');
    const elbow=pip.group.getObjectByName('elbow -1');
    const eye=pip.group.getObjectByName('eye -1');
    assert.ok(shoulder&&elbow&&eye,'connected original glove, shoulder and eyes exist in the real rig');
    const resources=new Set();
    pip.group.traverse(node=>{
      if(node.geometry) resources.add(node.geometry);
      if(node.material) resources.add(node.material);
    });
    const cue={heading:0,attentionHeading:.5,attentionStrength:.8,
      danger:1,moving:false,time:1,delta:0,reducedMotion};
    const pose=()=>[shoulder.rotation.x,shoulder.rotation.z,elbow.rotation.x,eye.scale.y];
    pip.update({...cue,guardianEncounterBeat:0});
    const notice=pose();
    pip.update({...cue,guardianEncounterBeat:.5});
    const brace=pose();
    assert.ok(brace[0]<notice[0]-.55,'connected off-hand rises into an actual defensive pose');
    assert.ok(brace[1]>notice[1]+.80,'forearm crosses toward Pip rather than expanding the viewport edge');
    assert.ok(brace[2]<notice[2]-.30,'connected wrist folds toward the face');
    assert.ok(brace[3]<notice[3]-.30,'physical eyes react by narrowing during the same public brace');
    pip.update({...cue,guardianEncounterBeat:1});
    const shell=pose();
    assert.ok(shell[0]>brace[0]+.35 && shell[1]<brace[1]-.55,
      'Pip withdraws the guard as the actually disclosed carapace releases');
    pip.update({...cue,guardianEncounterBeat:1});
    assert.deepEqual(pose(),shell,'same public source beat replays without drift');
    pip.update({...cue,attentionHeading:undefined,attentionStrength:0,
      guardianEncounterBeat:1});
    const withdrawn=pose();
    pip.update({...cue,attentionHeading:undefined,attentionStrength:0});
    assert.deepEqual(pose(),withdrawn,'hidden guardian clock must not affect the character');
    pip.update({...cue,result:'capture',guardianEncounterBeat:.5});
    const terminal=pose();
    assert.deepEqual(terminal.slice(0,3),withdrawn.slice(0,3),
      'terminal result clears all newly staged shoulder/elbow defense');
    assert.equal(terminal[3],.32,
      'the existing real loss expression closes Pip eyes; do not replace it with a neutral gaze');
    const after=new Set();
    pip.group.traverse(node=>{
      if(node.geometry) after.add(node.geometry);
      if(node.material) after.add(node.material);
    });
    assert.deepEqual(after,resources,'render update cannot allocate new geometry or materials');
    pip.dispose();
    assert.equal(pip.group.children.length,0);
  }
});
