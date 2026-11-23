import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  buildNativeFourShoreWaterfallGeometry,
  buildWaterfallEstuaryGeometry,
  createWorld,
  sculptCoastCourse,
} from '../../public/snake-stream/world.mjs';

// No source-only symbol test: inspect true native geometry, original four
// waterfall roots, clear playable area and actual merged scene material batches.
// Gameplay is an untouched flat grid; delta terrain is EXTERIOR presentation.
test('four authentic live waterfall mouths physically enter distinct original stone-and-loam deltas with clear legal cells', () => {
  for (const [width,height] of [[8,8],[28,16],[40,24]]) {
    const fall = buildNativeFourShoreWaterfallGeometry(THREE,width,height);
    const stone = buildWaterfallEstuaryGeometry(THREE,width,height,'bedrock');
    const loam = buildWaterfallEstuaryGeometry(THREE,width,height,'moss');
    const world = createWorld(THREE,{width,height});
    try {
      assert.equal(stone.userData.estuaryMouths,4);
      assert.equal(loam.userData.estuaryMouths,4);
      assert.equal(stone.userData.sourceWaterfalls,4);
      assert.equal(loam.userData.sourceWaterfalls,4);
      assert.equal(stone.index.count,loam.index.count);
      assert.ok(stone.index.count/3 >= 800 && stone.index.count/3 <= 2500,
        'real multi-course bank topology, bounded triangles');
      assert.ok(stone.attributes.position.array.every(Number.isFinite));
      assert.ok(loam.attributes.position.array.every(Number.isFinite));
      assert.ok(stone.getAttribute('normal').array.every(Number.isFinite));
      assert.ok(loam.getAttribute('normal').array.every(Number.isFinite));
      for (let v=0;v<loam.getAttribute('normal').count;v++) {
        assert.ok(loam.getAttribute('normal').getY(v)>.01,
          'original 3D estuary loam must face up for authentic PBR sunlight, not show its backface');
      }
      const W=width/2,H=height/2;
      for (const bank of [stone,loam]) {
        const p=bank.getAttribute('position');
        for (let v=0;v<p.count;v++) {
          const x=p.getX(v),z=p.getZ(v),y=p.getY(v);
          assert.ok(Math.abs(x)>W+.42 || Math.abs(z)>H+.42,
            `waterfall geology must not intrude onto legal cells (${x},${z})`);
          assert.ok(y<-.12 && y> -4.6,'all real bank courses stay below protected playable crowns');
        }
      }
      const data=loam.userData.mouths;
      assert.equal(data.length,4,'one actual distinct connected estuary for each true waterfall');
      for(let edge=0;edge<4;edge++) {
        const e=data[edge];
        assert.equal(e.edge,edge);
        const along=[.54,.29,.43,.70][edge]*(edge<2?width+2:height+2);
        const course=sculptCoastCourse(width,height,edge,0,along);
        assert.ok(Math.hypot(e.start.x-course.x,e.start.z-course.z)<.001,
          'delta source must be planted in the same actual shore block as live waterfall');
        assert.ok(Math.hypot(e.end.x-e.start.x,e.end.z-e.start.z)>1.5,
          'delta must lead physically outwards to visible tidal water');
        assert.ok(e.end.y < -3.45 && e.start.y > e.end.y+1.7,
          'complete above-lake-to-tidal-water formation, not painted waterfall terminus');
        const row=20*edge;
        const f=fall.attributes.position;
        assert.ok(Math.hypot(f.getX(row)-e.start.x,f.getZ(row)-e.start.z)<1.0,
          'estuary lines up with actual existing waterfall lip');
      }
      const rendered = world.group.children.filter(o=>o.isMesh && o.userData.staticWorld);
      assert.equal(rendered.length,13,'existing complete static material batches, not new draws');
      assert.equal(world.stats().textures,4,'existing native original authored textures only');
      const cliff=world.group.getObjectByName('Ruins / 75816b');
      assert.ok(cliff?.geometry?.index?.count>stone.index.count,
        'real source-owned scene includes new delta geology alongside the full cliffs');
      if(width===28&&height===16)
        assert.ok(cliff.geometry.index.count/3>=15220,
          'new complete 1216-triangle estuaries must enter the actual rendered cliff material; source parent+forest has 14004');
      assert.equal(world.stats().drawObjects,33,
        'the complete visible world retains original draw-object budget');
      const liveFalls=world.group.getObjectByName('Baked live edge falls');
      assert.equal(liveFalls.geometry.index.count,fall.index.count,
        'same complete four animated waterfall surfaces retained');
    } finally { fall.dispose();stone.dispose();loam.dispose();world.dispose(); }
  }
});
