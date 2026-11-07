'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');

test('T1 intentional three-course fern valleys have visible depth and coordinated broad on-court color, with real gameplay cells untouched', async()=>{
  const THREE=await import('three');
  const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
  const {createWorld}=await import('../../public/snake-stream/world.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const world=createWorld(THREE,{width,height});
    const original=world.group.children.find(o=>o.isMesh&&o.material?.map?.image?.width===1024)?.material?.map;
    assert.ok(original,'world retains its real baked 1024x512 stone, not another texture');
    const textureBefore=Uint8Array.from(original.image.data);
    const stage=createCourtyardEcology(THREE,{width,height,world});
    const repeat=createCourtyardEcology(THREE,{width,height});
    try{
      const s=stage.stats(),r=repeat.stats();
      assert.equal(s.fernBiomeCourses,3,'three authored winding bands rather than randomly placed particles');
      assert.equal(s.interstitialFernClumps,r.interstitialFernClumps);
      assert.ok(s.fernCanopyHeight>=.155&&s.fernCanopyHeight<=.185,'height must be visibly volumetric but stay below original collision clearance');
      assert.ok(s.triangles<3100&&s.meshCount===1&&s.textures===0);
      assert.ok(s.stoneAtlas.regraded&&s.stoneAtlas.pixels===1024*512&&s.stoneAtlas.textureAdded===0);
      assert.equal(s.stoneAtlas.sunstoneEtching,true,'warm non-emissive central ruin marker ties the garden valleys into one readable place');
      assert.equal(s.publicCellsMoved,0);
      assert.ok(s.fernBiomeRootedSites>=Math.floor(s.interstitialFernClumps*.72),'most growth belongs to one of three continuous visual garden courses');
      const bands=new Set();
      for(const {x,z} of s.fernCourseAnchors){
        const nx=x/(width/2),nz=z/(height/2);
        const curve=[-.57,.02,.59];
        const closest=curve.reduce((best,base,i)=>Math.min(best,Math.abs(nz-(base+.20*Math.sin(nx*3.7+i*1.67)+.07*Math.sin(nx*8.3-i*.91)))),Infinity);
        if(closest<.31){bands.add(nx<0?'west':'east');bands.add(nz<0?'north':'south');}
      }
      if(width===28){
        assert.ok(s.fernCourseAnchors.length>=85,'traversable-court scale environmental composition');
        assert.deepEqual([...bands].sort(),['east','north','south','west']);
      }
      assert.deepEqual(stage.group.children[0].geometry.getAttribute('position').array,
        repeat.group.children[0].geometry.getAttribute('position').array,'all art is repeatable from public dimensions');
      assert.notDeepEqual(original.image.data,textureBefore,'coherent underlying original-world material must change together with 3D plants');
    } finally {stage.dispose();repeat.dispose();world.dispose();}
  }
});

test('original strict genuine-full-WebGL one-second desktop gate and autoplay authority are not replaced',()=>{
  const source=fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8');
  assert.match(source,/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
  const ecology=fs.readFileSync(path.join(root,'public/snake-stream/courtyard-ecology.mjs'),'utf8');
  assert.doesNotMatch(ecology,/Math\.random\(|requestAnimationFrame|setTimeout|setInterval|AudioContext/);
  assert.match(ecology,/nearPublicCell/);
});
