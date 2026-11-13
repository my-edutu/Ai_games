/**
 * Camera, architecture clearance and physically grounded scene-light direction
 * for the real AI Dungeon vertical slice. This never selects an opponent,
 * schedules a strike, invents an opening or changes authoritative state.
 *
 * The same priority grammar serves quiet traversal, a two-body encounter,
 * telegraphed lethal danger, the genuine Warden recovery, portal descent and
 * the final fallen tableau. One immutable plan drives lights + wall sightlines;
 * visual character stakes and floor telegraphs take priority over scenery.
 */
const safe=(value,min,max)=>Math.max(min,Math.min(max,value));
const VALID=new Set(['journey','skirmish-approach','contact','warden-contact',
 'warden-approach','warden-exposed','warden-warning','warden-release','breach-warning',
 'oathguard-cover','descent','portal-descent','last-stand']);
const STAGES=Object.freeze({
 journey:[2.36,1.48,1.06,1.10,1.00],
 'skirmish-approach':[2.57,1.43,1.07,1.17,1.00],
 contact:[3.00,1.34,1.06,1.25,1.00],
 'warden-contact':[3.08,1.39,1.08,1.32,1.08],
 'warden-approach':[3.03,1.49,1.09,1.23,1.00],
 'warden-exposed':[3.10,1.32,1.07,1.39,1.19],
 'warden-warning':[3.04,1.64,1.16,1.03,1.15],
 'warden-release':[3.09,1.40,1.13,1.36,1.17],
 'breach-warning':[2.68,1.59,1.17,1.12,1.00],
 'oathguard-cover':[2.76,1.38,1.06,1.29,1.00],
 descent:[2.33,1.42,1.05,1.10,1.00],
 'portal-descent':[2.50,1.46,1.09,1.19,1.00],
 'last-stand':[3.10,1.38,1.12,1.22,.52]
});
/** Real scene state is the sole source of stage priority. */
export function planWorldStoryStage(state,shot,{width=1440,reducedMotion=false}={}){
 if(!state||!Array.isArray(state.units)||!Array.isArray(state.map)||
    !Number.isInteger(state.floor)||!shot||!VALID.has(shot.mode))return null;
 const boss=state.units.find(u=>u?.kind==='warden'&&u.faction==='enemy'&&u.hp>0);
 const actualWarning=Boolean(boss&&state.bossWarning&&
  Number.isSafeInteger(state.tick)&&Number.isSafeInteger(state.bossWarning.attackTick)&&
  state.bossWarning.attackTick>=state.tick&&state.bossWarning.attackTick<=state.tick+3&&
  Array.isArray(state.bossWarning.cells)&&state.bossWarning.cells.length>0);
 const actualRelease=Boolean(boss&&!actualWarning&&Number.isSafeInteger(state.tick)&&
  boss.action==='cast'&&boss.actionTick===state.tick);
 const actualExposure=Boolean(boss&&!actualWarning&&!state.guardianWard&&
  Number.isSafeInteger(state.bossRecovery?.remaining)&&
  state.bossRecovery.remaining>0&&state.bossRecovery.remaining<=6);
 // Never grade a false boss victory or an invented counter-window. A stale
 // cinema frame can arrive after an authoritative phase boundary.
 let mode=shot.mode;
 if(mode==='warden-exposed'&&!actualExposure)mode=boss?'warden-approach':'journey';
 if(mode==='warden-release'&&!actualRelease)mode=boss?'warden-approach':'journey';
 if(mode==='warden-warning'&&!actualWarning)mode=boss?'warden-approach':'journey';
 if(mode==='warden-contact'&&!boss)mode='contact';
 if(actualWarning&&mode.startsWith('warden-'))mode='warden-warning';
 const [wallPad,ambient,moonScale,keyScale,bossScale]=STAGES[mode];
 const mobile=Number.isFinite(width)&&width>0&&width<600;
 const clearPad=safe(wallPad+(mobile?.11:0),2.1,3.10);
 return Object.freeze({
  mode,wallPad:clearPad,
  ambient,moonScale,keyScale,bossScale,
  partyScale:mode==='warden-warning'?1.18:mode==='warden-release'?1.13:mode==='warden-exposed'?1.13:1.00,
  // Reduced motion preserves spatial contrast, not flickering animation.
  motion:!reducedMotion,
  realBossVisible:!!boss,realWarning:actualWarning,realRelease:actualRelease,realRecovery:actualExposure
 });
}
