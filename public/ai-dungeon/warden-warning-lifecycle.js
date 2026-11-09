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

/** The slot list is the existing eight-item retained signal pool, not a cache. */
export function isStaleWardenWarning(incoming,slots=[]){
 if(!actualWarning(incoming)||!Array.isArray(slots))return false;
 for(const slot of slots){
  const live=slot?.cue??slot;
  if(!actualWarning(live)||!sameOwner(live,incoming))continue;
  if(live.tick>incoming.tick)return true;
  if(live.tick===incoming.tick){
   const liveAttack=attackTick(live),incomingAttack=attackTick(incoming);
   if(liveAttack!==null&&incomingAttack!==null&&liveAttack>incomingAttack)return true;
  }
 }
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
