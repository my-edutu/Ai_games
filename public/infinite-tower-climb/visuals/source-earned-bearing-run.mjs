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
