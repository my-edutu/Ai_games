import {NamedRng, type RngSnapshot} from '../../../packages/seeded-rng/src/index';
import {checksum} from '../../../packages/replay/src/index';

export const DUNGEON_VERSION='0.6.0';
export const MAP_SIZE=19;
export type UnitKind='vanguard'|'ranger'|'mystic'|'revenant'|'cultist'|'warden';
export type Faction='party'|'enemy';
export interface Unit {id:string;kind:UnitKind;faction:Faction;x:number;z:number;hp:number;maxHp:number;attack:number;cooldown:number;action?:'idle'|'move'|'attack'|'cast'|'hurt'|'guard';actionTick?:number;guardTick?:number;targetId?:string;recoveryUntilTick?:number;focus?:number;maxFocus?:number;channelUntilTick?:number;channelTargetId?:string;channelX?:number;channelZ?:number;breachUntilTick?:number;breachTargetId?:string;breachX?:number;breachZ?:number}
export interface DungeonEvent {tick:number;kind:string;text:string}
export interface DungeonTrap{id:string;x:number;z:number;kind:'ember'|'arcane';active:boolean;cooldown:number;disarmed:boolean;triggers:number}
export interface DungeonState {schemaVersion:1;rulesVersion?:2;tick:number;floor:number;run:number;phase:'exploring'|'intermission';intermission:number;theme:string;map:string[];exit:{x:number;z:number};units:Unit[];relics:{x:number;z:number}[];traps:DungeonTrap[];kills:number;gold:number;level:number;intent:string;events:DungeonEvent[]}
export interface DungeonSave {version:string;seed:string;rng:RngSnapshot;state:DungeonState;signature:string}
export type WardenPhase='SENTINEL'|'RUPTURE'|'ECLIPSE'|'VANQUISHED';
export function wardenPhase(boss?:Pick<Unit,'hp'|'maxHp'>):WardenPhase{
 if(!boss||boss.hp<=0)return 'VANQUISHED';
 const fraction=boss.hp/boss.maxHp;
 return fraction>.65?'SENTINEL':fraction>.30?'RUPTURE':'ECLIPSE';
}
/** The Warden's first-phase barrier is paid for by living defenders, never a hidden timer. */
/** The last-act Warden hunts an exposed living backliner when the route is
 * genuinely close. Distance remains primary: he cannot magically target a
 * remote healer or skip an adjacent defender. No seeded randomness.
 */
export function planWardenHuntTarget(s:Pick<DungeonState,'units'>,boss:Unit):Unit|null{
 if(!s||!Array.isArray(s.units)||!boss||boss.kind!=='warden'||boss.hp<=0)return null;
 const final=wardenPhase(boss)==='ECLIPSE';
 const pressure=(hero:Unit)=>dist(boss,hero)*12+
  (final&&hero.kind==='vanguard'?9:0)+
  (final?Math.floor(6*hero.hp/hero.maxHp):0);
 return s.units.filter(u=>u.faction==='party'&&u.hp>0)
  .sort((a,b)=>pressure(a)-pressure(b)||a.id.localeCompare(b.id))[0]??null;
}
export function wardenSealActive(s:Pick<DungeonState,'units'>):boolean {
 const guardian=s.units.find(u=>u.kind==='warden'&&u.hp>0);
 return Boolean(guardian&&wardenPhase(guardian)==='SENTINEL'&&s.units.some(u=>u.faction==='enemy'&&u.kind!=='warden'&&u.hp>0));
}
export function damageThroughWardenSeal(s:DungeonState,target:Unit,raw:number):number {
 if(target.kind!=='warden')return raw;
 if(wardenSealActive(s))return Math.max(1,Math.ceil(raw*.24));
 return wardenPhase(target)==='SENTINEL'?Math.max(1,Math.ceil(raw*.7)):raw;
}
/** Unsealed Sentinel/Rupture recover for one real turn; Eclipse keeps two. Each
 * phase has at least one lawful pursuit/contact beat before the next warning.
 * This optional saved field is written only by the genuine combat step; no
 * cinematic timer, guessed target, or generated recovery event grants damage.
 */
export const WARDEN_COUNTER_MULTIPLIER=1.4;
/** Three telegraph beats and two actual recovery beats leave a real, bounded pursuit/counterplay window.
 * The previous four-beat final loop had zero usable Warden pursuit ticks: it kited forever.
 * This cadence is shared by the authoritative strike planner and the actual enemy AI.
 */
export const WARDEN_ECLIPSE_INTERVAL=9;
/** Actual earned shelter between deeper floors becomes progressively scarce. A floor
 * may restore wounded and fallen companions, but cannot erase attrition forever.
 * The amount is fixed by depth (never by clock, renderer or random draws). */
export function planDungeonRespite(nextFloor:number):number{
 if(!Number.isSafeInteger(nextFloor)||nextFloor<2)return 0;
 return Math.max(6,Math.ceil(26/Math.ceil(nextFloor/2)));
}
/** A genuinely earned, optional use for previously score-only gold:
 * once at each real cleared portal, a gravely weakened ally can receive
 * medicine purchased with spoils actually held by the squad. The decision
 * is pure, deterministic, never grants money, and never converts spectator
 * interaction into combat authority. Former signed runs keep all their gold.
 */
export const EXPEDITION_MEDICINE_COST=60;
export const EXPEDITION_MEDICINE_HEAL=22;
export function planExpeditionProvision(
 s:Pick<DungeonState,'rulesVersion'|'floor'|'gold'|'units'>
):{recipientId:string;goldCost:number;heal:number}|null{
 if(!s||s.rulesVersion!==2||!Number.isSafeInteger(s.floor)||s.floor<2||
  !Number.isSafeInteger(s.gold)||s.gold<EXPEDITION_MEDICINE_COST||
  !Array.isArray(s.units))return null;
 const candidates=s.units.filter(u=>u.faction==='party'&&
   Number.isSafeInteger(u.hp)&&Number.isSafeInteger(u.maxHp)&&
   u.maxHp>0&&u.hp>0&&u.hp<=Math.floor(u.maxHp*.55)&&
   u.maxHp-u.hp>=12)
  .sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp||a.id.localeCompare(b.id));
 const patient=candidates[0];
 return patient?{recipientId:patient.id,goldCost:EXPEDITION_MEDICINE_COST,
  heal:Math.min(EXPEDITION_MEDICINE_HEAL,patient.maxHp-patient.hp)}:null;
}
export function planWardenRecovery(s:Pick<DungeonState,'tick'|'units'>,boss?:Unit){
 const until=boss?.recoveryUntilTick;
 if(!boss||boss.kind!=='warden'||boss.hp<=0||!Number.isSafeInteger(s?.tick)||
  typeof until!=='number'||!Number.isSafeInteger(until)||until<s.tick||until>s.tick+2||
  wardenSealActive(s))return null;
 return {remaining:until-s.tick+1,damageMultiplier:WARDEN_COUNTER_MULTIPLIER};
}

/** The exact deterministic floor tiles struck by the Warden's next attack.
 * Presentation renders this same footprint; it cannot invent danger tiles.
 * Attack direction is locked from the warning tick through impact without a
 * new save field, RNG stream, or external service.
 */
export type WardenStrikeShape='NOVA'|'RIFT_CROSS'|'ECLIPSE_SWEEP';
export interface WardenStrike {phase:WardenPhase;shape:WardenStrikeShape;axis:'NORTH_SOUTH'|'EAST_WEST';attackTick:number;turnsUntilImpact:number;warning:boolean;cells:{x:number;z:number}[]}
export function planWardenStrike(s:Pick<DungeonState,'map'|'tick'>,boss:Unit):WardenStrike|null{
 if(boss.kind!=='warden'||boss.hp<=0)return null;
 const phase=wardenPhase(boss),interval=phase==='ECLIPSE'?WARDEN_ECLIPSE_INTERVAL:6;
 const attackTick=Math.ceil(s.tick/interval)*interval;
 const axis=Math.floor(attackTick/interval)%2===0?'NORTH_SOUTH':'EAST_WEST';
 const shape:WardenStrikeShape=phase==='SENTINEL'?'NOVA':phase==='RUPTURE'?'RIFT_CROSS':'ECLIPSE_SWEEP';
 // The final Eclipse is a three-wide advancing stone curtain. It costs the
 // party at least two lawful footsteps to leave the central lane; the fixed
 // three-beat tell preserves the ability to dodge, guard, or counter. It uses
 // the existing honest tiles, combat damage and zero additional state fields.
 const reach=shape==='NOVA'?3:4,cells:{x:number;z:number}[]=[];
 for(let dz=-reach;dz<=reach;dz++)for(let dx=-reach;dx<=reach;dx++){
  const x=boss.x+dx,z=boss.z+dz;
  if(!walkable(s.map,x,z))continue;
  const marked=shape==='NOVA'?Math.abs(dx)+Math.abs(dz)<=3:
   shape==='RIFT_CROSS'?dx===0||dz===0:
   axis==='NORTH_SOUTH'?Math.abs(dx)<=1:Math.abs(dz)<=1;
  if(marked)cells.push({x,z});
 }
 const turnsUntilImpact=attackTick-s.tick;
 // The wide Sentinel nova takes three *real* movement beats to escape from melee.
 // Narrow Rupture rifts retain two beats; the widened final sweep needs three. The boss cannot relocate the
 // footprint during this warning interval. All tiles remain authoritative.
 const warningTurns=shape==='RIFT_CROSS'?2:3;
 return {phase,shape,axis,attackTick,turnsUntilImpact,
  warning:turnsUntilImpact>0&&turnsUntilImpact<=warningTurns,cells};
}

/**
 * A Warden threat is not fair counterplay when a melee hero receives only
 * one step to clear a three-tile nova. This bounded, deterministic search
 * chooses the first lawful step of a complete path to an ACTUALLY safe tile
 * before the recorded impact. It never grants extra moves, invulnerability,
 * stamina or a synthetic target. Real occupied cells, walls and traps stop it.
 * A null result means the hero must guard if impact is imminent.
 */
