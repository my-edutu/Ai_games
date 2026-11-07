'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('T1 physical multi-cell masonry and original field atlas describe the SAME real joints, not a hidden per-cell checkerboard', async () => {
  const THREE = await import('three');
  const { planCohesiveRuinsPaving, createWorld } = await import('../../public/snake-stream/world.mjs');
  for (const [width, height] of [[8,8],[28,16],[40,24]]) {
    const world=createWorld(THREE,{width,height});
    try {
      const mesh=world.group.getObjectByName('Ruins / c3c4ad');
      assert.ok(mesh?.isMesh && mesh.material.map?.image?.data,'original real 3D quarry and existing immutable baked material');
      const {data, width:mapW,height:mapH}=mesh.material.map.image;
      const light=(gx,gz)=>{
        const x=Math.min(mapW-1,Math.max(0,Math.floor(gx/width*mapW)));
        const z=Math.min(mapH-1,Math.max(0,Math.floor(gz/height*mapH)));
        const k=(z*mapW+x)*4;
        return (data[k]+data[k+1]+data[k+2])/3;
      };
      let inside=[],actual=[];
      const blocks=planCohesiveRuinsPaving(width,height);
      for(const slab of blocks){
        for(let line=1;line<slab.w;line++){
          const x=slab.x+line,z=slab.z+.5;
          if(x<1||x>width-1)continue;
          inside.push((light(x-.16,z)+light(x+.16,z))/2-(light(x-.005,z)+light(x+.005,z))/2);
        }
        if(slab.x>0&&slab.x<width){
          const x=slab.x,z=slab.z+.5;
          actual.push((light(x-.16,z)+light(x+.16,z))/2-(light(x-.005,z)+light(x+.005,z))/2);
        }
      }
      assert.ok(inside.length>=width/2,'real multi-cell slabs must expose plenty of formerly false joins');
      const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
      const hidden=mean(inside),real=mean(actual);
      assert.ok(hidden<2.3,`internal phantom one-cell atlas joins must vanish (board ${width}x${height}: ${hidden.toFixed(2)} luminance)`);
      assert.ok(real>hidden+1.8,`physical joint registration must remain legible (${real.toFixed(2)} versus ${hidden.toFixed(2)})`);
      assert.ok(world.stats().textures<20,'no supplementary texture/fragment/shader pass');
    } finally {world.dispose();}
  }
});
