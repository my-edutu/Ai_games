import test from 'node:test';
import assert from 'node:assert/strict';
import {sculptCopeStone, sculptGardenEdgePlanting} from '../../public/snake-stream/world.mjs';

/** Every retained original boundary stone must follow a real 3D scalloped
 * coastal bank, not a straight stone rail. Nothing is moved on the game grid. */
function shoreSamples(width,height,edge) {
  const horizontal=edge<2, span=horizontal?width:height;
  return Array.from({length:span},(_,i)=>{
    const along=i+.5,stone=sculptCopeStone(width,height,edge,along);
    const position=horizontal?stone.x+width/2:stone.z+height/2;
    const offset=horizontal?Math.abs(stone.z)-height/2:Math.abs(stone.x)-width/2;
    const foliage=sculptGardenEdgePlanting(width,height,edge,along-span/2,'foliage');
    return {along,stone,offset,axial:position-along,foliage};
  });
}

test('four entire original 3D coping shores break straight rails into safe, rooted coves and headlands',()=>{
  for (const [w,h] of [[8,8],[28,16],[40,24]]) {
    for (let edge=0;edge<4;edge++) {
      const samples=shoreSamples(w,h,edge), offsets=samples.map(s=>s.offset), axial=samples.map(s=>s.axial);
      // Keep every physical stone exterior to all legal cell-centre contacts;
      // its entire half-width must lie outside the old gameplay support.
      for (const {stone,offset,foliage} of samples) {
        assert.ok(Object.values(stone).every(Number.isFinite));
        const halfWidth=edge<2?stone.sz/2:stone.sx/2;
        assert.ok(offset-halfWidth >= .15,`${w}x${h} ${edge}: invasive physical coping`);
        const footDistance=Math.hypot(stone.x-foliage.x,stone.z-foliage.z);
        assert.ok(footDistance>=.24&&footDistance<2.0,`${w}x${h} ${edge}: plants unrooted from masonry`);
      }
      assert.ok(Math.max(...axial.map(Math.abs))>.17,`${w}x${h} ${edge}: the coping is still a literal straight rail`);
      // At real broadcast widths the shoreline needs strongly authored bays,
      // not the old subcell sine wiggle behind one continuous rectangle.
      if (w>=28)assert.ok(Math.max(...offsets)-Math.min(...offsets)>.9,
        `${w}x${h} ${edge}: no recognisable promontories and tidal inlets`);
    }
  }
});
