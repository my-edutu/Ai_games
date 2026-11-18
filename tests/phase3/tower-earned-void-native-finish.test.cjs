'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const palette=import('../../public/infinite-tower-climb/visuals/original-clockwork-architecture-palette.mjs');

test('source-earned successor materials retain an independent original Void finish even while the old bronze gateway remains warm',async()=>{
  const THREE=await import('three');
  const {createOriginalClockworkArchitecturalPalette}=await palette;
  const materials={
    stone:new THREE.MeshStandardMaterial({color:0x514963}),
    dark:new THREE.MeshStandardMaterial({color:0x28233c}),
    metal:new THREE.MeshStandardMaterial({color:0x6a577e}),
    copper:new THREE.MeshStandardMaterial({color:0x7b5b66}),
    edge:new THREE.MeshStandardMaterial({color:0xb3a3c9}),
    landing:new THREE.MeshStandardMaterial({color:0x726982}),
    tread:new THREE.MeshStandardMaterial({color:0x28233c}),
    ceramic:new THREE.MeshStandardMaterial({color:0x93879e})
  };
  const bronze={stone:0x806347,dark:0x413227,metal:0xa77744,edge:0xcda273,landing:0x8f654a};
  const p=createOriginalClockworkArchitecturalPalette(materials,bronze);
  const realVoidStone=materials.stone.color.clone(), realVoidMetal=materials.metal.color.clone();
  p.update({sourceBound:true,kind:'verified-original-roof-receipt',
    sourceTick:500,crossingTick:475,oldWeight:1});
  assert.notEqual(materials.stone.color.getHex(),realVoidStone.getHex(),
    'old-to-new shared palette is genuinely bronze during a real crossing');
  assert.equal(p.nativeColorFor(materials.stone)?.getHex(),realVoidStone.getHex(),
    'original successor stone is recoverable independently from warmed old gateway');
  assert.equal(p.nativeColorFor(materials.metal)?.getHex(),realVoidMetal.getHex());
  assert.equal(p.nativeColorFor(new THREE.MeshStandardMaterial()) ,null,
    'unknown materials do not gain permission to copy a successor color');
  const copy=p.nativeColorFor(materials.stone);
  copy.set(0xffffff);
  assert.equal(p.nativeColorFor(materials.stone)?.getHex(),realVoidStone.getHex(),
    'callers cannot mutate captured native color');
  p.restore();
  assert.equal(materials.stone.color.getHex(),realVoidStone.getHex());
  Object.values(materials).forEach(m=>m.dispose());
});

test('shipping post-return source-earned Void structural geometry uses native finish without repainting guardian gateway or world authority',()=>{
  const world=fs.readFileSync(path.join(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/deferredDistantArrival\?\.proof==='recorded-source-gateway'/);
  assert.match(world,/originalClockworkArchitecturalPalette\?\.nativeColorFor\(original\)/);
  assert.match(world,/if\(nativeTint\)material\.color\.copy\(nativeTint\)/);
  assert.match(world,/sourceColor:nativeTint\?\?original\.color/);
  assert.match(world,/job\.structuralRoot\.visible=job\.structuralFade>\.015/);
  assert.match(world,/held\.originalGatewayOpacity=originalGatePresence/);
  assert.doesNotMatch(world,/snapshot\.player\.(?:x|y|grounded|health)\s*=/);
});
