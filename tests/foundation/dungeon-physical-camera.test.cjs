'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/physical-camera-director.js');
// Node's data: imports cannot resolve browser-root /dungeon/* specifiers.
// Inline the actual unmodified dependency bytes, preserving real policy and
// preventing false CI failures before any of the physical-camera assertions run.
const load=()=>{
 const dependency=fs.readFileSync(path.join(root,'public/ai-dungeon/foreground-sightline-plan.js'),'utf8');
 const depUrl='data:text/javascript;base64,'+Buffer.from(dependency).toString('base64');
 const projection=fs.readFileSync(path.join(root,'public/ai-dungeon/party-visibility-plan.js'),'utf8');
 const projectionUrl='data:text/javascript;base64,'+Buffer.from(projection).toString('base64');
 const threat=fs.readFileSync(path.join(root,'public/ai-dungeon/warden-threat-orbit.js'),'utf8');
 const threatUrl='data:text/javascript;base64,'+Buffer.from(threat).toString('base64');
 const cameraCode=fs.readFileSync(source,'utf8').replace(
  "'/dungeon/foreground-sightline-plan.js'",JSON.stringify(depUrl)).replace(
  "'/dungeon/party-visibility-plan.js'",JSON.stringify(projectionUrl)).replace(
  "'/dungeon/warden-threat-orbit.js'",JSON.stringify(threatUrl));
 return import('data:text/javascript;base64,'+Buffer.from(cameraCode).toString('base64'));
};
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
 assert.ok(result.occlusion.candidates<=9);
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
 assert.ok(code.includes('bodyVisible===samples.length'), 'camera evaluates the actual available skinned bone samples or bounded fallback, not only static five-ray samples');
 const {createPhysicalCameraDirector}=await load(),director=createPhysicalCameraDirector();
 const state=snap(),result=director.resolve(state,base(),options([[0,2],[1,2],[0,3]],[2.5,2.5,2.5]));
 if(result){assert.ok(result.occlusion.blockedAfter<=result.occlusion.blockedBefore);
  assert.ok(result.occlusion.fullyVisibleAfter>=result.occlusion.fullyVisibleBefore);}
 assert.deepEqual(state,snap());
});

test('camera truly casts through both native shoulders instead of the narrow central ray',async()=>{
 const src=fs.readFileSync(source,'utf8');
 assert.ok(src.includes('blockedByStone(cam,point,point.y,grid,size,eyes,reveal,pad)'));
 assert.ok(!src.includes('blockedByStone(cam,p,point.y,grid,size,eyes,reveal,pad)'));
 assert.match(src,/const RESCUE_SHOTS=Object\.freeze/);
 assert.match(src,/const MAX_CANDIDATES=ANGLES\.length\+RESCUE_SHOTS\.length/);
 const {createPhysicalCameraDirector}=await load();
 const snapshot=snap(),camera={look:{x:0,z:0},position:{x:1.1,y:3.6,z:7}};
 const walls={subjects:[{x:0,z:0,silhouetteRecess:true}],wallPositions:[[1,3]],wallHeights:[3.2],
  reveal:()=>'none',width:1440,height:832,fov:48,lookY:1};
 const candidate=createPhysicalCameraDirector().resolve(snapshot,camera,walls);
 assert.ok(candidate&&candidate.occlusion.blockedBefore>=4);
 assert.equal(candidate.occlusion.blockedAfter,0);
 assert.deepEqual(snapshot,snap());
});

test('camera tests real facade volume that grid-only rays cannot see',async()=>{
 const {planFacadeBodyOcclusion}=await load();
 const camera=Object.freeze({x:5,y:3.7,z:0});
 const boot=Object.freeze({x:0,y:.26,z:0}),chest=Object.freeze({x:0,y:1.1,z:0});
 const facade=Object.freeze([Object.freeze([2.5,1.55,0,.84,3.05,.82])]);
 const eyes=Object.freeze([Object.freeze({x:0,z:0,visibleActor:true})]);
 const original=JSON.stringify([camera,boot,facade,eyes]);
 assert.equal(planFacadeBodyOcclusion(camera,chest,facade,eyes,()=> 'none'),true);
 assert.equal(planFacadeBodyOcclusion(camera,boot,facade,eyes,()=> 'none'),true);
 assert.equal(planFacadeBodyOcclusion(camera,chest,facade,eyes,()=> 'sightline'),false);
 assert.equal(planFacadeBodyOcclusion(camera,chest,[[ -2,1.55,0,.84,3.05,.82]],eyes,()=> 'none'),false);
 assert.equal(planFacadeBodyOcclusion(camera,chest,facade,eyes,()=> 'nearby'),false);
 assert.equal(planFacadeBodyOcclusion(camera,chest,Array(2050).fill(facade[0]),eyes,()=> 'none'),false,'bound expensive views');
 assert.equal(JSON.stringify([camera,boot,facade,eyes]),original);
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const environment=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 assert.match(app,/facades:world\.userData\.dressing\?\.occlusionFaces/);
 assert.match(environment,/occlusionFaces:wallFaces/);
});

