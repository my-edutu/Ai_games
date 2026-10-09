import test from 'node:test';
import assert from 'node:assert/strict';
import { identity4,mul4,transform4,slerp,animationClock,sampleSkinMatrices,skinVertex } from '../web/skinning.js';

test('real GLB skin influences deform vertex positions via animated joint palette',()=>{
  const scene={
    nodes:[
      {translation:[0,0,0],children:[1]},
      {translation:[0,0,0],rotation:[0,0,0,1],children:[]}
    ],
    skins:[{joints:[1],inverseBindMatrices:[identity4()]}],
    clips:{idle:[0,29],attack:[30,59],dead:[60,89]},
    animations:[{channels:[{
      node:1,path:'translation',interpolation:'LINEAR',
      times:[0,1],values:[[0,0,0],[0,2,0]]
    }]}]
  };
  const before=JSON.stringify(scene);
  const pose=sampleSkinMatrices(scene,0,'idle',.5);
  assert.equal(pose.clip,'idle');
  assert.equal(pose.jointMatrices.length,1);
  assert.ok(Math.abs(transform4(pose.jointMatrices[0],[0,0,0])[1]-1)<1e-9);
  const vertex={position:[1,0,0],joints:[0,0,0,0],weights:[1,0,0,0]};
  assert.deepEqual(skinVertex(vertex,pose),[1,1,0]);
  assert.equal(JSON.stringify(scene),before,'animation is strictly visual and cannot mutate source model');
});
test('asset blend curves interpolate rotations with normalized quaternions and remain finite',()=>{
  const half=slerp([0,0,0,1],[0,1,0,0],.5);
  assert.ok(Math.abs(Math.hypot(...half)-1)<1e-9);
  assert.ok(Math.abs(half[1]-Math.SQRT1_2)<1e-7);
  assert.ok(Math.abs(half[3]-Math.SQRT1_2)<1e-7);
  assert.deepEqual(mul4(identity4(),identity4()),identity4());
});
test('rig animations loop idle/attack but never twitch dead bodies',()=>{
  const a=animationClock('idle',.3),b=animationClock('idle',.3+29/24);
  assert.ok(Math.abs(a.seconds-b.seconds)<1e-7);
  assert.equal(animationClock('attack',.2).key,'attack');
  assert.equal(animationClock('dead',500).key,'dead');
  assert.ok(Math.abs(animationClock('dead',500).seconds-89/24)<1e-9);
});
test('bad skeletal parents and malicious joint graphs fail closed rather than corrupt render state',()=>{
  const runtime={nodes:[{children:[1]},{children:[0]}],skins:[{joints:[1],inverseBindMatrices:[identity4()]}],animations:[]};
  assert.equal(sampleSkinMatrices(runtime,0,'idle',1),null);
  const bad={nodes:[{}],skins:[{joints:[512],inverseBindMatrices:[identity4()]}],animations:[]};
  assert.equal(sampleSkinMatrices(bad,0,'idle',1),null);
  const plain={position:[0,0,0]};
  assert.deepEqual(skinVertex(plain,null),[0,0,0]);
});
