import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildForestTerraceRim, createWorld } from '../../public/snake-stream/world.mjs';

for (const [width,height] of [[8,8],[28,16],[40,24]]) {
  test(`T1 native ${width}x${height}: authored elevated woodland rim stays outside every true playable cell`,()=>{
    const rock=buildForestTerraceRim(THREE,width,height,'bedrock');
    const moss=buildForestTerraceRim(THREE,width,height,'moss');
    try {
      const W=width/2,H=height/2;
      for(const g of [rock,moss]) {
        const p=g.getAttribute('position');
        assert.ok(p.count>=400 && p.count<=800, 'complete circumferential 3D landscape, not a decoration');
        assert.ok(g.getIndex().count/3<=1200,'original static batches retain bounded triangles');
        assert.ok(g.boundingSphere?.radius>W,'rim reaches into physical existing forest');
        let raised=0,deep=0,broken=0;
        const boundary=[];
        for(let i=0;i<p.count;i++){
          const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
          assert.ok([x,y,z].every(Number.isFinite));
          assert.ok(Math.abs(x)>W+.08 || Math.abs(z)>H+.08,'all new raised scenery stays beyond playable field');
          if(y>.11) raised++;
          if(y<-.25) deep++;
          if(i>0 && Math.hypot(x-p.getX(i-1),z-p.getZ(i-1))>.15) broken++;
          if(i%5===3) boundary.push(y);
        }
        assert.ok(raised>p.count*.14,'major multi-level physical forest terraces rather than small flecks');
        assert.ok(deep>p.count*.10,'the same connected landform has proper exposed stone escarpment');
        assert.ok(Math.max(...boundary)-Math.min(...boundary)>.16,'all shorelines have irregular physical ridge height');
        assert.ok(broken>50,'sculpted rim has breadth and circumferential extent');
        const ind=g.getIndex();
        for(let i=0;i<ind.count;i+=3) {
          const a=ind.getX(i),b=ind.getX(i+1),c=ind.getX(i+2);
          const area=(p.getZ(b)-p.getZ(a))*(p.getX(c)-p.getX(a))-(p.getX(b)-p.getX(a))*(p.getZ(c)-p.getZ(a));
          assert.ok(area>1e-5,'physical terrain requires upward winding, not inverted sheets');
        }
      }
      const game=createWorld(THREE,{width,height});
      try{
        assert.equal(game.stats().staticMeshes,13,'no added entire-scene draw objects');
        assert.equal(game.stats().textures,4,'no added texture cost');
        const cliff=game.group.getObjectByName('Ruins / 75816b');
        assert.ok(cliff?.isMesh);
        const ray=new THREE.Raycaster(); ray.far=4;
        const samples=[[0,0],[(width-1)/2,(height-1)/2],[-(width-1)/2,0],[(width-1)/2,0],[-(width-1)/2,-(height-1)/2]];
        for(const [x,z] of samples) {
          ray.set(new THREE.Vector3(x,1,z),new THREE.Vector3(0,-1,0));
          const hit=ray.intersectObject(cliff,false)[0];
          assert.ok(hit&&Math.abs(hit.point.y+.045)<.004,`authentic legal-cell substrate must remain on top at (${x},${z}): ${hit?.point.y}`);
        }
      } finally { game.dispose(); }
    } finally { rock.dispose(); moss.dispose(); }
  });
}
