'use strict';
const { restorePreR45 } = require('../helpers/snake-r45-archive.cjs');
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const sourcePath=path.resolve(__dirname,'../../public/snake-stream/serpent.mjs');
const blocks=/^[ \t]*\/\/ BEGIN R37 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R37 [^\n]*\n/gm;
const r39Blocks=/^[ \t]*\/\/ BEGIN R39 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R39 [^\n]*\n/gm;
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const frozenPaths=Object.freeze([
  Object.freeze([{x:0,z:0},{x:0,z:-1},{x:0,z:-2},{x:0,z:-3}].map(Object.freeze)),
  Object.freeze([{x:8,z:5},{x:8,z:4}].map(Object.freeze)),
]);
const lids=serpent=>{
  const found=[];
  serpent.group.traverse(object=>{if(object.name==='Continuous upper eyelid')found.push(object);});
  assert.equal(found.length,2,'both existing eyelids retained');
  return found;
};
test('Round37 old-source red control: slower attached blink closes both actual upper lids without new meshes',async()=>{
  const THREE=await import('three');
  const content=fs.readFileSync(sourcePath,'utf8');
  assert.equal((content.match(blocks)||[]).length,2,'exact two bounded new additions');
  const predecessor=content.replace(blocks,'');
  assert.equal((content.match(r39Blocks) || []).length, 3, 'three new feeding blocks');
  assert.equal(blob(restorePreR45(predecessor.replace(r39Blocks, ''))),'636d51031c6e3f1b6d304d66ab2a34534f9fe506','exact Git predecessor');
  const {createSerpent:makeOld}=await import('data:text/javascript;base64,'+Buffer.from(predecessor).toString('base64'));
  const {createSerpent:makeNew}=await import('../../public/snake-stream/serpent.mjs');
  const before=makeOld(THREE),after=makeNew(THREE),untouched=JSON.stringify(frozenPaths);
  const originalResources=after.stats();
  const options={detail:'high',time:2.67,delta:1/60,danger:0,runToken:'r37',direction:{x:0,z:1},food:{x:2,z:4}};
  try{
    before.update(frozenPaths,options);
    after.update(frozenPaths,options);
    const oldLids=lids(before),newLids=lids(after);
    for(let i=0;i<2;i++){
      assert.equal(oldLids[i].position.y,0,'prior-source lid was fixed even at eye closure');
      assert.equal(oldLids[i].position.z,0,'prior-source lid had no forward sweep');
      assert.ok(newLids[i].position.y<-.10&&newLids[i].position.y>=-.1051,'upper lid rolls over eye in capture-time blink');
      assert.ok(newLids[i].position.z>.043&&newLids[i].position.z<=.0441,'rim glides toward eye front');
    }
    for(const key of ['geometries','materials','textures','bodyRings','bodyVertices','bodyTriangles','bufferBytes','paths']){
      assert.equal(after.stats()[key],before.stats()[key],'same production resource and body contract: '+key);
    }
    assert.equal(after.stats().paths,2,'portal fragments do not connect');
    assert.equal(JSON.stringify(frozenPaths),untouched,'public authoritative paths immutable');
    for(const time of [0,1,3.9,4.1,4.4,4.5,4.7,5.1,8,12,120]){
      after.update(frozenPaths,{...options,time});
      for(const lid of newLids){
        assert.ok(Number.isFinite(lid.position.y)&&lid.position.y<=0&&lid.position.y>=-.105001);
        assert.ok(Number.isFinite(lid.position.z)&&lid.position.z>=0&&lid.position.z<=.044001);
      }
    }
    after.update(frozenPaths,{...options,time:2.67,reducedMotion:true});
    for(const lid of newLids){assert.ok(lid.position.y===0,'reduced-motion never sweeps eyelids');assert.equal(lid.position.z,0);}
    after.update(frozenPaths,{...options,time:2.67,danger:1});
    for(const lid of newLids){assert.ok(lid.position.y===0,'danger keeps the original eyebrow cue clear');assert.equal(lid.position.z,0);}
    after.update([[{x:15,z:8},{x:15,z:7}]],{...options,time:2.67,runToken:'restart'});
    assert.equal(after.stats().paths,1,'restarts do not create portal links');
    after.update(frozenPaths,{...options,detail:'low',time:2.67,runToken:'restart'});
    assert.equal(after.stats().detail,'low','LOD body and face remain available');
    for(const key of ['geometries','materials','textures','bufferBytes']) assert.equal(after.stats()[key],originalResources[key],'no resource growth: '+key);
  }finally{before.dispose();after.dispose();}
  assert.equal(after.stats().disposed,true);
});
