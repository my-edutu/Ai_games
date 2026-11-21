'use strict';
const {historicalRendererGitBlob} = require('../helpers/snake-t1-living-archive.cjs');
const {test}=require('node:test');
const {restorePreR46}=require('../helpers/snake-r46-cache-archive.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const sourcePath=path.resolve(__dirname,'../../public/snake-stream/renderer.mjs');
const blob = historicalRendererGitBlob;
function predecessor(source){
  for(const name of ['WATER SAMPLING HELPER','WATER SAMPLING ADAPT','WATER SAMPLING INIT','WATER SAMPLING STATS']){
    const begin='// BEGIN R43 '+name+'\n',end='// END R43 '+name+'\n';
    const a=source.indexOf(begin),b=source.indexOf(end);
    assert.ok(a>=0&&b>a&&source.indexOf(begin,a+1)<0,'one reversible '+name);
    source=source.slice(0,source.lastIndexOf('\n',a-1)+1)+source.slice(b+end.length);
  }
  return source;
}
test('R43 exact prior renderer and original low-water mip chain remain bounded and reversible',async()=>{
  const source=fs.readFileSync(sourcePath,'utf8'),previous=predecessor(source);
  assert.equal(blob(restorePreR46(previous)),'dce31f68dcc0a28b5792a502f6575e7939f6289d','exact R43 historical Git blob before later R46');
  const THREE=await import('three');
  const {createWorld}=await import('../../public/snake-stream/world.mjs');
  const context=vm.createContext({});
  vm.runInContext(source.replace(/^import .*;\n/gm,'').replace(/^export (?=function )/gm,'')
    +'\nthis.configureWater=configureLowQualityWaterSampling;',context);
  const configure=context.configureWater;
  assert.equal(typeof configure,'function');
  assert.equal(configure({group:new THREE.Group()},THREE),false,'no water during startup or fallback');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const world=createWorld(THREE,{width,height});
    try{
      const water=world.group.getObjectByName('Flowing water');
      assert.ok(water?.isMesh,'actual authored water mesh exists');
      const texture=water.material.uniforms.waterField.value;
      const originalPixels=Buffer.from(texture.image.data);
      const originalResources=world.stats();
      const version=texture.version;
      assert.equal(texture.minFilter,THREE.LinearMipmapLinearFilter,'original balanced trilinear mip quality');
      assert.equal(texture.generateMipmaps,true,'retain original mip anti-alias hierarchy');
      assert.equal(configure(world,THREE),true);
      assert.equal(texture.minFilter,THREE.LinearMipmapNearestFilter,'one bilinear mip fetch in low tier');
      assert.equal(texture.version,version+1,'one texture version change');
      assert.equal(configure(world,THREE),true);
      assert.equal(texture.version,version+1,'not a repeated GPU upload');
      assert.equal(Buffer.compare(Buffer.from(texture.image.data),originalPixels),0,'original lake pixels unchanged');
      assert.deepEqual(world.stats(),originalResources,'same original world resources and draw objects');
      const frame={obstacles:[3],portals:[{entry:9,exit:width*height-3}],
        hazards:[{cell:5,active:true,phase:3}],food:{cell:12}};
      const frozen=JSON.stringify(frame);
      world.update(frame,{time:7.25,reducedMotion:false});
      assert.equal(water.material.uniforms.time.value,7.25,'flowing surface remains');
      world.update(frame,{time:7.25,reducedMotion:true});
      assert.equal(water.material.uniforms.time.value,0,'reduced motion freezes lake');
      assert.equal(JSON.stringify(frame),frozen,'public snapshot immutable');
      assert.equal(world.stats().portalEnds,2);
      assert.equal(world.stats().hazards,1);
    }finally{world.dispose();}
  }
});
