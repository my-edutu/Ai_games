'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const modulePath=path.join(root,'public/ai-dungeon/adventure-camera-director.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(modulePath,'utf8')).toString('base64'));
const map=Array.from({length:19},(_,z)=>z===0||z===18?'#'.repeat(19):'#'+'.'.repeat(17)+'#');
const unit=(id,kind,faction,x,z,hp=80,more={})=>({id,kind,faction,x,z,hp,...more});
const scene=(tick=20)=>({run:3,floor:4,tick,phase:'exploring',map,units:[
 unit('vanguard','vanguard','party',9,9),unit('ranger','ranger','party',10,9),
 unit('warden','warden','enemy',12,9,180,{action:'idle',actionTick:0})
]});
const shot=(mode,subjects=['vanguard','warden'])=>({mode,subjects,x:10.5,z:9,lookY:.8,offsets:[5.2,7,5.4]});
function harness(){
 const calls={continuity:0,physical:0,resets:0};
 const continuity={
  resolve(s,value){calls.continuity++;return value;},
  reset(){calls.resets++;}
 };
 const physical={
  resolve(s,base){calls.physical++;return {...base,position:{x:base.position.x+1,y:base.position.y,z:base.position.z},occlusion:{selected:1}};},
  reset(){calls.resets++;}
 };
 return {calls,continuity,physical};
}
test('truthful Warden warning outranks release, contact and lingering recovery',async()=>{
 const {createAdventureCameraDirector}=await load(),h=harness();
 const director=createAdventureCameraDirector(h);
 const s=scene();
 s.units[2].action='cast';s.units[2].actionTick=s.tick;
 s.bossRecovery={remaining:2};
 s.bossWarning={attackTick:s.tick+1,shape:'NOVA',cells:[{x:11,z:9},{x:12,z:9}]};
 const unchanged=JSON.stringify(s);
 const result=director.begin(s,shot('warden-warning'),.016);
 assert.equal(result.beat,'warning');
 assert.equal(result.priority,100);
 assert.equal(result.allowPhysical,false);
 assert.equal(result.urgent,true);
 assert.equal(JSON.stringify(s),unchanged);
 s.bossWarning=null;
 assert.equal(director.begin(s,shot('warden-release'),.016).beat,'release');
 s.units[2].actionTick=s.tick-1;
 assert.equal(director.begin(s,shot('warden-counter'),.016).beat,'counter');
 assert.equal(director.begin(s,shot('warden-exposed'),.016).beat,'recovery');
 s.bossRecovery={remaining:0};
 assert.equal(director.begin(s,shot('contact'),.016).beat,'combat');
});
test('the camera cannot forge warning, release or counter from stale or dead source events',async()=>{
 const {createAdventureCameraDirector}=await load(),d=createAdventureCameraDirector(harness());
 const s=scene();
 s.bossWarning={attackTick:s.tick-1,shape:'NOVA',cells:[{x:12,z:9}]};
 assert.notEqual(d.begin(s,shot('warden-warning'),.016).beat,'warning');
 s.bossWarning={attackTick:s.tick+1,shape:'NOVA',cells:[]};
 assert.notEqual(d.begin(s,shot('warden-warning'),.016).beat,'warning');
 s.bossWarning={attackTick:s.tick+1,shape:'NOVA',cells:[{x:99,z:99}]};
 assert.notEqual(d.begin(s,shot('warden-warning'),.016).beat,'warning');
 s.units[2].action='cast';s.units[2].actionTick=s.tick-1;
 assert.notEqual(d.begin(s,shot('warden-release'),.016).beat,'release');
 s.bossRecovery={remaining:5};s.guardianWard=true;
 assert.notEqual(d.begin(s,shot('warden-counter'),.016).beat,'counter');
 s.units[2].hp=0;s.guardianWard=false;
 assert.notEqual(d.begin(s,shot('warden-exposed'),.016).beat,'recovery');
});
test('only auto cinematic scenes may select a physical orbit; danger and manual spectator never do',async()=>{
 const {createAdventureCameraDirector}=await load(),h=harness(),d=createAdventureCameraDirector(h);
 const base={position:{x:5,y:7,z:6},look:{x:0,z:0}};
 const s=scene();
 d.begin(s,shot('contact'),.016);
 assert.equal(d.selectPhysical(s,base,{width:1440,height:832}).position.x,6);
 assert.equal(h.calls.physical,1);
 d.begin(s,shot('contact'),.016,{autoDirector:false,view:'cinematic'});
 assert.equal(d.selectPhysical(s,base,{width:390,height:844}),base);
 assert.equal(h.calls.physical,1);
 assert.equal(d.metrics().beat,'manual');
 d.begin(s,shot('contact'),.016,{autoDirector:true,view:'tactical'});
 assert.equal(d.selectPhysical(s,base,{}),base);
 assert.equal(h.calls.physical,1);
 s.bossWarning={attackTick:s.tick+1,shape:'NOVA',cells:[{x:12,z:9}]};
 d.begin(s,shot('warden-warning'),.016);
 assert.equal(d.selectPhysical(s,base,{}),base);
 assert.equal(h.calls.physical,1);
 s.bossWarning=null;
 s.units[2].action='cast';s.units[2].actionTick=s.tick;
 d.begin(s,shot('warden-release'),.016);
 assert.equal(d.selectPhysical(s,base,{}),base);
 assert.equal(h.calls.physical,1);
});
test('true warning widens lens immediately, camera pans with bounded urgency, and recovery settles smoothly',async()=>{
 const {createAdventureCameraDirector}=await load(),d=createAdventureCameraDirector(harness());
 const s=scene();
 const actual={position:{x:1,y:6,z:6},aim:{x:0,y:1,z:0},fov:42};
 const desired={position:{x:7,y:10,z:9},aim:{x:1,y:.3,z:2},fov:52};
 d.begin(s,shot('journey',['vanguard']),.016);
 const travel=d.transition(actual,desired,.016,{following:4.6});
 assert.ok(travel.position.x>1&&travel.position.x<2);
 s.bossWarning={attackTick:s.tick+1,shape:'RIFT_CROSS',cells:[{x:11,z:9}]};
 d.begin(s,shot('warden-warning'),.016);
 const warning=d.transition(actual,desired,.016,{following:4.6});
 assert.equal(warning.fov,52,'warning FOV must reveal actual threat immediately');
 assert.ok(warning.position.x>travel.position.x+1,'one urgent move must not spend a whole warning behind the old hero');
 assert.ok(warning.position.x<desired.position.x,'no automatic cinematic teleport');
 s.bossWarning=null;s.bossRecovery={remaining:3};
 d.begin(s,shot('warden-exposed'),.016);
 const recovery=d.transition({...actual,fov:52},{...desired,fov:43},.016,{following:4.6});
 assert.ok(recovery.fov<52&&recovery.fov>43,'earned recovery narrows without a snap');
 assert.ok(recovery.position.x<warning.position.x,'camera stabilizes after emergency');
});
test('run/floor changes, defeat and reduced motion discard stale camera ownership and hold no extra entities',async()=>{
 const {createAdventureCameraDirector}=await load(),h=harness(),d=createAdventureCameraDirector(h);
 const s=scene();
 d.begin(s,shot('contact'),.016);
 d.selectPhysical(s,{position:{x:4,y:5,z:5},look:{x:0,z:0}},{});
 const next={...s,floor:5,tick:0,phase:'intermission',units:s.units.map(u=>({...u,hp:u.faction==='party'?0:u.hp}))};
 const result=d.begin(next,shot('last-stand',['vanguard','ranger']),.016);
 assert.equal(result.beat,'defeat');
 assert.equal(result.allowPhysical,false);
 assert.equal(d.metrics().scene,'3:5');
 assert.ok(h.calls.resets>=2,'both bounded helper caches are invalidated on floor change');
 const pose=d.transition({position:{x:1,y:2,z:3},aim:{x:0,y:0,z:0},fov:49},
  {position:{x:6,y:7,z:8},aim:{x:1,y:1,z:1},fov:45},.016,{reducedMotion:true});
 assert.deepEqual(pose.position,{x:6,y:7,z:8});
 assert.deepEqual(pose.aim,{x:1,y:1,z:1});
 assert.equal(pose.fov,45);
 assert.equal(d.selectPhysical(next,{position:{x:4,y:5,z:5},look:{x:0,z:0}},{}).position.x,4);
 assert.ok(Object.keys(d.metrics()).length<15,'bounded metrics, no unbounded per-frame state');
});
test('static integration contract: one director owns shot and frame transitions without authoritative writes',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const serve=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(app,/createAdventureCameraDirector/);
 assert.match(app,/adventureCameraDirector\.begin\(/);
 assert.match(app,/adventureCameraDirector\.selectPhysical\(/);
 assert.match(app,/adventureCameraDirector\.transition\(/);
 assert.match(serve,/adventure-camera-director\.js/);
 assert.doesNotMatch(fs.readFileSync(modulePath,'utf8'),/Math\.random\(|Date\.now\(|fetch\(|DungeonRuntime|setTimeout\(/);
});