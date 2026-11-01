'use strict';
const {stripR52Canopy}=require('../helpers/snake-r52-canopy-archive.cjs');
const {stripR50Stone} = require('../helpers/snake-stone-archive.cjs');
const { stripR44Fruit } = require('../helpers/snake-fruit-archive.cjs');
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {applyR42Water,restorePreR42Water}=require('../helpers/snake-water-flow-archive.cjs');
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
test('R42 byte-exact prior 3D world and vertex water motion preserve geometry, cues and resources',async()=>{
  const source=fs.readFileSync(path.resolve(__dirname,'../../public/snake-stream/world.mjs'),'utf8');
  const old=restorePreR42Water(source);
  assert.equal(blob(stripR52Canopy(stripR50Stone(stripR44Fruit(old)))),'95a533cb736030866ca0947328835b082909fa45');
  assert.equal(applyR42Water(old),source);
  const THREE=await import('three');
  const prior=await import('data:text/javascript;base64,'+Buffer.from(old).toString('base64'));
  const {createWorld}=await import('../../public/snake-stream/world.mjs');
  const snapshot=Object.freeze({obstacles:Object.freeze([3,8]),portals:Object.freeze([Object.freeze({entry:5,exit:27})]),
    hazards:Object.freeze([Object.freeze({cell:9,active:true}),Object.freeze({cell:12,active:false})]),food:Object.freeze({cell:7,kind:'bonus'})});
  const frozen=JSON.stringify(snapshot);
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const before=prior.createWorld(THREE,{width,height}),after=createWorld(THREE,{width,height});
    try{
      const a=before.group.getObjectByName('Flowing water'),b=after.group.getObjectByName('Flowing water');
      assert.ok(a?.isMesh&&b?.isMesh);
      assert.match(b.material.vertexShader,/waterUv=position\.xy\*\.018\+vec2\(time\*\.0014,time\*\.00065\)/);
      assert.match(b.material.vertexShader,/uniform float time;/);
      assert.match(b.material.fragmentShader,/texture2D\(waterField,waterUv\)/);
      assert.doesNotMatch(b.material.fragmentShader,/uniform float time|vec2 flow|waterUv\+flow/);
      assert.equal((b.material.fragmentShader.match(/texture2D\(/g)||[]).length,1);
      assert.equal(b.material.depthWrite,true);assert.equal(b.material.transparent,false);
      assert.equal(Buffer.compare(Buffer.from(a.material.uniforms.waterField.value.image.data),Buffer.from(b.material.uniforms.waterField.value.image.data)),0,'same texture');
      for(const name of ['position','normal','uv']){
        const x=a.geometry.getAttribute(name).array,y=b.geometry.getAttribute(name).array;
        assert.equal(Buffer.compare(Buffer.from(x.buffer,x.byteOffset,x.byteLength),Buffer.from(y.buffer,y.byteOffset,y.byteLength)),0,'same water geometry '+name);
      }
      assert.equal(a.geometry.index.count,b.geometry.index.count);
      assert.deepEqual(after.cameraOccluders,before.cameraOccluders);
      for(const time of [0,0.5,6.25,735.5]){
        before.update(snapshot,{time,reducedMotion:false});after.update(snapshot,{time,reducedMotion:false});
        assert.equal(b.material.uniforms.time.value,time);
        const vertices=b.geometry.getAttribute('position');
        for(const i of [0,Math.floor(vertices.count/2),vertices.count-1]){
          for(const [pos,speed] of [[vertices.getX(i),.0014],[vertices.getY(i),.00065]]){
            const fragment=Math.fround(Math.fround(pos*.018)+Math.fround(time*speed));
            const vertex=Math.fround(pos*.018+time*speed);
            assert.ok(Math.abs(vertex-fragment)<.000002,'affine flow interpolation retains phase at vertices');
          }
        }
      }
      before.update(snapshot,{time:90,reducedMotion:true});after.update(snapshot,{time:90,reducedMotion:true});
      assert.equal(a.material.uniforms.time.value,0);assert.equal(b.material.uniforms.time.value,0,'motion freezes');
      assert.deepEqual(after.stats(),before.stats(),'cues and GPU resource budgets preserved');
    }finally{before.dispose();after.dispose();}
    assert.equal(after.group.children.length,0);
  }
  assert.equal(JSON.stringify(snapshot),frozen);
});
