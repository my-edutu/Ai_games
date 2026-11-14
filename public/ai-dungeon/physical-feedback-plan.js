import {planAuthorityEvasions} from './evasion-performance-plan.js';
/**
 * D04 — truthful, presentation-only physical combat feedback plan.
 *
 * Consumes ONLY public DungeonRuntime snapshots. The optional resolvers are
 * the frozen public presentation adapters (planVisualContact,
 * planAuthorityDamageBeats, planVerifiedMeleeImpactDelay). This module never
 * accesses AI authority, private damage rolls, wall clocks or random streams.
 *
 * Actor IDs on 'damage' represent the VICTIM, never a guessed perpetrator.
 * 'swing' is the audible attempted action; it never asserts contact.
 */
export const PHYSICAL_FEEDBACK_MAX_CUES = 24;
export const PHYSICAL_FEEDBACK_MAX_TICK_GAP = 5;
export const PHYSICAL_FEEDBACK_MAX_EVENT_SCAN = 96;
// Separate bounded public-HP observation window: action pose and event scans
// stay at 96, but a real injured victim must not disappear merely because
// other public units preceded it in a large snapshot. No additional effect
// instances, voices or cues may be admitted beyond their existing budgets.
export const PHYSICAL_FEEDBACK_MAX_DAMAGE_UNIT_SCAN = 256;
export const PHYSICAL_FEEDBACK_MAX_WARNING_MARKERS = 8;
export const PHYSICAL_FEEDBACK_DELAYS = Object.freeze({
  swing: .12, rangedRelease: .21, spellRelease: .29,
  wardenRelease: .23, verifiedMeleeImpact: .215
});
const PRIORITY = Object.freeze({
  'boss-warning-final': 8, 'boss-warning-rising': 7, 'threat-warning': 5,
  'warden-release': 7, 'defeat': 7, 'counter': 7,
  'interrupt': 6, 'opening': 6, 'damage-fatal': 6,
  'damage': 5, 'block': 5, 'boss-warning': 5,
  'spell-release': 3, 'ranged-release': 3, 'swing': 2,
  'guard': 2, 'evade': 2, 'cast-utility': 2, 'cast-unmatched': 1,
  'ranged-unmatched': 1
});
const ENVELOPE = Object.freeze({
  'boss-warning-final': {visual: 'warning',audio: 'boss-warning-final',duration:.32},
  'boss-warning-rising':{visual: 'warning',audio: 'boss-warning-rising',duration:.30},
  'boss-warning':       {visual: 'warning',audio: 'boss-warning',duration:.30},
  'threat-warning':     {visual: 'none',audio: 'threat-warning',duration:.24},
  'warden-release':     {visual: 'warden',audio: 'warden-release',duration:.38},
  'defeat':             {visual: 'outcome',audio: 'defeat',duration:.48},
  'counter':            {visual: 'counter',audio: 'counter',duration:.26},
  'interrupt':          {visual: 'interrupt',audio: 'interrupt',duration:.22},
  'opening':            {visual: 'opening',audio: 'recovery',duration:.34},
  'damage-fatal':       {visual: 'hit',audio: 'fatal-impact',duration:.30},
  'damage':             {visual: 'hit',audio: 'impact',duration:.23},
  'block':              {visual: 'block',audio: 'block',duration:.20},
  'spell-release':      {visual: 'cast',audio: 'spell-release',duration:.28},
  'ranged-release':     {visual: 'launch',audio: 'ranged-release',duration:.26},
  'swing':              {visual: 'trail',audio: 'whoosh',duration:.22},
  'guard':              {visual: 'utility',audio: 'guard',duration:.17},
  'evade':              {visual: 'evade',audio: 'evade',duration:.20},
  'cast-utility':       {visual: 'utility',audio: 'utility',duration:.22},
  'cast-unmatched':     {visual: 'none',audio: 'cast-dry',duration:.15},
  'ranged-unmatched':   {visual: 'none',audio: 'draw',duration:.12}
});
const validTick = v => Number.isSafeInteger(v) && v>=0;
const validScene = s => s && validTick(s.tick) && validTick(s.run) &&
 Number.isSafeInteger(s.floor) && s.floor>=1 && Array.isArray(s.units);
