import {canonicalPhysicalWarningFootprint} from './physical-feedback-plan.js';
/**
 * D04 presentation-only Warden warning order/ownership policy.
 * The observed warning tick and the public attackTick are NOT interchangeable:
 * an old, delayed release cannot erase the next strike's danger footprint.
 * This module never infers attacks, cells, damage or attacker attribution.
 */
const validTick=value=>Number.isSafeInteger(value)&&value>=0;
const validOwner=cue=>typeof cue?.sceneKey==='string'&&cue.sceneKey.length>0&&
 typeof cue?.actorId==='string'&&cue.actorId.length>0&&validTick(cue.tick);
const actualWarning=cue=>validOwner(cue)&&cue.visual==='warning'&&
 cue.proof==='authority-warning-window';
const sameOwner=(a,b)=>validOwner(a)&&validOwner(b)&&
 a.sceneKey===b.sceneKey&&a.actorId===b.actorId;
const attackTick=cue=>validTick(cue?.detail?.attackTick)?cue.detail.attackTick:null;

/**
 * A witnessed Warden tell remains newer after its transient GPU glyph expires.
 * A genuine release also closes its spent warning. Both are presentation-only
 * observations scoped to the existing scene and actor; no strike is inferred.
 */
function laterWarning(live,incoming){
 if(!actualWarning(live)||!sameOwner(live,incoming))return false;
 if(live.tick>incoming.tick)return true;
 if(live.tick!==incoming.tick)return false;
 const incomingAttack=attackTick(incoming),liveAttack=attackTick(live);
 return incomingAttack!==null&&liveAttack!==null&&liveAttack>incomingAttack;
}
/** Retained slots and optional bounded history are treated as read-only. */
export function isStaleWardenWarning(incoming,slots=[],history=null){
 if(!actualWarning(incoming)||!Array.isArray(slots))return false;
 const release=history?.lastRelease,expected=attackTick(incoming);
 if(validOwner(release)&&release.kind==='warden-release'&&
  release.proof==='authority-action'&&sameOwner(release,incoming)&&
  expected!==null&&expected<=release.tick)return true;
 if(laterWarning(history?.lastWarning,incoming))return true;
 for(const slot of slots)
  if(laterWarning(slot?.cue??slot,incoming))return true;
 return false;
}

/** Keep future danger and different actors even across delayed cue delivery. */
export function shouldRetireWardenWarning(existing,incoming){
 if(!actualWarning(existing)||!sameOwner(existing,incoming))return false;
 if(incoming.kind==='warden-release'){
  if(incoming.proof!=='authority-action'||existing.tick>incoming.tick)return false;
  const expectedImpact=attackTick(existing);
  return expectedImpact===null||expectedImpact<=incoming.tick;
 }
 if(!actualWarning(incoming)||existing.tick>incoming.tick)return false;
 if(existing.tick===incoming.tick){
  const oldImpact=attackTick(existing),newImpact=attackTick(incoming);
  if(oldImpact!==null&&newImpact!==null&&oldImpact>newImpact)return false;
 }
 return true;
}

/**
 * A retained Warden tell is only physical danger while the LATEST public
 * authority still names the same attack, shape and original floor cells.
 * This does not prove or invent an attacker: the planner already established
 * one unique observed Warden; any subsequent ambiguity revokes body ownership.
 * A temporary renderer loss is not permission to replay an expired warning.
 */
export function isLiveWardenWarning(cue,snapshot){
 if(!actualWarning(cue)||!snapshot||
  !Number.isSafeInteger(snapshot.run)||snapshot.run<0||
  !Number.isSafeInteger(snapshot.floor)||snapshot.floor<1||
  !validTick(snapshot.tick)||cue.sceneKey!==snapshot.run+':'+snapshot.floor)return false;
 const expected=attackTick(cue),w=snapshot.bossWarning;
 if(expected===null||expected<=snapshot.tick||!w||w.warning!==true||
  w.attackTick!==expected||w.shape!==cue.detail?.shape)return false;
 const turns=expected-snapshot.tick;
 if(w.turnsUntilImpact!==turns||turns<1||turns>3||
  turns===3&&w.shape!=='NOVA'&&w.shape!=='ECLIPSE_SWEEP')return false;
 // A warning has no owner field; preserve only the previously unique
 // living identity, and never promote an array-first replacement Warden.
 if(!Array.isArray(snapshot.units))return false;
 const living=snapshot.units.filter(u=>
  u?.kind==='warden'&&u.faction==='enemy'&&u.hp>0);
 if(living.length!==1||living[0].id!==cue.actorId)return false;
 const markers=cue.detail?.cells,cells=w.cells;
 // All actual public danger cells establish this tell, not only D04's
 // eight painted samples. A revised same-shape warning may retain those
 // eight cells yet add/remove a different threatened lane. Such a change
 // revokes the old ring AND any frame-awaiting audio. Fail closed when the
 // bound proof is absent; reordering and duplicate cells remain equivalent.
 const footprintKey=cue.detail?.footprintKey;
 if(typeof footprintKey!=='string'||footprintKey.length===0||
  footprintKey!==canonicalPhysicalWarningFootprint(cells))return false;
 if(!Array.isArray(markers)||markers.length<1||markers.length>8||
  !Array.isArray(cells)||cells.length<1||cells.length>300)return false;
 // Never extend a suppressed/replaced hazard footprint to remembered cells.
 return markers.every(marker=>Number.isInteger(marker?.x)&&
  Number.isInteger(marker?.z)&&marker.x>=0&&marker.z>=0&&
  marker.x<256&&marker.z<256&&cells.some(cell=>
   cell?.x===marker.x&&cell?.z===marker.z));
}
