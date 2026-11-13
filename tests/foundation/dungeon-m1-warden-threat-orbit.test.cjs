'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const root=path.resolve(__dirname,'../../public/ai-dungeon');
const asUrl=t=>'data:text/javascript;base64,'+Buffer.from(t).toString('base64');
const load=()=>import(asUrl(fs.readFileSync(path.join(root,'warden-threat-orbit.js'),'utf8')));
function crossWarning(){
 const r=DungeonRuntime.create('gauntlet-corpus-v1-0');
 for(let i=0;i<300;i++){
  const s=r.step();if(s.bossWarning?.shape==='RIFT_CROSS'&&s.bossWarning.cells?.length>=12&&s.units.some(u=>u.kind==='warden'&&u.hp>0))return s;
 }
 throw Error('Original seeded authority did not reach RIFT_CROSS');
}
const scene=s=>{const half=(s.map.length-1)/2,w=s.units.find(u=>u.kind==='warden'&&u.hp>0),hero=s.units.find(u=>u.faction==='party'&&u.hp>0);
 const body=(u,height)=>[{x:u.x-half,y:.2,z:u.z-half},{x:u.x-half-.26,y:height*.60,z:u.z-half},{x:u.x-half+.26,y:height*.63,z:u.z-half},{x:u.x-half,y:height,z:u.z-half}];
 return {base:{look:{x:w.x-half,y:1.4,z:w.z-half},position:{x:w.x-half+3,y:15,z:w.z-half+9}},subjects:[
  {kind:'warden',unitId:w.id,x:w.x-half,z:w.z-half,visibleActor:true,bodyPoints:body(w,2.67)},
  {kind:hero.kind,unitId:hero.id,x:hero.x-half,z:hero.z-half,visibleActor:true,bodyPoints:body(hero,1.82)}]};};
