'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=name=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon',name+'.js'),'utf8')).toString('base64'));
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const map=Array.from({length:19},()=>'.'.repeat(19));
const sample=()=>({run:1,floor:1,tick:29,map,phase:'exploring',units:[
 {id:'vanguard',faction:'party',kind:'vanguard',x:11,z:12,hp:120},
 {id:'warden',faction:'enemy',kind:'warden',x:14,z:12,hp:200}],
 bossWarning:{attackTick:30,shape:'NOVA',cells:Array.from({length:25},(_,i)=>({x:11+i%5,z:9+Math.floor(i/5)}))}});
const opts={width:390,height:844,fov:52,lookY:.65};
const pose=(position,aim,fov)=>({position,aim,fov});
const from=pose({x:0,y:7.2,z:6.5},{x:0,y:.75,z:0},47);
const to=pose({x:6.2,y:11.5,z:7.5},{x:4,y:.65,z:3},76);
const proposed=pose({x:2.23,y:8.75,z:6.86},{x:1.7,y:.70,z:1.25},76);
test('real imminent warning can accelerate only enough to reveal genuine danger, while never teleporting or editing game',async()=>{
 const {refineAuthoritativeWarningTransition,inspectThreatCoverage}=await load('adventure-threat-framing');
 const s=sample(),before=JSON.stringify(s);
 const result=refineAuthoritativeWarningTransition(s,from,proposed,to,opts);
 assert.ok(result,'real warning returns an auditable transition decision');
 assert.ok(result.pose.position.x<=to.position.x&&result.pose.position.x>=from.position.x);
 assert.ok(result.pose.aim.x<=to.aim.x&&result.pose.aim.x>=from.aim.x);
 assert.ok(result.fraction<=.94,'do not introduce a hard-cut camera teleport');
 const previous=inspectThreatCoverage(s,{position:proposed.position,look:proposed.aim}, {...opts,fov:proposed.fov,lookY:proposed.aim.y});
 const after=inspectThreatCoverage(s,{position:result.pose.position,look:result.pose.aim}, {...opts,fov:result.pose.fov,lookY:result.pose.aim.y});
 assert.ok(after.requiredFov<=previous.requiredFov+.01);
 assert.equal(JSON.stringify(s),before);
});
test('no emergency shot changes for stale warning, no boss, already clear view or malformed camera',async()=>{
 const {refineAuthoritativeWarningTransition}=await load('adventure-threat-framing');
 const s=sample();
 assert.equal(refineAuthoritativeWarningTransition({...s,bossWarning:{...s.bossWarning,attackTick:s.tick}},from,proposed,to,opts),null);
 assert.equal(refineAuthoritativeWarningTransition(s,from,to,to,opts)?.changed,false);
 assert.equal(refineAuthoritativeWarningTransition(s,from,{...proposed,fov:NaN},to,opts),null);
 assert.equal(refineAuthoritativeWarningTransition(s,from,proposed,to,{width:390,height:0,fov:52}),null);
});
test('unified camera director owns one emergency motion correction, not another independent camera updater',async()=>{
 const {refineAuthoritativeWarningTransition}=await load('adventure-threat-framing');
 const {createAdventureCameraDirector}=await load('adventure-camera-director');
 const d=createAdventureCameraDirector({threat:{refine:refineAuthoritativeWarningTransition}});
 const s=sample(),shot={mode:'warden-warning',subjects:['warden','vanguard'],x:13,z:12,offsets:[5,8,5]};
 d.begin(s,shot,.016);
 const result=d.transition(from,to,.016,{following:4.6,warningState:s,warningViewport:opts});
 assert.ok(result&&result.fov>=to.fov);
 assert.equal(d.metrics().beat,'warning');
 const c=d.metrics().lastThreat;
 assert.ok(c?.transition,'real danger transition should be exposed as bounded evidence');
 d.begin(s,shot,.016,{autoDirector:false});
 assert.equal(d.metrics().beat,'manual');
});

test('authentic 4-seed first-warning frames substantially recover mobile danger coverage',async()=>{
 const [{planCinematicShot,planReadableExpeditionLens},{planBoundaryCamera},
  {planAuthoritativeThreatFrame,inspectThreatCoverage,refineAuthoritativeWarningTransition},
  {createAdventureCameraDirector}]=await Promise.all([
   'cinematic-chapter-plan','camera-boundary-plan','adventure-threat-framing',
   'adventure-camera-director'].map(load));
 let checked=0,fullyFramed=0,materiallyImproved=0;
 for(const seed of ['camera-warden-1','camera-warden-2','camera-warden-3','gauntlet-corpus-v1-0']){
  const game=DungeonRuntime.create(seed);let before=null,perSeed=0;
  for(let i=0;i<600;i++){
   const s=game.step(),shot=planCinematicShot(s);
   if(!shot)continue;
   const view={width:390,height:844},lens=planReadableExpeditionLens(shot,view);
   const half=(s.map.length-1)/2;
   const base=planBoundaryCamera({x:shot.x-half,z:shot.z-half},s.map.length,lens.offsets);
   const previous={position:base.position,aim:{x:base.look.x,y:lens.lookY,z:base.look.z},fov:lens.fov};
   if(s.bossWarning?.attackTick>s.tick&&s.bossWarning?.cells?.length&&before){
    const original=JSON.stringify(s);
    const frame=planAuthoritativeThreatFrame(s,base,{...view,fov:lens.fov,lookY:lens.lookY});
    if(!frame)continue;
    const desired={position:frame.camera.position,
     aim:{x:frame.camera.look.x,y:lens.lookY,z:frame.camera.look.z},fov:frame.fov};
    const d=createAdventureCameraDirector();
    d.begin({...s,bossWarning:null},{mode:'journey'},.016);
    d.begin(s,shot,.016);
    const prior=d.transition(before,desired,.016,{following:lens.following});
    const guarded=refineAuthoritativeWarningTransition(s,before,prior,desired,
     {...view,fov:frame.fov,lookY:lens.lookY});
    const coverage=pose=>inspectThreatCoverage(s,
     {position:pose.position,look:{x:pose.aim.x,z:pose.aim.z}},
     {...view,fov:pose.fov,lookY:pose.aim.y});
    const prev=coverage(prior),after=coverage(guarded.pose);
    assert.ok(after.requiredFov<=prev.requiredFov+.01,
     seed+': emergency cannot enlarge the original live hazard crop');
    assert.ok(guarded.pose.fov<=82&&guarded.fraction<=.94);
    assert.equal(JSON.stringify(s),original);
    if(after.requiredFov<prev.requiredFov-3)materiallyImproved++;
    if(after.requiredFov<=guarded.pose.fov+.05&&after.behind===0)fullyFramed++;
    checked++;perSeed++;
    if(perSeed>=4)break;
   }
   before=previous;
  }
 }
 assert.equal(checked,16,'four natural warning ticks per independently seeded expedition');
 assert.ok(materiallyImproved>=12,'first render must gain meaningful danger visibility');
 assert.ok(fullyFramed>=12,'at least twelve first-frame warnings are entirely inside real mobile safe bounds');
});
