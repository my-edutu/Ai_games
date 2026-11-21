import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildRootedFlagstoneFoundationGeometry, createWorld } from '../../public/snake-stream/world.mjs';

// Source-exact native 3D acceptance target: the coastline must be a real,
// multi-width forest-to-water landform, rather than a narrow rock skirt around
// a rigid tiled rectangle. No newly invented gameplay route or fake render.
// A browser screenshot/film is still necessary to judge the whole game.
test('T1 real courtyard rests inside an asymmetric broad stepped 3D shore with fully supported playing cells', () => {
 for (const [width, height] of [[8,8],[28,16],[40,24]]) {
  const floor = buildRootedFlagstoneFoundationGeometry(THREE,width,height);
  const world = createWorld(THREE,{width,height});
  try {
   const pos=floor.getAttribute('position');
   const idx=floor.getIndex();
   const rings=4,sectors=96;
   assert.equal(pos.count,1+rings*sectors,'existing batched geometry: no new vertices');
   assert.equal(idx.count/3,sectors*(1+2*(rings-1)),'original triangle budget unchanged');
   const reach=Math.min(width,height);
   let emergent=0, submerged=0;
   const extents=[];
   for(let k=0;k<sectors;k++) {
    const angle=k*2*Math.PI/sectors;
    const r=ring=>Math.hypot(pos.getX(1+ring*sectors+k),pos.getZ(1+ring*sectors+k));
    const inner=r(0), upland=r(1), promontory=r(2), shore=r(3);
    assert.ok(upland>inner+.4,'original stone-to-understory transition retained');
    assert.ok(promontory>inner+Math.min(1.8,reach*.18),'physically broad and unmistakable rooted terrace');
    assert.ok(shore>promontory+Math.min(1.0,reach*.11),'whole island has a distinct sloping tidal apron');
    if(pos.getY(1+2*sectors+k)>0.07) emergent++;
    if(pos.getY(1+3*sectors+k)<-1.05) submerged++;
    extents.push(shore-inner);
    for(let ring=0;ring<rings;ring++) for(let component of ['getX','getY','getZ'])
      assert.ok(Number.isFinite(pos[component](1+ring*sectors+k)),'native coast positions finite');
   }
   assert.ok(emergent>=8,'authored forest shoulders reach above flooded mineral shelves');
   assert.equal(submerged,sectors,'actual shoreline sinks toward water, not a flat board halo');
   assert.ok(Math.max(...extents)-Math.min(...extents)>.36,'different capes and coves, not a scaled rectangle');
   const ray=new THREE.Raycaster();ray.far=4;
   const geometry = new THREE.Mesh(floor,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
   for(let z=0;z<height;z++)for(let x=0;x<width;x++){
    ray.set(new THREE.Vector3(x-(width-1)/2,1,z-(height-1)/2),new THREE.Vector3(0,-1,0));
    const hit=ray.intersectObject(geometry,false)[0];
    assert.ok(hit && Math.abs(hit.point.y+.045)<.005,'actual every-cell substrate unchanged');
   }
   assert.equal(world.stats().staticMeshes,13,'retain all native ruin, forest and water batching');
   assert.equal(world.stats().textures,4,'no new GPU atlas or scene pass');
  } finally {world.dispose();floor.dispose();}
 }
});
