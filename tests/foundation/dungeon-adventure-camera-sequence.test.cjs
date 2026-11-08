'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const load=name=>import('data:text/javascript;base64,'+
 Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon',name+'.js'),'utf8')).toString('base64'));
// Fixed, declared cross-seed authority corpus. These are unmodified production
// DungeonRuntime.step() snapshots; no actors, boss damage or warnings are staged.
const CORPUS=Object.freeze(['gauntlet-corpus-v1-0','camera-warden-1','camera-warden-2','camera-warden-3']);
test('real 4-seed 5,600-tick expedition preserves camera beat priorities, counter truth and defeat',async()=>{
 const [{planCinematicShot},{planEncounterFrame},{createAdventureCameraDirector}]=
  await Promise.all(['cinematic-chapter-plan','encounter-frame-plan','adventure-camera-director'].map(load));
 let sawDefeat=false,sawFloorChange=false;
 for(const seed of CORPUS){
  const game=DungeonRuntime.create(seed),camera=createAdventureCameraDirector();
  const counts={},first={},byScene=new Set();let prevScene=null;
  for(let i=0;i<1400;i++){
   const s=game.step(),unchanged=JSON.stringify(s);
   const realContact=planEncounterFrame(s),shot=planCinematicShot(s,realContact,
    {width:390,height:844,focusedHeroId:'vanguard'});
   const decision=camera.begin(s,shot,.016,{view:'cinematic',autoDirector:true});
   counts[decision.beat]=(counts[decision.beat]||0)+1;
   if(!first[decision.beat])first[decision.beat]=s.tick;
   assert.equal(JSON.stringify(s),unchanged,'no camera edit to live public authority');
   assert.equal(decision.scene,s.run+':'+s.floor);
   if(decision.scene!==prevScene){byScene.add(decision.scene);prevScene=decision.scene;}
   const boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
   if(decision.beat==='warning'){
    assert.ok(boss&&s.bossWarning?.cells?.length,'camera warnings must be genuine danger cells');
    assert.ok(s.bossWarning.attackTick>s.tick&&s.bossWarning.attackTick<=s.tick+3);
    assert.equal(decision.allowPhysical,false,'camera orbit cannot hide a true urgent hazard');
   }
   if(decision.beat==='release'){
    assert.ok(boss&&boss.action==='cast'&&boss.actionTick===s.tick,'cast release is authoritative');
    assert.equal(decision.allowPhysical,false);
   }
   if(decision.beat==='counter'){
    assert.ok(boss&&s.bossRecovery?.remaining>0&&!s.guardianWard,
     'counter framing only during a real earned recovery window');
   }
   if(decision.beat==='defeat'){
    sawDefeat=true;
    assert.equal(s.phase,'intermission');
    assert.ok(s.units.filter(u=>u.faction==='party').every(u=>u.hp===0));
   }
   if(i===70){
    const manual=camera.begin(s,shot,.016,{view:'cinematic',autoDirector:false});
    assert.equal(manual.beat,'manual');assert.equal(manual.allowPhysical,false);
    const tactical=camera.begin(s,shot,.016,{view:'tactical',autoDirector:true});
    assert.equal(tactical.beat,'manual');assert.equal(tactical.allowPhysical,false);
    camera.begin(s,shot,.016,{view:'cinematic',autoDirector:true});
   }
  }
  for(const required of ['journey','combat','approach','warning','release','recovery','counter','portal'])
   assert.ok(counts[required]>0,seed+': missing actual '+required+' beat');
  assert.ok(byScene.size>=5,seed+': did not exercise real floor progress');
  sawFloorChange ||= byScene.size>=2;
  assert.equal(camera.metrics().scene,prevScene);
  assert.ok(camera.metrics().resets>=byScene.size,'run/floor changes release scoped camera state');
 }
 assert.ok(sawDefeat&&sawFloorChange,'at least one seed naturally reaches a last stand and floor change');
});
