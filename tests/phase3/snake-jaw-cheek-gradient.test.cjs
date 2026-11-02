'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('baked jade-to-cream jaw cheek shading stays attached across LODs, expressions and portal paths', async () => {
  const THREE = await import('three');
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const serpent = createSerpent(THREE);
  const shell = serpent.group.getObjectByName('Unified cream lower jaw');
  const palate = serpent.group.getObjectByName('Recessed oral interior');
  const cheek = new THREE.Color(0x4b9052), chin = new THREE.Color(0xffe8a5);
  const close = (actual, expected, context) => assert.ok(Math.abs(actual-expected)<1e-6, context+': '+actual+' vs '+expected);
  const inspect = (geometry, rows, sides) => {
    const columns = sides + 3, colors = geometry.getAttribute('color');
    assert.ok(colors?.isBufferAttribute, 'outer shell needs baked RGB vertex shading');
    assert.equal(geometry.getAttribute('position').count, rows*columns, 'no changes to jaw vertex count');
    assert.equal(geometry.index.count, (rows-1)*(columns-1)*6, 'no changes to jaw triangle topology');
    assert.equal(colors.count,rows*columns);
    for (const row of [0,Math.floor(rows/2),rows-1]) {
      for (const [column,tone] of [[0,cheek],[columns-1,cheek],[1+sides/2,chin]]) {
        const index=row*columns+column;
        close(colors.getX(index),tone.r,'red '+row+'/'+column);
        close(colors.getY(index),tone.g,'green '+row+'/'+column);
        close(colors.getZ(index),tone.b,'blue '+row+'/'+column);
      }
      const nearSide=colors.getX(row*columns+2);
      assert.ok(nearSide>=cheek.r && nearSide<chin.r, 'lateral jaw surface fades gradually');
    }
  };
  try {
    assert.ok(shell?.isMesh && palate?.isMesh, 'connected lower jaw and recessed mouth stay present');
    assert.equal(shell.material.vertexColors,true);
    assert.equal(shell.material.transparent,false);
    assert.equal(shell.material.depthWrite,true);
    assert.equal(palate.material.vertexColors,false);
    const high=shell.geometry, budget=serpent.stats();
    inspect(high,19,16);
    const paths=[[{x:5,z:5},{x:4,z:5},{x:3,z:5},{x:2,z:5}],[{x:10,z:8}]];
    serpent.update(paths,{time:0,delta:1/60,detail:'low',direction:{x:1,z:0}});
    const low=shell.geometry;
    assert.notStrictEqual(low,high);
    inspect(low,10,8);
    for(let i=0;i<120;i++){
      const detail=i%2?'high':'low';
      serpent.update(paths,{time:i/60,delta:1/60,detail,direction:{x:1,z:0},eating:(i%4)/4,reducedMotion:i%5===0});
      assert.strictEqual(shell.geometry,detail==='high'?high:low);
      assert.equal(serpent.stats().paths,2, 'portal discontinuity cannot grow a connected body');
      for(const key of ['geometries','materials','textures','bufferBytes'])
        assert.equal(serpent.stats()[key],budget[key],key+' budget must remain bounded');
    }
  } finally { serpent.dispose(); }
  assert.equal(serpent.stats().disposed,true);
});
