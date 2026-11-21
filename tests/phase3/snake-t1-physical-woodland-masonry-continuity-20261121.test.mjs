import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createWorld, planCohesiveRuinsPaving, sculptPlantedMasonrySeam } from '../../public/snake-stream/world.mjs';

// Evidence-based T1 defect: real 1920/portrait WebGL source e1793f84
// still reads as one regular tiled court. Individual multi-cell stones
// currently have ONE tint for all 120 native vertices, despite crossing
// distinct planted gallery and exposed limestone habitats.
test('every original multi-cell ruin receives source-native 3D planted seam relief with safe upper contact', () => {
  const real = [[8,8],[28,16],[40,24]];
  for (const [width,height] of real) {
    for(const slab of planCohesiveRuinsPaving(width,height)) for(let edge=0;edge<4;edge++){
      const upper=sculptPlantedMasonrySeam(slab,width,height,edge,true);
      const lower=sculptPlantedMasonrySeam(slab,width,height,edge,false);
      for (const seam of [upper,lower]) {
        assert.ok(Number.isFinite(seam.recess)&&Number.isFinite(seam.drift)&&Number.isFinite(seam.rise));
        assert.ok(Math.abs(seam.drift)<=.185,'lateral native sculpture stays within existing stone rim');
      }
      assert.ok(upper.recess>=.020 && upper.recess<=.068,
        'the unchanged authoritative body-footprint must remain supported by real upper stone');
      assert.ok(lower.recess>=.11 && lower.recess<=.38,
        'deep non-gameplay stone flank is physically fractured, not merely recoloured');
      assert.ok(lower.recess>upper.recess+.07,
        'true 3D layered undercut distinguishes woodland from raised limestone crown');
    }
  }
});

test('whole 3D courtyard vertex material resolves forest-to-limestone continuously across multi-cell ruins', () => {
  for (const [width,height] of [[8,8],[28,16],[40,24]]) {
    const world=createWorld(THREE,{width,height});
    try {
      const tile=world.group.children.find(m=>m.name==='Ruins / c3c4ad');
      assert.ok(tile?.geometry?.attributes?.color,'original material batch present');
      const colors=tile.geometry.getAttribute('color');
      const paving=planCohesiveRuinsPaving(width,height);
      assert.equal(colors.count,paving.length*120,'preserve every original native ruin vertex');
      let varied=0;
      for(let i=0;i<colors.count;i+=120){
        const distinct=new Set();
        for(let j=i;j<i+120;j++)distinct.add([colors.getX(j),colors.getY(j),colors.getZ(j)]
          .map(n=>n.toFixed(3)).join(':'));
        if(distinct.size>=5)varied++;
      }
      assert.ok(varied/paving.length>.75,
        `actual planted corridors must vary INSIDE most full-scale physical slabs (${varied}/${paving.length})`);
      assert.equal(world.stats().staticMeshes,13,'no extra draw/material batch to manufacture depth');
    }finally{world.dispose()}
  }
});
