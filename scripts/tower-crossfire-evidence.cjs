'use strict';
// Authentic source-to-render telemetry only. Never score a game or
// claim a raster-visible action from diagnostic numbers.
function summarizeTowerCrossfire(witnesses) {
 const input=Array.isArray(witnesses)?witnesses:[];
 const phase={prelude:0,imminent:0,active:0};
 const physically={prelude:0,imminent:0,active:0,release:0};
 const unique=new Set();
 let valid=0;
 for(const w of input){
  if(!w || !w.runToken || !Number.isSafeInteger(w.floor) ||
     !Number.isSafeInteger(w.tick) || !Number.isFinite(w.atMs) ||
     !Array.isArray(w.sourceHazards))continue;
  valid++;
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
  fullSourcePhaseSequenceSeen:physically.prelude>0&&physically.imminent>0&&physically.active>0,
  verdict:'NOT EVALUATED',
  caveat:'Source+render timing only, not proof of video visibility, independent judgment, quality improvement or supported-hardware FPS. Missing 50ms windows may be sampling loss.'};
}
module.exports={summarizeTowerCrossfire};
