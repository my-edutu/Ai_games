'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
test('T1 garden has substantial authored green 3D silhouette between real cells, bounded geometry and no phantom collisions',async()=>{
  const THREE=await import('three');
  const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const current=createCourtyardEcology(THREE,{width,height});
    const repeat=createCourtyardEcology(THREE,{width,height});
    try{
      const stats=current.stats(), oldCount=stats.braidedSurfaceTriangles+stats.islandSurfaceTriangles+stats.reclaimedMosaicTriangles;
      assert.ok(stats.interstitialFernClumps>0,'the actual court needs 3D ferns, not just flat stone pigment');
      if(width===28)assert.ok(stats.interstitialFernClumps>=88,'whole-board distribution, not one tiny prop');
      assert.ok(stats.interstitialFernTriangles>=stats.interstitialFernClumps*6);
      assert.ok(stats.triangles<3100,'retain existing strictly bounded complete ecology mesh budget');
      assert.equal(stats.meshCount,1);assert.equal(stats.textures,0);assert.equal(stats.publicCellsMoved,0);
      const mesh=current.group.children[0],copy=repeat.group.children[0];
      assert.equal(mesh.userData.staticWorld,true);assert.equal(mesh.material.vertexColors,true);
      for(const attr of ['position','normal','color'])
        assert.deepEqual(mesh.geometry.getAttribute(attr).array,copy.geometry.getAttribute(attr).array,'public source deterministic '+attr);
      const pos=mesh.geometry.getAttribute('position');const oldVerts=oldCount*3;
      let high=0;const sectors=new Set();
      for(let i=oldVerts;i<pos.count;i++){
        const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
        assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z));
        assert.ok(Math.abs(x)<=width/2-.6799&&Math.abs(z)<=height/2-.6799);
        assert.ok(y>=.011&&y<=.185,'fern canopy below the serpent-belly clearance of genuine cells');
        if(y>.06)high++;
        const u=x/Math.max(.45,width*.16),v=z/Math.max(.45,height*.20);
        assert.ok(u*u+v*v>=1,'central sunny gameplay landmark never obscured');
        const nearestCentreX=Math.round(x+width/2-.5)+.5-width/2;
        const nearestCentreZ=Math.round(z+height/2-.5)+.5-height/2;
        assert.ok(Math.hypot(x-nearestCentreX,z-nearestCentreZ)>.435,
          '3D fronds cannot conceal fruits, portals, danger cues or actual snake occupancy centres');
        sectors.add(x<0?'west':'east');sectors.add(z<0?'north':'south');
      }
      assert.ok(high>stats.interstitialFernClumps*2,'real above-ground silhouettes across board');
      if(width===28)assert.deepEqual([...sectors].sort(),['east','north','south','west']);
      assert.equal(pos.count,stats.triangles*3);
    }finally{current.dispose();repeat.dispose();}
  }
});
test('T1 true-desktop strict full-scene 17 submissions remains unmodified; no adaptive or audio/gameplay gate shortcuts',()=>{
 const testSource=fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8');
 assert.match(testSource,/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
 const source=fs.readFileSync(path.join(root,'public/snake-stream/courtyard-ecology.mjs'),'utf8');
 assert.doesNotMatch(source,/Math\.random\(/);
 assert.doesNotMatch(source,/requestAnimationFrame|setInterval|AudioContext/);
});
