/**
 * Read-only Warden combat story. An authoritative cast can open genuine
 * recovery on the SAME tick, so a resolved strike cannot be framed as a
 * future danger. This is presentation only: zero simulation, timers or RNG.
 */
export function planWardenTacticalCue(state,{nearBoss=false}={}){
 const boss=Array.isArray(state?.units)?state.units.find(u=>u?.kind==='warden'&&u.hp>0):null;
 if(!nearBoss||!boss||state?.phase==='intermission')return null;
 const phase=['SENTINEL','RUPTURE','ECLIPSE'].includes(state?.bossPhase)?state.bossPhase:'SENTINEL';
 if(state.guardianWard)return Object.freeze({mode:'sealed',
  floor:'BINDING GUARDS · '+Math.max(0,Number(state.defendersRemaining)||0),
  label:'SEALED · '+phase,striking:false,exposed:false});
 const w=state.bossWarning;
 const warning=w&&Array.isArray(w.cells)&&w.cells.length>0&&
  ['NOVA','RIFT_CROSS','ECLIPSE_SWEEP'].includes(w.shape)&&
  Number.isSafeInteger(state.tick)&&Number.isSafeInteger(w.attackTick)&&
  w.attackTick>state.tick&&w.attackTick-state.tick<=3;
 if(warning)return Object.freeze({mode:'warning',floor:'DODGE THE WARDEN',
  label:'DODGE '+w.shape.replaceAll('_',' ')+' · '+(w.attackTick-state.tick),
  striking:false,exposed:false});
 const striking=Number.isSafeInteger(state.tick)&&
  boss.action==='cast'&&boss.actionTick===state.tick;
 const recovery=state.bossRecovery?.remaining;
 const exposed=Number.isSafeInteger(recovery)&&recovery>0&&recovery<=6;
 if(exposed)return Object.freeze({mode:'counter',
  floor:'WARDEN EXPOSED · COUNTER WINDOW',
  label:striking?'EXPOSED · STRIKE LANDED · COUNTER +40% DAMAGE':
   'EXPOSED · COUNTER +40% DAMAGE',
  striking,exposed:true});
 if(striking)return Object.freeze({mode:'release',floor:'WARDEN STRIKING',
  label:'WARDEN STRIKE · TAKE COVER',striking:true,exposed:false});
 return Object.freeze({mode:'unsealed',floor:'WARDEN EXPOSED',
  label:phase,striking:false,exposed:false});
}
