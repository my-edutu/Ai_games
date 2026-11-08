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
const validId = n => typeof n==='string' && n.length>0 && n.length<=128;
const sameIdUnit = (u,v) => u && v && u.kind===v.kind && u.faction===v.faction;
const point = u => u && validCoord(u.x) && validCoord(u.z) ? {x:u.x,z:u.z}:null;
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
 return w?.warning===true && validTick(w.attackTick) &&
 [1,2].includes(w.turnsUntilImpact) &&
 w.attackTick===s.tick+w.turnsUntilImpact &&
 Array.isArray(w.cells) && w.cells.length>0 && w.cells.length<=300 &&
 w.cells.some(c=>point(c));
}
const overlap = (a,b) => a && b && a.x===b.x && a.z===b.z;
/** The only target a launch may display is the explicitly targeted, verified one. */
function verifiedAim(unit,snapshot,resolveContact){
 if(!validId(unit.targetId) || typeof resolveContact!=='function')return null;
 let resolved=null;
 try{resolved=resolveContact(unit,snapshot)}catch{return null}
 if(!resolved || resolved.targetId!==unit.targetId ||
  !Number.isFinite(resolved.distance) || resolved.distance<1 ||
  resolved.distance>4)return null;
 const target=snapshot.units.find(u=>u?.id===resolved.targetId &&
  u.faction!==unit.faction && (u.hp>0 ||
  u.hp===0&&u.action==='hurt'&&u.actionTick===unit.actionTick));
 if(!target || !point(target) || !point(unit) || overlap(target,unit))return null;
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
function fallbackDamageBeats(previous,next){
 const before=new Map(previous.units.slice(0,96).filter(u=>validId(u?.id)).map(u=>[u.id,u]));
 const beats=[];
 for(const u of next.units.slice(0,96)){
  const prior=before.get(u?.id);
  if(!positiveHealthDrop(prior,u)||!point(u))continue;
  beats.push({id:u.id,kind:u.kind,faction:u.faction,damage:prior.hp-u.hp,
   maxHp:u.maxHp,fatal:u.hp===0,x:u.x,z:u.z});
 }
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
 const oldUnits=new Map(previous.units.slice(0,96).filter(u=>validId(u?.id)).map(u=>[u.id,u]));
 const currentUnits=new Map(next.units.slice(0,96).filter(u=>validId(u?.id)).map(u=>[u.id,u]));
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
   case 'block': push('block',e.tick,{verified:true,proof:'authority-event'});break;
   case 'evade': {
    // An evasive FOOTPRINT may be attached only to exactly one witnessed
    // cardinal, one-cell party displacement on this very event tick.
    const moved=next.units.filter(u=>{
     const b=oldUnits.get(u?.id);
     return b && u.faction==='party' && u.hp>0 && validCoord(u.x)&&validCoord(u.z)&&
      validCoord(b.x)&&validCoord(b.z) && u.actionTick===e.tick &&
      Math.abs(u.x-b.x)+Math.abs(u.z-b.z)===1;
    });
    const lone=moved.length===1?moved[0]:null;
    push('evade',e.tick,{actorId:lone?.id??null,
     from:lone?point(oldUnits.get(lone.id)):null,to:lone?point(lone):null,
     verified:true,proof:'authority-event'});break;
   }
   case 'interrupt':push('interrupt',e.tick,{verified:true,proof:'authority-event'});break;
   case 'opening': {
    const boss=next.units.find(u=>u?.kind==='warden'&&u.hp>0);
    push('opening',e.tick,{actorId:boss?.id??null,from:boss?point(boss):null,
     verified:true,proof:'authority-event'});break;
   }
   case 'counter': {
    const prior=previous.units.find(u=>u?.kind==='warden'),
     current=next.units.find(u=>u?.id===prior?.id&&u?.kind==='warden');
    if(positiveHealthDrop(prior,current) &&
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
 // Real multi-turn boss tell; the window belongs to actual cells and clock.
 const w=next.bossWarning,pw=previous.bossWarning;
 if(next.units.some(u=>u?.kind==='warden'&&u.hp>0)&&
    validBossWarning(w,next)&&
    (!pw||pw.attackTick!==w.attackTick||pw.turnsUntilImpact>w.turnsUntilImpact)){
  const boss=next.units.find(u=>u?.kind==='warden'&&u.hp>0);
  push(w.turnsUntilImpact===1?'boss-warning-final':'boss-warning-rising',next.tick,{
   actorId:boss.id,from:point(boss),verified:true,proof:'authority-warning-window',
   detail:{shape:w.shape,attackTick:w.attackTick}
  });
 }
 // Real actions may RELEASE sound/weapon motion, never assert an injury.
 // Strictly require the actor to survive and to have a fresh, witnessed action.
 if(gap<=PHYSICAL_FEEDBACK_MAX_TICK_GAP){
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
 if(gap<=PHYSICAL_FEEDBACK_MAX_TICK_GAP){
  // The authoritative HP delta is the only damage authorization; matched
  // incoming geometry may delay the cue but DOES NOT establish causation.
  let beats=null;
  try{beats=(typeof deriveDamageBeats==='function'?
   deriveDamageBeats(previous,next):fallbackDamageBeats(previous,next));}
  catch{beats=[]}
  if(Array.isArray(beats))for(const beat of beats.slice(0,18)){
   const u=currentUnits.get(beat?.id),before=oldUnits.get(beat?.id);
   if(!positiveHealthDrop(before,u)||!point(u))continue;
   let delay=0;
   if(!reducedMotion && beat?.incoming && typeof verifiedMeleeDelay==='function'){
    try{const requested=verifiedMeleeDelay(beat,next,{reducedMotion:false});
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
