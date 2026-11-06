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
      const opts={heading:0,time:0,delta:0,reducedMotion,
        pressureHeading:Math.PI/2,pressureStrength:1};
      pip.update(opts);
      assert.ok(body.position.y<.72,'Pip crouches as pressure opens');
      assert.ok(head.rotation.y>.5,'eyes face the real device');
      assert.ok(knee.rotation.x>.25,'leg is planted');
      assert.ok(lantern.rotation.y>.3,'actual attached lantern answers');
      pip.update({heading:0,time:0,delta:0,reducedMotion});
      assert.equal(head.rotation.y,0);
      assert.equal(body.position.y,.78);
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
