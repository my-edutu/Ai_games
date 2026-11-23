'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');

// Same pinned native THREE 0.186.0 geometry and production world as browser.
// A source-code promise of cell-centre safety is inadequate: the serpent's
// physical 0.319m belly occupies the edges of every outermost gameplay cell.
test('T1 actual Three.js baked upper limestone triangles carry the real serpent body at all four shores',async()=>{
  const THREE=await import('three');
  const {createWorld}=await import('../../public/snake-stream/world.mjs');
  const r=.319; let total=0;
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const world=createWorld(THREE,{width,height});
    try{
      const stone=world.group.getObjectByName('Ruins / c3c4ad');
      assert.ok(stone?.isMesh,'actual native rock mesh, not synthetic painting');
      stone.updateWorldMatrix(true,true);
      const ray=new THREE.Raycaster();ray.far=3;
      let sampleCount=0,misses=[];
      const point=(x,z,caseName)=>{
        sampleCount++;
        ray.set(new THREE.Vector3(x,2,z),new THREE.Vector3(0,-1,0));
        const hit=ray.intersectObject(stone,false)[0];
        if(!hit||Math.abs(hit.point.y)>.02)misses.push({x,z,caseName,hitY:hit?.point?.y});
      };
      for(let row=0;row<height;row++)for(let col=0;col<width;col++){
        if(col>0&&col<width-1&&row>0&&row<height-1)continue;
        const x=col-(width-1)/2,z=row-(height-1)/2;
        point(x,z,`center ${col},${row}`);
        if(col===0)point(x-r,z,`west ${col},${row}`);
        if(col===width-1)point(x+r,z,`east ${col},${row}`);
        if(row===0)point(x,z-r,`north ${col},${row}`);
        if(row===height-1)point(x,z+r,`south ${col},${row}`);
        if((col===0||col===width-1)&&(row===0||row===height-1)){
          point(x+(col===0?-1:1)*r*Math.SQRT1_2,
            z+(row===0?-1:1)*r*Math.SQRT1_2,`corner ${col},${row}`);
        }
      }
      console.log(`${width}x${height}: actual Three.js whole-serpent stone supports ${sampleCount-misses.length}/${sampleCount} edge/diagonal rays`);
      assert.equal(misses.length,0,`Actual upper stone missing belly support: ${JSON.stringify(misses.slice(0,8))}`);
      assert.equal(world.stats().staticMeshes,13,'no new static renderer batches');
      assert.equal(world.stats().textures,4,'no new scene textures');
      total+=sampleCount;
    }finally{world.dispose();}
  }
  assert.equal(total,496,'verify every shore and four corner events for all three authoritative board sizes');
});