export function planWardenEvasionStep(
 s:Pick<DungeonState,'map'|'units'|'traps'|'tick'>,hero:Unit,strike:WardenStrike
):{x:number;z:number}|null{
 if(!s||!hero||hero.hp<=0||hero.faction!=='party'||!strike?.warning||
  !Array.isArray(s.map)||!Array.isArray(s.units)||!Array.isArray(s.traps)||
  !Number.isSafeInteger(s.tick)||!Number.isSafeInteger(strike.attackTick))return null;
 const remaining=strike.attackTick-s.tick;
 if(remaining<1||remaining>3||!walkable(s.map,hero.x,hero.z))return null;
 const marked=new Set(strike.cells.map(p=>key(p.x,p.z)));
 if(!marked.has(key(hero.x,hero.z)))return null;
 const occupied=new Set(s.units.filter(u=>u.hp>0&&u.id!==hero.id).map(u=>key(u.x,u.z)));
 const traps=new Set(s.traps.filter(t=>t.active&&!t.disarmed).map(t=>key(t.x,t.z)));
 // A genuine elite may have locked this fighter's earlier tile before the
 // Warden's overlapping threat. Preserve a future-safe route, rather than
 // retreating straight back into a saved incoming hex or shield-break.
 // Only the actual targeted fighter and live enemy can create that risk.
 const otherLocked=new Set<number>();
 for(const foe of s.units.slice(0,18)){
  if(foe.hp<=0||foe.faction!=='enemy')continue;
  const hex=foe.kind==='cultist',breach=foe.kind==='revenant';
  if(!hex&&!breach)continue;
  const due=hex?foe.channelUntilTick:foe.breachUntilTick;
  const victim=hex?foe.channelTargetId:foe.breachTargetId;
  const x=hex?foe.channelX:foe.breachX,z=hex?foe.channelZ:foe.breachZ;
  if(victim!==hero.id||typeof due!=='number'||!Number.isSafeInteger(due)||
   due<s.tick||due>strike.attackTick||
   typeof x!=='number'||typeof z!=='number'||
   !Number.isInteger(x)||!Number.isInteger(z)||!walkable(s.map,x,z))continue;
  otherLocked.add(key(x,z));
 }
 // Breadth-first search finds the shortest genuine turn sequence, and stable
 // row/column tie-breaks make every restored run choose the same legal feet.
 const nodes=[{x:hero.x,z:hero.z,steps:0,first:null as {x:number;z:number}|null}];
 const seen=new Set<number>([key(hero.x,hero.z)]);
 const candidates:{first:{x:number;z:number};steps:number;final:{x:number;z:number}}[]=[];
 for(let i=0;i<nodes.length;i++){
  const node=nodes[i];
  if(node.steps>0&&!marked.has(key(node.x,node.z))&&node.first)
   candidates.push({first:node.first,steps:node.steps,final:{x:node.x,z:node.z}});
  if(node.steps===remaining)continue;
  for(const [dx,dz] of DIRS){
   const x=node.x+dx,z=node.z+dz,k=key(x,z);
   if(seen.has(k)||!walkable(s.map,x,z)||occupied.has(k)||traps.has(k)||otherLocked.has(k))continue;
   seen.add(k);nodes.push({x,z,steps:node.steps+1,first:node.first??{x,z}});
  }
 }
 if(!candidates.length)return null;
 // Preserve the post-dodge counter opportunity: favour proximity to the
 // genuine boss once safely outside the attack, not an arbitrary retreat.
 const boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
 // Among equally short REAL escapes, favour an unobstructed lawful ranger
 // or mystic counter lane over a flank that immediately strands the party.
 // Movement still consumes the same real tiles before any actual strike.
 const counterLane=(p:{x:number;z:number})=>{
  if(!boss)return 1;
  const range=hero.kind==='ranger'?4:hero.kind==='mystic'?3:1;
  const distance=dist(p,boss);
  return distance>=1&&distance<=range&&
   clearTacticalLane(s,p,boss,hero.id)?0:1;
 };
 candidates.sort((a,b)=>a.steps-b.steps||
  counterLane(a.final)-counterLane(b.final)||
  (boss?dist(a.final,boss)-dist(b.final,boss):0)||
  a.final.z-b.final.z||a.final.x-b.final.x||
  a.first.z-b.first.z||a.first.x-b.first.x);
 return candidates[0].first;
}

const THEMES=['THE SUNKEN CRYPT','THE EMBER CATHEDRAL','THE OBSIDIAN VAULT','THE HOLLOW SANCTUM'];
const DIRS=[[1,0],[0,1],[-1,0],[0,-1]] as const;
const inside=(x:number,z:number)=>x>=0&&z>=0&&x<MAP_SIZE&&z<MAP_SIZE;
const walkable=(map:string[],x:number,z:number)=>inside(x,z)&&map[z][x]==='.';
const dist=(a:{x:number;z:number},b:{x:number;z:number})=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
const key=(x:number,z:number)=>z*MAP_SIZE+x;
const clone=<T>(x:T):T=>structuredClone(x);
function push(state:DungeonState,kind:string,text:string){state.events.push({tick:state.tick,kind,text});if(state.events.length>9)state.events.shift()}
function distances(map:string[],from:{x:number;z:number}) {
 const d=new Map<number,number>([[key(from.x,from.z),0]]),queue=[from];
 for(let i=0;i<queue.length;i++){const c=queue[i],n=d.get(key(c.x,c.z))!;
  for(const [dx,dz] of DIRS){const x=c.x+dx,z=c.z+dz,k=key(x,z);
   if(walkable(map,x,z)&&!d.has(k)){d.set(k,n+1);queue.push({x,z})}
  }
 }return d;
}
export function shortestPath(map:string[],from:{x:number;z:number},to:{x:number;z:number}) {
 if(!walkable(map,from.x,from.z)||!walkable(map,to.x,to.z))return [];
 const back=new Map<number,number>(),start=key(from.x,from.z),end=key(to.x,to.z),queue=[from],seen=new Set<number>([start]);
 for(let i=0;i<queue.length;i++){const c=queue[i];if(key(c.x,c.z)===end)break;
  for(const [dx,dz] of DIRS){const x=c.x+dx,z=c.z+dz,k=key(x,z);
   if(walkable(map,x,z)&&!seen.has(k)){seen.add(k);back.set(k,key(c.x,c.z));queue.push({x,z})}
  }
 }if(!seen.has(end))return [];
 const path:{x:number;z:number}[]=[];let k=end;
 while(k!==start){path.unshift({x:k%MAP_SIZE,z:Math.floor(k/MAP_SIZE)});k=back.get(k)!}
 return path;
}
// A contact lane is real only on an unobstructed grid axis.
function clearCombatLane(map:string[],a:{x:number;z:number},b:{x:number;z:number}){
 if(a.x!==b.x&&a.z!==b.z)return false;
 const dx=Math.sign(b.x-a.x),dz=Math.sign(b.z-a.z);
 for(let i=1;i<dist(a,b);i++)if(!walkable(map,a.x+dx*i,a.z+dz*i))return false;
 return true;
}
/** Real line of fire cannot pass through living friends or foes either.
 * World walls and actor bodies are both authoritative, never VFX guesses.
 * Its one-dimensional scan is capped by the fixed 19-cell map width.
 */
function clearTacticalLane(s:Pick<DungeonState,'map'|'units'>,
 from:{x:number;z:number},to:{x:number;z:number},sourceId:string){
 if(!clearCombatLane(s.map,from,to))return false;
 const distance=dist(from,to),dx=Math.sign(to.x-from.x),dz=Math.sign(to.z-from.z);
 for(let i=1;i<distance;i++){
  const x=from.x+dx*i,z=from.z+dz*i;
  if(s.units.some(u=>u.hp>0&&u.id!==sourceId&&u.x===x&&u.z===z))return false;
 }
 return true;
}
/** The Starweaver can heal herself, or a living teammate within a real
 * unobstructed three-cell channel. This rule consumes the same authoritative
 * line-of-sight and body positions as tactical spell targeting. Neither walls
 * nor distance may be bypassed by presentation-only action cues.
 */
export const MYSTIC_HEAL_RANGE=3;
export function planMysticHealingLane(
 s:Pick<DungeonState,'map'|'units'>,healer:Unit,patient:Unit
):boolean{
 if(!s||!Array.isArray(s.map)||!Array.isArray(s.units)||
  healer?.kind!=='mystic'||healer.faction!=='party'||healer.hp<=0||
  patient?.faction!=='party'||patient.hp<=0||
  !walkable(s.map,healer.x,healer.z)||!walkable(s.map,patient.x,patient.z))return false;
 return healer.id===patient.id||
  (dist(healer,patient)<=MYSTIC_HEAL_RANGE&&
   clearTacticalLane(s,healer,patient,healer.id));
}
// Each ranged hero searches no more than 81 candidate tiles with bounded BFS.
function approachFiringLane(s:DungeonState,hero:Unit,enemy:Unit,range:number){
 if(range<=1)return shortestPath(s.map,hero,enemy);
 let best:{route:{x:number;z:number}[];score:number;x:number;z:number}|null=null;
 for(let z=Math.max(1,enemy.z-range);z<Math.min(MAP_SIZE-1,enemy.z+range+1);z++)
  for(let x=Math.max(1,enemy.x-range);x<Math.min(MAP_SIZE-1,enemy.x+range+1);x++){
   const p={x,z},d=dist(p,enemy);
   if(d<1||d>range||!walkable(s.map,x,z)||!clearCombatLane(s.map,p,enemy))continue;
   if(s.units.some(u=>u.hp>0&&u.id!==hero.id&&u.x===x&&u.z===z))continue;
   const route=shortestPath(s.map,hero,p);
   if(!route.length)continue;
   const hazard=s.traps.some(t=>t.active&&!t.disarmed&&t.x===x&&t.z===z);
   const ideal=hero.kind==='ranger'?3:2;
   const score=route.length*30+Math.abs(d-ideal)*3+(hazard?24:0);
   if(best===null||score<best.score||(score===best.score&&(z<best.z||(z===best.z&&x<best.x))))best={route,score,x,z};
  }
 return best?.route??shortestPath(s.map,hero,enemy);
}
/**
 * The oathbound shadow caster can step out of blade range into a legal clear
 * firing lane instead of blindly exchanging melee blows. Deterministic,
 * four-neighbour, bounded and entirely sourced from authoritative state.
 */
function cultistRetreat(s:DungeonState,caster:Unit,hero:Unit){
 if(dist(caster,hero)!==1)return null;
 const escapes=DIRS.map(([dx,dz])=>({x:caster.x+dx,z:caster.z+dz}))
  .filter(p=>walkable(s.map,p.x,p.z)&&dist(p,hero)>=2&&dist(p,hero)<=3)
  .filter(p=>!s.units.some(u=>u.hp>0&&u.id!==caster.id&&u.x===p.x&&u.z===p.z))
  .filter(p=>!s.traps.some(t=>t.active&&!t.disarmed&&t.x===p.x&&t.z===p.z))
  .map(p=>({p,clear:clearCombatLane(s.map,p,hero)}))
  .sort((a,b)=>Number(b.clear)-Number(a.clear)||a.p.z-b.p.z||a.p.x-b.p.x);
 return escapes[0]?.p??null;
}


/**
 * Real imminent channel interruption opportunities, ranked deterministically.
 * Only existing enemy cast coordinates locked to a living ally still standing
 * on that tile can change an autonomous hero's target priority.
 */
export function planThreatInterceptions(s:Pick<DungeonState,'tick'|'units'>,hero:Unit):Unit[]{
 if(!s||!Number.isSafeInteger(s.tick)||!Array.isArray(s.units)||
    !hero||hero.faction!=='party'||hero.hp<=0)return [];
 const allies=new Map(s.units.filter(u=>u.faction==='party'&&u.hp>0&&
    Number.isFinite(u.maxHp)&&u.maxHp>0).map(u=>[u.id,u]));
 const found:{foe:Unit;remaining:number;vulnerability:number;distance:number}[]=[];
 for(const foe of s.units){
  if(foe.hp<=0||foe.faction!=='enemy'||
     (foe.kind!=='cultist'&&foe.kind!=='revenant'))continue;
  const hex=foe.kind==='cultist';
  const due=hex?foe.channelUntilTick:foe.breachUntilTick;
  const targetId=hex?foe.channelTargetId:foe.breachTargetId;
  const x=hex?foe.channelX:foe.breachX,z=hex?foe.channelZ:foe.breachZ;
  if(typeof due!=='number'||!Number.isSafeInteger(due)||due<s.tick||due>s.tick+1||
     typeof targetId!=='string')continue;
  const ally=allies.get(targetId);
  if(!ally||!Number.isInteger(x)||!Number.isInteger(z)||
    ally.x!==x||ally.z!==z)continue;
  found.push({foe,remaining:due-s.tick,vulnerability:ally.hp/ally.maxHp,
   distance:dist(hero,foe)});
 }
 return found.sort((a,b)=>a.remaining-b.remaining||
   a.vulnerability-b.vulnerability||a.distance-b.distance||
   a.foe.id.localeCompare(b.foe.id)).map(item=>item.foe);
}

