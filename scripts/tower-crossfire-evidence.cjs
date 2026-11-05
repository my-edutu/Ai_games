'use strict';
// Authentic source-to-render telemetry only. Never score a game or
// claim a raster-visible action from diagnostic numbers.
function summarizeTowerCrossfire(witnesses) {
 const input=Array.isArray(witnesses)?witnesses:[];
 const phase={prelude:0,imminent:0,active:0};
 const physically={prelude:0,imminent:0,active:0,release:0};
 const unique=new Set(), seenLive=new Set();
 let valid=0, sourceLiveEnemyBoltTicks=0, sourceLiveHazardOverlapTicks=0;
 let sourceMatched3dLiveEnemyBoltTicks=0, sourceMatched3dLiveHazardOverlapTicks=0;
 for(const w of input){
  if(!w || !w.runToken || !Number.isSafeInteger(w.floor) ||
     !Number.isSafeInteger(w.tick) || !Number.isFinite(w.atMs) ||
     !Array.isArray(w.sourceHazards))continue;
  valid++;
  const shot=w.sourceLiveEnemyBolt;
  const matchingLive=shot && typeof shot.id==='string' && shot.id &&
    shot.coincidentNotAttributed===true &&
    [shot.x,shot.y,shot.vx].every(Number.isFinite) && shot.vx!==0;
  if(matchingLive){
    const key=w.runToken+':'+w.floor+':'+w.tick+':'+shot.id;
    if(!seenLive.has(key)){
      seenLive.add(key);
      sourceLiveEnemyBoltTicks++;
      const crossed=w.sourceHazards.some(h=>h &&
        typeof h.id==='string' && h.id && (h.active===true ||
        Number.isSafeInteger(h.chargeTicksRemaining) &&
        h.chargeTicksRemaining>=1 && h.chargeTicksRemaining<=12));
      if(crossed)sourceLiveHazardOverlapTicks++;
      // Never count a stale/asynchronous 3D frame as matching source action.
      const render=w.renderedLiveHostile;
      if(render?.sourceTick===w.tick &&
        render.projectileId===shot.id &&
        Number.isSafeInteger(render.instancedMarkers) &&
        render.instancedMarkers>=1){
        sourceMatched3dLiveEnemyBoltTicks++;
        if(crossed)sourceMatched3dLiveHazardOverlapTicks++;
      }
    }
  }
  for(const h of w.sourceHazards){
   if(typeof h?.id!=='string'||!h.id)continue;
   const kind=h.active===true?'active':
    Number.isSafeInteger(h.chargeTicksRemaining)&&h.chargeTicksRemaining>=7&&h.chargeTicksRemaining<=12?'prelude':
    Number.isSafeInteger(h.chargeTicksRemaining)&&h.chargeTicksRemaining>=1&&h.chargeTicksRemaining<=6?'imminent':null;
   if(!kind)continue;
   const id=w.runToken+':'+w.floor+':'+w.tick+':'+h.id;
   if(unique.has(id))continue;
   unique.add(id);phase[kind]++;
   const r=w.renderedPressure;
   if(r&&r.sourceTick===w.tick&&r.instances>0&&(
     (kind==='prelude'&&r.crossfirePrewarnings>0)||
     (kind==='imminent'&&r.crossfireWarnings>0)||
     (kind==='active'&&r.activeHazards>0)))physically[kind]++;
  }
  const r=w.renderedPressure;
  if(r&&r.sourceTick===w.tick&&r.instances>0&&r.crossfireReleases>0)physically.release++;
 }
 return {sourceWitnessSamples:valid,sourceUniqueHazardTicks:unique.size,
  sourcePhaseTicks:phase,sourceMatched3dPhaseTicks:physically,
  sourceLiveEnemyBoltTicks,sourceLiveHazardOverlapTicks,
  sourceMatched3dLiveEnemyBoltTicks,sourceMatched3dLiveHazardOverlapTicks,
  fullSourcePhaseSequenceSeen:physically.prelude>0&&physically.imminent>0&&physically.active>0,
  verdict:'NOT EVALUATED',
  caveat:'Source+render timing only, NOT proof of source shooter attribution, raster visibility, independent judgment, experience improvement or supported-hardware FPS. Missing 50ms windows may be sampling loss.'};
}
module.exports={summarizeTowerCrossfire};
