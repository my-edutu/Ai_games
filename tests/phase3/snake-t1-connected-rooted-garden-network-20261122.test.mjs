import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { buildConnectedCourtyardGarden, createWorld } from '../../public/snake-stream/world.mjs';

const world = readFileSync(new URL('../../public/snake-stream/world.mjs', import.meta.url),'utf8');

for (const [width,height] of [[8,8],[28,16],[40,24]]) {
  test(`T1: entire ${width}x${height} island has original, continuous two-stratum living-root corridors joining the three basins to all four shorelines`, () => {
    const moss = buildConnectedCourtyardGarden(THREE,width,height,'moss');
    const rock = buildConnectedCourtyardGarden(THREE,width,height,'bedrock');
    try {
      assert.equal(moss.userData.connectedGardenCorridors,6);
      assert.equal(rock.userData.connectedGardenCorridors,6);
      assert.equal(moss.userData.connectedGardenStrata,'moss');
      assert.equal(rock.userData.connectedGardenStrata,'bedrock');
      const W=width/2,H=height/2;
      for (const g of [moss,rock]) {
        const p=g.getAttribute('position');const uv=g.getAttribute('uv');const index=g.getIndex();
        assert.ok(p.count>500 && p.count<1200,'large-scale continuous original relief, not two token fronds');
        assert.equal(p.count,uv.count);assert.ok(index.count/3<=1800,'bounded real geometry on existing GPU batch');
        assert.ok(g.boundingSphere?.radius>W,'whole island-scale actual physical 3D');
        for(let i=0;i<p.count;i++) {
          assert.ok([p.getX(i),p.getY(i),p.getZ(i),uv.getX(i),uv.getY(i)].every(Number.isFinite),'no NaN or degenerate atlas values');
          assert.ok(p.getY(i)<=.023 && p.getY(i)>=-.1,'serpent belly clearance and original static stone support retained');
          assert.ok(Math.abs(p.getX(i))<=W-.18+1e-5 && Math.abs(p.getZ(i))<=H-.18+1e-5,'no false external portal/shore bridge');
        }
      }
      // No self-intersecting/folded ribbons or inverted top faces: real normal
      // shading must read as grounded raised terrain, not dark missing strips.
      for (const g of [moss,rock]) {
        const p=g.getAttribute('position'),indices=g.getIndex();
        for(let i=0;i<indices.count;i+=3) {
          const a=indices.getX(i),b=indices.getX(i+1),c=indices.getX(i+2);
          const area=(p.getZ(b)-p.getZ(a))*(p.getX(c)-p.getX(a))-
            (p.getX(b)-p.getX(a))*(p.getZ(c)-p.getZ(a));
          assert.ok(area>.005,'authentic lit ground triangles need nondegenerate upward winding');
        }
        for(let route=0;route<6;route++) {
          // Each of six root networks is a genuinely contiguous world strip;
          // metadata alone is never proof of physical surface continuity.
          for(let section=0;section<20;section++) {
            const j=(route*21+section)*5+2,k=j+5;
            assert.ok(Math.hypot(p.getX(k)-p.getX(j),p.getZ(k)-p.getZ(j))<1.4,
              'physical root beds cannot contain unconnected gaps or portal bridges');
          }
        }
      }
      const endpoints=moss.userData.connectedGardenEndpoints;
      assert.equal(endpoints.length,6);
      assert.ok(endpoints.some(e=>e.end.x < -W+.5),'connected actual western landward garden');
      assert.ok(endpoints.some(e=>e.end.x > W-.5),'connected actual eastern landward garden');
      assert.ok(endpoints.some(e=>e.end.z < -H+.5),'connected actual northern landward garden');
      assert.ok(endpoints.some(e=>e.end.z > H-.5),'connected actual southern landward garden');
      // The glades must not be three decorative islands: these are true
      // shared world-coordinate endpoints, not a colour-driven assertion.
      assert.deepEqual(endpoints[0].end,endpoints[1].start,'west→centre basin physical seam');
      assert.deepEqual(endpoints[1].end,endpoints[3].start,'centre→east→eastern coast physical seam');
    } finally { moss.dispose(); rock.dispose(); }
  });
}

test('T1: joined inner living island uses the PREEXISTING static batches and true native depth without extra dynamic passes',()=>{
  assert.match(world,/appendOriginalCoastGeometry\(erodedCliff,\s*buildConnectedCourtyardGarden\(THREE,width,height,'bedrock'\)\)/);
  assert.match(world,/appendOriginalCoastGeometry\(rootedMantle,\s*buildConnectedCourtyardGarden\(THREE,width,height,'moss'\)\)/);
  assert.doesNotMatch(world,/new THREE\.ShaderMaterial\([\s\S]*?rootedGardenNetwork/);
});

test('T1 real joined bedrock never masks the original continuous legal-cell substrate in the rendered stone batch',()=>{
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const game=createWorld(THREE,{width,height});
    try{
      const cliff=game.group.getObjectByName('Ruins / 75816b');
      assert.ok(cliff?.isMesh,'must inspect merged actual native bedrock, not only helper geometry');
      const ray=new THREE.Raycaster();ray.far=4;
      for(const [x,z] of [[0,0],[(width-1)/2,(height-1)/2],[-(width-1)/2,0]]){
        ray.set(new THREE.Vector3(x,1,z),new THREE.Vector3(0,-1,0));
        const hit=ray.intersectObject(cliff,false)[0];
        assert.ok(hit&&Math.abs(hit.point.y+.045)<.004,
          `connected undergrowth must not usurp physical legal-cell substrate ${width}x${height} (${x},${z}), got ${hit?.point.y}`);
      }
    }finally{game.dispose();}
  }
});
