'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { sampleTidalTerraceRelief, buildErodedIslandShelfGeometry,
  buildRootedFlagstoneFoundationGeometry, createWorld } = require('../../public/snake-stream/world.mjs');
for(const [width,height] of [[8,8],[28,16],[40,24]]) {
 test(`T1 real four-shore rock + rooted limestone share one actual tidal elevation ${width}x${height}`,()=>{
   assert.equal(typeof sampleTidalTerraceRelief,'function','One physically shared tide-strata relief field required');
   const angles=[.12,.53,1.1,1.72,2.62,3.35,4.27,5.42];
   const values=angles.map(a=>sampleTidalTerraceRelief(width,height,a));
   assert.ok(new Set(values.map(v=>v.edge)).size>=3,'All physically distinct banks must participate');
   assert.ok(values.every(v=>Number.isFinite(v.rise)&&Number.isFinite(v.reach)&&v.reach>-.24&&v.reach<1.1));
   const a=buildErodedIslandShelfGeometry(THREE,width,height,'cliff');
   const m=buildErodedIslandShelfGeometry(THREE,width,height,'moss');
   const f=buildRootedFlagstoneFoundationGeometry(THREE,width,height);
   try{
     assert.equal(a.index.count, f.index.count);
     assert.equal(a.getAttribute('position').count, m.getAttribute('position').count);
     const ca=a.getAttribute('position'),cm=m.getAttribute('position'),cf=f.getAttribute('position');
     for(let k=0;k<96;k++){
       const fixedIndex=1+k;
       assert.ok(ca.getY(fixedIndex)<0 && cm.getY(fixedIndex)<0 && cf.getY(fixedIndex)<0,
         'Top island and flagstone fan must stay BELOW true playable cell surfaces');
     }
     const w=createWorld(THREE,{width,height});
     try{
       const s=w.stats(); assert.equal(s.drawObjects,33); assert.equal(s.staticMeshes,13);assert.equal(s.textures,4);
     }finally{w.dispose();}
   }finally{a.dispose();m.dispose();f.dispose();}
 });
}
