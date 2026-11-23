'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const blob=text=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(text)+'\0').update(text).digest('hex');

test('T1 original authored riverbanks are actual garden-green curved 3D sites across the whole board, not grey route ribbons',async()=>{
  const THREE=await import('three');
  const {createCourtyardEcology,sculptRiparianBank}=await import('../../public/snake-stream/courtyard-ecology.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const garden=createCourtyardEcology(THREE,{width,height});
    const copy=createCourtyardEcology(THREE,{width,height});
    try{
      const stats=garden.stats();
      assert.deepEqual(stats,copy.stats());
      assert.equal(stats.meshCount,1);
      assert.equal(stats.textures,0);
      assert.equal(stats.publicCellsMoved,0);
      assert.ok(stats.triangles<3100);
      assert.ok(stats.interstitialFernClumps>=35);
      const c=garden.group.children[0].geometry.getAttribute('color');
      const p=garden.group.children[0].geometry.getAttribute('position');
      const count=stats.braidedSurfaceTriangles*3;
      let green=0, totalGreen=0;
      const sectors=new Set();
      for(let i=0;i<count;i++){
        const r=c.getX(i),g=c.getY(i),b=c.getZ(i);
        assert.ok([r,g,b].every(Number.isFinite));
        if(g>r*1.65&&g>b*1.15)green++;
        totalGreen+=g;
        const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
        assert.ok(y>=.011&&y<=.021,'all river relief is below gameplay and contact shadow');
        if(x< -width*.2)sectors.add('west');
        if(x>width*.2)sectors.add('east');
        if(z< -height*.17)sectors.add('north');
        if(z>height*.17)sectors.add('south');
      }
      assert.deepEqual([...sectors].sort(),['east','north','south','west']);
      assert.ok(green/count>.61,'majority real riparian triangles must read as living vegetation, not slate-grey paving');
      assert.ok(totalGreen/count>.205,'readable varied river green at ordinary broadcast distance');
      if(width===28){
        const widths=[];
        for(let channel=0;channel<3;channel++)for(let i=2;i<=58;i++){
          const progress=i/60;
          widths.push(sculptRiparianBank(-width/2+width*progress,channel,width,height,progress).widthAt);
        }
        assert.ok(widths.reduce((sum,v)=>sum+v,0)/widths.length>.30,
          'sheltered moss oxbows grow into actual broad 3D beds, not uniform thin route strokes');
        assert.ok(widths.filter(v=>v>.5).length/widths.length>.23,
          'generous coves alternate with narrow natural stone throats');
      }
      assert.deepEqual(garden.group.children[0].geometry.attributes.position.array,
        copy.group.children[0].geometry.attributes.position.array);
      assert.deepEqual(garden.group.children[0].geometry.attributes.color.array,
        copy.group.children[0].geometry.attributes.color.array);
    }finally{garden.dispose();copy.dispose();}
  }
});

test('T2 original single-PBR-body serpent has botanical dorsal jade and broken gilded scales rather than regular bright toy bands',async()=>{
  const THREE=await import('three');
  const {createSerpent}=await import('../../public/snake-stream/serpent.mjs');
  const actor=createSerpent(THREE),copy=createSerpent(THREE);
  try{
    const field=snake=>snake.group.getObjectByName('Continuous sculpted serpent body').material.map.image.data;
    const p=field(actor),q=field(copy);
    assert.deepEqual(p,q,'one fixed deterministic existing 1024x512 natural material');
    // Only the dorsal region is relevant: broad ivory belly scutes and
    // original reflective flank scales must remain rich, never be removed.
    let gold=0,jade=0,samples=0;
    for(let y=Math.floor(.12*512);y<Math.floor(.38*512);y++)for(let x=0;x<1024;x++){
      const i=(y*1024+x)*4,r=p[i],g=p[i+1],b=p[i+2];
      if(r>g*1.08&&r>120)gold++;
      if(g>r*1.90&&g>b*1.35)jade++;
      samples++;
    }
    assert.ok(gold/samples<.09,'gold is an interrupted dorsal leaf highlight, not a complete toy band');
    assert.ok(jade/samples>.87,'jade scales dominate the real dorsal body without altering belly scutes');
    assert.equal(actor.stats().textures,4,'unchanged original four maps');
    assert.deepEqual(actor.stats(),copy.stats(),'no extra GPU buffers, shaders or materials');
  }finally{actor.dispose();copy.dispose();}
});
