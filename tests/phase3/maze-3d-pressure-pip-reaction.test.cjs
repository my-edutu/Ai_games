'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const helper=import('../../public/ai-maze-escape/map-view.mjs');
const characterSource=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/characters.js'),'utf8');
const sceneSource=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
const three=pathToFileURL(path.resolve(__dirname,'../../node_modules/three/build/three.module.js')).href;
const rigs=import('data:text/javascript;base64,'+Buffer.from(
  characterSource.replace("'./vendor/three.module.js'",JSON.stringify(three))).toString('base64'));
const CELL=2.4,hero={x:0,z:0};
const snap=(cells,visibleCells,extra={})=>({width:7,height:7,currentCell:24,
  runToken:'pressure-acting',cells,visibleCells,...extra});
test('pressure acting requires genuine CURRENT public disclosure, never hidden or remembered state',async()=>{
  const {publicObservedPressureReaction:cue}=await helper;
  const cell={cell:25,trap:true,blocked:false}, s=snap([cell],[25]),before=JSON.stringify(s);
  assert.ok(Math.abs(cue(s,hero,CELL).strength-1)<1e-12);
  assert.deepEqual(cue(s,hero,CELL),cue(s,hero,CELL));
  assert.equal(JSON.stringify(s),before,'does not mutate the public snapshot');
  const diagonal=cue(snap([{cell:32,trap:true,blocked:false}],[32]),hero,CELL);
  assert.ok(diagonal && diagonal.strength>0 && diagonal.strength<.11);
  assert.equal(cue(snap([cell],[]),hero,CELL),null);
  assert.equal(cue(snap([cell],[24]),hero,CELL),null);
  assert.equal(cue(snap([{...cell,blocked:true}],[25]),hero,CELL),null);
  assert.equal(cue(snap([cell],[25],{result:{reason:'capture'}}),hero,CELL),null);
  assert.equal(cue(snap([cell],[25]),{x:NaN,z:0},CELL),null);
  assert.equal(cue(snap([cell],[25]),hero,0),null);
  assert.equal(cue(snap([{cell:26,trap:true,blocked:false}],[26]),hero,CELL),null);
  assert.equal(cue(snap([cell,{cell:23,trap:true,blocked:false}],[25,23]),hero,CELL).cell,23);
  assert.match(sceneSource,/publicObservedPressureReaction\(s,pose,CELL_SIZE\)/);
  assert.match(sceneSource,/pressureStrength:pressureCue\?\.strength\?\?0/);
});
test('full-body physical Pip acts, neutral/guardian/terminal clears, zero new meshes',async()=>{
  const {createExplorer,rigPrimitiveResourceStats}=await rigs;
  const base=rigPrimitiveResourceStats();
  for(const balanced of [false,true]){
    const pip=createExplorer({balanced});
    const body=pip.group.getObjectByName('breathing torso');
    const head=pip.group.getObjectByName('curious head');
    const knee=pip.group.getObjectByName('knee -1');
    const lantern=pip.group.getObjectByName('swinging lantern');
    const geometries=[];pip.group.traverse(o=>{if(o.isMesh)geometries.push(o.geometry)});
    for(const reducedMotion of [false,true]){
      const neutral={heading:0,time:0,delta:0,reducedMotion};
      pip.update(neutral);
      const idleHeadYaw=head.rotation.y, idleBodyY=body.position.y;
      const opts={...neutral,pressureHeading:Math.PI/2,pressureStrength:1,pressureProgress:1};
      if(reducedMotion){
        pip.update({...opts,pressureProgress:.20});
        assert.equal(knee.rotation.x,0,'reduced-motion cannot invent a planted boot at remote warning');
        assert.equal(body.position.y,idleBodyY,'uncontacted shutters cannot cause a static crouch');
      }
      pip.update(opts);
      assert.ok(body.position.y<.72,'Pip crouches as pressure opens');
      assert.ok(head.rotation.y>.5,'eyes face the real device');
      assert.ok(knee.rotation.x>.25,'leg is planted');
      assert.ok(lantern.rotation.y>.3,'actual attached lantern answers');
      pip.update(neutral);
      // Full-motion idle contains a deliberate natural eye/head wander; a
      // cleared pressure cue restores that authentic baseline, not zero yaw.
      assert.equal(head.rotation.y,idleHeadYaw);
      assert.equal(body.position.y,idleBodyY);
      assert.equal(knee.rotation.x,0);
      assert.equal(lantern.rotation.y,0);
      const guardian={...opts,attentionHeading:Math.PI/2,attentionStrength:1};
      pip.update(guardian);const y=body.position.y;
      pip.update({...guardian,pressureStrength:0});
      assert.equal(body.position.y,y,'a real warden overrides pressure');
      pip.update({...opts,result:'capture'});
      assert.equal(head.rotation.x,.28,'terminal actor truth overrides acting');
    }
    const after=[];pip.group.traverse(o=>{if(o.isMesh)after.push(o.geometry)});
    assert.deepEqual(after,geometries);
    pip.dispose();pip.dispose();
  }
  assert.deepEqual(rigPrimitiveResourceStats(),base);
});

