'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
test('T1 RED: two authentic immutable 367d before modules are Git-source exact',()=>{
  for(const [name,sha] of [
    ['snake-t1-before-ground-biome-367d.mjs','a3e43206973b8cf588f6dc4e271dc8a62f3f2d7b'],
    ['snake-t1-before-canopy-ring-367d.mjs','9d6f2f1654f1e52d11143e2941e1eb845ca24fd1']])
    assert.equal(blob(fs.readFileSync(path.join(root,'tests/fixtures',name),'utf8')),sha);
});
test('T1 whole-scene canopy ring visibly expands BOTH shores, retaining rear forest and exact geometry/texture budgets',async()=>{
  const THREE=await import('three');
  const old=(await import('../fixtures/snake-t1-before-canopy-ring-367d.mjs')).createLivingGarden;
  const current=(await import('../../public/snake-stream/living-garden.mjs')).createLivingGarden;
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const W=width/2,H=height/2;
    const measure=m=>{let west=0,east=0,rear=0,invalid=0;
      for(const mesh of m.group.children){const p=mesh.geometry.getAttribute('position');
        for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
          if(y>4.2&&Math.abs(x)>W+2&&z<H+4&&z>-H-3){if(x<0)west++;else east++;}
          if(y>4.3&&z<-H-1&&z>-H-8&&Math.abs(x)<W+3)rear++;
          if(![x,y,z].every(Number.isFinite)||
            !(x<-W-.9||x>W+.9||z<-H-.9||z>H+.9)||
            !(Math.abs(x)<W+15&&Math.abs(z)<H+18&&y>=-4&&y<8))invalid++;
        }
      }return {west,east,rear,invalid};
    };
    const before=old(THREE,{width,height}),after=current(THREE,{width,height}),again=current(THREE,{width,height});
    try{
      const a=measure(before),b=measure(after);
      assert.ok(a.west<350&&a.east<350,'real RED old underpopulated shores');
      assert.ok(b.west>1100&&b.east>1300&&b.west+b.east>4*(a.west+a.east),
        'source-authentic LEFT and RIGHT near-stage canopy geometry, not an atlas-pixel improvement');
      assert.ok(b.rear>1000&&b.rear>a.rear*.5,'actual ruins-backed rear forest survives intact');
      assert.equal(b.invalid,0,'no exterior vertex over any authentic game cell');
      const oldStats=before.stats(),newStats=after.stats();
      // The new complete-coast old-growth improvement adds exactly eight
      // original 28-triangle root arches. Every previous authored feature is
      // still present and the unchanged strict absolute budget remains below.
      assert.deepEqual({...newStats,rootRibbons:oldStats.rootRibbons,triangles:oldStats.triangles},
        oldStats,'preserve all existing authored leaves, rocks, lilies and materials');
      assert.equal(newStats.rootRibbons,oldStats.rootRibbons+8,'physically keep eight new old-growth arches');
      assert.equal(newStats.triangles,oldStats.triangles+224,'exact new native geometry, none deleted');
      assert.deepEqual(after.stats(),again.stats());
      assert.equal(after.stats().meshCount,4);assert.equal(after.stats().textures,1);
      assert.ok(after.stats().triangles<22000);
    }finally{before.dispose();after.dispose();again.dispose();}
  }
});
test('T1 ground biome opens the warm historic heart and deeply plants original floor without any new meshes, texture, fake cues or nondeterminism',async()=>{
  const THREE=await import('three');
  const {createWorld}=await import('../../public/snake-stream/world.mjs');
  const old=(await import('../fixtures/snake-t1-before-ground-biome-367d.mjs')).createCourtyardEcology;
  const current=(await import('../../public/snake-stream/courtyard-ecology.mjs')).createCourtyardEcology;
  const get=w=>{let map;w.group.traverse(o=>{if(o.material?.map?.image?.width===1024&&o.material.map.image.height===512)map=o.material.map;});assert.ok(map);return map;};
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const prevWorld=createWorld(THREE,{width,height}),world=createWorld(THREE,{width,height}),dupWorld=createWorld(THREE,{width,height});
    const oldMap=get(prevWorld),map=get(world),dupMap=get(dupWorld),startVersion=map.version;
    const oldEcology=old(THREE,{width,height,world:prevWorld});
    const newEcology=current(THREE,{width,height,world}),repeat=current(THREE,{width,height,world:dupWorld});
    try{
      assert.equal(map.version,startVersion+1,'existing owned atlas is regraded once, not per frame');
      assert.deepEqual(map.image.data,dupMap.image.data,'identical immutable public board yields identical pigment');
      assert.deepEqual(newEcology.stats().triangles,oldEcology.stats().triangles);
      assert.deepEqual(newEcology.stats().interstitialFernClumps,oldEcology.stats().interstitialFernClumps);
      assert.equal(newEcology.stats().meshCount,1);assert.equal(newEcology.stats().textures,0);
      assert.equal(newEcology.stats().publicCellsMoved,0);
      assert.ok(newEcology.stats().stoneAtlas.groveFraction>.3&&newEcology.stats().stoneAtlas.groveFraction<.43,
        'unchanged original connected grove occupancy envelope');
      let total=0,changed=0,light0=0,light1=0,core0=0,core1=0,coreN=0;
      for(let y=0;y<512;y+=4)for(let x=0;x<1024;x+=4){
        const i=(y*1024+x)*4,a=oldMap.image.data,b=map.image.data;
        const d=(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]))/3;
        if(d>24)changed++;
        const l0=.30*a[i]+.55*a[i+1]+.15*a[i+2],l1=.30*b[i]+.55*b[i+1]+.15*b[i+2];
        light0+=l0;light1+=l1;total++;
        if(Math.abs((x+.5)/1024-.52)<.09&&Math.abs((y+.5)/512-.51)<.12){core0+=l0;core1+=l1;coreN++;}
        assert.equal(b[i+3],255,'no fake translucent route obstruction');
      }
      assert.ok(changed/total>.48,'RED original atlas is not an isolated pixel tweak');
      assert.ok((light1-light0)/total>15,'whole original stone improves meaningful exposure');
      assert.ok((core1-core0)/coreN>15,'warm central stone clearing remains legible');
      const frame=Object.freeze({obstacles:Object.freeze([2]),food:Object.freeze({cell:12}),
        hazards:Object.freeze([{cell:15,active:true}]),portals:Object.freeze([{entry:1,exit:width*height-1}])});
      const frozen=JSON.stringify(frame);
      for(const reducedMotion of [false,true])world.update(frame,{time:3,reducedMotion});
      assert.equal(JSON.stringify(frame),frozen,'cosmetics never modify immutable public gameplay state');
    }finally{oldEcology.dispose();newEcology.dispose();repeat.dispose();prevWorld.dispose();world.dispose();dupWorld.dispose();}
  }
});
test('T1 original mandatory >=17 full scene desktop submissions/1s is not altered',()=>{
  const code=fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8');
  assert.match(code,/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
});
