import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRootedFlagstoneFoundationGeometry, stageHeadlandAnchors,
  sampleWoodlandBankCrown, sculptCoastCourse, sculptCopeStone,
} from '../../public/snake-stream/world.mjs';

// Standalone native buffer-geometry carrier: the scene itself still uses
// pinned Three.js, but these topology assertions inspect the actual vertices
// without requiring a WebGL context or inventing gameplay.
class Attribute {
  constructor(array, itemSize) { this.array = Float32Array.from(array); this.itemSize = itemSize; this.count = array.length/itemSize; }
  getX(i) { return this.array[i*this.itemSize]; }
  getY(i) { return this.array[i*this.itemSize+1]; }
  getZ(i) { return this.array[i*this.itemSize+2]; }
}
class Geometry {
  attributes = {};
  setAttribute(name, value) {this.attributes[name] = value; return this;}
  setIndex(value) {this.index=value; return this;}
  computeVertexNormals() {};
  computeBoundingSphere() {};
}
const THREE={BufferGeometry:Geometry,Float32BufferAttribute:Attribute};
const finite = n => Number.isFinite(n);
const center = (width,height,angle) => Math.min((width/2+.095)/Math.max(1e-8,Math.abs(Math.cos(angle))),
  (height/2+.095)/Math.max(1e-8,Math.abs(Math.sin(angle))));

test('T1 shared 3D forest shoulder reconstructs the entire original apron without moving a real play cell', () => {
  for (const [width,height] of [[8,8],[28,16],[40,24]]) {
    const geometry=buildRootedFlagstoneFoundationGeometry(THREE,width,height);
    const positions=geometry.attributes.position;
    assert.equal(positions.count, 385);
    assert.equal(geometry.index.length, 3*96 + 6*3*96, 'exact original 672 foundation triangles');
    const groves=stageHeadlandAnchors(width,height);
    let raised=0, recessed=0;
    for(let k=0;k<96;k++){
      const angle=k*Math.PI*2/96;
      const first=1+k, ridge=1+2*96+k, deep=1+3*96+k;
      const firstRadius=Math.hypot(positions.getX(first),positions.getZ(first));
      const ridgeRadius=Math.hypot(positions.getX(ridge),positions.getZ(ridge));
      const deepRadius=Math.hypot(positions.getX(deep),positions.getZ(deep));
      assert.ok(firstRadius>=center(width,height,angle)-.08, 'no missing support under first ring');
      assert.ok(positions.getY(first)<0, 'original gameplay fan stays below snake belly');
      assert.ok(ridgeRadius>firstRadius+.45 && deepRadius>ridgeRadius+.18,'nested stone bands do not fold');
      assert.ok(positions.getY(deep)<-.65, 'shore foot stays below real gameplay');
      assert.ok(finite(positions.getY(ridge)));
      if(positions.getY(ridge)>.075)raised++;
      if(positions.getY(ridge)<-.32)recessed++;
    }
    assert.ok(raised>=12,'woodland ridges must be visible around '+width+'x'+height+', got '+raised);
    assert.ok(recessed>=8,'coves must remain open between groves on '+width+'x'+height+', got '+recessed);
    const signals=groves.map(({x,z})=>sampleWoodlandBankCrown(width,height,Math.atan2(z,x)));
    assert.ok(signals.every(x=>x>.65),'all existing seven headlands must be rooted in a raised physical shoulder');
  }
});

test('T1 actual shore masonry and coping share same bounded woodland bank without obstructing cell centres', () => {
  for(const [width,height] of [[8,8],[28,16],[40,24]]) {
    for(let edge=0;edge<4;edge++) {
      const len=edge<2?width+2:height+2;
      const sample=[];
      for(let i=0;i<len;i+=.8){
        const cope=sculptCopeStone(width,height,edge,i);
        const stones=[0,1,2].map(tier=>sculptCoastCourse(width,height,edge,tier,i));
        assert.ok([cope.x,cope.y,cope.z,cope.sx,cope.sy,cope.sz,...stones.flatMap(s=>[s.x,s.y,s.z])].every(finite));
        assert.ok(edge<2 ? Math.abs(cope.z)>=height/2+.3 : Math.abs(cope.x)>=width/2+.3,'coping strictly outside playable grid');
        assert.ok(stones.every(s=>edge<2?Math.abs(s.z)>height/2+.6:Math.abs(s.x)>width/2+.6),'all ruin courses outside grid');
        sample.push(cope.y);
      }
      assert.ok(Math.max(...sample)-Math.min(...sample)>.075,'woodland masonry has genuine stepped material heights');
    }
  }
});