/**
 * Deterministic physical squad and enemy footwork on the real dungeon grid.
 * Actors cannot traverse occupied living cells. Ranged agents choose actual
 * unobstructed firing positions, while warriors close for legal contact.
 * No extra RNG, teleport, custom save fields, or presentation-only cheating.
 */
export type TacticalMode='engage'|'escort'|'exit';
type TacticalCell={x:number;z:number};
export function planTacticalStep(
 s:Pick<DungeonState,'map'|'units'|'traps'|'tick'>,actor:Unit,goal:TacticalCell,
 mode:TacticalMode='engage'
):TacticalCell|null{
 if(!s||!actor||!goal||!Array.isArray(s.map)||!Array.isArray(s.units)||
  !Array.isArray(s.traps)||!walkable(s.map,actor.x,actor.z)||
  !walkable(s.map,goal.x,goal.z)||!['engage','escort','exit'].includes(mode))return null;
 const occupied=new Set(s.units.filter(u=>u.hp>0&&u.id!==actor.id).map(u=>key(u.x,u.z)));
 const reach=mode==='escort'?(actor.kind==='ranger'?3:2):
  actor.kind==='ranger'?4:actor.kind==='mystic'||actor.kind==='cultist'?3:1;
 const ideal=mode==='escort'?(actor.kind==='ranger'?2:1):
  actor.kind==='ranger'?3:actor.kind==='mystic'||actor.kind==='cultist'?2:1;
 const inPosition=(p:TacticalCell)=>{
  const d=dist(p,goal);
  return mode==='exit'?d===0:mode==='escort'?d>=1&&d<=reach:
   d>=1&&d<=reach&&clearTacticalLane(s,p,goal,actor.id);
 };
 const boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
 const warning=boss?planWardenStrike(s,boss):null;
 const marked=new Set((warning?.warning?warning.cells:[]).map(p=>key(p.x,p.z)));
 // A hero who has paid real steps to escape must not wander BACK onto
 // advertised danger while searching for a new attack lane. This applies
 // only to already-safe party members near the boss; actors still inside a
 // threat can traverse marked tiles to reach the actual clear stone.
 const preserveSafeFlank=actor.faction==='party'&&warning?.warning===true&&
  Boolean(boss)&&dist(actor,boss!)<=5&&!marked.has(key(actor.x,actor.z));
 const traps=new Set(s.traps.filter(t=>t.active&&!t.disarmed).map(t=>key(t.x,t.z)));
 const risk=(p:TacticalCell)=>{
  const k=key(p.x,p.z);
  let value=(marked.has(k)?150:0)+(traps.has(k)?90:0);
  if(actor.faction==='party'&&actor.kind!=='vanguard'&&mode==='engage')
   for(const foe of s.units)if(foe.faction==='enemy'&&foe.hp>0&&dist(p,foe)<=1)value+=26;
  return value;
 };
 if(inPosition(actor)&&risk(actor)===0)return null;
 const toGoal=distances(s.map,goal);
 const queue:{p:TacticalCell;first:TacticalCell|null;steps:number}[]=[
  {p:{x:actor.x,z:actor.z},first:null,steps:0}];
 const visited=new Set([key(actor.x,actor.z)]);
 type Candidate={first:TacticalCell|null;score:number;x:number;z:number};
 let best:Candidate|null=null,fallback:Candidate|null=null;
 const prefer=(candidate:Candidate,current:Candidate|null)=>!current||
  candidate.score<current.score||
  candidate.score===current.score&&(candidate.z<current.z||
   candidate.z===current.z&&candidate.x<current.x);
 // A map has exactly 19x19 grid cells: bounded no matter how it loops.
 for(let i=0;i<queue.length&&i<MAP_SIZE*MAP_SIZE;i++){
  const {p,first,steps}=queue[i],d=dist(p,goal),danger=risk(p);
  const remaining=toGoal.get(key(p.x,p.z))??MAP_SIZE*MAP_SIZE;
  const candidateFallback={first,score:remaining*30+steps*4+danger,x:p.x,z:p.z};
  if(prefer(candidateFallback,fallback))fallback=candidateFallback;
  if(inPosition(p)){
   const candidate={first,score:steps*36+Math.abs(d-ideal)*8+danger,x:p.x,z:p.z};
   if(prefer(candidate,best))best=candidate;
  }
  for(const [dx,dz] of DIRS){
   const next={x:p.x+dx,z:p.z+dz},k=key(next.x,next.z);
   if(!walkable(s.map,next.x,next.z)||visited.has(k)||occupied.has(k)||
   (preserveSafeFlank&&marked.has(k)))continue;
   visited.add(k);
   queue.push({p:next,first:first??next,steps:steps+1});
  }
 }
 if(best)return best.first;
 return fallback?.first??null;
}
/**
 * New-rule expedition coordination: a front-line leader must not be trapped
 * behind a support ally in an authentic one-cell hallway. Only the ACTUAL
 * first tile of the leader's walkable route may request right-of-way, after
 * the leader's real movement planner has failed. The companion pays one
 * legal movement turn; never swap positions, cross bodies or move through
 * warned stone. No persistent reservation or seeded RNG is necessary.
 */
export function planSquadRightOfWay(
 s:Pick<DungeonState,'map'|'units'|'traps'|'tick'>,leader:Unit,
 blocker:Unit,goal:TacticalCell,mode:TacticalMode
):TacticalCell|null{
 if(!s||!leader||!blocker||leader.id===blocker.id||
  leader.faction!=='party'||blocker.faction!=='party'||
  leader.hp<=0||blocker.hp<=0||!Array.isArray(s.map)||
  !Array.isArray(s.units)||!Array.isArray(s.traps)||
  !walkable(s.map,leader.x,leader.z)||!walkable(s.map,blocker.x,blocker.z)||
  !walkable(s.map,goal?.x,goal?.z)||
  !['engage','exit'].includes(mode))return null;
 const route=shortestPath(s.map,leader,goal);
 if(!route.length||route[0].x!==blocker.x||route[0].z!==blocker.z||
  (mode==='exit'&&dist(blocker,goal)===0))return null;
 const occupied=new Set(s.units.filter(u=>u.hp>0&&u.id!==blocker.id).map(u=>key(u.x,u.z)));
 const hazardous=new Set(s.traps.filter(t=>t.active&&!t.disarmed).map(t=>key(t.x,t.z)));
 const boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
 const strike=boss?planWardenStrike(s,boss):null;
 const marked=new Set((strike&&(strike.warning||strike.turnsUntilImpact===0)?
  strike.cells:[]).map(p=>key(p.x,p.z)));
 const permitted=(p:TacticalCell)=>walkable(s.map,p.x,p.z)&&
  dist(p,blocker)===1&&!occupied.has(key(p.x,p.z))&&
  !hazardous.has(key(p.x,p.z))&&!marked.has(key(p.x,p.z));
 const tactical=planTacticalStep(s,blocker,goal,mode);
 if(tactical&&permitted(tactical))return tactical;
 // In a single-wide passage the next free stone might not be an ideal
 // shooting position yet. Advance as a real escort rather than immobilizing
 // the whole expedition for the sake of a cosmetic formation.
 const options=DIRS.map(([dx,dz])=>({x:blocker.x+dx,z:blocker.z+dz}))
  .filter(permitted)
  .sort((a,b)=>dist(a,goal)-dist(b,goal)||a.z-b.z||a.x-b.x);
 return options[0]??null;
}

/**
 * Back-line retreat is a genuine turn of movement. No phantom spell,
 * grid collision, untargetable teleport or protected unknown tile.
 */
export function planTacticalDisengage(
 s:Pick<DungeonState,'map'|'units'|'traps'|'tick'>,actor:Unit,threat:Unit
):TacticalCell|null{
 if(!s||!actor||!threat||!Array.isArray(s.units)||!Array.isArray(s.traps)||
  !['ranger','mystic'].includes(actor.kind)||actor.hp<=0||threat.hp<=0||
  threat.faction===actor.faction||dist(actor,threat)!==1)return null;
 const occupied=new Set(s.units.filter(u=>u.hp>0&&u.id!==actor.id).map(u=>key(u.x,u.z)));
 const boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
 const warning=boss?planWardenStrike(s,boss):null;
 const marked=new Set((warning?.warning?warning.cells:[]).map(p=>key(p.x,p.z)));
 const options=DIRS.map(([dx,dz])=>({x:actor.x+dx,z:actor.z+dz}))
  .filter(p=>walkable(s.map,p.x,p.z)&&!occupied.has(key(p.x,p.z))&&
   dist(p,threat)>=2&&!marked.has(key(p.x,p.z))&&
   !s.traps.some(t=>t.active&&!t.disarmed&&t.x===p.x&&t.z===p.z))
  .map(p=>({p,d:dist(p,threat),lane:clearCombatLane(s.map,p,threat)}))
  .sort((a,b)=>Number(b.lane)-Number(a.lane)||b.d-a.d||a.p.z-b.p.z||a.p.x-b.p.x);
 return options[0]?.p??null;
}


/** The Vanguard spends one genuine turn to cover an adjacent ally who cannot
 * sidestep a saved imminent hit. Never force the outcome or alter grid/replay.
 * No new save fields, seeds, timers, shields or hidden immunity.
 */
export function planOathguardIntercept(
 s:Pick<DungeonState,'map'|'units'|'traps'|'tick'>,guardian:Unit
):{allyId:string;threat:string}|null{
 if(!s||!Array.isArray(s.units)||!Array.isArray(s.map)||!Array.isArray(s.traps)||
  !Number.isSafeInteger(s.tick)||guardian?.kind!=='vanguard'||guardian.faction!=='party'||
  guardian.hp<=Math.ceil(guardian.maxHp*.27))return null;
 const marked=new Set<number>(),origins=new Map<number,string>();
 for(const enemy of s.units){
  if(enemy.hp<=0||enemy.faction!=='enemy')continue;
  const mark=enemy.kind==='cultist'&&enemy.channelUntilTick===s.tick?
   {x:enemy.channelX,z:enemy.channelZ,threat:'SHADOW HEX'}:
   enemy.kind==='revenant'&&enemy.breachUntilTick===s.tick?
   {x:enemy.breachX,z:enemy.breachZ,threat:'REVENANT BREACH'}:null;
  if(mark&&Number.isInteger(mark.x)&&Number.isInteger(mark.z)&&walkable(s.map,mark.x!,mark.z!)){
   const k=key(mark.x!,mark.z!);marked.add(k);origins.set(k,mark.threat);
  }
 }
 const boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
 const strike=boss&&dist(guardian,boss)<=5?planWardenStrike(s,boss):null;
 if(strike?.attackTick===s.tick)for(const tile of strike.cells){
  const k=key(tile.x,tile.z);marked.add(k);origins.set(k,'WARDEN '+strike.shape.replaceAll('_',' '));
 }
 if(!marked.size||marked.has(key(guardian.x,guardian.z)))return null;
 const occupied=new Set(s.units.filter(u=>u.hp>0).map(u=>key(u.x,u.z)));
 const hazardous=new Set(s.traps.filter(t=>t.active&&!t.disarmed).map(t=>key(t.x,t.z)));
 const allies=s.units.filter(u=>u.faction==='party'&&u.id!==guardian.id&&u.hp>0&&
  dist(u,guardian)===1&&marked.has(key(u.x,u.z)))
  .sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp||a.id.localeCompare(b.id));
 for(const ally of allies){
  const escape=DIRS.some(([dx,dz])=>{
   const x=ally.x+dx,z=ally.z+dz,k=key(x,z);
   return walkable(s.map,x,z)&&!marked.has(k)&&!hazardous.has(k)&&!occupied.has(k);
  });
  if(!escape)return {allyId:ally.id,threat:origins.get(key(ally.x,ally.z))||'LOCKED STRIKE'};
 }
 return null;
}

