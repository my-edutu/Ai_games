/**
 * Pure, authority-derived sound direction for the real 3D Dungeon spectator.
 * No audio nodes, wall clock, RNG, captions or mutable DungeonRuntime state.
 * Sound is optional; every critical result is also presented visibly in the HUD.
 */
export const MAX_SOUND_CUES=12;
const BASE_HZ=Object.freeze([55.0,65.41,58.27,49.0]);
const EVENT_KIND=Object.freeze({
 telegraph:'warning',opening:'opening',danger:'danger',breach:'breach',defeat:'defeat',loot:'reward',
 healing:'heal',kill:'kill',trap:'trap',disarm:'disarm',unseal:'unseal',
 guard:'guard',cover:'cover',evade:'evade',block:'block',interrupt:'opening'
});
const PRIORITY=Object.freeze({
 defeat:6,renewal:5,transition:5,warning:5,'warning-rising':4,'warning-final':5,unseal:5,boss:4,danger:4,
 opening:4,breach:4,cover:4,'cover-impact':5,'boss-fall':5,impact:3,weapon:3,ranged:3,magic:3,heal:3,kill:3,
 reward:2,trap:2,disarm:2,guard:1,block:1,evade:1
});
const finite=(n,defaultValue=0)=>Number.isFinite(n)?n:defaultValue;
const validUnit=u=>u&&typeof u.id==='string'&&u.id.length>0&&u.id.length<=128&&
 typeof u.kind==='string'&&Number.isFinite(u.hp)&&Number.isFinite(u.actionTick);
const validSnapshot=s=>s&&Number.isSafeInteger(s.tick)&&s.tick>=0&&
 Number.isSafeInteger(s.run)&&s.run>=0&&Number.isSafeInteger(s.floor)&&s.floor>=1;
const near=(a,b,range)=>Number.isFinite(a?.x)&&Number.isFinite(a?.z)&&
 Number.isFinite(b?.x)&&Number.isFinite(b?.z)&&Math.abs(a.x-b.x)+Math.abs(a.z-b.z)<=range;

/** Music state uses only public phase, survival and actual enemy positions. */
export function planSoundMood(snapshot){
 const floor=Number.isSafeInteger(snapshot?.floor)&&snapshot.floor>=1?snapshot.floor:1;
 const droneHz=BASE_HZ[(floor-1)%BASE_HZ.length],upperHz=droneHz*1.5;
 const units=Array.isArray(snapshot?.units)?snapshot.units.slice(0,96):[];
 const heroes=units.filter(u=>u?.faction==='party'&&u.hp>0);
 const boss=units.find(u=>u?.kind==='warden'&&u.hp>0);
 const endangered=heroes.some(u=>Number.isFinite(u.maxHp)&&u.maxHp>0&&u.hp/u.maxHp<=.3);
 const guardian=!!boss&&heroes.some(h=>near(h,boss,6));
 const defeated=snapshot?.phase==='defeat'||(heroes.length===0&&units.some(u=>u?.faction==='party'));
 const mood=defeated?'defeat':snapshot?.phase==='intermission'?'intermission':guardian?'guardian':endangered?'danger':'exploration';
 const urgency={exploration:.24,danger:.56,guardian:.88,intermission:.08,defeat:.12}[mood];
 return Object.freeze({floor,biome:(floor-1)%4,mood,urgency,droneHz,upperHz});
}
const cmp=(a,b)=>b.priority-a.priority||a.tick-b.tick||
 (a.kind<b.kind?-1:a.kind>b.kind?1:0)||
 (a.actorId<b.actorId?-1:a.actorId>b.actorId?1:0);
function make(kind,tick,actorId=''){
 return {kind,tick,priority:PRIORITY[kind],actorId};
}
/**
 * A snapshot pair provides the only valid temporal window. Lost polls can
 * still pick up the public event log, but repeated polls cannot repeat sounds.
 * An attack makes noise only when the renderer's existing grid/range/wall
 * contact planner has a valid target. No simulated projectiles or invented hits.
 */
