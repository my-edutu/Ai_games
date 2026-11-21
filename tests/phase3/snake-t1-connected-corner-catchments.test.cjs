'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');

// Inspect the actual geometry drawn by Three.js; metadata alone cannot assert
// that the four once-disconnected coastline strips physically meet.
test('T1 four originally sculpted shores have physical diagonal corner terrain without entering public gameplay cells',async()=>{
  const THREE=await import('three');
  const {createLivingGarden}=await import('../../public/snake-stream/living-garden.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const a=createLivingGarden(THREE,{width,height});
    const b=createLivingGarden(THREE,{width,height});
    try{
      const stats=a.stats();
      assert.equal(stats.meshCount,4);
      assert.equal(stats.shoreSections,4);
      assert.equal(stats.textures,1);
      assert.ok(stats.triangles<=22000,`must retain existing full scenic budget on ${width}x${height}`);
      assert.equal(stats.cornerCatchments,4,'all four shoreline pairs require connected native soil and cliff, not disconnected strips');
      const sections=new Set();
      let bridges=0;
      for(const mesh of a.group.children.filter(m=>/moss|cliff/.test(m.name))){
        const p=mesh.geometry.attributes.position;
        for(let t=0;t<p.count;t+=3){
          const xs=[p.getX(t),p.getX(t+1),p.getX(t+2)];
          const zs=[p.getZ(t),p.getZ(t+1),p.getZ(t+2)];
          const dx=Math.max(...xs)-Math.min(...xs);
          const dz=Math.max(...zs)-Math.min(...zs);
          const cx=(xs[0]+xs[1]+xs[2])/3, cz=(zs[0]+zs[1]+zs[2])/3;
          if(dx<=2.25||dz<=2.25||Math.abs(cx)<=width/2+2.1||Math.abs(cz)<=height/2+2.1)continue;
          sections.add(`${Math.sign(cx)},${Math.sign(cz)}`);
          bridges++;
          for(let k=0;k<3;k++){
            assert.ok(Math.abs(xs[k])>=width/2+2.0||Math.abs(zs[k])>=height/2+2.0,
              'no diagonal connector point is an artificial gameplay surface');
          }
        }
      }
      assert.deepEqual([...sections].sort(),['-1,-1','-1,1','1,-1','1,1'],`four tangible corners, ${width}x${height}`);
      assert.ok(bridges>=8,`corner terrain must be broad real triangles on ${width}x${height}`);
      assert.deepEqual(a.group.children.map(m=>[m.name,Array.from(m.geometry.attributes.position.array)]),
        b.group.children.map(m=>[m.name,Array.from(m.geometry.attributes.position.array)]),
        'all visible geometry is deterministic and public-state independent');
    }finally{a.dispose();b.dispose();}
  }
});

test('T1 actual near-coast mesh is deeply scalloped across the full board rather than retaining a four-sided straight stage frame',async()=>{
  const THREE=await import('three');
  const {createLivingGarden}=await import('../../public/snake-stream/living-garden.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const shore=createLivingGarden(THREE,{width,height});
    try {
      const p=shore.group.getObjectByName('Living garden / moss').geometry.attributes.position;
      const segments=Math.ceil((width+5.4)/(width*height>600?1.05:.85));
      const near=[];
      for(let i=0;i<segments;i++){
        const index=i*6;
        const x=p.getX(index),z=p.getZ(index);
        near.push(z);
        assert.ok(Math.abs(x)>width/2+1||z>height/2+2.5,
          'authored outboard sculpting may not place vertices onto a valid gameplay cell');
      }
      const variation=Math.max(...near)-Math.min(...near);
      assert.ok(variation>.92,`${width}x${height} must visibly break the original straight inner river coast; actual ${variation}`);
      assert.ok(Math.min(...near)>height/2+2.5,'every point remains well outboard of the protected game board');
      assert.ok(Math.max(...near)<height/2+4.5,'organic scalloping cannot occlude the whole water scene');
    }finally{shore.dispose();}
  }
});
