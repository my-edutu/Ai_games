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
