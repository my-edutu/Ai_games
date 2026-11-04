'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/stone-relief-plan.js'),'utf8')).toString('base64'));
test('carved weathering remains attached to the actual top of low physical arcade ruins, never floating',async()=>{
 const {planStoneRelief}=await load();
 const faces=Array.from({length:44},(_,i)=>[(i%9)-4,0,Math.floor(i/9)-2,.60,[.78,.86,.94,1.02][i%4],.1,0,1,0]);
 const first=planStoneRelief(faces,1),again=planStoneRelief(faces,1);
 assert.deepEqual(first,again);
 assert.ok(first.spalls.length>=12,'source-native low stone walls still need carved material identity');
 assert.ok(first.coping.length>=3);
 for(const item of first.spalls){
  const face=faces[item.faceIndex];assert.ok(item.y+item.sy/2<=face[4]+.005,'stone chip must fit below its physical host');
 }
 for(const item of first.coping){
  const face=faces[item.faceIndex];assert.ok(Math.abs(item.y-(face[4]+.035))<1e-6,'broken coping sits on real wall top');
 }
 assert.ok(first.spalls.length<=54&&first.coping.length<=32);
});
