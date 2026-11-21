'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const helperPromise=import(pathToFileURL(path.join(root,
  'public/infinite-tower-climb/visuals/source-returned-gate-camera-release.mjs')).href);
function genuine() {
  const runToken='original-guardian-victory',tick=502;
  const oldCapX=250000,oldCapWidth=160000;
  const thresholdX=oldCapX+Math.floor(oldCapWidth*.76);
  const source={runToken,floor:9,theme:'void',lifecycle:'running',
    tick,chunkBaseY:82000,worldWidth:480000,
    player:{health:4,state:'standing',x:390000,y:100000,
      halfWidth:9000,halfHeight:18000,grounded:true,
      groundedPlatformId:'f9:ground'},
    platforms:[{id:'f9:ground',x:0,y:80000,width:480000,height:2000}]};
  const held={runToken,floor:9,sourceTick:475,
    sourceOwnedOriginalCameraRoom:true,originalArchitectureWorldCertified:true,
    originalArchitectureCoverageSourceTick:tick,guardianGateRetained:true,
    oldCapId:'f8:cap',oldCapX,oldCapWidth,thresholdX,
    oldRoofY:82000,submittedFrames:5,originalGatewayOpacity:.85,
    visibleSeconds:.4};
  const lastReturned={floor:9,runToken,tick:499};
  return {source,held,lastReturned,
    previousCamera:[20,12,48],previousFocus:[0,7,25],
    desiredCamera:[44,20,30],desiredFocus:[10,11,24],dt:.04};
}
test('source-certified gateway survives camera director shoulder changes only at bounded submitted-F9 speed',async()=>{
  const {sourceRetainedGatewayCameraContinuity:propose}=await helperPromise;
  const evidence=genuine(),before=JSON.stringify(evidence);
  const p=propose(evidence);
  assert.ok(p?.limited,'real source-held gateway receives a bounded real-camera proposal');
  assert.ok(Math.abs(p.turnRadians)<=.72*.04+1e-8);
  assert.ok(Math.abs(p.camera[1]-evidence.previousCamera[1])<=12*.04+1e-8);
  const r0=Math.hypot(evidence.previousCamera[0],evidence.previousCamera[2]);
  const r1=Math.hypot(p.camera[0],p.camera[2]);
  assert.ok(Math.abs(r1-r0)<=14*.04+1e-8);
  assert.equal(JSON.stringify(evidence),before,'camera evidence cannot mutate the source');
});
test('no invented camera continuity from first unreturned world, stale physical room or opposite run',async()=>{
  const {sourceRetainedGatewayCameraContinuity:propose}=await helperPromise;
  const e=genuine();
  const cases=[
    {...e,lastReturned:{...e.lastReturned,runToken:'other'}},
    {...e,lastReturned:{...e.lastReturned,floor:8}},
    {...e,lastReturned:{...e.lastReturned,tick:503}},
    {...e,held:{...e.held,runToken:'other'}},
    {...e,held:{...e.held,sourceOwnedOriginalCameraRoom:false}},
    {...e,held:{...e.held,originalArchitectureWorldCertified:false}},
    {...e,held:{...e.held,originalArchitectureCoverageSourceTick:501}},
    {...e,held:{...e.held,guardianGateRetained:false}},
    {...e,held:{...e.held,originalGatewayOpacity:.01}},
    {...e,held:{...e.held,submittedFrames:0}},
    {...e,held:{...e.held,visibleSeconds:3}},
    {...e,held:{...e.held,thresholdX:390000}},
    {...e,held:{...e.held,oldRoofY:82001}},
    {...e,source:{...e.source,floor:10}},
    {...e,source:{...e.source,theme:'clockwork'}},
    {...e,source:{...e.source,player:{...e.source.player,health:0}}},
    {...e,source:{...e.source,platforms:[]}},
    {...e,source:{...e.source,platforms:[
      {...e.source.platforms[0],height:3000}]}},
    {...e,source:{...e.source,tick:700}},
    {...e,dt:0},
    {...e,dt:1}
  ];
  for(const candidate of cases){
    assert.equal(propose(candidate),null,
      'invalid physical, returned frame or run witness must not steer camera');
  }
});
test('actual final WebGL camera path enforces same-run roof, gate and full-body before a returned draw',()=>{
  const s=fs.readFileSync(path.join(root,
    'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  const origin=s.indexOf('const retainedColdArrival = world.retainedFilmHandoff');
  const proposal=s.indexOf('sourceRetainedGatewayCameraContinuity({',origin);
  const body=s.indexOf('const currentFullBodyVisible=',proposal);
  const joint=s.indexOf('const joinedRoomVisible=',proposal);
  const render=s.indexOf('renderer.render(scene, camera);',proposal);
  assert.ok(origin>=0&&origin<proposal&&proposal<body&&body<joint&&joint<render);
  assert.match(s.slice(origin,proposal),/const retainedGateStep = options\\.camera === 'follow'/,
    'final camera gate must use the animate scope, not the update-only overview local');
  assert.match(s.slice(proposal,render),
    /towerCoreSightlineClear\(camera\.position,gatePoint,23\.5\)/);
  assert.match(s.slice(proposal,render),
    /towerCoreSightlineClear\(camera\.position,roofPoint,23\.5\)/);
  assert.match(s.slice(proposal,render),
    /camera\.position\.copy\(releasePreviousCamera\)/);
});