const validCoord = n => Number.isInteger(n) && n>=0 && n<256;
/**
 * Select a small, stable subset of ACTUAL public Warden danger cells.
 * Existing authoritative floor tiles still show the entire footprint.
 * This adds no cells or simulated danger, and never uses the boss location
 * as a substitute for an unknown threatened area.
 */
export function selectPhysicalWarningMarkers(cells){
 if(!Array.isArray(cells))return Object.freeze([]);
 const unique=new Map();
 for(const p of cells.slice(0,300)){
  if(!p||!validCoord(p.x)||!validCoord(p.z))continue;
  const key=p.x+':'+p.z;
  if(!unique.has(key))unique.set(key,{x:p.x,z:p.z});
 }
 const ordered=[...unique.values()].sort((a,b)=>a.z-b.z||a.x-b.x);
 const count=Math.min(PHYSICAL_FEEDBACK_MAX_WARNING_MARKERS,ordered.length);
 if(count===0)return Object.freeze([]);
 const selected=[];
 for(let i=0;i<count;i++){
  const p=ordered[Math.floor((i+.5)*ordered.length/count)];
  selected.push(Object.freeze({x:p.x,z:p.z}));
 }
 return Object.freeze(selected);
}
const validId = n => typeof n==='string' && n.length>0 && n.length<=128;
const sameIdUnit = (u,v) => u && v && u.kind===v.kind && u.faction===v.faction;
const point = u => u && validCoord(u.x) && validCoord(u.z) ? {x:u.x,z:u.z}:null;
/**
 * Lossless, bounded public danger-footprint identity for an existing
 * authoritative Warden warning. All valid cells count, not just the eight
 * sample markers D04 can paint. Coordinate ordering/duplicates do not change
 * identity. No guessed cells, game state mutation or cryptographic claims.
 */
export function canonicalPhysicalWarningFootprint(cells){
 if(!Array.isArray(cells)||cells.length<1||cells.length>300)return null;
 const unique=new Set();
 for(const c of cells){
  if(!point(c))continue;
  unique.add(c.z*256+c.x);
 }
 if(unique.size===0)return null;
 return [...unique].sort((a,b)=>a-b).join(',');
}
const sceneKey = s => `${s.run}:${s.floor}`;
const wasNewAction = (prior,u,oldTick,newTick) =>
 sameIdUnit(prior,u) && validTick(u.actionTick) && validTick(prior.actionTick) &&
 prior.actionTick!==u.actionTick && u.actionTick>oldTick &&
 u.actionTick<=newTick && u.actionTick>=newTick-PHYSICAL_FEEDBACK_MAX_TICK_GAP;
const positiveHealthDrop = (prior,u) => sameIdUnit(prior,u) &&
 Number.isInteger(prior.hp) && Number.isInteger(u.hp) &&
 Number.isInteger(prior.maxHp) && Number.isInteger(u.maxHp) &&
 prior.maxHp===u.maxHp && u.maxHp>0 &&
 prior.hp<=prior.maxHp && u.hp>=0 && u.hp<prior.hp;
