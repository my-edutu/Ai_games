'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');

// T1 acceptance guard for actual native Three.js terrain, not scene metadata
// or a palette/string check. The first shoreline moss-band terraces are
// generated in contour order and own real vertices used by the renderer.
test('T1 living coastline has substantial connected lateral topographic curvature without hiding the board',async()=>{
  const THREE=await import('three');
  const {createLivingGarden}=await import('../../public/snake-stream/living-garden.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const a=createLivingGarden(THREE,{width,height});
    const b=createLivingGarden(THREE,{width,height});
    try {
      const mesh=a.group.getObjectByName('Living garden / moss');
      assert.ok(mesh?.isMesh,'the actual terrain geometry must exist');
      const p=mesh.geometry.attributes.position;
      const shoreStart=-width/2-2.7,shoreEnd=width/2+2.7;
      const segments=Math.ceil((shoreEnd-shoreStart)/(width*height>600?1.05:.85));
      const sample=()=>{
        const results=[];
        // Rows 1 and 2 include the original physical moss bank terraces;
        // the first 6 vertices of each shore quad use u_i, u_{i+1}.
        for(const row of [1,2])for(let i=3;i<segments-3;i++){
          const index=(row*segments+i)*6;
          const worldX=p.getX(index);
          const sourceT=shoreStart+(shoreEnd-shoreStart)*i/segments;
          const worldZ=p.getZ(index),worldY=p.getY(index);
          results.push({offset:worldX-sourceT,x:worldX,z:worldZ,y:worldY});
          assert.ok(worldZ>height/2+2.5,`${width}x${height} outboard bank must not enter live grid`);
          assert.ok(Number.isFinite(worldY)&&Number.isFinite(worldX),'physical bank coordinates must be finite');
        }
        return results;
      };
      const samples=sample();
      // No foldover or tear: each of the four curving shore terraces retains
      // a monotonically ordered longitudinal contour, and its triangles
      // literally meet their next original stone quad at shared coordinates.
      for(const row of [1,2])for(let i=3;i<segments-4;i++){
        const here=(row*segments+i)*6, next=(row*segments+i+1)*6;
        assert.ok(p.getX(here+2)<p.getX(next+2)+.0001,
          'terrain parameter must not double back and fold through itself');
        for(const axis of ['X','Y','Z']){
          assert.ok(Math.abs(p['get'+axis](here+2)-p['get'+axis](next))<.00001,
            `real ${axis} coordinates on adjacent quads must share one physical edge`);
        }
      }
      const largest=Math.max(...samples.map(s=>Math.abs(s.offset)));
      const minShift=width<10?.52:width<30?.9:1.14;
      assert.ok(largest>minShift,`${width}x${height} must have substantial nonrectilinear *longitudinal* soil terraces, observed ${largest.toFixed(3)}`);
      assert.ok(samples.some(s=>s.offset>.16)&&samples.some(s=>s.offset<-.16),
        'terraced coast must visibly bend in both directions instead of skewing the whole rectangular stage');
      const stats=a.stats();
      assert.equal(stats.meshCount,4);
      assert.equal(stats.cornerCatchments,4);
      assert.ok(stats.triangles<=22000,'preserve exact unchanged original resource ceiling');
      assert.deepEqual(a.group.children.map(m=>Array.from(m.geometry.attributes.position.array)),
        b.group.children.map(m=>Array.from(m.geometry.attributes.position.array)),
        'full static native geometry must remain deterministic for a public seed/board');
    } finally {a.dispose();b.dispose();}
  }
});
