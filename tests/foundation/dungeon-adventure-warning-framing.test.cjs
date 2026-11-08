'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=name=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon',name+'.js'),'utf8')).toString('base64'));
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const map=Array.from({length:19},()=>'.'.repeat(19));
const sample=()=>({run:1,floor:1,tick:30,phase:'exploring',map,units:[
 {id:'vanguard',kind:'vanguard',faction:'party',hp:95,x:11,z:12},
 {id:'ranger',kind:'ranger',faction:'party',hp:81,x:12,z:12},
 {id:'warden',kind:'warden',faction:'enemy',hp:160,x:15,z:12}],
 bossWarning:{shape:'NOVA',attackTick:31,cells:Array.from({length:25},(_,i)=>({x:11+i%5,z:9+Math.floor(i/5)}))}});
const base={look:{x:4,y:.35,z:3},position:{x:7,y:9.1,z:7.9},boundaryLimit:8.35};
const options={width:390,height:844,fov:55,lookY:.35};
test('real warning footprint uses ALL tile edges, with bounded honest visibility report',async()=>{
 const {planAuthoritativeThreatFrame,inspectThreatCoverage}=await load('adventure-threat-framing');
 const s=sample(),original=JSON.stringify(s),baseBefore=JSON.stringify(base);
 const before=inspectThreatCoverage(s,base,options);
 const selected=planAuthoritativeThreatFrame(s,base,options);
 assert.ok(selected,'real urgent warning should return a fully measured framing decision');
 assert.ok(selected.coverage.cells===25,'do not silently truncate 32+ real cells');
 assert.ok(selected.coverage.points>=4,'physical tile extent is sampled, not one speculative center');
 assert.ok(selected.coverage.requiredFov<=before.requiredFov+.01||selected.coverage.capped,
  'do not choose a shot requiring a wider angle than the original without explaining the cap');
 assert.ok(selected.fov>=options.fov&&selected.fov<=82);
 assert.ok(selected.camera.position.y>=3&&selected.camera.position.y<=18);
 assert.ok(Math.abs(selected.camera.position.x)<=8.35&&Math.abs(selected.camera.position.z)<=8.35);
 assert.deepEqual(JSON.stringify(s),original);assert.equal(JSON.stringify(base),baseBefore);
 for(const point of s.bossWarning.cells){
  assert.ok(Number.isSafeInteger(point.x)&&Number.isSafeInteger(point.z));
 }
});
test('danger cells cannot be cropped by a first-32 shortcut or silently accepted outside lens',async()=>{
 const {planAuthoritativeThreatFrame,inspectThreatCoverage}=await load('adventure-threat-framing');
 const s=sample();s.bossWarning.cells=Array.from({length:36},(_,i)=>({x:9+i%6,z:9+Math.floor(i/6)}));
 const a=planAuthoritativeThreatFrame(s,base,options);
 assert.equal(a.coverage.cells,36);
 const changed=structuredClone(s);changed.bossWarning.cells[35]={x:18,z:18};
 const b=planAuthoritativeThreatFrame(changed,base,options);
 assert.equal(b.coverage.cells,36);
 assert.ok(b.coverage.requiredFov>=a.coverage.requiredFov-.01||b.coverage.capped,
  'outermost real danger cannot be ignored because it occurs after entry 32');
 const before=inspectThreatCoverage(changed,base,options);
 assert.ok(before.cells===36);
 if(b.coverage.capped)assert.equal(b.coverage.covered,false,'unframeable must be honest');
});
test('reject stale, malformed or remote warning and impossible map dimensions',async()=>{
 const {planAuthoritativeThreatFrame}=await load('adventure-threat-framing');
 const s=sample();
 assert.equal(planAuthoritativeThreatFrame({...s,bossWarning:null},base,options),null);
 assert.equal(planAuthoritativeThreatFrame({...s,bossWarning:{...s.bossWarning,attackTick:s.tick}},base,options),null);
 assert.equal(planAuthoritativeThreatFrame({...s,bossWarning:{...s.bossWarning,cells:[{x:99,z:9}]}},base,options),null);
 assert.equal(planAuthoritativeThreatFrame({...s,bossWarning:{...s.bossWarning,cells:[]}},base,options),null);
 assert.equal(planAuthoritativeThreatFrame({...s,map:[]},base,options),null);
 assert.equal(planAuthoritativeThreatFrame({...s,units:s.units.map(u=>u.kind==='warden'?{...u,hp:0}:u)},base,options),null);
 assert.equal(planAuthoritativeThreatFrame(s,base,{...options,width:1}),null);
});
test('real four-seed warnings use finite camera shots on desktop and 390px without mutating authority',async()=>{
 const [{planAuthoritativeThreatFrame,inspectThreatCoverage},{planCinematicShot,planReadableExpeditionLens},{planBoundaryCamera}]=
  await Promise.all(['adventure-threat-framing','cinematic-chapter-plan','camera-boundary-plan'].map(load));
 let frames=0,improved=0,capped=0;const samples=[];
 for(const seed of ['camera-warden-1','camera-warden-2','camera-warden-3','gauntlet-corpus-v1-0']){
  const game=DungeonRuntime.create(seed);
  for(let i=0;i<900;i++){
   const s=game.step();if(!s.bossWarning||s.bossWarning.attackTick<=s.tick)continue;
   const shot=planCinematicShot(s);if(shot?.mode!=='warden-warning')continue;
   if(frames%12!==0){frames++;continue;}
   const half=(s.map.length-1)/2;
   const look={x:shot.x-half,z:shot.z-half};
   for(const view of [{width:390,height:844},{width:1440,height:832}]){
    const lens=planReadableExpeditionLens(shot,view);
    const before=planBoundaryCamera(look,s.map.length,lens.offsets);
    const opts={...view,fov:lens.fov,lookY:lens.lookY};
    const input=JSON.stringify(s);
    const result=planAuthoritativeThreatFrame(s,before,opts);
    assert.ok(result,seed+' must frame a real warning');
    assert.equal(JSON.stringify(s),input);
    assert.ok(result.fov>=lens.fov&&result.fov<=82);
    assert.ok(Number.isFinite(result.coverage.requiredFov));
    const prior=inspectThreatCoverage(s,before,opts);
    if(result.coverage.requiredFov<prior.requiredFov-.3)improved++;
    if(result.coverage.capped)capped++;
    samples.push({seed,view:view.width,priorFov:prior.requiredFov,resultFov:result.coverage.requiredFov,capped:result.coverage.capped});
   }
   frames++;
  }
 }
 assert.ok(samples.length>=20,'authentic multi-seed warning coverage sample');
 assert.ok(improved>0,'requires meaningful improved shots, not instrumentation-only');
 console.log('camera threat scene evaluations',samples.length,'improved',improved,'unframeable',capped);
});
test('single adventure coordinator consumes warning framing, not a competing director',async()=>{
 const {createAdventureCameraDirector}=await load('adventure-camera-director');
 const {planAuthoritativeThreatFrame}=await load('adventure-threat-framing');
 const director=createAdventureCameraDirector({threat:{plan:planAuthoritativeThreatFrame}});
 const s=sample(),shot={mode:'warden-warning',x:13,z:12,subjects:['warden','vanguard']};
 const decision=director.begin(s,shot,.016);
 assert.equal(decision.beat,'warning');
 const result=director.frameThreat(s,base,options);
 assert.ok(result?.camera&&result.fov>=55);
 director.begin(s,shot,.016,{autoDirector:false});
 assert.equal(director.frameThreat(s,base,options),null,'no auto framing in manual mode');
});

test('actual final world camera audits warning footprint after transition and physical detour',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/const threatCameraFrame=directorFrame\.beat==='warning'/);
 assert.match(app,/const cameraPathSafety=cameraPose\?adventureCameraDirector\.protectWorld/);
 assert.match(app,/const actualThreatCoverage=directorFrame\.beat==='warning'\?/);
 assert.match(app,/inspectThreatCoverage\(state,\{position:camera\.position/);
 assert.match(app,/actualDangerCoverage:actualThreatCoverage\?/);
 assert.match(app,/projectedInside:actualThreatCoverage\.behind===0/);
});
