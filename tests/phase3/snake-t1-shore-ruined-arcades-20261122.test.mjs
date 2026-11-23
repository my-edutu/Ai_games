import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as worldModule from '../../public/snake-stream/world.mjs';

const boards = [[8,8],[28,16],[40,24]];
const rendererBudget = {staticMeshes:13,textures:4};

test('T1 actual cliff/wetland landscape has native multi-span shoreline ruins, not detached decorative boxes', () => {
  assert.equal(typeof worldModule.buildShoreRuinArcades,'function',
    'T1 requires real source-owned arch masonry in both original coastline batches');
  for (const [width,height] of boards) {
    const rock = worldModule.buildShoreRuinArcades(THREE,width,height,'bedrock');
    const moss = worldModule.buildShoreRuinArcades(THREE,width,height,'moss');
    try {
      assert.equal(rock.userData.shoreRuinOpenings,8);
      assert.equal(moss.userData.shoreRuinOpenings,8);
      assert.equal(rock.userData.sharedShorePiers,11, 'all eight hollow arches share eleven real physical masonry piers on three shores');
      assert.equal(moss.userData.sharedShorePiers,11);
      const p=rock.getAttribute('position'),index=rock.getIndex(), P=moss.getAttribute('position');
      assert.ok(index.count/3>=1850 && index.count/3<=2000, 'large physical ruin silhouette within one static batch');
      assert.ok(P.count>=120,'actual green limestone-overgrowth physically joined to ruined arch silhouettes');
      assert.ok(rock.boundingBox?.max.y > 3.5 && rock.boundingBox.min.y < -.35);
      for (const g of [rock,moss]) {
        const v=g.getAttribute('position'), idx=g.getIndex();
        assert.ok(idx.count>0&&v.count>0);
        for(let i=0;i<v.count;i++) {
          const x=v.getX(i),y=v.getY(i),z=v.getZ(i);
          assert.ok([x,y,z].every(Number.isFinite));
          assert.ok(x >= width/2+.65 || x <= -width/2-.65 || z >= height/2+.65,
            'all three shores of ruin masonry are beyond physical playable courtyard clearance');
        }
      }
    }finally{rock.dispose();moss.dispose();}
  }
});

test('T1 shoreline arches are real holes with piers, not a solid ornamental wall',()=>{
  const {width,height}={width:28,height:16};
  const g=worldModule.buildShoreRuinArcades(THREE,width,height,'bedrock');
  try {
    const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
    const ray=new THREE.Raycaster();ray.far=10;
    function hit(z,y){ray.set(new THREE.Vector3(-width/2+1,y,z),new THREE.Vector3(-1,0,0));return ray.intersectObject(mesh,false)[0]}
    assert.equal(hit(0,1.45),undefined,'an actual western walk-through arch stays empty below its spring');
    assert.ok(hit(1.29,1.45),'two genuine 3D piers physically support the western span');
    assert.ok(hit(0,3.58),'the western cut-stone vault is a real overhead semicircular arch');
    assert.ok(hit(-1.55,1.45),'next western opening is supported by the physically shared inner pier');
    assert.ok(hit(4.15,1.45),'far western arch is physically rooted into the same stone wall');
    ray.set(new THREE.Vector3(width/2-1,1.45,1.425),new THREE.Vector3(1,0,0));
    assert.equal(ray.intersectObject(mesh,false)[0],undefined,'eastern passage remains a physically open arch too');
  }finally{g.dispose();}
});

test('T1 shore ruins add no new world draw calls, textures, playable collisions or snapshot dependencies',()=>{
  for(const [width,height] of boards){
    const w=worldModule.createWorld(THREE,{width,height});
    try {
      const stats=w.stats();
      assert.equal(stats.staticMeshes,rendererBudget.staticMeshes);
      assert.equal(stats.textures,rendererBudget.textures);
      const cliff=w.group.getObjectByName('Ruins / 75816b');
      assert.ok(cliff?.isMesh);
      const ray=new THREE.Raycaster();ray.far=6;
      for(const [x,z] of [[0,0],[(width-1)/2,(height-1)/2],[-(width-1)/2,0]]){
        ray.set(new THREE.Vector3(x,1,z),new THREE.Vector3(0,-1,0));
        const h=ray.intersectObject(cliff,false)[0];
        assert.ok(h&&Math.abs(h.point.y+.045)<.004,`must preserve playable stone contact ${width}x${height}:${x},${z}, got ${h?.point.y}`);
      }
    }finally{w.dispose();}
  }
});
