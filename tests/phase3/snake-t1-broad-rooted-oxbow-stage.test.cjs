'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
// These tests deliberately judge the COMPLETE physical courtyard and native
// materials, not source text-only paint substitutions or mocked render frames.
test('T1 broad connected rooted oxbow bays replace thin 3D mint tracks at three actual public board sizes', async()=>{
 const THREE=await import('three');
 const {createWorld}=await import('../../public/snake-stream/world.mjs');
 const {createCourtyardEcology,sculptRiparianBank}=await import('../../public/snake-stream/courtyard-ecology.mjs');
 for(const [width,height,minBay] of [[8,8,.64],[28,16,1.33],[40,24,1.69]]) {
  const world=createWorld(THREE,{width,height});
  const ecology=createCourtyardEcology(THREE,{width,height,world});
  try{
   const bank=ecology.group.children.find(o=>o.isMesh);
   assert.ok(bank && bank.geometry.attributes.color && bank.geometry.attributes.position,'real planted 3D rooted bank exists');
   const tris=ecology.stats().braidedSurfaceTriangles,colors=bank.geometry.attributes.color;
   let widthMax=0,lowMidGreen=0;
   for(let channel=0;channel<3;channel++)for(let i=0;i<=100;i++){
    const p=i/100,x=width*(p-.5);
    const sample=sculptRiparianBank(x,channel,width,height,p);
    assert.ok(sample.widthAt>.02&&sample.widthAt<height/2*.16+.3,'bounded original riverbank geometry');
    widthMax=Math.max(widthMax,sample.widthAt);
   }
   assert.ok(widthMax>minBay,`broad oxbow relief ${width}x${height}: ${widthMax}, not thin painted tracks`);
   let greenLead=0;
   for(let i=0;i<tris*3;i++){
    greenLead+=colors.getY(i)-colors.getX(i);
    assert.ok(colors.getY(i)>.015&&colors.getY(i)<.42,'no blanking/neon on physical banks');
   }
   greenLead/=tris*3;
   assert.ok(greenLead>.13,`pigment actually living moss, not pale/grey visual roads: ${greenLead}`);
   const native=world.stats(),living=ecology.stats();
   assert.equal(native.staticMeshes,13,'no new static draw batches');
   assert.equal(native.textures,4,'preserve all original material maps');
   assert.equal(living.meshCount,1,'use original single physical planted mesh');
   assert.ok(living.triangles<=3100,'preserve unchanged 3D ecology triangle resource budget');
   assert.equal(living.publicCellsMoved,0,'unchanged public collision/game positions');
  }finally{ecology.dispose();world.dispose();}
 }
});
test('T1 integrated original canopy is naturally shaded and strict full-scene browser threshold remains untouched', async()=>{
 const THREE=await import('three');
 const {createWorld}=await import('../../public/snake-stream/world.mjs');
 const world=createWorld(THREE,{width:8,height:8});
 try{
  const colors=[];
  world.group.traverse(o=>{if(o.userData?.staticWorld&&o.isMesh&&o.material?.color)colors.push(o.material.color.getHex());});
  assert.ok(colors.includes(0x638b4a)&&colors.includes(0x779e5d),'two original world forest leaf material batches shade rather than fluoresce');
 }finally{world.dispose();}
 const renderer=fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
 assert.match(renderer,/HemisphereLight\(0xd9f1e8, 0x35483e, 1\.38\)/,'whole-scene world/hero light paired with canopy');
 const browser=fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8');
 assert.match(browser,/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/,'mandatory original complete renderer gate unchanged');
});
