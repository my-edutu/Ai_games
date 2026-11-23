'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');

test('T1 seven actual original woodland headlands are safely staged inside camera/fog corridor', async () => {
 const {stageHeadlandAnchors}=await import('../../public/snake-stream/world.mjs');
 assert.equal(typeof stageHeadlandAnchors,'function');
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const anchors=stageHeadlandAnchors(width,height),W=width/2,H=height/2;
  assert.equal(anchors.length,7);
  assert.equal(new Set(anchors.map(a=>a.name)).size,7);
  for(const a of anchors){
   assert.ok(a.height>=5.1&&a.height<=6.4&&a.rise>=5&&a.rise<=7.1);
   if(a.edge==='west')assert.ok(a.x+1.22*a.rise<-W-.8);
   if(a.edge==='east')assert.ok(a.x-1.22*a.rise>W+.8);
   if(a.edge==='north')assert.ok(a.z+.95*a.rise<-H-.8);
   if(a.edge==='south')assert.ok(a.z-.95*a.rise>H+.8);
   assert.ok(Math.hypot(Math.max(0,Math.abs(a.x)-W),Math.max(0,Math.abs(a.z)-H))<19,
    a.name+' must be seen by the real camera, not vanish in the horizon');
  }
 }
});

test('T1 full woodland re-stage retains original native resources, water and meaningful geometry',async()=>{
 const {createWorld}=await import('../../public/snake-stream/world.mjs');
 for(const [width,height,instances,triangles] of [[8,8,4045,59536],[28,16,7390,93582],[40,24,8661,110838]]){
  const world=createWorld(THREE,{width,height});
  try{
   const s=world.stats();
   assert.equal(s.staticInstances,instances);
   assert.equal(s.staticMeshes,13);assert.equal(s.drawObjects,33);
   assert.equal(s.geometries,33);assert.equal(s.materials,22);assert.equal(s.textures,4);
   const actual=world.group.children.filter(o=>o.userData?.staticWorld)
    .reduce((n,m)=>n+(m.geometry?.index?.count||m.geometry?.attributes?.position?.count||0)/3,0);
   assert.equal(actual,triangles,'do not remove native trees/leaves/ruins for acceptance');
   assert.ok(world.group.getObjectByName('Flowing water'));
  }finally{world.dispose();}
 }
});

test('T1 forest mosaic respects original narrow safe lip for all board sizes without losing authored weathering',async()=>{
 const {createWorld}=await import('../../public/snake-stream/world.mjs');
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const world=createWorld(THREE,{width,height});
  try{
   const court=world.group.children.find(o=>o.isMesh&&o.material?.map?.image?.width===1024);
   assert.ok(court);
   const p=court.geometry.getAttribute('position'),top=.487*.994;
   assert.equal(p.count,width*height*54);
   let weathered=0,quiet=0;
   for(let z=0;z<height;z++)for(let x=0;x<width;x++){
    const cx=x-(width-1)/2,cz=z-(height-1)/2;
    let floor=Infinity,ceil=-Infinity;
    for(let j=0;j<6;j++){
     const i=(z*width+x)*54+j,ex=top-Math.abs(p.getX(i)-cx),ez=top-Math.abs(p.getZ(i)-cz),y=p.getY(i);
     assert.ok(ex>=-.00001&&ex<=.07601&&ez>=-.00001&&ez<=.05601,
      'the real cell '+x+','+z+' lip cannot over-cut or cross a neighbor');
     assert.ok(Math.abs(y)<.00901,'real snake belly clearance is unchanged');
     weathered+=+(ex>.03&&ez>.02); quiet+=+(ex<.005&&ez<.005);
     floor=Math.min(floor,y);ceil=Math.max(ceil,y);
    }
    assert.ok(ceil-floor<.00001,'every playable flagstone top stays level');
   }
   assert.ok(weathered>width*height*.5,'retain meaningful physical weathered corners');
   assert.ok(quiet>width*height*.5,'preserve original quiet corners for natural diversity');
  }finally{world.dispose();}
 }
});