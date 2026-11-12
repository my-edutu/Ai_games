'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const inspect=import('../../public/infinite-tower-climb/visuals/gateway-source-audit.mjs');
const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
const top=cap.y+cap.height, halfWidth=9000, halfHeight=14000;
function nextTick(tick=453){
  const runToken='original-film-run';
  return {runToken,lifecycle:'running',floor:9,theme:'void',tick,
    worldWidth:480000,chunkBaseY:2880000,platforms:[
      {id:'f9:ground',x:0,y:3212000,width:480000,height:12000}],
    player:{x:334796,y:top+halfHeight,halfWidth,halfHeight,health:4,
      grounded:true,groundedPlatformId:'f9:ground'},
    lastGuardianCrossing:{
      runToken,sourceTick:451,fromFloor:8,toFloor:9,worldWidth:480000,cap,
      guardian:{id:'f8:guardian',kind:'guardian',floor:8,active:false,
        health:0,x:261600,y:3242000,halfHeight:14000},
      exitX:304896,previousX:317096,previousY:top+halfHeight,
      previousHealth:3,crossingX:324296,crossingY:top+halfHeight,
      halfWidth,halfHeight
    }};
}
test('real 425 to 453 cold-Three gateway witness is classified without inventing a grounded crossing',async()=>{
  const {auditOriginalGuardianCrossing}=await inspect;
  const next=nextTick(),prior={runToken:next.runToken,floor:8,tick:425,
    lifecycle:'running',player:{x:200000}};
  const original=JSON.stringify(next);
  const report=auditOriginalGuardianCrossing(next,prior);
  assert.equal(report.present,true);
  assert.equal(report.sourceTick,451);
  assert.equal(report.observedTick,453);
  assert.equal(report.browserGapTicks,28);
  assert.equal(report.recordedHandoffAccepted,true);
  assert.equal(report.rawSourceGroundedArrivalConsistent,true);
  assert.equal(report.currentSourceGrounded,true);
  assert.equal(report.veto,'none');
  assert.equal(JSON.stringify(next),original,'never mutate a public source snapshot');
});
test('dropped/late source handoff is diagnosed honestly and cannot become evidence of a win',async()=>{
  const {auditOriginalGuardianCrossing}=await inspect;
  const valid=nextTick();
  const cases=[
    [{...valid,lastGuardianCrossing:undefined},'missing-source-witness'],
    [{...valid,tick:450},'future-source-witness'],
    [{...valid,tick:470},'expired-source-witness'],
    [{...valid,runToken:'other-run'},'wrong-run'],
    [{...valid,player:{...valid.player,grounded:false}},'current-actor-not-grounded'],
    [{...valid,player:{...valid.player,groundedPlatformId:'f9:wrong'}},'current-support-mismatch'],
    [{...valid,platforms:[{...valid.platforms[0],y:3211000}]},'world-support-mismatch'],
  ];
  for(const [input,veto] of cases){
    const evidence=auditOriginalGuardianCrossing(input);
    assert.equal(evidence.recordedHandoffAccepted,false,veto);
    assert.equal(evidence.veto,veto);
  }
});
test('source audit is explicitly observational, bounded, privacy-minimized and not an acceptance verdict',async()=>{
  const {auditOriginalGuardianCrossing}=await inspect;
  const evidence=auditOriginalGuardianCrossing(nextTick());
  assert.equal(evidence.evidenceOnly,true);
  assert.equal(evidence.acceptance,'NOT EVALUATED');
  assert.ok(!JSON.stringify(evidence).includes('original-film-run'),'never expose full run token');
  assert.equal(evidence.sourceTick,451);
});

test('genuine first Floor9 jump after immutable grounded crossing is classified as continuation, not fictional grounded contact',async()=>{
  const {auditOriginalGuardianCrossing}=await inspect;
  const grounded=nextTick(453),w=grounded.lastGuardianCrossing;
  const airborne={...grounded,player:{...grounded.player,x:w.crossingX+7200,
    y:grounded.player.y+8000,grounded:false,
    groundedPlatformId:null,state:'airborne',vy:12000}};
  const before=JSON.stringify(airborne);
  const report=auditOriginalGuardianCrossing(airborne,{...grounded,floor:8,tick:435});
  assert.equal(report.recordedAirborneContinuationAccepted,true);
  assert.equal(report.recordedHandoffAccepted,true);
  assert.equal(report.currentSourceGrounded,false,
    'the current browser body is legitimately airborne, not a claimed landing');
  assert.equal(report.veto,'none');
  assert.equal(JSON.stringify(airborne),before);
  assert.equal(auditOriginalGuardianCrossing({...airborne,
    player:{...airborne.player,x:w.exitX+120000}}).recordedAirborneContinuationAccepted,false);
});
