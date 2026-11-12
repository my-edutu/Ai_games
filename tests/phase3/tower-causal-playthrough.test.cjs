'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createTowerCausalWitness}=require('../../scripts/tower-causal-playthrough.cjs');
const cap={id:'f8:cap',x:100,width:200,height:5,y:50};
// Source-published live crusher interval, directly beside the cap-standing
// body. No mock cinematic, inferred offscreen encounter or disabled collider.
const shutter={id:'f8:guardian-shutter',kind:'crusher',x:125,y:55,
 width:20,height:9,activeFromTick:0,activeEvery:72,activeFor:9};
const state=(runId,tick,floor=8,changes={})=>({
 runId,tick,floor,lifecycle:'running',chunks:[{floor:8,platforms:[cap],hazards:[shutter]}],
 enemies:[{id:'f8:guardian',floor:8,kind:'guardian',active:true,health:2}],
 player:{health:5,halfWidth:9,halfHeight:14,grounded:true,groundedPlatformId:cap.id,position:{x:130,y:69}},...changes});
const dead={id:'f8:guardian',floor:8,kind:'guardian',active:false,health:0};
function progression(w,run='one',landedOnward=true) {
 const live=state(run,1),killed=state(run,2,8,{enemies:[dead]});
 w.observe(live,killed,[{type:'enemy-defeated',data:{kind:'guardian',id:'f8:guardian'}}]);
 w.observe(killed,state(run,3,8,{enemies:[dead],player:{...killed.player,position:{x:160}}}),[]);
 w.observe(state(run,3,8,{enemies:[dead],player:{...killed.player,position:{x:160}}}),
  state(run,4,8,{enemies:[dead],player:{...killed.player,position:{x:200}}}),[]);
 w.observe(state(run,4,8,{enemies:[dead],player:{...killed.player,position:{x:200}}}),
  state(run,5,9,{enemies:[],player:{grounded:false,position:{x:10}}}),
  [{type:'floor-complete',data:{floor:9,guardianPassage:{
   fromFloor:8,capId:'f8:cap',guardianId:'f8:guardian',
   groundedPlatformId:'f8:cap',exitX:180,clearanceX:190,crossingX:200
 }}}]);
 w.observe(state(run,5,9,{enemies:[]}),
  state(run,6,9,{enemies:[],player:landedOnward?{
   health:5,grounded:true,groundedPlatformId:'f9:p1',position:{x:95000,y:175},
  }:{health:5,grounded:false,position:{x:10,y:100}}}),[]);
}
test('one authentic episode links guardian, grounded cap, floor nine, result and restart',()=>{
 const w=createTowerCausalWitness();progression(w);
 const result=state('one',7,9,{lifecycle:'result',result:{kind:'game',reason:'health-depleted'}});
 w.observe(state('one',6,9),result,[{type:'game-terminal'}]);
 const inter=state('one',8,9,{lifecycle:'intermission',result:result.result});
 w.observe(result,inter,[{type:'intermission'}]);
 w.observe(inter,state('two',0),[{type:'restart'}]);
 const record=w.summary();
 assert.equal(record.fullSourceChainObserved,true);
 assert.equal(record.episodes[0].firstMissing,null);
 assert.equal(record.episodes[0].markers.floorNineContinues.tick,6,
  'floor-nine continuation requires a later real fixed-step tick, not just the exit teleport');
 assert.equal(record.episodes[0].markers.earnedFloorNine.capId,'f8:cap');
 assert.equal(record.episodes[0].markers.crusherPressureSurvived.hazardId,
   'f8:guardian-shutter','only observed close-body source pressure counts');
 assert.equal(record.episodes[0].markers.floorNineContinues.floor,9);
 assert.equal(record.episodes[0].markers.sourceResult.kind,'game');
 assert.equal(record.episodes[0].markers.earnedFloorNine.observedActualCrossingX,200);
});
test('different lives cannot splice defeat, result, or restart together',()=>{
 const w=createTowerCausalWitness();progression(w);
 w.observe(state('one',6,9),state('two',0),[{type:'restart'}]);
 w.observe(state('two',0),state('two',1,9,{lifecycle:'intermission',
   result:{kind:'game',reason:'fall'}}),[]);
 assert.equal(w.summary().fullSourceChainObserved,false);
 assert.equal(w.summary().episodes[0].firstMissing,'sourceResult');
});
test('a fabricated next floor without earned physical cap footing is not a gateway witness',()=>{
 const w=createTowerCausalWitness(),live=state('x',1),
  killed=state('x',2,8,{enemies:[dead]});
 w.observe(live,killed,[{type:'enemy-defeated',data:{id:'f8:guardian',kind:'guardian'}}]);
 w.observe(killed,state('x',3,8,{enemies:[dead]}),[]);
 w.observe(state('x',3,8,{enemies:[dead],player:{grounded:false,position:{x:190}}}),
  state('x',4,9),[{type:'floor-complete',data:{floor:9}}]);
 assert.equal(w.summary().episodes[0].markers.earnedFloorNine,undefined);
});
test('a floor advance without a real source crossing payload cannot be counted',()=>{
 const w=createTowerCausalWitness(),live=state('x',1),
   killed=state('x',2,8,{enemies:[dead]});
 w.observe(live,killed,[{type:'enemy-defeated',data:{kind:'guardian',id:'f8:guardian'}}]);
 w.observe(killed,state('x',3,8,{enemies:[dead],player:{...killed.player,position:{x:160}}}),[]);
 w.observe(state('x',3,8,{enemies:[dead],player:{...killed.player,position:{x:160}}}),
   state('x',4,9,{enemies:[]}),[{type:'floor-complete',data:{floor:9}}]);
 assert.equal(w.summary().episodes[0].markers.earnedFloorNine,undefined);
});
test('spawn idle ticks do not count as a real floor-nine climb',()=>{
 const w=createTowerCausalWitness();progression(w,'idle',false);
 const report=w.summary();
 assert.equal(report.fullSourceChainObserved,false);
 assert.equal(report.episodes[0].firstMissing,'floorNineContinues');
 assert.equal(report.episodes[0].markers.earnedFloorNine.floor,9,
   'a real threshold without onward deck traversal is incomplete');
});
test('technical failures and operator stops cannot stand in for a playable outcome',()=>{
 for(const kind of ['technical','operator']){
  const w=createTowerCausalWitness();progression(w);
  const result=state('one',7,9,{lifecycle:'result',
   result:{kind,reason:kind==='technical'?'integrity-quarantine':'operator-abort'}});
  w.observe(state('one',6,9),result,[{type:'technical-terminal'}]);
  const inter=state('one',8,9,{lifecycle:'intermission',result:result.result});
  w.observe(result,inter,[{type:'intermission'}]);
  w.observe(inter,state('two',0),[{type:'restart'}]);
  assert.equal(w.summary().fullSourceChainObserved,false);
  assert.equal(w.summary().episodes[0].firstMissing,'sourceResult');
 }
});
test('a distant shutter, absent shutter or already-dead climber does not manufacture a crusher encounter',()=>{
 const live=state('no-pressure',1);
 const deadGuardianState=state('no-pressure',2,8,{enemies:[dead]});
 for(const variant of [
   s=>({...s,chunks:[{floor:8,platforms:[cap],hazards:[]}]}),
   s=>({...s,chunks:[{floor:8,platforms:[cap],hazards:[{...shutter,x:300000}]}]}),
   s=>({...s,player:{...s.player,health:0}})
 ]){
   const w=createTowerCausalWitness();
   w.observe(variant(live),variant(deadGuardianState),
     [{type:'enemy-defeated',data:{kind:'guardian',id:'f8:guardian'}}]);
   const record=w.summary();
   assert.equal(record.episodes[0].markers.crusherPressureSurvived,undefined);
   assert.equal(record.fullSourceChainObserved,false);
 }
});
test('source observer rejects a previous-floor corpse for a newly earned portal',async()=>{
 const {observedUnlockedGuardianCap,observedGuardianPassage} =
   await import('../../public/infinite-tower-climb/visuals/guardian-passage.mjs');
 const p={runToken:'run',tick:11,floor:8,lifecycle:'running',worldWidth:480000,
  chunkBaseY:0,player:{health:5},platforms:[{...cap}],enemies:[{
    id:'f7:guardian',floor:7,kind:'guardian',active:false,health:0,
    halfHeight:18000,x:50,y:55}]};
 const snapshot={...p,platforms:[{...cap,id:'f8:cap'}]};
 assert.equal(observedUnlockedGuardianCap(snapshot),null);
 assert.equal(observedGuardianPassage(snapshot,{...snapshot,tick:12,floor:9}),false);
});
test('real physically earned door escort is not restricted to first floor-eight guardian',()=>{
 const fs=require('node:fs');
 const scene=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 assert.match(scene,/const earnedStage = !overview && !options\.stale &&/);
 assert.match(scene,/!!liveExit \|\| !!sourceGroundedHandoffShot \|\| !!sourceAirborneHandoffShot/);
 assert.match(scene,/earnedStage\.stage === 'earned-open' && !!liveExit/);
 assert.match(scene,/earnedStage\.stage === 'handoff' &&/);
 assert.match(scene,/!!sourceGroundedHandoffShot \|\| !!sourceAirborneHandoffShot/);
});

