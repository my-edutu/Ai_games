'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');

test('ten native forest trunks physically follow the four contoured stone coasts',async()=>{
  const THREE=await import('three');
  const {createLivingGarden}=await import('../../public/snake-stream/living-garden.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const stage=createLivingGarden(THREE,{width,height});
    try {
      const roots=stage.group.userData.forestRootAnchors;
      assert.equal(roots?.length,10,'all original native foreground/shore forest trunks remain');
      const rootPoints=stage.group.getObjectByName('Living garden / cliff').geometry.attributes.position;
      for(const [x,y,z] of roots){
        assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z),'real timber coordinates');
        const outside=Math.max(Math.abs(x)-width/2,Math.abs(z)-height/2);
        assert.ok(outside>2.1,`tree centre must stay outside playable public snake grid, observed ${outside}`);
        let ring=0;
        for(let i=0;i<rootPoints.count;i++){
          const d=Math.hypot(rootPoints.getX(i)-x,rootPoints.getY(i)-y,rootPoints.getZ(i)-z);
          if(d>.27&&d<.42)ring++;
        }
        assert.ok(ring>=6,`each rooted tree has native physical bark at ${x.toFixed(1)},${z.toFixed(1)}; found ${ring}`);
        assert.ok(y>-3.5&&y<8,'actual terrain heights remain bounded');
      }
      // This is an actual 3D downward scene intersection, not a source-string
      // or metadata-only test: zero floating and zero buried forest trunks.
      const raycaster=new THREE.Raycaster();
      const moss=stage.group.getObjectByName('Living garden / moss');
      stage.group.updateMatrixWorld(true);
      for(const [x,y,z] of roots){
        raycaster.set(new THREE.Vector3(x,40,z),new THREE.Vector3(0,-1,0));
        const soil=raycaster.intersectObject(moss,false)[0];
        assert.ok(soil,`every authentic tree trunk must stand on 3D native moss at ${x.toFixed(2)}, ${z.toFixed(2)}`);
        assert.ok(Math.abs(y-soil.point.y)<.4,`woodland root cannot float or be buried; observed ${(y-soil.point.y).toFixed(2)}m`);
      }
      assert.ok(stage.stats().triangles<=22000,'do not change strict original terrain geometry ceiling');
    } finally {stage.dispose();}
  }
});
