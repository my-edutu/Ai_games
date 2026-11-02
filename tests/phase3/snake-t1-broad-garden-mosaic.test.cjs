'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
test('T1 10 rooted macro beds occupy actual cross-board 3D space without losing the original resource, landmark and cue gates',async()=>{
  const THREE=await import('three');
  const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const stage=createCourtyardEcology(THREE,{width,height});
    const reproducible=createCourtyardEcology(THREE,{width,height});
    try{
      const stats=stage.stats();
      assert.equal(stats.mosaicBedCount,10);
      assert.ok(stats.reclaimedMosaicTriangles>200&&stats.reclaimedMosaicTriangles<800,
        'large bounded true garden composition, not a shader pixel delta');
      assert.ok(stats.triangles>stats.reclaimedMosaicTriangles+200&&stats.triangles<3100,
        'keep unmodified original full-geometry budget');
      assert.equal(stats.meshCount,1,'still one statically cached stage mesh');
      assert.equal(stats.textures,0,'no additional texture, draw pass or licensed asset');
      assert.equal(stats.publicCellsMoved,0,'no mutated authoritative coordinates');
      assert.deepEqual(stats,reproducible.stats(),'public board sizes give exact same authored art');
      const mesh=stage.group.children[0],again=reproducible.group.children[0];
      assert.equal(mesh.castShadow,false);
      assert.equal(mesh.receiveShadow,true);
      assert.equal(mesh.userData.staticWorld,true);
      assert.equal(mesh.material.vertexColors,true);
      for(const key of ['position','color','normal'])
        assert.deepEqual(mesh.geometry.getAttribute(key).array,again.geometry.getAttribute(key).array,
          'repeatable stable '+key+' without hidden state or random calls');
      const pos=mesh.geometry.getAttribute('position');
      assert.equal(pos.count,stats.triangles*3);
      const sectors=new Set();
      const oldTriangles=stats.braidedSurfaceTriangles+stats.islandSurfaceTriangles;
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
        assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z));
        assert.ok(Math.abs(x)<=width/2-.67999&&Math.abs(z)<=height/2-.67999,
          'garden below the original genuine board coping');
        assert.ok(y>=.011&&y<=.021,
          'all decor below genuine head, belly, contact shadow and collision/event cues');
        const u=x/Math.max(.45,width*.16),v=z/Math.max(.45,height*.20);
        assert.ok(u*u+v*v>=.9999,'keep central sunlit gameplay marker uncovered');
        if(i>=oldTriangles*3){
          sectors.add(x<0?'west':'east');
          sectors.add(z<0?'north':'south');
        }
      }
      assert.deepEqual([...sectors].sort(),['east','north','south','west'],
        'true multi-zone authored stage, not one isolated visual tweak');
    }finally{
      stage.dispose();reproducible.dispose();
      assert.equal(stage.stats().disposed,true);
      assert.equal(stage.stats().meshCount,0);
      assert.equal(stage.group.children.length,0);
    }
  }
});
test('T1 cinematic world masonry remains governed by unchanged strict Chromium actual submission gate',()=>{
  const source=fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8');
  assert.match(source,/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
  const script=fs.readFileSync(path.join(root,'public/snake-stream/courtyard-ecology.mjs'),'utf8');
  assert.match(script,/BEGIN T1 WHOLE-COURT RECLAIMED MOSAIC BEDS/);
  assert.match(script,/triangle\(a,b,c,'mosaic',tint\)/);
});