test('real RIFT_CROSS original risk cells receive a lens-safe optical gain without cropping genuine danger',async()=>{
 const {planWardenThreatOrbit,assessThreatOrbit}=await load();const s=crossWarning(),original=JSON.stringify(s),v=scene(s),params={state:s,...v,width:390,height:844,fov:53};
 const plan=planWardenThreatOrbit(params);
 assert.equal(plan.status,'IMPROVED');
 assert.equal(plan.threatCells,s.bossWarning.cells.length);
 assert.equal(plan.criticalActors,2);
 if(plan.dangerRescue){
  assert.ok(plan.baseline.fitFov>52.5,'unfitted baseline must be verified');
  assert.ok(plan.framing.minHeroPixels>=plan.baseline.minHeroPixels*.90,
   'rescuing authentic danger must not greatly diminish imported actor bodies');
 }else assert.ok(plan.gainPixels>=Math.max(3,plan.baseline.minHeroPixels*.08));
 assert.ok(plan.reach>=.84&&plan.reach<=1);
 assert.ok(plan.lift>=0&&plan.lift<=.70);
 // An authoritative danger rescue is explicitly NOT a claimed body-size gain.
 // The branch above checks real danger fit and the native >=90% bound.
 assert.ok(plan.framing.fitFov<=52.5);
 assert.ok(Math.abs(plan.position.x)<=(s.map.length-1)/2);
 assert.equal(assessThreatOrbit(params,plan.position).valid,true);
 assert.equal(JSON.stringify(s),original,'read-only cinematography must not touch authority');
});
test('threat framing rejects fabricated, stale, desktop, absent-source-rig and reduced-motion candidates',async()=>{
 const {planWardenThreatOrbit}=await load();const s=crossWarning(),v=scene(s),o={state:s,...v,width:390,height:844,fov:53};
 assert.equal(planWardenThreatOrbit({...o,width:1440,height:832}).status,'UNAVAILABLE');
 assert.equal(planWardenThreatOrbit({...o,state:{...s,bossWarning:null}}).status,'UNAVAILABLE');
 assert.equal(planWardenThreatOrbit({...o,state:{...s,tick:s.bossWarning.attackTick}}).status,'UNAVAILABLE');
 assert.equal(planWardenThreatOrbit({...o,subjects:[v.subjects[0]]}).status,'UNAVAILABLE');
 assert.equal(planWardenThreatOrbit({...o,state:{...s,bossWarning:{...s.bossWarning,cells:[{x:Infinity,z:9}]}}}).status,'UNAVAILABLE');
 assert.equal(planWardenThreatOrbit({...o,reducedMotion:true}).status,'UNAVAILABLE');
 assert.equal(planWardenThreatOrbit({...o,base:{...v.base,position:{x:Infinity,y:8,z:0}}}).status,'UNAVAILABLE');
});
test('physical director owns actual warning portraits only for source cinematography',()=>{
 const source=fs.readFileSync(path.join(root,'physical-camera-director.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert.match(source,/planWardenThreatOrbit\(/);
 assert.match(source,/threat-safe-optical-framing/);
 assert.match(app,/physicalCameraDirector\.resolve\(state/);
 assert.match(app,/cameraModes\[cameraIndex\]==='cinematic'/);
});
test('genuine 13-cell warning earns a bounded physical orbit and preserves checksum',async()=>{
 const dependency=fs.readFileSync(path.join(root,'foreground-sightline-plan.js'),'utf8');
 const projection=fs.readFileSync(path.join(root,'party-visibility-plan.js'),'utf8');
 const threat=fs.readFileSync(path.join(root,'warden-threat-orbit.js'),'utf8');
 const directorSource=fs.readFileSync(path.join(root,'physical-camera-director.js'),'utf8')
  .replace("'/dungeon/foreground-sightline-plan.js'",JSON.stringify(asUrl(dependency)))
  .replace("'/dungeon/party-visibility-plan.js'",JSON.stringify(asUrl(projection)))
  .replace("'/dungeon/warden-threat-orbit.js'",JSON.stringify(asUrl(threat)));
 const {createPhysicalCameraDirector}=await import(asUrl(directorSource));
 const state=crossWarning(),snapshot=JSON.stringify(state),{base,subjects}=scene(state);
 const director=createPhysicalCameraDirector();
 const options={subjects,wallPositions:[],wallHeights:[],reveal:()=> 'none',width:390,height:844,fov:53,lookY:1.4};
 const chosen=director.resolve(state,base,options);
 assert.ok(chosen,'actual 13-cell geometry fits without physical blocking');
 assert.equal(chosen.occlusion.reason,'threat-safe-optical-framing');
 assert.equal(chosen.occlusion.actualThreatCells,state.bossWarning.cells.length);
 if(chosen.occlusion.requiredFovBefore>52.5)
  assert.ok(chosen.occlusion.minimumCriticalPixelsAfter>=chosen.occlusion.minimumCriticalPixelsBefore*.90);
 else assert.ok(chosen.occlusion.minimumCriticalPixelsAfter>chosen.occlusion.minimumCriticalPixelsBefore+3);
 assert.ok(chosen.occlusion.requiredFovAfter<=52.5);
 assert.equal(JSON.stringify(state),snapshot);
 assert.equal(director.metrics().checks,1);
 assert.deepEqual(director.resolve(state,base,options),chosen);
 assert.equal(director.metrics().checks,1);
 assert.equal(createPhysicalCameraDirector().resolve(state,base,{...options,reducedMotion:true}),null);
 assert.equal(createPhysicalCameraDirector().resolve(state,base,{...options,width:1440,height:832}),null);
});

test('original Warden native actor pixels use the requested real lens instead of hypothetical danger-fit FOV',async()=>{
 const {assessThreatOrbit}=await load();
 const state=crossWarning(),{base,subjects}=scene(state);
 const low=assessThreatOrbit({state,base,subjects,width:390,height:844,fov:43},base.position);
 const high=assessThreatOrbit({state,base,subjects,width:390,height:844,fov:53},base.position);
 assert.equal(low.valid,true);assert.equal(high.valid,true);
 assert.equal(low.fitFov,high.fitFov);
 const ratio=Math.tan(53*Math.PI/360)/Math.tan(43*Math.PI/360);
 assert.ok(low.minHeroPixels>high.minHeroPixels);
 assert.ok(Math.abs(low.minHeroPixels/high.minHeroPixels-ratio)<.035,
  'the same source rig must scale with the actual optical FOV, not fitted danger FOV');
});
