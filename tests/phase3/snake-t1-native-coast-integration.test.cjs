'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const gitBlob=src=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(src)+'\0').update(src).digest('hex');
test('T1 coast baseline is the exact live 136e Git blob, not a synthetic reduced garden',()=>{
 const original=fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-before-native-coast-136e.mjs'),'utf8');
 assert.equal(gitBlob(original),'a73b6b4570691dc1d52d945363b8f92e6e9c2cd2');
});
test('T1 sculpted coast folds the complete original terrain, roots eight actual forest crowns, preserves original authored cells and GPU assets',async()=>{
 const THREE=await import('three');
 const old=(await import('../fixtures/snake-t1-before-native-coast-136e.mjs')).createLivingGarden;
 const newGarden=(await import('../../public/snake-stream/living-garden.mjs')).createLivingGarden;
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const baseline=old(THREE,{width,height}),actual=newGarden(THREE,{width,height}),repeat=newGarden(THREE,{width,height});
  const W=width/2,H=height/2;
  function terrain(g){const moss=g.group.getObjectByName('Living garden / moss').geometry.attributes.position;
   let raised=0,highSides=0,invalid=0;for(let i=0;i<moss.count;i++){
    const x=moss.getX(i),y=moss.getY(i),z=moss.getZ(i);
    if(y>1.7)raised++;if(y>2.6&&(Math.abs(x)>W+1||Math.abs(z)>H+1))highSides++;
    if(![x,y,z].every(Number.isFinite) || !(Math.abs(x)>W+.9||Math.abs(z)>H+.9))invalid++;
   }return {raised,highSides,invalid};}
  try{
   const previous=terrain(baseline),next=terrain(actual),prevStats=baseline.stats(),current=actual.stats();
   assert.ok(next.raised>previous.raised*2+40,'whole four-coast visible upper rocky rainforest terraces must replace low edge'+JSON.stringify({previous,next}));
   assert.ok(next.highSides>previous.highSides+35,'real native elevating foliage-bearing stage, not painted 2D backdrop'+JSON.stringify({previous,next}));
   assert.equal(next.invalid,0);
   for(const key of ['triangles','meshCount','textures','canopyTrees','canopyLeaflets','fernFronds','rootRibbons','roundedBoulders','arcadeStones','waterGardenPads'])
    assert.equal(current[key],prevStats[key],key+' remains fully authored');
   assert.ok(current.triangles<22000,'unchanged total garden geometry ceiling');
   assert.deepEqual(current,repeat.stats(),'landscape generation must be deterministic on public board dimensions');
   for(let j=0;j<actual.group.children.length;j++)for(const prop of ['position','normal','color','uv'])
    assert.deepEqual(actual.group.children[j].geometry.attributes[prop].array,repeat.group.children[j].geometry.attributes[prop].array,'repeatable '+prop);
  }finally{baseline.dispose();actual.dispose();repeat.dispose();}
 }
});
