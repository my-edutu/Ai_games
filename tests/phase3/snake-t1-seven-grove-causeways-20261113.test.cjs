'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const THREE=require('three');
const path='../../public/snake-stream/world.mjs';
const scenarios=[[8,8],[28,16],[40,24]];
for(const [w,h] of scenarios){
 test(`T1 seven actual groves have continuous above-sea stone-and-moss causeways ${w}x${h}`,async()=>{
  const {stageHeadlandAnchors,buildRootedGroveCauseways}=await import(path);
  assert.equal(typeof buildRootedGroveCauseways,'function','Need genuine physical causeways, not detached forest islands or a recolored rectangle');
  const anchors=stageHeadlandAnchors(w,h);
  assert.equal(anchors.length,7);
  const n=13, cross=7;
  const rock=buildRootedGroveCauseways(THREE,w,h,'bedrock');
  const moss=buildRootedGroveCauseways(THREE,w,h,'moss');
  try {
   const p=rock.getAttribute('position'), m=moss.getAttribute('position');
   assert.equal(p.count,anchors.length*n*cross,'Real seven-shoulder, thirteen-section geological ridge surfaces');
   assert.equal(m.count,anchors.length*n*3,'One continuous live moss mantle per ridge');
   assert.ok(rock.index.count/3<=1100,'Reuse static scene batches without enormous extra geometry');
   assert.ok(moss.index.count/3<=400);
   for(let shore=0;shore<anchors.length;shore++){
    const head=anchors[shore];let nearest=Infinity;
    for(let section=0;section<n;section++){
     const base=shore*n*cross+section*cross;
     const middle=base+3;
     const x=p.getX(middle),z=p.getZ(middle),y=p.getY(middle);
     assert.ok(Math.abs(x)>w/2+.49 || Math.abs(z)>h/2+.49,
       'No solid or visual route may intrude on the authoritative outer cell or portal ring');
     for(let k=0;k<cross;k++){
       const vx=p.getX(base+k),vz=p.getZ(base+k);
       assert.ok(Math.abs(vx)>w/2+.49 || Math.abs(vz)>h/2+.49,
         'Entire geological cross section stays strictly outside public cells');
     }
     assert.ok(y>-2.2,'Land bridge remains genuinely above physical sea level');
     assert.ok(p.getY(base)<-3.62 && p.getY(base+6)<-3.62,'Real stone skirts connect to drowned substrate');
     for(const at of [base+2,base+3,base+4]) assert.ok(p.getY(at)>-3.55,'Raised ridge cannot hide below the lake');
     if(section>0){
      const prev=base-cross;
      assert.ok(Math.hypot(x-p.getX(prev+3),z-p.getZ(prev+3))<2.6,'Visible path cannot teleport between successive rocks');
     }
     if(section===n-1)nearest=Math.hypot(x-head.x,z-head.z);
    }
    assert.ok(nearest<.15,'Original grove anchor must be rooted in SAME physical land bridge');
    assert.ok(m.getY(shore*n*3+(n-1)*3+1)>-2,'Forest floor reaches the original headland');
   }
  }finally{rock.dispose();moss.dispose();}
 });
}
