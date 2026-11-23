import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildLivingForestShoreTongues, createWorld } from '../../public/snake-stream/world.mjs';

const dimensions = [[8,8],[28,16],[40,24]];

for (const [width,height] of dimensions) {
  test(`T1 ${width}×${height}: a single 12-site 3D forest tongue system physically reaches ALL shores and the legal limestone apron`, () => {
    const stone = buildLivingForestShoreTongues(THREE,width,height,'bedrock');
    const loam = buildLivingForestShoreTongues(THREE,width,height,'moss');
    try {
      assert.equal(loam.userData.shoreTongues.length,12);
      assert.equal(stone.userData.shoreTongues.length,12);
      const unique = new Set(loam.userData.shoreTongues.map(t=>t.edge));
      assert.deepEqual([...unique].sort((a,b)=>a-b),[0,1,2,3]);
      for (const source of [stone,loam]) {
        assert.ok(source.index.count >= 12*16*6*2,'whole-shore landform must be physically triangulated, not a paint layer');
        const p=source.getAttribute('position');
        assert.ok(p.count>1000 && p.count<10000,'one bounded original geometry per whole stage');
        const normals=source.getAttribute('normal');
        let fullyInsideCount=0;
        for(let i=0;i<p.count;i++) {
          const [x,y,z]=[p.getX(i),p.getY(i),p.getZ(i)];
          for(const n of [x,y,z])assert.ok(Number.isFinite(n),
            'all physical shore geometry must have finite vertex positions');
          assert.ok(normals.getY(i)>.1,'real upward-facing ground needs lightable top normals');
          if(Math.abs(x)<=width/2-.5 && Math.abs(z)<=height/2-.5) {
            fullyInsideCount++;
            assert.ok(y<=.024,'real legal-cell contact may not intersect the serpent belly');
          }
        }
        assert.ok(fullyInsideCount>150,'real 3D habitat must physically cross into the playable courtyard');
        for (const [tIndex,tongue] of source.userData.shoreTongues.entries()) {
          // Compare the exact actual indexed vertex buffer to the metadata;
          // a storyboard or a disconnected fragment cannot satisfy this.
          const start=tIndex*17*7;
          const center=start+3,tip=start+16*7+3;
          assert.ok(Math.abs(p.getX(center)-tongue.inner.x)<.0001);
          assert.ok(Math.abs(p.getZ(center)-tongue.inner.z)<.0001);
          assert.ok(Math.abs(p.getX(tip)-tongue.outer.x)<.0001);
          assert.ok(Math.abs(p.getZ(tip)-tongue.outer.z)<.0001);
          assert.ok(Math.abs(p.getY(center)-tongue.innerTopY)<.0001);
          assert.ok(Math.abs(p.getY(tip)-tongue.outerTopY)<.0001);
          assert.ok(tongue.innerDepth >= 1.1, 'woodland must reach genuinely inside the visual stage');
          assert.ok(tongue.outerReach >= 2.5, 'the same habitat must overlap the original forest terrace');
          assert.ok(Math.abs(tongue.inner.x) <= width/2 && Math.abs(tongue.inner.z)<=height/2);
          assert.ok(source===loam ? tongue.innerTopY>=0 && tongue.innerTopY<=.025 :
            tongue.innerTopY>=-.09 && tongue.innerTopY<=0,
            'low-relief live loam and underlay must stay below actual serpent/cue clearance');
          assert.ok(tongue.outerTopY > tongue.innerTopY + .03,
            'true shoreland must slope into the existing raised native forest');
          assert.equal(tongue.sections,16);
          assert.equal(tongue.bands,7);
          assert.equal(Object.isFrozen(tongue),true,'scenery records must be immutable, not tied to live AI');
        }
      }
    } finally { stone.dispose(); loam.dispose(); }
  });
}

test('T1 full runtime reuses existing static draw materials rather than inserting extra rendering passes', () => {
  const game=createWorld(THREE,{width:28,height:16});
  try {
    assert.equal(game.stats().staticMeshes,13);
    assert.equal(game.stats().textures,4);
    assert.equal(game.group.userData.forestShoreReclamation,12);
  } finally {game.dispose();}
});
