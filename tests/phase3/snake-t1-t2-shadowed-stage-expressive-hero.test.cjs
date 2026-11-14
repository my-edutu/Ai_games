'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

// Source-native acceptance guard only. This is not a Chromium screenshot,
// official-reference comparison or displayed-frame performance result.
test('T1+T2 integrated garden: real stone, planted-root mesh, expressive head remain coherent and bounded', async () => {
  const THREE = await import('three');
  const {createWorld} = await import('../../public/snake-stream/world.mjs');
  const {createCourtyardEcology} = await import('../../public/snake-stream/courtyard-ecology.mjs');
  const {createSerpent} = await import('../../public/snake-stream/serpent.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]) {
    const world=createWorld(THREE,{width,height});
    const ecology=createCourtyardEcology(THREE,{width,height,world});
    const snake=createSerpent(THREE);
    try {
      const stats=world.stats(), e=ecology.stats();
      assert.equal(stats.staticMeshes,13,'retain the complete original 3D environment');
      assert.equal(stats.textures,4,'retain original material assets');
      assert.equal(e.meshCount,1,'retain full physical forest, not a discarded render layer');
      assert.equal(e.textures,0);
      assert.equal(e.publicCellsMoved,0,'all authoritative positions remain unchanged');
      assert.equal(e.interstitialFernClumps,({8:40,28:130,40:71})[width]);
      assert.ok(e.braidedSurfaceTriangles>400,'retain original 3D rooted river and relief rather than remove it');
      const paving=world.group.children.find(o=>o.isMesh && o.material?.map?.image?.width===1024);
      assert.ok(paving?.geometry.attributes.color,'physical 3D world has painted stone, not a screenshot overlay');
      const tileColours=paving.geometry.attributes.color.array;
      let greenMean=0, forestCells=0;
      for(let i=0;i<tileColours.length;i+=3){
        const r=tileColours[i],g=tileColours[i+1],b=tileColours[i+2];
        greenMean+=g;
        forestCells+=g>r+.11&&g>b+.10;
      }
      greenMean/=tileColours.length/3;
      assert.ok(greenMean>.51&&greenMean<.79,
        `${width}x${height} forest is shaded, but still visibly planted: green ${greenMean}`);
      assert.ok(forestCells/(tileColours.length/3)>.54,
        `${width}x${height} rooted forest cannot disappear into an opaque grey ground`);
      const rootColours=ecology.group.children[0].geometry.attributes.color.array;
      let rootGreen=0, rootDark=0;
      const roots=e.braidedSurfaceTriangles*3;
      for(let i=0;i<roots;i++){
        const r=rootColours[i*3],g=rootColours[i*3+1],b=rootColours[i*3+2];
        rootGreen+=g;
        rootDark+=g<.18;
        assert.ok(g>r&&g>b*.86,'root relief must remain living green/loam, not blank slate');
      }
      rootGreen/=roots;
      assert.ok(rootGreen>.12&&rootGreen<.235,
        `physically rooted rivers should be dark moss/loam, not luminous drawn stripes: ${rootGreen}`);
      assert.ok(rootDark/roots>.14,
        `branch tips and bank margins must actually include deep soil, got ${rootDark/roots}`);
      const head=snake.group.getObjectByName('Expressive head');
      assert.ok(head,'retain actual articulated existing face');
      assert.ok(head.scale.x>=1.20&&head.scale.x<=1.36,
        `whole-board protagonist needs genuinely legible sculpted face, actual ${head.scale.x}`);
      assert.equal(head.scale.x,head.scale.y);
      assert.equal(head.scale.x,head.scale.z);
      assert.equal(snake.stats().textures,4,'do not hide hero shading or delete original PBR atlases');
    } finally {snake.dispose();ecology.dispose();world.dispose();}
  }
});
