'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');

test('T1 living ecotone is one deterministic, source-shared forest-to-limestone habitat across all real game cells',async()=>{
  const {sampleGardenEcotone}=await import('../../public/snake-stream/garden-biomes.mjs');
  for(const [w,h] of [[8,8],[28,16],[40,24]]){
    let forest=0,stone=0,heart=0;
    for(let z=0;z<h;z++)for(let x=0;x<w;x++){
      const u=(x+.5)/w,v=(z+.5)/h;
      const a=sampleGardenEcotone(u,v,w,h),b=sampleGardenEcotone(u,v,w,h);
      assert.deepEqual(a,b,'visual habitats are seeded/pure, never live-random or based on private game state');
      for(const n of Object.values(a)) assert.ok(Number.isFinite(n)&&n>=0&&n<=1);
      if(a.forest>.68)forest++;
      if(a.sunstone>.42)heart++;
      if(a.limestone>.40)stone++;
    }
    assert.ok(forest/(w*h)>.64,`an actual living canopy must cover the whole ${w}x${h} stage`);
    assert.ok(heart>=Math.min(4,Math.floor(w*h*.045)),'distinct real exposed sunstone');
    assert.ok(stone>0,'actual warm mineral habitat remains open');
  }
});

test('T1 original 3D stone AND its original 1024x512 material resolve to the same planted garden without losing original safe cells or GPU resources',async()=>{
  const THREE=await import('three');
  const {createWorld,sculptForestMosaicTile}=await import('../../public/snake-stream/world.mjs');
  const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const w=createWorld(THREE,{width,height}),ecology=createCourtyardEcology(THREE,{width,height,world:w});
    try{
      const tile=w.group.children.find(m=>m.name==='Ruins / c3c4ad');
      assert.ok(tile?.geometry.attributes.color && tile?.geometry.attributes.position);
      const p=tile.geometry.attributes.position,c=tile.geometry.attributes.color;
      let green=0,stoneHeart=0;
      for(let i=0;i<c.count;i++){
        const r=c.getX(i),g=c.getY(i),b=c.getZ(i);
        if(g-r>.20&&g-b>.15)green++;
        if(Math.abs(p.getX(i))<1.25&&Math.abs(p.getZ(i))<1.25&&r>.78&&g>.84)stoneHeart++;
      }
      assert.ok(green/c.count>.64,'rendered native slab vertices need strong connected moss/forest, not thin green stripes');
      assert.ok(stoneHeart>30,'the original real central limestone stays visibly open');
      let map;w.group.traverse(m=>{if(!map&&m.isMesh&&m.material?.map?.image?.width===1024)map=m.material.map;});
      assert.equal(map.image.height,512);const data=map.image.data;
      let n=0,alive=0;
      for(let z=0;z<512;z+=6)for(let x=0;x<1024;x+=6){const i=(z*1024+x)*4,r=data[i],g=data[i+1],b=data[i+2];n++;if(r<115&&g>r+25&&g>b+30)alive++;}
      assert.ok(alive/n>.61,`the entire original 3D stone atlas must belong to forest, not 3 green bands (${width}x${height} = ${alive/n})`);
      for(let z=0;z<height;z++)for(let x=0;x<width;x++){
        const m=sculptForestMosaicTile(x,z,width,height);
        const reach=(Math.abs(Math.cos(m.rotation))+Math.abs(Math.sin(m.rotation)))*m.scale;
        assert.ok(reach<=.99000001&&reach>.80,'true food, portal and danger cell centres never move');
      }
      assert.ok(w.stats().staticMeshes<=13,'no additional static draw passes or landscape meshes');
      assert.equal(ecology.stats().textures,0);assert.equal(ecology.stats().meshCount,1);
      assert.equal(ecology.stats().publicCellsMoved,0);
    }finally{ecology.dispose();w.dispose();}
  }
});
