'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
// T1 engineering acceptance only: the rock terraces and ruined retaining wall
// must share a genuinely undulating four-shore silhouette instead of the old
// disconnected square apron, without inventing obstacles or GPU draw batches.
test('T1 rock ruin courses, coping and native island shelf form a varied four-shore coast without entering the playable cells', async()=>{
  const THREE=await import('three');
  const {sculptCoastCourse,sculptCopeStone,buildErodedIslandShelfGeometry,createWorld}=
    await import('../../public/snake-stream/world.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const W=width/2,H=height/2;
    for(const edge of [0,1,2,3]){
      const len=edge<2?width:height;
      const copingOut=[],courseOut=[];
      for(let i=.5;i<len;i+=1){
        const p=sculptCopeStone(width,height,edge,i);
        const outward=edge===0?-p.z-H:edge===1?p.z-H:edge===2?-p.x-W:p.x-W;
        const depth=edge<2?p.sz/2:p.sx/2;
        assert.ok(outward-depth>.03,'decorative coping cannot enter an actual game cell');
        copingOut.push(outward);
      }
      for(let i=.5;i<len;i+=.8){
        const p=sculptCoastCourse(width,height,edge,1,i);
        const outward=edge===0?-p.z-H:edge===1?p.z-H:edge===2?-p.x-W:p.x-W;
        const depth=edge<2?p.sz/2:p.sx/2;
        assert.ok(outward-depth>.2,'exterior wall courses remain outside all gameplay cells');
        assert.ok(p.y+p.sy/2<.17,'old ruin cannot become a false gameplay obstacle');
        courseOut.push(outward);
      }
      assert.ok(Math.max(...copingOut)-Math.min(...copingOut)>.22,
        `${width}x${height} edge ${edge}: coping must read as battered coastline, not a ruler-straight rail`);
      assert.ok(Math.max(...courseOut)-Math.min(...courseOut)>.60,
        `${width}x${height} edge ${edge}: physical ruin courses need continuous bays and capes`);
    }
    const world=createWorld(THREE,{width,height});
    try{
      const stats=world.stats();
      assert.equal(stats.staticMeshes,13,'keep the pre-existing static batches');
      assert.equal(stats.textures,4,'no extra material maps');
      for(const layer of ['cliff','moss']){
        const mesh=buildErodedIslandShelfGeometry(THREE,width,height,layer);
        try{
          assert.equal(mesh.getAttribute('position').count,385,'reuse original 3D island vertex budget');
        }finally{mesh.dispose();}
      }
    }finally{world.dispose();}
  }
});