export function planSoundCues(previous,snapshot,resolveContact=()=>null){
 if(!validSnapshot(previous)||!validSnapshot(snapshot)||!Array.isArray(snapshot.units))return [];
 if(snapshot.run<previous.run||snapshot.run===previous.run&&
   (snapshot.floor<previous.floor||snapshot.floor===previous.floor&&snapshot.tick<=previous.tick))return [];
 const changedRun=snapshot.run!==previous.run,changedFloor=snapshot.floor!==previous.floor;
 const cues=[],seen=new Set();
 const push=(kind,tick,actorId='')=>{
  if(!Object.hasOwn(PRIORITY,kind)||!Number.isSafeInteger(tick)||tick<0)return;
  const key=kind+'|'+tick+'|'+actorId;
  if(seen.has(key))return;seen.add(key);cues.push(make(kind,tick,actorId));
 };
 if(changedRun)push('renewal',snapshot.tick);
 else if(changedFloor)push('transition',snapshot.tick);
 const sameScene=!changedRun&&!changedFloor&&snapshot.tick>previous.tick;
 if(sameScene){
  // Original rising heartbeat on later TRUE Sentinel NOVA beats; no first
  // load, synthetic target or stale repeated-poll sound can trigger a cue.
  const impending=snapshot.bossWarning,previousTell=previous.bossWarning;
  const livingWarden=snapshot.units.some(u=>u?.kind==='warden'&&u.hp>0);
  if(livingWarden&&impending?.warning===true&&impending.shape==='NOVA'&&
    [1,2].includes(impending.turnsUntilImpact)&&
    Number.isSafeInteger(impending.attackTick)&&
    impending.attackTick===snapshot.tick+impending.turnsUntilImpact&&
    Array.isArray(impending.cells)&&impending.cells.length>0&&
    (!previousTell||previousTell.attackTick!==impending.attackTick||
      previousTell.turnsUntilImpact>impending.turnsUntilImpact))
   push(impending.turnsUntilImpact===1?'warning-final':'warning-rising',snapshot.tick);
  const events=Array.isArray(snapshot.events)?snapshot.events.slice(0,256):[];
  for(const e of events){
   if(!e||!Number.isSafeInteger(e.tick)||e.tick<=previous.tick||e.tick>snapshot.tick)continue;
   // A floor label in the recent event log is not itself a new floor.
   // Only the real authoritative kill of a Warden earns the boss resolution.
   // Ordinary mobs do not get a false triumph or duplicated kill cue.
   if(e.kind==='kill'&&typeof e.text==='string'&&e.text.startsWith('WARDEN DEFEATED'))
    push('boss-fall',e.tick);
   else {
    const kind=EVENT_KIND[e.kind];
    if(kind)push(kind,e.tick);
   }
   if(e.kind==='cover'&&typeof e.text==='string'&&e.text.startsWith('Ashen Vanguard intercepted ')){
    const older=Array.isArray(previous.units)?previous.units.find(u=>u.id==='vanguard'):null;
    const newer=snapshot.units.find(u=>u.id==='vanguard');
    if(older&&newer&&Number.isFinite(older.hp)&&Number.isFinite(newer.hp)&&older.hp>newer.hp)
     push('cover-impact',e.tick,'vanguard');
   }
  }
  const old=new Map((Array.isArray(previous.units)?previous.units:[]).slice(0,96)
   .filter(validUnit).map(u=>[u.id,u]));
  for(const u of snapshot.units.slice(0,96)){
   if(!validUnit(u)||(u.hp<=0&&u.action!=='hurt'))continue;
   const prior=old.get(u.id);
   if(!prior||prior.actionTick===u.actionTick||u.actionTick<previous.tick||u.actionTick>snapshot.tick)continue;
   switch(u.action){
    case 'attack':{
     const target=typeof resolveContact==='function'?resolveContact(u,snapshot):null;
     if(!target||typeof target.targetId!=='string'||!target.targetId||
      !Number.isFinite(target.distance)||target.distance<1||target.distance>4)break;
     push(u.kind==='ranger'?'ranged':u.kind==='mystic'?'magic':'weapon',u.actionTick,u.id);break;
    }
    case 'cast':{
     if(u.kind==='warden'){push('boss',u.actionTick,u.id);break;}
     // Healing/disarm do not become hostile magic simply because a foe exists.
     if(snapshot.events?.some(e=>e.tick===u.actionTick&&
      (e.kind==='healing'&&u.kind==='mystic'||e.kind==='disarm'&&u.kind==='ranger')))break;
     const target=typeof resolveContact==='function'?resolveContact(u,snapshot):null;
     if(target?.targetId&&target.distance>=1&&target.distance<=3)push('magic',u.actionTick,u.id);
     break;
    }
    case 'hurt':if(Number.isFinite(prior.hp)&&prior.hp>u.hp)push('impact',u.actionTick,u.id);break;
    case 'guard':push('guard',u.actionTick,u.id);break;
   }
  }
 }
 cues.sort(cmp);
 return cues.slice(0,MAX_SOUND_CUES);
}
