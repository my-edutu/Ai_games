'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const three=import('three');
const passage=import('../../public/infinite-tower-climb/visuals/guardian-passage.mjs');
const live=import('../../public/infinite-tower-climb/visuals/passage-live-witness.mjs');
const cap={id:'f8:cap',kind:'oneway',x:115200,y:3212000,width:249600,height:12000};
const threshold=cap.x+Math.floor(cap.width*.76);
const playerX=threshold+13000,playerY=cap.y+cap.height+14000;
const angle=.24,anchor={x:Math.sin(angle)*27.78,y:17.5,z:Math.cos(angle)*27.78,angle};
function pair(){
 const player={health:4,grounded:true,groundedPlatformId:'f8:cap',
   x:playerX,y:playerY,halfWidth:9000,halfHeight:14000};
 const before={runToken:'real-arch-run',floor:8,tick:450,lifecycle:'running',
   guardianExitX:threshold,worldWidth:480000,chunkBaseY:2880000,
   platforms:[cap],enemies:[{id:'f8:guardian',kind:'guardian',floor:8,
     active:false,health:0,maxHealth:8,x:235000,
     y:cap.y+cap.height+18000,halfHeight:18000}],player};
 const after={runToken:before.runToken,floor:9,tick:451,
   theme:'void',lifecycle:'running',worldWidth:480000,
   chunkBaseY:2880000,enemies:[],
   platforms:[{id:'f9:ground',kind:'solid',x:0,y:cap.y,
     width:480000,height:cap.height}],
   player:{...player,health:5,groundedPlatformId:'f9:ground'}};
 return {before,after};
}
test('same-run original opened world gate removes only redundant F9 full-size threshold',async()=>{
 const [THREE,{createTowerGuardianPassage}]=await Promise.all([three,passage]);
 const fx=createTowerGuardianPassage(THREE);
 try{
  const {before,after}=pair(),unchanged=JSON.stringify([before,after]);
  assert.equal(fx.begin(before,after,anchor),true);
  fx.update(.02);
  const inner=fx.group.getObjectByName('EarnedWalkableInnerGateAssembly');
  const roof=fx.group.getObjectByName('WitnessedGuardianCapWalkwayInlay');
  const edges=fx.group.getObjectByName('SourceSupportedGuardianThresholdEdgeRun');
  const proof={sourceBound:true,originalGatewayGeometryPresent:true,
    runToken:after.runToken,floor:9,sourceTick:after.tick,oldCapId:'f8:cap'};
  assert.equal(inner.visible,true);
  assert.equal(fx.preferOriginalSourceGateway(after,proof),true);
  assert.equal(inner.visible,false);
  fx.update(.02);
  assert.equal(inner.visible,false);
  assert.equal(fx.liveWitness().originalSourceGatewayGeometryPreferred,true);
  assert.equal(fx.diagnostics().physicallyWalkableThreshold.extraDraws,0);
  assert.equal(roof.visible,true);
  assert.equal(edges.visible,true);
  assert.equal(edges.count,24);
  assert.equal(fx.diagnostics().inlayMode,'successor-ground');
  assert.equal(JSON.stringify([before,after]),unchanged);
  for(const invalid of [null,{...proof,runToken:'wrong'},
      {...proof,sourceTick:after.tick-1},{...proof,originalGatewayGeometryPresent:false}]){
    assert.equal(fx.preferOriginalSourceGateway(after,invalid),false);
    assert.equal(inner.visible,true,'missing original gate restores real handoff fallback');
    assert.equal(fx.diagnostics().physicallyWalkableThreshold.extraDraws,2);
  }
  assert.equal(fx.preferOriginalSourceGateway(after,proof,{stale:true}),false);
  assert.equal(fx.preferOriginalSourceGateway({...after,runToken:'wrong'},proof),false);
  assert.equal(fx.preferOriginalSourceGateway(after,proof),true);
  fx.clear();
  assert.equal(fx.liveWitness().originalSourceGatewayGeometryPreferred,false);
  assert.equal(inner.visible,false);
 }finally{fx.dispose();}
});
test('the original gate geometry witness requires source-owned hierarchy and run',()=>{
 const w=fs.readFileSync(path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
 const s=fs.readFileSync(path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 for(const r of [/function sourceEarnedOriginalGateGeometry\(snapshot\)/,
   /held\.originalGateRoot\?\.parent!==held\.root/,
   /held\.root\?\.parent!==group/,
   /held\.sourceAlignedPassage!==true/,/originalGatewayOpacity>\.035/,
   /passageWitness\.originalSourceGatewayGeometryPreferred===true/])
  assert.match(w,r);
 assert.match(s,/passage\.preferOriginalSourceGateway\(snapshot,/);
 assert.match(s,/world\.sourceEarnedOriginalGateGeometry\(snapshot\)/);
});
test('lean route witness fails closed absent source handoff',async()=>{
 const {towerPassageLiveWitness}=await live;
 const state={active:true,stage:'handoff',continuousGroundedHandoff:true,
   originalSourceGatewayGeometryPreferred:true,innerDoorAssemblyVisible:false};
 assert.equal(towerPassageLiveWitness(state).originalSourceGatewayGeometryPreferred,true);
 for(const other of [{...state,active:false},{...state,stage:'guardian-locked'},
   {...state,continuousGroundedHandoff:false},
   {...state,originalSourceGatewayGeometryPreferred:undefined}])
  assert.equal(towerPassageLiveWitness(other).originalSourceGatewayGeometryPreferred,false);
});
