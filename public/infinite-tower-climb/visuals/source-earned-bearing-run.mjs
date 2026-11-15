// P0: original authored noninteractive bearing gallery connecting the real
// opened bronze guardian threshold to its already-generated Floor9 roof and
// first raised step. Planning is source-verified, not gameplay authority.
const safe=Number.isSafeInteger;
export function plannedEarnedClockworkVoidBearings(s,old) {
  if(s?.floor!==9||s.theme!=='void'||s.lifecycle!=='running'||
     !(s.player?.health>0)||!safe(s.tick)||!safe(s.worldWidth)||
     s.worldWidth<=0||!safe(s.chunkBaseY)||!s.runToken||
     old?.floor!==9||old.runToken!==s.runToken||
     old.oldCapId!=='f8:cap'||old.guardianGateRetained!==true||
     !(old.verifiedObservedFloorAdvance===true ||
       // The authentic old Clockwork GPU frame can be retained from the
       // last defeated-guardian browser packet before the immutable crossing
       // record arrives. The 1x original WebM exposed exactly this case:
       // source tick475 has TRUE f9:ground sole/roof contact while the
       // previous source packet is >12 ticks old. Only the original,
       // HP-defeat-validated retained old gate may authorize this first
       // source-anchored noninteractive bearing construction.
       (safe(old.sourceTick)&&safe(old.firstObservedTick)&&
        old.firstObservedTick===old.sourceTick&&
        s.tick>=old.sourceTick&&s.tick-old.sourceTick<=12&&
        s.player.grounded===true&&
        s.player.groundedPlatformId==='f9:ground'&&
        safe(s.player.y)&&safe(s.player.halfHeight)&&
        s.player.halfHeight>0&&
        s.player.y-s.player.halfHeight===old.oldRoofY))||
     ![old.oldRoofY,old.thresholdX,old.oldCapX,old.oldCapWidth].every(safe)||
     old.oldCapWidth<=0||!Array.isArray(s.platforms))return null;
  const c=s.lastGuardianCrossing;
  if(c&&!(c.runToken===s.runToken&&c.fromFloor===8&&c.toFloor===9&&
    c.guardian?.kind==='guardian'&&c.guardian.active===false&&
    safe(c.guardian.health)&&c.guardian.health<=0&&c.cap?.id==='f8:cap'&&
    safe(c.sourceTick)&&c.sourceTick<=s.tick))return null;
  const ground=s.platforms.find(p=>p?.id==='f9:ground');
  const step=s.platforms.find(p=>p?.id==='f9:gateway-step');
  if(!ground||!step||![ground.x,ground.y,ground.width,ground.height,
    step.x,step.y,step.width,step.height].every(safe)||
    ground.width<=0||ground.height<=0||step.width<=0||step.height<=0||
    ground.y+ground.height!==old.oldRoofY||
    old.thresholdX<old.oldCapX||
    old.thresholdX>old.oldCapX+old.oldCapWidth||
    old.thresholdX<ground.x||old.thresholdX>ground.x+ground.width)return null;
  const landingX=step.x+Math.floor(step.width/2);
  const rise=step.y+step.height-old.oldRoofY;
  if(!safe(landingX)||Math.abs(landingX-old.thresholdX)>90000||
    rise<10000||rise>200000)return null;
  const dir=landingX>=old.thresholdX?1:-1;
  const xs=[-8000,12000,32000].map(d=>old.thresholdX+dir*d);
  if(xs.some(x=>!safe(x)||x<ground.x||x>ground.x+ground.width||
    x<0||x>s.worldWidth))return null;
  const y=(old.oldRoofY-s.chunkBaseY)/10000;
  const height=Math.max(5,Math.min(7,1.8+rise/10000*.6));
  const nodes=xs.map((x,i)=>Object.freeze({x,angle:(x/s.worldWidth-.5)*2.2,
    sceneY:y,height,materialPhase:['bronze','transition','void'][i]}));
  return Object.freeze({source:'authentic-old-gateway-to-f9-first-step',
    thresholdX:old.thresholdX,landingX,roofId:ground.id,stepId:step.id,
    runToken:s.runToken,nodes:Object.freeze(nodes)});
}


/**
 * P0 physical load-path reconstruction from source-pinned native footage:
 * campaign 43745587650, candidate e2c45779, desktop source tick 475.
 * The previous outer vertical at radius 28.25 (authored forged instance #2)
 * physically hit the REAL climber's shoulder camera ray at 14.163m, before
 * the actor at 16.839m. An opacity/camera workaround would not repair that
 * fake exterior structural curtain. Carry the inherited bronze/forged/void
 * load instead on permanent CORE-WALL columns (r=21.6, behind the r=25
 * traversable route) and overhead cantilevers with genuine 4m+ clearance.
 * No new collision, landing, floor, portal, actor, combat or replay event.
 * Pure authored geometry planning: World alone creates real Three meshes.
 */
export function plannedSourceEarnedSuspendedBearingSections(nodes) {
  if(!Array.isArray(nodes) || nodes.length!==3 ||
     nodes.some(n=>![n?.angle,n?.sceneY,n?.height].every(Number.isFinite) ||
       n.height<5 || n.height>7 || Math.abs(n.angle)>2.4))return null;
  const at=(a,r,y,s)=>({
    p:[Math.sin(a)*r,y,Math.cos(a)*r],r:[0,a,0],s
  });
  return nodes.map((station,index)=>{
    const {angle:a,sceneY:y,height:h}=station;
    const crown=y+h;
    const parts=[
      // All real floor-to-crown compressive supports are anchored BEHIND
      // the existing inner-wall radius 22.4, never in the front camera rim.
      at(a,21.6,y+h*.5,[.46,h,.54]),
      at(a,21.6,crown-.23,[.70,.46,.62]),
      at(a,21.75,crown-.95,[.46,1.50,.45]),
      // A suspended radial compression beam and forged head tie carry the
      // roof across the REAL open 25m deck without filling its doorway.
      at(a,24.91,crown,[.36,.28,7.3]),
      at(a,27.6,crown+.08,[.46,.26,.48]),
      // The source-pinned 1x films still collapse the multi-level bronze
      // gallery into a completely bare violet sky after one old-gate return.
      // Extend this SAME rear-supported, GPU-instanced load path into the
      // genuinely rising Floor9 route. All tall shafts remain at r=21.6,
      // behind the 22.4m inner wall and the actual r=25m hero arc.
      // Upper cantilevers are ABOVE the skinned head and do not invent decks,
      // collisions, portals, or extra gameplay. Same 3 materials / 3 batches.
      at(a,21.6,crown+5.8,[.28,11.6,.34]),
      at(a,24.91,crown+11.6,[.22,.22,7.3]),
    ];
    if(index>0){
      const previous=nodes[index-1];
      const mid=(previous.angle+a)*.5;
      const innerSpan=21.6*Math.abs(a-previous.angle);
      const outerSpan=27.6*Math.abs(a-previous.angle);
      parts.push(at(mid,21.6,crown-.32,[innerSpan+.28,.24,.38]));
      // Outer sightline remains empty at hero height: ONLY high tensile
      // crown-to-crown linkage can connect adjacent suspended outriggers.
      parts.push(at(mid,27.6,crown+.02,[outerSpan+.20,.22,.34]));
      // High inner-wall tie closes each two-storey load bay while the
      // original lower gateway remains physically open to both cameras.
      parts.push(at(mid,21.6,crown+11.6,[innerSpan+.18,.20,.32]));
    }
    return parts;
  });
}
