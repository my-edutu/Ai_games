'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=import('../../public/infinite-tower-climb/visuals/guardian-passage.mjs');

// Native 1x candidate danger film 43212531463: prior accepted old floor
// tick 435, first new-floor browser tick 452. A renderer cannot claim that
// intervening source events were observed, but the *authority* can persist
// its one actual tick451 earned crossing for the next bounded snapshots.
const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
const gate=cap.x+Math.floor(cap.width*.76);
const top=cap.y+cap.height;
const width=9000,height=14000;
const oldX=gate+12000,newX=gate+19200,y=top+height;
function witnessed(){
  const witness={runToken:'real-run',sourceTick:451,fromFloor:8,toFloor:9,
    cap,guardian:{id:'f8:guardian',kind:'guardian',floor:8,
      active:false,health:0,x:gate-30000,y,halfHeight:height},
    exitX:gate,previousX:oldX,previousY:y,crossingX:newX,crossingY:y,
    halfWidth:width,halfHeight:height,worldWidth:480000};
  const next={runToken:'real-run',floor:9,tick:452,lifecycle:'running',
    chunkBaseY:2880000,worldWidth:480000,lastGuardianCrossing:witness,
    platforms:[{id:'f9:ground',x:0,y:cap.y,width:480000,height:cap.height}],
    enemies:[],player:{x:newX+7200,y,halfWidth:width,halfHeight:height,
      health:5,grounded:true,groundedPlatformId:'f9:ground'}};
  return [witness,next];
}
test('stored exact source crossing recovers a true grounded arch after dropped browser ticks',async()=>{
  const {observedRecordedGuardianHandoff,observedGroundedGuardianHandoff,
    observedFloorNineRunway}=await source;
  const [w,next]=witnessed(),before=JSON.stringify(next);
  const old=observedRecordedGuardianHandoff(next);
  assert.ok(old,'only a real source event can reconstruct the prior crossing witness');
  assert.equal(old.tick,450);
  assert.equal(old.player.x,oldX);
  assert.equal(observedGroundedGuardianHandoff(old,next),true);
  assert.ok(observedFloorNineRunway(old,next));
  assert.equal(JSON.stringify(next),before,'never alter authoritative source');
  for(const invalid of [
    {...next,runToken:'other-run'},
    {...next,floor:10},
    {...next,tick:482},
    {...next,player:{...next.player,grounded:false}},
    {...next,player:{...next.player,groundedPlatformId:'f9:wrong'}},
    {...next,player:{...next.player,y:y+1000}},
    {...next,platforms:[{...next.platforms[0],y:cap.y+1000}]},
    {...next,lastGuardianCrossing:{...w,guardian:{...w.guardian,active:true,health:1}}},
    {...next,lastGuardianCrossing:{...w,sourceTick:440}},
    {...next,lastGuardianCrossing:{...w,runToken:'other-run'}},
    {...next,lastGuardianCrossing:{...w,crossingX:gate-50000}},
    {...next,lastGuardianCrossing:{...w,fromFloor:7}},
    {...next,lastGuardianCrossing:{...w,previousX:gate-30000}},
  ]) assert.equal(observedRecordedGuardianHandoff(invalid),null);
});
test('authority records one real crossing and publishes it only in the opt-in live public snapshot',()=>{
  const rules=fs.readFileSync(require.resolve('../../games/infinite-tower-climb/src/rules/step.ts'),'utf8');
  const publicState=fs.readFileSync(require.resolve('../../games/infinite-tower-climb/src/presentation/snapshot.ts'),'utf8');
  const scene=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(rules,/lastGuardianCrossing/);
  assert.match(publicState,/lastGuardianCrossing/);
  assert.match(scene,/observedRecordedGuardianHandoff\(next\)/);
  assert.match(scene,/passage\.begin\(gatewayPrevious, next,/);
});
