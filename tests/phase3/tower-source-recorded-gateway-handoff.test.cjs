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
    exitX:gate,previousX:oldX,previousY:y,previousHealth:4,crossingX:newX,crossingY:y,
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
    {...next,lastGuardianCrossing:{...w,sourceTick:439}},
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

// Stage P0: retaining the recorded gateway without its real old cap surface
// leaves a floating bronze arch over a purple replacement floor. Both support
// segments are 3D echoes of actual source platforms; neither is a collider.
test('recorded crossing retains the real old cap deck and an unbroken supported lane into Floor9',async()=>{
  const THREE=await import('../../node_modules/three/build/three.module.js');
  const {pointFor,angleFor}=await import('../../public/infinite-tower-climb/visuals/coordinates.mjs');
  const {createTowerGuardianPassage,observedRecordedGuardianHandoff}=await source;
  const [w,next]=witnessed(),old=observedRecordedGuardianHandoff(next);
  const anchor=pointFor(w.exitX,w.cap.y+w.cap.height+20000,
    next.chunkBaseY,next.worldWidth,27.78);
  const fx=createTowerGuardianPassage(THREE),before=JSON.stringify(next);
  try {
    assert.equal(fx.begin(old,next,anchor),true);
    const deck=fx.group.getObjectByName('SourceEarnedRetainedOldCapDeck');
    const inlay=fx.group.getObjectByName('WitnessedGuardianCapWalkwayInlay');
    assert.ok(deck?.isInstancedMesh,'source-bound old cap remains drawn after the world rebuild');
    assert.equal(deck.visible,true);
    assert.equal(deck.count,12,'keep one bounded, shared box draw rather than duplicating the world');
    assert.equal(deck.userData.collider,undefined,'retained source scenery is never a new platform');
    assert.equal(deck.castShadow,false);
    assert.equal(fx.diagnostics().retainedOldCapPieces,12);
    assert.equal(fx.diagnostics().inlayInheritedOldCapPieces,4);
    assert.equal(inlay.count,12,'share the existing bounded real-world guide draw');
    fx.group.updateMatrixWorld(true);
    const local=new THREE.Matrix4(),world=new THREE.Matrix4();
    const pose=new THREE.Vector3();
    const angle=(mesh,i)=>{
      mesh.getMatrixAt(i,local);
      world.multiplyMatrices(mesh.matrixWorld,local);
      pose.setFromMatrixPosition(world);
      return Math.atan2(pose.x,pose.z);
    };
    for(let i=0;i<deck.count;i++){
      const a=angle(deck,i);
      assert.ok(a>=angleFor(w.cap.x,next.worldWidth)-.001 &&
        a<=angleFor(w.cap.x+w.cap.width,next.worldWidth)+.001,
        'old cap slab tile lies only within a cap that actually existed');
      assert.ok(Math.abs(pose.y-(w.cap.y+w.cap.height-1600-next.chunkBaseY)/10000)<.001,
        'the retained deck is placed BELOW the old source contact plane');
    }
    for(let i=0;i<inlay.count;i++){
      const a=angle(inlay,i),gateAngle=angleFor(w.exitX,next.worldWidth);
      if(i<4)assert.ok(a<gateAngle,'inherited approach marks stay on the authentic Floor8 cap');
      else assert.ok(a>gateAngle,'successor marks stay on the real Floor9 ground');
      assert.ok(Math.abs(pose.y-(w.cap.y+w.cap.height+500-next.chunkBaseY)/10000)<.001);
    }
    assert.equal(JSON.stringify(next),before,'retained geometry must never edit gameplay');
    fx.clear();
    assert.equal(deck.visible,false);
    assert.equal(deck.count,0,'old floor geometry must not survive a restart/clear');
    assert.equal(fx.diagnostics().retainedOldCapPieces,0);
  }finally{fx.dispose();}
});
