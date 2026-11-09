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