/**
 * One-beat, real Warden team tactic: the Vanguard vacates a safe floor tile
 * which currently BLOCKS the only legal escape of a warned companion.
 * Simulate the partner's actual one-step tactical planner on a read-only
 * candidate. No artificial immunity, free step, saved field or altered RNG.
 */
export function planOathguardClearLane(
 s:Pick<DungeonState,'map'|'units'|'traps'|'tick'>,guardian:Unit
):{x:number;z:number;allyId:string}|null{
 if(!s||!Array.isArray(s.units)||!Array.isArray(s.map)||!Array.isArray(s.traps)||
  !Number.isSafeInteger(s.tick)||guardian?.kind!=='vanguard'||guardian.faction!=='party'||
  guardian.hp<=0||!walkable(s.map,guardian.x,guardian.z))return null;
 const boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
 const strike=boss?planWardenStrike(s,boss):null;
 if(!strike?.warning||strike.attackTick!==s.tick+1||dist(guardian,boss!)>7)return null;
 const marked=new Set(strike.cells.map(p=>key(p.x,p.z)));
 if(marked.has(key(guardian.x,guardian.z)))return null;
 const occupied=new Set(s.units.filter(u=>u.hp>0&&u.id!==guardian.id).map(u=>key(u.x,u.z)));
 const traps=new Set(s.traps.filter(t=>t.active&&!t.disarmed).map(t=>key(t.x,t.z)));
 const blocked=s.units.filter(u=>u.faction==='party'&&u.id!==guardian.id&&
  u.hp>0&&walkable(s.map,u.x,u.z)&&dist(u,guardian)===1&&
  marked.has(key(u.x,u.z))&&!planWardenEvasionStep(s,u,strike))
  .sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp||a.id.localeCompare(b.id,'en'));
 if(!blocked.length)return null;
 const escapes=DIRS.map(([dx,dz])=>({x:guardian.x+dx,z:guardian.z+dz}))
  .filter(p=>walkable(s.map,p.x,p.z)&&!occupied.has(key(p.x,p.z))&&
   !marked.has(key(p.x,p.z))&&!traps.has(key(p.x,p.z)))
  .sort((a,b)=>dist(b,boss!)-dist(a,boss!)||a.z-b.z||a.x-b.x);
 for(const ally of blocked)for(const step of escapes){
  const trial={...s,units:s.units.map(u=>u.id===guardian.id?
   {...u,x:step.x,z:step.z}:u)};
  const dodge=planWardenEvasionStep(trial,ally,strike);
  // The companion must GENUINELY be able to enter the vacated safe tile.
  if(dodge?.x===guardian.x&&dodge.z===guardian.z)
   return {x:step.x,z:step.z,allyId:ally.id};
 }
 return null;
}

/** The real Vanguard absorbs some *locked* strike HP loss at a cost. The ally
 * still takes damage. Ordinary melee cannot silently trigger this protection.
 */
function applyOathguardIntercept(s:DungeonState,victim:Unit,dealt:number):number{
 if(!Number.isSafeInteger(dealt)||dealt<=1||victim.faction!=='party')return dealt;
 const guardian=s.units.find(u=>u.kind==='vanguard'&&u.faction==='party'&&
  u.id!==victim.id&&u.hp>0&&u.guardTick===s.tick&&
  u.targetId===victim.id&&dist(u,victim)===1);
 if(!guardian)return dealt;
 const diverted=Math.floor(dealt*.60),cost=Math.max(1,Math.ceil(diverted*.86));
 if(diverted<=0)return dealt;
 guardian.hp=Math.max(0,guardian.hp-cost);
 if(guardian.hp===0)guardian.action='hurt';
 s.intent='Ashen Vanguard shielding '+victim.kind+' from a locked blow';
 push(s,'cover','Ashen Vanguard intercepted '+diverted+' damage for '+victim.kind+
  ' · '+cost+' HP paid');
 return dealt-diverted;
}

/**
 * REAL playable nave staging: open three spaced fighting chambers *on the
 * traversed route*, not translucent camera-only cutaways. Both characters
 * and enemy AI receive exactly the same walkable masonry changes. The
 * procedural dungeon remains connected and retains a meaningful approach
 * to its guardian. No cosmetic random calls or extra authoritative RNG.
 */
export function planExpeditionCombatNaves(
 rows:string[],spawn:{x:number;z:number},exit:{x:number;z:number}
):{map:string[];centers:{x:number;z:number}[]}{
 const empty={map:rows,centers:[] as {x:number;z:number}[]};
 if(!Array.isArray(rows)||rows.length!==MAP_SIZE||
  rows.some(r=>typeof r!=='string'||r.length!==MAP_SIZE)||
  !walkable(rows,spawn?.x,spawn?.z)||!walkable(rows,exit?.x,exit?.z))return empty;
 const route=shortestPath(rows,spawn,exit);
 if(route.length<12)return empty;
 const out=rows.map(row=>row.split(''));
 const centers:{x:number;z:number}[]=[];
 // Physical chambers are staged at three points along the *actual* route.
 // Candidate order, separation, and fallback are stable after save/restore.
 for(const fraction of [.28,.51,.74]){
  const target=Math.floor((route.length-1)*fraction);
  const candidates=route.map((p,i)=>({p,i}))
   .filter(({p})=>p.x>=2&&p.x<=MAP_SIZE-3&&p.z>=2&&p.z<=MAP_SIZE-3&&
    dist(p,spawn)>=5&&dist(p,exit)>=5&&
    centers.every(c=>dist(c,p)>=5))
   .sort((a,b)=>Math.abs(a.i-target)-Math.abs(b.i-target)||a.i-b.i);
  for(const {p} of candidates){
   const changed:{x:number;z:number}[]=[];
   for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
    const x=p.x+dx,z=p.z+dz;
    if(out[z][x]==='#'){out[z][x]='.';changed.push({x,z});}
   }
   const trial=out.map(row=>row.join(''));
   // Preserve a proper expedition length. A shortcut through the new hall
   // may never turn an earned boss confrontation into an immediate spawn.
   if(shortestPath(trial,spawn,exit).length>=12){
    centers.push({x:p.x,z:p.z});break;
   }
   for(const tile of changed)out[tile.z][tile.x]='#';
  }
 }
 return {map:out.map(row=>row.join('')),centers};
}

