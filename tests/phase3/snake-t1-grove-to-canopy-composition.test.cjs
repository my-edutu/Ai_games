'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');

test('T1 coherent actual-board garden catchments and intact real 3D exterior without changing authority',async()=>{
  const THREE=await import('three');
  const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
  const {createLivingGarden}=await import('../../public/snake-stream/living-garden.mjs');
  const {createWorld}=await import('../../public/snake-stream/world.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const world=createWorld(THREE,{width,height});
    const before=world.group.children.find(o=>o.isMesh&&o.material?.map?.image?.width===1024)?.material.map;
    assert.ok(before,'the original world exclusively owns the still-used stone atlas');
    const original=Uint8Array.from(before.image.data);
    const grove=createCourtyardEcology(THREE,{width,height,world});
    const exterior=createLivingGarden(THREE,{width,height});
    const repeat=createLivingGarden(THREE,{width,height});
    try{
      assert.equal(grove.stats().meshCount,1);
      assert.equal(grove.stats().textures,0);
      assert.equal(grove.stats().publicCellsMoved,0);
      assert.equal(grove.stats().stoneAtlas.textureAdded,0);
      assert.ok(grove.stats().stoneAtlas.groveFraction>.09&&grove.stats().stoneAtlas.groveFraction<.43,
        'genuinely large connected multi-zone moss biomes rather than microscopic leaf freckles');
      const s=exterior.stats();
      assert.equal(s.meshCount,4,'no extra draw submission or shader/material pass');
      assert.equal(s.textures,1);
      assert.ok(s.triangles<22000,'preserve the unchanged complete 3D garden triangle budget');
      assert.equal(s.shoreSections,4);
      assert.equal(s.arcadeArches,4);
      assert.equal(s.canopyTrees,10);
      assert.equal(exterior.group.children.length,repeat.group.children.length);
      for(let j=0;j<exterior.group.children.length;j++){
        const first=exterior.group.children[j],second=repeat.group.children[j];
        for(const attr of ['position','color'])assert.deepEqual(first.geometry.getAttribute(attr).array,
          second.geometry.getAttribute(attr).array,'same public dimensions render bit-identical original art');
        const p=first.geometry.getAttribute('position');
        for(let i=0;i<p.count;i++){
          const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
          assert.ok(x<-width/2-.9||x>width/2+.9||z<-height/2-.9||z>height/2+.9,
            'zero exterior forest/ruin vertices enter a playable grid cell');
          assert.ok(Number.isFinite(y)&&y>=-4&&y<8);
        }
      }
      assert.notDeepEqual(before.image.data,original);
    }finally{grove.dispose();exterior.dispose();repeat.dispose();world.dispose();}
  }
});

test('the original genuine full-desktop render gate stays untouched and no hidden temporal/nondeterministic source is introduced',()=>{
  const strict=fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8');
  assert.match(strict,/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
  for(const name of ['living-garden.mjs','courtyard-ecology.mjs']){
    const src=fs.readFileSync(path.join(root,'public/snake-stream',name),'utf8');
    assert.doesNotMatch(src,/Math\.random\(|requestAnimationFrame|setInterval/);
  }
});
