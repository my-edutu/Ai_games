'use strict';
// W415: a real followed, active citizen previously left the entire 3D world
// frozen on sky after render() repeatedly threw ReferenceError: nearPeople.
// This contract runs the actual GPU-resident selection prefix, not a mock copy.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('foreground worksite residency receives the actual near-citizen Set on every draw',()=>{
 const start=html.indexOf('function prepareForegroundResidents(');
 const end=html.indexOf(' ranked.sort(',start);
 assert.ok(start>=0&&end>start,'original resident preparation and ranked selection present');
 const prefix=html.slice(start,end);
 assert.match(prefix,/function prepareForegroundResidents\(rows,frame,nearPeople\)/,
  'the original selection function must receive nearPeople explicitly');
 assert.match(html,/prepareForegroundResidents\(foregroundRows,commuterFrame,nearPeople\)/,
  'original renderer must pass its actual current-frame citizen-detail Set');
 // Execute the genuine priority selection from the game with strict stubs.
 // A missing nearPeople binding throws here exactly as it did in uncut W414 video.
 const nearPeople=new Set([7]);
 const context={
  gpuAvailable:true,foregroundResidentVisible:[],
  restingActorCounters:()=>({}),
  isObservedWorksiteSkinCandidate:(person,index,indices)=>{
   assert.equal(indices,nearPeople,'same current-frame visibility Set, not a copied list');
   assert.equal(index,7);
   return indices.has(index);
  }
 };
 vm.createContext(context);
 vm.runInContext(prefix+'\nreturn ranked;\n}',context,{timeout:1000});
 const ranking=context.prepareForegroundResidents([{p:{name:'actual worker'},i:7}],null,nearPeople);
 assert.equal(ranking.length,1);
 assert.equal(ranking[0].priority,4,'genuine selected working citizen wins GPU slot');
});