test('Pip witnesses real pressure phases in order: gaze, rooted brace, linked lantern climax',async()=>{
  const {createExplorer,rigPrimitiveResourceStats}=await rigs;
  const baseline=rigPrimitiveResourceStats();
  for(const balanced of [false,true]){
    const pip=createExplorer({balanced});
    const head=pip.group.getObjectByName('curious head');
    const body=pip.group.getObjectByName('breathing torso');
    const knee=pip.group.getObjectByName('knee -1');
    const lamp=pip.group.getObjectByName('lantern cage');
    const opts={time:0,delta:0,heading:0,pressureHeading:Math.PI/2,pressureStrength:1};
    const geometry=[];pip.group.traverse(o=>{if(o.isMesh)geometry.push(o.geometry)});
    pip.update({...opts,pressureProgress:.20});
    const warned={head:head.rotation.y,body:body.position.y,knee:knee.rotation.x,lamp:lamp.scale.x};
    assert.ok(warned.head>.5,'published bronze relay draws actual eyes first');
    assert.equal(warned.knee,0,'early warning cannot invent bracing before shutters open');
    pip.update({...opts,pressureProgress:.55});
    assert.ok(body.position.y<warned.body && knee.rotation.x>.15,'knees and torso answer ivory shutter motion');
    assert.equal(lamp.scale.x,warned.lamp,'piston has not reached lantern climax yet');
    pip.update({...opts,pressureProgress:1});
    assert.ok(knee.rotation.x>.29 && lamp.scale.x>warned.lamp+.08,'physical piston finishes full connected acting');
    // Pass206 changed reduced motion to genuine PUBLIC contact: a warning
    // alone MUST NOT brace Pip while the real stationary jaws are closed.
    pip.update({...opts,pressureProgress:.20,reducedMotion:true});
    assert.equal(knee.rotation.x,0,'remote warning has no reduced-motion leg brace');
    assert.equal(lamp.scale.x,1,'remote warning has no reduced-motion lantern climax');
    pip.update({...opts,pressureProgress:1,reducedMotion:true});
    const staticKnee=knee.rotation.x,staticLamp=lamp.scale.x;
    assert.ok(staticKnee>.45 && staticLamp>1,'genuine contact produces the physical static pose');
    pip.update({...opts,pressureProgress:1,reducedMotion:true});
    assert.equal(knee.rotation.x,staticKnee,'reduced-motion contact pose stays still');
    assert.equal(lamp.scale.x,staticLamp,'reduced-motion lantern stays still');
    pip.update({...opts,pressureProgress:1,pressureStrength:0,reducedMotion:false});
    assert.equal(knee.rotation.x,0,'public withdrawal clears actual leg');
    assert.equal(lamp.scale.x,1,'public withdrawal clears actual lantern');
    const after=[];pip.group.traverse(o=>{if(o.isMesh)after.push(o.geometry)});
    assert.deepEqual(after,geometry,'no new source-rendered geometry from acting');
    pip.dispose();
  }
  assert.deepEqual(rigPrimitiveResourceStats(),baseline,'all shared buffers released');
  assert.match(sceneSource,/world\.animate\(elapsed,[\s\S]*?pressureProgress=pressureCue/);
  assert.match(sceneSource,/pressureProgress,/);
});

test('pressure warning, shutter brace and piston recoil are three independent source-witnessed full-body Pip beats',async()=>{
  const {createExplorer,rigPrimitiveResourceStats}=await rigs;
  const baseline=rigPrimitiveResourceStats();
  for(const balanced of [false,true]){
    const pip=createExplorer({balanced});
    try{
      const get=name=>{const joint=pip.group.getObjectByName(name);assert.ok(joint,name);return joint};
      const torso=get('breathing torso'),head=get('curious head'),knee=get('knee -1');
      const rightShoulder=get('shoulder 1'),leftShoulder=get('shoulder -1');
      const rightElbow=get('elbow 1'),rightHip=get('hip 1'),leftHip=get('hip -1'),lamp=get('lantern cage');
      const opts={time:0,delta:0,heading:0,pressureHeading:Math.PI/2,pressureStrength:1};
      const resourceShape=[];
      pip.group.traverse(o=>{if(o.isMesh)resourceShape.push(o.geometry)});
      pip.update({...opts,pressureStrength:0,pressureProgress:0});
      const rest={right:rightShoulder.rotation.x,left:leftShoulder.rotation.x,
        rightHip:rightHip.rotation.z,leftHip:leftHip.rotation.z,elbow:rightElbow.rotation.x,headX:head.rotation.x};
      pip.update({...opts,pressureProgress:.20});
      const warning={right:rightShoulder.rotation.x,headX:head.rotation.x,
        torsoY:torso.position.y,lamp:lamp.scale.x};
      assert.ok(warning.right<rest.right-.35,'the existing connected lantern shoulder anticipates the relay');
      assert.ok(warning.headX>rest.headX+.09,'Pip visibly spots the physical relay');
      assert.equal(knee.rotation.x,0,'no early fabricated foot plant');
      assert.equal(warning.lamp,1,'piston has not climbed yet');
      pip.update({...opts,pressureProgress:.55});
      assert.ok(knee.rotation.x>.25 && torso.position.y<warning.torsoY-.04,
        'the actual ivory shutter opening plants both legs and crouches Pip');
      assert.ok(rightHip.rotation.z>rest.rightHip+.1 && leftHip.rotation.z<rest.leftHip-.1,
        'both real feet plant outward as the published shutters open');
      assert.ok(leftShoulder.rotation.x<rest.left-.20,'free arm joins the defensive posture');
      assert.equal(lamp.scale.x,1,'no premature piston climax');
      const midElbow=rightElbow.rotation.x;
      pip.update({...opts,pressureProgress:1});
      assert.ok(knee.rotation.x>.5,'physical piston receives a rooted, wide-legged full-body response');
      assert.ok(rightElbow.rotation.x<midElbow-.30,'the connected lantern elbow releases toward the piston');
      assert.ok(lamp.scale.x>1.18,'attached caged lantern has a visible late physical climax');
      pip.update({...opts,pressureStrength:0,pressureProgress:0});
      assert.equal(rightShoulder.rotation.x,rest.right,'withdrawal clears warning arm');
      assert.equal(leftShoulder.rotation.x,rest.left,'withdrawal clears guarding arm');
      assert.equal(knee.rotation.x,0,'withdrawal releases foot');
      assert.equal(rightHip.rotation.z,rest.rightHip,'withdrawal returns the right planted hip');
      assert.equal(leftHip.rotation.z,rest.leftHip,'withdrawal returns the left planted hip');
      assert.equal(rightElbow.rotation.x,rest.elbow,'withdrawal restores attached elbow');
      assert.equal(lamp.scale.x,1,'withdrawal restores same caged lantern');
      const guardian={...opts,pressureProgress:1,attentionHeading:Math.PI/2,attentionStrength:1};
      pip.update(guardian);const guarded=torso.position.y;
      pip.update({...guardian,pressureStrength:0});
      assert.equal(torso.position.y,guarded,'public Warden retains priority over pressure performance');
      pip.update({...opts,pressureProgress:1,result:'capture'});
      assert.equal(head.rotation.x,.28,'terminal truth retains priority');
      const after=[];pip.group.traverse(o=>{if(o.isMesh)after.push(o.geometry)});
      assert.deepEqual(after,resourceShape,'no new CPU/GPU geometry during physical acting');
    }finally{pip.dispose()}
  }
  assert.deepEqual(rigPrimitiveResourceStats(),baseline,'shared physical rig resource lifecycle preserved');
});

test('a real public inspection holds Pip lantern-up without inventing a pressure strike or GPU objects',async()=>{
  const {createExplorer,rigPrimitiveResourceStats}=await rigs;
  const baseline=rigPrimitiveResourceStats();
  for(const balanced of [true,false]){
    const pip=createExplorer({balanced});
    try{
      const shoulder=pip.group.getObjectByName('shoulder 1');
      const knee=pip.group.getObjectByName('knee -1');
      const head=pip.group.getObjectByName('curious head');
      const geometry=[];pip.group.traverse(o=>{if(o.isMesh)geometry.push(o.geometry)});
      for(const reducedMotion of [false,true]){
        const visible={time:0,delta:0,heading:0,reducedMotion,
          pressureHeading:Math.PI/2,pressureStrength:1,pressureProgress:0};
        pip.update(visible);
        const ordinaryShoulder=shoulder.rotation.x;
        pip.update({...visible,pressureInspectionStrength:1});
        assert.ok(shoulder.rotation.x<ordinaryShoulder-.6,
          'authoritative public inspection raises the connected lantern before jaw contact');
        assert.ok(head.rotation.y>.5,'Pip looks toward the real visible pressure mechanism');
        assert.equal(knee.rotation.x,0,'an observation cannot invent an actual piston strike');
        pip.update(visible);
        assert.equal(shoulder.rotation.x,ordinaryShoulder,
          'lost public inspection clears the survey in the same frame');
        assert.equal(knee.rotation.x,0);
      }
      const after=[];pip.group.traverse(o=>{if(o.isMesh)after.push(o.geometry)});
      assert.deepEqual(after,geometry,'inspection reuses the existing full-body model');
    }finally{pip.dispose()}
  }
  assert.deepEqual(rigPrimitiveResourceStats(),baseline);
  assert.match(sceneSource,/s\.intent\?\.mode==='inspecting-hazard'/);
  assert.match(sceneSource,/pressureInspectionStrength,/);
});

test('connected Pip lantern genuinely reads at public diagonal distance, with no invented piston strike',async()=>{
  const {createExplorer,rigPrimitiveResourceStats}=await rigs;
  const budget=rigPrimitiveResourceStats();
  for(const balanced of [true,false]){
    const pip=createExplorer({balanced});
    try{
      const shoulder=pip.group.getObjectByName('shoulder 1');
      const knee=pip.group.getObjectByName('knee -1');
      for(const reducedMotion of [false,true]){
        const observed={time:0,delta:0,heading:0,reducedMotion,
          pressureHeading:Math.PI/2,pressureStrength:.079,pressureProgress:0};
        pip.update(observed);const ordinary=shoulder.rotation.x;
        pip.update({...observed,pressureInspectionStrength:.92});
        assert.ok(shoulder.rotation.x<ordinary-.5,'original lantern raises visibly during real survey');
        assert.equal(knee.rotation.x,0,'inspection does not invent a physical strike');
        pip.update({...observed,pressureStrength:0,pressureInspectionStrength:0});
        assert.equal(knee.rotation.x,0,'public state reset preserves original resting legs');
      }
    }finally{pip.dispose()}
  }
  assert.deepEqual(rigPrimitiveResourceStats(),budget);
  assert.match(sceneSource,/Math\.max\(\.92,pressureCue\.strength\)/);
});
