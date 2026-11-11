'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../public/ai-dungeon');
const url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const load=name=>import(url(fs.readFileSync(path.join(root,name),'utf8')));
const createScene=()=>{
 const n=19,half=9,map=Array.from({length:n},(_,z)=>
  Array.from({length:n},(_,x)=>z===0||x===0||z===18||x===18?'#':'.').join(''));
 const boss={id:'warden-1',kind:'warden',faction:'enemy',hp:220,maxHp:220,x:9,z:9};
 const ranger={id:'ranger',kind:'ranger',faction:'party',hp:80,maxHp:80,x:12,z:9};
 const cells=[];for(let z=7;z<=11;z++)for(let x=7;x<=11;x++)
  if(!(x===11&&z===11))cells.push({x,z});
 const state={map,run:1,floor:1,tick:32,phase:'exploring',units:[boss,ranger],
  bossWarning:{attackTick:34,shape:'NOVA',axis:'EAST_WEST',cells}};
 const body=(u,h)=>[{x:u.x-half,y:.1,z:u.z-half},
  {x:u.x-half-.25,y:h*.62,z:u.z-half},
  {x:u.x-half+.25,y:h*.62,z:u.z-half},{x:u.x-half,y:h,z:u.z-half}];
 const subjects=[{kind:'warden',unitId:boss.id,x:0,z:0,visibleActor:true,
  bodyPoints:body(boss,2.67)},{kind:'ranger',unitId:ranger.id,x:3,z:0,
  visibleActor:true,bodyPoints:body(ranger,1.82)}];
 const base={look:{x:1,y:.5,z:0},position:{x:3,y:11,z:8}};
 return {state,subjects,base,width:390,height:658,fov:53};
};
test('23+ true Warden danger tiles and both native bodies fit one physical 390px lens after a bounded re-aim',async()=>{
 const {planWardenThreatComposition,assessThreatOrbit}=await load('warden-threat-orbit.js');
 const input=createScene(),before=JSON.stringify(input);
 const baseline=assessThreatOrbit(input,input.base.position);
 assert.ok(baseline.fitFov>input.fov-.5,'this tested view genuinely crops dangerous tiles');
 const chosen=planWardenThreatComposition(input);
 assert.equal(chosen.status,'IMPROVED');
 assert.equal(chosen.threatCells,input.state.bossWarning.cells.length);
 assert.equal(chosen.criticalActors,2);
 assert.ok(chosen.framing.fitFov<=input.fov-.5);
 assert.ok(chosen.framing.minHeroPixels>=baseline.minHeroPixels*.90);
 assert.ok(chosen.separationGainPx>=-4);
 assert.ok(chosen.lookShiftMeters>0&&chosen.lookShiftMeters<=2.25);
 assert.ok(chosen.checked<=180,'one bounded physical shot search per real Warden warning, never per frame');
 const sceneBase={look:chosen.look,position:{
  x:input.base.position.x+(chosen.look.x-input.base.look.x),
  y:input.base.position.y,z:input.base.position.z+(chosen.look.z-input.base.look.z)}};
 const validated=assessThreatOrbit({...input,base:sceneBase},chosen.position);
 assert.ok(validated.valid&&validated.fitFov<=input.fov-.5);
 assert.equal(JSON.stringify(input),before,'no state mutation, fabricated damage or generated movement');
 assert.deepEqual(planWardenThreatComposition(input),chosen,'same seed and camera reproducible');
});
test('new warning camera does not override desktop, reduced motion, stale threat, forged cell or one fighter',async()=>{
 const {planWardenThreatComposition}=await load('warden-threat-orbit.js'),input=createScene();
 assert.equal(planWardenThreatComposition({...input,width:1440,height:832}).status,'UNAVAILABLE');
 assert.equal(planWardenThreatComposition({...input,reducedMotion:true}).status,'UNAVAILABLE');
 assert.equal(planWardenThreatComposition({...input,subjects:[input.subjects[0]]}).status,'UNAVAILABLE');
 assert.equal(planWardenThreatComposition({...input,state:{...input.state,bossWarning:null}}).status,'UNAVAILABLE');
 assert.equal(planWardenThreatComposition({...input,state:{...input.state,
  tick:input.state.bossWarning.attackTick}}).status,'UNAVAILABLE');
 assert.equal(planWardenThreatComposition({...input,state:{...input.state,bossWarning:{
  ...input.state.bossWarning,cells:[{x:1000,z:1000}]}}}).status,'UNAVAILABLE');
});
test('live critical camera fit includes the last real warning cell corners, not only its first 40 samples',async()=>{
 const {planCriticalSubjectFit}=await load('cinematic-chapter-plan.js');
 const actual=[];for(let i=0;i<18;i++)actual.push({x:.1,y:0,z:-12});
 // 23 authentic cells have 92 source-driven corners. Only the last cells
 // approach the right frame edge: the former slice(0,40) silently ignored them.
 for(let i=0;i<92;i++)actual.push({x:i<80?.2:2,y:.08,z:-6});
 const before=JSON.stringify(actual);
 const fit=planCriticalSubjectFit(actual,390/658,48);
 assert.ok(fit.subjects===110,'every 23-cell footprint corner and source-rig sample inspected');
 assert.ok(fit.fov>48,'the last true hazard corners force an actual lens correction');
 assert.equal(JSON.stringify(actual),before);
});
test('physical director integrates warning centroid with truth-preserving 3D source-rig and cutaway policy',async()=>{
 const fore=fs.readFileSync(path.join(root,'foreground-sightline-plan.js'),'utf8');
 const party=fs.readFileSync(path.join(root,'party-visibility-plan.js'),'utf8');
 const threat=fs.readFileSync(path.join(root,'warden-threat-orbit.js'),'utf8');
 const src=fs.readFileSync(path.join(root,'physical-camera-director.js'),'utf8')
  .replace("'/dungeon/foreground-sightline-plan.js'",JSON.stringify(url(fore)))
  .replace("'/dungeon/party-visibility-plan.js'",JSON.stringify(url(party)))
  .replace("'/dungeon/warden-threat-orbit.js'",JSON.stringify(url(threat)));
 const {createPhysicalCameraDirector}=await import(url(src));
 const input=createScene(),original=JSON.stringify(input);
 const d=createPhysicalCameraDirector();
 const options={subjects:input.subjects,wallPositions:[],wallHeights:[],
  facades:[],propVolumes:[],reveal:()=>'none',width:390,height:658,fov:53,lookY:.5};
 const shot=d.resolve(input.state,input.base,options);
 assert.ok(shot,'real warning merits a true hazard-fit camera improvement');
 assert.equal(shot.occlusion.reason,'threat-safe-optical-framing');
 assert.ok(shot.occlusion.requiredFovAfter<=52.5);
 assert.ok(shot.occlusion.minimumCriticalPixelsAfter>=shot.occlusion.minimumCriticalPixelsBefore*.9);
 assert.ok(shot.position.y<=input.base.position.y-.8,
  'the real physical director must adopt the accepted lowered source-rig shot');
 assert.ok(shot.occlusion.minimumCriticalPixelsAfter>=shot.occlusion.minimumCriticalPixelsBefore+4,
  'must increase original bodies without weakening the actual danger, stone or occlusion checks');
 assert.deepEqual(d.resolve(input.state,input.base,options),shot,'one stable warning exposure');
 assert.equal(d.metrics().checks,1);
 assert.equal(JSON.stringify(input),original);
 assert.equal(createPhysicalCameraDirector().resolve(input.state,input.base,
  {...options,reducedMotion:true}),null);
});

test('portrait Warden camera earns a real lower-angle source-body gain with every dangerous tile still visible',async()=>{
 const {planWardenThreatComposition,assessThreatOrbit}=await load('warden-threat-orbit.js');
 const input=createScene(),original=JSON.stringify(input);
 const baseline=assessThreatOrbit(input,input.base.position);
 const chosen=planWardenThreatComposition(input);
 assert.equal(chosen.status,'IMPROVED');
 assert.ok(chosen.lift<=-.8,'must explore a genuinely lower physical 3D camera, not only spin a high overhead shot');
 assert.ok(chosen.framing.minHeroPixels>=baseline.minHeroPixels+4,
  'native original skinned source silhouettes must gain actual on-screen pixels');
 assert.ok(chosen.framing.fitFov<=input.fov-.5,'fit all four corners of every real warning cell');
 assert.ok(chosen.framing.bodyGapPx>=baseline.bodyGapPx-4,'avoid hiding one original fighting rig behind another');
 assert.ok(chosen.checked<=180,'bounded search once per true warning, not per frame');
 assert.equal(JSON.stringify(input),original,'optical composition cannot change authoritative state');
});
