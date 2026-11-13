'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const root=path.resolve(__dirname,'../../public/ai-dungeon');
const asUrl=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
async function director(){
 const deps=['foreground-sightline-plan.js','party-visibility-plan.js','warden-threat-orbit.js'];
 let source=fs.readFileSync(path.join(root,'physical-camera-director.js'),'utf8');
 for(const file of deps)source=source.replace("'/dungeon/"+file+"'",
  JSON.stringify(asUrl(fs.readFileSync(path.join(root,file),'utf8'))));
 return (await import(asUrl(source))).createPhysicalCameraDirector();
}
function actualWarning(){
 const runtime=DungeonRuntime.create('gauntlet-corpus-v1-0');
 for(let i=0;i<300;i++){const state=runtime.step();
  if(state.bossWarning?.shape==='RIFT_CROSS'&&state.bossWarning.cells?.length>=12&&
     state.units.some(u=>u.kind==='warden'&&u.hp>0))return state;}
 throw Error('Actual source authority did not reach a Warden warning');
}
function lens(state){
 const half=(state.map.length-1)/2,boss=state.units.find(u=>u.kind==='warden'&&u.hp>0);
 const hero=state.units.find(u=>u.faction==='party'&&u.hp>0);
 const sample=(u,height)=>{const x=u.x-half,z=u.z-half;return [
  {x,y:.15,z},{x:x-.28,y:height*.62,z},
  {x:x+.28,y:height*.62,z},{x,y:height,z}]};
 return {base:{look:{x:boss.x-half,y:1.4,z:boss.z-half},
  position:{x:boss.x-half+3,y:15,z:boss.z-half+9}},
  options:{subjects:[boss,hero].map((u,i)=>({visibleActor:true,
   unitId:u.id,kind:u.kind,x:u.x-half,z:u.z-half,
   bodyPoints:sample(u,i===0?2.67:1.82)})),
   wallPositions:[],wallHeights:[],facades:[],propVolumes:[],
   reveal:()=>'none',width:390,height:844,fov:53,lookY:1.4}};
}
test('source-authority Warden warning holds its same physical 3D lens through true release and earned recovery',async()=>{
 const s=actualWarning(),original=JSON.stringify(s),{base,options}=lens(s);
 const d=await director(),warning=d.resolve(s,base,options);
 assert.ok(warning,'this real-source 13+ tile warning has a physically safe lens');
 assert.equal(warning.occlusion.actualThreatCells,s.bossWarning.cells.length);
 const strike={...s,tick:s.bossWarning.attackTick,bossWarning:null};
 const released=d.resolve(strike,base,options);
 assert.ok(released,'the real warned release cannot be cut away immediately');
 assert.equal(released.occlusion.reason,'source-warning-to-strike-recovery');
 assert.equal(released.occlusion.phase,'TRUE_RELEASE');
 assert.deepEqual(released.position,warning.position,'same original 3D camera survives source-backed contact');
 const exposure={...strike,tick:strike.tick+1,bossRecovery:{remaining:2}};
 const counter=d.resolve(exposure,base,options);
 assert.ok(counter,'earned Warden recovery retains body/stone-safe camera');
 assert.equal(counter.occlusion.phase,'EARNED_RECOVERY');
 assert.deepEqual(counter.position,warning.position);
 assert.equal(d.resolve({...exposure,tick:strike.tick+4},base,options),null,
  'no camera hold beyond bounded genuine authority ticks');
 assert.equal(JSON.stringify(s),original,'presentation never mutates authoritative replay');
});

test('genuine earned Warden counter window releases the risk overview for a physically safe native duel closeup',async()=>{
 const s=actualWarning(),{base,options}=lens(s),before=JSON.stringify(s);
 const d=await director(),warning=d.resolve(s,base,options);
 assert.ok(warning,'real warning must establish a true hazard-covering 3D camera');
 const strike={...s,tick:s.bossWarning.attackTick,bossWarning:null};
 assert.deepEqual(d.resolve(strike,base,options).position,warning.position,
  'actual strike starts with the intact source threat overview');
 const recovery={...strike,tick:strike.tick+1,bossRecovery:{remaining:2}};
 const boss=s.units.find(u=>u.kind==='warden'),half=(s.map.length-1)/2;
 const close={look:{...base.look},position:{x:boss.x-half+1.9,y:8.2,z:boss.z-half+5.0}};
 const changedRelease=d.resolve(strike,close,options);
 assert.ok(changedRelease,'physical Warden strike retains the actual risk overview');
 assert.deepEqual(changedRelease.position,warning.position,
  'a newly composed release cinematic base must NOT silently move the warning-shot 3D camera');
 const oldDistance=Math.hypot(warning.position.x-base.look.x,warning.position.y-1.4,warning.position.z-base.look.z);
 const newDistance=Math.hypot(close.position.x-close.look.x,close.position.y-1.4,close.position.z-close.look.z);
 assert.ok(newDistance<oldDistance*.76,'live source-scale actor gains a materially closer view');
 assert.equal(d.resolve(recovery,close,options),null,
  'warning cells have expired: spectator should actually see original 3D acting bodies during earned counterplay');
 const witness=d.metrics();
 assert.equal(witness.reason,'source-earned-counter-native-close');
 assert.deepEqual(witness.criticalSourceCombatants,[boss.id,
  s.units.find(u=>u.faction==='party'&&u.hp>0&&u.id===witness.criticalSourceCombatants[1]).id]);
 assert.ok(witness.minimumNativePixelsAfter>=witness.minimumNativePixelsBefore*1.26,
  'both original full-body source surfaces grow materially, not HUD nameplates');
 assert.equal(witness.genuineWarningCellsRemaining,0,'no marked danger may be dropped while still active');
 assert.deepEqual(s,JSON.parse(before),'release optics may not change game state');
});
test('reduced motion, defeated boss and unearned exposure never inherit the warning shot',async()=>{
 const s=actualWarning(),{base,options}=lens(s);
 const d=await director(),warning=d.resolve(s,base,options);assert.ok(warning);
 const strike={...s,tick:s.bossWarning.attackTick,bossWarning:null};
 assert.equal(d.resolve(strike,base,{...options,reducedMotion:true}),null);
 const defeated={...strike,units:strike.units.map(u=>u.kind==='warden'?{...u,hp:0}:u)};
 assert.equal(d.resolve(defeated,base,options),null);
 const noPrior=await director();
 assert.equal(noPrior.resolve({...strike,bossRecovery:{remaining:2}},base,options),null);
});