function validBossWarning(w,s){
 // Authority grants three actual movement beats for the wide Sentinel NOVA
 // and Eclipse sweep; only the narrow RIFT_CROSS has a two-beat tell.
 // The old [1,2] gate silently erased the first public three-beat warning.
 // Never extend an unknown shape's or a rift's window from event prose.
 const horizon=w?.turnsUntilImpact;
 const witnessedWindow=horizon===1||horizon===2||
  horizon===3&&(w?.shape==='NOVA'||w?.shape==='ECLIPSE_SWEEP');
 return w?.warning===true && validTick(w.attackTick) &&
 witnessedWindow &&
 w.attackTick===s.tick+horizon &&
 Array.isArray(w.cells) && w.cells.length>0 && w.cells.length<=300 &&
 w.cells.some(c=>point(c));
}
const overlap = (a,b) => a && b && a.x===b.x && a.z===b.z;
/**
 * An anonymous event can corroborate a physical body contact only when
 * consecutive observed states BRACKET that exact authority tick. Across
 * missed ticks, later HP loss or movement cannot prove that contact's owner
 * or timing. Retain genuine event sound, but not a guessed world anchor.
 */
const observedEventAtAdjacentTick = (previous,next,eventTick) =>
 next.tick===eventTick && previous.tick+1===next.tick;
/** The only target a launch may display is the explicitly targeted, verified one. */
function verifiedAim(unit,snapshot,resolveContact){
 if(!validId(unit.targetId) || typeof resolveContact!=='function')return null;
 let resolved=null;
 try{resolved=resolveContact(unit,snapshot)}catch{return null}
 if(!resolved || resolved.targetId!==unit.targetId ||
  !Number.isFinite(resolved.distance) || resolved.distance<1 ||
  resolved.distance>4)return null;
 // An aim resolver certifies the requested ID/lane, not which of several
 // duplicated public bodies owns that ID. Fail closed even if only one of
 // the duplicates is alive or on the opposing side; selecting array-first
 // would make a visually targeted arrow/spell claim without unique identity.
 // This replaces the existing single target scan, with no new index or pool.
 let target=null;
 for(const candidate of snapshot.units){
  if(candidate?.id!==resolved.targetId)continue;
  if(target)return null;
  target=candidate;
 }
 if(!target||target.faction===unit.faction||
  !(target.hp>0||target.hp===0&&target.action==='hurt'&&
    target.actionTick===unit.actionTick)||
  !point(target)||!point(unit)||overlap(target,unit))return null;
 return target;
}
const cueId=(s,kind,tick,actorId,targetId)=>`${sceneKey(s)}:${tick}:${kind}:${actorId||'-'}:${targetId||'-'}`;
function immutableCue(s,kind,tick,{actorId=null,targetId=null,from=null,to=null,verified=false,
 delay=0,severity=0,proof='authority-action',detail=null}={}){
 if(!Object.hasOwn(PRIORITY,kind)||!validTick(tick))return null;
 const p=ENVELOPE[kind];
 return Object.freeze({
  id:cueId(s,kind,tick,actorId,targetId),sceneKey:sceneKey(s),tick,kind,
  priority:PRIORITY[kind],visual:p.visual,audio:p.audio,duration:p.duration,
  actorId,targetId,from:from?Object.freeze({...from}):null,
  to:to?Object.freeze({...to}):null,verified,delay:Math.max(0,Math.min(.5,delay)),
  severity:Math.max(0,Math.min(1,severity)),proof,
  detail:detail?Object.freeze({...detail}):null
 });
}
function fallbackDamageBeats(before,next){
 const beats=[];
 for(const u of next.units.slice(0,PHYSICAL_FEEDBACK_MAX_DAMAGE_UNIT_SCAN)){
  const prior=before.get(u?.id);
  if(!positiveHealthDrop(prior,u)||!point(u))continue;
  beats.push({id:u.id,kind:u.kind,faction:u.faction,damage:prior.hp-u.hp,
   maxHp:u.maxHp,fatal:u.hp===0,x:u.x,z:u.z});
 }
 // The fallback now supplies the D04 truth base even with an annotator;
 // retain the previous choreography's fatal/severity ordering before the
 // unchanged 18-injury ceiling. Never pick snapshot array order as priority.
 beats.sort((a,b)=>Number(b.fatal)-Number(a.fatal)||
  b.damage/b.maxHp-a.damage/a.maxHp||a.id.localeCompare(b.id,'en'));
 return beats.slice(0,18);
}
/**
 * No first-load replay. No cross-run attribution. Missed polls older than five
 * authority ticks cannot be made to look like frame-accurate physical contact.
 */
