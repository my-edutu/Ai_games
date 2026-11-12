import { observedRecordedGuardianHandoff, observedRecordedGuardianAirborneHandoff } from './guardian-passage.mjs';

// P0 original 1× native-film forensic: source tick 451 really crossed the HP0
// Floor8 cap, but both desktop/portrait first browser-received Floor9 packets
// painted a LEGACY exterior memorial with no original GPU gateway/cap. This
// pure, read-only classification tells a future exact-SHA film WHY the
// immutable source witness did not outrank the lagged old browser snapshot.
// Never edits a snapshot, awards a floor, fabricates a frame or grades video.
export function auditOriginalGuardianCrossing(next, previous=null) {
  const w=next?.lastGuardianCrossing;
  const p=next?.player;
  const recorded=!!observedRecordedGuardianHandoff(next);
  const recordedAirborne=!!observedRecordedGuardianAirborneHandoff(next);
  const sourceTick=Number.isSafeInteger(w?.sourceTick)?w.sourceTick:null;
  const observedTick=Number.isSafeInteger(next?.tick)?next.tick:null;
  const ageTicks=sourceTick!==null&&observedTick!==null
    ? observedTick-sourceTick:null;
  const browserGapTicks=Number.isSafeInteger(previous?.tick)&&observedTick!==null
    ? observedTick-previous.tick:null;
  const sameRun=!!w && !!next && typeof w.runToken==='string' &&
    w.runToken.length>0 && next.runToken===w.runToken;
  const cap=w?.cap;
  const ground=next?.platforms?.find(item=>item?.id==='f9:ground');
  const sourceFooting=!!cap&&!!ground &&
    Number.isSafeInteger(cap.y)&&Number.isSafeInteger(cap.height)&&
    Number.isSafeInteger(ground.y)&&Number.isSafeInteger(ground.height)&&
    Number.isSafeInteger(w.previousY)&&Number.isSafeInteger(w.crossingY)&&
    Number.isSafeInteger(w.halfHeight)&&w.halfHeight>0&&
    cap.y+cap.height===ground.y+ground.height&&
    w.previousY-w.halfHeight===cap.y+cap.height&&
    w.crossingY-w.halfHeight===ground.y+ground.height;
  const currentGrounded=p?.grounded===true;
  const currentSupport=p?.groundedPlatformId==='f9:ground';
  let veto='none';
  if (!w) veto='missing-source-witness';
  else if (ageTicks!==null&&ageTicks<0) veto='future-source-witness';
  else if (ageTicks===null||ageTicks>12) veto='expired-source-witness';
  else if (!sameRun) veto='wrong-run';
  else if (next.floor!==9||w.fromFloor!==8||w.toFloor!==9)
    veto='floor-mismatch';
  else if (!sourceFooting) veto='world-support-mismatch';
  else if (!(w.guardian?.active===false &&
    Number.isFinite(w.guardian?.health)&&w.guardian.health<=0))
    veto='guardian-not-defeated';
  else if (!currentGrounded && !recordedAirborne) veto='current-actor-not-grounded';
  else if (!currentSupport && !recordedAirborne) veto='current-support-mismatch';
  else if (!recorded && !recordedAirborne) veto='source-contract-rejected';
  return {
    evidenceOnly:true,acceptance:'NOT EVALUATED',
    present:!!w,sourceTick,observedTick,ageTicks,browserGapTicks,
    previousObservedFloor:Number.isSafeInteger(previous?.floor)
      ?previous.floor:null,
    currentObservedFloor:Number.isSafeInteger(next?.floor)?next.floor:null,
    sourceSameRun:sameRun,
    rawSourceGroundedArrivalConsistent:sourceFooting,
    sourceGuardianDefeated:w?.guardian?.active===false &&
      Number.isFinite(w.guardian?.health)&&w.guardian.health<=0,
    currentSourceGrounded:currentGrounded&&currentSupport,
    recordedHandoffAccepted:recorded || recordedAirborne,
    recordedAirborneContinuationAccepted:recordedAirborne,veto,
    // Numeric source-only geometry is enough to diagnose a rejected legal
    // witness. No identity, browser frame, synthetic event or personal data.
    exitX:Number.isSafeInteger(w?.exitX)?w.exitX:null,
    previousSourceX:Number.isSafeInteger(w?.previousX)?w.previousX:null,
    crossingSourceX:Number.isSafeInteger(w?.crossingX)?w.crossingX:null,
    observedSourceX:Number.isSafeInteger(p?.x)?p.x:null,
    sourceGroundedPlatformId:currentSupport?'f9:ground':
      typeof p?.groundedPlatformId==='string'?'other-or-none':null,
    meaning:'Source/observer contract audit only; native pixels, independent reviews and supported-device FPS remain ungraded'
  };
}
