'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const policy=import('../../public/infinite-tower-climb/visuals/far-side-shaft-transition.mjs');

async function fixture(){
  const THREE=await import('three');
  const cap={id:'f8:cap',x:100000,y:3188000,width:269600,height:50000};
  const thresholdX=cap.x+Math.floor(cap.width*.76),runToken='authentic-first-bearing-run';
  const source={runToken,lifecycle:'running',floor:9,theme:'void',tick:505,
    player:{health:5,x:thresholdX+23000,y:3252000,
      halfWidth:9000,halfHeight:14000,grounded:true,
      groundedPlatformId:'f9:ground',state:'standing',vy:0},
    platforms:[{id:'f9:ground',x:310000,y:3188000,width:60000,height:50000}],
    lastGuardianCrossing:{runToken,fromFloor:8,toFloor:9,sourceTick:475,
      exitX:thresholdX,cap,guardian:{kind:'guardian',active:false,health:0}}};
  const oldGallery=new THREE.Group();
  oldGallery.add(new THREE.Mesh(new THREE.BoxGeometry(1,2,1),new THREE.MeshBasicMaterial()));
  const held={runToken,floor:9,guardianGateRetained:true,
    verifiedObservedFloorAdvance:true,oldCapId:'f8:cap',
    thresholdX,oldCapX:cap.x,oldCapWidth:cap.width,oldRoofY:3238000,
    crossingTick:475,submittedFrames:4,visibleSeconds:.38,
    originalGatewayOpacity:.85,originalGallerySourceOpacity:.08,
    opticalExitSubmitted:false,originalGalleryRoot:oldGallery};
  const parent=new THREE.Group();parent.name='floor:9:void';
  const root=new THREE.Group();root.name='SourceEarnedVoidLandingBearingFrame';
  parent.add(root);
  root.add(new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshStandardMaterial()));
  const originalBearing={runToken,root,coreDrawn:true,coreDeferred:false};
  const job={runToken,floor:9,sourceTick:477,proof:'recorded-source-gateway',
    structureDeferred:true,state:'awaiting-void-biome-build',
    submittedFrames:4,firstBearingReturnedFrames:3,
    actualFirstFrameVoidBearings:true,entireIncomingVoidCoreDeferred:false,
    structuralVisibleReturns:0,structuralFade:0};
  return {source,held,job,originalBearing};
}

test('real returned original first-F9 load path can retire the already-faded detached old gallery before delayed monumental uploads',async()=>{
  const {observedFirstReturnedVoidBearingGalleryRetirement:retire}=await policy;
  const f=await fixture(),before=JSON.stringify({source:f.source,job:f.job});
  const accepted=retire(f.source,f.held,f.job,f.originalBearing);
  assert.equal(accepted?.sourceBound,true);
  assert.equal(accepted?.galleryOnly,true);
  assert.equal(accepted?.maxOpacity,0);
  assert.equal(accepted?.originalBearingReturnedFrames,3);
  assert.equal(JSON.stringify({source:f.source,job:f.job}),before);
  assert.equal(f.held.originalGalleryRoot.visible,true,'proof never mutates scene');
  assert.equal(f.originalBearing.root.parent.name,'floor:9:void');
  assert.equal(f.job.structuralVisibleReturns,0,
    'real deferred-vault visible returns are not required to remove OBSOLETE gallery');
});

test('fake first-return flag, no real attached original 3D mesh or fewer successful returns cannot erase historical gallery',async()=>{
  const {observedFirstReturnedVoidBearingGalleryRetirement:retire}=await policy;
  const f=await fixture(),{source:s,held:h,job:j,originalBearing:b}=f;
  for(const variant of [
    {...j,firstBearingReturnedFrames:0},{...j,firstBearingReturnedFrames:2},
    {...j,firstBearingReturnedFrames:5},{...j,submittedFrames:2},
    {...j,proof:'adjacent-browser-guardian'}, {...j,runToken:'other'},
    {...j,actualFirstFrameVoidBearings:false},
    {...j,entireIncomingVoidCoreDeferred:true},
    {...j,sourceTick:s.tick+1}
  ])assert.equal(retire(s,h,variant,b),null);
  assert.equal(retire(s,h,j,null),null,'missing original GPU bearing must fail closed');
  assert.equal(retire(s,h,j,{}),null,'untrusted first-return metadata cannot retire bronze gallery');
  assert.equal(retire(s,{...h,submittedFrames:2},j,b),null);
  assert.equal(retire(s,{...h,visibleSeconds:.05},j,b),null);
  assert.equal(retire(s,{...h,originalGalleryRoot:{isGroup:true,children:[]}},j,b),null);
  b.root.removeFromParent();
  assert.equal(retire(s,h,j,b),null,'detached previous-floor meshes do not qualify');
  const parent=new (await import('three')).Group();parent.name='floor:9:void';parent.add(b.root);
  b.root.clear();
  assert.equal(retire(s,h,j,b),null,'empty replacement is not genuine Void architecture');
});

test('invalid original victory, run, physical sole, support or threshold forbid old-gallery erasure',async()=>{
  const {observedFirstReturnedVoidBearingGalleryRetirement:retire}=await policy;
  for(const mutate of [
    f=>{f.source.lastGuardianCrossing.guardian.health=1;},
    f=>{f.source.lastGuardianCrossing.guardian.active=true;},
    f=>{f.source.runToken='other';},
    f=>{f.source.player.groundedPlatformId='fake';},
    f=>{f.source.player.x=f.held.thresholdX;},
    f=>{f.source.player.y+=4000;},
    f=>{f.source.floor=8;},
    f=>{f.held.oldCapWidth+=1000;},
    f=>{f.held.originalGatewayOpacity=0;},
    f=>{f.originalBearing.runToken='other';}
  ]){const f=await fixture();mutate(f);
    assert.equal(retire(f.source,f.held,f.job,f.originalBearing),null);}
});

test('shipping World counts ONLY genuinely returned original 3D F9 bearing and culls historical gallery WITHOUT editing portal, support or authority',()=>{
  const world=fs.readFileSync(path.join(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/firstBearingReturnedFrames:0/);
  assert.match(world,/stagedVoidArchitecture\.root\.parent===floorGroup/);
  assert.match(world,/job\.firstBearingReturnedFrames=Math\.min\(30/);
  assert.match(world,/observedFirstReturnedVoidBearingGalleryRetirement\(/);
  assert.match(world,/held\.originalGalleryRoot\.visible=originalPresence>\.015/);
  assert.match(world,/held\.originalGatewayOpacity=originalGatePresence/);
  assert.match(world,/const arrival=platforms\.get\('f9:ground'\)\?\.arrivalSurface/);
  assert.doesNotMatch(world,/snapshot\.player\.(?:x|y|grounded|health)\s*=/);
});
