'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');

test('T1 true three-source rooted watershed branches visibly break the three straight parallel planting stripes',async()=>{
  const {watercourseCentre,sampleGardenWatershed}=await import('../../public/snake-stream/garden-watersheds.mjs');
  for(const course of [0,1,2]){
    const trunk=Array.from({length:33},(_,i)=>watercourseCentre(-.96+i*.06,course));
    assert.ok(trunk.every(value=>Number.isFinite(value)&&Math.abs(value)<=.89));
    assert.ok(Math.max(...trunk)-Math.min(...trunk)>.34, 'each rooted watercourse needs a visibly changing full-board bank');
    let actualBranch=0;
    for(let i=0;i<=200;i++){
      const x=-.95+i*.0095;
      const y=sampleGardenWatershed(x,watercourseCentre(x,course)+.20,28,16);
      assert.ok(y.distance>=0&&y.distance<=2);
      if(y.course===course&&y.branch&&y.distance<.09)actualBranch++;
    }
    assert.ok(actualBranch>=4,'actual divergent fern/soil network, not three cosmetically wavy straight bands');
  }
});

test('T1 unified watershed moves actual interstitial foliage and surface veins together without spending a draw, asset or cue',async()=>{
  const THREE=await import('three');
  const {createWorld}=await import('../../public/snake-stream/world.mjs');
  const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
  const {watercourseCentre}=await import('../../public/snake-stream/garden-watersheds.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const world=createWorld(THREE,{width,height}),one=createCourtyardEcology(THREE,{width,height,world});
    const clone=createCourtyardEcology(THREE,{width,height});
    try{
      const stat=one.stats();
      assert.equal(stat.meshCount,1);assert.equal(stat.textures,0);
      assert.equal(stat.publicCellsMoved,0);assert.ok(stat.triangles<3100);
      assert.equal(stat.fernBiomeCourses,3);
      assert.equal(stat.stoneAtlas.textureAdded,0);
      assert.equal(world.stats().staticMeshes,13);
      assert.equal(world.stats().textures,4);
      assert.deepEqual(one.group.children[0].geometry.getAttribute('position').array,
        clone.group.children[0].geometry.getAttribute('position').array,'owned static geometry is repeatable');
      assert.ok(stat.fernCourseAnchors.every(({x,z})=>Math.abs(x)<=width/2-.68&&Math.abs(z)<=height/2-.68));
      if(width===28){
        assert.equal(stat.interstitialFernClumps,130,'keep all original living rooted clumps');
        const away=stat.fernCourseAnchors.filter(({x,z})=>{
          const nx=x/(width/2),nz=z/(height/2);
          return [0,1,2].every(c=>Math.abs(nz-[-.57,.02,.59][c])>.25);
        });
        assert.ok(away.length>=20,'the living physical foliage must leave the old three parallel lanes');
      }
      // Every existing colour, geometry and event centre stays authoritative.
      const snapshot=Object.freeze({obstacles:Object.freeze([1]),hazards:Object.freeze([{cell:5,active:true}]),
        food:Object.freeze({cell:17}),portals:Object.freeze([{entry:4,exit:width*height-5}])});
      const before=JSON.stringify(snapshot);
      world.update(snapshot,{time:12});
      assert.equal(JSON.stringify(snapshot),before);
      assert.ok(watercourseCentre(-.45,1)!==watercourseCentre(.45,1));
    } finally{one.dispose();clone.dispose();world.dispose();}
  }
});
