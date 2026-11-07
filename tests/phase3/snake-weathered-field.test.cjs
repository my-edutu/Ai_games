'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const noise = (x,y) => { const n=Math.sin(x*127.1+y*311.7)*43758.5453; return n-Math.floor(n); };
const brightness = (data,index) => (data[index]+data[index+1]+data[index+2])/3;

test('weathered garden slabs retain readable joints and authored fissures in one bounded original field map', async () => {
  const THREE=await import('three');
  const { createWorld }=await import('../../public/snake-stream/world.mjs');
  const width=28,height=16;
  const world=createWorld(THREE,{width,height});
  try {
    const tile=world.group.children.find(o=>o.isMesh&&o.material?.map?.image?.width===1024&&o.material.map.image.height===512);
    assert.ok(tile,'weathered slab texture must remain on a real 3D mesh');
    const texture=tile.material.map;
    assert.equal(texture.colorSpace,THREE.SRGBColorSpace);
    assert.equal(texture.generateMipmaps,true);
    assert.equal(texture.image.data.length,1024*512*4);
    const {data}=texture.image;
    const sample=(cx,cz,u,v) => {
      const x=Math.min(1023,Math.max(0,Math.floor((cx+u)/width*1024)));
      const y=Math.min(511,Math.max(0,Math.floor((cz+v)/height*512)));
      const p=(y*1024+x)*4;
      assert.equal(data[p+3],255,'authored slabs stay opaque');
      return brightness(data,p);
    };
    let weathered=0,fractured=0,analyzed=0;
    for(let z=1;z<height-1;z++)for(let x=1;x<width-1;x++){
      const middle=sample(x,z,.5,.5),edge=sample(x,z,.006,.5);
      if(middle-edge>4) weathered++;
      if(noise(x+127,z+97)<=.54) continue;
      analyzed++;
      const center=.2+noise(x+14,z+72)*.6;
      const range=[-.065,-.04,-.02,0,.02,.04,.065].map(delta=>sample(x,z,.5,Math.max(.01,Math.min(.99,center+delta))));
      const adjacent=Math.max(sample(x,z,.5,Math.max(.06,center-.15)),sample(x,z,.5,Math.min(.94,center+.15)));
      if(adjacent-Math.min(...range)>11) fractured++;
    }
    assert.ok(weathered>110,'individual limestone joints remain legible without changing the grid');
    assert.ok(analyzed>100 && fractured>analyzed*.4,'most selected cells have visibly darker, irregular interior fractures');
    const stats=world.stats();
    assert.equal(stats.staticMeshes,13,'additional per-cell draw calls are forbidden');
    assert.equal(stats.textures,4,'existing texture budget is unchanged');
    const before=world.stats();
    const empty={obstacles:[],hazards:[],portals:[],food:null};
    world.update(empty,{time:1.2,reducedMotion:false});
    world.update(empty,{time:2.4,reducedMotion:true});
    for(const key of ['drawObjects','geometries','materials','textures','staticMeshes'])assert.equal(world.stats()[key],before[key]);
  } finally {
    world.dispose();
    assert.equal(world.group.children.length,0);
  }
});
