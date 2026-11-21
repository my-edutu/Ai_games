import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createWorld } from '../../public/snake-stream/world.mjs';
import { createCourtyardEcology, sculptRiparianBank } from '../../public/snake-stream/courtyard-ecology.mjs';
import { watercourseCentre } from '../../public/snake-stream/garden-watersheds.mjs';

// Acceptance is deliberately about actual scene-space geometry AND vertex
// appearance, not a string replacement, separate sample scene or a mock.
// The 2026-11-21 84c1 real 1920 screenshot shows mint graphic strokes
// crossing an obvious tiled court. Keep planted waterways while replacing
// ungrounded graphic strips with embedded stepped loam/stone flood terraces.
test('T1 integrated physical creek network has broad nonparallel rooted terraces, safe playable clearance and no mint overlay', () => {
  for (const [width, height] of [[8,8], [28,16], [40,24]]) {
    const native=createWorld(THREE,{width,height});
    const ecology=createCourtyardEcology(THREE,{width,height,world:native});
    const copy=createCourtyardEcology(THREE,{width,height});
    try {
      const {braidedSurfaceTriangles,triangles,meshCount,textures,publicCellsMoved}=ecology.stats();
      const mesh=ecology.group.children[0];
      const positions=mesh.geometry.getAttribute('position');
      const colors=mesh.geometry.getAttribute('color');
      assert.equal(meshCount,1);
      assert.equal(textures,0);
      assert.equal(publicCellsMoved,0);
      assert.ok(braidedSurfaceTriangles>100 && triangles<3100);
      assert.deepEqual(positions.array,copy.group.children[0].geometry.attributes.position.array);
      let upper=0,lower=0,brightness=0,greenLead=0;
      for(let i=0;i<braidedSurfaceTriangles*3;i++) {
        const x=positions.getX(i),z=positions.getZ(i),y=positions.getY(i);
        assert.ok(Math.abs(x)<=width/2-.6799 && Math.abs(z)<=height/2-.6799);
        assert.ok(y>=.011 && y<=.021);
        if(y>.0195) upper++;
        if(y<.0132) lower++;
        const r=colors.getX(i),g=colors.getY(i),b=colors.getZ(i);
        if(g>.255 && b>.09) brightness++;
        greenLead+=g-r;
      }
      const n=braidedSurfaceTriangles*3;
      assert.ok(upper/n>.08 && lower/n>.08,'real stepped 3D flood shelves and mineral gutters, not all one elevation');
      assert.ok(brightness/n<.16,'mint painted-looking bright river strokes must not dominate the real stone');
      assert.ok(greenLead/n>.13,'retain true green moss rather than stripping the ecology to bare rock');
      let maxDeviation=0;
      for(let channel=0;channel<3;channel++)for(let i=15;i<=85;i++){
        const t=i/100,x=width*(t-.5),p=sculptRiparianBank(x,channel,width,height,t);
        maxDeviation=Math.max(maxDeviation,Math.abs(p.centre-(height/2)*watercourseCentre(x/(width/2),channel)));
      }
      assert.ok(maxDeviation>.34,'courses must meander as joined natural headlands, not three parallel lines');
      assert.equal(native.stats().staticMeshes,13);
      assert.equal(native.stats().textures,4);
    }finally {ecology.dispose();copy.dispose();native.dispose();}
  }
});
