'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');

test('T1 RED 415dae original ecology is a genuine unmodified historical Git object',()=>{
 assert.equal(gitBlob(fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-before-forest-understory-415dae.mjs'),'utf8')),
  '9febd47b9b02c84196c5735602ea1e2bb56571a8');
});

test('T1 physically planted forest floor has stronger 3D-coherent palette while original sunstone and public cues remain',async()=>{
 const THREE=await import('three'),{createWorld}=await import('../../public/snake-stream/world.mjs');
 const old=(await import('../fixtures/snake-t1-before-forest-understory-415dae.mjs')).createCourtyardEcology;
 const next=(await import('../../public/snake-stream/courtyard-ecology.mjs')).createCourtyardEcology;
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const priorWorld=createWorld(THREE,{width,height}),world=createWorld(THREE,{width,height});
  const first=old(THREE,{width,height,world:priorWorld}),second=next(THREE,{width,height,world});
  const map=scene=>{let data;scene.group.traverse(o=>{if(o.material?.map?.image?.width===1024)data=o.material.map.image.data});assert.ok(data);return data};
  try{
   const original=first.stats(), transformed=second.stats();
   // A purposefully more sculpted 3D fern CANOPY changes canopyHeight; all
   // original immutable geometry count, mesh, root site, landmark, pigment,
   // public game-cell, resource and material contracts remain exact.
   const {fernCanopyHeight: priorHeight,stoneAtlas: beforeAtlas,...oldContract}=original;
   const {fernCanopyHeight: newHeight,stoneAtlas: afterAtlas,...newContract}=transformed;
   assert.deepEqual(oldContract,newContract,'keep every actual source-exact fern/site/material/triangle and public-cell invariant');
   const {groveFraction: oldFraction,...oldStoneContract}=beforeAtlas;
   const {groveFraction: newFraction,...newStoneContract}=afterAtlas;
   assert.deepEqual(oldStoneContract,newStoneContract,'the same original owned atlas, dimensions and resource budget must remain');
   assert.ok(newFraction>oldFraction+.02,'actual planted stone catchment must extend rather than preserve old narrow-forest coverage');
   assert.ok(newHeight>priorHeight && newHeight<=.185,'the same 3D fern canopy is visibly taller but remains below the playable serpent/cues');
   assert.equal(second.stats().meshCount,1);assert.equal(second.stats().textures,0);assert.equal(second.stats().publicCellsMoved,0);
   const a=map(priorWorld),b=map(world);let n=0,greenOld=0,greenNew=0,richOld=0,richNew=0,changed=0,heart=0,heartN=0;
   for(let y=48;y<464;y+=4)for(let x=70;x<954;x+=4){
    const k=(y*1024+x)*4;const r=a[k],g=a[k+1],blue=a[k+2],R=b[k],G=b[k+1],B=b[k+2];
    n++;greenOld+=g-r>18;greenNew+=G-R>18;richOld+=g-r>35&&g-blue>50;richNew+=G-R>35&&G-B>50;
    changed+=Math.abs(R-r)+Math.abs(G-g)+Math.abs(B-blue)>35;
    if(Math.abs(x/1024-.52)<.075&&Math.abs(y/512-.51)<.095){
     heart+=R*.3+G*.55+B*.15;heartN++;
    }
    assert.equal(b[k+3],255,'never invent translucent route/cue covers');
   }
   assert.ok(greenNew>greenOld+n*.055,'substantially more native planted green coverage');
   assert.ok(richNew>richOld+n*.05,'material value and hue separate real forest from stone');
   assert.ok(changed>n*.23,'not an isolated shader-pixel tweak');
   assert.ok(heart/heartN>130,'readable ancient limestone landmark');
  }finally{first.dispose();second.dispose();priorWorld.dispose();world.dispose();}
 }
});
