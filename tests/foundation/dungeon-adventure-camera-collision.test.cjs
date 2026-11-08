'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=name=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon',name+'.js'),'utf8')).toString('base64'));
const map=Array.from({length:19},()=>'.'.repeat(19));
const view=(x,y,z)=>({position:{x,y,z},aim:{x:0,y:1,z:0},fov:48});
const options={map,wallPositions:[[0,0]],wallHeights:[3.15],propVolumes:[],frameDelta:.016};
test('already-safe cinematic camera remains exactly unchanged; no speculative collisions',async()=>{
 const {planCameraVolumeSafety}=await load('camera-volume-safety');
 const current=view(-2,8,4),next=view(2,8,3);
 const result=planCameraVolumeSafety(current,next,options);
 assert.equal(result.corrected,false);
 assert.deepEqual(result.position,next.position);
 assert.equal(result.collisions,0);
 assert.ok(result.checked<=512);
});
test('actual opaque wall cannot contain a cinematic shot; live camera is moved to free air',async()=>{
 const {planCameraVolumeSafety,inspectCameraVolumeRisk}=await load('camera-volume-safety');
 const current=view(-2,2.1,0),next=view(0,1.4,0);
 const risk=inspectCameraVolumeRisk(current.position,next.position,options);
 assert.ok(risk.collisions>0);
 const result=planCameraVolumeSafety(current,next,options);
 assert.equal(result.corrected,true);
 assert.equal(result.authorityChanged,false);
 assert.equal(inspectCameraVolumeRisk(result.position,result.position,options).inside,false);
 assert.ok(result.position.y<=18);
 assert.deepEqual(current,view(-2,2.1,0));
 assert.deepEqual(next,view(0,1.4,0));
});
test('a camera already embedded in a physical pillar escapes instead of staying trapped forever',async()=>{
 const {planCameraVolumeSafety,inspectCameraVolumeRisk}=await load('camera-volume-safety');
 const props=[[-.3,0,-.3,.3,5.8,.3]],now=view(0,3.6,0),next=view(1,3.6,0);
 const opts={map,wallPositions:[],wallHeights:[],propVolumes:props,frameDelta:.016};
 assert.equal(inspectCameraVolumeRisk(now.position,now.position,opts).inside,true);
 const fixed=planCameraVolumeSafety(now,next,opts);
 assert.equal(fixed.corrected,true);
 assert.equal(fixed.mode,'escaped-camera-intersection');
 assert.equal(inspectCameraVolumeRisk(fixed.position,fixed.position,opts).inside,false);
});
test('real foreground architecture between two valid viewpoints blocks interpolated fly-through',async()=>{
 const {planCameraVolumeSafety,inspectCameraVolumeRisk}=await load('camera-volume-safety');
 const props=[[-.25,0,-.55,.25,6.05,.55]];
 const current=view(-2,3.6,0),next=view(2,3.6,0),opts={map,wallPositions:[],wallHeights:[],propVolumes:props,frameDelta:.016};
 assert.equal(inspectCameraVolumeRisk(current.position,next.position,opts).collisions,1);
 const result=planCameraVolumeSafety(current,next,opts);
 assert.equal(result.corrected,true);
 assert.notDeepEqual(result.position,next.position,'cannot let lens fly through still-visible pillar');
 assert.equal(inspectCameraVolumeRisk(current.position,result.position,opts).collisions,0,
  'actual next movement segment must stay out of solid masonry');
 assert.equal(inspectCameraVolumeRisk(result.position,result.position,opts).inside,false);
});
test('small bounded camera recovery handles high arches, scene edges and invalid geometry',async()=>{
 const {planCameraVolumeSafety}=await load('camera-volume-safety');
 const a=view(8.0,5,0),b=view(30,5,0);
 const huge=[[-20,-10,-20,20,80,20]];
 const result=planCameraVolumeSafety(a,b,{...options,wallPositions:[],wallHeights:[],propVolumes:huge});
 assert.ok(result.position.x<=8.35,'no camera escape outside this real playable map');
 assert.ok(result.position.y<=18);
 assert.ok(result.checked<=512);
 assert.ok(result.ignoredVolumes>=1,'over-large prop bounds cannot erase an entire stage');
 const bad=planCameraVolumeSafety(a,b,{...options,propVolumes:Array(170).fill(huge[0])});
 assert.ok(bad.checked<=512);
});
test('single adventure coordinator owns camera obstruction correction and protects manual view',async()=>{
 const {createAdventureCameraDirector}=await load('adventure-camera-director');
 const {planCameraVolumeSafety}=await load('camera-volume-safety');
 const d=createAdventureCameraDirector({collision:{plan:planCameraVolumeSafety}});
 const state={map,run:1,floor:1,tick:3,phase:'exploring',units:[]};
 const shot={mode:'journey',x:9,z:9,offsets:[5,8,5],subjects:['vanguard']};
 const a=view(-2,3,0),b=view(2,3,0),props=[[-.2,0,-.5,.2,6,.5]];
 d.begin(state,shot,.016);
 assert.equal(d.protectWorld(a,b,{map,wallPositions:[],wallHeights:[],propVolumes:props,frameDelta:.016}).corrected,true);
 d.begin(state,shot,.016,{autoDirector:false});
 assert.equal(d.protectWorld(a,b,{map,wallPositions:[],wallHeights:[],propVolumes:props,frameDelta:.016}),null,
  'manual spectator owns their own camera selection');
 assert.equal(d.metrics().scene,'1:1');
});
