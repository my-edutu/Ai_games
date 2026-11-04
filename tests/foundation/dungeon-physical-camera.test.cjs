'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/physical-camera-director.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));
const map=Array.from({length:19},(_,z)=>Array.from({length:19},(_,x)=>z===0||z===18||x===0||x===18?'#':'.').join(''));
const snap=()=>({map,run:1,floor:1,tick:42,phase:'exploring',units:[{id:'vanguard',x:9,z:9,hp:100},{id:'ranger',x:10,z:9,hp:80},{id:'mystic',x:8,z:9,hp:70}]});
const base=()=>({look:{x:0,z:0},position:{x:0,y:6.2,z:7}});
const eyes=()=>[{x:0,z:0,silhouetteRecess:true},{x:.85,z:0,silhouetteRecess:true},{x:-.8,z:0,silhouetteRecess:true}];
const options=(walls,heights)=>({subjects:eyes(),wallPositions:walls,wallHeights:heights,reveal:()=> 'none',width:1440,height:832,fov:48,lookY:1});
test('a real chest/boot obstruction earns an alternate physical orbit, not a cosmetic shot',async()=>{
 const {createPhysicalCameraDirector}=await load(),director=createPhysicalCameraDirector();
 const s=snap(),b=base(),o=options([[0,2],[0,3],[1,3]],[2.7,2.7,2.7]);
 const result=director.resolve(s,b,o);
 assert.ok(result,'body-hidden case requires a measured alternative');
 assert.ok(result.occlusion.blockedAfter<result.occlusion.blockedBefore);
 assert.ok(result.occlusion.after-result.occlusion.baseline>2.3);
 assert.ok(result.occlusion.fullyVisibleAfter>=result.occlusion.fullyVisibleBefore);
 assert.ok(result.occlusion.candidates<=6);
 assert.ok(Math.hypot(result.position.x,result.position.z)<9);
 assert.deepEqual(s,snap());assert.deepEqual(b,base());
 // The same tick and camera target reuse the physical shot without evaluating
 // six complete ray bundles per WebGL frame.
 assert.deepEqual(director.resolve(s,b,o),result);
 assert.equal(director.metrics().checks,1);
});
test('clear encounters, explicit reduced-motion and real boss warnings preserve the original director',async()=>{
 const {createPhysicalCameraDirector}=await load();
 const d=createPhysicalCameraDirector();
 const s=snap(),b=base();
 assert.equal(d.resolve(s,b,options([],[])),null);
 assert.equal(d.resolve({...s,tick:43,bossWarning:{cells:[{x:9,z:9}]}},b,options([[0,2]],[2.7])),null);
 assert.equal(d.resolve({...s,tick:44},b,{...options([[0,2]],[2.7]),reducedMotion:true}),null);
 assert.equal(d.resolve({...s,tick:45,phase:'intermission'},b,options([[0,2]],[2.7])),null);
 assert.deepEqual(s,snap());
});
test('camera cannot follow fabricated coordinates, huge grids or a lens that crops more actors',async()=>{
 const {createPhysicalCameraDirector}=await load();
 const d=createPhysicalCameraDirector(),s=snap(),b=base(),o=options([[0,1],[0,2],[0,3]],[2.8,2.8,2.8]);
 assert.equal(d.resolve({...s,map:[]},b,o),null);
 assert.equal(d.resolve(s,{...b,position:{x:NaN,y:5,z:4}},o),null);
 assert.equal(d.resolve(s,b,{...o,reveal:null}),null);
 assert.equal(d.resolve(s,b,{...o,subjects:[{x:Infinity,z:0}]}),null);
 const maybe=d.resolve(s,b,{...o,width:390,height:844});
 if(maybe){assert.ok(maybe.occlusion.croppedAfter<=maybe.occlusion.croppedBefore);assert.ok(Math.abs(maybe.position.x)<=8.35&&Math.abs(maybe.position.z)<=8.35);}
});
test('real scene hooks use one planner for camera, physical cutaways and diagnostics',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const sourceText=fs.readFileSync(source,'utf8');
 assert.match(app,/createPhysicalCameraDirector\(\)/);
 assert.match(app,/physicalCameraDirector\.resolve\(state/);
 assert.match(app,/const plannedCamera=occlusionCamera\?\?basePlannedCamera/);
 assert.match(app,/cameraOcclusion:physicalCameraDirector\.metrics\(\)/);
 assert.match(app,/cutawayWalls\(target,partySightlines/);
 for(const forbidden of ['Math.random(','Date.now(','fetch(','DungeonRuntime'])assert.equal(sourceText.includes(forbidden),false);
});

test('physical orbit checks real native shoulder lanes and preserves public authority',async()=>{
 const code=fs.readFileSync(source,'utf8');
 assert.ok(code.includes('side:-.26')&&code.includes('side:.26'));
 assert.ok(code.includes('bodyVisible===BODY_SAMPLES.length'));
 const {createPhysicalCameraDirector}=await load(),director=createPhysicalCameraDirector();
 const state=snap(),result=director.resolve(state,base(),options([[0,2],[1,2],[0,3]],[2.5,2.5,2.5]));
 if(result){assert.ok(result.occlusion.blockedAfter<=result.occlusion.blockedBefore);
  assert.ok(result.occlusion.fullyVisibleAfter>=result.occlusion.fullyVisibleBefore);}
 assert.deepEqual(state,snap());
});

test('camera truly casts through both native shoulders, not just the body's central ray',async()=>{
 const src=fs.readFileSync(source,'utf8');
 assert.ok(src.includes('blockedByStone(cam,point,point.y,grid,size,eyes,reveal,pad)'));
 assert.ok(!src.includes('blockedByStone(cam,p,point.y,grid,size,eyes,reveal,pad)'));
 const {createPhysicalCameraDirector}=await load();
 const snapshot=snap(),camera={look:{x:0,z:0},position:{x:1.1,y:3.6,z:7}};
 const walls={subjects:[{x:0,z:0,silhouetteRecess:true}],wallPositions:[[1,3]],wallHeights:[3.2],
  reveal:()=>'none',width:1440,height:832,fov:48,lookY:1};
 const candidate=createPhysicalCameraDirector().resolve(snapshot,camera,walls);
 assert.ok(candidate&&candidate.occlusion.blockedBefore>=4);
 assert.equal(candidate.occlusion.blockedAfter,0);
 assert.deepEqual(snapshot,snap());
});