export function planPhysicalFeedback(previous,next,{
 resolveContact=()=>null,deriveDamageBeats=null,verifiedMeleeDelay=null,
 reducedMotion=false
}={}){
 if(!validScene(previous)||!validScene(next)||sceneKey(previous)!==sceneKey(next)||
  next.tick<=previous.tick)return [];
 const gap=next.tick-previous.tick;
 // Only this read-only identity index extends beyond the 96-unit action
 // window. Real HP deltas need the same prior/current IDs even when a large
 // roster places the injured body later in either snapshot. Max 256 entries.
 const oldUnits=new Map(previous.units.slice(0,PHYSICAL_FEEDBACK_MAX_DAMAGE_UNIT_SCAN)
  .filter(u=>validId(u?.id)).map(u=>[u.id,u]));
 const currentUnits=new Map(next.units.slice(0,PHYSICAL_FEEDBACK_MAX_DAMAGE_UNIT_SCAN)
  .filter(u=>validId(u?.id)).map(u=>[u.id,u]));
 const proposed=[],seen=new Set();
 const push=(kind,tick,fields)=>{
  const c=immutableCue(next,kind,tick,fields);
  if(!c||seen.has(c.id))return;
  seen.add(c.id);proposed.push(c);
 };
 const events=Array.isArray(next.events)?next.events.slice(0,PHYSICAL_FEEDBACK_MAX_EVENT_SCAN):[];
 for(const e of events){
  if(!e || !validTick(e.tick) || e.tick<=previous.tick || e.tick>next.tick ||
   e.tick<next.tick-PHYSICAL_FEEDBACK_MAX_TICK_GAP)continue;
  // The game event stream currently publishes {tick,kind,text}, NOT actor IDs.
  // Never parse the prose for ownership, victim, target or exact collision.
  switch(e.kind){
   case 'telegraph': {
    // 'telegraph' also describes Revenant and Cultist warnings. The public
    // event contains NO actor ID; never mislabel it as a Warden warning.
    push('threat-warning',e.tick,{verified:true,proof:'authority-event'});
    break;
   }
   case 'block': {
    // A public block event identifies neither defender nor attacker. Anchor a
    // shield contact ONLY if exactly one same-tick block occurred and exactly
    // one party defender demonstrably guarded AND lost HP at that tick.
    // Multiple guards, simultaneous blocks, or fully absorbed blows retain
    // the neutral sound without assigning an invented body or direction.
    const blockEvents=events.filter(x=>x?.kind==='block'&&x.tick===e.tick);
    const adjacent=observedEventAtAdjacentTick(previous,next,e.tick);
    const defenders=(adjacent?next.units.slice(0,96):[]).filter(u=>{
     const prior=oldUnits.get(u?.id);
     return validId(u?.id)&&u.faction==='party'&&u.action==='guard'&&
      u.guardTick===e.tick&&point(u)&&positiveHealthDrop(prior,u);
    });
    // The public block event does not identify a defender or a source.
    // Concurrent attacking enemies or another wounded body make a seemingly
    // unique guard/HP observation ambiguous: preserve neutral block audio,
    // but do NOT point a contact marker at a guessed actor.
    const candidate=blockEvents.length===1&&defenders.length===1?defenders[0]:null;
    const simultaneousThreats=candidate?next.units.slice(0,96).filter(u=>
     u?.faction!=='party'&&(u?.hp>0||oldUnits.get(u?.id)?.hp>0)&&
     (u.action==='attack'||u.action==='cast')&&u.actionTick===e.tick).length:0;
    const competingVictim=candidate&&next.units.slice(0,96).some(u=>
     u?.id!==candidate.id&&positiveHealthDrop(oldUnits.get(u?.id),u));
    const lone=simultaneousThreats>1||competingVictim?null:candidate;
    push('block',e.tick,{actorId:lone?.id??null,
     from:lone?point(lone):null,verified:true,
     proof:lone?'authority-block-unique-guarded-hp':'authority-event'});
    break;
   }
   case 'evade': {
    // The public kind also describes spells/breaches missing empty stone.
    // Event prose carries no trustworthy dodger or contact identity.
    const evadeEvents=events.filter(x=>x?.kind==='evade'&&x.tick===e.tick);
    if(evadeEvents.length!==1||
     !observedEventAtAdjacentTick(previous,next,e.tick))break;
    // A single mover with an unrelated empty-stone miss is not a dodge.
    // Reuse the existing spectator animation's legal, semantic evasion witness:
    // matching threat event, valid terrain, living one-cell step and phase.
    // Its event text validates escape semantics, NEVER an attacker identity.
    const witnessed=planAuthorityEvasions(previous,next);
    if(witnessed.length!==1)break;
    const lone=witnessed[0];
    push('evade',e.tick,{actorId:lone.id,
     from:lone.from,to:lone.to,
     verified:true,proof:'authority-event-and-observed-step'});
    break;
   }
   case 'interrupt':push('interrupt',e.tick,{verified:true,proof:'authority-event'});break;
   case 'opening': {
    // An anonymous opening event cannot locate a current Warden or prove
    // recovery after skipped authority ticks. Require the actual cast and
    // still-active recovery on the exact adjacent observed event tick.
    if(!observedEventAtAdjacentTick(previous,next,e.tick)||
       next.guardianWard===true)break;
    // The event carries no boss identity. Two living Wardens make even
    // one observed cast insufficient to assign its anonymous recovery cue.
    const livingWardens=next.units.slice(0,96).filter(u=>
     u?.kind==='warden'&&u?.faction==='enemy'&&u.hp>0);
    if(livingWardens.length!==1)break;
    const candidates=livingWardens.filter(u=>
     validId(u?.id)&&point(u)&&sameIdUnit(oldUnits.get(u.id),u)&&
     u.action==='cast'&&u.actionTick===e.tick&&
     validTick(u.recoveryUntilTick)&&u.recoveryUntilTick>=e.tick&&
     u.recoveryUntilTick<=e.tick+2);
    if(candidates.length!==1)break; // Do not select an arbitrary owner.
    const boss=candidates[0];
    // A real public snapshot exposes bossRecovery. If that field exists,
    // contradictory or sealed recovery cannot stage a physical opening.
    if(Object.hasOwn(next,'bossRecovery')&&
     (!next.bossRecovery||next.bossRecovery.remaining!==
      boss.recoveryUntilTick-next.tick+1))break;
    push('opening',e.tick,{actorId:boss.id,from:point(boss),
     verified:true,proof:'authority-opening-recovery-window'});break;
   }
   case 'counter': {
    // Anonymous counter prose cannot select array-first boss. Require a
    // unique Warden identity across both observed authority snapshots.
    // The real victim's HP loss may still receive independent damage audio.
    const priorWardens=previous.units.slice(0,96).filter(u=>
     u?.kind==='warden'&&u?.faction==='enemy'&&u.hp>0);
    const currentWardens=next.units.slice(0,96).filter(u=>
     u?.kind==='warden'&&u?.faction==='enemy');
    if(priorWardens.length!==1||currentWardens.length!==1)break;
    const prior=priorWardens[0],current=currentWardens[0];
    if(prior.id===current.id &&
     observedEventAtAdjacentTick(previous,next,e.tick) &&
     positiveHealthDrop(prior,current) &&
     validTick(prior.recoveryUntilTick) && prior.recoveryUntilTick>=e.tick)
     push('counter',e.tick,{targetId:current.id,to:point(current),
      severity:(prior.hp-current.hp)/current.maxHp,verified:true,
      proof:'authority-counter-and-HP'});
    break;
   }
   case 'defeat': push('defeat',e.tick,{verified:true,proof:'authority-event'});break;
   default:break;
  }
 }
 // The public bossWarning footprint is real, but carries NO Warden ID.
 // Never assign its glyph to the first live Warden in array order. Even a
 // single current Warden is not ownership evidence when the previously
 // observed boss was absent or different. A neutral sound preserves an
 // ambiguous public warning without forging its owner or warning history.
 const w=next.bossWarning,pw=previous.bossWarning;
 const liveWardens=next.units.slice(0,96).filter(u=>
  u?.kind==='warden'&&u.faction==='enemy'&&u.hp>0);
 if(liveWardens.length>0&&validBossWarning(w,next)&&
    (!pw||pw.attackTick!==w.attackTick||pw.turnsUntilImpact>w.turnsUntilImpact)){
  const priorWardens=previous.units.slice(0,96).filter(u=>
   u?.kind==='warden'&&u.faction==='enemy'&&u.hp>0);
  const boss=liveWardens.length===1&&priorWardens.length===1&&
   liveWardens[0].id===priorWardens[0].id&&validId(liveWardens[0].id)&&
   point(liveWardens[0])&&sameIdUnit(priorWardens[0],liveWardens[0])?
   liveWardens[0]:null;
  if(boss){
   push(w.turnsUntilImpact===1?'boss-warning-final':'boss-warning-rising',next.tick,{
    actorId:boss.id,from:point(boss),verified:true,proof:'authority-warning-window',
    detail:{shape:w.shape,attackTick:w.attackTick,
     cells:selectPhysicalWarningMarkers(w.cells),
     footprintKey:canonicalPhysicalWarningFootprint(w.cells)}
   });
  }else{
   // It remains a true authority warning, but no body-local authored
   // effect or owner-specific release retirement may be inferred.
   push('threat-warning',next.tick,{
    verified:true,proof:'authority-warning-unattributed'
   });
  }
 }
 // Real actions may RELEASE sound/weapon motion, never assert an injury.
 // Strictly require the actor to survive and to have a fresh, witnessed action.
 // A multi-tick observation cannot prove when a weapon passed, an arrow
 // launched, a spell released or a guard gesture occurred. Even if actionTick
 // equals the latest tick, the preceding animation/contact pose is missing.
 // Suppress late action foley/VFX rather than attach it to a later body pose.
 if(gap===1){
  for(const u of next.units.slice(0,96)){
   const prior=oldUnits.get(u?.id);
   if(!validId(u?.id)||u.hp<=0||!point(u)||
    !wasNewAction(prior,u,previous.tick,next.tick))continue;
   if(u.action==='guard'){
    push('guard',u.actionTick,{actorId:u.id,from:point(u),verified:true});continue;
   }
   if(u.action!=='attack'&&u.action!=='cast')continue;
   if(u.action==='cast' && u.kind==='warden'){
    push('warden-release',u.actionTick,{actorId:u.id,from:point(u),verified:true,
     delay:reducedMotion?0:PHYSICAL_FEEDBACK_DELAYS.wardenRelease});continue;
   }
   const utility=Array.isArray(next.events)&&next.events.some(e=>
    e?.tick===u.actionTick && (u.kind==='mystic'&&e.kind==='healing' ||
     u.kind==='ranger'&&e.kind==='disarm'));
   if(utility){
    push('cast-utility',u.actionTick,{actorId:u.id,from:point(u),verified:true});continue;
   }
   const target=verifiedAim(u,next,resolveContact);
   if(u.action==='attack' && ['vanguard','revenant','warden'].includes(u.kind)){
    push('swing',u.actionTick,{actorId:u.id,from:point(u),
     targetId:target?.id??null,to:target?point(target):null,
     verified:true,proof:'authority-attempt-not-hit',
     delay:reducedMotion?0:PHYSICAL_FEEDBACK_DELAYS.swing});
   }else if(u.action==='attack'&&u.kind==='ranger'){
    push(target?'ranged-release':'ranged-unmatched',u.actionTick,{
     actorId:u.id,from:point(u),targetId:target?.id??null,
     to:target?point(target):null,verified:!!target,
     delay:reducedMotion?0:(target?PHYSICAL_FEEDBACK_DELAYS.rangedRelease:0)});
   }else if(u.action==='cast'&&['mystic','cultist'].includes(u.kind)){
    push(target?'spell-release':'cast-unmatched',u.actionTick,{
     actorId:u.id,from:point(u),targetId:target?.id??null,
     to:target?point(target):null,verified:!!target,
     delay:reducedMotion?0:(target?PHYSICAL_FEEDBACK_DELAYS.spellRelease:0)});
   }
  }
 }
 if(gap===1){
  // Only adjacent observed authoritative ticks can localize a transient
  // injury to this position and submission frame. Across skipped ticks the
  // HP delta is real, but its contact time and position are unobserved:
  // render the updated health through the legacy state view, never invent
  // a late impact VFX or foley at a unit's final cell.
  // The authoritative HP delta is the only damage authorization; matched
  // incoming geometry may delay the cue but DOES NOT establish causation.
  // Adjacent PUBLIC HP transitions are the sole source of injury truth.
  // Optional legacy choreography can annotate an incoming lane, but its
  // failure, 64-unit cap, incomplete results or stale metadata must NEVER
  // erase an injury witnessed in the bounded D04 256-unit HP window.
  // The original 96-unit ACTION scan and 18-injury/24-total cue ceilings
  // remain unchanged, and the prior identity map is reused (no third map).
  const beats=fallbackDamageBeats(oldUnits,next);
  let annotations=null;
  if(typeof deriveDamageBeats==='function'){
   try{
    const derived=deriveDamageBeats(previous,next);
    if(Array.isArray(derived)){
     annotations=new Map();
     for(const candidate of derived.slice(0,18)){
      const u=currentUnits.get(candidate?.id),before=oldUnits.get(candidate?.id);
      if(!positiveHealthDrop(before,u)||!point(u)||
       candidate.kind!==u.kind||candidate.faction!==u.faction||
       candidate.damage!==before.hp-u.hp||candidate.maxHp!==u.maxHp||
       candidate.fatal!==(u.hp===0)||candidate.x!==u.x||candidate.z!==u.z)
       continue;
      if(!annotations.has(u.id))annotations.set(u.id,candidate);
     }
    }
   }catch{} // An unavailable optional pose annotator cannot revoke real HP loss.
  }
  for(const beat of beats){
   const u=currentUnits.get(beat.id),before=oldUnits.get(beat.id);
   const matched=annotations?.get(beat.id);
   let delay=0;
   if(!reducedMotion&&matched?.incoming&&typeof verifiedMeleeDelay==='function'){
    try{const requested=verifiedMeleeDelay(matched,next,{reducedMotion:false});
     if(requested===PHYSICAL_FEEDBACK_DELAYS.verifiedMeleeImpact)delay=requested;}catch{}
   }
   push(u.hp===0?'damage-fatal':'damage',next.tick,{
    targetId:u.id,to:point(u),severity:(before.hp-u.hp)/u.maxHp,
    delay,verified:true,proof:'observed-hp-drop',
    detail:{damage:before.hp-u.hp,maxHp:u.maxHp}
   });
  }
 }
 proposed.sort((a,b)=>b.priority-a.priority||a.tick-b.tick||a.id.localeCompare(b.id,'en'));
 return Object.freeze(proposed.slice(0,PHYSICAL_FEEDBACK_MAX_CUES));
}
