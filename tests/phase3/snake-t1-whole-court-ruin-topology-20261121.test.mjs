import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createWorld, planCohesiveRuinsPaving, sculptWeatheredRuinsCorner } from '../../public/snake-stream/world.mjs';

test('the entire playable 3D masonry court becomes real broken-edge layered stone, not flat quadrilateral tiles',()=>{
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const slabs=planCohesiveRuinsPaving(width,height);
    const world=createWorld(THREE,{width,height});
    try{
      const meshes=world.group.children.filter(mesh=>mesh.isMesh&&mesh.userData.staticWorld);
      assert.equal(meshes.length,13,'retain all thirteen original static material/draw batches');
      const paving=meshes.find(mesh=>mesh.material?.map?.image?.width===1024);
      assert.ok(paving,'the real, existing 3D playable stone mesh');
      const pos=paving.geometry.getAttribute('position');
      const idx=paving.geometry.index;
      // EIGHT articulated perimeter stations and central, real 3D topology;
      // previous four-corner quads had 54 rather than 120 native vertices.
      assert.equal(pos.count,slabs.length*120,'40 genuine 3D top/side triangles per full-size slab');
      assert.equal(idx.count,slabs.length*120,'all full-depth authored geometry retained in a single baked batch');
      let shaped=0;
      for(const s of slabs){
        const cx=s.x+s.w/2-width/2,cz=s.z+s.h/2-height/2;
        // Each REAL slab includes inward-contoured top-mid edge stations, so
        // its visible rim cannot be a rectangular chessboard silhouette.
        const expectedZ=cz-.487*(s.h-.09);
        const midTop=[];
        for(let i=0;i<pos.count;i++){
          if(Math.abs(pos.getY(i))>.016)continue;
          const dx=pos.getX(i)-cx,dz=pos.getZ(i)-expectedZ;
          if(Math.abs(dx)<.20&&dz>.065&&dz<.40)midTop.push(dz);
        }
        if(midTop.length)shaped++;
        for(let corner=0;corner<4;corner++){
          const sculpt=sculptWeatheredRuinsCorner(s,width,height,corner);
          assert.ok(sculpt.insetX<.22&&sculpt.insetZ<.22,'stone never exposes a real playable cell centre');
        }
      }
      assert.ok(shaped>=Math.ceil(slabs.length*.65),`missing actual sculpted mid-edge of ${width}x${height} court: ${shaped}/${slabs.length}`);
      // Every actual public game cell, including portals, fruit and danger,
      // still lands on continuous physically rendered stone, not a false pit.
      const raycaster=new THREE.Raycaster();
      for(let z=0;z<height;z++)for(let x=0;x<width;x++){
        const cellX=x+.5-width/2,cellZ=z+.5-height/2;
        raycaster.set(new THREE.Vector3(cellX,2,cellZ),new THREE.Vector3(0,-1,0));
        const hit=raycaster.intersectObject(paving,false).find(h=>h.point.y>=-.025&&h.point.y<=.025);
        assert.ok(hit,`real rendered playable stone supports ${width}x${height} cell ${x},${z}`);
      }
      assert.ok(world.stats().staticMeshes===13);
    } finally{world.dispose();}
  }
});
