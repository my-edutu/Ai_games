'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const helper=import(pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/first-source-room-return.mjs')).href);
const scenePath=path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/scene.mjs');
const source={floor:9,theme:'void',lifecycle:'running',
  runToken:'first-real-native-episode',tick:475,player:{health:4}};
const returned={sourceBound:true,runToken:source.runToken,sourceTick:475,
  originalOwnerPresent:true,successorOwnerPresent:true};
test('only the first valid source-and-render-matched episode can own the audit',async()=>{
 const {firstReturnedOriginalRoomAdmission:admit}=await helper;
 assert.deepEqual(admit(null,source,returned),{
   runToken:'first-real-native-episode',isFirst:true});
 assert.deepEqual(admit(source.runToken,{...source,tick:476},
   {...returned,sourceTick:476}),{runToken:source.runToken,isFirst:false});
 assert.equal(admit(source.runToken,{...source,runToken:'autonomous-restart'},
   {...returned,runToken:'autonomous-restart'}),null);
 assert.equal(admit(source.runToken,{...source,tick:476},returned),null);
 assert.equal(admit(null,source,{...returned,sourceBound:false}),null);
 assert.equal(admit(null,source,{...returned,originalOwnerPresent:false,
   successorOwnerPresent:false}),null);
 assert.equal(admit(null,{...source,runToken:'other'},returned),null);
 assert.equal(admit(null,{...source,lifecycle:'finished'},returned),null);
});
test('pins first actual F9 renderer return even when successor and old owners are missing',async()=>{
 const {firstReturnedFloorNineEpisode:pin,firstReturnedOriginalRoomAdmission:admit}=await helper;
 const first=pin(null,source);
 assert.deepEqual(first,{runToken:source.runToken,isFirst:true});
 assert.equal(admit(first.runToken,source,null),null);
 const later={...source,tick:317,runToken:'restarted-but-real'};
 assert.equal(pin(first.runToken,later),null);
 assert.equal(admit(first.runToken,later,{...returned,runToken:later.runToken,sourceTick:317}),null);
 assert.deepEqual(pin(first.runToken,{...source,tick:480}),{
   runToken:source.runToken,isFirst:false});
 assert.equal(pin(null,{...source,player:{health:0}}),null);
});
test('actual renderer return path does not erase first film episode on a restart',()=>{
 const scene=fs.readFileSync(scenePath,'utf8');
 assert.match(scene,/firstReturnedOriginalRoomAdmission\(\s*originalToVoidReturnedRun,\s*snapshot,\s*roomReturn\s*\)/);
 assert.match(scene,/firstReturnedFloorNineEpisode\\(originalToVoidReturnedRun,snapshot\\)/);
 assert.doesNotMatch(scene,/originalToVoidReturnedTimeline\.length\s*=\s*0/);
 assert.match(scene,/originalToVoidReturnedTimeline\.push\(/);
 assert.match(scene,/sourceHandoffReturnWitness\?\.\(snapshot\)/);
});