test('crusher pressure after guardian death is not a living-guardian encounter',()=>{
 // Kill on an honest safe shutter phase (tick 10), then observe a later
 // close jaw warning after the source guardian has already been defeated.
 const w=createTowerCausalWitness(),live=state('post-defeat',10);
 const killed=state('post-defeat',11,8,{enemies:[dead]});
 w.observe(live,killed,[{type:'enemy-defeated',
   data:{id:'f8:guardian',kind:'guardian'}}]);
 w.observe(state('post-defeat',70,8,{enemies:[dead]}),
   state('post-defeat',71,8,{enemies:[dead]}),[]);
 const proof=w.summary();
 assert.equal(proof.episodes[0].markers.guardianDefeated.tick,11);
 assert.equal(proof.episodes[0].markers.crusherPressureSurvived,undefined,
   'a lingering jaw phase cannot be counted as pre-defeat counterplay');
 assert.equal(proof.fullSourceChainObserved,false);
});
test('floor-nine clearance event without previously witnessed cap advance is not a full chain',()=>{
 const w=createTowerCausalWitness(),live=state('no-walk',1),
  killed=state('no-walk',2,8,{enemies:[dead]});
 w.observe(live,killed,[{type:'enemy-defeated',
   data:{id:'f8:guardian',kind:'guardian'}}]);
 const still=state('no-walk',3,8,{enemies:[dead]});
 w.observe(killed,still,[]);
 w.observe(still,state('no-walk',4,9,{enemies:[]}),
  [{type:'floor-complete',data:{floor:9,guardianPassage:{
    fromFloor:8,capId:'f8:cap',guardianId:'f8:guardian',
    groundedPlatformId:'f8:cap',exitX:180,clearanceX:190,crossingX:200
  }}}]);
 const proof=w.summary();
 assert.ok(proof.episodes[0].markers.groundedEarnedWalk);
 assert.equal(proof.episodes[0].markers.advancedOnCap,undefined);
 assert.equal(proof.episodes[0].markers.earnedFloorNine,undefined);
 assert.equal(proof.fullSourceChainObserved,false);
});

test('living guardian final blow may legitimately survive jaw pressure on that same source step',()=>{
 const w=createTowerCausalWitness(),live=state('same-tick',1),
  killed=state('same-tick',2,8,{enemies:[dead]});
 w.observe(live,killed,[{type:'enemy-defeated',
   data:{id:'f8:guardian',kind:'guardian'}}]);
 const markers=w.summary().episodes[0].markers;
 assert.equal(markers.liveGuardian.tick,1);
 assert.equal(markers.crusherPressureSurvived.tick,2);
 assert.equal(markers.guardianDefeated.tick,2);
});
