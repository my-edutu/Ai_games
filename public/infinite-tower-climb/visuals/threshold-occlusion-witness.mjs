// Opt-in source-authentic Floor 8→9 sightline evidence. Never changes authority,
 // rendering, camera, collision or a gameplay event; native pixels still need review.
import { observedSourceOriginalVisibilityWindow } from './source-physical-arrival-palette.mjs';
const valid=Number.isSafeInteger;
export function observedOriginalDoorwayOcclusionWindow(source,retained=null){
  const p=source?.player;
  if(!source||source.lifecycle!=='running'||!(p?.health>0)||
     !valid(source.tick)||typeof source.runToken!=='string'||!source.runToken||
     !valid(source.worldWidth)||source.worldWidth<=0||
     ![p.x,p.y,p.halfWidth,p.halfHeight].every(valid)||
     p.halfWidth<=0||p.halfHeight<=0||!Array.isArray(source.platforms))return null;
  if(source.floor===8&&source.theme==='clockwork'){
    const cap=source.platforms.find(s=>s?.id==='f8:cap');
    const hpZero=source.enemies?.some(e=>e?.kind==='guardian'&&
      e.active===false&&Number.isFinite(e.health)&&e.health<=0);
    if(!cap||!hpZero||![cap.x,cap.y,cap.width,cap.height,source.guardianExitX]
      .every(valid)||cap.width<=0||cap.height<=0||
      source.guardianExitX!==cap.x+Math.floor(cap.width*.76)||
      Math.abs(p.x-source.guardianExitX)>90000)return null;
    return {sourceBound:true,kind:'actual-defeated-guardian-open-clockwork',
      runToken:source.runToken,floor:8,sourceTick:source.tick,
      thresholdX:source.guardianExitX,roofY:cap.y+cap.height};
  }
  const lease=observedSourceOriginalVisibilityWindow(source,retained);
  if(source.floor!==9||source.theme!=='void'||
     !lease || retained?.guardianGateRetained!==true||
     retained.runToken!==source.runToken||retained.floor!==9||
     !valid(retained.thresholdX)||!valid(retained.oldRoofY)||
     !valid(retained.sourceTick)||source.tick<retained.sourceTick||
     source.tick-retained.sourceTick>lease.maxTicks||
     Math.abs(p.x-retained.thresholdX)>100000)return null;
  const w=source.lastGuardianCrossing;
  const provenRecorded=w?.runToken===source.runToken&&w.fromFloor===8&&
    w.toFloor===9&&w.guardian?.kind==='guardian'&&
    w.guardian.active===false&&Number.isFinite(w.guardian.health)&&
    w.guardian.health<=0&&w.cap?.id==='f8:cap'&&
    [w.sourceTick,w.exitX,w.cap.y,w.cap.height].every(valid)&&
    w.exitX===retained.thresholdX&&
    w.cap.y+w.cap.height===retained.oldRoofY&&
    source.tick>=w.sourceTick&&source.tick-w.sourceTick<=lease.maxTicks;
  const provenReceipt=w==null&&retained.verifiedObservedFloorAdvance===true&&
    valid(retained.observedCrossingX)&&valid(retained.tick)&&
    source.tick>=retained.tick&&source.tick-retained.tick<=12;
  if(!provenRecorded&&!provenReceipt)return null;
  return {sourceBound:true,kind:provenRecorded
      ?'immutable-defeated-guardian-original-gateway'
      :'verified-original-roof-receipt-not-immutable',
    runToken:source.runToken,floor:9,
    sourceTick:provenRecorded?w.sourceTick:retained.sourceTick,
    thresholdX:retained.thresholdX,roofY:retained.oldRoofY};
}
// All endpoints belong to the actual skinned actor, its source half-size,
// and the original opened gateway. No predicted landing or duplicate actor.
export function actualOriginalDoorwaySightlineEndpoints(camera,actor,halfHeight,
    halfWidth,gate){
  if(!camera||!actor||!gate||
     ![camera.x,camera.y,camera.z,actor.x,actor.y,actor.z,
       gate.x,gate.y,gate.z,halfHeight,halfWidth].every(Number.isFinite)||
     halfHeight<=0||halfWidth<=0||halfWidth>halfHeight*1.5)return [];
  const dx=actor.x-camera.x,dz=actor.z-camera.z;
  const length=Math.hypot(dx,dz);
  if(length<.1)return [];
  const lateral=Math.min(halfWidth*.82,halfHeight*.65);
  const rightX=dz/length*lateral,rightZ=-dx/length*lateral;
  return [
    {kind:'real-body-centre',point:[actor.x,actor.y,actor.z]},
    {kind:'real-body-helmet',point:[actor.x,actor.y+halfHeight*.82,actor.z]},
    {kind:'real-left-shoulder',point:[actor.x-rightX,actor.y+halfHeight*.52,actor.z-rightZ]},
    {kind:'real-right-shoulder',point:[actor.x+rightX,actor.y+halfHeight*.52,actor.z+rightZ]},
    {kind:'real-body-sole',point:[actor.x,actor.y-halfHeight*.82,actor.z]},
    {kind:'original-gate-centre',point:[gate.x,gate.y,gate.z]},
    {kind:'original-gate-lip',point:[gate.x,gate.y+1.2,gate.z]}
  ];
}
