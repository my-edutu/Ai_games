'use strict';
const {stripR52Canopy}=require('../helpers/snake-r52-canopy-archive.cjs');
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {stripR44Fruit,reapplyR44Fruit}=require('../helpers/snake-fruit-archive.cjs');
const {stripR50Stone}=require('../helpers/snake-stone-archive.cjs');
const worldPath=path.resolve(__dirname,'../../public/snake-stream/world.mjs');
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const worldModule=s=>import('data:text/javascript;base64,'+Buffer.from(s).toString('base64'));
function fruit(world){
  const group=world.group.children.find(o=>o.isGroup&&o.children.length===6);
  assert.ok(group,'same original public-cell fruit group');
  return group;
}
test('R44 old Git blob exact, original fruit geometry resources and public cues unchanged on both boards',async()=>{
  const source=fs.readFileSync(worldPath,'utf8'),previous=stripR44Fruit(source);
  assert.equal(gitBlob(stripR52Canopy(stripR50Stone(previous))),'41f8b168bb765af04b4f893fdd44d80cbca1250b');
  assert.equal(reapplyR44Fruit(previous,source),source);
  const THREE=await import('three');
  const {createWorld:beforeFactory}=await worldModule(previous);
  const {createWorld:afterFactory}=await worldModule(source);
  for(const [width,height] of [[8,8],[28,16]]){
    const before=beforeFactory(THREE,{width,height}),after=afterFactory(THREE,{width,height});
    try{
      const a=fruit(before),b=fruit(after),oldBody=a.children[0],newBody=b.children[0];
      assert.equal(b.name,'Public harvest fruit');
      assert.equal(newBody.name,'Sculpted five-lobed fruit');
      assert.equal(newBody.geometry.attributes.position.count,oldBody.geometry.attributes.position.count);
      assert.equal(newBody.geometry.index?.count,oldBody.geometry.index?.count);
      assert.ok(newBody.scale.x<oldBody.scale.x*.84,'reduce oversized foreground reward');
      assert.ok(newBody.scale.x>oldBody.scale.x*.65,'retain visible reward');
      assert.ok(b.children[4].scale.equals(a.children[4].scale),'gold target ring is unchanged');
      assert.ok(b.children[4].position.equals(a.children[4].position),'gold target anchor unchanged');
      const oldVertices=oldBody.geometry.attributes.position,vertices=newBody.geometry.attributes.position;
      let changed=0;
      for(let i=0;i<vertices.count;i++){
        const pos=[vertices.getX(i),vertices.getY(i),vertices.getZ(i)];
        assert.ok(pos.every(Number.isFinite));
        if(pos.some((x,j)=>Math.abs(x-[oldVertices.getX(i),oldVertices.getY(i),oldVertices.getZ(i)][j])>1e-6))changed++;
      }
      assert.ok(changed>vertices.count*.60,'genuine sculpted vertices not a scaling-only illusion');
      for(const key of ['staticMeshes','staticInstances','drawObjects','geometries','materials','textures'])
        assert.equal(after.stats()[key],before.stats()[key],key+' resource parity');
      const normal={obstacles:[0],hazards:[{cell:1,active:true}],
        portals:[{entry:2,exit:width*height-2}],food:{cell:width*height-3,kind:'normal'}};
      for(const reducedMotion of [false,true]){
        before.update(normal,{time:2.4,reducedMotion});
        after.update(normal,{time:2.4,reducedMotion});
        assert.ok(b.position.equals(a.position),'public target location unchanged');
        assert.equal(b.visible,true);
        assert.equal(b.children[5].visible,false,'ordinary food crown is hidden');
        assert.equal(after.stats().hazards,before.stats().hazards);
        assert.equal(after.stats().portalEnds,before.stats().portalEnds);
        if(reducedMotion)assert.equal(b.position.y,0);
      }
      normal.food.kind='bonus';
      after.update(normal,{time:2.4,reducedMotion:true});
      assert.equal(b.children[5].visible,true,'bonus crown visible');
      normal.food=null;
      after.update(normal,{time:3,reducedMotion:false});
      assert.equal(b.visible,false,'food removal hides all geometry');
      assert.deepEqual(after.cameraOccluders,before.cameraOccluders);
    }finally{after.dispose();before.dispose();}
  }
});
