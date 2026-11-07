'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const here=path.resolve(__dirname,'../..');
const loaded=Promise.all([
  import('../../public/infinite-tower-climb/visuals/coordinates.mjs'),
  import('../../public/infinite-tower-climb/visuals/guardian-passage.mjs'),
  import('../../public/infinite-tower-climb/visuals/guardian-gateway-framing.mjs'),
]);
const cap={id:'f8:cap',x:115200,y:320000,height:12000,width:249600};
const exitX=cap.x+Math.floor(cap.width*.76);
function sample({raised=0,active=true,exit=exitX}={}){
  return {floor:8,tick:240,runToken:'physical-guardian-expedition',
    lifecycle:'running',worldWidth:480000,chunkBaseY:0,
    guardianExitX:exit,platforms:[cap],
    enemies:[{id:'f8:guardian',kind:'guardian',active,
      health:active?4:0,halfHeight:18000,
      y:cap.y+cap.height+18000+raised,x:220000}],
    player:{state:'standing',grounded:true,groundedPlatformId:cap.id,health:4,x:exitX-8000,
      y:cap.y+cap.height+18000,halfHeight:18000}};
}
test('published source exit never drifts after live guardian recoil or death',async()=>{
  const [{guardianGateAnchorX}, {observedPassageApproach}]=await loaded;
  const source=sample();
  const raised=sample({raised:80000});
  const defeated=sample({raised:80000,active:false});
  for(const current of [source,raised,defeated]){
    const before=JSON.stringify(current);
    assert.equal(guardianGateAnchorX(current,cap),exitX);
    assert.ok(observedPassageApproach(current,{runToken:current.runToken,
      floor:8,cap})>.5);
    assert.equal(JSON.stringify(current),before,'presentation cannot mutate authoritative frames');
  }
  assert.notEqual(cap.x+cap.width/2,exitX,
    'a movable guardian-foot heuristic visibly misplaces the bronze gate');
});
test('gateway follow lens and physical inner door target the same exit',async()=>{
  const [{guardianGateAnchorX},,{observedGroundedGatewayShot}]=await loaded;
  const observed=sample({raised:80000,active:false});
  const earned={runToken:observed.runToken,floor:8,cap};
  assert.equal(guardianGateAnchorX(observed,cap),exitX);
  for(const aspect of [960/600,390/844]){
    const shot=observedGroundedGatewayShot(observed,earned,aspect);
    assert.ok(shot&&shot.approach>0&&shot.radius>30);
    assert.equal(shot.exitX,exitX);
  }
});
test('malformed source exit and old source are not promoted to imaginary cap clearance',async()=>{
  const [{guardianGateAnchorX}]=await loaded;
  const lifted=sample({raised:80000});
  assert.equal(guardianGateAnchorX({...lifted,guardianExitX:NaN},cap),
    cap.x+cap.width/2);
  assert.equal(guardianGateAnchorX({...lifted,guardianExitX:exitX+12000},cap),
    cap.x+cap.width/2);
  const prior={...lifted};delete prior.guardianExitX;
  assert.equal(guardianGateAnchorX(prior,cap),cap.x+cap.width/2);
  assert.equal(guardianGateAnchorX({...prior,enemies:[]},cap),cap.x+cap.width/2);
});
test('source contract exports the real rules exit only in opt-in cap encounters',()=>{
  const rules=fs.readFileSync(path.join(here,'games/infinite-tower-climb/src/generation/chunks.ts'),'utf8');
  const snapshot=fs.readFileSync(path.join(here,'games/infinite-tower-climb/src/presentation/snapshot.ts'),'utf8');
  assert.match(rules,/export function guardianArenaExitX\(/);
  assert.match(snapshot,/import\{platformAtTick,guardianArenaExitX,guardianArenaSealHeight\}from'\.\.\/generation\/chunks'/);
  assert.match(snapshot,/guardianSealHeight:guardianArenaSealHeight\(state\.config\)/,
    'the rendered seal height must derive from the same authoritative jump envelope');
  assert.match(snapshot,/state\.config\.guardianArenaHazards===true&&[\s\S]*?state\.config\.guardianSecondWind===true&&chunk\.guardian/);
  assert.match(snapshot,/guardianExitX\(arenaCap\)/);
  assert.match(snapshot,/guardianExitX!==undefined\?\{guardianExitX\}:\{\}/);
});
