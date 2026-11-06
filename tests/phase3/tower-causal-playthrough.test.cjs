'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createTowerCausalWitness}=require('../../scripts/tower-causal-playthrough.cjs');
const cap={id:'f8:cap',x:100,width:200,height:5,y:50};
const state=(runId,tick,floor=8,changes={})=>({
 runId,tick,floor,lifecycle:'running',chunks:[{floor:8,platforms:[cap]}],
 enemies:[{id:'f8:guardian',floor:8,kind:'guardian',active:true,health:2}],
 player:{grounded:true,groundedPlatformId:cap.id,position:{x:130}},...changes});
const dead={id:'f8:guardian',floor:8,kind:'guardian',active:false,health:0};
function progression(w,run='one') {
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
 w.observe(state(run,5,9,{enemies:[]}),state(run,6,9,{enemies:[]}),[]);
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
 assert.match(scene,/const earnedStage = !overview && !options\.stale && !!liveExit\s*\? passage\.diagnostics\(\) : null;/);
});
