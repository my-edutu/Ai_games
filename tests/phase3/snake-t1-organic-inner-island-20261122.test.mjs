import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createWorld, planCohesiveRuinsPaving, buildReclaimedCourtyardGlades } from '../../public/snake-stream/world.mjs';

// Strict native staging contracts only. A visual milestone additionally needs
// same-source real WebGL photographs, moving gameplay and the original GPU gate.
test('whole playable 3D island has a small number of broad quarry terraces, not an orthogonal tiled court',()=>{
  for(const [w,h,maxCount] of [[8,8,10],[28,16,12],[40,24,22]]) {
    const plan=planCohesiveRuinsPaving(w,h);
    assert.ok(plan.length<=maxCount,`${w}×${h}: ${plan.length} surviving orthogonal slabs`);
    const used=new Uint8Array(w*h);
    for(const s of plan){
      assert.ok(s.w>0&&s.h>0&&s.x>=0&&s.z>=0&&s.x+s.w<=w&&s.z+s.h<=h);
      for(let z=s.z;z<s.z+s.h;z++)for(let x=s.x;x<s.x+s.w;x++)used[z*w+x]++;
    }
    assert.ok(used.every(v=>v===1),'every authoritative cell must stay supported by exactly one limestone crown');
  }
});

test('three broad sculpted moss hollows and limestone outcrops are ACTUAL continuous THREE geometry in existing world batches',()=>{
  for(const [w,h] of [[8,8],[28,16],[40,24]]) {
    const moss=buildReclaimedCourtyardGlades(THREE,w,h,'moss');
    const bedrock=buildReclaimedCourtyardGlades(THREE,w,h,'bedrock');
    try {
      assert.equal(moss.index.count,3*(48*3+3*48*6),'three native cap + contiguous four-layer lip rings');
      assert.equal(bedrock.index.count,moss.index.count);
      const positions=moss.attributes.position;
      let centers=0,lo=Infinity,hi=-Infinity;
      for(let i=0;i<positions.count;i++){
        const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
        assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z));
        assert.ok(Math.abs(x)<w/2&&Math.abs(z)<h/2,'organic garden stays within genuine playable terrain');
        if(y>0)centers++;
        lo=Math.min(lo,y);hi=Math.max(hi,y);
      }
      assert.ok(centers>200&&lo<-.02&&hi<.02,`${w}×${h} needs physical elevated and recessed low relief`);
      const world=createWorld(THREE,{width:w,height:h});
      try {
        assert.equal(world.stats().staticMeshes,13,'reuse original complete visual world draws');
        assert.equal(world.stats().textures,4,'no new texture assets');
        const oldCourt=world.group.getObjectByName('Ruins / c3c4ad');
        assert.ok(oldCourt?.geometry?.index?.count>0,'existing gameplay contact tiles not replaced by fake terrain');
        // Two grounded existing coast material meshes now contain the original glade contours.
        const grown=world.group.children.filter(m=>m.isMesh && m.userData?.staticWorld && m!==oldCourt);
        assert.ok(grown.length>0);
      } finally { world.dispose(); }
    }finally {moss.dispose();bedrock.dispose()}
  }
});
