'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');

test('T1 authentic exact 415dae shoreline RED source fixture is immutable',()=>{
 const original=fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-before-raincut-bluffs-415dae.mjs'),'utf8');
 assert.equal(gitBlob(original),'12a26a776ecec7e84a7b43cfe323c8ea1fc68366');
});

test('T1 four real shoreline 3D shoulders gain large native silhouette while preserving all assets and grid cells',async()=>{
 const THREE=await import('three');
 const before=(await import('../fixtures/snake-t1-before-raincut-bluffs-415dae.mjs')).createLivingGarden;
 const current=(await import('../../public/snake-stream/living-garden.mjs')).createLivingGarden;
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const W=width/2,H=height/2;
  const old=before(THREE,{width,height}),newer=current(THREE,{width,height}),repeat=current(THREE,{width,height});
  try{
   assert.deepEqual(newer.stats(),old.stats(),'retain all original cliff, foliage, ruin, lilies, trees and GPU budgets');
   assert.equal(newer.stats().meshCount,4);assert.equal(newer.stats().textures,1);assert.ok(newer.stats().triangles<22000);
   let changed=0,uplift=0,large=0,invalid=0;const sectors=new Set();
   for(let m=0;m<4;m++){
    const beforeGeometry=old.group.children[m].geometry;
    const afterGeometry=newer.group.children[m].geometry,dup=repeat.group.children[m].geometry;
    for(const name of ['position','color','uv','normal'])
     assert.deepEqual(afterGeometry.getAttribute(name).array,dup.getAttribute(name).array,'repeatable seeded scene '+name);
    const a=beforeGeometry.getAttribute('position'),b=afterGeometry.getAttribute('position');
    assert.equal(a.count,b.count,'all original geometry is retained');
    for(let i=0;i<b.count;i++){
     const x=b.getX(i),y=b.getY(i),z=b.getZ(i),dy=y-a.getY(i);
     changed+=Math.abs(dy)>.1;uplift+=dy>.35;large+=dy>.68;
     if(dy>.35)sectors.add(x<-W?'west':x>W?'east':z<-H?'rear':'front');
     if(![x,y,z].every(Number.isFinite)||!(x<-W-.9||x>W+.9||z<-H-.9||z>H+.9)||
         y< -4||y>=8||Math.abs(x)>=W+15||Math.abs(z)>=H+18)invalid++;
    }
   }
   assert.equal(invalid,0,'no original off-board forest vertex covers real gameplay');
   assert.ok(changed>500&&uplift>250&&large>75,'full four-shore geometry, not a pixel tweak');
   assert.deepEqual([...sectors].sort(),['east','front','rear','west']);
  }finally{old.dispose();newer.dispose();repeat.dispose();}
 }
});

test('T2 paired pupils and lids remain in one sculpted reptilian brow without any extra resources or snapshot writes',async()=>{
 const THREE=await import('three'),{createSerpent}=await import('../../public/snake-stream/serpent.mjs');
 const model=createSerpent(THREE),rim=[];
 model.group.traverse(o=>{if(o.name==='Inset eye rim')rim.push(o)});
 const budget=model.stats();
 try{
  assert.equal(rim.length,2);
  for(const eye of rim){
   const socket=eye.parent,high=socket.position.y+(eye.position.y+eye.scale.y)*socket.scale.y;
   assert.ok(socket.scale.y<=1.11&&socket.position.y>=.16&&socket.position.z>=.13);
   assert.ok(high>.26&&high<.32,'no elevated amphibian stalks');
   assert.ok(socket.getObjectByName('Amber iris'));assert.ok(socket.getObjectByName('Deep pupil'));
  }
  const cells=Object.freeze([{x:0,z:0},{x:-1,z:0},{x:-1,z:1},{x:-1,z:2}].map(Object.freeze));
  const unchanged=JSON.stringify(cells);
  for(const reducedMotion of [false,true])for(const detail of ['low','high'])
   model.update([cells],{detail,time:4,delta:1/60,reducedMotion,direction:{x:1,z:0},runToken:'visual'});
  assert.equal(JSON.stringify(cells),unchanged);
  for(const key of ['geometries','materials','textures','bufferBytes'])
   assert.equal(model.stats()[key],budget[key]);
 }finally{model.dispose();}
});

test('original strict 17 real complete desktop render-submission gate stays fully binding',()=>{
 const strict=fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8');
 assert.match(strict,/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
});