function createFloor(seed:string,floor:number,rng:NamedRng,run:number,previous?:DungeonState):DungeonState {
 const map=Array.from({length:MAP_SIZE},()=>Array(MAP_SIZE).fill('#'));
 const stack=[{x:1,z:1}];map[1][1]='.';
 while(stack.length){const current=stack[stack.length-1];
  const choices=DIRS.map(([dx,dz])=>({x:current.x+dx*2,z:current.z+dz*2,dx,dz})).filter(p=>p.x>0&&p.z>0&&p.x<MAP_SIZE-1&&p.z<MAP_SIZE-1&&map[p.z][p.x]==='#');
  if(!choices.length){stack.pop();continue}
  const next=choices[rng.nextInt('topology:'+floor+':'+run,choices.length)];
  map[current.z+next.dz][current.x+next.dx]='.';map[next.z][next.x]='.';stack.push({x:next.x,z:next.z});
 }
 // Shortcuts increase encounter visibility while the carved spanning tree guarantees reachability.
 for(let z=2;z<MAP_SIZE-2;z++)for(let x=2;x<MAP_SIZE-2;x++)if(map[z][x]==='#'&&rng.nextInt('shortcuts:'+floor+':'+run,100)<11){
  if((map[z-1][x]==='.'&&map[z+1][x]==='.')||(map[z][x-1]==='.'&&map[z][x+1]==='.'))map[z][x]='.';
 }
 // Open authored-scale sanctuaries into the guaranteed connected maze: variety without retries.
 const chambers=3+rng.nextInt('chambers:'+floor+':'+run,3);
 for(let i=0;i<chambers;i++){
  const x=3+2*rng.nextInt('chamber-x:'+floor+':'+run,7),z=3+2*rng.nextInt('chamber-z:'+floor+':'+run,7);
  const radius=1+rng.nextInt('chamber-size:'+floor+':'+run,2);
  for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){
   if(x+dx>0&&z+dz>0&&x+dx<MAP_SIZE-1&&z+dz<MAP_SIZE-1)map[z+dz][x+dx]='.';
  }
 }
 // The first encounter needs room for actual 1.8 m high protagonists, not a
 // single-cell knot of three bodies. The atrium is part of the *real* grid,
 // never a transparent render-only opening with invisible collision walls.
 for(let z=1;z<=4;z++)for(let x=1;x<=4;x++)map[z][x]='.';
 // Carve bounded flank/escape lanes wherever the original topology already
 // puts two or more routes along an adjacent blocked stone cell. All removals
 // only increase reachability; the named seeded stream preserves exact replay.
 let widened=0;
 for(let z=2;z<MAP_SIZE-2;z++)for(let x=2;x<MAP_SIZE-2;x++){
  if(map[z][x]!=='#'||widened>=34)continue;
  const neighbours=DIRS.reduce((n,[dx,dz])=>n+Number(map[z+dz][x+dx]==='.'),0);
  if(neighbours<2)continue;
  if(rng.nextInt('combat-avenues:'+floor+':'+run,100)<42){map[z][x]='.';widened++}
 }
 const spawn={x:1,z:1};
 let rows=map.map(r=>r.join('')),measure=distances(rows,spawn);
 let tiles=[...measure.entries()].map(([k,d])=>({x:k%MAP_SIZE,z:Math.floor(k/MAP_SIZE),d})).sort((a,b)=>b.d-a.d||a.z-b.z||a.x-b.x);
 // The guardian must occupy a legible interior stage with space for
 // defenders, sidesteps and directional attacks, not a clipped map edge.
 // Retain the long route as a real risk-and-reward expedition.
 const deep=tiles.find(p=>p.x>=4&&p.z>=4&&p.x<MAP_SIZE-4&&p.z<MAP_SIZE-4&&p.d>=12);
 const exit={x:(deep??tiles[0]).x,z:(deep??tiles[0]).z};
 // A seven-cell courtyard supports a true multi-actor Warden confrontation.
 for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){
  const x=exit.x+dx,z=exit.z+dz;
  if(x>0&&z>0&&x<MAP_SIZE-1&&z<MAP_SIZE-1)map[z][x]='.';
 }
 // Actual navigable naves, not merely a cinematic false-positive: enemies
 // and party can both flank around genuine stone and fight within the rooms.
 const expeditionNaves=planExpeditionCombatNaves(map.map(r=>r.join('')),spawn,exit);
 for(let z=0;z<MAP_SIZE;z++)map[z]=expeditionNaves.map[z].split('');
 rows=map.map(r=>r.join(''));measure=distances(rows,spawn);
 tiles=[...measure.entries()].map(([k,d])=>({x:k%MAP_SIZE,z:Math.floor(k/MAP_SIZE),d})).sort((a,b)=>b.d-a.d||a.z-b.z||a.x-b.x);
 const occupied=new Set([key(spawn.x,spawn.z),key(exit.x,exit.z)]);
 const units:Unit[]=[
  {id:'vanguard',kind:'vanguard',faction:'party',x:1,z:1,hp:previous?.units.find(u=>u.id==='vanguard')?.hp??120,maxHp:120,attack:22,cooldown:0},
  {id:'ranger',kind:'ranger',faction:'party',x:2,z:1,hp:previous?.units.find(u=>u.id==='ranger')?.hp??85,maxHp:85,attack:15,cooldown:0},
  {id:'mystic',kind:'mystic',faction:'party',x:1,z:2,hp:previous?.units.find(u=>u.id==='mystic')?.hp??75,maxHp:75,attack:12,cooldown:0,focus:5,maxFocus:5},
  {id:'warden-'+floor,kind:'warden',faction:'enemy',x:exit.x,z:exit.z,hp:260+floor*34,maxHp:260+floor*34,attack:16+Math.min(18,floor*2),cooldown:0}
 ];
 // Place enemies on distant navigable tiles, away from the spawn and boss.
 const eligible=tiles.filter(p=>p.d>5&&dist(p,exit)>3);
 for(let i=0;i<Math.min(7,3+Math.floor(floor/2))&&eligible.length;i++){
  // The first real cultist/revenant confrontations belong inside the
  // traversed naves rather than an invisible random single-cell passage.
  // Draw the same seeded stream regardless of whether a staging bay exists.
  const roll=rng.nextInt('encounters:'+floor+':'+run,eligible.length);
  const court=expeditionNaves.centers[i];
  const choices=court?eligible.map((p,j)=>({p,j,d:dist(p,court)}))
   .filter(c=>c.d<=1).sort((a,b)=>a.d-b.d||a.p.z-b.p.z||a.p.x-b.p.x):[];
  const index=choices.length?choices[0].j:roll;
  const p=eligible.splice(index,1)[0],k=key(p.x,p.z);
  if(occupied.has(k))continue;occupied.add(k);
  const kind:UnitKind=i%3===0?'cultist':'revenant',hp=kind==='cultist'?36+floor*3:44+floor*4;
  units.push({id:'enemy-'+floor+'-'+i,kind,faction:'enemy',x:p.x,z:p.z,hp,maxHp:hp,attack:kind==='cultist'?8+Math.min(10,Math.floor(floor/2)):10+Math.min(14,Math.floor(floor/2)),cooldown:0});
 }
 // Living oathbound defenders make the sealed boss fight a close, readable
 // challenge. These seeded, legal units are real AI opponents, not fake VFX.
 const courtTiles=DIRS.flatMap(([dx,dz])=>[2,1].map(d=>({x:exit.x+dx*d,z:exit.z+dz*d})));
 for(let i=0;i<2;i++){
  const options=courtTiles.filter(p=>walkable(rows,p.x,p.z)&&!occupied.has(key(p.x,p.z))&&dist(p,spawn)>4);
  if(!options.length)break;
  const p=options[rng.nextInt('court-guard:'+floor+':'+run+':'+i,options.length)];
  occupied.add(key(p.x,p.z));
  const kind:UnitKind=i===0?'revenant':'cultist',maxHp=(i===0?46:34)+floor*4;
  units.push({id:'oathbound-'+floor+'-'+i,kind,faction:'enemy',x:p.x,z:p.z,hp:maxHp,maxHp,attack:i===0?10:8,cooldown:0});
 }
 for(const unit of units){unit.action='idle';unit.actionTick=previous?.tick??0}
 const relics=tiles.filter(p=>p.d>3&&!occupied.has(key(p.x,p.z))).slice(0,3).map(p=>({x:p.x,z:p.z}));
 const forbidden=new Set(relics.map(p=>key(p.x,p.z)));
 const trapTiles=tiles.filter(p=>p.d>5&&dist(p,exit)>3&&!occupied.has(key(p.x,p.z))&&!forbidden.has(key(p.x,p.z)));
 const traps:DungeonTrap[]=[];
 for(let i=0;i<Math.min(5,2+Math.floor(floor/3))&&trapTiles.length;i++){
  const index=rng.nextInt('trap-positions:'+floor+':'+run,trapTiles.length),p=trapTiles.splice(index,1)[0];
  traps.push({id:'hazard-'+floor+'-'+i,x:p.x,z:p.z,kind:i%2?'arcane':'ember',active:true,cooldown:0,disarmed:false,triggers:0});
 }
 const rules=previous?(previous.rulesVersion===2?{rulesVersion:2 as const}:{}):{rulesVersion:2 as const};
 return {schemaVersion:1,...rules,tick:previous?.tick??0,floor,run,phase:'exploring',intermission:0,theme:THEMES[(floor-1)%THEMES.length],map:rows,exit,units,relics,traps,kills:previous?.kills??0,gold:previous?.gold??0,level:previous?.level??1,intent:'Mapping the uncharted halls',events:previous?.events??[]};
}
export function assertDungeonState(s:DungeonState){
 if(s.schemaVersion!==1||(s.rulesVersion!==undefined&&s.rulesVersion!==2)||s.map.length!==MAP_SIZE||s.map.some(r=>r.length!==MAP_SIZE))throw Error('Invalid dungeon map');
 if(!walkable(s.map,1,1)||!walkable(s.map,s.exit.x,s.exit.z)||shortestPath(s.map,{x:1,z:1},s.exit).length===0)throw Error('Dungeon exit unreachable');
 const ids=new Set<string>();
 for(const u of s.units){if(ids.has(u.id)||!walkable(s.map,u.x,u.z)||!Number.isInteger(u.hp)||u.hp<0||u.hp>u.maxHp)throw Error('Invalid unit '+u.id);ids.add(u.id);
  if(u.recoveryUntilTick!==undefined&&(u.kind!=='warden'||!Number.isSafeInteger(u.recoveryUntilTick)||u.recoveryUntilTick<s.tick||u.recoveryUntilTick>s.tick+2))throw Error('Invalid Warden recovery clock');
  // Optional fields keep old signed checkpoints readable; new Mystic focus is
  // a strictly bounded earned resource, never a source of infinite healing.
  // The shadow bolt is a saved, spatially locked two-turn threat, not an
  // instant ranged hit or a spectator-only warning. Old checkpoints omit it.
  const hexFields=[u.channelUntilTick,u.channelTargetId,u.channelX,u.channelZ];
  if(hexFields.some(value=>value!==undefined)){
   if(u.kind!=='cultist'||hexFields.some(value=>value===undefined)||
      !Number.isSafeInteger(u.channelUntilTick)||u.channelUntilTick!<s.tick||
      u.channelUntilTick!>s.tick+1||typeof u.channelTargetId!=='string'||
      !Number.isSafeInteger(u.channelX)||!Number.isSafeInteger(u.channelZ)||
      !walkable(s.map,u.channelX!,u.channelZ!))throw Error('Invalid cultist shadow hex');
  }
  // Optional one-turn threat quartet; preserves all older signed saves.
  const breach=[u.breachUntilTick,u.breachTargetId,u.breachX,u.breachZ];
  if(breach.some(value=>value!==undefined)){
   if(u.kind!=='revenant'||breach.some(value=>value===undefined)||
    !Number.isSafeInteger(u.breachUntilTick)||u.breachUntilTick!<s.tick||
    u.breachUntilTick!>s.tick+1||typeof u.breachTargetId!=='string'||
    !Number.isSafeInteger(u.breachX)||!Number.isSafeInteger(u.breachZ)||
    !walkable(s.map,u.breachX!,u.breachZ!))throw Error('Invalid revenant breach');
  }
  if(u.focus!==undefined||u.maxFocus!==undefined){
   if(u.kind!=='mystic'||!Number.isSafeInteger(u.focus)||!Number.isSafeInteger(u.maxFocus)||
    (u.maxFocus??0)<1||(u.maxFocus??0)>6||(u.focus??-1)<0||(u.focus??7)>(u.maxFocus??0))throw Error('Invalid healing focus');
  }
 }
 if(s.units.length>18||s.relics.length>6||s.traps.length>5||s.events.length>9)throw Error('Bounded state exceeded');
 for(const trap of s.traps){if(!walkable(s.map,trap.x,trap.z)||trap.cooldown<0||!Number.isInteger(trap.triggers)||trap.triggers<0||trap.triggers>10000)throw Error('Invalid dungeon trap '+trap.id)}
}
export class DungeonRuntime {
 public state:DungeonState;
 private rng:NamedRng;
 private constructor(private seed:string, rng:NamedRng,state:DungeonState){this.rng=rng;this.state=state;assertDungeonState(state)}
 static create(seed='ashen-dungeon'){const rng=NamedRng.fromSeed(seed);return new DungeonRuntime(seed,rng,createFloor(seed,1,rng,1))}
 static restore(save:DungeonSave){
  if(!save||!['0.5.0',DUNGEON_VERSION].includes(save.version))
   throw Error('Unsupported dungeon gameplay version; start a new expedition rather than replaying incompatible rules');
  if(save.signature!==checksum({seed:save.seed,rng:save.rng,state:save.state}))
   throw Error('Dungeon snapshot checksum mismatch');
  // Previous signed 0.5.0 expeditions lack rulesVersion. Keep their exact old
  // tactics through the current run; only an earned defeat/restart starts v2.
  if(save.version==='0.5.0'&&save.state?.rulesVersion!==undefined)
   throw Error('Invalid v0.5.0 dungeon rules metadata');
  return new DungeonRuntime(save.seed,NamedRng.restore(save.rng),clone(save.state));
 }
 save():DungeonSave {const state=clone(this.state),rng=this.rng.snapshot();return {version:DUNGEON_VERSION,seed:this.seed,rng,state,signature:checksum({seed:this.seed,rng,state})}}
 step(){
  const s=this.state;const warden=s.units.find(u=>u.kind==='warden');const previousWardenPhase=wardenPhase(warden),wardAtStart=wardenSealActive(s);s.tick++;for(const unit of s.units){unit.action='idle';unit.actionTick=s.tick;delete unit.targetId;
   if(unit.kind==='warden'&&unit.recoveryUntilTick!==undefined&&unit.recoveryUntilTick<s.tick)delete unit.recoveryUntilTick;
   if(unit.kind==='cultist'&&unit.channelUntilTick!==undefined&&unit.channelUntilTick<s.tick){
    delete unit.channelUntilTick;delete unit.channelTargetId;delete unit.channelX;delete unit.channelZ;
   }
   if(unit.kind==='revenant'&&unit.breachUntilTick!==undefined&&unit.breachUntilTick<s.tick){
    delete unit.breachUntilTick;delete unit.breachTargetId;delete unit.breachX;delete unit.breachZ;
   }
   // Legacy checkpoints omit the optional focus fields, and are restored
   // deterministically on their first real authority tick, without a bump.
   if(unit.kind==='mystic'&&unit.focus===undefined&&unit.maxFocus===undefined){unit.focus=5;unit.maxFocus=5;}
  }
  if(s.phase==='intermission'){if(--s.intermission<=0){const run=s.run+1;this.state=createFloor(this.seed,1,this.rng,run);push(this.state,'restart','A new expedition enters the dungeon.')}return this.publicState()}
  const party=s.units.filter(u=>u.faction==='party'&&u.hp>0),foes=s.units.filter(u=>u.faction==='enemy'&&u.hp>0),leader=party[0];
  let leaderBlockedGoal:TacticalCell|null=null,leaderBlockedMode:TacticalMode='engage';
  if(!leader){s.phase='intermission';s.intermission=14;push(s,'defeat','The expedition was lost. A new run begins shortly.');return this.publicState()}
  // Traps cool down on authoritative ticks. Ranger can permanently disarm a nearby hazard.
  for(const trap of s.traps)if(!trap.disarmed&&!trap.active&&trap.cooldown>0){trap.cooldown--;if(trap.cooldown===0)trap.active=true}
  // Turn-based autonomous tactics. Deterministic unit order and bounded path searches.
  for(const hero of party){
   // Respond to real warned tiles; a safe flank is one legal step, otherwise
   // brace for the actual impact. Retain the tactical attack lane when possible.
   const warden=s.units.find(u=>u.kind==='warden'&&u.hp>0);
   const warned=warden?planWardenStrike(s,warden):null;
   // An actual cultist has charged a projectile against this *recorded tile*.
   // Dodging uses one lawful free grid cell; otherwise the hero deliberately
   // guards and the real hit is reduced. No camera-only dodge or instant aim.
   const pendingHex=s.units.find(u=>u.kind==='cultist'&&u.hp>0&&
    u.channelUntilTick===s.tick&&u.channelTargetId===hero.id&&u.channelX===hero.x&&u.channelZ===hero.z);
   const pendingBreach=s.units.find(u=>u.kind==='revenant'&&u.hp>0&&
    u.breachUntilTick===s.tick&&u.breachTargetId===hero.id&&
    u.breachX===hero.x&&u.breachZ===hero.z);
   // Real shield decision requires an unavoidable, saved ground threat.
   if(hero.kind==='vanguard'){
    const cover=planOathguardIntercept(s,hero);
    if(cover){
     hero.guardTick=s.tick;hero.targetId=cover.allyId;hero.action='guard';
     s.intent='Ashen Vanguard covering '+cover.allyId;
     push(s,'cover','ASHEN VANGUARD · COVERING '+cover.allyId.toUpperCase()+' FROM '+cover.threat);
     continue;
    }
    const cleared=planOathguardClearLane(s,hero);
    if(cleared){
     hero.x=cleared.x;hero.z=cleared.z;hero.action='move';hero.targetId=cleared.allyId;
     s.intent='Ashen Vanguard clearing a lawful escape lane for '+cleared.allyId;
     push(s,'cover-advance','Ashen Vanguard opened safe stone for '+cleared.allyId);
     continue;
    }
   }
   if(pendingHex||pendingBreach){
    const aggressor=(pendingBreach??pendingHex)!;
    const dangerName=pendingBreach?'revenant breach':'shadow hex';
    const locked=warned?.attackTick===s.tick?
     new Set<number>(warned.cells.map(p=>key(p.x,p.z))):new Set<number>();
    // One lawful sidestep must avoid every simultaneously advertised hit tile.
    for(const foe of s.units.filter(u=>u.hp>0)){
     if(foe.kind==='cultist'&&foe.channelUntilTick===s.tick)
      locked.add(key(foe.channelX!,foe.channelZ!));
     if(foe.kind==='revenant'&&foe.breachUntilTick===s.tick)
      locked.add(key(foe.breachX!,foe.breachZ!));
    }
    const sidesteps=DIRS.map(([dx,dz])=>({x:hero.x+dx,z:hero.z+dz}))
     .filter(p=>walkable(s.map,p.x,p.z)&&!locked.has(key(p.x,p.z)))
     .filter(p=>!s.units.some(u=>u.hp>0&&u.id!==hero.id&&u.x===p.x&&u.z===p.z))
     .filter(p=>!s.traps.some(t=>t.active&&!t.disarmed&&t.x===p.x&&t.z===p.z))
     .sort((a,b)=>dist(b,aggressor)-dist(a,aggressor)||a.z-b.z||a.x-b.x);
    if(sidesteps.length){
     hero.x=sidesteps[0].x;hero.z=sidesteps[0].z;hero.action='move';
     s.intent=hero.kind+' evading a locked '+dangerName;
     push(s,'evade',hero.kind+' slipped away from the marked '+dangerName);continue;
    }
    hero.guardTick=s.tick;hero.action='guard';
    s.intent=hero.kind+' bracing against a '+dangerName;
    push(s,'guard',hero.kind+' guarded the locked '+dangerName);continue;
   }
   // The original attack footprint is revealed three beats before the
   // broad Sentinel nova. Search through *actual* free stone tiles so each
   // autonomous fighter can take a legal path while the Warden anchors his
   // cast. A blocked escape remains a real guard, never a ghost dodge.
   if(warned?.warning&&warned.cells.some(p=>p.x===hero.x&&p.z===hero.z)){
    // Every frontline fighter pays the SAME lawful movement cost to leave the
    // actual marked stone. Holding a blast does not shield allies: the real
    // oathguard interception above is the only ability that absorbs for them.
    // Preserve the Warden's post-strike opening by escaping toward legal
    // counterattack positions rather than wasting three turns on false tanking.
    const escape=planWardenEvasionStep(s,hero,warned);
    if(escape){
     hero.x=escape.x;hero.z=escape.z;hero.action='move';
     s.intent=hero.kind+' retreating from the '+warned.shape.toLowerCase().replaceAll('_',' ');
     push(s,'evade',hero.kind+' moved toward clear stone before the Warden strike');continue;
    }
    if(warned.turnsUntilImpact===1){
     hero.guardTick=s.tick+1;hero.action='guard';
     s.intent='Bracing for the marked '+warned.shape.toLowerCase().replaceAll('_',' ');
     push(s,'guard',hero.kind+' braced against the oncoming attack');continue;
    }
   }
   // A successful dodge is a *decision across multiple ticks*, not a one-tick
   // sidestep followed by immediately walking back into the advertised blast.
   // Stay on the safely marked flank while the impact resolves. We do not
   // invent another move, teleport, or damage result in presentation.
   if(warned?.attackTick===s.tick&&dist(hero,warden!)<=5&&
      !warned.cells.some(p=>p.x===hero.x&&p.z===hero.z)){
    hero.action='guard';s.intent='Holding the safe flank through the Warden strike';
    continue;
   }
   if(hero.kind==='ranger'&&s.tick%4===0){const hazard=s.traps.find(t=>t.active&&!t.disarmed&&dist(hero,t)<=2);
    if(hazard){hazard.active=false;hazard.disarmed=true;hazard.cooldown=0;hero.action='cast';s.intent='Wildshadow disabling a dangerous rune';push(s,'disarm','Wildshadow safely disabled a '+hazard.kind+' trap');continue}
   }
   const enemies=s.units.filter(u=>u.faction==='enemy'&&u.hp>0).sort((a,b)=>dist(hero,a)-dist(hero,b)||a.id.localeCompare(b.id));
   const defenders=enemies.filter(u=>u.kind!=='warden');
   // The expedition deliberately clears the binding guards before its guardian duel.
   // Incidental boss contact still has a real, bounded damage outcome and cannot stall a corridor.
   const recoveringWarden=enemies.find(e=>e.kind==='warden'&&planWardenRecovery(s,e));
   // Real counterplay: attack the genuinely exposed guardian before minions,
   // but only when a legal unobstructed firing/weapon lane exists.
   // A genuine charged hex or breach aimed at a still-marked ally outranks
   // an incidental nearby foe. Actual attack range and blocked lanes remain.
   const threatenedCasters=planThreatInterceptions(s,hero);
   // V2: the last real defender keeps top priority when contact is legal.
   // However, a remote/out-of-lane defender must not make an adjacent Warden
   // untouchable. The seal still taxes boss damage through the existing
   // authoritative formula: this is NEVER a free unseal or imaginary attack.
   // Existing signed legacy runs retain their old ordering until new-run migration.
   const attackable=[...threatenedCasters,...(recoveringWarden?[recoveringWarden]:[]),
    ...(defenders.length?defenders:enemies),
    ...(s.rulesVersion===2?enemies.filter(e=>e.kind==='warden'):[])]
    .filter((foe,i,all)=>all.findIndex(other=>other.id===foe.id)===i);
   const range=hero.kind==='vanguard'?1:hero.kind==='ranger'?4:3;
   if(hero.kind==='mystic'){
    const urgent=party.some(u=>u.hp>0&&u.hp<=u.maxHp*.35);
    const focus=hero.focus??0;
    // Spend real finite healing focus, earned through relics and new floors.
    // Legacy signed runs preserve their historical unlimited-range choice.
    const threshold=focus<=2?.48:.70,due=urgent?s.tick%3===0:s.tick%6===0;
    const wounded=focus>0?
     party.filter(u=>u.hp>0&&u.hp<u.maxHp*threshold)
      .sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp||a.id.localeCompare(b.id))[0]:null;
    if(wounded){
     const legal=s.rulesVersion!==2||planMysticHealingLane(s,hero,wounded);
     if(due&&legal){
      hero.focus=focus-1;
      wounded.hp=Math.min(wounded.maxHp,wounded.hp+15+s.level);
      hero.action='cast';
      s.intent='Starweaver spends healing focus to restore '+wounded.kind;
      push(s,'healing','Starweaver healed '+wounded.kind+' · '+hero.focus+' focus left');
      continue;
     }
     if(s.rulesVersion===2&&urgent&&!legal&&wounded.id!==hero.id){
      // One normal turn of lawful movement toward a healing position,
      // without remote HP gain, extra action or fake successful cast.
      const step=planTacticalStep(s,hero,wounded,'engage');
      if(step&&!s.traps.some(t=>t.active&&!t.disarmed&&t.x===step.x&&t.z===step.z)){
       hero.x=step.x;hero.z=step.z;hero.action='move';
       s.intent='Starweaver opening a real healing lane to '+wounded.kind;
       if(s.tick%3===0)push(s,'reposition','Starweaver closing to heal wounded '+wounded.kind);
       continue;
      }
     }
    }
   }
   // Choose the nearest actual visible hostile instead of a wall-blocked nearest one.
   // Genuinely flee adjacent blades before taking a later clear-range shot.
    if((hero.kind==='ranger'||hero.kind==='mystic')&&s.tick%3===1){
     const threat=enemies.find(e=>dist(hero,e)===1);
     const escape=threat&&planTacticalDisengage(s,hero,threat);
     if(escape){hero.x=escape.x;hero.z=escape.z;hero.action='move';
      s.intent=hero.kind==='ranger'?'Wildshadow opening a safe firing lane':'Starweaver protecting the healing lane';
      push(s,'reposition',hero.kind+' disengaged from melee');continue}
    }
    const target=attackable.find(e=>dist(hero,e)>=1&&dist(hero,e)<=range&&clearTacticalLane(s,hero,e,hero.id));
   if(target){
    const recovery=target.kind==='warden'?planWardenRecovery(s,target):null;
    const baseDamage=hero.attack+(s.level-1)*2;
    const raw=recovery?Math.ceil(baseDamage*recovery.damageMultiplier):baseDamage;
    const damage=damageThroughWardenSeal(s,target,raw);
    target.hp=Math.max(0,target.hp-damage);hero.action=hero.kind==='mystic'?'cast':'attack';hero.targetId=target.id;target.action='hurt';
    s.intent=recovery?'The expedition counters the exposed Warden':hero.kind==='mystic'?'Arcane support engaging hostiles':hero.kind==='ranger'?'Ranger providing covering fire':'Vanguard holding the front line';
    if(target.kind==='cultist'&&target.channelUntilTick!==undefined&&damage>0){
     delete target.channelUntilTick;delete target.channelTargetId;
     delete target.channelX;delete target.channelZ;
     push(s,'interrupt',hero.kind+' interrupted the cultist hex with a real hit');
    }
    if(target.kind==='revenant'&&target.breachUntilTick!==undefined&&damage>0){
     delete target.breachUntilTick;delete target.breachTargetId;
     delete target.breachX;delete target.breachZ;
     push(s,'interrupt',hero.kind+' interrupted the revenant breach with a real hit');
    }
    if(recovery&&target.kind==='warden'&&damage>0)
     push(s,'counter',hero.kind+' countered the exposed Warden for '+damage+' damage');
    if(target.hp===0){s.kills++;s.gold+=12;s.level=1+Math.floor(s.kills/5);push(s,'kill',(target.kind==='warden'?'WARDEN DEFEATED':'Enemy defeated')+' · +12 gold')}
    else if(s.tick%4===0&&!recovery)push(s,'combat',hero.kind+' struck '+target.kind+' for '+damage);
    continue;
   }
   // Intercept nearby minions rather than marching past them to the Warden.
   const exposed=party.filter(u=>u.hp>0&&u.kind!=='vanguard')
     .sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp||a.id.localeCompare(b.id))[0];
    const protectorTarget=hero.kind==='vanguard'&&exposed?
     defenders.filter(e=>dist(e,exposed)<=2)
      .sort((a,b)=>dist(hero,a)-dist(hero,b)||a.id.localeCompare(b.id))[0]:null;
    const minion=protectorTarget??defenders.find(e=>dist(hero,e)<=5||dist(leader,e)<=4)??defenders[0];
   const boss=enemies.find(e=>e.kind==='warden');
   const nearbyBoss=boss&&dist(hero,boss)<=5?boss:null;
   // Ranged support can spend one lawful movement turn to open an interrupt
   // line before an actual locked attack resolves. No free shot or teleport.
   const imminentInterception=hero.kind!=='vanguard'?
    threatenedCasters.find(enemy=>dist(hero,enemy)<=range+2):null;
   const engagement=imminentInterception??(recoveringWarden||minion||(hero===leader?boss:nearbyBoss));
   if(hero!==leader&&s.rulesVersion===2&&leaderBlockedGoal&&!imminentInterception){
    const lane=planSquadRightOfWay(s,leader,hero,leaderBlockedGoal,leaderBlockedMode);
    if(lane){
     hero.x=lane.x;hero.z=lane.z;hero.action='move';hero.targetId=leader.id;
     s.intent=hero.kind+' yielding the real passage for the expedition front line';
     push(s,'formation',hero.kind+' opened a lawful route through the narrow passage');
     continue;
    }
   }
   if(hero!==leader&&!engagement){
    const next=planTacticalStep(s,hero,leader,'escort');
    if(next){hero.x=next.x;hero.z=next.z;hero.action='move';
     s.intent=hero.kind==='ranger'?'Ranger taking the supporting flank':'Mystic guarding the support lane'}
    continue;
   }
   // Real legal feet, not a camera-only formation offset. The living vanguard
   // closes for contact while ranged allies seek unobstructed firing lanes.
   const next=planTacticalStep(s,hero,engagement??s.exit,engagement?'engage':'exit');
   if(next){
    hero.x=next.x;hero.z=next.z;hero.action='move';
    s.intent=imminentInterception&&engagement===imminentInterception?'Seeking a lawful interrupt lane before the locked strike':
     recoveringWarden?'Closing on the Warden counterattack':hero.kind==='vanguard'?(minion?'Intercepting '+minion.kind:engagement?'Confronting the Warden':'Claiming the portal'):
     hero.kind==='ranger'?'Wildshadow seeking an open shot':'Starweaver taking a safe spell lane';
   }else if(hero===leader&&s.rulesVersion===2){
    // The leader truly failed to move; request a follower to clear the FIRST
    // physical path cell later in this very same authoritative party tick.
    const goal=engagement??s.exit,route=shortestPath(s.map,hero,goal);
    if(route.length&&party.some(u=>u.id!==hero.id&&u.x===route[0].x&&u.z===route[0].z)){
     leaderBlockedGoal={x:goal.x,z:goal.z};
     leaderBlockedMode=engagement?'engage':'exit';
    }
   }
  }
  // One authoritative transition when the last binding guard falls or the Warden's first phase breaks.
  if(wardAtStart&&!wardenSealActive(s)&&warden&&warden.hp>0){
   push(s,'unseal','THE WARDEN SEAL SHATTERS — the guardian is exposed');
   s.intent='Seal broken · confront the Eternal Warden';
  }
  // Enemies pursue only within a bounded aggro distance. Cooldowns prevent unavoidable stun-lock.
  for(const enemy of s.units.filter(u=>u.faction==='enemy'&&u.hp>0)){
   const nearestLiving=party.filter(u=>u.hp>0)
     .sort((a,b)=>dist(a,enemy)-dist(b,enemy)||a.id.localeCompare(b.id))[0];
    const nearest=enemy.kind==='warden'?planWardenHuntTarget(s,enemy)??nearestLiving:nearestLiving;
    if(!nearest)break;
   const distance=dist(enemy,nearest);
   // Three true boss threats with separate legible dodge tactics: a diamond
   // nova, cardinal rifts and a rotating floor sweep. Collision and warned
   // floor geometry come from the same authoritative planner.
   const bossPhase=enemy.kind==='warden'?wardenPhase(enemy):'SENTINEL';
   const interval=bossPhase==='ECLIPSE'?WARDEN_ECLIPSE_INTERVAL:6,attackTick=s.tick%interval;
   if(enemy.kind==='warden'){
    // His real post-impact recovery is a tactical opportunity, not a fake
    // VFX stagger: no boss melee, pursuit, or repeat cast during these turns.
    if(planWardenRecovery(s,enemy))continue;
    const strike=planWardenStrike(s,enemy);
    if(strike&&distance<=5&&strike.turnsUntilImpact===(strike.shape==='RIFT_CROSS'?2:3))
     push(s,'telegraph','WARDEN '+strike.shape.replaceAll('_',' ')+' — leave the marked stone or brace');
    if(strike&&distance<=5&&attackTick===0){
     const marked=new Set(strike.cells.map(p=>key(p.x,p.z)));
     const affected=party.filter(u=>u.hp>0&&marked.has(key(u.x,u.z)));
     const shock=8+Math.min(18,s.floor)+(bossPhase==='ECLIPSE'?6:bossPhase==='RUPTURE'?3:0);
     for(const hero of affected){
      const guarded=hero.guardTick===s.tick;
      const dealt=guarded?Math.max(1,Math.floor(shock*.30)):shock;
      hero.hp=Math.max(0,hero.hp-applyOathguardIntercept(s,hero,dealt));hero.action=guarded?'guard':'hurt';
      if(guarded)push(s,'block',hero.kind+' shielded '+(shock-dealt)+' damage');
     }
     enemy.action='cast';
     if(!wardenSealActive(s)){
      enemy.recoveryUntilTick=s.tick+(bossPhase==='ECLIPSE'?2:1);
      push(s,'opening','WARDEN EXPOSED — the party can counter the recovering guardian');
     }
     push(s,affected.length?'danger':'evade','The Warden '+strike.shape.replaceAll('_',' ').toLowerCase()+
      ' shockwave struck '+affected.length+' hero'+(affected.length===1?'':'es'));
     if(enemy.cooldown>0)enemy.cooldown--;
     continue;
    }
    // Wind-up must anchor the boss rather than sliding its hit zone underneath
    // the party while players are responding to already-visible floor marks.
    if(strike?.warning){
     enemy.action='guard';if(enemy.cooldown>0)enemy.cooldown--;continue;
    }
   }
   // A fallen sentinel creates an interruptible, deterministic shield-break.
   // Wind-up and hit use the same saved legal ground tile, not a fake animation.
   if(enemy.kind==='revenant'){
    if(enemy.breachUntilTick===s.tick){
     const victim=party.find(u=>u.id===enemy.breachTargetId&&u.hp>0);
     const locked=Boolean(victim&&victim.x===enemy.breachX&&victim.z===enemy.breachZ);
     const hit=Boolean(locked&&dist(enemy,victim!)<=2&&clearTacticalLane(s,enemy,victim!,enemy.id));
     if(hit){
      const braced=victim!.guardTick===s.tick;
      const raw=13+Math.min(18,s.floor*2)+Math.ceil(enemy.attack*.3);
      const damage=braced?Math.max(1,Math.ceil(raw*.33)):raw;
      victim!.hp=Math.max(0,victim!.hp-applyOathguardIntercept(s,victim!,damage));
      victim!.action=braced?'guard':'hurt';
      enemy.action=dist(enemy,victim!)===1?'attack':'cast';
      enemy.targetId=victim!.id;enemy.cooldown=2;
      push(s,'breach',braced?
       victim!.kind+' held the revenant shield-break · '+damage+' damage':
       'Revenant shield-break struck '+victim!.kind+' for '+damage+' damage');
     }else{
      enemy.action='guard';push(s,'evade','The revenant shield-break struck empty stone');
     }
     delete enemy.breachUntilTick;delete enemy.breachTargetId;
     delete enemy.breachX;delete enemy.breachZ;
     if(enemy.cooldown>0)enemy.cooldown--;
     continue;
    }
    if(s.tick%5===0&&enemy.cooldown===0){
     const prey=party.filter(u=>u.hp>0&&dist(enemy,u)>=1&&dist(enemy,u)<=2&&
      clearTacticalLane(s,enemy,u,enemy.id))
      .sort((a,b)=>Number(b.kind==='vanguard')-Number(a.kind==='vanguard')||
       a.hp/a.maxHp-b.hp/b.maxHp||a.id.localeCompare(b.id))[0];
     if(prey){
      enemy.breachUntilTick=s.tick+1;enemy.breachTargetId=prey.id;
      enemy.breachX=prey.x;enemy.breachZ=prey.z;
      enemy.action='guard';enemy.targetId=prey.id;
      s.intent='Fallen sentinel charging a shield-break against '+prey.kind;
      push(s,'telegraph','REVENANT BREACH — '+prey.kind.toUpperCase()+' MARKED · EVADE OR GUARD');
      continue;
     }
    }
   }
   // A real adjacent threat changes a caster's decision. Retreating uses a
   // legal empty walkable cell and may open a later ranged line of fire.
   // No teleport, hidden RNG, instant free attack or forced encounter result.
   // Shadow-caster duel: wind up in sight, lock the original legal impact
   // cell, let the party dodge/guard/interrupt, then resolve real HP damage.
   // The event, 3D floor tell and original audio use the same saved warning.
   if(enemy.kind==='cultist'){
    if(enemy.channelUntilTick===s.tick){
     const victim=party.find(u=>u.id===enemy.channelTargetId&&u.hp>0);
     const atMarkedCell=Boolean(victim&&victim.x===enemy.channelX&&victim.z===enemy.channelZ);
     const clear=Boolean(atMarkedCell&&clearTacticalLane(s,enemy,victim!,enemy.id));
     if(clear){
      const braced=victim!.guardTick===s.tick;
      const strength=8+Math.min(20,Math.ceil(s.floor*1.15));
      const dealt=braced?Math.max(1,Math.ceil(strength*.35)):strength;
      victim!.hp=Math.max(0,victim!.hp-applyOathguardIntercept(s,victim!,dealt));
      victim!.action=braced?'guard':'hurt';
      enemy.action='cast';enemy.targetId=victim!.id;
      push(s,braced?'block':'danger',braced?
       victim!.kind+' resisted the shadow hex · '+dealt+' damage':
       'Shadow hex struck '+victim!.kind+' for '+dealt+' damage');
     }else{
      enemy.action='cast';
      push(s,'evade','The cultist shadow hex struck empty stone');
     }
     delete enemy.channelUntilTick;delete enemy.channelTargetId;
     delete enemy.channelX;delete enemy.channelZ;
     if(enemy.cooldown>0)enemy.cooldown--;
     continue;
    }
    if(s.tick%4===0){
     const prey=party.filter(u=>u.hp>0&&dist(enemy,u)>=2&&dist(enemy,u)<=3&&
      clearTacticalLane(s,enemy,u,enemy.id))
      .sort((a,b)=>Number(b.kind==='mystic')-Number(a.kind==='mystic')||
       a.hp/a.maxHp-b.hp/b.maxHp||a.id.localeCompare(b.id))[0];
     if(prey){
      enemy.channelUntilTick=s.tick+1;enemy.channelTargetId=prey.id;
      enemy.channelX=prey.x;enemy.channelZ=prey.z;
      enemy.action='guard';enemy.targetId=prey.id;
      s.intent='Cultist ritual marking '+prey.kind+' for a shadow hex';
      push(s,'telegraph','SHADOW HEX — '+prey.kind.toUpperCase()+' MARKED · DODGE OR GUARD');
      if(enemy.cooldown>0)enemy.cooldown--;
      continue;
     }
    }
   }
   if(enemy.kind==='cultist'&&distance===1&&s.tick%3===0){
    const step=cultistRetreat(s,enemy,nearest);
    if(step){enemy.x=step.x;enemy.z=step.z;enemy.action='move';
     s.intent='Shadow caster disengaging to regain a spell lane';
     if(enemy.cooldown>0)enemy.cooldown--;continue}
   }
   if(distance<=1){if(enemy.cooldown===0){const braced=nearest.action==='guard'||nearest.guardTick===s.tick;const dealt=braced?Math.max(1,Math.ceil(enemy.attack*.4)):enemy.attack;nearest.hp=Math.max(0,nearest.hp-dealt);enemy.cooldown=2;enemy.action='attack';enemy.targetId=nearest.id;nearest.action=braced?'guard':'hurt';if(braced)push(s,'block',nearest.kind+' blocked '+(enemy.attack-dealt)+' melee damage');else push(s,'danger',enemy.kind+' hit '+nearest.kind+' for '+dealt)}}
   else if(distance<=(enemy.kind==='warden'&&bossPhase!=='SENTINEL'?7:5)&&
     (enemy.kind==='warden'&&bossPhase!=='SENTINEL'||s.tick%2===0)){
     // The final Warden must use each earned non-warning, non-recovery turn
     // to hunt; otherwise the faster squad kites his rare moves indefinitely.
     // One legal grid step, no special immunity, teleport or invented damage.
     const next=planTacticalStep(s,enemy,nearest,'engage');
     if(next){
      enemy.x=next.x;enemy.z=next.z;enemy.action='move';enemy.targetId=nearest.id;
      if(enemy.kind==='warden'&&bossPhase!=='SENTINEL'){
       s.intent='The Warden pursues '+nearest.kind+' between real ritual strikes';
       if(s.tick%9===4)push(s,'pursuit','WARDEN ADVANCES — '+nearest.kind.toUpperCase()+' UNDER PRESSURE');
      }
     }
    }
   if(enemy.cooldown>0)enemy.cooldown--;
  }
  if(warden&&warden.hp>0&&wardenPhase(warden)!==previousWardenPhase){
   const nextPhase=wardenPhase(warden);
   push(s,'phase','THE ETERNAL WARDEN · '+nextPhase+' PHASE');
   s.intent='The Warden transforms into '+nextPhase.toLowerCase()+' form';
   // Summon from actual free walkable cells, capped by the global unit bound.
   // The summon has its own future AI turns; it is not a cosmetic illusion.
   const slots=DIRS.flatMap(([dx,dz])=>[1,2].map(d=>({x:warden.x+dx*d,z:warden.z+dz*d})))
    .filter(p=>walkable(s.map,p.x,p.z)&&!s.units.some(u=>u.hp>0&&u.x===p.x&&u.z===p.z));
   if(slots.length&&s.units.length<18){
    const cell=slots[this.rng.nextInt('summon:'+s.floor+':'+s.run+':'+nextPhase,slots.length)];
    const kind:UnitKind=nextPhase==='ECLIPSE'?'cultist':'revenant',maxHp=38+s.floor*5;
    s.units.push({id:'summon-'+s.floor+'-'+nextPhase.toLowerCase(),kind,faction:'enemy',x:cell.x,z:cell.z,hp:maxHp,maxHp,attack:11+s.floor,cooldown:0,action:'cast',actionTick:s.tick});
    push(s,'summon','The Warden calls a '+(kind==='cultist'?'void spellcaster':'fallen sentinel')+' into the ritual chamber');
   }
  }
  for(const hero of s.units.filter(u=>u.faction==='party'&&u.hp>0)){
   const trap=s.traps.find(t=>t.active&&!t.disarmed&&t.x===hero.x&&t.z===hero.z);
   if(trap){const damage=8+Math.min(16,s.floor),kind=trap.kind==='ember'?'flame jets':'arcane rune';
    hero.hp=Math.max(0,hero.hp-damage);hero.action='hurt';trap.active=false;trap.cooldown=11;trap.triggers++;push(s,'trap',kind+' struck '+hero.kind+' for '+damage+' damage');
   }
   const i=s.relics.findIndex(p=>p.x===hero.x&&p.z===hero.z);
   if(i!==-1){s.relics.splice(i,1);s.gold+=35;hero.hp=Math.min(hero.maxHp,hero.hp+18);
    const healer=s.units.find(u=>u.kind==='mystic'&&u.hp>0&&Number.isSafeInteger(u.focus));
    if(healer)healer.focus=Math.min(healer.maxFocus??5,(healer.focus??0)+1);
    push(s,'loot',hero.kind+' discovered a healing relic · +35 gold · +1 healing focus')}
  }
  const alive=s.units.filter(u=>u.faction==='party'&&u.hp>0);
  if(!alive.length){s.phase='intermission';s.intermission=14;push(s,'defeat','All heroes have fallen. Preparing a new expedition.')}
  else if(!s.units.some(u=>u.faction==='enemy'&&u.hp>0)&&
   // The portal belongs to the living squad, not only its first member.
   // A ranger or mystic who genuinely steps onto the cleared exit opens it;
   // otherwise that ally permanently occupies the only tile the Vanguard
   // is permitted to enter. No free kills, fabricated teleport or RNG.
   alive.some(u=>dist(u,s.exit)===0)){
   const nextFloor=s.floor+1;const next=createFloor(this.seed,nextFloor,this.rng,s.run,s);
   const respite=planDungeonRespite(nextFloor);
   next.units.filter(u=>u.faction==='party').forEach(u=>u.hp=Math.min(u.maxHp,u.hp+respite));
   // A single between-floor choice uses only verified earned gold and actual
   // missing HP. Never purchase during combat or bypass a live guardian.
   const medicine=planExpeditionProvision(next);
   if(medicine){
    const patient=next.units.find(u=>u.id===medicine.recipientId)!;
    patient.hp+=medicine.heal;next.gold-=medicine.goldCost;
   }
   this.state=next;push(next,'floor','FLOOR '+nextFloor+' · '+next.theme);
   if(medicine)push(next,'provision','Expedition spent '+medicine.goldCost+
    ' earned gold on medical supplies for '+medicine.recipientId+
    ' · +'+medicine.heal+' HP');
  }
  assertDungeonState(this.state);return this.publicState();
 }
 publicState(){
  const s=this.state;
  const boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
  const strike=boss?planWardenStrike(s,boss):null;
  const bossWarning=strike?.warning&&s.units.some(u=>u.faction==='party'&&u.hp>0&&dist(u,boss!)<=5)?strike:null;
  return {version:DUNGEON_VERSION,rulesVersion:s.rulesVersion??1,tick:s.tick,run:s.run,floor:s.floor,theme:s.theme,phase:s.phase,bossPhase:wardenPhase(s.units.find(u=>u.kind==='warden')),guardianWard:wardenSealActive(s),cultistWarnings:s.units.filter(u=>u.kind==='cultist'&&u.hp>0&&u.channelUntilTick!==undefined&&u.channelUntilTick>s.tick).slice(0,6).map(u=>({sourceId:u.id,targetId:u.channelTargetId,x:u.channelX,z:u.channelZ,impactTick:u.channelUntilTick})),revenantWarnings:s.units.filter(u=>u.kind==='revenant'&&u.hp>0&&u.breachUntilTick!==undefined&&u.breachUntilTick>s.tick).slice(0,8).map(u=>({sourceId:u.id,targetId:u.breachTargetId,x:u.breachX,z:u.breachZ,impactTick:u.breachUntilTick})),bossWarning,bossRecovery:boss?planWardenRecovery(s,boss):null,defendersRemaining:s.units.filter(u=>u.faction==='enemy'&&u.kind!=='warden'&&u.hp>0).length,intermission:s.intermission,map:s.map,exit:s.exit,units:s.units.map(u=>({...u})),relics:s.relics.map(r=>({...r})),traps:s.traps.map(t=>({...t})),kills:s.kills,gold:s.gold,level:s.level,intent:s.intent,events:s.events.map(e=>({...e})),checksum:checksum({tick:s.tick,run:s.run,floor:s.floor,units:s.units,relics:s.relics,traps:s.traps,gold:s.gold,...(s.rulesVersion===2?{rulesVersion:2}:{})})};
 }
}