test('rendered physical facades and camera share the same real-actor cutaway band',async()=>{
 const {planFacadeBodyOcclusion}=await load();
 const f=[[2.5,1.55,0,.84,3.05,.82]],camera={x:5,y:3.7,z:0},point={x:0,y:1.1,z:0};
 const eyes=[{x:0,z:0,visibleActor:true}];
 assert.equal(planFacadeBodyOcclusion(camera,point,f,eyes,()=> 'none'),true);
 assert.equal(planFacadeBodyOcclusion(camera,point,f,eyes,()=> 'none',2.1,()=> 'sightline'),false);
 assert.equal(planFacadeBodyOcclusion(camera,point,f,eyes,()=> 'sightline',2.1,()=> 'none'),true);
 const environment=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(environment,/const facadeReveal=/);
 assert.match(environment,/coarse=facadeReveal\(f,eyes,camera,wallPad\)/);
 assert.match(environment,/const reveal=forceFacades\?\.has\(i\)\?'sightline':projected\?'sightline':coarse/, 'actual source Raycaster facade hits take priority over approximate projection and retain existing band fallbacks');
 assert.match(app,/facadeReveal:world\.userData\.dressing\?\.facadeReveal/);
});

test('real portrait combat camera orbits a drawn front pillar that masks the acting lane despite clear body rays',async()=>{
 const {planPortraitShotClutter,createPhysicalCameraDirector}=await load();
 const live=Object.freeze({x:0,z:0,kind:'vanguard',visibleActor:true});
 const camera=Object.freeze({x:0,y:6.2,z:7}),look=Object.freeze({x:0,y:1,z:0});
 // Not directly across the central head/body ray; the true tall stone
 // occupies the phone's right-hand sword/evade lane in real camera space.
 const pillar=Object.freeze([.6,0,2.45,1.1,2.6,2.85]);
 const portrait={width:390,height:844,fov:48};
 const obstruction=planPortraitShotClutter(camera,look,[live],[pillar],portrait);
 assert.equal(obstruction.props,1);
 assert.ok(obstruction.penalty>2.3,'nearby adult-height foreground prop occupies a meaningful phone fraction');
 assert.deepEqual(planPortraitShotClutter(camera,look,[live],[pillar],{width:1440,height:832,fov:48}),
  {penalty:0,props:0},'desktop composition is not unnecessarily changed');
 assert.deepEqual(planPortraitShotClutter(camera,look,[{...live,visibleActor:false}],[pillar],portrait),
  {penalty:0,props:0},'not an arbitrary scenic-point x-ray');
 assert.deepEqual(planPortraitShotClutter(camera,look,[live],[[-.2,0,-2.85,.2,2.6,-2.45]],portrait),
  {penalty:0,props:0},'rear landmark remains visible');
 assert.deepEqual(planPortraitShotClutter(camera,look,[live],[[2,0,2.45,2.4,2.6,2.85]],portrait),
  {penalty:0,props:0},'off-axis architecture remains');
 assert.deepEqual(planPortraitShotClutter(camera,look,[live],[pillar],{width:390,height:844,fov:48}),
  obstruction,'same seed and camera must not add frame entropy');
 const before=snap();
 const initial={look:{x:0,z:0},position:{...camera}};
 const options={subjects:[live],wallPositions:[],wallHeights:[],propVolumes:[pillar],
  reveal:()=> 'none',width:390,height:844,fov:48,lookY:1};
 const director=createPhysicalCameraDirector();
 const shot=director.resolve(before,initial,options);
 assert.ok(shot,'a genuine unhidden actor deserves a bounded camera orbit for its obscured acting lane');
 assert.equal(shot.occlusion.blockedBefore,0,'previous skull/chest/boot rays reported a falsely clear scene');
 assert.equal(shot.occlusion.croppedAfter,0,'camera cannot trade foreground for a cropped fighter');
 assert.equal(shot.occlusion.fullyVisibleAfter,shot.occlusion.fullyVisibleBefore);
 assert.ok(shot.occlusion.foregroundPenaltyBefore>2.3);
 assert.equal(shot.occlusion.foregroundPropsAfter,0,'new camera leaves the actual pillar out of the acting window');
 assert.ok(Math.hypot(shot.position.x,shot.position.z)<9,'still inside the original physical dungeon');
 assert.deepEqual(director.resolve(before,initial,options),shot,'same authority tick holds the chosen camera');
 assert.deepEqual(before,snap(),'camera cannot change run/seed/floor/tick/HP');
 assert.deepEqual(initial,{look:{x:0,z:0},position:{...camera}});
});
