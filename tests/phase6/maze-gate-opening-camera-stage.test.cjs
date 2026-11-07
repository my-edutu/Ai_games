'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const modulePath=path.resolve(__dirname,'../../public/ai-maze-escape/map-view.mjs');
const scene=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
const offset=()=>({x:20,y:21,z:14,set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}});

test('a genuine north/south public opening cranes above the foreground with a stable physical camera',async()=>{
 const {setPublicGateOpeningStageOffset:stage}=await import(pathToFileURL(modulePath).href);
 const view=offset();
 assert.equal(stage(view,{a:77,b:94},17),true);
 assert.deepEqual([view.x,view.y,view.z],[6,34,25]);
 assert.equal(stage(view,{a:94,b:77,hiddenRoute:[7,8],privateThreat:10},17),true);
 assert.deepEqual([view.x,view.y,view.z],[6,34,25]);
 assert.match(scene,/openingStageView\s*\?\s*openingGateCameraOffset/,
  'the real WebGL camera must use the public physical opening offset');
});
test('east/west gate cranes perpendicular; invalid/unseen edges cannot move the camera',async()=>{
 const {setPublicGateOpeningStageOffset:stage}=await import(pathToFileURL(modulePath).href);
 const view=offset();
 assert.equal(stage(view,{a:77,b:78},17),true);
 assert.deepEqual([view.x,view.y,view.z],[25,34,6]);
 for(const [cue,width] of [[null,17],[{a:77,b:77},17],[{a:77,b:79},17],
   [{a:84,b:85},17],[{a:-1,b:16},17],[{a:77,b:94},0],
   [{a:77,b:94},NaN],[{a:77,b:94},'17']]){
   const before=[view.x,view.y,view.z];
   assert.equal(stage(view,cue,width),false);
   assert.deepEqual([view.x,view.y,view.z],before);
 }
 assert.match(scene,/openingStageView\s*=\s*!!openingGateBeat/,
  'the real cue must remain gated by follow/reduced motion/guardian/terminal truth');
});
