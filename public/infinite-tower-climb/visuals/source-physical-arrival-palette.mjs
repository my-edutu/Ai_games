// Physically owned Clockwork -> Void entrance palette. This is not a floor
// transition or a new route: every shade follows an already-observed genuine
// zero-HP guardian, the original cap/roof and the living player on F9.
// Source distance, not the browser clock or slow WebGL submissions, controls
// how the original bronze engineering becomes the next biome's violet metal.
import { observedStagedOriginalCapBeforeRecordedCrossing } from './crossfloor-arrival.mjs';
const valid=Number.isSafeInteger;
const clamp01=n=>Math.min(1,Math.max(0,n));
const smooth=n=>{const t=clamp01(n);return t*t*(3-2*t);};

export function observedSourcePhysicalArrivalPalette(source,held=null) {
  const p=source?.player, w=source?.lastGuardianCrossing;
  if(!source || !p || source.lifecycle!=='running' ||
     source.floor!==9 || source.theme!=='void' ||
     typeof source.runToken!=='string' || !source.runToken ||
     !(p.health>0) || !valid(source.tick) ||
     ![p.x,p.y,p.halfWidth,p.halfHeight].every(valid) ||
     p.halfWidth<=0 || p.halfHeight<=0 ||
     !Array.isArray(source.platforms))return null;
  const ground=source.platforms.find(item=>item?.id==='f9:ground');
  if(!ground || ![ground.x,ground.y,ground.width,ground.height].every(valid) ||
     ground.width<=0 || ground.height<=0)return null;
  let crossingX,roofY,sourceTick,kind;
  if(w!=null){
    const cap=w.cap,guardian=w.guardian;
    if(w.runToken!==source.runToken || w.fromFloor!==8 ||
       w.toFloor!==9 || cap?.id!=='f8:cap' ||
       guardian?.kind!=='guardian' || guardian.active!==false ||
       !valid(guardian.health) || guardian.health>0 ||
       ![w.sourceTick,w.crossingX,w.exitX,w.halfWidth,w.halfHeight,
          cap.x,cap.y,cap.width,cap.height].every(valid) ||
       cap.width<=0 || cap.height<=0 ||
       w.halfWidth!==p.halfWidth || w.halfHeight!==p.halfHeight ||
       w.exitX!==cap.x+Math.floor(cap.width*.76) ||
       w.crossingX<w.exitX || w.crossingX>w.exitX+60000 ||
       ground.y+ground.height!==cap.y+cap.height)return null;
    crossingX=w.crossingX;roofY=cap.y+cap.height;
    sourceTick=w.sourceTick;kind='recorded-source-zero-hp';
    // If the old GPU original is still held, it must be the SAME real roof,
    // not an unrelated decorative gate from a prior expedition.
    if(held && (held.runToken!==source.runToken ||
       held.floor!==9 || held.oldRoofY!==roofY ||
       held.thresholdX!==w.exitX))return null;
  } else {
    // The first portrait browser receipt may arrive BEFORE the immutable
    // HP-zero crossing record. Accept ONLY the already validated same-run
    // former cap and grounded source corridor; never infer a victory.
    if(!observedStagedOriginalCapBeforeRecordedCrossing(source,held) ||
       ![held?.observedCrossingX,held?.oldRoofY,held?.sourceTick].every(valid) ||
       ground.y+ground.height!==held.oldRoofY)return null;
    crossingX=held.observedCrossingX;roofY=held.oldRoofY;
    sourceTick=held.sourceTick;kind='verified-original-roof-receipt';
  }
  const sole=p.y-p.halfHeight,travel=p.x-crossingX,age=source.tick-sourceTick;
  if(!valid(sole) || !valid(travel) || !valid(age) || age<0 || age>70 ||
     travel<0 || travel>100000 ||
     sole<roofY-2500 || sole>roofY+160000 ||
     p.x-p.halfWidth<ground.x ||
     p.x+p.halfWidth>ground.x+ground.width ||
     !(p.grounded===false && p.state==='airborne' &&
         p.groundedPlatformId==null && Number.isFinite(p.vy) ||
       p.grounded===true && (p.state==='standing' || p.state==='hurt') &&
         p.vy===0 && sole===roofY &&
         (p.groundedPlatformId==='f9:ground' ||
          p.groundedPlatformId==='f8:cap')))return null;
  // The full-body climber remains warm at the actual old sill, and walks
  // through a 90m material transition into the existing next-floor palette.
  // This changes NO geometry, physics, inputs, tick, enemy or gameplay state.
  const progress=smooth((travel-6000)/84000);
  const oldWeight=1-progress;
  return {sourceBound:true,sourceTick:source.tick,crossingTick:sourceTick,
    kind,travel,roofY,oldWeight,progress,
    limitation:'True original threshold and actual source distance, not native film/independent acceptance'};
}
