'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
test('T1 existing four-shore foliage and old ivy hang from the actual continuous coastal ruin',async()=>{
 const THREE=await import('three');
 const stage=await import('../../public/snake-stream/world.mjs');
 assert.equal(typeof stage.sculptGardenEdgePlanting,'function');
 for(const [w,h,instances] of [[8,8,4045],[28,16,7390],[40,24,8661]]){
  for(let edge=0;edge<4;edge++){
   const len=edge<2?w:h, values=[];
   for(let along=-len/2+.45;along<len/2;along+=.47){
    const site=stage.sculptGardenEdgePlanting(w,h,edge,along);
    const outward=edge===0?-site.z-h/2:edge===1?site.z-h/2:edge===2?-site.x-w/2:site.x-w/2;
    assert.ok(outward>=.95&&outward<2.15,'original foliage remains outside all gameplay cells');
    values.push(outward);
    if(edge>0){
     const ivy=stage.sculptGardenEdgePlanting(w,h,edge,along,'ivy');
     const cliff=edge===1?stage.sculptFrontFrieze(w,h,along):stage.sculptCoastCourse(w,h,edge,0,along+h/2+.2);
     assert.ok(Math.abs(ivy.x-cliff.x)<1e-5&&Math.abs(ivy.z-cliff.z)<1e-5,'real vines are attached to native existing masonry');
    }
   }
   assert.ok(Math.max(...values)-Math.min(...values)>.18,'whole original shoreline is sculpted rather than a straight grid');
  }
  const world=stage.createWorld(THREE,{width:w,height:h});
  try{const stat=world.stats();assert.equal(stat.staticInstances,instances);assert.equal(stat.staticMeshes,13);assert.equal(stat.drawObjects,33);assert.equal(stat.textures,4);}finally{world.dispose();}
 }
 const code=fs.readFileSync(path.resolve(__dirname,'../../public/snake-stream/world.mjs'),'utf8');
 assert.match(code,/const foliageSite=sculptGardenEdgePlanting\(width,height,side,i,'foliage'\)/);
 assert.match(code,/const ivySite=sculptGardenEdgePlanting\(width,height,side,along,'ivy'\)/);
 const gate=fs.readFileSync(path.resolve(__dirname,'../browser/snake-stream.spec.cjs'),'utf8');
 assert.match(gate,/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
});
