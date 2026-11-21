'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = Object.freeze([{x:0,z:0},{x:0,z:-1},{x:0,z:-2},{x:0,z:-3},{x:0,z:-4}].map(Object.freeze));
test('near forward public fruit evokes bounded and symmetric sculpted-head attention, without gameplay changes', async () => {
  const THREE=await import('three');
  const {createSerpent}=await import('../../public/snake-stream/serpent.mjs');
  const serpent=createSerpent(THREE);
  const pose=serpent.group.getObjectByName('Expressive head')?.children[0];
  assert.ok(pose?.isGroup);
  const immutable=JSON.stringify(path), budget=serpent.stats();
  const options={detail:'high',delta:1/60,runToken:'original',direction:{x:0,z:1},reducedMotion:true};
  const yaw=food=>{serpent.update([path],{...options,food,time:3.5});return pose.rotation.y;};
  try {
    const right=yaw({x:3,z:3}),left=yaw({x:-3,z:3});
    assert.ok(right>0.10&&right<=0.16,'public right fruit must turn skull: '+right);
    assert.ok(left<-.10&&left>=-.16,'public left fruit must mirror: '+left);
    assert.ok(Math.abs(right+left)<1e-10,'mirrored food is symmetric');
    assert.equal(yaw({x:0,z:3}),0,'straight-ahead target is neutral');
    assert.equal(yaw({x:3,z:-3}),0,'behind-body food cannot twist head');
    assert.equal(yaw({x:30,z:3}),0,'far targets do not distract skull');
    assert.equal(yaw(null),0,'missing food is neutral');
    assert.equal(yaw({x:Infinity,z:NaN}),0,'invalid target is neutral');
    serpent.update([path],{...options,food:{x:3,z:3},time:0});
    const still=pose.rotation.y;
    serpent.update([path],{...options,food:{x:3,z:3},time:77});
    assert.equal(pose.rotation.y,still,'reduced-motion pose is stable across time');
    assert.equal(JSON.stringify(path),immutable,'public cells cannot mutate');
    for(const key of ['geometries','materials','textures','bufferBytes'])
      assert.equal(serpent.stats()[key],budget[key],'bounded resource '+key);
    assert.equal(serpent.stats().paths,1);
    assert.equal(serpent.stats().truncated,false);
  } finally {serpent.dispose();}
});
test('head attention eases in motion and instantly resets across public portal jumps and restarts',async()=>{
  const THREE=await import('three');
  const {createSerpent}=await import('../../public/snake-stream/serpent.mjs');
  const serpent=createSerpent(THREE);
  const pose=serpent.group.getObjectByName('Expressive head').children[0];
  const portals=Object.freeze([path,Object.freeze([{x:14,z:6},{x:14,z:5}].map(Object.freeze))]);
  const frozen=JSON.stringify(portals),budget=serpent.stats();
  const options={detail:'low',direction:{x:0,z:1},delta:1/60,runToken:'first'};
  try{
    serpent.update(portals,{...options,reducedMotion:true,food:{x:-3,z:3}});
    const left=pose.rotation.y;
    assert.ok(left<-.10);
    serpent.update(portals,{...options,time:1,food:{x:3,z:3}});
    assert.ok(pose.rotation.y>left&&pose.rotation.y<.10,'normal updates ease, never snap');
    for(let frame=0;frame<90;frame++)serpent.update(portals,{...options,time:1+frame/60,food:{x:3,z:3}});
    assert.ok(pose.rotation.y>.10,'settles on public fruit');
    assert.equal(serpent.stats().paths,2,'portal fragments remain disjoint');
    const displaced=Object.freeze([{x:15,z:8},{x:15,z:7},{x:15,z:6}].map(Object.freeze));
    serpent.update([displaced],{...options,time:3,food:{x:12,z:11}});
    assert.ok(pose.rotation.y<-.10,'teleport adopts present public target');
    serpent.update([displaced],{...options,runToken:'next',time:3.1,food:{x:18,z:11}});
    assert.ok(pose.rotation.y>.10,'restart discards previous look');
    assert.equal(JSON.stringify(portals),frozen,'portal paths remain immutable');
    for(const key of ['geometries','materials','textures','bufferBytes'])
      assert.equal(serpent.stats()[key],budget[key],'bounded resource '+key);
    assert.equal(serpent.stats().truncated,false);
  }finally{serpent.dispose();}
});

test('same original skull look works in all four public travel headings without altering path truth',async()=>{
  const THREE=await import('three');
  const {createSerpent}=await import('../../public/snake-stream/serpent.mjs');
  const dirs=[{x:0,z:1},{x:1,z:0},{x:0,z:-1},{x:-1,z:0}];
  for(const direction of dirs){
    const serpent=createSerpent(THREE);
    const pose=serpent.group.getObjectByName('Expressive head').children[0];
    const path=Object.freeze(Array.from({length:4},(_,i)=>Object.freeze({x:-i*direction.x,z:-i*direction.z})));
    const original=JSON.stringify(path);
    const options={detail:'low',direction,reducedMotion:true,runToken:'cardinal'};
    const target=side=>({x:3*direction.x+side*3*direction.z,z:3*direction.z-side*3*direction.x});
    try{
      serpent.update([path],{...options,food:target(1)});
      const right=pose.rotation.y;
      serpent.update([path],{...options,food:target(-1)});
      const left=pose.rotation.y;
      assert.ok(right>.1&&right<=.16,'right food heading '+JSON.stringify(direction));
      assert.ok(left<-.1&&left>=-.16,'left food heading '+JSON.stringify(direction));
      assert.ok(Math.abs(right+left)<1e-10,'all headings mirror symmetrically');
      assert.equal(JSON.stringify(path),original,'public path unchanged');
      assert.equal(serpent.stats().paths,1);
    }finally{serpent.dispose();}
  }
});
