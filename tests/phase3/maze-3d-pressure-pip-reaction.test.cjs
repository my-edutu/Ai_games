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
      const opts={...neutral,pressureHeading:Math.PI/2,pressureStrength:1};
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
    pip.update({...opts,pressureProgress:.20,reducedMotion:true});
    const staticKnee=knee.rotation.x,staticLamp=lamp.scale.x;
    pip.update({...opts,pressureProgress:1,reducedMotion:true});
    assert.equal(knee.rotation.x,staticKnee,'reduced motion must retain one stable brace');
    assert.equal(lamp.scale.x,staticLamp);
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
