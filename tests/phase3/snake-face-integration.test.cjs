'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

test('eyes are supported inside a reptilian brow rather than raised frog-like stalks', async () => {
  const THREE = await import('three');
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const serpent = createSerpent(THREE);
  try {
    const rims=[];serpent.group.traverse(o=>{if(o.name==='Inset eye rim')rims.push(o);});
    assert.equal(rims.length,2);
    for(const rim of rims){
      const socket=rim.parent;
      const top=socket.position.y+(rim.position.y+rim.scale.y)*socket.scale.y;
      assert.ok(top>0.26 && top<0.335,`eye crown must stay attached to skull, got ${top}`);
      assert.ok(Math.abs(socket.position.x)>=0.16&&Math.abs(socket.position.x)<=0.21);
      assert.ok(socket.scale.y<1.3,'large separate eye masses read as amphibian stalks');
      assert.ok(socket.position.z>=0.13,'pupil must sit forward of the occluding skull cap');
    }
    const paths=[[{x:5,z:5},{x:4,z:5},{x:3,z:5},{x:2,z:5}]];
    for(const detail of ['high','low'])for(const time of [0,1.24,3.84,4.5]) {
      serpent.update(paths,{detail,time,delta:1/60});
      for(const rim of rims){
        assert.ok(rim.visible!==false);
        const pupil=rim.parent.getObjectByName('Deep pupil');
        assert.ok(pupil?.visible!==false);
        rim.updateWorldMatrix(true,false);
        const s=rim.getWorldScale(new THREE.Vector3());
        assert.ok(s.x>0&&s.y>0&&s.z>0);
      }
    }
  } finally {serpent.dispose();}
});
